/**
 * Workforce Intelligence — Computed Metrics Layer
 *
 * Builds on top of the professionals data layer to provide
 * labor market analytics: ratios, benchmarks, distributions,
 * concentration indexes, and supply metrics.
 *
 * All functions are synchronous (data loaded from professionals.ts at module init).
 */

import {
  getAllFacilities,
  getProfessionalsByCategory,
  getProfessionalsBySpecialty,
  getProfessionalsByFacility,
  getProfessionalsByArea,
  getProfessionalsByAreaAndSpecialty,
  getAreaStats,
  getSpecialtyStats,
  getSpecialtiesWithBothLevels,
  getSpecialists,
  getConsultants,
  getFacilityProfile,
  getAggregateStats,
  getAllProfessionals,
  type ParsedProfessional,
  type FacilityProfile,
  DUBAI_AREAS,
} from "@/lib/professionals";

import {
  ALL_SPECIALTIES,
  PROFESSIONAL_CATEGORIES,
  PROFESSIONAL_STATS,
  PHYSICIAN_SPECIALTIES,
  DENTIST_SPECIALTIES,
  getSpecialtyBySlug,
  getSpecialtiesByCategory,
} from "@/lib/constants/professionals";

// ─── Constants ──────────────────────────────────────────────────────────────

const DUBAI_POPULATION = 3_660_000; // Estimated Dubai population 2026

// ─── Workforce Ratios ───────────────────────────────────────────────────────

export interface WorkforceRatios {
  population: number;
  physiciansPer100K: number;
  nursesPer100K: number;
  dentistsPer100K: number;
  alliedHealthPer100K: number;
  totalPer100K: number;
  physicianToPopulation: string; // e.g. "1:151"
  nurseToPopulation: string;
  nurseToPhysicianRatio: number; // e.g. 1.44
}

export function getWorkforceRatios(): WorkforceRatios {
  const pop = DUBAI_POPULATION;
  const per100K = (count: number) => Math.round((count / pop) * 100000);
  return {
    population: pop,
    physiciansPer100K: per100K(PROFESSIONAL_STATS.physicians),
    nursesPer100K: per100K(PROFESSIONAL_STATS.nurses),
    dentistsPer100K: per100K(PROFESSIONAL_STATS.dentists),
    alliedHealthPer100K: per100K(PROFESSIONAL_STATS.alliedHealth),
    totalPer100K: per100K(PROFESSIONAL_STATS.total),
    physicianToPopulation: `1:${Math.round(pop / PROFESSIONAL_STATS.physicians)}`,
    nurseToPopulation: `1:${Math.round(pop / PROFESSIONAL_STATS.nurses)}`,
    nurseToPhysicianRatio: Math.round((PROFESSIONAL_STATS.nurses / PROFESSIONAL_STATS.physicians) * 100) / 100,
  };
}

// ─── License Type Breakdown ─────────────────────────────────────────────────

export interface LicenseBreakdown {
  ftl: number;
  reg: number;
  ftlPercent: number;
  regPercent: number;
}

export function getLicenseTypeBreakdown(): LicenseBreakdown {
  const all = getAllProfessionals();
  const ftl = all.filter((p) => p.licenseType === "FTL").length;
  const reg = all.length - ftl;
  return {
    ftl, reg,
    ftlPercent: Math.round((ftl / all.length) * 100),
    regPercent: Math.round((reg / all.length) * 100),
  };
}

export function getLicenseTypeByCategory(categorySlug: string): LicenseBreakdown {
  const pros = getProfessionalsByCategory(categorySlug);
  const ftl = pros.filter((p) => p.licenseType === "FTL").length;
  const reg = pros.length - ftl;
  const total = pros.length || 1;
  return {
    ftl, reg,
    ftlPercent: Math.round((ftl / total) * 100),
    regPercent: Math.round((reg / total) * 100),
  };
}

