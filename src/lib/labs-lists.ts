/**
 * labs-lists.ts
 *
 * Programmatic "Top N Lists" data layer for UAE lab test comparison pages.
 * Generates every valid slug/metadata definition and the ranked items for each.
 *
 * Think TripAdvisor "Top 10 Hotels in Dubai" or NerdWallet "Best Credit Cards 2026".
 * These drive SEO-rich list pages at /labs/lists/[slug].
 *
 * Exported surface:
 *   getAllLabLists()       — all valid LabList definitions (~180+ combinations)
 *   getLabListBySlug()     — look up a single definition by slug
 *   getLabListItems()      — ranked LabListItem[] for a given LabList
 */

import {
  LAB_PROFILES,
  LAB_TESTS,
  LAB_TEST_PRICES,
  HEALTH_PACKAGES,
  TEST_CATEGORIES,
  getLabProfile,
  getLabTest,
  getPricesForTest,
  getPricesForLab,
  getTestsByCategory,
  type LabProfile,
  type LabTest,
  type LabTestPrice,
  type HealthPackage,
  type TestCategory,
} from "./constants/labs";

// ─── City helpers ────────────────────────────────────────────────────────────

/** Labs filtered to a city. Duplicated locally to avoid circular imports. */
function getLabsByCity(citySlug: string): LabProfile[] {
  return LAB_PROFILES.filter((l) => l.cities.includes(citySlug));
}

/** Prices for a test, restricted to labs in a city. */
function getPricesForTestInCity(
  testSlug: string,
  citySlug: string
): (LabTestPrice & { labName: string })[] {
  const cityLabSlugs = new Set(getLabsByCity(citySlug).map((l) => l.slug));
  return LAB_TEST_PRICES.filter(
    (p) => p.testSlug === testSlug && cityLabSlugs.has(p.labSlug)
  )
    .map((p) => ({
      ...p,
      labName: getLabProfile(p.labSlug)?.name ?? p.labSlug,
    }))
    .sort((a, b) => a.price - b.price);
}

// ─── Constants ───────────────────────────────────────────────────────────────

/** The 15 high-search-volume test slugs that get per-city breakdowns. */
const POPULAR_TEST_SLUGS = [
  "cbc",
  "vitamin-d",
  "vitamin-b12",
  "lipid-profile",
  "hba1c",
  "thyroid-panel",
  "tsh",
  "lft",
  "kft",
  "iron-studies",
  "fasting-glucose",
  "testosterone",
  "amh",
  "psa",
  "hiv-test",
] as const;

/** The 3 major cities that get per-city list breakdowns. */
const MAJOR_CITIES = ["dubai", "abu-dhabi", "sharjah"] as const;

/** All 14 test categories. */
const ALL_CATEGORIES: TestCategory[] = TEST_CATEGORIES.map((c) => c.slug);

/** Minimum items required to publish a Top-5 list. */
const MIN_ITEMS_FOR_LIST = 3;

// ─── City display helpers ────────────────────────────────────────────────────

const CITY_NAMES: Record<string, string> = {
  dubai: "Dubai",
  "abu-dhabi": "Abu Dhabi",
  sharjah: "Sharjah",
  ajman: "Ajman",
  "ras-al-khaimah": "Ras Al Khaimah",
  fujairah: "Fujairah",
  "umm-al-quwain": "Umm Al Quwain",
  "al-ain": "Al Ain",
};

function cityName(slug: string): string {
  return CITY_NAMES[slug] ?? slug;
}

/** Category slug → human-readable display label. */
function categoryLabel(slug: TestCategory): string {
  return TEST_CATEGORIES.find((c) => c.slug === slug)?.name ?? slug;
}

/** Category slug → short plural noun for titles ("Blood Tests", "Vitamins", …). */
const CATEGORY_SHORT: Record<TestCategory, string> = {
  "blood-routine": "Blood Tests",
  "vitamins-minerals": "Vitamin & Mineral Tests",
  hormones: "Hormone Tests",
  diabetes: "Diabetes Tests",
  liver: "Liver Function Tests",
  kidney: "Kidney Function Tests",
  cardiac: "Cardiac Tests",
  thyroid: "Thyroid Tests",
  allergy: "Allergy Tests",
  fertility: "Fertility Tests",
  "cancer-screening": "Cancer Screening Tests",
  "std-screening": "STD Screening Tests",
  imaging: "Imaging Tests",
  "urine-stool": "Urine & Stool Tests",
};

/** Lab type → SEO-friendly label. */
const LAB_TYPE_LABEL: Record<LabProfile["type"], string> = {
  chain: "Lab Chains",
  hospital: "Hospital Labs",
  "home-service": "Home Blood Test Services",
  boutique: "Standalone Labs",
};

/** Lab type → SEO adjective used in title. */
const LAB_TYPE_TITLE_LABEL: Record<LabProfile["type"], string> = {
  chain: "Chain",
  hospital: "Hospital",
  "home-service": "Home-Service",
  boutique: "Boutique / Standalone",
};

// ─── Public interfaces ───────────────────────────────────────────────────────

export interface LabList {
  /** URL-friendly slug for /labs/lists/[slug] */
  slug: string;
  /** Meta title (target 60-70 chars) */
  title: string;
  /** Page H1 */
  h1: string;
  /** Meta description (target 150-160 chars) */
  metaDescription: string;
  listType:
    | "cheapest-labs"
    | "expensive-labs"
    | "cheapest-test"
    | "expensive-test"
    | "cheapest-category"
    | "lab-type"
    | "feature"
    | "packages"
    | "fastest"
    | "most-tests";
  /** Optional city filter */
  citySlug?: string;
  /** Optional test filter */
  testSlug?: string;
  /** Optional category filter */
  categorySlug?: string;
  /** Optional lab type filter */
  labType?: LabProfile["type"];
  feature?: "home-collection" | "free-home-collection" | "cap-accredited" | "no-fasting";
  /** 5 or 10 */
  limit: number;
}

export interface LabListItem {
  rank: number;
  /** Lab name or test name */
  name: string;
  /** Link target slug */
  slug: string;
  /** Full link path (e.g. /labs/thumbay-labs or /labs/tests/vitamin-d) */
  linkHref: string;
  price?: number;
  /** "AED 69" or "From AED 69" */
  priceLabel?: string;
  /** e.g. "CAP, ISO 15189 accredited · Free home collection" */
  subtitle?: string;
  /** Short badge chips */
  badges?: string[];
  /** One-line description for the list card */
  description?: string;
}

// ─── Internal helpers ────────────────────────────────────────────────────────

/** Build a subtitle string from lab accreditations + home-collection status. */
function labSubtitle(lab: LabProfile): string {
  const parts: string[] = [];
  if (lab.accreditations.length > 0) {
    parts.push(lab.accreditations.join(", ") + " accredited");
  }
  if (lab.homeCollection) {
    parts.push(
      lab.homeCollectionFee === 0 ? "Free home collection" : `Home collection (AED ${lab.homeCollectionFee})`
    );
  }
  return parts.join(" · ");
}

