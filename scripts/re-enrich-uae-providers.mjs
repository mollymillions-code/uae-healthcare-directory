#!/usr/bin/env node
/**
 * UAE Provider Re-Enrichment via Google Places API
 * ─────────────────────────────────────────────────
 * Re-verifies and fixes ALL 12,519 UAE provider records against Google Places.
 *
 * The original enrichment script took the #1 Google result blindly — no name
 * verification, no google_place_id saved. This caused real harm (wrong website
 * shown for Tamani Home Healthcare). This script fixes that.
 *
 * For each provider:
 *   1. Text Search → find the best Google match
 *   2. Verify the match via Jaccard word similarity (threshold 0.4)
 *   3. Place Details → get full contact/rating/photo data
 *   4. Compare + update DB with verified data
 *
 * Must run ON EC2 where the database is at localhost:5432.
 *
 * Usage:
 *   GOOGLE_PLACES_API_KEY=<key> node scripts/re-enrich-uae-providers.mjs --city dubai --dry-run
 *   GOOGLE_PLACES_API_KEY=<key> node scripts/re-enrich-uae-providers.mjs --city dubai --live
 *   GOOGLE_PLACES_API_KEY=<key> node scripts/re-enrich-uae-providers.mjs --live --limit 100
 *   GOOGLE_PLACES_API_KEY=<key> node scripts/re-enrich-uae-providers.mjs --live --resume
 *   GOOGLE_PLACES_API_KEY=<key> node scripts/re-enrich-uae-providers.mjs --live --offset 500
 *
 * Outputs:
 *   data/re-enrichment-checkpoint.json   — progress checkpoint (saved every 50)
 *   data/re-enrichment-report.json       — full results summary
 *   data/re-enrichment-mismatches.csv    — unmatched providers for manual review
 */

import pg from "pg";
const { Pool } = pg;
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, "..");
const DATA_DIR = join(PROJECT_ROOT, "data");

// ─── Configuration ────────────────────────────────────────────────────────────

const SIMILARITY_THRESHOLD = 0.4; // Below this → ask Gemini Flash for verification
const LLM_REJECT_THRESHOLD = 0.1; // Below this → reject outright without LLM check
const RATE_LIMIT_MS = 30;         // 30ms between requests — safe with 9 round-robin keys
const CONCURRENCY = 5;            // Process 5 providers in parallel
const CHECKPOINT_INTERVAL = 50;   // Save progress every N providers
const MAX_RETRIES = 3;
const RETRY_BASE_MS = 1000;       // Exponential backoff: 1s, 2s, 4s
const LOCATION_DRIFT_THRESHOLD_M = 500; // Update coords if >500m apart

// LLM verification via OpenRouter (Gemini 3.1 Flash Lite Preview)
// Round-robin across multiple keys to parallelize and avoid rate limits
const OPENROUTER_KEYS = [];
for (let i = 0; i <= 20; i++) {
  const key = process.env[i === 0 ? 'OPENROUTER_KEY' : `OPENROUTER_KEY_${i + 1}`];
  if (key) OPENROUTER_KEYS.push(key);
}
// Also check numbered keys starting from 2
for (let i = 2; i <= 20; i++) {
  const key = process.env[`OPENROUTER_KEY_${i}`];
  if (key && !OPENROUTER_KEYS.includes(key)) OPENROUTER_KEYS.push(key);
}
if (OPENROUTER_KEYS.length === 0) {
  console.error("ERROR: At least one OPENROUTER_KEY* environment variable is required.");
  console.error("Set in .env.local on EC2, NOT in code (keys get revoked if committed to git).");
  process.exit(1);
}
let llmKeyIndex = 0;
function getNextLLMKey() {
  const key = OPENROUTER_KEYS[llmKeyIndex % OPENROUTER_KEYS.length];
  llmKeyIndex++;
  return key;
}
console.log(`  LLM keys loaded: ${OPENROUTER_KEYS.length} (round-robin for speed)`);
const LLM_MODEL = "google/gemini-3.1-flash-lite-preview";
const LLM_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

// UAE center coordinates for geographic bias in Text Search
const UAE_CENTER_LAT = 24.4539;
const UAE_CENTER_LNG = 54.3773;
const UAE_SEARCH_RADIUS = 300000; // 300km covers all emirates
const UAE_GEO_REJECT_KM = 200;   // Reject matches >200km from UAE border

const TEXT_SEARCH_URL = "https://maps.googleapis.com/maps/api/place/textsearch/json";
const PLACE_DETAILS_URL = "https://maps.googleapis.com/maps/api/place/details/json";
const PLACE_DETAILS_FIELDS = [
  "name",
  "formatted_address",
  "formatted_phone_number",
  "international_phone_number",
  "website",
  "geometry",
  "business_status",
  "rating",
  "user_ratings_total",
  "opening_hours",
  "photos",
].join(",");

const TEXT_SEARCH_COST = 0.032;
const PLACE_DETAILS_COST = 0.017;

// ─── File paths ───────────────────────────────────────────────────────────────
// Worker-aware: when running multiple parallel instances, each uses its own files.
// Set WORKER_ID=1, WORKER_ID=2, etc. to distinguish. Default is "main".

const WORKER_ID = process.env.WORKER_ID || "main";
const WORKER_SUFFIX = WORKER_ID === "main" ? "" : `-worker${WORKER_ID}`;
const CHECKPOINT_PATH = join(DATA_DIR, `re-enrichment-checkpoint${WORKER_SUFFIX}.json`);
const REPORT_PATH = join(DATA_DIR, `re-enrichment-report${WORKER_SUFFIX}.json`);
const MISMATCHES_PATH = join(DATA_DIR, `re-enrichment-mismatches${WORKER_SUFFIX}.csv`);

// ─── Environment ──────────────────────────────────────────────────────────────

