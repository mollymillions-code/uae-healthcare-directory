#!/usr/bin/env node
/**
 * GCC Provider Re-Enrichment via Google Places API
 * -------------------------------------------------
 * Re-verifies and enriches GCC provider records (Qatar, Saudi Arabia, Bahrain,
 * Kuwait) against Google Places -- using the two-step verification pipeline from
 * docs/google-places-scraping-guide.md.
 *
 * For each provider:
 *   1. Text Search  -> find Google Places candidates
 *   2. LLM Verify   -> Gemini 3.1 Flash Lite Preview confirms EVERY match
 *   3. Place Details -> get full contact/rating/photo data for verified match
 *   4. Compare + Update -> log all changes, only update verified fields
 *
 * Processing is done in TRUE parallel batches (BATCH_SIZE providers at once)
 * with round-robin OpenRouter keys for Gemini calls.
 *
 * Safety rules (from the guide):
 *   - NEVER update name, category_id, city_id, area_id, license_number, insurance
 *   - ALWAYS save google_place_id for verified matches
 *   - Log every field change (old -> new)
 *   - Create DB backup before any writes
 *   - LLM verification for every single match
 *   - Output mismatches CSV for manual review
 *   - Mark permanently closed businesses as inactive
 *
 * Must run ON EC2 where the database is at localhost:5432.
 *
 * Usage:
 *   GOOGLE_PLACES_API_KEY=<key> OPENROUTER_KEY=<key> node scripts/re-enrich-gcc-providers.mjs --country sa --dry-run
 *   GOOGLE_PLACES_API_KEY=<key> OPENROUTER_KEY=<key> node scripts/re-enrich-gcc-providers.mjs --country sa --live
 *   GOOGLE_PLACES_API_KEY=<key> OPENROUTER_KEY=<key> node scripts/re-enrich-gcc-providers.mjs --country qa --live --limit 100
 *   GOOGLE_PLACES_API_KEY=<key> OPENROUTER_KEY=<key> node scripts/re-enrich-gcc-providers.mjs --country bh --live --resume
 *   GOOGLE_PLACES_API_KEY=<key> OPENROUTER_KEY=<key> node scripts/re-enrich-gcc-providers.mjs --country kw --live --offset 200
 *
 * Outputs:
 *   data/gcc-enrichment-checkpoint-{country}.json  -- progress checkpoint (saved every batch)
 *   data/gcc-enrichment-report-{country}.json      -- full results summary
 *   data/gcc-enrichment-mismatches-{country}.csv   -- unmatched providers for manual review
 */

import pg from "pg";
const { Pool } = pg;
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, "..");
const DATA_DIR = join(PROJECT_ROOT, "data");

// --- GCC Country Configuration -----------------------------------------------

const GCC_COUNTRIES = {
  qa: {
    code: "qa",
    name: "Qatar",
    searchSuffix: "Qatar",
    center: { lat: 25.2854, lng: 51.531 },
    searchRadius: 100000, // 100km -- Qatar is small
    geoRejectKm: 150,
  },
  sa: {
    code: "sa",
    name: "Saudi Arabia",
    searchSuffix: "Saudi Arabia",
    center: { lat: 24.7136, lng: 46.6753 },
    searchRadius: 800000, // 800km -- Saudi Arabia is large
    geoRejectKm: 500,
  },
  bh: {
    code: "bh",
    name: "Bahrain",
    searchSuffix: "Bahrain",
    center: { lat: 26.0667, lng: 50.5577 },
    searchRadius: 50000, // 50km -- Bahrain is very small
    geoRejectKm: 80,
  },
  kw: {
    code: "kw",
    name: "Kuwait",
    searchSuffix: "Kuwait",
    center: { lat: 29.3117, lng: 47.4818 },
    searchRadius: 100000, // 100km
    geoRejectKm: 150,
  },
};

const VALID_COUNTRY_CODES = Object.keys(GCC_COUNTRIES);

// --- Configuration -----------------------------------------------------------

const BATCH_SIZE = 10; // Process 10 providers simultaneously per batch
const GOOGLE_RATE_LIMIT_MS = 100; // 100ms between Google API calls (10 QPS)
const CHECKPOINT_INTERVAL = 50; // Save progress every N providers
const MAX_RETRIES = 3;
const RETRY_BASE_MS = 1000; // Exponential backoff: 1s, 2s, 4s
const LOCATION_DRIFT_THRESHOLD_M = 500; // Update coords if >500m apart

// LLM verification via OpenRouter (Gemini 3.1 Flash Lite Preview)
// Round-robin across multiple keys to parallelize and avoid rate limits
const OPENROUTER_KEYS = [];
for (let i = 0; i <= 20; i++) {
  const key =
    process.env[i === 0 ? "OPENROUTER_KEY" : `OPENROUTER_KEY_${i + 1}`];
  if (key) OPENROUTER_KEYS.push(key);
}
// Also check numbered keys starting from 2
for (let i = 2; i <= 20; i++) {
  const key = process.env[`OPENROUTER_KEY_${i}`];
  if (key && !OPENROUTER_KEYS.includes(key)) OPENROUTER_KEYS.push(key);
}
if (OPENROUTER_KEYS.length === 0) {
  console.error(
    "ERROR: At least one OPENROUTER_KEY* environment variable is required."
  );
  console.error(
    "Set in .env.local on EC2, NOT in code (keys get revoked if committed to git)."
  );
  process.exit(1);
}
let llmKeyIndex = 0;
function getNextLLMKey() {
  const key = OPENROUTER_KEYS[llmKeyIndex % OPENROUTER_KEYS.length];
  llmKeyIndex++;
  return key;
}
console.log(
  `  LLM keys loaded: ${OPENROUTER_KEYS.length} (round-robin for speed)`
);
const LLM_MODEL = "google/gemini-3.1-flash-lite-preview";
const LLM_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