export function getLicenseTypeBySpecialty(specialtySlug: string): LicenseBreakdown {
  const pros = getProfessionalsBySpecialty(specialtySlug);
  const ftl = pros.filter((p) => p.licenseType === "FTL").length;
  const reg = pros.length - ftl;
  const total = pros.length || 1;
  return {
    ftl, reg,
    ftlPercent: Math.round((ftl / total) * 100),
    regPercent: Math.round((reg / total) * 100),
  };
}

// ─── Category Workforce Profile ─────────────────────────────────────────────

export interface CategoryWorkforceProfile {
  slug: string;
  name: string;
  totalCount: number;
  percentOfWorkforce: number;
  license: LicenseBreakdown;
  topEmployers: { slug: string; name: string; count: number }[];
  specialties: { slug: string; name: string; count: number }[];
  areaDistribution: { slug: string; name: string; count: number }[];
  per100K: number;
}

export function getCategoryWorkforceProfile(categorySlug: string): CategoryWorkforceProfile | null {
  const cat = PROFESSIONAL_CATEGORIES.find((c) => c.slug === categorySlug);
  if (!cat) return null;

  const pros = getProfessionalsByCategory(categorySlug);
  const license = getLicenseTypeByCategory(categorySlug);

  // Top employers
  const facCounts: Record<string, { name: string; count: number }> = {};
  for (const p of pros) {
    if (!p.facilitySlug) continue;
    if (!facCounts[p.facilitySlug]) facCounts[p.facilitySlug] = { name: p.facilityName, count: 0 };
    facCounts[p.facilitySlug].count++;
  }
  const topEmployers = Object.entries(facCounts)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 20)
    .map(([slug, { name, count }]) => ({ slug, name, count }));

  // Specialties
  const specCounts: Record<string, number> = {};
  for (const p of pros) {
    if (p.specialtySlug) specCounts[p.specialtySlug] = (specCounts[p.specialtySlug] || 0) + 1;
  }
  const specialties = Object.entries(specCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([slug, count]) => {
      const spec = getSpecialtyBySlug(slug);
      return { slug, name: spec?.name || slug, count };
    });

  // Area distribution
  const areaCounts: Record<string, number> = {};
  for (const area of DUBAI_AREAS) {
    const areaPros = getProfessionalsByArea(area.slug).filter((p) => p.categorySlug === categorySlug);
    if (areaPros.length > 0) areaCounts[area.slug] = areaPros.length;
  }
  const areaDistribution = Object.entries(areaCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([slug, count]) => {
      const area = DUBAI_AREAS.find((a) => a.slug === slug);
      return { slug, name: area?.name || slug, count };
    });

  return {
    slug: cat.slug,
    name: cat.name,
    totalCount: pros.length,
    percentOfWorkforce: Math.round((pros.length / PROFESSIONAL_STATS.total) * 100),
    license,
    topEmployers,
    specialties,
    areaDistribution,
    per100K: Math.round((pros.length / DUBAI_POPULATION) * 100000),
  };
}

// ─── Specialty Workforce Metrics ────────────────────────────────────────────

export interface SpecialtyWorkforceMetrics {
  slug: string;
  name: string;
  category: string;
  totalCount: number;
  per100K: number;
  license: LicenseBreakdown;
  specialists: number;
  consultants: number;
  consultantRatio: number; // consultants / (specialists + consultants)
  topFacilities: { slug: string; name: string; count: number; totalStaff: number }[];
  areaDistribution: { slug: string; name: string; count: number }[];
  concentrationIndex: number; // % of professionals in top 3 areas
}

