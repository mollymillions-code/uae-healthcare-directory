-- Comprehensive Google Places (New API) columns.
-- Applied once, idempotent via IF NOT EXISTS.
-- After this runs on EC2, the schema.ts TS types match the DB columns.

BEGIN;

ALTER TABLE providers ADD COLUMN IF NOT EXISTS google_place_details JSONB;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS gallery_photos      JSONB DEFAULT '[]'::jsonb;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS google_reviews      JSONB DEFAULT '[]'::jsonb;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS editorial_summary   TEXT;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS editorial_summary_lang TEXT;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS accessibility_options JSONB;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS google_types        JSONB DEFAULT '[]'::jsonb;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS plus_code_global    TEXT;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS plus_code_compound  TEXT;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS google_maps_uri     TEXT;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS price_level         TEXT;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS opening_hours_periods JSONB;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS current_opening_hours JSONB;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS address_components  JSONB;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS google_fetched_at   TIMESTAMPTZ;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS business_status     TEXT;

-- Permissions: zavis_admin is the runtime user
GRANT SELECT, INSERT, UPDATE, DELETE ON providers TO zavis_admin;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_providers_google_fetched_at
  ON providers (google_fetched_at)
  WHERE google_fetched_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_providers_has_gallery
  ON providers ((jsonb_array_length(gallery_photos)))
  WHERE gallery_photos IS NOT NULL AND jsonb_array_length(gallery_photos) > 0;

COMMIT;

\echo 'Google Places columns added successfully.'
