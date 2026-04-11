/**
 * Sitemap INDEX for /find-a-doctor/ profile pages.
 *
 * After the user scoped to physicians + dentists only, the combined count
 * lands at ~65-75k rows — above Google's 50,000-URLs-per-sitemap cap. This
 * file is now a sitemap-index that points at two discipline-split child
 * sitemaps, each comfortably under the cap:
 *
 *   - /sitemap-doctors-physicians.xml  (~50k)
 *   - /sitemap-doctors-dentists.xml    (~15k)
 *
 * Registered in src/app/robots.ts under the sitemaps list.
 *
 * This file is intentionally NEW and does not touch src/app/sitemap.ts,
 * which is owned by Item 0 and Item 1 patcher in the Zocdoc roadmap.
 */

import { getBaseUrl } from "@/lib/helpers";

export const revalidate = 3600;

const SITEMAP_HEADERS = {
  "Content-Type": "application/xml",
  "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
};

export async function GET() {
  const baseUrl = getBaseUrl().replace(/\/+$/, "");
  const today = new Date().toISOString().split("T")[0];

  const childSitemaps = [
    `${baseUrl}/sitemap-doctors-physicians.xml`,
    `${baseUrl}/sitemap-doctors-dentists.xml`,
  ];

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    childSitemaps
      .map(
        (loc) =>
          `  <sitemap>\n` +
          `    <loc>${loc}</loc>\n` +
          `    <lastmod>${today}</lastmod>\n` +
          `  </sitemap>`,
      )
      .join("\n") +
    `\n</sitemapindex>`;

  return new Response(xml, { headers: SITEMAP_HEADERS });
}
