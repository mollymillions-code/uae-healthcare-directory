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

const TOOL_PROMPT = `You are a UAE clinic-intake-form expert. The user will describe their clinic in plain language. Produce a complete, bilingual (EN + AR), PDPL-compliant patient intake form tailored to that clinic's specialty, insurer mix, and patient demographics.

Output JSON with this exact shape:

{
  "formName": "Concise form name (e.g., 'Dental Intake — Primary Visit').",
  "formNameAr": "Arabic version of formName.",
  "introTextEn": "1-2 sentence introduction for the patient at the top of the form. Friendly, sets expectations.",
  "introTextAr": "Arabic version.",
  "sections": [
    {
      "id": "patient-info",
      "titleEn": "Patient information",
      "titleAr": "بيانات المريض",
      "questions": [
        {
          "id": "full-name",
          "labelEn": "Full name",
          "labelAr": "الاسم الكامل",
          "type": "text|email|phone|date|select|radio|checkbox|textarea|signature",
          "required": true,
          "placeholderEn": "Optional placeholder",
          "placeholderAr": "العربية",
          "options": ["Only for select/radio/checkbox — array of {valueEn, valueAr}"]
        }
      ]
    }
  ],
  "consentBlocks": [
    {
      "titleEn": "PDPL data-processing consent",
      "titleAr": "الموافقة على معالجة البيانات وفقًا لقانون حماية البيانات الشخصية",
      "bodyEn": "Plain-language consent text — what data is collected, why, who sees it, retention period. UAE PDPL Article 6 lawful-basis aware.",
      "bodyAr": "Arabic version.",
      "required": true
    }
  ],
  "regulatoryNotes": [
    "1-line note on which regulator's intake-form requirements this design satisfies."
  ],
  "tipsForClinic": [
    "1-line operational tip on rolling this out (e.g., 'Print double-sided to fit on one A4 page.')."
  ]
}

Section coverage to include where relevant:
- Patient information (name, DOB, gender, nationality, residency status)
- Contact (phone, email, preferred-language, preferred-channel)
- Emergency contact
- Insurance (insurer + plan + member ID + co-pay/deductible awareness)
- Medical history (relevant to specialty — don't bloat with irrelevant questions)
- Current medications + allergies (for specialties where it matters)
- Specialty-specific intake (e.g., for dental: last cleaning date, ortho history; for paeds: vaccination status, school, parent details; for OB-GYN: OB history, last menstrual period)
- Consents (PDPL, treatment, photography, telehealth — only those relevant)
- Signature block

Style:
- Use UAE-relevant question phrasing. Dropdown/radio options should reflect UAE realities (e.g., for "Insurer" include Daman, Thiqa, ADNIC, AXA, Cigna, MetLife, Bupa Global, etc.).
- For Arabic: Modern Standard Arabic, neutral-polite. RTL-friendly punctuation.
- Don't make every question required — required only for legally / clinically essential ones.
- Avoid asking for data the clinic doesn't actually need (data minimization is a PDPL principle).

If the user description is too vague (< 20 words), return:
{ "error": "Describe your clinic in more detail — specialty, patient mix, insurers accepted, anything specific to your intake needs." }`;

interface RequestBody {
  clinicDescription: string;
  specialty?: string;
}

interface IntakeResponse {
  formName?: string;
  formNameAr?: string;
  introTextEn?: string;
  introTextAr?: string;
  sections?: Array<{
    id: string;
    titleEn: string;
    titleAr: string;
    questions: Array<{
      id: string;
      labelEn: string;
      labelAr: string;
      type: string;
      required: boolean;
      placeholderEn?: string;
      placeholderAr?: string;
      options?: Array<{ valueEn: string; valueAr: string } | string>;
    }>;
  }>;
  consentBlocks?: Array<{
    titleEn: string;
    titleAr: string;
    bodyEn: string;
    bodyAr: string;
    required: boolean;
  }>;
  regulatoryNotes?: string[];
  tipsForClinic?: string[];
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rl = checkRateLimit("intake-form", ip);
    if (!rl.ok) {
      return NextResponse.json(rateLimitResponse(rl.resetAt), { status: 429 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(aiNotConfiguredResponse(), { status: 503 });
    }

    const body = (await request.json().catch(() => null)) as RequestBody | null;
    if (!body || !body.clinicDescription || body.clinicDescription.trim().length < 20) {
      return NextResponse.json(
        { error: "Describe your clinic in at least 20 characters — specialty, patient mix, anything specific to your intake needs." },
        { status: 400 }
      );
    }

    const description = stripObviousPii(body.clinicDescription.trim()).slice(0, MAX_USER_INPUT_CHARS);
    const specialty = body.specialty?.trim().slice(0, 80) || "";

    const userPrompt = `Clinic description:
"""
${description}
"""
${specialty ? `Primary specialty hint: ${specialty}` : ""}

Generate the bilingual intake form per the system instructions. Tailor every section and question to this clinic's actual needs.`;

    const result = await generateJson<IntakeResponse>({
      systemPrompt: ZAVIS_PDPL_PROMPT + "\n\n" + TOOL_PROMPT,
      userPrompt,
      temperature: 0.4,
      maxOutputTokens: 4000,
    });

    if (result.error || !result.sections || result.sections.length === 0) {
      return NextResponse.json(
        { error: result.error || "Could not generate an intake form. Try a more detailed description." },
        { status: 422 }
      );
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("[intake-form-ai] generation failed:", err);
    return NextResponse.json(
      { error: "AI generation failed. Try again, or use the manual section picker below." },
      { status: 500 }
    );
  }
}
