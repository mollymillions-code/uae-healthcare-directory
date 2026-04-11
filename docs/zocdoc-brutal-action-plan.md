# Zavis Brutal Action Plan vs Zocdoc

## What Zavis Is Missing

Zavis already has a strong facility-directory SEO base:

- Rich schema generation in `src/lib/seo.ts`
- Large sitemap surface in `src/app/sitemap.ts`
- Strong city/category/condition/insurance route coverage
- A 99,520-record DHA professional dataset in `data/parsed/dha_professionals_all.json`
- 5,505 professional-linked facilities in that DHA dataset

But it is still structurally behind Zocdoc in the areas that matter most for search growth:

1. No doctor-entity profile pages
2. Listing pagination is not fully crawlable after page 1
3. Search intent is too shallow for healthcare
4. Crawl/index rules conflict with sitemap submissions
5. Trust modules are weaker than the data model could support
6. Condition/reason-to-visit coverage is not yet close to patient-language demand
7. Results pages are directory pages, not true decision pages

## Brutal Priorities

### Tier 1: Must Build Immediately

#### 1. Launch doctor profile pages

Build a canonical route for individual DHA professionals.

Suggested route:

- `/find-a-doctor/[city]/[specialty]/[doctor-slug]-[id]`

Minimum page modules:

- Name, license type, specialty, facility, city
- Facility links
- Related conditions / reasons for visit
- Nearby related doctors
- Insurance placeholder only if real
- Languages only if real
- Breadcrumbs
- FAQ block
- Person/Physician schema

Why this matters:

- This is the single biggest gap versus Zocdoc
- You already have 99,520 doctor records
- Even if only a fraction index and rank, the page-class upside is massive

#### 2. Make listing pagination truly crawlable

Current issue:

- Page 1 is SSR
- Page 2+ is fetched client-side in `src/components/directory/ProviderListPaginated.tsx`

Required change:

- Give paginated directory pages real URL routes or server-rendered query-param pages
- Emit canonical, prev/next logic, and unique metadata where appropriate
- Do not force Google to depend on client fetches for page 2+

Why this matters:

- Right now long-tail providers deeper in lists are partially hidden from discovery
- This weakens both crawl depth and internal PageRank flow

#### 3. Fix crawl/index contradictions

Current issue:

- `/search` is disallowed in `src/app/robots.ts`
- `/search` is noindexed in `src/app/(directory)/search/page.tsx`
- `/search` is still submitted in `src/app/sitemap.ts`

Required change:

- Remove non-indexable URLs from sitemaps
- Stop submitting thin/noindex URLs
- Make provider sitemap exclude provider pages you intend to noindex

Why this matters:

- Mixed signals waste crawl budget and weaken trust in sitemap quality

#### 4. Upgrade result cards into decision cards

Current `ProviderCard` is too thin relative to Zocdoc.

Add if real and modeled:

- Review count
- Insurance highlights
- Open-now / next available surrogate
- Languages
- Verified / claimed status
- Top services
- Accessibility flags
- Recent review summary

Why this matters:

- Better cards improve CTR and on-page conversion without waiting for new pages

### Tier 2: Build Next

#### 5. Rebuild search around healthcare intent

Current search inputs:

- Query
- City
- Category

Needed inputs:

- Condition / reason for visit
- Specialty
- City / area
- Insurance
- Language
- Facility vs doctor

This should drive both UX and SEO landing-page generation.

#### 6. Create curated intent landing pages

Build high-value, crawlable pages for:

- Same-day doctor in Dubai
- Female dermatologist in Abu Dhabi
- Arabic-speaking pediatrician in Sharjah
- Dentist accepting Daman in Dubai
- Walk-in ENT clinic in Abu Dhabi
- Video consultation psychiatrist in Dubai

Rule:

- Only index combinations with enough inventory and unique copy
- Do not let free-form filter states explode

#### 7. Turn condition pages into matching pages

Current condition pages are mostly category unions.

They should become:

- Condition intro
- Which specialties treat this condition
- Which doctors/facilities are relevant
- What tests are usually involved
- Insurance / urgency / when-to-go-now FAQ

This is where Zavis can outperform a generic marketplace in the GCC.

#### 8. Surface richer provider data already in the model

The provider schema/data model already includes:

- Gallery photos
- Google reviews
- Editorial summary
- Accessibility options
- Rich opening-hours objects

Much of that is not visible enough on-page today.

Required:

- Upgrade provider detail pages to use the data you already have
- Only emit claims you can support with visible content

### Tier 3: Build After the Core

#### 9. Build a reviews and trust system

Do not copy Zocdoc's exact model unless you can operationalize it.

What to build:

