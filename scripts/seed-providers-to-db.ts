/**
 * Seed script: Load all 12,519 providers from providers-scraped.json into PostgreSQL.
 *
 * Run on EC2 only (DB is localhost):
 *   npx tsx scripts/seed-providers-to-db.ts
 *
 * This script:
 * 1. Reads providers-scraped.json
 * 2. Drops and re-creates all provider rows (TRUNCATE + INSERT)
 * 3. Maps citySlug/categorySlug/areaSlug from the JSON into both slug columns and FK ID columns
 * 4. Batches inserts (100 per batch) to avoid OOM
 *
 * Requires: DATABASE_URL in .env.local or environment
 */

import * as fs from "fs";
import * as path from "path";
import { Pool } from "pg";
import * as dotenv from "dotenv";

// Load .env.local
dotenv.config({ path: path.join(__dirname, "../.env.local") });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("ERROR: DATABASE_URL not set. Run this on EC2 with .env.local.");
  process.exit(1);
}

interface JsonProvider {
  id: string;
  name: string;
  slug: string;
  citySlug: string;
  areaSlug?: string;
  categorySlug: string;
  subcategorySlug?: string;
  address: string;
  phone?: string;
  website?: string;
  email?: string;
  description: string;
  shortDescription: string;
  descriptionAr?: string;
  googleRating: string;
  googleReviewCount: number;
  latitude: string;
  longitude: string;
  isClaimed: boolean;
  isVerified: boolean;
  services: string[];
  languages: string[];
  insurance: string[];
  operatingHours: Record<string, { open: string; close: string }>;
  amenities: string[];
  lastVerified: string;
  facilityType?: string;
  reviewSummary?: string[];
  reviewSummaryAr?: string[];
  coverImageUrl?: string;
  googlePhotoUrl?: string;
}

