/**
 * Translate provider descriptions and review summaries (indices 1500-1999) to Arabic.
 * Saves to scripts/arabic-chunks/ar-1500-1999.json
 * Format: { "1500": { "descriptionAr": "...", "reviewSummaryAr": ["..."] }, ... }
 */

const { readFileSync, writeFileSync, existsSync } = require("fs");
const { join } = require("path");
require("dotenv").config({ path: ".env.local" });

const PROVIDERS_PATH = join(process.cwd(), "src/lib/providers-scraped.json");
const OUTPUT_PATH = join(process.cwd(), "scripts/arabic-chunks/ar-1500-1999.json");
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const MODEL = "gemini-2.5-flash";
const BATCH_SIZE = 8;
const DELAY_MS = 400;
const START = 1500;
const END = 1999; // inclusive

const DESC_PROMPT = `Translate this UAE healthcare provider description to Arabic. Keep all proper nouns (facility names, area names, city names, DHA, DOH, MOHAP) in their original English form. Keep numbers and ratings as-is. Return ONLY the Arabic text, no English.`;
const REVIEW_PROMPT = `Translate these UAE healthcare review summary points to Arabic. Keep all proper nouns (facility names, area names, city names, DHA, DOH, MOHAP) in their original English form. Keep numbers and ratings as-is. Return a numbered list in Arabic, one per line. Return ONLY the Arabic translation, no English.`;

async function callGemini(prompt, retries = 3) {
  if (!GEMINI_KEY) throw new Error("GEMINI_API_KEY not set");

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: 2048, temperature: 0.1 },
          }),
          signal: AbortSignal.timeout(20000),
        }
      );

      if (response.status === 429 || response.status === 503) {
        const wait = attempt * 2000;
        console.log(`  [RATE_LIMIT attempt=${attempt}] waiting ${wait}ms`);
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
      if (attempt === retries) {
        console.error(`  [ERR after ${retries} attempts] ${e.message}`);
        return null;
      }
      await new Promise((r) => setTimeout(r, attempt * 1000));
    }
  }
  return null;
}

function parseNumberedList(text) {
  const lines = text.split("\n").filter((l) => l.trim().length > 0);
  const parsed = [];
  for (const line of lines) {
    const match = line.match(/^[\d١٢٣٤٥٦٧٨٩٠]+[.)\u0029]\s*(.+)/);
    if (match) {
      parsed.push(match[1].trim());
    } else {
      const stripped = line.replace(/^\s*[-•*]\s*/, "").trim();
      if (stripped.length > 3) parsed.push(stripped);
    }
  }
  return parsed;
}

async function translateProvider(provider) {
  const result = {};

  if (provider.description && provider.description.trim().length > 10) {
    const ar = await callGemini(`${DESC_PROMPT}\n\n${provider.description}`);
    if (ar) result.descriptionAr = ar;
  }

  await new Promise((r) => setTimeout(r, 80));

  if (provider.reviewSummary && provider.reviewSummary.length > 0) {
    const numbered = provider.reviewSummary.map((p, i) => `${i + 1}. ${p}`).join("\n");
    const ar = await callGemini(`${REVIEW_PROMPT}\n\n${numbered}`);
    if (ar) {
      const parsed = parseNumberedList(ar);
      if (parsed.length > 0) result.reviewSummaryAr = parsed;
    }
  }

  return result;
}

async function main() {
  if (!GEMINI_KEY) {
    console.error("ERROR: GEMINI_API_KEY not set in .env.local");
    process.exit(1);
  }

  console.log(`Loading providers...`);
  const providers = JSON.parse(readFileSync(PROVIDERS_PATH, "utf-8"));
  console.log(`Total: ${providers.length}, processing indices ${START}–${END}`);

  // Load existing progress if any
  let output = {};
  if (existsSync(OUTPUT_PATH)) {
    try {
      output = JSON.parse(readFileSync(OUTPUT_PATH, "utf-8"));
      console.log(`Resuming: ${Object.keys(output).length} already done`);
    } catch (_) {}
  }

  const indices = [];
  for (let i = START; i <= END; i++) indices.push(i);

  const todo = indices.filter((i) => !output[String(i)]);
  console.log(`Need to translate: ${todo.length}\n`);

  let done = 0;
  let failed = 0;

  for (let b = 0; b < todo.length; b += BATCH_SIZE) {
    const batch = todo.slice(b, b + BATCH_SIZE);

    await Promise.all(
      batch.map(async (idx) => {
        const provider = providers[idx];
        if (!provider) {
          console.error(`  [${idx}] MISSING provider`);
          failed++;
          return;
        }

        const translations = await translateProvider(provider);

        if (translations.descriptionAr || translations.reviewSummaryAr) {
          output[String(idx)] = {};
          if (translations.descriptionAr) output[String(idx)].descriptionAr = translations.descriptionAr;
          if (translations.reviewSummaryAr) output[String(idx)].reviewSummaryAr = translations.reviewSummaryAr;
          done++;
          process.stdout.write(
            `  [${idx}] ${(provider.name || "").slice(0, 38).padEnd(38)} desc=${!!translations.descriptionAr} review=${!!translations.reviewSummaryAr}\n`
          );
        } else {
          failed++;
          console.error(`  [${idx}] FAILED: ${provider.name}`);
        }
      })
    );

    // Save after every batch
    writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));

    const processed = Math.min(b + BATCH_SIZE, todo.length);
    const pct = ((processed / todo.length) * 100).toFixed(1);
    if (processed % 40 === 0 || processed >= todo.length) {
      console.log(`  --- ${processed}/${todo.length} (${pct}%) | done=${done} failed=${failed} ---`);
    }

    if (b + BATCH_SIZE < todo.length) {
      await new Promise((r) => setTimeout(r, DELAY_MS));
    }
  }

  // Final save
  writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));

  const total = Object.keys(output).length;
  console.log(`\n=== DONE ===`);
  console.log(`Saved: ${OUTPUT_PATH}`);
  console.log(`Total entries: ${total}/500`);
  console.log(`Translated this run: ${done}`);
  console.log(`Failed this run: ${failed}`);
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