/** Derive badge chips for a lab. */
function labBadges(lab: LabProfile): string[] {
  const badges: string[] = [];
  if (lab.accreditations.includes("CAP")) badges.push("CAP Accredited");
  if (lab.homeCollectionFee === 0 && lab.homeCollection) badges.push("Free Home Collection");
  else if (lab.homeCollection) badges.push("Home Collection");
  if (lab.turnaroundHours <= 12) badges.push(`${lab.turnaroundHours}h Results`);
  if (lab.type === "chain") badges.push("Chain Lab");
  if (lab.type === "home-service") badges.push("Home-Service Only");
  return badges;
}

/**
 * For a lab, compute its "representative cheapest price":
 * the minimum price across all its listed tests.
 */
function cheapestPriceForLab(labSlug: string): number | undefined {
  const prices = LAB_TEST_PRICES.filter((p) => p.labSlug === labSlug);
  if (prices.length === 0) return undefined;
  return Math.min(...prices.map((p) => p.price));
}

/**
 * For a lab, compute its average price across all listed tests.
 */
function avgPriceForLab(labSlug: string): number {
  const prices = LAB_TEST_PRICES.filter((p) => p.labSlug === labSlug);
  if (prices.length === 0) return 0;
  return prices.reduce((s, p) => s + p.price, 0) / prices.length;
}

// cheapestForTestInCity removed — unused internally; external callers use getPricesForTestInCity from labs.ts

// ─── List definition builders ────────────────────────────────────────────────

function buildCheapestLabsUAE(): LabList {
  const min = Math.min(
    ...LAB_PROFILES.map((l) => cheapestPriceForLab(l.slug) ?? Infinity).filter(isFinite)
  );
  return {
    slug: "cheapest-labs-uae",
    title: `5 Cheapest Diagnostic Labs in the UAE (2026)`,
    h1: "5 Cheapest Diagnostic Labs in the UAE",
    metaDescription: `Compare the 5 cheapest blood test labs in the UAE. Blood tests start from AED ${min}. Find affordable, accredited diagnostic labs with transparent pricing.`,
    listType: "cheapest-labs",
    limit: 5,
  };
}

function buildMostExpensiveLabsUAE(): LabList {
  return {
    slug: "most-expensive-labs-uae",
    title: "Most Expensive Diagnostic Labs in the UAE (2026)",
    h1: "Most Expensive Diagnostic Labs in the UAE",
    metaDescription:
      "See which UAE labs charge the highest prices for blood tests. Compare premium lab costs so you can make an informed choice before booking.",
    listType: "expensive-labs",
    limit: 5,
  };
}

function buildCheapestLabsInCity(citySlug: string): LabList | null {
  const labsInCity = getLabsByCity(citySlug).filter(
    (l) => cheapestPriceForLab(l.slug) !== undefined
  );
  if (labsInCity.length < MIN_ITEMS_FOR_LIST) return null;
  const minPrice = Math.min(...labsInCity.map((l) => cheapestPriceForLab(l.slug)!));
  const city = cityName(citySlug);
  return {
    slug: `cheapest-labs-in-${citySlug}`,
    title: `5 Cheapest Labs in ${city} — Blood Tests from AED ${minPrice}`,
    h1: `5 Cheapest Labs in ${city}`,
    metaDescription: `The 5 most affordable diagnostic labs in ${city}. Blood tests from AED ${minPrice}. Compare prices, accreditations, and home-collection options.`,
    listType: "cheapest-labs",
    citySlug,
    limit: 5,
  };
}

function buildCheapestTestUAE(testSlug: string): LabList | null {
  const prices = getPricesForTest(testSlug);
  if (prices.length < MIN_ITEMS_FOR_LIST) return null;
  const test = getLabTest(testSlug);
  if (!test) return null;
  const minPrice = prices[0].price; // sorted ASC
  return {
    slug: `cheapest-${testSlug}-test-uae`,
    title: `5 Cheapest Labs for ${test.shortName} Test in UAE (2026)`,
    h1: `5 Cheapest Labs for ${test.shortName} in the UAE`,
    metaDescription: `Compare prices for ${test.name} across UAE labs. Cheapest from AED ${minPrice}. Find an accredited lab with same-day or home-collection options.`,
    listType: "cheapest-test",
    testSlug,
    limit: 5,
  };
}

function buildCheapestTestInCity(testSlug: string, citySlug: string): LabList | null {
  const prices = getPricesForTestInCity(testSlug, citySlug);
  if (prices.length < MIN_ITEMS_FOR_LIST) return null;
  const test = getLabTest(testSlug);
  if (!test) return null;
  const city = cityName(citySlug);
  const minPrice = prices[0].price;
  return {
    slug: `cheapest-${testSlug}-test-${citySlug}`,
    title: `Cheapest ${test.shortName} Test in ${city} — Compare 5 Labs`,
    h1: `Cheapest ${test.shortName} Test in ${city}`,
    metaDescription: `Compare ${test.name} prices across labs in ${city}. Cheapest from AED ${minPrice}. Find CAP-accredited labs with home collection and fast results.`,
    listType: "cheapest-test",
    testSlug,
    citySlug,
    limit: 5,
  };
}

function buildCheapestCategoryUAE(category: TestCategory): LabList | null {
  const testsInCategory = getTestsByCategory(category);
  const categoryTestSlugs = new Set(testsInCategory.map((t) => t.slug));
  const pricesInCategory = LAB_TEST_PRICES.filter((p) =>
    categoryTestSlugs.has(p.testSlug)
  );
  // Need at least MIN_ITEMS_FOR_LIST distinct labs offering tests in this category
  const labsInCategory = new Set(pricesInCategory.map((p) => p.labSlug));
  if (labsInCategory.size < MIN_ITEMS_FOR_LIST) return null;
  const minPrice = Math.min(...pricesInCategory.map((p) => p.price));
  const label = CATEGORY_SHORT[category];
  return {
    slug: `cheapest-${category}-uae`,
    title: `5 Cheapest ${label} in the UAE (2026)`,
    h1: `5 Cheapest ${label} in the UAE`,
    metaDescription: `Find the cheapest ${label.toLowerCase()} in the UAE. Prices start from AED ${minPrice}. Compare accredited labs with transparent pricing and home collection.`,
    listType: "cheapest-category",
    categorySlug: category,
    limit: 5,
  };
}