export function getSpecialtyWorkforceMetrics(specialtySlug: string): SpecialtyWorkforceMetrics | null {
  const spec = getSpecialtyBySlug(specialtySlug);
  if (!spec) return null;

  const pros = getProfessionalsBySpecialty(specialtySlug);
  if (pros.length === 0) return null;

  const license = getLicenseTypeBySpecialty(specialtySlug);
  const specialists = getSpecialists(specialtySlug).length;
  const consultants = getConsultants(specialtySlug).length;
  const stats = getSpecialtyStats(specialtySlug);

  // Area distribution
  const areaCounts: { slug: string; name: string; count: number }[] = [];
  for (const area of DUBAI_AREAS) {
    const count = getProfessionalsByAreaAndSpecialty(area.slug, specialtySlug).length;
    if (count > 0) areaCounts.push({ slug: area.slug, name: area.name, count });
  }
  areaCounts.sort((a, b) => b.count - a.count);

  // Concentration: % in top 3 areas
  const totalInAreas = areaCounts.reduce((sum, a) => sum + a.count, 0);
  const top3Count = areaCounts.slice(0, 3).reduce((sum, a) => sum + a.count, 0);
  const concentrationIndex = totalInAreas > 0 ? Math.round((top3Count / totalInAreas) * 100) : 0;

  const topFacilities = stats.topFacilities.slice(0, 10).map((f) => {
    const profile = getFacilityProfile(f.slug);
    return { ...f, totalStaff: profile?.totalStaff || 0 };
  });

  return {
    slug: spec.slug,
    name: spec.name,
    category: spec.category,
    totalCount: pros.length,
    per100K: Math.round((pros.length / DUBAI_POPULATION) * 100000),
    license,
    specialists,
    consultants,
    consultantRatio: (specialists + consultants) > 0 ? Math.round((consultants / (specialists + consultants)) * 100) : 0,
    topFacilities,
    areaDistribution: areaCounts,
    concentrationIndex,
  };
}

// ─── Facility Benchmarks ────────────────────────────────────────────────────

export interface FacilityBenchmarks {
  slug: string;
  name: string;
  totalStaff: number;
  physicians: number;
  dentists: number;
  nurses: number;
  alliedHealth: number;
  nurseToDoctorRatio: number;
  ftlRate: number;
  specialtyBreadth: number; // unique specialties
  sizeTier: "mega" | "large" | "mid" | "small" | "micro";
  categories: Record<string, number>;
  topSpecialties: { slug: string; name: string; count: number }[];
}

export function getFacilityBenchmarks(facilitySlug: string): FacilityBenchmarks | null {
  const profile = getFacilityProfile(facilitySlug);
  if (!profile) return null;

  const pros = getProfessionalsByFacility(facilitySlug);
  const physicians = pros.filter((p) => p.categorySlug === "physicians").length;
  const dentists = pros.filter((p) => p.categorySlug === "dentists").length;
  const nurses = pros.filter((p) => p.categorySlug === "nurses").length;
  const alliedHealth = pros.filter((p) => p.categorySlug === "allied-health").length;
  const doctors = physicians + dentists;
  const ftl = pros.filter((p) => p.licenseType === "FTL").length;

  const sizeTier = profile.totalStaff >= 500 ? "mega" :
    profile.totalStaff >= 100 ? "large" :
    profile.totalStaff >= 20 ? "mid" :
    profile.totalStaff >= 5 ? "small" : "micro";

  return {
    slug: profile.slug,
    name: profile.name,
    totalStaff: profile.totalStaff,
    physicians, dentists, nurses, alliedHealth,
    nurseToDoctorRatio: doctors > 0 ? Math.round((nurses / doctors) * 100) / 100 : 0,
    ftlRate: pros.length > 0 ? Math.round((ftl / pros.length) * 100) : 0,
    specialtyBreadth: Object.keys(profile.specialties).length,
    sizeTier,
    categories: profile.categories,
    topSpecialties: profile.topSpecialties,
  };
}

// ─── Top Employers by Category ──────────────────────────────────────────────

export function getTopEmployersByCategory(
  categorySlug: string,
  limit = 50
): { slug: string; name: string; count: number; totalStaff: number }[] {
  const pros = getProfessionalsByCategory(categorySlug);
  const counts: Record<string, { name: string; count: number }> = {};
  for (const p of pros) {
    if (!p.facilitySlug) continue;
    if (!counts[p.facilitySlug]) counts[p.facilitySlug] = { name: p.facilityName, count: 0 };
    counts[p.facilitySlug].count++;
  }
  return Object.entries(counts)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, limit)
    .map(([slug, { name, count }]) => {
      const profile = getFacilityProfile(slug);
      return { slug, name, count, totalStaff: profile?.totalStaff || 0 };
    });
}

