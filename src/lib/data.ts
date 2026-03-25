/**
 * Data access layer — uses real scraped provider data from MOHAP/DHA/DOH.
 * Pre-builds index maps at module load for O(1) lookups instead of O(n) scans.
 */

import { CITIES, AREAS } from "./constants/cities";
import { CATEGORIES, SUBCATEGORIES } from "./constants/categories";
import { INSURANCE_PROVIDERS, InsuranceProvider } from "./constants/insurance";
import { LANGUAGES, LanguageInfo } from "./constants/languages";
import { CONDITIONS, Condition } from "./constants/conditions";

// ─── Types ──────────────────────────────────────────────────────────────────────

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
  lastVerified: string;
  email?: string;
  facilityType?: string;
  reviewSummary?: string[];
  reviewSummaryAr?: string[];
  descriptionAr?: string;
  coverImageUrl?: string;
  googlePhotoUrl?: string;
}

// ─── Load scraped providers ─────────────────────────────────────────────────────

let ALL_PROVIDERS: LocalProvider[] = [];
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const scraped = require("./providers-scraped.json") as Record<string, unknown>[];
  ALL_PROVIDERS = scraped.map((p: Record<string, unknown>) => ({
    ...(p as unknown as LocalProvider),
    googleRating: (p.googleRating as string) || "0",
    googleReviewCount: (p.googleReviewCount as number) || 0,
    latitude: (p.latitude as string) || "0",
    longitude: (p.longitude as string) || "0",
  }));
} catch {
  // No scraped data yet
}

// ─── Pre-built Index Maps (O(1) lookups) ────────────────────────────────────────

const byCity = new Map<string, LocalProvider[]>();
const byCityCategory = new Map<string, LocalProvider[]>();
const byCityCategoryArea = new Map<string, LocalProvider[]>();
const byCityArea = new Map<string, LocalProvider[]>();
const bySlug = new Map<string, LocalProvider>();

for (const p of ALL_PROVIDERS) {
  // By city
  const cityArr = byCity.get(p.citySlug);
  if (cityArr) cityArr.push(p);
  else byCity.set(p.citySlug, [p]);

  // By city+category
  const ccKey = `${p.citySlug}:${p.categorySlug}`;
  const ccArr = byCityCategory.get(ccKey);
  if (ccArr) ccArr.push(p);
  else byCityCategory.set(ccKey, [p]);

  // By city+area (if area exists)
  if (p.areaSlug) {
    const caKey = `${p.citySlug}:${p.areaSlug}`;
    const caArr = byCityArea.get(caKey);
    if (caArr) caArr.push(p);
    else byCityArea.set(caKey, [p]);

    // By city+category+area
    const ccaKey = `${p.citySlug}:${p.categorySlug}:${p.areaSlug}`;
    const ccaArr = byCityCategoryArea.get(ccaKey);
    if (ccaArr) ccaArr.push(p);
    else byCityCategoryArea.set(ccaKey, [p]);
  }

  // By slug (first wins for duplicates)
  if (!bySlug.has(p.slug)) {
    bySlug.set(p.slug, p);
  }
}

// Pre-computed categories (avoid re-mapping on every call)
const MAPPED_CATEGORIES: LocalCategory[] = CATEGORIES.map((c) => ({
  slug: c.slug,
  name: c.name,
  icon: c.icon,
  sortOrder: c.sortOrder,
}));

const CATEGORY_BY_SLUG = new Map(MAPPED_CATEGORIES.map((c) => [c.slug, c]));

// Pre-computed top-rated by city
const topRatedCache = new Map<string, LocalProvider[]>();

// ─── Data Access Functions ──────────────────────────────────────────────────────

export function getCities(): LocalCity[] {
  return CITIES as unknown as LocalCity[];
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
  return MAPPED_CATEGORIES;
}

