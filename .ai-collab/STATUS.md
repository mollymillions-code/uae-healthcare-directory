# Zavis Landing - Project Status

## Overview
- **Project:** Zavis Landing (zavis.ai) - Healthcare directory + Research ecosystem
- **Framework:** Next.js 14.2.35 with React 18, TypeScript, Tailwind CSS

## Database
- **Engine:** PostgreSQL 16 (local on EC2, migrated from Neon serverless)
- **Database name:** `zavis_landing`
- **User:** `zavis_admin` / **Password:** `zavis_admin_2026`
- **Connection string:** `postgresql://zavis_admin:zavis_admin_2026@localhost:5432/zavis_landing`
- **Driver:** node-postgres (`pg`) via `drizzle-orm/node-postgres` — changed from `@neondatabase/serverless`
- **Schema (Drizzle):** `src/lib/db/schema.ts` — cities, areas, categories, subcategories, providers, faqs, journal_articles, journal_subscribers, google_reviews, claim_requests, provider_categories
- **Schema (Research SQL):** `src/lib/research/schema.sql` — pipeline_runs, pipeline_comments, linkedin_posts, email_blasts, performance_scores, automation_schedules, automation_runs, post_queue, automation_notifications, performance_insights
- **Seeded data:** 8 cities, 62 areas, 28 categories, 53 subcategories, 12,504 providers, 88 FAQs, 108 journal articles

## Data Layer — COMPLETED MIGRATION
- **Provider data (12,504 rows)** lives in PostgreSQL — NOT the old `providers-scraped.json`
- All `data.ts` functions are **ASYNC** — you MUST `await` them (e.g., `await getProviders(...)`, `await getCityBySlug(...)`)
- Constants (CITIES, CATEGORIES, INSURANCE_PROVIDERS, LANGUAGES, CONDITIONS) are still synchronous from TS files
- Provider schema has 50 columns including `city_slug`, `category_slug`, `area_slug`, `facility_type`, `google_photo_url`, `review_summary`
- 2 Drizzle migrations applied (initial + slug columns)
- See `CLAUDE.md` for data access patterns

## Hosting & Deployment
- **Hosting:** Self-hosted on AWS EC2 (`13.205.197.148`) via PM2 + Nginx
- **Port:** 3200
- **Domain:** zavis.ai / www.zavis.ai
- **Preview URL:** http://13.205.197.148 (direct IP access, always works)
- **Health endpoint:** `GET /api/health` — returns current git SHA, commit message, uptime. Use to verify deploy status.
- **PM2 process name:** `zavis-landing`
- **GitHub:** https://github.com/zavis-support/zavis-landing
- **Env file:** `/home/ubuntu/zavis-landing/.env.local` (on EC2, NOT in git)

## Auto-Deploy — SAFE DEPLOY with rollback
**GitHub Actions** (`.github/workflows/deploy.yml`) — on push to `main`:
1. **Lint gate:** Runs `npm run lint` + `tsc --noEmit` on GitHub runner. If lint fails, deploy is blocked.
2. **SSH deploy:** Backs up current `.next` → `git pull` → `npm install` → `npm run build`
3. **Build failure rollback:** If build fails, restores the backup `.next` and restarts PM2 — site stays up on previous version.
4. **Health check:** After restart, hits `http://localhost:3200/`. If it doesn't return 200, rolls back to backup.
5. **Verification:** Prints git SHA, PM2 status, and `/api/health` response.
- Secrets: `EC2_HOST`, `EC2_SSH_KEY`
- Also: GitHub Webhook (port 9100, PM2: `zavis-deploy-webhook`) with HMAC verification. Secret: `zavis-deploy-secret-2026`.

## Nginx Configuration
- **Non-www redirect:** `zavis.ai` → `https://www.zavis.ai` (301) in Nginx server block
- **Security headers:** X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy (set in both Nginx and next.config.mjs)
- **Static file serving:** `/_next/static` served directly from `.next/static` on disk via `alias` directive (required — see CRITICAL below)
- **Public assets:** `/assets` served directly from `public/assets`
- **All other requests:** Proxied to `http://127.0.0.1:3200`
- **Configs:** `/etc/nginx/sites-enabled/zavis.ai`, `/etc/nginx/sites-enabled/zavis-landing-ip`, `/etc/nginx/sites-enabled/landing-preview.zavisinternaltools.in`

