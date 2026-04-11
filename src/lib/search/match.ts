/**
 * Healthcare-intent search matcher.
 *
 * Part of Zocdoc Roadmap Item 9 (Codex Rec 5). Given a `HealthcareSearchQuery`,
 * this module parses free-text intent, derives structured filters, and calls
 * the existing data helpers (`getProviders`, `getProfessionalsIndexByCity`,
 * `getProfessionalsIndexBySpecialty`) to produce a grouped result bag.
 *
 * Notes on discipline:
 *  - Pure server-side module. Safe to import from Server Components + route
 *    handlers; never import from a Client Component.
 *  - Only reads existing data — never invents insurance/availability claims.
 *  - Does NOT register any URLs in the sitemap (Item 0 removed /search).
 */

import {
  getProviders,
  is24HourProvider,
  isEmergencyProvider,
  type LocalProvider,
} from "@/lib/data";
import { CONDITIONS } from "@/lib/constants/conditions";
import { CATEGORIES } from "@/lib/constants/categories";
import { INSURANCE_PROVIDERS } from "@/lib/constants/insurance";
import { LANGUAGES } from "@/lib/constants/languages";
import {
  getProfessionalsIndexByCity,
  getProfessionalsIndexBySpecialty,
  type ProfessionalIndexRecord,
} from "@/lib/professionals";
import type {
  HealthcareSearchQuery,
  HealthcareSearchResult,
  HealthcareSearchResults,
} from "./types";

// ── Intent parsing ─────────────────────────────────────────────────────────

/**
 * Keyword → specialty slug map. Used to turn patient-reason strings
 * ("back pain", "tooth ache") into `CATEGORIES[].slug` values that
 * `getProviders` understands.
 *
 * Deliberately small + hand-curated. Keep it close to obvious matches —
 * if the keyword list gets long, promote it to its own constants file.
 */
const REASON_TO_SPECIALTY: Record<string, string> = {
  // dental
  "tooth": "dental",
  "teeth": "dental",
  "dentist": "dental",
  "dental": "dental",
  "braces": "dental",
  "implant": "dental",
  // eye
  "eye": "ophthalmology",
  "vision": "ophthalmology",
  "lasik": "ophthalmology",
  "glasses": "ophthalmology",
  // skin
  "skin": "dermatology",
  "acne": "dermatology",
  "rash": "dermatology",
  "eczema": "dermatology",
  // ortho / pain
  "back pain": "orthopedics",
  "knee": "orthopedics",
  "joint": "orthopedics",
  "sports injury": "orthopedics",
  "fracture": "orthopedics",
  // cardio
  "heart": "cardiology",
  "chest pain": "cardiology",
  "blood pressure": "cardiology",
  "hypertension": "cardiology",
  // mental health
  "anxiety": "mental-health",
  "depression": "mental-health",
  "therapy": "mental-health",
  "counseling": "mental-health",
  "psychiatrist": "mental-health",
  // pediatrics
  "child": "pediatrics",
  "baby": "pediatrics",
  "kids": "pediatrics",
  "pediatric": "pediatrics",
  // ob/gyn + fertility
  "pregnancy": "ob-gyn",
  "gynecologist": "ob-gyn",
  "ivf": "fertility-ivf",
  "fertility": "fertility-ivf",
  // ent
  "ear": "ent",
  "throat": "ent",
  "sinus": "ent",
  "hearing": "ent",
  // physio
  "physiotherapy": "physiotherapy",
  "rehab": "physiotherapy",
  "physical therapy": "physiotherapy",
  // primary care / clinics
  "checkup": "clinics",
  "check-up": "clinics",
  "annual checkup": "clinics",
  "gp": "clinics",
  "family doctor": "clinics",
  // emergency
  "emergency": "emergency-care",
  "urgent": "emergency-care",
  "er": "emergency-care",
  // labs
  "blood test": "labs-diagnostics",
  "lab": "labs-diagnostics",
  "x-ray": "radiology-imaging",
  "mri": "radiology-imaging",
  "ct scan": "radiology-imaging",
  // pharmacy
  "pharmacy": "pharmacy",
  "prescription": "pharmacy",
};

/**
 * Parse a free-text query or reason into a specialty slug, if possible.
 * Returns `null` if no confident match.
 */
