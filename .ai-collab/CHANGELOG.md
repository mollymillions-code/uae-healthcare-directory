# Zavis Landing - Changelog

## 2026-03-28 — [Claude Code] Arabic Individual Insurance Guide Page Created

- **New file:** `src/app/(directory)/ar/insurance/guide/[slug]/page.tsx`
- **What:** Arabic-language mirror of `/insurance/guide/[slug]` — individual guide article pages for all 5 UAE health insurance guides, fully translated to Modern Standard Arabic
- **Guides covered (all body content translated):**
  1. `freelancer-health-insurance` — التأمين الصحي للمستقلين والمقيمين الكفلاء لأنفسهم
  2. `maternity-insurance-uae` — التأمين الصحي للأمومة
  3. `how-to-claim-health-insurance` — كيفية تقديم مطالبة التأمين
  4. `domestic-worker-insurance` — التأمين الصحي للعمالة المنزلية
  5. `switching-health-insurance` — كيفية تغيير شركة التأمين
- **Translation rules followed:** Insurer names (Daman, Thiqa, AXA, Cigna, Bupa, MetLife, Orient Insurance), DHA/DOH/MOHAP/HAAD, AED prices all kept as-is; all prose, headings, FAQs, labels in natural MSA
- **Key labels:** "في هذا الدليل" (In this guide), "النقاط الرئيسية" (Key takeaways), "آخر تحديث" (Last updated), "أدلة ذات صلة" (Related guides)
- **SEO:** canonical `${base}/ar/insurance/guide/${slug}`, hreflang `en-AE → /insurance/guide/[slug]` and `ar-AE → /ar/insurance/guide/[slug]`
- **JSON-LD:** Article schema with `inLanguage: "ar"`, FAQPage schema (20 questions), BreadcrumbList, SpeakableSpecification
- **Breadcrumb:** الإمارات → دليل التأمين الصحي → الأدلة الإرشادية → [Guide Title]
- **ISR:** `revalidate = 43200` (12 hours, matching English page)
- **Static params:** `GUIDES.map(g => ({ slug: g.slug }))` — all 5 guides pre-rendered
- **Layout extras:** "في هذا الدليل" TOC block listing FAQ questions, "النقاط الرئيسية" accent callout, "أدلة ذات صلة" 3-card grid of related guides, `dir="rtl"` on prose and page wrapper
- **Verified:** `tsc --noEmit` and `eslint` both pass with zero errors/warnings
- **Impact:** Arabic-speaking users searching for specific insurance guidance can now land on properly localised guide article pages with full RTL layout and natural MSA prose

## 2026-03-28 — [Claude Code] Arabic At-Home Lab Collection Page Created

- **New file:** `src/app/(directory)/ar/labs/home-collection/page.tsx`
- **What:** Arabic-language mirror of `/labs/home-collection` — full MSA translation including all headings, stats, step-by-step 4-card guide, summary comparison table, popular tests grid, packages section, home vs walk-in pros/cons, city coverage grid (using getArabicCityName()), regulatory note, 6 FAQs, disclaimer.
- **SEO:** canonical `${base}/ar/labs/home-collection`, hreflang `en-AE → /labs/home-collection` and `ar-AE → /ar/labs/home-collection`
- **ISR:** `revalidate = 43200`. Root div `dir="rtl" lang="ar"`.
- **Rules:** Lab names, test abbreviations, AED prices, DHA/DOH/MOHAP all kept in English/as-is. City names via `getArabicCityName()`.
- **Verified:** `tsc --noEmit` zero errors.
- **Impact:** Arabic SEO coverage for UAE home blood test collection queries.

## 2026-03-28 — [Claude Code] Arabic City Insurance Index Page Created

- **New file:** `src/app/(directory)/ar/directory/[city]/insurance/page.tsx`
- **What:** Arabic-language mirror of `/directory/[city]/insurance` — city-level insurance index listing all insurer cards sorted by provider count
- **Translations:** All UI text in Modern Standard Arabic — heading, answer block (with city-specific DHA/DOH/MOHAP regulatory notes), breadcrumb labels, provider count label "مقدم خدمة يقبل"
- **Insurer names** (Daman, Thiqa, AXA, Cigna, Bupa, etc.) kept in English per project rules
- **City names:** displayed via `getArabicCityName()` from `@/lib/i18n`
- **SEO:** canonical `/ar/directory/${city.slug}/insurance`, hreflang en-AE → `/directory/[city]/insurance`, ar-AE → `/ar/directory/[city]/insurance`
- **Insurer links:** `/ar/directory/${city.slug}/insurance/${ins.slug}` (Arabic sub-pages)
- **Sort:** insurers sorted descending by provider count before render
- **ISR:** `revalidate = 43200`
- **generateStaticParams:** `getCities().map(c => ({ city: c.slug }))`
- **Layout:** RTL (`dir="rtl"`), language switch footer link to English equivalent

