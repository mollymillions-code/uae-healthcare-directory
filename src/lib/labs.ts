/**
 * Lab Test & Diagnostic Price Comparison data access layer.
 * Provides query, filter, and comparison functions for lab data.
 */

import {
  LAB_PROFILES,
  LAB_TESTS,
  LAB_TEST_PRICES,
  HEALTH_PACKAGES,
  getLabProfile,
  getLabTest,
  getPricesForTest,
  getPricesForLab,
  getPriceRange,
  type LabProfile,
  type LabTest,
  type LabTestPrice,
} from "./constants/labs";

// ─── Re-exports ─────────────────────────────────────────────────────────────────

export {
  LAB_PROFILES,
  LAB_TESTS,
  LAB_TEST_PRICES,
  HEALTH_PACKAGES,
  TEST_CATEGORIES,
  getLabProfile,
  getLabTest,
  getPricesForTest,
  getPricesForLab,
  getPackagesForLab,
  getPriceRange,
  formatPrice,
  getTestsByCategory,
  getCheapestPriceForTest,
  getMostExpensivePriceForTest,
  getTestCategoryLabel,
} from "./constants/labs";

export type {
  LabProfile,
  LabTest,
  LabTestPrice,
  HealthPackage,
  TestCategory,
} from "./constants/labs";

// ─── Aggregate Stats ────────────────────────────────────────────────────────────

export interface LabStats {
  totalLabs: number;
  totalTests: number;
  totalPackages: number;
  totalPricePoints: number;
  cheapestTest: { testSlug: string; testName: string; price: number; labName: string } | null;
  mostExpensiveTest: { testSlug: string; testName: string; price: number; labName: string } | null;
  labsWithHomeCollection: number;
  citiesCovered: string[];
}

let cachedStats: LabStats | null = null;

export function getLabStats(): LabStats {
  if (cachedStats) return cachedStats;

  const allCities = new Set<string>();
  LAB_PROFILES.forEach((l) => l.cities.forEach((c) => allCities.add(c)));

  let cheapest: LabStats["cheapestTest"] = null;
  let mostExpensive: LabStats["mostExpensiveTest"] = null;

  for (const price of LAB_TEST_PRICES) {
    const lab = getLabProfile(price.labSlug);
    const test = getLabTest(price.testSlug);
    if (!lab || !test) continue;

    if (!cheapest || price.price < cheapest.price) {
      cheapest = { testSlug: price.testSlug, testName: test.shortName, price: price.price, labName: lab.name };
    }
    if (!mostExpensive || price.price > mostExpensive.price) {
      mostExpensive = { testSlug: price.testSlug, testName: test.shortName, price: price.price, labName: lab.name };
    }
  }

  cachedStats = {
    totalLabs: LAB_PROFILES.length,
    totalTests: LAB_TESTS.length,
    totalPackages: HEALTH_PACKAGES.length,
    totalPricePoints: LAB_TEST_PRICES.length,
    cheapestTest: cheapest,
    mostExpensiveTest: mostExpensive,
    labsWithHomeCollection: LAB_PROFILES.filter((l) => l.homeCollection).length,
    citiesCovered: Array.from(allCities),
  };

  return cachedStats;
}

// ─── Comparison ─────────────────────────────────────────────────────────────────

export interface TestPriceComparison {
  test: LabTest;
  prices: {
    labSlug: string;
    labName: string;
    labType: LabProfile["type"];
    price: number;
    discountedPrice?: number;
    homeCollection: boolean;
    homeCollectionFee: number;
    accreditations: string[];
    isCheapest: boolean;
  }[];
  priceRange: { min: number; max: number; savings: number; savingsPercent: number };
}

export function getTestPriceComparison(testSlug: string): TestPriceComparison | undefined {
  const test = getLabTest(testSlug);
  if (!test) return undefined;

  const rawPrices = getPricesForTest(testSlug);
  if (rawPrices.length === 0) return undefined;

  const minPrice = Math.min(...rawPrices.map((p) => p.price));
  const maxPrice = Math.max(...rawPrices.map((p) => p.price));

  const prices = rawPrices.map((p) => {
    const lab = getLabProfile(p.labSlug)!;
    return {
      labSlug: p.labSlug,
      labName: lab.name,
      labType: lab.type,
      price: p.price,
      discountedPrice: p.discountedPrice,
      homeCollection: lab.homeCollection,
      homeCollectionFee: lab.homeCollectionFee,
      accreditations: lab.accreditations,
      isCheapest: p.price === minPrice,
    };
  });

  return {
    test,
    prices,
    priceRange: {
      min: minPrice,
      max: maxPrice,
      savings: maxPrice - minPrice,
      savingsPercent: maxPrice > 0 ? Math.round(((maxPrice - minPrice) / maxPrice) * 100) : 0,
    },
  };
}

