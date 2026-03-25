/**
 * Translate provider descriptions and reviewSummary fields (indices 9000-9999) to Arabic.
 * Uses Gemini API in batches of 20. Saves to scripts/arabic-chunks/ar-9000-9999.json.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createRequire } from 'module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

// Load env from .env.local
const envPath = join(projectRoot, '.env.local');
const envContent = readFileSync(envPath, 'utf8');
const envVars = {};
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) envVars[match[1].trim()] = match[2].trim();
}
const GEMINI_API_KEY = envVars['GEMINI_API_KEY'];
if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not found in .env.local');

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

// Load source data
const providersPath = join(projectRoot, 'src/lib/providers-scraped.json');
const allProviders = JSON.parse(readFileSync(providersPath, 'utf8'));
const chunk = allProviders.slice(9000, 10000);
console.log(`Loaded ${chunk.length} providers (indices 9000-9999)`);

// Output path
const outputPath = join(projectRoot, 'scripts/arabic-chunks/ar-9000-9999.json');

// Load existing progress if any
let results = {};
if (existsSync(outputPath)) {
  results = JSON.parse(readFileSync(outputPath, 'utf8'));
  console.log(`Resuming: ${Object.keys(results).length} already translated`);
}

// Translation prompt builder
function buildPrompt(items) {
  const lines = items.map(item => {
    const reviewsJson = JSON.stringify(item.reviewSummary);
    return `INDEX:${item.index}\nDESCRIPTION:${item.description}\nREVIEWS:${reviewsJson}`;
  }).join('\n---\n');

  return `Translate the following healthcare provider descriptions and review summaries from English to Arabic (Modern Standard Arabic / فصحى).

STRICT RULES:
1. Keep ALL of the following in English (do NOT translate): facility names, company names, area names, street names, city names, numbers, phone numbers, ratings (e.g., "4.8/5"), license numbers, DHA, DOH, MOHAP, UAE, LLC, L.L.C, S.P.C, "Google"
2. Translate everything else to natural, professional Arabic
3. Return ONLY valid JSON, no markdown, no explanation
4. Format: {"INDEX": {"descriptionAr": "...", "reviewSummaryAr": ["...", "...", ...]}, ...}
5. Process every INDEX provided

${lines}

Return only the JSON object.`;
}

// Parse the response JSON
function parseResponse(text, expectedIndices) {
  // Strip markdown code fences if present
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```[a-z]*\n?/, '').replace(/\n?```$/, '').trim();
  }
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    // Try to extract JSON object
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch (e2) {
        console.error('Failed to parse response:', e2.message);
        console.error('Raw response (first 500):', text.slice(0, 500));
        return null;
      }
    }
    return null;
  }
}

// Delay helper
const delay = ms => new Promise(r => setTimeout(r, ms));

// Process batch with retry
async function processBatch(items, attempt = 1) {
  try {
    const prompt = buildPrompt(items);
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsed = parseResponse(text, items.map(i => i.index));
    if (!parsed) {
      if (attempt < 3) {
        console.log(`  Retry attempt ${attempt + 1} for batch starting at index ${items[0].index}`);
        await delay(2000 * attempt);
        return processBatch(items, attempt + 1);
      }
      return null;
    }
    return parsed;
  } catch (err) {
    if (attempt < 3) {
      console.log(`  Error (attempt ${attempt}): ${err.message}. Retrying...`);
      await delay(3000 * attempt);
      return processBatch(items, attempt + 1);
    }
    console.error(`  Failed after 3 attempts: ${err.message}`);
    return null;
  }
}

// Main processing loop
const BATCH_SIZE = 20;
let processed = 0;
let failed = 0;

for (let i = 0; i < chunk.length; i += BATCH_SIZE) {
  const batchItems = [];
  for (let j = i; j < Math.min(i + BATCH_SIZE, chunk.length); j++) {
    const globalIndex = 9000 + j;
    if (results[String(globalIndex)]) continue; // Already done
    batchItems.push({
      index: globalIndex,
      description: chunk[j].description || '',
      reviewSummary: chunk[j].reviewSummary || [],
    });
  }

  if (batchItems.length === 0) {
    processed += Math.min(BATCH_SIZE, chunk.length - i);
    continue;
  }

  const batchStart = batchItems[0].index;
  const batchEnd = batchItems[batchItems.length - 1].index;
  process.stdout.write(`Translating ${batchStart}-${batchEnd} (${Object.keys(results).length + batchItems.length}/${chunk.length})... `);

  const batchResult = await processBatch(batchItems);

  if (batchResult) {
    // Merge results
    for (const [key, val] of Object.entries(batchResult)) {
      if (val && val.descriptionAr && val.reviewSummaryAr) {
        results[key] = {
          descriptionAr: val.descriptionAr,
          reviewSummaryAr: val.reviewSummaryAr,
        };
      }
    }
    processed += batchItems.length;
    console.log(`done (${Object.keys(results).length} total)`);
  } else {
    // Fall back to one-by-one for this batch
    console.log(`batch failed, processing individually...`);
    for (const item of batchItems) {
      const singleResult = await processBatch([item]);
      if (singleResult && singleResult[String(item.index)]) {
        results[String(item.index)] = {
          descriptionAr: singleResult[String(item.index)].descriptionAr,
          reviewSummaryAr: singleResult[String(item.index)].reviewSummaryAr,
        };
        processed++;
      } else {
        console.error(`  FAILED index ${item.index}`);
        failed++;
      }
      await delay(500);
    }
  }

  // Save progress after every batch
  writeFileSync(outputPath, JSON.stringify(results, null, 2));

  // Rate limit: small pause between batches
  await delay(800);
}

// Final save
writeFileSync(outputPath, JSON.stringify(results, null, 2));

const total = Object.keys(results).length;
console.log(`\n=== DONE ===`);
console.log(`Total translated: ${total}`);
console.log(`Failed: ${failed}`);
console.log(`Saved to: ${outputPath}`);

// Verify all 1000 present
const missing = [];
for (let i = 9000; i < 10000; i++) {
  if (!results[String(i)]) missing.push(i);
}
if (missing.length > 0) {
  console.log(`Missing indices (${missing.length}): ${missing.slice(0, 20).join(', ')}${missing.length > 20 ? '...' : ''}`);
} else {
  console.log('All 1000 indices present. ');
}
