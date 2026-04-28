/**
 * Centralized facet-policy rule engine for Zavis SEO.
 *
 * Single source of truth for:
 *   - The allowlist of indexable URL combinations
 *   - Minimum-inventory ("thin-content") thresholds per combination type
 *   - Prevention of 4+ facet crawl states
 *   - Separation between UX filters and indexable SEO landings
 *   - Canonical target for every allowed combination
 *
 * This module exists to stop the ad-hoc allow-lists scattered across the
 * codebase from drifting apart. Prior to Item 8, the following constants
 * were defined in three different files:
 *
 *   - `TRI_FACET_INSURER_ALLOW`  (sitemap.ts)
 *   - `TRI_FACET_CATEGORY_ALLOW` (sitemap.ts)
 *   - `DEEP_PAGINATION_CITY_CATEGORY_ALLOW` (sitemap.ts)
 *   - `TRI_FACET_MIN_PROVIDERS`  (insurance-facets/data.ts)
 *   - `DUO_FACET_MIN_PROVIDERS`  (insurance-facets/data.ts)
 *   - `AREA_FACET_MIN_PROVIDERS` (insurance-facets/data.ts)
 *
 * They now live here. `src/lib/insurance-facets/data.ts` re-exports the
 * min-provider-count constants from this module so Item 1 consumers
 * (`isTriFacetEligible`, `isDuoFacetEligible`, the insurer page, the
 * tri-facet page) keep working unchanged.
 *
 * Consumers:
 *   - `src/app/sitemap.ts` — sitemap generation + allow-listing
 *   - `src/app/(directory)/directory/[city]/[...segments]/page.tsx`
 *     (runtime gating via `evaluateCombo`)
 *   - `src/app/(directory)/directory/[city]/insurance/[insurer]/[category]/page.tsx`
 *     (Item 1 tri-facet runtime gate)
 *   - `src/app/(directory)/find-a-doctor/[specialty]/[doctor]/page.tsx`
 *     (Item 0.75 doctor profile route, once landed)
 *
 * Discipline absorbed from Codex Rec 6 + the Zocdoc brutal action plan:
 *   - Allowlist-based — everything not on the list is a filter state, not
 *     an indexable page.
 *   - Max 3 facets per indexable URL. Language is DISJOINT from insurance
 *     (Zocdoc convention — never cross `language × insurance`).
 *   - Every indexable combo has an explicit parent to canonical to when
 *     it falls below the min-provider threshold.
 *   - Min-provider counts are enforced at runtime by `evaluateCombo`.
 *     The sitemap uses the same thresholds statically so the two layers
 *     agree on what "thin" means.
 *
 * This module has NO runtime behaviour change vs. the pre-refactor code.
 * Every consumer gets the same allow-list values, just from a different
 * import path.
 */

import { getConditionDetail } from "@/lib/constants/condition-specialty-map";
import {
  getProviderCountByCity,
  getProviderCountByCategory,
  getProviderCountByCategoryAndCity,
  getProviderCountByAreaAndCity,
  getProviderCountByInsurance,
  getProviderCountByInsuranceCategory,
  getProviderCountByLanguage,
} from "@/lib/data";

// ─── Types ──────────────────────────────────────────────────────────────────

/**
 * Every facet dimension Zavis knows about. Only the combinations in
 * `FACET_RULES` below are considered indexable — everything else is a
 * runtime filter state that should never be emitted in the sitemap or
 * served with `index,follow`.
 */
export type FacetKind =
  | "city"
  | "specialty"
  | "category"
  | "area"
  | "insurance"
  | "language"
  | "condition"
  | "gender"
  | "procedure";

/**
 * A combination of facets, always stored in canonical order. Use
 * `normalizeCombo` to sort a user-supplied array before doing a lookup.
 */
export type FacetCombo = FacetKind[];

