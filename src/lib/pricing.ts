/**
 * Pricing data access layer.
 * Cross-references procedure pricing with insurance plan data and provider directory.
 */

import {
  getProcedureBySlug,
  formatAed,
  type MedicalProcedure,
  type CityPricing,
} from "./constants/procedures";
import {
  type InsurancePlan,
  type InsurerProfile,
} from "./constants/insurance-plans";
import { getProviders } from "./data";
import { CITIES } from "./constants/cities";
import { getBaseUrl } from "./helpers";

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface OutOfPocketEstimate {
  procedureName: string;
  totalCost: number;
  insurerName: string;
  planName: string;
  planTier: string;
  copayPercent: number;
  estimatedCopay: number;
  estimatedInsurancePays: number;
  annualLimit: number;
  isCovered: boolean;
  coverageNotes: string;
}

export interface CityPricingSummary {
  citySlug: string;
  cityName: string;
  pricing: CityPricing;
  providerCount: number;
}

export interface ProcedureWithStats extends MedicalProcedure {
  /** Cheapest city for this procedure */
  cheapestCity: { slug: string; name: string; typical: number };
  /** Most expensive city */
  mostExpensiveCity: { slug: string; name: string; typical: number };
  /** UAE-wide average typical price */
  averageTypical: number;
}

// ─── Cost Calculator ────────────────────────────────────────────────────────────

/**
 * Estimate out-of-pocket cost for a procedure given an insurance plan.
 */
export function estimateOutOfPocket(
  procedure: MedicalProcedure,
  plan: InsurancePlan,
  insurer: InsurerProfile,
  citySlug?: string
): OutOfPocketEstimate {
  const cityPricing = citySlug
    ? procedure.cityPricing[citySlug]
    : undefined;
  const totalCost = cityPricing?.typical ?? procedure.priceRange.min + Math.round((procedure.priceRange.max - procedure.priceRange.min) * 0.4);

  // Determine if procedure is likely covered based on setting + procedure type
  const isCovered = procedure.insuranceCoverage === "typically-covered" ||
    procedure.insuranceCoverage === "partially-covered";

  // Determine co-pay based on procedure setting
  let copayPercent: number;
  if (!isCovered) {
    copayPercent = 100; // Self-pay
  } else if (procedure.setting === "inpatient") {
    copayPercent = 0; // Most plans have 0% inpatient co-pay
  } else if (procedure.setting === "day-case") {
    copayPercent = Math.min(plan.copayOutpatient, 20);
  } else {
    copayPercent = plan.copayOutpatient;
  }

  const estimatedCopay = Math.round(totalCost * (copayPercent / 100));
  const estimatedInsurancePays = totalCost - estimatedCopay;

  let coverageNotes = procedure.insuranceNotes;
  if (!isCovered) {
    coverageNotes = `This procedure is ${procedure.insuranceCoverage === "not-covered" ? "not" : "rarely"} covered by insurance. Full self-pay expected.`;
  }

  return {
    procedureName: procedure.name,
    totalCost,
    insurerName: insurer.name,
    planName: plan.name,
    planTier: plan.tier,
    copayPercent,
    estimatedCopay,
    estimatedInsurancePays,
    annualLimit: plan.annualLimit,
    isCovered,
    coverageNotes,
  };
}

// ─── City Pricing Summary ───────────────────────────────────────────────────────

/**
 * Get pricing summary for a procedure across all cities.
 */
export async function getProcedureCityPricing(procedureSlug: string): Promise<CityPricingSummary[]> {
  const procedure = getProcedureBySlug(procedureSlug);
  if (!procedure) return [];

  const results = await Promise.all(
    CITIES.map(async (city) => {
      const pricing = procedure.cityPricing[city.slug];
      if (!pricing) return null;

      const { providers } = await getProviders({ citySlug: city.slug });
      // Count providers in the procedure's category
      const categoryProviders = providers.filter(
        (p) => p.categorySlug === procedure.categorySlug
      );

      return {
        citySlug: city.slug,
        cityName: city.name,
        pricing,
        providerCount: categoryProviders.length,
      };
    })
  );
  return results.filter(Boolean) as CityPricingSummary[];
}

