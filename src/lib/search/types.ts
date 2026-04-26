/**
 * Healthcare-intent search types.
 *
 * Part of Zocdoc Roadmap Item 9 (Codex Rec 5). The rebuilt search bar parses
 * free text + structured filters into a `HealthcareSearchQuery`, then calls
 * `searchHealthcare()` from `./match.ts` to produce a grouped
 * `HealthcareSearchResults` bag.
 *
 * URL contract: the results page is `noindex,follow` per Item 0 cleanup, so
 * the search surface is UX-first, not SEO-first — every filter combination
 * can be freely exposed here without facet-explosion risk.
 */

export type HealthcareEntityType = "doctor" | "facility" | "both";

export interface HealthcareSearchQuery {
  /** Free text — matched against provider name/description and doctor name. */
  query?: string;
  /** Patient-reason string (e.g. "back pain", "annual checkup"). Used for intent mapping. */
  reason?: string;
  /** Mapped to `CONDITIONS[].slug`. */
  condition?: string;
  /** Mapped to `CATEGORIES[].slug`. */
  specialty?: string;
  /** Mapped to `CITIES[].slug`. */
  city?: string;
  /** Area slug within the chosen city, if the user picked one. */
  area?: string;
  /** Mapped to `INSURANCE_PROVIDERS[].slug`. */
  insurance?: string;
  /** Mapped to `LANGUAGES[].slug`. */
  language?: string;
  /** "doctor" | "facility" | "both" — controls which result pools are populated. */
  entityType?: HealthcareEntityType;
  /** "Need care now" toggle — filters for 24-hour / emergency providers. */
  emergency?: boolean;
  /** Pagination (SSR per Item 0.5). */
  page?: number;
}

export type HealthcareResultKind =
  | "doctor"
  | "facility"
  | "condition"
  | "insurance-hub";

export interface HealthcareSearchResult {
  kind: HealthcareResultKind;
  title: string;
  subtitle?: string;
  url: string;
  /** Absolute public URL, used by API clients. */
  canonicalUrl?: string;
  entityId?: string | number;
}

export interface HealthcareSearchResults {
  totalFacilities: number;
  totalDoctors: number;
  facilities: HealthcareSearchResult[];
  doctors: HealthcareSearchResult[];
  conditions: HealthcareSearchResult[];
  insuranceHubs: HealthcareSearchResult[];
  /** When set, the widening fallback produced these results — surface a soft
   *  "no exact matches — here are related providers" banner. */
  widened?: boolean;
}
