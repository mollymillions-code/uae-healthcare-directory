import { CATEGORIES } from "@/lib/constants/categories";
import { CITIES } from "@/lib/constants/cities";
import { CONDITIONS } from "@/lib/constants/conditions";
import { INSURANCE_PROVIDERS } from "@/lib/constants/insurance";
import { LANGUAGES } from "@/lib/constants/languages";
import type { HealthcareEntityType, HealthcareSearchQuery } from "./types";

export const SEARCH_PAGE_SIZE = 12;
export const MAX_SEARCH_PAGE = 1000;
export const MAX_SEARCH_LIMIT = 50;

type SearchParamValue = string | number | boolean | null | undefined;

export interface RawHealthcareSearchParams {
  q?: SearchParamValue;
  query?: SearchParamValue;
  reason?: SearchParamValue;
  condition?: SearchParamValue;
  specialty?: SearchParamValue;
  category?: SearchParamValue;
  city?: SearchParamValue;
  area?: SearchParamValue;
  insurance?: SearchParamValue;
  language?: SearchParamValue;
  entityType?: SearchParamValue;
  emergency?: SearchParamValue;
  page?: SearchParamValue;
}

function cleanParam(value: SearchParamValue): string | undefined {
  if (value === null || value === undefined || value === false) return undefined;
  const text = String(value).trim();
  return text || undefined;
}

function keyFor(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeFromList<T extends { slug: string; name: string }>(
  value: SearchParamValue,
  items: readonly T[],
  aliases: Record<string, string> = {}
): string | undefined {
  const raw = cleanParam(value);
  if (!raw) return undefined;

  const key = keyFor(raw);
  const aliased = aliases[key];
  if (aliased && items.some((item) => item.slug === aliased)) return aliased;

  const exact = items.find(
    (item) => item.slug === raw.toLowerCase() || item.slug === key || keyFor(item.name) === key
  );
  return exact?.slug ?? key;
}

export function normalizeSpecialtySlug(value: SearchParamValue): string | undefined {
  return normalizeFromList(value, CATEGORIES, {
    dentist: "dental",
    dentists: "dental",
    "dental-clinic": "dental",
    "dental-clinics": "dental",
    pharmacy: "pharmacy",
    pharmacies: "pharmacy",
    lab: "labs-diagnostics",
    labs: "labs-diagnostics",
    diagnostics: "labs-diagnostics",
    radiology: "radiology-imaging",
    imaging: "radiology-imaging",
  });
}

export function normalizeCitySlug(value: SearchParamValue): string | undefined {
  return normalizeFromList(value, CITIES);
}

export function normalizeConditionSlug(value: SearchParamValue): string | undefined {
  return normalizeFromList(value, CONDITIONS);
}

export function normalizeInsuranceSlug(value: SearchParamValue): string | undefined {
  return normalizeFromList(value, INSURANCE_PROVIDERS);
}

export function normalizeLanguageSlug(value: SearchParamValue): string | undefined {
  return normalizeFromList(value, LANGUAGES);
}

export function parseSearchPage(value: SearchParamValue): number {
  const raw = Number(cleanParam(value) ?? "1");
  if (!Number.isFinite(raw) || raw < 1) return 1;
  return Math.min(Math.floor(raw), MAX_SEARCH_PAGE);
}

export function parseSearchLimit(value: SearchParamValue, fallback = SEARCH_PAGE_SIZE): number {
  const raw = Number(cleanParam(value) ?? fallback);
  if (!Number.isFinite(raw) || raw < 1) return fallback;
  return Math.min(Math.floor(raw), MAX_SEARCH_LIMIT);
}

export function coerceSearchEntityType(value: SearchParamValue): HealthcareEntityType {
  const raw = cleanParam(value);
  if (raw === "doctor" || raw === "facility") return raw;
  return "both";
}

export function parseSearchBoolean(value: SearchParamValue): boolean {
  const raw = cleanParam(value)?.toLowerCase();
  return raw === "true" || raw === "1" || raw === "yes" || raw === "on";
}

export function normalizeHealthcareSearchQuery(
  params: RawHealthcareSearchParams
): HealthcareSearchQuery {
  const query = cleanParam(params.query ?? params.q);
  const reason = cleanParam(params.reason);
  const specialty = normalizeSpecialtySlug(params.specialty ?? params.category);
  const condition = normalizeConditionSlug(params.condition);
  const city = normalizeCitySlug(params.city);
  const area = cleanParam(params.area);
  const insurance = normalizeInsuranceSlug(params.insurance);
  const language = normalizeLanguageSlug(params.language);

  return {
    ...(query ? { query } : {}),
    ...(reason ? { reason } : {}),
    ...(condition ? { condition } : {}),
    ...(specialty ? { specialty } : {}),
    ...(city ? { city } : {}),
    ...(area ? { area: keyFor(area) } : {}),
    ...(insurance ? { insurance } : {}),
    ...(language ? { language } : {}),
    entityType: coerceSearchEntityType(params.entityType),
    ...(parseSearchBoolean(params.emergency) ? { emergency: true } : {}),
    page: parseSearchPage(params.page),
  };
}

export function buildSearchUrl(query: HealthcareSearchQuery): string {
  const params = new URLSearchParams();
  if (query.query) params.set("q", query.query);
  if (query.city) params.set("city", normalizeCitySlug(query.city) ?? query.city);
  if (query.specialty) params.set("specialty", normalizeSpecialtySlug(query.specialty) ?? query.specialty);
  if (query.condition) params.set("condition", normalizeConditionSlug(query.condition) ?? query.condition);
  if (query.insurance) params.set("insurance", normalizeInsuranceSlug(query.insurance) ?? query.insurance);
  if (query.language) params.set("language", normalizeLanguageSlug(query.language) ?? query.language);
  if (query.area) params.set("area", keyFor(query.area));
  if (query.entityType && query.entityType !== "both") params.set("entityType", query.entityType);
  if (query.emergency) params.set("emergency", "true");
  if (query.reason) params.set("reason", query.reason);
  if (query.page && query.page > 1) params.set("page", String(parseSearchPage(query.page)));

  const qs = params.toString();
  return qs ? `/search?${qs}` : "/search";
}

export function getSearchFacetDisplayLabel(
  facet: "specialty" | "city" | "condition" | "insurance" | "language" | "date",
  value: SearchParamValue
): string {
  const raw = cleanParam(value);
  if (!raw) return "";

  if (facet === "date") {
    const labels: Record<string, string> = {
      today: "Today",
      tomorrow: "Tomorrow",
      "this-week": "This week",
      "this-weekend": "This weekend",
      "next-week": "Next week",
      flexible: "I'm flexible",
    };
    return labels[keyFor(raw)] ?? raw;
  }

  const lists = {
    specialty: CATEGORIES,
    city: CITIES,
    condition: CONDITIONS,
    insurance: INSURANCE_PROVIDERS,
    language: LANGUAGES,
  } as const;
  const slug =
    facet === "specialty"
      ? normalizeSpecialtySlug(raw)
      : facet === "city"
        ? normalizeCitySlug(raw)
        : facet === "condition"
          ? normalizeConditionSlug(raw)
          : facet === "insurance"
            ? normalizeInsuranceSlug(raw)
            : normalizeLanguageSlug(raw);
  return lists[facet].find((item) => item.slug === slug)?.name ?? raw;
}