export function parseReasonToSpecialty(text: string | undefined): string | null {
  if (!text) return null;
  const lower = text.trim().toLowerCase();
  if (!lower) return null;

  // Exact keyword hit (longest-match-first so "back pain" beats "pain").
  const keys = Object.keys(REASON_TO_SPECIALTY).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    if (lower.includes(key)) {
      return REASON_TO_SPECIALTY[key];
    }
  }
  // Fall back to matching against the official category slugs/names directly.
  const catByName = CATEGORIES.find(
    (c) => c.slug === lower || c.name.toLowerCase().includes(lower)
  );
  if (catByName) return catByName.slug;

  return null;
}

/**
 * Parse free text into a condition slug, if possible.
 */
export function parseReasonToCondition(text: string | undefined): string | null {
  if (!text) return null;
  const lower = text.trim().toLowerCase();
  if (!lower) return null;
  const cond = CONDITIONS.find(
    (c) =>
      c.slug === lower ||
      c.name.toLowerCase().includes(lower) ||
      lower.includes(c.name.toLowerCase())
  );
  return cond?.slug ?? null;
}

// ── Result mappers ─────────────────────────────────────────────────────────

function facilityToResult(p: LocalProvider): HealthcareSearchResult {
  const ratingBit =
    Number(p.googleRating) > 0
      ? ` · ${p.googleRating}/5 (${(p.googleReviewCount || 0).toLocaleString()})`
      : "";
  return {
    kind: "facility",
    title: p.name,
    subtitle: `${p.address}${ratingBit}`,
    url: `/directory/${p.citySlug}/${p.categorySlug}/${p.slug}`,
    entityId: p.id,
  };
}

function doctorToResult(d: ProfessionalIndexRecord): HealthcareSearchResult {
  const facility = d.primaryFacilityName ?? d.specialty;
  return {
    kind: "doctor",
    title: d.name,
    subtitle: `${d.displayTitle}${facility ? ` · ${facility}` : ""}`,
    url: `/find-a-doctor/${d.specialtySlug || "all"}/${d.slug}`,
    entityId: d.id,
  };
}

function conditionResult(slug: string, name: string, citySlug?: string): HealthcareSearchResult {
  return {
    kind: "condition",
    title: name,
    subtitle: citySlug ? `Care guide in ${citySlug}` : "Care guide",
    url: citySlug
      ? `/directory/${citySlug}/condition/${slug}`
      : `/directory/dubai/condition/${slug}`,
  };
}

function insuranceHubResult(slug: string, name: string, citySlug?: string): HealthcareSearchResult {
  return {
    kind: "insurance-hub",
    title: `${name} providers${citySlug ? ` in ${citySlug}` : ""}`,
    subtitle: "Accepted providers",
    url: citySlug
      ? `/directory/${citySlug}/insurance/${slug}`
      : `/insurance/${slug}`,
  };
}

// ── Main matcher ───────────────────────────────────────────────────────────

export interface SearchHealthcareOptions {
  /** Max results per group. Defaults: 12 facilities, 12 doctors. */
  limit?: number;
}

