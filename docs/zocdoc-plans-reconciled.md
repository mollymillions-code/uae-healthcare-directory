# Zocdoc→Zavis: Reconciled Roadmap (Claude research + Codex action plan)

**Date:** 2026-04-11
**Author:** Claude Code (Opus 4.6, 1M context)
**Inputs:**
- Claude's mega-researcher + 8-specialist Zocdoc teardown (`/tmp/zocdoc_megaresearch.md` + specialist reports in session history)
- Codex's brutal action plan: `docs/zocdoc-brutal-action-plan.md`
- Codex's implementation recommendations: `docs/zocdoc-implementation-recommendations.md`
- Live Zavis codebase exploration (see `.ai-collab/ZOCDOC-ROADMAP-IMPLEMENTATION.md`)

## What Codex got RIGHT that Claude missed

### 1. Doctor profile pages — the #1 miss
**Codex's top recommendation.** Zavis has **99,520 DHA professional records** in `data/parsed/dha_professionals_all.json` and `src/lib/professionals.ts`, with 5,505 linked facilities — and **zero routes that render them as doctor profile pages**. This is the single biggest structural gap versus Zocdoc, whose `/doctor/[name]-[id]` pages are the primary leaf SEO asset (~100k profiles driving a huge share of organic discovery).

Claude's research fixated on facility (provider) profiles because the specialist agents were given the `providers` table, not `professionals`. The Zocdoc benchmark is **doctor-first, facility-second** — Zavis is currently facility-first, doctor-absent.

**Verdict:** Codex is correct. Doctor pages belong at the TOP of the roadmap, ahead of every item in Claude's original list including the insurance-facet layer. **Adopted.**

### 2. Pagination is broken for SEO
`src/components/directory/ProviderListPaginated.tsx` SSRs page 1 only; page 2+ is client-fetched. Googlebot renders JS but unreliably, and link equity through deep pagination is measurably weaker than SSR. Every Zocdoc listing page has crawlable pagination via query params.

**Claude's plan had nothing about this.** It's a pre-existing bug that will silently cap the upside of every other SEO improvement until it's fixed.

**Verdict:** Codex is correct. **New Item 0.5 added.**

### 3. Crawl/index contradictions
- `/search` is disallowed in `src/app/robots.ts`
- `/search` is `noindex` in `src/app/(directory)/search/page.tsx`
- `/search` is **still submitted in `src/app/sitemap.ts`**

Plus `src/app/sitemap-providers.xml/route.ts` may include URLs that are individually noindexed due to thin-content rules. Mixed signals waste crawl budget and erode GSC sitemap trust scores.

Claude's Item 8 (facet-cap rules) is adjacent but doesn't address the existing contradictions. **Verdict:** Codex is correct. **New Item 0 (cleanup) added, ahead of everything.**

### 4. Hardcoded `isAcceptingNewPatients: true` in src/lib/seo.ts
**This is a false schema claim being emitted for every provider.** The repo has no source field, no verification loop, no UI exposure. Google has penalized sites for structured-data overstatement. This is a data-integrity bug that Claude's Item 2 (JSON-LD enhancements) would have caught only by accident.

**Verdict:** Codex is correct. Must be removed immediately. **Folded into the new Item 0.**

### 5. Condition pages are category unions, not matching pages
Current `/directory/[city]/condition/[condition]/page.tsx` does a category aggregate. Zocdoc's `/procedure/back-pain-1812`-style pages are **decision pages** — they explain the condition, map it to specialties, surface doctors/facilities, link to tests, and answer insurance/urgency questions.

Claude's roadmap had nothing about condition pages at all. **Verdict:** Codex is correct. **Added as part of expanded Item 4 (formerly "fat city-specialty hubs").**

### 6. ProviderCard as decision card vs. directory stub
Codex notes the current `ProviderCard.tsx` is too thin: no review count prominence, no insurance chips, no language chips, no open-now surrogate, no claimed/verified labels. This is a CTR problem on every existing listing page — fixing it compounds with every other improvement.

