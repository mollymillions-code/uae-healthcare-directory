#!/usr/bin/env node
/**
 * Seed GCC provider data into zavis_landing PostgreSQL database.
 *
 * Usage:  node scripts/seed-gcc-providers.mjs
 *
 * Reads JSON files from data/parsed/ for Bahrain, Qatar, Saudi Arabia, and Kuwait,
 * then upserts cities and providers into the database.
 *
 * Uses `pg` (node-postgres) — NOT @neondatabase/serverless.
 */

import fs from "node:fs";
import path from "node:path";
import pg from "pg";
import crypto from "node:crypto";

const { Pool } = pg;

// ─── Config ────────────────────────────────────────────────────────────────────

const DATA_DIR = path.resolve(process.cwd(), "data/parsed");

const FILES = [
  { file: "bahrain_providers.json", country: "bh" },
  { file: "qatar_providers.json", country: "qa" },
  { file: "saudi_providers.json", country: "sa" },
  { file: "kuwait_providers.json", country: "kw" },
];

// ─── Category mapping ──────────────────────────────────────────────────────────
// Maps raw category strings from scraped JSON → category slug in the DB.
// The DB categories table uses id = "cat_<slug>".

const CATEGORY_ALIAS = {
  hospitals: "hospitals",
  clinics: "clinics",
  pharmacy: "pharmacy",
  pharmacies: "pharmacy",
  dental: "dental",
  dentists: "dental",
  "labs-diagnostics": "labs-diagnostics",
  rehabilitation: "physiotherapy",
};

// ─── GCC Cities ────────────────────────────────────────────────────────────────
// Matches the structure in src/lib/constants/cities.ts.
// Only GCC (non-ae) cities are listed here; the seed script reads existing cities
// from the DB and creates missing ones on the fly.

