/**
 * Single source of truth for the "enriched for sitemap" thin-content gate.
 *
 * Per docs/seo/static-provider-sitemap-architecture-spec.md section 8.2:
 *
 *   "The implementing agent must extract the thin-content gate into a
 *    shared function or otherwise guarantee identical logic between:
 *      - sitemap generation
 *      - page-level `robots: { index: false }` decisions
 *    If this logic drifts, Google will receive contradictory signals."
 *
 * This module is imported by:
 *   - scripts/generate-provider-sitemaps.mjs (the offline generator that
 *     writes static XML to /home/ubuntu/zavis-shared/sitemaps/) — note
 *     that the .mjs script reimplements the same logic inline because it
 *     is a standalone node script and cannot import TypeScript at runtime;
 *     the two implementations MUST stay in sync by hand
 *   - src/app/sitemap-providers.xml/route.ts (legacy live route, retired
 *     once Nginx serves the static files)
 *   - src/app/sitemap-providers-ar.xml/route.ts (legacy live route,
 *     retired alongside the English one)
 *   - src/app/(directory)/directory/[city]/[...segments]/page.tsx in the
 *     `listing` case, where the `robots: { index: false }` decision
 *     depends on the same signals
 *
 * If you change this function, update the mirrored copy in
 * scripts/generate-provider-sitemaps.mjs AND re-run the generator so
 * the static sitemaps reflect the new gate.
 */

export interface ProviderGatingInput {
  // All fields are optional + nullable so this interface accepts both
  // the on-disk JSONB shape (where missing fields come back as null) and
  // the in-memory `LocalProvider` shape from `src/lib/data.ts` (where
  // missing fields are `string | undefined` due to optional `?:`
  // declarations). Both `null` and `undefined` evaluate falsy in the
  // gate's `Boolean(x && ...)` checks below, so this widening is purely
  // a type accommodation — the runtime gate logic is unchanged.
  googleRating?: string | number | null;
  phone?: string | null;
  website?: string | null;
  description?: string | null;
  operatingHours?: Record<string, unknown> | null;
}

/**
 * A provider passes the sitemap/index gate if it has at least two of
 * the five enrichment signals. Fewer than two makes it a thin stub that
 * we neither submit to Google (sitemap exclusion) nor allow to be
 * indexed (page-level noindex).
 *
 * Signals:
 *   1. Google rating > 0
 *   2. Non-empty phone
 *   3. Non-empty website
 *   4. Description longer than 80 characters
 *   5. Non-empty operating hours object
 */
export function isEnrichedForSitemap(row: ProviderGatingInput): boolean {
  const fields = [
    Boolean(row.googleRating && Number(row.googleRating) > 0),
    Boolean(row.phone && String(row.phone).trim().length > 0),
    Boolean(row.website && String(row.website).trim().length > 0),
    Boolean(row.description && String(row.description).trim().length > 80),
    Boolean(
      row.operatingHours &&
        typeof row.operatingHours === "object" &&
        Object.keys(row.operatingHours).length > 0,
    ),
  ];
  return fields.filter(Boolean).length >= 2;
}
