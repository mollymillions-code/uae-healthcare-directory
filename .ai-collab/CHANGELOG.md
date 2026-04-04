# Zavis Landing - Changelog

## 2026-04-05 — [Claude Code] Fix Broken Book-a-Demo Form

**Signed by:** Claude Code · 2026-04-05T23:15:00+04:00

### Root Cause

The demo booking form on `/contact` and `/book-a-demo` was completely broken — users saw "Something went wrong" on every submission. Three compounding issues:

1. **Dead backend URL:** `ContactPageClient.tsx` fallback pointed to `zavis-onboarding.vercel.app` which returned HTTP 402 (Payment Required — Vercel billing issue).
2. **Missing webhook secret:** Neither the landing site nor the onboarding backend had `LEADS_WEBHOOK_SECRET` configured, so even with a working URL, the backend rejected every request with 401.
3. **CSP blocking:** `next.config.mjs` Content-Security-Policy `connect-src` did not include `clientops.zavisinternaltools.in`, so browsers silently blocked the fetch before it left the page.

### Files Modified

- **`src/components/landing/pages/ContactPageClient.tsx`** — Changed fallback `ZAVIS_API_URL` from `https://www.zavis.ai` to `https://clientops.zavisinternaltools.in` (the EC2 onboarding backend).
- **`next.config.mjs`** — Added `https://clientops.zavisinternaltools.in` to CSP `connect-src` directive.

### EC2 Configuration Changes

- **`/home/ubuntu/zavis-shared/.env.local`** — Added `NEXT_PUBLIC_ZAVIS_API_URL=https://clientops.zavisinternaltools.in` and `NEXT_PUBLIC_LEADS_WEBHOOK_SECRET=<secret>`.
- **`/home/ubuntu/zavis-onboarding/.env.local`** — Added matching `LEADS_WEBHOOK_SECRET=<secret>`.
- Restarted `zavis-onboarding` PM2 process to pick up the new secret.

### Commits

- `01f5531` — fix: point book-a-demo form to EC2 onboarding backend
- `862f08d` — fix: add clientops to CSP connect-src — unblocks demo booking form

### Deployment

Both commits deployed via GitHub Actions blue-green pipeline. Active slot swapped blue→green→blue across the two deploys. End-to-end verified: CORS preflight 204, POST returns 201, lead created in DB.

---

## 2026-04-04 — [Claude Code] Arabic VS by City Page

**Signed by:** Claude Code · 2026-04-04T14:00:00+04:00

### File Created

- **`src/app/(directory)/ar/pricing/vs/[comparison]/[city]/page.tsx`** — Arabic procedure-vs-procedure comparison page scoped to a specific UAE city. City-specific side-by-side comparison of two procedures, key differences table, cross-city comparison table, when-to-choose sections, insurance coverage block, 4 Arabic FAQs.

### Pattern applied

- `dir="rtl"` + `lang="ar"` on root wrapper div
- `border-r-4` RTL callout block
- `getArabicCityName()` for all city name display
- `toLocaleString("ar-AE")` for all numbers and percentages
- `regulatorAr()` inline helper (DHA/DOH/MOHAP in Arabic)
- `insuranceLabelAr()` inline helper for Arabic coverage labels
- hreflang en-AE/ar-AE alternates in metadata
- `generateStaticParams` matching English (all comparison×city pairs where both procedures have city pricing)
- `revalidate = 43200`, `dynamicParams = true`
- BreadcrumbList + FAQPage + SpeakableSpecification JSON-LD
- Zero ESLint warnings or errors

### Impact

- Completes all 13 Arabic pricing section pages requested. The other 12 (compare hub, compare/[cities], guide hub, guide/[guide], guide/[guide]/[city], journey hub, journey/[journey], journey/[journey]/[city], lists hub, lists/[listType]/[city], vs hub, vs/[comparison]) were already implemented in prior sessions.

---

## 2026-04-07 — [Claude Code] Arabic Pricing Pages (6 pages)

**Signed by:** Claude Code · 2026-04-07T10:00:00+04:00

### Files Created (6 new pages)
- **`src/app/(directory)/ar/pricing/page.tsx`** — Arabic pricing hub. All UI text in Arabic MSA, 10 procedure categories with Arabic names, top-12 popular procedures with nameAr, full procedure list by category, key facts callout, 5 FAQs, disclaimer.
- **`src/app/(directory)/ar/pricing/[procedure]/page.tsx`** — Arabic procedure detail page. Cheapest/most expensive city with Arabic names, city-by-city pricing table linking to /ar/pricing/[procedure]/[city], CostEstimator component, related procedures, 4 FAQs.
- **`src/app/(directory)/ar/pricing/[procedure]/[city]/page.tsx`** — Arabic procedure×city page. Price card with visualisation, comparison table with % diff, CostEstimator, top-rated provider list (linking to /directory/... English), "about the procedure" section, 4 FAQs.
- **`src/app/(directory)/ar/pricing/category/[category]/page.tsx`** — Arabic category hub. CATEGORY_NAMES_AR map for 10 categories, procedure grid with coverage badges, city stats table linking to /ar/pricing/category/[cat]/[city], 3 FAQs.
- **`src/app/(directory)/ar/pricing/category/[category]/[city]/page.tsx`** — Arabic category×city page. Sorted procedure table, city comparison rows, CostEstimator with dominant coverage, 4 FAQs, Service + AggregateOffer JSON-LD.
- **`src/app/(directory)/ar/pricing/city/[city]/page.tsx`** — Arabic city pricing hub. City rank vs all UAE, city comparison table, procedures by category with Arabic section headings linking to /ar/pricing/category/[cat]/[city], 4 FAQs.

### Pattern applied across all 6 pages
- `dir="rtl"` on root wrapper div
- `border-r-4` (RTL) for callout boxes (replacing English `border-l-4`)
- `getArabicCityName()` + `getArabicRegulator()` from `@/lib/i18n`
- `proc.nameAr || proc.name` for procedure names
- `toLocaleString("ar-AE")` for all numbers
- `hreflang en-AE/ar-AE` alternates in metadata
- `revalidate = 43200`, `dynamicParams = true` on dynamic pages
- `generateStaticParams` matching English counterparts exactly
- All internal links → `/ar/pricing/...` routes
- Zero ESLint warnings/errors, zero TypeScript errors in new files

## 2026-04-05 — [Claude Code] Arabic Mirror Pages: Stats, Compare, Find-a-Doctor, Best Doctors Hub, Best Doctors by Specialty, Doctors-At

**Signed by:** Claude Code · 2026-04-05T10:00:00+04:00

