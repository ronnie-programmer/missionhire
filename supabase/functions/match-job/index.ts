/* supabase/functions/match-job/index.ts

   Supabase Edge Function that scores a specific job against a user's profile.
   Used by the MatchScore component in the EditJobModal "Match" tab.

   PROFILE → PROMPT SERIALIZATION:
   The userProfile object (camelCase, from the browser) is serialized into a
   plain text block for the prompt. Text prompts are more natural for Claude
   than raw JSON for this kind of qualitative analysis.
   profileLines.filter(Boolean) removes empty lines when optional fields are absent.

   GRACEFUL NO-PROFILE HANDLING:
   If userProfile is null (user hasn't set up their profile), the profile section
   of the prompt becomes "No profile provided — score based on job quality alone."
   This lets Claude return a meaningful quality score (is this a good job?)
   rather than failing or returning a useless 0.

   JD TRUNCATION:
   jobDescription.slice(0, 2000) prevents the prompt from exceeding token limits
   and keeps costs predictable. Most meaningful job description content is in the
   first 2000 characters; requirements and qualifications appear early.

   MODEL (claude-sonnet-4-6):
   Sonnet is used here (rather than Haiku) because this is a single, deep analysis
   — quality matters more than speed. The scout-jobs batch scoring uses Haiku to
   score many jobs cheaply; this single-job analysis can afford to use a better model.

   INPUT:  { jobDescription, company, role, userProfile? }
   OUTPUT: { result: { score, summary, matchingSkills, gaps, strengths, recommendation } }
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
    const { jobDescription, company, role, userProfile } = await req.json();

    if (!jobDescription || !jobDescription.trim()) {
      return new Response(
        JSON.stringify({ error: "jobDescription is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicKey) {
      return new Response(
        JSON.stringify({ error: "Anthropic API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const profileLines = userProfile ? [
      userProfile.targetRoles?.length ? `Target Roles: ${userProfile.targetRoles.join(", ")}` : "",
      userProfile.skills?.length ? `Skills: ${userProfile.skills.join(", ")}` : "",
      userProfile.experienceLevel ? `Experience Level: ${userProfile.experienceLevel}` : "",
      userProfile.resumeText ? `Background: ${userProfile.resumeText.slice(0, 600)}` : "",
    ].filter(Boolean).join("\n") : "No profile provided — score based on job quality alone.";

    const prompt = `You are an expert career advisor. Analyze how well a candidate matches this job.

Candidate Profile:
${profileLines}

Job: ${role || "Unknown"} at ${company || "Unknown"}

Job Description:
${jobDescription.slice(0, 2000)}

Return a JSON object:
{
  "score": 78,
  "summary": "2-sentence assessment of fit",
  "matchingSkills": ["skill1", "skill2"],
  "gaps": ["missing skill1", "needs more X experience"],
  "strengths": ["strength1", "strength2"],
  "recommendation": "Apply" | "Consider" | "Pass"
}

Return ONLY the raw JSON, no markdown.`;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      return new Response(
        JSON.stringify({ error: `Anthropic API error: ${error}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await res.json();
    const raw = data.content[0]?.text || "{}";

    let result;
    try {
      result = JSON.parse(raw);
    } catch {
      return new Response(
        JSON.stringify({ error: "Failed to parse AI response", raw }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