export interface FacetRule {
  /** Combo (canonically ordered via `normalizeCombo`). */
  combo: FacetCombo;
  /** Whether Zavis ever emits this URL with `index,follow`. */
  indexable: boolean;
  /**
   * Minimum matching provider count for the page to be rendered as a
   * non-thin SEO landing. Pages below this threshold may still render,
   * but must emit `noindex,follow` + canonical to `parentCombo`.
   */
  minProviderCount: number;
  /** Human-readable URL pattern for docs + the audit report. */
  urlPattern: string;
  /**
   * How the canonical tag is computed for this combo:
   *   - "self"    — self-canonical when eligible
   *   - "parent"  — always canonical to the `parentCombo` URL
   *   - "noindex" — never indexable (filter state)
   */
  canonicalStrategy: "self" | "parent" | "noindex";
  /** Parent combo to canonical back to when this page is thin or non-indexable. */
  parentCombo?: FacetCombo;
  /** Free-form notes for the audit report. */
  notes?: string;
}

// ─── Canonical facet ordering ──────────────────────────────────────────────

/**
 * Canonical ordering for `FacetKind`. Combos are always stored with
 * facets in this order so `getRule` can use a string key lookup.
 *
 * Ordering intuition: spatial → taxonomy → filter → attribute.
 * Changing this order is a breaking change for `normalizeCombo` callers
 * — update the tests (see `__selftest`) alongside any modifications.
 */
const FACET_ORDER: Record<FacetKind, number> = {
  city: 0,
  area: 1,
  specialty: 2,
  category: 3,
  procedure: 4,
  condition: 5,
  insurance: 6,
  language: 7,
  gender: 8,
};

export function normalizeCombo(combo: FacetKind[]): FacetCombo {
  return [...combo].sort((a, b) => FACET_ORDER[a] - FACET_ORDER[b]);
}

function comboKey(combo: FacetKind[]): string {
  return normalizeCombo(combo).join("|");
}

// ─── Min-provider-count thresholds ─────────────────────────────────────────

/**
 * Minimum provider count for a tri-facet (city × specialty × insurer) page
 * to be considered non-thin. Previously lived in
 * `src/lib/insurance-facets/data.ts` — that file now re-exports this
 * constant for backward compatibility with Item 1 consumers.
 */
export const TRI_FACET_MIN_PROVIDERS = 5;

/** Minimum provider count for a 2-facet (city × insurer) page to be indexable. */
export const DUO_FACET_MIN_PROVIDERS = 5;

/** Minimum provider count for neighbourhood-level tri-facet (area × specialty). */
export const AREA_FACET_MIN_PROVIDERS = 3;

/** Minimum provider count for a 1-facet hub (city, specialty, insurance). */
export const HUB_FACET_MIN_PROVIDERS = 10;

// ─── Allowlists (centralized from sitemap.ts) ─────────────────────────────

/**
 * The 6 payer slugs that actually have long-form editorial copy in
 * `src/lib/insurance-facets/editorial-copy.ts` and are therefore
 * allowed to appear in tri-facet (city × insurer × specialty) URLs.
 * Any slug added to that editorial file must also be added here.
 */
export const TRI_FACET_INSURER_ALLOW: ReadonlySet<string> = new Set([
  "thiqa",
  "daman-enhanced",
  "daman-basic",
  "hayah",
  "adnic",
  "oman-insurance",
]);

/**
 * The 8 evergreen specialties that tri-facet URLs are allowed to use.
 * These match the top-inventory categories across all emirates and
 * have enough provider coverage to reliably clear
 * `TRI_FACET_MIN_PROVIDERS` for the payers in `TRI_FACET_INSURER_ALLOW`.
 */
export const TRI_FACET_CATEGORY_ALLOW: ReadonlySet<string> = new Set([
  "hospitals",
  "clinics",
  "dentists",
  "dermatologists",
  "pediatricians",
  "gynecologists",
  "ophthalmologists",
  "cardiologists",
]);

/**
 * Deep-pagination allow-list: city × category tuples that get
 * `?page=2..DEEP_PAGINATION_MAX_PAGE` URLs in the sitemap so Googlebot
 * has a crawl path to long-tail providers. Rule: only include tuples
 * with well over 20 providers per page — the runtime SSR 404s past-end
 * pages so over-inclusion is self-correcting.
 */
export const DEEP_PAGINATION_MAX_PAGE = 5;

export interface DeepPaginationCityEntry {
  citySlug: string;
  categorySlugs: string[];
}

