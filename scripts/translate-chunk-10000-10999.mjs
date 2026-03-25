/**
 * Translate provider descriptions and review summaries to Arabic.
 * Processes indices 10000-10999 from providers-scraped.json.
 * Saves to scripts/arabic-chunks/ar-10000-10999.json
 * Format: { "10000": { descriptionAr: "...", reviewSummaryAr: ["..."] }, ... }
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// Load env
const envPath = join(ROOT, ".env.local");
if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim();
  }
}

const PROVIDERS_PATH = join(ROOT, "src/lib/providers-scraped.json");
const OUTPUT_PATH = join(ROOT, "scripts/arabic-chunks/ar-10000-10999.json");
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const MODEL = "gemini-2.5-flash";
const BATCH_SIZE = 8;
const DELAY_MS = 400;
const SAVE_EVERY = 50;

const START_IDX = 10000;
const END_IDX = 10999; // inclusive

const DESC_PROMPT = `Translate this UAE healthcare provider description to Arabic. Keep all proper nouns (facility names, area names, city names) in their original English form. Keep numbers, ratings, licence codes, phone numbers, and regulatory body names (DHA, DOH, MOHAP) in English. Return ONLY the Arabic text, no English.`;

const REVIEW_PROMPT = `Translate these UAE healthcare review summary points to Arabic. Keep all proper nouns (facility names, area names, city names) in their original English form. Keep numbers, ratings, licence codes, and regulatory body names (DHA, DOH, MOHAP) in English. Return the numbered list in Arabic, one per line, maintaining the same numbering. Return ONLY the Arabic translation, no English.`;

async function callGemini(prompt) {
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
        signal: AbortSignal.timeout(20000),
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

async function translateDescription(description) {
  const prompt = `${DESC_PROMPT}\n\n${description}`;
  return callGemini(prompt);
}

async function translateReviewSummary(points) {
  if (!points || points.length === 0) return null;
  const numbered = points.map((p, i) => `${i + 1}. ${p}`).join("\n");
  const prompt = `${REVIEW_PROMPT}\n\n${numbered}`;
  const result = await callGemini(prompt);
  if (!result) return null;

  const lines = result.split("\n").filter((l) => l.trim().length > 0);
  const parsed = [];
  for (const line of lines) {
    const match = line.match(/^[\d١٢٣٤٥٦٧٨٩٠]+[.\)]\s*(.+)/);
    if (match) {
      parsed.push(match[1].trim());
    } else {
      const stripped = line.replace(/^\s*[-•]\s*/, "").trim();
      if (stripped.length > 0) parsed.push(stripped);
    }
  }
  if (parsed.length === 0) return null;
  return parsed;
}

async function translateProvider(provider) {
  const results = {};

  if (provider.description && provider.description.trim().length > 10) {
    const arDesc = await translateDescription(provider.description);
    if (arDesc) results.descriptionAr = arDesc;
  }

  await new Promise((r) => setTimeout(r, 60));

  if (provider.reviewSummary && provider.reviewSummary.length > 0) {
    const arReview = await translateReviewSummary(provider.reviewSummary);
    if (arReview) results.reviewSummaryAr = arReview;
  }

  return results;
}

async function main() {
  if (!GEMINI_KEY) {
    console.error("ERROR: GEMINI_API_KEY not set in .env.local");
    process.exit(1);
  }

  console.log(`Loading providers...`);
  const providers = JSON.parse(readFileSync(PROVIDERS_PATH, "utf-8"));
  console.log(`Total providers: ${providers.length}`);

  const slice = providers.slice(START_IDX, END_IDX + 1);
  console.log(`Processing indices ${START_IDX} to ${END_IDX} (${slice.length} providers)`);

  // Load existing progress if any
  let output = {};
  if (existsSync(OUTPUT_PATH)) {
    try {
      output = JSON.parse(readFileSync(OUTPUT_PATH, "utf-8"));
      console.log(`Resuming: ${Object.keys(output).length} already done`);
    } catch (e) {
      console.log("Could not parse existing output, starting fresh");
      output = {};
    }
  }

  let translated = 0;
  let failed = 0;
  let saved = 0;

  // Build work list — skip already done
  const workItems = [];
  for (let i = 0; i < slice.length; i++) {
    const globalIdx = START_IDX + i;
    const key = String(globalIdx);
    if (!output[key]) {
      workItems.push({ provider: slice[i], globalIdx, key });
    }
  }
  console.log(`Need translation: ${workItems.length} (already done: ${slice.length - workItems.length})`);
  console.log("");

  for (let i = 0; i < workItems.length; i += BATCH_SIZE) {
    const batch = workItems.slice(i, i + BATCH_SIZE);

    await Promise.all(
      batch.map(async ({ provider, globalIdx, key }) => {
        try {
          const translations = await translateProvider(provider);

          if (translations.descriptionAr || translations.reviewSummaryAr) {
            output[key] = {};
            if (translations.descriptionAr) output[key].descriptionAr = translations.descriptionAr;
            if (translations.reviewSummaryAr) output[key].reviewSummaryAr = translations.reviewSummaryAr;
            translated++;
            process.stdout.write(
              `  [${globalIdx}] ${(provider.name || "?").slice(0, 35).padEnd(35)} desc=${!!translations.descriptionAr} review=${!!translations.reviewSummaryAr}\n`
            );
          } else {
            failed++;
            console.error(`  [${globalIdx}] FAILED: ${(provider.name || "?").slice(0, 40)}`);
          }
        } catch (e) {
          failed++;
          console.error(`  [${globalIdx}] EXCEPTION: ${e}`);
        }
      })
    );

    if (i + BATCH_SIZE < workItems.length) {
      await new Promise((r) => setTimeout(r, DELAY_MS));
    }

    const processed = Math.min(i + BATCH_SIZE, workItems.length);
    if (processed % 100 === 0 || processed === workItems.length) {
      const pct = ((processed / workItems.length) * 100).toFixed(1);
      console.log(
        `  --- Progress: ${processed}/${workItems.length} (${pct}%) | ok=${translated} fail=${failed} total_saved=${Object.keys(output).length} ---`
      );
    }

    if (translated - saved >= SAVE_EVERY) {
      writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));
      saved = translated;
      console.log(`  [SAVED] ${Object.keys(output).length} entries written`);
    }
  }

  // Final save
  writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));

  const totalKeys = Object.keys(output).length;
  console.log(`\n=== DONE ===`);
  console.log(`Translated this run: ${translated}`);
  console.log(`Failed this run:     ${failed}`);
  console.log(`Total entries in output: ${totalKeys} / 1000`);
  console.log(`Output saved to: ${OUTPUT_PATH}`);
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