const TEXT_SEARCH_URL =
  "https://maps.googleapis.com/maps/api/place/textsearch/json";
const PLACE_DETAILS_URL =
  "https://maps.googleapis.com/maps/api/place/details/json";
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

// --- File paths (per-country) ------------------------------------------------

function getCheckpointPath(countryCode) {
  return join(DATA_DIR, `gcc-enrichment-checkpoint-${countryCode}.json`);
}
function getReportPath(countryCode) {
  return join(DATA_DIR, `gcc-enrichment-report-${countryCode}.json`);
}
function getMismatchesPath(countryCode) {
  return join(DATA_DIR, `gcc-enrichment-mismatches-${countryCode}.csv`);
}

// --- Environment -------------------------------------------------------------

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
    // .env.local not found -- rely on environment variables
  }
}

// --- CLI args ----------------------------------------------------------------

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    live: false,
    dryRun: true, // default: dry-run
    country: null,
    city: null,
    limit: null,
    offset: 0,
    resume: false,
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
      case "--country":
        opts.country = args[++i]?.toLowerCase() || null;
        if (opts.country && !VALID_COUNTRY_CODES.includes(opts.country)) {
          console.error(
            `Invalid country: ${opts.country}. Valid: ${VALID_COUNTRY_CODES.join(", ")}`
          );
          process.exit(1);
        }
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

  if (!opts.country) {
    console.error(
      "ERROR: --country is required. Specify one of: " +
        VALID_COUNTRY_CODES.join(", ")
    );
    printHelp();
    process.exit(1);
  }

  return opts;
}

function printHelp() {
  console.log(`
GCC Provider Re-Enrichment via Google Places API

Usage:
  GOOGLE_PLACES_API_KEY=<key> OPENROUTER_KEY=<key> node scripts/re-enrich-gcc-providers.mjs [options]

Options:
  --country <code>  REQUIRED. Country code: qa (Qatar), sa (Saudi Arabia), bh (Bahrain), kw (Kuwait)
  --dry-run         Log only, don't update DB (DEFAULT)
  --live            Actually update the database
  --city <slug>     Filter by city slug (e.g., riyadh, jeddah, doha, manama)
  --limit <N>       Process only N providers
  --offset <N>      Skip first N providers
  --resume          Resume from last checkpoint
  -h, --help        Show this help
`);
}

// --- Database ----------------------------------------------------------------

let pool = null;

function getPool() {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is not set. Check .env.local or env vars.");
    }
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 5,
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
 * Create a backup table before any writes. Idempotent -- skips if already exists.
 */
async function createBackup(countryCode) {
  const db = getPool();
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const backupTable = `providers_backup_gcc_${countryCode}_${today}`;

  const check = await db.query(
    `SELECT EXISTS (
       SELECT 1 FROM information_schema.tables
       WHERE table_name = $1
     )`,
    [backupTable]
  );

  if (check.rows[0].exists) {
    console.log(`  Backup table ${backupTable} already exists -- skipping`);
    return backupTable;
  }

  console.log(`  Creating backup: ${backupTable}...`);
  await db.query(
    `CREATE TABLE ${backupTable} AS SELECT * FROM providers WHERE country = $1`,
    [countryCode]
  );
  const count = await db.query(`SELECT COUNT(*) FROM ${backupTable}`);
  console.log(`  Backup created: ${count.rows[0].count} rows`);
  return backupTable;
}

/**
 * Fetch GCC providers for a specific country, optionally filtered by city.
 */
async function getGCCProviders(countryCode, citySlug = null) {
  const db = getPool();

  let query = `
    SELECT
      id, name, slug, phone, website, address, latitude, longitude,
      google_place_id, google_rating, google_review_count, google_photo_url,
      city_slug, category_slug, status
    FROM providers
    WHERE country = $1
  `;
  const params = [countryCode];

  if (citySlug) {
    params.push(citySlug);
    query += ` AND city_slug = $${params.length}`;
  }

  query += ` ORDER BY city_slug, name`;

  const result = await db.query(query, params);
  return result.rows;
}

/**
 * Update a provider with verified Google Places data.
 * NEVER updates: name, category_id, city_id, area_id, license_number, insurance
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
  if (data.status !== undefined) {
    setClauses.push(`status = $${idx++}`);
    values.push(data.status);
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

// --- Google Places API -------------------------------------------------------

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Google API rate limiter: queue-based to enforce 10 QPS across parallel calls
let googleLastCallTime = 0;
const googleCallQueue = [];
let googleQueueRunning = false;

async function throttleGoogleCall() {
  return new Promise((resolve) => {
    googleCallQueue.push(resolve);
    if (!googleQueueRunning) {
      googleQueueRunning = true;
      processGoogleQueue();
    }
  });
}

async function processGoogleQueue() {
  while (googleCallQueue.length > 0) {
    const now = Date.now();
    const elapsed = now - googleLastCallTime;
    if (elapsed < GOOGLE_RATE_LIMIT_MS) {
      await sleep(GOOGLE_RATE_LIMIT_MS - elapsed);
    }
    googleLastCallTime = Date.now();
    const resolve = googleCallQueue.shift();
    resolve();
  }
  googleQueueRunning = false;
}

/**
 * Text Search: find a business on Google Places.
 * Uses country-specific geographic bias.
 * Returns the full results array (up to 20).
 */
