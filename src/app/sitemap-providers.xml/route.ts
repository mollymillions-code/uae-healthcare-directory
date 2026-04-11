import { db } from "@/lib/db";
import { providers } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { getBaseUrl } from "@/lib/helpers";

export const revalidate = 3600; // regenerate at most once per hour

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

// Keep this gate in sync with the listing page's `isEnriched` check in
// `src/app/(directory)/directory/[city]/[...segments]/page.tsx` (case "listing").
// A provider must hit at least 2 of these signals to be considered non-thin
// and included in the sitemap. Providers that fail this gate are already
// `robots: { index: false }` on their page; emitting their URL here would be
// a crawl-vs-index contradiction that erodes GSC sitemap trust.
// See Item 0 of docs/zocdoc-plans-reconciled.md.
function isEnrichedForSitemap(row: {
  googleRating: string | null;
  phone: string | null;
  website: string | null;
  description: string | null;
  operatingHours: Record<string, { open: string; close: string }> | null;
}): boolean {
  const fields = [
    Boolean(row.googleRating && Number(row.googleRating) > 0),
    Boolean(row.phone && row.phone.trim().length > 0),
    Boolean(row.website && row.website.trim().length > 0),
    Boolean(row.description && row.description.trim().length > 80),
    Boolean(row.operatingHours && Object.keys(row.operatingHours).length > 0),
  ];
  return fields.filter(Boolean).length >= 2;
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
