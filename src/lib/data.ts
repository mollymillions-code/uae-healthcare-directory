/**
 * Data access layer — queries PostgreSQL via Drizzle ORM when DATABASE_URL is set,
 * falls back to the 58 MB JSON file for local dev without Postgres.
 *
 * All provider-data functions are async (they hit the DB).
 * Constants (cities, categories, insurance, languages, conditions) remain synchronous.
 */

import { CITIES, AREAS } from "./constants/cities";
import { CATEGORIES, SUBCATEGORIES } from "./constants/categories";
import { INSURANCE_PROVIDERS, InsuranceProvider } from "./constants/insurance";
import { LANGUAGES, LanguageInfo } from "./constants/languages";
import { CONDITIONS, Condition } from "./constants/conditions";

// ─── DB imports (only used when DATABASE_URL is set) ─────────────────────────

let HAS_DB = !!process.env.DATABASE_URL;
let _dbVerified = false;

/**
 * Check if DB actually has providers. If not (empty table, connection error),
 * fall back to JSON. This handles the case where DATABASE_URL is set on EC2
 * but the providers table hasn't been seeded yet.
 */
async function verifyDbHasData(): Promise<boolean> {
  if (_dbVerified) return HAS_DB;
  if (!HAS_DB) { _dbVerified = true; return false; }

  try {
    await ensureDbModules();
    const result = await _db!.select({ id: _providersTable!.id }).from(_providersTable!).limit(1);
    if (result.length === 0) {
      console.warn("[data.ts] DB has no providers — falling back to JSON");
      HAS_DB = false;
    }
  } catch (e) {
    console.warn("[data.ts] DB connection failed — falling back to JSON:", e instanceof Error ? e.message : e);
    HAS_DB = false;
  }
  _dbVerified = true;
  return HAS_DB;
}

// Lazy-load DB modules so the JSON fallback path never touches pg
let _db: typeof import("@/lib/db")["db"] | null = null;
let _providersTable: typeof import("@/lib/db/schema")["providers"] | null = null;
let _eq: typeof import("drizzle-orm")["eq"] | null = null;
let _and: typeof import("drizzle-orm")["and"] | null = null;
let _desc: typeof import("drizzle-orm")["desc"] | null = null;
let _countFn: typeof import("drizzle-orm")["count"] | null = null;
let _gt: typeof import("drizzle-orm")["gt"] | null = null;
let _ilike: typeof import("drizzle-orm")["ilike"] | null = null;
let _or: typeof import("drizzle-orm")["or"] | null = null;
let _sql: typeof import("drizzle-orm")["sql"] | null = null;

let _dbModulesLoaded = false;

async function ensureDbModules() {
  if (_dbModulesLoaded) return;
  const [dbMod, schemaMod, ormMod] = await Promise.all([
    import("@/lib/db"),
    import("@/lib/db/schema"),
    import("drizzle-orm"),
  ]);
  _db = dbMod.db;
  _providersTable = schemaMod.providers;
  _eq = ormMod.eq;
  _and = ormMod.and;
  _desc = ormMod.desc;
  _countFn = ormMod.count;
  _gt = ormMod.gt;
  _ilike = ormMod.ilike;
  _or = ormMod.or;
  _sql = ormMod.sql;
  _dbModulesLoaded = true;
}

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
  descriptionAr?: string;
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
  coverImageUrl?: string;
  googlePhotoUrl?: string;
}

// ─── Query Cache (5-min TTL, bounded LRU, max 500 entries) ─────────────────────
// Uses a Map which maintains insertion order. On get-hit we delete+re-insert to
// move the entry to the end (most-recently-used). On set we evict the oldest
// entry (first key) when the map exceeds MAX_CACHE_SIZE.

