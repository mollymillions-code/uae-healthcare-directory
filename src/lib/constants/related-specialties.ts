/**
 * Curated related-specialties map used by fat hub pages.
 *
 * When a visitor lands on `/directory/[city]/[category]`, the hub page
 * renders a sibling-specialty strip to help them navigate across
 * clinically-adjacent categories. E.g. a dermatology visitor is likely
 * to also need cosmetic or allergy care; a dental visitor may also want
 * an oral surgeon, etc.
 *
 * This map is additive: unknown category slugs return `[]` and the hub
 * page falls back to generic sibling links from `getCategories()`.
 *
 * NOTE: Slugs must match `src/lib/constants/categories.ts`. The
 * `__selftest` function below validates that every referenced slug
 * exists in the CATEGORIES table so a rename doesn't silently break the
 * hub pages.
 */

import { CATEGORIES } from "./categories";

const KNOWN_CATEGORIES: Set<string> = new Set(CATEGORIES.map((c) => c.slug));

export const RELATED_SPECIALTIES: Record<string, string[]> = {
  dental: [
    "cosmetic-plastic",
    "mental-health",
    "ent",
    "pediatrics",
    "alternative-medicine",
    "wellness-spas",
  ],
  dermatology: [
    "cosmetic-plastic",
    "wellness-spas",
    "alternative-medicine",
    "ophthalmology",
    "pediatrics",
    "ent",
  ],
  cardiology: [
    "hospitals",
    "neurology",
    "nephrology",
    "nutrition-dietetics",
    "emergency-care",
    "radiology-imaging",
  ],
  orthopedics: [
    "physiotherapy",
    "radiology-imaging",
    "alternative-medicine",
    "hospitals",
    "emergency-care",
    "pediatrics",
  ],
  pediatrics: [
    "dental",
    "ophthalmology",
    "ent",
    "dermatology",
    "mental-health",
    "nutrition-dietetics",
  ],
  "ob-gyn": [
    "fertility-ivf",
    "pediatrics",
    "nutrition-dietetics",
    "mental-health",
    "dermatology",
    "radiology-imaging",
  ],
  ophthalmology: [
    "neurology",
    "pediatrics",
    "radiology-imaging",
    "dermatology",
    "home-healthcare",
    "alternative-medicine",
  ],
  "mental-health": [
    "nutrition-dietetics",
    "pediatrics",
    "alternative-medicine",
    "home-healthcare",
    "neurology",
    "wellness-spas",
  ],
  ent: [
    "pediatrics",
    "alternative-medicine",
    "dermatology",
    "radiology-imaging",
    "home-healthcare",
    "hospitals",
  ],
  "fertility-ivf": [
    "ob-gyn",
    "urology",
    "nutrition-dietetics",
    "mental-health",
    "radiology-imaging",
    "hospitals",
  ],
  physiotherapy: [
    "orthopedics",
    "neurology",
    "alternative-medicine",
    "home-healthcare",
    "wellness-spas",
    "nutrition-dietetics",
  ],
  neurology: [
    "orthopedics",
    "mental-health",
    "physiotherapy",
    "radiology-imaging",
    "hospitals",
    "ophthalmology",
  ],
  urology: [
    "nephrology",
    "fertility-ivf",
    "oncology",
    "radiology-imaging",
    "hospitals",
    "gastroenterology",
  ],
  gastroenterology: [
    "nutrition-dietetics",
    "oncology",
    "hospitals",
    "radiology-imaging",
    "alternative-medicine",
    "emergency-care",
  ],
  oncology: [
    "hospitals",
    "radiology-imaging",
    "nutrition-dietetics",
    "mental-health",
    "urology",
    "cardiology",
  ],
  "cosmetic-plastic": [
    "dermatology",
    "dental",
    "wellness-spas",
    "ophthalmology",
    "alternative-medicine",
    "mental-health",
  ],
  hospitals: [
    "clinics",
    "emergency-care",
    "radiology-imaging",
    "cardiology",
    "oncology",
    "orthopedics",
  ],
  clinics: [
    "hospitals",
    "dental",
    "pediatrics",
    "labs-diagnostics",
    "pharmacy",
    "dermatology",
  ],
  "labs-diagnostics": [
    "radiology-imaging",
    "clinics",
    "hospitals",
    "cardiology",
    "oncology",
    "gastroenterology",
  ],
  "radiology-imaging": [
    "labs-diagnostics",
    "orthopedics",
    "neurology",
    "oncology",
    "cardiology",
    "urology",
  ],
  pharmacy: [
    "clinics",
    "hospitals",
    "home-healthcare",
    "dermatology",
    "alternative-medicine",
    "nutrition-dietetics",
  ],
  "nutrition-dietetics": [
    "mental-health",
    "cardiology",
    "gastroenterology",
    "wellness-spas",
    "alternative-medicine",
    "ob-gyn",
  ],
  "home-healthcare": [
    "physiotherapy",
    "mental-health",
    "home-healthcare",
    "clinics",
    "pharmacy",
    "nutrition-dietetics",
  ],
  "alternative-medicine": [
    "physiotherapy",
    "wellness-spas",
    "nutrition-dietetics",
    "mental-health",
    "dermatology",
    "pediatrics",
  ],
  "wellness-spas": [
    "alternative-medicine",
    "dermatology",
    "cosmetic-plastic",
    "mental-health",
    "physiotherapy",
    "nutrition-dietetics",
  ],
  "emergency-care": [
    "hospitals",
    "orthopedics",
    "cardiology",
    "pediatrics",
    "neurology",
    "radiology-imaging",
  ],
  "medical-equipment": [
    "home-healthcare",
    "pharmacy",
    "physiotherapy",
    "orthopedics",
    "clinics",
    "hospitals",
  ],
  nephrology: [
    "urology",
    "cardiology",
    "nutrition-dietetics",
    "hospitals",
    "gastroenterology",
    "radiology-imaging",
  ],
};

/**
 * Return sibling specialty slugs for a given category. Only returns
 * entries that exist in the current CATEGORIES table. Deduped and
 * capped by `limit`.
 */
export function getRelatedSpecialties(
  categorySlug: string,
  limit = 8
): string[] {
  const seed = RELATED_SPECIALTIES[categorySlug] ?? [];
  const filtered = seed.filter(
    (s) => s !== categorySlug && KNOWN_CATEGORIES.has(s)
  );
  return Array.from(new Set(filtered)).slice(0, limit);
}

/**
 * Compile-time sanity check: every slug referenced in RELATED_SPECIALTIES
 * must exist in CATEGORIES. Throws on the first mismatch. Call from CI
 * or a future test runner.
 */
export function __selftest(): void {
  for (const [src, rels] of Object.entries(RELATED_SPECIALTIES)) {
    if (!KNOWN_CATEGORIES.has(src)) {
      throw new Error(`RELATED_SPECIALTIES key ${src} is not a known category slug`);
    }
    for (const r of rels) {
      if (!KNOWN_CATEGORIES.has(r)) {
        throw new Error(`RELATED_SPECIALTIES[${src}] references unknown slug ${r}`);
      }
    }
  }
}
