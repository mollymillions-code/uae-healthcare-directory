# Insurance SEO Strategy — Implementation Plan (v2)

**Goal:** Capture high-intent insurance × clinic search traffic without programmatic-spam risk. Reuse existing infrastructure where possible. Ship in measurable phases.

**Anti-goal:** Generate 375K low-quality "Does {clinic} accept {insurer}?" pages.

> **v2 changelog:** revised after stress-test by Plan agent. Fixes incorrect schema.org claims, removes duplicate FAQ proposal, conforms to existing `FACET_RULES` allow-list, integrates with the existing `getSitemapEligibility` helper, accounts for AR-mirror parity gaps, and adds proper deindexing strategy. See § "Stress-test fixes applied" at end.

---

## Current state (verified, reused)

| Already shipped | Path | Status |
|---|---|---|
| Insurance hub | `/insurance` | ✓ |
| Per-insurer page | `/insurance/[insurer]` | ✓ |
| Insurance guide | `/insurance/guide/[slug]` | ✓ (38 insurers) |
| Insurance compare | `/insurance/compare/[matchup]` | ✓ |
| City × insurer | `/directory/[city]/insurance/[insurer]` | ✓ |
| City × insurer × category (tri-facet) | `/directory/[city]/insurance/[insurer]/[category]` | ✓ |
| Tri-facet allow-lists (`TRI_FACET_INSURER_ALLOW`, `TRI_FACET_CATEGORY_ALLOW`) | `src/lib/seo/facet-rules.ts` | ✓ — **6 insurers × 8 categories** today |
| Centralized facet rules | `src/lib/seo/facet-rules.ts` (`FACET_RULES`, `evaluateCombo`) | ✓ |
| Sitemap eligibility precompute | `src/app/sitemap.ts:199` (`getSitemapEligibility`) | ✓ — already builds `cityInsurance` Set |
| Insurer-aware provider queries | `getProvidersByInsurance`, `getProviderCountByInsuranceCategory` in `src/lib/data.ts` | ✓ |
| Provider page insurance section | `ProviderDetailTemplate.tsx:320` | ✓ |
| Provider page FAQ — insurance Q | `[...segments]/page.tsx:1372 + 1424` | ✓ "Which insurance plans does X accept?" — **already linked to insurer pages** |
| Provider page AEO answer block | `[...segments]/page.tsx:~1363` | ✓ — already mentions "Insurance accepted." |
| Per-provider schema with `paymentAccepted` | `src/lib/seo.ts:328` | ✓ |

The strategy is **enhancement of existing pages** plus **one new editorial route shape** (Top-N by insurance × city × category) and **a small editorial layer** (~10 new listicle slugs under existing `/insurance/guide/[slug]`).

---

## Phase 1 — Provider page (the workhorse, 12,500 pages benefit)

### 1.1 Schema — keep `paymentAccepted`, document the convention

**File:** `src/lib/seo.ts:328`

**Change:** **No code change.** The earlier draft proposed swapping to `MedicalBusiness > healthPlanNetworkId`. **That's wrong:**

- `healthPlanNetworkId` is defined on `HealthPlanFormulary` / `HealthInsurancePlan`, not on `MedicalBusiness`. Emitting it on `MedicalBusiness` is a schema.org violation.
- There is no `acceptedInsurance` property on `MedicalBusiness`.
- Healthgrades, Zocdoc, Vitals all use `paymentAccepted` — this is the de-facto convention Google parses, even though it's technically a payment-method field.

**Action:** Add a code comment near `src/lib/seo.ts:328` documenting why we use `paymentAccepted` and not a more "correct" property. Prevents future engineers from "fixing" it.

**Risk:** None.

### 1.2 Add ONE FAQ entry — the yes/no question

**File:** `src/app/(directory)/directory/[city]/[...segments]/page.tsx` (the `listing` branch around line 1424)

**Existing FAQ already has** (verified, line 1424):
```
Q: Which insurance plans does {provider.name} accept?
A: {provider.name} accepts the following insurance plans: <a>Daman</a>, <a>AXA</a>, ...
```

**Don't duplicate this.** Instead, add **one** new entry for the yes/no variant (different query intent — "does X accept insurance" vs "what insurance does X accept"):

