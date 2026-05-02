-- Additive compatibility migration for doctor profile facts.
-- Some environments had the Drizzle schema ahead of the original
-- professionals_index table migration, so all-column selects could fail.

BEGIN;

ALTER TABLE professionals_index
  ADD COLUMN IF NOT EXISTS education TEXT,
  ADD COLUMN IF NOT EXISTS education_description TEXT;

GRANT ALL ON professionals_index TO zavis_admin;

COMMIT;
