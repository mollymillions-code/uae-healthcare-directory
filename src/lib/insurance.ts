/**
 * Insurance Navigator data access layer.
 * Cross-references plan data with provider directory for network stats.
 */

import {
  INSURER_PROFILES,
  getAllPlans,
  getInsurerProfile,
  type InsurancePlan,
  type InsurerProfile,
} from "./constants/insurance-plans";
import {
  getProvidersByInsurance,
  getProviderCountByInsurance,
  getCities,
  getCategories,
} from "./data";

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface NetworkBreakdown {
  citySlug: string;
  cityName: string;
  providerCount: number;
}

export interface CategoryBreakdown {
  categorySlug: string;
  categoryName: string;
  providerCount: number;
}

export interface InsurerNetworkStats {
  slug: string;
  name: string;
  totalProviders: number;
  byCity: NetworkBreakdown[];
  byCategory: CategoryBreakdown[];
}

export interface PlanRecommendation {
  plan: InsurancePlan;
  insurer: InsurerProfile;
  score: number;
  reasons: string[];
  networkSize: number;
}

// ─── Network Stats ──────────────────────────────────────────────────────────────

const networkStatsCache = new Map<string, InsurerNetworkStats>();

export async function getInsurerNetworkStats(insurerSlug: string): Promise<InsurerNetworkStats | undefined> {
  const cached = networkStatsCache.get(insurerSlug);
  if (cached) return cached;

  const profile = getInsurerProfile(insurerSlug);
  if (!profile) return undefined;

  const cities = getCities();
  const categories = getCategories();

  const cityCounts = await Promise.all(
    cities.map((city) => getProviderCountByInsurance(insurerSlug, city.slug))
  );

  const byCity: NetworkBreakdown[] = cities
    .map((city, i) => ({
      citySlug: city.slug,
      cityName: city.name,
      providerCount: cityCounts[i],
    }))
    .filter((c) => c.providerCount > 0)
    .sort((a, b) => b.providerCount - a.providerCount);

  const allProviders = await getProvidersByInsurance(insurerSlug);

  // Count by category
  const catMap = new Map<string, number>();
  for (const p of allProviders) {
    catMap.set(p.categorySlug, (catMap.get(p.categorySlug) || 0) + 1);
  }

  const byCategory: CategoryBreakdown[] = categories
    .filter((cat) => catMap.has(cat.slug))
    .map((cat) => ({
      categorySlug: cat.slug,
      categoryName: cat.name,
      providerCount: catMap.get(cat.slug)!,
    }))
    .sort((a, b) => b.providerCount - a.providerCount);

  const stats: InsurerNetworkStats = {
    slug: profile.slug,
    name: profile.name,
    totalProviders: allProviders.length,
    byCity,
    byCategory,
  };

  networkStatsCache.set(insurerSlug, stats);
  return stats;
}

export async function getAllInsurerNetworkStats(): Promise<InsurerNetworkStats[]> {
  // Process insurers in batches of 4 to avoid overwhelming the DB pool.
  // Each insurer stat makes ~9 queries (8 cities + 1 full scan), so
  // 4 × 9 = 36 concurrent queries is safe for a pool of 12 connections.
  const results: (InsurerNetworkStats | undefined)[] = [];
  const batchSize = 4;
  for (let i = 0; i < INSURER_PROFILES.length; i += batchSize) {
    const batch = INSURER_PROFILES.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map((p) => getInsurerNetworkStats(p.slug)));
    results.push(...batchResults);
  }
  return results.filter(Boolean) as InsurerNetworkStats[];
}

// ─── Plan Comparison ────────────────────────────────────────────────────────────

export function getComparablePlans(planIds: string[]): InsurancePlan[] {
  const all = getAllPlans();
  return planIds.map((id) => all.find((p) => p.id === id)).filter(Boolean) as InsurancePlan[];
}

// ─── Plan Finder / Quiz ─────────────────────────────────────────────────────────

export interface QuizAnswers {
  budget: "low" | "mid" | "high";
  familySize: "single" | "couple" | "family";
  needsDental: boolean;
  needsMaternity: boolean;
  needsInternational: boolean;
  preferredCity: string;
  prioritiseCopay: boolean;
}

export async function recommendPlans(answers: QuizAnswers): Promise<PlanRecommendation[]> {
  const allPlans = getAllPlans();
  const recommendations: PlanRecommendation[] = [];

  for (const plan of allPlans) {
    const insurer = getInsurerProfile(plan.insurerSlug);
    if (!insurer) continue;

    let score = 50; // base score
    const reasons: string[] = [];

    // Budget match
    const avgPremium = (plan.premiumRange.min + plan.premiumRange.max) / 2;
    if (answers.budget === "low" && avgPremium <= 6000) {
      score += 20;
      reasons.push("Fits your budget");
    } else if (answers.budget === "mid" && avgPremium > 5000 && avgPremium <= 16000) {
      score += 20;
      reasons.push("Fits your budget range");
    } else if (answers.budget === "high" && avgPremium > 12000) {
      score += 20;
      reasons.push("Premium coverage for your budget");
    } else if (answers.budget === "low" && avgPremium > 10000) {
      score -= 30;
    } else if (answers.budget === "high" && avgPremium < 5000) {
      score -= 10;
    }

    // Dental
    if (answers.needsDental) {
      if (plan.coverage.dental) {
        score += 15;
        reasons.push(`Dental covered (up to AED ${plan.dentalLimit.toLocaleString()})`);
      } else {
        score -= 20;
      }
    }

    // Maternity
    if (answers.needsMaternity) {
      if (plan.coverage.maternity && plan.maternityWaitMonths >= 0) {
        score += 15;
        if (plan.maternityWaitMonths === 0) {
          score += 10;
          reasons.push("Maternity covered from day 1");
        } else {
          reasons.push(`Maternity after ${plan.maternityWaitMonths}-month wait`);
        }
      } else {
        score -= 25;
      }
    }

    // International coverage
    if (answers.needsInternational) {
      if (plan.coverage.internationalCoverage) {
        score += 15;
        reasons.push("International coverage included");
      } else {
        score -= 15;
      }
    }

    // Co-pay preference
    if (answers.prioritiseCopay) {
      if (plan.copayOutpatient === 0) {
        score += 15;
        reasons.push("Zero co-pay");
      } else if (plan.copayOutpatient <= 10) {
        score += 8;
        reasons.push("Low co-pay (10%)");
      }
    }

    // Network size in preferred city
    const networkSize = answers.preferredCity
      ? await getProviderCountByInsurance(plan.insurerSlug, answers.preferredCity)
      : (await getProvidersByInsurance(plan.insurerSlug)).length;

    if (networkSize > 500) {
      score += 10;
      reasons.push(`Large network (${networkSize} providers)`);
    } else if (networkSize > 100) {
      score += 5;
      reasons.push(`${networkSize} providers in network`);
    }

    // Family value
    if (answers.familySize === "family") {
      if (plan.coverage.dental && plan.coverage.optical && plan.coverage.maternity) {
        score += 10;
        reasons.push("Full family coverage (dental, optical, maternity)");
      }
    }

    if (score > 40) {
      recommendations.push({ plan, insurer, score, reasons, networkSize });
    }
  }

  return recommendations
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);
}

// ─── Re-exports ─────────────────────────────────────────────────────────────────

export {
  INSURER_PROFILES,
  getAllPlans,
  getInsurerProfile,
  type InsurancePlan,
  type InsurerProfile,
} from "./constants/insurance-plans";

export {
  getTierLabel,
  formatPremium,
  formatLimit,
  getPlanById,
  getPlansByTier,
} from "./constants/insurance-plans";