```typescript
{
  question: `Does ${provider.name} accept insurance?`,
  answer: provider.insurance.length > 0
    ? `Yes. ${provider.name} accepts ${provider.insurance.length} insurance plan${provider.insurance.length === 1 ? "" : "s"}, including ${provider.insurance.slice(0, 3).join(", ")}${provider.insurance.length > 3 ? ` and ${provider.insurance.length - 3} more` : ""}. See the full list and confirm coverage with the clinic before your visit.`
    : `${provider.name} has not yet confirmed accepted insurance plans on the UAE Open Healthcare Directory. Contact the clinic directly to ask about your specific insurance.`,
},
```

**Defensive check:** verify `provider.insurance` is `[]` not `undefined` for all rows — `getProviders` line 441 already does `insurance: row.insurance ?? []`. Safe.

**Risk:** Low. Duplicate-FAQ check via Rich Results Test before deploy required.

### 1.3 Insurance section sidebar — measure first, build later

The earlier draft proposed a sticky sidebar card. **Defer until we have data.**

Reasons:
- BookingCard already lives in the right rail (per the recent newspaper redesign).
- StickyMobileCta is already mounted on listing pages.
- Adding a 4th card without measurement may push insurance below the fold and add no lift.

**Action:** Add a tracking event (`insurance_section_viewed` via IntersectionObserver) to the existing insurance section at `ProviderDetailTemplate.tsx:320`. Measure scroll-depth-to-section over 30 days. Decide on sidebar promotion based on data.

**Risk:** None. Pure measurement.

### 1.4 AEO answer block — augment, don't duplicate

The existing answer block at `[...segments]/page.tsx:~1363` already says "Insurance accepted." when `provider.insurance.length > 0`. The earlier draft proposed adding a verbose block on top — that's redundant.

**Change:** Enrich the existing inline string with the count:

```typescript
// Before:
${provider.insurance.length > 0 ? "Insurance accepted." : ""}

// After:
${provider.insurance.length > 0 ? `Accepts ${provider.insurance.length} insurance plan${provider.insurance.length === 1 ? "" : "s"} including ${provider.insurance.slice(0, 2).join(" and ")}.` : ""}
```

The `<div className="answer-block">` and `speakableSchema` infrastructure is already wired. No new schema/markup.

**Risk:** Trivial. One-line edit. Won't break the answer block — same `${...}` pattern.

### 1.5 AR mirror — explicit FAQ infrastructure addition

The earlier draft assumed AR catch-all has the same FAQ infrastructure. **It doesn't:**
- AR `[...segments]/page.tsx` listing branch has the `answerBlock` (line ~538) but NO FAQ array.
- No `FaqSection` component on AR listing pages.
- No `faqPageSchema` import in the listing branch.

**Action:** Adding FAQ to AR is a NEW feature, not a mirror. Scope:

1. Create `arabicProviderFaqs` array in AR listing branch (mirror EN structure).
2. Translate the 1 new EN FAQ entry to Arabic.
3. Wire `<FaqSection faqs={arabicProviderFaqs}>` + `<JsonLd data={faqPageSchema(arabicProviderFaqs)} />`.
4. Add RTL test for the FaqSection component (verify it accepts `dir="rtl"` or wrap in `<div dir="rtl">`).

**Effort:** 4–6 hours, not "low risk content only" as v1 implied.

**Risk:** Medium — first FAQ on AR listing pages. Verify `FaqSection` renders correctly RTL.

### 1.6 Phase 1 deployment gate

Before merging Phase 1:
1. Run Rich Results Test against 3 representative provider URLs:
   - One with insurance (e.g., Bella Rose)
   - One without insurance
   - One with `provider.insurance = []` from a freshly seeded record
2. Confirm `FAQPage` schema validates and shows in preview.
3. Confirm no `paymentAccepted` errors.
4. Verify duplicate-FAQ check passes.

---

## Phase 2 — Top-N by insurance × city × category (NEW route)

Pattern: **"Top {N} {category} in {city} accepting {insurer}"**

### 2.1 Route

**New:** `src/app/(directory)/best/[city]/[category]/accepting/[insurer]/page.tsx`
**AR mirror:** `src/app/(directory)/ar/best/[city]/[category]/accepting/[insurer]/page.tsx`