// ─── Area Workforce Profile ─────────────────────────────────────────────────

export interface AreaWorkforceProfile {
  slug: string;
  name: string;
  totalCount: number;
  categories: { slug: string; name: string; count: number }[];
  license: LicenseBreakdown;
  topSpecialties: { slug: string; name: string; count: number }[];
  topFacilities: { slug: string; name: string; count: number }[];
  per100K: number;
}

export function getAreaWorkforceProfile(areaSlug: string): AreaWorkforceProfile | null {
  const area = DUBAI_AREAS.find((a) => a.slug === areaSlug);
  if (!area) return null;

  const pros = getProfessionalsByArea(areaSlug);
  if (pros.length === 0) return null;

  // Categories
  const catCounts: Record<string, number> = {};
  for (const p of pros) catCounts[p.categorySlug] = (catCounts[p.categorySlug] || 0) + 1;
  const categories = PROFESSIONAL_CATEGORIES
    .map((c) => ({ slug: c.slug, name: c.name, count: catCounts[c.slug] || 0 }))
    .filter((c) => c.count > 0);

  // License
  const ftl = pros.filter((p) => p.licenseType === "FTL").length;
  const reg = pros.length - ftl;
  const license: LicenseBreakdown = {
    ftl, reg,
    ftlPercent: Math.round((ftl / pros.length) * 100),
    regPercent: Math.round((reg / pros.length) * 100),
  };

  // Top specialties
  const specCounts: Record<string, number> = {};
  for (const p of pros) {
    if (p.specialtySlug) specCounts[p.specialtySlug] = (specCounts[p.specialtySlug] || 0) + 1;
  }
  const topSpecialties = Object.entries(specCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([slug, count]) => {
      const spec = getSpecialtyBySlug(slug);
      return { slug, name: spec?.name || slug, count };
    });

  // Top facilities
  const facCounts: Record<string, { name: string; count: number }> = {};
  for (const p of pros) {
    if (!p.facilitySlug) continue;
    if (!facCounts[p.facilitySlug]) facCounts[p.facilitySlug] = { name: p.facilityName, count: 0 };
    facCounts[p.facilitySlug].count++;
  }
  const topFacilities = Object.entries(facCounts)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10)
    .map(([slug, { name, count }]) => ({ slug, name, count }));

  return {
    slug: area.slug,
    name: area.name,
    totalCount: pros.length,
    categories,
    license,
    topSpecialties,
    topFacilities,
    per100K: Math.round((pros.length / DUBAI_POPULATION) * 100000),
  };
}

// ─── Professionals by Area and Category ─────────────────────────────────────

export function getProfessionalsByAreaAndCategory(areaSlug: string, categorySlug: string): ParsedProfessional[] {
  return getProfessionalsByArea(areaSlug).filter((p) => p.categorySlug === categorySlug);
}

// ─── Nurse-to-Doctor Ratios by Facility ─────────────────────────────────────

export interface FacilityNurseDoctorRatio {
  slug: string;
  name: string;
  totalStaff: number;
  doctors: number;
  nurses: number;
  ratio: number;
}

export function getNurseToDoctorRatios(minStaff = 20): FacilityNurseDoctorRatio[] {
  const facilities = getAllFacilities(minStaff);
  const results: FacilityNurseDoctorRatio[] = [];

  for (const fac of facilities) {
    const doctors = (fac.categories["physicians"] || 0) + (fac.categories["dentists"] || 0);
    const nurses = fac.categories["nurses"] || 0;
    if (doctors > 0 && nurses > 0) {
      results.push({
        slug: fac.slug,
        name: fac.name,
        totalStaff: fac.totalStaff,
        doctors,
        nurses,
        ratio: Math.round((nurses / doctors) * 100) / 100,
      });
    }
  }

  return results.sort((a, b) => b.ratio - a.ratio);
}