## SEO & Performance
- **Sitemap:** Chunked sitemap index (10 chunks via `generateSitemaps()`) at `/sitemap.xml` → `/sitemap/0.xml` through `/sitemap/9.xml`. ISR with 1-hour revalidation.
- **Canonical:** `metadataBase` set in root layout; per-page canonical tags with language alternates
- **Security headers:** HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy (next.config.mjs + Nginx)
- **poweredByHeader:** `false` — no X-Powered-By leak
- **Tracking scripts:** 7 scripts (GTM, Google Ads, Twitter, Clarity, LinkedIn, Meta, Reb2b) — GTM/GAds use `afterInteractive`, rest use `lazyOnload` via Next.js `<Script>`
- **llms.txt:** `public/llms.txt` — structured description for AI search crawlers
- **robots.txt:** Blocks training crawlers (CCBot, cohere-ai), allows search crawlers
- **www redirect:** `zavis.ai` → `www.zavis.ai` (301) in both middleware.ts and Nginx
- **JSON-LD:** 8+ schema types (Organization, MedicalBusiness, FAQ, WebSite, Breadcrumb, ItemList, Speakable, Journal)

## Remotion (Video Rendering) — EXTRACTED
- Remotion was extracted to a standalone project at `/zavis-remotion/` on 2026-03-26
- **NOT part of zavis-landing anymore** — no remotion dependencies, no remotion/ directory
- If you need video rendering, use the separate zavis-remotion project

---

## CRITICAL: Rules for Agents Working on This Project

### 1. NEVER use @neondatabase/serverless — ZERO Neon imports remain
The ENTIRE codebase was migrated from `@neondatabase/serverless` to `pg` (node-postgres). This includes:
- `src/lib/db/index.ts` — Drizzle ORM via `drizzle-orm/node-postgres`
- `src/lib/db/seed.ts` — Drizzle ORM via `drizzle-orm/node-postgres`
- `src/lib/research/db.ts` — tagged template wrapper over `pg.Pool`
- `src/lib/intelligence/automation/pipeline.ts` — direct `pg.Pool.query()`
- `scripts/automation/lib/db.mjs` — shared DB module for ALL automation scripts
- `scripts/run-pipeline-persist.ts` — content pipeline
- `scripts/seed-journal-to-db.ts`, `scripts/seed-post-queue.mjs`, `scripts/run-schema.mjs`, `scripts/create-table.ts`, `scripts/cleanup-db.ts`
- `scripts/regen-all-images.ts`, `scripts/fill-missing-images.ts`, `scripts/generate-db-images.ts`, `scripts/fetch-source-images.ts`, `scripts/fix-google-images.ts`, `scripts/upload-images-r2.ts`

**If you add a new script that needs DB access**, use `pg` Pool — NOT neon. Example:
```typescript
import { Pool } from "pg";
const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const result = await pool.query("SELECT ...");
await pool.end();
```

### 2. NEVER edit files directly on EC2 via SSH
All code changes must go through GitHub. The deploy workflow runs `git checkout -- .` before `git pull`, which **wipes any local changes on EC2**. If you SSH in and edit files, they WILL be lost on next deploy.

### 3. Database permissions after schema changes
If you run `drizzle-kit push/migrate` or apply SQL schema files, you MUST re-grant permissions:
```sql
sudo -u postgres psql zavis_landing -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO zavis_admin;"
sudo -u postgres psql zavis_landing -c "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO zavis_admin;"
```
Without this, the app will silently fail to query new/modified tables.

### 4. PostgreSQL password
The `zavis_admin` password is `zavis_admin_2026`. If another process on EC2 resets it, the app will fail silently (journal articles show empty, research APIs return 500). To fix:
```sql
sudo -u postgres psql -c "ALTER USER zavis_admin WITH PASSWORD 'zavis_admin_2026';"
```
Then restart PM2: `pm2 restart zavis-landing`

### 5. Nginx static files — DO NOT proxy `_next/static`
Next.js route groups `(directory)`, `(research)`, `(landing)` generate chunk files with parentheses in paths. Browsers URL-encode these as `%28/%29`, which Next.js's server can't resolve. The nginx config serves `_next/static` directly from disk via `alias`. **Do not remove or change this.**

### 6. Journal articles — silent failure pattern
`src/lib/intelligence/data.ts` caches DB results in module-level variable `_dbArticles`. If the first DB query after PM2 restart fails (wrong password, permissions, connection refused), it caches an empty array for the entire process lifetime. The only fix is to resolve the DB issue and restart PM2.

### 7. Verifying deploys
After pushing to `main`, check:
- GitHub Actions tab: https://github.com/zavis-support/zavis-landing/actions
- Health endpoint: `curl https://www.zavis.ai/api/health` — compare `version.short` with latest GitHub commit
- If they don't match, SSH in and check `pm2 logs zavis-landing --lines 20`

