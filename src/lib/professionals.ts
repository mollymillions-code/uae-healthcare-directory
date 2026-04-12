/**
 * Professional Directory — Data Access Layer
 *
 * Legacy path (synchronous): loads 99,520 DHA-licensed healthcare professionals
 * from JSON and builds in-memory indexes. Powers the existing /find-a-doctor
 * and /professionals pages.
 *
 * New path (asynchronous, DB-backed, Item 0.75): reads from the
 * `professionals_index` table — populated by
 * `scripts/build-professionals-index.mjs`. Powers the new
 * /find-a-doctor/[specialty]/[doctor]-[id] route class.
 *
 * Both paths coexist intentionally so the legacy pages keep rendering even if
 * the new table is empty (graceful fallback everywhere).
 */

import fs from "fs";
import path from "path";
import {
  generateFacilitySlug,
  getSpecialtySlugFromApi,
  getSpecialtyBySlug,
  PROFESSIONAL_CATEGORIES,
} from "@/lib/constants/professionals";

// ─── DHA data verification constant ─────────────────────────────────────────
// Update this on every full re-pull of the DHA Sheryan register.
// Referenced by the DoctorProfileFacts component to render a "last verified"
// date line so users know how fresh the data is.
export const DHA_DATA_VERIFIED_AT = "April 2026";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Professional {
  dhaUniqueId: string;
  name: string;
  photo: string;
  licensecount: number;
  categoryOrSpeciality: string;
  licenseType: string;
  facilityName?: string;
  facilityCount: number;
}

export interface ParsedProfessional {
  id: string;
  name: string;
  photo: string;
  category: string;       // "Physician", "Dentist", etc.
  specialty: string;      // "Specialist Dermatology", "General Practitioner", etc.
  specialtySlug: string;  // "dermatology", "general-practitioner"
  categorySlug: string;   // "physicians", "dentists", etc.
  licenseType: string;    // "FTL", "REG"
  facilityName: string;
  facilitySlug: string;
  licenseCount: number;
}

export interface FacilityProfile {
  name: string;
  slug: string;
  totalStaff: number;
  categories: Record<string, number>;
  specialties: Record<string, number>;
  topSpecialties: { slug: string; name: string; count: number }[];
}

// ─── Data Loading ────────────────────────────────────────────────────────────

const DATA_PATH = path.join(process.cwd(), "data", "parsed", "dha_professionals_all.json");

let _professionals: ParsedProfessional[] | null = null;
let _byCategory: Map<string, ParsedProfessional[]> | null = null;
let _bySpecialtySlug: Map<string, ParsedProfessional[]> | null = null;
let _byFacilitySlug: Map<string, ParsedProfessional[]> | null = null;
let _facilityProfiles: Map<string, FacilityProfile> | null = null;

function parseCategoryAndSpecialty(raw: string): { category: string; specialty: string } {
  const dash = raw.indexOf("-");
  if (dash === -1) return { category: raw.trim(), specialty: "" };
  return { category: raw.substring(0, dash).trim(), specialty: raw.substring(dash + 1).trim() };
}

function getCategorySlug(apiCategory: string): string {
  const cat = PROFESSIONAL_CATEGORIES.find((c) => c.apiName === apiCategory);
  return cat?.slug || "allied-health";
}

function loadData(): ParsedProfessional[] {
  if (_professionals) return _professionals;

  let raw: Professional[];
  try {
    raw = JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(
      `[professionals] Failed to load data from ${DATA_PATH}: ${message}. ` +
      `Ensure dha_professionals_all.json exists in data/parsed/. Returning empty dataset.`
    );
    _professionals = [];
    return _professionals;
  }
  _professionals = raw.map((r) => {
    const { category, specialty } = parseCategoryAndSpecialty(r.categoryOrSpeciality || "");
    return {
      id: r.dhaUniqueId,
      name: r.name,
      photo: r.photo || "",
      category,
      specialty,
      specialtySlug: getSpecialtySlugFromApi(specialty) || "",
      categorySlug: getCategorySlug(category),
      licenseType: r.licenseType,
      facilityName: r.facilityName || "",
      facilitySlug: r.facilityName ? generateFacilitySlug(r.facilityName) : "",
      licenseCount: r.licensecount,
    };
  });

  return _professionals;
}

function buildCategoryIndex(): Map<string, ParsedProfessional[]> {
  if (_byCategory) return _byCategory;
  _byCategory = new Map();
  for (const p of loadData()) {
    const arr = _byCategory.get(p.categorySlug) || [];
    arr.push(p);
    _byCategory.set(p.categorySlug, arr);
  }
  return _byCategory;
}