### Files Created (6 new pages)
- **`src/app/(directory)/ar/professionals/stats/page.tsx`** — Arabic workforce stats page. RTL layout, all 6 metric tables (categories, top-20 specialties, top-20 facilities, license distribution, geographic areas, specialist vs consultant), Arabic numbers via `toLocaleString("ar-AE")`, `getArabicAreaName()` for area names, `nameAr` for category/specialty labels, hreflang en-AE/ar-AE, BreadcrumbList + Dataset + FAQPage JSON-LD.
- **`src/app/(directory)/ar/professionals/compare/[slugs]/page.tsx`** — Arabic specialty comparison page. Parses `-vs-` slug pattern, `generateStaticParams` for top-15 physician specialty pairs, 6-row comparison grid, top-5 facilities per specialty, "when to see each" section, Arabic specialty names via `nameAr`, hreflang alternates.
- **`src/app/(directory)/ar/find-a-doctor/page.tsx`** — Arabic find-a-doctor landing page. Category cards with Arabic descriptions, specialty grid by category (5 per category), top-15 hospitals table, 6 Arabic FAQs, CTA to /ar/professionals, BreadcrumbList + ItemList + FAQPage JSON-LD.
- **`src/app/(directory)/ar/best/doctors/page.tsx`** — Arabic best doctors hub. Physician specialties grid (35 specialties), dental specialties grid (11), `FaqSection` component with 6 Arabic FAQs, ranking methodology section, 3-column related pages cross-links.
- **`src/app/(directory)/ar/best/doctors/[specialty]/page.tsx`** — Arabic best-doctors-by-specialty page. `generateStaticParams` for all 46 PHYSICIAN + DENTIST specialties, top-10 doctors table, top-10 facilities table, "how we rank" section, related specialties grid, related directory category link, FAQPage JSON-LD, MedicalWebPage + ItemList schema.
- **`src/app/(directory)/ar/doctors-at/[slug]/page.tsx`** — Arabic doctors-at facility page. `generateStaticParams` for top-50 facilities, doctor-by-specialty grid, alphabetical A-Z doctor table (100 limit), top-15 specialty frequency table, MedicalBusiness schema, hreflang en-AE/ar-AE.

### Impact
- 6 new Arabic page templates covering all major professional directory entry points
- All pages: `dir="rtl"`, `revalidate = 43200`, `dynamicParams = true` where applicable
- All links point to `/ar/...` routes
- Hreflang alternates with reciprocal en-AE/ar-AE on all pages
- Zero lint errors, zero ESLint warnings in new files

## 2026-04-04 — [Claude Code] Arabic Mirror Pages for Professionals Facility + Area

**Signed by:** Claude Code · 2026-04-04T10:00:00+04:00

### Files Changed
- **`src/app/(directory)/ar/professionals/facility/[slug]/page.tsx`** — Created Arabic facility staff page. RTL layout, dir="rtl", Arabic UI labels from `ar` i18n, Arabic numbers via `toLocaleString("ar-AE")`, top-50 staff table, specialty grid linking to `/ar/professionals/facility/{slug}/{specialty}`, hreflang en-AE/ar-AE alternates.
- **`src/app/(directory)/ar/professionals/facility/[slug]/[specialty]/page.tsx`** — Created Arabic facility×specialty page. FTL/REG license breakdown, full staff listing, links to `/ar/professionals/facility/{slug}` and `/ar/professionals/{category}/{specialty}`, hreflang alternates.
- **`src/app/(directory)/ar/professionals/area/[area]/page.tsx`** — Created Arabic area page. Uses `getArabicAreaName()` for Arabic area names, specialty grid linking to `/ar/professionals/area/{area}/{specialty}`, category stats, 100-row staff table with facility links pointing to `/ar/professionals/facility/{slug}`.
- **`src/app/(directory)/ar/professionals/area/[area]/[specialty]/page.tsx`** — Created Arabic area×specialty page. Top facilities table, full alphabetical listing, links to English counterparts, hreflang alternates.

### Impact
- 4 new Arabic page templates mirroring the English professional directory
- All pages: `revalidate = 43200`, `dynamicParams = true`, `generateStaticParams` matching English thresholds
- Zero lint errors, zero TypeScript errors

## 2026-04-05 — [Claude Code] Breadcrumb href, OG siteName, and Table Border Fixes

**Signed by:** Claude Code · 2026-04-05T05:00:00+04:00

### Files Changed
- **`src/app/(directory)/workforce/benchmarks/nurse-to-doctor/page.tsx`** — Added href="/workforce/benchmarks" to Benchmarks breadcrumb item + matching breadcrumbSchema URL.
- **`src/app/(directory)/workforce/benchmarks/staff-per-facility/page.tsx`** — Same breadcrumb fix.
- **`src/app/(directory)/workforce/benchmarks/specialist-per-capita/page.tsx`** — Same breadcrumb fix.
- **`src/app/(directory)/workforce/benchmarks/ftl-rate/page.tsx`** — Same breadcrumb fix.
- **`src/app/(directory)/workforce/career/[specialty]/page.tsx`** — Added href="/workforce/careers" to Careers breadcrumb item + matching breadcrumbSchema URL.
- **`src/app/(directory)/workforce/career/category/[category]/page.tsx`** — Same careers breadcrumb fix.
- **`src/app/(directory)/workforce/category/[category]/page.tsx`** — Changed siteName from "Zavis Healthcare Intelligence" to "UAE Open Healthcare Directory".
- **`src/app/(directory)/workforce/specialty/[specialty]/page.tsx`** — Same siteName fix.
- **`src/app/(directory)/workforce/overview/page.tsx`** — Changed 4 table thead `<tr>` borders from `border-b border-black/10` to `border-b-2 border-[#1c1c1c]` (design system standard).

### Why
- Breadcrumb intermediate items without href break navigation and reduce SEO value of BreadcrumbList schema.
- Inconsistent OG siteName hurts brand consistency in social media previews.
- Table header borders should match the design system standard (thick bottom border) used elsewhere on the page.

### Impact
- 9 files changed, zero lint errors.

## 2026-04-05 — [Claude Code] Accessibility and Design Consistency Fixes (WCAG, border-light-200, scope="col")

**Signed by:** Claude Code · 2026-04-05T04:30:00+04:00

