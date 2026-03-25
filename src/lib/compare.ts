/**
 * Comparison data layer for healthcare directory comparison pages.
 * Generates city-vs-city and category comparison data from real provider data.
 */

import { CITIES } from "./constants/cities";
import { CATEGORIES } from "./constants/categories";
import {
  getCities,
  getProviders,
  getProviderCountByCategoryAndCity,
  getTopRatedProviders,
  LocalProvider,
} from "./data";

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface CityComparisonData {
  slug: string;
  cityA: { slug: string; name: string; emirate: string };
  cityB: { slug: string; name: string; emirate: string };
  statsA: CityStats;
  statsB: CityStats;
}

export interface CityStats {
  totalProviders: number;
  avgRating: number;
  ratedProviderCount: number;
  topProviders: { name: string; rating: string; reviewCount: number; category: string }[];
  regulator: string;
  gpFeeRange: string;
  specialistFeeRange: string;
  emergencyFeeRange: string;
  insuranceNote: string;
  hospitalCount: number;
  clinicCount: number;
  dentalCount: number;
  pharmacyCount: number;
}

export interface CategoryComparisonData {
  slug: string;
  citySlug: string;
  cityName: string;
  categoryA: { slug: string; name: string };
  categoryB: { slug: string; name: string };
  statsA: CategoryStats;
  statsB: CategoryStats;
}

