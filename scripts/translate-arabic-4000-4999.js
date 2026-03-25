#!/usr/bin/env node
/**
 * Translates provider descriptions and reviewSummary to Arabic for indices 4000-4999.
 * Uses Gemini 2.5 Flash. Keeps facility/area/city names, numbers, ratings, DHA/DOH/MOHAP in English.
 * Output: scripts/arabic-chunks/ar-4000-4999.json
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Load env
const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const match = envContent.match(/GEMINI_API_KEY=([^\n\r]+)/);
if (!match) { console.error('No GEMINI_API_KEY found'); process.exit(1); }
const GEMINI_API_KEY = match[1].trim();

const RAW = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../src/lib/providers-scraped.json'), 'utf8')
);
const providers = RAW.slice(4000, 5000);

const OUT_PATH = path.join(__dirname, 'arabic-chunks/ar-4000-4999.json');

// Load existing output if resuming
let results = {};
if (fs.existsSync(OUT_PATH)) {
  try {
    results = JSON.parse(fs.readFileSync(OUT_PATH, 'utf8'));
    console.log(`Resuming: ${Object.keys(results).length} already done`);
  } catch (e) {
    results = {};
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function geminiRequest(prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 1024,
      }
    });

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) {
            reject(new Error(parsed.error.message));
            return;
          }
          const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (!text) {
            reject(new Error('No text in response: ' + JSON.stringify(parsed).substring(0, 200)));
            return;
          }
          resolve(text.trim());
        } catch (e) {
          reject(new Error('Parse error: ' + e.message + ' | ' + data.substring(0, 200)));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('Timeout')); });
    req.write(body);
    req.end();
  });
}

function buildPrompt(description, reviewSummary) {
  const reviewLines = reviewSummary.map((r, i) => `${i + 1}. ${r}`).join('\n');
  return `Translate the following healthcare provider description and review summary sentences to Arabic (Modern Standard Arabic, suitable for UAE).

IMPORTANT RULES:
- Keep facility names, clinic/hospital names, area names, city names, and proper nouns in English
- Keep numbers, ratings, percentages in their original form
- Keep regulatory body abbreviations (DHA, DOH, MOHAP) in English
- Keep medical abbreviations and technical terms that are standard English in healthcare
- Translate everything else to natural, professional Arabic
- Return ONLY a JSON object in this exact format, no extra text:
{"descriptionAr":"<arabic translation>","reviewSummaryAr":["<translation 1>","<translation 2>",...]}

DESCRIPTION:
${description}

REVIEW SUMMARY:
${reviewLines}`;
}

async function translateProvider(idx, provider) {
  const globalIdx = 4000 + idx;
  const key = String(globalIdx);

  if (results[key]) return; // already done

  const description = (provider.description || '').trim();
  const reviewSummary = Array.isArray(provider.reviewSummary) ? provider.reviewSummary : [];

  if (!description && reviewSummary.length === 0) {
    results[key] = { descriptionAr: '', reviewSummaryAr: [] };
    return;
  }

  const prompt = buildPrompt(description, reviewSummary);

  let attempts = 0;
  while (attempts < 3) {
    try {
      const text = await geminiRequest(prompt);
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found in: ' + text.substring(0, 200));
      const parsed = JSON.parse(jsonMatch[0]);
      if (!parsed.descriptionAr && !parsed.reviewSummaryAr) throw new Error('Missing fields');
      results[key] = {
        descriptionAr: parsed.descriptionAr || '',
        reviewSummaryAr: Array.isArray(parsed.reviewSummaryAr) ? parsed.reviewSummaryAr : []
      };
      return;
    } catch (e) {
      attempts++;
      console.error(`  Error on index ${globalIdx} attempt ${attempts}: ${e.message}`);
      if (attempts < 3) await sleep(2000 * attempts);
    }
  }
  // After 3 failures, store empty
  console.error(`  FAILED index ${globalIdx} after 3 attempts — storing empty`);
  results[key] = { descriptionAr: '', reviewSummaryAr: [] };
}

async function main() {
  const BATCH_SIZE = 5;
  const DELAY_MS = 400;
  let processed = 0;
  let saved = Object.keys(results).length;

  for (let i = 0; i < providers.length; i += BATCH_SIZE) {
    const batch = providers.slice(i, i + BATCH_SIZE);
    await Promise.all(batch.map((p, j) => translateProvider(i + j, p)));
    processed += batch.length;
    saved = Object.keys(results).length;

    // Save every 50
    if (processed % 50 === 0) {
      fs.writeFileSync(OUT_PATH, JSON.stringify(results, null, 2));
      const pct = ((saved / 1000) * 100).toFixed(1);
      console.log(`Progress: ${saved}/1000 (${pct}%) — saved to disk`);
    }

    await sleep(DELAY_MS);
  }

  // Final save
  fs.writeFileSync(OUT_PATH, JSON.stringify(results, null, 2));
  const total = Object.keys(results).length;
  const empty = Object.values(results).filter(v => !v.descriptionAr && v.reviewSummaryAr.length === 0).length;
  console.log(`\nDone! ${total}/1000 processed. ${empty} empty (failures). Saved to ${OUT_PATH}`);
}

main().catch(e => { console.error(e); process.exit(1); });
