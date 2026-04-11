#!/usr/bin/env node
/**
 * build-professionals-index.mjs
 *
 * Populate the `professionals_index` table from the DHA Sheryan JSON dataset
 * at `data/parsed/dha_professionals_all.json` (~99,520 records).
 *
 * Must run AFTER applying
 *   scripts/db/migrations/2026-04-11-professionals-index.sql
 *
 * Usage:
 *   DATABASE_URL=postgres://... node scripts/build-professionals-index.mjs
 *   (or copy `.env.local` keys and export them)
 *
 * Safe to re-run — every upsert is idempotent via ON CONFLICT (dha_unique_id).
 *
 * IMPORTANT (CLAUDE.md § Database Driver):
 * - Uses `pg` (node-postgres) directly. Do NOT switch to @neondatabase/serverless.
 * - Run on EC2 (database is on localhost:5432).
 *
 * Trust discipline (Codex, zocdoc-brutal-action-plan.md):
 * - NEVER invent languages, insurance acceptance, availability, or
 *   "accepting new patients".
 * - NEVER emit synthetic ratings.
 * - The image scraper is a separate, later step — `photo_url` is left NULL
 *   here and `photo_consent = false` by default.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";

// ─── .env.local loader ──────────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..");

function loadDotEnvLocal() {
  const envPath = path.join(REPO_ROOT, ".env.local");
  if (!fs.existsSync(envPath)) return;
  const raw = fs.readFileSync(envPath, "utf8");
  for (const rawLine of raw.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadDotEnvLocal();

if (!process.env.DATABASE_URL) {
  console.error(
    "[build-professionals-index] DATABASE_URL is not set. " +
      "Export it or ensure .env.local lives at repo root."
  );
  process.exit(1);
}

// ─── Paths ──────────────────────────────────────────────────────────────────

const DHA_JSON_PATH = path.join(
  REPO_ROOT,
  "data",
  "parsed",
  "dha_professionals_all.json"
);

if (!fs.existsSync(DHA_JSON_PATH)) {
  console.error(`[build-professionals-index] Missing ${DHA_JSON_PATH}`);
  process.exit(1);
}

// ─── Parsing helpers ────────────────────────────────────────────────────────

/**
 * Parse `categoryOrSpeciality` strings like:
 *   "Physician-Specialist Obstetrics And Gynecology"
 *   "Physician-Consultant Nuclear Medicine"
 *   "Physician-General Practitioner"
 *   "Physician-Medical Intern"
 *   "Dentist-Specialist Orthodontics"
 *   "Dentist-General Practitioner"
 *   "Nurse and Midwife-Registered Nurse"
 *   "Allied Health-Pharmacist"
 *
 * Returns { discipline, level, specialty } — all lowercase-ish but specialty
 * is preserved in Title Case for display.
 */
function parseCategoryOrSpeciality(raw) {
  if (!raw) return { discipline: "other", level: "unknown", specialty: "" };
  const dash = raw.indexOf("-");
  if (dash === -1) {
    return {
      discipline: normalizeDiscipline(raw.trim()),
      level: "unknown",
      specialty: "",
    };
  }
  const left = raw.slice(0, dash).trim();
  const right = raw.slice(dash + 1).trim();
  const discipline = normalizeDiscipline(left);

  // right is e.g. "Specialist Obstetrics And Gynecology"
  // or "General Practitioner" or "Medical Intern" etc.
  const levelMatch = right.match(
    /^(Specialist|Consultant|General Practitioner|General Dentist|Registered Nurse|Assistant Nurse|Registered Midwife|Practical Nurse|Medical Intern|Medical Resident|Implantology Privilege|Clinical)/i
  );

  let level = "unknown";
  let specialty = right;

  if (levelMatch) {
    level = levelMatch[0].toLowerCase().replace(/\s+/g, "-");
    specialty = right.slice(levelMatch[0].length).trim();
    // If there's nothing after the level word, the level is the specialty.
    if (!specialty) specialty = levelMatch[0];
  } else {
    // Fallback: treat the whole right half as the specialty.
    level = "unknown";
    specialty = right;
  }

  return { discipline, level, specialty };
}

function normalizeDiscipline(raw) {
  const lower = raw.toLowerCase();
  if (lower.startsWith("physician")) return "physician";
  if (lower.startsWith("dentist")) return "dentist";
  if (lower.startsWith("nurse")) return "nurse";
  if (lower.startsWith("pharmacist")) return "pharmacist";
  if (lower.startsWith("allied")) return "allied-health";
  return "other";
}

