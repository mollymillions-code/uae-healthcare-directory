/**
 * Physician-only child sitemap. Referenced by /sitemap-doctors.xml (the
 * sitemap-index).
 *
 * Filters: status='active' AND discipline='physician' AND
 *          specialty_slug IS NOT NULL.
 *
 * Safety: capped at 49,000 URLs with ORDER BY updated_at DESC to stay
 * comfortably under Google's 50,000-URL cap even if the physicians index
 * grows past expectations. If the cap is ever hit, add further discipline-
 * or specialty-level splitting.
 */

import { db } from "@/lib/db";
import { professionalsIndex } from "@/lib/db/schema";
import { and, desc, eq, isNotNull } from "drizzle-orm";
import { getBaseUrl } from "@/lib/helpers";

export const revalidate = 3600;

const SITEMAP_HEADERS = {
  "Content-Type": "application/xml",
  "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
};

const MAX_URLS_PER_SITEMAP = 49_000;

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildXml(entries: string[]): string {
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
        slug: professionalsIndex.slug,
        specialtySlug: professionalsIndex.specialtySlug,
        updatedAt: professionalsIndex.updatedAt,
      })
      .from(professionalsIndex)
      .where(
        and(
          eq(professionalsIndex.status, "active"),
          eq(professionalsIndex.discipline, "physician"),
          isNotNull(professionalsIndex.specialtySlug),
        ),
      )
      .orderBy(desc(professionalsIndex.updatedAt))
      .limit(MAX_URLS_PER_SITEMAP);

    const entries: string[] = [];
    for (const row of rows) {
      if (!row.slug || !row.specialtySlug) continue;
      const loc = escapeXml(
        `${baseUrl}/find-a-doctor/${row.specialtySlug}/${row.slug}`,
      );
      const lastmod = (row.updatedAt ?? new Date())
        .toISOString()
        .split("T")[0];
      entries.push(
        `  <url>` +
          `<loc>${loc}</loc>` +
          `<lastmod>${lastmod}</lastmod>` +
          `<changefreq>monthly</changefreq>` +
          `<priority>0.6</priority>` +
          `</url>`,
      );
    }

    return new Response(buildXml(entries), { headers: SITEMAP_HEADERS });
  } catch (error) {
    console.error("[sitemap-doctors-physicians] Failed to generate:", error);
    return new Response(buildXml([]), { headers: SITEMAP_HEADERS });
  }
}