function loadEnv() {
  const envPath = join(PROJECT_ROOT, ".env.local");
  try {
    const content = readFileSync(envPath, "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIndex = trimmed.indexOf("=");
      if (eqIndex === -1) continue;
      const key = trimmed.slice(0, eqIndex).trim();
      let val = trimmed.slice(eqIndex + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  } catch {
    // .env.local not found — rely on environment variables
  }
}

// ─── CLI args ─────────────────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    live: false,
    dryRun: true, // default: dry-run
    city: null,
    limit: null,
    offset: 0,
    resume: false,
    onlyMissingPlaceId: false,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--live":
        opts.live = true;
        opts.dryRun = false;
        break;
      case "--dry-run":
        opts.dryRun = true;
        opts.live = false;
        break;
      case "--city":
        opts.city = args[++i]?.toLowerCase() || null;
        break;
      case "--limit":
        opts.limit = parseInt(args[++i], 10);
        if (isNaN(opts.limit) || opts.limit < 1) {
          console.error("--limit must be a positive integer");
          process.exit(1);
        }
        break;
      case "--offset":
        opts.offset = parseInt(args[++i], 10);
        if (isNaN(opts.offset) || opts.offset < 0) {
          console.error("--offset must be a non-negative integer");
          process.exit(1);
        }
        break;
      case "--resume":
        opts.resume = true;
        break;
      case "--only-missing-place-id":
        opts.onlyMissingPlaceId = true;
        break;
      case "-h":
      case "--help":
        printHelp();
        process.exit(0);
        break;
      default:
        console.error(`Unknown flag: ${args[i]}`);
        printHelp();
        process.exit(1);
    }
  }

  return opts;
}

function printHelp() {
  console.log(`
UAE Provider Re-Enrichment via Google Places API

Usage:
  GOOGLE_PLACES_API_KEY=<key> node scripts/re-enrich-uae-providers.mjs [options]

Options:
  --dry-run         Log only, don't update DB (DEFAULT)
  --live            Actually update the database
  --city <slug>     Filter by city slug (e.g., dubai, abu-dhabi, sharjah)
  --limit <N>       Process only N providers
  --offset <N>      Skip first N providers
  --resume          Resume from last checkpoint
  -h, --help        Show this help
`);
}

// ─── Database ─────────────────────────────────────────────────────────────────

let pool = null;

function getPool() {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is not set. Check .env.local or env vars.");
    }
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 3,
      idleTimeoutMillis: 30000,
    });
  }
  return pool;
}

async function cleanup() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

/**
 * Create a backup table before any writes. Idempotent — skips if already exists.
 */
async function createBackup() {
  const db = getPool();
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const backupTable = `providers_backup_${today}`;

  const check = await db.query(
    `SELECT EXISTS (
       SELECT 1 FROM information_schema.tables
       WHERE table_name = $1
     )`,
    [backupTable]
  );

  if (check.rows[0].exists) {
    console.log(`  Backup table ${backupTable} already exists — skipping`);
    return backupTable;
  }

  console.log(`  Creating backup: ${backupTable}...`);
  await db.query(`CREATE TABLE ${backupTable} AS SELECT * FROM providers`);
  const count = await db.query(`SELECT COUNT(*) FROM ${backupTable}`);
  console.log(`  Backup created: ${count.rows[0].count} rows`);
  return backupTable;
}

/**
 * Fetch UAE providers, optionally filtered by city.
 */
async function getUAEProviders(citySlug = null, onlyMissingPlaceId = false) {
  const db = getPool();

  let query = `
    SELECT
      id, name, slug, phone, website, address, latitude, longitude,
      google_place_id, google_rating, google_review_count, google_photo_url,
      city_slug, category_slug, status
    FROM providers
    WHERE country = 'ae'
  `;
  const params = [];

  if (citySlug) {
    params.push(citySlug);
    query += ` AND city_slug = $${params.length}`;
  }

  if (onlyMissingPlaceId) {
    query += ` AND (google_place_id IS NULL OR google_place_id = '')`;
  }

  query += ` ORDER BY city_slug, name`;

  const result = await db.query(query, params);
  return result.rows;
}

/**
 * Update a provider with verified Google Places data.
 */
async function updateProvider(providerId, data) {
  const db = getPool();

  const setClauses = [];
  const values = [];
  let idx = 1;

  if (data.google_place_id !== undefined) {
    setClauses.push(`google_place_id = $${idx++}`);
    values.push(data.google_place_id);
  }
  if (data.website !== undefined) {
    setClauses.push(`website = $${idx++}`);
    values.push(data.website);
  }
  if (data.phone !== undefined) {
    setClauses.push(`phone = $${idx++}`);
    values.push(data.phone);
  }
  if (data.google_rating !== undefined) {
    setClauses.push(`google_rating = $${idx++}`);
    values.push(data.google_rating);
  }
  if (data.google_review_count !== undefined) {
    setClauses.push(`google_review_count = $${idx++}`);
    values.push(data.google_review_count);
  }
  if (data.google_photo_url !== undefined) {
    setClauses.push(`google_photo_url = $${idx++}`);
    values.push(data.google_photo_url);
  }
  if (data.latitude !== undefined) {
    setClauses.push(`latitude = $${idx++}`);
    values.push(data.latitude);
  }
  if (data.longitude !== undefined) {
    setClauses.push(`longitude = $${idx++}`);
    values.push(data.longitude);
  }
  if (data.operating_hours !== undefined) {
    setClauses.push(`operating_hours = $${idx++}`);
    values.push(JSON.stringify(data.operating_hours));
  }

  // Always update timestamp
  setClauses.push(`updated_at = NOW()`);

  if (setClauses.length <= 1) return false; // only timestamp

  values.push(providerId);
  await db.query(
    `UPDATE providers SET ${setClauses.join(", ")} WHERE id = $${idx}`,
    values
  );
  return true;
}

// ─── Google Places API ────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Text Search: find a business on Google Places.
 * Returns the full results array (up to 20).
 */
