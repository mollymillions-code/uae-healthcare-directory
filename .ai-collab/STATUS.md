## Active Work

- **Claude Code** · 2026-04-19T00:00:00+04:00 — ProviderCard image fix: rebased on top of Item 4's "decision card" refactor of ProviderCard. Every listing card was still rendering the generic category stock image (`/images/categories/<cat>.png`) even though 93.5% of `providers` rows (11,686 / 12,504 in local `zavis_landing`) already have a real `cover_image_url` from Google Places enrichment. Root cause: `ProviderCard` hardcoded `getCategoryImagePath(categorySlug)` and was never passed the provider's image. Added `coverImageUrl?: string | null` to `ProviderCardProps` in `src/components/provider/ProviderCard.tsx`, destructured it, and swapped the 40×40 thumbnail's `<Image src>` to `coverImageUrl || getCategoryImagePath(categorySlug)` (same fallback pattern the detail hero at line 871 of `[...segments]/page.tsx` has been using since the comprehensive-enrich rollout). Threaded the prop through **all 35 `<ProviderCard />` call sites** across 27 files — English + Arabic directory facet pages (`[...segments]`, area/category/procedures/government/walk-in/24-hour/24-hours/emergency/language/condition/insurance/pharmacy variants), GccDirectoryPages (3 sites), GccFilterPage, and the Item 0.5 server-component `ProviderListPaginated`. Category hero banners (page-level, not per-card) intentionally stay on `getCategoryImagePath()` — unchanged. `places.googleapis.com` already whitelisted in `next.config.mjs` remote patterns. `npx tsc --noEmit` clean on all files I touched (the one pre-existing unrelated `isomorphic-dompurify` warning is a local node_modules gap that CI resolves on fresh install). Remaining coverage gap: ~818 providers whose `cover_image_url` is still `/images/categories/*.png` from the older `enrich-places-api.js` run — needs a targeted re-run of `scripts/comprehensive-enrich-places.mjs` as a follow-up (not in this commit).

- **Claude Code** · 2026-04-18T16:00:00+04:00 — PRODUCTION SERVER MIGRATED: zavis.ai is now served from a dedicated AWS Lightsail instance in Mumbai (ap-south-1a, `13.234.162.47`, 8 GB / 2 vCPU / 160 GB SSD, Ubuntu 24.04) instead of the shared Zavis Marketing EC2 box (`13.205.197.148`). Cloudflare DNS has been flipped; live traffic is landing on the new origin (verified via Cloudflare IPs in Nginx access log). DB `zavis_landing` (413 MB, 39 tables, 31,899 providers, 211 articles, 129 cities) dumped and restored on new box — restore smoke-tested against a throwaway DB with zero row-count drift. PM2 blue/green both online: `zavis-green` on port 3201 (active, 2 cluster workers) + `zavis-blue` on 3200 (idle). Nightly `pg_dump -Fc` cron at 02:17 UTC writes to `/var/backups/zavis-landing/` with 14-day retention; initial dump taken (105 MB) and restore verified. PM2 logrotate module installed (50 MB cap, 7-day retention, compressed). `/etc/logrotate.d/zavis-landing-backups` rotates `db-backup.log` + `sitemap-generation.log` weekly. Self-signed TLS cert at `/etc/ssl/certs/zavis-selfsigned.crt` + key in `/etc/ssl/private/` covering both `zavis.ai` and `www.zavis.ai` (SAN) — works with Cloudflare SSL mode `Full` (not `Full strict`). Production Nginx config at `/etc/nginx/sites-available/zavis.ai` preserves the critical apex-to-www 301 redirect from the prior incident. `POSTIZ_API_BASE` env var switched from `localhost:4007` → `https://socials.zavisinternaltools.in/api` so research-pipeline routes work without Postiz on the new box. Sitemap cron flipped: disabled on old EC2 (commented with `CUTOVER 2026-04-18 moved to Lightsail —` prefix), enabled on new box. `deploy.sh` memory floor lowered from 8192 MB → 2048 MB (new box has only 7.6 GB total, old floor would always abort). Deploy pipeline prepared: ed25519 SSH deploy key `zavis-landing-lightsail` added to the GitHub repo, git initialized in both blue/green slots on new box with SSH remote pointing at `git@github.com:zavis-support/zavis-landing.git`, tracking `origin/live`. GitHub Actions secrets `EC2_HOST` + `EC2_SSH_KEY` will need rotation to point at new box (pending). Old box remains live as a passive rollback target — its PM2 processes are untouched; cutover back is a DNS-only operation. Full playbook at `/home/ubuntu/MIGRATION.md` on the new Lightsail box. Not deployed via pipeline yet (this commit is the first one to exercise the new path). Committed.

