# Zavis Landing - Changelog

## 2026-03-25 — [Claude Code] 24-Hour Provider Pages + Area-Level Insurance Pages

- **New file:** `src/app/(directory)/directory/[city]/24-hours/page.tsx` — 24-hour provider filtered pages for all 8 cities
- **Modified:** `src/app/(directory)/directory/[city]/[...segments]/page.tsx` — Added `area-insurance` resolved type for `/directory/[city]/[area]/insurance`
- **Modified:** `src/app/sitemap.ts` — Added 24-hours URLs for all 8 cities + area-insurance URLs for all areas with providers
- **Why:** SEO capture for "24 hour clinic Dubai", "open now pharmacy Abu Dhabi", "insurance JLT Dubai" queries
- **Impact:** 8 new 24-hours city pages + ~62 area-insurance pages, all with JSON-LD, FAQs, answer blocks, cross-links

## 2026-03-25 — [Claude Code] Insurer vs Insurer Head-to-Head Comparison Pages

- **New file:** `src/app/(directory)/insurance/compare/[matchup]/page.tsx` — Programmatic comparison pages for top insurer matchups
- **Modified:** `src/app/sitemap.ts` — Added ~45 matchup URLs for top 10 insurers by network size
- **Why:** SEO/AEO play — captures "Daman vs AXA" and similar comparison search queries with rich structured data
- **Impact:** ~45 new statically generated pages with JSON-LD, dynamic FAQs, side-by-side tables, network bar charts, plan cards, and verdict blocks

## 2026-03-25 — [Claude Code] Description Enrichment Fix (1763-2440)

- Rewrote 500 provider descriptions at indices 1763-2440 where description contained boilerplate "Licensed and regulated by" text
- All 500 entries: 80-105 words (avg 86), 100% in 80-120 word range
- All providers are Dubai-based (DHA regulated)
- 30+ facility types handled: polyclinics (160), optical centers (72), community pharmacies (68), school clinics (47), home healthcare (25), clinical support centers, day surgery, beauty centers, hospitals, laboratories, fertility centers, TCAM clinics, dental labs, cord blood centers, and more
- Name-based specialty detection for correct service descriptions (dental, derma, gynae, nutrition, physio, Ayurveda, autism, Down syndrome, early intervention, chiropractic, osteopathy, prosthetics, etc.)
- FT health desk voice throughout — no AI-tells, no banned words, no promotional tone
- Output: `scripts/enrichment-chunks/fix2-1763-2440.json` — 500 entries, format: `{"index": {"description": "..."}}`

## 2026-03-25 — [Claude Code] Description Enrichment Fix (6000-9999)

- Wrote 4000 new provider descriptions for ALL indices 6000-9999 (all had "licensed and regulated by" pattern from prior enrichment run)
- Also resolved 11 git merge conflicts in `src/lib/providers-scraped.json` (took HEAD version for all)
- Each description: 80-112 words (avg 89), no banned phrases, warm and professional tone
- Includes: facility name + type (inferred from facilityType + name + services) + area/city, type-specific service sentences (pharmacy/warehouse/optical/dental/school/nursery/first aid/ayurvedic/general), patient rating + review count, language accessibility, correct regulator (DHA/DOH/MOHAP by city), phone contact
- 3-way sentence variation (idx % 3) to avoid duplicate phrasing across entries
- Output: `scripts/enrichment-chunks/fix-6000-9999.json` — 4000 entries, format: `{"index": {"description": "..."}}`

## 2026-03-25 — [Claude Code] Description Enrichment Fix (3000-5999)

- Wrote 615 new provider descriptions for indices 5000-5998 (all providers in 3000-5999 range where description contained "Licensed by" or was under 50 words — all 615 were in 5000-5998)
- Each description: 80-101 words (avg 94.8), unique per facility type, warm tone, no banned phrases
- Includes: facility name + type + area/city, type-specific services, correct regulator (DHA/DOH/MOHAP by city), patient rating + review count, phone contact
- Fixed 112 article grammar errors (a optical/eye -> an optical/eye), 10 plural errors (1 reviews -> 1 review)
- Output: `scripts/enrichment-chunks/fix-3000-5999.json` — 431KB, 615 entries, format: `{"index": {"description": "..."}}`

