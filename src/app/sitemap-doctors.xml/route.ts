/**
 * Sitemap INDEX for `/find-a-doctor/[specialty]/[doctor]` profile pages
 * — PHYSICIANS ONLY. Dentists have their own parallel structure at
 * `/sitemap-dentists.xml`.
 *
 * This file lists one child-sitemap entry per physician specialty. Each
 * child is served dynamically by the Route Handler at
 * `src/app/sitemap-doctors/[specialty]/route.ts`, which emits a
 * discipline-scoped, specialty-scoped urlset.
 *
 * Hierarchy:
 *
 *   /sitemap-doctors.xml                 — this file (index)
 *   └── /sitemap-doctors/cardiology      — urlset (all active cardiologists)
 *   └── /sitemap-doctors/dermatology     — urlset
 *   └── /sitemap-doctors/neurology       — urlset
 *   └── /sitemap-doctors/<specialty>     — ...
 *
 * Why per-specialty children instead of one big physicians sitemap:
 *   1. Stays under Google's 50k-URL-per-sitemap cap even if one
 *      specialty grows beyond expectations (each specialty is typically
 *      50-5,000 providers in the UAE).
 *   2. Granular re-crawl signaling — when DHA refreshes cardiology
 *      license data, only the cardiology child's `<lastmod>` changes.
 *      Googlebot recrawls just that child.
 *   3. Easier to debug — if GSC flags an indexing issue, we can see
 *      which specialty has the problem.
 *   4. Mirrors the `/find-a-doctor/[specialty]/...` URL structure, so
 *      the sitemap hierarchy reflects the site hierarchy.
 *
 * Specialties are discovered live from the `professionals_index` table
 * so the index automatically grows with the data (no hardcoded list to
 * maintain).
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
    // Pull the distinct list of physician specialties that currently have
    // at least one active profile. Also get max(updated_at) per specialty
    // so the index's per-child `<lastmod>` reflects the freshness of
    // each specialty's underlying data.
    const rows = await db
      .select({
        specialtySlug: professionalsIndex.specialtySlug,
        lastUpdated: sql<Date>`max(${professionalsIndex.updatedAt})`,
      })
      .from(professionalsIndex)
      .where(
        and(
          eq(professionalsIndex.status, "active"),
          eq(professionalsIndex.discipline, "physician"),
          isNotNull(professionalsIndex.specialtySlug),
        ),
      )
      .groupBy(professionalsIndex.specialtySlug)
      .orderBy(professionalsIndex.specialtySlug);

    const entries: string[] = [];
    for (const row of rows) {
      if (!row.specialtySlug) continue;
      const loc = escapeXml(
        `${baseUrl}/sitemap-doctors/${row.specialtySlug}`,
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
    console.error("[sitemap-doctors.xml] Failed to generate index:", error);
    // Empty sitemap-index is valid — Googlebot retries periodically.
    return new Response(buildSitemapIndex([]), { headers: SITEMAP_HEADERS });
  }
}