async function textSearch(query, apiKey, countryConfig, retries = 0) {
  await throttleGoogleCall();

  const url = `${TEXT_SEARCH_URL}?query=${encodeURIComponent(query)}&location=${countryConfig.center.lat},${countryConfig.center.lng}&radius=${countryConfig.searchRadius}&key=${apiKey}`;

  try {
    const res = await fetch(url);

    if (res.status === 429 || res.status >= 500) {
      if (retries < MAX_RETRIES) {
        const backoff = RETRY_BASE_MS * Math.pow(2, retries);
        console.warn(
          `  [${res.status}] Rate limited on Text Search, retrying in ${backoff}ms...`
        );
        await sleep(backoff);
        return textSearch(query, apiKey, countryConfig, retries + 1);
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
        console.warn(
          `  [OVER_QUERY_LIMIT] Text Search, retrying in ${backoff}ms...`
        );
        await sleep(backoff);
        return textSearch(query, apiKey, countryConfig, retries + 1);
      }
      return { error: "OVER_QUERY_LIMIT", results: [] };
    } else if (data.status === "REQUEST_DENIED") {
      throw new Error(
        `REQUEST_DENIED: ${data.error_message || "Check API key"}`
      );
    } else {
      return { error: data.status, results: [] };
    }
  } catch (err) {
    if (err.message.includes("REQUEST_DENIED")) throw err;
    if (retries < MAX_RETRIES) {
      const backoff = RETRY_BASE_MS * Math.pow(2, retries);
      console.warn(
        `  [NETWORK] Text Search error: ${err.message}, retrying in ${backoff}ms...`
      );
      await sleep(backoff);
      return textSearch(query, apiKey, countryConfig, retries + 1);
    }
    return { error: "NETWORK_ERROR", results: [] };
  }
}

/**
 * Place Details: get full info for a place_id.
 */
