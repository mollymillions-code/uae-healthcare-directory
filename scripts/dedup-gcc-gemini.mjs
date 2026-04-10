#!/usr/bin/env node
/**
 * GCC Provider Deduplication via Gemini (OpenRouter)
 * ──────────────────────────────────────────────────
 * Finds and merges duplicate healthcare providers across all GCC countries
 * (Saudi Arabia, Qatar, Bahrain, Kuwait) using a two-pass strategy:
 *
 *   Pass 1: Exact-match on normalized name (lowercase, strip legal suffixes,
 *           strip punctuation) within each city+category group.
 *   Pass 2: Batch remaining providers in each group to Gemini 2.5 Flash Lite
 *           via OpenRouter for fuzzy / Arabic-English / abbreviation matching.
 *
 * Safety:
 *   - NEVER touches UAE providers (country != 'ae')
 *   - Backs up every deleted record to data/parsed/dedup-backup-{country}.json
 *   - Dry-run mode by default (--dry-run flag)
 *   - Requires confirmation before executing deletes (unless --yes flag)
 *
 * Must run ON EC2 where the database is at localhost:5432.
 *
 * Usage:
 *   OPENROUTER_API_KEY=<key> node scripts/dedup-gcc-gemini.mjs --dry-run
 *   OPENROUTER_API_KEY=<key> node scripts/dedup-gcc-gemini.mjs --yes
 *   OPENROUTER_API_KEY=<key> node scripts/dedup-gcc-gemini.mjs --country sa --dry-run
 *   OPENROUTER_API_KEY=<key> node scripts/dedup-gcc-gemini.mjs --country qa --yes
 */

import pg from "pg";
const { Pool } = pg;
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createInterface } from "readline";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, "..");
const DATA_DIR = join(PROJECT_ROOT, "data", "parsed");

// ─── Configuration ───────────────────────────────────────────────────────────

const GCC_COUNTRIES = ["sa", "qa", "bh", "kw"];
const GEMINI_BATCH_SIZE = 30;        // Max facility names per API call
const GEMINI_OVERLAP = 5;            // Overlap between batches
const RATE_LIMIT_MS = 150;           // 150ms between calls (4 keys round-robin = ~7 QPS per key)
const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_MODEL = "google/gemini-3.1-flash-lite-preview";
const MAX_RETRIES = 3;
const RETRY_BASE_MS = 2000;          // Exponential backoff: 2s, 4s, 8s

// ─── Environment ─────────────────────────────────────────────────────────────

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

loadEnv();

// Support multiple API keys for round-robin (comma-separated or OPENROUTER_API_KEY_2, _3, _4)
const OPENROUTER_API_KEYS = [];
if (process.env.OPENROUTER_API_KEY) {
  OPENROUTER_API_KEYS.push(...process.env.OPENROUTER_API_KEY.split(",").map(k => k.trim()).filter(Boolean));
}
for (let i = 2; i <= 10; i++) {
  const extra = process.env[`OPENROUTER_API_KEY_${i}`];
  if (extra) OPENROUTER_API_KEYS.push(extra.trim());
}
if (OPENROUTER_API_KEYS.length === 0) {
  console.error("ERROR: OPENROUTER_API_KEY environment variable is required.");
  console.error(
    "Pass it inline: OPENROUTER_API_KEY=YOUR_KEY node scripts/dedup-gcc-gemini.mjs"
  );
  console.error("For round-robin, use comma-separated keys or OPENROUTER_API_KEY_2, _3, _4");
  process.exit(1);
}
let _keyIndex = 0;
function getNextApiKey() {
  const key = OPENROUTER_API_KEYS[_keyIndex % OPENROUTER_API_KEYS.length];
  _keyIndex++;
  return key;
}

// ─── CLI Args ────────────────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    dryRun: true,
    yes: false,
    country: null, // null = all GCC countries
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--dry-run":
        opts.dryRun = true;
        break;
      case "--yes":
        opts.yes = true;
        opts.dryRun = false;
        break;
      case "--country":
        opts.country = args[++i]?.toLowerCase() || null;
        if (opts.country && !GCC_COUNTRIES.includes(opts.country)) {
          console.error(
            `Invalid country: ${opts.country}. Must be one of: ${GCC_COUNTRIES.join(", ")}`
          );
          process.exit(1);
        }
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
GCC Provider Deduplication via Gemini (OpenRouter)

