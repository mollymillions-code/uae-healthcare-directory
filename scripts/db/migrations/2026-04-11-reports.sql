-- ============================================================================
-- Migration: 2026-04-11-reports.sql
-- Author:    Claude Code (Zocdoc roadmap Item 6 — "What UAE Patients Want"
--            annual report scaffold)
-- Purpose:   Introduce the `reports` + `report_authors` tables backing the
--            new `/intelligence/reports/` route class and the 10 UAE report
--            concept briefs seeded by `scripts/seed-reports.mjs`.
--
-- Design notes
-- ------------
-- 1. ADDITIVE ONLY. No existing tables or columns are touched. The tentpole
--    report surface is entirely new and parallel to `journal_articles`.
--    Reports are their own page class — long-form, data-led, PDF-backed,
--    pitched to press — and have a different lifecycle than weekly Intelligence
--    articles, so they live in their own table.
--
-- 2. `report_authors` is a join table on (report_id, author_slug). We keep
--    `author_slug` as TEXT (not a FK to an `authors` table) because the
--    authors table is Item 5's deliverable — Item 6 only needs the slug so
--    the report page can link out to `/intelligence/author/[slug]` once
--    Item 5 ships. A later migration will convert author_slug to a real FK.
--
-- 3. `chart_data` and `sections` are jsonb. Chart payloads are pre-computed
--    by the editorial team (or an automation script) and stored verbatim
--    so the page renderer can swap in real charts later without another
--    migration. See `src/app/(directory)/intelligence/reports/[slug]/page.tsx`
--    for the expected shape.
--
-- 4. `status` gates sitemap + public visibility. Only `status='published'`
--    rows appear on the hub page and in the sitemap. `draft` and `scheduled`
--    rows are staged for editorial review but NOT indexed.
--
-- 5. `embargo_date` is used by the /intelligence/press/ page to show press
--    contacts what is under embargo versus what is live. It does NOT gate
--    public visibility — `status` does that.
--
-- 6. CLAUDE.md § Database Driver requires GRANT ALL to zavis_admin after
--    every schema change. Done at the bottom of this file.
-- ============================================================================

BEGIN;

-- ─── reports ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reports (
  id                  SERIAL PRIMARY KEY,
  slug                TEXT NOT NULL UNIQUE,
  title               TEXT NOT NULL,
  title_ar            TEXT,
  subtitle            TEXT,
  subtitle_ar         TEXT,
  headline_stat       TEXT NOT NULL,
  headline_stat_ar    TEXT,
  cover_image_url     TEXT,
  pdf_url             TEXT,
  release_date        DATE NOT NULL,
  methodology         TEXT NOT NULL,
  methodology_ar      TEXT,
  data_source         TEXT NOT NULL,
  sample_size         TEXT,
  body_md             TEXT NOT NULL,
  body_md_ar          TEXT,
  chart_data          JSONB NOT NULL DEFAULT '[]'::jsonb,
  sections            JSONB NOT NULL DEFAULT '[]'::jsonb,
  press_release_url   TEXT,
  embargo_date        DATE,
  -- 'draft' | 'scheduled' | 'published' | 'archived'
  status              TEXT NOT NULL DEFAULT 'draft',
  featured            BOOLEAN NOT NULL DEFAULT FALSE,
  view_count          INTEGER NOT NULL DEFAULT 0,
  download_count      INTEGER NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_status
  ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_release_date
  ON reports(release_date DESC);
CREATE INDEX IF NOT EXISTS idx_reports_featured
  ON reports(featured);
CREATE INDEX IF NOT EXISTS idx_reports_status_release
  ON reports(status, release_date DESC);

-- ─── report_authors ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS report_authors (
  report_id    INTEGER NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  author_slug  TEXT NOT NULL,
  -- 'author' | 'editor' | 'reviewer' | 'data'
  role         TEXT NOT NULL DEFAULT 'author',
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (report_id, author_slug)
);

CREATE INDEX IF NOT EXISTS idx_report_authors_slug
  ON report_authors(author_slug);
CREATE INDEX IF NOT EXISTS idx_report_authors_role
  ON report_authors(role);

-- ─── Permissions (required per CLAUDE.md) ───────────────────────────────────
GRANT ALL ON reports TO zavis_admin;
GRANT ALL ON report_authors TO zavis_admin;
GRANT USAGE, SELECT ON SEQUENCE reports_id_seq TO zavis_admin;

COMMIT;

-- ============================================================================
-- ROLLBACK (destructive — run manually if needed):
--   BEGIN;
--   DROP TABLE IF EXISTS report_authors;
--   DROP TABLE IF EXISTS reports;
--   COMMIT;
-- ============================================================================
