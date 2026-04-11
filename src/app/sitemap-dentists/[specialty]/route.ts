/**
 * Per-specialty dentist sitemap — one child per dentist specialty,
 * served dynamically from a single Route Handler.
 *
 * URL pattern: /sitemap-dentists/[specialty]
 *
 * Examples:
 *   /sitemap-dentists/orthodontics
 *   /sitemap-dentists/periodontics
 *   /sitemap-dentists/endodontics
 *   /sitemap-dentists/general-practitioner
 *
 * Referenced by the sitemap-index at `/sitemap-dentists.xml` which lists
 * one child per distinct `specialty_slug` found in `professionals_index`
 * where `discipline='dentist'` and `status='active'`.
 *
 * Behaviour matches `/sitemap-doctors/[specialty]/route.ts`:
 *   - Rejects unknown specialty slugs with 404.
 *   - Caps at 49,000 URLs with ORDER BY updated_at DESC (dentist
 *     specialties are small — the largest in UAE is typically a
 *     few hundred).
 *   - Returns 404 when the specialty has zero active dentists.
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
          eq(professionalsIndex.discipline, "dentist"),
          eq(professionalsIndex.specialtySlug, specialtySlug),
          isNotNull(professionalsIndex.slug),
        ),
      )
      .orderBy(desc(professionalsIndex.updatedAt))
      .limit(MAX_URLS_PER_SITEMAP);

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
      `[sitemap-dentists/${specialtySlug}] Failed to generate:`,
      error,
    );
    return new Response(buildUrlset([]), { headers: SITEMAP_HEADERS });
  }
}