/**
 * Get procedure with calculated stats (cheapest/most expensive city, avg).
 */
export function getProcedureWithStats(slug: string): ProcedureWithStats | undefined {
  const procedure = getProcedureBySlug(slug);
  if (!procedure) return undefined;

  const entries = Object.entries(procedure.cityPricing);
  if (entries.length === 0) return undefined;

  let cheapest = { slug: entries[0][0], name: "", typical: Infinity };
  let expensive = { slug: entries[0][0], name: "", typical: 0 };
  let totalTypical = 0;

  for (const [citySlug, pricing] of entries) {
    const city = CITIES.find((c) => c.slug === citySlug);
    if (!city) continue;

    totalTypical += pricing.typical;

    if (pricing.typical < cheapest.typical) {
      cheapest = { slug: citySlug, name: city.name, typical: pricing.typical };
    }
    if (pricing.typical > expensive.typical) {
      expensive = { slug: citySlug, name: city.name, typical: pricing.typical };
    }
  }

  return {
    ...procedure,
    cheapestCity: cheapest,
    mostExpensiveCity: expensive,
    averageTypical: Math.round(totalTypical / entries.length),
  };
}

// ─── SEO Content Generators ─────────────────────────────────────────────────────

/**
 * Generate a natural-language answer block for a procedure page.
 * Optimised for LLM search (AEO) and featured snippets.
 */
export function generateProcedureAnswerBlock(procedure: MedicalProcedure): string {
  const cityEntries = Object.entries(procedure.cityPricing);
  const typicals = cityEntries.map(([, p]) => p.typical);
  const avgTypical = Math.round(typicals.reduce((a, b) => a + b, 0) / typicals.length);

  let answer = `A ${procedure.name.toLowerCase()} in the UAE typically costs ${formatAed(procedure.priceRange.min)} to ${formatAed(procedure.priceRange.max)}, with a typical price of ${formatAed(avgTypical)}.`;

  // City comparison
  const dubaiPricing = procedure.cityPricing["dubai"];
  const sharjahPricing = procedure.cityPricing["sharjah"];
  if (dubaiPricing && sharjahPricing) {
    answer += ` In Dubai, expect to pay around ${formatAed(dubaiPricing.typical)}, while Sharjah averages ${formatAed(sharjahPricing.typical)}.`;
  }

  // Insurance
  if (procedure.insuranceCoverage === "typically-covered") {
    answer += ` This procedure is typically covered by UAE health insurance plans with a co-pay of 10–20%.`;
  } else if (procedure.insuranceCoverage === "partially-covered") {
    answer += ` Insurance coverage varies — enhanced and premium plans may cover this partially.`;
  } else if (procedure.insuranceCoverage === "not-covered") {
    answer += ` This is classified as cosmetic and is not covered by UAE health insurance. Full self-pay applies.`;
  } else {
    answer += ` This procedure is rarely covered by standard UAE insurance plans.`;
  }

  answer += ` Prices reflect data from ${cityEntries.length} UAE cities as of March 2026, sourced from DOH Mandatory Tariff methodology and market-observed ranges.`;

  return answer;
}

/**
 * Generate answer block for a procedure in a specific city.
 */
export function generateCityProcedureAnswerBlock(
  procedure: MedicalProcedure,
  citySlug: string,
  cityName: string,
  providerCount: number
): string {
  const pricing = procedure.cityPricing[citySlug];
  if (!pricing) return "";

  let answer = `A ${procedure.name.toLowerCase()} in ${cityName} costs ${formatAed(pricing.min)} to ${formatAed(pricing.max)}, with a typical price of ${formatAed(pricing.typical)}.`;

  answer += ` There are ${providerCount} ${procedure.categorySlug.replace(/-/g, " ")} providers in ${cityName} listed in the UAE Open Healthcare Directory.`;

  if (procedure.insuranceCoverage === "typically-covered") {
    answer += ` Most health insurance plans in the UAE cover this procedure when medically indicated.`;
  } else if (procedure.insuranceCoverage === "not-covered") {
    answer += ` This is a cosmetic procedure and is not covered by UAE health insurance.`;
  }

  answer += ` Prices vary based on the facility type (government vs. private vs. premium), the doctor's experience, and specific clinical requirements. Data as of March 2026.`;

  return answer;
}

