import { db } from "@/lib/db";
import { journalArticles } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
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
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    entries.join("\n") +
    `\n</urlset>`
  );
}

export async function GET() {
  const baseUrl = getBaseUrl().replace(/\/+$/, "");
  try {
    const rows = await db
      .select({
        slug: journalArticles.slug,
        updatedAt: journalArticles.updatedAt,
        publishedAt: journalArticles.publishedAt,
      })
      .from(journalArticles)
      .where(eq(journalArticles.status, "published"))
      .orderBy(desc(journalArticles.publishedAt));

    const entries: string[] = [];

    for (const row of rows) {
      if (!row.slug) continue;
      const lastmod = (row.updatedAt ?? row.publishedAt ?? new Date())
        .toISOString()
        .split("T")[0];
      entries.push(
        `  <url>` +
          `<loc>${escapeXml(`${baseUrl}/intelligence/${row.slug}`)}</loc>` +
          `<lastmod>${lastmod}</lastmod>` +
          `<changefreq>weekly</changefreq>` +
          `<priority>0.8</priority>` +
          `</url>`
      );
    }

    if (entries.length === 0) {
      console.error("[sitemap-intelligence] Query returned 0 results — returning 500");
      return new Response(buildXml([]), { status: 500, headers: SITEMAP_HEADERS });
    }

    return new Response(buildXml(entries), { headers: SITEMAP_HEADERS });
  } catch (error) {
    console.error("[sitemap-intelligence] Failed to generate:", error);
    return new Response(buildXml([]), { status: 500, headers: SITEMAP_HEADERS });
  }
}