- **Claude Code (Builder)** · 2026-04-11T22:30:00+04:00 — ZOCDOC ROADMAP ITEM 4: Fat city-specialty hub pages + ProviderCard decision upgrade + condition matching pages. Three sub-deliverables: (A) `src/components/provider/ProviderCard.tsx` upgraded to decision card — every chip gated on real data: stars+review-count (gate `>=3`), low-confidence label, open-now surrogate computed from `operatingHours` (green/amber/gray), review snippet slot, verified/claimed badges, insurance chips (top 3 + `+N more`), language chips (top 2), wheelchair `role=img` badge, top services inline. TC/Zavis tokens, keyboard nav, focus-visible ring, `aria-label` on link. New props optional → 25 existing call sites unbroken. (B) Fat city-specialty hub enhanced in the `resolved.type === "city-category"` branch of `src/app/(directory)/directory/[city]/[...segments]/page.tsx`: 8 new link blocks — editorial intro (~200 words bilingual via `src/lib/constants/hub-editorial.ts`, 16 hand-written combos + templated fallback), sibling neighborhood grid (gated ≥3 providers via `getNeighborhoodsByCity`), insurance pivot strip (geo + `isTriFacetEligible` gated), language pivot strip (5 seeds), related specialties strip (new `src/lib/constants/related-specialties.ts` curated map), doctor cross-links via `getProfessionalsIndexBySpecialty`, top-rated module with deterministic day-of-year rotation, FAQ block. Fixed pre-existing broken ProviderListPaginated call to new Item 0.5 API (`providers/currentPage/totalCount/pageSize`). JSON-LD: CollectionPage + MedicalSpecialty `about` + Place `spatialCoverage` + BreadcrumbList + ItemList + FAQPage with `@id` anchoring. (C) Condition matching pages rewritten at `src/app/(directory)/directory/[city]/condition/[condition]/page.tsx` + new Arabic mirror at `src/app/(directory)/ar/directory/[city]/condition/[condition]/page.tsx`. New `src/lib/constants/condition-specialty-map.ts` with ordered specialty priority + symptoms/urgent-signs/insurance-notes/anatomy/risk-factors/treatments + bilingual EN/AR intros for 8 priority conditions (back-pain, diabetes, dental-implants, mental-health-anxiety, ivf-fertility, heart-disease, pregnancy-maternity, lasik-eye-surgery). New `src/lib/seo-conditions.ts` (separate from `src/lib/seo.ts` per constraint) with `generateConditionPageSchema()` emitting MedicalWebPage + MedicalCondition + ItemList + BreadcrumbList + FAQPage nodes — every field gated on real data per Item 2 discipline. `generateConditionFaqs()` builds 8 EN FAQ questions. Used `evaluateCombo(['city','condition'])` from Item 8 facet-rules for runtime gate in generateMetadata. Urgent-care red banner, insurance notes, labs cross-links all conditional on data presence. (D) Sitemap wired: condition URLs (EN) now emit hreflang alternates to AR mirrors; new Arabic condition block added under the existing Arabic city loop. Constraints honored: `src/lib/seo.ts` NOT touched (new helpers in `src/lib/seo-conditions.ts`); `ProviderListPaginated` NOT touched (only call-site updated to new API); StickyMobileCta mount on listing branch NOT disturbed; `src/app/layout.tsx` NOT touched. Lint clean (only pre-existing warnings, no errors). tsc clean on all new/modified files — remaining tsc errors are pre-existing in GCC country pages + GccDirectoryPages.tsx (Items 0.5/GCC ownership). Not deployed. Not committed.

- **Claude Code (Builder)** · 2026-04-11T21:10:00+04:00 — ZOCDOC ROADMAP ITEM 10: WCAG 2.1 AA accessibility pre-emption. Static audit of 10 Zavis page types at `docs/a11y/wcag-2-1-aa-audit-2026-04-11.md` (0 P0, 14 P1, 22 P2, 7 P3 — no blockers, large P1 backlog mostly deferred to other item owners). New `src/components/layout/SkipToContent.tsx` (screen-reader-visible-on-focus bypass block targeting `#main-content`). `src/app/(directory)/layout.tsx` updated to mount it + add `id="main-content" tabIndex={-1}` on `<main>` (NOT `src/app/layout.tsx` — gtag-shim protected). `src/components/layout/Footer.tsx` upgraded: `role="contentinfo"` + `aria-label`, link columns wrapped in `<nav aria-labelledby>`, `<h5>` → `<h3>`, decorative glyphs `aria-hidden`, focus-visible ring utility on every link, new `/accessibility` link in Directory column, `hrefLang="ar" lang="ar"` on Arabic link. `src/components/layout/Breadcrumb.tsx`: `aria-label="Home"` + `aria-hidden` on icon + focus ring. New full-length accessibility statement pages: `src/app/(directory)/accessibility/page.tsx` (EN, ~1100 words — WCAG 2.1 AA commitment, scope, known limitations, reporting SLA, UAE Federal Law No. (29) of 2006 + 2020 amendment reference, TDRA guidance, testing methodology, WebPage+BreadcrumbList+Organization JSON-LD) + `src/app/(directory)/ar/accessibility/page.tsx` (Arabic mirror, dir=rtl, mirrored JSON-LD). Color contrast audit: `accent #00c853` on white FAILS AA at 1.96:1 (flagged P1, requires brand-level decision); `#006828` passes; `muted` passes on white; `white/40` on dark FAILS (2.99:1). Form labels sweep: all `<input>/<select>/<textarea>` in the codebase are labelled. Constraints respected: ProviderCard, ProviderListPaginated, SearchBar, `src/app/layout.tsx`, find-a-doctor, intelligence, insurance-facets, verified-reviews all untouched. Lint clean + tsc clean on all touched/new files (pre-existing errors only in files owned by Items 0.5/0.75/4/GCC). Not deployed. Not committed.

