# Zavis Production Performance Review - 2026-04-28

## Scope

This report covers the production slowdown/outage investigation, the migration impact, local-only fixes applied in the production-aligned worktree, and remaining work that should be scheduled after the infrastructure move settles.

No code was pushed from this worktree. No server changes were made after the instruction to keep work local-only.

## Current Production Status

The site is back online after the Lightsail resize/migration to the larger instance.

Post-cutover public smoke checks from local HTTP probes:

| URL | Result | Time |
| --- | --- | ---: |
| `/` | 200 | 1.18s |
| `/directory/dubai/clinics` | 200 | 1.60s |
| `/search?q=Bin` | 200 | 2.46s |
| `/directory/dubai/clinics/bin-arab-dental-centre-l-l-c-dubai` | 200 | 1.46s |

The larger instance fixed the immediate CPU/memory pressure. The application still needs query and cache hardening because important public routes are still served dynamically from origin:

| URL type | Current cache header |
| --- | --- |
| Directory category page | `private, no-cache, no-store, max-age=0, must-revalidate` |
| Search page | `private, no-cache, no-store, max-age=0, must-revalidate` |
| Provider detail page | `private, no-cache, no-store, max-age=0, must-revalidate` |

Cloudflare reports these as `DYNAMIC`, so crawler traffic can still hit the origin heavily.

## What Happened

The outage was not one single bug. It was a load amplification problem:

1. Crawlers and bots hit many public directory, search, and provider pages at once.
2. Several hot routes did expensive database reads and in-process filtering.
3. Some provider-list queries selected large provider payload columns even when the UI only needed card/list fields.
4. The old 8 GB instance had little headroom once Node workers and PostgreSQL were busy at the same time.
5. Cloudflare eventually surfaced timeouts because origin responses became too slow.

The migration to a 32 GB instance gives immediate headroom, but it does not remove the underlying amplification pattern.

## Production Fixes Already Present

The current production baseline already includes two important hotfixes:

| Commit | Purpose |
| --- | --- |
| `81b1aa5` | Uses count queries for insurer facet gates instead of scanning provider lists repeatedly. |
| `27bf99c` | Paginates provider listings in the database instead of loading all matching rows into Node. |

These were the right emergency fixes because `/directory/dubai/clinics` was one of the main heavy routes.

## Local-Only Fixes Applied

The following fixes are applied only in this local production-aligned worktree:

`src/lib/data.ts`

- Added `providerListColumns()` so list/search/card queries do not select huge provider detail fields by default.
- Kept detail-heavy fields out of list queries, including Google place details, full Google reviews, gallery payloads, and richer review summary data.
- Changed `dbSelectProviders()`, `getProviders()`, and `searchProvidersByName()` to use the lighter select list.
- Changed `getProviderSlugsByCity()` to query only `categorySlug` and `slug`.
- Replaced JS-side insurance filtering with SQL JSONB `EXISTS` filtering.
- Replaced JS-side language filtering with SQL JSONB `EXISTS` filtering.
- Replaced insurance/language count scans with SQL `count()` queries.
- Made insurance + category count checks use category slug variants and the removed-provider exclusion.

`src/lib/seo/facet-rules.ts`

- Changed `city|category|insurance` and `city|specialty|insurance` combo counts to use the SQL count helper instead of loading insurance provider lists and filtering in JS.

`src/app/(directory)/directory/[city]/[...segments]/page.tsx`

- Removed the broad `noStore()` behavior for every multi-segment English directory route.
- Provider-shaped routes now call `noStore()` before provider lookup, so a transient DB miss cannot cache a provider 404.
- Category/subcategory hub routes are left eligible for ISR where the rest of the route allows it.

`src/app/(directory)/ar/directory/[city]/[...segments]/page.tsx`

- Applied the same provider-shaped `noStore()` behavior to Arabic directory routes.

## Why These Fixes Matter

These changes reduce origin load in three ways:

1. Smaller database rows for list/search routes.
2. More filtering and counting inside PostgreSQL instead of Node.
3. Less accidental no-cache behavior on hub-like directory routes.

The expected impact is lower memory use per request, fewer large JSON payloads crossing from PostgreSQL to Node, and less repeated application-side filtering during crawler traffic.

## Validation

