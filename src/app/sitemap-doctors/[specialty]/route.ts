/**
 * Per-specialty physician sitemap — one child per physician specialty,
 * served dynamically from a single Route Handler.
 *
 * URL pattern: /sitemap-doctors/[specialty]
 *
 * Examples:
 *   /sitemap-doctors/cardiology
 *   /sitemap-doctors/dermatology
 *   /sitemap-doctors/general-practitioner
 *
 * Referenced by the sitemap-index at `/sitemap-doctors.xml` which lists
 * one child per distinct `specialty_slug` found in `professionals_index`
 * where `discipline='physician'` and `status='active'`.
 *
 * This route:
 *   - Validates the specialty slug exists in the DB before emitting
 *     (prevents crawlers from guessing random URLs).
 *   - Returns 404 on unknown specialties — Google treats this as a
 *     drop signal.
 *   - Caps at 49,000 URLs with ORDER BY updated_at DESC. If any single
 *     physician specialty ever grows past this (unlikely — the largest
 *     DHA physician specialty is ~5,000 entries), we add a second-level
 *     shard keyed on DHA ID range.
 *   - Emits `application/xml` Content-Type so Google parses it as a
 *     sitemap regardless of the URL suffix.
 *
 * Safe when the table is empty or the specialty is missing — returns
 * 404 instead of an empty urlset, so GSC drops the submitted URL
 * cleanly.
 */

import { db } from "@/lib/db";
import { professionalsIndex } from "@/lib/db/schema";
import { and, desc, eq, isNotNull } from "drizzle-orm";
import { getBaseUrl } from "@/lib/helpers";

export const revalidate = 3600;
export const dynamicParams = true;

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

function buildUrlset(entries: string[]): string {
  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    entries.join("\n") +
    `\n</urlset>`
  );
}

interface Params {
  params: { specialty: string };
}

export async function GET(_req: Request, { params }: Params) {
  const baseUrl = getBaseUrl().replace(/\/+$/, "");
  const specialtySlug = params.specialty;

  // Basic hygiene — reject obviously-bad input before hitting the DB.
  if (!specialtySlug || !/^[a-z0-9-]+$/.test(specialtySlug)) {
    return new Response("Not Found", { status: 404 });
  }

  try {
    const rows = await db
      .select({
        slug: professionalsIndex.slug,
        updatedAt: professionalsIndex.updatedAt,
      })
      .from(professionalsIndex)
      .where(
        and(
          eq(professionalsIndex.status, "active"),
          eq(professionalsIndex.discipline, "physician"),
          eq(professionalsIndex.specialtySlug, specialtySlug),
          isNotNull(professionalsIndex.slug),
        ),
      )
      .orderBy(desc(professionalsIndex.updatedAt))
      .limit(MAX_URLS_PER_SITEMAP);

    // If no physicians exist for this specialty yet, 404 — do not emit
    // an empty urlset. The sitemap-index will stop listing us on next
    // revalidate anyway.
    if (rows.length === 0) {
      return new Response("Not Found", { status: 404 });
    }

    const entries: string[] = [];
    for (const row of rows) {
      if (!row.slug) continue;
      const loc = escapeXml(
        `${baseUrl}/find-a-doctor/${specialtySlug}/${row.slug}`,
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

    return new Response(buildUrlset(entries), { headers: SITEMAP_HEADERS });
  } catch (error) {
    console.error(
      `[sitemap-doctors/${specialtySlug}] Failed to generate:`,
      error,
    );
    // On DB error, return an empty urlset with 200 so Googlebot retries
    // instead of treating the sitemap as permanently broken.
    return new Response(buildUrlset([]), { headers: SITEMAP_HEADERS });
  }
}