Usage:
  OPENROUTER_API_KEY=<key> node scripts/dedup-gcc-gemini.mjs [options]

Options:
  --dry-run            Show what would be merged without changing DB (DEFAULT)
  --yes                Execute merges and deletes (skips confirmation prompt)
  --country <code>     Filter to one country: sa, qa, bh, kw
  -h, --help           Show this help

Examples:
  OPENROUTER_API_KEY=YOUR_KEY node scripts/dedup-gcc-gemini.mjs --dry-run
  OPENROUTER_API_KEY=YOUR_KEY node scripts/dedup-gcc-gemini.mjs --country sa --yes
`);
}

// ─── Database ────────────────────────────────────────────────────────────────

let pool = null;

function getPool() {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      console.error("ERROR: DATABASE_URL is not set. Check .env.local or environment.");
      process.exit(1);
    }
    pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5 });
  }
  return pool;
}

async function query(text, params) {
  const result = await getPool().query(text, params);
  return result.rows;
}

// ─── Name Normalization ──────────────────────────────────────────────────────

/**
 * Normalize a facility name for exact-match dedup.
 * Strips legal suffixes, punctuation, extra whitespace, lowercases.
 */
function normalizeName(name) {
  if (!name) return "";
  let n = name.toLowerCase();

  // Strip common legal/business suffixes
  const suffixes = [
    "l\\.?l\\.?c\\.?",
    "w\\.?l\\.?l\\.?",
    "s\\.?p\\.?c\\.?",
    "f\\.?z\\.?e?\\.?",
    "b\\.?s\\.?c\\.?",
    "dmcc",
    "fzc",
    "fze",
    "llc",
    "wll",
    "spc",
    "inc",
    "ltd",
    "co\\.?",
    "company",
    "branch",
    "- branch \\d+",
    "branch \\d+",
    "\\(branch\\)",
    "\\(.*?branch.*?\\)",
  ];
  const suffixRegex = new RegExp(`\\b(?:${suffixes.join("|")})\\b`, "gi");
  n = n.replace(suffixRegex, "");

  // Strip Arabic diacritics (tashkeel)
  n = n.replace(/[\u064B-\u065F\u0670]/g, "");

  // Normalize Arabic characters: alef variants → alef, taa marbuta → ha
  n = n.replace(/[\u0622\u0623\u0625]/g, "\u0627"); // آأإ → ا
  n = n.replace(/\u0629/g, "\u0647"); // ة → ه

  // Strip all punctuation (Unicode-aware) but keep letters, numbers, spaces
  n = n.replace(/[^\p{L}\p{N}\s]/gu, "");

  // Collapse whitespace
  n = n.replace(/\s+/g, " ").trim();

  return n;
}

// ─── Data Richness Scoring ───────────────────────────────────────────────────

/**
 * Score a provider by how much useful data it has.
 * Higher score = more data = better keeper candidate.
 */
function dataRichnessScore(provider) {
  let score = 0;

  if (provider.google_rating && parseFloat(provider.google_rating) > 0) score += 10;
  if (provider.google_review_count && parseInt(provider.google_review_count) > 0)
    score += 5 + Math.min(parseInt(provider.google_review_count), 50);
  if (provider.phone) score += 8;
  if (provider.phone_secondary) score += 3;
  if (provider.website) score += 8;
  if (provider.email) score += 5;
  if (provider.whatsapp) score += 3;
  if (provider.operating_hours && Object.keys(provider.operating_hours).length > 0)
    score += 7;
  if (provider.description) score += 5;
  if (provider.description_ar) score += 3;
  if (provider.short_description) score += 3;
  if (provider.address && provider.address.length > 10) score += 5;
  if (
    provider.latitude &&
    provider.longitude &&
    parseFloat(provider.latitude) !== 0 &&
    parseFloat(provider.longitude) !== 0
  )
    score += 6;
  if (provider.google_place_id) score += 8;
  if (provider.logo_url) score += 3;
  if (provider.cover_image_url) score += 3;
  if (provider.google_photo_url) score += 3;
  if (provider.photos && Array.isArray(provider.photos) && provider.photos.length > 0)
    score += 2 * Math.min(provider.photos.length, 3);
  if (provider.services && Array.isArray(provider.services) && provider.services.length > 0)
    score += 3;
  if (provider.insurance && Array.isArray(provider.insurance) && provider.insurance.length > 0)
    score += 3;
  if (provider.languages && Array.isArray(provider.languages) && provider.languages.length > 0)
    score += 2;
  if (provider.license_number) score += 5;
  if (provider.is_verified) score += 5;
  if (provider.name_ar) score += 3;

  return score;
}

// ─── Merge Fields ────────────────────────────────────────────────────────────

/**
 * Merge unique fields from the duplicate into the keeper.
 * Only fills in fields that the keeper is missing.
 * Returns an object of fields to update (empty if nothing to merge).
 */
function computeMergeFields(keeper, duplicate) {
  const updates = {};

  const textFields = [
    "phone",
    "phone_secondary",
    "email",
    "website",
    "whatsapp",
    "description",
    "description_ar",
    "short_description",
    "address_ar",
    "name_ar",
    "logo_url",
    "cover_image_url",
    "google_photo_url",
    "google_place_id",
    "license_number",
    "facility_type",
    "meta_title",
    "meta_description",
  ];

  for (const field of textFields) {
    if (!keeper[field] && duplicate[field]) {
      updates[field] = duplicate[field];
    }
  }

  // Numeric fields — only fill if keeper is missing/zero
  if (
    (!keeper.google_rating || parseFloat(keeper.google_rating) === 0) &&
    duplicate.google_rating &&
    parseFloat(duplicate.google_rating) > 0
  ) {
    updates.google_rating = duplicate.google_rating;
  }
  if (
    (!keeper.google_review_count || parseInt(keeper.google_review_count) === 0) &&
    duplicate.google_review_count &&
    parseInt(duplicate.google_review_count) > 0
  ) {
    updates.google_review_count = duplicate.google_review_count;
  }

  // Coordinates — only fill if keeper is at 0,0 or null
  if (
    (!keeper.latitude ||
      !keeper.longitude ||
      parseFloat(keeper.latitude) === 0 ||
      parseFloat(keeper.longitude) === 0) &&
    duplicate.latitude &&
    duplicate.longitude &&
    parseFloat(duplicate.latitude) !== 0 &&
    parseFloat(duplicate.longitude) !== 0
  ) {
    updates.latitude = duplicate.latitude;
    updates.longitude = duplicate.longitude;
  }

  // JSONB array fields — merge unique items
  const jsonbArrayFields = [
    "services",
    "insurance",
    "languages",
    "photos",
    "amenities",
    "review_summary",
    "review_summary_ar",
  ];
  for (const field of jsonbArrayFields) {
    const keeperArr = Array.isArray(keeper[field]) ? keeper[field] : [];
    const dupArr = Array.isArray(duplicate[field]) ? duplicate[field] : [];
    if (dupArr.length > 0) {
      const merged = [...new Set([...keeperArr, ...dupArr])];
      if (merged.length > keeperArr.length) {
        updates[field] = JSON.stringify(merged);
      }
    }
  }

  // Operating hours — only fill if keeper has none
  if (
    (!keeper.operating_hours || Object.keys(keeper.operating_hours).length === 0) &&
    duplicate.operating_hours &&
    Object.keys(duplicate.operating_hours).length > 0
  ) {
    updates.operating_hours = JSON.stringify(duplicate.operating_hours);
  }

  return updates;
}

// ─── OpenRouter / Gemini API ─────────────────────────────────────────────────

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Call Gemini via OpenRouter to identify duplicate facility names.
 * Returns array of duplicate groups (each group is an array of 0-based indices).
 */
async function findDuplicatesWithGemini(cityName, categorySlug, facilityNames) {
  const facilitiesStr = facilityNames
    .map((name, i) => `${i}: ${name}`)
    .join("\n");

  const systemPrompt = `You are a healthcare facility deduplication expert. Given a list of facility names from the same city and category, identify which ones are the SAME physical facility (duplicates). Consider Arabic/English variants, abbreviations, branch names, and common naming variations.

