import { CATEGORIES, SUBCATEGORIES } from "./constants/categories";
import { CITIES } from "./constants/cities";

type ProviderLike = {
  id?: string;
  name?: string;
  slug?: string;
  country?: string;
  citySlug?: string;
  areaSlug?: string;
  categorySlug?: string;
  subcategorySlug?: string;
  address?: string;
  description?: string;
  shortDescription?: string;
  facilityType?: string;
  googlePlaceId?: string;
  googleTypes?: string[];
  licenseNumber?: string;
  googleRating?: string;
  googleReviewCount?: number;
  isClaimed?: boolean;
  isVerified?: boolean;
  services?: string[];
  languages?: string[];
  insurance?: string[];
  amenities?: string[];
  photos?: string[];
  galleryPhotos?: unknown[];
  reviewSummary?: unknown;
  reviewSummaryV2?: unknown;
  editorialSummary?: string;
  website?: string;
  phone?: string;
};

export type ProviderQualityIssue =
  | "missing-name"
  | "unknown-city"
  | "unknown-category"
  | "city-country-mismatch"
  | "subcategory-category-mismatch"
  | "non-healthcare-education"
  | "non-healthcare-home-service"
  | "non-healthcare-general-service"
  | "possible-non-healthcare";

export type ProviderQualityStatus = {
  isPubliclyListable: boolean;
  isSuspect: boolean;
  issues: ProviderQualityIssue[];
};

export type ProviderFilterScope = {
  country?: string;
  citySlug?: string;
  categorySlug?: string;
  subcategorySlug?: string;
  areaSlug?: string;
};

const CITIES_BY_SLUG = new Map(
  (CITIES as unknown as Array<{ slug: string; country: string }>).map((city) => [
    city.slug,
    city,
  ])
);

const CATEGORY_SLUGS = new Set(CATEGORIES.map((category) => category.slug));

const CATEGORY_ALIASES: Record<string, string> = {
  clinic: "clinics",
  clinics: "clinics",
  polyclinic: "clinics",
  polyclinics: "clinics",
  "general-clinic": "clinics",
  "general-clinics": "clinics",
  "general-clinics-polyclinics": "clinics",
  "medical-clinic": "clinics",
  "medical-clinics": "clinics",
  "multi-specialty-clinic": "clinics",
  "multi-specialty-clinics": "clinics",

  dentist: "dental",
  dentists: "dental",
  dental: "dental",
  "dental-clinic": "dental",
  "dental-clinics": "dental",

  lab: "labs-diagnostics",
  labs: "labs-diagnostics",
  laboratory: "labs-diagnostics",
  laboratories: "labs-diagnostics",
  diagnostics: "labs-diagnostics",
  "labs-and-diagnostics": "labs-diagnostics",
  "laboratory-diagnostics": "labs-diagnostics",

  radiology: "radiology-imaging",
  imaging: "radiology-imaging",
  "radiology-and-imaging": "radiology-imaging",

  pharmacy: "pharmacy",
  pharmacies: "pharmacy",

  "home-health": "home-healthcare",
  "home-care": "home-healthcare",
  "home-health-care": "home-healthcare",

  "fertility": "fertility-ivf",
  ivf: "fertility-ivf",
  "fertility-and-ivf": "fertility-ivf",

  "obgyn": "ob-gyn",
  "ob-gyn-womens-health": "ob-gyn",
  "obgyn-womens-health": "ob-gyn",

  "mental-health-psychology": "mental-health",
  psychology: "mental-health",
  psychiatry: "mental-health",

  "physiotherapy-rehabilitation": "physiotherapy",
  rehabilitation: "physiotherapy",
};

const CATEGORY_VARIANTS = new Map<string, string[]>();
for (const slug of Array.from(CATEGORY_SLUGS)) {
  CATEGORY_VARIANTS.set(slug, [slug]);
}
for (const [alias, canonical] of Object.entries(CATEGORY_ALIASES)) {
  const variants = CATEGORY_VARIANTS.get(canonical) ?? [canonical];
  if (!variants.includes(alias)) variants.push(alias);
  CATEGORY_VARIANTS.set(canonical, variants);
}