Validation run in the local production-aligned worktree:

| Check | Result |
| --- | --- |
| `npx tsc --noEmit --pretty false` | Passed |
| `git diff --check` | Passed |
| Direct ESLint on changed files | Passed |
| `NEXT_PRIVATE_BUILD_WORKER_COUNT=1 npm run build` | Passed |
| Local built-server smoke on `/`, `/directory/dubai/clinics`, `/search?q=Bin` | Passed |

`npm run lint` is blocked in this nested worktree because ESLint picks up both the worktree `.eslintrc.json` and the parent repository `.eslintrc.json`, causing a duplicated Next plugin conflict. Running ESLint directly on the changed files with `--no-eslintrc --config .eslintrc.json` passes.

The local build emitted expected warnings because the local worktree does not have the production PostgreSQL service, dashboard secret, or shared data symlinks. It still completed successfully. The server build should run against the migrated local production database and shared data.

## Remaining Risks

### Public routes are still dynamic

Production still returns `private, no-cache, no-store` on directory/search/provider routes. The local `noStore()` narrowing helps one part of this, but the full cache behavior likely also depends on App Router usage of `searchParams`, dynamic data calls, and route structure.

Recommended follow-up:

- Split truly cacheable directory hub pages from search/filter pages.
- Keep provider detail pages dynamic only where necessary.
- Add explicit cache/revalidation policy for stable public directory pages.
- Confirm Cloudflare cache behavior after deployment.

### Build-time database work is still too heavy

The production build previously took a long time and showed static generation restarts. This suggests build-time routes and metadata generation still do too much DB work.

Known patterns to review:

- `limit: 99999` calls in route/page helpers.
- Sitemap generation loading large provider sets.
- Top/walk-in/government/comparison pages that load broad provider lists.
- Components that generate “best pages” from all providers.

Recommended follow-up:

- Replace broad `getProviders({ limit: 99999 })` calls with narrow SQL projections or dedicated count/slug helpers.
- Keep sitemap generation on slug-only queries.
- Avoid static-generation routes that require large provider payloads.

### Search still needs product-level work

The search route is up after migration, but a good Google-like search experience still needs deeper implementation:

- Relevance ranking.
- Pagination correctness.
- Synonyms and typo tolerance.
- Provider/category/city disambiguation.
- Optional LLM-assisted query interpretation behind the scenes.

This should be done carefully after the performance baseline is stable. LLM search should not be called per crawler request without strict caching/rate limits.

### Bot control should move to edge policy

The instance resize makes the site more resilient, but it is still wasteful to let noisy crawlers generate unlimited dynamic origin traffic.

Recommended follow-up:

- Keep Googlebot and Bingbot allowed.
- Rate-limit obvious high-volume commercial/AI crawlers.
- Prefer Cloudflare rules/rate limiting over ad hoc app logic.
- Monitor origin logs before blocking any crawler family.

## Priority Plan

### P0 - After migration stabilization

1. Monitor CPU, RAM, PM2 restarts, PostgreSQL connections, and slow routes for 24-48 hours.
2. Keep the old instance available briefly as rollback insurance, then stop it to avoid duplicate charges.
3. Do not run major rebuilds or broad code changes during the first stabilization window unless production degrades again.

### P1 - Deploy safe code hardening

1. Review and deploy the local query-projection and SQL-filtering patch.
2. Confirm directory/search/provider timings before and after deploy.
3. Confirm removed-provider exclusions still work.
4. Confirm Arabic and English directory route behavior.

### P2 - Cache architecture

1. Make stable directory hub pages cacheable.
2. Keep filtered/search pages dynamic only where required.
3. Validate headers and Cloudflare cache status.
4. Add route-level monitoring for cache misses and origin render time.

### P3 - Search quality

1. Fix pagination and exact-name search first.
2. Add lexical ranking and synonyms.
3. Add LLM query interpretation only behind caching, throttling, and deterministic fallbacks.

## Bottom Line

The migration solved the immediate capacity bottleneck. The local patch set addresses the next layer: reducing wasted DB payload, replacing application-side scans with SQL, and narrowing unnecessary dynamic/no-cache behavior. The biggest remaining structural issue is that too many public pages still bypass edge caching, which means crawler traffic can continue to hit the origin directly.
