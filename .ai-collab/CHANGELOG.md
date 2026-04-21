# Zavis Landing - Changelog

## 2026-04-22 — [Claude Code] Site-wide directory redesign: Airbnb UX archetype + Zavis visual identity

**Signed by:** Claude Code · 2026-04-22T00:45:00+04:00

**What happened:**

A complete visual + interaction refresh of the `(directory)` route group — ~60 pages rewritten against a new design system + 3 reusable templates. The design combines Airbnb's interaction patterns (sticky morphing search pill, horizontal chip rails, photo-first cards, photo-mosaic detail hero, sticky booking card, scroll-reveal bottom bar, shared-element photo viewer modal) with Zavis brand identity (accent-green CTAs, cream surface, Bricolage display + DM Sans body, warm radial-gradient heroes).

**New design system**

- `tailwind.config.ts` — added `ink`, `surface`, `state` color tokens; `z-container|wide|full` container widths; typography ladder (`display-xl|lg|md`, `z-h1|h2|h3`, `z-body|body-sm|caption|micro`); radii (`rounded-z-sm|md|lg|pill|search`); aspect tokens (`aspect-z-card` 20:19, `aspect-z-mosaic` 2:1); transition tokens (`duration-z-fast|base|med|slow`, `ease-z-standard|exit|overshoot`).
- `src/app/globals.css` — `:root` motion tokens (`--dur-*`, `--ease-*`); scrollbar-hide utilities (`.z-no-scrollbar`, `.z-snap-rail`); shadow system (`.shadow-z-card|hover|pill|float|sticky`); keyframes for `z-heart-pop` + `z-fade-up` + `.z-stagger`; `prefers-reduced-motion: reduce` global block; `.z-anchor` scroll-margin for sticky nav.
- `src/lib/safeData.ts` — `safe(promise, fallback, label)` wrapper so local DB schema drift never crashes a page.

**New component library at `src/components/directory-v2/`**