### Files Changed
- **`src/app/(directory)/workforce/overview/page.tsx`** — Changed text-black/40 to text-black/60 on FTL/REG explanation paragraph (WCAG AA contrast fix for body text). Added scope="col" to all th elements in thead (15 tables).
- **`src/app/globals.css`** — Replaced 3 border-light-200 occurrences with border-black/[0.06] in .article-row, .headline-item, .provider-card utility classes.
- **`src/app/(directory)/professionals/page.tsx`** — Replaced border-light-200 with border-black/[0.06], added scope="col" to th elements.
- **`src/app/(directory)/professionals/[category]/page.tsx`** — Same border and scope fixes.
- **`src/app/(directory)/professionals/[category]/[specialty]/page.tsx`** — Same border and scope fixes.
- **`src/app/(directory)/professionals/facility/[slug]/page.tsx`** — Same border and scope fixes.
- **`src/app/(directory)/professionals/stats/page.tsx`** — Added scope="col" to 16 th elements across 4 tables.
- **`src/app/(directory)/professionals/guide/[slug]/page.tsx`** — Replaced border-light-200 with border-black/[0.06] in 2 table rows.
- **`src/app/(directory)/professionals/area/[area]/page.tsx`** — Replaced border-light-200.
- **`src/app/(directory)/professionals/area/[area]/[specialty]/page.tsx`** — Replaced border-light-200.
- **`src/app/(directory)/professionals/[category]/[specialty]/consultants/page.tsx`** — Replaced border-light-200.
- **`src/app/(directory)/professionals/[category]/[specialty]/specialists/page.tsx`** — Replaced border-light-200.
- **`src/app/(directory)/professionals/facility/[slug]/[specialty]/page.tsx`** — Replaced border-light-200.
- **`src/app/(directory)/find-a-doctor/page.tsx`** — Replaced border-light-200.
- **18 Arabic pages** (ar/insurance/*, ar/labs/*, ar/directory/*, ar/page.tsx) — Replaced all border-light-200 with border-black/[0.06].

### Why
- border-light-200 was not a valid Tailwind utility despite light-200 being in the color config (Tailwind generates border-light-200 as a color but it renders as transparent in some build contexts). Replaced with explicit border-black/[0.06] for consistent rendering.
- WCAG AA requires 4.5:1 contrast for body text; text-black/40 (~2.83:1) fails this. Only changed on paragraph-length text, not intentional de-emphasized labels.
- scope="col" on th in thead is a WCAG accessibility requirement for screen readers to associate header cells with data columns.

### Impact
- 28 files changed, zero lint errors, zero new warnings. Purely visual/accessibility improvements -- no layout or functionality changes.

## 2026-04-05 — [Claude Code] Fix Broken Internal Links and Add BreadcrumbList JSON-LD

**Signed by:** Claude Code · 2026-04-05T03:00:00+04:00

### Files Changed
- **`src/app/(directory)/professionals/compare/[slugs]/page.tsx`** — Fixed broken "best doctors" links: changed `/professionals/{cat}/{spec}/best` (404) to `/best/doctors/{spec}` (correct route).
- **`src/app/(directory)/workforce/benchmarks/page.tsx`** — Fixed 2 broken benchmark links: consultant-pipeline now points to `/workforce/specialties`, specialty-concentration now points to `/workforce/areas`. Both are existing hub pages.
- **`src/app/(directory)/workforce/careers/page.tsx`** — Fixed career guide links: changed base path from `/workforce/guide/` (404) to `/professionals/guide/` (existing route). Remapped 6 guide slugs to match 6 existing guide pages (dha-licensing, specialist-vs-consultant, ftl-vs-reg, international-doctors-dubai, choosing-right-specialist, healthcare-workforce).
- **`src/app/(directory)/professionals/[category]/page.tsx`** — Added `breadcrumbSchema` import and `<JsonLd data={breadcrumbSchema([...])} />` for BreadcrumbList structured data.
- **`src/app/(directory)/professionals/[category]/[specialty]/page.tsx`** — Added BreadcrumbList JSON-LD with 5-level breadcrumb (UAE > Directory > Professionals > Category > Specialty).
- **`src/app/(directory)/professionals/[category]/[specialty]/specialists/page.tsx`** — Added BreadcrumbList JSON-LD with 6-level breadcrumb (UAE > Directory > Professionals > Category > Specialty > Specialists).
- **`src/app/(directory)/professionals/[category]/[specialty]/consultants/page.tsx`** — Added BreadcrumbList JSON-LD with 6-level breadcrumb (UAE > Directory > Professionals > Category > Specialty > Consultants).
- **`src/app/(directory)/find-a-doctor/page.tsx`** — Added `breadcrumbSchema` to existing seo import and BreadcrumbList JSON-LD with 3-level breadcrumb (UAE > Directory > Find a Doctor).

### Why
Broken internal links create dead ends for users and waste crawl budget. Missing BreadcrumbList JSON-LD means Google cannot display breadcrumb rich results for these pages.

### Impact
- 3 pages with broken links fixed (compare, benchmarks hub, careers hub)
- 5 pages now emit BreadcrumbList structured data for Google rich results
- Zero lint errors

## 2026-04-04 — [Claude Code] Fix 4 Critical Issues in Professional Directory

**Signed by:** Claude Code · 2026-04-04T22:00:00+04:00

### Files Changed
- **`src/app/(directory)/professionals/[category]/[specialty]/page.tsx`** — Added displayLimit=200 to prevent rendering 28K+ rows. Sort applied to sliced array. Added "Showing X of Y" subtitle text and overflow note after table.
- **`src/app/(directory)/professionals/facility/[slug]/page.tsx`** — Fixed soft 404: replaced custom "not found" HTML (HTTP 200) with `notFound()` from `next/navigation` for proper 404 response.
- **`src/app/(directory)/professionals/stats/page.tsx`** — Removed local `DUBAI_POPULATION = 3_600_000` constant; now imports from `@/lib/workforce` which has the correct value of 3,660,000. Fixed hardcoded "3.6 million" FAQ text to use dynamic value.
- **`src/lib/professionals.ts`** — Wrapped `JSON.parse(fs.readFileSync(...))` in try/catch so build doesn't crash with unhelpful error if data file is missing; logs clear error message and returns empty dataset gracefully.

### Impact
- Specialty pages with large datasets (e.g., registered-nurse) no longer attempt to render 28K+ table rows
- Facility pages with invalid slugs now return proper HTTP 404 (SEO soft 404 fix)
- Population-based calculations are consistent across all pages (3.66M, not 3.6M)
- Build resilience improved: missing data file produces clear error instead of crash

## 2026-04-04 — [Claude Code] Complete Workforce Intelligence Section (~1,700 pages)

**Signed by:** Claude Code · 2026-04-04T15:00:00+04:00

### New Data Layer
- **`src/lib/workforce.ts`** — 17 computed metrics functions built on top of `professionals.ts`: workforce ratios (physician/nurse/dentist per 100K), license type breakdowns (by category, specialty, area), category workforce profiles, specialty workforce metrics (concentration index, supply adequacy), facility benchmarks (nurse-to-doctor ratio, FTL rate, specialty breadth), nurse-to-doctor ratios by facility, per-capita specialty rates, FTL rate analysis, specialty geographic concentration, facility size distribution, specialty supply metrics

### 29 Page Files (generating ~1,700 pages)
- **7 hub pages**: `/workforce`, `/workforce/overview`, `/workforce/employers`, `/workforce/specialties`, `/workforce/areas`, `/workforce/benchmarks`, `/workforce/careers`
- **4 category profiles**: `/workforce/category/[category]`
- **73 specialty profiles**: `/workforce/specialty/[specialty]`
- **~200 employer profiles**: `/workforce/employer/[slug]`
- **7 ranking pages**: hub + top-employers + top-employers/[category] (4) + largest-specialties
- **4 benchmark pages**: nurse-to-doctor, staff-per-facility, specialist-per-capita, ftl-rate
- **~346 comparison pages**: specialty (105) + area (45) + employer (190) + category (6) + hub
- **~130 geographic pages**: area/[area] (~30) + area/[area]/[category] (~100)
- **77 career pages**: career/[specialty] (73) + career/category/[category] (4)
- **36 supply pages**: supply hub + supply/[specialty] (35 physician specialties)

### Sitemap Updated
- Added all ~1,700 workforce routes with appropriate priorities (0.55-0.85)
- New imports: `getTopAreas`, `getTopFacilities`, `getProfessionalsByAreaAndCategory` from workforce.ts

### Zero lint errors confirmed via `npm run lint`

---

## 2026-04-04 — [Claude Code] Workforce Comparison, Geographic, Career, Supply Pages (11 new files, ~400+ pages)

**Signed by:** Claude Code · 2026-04-04T14:30:00+04:00

### New Files (11 page files)

**Comparison Pages (5):**
- `src/app/(directory)/workforce/compare/page.tsx` — Compare hub with links to all comparison types
- `src/app/(directory)/workforce/compare/specialty/[slugs]/page.tsx` — Specialty vs Specialty (105 static pages from top 15 physician specialties)
- `src/app/(directory)/workforce/compare/area/[slugs]/page.tsx` — Area vs Area (45 static pages from top 10 areas)
- `src/app/(directory)/workforce/compare/employer/[slugs]/page.tsx` — Employer vs Employer (190 static pages from top 20 facilities)
- `src/app/(directory)/workforce/compare/category/[slugs]/page.tsx` — Category vs Category (6 static pages)

**Geographic Pages (2):**
- `src/app/(directory)/workforce/area/[area]/page.tsx` — Area workforce profile (~30 pages)
- `src/app/(directory)/workforce/area/[area]/[category]/page.tsx` — Area x Category (~100 pages)

**Career Pages (2):**
- `src/app/(directory)/workforce/career/[specialty]/page.tsx` — Career profile per specialty (73 pages)
- `src/app/(directory)/workforce/career/category/[category]/page.tsx` — Career overview per category (4 pages)

**Supply Pages (2):**
- `src/app/(directory)/workforce/supply/page.tsx` — Supply analysis hub with all physician specialties
- `src/app/(directory)/workforce/supply/[specialty]/page.tsx` — Per-specialty supply analysis (35 pages)

### Technical Details

- All pages use `@/lib/workforce` synchronous computed metrics layer
- ISR with 12-hour revalidation (`revalidate = 43200`), `dynamicParams = true` on all dynamic routes
- Side-by-side comparison tables, stat cards, cross-links between related pages
- JSON-LD: BreadcrumbList on every page, FAQPage on career and supply detail pages
- DHA disclaimer on every page
- Zero lint errors

---

## 2026-04-04 — [Claude Code] Workforce Hub Pages (7 new pages)

**Signed by:** Claude Code · 2026-04-04T12:00:00+04:00

### New Files (7 page files)

- **`src/app/(directory)/workforce/page.tsx`** — Main hub page. Editorial gateway to Dubai's healthcare labor market intelligence. Hero with headline stat, 6 sub-hub cards, key metrics bar, category quick stats, license breakdown, cross-links.
- **`src/app/(directory)/workforce/overview/page.tsx`** — Flagship "Dubai Healthcare Workforce Report 2026". Executive summary, population ratios with WHO benchmarks, category visual bars, FTL/REG distribution, top 20 facilities table, top 20 specialties table, specialist-to-consultant pipeline, geographic concentration, 6 FAQs.
- **`src/app/(directory)/workforce/employers/page.tsx`** — Top 50 facilities ranked by staff count. Size tier breakdown (mega/large/mid/small/micro), median/average stats, AEO answer block.
- **`src/app/(directory)/workforce/specialties/page.tsx`** — All 73 specialties ranked by count, grouped by category. Per-100K rates, FTL rate columns. Category summary cards.
- **`src/app/(directory)/workforce/areas/page.tsx`** — Geographic distribution of professionals across 36 mapped areas. Physicians/nurses columns, proportional bars, top specialty column.
- **`src/app/(directory)/workforce/benchmarks/page.tsx`** — 6 benchmark cards with live summary stats: nurse-to-doctor ratio, staff per facility, specialist per capita, FTL rate, consultant pipeline, specialty concentration. Key system-level ratios.
- **`src/app/(directory)/workforce/careers/page.tsx`** — 4 category career cards, top 15 specialty links, 6 career guide links.

### Technical Details

- All pages import from `@/lib/workforce` (synchronous computed metrics layer)
- ISR with 12-hour revalidation (`revalidate = 43200`)
- JSON-LD: WebPage + Dataset schemas, BreadcrumbList, FAQPage (overview)
- Zero lint errors, zero TypeScript errors

---

## 2026-04-04 — [Claude Code] Workforce Category & Specialty Profile Pages (77 new pages)

**Signed by:** Claude Code · 2026-04-04T10:00:00+04:00

### New Files (2 page files)

- **`src/app/(directory)/workforce/category/[category]/page.tsx`** — 4 category workforce profile pages (physicians, dentists, nurses, allied-health). Key metrics grid, license FTL/REG breakdown, OECD benchmark comparison, all-specialties ranked table, top 20 employers table, geographic distribution, cross-links to directory and other categories.
- **`src/app/(directory)/workforce/specialty/[specialty]/page.tsx`** — 73 specialty workforce profile pages. Key metrics (6-col grid), editorial supply assessment with OECD benchmarks, license breakdown, specialist vs consultant seniority data, top 10 facilities, geographic distribution with concentration index, geographic gaps (areas with zero coverage), related specialties cross-links.

### Data Layer

- Both pages consume from `@/lib/workforce` (synchronous computed metrics layer): `getCategoryWorkforceProfile`, `getSpecialtyWorkforceMetrics`, `getSpecialtySupplyMetrics`, `getLicenseTypeByCategory`, `getLicenseTypeBySpecialty`, `getTopEmployersByCategory`, `getSpecialtiesByCategory`, `getSpecialtyBySlug`
- ISR with 12-hour revalidation (`revalidate = 43200`)
- Category pages: `dynamicParams = false` (only 4 valid slugs)
- Specialty pages: `dynamicParams = true` (73 slugs via `generateStaticParams`)

### SEO Coverage

- Category pages target: "{category} workforce Dubai", "{category} labor market Dubai", "how many {category} in Dubai"
- Specialty pages target: "{specialty} workforce Dubai", "{specialty} per 100K Dubai", "{specialty} supply Dubai"
- Full JSON-LD: WebPage/MedicalWebPage + Dataset schema with variableMeasured
- BreadcrumbList schema on both page types
- OpenGraph metadata with counts and rates

### Impact

- 77 new static pages for workforce intelligence section
- Zero lint errors

---

## 2026-04-04 — [Claude Code] Professional Directory Mega Expansion (~700+ new pages)

**Signed by:** Claude Code · 2026-04-04T05:30:00+04:00

### New Files (11 page files)
- **`src/app/(directory)/professionals/area/[area]/page.tsx`** — Area hub pages (~25-30 Dubai areas with 10+ professionals)
- **`src/app/(directory)/professionals/area/[area]/[specialty]/page.tsx`** — Area × specialty pages (~300-500 combos with 3+ professionals)
- **`src/app/(directory)/best/doctors/page.tsx`** — Best doctors hub (46 physician + dentist specialties)
- **`src/app/(directory)/best/doctors/[specialty]/page.tsx`** — Best doctors by specialty (top 10 doctors + top 10 hospitals per specialty)
- **`src/app/(directory)/professionals/[category]/[specialty]/specialists/page.tsx`** — Specialist-grade professionals by specialty
- **`src/app/(directory)/professionals/[category]/[specialty]/consultants/page.tsx`** — Consultant-grade professionals by specialty
- **`src/app/(directory)/professionals/guide/[slug]/page.tsx`** — 8 editorial guide articles (specialist-vs-consultant, DHA licensing, FTL-vs-REG, verify-doctor, choosing-specialist, workforce stats, specialties explained, international doctors)
- **`src/app/(directory)/professionals/stats/page.tsx`** — Dubai healthcare workforce statistics dashboard
- **`src/app/(directory)/professionals/compare/[slugs]/page.tsx`** — Side-by-side specialty comparisons (105 pairs from top 15 specialties)
- **`src/app/(directory)/doctors-at/[slug]/page.tsx`** — "Doctors at {hospital}" alias pages (top 50 facilities)

### Modified Files
- **`src/app/sitemap.ts`** — Added all new routes: area pages, specialist/consultant, guides, stats, best doctors, comparisons, doctors-at. New imports: `PHYSICIAN_SPECIALTIES`, `DENTIST_SPECIALTIES`, `getAreaStats`, `getAreaSpecialtyCombos`, `getSpecialtiesWithBothLevels`, `getAllFacilities`

### SEO Coverage
- Area pages target "doctors in {area}, Dubai", "{specialty} in {area} Dubai"
- Best doctors pages target "best {specialty} in Dubai", "top 10 {specialty} Dubai"
- Compare pages target "{specA} vs {specB}", "difference between {specA} and {specB}"
- Doctors-at pages target "doctors at {hospital}", "{hospital} doctors list"
- Guide pages target educational queries: "specialist vs consultant Dubai", "how to verify doctor Dubai"
- Stats page targets "Dubai healthcare workforce statistics 2026"
- All pages have full JSON-LD (WebPage/MedicalWebPage/Article + FAQPage + BreadcrumbList), OpenGraph, canonical URLs

### Impact
- Total professional directory pages: ~4,000+ (up from ~3,200)
- All lint-clean, zero errors

---

## 2026-04-04 — [Claude Code] Best Doctors Ranking Pages

**Signed by:** Claude Code · 2026-04-04T03:30:00+04:00

### Files Created
- **`src/app/(directory)/best/doctors/page.tsx`** — Hub page listing all 46 physician + dentist specialties with card grid, stats bar, 6 FAQs, ranking methodology section, cross-links to directory/professionals
- **`src/app/(directory)/best/doctors/[specialty]/page.tsx`** — Dynamic specialty ranking page with top 10 doctors table (ranked by facility size), top 10 hospitals/clinics table, stats section, 5 data-driven FAQs, methodology explainer, related specialties cross-links, DHA disclaimer

### SEO & JSON-LD
- WebPage + ItemList on hub page (46 specialty links)
- MedicalWebPage + ItemList (Physician schema) + FAQPage + BreadcrumbList on each specialty page
- Metadata targeting "best {specialty} in Dubai", "top 10 {specialty} Dubai"
- generateStaticParams for all 35 physician + 11 dentist specialties
- ISR revalidate=43200 on both pages

### Impact
- ~47 new SEO pages (1 hub + 46 specialty pages) targeting high-value "best doctor" queries
- Zero lint errors

## 2026-04-04 — [Claude Code] SEO & AEO Enhancement Sprint — 6 major items

**Signed by:** Claude Code · 2026-04-04T01:00:00+04:00

### 1. "Best of" Page Enhancements (`/best/[city]/[category]`)
- **`src/lib/data.ts`** — Added `yearEstablished?: number` to `LocalProvider` interface and `rowToProvider()` mapper (pulls from `year_established` DB column)
- **`src/app/(directory)/best/[city]/[category]/page.tsx`** — Three major additions:
  - **Unique editorial intro**: `getCategoryIntro()` function generates category-specific headlines + body text for 10 categories (hospitals, clinics, dental, dermatology, ophthalmology, cardiology, mental-health, pediatrics, fertility-ivf, cosmetic-plastic) with intelligent fallback for others
  - **Selection criteria section**: "How We Rank" — 3-column card grid explaining ranking methodology (patient ratings, years of practice, insurance coverage)
  - **Comparison table**: Side-by-side HTML table for top 10 providers with columns: Rank, Provider, Rating, Reviews, Established, Insurance Plans, Verified, Area

### 2. FAQ Expansion for AI Overviews
- **`src/app/(directory)/best/[city]/[category]/page.tsx`** — Added 7 long-tail conversational FAQs targeting AI Overview queries:
  - Cost without insurance, specific insurer acceptance, required documents, provider locations by neighborhood, online booking availability, multilingual staff, Friday/holiday hours, license verification
  - All data-driven using computed stats (topLanguages, topNeighborhoodNames, verifiedCount, providersWithWebsite, providersWithPhone)

### 3. Topical Authority Clusters (hub-and-spoke cross-linking)
- **`src/lib/intelligence/data.ts`** — NEW: `getArticlesByDirectoryContext(cityName, categorySlug, categoryName, limit)` — scores articles by tag overlap with city name + category keywords + recency for cross-linking
- **`src/app/(directory)/directory/[city]/[...segments]/page.tsx`** — Added "Related Intelligence" section on city+category pages (between FAQ and "Other specialties"). Shows up to 4 relevant intelligence articles with category badge, date, title, and excerpt. Imports `loadDbArticles`, `getArticlesByDirectoryContext`, `getJournalCategory`, `formatDate`.
- **`src/app/(directory)/intelligence/[slug]/page.tsx`** — Replaced static "Browse the Directory" sidebar with dynamic "Related Providers" section. Matches article tags against `CITIES` and `CATEGORIES` constants, queries top-rated providers for matched city+category, shows up to 4 providers with name, address, rating badge, and "Browse all" CTA. Falls back to static directory links if no match found. Imports `getProviders`, `CITIES`, `CATEGORIES`.

### 4. llms.txt — AI Search Optimization
- **`public/llms.txt`** — Enhanced with prioritized page URLs (directory cities, best-of rankings, intelligence categories), structured for AI crawlers. Added reference to llms-full.txt.
- **`public/llms-full.txt`** — NEW: Comprehensive deep-indexing file with full city descriptions, all 28 healthcare categories with subcategories and example URLs, ranking methodology, insurance coverage info, regulatory bodies, all 9 intelligence verticals, FAQs, and citation format.

### 5. AggregateRating Schema & IndexNow
- **No changes needed** — both already implemented:
  - `AggregateRating` in `medicalOrganizationSchema()` at `src/lib/seo.ts:55-65`
  - `notifyIndexNow()` in `src/lib/intelligence/automation/pipeline.ts:89-111`

### 6. Service-Specific Landing Pages (`/directory/{city}/{procedure}`)
- **`src/lib/directory-utils.ts`** — Extended `resolveSegments()` to recognize procedure slugs as `city-service` route type. When a single segment doesn't match a category or area, checks against `PROCEDURES` constant via dynamic import.
- **`src/app/(directory)/directory/[city]/[...segments]/page.tsx`** — Two additions:
  - **Metadata case**: `city-service` case in `generateMetadata()` switch — generates SEO title/description with provider count and pricing data
  - **Page rendering**: Full service landing page with: answer block, quick info cards (duration, recovery, insurance, cost), provider grid (top 9 by rating), UAE city price comparison table, "What to Expect" section, insurance coverage, related procedures, same-category procedures, cross-links to pricing/category/best-of pages, 6 FAQs, disclaimer
  - Imports: `PROCEDURES`, `getProcedureBySlug`, `formatAed`, `MedicalProcedure`, `CITIES`, `Activity`, `ArrowRight`
- **~328 new flat URLs** (41 procedures × 8 cities) — all via ISR (no pre-rendering)
- **Examples**: `/directory/dubai/teeth-whitening`, `/directory/abu-dhabi/knee-replacement`, `/directory/sharjah/mri-scan`

**Impact:** 6 SEO/AEO features shipped. ~328 new service landing pages. Hub-and-spoke cross-linking between directory and intelligence. Enhanced AI crawler discoverability. All lint-clean, zero errors.

## 2026-04-02 — [Claude Code] CQ2/CQ3 follow-up: Eliminate remaining type casts in automation dashboard

**Signed by:** Claude Code -- 2026-04-02T22:30:00+04:00

- **`src/types/dashboard.ts`** -- Added `PerformanceInsightRecommendations`, `ContentPatterns`, `TimingScores` interfaces. Updated `PerformanceInsight` to use these specific types instead of `Record<string, unknown>` for `recommendations`, `content_patterns`, and `timing_scores`.
- **`src/app/(directory)/dashboard/automation/page.tsx`** -- Replaced 5 local interface definitions (Schedule, AutomationRun, QueueItem, Notification, PerformanceInsight) with imports from `@/types/dashboard`. Changed `latestReport` state from `Record<string, unknown>` to `AutomationLatestReport`. Changed `latestScore` state from `Record<string, unknown>` to `AutomationLatestScore`. Eliminated all 8 `as Record<string, ...>` type casts. Added null-safe date rendering for `published_at`.
- **Impact:** Zero `any` types, zero `as Record` casts, zero `eslint-disable` comments remain across all 9 dashboard files.

## 2026-04-02 — [Claude Code] CQ2/CQ3: Eliminate `any` types and `eslint-disable` from dashboard

**Signed by:** Claude Code · 2026-04-02T21:00:00+04:00

- **`src/types/dashboard.ts`** — NEW: 20 TypeScript interfaces covering all dashboard data structures: PipelineRunSummary, PipelineRunDetail, PipelineComment, LinkedInPost, EmailBlast, PerformanceScore, AnalyticsRun, AutomationSchedule, AutomationRun, AutomationStageLogEntry, PostQueueItem, AutomationNotification, PerformanceInsight, HeadlineStat, PipelineRunSynthesis, PipelineRunDetailResponse, AutomationLatestReport, AutomationLatestScore. Derived from SQL schema in scripts/db/run-schema.mjs and scripts/automation/migrate.mjs.
- **`src/app/(directory)/dashboard/pipeline/[id]/page.tsx`** — Removed eslint-disable comment. Replaced 5 `any` useState types with proper interfaces (PipelineRunDetail, LinkedInPost[], EmailBlast[], PerformanceScore). Replaced 4 `catch (err: any)` with `catch (err: unknown)` + `instanceof Error` guard. Replaced `(s: any)` in synthesis headline_stats map with HeadlineStat. Removed unused `Link` import. Wrapped fetchData in useCallback to fix react-hooks/exhaustive-deps warning.
- **`src/app/(directory)/dashboard/analytics/page.tsx`** — Removed eslint-disable comment. Replaced `any[]` state with `AnalyticsRun[]`. Typed `.map(async (run: any) =>` as `PipelineRunSummary`. Typed API response shapes. Removed unused `Link` import. Fixed `.catch(err =>` to use instanceof Error.
- **`src/app/(directory)/dashboard/emails/page.tsx`** — Removed eslint-disable comment. Replaced `any[]` with `EmailBlast[]`. Removed unused `Link` import.
- **`src/app/(directory)/dashboard/posts/page.tsx`** — Removed eslint-disable comment. Replaced `any[]` with `LinkedInPost[]`. Wrapped fetchPosts in useCallback to fix react-hooks/exhaustive-deps warning.
- **`src/app/(directory)/dashboard/calendar/page.tsx`** — Removed eslint-disable comment. Removed unused `TYPE_LABELS` constant that was triggering no-unused-vars.

**Impact:** Zero `any` types and zero `eslint-disable` comments remain in any dashboard component. Full `npm run lint` passes cleanly.

## 2026-04-02 — [Claude Code] Audit wave 4: LRU cache, column whitelist, batch inserts, composite index, sitemap lastmod

**Signed by:** Claude Code · 2026-04-02T16:00:00+04:00

- **`src/lib/data.ts`** — P6: Replaced unbounded Map cache with bounded LRU (max 500 entries). On cache hit, entry is moved to end (most-recently-used). On set, oldest entry evicted when over limit. Same TTL (5 min), same interface.
- **`src/app/api/research/posts/route.ts`** — D6: GET handler SELECT * replaced with explicit column list (id, run_id, account, content, first_comment, hashtags, status, scheduled_for, posted_at, created_at, updated_at).
- **`src/app/api/research/emails/route.ts`** — D6: GET handler SELECT * replaced with explicit column list excluding body_html and body_text (large fields unnecessary for list queries).
- **`src/lib/db/seed.ts`** — D7: Converted all 6 seed functions from sequential single-row inserts to batch inserts (cities, areas, categories, subcategories, providers, faqs). Each now builds a values array and does a single INSERT.
- **`src/lib/db/schema.ts`** — D8: Added composite index `idx_providers_city_status` on `(cityId, status)` for common filter combination. D9: Added comment explaining why faqs.entityId has no FK (polymorphic — references cities, categories, or providers based on entityType).
- **`src/app/sitemap.ts`** — S9: Replaced all `new Date()` lastModified values with fixed `LAST_CONTENT_UPDATE = new Date('2026-04-02')`. Added comment explaining the rationale and when to update.
- **Impact:** 6 audit items resolved across 6 files. Zero lint errors.

## 2026-04-03 — [Claude Code] SEC11: XSS sanitization for dangerouslySetInnerHTML

**Signed by:** Claude Code · 2026-04-03T03:00:00+04:00

- **Installed `isomorphic-dompurify`** (+ `@types/dompurify` dev dep) — works in both server components (Node/JSDOM) and client components (browser DOM).
- **Created `src/lib/sanitize.ts`** — exports `sanitizeHtml(html: string): string` using DOMPurify with `ADD_TAGS: ["iframe"]` and social embed data attributes whitelisted.
- **`src/components/intelligence/SocialEmbed.tsx`** — the primary XSS risk (AI-generated article bodies rendered via `dangerouslySetInnerHTML`). Now sanitizes HTML after embed processing, before rendering.
- **`src/app/(directory)/directory/guide/[slug]/page.tsx`** — defense-in-depth sanitization on guide article paragraph HTML. Content is currently static seed data but the pattern is now safe if the source changes.
- **NOT modified (trusted internal sources):** `JsonLd.tsx` (JSON.stringify of structured data), `ar/layout.tsx` (hardcoded inline script for lang/dir).
- **Impact:** Closes SEC11. All AI/external HTML content is now sanitized before DOM injection. Zero lint errors.

## 2026-04-03 — [Claude Code] Audit Wave 3: SEC13 + SEC15 + CQ8

**Signed by:** Claude Code · 2026-04-03T02:00:00+04:00

- **SEC13: Remove localhost auth bypass** — `src/middleware.ts`: removed `isLocal` check that skipped dashboard auth for `localhost`/`127.0.0.1`. Auth now enforced on all hosts.
- **SEC15: Hardcoded integration IDs → env vars** — `scripts/automation/lib/config.mjs`: Postiz integration IDs now read from `POSTIZ_HIDAYAT_LINKEDIN_ID` and `POSTIZ_ZAVIS_FACEBOOK_ID` env vars with current values as fallbacks.
- **CQ8: Document pipeline thresholds** — `src/lib/intelligence/automation/pipeline.ts`: added detailed comments explaining the `MINIMUM_SCORE = 35` threshold (scoring criteria, why 35, impact of changing) and the `slice(0, 3)` batch limit (serverless timeout constraint, per-article cost, alternative for bulk).

## 2026-04-03 — [Claude Code] Audit Wave 2: Security hardening + GSAP code-splitting

**Signed by:** Claude Code · 2026-04-03T01:00:00+04:00

- **P2: GSAP code-splitting** — Converted all 6 GSAP-importing files (`AnimatedSection.tsx`, `LenisProvider.tsx`, `ChannelIconGrid.tsx`, `IntegrationHub.tsx`, `OrbitalDisplay.tsx`, `HomePageClient.tsx`) from static `import gsap` to dynamic `import("gsap")` inside `useEffect`. GSAP (~350KB) and Lenis now lazy-loaded, excluded from initial bundle.
- **SEC3: Weak password removed** — Removed `'zavis_research_2026'` fallback from `auth.ts`, `middleware.ts` (2 occurrences), and `auth/route.ts`. Dashboard now requires `DASHBOARD_KEY` env var or rejects all auth.
- **SEC6: CSP header** — Added `Content-Security-Policy` to `next.config.mjs` with proper `script-src` for GTM/FB/LinkedIn, `style-src` for Google Fonts, `frame-src` for YouTube, `object-src: none`, `base-uri: self`.
- **SEC10: Input validation** — Added type checks, length limits, and array bounds to `posts/route.ts` (content 10K, account 100, firstComment 5K, hashtags 30) and `emails/route.ts` (subject 500, bodyHtml 200K, segment whitelist).
- **SEC12: Error leak** — Removed `details` field from `sheets/route.ts` error response. Internal errors only logged server-side.
- **P11: Graceful DB shutdown** — Added `process.once('SIGTERM'/'SIGINT', () => pool.end())` to both `db/index.ts` and `research/db.ts`.
- **Impact:** 6 audit items resolved. Zero lint errors.

## 2026-04-03 — [Claude Code] Memoize computed arrays in HomePageClient

**Signed by:** Claude Code · 2026-04-03T01:00:00+04:00

- **`src/components/landing/pages/HomePageClient.tsx`** — Added `useMemo` import. Extracted inline `clientLogos` array (12 duplicated logo objects for marquee) and `integrationLogos` array (channel + EMR partner slice) into `useMemo` hooks with `[]` deps (both are static). Replaced inline JSX array creation with memoized references.
- **`src/components/research/research-page-client.tsx`** — Already had `useMemo` wrapping the `Array.from(new Set(...))` categories computation. No changes needed.
- **Why:** Audit found unmemoized array allocations on every render in client components.
- **Impact:** HomePageClient no longer creates 2 new arrays + 12 new objects on every render cycle. Zero lint errors.

## 2026-04-03 — [Claude Code] Fix silent error swallowing in dashboard components

**Signed by:** Claude Code · 2026-04-03T00:15:00+04:00

- **`src/app/(directory)/dashboard/pipeline/[id]/page.tsx`** — Added error state rendering: when `error` is set, the page now shows a red error message with a Retry button instead of silently failing. The file already had proper `.catch()` and `.finally()` on its fetch chain, but never rendered the error to the user.
- **`src/app/(directory)/dashboard/analytics/page.tsx`** — Added `const [error, setError] = useState<string | null>(null)`. Added `if (!r.ok) throw new Error(...)` response checks and `.catch(err => setError(err.message || 'Something went wrong'))` to both useEffect fetch chains (completed runs and published runs). Added error paragraph rendering above the table. The second useEffect previously had no `.catch()` at all.
- **Why:** Audit found silent error swallowing — fetch failures produced no user-visible feedback. The analytics page had no error state, no `.catch()` on the published-runs effect, and no response status checks. The pipeline detail page caught errors but never displayed them.
- **Impact:** Both dashboard pages now surface fetch errors to the user instead of silently failing with empty/stale data.

---

## 2026-04-02 — [Claude Code] SEO: Add missing openGraph.images to dynamic listing pages

**Signed by:** Claude Code · 2026-04-02T23:45:00+04:00

- **`src/app/(directory)/directory/[city]/[...segments]/page.tsx`** — Added `openGraph` with `images` to `city-area`, `area-category`, `area-insurance` (images were missing), and `city-category-subcategory` metadata cases. Category-related pages use the category image; area-only and insurance pages use `clinics.webp` as generic fallback.
- **`src/app/(directory)/ar/directory/[city]/[...segments]/page.tsx`** — Added `getCategoryImageUrl` helper function and `openGraph` with `images` to all 4 metadata cases (`city-category`, `city-area`, `area-category`, `listing`). Uses `locale: 'ar_AE'` and Arabic `siteName`.
- **Why:** SEO audit found that these dynamic provider listing pages had no `openGraph.images`, meaning social shares and search previews showed no image. The English `city-category` and `listing` cases already had OG images; the rest were missing.
- **Impact:** All dynamic directory pages now emit proper OG images for social sharing and rich search previews.

## 2026-04-02 — [Claude Code] Research Pages: force-dynamic → ISR (1 hour)

**Signed by:** Claude Code · 2026-04-02T23:30:00+04:00

- **`src/app/(research)/research/page.tsx`** — Replaced `export const dynamic = 'force-dynamic'` with `export const revalidate = 3600`
- **`src/app/(research)/research/[slug]/page.tsx`** — Same change
- **Why:** Both pages only call `getAllPublishedReports()` / `getReportBySlug()` which read from the filesystem via `fs.readFileSync` / `fs.readdirSync`. No cookies, headers, or search params are accessed. `force-dynamic` forced every request to re-render server-side, adding unnecessary latency and compute. ISR with 1-hour revalidation caches the rendered page and revalidates in the background.
- **Impact:** Faster TTFB on all 9 research URLs (index + 8 report pages). New reports published to `data/reports/` will appear within 1 hour, or immediately via `/api/revalidate`.

---

## 2026-04-02 — [Claude Code] Comprehensive Optimization Audit + Critical Fixes

**Signed by:** Claude Code · 2026-04-02T22:00:00+04:00

### SEO Fixes
- **Soft 404 resolution:** Area+category pages with 0 providers now call `notFound()` instead of rendering "No providers found" (EN + AR). `/healthcare` route now returns proper 404 via server-side check.
- **FAQ operating hours fix:** Empty `operatingHours` objects no longer render broken "Provider Name: . Verified [ISO timestamp]". Now shows "Contact provider for hours."
- **Raw ISO timestamps → human dates:** All `lastVerified` renders across EN/AR listing pages now show "25 March 2026" / "٢٥ مارس ٢٠٢٦" instead of `2026-03-25T14:14:41.336Z`

### Performance (LCP)
- **Specialty page LCP fix:** Hero image removed from `AnimatedSection delay={0.4}` wrapper (was setting `opacity:0` via GSAP, blocking LCP for 400ms+). Switched from `<img>` to `next/image` with `priority` prop. Affects 88 URLs (`/dermatology`, `/optometry`, etc.)
- **BrandIcons:** Added `loading="lazy"` to all 16 `<img>` tags

### Infrastructure
- **Vercel cleanup:** Removed `vercel.json`, uninstalled `@vercel/analytics`, `@vercel/blob`, `@vercel/speed-insights`. Updated hardcoded Vercel URL fallback in ContactPageClient. Updated ingest route comments to reference EC2.
- **DB pool:** `max: 2` → `max: 10, min: 2, idleTimeoutMillis: 30000` in both `src/lib/db/index.ts` and `src/lib/research/db.ts`

### Security
- **Hardcoded API key removed:** `scripts/media/generate-cover.mjs` no longer falls back to a hardcoded Gemini key
- **Health endpoint:** Removed git commit message, author from `/api/health` response (info disclosure)
- **Revalidate endpoint:** Added path traversal validation (`startsWith("/")`, no `..`)

### Schema
- **Missing indexes added:** `isVerified`, `isClaimed`, `isFeatured` on providers table
- **CASCADE delete:** Added `onDelete: "cascade"` to `claimRequests.providerId`

### Accessibility
- **SearchBar:** Added `aria-label` and `role="search"` to compact form

**Files changed:** `[...segments]/page.tsx` (EN+AR), `[specialty]/page.tsx`, `SpecialtyPageClient.tsx`, `BrandIcons.tsx`, `SearchBar.tsx`, `db/index.ts`, `research/db.ts`, `db/schema.ts`, `research/auth.ts`, `api/health/route.ts`, `api/revalidate/route.ts`, `api/intelligence/ingest/route.ts`, `ContactPageClient.tsx`, `generate-cover.mjs`, `vercel.json` (deleted), `package.json`

---

## 2026-03-28 — [Claude Code] Full Zavis Design System Overhaul (Directory + Intelligence)

- **Scope:** All 103 English directory pages + 36 shared components redesigned to match Zavis brand design system
- **Fonts:** Replaced DM Sans/Lora/Space Mono with Bricolage Grotesque (headings) + Geist (body/UI) across entire codebase
- **Colors:** Replaced `#00c853` (tailwind accent) with `#006828` (Zavis green) everywhere. Replaced named grays (`text-muted`, `text-dark`) with opacity-based hierarchy (`text-black/40`, `text-[#1c1c1c]`)
- **Borders:** `border-light-200` → `border-black/[0.06]`, `border-dark` → `border-[#1c1c1c]`
- **Backgrounds:** `bg-light-50` → `#f8f8f6`, `bg-dark` → `#1c1c1c`
- **Cards:** Added `rounded-2xl` to all cards, `hover:shadow-card hover:border-[#006828]/15` hover states
- **Badges:** Square `bg-accent` → rounded-full green pills
- **Answer blocks:** Green left border + subtle tint + `rounded-xl`
- **Header:** Rebuilt as Bloomberg-style 2-row nav (masthead + city tabs)
- **Section headers:** Kept bold border-bottom-2 divider pattern, updated font to Bricolage
- **Intelligence pages:** Heavier font weight (`font-semibold`) throughout for editorial feel
- **Removed old CSS classes:** `section-header`, `container-tc`, `.badge`, `.badge-outline`, `.label`, `.category-ribbon`, `.byline`, `.headline-serif-*`, `.article-row` — all replaced with inline Zavis tokens
- **Design templates doc:** Created `docs/design-templates.md` cataloging all 20 template archetypes with exact classes
- **Deploy fix:** Reverted `NEXT_DIST_DIR=.next-new` build approach that caused `_document` module error — back to proven backup/build/rollback pattern
- **Zero type errors, zero lint errors**
- **All 20 page templates verified returning 200 on localhost**

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