Claude had this implicit inside Item 4 (fat hub pages) but didn't call it out as a standalone intervention. **Verdict:** Codex is correct to separate it. **Promoted to its own sub-item of the expanded Item 4.**

### 7. "Do not fake trust claims" warning
Codex is emphatic: do not ship fake availability, fake insurance acceptance, fake "accepting new patients", fake language lists. Only emit what you can support with visible, updated content.

This is a direct warning against Claude's Item 7 (verified review bootstrap). Zavis has no booking loop, so a "verified review" system has to be either genuinely verified (QR code / SMS OTP / claim upload) or not shipped at all. The naming "Zavis Verified" must mean something or it erodes the brand.

**Verdict:** Codex is correct to apply the brake. Item 7 is DESCOPED in the reconciled plan — ship the trust policy pages (editorial, methodology, data sources) first, and only build the review intake system when the operational backing is in place.

## Where Claude went DEEPER than Codex

### A. Zocdoc mechanics specifics
Claude's specialists extracted **real numbers**:
- Zocdoc hub page `/dentists` has **2,511 internal links** (not "a lot"); profile pages have 53
- Zocdoc's URL facet cap is **3**, not 4, and language is **disjoint** from insurance in URLs
- Paper Gown author bio pages are **empty WordPress archives** — a catastrophic E-E-A-T weakness Zavis can leapfrog
- Zocdoc's data reports drive **80–250 new referring domains per release**, not the 500–1500 initially hypothesized
- Zocdoc's Neighborhood taxonomy is **curated with stable DB IDs** (23k–223k non-contiguous range), not auto-derived

Codex's plan operates at the architectural level. Claude's research gives the **concrete specs** (link counts, schema types, URL patterns, content word counts). The two are complementary.

### B. Bilingual + UAE-specific mechanics
- 18 UAE payer entities with geo caveats (Thiqa AD-only, Daman Enhanced vs Basic, AXA Green Crescent rebrand, Sukoon ex-Oman Insurance)
- Dubai Pulse `dm_community-open` dataset (226 communities with polygon GeoJSON + EN/AR) as the authoritative neighborhood taxonomy source — Codex doesn't name the source
- PDPL 45/2021 compliance angles on SMS/WhatsApp review flows
- DHA/DOH/MOHAP license number as a `schema.org/identifier` signal no US competitor can match
- Arab Health Dubai as a PR accelerator Codex doesn't mention

### C. Specialist-grade specs for execution
- JSON-LD copy-paste generators (`generateProviderProfileSchema`, `generateHubPageSchema`, etc.)
- Internal link templates with exact anchor-text patterns (64% partial-match on profiles, 90% partial-match on hubs, forbidden anchors list)
- A 6-month verified-review rollout plan with anti-gaming measures, velocity caps, and moderation SLAs
- A 12-month press calendar with 10 concrete UAE report concepts

## Where Codex and Claude AGREE (both priorities survive)

| Item | Claude's plan | Codex's plan | Verdict |
|---|---|---|---|
| Curated city×specialty×insurance landing pages | Item 1 (built) | Rec 6 "city + insurer + specialty" allowed combo | **Keep Item 1.** Both agree. |
| Controlled facet-policy engine | Item 8 | Rec 6 `src/lib/seo/facet-rules.ts` | **Keep Item 8.** Codex gave us the file path. |
| Layered schema.org JSON-LD | Item 2 | Rec 9 remove unsupported claims | **Merge.** Item 2 now includes the `isAcceptingNewPatients` fix. |
| Neighborhood/area SEO pages | Item 3 | Rec 6 `area + insurer + language` NOT indexed but area-only is fine | **Keep Item 3** with Codex's discipline — never cross area×insurer×language. |
| E-E-A-T / author bylines | Item 5 | Rec 8 trust pages before claims | **Merge.** Item 5 now includes editorial-policy, methodology, data-sources pages. |
| Mobile conversion | Item 9 | Rec 4 upgrade cards | **Keep.** Codex's card upgrade joins Item 4. |
| Accessibility | Item 10 | Not mentioned | **Keep Item 10.** Claude goes beyond Codex here — correctly. |
| Annual data report | Item 6 | Not mentioned directly | **Keep Item 6.** Claude goes beyond Codex here — correctly, since Zocdoc's data reports ARE the biggest backlink channel. |

