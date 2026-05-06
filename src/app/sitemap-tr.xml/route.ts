import { db } from "@/lib/db";
import { providers } from "@/lib/db/schema";
import { eq, and, or, gt, isNotNull, sql } from "drizzle-orm";
import { CITIES } from "@/lib/constants/cities";
import { CATEGORIES } from "@/lib/constants/categories";
import { getBaseUrl } from "@/lib/helpers";

export const revalidate = 86400; // daily

const COUNTRY_CODE = "tr";

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

function pushUrl(entries: string[], loc: string, lastmod: string, priority = "0.7") {
  entries.push(
    `  <url>` +
      `<loc>${escapeXml(loc)}</loc>` +
      `<lastmod>${lastmod}</lastmod>` +
      `<changefreq>weekly</changefreq>` +
      `<priority>${priority}</priority>` +
      `</url>`
  );
}

export async function GET() {
  const baseUrl = getBaseUrl().replace(/\/+$/, "");

  try {
    const today = new Date().toISOString().split("T")[0];
    const entries: string[] = [];

    const countryCities = (
      CITIES as ReadonlyArray<{ slug: string; name: string; country: string }>
    ).filter((c) => c.country === COUNTRY_CODE);

    pushUrl(entries, `${baseUrl}/${COUNTRY_CODE}`, today, "0.8");
    pushUrl(entries, `${baseUrl}/${COUNTRY_CODE}/directory`, today, "0.7");

    for (const city of countryCities) {
      pushUrl(entries, `${baseUrl}/${COUNTRY_CODE}/directory/${city.slug}`, today);

      for (const cat of CATEGORIES) {
        pushUrl(
          entries,
          `${baseUrl}/${COUNTRY_CODE}/directory/${city.slug}/${cat.slug}`,
          today
        );
      }
    }

    pushUrl(entries, `${baseUrl}/${COUNTRY_CODE}/best`, today);

    for (const city of countryCities) {
      pushUrl(entries, `${baseUrl}/${COUNTRY_CODE}/best/${city.slug}`, today);
    }

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

    const structuralBestSet = new Set<string>();
    for (const city of countryCities) {
      structuralBestSet.add(`${city.slug}`);
    }

    const citiesWithBestSet = new Set<string>();
    for (const combo of ratedCombos) {
      if (combo.cnt >= 3 && combo.citySlug) {
        citiesWithBestSet.add(combo.citySlug);
      }
    }

    for (const citySlug of Array.from(citiesWithBestSet)) {
      if (!structuralBestSet.has(citySlug)) {
        pushUrl(entries, `${baseUrl}/${COUNTRY_CODE}/best/${citySlug}`, today);
      }
    }

    for (const combo of ratedCombos) {
      if (combo.cnt >= 3 && combo.citySlug && combo.categorySlug) {
        const key = `${combo.citySlug}/${combo.categorySlug}`;
        if (!structuralBestSet.has(key)) {
          pushUrl(
            entries,
            `${baseUrl}/${COUNTRY_CODE}/best/${combo.citySlug}/${combo.categorySlug}`,
            today,
            "0.8"
          );
        }
      }
    }

    const filterSegments = ["24-hour", "emergency", "walk-in"];
    for (const city of countryCities) {
      for (const segment of filterSegments) {
        pushUrl(
          entries,
          `${baseUrl}/${COUNTRY_CODE}/directory/${city.slug}/${segment}`,
          today
        );
      }
    }

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
      const lastmod = (row.updatedAt ?? new Date()).toISOString().split("T")[0];
      pushUrl(
        entries,
        `${baseUrl}/${COUNTRY_CODE}/directory/${row.citySlug}/${row.categorySlug}/${row.slug}`,
        lastmod,
        "0.8"
      );
    }

    if (entries.length === 0) {
      console.error("[sitemap-tr] No entries generated — returning 500");
      return new Response(buildXml([]), {
        status: 500,
        headers: SITEMAP_HEADERS,
      });
    }

    return new Response(buildXml(entries), { headers: SITEMAP_HEADERS });
  } catch (error) {
    console.error("[sitemap-tr] Failed to generate:", error);
    return new Response(buildXml([]), {
      status: 500,
      headers: SITEMAP_HEADERS,
    });
  }
}
