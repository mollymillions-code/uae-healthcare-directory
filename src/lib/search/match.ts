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

function uniqueNonEmpty(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[.,/_()[\]{}]+/g, " ")
    .replace(/\b(?:l\s*l\s*c|llc|ltd|limited|fz\s*llc|f\s*z\s*l\s*l\s*c|fze|fzco|dmcc|psc|pjsc|sole\s+proprietorship|branch)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getFacilityQueryVariants(query: string | undefined): string[] {
  if (!query) return [];

  const raw = query.trim();
  if (!raw) return [];

  const punctuationNormalized = raw
    .replace(/&/g, " and ")
    .replace(/[.,/_()[\]{}]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const legalSuffixNormalized = normalizeSearchText(raw);

  return uniqueNonEmpty([raw, punctuationNormalized, legalSuffixNormalized]);
}

function tokenizeSearchQuery(query: string | undefined): string[] {
  if (!query) return [];
  const stopWords = new Set([
    "a", "an", "and", "at", "by", "for", "in", "near", "of", "the", "to",
    "uae", "llc", "ltd", "limited", "centre", "center", "medical",
  ]);
  return normalizeSearchText(query)
    .split(" ")
    .filter((token) => token.length >= 2 && !stopWords.has(token));
}

function rankProviderForQuery(provider: LocalProvider, query: string | undefined): number {
  const normalizedQuery = normalizeSearchText(query || "");
  if (!normalizedQuery) return 0;

  const tokens = tokenizeSearchQuery(query);
  const name = normalizeSearchText(provider.name);
  const address = normalizeSearchText(provider.address || "");
  const description = normalizeSearchText(provider.shortDescription || provider.description || "");

  let score = 0;
  if (name === normalizedQuery) score += 1000;
  if (name.startsWith(normalizedQuery)) score += 800;
  if (name.includes(normalizedQuery)) score += 650;
  if (tokens.length > 0 && tokens.every((token) => name.includes(token))) score += 500;

  for (const token of tokens) {
    if (name.split(" ").includes(token)) score += 70;
    else if (name.includes(token)) score += 45;
    if (address.includes(token)) score += 12;
    if (description.includes(token)) score += 8;
  }

  score += Math.min(Number(provider.googleRating) || 0, 5) * 2;
  score += Math.min(provider.googleReviewCount || 0, 500) / 250;
  return score;
}

interface GeminiSearchIntent {
  providerName?: string;
  correctedQuery?: string;
  specialty?: string;
  city?: string;
  entityType?: "doctor" | "facility" | "both";
}

const geminiIntentCache = new Map<string, GeminiSearchIntent | null>();

async function getGeminiSearchIntent(q: HealthcareSearchQuery): Promise<GeminiSearchIntent | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  const rawQuery = q.query?.trim();
  if (!apiKey || !rawQuery || rawQuery.length < 3) return null;

  const cacheKey = JSON.stringify({
    query: rawQuery,
    city: q.city || "",
    specialty: q.specialty || "",
    reason: q.reason || "",
  });
  if (geminiIntentCache.has(cacheKey)) return geminiIntentCache.get(cacheKey) ?? null;

  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    Number(process.env.GEMINI_SEARCH_TIMEOUT_MS || 1200)
  );

  try {
    const model = process.env.GEMINI_SEARCH_MODEL || "gemini-3.1-flash-lite";
    const specialties = CATEGORIES.map((c) => c.slug).join(", ");
    const prompt = [
      "Return only JSON for a UAE healthcare directory search intent.",
      "If the text looks like a clinic/facility/person name, put the cleaned name in providerName and do not infer specialty from words inside the name.",
      "Use specialty only for actual specialty intent like dentist, pediatrics, IVF, pharmacy, lab, MRI.",
      `Allowed specialty slugs: ${specialties}.`,
      'Shape: {"providerName":"","correctedQuery":"","specialty":"","city":"","entityType":"both"}.',
      `User query: ${rawQuery}`,
      `Selected city slug: ${q.city || ""}`,
      `Selected specialty slug: ${q.specialty || ""}`,
    ].join("\n");

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0,
            responseMimeType: "application/json",
          },
        }),
      }
    );
    if (!response.ok) return null;

    const body = await response.json().catch(() => null);
    const text = body?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text || typeof text !== "string") return null;

    const parsed = JSON.parse(text) as GeminiSearchIntent;
    const intent: GeminiSearchIntent = {};
    if (typeof parsed.providerName === "string") intent.providerName = parsed.providerName.trim();
    if (typeof parsed.correctedQuery === "string") intent.correctedQuery = parsed.correctedQuery.trim();
    if (
      typeof parsed.specialty === "string" &&
      CATEGORIES.some((c) => c.slug === parsed.specialty)
    ) {
      intent.specialty = parsed.specialty;
    }
    if (parsed.entityType === "doctor" || parsed.entityType === "facility" || parsed.entityType === "both") {
      intent.entityType = parsed.entityType;
    }
    geminiIntentCache.set(cacheKey, intent);
    return intent;
  } catch {
    geminiIntentCache.set(cacheKey, null);
    return null;
  } finally {
    clearTimeout(timeout);
  }
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
  const aiIntent = await getGeminiSearchIntent(q);
  const searchText =
    aiIntent?.providerName ||
    aiIntent?.correctedQuery ||
    q.query;

  // ── Derive structured filters from the query ───────────────────────────
  const providerNameSearch = Boolean(aiIntent?.providerName);
  const explicitSpecialty =
    q.specialty ||
    parseReasonToSpecialty(q.reason) ||
    (!providerNameSearch ? aiIntent?.specialty : undefined);
  const queryInferredSpecialty =
    !providerNameSearch ? parseReasonToSpecialty(q.query) : null;
  const parsedSpecialty = explicitSpecialty || queryInferredSpecialty;
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
    const page = q.page && q.page > 0 ? q.page : 1;
    const queryVariants = getFacilityQueryVariants(searchText);

    if (queryVariants.length > 0) {
      const { providers: candidateProviders } = await getProviders({
        citySlug: q.city,
        categorySlug: explicitSpecialty ?? undefined,
        areaSlug: q.area,
        page: 1,
        limit: 20000,
        sort: "rating",
      });

      const ranked = candidateProviders
        .map((provider) => ({
          provider,
          score: Math.max(
            ...queryVariants.map((query) => rankProviderForQuery(provider, query))
          ),
        }))
        .filter((entry) => entry.score > 0)
        .sort((a, b) => b.score - a.score);

      totalFacilities = ranked.length;
      facilityRows = ranked
        .slice((page - 1) * limit, page * limit)
        .map((entry) => entry.provider);
    } else {
      const { providers, total } = await getProviders({
        citySlug: q.city,
        categorySlug: specialty ?? undefined,
        areaSlug: q.area,
        page,
        limit,
        sort: "rating",
      });
      facilityRows = providers;
      totalFacilities = total;
    }

    if (
      facilityRows.length === 0 &&
      totalFacilities === 0 &&
      queryInferredSpecialty &&
      !explicitSpecialty
    ) {
      const { providers, total } = await getProviders({
        citySlug: q.city,
        categorySlug: queryInferredSpecialty,
        areaSlug: q.area,
        page: 1,
        limit,
        sort: "rating",
      });
      facilityRows = providers;
      totalFacilities = total;
    }

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