function buildSpecialtyIndex(): Map<string, ParsedProfessional[]> {
  if (_bySpecialtySlug) return _bySpecialtySlug;
  _bySpecialtySlug = new Map();
  for (const p of loadData()) {
    if (!p.specialtySlug) continue;
    const arr = _bySpecialtySlug.get(p.specialtySlug) || [];
    arr.push(p);
    _bySpecialtySlug.set(p.specialtySlug, arr);
  }
  return _bySpecialtySlug;
}

function buildFacilityIndex(): Map<string, ParsedProfessional[]> {
  if (_byFacilitySlug) return _byFacilitySlug;
  _byFacilitySlug = new Map();
  for (const p of loadData()) {
    if (!p.facilitySlug) continue;
    const arr = _byFacilitySlug.get(p.facilitySlug) || [];
    arr.push(p);
    _byFacilitySlug.set(p.facilitySlug, arr);
  }
  return _byFacilitySlug;
}

function buildFacilityProfiles(): Map<string, FacilityProfile> {
  if (_facilityProfiles) return _facilityProfiles;
  _facilityProfiles = new Map();

  const facIndex = buildFacilityIndex();
  for (const [slug, professionals] of Array.from(facIndex.entries())) {
    const categories: Record<string, number> = {};
    const specialties: Record<string, number> = {};

    for (const p of professionals) {
      categories[p.categorySlug] = (categories[p.categorySlug] || 0) + 1;
      if (p.specialtySlug) {
        specialties[p.specialtySlug] = (specialties[p.specialtySlug] || 0) + 1;
      }
    }

    const topSpecialties = Object.entries(specialties)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([specSlug, count]) => {
        const spec = getSpecialtyBySlug(specSlug);
        return { slug: specSlug, name: spec?.name || specSlug, count };
      });

    _facilityProfiles.set(slug, {
      name: professionals[0].facilityName,
      slug,
      totalStaff: professionals.length,
      categories,
      specialties,
      topSpecialties,
    });
  }

  return _facilityProfiles;
}

// ─── Public API ──────────────────────────────────────────────────────────────

/** Get all professionals (99K+ records) */
export function getAllProfessionals(): ParsedProfessional[] {
  return loadData();
}

/** Get professionals by category slug */
export function getProfessionalsByCategory(categorySlug: string): ParsedProfessional[] {
  return buildCategoryIndex().get(categorySlug) || [];
}

/** Get professionals by specialty slug */
export function getProfessionalsBySpecialty(specialtySlug: string): ParsedProfessional[] {
  return buildSpecialtyIndex().get(specialtySlug) || [];
}

/** Get professionals by facility slug */
export function getProfessionalsByFacility(facilitySlug: string): ParsedProfessional[] {
  return buildFacilityIndex().get(facilitySlug) || [];
}

/** Get professionals by facility + specialty */
export function getProfessionalsByFacilityAndSpecialty(
  facilitySlug: string,
  specialtySlug: string
): ParsedProfessional[] {
  const facPros = getProfessionalsByFacility(facilitySlug);
  return facPros.filter((p) => p.specialtySlug === specialtySlug);
}

/** Get facility profile with staff breakdown */
export function getFacilityProfile(facilitySlug: string): FacilityProfile | undefined {
  return buildFacilityProfiles().get(facilitySlug);
}

/** Get all facilities with minimum staff count */
export function getAllFacilities(minStaff = 5): FacilityProfile[] {
  const profiles = buildFacilityProfiles();
  return Array.from(profiles.values())
    .filter((f) => f.totalStaff >= minStaff)
    .sort((a, b) => b.totalStaff - a.totalStaff);
}

/** Get all facility slugs for static param generation */
export function getAllFacilitySlugs(minStaff = 20): string[] {
  return getAllFacilities(minStaff).map((f) => f.slug);
}

/** Get specialty stats: professionals count, facilities count, top facilities */
export function getSpecialtyStats(specialtySlug: string) {
  const pros = getProfessionalsBySpecialty(specialtySlug);
  const spec = getSpecialtyBySlug(specialtySlug);

  const facCounts: Record<string, { name: string; count: number }> = {};
  let ftlCount = 0;
  let regCount = 0;

  for (const p of pros) {
    if (p.facilityName) {
      if (!facCounts[p.facilitySlug]) {
        facCounts[p.facilitySlug] = { name: p.facilityName, count: 0 };
      }
      facCounts[p.facilitySlug].count++;
    }
    if (p.licenseType === "FTL") ftlCount++;
    if (p.licenseType === "REG") regCount++;
  }

  const topFacilities = Object.entries(facCounts)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10)
    .map(([slug, data]) => ({ slug, ...data }));

  return {
    specialty: spec,
    totalProfessionals: pros.length,
    ftlCount,
    regCount,
    totalFacilities: Object.keys(facCounts).length,
    topFacilities,
  };
}

