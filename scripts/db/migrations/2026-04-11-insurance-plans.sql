-- ============================================================================
-- Migration: 2026-04-11-insurance-plans.sql
-- Author:    Claude Code (Zocdoc roadmap Item 1 — Insurance facet layer)
-- Purpose:   Introduce a proper relational insurance-plan model alongside
--            the existing providers.insurance jsonb column, without breaking
--            any existing code path.
--
-- Design notes
-- ------------
-- 1. ADDITIVE ONLY. The existing `providers.insurance` jsonb string[] column
--    stays untouched. Application code continues to read from it via
--    `getProvidersByInsurance()` in `src/lib/data.ts`. The new join table
--    `provider_insurance_acceptance` is populated lazily (see
--    `scripts/seed-insurance-plans.mjs`) and will become the canonical
--    source in a later phase once coverage + verification dates are backfilled.
--
-- 2. Every FK uses integer IDs. `provider_insurance_acceptance.provider_id`
--    references `providers.id` which is a TEXT primary key in the current
--    schema — we keep it as TEXT here (not INT) to match. If the schema
--    ever moves providers.id to INT, update both columns in lockstep.
--
-- 3. `insurance_plans.parent_plan_id` is a self-reference so we can model
--    product hierarchies like Daman -> (Daman Enhanced, Daman Basic).
--
-- 4. Full-text / trigram indexes are NOT added here — Zavis currently
--    handles text search at the application layer. Add them later if the
--    insurance plan table ever grows past ~500 rows.
--
-- 5. CLAUDE.md § Database Driver requires GRANT ALL to zavis_admin after
--    every schema change.
-- ============================================================================

BEGIN;

