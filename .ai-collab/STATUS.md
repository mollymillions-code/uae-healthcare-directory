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

- **[Claude Code] 2026-04-05T10:00:00+04:00** — Queried MCP ads-analytics server (port 9015 on EC2). Tool list retrieved: 55 tools across GA4, GSC, GTM, Google Ads, and Meta Ads. Meta Ads: not configured (META_ACCESS_TOKEN, META_AD_ACCOUNT_ID, META_APP_ID, META_APP_SECRET all empty in .env). Google Ads: not configured (all credential fields empty). No LinkedIn MCP tools exist in server. No custom audiences retrievable until Meta credentials are set. COMPLETE.


- **[Claude Code] 2026-04-04T20:15:00+04:00** — Completed comprehensive data integrity audit on EC2 PostgreSQL database (read-only). Key findings: 11,686 Google Places image URLs (93.5% of all images — expire risk), 33 providers with non-UAE phone numbers (Saudi/Qatar/India/UK/US), 797 providers with google_rating=0.0, 802 providers with zero review count, 1 provider with "Cancelled" in its name but status=active, category coverage only 18 of 43 known slugs (25 slugs unused/empty). No broken image paths, no unknown city/category slugs, no null critical fields, no duplicate slugs. COMPLETE.

- **[Claude Code] 2026-04-04T20:00:00+04:00** — Fixed ALL issues in Arabic professionals pages (12 page.tsx files under /ar/professionals/). Fix 1: internal links now use /ar/ prefix (professionals/, directory/, best/, find-a-doctor). Fix 2: added lang="ar" to 10 divs missing it (area, facility, specialty, specialists, consultants, compare, stats pages). Fix 3: breadcrumb "الدليل" now points to /ar/directory everywhere (JSON-LD + Breadcrumb components). Fix 4: all .toLocaleString() → .toLocaleString("ar-AE") (70+ calls across 3 files). Fix 5: added CATEGORY_DESCRIPTIONS_AR map in hub + category pages. Fix 6: spec.name/cat.name replaced with nameAr fallbacks in area, facility, facility/specialty, area/specialty, stats pages; imported getSpecialtyBySlug into facility and stats. Zero lint errors. COMPLETE.

- **[Claude Code] 2026-04-04T18:30:00+04:00** — Fixed ALL issues in Arabic workforce pages under `/ar/workforce/`. Fix 1: Corrected all internal links missing `/ar/` prefix — 50+ hrefs across 20+ files (SUB_HUBS in hub page, all cross-links, employer/specialty/area/rankings/benchmarks/careers/compare/supply pages). Fix 2: Added `lang="ar"` to 3 files missing it: `specialty/[specialty]`, `category/[category]`, `employer/[slug]`. Fix 3: Fixed breadcrumb paths from `/ar/workforce/career` → `/ar/workforce/careers` in `career/[specialty]` and `career/category/[category]`. Zero lint errors. COMPLETE.