// ─── Per-Capita Specialty Rates ─────────────────────────────────────────────

export interface SpecialtyPerCapita {
  slug: string;
  name: string;
  category: string;
  count: number;
  per100K: number;
}

export function getSpecialistPerCapita(): SpecialtyPerCapita[] {
  return ALL_SPECIALTIES
    .filter((s) => s.count >= 10)
    .map((s) => ({
      slug: s.slug,
      name: s.name,
      category: s.category,
      count: s.count,
      per100K: Math.round((s.count / DUBAI_POPULATION) * 100000 * 10) / 10,
    }))
    .sort((a, b) => b.per100K - a.per100K);
}

// ─── FTL Rate by Dimension ──────────────────────────────────────────────────

export interface FTLRate {
  slug: string;
  name: string;
  total: number;
  ftl: number;
  ftlRate: number;
}

export function getFTLRateBySpecialty(): FTLRate[] {
  return ALL_SPECIALTIES
    .filter((s) => s.count >= 20)
    .map((s) => {
      const pros = getProfessionalsBySpecialty(s.slug);
      const ftl = pros.filter((p) => p.licenseType === "FTL").length;
      return {
        slug: s.slug,
        name: s.name,
        total: pros.length,
        ftl,
        ftlRate: pros.length > 0 ? Math.round((ftl / pros.length) * 100) : 0,
      };
    })
    .sort((a, b) => b.ftlRate - a.ftlRate);
}

export function getFTLRateByArea(): FTLRate[] {
  const areas = getAreaStats();
  return areas.map((area) => {
    const pros = getProfessionalsByArea(area.slug);
    const ftl = pros.filter((p) => p.licenseType === "FTL").length;
    return {
      slug: area.slug,
      name: area.name,
      total: pros.length,
      ftl,
      ftlRate: pros.length > 0 ? Math.round((ftl / pros.length) * 100) : 0,
    };
  }).sort((a, b) => b.ftlRate - a.ftlRate);
}

// ─── Specialty Geographic Concentration ─────────────────────────────────────

export interface SpecialtyConcentration {
  slug: string;
  name: string;
  totalInAreas: number;
  top3Areas: { slug: string; name: string; count: number }[];
  top3Percent: number;
}

export function getSpecialtyConcentration(): SpecialtyConcentration[] {
  return ALL_SPECIALTIES
    .filter((s) => s.count >= 20)
    .map((s) => {
      const areaCounts: { slug: string; name: string; count: number }[] = [];
      for (const area of DUBAI_AREAS) {
        const count = getProfessionalsByAreaAndSpecialty(area.slug, s.slug).length;
        if (count > 0) areaCounts.push({ slug: area.slug, name: area.name, count });
      }
      areaCounts.sort((a, b) => b.count - a.count);
      const totalInAreas = areaCounts.reduce((sum, a) => sum + a.count, 0);
      const top3 = areaCounts.slice(0, 3);
      const top3Count = top3.reduce((sum, a) => sum + a.count, 0);
      return {
        slug: s.slug,
        name: s.name,
        totalInAreas,
        top3Areas: top3,
        top3Percent: totalInAreas > 0 ? Math.round((top3Count / totalInAreas) * 100) : 0,
      };
    })
    .filter((s) => s.totalInAreas > 0)
    .sort((a, b) => b.top3Percent - a.top3Percent);
}

// ─── Facility Specialty Breadth ─────────────────────────────────────────────

export function getFacilitySpecialtyBreadth(minStaff = 20): { slug: string; name: string; totalStaff: number; specialtyCount: number }[] {
  return getAllFacilities(minStaff)
    .map((f) => ({
      slug: f.slug,
      name: f.name,
      totalStaff: f.totalStaff,
      specialtyCount: Object.keys(f.specialties).length,
    }))
    .sort((a, b) => b.specialtyCount - a.specialtyCount);
}

// ─── Facility Size Distribution ─────────────────────────────────────────────