async function fetchPlaceDetails(placeId, apiKey, retries = 0) {
  await throttleGoogleCall();

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
      throw new Error(
        `REQUEST_DENIED: ${data.error_message || "Check API key"}`
      );
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

// --- LLM Verification -------------------------------------------------------

/**
 * Ask Gemini Flash whether two business names refer to the same entity.
 * Called for EVERY match -- no pre-filtering step.
 * Returns { isSame: boolean, confidence: number 0-100, reason: string }
 */
async function verifyMatchWithLLM(
  dbName,
  dbCity,
  dbCategory,
  googleName,
  googleAddress,
  countryName
) {
  if (OPENROUTER_KEYS.length === 0)
    return { isSame: false, confidence: 0, reason: "no_api_key" };

  const prompt = `You are verifying healthcare provider data in ${countryName}. Determine if these two entries refer to the SAME real-world business.

Entry A (from official register / internal database):
  Name: "${dbName}"
  City: ${dbCity}, ${countryName}
  Category: ${dbCategory}

Entry B (from Google Places):
  Name: "${googleName}"
  Address: ${googleAddress || "not provided"}

Rules:
- "Health Care Center" and "Healthcare" are the same thing
- "Centre" and "Center" are the same
- "Polyclinic" and "Poly Clinic" are the same
- Ignore legal suffixes: LLC, L.L.C, FZ, DMCC, SPC, WLL, W.L.L, Branch, Est, Co, Ltd, Inc, etc.
- Branch locations of the same company count as the same business
- A clinic and a pharmacy with the same area name (e.g., "Al Barsha Clinic" vs "Al Barsha Pharmacy") are DIFFERENT businesses
- Numbers matter: "800pharma1" and "800 PHARMA" are the same, but "Clinic 1" and "Clinic 2" are different
- "A C E Opticals" and "ACE OPTICAL" are the same (spaced-out acronym vs concatenated)
- "911 Solomed Clinic" and "911Solomed polyclinic" are the same (spaces in numbers, clinic/polyclinic equivalent)
- A gym and a spa in the same building are DIFFERENT businesses
- A restaurant and a catering company with similar names are DIFFERENT businesses

Reply ONLY with valid JSON, no markdown:
{"same": true/false, "confidence": 0-100, "reason": "brief explanation"}`;

  try {
    const res = await fetch(LLM_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getNextLLMKey()}`,
        "HTTP-Referer": "https://www.zavis.ai",
        "X-Title": "Zavis GCC Provider Data Verification",
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

// --- Geographic Verification -------------------------------------------------

/**
 * Check if a Google Places result is geographically within the target country.
 * Uses the country-specific center and rejection radius.
 * Returns false if clearly outside the country.
 */
function isInCountryRegion(result, countryConfig) {
  const loc = result.geometry?.location;
  if (!loc) return true; // No coords -- give benefit of the doubt
  const distKm =
    haversineMeters(
      countryConfig.center.lat,
      countryConfig.center.lng,
      loc.lat,
      loc.lng
    ) / 1000;
  return distKm < countryConfig.geoRejectKm;
}

/**
 * Pick the best candidate from Google Places Text Search results.
 * Filters out results that are clearly outside the target country.
 * Returns the top result (by Google's relevance ranking) that is in-region,
 * or null if no results pass the geographic filter.
 */
function findBestCandidate(results, countryConfig) {
  if (!results || results.length === 0) return null;

  // Filter to country-region results only
  const regionalResults = results.filter((r) =>
    isInCountryRegion(r, countryConfig)
  );

  if (regionalResults.length > 0) {
    // Google ranks by relevance -- take the first in-region result
    return { result: regionalResults[0], outsideCountry: false };
  }

  // All results are outside the country -- flag the best one
  return { result: results[0], outsideCountry: true };
}

// --- Domain + Phone Comparison -----------------------------------------------

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
  // Take last 8 digits -- covers GCC phone formats:
  //   Qatar:  +974-XXXX-XXXX (8 digits)
  //   Saudi:  +966-X-XXX-XXXX (9 digits local)
  //   Bahrain: +973-XXXX-XXXX (8 digits)
  //   Kuwait: +965-XXXX-XXXX (8 digits)
  // Using 8 digits as the common denominator for comparison
  return digits.slice(-8);
}

// --- Haversine Distance ------------------------------------------------------

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

// --- Operating Hours Parser --------------------------------------------------

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
      const parts = timeStr.split(/\s*[--]\s*/);
      if (parts.length === 2) {
        hours[day] = { open: parts[0].trim(), close: parts[1].trim() };
      } else {
        const allParts = timeStr.split(/\s*,\s*/);
        if (allParts.length > 0) {
          const firstPeriod = allParts[0].split(/\s*[--]\s*/);
          const lastPeriod =
            allParts[allParts.length - 1].split(/\s*[--]\s*/);
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

// --- Checkpoint --------------------------------------------------------------

function loadCheckpoint(countryCode) {
  try {
    const path = getCheckpointPath(countryCode);
    if (existsSync(path)) {
      return JSON.parse(readFileSync(path, "utf8"));
    }
  } catch (err) {
    console.warn(`  Warning: could not load checkpoint: ${err.message}`);
  }
  return null;
}

function saveCheckpoint(countryCode, data) {
  try {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
    writeFileSync(
      getCheckpointPath(countryCode),
      JSON.stringify(data, null, 2)
    );
  } catch (err) {
    console.warn(`  Warning: could not save checkpoint: ${err.message}`);
  }
}

function saveReport(countryCode, data) {
  try {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
    writeFileSync(getReportPath(countryCode), JSON.stringify(data, null, 2));
  } catch (err) {
    console.warn(`  Warning: could not save report: ${err.message}`);
  }
}

function saveMismatches(countryCode, mismatches) {
  try {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

    const header =
      "provider_id,provider_name,city_slug,category_slug,google_name,llm_confidence,current_website,google_website,current_phone,google_phone,action\n";
    const rows = mismatches.map((m) => {
      const esc = (s) => `"${(s || "").replace(/"/g, '""')}"`;
      return [
        esc(m.provider_id),
        esc(m.provider_name),
        esc(m.city_slug),
        esc(m.category_slug),
        esc(m.google_name),
        m.llm_confidence ?? 0,
        esc(m.current_website),
        esc(m.google_website),
        esc(m.current_phone),
        esc(m.google_phone),
        esc(m.action || ""),
      ].join(",");
    });

    const path = getMismatchesPath(countryCode);
    writeFileSync(path, header + rows.join("\n"));
    console.log(`  Mismatches CSV saved: ${path} (${mismatches.length} rows)`);
  } catch (err) {
    console.warn(`  Warning: could not save mismatches CSV: ${err.message}`);
  }
}

// --- Single Provider Enrichment (called in parallel) -------------------------

/**
 * Enrich a single provider: Text Search -> LLM Verify -> Place Details -> DB Update.
 * Returns a result object with stats and optional mismatch/change data.
 */