/** Get facility × specialty combinations for static params */
export function getFacilitySpecialtyCombos(minProfessionals = 3): {
  facilitySlug: string;
  specialtySlug: string;
  count: number;
}[] {
  const combos: { facilitySlug: string; specialtySlug: string; count: number }[] = [];
  const facIndex = buildFacilityIndex();

  for (const [facilitySlug, pros] of Array.from(facIndex.entries())) {
    const specCounts: Record<string, number> = {};
    for (const p of pros) {
      if (p.specialtySlug) {
        specCounts[p.specialtySlug] = (specCounts[p.specialtySlug] || 0) + 1;
      }
    }
    for (const [specialtySlug, count] of Object.entries(specCounts)) {
      if (count >= minProfessionals) {
        combos.push({ facilitySlug, specialtySlug, count });
      }
    }
  }

  return combos.sort((a, b) => b.count - a.count);
}

// ─── Area Mapping ────────────────────────────────────────────────────────────

const FACILITY_AREA_MAP: Record<string, string> = {
  // Major hospitals — manually mapped
  "rashid hospital": "oud-metha",
  "dubai hospital": "al-barsha",
  "american hospital dubai": "oud-metha",
  "mediclinic parkview": "al-barsha",
  "al jalila children": "al-jaddaf",
  "mediclinic city hospital": "dhcc",
  "al zahra": "al-barsha",
  "latifa hospital": "oud-metha",
  "kings college hospital": "dhcc",
  "saudi german hospital": "al-barsha",
  "fakeeh university hospital": "dhcc",
  "clemenceau": "dhcc",
  "dr sulaiman al habib": "dhcc",
  "emirates hospital": "jumeirah",
  "canadian specialist hospital": "al-mamzar",
  "iranian hospital": "al-wasl",
  "medcare": "al-safa",
  "medeor": "bur-dubai",
  "thumbay hospital": "al-qusais",
  "hatta hospital": "hatta",
  "n.m.c specialty hospital": "deira",
  "n m c royal hospital": "deira",
  "zulekha hospital": "al-nahda",
  "prime hospital": "al-garhoud",
  "al garhoud private hospital": "al-garhoud",
  "aster hospital": "al-qusais",
  "mirdif private hospital": "mirdif",
  "al tadawi": "deira",
  "international modern hospital": "deira",
  "mediclinic welcare": "al-garhoud",
};

const AREA_KEYWORDS: [string, string][] = [
  ["dhcc", "dhcc"], ["healthcare city", "dhcc"], ["health care city", "dhcc"],
  ["jumeirah", "jumeirah"], ["jlt", "jlt"], ["marina", "dubai-marina"],
  ["al barsha", "al-barsha"], ["deira", "deira"], ["bur dubai", "bur-dubai"],
  ["karama", "karama"], ["jebel ali", "jebel-ali"], ["al warqa", "al-warqa"],
  ["al rashidiya", "al-rashidiya"], ["al qusais", "al-qusais"], ["motor city", "motor-city"],
  ["al mamzar", "al-mamzar"], ["palm", "palm-jumeirah"], ["al nahda", "al-nahda"],
  ["al mankhool", "al-mankhool"], ["umm suqeim", "umm-suqeim"], ["al wasl", "al-wasl"],
  ["business bay", "business-bay"], ["silicon oasis", "silicon-oasis"],
  ["al sufouh", "al-sufouh"], ["al quoz", "al-quoz"], ["al satwa", "al-satwa"],
  ["discovery gardens", "discovery-gardens"], ["sports city", "sports-city"],
  ["oud metha", "oud-metha"], ["downtown", "downtown-dubai"], ["al rigga", "al-rigga"],
  ["tecom", "tecom"], ["mirdif", "mirdif"], ["al garhoud", "al-garhoud"],
  ["al safa", "al-safa"], ["al jaddaf", "al-jaddaf"], ["international city", "international-city"],
];