async function main() {
  const pool = new Pool({ connectionString: DATABASE_URL });

  // Read JSON
  const jsonPath = path.join(__dirname, "../src/lib/providers-scraped.json");
  console.log("Reading providers-scraped.json...");
  const providers: JsonProvider[] = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
  console.log(`Loaded ${providers.length} providers`);

  // Ensure columns exist (add if missing — safe to run multiple times)
  console.log("Ensuring schema columns exist...");
  const alterStatements = [
    `ALTER TABLE providers ADD COLUMN IF NOT EXISTS city_slug TEXT NOT NULL DEFAULT ''`,
    `ALTER TABLE providers ADD COLUMN IF NOT EXISTS category_slug TEXT NOT NULL DEFAULT ''`,
    `ALTER TABLE providers ADD COLUMN IF NOT EXISTS area_slug TEXT`,
    `ALTER TABLE providers ADD COLUMN IF NOT EXISTS subcategory_slug TEXT`,
    `ALTER TABLE providers ADD COLUMN IF NOT EXISTS facility_type TEXT`,
    `ALTER TABLE providers ADD COLUMN IF NOT EXISTS description_ar TEXT`,
    `ALTER TABLE providers ADD COLUMN IF NOT EXISTS review_summary JSONB DEFAULT '[]'`,
    `ALTER TABLE providers ADD COLUMN IF NOT EXISTS review_summary_ar JSONB DEFAULT '[]'`,
    `ALTER TABLE providers ADD COLUMN IF NOT EXISTS google_photo_url TEXT`,
    // Indexes
    `CREATE INDEX IF NOT EXISTS idx_providers_city_slug ON providers(city_slug)`,
    `CREATE INDEX IF NOT EXISTS idx_providers_category_slug ON providers(category_slug)`,
    `CREATE INDEX IF NOT EXISTS idx_providers_city_cat_slug ON providers(city_slug, category_slug)`,
    `CREATE INDEX IF NOT EXISTS idx_providers_city_area_slug ON providers(city_slug, area_slug)`,
  ];

  for (const stmt of alterStatements) {
    try {
      await pool.query(stmt);
    } catch (e: unknown) {
      // Ignore errors (column already exists, etc.)
      const msg = e instanceof Error ? e.message : String(e);
      if (!msg.includes("already exists")) {
        console.warn(`  Warning: ${msg}`);
      }
    }
  }

  // Clear existing providers
  console.log("Truncating existing provider data...");
  await pool.query("TRUNCATE TABLE provider_categories CASCADE");
  await pool.query("TRUNCATE TABLE providers CASCADE");

  // Batch insert
  const BATCH_SIZE = 100;
  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < providers.length; i += BATCH_SIZE) {
    const batch = providers.slice(i, i + BATCH_SIZE);

    for (const p of batch) {
      try {
        await pool.query(
          `INSERT INTO providers (
            id, name, slug, name_ar,
            category_id, category_slug, subcategory_id, subcategory_slug, facility_type,
            city_id, city_slug, area_id, area_slug,
            address, latitude, longitude,
            phone, email, website,
            description, description_ar, short_description,
            review_summary, review_summary_ar,
            services, languages, insurance, operating_hours, amenities,
            google_rating, google_review_count,
            cover_image_url, google_photo_url,
            is_claimed, is_verified, is_featured,
            status, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4,
            $5, $6, $7, $8, $9,
            $10, $11, $12, $13,
            $14, $15, $16,
            $17, $18, $19,
            $20, $21, $22,
            $23, $24,
            $25, $26, $27, $28, $29,
            $30, $31,
            $32, $33,
            $34, $35, $36,
            $37, NOW(), NOW()
          )
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            insurance = EXCLUDED.insurance,
            description = EXCLUDED.description,
            description_ar = EXCLUDED.description_ar,
            review_summary = EXCLUDED.review_summary,
            review_summary_ar = EXCLUDED.review_summary_ar,
            google_photo_url = EXCLUDED.google_photo_url,
            updated_at = NOW()
          `,
          [
            p.id,
            p.name,
            p.slug,
            null, // name_ar — not in JSON
            p.categorySlug, // category_id = use slug as ID (matches constants)
            p.categorySlug,
            p.subcategorySlug || null,
            p.subcategorySlug || null,
            p.facilityType || null,
            p.citySlug, // city_id = use slug as ID (matches constants)
            p.citySlug,
            p.areaSlug || null,
            p.areaSlug || null,
            p.address,
            p.latitude || "0",
            p.longitude || "0",
            p.phone || null,
            p.email || null,
            p.website || null,
            p.description || "",
            p.descriptionAr || null,
            p.shortDescription || "",
            JSON.stringify(p.reviewSummary || []),
            JSON.stringify(p.reviewSummaryAr || []),
            JSON.stringify(p.services || []),
            JSON.stringify(p.languages || []),
            JSON.stringify(p.insurance || []),
            JSON.stringify(p.operatingHours || {}),
            JSON.stringify(p.amenities || []),
            p.googleRating || "0",
            p.googleReviewCount || 0,
            p.coverImageUrl || null,
            p.googlePhotoUrl || null,
            p.isClaimed || false,
            p.isVerified || false,
            false, // is_featured
            "active",
          ]
        );
        inserted++;
      } catch (e: unknown) {
        errors++;
        const msg = e instanceof Error ? e.message : String(e);
        if (errors <= 5) {
          console.error(`  Error inserting ${p.slug}: ${msg}`);
        }
      }
    }

    if ((i + BATCH_SIZE) % 1000 === 0 || i + BATCH_SIZE >= providers.length) {
      console.log(`  Inserted ${Math.min(i + BATCH_SIZE, providers.length)}/${providers.length} (${errors} errors)`);
    }
  }

  console.log(`\n=== SEED COMPLETE ===`);
  console.log(`Inserted: ${inserted}`);
  console.log(`Errors: ${errors}`);

  // Verify
  const result = await pool.query("SELECT COUNT(*) as count FROM providers");
  console.log(`DB row count: ${result.rows[0].count}`);

  // Quick stats
  const cityStats = await pool.query(
    "SELECT city_slug, COUNT(*) as count FROM providers GROUP BY city_slug ORDER BY count DESC"
  );
  console.log("\nProviders by city:");
  for (const row of cityStats.rows) {
    console.log(`  ${row.city_slug}: ${row.count}`);
  }

  await pool.end();
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
