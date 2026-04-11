/**
 * seo-neighborhoods.ts
 * ---------------------------------------------------------------------------
 * Zocdoc roadmap Item 3 — Schema.org helpers for neighborhood hub pages.
 *
 * Lives in its own file (NOT `src/lib/seo.ts`) so Item 2's JSON-LD generator
 * enhancements can evolve `seo.ts` without merge conflicts. Export one public
 * function: `neighborhoodHubSchema()`.
 *
 * Emits an array of schema.org nodes suitable for direct injection via
 * `<JsonLd data={...} />`:
 *   - CollectionPage    — the hub page itself
 *   - ItemList          — top N providers with positions
 *   - BreadcrumbList    — Home → City → Area (→ Category)
 *   - FAQPage           — 4 bilingual-aware FAQs
 *   - Place             — geo + alternate name so Google shows the area
 *                         as a geographic entity, not a generic webpage
 *
 * Trust discipline (from `.ai-collab/ZOCDOC-ROADMAP-IMPLEMENTATION.md` Item 0):
 *   - NEVER emits `isAcceptingNewPatients` or invented availability claims.
 *   - NEVER emits `AggregateRating` unless the provider has `googleReviewCount >= 3`.
 *   - Only asserts bilingual names when `nameAr` is actually present.
 *   - Gracefully degrades: if `totalCount === 0`, returns only the metadata
 *     nodes (CollectionPage + BreadcrumbList) so the page still validates.
 * ---------------------------------------------------------------------------
 */

import type { LocalCity, LocalCategory, LocalProvider, LocalArea } from "./data";
import { truncateDescription, truncateTitle } from "./seo";

type JsonLdNode = Record<string, unknown>;

function asUrl(baseUrl: string, path: string): string {
  const stripped = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const rel = path.startsWith("/") ? path : `/${path}`;
  return `${stripped}${rel}`;
}

function neighborhoodPath(
  citySlug: string,
  areaSlug: string,
  categorySlug?: string | null
): string {
  return categorySlug
    ? `/directory/${citySlug}/${areaSlug}/${categorySlug}`
    : `/directory/${citySlug}/${areaSlug}`;
}

function buildBreadcrumb(
  baseUrl: string,
  city: LocalCity,
  area: LocalArea,
  category: LocalCategory | null
): JsonLdNode {
  const items: JsonLdNode[] = [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: { "@type": "WebPage", "@id": asUrl(baseUrl, "/") },
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Directory",
      item: { "@type": "WebPage", "@id": asUrl(baseUrl, "/directory") },
    },
    {
      "@type": "ListItem",
      position: 3,
      name: city.name,
      item: {
        "@type": "WebPage",
        "@id": asUrl(baseUrl, `/directory/${city.slug}`),
      },
    },
    {
      "@type": "ListItem",
      position: 4,
      name: area.name,
      item: {
        "@type": "WebPage",
        "@id": asUrl(baseUrl, neighborhoodPath(city.slug, area.slug)),
      },
    },
  ];

  if (category) {
    items.push({
      "@type": "ListItem",
      position: 5,
      name: category.name,
      item: {
        "@type": "WebPage",
        "@id": asUrl(
          baseUrl,
          neighborhoodPath(city.slug, area.slug, category.slug)
        ),
      },
    });
  }

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items,
  };
}

function buildItemList(
  baseUrl: string,
  city: LocalCity,
  providers: LocalProvider[]
): JsonLdNode {
  const elements = providers.slice(0, 10).map((p, idx) => ({
    "@type": "ListItem",
    position: idx + 1,
    url: asUrl(
      baseUrl,
      `/directory/${city.slug}/${p.categorySlug}/${p.slug}`
    ),
    name: p.name,
  }));

  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListOrder: "https://schema.org/ItemListOrderDescending",
    numberOfItems: elements.length,
    itemListElement: elements,
  };
}