export interface FacilitySizeDistribution {
  mega: number;   // 500+
  large: number;  // 100-499
  mid: number;    // 20-99
  small: number;  // 5-19
  micro: number;  // <5
  total: number;
  medianStaff: number;
  averageStaff: number;
}

export function getFacilitySizeDistribution(): FacilitySizeDistribution {
  const all = getAllFacilities(1);
  const sizes = all.map((f) => f.totalStaff).sort((a, b) => a - b);
  return {
    mega: all.filter((f) => f.totalStaff >= 500).length,
    large: all.filter((f) => f.totalStaff >= 100 && f.totalStaff < 500).length,
    mid: all.filter((f) => f.totalStaff >= 20 && f.totalStaff < 100).length,
    small: all.filter((f) => f.totalStaff >= 5 && f.totalStaff < 20).length,
    micro: all.filter((f) => f.totalStaff < 5).length,
    total: all.length,
    medianStaff: sizes.length > 0 ? sizes[Math.floor(sizes.length / 2)] : 0,
    averageStaff: sizes.length > 0 ? Math.round(sizes.reduce((s, v) => s + v, 0) / sizes.length) : 0,
  };
}

// ─── Specialty Supply Metrics ───────────────────────────────────────────────

export interface SpecialtySupplyMetrics {
  slug: string;
  name: string;
  totalCount: number;
  per100K: number;
  facilityCount: number;
  topFacilityShare: number; // % of specialty held by top facility
  areasCovered: number;
  geographicGaps: string[]; // areas with 0 coverage
}

export function getSpecialtySupplyMetrics(specialtySlug: string): SpecialtySupplyMetrics | null {
  const spec = getSpecialtyBySlug(specialtySlug);
  if (!spec) return null;

  const stats = getSpecialtyStats(specialtySlug);
  const topFacShare = stats.topFacilities.length > 0
    ? Math.round((stats.topFacilities[0].count / stats.totalProfessionals) * 100)
    : 0;

  const coveredAreas: string[] = [];
  const gaps: string[] = [];
  for (const area of DUBAI_AREAS) {
    const count = getProfessionalsByAreaAndSpecialty(area.slug, specialtySlug).length;
    if (count > 0) coveredAreas.push(area.slug);
    else gaps.push(area.name);
  }

  return {
    slug: spec.slug,
    name: spec.name,
    totalCount: stats.totalProfessionals,
    per100K: Math.round((stats.totalProfessionals / DUBAI_POPULATION) * 100000 * 10) / 10,
    facilityCount: stats.topFacilities.length,
    topFacilityShare: topFacShare,
    areasCovered: coveredAreas.length,
    geographicGaps: gaps.slice(0, 10),
  };
}

// ─── Comparison Helpers ─────────────────────────────────────────────────────

/** Get top N areas by professional count for generating comparison pairs */
export function getTopAreas(limit = 10): { slug: string; name: string; count: number }[] {
  return getAreaStats().slice(0, limit);
}

/** Get top N facilities for generating comparison pairs */
export function getTopFacilities(limit = 20): FacilityProfile[] {
  return getAllFacilities(20).slice(0, limit);
}

// ─── Re-exports for convenience ─────────────────────────────────────────────

export {
  DUBAI_AREAS,
  DUBAI_POPULATION,
  ALL_SPECIALTIES,
  PROFESSIONAL_CATEGORIES,
  PROFESSIONAL_STATS,
  PHYSICIAN_SPECIALTIES,
  DENTIST_SPECIALTIES,
  getSpecialtyBySlug,
  getSpecialtiesByCategory,
  getAreaStats,
  getAllFacilities,
  getSpecialtiesWithBothLevels,
  getAggregateStats,
  getAllProfessionals,
  getProfessionalsByCategory,
  getProfessionalsBySpecialty,
  getProfessionalsByFacility,
  getProfessionalsByArea,
  getProfessionalsByAreaAndSpecialty,
  getFacilityProfile,
  getSpecialtyStats,
  getSpecialists,
  getConsultants,
  type ParsedProfessional,
  type FacilityProfile,
};