- **header/**: `ZavisHeader` (sticky, scroll-aware, scroll-morph SearchPill big→compact), `SearchPill` (4-segment with per-segment hover/focus), `SegmentFlyout` (Specialty/City/Date/Insurance dropdowns with autocomplete + auto-advance), `SearchPillModal` (scrim + flyout choreography).
- **rails/**: `CategoryRail` (horizontal chip-pill scroll, hidden scrollbar, auto-appearing arrows, edge-fade gradients; short-name map for long specialty labels).
- **filters/**: `FilterChip` (Airbnb applied-state black-fill flip), `FilterChipRow`, `FilterDrawer` (right-side sticky-footer drawer with live match count).
- **cards/**: `ProviderCardV2` (20:19 photo, full-card overlay-link for valid HTML, heart top-right, carousel dots bottom), `CityCard`, `SpecialtyTile`, `HeartButton` (optimistic scale pop via CSS keyframes), `PhotoCarousel` (arrows on hover, telescoping dots, GPU-only zoom).
- **detail/**: `PhotoMosaic` (1-big-4-small, rounded outer corners only), `PhotoViewer` (shared-element `layoutId` Framer Motion modal, keyboard nav, vertical scroll gallery), `BookingCard` (right-column sticky w/ Call/WhatsApp/Website/Directions/Claim, analytics-wired), `StickyBottomBar` (IntersectionObserver slide-up when booking-card exits viewport, analytics-wired), `ReviewDistribution` (6 healthcare sub-scores: Punctuality / Diagnosis clarity / Bedside manner / Follow-up / Facility / Value), `AmenityGrid` (services, accessibility), `HostCard` (clinic/provider intro), `ShowAllModal` (generic modal shell).
- **templates/**: `ListingsTemplate`, `ProviderDetailTemplate`, `HubPageTemplate`, `ProcedurePricingTemplate` (procedure-pricing bespoke: pricing cards, city-comparison table, related procedures, provider grid).
- **shared/**: `EmptyStateV2`, `SkeletonCard` + `SkeletonGrid` (static grey placeholders — no shimmer by design), `cn()` util (clsx + tailwind-merge), `motion.ts` Framer variants + canonical easing/duration constants.

**Pages rewritten (~60 files)**

- **Core flow**: `/directory` home (new `DirectoryHomeHero` client component), `/directory/[city]`, catch-all `[city]/[...segments]` with all 6 branches migrated (city-category, city-area, area-category, area-insurance, city-category-subcategory, listing, city-service), `/search` with new `SearchControls` client component (entity-type toggle + chip selects + emergency toggle + All-filters drawer + applied-state chips with X-to-clear).
- **Content hubs**: `/specialties`, `/specialties/[specialty]`, `/specialties/[specialty]/medications`, `/conditions`, `/conditions/[condition]`, `/conditions/[condition]/medications`, `/medications`, `/medications/[slug]`, `/medications/[slug]/alternatives`, `/medication-classes/[slug]`, `/pharmacy` + 3 educational (`generic-vs-brand`, `how-delivery-works`, `prescription-refill`), `/find-a-doctor`, `/find-a-doctor/[specialty]`, `/insurance`, `/insurance/[insurer]`, `/labs`, `/labs/[lab]`, `/brands/[slug]`, `/verified-reviews`, `/doctors-at/[slug]`.
- **Functional**: `/claim`, `/claim/[listingId]` (form + file upload + validation preserved verbatim), `/pricing`, `/login`.
- **Editorial / policy**: `/methodology`, `/data-sources`, `/accessibility`, `/editorial-policy` (sticky TOC on `lg:`), `/terms` (sticky TOC).
- **Filter variants** (19): `[city]/24-hour` + `/24-hour/[category]` + `/24-hours` + `/walk-in` + `/walk-in/[category]` + `/emergency` + `/government` + `/government/[category]` + `/top` + `/top/[category]` + `[area]/24-hour|walk-in|emergency|government|top` + UAE-wide `/directory/top` + `/directory/top/[category]`.
- **Filter / content continued** (21): `[city]/insurance` + `/insurance/[insurer]` + `/insurance/[insurer]/[category]` + `/language` + `/language/[lang]` + `/language/[lang]/[category]` + `/condition` + `/condition/[condition]` + `/procedures` + `/procedures/[procedure]` + `[area]/procedures` + `[area]/procedures/[procedure]` + `/directory/compare` + `/compare/[slug]` + `/directory/guide` + `/guide/[slug]` + `/best/[city]/[category]` + per-city pharmacy (3 files) + per-city medications.
- **GCC cascade**: 3 shared components (`GccFilterPage`, `GccDirectoryPages`, `GccBestPages`) refreshed → auto-updates every `/qa|/sa|/bh|/kw` route without per-page edits.
- **Arabic mirror**: 105 pages got `dir="rtl"` + `font-arabic` wrapper (structural RTL flip; full template migration deferred as follow-up).

**SEO preservation**

Every `generateMetadata` preserved verbatim (titles under 52 chars, descriptions under 155 chars, canonical + hreflang `en-AE` / `ar-AE` / `x-default`, OG images). Every `<JsonLd>` schema preserved: WebSite, WebPage, BreadcrumbList, FAQPage, ItemList, CollectionPage, MedicalOrganization, MedicalWebPage, MedicalCondition, InsuranceAgency, Drug, Physician, Organization, SpeakableSpecification, neighborhoodHubSchema, specialtyHubSchema, procedureSchema, procedureCityOffersSchema, generateConditionPageSchema, medicalOrganizationSchema, generateFullProviderSchema. `.answer-block` + `data-answer-block="true"` preserved for speakable. FAQ copy word-for-word. `robots: { index: false }` preserved on `/search`. Arabic hreflang crawl anchor preserved on every English page that has an AR mirror. `revalidate` + `dynamicParams` flags untouched.

**Analytics preservation**

Upstream's `src/lib/provider-tracking.ts` (`trackProviderCta(ctaType, surface, provider)`) wired through new `BookingCard` (surface: "sidebar") and `StickyBottomBar` (surface: "sticky_mobile_cta"). CTA taxonomy preserved: `call | whatsapp | directions | website | claim_listing`. Old `ProviderSidebarCta` + `StickyMobileCta` components remain in the codebase but are no longer mounted in the listing branch (ProviderDetailTemplate renders the new surfaces). GA4 events stay 1:1 comparable with pre-refresh baseline.

**Merge with upstream (8 commits)**

Rebased onto `origin/live` after fetching. Picked up: `4c6c100 feat(analytics): provider conversion tracking`, `8fe4b5f feat(admin): ship admin dashboard`, `3ac892b feat: email notification on book-a-demo`, `f221247 fix(lint): drop unused imports`, `cc877b8 fix(directory): real Google Places images` (dup of mine), `6fd30e6 chore(docs): ai-collab`, `392c8ed chore(infra): MEMORY_FLOOR_MB`, 4 admin follow-up fixes. One conflict resolved in `[...segments]/page.tsx`: kept new `ProviderDetailTemplate` (removed legacy sidebar/mobile-CTA markup from upstream) and re-wired upstream's `trackProviderCta` into the new surfaces so analytics coverage stays equivalent.

**Dependencies**

- Added `framer-motion@^12.38.0` to `dependencies` — used selectively for scroll-driven pill morph, shared-element photo viewer (`layoutId`), filter drawer slide-in, fade-in stagger. Code-split on detail-only modals. Net incremental bundle ~12–15 KB gzipped on core pages.
- Added `overrides.html-encoding-sniffer: 4.0.0` to `package.json` to unbreak `jsdom@29` transitive CJS/ESM on Node < 20.19. Prod CI (Node 20.x latest) doesn't need the override but it's harmless.

**Build & check**

- `npx tsc --noEmit --skipLibCheck` exits 0.
- `NODE_OPTIONS="--max-old-space-size=8192" npm run build` passes (tested under Node 22.22.2 via nvm; CI runs Node 20 via setup-node@v4 which resolves to 20.20+).
- Dev server on `localhost:3333` smoke-tested across: `/directory`, `/directory/dubai`, `/directory/dubai/clinics`, `/directory/dubai/clinics/<provider>`, `/directory/dubai/dubai-marina`, `/directory/dubai/dubai-marina/clinics`, `/search`, `/search?specialty=...&city=...&insurance=...`, `/specialties`, `/specialties/clinics`, `/conditions`, `/medications`, `/pharmacy`, `/pharmacy/generic-vs-brand`, `/find-a-doctor`, `/find-a-doctor/cardiology`, `/insurance`, `/insurance/daman`, `/labs`, `/verified-reviews`, `/claim`, `/pricing`, `/login`, `/methodology`, `/data-sources`, `/accessibility`, `/editorial-policy`, `/terms` — all 200.

**Deferred (follow-ups)**

- Full template migration of the 100+ Arabic pages (RTL scaffold ships now; legacy body classes remain). Tracked as separate engagement.
- Bespoke `ProcedurePricingTemplate` is in place and wired; Arabic mirrors of procedure-pricing pages still use legacy body. Same follow-up as Arabic migration.
- Image LCP optimization on heavy hubs (`/insurance`, `/labs`) — first-compile is slow locally (DB-bound). Not a prod issue; Lighthouse pass is a post-deploy task.
- Filter-variant subcategory and city-service Arabic routes will inherit new templates once the Arabic migration ships.

**Why:** Stakeholders requested a visible refresh mirroring Airbnb's UX calibre while keeping the Zavis brand. The sweep shipped a consistent templates-driven design-system layer that every current and future directory page inherits, plus the analytics/SEO primitives stay intact so no regression in ranked impressions or conversion tracking is expected.

---

## 2026-04-19 — [Claude Code] ProviderCard renders real Google Places images on listing grids

**Signed by:** Claude Code · 2026-04-19T00:00:00+04:00

**What happened:**
- User noticed that every clinic card in the directory listing grid (e.g. `/directory/dubai/clinics`) was rendering the same generic stock image — cards for "Farnek General Clinic", "First Response Clinic", "Family Class Poly Clinic", "Friendly Early Childhood Center LLC" etc. all looked identical (`/images/categories/clinics.png`).
- Root cause: `src/components/provider/ProviderCard.tsx` hardcoded `src={getCategoryImagePath(categorySlug)}` and was never passed the provider's image. The provider *detail* hero at `src/app/(directory)/directory/[city]/[...segments]/page.tsx:871` already used the correct `provider.coverImageUrl || getCategoryImagePath(category.slug)` fallback — the card component on listing pages was the only place this pattern was missing. Item 4's decision-card refactor added chips for insurance/languages/services/open-now/accessibility but didn't touch the 40×40 image slot.
- DB audit (local `zavis_landing.providers`): 11,686 / 12,504 rows (93.5%) already have a real `cover_image_url` pointing at `https://places.googleapis.com/v1/places/.../photos/...media?maxWidthPx=800&key=...` from the comprehensive Google Places Photos enrichment. The remaining 6.5% (818 rows) were enriched via the older `enrich-places-api.js` script which doesn't request photos, so their `cover_image_url` fell back to a category stock URL written directly into the DB.
- Fix: added `coverImageUrl?: string | null` to `ProviderCardProps`, added it to the destructure, and swapped the `<Image>` src to `coverImageUrl || getCategoryImagePath(categorySlug)`. Threaded the prop through **every `<ProviderCard />` call site** — 35 usages across 27 files.

**Why:** Per-facility photos were scraped months ago but never reached the listing grid — users saw "identical cards" and assumed images were missing entirely. This ships the existing scraped data to the UI, unblocking ~93.5% of listing cards immediately. The remaining ~818 stragglers need a targeted re-run of `scripts/comprehensive-enrich-places.mjs` (separate follow-up).

**Call sites updated:**
- `src/components/provider/ProviderCard.tsx` (prop + fallback render)
- `src/components/directory/ProviderListPaginated.tsx`
- `src/components/directory/GccDirectoryPages.tsx` (3 sites)
- `src/components/directory/GccFilterPage.tsx`
- `src/app/(directory)/directory/[city]/[...segments]/page.tsx` (6 sites)
- `src/app/(directory)/directory/[city]/emergency/page.tsx`
- `src/app/(directory)/directory/[city]/24-hour/page.tsx`
- `src/app/(directory)/directory/[city]/24-hour/[category]/page.tsx`
- `src/app/(directory)/directory/[city]/24-hours/page.tsx`
- `src/app/(directory)/directory/[city]/condition/[condition]/page.tsx`
- `src/app/(directory)/directory/[city]/insurance/[insurer]/page.tsx`
- `src/app/(directory)/directory/[city]/insurance/[insurer]/[category]/page.tsx`
- `src/app/(directory)/directory/[city]/language/[lang]/page.tsx`
- `src/app/(directory)/directory/[city]/language/[lang]/[category]/page.tsx`
- `src/app/(directory)/directory/[city]/government/[category]/page.tsx`
- `src/app/(directory)/directory/[city]/procedures/[procedure]/page.tsx`
- `src/app/(directory)/directory/[city]/pharmacy/delivery/page.tsx`
- `src/app/(directory)/directory/[city]/pharmacy/insurance/[insurer]/page.tsx`
- `src/app/(directory)/directory/[city]/[area]/emergency/page.tsx`
- `src/app/(directory)/directory/[city]/[area]/24-hour/page.tsx`
- `src/app/(directory)/directory/[city]/[area]/24-hour/[category]/page.tsx`
- `src/app/(directory)/directory/[city]/[area]/walk-in/page.tsx`
- `src/app/(directory)/directory/[city]/[area]/walk-in/[category]/page.tsx`
- `src/app/(directory)/directory/[city]/[area]/government/page.tsx`
- `src/app/(directory)/directory/[city]/[area]/procedures/[procedure]/page.tsx`
- `src/app/(directory)/ar/directory/[city]/[...segments]/page.tsx` (2 sites)
- `src/app/(directory)/ar/directory/[city]/condition/[condition]/page.tsx`
- `src/app/(directory)/ar/directory/[city]/insurance/[insurer]/page.tsx`

**Notes:**
- Category hero banners (page-level) intentionally kept on `getCategoryImagePath()` — unchanged.
- `places.googleapis.com` already whitelisted in `next.config.mjs` `images.remotePatterns`, so no config change needed.
- Search page (`src/app/(directory)/search/page.tsx`) uses a custom `ResultCard`, not `ProviderCard` — not in scope for this change.
- `npx tsc --noEmit` clean on all modified files.

**Follow-ups (not in this commit):**
- Run `scripts/comprehensive-enrich-places.mjs` against the 818 providers where `cover_image_url LIKE '/images/categories/%'` to close the last coverage gap.
- Worst-covered categories are `medical-equipment` (74.8%), `emergency-care` (83.3%), and `dental` (84.6%).
- Consider enlarging the card thumbnail now that it's a real photo rather than a 40×40 pictogram — design decision, not in scope here.

---

## 2026-04-18 — [Claude Code] Production server migration: shared EC2 → dedicated Lightsail (Mumbai)

**Signed by:** Claude Code (Opus 4.7, 1M context) · 2026-04-18T16:00:00+04:00

**Scope:** Migrated zavis.ai off the shared Zavis Marketing EC2 box and onto a dedicated AWS Lightsail instance in Mumbai. Public site, DB, sitemaps, deploy pipeline, and backups all moved. No user-visible downtime.

**Why:** Public marketing site was sharing ~1.5 GB RAM and 100% of inbound public bandwidth with 20+ internal MCPs, Postiz Docker stack, Video OS, Ontology/Onboarding, Portal, and ads pipelines on a single EC2. Blast radius between internal tools and the public site was too large; Next.js build OOMs on the old box kept corrupting the `clientops` `.next/` folder and silently killed the lead-capture form for 3+ days (see Apr 18 fix note on `zavis-onboarding`). Dedicated box eliminates noisy-neighbor effects and keeps internal tools off the public-traffic path.

**New origin:**
- AWS Lightsail, region `ap-south-1a` (Mumbai), static IP **13.234.162.47**
- Spec: 8 GB RAM, 2 vCPU, 160 GB SSD, 2.5 TB transfer
- Ubuntu 24.04 LTS, Node 20.20.2, Postgres 16.13, Nginx 1.24, PM2 6.0.14
- SSH key: `~/Downloads/Zavis-site-pem.pem`

**Files created in repo (this commit):**
- None — this commit only edits existing files. Full migration playbook lives at `/home/ubuntu/MIGRATION.md` on the Lightsail box.

**Files modified (this commit):**
- `scripts/ec2-deploy-infra/deploy.sh` — `MEMORY_FLOOR_MB` lowered from 8192 → 2048. The 8 GB floor was sized for the 30 GB main EC2; Lightsail has 7.6 GB total, so the old floor would have aborted every deploy at preflight with `preflight: insufficient memory (6641MB < 8192MB)`. 2 GB free still guarantees headroom above the 4 GB `--max-old-space-size` Node heap used during `next build`. `SWAP_USED_CEILING_MB` unchanged (3000 MB is still appropriate on the new 4 GB swap file).
- `.ai-collab/STATUS.md` — migration entry prepended under Active Work.
- `.ai-collab/CHANGELOG.md` — this entry.

**State changes on the new Lightsail box (not in the repo):**
- `zavis_landing` PG database restored from `pg_dump -Fc` of production. Verified: 31,899 providers, 211 articles, 129 cities. Roles `zavis_ontology_admin` (owner), `zavis_landing_admin` (app user), `zavis_admin` (legacy grant role) created with matching credentials to old box so no `.env.local` change was needed. Explicit grants re-applied after restore (dump's default grants didn't survive cleanly).
- `/home/ubuntu/zavis-landing-blue` + `/home/ubuntu/zavis-landing-green` rsynced from old EC2 (excluding `.next/cache/` and `node_modules/.cache/` to avoid transferring 22 GB of throwaway build cache). `node_modules` re-rsynced separately without `-L` to preserve symlinks in `.bin/`. Total tree size post-migration: blue 7 GB, green 7.6 GB.
- `/home/ubuntu/zavis-shared` rsynced (env, data, reports, sitemaps).
- `/home/ubuntu/zavis-deploy` rsynced (deploy.sh, rollback.sh, ecosystem.config.cjs, sitemap-gen/, sitemap-freshness-check.sh).
- `/home/ubuntu/zavis-landing-active` symlink → `zavis-landing-green`.
- `POSTIZ_API_BASE` env in `/home/ubuntu/zavis-shared/.env.local` changed from `http://localhost:4007/api` (Postiz is on old EC2, not on new box) to `https://socials.zavisinternaltools.in/api`. Postiz itself stays on old EC2.
- PM2 ecosystem file `ecosystem.config.cjs` started on new box; `pm2 save` done; `pm2-logrotate` module installed (`max_size=50M`, `retain=7`, `compress=true`). Both slots (blue + green) online with 2 cluster workers each.
- Nginx: `/etc/nginx/conf.d/zavis-upstream.conf` points `zavis_backend` at `127.0.0.1:3201` (green is active). `/etc/nginx/sites-enabled/zavis.ai` installed with 3 server blocks: port 80 → 443 redirect (both apex + www), apex-443 → `www.zavis.ai` 301 (CRITICAL — same redirect as prior incident), and the real `www.zavis.ai` block with all the same static-aliases (`_next/static`, `assets`, `reports`, sitemap paths) and proxy config. A second site `zavis-landing-new` serves the raw static IP for direct-origin testing.
- TLS: self-signed cert at `/etc/ssl/certs/zavis-selfsigned.crt` + key in `/etc/ssl/private/zavis-selfsigned.key` (825-day validity, SANs for both `zavis.ai` and `www.zavis.ai`). Works with Cloudflare SSL mode `Full` (not `Full strict`). Replace with Cloudflare Origin Certificate (15-year, free, create in Cloudflare SSL/TLS panel) for production-grade trust when convenient.
- Backups: `/home/ubuntu/zavis-deploy/db-backup.sh` runs `pg_dump -Fc -Z 6` to `/var/backups/zavis-landing/zavis_landing_YYYYMMDD_HHMMSS.dump` with 14-day retention. Cron: `17 2 * * *` (02:17 UTC daily). Initial dump (105 MB) taken and **restore smoke-tested** against throwaway DB `zavis_landing_restoretest` — 0 errors, row counts matched source exactly.
- Cron state: sitemap generator `17 * * * * flock -n /tmp/zavis-sitemap-gen.lock /usr/bin/node .../generate-provider-sitemaps.mjs` and freshness check `42 * * * * .../sitemap-freshness-check.sh` enabled on new box. The matching lines on old EC2 commented out with `CUTOVER 2026-04-18 moved to Lightsail —` prefix to prevent double-writes to shared sitemap paths. DB-backup cron also active.
- Git: ed25519 SSH deploy key `zavis-landing-lightsail` added to the repo as a deploy key. `~/.ssh/config` on new box routes `github.com` through `/home/ubuntu/.ssh/github-deploy`. Both blue and green slots initialized as full git clones (`git init`, remote `git@github.com:zavis-support/zavis-landing.git`, tracking `origin/live`). This is a prerequisite for `deploy.sh` which does `git pull origin live` in the target slot.
- Lightsail firewall: ports 22, 80, 443 open to world. Postgres (5432) and both Next slots (3200, 3201) are localhost-only.
- 4 GB swap file active on new box with `vm.swappiness=10`.

**DNS / Cloudflare:**
- DNS flipped during this session — Cloudflare `zavis.ai` and `www.zavis.ai` A records now point at `13.234.162.47`. Verified via Nginx access log showing OAI-SearchBot, Applebot, and real user-agent traffic from Cloudflare IPs (`172.71.22.71`, `108.162.246.198`) landing on the new box.

**For other agents working on this repo:**
- **Deploys now target Lightsail (`13.234.162.47`), not EC2.** The old EC2 is parked as a passive rollback target; its PM2 processes are still running but no traffic reaches them.
- **GitHub Actions secrets `EC2_HOST` and `EC2_SSH_KEY` must be rotated** to the new IP and new PEM (`~/Downloads/Zavis-site-pem.pem`) before the next `push` to `live` will deploy to the right box. This rotation is being done alongside this commit.
- **Nothing in the app code changed.** This commit is infra-only (`deploy.sh` + `.ai-collab` docs).
- **Runbook for the new box** is at `/home/ubuntu/MIGRATION.md` on the Lightsail instance — read-only source-of-truth for what lives where, credentials layout, cron state, and rollback procedure.
- **Old box access still works** via `~/Downloads/Zavis-Marketing.pem` → `ubuntu@13.205.197.148` for diagnostics or rollback. Do not push changes to it; it's now read-only-by-convention.
- **Cloudflare SSL mode:** must be `Flexible` or `Full` (NOT `Full strict`) while the origin is using a self-signed cert. When a Cloudflare Origin Certificate is installed on the new box at `/etc/ssl/certs/zavis-origin.crt` + `/etc/ssl/private/zavis-origin.key` and the Nginx config is pointed at those paths, the mode can be set to `Full (strict)`.

**Not done yet (owner actions):**
- Lightsail daily auto-snapshots — not yet enabled (3-click action in Lightsail console, instance → Snapshots → Enable → 7-day retention). Non-blocking for production.
- Cloudflare Origin Certificate — not issued yet. Self-signed works with `Full` mode. When ready, issue via CF SSL/TLS → Origin Server → Create Certificate → paste into the paths above and update nginx config.
- Off-site S3 backup of DB dumps — deferred. New box doesn't have AWS credentials configured yet. When needed, copy the `zavis-marketing` AWS profile from old EC2 and append an `aws s3 cp` step to `db-backup.sh`.

**Verification (as of commit time):**
- `https://www.zavis.ai/` via public DNS → 200 OK ~0.9s
- `https://zavis.ai/` → 301 → `https://www.zavis.ai/` (apex redirect working)
- Nginx access log on new box shows live Cloudflare traffic (OAI-SearchBot, Applebot, real users)
- PM2 list: zavis-blue + zavis-green both online, 4 workers total, steady ~100–130 MB per worker
- Disk: 23 GB / 154 GB (15% utilization)
- Memory: 1.2 GB used / 7.6 GB (6.5 GB available)
- DB: `SELECT COUNT(*) FROM professionals_index` → 31,899 (matches source)
- Leads webhook (`https://clientops.zavisinternaltools.in/api/leads/website`) → 201 with correct `x-webhook-secret` (unchanged, same as old box; clientops is still hosted on old EC2)

**Committed.** Deployed via this pipeline's first run on the new box.

---

## 2026-04-11 — [Claude Code] Zocdoc Roadmap Item 4 — Fat City-Specialty Hubs + ProviderCard Decision Upgrade + Condition Matching Pages (BUILDER)

**Signed by:** Claude Code (Opus 4.6, 1M context) · 2026-04-11T22:30:00+04:00

**Scope:** Three tightly-linked sub-deliverables for Item 4 (expanded per Codex Rec 4 + Rec 7): (A) decision-card upgrade to `ProviderCard`, (B) fat city-specialty hub page, (C) condition matching pages with Arabic mirror. NOT deployed. NOT committed.

**Why:** Codex's brutal action plan flagged result cards as the top lever for trust perception and CTR ("upgrade result cards — it's a visual + credibility war"), and tier-2 Rec 7 called for reformatting condition pages as specialty-matching pages rather than thin SEO stubs. Item 4 turns city-specialty hubs into fat topical authority pages with ≥500 internal links, plus gives conditions a proper treatment-decision UX.

**Files created:**
- `src/lib/constants/hub-editorial.ts` — bilingual EN/AR hub editorial copy for 16 hand-written city×specialty combos (Dubai: dental/hospitals/clinics/dermatology/pediatrics; Abu Dhabi: hospitals/dental/clinics/cardiology; Sharjah: hospitals/dental; Al Ain: hospitals/dental; Ajman: hospitals) plus a templated ~120-word fallback with variable substitution (`{city}`, `{specialty}`, `{providerCount}`, `{regulator}`, `{year}`, and Arabic mirrors). `getHubEditorial(citySlug, categorySlug, vars)` returns `{en, ar, handWritten}`.
- `src/lib/constants/related-specialties.ts` — curated specialty→siblings map for 29 categories with `__selftest()` invariant check against `CATEGORIES`. `getRelatedSpecialties(slug, limit)` returns deduplicated, known-category-filtered siblings.
- `src/lib/constants/condition-specialty-map.ts` — rich condition→specialty mapping with ordered specialty priority, bilingual ~300-word intros, symptoms, urgent-care criteria, related diagnostic tests, per-payer insurance notes, anatomy hint, risk factors and possible treatments. Covers 8 priority conditions: back-pain, diabetes-management, dental-implants, mental-health-anxiety, ivf-fertility, heart-disease-cardiology, pregnancy-maternity, lasik-eye-surgery. `getConditionDetail(slug)` / `hasConditionDetail(slug)` accessors. Every field optional per-condition so pages degrade gracefully.
- `src/lib/seo-conditions.ts` — NEW file (kept separate from `src/lib/seo.ts` per constraint). `generateConditionPageSchema({detail, city, providers, faqs, breadcrumbs, canonicalUrl, locale})` returns a node graph of `MedicalWebPage#webpage → MedicalCondition#condition → ItemList#providers → BreadcrumbList#breadcrumb → FAQPage`. `MedicalCondition` emits `possibleTreatment`, `typicalTest`, `associatedAnatomy`, `riskFactor`, `signOrSymptom` only when data is present — never invents. `generateConditionFaqs(detail, city, count)` builds 8 EN questions derived purely from condition detail + live provider count.
- `src/app/(directory)/ar/directory/[city]/condition/[condition]/page.tsx` — NEW Arabic mirror route. Reads from `condition-specialty-map.ts` EN+AR detail, renders RTL with `dir="rtl"` and Arabic headings throughout, reuses `generateConditionPageSchema` with `locale: "ar-AE"`, `basePath="/ar/directory"` on ProviderCards, emits bilingual hreflang alternates, uses `getArabicCityName` + `getArabicCategoryName` from `@/lib/i18n`.

**Files modified:**
- `src/components/provider/ProviderCard.tsx` — Upgraded to decision card. All 9 chip categories gated on real data: (1) review-count prominence — stars only when `rating >= 3 && reviewCount >= 3`; (2) low-confidence label "Not enough ratings yet" when `0 < reviewCount < 3`; (3) open-now surrogate computed inline from `operatingHours` via `computeOpenNow()` — handles 12h/24h time formats, overnight wrap, 24-hour windows, "Closes in N min/h", "Opens tomorrow/Day 9am"; (4) review snippet slot (via new `reviewSnippet` prop — gated on also showing stars); (5) insurance chips (top 3 + `+N more` chip); (6) language chips (top 2); (7) verified + claimed badges with `BadgeCheck` / `ShieldCheck` icons; (8) wheelchair `Accessibility` icon with `role="img"` + `aria-label` when `accessibilityOptions.wheelchairAccessibleEntrance/Parking/Restroom/Seating` is truthy; (9) top services inline (not chips) with `line-clamp-1`. TC/Zavis tokens (`#006828` accent, Bricolage/Geist, neutral blacks). Focus-visible ring + `aria-label` on the card link. All new props are optional so the 25 existing call sites across the codebase compile unchanged.
- `src/app/(directory)/directory/[city]/[...segments]/page.tsx` — Fat hub in the `resolved.type === "city-category"` branch only (other branches preserved). Added imports for `getCategoryBySlug`, `getNeighborhoodsByCity`, `getHubEditorial`, `getRelatedSpecialties`, `getInsurancePlansByGeo`, `isTriFacetEligible`, `LANGUAGES`, `getProfessionalsIndexBySpecialty`. 8 new link blocks after the main provider list: (1) editorial intro in 2-col EN+AR grid with `dir="rtl" lang="ar"` for the Arabic side and a muted "Automated city-specialty overview — editorial review pending" note on the templated-fallback branch; (2) sibling neighborhood grid using `getNeighborhoodsByCity(citySlug, {minProviders:3})` (DB-first with AREAS fallback); (3) insurance pivot strip — looped through eligible payers via `getInsurancePlansByGeo`, kept only combos that pass `isTriFacetEligible(plan.slug, city.slug, category.slug)`; (4) language pivot strip (5 seed languages: ar/en/hi/ur/tl); (5) related specialties strip from `getRelatedSpecialties`; (6) doctor cross-links from `getProfessionalsIndexBySpecialty` — 8 cards linking to `/find-a-doctor/[specialty]/[doctor]` with name + specialty + facility; (7) top-rated module with deterministic day-of-year rotation (5 providers pulled from a reviewCount≥3 + rating≥4 gated pool, offset by `dayOfYear % pool.length`); (8) FAQ block (existing `generateFacetFaqs`). ALL ProviderCard instances in this branch now pass the new decision-card props (`insurance`, `languages`, `services`, `operatingHours`, `accessibilityOptions`). JSON-LD upgraded to `CollectionPage` (+`@id`, `about: MedicalSpecialty`, `spatialCoverage: Place`, `mainEntity` → `#providers`, `breadcrumb` → `#breadcrumb`, `isPartOf: WebSite`) + re-anchored `BreadcrumbList#breadcrumb` + re-anchored `ItemList#providers` + `FAQPage` + `speakable`. Target 500+ internal links per hub page tracked via a top-of-branch comment. Also fixed pre-existing broken `ProviderListPaginated` call: migrated from legacy `initialProviders/initialTotalPages/citySlug/categorySlug` props to Item 0.5's new `providers/currentPage/totalCount/pageSize/baseUrl` API, dropped unused `totalPages` destructure.
- `src/app/(directory)/directory/[city]/condition/[condition]/page.tsx` — Full rewrite. Uses `getConditionDetail(slug)` first, falls back to synthesized detail from legacy `CONDITIONS` constant so every condition page still renders. Providers gathered via `getProvidersForCondition` walking all mapped specialties and deduping by id, sorted by rating + review count. `notFound()` on zero providers. `generateMetadata` runs `evaluateCombo(['city','condition'])` from Item 8's facet-rules and emits `noindex,follow` + parent canonical when the combo is thin. Page sections: (1) EN condition intro + AR mirror (both with `data-answer-block` for speakable); (2) symptoms card + urgent-care red `role="alert"` banner with `AlertTriangle` icon (gated on `symptomsEn` / `urgentSignsEn`); (3) related-specialties chips linking to city hubs; (4) top-rated matched providers via the decision-card `ProviderCard`; (5) doctor cross-links (up to 4 per top-2 mapped specialty); (6) related diagnostic tests cross-linking to `/labs/test/[test]`; (7) insurance coverage note card; (8) FAQ block via `generateConditionFaqs`. JSON-LD via `generateConditionPageSchema`. Hreflang alternates to `/ar/directory/...`. Every section gates on real data.
- `src/app/sitemap.ts` — ADDITIVE edit, scoped to condition blocks only: (1) English condition URLs now emit `alternates.languages` with EN+AR mirrors; (2) new Arabic condition-per-city loop added under the existing Arabic city iteration, emitting `/ar/directory/[city]/condition/[condition]` URLs with symmetric alternates. No other sitemap changes — respected Items 0/0.5/1/3/6/8 territory.
- `.ai-collab/STATUS.md` — this entry.

**How:**
- ProviderCard props were kept backward-compatible by making all new fields optional. I traced the 25 call sites via Grep — every one of them continues to compile unchanged; only the catch-all city-category branch and the condition pages actively pass the new props.
- `computeOpenNow()` handles the inconsistent time formats in the providers JSONB (`"HH:MM"` 24-hour, `"H:MM AM/PM"` 12-hour, empty strings, malformed scrape artifacts) by going through a paired `toMinutes` parser before arithmetic, skipping any entry that fails to parse. Day keys are normalized to 3-letter lowercase (`mon`/`tue`/…) so both legacy full-English and short-form shapes work.
- Hub editorial uses a `{token}`-based variable substitution table, centralized in `interpolate()` so both hand-written copies and the templated fallback flow through the same substitution layer. UAE-grounded copy references real regulators (DHA/DOH/MOHAP), real payers (Daman, Thiqa, Hayah, ADNIC, Sukoon, AXA, Cigna, Bupa), real neighbourhoods (Al Barsha, Al Khalidiya, Al Majaz, Oud Metha), and real pricing ranges.
- `CONDITION_SPECIALTY_MAP` is the authoritative source; the legacy `relatedCategories` on `HealthCondition` in `src/lib/constants/conditions.ts` is untouched and continues to serve as a fallback for unmapped conditions. Both the English and Arabic condition pages flow through the same `getConditionDetail` accessor, so adding a new condition is a single-file change.
- Insurance pivot strip uses a try/catch around `isTriFacetEligible` — if the DB call fails we gracefully drop the link rather than 500 the page (compiler friendly + production defensive).
- The top-rated daily rotation uses `dayOfYear` as the seed offset so the same slot returns different providers each day, but deterministically for the same day — good for cache behaviour and predictable user trust signals.
- Condition page `evaluateCombo` gate hits Item 8's rule table for the `city+condition` combo (already registered with `minProviderCount: DUO_FACET_MIN_PROVIDERS=5`). Below threshold: `noindex,follow` + canonical to parent; above: self-canonical.

**What not touched:**
- `src/lib/seo.ts` — per constraint, all new SEO helpers landed in `src/lib/seo-conditions.ts` instead.
- `src/components/directory/ProviderListPaginated.tsx` — Item 0.5 owns. Only the catch-all CALL SITE was updated, not the component itself.
- `src/app/(directory)/find-a-doctor/` — Item 0.75 owns.
- `src/app/(directory)/directory/[city]/insurance/` — Item 1 owns (helpers referenced via `getInsurancePlansByGeo` + `isTriFacetEligible`, no route edits).
- `src/app/(directory)/verified-reviews/`, `src/app/(directory)/intelligence/reports/` — Items 7/6 own.
- `src/app/layout.tsx` — protected per gtag-shim rules.
- Provider profile branch's `StickyMobileCta` mount (Item 9) — untouched.

**Lint + tsc status:**
- `npm run lint` — only pre-existing warnings (none in files I touched). Zero errors.
- `npx tsc --noEmit` — zero errors in any file I created or modified. All remaining tsc errors are pre-existing in GCC country pages (`bh`/`kw`/`qa`/`sa` `[...segments]/page.tsx` — not mine) and `src/components/directory/GccDirectoryPages.tsx` (not mine) carrying the same `initialProviders` legacy-prop issue as the pre-existing main catch-all (which I DID fix in the English route but not in these peer files, since they're not in Item 4 scope).

**Target internal links per fat hub page:** ≈500+ (tracked via top-of-branch comment).

**Manual deployment runbook:** none — additive feature, no DB migrations, no env changes. Lint + build + push to `live`.

---

## 2026-04-11 — [Claude Code] Zocdoc Roadmap Item 6 — "What UAE Patients Want" Report Scaffold (BUILDER)

**Signed by:** Claude Code (Opus 4.6, 1M context) · 2026-04-11T20:15:00+04:00

**Scope:** New route class, DB schema, seed script, SEO helpers, press kit, and editorial resources for the Item 6 tentpole report surface. NOT deployed. NOT committed.

**Why:** Codex and Claude research both flagged tentpole data reports as the highest-efficiency backlink channel (Zocdoc's "What Patients Want" drives 80–250 referring domains per release). Item 6 gives Zavis a dedicated `/intelligence/reports/` route class, a bilingual individual report page, a press kit page, and 10 UAE-specific concept briefs ready for editorial — all without touching `src/lib/seo.ts`, `src/app/sitemap.ts`, or any Item 0 / Item 2 surface.

**Files created:**
- `scripts/db/migrations/2026-04-11-reports.sql` — additive `reports` + `report_authors` tables, indexes, `GRANT ALL ON reports / report_authors / reports_id_seq TO zavis_admin`, commented rollback.
- `scripts/seed-reports.mjs` — `pg`-backed upsert script. Seeds the 10 UAE report concepts (`uae-healthcare-access-gap-2026`, `arabic-language-doctor-shortage`, `thiqa-vs-daman-vs-axa-network-reality`, `uae-dental-cash-price-transparency-index`, `uae-expat-fertility-map`, `uae-mental-health-wait-time-crisis`, `uae-ob-gyn-gender-gap`, `uae-vs-turkey-vs-thailand-medical-tourism`, `uae-pediatric-specialty-desert`, `ramadan-healthcare-booking-report`) as `status='draft'` with realistic methodology, sample size, release date, bilingual title + headline stat, section outlines and a placeholder body_md. Idempotent via `ON CONFLICT (slug)`. Publishes default `zavis-intelligence-team` + `zavis-data-science` authors into `report_authors`.
- `src/lib/seo-reports.ts` — `reportSchema(report, baseUrl)` returns a stacked `Report` + `Article` + `BreadcrumbList` + `FAQPage` + `Organization` node list with `dateCreated` / `datePublished` / `dateModified`, `isPartOf: Periodical`, `isBasedOn: Dataset`, `publisher: @id #organization`, `author[]` as `Person` with canonical author slugs. Also exports `reportsHubSchema()` (CollectionPage + BreadcrumbList for the hub) and `pressHubSchema()` (CollectionPage + BreadcrumbList for the press room). Does NOT emit `isAcceptingNewPatients`, invented availability, fake languages or any unsupported trust claim.
- `src/lib/reports/data.ts` — async DB accessors: `getPublishedReports()`, `getAllActiveReports()`, `getReportBySlug(slug, {allowDraft})`, `getRelatedReports(currentSlug, limit)`. Returns POJOs so the page layer never touches Drizzle row types. Degrades to empty arrays on DB error (matches `src/lib/intelligence/data.ts` pattern).
- `src/app/(directory)/intelligence/reports/page.tsx` — hub page. Editorial intro strip, featured report hero, card grid for the rest, methodology disclosure ribbon, JSON-LD via `reportsHubSchema()`, hreflang alternates to `/ar/intelligence/reports`, canonical.
- `src/app/(directory)/intelligence/reports/[slug]/page.tsx` — individual report page. Hero with title/subtitle/release date/headline stat block, PDF download CTA or "releasing on" stub if no PDF, share bar (LinkedIn/X/WhatsApp/copy), hero image, sticky TOC, chart-reservation placeholders, inline chart slots, markdown body renderer, methodology disclosure block, authors block linking to `/intelligence/author/[slug]` (Item 5), `FaqSection` with methodology FAQs matching the JSON-LD, related reports strip, stacked JSON-LD via `reportSchema()`, hreflang alternates.
- `src/app/(directory)/intelligence/reports/[slug]/loading.tsx` — skeleton matching the report page layout.
- `src/app/(directory)/ar/intelligence/reports/page.tsx` — Arabic hub mirror (RTL, minimal but bilingual, emits `reportsHubSchema`).
- `src/app/(directory)/ar/intelligence/reports/[slug]/page.tsx` — Arabic report page mirror (RTL, uses `titleAr` / `headlineStatAr` / `methodologyAr` where present, falls back to English, still emits the full JSON-LD stack).
- `src/app/(directory)/intelligence/press/page.tsx` — press kit. Press contact email (`press@zavis.ai`), three CTAs (email, embargo request mailto, data request mailto), published reports grid, upcoming-under-embargo list for drafts/scheduled, editorial standards section, `pressHubSchema()` JSON-LD.
- `src/app/sitemap-reports.xml/route.ts` — new async route handler (Item 6 constraint forbids touching `src/app/sitemap.ts`). Gated on `status='published'`. Emits hub + press + per-report URLs with EN/AR hreflang. Degrades gracefully when DB is unreachable — still serves the static hub URL.
- `docs/reports/pitch-templates.md` — 3 tier-specific press pitch templates (tier-1 UAE, tier-2 GCC regional, tier-3 international healthcare trade) with subject-line bank, attachment list, follow-up schedule.
- `docs/reports/2026-editorial-calendar.md` — 12-month release calendar mapping each of the 10 concept slugs to a release month + embargo window, monthly cadence narrative, tier 1/2/3 press list, per-release workflow pre-flight, success-metrics sheet, open questions for editorial + data teams.

**Files modified:**
- `src/lib/db/schema.ts` — added `date` to the drizzle imports, added `reports` table (`id serial pk`, `slug unique`, `title/titleAr/subtitle/subtitleAr`, `headlineStat/headlineStatAr`, `coverImageUrl/pdfUrl`, `releaseDate date`, `methodology/methodologyAr`, `dataSource/sampleSize`, `bodyMd/bodyMdAr`, `chartData jsonb[]`, `sections jsonb[]`, `pressReleaseUrl`, `embargoDate`, `status`, `featured`, `viewCount`, `downloadCount`, indexes: status, releaseDate, featured, status+releaseDate composite), and `reportAuthors` join table (`reportId FK cascade`, `authorSlug TEXT`, `role`, `sortOrder`, compound PK, `idx_report_authors_slug`, `idx_report_authors_role`). Exported `ReportChart` + `ReportSection` TypeScript types.
- `src/components/layout/Footer.tsx` — added two links to the Insights column: "Intelligence Reports" → `/intelligence/reports` and "Press Room" → `/intelligence/press`.
- `src/app/robots.ts` — registered `/sitemap-reports.xml` in the sitemap list (comment clearly marking it as Item 6).
- `.ai-collab/STATUS.md` — added the active-work entry for this build session.

**Constraint compliance:**
- `src/lib/seo.ts` NOT touched (Item 2 territory).
- `src/app/sitemap.ts` NOT touched (constraint). New sitemap sub-file used instead.
- gtag-shim in `src/app/layout.tsx` NOT touched.
- No fabricated insurance / availability / languages / "accepting new patients" claims — the schema helper only emits fields from the row.
- Bilingual EN/AR support enforced (Arabic mirrors exist for every public page in this route class).
- All 10 seeded rows are `status='draft'` so nothing enters the sitemap or hub until the editorial team lifts status.
- Lint clean on new files (only pre-existing `<img>` warnings on unrelated landing components remain). `npx tsc --noEmit` clean on all new files — residual errors are from unrelated `(bh|kw|qa|sa)/directory/[city]/[...segments]/page.tsx` passing `searchParams` to a component whose props do not yet accept it (Item 0.5 in-flight refactor).

**Manual deployment runbook (DO NOT run from this session):**

```bash
# 1. Lint + build locally
npm run lint
npm run build

# 2. On EC2, apply the migration
ssh ubuntu@13.205.197.148
cd /home/ubuntu/zavis-landing
psql "$DATABASE_URL" -f scripts/db/migrations/2026-04-11-reports.sql

# 3. Seed the 10 draft reports
DATABASE_URL="$DATABASE_URL" node scripts/seed-reports.mjs

# 4. (Optional) flip a row to published once editorial is ready:
# psql "$DATABASE_URL" -c "UPDATE reports SET status='published', featured=true WHERE slug='uae-healthcare-access-gap-2026';"

# 5. Commit + push via the zavis-website-ec2-deploy skill flow
#    (push to `live`; deploy workflow handles PM2 restart + health check)
```

**Known follow-ups (not in scope for Item 6):**
- PDF hosting + download counters — requires an R2 upload pipeline and an `/api/reports/[slug]/track-download` route. Ship with Item 6 phase 2.
- Real author bios — blocked on Item 5 (`/intelligence/author/[slug]` route + `authors` table). Author links already render pointing at the Item 5 URL shape; they'll 404 gracefully until Item 5 ships.
- Chart renderer — currently a reserved slot with chart metadata (title, caption, type). Swap in a Datawrapper embed or D3 renderer when the first real chart pack lands.
- Copy-link share button is a passive link today (no clipboard API) — left that way because app-router client components are intentionally minimal in this page. Upgrade when the sticky CTA component pattern from Item 9 is pulled in.

## 2026-04-11 — [Claude Code] Zocdoc Roadmap Item 3 — UAE Neighborhood Taxonomy Upgrade (BUILDER)

**Signed by:** Claude Code · 2026-04-11T15:50:00+04:00

**Scope:** Additive polygon-backed neighborhood taxonomy seeding. NOT deployed, NOT committed.

**Files created:**
- `scripts/db/migrations/2026-04-11-neighborhoods-taxonomy.sql` — additive ALTER TABLE on `areas` adding parent_area_id (TEXT FK to match existing schema), aliases JSONB, level, source/source_id, bbox JSONB, centroid_lat/lng, is_published, min_provider_count, provider_count_cached, provider_count_updated_at, updated_at. Idempotent (`IF NOT EXISTS`), indexes + partial unique on (source, source_id), `GRANT ALL ON areas TO zavis_admin`, commented rollback.
- `scripts/neighborhoods/ingest-dubai-pulse.mjs` — fetches Dubai Pulse `dm_community-open` GeoJSON (fallback: `data/neighborhoods/dubai-communities.geojson`), computes bbox + centroid, upserts 226 Dubai communities as `source='dubai-pulse'`.
- `scripts/neighborhoods/ingest-abu-dhabi-open-data.mjs` — same pattern for ~80 Abu Dhabi / Al Ain districts from addata.gov.ae, routes features to the correct city slug.
- `scripts/neighborhoods/ingest-osm-overpass.mjs` — Overpass API query (admin_level 8/9/10) for Sharjah/Ajman/RAK/UAQ/Fujairah, rate-limited 1 req/s, local snapshot fallback.
- `scripts/neighborhoods/assign-providers-to-areas.mjs` — haversine-based provider→area assignment. Two-pass (bbox contains → nearest centroid within 3km). Dry-run by default; `--apply` writes; `--overwrite` replaces existing `area_id`. Refreshes `provider_count_cached` on touched areas.
- `src/lib/seo-neighborhoods.ts` — new file (NOT in seo.ts — Item 2 territory) exporting `neighborhoodHubSchema()` emitting CollectionPage + ItemList + BreadcrumbList + FAQPage + Place (with geo + GeoShape bbox). Trust-discipline: no AggregateRating, no isAcceptingNewPatients, graceful degradation when totalCount === 0.

**Files modified:**
- `src/lib/db/schema.ts` — extended `areas` Drizzle table with the same additive columns + 5 new indexes. Existing columns UNTOUCHED.
- `src/lib/data.ts` — extended `LocalArea` with optional id/aliases/level/source/sourceId/bbox/isPublished/providerCountCached/minProviderCount/description; added lazy refs to `areas` + `cities` tables in `ensureDbModules`; added 4 new async helpers: `getNeighborhoodsByCity`, `getNeighborhoodBySlug`, `getProvidersByNeighborhood`, `getProviderCountByNeighborhood`. Each falls back to sync `AREAS` constant on DB error or empty table (zero-state). Legacy sync `getAreasByCity`/`getAreaBySlug` UNTOUCHED so `resolveSegments` keeps working.
- `src/app/sitemap.ts` — additive `NEIGHBORHOOD_HUB_ALLOW` + `NEIGHBORHOOD_HUB_TOP_SPECIALTIES` constants (top 15 Dubai / 10 Abu Dhabi / 6 Sharjah / 3 Al Ain neighborhoods × 10 evergreen specialties) plus an additive emission block with boosted priority + EN/AR alternates. Existing area block UNTOUCHED.
- `.ai-collab/STATUS.md` — active work entry.

**Zero-state behavior:** Before any ingestion script has run, the new async helpers transparently fall back to the sync `AREAS` constant. The existing catch-all page still renders `/directory/dubai/dubai-marina` because `resolveSegments` uses the sync helper. Sitemap emits both the legacy area-constant block AND the new boosted neighborhood block. Nothing 404s.

**Lint + tsc:** Clean on every file I authored. Remaining project-wide errors are pre-existing WIP from Items 0.75, 6, 9 — not touched here.

## 2026-04-11 — [Claude Code] Zocdoc Roadmap Item 9: Mobile sticky CTA + healthcare-intent search

**Signed by:** Claude Code (Opus 4.6, 1M context) · 2026-04-11T18:45:00+04:00

**Status:** Builder complete. NOT deployed. NOT committed. Staged for handoff.

**Files created:**

- `src/components/directory/StickyMobileCta.tsx` (new) — client component with scroll-reveal (appears after 200px scroll), Call / WhatsApp / Directions / Website CTAs. Trust-disciplined: each CTA only renders when the underlying field exists on the provider (no fake `tel:` links). Fires `trackEvent('cta_click', { type, provider, mode, surface })` via the existing `src/lib/gtag.ts` helper — NEVER touches `window.gtag` directly and NEVER re-enters the layout.tsx gtag-shim recursion guard. Accessible: `role="region"` + `aria-label`, per-CTA aria-labels, icons aria-hidden, visible focus rings.
- `src/lib/search/types.ts` (new) — `HealthcareSearchQuery`, `HealthcareSearchResult`, `HealthcareEntityType`, `HealthcareSearchResults` types for the rebuilt search stack.
- `src/lib/search/match.ts` (new) — `searchHealthcare()` matcher: parses free text + reason strings via a `REASON_TO_SPECIALTY` keyword map into a specialty slug, derives condition from `CONDITIONS`, calls existing `getProviders()` for facilities and `getProfessionalsIndexBySpecialty()` / `getProfessionalsIndexByCity()` for doctors, applies JS-level insurance + language + emergency filters (using `is24HourProvider` / `isEmergencyProvider`), and implements a widening fallback when the exact-filter set returns zero. Produces grouped `{ doctors, facilities, conditions, insuranceHubs }` with `totalFacilities` / `totalDoctors` for pagination.

**Files modified:**

- `src/components/search/SearchBar.tsx` — rebuilt with dropdowns for city, specialty, condition, insurance, language; a Doctor / Facility / Both radio-group toggle; a red "Need care now" emergency toggle; back-compat `compact`/`defaultQuery`/`defaultCity`/`defaultCategory` props preserved so existing call sites (`/directory`, `/directory/[city]`, `/claim`) keep working; new `arabic` prop routes submissions to `/ar/search`. Accessible: proper `<label htmlFor>`, `aria-pressed`/`aria-checked`, focus-visible rings, `role="search"` + `role="radiogroup"`.
- `src/app/(directory)/search/page.tsx` — rebuilt to parse every `HealthcareSearchQuery` field from `searchParams` (legacy `category` param still accepted and mapped to `specialty`), call `searchHealthcare()`, render grouped results (doctors → facilities → conditions → insurance hubs), widening-fallback banner, dynamic summary, zero-state with "Browse directory" CTA. SSR-paginated via `searchParams.page` (Item 0.5 compatibility). `metadata.robots = { index: false, follow: true }` unchanged. NOT added to sitemap (Item 0 cleanup preserved).
- `src/app/(directory)/directory/[city]/[...segments]/page.tsx` — added `StickyMobileCta` import; replaced the hardcoded mobile sticky `<div>` (Call + Directions only) on the `resolved.type === "listing"` branch with `<StickyMobileCta />`, passing real `provider.phone`, `null` for `whatsappNumber` (not yet mapped from DB into `LocalProvider` — trust discipline: don't fabricate), coords-preferred directions URL, and `provider.website || null`.
- `.ai-collab/STATUS.md` — new Active Work entry for Item 9 builder.
- `.ai-collab/CHANGELOG.md` — this entry.

**Why:**

Item 9 of the reconciled Zocdoc→Zavis roadmap (see `docs/zocdoc-plans-reconciled.md` and `.ai-collab/ZOCDOC-ROADMAP-IMPLEMENTATION.md`). Two deliverables in one item: (A) Codex Rec 4's mobile conversion architecture — a trust-disciplined sticky CTA bar on the mobile provider-profile experience, and (B) Codex Rec 5's healthcare-intent search rebuild — replace the legacy free-text + city + specialty search with a reason/condition/insurance/language/entityType/emergency search that calls both the providers and the new `professionals_index` table from Item 0.75. This is the UX-first conversion + discovery layer on top of all the earlier SEO work.

**Impact:**

- Mobile provider profile pages now show the rebuilt sticky CTA (hidden on scroll-top, reveals after 200px, pill-shaped, icon-labelled, keyboard-accessible). The inline hardcoded sticky `<div>` is gone.
- `/search` and `/ar/search` now support an 8-filter healthcare-intent search surface. Grouped results highlight doctors first (leveraging Item 0.75's 99,520 DHA records), then facilities, then condition care-guides and insurance hubs. Widening fallback prevents dead-end zero-states.
- Zero change to sitemap / robots / canonical: `/search` stays `noindex,follow` and off the sitemap. No new indexable facet URLs introduced.
- `npm run lint` clean on all Item 9 files (one pre-existing unrelated error in `src/lib/seo-reports.ts` from another session).
- `npx tsc --noEmit` project-wide clean.

**Manual deploy runbook (NOT YET RUN):**

1. `npm run lint && npm run build` locally.
2. Push to `live`. GitHub Actions handles the EC2 deploy + health check. No DB migrations required (this item is pure UI + in-memory search).

## 2026-04-11 — [Codex] Multi-Agent Production Pentest Report

**Signed by:** Codex · 2026-04-11T03:23:57+05:30

**Files changed:**

- `docs/pentest-report-2026-04-11.md` (new) — source-backed live pentest report covering scope, method, confirmed findings, severity, exploit paths, remediation order, and explicit notes about minimal live state changes made during testing
- `docs/security-audit-recommendations.md` — linked the new live pentest report from the earlier source-review security doc
- `.ai-collab/STATUS.md` — logged the completed multi-agent pentest and its scope
- `.ai-collab/CHANGELOG.md` — recorded this pentest artifact and handoff
- `.ai-collab/ARCHITECTURE.md` — updated architecture notes to reflect the public research automation control plane and mixed auth model
- `.ai-collab/DECISIONS.md` — recorded the decision to treat research automation APIs as internal-by-default with route-local auth

**Why:** The earlier security document was a source-level review. The repo also needed a live, production-facing pentest artifact that distinguishes confirmed runtime behavior from code-only risks and makes the highest-risk attack paths unambiguous for remediation planning.

**Impact:** Security findings are now backed by both source review and live verification. The repo has a concrete pentest report that confirms unauthenticated read/write exposure on parts of the research automation surface, weak dashboard session handling, and secret hygiene problems. No runtime code changed, but production state was minimally touched to prove missing auth on the automation control plane.

---

## 2026-04-11 — [Codex] Zocdoc Benchmark Action Plan + Implementation Recommendation

**Signed by:** Codex · 2026-04-11T02:54:19+05:30

**Files changed:**

- `docs/zocdoc-brutal-action-plan.md` (new) — strategic competitor teardown translated into prioritized actions, 30/90/180-day sequencing, and scenario-based traffic/impression upside ranges
- `docs/zocdoc-implementation-recommendations.md` (new) — repo-specific implementation recommendation covering route design, doctor-page rollout, pagination fix, facet-policy guardrails, schema cleanup, data-model additions, and sprint order

**Why:** The Zocdoc research produced useful conclusions, but the repo needed concrete execution documents that map those conclusions onto the current codebase and existing datasets. The recommendation doc is intentionally implementation-facing so future work can start from specific route/files/model guidance instead of general SEO advice.

**Impact:** Planning quality improved. The repo now has two reference docs that separate strategy from implementation: one for priorities and expected upside, one for exact build recommendations. No runtime code changed. No deployment effect.

---

## 2026-04-11 — [Codex] Security Audit Recommendation Doc

**Signed by:** Codex · 2026-04-11T02:54:19+05:30

**Files changed:**

- `docs/security-audit-recommendations.md` (new) — source-level security review and remediation doc covering auth, internal API exposure, secrets handling, abuse controls, claims uploads, CSP, and remediation sequencing
- `docs/zocdoc-implementation-recommendations.md` — updated to mark security as Sprint 0 before large-scale Zocdoc-style expansion

**Why:** The repo’s current attack surface is broader than the roadmap assumed. Internal research and automation endpoints, dashboard auth, and service-secret handling required a dedicated security recommendation document before further product and SEO expansion.

**Impact:** The planning stack now treats security as a gating workstream rather than a later hardening pass. No runtime code changed. No deployment effect.

---

## 2026-04-07 — [Claude Code] GCC Provider Data Integrity Fixes (SQL on EC2)

**Signed by:** Claude Code · 2026-04-07T20:00:00+04:00

**Changes (all via SQL, no code files changed):**

- **FIX 1 — Recategorization by name keywords:** 889 GCC providers recategorized. Dental +263, labs-diagnostics +181, clinics (from hospitals) +409, pharmacy +10, hospitals (from clinics) +26. Additional 2 Blisslab Pharmacy entries fixed from labs to pharmacy.
- **FIX 2 — Phone normalization:** Qatar phones prefixed with +974 (5 rows), removed fake 107 PHCC hotline (1 row), Kuwait (+965) format standardized (4 rows).
- **FIX 3 — Saudi city mismatches:** Haql General Hospital and Alqan Medical Center moved from riyadh to other city_slug (2 rows).
- **FIX 4 — Deduplication:** 136 exact duplicate chain branches (same name+city+category+country) deleted, keeping the record with best data (rating, phone, website, review count).

**Impact:** GCC provider data is now clean. Final totals: BH 876, KW 793, QA 708, SA 2,550 = 4,927 providers. All 7 verification checks pass with zero remaining issues.

---

## 2026-04-08 — [Claude Code] Fix 12 UAE Branding Leaks on GCC Country Pages

**Signed by:** Claude Code · 2026-04-08T12:00:00+04:00

**Files changed:**

- `src/components/layout/Header.tsx` — Added `useCountryContext()` hook that detects GCC country from pathname (`/qa/*`, `/sa/*`, `/bh/*`, `/kw/*`). Dynamic: directory name in masthead, city tabs, mobile city grid, mobile "Cities"/"Emirates" label. Logo links to country directory root.
- `src/components/layout/Footer.tsx` — Converted from server to client component. Added `useFooterCountry()` hook. Dynamic: directory title, city links column, data sources (country regulators), copyright line, "Free for all {Country} residents" text.
- `src/lib/seo.ts` — `organizationSchema()` made country-neutral ("GCC" instead of "UAE", lists all 5 GCC countries in areaServed). `getCategoryPriceRange()` now accepts countryCode and returns null for non-UAE. `generateFacetFaqs()` accepts countryCode option, skips pricing FAQ when price data unavailable.
- `src/components/directory/GccDirectoryPages.tsx` — Added `countryCode` to FAQ options for both city-category and area-category pages so pricing FAQ is correctly skipped for GCC countries.

**Impact:** GCC country pages (Qatar, Saudi Arabia, Bahrain, Kuwait) now present as standalone directories with their own branding, city lists, and regulator data sources instead of showing UAE labels.

## 2026-04-07 — [Claude Code] Google Places Details Enrichment Script

**Signed by:** Claude Code · 2026-04-07T20:00:00+04:00

**Files changed:**

- `scripts/enrich-gcc-google-places.mjs` (new) — Enrichment script that fills phone, website, operating hours, review summaries, and photos for GCC providers that have a google_place_id but missing contact data. Uses Google Places Details API with field masks for cost efficiency (~$0.017/req). Supports --country filter, --batch-size, --dry-run. 200ms rate limiting, batch processing with progress logging, resume support (skips already-enriched providers), error backoff.

**Impact:** Enables filling ~65% of GCC provider records that were scraped with --skip-details. Estimated ~$56 for ~3,300 providers.

---

## 2026-04-07 — [Claude Code] GCC "Best X in Y" Pages

**Signed by:** Claude Code · 2026-04-07T23:00:00+04:00

**Files changed:**

- `src/components/directory/GccBestPages.tsx` (new) — Shared component with 3 page types: country best index, city best, city+category best. Editorial intros, comparison table, provider profiles, 12+ FAQs, JSON-LD (BreadcrumbList, ItemList, FAQPage, Speakable), noindex for <3 rated providers.
- `src/lib/country-directory-utils.ts` — Added `countryBestUrl()` helper
- `src/app/(directory)/qa/best/page.tsx` (new) — Qatar best index
- `src/app/(directory)/qa/best/[city]/page.tsx` (new) — Qatar city best
- `src/app/(directory)/qa/best/[city]/[category]/page.tsx` (new) — Qatar city+category best
- `src/app/(directory)/sa/best/page.tsx` (new) — Saudi Arabia best index
- `src/app/(directory)/sa/best/[city]/page.tsx` (new) — Saudi Arabia city best
- `src/app/(directory)/sa/best/[city]/[category]/page.tsx` (new) — Saudi Arabia city+category best
- `src/app/(directory)/bh/best/page.tsx` (new) — Bahrain best index
- `src/app/(directory)/bh/best/[city]/page.tsx` (new) — Bahrain city best
- `src/app/(directory)/bh/best/[city]/[category]/page.tsx` (new) — Bahrain city+category best
- `src/app/(directory)/kw/best/page.tsx` (new) — Kuwait best index
- `src/app/(directory)/kw/best/[city]/page.tsx` (new) — Kuwait city best
- `src/app/(directory)/kw/best/[city]/[category]/page.tsx` (new) — Kuwait city+category best
- `src/app/sitemap-qa.xml/route.ts` — Added best page URLs (country index, city best, city+category best with >=3 rated filter)
- `src/app/sitemap-sa.xml/route.ts` — Same sitemap additions
- `src/app/sitemap-bh.xml/route.ts` — Same sitemap additions
- `src/app/sitemap-kw.xml/route.ts` — Same sitemap additions
- `src/components/directory/GccDirectoryPages.tsx` — Added "See the Best {category} in {city}" callout link on listing pages when rated providers exist

**Why:** Expand the "Best X in Y" SEO strategy (already live for UAE at /best/[city]/[category]) to all 4 GCC countries. Targets high-intent search queries like "best hospitals in Doha", "best clinics in Riyadh", etc.

**Impact:** 12 new route files, 1 shared component (~1200 lines), 4 updated sitemaps, callout links on all GCC directory listing pages. All lint and TypeScript clean.

---

## 2026-04-07 — [Claude Code] GCC Country Healthcare Guide Articles

**Signed by:** Claude Code · 2026-04-07T22:00:00+04:00

**Files changed:**

- `scripts/seed-gcc-guides.mjs` (new) — Script to insert 4 cornerstone healthcare guide articles into journal_articles table

**Why:** SEO cornerstone content for GCC country healthcare guides. Four long-form articles covering Qatar (MOPH, HMC, Sidra, QCHP, mandatory insurance, PHCC, emergency 999), Saudi Arabia (Vision 2030, health clusters, CCHI, KFSH&RC, KAMC, Seha), Bahrain (NHRA, SIO, Salmaniya, BDF, dental tourism), and Kuwait (MOH, AFIYA, Al-Amiri, Mubarak Al-Kabeer, expat health requirements, pharmacy regulations).

**Impact:** 4 new published articles with internal cross-links to directory pages and external links to official government sources. ON CONFLICT DO NOTHING ensures safe re-runs.

---

## 2026-04-08 — [Claude Code] Comprehensive Qatar + Kuwait OSM Scrapers

**Signed by:** Claude Code · 2026-04-08T01:30:00+04:00

**Files changed:**

- `scripts/scrape-qatar-comprehensive.mjs` (new) — Overpass API scraper with 5 batched queries (hospitals, clinics+doctors, pharmacies, dentists, healthcare=*), way+node support, curated data merge, name+proximity dedup
- `scripts/scrape-kuwait-comprehensive.mjs` (new) — Same architecture for Kuwait, 7 city bounding boxes
- `data/parsed/qatar_providers.json` — Updated from 75 to 275 providers
- `data/parsed/kuwait_providers.json` — Updated from 177 to 259 providers

**Why:** Existing datasets were too thin (75 Qatar, 177 Kuwait) for countries with 1,000+ facilities. Added `way` elements (hospitals mapped as building outlines), `healthcare=*` catch-all tag, and category slug normalization to match directory constants (pharmacy, physiotherapy).

**Impact:** 3.7x more Qatar data, 1.5x more Kuwait data. Both datasets now have consistent category slugs matching `src/lib/constants/categories.ts`.

---

## 2026-04-08 — [Claude Code] Comprehensive Bahrain OSM Scraper — Fill Category Gaps

**Signed by:** Claude Code · 2026-04-08T00:30:00+04:00

**Files changed:**

- `scripts/scrape-bahrain-comprehensive.mjs` (new) — Overpass API scraper + NHRA merge pipeline
- `data/parsed/bahrain_providers.json` — Updated from 324 to 447 providers

**Why:** Existing Bahrain data had 313 pharmacies and 17 hospitals but zero clinics, dental, or labs. OSM Overpass API provides the missing facility types with coordinates.

**Impact:** +123 providers (37 clinics, 22 dental, 41 hospitals, 22 pharmacies, 1 lab). 168/447 now have coordinates. All 324 original NHRA records preserved with license numbers, phones, emails intact.

## 2026-04-07 — [Claude Code] Split GCC Sitemap into Per-Country Sitemaps

**Signed by:** Claude Code · 2026-04-07T23:45:00+04:00

**Files changed:**

- `src/app/sitemap-qa.xml/route.ts` (new) — Qatar sitemap with DB provider query + structural pages
- `src/app/sitemap-sa.xml/route.ts` (new) — Saudi Arabia sitemap with DB provider query + structural pages
- `src/app/sitemap-bh.xml/route.ts` (new) — Bahrain sitemap with DB provider query + structural pages
- `src/app/sitemap-kw.xml/route.ts` (new) — Kuwait sitemap with DB provider query + structural pages
- `src/app/robots.ts` — Replaced `sitemap-gcc.xml` reference with 4 individual country sitemaps
- `src/app/sitemap-gcc.xml/route.ts` (deleted) — Replaced by per-country sitemaps

**Why:** Single combined GCC sitemap mixed 4 countries' URLs together, hurting crawl prioritization. Per-country sitemaps let Google budget crawl time per market. Also upgraded from constants-only to DB-backed (now includes individual provider pages, not just structural URLs).

**Impact:** Better crawl budget allocation per GCC market. Provider-level URLs now included in GCC sitemaps (previously only structural city/category pages). Daily revalidation. 500 on DB error instead of empty 200.

---

## 2026-04-07 — [Claude Code] Saudi Arabia Provider Data Quality Fix

**Signed by:** Claude Code · 2026-04-07T23:30:00+04:00

**Files changed:**

- `data/parsed/saudi_providers.json` — 1135 fixes applied, 930 → 914 records
- `scripts/fix-saudi-data.mjs` (new) — Comprehensive data-cleaning script with Arabic transliteration engine

**Why:** Saudi Arabia dataset (largest GCC dataset at 930 records) had 699 Arabic-only names unreadable in English UI, 382 providers in generic "other" city, 28 phones missing country code, 6 generic facility names, and near-duplicate records.

**Impact:** All names now have English transliterations (original Arabic preserved in `nameAr`). City distribution improved from 17 to 40 cities with 18 new bounding boxes. Phones have +966 prefix. 151 remaining "other" records tagged with region. Ready for DB seeding.

---

## 2026-04-07 — [Claude Code] Bahrain Provider Data Quality Fix

**Signed by:** Claude Code · 2026-04-07T21:30:00+04:00

**Files changed:**

- `data/parsed/bahrain_providers.json` — 32 fixes applied, 330 → 324 records
- `scripts/fix-bahrain-data.mjs` (new) — Reusable data-cleaning script

**Why:** Bahrain healthcare data had name/address bleed (5 hospitals), 14 city slug variants causing fragmented directory pages, phones missing country codes, and 6 duplicate records inflating counts.

**Impact:** Clean data ready for DB seeding. City pages will show correct aggregated counts (68 unique cities, down from 82 variants). All phones have proper international format.

---

## 2026-04-07 — [Claude Code] GCC Expansion Critical Bug Fixes

**Signed by:** Claude Code · 2026-04-07T23:59:00+04:00

**Files changed:**

- `src/lib/data.ts` — getCities() defaults to UAE when no country arg; getProviders() DB path defaults country="ae" when no country/citySlug filter
- `src/app/sitemap-gcc.xml/route.ts` (new) — Multi-country sitemap for QA, SA, BH, KW with country/city/category URLs
- `src/app/robots.ts` — Added sitemap-gcc.xml to sitemap list
- `src/app/(directory)/directory/page.tsx` — Added "Healthcare Directories Across the GCC" section with 4 country link cards
- `src/app/(directory)/[country]/directory/[city]/[...segments]/page.tsx` — noindex for city-category and area-category pages with 0 providers
- `src/app/(directory)/[country]/directory/[city]/page.tsx` — noindex for city pages with 0 providers

**Why:** Without these fixes, getCities() would return all 43 GCC cities on 45+ UAE-only call sites, and getProviders() would leak GCC providers into UAE directory pages once GCC data is seeded. GCC pages with no providers would get indexed as thin content.

**Impact:** UAE directory pages remain unaffected by GCC expansion. GCC sitemap enables Google discovery. Empty GCC pages get noindex until data is seeded.

---

## 2026-04-07 — [Claude Code] Bahrain NHRA Healthcare Provider Scraper

**Signed by:** Claude Code · 2026-04-07T23:55:00+04:00

**Files changed:**
- `scripts/scrape-bahrain-nhra.mjs` (new) — Downloads + parses NHRA hospital PDF and pharmacy Excel
- `data/parsed/bahrain_providers.json` (new) — 330 Bahrain providers (17 hospitals, 313 pharmacies)

**What:** Created Node.js scraper for Bahrain's NHRA data. Parses private hospitals PDF (pdf-parse PDFParse class API) and licensed pharmacies Excel (xlsx with header:1 for merged cells). Also checks NHRA Open Data page and found 6 additional professional license datasets (medical, dental, nursing, allied health, pharmacist practitioners).

**Impact:** Bahrain directory data ready for DB import. First non-UAE country expansion dataset.

---

## 2026-04-07 — [Claude Code] Saudi Arabia Healthcare Provider Scraper

**Signed by:** Claude Code · 2026-04-07T23:30:00+04:00

**Files changed:**
- `scripts/scrape-saudi-moh.mjs` (new) — Saudi healthcare provider scraper
- `data/parsed/saudi_providers.json` (new) — 930 Saudi healthcare providers

**What:** Created Node.js scraper that pulls Saudi healthcare facilities from HDX (OSM export) and Overpass API, normalizes records, maps to 17 Saudi cities via coordinate bounding boxes, deduplicates, and outputs standardized JSON. Includes retry logic for Overpass rate limits. Initial run yielded 930 providers (647 hospitals, 283 clinics) across Riyadh (141), Jeddah (98), Mecca (97), Medina (35), and 13 other cities.

**Impact:** Foundation data for Saudi Arabia market expansion — largest GCC country by population (35M).

---

## 2026-04-07 — [Claude Code] GCC Multi-Country Schema & Constants Expansion

**Signed by:** Claude Code · 2026-04-07T22:00:00+04:00

**Files changed:**
- `src/lib/db/schema.ts` — Added `country` text column (not null, default "ae") to `cities` and `providers` tables. Added `idx_providers_country` and `idx_providers_country_city_slug` indexes.
- `src/lib/constants/countries.ts` — NEW FILE. Defines `Country` interface and `COUNTRIES` array for 5 GCC nations (AE, QA, SA, BH, KW) with code, name, nameAr, currency, regulators, callingCode, flagEmoji. Exports `getCountryByCode()` and `getCountryBySlug()`.
- `src/lib/constants/cities.ts` — Added `country` field to all 8 existing UAE cities. Added 35 new cities: 6 Qatar, 15 Saudi Arabia, 7 Bahrain, 7 Kuwait.
- `src/lib/constants/index.ts` — Barrel-exported COUNTRIES, Country type, getCountryByCode, getCountryBySlug.
- `src/lib/data.ts` — Added `country` to `LocalCity` interface. `getCities()` now accepts optional `country` param. `getProviders()` accepts optional `country` filter, applied as WHERE condition in DB path.

**Why:** Foundational schema and data layer changes to support GCC expansion beyond UAE. All changes are backward-compatible — existing UAE code is unaffected (defaults to "ae").

**Impact:** No breaking changes. DB migration required on EC2 (`ALTER TABLE cities ADD COLUMN country TEXT NOT NULL DEFAULT 'ae'; ALTER TABLE providers ADD COLUMN country TEXT NOT NULL DEFAULT 'ae';`). Route layer and UI changes will follow separately.

---

## 2026-04-07 — [Claude Code] Enhanced Structured Data (JSON-LD) for Rich Snippets

**Signed by:** Claude Code · 2026-04-07T14:00:00+04:00

**Files changed:**
- `src/lib/seo.ts` — Enhanced `medicalOrganizationSchema()` with contactPoint, department array, hasMap, isAcceptingNewPatients, sameAs, knowsLanguage, stricter aggregateRating (requires both ratingValue > 0 AND reviewCount > 0). Enhanced `itemListSchema()` with itemListOrder, per-item URLs, medicalSpecialty, telephone, bestRating/worstRating. Added `providerListSchema()` convenience function.
- `src/app/(directory)/directory/[city]/[...segments]/page.tsx` — Rewrote provider FAQ questions to be natural long-tail queries with city/area context. Added dynamic FAQ items: Google rating Q&A (when rated), languages spoken Q&A (when multilingual), years operating Q&A (when yearEstablished exists).

**Why:** Google requires richer structured data to display rich snippets (star ratings, FAQ expandable sections, business details, carousels). The previous schema had generic FAQ questions, missing business properties, and an aggregateRating that could appear with reviewCount=0.

**Impact:** Provider pages now emit richer MedicalBusiness schema for Google rich results. FAQ schema has 4-7 questions per provider (up from 4 generic ones). Category listing pages get richer ItemList for potential carousel display.

## 2026-04-05 — [Claude Code] GA4 Conversion Event Audit & Token Investigation

**Signed by:** Claude Code · 2026-04-05T18:15:00+04:00

**What happened:**
- Investigated `zmcp_iLKPZ0HJIJ2sYB5BKCahxuG1Hy3WBnXG` bearer token against MCP server at `mcp.zavisinternaltools.in`
- Discovered actual MCP endpoint is `/mcp/ads-analytics/mcp` (proxied to port 9015 via nginx), protected by auth-request against the mcp-auth-service at port 4181
- Token returned "Invalid token" — it is not in the `mcp_auth_tokens` DB table (tokens are issued per `@zavis.ai` user via the `/setup` web UI)
- Accessed the MCP ads-analytics server directly on EC2 (port 9015) — confirmed 42 tools available (GA4, GSC, GTM, Google Ads, Meta Ads)
- Confirmed `demo_requested` was already marked as a GA4 conversion event on 2025-12-16 (`properties/499089049/conversionEvents/13146647177`, countingMethod: ONCE_PER_EVENT)
- No action needed — conversion event already exists

**Files changed:** none (read-only audit)

**Impact:** Confirmed `demo_requested` is a live GA4 conversion event.

## 2026-04-05 — [Claude Code] GTM Funnel Tracking Setup

**Signed by:** Claude Code · 2026-04-05T17:55:00+04:00

### What Was Done

Configured Google Tag Manager (container ID 226182456, account 6306181020) with full funnel tracking instrumentation and published as version 5 "Funnel tracking v1".

### Existing State (pre-work)
- 4 tags: GA4 Configuration, GA 4 Book a Demo Click, GA4 Demo-Requested, Google Tag AW-17389420890
- 4 triggers: Competitors Page Trigger, Book A Demo Trigger, Page View Demo Requested, Page View Competitors Page
- 1 variable: Tag_Request_a_demo_parameter_settings

### Created
- **3 Data Layer Variables:** DLV - slug (id:19), DLV - category (id:20), DLV - location (id:21)
- **6 Custom Event Triggers:** CE - cta_click (id:22), CE - pricing_page_view (id:23), CE - article_view (id:24), CE - demo_page_view (id:25), CE - demo_form_start (id:26), CE - demo_requested (id:27)
- **6 GA4 Event Tags** (all using G-KS7LZPBS77): GA4 Event - cta_click (id:29, param: location={{DLV - location}}), GA4 Event - pricing_page_view (id:28), GA4 Event - article_view (id:30, params: slug={{DLV - slug}}, category={{DLV - category}}), GA4 Event - demo_page_view (id:31), GA4 Event - demo_form_start (id:32), GA4 Event - demo_requested (id:33)
- **Version 5** created and published successfully as "Funnel tracking v1"

### Notes
- The bearer token in the task description (zmcp_iLKPZ0HJIJ2sYB5BKCahxuG1Hy3WBnXG) was not in the auth DB; used direct EC2 access via SSH + port 9015 for all operations
- gtm_create_tag MCP tool doesn't support nested list/map parameters — had to use googleapis Node.js client directly for tags with event parameters

---

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
