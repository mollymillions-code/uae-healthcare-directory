import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const GEMINI_API_KEY = 'AIzaSyBkfeEE230U3GblCRjR54cqQgXPu8nVY6s';
const INPUT_FILE = path.join(__dirname, '..', 'src', 'lib', 'providers-scraped.json');
const OUTPUT_FILE = path.join(__dirname, 'arabic-chunks', 'ar-8000-8999.json');
const PROGRESS_FILE = '/tmp/ar-8000-8999-progress.json';

const BATCH_SIZE = 20;
const DELAY_MS = 1500;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function translateBatch(items) {
  const prompt = `Translate the following healthcare provider descriptions and review summaries from English to Arabic.

CRITICAL RULES:
- Keep facility/clinic/hospital/pharmacy NAMES in English (do not translate proper names)
- Keep area names and city names in English (e.g., "Dubai", "Sharjah", "Abu Dhabi", "Deira", "Jumeirah", etc.)
- Keep numbers, ratings, phone numbers in their original form
- Keep "DHA", "DOH", "MOHAP" in English
- Keep URLs and phone numbers unchanged
- Translate all other text naturally into Modern Standard Arabic (فصحى)
- For reviewSummary, translate each array item separately

Return ONLY a valid JSON array with this exact structure, no markdown, no explanation:
[
  {
    "index": <number>,
    "descriptionAr": "<Arabic translation of description>",
    "reviewSummaryAr": ["<Arabic item 1>", "<Arabic item 2>", ...]
  },
  ...
]

Items to translate:
${JSON.stringify(items, null, 2)}`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 32768,
        }
      })
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`API error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('No text in response: ' + JSON.stringify(data));

  // Strip markdown code blocks if present
  const cleaned = text.replace(/^```json\s*/m, '').replace(/^```\s*/m, '').replace(/```\s*$/m, '').trim();

  return JSON.parse(cleaned);
}

async function main() {
  console.log('Loading providers data...');
  const data = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf8'));
  const chunk = data.slice(8000, 9000);
  console.log(`Loaded ${chunk.length} providers (indices 8000-8999)`);

  // Load existing progress if any
  let results = {};
  if (fs.existsSync(PROGRESS_FILE)) {
    results = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
    console.log(`Resuming from progress: ${Object.keys(results).length} already done`);
  }

  const items = chunk.map((p, i) => ({
    index: 8000 + i,
    description: p.description || '',
    reviewSummary: p.reviewSummary || []
  }));

  // Filter out already-processed
  const remaining = items.filter(item => !results[item.index]);
  console.log(`${remaining.length} items remaining to translate`);

  let batchNum = 0;
  const totalBatches = Math.ceil(remaining.length / BATCH_SIZE);

  for (let i = 0; i < remaining.length; i += BATCH_SIZE) {
    const batch = remaining.slice(i, i + BATCH_SIZE);
    batchNum++;
    console.log(`Batch ${batchNum}/${totalBatches} (indices ${batch[0].index}-${batch[batch.length-1].index})...`);

    let attempt = 0;
    let success = false;
    while (attempt < 4 && !success) {
      try {
        const translated = await translateBatch(batch);
        for (const t of translated) {
          results[t.index] = {
            descriptionAr: t.descriptionAr,
            reviewSummaryAr: t.reviewSummaryAr
          };
        }
        success = true;
        console.log(`  ✓ Translated ${translated.length} items. Total done: ${Object.keys(results).length}`);
      } catch (err) {
        attempt++;
        console.error(`  Attempt ${attempt} failed: ${err.message}`);
        if (attempt < 4) {
          const waitMs = DELAY_MS * attempt * 2;
          console.log(`  Waiting ${waitMs}ms before retry...`);
          await sleep(waitMs);
        }
      }
    }

    if (!success) {
      console.error(`FATAL: Batch failed after 4 attempts. Saving progress and exiting.`);
      fs.writeFileSync(PROGRESS_FILE, JSON.stringify(results, null, 2));
      process.exit(1);
    }

    // Save progress after each batch
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify(results, null, 2));

    if (i + BATCH_SIZE < remaining.length) {
      await sleep(DELAY_MS);
    }
  }

  // Write final output
  const finalOutput = {};
  for (let i = 8000; i < 9000; i++) {
    finalOutput[i] = results[i] || { descriptionAr: '', reviewSummaryAr: [] };
  }

  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(finalOutput, null, 2));
  console.log(`\nDone! Written ${Object.keys(finalOutput).length} entries to ${OUTPUT_FILE}`);

  // Verify
  const count = Object.keys(finalOutput).length;
  const withDesc = Object.values(finalOutput).filter(v => v.descriptionAr && v.descriptionAr.length > 0).length;
  const withReview = Object.values(finalOutput).filter(v => v.reviewSummaryAr && v.reviewSummaryAr.length > 0).length;
  console.log(`Verification: ${count} total, ${withDesc} with Arabic description, ${withReview} with Arabic reviewSummary`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