- Review provenance labels
- Moderation policy
- Editorial policy
- Medical disclaimer
- Data sourcing pages
- "How profiles are built" transparency

What not to fake:

- "Accepting new patients"
- Insurance acceptance
- Appointment availability

unless you have real fields and update loops.

#### 10. Separate editorial from directory intent

Keep `intelligence` as a trust and link-earning layer.

Use it to support:

- Condition education
- Doctor selection guides
- Insurance explainers
- Cost guides
- Local healthcare comparisons

Internal linking should feed authority into doctor, condition, and city landing pages.

#### 11. Add machine-readable trust surfaces

Zocdoc is already publishing AI/LLM-facing context.

For Zavis:

- Keep `llms-full.txt`
- Add concise data sourcing pages
- Add entity/about pages for methodology
- Add structured author and editorial-review metadata where relevant

## What To Copy Now

- Doctor pages
- Stronger result cards
- Condition/reason language mapping
- High-intent city/specialty/insurance pages
- Trust policy pages
- Strong internal linking from editorial into transactional pages

## What To Copy Later

- Multi-channel booking distribution
- Real availability / inventory signals
- Insurance plan matching
- Review verification tied to real appointments

These are product and ops systems, not just SEO systems.

## What Not To Copy

- Unbounded faceted indexing
- Thin profile pages
- Unsupported trust claims
- Overly large page explosions before internal linking and canonicals are disciplined

## 30 / 90 / 180 Day Plan

### First 30 Days

- Fix sitemap and robots contradictions
- Ship crawlable pagination
- Upgrade provider cards
- Spec doctor page data model and route
- Define allowed indexable facet combinations

Expected effect:

- Better crawl consistency
- Better CTR on existing pages
- Faster discovery of deeper provider URLs

### First 90 Days

- Launch doctor profile pages for DHA professionals
- Launch top city + specialty + insurance + language pages
- Upgrade condition pages to real matching pages
- Add trust policy and methodology surfaces

Expected effect:

- Large impression growth from new page classes
- Better non-brand long-tail coverage
- Meaningful increase in pages eligible for ranking

### First 180 Days

- Expand doctor pages beyond Dubai where data exists
- Build visit-reason taxonomy
- Add true freshness and inventory-like fields where possible
- Deepen editorial-to-directory linking

Expected effect:

- Stronger query breadth
- Higher click-through rates on branded and non-branded healthcare discovery queries
- More durable traffic growth, not just temporary index spikes

## Forecast Model

These are scenario estimates, not guarantees. There is no Google Search Console baseline in the repo, so the upside must be modeled.

### Conservative Scenario

Assumes:

- Crawl fixes + better cards + some doctor pages
- No major authority gains yet
- Limited link growth

Expected 6-month effect:

- Impressions: +40% to +120%
- Clicks: +20% to +80%
- Indexed high-value pages: +50% to +150%

### Base Scenario

Assumes:

- Doctor pages ship well
- Crawlable pagination is fixed
- 100 to 300 high-intent landing pages are launched
- Condition pages become genuinely useful

Expected 6 to 9-month effect:

- Impressions: 2x to 5x
- Clicks: 1.5x to 3.5x
- Non-brand query count: 2x to 4x

### Aggressive Scenario

Assumes:

- Doctor pages scale cleanly
- Strong internal linking
- Good indexing rate
- Better trust signals
- Editorial supports directory pages

Expected 9 to 12-month effect:

- Impressions: 5x to 12x
- Clicks: 3x to 8x
- Top-10 keyword footprint: 3x to 6x

## Hard Truth

The biggest upside is not from polishing the existing facility directory. It is from turning Zavis into a doctor-and-facility discovery system with patient-language entry points.

If you only improve metadata, schema, and copy on the current facility pages, you may get a decent lift.

If you add doctor pages, crawlable pagination, disciplined facet landing pages, and a real trust layer, you create an entirely new search surface.

That is where the step-change lives.

## Success Metrics To Watch

Track weekly in Search Console:

- Total impressions
- Total clicks
- Non-brand clicks
- Number of indexed pages by page class
- Top queries by page class
- CTR by listing page vs profile page
- Average position for city/specialty queries
- Average position for doctor-name queries
- Coverage and exclusion reasons

Track in product analytics:

- Click-through from listing to profile
- Scroll depth on provider and doctor pages
- Contact clicks
- Outbound website clicks
- Map clicks
- Session conversion by landing-page type

## Recommended Build Order

1. Crawl/index cleanup
2. Crawlable pagination
3. Better result cards
4. Doctor profile route
5. Curated intent landing pages
6. Condition page rewrite
7. Trust and methodology layer
8. Editorial-to-directory authority routing