const queryCache = new Map<string, { data: unknown; ts: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 500;

function getCached<T>(key: string): T | undefined {
  const entry = queryCache.get(key);
  if (!entry) return undefined;
  if (Date.now() - entry.ts >= CACHE_TTL) {
    queryCache.delete(key);
    return undefined;
  }
  // Move to end (most-recently-used)
  queryCache.delete(key);
  queryCache.set(key, entry);
  return entry.data as T;
}

function setCache(key: string, data: unknown): void {
  // If key already exists, delete first so re-insert moves it to end
  if (queryCache.has(key)) {
    queryCache.delete(key);
  }
  queryCache.set(key, { data, ts: Date.now() });
  // Evict oldest entry if over limit
  if (queryCache.size > MAX_CACHE_SIZE) {
    const oldest = queryCache.keys().next().value;
    if (oldest !== undefined) queryCache.delete(oldest);
  }
}

// ─── DB Row → LocalProvider mapper ──────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToProvider(row: any): LocalProvider {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    citySlug: row.citySlug ?? row.city_slug ?? "",
    areaSlug: row.areaSlug ?? row.area_slug ?? undefined,
    categorySlug: row.categorySlug ?? row.category_slug ?? "",
    subcategorySlug: row.subcategorySlug ?? row.subcategory_slug ?? undefined,
    address: row.address ?? "",
    phone: row.phone ?? undefined,
    website: row.website ?? undefined,
    description: row.description ?? "",
    shortDescription: row.shortDescription ?? row.short_description ?? "",
    descriptionAr: row.descriptionAr ?? row.description_ar ?? undefined,
    googleRating: String(row.googleRating ?? row.google_rating ?? "0"),
    googleReviewCount: Number(row.googleReviewCount ?? row.google_review_count ?? 0),
    latitude: String(row.latitude ?? "0"),
    longitude: String(row.longitude ?? "0"),
    isClaimed: Boolean(row.isClaimed ?? row.is_claimed ?? false),
    isVerified: Boolean(row.isVerified ?? row.is_verified ?? false),
    services: row.services ?? [],
    languages: row.languages ?? [],
    insurance: row.insurance ?? [],
    operatingHours: row.operatingHours ?? row.operating_hours ?? {},
    amenities: row.amenities ?? [],
    lastVerified: row.updatedAt
      ? new Date(row.updatedAt).toISOString()
      : row.updated_at
        ? new Date(row.updated_at).toISOString()
        : new Date().toISOString(),
    email: row.email ?? undefined,
    facilityType: row.facilityType ?? row.facility_type ?? undefined,
    reviewSummary: row.reviewSummary ?? row.review_summary ?? undefined,
    reviewSummaryAr: row.reviewSummaryAr ?? row.review_summary_ar ?? undefined,
    coverImageUrl: row.coverImageUrl ?? row.cover_image_url ?? undefined,
    googlePhotoUrl: row.googlePhotoUrl ?? row.google_photo_url ?? undefined,
  };
}

// ══════════════════════════════════════════════════════════════════════════════════
//  FALLBACK: JSON-based in-memory provider data (when DATABASE_URL is not set)
// ══════════════════════════════════════════════════════════════════════════════════

let FALLBACK_ALL_PROVIDERS: LocalProvider[] | null = null;
let fallbackByCity: Map<string, LocalProvider[]> | null = null;
let fallbackByCityCategory: Map<string, LocalProvider[]> | null = null;
let fallbackByCityCategoryArea: Map<string, LocalProvider[]> | null = null;
let fallbackByCityArea: Map<string, LocalProvider[]> | null = null;
let fallbackBySlug: Map<string, LocalProvider> | null = null;

function loadFallback(): void {
  if (FALLBACK_ALL_PROVIDERS !== null) return; // already loaded

  try {
    // Use fs.readFileSync instead of require() so webpack doesn't try to bundle the file at build time
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require("fs") as typeof import("fs");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require("path") as typeof import("path");
    const jsonPath = path.join(process.cwd(), "src/lib/providers-scraped.json");
    const raw = fs.readFileSync(jsonPath, "utf-8");
    const scraped = JSON.parse(raw) as Record<string, unknown>[];
    FALLBACK_ALL_PROVIDERS = scraped.map((p: Record<string, unknown>) => ({
      ...(p as unknown as LocalProvider),
      googleRating: (p.googleRating as string) || "0",
      googleReviewCount: (p.googleReviewCount as number) || 0,
      latitude: (p.latitude as string) || "0",
      longitude: (p.longitude as string) || "0",
    }));
  } catch {
    FALLBACK_ALL_PROVIDERS = [];
  }

  fallbackByCity = new Map();
  fallbackByCityCategory = new Map();
  fallbackByCityCategoryArea = new Map();
  fallbackByCityArea = new Map();
  fallbackBySlug = new Map();

  for (const p of FALLBACK_ALL_PROVIDERS) {
    const cityArr = fallbackByCity.get(p.citySlug);
    if (cityArr) cityArr.push(p);
    else fallbackByCity.set(p.citySlug, [p]);

    const ccKey = `${p.citySlug}:${p.categorySlug}`;
    const ccArr = fallbackByCityCategory.get(ccKey);
    if (ccArr) ccArr.push(p);
    else fallbackByCityCategory.set(ccKey, [p]);

    if (p.areaSlug) {
      const caKey = `${p.citySlug}:${p.areaSlug}`;
      const caArr = fallbackByCityArea.get(caKey);
      if (caArr) caArr.push(p);
      else fallbackByCityArea.set(caKey, [p]);

      const ccaKey = `${p.citySlug}:${p.categorySlug}:${p.areaSlug}`;
      const ccaArr = fallbackByCityCategoryArea.get(ccaKey);
      if (ccaArr) ccaArr.push(p);
      else fallbackByCityCategoryArea.set(ccaKey, [p]);
    }

    if (!fallbackBySlug.has(p.slug)) {
      fallbackBySlug.set(p.slug, p);
    }
  }
}

