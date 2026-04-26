/**
 * Shared utilities for GCC country directory routes.
 * UAE uses the existing /directory/* routes (no country prefix).
 * Qatar, Saudi Arabia, Bahrain, Kuwait use /[country]/directory/* routes.
 */

import { COUNTRIES, type Country } from "@/lib/constants/countries";
import { CITIES } from "@/lib/constants/cities";

/** Country codes that use the /[country]/directory/* route pattern */
export const GCC_COUNTRY_CODES = ["qa", "sa", "bh", "kw"] as const;
export type GccCountryCode = (typeof GCC_COUNTRY_CODES)[number];

/** Validate that a country code is a valid GCC (non-UAE) country */
export function isValidGccCountry(code: string): code is GccCountryCode {
  return (GCC_COUNTRY_CODES as readonly string[]).includes(code);
}

/** Get country or return null if not a valid GCC country */
export function getGccCountry(code: string): Country | null {
  if (!isValidGccCountry(code)) return null;
  return COUNTRIES.find((c) => c.code === code) ?? null;
}

/** Get cities for a specific country */
export function getCitiesByCountry(countryCode: string) {
  return (CITIES as unknown as Array<{ slug: string; name: string; country: string; nameAr: string; description: string; sortOrder: number }>).filter(
    (c) => c.country === countryCode
  );
}

/** Check if a city belongs to a specific country */
export function cityBelongsToCountry(citySlug: string, countryCode: string): boolean {
  return (CITIES as unknown as Array<{ slug: string; country: string }>).some(
    (c) => c.slug === citySlug && c.country === countryCode
  );
}

/** Build a directory URL with country prefix */
export function countryDirectoryUrl(countryCode: string, ...segments: string[]): string {
  return `/${countryCode}/directory${segments.length > 0 ? "/" + segments.join("/") : ""}`;
}

/** Build the provider-card base path for country-prefixed directory listings */
export function countryDirectoryBasePath(countryCode: string): string {
  return countryDirectoryUrl(countryCode);
}

/** Build a best-of URL with country prefix */
export function countryBestUrl(countryCode: string, ...segments: string[]): string {
  return `/${countryCode}/best${segments.length > 0 ? "/" + segments.join("/") : ""}`;
}

/** Country display names for metadata */
export const COUNTRY_NAMES: Record<string, string> = {
  qa: "Qatar",
  sa: "Saudi Arabia",
  bh: "Bahrain",
  kw: "Kuwait",
};

/** Country locale codes for SEO */
export const COUNTRY_LOCALES: Record<string, string> = {
  qa: "en_QA",
  sa: "en_SA",
  bh: "en_BH",
  kw: "en_KW",
};