export const DEEP_PAGINATION_CITY_CATEGORY_ALLOW: readonly DeepPaginationCityEntry[] = [
  {
    citySlug: "dubai",
    categorySlugs: [
      "hospitals", "clinics", "dentists", "dermatologists",
      "pediatricians", "gynecologists", "ophthalmologists", "cardiologists",
      "orthopedics", "ent-specialists", "pharmacies", "medical-centers",
      "physiotherapy-centers", "psychiatrists", "urologists",
    ],
  },
  {
    citySlug: "abu-dhabi",
    categorySlugs: [
      "hospitals", "clinics", "dentists", "dermatologists",
      "pediatricians", "gynecologists", "ophthalmologists", "cardiologists",
      "pharmacies", "medical-centers",
    ],
  },
  {
    citySlug: "sharjah",
    categorySlugs: [
      "hospitals", "clinics", "dentists", "pharmacies", "medical-centers",
    ],
  },
  {
    citySlug: "al-ain",
    categorySlugs: ["hospitals", "clinics", "dentists", "pharmacies"],
  },
  {
    citySlug: "ajman",
    categorySlugs: ["hospitals", "clinics", "dentists"],
  },
];

// ─── The rule table ────────────────────────────────────────────────────────

/**
 * FACET_RULES is the authoritative list of indexable URL combinations
 * for Zavis. Every combo used by a real page OR by the sitemap is
 * described here — even the non-indexable ones, so the audit report
 * can enumerate "this combo exists as a filter state and is
 * intentionally noindex".
 *
 * When adding a new page class:
 *   1. Add its combo here with `indexable: true` and an explicit
 *      `minProviderCount`.
 *   2. Add a test case in `__selftest` to assert the rule is resolvable.
 *   3. Update the audit doc at `docs/seo/facet-audit-2026-04-11.md`.
 */