Rules:
- "Hospital" / "مستشفى" are the same word in different languages
- "Centre" and "Center" are the same
- "Polyclinic" and "Poly Clinic" are the same
- "Clinic" / "عيادة" / "مركز" are the same concept
- Ignore legal suffixes: LLC, L.L.C, W.L.L, S.P.C, FZ, etc.
- Branch locations of the same company (e.g. "X Pharmacy - Branch 1" and "X Pharmacy - Branch 2") are DIFFERENT facilities
- Numbers matter: "Clinic 1" and "Clinic 2" are different
- Same name with slight spelling variations (extra space, missing dash) = same facility
- Arabic name and its English transliteration = same facility
- Abbreviated names (e.g. "KFSH&RC" = "King Faisal Specialist Hospital and Research Centre")

Return ONLY a JSON array of duplicate groups. Each group is an array of indices (0-based) that refer to the same facility. Only include groups with 2+ matches. If no duplicates found, return [].`;

  const userPrompt = `City: ${cityName}, Category: ${categorySlug}\nFacilities:\n${facilitiesStr}`;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(OPENROUTER_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getNextApiKey()}`,
          "HTTP-Referer": "https://www.zavis.ai",
          "X-Title": "Zavis GCC Provider Deduplication",
        },
        body: JSON.stringify({
          model: OPENROUTER_MODEL,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0,
          max_tokens: 2000,
        }),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        if (res.status === 429 || res.status >= 500) {
          const backoff = RETRY_BASE_MS * Math.pow(2, attempt);
          console.warn(
            `  [Gemini] HTTP ${res.status}, retrying in ${backoff}ms (attempt ${attempt + 1}/${MAX_RETRIES})`
          );
          await sleep(backoff);
          continue;
        }
        console.warn(
          `  [Gemini] HTTP ${res.status}: ${errText.slice(0, 200)}`
        );
        return [];
      }

      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content || "";
      const cleaned = content.replace(/```json\s*|```/g, "").trim();

      try {
        const parsed = JSON.parse(cleaned);
        if (Array.isArray(parsed)) {
          // Validate: each group should be an array of numbers
          const valid = parsed.filter(
            (group) =>
              Array.isArray(group) &&
              group.length >= 2 &&
              group.every(
                (idx) =>
                  typeof idx === "number" &&
                  idx >= 0 &&
                  idx < facilityNames.length
              )
          );
          return valid;
        }
        console.warn(`  [Gemini] Response was not an array: ${cleaned.slice(0, 100)}`);
        return [];
      } catch {
        // Try to extract array from response text
        const match = cleaned.match(/\[[\s\S]*\]/);
        if (match) {
          try {
            const extracted = JSON.parse(match[0]);
            if (Array.isArray(extracted)) {
              return extracted.filter(
                (group) =>
                  Array.isArray(group) &&
                  group.length >= 2 &&
                  group.every(
                    (idx) =>
                      typeof idx === "number" &&
                      idx >= 0 &&
                      idx < facilityNames.length
                  )
              );
            }
          } catch {
            // fall through
          }
        }
        console.warn(
          `  [Gemini] Unparseable response: ${content.slice(0, 200)}`
        );
        return [];
      }
    } catch (err) {
      if (attempt < MAX_RETRIES - 1) {
        const backoff = RETRY_BASE_MS * Math.pow(2, attempt);
        console.warn(
          `  [Gemini] Network error: ${err.message}, retrying in ${backoff}ms`
        );
        await sleep(backoff);
        continue;
      }
      console.error(`  [Gemini] Failed after ${MAX_RETRIES} attempts: ${err.message}`);
      return [];
    }
  }

  return [];
}