const SUBCATEGORY_TO_CATEGORY = new Map<string, string>();
for (const [categorySlug, subcategories] of Object.entries(SUBCATEGORIES)) {
  for (const subcategory of subcategories) {
    SUBCATEGORY_TO_CATEGORY.set(subcategory.slug, categorySlug);
  }
}

export function canonicalizeCategorySlug(value: unknown): string {
  const raw = cleanText(value).replace(/\s+/g, "-");
  return CATEGORY_ALIASES[raw] ?? raw;
}

export function categorySlugVariants(value: unknown): string[] {
  const canonical = canonicalizeCategorySlug(value);
  return CATEGORY_VARIANTS.get(canonical) ?? [canonical];
}

export function canonicalizeSubcategorySlug(value: unknown): string | undefined {
  const raw = cleanText(value).replace(/\s+/g, "-");
  return raw || undefined;
}

export function canonicalizeProviderFilterScope(
  filters?: ProviderFilterScope
): ProviderFilterScope | undefined {
  if (!filters) return undefined;
  return {
    ...filters,
    ...(filters.categorySlug
      ? { categorySlug: canonicalizeCategorySlug(filters.categorySlug) }
      : {}),
    ...(filters.subcategorySlug
      ? { subcategorySlug: canonicalizeSubcategorySlug(filters.subcategorySlug) }
      : {}),
  };
}

const EDUCATION_RE =
  /\b(school|nursery|kindergarten|early learning|daycare|day care|college|university|academy|training|education|educational|learning center|learning centre|tuition|tutoring|institute)\b/i;
const HOME_SERVICE_RE =
  /\b(just\s*life|cleaning|cleaners|maid|maids|housekeeping|laundry|pest control|maintenance|handyman|repair service|car wash|moving service|relocation|real estate|property management)\b/i;
const GENERAL_SERVICE_RE =
  /\b(typing center|typing centre|business center|business centre|document clearing|visa service|travel agency|marketing agency|advertising agency|event management)\b/i;
const HEALTHCARE_RE =
  /\b(hospital|clinic|polyclinic|medical|mediclinic|dental|dentist|orthodont|pharmacy|pharma|laborator|diagnostic|radiology|imaging|physio|physiotherapy|rehab|rehabilitation|derma|dermatology|ophthalm|optical|optomet|cardio|pediatric|paediatric|obstetric|gyne|gyn|ent\b|fertility|ivf|surgery|surgical|urgent care|emergency|health(?!\s*club)|wellness|therapy|therapeutic|nursing|home healthcare|aesthetic|nutrition|dietetic|chiropractic|ayurveda|homeopathy|hijama)\b/i;

function cleanText(value: unknown): string {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function compactText(parts: unknown[]): string {
  return cleanText(parts.filter(Boolean).join(" "));
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item ?? "").trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];

    if (
      (trimmed.startsWith("[") && trimmed.endsWith("]")) ||
      (trimmed.startsWith("{") && trimmed.endsWith("}"))
    ) {
      try {
        return toStringArray(JSON.parse(trimmed));
      } catch {
        // Fall through to delimiter splitting.
      }
    }

    return trimmed
      .split(/[,;|]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (value && typeof value === "object") {
    return Object.values(value as Record<string, unknown>)
      .flatMap((item) => toStringArray(item))
      .filter(Boolean);
  }

  return [];
}

export function normalizeProviderKeyPart(value: unknown): string {
  return cleanText(value).replace(/\b(llc|l l c|co|company|branch|br)\b/g, "").replace(/\s+/g, " ").trim();
}

export function getProviderCountry(provider: ProviderLike): string | undefined {
  const explicitCountry = cleanText(provider.country);
  if (explicitCountry) return explicitCountry;
  const city = provider.citySlug ? CITIES_BY_SLUG.get(provider.citySlug) : undefined;
  return city?.country;
}

