# Zocdoc-to-Zavis Implementation Recommendations

## Purpose

This document converts the Zocdoc benchmark research into a build recommendation for the current Zavis codebase.

Use this doc for implementation sequencing, not inspiration. It is intentionally opinionated.

Related docs:

- `docs/zocdoc-brutal-action-plan.md` — strategic priorities and scenario-based upside
- `.ai-collab/ZOCDOC-ROADMAP-IMPLEMENTATION.md` — staged research-to-build tracker

## Executive Summary

Zavis should not try to become "Zocdoc for the UAE" in one move. The right move is narrower:

1. Turn Zavis from a facility-first directory into a doctor-and-facility discovery system
2. Make the most important listing surfaces fully crawlable
3. Build patient-language landing pages only where inventory is real
4. Surface trust modules already supported by the data model
5. Keep indexable pages disciplined and deliberately limited

The highest-value implementation is not another facility SEO page. It is a doctor profile page class backed by the DHA professional dataset.

Before this roadmap scales, security needs its own gating sprint. See `docs/security-audit-recommendations.md`.

## Current Assets To Exploit

These are the strongest assets already in the repo:

- `src/lib/seo.ts` — mature schema helper base
- `src/app/sitemap.ts` and `src/app/sitemap-providers.xml/route.ts` — broad sitemap infrastructure
- `src/lib/professionals.ts` — 99,520 DHA professional records and 5,505 linked facilities
- `src/lib/constants/professionals.ts` — normalized specialty taxonomy with category mappings
- `src/lib/data.ts` and `src/lib/db/schema.ts` — provider/facility data model richer than current UI usage
- `src/app/(directory)/directory/[city]/[...segments]/page.tsx` — existing high-value catch-all route surface

## Build Order

### Recommendation 0: Run a security sprint first

Before major SEO surface expansion, lock down internal APIs, dashboard auth, and abuse controls.

Why:

- new page classes and new workflows increase attack surface
- the repo currently has underprotected internal operational routes
- fixing security after expansion is harder than fixing it before expansion

Reference:

- `docs/security-audit-recommendations.md`

### Recommendation 1: Ship doctor profile pages first

This is the most important recommendation in the entire document.

#### Why

- It creates a new, much larger search surface
- It uses an existing dataset instead of waiting for new scraping
- It closes the biggest structural gap versus Zocdoc
- It gives Zavis a route into doctor-name, specialty, and long-tail condition intent

#### Recommended route shape

- `/find-a-doctor/[specialty]/[doctorSlug]-[doctorId]`

Optional later:

- `/find-a-doctor/[city]/[specialty]/[doctorSlug]-[doctorId]`

Start with the flatter version first. It is easier to canonicalize and avoids city ambiguity for doctors with multi-facility presence.

#### Files to add

- `src/app/(directory)/find-a-doctor/[specialty]/[doctor]/page.tsx`
- `src/app/(directory)/find-a-doctor/[specialty]/[doctor]/loading.tsx`
- `src/components/professionals/DoctorProfilePage.tsx`
- `src/components/professionals/DoctorProfileHero.tsx`
- `src/components/professionals/DoctorProfileFacts.tsx`
- `src/components/professionals/DoctorProfileFaq.tsx`
- `src/lib/professionals-seo.ts`

#### Files to extend

- `src/lib/professionals.ts`
- `src/lib/seo.ts`
- `src/app/sitemap.ts`

#### Data additions needed

Current `ParsedProfessional` is too thin for a truly strong page.

Add or derive:

- `slug`
- `displayTitle`
- `relatedDirectoryCategory`
- `primaryCitySlug`
- `facilityLinks[]`
- `searchTerms[]`
- `relatedConditions[]`
- `languages[]` only when real
- `gender` only when real

Do not invent:

- Insurance acceptance
- Availability
- Accepting new patients
- Languages if not present in source data

#### Schema recommendation

Add a dedicated physician/person schema helper instead of overloading `medicalOrganizationSchema()`.

Suggested outputs:

- `Person`
- `Physician` when appropriate
- `BreadcrumbList`
- `FAQPage`
- `ItemList` for linked facilities if useful

#### Minimum page modules

