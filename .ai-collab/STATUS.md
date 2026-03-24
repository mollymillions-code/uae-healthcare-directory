# Zavis Landing - Project Status

## Overview
- **Project:** Zavis Landing (zavis.ai) - Healthcare directory + Research ecosystem
- **Framework:** Next.js 14.2.35 with React 18, TypeScript, Tailwind CSS

## Database
- **Engine:** PostgreSQL 16 (local on EC2, migrated from Neon serverless)
- **Database name:** `zavis_landing`
- **User:** `zavis_admin`
- **Driver:** node-postgres (`pg`) via `drizzle-orm/node-postgres` — changed from `@neondatabase/serverless`
- **Schema (Drizzle):** `src/lib/db/schema.ts` — cities, areas, categories, subcategories, providers, faqs, journal_articles, journal_subscribers, google_reviews, claim_requests, provider_categories
- **Schema (Research SQL):** `src/lib/research/schema.sql` — pipeline_runs, pipeline_comments, linkedin_posts, email_blasts, performance_scores, automation_schedules, automation_runs, post_queue, automation_notifications, performance_insights
- **Seeded data:** 8 cities, 62 areas, 28 categories, 53 subcategories, 38 providers, 88 FAQs, 108 journal articles

## Hosting & Deployment
- **Hosting:** Self-hosted on AWS EC2 (`13.205.197.148`) via PM2 + Nginx
- **Port:** 3200
- **Domain:** zavis.ai / www.zavis.ai (DNS pending)
- **Preview URL:** http://13.205.197.148 (direct IP access)
- **SSL:** Pending (certbot after DNS pointing)
- **PM2 process name:** `zavis-landing`
- **GitHub:** https://github.com/zavis-support/zavis-landing

## Auto-Deploy (two mechanisms)
1. **GitHub Actions** (`.github/workflows/deploy.yml`) — SSHes into EC2 on push to `main`, runs `git pull + npm install + npm run build + pm2 restart`. Secrets: `EC2_HOST`, `EC2_SSH_KEY`.
2. **GitHub Webhook** (port 9100, PM2: `zavis-deploy-webhook`) — Direct HTTP webhook at `/api/deploy-webhook` with HMAC signature verification. Secret: `zavis-deploy-secret-2026`. Will activate once DNS + SSL are configured.

## Nginx Configuration
- **Static file serving:** `/_next/static` served directly from `.next/static` on disk (required because Next.js route groups with parentheses like `(directory)` break URL-encoded chunk loading when proxied)
- **Public assets:** `/assets` served directly from `public/assets`
- **All other requests:** Proxied to `http://127.0.0.1:3200`
- **Configs:** `/etc/nginx/sites-enabled/zavis.ai`, `/etc/nginx/sites-enabled/zavis-landing-ip`, `/etc/nginx/sites-enabled/landing-preview.zavisinternaltools.in`

## Known Issues / Gotchas
- Next.js route groups `(directory)`, `(research)`, `(landing)` generate static chunks with parentheses in paths. Browsers URL-encode these as `%28/%29`, which Next.js's built-in server can't resolve. **Fix:** Nginx serves `_next/static` directly from disk.
- Journal articles query has a module-level cache (`_dbArticles`). On first request after PM2 restart, it queries the DB. If the DB connection fails, it caches an empty array for the process lifetime.
- The `.env.local` on EC2 does NOT contain Vercel-specific vars (`VERCEL`, `VERCEL_*`, `TURBO_*`).

## Other Services on Same EC2
- `ontology-app` (port 3100) — Zavis Ontology platform
- Postiz / socials — Social media engine
- MCP servers — Financial (9013), Onboarding (9014)
- LinkedIn autoposter — Automated posting
- `zavis-changelog` — Changelog server
- `media-api` — Media pipeline
