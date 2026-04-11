-- ============================================================================
-- Migration: 2026-04-11-neighborhoods-taxonomy.sql
-- Author:    Claude Code (Zocdoc roadmap Item 3 — UAE neighborhood taxonomy)
-- Purpose:   Upgrade the existing `areas` table with polygon proxy + taxonomy
--            fields so `/directory/[city]/[area]` pages can be seeded from
--            authoritative sources (Dubai Pulse `dm_community-open`, Abu Dhabi
--            Open Data, OSM Overpass) instead of the hand-curated
--            `AREAS` constant in `src/lib/constants/cities.ts`.
--
-- Design notes
-- ------------
-- 1. ADDITIVE ONLY. Every column uses `ADD COLUMN IF NOT EXISTS` so this
--    migration is safe to re-run. Existing columns (`id`, `city_id`, `name`,
--    `slug`, `name_ar`, `latitude`, `longitude`, `description`, `created_at`)
--    are untouched. Zero drops.
--
-- 2. `areas.id` is a TEXT primary key in the current schema
--    (`src/lib/db/schema.ts` line 39). Therefore `parent_area_id` is TEXT,
--    not INT. Any ingestion script that uses integer community IDs from
--    Dubai Pulse must cast them to text before insert.
--
-- 3. True polygon storage needs PostGIS. Until PostGIS is installed on EC2
--    we store:
--       - `bbox`        JSONB — [minLng, minLat, maxLng, maxLat]
--       - `centroid_lat` + `centroid_lng` as DOUBLE PRECISION pair
--    The full GeoJSON polygon stays in the source snapshot files under
--    `data/neighborhoods/` — it's not loaded into Postgres by default. A
--    future PostGIS upgrade can add a `geom geography(Polygon, 4326)` column
--    and backfill from the snapshot files without any breaking change.
--
-- 4. `source` + `source_id` form a soft lookup key so re-ingesting from
--    Dubai Pulse (etc.) is idempotent — the ingestion scripts upsert on
--    the pair (source, source_id) AFTER checking city_id.
--
-- 5. `is_published` lets us gate low-count areas out of directory hubs +
--    sitemap without deleting the row. `min_provider_count` is the
--    per-area indexing threshold (defaults to 0 during seed; bump later
--    once `scripts/neighborhoods/assign-providers-to-areas.mjs` has run).
--
-- 6. `provider_count_cached` + `provider_count_updated_at` are written by
--    the assignment script so the sitemap builder (sync) can gate
--    neighborhood×category URLs without any live DB call.
--
-- 7. CLAUDE.md § Database Driver requires GRANT ALL to zavis_admin after
--    every schema change. Included at the bottom.
--
-- 8. Rollback section is commented out at the bottom. Copy+paste to run.
-- ============================================================================

BEGIN;

-- ─── Additive columns on `areas` ────────────────────────────────────────────
ALTER TABLE areas
  ADD COLUMN IF NOT EXISTS parent_area_id            TEXT REFERENCES areas(id),
  ADD COLUMN IF NOT EXISTS aliases                   JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS level                     SMALLINT NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS source                    TEXT,
  ADD COLUMN IF NOT EXISTS source_id                 TEXT,
  ADD COLUMN IF NOT EXISTS bbox                      JSONB,
  ADD COLUMN IF NOT EXISTS centroid_lat              DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS centroid_lng              DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS is_published              BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS min_provider_count        INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS provider_count_cached     INTEGER,
  ADD COLUMN IF NOT EXISTS provider_count_updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at                TIMESTAMPTZ DEFAULT NOW();

-- `created_at` already exists on the table (NOT NULL DEFAULT NOW()), so we
-- do NOT add it again. Re-running this migration is a no-op.

-- ─── Indexes ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_areas_parent        ON areas (parent_area_id);
CREATE INDEX IF NOT EXISTS idx_areas_source        ON areas (source, source_id);
CREATE INDEX IF NOT EXISTS idx_areas_is_published  ON areas (is_published);
CREATE INDEX IF NOT EXISTS idx_areas_centroid      ON areas (centroid_lat, centroid_lng);
CREATE INDEX IF NOT EXISTS idx_areas_level         ON areas (level);

-- Unique (source, source_id) so upserts from ingestion scripts are safe.
-- NULL source/source_id rows (the legacy `AREAS` constant seed) are excluded
-- by the partial index so they don't collide with each other.
CREATE UNIQUE INDEX IF NOT EXISTS uq_areas_source_source_id
  ON areas (source, source_id)
  WHERE source IS NOT NULL AND source_id IS NOT NULL;

-- ─── Permissions ────────────────────────────────────────────────────────────
GRANT ALL ON areas TO zavis_admin;

COMMIT;

-- ============================================================================
-- ROLLBACK (run manually if needed — NOT part of the forward migration)
-- ============================================================================
-- BEGIN;
--   DROP INDEX IF EXISTS uq_areas_source_source_id;
--   DROP INDEX IF EXISTS idx_areas_level;
--   DROP INDEX IF EXISTS idx_areas_centroid;
--   DROP INDEX IF EXISTS idx_areas_is_published;
--   DROP INDEX IF EXISTS idx_areas_source;
--   DROP INDEX IF EXISTS idx_areas_parent;
--
--   ALTER TABLE areas
--     DROP COLUMN IF EXISTS updated_at,
--     DROP COLUMN IF EXISTS provider_count_updated_at,
--     DROP COLUMN IF EXISTS provider_count_cached,
--     DROP COLUMN IF EXISTS min_provider_count,
--     DROP COLUMN IF EXISTS is_published,
--     DROP COLUMN IF EXISTS centroid_lng,
--     DROP COLUMN IF EXISTS centroid_lat,
--     DROP COLUMN IF EXISTS bbox,
--     DROP COLUMN IF EXISTS source_id,
--     DROP COLUMN IF EXISTS source,
--     DROP COLUMN IF EXISTS level,
--     DROP COLUMN IF EXISTS aliases,
--     DROP COLUMN IF EXISTS parent_area_id;
-- COMMIT;