URL examples:
- `/best/dubai/dental/accepting/daman-enhanced`
- `/best/abu-dhabi/cardiology/accepting/thiqa`

### 2.2 URL shape decision

**Picked:** `/best/{city}/{category}/accepting/{insurer}` (not `/directory/{city}/insurance/{insurer}/{category}/best`).

Why:
- The `/best/*` namespace already has editorial intent — `getCategoryIntro()` per-category copy fits "Top N accepting Y" voice.
- Keeps each URL at ≤ 3 facet dimensions (city + category + insurer-as-filter) — respects the codebase's "max 3 facets per indexable URL" discipline at `facet-rules.ts:41`.
- `/directory/.../insurance/...` is a filter view (show me all). `/best/.../accepting/...` is decision support (recommend top-N). Distinct intent → distinct URLs is fine SEO.

### 2.3 Eligibility — extend the existing allow-list math

The codebase has a 6 × 8 allow-list, NOT 10 × 25. Recompute:

- **6 insurers** in `TRI_FACET_INSURER_ALLOW`: thiqa, daman-enhanced, daman-basic, hayah, adnic, oman-insurance
- **8 categories** in `TRI_FACET_CATEGORY_ALLOW`
- **~5 cities** with sufficient density: dubai, abu-dhabi, sharjah, al-ain, ajman
- **Eligibility filter**: `isTriFacetEligible()` already enforces:
  - ≥ `TRI_FACET_MIN_PROVIDERS` (8 today) match the (city, category, insurer) combo
  - Insurer's `geoScope` covers the city

Theoretical max: 6 × 8 × 5 = **240 pages**. Real eligibility rate ~40–60% → **~100–150 actual indexable pages**.

If we want more, that's an **explicit decision** to expand the allow-lists with editorial copy backing — not a free side-effect of the new route.

### 2.4 Add a new entry to `FACET_RULES`

**File:** `src/lib/seo/facet-rules.ts`

The new URL shape doesn't exist in `FACET_RULES`. Without an entry, `evaluateCombo` returns `unknown_combo` → page auto-noindexes silently.

**Action:** Add a rule:
```typescript
{
  combo: ["city", "specialty", "insurance"],
  pageVariant: "best-accepting",
  urlPattern: "/best/{city}/{specialty}/accepting/{insurance}",
  // ... mirror the existing tri-facet rule's gates
}
```

Coordinate with whoever owns `facet-rules.ts` (per AI-collab STATUS.md). This may overlap with Item 8 from the Zocdoc roadmap — verify before adding.

### 2.5 Page structure

Reuse `/directory/{city}/insurance/{insurer}/{category}` data fetching. Editorial framing differs:

- H1: "Top {n} {category} in {city} accepting {insurer.name}"
- Editorial intro from `getCategoryIntro()` + insurer-specific paragraph from `editorial-copy.ts`
- Top-N list (sorted by `googleRating` desc, then review count desc, then verified, then alphabetical) — 20 max
- Comparison block: "How {insurer} coverage works at {city} {category} clinics"
- FAQ block — **NEW helper** (NOT `generateFacetFaqs`, which has no insurer parameter):

```typescript
// New helper in src/lib/seo.ts
export function generateBestAcceptingFaqs(
  city: City,
  category: Category,
  insurer: InsurancePlan,
  providerCount: number,
  topProvider?: LocalProvider,
): FaqItem[] { ... }
```

Schema: `BreadcrumbList`, `ItemList` (the top-N), `MedicalBusiness` per card, `FAQPage`.

### 2.6 Pagination policy

Top-N capped at 20. If a (city, category, insurer) combo has > 20 eligible providers, **don't paginate** — readers don't search for "page 2 of best dental Dubai accepting Daman." Add a "View all 47 providers" link to `/directory/{city}/insurance/{insurer}/{category}` (the filter aggregator) for the long tail.

This avoids `?page=N` URL bloat and keeps each Phase 2 page singular and curated.

### 2.7 generateStaticParams strategy

**Don't pre-render at build.** Verified: `PREBUILD_STATIC_ROUTES` is referenced in 10+ routes but **never set** in `deploy.sh`, GHA, or env files. So existing `generateStaticParams` returns `[]` and routes are pure ISR.

**Use the same pattern:**