- **Claude Code (Builder)** · 2026-04-11T20:15:00+04:00 — ZOCDOC ROADMAP ITEM 6: "What UAE Patients Want" annual report scaffold. New route class at `src/app/(directory)/intelligence/reports/` (hub `page.tsx` + `[slug]/page.tsx` + `[slug]/loading.tsx`), Arabic mirrors at `src/app/(directory)/ar/intelligence/reports/` (hub + `[slug]/page.tsx`), press kit at `src/app/(directory)/intelligence/press/page.tsx`. New DB tables `reports` + `report_authors` (Drizzle schema additive + `scripts/db/migrations/2026-04-11-reports.sql` with GRANT ALL). New helpers: `src/lib/seo-reports.ts` (`reportSchema()` / `reportsHubSchema()` / `pressHubSchema()` emitting Report + Article + BreadcrumbList + FAQPage + Organization nodes with `isBasedOn` Dataset + `isPartOf` Periodical), `src/lib/reports/data.ts` (async `getPublishedReports` / `getReportBySlug` / `getAllActiveReports` / `getRelatedReports`). Seed script `scripts/seed-reports.mjs` (pg, not neon) stages the 10 UAE concept briefs as `status='draft'` with realistic methodology + sample size + section outline + placeholder body_md. `src/app/sitemap.ts` NOT touched (Item 6 constraint) — instead new `src/app/sitemap-reports.xml/route.ts` async route handler gated on `status='published'` with EN+AR hreflang, registered in `src/app/robots.ts`. Footer gets "Intelligence Reports" + "Press Room" links. Docs: `docs/reports/pitch-templates.md` (3 tier-specific press pitch templates) + `docs/reports/2026-editorial-calendar.md` (month-by-month release schedule, press list, workflow pre-flight). Constraint compliance: `src/lib/seo.ts` NOT touched; gtag-shim NOT touched; no fabricated trust claims; bilingual EN/AR throughout; all seed rows are drafts so nothing enters sitemap until editorial lifts status. Lint clean (only pre-existing warnings), tsc clean on all new files. Not deployed. Not committed.

- **Claude Code (Builder)** · 2026-04-11T19:30:00+04:00 — ZOCDOC ROADMAP ITEM 2: JSON-LD generator enhancements in `src/lib/seo.ts`. Extended `medicalOrganizationSchema()` with bilingual `alternateName` (from `provider.nameAr`), DHA/DOH/MOHAP `identifier` (PropertyValue driven by new `getRegulatorPropertyId()` helper + `provider.licenseNumber`), PostalAddress that only emits populated fields, `sameAs` array (website + googleMapsUri), `ImageObject` primary image using `provider.logoUrl` then galleryPhotos, stable `@id = url#provider`. Tightened AggregateRating gate to `reviewCount >= 3` in both `medicalOrganizationSchema` and `itemListSchema`, added `ratingCount`/`reviewCount` distinction with `bestRating: "5"` / `worstRating: "1"`. REMOVED `isAcceptingNewPatients: true` hardcoding + `derivePriceRange()` fabricated price symbols + fallback empty `availableService` arrays. Added new exported `generateFullProviderSchema()` composer that returns `[Provider (#provider), MedicalWebPage (#webpage), BreadcrumbList (#breadcrumb), FAQPage?]` as a single-entry-point node graph. Extended `LocalProvider` type + `rowToProvider` to surface `nameAr`, `addressAr`, `licenseNumber`, `logoUrl` from the DB (columns already existed in `src/lib/db/schema.ts`). Respected Item 0.75's `src/lib/professionals-seo.ts` — not touched. Respected Item 1's insurance-facet helpers — not touched. Lint clean on touched files, `npx tsc --noEmit` exit 0. Not deployed. Not committed.

