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
    const { jobDescription } = await req.json();

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

    const prompt = `Analyze this job description and return a JSON object with exactly these fields:

{
  "requiredSkills": ["skill1", "skill2"],
  "niceToHaveSkills": ["skill1", "skill2"],
  "estimatedSalary": "e.g. $80,000 - $110,000 or Unknown",
  "experienceLevel": "Entry / Mid / Senior / Lead / Executive",
  "redFlags": ["flag1", "flag2"],
  "keyResponsibilities": ["responsibility1", "responsibility2"],
  "companyCultureHints": ["hint1", "hint2"],
  "applicationTips": ["tip1", "tip2"],
  "overallFit": "Brief 2-sentence assessment of what type of candidate this role is ideal for."
}

Return ONLY the raw JSON object. No markdown, no explanation, no code fences.

Job Description:
${jobDescription}`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
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

    if (!response.ok) {
      const error = await response.text();
      return new Response(
        JSON.stringify({ error: `Anthropic API error: ${error}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const rawText = data.content[0]?.text || "{}";

    let analysis;
    try {
      analysis = JSON.parse(rawText);
    } catch {
      return new Response(
        JSON.stringify({ error: "Failed to parse AI response", raw: rawText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ analysis }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