-- ─── insurance_plans ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS insurance_plans (
  id                  SERIAL PRIMARY KEY,
  slug                TEXT NOT NULL UNIQUE,
  name_en             TEXT NOT NULL,
  name_ar             TEXT,
  -- "carrier" | "TPA" | "gov"
  type                TEXT NOT NULL,
  -- "uae" | "abu-dhabi" | "dubai" | "sharjah" | "northern-emirates"
  geo_scope           TEXT NOT NULL DEFAULT 'uae',
  is_dental           BOOLEAN NOT NULL DEFAULT FALSE,
  is_medical          BOOLEAN NOT NULL DEFAULT TRUE,
  parent_plan_id      INTEGER REFERENCES insurance_plans(id) ON DELETE SET NULL,
  logo_url            TEXT,
  editorial_copy_en   TEXT,
  editorial_copy_ar   TEXT,
  -- Light metadata for quick stats on insurer hub pages (optional).
  website             TEXT,
  founded_year        INTEGER,
  regulator_codes     TEXT[], -- ['DHA','DOH','MOHAP']
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_insurance_plans_geo_scope
  ON insurance_plans(geo_scope);
CREATE INDEX IF NOT EXISTS idx_insurance_plans_type
  ON insurance_plans(type);
CREATE INDEX IF NOT EXISTS idx_insurance_plans_parent
  ON insurance_plans(parent_plan_id);

-- ─── provider_insurance_acceptance ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS provider_insurance_acceptance (
  provider_id   TEXT NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  plan_id       INTEGER NOT NULL REFERENCES insurance_plans(id) ON DELETE CASCADE,
  -- 'legacy_jsonb' | 'daman_network_scrape' | 'thiqa_network_scrape' |
  -- 'provider_self_declared' | 'manual_verify'
  source        TEXT NOT NULL DEFAULT 'legacy_jsonb',
  verified_at   TIMESTAMPTZ,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (provider_id, plan_id)
);

CREATE INDEX IF NOT EXISTS idx_pia_plan
  ON provider_insurance_acceptance(plan_id);
CREATE INDEX IF NOT EXISTS idx_pia_source
  ON provider_insurance_acceptance(source);
CREATE INDEX IF NOT EXISTS idx_pia_verified
  ON provider_insurance_acceptance(verified_at DESC NULLS LAST);

-- ─── Seed: 18 core UAE payer plans ──────────────────────────────────────────
-- These match the editorial-copy module at
-- src/lib/insurance-facets/editorial-copy.ts and the legacy
-- INSURANCE_PROVIDERS constant. Upsert-safe via ON CONFLICT (slug).
INSERT INTO insurance_plans
  (slug, name_en, name_ar, type, geo_scope, is_dental, is_medical, regulator_codes)
VALUES
  ('thiqa',         'Thiqa',                  'ثقة',              'gov',     'abu-dhabi',         TRUE,  TRUE,  ARRAY['DOH']),
  ('daman',         'Daman',                  'ضمان',             'carrier', 'uae',               FALSE, TRUE,  ARRAY['DOH','DHA']),
  ('daman-enhanced','Daman Enhanced',         'ضمان المعزز',      'carrier', 'uae',               TRUE,  TRUE,  ARRAY['DOH','DHA']),
  ('daman-basic',   'Daman Basic',            'ضمان الأساسي',     'carrier', 'uae',               FALSE, TRUE,  ARRAY['DOH','DHA']),
  ('adnic',         'ADNIC',                  'أدنيك',            'carrier', 'uae',               TRUE,  TRUE,  ARRAY['DOH','DHA','MOHAP']),
  ('hayah',         'Hayah Insurance',        'حياة للتأمين',     'carrier', 'uae',               TRUE,  TRUE,  ARRAY['DOH','DHA']),
  ('oman-insurance','Sukoon Insurance',       'سكون للتأمين',     'carrier', 'uae',               TRUE,  TRUE,  ARRAY['DHA','DOH','MOHAP']),
  ('orient',        'Orient Insurance',       'أورينت',           'carrier', 'uae',               TRUE,  TRUE,  ARRAY['DHA','DOH','MOHAP']),
  ('salama',        'Salama Islamic',         'سلامة',            'carrier', 'uae',               TRUE,  TRUE,  ARRAY['DHA','DOH','MOHAP']),
  ('metlife',       'MetLife',                'ميتلايف',          'carrier', 'uae',               TRUE,  TRUE,  ARRAY['DHA','DOH','MOHAP']),
  ('cigna',         'Cigna',                  'سيغنا',            'carrier', 'uae',               TRUE,  TRUE,  ARRAY['DHA','DOH','MOHAP']),
  ('allianz',       'Allianz Care',           'أليانز',           'carrier', 'uae',               TRUE,  TRUE,  ARRAY['DHA','DOH','MOHAP']),
  ('aetna',         'Aetna International',    'إيتنا',            'carrier', 'uae',               TRUE,  TRUE,  ARRAY['DHA','DOH','MOHAP']),
  ('bupa',          'Bupa Global',            'بوبا',             'carrier', 'uae',               TRUE,  TRUE,  ARRAY['DHA','DOH','MOHAP']),
  ('watania',       'Watania',                'وطنية',            'carrier', 'uae',               TRUE,  TRUE,  ARRAY['DHA','DOH','MOHAP']),
  ('globemed',      'GlobeMed Gulf',          'جلوب ميد',         'TPA',     'uae',               FALSE, TRUE,  ARRAY['DHA','DOH','MOHAP']),
  ('nas',           'NAS (NextCare)',         'ناس',              'TPA',     'uae',               FALSE, TRUE,  ARRAY['DHA','DOH','MOHAP']),
  ('mednet',        'MedNet',                 'ميدنت',            'TPA',     'uae',               FALSE, TRUE,  ARRAY['DHA','DOH','MOHAP'])
ON CONFLICT (slug) DO UPDATE SET
  name_en         = EXCLUDED.name_en,
  name_ar         = EXCLUDED.name_ar,
  type            = EXCLUDED.type,
  geo_scope       = EXCLUDED.geo_scope,
  is_dental       = EXCLUDED.is_dental,
  is_medical      = EXCLUDED.is_medical,
  regulator_codes = EXCLUDED.regulator_codes,
  updated_at      = NOW();

-- ─── Parent-plan wiring for Daman Enhanced / Basic ──────────────────────────
UPDATE insurance_plans child
SET parent_plan_id = parent.id
FROM insurance_plans parent
WHERE parent.slug = 'daman'
  AND child.slug IN ('daman-enhanced', 'daman-basic');

-- ─── Permissions (required per CLAUDE.md) ───────────────────────────────────
GRANT ALL ON insurance_plans TO zavis_admin;
GRANT ALL ON provider_insurance_acceptance TO zavis_admin;
GRANT USAGE, SELECT ON SEQUENCE insurance_plans_id_seq TO zavis_admin;

COMMIT;

-- ============================================================================
-- ROLLBACK (destructive — run manually if needed):
--   BEGIN;
--   DROP TABLE IF EXISTS provider_insurance_acceptance;
--   DROP TABLE IF EXISTS insurance_plans;
--   COMMIT;
-- ============================================================================
