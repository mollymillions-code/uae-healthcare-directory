-- ============================================================================
-- Migration: 2026-04-11-authors-reviewers.sql
-- Author:    Claude Code (Zocdoc roadmap Item 5 — /intelligence E-E-A-T leapfrog)
-- Purpose:   Introduce `authors` + `reviewers` tables and extend
--            `journal_articles` with byline + reviewer + clinical metadata.
--            Backs the new `/intelligence/author/[slug]`,
--            `/intelligence/reviewer/[slug]` and `/intelligence/author/`
--            masthead routes, plus the `MedicalWebPage` / `reviewedBy`
--            schema stack on clinical Intelligence articles.
--
-- Design notes
-- ------------
-- 1. ADDITIVE ONLY. No existing tables or columns are touched destructively.
--    Existing `journal_articles` rows continue to read from the legacy
--    `author_name` / `author_role` columns via the intelligence data layer;
--    the new `author_slug` / `reviewer_slug` columns are optional pointers
--    that the page renderer uses to look up rich profile data when present.
--
-- 2. `authors` and `reviewers` are deliberately separate tables. Authors are
--    Zavis editorial staff (or institutional bylines like "Zavis Intelligence
--    Team"); reviewers are external medical / policy / economic experts who
--    validate clinical or regulatory claims. Conflating the two into one
--    table would blur the trust boundary that `MedicalWebPage.reviewedBy`
--    relies on.
--
-- 3. Both tables keep `is_active BOOLEAN` — the seed script lands every
--    placeholder reviewer as `is_active = FALSE` so no unbacked
--    "Medically reviewed by Dr. TBD" byline can leak to production until
--    the editorial team flips the flag on a real assignment.
--
-- 4. `photo_consent BOOLEAN` matches the pattern used by the professionals
--    index (Item 0.75). The profile renderer MUST check `photo_consent`
--    before rendering `photo_url`; when false or null it falls back to an
--    initials avatar.
--
-- 5. `credentials` + `expertise` + `citations` are jsonb so schema.ts can
--    type them strictly without another migration later.
--
-- 6. License number columns (`dha_license_number`, `doh_license_number`,
--    `mohap_license_number`) are NULLable and only populated when the
--    reviewer has personally consented to publishing their licence on
--    Zavis — this is what feeds `schema.org/identifier` on the Person
--    JSON-LD and is the single biggest E-E-A-T leapfrog move versus
--    Zocdoc's Paper Gown reviewer byline model.
--
-- 7. CLAUDE.md § Database Driver requires GRANT ALL to zavis_admin after
--    every schema change. Done at the bottom of this file.
-- ============================================================================

BEGIN;

-- ─── authors ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS authors (
  id                 SERIAL PRIMARY KEY,
  slug               TEXT NOT NULL UNIQUE,
  name               TEXT NOT NULL,
  name_ar            TEXT,
  role               TEXT NOT NULL,                 -- e.g. "Senior Healthcare Analyst"
  role_ar            TEXT,
  bio                TEXT NOT NULL,
  bio_ar             TEXT,
  photo_url          TEXT,
  photo_consent      BOOLEAN NOT NULL DEFAULT FALSE,
  email              TEXT,
  linkedin_url       TEXT,
  twitter_url        TEXT,
  website_url        TEXT,
  orcid_id           TEXT,
  -- e.g. [{"label":"MD","issuer":"DHA","year":2015}]
  credentials        JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- e.g. ["healthcare-policy","insurance","regulatory"]
  expertise          JSONB NOT NULL DEFAULT '[]'::jsonb,
  articles_count     INTEGER NOT NULL DEFAULT 0,
  is_active          BOOLEAN NOT NULL DEFAULT TRUE,
  joined_at          DATE,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_authors_is_active
  ON authors(is_active);
CREATE INDEX IF NOT EXISTS idx_authors_active_slug
  ON authors(is_active, slug);

-- ─── reviewers ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviewers (
  id                      SERIAL PRIMARY KEY,
  slug                    TEXT NOT NULL UNIQUE,
  name                    TEXT NOT NULL,
  name_ar                 TEXT,
  title                   TEXT NOT NULL,            -- e.g. "Consultant Endocrinologist, MBRU"
  title_ar                TEXT,
  institution             TEXT,                     -- e.g. "Mohammed Bin Rashid University"
  bio                     TEXT NOT NULL,
  bio_ar                  TEXT,
  photo_url               TEXT,
  photo_consent           BOOLEAN NOT NULL DEFAULT FALSE,
  linkedin_url            TEXT,
  orcid_id                TEXT,
  dha_license_number      TEXT,
  doh_license_number      TEXT,
  mohap_license_number    TEXT,
  specialty               TEXT,                     -- e.g. "Endocrinology"
  specialty_ar            TEXT,
  -- 'medical' | 'industry' | 'policy' | 'economic' | 'actuarial'
  reviewer_type           TEXT NOT NULL,
  expertise               JSONB NOT NULL DEFAULT '[]'::jsonb,
  reviews_count           INTEGER NOT NULL DEFAULT 0,
  is_active               BOOLEAN NOT NULL DEFAULT TRUE,
  joined_at               DATE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviewers_is_active
  ON reviewers(is_active);
CREATE INDEX IF NOT EXISTS idx_reviewers_type
  ON reviewers(reviewer_type);
CREATE INDEX IF NOT EXISTS idx_reviewers_active_type
  ON reviewers(is_active, reviewer_type);

-- ─── journal_articles additive columns ────────────────────────────────────
ALTER TABLE journal_articles
  ADD COLUMN IF NOT EXISTS author_slug       TEXT,
  ADD COLUMN IF NOT EXISTS reviewer_slug     TEXT,
  ADD COLUMN IF NOT EXISTS reviewer_type     TEXT,
  ADD COLUMN IF NOT EXISTS last_reviewed_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_clinical       BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS citations         JSONB NOT NULL DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_journal_author_slug
  ON journal_articles(author_slug);
CREATE INDEX IF NOT EXISTS idx_journal_reviewer_slug
  ON journal_articles(reviewer_slug);
CREATE INDEX IF NOT EXISTS idx_journal_is_clinical
  ON journal_articles(is_clinical);

-- ─── Permissions (required per CLAUDE.md) ───────────────────────────────────
GRANT ALL ON authors TO zavis_admin;
GRANT ALL ON reviewers TO zavis_admin;
GRANT USAGE, SELECT ON SEQUENCE authors_id_seq TO zavis_admin;
GRANT USAGE, SELECT ON SEQUENCE reviewers_id_seq TO zavis_admin;

COMMIT;

-- ============================================================================
-- ROLLBACK (destructive — run manually if needed):
--   BEGIN;
--   ALTER TABLE journal_articles
--     DROP COLUMN IF EXISTS citations,
--     DROP COLUMN IF EXISTS is_clinical,
--     DROP COLUMN IF EXISTS last_reviewed_at,
--     DROP COLUMN IF EXISTS reviewer_type,
--     DROP COLUMN IF EXISTS reviewer_slug,
--     DROP COLUMN IF EXISTS author_slug;
--   DROP TABLE IF EXISTS reviewers;
--   DROP TABLE IF EXISTS authors;
--   COMMIT;
-- ============================================================================
