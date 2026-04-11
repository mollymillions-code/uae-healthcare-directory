# Zavis Facet Indexing Audit — 2026-04-11

**Author:** Claude Code (Builder for Zocdoc Roadmap Item 8)
**Related:** `src/lib/seo/facet-rules.ts`, `docs/zocdoc-plans-reconciled.md`, `docs/zocdoc-implementation-recommendations.md`

This document maps every indexable or filter-state URL combination in the Zavis codebase as of 2026-04-11 against the centralized allow-list in `src/lib/seo/facet-rules.ts`. It is the first consolidated picture of what Zavis currently tells Google to crawl vs. what it tells Google to noindex.

---

## 1. Routes in the codebase (current state)

Enumerated from `src/app/(directory)/directory/**/page.tsx`. Arabic mirrors are implicit (every route below is duplicated under `src/app/(directory)/ar/...` unless otherwise noted).

| Route pattern | Abstract combo | Indexable today | Where gated |
|---|---|---|---|
| `/directory` | — (hub) | yes | static page |
| `/directory/[city]` | `city` | yes | static enumerate |
| `/directory/[city]/[...segments]` (catch-all) | `city+category`, `city+area`, `city+area+category` | yes (page 1 only for deep pagination) | `resolveSegments()` in catch-all |
| `/directory/[city]/condition/[condition]` | `city+condition` | yes | `CONDITIONS` allowlist |
| `/directory/[city]/condition` | `condition` hub (within city) | yes | static |
| `/directory/[city]/language/[lang]` | `city+language` | yes | `LANGUAGES` allowlist |
| `/directory/[city]/language/[lang]/[category]` | `city+language+specialty` | yes (no runtime gate) | — (gap — see §4) |
| `/directory/[city]/language` | `language` hub (within city) | yes | static |
| `/directory/[city]/insurance` | `insurance` hub (within city) | yes | static |
| `/directory/[city]/insurance/[insurer]` | `city+insurance` | **gated** (geo + `DUO_FACET_MIN_PROVIDERS`) | `generateMetadata` via `isDuoFacetEligible` / `getInsurancePlansByGeo` |
| `/directory/[city]/insurance/[insurer]/[category]` | `city+specialty+insurance` | **gated** (geo + allow-list + `TRI_FACET_MIN_PROVIDERS`) | `isTriFacetEligible` |
| `/directory/[city]/procedures/[procedure]` | `city+procedure` | yes | `PROCEDURES` allowlist |
| `/directory/[city]/procedures` | `procedure` hub (within city) | yes | static |
| `/directory/[city]/top/[category]` | `city+specialty` (ranked view) | yes | canonical to `city+specialty` |
| `/directory/[city]/top` | `city` (ranked view) | yes | canonical to `city` |
| `/directory/[city]/24-hour/[category]` | `city+specialty+attribute(24h)` | yes | attribute filter, not truly a combo |
| `/directory/[city]/walk-in/[category]` | `city+specialty+attribute(walkin)` | yes | attribute filter |
| `/directory/[city]/emergency` | `city+attribute(emergency)` | yes | attribute filter |
| `/directory/[city]/government/[category]` | `city+specialty+attribute(gov)` | yes | attribute filter |
| `/directory/[city]/[area]/top/[category]` | `city+area+specialty` | yes (no runtime gate) | — (gap — see §4) |
| `/directory/[city]/[area]/walk-in/[category]` | `city+area+specialty+attribute` | yes (no runtime gate) | — (gap) |
| `/directory/[city]/[area]/emergency` | `city+area+attribute` | yes | — |
| `/directory/[city]/[area]/procedures/[procedure]` | `city+area+procedure` | yes (no runtime gate) | — (gap) |
| `/directory/compare/[slug]` | custom | yes | `getAllComparisonSlugs` |
| `/directory/top/[category]` | `specialty` (UAE-wide) | yes | static |
| `/directory/top` | hub | yes | static |

### Non-directory routes that still emit facet URLs

| Route | Combo | Indexable |
|---|---|---|
| `/find-a-doctor/[specialty]/[doctor]-[id]` (Item 0.75 — staged, not yet merged) | `specialty+doctor` | TBD — will be gated by `professionals_index.facility_links[]` presence |
| `/insurance/[insurer]` | `insurance` (bare hub) | yes |
| `/best/[city]`, `/best/[city]/[category]` | `city` / `city+specialty` (ranked) | yes — canonical to directory parents |

---

## 2. Combos in the sitemap (`src/app/sitemap.ts`)