export const DUBAI_AREAS = [
  { slug: "dhcc", name: "Dubai Healthcare City (DHCC)" },
  { slug: "jumeirah", name: "Jumeirah" },
  { slug: "jlt", name: "Jumeirah Lake Towers (JLT)" },
  { slug: "dubai-marina", name: "Dubai Marina" },
  { slug: "al-barsha", name: "Al Barsha" },
  { slug: "deira", name: "Deira" },
  { slug: "bur-dubai", name: "Bur Dubai" },
  { slug: "karama", name: "Al Karama" },
  { slug: "jebel-ali", name: "Jebel Ali" },
  { slug: "al-warqa", name: "Al Warqa" },
  { slug: "al-rashidiya", name: "Al Rashidiya" },
  { slug: "al-qusais", name: "Al Qusais" },
  { slug: "motor-city", name: "Motor City" },
  { slug: "al-mamzar", name: "Al Mamzar" },
  { slug: "palm-jumeirah", name: "Palm Jumeirah" },
  { slug: "al-nahda", name: "Al Nahda" },
  { slug: "al-mankhool", name: "Al Mankhool" },
  { slug: "umm-suqeim", name: "Umm Suqeim" },
  { slug: "al-wasl", name: "Al Wasl" },
  { slug: "business-bay", name: "Business Bay" },
  { slug: "silicon-oasis", name: "Dubai Silicon Oasis" },
  { slug: "al-sufouh", name: "Al Sufouh" },
  { slug: "al-quoz", name: "Al Quoz" },
  { slug: "al-satwa", name: "Al Satwa" },
  { slug: "discovery-gardens", name: "Discovery Gardens" },
  { slug: "sports-city", name: "Dubai Sports City" },
  { slug: "oud-metha", name: "Oud Metha" },
  { slug: "downtown-dubai", name: "Downtown Dubai" },
  { slug: "al-rigga", name: "Al Rigga" },
  { slug: "tecom", name: "TECOM" },
  { slug: "mirdif", name: "Mirdif" },
  { slug: "al-garhoud", name: "Al Garhoud" },
  { slug: "al-safa", name: "Al Safa" },
  { slug: "al-jaddaf", name: "Al Jaddaf" },
  { slug: "international-city", name: "International City" },
  { slug: "hatta", name: "Hatta" },
];

const areaCache = new Map<string, string>();

function resolveArea(facilityName: string): string {
  const cached = areaCache.get(facilityName);
  if (cached !== undefined) return cached;

  const lower = facilityName.toLowerCase();
  let result = "";
  // Check manual hospital map first
  for (const [key, area] of Object.entries(FACILITY_AREA_MAP)) {
    if (lower.includes(key)) { result = area; break; }
  }
  // Check keyword patterns
  if (!result) {
    for (const [keyword, areaSlug] of AREA_KEYWORDS) {
      if (lower.includes(keyword)) { result = areaSlug; break; }
    }
  }

  areaCache.set(facilityName, result);
  return result;
}

let _byArea: Map<string, ParsedProfessional[]> | null = null;

function buildAreaIndex(): Map<string, ParsedProfessional[]> {
  if (_byArea) return _byArea;
  _byArea = new Map();
  for (const p of loadData()) {
    if (!p.facilityName) continue;
    const area = resolveArea(p.facilityName);
    if (!area) continue;
    const arr = _byArea.get(area) || [];
    arr.push(p);
    _byArea.set(area, arr);
  }
  return _byArea;
}

/** Get professionals by area slug */
export function getProfessionalsByArea(areaSlug: string): ParsedProfessional[] {
  return buildAreaIndex().get(areaSlug) || [];
}

/** Get professionals by area and specialty */
export function getProfessionalsByAreaAndSpecialty(areaSlug: string, specialtySlug: string): ParsedProfessional[] {
  return getProfessionalsByArea(areaSlug).filter((p) => p.specialtySlug === specialtySlug);
}

/** Get all areas with their professional counts */
export function getAreaStats(): { slug: string; name: string; count: number; topSpecialties: { slug: string; name: string; count: number }[] }[] {
  const areaIndex = buildAreaIndex();
  return DUBAI_AREAS
    .map((area) => {
      const pros = areaIndex.get(area.slug) || [];
      const specCounts: Record<string, number> = {};
      for (const p of pros) {
        if (p.specialtySlug) specCounts[p.specialtySlug] = (specCounts[p.specialtySlug] || 0) + 1;
      }
      const topSpecialties = Object.entries(specCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([slug, count]) => {
          const spec = getSpecialtyBySlug(slug);
          return { slug, name: spec?.name || slug, count };
        });
      return { ...area, count: pros.length, topSpecialties };
    })
    .filter((a) => a.count >= 10)
    .sort((a, b) => b.count - a.count);
}

/** Get area × specialty combos for generateStaticParams */
export function getAreaSpecialtyCombos(minProfessionals = 3): { areaSlug: string; specialtySlug: string; count: number }[] {
  const combos: { areaSlug: string; specialtySlug: string; count: number }[] = [];
  const areaIndex = buildAreaIndex();
  for (const [areaSlug, pros] of Array.from(areaIndex.entries())) {
    const specCounts: Record<string, number> = {};
    for (const p of pros) {
      if (p.specialtySlug) specCounts[p.specialtySlug] = (specCounts[p.specialtySlug] || 0) + 1;
    }
    for (const [specialtySlug, count] of Object.entries(specCounts)) {
      if (count >= minProfessionals) combos.push({ areaSlug, specialtySlug, count });
    }
  }
  return combos.sort((a, b) => b.count - a.count);
}

// ─── Specialist vs Consultant ────────────────────────────────────────────────

