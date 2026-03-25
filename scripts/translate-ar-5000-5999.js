#!/usr/bin/env node
'use strict';

/**
 * Translate provider descriptions and reviewSummary to Arabic for indices 5000-5999.
 * Source: scripts/enrichment-chunks/chunk-5000-5999.json
 * Output: scripts/arabic-chunks/ar-5000-5999.json
 *
 * Rules:
 * - Keep facility names, area names, city names, numbers, ratings, DHA/DOH/MOHAP in English
 * - Use Gemini API (gemini-2.0-flash) in batches of 20
 * - Retry on 429 / 5xx with exponential backoff
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const GEMINI_API_KEY = 'AIzaSyBkfeEE230U3GblCRjR54cqQgXPu8nVY6s';
const MODEL = 'gemini-2.0-flash';
const BATCH_SIZE = 10;
const DELAY_MS = 1200; // ~50 req/min safe rate
const MAX_RETRIES = 5;

const SOURCE_PATH = path.join(__dirname, 'enrichment-chunks/chunk-5000-5999.json');
const OUT_DIR = path.join(__dirname, 'arabic-chunks');
const OUT_PATH = path.join(OUT_DIR, 'ar-5000-5999.json');

// Load source data
const sourceData = JSON.parse(fs.readFileSync(SOURCE_PATH, 'utf8'));
const allKeys = Object.keys(sourceData); // 1000 keys: "5000" ... "5999"

// Load existing output if present (resume support)
let output = {};
if (fs.existsSync(OUT_PATH)) {
  try {
    output = JSON.parse(fs.readFileSync(OUT_PATH, 'utf8'));
    console.log(`Resuming: ${Object.keys(output).length} entries already done.`);
  } catch (e) {
    output = {};
  }
}

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

// ── Gemini API call ────────────────────────────────────────────────────────────

function callGemini(prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 8192,
      }
    });

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 429 || res.statusCode >= 500) {
          reject({ retryable: true, status: res.statusCode, body: data });
          return;
        }
        if (res.statusCode !== 200) {
          reject({ retryable: false, status: res.statusCode, body: data });
          return;
        }
        try {
          const parsed = JSON.parse(data);
          const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
          resolve(text);
        } catch (e) {
          reject({ retryable: false, error: e, body: data });
        }
      });
    });

    req.on('error', (e) => reject({ retryable: true, error: e }));
    req.write(body);
    req.end();
  });
}

async function callGeminiWithRetry(prompt, retries = MAX_RETRIES) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await callGemini(prompt);
    } catch (err) {
      if (err.retryable && attempt < retries - 1) {
        const wait = Math.pow(2, attempt + 1) * 1000 + Math.random() * 500;
        console.log(`  Retry ${attempt + 1}/${retries - 1} after ${Math.round(wait)}ms (status: ${err.status || 'network'})`);
        await sleep(wait);
      } else {
        throw err;
      }
    }
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ── Build batch prompt ─────────────────────────────────────────────────────────

function buildBatchPrompt(batch) {
  // batch: [{key, description, reviewSummary}]
  const instructions = `You are a professional Arabic medical translator for UAE healthcare content.

RULES:
1. Translate the description and each reviewSummary item to Modern Standard Arabic (فصحى).
2. Keep these in ENGLISH (do NOT translate): facility names, area names (e.g. BUSINESS BAY, Al Barsha), city names (Dubai, Abu Dhabi, Sharjah, Ajman, Fujairah, Ras Al Khaimah, Umm Al Quwain), all numbers and ratings (e.g. 4.8, 20, 500), DHA, DOH, MOHAP, UAE, LLC, L.L.C, phone numbers, URLs.
3. Output ONLY valid JSON. No markdown, no code fences, no explanation.
4. Output format: {"KEY": {"descriptionAr": "...", "reviewSummaryAr": ["...", "..."]}, ...}

Input JSON:
${JSON.stringify(Object.fromEntries(batch.map(b => [b.key, { description: b.description, reviewSummary: b.reviewSummary }])), null, 2)}

Translate and return only the JSON object:`;
  return instructions;
}

// ── Parse batch response ───────────────────────────────────────────────────────

function parseBatchResponse(text, batch) {
  // Try to extract JSON from response
  let cleaned = text.trim();
  // Remove markdown code fences if present
  cleaned = cleaned.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '');

  try {
    const parsed = JSON.parse(cleaned);
    return parsed;
  } catch (e) {
    // Try to find JSON object in text
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch (e2) {
        console.error('Failed to parse JSON response:', e2.message);
        console.error('Raw response snippet:', cleaned.slice(0, 500));
        return null;
      }
    }
    console.error('No JSON found in response');
    console.error('Raw response snippet:', cleaned.slice(0, 500));
    return null;
  }
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  // Filter out already-done keys
  const pendingKeys = allKeys.filter(k => !output[k]);
  console.log(`Total: ${allKeys.length} | Done: ${allKeys.length - pendingKeys.length} | Pending: ${pendingKeys.length}`);

  if (pendingKeys.length === 0) {
    console.log('All entries already translated. Done.');
    return;
  }

  let processed = 0;
  let failed = 0;

  for (let i = 0; i < pendingKeys.length; i += BATCH_SIZE) {
    const batchKeys = pendingKeys.slice(i, i + BATCH_SIZE);
    const batch = batchKeys.map(k => ({
      key: k,
      description: sourceData[k].description || '',
      reviewSummary: sourceData[k].reviewSummary || [],
    }));

    process.stdout.write(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(pendingKeys.length / BATCH_SIZE)} (keys ${batchKeys[0]}-${batchKeys[batchKeys.length - 1]})... `);

    try {
      const prompt = buildBatchPrompt(batch);
      const response = await callGeminiWithRetry(prompt);
      const parsed = parseBatchResponse(response, batch);

      if (parsed) {
        let batchSuccess = 0;
        for (const key of batchKeys) {
          if (parsed[key] && parsed[key].descriptionAr && parsed[key].reviewSummaryAr) {
            output[key] = {
              descriptionAr: parsed[key].descriptionAr,
              reviewSummaryAr: parsed[key].reviewSummaryAr,
            };
            batchSuccess++;
          } else {
            console.warn(`\n  Missing translation for key ${key}`);
            failed++;
          }
        }
        processed += batchSuccess;
        console.log(`OK (${batchSuccess}/${batchKeys.length})`);
      } else {
        console.log('PARSE FAILED - skipping batch');
        failed += batchKeys.length;
      }

      // Save progress after each batch
      fs.writeFileSync(OUT_PATH, JSON.stringify(output, null, 2), 'utf8');

    } catch (err) {
      console.error(`\nERROR on batch ${batchKeys[0]}-${batchKeys[batchKeys.length - 1]}:`, err.status || err.message || err);
      failed += batchKeys.length;
    }

    // Rate limit delay (skip after last batch)
    if (i + BATCH_SIZE < pendingKeys.length) {
      await sleep(DELAY_MS);
    }
  }

  // Final save
  fs.writeFileSync(OUT_PATH, JSON.stringify(output, null, 2), 'utf8');

  const total = Object.keys(output).length;
  console.log(`\n=== DONE ===`);
  console.log(`Translated: ${processed} new | Total in file: ${total} | Failed/skipped: ${failed}`);
  console.log(`Output: ${OUT_PATH}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
