/**
 * Top-N list definitions for programmatic SEO.
 * Every list type × city combination = one unique page.
 */

import { PROCEDURES, PROCEDURE_CATEGORIES, type MedicalProcedure } from "./procedures";
import { CITIES } from "./cities";

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface PricingList {
  slug: string;
  title: string;
  titleTemplate: string; // {city} is replaced
  description: string;
  descriptionTemplate: string;
  /** Function to sort + filter procedures for this list */
  getItems: (citySlug: string) => MedicalProcedure[];
  /** Number of items to show */
  count: 5 | 10;
  /** Sort direction label */
  sortLabel: string;
}

// ─── List Definitions ───────────────────────────────────────────────────────────

export const PRICING_LISTS: PricingList[] = [
  // ── Top 10 Cheapest / Most Expensive (all procedures) ──
  {
    slug: "cheapest-procedures",
    title: "10 Cheapest Medical Procedures in the UAE",
    titleTemplate: "10 Cheapest Medical Procedures in {city}",
    description: "The most affordable medical procedures in the UAE ranked by typical cost. From blood tests to consultations.",
    descriptionTemplate: "The 10 most affordable medical procedures in {city}, UAE, ranked by typical cost. Find the lowest prices and compare with other emirates.",
    getItems: (citySlug) =>
      PROCEDURES.filter((p) => p.cityPricing[citySlug])
        .sort((a, b) => (a.cityPricing[citySlug]?.typical ?? 0) - (b.cityPricing[citySlug]?.typical ?? 0))
        .slice(0, 10),
    count: 10,
    sortLabel: "cheapest first",
  },
  {
    slug: "most-expensive-procedures",
    title: "10 Most Expensive Medical Procedures in the UAE",
    titleTemplate: "10 Most Expensive Medical Procedures in {city}",
    description: "The highest-cost medical procedures in the UAE ranked by typical price. Major surgeries, joint replacements, and specialty treatments.",
    descriptionTemplate: "The 10 most expensive medical procedures in {city}, UAE, ranked by typical cost. Know the costs before you book.",
    getItems: (citySlug) =>
      PROCEDURES.filter((p) => p.cityPricing[citySlug])
        .sort((a, b) => (b.cityPricing[citySlug]?.typical ?? 0) - (a.cityPricing[citySlug]?.typical ?? 0))
        .slice(0, 10),
    count: 10,
    sortLabel: "most expensive first",
  },

  // ── Insurance coverage lists ──
  {
    slug: "procedures-covered-by-insurance",
    title: "Medical Procedures Covered by Insurance in the UAE",
    titleTemplate: "Medical Procedures Covered by Insurance in {city}",
    description: "All medical procedures that are typically covered by UAE health insurance plans, with co-pay estimates.",
    descriptionTemplate: "Medical procedures covered by health insurance in {city}, UAE. Know what your plan covers before your visit.",
    getItems: (citySlug) =>
      PROCEDURES.filter((p) => p.cityPricing[citySlug] && p.insuranceCoverage === "typically-covered")
        .sort((a, b) => (a.cityPricing[citySlug]?.typical ?? 0) - (b.cityPricing[citySlug]?.typical ?? 0)),
    count: 10,
    sortLabel: "cheapest first",
  },
  {
    slug: "procedures-not-covered-by-insurance",
    title: "Medical Procedures NOT Covered by Insurance in the UAE",
    titleTemplate: "Medical Procedures NOT Covered by Insurance in {city}",
    description: "Cosmetic and elective procedures that UAE insurance plans do not cover. Full self-pay required.",
    descriptionTemplate: "Medical procedures not covered by health insurance in {city}, UAE. These are self-pay only — know the costs upfront.",
    getItems: (citySlug) =>
      PROCEDURES.filter((p) => p.cityPricing[citySlug] && (p.insuranceCoverage === "not-covered" || p.insuranceCoverage === "rarely-covered"))
        .sort((a, b) => (a.cityPricing[citySlug]?.typical ?? 0) - (b.cityPricing[citySlug]?.typical ?? 0)),
    count: 10,
    sortLabel: "cheapest first",
  },

  // ── Quick / outpatient vs major surgery ──
  {
    slug: "quick-outpatient-procedures",
    title: "Quick Outpatient Procedures in the UAE — No Hospital Stay",
    titleTemplate: "Quick Outpatient Procedures in {city} — No Hospital Stay",
    description: "Medical procedures you can get done in under an hour with no hospital admission. Walk in, walk out.",
    descriptionTemplate: "Quick outpatient procedures in {city} that require no hospital stay. Get in and out the same day.",
    getItems: (citySlug) =>
      PROCEDURES.filter((p) => p.cityPricing[citySlug] && p.setting === "outpatient")
        .sort((a, b) => (a.cityPricing[citySlug]?.typical ?? 0) - (b.cityPricing[citySlug]?.typical ?? 0)),
    count: 10,
    sortLabel: "cheapest first",
  },
  {
    slug: "major-surgeries",
    title: "Major Surgeries in the UAE — Costs & Recovery Times",
    titleTemplate: "Major Surgeries in {city} — Costs & Recovery Times",
    description: "Major surgical procedures requiring hospital admission in the UAE. Compare costs, recovery times, and insurance coverage.",
    descriptionTemplate: "Major surgeries in {city} requiring hospital admission. Know the costs, recovery times, and insurance coverage before you go.",
    getItems: (citySlug) =>
      PROCEDURES.filter((p) => p.cityPricing[citySlug] && (p.setting === "inpatient" || p.anaesthesia === "general"))
        .sort((a, b) => (b.cityPricing[citySlug]?.typical ?? 0) - (a.cityPricing[citySlug]?.typical ?? 0)),
    count: 10,
    sortLabel: "most expensive first",
  },

  // ── Category-specific cheapest lists ──
  ...PROCEDURE_CATEGORIES.map((cat): PricingList => {
    const categoryMap: Record<string, string[]> = {
      diagnostics: ["radiology-imaging", "labs-diagnostics"],
      dental: ["dental"],
      "eye-care": ["ophthalmology"],
      surgical: ["hospitals", "gastroenterology"],
      orthopedic: ["orthopedics"],
      maternity: ["ob-gyn", "fertility-ivf"],
      cosmetic: ["cosmetic-plastic", "dermatology"],
      cardiac: ["cardiology"],
      wellness: ["clinics"],
      therapy: ["physiotherapy", "mental-health"],
    };
    const dirSlugs = categoryMap[cat.slug] || [];

    return {
      slug: `cheapest-${cat.slug}`,
      title: `Cheapest ${cat.name} in the UAE`,
      titleTemplate: `Cheapest ${cat.name} in {city}`,
      description: `The most affordable ${cat.name.toLowerCase()} in the UAE ranked by cost. Compare prices across all emirates.`,
      descriptionTemplate: `The cheapest ${cat.name.toLowerCase()} in {city}, UAE, ranked by typical cost. Find affordable options near you.`,
      getItems: (citySlug) =>
        PROCEDURES.filter((p) => p.cityPricing[citySlug] && dirSlugs.includes(p.categorySlug))
          .sort((a, b) => (a.cityPricing[citySlug]?.typical ?? 0) - (b.cityPricing[citySlug]?.typical ?? 0)),
      count: 10,
      sortLabel: "cheapest first",
    };
  }),
];

// ─── Utility Functions ──────────────────────────────────────────────────────────

export function getListBySlug(slug: string): PricingList | undefined {
  return PRICING_LISTS.find((l) => l.slug === slug);
}

export function getAllListSlugs(): string[] {
  return PRICING_LISTS.map((l) => l.slug);
}

/** Generate all list × city combinations for static params */
export function getAllListCityParams(): { listType: string; city: string }[] {
  const params: { listType: string; city: string }[] = [];
  for (const list of PRICING_LISTS) {
    for (const city of CITIES) {
      const items = list.getItems(city.slug);
      if (items.length > 0) {
        params.push({ listType: list.slug, city: city.slug });
      }
    }
  }
  return params;
}