- Name + license type + specialty
- Facility/facilities
- Category context
- About this specialty in Dubai
- Related conditions / reasons to visit
- Top facilities hiring or hosting this specialty
- FAQ block
- Internal links to facility pages and specialty hubs

### Recommendation 2: Fix listing pagination before adding more page classes

#### Why

Current city/category pages only fully expose page 1 to crawlers. That weakens discovery of lower-ranked providers and makes internal link equity shallow.

#### Files to change

- `src/components/directory/ProviderListPaginated.tsx`
- `src/components/shared/Pagination.tsx`
- `src/app/(directory)/directory/[city]/[...segments]/page.tsx`

#### Recommendation

Use server-rendered `?page=` pagination or explicit page segments.

Preferred first step:

- Keep the current base route
- Parse `searchParams.page`
- Server-render that page directly
- Keep client enhancement only for progressive UX

#### SEO requirements

- Self-canonical per paginated page when the content materially changes
- No noindex unless page depth is genuinely thin
- Keep a crawlable HTML path to deeper providers

### Recommendation 3: Clean up sitemap and robots contradictions immediately

#### Why

This is low effort and should happen before major rollout.

#### Problems to fix

- `/search` is in sitemap but is disallowed/noindexed
- Provider sitemap includes URLs even when some provider pages are intentionally thin/noindex

#### Files to change

- `src/app/robots.ts`
- `src/app/sitemap.ts`
- `src/app/sitemap-providers.xml/route.ts`
- `src/app/(directory)/search/page.tsx`

#### Rule

Only submit URLs you actively want indexed.

### Recommendation 4: Upgrade cards before redesigning search

#### Why

It improves CTR and conversion on existing pages with relatively low risk.

#### Files to change

- `src/components/provider/ProviderCard.tsx`
- `src/app/(directory)/directory/[city]/[...segments]/page.tsx`

#### Add to facility cards when present

- Rating count prominence
- Review-summary snippet
- Insurance chips
- Language chips
- Open-now surrogate
- Accessibility markers
- Claimed / verified labels
- Top services

#### Add to future doctor cards

- Specialty
- Facility
- License type
- Related facility links
- Related category

### Recommendation 5: Redesign search around healthcare intent

Current search is too generic for healthcare.

#### Files to change

- `src/components/search/SearchBar.tsx`
- `src/app/(directory)/search/page.tsx`
- `src/lib/data.ts`

#### Add supported query dimensions

- `reason`
- `condition`
- `insurance`
- `language`
- `entityType` (`doctor` or `facility`)
- `specialty`
- `city`
- `area`

#### Important

Do not expose every possible filter combination as an indexable URL.

Search UX can be richer than crawlable SEO inventory.

### Recommendation 6: Build a controlled facet-policy layer

This should exist before aggressive landing-page generation.

#### Add

- `src/lib/seo/facet-rules.ts`

#### Responsibilities

- Allowlist indexable combinations
- Enforce minimum inventory thresholds
- Prevent 4-plus facet crawl states
- Distinguish UX filters from indexable SEO landings
- Define canonical target for every allowed combination

#### Suggested initial indexable combinations

- city + specialty
- city + insurer
- city + language
- city + condition
- city + insurer + specialty

#### Suggested non-index combinations initially

- area + insurer + language
- condition + insurer + language
- any 4-factor state
- free-text search states

### Recommendation 7: Rewrite condition pages into true matching pages

#### Why

Current condition pages mostly aggregate categories. They need to answer patient intent.

#### Files to change

- `src/app/(directory)/directory/[city]/condition/[condition]/page.tsx`
- `src/lib/constants/conditions.ts`
- `src/lib/seo.ts`

#### New page structure

- What this condition usually means
- Which specialties handle it
- Top relevant facilities
- Future: top relevant doctors
- Related tests / labs
- When urgent care is appropriate
- Insurance FAQ
- Local city framing

### Recommendation 8: Build trust pages before making trust claims bigger

#### Files to add

- `src/app/(directory)/editorial-policy/page.tsx` if not sufficient already
- `src/app/(directory)/data-sources/page.tsx`
- `src/app/(directory)/verified-reviews/page.tsx`
- `src/app/(directory)/methodology/page.tsx`

#### Why

Zocdoc works because trust is explicit and operational. Zavis should not overclaim without transparent policy pages.

### Recommendation 9: Correct schema that overstates reality

#### Current issue

