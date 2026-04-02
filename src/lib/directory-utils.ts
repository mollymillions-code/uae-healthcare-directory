/**
 * Shared utilities for English and Arabic directory catch-all pages.
 * Extracted to prevent logic drift between the two implementations.
 */
import {
  getCategoryBySlug,
  getAreaBySlug,
  getSubcategoriesByCategory,
  getProviderBySlug,
} from "@/lib/data";

// ── Category Image Mapping ─────────────────────────────────────────

const CATEGORY_IMAGE_MAP: Record<string, string> = {
  hospitals: "hospitals",
  clinics: "clinics",
  dental: "dental",
  dermatology: "dermatology",
  ophthalmology: "ophthalmology",
  cardiology: "cardiology",
  orthopedics: "orthopedics",
  "mental-health": "mental-health",
  pediatrics: "pediatrics",
  "ob-gyn": "obstetrics-gynecology",
  ent: "ent",
  "fertility-ivf": "fertility",
  physiotherapy: "physiotherapy",
  pharmacy: "pharmacy",
  "labs-diagnostics": "laboratory",
  "radiology-imaging": "radiology",
  "home-healthcare": "home-healthcare",
  "alternative-medicine": "alternative-medicine",
  neurology: "neurology",
  urology: "urology",
  gastroenterology: "gastroenterology",
  oncology: "oncology",
  "emergency-care": "hospitals",
};

export function getCategoryImageUrl(categorySlug: string, base: string): string {
  const file = CATEGORY_IMAGE_MAP[categorySlug] || "clinics";
  return `${base}/images/categories/${file}.webp`;
}

// ── Operating Hours Validation ──────────────────────────────────────

export function hasValidHours(
  hours: Record<string, { open: string; close: string }> | null | undefined
): hours is Record<string, { open: string; close: string }> {
  if (!hours) return false;
  const entries = Object.entries(hours);
  return entries.length > 0 && entries.some(([, h]) => h && h.open && h.close);
}

// ── Date Formatting ─────────────────────────────────────────────────

export function formatVerifiedDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function formatVerifiedDateAr(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("ar-AE", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

// ── Day Name Constants ──────────────────────────────────────────────

export const DAY_NAMES_EN: Record<string, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

// ── Segment Resolution ──────────────────────────────────────────────

/**
 * Resolve URL segments into a typed route descriptor.
 *
 * Supported patterns:
 * 1. /directory/{city}/{category}                  -> city-category
 * 2. /directory/{city}/{area}                      -> city-area
 * 3. /directory/{city}/{area}/{category}           -> area-category
 * 4. /directory/{city}/{category}/{listing}        -> listing
 * 5. /directory/{city}/{area}/{category}/{listing} -> listing (via area path)
 * 6. /directory/{city}/{category}/{subcategory}    -> city-category-subcategory (EN only)
 * 7. /directory/{city}/{area}/insurance             -> area-insurance (EN only)
 */
export async function resolveSegments(citySlug: string, segments: string[]) {
  const [seg1, seg2, seg3] = segments;

  if (segments.length === 1) {
    const category = getCategoryBySlug(seg1);
    if (category) return { type: "city-category" as const, category };
    const area = getAreaBySlug(citySlug, seg1);
    if (area) return { type: "city-area" as const, area };
    return null;
  }

  if (segments.length === 2) {
    const cat1 = getCategoryBySlug(seg1);
    if (cat1) {
      const provider = await getProviderBySlug(seg2);
      if (provider) return { type: "listing" as const, category: cat1, provider };
      const subcats = getSubcategoriesByCategory(cat1.slug);
      const sub = subcats.find((s) => s.slug === seg2);
      if (sub)
        return {
          type: "city-category-subcategory" as const,
          category: cat1,
          subcategory: sub,
        };
      return null;
    }

    const area = getAreaBySlug(citySlug, seg1);
    if (area) {
      if (seg2 === "insurance") return { type: "area-insurance" as const, area };
      const cat2 = getCategoryBySlug(seg2);
      if (cat2) return { type: "area-category" as const, area, category: cat2 };
      return null;
    }
    return null;
  }

  if (segments.length === 3) {
    const area = getAreaBySlug(citySlug, seg1);
    const cat = getCategoryBySlug(seg2);
    const provider = await getProviderBySlug(seg3);
    if (area && cat && provider)
      return { type: "listing" as const, area, category: cat, provider };
    return null;
  }

  return null;
}