### 8. The `.env.local` is NOT in git
Environment variables live at `/home/ubuntu/zavis-landing/.env.local` on EC2. If you need to add a new env var, you must SSH in and edit that file, then restart PM2. Do NOT commit `.env.local` to git.

### 9. All scripts and workflows run ON EC2, not on GitHub runners
Since the DB is on localhost, all scripts that need DB access must run on EC2 via SSH. Both GitHub Actions workflows use `appleboy/ssh-action` to SSH into EC2:
- **Deploy** (`.github/workflows/deploy.yml`) — git pull + build + PM2 restart
- **Content pipeline** (`.github/workflows/journal-full-pipeline.yml`) — runs `npx tsx scripts/run-pipeline-persist.ts` on EC2 every 2 hours, commits generated images

If you add a new workflow that needs DB access, it MUST run via SSH on EC2 — GitHub runners cannot reach `localhost:5432`.

### 10. ALWAYS lint before pushing — broken builds TAKE DOWN THE SITE
The deploy pipeline runs `npm run lint` and `tsc --noEmit` BEFORE deploying. If lint fails, deploy is blocked — this is intentional.

**Before pushing ANY code to `main`, you MUST run:**
```bash
npm run lint
```
If there are errors (unused imports, unused variables, type errors), FIX THEM before pushing. Common issues:
- **Unused imports** — remove them. Do NOT import icons, components, or types you don't use.
- **Unused variables** — remove or prefix with `_` (but check `.eslintrc.json` first — some configs reject `_` prefix too).
- **Type errors** — fix them. Do not push code with `any` type workarounds.

**Why this matters:** If a build fails on EC2, the `.next` folder gets wiped during rebuild. PM2 then crash-loops because there's no build to serve, and the ENTIRE SITE goes down with a 502 Bad Gateway. This happened on 2026-03-25 when unused imports in the labs feature crashed the site.

### 11. After deploy, verify the build works
Every deploy rebuilds 27k+ static pages. Always check:
1. GitHub Actions shows green checkmark on BOTH `lint` and `deploy` jobs
2. `curl https://www.zavis.ai/api/health` returns the expected commit SHA
3. If articles show empty, check DB password/permissions (see rules 3 & 4)

### 12. Do NOT push directly to `main` without testing locally
If you're adding new pages, components, or features:
1. Run `npm run lint` locally
2. Run `npm run build` locally to verify static generation works
3. Only then push to `main`

This is a PRODUCTION branch — there is no staging environment. Every push to `main` deploys directly to zavis.ai.

---

## Current State (as of 2026-03-26)

- **Site is live** at https://www.zavis.ai — DNS pointed, SSL pending certbot
- **32k+ pages** generated at build time (providers, cities, categories, areas, labs, comparisons, insurance, 24-hour, walk-in, government, procedures, guides, conditions)
- **Sitemap is dynamic** (`force-dynamic`) to prevent build timeout — not statically generated
- **12,504 providers** in PostgreSQL with enriched descriptions, Google photos, slug columns
- **108 journal articles** in `journal_articles` table
- **Deploy pipeline** has lint gate + rollback — broken builds no longer take down the site

## Recently Completed

### Page Architecture (2026-03-25/26)
- Data layer migration: all `data.ts` functions now async, querying PostgreSQL instead of 58MB JSON
- 34 healthcare comparison pages (city vs city, hospitals vs clinics)
- Procedure cost pages with provider cards and price tables
- 37 government healthcare filter pages (city, category, area levels)
- Area-level walk-in clinic pages with wait times and FAQs
- Area-level 24-hour and emergency directory pages
- Conditions guide pages with city variants
- Area-level insurance pages
- Insurer vs insurer head-to-head comparison pages (~45 matchups)
- Lab test result interpretation pages (15 tests)
- Dynamic sitemap to handle 32k+ URLs without build timeout

### Infrastructure (2026-03-25)
- Full Vercel → EC2 migration (PM2 + Nginx)
- Neon → local PostgreSQL migration (all 14+ scripts)
- Safe deploy with rollback in GitHub Actions
- Lint gate in CI pipeline
- Provider data seeded to DB (12,504 rows from providers-scraped.json)
- Drizzle schema migration for slug columns + indexes
- Provider description enrichment (5000+ descriptions rewritten)

---

## Other Services on Same EC2
- `ontology-app` (port 3100) — Zavis Ontology platform
- Postiz / socials — Social media engine
- MCP servers — Financial (9013), Onboarding (9014)
- LinkedIn autoposter — Automated posting
- `zavis-changelog` — Changelog server
- `media-api` — Media pipeline
- `zavis-deploy-webhook` (port 9100) — GitHub deploy webhook