## Where they DISAGREE

| Item | Claude said | Codex said | Who's right |
|---|---|---|---|
| Item priority #1 | Insurance facet layer | Doctor profile pages | **Codex.** 99,520 records + 0 routes = bigger unlock. Moved to Item 0.75. |
| Verified reviews | Ship in 6 months with QR/SMS/WhatsApp bootstrap | "Do not copy unless you can operationalize" | **Codex.** Descope to trust-policy pages only; no intake system until ops is ready. |
| Order of insurance layer vs facet-rules engine | Insurance first (built), facet-rules later | Facet-rules BEFORE aggressive landing page generation | **Codex.** Claude built Item 1 without the general rule engine; retroactively, Item 8 (facet rules) should have been first. Mitigating: Item 1 embedded hard min-provider gates, so the rule engine can absorb them later without rework. |
| Search UX | Didn't address | Rec 5 rebuild around healthcare intent (reason/condition/insurance/language/entityType) | **Codex identifies a gap.** Added as an expansion to Item 9. |
| Accessibility | Item 10 standalone | Not mentioned | **Claude.** WCAG 2.1 AA is a real moat for UAE enterprise BD (insurers, hospitals, federal clients) and maps to UAE 2020 digital accessibility law. |
| Annual data report | Item 6 (big focus) | Not mentioned | **Claude.** Zocdoc's own data shows their annual reports drive the highest-quality backlinks. This is a content-marketing play Codex undervalues. |

## RECONCILED ROADMAP (authoritative going forward)

### Tier 0: Technical debt (MUST ship before new features)

**Item 0 — Crawl/index cleanup + schema correctness** *(NEW, from Codex)*
- Remove `/search` from `src/app/sitemap.ts` (already noindexed + robots-disallowed)
- Audit `src/app/sitemap-providers.xml/route.ts` for thin/noindex URL inclusion; gate on the same richness filter used in directory pages
- Remove hardcoded `isAcceptingNewPatients: true` from `src/lib/seo.ts`
- Audit all schema helpers for other overstated claims (e.g. hardcoded ratings, invented languages, phantom services)
- Fix any other robots/sitemap/canonical contradictions surfaced by the audit
- **Effort:** ~1 day. **Risk:** low. **Upside:** immediate GSC trust recovery + fixes a structured-data integrity issue.

**Item 0.5 — Crawlable SSR pagination** *(NEW, from Codex)*
- Rewrite `ProviderListPaginated.tsx` to parse `searchParams.page` and server-render page N directly
- Keep client enhancement for progressive UX only
- Add self-canonical per paginated page; no noindex unless depth is genuinely thin
- `rel=prev/next` optional (Google deprecated but still respected by some crawlers)
- **Effort:** ~2 days. **Risk:** medium (affects every listing page). **Upside:** long-tail provider discovery increases 2–5x based on general SEO benchmarks.

### Tier 1: The big structural gap

