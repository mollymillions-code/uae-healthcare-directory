/**
 * src/app/sitemap-reports.xml/route.ts
 *
 * Dedicated sitemap for the Item 6 report scaffold
 * (Zocdoc roadmap — "What UAE Patients Want" annual reports).
 *
 * This file is intentionally separate from `src/app/sitemap.ts` because
 * Item 6's build constraints forbid touching the main sitemap. The main
 * sitemap is synchronous (it only reads constants); this route handler
 * is async so it can hit the DB and gate on `status='published'`.
 *
 * Remember to register this path in `src/app/robots.ts` so crawlers
 * discover it alongside the existing sitemap indices.
 *
 * Gating rules:
 *   - Only `status='published'` rows are emitted.
 *   - Every emitted URL has an <xhtml:link rel=alternate> for en + ar so
 *     Google picks up the bilingual mirror.
 *   - The hub (`/intelligence/reports`) and press room (`/intelligence/press`)
 *     pages are always emitted, regardless of published count — they are
 *     static and carry their own SEO value.
 */

import { db } from "@/lib/db";
import { reports } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
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

function buildXml(entries: string[]) {
  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n` +
    entries.join("\n") +
    `\n</urlset>`
  );
}

function urlNode({
  loc,
  lastmod,
  changefreq,
  priority,
  alternates,
}: {
  loc: string;
  lastmod: string;
  changefreq: string;
  priority: string;
  alternates: Array<{ hreflang: string; href: string }>;
}): string {
  const alts = alternates
    .map(
      (a) =>
        `    <xhtml:link rel="alternate" hreflang="${escapeXml(a.hreflang)}" href="${escapeXml(a.href)}"/>`
    )
    .join("\n");
  return (
    `  <url>\n` +
    `    <loc>${escapeXml(loc)}</loc>\n` +
    `    <lastmod>${escapeXml(lastmod)}</lastmod>\n` +
    `    <changefreq>${escapeXml(changefreq)}</changefreq>\n` +
    `    <priority>${escapeXml(priority)}</priority>\n` +
    (alts ? `${alts}\n` : "") +
    `  </url>`
  );
}

function toIsoDate(v: Date | string | null | undefined): string {
  if (!v) return new Date().toISOString().slice(0, 10);
  if (typeof v === "string") return v.length >= 10 ? v.slice(0, 10) : v;
  return v.toISOString().slice(0, 10);
}

export async function GET() {
  const baseUrl = getBaseUrl().replace(/\/+$/, "");
  const entries: string[] = [];
  const lastmod = new Date().toISOString().slice(0, 10);

  // Static hubs — always emitted.
  entries.push(
    urlNode({
      loc: `${baseUrl}/intelligence/reports`,
      lastmod,
      changefreq: "weekly",
      priority: "0.9",
      alternates: [
        { hreflang: "en", href: `${baseUrl}/intelligence/reports` },
        { hreflang: "ar", href: `${baseUrl}/ar/intelligence/reports` },
        { hreflang: "x-default", href: `${baseUrl}/intelligence/reports` },
      ],
    })
  );
  entries.push(
    urlNode({
      loc: `${baseUrl}/ar/intelligence/reports`,
      lastmod,
      changefreq: "weekly",
      priority: "0.7",
      alternates: [
        { hreflang: "en", href: `${baseUrl}/intelligence/reports` },
        { hreflang: "ar", href: `${baseUrl}/ar/intelligence/reports` },
        { hreflang: "x-default", href: `${baseUrl}/intelligence/reports` },
      ],
    })
  );
  entries.push(
    urlNode({
      loc: `${baseUrl}/intelligence/press`,
      lastmod,
      changefreq: "weekly",
      priority: "0.7",
      alternates: [
        { hreflang: "en", href: `${baseUrl}/intelligence/press` },
        { hreflang: "x-default", href: `${baseUrl}/intelligence/press` },
      ],
    })
  );

  // Published reports only — drafts are not indexed.
  try {
    if (process.env.DATABASE_URL) {
      const rows = await db
        .select({
          slug: reports.slug,
          releaseDate: reports.releaseDate,
          updatedAt: reports.updatedAt,
        })
        .from(reports)
        .where(eq(reports.status, "published"))
        .orderBy(desc(reports.releaseDate));

      for (const row of rows) {
        const lm = toIsoDate(row.updatedAt || row.releaseDate);
        entries.push(
          urlNode({
            loc: `${baseUrl}/intelligence/reports/${row.slug}`,
            lastmod: lm,
            changefreq: "monthly",
            priority: "0.8",
            alternates: [
              {
                hreflang: "en",
                href: `${baseUrl}/intelligence/reports/${row.slug}`,
              },
              {
                hreflang: "ar",
                href: `${baseUrl}/ar/intelligence/reports/${row.slug}`,
              },
              {
                hreflang: "x-default",
                href: `${baseUrl}/intelligence/reports/${row.slug}`,
              },
            ],
          })
        );
        entries.push(
          urlNode({
            loc: `${baseUrl}/ar/intelligence/reports/${row.slug}`,
            lastmod: lm,
            changefreq: "monthly",
            priority: "0.6",
            alternates: [
              {
                hreflang: "en",
                href: `${baseUrl}/intelligence/reports/${row.slug}`,
              },
              {
                hreflang: "ar",
                href: `${baseUrl}/ar/intelligence/reports/${row.slug}`,
              },
              {
                hreflang: "x-default",
                href: `${baseUrl}/intelligence/reports/${row.slug}`,
              },
            ],
          })
        );
      }
    }
  } catch (e: unknown) {
    // Degrade gracefully — still emit the static hub entries.
    console.error(
      "[sitemap-reports] DB error:",
      e instanceof Error ? e.message : e
    );
  }

  return new Response(buildXml(entries), { headers: SITEMAP_HEADERS });
}