## 2026-03-28 — [Claude Code] Arabic Insurer Detail Page Created

- **New file:** `src/app/(directory)/ar/insurance/[insurer]/page.tsx`
- **What:** Arabic-language mirror of `/insurance/[insurer]` at `/ar/insurance/[insurer]` — full MSA translation of all headings, coverage table column labels, section headers, 6 FAQ questions and answers, claims process block, "other insurers" section, compare CTA, and disclaimer
- **Rules followed:** Insurer names (Daman, Thiqa, AXA, Cigna, Bupa, Oman Insurance), TPA names (NAS, Nextcare, Mednet), plan names, AED prices, percentages, DHA/DOH/MOHAP/HAAD abbreviations, and `PlanCard`/`NetworkStats` components all kept as-is in English
- **Key labels translated:** "Key Facts" → "حقائق رئيسية", "Health Insurance Plans" → "خطط التأمين الصحي", "Provider Network" → "شبكة مقدمي الخدمة", "Coverage" → "التغطية", "Co-pay" → "المشاركة في الدفع", "Annual Limit" → "الحد السنوي", "Premium" → "قسط التأمين", "Dental" → "طب الأسنان", "Maternity" → "الأمومة", "regulated" → "معتمد", "Est." → "تأسست"
- **SEO:** `generateMetadata` sets canonical to `${base}/ar/insurance/${profile.slug}` with hreflang alternates `en-AE → /insurance/[insurer]` and `ar-AE → /ar/insurance/[insurer]`
- **ISR:** `revalidate = 43200` (12 hours, matching English page)
- **Static params:** `INSURER_PROFILES.map(p => ({ insurer: p.slug }))` — all insurers pre-rendered
- **Page direction:** `dir="rtl"` set on wrapper div; table headers right-aligned
- **Breadcrumb:** الإمارات → دليل التأمين الصحي → {profile.name}
- **"Other insurers" links:** Point to `/ar/insurance/[slug]` (Arabic versions)
- **Verified:** `tsc --noEmit` and `eslint` both pass with zero errors/warnings
- **Impact:** Arabic-speaking users searching for specific insurer information in Arabic now have a properly localised page with correct RTL layout and natural MSA copy

## 2026-03-28 — [Claude Code] Arabic Test Category Page Created

- **New file:** `src/app/(directory)/ar/labs/category/[category]/page.tsx`
- **What:** Arabic-language mirror of the English test category page at `/ar/labs/category/[category]` — dynamic route covering all TEST_CATEGORIES slugs
- **Translations:** All headings, stat labels, badge labels ("يُشترط الصيام" for fasting, "النتائج خلال Xh" for turnaround), FAQ answers, disclaimer — written directly in Modern Standard Arabic
- **Test names** (CBC, HbA1c, etc.), lab names, and AED prices kept in English per project rules
- **Category names** (e.g. "Cardiovascular") kept in English as they come from the shared `TEST_CATEGORIES` constant
- **SEO:** `generateMetadata` sets canonical to `${base}/ar/labs/category/${cat.slug}`, hreflang alternates to `/labs/category/[category]` (en-AE) and `/ar/labs/category/[category]` (ar-AE)
- **ISR:** `revalidate = 43200`
- **generateStaticParams:** `TEST_CATEGORIES.map(cat => ({ category: cat.slug }))`
- **Breadcrumbs:** Home → مقارنة أسعار الفحوصات المخبرية → فحوصات {cat.name}; breadcrumb home link points to `/ar`
- **Other categories grid:** links to `/ar/labs/category/[slug]` (Arabic); count label uses "فحص في هذه الفئة"
- **Language switch:** Footer link to English `/labs/category/[cat.slug]`
- **No unused imports**, `dir="rtl" lang="ar"` on root div
- **Impact:** Arabic-speaking users searching for specific test categories in UAE now have a properly localized, indexable page with full MSA copy

## 2026-03-28 — [Claude Code] Arabic Insurance Guide Hub Page Created

