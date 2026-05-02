import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Lightweight in-memory rate limit: 5 generations per hour per IP.
const ipBuckets = new Map<string, { count: number; resetAt: number }>();
const LIMIT = 5;
const WINDOW_MS = 60 * 60 * 1000;

function checkRateLimit(ip: string): { ok: boolean; resetAt: number } {
  const now = Date.now();
  const existing = ipBuckets.get(ip);
  if (!existing || existing.resetAt < now) {
    ipBuckets.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true, resetAt: now + WINDOW_MS };
  }
  if (existing.count >= LIMIT) {
    return { ok: false, resetAt: existing.resetAt };
  }
  existing.count++;
  return { ok: true, resetAt: existing.resetAt };
}

const SYSTEM_PROMPT = `You are a UAE-clinic communications assistant generating Google Maps review replies. Strict rules:

CRITICAL — UAE PDPL (Personal Data Protection Law) compliance:
1. NEVER disclose patient diagnoses, conditions, treatments, medications, lab results, or any clinical information in a reply.
2. NEVER confirm or deny that the reviewer is a patient.
3. NEVER reference specific dates of visits, appointment times, or interactions with named staff.
4. NEVER include personally-identifiable information about the reviewer or other patients.
5. NEVER mention insurance details, billing amounts, or payment status.

What you CAN do:
- Thank the reviewer for feedback.
- Offer to discuss the matter privately via the clinic's official channel (phone, email, in-person).
- Acknowledge concerns at a general, abstract level ("we take feedback seriously", "your experience matters").
- Highlight clinic values (care quality, patient safety, professionalism) without referencing the specific case.
- For positive reviews, express gratitude and warmth.
- Apologise generally for negative experiences without admitting specific clinical or operational fault.

Tone:
- Professional, warm, human.
- Match the formality of the input review.
- For Arabic replies: use neutral-polite formality suitable for UAE patients. Avoid overly formal classical Arabic — use Modern Standard Arabic accessible to all UAE residents.

Output format: Return EXACTLY 3 reply variants in JSON. Each variant is bilingual (English + Arabic). Structure:

{
  "variants": [
    { "tone": "empathetic", "en": "...", "ar": "..." },
    { "tone": "grateful", "en": "...", "ar": "..." },
    { "tone": "concise", "en": "...", "ar": "..." }
  ]
}

Each reply should be 2-4 sentences in English (and the AR equivalent). Sign-off as the clinic — use "the {clinic_name} team" if the user provided a clinic name, otherwise just "the team".

If the input review contains anything that requires emergency intervention (allegations of harm, threats of legal action, mention of medical injury), include in your reply an offer to speak by phone immediately.`;

interface RequestBody {
  reviewText: string;
  rating: number;
  specialty?: string;
  clinicName?: string;
  tone?: "default" | "formal" | "friendly";
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    const rl = checkRateLimit(ip);
    if (!rl.ok) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded. Try again in an hour.",
          retryAt: rl.resetAt,
        },
        { status: 429 }
      );
    }

    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      return NextResponse.json(
        { error: "AI service not configured. Try again later." },
        { status: 503 }
      );
    }

    const body = (await request.json()) as RequestBody;
    if (!body.reviewText || body.reviewText.length < 5 || body.reviewText.length > 2000) {
      return NextResponse.json(
        { error: "Review text must be 5–2000 characters." },
        { status: 400 }
      );
    }

    const userMsg = `Review text: """${body.reviewText}"""
Star rating: ${body.rating} / 5
${body.specialty ? `Clinic specialty: ${body.specialty}` : ""}
${body.clinicName ? `Clinic name: ${body.clinicName}` : ""}
Preferred tone: ${body.tone || "default"}

Generate the 3 reply variants per the rules above. Output ONLY the JSON object, nothing before or after.`;

    // Match the model name used elsewhere in the project
    // (src/lib/intelligence/automation/summarize.ts) for consistency.
    // The previous `gemini-2.0-flash-exp` was deprecated by Google.
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({
      model: "gemini-3.1-flash-lite-preview",
      systemInstruction: SYSTEM_PROMPT,
    });

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: userMsg }] }],
      generationConfig: {
        temperature: 0.7,
        responseMimeType: "application/json",
      },
    });

    const text = result.response.text();
    let parsed: { variants: { tone: string; en: string; ar: string }[] };
    try {
      parsed = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { error: "AI returned a malformed response. Try again." },
        { status: 502 }
      );
    }

    if (!parsed.variants || !Array.isArray(parsed.variants) || parsed.variants.length === 0) {
      return NextResponse.json(
        { error: "AI returned no variants. Try again." },
        { status: 502 }
      );
    }

    return NextResponse.json({ variants: parsed.variants });
  } catch (err) {
    console.error("[review-reply] generation failed:", err);
    return NextResponse.json(
      { error: "Could not generate reply. Try again." },
      { status: 500 }
    );
  }
}