/**
 * Generate FAQs for a procedure page (for schema.org FAQPage + on-page SEO).
 */
export function generateProcedureFaqs(procedure: MedicalProcedure): { question: string; answer: string }[] {
  const avgTypical = Math.round(
    Object.values(procedure.cityPricing).reduce((sum, p) => sum + p.typical, 0) /
    Object.keys(procedure.cityPricing).length
  );
  const dubaiPrice = procedure.cityPricing["dubai"];
  const abuDhabiPrice = procedure.cityPricing["abu-dhabi"];

  return [
    {
      question: `How much does a ${procedure.name.toLowerCase()} cost in the UAE?`,
      answer: `A ${procedure.name.toLowerCase()} in the UAE costs between ${formatAed(procedure.priceRange.min)} and ${formatAed(procedure.priceRange.max)}. The typical price is around ${formatAed(avgTypical)}. Prices vary by city, facility type (government, private, or premium), and clinical complexity. Dubai is generally the most expensive, while northern emirates like Sharjah and Ajman offer lower rates.`,
    },
    ...(dubaiPrice
      ? [{
          question: `How much does a ${procedure.name.toLowerCase()} cost in Dubai?`,
          answer: `In Dubai, a ${procedure.name.toLowerCase()} typically costs ${formatAed(dubaiPrice.typical)}, with a range of ${formatAed(dubaiPrice.min)} to ${formatAed(dubaiPrice.max)}. Premium hospitals in Dubai Healthcare City and Jumeirah tend to charge at the higher end, while clinics in Deira and Al Barsha may offer more competitive pricing.`,
        }]
      : []),
    ...(abuDhabiPrice
      ? [{
          question: `How much does a ${procedure.name.toLowerCase()} cost in Abu Dhabi?`,
          answer: `In Abu Dhabi, a ${procedure.name.toLowerCase()} typically costs ${formatAed(abuDhabiPrice.typical)}, ranging from ${formatAed(abuDhabiPrice.min)} to ${formatAed(abuDhabiPrice.max)}. Pricing in Abu Dhabi is influenced by the DOH Mandatory Tariff (Shafafiya), which sets base rates that providers can multiply by 1x to 3x depending on the facility tier.`,
        }]
      : []),
    {
      question: `Does insurance cover a ${procedure.name.toLowerCase()} in the UAE?`,
      answer: procedure.insuranceNotes,
    },
    {
      question: `What should I expect during a ${procedure.name.toLowerCase()}?`,
      answer: procedure.whatToExpect,
    },
    {
      question: `How long does a ${procedure.name.toLowerCase()} take?`,
      answer: `A ${procedure.name.toLowerCase()} typically takes ${procedure.duration}. ${procedure.recoveryTime !== "No recovery needed" ? `Recovery time is ${procedure.recoveryTime.toLowerCase()}.` : "No recovery time is needed — you can resume normal activities immediately."}`,
    },
  ];
}

/**
 * Generate FAQs for a city-specific procedure page.
 */