- **New file:** `src/app/(directory)/ar/insurance/guide/page.tsx`
- **What:** Arabic-language hub page listing all 5 insurance guides at `/ar/insurance/guide` — full MSA translation of guide titles, descriptions, heading, and intro paragraph
- **Guide slugs kept as-is** (URL paths, not translated)
- **DHA, DOH, MOHAP** kept as abbreviations per project rules
- **Links:** Each guide card points to `/ar/insurance/guide/[slug]` (Arabic versions)
- **SEO:** `generateMetadata` sets canonical to `${base}/ar/insurance/guide`, hreflang alternates to `/insurance/guide` (en-AE) and `/ar/insurance/guide` (ar-AE)
- **ISR:** `revalidate = 43200` (12 hours)
- **JSON-LD:** breadcrumbSchema and speakableSchema applied
- **No unused imports**, zero lint errors expected
- **Impact:** Arabic-speaking users searching for UAE health insurance guides now land on a properly localized hub page

## 2026-03-28 — [Claude Code] Arabic Labs Page Created

- **New file:** `src/app/(directory)/ar/labs/page.tsx`
- **What:** Arabic-language mirror of `/labs` at `/ar/labs` — full MSA translation of all headings, stats labels, answer-block paragraphs, 6 FAQ answers, and disclaimer
- **Rules followed:** Lab names (Al Borg, Thumbay, Medsol, DarDoc), test names (CBC, Vitamin D, HbA1c), AED prices, and accreditation names (DHA, DOH, MOHAP, CAP, ISO) kept in English
- **SEO:** `generateMetadata` sets canonical to `${base}/ar/labs` with hreflang alternates pointing to `/labs` (en-AE) and `/ar/labs` (ar-AE)
- **ISR:** `revalidate = 43200` (12 hours, matching English page)
- **Verified:** `tsc --noEmit` and `eslint` both pass with zero errors
- **Impact:** Arabic-speaking users and Arabic-language search queries now have a proper localized landing page for UAE lab test price comparison

## 2026-03-27 — [Claude Code] Canonical Domain Fix: www.zavis.ai → zavis.ai

- **`getBaseUrl()`** now always returns `https://zavis.ai` (strips www even if env var has it)
- **Middleware redirect** flipped: `www.zavis.ai` → `zavis.ai` (was the opposite)
- **Why:** GSC property is `zavis.ai` (no www), but sitemap/robots.txt/canonicals all pointed to `www.zavis.ai`. Google couldn't fetch the sitemap because of the domain mismatch.
- **Impact:** All sitemaps, canonical URLs, OG URLs, JSON-LD schema now use `zavis.ai`. Google will re-index with non-www URLs (301 redirect ensures no broken links).
- **Note:** Nginx on EC2 may still have a non-www→www redirect that should be flipped to match. The middleware handles it at the Next.js layer so the site works correctly regardless.

## 2026-03-27 — [Claude Code] Deploy Branch Switch: main → live

- **Deploy workflow** (`.github/workflows/deploy.yml`) now triggers on push to `live` instead of `main`
- **Journal pipeline** (`.github/workflows/journal-full-pipeline.yml`) now pulls/pushes `live` instead of `main`
- **Default branch** on GitHub changed to `live`
- **EC2 server** will pull from `live` on deploy — this also deploys the debloat commit (`5ceb406`) which was previously only on `live` but not `main`
- Updated all documentation: CLAUDE.md, .ai-collab/DEPLOYMENT.md, .ai-collab/STATUS.md, .ai-context.md
- **Why:** The `live` branch had the latest work (including the sitemap rewrite and 61% debloat) but the deploy workflow was still pointing at `main`. This caused the sitemap to 404 on production since the old dynamic sitemap on `main` was timing out.

## 2026-03-26 — [Claude Code] Major Cleanup, Remotion Extraction & SEO Hardening

### Junk Cleanup
- Renamed package from `uae-health-directory` to `zavis-landing` in package.json
- Removed `@neondatabase/serverless` from dependencies (zero neon imports remain)
- Deleted `.env.prod-check`, `.env.vercel-check`, `.env.vercel` (leaked Neon credentials)
- Removed mollymillions-code and girish remote references from DEPLOYMENT.md
- Deleted `.vercel/` directory (no longer on Vercel)
- Fixed hardcoded Neon URL in `scripts/run-schema.mjs` → uses `process.env.DATABASE_URL`
- Updated `.env.local.example` with local PostgreSQL connection string