function buildCheapestCategoryInCity(category: TestCategory, citySlug: string): LabList | null {
  const testsInCategory = getTestsByCategory(category);
  const categoryTestSlugs = new Set(testsInCategory.map((t) => t.slug));
  const cityLabSlugs = new Set(getLabsByCity(citySlug).map((l) => l.slug));
  const pricesInCategoryCity = LAB_TEST_PRICES.filter(
    (p) => categoryTestSlugs.has(p.testSlug) && cityLabSlugs.has(p.labSlug)
  );
  const labsInCategoryCity = new Set(pricesInCategoryCity.map((p) => p.labSlug));
  if (labsInCategoryCity.size < MIN_ITEMS_FOR_LIST) return null;
  const minPrice = Math.min(...pricesInCategoryCity.map((p) => p.price));
  const label = CATEGORY_SHORT[category];
  const city = cityName(citySlug);
  return {
    slug: `cheapest-${category}-${citySlug}`,
    title: `Cheapest ${label} in ${city} — Compare Labs`,
    h1: `Cheapest ${label} in ${city}`,
    metaDescription: `Compare prices for ${label.toLowerCase()} in ${city}. Starting from AED ${minPrice}. Accredited labs with home collection and same-day results.`,
    listType: "cheapest-category",
    categorySlug: category,
    citySlug,
    limit: 5,
  };
}

function buildLabTypeList(labType: LabProfile["type"]): LabList | null {
  const labsOfType = LAB_PROFILES.filter((l) => l.type === labType);
  if (labsOfType.length < MIN_ITEMS_FOR_LIST) return null;
  const typeLabel = LAB_TYPE_LABEL[labType];
  const typeTitleLabel = LAB_TYPE_TITLE_LABEL[labType];
  const slugMap: Record<LabProfile["type"], string> = {
    chain: "best-chain-labs-uae",
    hospital: "best-hospital-labs-uae",
    "home-service": "best-home-service-labs-uae",
    boutique: "best-boutique-labs-uae",
  };
  const h1Map: Record<LabProfile["type"], string> = {
    chain: "Best Lab Chains in the UAE",
    hospital: "Best Hospital Laboratories in the UAE",
    "home-service": "Best Home Blood Test Services in the UAE",
    boutique: "Best Standalone / Boutique Labs in the UAE",
  };
  const descMap: Record<LabProfile["type"], string> = {
    chain: `Compare the best diagnostic lab chains in the UAE for 2026. Ranked by price, accreditation, and city coverage. All CAP and ISO 15189 accreditation details included.`,
    hospital: `The best hospital-based laboratories in the UAE. Ranked by price, accreditation, and test range. Ideal for complex diagnostics and specialist referrals.`,
    "home-service": `Best at-home blood test services in the UAE. A nurse visits your home or office. Ranked by price, test range, and booking convenience.`,
    boutique: `Best standalone boutique labs in the UAE. Personalised service, competitive pricing, and walk-in-friendly. Ranked by price and accreditation.`,
  };
  return {
    slug: slugMap[labType],
    title: `Best ${typeTitleLabel} ${typeLabel} in the UAE (2026)`,
    h1: h1Map[labType],
    metaDescription: descMap[labType],
    listType: "lab-type",
    labType,
    limit: labsOfType.length >= 5 ? 5 : labsOfType.length,
  };
}

function buildFreeHomeCollectionList(): LabList | null {
  const labs = LAB_PROFILES.filter((l) => l.homeCollection && l.homeCollectionFee === 0);
  if (labs.length < MIN_ITEMS_FOR_LIST) return null;
  return {
    slug: "labs-with-free-home-collection",
    title: "Labs With Free Home Collection in the UAE (2026)",
    h1: "UAE Labs With Free Home Sample Collection",
    metaDescription: `${labs.length} UAE diagnostic labs offer free home blood collection. A certified nurse visits your home — no collection fee. Compare test prices and book online.`,
    listType: "feature",
    feature: "free-home-collection",
    limit: Math.min(10, labs.length),
  };
}

function buildFreeHomeCollectionInCity(citySlug: string): LabList | null {
  const labs = getLabsByCity(citySlug).filter(
    (l) => l.homeCollection && l.homeCollectionFee === 0
  );
  if (labs.length < MIN_ITEMS_FOR_LIST) return null;
  const city = cityName(citySlug);
  return {
    slug: `labs-with-free-home-collection-${citySlug}`,
    title: `Labs With Free Home Blood Collection in ${city}`,
    h1: `Free Home Blood Collection in ${city}`,
    metaDescription: `${labs.length} labs in ${city} offer free home blood sample collection in 2026. Compare test prices and book a home visit with a certified nurse.`,
    listType: "feature",
    feature: "free-home-collection",
    citySlug,
    limit: Math.min(10, labs.length),
  };
}

// ── Home collection × category ─────────────────────────────────────────────

function buildHomeCollectionCategoryUAE(category: TestCategory): LabList | null {
  const homeCollectionLabs = LAB_PROFILES.filter((l) => l.homeCollection);
  const catTests = new Set(LAB_TESTS.filter((t) => t.category === category).map((t) => t.slug));
  const labsWithCatTests = homeCollectionLabs.filter((lab) =>
    LAB_TEST_PRICES.some((p) => p.labSlug === lab.slug && catTests.has(p.testSlug))
  );
  if (labsWithCatTests.length < MIN_ITEMS_FOR_LIST) return null;
  const label = CATEGORY_SHORT[category] || categoryLabel(category);
  return {
    slug: `home-collection-${category}-tests`,
    title: `${label} With Home Collection in the UAE (2026)`,
    h1: `${label} Available for Home Collection in the UAE`,
    metaDescription: `${labsWithCatTests.length} UAE labs offer ${label.toLowerCase()} with home sample collection. A certified nurse visits your home. Compare prices, turnaround times, and accreditations.`,
    listType: "feature",
    feature: "home-collection",
    categorySlug: category,
    limit: Math.min(10, labsWithCatTests.length),
  };
}

function buildHomeCollectionCategoryInCity(category: TestCategory, citySlug: string): LabList | null {
  const cityLabs = getLabsByCity(citySlug).filter((l) => l.homeCollection);
  const catTests = new Set(LAB_TESTS.filter((t) => t.category === category).map((t) => t.slug));
  const labsWithCatTests = cityLabs.filter((lab) =>
    LAB_TEST_PRICES.some((p) => p.labSlug === lab.slug && catTests.has(p.testSlug))
  );
  if (labsWithCatTests.length < MIN_ITEMS_FOR_LIST) return null;
  const city = cityName(citySlug);
  const label = CATEGORY_SHORT[category] || categoryLabel(category);
  return {
    slug: `home-collection-${category}-tests-${citySlug}`,
    title: `${label} With Home Collection in ${city}`,
    h1: `${label} — Home Collection in ${city}`,
    metaDescription: `${labsWithCatTests.length} labs in ${city} offer home collection for ${label.toLowerCase()}. Compare prices, book a certified nurse visit, and get results within 24h.`,
    listType: "feature",
    feature: "home-collection",
    categorySlug: category,
    citySlug,
    limit: Math.min(10, labsWithCatTests.length),
  };
}

// ── Free home collection × category ───────────────────────────────────────