/** Get specialist-level professionals for a specialty (e.g. "Specialist Dermatology") */
export function getSpecialists(specialtySlug: string): ParsedProfessional[] {
  return getProfessionalsBySpecialty(specialtySlug).filter(
    (p) => p.specialty.startsWith("Specialist") || p.specialty.startsWith("General")
  );
}

/** Get consultant-level professionals for a specialty */
export function getConsultants(specialtySlug: string): ParsedProfessional[] {
  return getProfessionalsBySpecialty(specialtySlug).filter((p) => p.specialty.startsWith("Consultant"));
}

/** Get specialties that have both specialists and consultants */
export function getSpecialtiesWithBothLevels(): { slug: string; name: string; specialists: number; consultants: number }[] {
  const specIndex = buildSpecialtyIndex();
  const results: { slug: string; name: string; specialists: number; consultants: number }[] = [];
  for (const [slug, pros] of Array.from(specIndex.entries())) {
    const specialists = pros.filter((p) => p.specialty.startsWith("Specialist") || p.specialty.startsWith("General")).length;
    const consultants = pros.filter((p) => p.specialty.startsWith("Consultant")).length;
    if (specialists > 0 && consultants > 0) {
      const spec = getSpecialtyBySlug(slug);
      if (spec) results.push({ slug, name: spec.name, specialists, consultants });
    }
  }
  return results.sort((a, b) => (b.specialists + b.consultants) - (a.specialists + a.consultants));
}

// ─── Top/Best Rankings ───────────────────────────────────────────────────────

/** Get top N professionals for a specialty, ranked by facility size (larger facility = higher ranking) */
export function getTopProfessionalsBySpecialty(specialtySlug: string, limit = 10): ParsedProfessional[] {
  const pros = getProfessionalsBySpecialty(specialtySlug);
  const facProfiles = buildFacilityProfiles();
  return pros
    .filter((p) => p.facilityName && p.licenseType === "FTL")
    .sort((a, b) => {
      const facA = facProfiles.get(a.facilitySlug);
      const facB = facProfiles.get(b.facilitySlug);
      return (facB?.totalStaff || 0) - (facA?.totalStaff || 0);
    })
    .slice(0, limit);
}

/** Get top facilities for a specialty, ranked by number of that specialty */
export function getTopFacilitiesForSpecialty(specialtySlug: string, limit = 10): { slug: string; name: string; count: number; totalStaff: number }[] {
  const stats = getSpecialtyStats(specialtySlug);
  return stats.topFacilities.slice(0, limit).map((f) => {
    const profile = getFacilityProfile(f.slug);
    return { ...f, totalStaff: profile?.totalStaff || 0 };
  });
}

/** Get top professionals in an area for a specialty */
export function getTopProfessionalsInArea(areaSlug: string, specialtySlug: string, limit = 10): ParsedProfessional[] {
  return getProfessionalsByAreaAndSpecialty(areaSlug, specialtySlug)
    .filter((p) => p.licenseType === "FTL")
    .slice(0, limit);
}

/** Search professionals by name (for search page) */
export function searchProfessionals(query: string, limit = 50): ParsedProfessional[] {
  const lower = query.toLowerCase();
  const results: ParsedProfessional[] = [];
  for (const p of loadData()) {
    if (p.name.toLowerCase().includes(lower)) {
      results.push(p);
      if (results.length >= limit) break;
    }
  }
  return results;
}

// ─── DB-backed async API (Item 0.75 — professionals_index table) ────────────
//
// These helpers query the new `professionals_index` table that backs the
// /find-a-doctor/[specialty]/[doctor]-[id] route class. They are fully
// independent of the legacy JSON path above and return empty arrays when the
// table is empty so the new route class renders graceful zero-states
// immediately after schema apply.
//
// Lazy-loaded Drizzle modules: mirrors the pattern in `src/lib/data.ts`, so we
// never touch `pg` on the build path that doesn't need the DB.

type ProfessionalDiscipline =
  | "physician"
  | "dentist"
  | "nurse"
  | "pharmacist"
  | "allied-health"
  | "other";

export interface ProfessionalIndexRecord {
  id: number;
  dhaUniqueId: string;
  slug: string;
  name: string;
  nameAr: string | null;
  displayTitle: string;
  discipline: ProfessionalDiscipline;
  level: string;
  specialty: string;
  specialtySlug: string;
  categorySlug: string | null;
  primaryFacilityName: string | null;
  primaryFacilitySlug: string | null;
  primaryCitySlug: string | null;
  licenseType: "REG" | "FTL";
  licenseCount: number;
  photoUrl: string | null;
  photoConsent: boolean;
  education: string | null;
  educationDescription: string | null;
  searchTerms: string[];
  relatedConditions: string[];
  status: "active" | "inactive";
}

const DISCIPLINE_VALUES: ProfessionalDiscipline[] = [
  "physician",
  "dentist",
  "nurse",
  "pharmacist",
  "allied-health",
  "other",
];