### Remotion Extraction
- Moved `remotion/` directory to standalone project at `/zavis-remotion/`
- Moved `scripts/render-slide-video.mjs` and `scripts/generate-voiceover.mjs` to zavis-remotion
- Removed devDependencies: `remotion`, `@remotion/bundler`, `@remotion/cli`, `@remotion/renderer`
- Removed npm scripts: `video:studio`, `video:render`, `video:voiceover`
- Cleaned `tsconfig.json` excludes
- Net reduction: ~1700 lines removed from codebase

### SEO Hardening
- **Security headers:** Added HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy to `next.config.mjs` + Nginx
- **poweredByHeader: false** — no more X-Powered-By leak
- **Tracking scripts optimized:** Converted 7 inline scripts to Next.js `<Script>` — GTM/GAds use `afterInteractive`, Twitter/Clarity/LinkedIn/Meta/Reb2b use `lazyOnload` (faster LCP/INP)
- **www canonicalization:** `zavis.ai` → `www.zavis.ai` 301 redirect in middleware.ts + Nginx
- **llms.txt:** Created `public/llms.txt` for AI search visibility (ChatGPT, Perplexity, etc.)
- **robots.ts:** Added rules to block training crawlers (CCBot, cohere-ai)
- **Sitemap rewrite:** Replaced single dynamic sitemap with chunked index (10 chunks via `generateSitemaps()`). Each chunk serves ~3000-5000 URLs. ISR with 1-hour revalidation. Google now gets `/sitemap.xml` → `/sitemap/0.xml` through `/sitemap/9.xml`.

## 2026-03-26 — [Claude Code] DB Audit & Stability Fixes

- Fixed recurring `zavis_admin` PostgreSQL password authentication failure — password was being reset by other EC2 services
- Applied Drizzle migration `0001_round_gabe_jones.sql` — added `city_slug`, `category_slug`, `area_slug`, `subcategory_slug`, `facility_type`, `description_ar`, `review_summary`, `review_summary_ar`, `google_photo_url` columns + 4 indexes to `providers` table
- Populated slug columns for all 12,504 providers from FK relationships (cities, categories, areas, subcategories)
- Re-granted all table permissions to `zavis_admin` after schema changes
- Verified: 12,504 providers, 108 journal articles, 8 cities, 28 categories, 62 areas, 53 subcategories, 88 FAQs — all intact
- Updated .ai-collab STATUS.md, CHANGELOG.md, .ai-context.md, and CLAUDE.md with comprehensive deployment rules and data layer documentation

## 2026-03-25 — [Claude Code] Data Layer Migration (JSON → PostgreSQL)

- Migrated `src/lib/data.ts` from synchronous JSON reads (58MB `providers-scraped.json`) to async PostgreSQL queries via Drizzle ORM
- ALL data functions are now ASYNC — `getProviders()`, `getCityBySlug()`, `getProviderBySlug()`, `getAreaBySlug()`, etc.
- Every page component that calls these functions was updated to `await` them
- Seeded 12,504 providers to DB via `scripts/seed-providers-to-db.ts`
- Sitemap changed to `force-dynamic` to prevent build timeout with 32k+ URLs
- Fallback: if DB is empty, auto-detects and falls back to JSON (commit `ee5de07`)

## 2026-03-25 — [Claude Code] Safe Deploy with Rollback

- Rewrote `.github/workflows/deploy.yml` with safe deploy pipeline:
  1. Backup current `.next` before pulling new code
  2. If build fails → restore backup `.next` → PM2 restart → site stays up on previous version
  3. If health check fails after restart → rollback to backup
- This prevents the site-down scenario where a broken build wipes `.next` and PM2 crash-loops

## 2026-03-25 — [Claude Code] New Page Types (SEO/AEO Expansion)

- 34 healthcare comparison pages (city vs city, hospitals vs clinics)
- Procedure cost pages with provider cards and price tables
- 37 government healthcare filter pages (city, category, area levels)
- Area-level walk-in clinic pages with wait times and FAQs
- Area-level 24-hour and emergency directory pages
- Conditions guide pages with city variants
- Area-level insurance pages
- Lab test result interpretation pages (15 tests: CBC, Vitamin D, B12, etc.)

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
- SSL via certbot (DNS pointed, awaiting certbot run)
- Remove Vercel deployment once EC2 is confirmed stable
- Neon DB project deletion (credentials leaked via GitGuardian alert — `scripts/run-schema.mjs` had hardcoded URI in git history)
