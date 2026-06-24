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

    // Fetch from Remotive (free, no API key, remote jobs)
    try {
      const res = await fetch(
        `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(searchTerm)}&limit=15`,
        { signal: AbortSignal.timeout(8000) }
      );
      if (res.ok) {
        const data = await res.json();
        for (const j of (data.jobs || []).slice(0, 15)) {
          jobs.push({
            id: `remotive-${j.id}`,
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

    // Fetch from The Muse (free, no API key, broader job types)
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

    // Batch score all jobs with one Claude call if profile exists
    let scoredJobs = jobs.map((j) => ({ ...j, score: null, matchReasons: [], gaps: [], headline: "" }));

    const hasProfile = userProfile && (
      (userProfile.skills?.length > 0) ||
      (userProfile.targetRoles?.length > 0) ||
      userProfile.resumeText
    );

    if (hasProfile) {
      const profileLines = [
        userProfile.targetRoles?.length ? `Target Roles: ${userProfile.targetRoles.join(", ")}` : "",
        userProfile.skills?.length ? `Skills: ${userProfile.skills.join(", ")}` : "",
        userProfile.experienceLevel ? `Experience Level: ${userProfile.experienceLevel}` : "",
        userProfile.remotePreference ? `Remote Preference: ${userProfile.remotePreference}` : "",
        userProfile.resumeText ? `Background: ${userProfile.resumeText.slice(0, 500)}` : "",
      ].filter(Boolean).join("\n");

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