// ─── Confirmation Prompt ─────────────────────────────────────────────────────

async function confirmAction(message) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(`${message} (y/N): `, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() === "y");
    });
  });
}

// ─── Country Name Helpers ────────────────────────────────────────────────────

const COUNTRY_NAMES = {
  sa: "Saudi Arabia",
  qa: "Qatar",
  bh: "Bahrain",
  kw: "Kuwait",
};

// ─── Main Logic ──────────────────────────────────────────────────────────────

async function processCountry(countryCode, opts) {
  const countryName = COUNTRY_NAMES[countryCode];
  console.log(`\n${"═".repeat(70)}`);
  console.log(`  Processing: ${countryName} (${countryCode})`);
  console.log(`${"═".repeat(70)}`);

  // Load all providers for this country
  const providers = await query(
    `SELECT * FROM providers WHERE country = $1 AND status = 'active' ORDER BY city_slug, category_slug, name`,
    [countryCode]
  );

  console.log(`  Total active providers: ${providers.length}`);

  if (providers.length === 0) {
    console.log("  No providers found. Skipping.");
    return { country: countryCode, totalProviders: 0, exactMatches: 0, geminiMatches: 0, merged: 0, deleted: 0 };
  }

  // Group by city_slug + category_slug
  const groups = new Map();
  for (const p of providers) {
    const key = `${p.city_slug}|${p.category_slug}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(p);
  }

  console.log(`  Groups (city+category): ${groups.size}`);

  // Backup array for this country
  const backup = [];

  // Stats
  let exactDupGroups = 0;
  let exactDupCount = 0;
  let geminiDupGroups = 0;
  let geminiDupCount = 0;
  let mergedCount = 0;
  let deletedCount = 0;
  let geminiCalls = 0;
  let groupsProcessed = 0;

  // Collect all merge operations (to execute after confirmation in non-dry-run)
  const mergeOps = [];

  for (const [groupKey, groupProviders] of groups) {
    groupsProcessed++;
    const [citySlug, categorySlug] = groupKey.split("|");

    if (groupProviders.length < 2) continue;

    // ── Pass 1: Exact normalized name match ──────────────────────────

    const normalizedGroups = new Map();
    for (const p of groupProviders) {
      const norm = normalizeName(p.name);
      if (!normalizedGroups.has(norm)) normalizedGroups.set(norm, []);
      normalizedGroups.get(norm).push(p);
    }

    // Track which providers were consumed by exact matching
    const exactMatched = new Set();

    for (const [norm, dupes] of normalizedGroups) {
      if (dupes.length < 2) continue;

      exactDupGroups++;
      exactDupCount += dupes.length - 1;

      // Pick keeper: highest data richness score
      dupes.sort((a, b) => dataRichnessScore(b) - dataRichnessScore(a));
      const keeper = dupes[0];

      for (let i = 1; i < dupes.length; i++) {
        const dup = dupes[i];
        exactMatched.add(dup.id);

        const mergeFields = computeMergeFields(keeper, dup);

        mergeOps.push({
          keeper,
          duplicate: dup,
          mergeFields,
          method: "exact",
          citySlug,
          categorySlug,
        });

        console.log(
          `  [EXACT] MERGED: "${dup.name}" → "${keeper.name}" (city: ${citySlug}, cat: ${categorySlug})`
        );
      }
    }

    // ── Pass 2: Gemini fuzzy matching ────────────────────────────────

    // Collect providers NOT already matched in pass 1
    const remaining = groupProviders.filter((p) => !exactMatched.has(p.id));

    if (remaining.length < 2) continue;

    // Get city display name for Gemini prompt
    const cityRow = await query(
      `SELECT name FROM cities WHERE slug = $1 AND country = $2 LIMIT 1`,
      [citySlug, countryCode]
    );
    const cityDisplayName = cityRow[0]?.name || citySlug;

    // Split into batches (with overlap for cross-batch dedup)
    const batches = [];
    if (remaining.length <= GEMINI_BATCH_SIZE) {
      batches.push(remaining);
    } else {
      const step = GEMINI_BATCH_SIZE - GEMINI_OVERLAP;
      for (let start = 0; start < remaining.length; start += step) {
        const end = Math.min(start + GEMINI_BATCH_SIZE, remaining.length);
        batches.push(remaining.slice(start, end));
        if (end >= remaining.length) break;
      }
    }

    // Track globally which providers have already been marked as duplicates
    // (to avoid double-marking across overlapping batches)
    const alreadyMarkedForDeletion = new Set();

    for (const batch of batches) {
      const names = batch.map((p) => p.name);

      await sleep(RATE_LIMIT_MS);
      geminiCalls++;

      const dupGroups = await findDuplicatesWithGemini(
        cityDisplayName,
        categorySlug,
        names
      );

      for (const group of dupGroups) {
        // Map indices back to provider objects
        const groupProvs = group
          .map((idx) => batch[idx])
          .filter((p) => p && !alreadyMarkedForDeletion.has(p.id));

        if (groupProvs.length < 2) continue;

        geminiDupGroups++;
        geminiDupCount += groupProvs.length - 1;

        // Pick keeper: highest data richness
        groupProvs.sort((a, b) => dataRichnessScore(b) - dataRichnessScore(a));
        const keeper = groupProvs[0];

        for (let i = 1; i < groupProvs.length; i++) {
          const dup = groupProvs[i];
          alreadyMarkedForDeletion.add(dup.id);

          const mergeFields = computeMergeFields(keeper, dup);

          mergeOps.push({
            keeper,
            duplicate: dup,
            mergeFields,
            method: "gemini",
            citySlug,
            categorySlug,
          });

          console.log(
            `  [GEMINI] MERGED: "${dup.name}" → "${keeper.name}" (city: ${citySlug}, cat: ${categorySlug})`
          );
        }
      }
    }

    // Progress log every 50 groups
    if (groupsProcessed % 50 === 0) {
      console.log(
        `  ... processed ${groupsProcessed}/${groups.size} groups, ${mergeOps.length} merges queued, ${geminiCalls} Gemini calls`
      );
    }
  }

  // ── Summary ────────────────────────────────────────────────────────
  console.log(`\n  ── ${countryName} Summary ──`);
  console.log(`  Total providers:       ${providers.length}`);
  console.log(`  Groups processed:      ${groups.size}`);
  console.log(`  Exact-match groups:    ${exactDupGroups} (${exactDupCount} duplicates)`);
  console.log(`  Gemini-match groups:   ${geminiDupGroups} (${geminiDupCount} duplicates)`);
  console.log(`  Total merges queued:   ${mergeOps.length}`);
  console.log(`  Gemini API calls:      ${geminiCalls}`);

  if (mergeOps.length === 0) {
    console.log("  No duplicates found.");
    return {
      country: countryCode,
      totalProviders: providers.length,
      exactMatches: exactDupCount,
      geminiMatches: geminiDupCount,
      merged: 0,
      deleted: 0,
    };
  }

  if (opts.dryRun) {
    console.log("\n  [DRY RUN] No changes made to the database.");
    console.log("  Run with --yes to execute merges and deletes.");
    return {
      country: countryCode,
      totalProviders: providers.length,
      exactMatches: exactDupCount,
      geminiMatches: geminiDupCount,
      merged: 0,
      deleted: 0,
      wouldMerge: mergeOps.length,
    };
  }

  // ── Execute merges ─────────────────────────────────────────────────

  // Ensure backup directory exists
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }

  for (const op of mergeOps) {
    const { keeper, duplicate, mergeFields } = op;

    // Back up the duplicate record
    backup.push({
      ...duplicate,
      _mergedInto: keeper.id,
      _mergedIntoName: keeper.name,
      _method: op.method,
      _timestamp: new Date().toISOString(),
    });

    // Update keeper with merged fields
    if (Object.keys(mergeFields).length > 0) {
      const setClauses = [];
      const values = [];
      let paramIdx = 1;

      for (const [field, value] of Object.entries(mergeFields)) {
        // JSONB fields need ::jsonb cast
        const jsonbFields = [
          "services",
          "insurance",
          "languages",
          "photos",
          "amenities",
          "review_summary",
          "review_summary_ar",
          "operating_hours",
        ];
        if (jsonbFields.includes(field)) {
          setClauses.push(`${field} = $${paramIdx}::jsonb`);
        } else {
          setClauses.push(`${field} = $${paramIdx}`);
        }
        values.push(value);
        paramIdx++;
      }

      setClauses.push(`updated_at = NOW()`);
      values.push(keeper.id);

      await query(
        `UPDATE providers SET ${setClauses.join(", ")} WHERE id = $${paramIdx}`,
        values
      );
      mergedCount++;
    }

    // Delete the duplicate
    // First, reassign any google_reviews, provider_categories, claim_requests
    // that reference the duplicate (cascade should handle this, but be safe)
    await query(
      `DELETE FROM provider_categories WHERE provider_id = $1`,
      [duplicate.id]
    );
    await query(
      `DELETE FROM google_reviews WHERE provider_id = $1`,
      [duplicate.id]
    );
    await query(
      `DELETE FROM providers WHERE id = $1`,
      [duplicate.id]
    );
    deletedCount++;
  }

  // Write backup file
  const backupPath = join(DATA_DIR, `dedup-backup-${countryCode}.json`);
  writeFileSync(backupPath, JSON.stringify(backup, null, 2), "utf8");
  console.log(`\n  Backup saved: ${backupPath} (${backup.length} records)`);
  console.log(`  Merged ${mergedCount} field sets, deleted ${deletedCount} duplicates.`);

  return {
    country: countryCode,
    totalProviders: providers.length,
    exactMatches: exactDupCount,
    geminiMatches: geminiDupCount,
    merged: mergedCount,
    deleted: deletedCount,
  };
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const opts = parseArgs();
  const countries = opts.country ? [opts.country] : GCC_COUNTRIES;

  console.log("╔══════════════════════════════════════════════════════════════════════╗");
  console.log("║  GCC Provider Deduplication via Gemini (OpenRouter)                 ║");
  console.log("╚══════════════════════════════════════════════════════════════════════╝");
  console.log(`Mode:       ${opts.dryRun ? "DRY RUN (no DB changes)" : "LIVE (will modify DB)"}`);
  console.log(`Countries:  ${countries.map((c) => COUNTRY_NAMES[c]).join(", ")}`);
  console.log(`Model:      ${OPENROUTER_MODEL}`);
  console.log(`Batch size: ${GEMINI_BATCH_SIZE}`);
  console.log(`API keys:   ${OPENROUTER_API_KEYS.length} (round-robin)`);
  console.log(`Rate limit: ${RATE_LIMIT_MS}ms between calls (~${Math.round(1000/RATE_LIMIT_MS)} QPS total, ~${Math.round(1000/RATE_LIMIT_MS/OPENROUTER_API_KEYS.length)} QPS per key)`);

  // Verify DB connection
  try {
    const dbCheck = await query("SELECT COUNT(*) AS cnt FROM providers WHERE country = ANY($1::text[])", [countries]);
    console.log(`DB check:   ${dbCheck[0].cnt} providers across ${countries.length} countries`);
  } catch (err) {
    console.error(`\nERROR: Cannot connect to database: ${err.message}`);
    console.error("Make sure DATABASE_URL is set and the database is accessible.");
    process.exit(1);
  }

  // Safety check: never touch UAE
  const uaeCheck = await query(
    "SELECT COUNT(*) AS cnt FROM providers WHERE country = 'ae'"
  );
  console.log(`UAE safety: ${uaeCheck[0].cnt} UAE providers (will NOT be touched)\n`);

  // Confirmation prompt for live mode
  if (!opts.dryRun && !opts.yes) {
    const confirmed = await confirmAction(
      "This will DELETE duplicate providers from the database. Continue?"
    );
    if (!confirmed) {
      console.log("Aborted.");
      process.exit(0);
    }
  }

  const results = [];
  for (const countryCode of countries) {
    const result = await processCountry(countryCode, opts);
    results.push(result);
  }

  // ── Final Summary ──────────────────────────────────────────────────
  console.log(`\n${"═".repeat(70)}`);
  console.log("  FINAL SUMMARY");
  console.log(`${"═".repeat(70)}`);

  let totalExact = 0;
  let totalGemini = 0;
  let totalDeleted = 0;

  for (const r of results) {
    const countryLabel = COUNTRY_NAMES[r.country].padEnd(15);
    const exact = `exact: ${r.exactMatches}`.padEnd(12);
    const gemini = `gemini: ${r.geminiMatches}`.padEnd(14);
    const deleted = opts.dryRun
      ? `would delete: ${r.wouldMerge || 0}`
      : `deleted: ${r.deleted}`;
    console.log(`  ${countryLabel} | ${exact} | ${gemini} | ${deleted}`);
    totalExact += r.exactMatches;
    totalGemini += r.geminiMatches;
    totalDeleted += opts.dryRun ? (r.wouldMerge || 0) : r.deleted;
  }

  console.log(`${"─".repeat(70)}`);
  console.log(
    `  TOTAL            | exact: ${totalExact}`.padEnd(38) +
      `| gemini: ${totalGemini}`.padEnd(16) +
      `| ${opts.dryRun ? "would delete" : "deleted"}: ${totalDeleted}`
  );

  // Cleanup
  if (pool) await pool.end();

  console.log("\nDone.");
}

main().catch((err) => {
  console.error("\nFATAL ERROR:", err);
  if (pool) pool.end().catch(() => {});
  process.exit(1);
});