async function textSearch(query, apiKey, retries = 0) {
  const url = `${TEXT_SEARCH_URL}?query=${encodeURIComponent(query)}&location=${UAE_CENTER_LAT},${UAE_CENTER_LNG}&radius=${UAE_SEARCH_RADIUS}&key=${apiKey}`;

  try {
    const res = await fetch(url);

    if (res.status === 429 || res.status >= 500) {
      if (retries < MAX_RETRIES) {
        const backoff = RETRY_BASE_MS * Math.pow(2, retries);
        console.warn(`  [${res.status}] Rate limited on Text Search, retrying in ${backoff}ms...`);
        await sleep(backoff);
        return textSearch(query, apiKey, retries + 1);
      }
      return { error: `HTTP_${res.status}`, results: [] };
    }

    if (!res.ok) {
      return { error: `HTTP_${res.status}`, results: [] };
    }

    const data = await res.json();

    if (data.status === "OK") {
      return { results: data.results || [] };
    } else if (data.status === "ZERO_RESULTS") {
      return { results: [] };
    } else if (data.status === "OVER_QUERY_LIMIT") {
      if (retries < MAX_RETRIES) {
        const backoff = RETRY_BASE_MS * Math.pow(2, retries);
        console.warn(`  [OVER_QUERY_LIMIT] Text Search, retrying in ${backoff}ms...`);
        await sleep(backoff);
        return textSearch(query, apiKey, retries + 1);
      }
      return { error: "OVER_QUERY_LIMIT", results: [] };
    } else if (data.status === "REQUEST_DENIED") {
      throw new Error(`REQUEST_DENIED: ${data.error_message || "Check API key"}`);
    } else {
      return { error: data.status, results: [] };
    }
  } catch (err) {
    if (err.message.includes("REQUEST_DENIED")) throw err;
    if (retries < MAX_RETRIES) {
      const backoff = RETRY_BASE_MS * Math.pow(2, retries);
      console.warn(`  [NETWORK] Text Search error: ${err.message}, retrying in ${backoff}ms...`);
      await sleep(backoff);
      return textSearch(query, apiKey, retries + 1);
    }
    return { error: "NETWORK_ERROR", results: [] };
  }
}

/**
 * Place Details: get full info for a place_id.
 */
async function fetchPlaceDetails(placeId, apiKey, retries = 0) {
  const url = `${PLACE_DETAILS_URL}?place_id=${encodeURIComponent(placeId)}&fields=${PLACE_DETAILS_FIELDS}&key=${apiKey}`;

  try {
    const res = await fetch(url);

    if (res.status === 429 || res.status >= 500) {
      if (retries < MAX_RETRIES) {
        const backoff = RETRY_BASE_MS * Math.pow(2, retries);
        await sleep(backoff);
        return fetchPlaceDetails(placeId, apiKey, retries + 1);
      }
      return null;
    }

    if (!res.ok) return null;

    const data = await res.json();

    if (data.status === "OK") {
      return data.result;
    } else if (data.status === "OVER_QUERY_LIMIT") {
      if (retries < MAX_RETRIES) {
        const backoff = RETRY_BASE_MS * Math.pow(2, retries);
        await sleep(backoff);
        return fetchPlaceDetails(placeId, apiKey, retries + 1);
      }
    } else if (data.status === "REQUEST_DENIED") {
      throw new Error(`REQUEST_DENIED: ${data.error_message || "Check API key"}`);
    }

    return null;
  } catch (err) {
    if (err.message.includes("REQUEST_DENIED")) throw err;
    if (retries < MAX_RETRIES) {
      const backoff = RETRY_BASE_MS * Math.pow(2, retries);
      await sleep(backoff);
      return fetchPlaceDetails(placeId, apiKey, retries + 1);
    }
    return null;
  }
}

// ─── Name Matching ────────────────────────────────────────────────────────────

/**
 * Jaccard word similarity with improvements for healthcare facilities.
 * Uses Unicode-aware tokenizer for Arabic+English names.
 * Strips legal suffixes (LLC, FZ, SPC, etc.) before comparison.
 */
function jaccardSimilarity(a, b) {
  if (!a || !b) return 0;

  const normalize = (s) => {
    let n = s.toLowerCase();
    // Remove legal suffixes
    n = n.replace(/l\.?l\.?c\.?|llc|fz-?llc|fzc|fz|branch|br\b|s\.?p\.?c\.?|spc|w\.?l\.?l\.?|est\.?|co\.?|dmcc|sole proprietorship/gi, "");
    // Normalize healthcare compound words (the Tamani bug)
    n = n.replace(/health\s*care/gi, "healthcare");
    n = n.replace(/poly\s*clinic/gi, "polyclinic");
    n = n.replace(/day\s*surgery/gi, "daysurgery");
    n = n.replace(/eye\s*care/gi, "eyecare");
    n = n.replace(/skin\s*care/gi, "skincare");
    // Normalize centre/center
    n = n.replace(/\bcentre\b/gi, "center");
    // Remove location suffixes Google adds (branch names, mall names)
    n = n.replace(/\s*[-–—|]\s*.+$/, ""); // "Al Jaber Optical - Grove Mall" → "Al Jaber Optical"
    // Remove Arabic text in parentheses or after |
    n = n.replace(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]+/gu, "");
    return n;
  };

  const tokenize = (s) =>
    new Set(
      normalize(s)
        .replace(/[^\p{L}\p{N}\s]/gu, " ")
        .split(/\s+/)
        .filter((w) => w.length > 1)
    );

  const setA = tokenize(a);
  const setB = tokenize(b);
  if (setA.size === 0 || setB.size === 0) return 0;

  let intersection = 0;
  for (const w of setA) {
    if (setB.has(w)) intersection++;
  }

  const jaccard = intersection / (setA.size + setB.size - intersection);

  // Secondary check: if the first distinctive word (brand name) matches,
  // and we have at least some overlap, boost the score.
  // This catches "800Doctor Dmcc" vs "800DOCTOR - Dubai" and similar.
  const wordsA = [...tokenize(a)];
  const wordsB = [...tokenize(b)];
  // Find the first non-generic word in each (skip: al, el, the, dr, clinic, hospital, pharmacy, medical, center, etc.)
  const generic = new Set(['al', 'el', 'the', 'dr', 'clinic', 'clinics', 'hospital', 'pharmacy', 'medical', 'center',
    'healthcare', 'polyclinic', 'general', 'specialist', 'dental', 'optics', 'optical', 'lab', 'laboratory', 'diagnostics',
    // UAE location names — NOT brand names, should not trigger brand match
    'dubai', 'abu', 'dhabi', 'sharjah', 'ajman', 'fujairah', 'khaimah', 'quwain', 'ain', 'barsha', 'karama',
    'jumeirah', 'deira', 'marina', 'jlt', 'silicon', 'oasis', 'village', 'mall', 'tower', 'city', 'garden',
    'creek', 'harbour', 'business', 'bay', 'hills', 'gate', 'springs', 'meadows', 'discovery', 'knowledge',
    'international', 'downtown', 'palm', 'jebel', 'hatta', 'rashidiya', 'mirdif', 'nahda', 'qusais',
    'mamzar', 'satwa', 'hor', 'muteena', 'rigga', 'mankhool', 'bur', 'meena', 'bazaar',
    'mushrif', 'khalidiyah', 'corniche', 'reem', 'saadiyat', 'yas', 'mussafah',
    // Generic business words
    'new', 'modern', 'advanced', 'first', 'best', 'royal', 'golden', 'green', 'star', 'prime', 'plus',
    'group', 'services', 'care', 'home', 'life', 'health', 'wellness', 'beauty', 'aesthetic']);
  const brandA = wordsA.find(w => !generic.has(w) && w.length > 2);
  const brandB = wordsB.find(w => !generic.has(w) && w.length > 2);

  if (brandA && brandB && brandA === brandB && jaccard >= 0.15) {
    // Brand name matches — boost to at least 0.5
    return Math.max(jaccard, 0.5);
  }

  // Also check: if one name starts with the other (containment)
  const shortA = wordsA.slice(0, 3).join(' ');
  const shortB = wordsB.slice(0, 3).join(' ');
  if (shortA.length > 4 && shortB.length > 4 && (shortA.startsWith(shortB) || shortB.startsWith(shortA)) && jaccard >= 0.15) {
    return Math.max(jaccard, 0.5);
  }

  return jaccard;
}