const GCC_CITIES = [
  // Qatar
  { slug: "doha", name: "Doha", emirate: "Doha", country: "qa", nameAr: "الدوحة", latitude: "25.2854500", longitude: "51.5310400", sortOrder: 1 },
  { slug: "al-wakrah", name: "Al Wakrah", emirate: "Al Wakrah", country: "qa", nameAr: "الوكرة", latitude: "25.1659200", longitude: "51.5979200", sortOrder: 2 },
  { slug: "al-khor", name: "Al Khor", emirate: "Al Khor", country: "qa", nameAr: "الخور", latitude: "25.6804400", longitude: "51.4968500", sortOrder: 3 },
  { slug: "al-rayyan", name: "Al Rayyan", emirate: "Al Rayyan", country: "qa", nameAr: "الريان", latitude: "25.2919300", longitude: "51.4244200", sortOrder: 4 },
  { slug: "umm-salal", name: "Umm Salal", emirate: "Umm Salal", country: "qa", nameAr: "أم صلال", latitude: "25.4084600", longitude: "51.3973300", sortOrder: 5 },
  { slug: "lusail", name: "Lusail", emirate: "Lusail", country: "qa", nameAr: "لوسيل", latitude: "25.4300000", longitude: "51.4900000", sortOrder: 6 },
  { slug: "dukhan", name: "Dukhan", emirate: "Dukhan", country: "qa", nameAr: "دخان", latitude: "25.4284000", longitude: "50.7811000", sortOrder: 7 },

  // Saudi Arabia
  { slug: "riyadh", name: "Riyadh", emirate: "Riyadh Region", country: "sa", nameAr: "الرياض", latitude: "24.7135500", longitude: "46.6752900", sortOrder: 1 },
  { slug: "jeddah", name: "Jeddah", emirate: "Makkah Region", country: "sa", nameAr: "جدة", latitude: "21.4858000", longitude: "39.1925000", sortOrder: 2 },
  { slug: "mecca", name: "Mecca", emirate: "Makkah Region", country: "sa", nameAr: "مكة المكرمة", latitude: "21.3891000", longitude: "39.8579000", sortOrder: 3 },
  { slug: "medina", name: "Medina", emirate: "Madinah Region", country: "sa", nameAr: "المدينة المنورة", latitude: "24.4686800", longitude: "39.6142000", sortOrder: 4 },
  { slug: "dammam", name: "Dammam", emirate: "Eastern Province", country: "sa", nameAr: "الدمام", latitude: "26.3927000", longitude: "49.9777000", sortOrder: 5 },
  { slug: "khobar", name: "Khobar", emirate: "Eastern Province", country: "sa", nameAr: "الخبر", latitude: "26.2172000", longitude: "50.1971000", sortOrder: 6 },
  { slug: "dhahran", name: "Dhahran", emirate: "Eastern Province", country: "sa", nameAr: "الظهران", latitude: "26.2361000", longitude: "50.0393000", sortOrder: 7 },
  { slug: "tabuk", name: "Tabuk", emirate: "Tabuk Region", country: "sa", nameAr: "تبوك", latitude: "28.3838000", longitude: "36.5550000", sortOrder: 8 },
  { slug: "abha", name: "Abha", emirate: "Asir Region", country: "sa", nameAr: "أبها", latitude: "18.2164000", longitude: "42.5053000", sortOrder: 9 },
  { slug: "taif", name: "Taif", emirate: "Makkah Region", country: "sa", nameAr: "الطائف", latitude: "21.2703000", longitude: "40.4158000", sortOrder: 10 },
  { slug: "buraidah", name: "Buraidah", emirate: "Qassim Region", country: "sa", nameAr: "بريدة", latitude: "26.3260000", longitude: "43.9750000", sortOrder: 11 },
  { slug: "hail", name: "Hail", emirate: "Hail Region", country: "sa", nameAr: "حائل", latitude: "27.5114000", longitude: "41.7208000", sortOrder: 12 },
  { slug: "jazan", name: "Jazan", emirate: "Jazan Region", country: "sa", nameAr: "جازان", latitude: "16.8892000", longitude: "42.5700000", sortOrder: 13 },
  { slug: "najran", name: "Najran", emirate: "Najran Region", country: "sa", nameAr: "نجران", latitude: "17.4933000", longitude: "44.1277000", sortOrder: 14 },
  { slug: "al-ahsa", name: "Al Ahsa", emirate: "Eastern Province", country: "sa", nameAr: "الأحساء", latitude: "25.3797000", longitude: "49.5866000", sortOrder: 15 },
  { slug: "jubail", name: "Jubail", emirate: "Eastern Province", country: "sa", nameAr: "الجبيل", latitude: "27.0046000", longitude: "49.6225000", sortOrder: 16 },
  { slug: "khamis-mushait", name: "Khamis Mushait", emirate: "Asir Region", country: "sa", nameAr: "خميس مشيط", latitude: "18.3066000", longitude: "42.7291000", sortOrder: 17 },
  { slug: "yanbu", name: "Yanbu", emirate: "Madinah Region", country: "sa", nameAr: "ينبع", latitude: "24.0895000", longitude: "38.0618000", sortOrder: 18 },

  // Bahrain
  { slug: "manama", name: "Manama", emirate: "Capital Governorate", country: "bh", nameAr: "المنامة", latitude: "26.2235000", longitude: "50.5876000", sortOrder: 1 },
  { slug: "muharraq", name: "Muharraq", emirate: "Muharraq Governorate", country: "bh", nameAr: "المحرق", latitude: "26.2572000", longitude: "50.6119000", sortOrder: 2 },
  { slug: "riffa", name: "Riffa", emirate: "Southern Governorate", country: "bh", nameAr: "الرفاع", latitude: "26.1300000", longitude: "50.5550000", sortOrder: 3 },
  { slug: "isa-town", name: "Isa Town", emirate: "Southern Governorate", country: "bh", nameAr: "مدينة عيسى", latitude: "26.1736000", longitude: "50.5478000", sortOrder: 4 },
  { slug: "sitra", name: "Sitra", emirate: "Capital Governorate", country: "bh", nameAr: "سترة", latitude: "26.1547000", longitude: "50.6244000", sortOrder: 5 },
  { slug: "hamad-town", name: "Hamad Town", emirate: "Northern Governorate", country: "bh", nameAr: "مدينة حمد", latitude: "26.1167000", longitude: "50.4833000", sortOrder: 6 },
  { slug: "budaiya", name: "Budaiya", emirate: "Northern Governorate", country: "bh", nameAr: "البديع", latitude: "26.2189000", longitude: "50.4500000", sortOrder: 7 },

  // Kuwait
  { slug: "kuwait-city", name: "Kuwait City", emirate: "Capital Governorate", country: "kw", nameAr: "مدينة الكويت", latitude: "29.3759000", longitude: "47.9774000", sortOrder: 1 },
  { slug: "hawalli", name: "Hawalli", emirate: "Hawalli Governorate", country: "kw", nameAr: "حولي", latitude: "29.3328000", longitude: "48.0286000", sortOrder: 2 },
  { slug: "salmiya", name: "Salmiya", emirate: "Hawalli Governorate", country: "kw", nameAr: "السالمية", latitude: "29.3347000", longitude: "48.0758000", sortOrder: 3 },
  { slug: "farwaniya", name: "Farwaniya", emirate: "Farwaniya Governorate", country: "kw", nameAr: "الفروانية", latitude: "29.2775000", longitude: "47.9581000", sortOrder: 4 },
  { slug: "jahra", name: "Jahra", emirate: "Jahra Governorate", country: "kw", nameAr: "الجهراء", latitude: "29.3375000", longitude: "47.6581000", sortOrder: 5 },
  { slug: "ahmadi", name: "Ahmadi", emirate: "Ahmadi Governorate", country: "kw", nameAr: "الأحمدي", latitude: "29.0769000", longitude: "48.0839000", sortOrder: 6 },
  { slug: "mangaf", name: "Mangaf", emirate: "Ahmadi Governorate", country: "kw", nameAr: "المنقف", latitude: "29.0975000", longitude: "48.1286000", sortOrder: 7 },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/['']/g, "")            // remove apostrophes
    .replace(/[^a-z0-9\s-]/g, "")    // strip non-alphanumeric (keeps arabic out of slug)
    .replace(/\s+/g, "-")            // spaces → hyphens
    .replace(/-+/g, "-")             // collapse multiple hyphens
    .replace(/^-|-$/g, "");          // trim leading/trailing hyphens
}