## 2026-03-25

### CI/CD: Lint gate added to deploy pipeline
- Deploy workflow now runs `npm run lint` + `tsc --noEmit` BEFORE deploying to EC2
- If lint fails, deploy is blocked — broken code never reaches production
- This was added after unused imports in the labs feature crashed the site (PM2 crash-looped 1405 times, 502 Bad Gateway)
- Fixed unused imports in `labs/home-collection/[city]/page.tsx` and `[city]/[category]/page.tsx`

### Full Neon-to-pg Migration (all scripts)
- Migrated ALL remaining 14 scripts from `@neondatabase/serverless` to `pg` (node-postgres)
- Zero `@neondatabase/serverless` imports remain in the entire codebase
- `scripts/automation/lib/db.mjs` (shared DB module) now uses `pg.Pool` with tagged template wrapper
- `src/lib/intelligence/automation/pipeline.ts` now uses direct `pg.Pool.query()`
- `journal-full-pipeline.yml` workflow now runs on EC2 via SSH (not GitHub runner) since DB is localhost-only

### Tracking & Analytics
- Added Reb2b visitor identification script (`GOYPYHQZ9POX`) to root layout alongside existing GTM, Google Ads, Twitter, Clarity, LinkedIn, and Meta pixels

### Migration from Vercel to Self-Hosted EC2
- Switched DB driver from `@neondatabase/serverless` (neon-http) to `pg` (node-postgres) in 3 files:
  - `src/lib/db/index.ts` — Main Drizzle ORM connection
  - `src/lib/db/seed.ts` — Database seeding script
  - `src/lib/research/db.ts` — Research raw SQL queries (tagged template wrapper)
- Added `pg` and `@types/pg` as dependencies
- Created `zavis_landing` PostgreSQL database on EC2 from `neondb-full-dump.sql`
- Applied Drizzle schema via `drizzle-kit generate` + `drizzle-kit migrate`
- Applied research schema from `src/lib/research/schema.sql` (pipeline_runs, linkedin_posts, email_blasts, automation tables, etc.)
- Restored 108 journal articles from dump (`journal_articles` table was dropped for migration, then data re-imported)
- Seeded directory data: 8 cities, 62 areas, 28 categories, 53 subcategories, 38 providers, 88 FAQs

### Deployment Infrastructure
- Set up PM2 with ecosystem config (`ecosystem.config.js`) on port 3200
- Configured Nginx reverse proxy for `zavis.ai`, `www.zavis.ai`, and direct IP access
- Fixed critical Nginx issue: `_next/static` must be served directly from disk (not proxied) because Next.js route groups `(directory)/(research)/(landing)` create chunk paths with parentheses that break when URL-encoded by browsers
- Created GitHub Actions workflow (`.github/workflows/deploy.yml`) for auto-deploy on push to main
- Added GitHub secrets `EC2_HOST` and `EC2_SSH_KEY`
- Created GitHub webhook (ID: 602502216) pointing to `/api/deploy-webhook` with HMAC verification
- Deploy webhook server running on port 9100 via PM2 (`zavis-deploy-webhook`)
- Added `/api/health` endpoint for deploy verification (returns git SHA, commit message, uptime)

### Code Fixes
- Removed unused `subcategories` variable in `src/app/(directory)/directory/[city]/[...segments]/page.tsx` (was causing build failure)
- Added error logging to `getDbArticles()` in `src/lib/intelligence/data.ts` — previously swallowed DB errors silently with empty catch block

### Post-Migration Fixes
- Fixed DB permission issue: tables restored from dump were owned by `postgres`, not `zavis_admin`. Required explicit `GRANT ALL` after migration.
- Fixed `zavis_admin` password authentication failure — password gets reset when other services modify PostgreSQL roles. Must be re-set to `zavis_admin_2026`.
- Both issues caused intelligence page to show "No articles published" despite 108 articles in DB, because `getDbArticles()` caches empty array on first failure.

### Pending
- SSL via certbot (DNS now pointed)
- Remove Vercel deployment once EC2 is confirmed stable