function buildFreeHomeCollectionCategoryUAE(category: TestCategory): LabList | null {
  const freeLabs = LAB_PROFILES.filter((l) => l.homeCollection && l.homeCollectionFee === 0);
  const catTests = new Set(LAB_TESTS.filter((t) => t.category === category).map((t) => t.slug));
  const labsWithCatTests = freeLabs.filter((lab) =>
    LAB_TEST_PRICES.some((p) => p.labSlug === lab.slug && catTests.has(p.testSlug))
  );
  if (labsWithCatTests.length < MIN_ITEMS_FOR_LIST) return null;
  const label = CATEGORY_SHORT[category] || categoryLabel(category);
  return {
    slug: `free-home-collection-${category}-tests`,
    title: `Free Home Collection for ${label} in the UAE`,
    h1: `${label} — Free Home Collection in the UAE`,
    metaDescription: `${labsWithCatTests.length} UAE labs offer ${label.toLowerCase()} with free home sample collection — no visit fee. Compare test prices and book a certified nurse online.`,
    listType: "feature",
    feature: "free-home-collection",
    categorySlug: category,
    limit: Math.min(10, labsWithCatTests.length),
  };
}

function buildFreeHomeCollectionCategoryInCity(category: TestCategory, citySlug: string): LabList | null {
  const cityLabs = getLabsByCity(citySlug).filter((l) => l.homeCollection && l.homeCollectionFee === 0);
  const catTests = new Set(LAB_TESTS.filter((t) => t.category === category).map((t) => t.slug));
  const labsWithCatTests = cityLabs.filter((lab) =>
    LAB_TEST_PRICES.some((p) => p.labSlug === lab.slug && catTests.has(p.testSlug))
  );
  if (labsWithCatTests.length < MIN_ITEMS_FOR_LIST) return null;
  const city = cityName(citySlug);
  const label = CATEGORY_SHORT[category] || categoryLabel(category);
  return {
    slug: `free-home-collection-${category}-tests-${citySlug}`,
    title: `Free Home Collection for ${label} in ${city}`,
    h1: `${label} — Free Home Collection in ${city}`,
    metaDescription: `${labsWithCatTests.length} labs in ${city} offer free home collection for ${label.toLowerCase()}. No visit fee, results in 24h. Compare prices across accredited labs.`,
    listType: "feature",
    feature: "free-home-collection",
    categorySlug: category,
    citySlug,
    limit: Math.min(10, labsWithCatTests.length),
  };
}

// ── Home collection × popular test ────────────────────────────────────────

function buildHomeCollectionTestUAE(testSlug: string): LabList | null {
  const test = getLabTest(testSlug);
  if (!test) return null;
  const homeCollectionLabs = LAB_PROFILES.filter((l) => l.homeCollection);
  const labsWithTest = homeCollectionLabs.filter((lab) =>
    LAB_TEST_PRICES.some((p) => p.labSlug === lab.slug && p.testSlug === testSlug)
  );
  if (labsWithTest.length < MIN_ITEMS_FOR_LIST) return null;
  return {
    slug: `home-collection-${testSlug}-test`,
    title: `${test.shortName} Test With Home Collection in the UAE`,
    h1: `${test.shortName} — Home Collection Across UAE Labs`,
    metaDescription: `${labsWithTest.length} UAE labs offer ${test.name} with home sample collection. A DHA-licensed nurse collects your sample at home. Compare prices from AED ${Math.min(...LAB_TEST_PRICES.filter((p) => p.testSlug === testSlug && homeCollectionLabs.some((l) => l.slug === p.labSlug)).map((p) => p.price))}.`,
    listType: "feature",
    feature: "home-collection",
    testSlug,
    limit: Math.min(10, labsWithTest.length),
  };
}

function buildHomeCollectionTestInCity(testSlug: string, citySlug: string): LabList | null {
  const test = getLabTest(testSlug);
  if (!test) return null;
  const cityLabs = getLabsByCity(citySlug).filter((l) => l.homeCollection);
  const labsWithTest = cityLabs.filter((lab) =>
    LAB_TEST_PRICES.some((p) => p.labSlug === lab.slug && p.testSlug === testSlug)
  );
  if (labsWithTest.length < MIN_ITEMS_FOR_LIST) return null;
  const city = cityName(citySlug);
  return {
    slug: `home-collection-${testSlug}-test-${citySlug}`,
    title: `${test.shortName} Home Collection in ${city} — Compare Labs`,
    h1: `${test.shortName} — Home Collection in ${city}`,
    metaDescription: `${labsWithTest.length} labs in ${city} offer ${test.name} with home collection. Compare prices, turnaround times, and accreditations. Book a certified nurse visit.`,
    listType: "feature",
    feature: "home-collection",
    testSlug,
    citySlug,
    limit: Math.min(10, labsWithTest.length),
  };
}

// ── Cheapest home collection tests (ranked by price) ─────────────────────

function buildCheapestHomeCollectionTestsUAE(): LabList | null {
  const homeCollectionLabSlugs = new Set(LAB_PROFILES.filter((l) => l.homeCollection).map((l) => l.slug));
  const homeCollectionPrices = LAB_TEST_PRICES.filter((p) => homeCollectionLabSlugs.has(p.labSlug));
  if (homeCollectionPrices.length < MIN_ITEMS_FOR_LIST) return null;
  return {
    slug: "cheapest-home-collection-tests-uae",
    title: "Cheapest At-Home Blood Tests in the UAE (2026)",
    h1: "Cheapest Tests Available for Home Collection in the UAE",
    metaDescription: "The most affordable blood tests you can get at home in the UAE. Ranked by price across home-collection labs. No clinic visit needed — a nurse comes to you.",
    listType: "feature",
    feature: "home-collection",
    limit: 10,
  };
}

function buildCheapestHomeCollectionTestsInCity(citySlug: string): LabList | null {
  const cityLabs = getLabsByCity(citySlug).filter((l) => l.homeCollection);
  const cityLabSlugs = new Set(cityLabs.map((l) => l.slug));
  const prices = LAB_TEST_PRICES.filter((p) => cityLabSlugs.has(p.labSlug));
  if (prices.length < MIN_ITEMS_FOR_LIST) return null;
  const city = cityName(citySlug);
  return {
    slug: `cheapest-home-collection-tests-${citySlug}`,
    title: `Cheapest At-Home Blood Tests in ${city} (2026)`,
    h1: `Cheapest Home Collection Tests in ${city}`,
    metaDescription: `The most affordable blood tests available for home collection in ${city}. Ranked by price. A DHA-licensed nurse collects your sample — no clinic visit needed.`,
    listType: "feature",
    feature: "home-collection",
    citySlug,
    limit: 10,
  };
}