function generateId() {
  return crypto.randomBytes(12).toString("hex");
}

function cityId(slug) { return `city_${slug}`; }
function catId(slug) { return `cat_${slug}`; }

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const connString = process.env.DATABASE_URL || "postgresql://zavis_admin@localhost:5432/zavis_landing";
  const pool = new Pool({ connectionString: connString });

  try {
    console.log("Connecting to database...");
    await pool.query("SELECT 1");
    console.log("Connected.\n");

    // 1. Run migration
    console.log("Running migration...");
    await pool.query(`ALTER TABLE cities ADD COLUMN IF NOT EXISTS country TEXT NOT NULL DEFAULT 'ae'`);
    await pool.query(`ALTER TABLE providers ADD COLUMN IF NOT EXISTS country TEXT NOT NULL DEFAULT 'ae'`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_providers_country ON providers (country)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_providers_country_city_slug ON providers (country, city_slug)`);
    console.log("Migration complete.\n");

    // 2. Load existing categories from DB
    const { rows: dbCategories } = await pool.query("SELECT id, slug FROM categories");
    const catSlugToId = {};
    for (const c of dbCategories) {
      catSlugToId[c.slug] = c.id;
    }
    console.log(`Loaded ${dbCategories.length} categories from DB.`);

    // 3. Load existing city slugs from DB
    const { rows: dbCities } = await pool.query("SELECT id, slug FROM cities");
    const existingCitySlugs = new Set(dbCities.map((c) => c.slug));
    console.log(`Loaded ${dbCities.length} existing cities from DB.`);

    // 4. Upsert GCC cities
    console.log("\nUpserting GCC cities...");
    let citiesInserted = 0;

    // Build a lookup of all known GCC city definitions (by slug)
    const gccCityMap = {};
    for (const c of GCC_CITIES) {
      gccCityMap[c.slug] = c;
    }

    // Also track dynamically-created cities for providers with unknown city slugs
    const dynamicCities = {};

    for (const city of GCC_CITIES) {
      await pool.query(
        `INSERT INTO cities (id, name, slug, emirate, country, name_ar, latitude, longitude, sort_order, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
         ON CONFLICT (slug) DO NOTHING`,
        [cityId(city.slug), city.name, city.slug, city.emirate, city.country, city.nameAr, city.latitude, city.longitude, city.sortOrder]
      );
      existingCitySlugs.add(city.slug);
      citiesInserted++;
    }
    console.log(`Upserted ${citiesInserted} GCC cities.`);

    // 5. Load existing provider slugs to handle collisions
    const { rows: dbProviders } = await pool.query("SELECT slug FROM providers");
    const existingSlugs = new Set(dbProviders.map((p) => p.slug));

    // 6. Process each country file
    const summary = {};
    const errors = [];

    for (const { file, country } of FILES) {
      const filePath = path.join(DATA_DIR, file);
      if (!fs.existsSync(filePath)) {
        console.warn(`\nWARNING: ${file} not found, skipping.`);
        continue;
      }

      const providers = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      console.log(`\nProcessing ${file} (${providers.length} providers)...`);

      // Delete existing providers for this country before inserting (idempotent re-run)
      const { rowCount: deleted } = await pool.query(
        `DELETE FROM providers WHERE country = $1`,
        [country]
      );
      if (deleted > 0) {
        console.log(`  Deleted ${deleted} existing ${country.toUpperCase()} providers for clean re-seed.`);
      }
      let inserted = 0;
      let updated = 0;
      let skipped = 0;

      for (const p of providers) {
        try {
          // Resolve category
          const rawCat = (p.category || "clinics").toLowerCase();
          const catSlug = CATEGORY_ALIAS[rawCat] || rawCat;
          const resolvedCatId = catSlugToId[catSlug];
          if (!resolvedCatId) {
            errors.push(`[${country}] Unknown category "${rawCat}" for "${p.name}" — defaulting to clinics`);
            // Fall back to clinics
          }
          const finalCatId = resolvedCatId || catSlugToId["clinics"] || catId("clinics");
          const finalCatSlug = resolvedCatId ? catSlug : "clinics";

          // Resolve city
          let provCitySlug = p.city || "other";
          // Normalize: some Bahrain data has city names, not slugs
          provCitySlug = slugify(provCitySlug);

          // Handle "other" cities for Saudi — map to capital
          if (provCitySlug === "other") {
            if (country === "sa") provCitySlug = "riyadh";
            else if (country === "bh") provCitySlug = "manama";
            else if (country === "qa") provCitySlug = "doha";
            else if (country === "kw") provCitySlug = "kuwait-city";
          }

          // Handle alias: rifaa → riffa, isa-towm → isa-town
          const CITY_ALIASES = {
            "rifaa": "riffa",
            "rifaa--alhajiyat": "riffa",
            "isa-towm": "isa-town",
            "madinat-hamad": "hamad-town",
            "salimabad": "salmabad",
          };
          if (CITY_ALIASES[provCitySlug]) {
            provCitySlug = CITY_ALIASES[provCitySlug];
          }

          // If city doesn't exist yet, create it dynamically
          if (!existingCitySlugs.has(provCitySlug)) {
            if (!dynamicCities[provCitySlug]) {
              // Create a basic city record
              const prettyName = provCitySlug
                .split("-")
                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                .join(" ");

              // Determine emirate/governorate based on country
              let emirate = prettyName;
              if (country === "bh") emirate = "Bahrain";
              else if (country === "qa") emirate = "Qatar";
              else if (country === "sa") emirate = "Saudi Arabia";
              else if (country === "kw") emirate = "Kuwait";

              await pool.query(
                `INSERT INTO cities (id, name, slug, emirate, country, sort_order, created_at)
                 VALUES ($1, $2, $3, $4, $5, 99, NOW())
                 ON CONFLICT (slug) DO NOTHING`,
                [cityId(provCitySlug), prettyName, provCitySlug, emirate, country]
              );
              existingCitySlugs.add(provCitySlug);
              dynamicCities[provCitySlug] = true;
              console.log(`  + Created city: ${prettyName} (${provCitySlug}) [${country}]`);
            }
          }

          const provCityId = cityId(provCitySlug);

          // Generate slug — handle collisions
          let baseSlug = slugify(p.name);
          if (!baseSlug) {
            baseSlug = `provider-${generateId().slice(0, 8)}`;
          }
          let finalSlug = baseSlug;

          // If slug already used and it's not our own re-run, append country code
          if (existingSlugs.has(finalSlug)) {
            const countrySlug = `${baseSlug}-${country}`;
            if (!existingSlugs.has(countrySlug)) {
              finalSlug = countrySlug;
            } else {
              // Still collision — append random suffix
              finalSlug = `${baseSlug}-${country}-${generateId().slice(0, 6)}`;
            }
          }

          const providerId = `prov_${country}_${generateId()}`;

          // Build address — some providers have no address
          const address = p.address || "";

          await pool.query(
            `INSERT INTO providers (
              id, name, slug, name_ar, category_id, category_slug, facility_type,
              country, city_id, city_slug, address, latitude, longitude,
              google_place_id, google_rating, google_review_count,
              phone, email, website, license_number,
              description, short_description, review_summary,
              services, languages, insurance, operating_hours, photos,
              status, is_claimed, is_verified, is_featured,
              created_at, updated_at
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7,
              $8, $9, $10, $11, $12, $13,
              $14, $15, $16,
              $17, $18, $19, $20,
              $21, $22, $23,
              $24, $25, $26, $27, $28,
              'active', false, false, false,
              NOW(), NOW()
            )
            ON CONFLICT (slug) DO NOTHING`,
            [
              providerId,
              p.name,
              finalSlug,
              p.nameAr || null,
              finalCatId,
              finalCatSlug,
              p.facilityType || null,
              country,
              provCityId,
              provCitySlug,
              address,
              p.latitude ? String(p.latitude) : (p.lat ? String(p.lat) : null),
              p.longitude ? String(p.longitude) : (p.lng ? String(p.lng) : null),
              p.googlePlaceId || null,
              p.googleRating ? String(p.googleRating) : null,
              p.googleReviewCount ? Number(p.googleReviewCount) : null,
              p.phone || null,
              p.email || null,
              p.website || null,
              p.licenseNumber || null,
              p.description || null,
              p.shortDescription || null,
              JSON.stringify(p.reviewSummary || []),
              JSON.stringify(p.services || []),
              JSON.stringify(p.languages || []),
              JSON.stringify(p.insurance || []),
              p.operatingHours ? JSON.stringify(p.operatingHours) : null,
              JSON.stringify(p.photos || []),
            ]
          );

          existingSlugs.add(finalSlug);
          inserted++;
        } catch (err) {
          errors.push(`[${country}] Error inserting "${p.name}": ${err.message}`);
          skipped++;
        }
      }

      summary[country] = { total: providers.length, inserted, skipped };
      console.log(`  Done: ${inserted} inserted/updated, ${skipped} skipped`);
    }

    // 7. Print summary
    console.log("\n═══════════════════════════════════════════");
    console.log("  SEED SUMMARY");
    console.log("═══════════════════════════════════════════");
    for (const [country, stats] of Object.entries(summary)) {
      console.log(`  ${country.toUpperCase()}: ${stats.inserted}/${stats.total} providers (${stats.skipped} errors)`);
    }
    const totalInserted = Object.values(summary).reduce((a, s) => a + s.inserted, 0);
    const totalProviders = Object.values(summary).reduce((a, s) => a + s.total, 0);
    console.log(`  TOTAL: ${totalInserted}/${totalProviders}`);
    console.log(`  Dynamic cities created: ${Object.keys(dynamicCities).length}`);

    if (errors.length > 0) {
      console.log(`\n  ERRORS (${errors.length}):`);
      for (const e of errors.slice(0, 50)) {
        console.log(`    - ${e}`);
      }
      if (errors.length > 50) {
        console.log(`    ... and ${errors.length - 50} more`);
      }
    }
    console.log("═══════════════════════════════════════════\n");
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
