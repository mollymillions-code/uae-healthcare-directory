import { db } from "@/lib/db";
import { providers } from "@/lib/db/schema";

export const revalidate = 3600; // regenerate at most once per hour

const BASE_URL = "https://www.zavis.ai";

export async function GET() {
  try {
    const rows = await db
      .select({
        slug: providers.slug,
        citySlug: providers.citySlug,
        categorySlug: providers.categorySlug,
        updatedAt: providers.updatedAt,
      })
      .from(providers);

    const entries: string[] = [];

    for (const row of rows) {
      const path = `/directory/${row.citySlug}/${row.categorySlug}/${row.slug}`;
      const lastmod = row.updatedAt.toISOString().split("T")[0];

      // English provider page
      entries.push(
        `  <url><loc>${BASE_URL}${path}</loc><lastmod>${lastmod}</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>`
      );

      // Arabic mirror
      entries.push(
        `  <url><loc>${BASE_URL}/ar${path}</loc><lastmod>${lastmod}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>`
      );
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join("\n")}\n</urlset>`;

    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("[sitemap-providers] Failed to generate:", error);
    return new Response("Service temporarily unavailable", {
      status: 503,
      headers: { "Retry-After": "3600" },
    });
  }
}