**Item 0.75 — Doctor profile pages `/find-a-doctor/`** *(NEW, from Codex — TOP PRIORITY)*
- Route: `/find-a-doctor/[specialty]/[doctor-slug]-[id]` (flat, no city segment initially)
- Data source: `src/lib/professionals.ts` → 99,520 DHA records + 5,505 facility links
- New page components: `DoctorProfileHero`, `DoctorProfileFacts`, `DoctorProfileFaq`, `DoctorProfilePage`
- New SEO helper: `src/lib/professionals-seo.ts` with `doctorProfileSchema()` (Person + Physician + BreadcrumbList + FAQPage)
- New data additions: derived `slug`, `displayTitle`, `relatedDirectoryCategory`, `primaryCitySlug`, `facilityLinks[]`, `searchTerms[]`, `relatedConditions[]` — either in a new `professionals_index` table or as precomputed JSON
- **Do NOT invent:** insurance, availability, "accepting new patients", languages unless in source data
- Sitemap: new `sitemap-doctors.xml` with gated inclusion (require ≥1 facility link + populated specialty)
- Internal linking: doctor → facility, facility → doctors at facility, specialty hub → doctors + facilities
- **Effort:** ~5–7 days for the first-pass route + first 10,000 doctors indexed. **Risk:** medium-high (new page class, schema validity, thin-content risk). **Upside:** Codex forecasts +60% to +250% impressions from this one change alone. Likely the single biggest lift in the entire plan.

### Tier 2: Enhanced existing surfaces

**Item 1 — Insurance-facet programmatic layer** *(already built in this session — now reviewed with Codex findings)*
- Builder complete. Needs 3 reviewers with merged spec that also checks:
  - Does the 3-facet page respect "only index combinations with enough inventory" rule?
  - Does it link out to doctor pages (once they exist)?
  - Does it avoid the false `isAcceptingNewPatients` claim?

**Item 2 — JSON-LD generator enhancements (includes schema-correctness audit)**
- Original scope: add `knowsLanguage`, DHA/DOH `identifier`, `PostalAddress`, `geo`, bilingual `alternateName`, `openingHoursSpecification`
- **Merged scope from Codex:** sweep `src/lib/seo.ts` for all overstated/hardcoded claims; remove any that don't map to real fields; add validity guards (`reviewCount ≥ 3` for stars, etc.)

**Item 3 — UAE neighborhood taxonomy**
- Unchanged from Claude's original: Dubai Pulse `dm_community-open` + Abu Dhabi Open Data + OSM fallback
- **Merged discipline from Codex:** area pages are index-OK; area × insurer × language is NOT.

**Item 4 — Expanded: Fat hubs + ProviderCard decision upgrade + Condition matching pages**
- Original: fat city-specialty hubs with 500+ internal links, editorial intros, FAQ blocks
- **Plus from Codex Rec 4:** ProviderCard.tsx upgrade — review count, insurance chips, language chips, claimed/verified labels, top services, open-now surrogate
- **Plus from Codex Rec 7:** rewrite `/directory/[city]/condition/[condition]/page.tsx` into a matching page (condition intro → specialties → doctors → facilities → tests → FAQ)
- **Effort:** ~3–5 days for cards, ~2–3 days for condition pages, ~2 days for hub enhancements.

**Item 5 — Expanded: /intelligence E-E-A-T + Trust/methodology pages**
- Original: author bio pages, medical reviewer bylines, MedicalWebPage schema on clinical content
- **Plus from Codex Rec 8:** `/editorial-policy`, `/data-sources`, `/methodology`, `/verified-reviews` (policy page only, not intake) — all emit schema.org + appear in footer + linked from every Intelligence article

### Tier 3: Content/strategy (lower coupling)

**Item 6 — Zavis "What UAE Patients Want" annual report scaffold** (unchanged)

**Item 7 — Verified review policy page only** *(DESCOPED per Codex warning)*
- Ship `/verified-reviews` policy page explaining intent, criteria, and the "coming soon" status
- Do NOT ship the QR/SMS/WhatsApp intake system until there's operational moderation capacity
- Reserve `verified_reviews` table schema for Phase 2

**Item 8 — Facet-policy rule engine** (`src/lib/seo/facet-rules.ts`)
- Original plan unchanged
- Retroactively absorb Item 1's min-provider gates into this module
- Defines the allowlist: city+specialty, city+insurer, city+language, city+condition, city+insurer+specialty. Everything else requires explicit justification.

