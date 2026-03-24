/**
 * Translate provider descriptions and review summaries to Arabic using Gemini 2.5 Flash.
 *
 * Adds `descriptionAr` and `reviewSummaryAr` fields to each provider in providers-scraped.json.
 * Keeps all proper nouns (facility names, area names, city names) in English.
 * Numbers and ratings are preserved as-is.
 *
 * Usage:
 *   npx tsx scripts/translate-to-arabic.ts [--offset 0] [--limit 12519]
 */
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const PROVIDERS_PATH = join(process.cwd(), "src/lib/providers-scraped.json");
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const MODEL = "gemini-2.5-flash";
const BATCH_SIZE = 10;   // Concurrent API requests
const DELAY_MS = 300;    // Milliseconds between batches
const SAVE_EVERY = 200;  // Save progress every N providers processed

const DESC_PROMPT = `Translate this UAE healthcare provider description to Arabic. Keep all proper nouns (facility names, area names, city names) in their original English form. Keep numbers and ratings as-is. Return ONLY the Arabic text, no English.`;

const REVIEW_PROMPT = `Translate these UAE healthcare review summary points to Arabic. Keep all proper nouns (facility names, area names, city names) in their original English form. Keep numbers and ratings as-is. Return the numbered list in Arabic, one per line, maintaining the same numbering. Return ONLY the Arabic translation, no English.`;

interface Provider {
  name: string;
  description?: string;
  reviewSummary?: string[];
  descriptionAr?: string;
  reviewSummaryAr?: string[];
  [key: string]: unknown;
}

async function callGemini(prompt: string): Promise<string | null> {
  if (!GEMINI_KEY) {
    console.error("GEMINI_API_KEY not set");
    return null;
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: 2048,
            temperature: 0.1,
          },
        }),
        signal: AbortSignal.timeout(15000),
      }
    );

    if (!response.ok) {
      const body = await response.text();
      console.error(`  [HTTP ${response.status}] ${body.slice(0, 200)}`);
      return null;
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!text || text.length < 5) return null;
    return text;
  } catch (e) {
    console.error(`  [ERR] ${e}`);
    return null;
  }
}

async function translateDescription(description: string): Promise<string | null> {
  const prompt = `${DESC_PROMPT}\n\n${description}`;
  return callGemini(prompt);
}

async function translateReviewSummary(points: string[]): Promise<string[] | null> {
  if (!points || points.length === 0) return null;

  // Format as numbered list
  const numbered = points.map((p, i) => `${i + 1}. ${p}`).join("\n");
  const prompt = `${REVIEW_PROMPT}\n\n${numbered}`;

  const result = await callGemini(prompt);
  if (!result) return null;

  // Parse numbered list back into array
  const lines = result.split("\n").filter((l) => l.trim().length > 0);
  const parsed: string[] = [];

  for (const line of lines) {
    // Match "1. text", "١. text", or just strip leading number/dot
    const match = line.match(/^[\d١٢٣٤٥٦٧٨٩٠]+[.\)]\s*(.+)/);
    if (match) {
      parsed.push(match[1].trim());
    } else {
      // If no number prefix, just use the line as-is (fallback)
      const stripped = line.replace(/^\s*[-•]\s*/, "").trim();
      if (stripped.length > 0) parsed.push(stripped);
    }
  }

  // Only return if we got a reasonable number of translations
  if (parsed.length === 0) return null;
  return parsed;
}

async function translateProvider(provider: Provider, idx: number): Promise<{ descriptionAr?: string; reviewSummaryAr?: string[] }> {
  const results: { descriptionAr?: string; reviewSummaryAr?: string[] } = {};

  // Translate description
  if (provider.description && provider.description.trim().length > 10) {
    const arDesc = await translateDescription(provider.description);
    if (arDesc) {
      results.descriptionAr = arDesc;
    }
  }

  // Small delay between desc and reviewSummary calls for same provider
  await new Promise((r) => setTimeout(r, 50));

  // Translate review summary
  if (provider.reviewSummary && provider.reviewSummary.length > 0) {
    const arReview = await translateReviewSummary(provider.reviewSummary);
    if (arReview) {
      results.reviewSummaryAr = arReview;
    }
  }

  return results;
}