export function getProviderStableKey(provider: ProviderLike): string {
  const country = getProviderCountry(provider) ?? "unknown";
  const googlePlaceId = cleanText(provider.googlePlaceId);
  if (googlePlaceId) return `place:${googlePlaceId}`;

  const licenseNumber = normalizeProviderKeyPart(provider.licenseNumber);
  if (licenseNumber) return `license:${country}:${licenseNumber}`;

  const name = normalizeProviderKeyPart(provider.name);
  const address = normalizeProviderKeyPart(provider.address);
  const city = cleanText(provider.citySlug) || "unknown-city";
  const category = cleanText(provider.categorySlug) || "unknown-category";
  if (name) {
    return `provider:${country}:${city}:${category}:${name}:${address || cleanText(provider.slug) || cleanText(provider.id)}`;
  }

  return `fallback:${country}:${cleanText(provider.slug) || cleanText(provider.id) || name || address || "unknown"}`;
}

export function assessProviderQuality(provider: ProviderLike): ProviderQualityStatus {
  const issues: ProviderQualityIssue[] = [];
  const name = String(provider.name ?? "").trim();
  const city = provider.citySlug ? CITIES_BY_SLUG.get(provider.citySlug) : undefined;
  const categorySlug = canonicalizeCategorySlug(provider.categorySlug);
  const explicitCountry = cleanText(provider.country);
  const inferredCountry = city?.country;

  if (!name) issues.push("missing-name");
  if (!city) issues.push("unknown-city");
  if (!CATEGORY_SLUGS.has(categorySlug as (typeof CATEGORIES)[number]["slug"])) {
    issues.push("unknown-category");
  }
  if (explicitCountry && inferredCountry && explicitCountry !== inferredCountry) {
    issues.push("city-country-mismatch");
  }

  if (provider.subcategorySlug) {
    const expectedCategory = SUBCATEGORY_TO_CATEGORY.get(provider.subcategorySlug);
    if (expectedCategory && expectedCategory !== categorySlug) {
      issues.push("subcategory-category-mismatch");
    }
  }

  const searchableText = compactText([
    provider.name,
    provider.slug,
    provider.address,
    provider.description,
    provider.shortDescription,
    provider.facilityType,
    provider.website,
    ...toStringArray(provider.googleTypes),
    ...toStringArray(provider.services),
  ]);
  const hasHealthcareSignal = HEALTHCARE_RE.test(searchableText);

  if (EDUCATION_RE.test(searchableText) && !hasHealthcareSignal) {
    issues.push("non-healthcare-education");
  }
  if (HOME_SERVICE_RE.test(searchableText)) {
    issues.push("non-healthcare-home-service");
  }
  if (GENERAL_SERVICE_RE.test(searchableText) && !hasHealthcareSignal) {
    issues.push("non-healthcare-general-service");
  }
  if ((EDUCATION_RE.test(searchableText) || GENERAL_SERVICE_RE.test(searchableText)) && hasHealthcareSignal) {
    issues.push("possible-non-healthcare");
  }

  const quarantineIssues: ProviderQualityIssue[] = [
    "missing-name",
    "unknown-city",
    "unknown-category",
    "city-country-mismatch",
    "subcategory-category-mismatch",
    "non-healthcare-education",
    "non-healthcare-home-service",
    "non-healthcare-general-service",
  ];

  return {
    isPubliclyListable: !issues.some((issue) => quarantineIssues.includes(issue)),
    isSuspect: issues.includes("possible-non-healthcare"),
    issues,
  };
}

export function isProviderPubliclyListable(provider: ProviderLike): boolean {
  return assessProviderQuality(provider).isPubliclyListable;
}

export function isProviderSuspect(provider: ProviderLike): boolean {
  return assessProviderQuality(provider).isSuspect;
}

