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

const TOOL_PROMPT = `You are a UAE healthcare-claims and revenue-cycle expert. The user is a UAE clinic operator who has had an insurance claim rejected. They will paste:

(a) the rejection narrative or reason text from the insurer / Daman / DHPO / Shafafiya / Riayati / NEXtCARE,
(b) optionally a rejection code,
(c) optionally the type of clinic (dental, GP, specialist).

Your job: produce a tailored, UAE-specific resubmission strategy. Output JSON with this exact shape:

{
  "rootCause": "1-2 sentences on the actual underlying cause behind this rejection — go beyond the surface code.",
  "uaeContext": "1-2 sentences on the UAE-specific regulatory or insurer-policy nuance the clinic should know.",
  "resubmissionSteps": [
    "Step 1 — specific, concrete action.",
    "Step 2 — ...",
    "Step 3 — ..."
  ],
  "documentsNeeded": [
    "Document 1 — exact name and where to obtain.",
    "Document 2 — ..."
  ],
  "draftEmailEn": "A 3-paragraph draft resubmission email to the insurer (English). Subject line first, then body. Professional, factual, references the original claim and explains what is being corrected. NO patient identifiers.",
  "draftEmailAr": "Same email translated to Modern Standard Arabic suitable for UAE insurer communications. Same structure.",
  "preventionTip": "1 sentence on how to avoid this rejection class going forward."
}

Be SPECIFIC about UAE realities — DHPO codes, Shafafiya pre-auth requirements, Daman's package rules, NEXtCARE's tier system, etc. — but only mention regulators or insurers that are clearly relevant. Don't add a generic disclaimer about consulting a legal/compliance professional unless the case truly needs one.

If the user's input is unclear, malformed, or clearly not a rejection narrative, return:
{ "error": "Could not interpret as a rejection narrative. Try pasting the full insurer reason text." }`;

interface RequestBody {
  rejectionText: string;
  rejectionCode?: string;
  clinicType?: string;
}

interface AnalyzerResponse {
  rootCause?: string;
  uaeContext?: string;
  resubmissionSteps?: string[];
  documentsNeeded?: string[];
  draftEmailEn?: string;
  draftEmailAr?: string;
  preventionTip?: string;
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rl = checkRateLimit("claim-decoder", ip);
    if (!rl.ok) {
      return NextResponse.json(rateLimitResponse(rl.resetAt), { status: 429 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(aiNotConfiguredResponse(), { status: 503 });
    }

    const body = (await request.json().catch(() => null)) as RequestBody | null;
    if (!body || !body.rejectionText) {
      return NextResponse.json(
        { error: "Paste the insurer's rejection text to continue." },
        { status: 400 }
      );
    }

    const rejectionText = stripObviousPii(body.rejectionText.trim()).slice(0, MAX_USER_INPUT_CHARS);
    if (rejectionText.length < 20) {
      return NextResponse.json(
        { error: "Rejection text is too short — paste the full insurer reason." },
        { status: 400 }
      );
    }

    const userPrompt = `Insurer rejection narrative:
"""
${rejectionText}
"""
${body.rejectionCode ? `Rejection code: ${body.rejectionCode.trim().slice(0, 80)}` : "No specific code provided."}
${body.clinicType ? `Clinic type: ${body.clinicType.trim().slice(0, 80)}` : ""}

Return ONLY the JSON object specified in the system instructions.`;

    const result = await generateJson<AnalyzerResponse>({
      systemPrompt: ZAVIS_PDPL_PROMPT + "\n\n" + TOOL_PROMPT,
      userPrompt,
      temperature: 0.4,
      maxOutputTokens: 1500,
    });

    if (result.error || !result.rootCause) {
      return NextResponse.json(
        { error: result.error || "Could not analyze this rejection. Try a longer or clearer input." },
        { status: 422 }
      );
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("[claim-decoder-ai] generation failed:", err);
    return NextResponse.json(
      { error: "AI analysis failed. Try again in a moment, or use the manual code lookup." },
      { status: 500 }
    );
  }
}
