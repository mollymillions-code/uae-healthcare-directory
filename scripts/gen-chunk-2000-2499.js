/**
 * Translate provider descriptions and reviewSummary to Arabic for indices 2000-2499.
 * Output: scripts/arabic-chunks/ar-2000-2499.json
 * Format: { "2000": { descriptionAr: "...", reviewSummaryAr: ["...", ...] }, ... }
 *
 * Rules:
 *  - Keep facility names, area names, city names in English
 *  - Keep numbers, ratings, DHA/DOH/MOHAP in English
 *  - Process ALL 500 providers
 */

const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: ".env.local" });

const PROVIDERS_PATH = path.join(process.cwd(), "src/lib/providers-scraped.json");
const OUTPUT_PATH = path.join(process.cwd(), "scripts/arabic-chunks/ar-2000-2499.json");
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const MODEL = "gemini-2.5-flash";
const BATCH_SIZE = 10;
const DELAY_MS = 300;
const START = 2000;
const END = 2499; // inclusive

const DESC_PROMPT = `Translate this UAE healthcare provider description to Arabic. Keep all proper nouns (facility names, area names, city names) in their original English form. Keep numbers, ratings, DHA, DOH, MOHAP as-is. Return ONLY the Arabic text, no English.`;

const REVIEW_PROMPT = `Translate these UAE healthcare review summary points to Arabic. Keep all proper nouns (facility names, area names, city names) in their original English form. Keep numbers, ratings, DHA, DOH, MOHAP as-is. Return the numbered list in Arabic, one per line, maintaining the same numbering. Return ONLY the Arabic translation, no English.`;

async function callGemini(prompt) {
  if (!GEMINI_KEY) {
    console.error("GEMINI_API_KEY not set");
    return null;
  }

  for (let attempt = 1; attempt <= 3; attempt++) {
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

      if (response.status === 429 || response.status === 503) {
        const wait = attempt * 2000;
        console.error(`  [HTTP ${response.status}] rate limit, waiting ${wait}ms (attempt ${attempt})`);
        await new Promise((r) => setTimeout(r, wait));
        continue;
      }

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
      if (attempt < 3) {
        await new Promise((r) => setTimeout(r, 1000 * attempt));
        continue;
      }
      console.error(`  [ERR] ${e}`);
      return null;
    }
  }
  return null;
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

  await new Promise((r) => setTimeout(r, 50));

  if (provider.reviewSummary && provider.reviewSummary.length > 0) {
    const arReview = await translateReviewSummary(provider.reviewSummary);
    if (arReview) results.reviewSummaryAr = arReview;
  }

  return results;
}

async function main() {
  if (!GEMINI_KEY) {
    console.error("ERROR: GEMINI_API_KEY is not set in .env.local");
    process.exit(1);
  }

  console.log(`Loading providers from ${PROVIDERS_PATH}...`);
  const providers = JSON.parse(fs.readFileSync(PROVIDERS_PATH, "utf-8"));
  console.log(`Total providers: ${providers.length}`);

  const slice = providers.slice(START, END + 1); // indices 2000-2499 inclusive = 500 providers
  console.log(`Processing indices ${START}–${END} (${slice.length} providers)`);
  console.log(`Batch size: ${BATCH_SIZE}, delay: ${DELAY_MS}ms\n`);

  // Load existing output if present (for resuming)
  let output = {};
  if (fs.existsSync(OUTPUT_PATH)) {
    try {
      output = JSON.parse(fs.readFileSync(OUTPUT_PATH, "utf-8"));
      console.log(`Resuming: ${Object.keys(output).length} already done\n`);
    } catch {
      output = {};
    }
  }

  const toProcess = slice
    .map((p, localIdx) => ({ provider: p, globalIdx: START + localIdx }))
    .filter(({ globalIdx }) => !output[String(globalIdx)]);

  console.log(`Need translation: ${toProcess.length} out of ${slice.length}\n`);

  let translated = 0;
  let failed = 0;

  for (let i = 0; i < toProcess.length; i += BATCH_SIZE) {
    const batch = toProcess.slice(i, i + BATCH_SIZE);

    await Promise.allSettled(
      batch.map(async ({ provider, globalIdx }) => {
        const translations = await translateProvider(provider);

        if (translations.descriptionAr || translations.reviewSummaryAr) {
          output[String(globalIdx)] = {};
          if (translations.descriptionAr) output[String(globalIdx)].descriptionAr = translations.descriptionAr;
          if (translations.reviewSummaryAr) output[String(globalIdx)].reviewSummaryAr = translations.reviewSummaryAr;
          translated++;
          process.stdout.write(
            `  [${globalIdx}] ${(provider.name || "").slice(0, 35).padEnd(35)} desc=${!!translations.descriptionAr} review=${!!translations.reviewSummaryAr}\n`
          );
        } else {
          // Still record entry with empty fields so we know it was attempted
          output[String(globalIdx)] = { descriptionAr: "", reviewSummaryAr: [] };
          failed++;
          console.error(`  [${globalIdx}] FAILED: ${(provider.name || "").slice(0, 40)}`);
        }
      })
    );

    // Save progress every batch
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));

    if (i + BATCH_SIZE < toProcess.length) {
      await new Promise((r) => setTimeout(r, DELAY_MS));
    }

    const processed = Math.min(i + BATCH_SIZE, toProcess.length);
    if (processed % 50 === 0 || processed === toProcess.length) {
      const pct = ((processed / toProcess.length) * 100).toFixed(1);
      console.log(`  --- Progress: ${processed}/${toProcess.length} (${pct}%) | ok=${translated} failed=${failed} ---`);
    }
  }

  // Final save
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));

  const total = Object.keys(output).length;
  const withDesc = Object.values(output).filter((v) => v.descriptionAr).length;
  const withReview = Object.values(output).filter((v) => v.reviewSummaryAr && v.reviewSummaryAr.length > 0).length;

  console.log(`\n=== DONE ===`);
  console.log(`Total entries in output: ${total}`);
  console.log(`With descriptionAr:      ${withDesc}`);
  console.log(`With reviewSummaryAr:    ${withReview}`);
  console.log(`Failed this run:         ${failed}`);
  console.log(`Output: ${OUTPUT_PATH}`);
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
