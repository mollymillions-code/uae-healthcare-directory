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
import {
  canonicalizeCategorySlug,
  canonicalizeProviderFilterScope,
  canonicalizeSubcategorySlug,
  categorySlugVariants,
  getProviderCountry,
  getProviderStableKey,
  isProviderFilterScopeValid,
  isProviderPubliclyListable,
  isProviderSuspect,
  prepareProvidersForPublic,
  sanitizeProviderForPublic,
} from "./data-quality";
import type { ProviderFilterScope } from "./data-quality";
import {
  REMOVED_PROVIDER_SLUGS,
  isRemovedProviderRecord,
  isRemovedProviderSlug,
} from "./provider-removals";

export {
  getProviderCountry,
  getProviderStableKey,
  isRemovedProviderRecord,
  isProviderPubliclyListable,
  isProviderSuspect,
};

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
let _areasTable: typeof import("@/lib/db/schema")["areas"] | null = null;
let _citiesTable: typeof import("@/lib/db/schema")["cities"] | null = null;
let _eq: typeof import("drizzle-orm")["eq"] | null = null;
let _and: typeof import("drizzle-orm")["and"] | null = null;
let _countFn: typeof import("drizzle-orm")["count"] | null = null;
let _desc: typeof import("drizzle-orm")["desc"] | null = null;
let _gt: typeof import("drizzle-orm")["gt"] | null = null;
let _ilike: typeof import("drizzle-orm")["ilike"] | null = null;
let _or: typeof import("drizzle-orm")["or"] | null = null;
let _notInArray: typeof import("drizzle-orm")["notInArray"] | null = null;

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
  _areasTable = schemaMod.areas;
  _citiesTable = schemaMod.cities;
  _eq = ormMod.eq;
  _and = ormMod.and;
  _countFn = ormMod.count;
  _desc = ormMod.desc;
  _gt = ormMod.gt;
  _ilike = ormMod.ilike;
  _or = ormMod.or;
  _notInArray = ormMod.notInArray;
  _dbModulesLoaded = true;
}

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface LocalCity {
  slug: string;
  name: string;
  emirate: string;
  country: string;
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
  // ─── Item 3 additive fields (optional, populated when row comes from DB) ───
  // Constants-backed rows do not set these, so every consumer must treat them
  // as optional. They are surfaced so sitemap + seo helpers can gate on the
  // real provider count / publish flag without re-querying the DB.
  id?: string;
  aliases?: string[];
  level?: number;
  source?: string;
  sourceId?: string;
  bbox?: [number, number, number, number];
  isPublished?: boolean;
  providerCountCached?: number;
  minProviderCount?: number;
  description?: string;
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
  nameAr?: string;
  slug: string;
  country?: string;
  citySlug: string;
  areaSlug?: string;
  categorySlug: string;
  subcategorySlug?: string;
  address: string;
  addressAr?: string;
  phone?: string;
  website?: string;
  description: string;
  shortDescription: string;
  descriptionAr?: string;
  licenseNumber?: string;
  logoUrl?: string;
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
  /**
   * v2 review section — the bulky "What patients say" block.
   * When present, the frontend renders this instead of the legacy
   * `reviewSummary` string[] bullets. Produced by
   * `scripts/rewrite-reviews-v2-or.mjs` and stored in
   * `providers.review_summary_v2` JSONB on live DB.
   */
  reviewSummaryV2?: {
    version: 2;
    overall_sentiment: string;
    what_stood_out: Array<{ theme: string; mention_count: number }>;
    snippets: Array<{
      text_fragment: string;
      author_display: string;
      rating: number;
      relative_time?: string;
    }>;
    source: string;
    synced_at: string;
    google_maps_url?: string;
  };
  coverImageUrl?: string;
  photos?: string[];
  yearEstablished?: number;

  // Comprehensive Google Places (New API) data — populated by
  // scripts/comprehensive-enrich-places.mjs. Photos served from R2.
  galleryPhotos?: Array<{
    url: string;
    widthPx: number;
    heightPx: number;
    attributions: Array<{ displayName: string; uri: string }>;
  }>;
  googleReviews?: Array<{
    rating: number;
    text?: { text: string; languageCode: string } | null;
    originalText?: { text: string; languageCode: string } | null;
    authorAttribution?: {
      displayName: string;
      uri?: string;
      photoUri?: string;
    } | null;
    publishTime?: string | null;
    relativePublishTimeDescription?: string | null;
  }>;
  editorialSummary?: string;
  editorialSummaryLang?: string;
  accessibilityOptions?: {
    wheelchairAccessibleEntrance?: boolean;
    wheelchairAccessibleParking?: boolean;
    wheelchairAccessibleRestroom?: boolean;
    wheelchairAccessibleSeating?: boolean;
  };
  googleTypes?: string[];
  googlePlaceId?: string;
  plusCodeGlobal?: string;
  plusCodeCompound?: string;
  googleMapsUri?: string;
  priceLevel?: string;
  openingHoursPeriods?: Array<{
    open: { day: number; hour: number; minute: number };
    close?: { day: number; hour: number; minute: number };
  }>;
  currentOpeningHours?: {
    openNow?: boolean;
    weekdayDescriptions?: string[];
  };
  addressComponents?: Array<{
    longText: string;
    shortText: string;
    types: string[];
  }>;
  googleFetchedAt?: string;
  businessStatus?: string;
}

