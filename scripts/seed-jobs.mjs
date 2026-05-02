#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Seeds the `jobs` table with editorial-curated launch listings.
// Idempotent — uses ON CONFLICT (slug) DO NOTHING.
//
// Usage:
//   DATABASE_URL=postgres://... node scripts/seed-jobs.mjs
// ---------------------------------------------------------------------------
import { Pool } from "pg";
import { customAlphabet } from "nanoid";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const nanoid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 12);
const newId = (prefix) => `${prefix}_${nanoid()}`;

const __dirname = dirname(fileURLToPath(import.meta.url));
const seedPath = resolve(__dirname, "data/jobs-seed.json");
const SEED_JOBS = JSON.parse(readFileSync(seedPath, "utf8"));

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is required");
    process.exit(1);
  }

  let inserted = 0;
  let skipped = 0;

  for (const job of SEED_JOBS) {
    const id = newId("job");
    const result = await pool.query(
      `
      INSERT INTO jobs (
        id, slug, title, title_ar, clinic_id, external_clinic_name, external_clinic_url,
        city_slug, role, discipline_slug, specialty_slug, subspecialty_slug,
        seniority, employment_type, description_md, requirements_md, benefits_md,
        license_required, dataflow_required, visa_sponsorship,
        salary_min_aed, salary_max_aed, salary_disclosed,
        application_deadline, posted_at, closing_at,
        status, source, posted_by_clinic_user_id
      ) VALUES (
        $1, $2, $3, NULL, NULL, $4, $5,
        $6, $7, $8, $9, NULL,
        $10, $11, $12, $13, $14,
        $15, $16, $17,
        $18, $19, $20,
        NULL, now(), NULL,
        'published', $21, NULL
      )
      ON CONFLICT (slug) DO NOTHING
      RETURNING id;
      `,
      [
        id,
        job.slug,
        job.title,
        job.externalClinicName,
        job.externalClinicUrl ?? null,
        job.citySlug,
        job.role,
        job.disciplineSlug,
        job.specialtySlug,
        job.seniority,
        job.employmentType,
        job.descriptionMd,
        job.requirementsMd,
        job.benefitsMd ?? null,
        job.licenseRequired ?? null,
        job.dataflowRequired ?? null,
        job.visaSponsorship ?? null,
        job.salaryMinAed ?? null,
        job.salaryMaxAed ?? null,
        job.salaryDisclosed ?? false,
        job.source ?? "zavis_curated",
      ]
    );
    if (result.rowCount > 0) inserted += 1;
    else skipped += 1;
  }

  console.log(`Seeded jobs — inserted: ${inserted}, already-present: ${skipped}`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