export function generateCityProcedureFaqs(
  procedure: MedicalProcedure,
  citySlug: string,
  cityName: string,
  providerCount: number
): { question: string; answer: string }[] {
  const pricing = procedure.cityPricing[citySlug];
  if (!pricing) return [];

  const regulator = citySlug === "dubai"
    ? "Dubai Health Authority (DHA)"
    : (citySlug === "abu-dhabi" || citySlug === "al-ain")
    ? "Department of Health Abu Dhabi (DOH)"
    : "Ministry of Health and Prevention (MOHAP)";

  return [
    {
      question: `How much does a ${procedure.name.toLowerCase()} cost in ${cityName}?`,
      answer: `A ${procedure.name.toLowerCase()} in ${cityName} costs ${formatAed(pricing.min)} to ${formatAed(pricing.max)}, with a typical price of ${formatAed(pricing.typical)}. Pricing depends on the facility type and complexity of the procedure. Healthcare in ${cityName} is regulated by the ${regulator}.`,
    },
    {
      question: `Where can I get a ${procedure.name.toLowerCase()} in ${cityName}?`,
      answer: `There are ${providerCount} ${procedure.categorySlug.replace(/-/g, " ")} providers in ${cityName} listed in the UAE Open Healthcare Directory. Browse listings to compare providers by rating, insurance acceptance, and services offered.`,
    },
    {
      question: `Does insurance cover a ${procedure.name.toLowerCase()} in ${cityName}?`,
      answer: procedure.insuranceNotes,
    },
    {
      question: `What is the cheapest option for a ${procedure.name.toLowerCase()} in ${cityName}?`,
      answer: `The lowest price for a ${procedure.name.toLowerCase()} in ${cityName} starts from ${formatAed(pricing.min)} at government or basic private facilities. For the most competitive pricing, compare multiple providers in the UAE Open Healthcare Directory and confirm the quote directly with the facility before booking.`,
    },
  ];
}

// ─── Schema.org Generators ──────────────────────────────────────────────────────

/**
 * Generate MedicalProcedure + Product/Offers schema for a procedure page.
 */
export function procedureSchema(procedure: MedicalProcedure) {
  const base = getBaseUrl();
  return {
    "@context": "https://schema.org",
    "@type": "MedicalProcedure",
    name: procedure.name,
    alternateName: procedure.nameAr,
    description: procedure.description,
    url: `${base}/pricing/${procedure.slug}`,
    procedureType: procedure.setting === "inpatient" ? "SurgicalProcedure" : "NoninvasiveProcedure",
    howPerformed: procedure.whatToExpect,
    preparation: procedure.anaesthesia !== "none" ? `${procedure.anaesthesia} anaesthesia` : "No anaesthesia required",
    followup: procedure.recoveryTime,
    status: "https://schema.org/EventScheduled",
    code: {
      "@type": "MedicalCode",
      codeValue: procedure.cptCode,
      codingSystem: "CPT",
    },
    estimatedCost: {
      "@type": "MonetaryAmount",
      currency: "AED",
      minValue: procedure.priceRange.min,
      maxValue: procedure.priceRange.max,
    },
  };
}

/**
 * Generate Offers schema for city-specific procedure page (for rich results).
 */
export function procedureCityOffersSchema(
  procedure: MedicalProcedure,
  citySlug: string,
  cityName: string
) {
  const base = getBaseUrl();
  const pricing = procedure.cityPricing[citySlug];
  if (!pricing) return null;

  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `${procedure.name} in ${cityName}`,
    description: `${procedure.name} procedure available in ${cityName}, UAE. Typical cost: AED ${pricing.typical.toLocaleString()}.`,
    url: `${base}/pricing/${procedure.slug}/${citySlug}`,
    provider: {
      "@type": "MedicalOrganization",
      name: "UAE Healthcare Providers",
      areaServed: {
        "@type": "City",
        name: cityName,
        containedInPlace: { "@type": "Country", name: "United Arab Emirates" },
      },
    },
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "AED",
      lowPrice: pricing.min,
      highPrice: pricing.max,
      offerCount: 1,
    },
    areaServed: {
      "@type": "City",
      name: cityName,
    },
  };
}

// ─── Re-exports ─────────────────────────────────────────────────────────────────

export {
  PROCEDURES,
  PROCEDURE_CATEGORIES,
  getProcedureBySlug,
  getProceduresByCategory,
  getProcedureCategoryBySlug,
  searchProcedures,
  formatAed,
  type MedicalProcedure,
  type ProcedureCategory,
  type CityPricing,
} from "./constants/procedures";