export const FACET_RULES: FacetRule[] = [
  // ─── 1-facet hubs ───────────────────────────────────────────────────────
  {
    combo: normalizeCombo(["city"]),
    indexable: true,
    minProviderCount: HUB_FACET_MIN_PROVIDERS,
    urlPattern: "/directory/[city]",
    canonicalStrategy: "self",
    notes: "Every UAE emirate city has its own hub. Never falls below threshold.",
  },
  {
    combo: normalizeCombo(["specialty"]),
    indexable: true,
    minProviderCount: HUB_FACET_MIN_PROVIDERS,
    urlPattern: "/directory/top/[category]",
    canonicalStrategy: "self",
    notes: "Top-level specialty hub, implemented via `/directory/top/[category]`.",
  },
  {
    combo: normalizeCombo(["category"]),
    indexable: true,
    minProviderCount: HUB_FACET_MIN_PROVIDERS,
    urlPattern: "/directory/top/[category]",
    canonicalStrategy: "self",
    notes: "Alias of specialty — category is the internal taxonomy name.",
  },
  {
    combo: normalizeCombo(["insurance"]),
    indexable: true,
    minProviderCount: HUB_FACET_MIN_PROVIDERS,
    urlPattern: "/insurance/[insurer]",
    canonicalStrategy: "self",
    notes: "Insurer profile hub (not nested under a city).",
  },

  // ─── 2-facet — primary SEO surfaces ─────────────────────────────────────
  {
    combo: normalizeCombo(["city", "specialty"]),
    indexable: true,
    minProviderCount: DUO_FACET_MIN_PROVIDERS,
    urlPattern: "/directory/[city]/[category]",
    canonicalStrategy: "self",
    parentCombo: normalizeCombo(["city"]),
  },
  {
    combo: normalizeCombo(["city", "category"]),
    indexable: true,
    minProviderCount: DUO_FACET_MIN_PROVIDERS,
    urlPattern: "/directory/[city]/[category]",
    canonicalStrategy: "self",
    parentCombo: normalizeCombo(["city"]),
    notes: "Alias of city+specialty.",
  },
  {
    combo: normalizeCombo(["city", "insurance"]),
    indexable: true,
    minProviderCount: DUO_FACET_MIN_PROVIDERS,
    urlPattern: "/directory/[city]/insurance/[insurer]",
    canonicalStrategy: "self",
    parentCombo: normalizeCombo(["insurance"]),
    notes:
      "Item 1 — runtime gate via `isDuoFacetEligible`. Thiqa geo-gated to AD/Al Ain.",
  },
  {
    combo: normalizeCombo(["city", "area"]),
    indexable: true,
    minProviderCount: AREA_FACET_MIN_PROVIDERS,
    urlPattern: "/directory/[city]/[area]",
    canonicalStrategy: "self",
    parentCombo: normalizeCombo(["city"]),
  },
  {
    combo: normalizeCombo(["city", "language"]),
    indexable: true,
    minProviderCount: DUO_FACET_MIN_PROVIDERS,
    urlPattern: "/directory/[city]/language/[lang]",
    canonicalStrategy: "self",
    parentCombo: normalizeCombo(["city"]),
  },
  {
    combo: normalizeCombo(["city", "condition"]),
    indexable: true,
    minProviderCount: DUO_FACET_MIN_PROVIDERS,
    urlPattern: "/directory/[city]/condition/[condition]",
    canonicalStrategy: "self",
    parentCombo: normalizeCombo(["city"]),
  },
  {
    combo: normalizeCombo(["city", "procedure"]),
    indexable: true,
    minProviderCount: DUO_FACET_MIN_PROVIDERS,
    urlPattern: "/directory/[city]/procedures/[procedure]",
    canonicalStrategy: "self",
    parentCombo: normalizeCombo(["city"]),
  },

  // ─── 3-facet — combinatoric, aggressively gated ────────────────────────
  {
    combo: normalizeCombo(["city", "specialty", "insurance"]),
    indexable: true,
    minProviderCount: TRI_FACET_MIN_PROVIDERS,
    urlPattern: "/directory/[city]/insurance/[insurer]/[category]",
    canonicalStrategy: "self",
    parentCombo: normalizeCombo(["city", "insurance"]),
    notes:
      "Item 1 — runtime gate via `isTriFacetEligible`. Allow-list-filtered in sitemap. Only 6 payers × 8 specialties × geo-eligible cities.",
  },
  {
    combo: normalizeCombo(["city", "area", "specialty"]),
    indexable: true,
    minProviderCount: AREA_FACET_MIN_PROVIDERS,
    urlPattern: "/directory/[city]/[area]/[category]",
    canonicalStrategy: "self",
    parentCombo: normalizeCombo(["city", "specialty"]),
  },
  {
    combo: normalizeCombo(["city", "language", "specialty"]),
    indexable: true,
    minProviderCount: DUO_FACET_MIN_PROVIDERS,
    urlPattern: "/directory/[city]/language/[lang]/[category]",
    canonicalStrategy: "self",
    parentCombo: normalizeCombo(["city", "language"]),
    notes:
      "Language × specialty is allowed; language × insurance is NOT (Zocdoc convention — language is disjoint from insurance).",
  },

  // ─── Non-indexable filter states ────────────────────────────────────────
  {
    combo: normalizeCombo(["city", "specialty", "insurance", "language"]),
    indexable: false,
    minProviderCount: 0,
    urlPattern: "(filter state)",
    canonicalStrategy: "noindex",
    parentCombo: normalizeCombo(["city", "specialty", "insurance"]),
    notes: "4-facet — exceeds cap. Zocdoc keeps language disjoint from insurance.",
  },
  {
    combo: normalizeCombo(["city", "area", "insurance"]),
    indexable: false,
    minProviderCount: 0,
    urlPattern: "(filter state)",
    canonicalStrategy: "noindex",
    parentCombo: normalizeCombo(["city", "insurance"]),
    notes: "Too thin to reliably clear the min-provider threshold. Filter only.",
  },
  {
    combo: normalizeCombo(["city", "area", "insurance", "language"]),
    indexable: false,
    minProviderCount: 0,
    urlPattern: "(filter state)",
    canonicalStrategy: "noindex",
    parentCombo: normalizeCombo(["city", "insurance"]),
    notes: "4-facet — exceeds cap.",
  },
  {
    combo: normalizeCombo(["city", "condition", "insurance"]),
    indexable: false,
    minProviderCount: 0,
    urlPattern: "(filter state)",
    canonicalStrategy: "noindex",
    parentCombo: normalizeCombo(["city", "condition"]),
    notes: "Condition × insurance is too thin — condition maps to category aggregate.",
  },
  {
    combo: normalizeCombo(["city", "area", "insurance", "specialty"]),
    indexable: false,
    minProviderCount: 0,
    urlPattern: "(filter state)",
    canonicalStrategy: "noindex",
    parentCombo: normalizeCombo(["city", "specialty", "insurance"]),
    notes: "4-facet — exceeds cap.",
  },
];