function coerceDiscipline(raw: unknown): ProfessionalDiscipline {
  if (typeof raw !== "string") return "other";
  const v = raw as ProfessionalDiscipline;
  return DISCIPLINE_VALUES.includes(v) ? v : "other";
}

function coerceLicenseType(raw: unknown): "REG" | "FTL" {
  return raw === "FTL" ? "FTL" : "REG";
}

function coerceStatus(raw: unknown): "active" | "inactive" {
  return raw === "inactive" ? "inactive" : "active";
}

function coerceStringArray(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is string => typeof x === "string");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToProfessionalIndexRecord(row: any): ProfessionalIndexRecord {
  return {
    id: Number(row.id),
    dhaUniqueId: String(row.dhaUniqueId ?? row.dha_unique_id ?? ""),
    slug: String(row.slug ?? ""),
    name: String(row.name ?? ""),
    nameAr: (row.nameAr ?? row.name_ar ?? null) as string | null,
    displayTitle: String(row.displayTitle ?? row.display_title ?? ""),
    discipline: coerceDiscipline(row.discipline),
    level: String(row.level ?? "unknown"),
    specialty: String(row.specialty ?? ""),
    specialtySlug: String(row.specialtySlug ?? row.specialty_slug ?? ""),
    categorySlug:
      (row.categorySlug ?? row.category_slug ?? null) as string | null,
    primaryFacilityName:
      (row.primaryFacilityName ?? row.primary_facility_name ?? null) as
        | string
        | null,
    primaryFacilitySlug:
      (row.primaryFacilitySlug ?? row.primary_facility_slug ?? null) as
        | string
        | null,
    primaryCitySlug:
      (row.primaryCitySlug ?? row.primary_city_slug ?? null) as string | null,
    licenseType: coerceLicenseType(row.licenseType ?? row.license_type),
    licenseCount: Number(row.licenseCount ?? row.license_count ?? 1),
    photoUrl: (row.photoUrl ?? row.photo_url ?? null) as string | null,
    photoConsent: Boolean(row.photoConsent ?? row.photo_consent ?? false),
    education: (row.education ?? null) as string | null,
    educationDescription: (row.educationDescription ?? row.education_description ?? null) as string | null,
    searchTerms: coerceStringArray(row.searchTerms ?? row.search_terms),
    relatedConditions: coerceStringArray(
      row.relatedConditions ?? row.related_conditions
    ),
    status: coerceStatus(row.status),
  };
}

// Lazy-loaded Drizzle handles — only imported when the caller actually runs a
// DB query. Mirrors the pattern in `src/lib/data.ts`.
let _dbMod:
  | (typeof import("@/lib/db"))
  | null = null;
let _schemaMod:
  | (typeof import("@/lib/db/schema"))
  | null = null;
let _ormMod: (typeof import("drizzle-orm")) | null = null;

async function loadDbModules() {
  if (_dbMod && _schemaMod && _ormMod) return;
  const [dbMod, schemaMod, ormMod] = await Promise.all([
    import("@/lib/db"),
    import("@/lib/db/schema"),
    import("drizzle-orm"),
  ]);
  _dbMod = dbMod;
  _schemaMod = schemaMod;
  _ormMod = ormMod;
}

