#!/usr/bin/env node
/**
 * seed-insurance-plans.mjs
 *
 * Upsert the canonical UAE insurance plan metadata (name, name_ar, type,
 * geo_scope, dental/medical flags, editorial copy) into the `insurance_plans`
 * table. Run this AFTER applying
 *   scripts/db/migrations/2026-04-11-insurance-plans.sql
 *
 * Usage:
 *   DATABASE_URL=postgres://... node scripts/seed-insurance-plans.mjs
 *
 * Safe to re-run — every upsert is idempotent via ON CONFLICT (slug).
 *
 * IMPORTANT: Uses `pg` (node-postgres) directly. Do NOT switch to
 * @neondatabase/serverless — see CLAUDE.md § Database Driver.
 */

import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { Pool } from "pg";

// We cannot import the TypeScript editorial-copy module directly from
// Node without a build step. The canonical source is duplicated below
// at the minimum columns the DB needs (slug, nameEn, nameAr, type,
// geoScope, isDental, isMedical, parentPlanSlug, editorial copy). If
// you add an entry here, also add it to
// src/lib/insurance-facets/editorial-copy.ts — the tests in Item 2
// will fail if the two drift.

const PLANS = [
  {
    slug: "thiqa",
    nameEn: "Thiqa",
    nameAr: "ثقة",
    type: "gov",
    geoScope: "abu-dhabi",
    isDental: true,
    isMedical: true,
    parentPlanSlug: null,
    editorialCopyEn:
      "Thiqa is the Government of Abu Dhabi's premium health programme for Emirati nationals. Administered by Daman on behalf of DOH. Coverage is restricted to UAE nationals inside Abu Dhabi.",
    editorialCopyAr:
      "ثقة هو البرنامج الحكومي المميز للتأمين الصحي في إمارة أبوظبي، المخصص لمواطني الدولة، وتديره شركة ضمان بالنيابة عن دائرة الصحة.",
  },
  {
    slug: "daman-enhanced",
    nameEn: "Daman Enhanced",
    nameAr: "ضمان المعزز",
    type: "carrier",
    geoScope: "uae",
    isDental: true,
    isMedical: true,
    parentPlanSlug: "daman",
    editorialCopyEn:
      "Daman Enhanced is the mid-to-high-tier product line covering most UAE white-collar employer groups. Gold, Silver and Platinum network tiers. Accepted nationwide.",
    editorialCopyAr:
      "ضمان المعزز هو فئة المنتجات المتوسطة إلى العليا التي تغطي معظم مجموعات أصحاب العمل في القطاع الأبيض في الإمارات.",
  },
  {
    slug: "daman-basic",
    nameEn: "Daman Basic",
    nameAr: "ضمان الأساسي",
    type: "carrier",
    geoScope: "uae",
    isDental: false,
    isMedical: true,
    parentPlanSlug: "daman",
    editorialCopyEn:
      "Daman Basic (ex-EBP) is the mandatory floor cover for low-income workers. Steers members to public hospitals plus a narrow private panel. AED 150k annual cap.",
    editorialCopyAr:
      "ضمان الأساسي هو الحد الأدنى الإلزامي من التغطية للعمال محدودي الدخل، ويوجههم نحو المستشفيات الحكومية مع شبكة خاصة ضيقة.",
  },
  {
    slug: "hayah",
    nameEn: "Hayah Insurance",
    nameAr: "حياة للتأمين",
    type: "carrier",
    geoScope: "uae",
    isDental: true,
    isMedical: true,
    parentPlanSlug: null,
    editorialCopyEn:
      "ADX-listed composite insurer (formerly AXA Green Crescent). Specialist SME and retail carrier, strongest in Abu Dhabi and Dubai.",
    editorialCopyAr:
      "شركة تأمين مركبة مدرجة في بورصة أبوظبي (سابقاً أكسا جرين كريسنت).",
  },
  {
    slug: "adnic",
    nameEn: "ADNIC",
    nameAr: "أدنيك",
    type: "carrier",
    geoScope: "uae",
    isDental: true,
    isMedical: true,
    parentPlanSlug: null,
    editorialCopyEn:
      "Abu Dhabi National Insurance Company. Runs one of the two largest domestic medical books. Anchored by Abu Dhabi government and major Dubai corporates.",
    editorialCopyAr:
      "شركة أبوظبي الوطنية للتأمين. تدير واحدة من أكبر محفظتين طبيتين محليتين.",
  },
  {
    slug: "oman-insurance",
    nameEn: "Sukoon Insurance",
    nameAr: "سكون للتأمين",
    type: "carrier",
    geoScope: "uae",
    isDental: true,
    isMedical: true,
    parentPlanSlug: null,
    editorialCopyEn:
      "DFM-listed market leader in Dubai group medical (rebranded from Oman Insurance in Oct 2022). Majority owned by Mashreq Bank. Partnered with MedNet on TPA.",
    editorialCopyAr:
      "الشركة الرائدة المدرجة في سوق دبي المالي في التأمين الطبي الجماعي بدبي (أعيدت تسميتها من عمان للتأمين في أكتوبر 2022).",
  },
];