// ─── Lookup + convenience helpers ──────────────────────────────────────────

const RULES_BY_KEY: Map<string, FacetRule> = (() => {
  const m = new Map<string, FacetRule>();
  for (const rule of FACET_RULES) {
    m.set(comboKey(rule.combo), rule);
  }
  return m;
})();

/** Look up the rule for a given combo. Returns `null` if no rule exists. */
export function getRule(combo: FacetCombo): FacetRule | null {
  return RULES_BY_KEY.get(comboKey(combo)) ?? null;
}

/**
 * Is this combo allowed to emit an indexable URL? Combos with no rule
 * at all return `false` (allow-list-based — unknown combos are rejected).
 */
export function isIndexableCombo(combo: FacetCombo): boolean {
  const rule = getRule(combo);
  return rule?.indexable === true;
}

/** Minimum provider count for a combo. Returns `0` for unknown combos. */
export function minProviderCountFor(combo: FacetCombo): number {
  const rule = getRule(combo);
  return rule?.minProviderCount ?? 0;
}

/**
 * Build a concrete URL for a given combo + facet values. Returns an
 * absolute URL using `baseUrl` (pass the site origin, not a relative
 * path). Returns `null` if the combo is unknown or a required value is
 * missing.
 *
 * Naming note: Zavis already has two URL conventions for the same
 * abstract combo (e.g. `/directory/[city]/insurance/[insurer]` vs.
 * `/insurance/[insurer]` for the bare insurance hub). This helper
 * follows the `urlPattern` declared in the rule, so callers get the
 * canonical URL for the *indexable* form of the combo, not a filter
 * state shape.
 */
export function canonicalUrlFor(
  combo: FacetCombo,
  values: Partial<Record<FacetKind, string>>,
  baseUrl: string,
): string | null {
  const rule = getRule(combo);
  if (!rule) return null;
  const path = interpolateUrlPattern(rule.urlPattern, values);
  if (path == null) return null;
  return `${baseUrl.replace(/\/$/, "")}${path}`;
}

/**
 * Build the parent URL for a combo — i.e. the URL that a thin/noindex
 * page should canonical back to. Returns `null` if the rule has no
 * parent or the required facet values are missing.
 */
export function parentUrlFor(
  combo: FacetCombo,
  values: Partial<Record<FacetKind, string>>,
  baseUrl: string,
): string | null {
  const rule = getRule(combo);
  if (!rule || !rule.parentCombo) return null;
  return canonicalUrlFor(rule.parentCombo, values, baseUrl);
}

function interpolateUrlPattern(
  pattern: string,
  values: Partial<Record<FacetKind, string>>,
): string | null {
  // Map pattern tokens to facet keys. The URL pattern uses route-style
  // tokens that don't always match the FacetKind name (e.g. `[lang]`
  // for `language`, `[insurer]` for `insurance`). We special-case the
  // known tokens and fall back to the token name otherwise.
  const substitutions: Record<string, FacetKind> = {
    "[city]": "city",
    "[area]": "area",
    "[category]": "category",
    "[specialty]": "specialty",
    "[insurer]": "insurance",
    "[lang]": "language",
    "[condition]": "condition",
    "[procedure]": "procedure",
    "[gender]": "gender",
  };
  let out = pattern;
  for (const [token, kind] of Object.entries(substitutions)) {
    if (!out.includes(token)) continue;
    // `category` and `specialty` both resolve to the same URL slot in
    // the Zavis routes, so fall back across the pair when one is
    // missing.
    const value =
      values[kind] ??
      (kind === "specialty" ? values.category : undefined) ??
      (kind === "category" ? values.specialty : undefined);
    if (!value) return null;
    out = out.replace(token, value);
  }
  return out;
}

// ─── Provider-count wrapper ────────────────────────────────────────────────

