import { db } from "@/lib/db";
import { providers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getBaseUrl } from "@/lib/helpers";

export const revalidate = 3600; // regenerate at most once per hour

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
      })
      .from(providers)
      .where(eq(providers.status, "active"));

    const entries: string[] = [];

    for (const row of rows) {
      if (!row.slug || !row.citySlug || !row.categorySlug) continue;
      const path = `/directory/${row.citySlug}/${row.categorySlug}/${row.slug}`;
      const lastmod = (row.updatedAt ?? new Date()).toISOString().split("T")[0];
      const enUrl = `${baseUrl}${path}`;
      const arUrl = `${baseUrl}/ar${path}`;

      // English page with hreflang alternates
      entries.push(
        `  <url>` +
          `<loc>${enUrl}</loc>` +
          `<lastmod>${lastmod}</lastmod>` +
          `<changefreq>monthly</changefreq>` +
          `<priority>0.8</priority>` +
          `<xhtml:link rel="alternate" hreflang="en" href="${enUrl}"/>` +
          `<xhtml:link rel="alternate" hreflang="ar" href="${arUrl}"/>` +
          `</url>`
      );

      // Arabic mirror with hreflang alternates
      entries.push(
        `  <url>` +
          `<loc>${arUrl}</loc>` +
          `<lastmod>${lastmod}</lastmod>` +
          `<changefreq>monthly</changefreq>` +
          `<priority>0.7</priority>` +
          `<xhtml:link rel="alternate" hreflang="en" href="${enUrl}"/>` +
          `<xhtml:link rel="alternate" hreflang="ar" href="${arUrl}"/>` +
          `</url>`
      );
    }

    return new Response(buildXml(entries), { headers: SITEMAP_HEADERS });
  } catch (error) {
    console.error("[sitemap-providers] Failed to generate:", error);
    return new Response(buildXml([]), { status: 200, headers: SITEMAP_HEADERS });
  }
}