async function enrichProvider(provider, apiKey, countryConfig, opts) {
  const result = {
    status: "ok", // ok | error | no_result | unmatched | outside_country
    matched: false,
    mismatch: null,
    changeLog: null,
    statsUpdate: {
      textSearchCalls: 0,
      placeDetailsCalls: 0,
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
      markedInactive: 0,
    },
    logs: [], // Collected log lines to print after batch completes
  };

  const log = (msg) => result.logs.push(msg);

  try {
    // -- Step 1: Text Search --------------------------------------------------

    const query = `${provider.name}, ${provider.city_slug.replace(/-/g, " ")}, ${countryConfig.searchSuffix}`;
    result.statsUpdate.textSearchCalls++;

    const searchResult = await textSearch(query, apiKey, countryConfig);

    if (searchResult.error) {
      result.status = "error";
      result.statsUpdate.apiErrors++;
      log(
        `  ${provider.name} (${provider.city_slug}, ${provider.category_slug})`
      );
      log(`    Text Search: ERROR -- ${searchResult.error}`);
      return result;
    }

    if (searchResult.results.length === 0) {
      result.status = "no_result";
      result.statsUpdate.noGoogleResult++;
      log(
        `  ${provider.name} (${provider.city_slug}, ${provider.category_slug})`
      );
      log(`    Text Search: NO RESULTS`);

      // No Google result means we can't verify existing data -- clear unverified fields
      if (
        opts.live &&
        (provider.website || provider.google_rating || provider.google_photo_url)
      ) {
        await getPool().query(
          `
            UPDATE providers SET
              website = NULL,
              google_rating = NULL,
              google_review_count = NULL,
              google_photo_url = NULL,
              google_reviews_last_fetched = NULL
            WHERE id = $1
          `,
          [provider.id]
        );
        log(`    -> CLEARED unverified data (no Google result to verify against)`);
      }

      result.mismatch = {
        provider_id: provider.id,
        provider_name: provider.name,
        city_slug: provider.city_slug,
        category_slug: provider.category_slug,
        google_name: "",
        llm_confidence: 0,
        current_website: provider.website || "",
        google_website: "",
        current_phone: provider.phone || "",
        google_phone: "",
        action: "cleared_no_google_result",
      };
      return result;
    }

    // -- Step 2: Pick best candidate by Google relevance, then LLM verify -----

    const bestCandidate = findBestCandidate(
      searchResult.results,
      countryConfig
    );

    if (!bestCandidate) {
      result.status = "no_result";
      result.statsUpdate.noGoogleResult++;
      return result;
    }

    const { result: googleResult, outsideCountry } = bestCandidate;

    log(
      `  ${provider.name} (${provider.city_slug}, ${provider.category_slug})`
    );
    log(
      `    Text Search: found "${googleResult.name}"${outsideCountry ? ` [OUTSIDE ${countryConfig.name.toUpperCase()}]` : ""}`
    );

    // Reject if outside country -- wrong branch/business
    if (outsideCountry) {
      result.status = "outside_country";
      result.statsUpdate.unmatched++;
      log(
        `    -> Skipped: result is outside ${countryConfig.name} region (wrong country)`
      );

      // Clear unverified fields
      if (
        opts.live &&
        (provider.website || provider.google_rating || provider.google_photo_url)
      ) {
        await getPool().query(
          `
            UPDATE providers SET
              website = NULL,
              google_rating = NULL,
              google_review_count = NULL,
              google_photo_url = NULL,
              google_reviews_last_fetched = NULL
            WHERE id = $1
          `,
          [provider.id]
        );
        log(
          `    -> CLEARED unverified data (Google result was outside ${countryConfig.name})`
        );
      }

      result.mismatch = {
        provider_id: provider.id,
        provider_name: provider.name,
        city_slug: provider.city_slug,
        category_slug: provider.category_slug,
        google_name: googleResult.name + ` [OUTSIDE ${countryConfig.name.toUpperCase()}]`,
        llm_confidence: 0,
        current_website: provider.website || "",
        google_website: "",
        current_phone: provider.phone || "",
        google_phone: "",
        action: "cleared_outside_country",
      };
      return result;
    }

    // -- LLM verification for EVERY match (no pre-filtering) ------------------

    const llmResult = await verifyMatchWithLLM(
      provider.name,
      provider.city_slug,
      provider.category_slug,
      googleResult.name,
      googleResult.formatted_address || "",
      countryConfig.name
    );

    if (!llmResult.isSame || llmResult.confidence < 60) {
      result.status = "unmatched";
      result.statsUpdate.unmatched++;
      const verdict = llmResult.isSame
        ? `YES but low confidence (${llmResult.confidence}%)`
        : `NO (${llmResult.confidence}%) -- ${llmResult.reason}`;
      log(`    -> LLM says: ${verdict}`);

      // CRITICAL: If we can't verify, clear all Google-sourced fields.
      // "Better to show no data than wrong data" -- from the guide.
      if (opts.live) {
        const oldWebsite = provider.website || "";
        const oldRating = provider.google_rating;
        const oldPhoto = provider.google_photo_url;

        await getPool().query(
          `
            UPDATE providers SET
              website = NULL,
              google_rating = NULL,
              google_review_count = NULL,
              google_photo_url = NULL,
              google_reviews_last_fetched = NULL
            WHERE id = $1
          `,
          [provider.id]
        );

        const cleared = [];
        if (oldWebsite) cleared.push(`website: ${oldWebsite}`);
        if (oldRating) cleared.push(`rating: ${oldRating}`);
        if (oldPhoto) cleared.push(`photo`);
        if (cleared.length > 0) {
          log(`    -> CLEARED unverified data: ${cleared.join(", ")}`);
          result.statsUpdate.websiteChanged += oldWebsite ? 1 : 0;
        }
      }

      log(`    -> Unmatched -- unverified Google data cleared from DB`);
      result.mismatch = {
        provider_id: provider.id,
        provider_name: provider.name,
        city_slug: provider.city_slug,
        category_slug: provider.category_slug,
        google_name: googleResult.name,
        llm_confidence: llmResult.confidence,
        llm_reason: llmResult.reason,
        current_website: provider.website || "",
        google_website: googleResult.website || "",
        current_phone: provider.phone || "",
        google_phone: "",
        action: "cleared_unverified_data",
      };
      return result;
    }

    log(
      `    -> LLM verified: YES (${llmResult.confidence}%) -- "${llmResult.reason}"`
    );

    // -- Step 3: Place Details ------------------------------------------------

    const placeId = googleResult.place_id;
    result.statsUpdate.placeDetailsCalls++;
    const details = await fetchPlaceDetails(placeId, apiKey);

    if (!details) {
      result.statsUpdate.apiErrors++;
      log(`    Place Details: FAILED for ${placeId}`);
      // Still count as matched (we verified the name), just can't get details
      result.matched = true;
      result.statsUpdate.matched++;
      return result;
    }

    result.matched = true;
    result.statsUpdate.matched++;

    // -- Step 4: Compare and build update -------------------------------------

    const updateData = {};
    const changeLog = {
      providerId: provider.id,
      providerName: provider.name,
      changes: [],
    };

    // Always save google_place_id
    if (!provider.google_place_id || provider.google_place_id !== placeId) {
      updateData.google_place_id = placeId;
      result.statsUpdate.placeIdSaved++;
      log(`    Place ID: ${placeId} -- saved`);
    }

    // Mark permanently closed businesses as inactive
    if (details.business_status === "CLOSED_PERMANENTLY") {
      updateData.status = "inactive";
      result.statsUpdate.markedInactive = 1;
      changeLog.changes.push(`status: ${provider.status || "active"} -> inactive (permanently closed)`);
      log(`    Status: PERMANENTLY CLOSED -- marked inactive`);
    }

    // Website comparison
    const dbDomain = extractDomain(provider.website);
    const googleDomain = extractDomain(details.website);

    if (details.website) {
      if (!provider.website) {
        // No website on file -- take Google's
        updateData.website = details.website;
        result.statsUpdate.websiteChanged++;
        changeLog.changes.push(`website: (empty) -> ${details.website}`);
        log(`    Website: (empty) -> ${googleDomain} <- ADDED`);
      } else if (dbDomain && googleDomain && dbDomain !== googleDomain) {
        // Different domain -- use Google's (the old script probably assigned wrong one)
        updateData.website = details.website;
        result.statsUpdate.websiteChanged++;
        changeLog.changes.push(
          `website: ${provider.website} -> ${details.website}`
        );
        log(`    Website: ${dbDomain} -> ${googleDomain} <- CHANGED`);
      } else {
        log(`    Website: ${dbDomain || "(empty)"} -- matches`);
      }
    } else {
      log(`    Website: ${dbDomain || "(empty)"} -- Google has none`);
    }

    // Phone comparison
    const googlePhone =
      details.international_phone_number ||
      details.formatted_phone_number ||
      "";
    const dbPhoneNorm = normalizePhone(provider.phone);
    const googlePhoneNorm = normalizePhone(googlePhone);

    if (googlePhone) {
      if (!provider.phone) {
        updateData.phone = googlePhone;
        result.statsUpdate.phoneChanged++;
        changeLog.changes.push(`phone: (empty) -> ${googlePhone}`);
        log(`    Phone: (empty) -> ${googlePhone} <- ADDED`);
      } else if (
        dbPhoneNorm &&
        googlePhoneNorm &&
        dbPhoneNorm !== googlePhoneNorm
      ) {
        updateData.phone = googlePhone;
        result.statsUpdate.phoneChanged++;
        changeLog.changes.push(
          `phone: ${provider.phone} -> ${googlePhone}`
        );
        log(
          `    Phone: ${provider.phone} -> ${googlePhone} <- CHANGED`
        );
      } else {
        log(`    Phone: ${provider.phone || "(empty)"} -- matches`);
      }
    } else {
      log(`    Phone: ${provider.phone || "(empty)"} -- Google has none`);
    }

    // Rating + reviews
    if (details.rating != null) {
      updateData.google_rating = details.rating;
      updateData.google_review_count = details.user_ratings_total || 0;
      result.statsUpdate.ratingUpdated++;
      log(
        `    Rating: ${details.rating} (${details.user_ratings_total || 0} reviews) -- updated`
      );
    }

    // Location drift check
    // Treat (0,0) as empty -- many providers have junk "null island" coords
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
        result.statsUpdate.locationUpdated++;
        changeLog.changes.push(`location: moved ${Math.round(distance)}m`);
        log(
          `    Location: drifted ${Math.round(distance)}m -- updated`
        );
      }
    } else if (details.geometry?.location && !hasValidCoords) {
      updateData.latitude = details.geometry.location.lat;
      updateData.longitude = details.geometry.location.lng;
      result.statsUpdate.locationUpdated++;
      log(`    Location: was empty/zero -- filled from Google`);
    }

    // Operating hours
    const parsedHours = parseOperatingHours(details.opening_hours);
    if (parsedHours) {
      updateData.operating_hours = parsedHours;
      result.statsUpdate.hoursUpdated++;
    }

    // Photo — store ONLY the photo_reference (not full URL with API key).
    // Frontend wraps this with /api/places/photo?ref={ref} proxy.
    if (details.photos && details.photos.length > 0) {
      const photoRef = details.photos[0].photo_reference;
      if (photoRef) {
        updateData.google_photo_url = photoRef;
        result.statsUpdate.photoUpdated++;
      }
    }

    // -- Step 5: Update DB ----------------------------------------------------

    if (opts.live && Object.keys(updateData).length > 0) {
      await updateProvider(provider.id, updateData);
    }

    if (changeLog.changes.length > 0) {
      result.changeLog = changeLog;
    }
  } catch (err) {
    result.status = "error";
    result.statsUpdate.apiErrors++;
    log(
      `  ${provider.name} (${provider.city_slug}, ${provider.category_slug})`
    );
    log(`    ERROR: ${err.message}`);

    // Fatal errors -- propagate
    if (err.message.includes("REQUEST_DENIED")) {
      result.fatal = true;
    }
  }

  return result;
}