export function sanitizeProviderForPublic<T extends ProviderLike>(provider: T): T {
  const quality = assessProviderQuality(provider);
  const cleaned = {
    ...provider,
    categorySlug: canonicalizeCategorySlug(provider.categorySlug),
    subcategorySlug: canonicalizeSubcategorySlug(provider.subcategorySlug),
    services: toStringArray(provider.services),
    languages: toStringArray(provider.languages),
    insurance: toStringArray(provider.insurance),
    amenities: toStringArray(provider.amenities),
  };

  if (!quality.isSuspect) return cleaned;

  return {
    ...cleaned,
    isClaimed: false,
    isVerified: false,
    languages: [],
    insurance: [],
    reviewSummary: undefined,
    reviewSummaryV2: undefined,
    editorialSummary: undefined,
  };
}

function providerScore(provider: ProviderLike): number {
  const quality = assessProviderQuality(provider);
  const rating = Number(provider.googleRating);
  return [
    quality.isSuspect ? 0 : 1000,
    provider.isVerified ? 500 : 0,
    provider.isClaimed ? 250 : 0,
    provider.licenseNumber ? 200 : 0,
    provider.phone ? 80 : 0,
    provider.website ? 60 : 0,
    Number.isFinite(rating) && rating > 0 ? Math.round(rating * 20) : 0,
    Math.min(provider.googleReviewCount ?? 0, 500),
    Math.min((provider.description ?? "").length, 500),
    Math.min((provider.photos?.length ?? 0) + (provider.galleryPhotos?.length ?? 0), 12) * 10,
  ].reduce((sum, value) => sum + value, 0);
}

export function dedupeProvidersByStableKey<T extends ProviderLike>(providers: T[]): T[] {
  const byKey = new Map<string, T>();
  for (const provider of providers) {
    const key = getProviderStableKey(provider);
    const existing = byKey.get(key);
    if (!existing || providerScore(provider) > providerScore(existing)) {
      byKey.set(key, provider);
    }
  }
  return Array.from(byKey.values());
}

export function providerMatchesFilterScope(
  provider: ProviderLike,
  filters?: ProviderFilterScope
): boolean {
  const scope = canonicalizeProviderFilterScope(filters);
  if (!scope) return true;
  if (scope.country && getProviderCountry(provider) !== scope.country) return false;
  if (scope.citySlug && provider.citySlug !== scope.citySlug) return false;
  if (scope.categorySlug && canonicalizeCategorySlug(provider.categorySlug) !== scope.categorySlug) return false;
  if (scope.subcategorySlug && canonicalizeSubcategorySlug(provider.subcategorySlug) !== scope.subcategorySlug) return false;
  if (scope.areaSlug && provider.areaSlug !== scope.areaSlug) return false;
  return true;
}

export function isProviderFilterScopeValid(filters?: ProviderFilterScope): boolean {
  const scope = canonicalizeProviderFilterScope(filters);
  if (!scope) return true;
  if (scope.citySlug && !CITIES_BY_SLUG.has(scope.citySlug)) return false;
  if (scope.categorySlug && !CATEGORY_SLUGS.has(scope.categorySlug as (typeof CATEGORIES)[number]["slug"])) {
    return false;
  }
  if (scope.country && scope.citySlug) {
    const city = CITIES_BY_SLUG.get(scope.citySlug);
    if (city && city.country !== scope.country) return false;
  }
  if (scope.subcategorySlug) {
    const expectedCategory = SUBCATEGORY_TO_CATEGORY.get(scope.subcategorySlug);
    if (!expectedCategory) return false;
    if (scope.categorySlug && expectedCategory !== scope.categorySlug) return false;
  }
  return true;
}

export function prepareProvidersForPublic<T extends ProviderLike>(
  providers: T[],
  filters?: ProviderFilterScope
): T[] {
  const scope = canonicalizeProviderFilterScope(filters);
  if (!isProviderFilterScopeValid(scope)) return [];
  return dedupeProvidersByStableKey(
    providers
      .filter(isProviderPubliclyListable)
      .map(sanitizeProviderForPublic)
      .filter((provider) => providerMatchesFilterScope(provider, scope))
  );
}
