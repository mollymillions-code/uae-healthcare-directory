import { db } from "@/lib/db";
import { providers } from "@/lib/db/schema";
import { eq, and, or, gt, isNotNull, sql } from "drizzle-orm";
import { CITIES } from "@/lib/constants/cities";
import { CATEGORIES } from "@/lib/constants/categories";
import { getBaseUrl } from "@/lib/helpers";

export const revalidate = 86400; // daily

const COUNTRY_CODE = "kw";

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

const SITEMAP_HEADERS = {
  "Content-Type": "application/xml",
  "Cache-Control": "public, max-age=86400, stale-while-revalidate=172800",
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
    const today = new Date().toISOString().split("T")[0];
    const entries: string[] = [];

    // --- Structural pages from constants ---

    const countryCities = (
      CITIES as ReadonlyArray<{ slug: string; name: string; country: string }>
    ).filter((c) => c.country === COUNTRY_CODE);

    // Country directory home: /{country}/directory
    const countryUrl = escapeXml(`${baseUrl}/${COUNTRY_CODE}/directory`);
    entries.push(
      `  <url>` +
        `<loc>${countryUrl}</loc>` +
        `<lastmod>${today}</lastmod>` +
        `<changefreq>weekly</changefreq>` +
        `<priority>0.7</priority>` +
        `</url>`
    );

    // Each city page + city+category combos
    for (const city of countryCities) {
      const cityUrl = escapeXml(
        `${baseUrl}/${COUNTRY_CODE}/directory/${city.slug}`
      );
      entries.push(
        `  <url>` +
          `<loc>${cityUrl}</loc>` +
          `<lastmod>${today}</lastmod>` +
          `<changefreq>weekly</changefreq>` +
          `<priority>0.7</priority>` +
          `</url>`
      );

      for (const cat of CATEGORIES) {
        const catUrl = escapeXml(
          `${baseUrl}/${COUNTRY_CODE}/directory/${city.slug}/${cat.slug}`
        );
        entries.push(
          `  <url>` +
            `<loc>${catUrl}</loc>` +
            `<lastmod>${today}</lastmod>` +
            `<changefreq>weekly</changefreq>` +
            `<priority>0.7</priority>` +
            `</url>`
        );
      }
    }

    // --- Best pages (structural from constants) ---

    // Country best index: /{country}/best
    const bestIndexUrl = escapeXml(`${baseUrl}/${COUNTRY_CODE}/best`);
    entries.push(
      `  <url>` +
        `<loc>${bestIndexUrl}</loc>` +
        `<lastmod>${today}</lastmod>` +
        `<changefreq>weekly</changefreq>` +
        `<priority>0.7</priority>` +
        `</url>`
    );

    // City best pages + city+category best combos from constants
    for (const city of countryCities) {
      const cityBestUrl = escapeXml(
        `${baseUrl}/${COUNTRY_CODE}/best/${city.slug}`
      );
      entries.push(
        `  <url>` +
          `<loc>${cityBestUrl}</loc>` +
          `<lastmod>${today}</lastmod>` +
          `<changefreq>weekly</changefreq>` +
          `<priority>0.7</priority>` +
          `</url>`
      );

      for (const cat of CATEGORIES) {
        const catBestUrl = escapeXml(
          `${baseUrl}/${COUNTRY_CODE}/best/${city.slug}/${cat.slug}`
        );
        entries.push(
          `  <url>` +
            `<loc>${catBestUrl}</loc>` +
            `<lastmod>${today}</lastmod>` +
            `<changefreq>weekly</changefreq>` +
            `<priority>0.8</priority>` +
            `</url>`
        );
      }
    }

    // --- Best pages (DB-backed: only combos with >= 3 rated providers) ---

    const ratedCombos = await db
      .select({
        citySlug: providers.citySlug,
        categorySlug: providers.categorySlug,
        cnt: sql<number>`count(*)`.as("cnt"),
      })
      .from(providers)
      .where(
        and(
          eq(providers.status, "active"),
          eq(providers.country, COUNTRY_CODE),
          gt(providers.googleRating, "0")
        )
      )
      .groupBy(providers.citySlug, providers.categorySlug);

    // Collect structural best paths for deduplication
    const structuralBestSet = new Set<string>();
    for (const city of countryCities) {
      structuralBestSet.add(`${city.slug}`);
      for (const cat of CATEGORIES) {
        structuralBestSet.add(`${city.slug}/${cat.slug}`);
      }
    }

    // Add DB-only combos not already covered by structural constants
    const citiesWithBestSet = new Set<string>();
    for (const combo of ratedCombos) {
      if (combo.cnt >= 3 && combo.citySlug) {
        citiesWithBestSet.add(combo.citySlug);
      }
    }

    for (const citySlug of Array.from(citiesWithBestSet)) {
      if (!structuralBestSet.has(citySlug)) {
        const cityBestUrl = escapeXml(
          `${baseUrl}/${COUNTRY_CODE}/best/${citySlug}`
        );
        entries.push(
          `  <url>` +
            `<loc>${cityBestUrl}</loc>` +
            `<lastmod>${today}</lastmod>` +
            `<changefreq>weekly</changefreq>` +
            `<priority>0.7</priority>` +
            `</url>`
        );
      }
    }

    for (const combo of ratedCombos) {
      if (combo.cnt >= 3 && combo.citySlug && combo.categorySlug) {
        const key = `${combo.citySlug}/${combo.categorySlug}`;
        if (!structuralBestSet.has(key)) {
          const comboBestUrl = escapeXml(
            `${baseUrl}/${COUNTRY_CODE}/best/${combo.citySlug}/${combo.categorySlug}`
          );
          entries.push(
            `  <url>` +
              `<loc>${comboBestUrl}</loc>` +
              `<lastmod>${today}</lastmod>` +
              `<changefreq>weekly</changefreq>` +
              `<priority>0.8</priority>` +
              `</url>`
          );
        }
      }
    }

    // --- Individual provider pages from DB ---

    // Only include providers that pass richness check (exclude name-only stubs)
    const rows = await db
      .select({
        slug: providers.slug,
        citySlug: providers.citySlug,
        categorySlug: providers.categorySlug,
        updatedAt: providers.updatedAt,
      })
      .from(providers)
      .where(
        and(
          eq(providers.status, "active"),
          eq(providers.country, COUNTRY_CODE),
          or(
            gt(providers.googleRating, "0"),
            isNotNull(providers.phone),
            isNotNull(providers.website)
          )
        )
      );

    for (const row of rows) {
      if (!row.slug || !row.citySlug || !row.categorySlug) continue;
      const path = `/${COUNTRY_CODE}/directory/${row.citySlug}/${row.categorySlug}/${row.slug}`;
      const lastmod = (row.updatedAt ?? new Date())
        .toISOString()
        .split("T")[0];
      const providerUrl = escapeXml(`${baseUrl}${path}`);

      entries.push(
        `  <url>` +
          `<loc>${providerUrl}</loc>` +
          `<lastmod>${lastmod}</lastmod>` +
          `<changefreq>monthly</changefreq>` +
          `<priority>0.8</priority>` +
          `</url>`
      );
    }

    if (entries.length === 0) {
      console.error(
        "[sitemap-kw] No entries generated — returning 500"
      );
      return new Response(buildXml([]), {
        status: 500,
        headers: SITEMAP_HEADERS,
      });
    }

    return new Response(buildXml(entries), { headers: SITEMAP_HEADERS });
  } catch (error) {
    console.error("[sitemap-kw] Failed to generate:", error);
    return new Response(buildXml([]), {
      status: 500,
      headers: SITEMAP_HEADERS,
    });
  }
}