function buildCAPAccreditedList(): LabList | null {
  const labs = LAB_PROFILES.filter((l) => l.accreditations.includes("CAP"));
  if (labs.length < MIN_ITEMS_FOR_LIST) return null;
  return {
    slug: "cap-accredited-labs-uae",
    title: "CAP-Accredited Diagnostic Labs in the UAE (2026)",
    h1: "CAP-Accredited Labs in the UAE",
    metaDescription: `${labs.length} UAE labs hold CAP (College of American Pathologists) accreditation — the gold standard in diagnostic quality. Compare prices and find a CAP lab near you.`,
    listType: "feature",
    feature: "cap-accredited",
    limit: Math.min(10, labs.length),
  };
}

function buildFastestResultsList(): LabList | null {
  const labs = LAB_PROFILES.filter((l) => l.turnaroundHours <= 12);
  if (labs.length < MIN_ITEMS_FOR_LIST) return null;
  return {
    slug: "fastest-lab-results-uae",
    title: "Labs With Fastest Blood Test Results in the UAE",
    h1: "UAE Labs With Fastest Test Turnaround",
    metaDescription: `${labs.length} UAE labs deliver routine blood test results in 12 hours or less. Compare same-day and express result labs. Prices, accreditations, and home collection details included.`,
    listType: "fastest",
    limit: Math.min(10, labs.length),
  };
}

function buildNoFastingTestsList(): LabList | null {
  const nonFastingTests = LAB_TESTS.filter((t) => !t.fastingRequired);
  if (nonFastingTests.length < MIN_ITEMS_FOR_LIST) return null;
  return {
    slug: "no-fasting-blood-tests",
    title: "Blood Tests That Don't Require Fasting (UAE 2026)",
    h1: "Blood Tests You Can Take Without Fasting",
    metaDescription: `${nonFastingTests.length} common blood tests in the UAE require no fasting. Book a same-day test anytime. Compare prices for non-fasting tests across UAE labs.`,
    listType: "feature",
    feature: "no-fasting",
    limit: 10,
  };
}

function buildMostTestsList(): LabList {
  return {
    slug: "labs-with-most-tests-uae",
    title: "UAE Labs With the Most Tests Available (2026)",
    h1: "UAE Diagnostic Labs Ranked by Number of Tests Offered",
    metaDescription:
      "Which UAE lab offers the most blood tests? Ranked by test menu size, accreditation, and price. Find the most comprehensive diagnostic lab for your needs.",
    listType: "most-tests",
    limit: 10,
  };
}

function buildMostExpensiveTestsList(): LabList | null {
  if (LAB_TEST_PRICES.length < MIN_ITEMS_FOR_LIST) return null;
  return {
    slug: "most-expensive-lab-tests-uae",
    title: "Most Expensive Lab Tests in the UAE (2026)",
    h1: "Most Expensive Blood & Diagnostic Tests in the UAE",
    metaDescription:
      "Informational guide to the most expensive lab tests available in the UAE. Understand what drives diagnostic test costs and where to compare prices.",
    listType: "expensive-test",
    limit: 10,
  };
}

function buildCheapestHealthPackagesList(): LabList | null {
  if (HEALTH_PACKAGES.length < MIN_ITEMS_FOR_LIST) return null;
  const minPrice = Math.min(...HEALTH_PACKAGES.map((p) => p.price));
  return {
    slug: "cheapest-health-packages-uae",
    title: `Cheapest Health Check Packages in the UAE (2026)`,
    h1: "Cheapest Health Check Packages in the UAE",
    metaDescription: `Compare the cheapest health screening packages in the UAE from AED ${minPrice}. Packages include CBC, lipid profile, liver, kidney, and more. Book online.`,
    listType: "packages",
    limit: 10,
  };
}

function buildBestExecutivePackagesList(): LabList | null {
  const execPackages = HEALTH_PACKAGES.filter(
    (p) =>
      p.targetAudience.toLowerCase().includes("executive") ||
      p.name.toLowerCase().includes("executive")
  );
  if (execPackages.length < MIN_ITEMS_FOR_LIST) return null;
  return {
    slug: "best-executive-health-packages",
    title: "Best Executive Health Screening Packages UAE (2026)",
    h1: "Best Executive Health Screening Packages in the UAE",
    metaDescription:
      "Compare premium executive health check packages across UAE labs. Includes cardiac markers, cancer screening, full metabolic panel, and vitamins. Prices and biomarker counts compared.",
    listType: "packages",
    limit: 10,
  };
}

function buildBestWomensPackagesList(): LabList | null {
  const womensPackages = HEALTH_PACKAGES.filter(
    (p) =>
      p.suitableFor.includes("female") ||
      p.targetAudience.toLowerCase().includes("women") ||
      p.name.toLowerCase().includes("women")
  );
  if (womensPackages.length < MIN_ITEMS_FOR_LIST) return null;
  return {
    slug: "best-womens-health-packages",
    title: "Best Women's Health Check Packages in UAE (2026)",
    h1: "Best Women's Health Check Packages in the UAE",
    metaDescription:
      "Compare women's health screening packages across UAE labs. Includes thyroid, fertility hormones, vitamins, iron, and CBC. Find the best value package for women's health.",
    listType: "packages",
    limit: 10,
  };
}

function buildMostComprehensivePackagesList(): LabList | null {
  if (HEALTH_PACKAGES.length < MIN_ITEMS_FOR_LIST) return null;
  return {
    slug: "most-comprehensive-health-packages",
    title: "Most Comprehensive Health Packages UAE — By Biomarker Count",
    h1: "Most Comprehensive Health Check Packages in the UAE",
    metaDescription:
      "Ranked by biomarker count: the most comprehensive health screening packages available in UAE labs. Compare biomarker coverage, price per biomarker, and lab accreditation.",
    listType: "packages",
    limit: 10,
  };
}

// ─── Master generator ────────────────────────────────────────────────────────

let _cachedLists: LabList[] | null = null;

/**
 * Generates every valid LabList definition.
 * Results are memoised after the first call (module-level cache).
 */