- **[Claude Code] 2026-04-04T17:00:00+04:00** — Applied 4 fixes across Arabic pricing/best/directory/intelligence pages and sitemap. Fix 1: corrected 14 broken internal links (missing /ar/ prefix) across 11 files. Fix 2: corrected i18n.ts typo al-mamzar "المزهر"→"الممزر". Fix 3: fixed Footer.tsx invalid CSS hover:text-[#006828]-light→hover:text-[#008a35]. Fix 4: added ~300 missing Arabic sitemap entries (prof guide pages, workforce compare sub-pages, workforce area×category, pricing sub-pages: category/city, compare/cities, guide/guide/city, journey/journey/city, vs/comp/city, lists/list/city), added hreflang alternates to English homepage entry, updated LAST_CONTENT_UPDATE to 2026-04-05. COMPLETE.

- **[Claude Code] 2026-04-04T16:00:00+04:00** — Code review of sitemap.ts, Header.tsx, Footer.tsx, and i18n.ts. Read-only analysis. Identified hreflang inconsistency, missing Arabic sitemap entries, CSS bug in Footer, translation error in i18n, and other issues.

- **[Claude Code] 2026-04-04T14:00:00+04:00** — Arabic Pricing VS by City page: Created `src/app/(directory)/ar/pricing/vs/[comparison]/[city]/page.tsx` — the last missing Arabic pricing sub-page. All other 12 of the 13 requested pages already existed from prior sessions. New page: dir="rtl" + lang="ar", city-specific side-by-side procedure comparison with Arabic labels, key differences table, cross-city comparison table using getArabicCityName(), when-to-choose sections, insurance coverage section, 4 Arabic FAQs with toLocaleString("ar-AE"), regulatorAr() helper, hreflang en-AE/ar-AE, border-r-4 RTL callout, JSON-LD (BreadcrumbList + FAQPage + SpeakableSpecification), generateStaticParams matching English, revalidate=43200, dynamicParams=true. Zero lint errors. COMPLETE.

- **[Claude Code] 2026-04-04T12:00:00+04:00** — Arabic Intelligence Category Page: Created the only missing Arabic section page — `src/app/(directory)/ar/intelligence/category/[category]/page.tsx`. All 9 JOURNAL_CATEGORIES mapped (regulatory, new-openings, financial, events, social-pulse, thought-leadership, market-intelligence, technology, workforce) with Arabic names and descriptions. Same structure as English: ArticleCard, CategoryNav, TagCloud, EventsSidebar components, dir="rtl", hreflang en-AE/ar-AE alternates, revalidate=3600 (matching English), generateStaticParams over all 9 categories, border-r-4 RTL callout block, toLocaleString("ar-AE") for article count, ArrowLeft icon with rotate-180 for RTL back link, "مقالة" label. Zero lint errors. The 10 other Arabic section pages (best hub, best/[city], best/[city]/[category], directory/guide hub, directory/guide/[slug], directory/compare hub, directory/compare/[slug], directory/top hub, directory/top/[category], professionals/guide/[slug]) were already fully implemented in prior sessions. COMPLETE.

- **[Claude Code] 2026-04-07T10:00:00+04:00** — Arabic Pricing Pages (6 pages): Created all 6 Arabic pricing pages under `src/app/(directory)/ar/pricing/`. Hub (`page.tsx`), procedure detail (`[procedure]/page.tsx`), procedure×city (`[procedure]/[city]/page.tsx`), category hub (`category/[category]/page.tsx`), category×city (`category/[category]/[city]/page.tsx`), city hub (`city/[city]/page.tsx`). All pages: dir="rtl", all UI text in Arabic (MSA), hreflang en-AE/ar-AE alternates, revalidate=43200, dynamicParams=true on dynamic pages, generateStaticParams matching English, border-r-4 RTL callout boxes, numbers toLocaleString("ar-AE"), getArabicCityName()/getArabicRegulator() from i18n, CATEGORY_NAMES_AR inline map for 10 category names, procedure names use proc.nameAr || proc.name, BreadcrumbList + WebPage/Service JSON-LD, FaqSection with Arabic FAQs, CostEstimator retained (client component, language-agnostic), all internal links pointing to /ar/pricing/... routes. Zero lint errors, zero TypeScript errors in new files. COMPLETE.

- **[Claude Code] 2026-04-06T05:00:00+04:00** — Arabic Workforce Intelligence Compare Sub-Pages (4 pages): Created `src/app/(directory)/ar/workforce/compare/specialty/[slugs]/page.tsx`, `compare/area/[slugs]/page.tsx`, `compare/employer/[slugs]/page.tsx`, `compare/category/[slugs]/page.tsx`. All 4 pages: dir="rtl" + lang="ar", Arabic metric labels in comparison tables, hreflang en-AE/ar-AE alternates, dynamicParams=true, revalidate=43200, generateStaticParams matching English (C(15,2) specialty pairs, C(10,2) area pairs, C(20,2) facility pairs, all category pairs), parseSlugs() on "-vs-" delimiter, nameAr fields for specialty/category names, getArabicAreaName() for area names, sizeTierLabelAr() Arabic tier labels in employer page, border-r-4 RTL callout boxes, numbers toLocaleString("ar-AE"), all cross-links pointing to /ar/workforce/... paths. Completes all 16 Arabic workforce intelligence pages. COMPLETE.

- **[Claude Code] 2026-04-06T04:00:00+04:00** — Arabic Workforce Sub-Pages (8 pages): Created `src/app/(directory)/ar/workforce/employers/page.tsx`, `specialties/page.tsx`, `areas/page.tsx`, `area/[area]/page.tsx`, `area/[area]/[category]/page.tsx`, `benchmarks/page.tsx`, `careers/page.tsx`, `rankings/page.tsx`. All pages: dir="rtl" + lang="ar", Arabic text from nameAr/i18n ar.workforce.*, hreflang en-AE/ar-AE alternates, BreadcrumbList + WebPage JSON-LD, revalidate=43200, generateStaticParams on area pages, .toLocaleString("ar-AE") numbers, /ar/workforce/... links throughout, getArabicAreaName() on area pages, PROFESSIONAL_CATEGORIES.nameAr for category labels. Zero lint errors, zero TypeScript errors in new files. COMPLETE.

- **[Claude Code] 2026-04-06T03:00:00+04:00** — Created 3 Arabic workforce pages under `src/app/(directory)/ar/workforce/`: category/[category]/page.tsx, specialty/[specialty]/page.tsx, employer/[slug]/page.tsx. All pages: dir="rtl", Arabic text from cat.nameAr/spec.nameAr/i18n, hreflang en-AE/ar-AE alternates, same Tailwind design as English (border-r-4 for RTL callouts), /ar/workforce/... links, numbers via toLocaleString("ar-AE"), BreadcrumbList + WebPage/MedicalWebPage JSON-LD, revalidate=43200, generateStaticParams, scope="col" on th elements. Zero lint errors, zero TS errors in new files. COMPLETE.

- **[Claude Code] 2026-04-06T02:00:00+04:00** — Arabic Workforce Hub and Overview Pages: Created `src/app/(directory)/ar/workforce/page.tsx` (Arabic workforce hub) and `src/app/(directory)/ar/workforce/overview/page.tsx` (Arabic comprehensive workforce overview). Both pages: dir="rtl" + lang="ar", all UI text in Arabic from ar.workforce.* i18n + inline MSA, category names from PROFESSIONAL_CATEGORIES[i].nameAr, specialty names from ALL_SPECIALTIES[i].nameAr, area names from getArabicAreaName(), Arabic numerals via toLocaleString("ar-AE"), hreflang en-AE/ar-AE alternates, BreadcrumbList + WebPage/Dataset JSON-LD, FAQPage schema on overview, revalidate=43200, scope="col" on all th elements, same Tailwind classes as English, border-r-4 (RTL callout), zero lint errors. COMPLETE.

- **[Claude Code] 2026-04-06T01:00:00+04:00** — Arabic Professionals Specialty/Specialists/Consultants Pages: Created 3 new pages under `src/app/(directory)/ar/professionals/[category]/[specialty]/` — specialty page, specialists sub-page, consultants sub-page. All pages: dir="rtl", Arabic text from nameAr/i18n, hreflang en-AE/ar-AE alternates, same data layer as English, /ar/professionals/... links, 200-professional display limit on specialty page, toLocaleString("ar-AE"). Zero lint errors. COMPLETE.

- **[Claude Code] 2026-04-06T00:00:00+04:00** — Created Arabic professionals hub and category pages: `src/app/(directory)/ar/professionals/page.tsx` and `src/app/(directory)/ar/professionals/[category]/page.tsx`. Both pages use `dir="rtl"` + `lang="ar"`, all UI text from `ar.professionals.*` i18n, category names from `cat.nameAr`, hreflang alternates (en-AE/ar-AE), BreadcrumbList + WebPage JSON-LD, `revalidate=43200`, `generateStaticParams`, and zero lint/TS errors. COMPLETE.

- **[Claude Code] 2026-04-05T09:00:00+04:00** — Comprehensive sitemap expansion: added all missing page routes — /directory hub, /search, 17 landing product pages, 10 specialty pages, 8 research reports, walk-in/emergency/government/top-category per city, lab vs comparisons, lab city×category, lab home-collection city×category, Arabic mirrors for insurance/labs/search/intelligence with hreflang alternates. Updated LAST_CONTENT_UPDATE to 2026-04-04. File grew from 453 to 660 lines. Zero lint errors. COMPLETE.

- **[Claude Code] 2026-04-05T08:00:00+04:00** — Added missing cross-links to Header and Footer. Header: added Professionals + Labs to SECTION_LINKS (6 total items) and mobile nav. Footer: added new "Services" column with 8 links (Healthcare Professionals, Find a Doctor, Best Doctors, Workforce Intelligence, Labs & Diagnostics, Insurance Navigator, Medical Pricing, Arabic Version). Grid expanded from 4 to 5 columns. Zero lint errors. COMPLETE.

- **[Claude Code] 2026-04-05T07:00:00+04:00** — Comprehensive site-wide sitemap & cross-linking audit. Read-only analysis. Identified 50+ page routes missing from sitemap across landing pages, directory sub-routes, Arabic mirrors, labs sub-pages, intelligence, research, and more. Also found major cross-linking gaps in both Header and Footer. COMPLETE.

- **[Claude Code] 2026-04-05T06:00:00+04:00** — Fix 4 link audit issues: (1) Added Compare, Supply Analysis, Rankings cards to workforce hub page, (2) Fixed area links in benchmarks/ftl-rate from `/professionals/area/` to `/workforce/area/`, (3) Fixed breadcrumb JSON-LD in workforce area page from `/workforce` to `/workforce/areas`, (4) Added "Explore More" section to professionals hub with links to /professionals/stats, /professionals/guide/*, /find-a-doctor, /best/doctors. Zero lint errors. COMPLETE.

- **[Claude Code] 2026-04-05T05:00:00+04:00** — Fix medium-priority issues in workforce pages: (1) Added href to intermediate breadcrumb items (Benchmarks, Careers) in 6 sub-pages — both Breadcrumb component and breadcrumbSchema JSON-LD, (2) Standardized OG siteName from "Zavis Healthcare Intelligence" to "UAE Open Healthcare Directory" in 2 files, (3) Fixed table thead borders from border-b border-black/10 to border-b-2 border-[#1c1c1c] in overview page (4 tables). Zero lint errors. COMPLETE.

- **[Claude Code] 2026-04-05T04:30:00+04:00** — Accessibility and design consistency fixes: (1) WCAG contrast fix — changed text-black/40 to text-black/60 on body paragraph in workforce overview FTL/REG explanation, (2) Replaced all border-light-200 (non-existent utility) with border-black/[0.06] across 28 files (globals.css, professionals, workforce, Arabic insurance/labs/directory pages), (3) Added scope="col" to all <th> in <thead> across professionals, workforce/overview, and stats pages (6 files, ~50 th elements). Zero lint errors. COMPLETE.

- **[Claude Code] 2026-04-05T03:00:00+04:00** — Fix broken internal links and add BreadcrumbList JSON-LD. (1) Compare page: fixed `/professionals/.../best` to `/best/doctors/...`, (2) Benchmarks hub: redirected consultant-pipeline and specialty-concentration to existing `/workforce/specialties` and `/workforce/areas`, (3) Careers hub: fixed `/workforce/guide/` to `/professionals/guide/` and remapped guide slugs to match existing pages, (4) Added BreadcrumbList JSON-LD to 5 pages: professionals [category], [category]/[specialty], specialists, consultants, and find-a-doctor. Zero lint errors. COMPLETE.

- **[Claude Code] 2026-04-05T02:00:00+04:00** — Performance and design fixes: (1) Memoize generateFacilitySlug() with Map cache, (2) Memoize resolveArea() with Map cache, (3) Convert ALL_SPECIALTIES.find() to O(1) Map lookup via SPECIALTY_BY_SLUG, (4) Add overflow-x-auto to professionals compare grid table, (5) Fix callout border colors from border-black/10 to border-[#006828] in workforce specialty and category pages. COMPLETE.

- **[Claude Code] 2026-04-04T22:00:00+04:00** — Fix 4 critical issues in professionals directory: (1) specialty page display limit of 200, (2) facility page soft 404 fix using notFound(), (3) DUBAI_POPULATION constant reconciliation (3.6M->3.66M), (4) try/catch error handling for JSON load in professionals.ts. COMPLETE.

- **[Claude Code] 2026-04-04T18:00:00+04:00** — Frontend design consistency and accessibility audit across workforce, professionals, best/doctors, and doctors-at pages. Checking design tokens, WCAG 2.1, responsive design, content quality, cross-page consistency. COMPLETE.

- **[Claude Code] 2026-04-04T15:00:00+04:00** — Complete Workforce Intelligence Section: Built `src/lib/workforce.ts` data layer (17 new computed metrics functions: ratios, benchmarks, FTL rates, concentration indexes, supply metrics) + 29 page files generating ~1,700 pages. Hub pages (7), category profiles (4), specialty profiles (73), employer profiles (~200), rankings (7), benchmarks (4), comparisons (~346), geographic (~130), career (77), supply (36). All routes added to sitemap. Full project lint: zero errors. COMPLETE.

- **[Claude Code] 2026-04-04T10:00:00+04:00** — Built workforce category (4 pages) and specialty (73 pages) profile pages at `/workforce/category/[category]` and `/workforce/specialty/[specialty]`. Labor market analysis pages with license breakdowns, employer concentration, geographic distribution, OECD benchmarks, supply assessments, specialist vs consultant data, and geographic gaps. Zero lint errors. COMPLETE.

- **[Claude Code] 2026-04-03T14:00:00+04:00** — Healthcare labor market & recruitment search query research for UAE/Dubai. Web research only, no code changes. COMPLETE.

- **[Claude Code] 2026-04-04T05:30:00+04:00** — Massive Professional Directory expansion: built 10 new page types (~700+ new pages) across 11 new files. Area pages (`/professionals/area/[area]` + `/professionals/area/[area]/[specialty]`), best doctors hub + per-specialty (`/best/doctors` + `/best/doctors/[specialty]`), specialist/consultant split pages, 8 editorial guides (`/professionals/guide/[slug]`), workforce stats page (`/professionals/stats`), specialty comparison pages (`/professionals/compare/[slugs]`), doctors-at facility aliases (`/doctors-at/[slug]`). Updated sitemap.ts with all new routes. Total professional directory: ~4,000+ pages. All lint-clean. COMPLETE.

- **[Claude Code] 2026-04-03T21:50:00+04:00** — Performance QA audit of https://www.zavis.ai/ homepage using Playwright browser tools. Found 14 console errors (CSP blocking 7 third-party scripts), render-blocking Google Ads script, 7 font preloads, ImageWithFallback using native `<img>` instead of `next/image`, AnimatedSection causing invisible below-fold content for non-JS crawlers, and 12 buttons without `type` attribute. COMPLETE.

- **[Claude Code] 2026-04-04T01:00:00+04:00** — SEO & AEO Enhancement Sprint (6 items): Built "Best of" page enhancements (editorial intros, selection criteria, comparison tables), FAQ expansion for AI Overviews (7 long-tail queries per page), topical authority clusters (hub-and-spoke cross-linking between directory ↔ intelligence), llms.txt + llms-full.txt for AI crawlers, and service-specific flat URL landing pages (/directory/{city}/{procedure} — ~328 new pages). All lint-clean. COMPLETE.

- **[Claude Code] 2026-04-04T01:30:00+04:00** — DHA Professional Directory: COMPLETE. Scraped 99,520 professionals from DHA Sheryan API via Playwright. Built full SEO page architecture: 3,207 pages total (hub, 4 category pages, 73 specialty pages, 506 facility pages, 2,622 facility×specialty pages, find-a-doctor page). Data layer: `src/lib/professionals.ts` (in-memory indexing), `src/lib/constants/professionals.ts` (35 physician + 11 dentist + 4 nurse + 23 allied health specialty definitions). All pages in sitemap. Zero lint errors. COMPLETE.

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

- **[Claude Code] 2026-04-11T13:20:00+04:00** — Logo refresh v2 + client ticker cleanup: replaced all `zavis-logo-*` and `zavis-icon-*` assets in `public/` with new path-based SVGs from `Zavis-Logo-Refresh-Master 2/` (true vector, no font dependency). Regenerated `favicon.svg`/`favicon.png`/`apple-touch-icon.png`/`icon-192.png` from the new icon source. Removed `My London Skin Clinic` from the homepage client ticker (`HomePageClient.tsx`) and deleted the unused `my-london-skin-clinic-logo.webp` asset. Added source kit at `brand/zavis-logo-refresh/`. COMPLETE.

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