- **Claude Code (Builder)** · 2026-04-11T18:45:00+04:00 — ZOCDOC ROADMAP ITEM 9: Mobile sticky CTA bar + healthcare-intent search rebuild. Two deliverables: (A) new client component `src/components/directory/StickyMobileCta.tsx` (Call/WhatsApp/Directions/Website CTAs, trust-disciplined — no fake buttons, scroll reveal after 200px, fires `trackEvent('cta_click')`, mounted on the `resolved.type === "listing"` branch of `src/app/(directory)/directory/[city]/[...segments]/page.tsx`, replacing the hardcoded inline CTA) and (B) healthcare-intent search rebuild: new `src/lib/search/types.ts`, `src/lib/search/match.ts` keyword-to-specialty/condition parser + `searchHealthcare()` matcher calling existing `getProviders` + `getProfessionalsIndexBy*` helpers, rebuilt `src/components/search/SearchBar.tsx` with condition/specialty/insurance/language/city dropdowns + doctor/facility/both toggle + emergency red toggle, updated `src/app/(directory)/search/page.tsx` to render grouped results (doctors → facilities → conditions → insurance hubs) with zero-state widening fallback. `searchParams.page` already SSR-paginated via Item 0.5. Sitemap untouched (stays out of `/search`). robots metadata stays `noindex,follow`. gtag-shim NOT touched. Not deployed. Not committed.

- **Claude Code (Builder)** · 2026-04-11T17:30:00+04:00 — ZOCDOC ROADMAP ITEM 8: Centralized facet-policy rule engine. Building `src/lib/seo/facet-rules.ts` as the single source of truth for indexable URL combinations, minimum-inventory thresholds, and canonical strategies. Absorbs Item 1's `TRI_FACET_MIN_PROVIDERS` / `DUO_FACET_MIN_PROVIDERS` / `AREA_FACET_MIN_PROVIDERS` plus the scattered `TRI_FACET_INSURER_ALLOW`, `TRI_FACET_CATEGORY_ALLOW`, `DEEP_PAGINATION_CITY_CATEGORY_ALLOW` sets from `src/app/sitemap.ts`. Exports `evaluateCombo()` as the runtime gate for every page. `src/lib/insurance-facets/data.ts` re-exports the constants to preserve backward compatibility with Item 1 consumers. Audit doc at `docs/seo/facet-audit-2026-04-11.md`. No runtime behavior change; pure refactor/centralization. Not deployed. Not committed.

- **Claude Code (Builder)** · 2026-04-11T16:45:00+04:00 — ZOCDOC ROADMAP ITEM 7 (descoped): `/verified-reviews` policy page only. Building public-facing trust-policy page explaining Zavis's 5-tier verification framework (Verified Visit, Verified Prescription, Zavis Gold, Editorial Review, License Verified), moderation policy, PDPL compliance, rollout timeline, and 8-question FAQ. NO intake system, NO DB schema, NO API routes — Codex's "do NOT fake reviews" warning respected. Artifacts: `src/app/(directory)/verified-reviews/page.tsx` (EN), `src/app/(directory)/ar/verified-reviews/page.tsx` (AR), `src/components/trust/VerifiedBadge.tsx` (reusable 5-tier badge component for future directory integration), +2 sitemap entries, +1 Footer link. Not deployed. Not committed.

- **Claude Code (Builder)** · 2026-04-11T15:30:00+04:00 — ZOCDOC ROADMAP ITEM 3: UAE neighborhood taxonomy upgrade. Building additive polygon-backed taxonomy for `/directory/[city]/[area]` pages. Artifacts: `scripts/db/migrations/2026-04-11-neighborhoods-taxonomy.sql` (additive schema for `areas` table + bbox/centroid/source/publish fields), Drizzle schema extension, 4 ingestion scripts under `scripts/neighborhoods/` (Dubai Pulse `dm_community-open`, Abu Dhabi Open Data, OSM Overpass for northern emirates, haversine provider-to-area assignment), 4 new async helpers in `src/lib/data.ts` (`getNeighborhoodsByCity`, `getNeighborhoodBySlug`, `getProvidersByNeighborhood`, `getProviderCountByNeighborhood`) with sync-constant fallback, `src/lib/seo-neighborhoods.ts` NEW with `neighborhoodHubSchema` (CollectionPage + ItemList + BreadcrumbList + FAQPage + Place). Existing `getAreaBySlug`/`getAreasByCity` sync helpers are UNTOUCHED — zero breakage to catch-all `resolveSegments`. Not deployed. Not committed.