export function getAllLabLists(): LabList[] {
  if (_cachedLists) return _cachedLists;

  const lists: LabList[] = [];

  // 1. Cheapest labs — UAE-wide
  lists.push(buildCheapestLabsUAE());

  // 2. Most expensive labs — UAE-wide
  lists.push(buildMostExpensiveLabsUAE());

  // 3. Cheapest labs — per city (only major cities with 3+ labs)
  for (const citySlug of MAJOR_CITIES) {
    const list = buildCheapestLabsInCity(citySlug);
    if (list) lists.push(list);
  }

  // 4. Cheapest by popular test — UAE-wide
  for (const testSlug of POPULAR_TEST_SLUGS) {
    const list = buildCheapestTestUAE(testSlug);
    if (list) lists.push(list);
  }

  // 5. Cheapest by popular test × major city
  for (const testSlug of POPULAR_TEST_SLUGS) {
    for (const citySlug of MAJOR_CITIES) {
      const list = buildCheapestTestInCity(testSlug, citySlug);
      if (list) lists.push(list);
    }
  }

  // 6. Cheapest by category — UAE-wide
  for (const category of ALL_CATEGORIES) {
    const list = buildCheapestCategoryUAE(category);
    if (list) lists.push(list);
  }

  // 7. Cheapest by category × major city
  for (const category of ALL_CATEGORIES) {
    for (const citySlug of MAJOR_CITIES) {
      const list = buildCheapestCategoryInCity(category, citySlug);
      if (list) lists.push(list);
    }
  }

  // 8. By lab type (all 4 types)
  for (const labType of ["chain", "hospital", "home-service", "boutique"] as const) {
    const list = buildLabTypeList(labType);
    if (list) lists.push(list);
  }

  // 9. Feature lists
  const freeHomeCollection = buildFreeHomeCollectionList();
  if (freeHomeCollection) lists.push(freeHomeCollection);

  for (const citySlug of MAJOR_CITIES) {
    const list = buildFreeHomeCollectionInCity(citySlug);
    if (list) lists.push(list);
  }

  // 10. Home collection × category — UAE-wide
  for (const category of ALL_CATEGORIES) {
    const hcCat = buildHomeCollectionCategoryUAE(category);
    if (hcCat) lists.push(hcCat);
  }

  // 11. Home collection × category × major city
  for (const category of ALL_CATEGORIES) {
    for (const citySlug of MAJOR_CITIES) {
      const hcCatCity = buildHomeCollectionCategoryInCity(category, citySlug);
      if (hcCatCity) lists.push(hcCatCity);
    }
  }

  // 12. Free home collection × category — UAE-wide
  for (const category of ALL_CATEGORIES) {
    const freeHcCat = buildFreeHomeCollectionCategoryUAE(category);
    if (freeHcCat) lists.push(freeHcCat);
  }

  // 13. Free home collection × category × major city
  for (const category of ALL_CATEGORIES) {
    for (const citySlug of MAJOR_CITIES) {
      const freeHcCatCity = buildFreeHomeCollectionCategoryInCity(category, citySlug);
      if (freeHcCatCity) lists.push(freeHcCatCity);
    }
  }

  // 14. Home collection × popular test — UAE-wide
  for (const testSlug of POPULAR_TEST_SLUGS) {
    const hcTest = buildHomeCollectionTestUAE(testSlug);
    if (hcTest) lists.push(hcTest);
  }

  // 15. Home collection × popular test × major city
  for (const testSlug of POPULAR_TEST_SLUGS) {
    for (const citySlug of MAJOR_CITIES) {
      const hcTestCity = buildHomeCollectionTestInCity(testSlug, citySlug);
      if (hcTestCity) lists.push(hcTestCity);
    }
  }

  // 16. Cheapest home collection tests
  const cheapestHC = buildCheapestHomeCollectionTestsUAE();
  if (cheapestHC) lists.push(cheapestHC);
  for (const citySlug of MAJOR_CITIES) {
    const cheapestHCCity = buildCheapestHomeCollectionTestsInCity(citySlug);
    if (cheapestHCCity) lists.push(cheapestHCCity);
  }

  // 17. Other feature lists
  const capList = buildCAPAccreditedList();
  if (capList) lists.push(capList);

  const fastestList = buildFastestResultsList();
  if (fastestList) lists.push(fastestList);

  const noFastingList = buildNoFastingTestsList();
  if (noFastingList) lists.push(noFastingList);

  // 18. Most tests
  lists.push(buildMostTestsList());

  // 11. Most expensive tests
  const mostExpensiveTests = buildMostExpensiveTestsList();
  if (mostExpensiveTests) lists.push(mostExpensiveTests);

  // 12. Package rankings
  const cheapestPackages = buildCheapestHealthPackagesList();
  if (cheapestPackages) lists.push(cheapestPackages);

  const execPackages = buildBestExecutivePackagesList();
  if (execPackages) lists.push(execPackages);

  const womensPackages = buildBestWomensPackagesList();
  if (womensPackages) lists.push(womensPackages);

  const comprehensivePackages = buildMostComprehensivePackagesList();
  if (comprehensivePackages) lists.push(comprehensivePackages);

  _cachedLists = lists;
  return lists;
}

/**
 * Look up a single LabList definition by its URL slug.
 * Returns undefined when the slug doesn't exist.
 */
export function getLabListBySlug(slug: string): LabList | undefined {
  return getAllLabLists().find((l) => l.slug === slug);
}

// ─── Item rankers ────────────────────────────────────────────────────────────

/** Build a LabListItem for a lab entry in a ranked list. */
function labToItem(
  rank: number,
  lab: LabProfile,
  price?: number,
  pricePrefix = "From"
): LabListItem {
  return {
    rank,
    name: lab.name,
    slug: lab.slug,
    linkHref: `/labs/${lab.slug}`,
    price,
    priceLabel: price !== undefined ? `${pricePrefix} AED ${price}` : undefined,
    subtitle: labSubtitle(lab),
    badges: labBadges(lab),
    description: lab.description.split(".")[0] + ".",
  };
}

/** Build a LabListItem for a test entry in a ranked list. */
function testToItem(
  rank: number,
  test: LabTest,
  price?: number
): LabListItem {
  return {
    rank,
    name: test.name,
    slug: test.slug,
    linkHref: `/labs/tests/${test.slug}`,
    price,
    priceLabel: price !== undefined ? `From AED ${price}` : undefined,
    subtitle: `Category: ${categoryLabel(test.category)}`,
    badges: [
      test.fastingRequired ? "Fasting Required" : "No Fasting",
      `${test.turnaroundHours}h Turnaround`,
      test.sampleType === "blood" ? "Blood Sample" : test.sampleType,
    ],
    description: test.description.split(".")[0] + ".",
  };
}

/** Build a LabListItem for a health package entry. */
function packageToItem(rank: number, pkg: HealthPackage): LabListItem {
  const lab = getLabProfile(pkg.labSlug);
  return {
    rank,
    name: pkg.name,
    slug: pkg.id,
    linkHref: `/labs/${pkg.labSlug}#packages`,
    price: pkg.discountedPrice ?? pkg.price,
    priceLabel: pkg.discountedPrice
      ? `AED ${pkg.discountedPrice} (was AED ${pkg.price})`
      : `AED ${pkg.price}`,
    subtitle: lab ? `${lab.name} · ${pkg.biomarkerCount} biomarkers` : pkg.targetAudience,
    badges: [
      `${pkg.biomarkerCount} Biomarkers`,
      ...pkg.suitableFor.map((s) =>
        s === "all" ? "All Genders" : s === "female" ? "Women" : "Men"
      ),
    ],
    description: pkg.targetAudience,
  };
}

// ─── Core item-generation function ──────────────────────────────────────────