function preparePublicProviders(
  providers: LocalProvider[],
  scope?: ProviderFilterScope
): LocalProvider[] {
  return prepareProvidersForPublic(
    providers.filter((provider) => !isRemovedProviderRecord(provider)),
    scope
  );
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
    nameAr: row.nameAr ?? row.name_ar ?? undefined,
    slug: row.slug,
    country: row.country ?? undefined,
    citySlug: row.citySlug ?? row.city_slug ?? "",
    areaSlug: row.areaSlug ?? row.area_slug ?? undefined,
    categorySlug: canonicalizeCategorySlug(row.categorySlug ?? row.category_slug ?? ""),
    subcategorySlug: canonicalizeSubcategorySlug(row.subcategorySlug ?? row.subcategory_slug),
    address: row.address ?? "",
    addressAr: row.addressAr ?? row.address_ar ?? undefined,
    phone: row.phone ?? undefined,
    website: row.website ?? undefined,
    description: row.description ?? "",
    shortDescription: row.shortDescription ?? row.short_description ?? "",
    descriptionAr: row.descriptionAr ?? row.description_ar ?? undefined,
    licenseNumber: row.licenseNumber ?? row.license_number ?? undefined,
    logoUrl: row.logoUrl ?? row.logo_url ?? undefined,
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
    reviewSummaryV2: row.reviewSummaryV2 ?? row.review_summary_v2 ?? undefined,
    coverImageUrl: row.coverImageUrl ?? row.cover_image_url ?? undefined,
    photos: row.photos?.length ? row.photos : undefined,
    yearEstablished: row.yearEstablished ?? row.year_established ?? undefined,
    galleryPhotos: row.galleryPhotos ?? row.gallery_photos ?? undefined,
    googleReviews: row.googleReviews ?? row.google_reviews ?? undefined,
    editorialSummary: row.editorialSummary ?? row.editorial_summary ?? undefined,
    editorialSummaryLang:
      row.editorialSummaryLang ?? row.editorial_summary_lang ?? undefined,
    accessibilityOptions:
      row.accessibilityOptions ?? row.accessibility_options ?? undefined,
    googleTypes: row.googleTypes ?? row.google_types ?? undefined,
    googlePlaceId: row.googlePlaceId ?? row.google_place_id ?? undefined,
    plusCodeGlobal: row.plusCodeGlobal ?? row.plus_code_global ?? undefined,
    plusCodeCompound:
      row.plusCodeCompound ?? row.plus_code_compound ?? undefined,
    googleMapsUri: row.googleMapsUri ?? row.google_maps_uri ?? undefined,
    priceLevel: row.priceLevel ?? row.price_level ?? undefined,
    openingHoursPeriods:
      row.openingHoursPeriods ?? row.opening_hours_periods ?? undefined,
    currentOpeningHours:
      row.currentOpeningHours ?? row.current_opening_hours ?? undefined,
    addressComponents:
      row.addressComponents ?? row.address_components ?? undefined,
    googleFetchedAt: row.googleFetchedAt
      ? new Date(row.googleFetchedAt).toISOString()
      : row.google_fetched_at
        ? new Date(row.google_fetched_at).toISOString()
        : undefined,
    businessStatus: row.businessStatus ?? row.business_status ?? undefined,
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
    FALLBACK_ALL_PROVIDERS = preparePublicProviders(
      scraped.map((p: Record<string, unknown>) => ({
        ...(p as unknown as LocalProvider),
        country: (p.country as string | undefined) || getProviderCountry(p as unknown as LocalProvider),
        categorySlug: canonicalizeCategorySlug((p.categorySlug as string | undefined) ?? (p.category_slug as string | undefined)),
        subcategorySlug: canonicalizeSubcategorySlug((p.subcategorySlug as string | undefined) ?? (p.subcategory_slug as string | undefined)),
        googleRating: (p.googleRating as string) || "0",
        googleReviewCount: (p.googleReviewCount as number) || 0,
        latitude: (p.latitude as string) || "0",
        longitude: (p.longitude as string) || "0",
      }))
    );
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

export function getCities(country?: string): LocalCity[] {
  const all = CITIES as unknown as LocalCity[];
  // Default to UAE-only when no country is specified — prevents 43 GCC cities
  // from appearing on the 45+ existing call sites that expect UAE cities only.
  const cc = country ?? "ae";
  return all.filter((c) => c.country === cc);
}

export function getCityBySlug(slug: string): LocalCity | undefined {
  return (CITIES as unknown as LocalCity[]).find((c) => c.slug === slug);
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

// ─── Item 3 — Neighborhood helpers (async, DB-first, const-fallback) ─────────
//
// These are NEW helpers added by the Zocdoc roadmap Item 3 (UAE neighborhood
// taxonomy upgrade). They read from the `areas` DB table when it has rows and
// fall back to the hand-curated `AREAS` constant when the table is empty.
//
// The legacy sync helpers `getAreasByCity` + `getAreaBySlug` above are still
// used by `resolveSegments` in `src/lib/directory-utils.ts` (which is itself
// async) and by catch-all page rendering. DO NOT replace them here — the new
// helpers are additive.

/** Convert a DB `areas` row to LocalArea, respecting bbox/centroid fields. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToArea(row: any, citySlug: string): LocalArea {
  const centroidLat = row.centroidLat ?? row.centroid_lat;
  const centroidLng = row.centroidLng ?? row.centroid_lng;
  const fallbackLat = row.latitude;
  const fallbackLng = row.longitude;
  const bbox = row.bbox as [number, number, number, number] | undefined;
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    nameAr: row.nameAr ?? row.name_ar ?? undefined,
    latitude: String(centroidLat ?? fallbackLat ?? "0"),
    longitude: String(centroidLng ?? fallbackLng ?? "0"),
    citySlug,
    aliases: (row.aliases ?? []) as string[],
    level: row.level ?? 3,
    source: row.source ?? undefined,
    sourceId: row.sourceId ?? row.source_id ?? undefined,
    bbox: bbox && bbox.length === 4 ? bbox : undefined,
    isPublished: row.isPublished ?? row.is_published ?? true,
    providerCountCached:
      row.providerCountCached ?? row.provider_count_cached ?? undefined,
    minProviderCount:
      row.minProviderCount ?? row.min_provider_count ?? undefined,
    description: row.description ?? undefined,
  };
}

/**
 * Return all published neighborhoods for a city. DB-first; falls back to the
 * sync `AREAS` constant when the DB has no polygon rows yet (zero-state). The
 * optional `minProviders` gate hides thin areas from hub pages.
 */
export async function getNeighborhoodsByCity(
  citySlug: string,
  opts?: { minProviders?: number }
): Promise<LocalArea[]> {
  const minProviders = opts?.minProviders ?? 0;

  const cacheKey = `neighborhoods:${citySlug}:${minProviders}`;
  const cached = getCached<LocalArea[]>(cacheKey);
  if (cached) return cached;

  await verifyDbHasData();

  // Try DB first — but gracefully fall back to constants on any error
  // (e.g. the new columns haven't been migrated yet, or the table is empty).
  if (HAS_DB) {
    try {
      await ensureDbModules();
      const c = _citiesTable!;
      const a = _areasTable!;
      const cityRows = await _db!
        .select({ id: c.id })
        .from(c)
        .where(_eq!(c.slug, citySlug))
        .limit(1);
      if (cityRows.length > 0) {
        const rows = await _db!
          .select()
          .from(a)
          .where(
            _and!(_eq!(a.cityId, cityRows[0].id), _eq!(a.isPublished, true))
          );
        if (rows && rows.length > 0) {
          const mapped = rows
            .map((r) => rowToArea(r, citySlug))
            .filter(
              (area) =>
                (area.providerCountCached ?? 0) >=
                Math.max(minProviders, area.minProviderCount ?? 0)
            )
            .sort((x, y) => {
              const xc = x.providerCountCached ?? 0;
              const yc = y.providerCountCached ?? 0;
              if (xc !== yc) return yc - xc;
              return x.name.localeCompare(y.name);
            });
          setCache(cacheKey, mapped);
          return mapped;
        }
      }
    } catch (e) {
      console.warn(
        "[data.ts] getNeighborhoodsByCity DB query failed — falling back to constants:",
        e instanceof Error ? e.message : e
      );
    }
  }

  // Zero-state fallback: hand-curated AREAS constant.
  const fallback = getAreasByCity(citySlug);
  setCache(cacheKey, fallback);
  return fallback;
}

/** Single-neighborhood lookup. DB-first, constant fallback. */
export async function getNeighborhoodBySlug(
  citySlug: string,
  areaSlug: string
): Promise<LocalArea | null> {
  const cacheKey = `neighborhood:${citySlug}:${areaSlug}`;
  const cached = getCached<LocalArea>(cacheKey);
  if (cached) return cached;

  await verifyDbHasData();

  if (HAS_DB) {
    try {
      await ensureDbModules();
      const c = _citiesTable!;
      const a = _areasTable!;
      const cityRows = await _db!
        .select({ id: c.id })
        .from(c)
        .where(_eq!(c.slug, citySlug))
        .limit(1);
      if (cityRows.length > 0) {
        const rows = await _db!
          .select()
          .from(a)
          .where(
            _and!(
              _eq!(a.cityId, cityRows[0].id),
              _eq!(a.slug, areaSlug),
              _eq!(a.isPublished, true)
            )
          )
          .limit(1);
        if (rows && rows.length > 0) {
          const area = rowToArea(rows[0], citySlug);
          setCache(cacheKey, area);
          return area;
        }
      }
    } catch (e) {
      console.warn(
        "[data.ts] getNeighborhoodBySlug DB query failed — falling back to constants:",
        e instanceof Error ? e.message : e
      );
    }
  }

  const fallback = getAreaBySlug(citySlug, areaSlug);
  if (!fallback) return null;
  setCache(cacheKey, fallback);
  return fallback;
}

/**
 * Providers within a neighborhood, optionally filtered by category. Uses the
 * existing `getProviders()` pipeline so it respects the DB/JSON fallback +
 * country gating + pagination that the rest of the app relies on.
 */
export async function getProvidersByNeighborhood(
  citySlug: string,
  areaSlug: string,
  opts?: {
    categorySlug?: string;
    limit?: number;
    offset?: number;
    page?: number;
  }
): Promise<{ total: number; providers: LocalProvider[] }> {
  const limit = opts?.limit ?? 50;
  const page =
    opts?.page ??
    (opts?.offset !== undefined ? Math.floor(opts.offset / limit) + 1 : 1);

  const res = await getProviders({
    citySlug,
    areaSlug,
    categorySlug: opts?.categorySlug,
    limit,
    page,
    sort: "rating",
  });

  return { total: res.total, providers: res.providers };
}

/**
 * Provider count in a neighborhood (optionally category-gated). Uses
 * `provider_count_cached` when available for speed; otherwise delegates to
 * the existing count helpers so zero-state still returns a sane number.
 */
export async function getProviderCountByNeighborhood(
  citySlug: string,
  areaSlug: string,
  opts?: { categorySlug?: string }
): Promise<number> {
  // When no category filter is set, prefer the cached count on the area row.
  if (!opts?.categorySlug) {
    const area = await getNeighborhoodBySlug(citySlug, areaSlug);
    if (area && typeof area.providerCountCached === "number") {
      return area.providerCountCached;
    }
    // Fallback: live count via existing helper (uses providers.area_slug).
    return getProviderCountByAreaAndCity(areaSlug, citySlug);
  }

  // Category-gated count: use the existing getProviders() count path.
  const { total } = await getProviders({
    citySlug,
    areaSlug,
    categorySlug: opts.categorySlug,
    limit: 1,
    page: 1,
  });
  return total;
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
  country?: string;
}): Promise<LocalProvider[]> {
  const scope = canonicalizeProviderFilterScope(filters);
  if (!isProviderFilterScopeValid(scope)) return [];

  await ensureDbModules();
  const t = _providersTable!;
  const conditions = [];

  if (scope?.country) {
    conditions.push(_eq!(t.country, scope.country));
  } else if (!scope?.citySlug) {
    conditions.push(_eq!(t.country, "ae"));
  }
  if (scope?.citySlug) conditions.push(_eq!(t.citySlug, scope.citySlug));
  if (scope?.categorySlug) {
    const variants = categorySlugVariants(scope.categorySlug);
    conditions.push(
      variants.length === 1
        ? _eq!(t.categorySlug, variants[0])
        : _or!(...variants.map((slug) => _eq!(t.categorySlug, slug)))
    );
  }
  if (scope?.areaSlug) conditions.push(_eq!(t.areaSlug, scope.areaSlug));
  if (scope?.subcategorySlug) conditions.push(_eq!(t.subcategorySlug, scope.subcategorySlug));
  if (REMOVED_PROVIDER_SLUGS.length > 0) {
    conditions.push(_notInArray!(t.slug, REMOVED_PROVIDER_SLUGS));
  }

  const where = conditions.length > 0 ? _and!(...conditions) : undefined;
  const rows = await _db!.select().from(t).where(where);
  return preparePublicProviders(rows.map(rowToProvider), scope);
}

async function dbCountProviders(filters?: {
  citySlug?: string;
  categorySlug?: string;
  areaSlug?: string;
  subcategorySlug?: string;
  country?: string;
}): Promise<number> {
  const scope = canonicalizeProviderFilterScope(filters);
  if (!isProviderFilterScopeValid(scope)) return 0;

  await ensureDbModules();
  const t = _providersTable!;
  const conditions = [];

  if (scope?.country) {
    conditions.push(_eq!(t.country, scope.country));
  } else if (!scope?.citySlug) {
    conditions.push(_eq!(t.country, "ae"));
  }
  if (scope?.citySlug) conditions.push(_eq!(t.citySlug, scope.citySlug));
  if (scope?.categorySlug) {
    const variants = categorySlugVariants(scope.categorySlug);
    conditions.push(
      variants.length === 1
        ? _eq!(t.categorySlug, variants[0])
        : _or!(...variants.map((slug) => _eq!(t.categorySlug, slug)))
    );
  }
  if (scope?.areaSlug) conditions.push(_eq!(t.areaSlug, scope.areaSlug));
  if (scope?.subcategorySlug) conditions.push(_eq!(t.subcategorySlug, scope.subcategorySlug));
  if (REMOVED_PROVIDER_SLUGS.length > 0) {
    conditions.push(_notInArray!(t.slug, REMOVED_PROVIDER_SLUGS));
  }

  const where = conditions.length > 0 ? _and!(...conditions) : undefined;
  const rows = await _db!.select({ count: _countFn!() }).from(t).where(where);
  return Number(rows[0]?.count ?? 0);
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
  country?: string;
}): Promise<{ providers: LocalProvider[]; total: number; page: number; totalPages: number }> {
  const scope = canonicalizeProviderFilterScope(filters);
  const normalizedFilters = { ...filters, ...scope };

  if (!isProviderFilterScopeValid(scope)) {
    const page = filters?.page || 1;
    return { providers: [], total: 0, page, totalPages: 0 };
  }

  // ─── Verify DB has data (first call only) ──────────────────────────────────
  await verifyDbHasData();

  // ─── Fallback: JSON ────────────────────────────────────────────────────────
  if (!HAS_DB) {
    loadFallback();
    let filtered: LocalProvider[];

    if (normalizedFilters?.citySlug && normalizedFilters?.categorySlug && normalizedFilters?.areaSlug) {
      filtered = fallbackByCityCategoryArea!.get(`${normalizedFilters.citySlug}:${normalizedFilters.categorySlug}:${normalizedFilters.areaSlug}`) || [];
    } else if (normalizedFilters?.citySlug && normalizedFilters?.categorySlug) {
      filtered = fallbackByCityCategory!.get(`${normalizedFilters.citySlug}:${normalizedFilters.categorySlug}`) || [];
    } else if (normalizedFilters?.citySlug && normalizedFilters?.areaSlug) {
      filtered = fallbackByCityArea!.get(`${normalizedFilters.citySlug}:${normalizedFilters.areaSlug}`) || [];
    } else if (normalizedFilters?.citySlug) {
      filtered = fallbackByCity!.get(normalizedFilters.citySlug) || [];
    } else {
      filtered = FALLBACK_ALL_PROVIDERS!;
    }

    if (normalizedFilters?.subcategorySlug) {
      filtered = filtered.filter((p) => p.subcategorySlug === normalizedFilters.subcategorySlug);
    }
    filtered = preparePublicProviders(filtered, scope);

    if (normalizedFilters?.query) {
      const q = normalizedFilters.query.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.address.toLowerCase().includes(q)
      );
    }
    if (normalizedFilters?.sort === "rating") {
      filtered = [...filtered].sort((a, b) => Number(b.googleRating) - Number(a.googleRating));
    } else if (normalizedFilters?.sort === "name") {
      filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    }

    const page = normalizedFilters?.page || 1;
    const limit = normalizedFilters?.limit || 20;
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
  // Default to UAE when neither country nor citySlug is passed — prevents GCC
  // providers from leaking into UAE directory pages once GCC data is seeded.
  // When citySlug is set, it already scopes to a specific country's city, so
  // no default country filter is needed.
  if (normalizedFilters?.country) {
    conditions.push(_eq!(t.country, normalizedFilters.country));
  } else if (!normalizedFilters?.citySlug) {
    conditions.push(_eq!(t.country, "ae"));
  }
  if (normalizedFilters?.citySlug) conditions.push(_eq!(t.citySlug, normalizedFilters.citySlug));
  if (normalizedFilters?.categorySlug) {
    const variants = categorySlugVariants(normalizedFilters.categorySlug);
    conditions.push(
      variants.length === 1
        ? _eq!(t.categorySlug, variants[0])
        : _or!(...variants.map((slug) => _eq!(t.categorySlug, slug)))
    );
  }
  if (normalizedFilters?.areaSlug) conditions.push(_eq!(t.areaSlug, normalizedFilters.areaSlug));
  if (normalizedFilters?.subcategorySlug) conditions.push(_eq!(t.subcategorySlug, normalizedFilters.subcategorySlug));
  if (normalizedFilters?.query) {
    const q = `%${normalizedFilters.query}%`;
    conditions.push(
      _or!(
        _ilike!(t.name, q),
        _ilike!(t.description, q),
        _ilike!(t.address, q)
      )
    );
  }
  if (REMOVED_PROVIDER_SLUGS.length > 0) {
    conditions.push(_notInArray!(t.slug, REMOVED_PROVIDER_SLUGS));
  }

  const where = conditions.length > 0 ? _and!(...conditions) : undefined;

  const page = normalizedFilters?.page || 1;
  const limit = normalizedFilters?.limit || 20;
  const offset = (page - 1) * limit;

  const rows = await _db!.select().from(t).where(where);
  let filtered = preparePublicProviders(rows.map(rowToProvider), scope);
  if (normalizedFilters?.sort === "rating") {
    filtered = [...filtered].sort((a, b) => Number(b.googleRating) - Number(a.googleRating));
  } else if (normalizedFilters?.sort === "name") {
    filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
  }

  const total = filtered.length;
  const totalPages = Math.ceil(total / limit);

  return {
    providers: filtered.slice(offset, offset + limit),
    total,
    page,
    totalPages,
  };
}

