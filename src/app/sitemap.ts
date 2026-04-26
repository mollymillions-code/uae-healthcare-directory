import { MetadataRoute } from "next";
import {
  getCities,
  getCategories,
  getAreasByCity,
  get24HourProviders,
  getEmergencyProviders,
  getProviders,
  getProviderCountByInsurance,
  getProviderCountByLanguage,
  isGovernmentProvider,
  type LocalProvider,
} from "@/lib/data";
import { getBaseUrl } from "@/lib/helpers";
import { INSURANCE_PROVIDERS } from "@/lib/constants/insurance";
import { DUO_FACET_MIN_PROVIDERS, getInsurancePlansByGeo } from "@/lib/insurance-facets/data";
import { safe } from "@/lib/safeData";
import {
  TRI_FACET_INSURER_ALLOW,
  TRI_FACET_CATEGORY_ALLOW,
  DEEP_PAGINATION_CITY_CATEGORY_ALLOW,
  DEEP_PAGINATION_MAX_PAGE,
} from "@/lib/seo/facet-rules";
import { INSURER_PROFILES } from "@/lib/insurance";
import { LANGUAGES } from "@/lib/constants/languages";
import { CONDITIONS } from "@/lib/constants/conditions";
import { getConditionDetail } from "@/lib/constants/condition-specialty-map";
import { LAB_PROFILES, LAB_TESTS, LAB_TEST_PRICES, TEST_CATEGORIES } from "@/lib/constants/labs";
import { getAllLabLists } from "@/lib/labs-lists";
import { PROCEDURES, PROCEDURE_CATEGORIES } from "@/lib/constants/procedures";
import { PRICING_LISTS } from "@/lib/constants/pricing-lists";
import { PRICING_GUIDES } from "@/lib/constants/pricing-guides";
import { CARE_JOURNEYS } from "@/lib/constants/care-journeys";
import { PROCEDURE_COMPARISONS } from "@/lib/constants/procedure-comparisons";
import { getAllComparisonSlugs } from "@/lib/compare";
import { JOURNAL_CATEGORIES } from "@/lib/intelligence/categories";
import { PROFESSIONAL_CATEGORIES, ALL_SPECIALTIES, PHYSICIAN_SPECIALTIES, DENTIST_SPECIALTIES } from "@/lib/constants/professionals";
import { getAllFacilitySlugs, getFacilitySpecialtyCombos, getAreaStats, getAreaSpecialtyCombos, getSpecialtiesWithBothLevels, getAllFacilities } from "@/lib/professionals";
import { getTopAreas, getTopFacilities, getProfessionalsByAreaAndCategory } from "@/lib/workforce";
import { GUIDES } from "@/lib/guides/data";

const GUIDE_SLUGS = [
  "how-uae-healthcare-works", "health-insurance-uae", "what-is-dha",
  "what-is-doh", "what-is-mohap", "choosing-a-doctor-uae",
  "healthcare-free-zones-dubai", "emergency-services-uae",
];
const INSURANCE_GUIDE_SLUGS = [
  "freelancer-health-insurance", "maternity-insurance-uae",
  "how-to-claim-health-insurance", "domestic-worker-insurance",
  "switching-health-insurance",
];
const GUIDE_SLUGS_LABS = [
  "visa-medical", "pre-marital-screening", "pregnancy-tests", "walk-in-labs",
  "weekend-labs", "same-day-results", "mens-health-40-plus", "womens-health-30-plus",
  "senior-health-screening", "corporate-health-check",
];
const CONDITION_SLUGS = [
  "pcos", "diabetes", "anemia", "thyroid-disorders", "heart-disease",
  "liver-disease", "kidney-disease", "fertility", "std-screening",
  "vitamin-deficiency", "allergy-testing", "prostate-health",
];
const RESULTS_SLUGS = [
  "cbc", "vitamin-d", "vitamin-b12", "lipid-profile", "hba1c", "tsh",
  "thyroid-panel", "lft", "kft", "iron-studies", "fasting-glucose",
  "testosterone", "amh", "psa", "hiv-test", "crp",
];

// ─── Allow-lists — centralized in `src/lib/seo/facet-rules.ts` (Item 8) ──
//
// Previously this file defined `TRI_FACET_INSURER_ALLOW`,
// `TRI_FACET_CATEGORY_ALLOW`, `DEEP_PAGINATION_CITY_CATEGORY_ALLOW`, and
// `DEEP_PAGINATION_MAX_PAGE` inline. They now live in the facet-rules
// module alongside the min-provider-count thresholds, so the runtime
// gates (insurer/tri-facet pages) and the sitemap agree on one source
// of truth. Do not redefine them here — import from `@/lib/seo/facet-rules`.

// ISR: rebuild sitemap every hour. No heavy DB queries — uses only constants.
export const revalidate = 3600;

// Last known content update date. Using a fixed date instead of new Date() because
// the sitemap uses constants only (no DB), so we cannot determine real per-page
// modification times. new Date() changes on every request, which is misleading to
// crawlers. UPDATE THIS DATE when content (constants, guides, categories) changes.
const LAST_CONTENT_UPDATE = new Date('2026-04-10');

// ─── Item 3 — Neighborhood hub allow-list ────────────────────────────────────
// Curated list of the highest-volume UAE neighborhoods that should receive
// boosted sitemap priority + crawlable top-specialty child pages. Mirrors
// what the Item 3 ingestion scripts (Dubai Pulse, Abu Dhabi Open Data, OSM
// Overpass) will populate into `areas.provider_count_cached` once seeded.
// Sync-only because `sitemap()` itself is sync — a future DB-backed refactor
// can replace this allowlist with a live SELECT.
//
// Every slug here MUST exist in `AREAS` in `src/lib/constants/cities.ts`.
const NEIGHBORHOOD_HUB_ALLOW: { citySlug: string; areaSlugs: string[] }[] = [
  {
    citySlug: "dubai",
    areaSlugs: [
      "dubai-marina",
      "downtown-dubai",
      "business-bay",
      "jumeirah",
      "jlt",
      "al-barsha",
      "deira",
      "bur-dubai",
      "healthcare-city",
      "palm-jumeirah",
      "jvc",
      "dubai-hills",
      "mirdif",
      "silicon-oasis",
      "al-nahda",
    ],
  },
  {
    citySlug: "abu-dhabi",
    areaSlugs: [
      "al-reem-island",
      "al-maryah-island",
      "khalifa-city",
      "corniche",
      "al-bateen",
      "al-khalidiya",
      "al-mushrif",
      "saadiyat-island",
      "yas-island",
      "mohammed-bin-zayed-city",
    ],
  },
  {
    citySlug: "sharjah",
    areaSlugs: [
      "al-nahda-sharjah",
      "al-majaz",
      "al-taawun",
      "al-khan",
      "muwaileh",
      "al-qasimia",
    ],
  },
  {
    citySlug: "al-ain",
    areaSlugs: ["al-jimi", "al-ain-central", "tawam"],
  },
];

// Evergreen specialties that consistently have >= AREA_FACET_MIN_PROVIDERS
// inventory across the high-volume neighborhoods above. Keep in sync with
// `TRI_FACET_CATEGORY_ALLOW` in `src/lib/seo/facet-rules.ts`.
const NEIGHBORHOOD_HUB_TOP_SPECIALTIES = [
  "dental-clinic",
  "hospital",
  "clinic",
  "dermatology",
  "pediatrics",
  "pharmacy",
  "physiotherapy",
  "laboratory",
  "ophthalmology",
  "gynecology",
];

type SitemapEntry = MetadataRoute.Sitemap[number];

function comboKey(citySlug: string, slug: string): string {
  return `${citySlug}:${slug}`;
}

function qualifiedTopProviders(providers: LocalProvider[]): LocalProvider[] {
  return providers.filter(
    (p) => Number(p.googleRating) > 0 && p.googleReviewCount > 10,
  );
}

function dedupeSitemapEntries(entries: MetadataRoute.Sitemap): MetadataRoute.Sitemap {
  const byUrl = new Map<string, SitemapEntry>();

  for (const entry of entries) {
    const existing = byUrl.get(entry.url);
    if (!existing) {
      byUrl.set(entry.url, entry);
      continue;
    }

    const existingPriority = existing.priority ?? 0;
    const nextPriority = entry.priority ?? 0;
    byUrl.set(entry.url, {
      ...existing,
      ...entry,
      priority: Math.max(existingPriority, nextPriority),
      alternates: entry.alternates ?? existing.alternates,
    });
  }

  return Array.from(byUrl.values());
}