- **Claude Code (Builder)** · 2026-04-11T14:15:00+04:00 — ZOCDOC ROADMAP ITEM 0.75: Doctor + Dentist profile pages. Building new page class for 99,520 DHA professional records. Artifacts: `scripts/db/migrations/2026-04-11-professionals-index.sql`, `scripts/build-professionals-index.mjs`, Drizzle `professionalsIndex` table, `src/lib/professionals-seo.ts` NEW file, extended `src/lib/professionals.ts` async helpers, `/find-a-doctor/[specialty]/[doctor]/page.tsx` route, `DoctorProfilePage` + 4 supporting components, dedicated `sitemap-doctors.xml` route, robots.ts registration. Trust discipline: no fabricated insurance/availability/languages/ratings. Not deployed. Not committed. Lint + tsc clean on touched files.

- **Claude Code** · 2026-04-11T10:00:00+04:00 — ZOCDOC ROADMAP IMPLEMENTATION (10 items): building staged, reviewed, non-deployed artifacts from the Zocdoc research synthesis. Master tracking at `.ai-collab/ZOCDOC-ROADMAP-IMPLEMENTATION.md`. Sequential: (1) insurance-facet layer, (2) JSON-LD enhancements on top of existing src/lib/seo.ts, (3) UAE neighborhood taxonomy upgrade, (4) fat city-specialty hub pages, (5) /intelligence E-E-A-T leapfrog (author pages, reviewer bylines, MedicalWebPage schema), (6) Zavis UAE Patients Want report scaffold, (7) verified-review bootstrap, (8) 3-facet cap + gated programmatic rules, (9) mobile sticky CTA + conversion architecture, (10) WCAG 2.1 AA accessibility pre-emption. Each item: one builder agent + 3 parallel reviewers (SEO, code quality, Zavis-fit). Not deployed. Not committed. Staged for handoff.

- **Codex** · 2026-04-11T03:23:57+05:30 — COMPLETED: multi-agent production pentest and source reconciliation. Added `docs/pentest-report-2026-04-11.md` with confirmed live findings, severity, exploit paths, and cleanup notes. Scope: auth/access-control verification, public operational data exposure, secret/session handling, edge/header hardening. Minimal live state changes: one schedule pause/resume cycle and a successful `read_all` notification mutation to prove missing auth. No code shipped.

- **Codex** · 2026-04-11T02:54:19+05:30 — COMPLETED: added Zocdoc benchmark planning artifacts for execution handoff. New docs: `docs/zocdoc-brutal-action-plan.md` and `docs/zocdoc-implementation-recommendations.md`. Scope: translate competitor research into repo-specific route/model/schema/build recommendations and scenario-based organic upside ranges. No code shipped. No deployment changes.

- **Codex** · 2026-04-11T02:54:19+05:30 — COMPLETED: added full-stack security recommendation doc after source review of API/auth/DB surfaces. New doc: `docs/security-audit-recommendations.md`. Scope: identify current critical/high/medium security findings, recommend Sprint 0 remediation order, and mark security as a gating dependency ahead of Zocdoc-style expansion. No runtime code changed.

- **Claude Code** · 2026-04-10T17:30:00+04:00 — P0 INCIDENT FIX: Homepage was crashing browser tabs (renderer hit 334% CPU and 2.6 GB RAM ~30s after load). Root cause: 4 broken Custom HTML tags in GTM container GTM-T9N3FDMQ (tags 68 engaged_session, 71 scroll_milestone, 72 outbound_click, 73 contact_click) — each fired on its own custom event and re-pushed that same event via gtag(), causing infinite recursion through the layout.tsx gtag shim. Tag 60's setTimeout(...30s) triggered the loop on every page load. Diagnosed via agent-browser by bisecting third-party scripts with `network route --abort`, then decoding the public GTM container JS. Actions: (1) deleted tags 68/71/72/73 via MCP gtm_delete_tag (now 17 tags, was 21); (2) added defense-in-depth recursion guard to gtag-shim in src/app/layout.tsx that drops gtag("event", X, ...) calls for those four event names. Fix verified in agent-browser against the still-broken live GTM: CPU stayed at 3-7% and memory steady at 175 MB through 56s (vs unguarded baseline that hit 334% / 2.6 GB at t=35s). NOT YET LIVE: GTM workspace deletes need manual publish from dashboard (MCP token lacks tagmanager.publish scope). Code fix needs to be committed and pushed to `live` branch to deploy via GitHub Actions.

- **Claude Code** · 2026-04-07T23:45:00+04:00 — COMPLETED: Cross-country data integrity audit for all 4 GCC countries (SA, QA, BH, KW). 8 checks: country-city mismatch, duplicate place_ids, slug collisions, provider counts, coordinate bounding boxes, intelligence articles, orphan cities, data quality summary. Results: 6 PASS, 1 WARNING (4 SA providers outside bbox — edge cases near NEOM/Haql), 1 INFO (Bahrain phone/website coverage lower than others). Total: 4,561 GCC providers.