export async function getProviderBySlug(slug: string, expectedScope?: ProviderFilterScope): Promise<LocalProvider | undefined> {
  if (isRemovedProviderSlug(slug)) return undefined;
  const scope = canonicalizeProviderFilterScope(expectedScope);
  if (!isProviderFilterScopeValid(scope)) return undefined;

  await verifyDbHasData();

  if (!HAS_DB) {
    loadFallback();
    const provider = fallbackBySlug!.get(slug);
    if (provider) return preparePublicProviders([provider], scope)[0];
    return findProviderBySlugAlias(slug, FALLBACK_ALL_PROVIDERS ?? [], scope);
  }

  const cacheKey = `slug:${slug}:${scope ? JSON.stringify(scope) : ""}`;
  const cached = getCached<LocalProvider>(cacheKey);
  if (cached) return cached;

  await ensureDbModules();
  const t = _providersTable!;
  const rows = await _db!.select().from(t).where(_eq!(t.slug, slug)).limit(1);
  let provider =
    rows.length > 0 && !isRemovedProviderRecord(rows[0])
      ? sanitizeProviderForPublic(rowToProvider(rows[0]))
      : undefined;
  if (!provider) {
    const candidates = await dbSelectProviders({
      country: scope?.country,
      citySlug: scope?.citySlug,
      areaSlug: scope?.areaSlug,
    });
    provider = findProviderBySlugAlias(slug, candidates, scope);
  }
  if (!provider || !isProviderPubliclyListable(provider)) return undefined;
  if (preparePublicProviders([provider], scope).length === 0) return undefined;
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

  const count = await dbCountProviders({ citySlug });
  setCache(cacheKey, count);
  return count;
}

