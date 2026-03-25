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
- **Seeded data:** 8 cities, 62 areas, 28 categories, 53 subcategories, 38+ providers, 88 FAQs, 108 journal articles

## Hosting & Deployment
- **Hosting:** Self-hosted on AWS EC2 (`13.205.197.148`) via PM2 + Nginx
- **Port:** 3200
- **Domain:** zavis.ai / www.zavis.ai
- **Preview URL:** http://13.205.197.148 (direct IP access, always works)
- **Health endpoint:** `GET /api/health` — returns current git SHA, commit message, uptime. Use to verify deploy status.
- **PM2 process name:** `zavis-landing`
- **GitHub:** https://github.com/zavis-support/zavis-landing
- **Env file:** `/home/ubuntu/zavis-landing/.env.local` (on EC2, NOT in git)

## Auto-Deploy (two mechanisms)
1. **GitHub Actions** (`.github/workflows/deploy.yml`) — SSHes into EC2 on push to `main`, runs `git checkout -- . && git pull + npm install + npm run build + pm2 restart`. Prints deploy verification at end. Secrets: `EC2_HOST`, `EC2_SSH_KEY`.
2. **GitHub Webhook** (port 9100, PM2: `zavis-deploy-webhook`) — Direct HTTP webhook at `/api/deploy-webhook` with HMAC signature verification. Secret: `zavis-deploy-secret-2026`.

## Nginx Configuration
- **Static file serving:** `/_next/static` served directly from `.next/static` on disk via `alias` directive (required — see CRITICAL below)
- **Public assets:** `/assets` served directly from `public/assets`
- **All other requests:** Proxied to `http://127.0.0.1:3200`
- **Configs:** `/etc/nginx/sites-enabled/zavis.ai`, `/etc/nginx/sites-enabled/zavis-landing-ip`, `/etc/nginx/sites-enabled/landing-preview.zavisinternaltools.in`

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

## Active Work

None currently.

## Recently Completed (last 48h)

- **Claude Code** (2026-03-25T22:45:00+04:00) — Built 24-hour provider filtered pages (`/directory/[city]/24-hours`) and area-level insurance pages (`/directory/[city]/[area]/insurance`). 24-hours page includes: answer block with category breakdown, sorted provider list (cap 50), emergency info section (998/999/997/112), 5 FAQs, JSON-LD (BreadcrumbList, ItemList, FAQPage, SpeakableSpecification), cross-links, and sitemap entries. Area insurance page integrated into catch-all `[...segments]` route with insurer breakdown by area, top 5 ranked list, full insurer grid, 5 FAQs, and sitemap entries.

- **Claude Code** (2026-03-25T20:30:00+04:00) — Built insurer vs insurer head-to-head comparison pages at `/insurance/compare/[matchup]`. Generates top ~45 matchups (C(10,2)) from top 10 insurers by network size. Includes hero, answer blocks, side-by-side comparison table, network-by-city bar chart, plan cards, verdict section, 6 dynamic FAQs, JSON-LD (BreadcrumbList, FAQPage, SpeakableSpecification), and cross-links. Updated sitemap.ts with matchup URLs.

- **Claude Code** (2026-03-25T00:00:00+04:00) — Rewrote 500 provider descriptions at indices 1763-2440 containing boilerplate "Licensed and regulated by" text. All 500 descriptions are 80-120 words in FT health desk voice. Saved to scripts/enrichment-chunks/fix2-1763-2440.json

---

## Other Services on Same EC2
- `ontology-app` (port 3100) — Zavis Ontology platform
- Postiz / socials — Social media engine
- MCP servers — Financial (9013), Onboarding (9014)
- LinkedIn autoposter — Automated posting
- `zavis-changelog` — Changelog server
- `media-api` — Media pipeline
- `zavis-deploy-webhook` (port 9100) — GitHub deploy webhook
