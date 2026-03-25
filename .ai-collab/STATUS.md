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

### 1. NEVER change the DB driver back to Neon
The codebase was migrated from `@neondatabase/serverless` to `pg` (node-postgres). These three files MUST use `pg`:
- `src/lib/db/index.ts` — uses `Pool` from `pg` + `drizzle-orm/node-postgres`
- `src/lib/db/seed.ts` — uses `Pool` from `pg` + `drizzle-orm/node-postgres`
- `src/lib/research/db.ts` — uses `Pool` from `pg` with tagged template wrapper

If you see `@neondatabase/serverless` or `drizzle-orm/neon-http` in these files, something has gone wrong.

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

---

## Other Services on Same EC2
- `ontology-app` (port 3100) — Zavis Ontology platform
- Postiz / socials — Social media engine
- MCP servers — Financial (9013), Onboarding (9014)
- LinkedIn autoposter — Automated posting
- `zavis-changelog` — Changelog server
- `media-api` — Media pipeline
- `zavis-deploy-webhook` (port 9100) — GitHub deploy webhook