// Cache so parent-plan FK wiring below only runs one extra SELECT.
let PLAN_ID_BY_SLUG = new Map();

async function upsertPlan(client, plan) {
  const res = await client.query(
    `INSERT INTO insurance_plans
       (slug, name_en, name_ar, type, geo_scope, is_dental, is_medical, editorial_copy_en, editorial_copy_ar, updated_at)
     VALUES
       ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
     ON CONFLICT (slug) DO UPDATE SET
       name_en           = EXCLUDED.name_en,
       name_ar           = EXCLUDED.name_ar,
       type              = EXCLUDED.type,
       geo_scope         = EXCLUDED.geo_scope,
       is_dental         = EXCLUDED.is_dental,
       is_medical        = EXCLUDED.is_medical,
       editorial_copy_en = EXCLUDED.editorial_copy_en,
       editorial_copy_ar = EXCLUDED.editorial_copy_ar,
       updated_at        = NOW()
     RETURNING id`,
    [
      plan.slug,
      plan.nameEn,
      plan.nameAr,
      plan.type,
      plan.geoScope,
      plan.isDental,
      plan.isMedical,
      plan.editorialCopyEn,
      plan.editorialCopyAr,
    ],
  );
  PLAN_ID_BY_SLUG.set(plan.slug, res.rows[0].id);
}

async function wireParents(client) {
  for (const plan of PLANS) {
    if (!plan.parentPlanSlug) continue;
    const parentId = PLAN_ID_BY_SLUG.get(plan.parentPlanSlug);
    const childId = PLAN_ID_BY_SLUG.get(plan.slug);
    if (!parentId || !childId) continue;
    await client.query(
      `UPDATE insurance_plans SET parent_plan_id = $1, updated_at = NOW() WHERE id = $2`,
      [parentId, childId],
    );
  }
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL not set. Aborting.");
    process.exit(1);
  }
  const pool = new Pool({ connectionString: url });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const plan of PLANS) {
      await upsertPlan(client, plan);
      console.log(`  upsert ${plan.slug}`);
    }
    await wireParents(client);
    await client.query("COMMIT");
    console.log(`\n✔ Seeded ${PLANS.length} insurance plans.`);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Seed failed:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }

  // ─── TODO: Network ingestion hooks ────────────────────────────────────
  //
  // The real provider × plan coverage data lives on the payer websites.
  // Below are the known scraping entry points — implement one hook per
  // payer in a follow-up PR and write the output into
  // `provider_insurance_acceptance`.
  //
  // TODO(thiqa-network):
  //   URL: https://www.thiqa.ae/en/doctors-and-facilities
  //   Expected response: HTML table with columns
  //     [Facility Name | Emirate | Category | Contract Status]
  //   Strategy: server-rendered — use playwright or cheerio via agent-browser.
  //
  // TODO(daman-network):
  //   URL: https://www.damanhealth.ae/en/find-a-provider
  //   Expected response: JSON autocomplete endpoint at
  //     /api/providers/search?q=&plan=enhanced
  //   Strategy: hit the JSON endpoint directly, paginate by emirate.
  //
  // TODO(adnic-network):
  //   URL: https://www.adnic.ae/en/individual/health-insurance/network
  //   Expected response: HTML provider list, 1 page per emirate.
  //
  // TODO(sukoon-network):
  //   URL: https://www.sukoon.com/en/medical-insurance/provider-network
  //   Expected response: paginated HTML table.
  //
  // Each hook should:
  //   1. Fetch and normalise the payer's provider list.
  //   2. Fuzzy-match against `providers.name` + `providers.address` using
  //      the existing match utilities in scripts/automation/lib.
  //   3. Upsert rows into `provider_insurance_acceptance` with
  //      source='<payer>_network_scrape', verified_at=NOW().
  //   4. Log a counters report to STDOUT.
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

// Self-reference to silence eslint unused-var complaints if this file is
// ever imported as a module. No-op at script runtime.
export { PLANS };
// These imports are reserved for future hooks that will need filesystem
// access to cache scraped payloads under scripts/.cache/. Reference them
// so bundlers do not strip them.
void fileURLToPath;
void dirname;
void join;
