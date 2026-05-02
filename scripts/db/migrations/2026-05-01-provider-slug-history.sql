-- Provider slug history table.
-- Records every old slug a provider has had, so we can 301 stale URLs to the
-- canonical version without runtime fuzzy matching. Idempotent — safe to rerun.

CREATE TABLE IF NOT EXISTS provider_slug_history (
  old_slug    TEXT PRIMARY KEY,
  provider_id TEXT NOT NULL,
  city_slug   TEXT,
  archived_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reason      TEXT
);

CREATE INDEX IF NOT EXISTS idx_provider_slug_history_provider
  ON provider_slug_history (provider_id);