`isAcceptingNewPatients: true` is hardcoded in `src/lib/seo.ts` even though the repo does not model that field.

#### Recommendation

- Remove unsupported claims from schema now
- Reintroduce only when there is a real source field, update loop, and UI exposure

### Recommendation 10: Create a dedicated doctor/facility linking system

Once doctor pages exist, link graph design becomes a ranking lever.

#### Add links from

- doctor page -> facility page
- facility page -> doctors at facility
- specialty hub -> doctors + facilities
- condition page -> specialties + facilities + doctors
- editorial page -> city/specialty/condition pages

#### Why

This is how Zavis turns separate content silos into one search system.

## Recommended Data Model Changes

### Phase 1 additions

#### New table: `professionals_index`

Use this if the JSON dataset needs stable precomputed SEO fields.

Suggested columns:

- `id`
- `slug`
- `name`
- `category_slug`
- `specialty_slug`
- `facility_slug`
- `city_slug`
- `license_type`
- `display_title`
- `related_directory_category`
- `search_terms` jsonb
- `related_conditions` jsonb
- `status`
- `updated_at`

If you do not want a new table yet, generate these fields in a build script and persist as JSON.

### Phase 2 additions

#### Provider/facility table additions

- `acceptingNewPatients` only if there is a real source
- `insuranceVerifiedAt`
- `hoursVerifiedAt`
- `dataSource`
- `dataSourceUrl`

#### Verified reviews system later

- `verified_reviews`
- `review_requests`
- `review_moderation_events`

## Recommended Implementation Sprints

### Sprint 1

- Fix crawl contradictions
- Fix pagination
- Upgrade facility cards
- Remove unsupported schema claims

### Sprint 2

- Launch doctor profile route
- Add doctor SEO helpers
- Add doctor sitemap coverage
- Add doctor/facility internal linking

### Sprint 3

- Rewrite condition pages
- Add facet-rule engine
- Add curated insurer + specialty landing pages

### Sprint 4

- Add trust/methodology pages
- Add editorial-to-transactional linking
- Expand doctor page depth

## Traffic and Impressions Forecast

These are scenario estimates, not precise forecasts. There is no current GSC baseline in the workspace, so planning should use ratios.

### Near-term effects by recommendation

#### Crawl cleanup + pagination

Expected effect:

- Impressions: `+10% to +35%`
- Clicks: `+5% to +20%`

#### Better cards and richer snippets

Expected effect:

- CTR on current ranking pages: `+10% to +30%`
- Clicks: `+8% to +25%`

#### Doctor page launch

Expected effect after indexing settles:

- Impressions: `+60% to +250%`
- Clicks: `+30% to +150%`

#### Controlled high-intent landings

Expected effect:

- Non-brand query footprint: `+50% to +200%`

### Base-case model

If current monthly organic impressions are `I` and clicks are `C`:

- 3-month target after sprint 1: impressions `1.1I to 1.35I`, clicks `1.05C to 1.2C`
- 6 to 9-month target after sprint 2 and 3: impressions `2I to 5I`, clicks `1.5C to 3.5C`
- 9 to 12-month target after strong execution: impressions `5I to 12I`, clicks `3C to 8C`

### What would make the forecast wrong

- Doctor pages are too thin
- Pagination remains effectively client-only
- Too many faceted pages get indexed
- Titles and snippets stay generic
- Internal linking remains facility-only
- Search Console reveals large indexing exclusions

## Definition Of Success

The project is working when:

- Doctor pages become a top source of non-brand impressions
- City/specialty pages improve CTR because they are decision pages, not directory stubs
- Condition pages begin ranking for patient-language queries
- Search Console shows fewer excluded/submitted contradictions
- Facility pages gain stronger downstream clicks from richer cards and better related links

## Non-Negotiables

- Do not ship fake availability
- Do not ship fake insurance acceptance
- Do not ship fake “accepting new patients”
- Do not mass-index unconstrained filter states
- Do not turn doctor pages into thin database dumps

## Final Recommendation

If resources are tight, do only these four things first:

1. Fix crawl contradictions
2. Make pagination crawlable
3. Launch doctor profile pages
4. Upgrade cards and internal links

That is the smallest set of changes likely to create a real step-function improvement rather than a cosmetic SEO lift.