/**
 * Generates the ranked items for any LabList.
 *
 * Sorting rules per listType:
 *   cheapest-labs      → sort labs by cheapest test price ASC
 *   expensive-labs     → sort labs by average price DESC
 *   cheapest-test      → sort labs offering that test by price ASC
 *   expensive-test     → sort tests by highest-single-price DESC (UAE-wide)
 *   cheapest-category  → sort labs by cheapest test price in category ASC
 *   lab-type           → filter by type, sort by cheapest price ASC
 *   feature            → filter by feature, sort by cheapest price ASC (or special logic)
 *   packages           → sort packages by price / biomarker count
 *   fastest            → filter ≤12h turnaround, sort by turnaround ASC
 *   most-tests         → sort labs by number of tests offered DESC
 */
export function getLabListItems(list: LabList): LabListItem[] {
  switch (list.listType) {
    // ── Cheapest labs ────────────────────────────────────────────────────────
    case "cheapest-labs": {
      const candidates = list.citySlug
        ? getLabsByCity(list.citySlug)
        : [...LAB_PROFILES];

      return candidates
        .map((lab) => ({
          lab,
          price: list.citySlug
            ? (() => {
                const cityPrices = LAB_TEST_PRICES.filter(
                  (p) => p.labSlug === lab.slug
                  // city filter is already applied by getLabsByCity above
                );
                if (cityPrices.length === 0) return undefined;
                return Math.min(...cityPrices.map((p) => p.price));
              })()
            : cheapestPriceForLab(lab.slug),
        }))
        .filter((r): r is { lab: LabProfile; price: number } => r.price !== undefined)
        .sort((a, b) => a.price - b.price)
        .slice(0, list.limit)
        .map((r, i) => labToItem(i + 1, r.lab, r.price, "From"));
    }

    // ── Most expensive labs ──────────────────────────────────────────────────
    case "expensive-labs": {
      return LAB_PROFILES.filter((l) => getPricesForLab(l.slug).length > 0)
        .map((lab) => ({ lab, avg: avgPriceForLab(lab.slug) }))
        .sort((a, b) => b.avg - a.avg)
        .slice(0, list.limit)
        .map((r, i) => labToItem(i + 1, r.lab, Math.round(r.avg), "Avg"));
    }

    // ── Cheapest test ────────────────────────────────────────────────────────
    case "cheapest-test": {
      if (!list.testSlug) return [];

      const prices = list.citySlug
        ? getPricesForTestInCity(list.testSlug, list.citySlug)
        : getPricesForTest(list.testSlug);

      return prices
        .slice(0, list.limit)
        .map((p, i) => {
          const lab = getLabProfile(p.labSlug);
          if (!lab) return null;
          return labToItem(i + 1, lab, p.price, "AED");
        })
        .filter((x): x is LabListItem => x !== null);
    }

    // ── Most expensive tests ─────────────────────────────────────────────────
    case "expensive-test": {
      // For each test, find its maximum price across all labs
      interface TestWithPrice { test: LabTest; maxPrice: number; labName: string }
      const testMaxPrices: TestWithPrice[] = LAB_TESTS.map((test) => {
        const prices = LAB_TEST_PRICES.filter((p) => p.testSlug === test.slug);
        if (prices.length === 0) return null;
        const maxEntry = prices.reduce((mx, p) => (p.price > mx.price ? p : mx));
        const lab = getLabProfile(maxEntry.labSlug);
        return { test, maxPrice: maxEntry.price, labName: lab?.name ?? maxEntry.labSlug };
      }).filter((x): x is TestWithPrice => x !== null);

      return testMaxPrices
        .sort((a, b) => b.maxPrice - a.maxPrice)
        .slice(0, list.limit)
        .map((r, i) => ({
          ...testToItem(i + 1, r.test, r.maxPrice),
          subtitle: `Highest price at ${r.labName}`,
        }));
    }

    // ── Cheapest by category ─────────────────────────────────────────────────
    case "cheapest-category": {
      if (!list.categorySlug) return [];
      const category = list.categorySlug as TestCategory;
      const testsInCategory = getTestsByCategory(category);
      const categoryTestSlugs = new Set(testsInCategory.map((t) => t.slug));

      // Aggregate: per lab, find the cheapest price within the category
      const labCheapest = new Map<string, number>();
      const priceSource = list.citySlug
        ? LAB_TEST_PRICES.filter((p) => {
            const cityLabSlugs = new Set(getLabsByCity(list.citySlug!).map((l) => l.slug));
            return categoryTestSlugs.has(p.testSlug) && cityLabSlugs.has(p.labSlug);
          })
        : LAB_TEST_PRICES.filter((p) => categoryTestSlugs.has(p.testSlug));

      for (const p of priceSource) {
        const existing = labCheapest.get(p.labSlug);
        if (existing === undefined || p.price < existing) {
          labCheapest.set(p.labSlug, p.price);
        }
      }

      return Array.from(labCheapest.entries())
        .sort(([, a], [, b]) => a - b)
        .slice(0, list.limit)
        .map(([labSlug, price], i) => {
          const lab = getLabProfile(labSlug);
          if (!lab) return null;
          return labToItem(i + 1, lab, price, "From");
        })
        .filter((x): x is LabListItem => x !== null);
    }

    // ── Lab type ─────────────────────────────────────────────────────────────
    case "lab-type": {
      if (!list.labType) return [];
      return LAB_PROFILES.filter((l) => l.type === list.labType)
        .map((lab) => ({ lab, price: cheapestPriceForLab(lab.slug) }))
        .filter((r): r is { lab: LabProfile; price: number } => r.price !== undefined)
        .sort((a, b) => a.price - b.price)
        .slice(0, list.limit)
        .map((r, i) => labToItem(i + 1, r.lab, r.price, "From"));
    }

    // ── Feature ───────────────────────────────────────────────────────────────
    case "feature": {
      switch (list.feature) {
        // No-fasting: return tests, not labs
        case "no-fasting": {
          const nonFastingTests = LAB_TESTS.filter((t) => !t.fastingRequired);
          // Sort by number of labs offering the test DESC, then by min price ASC
          return nonFastingTests
            .map((test) => {
              const prices = getPricesForTest(test.slug);
              return {
                test,
                labCount: prices.length,
                minPrice: prices.length > 0 ? prices[0].price : Infinity,
              };
            })
            .filter((r) => r.labCount > 0)
            .sort((a, b) => b.labCount - a.labCount || a.minPrice - b.minPrice)
            .slice(0, list.limit)
            .map((r, i) => testToItem(i + 1, r.test, r.minPrice === Infinity ? undefined : r.minPrice));
        }

        // Free home collection (optionally filtered by category or test)
        case "free-home-collection": {
          let candidates = list.citySlug
            ? getLabsByCity(list.citySlug).filter(
                (l) => l.homeCollection && l.homeCollectionFee === 0
              )
            : LAB_PROFILES.filter((l) => l.homeCollection && l.homeCollectionFee === 0);

          // Filter to labs offering tests in a specific category
          if (list.categorySlug) {
            const catTests = new Set(LAB_TESTS.filter((t) => t.category === list.categorySlug).map((t) => t.slug));
            candidates = candidates.filter((lab) =>
              LAB_TEST_PRICES.some((p) => p.labSlug === lab.slug && catTests.has(p.testSlug))
            );
          }
          // Filter to labs offering a specific test
          if (list.testSlug) {
            candidates = candidates.filter((lab) =>
              LAB_TEST_PRICES.some((p) => p.labSlug === lab.slug && p.testSlug === list.testSlug)
            );
          }

          return candidates
            .map((lab) => ({ lab, price: cheapestPriceForLab(lab.slug) }))
            .filter((r): r is { lab: LabProfile; price: number } => r.price !== undefined)
            .sort((a, b) => a.price - b.price)
            .slice(0, list.limit)
            .map((r, i) => labToItem(i + 1, r.lab, r.price, "From"));
        }

        // CAP accredited
        case "cap-accredited": {
          return LAB_PROFILES.filter((l) => l.accreditations.includes("CAP"))
            .map((lab) => ({ lab, price: cheapestPriceForLab(lab.slug) }))
            .filter((r): r is { lab: LabProfile; price: number } => r.price !== undefined)
            .sort((a, b) => a.price - b.price)
            .slice(0, list.limit)
            .map((r, i) => labToItem(i + 1, r.lab, r.price, "From"));
        }

        // Generic home-collection (any fee, optionally filtered by category or test)
        case "home-collection": {
          let candidates = list.citySlug
            ? getLabsByCity(list.citySlug).filter((l) => l.homeCollection)
            : LAB_PROFILES.filter((l) => l.homeCollection);

          if (list.categorySlug) {
            const catTests = new Set(LAB_TESTS.filter((t) => t.category === list.categorySlug).map((t) => t.slug));
            candidates = candidates.filter((lab) =>
              LAB_TEST_PRICES.some((p) => p.labSlug === lab.slug && catTests.has(p.testSlug))
            );
          }
          if (list.testSlug) {
            candidates = candidates.filter((lab) =>
              LAB_TEST_PRICES.some((p) => p.labSlug === lab.slug && p.testSlug === list.testSlug)
            );
          }

          return candidates
            .map((lab) => ({ lab, price: cheapestPriceForLab(lab.slug) }))
            .filter((r): r is { lab: LabProfile; price: number } => r.price !== undefined)
            .sort((a, b) => a.price - b.price)
            .slice(0, list.limit)
            .map((r, i) => labToItem(i + 1, r.lab, r.price, "From"));
        }

        default:
          return [];
      }
    }

    // ── Fastest results ───────────────────────────────────────────────────────
    case "fastest": {
      return LAB_PROFILES.filter((l) => l.turnaroundHours <= 12)
        .sort((a, b) => a.turnaroundHours - b.turnaroundHours)
        .slice(0, list.limit)
        .map((lab, i) => ({
          ...labToItem(i + 1, lab, cheapestPriceForLab(lab.slug), "From"),
          subtitle: `${lab.turnaroundHours}h turnaround · ${labSubtitle(lab)}`,
          badges: [`${lab.turnaroundHours}h Results`, ...(labBadges(lab))],
        }));
    }

    // ── Most tests ────────────────────────────────────────────────────────────
    case "most-tests": {
      return LAB_PROFILES.map((lab) => ({
        lab,
        testCount: LAB_TEST_PRICES.filter((p) => p.labSlug === lab.slug).length,
        packageCount: HEALTH_PACKAGES.filter((p) => p.labSlug === lab.slug).length,
      }))
        .filter((r) => r.testCount > 0)
        .sort((a, b) => b.testCount - a.testCount || b.packageCount - a.packageCount)
        .slice(0, list.limit)
        .map((r, i) => ({
          ...labToItem(i + 1, r.lab, cheapestPriceForLab(r.lab.slug), "From"),
          subtitle: `${r.testCount} tests · ${r.packageCount} packages · ${labSubtitle(r.lab)}`,
          badges: [`${r.testCount} Tests`, `${r.packageCount} Packages`, ...(labBadges(r.lab))],
        }));
    }

    // ── Packages ──────────────────────────────────────────────────────────────
    case "packages": {
      let candidates = [...HEALTH_PACKAGES];

      switch (list.slug) {
        case "cheapest-health-packages-uae":
          candidates = candidates.sort(
            (a, b) => (a.discountedPrice ?? a.price) - (b.discountedPrice ?? b.price)
          );
          break;

        case "best-executive-health-packages":
          candidates = candidates
            .filter(
              (p) =>
                p.targetAudience.toLowerCase().includes("executive") ||
                p.name.toLowerCase().includes("executive")
            )
            .sort(
              (a, b) => (a.discountedPrice ?? a.price) - (b.discountedPrice ?? b.price)
            );
          break;

        case "best-womens-health-packages":
          candidates = candidates
            .filter(
              (p) =>
                p.suitableFor.includes("female") ||
                p.targetAudience.toLowerCase().includes("women") ||
                p.name.toLowerCase().includes("women")
            )
            .sort(
              (a, b) => (a.discountedPrice ?? a.price) - (b.discountedPrice ?? b.price)
            );
          break;

        case "most-comprehensive-health-packages":
          candidates = candidates.sort((a, b) => b.biomarkerCount - a.biomarkerCount);
          break;

        default:
          candidates = candidates.sort(
            (a, b) => (a.discountedPrice ?? a.price) - (b.discountedPrice ?? b.price)
          );
      }

      return candidates.slice(0, list.limit).map((pkg, i) => packageToItem(i + 1, pkg));
    }

    default:
      return [];
  }
}

