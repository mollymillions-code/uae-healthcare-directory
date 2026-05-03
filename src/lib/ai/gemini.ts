import { GoogleGenerativeAI, type GenerativeModel } from "@google/generative-ai";
import type { NextRequest } from "next/server";

/**
 * Shared Gemini wiring for the Zavis AI tools.
 *
 * One source of truth for model name, key handling, system-prompt PDPL
 * boilerplate, per-IP rate limiting, and token-cap defaults — so the four
 * AI-backed tools (claim-decoder, whatsapp-templates, compliance-calendar,
 * intake-form) plus review-reply share the exact same guardrails.
 *
 * Usage:
 *
 *   import { generateJson, checkRateLimit, getClientIp, ZAVIS_PDPL_PROMPT } from "@/lib/ai/gemini";
 *
 *   export async function POST(req) {
 *     const ip = getClientIp(req);
 *     const rl = checkRateLimit("claim-decoder", ip);
 *     if (!rl.ok) return ...;
 *
 *     const body = await req.json();
 *     const result = await generateJson({
 *       systemPrompt: ZAVIS_PDPL_PROMPT + "\n\n" + TOOL_SYSTEM_PROMPT,
 *       userPrompt: ...,
 *     });
 *     return NextResponse.json(result);
 *   }
 */

// ──────────────────────────────────────────────────────────────────────────
// Model + token caps
// ──────────────────────────────────────────────────────────────────────────

/** Canonical Gemini text model used across the site. */
export const ZAVIS_GEMINI_MODEL = "gemini-3.1-flash-lite-preview";

/**
 * Default per-call output cap. Gemini 3.1 Flash-Lite is cheap (~$0.075
 * per 1M input tokens at 2026-05 pricing) but unbounded output is still a
 * footgun. Each tool can override but should not exceed 4096.
 */
export const DEFAULT_MAX_OUTPUT_TOKENS = 1500;

/** Max input length we'll accept from a free-tools client request. */
export const MAX_USER_INPUT_CHARS = 4000;

// ──────────────────────────────────────────────────────────────────────────
// PDPL system prompt — prepended to every Zavis AI tool prompt
// ──────────────────────────────────────────────────────────────────────────

export const ZAVIS_PDPL_PROMPT = `You are a Zavis AI assistant, the UAE healthcare-industry AI platform from Zavis (zavis.ai).

UAE PDPL (Personal Data Protection Law — Federal Decree-Law No. 45 of 2021) compliance — strict and non-negotiable for every output:

1. NEVER include patient names, MRN numbers, dates of birth, addresses, phone numbers, email addresses, ID numbers, or any combination of fields that could re-identify a patient — even if the user pastes them into the input. If the user input includes such PII, OMIT it entirely from your output and continue with the rest of the task.
2. NEVER include patient diagnoses, lab results, medication dosages, treatment specifics, or other Protected Health Information (PHI) tied to a person.
3. NEVER reference specific clinical-record numbers, claim numbers, or invoice numbers if they appear personally identifiable.
4. Discuss conditions / diagnoses / treatments at a general, educational level only — never about a specific patient.
5. NEVER produce content that could be misread as a clinical decision, prescription, or medical advice for an individual patient. Add a brief reminder at the end if the topic touches clinical practice: "This output is for clinic-operations support only and is not medical advice."

Style:
- Professional, warm, UAE-cultural-register-aware.
- For Arabic output: use Modern Standard Arabic accessible to all UAE residents — neutral-polite formality, not classical.
- Be specific and concrete. UAE clinic operators are time-poor and don't want fluff.
- When you don't know something, say so plainly. Don't invent regulator policy, fees, or codes.

Output format: strict JSON when the tool calls for structured output. No markdown fences, no commentary outside the JSON.`;

// ──────────────────────────────────────────────────────────────────────────
// Rate limiting (in-memory, per process)
// ──────────────────────────────────────────────────────────────────────────

interface Bucket {
  count: number;
  resetAt: number;
}

const RATE_BUCKETS: Map<string, Bucket> = new Map();