Enumerated statically — the sitemap is synchronous and uses constants only.

| Sitemap entry | Combo | Emitted by |
|---|---|---|
| `/directory/[city]` | `city` | `for (const city of cities)` |
| `/directory/[city]/[category]` | `city+category` | nested loop over `CATEGORIES` |
| `/directory/[city]/[area]` | `city+area` | `getAreasByCity` |
| `/directory/[city]/[area]/[category]` | `city+area+specialty` | nested loop |
| `/directory/[city]/24-hours` | `city+attribute` | static |
| `/directory/[city]/insurance` | `city+hub` | static |
| `/directory/[city]/insurance/[insurer]` | `city+insurance` | **geo-gated** via `getInsurancePlansByGeo` |
| `/directory/[city]/insurance/[insurer]/[category]` | `city+specialty+insurance` | **allow-list gated** via `TRI_FACET_INSURER_ALLOW` × `TRI_FACET_CATEGORY_ALLOW` × geo |
| `/directory/[city]/language/[lang]` | `city+language` | `LANGUAGES` loop |
| `/directory/[city]/condition/[condition]` | `city+condition` | `CONDITIONS` loop |
| `/directory/[city]/procedures/[procedure]` | `city+procedure` | `PROCEDURES` filter |
| `/directory/[city]/[procedure-flat]` | `city+procedure` alias | same procedure filter |
| `/directory/[city]/walk-in`, `/emergency`, `/government` | `city+attribute` | static |
| `/directory/[city]/top/[category]` | `city+specialty` (ranked) | nested loop |
| `/directory/[city]/[category]?page=N` | deep pagination | **allow-list gated** via `DEEP_PAGINATION_CITY_CATEGORY_ALLOW` (now in facet-rules) |

Critically: `/search` is NOT in the sitemap (Item 0 cleanup already applied), `/directory/[city]/insurance/[insurer]/[category]` is already allow-list-gated, and `/directory/[city]/insurance/[insurer]` is already geo-gated.

---

## 3. Combos gated at runtime

Runtime gating lives in `generateMetadata` and uses Item 1's helpers in `src/lib/insurance-facets/data.ts` (which after Item 8 re-export their min-provider constants from `src/lib/seo/facet-rules.ts`).

| Runtime gate | File | What it does |
|---|---|---|
| `isDuoFacetEligible(insurer, city)` | `insurance-facets/data.ts` | Geo check via `getInsurancePlansByGeo` + `getProviderCountByInsurance >= DUO_FACET_MIN_PROVIDERS` (5) |
| `isTriFacetEligible(insurer, city, category)` | `insurance-facets/data.ts` | Same geo check + category filter + `>= TRI_FACET_MIN_PROVIDERS` (5) |
| (Item 8) `evaluateCombo(combo, values, baseUrl)` | `seo/facet-rules.ts` | Generic runtime gate; reads `FACET_RULES`, routes to the right `getProviderCountForCombo` query, returns `{ allowed, count, canonicalTarget, noindex }` |

The tri-facet page (`.../insurance/[insurer]/[category]/page.tsx`) emits `robots: { index: false, follow: true }` + canonical to the 2-facet parent when `isTriFacetEligible` returns false. The 2-facet insurer page does the same when `count < DUO_FACET_MIN_PROVIDERS`.

---

## 4. Mismatches + gaps

### 4.1 Routes that exist but are NOT gated by min-provider count

These render with `index,follow` regardless of how many providers match. They should move to using `evaluateCombo` in a follow-up pass:

| Route | Combo | Risk |
|---|---|---|
| `/directory/[city]/language/[lang]/[category]` | `city+specialty+language` | 3-facet — currently renders any combo; `FACET_RULES` declares it indexable with `minProviderCount = 5` but no runtime call yet |
| `/directory/[city]/[area]/top/[category]` | `city+area+specialty` | 3-facet — `FACET_RULES` declares `minProviderCount = 3` but no runtime call |
| `/directory/[city]/[area]/procedures/[procedure]` | `city+area+procedure` | no rule defined — should be either rule-added or made non-indexable |
| `/directory/[city]/condition/[condition]` | `city+condition` | currently aggregates categories; `FACET_RULES` declares `minProviderCount = 5` but no runtime call |

**Recommended next step:** after Item 1 reviewers sign off, replace the Item-1-specific `isTriFacetEligible` / `isDuoFacetEligible` calls with `evaluateCombo(combo, values, baseUrl)` and retrofit each of the above pages to use the same helper. No behavior change for Item 1 pages; net-new gating for the rest.

