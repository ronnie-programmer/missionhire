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

    if (!jobDescription) {
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
