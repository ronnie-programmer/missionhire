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
    const { jobDescription, company, role, userBackground } = await req.json();

    if (!jobDescription || !company || !role) {
      return new Response(
        JSON.stringify({ error: "jobDescription, company, and role are required" }),
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

    const systemPrompt = `You are a professional career coach and expert cover letter writer.
Write compelling, personalized cover letters that are concise (3-4 paragraphs), specific to the job,
and highlight the most relevant experience. Avoid clichés. Use a professional but human tone.
Write the letter body only, starting with "Dear Hiring Manager,".`;

    const userPrompt = `Write a cover letter for the following:

Company: ${company}
Role: ${role}
${userBackground ? `Applicant Background: ${userBackground}` : ""}

Job Description:
${jobDescription}

Write a compelling 3-4 paragraph cover letter body. Start with "Dear Hiring Manager," and end with "Sincerely,". Do not include the applicant's name or contact info.`;

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
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
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
    const coverLetter = data.content[0]?.text || "";

    return new Response(
      JSON.stringify({ coverLetter }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