function buildPlace(
  baseUrl: string,
  city: LocalCity,
  area: LocalArea
): JsonLdNode {
  const lat = Number(area.latitude);
  const lng = Number(area.longitude);
  const hasGeo = Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0;

  const place: JsonLdNode = {
    "@context": "https://schema.org",
    "@type": "Place",
    "@id": asUrl(baseUrl, neighborhoodPath(city.slug, area.slug)),
    name: area.name,
    containedInPlace: {
      "@type": "City",
      name: city.name,
      address: {
        "@type": "PostalAddress",
        addressLocality: city.name,
        addressRegion: city.emirate,
        addressCountry: String(city.country || "AE").toUpperCase(),
      },
    },
  };

  if (area.nameAr) {
    place.alternateName = area.nameAr;
  }

  if (hasGeo) {
    place.geo = {
      "@type": "GeoCoordinates",
      latitude: lat,
      longitude: lng,
    };
  }

  if (area.bbox && area.bbox.length === 4) {
    const [minLng, minLat, maxLng, maxLat] = area.bbox;
    // GeoShape `box` is "<minLat> <minLng> <maxLat> <maxLng>".
    place.hasMap = undefined;
    // Attach a GeoShape sibling describing the area's bounding box. Google
    // does not render this in SERPs but it's valid schema.org and helps
    // disambiguate neighborhoods with the same name in different cities.
    (place as Record<string, unknown>).additionalProperty = {
      "@type": "GeoShape",
      box: `${minLat} ${minLng} ${maxLat} ${maxLng}`,
    };
  }

  return place;
}

// NOTE: `buildFaqPage` previously emitted a canned FAQPage node with 4
// hardcoded FAQs that were not rendered visibly on the page. This is a
// Google structured-data violation ("FAQ content must be visible").
// The caller now owns the FAQPage emission so the schema always matches
// the visible `<FaqSection>`. Helper deleted.

/**
 * Build the full JSON-LD node array for a neighborhood hub page. Use it like
 *
 *   const nodes = neighborhoodHubSchema(city, area, category, providers,
 *                                       totalCount, baseUrl);
 *   <JsonLd data={nodes} />
 *
 * `providers` can be the page 1 slice — we only emit the first 10 into the
 * ItemList.
 */
export function neighborhoodHubSchema(
  city: LocalCity,
  area: LocalArea,
  category: LocalCategory | null,
  providers: LocalProvider[],
  totalCount: number,
  baseUrl: string
): JsonLdNode[] {
  const canonical = asUrl(
    baseUrl,
    neighborhoodPath(city.slug, area.slug, category?.slug)
  );

  const titleBase = category
    ? `${category.name} in ${area.name}, ${city.name}`
    : `Healthcare in ${area.name}, ${city.name}`;
  const name = truncateTitle(titleBase, 70);

  const descriptionBase = category
    ? `${totalCount || "Multiple"} ${category.name.toLowerCase()} listings in ${area.name}, ${city.name}. Bilingual names, verified addresses, Google ratings, insurance networks, and languages spoken.`
    : `Healthcare providers in ${area.name}, ${city.name}. ${totalCount || "Multiple"} listings with bilingual names, verified addresses, and insurance network details.`;
  const description = truncateDescription(descriptionBase, 160);

  const collectionPage: JsonLdNode = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": canonical,
    url: canonical,
    name,
    description,
    isPartOf: {
      "@type": "WebSite",
      "@id": asUrl(baseUrl, "/"),
    },
    about: buildPlace(baseUrl, city, area),
    inLanguage: "en",
  };

  if (area.nameAr) {
    (collectionPage as Record<string, unknown>).alternateName = area.nameAr;
  }

  // IMPORTANT: we do NOT emit a FAQPage node here. The caller (area branch
  // of the catch-all page) renders a `<FaqSection faqs={areaFaqs} />`
  // whose content is DIFFERENT from the canned FAQs this helper would
  // produce. Emitting both would (a) create duplicate FAQPage nodes on
  // one page and (b) ship FAQ text that's not visible on the page, which
  // violates Google's structured-data policy ("FAQ content must be
  // visible"). The caller is responsible for the FAQPage node.
  const nodes: JsonLdNode[] = [
    collectionPage,
    buildBreadcrumb(baseUrl, city, area, category),
    buildPlace(baseUrl, city, area),
  ];

  if (providers.length > 0) {
    nodes.push(buildItemList(baseUrl, city, providers));
  }

  return nodes;
}