/**
 * Check rate limit for a (tool, IP) pair.
 * Default 5 calls per IP per hour per tool. Returns whether the request is
 * allowed and when the window resets.
 *
 * Note: per-process state. With PM2 cluster mode (2 workers) effective
 * limit is ~2× per IP. Acceptable at current scale; move to Redis if we
 * grow past one box.
 */
export function checkRateLimit(
  tool: string,
  ip: string,
  opts: { limit?: number; windowMs?: number } = {}
): { ok: boolean; resetAt: number; remaining: number } {
  const limit = opts.limit ?? 5;
  const windowMs = opts.windowMs ?? 60 * 60 * 1000;
  const now = Date.now();
  const key = `${tool}:${ip}`;
  const existing = RATE_BUCKETS.get(key);

  if (!existing || existing.resetAt < now) {
    RATE_BUCKETS.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, resetAt: now + windowMs, remaining: limit - 1 };
  }

  if (existing.count >= limit) {
    return { ok: false, resetAt: existing.resetAt, remaining: 0 };
  }

  existing.count += 1;
  return { ok: true, resetAt: existing.resetAt, remaining: limit - existing.count };
}

export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Generation helpers
// ──────────────────────────────────────────────────────────────────────────

let cachedClient: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  if (!cachedClient) {
    cachedClient = new GoogleGenerativeAI(key);
  }
  return cachedClient;
}

function getModel(systemPrompt: string): GenerativeModel | null {
  const client = getClient();
  if (!client) return null;
  return client.getGenerativeModel({
    model: ZAVIS_GEMINI_MODEL,
    systemInstruction: systemPrompt,
  });
}

export interface GenerateOptions {
  systemPrompt: string;
  userPrompt: string;
  /** Defaults to DEFAULT_MAX_OUTPUT_TOKENS. */
  maxOutputTokens?: number;
  /** Defaults to 0.7. */
  temperature?: number;
  /** Set to true to ask Gemini to return application/json. */
  jsonMode?: boolean;
}

/**
 * Run a Gemini text generation. Returns the raw text response.
 * Throws on failure — caller decides how to surface to user.
 */
export async function generateText(opts: GenerateOptions): Promise<string> {
  const model = getModel(opts.systemPrompt);
  if (!model) throw new Error("GEMINI_API_KEY not configured");

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: opts.userPrompt }] }],
    generationConfig: {
      temperature: opts.temperature ?? 0.7,
      maxOutputTokens: opts.maxOutputTokens ?? DEFAULT_MAX_OUTPUT_TOKENS,
      ...(opts.jsonMode ? { responseMimeType: "application/json" } : {}),
    },
  });

  return result.response.text();
}

/**
 * Run a Gemini generation with `responseMimeType: application/json`,
 * parse + return. Throws on parse failure.
 */
export async function generateJson<T = unknown>(
  opts: GenerateOptions
): Promise<T> {
  const text = await generateText({ ...opts, jsonMode: true });
  return JSON.parse(text) as T;
}

// ──────────────────────────────────────────────────────────────────────────
// Helpers shared by all tool API routes
// ──────────────────────────────────────────────────────────────────────────

export interface RateLimitResponse {
  error: string;
  retryAt: number;
}

/**
 * Standard "AI service not configured" response — used when GEMINI_API_KEY
 * is missing. Tool clients should fall back to their static behaviour.
 */
export function aiNotConfiguredResponse() {
  return {
    error: "AI service is not configured. Please use the manual lookup below.",
  };
}

export function rateLimitResponse(resetAt: number): RateLimitResponse {
  return {
    error: "Rate limit reached. Try again in an hour, or use the manual lookup below.",
    retryAt: resetAt,
  };
}

/**
 * Strip likely PHI from user input as a defensive layer (the system prompt
 * also instructs the model, but this gives us belt + suspenders).
 *
 * Replaces obvious patterns: long digit sequences (passport / ID / phone
 * numbers), emails. Does NOT try to be exhaustive — the system prompt
 * does the heavy lifting.
 */
export function stripObviousPii(text: string): string {
  return text
    .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, "[email]")
    .replace(/\b\d{9,}\b/g, "[id-number]")
    .replace(/\+?\d{1,3}[\s-]?\(?\d{1,4}\)?[\s-]?\d{3,4}[\s-]?\d{3,4}/g, "[phone]");
}
