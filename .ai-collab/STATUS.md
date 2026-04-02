# Zavis Landing - Project Status

## Overview
- **Project:** Zavis Landing (zavis.ai) — Healthcare directory + Intelligence journal + Research reports
- **Framework:** Next.js 14.2.35 with React 18, TypeScript, Tailwind CSS
- **Branch:** `live` (active development), `old` (pre-debloat snapshot)

## Architecture — Three Applications in One

### 1. Healthcare Directory (`/directory/...`) — 108 pages
UAE healthcare provider directory with 12,500+ facilities across 8 cities, 26 categories, 100+ areas. Includes labs, insurance, comparisons, guides, procedures, Arabic mirrors.

### 2. Intelligence Journal (`/intelligence/...`) — dynamic pages
Healthcare news aggregation — RSS ingestion, AI summarization, auto-publishing. 108 articles in DB.

### 3. Research Reports (`/research/...`) — 2 pages
Research reports ecosystem with 8 published interactive HTML reports.

### 4. Landing/Marketing (`/`) — 22 pages
Homepage, product pages, specialty pages, about, contact, legal.

## Database
- **Engine:** PostgreSQL 16 on EC2 (localhost:5432) + Neon (quota-limited, dumped to EC2)
- **EC2 Database:** `zavis_landing`, user `zavis_admin`
- **Tables:** 21 tables (providers, cities, areas, categories, subcategories, journal_articles, faqs, pipeline_runs, automation_*, post_queue, linkedin_posts, email_blasts, performance_*)
- **Data:** 12,504 providers, 8 cities, 62 areas, 28 categories, 108 articles, 88 FAQs
- **Driver:** `pg` (node-postgres) via `drizzle-orm/node-postgres` — NOT `@neondatabase/serverless`
- **Two DB access patterns:**
  - Drizzle ORM (`src/lib/db/`) — directory & intelligence data
  - Raw SQL (`src/lib/research/db.ts`) — research ecosystem API routes

## Rendering Strategy — ISR (as of 2026-04-02)
- **Directory catch-all pages** (`/directory/[city]/[...segments]`) — NO SSG pre-rendering. Pages built on first visit, cached 6 hours via ISR.
- **Other directory pages** — ISR with 12-hour revalidation (`revalidate: 43200`)
- **Sitemap** — Synchronous generation using constants only (no DB queries). 5,210 structural URLs. Cached 1 hour. Individual provider pages discovered via internal links.
- **Intelligence** — `force-dynamic` (Vercel 19MB ISR limit)
- **Research** — ISR with 1-hour revalidation (`revalidate: 3600`) — pages only read from filesystem, no dynamic features needed
- **Build completes in ~2 minutes** (previously crashed with OOM trying to pre-render 30k+ pages)

## File Structure (Post-Restructure)

```
src/
├── app/
│   ├── (landing)/         — Marketing pages (home, about, pricing, specialties)
│   ├── (directory)/       — Healthcare directory, labs, insurance, dashboard
│   ├── (research)/        — Research reports (own layout, no directory chrome)
│   └── api/
│       ├── research/      — Pipeline, social, emails, automation (17 routes)
│       ├── intelligence/  — Article ingestion, newsletter, OG (3 routes)
│       ├── health/        — Health check
│       ├── search/        — Provider search
│       └── revalidate/    — ISR cache purge
├── components/
│   ├── landing/           — Landing page components (60 files)
│   ├── directory/         — Provider cards, city cards
│   ├── intelligence/      — Article cards, ticker, sidebar
│   ├── research/          — Report viewer, header
│   ├── shared/            — Pagination, star rating
│   ├── seo/               — JsonLd, FAQ section
│   └── ...
├── lib/
│   ├── constants/         — Cities, categories, insurance, labs, procedures (barrel export via index.ts)
│   ├── db/                — Drizzle ORM (index.ts, schema.ts, seed.ts)
│   ├── intelligence/      — Journal automation, categories, data, types
│   ├── research/          — Postiz gateway, Plunk, ElevenLabs, email templates, auth
│   ├── scrapers/          — MOHAP, DHA, DoH scrapers, Google Places enrichment
│   ├── data.ts            — Main provider data access layer
│   ├── helpers.ts         — Utility functions
│   ├── seo.ts             — Schema.org generators
│   └── ...
├── types/
│   ├── index.ts           — Core DB types (via Drizzle InferSelectModel)
│   ├── research.ts        — Report types
│   └── intelligence.ts    — Journal article types (re-export)
└── data/
    └── landing/           — Landing page content data (22 files)

scripts/
├── automation/            — Orchestrator, weekly pipeline, daily distributor, health checks
│   └── lib/               — DB, config, claude-runner, lock, notifications
├── db/                    — cleanup-db, create-table, run-schema
├── media/                 — generate-cover, screenshot-slides, score-slides, seed-post-queue
└── enrich-places-api.js   — Google Places enrichment

data/
└── reports/               — 8 published research reports (HTML + meta.json)
```

