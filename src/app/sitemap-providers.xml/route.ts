// ─── RETIRED (as of 2026-04-12) — Nginx serves /sitemap-providers.xml statically ───
//
// This handler still exists in code as a safety fallback in case the
// Nginx `location = /sitemap-providers.xml` block is ever removed or the
// static artifact at /home/ubuntu/zavis-shared/sitemaps/providers-index.xml
// is missing. In steady state, requests never reach this route because
// Nginx intercepts them before they hit Next.js.
//
// The permanent architecture lives in:
//   - docs/seo/static-provider-sitemap-architecture-spec.md (design)
//   - scripts/generate-provider-sitemaps.mjs                (generator)
//
// Per spec §11.3 the preferred end state is to delete this file entirely,
// but the spec also allows leaving it in place for one deploy with a
// retirement comment — which is what this comment is. Once the next
// deploy completes cleanly and the Nginx static path is confirmed in
// production, this file and its Arabic twin should be removed in a
// follow-up commit.
//
// NOTE: the thin-content gate now lives in src/lib/sitemap-gating.ts so
// this handler, the Arabic handler, the generator script, and the
// listing-page `robots: { index: false }` decision all agree on one
// source of truth. See spec §8.2.
//
// ────────────────────────────────────────────────────────────────────────
import { db } from "@/lib/db";
import { providers } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { getBaseUrl } from "@/lib/helpers";
import { isEnrichedForSitemap } from "@/lib/sitemap-gating";

export const revalidate = 3600; // regenerate at most once per hour (fallback only)

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const SITEMAP_HEADERS = {
  "Content-Type": "application/xml",
  "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
};

function buildXml(entries: string[]) {
  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n` +
    entries.join("\n") +
    `\n</urlset>`
  );
}

export async function GET() {
  const baseUrl = getBaseUrl().replace(/\/+$/, "");
  try {
    const rows = await db
      .select({
        slug: providers.slug,
        citySlug: providers.citySlug,
        categorySlug: providers.categorySlug,
        updatedAt: providers.updatedAt,
        googleRating: providers.googleRating,
        phone: providers.phone,
        website: providers.website,
        description: providers.description,
        operatingHours: providers.operatingHours,
      })
      .from(providers)
      .where(
        and(
          eq(providers.status, "active"),
          // UAE-only: prevent GCC providers (qa/sa/bh/kw) from leaking
          // into the UAE sitemap under the /directory/[city]/... URL space.
          eq(providers.country, "ae"),
        ),
      );

    const entries: string[] = [];
    let skippedThin = 0;

    for (const row of rows) {
      if (!row.slug || !row.citySlug || !row.categorySlug) continue;

      // Thin-content gate: excludes providers whose listing page emits
      // `robots: { index: false }` so we don't submit noindexed URLs.
      if (!isEnrichedForSitemap(row)) {
        skippedThin += 1;
        continue;
      }

      const path = `/directory/${row.citySlug}/${row.categorySlug}/${row.slug}`;
      const lastmod = (row.updatedAt ?? new Date()).toISOString().split("T")[0];
      const enUrl = escapeXml(`${baseUrl}${path}`);
      const arUrl = escapeXml(`${baseUrl}/ar${path}`);

      // English page with hreflang alternates
      entries.push(
        `  <url>` +
          `<loc>${enUrl}</loc>` +
          `<lastmod>${lastmod}</lastmod>` +
          `<changefreq>monthly</changefreq>` +
          `<priority>0.8</priority>` +
          `<xhtml:link rel="alternate" hreflang="en-AE" href="${enUrl}"/>` +
          `<xhtml:link rel="alternate" hreflang="ar-AE" href="${arUrl}"/>` +
          `<xhtml:link rel="alternate" hreflang="x-default" href="${enUrl}"/>` +
          `</url>`
      );
    }

    if (entries.length === 0) {
      console.error(
        `[sitemap-providers] Query returned 0 indexable results ` +
          `(skipped ${skippedThin} thin providers) — returning 500`
      );
      return new Response(buildXml([]), { status: 500, headers: SITEMAP_HEADERS });
    }

    console.log(
      `[sitemap-providers] emitted ${entries.length} urls, skipped ${skippedThin} thin providers`
    );
    return new Response(buildXml(entries), { headers: SITEMAP_HEADERS });
  } catch (error) {
    console.error("[sitemap-providers] Failed to generate:", error);
    return new Response(buildXml([]), { status: 500, headers: SITEMAP_HEADERS });
  }
}
