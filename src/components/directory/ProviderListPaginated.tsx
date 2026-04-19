import { ProviderCard } from "@/components/provider/ProviderCard";
import { Pagination } from "@/components/shared/Pagination";
import type { LocalProvider } from "@/lib/data";

// ─────────────────────────────────────────────────────────────────────────────
// ProviderListPaginated — SERVER COMPONENT (Item 0.5 of the Zocdoc roadmap)
// ─────────────────────────────────────────────────────────────────────────────
// Historically this was a `"use client"` component that SSR-ed page 1 and then
// fetched page 2+ through `/api/providers`. Googlebot indexes rendered JS, but
// deep-pagination discoverability is inconsistent and link equity past page 1
// was effectively stranded.
//
// This rewrite:
//   - Is a pure React Server Component — no `"use client"`, no `useState`,
//     no `useEffect`, no fetch. All page data is produced by the parent
//     server component and passed in as props.
//   - Renders whichever `providers` slice the parent already resolved.
//   - Emits an accessible `<nav aria-label="Pagination">` with SSR-visible
//     `<a href="?page=N">` links via the existing `Pagination` component.
//   - Leaves progressive enhancement to the browser's native anchor behaviour
//     (soft-navigated by Next.js router, so the UX stays instant).
//
// The parent route is responsible for:
//   1. Parsing `searchParams.page` (default 1, clamp ≥ 1)
//   2. Calling `getProviders({ …, page, limit })`
//   3. Passing `providers`, `currentPage`, `totalCount`, `pageSize`, `baseUrl`
//   4. Emitting the self-canonical with `?page=N` when N > 1
//
// Props: `providers` is the already-sliced page N list, not the full dataset.

interface Props {
  providers: LocalProvider[];
  currentPage: number;
  totalCount: number;
  pageSize: number;
  baseUrl: string;
  emptyMessage: string;
  basePath?: string;
}

export function ProviderListPaginated({
  providers,
  currentPage,
  totalCount,
  pageSize,
  baseUrl,
  emptyMessage,
  basePath = "/directory",
}: Props) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <>
      {providers.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {providers.map((p) => (
            // Item 4 decision-card upgrade: forward every field the card
            // knows how to gate on, so the hub's main grid renders stars,
            // insurance chips, language chips, open-now status, wheelchair,
            // top services, and claimed/verified badges — not the thin
            // 2022-era projection that stripped all of these.
            <ProviderCard
              key={p.id}
              name={p.name}
              slug={p.slug}
              citySlug={p.citySlug}
              categorySlug={p.categorySlug}
              address={p.address}
              phone={p.phone}
              website={p.website}
              shortDescription={p.shortDescription}
              googleRating={p.googleRating}
              googleReviewCount={p.googleReviewCount}
              isClaimed={p.isClaimed}
              isVerified={p.isVerified}
              coverImageUrl={p.coverImageUrl}
              insurance={p.insurance}
              languages={p.languages}
              services={p.services}
              operatingHours={p.operatingHours}
              accessibilityOptions={p.accessibilityOptions}
              basePath={basePath}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-black/40">{emptyMessage}</p>
        </div>
      )}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        baseUrl={baseUrl}
      />
    </>
  );
}