## Hosting & Deployment
- **Production:** AWS EC2 (13.205.197.148) — auto-deploy on push to `live` branch
- **Deploy branch:** `live` (default branch on GitHub)
- **EC2 services:** PostgreSQL, Postiz, MCP servers, automation
- **GitHub:** https://github.com/zavis-support/zavis-landing
- **Domain:** zavis.ai / www.zavis.ai

## Automation Pipeline (Research Ecosystem)
- **Scripts:** `scripts/automation/` — orchestrator, weekly-pipeline, daily-distributor, improvement-loop, health-check
- **GitHub Actions:** 4 workflows pending migration from old research repo (daily-posts, weekly-pipeline, friday-review, health-check)
- **Postiz:** Social media scheduling — Docker on EC2 port 4007, MCP server on port 9003
- **Plunk:** Email campaigns via `@plunk/node`
- **Schedule:** Weekly research pipeline, daily social posts, Friday performance review

## Debloat Status (2026-03-26)
- **Repo reduced:** 530.6 MB → 205.2 MB (61% reduction)
- **Removed:** providers-scraped.json (59MB), 276 unused images, remotion/, playwright-mcp/
- **Uninstalled:** playwright, puppeteer, remotion ×4, pdf-parse, xlsx, @anthropic-ai/sdk, jsonwebtoken
- **Converted:** 118 images to WebP (83MB saved)
- **SSG → ISR:** Eliminated 30k+ page pre-rendering that caused OOM crashes
- **Bloat dump:** `/Users/sayanmukherjee/Desktop/Zavis (MASTER)/Zavis Bloat Dump/` (279MB of originals preserved)

## Active Work

- **[Claude Code] 2026-04-02T22:30:00+04:00** — CQ2/CQ3 follow-up: Fixed remaining `as Record<string, ...>` type casts in automation dashboard page (8 casts eliminated). Added `PerformanceInsightRecommendations`, `ContentPatterns`, `TimingScores` interfaces to `src/types/dashboard.ts`. Replaced local type definitions with imports from shared types file. Replaced `Record<string, unknown>` state types for `latestReport`/`latestScore` with proper `AutomationLatestReport`/`AutomationLatestScore` types. Zero lint errors. COMPLETE.

- **[Claude Code] 2026-04-02T21:00:00+04:00** — CQ2/CQ3: Eliminated all `any` types and `eslint-disable` comments from 5 dashboard components. Created `src/types/dashboard.ts` with 20 typed interfaces for pipeline runs, comments, LinkedIn posts, email blasts, performance scores, automation schedules/runs/queue/notifications/insights. Updated analytics, emails, posts, pipeline detail, and calendar pages. Fixed useEffect dependency warnings. Zero lint errors. COMPLETE.

- **[Claude Code] 2026-04-02T20:00:00+04:00** — CQ5/CQ6: Split oversized Navbar.tsx (862 lines) into 7 focused sub-components in src/components/landing/navbar/. Assessed other oversized files (labs guides, conditions, dashboard calendar) — all are content/data-heavy pages where splitting would not improve maintainability. COMPLETE.

- **[Claude Code] 2026-04-02T16:00:00+04:00** — Audit wave 4: P6 bounded LRU cache (data.ts), D6 SELECT * → column whitelist (posts + emails routes), D7 batch inserts (seed.ts 6 functions), D8 composite index (cityId, status), D9 polymorphic FK documentation (faqs), S9 fixed sitemap lastmod. 6 items. COMPLETE.

- **[Claude Code] 2026-04-03T03:00:00+04:00** — SEC11: XSS sanitization for dangerouslySetInnerHTML. Installed `isomorphic-dompurify`, created `src/lib/sanitize.ts` utility, sanitized AI-generated article bodies in `SocialEmbed.tsx` and guide page paragraphs. COMPLETE.

- **[Claude Code] 2026-04-03T02:00:00+04:00** — Audit wave 3: SEC13 (localhost auth bypass removed), SEC15 (integration IDs to env vars), CQ8 (pipeline threshold documentation). 3 items fixed. COMPLETE.

- **[Claude Code] 2026-04-03T01:00:00+04:00** — Audit wave 2: GSAP code-splitting (6 files → dynamic import), CSP header, input validation on research POST endpoints, error leak fix (sheets route), weak password fallback removed (4 files), graceful DB shutdown on both pools. 6 items fixed. COMPLETE.

- **[Claude Code] 2026-04-03T00:15:00+04:00** — Fix silent error swallowing in dashboard components: added error state + .catch() handlers + error rendering to pipeline detail and analytics pages. COMPLETE.

- **[Claude Code] 2026-04-02T23:55:00+04:00** — Fix race condition in article pipeline: added `onConflictDoNothing({ target: journalArticles.slug })` to `persistArticle()` in `pipeline.ts`. Schema already had `uq_journal_slug` unique index. COMPLETE.

