#!/usr/bin/env node
/**
 * Generate one-liner descriptions for medical universities using Gemini,
 * then backfill education + education_description into professionals_index.
 *
 * Usage:
 *   node scripts/generate-university-descriptions.mjs
 *   node scripts/generate-university-descriptions.mjs --skip-ai   # backfill only, no API calls
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");

// Load .env.local
const envPath = path.join(PROJECT_ROOT, ".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const SKIP_AI = process.argv.includes("--skip-ai");
const DESCRIPTIONS_FILE = path.join(PROJECT_ROOT, "data/parsed/university-descriptions.json");

// ── Junk detection ──────────────────────────────────────────────────────────
const JUNK_EXACT = new Set([
  "", "NOT SPECIFIED", "not specified", "Others", "other", "OTHER", "-",
  "N/A", "n/a", "NA", "Languages", "Pre-University", "Ask Latifa",
  "Not Applicable", "Contact Details", "Medicine", "MEDICINE", "Dentistry",
  "DENTISTRY", "Doctorate", "Certificate", "Masters", "Diploma",
  "Fellowship", "FELLOWSHIP", "And Research", "Dental surgery",
  "College of Medicine", "College of Dentistry", "College of Dental Medicine",
  "Faculty of medicine", "Faculty of Medicine", "FACULTY OF MEDICINE",
  "Faculty Of Medicine", "Faculty of dentistry", "Faculty of Dentistry",
  "FACULTY OF DENTISTRY", "Faculty Of Dentistry", "OTHERS", "Cairo",
  "Damascus", "School of Medicine", "Medical College", "MEDICINE",
  "Ministry of health", "General Medical Council",
  "National Board Of Examinations", "Sudan Medical Specialization Board",
]);

const JUNK_PATTERN = /^(Verified by|Specialization|Certificate|Graduated|Board|Bachelor|MBBS$|MD$|PHD$|BDS$|MDS$|MS$|Degree|Not Specified|Membership|Pre-|General$|Dental surgery$|Contact|Fellowship$)/i;

function cleanEducation(raw) {
  if (!raw) return null;
  const s = raw.replace(/\s+/g, " ").trim();
  if (JUNK_EXACT.has(s)) return null;
  if (JUNK_PATTERN.test(s)) return null;
  if (s.length < 5) return null;
  return s;
}

// ── Gemini API ──────────────────────────────────────────────────────────────
async function generateDescriptions(universities) {
  if (!GEMINI_KEY) throw new Error("GEMINI_API_KEY not set");

  const results = {};
  // Process in batches of 30 to avoid token limits
  const BATCH = 30;

  for (let i = 0; i < universities.length; i += BATCH) {
    const batch = universities.slice(i, i + BATCH);
    const uniList = batch.map((u, j) => `${j + 1}. ${u.name}`).join("\n");

    const prompt = `You are a medical education expert. For each university below, write ONE sentence (max 25 words) describing it as a medical/dental school. Include: country, founding year if notable, and whether it's considered prestigious or well-known in its region. If you don't recognize a university, write "Medical institution" only.

Format: Return a JSON object where keys are the exact university names and values are the one-sentence descriptions.

Universities:
${uniList}

Return ONLY valid JSON, no markdown fences.`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`;
    const body = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 4000,
        responseMimeType: "application/json",
      },
    };

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error(`Gemini API error ${res.status}:`, text.slice(0, 200));
        continue;
      }

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      try {
        const parsed = JSON.parse(text);
        Object.entries(parsed).forEach(([name, desc]) => {
          results[name.toLowerCase()] = String(desc).slice(0, 200);
        });
      } catch (e) {
        console.error(`JSON parse error for batch ${i}:`, e.message);
      }
    } catch (e) {
      console.error(`Fetch error for batch ${i}:`, e.message);
    }

    const done = Math.min(i + BATCH, universities.length);
    console.log(`AI descriptions: ${done}/${universities.length}`);

    // Rate limit: 100ms between batches
    await new Promise((r) => setTimeout(r, 100));
  }

  return results;
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  // 1. Load enriched JSON and extract education data per DHA ID
  console.log("Loading enriched JSON...");
  const enriched = JSON.parse(
    fs.readFileSync(path.join(PROJECT_ROOT, "data/parsed/dha_professionals_enriched.json"), "utf-8")
  );

  // Build a map: dhaUniqueId -> cleaned education
  const eduMap = {}; // dhaId -> cleanedEducation
  const uniCounts = {}; // lowercased name -> { canonical, count }

  for (const record of Object.values(enriched)) {
    const cat = record.categoryOrSpeciality || "";
    if (!cat.startsWith("Physician") && !cat.startsWith("Dentist")) continue;

    const cleaned = cleanEducation(record.education);
    if (!cleaned) continue;

    eduMap[record.dhaUniqueId] = cleaned;
    const key = cleaned.toLowerCase();
    if (!uniCounts[key]) uniCounts[key] = { canonical: cleaned, count: 0 };
    uniCounts[key].count++;
  }

  console.log(`Physicians/dentists with valid education: ${Object.keys(eduMap).length}`);
  const sortedUnis = Object.values(uniCounts).sort((a, b) => b.count - a.count);
  console.log(`Distinct universities: ${sortedUnis.length}`);

  // 2. Generate AI descriptions (or load cached)
  let descriptions = {};

  if (fs.existsSync(DESCRIPTIONS_FILE)) {
    descriptions = JSON.parse(fs.readFileSync(DESCRIPTIONS_FILE, "utf-8"));
    console.log(`Loaded ${Object.keys(descriptions).length} cached descriptions`);
  }

  if (!SKIP_AI) {
    // Only generate for universities we don't already have descriptions for
    const needDesc = sortedUnis
      .filter((u) => u.count >= 5 && !descriptions[u.canonical.toLowerCase()])
      .slice(0, 500);

    if (needDesc.length > 0) {
      console.log(`Generating AI descriptions for ${needDesc.length} universities...`);
      const newDescs = await generateDescriptions(needDesc);
      Object.assign(descriptions, newDescs);

      // Cache
      fs.writeFileSync(DESCRIPTIONS_FILE, JSON.stringify(descriptions, null, 2));
      console.log(`Cached ${Object.keys(descriptions).length} total descriptions`);
    } else {
      console.log("All universities already have descriptions.");
    }
  }

  // 3. Build the backfill payload: [{dhaId, education, educationDescription}]
  const payload = [];
  for (const [dhaId, edu] of Object.entries(eduMap)) {
    const desc = descriptions[edu.toLowerCase()] || null;
    // Skip generic "Medical institution" descriptions
    const cleanDesc = desc && desc !== "Medical institution" ? desc : null;
    payload.push({ dhaId, education: edu, educationDescription: cleanDesc });
  }

  console.log(`\nBackfill payload: ${payload.length} records`);
  console.log(`  With AI description: ${payload.filter((p) => p.educationDescription).length}`);
  console.log(`  Education only: ${payload.filter((p) => !p.educationDescription).length}`);

  // Write payload for the SSH backfill
  fs.writeFileSync("/tmp/edu-backfill.json", JSON.stringify(payload));
  console.log("Written to /tmp/edu-backfill.json");
}

main().catch((e) => {
  console.error("FATAL:", e.message);
  process.exit(1);
});
