/* supabase/functions/generate-cover-letter/index.ts

   Supabase Edge Function that generates a tailored cover letter using Claude.

   SYSTEM vs. USER PROMPT:
   This function uses Claude's two-field prompt structure:
     system  — sets persistent persona and output rules ("be a career coach, 3-4 paragraphs...")
     messages — provides the job-specific input for this particular call

   Separating them is best practice because:
   1. The system prompt is cached by Anthropic's API across calls, reducing latency.
   2. It keeps the AI's "personality" stable regardless of the job description content.
   3. The user message stays focused purely on the data (company, role, JD, background).

   INPUT:
     jobDescription — the full job posting text (required)
     company        — company name (required, used in prompt context)
     role           — role title (required, used in prompt context)
     userBackground — optional resume summary; improves letter personalization

   OUTPUT:
     { coverLetter: string } — the letter body starting with "Dear Hiring Manager,"

   The letter deliberately omits the applicant's name and contact info because
   those are filled in by the user when they paste the letter into their application.

   CORS and error handling follow the same pattern as analyze-job/index.ts.
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