/**
 * Resolve the provider count for a given combo via existing `@/lib/data`
 * helpers. Caching is provided by the underlying helpers (they use the
 * `setCache`/`getCached` wrappers already present in `data.ts`), so we
 * don't add another layer here.
 *
 * Combos with no supported count query return `0`. This is intentional:
 * the runtime gate in `evaluateCombo` treats unknown combos as thin
 * content and refuses to index them.
 */
export async function getProviderCountForCombo(
  combo: FacetCombo,
  values: Partial<Record<FacetKind, string>>,
): Promise<number> {
  const key = comboKey(combo);
  const citySlug = values.city;
  const specialtySlug = values.specialty ?? values.category;
  const areaSlug = values.area;
  const insurerSlug = values.insurance;
  const languageSlug = values.language;

  switch (key) {
    case "city":
      return citySlug ? getProviderCountByCity(citySlug) : 0;
    case "specialty":
    case "category":
      return specialtySlug ? getProviderCountByCategory(specialtySlug) : 0;
    case "city|specialty":
    case "city|category":
      return citySlug && specialtySlug
        ? getProviderCountByCategoryAndCity(specialtySlug, citySlug)
        : 0;
    case "city|area":
      return citySlug && areaSlug
        ? getProviderCountByAreaAndCity(areaSlug, citySlug)
        : 0;
    case "city|insurance":
      return citySlug && insurerSlug
        ? getProviderCountByInsurance(insurerSlug, citySlug)
        : 0;
    case "city|language":
      return citySlug && languageSlug
        ? getProviderCountByLanguage(languageSlug, citySlug)
        : 0;
    case "city|specialty|insurance":
    case "city|category|insurance": {
      if (!citySlug || !insurerSlug || !specialtySlug) return 0;
      return getProviderCountByInsuranceCategory(
        insurerSlug,
        citySlug,
        specialtySlug,
      );
    }
    case "city|condition": {
      // A condition maps to N specialties via condition-specialty-map.
      // Count providers across all mapped specialties in the city.
      const conditionSlug = values.condition;
      if (!citySlug || !conditionSlug) return 0;
      const detail = getConditionDetail(conditionSlug);
      if (!detail || !detail.specialties || detail.specialties.length === 0) {
        return 0;
      }
      // Aggregate in parallel; de-dup not needed since facet-rules is a
      // coarse gate — overlap between specialties is negligible for
      // thin-content purposes.
      const counts = await Promise.all(
        detail.specialties.map((catSlug) =>
          getProviderCountByCategoryAndCity(catSlug, citySlug),
        ),
      );
      return counts.reduce((sum, n) => sum + n, 0);
    }
    // Unsupported combos — runtime gate treats them as thin.
    default:
      return 0;
  }
}

// ─── Runtime gate ──────────────────────────────────────────────────────────

export interface EvaluateComboResult {
  /** True when the page may be indexed as-is. */
  allowed: boolean;
  /**
   * Machine-readable reason when `allowed` is false. One of:
   *   - "unknown_combo"   — not in the rule table
   *   - "not_indexable"   — rule exists but `indexable: false`
   *   - "thin_content"    — below `minProviderCount`
   *   - "missing_values"  — required facet values were not provided
   */
  reason?: "unknown_combo" | "not_indexable" | "thin_content" | "missing_values";
  /** Live provider count when one could be computed. */
  count?: number;
  /** Canonical URL for this page (self-canonical when allowed; parent URL otherwise). */
  canonicalTarget?: string;
  /** Whether the caller should emit `robots: { index: false, follow: true }`. */
  noindex?: boolean;
}

/**
 * Runtime gate for any page that wants to enforce facet policy. Pass
 * the combo + the concrete facet values + the site base URL, get back
 * a decision:
 *
 *     const decision = await evaluateCombo(
 *       normalizeCombo(["city", "specialty", "insurance"]),
 *       { city: "dubai", specialty: "cardiologists", insurance: "daman-enhanced" },
 *       getBaseUrl(),
 *     );
 *     if (!decision.allowed) {
 *       return {
 *         robots: { index: false, follow: true },
 *         alternates: { canonical: decision.canonicalTarget },
 *       };
 *     }
 *
 * This is the intended single entry point for future pages. Item 1's
 * `isTriFacetEligible` / `isDuoFacetEligible` remain for backward
 * compatibility but new callers should use `evaluateCombo` directly.
 */
