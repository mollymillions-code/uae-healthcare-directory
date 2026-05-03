import { NextRequest, NextResponse } from "next/server";
import {
  generateJson,
  checkRateLimit,
  getClientIp,
  stripObviousPii,
  rateLimitResponse,
  aiNotConfiguredResponse,
  ZAVIS_PDPL_PROMPT,
  MAX_USER_INPUT_CHARS,
} from "@/lib/ai/gemini";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TOOL_PROMPT = `You are a UAE clinic-communications expert. The user will describe a patient-communication scenario in plain language. Generate a bilingual (EN + AR) WhatsApp message tailored to:

- the scenario (appointment reminder, missed appointment, follow-up, payment reminder, lab results ready, prescription refill, post-visit care, no-show recovery, etc.)
- the clinic's specialty (if specified — dental, dermatology, pediatrics, GP, etc.)
- the desired tone (warm/concise/firm)
- UAE cultural register

Output JSON with this exact shape:

{
  "scenarioInterpretation": "1 sentence — what scenario you understood from the user's description.",
  "messageEn": "Final WhatsApp message in English. 2-5 sentences. Polite, specific, includes a clear next-step. NO patient names, dates, diagnoses, or clinical details.",
  "messageAr": "Same message in Modern Standard Arabic. UAE-appropriate register — polite, neutral formality, accessible to all UAE residents.",
  "fillInBlanks": [
    "[Patient first name]",
    "[Appointment date]",
    "etc — every placeholder you used so the clinic knows what to fill in"
  ],
  "alternativeTone": "1 alternative-tone variant of messageEn (1-2 sentences) for variety — same scenario, different mood.",
  "complianceNote": "1 line on the PDPL / consent angle — e.g. 'Send only if patient has opted into WhatsApp comms during intake.'"
}

Style rules:
- Keep it action-oriented. UAE patients value brevity over flowery language.
- Always include the clinic name placeholder [Clinic name] at the end.
- For Arabic: don't translate brand names, common medical terms can be kept as-is when widely used (e.g., "vitamin D", "MRI"). Use right-to-left punctuation conventions correctly.
- If the user's request implies needing patient PII or medical details to compose the message, REPLACE those with placeholders like [Patient first name] or [Service type] — never invent or include actual data.

If the user's description is too vague (under 10 words or no scenario clear), return:
{ "error": "Describe the scenario in more detail — what's happening, what kind of patient, what action you want them to take." }`;

interface RequestBody {
  scenario: string;
  specialty?: string;
  tone?: "warm" | "concise" | "firm";
  language?: "en" | "ar" | "both";
}

interface GeneratorResponse {
  scenarioInterpretation?: string;
  messageEn?: string;
  messageAr?: string;
  fillInBlanks?: string[];
  alternativeTone?: string;
  complianceNote?: string;
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rl = checkRateLimit("whatsapp-templates", ip);
    if (!rl.ok) {
      return NextResponse.json(rateLimitResponse(rl.resetAt), { status: 429 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(aiNotConfiguredResponse(), { status: 503 });
    }

    const body = (await request.json().catch(() => null)) as RequestBody | null;
    if (!body || !body.scenario || body.scenario.trim().length < 10) {
      return NextResponse.json(
        { error: "Describe the scenario in at least 10 characters — what's happening and what action you want." },
        { status: 400 }
      );
    }

    const scenario = stripObviousPii(body.scenario.trim()).slice(0, MAX_USER_INPUT_CHARS);
    const specialty = body.specialty?.trim().slice(0, 80) || "general clinic";
    const tone = ["warm", "concise", "firm"].includes(body.tone ?? "")
      ? (body.tone as string)
      : "warm";

    const userPrompt = `Scenario the clinic needs a message for:
"""
${scenario}
"""
Clinic specialty: ${specialty}
Desired tone: ${tone}

Return ONLY the JSON object specified.`;

    const result = await generateJson<GeneratorResponse>({
      systemPrompt: ZAVIS_PDPL_PROMPT + "\n\n" + TOOL_PROMPT,
      userPrompt,
      temperature: 0.6,
      maxOutputTokens: 1200,
    });

    if (result.error || !result.messageEn) {
      return NextResponse.json(
        { error: result.error || "Could not generate a template for that scenario." },
        { status: 422 }
      );
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("[whatsapp-templates-ai] generation failed:", err);
    return NextResponse.json(
      { error: "AI generation failed. Try again in a moment, or pick a static template below." },
      { status: 500 }
    );
  }
}
