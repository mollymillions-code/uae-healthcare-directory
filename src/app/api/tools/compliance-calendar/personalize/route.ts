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

const TOOL_PROMPT = `You are a UAE healthcare-compliance expert. The user will describe their clinic's setup in plain language (specialty, emirate, headcount, recent hires, recent expansions, current pain). Produce a personalized 90-day compliance + operations action list.

Output JSON with this exact shape:

{
  "clinicSnapshot": "1-2 sentence summary of how you read the clinic.",
  "next30Days": [
    { "title": "...", "due": "Within X days", "category": "licensing|insurance|hr|clinical|data|other", "why": "Why this matters for THIS clinic specifically.", "action": "Concrete next step." }
  ],
  "next60Days": [ ... same shape ... ],
  "next90Days": [ ... same shape ... ],
  "watchOutFor": [
    "1-line UAE-specific gotcha that's likely to bite this clinic given their setup."
  ],
  "documentsToHaveOnFile": [
    "Document name — required by which regulator/insurer/compliance regime, and why."
  ]
}

Be SPECIFIC to the UAE — Dataflow timelines, regulator licence renewal cycles for the relevant emirate, insurer empanelment processes, JAWDA quality reporting (where applicable), Riayati/Malaffi onboarding timelines, FANR for radiology, MOHRE labour compliance, ESR / UBO filings if the clinic group is incorporated. Don't generic-blob this — tie every item to something the user actually said.

If the user's description is too vague (under 20 words or no concrete details), return:
{ "error": "Describe your clinic in more detail — emirate, specialty, headcount, recent changes, current concerns." }

End every actionable item under 25 words. Don't pad.`;

interface RequestBody {
  clinicDescription: string;
  emirate?: string;
}

interface PersonalizeResponse {
  clinicSnapshot?: string;
  next30Days?: Array<{
    title: string;
    due: string;
    category: string;
    why: string;
    action: string;
  }>;
  next60Days?: Array<{
    title: string;
    due: string;
    category: string;
    why: string;
    action: string;
  }>;
  next90Days?: Array<{
    title: string;
    due: string;
    category: string;
    why: string;
    action: string;
  }>;
  watchOutFor?: string[];
  documentsToHaveOnFile?: string[];
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rl = checkRateLimit("compliance-calendar", ip);
    if (!rl.ok) {
      return NextResponse.json(rateLimitResponse(rl.resetAt), { status: 429 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(aiNotConfiguredResponse(), { status: 503 });
    }

    const body = (await request.json().catch(() => null)) as RequestBody | null;
    if (!body || !body.clinicDescription || body.clinicDescription.trim().length < 20) {
      return NextResponse.json(
        { error: "Describe your clinic in at least 20 characters — emirate, specialty, size, recent changes." },
        { status: 400 }
      );
    }

    const description = stripObviousPii(body.clinicDescription.trim()).slice(0, MAX_USER_INPUT_CHARS);
    const emirate = body.emirate?.trim().slice(0, 40) || "";

    const userPrompt = `Clinic description from operator:
"""
${description}
"""
${emirate ? `Emirate: ${emirate}` : ""}

Return ONLY the JSON object specified. Tailor every item to what the operator described.`;

    const result = await generateJson<PersonalizeResponse>({
      systemPrompt: ZAVIS_PDPL_PROMPT + "\n\n" + TOOL_PROMPT,
      userPrompt,
      temperature: 0.5,
      maxOutputTokens: 2500,
    });

    if (result.error || !result.next30Days) {
      return NextResponse.json(
        { error: result.error || "Could not generate a personalized list. Try a more detailed description." },
        { status: 422 }
      );
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("[compliance-calendar-ai] generation failed:", err);
    return NextResponse.json(
      { error: "AI personalization failed. Try again, or browse the static deadlines below." },
      { status: 500 }
    );
  }
}
