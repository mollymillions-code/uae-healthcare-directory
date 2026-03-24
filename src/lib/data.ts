/**
 * Data access layer — uses real scraped provider data from MOHAP/DHA/DOH.
 * No sample/seed data. Neon Postgres used in production (when DATABASE_URL is set).
 */

import { CITIES, AREAS } from "./constants/cities";
import { CATEGORIES, SUBCATEGORIES } from "./constants/categories";
import { INSURANCE_PROVIDERS, InsuranceProvider } from "./constants/insurance";
import { LANGUAGES, LanguageInfo } from "./constants/languages";
import { CONDITIONS, Condition } from "./constants/conditions";

// Types for local data
export interface LocalCity {
  slug: string;
  name: string;
  emirate: string;
  nameAr?: string;
  latitude: string;
  longitude: string;
  description: string;
  sortOrder: number;
}

export interface LocalArea {
  slug: string;
  name: string;
  nameAr?: string;
  latitude: string;
  longitude: string;
  citySlug: string;
}

export interface LocalCategory {
  slug: string;
  name: string;
  icon: string;
  sortOrder: number;
}

export interface LocalProvider {
  id: string;
  name: string;
  slug: string;
  citySlug: string;
  areaSlug?: string;
  categorySlug: string;
  subcategorySlug?: string;
  address: string;
  phone?: string;
  website?: string;
  description: string;
  shortDescription: string;
  googleRating: string;
  googleReviewCount: number;
  latitude: string;
  longitude: string;
  isClaimed: boolean;
  isVerified: boolean;
  services: string[];
  languages: string[];
  insurance: string[];
  operatingHours: Record<string, { open: string; close: string }>;
  amenities: string[];
  lastVerified: string; // ISO date — freshness signal for LLMs
  email?: string;
  facilityType?: string;
  reviewSummary?: string[];
  coverImageUrl?: string;
}

// ─── Load scraped providers if available ────────────────────────────────────────

let SCRAPED_PROVIDERS: LocalProvider[] = [];
try {
  // At build time, try to load the scraped MOHAP data
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const scraped = require("./providers-scraped.json") as Array<{
    id: string; name: string; slug: string; citySlug: string; categorySlug: string;
    facilityType?: string; specialty?: string | null; address: string;
    description: string; shortDescription: string; services: string[];
    languages: string[]; insurance: string[]; operatingHours: Record<string, { open: string; close: string }>;
    amenities: string[]; lastVerified: string; googleRating: string | null;
    googleReviewCount: number; isClaimed: boolean; isVerified: boolean;
    latitude?: string | null; longitude?: string | null;
  }>;
  SCRAPED_PROVIDERS = scraped.map((p) => ({
    ...p,
    googleRating: p.googleRating || "0",
    googleReviewCount: p.googleReviewCount || 0,
    latitude: p.latitude || "0",
    longitude: p.longitude || "0",
  }));
} catch {
  // No scraped data yet — that's fine
}

// ─── Provider List ─────────────────────────────────────────────────────────────

// Only real scraped data from MOHAP/DHA/DOH registers. No sample/seed providers.
const ALL_PROVIDERS: LocalProvider[] = [...SCRAPED_PROVIDERS];

// ─── Data Access Functions ─────────────────────────────────────────────────────

export function getCities(): LocalCity[] {
  return [...CITIES];
}

export function getCityBySlug(slug: string): LocalCity | undefined {
  return CITIES.find((c) => c.slug === slug);
}

export function getAreasByCity(citySlug: string): LocalArea[] {
  const cityAreas = AREAS[citySlug] || [];
  return cityAreas.map((a) => ({ ...a, citySlug }));
}

export function getAreaBySlug(citySlug: string, areaSlug: string): LocalArea | undefined {
  const cityAreas = AREAS[citySlug] || [];
  const area = cityAreas.find((a) => a.slug === areaSlug);
  return area ? { ...area, citySlug } : undefined;
}

export function getCategories(): LocalCategory[] {
  return CATEGORIES.map((c) => ({ slug: c.slug, name: c.name, icon: c.icon, sortOrder: c.sortOrder }));
}

export function getCategoryBySlug(slug: string): LocalCategory | undefined {
  const cat = CATEGORIES.find((c) => c.slug === slug);
  return cat ? { slug: cat.slug, name: cat.name, icon: cat.icon, sortOrder: cat.sortOrder } : undefined;
}

export function getSubcategoriesByCategory(categorySlug: string) {
  return SUBCATEGORIES[categorySlug] || [];
}

export function getProviders(filters?: {
  citySlug?: string;
  categorySlug?: string;
  subcategorySlug?: string;
  areaSlug?: string;
  query?: string;
  page?: number;
  limit?: number;
  sort?: "rating" | "name" | "relevance";
}): { providers: LocalProvider[]; total: number; page: number; totalPages: number } {
  let filtered = [...ALL_PROVIDERS];

  if (filters?.citySlug) {
    filtered = filtered.filter((p) => p.citySlug === filters.citySlug);
  }
  if (filters?.categorySlug) {
    filtered = filtered.filter((p) => p.categorySlug === filters.categorySlug);
  }
  if (filters?.subcategorySlug) {
    filtered = filtered.filter((p) => p.subcategorySlug === filters.subcategorySlug);
  }
  if (filters?.areaSlug) {
    filtered = filtered.filter((p) => p.areaSlug === filters.areaSlug);
  }
  if (filters?.query) {
    const q = filters.query.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.address.toLowerCase().includes(q)
    );
  }

  // Sort
  if (filters?.sort === "rating") {
    filtered.sort((a, b) => Number(b.googleRating) - Number(a.googleRating));
  } else if (filters?.sort === "name") {
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  }

  const page = filters?.page || 1;
  const limit = filters?.limit || 20;
  const total = filtered.length;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const providers = filtered.slice(start, start + limit);

  return { providers, total, page, totalPages };
}