- **Claude Code** · 2026-04-07T23:30:00+04:00 — COMPLETED: Rewrote `scripts/re-enrich-gcc-providers.mjs` — removed ALL Jaccard similarity code (function, thresholds, findBestMatch), replaced with pure LLM verification pipeline: Text Search -> take top Google result -> Gemini 3.1 Flash Lite verifies EVERY match (confidence >= 60 to accept). Added TRUE parallel batching (BATCH_SIZE=10 via Promise.all) with queue-based Google API rate limiter (100ms/10 QPS). Added permanently-closed business detection (marks inactive). Round-robin OpenRouter keys for Gemini, single Google key rate-limited. Syntax verified.

- **Claude Code** · 2026-04-07T22:00:00+04:00 — COMPLETED: Created `scripts/dedup-gcc-gemini.mjs` — GCC provider deduplication script using Gemini 2.5 Flash Lite via OpenRouter. Two-pass strategy: (1) exact normalized name match, (2) Gemini fuzzy matching for Arabic/English variants, abbreviations. Dry-run default, backup before deletes, never touches UAE. Syntax verified.

- **Claude Code** · 2026-04-07T20:00:00+04:00 — COMPLETED: GCC provider data integrity fixes. 4 fix categories executed via SQL on EC2: (1) Recategorized 889 providers by name keywords — dental 263, labs 181, clinics-from-hospitals 409, pharmacies 10, hospitals-from-clinics 26; (2) Phone normalization — Qatar +974 prefix (5), removed 107 hotline (1), Kuwait +965 fixes (4); (3) Saudi city mismatches — Haql/Alqan moved from riyadh to other (2); (4) Deduplicated 136 exact duplicates (same name+city+category+country). Also fixed 2 Blisslab Pharmacy entries miscategorized as labs. All verification checks pass: zero remaining issues. Final GCC totals: BH 876, KW 793, QA 708, SA 2,550 = 4,927 clean providers.

- **Claude Code** · 2026-04-10T17:00:00+04:00 — COMPLETED: Created comprehensive "How to Make Great Directories.md" — a 23-chapter best practices document distilled from all napkin.md, engineering-journal.md, .ai-collab/ files, and full codebase exploration. Covers data acquisition, scraping patterns, data quality, DB architecture, URL design, page taxonomy, SEO, structured data, content generation, i18n, performance, design philosophy, cross-linking, thin content protection, sitemaps, multi-region expansion, automation, security, and meta-lessons.

- **Claude Code** · 2026-04-07T15:30:00+04:00 — COMPLETED Dubai re-enrichment (5,614 providers). Script: `scripts/re-enrich-uae-providers.mjs`. Results: 4,207 matched (74.9%), 642 websites corrected, 1,193 phones corrected, 4,207 place_ids saved, 1,398 flagged for manual review. Cost: ~$251. Zero API errors. Remaining UAE cities (abu-dhabi, sharjah, ajman, ras-al-khaimah, fujairah, umm-al-quwain, al-ain) not yet run.

- **Claude Code** · 2026-04-10T00:30:00+04:00 — COMPLETED: Built and ran provider data audit. Script at `scripts/audit-provider-data.mjs`. Full audit results: 17,566 providers checked, 3,319 API calls (GCC providers with place_ids), $9.96 cost. Results: 4 CRITICAL (name mismatches — 2 encoding issues, 1 Arabic-only name, 1 garbage ".." record), 35 HIGH (all phone number mismatches, mostly Bahrain pharmacies), 2 MEDIUM, 3,277 OK, 1 error. UAE providers (12,503) have NO google_place_id — cannot be audited via this method. Reports at EC2: `data/audit/provider-audit-2026-04-09.json` and `data/audit/provider-audit-critical-2026-04-09.csv`.

## Recently Completed (last 48h)

- **Claude Code** · 2026-04-08T12:00:00+04:00 — Fixed 12 UAE branding leaks on GCC country pages. Header/Footer now detect country from URL and render country-specific branding. Organization schema made country-neutral. Pricing FAQ skipped for non-UAE. COMPLETED.

## Recently Completed (last 48h)

- **Claude Code** · 2026-04-07T16:00:00+04:00 — Audited `scripts/seed-gcc-guides.mjs`: fixed 4 invalid category values (`regulatory-policy` -> `regulatory`, `market-analysis` -> `market-intelligence`). Verified all NOT NULL columns populated, ON CONFLICT slug matches unique index, sitemap-intelligence.xml picks up articles automatically. Staged file, lint clean.