export function getCategoryBySlug(slug: string): LocalCategory | undefined {
  return CATEGORY_BY_SLUG.get(slug);
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
  // Use index maps for the common filter combinations
  let filtered: LocalProvider[];

  if (filters?.citySlug && filters?.categorySlug && filters?.areaSlug) {
    filtered = byCityCategoryArea.get(`${filters.citySlug}:${filters.categorySlug}:${filters.areaSlug}`) || [];
  } else if (filters?.citySlug && filters?.categorySlug) {
    filtered = byCityCategory.get(`${filters.citySlug}:${filters.categorySlug}`) || [];
  } else if (filters?.citySlug && filters?.areaSlug) {
    filtered = byCityArea.get(`${filters.citySlug}:${filters.areaSlug}`) || [];
  } else if (filters?.citySlug) {
    filtered = byCity.get(filters.citySlug) || [];
  } else {
    filtered = ALL_PROVIDERS;
  }

  // Apply remaining filters that aren't in the index
  if (filters?.subcategorySlug) {
    filtered = filtered.filter((p) => p.subcategorySlug === filters.subcategorySlug);
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

  // Sort (only copy when we need to mutate)
  if (filters?.sort === "rating") {
    filtered = [...filtered].sort((a, b) => Number(b.googleRating) - Number(a.googleRating));
  } else if (filters?.sort === "name") {
    filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
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
  return bySlug.get(slug);
}

export function getProviderCountByCity(citySlug: string): number {
  return (byCity.get(citySlug) || []).length;
}

export function getProviderCountByCategoryAndCity(categorySlug: string, citySlug: string): number {
  return (byCityCategory.get(`${citySlug}:${categorySlug}`) || []).length;
}

export function getProviderCountByCategory(categorySlug: string): number {
  let count = 0;
  byCityCategory.forEach((arr, key) => {
    if (key.split(":")[1] === categorySlug) {
      count += arr.length;
    }
  });
  return count;
}

export function getProviderCountByAreaAndCity(areaSlug: string, citySlug: string): number {
  return (byCityArea.get(`${citySlug}:${areaSlug}`) || []).length;
}

export function getTopRatedProviders(citySlug?: string, limit = 5): LocalProvider[] {
  const cacheKey = `${citySlug || "all"}:${limit}`;
  const cached = topRatedCache.get(cacheKey);
  if (cached) return cached;

  const source = citySlug ? (byCity.get(citySlug) || []) : ALL_PROVIDERS;
  const result = [...source]
    .filter((p) => Number(p.googleRating) > 0)
    .sort((a, b) => {
      const ratingDiff = Number(b.googleRating) - Number(a.googleRating);
      if (ratingDiff !== 0) return ratingDiff;
      return (b.googleReviewCount || 0) - (a.googleReviewCount || 0);
    })
    .slice(0, limit);

  topRatedCache.set(cacheKey, result);
  return result;
}

/** Get all provider slugs for a city (for generateStaticParams — avoids loading full objects) */
export function getProviderSlugsByCity(citySlug: string): { categorySlug: string; slug: string }[] {
  const cityProviders = byCity.get(citySlug) || [];
  return cityProviders.map((p) => ({ categorySlug: p.categorySlug, slug: p.slug }));
}

// ─── UAE City Insurance Context ────────────────────────────────────────────────

function getCityInsuranceNote(citySlug: string): string {
  if (citySlug === "dubai") {
    return "Dubai mandates employer-provided health insurance under the DHA Essential Benefits Plan (since 2014). Major insurers operating in Dubai include Daman, AXA, Cigna, MetLife, Bupa, Oman Insurance, Orient Insurance, and Allianz.";
  }
  if (citySlug === "abu-dhabi" || citySlug === "al-ain") {
    return "Abu Dhabi requires health insurance for all residents under the DOH (formerly HAAD) framework. UAE nationals receive Thiqa coverage; expatriates are typically covered by Daman or employer-arranged plans. AXA, Cigna, MetLife, and Allianz are also widely accepted.";
  }
  if (citySlug === "sharjah") {
    return "Sharjah follows MOHAP guidelines. Widely accepted plans include Daman, AXA, Cigna, MetLife, Orient Insurance, and Oman Insurance. Many employers offer group health plans.";
  }
  return "The Northern Emirates follow MOHAP coverage rules. Daman, AXA, Cigna, Orient Insurance, and Oman Insurance are commonly accepted. Check individual provider listings for plan specifics.";
}

// ─── UAE Typical Consultation Fees ─────────────────────────────────────────────

function getCityGPFee(citySlug: string): string {
  if (citySlug === "dubai") return "AED 150–300";
  if (citySlug === "abu-dhabi" || citySlug === "al-ain") return "AED 100–250";
  return "AED 80–200";
}

export function getFaqs(entityType: string, entitySlug: string): { question: string; answer: string }[] {
  const city = CITIES.find((c) => c.slug === entitySlug);
  const cat = CATEGORIES.find((c) => c.slug === entitySlug);

  if (entityType === "city" && city) {
    const insuranceNote = getCityInsuranceNote(city.slug);
    const gpFee = getCityGPFee(city.slug);
    return [
      {
        question: `How many healthcare providers are in ${city.name}?`,
        answer: `According to the UAE Open Healthcare Directory, ${city.name} has hundreds of registered healthcare providers including hospitals, clinics, dental practices, and specialty centers. Browse the UAE Open Healthcare Directory to find all providers by category and area.`,
      },
      {
        question: `What are the best-rated hospitals in ${city.name}?`,
        answer: `The top-rated hospitals in ${city.name} can be found by sorting the UAE Open Healthcare Directory hospital listings by Google rating. Many hospitals in ${city.name} maintain ratings above 4.5 stars. Leading names include major private groups such as Mediclinic, Aster, LLH, and NMC, alongside government facilities.`,
      },
      {
        question: `How do I find a doctor near me in ${city.name}?`,
        answer: `Use the search feature on the UAE Open Healthcare Directory and enable location access to find healthcare providers nearest to you in ${city.name}. You can filter by specialty, area, and rating. GP walk-in wait times are typically 15–45 minutes; specialist appointments are usually available within 1–7 days.`,
      },
      {
        question: `Which insurance plans are accepted in ${city.name}?`,
        answer: `${insuranceNote} Check individual provider listings on the UAE Open Healthcare Directory for plan-specific acceptance.`,
      },
      {
        question: `How much does a GP consultation cost in ${city.name}?`,
        answer: `A standard GP consultation in ${city.name} typically costs ${gpFee}, depending on the clinic tier and whether you pay out-of-pocket or through insurance. Specialist consultations range from AED 300–800 or more. Government facilities are generally more affordable. An emergency visit typically costs AED 300–1,000 before treatment. Always confirm fees directly with the provider.`,
      },
      {
        question: `How long are typical wait times for healthcare in ${city.name}?`,
        answer: `In ${city.name}, GP walk-in clinics typically see patients within 15–45 minutes. Specialist appointment wait times range from 1–7 days depending on demand and clinic. Emergency departments provide immediate triage; non-critical cases are generally attended to within 30–120 minutes. Lab results for basic tests (e.g., CBC) are usually available same-day; specialized tests may take 1–3 days.`,
      },
    ];
  }

  if (entityType === "category" && cat) {
    return [
      {
        question: `How do I find the best ${cat.name.toLowerCase()} in the UAE?`,
        answer: `Browse the UAE Open Healthcare Directory ${cat.name.toLowerCase()} listings to compare providers across all UAE cities. Sort by Google rating, read patient reviews, and check accepted insurance plans. All listings are sourced from official DHA, DOH, and MOHAP registers.`,
      },
      {
        question: `Are ${cat.name.toLowerCase()} services covered by insurance in the UAE?`,
        answer: `Most major insurance plans in the UAE — including Daman, Thiqa, AXA, Cigna, MetLife, Bupa, Oman Insurance, and Allianz — cover core ${cat.name.toLowerCase()} services. Coverage scope and co-payment levels vary by plan tier. Always confirm with your insurer and the provider before booking. Dubai employers are legally required to provide the DHA Essential Benefits Plan as a minimum; Abu Dhabi mandates DOH-compliant coverage.`,
      },
      {
        question: `How much do ${cat.name.toLowerCase()} services cost in the UAE?`,
        answer: `Consultation fees for ${cat.name.toLowerCase()} in the UAE typically range from AED 300–800 for a specialist visit, depending on the city and clinic tier. Dubai generally has the highest fees (AED 150–300 for a GP; AED 300–800+ for specialists); Abu Dhabi is comparable; the Northern Emirates tend to be more affordable (AED 80–200 for a GP). Diagnostic add-ons such as blood tests (AED 50–150 for a CBC) or imaging (AED 100–300 for X-ray; AED 1,000–3,000 for MRI) are charged separately.`,
      },
      {
        question: `Which insurance plans are most widely accepted at ${cat.name.toLowerCase()} in the UAE?`,
        answer: `The most widely accepted insurance plans at ${cat.name.toLowerCase()} across the UAE are Daman (mandatory in Abu Dhabi for expats), Thiqa (for UAE nationals in Abu Dhabi), the DHA Essential Benefits Plan (mandatory in Dubai), AXA, Cigna, MetLife, Bupa, Oman Insurance, Orient Insurance, and Allianz. Use the insurance filter on each provider listing page on the UAE Open Healthcare Directory to confirm acceptance before your visit.`,
      },
    ];
  }

  return [];
}

// ─── Insurance Data Access Functions ────────────────────────────────────────────

export type { InsuranceProvider };

export function getInsuranceProviders(): InsuranceProvider[] {
  return [...INSURANCE_PROVIDERS];
}

export function getProvidersByInsurance(insurerSlug: string, citySlug?: string): LocalProvider[] {
  const insurer = INSURANCE_PROVIDERS.find((i) => i.slug === insurerSlug);
  if (!insurer) return [];

  const matchTerms = [insurer.slug, insurer.name.toLowerCase()];
  const source = citySlug ? (byCity.get(citySlug) || []) : ALL_PROVIDERS;

  return source.filter((p) =>
    p.insurance.some((ins) => matchTerms.some((term) => ins.toLowerCase().includes(term)))
  );
}

export function getProviderCountByInsurance(insurerSlug: string, citySlug: string): number {
  return getProvidersByInsurance(insurerSlug, citySlug).length;
}

// ─── Language Data Access Functions ─────────────────────────────────────────────

export type { LanguageInfo };

export function getLanguages(): LanguageInfo[] {
  return [...LANGUAGES];
}

export const getLanguagesList = getLanguages;

export function getProvidersByLanguage(languageSlug: string, citySlug?: string): LocalProvider[] {
  const language = LANGUAGES.find((l) => l.slug === languageSlug);
  if (!language) return [];

  const matchName = language.name.toLowerCase();
  const source = citySlug ? (byCity.get(citySlug) || []) : ALL_PROVIDERS;

  return source.filter((p) =>
    p.languages.some((lang) => lang.toLowerCase() === matchName)
  );
}

export function getProviderCountByLanguage(languageSlug: string, citySlug: string): number {
  return getProvidersByLanguage(languageSlug, citySlug).length;
}

// ─── Condition Data Access Functions ────────────────────────────────────────────

export type { Condition };

export function getConditions(): Condition[] {
  return [...CONDITIONS];
}

// ─── 24-Hour & Emergency Data Access Functions ──────────────────────────────

/**
 * Determines whether a provider operates 24 hours.
 * Checks operatingHours (any day with open="00:00" and close="23:59"),
 * name containing "24" or "twenty four", or description mentioning
 * "24 hours" / "round the clock".
 */
export function is24HourProvider(provider: LocalProvider): boolean {
  // Check operatingHours — any day with 00:00–23:59
  if (provider.operatingHours) {
    const is24HourSchedule = Object.values(provider.operatingHours).some(
      (h) => h.open === "00:00" && h.close === "23:59"
    );
    if (is24HourSchedule) return true;
  }

  // Check name
  const nameLower = provider.name.toLowerCase();
  if (nameLower.includes("24") || nameLower.includes("twenty four")) return true;

  // Check description
  const descLower = (provider.description || "").toLowerCase();
  if (
    descLower.includes("24 hours") ||
    descLower.includes("24-hour") ||
    descLower.includes("round the clock") ||
    descLower.includes("open 24")
  ) {
    return true;
  }

  return false;
}

/**
 * Determines whether a provider offers emergency services.
 * Checks category, name, description, and services array.
 */
export function isEmergencyProvider(provider: LocalProvider): boolean {
  if (provider.categorySlug === "emergency-care") return true;

  const nameLower = provider.name.toLowerCase();
  if (
    nameLower.includes("emergency") ||
    nameLower.includes("urgent care") ||
    nameLower.includes("er ") ||
    nameLower.includes("a&e")
  ) {
    return true;
  }

  const descLower = (provider.description || "").toLowerCase();
  if (
    descLower.includes("emergency department") ||
    descLower.includes("emergency room") ||
    descLower.includes("emergency services") ||
    descLower.includes("urgent care") ||
    descLower.includes("accident & emergency") ||
    descLower.includes("accident and emergency")
  ) {
    return true;
  }

  if (
    provider.services.some((s) => {
      const sl = s.toLowerCase();
      return sl.includes("emergency") || sl.includes("urgent care");
    })
  ) {
    return true;
  }

  // Hospitals are generally considered to have emergency departments
  if (provider.categorySlug === "hospitals") return true;

  return false;
}

/** Get all 24-hour providers in a city, optionally filtered by category and/or area. */
export function get24HourProviders(citySlug: string, categorySlug?: string, areaSlug?: string): LocalProvider[] {
  let source: LocalProvider[];
  if (categorySlug && areaSlug) {
    source = byCityCategoryArea.get(`${citySlug}:${categorySlug}:${areaSlug}`) || [];
  } else if (categorySlug) {
    source = byCityCategory.get(`${citySlug}:${categorySlug}`) || [];
  } else if (areaSlug) {
    source = byCityArea.get(`${citySlug}:${areaSlug}`) || [];
  } else {
    source = byCity.get(citySlug) || [];
  }
  return source.filter(is24HourProvider);
}

/** Get all emergency-capable providers in a city, optionally filtered by area. */
export function getEmergencyProviders(citySlug: string, areaSlug?: string): LocalProvider[] {
  let source: LocalProvider[];
  if (areaSlug) {
    source = byCityArea.get(`${citySlug}:${areaSlug}`) || [];
  } else {
    source = byCity.get(citySlug) || [];
  }
  return source.filter(isEmergencyProvider);
}