export function getProviderBySlug(slug: string): LocalProvider | undefined {
  return ALL_PROVIDERS.find((p) => p.slug === slug);
}

export function getProviderCountByCity(citySlug: string): number {
  return ALL_PROVIDERS.filter((p) => p.citySlug === citySlug).length;
}

export function getProviderCountByCategoryAndCity(categorySlug: string, citySlug: string): number {
  return ALL_PROVIDERS.filter((p) => p.categorySlug === categorySlug && p.citySlug === citySlug).length;
}

export function getProviderCountByCategory(categorySlug: string): number {
  return ALL_PROVIDERS.filter((p) => p.categorySlug === categorySlug).length;
}

export function getProviderCountByAreaAndCity(areaSlug: string, citySlug: string): number {
  return ALL_PROVIDERS.filter((p) => p.areaSlug === areaSlug && p.citySlug === citySlug).length;
}

export function getTopRatedProviders(citySlug?: string, limit = 5): LocalProvider[] {
  let filtered = [...ALL_PROVIDERS];
  if (citySlug) {
    filtered = filtered.filter((p) => p.citySlug === citySlug);
  }
  return filtered
    .sort((a, b) => {
      const ratingA = Number(a.googleRating) || 0;
      const ratingB = Number(b.googleRating) || 0;
      // Providers with ratings first, then by rating desc, then alphabetical
      if (ratingB !== ratingA) return ratingB - ratingA;
      return a.name.localeCompare(b.name);
    })
    .slice(0, limit);
}

export function getFaqs(entityType: string, entitySlug: string): { question: string; answer: string }[] {
  const city = CITIES.find((c) => c.slug === entitySlug);
  const cat = CATEGORIES.find((c) => c.slug === entitySlug);

  if (entityType === "city" && city) {
    return [
      { question: `How many healthcare providers are in ${city.name}?`, answer: `According to the UAE Open Healthcare Directory, ${city.name} has numerous registered healthcare providers including hospitals, clinics, dental practices, and specialty centers. Browse the UAE Open Healthcare Directory to find all providers by category and area.` },
      { question: `What are the best-rated hospitals in ${city.name}?`, answer: `The top-rated hospitals in ${city.name} can be found by sorting the UAE Open Healthcare Directory hospital listings by Google rating. Many hospitals maintain ratings above 4.5 stars.` },
      { question: `How do I find a doctor near me in ${city.name}?`, answer: `Use the search feature on the UAE Open Healthcare Directory and enable location access to find healthcare providers nearest to you in ${city.name}. You can filter by specialty, area, and rating.` },
      { question: `Which insurance providers are accepted in ${city.name}?`, answer: `Most healthcare providers in ${city.name} accept major insurance plans including Daman, Thiqa, Dubai Insurance Company (DIC), AXA, Cigna, and others. Check individual provider listings on the UAE Open Healthcare Directory for specifics.` },
    ];
  }

  if (entityType === "category" && cat) {
    return [
      { question: `How do I find the best ${cat.name.toLowerCase()} in the UAE?`, answer: `Browse the UAE Open Healthcare Directory ${cat.name.toLowerCase()} listings to compare providers across all UAE cities. Sort by rating, read Google reviews, and check accepted insurance plans.` },
      { question: `Are ${cat.name.toLowerCase()} services covered by insurance in the UAE?`, answer: `Most major insurance plans in the UAE cover ${cat.name.toLowerCase()} services. Coverage varies by plan. Check with your insurance provider and verify at individual clinics.` },
    ];
  }

  return [];
}

// ─── Insurance Data Access Functions ──────────────────────────────────────────

export type { InsuranceProvider };

export function getInsuranceProviders(): InsuranceProvider[] {
  return [...INSURANCE_PROVIDERS];
}

export function getProvidersByInsurance(insurerSlug: string, citySlug?: string): LocalProvider[] {
  const insurer = INSURANCE_PROVIDERS.find((i) => i.slug === insurerSlug);
  if (!insurer) return [];

  const matchTerms = [insurer.slug, insurer.name.toLowerCase()];

  let filtered = ALL_PROVIDERS.filter((p) =>
    p.insurance.some((ins) => matchTerms.some((term) => ins.toLowerCase().includes(term)))
  );

  if (citySlug) {
    filtered = filtered.filter((p) => p.citySlug === citySlug);
  }

  return filtered;
}

export function getProviderCountByInsurance(insurerSlug: string, citySlug: string): number {
  return getProvidersByInsurance(insurerSlug, citySlug).length;
}

// ─── Language Data Access Functions ───────────────────────────────────────────

export type { LanguageInfo };

export function getLanguages(): LanguageInfo[] {
  return [...LANGUAGES];
}

/** Alias matching the naming convention used by consumer code */
export const getLanguagesList = getLanguages;

export function getProvidersByLanguage(languageSlug: string, citySlug?: string): LocalProvider[] {
  const language = LANGUAGES.find((l) => l.slug === languageSlug);
  if (!language) return [];

  const matchName = language.name.toLowerCase();

  let filtered = ALL_PROVIDERS.filter((p) =>
    p.languages.some((lang) => lang.toLowerCase() === matchName)
  );

  if (citySlug) {
    filtered = filtered.filter((p) => p.citySlug === citySlug);
  }

  return filtered;
}

export function getProviderCountByLanguage(languageSlug: string, citySlug: string): number {
  return getProvidersByLanguage(languageSlug, citySlug).length;
}

// ─── Condition Data Access Functions ──────────────────────────────────────────

export type { Condition };

export function getConditions(): Condition[] {
  return [...CONDITIONS];
}