export async function getProviderCountByCategoryAndCity(categorySlug: string, citySlug: string): Promise<number> {
  const canonicalCategorySlug = canonicalizeCategorySlug(categorySlug);
  if (!HAS_DB) {
    loadFallback();
    return (fallbackByCityCategory!.get(`${citySlug}:${canonicalCategorySlug}`) || []).length;
  }

  const cacheKey = `count:cat-city:${canonicalCategorySlug}:${citySlug}`;
  const cached = getCached<number>(cacheKey);
  if (cached !== undefined) return cached;

  const count = await dbCountProviders({ categorySlug: canonicalCategorySlug, citySlug });
  setCache(cacheKey, count);
  return count;
}

export async function getProviderCountByCategory(categorySlug: string): Promise<number> {
  const canonicalCategorySlug = canonicalizeCategorySlug(categorySlug);
  if (!HAS_DB) {
    loadFallback();
    let count = 0;
    fallbackByCityCategory!.forEach((arr, key) => {
      if (key.split(":")[1] === canonicalCategorySlug) {
        count += arr.length;
      }
    });
    return count;
  }

  const cacheKey = `count:cat:${canonicalCategorySlug}`;
  const cached = getCached<number>(cacheKey);
  if (cached !== undefined) return cached;

  const count = await dbCountProviders({ categorySlug: canonicalCategorySlug, country: "ae" });
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

  const count = await dbCountProviders({ areaSlug, citySlug });
  setCache(cacheKey, count);
  return count;
}