// ─── Popular Tests ──────────────────────────────────────────────────────────────

const POPULAR_TEST_SLUGS = [
  "cbc", "vitamin-d", "lipid-profile", "thyroid-panel", "hba1c",
  "vitamin-b12", "lft", "kft", "iron-studies", "tsh",
];

export function getPopularTests(): (LabTest & { priceRange: ReturnType<typeof getPriceRange> })[] {
  return POPULAR_TEST_SLUGS
    .map((slug) => {
      const test = getLabTest(slug);
      if (!test) return null;
      return { ...test, priceRange: getPriceRange(slug) };
    })
    .filter(Boolean) as (LabTest & { priceRange: ReturnType<typeof getPriceRange> })[];
}

// ─── Lab Comparison ─────────────────────────────────────────────────────────────

export interface LabComparison {
  labs: LabProfile[];
  /** Tests that all compared labs offer */
  commonTests: string[];
  /** Price comparison for common tests */
  priceMatrix: {
    testSlug: string;
    testName: string;
    prices: { labSlug: string; price: number | null }[];
    cheapestLabSlug: string | null;
  }[];
}

export function compareLabs(labSlugs: string[]): LabComparison | undefined {
  const labs = labSlugs.map(getLabProfile).filter(Boolean) as LabProfile[];
  if (labs.length < 2) return undefined;

  // Find tests available in all labs
  const labTestSets = labs.map((lab) => {
    const prices = getPricesForLab(lab.slug);
    return new Set(prices.map((p) => p.testSlug));
  });

  const commonTests = LAB_TESTS
    .filter((t) => labTestSets.every((set) => set.has(t.slug)))
    .map((t) => t.slug);

  const priceMatrix = commonTests.map((testSlug) => {
    const test = getLabTest(testSlug)!;
    const allPrices = LAB_TEST_PRICES.filter((p) => p.testSlug === testSlug);

    const prices = labs.map((lab) => {
      const match = allPrices.find((p) => p.labSlug === lab.slug);
      return { labSlug: lab.slug, price: match ? match.price : null };
    });

    const validPrices = prices.filter((p) => p.price !== null);
    const cheapest = validPrices.length > 0
      ? validPrices.reduce((min, p) => (p.price! < min.price! ? p : min))
      : null;

    return {
      testSlug,
      testName: test.shortName,
      prices,
      cheapestLabSlug: cheapest?.labSlug || null,
    };
  });

  return { labs, commonTests, priceMatrix };
}

// ─── Search / Filter ────────────────────────────────────────────────────────────

export function searchTests(query: string): LabTest[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return LAB_TESTS.filter(
    (t) =>
      t.name.toLowerCase().includes(q) ||
      t.shortName.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.commonReasons.some((r) => r.toLowerCase().includes(q))
  );
}

export function getLabsByCity(citySlug: string): LabProfile[] {
  return LAB_PROFILES.filter((l) => l.cities.includes(citySlug));
}

/** Get prices for a specific test, filtered to labs operating in a given city */
export function getPricesForTestInCity(
  testSlug: string,
  citySlug: string
): (LabTestPrice & { labName: string })[] {
  const cityLabSlugs = new Set(getLabsByCity(citySlug).map((l) => l.slug));
  return LAB_TEST_PRICES
    .filter((p) => p.testSlug === testSlug && cityLabSlugs.has(p.labSlug))
    .map((p) => ({
      ...p,
      labName: getLabProfile(p.labSlug)?.name || p.labSlug,
    }))
    .sort((a, b) => a.price - b.price);
}

/** Get price range for a test, filtered to labs in a specific city */
export function getPriceRangeInCity(
  testSlug: string,
  citySlug: string
): { min: number; max: number; labCount: number } | undefined {
  const prices = getPricesForTestInCity(testSlug, citySlug);
  if (prices.length === 0) return undefined;
  return {
    min: Math.min(...prices.map((p) => p.price)),
    max: Math.max(...prices.map((p) => p.price)),
    labCount: prices.length,
  };
}

export function getLabsByAccreditation(accreditation: string): LabProfile[] {
  return LAB_PROFILES.filter((l) =>
    l.accreditations.some((a) => a.toLowerCase() === accreditation.toLowerCase())
  );
}

// ─── Ranking / Top Lists ────────────────────────────────────────────────────────

export interface RankedLab {
  lab: LabProfile;
  testCount: number;
  avgPrice: number;
  cheapestPrice: number;
  packageCount: number;
}

