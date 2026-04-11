/**
 * Insurance facet data module.
 *
 * Provides the canonical query surface used by the city × insurer × specialty
 * tri-axial programmatic SEO pages, plus a minimum-provider-count gate for
 * thin-content suppression.
 *
 * This module is additive: it layers on top of the existing synchronous
 * `INSURANCE_PROVIDERS` constant and the async `getProvidersByInsurance` /
 * `getProviderCountByInsurance` helpers in `src/lib/data.ts`. It does NOT
 * replace them and does NOT directly query the database — all provider
 * queries go through the existing `@/lib/data` layer so caching, fallback,
 * and SQL-level JSONB filtering continue to work unchanged.
 *
 * Once the `insurance_plans` / `provider_insurance_acceptance` DB tables
 * land (see `scripts/db/migrations/2026-04-11-insurance-plans.sql`), the
 * `getInsurancePlan()` helper will be the place to union DB metadata into
 * the in-memory editorial copy. For now it returns the in-memory shape
 * only, so the migration can be applied at a later date without a code
 * change on the page layer.
 */

import { INSURANCE_PROVIDERS } from "@/lib/constants/insurance";
import type { InsuranceProvider } from "@/lib/constants/insurance";
import {
  getProvidersByInsurance,
  getProviderCountByInsurance,
  type LocalProvider,
} from "@/lib/data";
import {
  TRI_FACET_MIN_PROVIDERS as _TRI_FACET_MIN_PROVIDERS,
  DUO_FACET_MIN_PROVIDERS as _DUO_FACET_MIN_PROVIDERS,
  AREA_FACET_MIN_PROVIDERS as _AREA_FACET_MIN_PROVIDERS,
} from "@/lib/seo/facet-rules";
import {
  INSURANCE_EDITORIAL,
  INSURANCE_EDITORIAL_BY_SLUG,
  type InsuranceEditorialEntry,
  type InsuranceGeoScope,
  type InsurancePlanType,
} from "./editorial-copy";

// ─── Types ─────────────────────────────────────────────────────────────────

export interface InsurancePlan {
  slug: string;
  nameEn: string;
  nameAr?: string;
  type: InsurancePlanType;
  geoScope: InsuranceGeoScope;
  isDental: boolean;
  isMedical: boolean;
  parentPlanSlug?: string;
  editorialCopyEn: string;
  editorialCopyAr: string;
  logoUrl?: string;
  /** Source record from `src/lib/constants/insurance.ts` when matched, for back-compat with existing pages. */
  legacy?: InsuranceProvider;
}

/**
 * Minimum provider count for a tri-facet (city × specialty × insurer) page
 * to be considered non-thin. Re-exported from the centralized facet-rules
 * module so Item 1 consumers (the insurer + tri-facet pages, the
 * sitemap, and `isTriFacetEligible` below) keep working unchanged.
 * Source of truth: `src/lib/seo/facet-rules.ts` (Item 8).
 */
export const TRI_FACET_MIN_PROVIDERS = _TRI_FACET_MIN_PROVIDERS;

/**
 * Minimum provider count for a 2-facet (city × insurer) page to be indexable.
 * Re-exported from `src/lib/seo/facet-rules.ts`.
 */
export const DUO_FACET_MIN_PROVIDERS = _DUO_FACET_MIN_PROVIDERS;

/**
 * Minimum provider count for neighbourhood-level tri-facet (area × specialty × insurer).
 * Re-exported from `src/lib/seo/facet-rules.ts`. Not yet used.
 */
export const AREA_FACET_MIN_PROVIDERS = _AREA_FACET_MIN_PROVIDERS;

/**
 * Canonical editorial verification timestamp surfaced in every insurance
 * facet page body / FAQ / disclaimer. Update monthly during editorial
 * review so pages never advertise a stale "last verified" date.
 */
// Update monthly during editorial review
export const INSURANCE_DATA_VERIFIED_AT = "April 2026";

// ─── Plan lookup ───────────────────────────────────────────────────────────

// Arabic fallback — returns `undefined` so the JSON-LD `alternateName`
// is simply omitted for the ~30 insurers that are not yet in the
// editorial layer, instead of carrying the English name a second time
// (which would pollute Arabic rich results).
const legacyNameToAr = (): string | undefined => undefined;