// ─── Pre-computed categories (avoid re-mapping on every call) ────────────────

const MAPPED_CATEGORIES: LocalCategory[] = CATEGORIES.map((c) => ({
  slug: c.slug,
  name: c.name,
  icon: c.icon,
  sortOrder: c.sortOrder,
}));

const CATEGORY_BY_SLUG = new Map(MAPPED_CATEGORIES.map((c) => [c.slug, c]));

// ─── Synchronous Data Access Functions (from constants, never DB) ────────────

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

// ─── Language Data Access Functions ─────────────────────────────────────────────

export type { LanguageInfo };

export function getLanguages(): LanguageInfo[] {
  return [...LANGUAGES];
}

export const getLanguagesList = getLanguages;

// ─── Condition Data Access Functions ────────────────────────────────────────────

export type { Condition };

export function getConditions(): Condition[] {
  return [...CONDITIONS];
}

// ─── Helper predicates (used by 24-hour / emergency / walk-in / government) ──

/**
 * Determines whether a provider operates 24 hours.
 * Checks operatingHours (any day with open="00:00" and close="23:59"),
 * name containing "24" or "twenty four", or description mentioning
 * "24 hours" / "round the clock".
 */
export function is24HourProvider(provider: LocalProvider): boolean {
  if (provider.operatingHours) {
    const is24HourSchedule = Object.values(provider.operatingHours).some(
      (h) => h.open === "00:00" && h.close === "23:59"
    );
    if (is24HourSchedule) return true;
  }

  const nameLower = provider.name.toLowerCase();
  if (nameLower.includes("24") || nameLower.includes("twenty four")) return true;

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

/** Walk-in = categorySlug "clinics", facilityType "polyclinic", or name containing "walk-in"/"polyclinic". */
export function isWalkInProvider(provider: LocalProvider): boolean {
  if (provider.categorySlug === "clinics") return true;
  const fl = (provider.facilityType || "").toLowerCase();
  if (fl.includes("polyclinic")) return true;
  const nl = provider.name.toLowerCase();
  return nl.includes("polyclinic") || nl.includes("walk-in") || nl.includes("walk in");
}

/** Determines whether a provider is a government/public healthcare facility. */
export function isGovernmentProvider(provider: LocalProvider): boolean {
  const nl = provider.name.toLowerCase();
  const dl = (provider.description || "").toLowerCase();
  const fl = (provider.facilityType || "").toLowerCase();

  if (
    nl.includes("government") || nl.includes("public health") ||
    nl.includes("ministry") || nl.includes("mohap") ||
    nl.includes("dha ") || nl.includes("doh ") ||
    nl.includes("seha") || nl.includes("ambulatory") ||
    nl.includes("primary health") || nl.includes("health center") ||
    nl.includes("health centre")
  ) return true;

  if (
    fl.includes("government") || fl.includes("public") ||
    fl.includes("primary health")
  ) return true;

  if (
    dl.includes("government-run") || dl.includes("government run") ||
    dl.includes("public hospital") || dl.includes("public health") ||
    dl.includes("operated by seha") || dl.includes("operated by dha") ||
    dl.includes("ministry of health")
  ) return true;

  return false;
}

// ══════════════════════════════════════════════════════════════════════════════════
//  ASYNC Provider Data Access Functions
// ══════════════════════════════════════════════════════════════════════════════════

/**
 * Helper: fetch providers from DB with optional WHERE clauses.
 * Returns an array of raw DB rows; caller maps to LocalProvider.
 */
async function dbSelectProviders(filters?: {
  citySlug?: string;
  categorySlug?: string;
  areaSlug?: string;
  subcategorySlug?: string;
}): Promise<LocalProvider[]> {
  await ensureDbModules();
  const t = _providersTable!;
  const conditions = [];

  if (filters?.citySlug) conditions.push(_eq!(t.citySlug, filters.citySlug));
  if (filters?.categorySlug) conditions.push(_eq!(t.categorySlug, filters.categorySlug));
  if (filters?.areaSlug) conditions.push(_eq!(t.areaSlug, filters.areaSlug));
  if (filters?.subcategorySlug) conditions.push(_eq!(t.subcategorySlug, filters.subcategorySlug));

  const where = conditions.length > 0 ? _and!(...conditions) : undefined;
  const rows = await _db!.select().from(t).where(where);
  return rows.map(rowToProvider);
}

export async function getProviders(filters?: {
  citySlug?: string;
  categorySlug?: string;
  subcategorySlug?: string;
  areaSlug?: string;
  query?: string;
  page?: number;
  limit?: number;
  sort?: "rating" | "name" | "relevance";
}): Promise<{ providers: LocalProvider[]; total: number; page: number; totalPages: number }> {
  // ─── Verify DB has data (first call only) ──────────────────────────────────
  await verifyDbHasData();

  // ─── Fallback: JSON ────────────────────────────────────────────────────────
  if (!HAS_DB) {
    loadFallback();
    let filtered: LocalProvider[];

    if (filters?.citySlug && filters?.categorySlug && filters?.areaSlug) {
      filtered = fallbackByCityCategoryArea!.get(`${filters.citySlug}:${filters.categorySlug}:${filters.areaSlug}`) || [];
    } else if (filters?.citySlug && filters?.categorySlug) {
      filtered = fallbackByCityCategory!.get(`${filters.citySlug}:${filters.categorySlug}`) || [];
    } else if (filters?.citySlug && filters?.areaSlug) {
      filtered = fallbackByCityArea!.get(`${filters.citySlug}:${filters.areaSlug}`) || [];
    } else if (filters?.citySlug) {
      filtered = fallbackByCity!.get(filters.citySlug) || [];
    } else {
      filtered = FALLBACK_ALL_PROVIDERS!;
    }

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

  // ─── DB path ───────────────────────────────────────────────────────────────
  await ensureDbModules();
  const t = _providersTable!;

  // Build WHERE conditions
  const conditions = [];
  if (filters?.citySlug) conditions.push(_eq!(t.citySlug, filters.citySlug));
  if (filters?.categorySlug) conditions.push(_eq!(t.categorySlug, filters.categorySlug));
  if (filters?.areaSlug) conditions.push(_eq!(t.areaSlug, filters.areaSlug));
  if (filters?.subcategorySlug) conditions.push(_eq!(t.subcategorySlug, filters.subcategorySlug));
  if (filters?.query) {
    const q = `%${filters.query}%`;
    conditions.push(
      _or!(
        _ilike!(t.name, q),
        _ilike!(t.description, q),
        _ilike!(t.address, q)
      )
    );
  }

  const where = conditions.length > 0 ? _and!(...conditions) : undefined;

  // Count
  const countResult = await _db!.select({ value: _countFn!() }).from(t).where(where);
  const total = Number(countResult[0]?.value ?? 0);

  const page = filters?.page || 1;
  const limit = filters?.limit || 20;
  const totalPages = Math.ceil(total / limit);
  const offset = (page - 1) * limit;

  // Build ordered query
  let orderBy;
  if (filters?.sort === "rating") {
    orderBy = _desc!(t.googleRating);
  } else if (filters?.sort === "name") {
    orderBy = t.name; // ASC
  } else {
    orderBy = undefined;
  }

  const rows = orderBy
    ? await _db!.select().from(t).where(where).orderBy(orderBy).limit(limit).offset(offset)
    : await _db!.select().from(t).where(where).limit(limit).offset(offset);

  return {
    providers: rows.map(rowToProvider),
    total,
    page,
    totalPages,
  };
}

export async function getProviderBySlug(slug: string): Promise<LocalProvider | undefined> {
  if (!HAS_DB) {
    loadFallback();
    return fallbackBySlug!.get(slug);
  }

  const cacheKey = `slug:${slug}`;
  const cached = getCached<LocalProvider>(cacheKey);
  if (cached) return cached;

  await ensureDbModules();
  const t = _providersTable!;
  const rows = await _db!.select().from(t).where(_eq!(t.slug, slug)).limit(1);
  if (rows.length === 0) return undefined;
  const provider = rowToProvider(rows[0]);
  setCache(cacheKey, provider);
  return provider;
}

export async function getProviderCountByCity(citySlug: string): Promise<number> {
  if (!HAS_DB) {
    loadFallback();
    return (fallbackByCity!.get(citySlug) || []).length;
  }

  const cacheKey = `count:city:${citySlug}`;
  const cached = getCached<number>(cacheKey);
  if (cached !== undefined) return cached;

  await ensureDbModules();
  const t = _providersTable!;
  const result = await _db!.select({ value: _countFn!() }).from(t).where(_eq!(t.citySlug, citySlug));
  const count = Number(result[0]?.value ?? 0);
  setCache(cacheKey, count);
  return count;
}

export async function getProviderCountByCategoryAndCity(categorySlug: string, citySlug: string): Promise<number> {
  if (!HAS_DB) {
    loadFallback();
    return (fallbackByCityCategory!.get(`${citySlug}:${categorySlug}`) || []).length;
  }

  const cacheKey = `count:cat-city:${categorySlug}:${citySlug}`;
  const cached = getCached<number>(cacheKey);
  if (cached !== undefined) return cached;

  await ensureDbModules();
  const t = _providersTable!;
  const result = await _db!
    .select({ value: _countFn!() })
    .from(t)
    .where(_and!(_eq!(t.categorySlug, categorySlug), _eq!(t.citySlug, citySlug)));
  const count = Number(result[0]?.value ?? 0);
  setCache(cacheKey, count);
  return count;
}

export async function getProviderCountByCategory(categorySlug: string): Promise<number> {
  if (!HAS_DB) {
    loadFallback();
    let count = 0;
    fallbackByCityCategory!.forEach((arr, key) => {
      if (key.split(":")[1] === categorySlug) {
        count += arr.length;
      }
    });
    return count;
  }

  const cacheKey = `count:cat:${categorySlug}`;
  const cached = getCached<number>(cacheKey);
  if (cached !== undefined) return cached;

  await ensureDbModules();
  const t = _providersTable!;
  const result = await _db!.select({ value: _countFn!() }).from(t).where(_eq!(t.categorySlug, categorySlug));
  const count = Number(result[0]?.value ?? 0);
  setCache(cacheKey, count);
  return count;
}

export async function getProviderCountByAreaAndCity(areaSlug: string, citySlug: string): Promise<number> {
  if (!HAS_DB) {
    loadFallback();
    return (fallbackByCityArea!.get(`${citySlug}:${areaSlug}`) || []).length;
  }

  const cacheKey = `count:area-city:${areaSlug}:${citySlug}`;
  const cached = getCached<number>(cacheKey);
  if (cached !== undefined) return cached;

  await ensureDbModules();
  const t = _providersTable!;
  const result = await _db!
    .select({ value: _countFn!() })
    .from(t)
    .where(_and!(_eq!(t.areaSlug, areaSlug), _eq!(t.citySlug, citySlug)));
  const count = Number(result[0]?.value ?? 0);
  setCache(cacheKey, count);
  return count;
}

export async function getTopRatedProviders(citySlug?: string, limit = 5): Promise<LocalProvider[]> {
  if (!HAS_DB) {
    loadFallback();
    const source = citySlug ? (fallbackByCity!.get(citySlug) || []) : FALLBACK_ALL_PROVIDERS!;
    return [...source]
      .filter((p) => Number(p.googleRating) > 0)
      .sort((a, b) => {
        const ratingDiff = Number(b.googleRating) - Number(a.googleRating);
        if (ratingDiff !== 0) return ratingDiff;
        return (b.googleReviewCount || 0) - (a.googleReviewCount || 0);
      })
      .slice(0, limit);
  }

  const cacheKey = `topRated:${citySlug || "all"}:${limit}`;
  const cached = getCached<LocalProvider[]>(cacheKey);
  if (cached) return cached;

  await ensureDbModules();
  const t = _providersTable!;
  const conditions = [_gt!(t.googleRating, "0")];
  if (citySlug) conditions.push(_eq!(t.citySlug, citySlug));

  const rows = await _db!
    .select()
    .from(t)
    .where(_and!(...conditions))
    .orderBy(_desc!(t.googleRating), _desc!(t.googleReviewCount))
    .limit(limit);

  const result = rows.map(rowToProvider);
  setCache(cacheKey, result);
  return result;
}

/** Get all provider slugs for a city (for generateStaticParams — avoids loading full objects) */
export async function getProviderSlugsByCity(citySlug: string): Promise<{ categorySlug: string; slug: string }[]> {
  if (!HAS_DB) {
    loadFallback();
    const cityProviders = fallbackByCity!.get(citySlug) || [];
    return cityProviders.map((p) => ({ categorySlug: p.categorySlug, slug: p.slug }));
  }

  const cacheKey = `slugsByCity:${citySlug}`;
  const cached = getCached<{ categorySlug: string; slug: string }[]>(cacheKey);
  if (cached) return cached;

  await ensureDbModules();
  const t = _providersTable!;
  const rows = await _db!
    .select({ categorySlug: t.categorySlug, slug: t.slug })
    .from(t)
    .where(_eq!(t.citySlug, citySlug));

  const result = rows.map((r) => ({ categorySlug: r.categorySlug, slug: r.slug }));
  setCache(cacheKey, result);
  return result;
}

// ─── Insurance Provider Queries ─────────────────────────────────────────────────

export async function getProvidersByInsurance(insurerSlug: string, citySlug?: string): Promise<LocalProvider[]> {
  const insurer = INSURANCE_PROVIDERS.find((i) => i.slug === insurerSlug);
  if (!insurer) return [];

  const matchTerms = [insurer.slug, insurer.name.toLowerCase()];

  if (!HAS_DB) {
    loadFallback();
    const source = citySlug ? (fallbackByCity!.get(citySlug) || []) : FALLBACK_ALL_PROVIDERS!;
    return source.filter((p) =>
      p.insurance.some((ins) => matchTerms.some((term) => ins.toLowerCase().includes(term)))
    );
  }

  // Use SQL-level JSONB filtering to avoid loading all providers into JS
  await ensureDbModules();
  const t = _providersTable!;
  const conditions = [];

  if (citySlug) conditions.push(_eq!(t.citySlug, citySlug));

  // Build ILIKE conditions for each match term against JSONB array elements
  const likePatterns = matchTerms.map((term) => `%${term}%`);
  const orClauses = likePatterns.map((pat) => `lower(elem) LIKE '${pat.replace(/'/g, "''")}'`).join(" OR ");
  conditions.push(
    _sql!`EXISTS (SELECT 1 FROM jsonb_array_elements_text(${t.insurance}) elem WHERE ${_sql!.raw(orClauses)})`
  );

  const where = conditions.length > 0 ? _and!(...conditions) : undefined;
  const rows = await _db!.select().from(t).where(where);
  return rows.map(rowToProvider);
}

export async function getProviderCountByInsurance(insurerSlug: string, citySlug: string): Promise<number> {
  if (!HAS_DB) {
    loadFallback();
    const insurer = INSURANCE_PROVIDERS.find((i) => i.slug === insurerSlug);
    if (!insurer) return 0;
    const matchTerms = [insurer.slug, insurer.name.toLowerCase()];
    const source = fallbackByCity!.get(citySlug) || [];
    return source.filter((p) =>
      p.insurance.some((ins) => matchTerms.some((term) => ins.toLowerCase().includes(term)))
    ).length;
  }

  const cacheKey = `count:ins:${insurerSlug}:${citySlug}`;
  const cached = getCached<number>(cacheKey);
  if (cached !== undefined) return cached;

  await ensureDbModules();
  const t = _providersTable!;
  const insurer = INSURANCE_PROVIDERS.find((i) => i.slug === insurerSlug);
  if (!insurer) { setCache(cacheKey, 0); return 0; }

  const matchTerms = [insurer.slug, insurer.name.toLowerCase()];
  const likePatterns = matchTerms.map((term) => `%${term}%`);
  const orClauses = likePatterns.map((pat) => `lower(elem) LIKE '${pat.replace(/'/g, "''")}'`).join(" OR ");

  const conditions = [
    _eq!(t.citySlug, citySlug),
    _sql!`EXISTS (SELECT 1 FROM jsonb_array_elements_text(${t.insurance}) elem WHERE ${_sql!.raw(orClauses)})`,
  ];

  const result = await _db!.select({ count: _countFn!() }).from(t).where(_and!(...conditions));
  const count = Number(result[0]?.count ?? 0);
  setCache(cacheKey, count);
  return count;
}

// ─── Language Provider Queries ──────────────────────────────────────────────────

export async function getProvidersByLanguage(languageSlug: string, citySlug?: string): Promise<LocalProvider[]> {
  const language = LANGUAGES.find((l) => l.slug === languageSlug);
  if (!language) return [];

  const matchName = language.name.toLowerCase();

  if (!HAS_DB) {
    loadFallback();
    const source = citySlug ? (fallbackByCity!.get(citySlug) || []) : FALLBACK_ALL_PROVIDERS!;
    return source.filter((p) =>
      p.languages.some((lang) => lang.toLowerCase() === matchName)
    );
  }

  // Use SQL-level JSONB filtering to avoid loading all providers into JS
  await ensureDbModules();
  const t = _providersTable!;
  const conditions = [];

  if (citySlug) conditions.push(_eq!(t.citySlug, citySlug));

  // Case-insensitive exact match against JSONB array elements
  const escapedName = matchName.replace(/'/g, "''");
  conditions.push(
    _sql!`EXISTS (SELECT 1 FROM jsonb_array_elements_text(${t.languages}) elem WHERE lower(elem) = '${_sql!.raw(escapedName)}')`
  );

  const where = conditions.length > 0 ? _and!(...conditions) : undefined;
  const rows = await _db!.select().from(t).where(where);
  return rows.map(rowToProvider);
}

export async function getProviderCountByLanguage(languageSlug: string, citySlug: string): Promise<number> {
  if (!HAS_DB) {
    loadFallback();
    const language = LANGUAGES.find((l) => l.slug === languageSlug);
    if (!language) return 0;
    const matchName = language.name.toLowerCase();
    const source = fallbackByCity!.get(citySlug) || [];
    return source.filter((p) =>
      p.languages.some((lang) => lang.toLowerCase() === matchName)
    ).length;
  }

  const cacheKey = `count:lang:${languageSlug}:${citySlug}`;
  const cached = getCached<number>(cacheKey);
  if (cached !== undefined) return cached;

  await ensureDbModules();
  const t = _providersTable!;
  const language = LANGUAGES.find((l) => l.slug === languageSlug);
  if (!language) { setCache(cacheKey, 0); return 0; }

  const escapedName = language.name.toLowerCase().replace(/'/g, "''");
  const conditions = [
    _eq!(t.citySlug, citySlug),
    _sql!`EXISTS (SELECT 1 FROM jsonb_array_elements_text(${t.languages}) elem WHERE lower(elem) = '${_sql!.raw(escapedName)}')`,
  ];

  const result = await _db!.select({ count: _countFn!() }).from(t).where(_and!(...conditions));
  const count = Number(result[0]?.count ?? 0);
  setCache(cacheKey, count);
  return count;
}

// ─── 24-Hour, Emergency, Walk-In, Government Queries ────────────────────────────

/** Get all 24-hour providers in a city, optionally filtered by category and/or area. */
export async function get24HourProviders(citySlug: string, categorySlug?: string, areaSlug?: string): Promise<LocalProvider[]> {
  if (!HAS_DB) {
    loadFallback();
    let source: LocalProvider[];
    if (categorySlug && areaSlug) {
      source = fallbackByCityCategoryArea!.get(`${citySlug}:${categorySlug}:${areaSlug}`) || [];
    } else if (categorySlug) {
      source = fallbackByCityCategory!.get(`${citySlug}:${categorySlug}`) || [];
    } else if (areaSlug) {
      source = fallbackByCityArea!.get(`${citySlug}:${areaSlug}`) || [];
    } else {
      source = fallbackByCity!.get(citySlug) || [];
    }
    return source.filter(is24HourProvider);
  }

  const cacheKey = `24hr:${citySlug}:${categorySlug || ""}:${areaSlug || ""}`;
  const cached = getCached<LocalProvider[]>(cacheKey);
  if (cached) return cached;

  const filters: { citySlug?: string; categorySlug?: string; areaSlug?: string } = { citySlug };
  if (categorySlug) filters.categorySlug = categorySlug;
  if (areaSlug) filters.areaSlug = areaSlug;

  const allProviders = await dbSelectProviders(filters);
  const result = allProviders.filter(is24HourProvider);
  setCache(cacheKey, result);
  return result;
}

/** Get all emergency-capable providers in a city, optionally filtered by area. */
export async function getEmergencyProviders(citySlug: string, areaSlug?: string): Promise<LocalProvider[]> {
  if (!HAS_DB) {
    loadFallback();
    let source: LocalProvider[];
    if (areaSlug) {
      source = fallbackByCityArea!.get(`${citySlug}:${areaSlug}`) || [];
    } else {
      source = fallbackByCity!.get(citySlug) || [];
    }
    return source.filter(isEmergencyProvider);
  }

  const cacheKey = `emergency:${citySlug}:${areaSlug || ""}`;
  const cached = getCached<LocalProvider[]>(cacheKey);
  if (cached) return cached;

  const filters: { citySlug?: string; areaSlug?: string } = { citySlug };
  if (areaSlug) filters.areaSlug = areaSlug;

  const allProviders = await dbSelectProviders(filters);
  const result = allProviders.filter(isEmergencyProvider);
  setCache(cacheKey, result);
  return result;
}

/** Get walk-in providers. With categorySlug returns all in that category; without filters to walk-in types. */
export async function getWalkInProviders(citySlug: string, categorySlug?: string, areaSlug?: string): Promise<LocalProvider[]> {
  if (!HAS_DB) {
    loadFallback();
    let source: LocalProvider[];
    if (categorySlug && areaSlug) {
      source = fallbackByCityCategoryArea!.get(`${citySlug}:${categorySlug}:${areaSlug}`) || [];
    } else if (categorySlug) {
      source = fallbackByCityCategory!.get(`${citySlug}:${categorySlug}`) || [];
    } else if (areaSlug) {
      source = fallbackByCityArea!.get(`${citySlug}:${areaSlug}`) || [];
    } else {
      source = fallbackByCity!.get(citySlug) || [];
    }
    return categorySlug ? source : source.filter(isWalkInProvider);
  }

  const cacheKey = `walkin:${citySlug}:${categorySlug || ""}:${areaSlug || ""}`;
  const cached = getCached<LocalProvider[]>(cacheKey);
  if (cached) return cached;

  const filters: { citySlug?: string; categorySlug?: string; areaSlug?: string } = { citySlug };
  if (categorySlug) filters.categorySlug = categorySlug;
  if (areaSlug) filters.areaSlug = areaSlug;

  const allProviders = await dbSelectProviders(filters);
  const result = categorySlug ? allProviders : allProviders.filter(isWalkInProvider);
  setCache(cacheKey, result);
  return result;
}

/** Get government/public providers in a city, optionally filtered by category and/or area. */
export async function getGovernmentProviders(citySlug: string, categorySlug?: string, areaSlug?: string): Promise<LocalProvider[]> {
  if (!HAS_DB) {
    loadFallback();
    let source: LocalProvider[];
    if (categorySlug && areaSlug) {
      source = fallbackByCityCategoryArea!.get(`${citySlug}:${categorySlug}:${areaSlug}`) || [];
    } else if (categorySlug) {
      source = fallbackByCityCategory!.get(`${citySlug}:${categorySlug}`) || [];
    } else if (areaSlug) {
      source = fallbackByCityArea!.get(`${citySlug}:${areaSlug}`) || [];
    } else {
      source = fallbackByCity!.get(citySlug) || [];
    }
    return source.filter(isGovernmentProvider);
  }

  const cacheKey = `govt:${citySlug}:${categorySlug || ""}:${areaSlug || ""}`;
  const cached = getCached<LocalProvider[]>(cacheKey);
  if (cached) return cached;

  const filters: { citySlug?: string; categorySlug?: string; areaSlug?: string } = { citySlug };
  if (categorySlug) filters.categorySlug = categorySlug;
  if (areaSlug) filters.areaSlug = areaSlug;

  const allProviders = await dbSelectProviders(filters);
  const result = allProviders.filter(isGovernmentProvider);
  setCache(cacheKey, result);
  return result;
}
