/**
 * Single source of truth for medication-pharmacy page indexability.
 *
 * Per docs/playbooks/medication-pharmacy-intent-graph-execution-spec.md §13:
 *
 *   "Create one shared gating module for this surface… That module should
 *    decide page creation eligibility, canonical target, robots index/follow,
 *    and sitemap inclusion. Do NOT let page templates decide these
 *    independently."
 *
 * This module is imported by:
 *   - /medications/[generic] page (robots decision)
 *   - /brands/[brand] page (robots + canonical decision)
 *   - /medication-classes/[class] page (robots decision)
 *   - sitemap.ts (sitemap inclusion)
 *
 * The pattern mirrors src/lib/sitemap-gating.ts for provider pages.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export interface MedicationGatingInput {
  pageState?: string | null; // "canonical" | "secondary" | "not-generated"
  status?: string | null; // "active" | "inactive"
  shortDescription?: string | null;
  isHighIntent?: boolean | null;
}

export interface BrandGatingInput extends MedicationGatingInput {
  isCanonicalBrand?: boolean | null;
  genericSlug?: string | null;
}

export interface MedicationClassGatingInput {
  status?: string | null;
  shortDescription?: string | null;
}

// ─── Gating decisions ───────────────────────────────────────────────────────

export interface GatingDecision {
  /** Should this page be rendered at all? */
  exists: boolean;
  /** Should Google index this page? */
  index: boolean;
  /** Should Google follow links on this page? Always true — preserves link equity. */
  follow: boolean;
  /** Should this page appear in the XML sitemap? */
  sitemap: boolean;
  /** Canonical URL override. Null = self-canonical. */
  canonicalOverride: string | null;
}

/**
 * Gate a generic medication page (/medications/[generic]).
 *
 * A medication page is indexable when:
 *   - pageState is "canonical" (not "secondary" or "not-generated")
 *   - status is "active"
 *   - it has a non-empty shortDescription (thin-content guard)
 */
export function gateMedicationPage(med: MedicationGatingInput): GatingDecision {
  const active = (med.status ?? "active") === "active";
  const canonical = (med.pageState ?? "canonical") === "canonical";
  const hasContent = Boolean(
    med.shortDescription && med.shortDescription.trim().length > 10
  );

  const exists = active && canonical;
  const index = exists && hasContent;

  return {
    exists,
    index,
    follow: true,
    sitemap: index,
    canonicalOverride: null,
  };
}

/**
 * Gate a brand page (/brands/[brand]).
 *
 * Per spec §12.1: "Generic should usually be canonical."
 * Brand pages self-canonicalize ONLY when isCanonicalBrand is true
 * (i.e. the brand has meaningful independent search demand — Ozempic,
 * Panadol, etc.). Otherwise they canonicalize to the generic page.
 */
export function gateBrandPage(
  brand: BrandGatingInput,
  baseUrl: string
): GatingDecision {
  const active = (brand.status ?? "active") === "active";
  const canonical = (brand.pageState ?? "canonical") === "canonical";
  const hasContent = Boolean(
    brand.shortDescription && brand.shortDescription.trim().length > 10
  );
  const selfCanonical = Boolean(brand.isCanonicalBrand);

  const exists = active && canonical;
  const index = exists && hasContent && selfCanonical;

  return {
    exists,
    index,
    follow: true,
    sitemap: index,
    // Non-self-canonical brands point to the generic medication page
    canonicalOverride:
      exists && !selfCanonical && brand.genericSlug
        ? `${baseUrl}/medications/${brand.genericSlug}`
        : null,
  };
}

/**
 * Gate a medication class page (/medication-classes/[class]).
 *
 * Class pages are always indexable when active and have content.
 */
export function gateMedicationClassPage(
  cls: MedicationClassGatingInput
): GatingDecision {
  const active = (cls.status ?? "active") !== "inactive";
  const hasContent = Boolean(
    cls.shortDescription && cls.shortDescription.trim().length > 5
  );

  const exists = active;
  const index = exists && hasContent;

  return {
    exists,
    index,
    follow: true,
    sitemap: index,
    canonicalOverride: null,
  };
}