// Slug aliases: collapse long specialty names to idiomatic short slugs.
const SPECIALTY_ALIAS_MAP = {
  "obstetrics and gynecology": "obgyn",
  "obstetrics & gynecology": "obgyn",
  "ear nose and throat": "ent",
  "otolaryngology": "otolaryngology",
  "ear, nose and throat": "ent",
};

function kebab(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function toSpecialtySlug(specialty) {
  if (!specialty) return "";
  const normalized = specialty.toLowerCase().trim();
  if (SPECIALTY_ALIAS_MAP[normalized]) return SPECIALTY_ALIAS_MAP[normalized];
  return kebab(specialty);
}

function titleCase(s) {
  return String(s || "")
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function buildDisplayTitle({ name, level, specialty }) {
  const nm = titleCase(name);
  const lvl = level && level !== "unknown" ? titleCase(level.replace(/-/g, " ")) : "";
  const sp = specialty ? titleCase(specialty) : "";
  const suffix = [lvl, sp].filter(Boolean).join(" ").trim();
  return suffix ? `Dr. ${nm}, ${suffix}` : `Dr. ${nm}`;
}

function buildDoctorSlug({ name, dhaUniqueId }) {
  const kn = kebab(name);
  // Guarantee uniqueness even for homonyms by appending the DHA ID.
  return kn ? `${kn}-${dhaUniqueId}` : `doctor-${dhaUniqueId}`;
}

// Map discipline → existing Zavis directory category slug when we want the
// profile to cross-link into facility search.
function deriveCategorySlug(discipline) {
  if (discipline === "dentist") return "dental-clinic";
  if (discipline === "pharmacist") return "pharmacy";
  if (discipline === "nurse") return "nursing";
  return null; // physicians stay as specialty-first; no default category bucket.
}

function buildSearchTerms({ name, specialty, level }) {
  const terms = new Set();
  if (name) terms.add(name);
  if (specialty) terms.add(specialty);
  if (level) terms.add(level.replace(/-/g, " "));
  terms.add("doctor");
  terms.add("dha");
  return Array.from(terms).filter(Boolean);
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const startedAt = Date.now();
  console.log(`[build-professionals-index] Reading ${DHA_JSON_PATH} ...`);
  const raw = fs.readFileSync(DHA_JSON_PATH, "utf8");
  const records = JSON.parse(raw);
  if (!Array.isArray(records)) {
    console.error(
      "[build-professionals-index] Top-level JSON is not an array; aborting."
    );
    process.exit(1);
  }
  console.log(
    `[build-professionals-index] Loaded ${records.length} DHA records.`
  );

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 6,
  });

  // Pre-load provider name/slug/city map for fuzzy matching.
  console.log(
    `[build-professionals-index] Pre-loading providers for facility matching ...`
  );
  const providerRows = await pool.query(
    `SELECT slug, name, city_slug FROM providers WHERE status = 'active'`
  );
  const providersByLowerName = new Map();
  for (const row of providerRows.rows) {
    if (!row.name || !row.slug) continue;
    providersByLowerName.set(row.name.toLowerCase().trim(), {
      slug: row.slug,
      name: row.name,
      citySlug: row.city_slug || "",
    });
  }
  console.log(
    `[build-professionals-index] Pre-loaded ${providersByLowerName.size} active providers.`
  );

  // Jaccard on word-sets — strict threshold.
  function jaccardMatch(facilityName) {
    if (!facilityName) return null;
    const target = facilityName.toLowerCase().trim();
    const exact = providersByLowerName.get(target);
    if (exact) return { ...exact, confidence: 1.0 };

    const targetTokens = new Set(
      target.split(/\s+/).filter((t) => t.length > 2)
    );
    if (targetTokens.size === 0) return null;
    let best = null;
    for (const [name, row] of providersByLowerName) {
      const tokens = new Set(name.split(/\s+/).filter((t) => t.length > 2));
      if (tokens.size === 0) continue;
      let intersect = 0;
      for (const t of targetTokens) {
        if (tokens.has(t)) intersect++;
      }
      const union = tokens.size + targetTokens.size - intersect;
      if (union === 0) continue;
      const score = intersect / union;
      if (score > 0.8 && (!best || score > best.confidence)) {
        best = { ...row, confidence: score };
      }
    }
    return best;
  }

  // Upsert in batches of 500 inside a transaction each.
  const BATCH_SIZE = 500;
  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  let facilityMatched = 0;
  let processed = 0;

  const client = await pool.connect();
  try {
    for (let offset = 0; offset < records.length; offset += BATCH_SIZE) {
      const batch = records.slice(offset, offset + BATCH_SIZE);
      await client.query("BEGIN");
      for (const rec of batch) {
        processed++;
        try {
          if (!rec || !rec.dhaUniqueId || !rec.name) {
            skipped++;
            continue;
          }
          const { discipline, level, specialty } = parseCategoryOrSpeciality(
            rec.categoryOrSpeciality || ""
          );
          // Scope (user directive 2026-04-11): ONLY physicians and dentists
          // get indexable pages. Nurses, pharmacists, allied-health, and
          // "other" are skipped entirely — they are not the target audience
          // for the find-a-doctor surface and would dilute SEO quality.
          if (discipline !== "physician" && discipline !== "dentist") {
            skipped++;
            continue;
          }
          const specialtySlug = toSpecialtySlug(specialty || level);
          // Require a usable specialty-or-level slug for addressing.
          if (!specialtySlug) {
            skipped++;
            continue;
          }
          const slug = buildDoctorSlug({
            name: rec.name,
            dhaUniqueId: rec.dhaUniqueId,
          });
          const displayTitle = buildDisplayTitle({
            name: rec.name,
            level,
            specialty: specialty || level,
          });
          const categorySlug = deriveCategorySlug(discipline);
          const searchTerms = buildSearchTerms({
            name: rec.name,
            specialty,
            level,
          });
          const facilityMatch = rec.facilityName
            ? jaccardMatch(rec.facilityName)
            : null;
          if (facilityMatch) facilityMatched++;

          const params = [
            rec.dhaUniqueId,
            slug,
            rec.name,
            null, // name_ar — DHA dataset is English-only
            displayTitle,
            discipline,
            level,
            specialty || level,
            specialtySlug,
            categorySlug,
            rec.facilityName || null,
            facilityMatch ? facilityMatch.slug : null,
            facilityMatch ? facilityMatch.citySlug || null : null,
            rec.licenseType || "REG",
            typeof rec.licensecount === "number" ? rec.licensecount : 1,
            null, // photo_url
            false, // photo_consent
            JSON.stringify(searchTerms),
            JSON.stringify([]), // related_conditions — filled in later
            "dha",
            "active",
          ];

          const result = await client.query(
            `INSERT INTO professionals_index (
               dha_unique_id, slug, name, name_ar, display_title, discipline,
               level, specialty, specialty_slug, category_slug,
               primary_facility_name, primary_facility_slug, primary_city_slug,
               license_type, license_count, photo_url, photo_consent,
               search_terms, related_conditions, data_source, status
             )
             VALUES (
               $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
               $15, $16, $17, $18::jsonb, $19::jsonb, $20, $21
             )
             ON CONFLICT (dha_unique_id) DO UPDATE SET
               slug = EXCLUDED.slug,
               name = EXCLUDED.name,
               display_title = EXCLUDED.display_title,
               discipline = EXCLUDED.discipline,
               level = EXCLUDED.level,
               specialty = EXCLUDED.specialty,
               specialty_slug = EXCLUDED.specialty_slug,
               category_slug = EXCLUDED.category_slug,
               primary_facility_name = EXCLUDED.primary_facility_name,
               primary_facility_slug = EXCLUDED.primary_facility_slug,
               primary_city_slug = EXCLUDED.primary_city_slug,
               license_type = EXCLUDED.license_type,
               license_count = EXCLUDED.license_count,
               search_terms = EXCLUDED.search_terms,
               updated_at = NOW()
             RETURNING (xmax = 0) AS inserted`,
            params
          );
          if (result.rows[0]?.inserted) inserted++;
          else updated++;
        } catch (err) {
          skipped++;
          console.error(
            `[build-professionals-index] Row ${rec?.dhaUniqueId || "?"} failed: ${
              err instanceof Error ? err.message : String(err)
            }`
          );
        }
      }
      await client.query("COMMIT");

      if (processed % 5000 < BATCH_SIZE) {
        console.log(
          `[build-professionals-index] Progress: ${processed}/${records.length} (inserted=${inserted} updated=${updated} skipped=${skipped} facilityMatch=${facilityMatched})`
        );
      }
    }
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }

  const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
  const matchRate =
    processed > 0 ? ((facilityMatched / processed) * 100).toFixed(1) : "0.0";
  console.log("");
  console.log("[build-professionals-index] Summary");
  console.log("-----------------------------------");
  console.log(`  Processed:            ${processed}`);
  console.log(`  Inserted:             ${inserted}`);
  console.log(`  Updated:              ${updated}`);
  console.log(`  Skipped:              ${skipped}`);
  console.log(`  Facility-match rate:  ${facilityMatched} / ${processed} (${matchRate}%)`);
  console.log(`  Elapsed:              ${elapsed}s`);
  await pool.end();
}

main().catch((err) => {
  console.error("[build-professionals-index] FATAL:", err);
  process.exit(1);
});