async function getSitemapEligibility(
  cities: ReturnType<typeof getCities>,
  categories: ReturnType<typeof getCategories>,
) {
  const bestCityCategory = new Set<string>();
  const topCityCategory = new Set<string>();
  const topUaeCategory = new Set<string>();
  const cityInsurance = new Set<string>();
  const cityLanguage = new Set<string>();
  const city24Hour = new Set<string>();
  const cityEmergency = new Set<string>();
  const cityGovernment = new Set<string>();
  const cityWalkIn = new Set<string>();

  await Promise.all([
    ...categories.map(async (cat) => {
      const result = await safe(
        getProviders({ categorySlug: cat.slug, limit: 99999 }),
        { providers: [] as LocalProvider[], total: 0, page: 1, totalPages: 0 },
        `sitemap:top-uae:${cat.slug}`,
      );
      if (qualifiedTopProviders(result.providers).length >= 5) {
        topUaeCategory.add(cat.slug);
      }
    }),
    ...cities.map(async (city) => {
      const [
        providers24h,
        emergencyProviders,
        cityProvidersResult,
        walkInResult,
      ] = await Promise.all([
        safe(get24HourProviders(city.slug), [] as LocalProvider[], `sitemap:24h:${city.slug}`),
        safe(getEmergencyProviders(city.slug), [] as LocalProvider[], `sitemap:emergency:${city.slug}`),
        safe(
          getProviders({ citySlug: city.slug, limit: 99999 }),
          { providers: [] as LocalProvider[], total: 0, page: 1, totalPages: 0 },
          `sitemap:city-providers:${city.slug}`,
        ),
        safe(
          getProviders({ citySlug: city.slug, categorySlug: "clinics", limit: 1 }),
          { providers: [] as LocalProvider[], total: 0, page: 1, totalPages: 0 },
          `sitemap:walk-in:${city.slug}`,
        ),
      ]);

      if (providers24h.length >= 3) city24Hour.add(city.slug);
      if (emergencyProviders.length >= 3) cityEmergency.add(city.slug);
      if (cityProvidersResult.providers.some(isGovernmentProvider)) cityGovernment.add(city.slug);
      if (walkInResult.total > 0) cityWalkIn.add(city.slug);

      await Promise.all([
        ...categories.map(async (cat) => {
          const result = await safe(
            getProviders({ citySlug: city.slug, categorySlug: cat.slug, limit: 99999 }),
            { providers: [] as LocalProvider[], total: 0, page: 1, totalPages: 0 },
            `sitemap:city-cat:${city.slug}:${cat.slug}`,
          );
          const ratedCount = result.providers.filter((p) => Number(p.googleRating) > 0).length;
          const qualifiedCount = qualifiedTopProviders(result.providers).length;
          if (ratedCount > 0) bestCityCategory.add(comboKey(city.slug, cat.slug));
          if (qualifiedCount >= 10) topCityCategory.add(comboKey(city.slug, cat.slug));
        }),
        ...INSURANCE_PROVIDERS.map(async (insurer) => {
          const geoEligible = getInsurancePlansByGeo(city.slug).some((p) => p.slug === insurer.slug);
          if (!geoEligible) return;
          const count = await safe(
            getProviderCountByInsurance(insurer.slug, city.slug),
            0,
            `sitemap:ins:${city.slug}:${insurer.slug}`,
          );
          if (count >= DUO_FACET_MIN_PROVIDERS) {
            cityInsurance.add(comboKey(city.slug, insurer.slug));
          }
        }),
        ...LANGUAGES.map(async (lang) => {
          const count = await safe(
            getProviderCountByLanguage(lang.slug, city.slug),
            0,
            `sitemap:lang:${city.slug}:${lang.slug}`,
          );
          if (count > 0) cityLanguage.add(comboKey(city.slug, lang.slug));
        }),
      ]);
    }),
  ]);

  return {
    bestCityCategory,
    topCityCategory,
    topUaeCategory,
    cityInsurance,
    cityLanguage,
    city24Hour,
    cityEmergency,
    cityGovernment,
    cityWalkIn,
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();
  const cities = getCities();
  const categories = getCategories();
  const eligibility = await getSitemapEligibility(cities, categories);
  const entries: MetadataRoute.Sitemap = [];

  // Homepage
  entries.push({
    url: baseUrl, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "daily", priority: 1.0,
    alternates: { languages: { en: baseUrl, ar: `${baseUrl}/ar` } },
  });

  // Directory hub page
  entries.push({ url: `${baseUrl}/directory`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "daily", priority: 0.95 });

  // NOTE: `/search` intentionally NOT emitted. The page is robots-disallowed
  // in `src/app/robots.ts` AND carries `robots: { index: false }` metadata
  // in `src/app/(directory)/search/page.tsx` — submitting it here would
  // create a crawl-vs-index contradiction that erodes GSC sitemap trust.
  // See Item 0 of docs/zocdoc-plans-reconciled.md.

  // Directory: city pages + city×category + city×area structural pages (with hreflang)
  for (const city of cities) {
    entries.push({
      url: `${baseUrl}/directory/${city.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "daily", priority: 0.9,
      alternates: { languages: { en: `${baseUrl}/directory/${city.slug}`, ar: `${baseUrl}/ar/directory/${city.slug}` } },
    });
    for (const cat of categories) {
      entries.push({
        url: `${baseUrl}/directory/${city.slug}/${cat.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "daily", priority: 0.9,
        alternates: { languages: { en: `${baseUrl}/directory/${city.slug}/${cat.slug}`, ar: `${baseUrl}/ar/directory/${city.slug}/${cat.slug}` } },
      });
    }
    const areas = getAreasByCity(city.slug);
    for (const area of areas) {
      entries.push({
        url: `${baseUrl}/directory/${city.slug}/${area.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.7,
        alternates: { languages: { en: `${baseUrl}/directory/${city.slug}/${area.slug}`, ar: `${baseUrl}/ar/directory/${city.slug}/${area.slug}` } },
      });
      for (const cat of categories) {
        entries.push({ url: `${baseUrl}/directory/${city.slug}/${area.slug}/${cat.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.7 });
      }
    }
    // Special filter pages
    if (eligibility.city24Hour.has(city.slug)) {
      entries.push({ url: `${baseUrl}/directory/${city.slug}/24-hour`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.8 });
    }
    entries.push({ url: `${baseUrl}/directory/${city.slug}/insurance`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.7 });
    entries.push({ url: `${baseUrl}/directory/${city.slug}/language`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.7 });
    entries.push({ url: `${baseUrl}/directory/${city.slug}/condition`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.7 });
    // Insurance per city (2-facet: city × insurer) — geo-gated so we
    // never emit e.g. /directory/dubai/insurance/thiqa/ (Thiqa is AD-only).
    // Runtime `generateMetadata` still enforces the min-provider gate for
    // indexing — the sitemap only decides which URLs Google should see.
    const cityInsurancePlans = getInsurancePlansByGeo(city.slug);
    for (const insurer of INSURANCE_PROVIDERS) {
      if (!cityInsurancePlans.some((p) => p.slug === insurer.slug)) continue;
      if (!eligibility.cityInsurance.has(comboKey(city.slug, insurer.slug))) continue;
      entries.push({ url: `${baseUrl}/directory/${city.slug}/insurance/${insurer.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.7 });
    }

    // Insurance tri-facet (city × insurer × specialty) — gated at
    // emission time via:
    //   1. Geo scope (Thiqa → AD only, etc.)
    //   2. Insurer allow-list (pinned to the payers that have real
    //      long-form editorial copy — see module scope above)
    //   3. Category allow-list (top 8 evergreen specialties)
    // Runtime gate in
    // `src/app/(directory)/directory/[city]/insurance/[insurer]/[category]/page.tsx`
    // further enforces min-provider-count (≥ 5) via `isTriFacetEligible`,
    // so low-coverage tuples noindex themselves even if listed here.
    for (const insurer of INSURANCE_PROVIDERS) {
      if (!TRI_FACET_INSURER_ALLOW.has(insurer.slug)) continue;
      if (!cityInsurancePlans.some((p) => p.slug === insurer.slug)) continue;
      if (!eligibility.cityInsurance.has(comboKey(city.slug, insurer.slug))) continue;
      for (const cat of categories) {
        if (!TRI_FACET_CATEGORY_ALLOW.has(cat.slug)) continue;
        entries.push({
          url: `${baseUrl}/directory/${city.slug}/insurance/${insurer.slug}/${cat.slug}`,
          lastModified: LAST_CONTENT_UPDATE,
          changeFrequency: "weekly",
          priority: 0.65,
        });
      }
    }
    // Language per city
    for (const lang of LANGUAGES) {
      if (!eligibility.cityLanguage.has(comboKey(city.slug, lang.slug))) continue;
      entries.push({ url: `${baseUrl}/directory/${city.slug}/language/${lang.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.7 });
    }
    // Condition per city — Item 4 Part D. The `ar-AE` alternate is ONLY
    // emitted when a hand-authored Arabic intro exists in
    // CONDITION_SPECIALTY_MAP. Without the gate, the AR mirror 404s
    // (because the AR condition page `notFound()`s when `introAr` is
    // missing) while the EN sitemap still advertises a broken hreflang.
    for (const condition of CONDITIONS) {
      const hasArabic = Boolean(getConditionDetail(condition.slug)?.introAr);
      entries.push({
        url: `${baseUrl}/directory/${city.slug}/condition/${condition.slug}`,
        lastModified: LAST_CONTENT_UPDATE,
        changeFrequency: "weekly",
        priority: 0.7,
        ...(hasArabic
          ? {
              alternates: {
                languages: {
                  en: `${baseUrl}/directory/${city.slug}/condition/${condition.slug}`,
                  ar: `${baseUrl}/ar/directory/${city.slug}/condition/${condition.slug}`,
                },
              },
            }
          : {}),
      });
    }
    // Procedure pages per city
    const procsInCity = PROCEDURES.filter((p) => p.cityPricing[city.slug]);
    if (procsInCity.length > 0) {
      entries.push({ url: `${baseUrl}/directory/${city.slug}/procedures`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.8 });
      for (const proc of procsInCity) {
        entries.push({ url: `${baseUrl}/directory/${city.slug}/procedures/${proc.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.75 });
      }
    }
    // Service-specific flat URL landing pages (e.g. /directory/dubai/teeth-whitening)
    for (const proc of procsInCity) {
      entries.push({ url: `${baseUrl}/directory/${city.slug}/${proc.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.8 });
    }
    // Walk-in clinics per city
    if (eligibility.cityWalkIn.has(city.slug)) {
      entries.push({ url: `${baseUrl}/directory/${city.slug}/walk-in`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.7 });
    }
    // Emergency facilities per city
    if (eligibility.cityEmergency.has(city.slug)) {
      entries.push({ url: `${baseUrl}/directory/${city.slug}/emergency`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.7 });
    }
    // Government facilities per city
    if (eligibility.cityGovernment.has(city.slug)) {
      entries.push({ url: `${baseUrl}/directory/${city.slug}/government`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.7 });
    }
    // Top providers per city×category
    for (const cat of categories) {
      if (!eligibility.topCityCategory.has(comboKey(city.slug, cat.slug))) continue;
      entries.push({ url: `${baseUrl}/directory/${city.slug}/top/${cat.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.75 });
    }

    // ─── Item 3 — Neighborhood × top-specialty hubs ─────────────────────────
    // Additive block. The existing area block above (line ~154) already emits
    // every area-constant URL as /directory/[city]/[area] and every
    // /[city]/[area]/[category] combo. That block is kept for backwards
    // compatibility with the hand-curated `AREAS` constant in
    // `src/lib/constants/cities.ts`.
    //
    // This block adds EXTRA-HIGH-PRIORITY neighborhood×specialty tuples for
    // the highest-volume areas (Dubai Marina, Downtown Dubai, Al Reem Island,
    // etc.) so Googlebot re-crawls them more frequently. It intentionally
    // duplicates a subset of the URLs above at a higher priority — Google
    // uses the highest priority it sees for a given URL.
    //
    // Gating: the curated allowlist below corresponds to the areas the Item 3
    // ingestion scripts (Dubai Pulse, Abu Dhabi Open Data, OSM Overpass) seed
    // with real polygons. Once `provider_count_cached` is populated by
    // `scripts/neighborhoods/assign-providers-to-areas.mjs`, a future sitemap
    // refactor can replace this allowlist with a live DB gate. Until then,
    // this static list is the safe sync-compatible equivalent.
    const neighborhoodHub = NEIGHBORHOOD_HUB_ALLOW.find(
      (n) => n.citySlug === city.slug,
    );
    if (neighborhoodHub) {
      for (const areaSlug of neighborhoodHub.areaSlugs) {
        // Neighborhood hub page itself — boosted priority (vs 0.7 above).
        entries.push({
          url: `${baseUrl}/directory/${city.slug}/${areaSlug}`,
          lastModified: LAST_CONTENT_UPDATE,
          changeFrequency: "daily",
          priority: 0.85,
          alternates: {
            languages: {
              en: `${baseUrl}/directory/${city.slug}/${areaSlug}`,
              ar: `${baseUrl}/ar/directory/${city.slug}/${areaSlug}`,
            },
          },
        });
        // Top-10 specialty × neighborhood — only the evergreen specialties,
        // same allow-list used by the 3-facet block so the two stay in sync.
        for (const catSlug of NEIGHBORHOOD_HUB_TOP_SPECIALTIES) {
          if (!categories.some((c) => c.slug === catSlug)) continue;
          entries.push({
            url: `${baseUrl}/directory/${city.slug}/${areaSlug}/${catSlug}`,
            lastModified: LAST_CONTENT_UPDATE,
            changeFrequency: "weekly",
            priority: 0.75,
            alternates: {
              languages: {
                en: `${baseUrl}/directory/${city.slug}/${areaSlug}/${catSlug}`,
                ar: `${baseUrl}/ar/directory/${city.slug}/${areaSlug}/${catSlug}`,
              },
            },
          });
        }
      }
    }

    // ─── Deep pagination (Item 0.5) ─────────────────────────────────────────
    // Emit ?page=2..5 for the highest-volume city × specialty tuples so
    // Googlebot has a crawl path to long-tail providers. Runtime SSR 404s
    // past-the-end pages, so this is safe against over-inclusion.
    const cityDeepPag = DEEP_PAGINATION_CITY_CATEGORY_ALLOW.find(
      (c) => c.citySlug === city.slug,
    );
    if (cityDeepPag) {
      for (const catSlug of cityDeepPag.categorySlugs) {
        if (!categories.some((c) => c.slug === catSlug)) continue;
        for (let p = 2; p <= DEEP_PAGINATION_MAX_PAGE; p++) {
          entries.push({
            url: `${baseUrl}/directory/${city.slug}/${catSlug}?page=${p}`,
            lastModified: LAST_CONTENT_UPDATE,
            changeFrequency: "weekly",
            priority: 0.55,
          });
        }
      }
    }
  }

  // Best pages
  entries.push({ url: `${baseUrl}/best`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.9 });
  for (const city of cities) {
    entries.push({ url: `${baseUrl}/best/${city.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.85 });
    for (const cat of categories) {
      if (!eligibility.bestCityCategory.has(comboKey(city.slug, cat.slug))) continue;
      entries.push({ url: `${baseUrl}/best/${city.slug}/${cat.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.85 });
    }
  }

  // Top 10
  entries.push({ url: `${baseUrl}/directory/top`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.9 });
  for (const cat of categories) {
    if (!eligibility.topUaeCategory.has(cat.slug)) continue;
    entries.push({ url: `${baseUrl}/directory/top/${cat.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.85 });
  }
  for (const city of cities) {
    entries.push({ url: `${baseUrl}/directory/${city.slug}/top`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.85 });
  }

  // Guides
  entries.push({ url: `${baseUrl}/directory/guide`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.7 });
  for (const slug of GUIDE_SLUGS) {
    entries.push({ url: `${baseUrl}/directory/guide/${slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.6 });
  }

  // Comparisons
  entries.push({ url: `${baseUrl}/directory/compare`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.8 });
  for (const slug of getAllComparisonSlugs()) {
    entries.push({ url: `${baseUrl}/directory/compare/${slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.7 });
  }

  // Intelligence / Journal
  entries.push({ url: `${baseUrl}/intelligence`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "hourly", priority: 0.95 });
  // Intelligence tag/category pages
  for (const cat of JOURNAL_CATEGORIES) {
    entries.push({ url: `${baseUrl}/intelligence/category/${cat.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "daily", priority: 0.8 });
  }
  // Intelligence individual articles are DB-driven — they cannot be enumerated in this
  // synchronous sitemap. If needed, add a dedicated /intelligence/sitemap.xml route.

  // ─── Item 5 — Trust + masthead block (E-E-A-T leapfrog) ───────────────────
  // Author and reviewer profile slugs are seeded from
  // `scripts/seed-authors-reviewers.mjs`. We hard-code the active set here so
  // sitemap.ts stays synchronous; reviewer placeholders seeded as inactive
  // are deliberately excluded so they cannot leak to search engines until
  // the editorial team flips them on with a real expert assignment.
  const AUTHOR_SLUGS_ACTIVE = [
    "zavis-intelligence-team",
    "zavis-data-science",
    "senior-healthcare-editor",
    "policy-regulatory-editor",
    "market-intelligence-editor",
  ];
  // Reviewer slugs are intentionally empty until real reviewers are assigned.
  // When the editorial team flips a reviewer to is_active=true, also add
  // their slug here so the sitemap submits the URL.
  const REVIEWER_SLUGS_ACTIVE: string[] = [];

  // Masthead index page (en + ar mirror)
  entries.push({
    url: `${baseUrl}/intelligence/author`,
    lastModified: LAST_CONTENT_UPDATE,
    changeFrequency: "weekly",
    priority: 0.6,
    alternates: {
      languages: {
        en: `${baseUrl}/intelligence/author`,
        ar: `${baseUrl}/ar/intelligence/author`,
      },
    },
  });
  for (const slug of AUTHOR_SLUGS_ACTIVE) {
    entries.push({
      url: `${baseUrl}/intelligence/author/${slug}`,
      lastModified: LAST_CONTENT_UPDATE,
      changeFrequency: "monthly",
      priority: 0.55,
      alternates: {
        languages: {
          en: `${baseUrl}/intelligence/author/${slug}`,
          ar: `${baseUrl}/ar/intelligence/author/${slug}`,
        },
      },
    });
  }
  for (const slug of REVIEWER_SLUGS_ACTIVE) {
    entries.push({
      url: `${baseUrl}/intelligence/reviewer/${slug}`,
      lastModified: LAST_CONTENT_UPDATE,
      changeFrequency: "monthly",
      priority: 0.55,
      alternates: {
        languages: {
          en: `${baseUrl}/intelligence/reviewer/${slug}`,
          ar: `${baseUrl}/ar/intelligence/reviewer/${slug}`,
        },
      },
    });
  }
  // Trust + transparency pages — bilingual
  entries.push(
    {
      url: `${baseUrl}/methodology`,
      lastModified: LAST_CONTENT_UPDATE,
      changeFrequency: "monthly",
      priority: 0.5,
      alternates: {
        languages: {
          en: `${baseUrl}/methodology`,
          ar: `${baseUrl}/ar/methodology`,
        },
      },
    },
    {
      url: `${baseUrl}/data-sources`,
      lastModified: LAST_CONTENT_UPDATE,
      changeFrequency: "monthly",
      priority: 0.5,
      alternates: {
        languages: {
          en: `${baseUrl}/data-sources`,
          ar: `${baseUrl}/ar/data-sources`,
        },
      },
    },
    {
      url: `${baseUrl}/about/corrections`,
      lastModified: LAST_CONTENT_UPDATE,
      changeFrequency: "monthly",
      priority: 0.4,
      alternates: {
        languages: {
          en: `${baseUrl}/about/corrections`,
          ar: `${baseUrl}/ar/about/corrections`,
        },
      },
    },
    // Arabic mirrors of trust pages
    {
      url: `${baseUrl}/ar/methodology`,
      lastModified: LAST_CONTENT_UPDATE,
      changeFrequency: "monthly",
      priority: 0.45,
      alternates: {
        languages: {
          en: `${baseUrl}/methodology`,
          ar: `${baseUrl}/ar/methodology`,
        },
      },
    },
    {
      url: `${baseUrl}/ar/data-sources`,
      lastModified: LAST_CONTENT_UPDATE,
      changeFrequency: "monthly",
      priority: 0.45,
      alternates: {
        languages: {
          en: `${baseUrl}/data-sources`,
          ar: `${baseUrl}/ar/data-sources`,
        },
      },
    },
    {
      url: `${baseUrl}/ar/about/corrections`,
      lastModified: LAST_CONTENT_UPDATE,
      changeFrequency: "monthly",
      priority: 0.4,
      alternates: {
        languages: {
          en: `${baseUrl}/about/corrections`,
          ar: `${baseUrl}/ar/about/corrections`,
        },
      },
    },
    {
      url: `${baseUrl}/ar/editorial-policy`,
      lastModified: LAST_CONTENT_UPDATE,
      changeFrequency: "monthly",
      priority: 0.4,
      alternates: {
        languages: {
          en: `${baseUrl}/editorial-policy`,
          ar: `${baseUrl}/ar/editorial-policy`,
        },
      },
    },
  );

  // Labs
  entries.push({ url: `${baseUrl}/labs`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.9 });
  entries.push({ url: `${baseUrl}/labs/compare`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.7 });
  for (const lab of LAB_PROFILES) {
    entries.push({ url: `${baseUrl}/labs/${lab.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.8 });
  }
  for (const test of LAB_TESTS) {
    entries.push({ url: `${baseUrl}/labs/test/${test.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.8 });
    for (const city of cities) {
      entries.push({ url: `${baseUrl}/labs/test/${test.slug}/${city.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.7 });
    }
  }
  for (const cat of TEST_CATEGORIES) {
    entries.push({ url: `${baseUrl}/labs/category/${cat.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.7 });
  }
  entries.push(
    { url: `${baseUrl}/labs/home-collection`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/labs/packages`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.8 },
  );
  for (const city of cities) {
    const hcLabs = LAB_PROFILES.filter((l) => l.cities.includes(city.slug) && l.homeCollection);
    if (hcLabs.length > 0) {
      entries.push({ url: `${baseUrl}/labs/home-collection/${city.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.8 });
    }
    const cityLabs = LAB_PROFILES.filter((l) => l.cities.includes(city.slug));
    if (cityLabs.length > 0) {
      entries.push({ url: `${baseUrl}/labs/city/${city.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.8 });
    }
  }
  for (const list of getAllLabLists()) {
    entries.push({ url: `${baseUrl}/labs/lists/${list.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.8 });
  }
  // Lab guides
  for (const guide of GUIDE_SLUGS_LABS) {
    entries.push({ url: `${baseUrl}/labs/guides/${guide}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.8 });
    for (const city of cities) {
      const cityLabs = LAB_PROFILES.filter((l) => l.cities.includes(city.slug));
      if (cityLabs.length >= 2) {
        entries.push({ url: `${baseUrl}/labs/guides/${guide}/${city.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.7 });
      }
    }
  }
  // Lab conditions
  for (const condition of CONDITION_SLUGS) {
    entries.push({ url: `${baseUrl}/labs/conditions/${condition}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.8 });
    for (const city of cities) {
      entries.push({ url: `${baseUrl}/labs/conditions/${condition}/${city.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.7 });
    }
  }
  // Lab results interpretation
  for (const test of RESULTS_SLUGS) {
    entries.push({ url: `${baseUrl}/labs/results/${test}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.8 });
  }
  // Lab vs comparison pages — all valid C(N,2) pairs with ≥5 shared tests
  {
    const MIN_COMMON_TESTS = 5;
    const testSetByLab = new Map<string, Set<string>>();
    for (const lab of LAB_PROFILES) {
      testSetByLab.set(lab.slug, new Set(LAB_TEST_PRICES.filter((p) => p.labSlug === lab.slug).map((p) => p.testSlug)));
    }
    for (let i = 0; i < LAB_PROFILES.length; i++) {
      for (let j = i + 1; j < LAB_PROFILES.length; j++) {
        const a = LAB_PROFILES[i].slug;
        const b = LAB_PROFILES[j].slug;
        const setA = testSetByLab.get(a) ?? new Set<string>();
        const setB = testSetByLab.get(b) ?? new Set<string>();
        const common = Array.from(setA).filter((t) => setB.has(t)).length;
        if (common >= MIN_COMMON_TESTS) {
          const [sortedA, sortedB] = [a, b].sort();
          entries.push({ url: `${baseUrl}/labs/vs/${sortedA}-vs-${sortedB}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.7 });
        }
      }
    }
  }
  // Lab city × test-category pages
  for (const city of cities) {
    const labSlugsInCity = new Set(LAB_PROFILES.filter((l) => l.cities.includes(city.slug)).map((l) => l.slug));
    if (labSlugsInCity.size === 0) continue;
    for (const cat of TEST_CATEGORIES) {
      const hasPrices = LAB_TEST_PRICES.some((p) => labSlugsInCity.has(p.labSlug));
      if (hasPrices) {
        entries.push({ url: `${baseUrl}/labs/city/${city.slug}/${cat.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.7 });
      }
    }
  }
  // Lab home-collection city × test-category pages
  for (const city of cities) {
    const homeLabSlugs = new Set(LAB_PROFILES.filter((l) => l.cities.includes(city.slug) && l.homeCollection).map((l) => l.slug));
    if (homeLabSlugs.size === 0) continue;
    for (const cat of TEST_CATEGORIES) {
      if (cat.slug === "imaging") continue;
      const catTests = new Set(LAB_TESTS.filter((t) => t.category === cat.slug).map((t) => t.slug));
      const hasPrices = LAB_TEST_PRICES.some((p) => homeLabSlugs.has(p.labSlug) && catTests.has(p.testSlug));
      if (hasPrices) {
        entries.push({ url: `${baseUrl}/labs/home-collection/${city.slug}/${cat.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.7 });
      }
    }
  }

  // Insurance navigator
  entries.push({ url: `${baseUrl}/insurance`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.9 });
  entries.push({ url: `${baseUrl}/insurance/compare`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.7 });
  for (const insurer of INSURANCE_PROVIDERS) {
    entries.push({ url: `${baseUrl}/insurance/${insurer.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.8 });
  }
  for (let i = 0; i < INSURER_PROFILES.length; i++) {
    for (let j = i + 1; j < INSURER_PROFILES.length; j++) {
      const [a, b] = [INSURER_PROFILES[i].slug, INSURER_PROFILES[j].slug].sort();
      entries.push({ url: `${baseUrl}/insurance/compare/${a}-vs-${b}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.7 });
    }
  }
  entries.push({ url: `${baseUrl}/insurance/guide`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.7 });
  for (const slug of INSURANCE_GUIDE_SLUGS) {
    entries.push({ url: `${baseUrl}/insurance/guide/${slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.65 });
  }

  // Pricing hub — procedures, comparisons, lists, guides, journeys
  entries.push({ url: `${baseUrl}/pricing`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.9 });
  for (const proc of PROCEDURES) {
    entries.push({ url: `${baseUrl}/pricing/${proc.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.8 });
    for (const city of cities) {
      if (proc.cityPricing[city.slug]) {
        entries.push({ url: `${baseUrl}/pricing/${proc.slug}/${city.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.75 });
      }
    }
  }
  for (const cat of PROCEDURE_CATEGORIES) {
    entries.push({ url: `${baseUrl}/pricing/category/${cat.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.7 });
    for (const city of cities) {
      entries.push({ url: `${baseUrl}/pricing/category/${cat.slug}/${city.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.65 });
    }
  }
  for (const city of cities) {
    entries.push({ url: `${baseUrl}/pricing/city/${city.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.75 });
  }
  // Pricing lists
  entries.push({ url: `${baseUrl}/pricing/lists`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.7 });
  for (const list of PRICING_LISTS) {
    for (const city of cities) {
      entries.push({ url: `${baseUrl}/pricing/lists/${list.slug}/${city.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.7 });
    }
  }
  // Pricing guides
  entries.push({ url: `${baseUrl}/pricing/guide`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.7 });
  for (const guide of PRICING_GUIDES) {
    entries.push({ url: `${baseUrl}/pricing/guide/${guide.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.7 });
    for (const city of cities) {
      entries.push({ url: `${baseUrl}/pricing/guide/${guide.slug}/${city.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.65 });
    }
  }
  // Care journeys
  entries.push({ url: `${baseUrl}/pricing/journey`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.7 });
  for (const journey of CARE_JOURNEYS) {
    entries.push({ url: `${baseUrl}/pricing/journey/${journey.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.7 });
    for (const city of cities) {
      entries.push({ url: `${baseUrl}/pricing/journey/${journey.slug}/${city.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.65 });
    }
  }
  // Procedure comparisons (vs pages)
  entries.push({ url: `${baseUrl}/pricing/vs`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.7 });
  for (const comp of PROCEDURE_COMPARISONS) {
    entries.push({ url: `${baseUrl}/pricing/vs/${comp.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.7 });
    for (const city of cities) {
      entries.push({ url: `${baseUrl}/pricing/vs/${comp.slug}/${city.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.65 });
    }
  }
  // Price comparison tool + city-vs-city pages
  entries.push({ url: `${baseUrl}/pricing/compare`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.7 });
  // UAE-only: pair combinations use `cities` (UAE-filtered) not `CITIES`
  // (which includes GCC rows) to prevent doha-vs-abu-dhabi leaks.
  for (let i = 0; i < cities.length; i++) {
    for (let j = i + 1; j < cities.length; j++) {
      entries.push({ url: `${baseUrl}/pricing/compare/${cities[i].slug}-vs-${cities[j].slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.65 });
    }
  }

  // Professional directory
  entries.push({ url: `${baseUrl}/professionals`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.9 });
  entries.push({ url: `${baseUrl}/find-a-doctor`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.9 });
  for (const cat of PROFESSIONAL_CATEGORIES) {
    entries.push({ url: `${baseUrl}/professionals/${cat.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.85 });
  }
  for (const spec of ALL_SPECIALTIES) {
    entries.push({ url: `${baseUrl}/professionals/${spec.category}/${spec.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.8 });
  }
  for (const slug of getAllFacilitySlugs(20)) {
    entries.push({ url: `${baseUrl}/professionals/facility/${slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.75 });
  }
  for (const combo of getFacilitySpecialtyCombos(5)) {
    entries.push({ url: `${baseUrl}/professionals/facility/${combo.facilitySlug}/${combo.specialtySlug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.7 });
  }

  // Professional directory — area pages
  for (const area of getAreaStats()) {
    entries.push({ url: `${baseUrl}/professionals/area/${area.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.8 });
  }
  for (const combo of getAreaSpecialtyCombos(3)) {
    entries.push({ url: `${baseUrl}/professionals/area/${combo.areaSlug}/${combo.specialtySlug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.7 });
  }

  // Professional directory — specialist/consultant split pages
  for (const spec of getSpecialtiesWithBothLevels()) {
    const specDef = ALL_SPECIALTIES.find((s) => s.slug === spec.slug);
    if (specDef) {
      entries.push({ url: `${baseUrl}/professionals/${specDef.category}/${spec.slug}/specialists`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.7 });
      entries.push({ url: `${baseUrl}/professionals/${specDef.category}/${spec.slug}/consultants`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.7 });
    }
  }

  // Professional directory — guide pages
  const PROF_GUIDE_SLUGS = [
    "specialist-vs-consultant", "dha-licensing", "ftl-vs-reg", "how-to-verify-doctor",
    "choosing-right-specialist", "healthcare-workforce", "medical-specialties-explained", "international-doctors-dubai",
  ];
  for (const slug of PROF_GUIDE_SLUGS) {
    entries.push({ url: `${baseUrl}/professionals/guide/${slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.75 });
  }

  // Professional directory — stats page
  entries.push({ url: `${baseUrl}/professionals/stats`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.8 });

  // Best doctors pages
  const DOCTOR_SPECIALTIES = [...PHYSICIAN_SPECIALTIES, ...DENTIST_SPECIALTIES];
  entries.push({ url: `${baseUrl}/best/doctors`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.9 });
  for (const spec of DOCTOR_SPECIALTIES) {
    entries.push({ url: `${baseUrl}/best/doctors/${spec.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.85 });
  }

  // Specialty comparison pages
  const top15Specs = [...PHYSICIAN_SPECIALTIES].sort((a, b) => b.count - a.count).slice(0, 15);
  for (let i = 0; i < top15Specs.length; i++) {
    for (let j = i + 1; j < top15Specs.length; j++) {
      entries.push({ url: `${baseUrl}/professionals/compare/${top15Specs[i].slug}-vs-${top15Specs[j].slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.65 });
    }
  }

  // Doctors-at facility alias pages
  for (const fac of getAllFacilities(20).slice(0, 50)) {
    entries.push({ url: `${baseUrl}/doctors-at/${fac.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.75 });
  }

  // ─── Workforce Intelligence Section ─────────────────────────────────────────
  // Hub pages
  const workforceHubs = ["workforce", "workforce/overview", "workforce/employers", "workforce/specialties", "workforce/areas", "workforce/benchmarks", "workforce/careers", "workforce/rankings", "workforce/compare", "workforce/supply"];
  for (const hub of workforceHubs) {
    entries.push({ url: `${baseUrl}/${hub}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.85 });
  }

  // Category workforce pages
  for (const cat of PROFESSIONAL_CATEGORIES) {
    entries.push({ url: `${baseUrl}/workforce/category/${cat.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.8 });
    entries.push({ url: `${baseUrl}/workforce/career/category/${cat.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.7 });
  }

  // Specialty workforce + career + supply pages
  for (const spec of ALL_SPECIALTIES) {
    entries.push({ url: `${baseUrl}/workforce/specialty/${spec.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.75 });
    entries.push({ url: `${baseUrl}/workforce/career/${spec.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.7 });
  }
  for (const spec of PHYSICIAN_SPECIALTIES) {
    entries.push({ url: `${baseUrl}/workforce/supply/${spec.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.7 });
  }

  // Employer workforce pages
  for (const fac of getAllFacilities(20).slice(0, 100)) {
    entries.push({ url: `${baseUrl}/workforce/employer/${fac.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.7 });
  }

  // Area workforce pages
  const wfAreas = getAreaStats();
  for (const area of wfAreas) {
    entries.push({ url: `${baseUrl}/workforce/area/${area.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.7 });
    for (const cat of PROFESSIONAL_CATEGORIES) {
      const count = getProfessionalsByAreaAndCategory(area.slug, cat.slug).length;
      if (count >= 10) {
        entries.push({ url: `${baseUrl}/workforce/area/${area.slug}/${cat.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.6 });
      }
    }
  }

  // Rankings pages
  entries.push({ url: `${baseUrl}/workforce/rankings/top-employers`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.8 });
  entries.push({ url: `${baseUrl}/workforce/rankings/largest-specialties`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.8 });
  for (const cat of PROFESSIONAL_CATEGORIES) {
    entries.push({ url: `${baseUrl}/workforce/rankings/top-employers/${cat.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.75 });
  }

  // Benchmark pages
  const benchmarkSlugs = ["nurse-to-doctor", "staff-per-facility", "specialist-per-capita", "ftl-rate"];
  for (const slug of benchmarkSlugs) {
    entries.push({ url: `${baseUrl}/workforce/benchmarks/${slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.75 });
  }

  // Workforce comparison pages
  const wfTop15 = [...PHYSICIAN_SPECIALTIES].sort((a, b) => b.count - a.count).slice(0, 15);
  for (let i = 0; i < wfTop15.length; i++) {
    for (let j = i + 1; j < wfTop15.length; j++) {
      entries.push({ url: `${baseUrl}/workforce/compare/specialty/${wfTop15[i].slug}-vs-${wfTop15[j].slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.6 });
    }
  }
  const wfTopAreas = getTopAreas(10);
  for (let i = 0; i < wfTopAreas.length; i++) {
    for (let j = i + 1; j < wfTopAreas.length; j++) {
      entries.push({ url: `${baseUrl}/workforce/compare/area/${wfTopAreas[i].slug}-vs-${wfTopAreas[j].slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.6 });
    }
  }
  const wfTopFacs = getTopFacilities(20);
  for (let i = 0; i < wfTopFacs.length; i++) {
    for (let j = i + 1; j < wfTopFacs.length; j++) {
      entries.push({ url: `${baseUrl}/workforce/compare/employer/${wfTopFacs[i].slug}-vs-${wfTopFacs[j].slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.55 });
    }
  }
  for (let i = 0; i < PROFESSIONAL_CATEGORIES.length; i++) {
    for (let j = i + 1; j < PROFESSIONAL_CATEGORIES.length; j++) {
      entries.push({ url: `${baseUrl}/workforce/compare/category/${PROFESSIONAL_CATEGORIES[i].slug}-vs-${PROFESSIONAL_CATEGORIES[j].slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.6 });
    }
  }

  // ─── Landing / Product Pages ──────────────────────────────────────────────────
  const LANDING_PRODUCT_SLUGS = [
    "contact", "book-a-demo", "captain", "payments", "emr", "chat", "bookings",
    "ai-agents", "crm", "integrations", "voice", "mobile", "automations",
    "campaigns", "dental", "widgets", "analytics",
  ];
  for (const slug of LANDING_PRODUCT_SLUGS) {
    entries.push({ url: `${baseUrl}/${slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.6 });
  }
  // Landing specialty pages
  const LANDING_SPECIALTY_SLUGS = [
    "dermatology", "optometry", "orthopedics", "ent", "urgent-care",
    "mental-health", "veterinary", "homecare", "aesthetic", "longevity-wellness",
  ];
  for (const slug of LANDING_SPECIALTY_SLUGS) {
    entries.push({ url: `${baseUrl}/${slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.6 });
  }

  // ─── Research Reports ────────────────────────────────────────────────────────
  // Research reports are read from the filesystem at build time. Using hardcoded slugs
  // here because reports-fs.ts reads from disk (not suitable for sitemap sync context).
  entries.push({ url: `${baseUrl}/research`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.85 });
  const RESEARCH_REPORT_SLUGS = [
    "ai-healthcare-uae", "clinics-aesthetics", "fintech-banking-uae",
    "future-retail-ai", "hospitality-dubai", "qatar-business-report",
    "real-estate-protech", "uae-patient-no-show-cost-2026",
  ];
  for (const slug of RESEARCH_REPORT_SLUGS) {
    entries.push({ url: `${baseUrl}/research/${slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.75 });
  }

  // Static pages
  entries.push(
    { url: `${baseUrl}/about`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/editorial-policy`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.4 },
    {
      url: `${baseUrl}/verified-reviews`,
      lastModified: LAST_CONTENT_UPDATE,
      changeFrequency: "monthly",
      priority: 0.5,
      alternates: { languages: { en: `${baseUrl}/verified-reviews`, ar: `${baseUrl}/ar/verified-reviews` } },
    },
    {
      url: `${baseUrl}/ar/verified-reviews`,
      lastModified: LAST_CONTENT_UPDATE,
      changeFrequency: "monthly",
      priority: 0.5,
      alternates: { languages: { en: `${baseUrl}/verified-reviews`, ar: `${baseUrl}/ar/verified-reviews` } },
    },
    { url: `${baseUrl}/privacy-policy`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/terms`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.3 },
  );

  // ─── Arabic Mirrors ─────────────────────────────────────────────────────────
  // Arabic homepage
  entries.push({
    url: `${baseUrl}/ar`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "daily", priority: 0.9,
    alternates: { languages: { en: baseUrl, ar: `${baseUrl}/ar` } },
  });

  // Arabic — directory city + city×category + city×area pages
  for (const city of cities) {
    entries.push({
      url: `${baseUrl}/ar/directory/${city.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "daily", priority: 0.8,
      alternates: { languages: { en: `${baseUrl}/directory/${city.slug}`, ar: `${baseUrl}/ar/directory/${city.slug}` } },
    });
    for (const cat of categories) {
      entries.push({
        url: `${baseUrl}/ar/directory/${city.slug}/${cat.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.7,
        alternates: { languages: { en: `${baseUrl}/directory/${city.slug}/${cat.slug}`, ar: `${baseUrl}/ar/directory/${city.slug}/${cat.slug}` } },
      });
    }
    const areas = getAreasByCity(city.slug);
    for (const area of areas) {
      entries.push({
        url: `${baseUrl}/ar/directory/${city.slug}/${area.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.6,
        alternates: { languages: { en: `${baseUrl}/directory/${city.slug}/${area.slug}`, ar: `${baseUrl}/ar/directory/${city.slug}/${area.slug}` } },
      });
    }
    // Arabic — city insurance index
    entries.push({
      url: `${baseUrl}/ar/directory/${city.slug}/insurance`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.6,
      alternates: { languages: { en: `${baseUrl}/directory/${city.slug}/insurance`, ar: `${baseUrl}/ar/directory/${city.slug}/insurance` } },
    });
    // Arabic — city × insurer pages (mirrors the English geo gate so
    // we never emit e.g. /ar/directory/dubai/insurance/thiqa/).
    const cityInsurancePlansAr = getInsurancePlansByGeo(city.slug);
    for (const insurer of INSURANCE_PROVIDERS) {
      if (!cityInsurancePlansAr.some((p) => p.slug === insurer.slug)) continue;
      if (!eligibility.cityInsurance.has(comboKey(city.slug, insurer.slug))) continue;
      entries.push({
        url: `${baseUrl}/ar/directory/${city.slug}/insurance/${insurer.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.6,
        alternates: { languages: { en: `${baseUrl}/directory/${city.slug}/insurance/${insurer.slug}`, ar: `${baseUrl}/ar/directory/${city.slug}/insurance/${insurer.slug}` } },
      });
    }

    // Arabic — city × condition mirrors (Item 4 Part D). Gated on
    // hand-authored Arabic detail: the AR condition route `notFound()`s
    // when `introAr` is missing, so we must NOT submit those URLs.
    for (const condition of CONDITIONS) {
      if (!getConditionDetail(condition.slug)?.introAr) continue;
      entries.push({
        url: `${baseUrl}/ar/directory/${city.slug}/condition/${condition.slug}`,
        lastModified: LAST_CONTENT_UPDATE,
        changeFrequency: "weekly",
        priority: 0.6,
        alternates: {
          languages: {
            en: `${baseUrl}/directory/${city.slug}/condition/${condition.slug}`,
            ar: `${baseUrl}/ar/directory/${city.slug}/condition/${condition.slug}`,
          },
        },
      });
    }
  }

  // NOTE: `/ar/search` intentionally NOT emitted — same reason as `/search`:
  // the Arabic search page is `robots: { index: false }` and `/search` is in
  // the robots.txt disallow list. Submitting it here would be a contradiction.

  // Arabic — intelligence
  entries.push({
    url: `${baseUrl}/ar/intelligence`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "daily", priority: 0.7,
    alternates: { languages: { en: `${baseUrl}/intelligence`, ar: `${baseUrl}/ar/intelligence` } },
  });

  // Arabic — insurance
  entries.push({
    url: `${baseUrl}/ar/insurance`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.7,
    alternates: { languages: { en: `${baseUrl}/insurance`, ar: `${baseUrl}/ar/insurance` } },
  });
  entries.push({
    url: `${baseUrl}/ar/insurance/compare`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.6,
    alternates: { languages: { en: `${baseUrl}/insurance/compare`, ar: `${baseUrl}/ar/insurance/compare` } },
  });
  for (const insurer of INSURANCE_PROVIDERS) {
    entries.push({
      url: `${baseUrl}/ar/insurance/${insurer.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.65,
      alternates: { languages: { en: `${baseUrl}/insurance/${insurer.slug}`, ar: `${baseUrl}/ar/insurance/${insurer.slug}` } },
    });
  }
  entries.push({
    url: `${baseUrl}/ar/insurance/guide`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.6,
    alternates: { languages: { en: `${baseUrl}/insurance/guide`, ar: `${baseUrl}/ar/insurance/guide` } },
  });
  for (const slug of INSURANCE_GUIDE_SLUGS) {
    entries.push({
      url: `${baseUrl}/ar/insurance/guide/${slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.6,
      alternates: { languages: { en: `${baseUrl}/insurance/guide/${slug}`, ar: `${baseUrl}/ar/insurance/guide/${slug}` } },
    });
  }

  // Arabic — labs
  entries.push({
    url: `${baseUrl}/ar/labs`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.7,
    alternates: { languages: { en: `${baseUrl}/labs`, ar: `${baseUrl}/ar/labs` } },
  });
  entries.push({
    url: `${baseUrl}/ar/labs/compare`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.6,
    alternates: { languages: { en: `${baseUrl}/labs/compare`, ar: `${baseUrl}/ar/labs/compare` } },
  });
  for (const lab of LAB_PROFILES) {
    entries.push({
      url: `${baseUrl}/ar/labs/${lab.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.65,
      alternates: { languages: { en: `${baseUrl}/labs/${lab.slug}`, ar: `${baseUrl}/ar/labs/${lab.slug}` } },
    });
  }
  entries.push({
    url: `${baseUrl}/ar/labs/packages`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.65,
    alternates: { languages: { en: `${baseUrl}/labs/packages`, ar: `${baseUrl}/ar/labs/packages` } },
  });
  entries.push({
    url: `${baseUrl}/ar/labs/home-collection`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.65,
    alternates: { languages: { en: `${baseUrl}/labs/home-collection`, ar: `${baseUrl}/ar/labs/home-collection` } },
  });
  for (const cat of TEST_CATEGORIES) {
    entries.push({
      url: `${baseUrl}/ar/labs/category/${cat.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.6,
      alternates: { languages: { en: `${baseUrl}/labs/category/${cat.slug}`, ar: `${baseUrl}/ar/labs/category/${cat.slug}` } },
    });
  }
  for (const test of LAB_TESTS) {
    entries.push({
      url: `${baseUrl}/ar/labs/test/${test.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.6,
      alternates: { languages: { en: `${baseUrl}/labs/test/${test.slug}`, ar: `${baseUrl}/ar/labs/test/${test.slug}` } },
    });
  }
  for (const city of cities) {
    const cityLabs = LAB_PROFILES.filter((l) => l.cities.includes(city.slug));
    if (cityLabs.length > 0) {
      entries.push({
        url: `${baseUrl}/ar/labs/city/${city.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.6,
        alternates: { languages: { en: `${baseUrl}/labs/city/${city.slug}`, ar: `${baseUrl}/ar/labs/city/${city.slug}` } },
      });
    }
    const hcLabs = LAB_PROFILES.filter((l) => l.cities.includes(city.slug) && l.homeCollection);
    if (hcLabs.length > 0) {
      entries.push({
        url: `${baseUrl}/ar/labs/home-collection/${city.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.6,
        alternates: { languages: { en: `${baseUrl}/labs/home-collection/${city.slug}`, ar: `${baseUrl}/ar/labs/home-collection/${city.slug}` } },
      });
    }
  }

  // ─── Arabic — Professionals Directory ──────────────────────────────────────
  entries.push({
    url: `${baseUrl}/ar/professionals`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.8,
    alternates: { languages: { en: `${baseUrl}/professionals`, ar: `${baseUrl}/ar/professionals` } },
  });
  entries.push({
    url: `${baseUrl}/ar/find-a-doctor`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.8,
    alternates: { languages: { en: `${baseUrl}/find-a-doctor`, ar: `${baseUrl}/ar/find-a-doctor` } },
  });
  entries.push({
    url: `${baseUrl}/ar/professionals/stats`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.7,
    alternates: { languages: { en: `${baseUrl}/professionals/stats`, ar: `${baseUrl}/ar/professionals/stats` } },
  });
  for (const cat of PROFESSIONAL_CATEGORIES) {
    entries.push({
      url: `${baseUrl}/ar/professionals/${cat.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.75,
      alternates: { languages: { en: `${baseUrl}/professionals/${cat.slug}`, ar: `${baseUrl}/ar/professionals/${cat.slug}` } },
    });
  }
  for (const spec of ALL_SPECIALTIES) {
    entries.push({
      url: `${baseUrl}/ar/professionals/${spec.category}/${spec.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.7,
      alternates: { languages: { en: `${baseUrl}/professionals/${spec.category}/${spec.slug}`, ar: `${baseUrl}/ar/professionals/${spec.category}/${spec.slug}` } },
    });
  }
  for (const slug of getAllFacilitySlugs(20)) {
    entries.push({
      url: `${baseUrl}/ar/professionals/facility/${slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.65,
      alternates: { languages: { en: `${baseUrl}/professionals/facility/${slug}`, ar: `${baseUrl}/ar/professionals/facility/${slug}` } },
    });
  }
  for (const area of getAreaStats()) {
    entries.push({
      url: `${baseUrl}/ar/professionals/area/${area.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.65,
      alternates: { languages: { en: `${baseUrl}/professionals/area/${area.slug}`, ar: `${baseUrl}/ar/professionals/area/${area.slug}` } },
    });
  }
  // Arabic — specialist/consultant split
  for (const spec of getSpecialtiesWithBothLevels()) {
    const specDef = ALL_SPECIALTIES.find((s) => s.slug === spec.slug);
    if (specDef) {
      entries.push({
        url: `${baseUrl}/ar/professionals/${specDef.category}/${spec.slug}/specialists`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.6,
        alternates: { languages: { en: `${baseUrl}/professionals/${specDef.category}/${spec.slug}/specialists`, ar: `${baseUrl}/ar/professionals/${specDef.category}/${spec.slug}/specialists` } },
      });
      entries.push({
        url: `${baseUrl}/ar/professionals/${specDef.category}/${spec.slug}/consultants`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.6,
        alternates: { languages: { en: `${baseUrl}/professionals/${specDef.category}/${spec.slug}/consultants`, ar: `${baseUrl}/ar/professionals/${specDef.category}/${spec.slug}/consultants` } },
      });
    }
  }
  // Arabic — specialty comparisons
  for (let i = 0; i < top15Specs.length; i++) {
    for (let j = i + 1; j < top15Specs.length; j++) {
      entries.push({
        url: `${baseUrl}/ar/professionals/compare/${top15Specs[i].slug}-vs-${top15Specs[j].slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.55,
        alternates: { languages: { en: `${baseUrl}/professionals/compare/${top15Specs[i].slug}-vs-${top15Specs[j].slug}`, ar: `${baseUrl}/ar/professionals/compare/${top15Specs[i].slug}-vs-${top15Specs[j].slug}` } },
      });
    }
  }
  // Arabic — professionals guide pages
  const PROF_GUIDE_SLUGS_AR = [
    "specialist-vs-consultant", "dha-licensing", "ftl-vs-reg", "how-to-verify-doctor",
    "choosing-right-specialist", "healthcare-workforce", "medical-specialties-explained", "international-doctors-dubai",
  ];
  for (const slug of PROF_GUIDE_SLUGS_AR) {
    entries.push({
      url: `${baseUrl}/ar/professionals/guide/${slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.65,
      alternates: { languages: { en: `${baseUrl}/professionals/guide/${slug}`, ar: `${baseUrl}/ar/professionals/guide/${slug}` } },
    });
  }

  // ─── Arabic — Best Doctors + Doctors-At ───────────────────────────────────
  entries.push({
    url: `${baseUrl}/ar/best`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.8,
    alternates: { languages: { en: `${baseUrl}/best`, ar: `${baseUrl}/ar/best` } },
  });
  for (const city of cities) {
    entries.push({
      url: `${baseUrl}/ar/best/${city.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.75,
      alternates: { languages: { en: `${baseUrl}/best/${city.slug}`, ar: `${baseUrl}/ar/best/${city.slug}` } },
    });
    for (const cat of categories) {
      if (!eligibility.bestCityCategory.has(comboKey(city.slug, cat.slug))) continue;
      entries.push({
        url: `${baseUrl}/ar/best/${city.slug}/${cat.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.7,
        alternates: { languages: { en: `${baseUrl}/best/${city.slug}/${cat.slug}`, ar: `${baseUrl}/ar/best/${city.slug}/${cat.slug}` } },
      });
    }
  }
  entries.push({
    url: `${baseUrl}/ar/best/doctors`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.8,
    alternates: { languages: { en: `${baseUrl}/best/doctors`, ar: `${baseUrl}/ar/best/doctors` } },
  });
  for (const spec of DOCTOR_SPECIALTIES) {
    entries.push({
      url: `${baseUrl}/ar/best/doctors/${spec.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.75,
      alternates: { languages: { en: `${baseUrl}/best/doctors/${spec.slug}`, ar: `${baseUrl}/ar/best/doctors/${spec.slug}` } },
    });
  }
  for (const fac of getAllFacilities(20).slice(0, 50)) {
    entries.push({
      url: `${baseUrl}/ar/doctors-at/${fac.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.65,
      alternates: { languages: { en: `${baseUrl}/doctors-at/${fac.slug}`, ar: `${baseUrl}/ar/doctors-at/${fac.slug}` } },
    });
  }

  // ─── Arabic — Workforce Intelligence ──────────────────────────────────────
  const arWorkforceHubs = ["workforce", "workforce/overview", "workforce/employers", "workforce/specialties", "workforce/areas", "workforce/benchmarks", "workforce/careers", "workforce/rankings", "workforce/compare", "workforce/supply"];
  for (const hub of arWorkforceHubs) {
    entries.push({
      url: `${baseUrl}/ar/${hub}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.7,
      alternates: { languages: { en: `${baseUrl}/${hub}`, ar: `${baseUrl}/ar/${hub}` } },
    });
  }
  for (const cat of PROFESSIONAL_CATEGORIES) {
    entries.push({
      url: `${baseUrl}/ar/workforce/category/${cat.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.65,
      alternates: { languages: { en: `${baseUrl}/workforce/category/${cat.slug}`, ar: `${baseUrl}/ar/workforce/category/${cat.slug}` } },
    });
    entries.push({
      url: `${baseUrl}/ar/workforce/career/category/${cat.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.6,
      alternates: { languages: { en: `${baseUrl}/workforce/career/category/${cat.slug}`, ar: `${baseUrl}/ar/workforce/career/category/${cat.slug}` } },
    });
  }
  for (const spec of ALL_SPECIALTIES) {
    entries.push({
      url: `${baseUrl}/ar/workforce/specialty/${spec.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.6,
      alternates: { languages: { en: `${baseUrl}/workforce/specialty/${spec.slug}`, ar: `${baseUrl}/ar/workforce/specialty/${spec.slug}` } },
    });
    entries.push({
      url: `${baseUrl}/ar/workforce/career/${spec.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.6,
      alternates: { languages: { en: `${baseUrl}/workforce/career/${spec.slug}`, ar: `${baseUrl}/ar/workforce/career/${spec.slug}` } },
    });
  }
  for (const spec of PHYSICIAN_SPECIALTIES) {
    entries.push({
      url: `${baseUrl}/ar/workforce/supply/${spec.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.6,
      alternates: { languages: { en: `${baseUrl}/workforce/supply/${spec.slug}`, ar: `${baseUrl}/ar/workforce/supply/${spec.slug}` } },
    });
  }
  for (const fac of getAllFacilities(20).slice(0, 100)) {
    entries.push({
      url: `${baseUrl}/ar/workforce/employer/${fac.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.6,
      alternates: { languages: { en: `${baseUrl}/workforce/employer/${fac.slug}`, ar: `${baseUrl}/ar/workforce/employer/${fac.slug}` } },
    });
  }
  for (const area of wfAreas) {
    entries.push({
      url: `${baseUrl}/ar/workforce/area/${area.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.6,
      alternates: { languages: { en: `${baseUrl}/workforce/area/${area.slug}`, ar: `${baseUrl}/ar/workforce/area/${area.slug}` } },
    });
    // Arabic — workforce area × category pages
    for (const cat of PROFESSIONAL_CATEGORIES) {
      const count = getProfessionalsByAreaAndCategory(area.slug, cat.slug).length;
      if (count >= 10) {
        entries.push({
          url: `${baseUrl}/ar/workforce/area/${area.slug}/${cat.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.55,
          alternates: { languages: { en: `${baseUrl}/workforce/area/${area.slug}/${cat.slug}`, ar: `${baseUrl}/ar/workforce/area/${area.slug}/${cat.slug}` } },
        });
      }
    }
  }
  // Arabic — workforce rankings
  entries.push({
    url: `${baseUrl}/ar/workforce/rankings/top-employers`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.65,
    alternates: { languages: { en: `${baseUrl}/workforce/rankings/top-employers`, ar: `${baseUrl}/ar/workforce/rankings/top-employers` } },
  });
  entries.push({
    url: `${baseUrl}/ar/workforce/rankings/largest-specialties`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.65,
    alternates: { languages: { en: `${baseUrl}/workforce/rankings/largest-specialties`, ar: `${baseUrl}/ar/workforce/rankings/largest-specialties` } },
  });
  for (const cat of PROFESSIONAL_CATEGORIES) {
    entries.push({
      url: `${baseUrl}/ar/workforce/rankings/top-employers/${cat.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.6,
      alternates: { languages: { en: `${baseUrl}/workforce/rankings/top-employers/${cat.slug}`, ar: `${baseUrl}/ar/workforce/rankings/top-employers/${cat.slug}` } },
    });
  }
  // Arabic — workforce benchmarks
  for (const slug of benchmarkSlugs) {
    entries.push({
      url: `${baseUrl}/ar/workforce/benchmarks/${slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.6,
      alternates: { languages: { en: `${baseUrl}/workforce/benchmarks/${slug}`, ar: `${baseUrl}/ar/workforce/benchmarks/${slug}` } },
    });
  }
  // Arabic — workforce compare sub-pages (specialty, area, employer, category)
  for (let i = 0; i < wfTop15.length; i++) {
    for (let j = i + 1; j < wfTop15.length; j++) {
      entries.push({
        url: `${baseUrl}/ar/workforce/compare/specialty/${wfTop15[i].slug}-vs-${wfTop15[j].slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.55,
        alternates: { languages: { en: `${baseUrl}/workforce/compare/specialty/${wfTop15[i].slug}-vs-${wfTop15[j].slug}`, ar: `${baseUrl}/ar/workforce/compare/specialty/${wfTop15[i].slug}-vs-${wfTop15[j].slug}` } },
      });
    }
  }
  for (let i = 0; i < wfTopAreas.length; i++) {
    for (let j = i + 1; j < wfTopAreas.length; j++) {
      entries.push({
        url: `${baseUrl}/ar/workforce/compare/area/${wfTopAreas[i].slug}-vs-${wfTopAreas[j].slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.55,
        alternates: { languages: { en: `${baseUrl}/workforce/compare/area/${wfTopAreas[i].slug}-vs-${wfTopAreas[j].slug}`, ar: `${baseUrl}/ar/workforce/compare/area/${wfTopAreas[i].slug}-vs-${wfTopAreas[j].slug}` } },
      });
    }
  }
  for (let i = 0; i < wfTopFacs.length; i++) {
    for (let j = i + 1; j < wfTopFacs.length; j++) {
      entries.push({
        url: `${baseUrl}/ar/workforce/compare/employer/${wfTopFacs[i].slug}-vs-${wfTopFacs[j].slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.5,
        alternates: { languages: { en: `${baseUrl}/workforce/compare/employer/${wfTopFacs[i].slug}-vs-${wfTopFacs[j].slug}`, ar: `${baseUrl}/ar/workforce/compare/employer/${wfTopFacs[i].slug}-vs-${wfTopFacs[j].slug}` } },
      });
    }
  }
  for (let i = 0; i < PROFESSIONAL_CATEGORIES.length; i++) {
    for (let j = i + 1; j < PROFESSIONAL_CATEGORIES.length; j++) {
      entries.push({
        url: `${baseUrl}/ar/workforce/compare/category/${PROFESSIONAL_CATEGORIES[i].slug}-vs-${PROFESSIONAL_CATEGORIES[j].slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.55,
        alternates: { languages: { en: `${baseUrl}/workforce/compare/category/${PROFESSIONAL_CATEGORIES[i].slug}-vs-${PROFESSIONAL_CATEGORIES[j].slug}`, ar: `${baseUrl}/ar/workforce/compare/category/${PROFESSIONAL_CATEGORIES[i].slug}-vs-${PROFESSIONAL_CATEGORIES[j].slug}` } },
      });
    }
  }

  // ─── Arabic — Pricing ─────────────────────────────────────────────────────
  entries.push({
    url: `${baseUrl}/ar/pricing`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.8,
    alternates: { languages: { en: `${baseUrl}/pricing`, ar: `${baseUrl}/ar/pricing` } },
  });
  for (const proc of PROCEDURES) {
    entries.push({
      url: `${baseUrl}/ar/pricing/${proc.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.7,
      alternates: { languages: { en: `${baseUrl}/pricing/${proc.slug}`, ar: `${baseUrl}/ar/pricing/${proc.slug}` } },
    });
    for (const city of cities) {
      if (proc.cityPricing[city.slug]) {
        entries.push({
          url: `${baseUrl}/ar/pricing/${proc.slug}/${city.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.65,
          alternates: { languages: { en: `${baseUrl}/pricing/${proc.slug}/${city.slug}`, ar: `${baseUrl}/ar/pricing/${proc.slug}/${city.slug}` } },
        });
      }
    }
  }
  for (const cat of PROCEDURE_CATEGORIES) {
    entries.push({
      url: `${baseUrl}/ar/pricing/category/${cat.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.6,
      alternates: { languages: { en: `${baseUrl}/pricing/category/${cat.slug}`, ar: `${baseUrl}/ar/pricing/category/${cat.slug}` } },
    });
    for (const city of cities) {
      entries.push({
        url: `${baseUrl}/ar/pricing/category/${cat.slug}/${city.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.55,
        alternates: { languages: { en: `${baseUrl}/pricing/category/${cat.slug}/${city.slug}`, ar: `${baseUrl}/ar/pricing/category/${cat.slug}/${city.slug}` } },
      });
    }
  }
  for (const city of cities) {
    entries.push({
      url: `${baseUrl}/ar/pricing/city/${city.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.65,
      alternates: { languages: { en: `${baseUrl}/pricing/city/${city.slug}`, ar: `${baseUrl}/ar/pricing/city/${city.slug}` } },
    });
  }
  entries.push({
    url: `${baseUrl}/ar/pricing/compare`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.6,
    alternates: { languages: { en: `${baseUrl}/pricing/compare`, ar: `${baseUrl}/ar/pricing/compare` } },
  });
  // UAE-only mirror — same reason as the EN pair loop above
  for (let i = 0; i < cities.length; i++) {
    for (let j = i + 1; j < cities.length; j++) {
      entries.push({
        url: `${baseUrl}/ar/pricing/compare/${cities[i].slug}-vs-${cities[j].slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.55,
        alternates: { languages: { en: `${baseUrl}/pricing/compare/${cities[i].slug}-vs-${cities[j].slug}`, ar: `${baseUrl}/ar/pricing/compare/${cities[i].slug}-vs-${cities[j].slug}` } },
      });
    }
  }
  entries.push({
    url: `${baseUrl}/ar/pricing/guide`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.6,
    alternates: { languages: { en: `${baseUrl}/pricing/guide`, ar: `${baseUrl}/ar/pricing/guide` } },
  });
  for (const guide of PRICING_GUIDES) {
    entries.push({
      url: `${baseUrl}/ar/pricing/guide/${guide.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.6,
      alternates: { languages: { en: `${baseUrl}/pricing/guide/${guide.slug}`, ar: `${baseUrl}/ar/pricing/guide/${guide.slug}` } },
    });
    for (const city of cities) {
      entries.push({
        url: `${baseUrl}/ar/pricing/guide/${guide.slug}/${city.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.55,
        alternates: { languages: { en: `${baseUrl}/pricing/guide/${guide.slug}/${city.slug}`, ar: `${baseUrl}/ar/pricing/guide/${guide.slug}/${city.slug}` } },
      });
    }
  }
  entries.push({
    url: `${baseUrl}/ar/pricing/journey`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.6,
    alternates: { languages: { en: `${baseUrl}/pricing/journey`, ar: `${baseUrl}/ar/pricing/journey` } },
  });
  for (const journey of CARE_JOURNEYS) {
    entries.push({
      url: `${baseUrl}/ar/pricing/journey/${journey.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.6,
      alternates: { languages: { en: `${baseUrl}/pricing/journey/${journey.slug}`, ar: `${baseUrl}/ar/pricing/journey/${journey.slug}` } },
    });
    for (const city of cities) {
      entries.push({
        url: `${baseUrl}/ar/pricing/journey/${journey.slug}/${city.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.55,
        alternates: { languages: { en: `${baseUrl}/pricing/journey/${journey.slug}/${city.slug}`, ar: `${baseUrl}/ar/pricing/journey/${journey.slug}/${city.slug}` } },
      });
    }
  }
  entries.push({
    url: `${baseUrl}/ar/pricing/lists`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.6,
    alternates: { languages: { en: `${baseUrl}/pricing/lists`, ar: `${baseUrl}/ar/pricing/lists` } },
  });
  for (const list of PRICING_LISTS) {
    for (const city of cities) {
      entries.push({
        url: `${baseUrl}/ar/pricing/lists/${list.slug}/${city.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.55,
        alternates: { languages: { en: `${baseUrl}/pricing/lists/${list.slug}/${city.slug}`, ar: `${baseUrl}/ar/pricing/lists/${list.slug}/${city.slug}` } },
      });
    }
  }
  entries.push({
    url: `${baseUrl}/ar/pricing/vs`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.6,
    alternates: { languages: { en: `${baseUrl}/pricing/vs`, ar: `${baseUrl}/ar/pricing/vs` } },
  });
  for (const comp of PROCEDURE_COMPARISONS) {
    entries.push({
      url: `${baseUrl}/ar/pricing/vs/${comp.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.6,
      alternates: { languages: { en: `${baseUrl}/pricing/vs/${comp.slug}`, ar: `${baseUrl}/ar/pricing/vs/${comp.slug}` } },
    });
    for (const city of cities) {
      entries.push({
        url: `${baseUrl}/ar/pricing/vs/${comp.slug}/${city.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.55,
        alternates: { languages: { en: `${baseUrl}/pricing/vs/${comp.slug}/${city.slug}`, ar: `${baseUrl}/ar/pricing/vs/${comp.slug}/${city.slug}` } },
      });
    }
  }

  // ─── Arabic — Directory Guides, Compare, Top ──────────────────────────────
  entries.push({
    url: `${baseUrl}/ar/directory/guide`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.6,
    alternates: { languages: { en: `${baseUrl}/directory/guide`, ar: `${baseUrl}/ar/directory/guide` } },
  });
  for (const slug of GUIDE_SLUGS) {
    entries.push({
      url: `${baseUrl}/ar/directory/guide/${slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.55,
      alternates: { languages: { en: `${baseUrl}/directory/guide/${slug}`, ar: `${baseUrl}/ar/directory/guide/${slug}` } },
    });
  }
  entries.push({
    url: `${baseUrl}/ar/directory/compare`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.6,
    alternates: { languages: { en: `${baseUrl}/directory/compare`, ar: `${baseUrl}/ar/directory/compare` } },
  });
  entries.push({
    url: `${baseUrl}/ar/directory/top`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.7,
    alternates: { languages: { en: `${baseUrl}/directory/top`, ar: `${baseUrl}/ar/directory/top` } },
  });
  for (const cat of categories) {
    if (!eligibility.topUaeCategory.has(cat.slug)) continue;
    entries.push({
      url: `${baseUrl}/ar/directory/top/${cat.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.65,
      alternates: { languages: { en: `${baseUrl}/directory/top/${cat.slug}`, ar: `${baseUrl}/ar/directory/top/${cat.slug}` } },
    });
  }

  // Arabic — intelligence category pages
  for (const cat of JOURNAL_CATEGORIES) {
    entries.push({
      url: `${baseUrl}/ar/intelligence/category/${cat.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "daily", priority: 0.65,
      alternates: { languages: { en: `${baseUrl}/intelligence/category/${cat.slug}`, ar: `${baseUrl}/ar/intelligence/category/${cat.slug}` } },
    });
  }

  // SEO Guides (cost guides, comparisons, system guides)
  entries.push({ url: `${baseUrl}/guides`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.9 });
  for (const guide of GUIDES) {
    entries.push({ url: `${baseUrl}/guides/${guide.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.85 });
  }

  return dedupeSitemapEntries(entries);
}
