/**
 * Sitemap INDEX for `/find-a-doctor/[specialty]/[doctor]` profile pages
 * — DENTISTS ONLY. Physicians have their own parallel structure at
 * `/sitemap-doctors.xml`.
 *
 * This file lists one child-sitemap entry per dentist specialty. Each
 * child is served dynamically by the Route Handler at
 * `src/app/sitemap-dentists/[specialty]/route.ts`, which emits a
 * discipline-scoped, specialty-scoped urlset.
 *
 * Hierarchy:
 *
 *   /sitemap-dentists.xml                 — this file (index)
 *   └── /sitemap-dentists/orthodontics    — urlset (all active orthodontists)
 *   └── /sitemap-dentists/periodontics    — urlset
 *   └── /sitemap-dentists/endodontics     — urlset
 *   └── /sitemap-dentists/<specialty>     — ...
 *
 * Specialties are discovered live from the `professionals_index` table
 * so the index automatically grows with the data.
 *
 * Safe when the table is empty — returns an empty `<sitemapindex>` with
 * a 200 response. No 500s.
 */

import { db } from "@/lib/db";
import { professionalsIndex } from "@/lib/db/schema";
import { and, eq, isNotNull, sql } from "drizzle-orm";
import { getBaseUrl } from "@/lib/helpers";

export const revalidate = 3600;

const SITEMAP_HEADERS = {
  "Content-Type": "application/xml",
  "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
};

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildSitemapIndex(entries: string[]): string {
  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    entries.join("\n") +
    `\n</sitemapindex>`
  );
}

export async function GET() {
  const baseUrl = getBaseUrl().replace(/\/+$/, "");

  try {
    const rows = await db
      .select({
        specialtySlug: professionalsIndex.specialtySlug,
        lastUpdated: sql<Date>`max(${professionalsIndex.updatedAt})`,
      })
      .from(professionalsIndex)
      .where(
        and(
          eq(professionalsIndex.status, "active"),
          eq(professionalsIndex.discipline, "dentist"),
          isNotNull(professionalsIndex.specialtySlug),
        ),
      )
      .groupBy(professionalsIndex.specialtySlug)
      .orderBy(professionalsIndex.specialtySlug);

    const entries: string[] = [];
    for (const row of rows) {
      if (!row.specialtySlug) continue;
      const loc = escapeXml(
        `${baseUrl}/sitemap-dentists/${row.specialtySlug}`,
      );
      const lastmod = (row.lastUpdated ?? new Date())
        .toISOString()
        .split("T")[0];
      entries.push(
        `  <sitemap>` +
          `<loc>${loc}</loc>` +
          `<lastmod>${lastmod}</lastmod>` +
          `</sitemap>`,
      );
    }

    return new Response(buildSitemapIndex(entries), { headers: SITEMAP_HEADERS });
  } catch (error) {
    console.error("[sitemap-dentists.xml] Failed to generate index:", error);
    return new Response(buildSitemapIndex([]), { headers: SITEMAP_HEADERS });
  }
}