function hasDb(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

/** Look up a single professional by its slug. Returns null on miss or DB error. */
export async function getProfessionalBySlug(
  slug: string
): Promise<ProfessionalIndexRecord | null> {
  if (!hasDb() || !slug) return null;
  try {
    await loadDbModules();
    const { db } = _dbMod!;
    const { professionalsIndex } = _schemaMod!;
    const { and, eq } = _ormMod!;
    const rows = await db
      .select()
      .from(professionalsIndex)
      .where(
        and(eq(professionalsIndex.slug, slug), eq(professionalsIndex.status, "active"))
      )
      .limit(1);
    if (rows.length === 0) return null;
    return rowToProfessionalIndexRecord(rows[0]);
  } catch (err) {
    console.error(
      `[professionals] getProfessionalBySlug failed: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
    return null;
  }
}

/** List professionals for a given specialty slug, with pagination + total. */
export async function getProfessionalsIndexBySpecialty(
  specialtySlug: string,
  opts: { limit?: number; offset?: number } = {}
): Promise<{ total: number; professionals: ProfessionalIndexRecord[] }> {
  if (!hasDb() || !specialtySlug) return { total: 0, professionals: [] };
  const limit = Math.max(1, Math.min(opts.limit ?? 50, 200));
  const offset = Math.max(0, opts.offset ?? 0);
  try {
    await loadDbModules();
    const { db } = _dbMod!;
    const { professionalsIndex } = _schemaMod!;
    const { and, asc, eq, count } = _ormMod!;
    const where = and(
      eq(professionalsIndex.specialtySlug, specialtySlug),
      eq(professionalsIndex.status, "active")
    );
    const [countRows, rows] = await Promise.all([
      db
        .select({ total: count() })
        .from(professionalsIndex)
        .where(where),
      db
        .select()
        .from(professionalsIndex)
        .where(where)
        .orderBy(asc(professionalsIndex.name))
        .limit(limit)
        .offset(offset),
    ]);
    const total = Number(countRows[0]?.total ?? 0);
    return {
      total,
      professionals: rows.map(rowToProfessionalIndexRecord),
    };
  } catch (err) {
    console.error(
      `[professionals] getProfessionalsIndexBySpecialty failed: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
    return { total: 0, professionals: [] };
  }
}

/** List professionals at a given facility (soft slug ref). */
export async function getProfessionalsIndexByFacility(
  facilitySlug: string,
  opts: { limit?: number } = {}
): Promise<ProfessionalIndexRecord[]> {
  if (!hasDb() || !facilitySlug) return [];
  const limit = Math.max(1, Math.min(opts.limit ?? 50, 200));
  try {
    await loadDbModules();
    const { db } = _dbMod!;
    const { professionalsIndex } = _schemaMod!;
    const { and, asc, eq } = _ormMod!;
    const rows = await db
      .select()
      .from(professionalsIndex)
      .where(
        and(
          eq(professionalsIndex.primaryFacilitySlug, facilitySlug),
          eq(professionalsIndex.status, "active")
        )
      )
      .orderBy(asc(professionalsIndex.name))
      .limit(limit);
    return rows.map(rowToProfessionalIndexRecord);
  } catch (err) {
    console.error(
      `[professionals] getProfessionalsIndexByFacility failed: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
    return [];
  }
}

/** List professionals in a given city (derived from facility match). */
export async function getProfessionalsIndexByCity(
  citySlug: string,
  opts: { limit?: number; offset?: number } = {}
): Promise<{ total: number; professionals: ProfessionalIndexRecord[] }> {
  if (!hasDb() || !citySlug) return { total: 0, professionals: [] };
  const limit = Math.max(1, Math.min(opts.limit ?? 50, 200));
  const offset = Math.max(0, opts.offset ?? 0);
  try {
    await loadDbModules();
    const { db } = _dbMod!;
    const { professionalsIndex } = _schemaMod!;
    const { and, asc, eq, count } = _ormMod!;
    const where = and(
      eq(professionalsIndex.primaryCitySlug, citySlug),
      eq(professionalsIndex.status, "active")
    );
    const [countRows, rows] = await Promise.all([
      db.select({ total: count() }).from(professionalsIndex).where(where),
      db
        .select()
        .from(professionalsIndex)
        .where(where)
        .orderBy(asc(professionalsIndex.name))
        .limit(limit)
        .offset(offset),
    ]);
    const total = Number(countRows[0]?.total ?? 0);
    return {
      total,
      professionals: rows.map(rowToProfessionalIndexRecord),
    };
  } catch (err) {
    console.error(
      `[professionals] getProfessionalsIndexByCity failed: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
    return { total: 0, professionals: [] };
  }
}

/** Cheap count used by hub + metadata titles. */
export async function getProfessionalCountBySpecialty(
  specialtySlug: string
): Promise<number> {
  if (!hasDb() || !specialtySlug) return 0;
  try {
    await loadDbModules();
    const { db } = _dbMod!;
    const { professionalsIndex } = _schemaMod!;
    const { and, eq, count } = _ormMod!;
    const rows = await db
      .select({ total: count() })
      .from(professionalsIndex)
      .where(
        and(
          eq(professionalsIndex.specialtySlug, specialtySlug),
          eq(professionalsIndex.status, "active")
        )
      );
    return Number(rows[0]?.total ?? 0);
  } catch (err) {
    console.error(
      `[professionals] getProfessionalCountBySpecialty failed: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
    return 0;
  }
}

/** Distinct specialty slugs present in the index — powers sitemap + static params. */
export async function getAllSpecialtySlugs(): Promise<string[]> {
  if (!hasDb()) return [];
  try {
    await loadDbModules();
    const { db } = _dbMod!;
    const { professionalsIndex } = _schemaMod!;
    const { eq, sql } = _ormMod!;
    const rows = await db
      .selectDistinct({ slug: professionalsIndex.specialtySlug })
      .from(professionalsIndex)
      .where(eq(professionalsIndex.status, "active"))
      .orderBy(sql`${professionalsIndex.specialtySlug}`);
    return rows.map((r) => r.slug).filter(Boolean) as string[];
  } catch (err) {
    console.error(
      `[professionals] getAllSpecialtySlugs failed: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
    return [];
  }
}

/** Doctor slugs for a given specialty — powers `generateStaticParams`. */
export async function getProfessionalSlugsBySpecialty(
  specialtySlug: string,
  opts: { limit?: number; requireFacility?: boolean } = {}
): Promise<string[]> {
  if (!hasDb() || !specialtySlug) return [];
  const limit = Math.max(1, Math.min(opts.limit ?? 1000, 5000));
  try {
    await loadDbModules();
    const { db } = _dbMod!;
    const { professionalsIndex } = _schemaMod!;
    const { and, asc, eq, isNotNull } = _ormMod!;
    const conditions = [
      eq(professionalsIndex.specialtySlug, specialtySlug),
      eq(professionalsIndex.status, "active"),
    ];
    if (opts.requireFacility) {
      conditions.push(isNotNull(professionalsIndex.primaryFacilitySlug));
    }
    const rows = await db
      .select({ slug: professionalsIndex.slug })
      .from(professionalsIndex)
      .where(and(...conditions))
      .orderBy(asc(professionalsIndex.name))
      .limit(limit);
    return rows.map((r) => r.slug).filter(Boolean) as string[];
  } catch (err) {
    console.error(
      `[professionals] getProfessionalSlugsBySpecialty failed: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
    return [];
  }
}

/** Related professionals for the profile page: same specialty, same city preferred. */
export async function getRelatedProfessionalsFromIndex(
  doctor: ProfessionalIndexRecord,
  limit = 6
): Promise<ProfessionalIndexRecord[]> {
  if (!hasDb()) return [];
  const cap = Math.max(1, Math.min(limit, 24));
  try {
    await loadDbModules();
    const { db } = _dbMod!;
    const { professionalsIndex } = _schemaMod!;
    const { and, asc, eq, ne } = _ormMod!;
    const conditions = [
      eq(professionalsIndex.specialtySlug, doctor.specialtySlug),
      eq(professionalsIndex.status, "active"),
      ne(professionalsIndex.id, doctor.id),
    ];
    if (doctor.primaryCitySlug) {
      conditions.push(eq(professionalsIndex.primaryCitySlug, doctor.primaryCitySlug));
    }
    const rows = await db
      .select()
      .from(professionalsIndex)
      .where(and(...conditions))
      .orderBy(asc(professionalsIndex.name))
      .limit(cap);
    return rows.map(rowToProfessionalIndexRecord);
  } catch (err) {
    console.error(
      `[professionals] getRelatedProfessionalsFromIndex failed: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
    return [];
  }
}

/**
 * Dentists in a given city — helper for later integration by the
 * /directory/[city]/dental-clinic hub route (Item 4). Not called yet from any
 * page to avoid conflict with that item's owner.
 */
export async function getDentistsByCity(
  citySlug: string,
  opts: { limit?: number } = {}
): Promise<ProfessionalIndexRecord[]> {
  if (!hasDb() || !citySlug) return [];
  const limit = Math.max(1, Math.min(opts.limit ?? 24, 100));
  try {
    await loadDbModules();
    const { db } = _dbMod!;
    const { professionalsIndex } = _schemaMod!;
    const { and, asc, eq } = _ormMod!;
    const rows = await db
      .select()
      .from(professionalsIndex)
      .where(
        and(
          eq(professionalsIndex.discipline, "dentist"),
          eq(professionalsIndex.primaryCitySlug, citySlug),
          eq(professionalsIndex.status, "active")
        )
      )
      .orderBy(asc(professionalsIndex.name))
      .limit(limit);
    return rows.map(rowToProfessionalIndexRecord);
  } catch (err) {
    console.error(
      `[professionals] getDentistsByCity failed: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
    return [];
  }
}

/** Get aggregate stats across all professionals */
export function getAggregateStats() {
  const data = loadData();
  const categories = buildCategoryIndex();
  const specialties = buildSpecialtyIndex();
  const facilities = buildFacilityProfiles();

  const specialtyCounts: { slug: string; name: string; count: number }[] = [];
  for (const [slug, pros] of Array.from(specialties.entries())) {
    const spec = getSpecialtyBySlug(slug);
    if (spec) {
      specialtyCounts.push({ slug, name: spec.name, count: pros.length });
    }
  }
  specialtyCounts.sort((a, b) => b.count - a.count);

  return {
    totalProfessionals: data.length,
    totalCategories: categories.size,
    totalSpecialties: specialties.size,
    totalFacilities: facilities.size,
    categoryCounts: Object.fromEntries(
      Array.from(categories.entries()).map(([k, v]) => [k, v.length])
    ),
    topSpecialties: specialtyCounts.slice(0, 30),
    topFacilities: getAllFacilities(100).slice(0, 20).map((f) => ({
      name: f.name,
      slug: f.slug,
      staff: f.totalStaff,
    })),
  };
}