- **[Claude Code] 2026-04-02T23:45:00+04:00** — SEO fix: added missing openGraph.images to dynamic provider listing pages (city-area, area-category, area-insurance, city-category-subcategory in English; city-category, city-area, area-category, listing in Arabic). COMPLETE.

- **[Claude Code] 2026-04-02T23:30:00+04:00** — Research pages ISR migration: switched `/research` and `/research/[slug]` from `force-dynamic` to `revalidate = 3600` (1-hour ISR). Both pages only read from filesystem (no cookies, headers, or search params), so force-dynamic was unnecessary overhead. COMPLETE.

- **[Claude Code] 2026-04-02T22:00:00+04:00** — Comprehensive optimization audit + fixes: soft 404 resolution (area+category 0-provider pages now return proper 404, /healthcare route fixed), LCP fix on specialty pages (hero image removed from GSAP AnimatedSection, switched to next/image with priority), Vercel cleanup (removed vercel.json, @vercel/* packages, hardcoded Vercel URLs), DB pool max 2→10, missing schema indexes, CASCADE delete on claimRequests, hardcoded API key removed, health endpoint info-leak stripped, revalidate path validation, SearchBar accessibility, BrandIcons lazy loading, FAQ operating hours empty-data fix, raw ISO timestamps → human-readable dates.

- **[Claude Code] 2026-03-28T13:00:00+04:00** — Created Arabic individual insurance guide page at `src/app/(directory)/ar/insurance/guide/[slug]/page.tsx` — all 5 guide articles fully translated to MSA, 20 FAQs translated, hreflang alternates (en-AE/ar-AE), canonical `/ar/insurance/guide/[slug]`, ISR 43200, generateStaticParams, "في هذا الدليل" TOC, "النقاط الرئيسية" callout, "أدلة ذات صلة" section, Article + FAQPage + BreadcrumbList JSON-LD, zero tsc/eslint errors. COMPLETE.

- **[Claude Code] 2026-03-28T12:00:00+04:00** — Created Arabic at-home lab collection page at `src/app/(directory)/ar/labs/home-collection/page.tsx` — full MSA translation, 6 FAQs, step-by-step 4-card guide, comparison table, city grid using getArabicCityName(), packages section, pros/cons comparison, hreflang alternates (en-AE/ar-AE), canonical `/ar/labs/home-collection`, ISR 43200. Zero tsc errors. COMPLETE.

- **[Claude Code] 2026-03-28T11:30:00+04:00** — Created Arabic city insurance index page at `src/app/(directory)/ar/directory/[city]/insurance/page.tsx` — full MSA translation, all insurers sorted by count, hreflang alternates (en-AE/ar-AE), canonical `/ar/directory/${city.slug}/insurance`, ISR 43200, breadcrumb Home→[City]→التأمين الصحي, city-specific regulatory notes (DHA/DOH/MOHAP). COMPLETE.

- **[Claude Code] 2026-03-28T11:00:00+04:00** — Created Arabic test category page at `src/app/(directory)/ar/labs/category/[category]/page.tsx` — full MSA translation, all TEST_CATEGORIES static params, 4 FAQs, hreflang alternates, ISR 43200. COMPLETE.

- **[Claude Code] 2026-03-28T10:30:00+04:00** — Created Arabic insurance guide hub page at `src/app/(directory)/ar/insurance/guide/page.tsx` — 5 guide cards fully translated to MSA, hreflang alternates, canonical, ISR 43200. COMPLETE.

- **[Claude Code] 2026-04-02T23:45:00+04:00** — Fixed N+1 query waterfall in `/best` page: parallelized per-city queries with `Promise.all`, eliminated duplicate 468-query `popularCombos` loop by reusing already-fetched `catCounts`. COMPLETE.

## Recently Completed (last 48h)

- **[Claude Code] 2026-03-28T00:00:00+04:00** — Created Arabic insurer detail page at `src/app/(directory)/ar/insurance/[insurer]/page.tsx` — full MSA translation, 6 FAQs, coverage table, claims block, "other insurers" section, compare CTA, hreflang alternates, ISR 43200. Zero tsc/eslint errors. COMPLETE.

- **[Claude Code] 2026-03-28T00:00:00+04:00** — Created Arabic insurance page at `src/app/(directory)/ar/insurance/page.tsx` — full MSA translation of the UAE Health Insurance Navigator. 399 lines. All 8 FAQs translated, all sections translated, PlanBrowser + InsuranceQuiz kept as-is (interactive), hreflang alternates set (en-AE/ar-AE), ISR revalidate=43200, zero lint errors.

## CRITICAL Rules
1. **NEVER use `@neondatabase/serverless`** — use `pg` (node-postgres)
2. **All `data.ts` functions are ASYNC** — you MUST `await` them
3. **Run `npm run lint` before pushing** — lint errors block deployment
4. **Images use `.webp` format** — PNGs were converted and removed
5. **Constants barrel export:** `import { CITIES, CATEGORIES } from "@/lib/constants"`
6. **Sitemap is synchronous** — uses constants only, no DB queries
7. **Push to `live` deploys to production** — no staging environment
