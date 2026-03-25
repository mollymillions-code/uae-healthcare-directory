#!/usr/bin/env node
/**
 * Translate provider descriptions and reviewSummary to Arabic
 * Indices 6000-6999 from providers-scraped.json
 * Uses Gemini 2.0 Flash via REST API
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const GEMINI_API_KEY = 'AIzaSyBkfeEE230U3GblCRjR54cqQgXPu8nVY6s';
const MODEL = 'gemini-2.0-flash';
const BATCH_SIZE = 10;
const DELAY_MS = 300;
const START_IDX = 6000;
const END_IDX = 6999;

const providersPath = path.join(__dirname, '../src/lib/providers-scraped.json');
const outputPath = path.join(__dirname, 'arabic-chunks/ar-6000-6999.json');

// Load providers
console.log('Loading providers...');
const allProviders = JSON.parse(fs.readFileSync(providersPath, 'utf8'));
const providers = allProviders.slice(START_IDX, END_IDX + 1);
console.log(`Loaded ${providers.length} providers (indices ${START_IDX}-${END_IDX})`);

// Load existing output if any (for resume)
let results = {};
if (fs.existsSync(outputPath)) {
  try {
    results = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
    console.log(`Resuming: ${Object.keys(results).length} already translated`);
  } catch (e) {
    console.log('Could not parse existing output, starting fresh');
    results = {};
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function httpsPost(url, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(responseData));
          } catch (e) {
            reject(new Error(`JSON parse error: ${responseData.substring(0, 200)}`));
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${responseData.substring(0, 300)}`));
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function translateBatch(batch) {
  // Build a prompt that translates all items in the batch
  const items = batch.map(({ globalIdx, provider }) => {
    return {
      index: globalIdx,
      description: provider.description || '',
      reviewSummary: provider.reviewSummary || []
    };
  });

  const prompt = `You are a professional medical translator. Translate the following UAE healthcare provider texts from English to Arabic (Modern Standard Arabic / العربية الفصحى).

RULES:
- Keep facility names, area names, city names in English (do NOT translate)
- Keep numbers, ratings (e.g. "4.7 out of 5"), phone numbers in English
- Keep acronyms: DHA, DOH, MOHAP, LLC, L.L.C in English
- Keep "Google" in English
- Translate all other text naturally and professionally
- Return ONLY valid JSON, no markdown, no code blocks

Input JSON:
${JSON.stringify(items, null, 2)}

Return JSON in this exact format:
{
  "results": [
    {
      "index": <same index as input>,
      "descriptionAr": "<Arabic translation of description>",
      "reviewSummaryAr": ["<Arabic translation of item 1>", "<Arabic translation of item 2>", ...]
    }
  ]
}`;

  const body = {
    contents: [{
      parts: [{ text: prompt }]
    }],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 8192,
      responseMimeType: 'application/json'
    }
  };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  const response = await httpsPost(url, body);

  const text = response?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('No text in Gemini response: ' + JSON.stringify(response).substring(0, 300));
  }

  // Parse the JSON response
  let parsed;
  try {
    // Handle potential markdown code blocks
    const cleaned = text.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
    parsed = JSON.parse(cleaned);
  } catch (e) {
    throw new Error(`Failed to parse Gemini JSON: ${text.substring(0, 300)}`);
  }

  return parsed.results;
}

async function main() {
  let processed = 0;
  let failed = 0;
  const startTime = Date.now();

  // Build list of indices that need processing
  const toProcess = [];
  for (let i = 0; i < providers.length; i++) {
    const globalIdx = START_IDX + i;
    if (!results[globalIdx]) {
      toProcess.push({ globalIdx, provider: providers[i] });
    }
  }

  console.log(`Need to process: ${toProcess.length} providers`);

  // Process in batches
  for (let batchStart = 0; batchStart < toProcess.length; batchStart += BATCH_SIZE) {
    const batch = toProcess.slice(batchStart, batchStart + BATCH_SIZE);

    let retries = 3;
    while (retries > 0) {
      try {
        const batchResults = await translateBatch(batch);

        for (const item of batchResults) {
          results[item.index] = {
            descriptionAr: item.descriptionAr || '',
            reviewSummaryAr: item.reviewSummaryAr || []
          };
          processed++;
        }

        // Save after each batch
        fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf8');

        const total = Object.keys(results).length;
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        const rate = (processed / elapsed * 60).toFixed(0);
        console.log(`[${total}/${providers.length}] Batch ${Math.floor(batchStart/BATCH_SIZE)+1} done | ${elapsed}s elapsed | ~${rate}/min | failed: ${failed}`);
        break;
      } catch (err) {
        retries--;
        console.error(`Batch error (${retries} retries left): ${err.message}`);
        if (retries > 0) {
          await sleep(2000);
        } else {
          // Mark as failed with empty translations
          for (const { globalIdx } of batch) {
            if (!results[globalIdx]) {
              results[globalIdx] = { descriptionAr: '', reviewSummaryAr: [] };
              failed++;
            }
          }
          fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf8');
        }
      }
    }

    // Rate limiting delay
    if (batchStart + BATCH_SIZE < toProcess.length) {
      await sleep(DELAY_MS);
    }
  }

  // Final stats
  const total = Object.keys(results).length;
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\nDone! ${total} providers translated in ${elapsed}s`);
  console.log(`Failed: ${failed}`);
  console.log(`Output: ${outputPath}`);

  // Verify all indices present
  let missing = 0;
  for (let i = START_IDX; i <= END_IDX; i++) {
    if (!results[i]) missing++;
  }
  console.log(`Missing indices: ${missing}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