```typescript
export const revalidate = 86400; // 24h
export const dynamicParams = true;

export async function generateStaticParams() {
  if (process.env.PREBUILD_STATIC_ROUTES !== "1") return [];
  const eligible = await getEligibleBestAcceptingCombos();
  return eligible.map(({ city, category, insurer }) => ({ city, category, insurer }));
}
```

This means:
- **Build time impact:** ~zero. No new pages prerendered.
- **Memory at build:** ~zero.
- **First request latency per page:** 2–4s cold, then cached for 24h.
- **Cron warmer:** optional but recommended to preheat top-50 combos for Googlebot.

This is a deliberate trade-off — slower first hit vs no build-time risk to OOM.

### 2.8 Runtime eligibility gate

In the page handler:

```typescript
const eligible = await isTriFacetEligible(insurer.slug, city.slug, category.slug);
if (!eligible) notFound();
```

Same predicate as Phase 2's sitemap inclusion (§4.1) — ensures sitemap and page render agree.

### 2.9 Internal linking ordering caveat

Phase 5 adds links *to* Phase 2 pages. **Phase 5 must deploy AFTER Phase 2.** If Phase 2 is rolled back, Phase 5 must roll back first or its links 404.

Document this dependency explicitly in the rollout sequencing.

---

## Phase 3 — Insurance feature listicles (10 hand-curated pages)

Editorial pages targeting feature-based queries.

### 3.1 Verified location

The earlier draft said guide content lives in `src/lib/constants/insurance.ts`. **Wrong.** It lives inline in `src/app/(directory)/insurance/guide/[slug]/page.tsx` (the `GUIDES` array). Match the existing pattern.

### 3.2 New slugs (collision-checked)

**Existing slugs in `GUIDES`** (verified): `maternity-insurance-uae`, `freelancer-health-insurance`, et al.

**New slugs (no collisions):**
- `walk-in-clinic-insurance` — UAE clinics that accept walk-in patients across major plans
- `direct-billing-insurance-uae` — Insurance plans with widest direct-billing
- `same-day-claims-insurance` — Fastest claim turnaround at UAE clinics
- `dental-insurance-uae-2026` — Best dental insurance for UAE expats
- `chronic-disease-coverage-uae` — UAE plans covering chronic disease management
- `outpatient-vs-inpatient-uae` — Outpatient vs inpatient coverage comparison
- `expat-vs-resident-insurance` — Expat-only vs resident plans
- `top-up-insurance-uae` — Top-up insurance over Daman/Thiqa
- `mandatory-health-insurance-emirates` — Mandatory coverage rules per emirate
- `insurance-claim-process-uae` — How to file an insurance claim at UAE clinics

If `dental-insurance-uae-2026` topically collides with `maternity-insurance-uae` editorially, defer to the existing-content owner.

### 3.3 Implementation

Append to the inline `GUIDES` array in `src/app/(directory)/insurance/guide/[slug]/page.tsx`:

- 800–1500 words editorial each
- Comparison table (insurer × feature matrix)
- 3–5 internal links to `/insurance/[insurer]`
- 2–3 internal links to `/best/[city]/[category]/accepting/[insurer]` (Phase 2)

### 3.4 AR mirror

Same slugs added to AR guide route. Translation pass.

**Risk:** Low. Content addition. No infrastructure change.

---

## Phase 4 — Sitemap + indexability

### 4.1 Extend `getSitemapEligibility`

**File:** `src/app/sitemap.ts:199`

The function already builds `cityInsurance: Set<string>`. Add a `bestAcceptingCombos: Set<string>` set computed alongside, scoped by:

- `(city.slug, category.slug, insurer.slug)` triplets
- Filtered through `TRI_FACET_INSURER_ALLOW`, `TRI_FACET_CATEGORY_ALLOW`, and `isTriFacetEligible`
- Same DB cost as the existing `cityInsurance` precompute (one extra dimension)

Append to the sitemap output:
```typescript
for (const combo of eligibility.bestAcceptingCombos) {
  urls.push({
    url: `${base}/best/${city}/${category}/accepting/${insurer}`,
    priority: 0.7,
    changeFrequency: "weekly",
    lastModified: lastDataRefresh,
  });
}
```

### 4.2 Sync with offline sitemap generator