- **Claude Code** · 2026-04-07T23:00:00+04:00 — Created "Best X in Y" pages for all 4 GCC countries (QA, SA, BH, KW). Shared component GccBestPages.tsx with country best index, city best, and city+category best pages. 12 route files delegating to shared component. Updated 4 country sitemaps with best page URLs. Added "Best" callout link on GCC directory listing pages.

- **Claude Code** · 2026-04-07T22:00:00+04:00 — Created `scripts/seed-gcc-guides.mjs` to insert 4 cornerstone healthcare guide articles (Qatar, Saudi Arabia, Bahrain, Kuwait) into journal_articles table. ON CONFLICT DO NOTHING on slug for safe re-runs.

- **Claude Code** · 2026-04-08T04:00:00+04:00 — Enriched GCC city pages and country home pages to match UAE quality. City page: added editorial blurb paragraph, expanded FAQs from 3 to 5 (types of healthcare, regulation, emergency services, languages), enhanced answer block with date/neighborhood count. Country home page: added AEO answer block with country overview, FAQPage JSON-LD + speakableSchema, FaqSection with 4 country-level FAQs, richer city cards with "X providers" / "Coming soon" labels. Both pages lint-clean.

- **Claude Code** · 2026-04-08T03:00:00+04:00 — Built comprehensive Google Places API scraper for GCC healthcare facilities (`scripts/scrape-gcc-google-places.mjs`). Replaces OSM-based scrapers with richer data including ratings, reviews, phone, website, operating hours. Covers SA (19 cities), QA (6), BH (7), KW (7). Supports resume, merge with existing data, dedup, Place Details enrichment, and cost estimation.

- **Claude Code** · 2026-04-08T03:30:00+04:00 — SEO thin-page protection for GCC providers: added noindex/follow for name-only stubs (0-3 fields) in GCC listing metadata, and richness filter (googleRating > 0 OR phone OR website) in all 4 per-country sitemaps to exclude thin pages from discovery.

## Recently Completed (last 48h)

- **Claude Code** · 2026-04-08T01:30:00+04:00 — Comprehensive Qatar + Kuwait OSM scrapers: Qatar 75→275 providers (66 hospitals, 122 clinics, 55 pharmacies, 25 dental, 5 labs, 2 physiotherapy). Kuwait 177→259 providers (58 hospitals, 74 clinics, 110 pharmacies, 14 dental, 3 labs). Both use batched Overpass queries with ways + nodes, 30s inter-batch delays, retry with backoff, name+proximity dedup, and category slug normalization to match directory constants.
- **Claude Code** · 2026-04-08T00:30:00+04:00 — Comprehensive Bahrain OSM scraper: filled category gaps (0 clinics→37, 0 dental→22, 17→58 hospitals, +1 lab). Merged 171 OSM facilities with 324 NHRA records via name similarity + proximity dedup. Final: 447 providers, 168 with coordinates.
- **Claude Code** · 2026-04-07T23:45:00+04:00 — Split single sitemap-gcc.xml into 4 per-country sitemaps (sitemap-qa.xml, sitemap-sa.xml, sitemap-bh.xml, sitemap-kw.xml). Each queries providers table by country, includes structural pages + individual provider pages. Updated robots.ts. Deleted old sitemap-gcc.xml.
- **Claude Code** · 2026-04-07T23:30:00+04:00 — COMPLETED: Fixed all data quality issues in Saudi Arabia healthcare data (930 records, largest GCC dataset).

- **Claude Code** · 2026-04-07T23:00:00+04:00 — Fixed 130 data quality issues in Kuwait healthcare providers JSON: 109 category normalizations (pharmacies→pharmacy, dentists→dental), 1 city mapping fix (Adan Hospital→ahmadi), 20 Arabic address transliterations to Latin. Records: 177 (no duplicates found).
- **Claude Code** · 2026-04-07T21:30:00+04:00 — Fixed 32 data quality issues in Bahrain healthcare providers JSON: 5 name/address bleeds, 16 city slug normalizations, 3 phone fixes, 2 double-dot names, 6 duplicates removed. Records: 330 → 324.
- **Claude Code** · 2026-04-07T23:59:00+04:00 — Fixed 4 critical GCC expansion bugs: getCities() default to UAE, getProviders() country leak guard, multi-country sitemap-gcc.xml, GCC cross-links on directory home, noindex for thin GCC pages.

---

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

- **[Claude Code] 2026-04-07T22:00:00+04:00** — GCC multi-country expansion: Added `country` column (text, not null, default "ae") to `cities` and `providers` DB schema. Created `src/lib/constants/countries.ts` with 5 GCC countries (AE, QA, SA, BH, KW). Added 35 GCC cities (6 Qatar, 15 Saudi, 7 Bahrain, 7 Kuwait) to `src/lib/constants/cities.ts` with `country` field on all entries. Updated `data.ts` — `LocalCity` interface has `country`, `getCities()` accepts optional country filter, `getProviders()` accepts optional `country` filter for DB queries. All backward-compatible (defaults to "ae"). Zero lint errors. COMPLETE.

