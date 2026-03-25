# Zavis Landing - Changelog

## 2026-03-25

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