**Item 9 — Mobile sticky CTA + healthcare-intent search**
- Original: sticky Call/WhatsApp/Directions bar on mobile provider profiles
- **Plus from Codex Rec 5:** rebuild SearchBar around healthcare intent (reason/condition/insurance/language/entityType=doctor|facility). But **do not** expose every filter combination as an indexable URL — UX > SEO here.

**Item 10 — WCAG 2.1 AA accessibility pre-emption** (unchanged)

### Deprioritized / removed

- Nothing removed. Everything in Claude's original list survives, but Items 7 is descoped and the overall order is reshuffled.

## Revised build order (execute in this sequence)

1. **Item 0** — Crawl/index cleanup + remove `isAcceptingNewPatients` hardcoding *(1 day)*
2. **Item 0.5** — SSR crawlable pagination *(2 days)*
3. **Item 0.75** — Doctor profile pages `/find-a-doctor/[specialty]/[doctor]-[id]/` *(5–7 days)*
4. **Item 8** — Facet-policy rule engine *(1 day — should have come before Item 1 but Item 1 embedded the gates so this is clean-up)*
5. **Item 1** — Insurance-facet layer (already built — run the 3 reviewers with merged spec now) *(reviews: 1 day)*
6. **Item 2** — JSON-LD generator enhancements *(1 day)*
7. **Item 3** — UAE neighborhood taxonomy *(3–4 days)*
8. **Item 4** — Expanded hubs + cards + condition matching *(5–7 days)*
9. **Item 5** — Expanded E-E-A-T + trust/methodology *(3–4 days)*
10. **Item 9** — Mobile sticky CTA + healthcare-intent search *(2–3 days)*
11. **Item 10** — WCAG 2.1 AA audit + fixes *(2–3 days)*
12. **Item 6** — Annual report scaffold *(2 days code + content separate)*
13. **Item 7** — `/verified-reviews` policy page only *(0.5 days)*

**Total rough effort:** ~30–40 engineering days of actual work, plus review cycles. The original plan was similarly sized but aimed at the wrong priority order. Codex's reordering is correct.

## Hard lessons for my process

1. **I failed to enumerate existing assets before prioritizing.** 99,520 DHA records sitting unused was the single most important fact about this codebase, and my research treated Zavis as facility-only because that's what the specialist prompts asked about. Lesson: before researching a competitor, map everything Zavis HAS first.

2. **I built Item 1 before auditing sitemap/robots contradictions.** Item 0's fixes are strictly prior to anything I ship — a sitemap with `/search` + a noindexed canonical + a false `isAcceptingNewPatients` claim erodes GSC trust in everything I submit after. Lesson: tech debt first, then features.

3. **I didn't notice `isAcceptingNewPatients: true` was hardcoded.** Codex found it in a single file read. My exploration agent enumerated `src/lib/seo.ts` exports but didn't read the bodies. Lesson: for schema code, read the implementations, not just the signatures.

4. **Zocdoc is doctor-first, Zavis is facility-first.** My entire research frame was "directory pages" = facility pages. But the Zocdoc moat is partly that doctors are first-class entities with their own leaf pages. Lesson: when benchmarking, map the competitor's entity model, not just their URL shape.

## What happens next

1. This doc becomes the authoritative roadmap.
2. `.ai-collab/ZOCDOC-ROADMAP-IMPLEMENTATION.md` is updated to reflect the reconciled plan + new items.
3. Item 1 is already built; 3 reviewers run next with the merged spec.
4. Tier 0 (Items 0, 0.5, 0.75) is built BEFORE any remaining Item-2-through-10 work.
5. Execution continues sequentially per the revised build order above.

Nothing from Item 1 needs to be reverted or rewritten — the builder respected all the hard constraints and the Codex critique of Item 1 is addressable via the reviewers' merged spec.