### 4.2 Combos in routes but NOT in sitemap

| Route | Why not in sitemap | OK? |
|---|---|---|
| `/directory/[city]/language/[lang]/[category]` | Never emitted | **gap** — should be added to sitemap once runtime gate lands |
| `/directory/[city]/[area]/walk-in/[category]` | Attribute filter | intentional — attribute filters are not canonical surfaces |
| `/directory/[city]/[area]/24-hour/[category]` | Attribute filter | intentional |
| `/directory/[city]/government/[category]` | Attribute filter | intentional |

### 4.3 Combos in sitemap but NOT in `FACET_RULES`

None — every combo emitted by `src/app/sitemap.ts` has a corresponding rule in `FACET_RULES` after Item 8.

### 4.4 Combos explicitly declared `noindex` in `FACET_RULES`

Documented for the record — these are filter states that Zavis will never index:

- `city+specialty+insurance+language` (4-facet; Zocdoc convention keeps language disjoint from insurance)
- `city+area+insurance`
- `city+area+insurance+language` (4-facet)
- `city+condition+insurance`
- `city+area+insurance+specialty` (4-facet)

---

## 5. Centralization summary

Before Item 8, the following constants lived in two files:

| Constant | Previous home | New home |
|---|---|---|
| `TRI_FACET_INSURER_ALLOW` | `src/app/sitemap.ts` | `src/lib/seo/facet-rules.ts` |
| `TRI_FACET_CATEGORY_ALLOW` | `src/app/sitemap.ts` | `src/lib/seo/facet-rules.ts` |
| `DEEP_PAGINATION_CITY_CATEGORY_ALLOW` | `src/app/sitemap.ts` | `src/lib/seo/facet-rules.ts` |
| `DEEP_PAGINATION_MAX_PAGE` | `src/app/sitemap.ts` | `src/lib/seo/facet-rules.ts` |
| `TRI_FACET_MIN_PROVIDERS` | `src/lib/insurance-facets/data.ts` | `src/lib/seo/facet-rules.ts` (re-exported from original for back-compat) |
| `DUO_FACET_MIN_PROVIDERS` | `src/lib/insurance-facets/data.ts` | `src/lib/seo/facet-rules.ts` (re-exported) |
| `AREA_FACET_MIN_PROVIDERS` | `src/lib/insurance-facets/data.ts` | `src/lib/seo/facet-rules.ts` (re-exported) |

Every consumer now imports from one place, so a single policy change (e.g. bumping `DUO_FACET_MIN_PROVIDERS` to 10) updates sitemap + runtime gate + insurance facet logic in one edit.

---

## 6. Recommended next steps

1. **Retrofit runtime gates.** Replace `isTriFacetEligible` / `isDuoFacetEligible` call sites with `evaluateCombo` so all indexable combos share the same decision flow.
2. **Extend runtime gating to non-insurance 3-facet routes.** The 3 "gap" routes in §4.1 should route through `evaluateCombo` for consistent thin-content suppression.
3. **Add `city+language+specialty` URLs to the sitemap.** Currently a rendered route with no sitemap entry — either gate via `evaluateCombo` and emit, or explicitly mark as non-indexable in `FACET_RULES` and add `robots: { index: false }` to the page.
4. **Wire `__selftest()` into CI.** Add a minimal Vitest/Jest invocation that calls `__selftest()` so rule-table regressions fail fast.
5. **Audit the catch-all route.** `src/app/(directory)/directory/[city]/[...segments]/page.tsx` resolves many combo shapes in `resolveSegments()` — once the runtime gate retrofit lands, this single file should enforce facet policy for every sub-path.
6. **Add area combos to the rule table incrementally.** Currently only `city+area` and `city+area+specialty` are indexable. As Item 3 (neighborhood taxonomy) gains density, adding `area+language` / `area+procedure` entries should be a one-line change to `FACET_RULES`.

---

## 7. File references

- **Rule engine:** `src/lib/seo/facet-rules.ts` (new — Item 8)
- **Item 1 insurance-facets data:** `src/lib/insurance-facets/data.ts` (re-exports the constants)
- **Sitemap:** `src/app/sitemap.ts` (imports allow-lists from rule engine)
- **Tri-facet runtime gate:** `src/app/(directory)/directory/[city]/insurance/[insurer]/[category]/page.tsx`
- **Duo-facet runtime gate:** `src/app/(directory)/directory/[city]/insurance/[insurer]/page.tsx`
- **Catch-all directory route:** `src/app/(directory)/directory/[city]/[...segments]/page.tsx`
