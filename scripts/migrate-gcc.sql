-- GCC Provider Migration
-- Adds country column to cities and providers tables for multi-country support.
-- Safe to run multiple times (IF NOT EXISTS / IF NOT EXISTS).

ALTER TABLE cities ADD COLUMN IF NOT EXISTS country TEXT NOT NULL DEFAULT 'ae';
ALTER TABLE providers ADD COLUMN IF NOT EXISTS country TEXT NOT NULL DEFAULT 'ae';

CREATE INDEX IF NOT EXISTS idx_providers_country ON providers (country);
CREATE INDEX IF NOT EXISTS idx_providers_country_city_slug ON providers (country, city_slug);