function toPlan(entry: InsuranceEditorialEntry, legacy?: InsuranceProvider): InsurancePlan {
  return {
    slug: entry.slug,
    nameEn: entry.nameEn,
    nameAr: entry.nameAr,
    type: entry.type,
    geoScope: entry.geoScope,
    isDental: entry.isDental,
    isMedical: entry.isMedical,
    parentPlanSlug: entry.parentPlanSlug,
    editorialCopyEn: entry.editorialCopyEn,
    editorialCopyAr: entry.editorialCopyAr,
    logoUrl: entry.logoUrl,
    legacy,
  };
}

function toPlanFromLegacy(legacy: InsuranceProvider): InsurancePlan {
  // Legacy `type` is narrower than our model. "premium" (Thiqa-style
  // government programmes) is the only true `gov` plan. "mandatory"
  // covers carrier products that employers are legally required to
  // provide (Daman, Sukoon EBP, …) — they are carriers, NOT gov.
  const type: InsurancePlanType =
    legacy.type === "tpa" ? "TPA" :
    legacy.type === "premium" ? "gov" :
    "carrier";
  return {
    slug: legacy.slug,
    nameEn: legacy.name,
    nameAr: legacyNameToAr(),
    type,
    geoScope: "uae",
    isDental: false,
    isMedical: true,
    editorialCopyEn: legacy.description,
    editorialCopyAr: legacy.description,
    legacy,
  };
}

/**
 * Resolve a plan by slug, merging the editorial-copy layer over the
 * legacy `INSURANCE_PROVIDERS` constant. Returns `null` if the slug is
 * not known in either source.
 */
export function getInsurancePlan(slug: string): InsurancePlan | null {
  const legacy = INSURANCE_PROVIDERS.find((i) => i.slug === slug);
  const editorial = INSURANCE_EDITORIAL_BY_SLUG[slug];
  if (editorial) return toPlan(editorial, legacy);
  if (legacy) return toPlanFromLegacy(legacy);
  return null;
}

/**
 * Return every known insurance plan. Merges editorial-copy entries over
 * legacy constants (editorial takes precedence on collisions).
 */
export function getAllInsurancePlans(): InsurancePlan[] {
  const bySlug = new Map<string, InsurancePlan>();
  for (const legacy of INSURANCE_PROVIDERS) {
    bySlug.set(legacy.slug, toPlanFromLegacy(legacy));
  }
  for (const entry of INSURANCE_EDITORIAL) {
    const legacy = INSURANCE_PROVIDERS.find((i) => i.slug === entry.slug);
    bySlug.set(entry.slug, toPlan(entry, legacy));
  }
  return Array.from(bySlug.values());
}

/**
 * Filter plans by geographic scope. A UAE-wide plan is always returned.
 * Abu-Dhabi-only plans (e.g. Thiqa) are only returned when the emirate
 * is "abu-dhabi" or "al-ain". Pass `undefined` to return every plan.
 *
 * This is the canonical gate to prevent generating `/directory/dubai/
 * insurance/thiqa/` URLs in the sitemap.
 */
export function getInsurancePlansByGeo(emirate?: string): InsurancePlan[] {
  const all = getAllInsurancePlans();
  if (!emirate) return all;
  const e = emirate.toLowerCase();
  return all.filter((plan) => {
    if (plan.geoScope === "uae") return true;
    if (plan.geoScope === "abu-dhabi") return e === "abu-dhabi" || e === "al-ain";
    if (plan.geoScope === "dubai") return e === "dubai";
    if (plan.geoScope === "sharjah") return e === "sharjah";
    if (plan.geoScope === "northern-emirates") {
      return ["sharjah", "ajman", "ras-al-khaimah", "fujairah", "umm-al-quwain"].includes(e);
    }
    return true;
  });
}

// ─── Provider queries ─────────────────────────────────────────────────────

export interface ProvidersAcceptingInsuranceResult {
  total: number;
  providers: LocalProvider[];
}

/**
 * Canonical helper for every insurance facet page. Wraps the existing
 * `getProvidersByInsurance` DB query and additionally filters by
 * category slug in memory. Returns the total and a sorted provider
 * list (rating-first, review-count tiebreak).
 */