/** Rank labs in a city by number of tests offered and average price */
export function getTopLabsInCity(citySlug: string, limit = 10): RankedLab[] {
  const cityLabs = getLabsByCity(citySlug);
  return cityLabs
    .map((lab) => {
      const prices = getPricesForLab(lab.slug);
      const packages = HEALTH_PACKAGES.filter((p) => p.labSlug === lab.slug);
      const avg = prices.length > 0 ? prices.reduce((s, p) => s + p.price, 0) / prices.length : 0;
      const cheapest = prices.length > 0 ? Math.min(...prices.map((p) => p.price)) : 0;
      return { lab, testCount: prices.length, avgPrice: Math.round(avg), cheapestPrice: cheapest, packageCount: packages.length };
    })
    .sort((a, b) => b.testCount - a.testCount || a.avgPrice - b.avgPrice)
    .slice(0, limit);
}

/** Rank labs in a city for a specific test category */
export function getTopLabsForCategoryInCity(
  citySlug: string,
  category: string,
  limit = 5
): (RankedLab & { categoryTestCount: number; categoryAvgPrice: number })[] {
  const cityLabs = getLabsByCity(citySlug);
  const catTests = new Set(LAB_TESTS.filter((t) => t.category === category).map((t) => t.slug));

  return cityLabs
    .map((lab) => {
      const allPrices = getPricesForLab(lab.slug);
      const catPrices = LAB_TEST_PRICES.filter(
        (p) => p.labSlug === lab.slug && catTests.has(p.testSlug)
      );
      const packages = HEALTH_PACKAGES.filter((p) => p.labSlug === lab.slug);
      const avg = allPrices.length > 0 ? allPrices.reduce((s, p) => s + p.price, 0) / allPrices.length : 0;
      const cheapest = allPrices.length > 0 ? Math.min(...allPrices.map((p) => p.price)) : 0;
      const catAvg = catPrices.length > 0 ? catPrices.reduce((s, p) => s + p.price, 0) / catPrices.length : 0;
      return {
        lab,
        testCount: allPrices.length,
        avgPrice: Math.round(avg),
        cheapestPrice: cheapest,
        packageCount: packages.length,
        categoryTestCount: catPrices.length,
        categoryAvgPrice: Math.round(catAvg),
      };
    })
    .filter((r) => r.categoryTestCount > 0)
    .sort((a, b) => b.categoryTestCount - a.categoryTestCount || a.categoryAvgPrice - b.categoryAvgPrice)
    .slice(0, limit);
}

/** Rank labs UAE-wide by cheapest average price */
export function getCheapestLabsInCity(citySlug: string, limit = 10): RankedLab[] {
  const cityLabs = getLabsByCity(citySlug);
  return cityLabs
    .map((lab) => {
      const prices = getPricesForLab(lab.slug);
      const packages = HEALTH_PACKAGES.filter((p) => p.labSlug === lab.slug);
      const avg = prices.length > 0 ? prices.reduce((s, p) => s + p.price, 0) / prices.length : 0;
      const cheapest = prices.length > 0 ? Math.min(...prices.map((p) => p.price)) : 0;
      return { lab, testCount: prices.length, avgPrice: Math.round(avg), cheapestPrice: cheapest, packageCount: packages.length };
    })
    .filter((r) => r.testCount > 0)
    .sort((a, b) => a.avgPrice - b.avgPrice)
    .slice(0, limit);
}

/** Get test price comparison filtered to a specific city */
export function getTestPriceComparisonInCity(
  testSlug: string,
  citySlug: string
): TestPriceComparison | undefined {
  const test = getLabTest(testSlug);
  if (!test) return undefined;

  const rawPrices = getPricesForTestInCity(testSlug, citySlug);
  if (rawPrices.length === 0) return undefined;

  const minPrice = Math.min(...rawPrices.map((p) => p.price));
  const maxPrice = Math.max(...rawPrices.map((p) => p.price));

  const prices = rawPrices.map((p) => {
    const lab = getLabProfile(p.labSlug)!;
    return {
      labSlug: p.labSlug,
      labName: lab.name,
      labType: lab.type,
      price: p.price,
      discountedPrice: p.discountedPrice,
      homeCollection: lab.homeCollection,
      homeCollectionFee: lab.homeCollectionFee,
      accreditations: lab.accreditations,
      isCheapest: p.price === minPrice,
    };
  });

  return {
    test,
    prices,
    priceRange: {
      min: minPrice,
      max: maxPrice,
      savings: maxPrice - minPrice,
      savingsPercent: maxPrice > 0 ? Math.round(((maxPrice - minPrice) / maxPrice) * 100) : 0,
    },
  };
}