export async function getTopRatedProviders(citySlug?: string, limit = 5): Promise<LocalProvider[]> {
  if (!HAS_DB) {
    loadFallback();
    const source = citySlug
      ? (fallbackByCity!.get(citySlug) || [])
      : FALLBACK_ALL_PROVIDERS!.filter((p) => getProviderCountry(p) === "ae");
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
  const conditions = [];
  if (citySlug) {
    conditions.push(_eq!(t.citySlug, citySlug));
  } else {
    conditions.push(_eq!(t.country, "ae"));
  }
  conditions.push(_gt!(t.googleRating, "0"));
  if (REMOVED_PROVIDER_SLUGS.length > 0) {
    conditions.push(_notInArray!(t.slug, REMOVED_PROVIDER_SLUGS));
  }

  const rows = await _db!
    .select()
    .from(t)
    .where(_and!(...conditions))
    .orderBy(_desc!(t.googleRating), _desc!(t.googleReviewCount))
    .limit(Math.max(limit * 4, limit));

  const result = preparePublicProviders(
    rows.map(rowToProvider),
    citySlug ? { citySlug } : { country: "ae" }
  )
    .filter((p) => Number(p.googleRating) > 0)
    .sort((a, b) => {
      const ratingDiff = Number(b.googleRating) - Number(a.googleRating);
      if (ratingDiff !== 0) return ratingDiff;
      return (b.googleReviewCount || 0) - (a.googleReviewCount || 0);
    })
    .slice(0, limit);
  setCache(cacheKey, result);
  return result;
}

function normalizeSlugLookup(value: unknown): string {
  return String(value ?? "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/l[\W_]*l[\W_]*c/g, "llc")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^|-)(llc|ltd|co|company|branch|br)(?=-|$)/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function withoutCitySuffix(value: string, citySlug?: string): string {
  if (citySlug && value.endsWith(`-${citySlug}`)) {
    return value.slice(0, -citySlug.length - 1);
  }
  for (const city of CITIES) {
    if (value.endsWith(`-${city.slug}`)) {
      return value.slice(0, -city.slug.length - 1);
    }
  }
  return value;
}

function providerSlugAliases(provider: LocalProvider): Set<string> {
  const aliases = new Set<string>();
  const push = (value: unknown) => {
    const normalized = normalizeSlugLookup(value);
    if (!normalized) return;
    aliases.add(normalized);
    aliases.add(withoutCitySuffix(normalized, provider.citySlug));
  };

  push(provider.slug);
  push(provider.name);
  push(`${provider.name}-${provider.citySlug}`);
  if (provider.licenseNumber) push(`${provider.licenseNumber}-${provider.citySlug}`);
  return aliases;
}

function findProviderBySlugAlias(
  slug: string,
  providers: LocalProvider[],
  expectedScope?: ProviderFilterScope
): LocalProvider | undefined {
  const requested = normalizeSlugLookup(slug);
  const requestedStem = withoutCitySuffix(requested, expectedScope?.citySlug);
  return preparePublicProviders(providers, expectedScope).find((provider) => {
    const aliases = providerSlugAliases(provider);
    return aliases.has(requested) || aliases.has(requestedStem);
  });
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

  const result = (await dbSelectProviders({ citySlug })).map((p) => ({
    categorySlug: p.categorySlug,
    slug: p.slug,
  }));
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

  const cacheKey = `ins:${insurerSlug}:${citySlug || "all"}`;
  const cached = getCached<LocalProvider[]>(cacheKey);
  if (cached) return cached;

  const result = (await dbSelectProviders(citySlug ? { citySlug } : undefined)).filter((p) =>
    p.insurance.some((ins) => matchTerms.some((term) => ins.toLowerCase().includes(term)))
  );
  setCache(cacheKey, result);
  return result;
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

  const insurer = INSURANCE_PROVIDERS.find((i) => i.slug === insurerSlug);
  if (!insurer) { setCache(cacheKey, 0); return 0; }

  const matchTerms = [insurer.slug, insurer.name.toLowerCase()];
  const count = (await dbSelectProviders({ citySlug })).filter((p) =>
    p.insurance.some((ins) => matchTerms.some((term) => ins.toLowerCase().includes(term)))
  ).length;
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

  return (await dbSelectProviders(citySlug ? { citySlug } : undefined)).filter((p) =>
    p.languages.some((lang) => lang.toLowerCase() === matchName)
  );
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

  const language = LANGUAGES.find((l) => l.slug === languageSlug);
  if (!language) { setCache(cacheKey, 0); return 0; }

  const matchName = language.name.toLowerCase();
  const count = (await dbSelectProviders({ citySlug })).filter((p) =>
    p.languages.some((lang) => lang.toLowerCase() === matchName)
  ).length;
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