export async function getProvidersAcceptingInsurance(
  insurerSlug: string,
  citySlug?: string,
  categorySlug?: string,
): Promise<ProvidersAcceptingInsuranceResult> {
  const all = await getProvidersByInsurance(insurerSlug, citySlug);
  const filtered = categorySlug
    ? all.filter((p) => p.categorySlug === categorySlug)
    : all;
  const sorted = [...filtered].sort((a, b) => {
    const ratingDiff = Number(b.googleRating) - Number(a.googleRating);
    if (ratingDiff !== 0) return ratingDiff;
    return (b.googleReviewCount || 0) - (a.googleReviewCount || 0);
  });
  return { total: sorted.length, providers: sorted };
}

/**
 * Thin-content gate. Returns `true` when the tri-facet tuple
 * (insurer × city × category) has at least `TRI_FACET_MIN_PROVIDERS`
 * live matching providers, and therefore should be rendered + indexed.
 *
 * Callers below threshold should either 404, or serve `noindex,follow`
 * with a canonical to the 2-facet parent. See the 3-facet page handler.
 */
export async function isTriFacetEligible(
  insurerSlug: string,
  citySlug: string,
  categorySlug: string,
): Promise<boolean> {
  // Geo gate first — avoids an unnecessary DB hit for Thiqa/Dubai etc.
  const plan = getInsurancePlan(insurerSlug);
  if (!plan) return false;
  const geoOk = getInsurancePlansByGeo(citySlug).some((p) => p.slug === insurerSlug);
  if (!geoOk) return false;

  const { total } = await getProvidersAcceptingInsurance(insurerSlug, citySlug, categorySlug);
  return total >= TRI_FACET_MIN_PROVIDERS;
}

/**
 * Lightweight count-only gate for the 2-facet (city × insurer) page.
 * Uses the existing `getProviderCountByInsurance` DB query so there is
 * no additional schema requirement.
 */
export async function isDuoFacetEligible(
  insurerSlug: string,
  citySlug: string,
): Promise<boolean> {
  const plan = getInsurancePlan(insurerSlug);
  if (!plan) return false;
  const geoOk = getInsurancePlansByGeo(citySlug).some((p) => p.slug === insurerSlug);
  if (!geoOk) return false;
  const count = await getProviderCountByInsurance(insurerSlug, citySlug);
  return count >= DUO_FACET_MIN_PROVIDERS;
}

// ─── Sibling insurers (for internal linking strip) ────────────────────────

/**
 * Default popularity ordering used when ranking sibling insurers. Based on
 * UAE market share and Zavis-internal provider coverage. Keep this in sync
 * with the list in `/directory/[city]/insurance/[insurer]/page.tsx` — we
 * extracted it here so both 2-facet and 3-facet pages share one source.
 */
const POPULAR_SLUGS = [
  "daman", "daman-enhanced", "daman-basic",
  "axa", "cigna", "bupa", "aetna", "allianz",
  "oman-insurance", "orient", "adnic", "hayah", "nas", "mednet",
  "dic", "takaful-emarat", "salama", "thiqa",
];

/**
 * Return up to `limit` sibling insurers for a given city, excluding the
 * one the current page is for. The list is filtered by geographic scope
 * (so Thiqa is never suggested outside Abu Dhabi / Al Ain) and ordered
 * by the hardcoded popularity list, with any remaining plans appended
 * alphabetically.
 */
export function getSiblingInsurersForCity(
  citySlug: string,
  excludeSlug?: string,
  limit = 6,
): InsurancePlan[] {
  const eligible = getInsurancePlansByGeo(citySlug).filter((p) => p.slug !== excludeSlug);
  const popularityIndex = new Map(POPULAR_SLUGS.map((slug, i) => [slug, i]));
  const ranked = [...eligible].sort((a, b) => {
    const ai = popularityIndex.has(a.slug) ? (popularityIndex.get(a.slug) ?? 999) : 999;
    const bi = popularityIndex.has(b.slug) ? (popularityIndex.get(b.slug) ?? 999) : 999;
    if (ai !== bi) return ai - bi;
    return a.nameEn.localeCompare(b.nameEn);
  });
  return ranked.slice(0, limit);
}