// --- Main --------------------------------------------------------------------

async function main() {
  loadEnv();
  const opts = parseArgs();

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    console.error(
      "GOOGLE_PLACES_API_KEY is not set. Set via env var or .env.local"
    );
    process.exit(1);
  }

  const countryConfig = GCC_COUNTRIES[opts.country];

  // -- Banner -----------------------------------------------------------------

  console.log();
  console.log(
    "=================================================================="
  );
  console.log(
    "  GCC Provider Re-Enrichment -- Google Places + Gemini LLM Verify"
  );
  console.log(
    "=================================================================="
  );
  console.log();
  console.log(
    `  Mode:      ${opts.live ? "LIVE (will update DB)" : "DRY RUN (no DB changes)"}`
  );
  console.log(
    `  Country:   ${countryConfig.name} (${countryConfig.code})`
  );
  console.log(
    `  City:      ${opts.city || `ALL ${countryConfig.name} cities`}`
  );
  console.log(`  Limit:     ${opts.limit || "none"}`);
  console.log(`  Offset:    ${opts.offset}`);
  console.log(`  Resume:    ${opts.resume}`);
  console.log(`  Batch:     ${BATCH_SIZE} providers in parallel`);
  console.log(
    `  Geo bias:  ${countryConfig.center.lat}, ${countryConfig.center.lng} (radius ${countryConfig.searchRadius / 1000}km)`
  );
  console.log(
    `  Geo reject: >${countryConfig.geoRejectKm}km from center`
  );
  console.log(
    `  LLM keys:  ${OPENROUTER_KEYS.length} (round-robin)`
  );
  console.log(
    `  Matching:  Text Search -> LLM Verify (Gemini) -> Place Details`
  );
  console.log();

  // -- Load providers ---------------------------------------------------------

  console.log(`Querying ${countryConfig.name} providers from database...`);
  let providers = await getGCCProviders(opts.country, opts.city);
  console.log(
    `  Found ${providers.length} providers in ${countryConfig.name}${opts.city ? ` (${opts.city})` : ""}`
  );

  // Apply offset
  let resumeIndex = opts.offset;
  if (opts.resume) {
    const checkpoint = loadCheckpoint(opts.country);
    if (checkpoint && checkpoint.lastProcessedIndex !== undefined) {
      resumeIndex = checkpoint.lastProcessedIndex + 1;
      console.log(
        `  Resuming from checkpoint: index ${resumeIndex} (${checkpoint.lastProviderName || "?"})`
      );
    } else {
      console.log("  No checkpoint found -- starting from beginning");
    }
  }

  if (resumeIndex > 0) {
    providers = providers.slice(resumeIndex);
    console.log(
      `  After offset/resume: ${providers.length} providers remaining`
    );
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

  // -- Cost estimate ----------------------------------------------------------

  const estimatedTextCost = providers.length * TEXT_SEARCH_COST;
  const estimatedDetailsCost = providers.length * PLACE_DETAILS_COST;
  const totalEstimatedCost = estimatedTextCost + estimatedDetailsCost;
  console.log();
  console.log(`  Estimated cost:`);
  console.log(
    `    Text Search:   ${providers.length} x $${TEXT_SEARCH_COST} = ~$${estimatedTextCost.toFixed(2)}`
  );
  console.log(
    `    Place Details: ${providers.length} x $${PLACE_DETAILS_COST} = ~$${estimatedDetailsCost.toFixed(2)}`
  );
  console.log(`    Total:         ~$${totalEstimatedCost.toFixed(2)}`);
  console.log();

  // -- Backup -----------------------------------------------------------------

  if (opts.live) {
    console.log("Creating database backup before writes...");
    const backupTable = await createBackup(opts.country);
    console.log(`  Backup table: ${backupTable}`);
    console.log();
  }

  // -- Process in parallel batches --------------------------------------------

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
    markedInactive: 0,
    textSearchCalls: 0,
    placeDetailsCalls: 0,
  };

  const mismatches = [];
  const changes = []; // Log of all changes made
  let fatalError = false;
  let processedCount = 0;

  for (let i = 0; i < providers.length; i += BATCH_SIZE) {
    if (fatalError) break;

    const batch = providers.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(providers.length / BATCH_SIZE);
    const batchStart = globalOffset + i + 1;
    const batchEnd = globalOffset + i + batch.length;

    console.log(
      `\n--- Batch ${batchNum}/${totalBatches} [${batchStart}-${batchEnd}] (${batch.length} providers) ---`
    );

    // Process all providers in this batch in parallel
    const results = await Promise.all(
      batch.map((p) => enrichProvider(p, apiKey, countryConfig, opts))
    );

    // Collect results from the batch
    for (let j = 0; j < results.length; j++) {
      const r = results[j];

      // Print collected logs
      for (const line of r.logs) {
        console.log(line);
      }

      // Merge stats
      for (const key of Object.keys(r.statsUpdate)) {
        stats[key] = (stats[key] || 0) + r.statsUpdate[key];
      }

      // Collect mismatches
      if (r.mismatch) {
        mismatches.push(r.mismatch);
      }

      // Collect changes
      if (r.changeLog) {
        changes.push(r.changeLog);
      }

      // Check for fatal error
      if (r.fatal) {
        fatalError = true;
        console.error("\nFATAL: API key denied. Stopping immediately.");
      }

      processedCount++;
    }

    // -- Checkpoint after each batch ------------------------------------------

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
    const rate = (processedCount / (elapsed || 1)).toFixed(1);
    const eta = ((providers.length - processedCount) / (rate || 1)).toFixed(0);

    saveCheckpoint(opts.country, {
      lastProcessedIndex: globalOffset + i + batch.length - 1,
      lastProviderName: batch[batch.length - 1].name,
      timestamp: new Date().toISOString(),
      stats: { ...stats },
      progress: `${processedCount}/${providers.length}`,
      elapsedSeconds: parseInt(elapsed),
      ratePerSecond: parseFloat(rate),
      etaSeconds: parseInt(eta),
    });

    if (processedCount % CHECKPOINT_INTERVAL < BATCH_SIZE || i + BATCH_SIZE >= providers.length) {
      console.log();
      console.log(
        `  -- Checkpoint ${processedCount}/${providers.length} | ${elapsed}s elapsed | ~${rate}/s | ETA: ${eta}s --`
      );
      console.log(
        `  Matched: ${stats.matched} | Unmatched: ${stats.unmatched} | No result: ${stats.noGoogleResult} | Errors: ${stats.apiErrors}`
      );
    }
  }

  // -- Save outputs -----------------------------------------------------------

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const actualTextCost = (stats.textSearchCalls * TEXT_SEARCH_COST).toFixed(2);
  const actualDetailsCost = (
    stats.placeDetailsCalls * PLACE_DETAILS_COST
  ).toFixed(2);
  const actualTotalCost = (
    stats.textSearchCalls * TEXT_SEARCH_COST +
    stats.placeDetailsCalls * PLACE_DETAILS_COST
  ).toFixed(2);

  const report = {
    timestamp: new Date().toISOString(),
    mode: opts.live ? "LIVE" : "DRY_RUN",
    country: countryConfig.name,
    countryCode: opts.country,
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

  saveReport(opts.country, report);
  saveMismatches(opts.country, mismatches);

  // -- Summary ----------------------------------------------------------------

  const matchRate =
    stats.total > 0
      ? ((stats.matched / stats.total) * 100).toFixed(1)
      : "0.0";

  console.log();
  console.log(
    "=================================================================="
  );
  console.log(
    `  ${countryConfig.name} Provider Re-Enrichment Complete`
  );
  console.log(
    "=================================================================="
  );
  console.log();
  console.log(
    `  Country:                      ${countryConfig.name} (${opts.country})`
  );
  console.log(
    `  Total providers:              ${stats.total}`
  );
  console.log(
    `  Matched (LLM verified):       ${stats.matched} (${matchRate}%)`
  );
  console.log(
    `    - Place ID saved:           ${stats.placeIdSaved}`
  );
  console.log(
    `    - Website changed:          ${stats.websiteChanged}`
  );
  console.log(
    `    - Phone changed:            ${stats.phoneChanged}`
  );
  console.log(
    `    - Rating updated:           ${stats.ratingUpdated}`
  );
  console.log(
    `    - Location updated:         ${stats.locationUpdated}`
  );
  console.log(
    `    - Hours updated:            ${stats.hoursUpdated}`
  );
  console.log(
    `    - Photo updated:            ${stats.photoUpdated}`
  );
  console.log(
    `    - Marked inactive:          ${stats.markedInactive}`
  );
  console.log(
    `  Unmatched (LLM rejected):     ${stats.unmatched} (flagged for manual review)`
  );
  console.log(
    `  No Google result:             ${stats.noGoogleResult}`
  );
  console.log(
    `  API errors:                   ${stats.apiErrors}`
  );
  console.log();
  console.log(`  API calls:`);
  console.log(
    `    Text Search:                ${stats.textSearchCalls}`
  );
  console.log(
    `    Place Details:              ${stats.placeDetailsCalls}`
  );
  console.log(`  Cost:`);
  console.log(
    `    Text Search:                ~$${actualTextCost}`
  );
  console.log(
    `    Place Details:              ~$${actualDetailsCost}`
  );
  console.log(
    `    Total:                      ~$${actualTotalCost}`
  );
  console.log();
  console.log(
    `  Processing:`
  );
  console.log(
    `    Batch size:                 ${BATCH_SIZE} parallel`
  );
  console.log(
    `    Time elapsed:               ${elapsed}s`
  );
  console.log(
    `    Rate:                       ${(processedCount / (parseFloat(elapsed) || 1)).toFixed(1)}/s`
  );
  console.log(
    `  Mode:                         ${opts.live ? "LIVE -- DB was updated" : "DRY RUN -- no changes made"}`
  );
  console.log();
  console.log(`  Reports:`);
  console.log(`    Full report:    ${getReportPath(opts.country)}`);
  console.log(`    Mismatches CSV: ${getMismatchesPath(opts.country)}`);
  console.log(`    Checkpoint:     ${getCheckpointPath(opts.country)}`);
  console.log();

  if (!opts.live && stats.total > 0) {
    console.log(
      "  NOTE: This was a DRY RUN. To apply changes, re-run with --live"
    );
    console.log();
  }

  await cleanup();
}

// --- Run ---------------------------------------------------------------------

main().catch(async (err) => {
  console.error("Fatal error:", err);
  await cleanup();
  process.exit(1);
});