async function main() {
  const args = process.argv.slice(2);
  const offset = parseInt(
    args.find((a) => a.startsWith("--offset="))?.split("=")[1] ||
    args[args.indexOf("--offset") + 1] ||
    "0"
  ) || 0;
  const limit = parseInt(
    args.find((a) => a.startsWith("--limit="))?.split("=")[1] ||
    args[args.indexOf("--limit") + 1] ||
    "100"
  ) || 100;

  if (!GEMINI_KEY) {
    console.error("ERROR: GEMINI_API_KEY is not set in .env.local");
    process.exit(1);
  }

  console.log(`Loading providers from ${PROVIDERS_PATH}...`);
  const providers: Provider[] = JSON.parse(readFileSync(PROVIDERS_PATH, "utf-8"));
  console.log(`Total providers: ${providers.length}`);

  const alreadyDone = providers.filter((p) => p.descriptionAr).length;
  console.log(`Already translated: ${alreadyDone}`);
  console.log(`Processing: offset=${offset}, limit=${limit}`);
  console.log(`Batch size: ${BATCH_SIZE}, delay: ${DELAY_MS}ms, save every: ${SAVE_EVERY}`);
  console.log("");

  const slice = providers.slice(offset, offset + limit);
  // Filter to only those that need translation
  const toProcess = slice
    .map((p, localIdx) => ({ provider: p, globalIdx: offset + localIdx }))
    .filter(({ provider }) => !provider.descriptionAr);

  console.log(`Need translation: ${toProcess.length} out of ${slice.length} in range`);
  console.log("");

  let translated = 0;
  let failed = 0;
  let saved = 0;

  for (let i = 0; i < toProcess.length; i += BATCH_SIZE) {
    const batch = toProcess.slice(i, i + BATCH_SIZE);

    const results = await Promise.allSettled(
      batch.map(async ({ provider, globalIdx }) => {
        const translations = await translateProvider(provider, globalIdx);

        if (translations.descriptionAr) {
          providers[globalIdx].descriptionAr = translations.descriptionAr;
        }
        if (translations.reviewSummaryAr) {
          providers[globalIdx].reviewSummaryAr = translations.reviewSummaryAr;
        }

        if (translations.descriptionAr || translations.reviewSummaryAr) {
          translated++;
          process.stdout.write(
            `  [${globalIdx}] ${provider.name.slice(0, 35).padEnd(35)} desc=${!!translations.descriptionAr} review=${!!translations.reviewSummaryAr}\n`
          );
        } else {
          failed++;
          console.error(`  [${globalIdx}] FAILED: ${provider.name.slice(0, 40)}`);
        }
      })
    );

    // Check for rejected promises (shouldn't happen with try/catch, but safety net)
    for (const r of results) {
      if (r.status === "rejected") {
        console.error("  [REJECTED]", r.reason);
        failed++;
      }
    }

    // Rate-limit between batches
    if (i + BATCH_SIZE < toProcess.length) {
      await new Promise((r) => setTimeout(r, DELAY_MS));
    }

    // Progress report every 100 processed
    const processed = Math.min(i + BATCH_SIZE, toProcess.length);
    if (processed % 100 === 0 || processed === toProcess.length) {
      const pct = ((processed / toProcess.length) * 100).toFixed(1);
      console.log(`  --- Progress: ${processed}/${toProcess.length} (${pct}%) | translated=${translated} failed=${failed} ---`);
    }

    // Save progress every SAVE_EVERY providers
    if (translated - saved >= SAVE_EVERY) {
      writeFileSync(PROVIDERS_PATH, JSON.stringify(providers, null, 2));
      saved = translated;
      console.log(`  [SAVED] ${translated} translations written to disk`);
    }
  }

  // Final save
  writeFileSync(PROVIDERS_PATH, JSON.stringify(providers, null, 2));
  console.log(`\n[FINAL SAVE] Written to ${PROVIDERS_PATH}`);

  const totalAr = providers.filter((p) => p.descriptionAr).length;
  const totalReviewAr = providers.filter((p) => p.reviewSummaryAr).length;
  console.log(`\n=== DONE ===`);
  console.log(`Translated this run: ${translated}`);
  console.log(`Failed this run:     ${failed}`);
  console.log(`Total with descriptionAr:   ${totalAr} / ${providers.length}`);
  console.log(`Total with reviewSummaryAr: ${totalReviewAr} / ${providers.length}`);
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
