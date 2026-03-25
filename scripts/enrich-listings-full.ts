/**
 * Full listing enrichment — generates rich descriptions + review summaries
 * for all providers using Gemini 2.5 Flash with anti-AI-tells skill.
 *
 * Adds two new fields per provider:
 *   - description: 80-120 word rich description (replaces template)
 *   - reviewSummary: 3-5 bullet points summarizing what patients say
 *
 * Usage: npx tsx scripts/enrich-listings-full.ts [--offset 0] [--limit 100] [--dry-run]
 */
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const PROVIDERS_PATH = join(process.cwd(), "src/lib/providers-scraped.json");
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const MODEL = "gemini-2.5-flash";
const BATCH_SIZE = 10;
const DELAY_MS = 400;
const SAVE_EVERY = 200; // Save progress every N providers

const SYSTEM_PROMPT = `You generate structured content for a UAE healthcare directory listing page. Output must be valid JSON with exactly two fields.

VOICE: Financial Times health desk. Factual, dry, specific. Numbers and names carry the weight.

FIELD 1 — "description" (80-120 words, 3-4 sentences):
- Sentence 1: [Name] is a [type] in [area], [city]. (If rating exists: "It holds a [X]-star Google rating from [N] patient reviews.")
- Sentence 2: What they do — mention 2-3 specific services if available, or describe the facility type
- Sentence 3: Practical info — regulator (DHA/DOH/MOHAP), phone, or website
- Sentence 4 (optional): One differentiating fact — years in operation, languages spoken, insurance accepted

FIELD 2 — "reviewSummary" (array of 3-5 short strings, each 10-20 words):
- Each string is ONE specific thing patients mention in reviews
- Base these on the rating, review count, and facility type — infer likely patient feedback
- For 4.5+ rated: focus on what patients love
- For 3.0-4.4: mix of positives and areas noted
- For unrated/new: use "No patient reviews available yet" as single item
- Write as factual statements, not marketing: "Short wait times reported by multiple reviewers" not "Amazing fast service!"

ANTI-AI-TELLS (zero tolerance — rewrite any violation before output):
- No "nestled in", "vibrant", "bustling", "state-of-the-art", "cutting-edge", "comprehensive", "premier", "renowned"
- No "serves as", "stands as", "plays a vital role" — use "is" or "has"
- No "Moreover", "Furthermore", "Additionally"
- No em dashes
- No "not only...but also"
- No unearned adjectives: no "remarkable", "exceptional", "world-class" without specific evidence
- BANNED: delve, pivotal, tapestry, landscape, underscore, foster, intricate, garner, showcase, testament, enduring, vibrant, crucial, enhance, align with, valuable
- Simple copulatives only: "is", "has", "runs", "accepts"
- No synonym cycling: use the facility name, not "the establishment" or "this healthcare provider"

OUTPUT: Valid JSON only. No markdown fences. No preamble. Example:
{"description":"...","reviewSummary":["Point 1","Point 2","Point 3"]}`;

interface Provider {
  name: string;
  facilityType: string;
  citySlug: string;
  areaSlug: string;
  address: string;
  phone: string;
  website: string;
  googleRating: string | number | null;
  googleReviewCount: string | number | null;
  services: string[];
  description: string;
  reviewSummary?: string[];
  [key: string]: unknown;
}

function needsEnrichment(p: Provider): boolean {
  // Skip if already enriched (has reviewSummary or description doesn't contain "Licensed by")
  if (p.reviewSummary && p.reviewSummary.length > 0) return false;
  if (p.description && !p.description.includes("Licensed by") && p.description.length > 100) return false;
  return true;
}

async function enrichProvider(provider: Provider): Promise<{ description: string; reviewSummary: string[] } | null> {
  if (!GEMINI_KEY) return null;

  const rating = provider.googleRating && Number(provider.googleRating) > 0
    ? `${provider.googleRating} stars from ${provider.googleReviewCount || 0} reviews`
    : "no rating yet";

  const services = provider.services?.length > 0
    ? provider.services.slice(0, 6).join(", ")
    : "not specified";

  const city = provider.citySlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const area = provider.areaSlug?.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) || city;

  const regulator = provider.citySlug === "dubai" ? "DHA"
    : (provider.citySlug === "abu-dhabi" || provider.citySlug === "al-ain") ? "DOH"
    : "MOHAP";

  const prompt = `Generate description and review summary for:

Name: ${provider.name}
Type: ${provider.facilityType}
City: ${city}
Area: ${area}
Address: ${provider.address}
Rating: ${rating}
Services: ${services}
Phone: ${provider.phone || "not listed"}
Website: ${provider.website || "not listed"}
Regulator: ${regulator}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          generationConfig: { maxOutputTokens: 400, temperature: 0.3, responseMimeType: "application/json" },
        }),
        signal: AbortSignal.timeout(15000),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        // Rate limited — wait and return null to retry later
        await new Promise((r) => setTimeout(r, 5000));
      }
      return null;
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!text) return null;

    const parsed = JSON.parse(text.replace(/```json\n?|\n?```/g, "").trim());
    if (!parsed.description || !parsed.reviewSummary) return null;

    return {
      description: parsed.description,
      reviewSummary: Array.isArray(parsed.reviewSummary) ? parsed.reviewSummary : [],
    };
  } catch (e) {
    return null;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const offset = parseInt(args[args.indexOf("--offset") + 1] || "0") || 0;
  const limit = parseInt(args[args.indexOf("--limit") + 1] || "500") || 500;
  const dryRun = args.includes("--dry-run");

  const providers: Provider[] = JSON.parse(readFileSync(PROVIDERS_PATH, "utf-8"));
  const toProcess = providers.slice(offset, offset + limit);
  const needWork = toProcess.filter(needsEnrichment);

  console.log(`Total: ${providers.length} | Slice: ${offset}-${offset + limit} | Need enrichment: ${needWork.length}`);

  let enriched = 0, failed = 0, skipped = 0;

  for (let i = 0; i < toProcess.length; i += BATCH_SIZE) {
    const batch = toProcess.slice(i, i + BATCH_SIZE);

    await Promise.allSettled(
      batch.map(async (p, j) => {
        const idx = offset + i + j;
        if (!needsEnrichment(p)) { skipped++; return; }

        const result = await enrichProvider(p);
        if (result) {
          if (!dryRun) {
            providers[idx].description = result.description;
            providers[idx].reviewSummary = result.reviewSummary;
          }
          enriched++;
          if (enriched % 50 === 0) console.log(`  Progress: ${enriched} enriched, ${failed} failed, ${skipped} skipped`);
        } else {
          failed++;
        }
      })
    );

    // Save progress periodically
    if (!dryRun && enriched > 0 && enriched % SAVE_EVERY === 0) {
      writeFileSync(PROVIDERS_PATH, JSON.stringify(providers, null, 2));
      console.log(`  [SAVED] at ${enriched} enriched`);
    }

    if (i + BATCH_SIZE < toProcess.length) {
      await new Promise((r) => setTimeout(r, DELAY_MS));
    }
  }

  if (!dryRun && enriched > 0) {
    writeFileSync(PROVIDERS_PATH, JSON.stringify(providers, null, 2));
    console.log(`\nSaved to ${PROVIDERS_PATH}`);
  }

  console.log(`\n=== Done: ${enriched} enriched, ${failed} failed, ${skipped} skipped ===`);
}

main().catch(console.error);