export interface CategoryStats {
  totalProviders: number;
  avgRating: number;
  ratedProviderCount: number;
  topProviders: { name: string; rating: string; reviewCount: number }[];
  priceRange: string;
  insuranceNote: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────────

function getRegulator(citySlug: string): string {
  if (citySlug === "dubai") return "Dubai Health Authority (DHA)";
  if (citySlug === "abu-dhabi" || citySlug === "al-ain")
    return "Department of Health Abu Dhabi (DOH)";
  return "Ministry of Health and Prevention (MOHAP)";
}

function getGpFeeRange(citySlug: string): string {
  if (citySlug === "dubai") return "AED 150-300";
  if (citySlug === "abu-dhabi" || citySlug === "al-ain") return "AED 100-250";
  if (citySlug === "sharjah") return "AED 100-200";
  return "AED 80-200";
}

function getSpecialistFeeRange(citySlug: string): string {
  if (citySlug === "dubai") return "AED 300-800";
  if (citySlug === "abu-dhabi" || citySlug === "al-ain") return "AED 250-700";
  if (citySlug === "sharjah") return "AED 200-600";
  return "AED 150-500";
}

function getEmergencyFeeRange(citySlug: string): string {
  if (citySlug === "dubai") return "AED 300-1,000";
  if (citySlug === "abu-dhabi" || citySlug === "al-ain") return "AED 250-900";
  if (citySlug === "sharjah") return "AED 200-800";
  return "AED 150-700";
}

function getInsuranceNote(citySlug: string): string {
  if (citySlug === "dubai") {
    return "Dubai mandates employer-provided health insurance under the DHA Essential Benefits Plan (since 2014). Major insurers: Daman, AXA, Cigna, MetLife, Bupa, Oman Insurance, Orient Insurance, Allianz.";
  }
  if (citySlug === "abu-dhabi" || citySlug === "al-ain") {
    return "Abu Dhabi requires health insurance under the DOH framework. UAE nationals receive Thiqa coverage; expatriates are typically covered by Daman or employer-arranged plans. AXA, Cigna, MetLife, Allianz also accepted.";
  }
  if (citySlug === "sharjah") {
    return "Sharjah follows MOHAP guidelines. Widely accepted plans include Daman, AXA, Cigna, MetLife, Orient Insurance, Oman Insurance. Many employers offer group health plans.";
  }
  return "Northern Emirates follow MOHAP coverage rules. Daman, AXA, Cigna, Orient Insurance, Oman Insurance commonly accepted. Check individual provider listings for plan specifics.";
}

function getCategoryPriceRange(categorySlug: string, citySlug: string): string {
  const priceMap: Record<string, Record<string, string>> = {
    hospitals: { dubai: "AED 300-800", "abu-dhabi": "AED 250-700", "al-ain": "AED 250-700", sharjah: "AED 200-600", default: "AED 150-500" },
    clinics: { dubai: "AED 150-300", "abu-dhabi": "AED 100-250", "al-ain": "AED 100-250", sharjah: "AED 100-200", default: "AED 80-200" },
    dental: { dubai: "AED 200-800", "abu-dhabi": "AED 150-700", "al-ain": "AED 150-700", sharjah: "AED 130-600", default: "AED 100-500" },
    pharmacy: { dubai: "AED 10-50 (generics)", "abu-dhabi": "AED 10-50 (generics)", "al-ain": "AED 10-50 (generics)", sharjah: "AED 10-50 (generics)", default: "AED 10-50 (generics)" },
  };
  const entry = priceMap[categorySlug];
  if (!entry) return "AED 300-800";
  return entry[citySlug] || entry.default || "AED 300-800";
}

function computeAvgRating(providers: LocalProvider[]): { avgRating: number; ratedCount: number } {
  const rated = providers.filter((p) => Number(p.googleRating) > 0);
  if (rated.length === 0) return { avgRating: 0, ratedCount: 0 };
  const sum = rated.reduce((acc, p) => acc + Number(p.googleRating), 0);
  return { avgRating: Math.round((sum / rated.length) * 10) / 10, ratedCount: rated.length };
}

async function getTopProviderSummary(citySlug: string, limit = 5) {
  const top = await getTopRatedProviders(citySlug, limit);
  return top.map((p) => ({
    name: p.name,
    rating: p.googleRating,
    reviewCount: p.googleReviewCount,
    category: p.categorySlug,
  }));
}

// ─── City Comparison Data ────────────────────────────────────────────────────

async function buildCityStats(citySlug: string): Promise<CityStats> {
  const { providers } = await getProviders({ citySlug, limit: 99999 });
  const { avgRating, ratedCount } = computeAvgRating(providers);
  const [topProviders, hospitalCount, clinicCount, dentalCount, pharmacyCount] = await Promise.all([
    getTopProviderSummary(citySlug, 5),
    getProviderCountByCategoryAndCity("hospitals", citySlug),
    getProviderCountByCategoryAndCity("clinics", citySlug),
    getProviderCountByCategoryAndCity("dental", citySlug),
    getProviderCountByCategoryAndCity("pharmacy", citySlug),
  ]);
  return {
    totalProviders: providers.length,
    avgRating,
    ratedProviderCount: ratedCount,
    topProviders,
    regulator: getRegulator(citySlug),
    gpFeeRange: getGpFeeRange(citySlug),
    specialistFeeRange: getSpecialistFeeRange(citySlug),
    emergencyFeeRange: getEmergencyFeeRange(citySlug),
    insuranceNote: getInsuranceNote(citySlug),
    hospitalCount,
    clinicCount,
    dentalCount,
    pharmacyCount,
  };
}

export async function getCityComparison(cityASlug: string, cityBSlug: string): Promise<CityComparisonData | null> {
  const cityA = CITIES.find((c) => c.slug === cityASlug);
  const cityB = CITIES.find((c) => c.slug === cityBSlug);
  if (!cityA || !cityB) return null;

  const [statsA, statsB] = await Promise.all([
    buildCityStats(cityASlug),
    buildCityStats(cityBSlug),
  ]);

  return {
    slug: `${cityASlug}-vs-${cityBSlug}`,
    cityA: { slug: cityA.slug, name: cityA.name, emirate: cityA.emirate },
    cityB: { slug: cityB.slug, name: cityB.name, emirate: cityB.emirate },
    statsA,
    statsB,
  };
}

// ─── Category Comparison Data ───────────────────────────────────────────────

async function buildCategoryStats(categorySlug: string, citySlug: string): Promise<CategoryStats> {
  const { providers } = await getProviders({ citySlug, categorySlug, limit: 99999 });
  const { avgRating, ratedCount } = computeAvgRating(providers);
  const top = [...providers]
    .filter((p) => Number(p.googleRating) > 0)
    .sort((a, b) => Number(b.googleRating) - Number(a.googleRating) || b.googleReviewCount - a.googleReviewCount)
    .slice(0, 5);

  return {
    totalProviders: providers.length,
    avgRating,
    ratedProviderCount: ratedCount,
    topProviders: top.map((p) => ({ name: p.name, rating: p.googleRating, reviewCount: p.googleReviewCount })),
    priceRange: getCategoryPriceRange(categorySlug, citySlug),
    insuranceNote: getInsuranceNote(citySlug),
  };
}

export async function getCategoryComparison(
  catASlug: string,
  catBSlug: string,
  citySlug: string
): Promise<CategoryComparisonData | null> {
  const city = CITIES.find((c) => c.slug === citySlug);
  const catA = CATEGORIES.find((c) => c.slug === catASlug);
  const catB = CATEGORIES.find((c) => c.slug === catBSlug);
  if (!city || !catA || !catB) return null;

  const [statsA, statsB] = await Promise.all([
    buildCategoryStats(catASlug, citySlug),
    buildCategoryStats(catBSlug, citySlug),
  ]);

  return {
    slug: `${catASlug}-vs-${catBSlug}-${citySlug}`,
    citySlug: city.slug,
    cityName: city.name,
    categoryA: { slug: catA.slug, name: catA.name },
    categoryB: { slug: catB.slug, name: catB.name },
    statsA,
    statsB,
  };
}

// ─── Generate All Comparison Slugs ───────────────────────────────────────────

/** All 28 city pairs */
export function getAllCityPairSlugs(): { slug: string; cityASlug: string; cityBSlug: string }[] {
  const cities = getCities();
  const pairs: { slug: string; cityASlug: string; cityBSlug: string }[] = [];
  for (let i = 0; i < cities.length; i++) {
    for (let j = i + 1; j < cities.length; j++) {
      pairs.push({
        slug: `${cities[i].slug}-vs-${cities[j].slug}`,
        cityASlug: cities[i].slug,
        cityBSlug: cities[j].slug,
      });
    }
  }
  return pairs;
}

/** Category comparison slugs: hospitals-vs-clinics per major city */
export function getAllCategoryComparisonSlugs(): {
  slug: string;
  catASlug: string;
  catBSlug: string;
  citySlug: string;
}[] {
  const majorCities = ["dubai", "abu-dhabi", "sharjah", "ajman", "ras-al-khaimah", "al-ain"];
  const comparisons: { slug: string; catASlug: string; catBSlug: string; citySlug: string }[] = [];

  for (const citySlug of majorCities) {
    comparisons.push({
      slug: `hospitals-vs-clinics-${citySlug}`,
      catASlug: "hospitals",
      catBSlug: "clinics",
      citySlug,
    });
  }

  return comparisons;
}

/** Unified slugs for generateStaticParams */
export function getAllComparisonSlugs(): string[] {
  const cityPairs = getAllCityPairSlugs().map((p) => p.slug);
  const catComps = getAllCategoryComparisonSlugs().map((c) => c.slug);
  return [...cityPairs, ...catComps];
}

/** Parse a comparison slug into its constituent parts */
export function parseComparisonSlug(slug: string): {
  type: "city" | "category";
  cityASlug?: string;
  cityBSlug?: string;
  catASlug?: string;
  catBSlug?: string;
  citySlug?: string;
} | null {
  // Try city pair first
  const cityPairs = getAllCityPairSlugs();
  const cityPair = cityPairs.find((p) => p.slug === slug);
  if (cityPair) {
    return { type: "city", cityASlug: cityPair.cityASlug, cityBSlug: cityPair.cityBSlug };
  }

  // Try category comparison
  const catComps = getAllCategoryComparisonSlugs();
  const catComp = catComps.find((c) => c.slug === slug);
  if (catComp) {
    return {
      type: "category",
      catASlug: catComp.catASlug,
      catBSlug: catComp.catBSlug,
      citySlug: catComp.citySlug,
    };
  }

  return null;
}