`scripts/generate-provider-sitemaps.mjs` is the post-deploy XML generator. Per `sitemap-gating.ts`, the two sitemap layers MUST stay in sync. **Action:** mirror the new combo logic in the offline generator. Same file, same predicate, two emitters.

### 4.3 Robots / canonical

- Phase 2 pages: `<link rel="canonical" href="{base}/best/{city}/{category}/accepting/{insurer}">`
- If `isTriFacetEligible()` returns false at request time → page emits `<meta robots="noindex,follow">` (don't 404; allow internal links to flow). Same pattern as the existing tri-facet aggregator.

### 4.4 hreflang

Bidirectional EN ↔ AR:
- EN: `<link rel="alternate" hreflang="ar-AE" href="{base}/ar/best/{city}/{category}/accepting/{insurer}">`
- AR: `<link rel="alternate" hreflang="en-AE" href="{base}/best/{city}/{category}/accepting/{insurer}">`
- Plus self `hreflang="x-default"` on EN.

### 4.5 Deindexing playbook (for rollback)

If we roll back Phase 2 AFTER pages are indexed, just deleting the route gives a 404. Google deindexes 404s slowly (4–8 weeks). Better:

1. **Convert the route to emit HTTP 410 Gone** for the deprecated URLs (Google deindexes 410 within days, not weeks).
2. **Drop URLs from sitemap** in the same deploy.
3. **Submit the affected URLs to GSC URL Removal Tool** for any high-value cases (manual; ~1000/day cap).
4. **Keep the 410 handler for ≥ 60 days** before fully deleting.

Document this as `docs/playbooks/deindex-runbook.md`.

---

## Phase 5 — Internal linking + breadcrumbs (deploys AFTER Phase 2)

### 5.1 Provider page → insurance pages

Already wired (verified at `ProviderDetailTemplate.tsx:328`). No change.

### 5.2 Insurer page → top-N (Phase 2)

On `/insurance/[insurer]`, add a section: **"Top clinics by city accepting {insurer}"**. Use `evaluateCombo` (NOT a stale Set) to gate each link:

```typescript
const links = candidates.flatMap(({ city, category }) => {
  const eval = evaluateCombo({ city, category, insurer, pageVariant: "best-accepting" });
  return eval.indexable ? [{ city, category, url: ... }] : [];
});
```

This way, if eligibility flips between sitemap regeneration cycles, links auto-disappear instead of 404'ing.

### 5.3 City hub → insurer top-N

On `/directory/[city]`, surface a "Browse by insurance" strip with eligible insurers for that city. Each chip → `/best/{city}/clinics/accepting/{insurer}` (default to `clinics` since broadest).

### 5.4 Breadcrumbs

- Phase 2: `Home > Directory > {City} > Best {Category} > Accepting {Insurer}`
- Phase 3: `Home > Insurance > Guide > {Topic}`

Both use `breadcrumbSchema()`.

### 5.5 Sibling-link strip

On `/best/{city}/{category}` (existing), add an "Filter by insurance" strip → eligible Phase 2 URLs.

### 5.6 Eligibility-aware link rendering helper

Create a small helper:

```typescript
// src/lib/seo/eligible-links.ts
export function bestAcceptingLink(opts: {
  city: string; category: string; insurer: string;
}): string | null {
  const eval = evaluateCombo({ ...opts, pageVariant: "best-accepting" });
  return eval.indexable ? `/best/${opts.city}/${opts.category}/accepting/${opts.insurer}` : null;
}
```

All Phase 5 link emitters use this. Returns `null` → component skips rendering. No 404'ing internal links possible.

---

## Phase 6 — Measurement

### 6.1 Tracking events

Already have `recordConsumerEvent` for clicks. Add:
- `insurance_section_viewed` (provider page sidebar visible — Phase 1.3 instrumentation)
- `insurance_faq_expanded` (FAQ accordion opened)
- `best_accepting_page_viewed` (Phase 2 page hit)
- `insurance_chip_clicked` (provider page → insurer page)

### 6.2 PDPL / consent check

Verify `recordConsumerEvent` is gated on consent (per `src/lib/consumer-intent-client.ts`). If not, gate it. Insurance-page interaction is a sensitive intent signal.

### 6.3 GA4 dimensions

Register as custom dimensions:
- `insurance_plan` (insurer slug)
- `provider_id`
- `city_slug`
- `category_slug`

### 6.4 GSC dimensions

After 30 days, slice GSC traffic by:
- Page (Phase 2 URL)
- Query (CTR per "Best {category} {city} accepting {insurer}")
- Country (UAE expat traffic concentration)

### 6.5 Editorial freshness alerts

`INSURANCE_DATA_VERIFIED_AT` constant in `src/lib/insurance-facets/data.ts:89` is updated manually monthly. Add a build-time warning if it's > 60 days stale (block deploy if > 90 days). Phase 2 multiplies the cost of editorial drift across ~150 new pages.

### 6.6 Success criteria (60-day post-launch)

- Phase 1: +5–10% CTR on provider pages from organic
- Phase 2: 30–50% indexed by Google within 60 days; ≥10% with ≥1 GSC click
- Phase 3: ≥3 of 10 listicles ranking top-10 for primary target query
- No site-wide quality demotion (monitor `/directory/*` average position week over week)

---

## Rollout sequencing

1. **Week 1**: Phase 1.1 (schema doc-comment) + 1.2 (one new FAQ) + 1.4 (answer block enrichment). EN only. Run Rich Results Test against 3 representative providers before merge. Low risk.
2. **Week 2**: Phase 1.5 (AR FAQ infrastructure — NEW feature). Includes RTL component test.
3. **Week 3**: Phase 1.3 measurement (IntersectionObserver), Phase 6.1 tracking events.
4. **Week 4**: Phase 4.1 (extend `getSitemapEligibility`). Dry-run logging only — count how many pages would emit. **Do NOT add new URLs to the sitemap yet.**
5. **Week 5**: Phase 2 (Top-N route). Build the route + new helper + `FACET_RULES` entry. Stage via cloudflared tunnel before promote. Verify with eligibility dry-run from Week 4. Add new URLs to sitemap in same deploy.
6. **Week 6**: Phase 5 (internal linking, eligibility-gated). Must deploy AFTER Phase 2.
7. **Week 7+**: Phase 3 listicles, 1–2 per day, hand-written or LLM-drafted with editorial review.

Each phase independently deployable. Phase 5 has hard dependency on Phase 2.

---

## Risks to existing pages

| Risk | Mitigation |
|---|---|
| `seo.ts` edits break JSON-LD on 12,500+ pages | Phase 1.1 is now a comment-only change. No risk. |
| FAQ array mutation breaks listing pages | Phase 1.2 adds ONE entry. `provider.insurance ?? []` defensive shape verified at `getProviders` line 441. Tested via Rich Results Test before deploy. |
| Phase 2 sitemap query cost | One extra dimension on existing precompute. Same DB query shape as `cityInsurance` set. |
| Internal link 404s if Phase 2 reverted alone | Phase 5 must deploy after Phase 2; rollback order is documented. `evaluateCombo`-gated link rendering ensures dynamic eligibility safety. |
| AR mirror parity | Phase 1.5 is explicitly scoped as a NEW feature with 4–6h effort, not a 5-min mirror. |

---

## Coordination with existing roadmap

Per AI-collab STATUS.md, there's active work on insurance pages (Items 1, 4, 8 from the Zocdoc roadmap). This plan extends those. Specifically:

- **Item 8**: Centralized facet rules. Phase 2.4 adds a new `FACET_RULES` entry. Coordinate with Item 8 owner before merging.
- **Item 4**: Tri-facet pages. Phase 2 routes are siblings, not replacements. The tri-facet route stays as-is.
- **Item 1**: Insurance hub. Phase 2 adds new sibling-link strips on `/insurance/[insurer]`. Coordinate.

Update `.ai-collab/STATUS.md` with a Phase 1–6 ownership entry before starting.

---

## Why NOT per-clinic × per-insurance permutation pages

Math: 12,500 providers × ~30 insurers = ~375,000 pages.

| Risk | Detail |
|---|---|
| Helpful Content System penalty | Google's March 2024 update demotes "scaled, low-value programmatic content." 375K thin yes/no pages match the pattern. |
| Doorway pages policy | Google explicitly targets "pages created to rank for similar search queries" differing only by 1 word. |
| Site-wide quality dilution | Average page quality drags `/directory/*` namespace down. |
| Crawl budget | Wastes Googlebot time on low-value URLs; new high-value pages take longer to be discovered. |
| Soft 404s | Empty combos render thin "no" pages → flagged in GSC. |

What major players actually do:
- **Zocdoc**: insurance section on provider page, no per-clinic-per-insurer URLs.
- **Healthgrades**: same.
- **Vitals**: same.
- **Doctolib (EU)**: same.

Phase 1 (provider page) + Phase 2 (Top-N) gives the long-tail traffic without platform risk.

---

## Stress-test fixes applied (v1 → v2)

1. ✅ Dropped invalid `MedicalBusiness > healthPlanNetworkId` claim. Kept `paymentAccepted`. Documented why.
2. ✅ Reduced FAQ proposal from 2 entries to 1 (existing FAQ already covers "what plans"; added yes/no variant).
3. ✅ Acknowledged AR FAQ infrastructure doesn't exist; scoped as NEW feature with 4–6h effort.
4. ✅ Recomputed page count using actual 6×8 allow-list → ~100–150 pages, not 600–900.
5. ✅ Added `FACET_RULES` entry for new URL shape (without it, `evaluateCombo` returns `unknown_combo` and pages auto-noindex silently).
6. ✅ Integrated with existing `getSitemapEligibility` precompute, not a hand-wavy "append to sitemap.ts."
7. ✅ Removed false build-time-impact claim (PREBUILD_STATIC_ROUTES is never set in CI; new pages are ISR not SSG).
8. ✅ Internal-link rendering via `evaluateCombo` not stale Set — auto-noindex on eligibility flip.
9. ✅ Added explicit deindexing strategy (HTTP 410 Gone, GSC URL Removal).
10. ✅ Updated guide-route file location (inline `GUIDES` array, not `constants/insurance.ts`).
11. ✅ Slug collision check applied (renamed conflicting slugs).
12. ✅ Defer Phase 1.3 sticky sidebar — measure first via IntersectionObserver, decide based on data.
13. ✅ AEO answer block — augment existing inline string, don't add a duplicate block.
14. ✅ Pagination policy: cap at 20, no `?page=N` URLs.
15. ✅ Editorial freshness alert added (Phase 6.5).
16. ✅ Coordination with existing roadmap items 1/4/8 documented.

---

## Decisions captured

1. **Allow-list expansion: YES.** Expand to ~12 insurers × ~12 categories × 5 cities → estimated **250–400 indexable pages** post-eligibility. Each new entry to `TRI_FACET_INSURER_ALLOW` requires a corresponding editorial-copy entry in `src/lib/insurance-facets/editorial-copy.ts` (network tier, geo scope, copay range, plan quirks).

   Concretely, expand from current 6 → 12 insurers by adding: AXA Gulf, Cigna, MetLife, Allianz Care, Bupa Global, Aetna International (already common in `provider.insurance` arrays). Expand from 8 → 12 categories by adding the next-most-searched: dermatology, ophthalmology, ent, orthopedics. Final eligibility math runs at build time via `isTriFacetEligible`.

2. **Phase 3 authorship: Editorial team.** I'll deliver content briefs (target query, intended outcome, structure outline, internal-link targets, schema requirements) for each of the 10 listicle slugs. The editorial team writes the prose. I review for SEO/internal-link compliance before merge.

3. **AR FAQ translation: Claude CLI + Sonnet 4.6.** I'll prepare prompt files (one per FAQ entry) with Arabic style guide constraints:
   - Formal Modern Standard Arabic (MSA), healthcare register
   - RTL-safe phrasing (no LTR-dependent constructions)
   - Use established UAE health-authority terminology (DHA = هيئة الصحة بدبي, etc.)
   - No transliteration of insurer names — use registered Arabic names from `src/lib/insurance-facets/editorial-copy.ts` `nameAr` field

   Editorial team runs the prompts via `claude --model sonnet-4-6` and pastes results into the AR FAQ array.

4. **`FACET_RULES` ownership: no human owner.** Edit `src/lib/seo/facet-rules.ts` directly. Before each touch, check `.ai-collab/STATUS.md` for active concurrent work to avoid merge conflicts.
