/* supabase/functions/scout-jobs/index.ts

   Supabase Edge Function that fetches live job listings from two external APIs
   and batch-scores them against the user's profile using Claude Haiku.

   ARCHITECTURE OVERVIEW:
   1. Parse search parameters from the request body.
   2. Fetch from Remotive (remote-focused job board, free API, no key needed).
   3. Fetch from The Muse (broader job types, free API, no key needed).
      - The Muse is only queried if remoteOnly is false OR Remotive returned < 8 results.
   4. If the user has a profile, send ALL jobs to Claude Haiku in ONE batch call.
   5. Return the scored, sorted jobs array.

   WHY BATCH SCORE IN ONE CLAUDE CALL?
   Scoring each job individually would mean N API calls to Claude — slow (serial
   latency) and expensive. Instead, all job summaries are serialized as a JSON array
   in a single prompt. Claude returns a JSON array of scores in the same order.
   One call, N results. This is the key architectural decision that makes the
   feature fast enough to be usable (typically 5–10s total).

   MODEL CHOICE (claude-haiku-4-5-20251001 for scoring):
   Haiku is the fastest and cheapest Claude model — ideal for batch operations
   where quality is less critical than throughput. The prompt's structured output
   format (JSON array) keeps Haiku's output deterministic enough to parse reliably.

   ABORT SIGNAL:
   AbortSignal.timeout(8000) cancels the external API fetch if it takes more than
   8 seconds. Without this, a slow or hung external API would block the function
   until Supabase's 30-second timeout, degrading UX for all users.

   HTML STRIPPING:
   Job descriptions from Remotive and The Muse contain HTML markup. The regex
   .replace(/<[^>]+>/g, '') strips tags before including the text in the prompt,
   which reduces token usage and avoids confusing Claude with raw HTML.

   ERROR RESILIENCE:
   Each external API fetch is wrapped in its own try/catch. If Remotive fails,
   the function continues with The Muse results. If The Muse also fails, the
   function returns an empty jobs array with a message rather than a 500 error.

   INPUT:  { query, location, remoteOnly, userProfile? }
   OUTPUT: { jobs: Array<{ id, title, company, location, remote, url, tags,
             salary, source, score, matchReasons, gaps, headline }> }
*/

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { query, location, remoteOnly, userProfile } = await req.json();

    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicKey) {
      return new Response(
        JSON.stringify({ error: "Anthropic API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const jobs: any[] = [];
    const searchTerm = query || "software engineer";

    // Fetch from Remotive (free, no API key, remote jobs).
    // AbortSignal.timeout(8000) cancels the fetch after 8s so a slow API
    // doesn't hold up the entire response. The catch block lets us continue
    // with The Muse results even if Remotive fails.
    try {
      const res = await fetch(
        `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(searchTerm)}&limit=15`,
        { signal: AbortSignal.timeout(8000) }
      );
      if (res.ok) {
        const data = await res.json();
        for (const j of (data.jobs || []).slice(0, 15)) {
          jobs.push({
            id: `remotive-${j.id}`,  // prefix prevents ID collision with Muse jobs
            title: j.title,
            company: j.company_name,
            location: j.candidate_required_location || "Remote",
            remote: true,
            url: j.url,
            tags: (j.tags || []).slice(0, 8),
            salary: j.salary || "",
            source: "Remotive",
            description: (j.description || "").replace(/<[^>]+>/g, "").slice(0, 600),
          });
        }
      }
    } catch (_) { /* continue without Remotive */ }

    // Fetch from The Muse (free, no API key, broader job types).
    // Skipped entirely if remoteOnly=true AND Remotive returned enough results (>=8).
    // The Muse API doesn't support keyword search natively — we fetch by location
    // and filter client-side by job title and category name.
    if (!remoteOnly || jobs.length < 8) {
      try {
        const museLocation = location ? `&location=${encodeURIComponent(location)}` : "";
        const res = await fetch(
          `https://www.themuse.com/api/public/jobs?page=0&descending=true${museLocation}`,
          { signal: AbortSignal.timeout(8000) }
        );
        if (res.ok) {
          const data = await res.json();
          const filtered = (data.results || [])
            .filter((j: any) => !query || j.name?.toLowerCase().includes(query.toLowerCase()) ||
              j.categories?.some((c: any) => c.name?.toLowerCase().includes(query.toLowerCase())))
            .slice(0, 10);
          for (const j of filtered) {
            jobs.push({
              id: `muse-${j.id}`,
              title: j.name,
              company: j.company?.name || "Unknown",
              location: j.locations?.[0]?.name || location || "Various",
              remote: j.locations?.some((l: any) => l.name?.toLowerCase().includes("remote")) || false,
              url: j.refs?.landing_page || "",
              tags: (j.categories || []).map((c: any) => c.name).slice(0, 6),
              salary: "",
              source: "The Muse",
              description: (j.contents || "").replace(/<[^>]+>/g, "").slice(0, 600),
            });
          }
        }
      } catch (_) { /* continue without The Muse */ }
    }

    if (jobs.length === 0) {
      return new Response(
        JSON.stringify({ jobs: [], message: "No jobs found. Try a broader search term." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // BATCH SCORING — the key architectural decision of this function.
    // All jobs are scored in a single Claude call (rather than N individual calls)
    // to keep latency and API costs manageable. See the file header for full explanation.
    //
    // Default scoredJobs has null score — shown as unscored if Claude call fails or
    // if the user has no profile. The UI in JobResultCard handles score === null gracefully.
    let scoredJobs = jobs.map((j) => ({ ...j, score: null, matchReasons: [], gaps: [], headline: "" }));

    // Only score if the user has at least some profile data to compare against.
    // An empty profile would produce meaningless scores — better to skip scoring.
    const hasProfile = userProfile && (
      (userProfile.skills?.length > 0) ||
      (userProfile.targetRoles?.length > 0) ||
      userProfile.resumeText
    );

    if (hasProfile) {
      // Serialize profile fields into plain text for the prompt.
      // .filter(Boolean) removes empty lines when optional fields are absent.
      const profileLines = [
        userProfile.targetRoles?.length ? `Target Roles: ${userProfile.targetRoles.join(", ")}` : "",
        userProfile.skills?.length ? `Skills: ${userProfile.skills.join(", ")}` : "",
        userProfile.experienceLevel ? `Experience Level: ${userProfile.experienceLevel}` : "",
        userProfile.remotePreference ? `Remote Preference: ${userProfile.remotePreference}` : "",
        userProfile.resumeText ? `Background: ${userProfile.resumeText.slice(0, 500)}` : "",
      ].filter(Boolean).join("\n");

      // Send only the fields Claude needs for scoring — not the full job objects.
      // id is the array index so we can match scores back to the original jobs array.
      // desc is truncated to 300 chars; the key signals (title, tags, remote) are more
      // important for scoring than reading the full description.
      const jobSummaries = jobs.map((j, i) => ({
        id: i,
        title: j.title,
        company: j.company,
        tags: j.tags,
        remote: j.remote,
        desc: j.description.slice(0, 300),
      }));

      const prompt = `You are an expert AI job matcher. Score each job 0-100 for this candidate based on profile fit.

Candidate:
${profileLines}

Jobs (JSON array):
${JSON.stringify(jobSummaries)}

Return a JSON array — one entry per job, same order:
[{"id":0,"score":82,"matchReasons":["Strong React match","Remote role"],"gaps":["No AWS mentioned"],"headline":"Good fit for frontend skills"}]

Only return the raw JSON array, no explanation.`;

      // Claude Haiku is used here for speed and cost efficiency.
      // max_tokens: 2048 is enough for scoring up to ~25 jobs with brief explanations.
      // If the Claude call fails for any reason, we fall through to returning the
      // unscored jobs (score: null) — graceful degradation over a hard failure.
      try {
        const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": anthropicKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 2048,
            messages: [{ role: "user", content: prompt }],
          }),
        });

        if (aiRes.ok) {
          const aiData = await aiRes.json();
          const raw = aiData.content[0]?.text || "[]";
          const scores = JSON.parse(raw);
          // Match each score entry back to its original job by array index.
          // scores.find() by id is used rather than direct indexing because
          // Claude might occasionally reorder or skip an entry.
          scoredJobs = jobs.map((j, i) => {
            const s = scores.find((x: any) => x.id === i) || {};
            return {
              ...j,
              score: s.score ?? null,
              matchReasons: s.matchReasons || [],
              gaps: s.gaps || [],
              headline: s.headline || "",
            };
          });
          // Sort by score descending so the best matches appear first.
          // ?? 0 treats unscored jobs as 0 (they sort to the bottom).
          scoredJobs.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
        }
      } catch (_) { /* return unscored jobs */ }
    }

    return new Response(
      JSON.stringify({ jobs: scoredJobs }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