export async function evaluateCombo(
  combo: FacetCombo,
  values: Partial<Record<FacetKind, string>>,
  baseUrl: string,
): Promise<EvaluateComboResult> {
  const rule = getRule(combo);
  if (!rule) {
    return { allowed: false, reason: "unknown_combo", noindex: true };
  }
  if (!rule.indexable) {
    const canonicalTarget = rule.parentCombo
      ? canonicalUrlFor(rule.parentCombo, values, baseUrl) ?? undefined
      : undefined;
    return { allowed: false, reason: "not_indexable", canonicalTarget, noindex: true };
  }

  // Make sure we have enough values to build the canonical URL.
  const selfUrl = canonicalUrlFor(combo, values, baseUrl);
  if (!selfUrl) {
    return { allowed: false, reason: "missing_values", noindex: true };
  }

  const count = await getProviderCountForCombo(combo, values);
  if (count < rule.minProviderCount) {
    const parent = rule.parentCombo
      ? canonicalUrlFor(rule.parentCombo, values, baseUrl) ?? undefined
      : undefined;
    return {
      allowed: false,
      reason: "thin_content",
      count,
      canonicalTarget: parent,
      noindex: true,
    };
  }

  return {
    allowed: true,
    count,
    canonicalTarget: selfUrl,
    noindex: false,
  };
}

// ─── Inline self-tests ─────────────────────────────────────────────────────

/**
 * Compile-time + lightweight runtime invariants for the rule table.
 * Not wired into any test runner yet — call it from a future Jest/Vitest
 * suite or from a CI script. It throws on the first failure so CI can
 * fail loudly rather than silently accepting a broken rule table.
 *
 * Invariants:
 *   1. Every combo in `FACET_RULES` is stored in canonical order (i.e.
 *      `normalizeCombo(rule.combo)` equals `rule.combo`).
 *   2. No two rules share the same combo key.
 *   3. `minProviderCount >= 0`.
 *   4. Every rule with `canonicalStrategy === "parent"` has a `parentCombo`.
 *   5. Every referenced `parentCombo` resolves to a real rule.
 *   6. `indexable === true` implies `minProviderCount >= 1` (else the
 *      gate is meaningless).
 *   7. `normalizeCombo` is idempotent.
 */
export function __selftest(): void {
  // 7. Idempotence of normalizeCombo.
  const raw: FacetKind[] = ["insurance", "city", "specialty"];
  const once = normalizeCombo(raw);
  const twice = normalizeCombo(once);
  if (once.join("|") !== twice.join("|")) {
    throw new Error("normalizeCombo is not idempotent");
  }

  const seenKeys = new Set<string>();
  for (const rule of FACET_RULES) {
    const canonical = normalizeCombo(rule.combo).join("|");
    const actual = rule.combo.join("|");

    // 1. Canonical ordering.
    if (canonical !== actual) {
      throw new Error(
        `FacetRule for ${actual} is not in canonical order (expected ${canonical})`,
      );
    }

    // 2. No duplicates.
    if (seenKeys.has(canonical)) {
      throw new Error(`FacetRule for ${canonical} is duplicated`);
    }
    seenKeys.add(canonical);

    // 3. Non-negative min count.
    if (rule.minProviderCount < 0) {
      throw new Error(
        `FacetRule ${canonical} has negative minProviderCount`,
      );
    }

    // 4. parent strategy requires parentCombo.
    if (rule.canonicalStrategy === "parent" && !rule.parentCombo) {
      throw new Error(
        `FacetRule ${canonical} uses "parent" strategy without a parentCombo`,
      );
    }

    // 5. parentCombo must resolve.
    if (rule.parentCombo) {
      const parentKey = normalizeCombo(rule.parentCombo).join("|");
      if (!RULES_BY_KEY.has(parentKey)) {
        throw new Error(
          `FacetRule ${canonical} references unknown parentCombo ${parentKey}`,
        );
      }
    }

    // 6. indexable ⇒ minProviderCount ≥ 1.
    if (rule.indexable && rule.minProviderCount < 1) {
      throw new Error(
        `FacetRule ${canonical} is indexable but has minProviderCount < 1`,
      );
    }
  }
}