/**
 * Ask Gemini Flash whether two business names refer to the same healthcare facility.
 * Used when Jaccard similarity is below threshold but above reject threshold.
 * Returns { isSame: boolean, confidence: number 0-100 }
 */
async function verifyMatchWithLLM(dbName, dbCity, dbCategory, googleName, googleAddress) {
  if (OPENROUTER_KEYS.length === 0) return { isSame: false, confidence: 0, reason: "no_api_key" };

  const prompt = `You are verifying healthcare provider data in the UAE. Determine if these two entries refer to the SAME real-world business.

Entry A (from official DHA/MOHAP register):
  Name: "${dbName}"
  City: ${dbCity}, UAE
  Category: ${dbCategory}

Entry B (from Google Places):
  Name: "${googleName}"
  Address: ${googleAddress || "not provided"}

Rules:
- "Health Care Center" and "Healthcare" are the same thing
- "Centre" and "Center" are the same
- "Polyclinic" and "Poly Clinic" are the same
- Ignore legal suffixes: LLC, L.L.C, FZ, DMCC, SPC, Branch, etc.
- Branch locations of the same company count as the same business
- A clinic and a pharmacy with the same area name (e.g., "Al Barsha Clinic" vs "Al Barsha Pharmacy") are DIFFERENT businesses
- Numbers matter: "800pharma1" and "800 PHARMA" are the same, but "Clinic 1" and "Clinic 2" are different
- "A C E Opticals" and "ACE OPTICAL" are the same (spaced-out acronym vs concatenated)
- "911 Solomed Clinic" and "911Solomed polyclinic" are the same (spaces in numbers, clinic/polyclinic equivalent)

Reply ONLY with valid JSON, no markdown:
{"same": true/false, "confidence": 0-100, "reason": "brief explanation"}`;

  try {
    const res = await fetch(LLM_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${getNextLLMKey()}`,
        "HTTP-Referer": "https://www.zavis.ai",
        "X-Title": "Zavis Provider Data Verification",
      },
      body: JSON.stringify({
        model: LLM_MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0,
        max_tokens: 100,
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.warn(`  [LLM] HTTP ${res.status}: ${errText.slice(0, 100)}`);
      return { isSame: false, confidence: 0, reason: `http_${res.status}` };
    }

    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content || "";
    const cleaned = text.replace(/```json\s*|```/g, "").trim();

    try {
      const parsed = JSON.parse(cleaned);
      return {
        isSame: parsed.same === true,
        confidence: parsed.confidence || 0,
        reason: parsed.reason || "",
      };
    } catch {
      // Try to extract yes/no from freeform text
      const lower = text.toLowerCase();
      if (lower.includes('"same": true') || lower.includes('"same":true')) {
        return { isSame: true, confidence: 70, reason: "parsed_from_text" };
      }
      console.warn(`  [LLM] Unparseable: ${text.slice(0, 100)}`);
      return { isSame: false, confidence: 0, reason: "parse_error" };
    }
  } catch (err) {
    console.warn(`  [LLM] Error: ${err.message}`);
    return { isSame: false, confidence: 0, reason: "network_error" };
  }
}

/**
 * Check if a Google Places result is geographically within the UAE.
 * UAE bounding box: roughly 22.5-26.5 N, 51-56.5 E (with generous padding).
 * Returns false if clearly outside the UAE (e.g., UK, India, etc.)
 */
function isInUAERegion(result) {
  const loc = result.geometry?.location;
  if (!loc) return true; // No coords — give benefit of the doubt
  const distKm = haversineMeters(UAE_CENTER_LAT, UAE_CENTER_LNG, loc.lat, loc.lng) / 1000;
  return distKm < UAE_GEO_REJECT_KM;
}

/**
 * Pick the best matching result from Google Places Text Search results.
 * Filters out results that are clearly outside the UAE.
 * Returns { result, similarity } or null if no acceptable match.
 */
function findBestMatch(providerName, results) {
  if (!results || results.length === 0) return null;

  // First pass: filter to UAE-region results only
  const uaeResults = results.filter(isInUAERegion);

  // If no UAE results, fall back to all results but log a warning
  const candidates = uaeResults.length > 0 ? uaeResults : results;

  let bestResult = null;
  let bestSimilarity = -1;

  for (const result of candidates) {
    const sim = jaccardSimilarity(providerName, result.name);
    if (sim > bestSimilarity) {
      bestSimilarity = sim;
      bestResult = result;
    }
  }

  if (!bestResult) return null;

  // Final geo check: if the best match is outside UAE and we had no UAE results,
  // mark it with a flag so the caller can handle it
  const geoOk = isInUAERegion(bestResult);

  return {
    result: bestResult,
    similarity: bestSimilarity,
    outsideUAE: !geoOk,
  };
}

// ─── Domain + Phone Comparison ────────────────────────────────────────────────

function extractDomain(url) {
  if (!url) return "";
  try {
    return new URL(url.startsWith("http") ? url : "https://" + url)
      .hostname.replace(/^www\./, "")
      .toLowerCase();
  } catch {
    return url
      .toLowerCase()
      .replace(/^(https?:\/\/)?(www\.)?/, "")
      .split("/")[0];
  }
}

function normalizePhone(phone) {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 0) return "";
  // Take last 9 digits — covers +971-X-XXXXXXX, 0X-XXXXXXX, etc.
  return digits.slice(-9);
}

// ─── Haversine Distance ──────────────────────────────────────────────────────

function haversineMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Operating Hours Parser ───────────────────────────────────────────────────

function parseOperatingHours(openingHours) {
  if (!openingHours || !openingHours.weekday_text) return null;

  const hours = {};
  for (const entry of openingHours.weekday_text) {
    const colonIdx = entry.indexOf(": ");
    if (colonIdx === -1) continue;

    const day = entry.slice(0, colonIdx).trim();
    const timeStr = entry.slice(colonIdx + 2).trim();

    if (timeStr.toLowerCase() === "closed") {
      hours[day] = { open: "Closed", close: "Closed" };
    } else if (timeStr.toLowerCase() === "open 24 hours") {
      hours[day] = { open: "12:00 AM", close: "11:59 PM" };
    } else {
      const parts = timeStr.split(/\s*[–\-]\s*/);
      if (parts.length === 2) {
        hours[day] = { open: parts[0].trim(), close: parts[1].trim() };
      } else {
        const allParts = timeStr.split(/\s*,\s*/);
        if (allParts.length > 0) {
          const firstPeriod = allParts[0].split(/\s*[–\-]\s*/);
          const lastPeriod = allParts[allParts.length - 1].split(/\s*[–\-]\s*/);
          hours[day] = {
            open: firstPeriod[0]?.trim() || timeStr,
            close: lastPeriod[lastPeriod.length - 1]?.trim() || timeStr,
          };
        }
      }
    }
  }

  return Object.keys(hours).length > 0 ? hours : null;
}

// ─── Checkpoint ───────────────────────────────────────────────────────────────

function loadCheckpoint() {
  try {
    if (existsSync(CHECKPOINT_PATH)) {
      return JSON.parse(readFileSync(CHECKPOINT_PATH, "utf8"));
    }
  } catch (err) {
    console.warn(`  Warning: could not load checkpoint: ${err.message}`);
  }
  return null;
}

function saveCheckpoint(data) {
  try {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
    writeFileSync(CHECKPOINT_PATH, JSON.stringify(data, null, 2));
  } catch (err) {
    console.warn(`  Warning: could not save checkpoint: ${err.message}`);
  }
}

function saveReport(data) {
  try {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
    writeFileSync(REPORT_PATH, JSON.stringify(data, null, 2));
  } catch (err) {
    console.warn(`  Warning: could not save report: ${err.message}`);
  }
}

function saveMismatches(mismatches) {
  try {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

    const header = "provider_id,provider_name,city_slug,category_slug,google_name,similarity,current_website,google_website,current_phone,google_phone\n";
    const rows = mismatches.map((m) => {
      const esc = (s) => `"${(s || "").replace(/"/g, '""')}"`;
      return [
        esc(m.provider_id),
        esc(m.provider_name),
        esc(m.city_slug),
        esc(m.category_slug),
        esc(m.google_name),
        m.similarity.toFixed(4),
        esc(m.current_website),
        esc(m.google_website),
        esc(m.current_phone),
        esc(m.google_phone),
      ].join(",");
    });

    writeFileSync(MISMATCHES_PATH, header + rows.join("\n"));
    console.log(`  Mismatches CSV saved: ${MISMATCHES_PATH} (${mismatches.length} rows)`);
  } catch (err) {
    console.warn(`  Warning: could not save mismatches CSV: ${err.message}`);
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  loadEnv();
  const opts = parseArgs();

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    console.error("GOOGLE_PLACES_API_KEY is not set. Set via env var or .env.local");
    process.exit(1);
  }

  // ── Banner ──────────────────────────────────────────────────────────────────

  console.log();
  console.log("╔══════════════════════════════════════════════════════════════════╗");
  console.log("║   UAE Provider Re-Enrichment — Google Places Verification       ║");
  console.log("╚══════════════════════════════════════════════════════════════════╝");
  console.log();
  console.log(`  Mode:     ${opts.live ? "LIVE (will update DB)" : "DRY RUN (no DB changes)"}`);
  console.log(`  City:     ${opts.city || "ALL UAE cities"}`);
  console.log(`  Limit:    ${opts.limit || "none"}`);
  console.log(`  Offset:   ${opts.offset}`);
  console.log(`  Resume:   ${opts.resume}`);
  console.log();

  // ── Load providers ──────────────────────────────────────────────────────────

  console.log("Querying UAE providers from database...");
  let providers = await getUAEProviders(opts.city, opts.onlyMissingPlaceId);
  console.log(`  Found ${providers.length} UAE providers${opts.city ? ` in ${opts.city}` : ""}`);

  // Apply offset
  let resumeIndex = opts.offset;
  if (opts.resume) {
    const checkpoint = loadCheckpoint();
    if (checkpoint && checkpoint.lastProcessedIndex !== undefined) {
      resumeIndex = checkpoint.lastProcessedIndex + 1;
      console.log(`  Resuming from checkpoint: index ${resumeIndex} (${checkpoint.lastProviderName || "?"})`);
    } else {
      console.log("  No checkpoint found — starting from beginning");
    }
  }

  if (resumeIndex > 0) {
    providers = providers.slice(resumeIndex);
    console.log(`  After offset/resume: ${providers.length} providers remaining`);
  }

  if (opts.limit) {
    providers = providers.slice(0, opts.limit);
    console.log(`  After --limit: processing ${providers.length} providers`);
  }

  if (providers.length === 0) {
    console.log("\nNo providers to process. Exiting.");
    await cleanup();
    return;
  }

  // ── Cost estimate ───────────────────────────────────────────────────────────

  const estimatedTextCost = providers.length * TEXT_SEARCH_COST;
  const estimatedDetailsCost = providers.length * PLACE_DETAILS_COST;
  const totalEstimatedCost = estimatedTextCost + estimatedDetailsCost;
  console.log();
  console.log(`  Estimated cost:`);
  console.log(`    Text Search:   ${providers.length} x $${TEXT_SEARCH_COST} = ~$${estimatedTextCost.toFixed(2)}`);
  console.log(`    Place Details: ${providers.length} x $${PLACE_DETAILS_COST} = ~$${estimatedDetailsCost.toFixed(2)}`);
  console.log(`    Total:         ~$${totalEstimatedCost.toFixed(2)}`);
  console.log();

  // ── Backup ──────────────────────────────────────────────────────────────────

  if (opts.live) {
    console.log("Creating database backup before writes...");
    const backupTable = await createBackup();
    console.log(`  Backup table: ${backupTable}`);
    console.log();
  }

  // ── Process ─────────────────────────────────────────────────────────────────

  const startTime = Date.now();
  const totalToProcess = providers.length;
  const globalOffset = resumeIndex; // For display purposes

  // Counters
  const stats = {
    total: totalToProcess,
    matched: 0,
    unmatched: 0,
    noGoogleResult: 0,
    apiErrors: 0,
    placeIdSaved: 0,
    websiteChanged: 0,
    phoneChanged: 0,
    ratingUpdated: 0,
    locationUpdated: 0,
    hoursUpdated: 0,
    photoUpdated: 0,
    textSearchCalls: 0,
    placeDetailsCalls: 0,
  };

  const mismatches = [];
  const changes = []; // Log of all changes made

  for (let i = 0; i < providers.length; i++) {
    const provider = providers[i];
    const displayIdx = globalOffset + i + 1;
    const displayTotal = globalOffset + totalToProcess;

    try {
      // ── Step 1: Text Search ─────────────────────────────────────────────────

      const query = `${provider.name}, ${provider.city_slug.replace(/-/g, " ")}, UAE`;
      stats.textSearchCalls++;

      const searchResult = await textSearch(query, apiKey);

      if (searchResult.error) {
        stats.apiErrors++;
        console.log(`[${displayIdx}/${displayTotal}] ${provider.name} (${provider.city_slug}, ${provider.category_slug})`);
        console.log(`  Text Search: ERROR — ${searchResult.error}`);
        await sleep(RATE_LIMIT_MS);
        continue;
      }

      if (searchResult.results.length === 0) {
        stats.noGoogleResult++;
        console.log(`[${displayIdx}/${displayTotal}] ${provider.name} (${provider.city_slug}, ${provider.category_slug})`);
        console.log(`  Text Search: NO RESULTS`);

        // No Google result means we can't verify existing data — clear unverified fields
        if (opts.live && (provider.website || provider.google_rating || provider.google_photo_url)) {
          await pool.query(`
            UPDATE providers SET
              website = NULL,
              google_rating = NULL,
              google_review_count = NULL,
              google_photo_url = NULL,
              google_reviews_last_fetched = NULL
            WHERE id = $1
          `, [provider.id]);
          console.log(`  → CLEARED unverified data (no Google result to verify against)`);
        }

        mismatches.push({
          provider_id: provider.id,
          provider_name: provider.name,
          city_slug: provider.city_slug,
          category_slug: provider.category_slug,
          google_name: "",
          similarity: 0,
          current_website: provider.website || "",
          google_website: "",
          current_phone: provider.phone || "",
          google_phone: "",
          action: "cleared_no_google_result",
        });
        await sleep(RATE_LIMIT_MS);
        continue;
      }

      // ── Step 2: Verify name match ───────────────────────────────────────────

      const bestMatch = findBestMatch(provider.name, searchResult.results);

      if (!bestMatch) {
        stats.noGoogleResult++;
        await sleep(RATE_LIMIT_MS);
        continue;
      }

      const { result: googleResult, similarity, outsideUAE } = bestMatch;

      // Log every provider
      const geoFlag = outsideUAE ? " [OUTSIDE UAE]" : "";
      const simSymbol = similarity >= SIMILARITY_THRESHOLD && !outsideUAE ? "\u2713" : "\u2717 UNMATCHED";
      console.log(`[${displayIdx}/${displayTotal}] ${provider.name} (${provider.city_slug}, ${provider.category_slug})`);
      console.log(`  Text Search: found "${googleResult.name}" — similarity: ${similarity.toFixed(2)} ${simSymbol}${geoFlag}`);

      // Reject if outside UAE even if name matches — it's a different branch/business
      if (outsideUAE) {
        stats.unmatched++;
        console.log(`  → Skipped: result is outside UAE region (wrong country)`);

        // Clear unverified fields — can't trust data from wrong-country match
        if (opts.live && (provider.website || provider.google_rating || provider.google_photo_url)) {
          await pool.query(`
            UPDATE providers SET
              website = NULL,
              google_rating = NULL,
              google_review_count = NULL,
              google_photo_url = NULL,
              google_reviews_last_fetched = NULL
            WHERE id = $1
          `, [provider.id]);
          console.log(`  → CLEARED unverified data (Google result was outside UAE)`);
        }

        mismatches.push({
          provider_id: provider.id,
          provider_name: provider.name,
          city_slug: provider.city_slug,
          category_slug: provider.category_slug,
          google_name: googleResult.name + " [OUTSIDE UAE]",
          similarity,
          current_website: provider.website || "",
          google_website: "",
          current_phone: provider.phone || "",
          google_phone: "",
          action: "cleared_outside_uae",
        });
        await sleep(RATE_LIMIT_MS);
        continue;
      }

      // ── LLM verification for EVERY match — no Jaccard threshold ─────────
      const llmResult = await verifyMatchWithLLM(
        provider.name, provider.city_slug, provider.category_slug,
        googleResult.name, googleResult.formatted_address || ""
      );

      if (!llmResult.isSame || llmResult.confidence < 60) {
        stats.unmatched++;
        const verdict = llmResult.isSame
          ? `YES but low confidence (${llmResult.confidence}%)`
          : `NO (${llmResult.confidence}%) — ${llmResult.reason}`;
        console.log(`  → LLM says: ${verdict}`);

        // CRITICAL: If we can't verify this provider, the existing website/phone/rating
        // data came from the original blind-match script and CANNOT be trusted.
        // Clear all Google-sourced fields to prevent showing wrong data.
        if (opts.live) {
          const oldWebsite = provider.website || "";
          const oldPhone = provider.phone || "";
          const oldRating = provider.google_rating;
          const oldPhoto = provider.google_photo_url;

          await pool.query(`
            UPDATE providers SET
              website = NULL,
              google_rating = NULL,
              google_review_count = NULL,
              google_photo_url = NULL,
              google_reviews_last_fetched = NULL
            WHERE id = $1
          `, [provider.id]);

          const cleared = [];
          if (oldWebsite) cleared.push(`website: ${oldWebsite}`);
          if (oldPhone) cleared.push(`phone kept (from official register)`);
          if (oldRating) cleared.push(`rating: ${oldRating}`);
          if (oldPhoto) cleared.push(`photo`);
          if (cleared.length > 0) {
            console.log(`  → CLEARED unverified data: ${cleared.join(', ')}`);
            stats.websiteChanged = (stats.websiteChanged || 0) + (oldWebsite ? 1 : 0);
          }
        }

        console.log(`  → Unmatched — unverified Google data cleared from DB`);
        mismatches.push({
          provider_id: provider.id,
          provider_name: provider.name,
          city_slug: provider.city_slug,
          category_slug: provider.category_slug,
          google_name: googleResult.name,
          similarity,
          current_website: provider.website || "",
          google_website: googleResult.website || "",
          current_phone: provider.phone || "",
          google_phone: "",
          llm_verified: "rejected",
          llm_confidence: llmResult.confidence,
          llm_reason: llmResult.reason,
          action: "cleared_unverified_data",
        });
        await sleep(RATE_LIMIT_MS);
        continue;
      }

      console.log(`  → LLM verified: YES (${llmResult.confidence}%) — "${llmResult.reason}"`);

      // ── Step 3: Place Details ───────────────────────────────────────────────

      const placeId = googleResult.place_id;
      await sleep(RATE_LIMIT_MS);

      stats.placeDetailsCalls++;
      const details = await fetchPlaceDetails(placeId, apiKey);

      if (!details) {
        stats.apiErrors++;
        console.log(`  Place Details: FAILED for ${placeId}`);
        // Still count as matched (we verified the name), just can't get details
        stats.matched++;
        await sleep(RATE_LIMIT_MS);
        continue;
      }

      stats.matched++;

      // ── Step 4: Compare and build update ────────────────────────────────────

      const updateData = {};
      const changeLog = { providerId: provider.id, providerName: provider.name, changes: [] };

      // Always save google_place_id
      if (!provider.google_place_id || provider.google_place_id !== placeId) {
        updateData.google_place_id = placeId;
        stats.placeIdSaved++;
        console.log(`  Place ID: ${placeId} — saved`);
      }

      // Website comparison
      const dbDomain = extractDomain(provider.website);
      const googleDomain = extractDomain(details.website);

      if (details.website) {
        if (!provider.website) {
          // No website on file — take Google's
          updateData.website = details.website;
          stats.websiteChanged++;
          changeLog.changes.push(`website: (empty) → ${details.website}`);
          console.log(`  Website: (empty) → ${googleDomain} ← ADDED`);
        } else if (dbDomain && googleDomain && dbDomain !== googleDomain) {
          // Different domain — use Google's (the old script probably assigned wrong one)
          updateData.website = details.website;
          stats.websiteChanged++;
          changeLog.changes.push(`website: ${provider.website} → ${details.website}`);
          console.log(`  Website: ${dbDomain} → ${googleDomain} ← CHANGED`);
        } else {
          console.log(`  Website: ${dbDomain || "(empty)"} — matches \u2713`);
        }
      } else {
        console.log(`  Website: ${dbDomain || "(empty)"} — Google has none`);
      }

      // Phone comparison
      const googlePhone =
        details.international_phone_number || details.formatted_phone_number || "";
      const dbPhoneNorm = normalizePhone(provider.phone);
      const googlePhoneNorm = normalizePhone(googlePhone);

      if (googlePhone) {
        if (!provider.phone) {
          updateData.phone = googlePhone;
          stats.phoneChanged++;
          changeLog.changes.push(`phone: (empty) → ${googlePhone}`);
          console.log(`  Phone: (empty) → ${googlePhone} ← ADDED`);
        } else if (dbPhoneNorm && googlePhoneNorm && dbPhoneNorm !== googlePhoneNorm) {
          updateData.phone = googlePhone;
          stats.phoneChanged++;
          changeLog.changes.push(`phone: ${provider.phone} → ${googlePhone}`);
          console.log(`  Phone: ${provider.phone} → ${googlePhone} ← CHANGED`);
        } else {
          console.log(`  Phone: ${provider.phone || "(empty)"} — matches \u2713`);
        }
      } else {
        console.log(`  Phone: ${provider.phone || "(empty)"} — Google has none`);
      }

      // Rating + reviews
      if (details.rating != null) {
        updateData.google_rating = details.rating;
        updateData.google_review_count = details.user_ratings_total || 0;
        stats.ratingUpdated++;
        console.log(`  Rating: ${details.rating} (${details.user_ratings_total || 0} reviews) — updated`);
      }

      // Location drift check
      // Treat (0,0) as empty — many providers have junk "null island" coords
      const hasValidCoords =
        provider.latitude &&
        provider.longitude &&
        parseFloat(provider.latitude) !== 0 &&
        parseFloat(provider.longitude) !== 0;

      if (details.geometry?.location && hasValidCoords) {
        const distance = haversineMeters(
          parseFloat(provider.latitude),
          parseFloat(provider.longitude),
          details.geometry.location.lat,
          details.geometry.location.lng
        );

        if (distance > LOCATION_DRIFT_THRESHOLD_M) {
          updateData.latitude = details.geometry.location.lat;
          updateData.longitude = details.geometry.location.lng;
          stats.locationUpdated++;
          changeLog.changes.push(`location: moved ${Math.round(distance)}m`);
          console.log(`  Location: drifted ${Math.round(distance)}m — updated`);
        }
      } else if (details.geometry?.location && !hasValidCoords) {
        updateData.latitude = details.geometry.location.lat;
        updateData.longitude = details.geometry.location.lng;
        stats.locationUpdated++;
        console.log(`  Location: was empty/zero — filled from Google`);
      }

      // Operating hours
      const parsedHours = parseOperatingHours(details.opening_hours);
      if (parsedHours) {
        updateData.operating_hours = parsedHours;
        stats.hoursUpdated++;
      }

      // Photo
      if (details.photos && details.photos.length > 0) {
        const photoRef = details.photos[0].photo_reference;
        if (photoRef) {
          updateData.google_photo_url = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${photoRef}&key=${apiKey}`;
          stats.photoUpdated++;
        }
      }

      // ── Step 5: Update DB ─────────────────────────────────────────────────

      if (opts.live && Object.keys(updateData).length > 0) {
        await updateProvider(provider.id, updateData);
      }

      if (changeLog.changes.length > 0) {
        changes.push(changeLog);
      }

      await sleep(RATE_LIMIT_MS);
    } catch (err) {
      stats.apiErrors++;
      console.log(`[${displayIdx}/${displayTotal}] ${provider.name} (${provider.city_slug}, ${provider.category_slug})`);
      console.log(`  ERROR: ${err.message}`);

      // Fatal errors — bail
      if (err.message.includes("REQUEST_DENIED")) {
        console.error("\nFATAL: API key denied. Stopping immediately.");
        break;
      }
    }

    // ── Checkpoint ────────────────────────────────────────────────────────────

    if ((i + 1) % CHECKPOINT_INTERVAL === 0 || i === providers.length - 1) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
      const rate = ((i + 1) / (elapsed || 1)).toFixed(1);
      const eta = ((providers.length - i - 1) / (rate || 1)).toFixed(0);

      saveCheckpoint({
        lastProcessedIndex: globalOffset + i,
        lastProviderName: provider.name,
        timestamp: new Date().toISOString(),
        stats: { ...stats },
        progress: `${i + 1}/${providers.length}`,
        elapsedSeconds: parseInt(elapsed),
        ratePerSecond: parseFloat(rate),
        etaSeconds: parseInt(eta),
      });

      if ((i + 1) % CHECKPOINT_INTERVAL === 0) {
        console.log();
        console.log(`  ── Checkpoint ${i + 1}/${providers.length} | ${elapsed}s elapsed | ~${rate}/s | ETA: ${eta}s ──`);
        console.log(`  Matched: ${stats.matched} | Unmatched: ${stats.unmatched} | No result: ${stats.noGoogleResult} | Errors: ${stats.apiErrors}`);
        console.log();
      }
    }
  }

  // ── Save outputs ────────────────────────────────────────────────────────────

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const actualTextCost = (stats.textSearchCalls * TEXT_SEARCH_COST).toFixed(2);
  const actualDetailsCost = (stats.placeDetailsCalls * PLACE_DETAILS_COST).toFixed(2);
  const actualTotalCost = (
    stats.textSearchCalls * TEXT_SEARCH_COST +
    stats.placeDetailsCalls * PLACE_DETAILS_COST
  ).toFixed(2);

  const report = {
    timestamp: new Date().toISOString(),
    mode: opts.live ? "LIVE" : "DRY_RUN",
    city: opts.city || "ALL",
    stats,
    cost: {
      textSearch: `$${actualTextCost}`,
      placeDetails: `$${actualDetailsCost}`,
      total: `$${actualTotalCost}`,
    },
    elapsedSeconds: parseFloat(elapsed),
    changes,
  };

  saveReport(report);
  saveMismatches(mismatches);

  // ── Summary ─────────────────────────────────────────────────────────────────

  const matchRate = stats.total > 0
    ? ((stats.matched / stats.total) * 100).toFixed(1)
    : "0.0";
  const unmatchRate = stats.total > 0
    ? (((stats.unmatched + stats.noGoogleResult) / stats.total) * 100).toFixed(1)
    : "0.0";

  console.log();
  console.log("╔══════════════════════════════════════════════════════════════════╗");
  console.log("║            UAE Provider Re-Enrichment Complete                  ║");
  console.log("╚══════════════════════════════════════════════════════════════════╝");
  console.log();
  console.log(`  Total providers:              ${stats.total}`);
  console.log(`  Matched (>= ${SIMILARITY_THRESHOLD}):           ${stats.matched} (${matchRate}%)`);
  console.log(`    - Place ID saved:           ${stats.placeIdSaved}`);
  console.log(`    - Website changed:          ${stats.websiteChanged}`);
  console.log(`    - Phone changed:            ${stats.phoneChanged}`);
  console.log(`    - Rating updated:           ${stats.ratingUpdated}`);
  console.log(`    - Location updated:         ${stats.locationUpdated}`);
  console.log(`    - Hours updated:            ${stats.hoursUpdated}`);
  console.log(`    - Photo updated:            ${stats.photoUpdated}`);
  console.log(`  Unmatched (< ${SIMILARITY_THRESHOLD}):           ${stats.unmatched} (flagged for manual review)`);
  console.log(`  No Google result:             ${stats.noGoogleResult}`);
  console.log(`  API errors:                   ${stats.apiErrors}`);
  console.log();
  console.log(`  API calls:`);
  console.log(`    Text Search:                ${stats.textSearchCalls}`);
  console.log(`    Place Details:              ${stats.placeDetailsCalls}`);
  console.log(`  Cost:`);
  console.log(`    Text Search:                ~$${actualTextCost}`);
  console.log(`    Place Details:              ~$${actualDetailsCost}`);
  console.log(`    Total:                      ~$${actualTotalCost}`);
  console.log();
  console.log(`  Time elapsed:                 ${elapsed}s`);
  console.log(`  Mode:                         ${opts.live ? "LIVE — DB was updated" : "DRY RUN — no changes made"}`);
  console.log();
  console.log(`  Reports:`);
  console.log(`    Full report:    ${REPORT_PATH}`);
  console.log(`    Mismatches CSV: ${MISMATCHES_PATH}`);
  console.log(`    Checkpoint:     ${CHECKPOINT_PATH}`);
  console.log();

  if (!opts.live && stats.total > 0) {
    console.log("  ⚠  This was a DRY RUN. To apply changes, re-run with --live");
    console.log();
  }

  await cleanup();
}

// ─── Run ──────────────────────────────────────────────────────────────────────

main().catch(async (err) => {
  console.error("Fatal error:", err);
  await cleanup();
  process.exit(1);
});