// ─── Convenience aggregators ─────────────────────────────────────────────────

/**
 * Returns all list slugs grouped by listType — useful for sitemap generation.
 */
export function getLabListSlugsByType(): Record<LabList["listType"], string[]> {
  const result: Record<LabList["listType"], string[]> = {
    "cheapest-labs": [],
    "expensive-labs": [],
    "cheapest-test": [],
    "expensive-test": [],
    "cheapest-category": [],
    "lab-type": [],
    feature: [],
    packages: [],
    fastest: [],
    "most-tests": [],
  };
  for (const list of getAllLabLists()) {
    result[list.listType].push(list.slug);
  }
  return result;
}

/**
 * Returns lists that include a specific test (for "related lists" widgets on test pages).
 */
export function getLabListsForTest(testSlug: string): LabList[] {
  return getAllLabLists().filter((l) => l.testSlug === testSlug);
}

/**
 * Returns lists that include a specific city (for "related lists" widgets on city pages).
 */
export function getLabListsForCity(citySlug: string): LabList[] {
  return getAllLabLists().filter((l) => l.citySlug === citySlug);
}

/**
 * Returns lists that cover a specific category (for "related lists" widgets on category pages).
 */
export function getLabListsForCategory(categorySlug: TestCategory): LabList[] {
  return getAllLabLists().filter((l) => l.categorySlug === categorySlug);
}
