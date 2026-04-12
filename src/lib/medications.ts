/**
 * Data access layer for the medication-pharmacy intent graph.
 *
 * All functions are ASYNC (DB-backed via Drizzle ORM).
 * Mirrors the pattern in src/lib/data.ts and src/lib/professionals.ts.
 */

import { db } from "@/lib/db";
import {
  medications,
  medicationBrands,
  medicationClasses,
} from "@/lib/db/schema";
import { eq, and, desc, asc, count } from "drizzle-orm";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface Medication {
  id: number;
  slug: string;
  genericName: string;
  genericNameAr: string | null;
  classSlug: string | null;
  rxStatus: string;
  description: string | null;
  shortDescription: string | null;
  commonConditions: string[];
  commonSpecialties: string[];
  labMonitoringNotes: string[];
  genericSubstitutionNote: string | null;
  insurerNote: string | null;
  isPrescriptionRequired: boolean;
  hasGenericEquivalent: boolean;
  requiresMonitoringLabs: boolean;
  isHighIntent: boolean;
  isCitySensitive: boolean;
  pageState: string;
  status: string;
}

export interface MedicationBrand {
  id: number;
  slug: string;
  brandName: string;
  brandNameAr: string | null;
  genericSlug: string;
  manufacturer: string | null;
  description: string | null;
  shortDescription: string | null;
  isCanonicalBrand: boolean;
  isHighIntent: boolean;
  pageState: string;
  status: string;
}

export interface MedicationClass {
  id: number;
  slug: string;
  name: string;
  nameAr: string | null;
  description: string | null;
  shortDescription: string | null;
  sortOrder: number;
}

// ─── Row mappers ────────────────────────────────────────────────────────────

function rowToMedication(row: Record<string, unknown>): Medication {
  return {
    id: Number(row.id),
    slug: String(row.slug ?? ""),
    genericName: String(row.genericName ?? row.generic_name ?? ""),
    genericNameAr: (row.genericNameAr ?? row.generic_name_ar ?? null) as string | null,
    classSlug: (row.classSlug ?? row.class_slug ?? null) as string | null,
    rxStatus: String(row.rxStatus ?? row.rx_status ?? "prescription"),
    description: (row.description ?? null) as string | null,
    shortDescription: (row.shortDescription ?? row.short_description ?? null) as string | null,
    commonConditions: (row.commonConditions ?? row.common_conditions ?? []) as string[],
    commonSpecialties: (row.commonSpecialties ?? row.common_specialties ?? []) as string[],
    labMonitoringNotes: (row.labMonitoringNotes ?? row.lab_monitoring_notes ?? []) as string[],
    genericSubstitutionNote: (row.genericSubstitutionNote ?? row.generic_substitution_note ?? null) as string | null,
    insurerNote: (row.insurerNote ?? row.insurer_note ?? null) as string | null,
    isPrescriptionRequired: Boolean(row.isPrescriptionRequired ?? row.is_prescription_required ?? true),
    hasGenericEquivalent: Boolean(row.hasGenericEquivalent ?? row.has_generic_equivalent ?? false),
    requiresMonitoringLabs: Boolean(row.requiresMonitoringLabs ?? row.requires_monitoring_labs ?? false),
    isHighIntent: Boolean(row.isHighIntent ?? row.is_high_intent ?? false),
    isCitySensitive: Boolean(row.isCitySensitive ?? row.is_city_sensitive ?? false),
    pageState: String(row.pageState ?? row.page_state ?? "canonical"),
    status: String(row.status ?? "active"),
  };
}

function rowToBrand(row: Record<string, unknown>): MedicationBrand {
  return {
    id: Number(row.id),
    slug: String(row.slug ?? ""),
    brandName: String(row.brandName ?? row.brand_name ?? ""),
    brandNameAr: (row.brandNameAr ?? row.brand_name_ar ?? null) as string | null,
    genericSlug: String(row.genericSlug ?? row.generic_slug ?? ""),
    manufacturer: (row.manufacturer ?? null) as string | null,
    description: (row.description ?? null) as string | null,
    shortDescription: (row.shortDescription ?? row.short_description ?? null) as string | null,
    isCanonicalBrand: Boolean(row.isCanonicalBrand ?? row.is_canonical_brand ?? false),
    isHighIntent: Boolean(row.isHighIntent ?? row.is_high_intent ?? false),
    pageState: String(row.pageState ?? row.page_state ?? "canonical"),
    status: String(row.status ?? "active"),
  };
}

function rowToClass(row: Record<string, unknown>): MedicationClass {
  return {
    id: Number(row.id),
    slug: String(row.slug ?? ""),
    name: String(row.name ?? ""),
    nameAr: (row.nameAr ?? row.name_ar ?? null) as string | null,
    description: (row.description ?? null) as string | null,
    shortDescription: (row.shortDescription ?? row.short_description ?? null) as string | null,
    sortOrder: Number(row.sortOrder ?? row.sort_order ?? 0),
  };
}

