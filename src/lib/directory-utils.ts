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
  "nephrology": "nephrology",
  "medical-equipment": "medical-equipment",
  "endocrinology": "endocrinology",
  "pulmonology": "pulmonology",
  "nutrition-dietetics": "clinics",
  "cosmetic-plastic": "dermatology",
  "wellness-spas": "alternative-medicine",
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

// ── Hours Formatting Helpers ──────────────────────────────────────
//
// Provider operating_hours data in the DB comes from multiple legacy scrapers
// and is inconsistent. Values observed in the wild:
//   - 24-hour:        "00:00" / "23:59"
//   - 12-hour w/ sp:  "12:00 AM" / "11:59 PM"
//   - range in open:  "9:00 AM – 1:00 PM"  (broken scrape, whole range in one field)
//   - missing:        null / undefined / ""
// This helper accepts any of those and returns a clean display string.

/**
 * Returns `true` if the open/close pair represents 24-hour operation.
 * Handles both 24-hour ("00:00" / "23:59") and 12-hour ("12:00 AM" / "11:59 PM")
 * representations, which both exist in the DB.
 */
export function isTwentyFourHours(
  open: string | undefined,
  close: string | undefined
): boolean {
  if (!open || !close) return false;
  const o = open.trim().toLowerCase().replace(/\s+/g, " ");
  const c = close.trim().toLowerCase().replace(/\s+/g, " ");
  if (o === "00:00" && (c === "23:59" || c === "24:00")) return true;
  if (o === "12:00 am" && (c === "11:59 pm" || c === "12:00 am")) return true;
  if (o === "0:00" && c === "23:59") return true;
  return false;
}

/**
 * Format a day's open/close pair as a short display string.
 * "24 hours" if round-the-clock, otherwise "{open}–{close}".
 * Returns empty string if either side is missing or invalid.
 */
export function formatHoursRange(
  open: string | undefined,
  close: string | undefined
): string {
  if (!open || !close) return "";
  if (isTwentyFourHours(open, close)) return "24 hours";
  return `${open}–${close}`;
}

// ── Day Name Constants ──────────────────────────────────────────────
//
// Provider `operating_hours` keys in the DB are inconsistent — the legacy
// scrape stored them as full English names ("Monday", "Tuesday", ...), while
// newer enrichment paths use 3-letter lowercase ("mon", "tue", ...). The
// lookup below must cover both forms because `DAY_NAMES[rawKey]` is used
// directly in JSON-LD FAQPage answer strings. If the lookup returns
// undefined we ship the literal word "undefined" into Google's rich results
// (seen in QA Round 3 on al-yalayis-fitness-medical-center-dip-dubai where
// the schedule answer read "undefined: 12:00 AM–11:59 PM" seven times).
// Keep this map exhaustive.

export const DAY_NAMES_EN: Record<string, string> = {
  // 3-letter lowercase (current pipeline)
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
  // Full English (legacy scrape output)
  Monday: "Monday",
  Tuesday: "Tuesday",
  Wednesday: "Wednesday",
  Thursday: "Thursday",
  Friday: "Friday",
  Saturday: "Saturday",
  Sunday: "Sunday",
  // Lowercase full English (defensive)
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
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
 * 8. /directory/{city}/{procedure}                  -> city-service (flat service URL)
 */
export async function resolveSegments(citySlug: string, segments: string[]) {
  const [seg1, seg2, seg3] = segments;

  if (segments.length === 1) {
    const category = getCategoryBySlug(seg1);
    if (category) return { type: "city-category" as const, category };
    const area = getAreaBySlug(citySlug, seg1);
    if (area) return { type: "city-area" as const, area };
    // Check if it's a procedure/service slug
    try {
      const { getProcedureBySlug } = await import("@/lib/constants/procedures");
      const procedure = getProcedureBySlug(seg1);
      if (procedure && procedure.cityPricing[citySlug]) {
        return { type: "city-service" as const, procedure };
      }
    } catch { /* procedures module not available */ }
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
