-- ============================================================================
-- Migration: 2026-04-11-professionals-index.sql
-- Author:    Claude Code (Zocdoc roadmap Item 0.75 — Doctor + Dentist pages)
-- Purpose:   Introduce a dedicated, indexable `professionals_index` table that
--            backs the new /find-a-doctor/[specialty]/[doctor]-[id] route class.
--            Sourced from the DHA Sheryan register (99,520 records) and
--            populated by `scripts/build-professionals-index.mjs`.
--
-- Design notes
-- ------------
-- 1. ADDITIVE ONLY. Does not touch `providers`, `provider_insurance_acceptance`,
--    or `insurance_plans`. The existing JSON-backed `src/lib/professionals.ts`
--    module continues to work unchanged for the pre-existing
--    /find-a-doctor and /professionals pages. The new async helpers read from
--    this new table; legacy sync helpers still read from JSON.
--
-- 2. `photo_url` is intentionally nullable and `photo_consent` defaults to
--    FALSE. Photo rendering in the UI MUST check `photo_consent = true`. This
--    is the Codex "do not show scraped faces without consent" gate.
--
-- 3. `primary_facility_slug` is a soft reference to `providers.slug` (TEXT).
--    It is NOT a foreign key because the match rate is <100% and we do not
--    want to delete professionals when a facility is deleted.
--
-- 4. Per CLAUDE.md § Database Driver, GRANT ALL to zavis_admin after every
--    schema change.
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS professionals_index (
  id                    SERIAL PRIMARY KEY,
  dha_unique_id         TEXT UNIQUE NOT NULL,          -- source DHA ID
  slug                  TEXT UNIQUE NOT NULL,          -- e.g. aadil-gutta-75822009
  name                  TEXT NOT NULL,
  name_ar               TEXT,
  display_title         TEXT NOT NULL,                 -- e.g. "Dr. Aadil Gutta, Consultant Nuclear Medicine"
  discipline            TEXT NOT NULL,                 -- physician | dentist | nurse | pharmacist | allied-health | other
  level                 TEXT NOT NULL,                 -- specialist | consultant | general-practitioner | intern | resident | ...
  specialty             TEXT NOT NULL,                 -- "Nuclear Medicine" | "Obstetrics And Gynecology" | ...
  specialty_slug        TEXT NOT NULL,                 -- nuclear-medicine | obgyn | ...
  category_slug         TEXT,                          -- dental-clinic | pharmacy | ... (maps to Zavis directory category)
  primary_facility_name TEXT,
  primary_facility_slug TEXT,                          -- soft ref to providers.slug
  primary_city_slug     TEXT,                          -- derived from facility match
  license_type          TEXT NOT NULL,                 -- REG | FTL
  license_count         INT NOT NULL DEFAULT 1,
  photo_url             TEXT,                          -- populated later by image scraper (requires consent)
  photo_consent         BOOLEAN NOT NULL DEFAULT FALSE,
  search_terms          JSONB NOT NULL DEFAULT '[]'::jsonb,
  related_conditions    JSONB NOT NULL DEFAULT '[]'::jsonb,
  data_source           TEXT NOT NULL DEFAULT 'dha',
  status                TEXT NOT NULL DEFAULT 'active',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_professionals_specialty_slug
  ON professionals_index (specialty_slug);
CREATE INDEX IF NOT EXISTS idx_professionals_primary_city
  ON professionals_index (primary_city_slug);
CREATE INDEX IF NOT EXISTS idx_professionals_discipline
  ON professionals_index (discipline);
CREATE INDEX IF NOT EXISTS idx_professionals_facility
  ON professionals_index (primary_facility_slug);
CREATE INDEX IF NOT EXISTS idx_professionals_status
  ON professionals_index (status);
CREATE INDEX IF NOT EXISTS idx_professionals_discipline_status
  ON professionals_index (discipline, status);

-- ─── Permissions (required per CLAUDE.md) ───────────────────────────────────
GRANT ALL ON professionals_index TO zavis_admin;
GRANT USAGE, SELECT ON SEQUENCE professionals_index_id_seq TO zavis_admin;

COMMIT;

-- ============================================================================
-- ROLLBACK (destructive — run manually if needed):
--   BEGIN;
--   DROP TABLE IF EXISTS professionals_index;
--   COMMIT;
-- ============================================================================