// ─── Medication queries ─────────────────────────────────────────────────────

export async function getMedicationBySlug(slug: string): Promise<Medication | null> {
  try {
    const rows = await db
      .select()
      .from(medications)
      .where(and(eq(medications.slug, slug), eq(medications.status, "active")))
      .limit(1);
    return rows.length > 0 ? rowToMedication(rows[0]) : null;
  } catch (err) {
    console.error(`[medications] getMedicationBySlug(${slug}) failed:`, err instanceof Error ? err.message : err);
    return null;
  }
}

export async function getAllMedications(): Promise<Medication[]> {
  try {
    const rows = await db
      .select()
      .from(medications)
      .where(eq(medications.status, "active"))
      .orderBy(asc(medications.genericName));
    return rows.map(rowToMedication);
  } catch (err) {
    console.error("[medications] getAllMedications failed:", err instanceof Error ? err.message : err);
    return [];
  }
}

export async function getMedicationsByClass(classSlug: string): Promise<Medication[]> {
  try {
    const rows = await db
      .select()
      .from(medications)
      .where(and(eq(medications.classSlug, classSlug), eq(medications.status, "active")))
      .orderBy(asc(medications.genericName));
    return rows.map(rowToMedication);
  } catch (err) {
    console.error(`[medications] getMedicationsByClass(${classSlug}) failed:`, err instanceof Error ? err.message : err);
    return [];
  }
}

export async function getHighIntentMedications(limit = 20): Promise<Medication[]> {
  try {
    const rows = await db
      .select()
      .from(medications)
      .where(and(eq(medications.isHighIntent, true), eq(medications.status, "active")))
      .orderBy(asc(medications.genericName))
      .limit(limit);
    return rows.map(rowToMedication);
  } catch (err) {
    console.error("[medications] getHighIntentMedications failed:", err instanceof Error ? err.message : err);
    return [];
  }
}

export async function getMedicationCount(): Promise<number> {
  try {
    const rows = await db.select({ total: count() }).from(medications).where(eq(medications.status, "active"));
    return Number(rows[0]?.total ?? 0);
  } catch {
    return 0;
  }
}

export async function getAllMedicationSlugs(): Promise<string[]> {
  try {
    const rows = await db
      .select({ slug: medications.slug })
      .from(medications)
      .where(eq(medications.status, "active"));
    return rows.map(r => r.slug);
  } catch {
    return [];
  }
}

// ─── Brand queries ──────────────────────────────────────────────────────────

export async function getBrandBySlug(slug: string): Promise<MedicationBrand | null> {
  try {
    const rows = await db
      .select()
      .from(medicationBrands)
      .where(and(eq(medicationBrands.slug, slug), eq(medicationBrands.status, "active")))
      .limit(1);
    return rows.length > 0 ? rowToBrand(rows[0]) : null;
  } catch (err) {
    console.error(`[medications] getBrandBySlug(${slug}) failed:`, err instanceof Error ? err.message : err);
    return null;
  }
}

export async function getBrandsByGeneric(genericSlug: string): Promise<MedicationBrand[]> {
  try {
    const rows = await db
      .select()
      .from(medicationBrands)
      .where(and(eq(medicationBrands.genericSlug, genericSlug), eq(medicationBrands.status, "active")))
      .orderBy(desc(medicationBrands.isHighIntent), asc(medicationBrands.brandName));
    return rows.map(rowToBrand);
  } catch (err) {
    console.error(`[medications] getBrandsByGeneric(${genericSlug}) failed:`, err instanceof Error ? err.message : err);
    return [];
  }
}

export async function getAllBrands(): Promise<MedicationBrand[]> {
  try {
    const rows = await db
      .select()
      .from(medicationBrands)
      .where(eq(medicationBrands.status, "active"))
      .orderBy(asc(medicationBrands.brandName));
    return rows.map(rowToBrand);
  } catch (err) {
    console.error("[medications] getAllBrands failed:", err instanceof Error ? err.message : err);
    return [];
  }
}

export async function getAllBrandSlugs(): Promise<string[]> {
  try {
    const rows = await db
      .select({ slug: medicationBrands.slug })
      .from(medicationBrands)
      .where(eq(medicationBrands.status, "active"));
    return rows.map(r => r.slug);
  } catch {
    return [];
  }
}

export async function getBrandCount(): Promise<number> {
  try {
    const rows = await db.select({ total: count() }).from(medicationBrands).where(eq(medicationBrands.status, "active"));
    return Number(rows[0]?.total ?? 0);
  } catch {
    return 0;
  }
}