- **[Claude Code] 2026-04-07T18:30:00+04:00** — SEO metadata truncation fix: added `truncateTitle()` and `truncateDescription()` utilities to `src/lib/seo.ts`, applied to all metadata in English catch-all (6 cases), Arabic catch-all (4 cases), city page, and directory home. Converted directory home from static `metadata` to `generateMetadata()` so year updates on ISR. Shortened area-insurance title suffix to "| Zavis". Zero lint errors. COMPLETE.

- **[Claude Code] 2026-04-07T16:00:00+04:00** — Upgraded provider structured data: dynamic schema.org @type based on category slug (Hospital, MedicalClinic, Dentist, Pharmacy, Optician, DiagnosticLab), added amenityFeature (LocationFeatureSpecification) from provider.amenities, added multi-image support from provider.photos array. Added `photos` field to LocalProvider interface and rowToProvider mapper. Zero lint errors. COMPLETE.

- **[Claude Code] 2026-04-07T14:00:00+04:00** — Enhanced structured data (JSON-LD) for provider pages: improved MedicalBusiness schema (contactPoint, department, hasMap, isAcceptingNewPatients, sameAs, knowsLanguage, stricter aggregateRating guard), enhanced provider FAQs (natural long-tail questions, dynamic FAQs for rating/languages/yearEstablished), improved ItemList schema (ordering, URLs, richer per-item data), added providerListSchema convenience function. Zero lint errors. COMPLETE.

- **[Claude Code] 2026-04-07T12:00:00+04:00** — Fix Google indexing issues: split sitemap-providers.xml into English-only + Arabic-only sitemaps (50k URL limit fix), created sitemap-intelligence.xml for DB-driven journal articles, added HTTP 500 error responses on empty/failed sitemap queries (was returning 200 with empty XML), updated robots.ts to declare all 4 sitemaps. COMPLETE.

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

- **[Claude Code] 2026-04-07T16:00:00+04:00** — Created Kuwait healthcare provider scraper at `scripts/scrape-kuwait-moh.mjs`. Fetches from Wikipedia (hospitals) + OSM Overpass API (clinics, pharmacies, dentists). Merges, deduplicates, maps to 6 Kuwait cities via coordinate bounding boxes. Outputs `data/parsed/kuwait_providers.json` (177 providers). Includes retry logic and hardcoded Wikipedia fallback for rate-limit resilience.

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

## 🚨 LIVE REGRESSION — GCC pages dropped out of ISR cache

- **Claude Code (1M)** · 2026-04-11T08:40:00+04:00 — Noticed during QA Round 3 Lighthouse audit: ALL GCC provider pages (BH/KW/QA/SA) now return `Cache-Control: private, no-cache, no-store, max-age=0, must-revalidate` with `cf-cache-status: DYNAMIC`. Every visit bypasses both Cloudflare and browser cache → origin hit per pageview.

  **Root cause:** `src/app/(directory)/{qa,sa,bh,kw}/directory/[city]/[...segments]/page.tsx` now destructure `searchParams?: { page?: string }` at the page level and pass it into `generateGccSegmentsMetadata` + `GccSegmentsPage`. In Next.js 14 App Router, reading `searchParams` in a page component automatically forces dynamic rendering — `export const revalidate = 21600` is silently ignored.

  **Confirmed regression on live** against both Dr Bindu (Qatar) and Aman Hospital (Qatar) — neither is revalidation-induced.

  **UAE provider pages** (`src/app/(directory)/directory/[city]/[...segments]/page.tsx`) are NOT affected because they still use the old non-searchParams signature — `cache-control: private, max-age=14400, must-revalidate`, `cf-cache-status: MISS/HIT` correctly.

  **This belongs to the Zocdoc Roadmap Item 0.5 (Pagination) work** in flight. Not touching the fix — it's tangled with `ProviderListPaginated` server-component refactor which is also mid-flight on this agent's worktree.

  **Suggested fix patterns** (pick one):
  1. Use `searchParamsCache` from `nuqs/server` so the searchParam read is deferred.
  2. Split the route: keep the base `[...segments]/page.tsx` ISR (no searchParams), add a `?page=N` handler via a route segment config.
  3. Accept the tradeoff: drop `export const revalidate = 21600` on GCC routes, set `dynamic = 'force-static'` for page 1 only, let pages 2+ be dynamic.

  **Operational impact right now:** ~5× traffic from GCC crawlers + visitors is landing on EC2 origin with zero cache help. Green slot is at 192 MB RAM / 0% CPU as of last check — still healthy — but this will compound once GCC pages index and get more crawler traffic. Priority fix recommended within 24h.