export async function searchHealthcare(
  q: HealthcareSearchQuery,
  opts: SearchHealthcareOptions = {}
): Promise<HealthcareSearchResults> {
  const limit = Math.max(1, Math.min(opts.limit ?? 12, 50));
  const entityType = q.entityType ?? "both";

  // ── Derive structured filters from the query ───────────────────────────
  const parsedSpecialty =
    q.specialty || parseReasonToSpecialty(q.reason) || parseReasonToSpecialty(q.query);
  const parsedCondition =
    q.condition || parseReasonToCondition(q.reason) || parseReasonToCondition(q.query);

  // If the user picked a condition, infer the first related specialty as a
  // fallback when no explicit specialty was given.
  let specialty = parsedSpecialty;
  if (!specialty && parsedCondition) {
    const cond = CONDITIONS.find((c) => c.slug === parsedCondition);
    specialty = cond?.relatedCategories[0] ?? null;
  }

  // ── Facility pool ──────────────────────────────────────────────────────
  let facilityRows: LocalProvider[] = [];
  let totalFacilities = 0;
  if (entityType === "facility" || entityType === "both") {
    const { providers, total } = await getProviders({
      query: q.query,
      citySlug: q.city,
      categorySlug: specialty ?? undefined,
      areaSlug: q.area,
      page: q.page && q.page > 0 ? q.page : 1,
      limit,
      sort: "rating",
    });
    facilityRows = providers;
    totalFacilities = total;

    // Client-side insurance + language + emergency filters. These are cheap
    // to apply in JS after the DB narrows by city/specialty; the alternative
    // is a much more complicated SQL path for a non-indexed surface.
    if (q.insurance) {
      const insurer = INSURANCE_PROVIDERS.find((i) => i.slug === q.insurance);
      if (insurer) {
        const needle = insurer.name.toLowerCase();
        facilityRows = facilityRows.filter((p) =>
          p.insurance.some((ins) => ins.toLowerCase().includes(needle))
        );
      }
    }
    if (q.language) {
      const lang = LANGUAGES.find((l) => l.slug === q.language);
      if (lang) {
        const needle = lang.name.toLowerCase();
        facilityRows = facilityRows.filter((p) =>
          p.languages.some((l) => l.toLowerCase() === needle)
        );
      }
    }
    if (q.emergency) {
      facilityRows = facilityRows.filter(
        (p) => isEmergencyProvider(p) || is24HourProvider(p)
      );
    }
  }

  // ── Doctor pool ────────────────────────────────────────────────────────
  let doctorRows: ProfessionalIndexRecord[] = [];
  let totalDoctors = 0;
  if (entityType === "doctor" || entityType === "both") {
    if (specialty) {
      const { professionals, total } = await getProfessionalsIndexBySpecialty(
        specialty,
        { limit, offset: 0 }
      );
      doctorRows = professionals;
      totalDoctors = total;
    } else if (q.city) {
      const { professionals, total } = await getProfessionalsIndexByCity(q.city, {
        limit,
        offset: 0,
      });
      doctorRows = professionals;
      totalDoctors = total;
    }
    // Narrow further by free-text against name/displayTitle if provided.
    if (q.query) {
      const needle = q.query.trim().toLowerCase();
      if (needle) {
        doctorRows = doctorRows.filter(
          (d) =>
            d.name.toLowerCase().includes(needle) ||
            d.displayTitle.toLowerCase().includes(needle) ||
            d.specialty.toLowerCase().includes(needle)
        );
      }
    }
  }

  // ── Widening fallback ──────────────────────────────────────────────────
  let widened = false;
  if (
    facilityRows.length === 0 &&
    doctorRows.length === 0 &&
    (q.city || specialty)
  ) {
    // Drop the most restrictive filters and re-try: keep the city or the
    // specialty, drop everything else.
    widened = true;
    if (specialty && (entityType === "facility" || entityType === "both")) {
      const { providers, total } = await getProviders({
        categorySlug: specialty,
        page: 1,
        limit,
        sort: "rating",
      });
      facilityRows = providers;
      totalFacilities = total;
    } else if (q.city && (entityType === "facility" || entityType === "both")) {
      const { providers, total } = await getProviders({
        citySlug: q.city,
        page: 1,
        limit,
        sort: "rating",
      });
      facilityRows = providers;
      totalFacilities = total;
    }
    if (specialty && (entityType === "doctor" || entityType === "both")) {
      const { professionals, total } = await getProfessionalsIndexBySpecialty(
        specialty,
        { limit, offset: 0 }
      );
      doctorRows = professionals;
      totalDoctors = total;
    }
  }

  // ── Condition + insurance-hub suggestions ──────────────────────────────
  const conditionResults: HealthcareSearchResult[] = [];
  if (parsedCondition) {
    const cond = CONDITIONS.find((c) => c.slug === parsedCondition);
    if (cond) conditionResults.push(conditionResult(cond.slug, cond.name, q.city));
  } else if (q.query) {
    const needle = q.query.trim().toLowerCase();
    for (const c of CONDITIONS) {
      if (
        c.name.toLowerCase().includes(needle) ||
        needle.includes(c.name.toLowerCase())
      ) {
        conditionResults.push(conditionResult(c.slug, c.name, q.city));
        if (conditionResults.length >= 3) break;
      }
    }
  }

  const insuranceHubs: HealthcareSearchResult[] = [];
  if (q.insurance) {
    const ins = INSURANCE_PROVIDERS.find((i) => i.slug === q.insurance);
    if (ins) insuranceHubs.push(insuranceHubResult(ins.slug, ins.name, q.city));
  }

  return {
    totalFacilities,
    totalDoctors,
    facilities: facilityRows.slice(0, limit).map(facilityToResult),
    doctors: doctorRows.slice(0, limit).map(doctorToResult),
    conditions: conditionResults,
    insuranceHubs,
    widened,
  };
}