// ─── Class queries ──────────────────────────────────────────────────────────

export async function getMedicationClassBySlug(slug: string): Promise<MedicationClass | null> {
  try {
    const rows = await db
      .select()
      .from(medicationClasses)
      .where(eq(medicationClasses.slug, slug))
      .limit(1);
    return rows.length > 0 ? rowToClass(rows[0]) : null;
  } catch (err) {
    console.error(`[medications] getMedicationClassBySlug(${slug}) failed:`, err instanceof Error ? err.message : err);
    return null;
  }
}

export async function getAllMedicationClasses(): Promise<MedicationClass[]> {
  try {
    const rows = await db
      .select()
      .from(medicationClasses)
      .orderBy(asc(medicationClasses.sortOrder), asc(medicationClasses.name));
    return rows.map(rowToClass);
  } catch (err) {
    console.error("[medications] getAllMedicationClasses failed:", err instanceof Error ? err.message : err);
    return [];
  }
}

export async function getAllClassSlugs(): Promise<string[]> {
  try {
    const rows = await db
      .select({ slug: medicationClasses.slug })
      .from(medicationClasses);
    return rows.map(r => r.slug);
  } catch {
    return [];
  }
}

export async function getClassCount(): Promise<number> {
  try {
    const rows = await db.select({ total: count() }).from(medicationClasses);
    return Number(rows[0]?.total ?? 0);
  } catch {
    return 0;
  }
}

// ─── Cross-entity helpers ───────────────────────────────────────────────────

export async function getMedicationWithBrands(slug: string): Promise<{
  medication: Medication;
  brands: MedicationBrand[];
  medicationClass: MedicationClass | null;
} | null> {
  const medication = await getMedicationBySlug(slug);
  if (!medication) return null;

  const [brands, medicationClass] = await Promise.all([
    getBrandsByGeneric(medication.slug),
    medication.classSlug ? getMedicationClassBySlug(medication.classSlug) : Promise.resolve(null),
  ]);

  return { medication, brands, medicationClass };
}

// ─── Bridge helpers (Phase 3) ───────────────────────────────────────────────

/**
 * Get all unique conditions across all active medications, with counts.
 * Derived from the commonConditions JSONB array on each medication.
 */
export async function getAllConditionsWithMedications(): Promise<
  { condition: string; slug: string; medications: Medication[] }[]
> {
  const allMeds = await getAllMedications();
  const condMap = new Map<string, Medication[]>();

  for (const med of allMeds) {
    for (const condition of med.commonConditions) {
      if (!condMap.has(condition)) condMap.set(condition, []);
      condMap.get(condition)!.push(med);
    }
  }

  return Array.from(condMap.entries())
    .map(([condition, meds]) => ({
      condition: condition.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
      slug: condition,
      medications: meds,
    }))
    .sort((a, b) => b.medications.length - a.medications.length);
}

/**
 * Get medications for a specific condition slug.
 */
export async function getMedicationsByCondition(conditionSlug: string): Promise<Medication[]> {
  const allMeds = await getAllMedications();
  return allMeds.filter(m => m.commonConditions.includes(conditionSlug));
}

/**
 * Get all unique specialties across all active medications, with counts.
 */
export async function getAllSpecialtiesWithMedications(): Promise<
  { specialty: string; slug: string; medications: Medication[] }[]
> {
  const allMeds = await getAllMedications();
  const specMap = new Map<string, Medication[]>();

  for (const med of allMeds) {
    for (const spec of med.commonSpecialties) {
      if (!specMap.has(spec)) specMap.set(spec, []);
      specMap.get(spec)!.push(med);
    }
  }

  return Array.from(specMap.entries())
    .map(([specialty, meds]) => ({
      specialty: specialty.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
      slug: specialty,
      medications: meds,
    }))
    .sort((a, b) => b.medications.length - a.medications.length);
}

/**
 * Get medications commonly prescribed by a specific specialty.
 */
export async function getMedicationsBySpecialty(specialtySlug: string): Promise<Medication[]> {
  const allMeds = await getAllMedications();
  return allMeds.filter(m => m.commonSpecialties.includes(specialtySlug));
}

/**
 * Get alternative medications (same class, different generic).
 */
export async function getAlternativeMedications(slug: string): Promise<{
  medication: Medication;
  alternatives: Medication[];
  medicationClass: MedicationClass | null;
} | null> {
  const medication = await getMedicationBySlug(slug);
  if (!medication || !medication.classSlug) return null;

  const [classMeds, medicationClass] = await Promise.all([
    getMedicationsByClass(medication.classSlug),
    getMedicationClassBySlug(medication.classSlug),
  ]);

  const alternatives = classMeds.filter(m => m.slug !== medication.slug);
  return { medication, alternatives, medicationClass };
}
