import { MetadataRoute } from "next";
import { getCities, getCategories, getAreasByCity } from "@/lib/data";
import { getBaseUrl } from "@/lib/helpers";
import { INSURANCE_PROVIDERS } from "@/lib/constants/insurance";
import { INSURER_PROFILES } from "@/lib/insurance";
import { LANGUAGES } from "@/lib/constants/languages";
import { CONDITIONS } from "@/lib/constants/conditions";
import { LAB_PROFILES, LAB_TESTS, LAB_TEST_PRICES, TEST_CATEGORIES } from "@/lib/constants/labs";
import { getAllLabLists } from "@/lib/labs-lists";
import { CITIES } from "@/lib/constants/cities";
import { PROCEDURES, PROCEDURE_CATEGORIES } from "@/lib/constants/procedures";
import { PRICING_LISTS } from "@/lib/constants/pricing-lists";
import { PRICING_GUIDES } from "@/lib/constants/pricing-guides";
import { CARE_JOURNEYS } from "@/lib/constants/care-journeys";
import { PROCEDURE_COMPARISONS } from "@/lib/constants/procedure-comparisons";
import { getAllComparisonSlugs } from "@/lib/compare";
import { JOURNAL_CATEGORIES } from "@/lib/intelligence/categories";
import { PROFESSIONAL_CATEGORIES, ALL_SPECIALTIES, PHYSICIAN_SPECIALTIES, DENTIST_SPECIALTIES } from "@/lib/constants/professionals";
import { getAllFacilitySlugs, getFacilitySpecialtyCombos, getAreaStats, getAreaSpecialtyCombos, getSpecialtiesWithBothLevels, getAllFacilities } from "@/lib/professionals";
import { getTopAreas, getTopFacilities, getProfessionalsByAreaAndCategory } from "@/lib/workforce";
import { GUIDES } from "@/lib/guides/data";

const GUIDE_SLUGS = [
  "how-uae-healthcare-works", "health-insurance-uae", "what-is-dha",
  "what-is-doh", "what-is-mohap", "choosing-a-doctor-uae",
  "healthcare-free-zones-dubai", "emergency-services-uae",
];
const INSURANCE_GUIDE_SLUGS = [
  "freelancer-health-insurance", "maternity-insurance-uae",
  "how-to-claim-health-insurance", "domestic-worker-insurance",
  "switching-health-insurance",
];
const GUIDE_SLUGS_LABS = [
  "visa-medical", "pre-marital-screening", "pregnancy-tests", "walk-in-labs",
  "weekend-labs", "same-day-results", "mens-health-40-plus", "womens-health-30-plus",
  "senior-health-screening", "corporate-health-check",
];
const CONDITION_SLUGS = [
  "pcos", "diabetes", "anemia", "thyroid-disorders", "heart-disease",
  "liver-disease", "kidney-disease", "fertility", "std-screening",
  "vitamin-deficiency", "allergy-testing", "prostate-health",
];
const RESULTS_SLUGS = [
  "cbc", "vitamin-d", "vitamin-b12", "lipid-profile", "hba1c", "tsh",
  "thyroid-panel", "lft", "kft", "iron-studies", "fasting-glucose",
  "testosterone", "amh", "psa", "hiv-test", "crp",
];

// ISR: rebuild sitemap every hour. No heavy DB queries — uses only constants.
export const revalidate = 3600;

// Last known content update date. Using a fixed date instead of new Date() because
// the sitemap uses constants only (no DB), so we cannot determine real per-page
// modification times. new Date() changes on every request, which is misleading to
// crawlers. UPDATE THIS DATE when content (constants, guides, categories) changes.
const LAST_CONTENT_UPDATE = new Date('2026-04-10');

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getBaseUrl();
  const cities = getCities();
  const categories = getCategories();
  const entries: MetadataRoute.Sitemap = [];

  // Homepage
  entries.push({
    url: baseUrl, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "daily", priority: 1.0,
    alternates: { languages: { en: baseUrl, ar: `${baseUrl}/ar` } },
  });

  // Directory hub page
  entries.push({ url: `${baseUrl}/directory`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "daily", priority: 0.95 });

  // Search page
  entries.push({ url: `${baseUrl}/search`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "daily", priority: 0.8 });

  // Directory: city pages + city×category + city×area structural pages (with hreflang)
  for (const city of cities) {
    entries.push({
      url: `${baseUrl}/directory/${city.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "daily", priority: 0.9,
      alternates: { languages: { en: `${baseUrl}/directory/${city.slug}`, ar: `${baseUrl}/ar/directory/${city.slug}` } },
    });
    for (const cat of categories) {
      entries.push({
        url: `${baseUrl}/directory/${city.slug}/${cat.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "daily", priority: 0.9,
        alternates: { languages: { en: `${baseUrl}/directory/${city.slug}/${cat.slug}`, ar: `${baseUrl}/ar/directory/${city.slug}/${cat.slug}` } },
      });
    }
    const areas = getAreasByCity(city.slug);
    for (const area of areas) {
      entries.push({
        url: `${baseUrl}/directory/${city.slug}/${area.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.7,
        alternates: { languages: { en: `${baseUrl}/directory/${city.slug}/${area.slug}`, ar: `${baseUrl}/ar/directory/${city.slug}/${area.slug}` } },
      });
      for (const cat of categories) {
        entries.push({ url: `${baseUrl}/directory/${city.slug}/${area.slug}/${cat.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.7 });
      }
    }
    // Special filter pages
    entries.push({ url: `${baseUrl}/directory/${city.slug}/24-hours`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.8 });
    entries.push({ url: `${baseUrl}/directory/${city.slug}/insurance`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.7 });
    entries.push({ url: `${baseUrl}/directory/${city.slug}/language`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.7 });
    entries.push({ url: `${baseUrl}/directory/${city.slug}/condition`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.7 });
    // Insurance per city
    for (const insurer of INSURANCE_PROVIDERS) {
      entries.push({ url: `${baseUrl}/directory/${city.slug}/insurance/${insurer.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.7 });
    }
    // Language per city
    for (const lang of LANGUAGES) {
      entries.push({ url: `${baseUrl}/directory/${city.slug}/language/${lang.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.7 });
    }
    // Condition per city
    for (const condition of CONDITIONS) {
      entries.push({ url: `${baseUrl}/directory/${city.slug}/condition/${condition.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.7 });
    }
    // Procedure pages per city
    const procsInCity = PROCEDURES.filter((p) => p.cityPricing[city.slug]);
    if (procsInCity.length > 0) {
      entries.push({ url: `${baseUrl}/directory/${city.slug}/procedures`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.8 });
      for (const proc of procsInCity) {
        entries.push({ url: `${baseUrl}/directory/${city.slug}/procedures/${proc.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.75 });
      }
    }
    // Service-specific flat URL landing pages (e.g. /directory/dubai/teeth-whitening)
    for (const proc of procsInCity) {
      entries.push({ url: `${baseUrl}/directory/${city.slug}/${proc.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.8 });
    }
    // Walk-in clinics per city
    entries.push({ url: `${baseUrl}/directory/${city.slug}/walk-in`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.7 });
    // Emergency facilities per city
    entries.push({ url: `${baseUrl}/directory/${city.slug}/emergency`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.7 });
    // Government facilities per city
    entries.push({ url: `${baseUrl}/directory/${city.slug}/government`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.7 });
    // Top providers per city×category
    for (const cat of categories) {
      entries.push({ url: `${baseUrl}/directory/${city.slug}/top/${cat.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.75 });
    }
  }

  // Best pages
  entries.push({ url: `${baseUrl}/best`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.9 });
  for (const city of cities) {
    entries.push({ url: `${baseUrl}/best/${city.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.85 });
    for (const cat of categories) {
      entries.push({ url: `${baseUrl}/best/${city.slug}/${cat.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.85 });
    }
  }

  // Top 10
  entries.push({ url: `${baseUrl}/directory/top`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.9 });
  for (const cat of categories) {
    entries.push({ url: `${baseUrl}/directory/top/${cat.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.85 });
  }
  for (const city of cities) {
    entries.push({ url: `${baseUrl}/directory/${city.slug}/top`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.85 });
  }

  // Guides
  entries.push({ url: `${baseUrl}/directory/guide`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.7 });
  for (const slug of GUIDE_SLUGS) {
    entries.push({ url: `${baseUrl}/directory/guide/${slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.6 });
  }

  // Comparisons
  entries.push({ url: `${baseUrl}/directory/compare`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.8 });
  for (const slug of getAllComparisonSlugs()) {
    entries.push({ url: `${baseUrl}/directory/compare/${slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.7 });
  }

  // Intelligence / Journal
  entries.push({ url: `${baseUrl}/intelligence`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "hourly", priority: 0.95 });
  // Intelligence tag/category pages
  for (const cat of JOURNAL_CATEGORIES) {
    entries.push({ url: `${baseUrl}/intelligence/category/${cat.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "daily", priority: 0.8 });
  }
  // Intelligence individual articles are DB-driven — they cannot be enumerated in this
  // synchronous sitemap. If needed, add a dedicated /intelligence/sitemap.xml route.

  // Labs
  entries.push({ url: `${baseUrl}/labs`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.9 });
  entries.push({ url: `${baseUrl}/labs/compare`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.7 });
  for (const lab of LAB_PROFILES) {
    entries.push({ url: `${baseUrl}/labs/${lab.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.8 });
  }
  for (const test of LAB_TESTS) {
    entries.push({ url: `${baseUrl}/labs/test/${test.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.8 });
    for (const city of CITIES) {
      entries.push({ url: `${baseUrl}/labs/test/${test.slug}/${city.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.7 });
    }
  }
  for (const cat of TEST_CATEGORIES) {
    entries.push({ url: `${baseUrl}/labs/category/${cat.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.7 });
  }
  entries.push(
    { url: `${baseUrl}/labs/home-collection`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/labs/packages`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.8 },
  );
  for (const city of CITIES) {
    const hcLabs = LAB_PROFILES.filter((l) => l.cities.includes(city.slug) && l.homeCollection);
    if (hcLabs.length > 0) {
      entries.push({ url: `${baseUrl}/labs/home-collection/${city.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.8 });
    }
    const cityLabs = LAB_PROFILES.filter((l) => l.cities.includes(city.slug));
    if (cityLabs.length > 0) {
      entries.push({ url: `${baseUrl}/labs/city/${city.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.8 });
    }
  }
  for (const list of getAllLabLists()) {
    entries.push({ url: `${baseUrl}/labs/lists/${list.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.8 });
  }
  // Lab guides
  for (const guide of GUIDE_SLUGS_LABS) {
    entries.push({ url: `${baseUrl}/labs/guides/${guide}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.8 });
    for (const city of CITIES) {
      const cityLabs = LAB_PROFILES.filter((l) => l.cities.includes(city.slug));
      if (cityLabs.length >= 2) {
        entries.push({ url: `${baseUrl}/labs/guides/${guide}/${city.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.7 });
      }
    }
  }
  // Lab conditions
  for (const condition of CONDITION_SLUGS) {
    entries.push({ url: `${baseUrl}/labs/conditions/${condition}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.8 });
    for (const city of CITIES) {
      entries.push({ url: `${baseUrl}/labs/conditions/${condition}/${city.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.7 });
    }
  }
  // Lab results interpretation
  for (const test of RESULTS_SLUGS) {
    entries.push({ url: `${baseUrl}/labs/results/${test}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.8 });
  }
  // Lab vs comparison pages — all valid C(N,2) pairs with ≥5 shared tests
  {
    const MIN_COMMON_TESTS = 5;
    const testSetByLab = new Map<string, Set<string>>();
    for (const lab of LAB_PROFILES) {
      testSetByLab.set(lab.slug, new Set(LAB_TEST_PRICES.filter((p) => p.labSlug === lab.slug).map((p) => p.testSlug)));
    }
    for (let i = 0; i < LAB_PROFILES.length; i++) {
      for (let j = i + 1; j < LAB_PROFILES.length; j++) {
        const a = LAB_PROFILES[i].slug;
        const b = LAB_PROFILES[j].slug;
        const setA = testSetByLab.get(a) ?? new Set<string>();
        const setB = testSetByLab.get(b) ?? new Set<string>();
        const common = Array.from(setA).filter((t) => setB.has(t)).length;
        if (common >= MIN_COMMON_TESTS) {
          const [sortedA, sortedB] = [a, b].sort();
          entries.push({ url: `${baseUrl}/labs/vs/${sortedA}-vs-${sortedB}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.7 });
        }
      }
    }
  }
  // Lab city × test-category pages
  for (const city of CITIES) {
    const labSlugsInCity = new Set(LAB_PROFILES.filter((l) => l.cities.includes(city.slug)).map((l) => l.slug));
    if (labSlugsInCity.size === 0) continue;
    for (const cat of TEST_CATEGORIES) {
      const hasPrices = LAB_TEST_PRICES.some((p) => labSlugsInCity.has(p.labSlug));
      if (hasPrices) {
        entries.push({ url: `${baseUrl}/labs/city/${city.slug}/${cat.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.7 });
      }
    }
  }
  // Lab home-collection city × test-category pages
  for (const city of CITIES) {
    const homeLabSlugs = new Set(LAB_PROFILES.filter((l) => l.cities.includes(city.slug) && l.homeCollection).map((l) => l.slug));
    if (homeLabSlugs.size === 0) continue;
    for (const cat of TEST_CATEGORIES) {
      if (cat.slug === "imaging") continue;
      const catTests = new Set(LAB_TESTS.filter((t) => t.category === cat.slug).map((t) => t.slug));
      const hasPrices = LAB_TEST_PRICES.some((p) => homeLabSlugs.has(p.labSlug) && catTests.has(p.testSlug));
      if (hasPrices) {
        entries.push({ url: `${baseUrl}/labs/home-collection/${city.slug}/${cat.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.7 });
      }
    }
  }

  // Insurance navigator
  entries.push({ url: `${baseUrl}/insurance`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.9 });
  entries.push({ url: `${baseUrl}/insurance/compare`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.7 });
  for (const insurer of INSURANCE_PROVIDERS) {
    entries.push({ url: `${baseUrl}/insurance/${insurer.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.8 });
  }
  for (let i = 0; i < INSURER_PROFILES.length; i++) {
    for (let j = i + 1; j < INSURER_PROFILES.length; j++) {
      const [a, b] = [INSURER_PROFILES[i].slug, INSURER_PROFILES[j].slug].sort();
      entries.push({ url: `${baseUrl}/insurance/compare/${a}-vs-${b}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.7 });
    }
  }
  entries.push({ url: `${baseUrl}/insurance/guide`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.7 });
  for (const slug of INSURANCE_GUIDE_SLUGS) {
    entries.push({ url: `${baseUrl}/insurance/guide/${slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.65 });
  }

  // Pricing hub — procedures, comparisons, lists, guides, journeys
  entries.push({ url: `${baseUrl}/pricing`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.9 });
  for (const proc of PROCEDURES) {
    entries.push({ url: `${baseUrl}/pricing/${proc.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.8 });
    for (const city of CITIES) {
      if (proc.cityPricing[city.slug]) {
        entries.push({ url: `${baseUrl}/pricing/${proc.slug}/${city.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.75 });
      }
    }
  }
  for (const cat of PROCEDURE_CATEGORIES) {
    entries.push({ url: `${baseUrl}/pricing/category/${cat.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.7 });
    for (const city of CITIES) {
      entries.push({ url: `${baseUrl}/pricing/category/${cat.slug}/${city.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.65 });
    }
  }
  for (const city of CITIES) {
    entries.push({ url: `${baseUrl}/pricing/city/${city.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.75 });
  }
  // Pricing lists
  entries.push({ url: `${baseUrl}/pricing/lists`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.7 });
  for (const list of PRICING_LISTS) {
    for (const city of CITIES) {
      entries.push({ url: `${baseUrl}/pricing/lists/${list.slug}/${city.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.7 });
    }
  }
  // Pricing guides
  entries.push({ url: `${baseUrl}/pricing/guide`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.7 });
  for (const guide of PRICING_GUIDES) {
    entries.push({ url: `${baseUrl}/pricing/guide/${guide.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.7 });
    for (const city of CITIES) {
      entries.push({ url: `${baseUrl}/pricing/guide/${guide.slug}/${city.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.65 });
    }
  }
  // Care journeys
  entries.push({ url: `${baseUrl}/pricing/journey`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.7 });
  for (const journey of CARE_JOURNEYS) {
    entries.push({ url: `${baseUrl}/pricing/journey/${journey.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.7 });
    for (const city of CITIES) {
      entries.push({ url: `${baseUrl}/pricing/journey/${journey.slug}/${city.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.65 });
    }
  }
  // Procedure comparisons (vs pages)
  entries.push({ url: `${baseUrl}/pricing/vs`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.7 });
  for (const comp of PROCEDURE_COMPARISONS) {
    entries.push({ url: `${baseUrl}/pricing/vs/${comp.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.7 });
    for (const city of CITIES) {
      entries.push({ url: `${baseUrl}/pricing/vs/${comp.slug}/${city.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.65 });
    }
  }
  // Price comparison tool + city-vs-city pages
  entries.push({ url: `${baseUrl}/pricing/compare`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.7 });
  for (let i = 0; i < CITIES.length; i++) {
    for (let j = i + 1; j < CITIES.length; j++) {
      entries.push({ url: `${baseUrl}/pricing/compare/${CITIES[i].slug}-vs-${CITIES[j].slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.65 });
    }
  }

  // Professional directory
  entries.push({ url: `${baseUrl}/professionals`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.9 });
  entries.push({ url: `${baseUrl}/find-a-doctor`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.9 });
  for (const cat of PROFESSIONAL_CATEGORIES) {
    entries.push({ url: `${baseUrl}/professionals/${cat.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.85 });
  }
  for (const spec of ALL_SPECIALTIES) {
    entries.push({ url: `${baseUrl}/professionals/${spec.category}/${spec.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.8 });
  }
  for (const slug of getAllFacilitySlugs(20)) {
    entries.push({ url: `${baseUrl}/professionals/facility/${slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.75 });
  }
  for (const combo of getFacilitySpecialtyCombos(5)) {
    entries.push({ url: `${baseUrl}/professionals/facility/${combo.facilitySlug}/${combo.specialtySlug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.7 });
  }

  // Professional directory — area pages
  for (const area of getAreaStats()) {
    entries.push({ url: `${baseUrl}/professionals/area/${area.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.8 });
  }
  for (const combo of getAreaSpecialtyCombos(3)) {
    entries.push({ url: `${baseUrl}/professionals/area/${combo.areaSlug}/${combo.specialtySlug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.7 });
  }

  // Professional directory — specialist/consultant split pages
  for (const spec of getSpecialtiesWithBothLevels()) {
    const specDef = ALL_SPECIALTIES.find((s) => s.slug === spec.slug);
    if (specDef) {
      entries.push({ url: `${baseUrl}/professionals/${specDef.category}/${spec.slug}/specialists`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.7 });
      entries.push({ url: `${baseUrl}/professionals/${specDef.category}/${spec.slug}/consultants`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.7 });
    }
  }

  // Professional directory — guide pages
  const PROF_GUIDE_SLUGS = [
    "specialist-vs-consultant", "dha-licensing", "ftl-vs-reg", "how-to-verify-doctor",
    "choosing-right-specialist", "healthcare-workforce", "medical-specialties-explained", "international-doctors-dubai",
  ];
  for (const slug of PROF_GUIDE_SLUGS) {
    entries.push({ url: `${baseUrl}/professionals/guide/${slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.75 });
  }

  // Professional directory — stats page
  entries.push({ url: `${baseUrl}/professionals/stats`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.8 });

  // Best doctors pages
  const DOCTOR_SPECIALTIES = [...PHYSICIAN_SPECIALTIES, ...DENTIST_SPECIALTIES];
  entries.push({ url: `${baseUrl}/best/doctors`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.9 });
  for (const spec of DOCTOR_SPECIALTIES) {
    entries.push({ url: `${baseUrl}/best/doctors/${spec.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.85 });
  }

  // Specialty comparison pages
  const top15Specs = [...PHYSICIAN_SPECIALTIES].sort((a, b) => b.count - a.count).slice(0, 15);
  for (let i = 0; i < top15Specs.length; i++) {
    for (let j = i + 1; j < top15Specs.length; j++) {
      entries.push({ url: `${baseUrl}/professionals/compare/${top15Specs[i].slug}-vs-${top15Specs[j].slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.65 });
    }
  }

  // Doctors-at facility alias pages
  for (const fac of getAllFacilities(20).slice(0, 50)) {
    entries.push({ url: `${baseUrl}/doctors-at/${fac.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.75 });
  }

  // ─── Workforce Intelligence Section ─────────────────────────────────────────
  // Hub pages
  const workforceHubs = ["workforce", "workforce/overview", "workforce/employers", "workforce/specialties", "workforce/areas", "workforce/benchmarks", "workforce/careers", "workforce/rankings", "workforce/compare", "workforce/supply"];
  for (const hub of workforceHubs) {
    entries.push({ url: `${baseUrl}/${hub}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.85 });
  }

  // Category workforce pages
  for (const cat of PROFESSIONAL_CATEGORIES) {
    entries.push({ url: `${baseUrl}/workforce/category/${cat.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.8 });
    entries.push({ url: `${baseUrl}/workforce/career/category/${cat.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.7 });
  }

  // Specialty workforce + career + supply pages
  for (const spec of ALL_SPECIALTIES) {
    entries.push({ url: `${baseUrl}/workforce/specialty/${spec.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.75 });
    entries.push({ url: `${baseUrl}/workforce/career/${spec.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.7 });
  }
  for (const spec of PHYSICIAN_SPECIALTIES) {
    entries.push({ url: `${baseUrl}/workforce/supply/${spec.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.7 });
  }

  // Employer workforce pages
  for (const fac of getAllFacilities(20).slice(0, 100)) {
    entries.push({ url: `${baseUrl}/workforce/employer/${fac.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.7 });
  }

  // Area workforce pages
  const wfAreas = getAreaStats();
  for (const area of wfAreas) {
    entries.push({ url: `${baseUrl}/workforce/area/${area.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.7 });
    for (const cat of PROFESSIONAL_CATEGORIES) {
      const count = getProfessionalsByAreaAndCategory(area.slug, cat.slug).length;
      if (count >= 10) {
        entries.push({ url: `${baseUrl}/workforce/area/${area.slug}/${cat.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.6 });
      }
    }
  }

  // Rankings pages
  entries.push({ url: `${baseUrl}/workforce/rankings/top-employers`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.8 });
  entries.push({ url: `${baseUrl}/workforce/rankings/largest-specialties`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.8 });
  for (const cat of PROFESSIONAL_CATEGORIES) {
    entries.push({ url: `${baseUrl}/workforce/rankings/top-employers/${cat.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.75 });
  }

  // Benchmark pages
  const benchmarkSlugs = ["nurse-to-doctor", "staff-per-facility", "specialist-per-capita", "ftl-rate"];
  for (const slug of benchmarkSlugs) {
    entries.push({ url: `${baseUrl}/workforce/benchmarks/${slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.75 });
  }

  // Workforce comparison pages
  const wfTop15 = [...PHYSICIAN_SPECIALTIES].sort((a, b) => b.count - a.count).slice(0, 15);
  for (let i = 0; i < wfTop15.length; i++) {
    for (let j = i + 1; j < wfTop15.length; j++) {
      entries.push({ url: `${baseUrl}/workforce/compare/specialty/${wfTop15[i].slug}-vs-${wfTop15[j].slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.6 });
    }
  }
  const wfTopAreas = getTopAreas(10);
  for (let i = 0; i < wfTopAreas.length; i++) {
    for (let j = i + 1; j < wfTopAreas.length; j++) {
      entries.push({ url: `${baseUrl}/workforce/compare/area/${wfTopAreas[i].slug}-vs-${wfTopAreas[j].slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.6 });
    }
  }
  const wfTopFacs = getTopFacilities(20);
  for (let i = 0; i < wfTopFacs.length; i++) {
    for (let j = i + 1; j < wfTopFacs.length; j++) {
      entries.push({ url: `${baseUrl}/workforce/compare/employer/${wfTopFacs[i].slug}-vs-${wfTopFacs[j].slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.55 });
    }
  }
  for (let i = 0; i < PROFESSIONAL_CATEGORIES.length; i++) {
    for (let j = i + 1; j < PROFESSIONAL_CATEGORIES.length; j++) {
      entries.push({ url: `${baseUrl}/workforce/compare/category/${PROFESSIONAL_CATEGORIES[i].slug}-vs-${PROFESSIONAL_CATEGORIES[j].slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.6 });
    }
  }

  // ─── Landing / Product Pages ──────────────────────────────────────────────────
  const LANDING_PRODUCT_SLUGS = [
    "contact", "book-a-demo", "captain", "payments", "emr", "chat", "bookings",
    "ai-agents", "crm", "integrations", "voice", "mobile", "automations",
    "campaigns", "dental", "widgets", "analytics",
  ];
  for (const slug of LANDING_PRODUCT_SLUGS) {
    entries.push({ url: `${baseUrl}/${slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.6 });
  }
  // Landing specialty pages
  const LANDING_SPECIALTY_SLUGS = [
    "dermatology", "optometry", "orthopedics", "ent", "urgent-care",
    "mental-health", "veterinary", "homecare", "aesthetic", "longevity-wellness",
  ];
  for (const slug of LANDING_SPECIALTY_SLUGS) {
    entries.push({ url: `${baseUrl}/${slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.6 });
  }

  // ─── Research Reports ────────────────────────────────────────────────────────
  // Research reports are read from the filesystem at build time. Using hardcoded slugs
  // here because reports-fs.ts reads from disk (not suitable for sitemap sync context).
  entries.push({ url: `${baseUrl}/research`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.85 });
  const RESEARCH_REPORT_SLUGS = [
    "ai-healthcare-uae", "clinics-aesthetics", "fintech-banking-uae",
    "future-retail-ai", "hospitality-dubai", "qatar-business-report",
    "real-estate-protech", "uae-patient-no-show-cost-2026",
  ];
  for (const slug of RESEARCH_REPORT_SLUGS) {
    entries.push({ url: `${baseUrl}/research/${slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.75 });
  }

  // Static pages
  entries.push(
    { url: `${baseUrl}/about`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/editorial-policy`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/privacy-policy`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/terms`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.3 },
  );

  // ─── Arabic Mirrors ─────────────────────────────────────────────────────────
  // Arabic homepage
  entries.push({
    url: `${baseUrl}/ar`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "daily", priority: 0.9,
    alternates: { languages: { en: baseUrl, ar: `${baseUrl}/ar` } },
  });

  // Arabic — directory city + city×category + city×area pages
  for (const city of cities) {
    entries.push({
      url: `${baseUrl}/ar/directory/${city.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "daily", priority: 0.8,
      alternates: { languages: { en: `${baseUrl}/directory/${city.slug}`, ar: `${baseUrl}/ar/directory/${city.slug}` } },
    });
    for (const cat of categories) {
      entries.push({
        url: `${baseUrl}/ar/directory/${city.slug}/${cat.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.7,
        alternates: { languages: { en: `${baseUrl}/directory/${city.slug}/${cat.slug}`, ar: `${baseUrl}/ar/directory/${city.slug}/${cat.slug}` } },
      });
    }
    const areas = getAreasByCity(city.slug);
    for (const area of areas) {
      entries.push({
        url: `${baseUrl}/ar/directory/${city.slug}/${area.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.6,
        alternates: { languages: { en: `${baseUrl}/directory/${city.slug}/${area.slug}`, ar: `${baseUrl}/ar/directory/${city.slug}/${area.slug}` } },
      });
    }
    // Arabic — city insurance index
    entries.push({
      url: `${baseUrl}/ar/directory/${city.slug}/insurance`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.6,
      alternates: { languages: { en: `${baseUrl}/directory/${city.slug}/insurance`, ar: `${baseUrl}/ar/directory/${city.slug}/insurance` } },
    });
    // Arabic — city × insurer pages
    for (const insurer of INSURANCE_PROVIDERS) {
      entries.push({
        url: `${baseUrl}/ar/directory/${city.slug}/insurance/${insurer.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.6,
        alternates: { languages: { en: `${baseUrl}/directory/${city.slug}/insurance/${insurer.slug}`, ar: `${baseUrl}/ar/directory/${city.slug}/insurance/${insurer.slug}` } },
      });
    }
  }

  // Arabic — search
  entries.push({
    url: `${baseUrl}/ar/search`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "daily", priority: 0.7,
    alternates: { languages: { en: `${baseUrl}/search`, ar: `${baseUrl}/ar/search` } },
  });

  // Arabic — intelligence
  entries.push({
    url: `${baseUrl}/ar/intelligence`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "daily", priority: 0.7,
    alternates: { languages: { en: `${baseUrl}/intelligence`, ar: `${baseUrl}/ar/intelligence` } },
  });

  // Arabic — insurance
  entries.push({
    url: `${baseUrl}/ar/insurance`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.7,
    alternates: { languages: { en: `${baseUrl}/insurance`, ar: `${baseUrl}/ar/insurance` } },
  });
  entries.push({
    url: `${baseUrl}/ar/insurance/compare`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.6,
    alternates: { languages: { en: `${baseUrl}/insurance/compare`, ar: `${baseUrl}/ar/insurance/compare` } },
  });
  for (const insurer of INSURANCE_PROVIDERS) {
    entries.push({
      url: `${baseUrl}/ar/insurance/${insurer.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.65,
      alternates: { languages: { en: `${baseUrl}/insurance/${insurer.slug}`, ar: `${baseUrl}/ar/insurance/${insurer.slug}` } },
    });
  }
  entries.push({
    url: `${baseUrl}/ar/insurance/guide`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.6,
    alternates: { languages: { en: `${baseUrl}/insurance/guide`, ar: `${baseUrl}/ar/insurance/guide` } },
  });
  for (const slug of INSURANCE_GUIDE_SLUGS) {
    entries.push({
      url: `${baseUrl}/ar/insurance/guide/${slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.6,
      alternates: { languages: { en: `${baseUrl}/insurance/guide/${slug}`, ar: `${baseUrl}/ar/insurance/guide/${slug}` } },
    });
  }

  // Arabic — labs
  entries.push({
    url: `${baseUrl}/ar/labs`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.7,
    alternates: { languages: { en: `${baseUrl}/labs`, ar: `${baseUrl}/ar/labs` } },
  });
  entries.push({
    url: `${baseUrl}/ar/labs/compare`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.6,
    alternates: { languages: { en: `${baseUrl}/labs/compare`, ar: `${baseUrl}/ar/labs/compare` } },
  });
  for (const lab of LAB_PROFILES) {
    entries.push({
      url: `${baseUrl}/ar/labs/${lab.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.65,
      alternates: { languages: { en: `${baseUrl}/labs/${lab.slug}`, ar: `${baseUrl}/ar/labs/${lab.slug}` } },
    });
  }
  entries.push({
    url: `${baseUrl}/ar/labs/packages`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.65,
    alternates: { languages: { en: `${baseUrl}/labs/packages`, ar: `${baseUrl}/ar/labs/packages` } },
  });
  entries.push({
    url: `${baseUrl}/ar/labs/home-collection`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.65,
    alternates: { languages: { en: `${baseUrl}/labs/home-collection`, ar: `${baseUrl}/ar/labs/home-collection` } },
  });
  for (const cat of TEST_CATEGORIES) {
    entries.push({
      url: `${baseUrl}/ar/labs/category/${cat.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.6,
      alternates: { languages: { en: `${baseUrl}/labs/category/${cat.slug}`, ar: `${baseUrl}/ar/labs/category/${cat.slug}` } },
    });
  }
  for (const test of LAB_TESTS) {
    entries.push({
      url: `${baseUrl}/ar/labs/test/${test.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.6,
      alternates: { languages: { en: `${baseUrl}/labs/test/${test.slug}`, ar: `${baseUrl}/ar/labs/test/${test.slug}` } },
    });
  }
  for (const city of CITIES) {
    const cityLabs = LAB_PROFILES.filter((l) => l.cities.includes(city.slug));
    if (cityLabs.length > 0) {
      entries.push({
        url: `${baseUrl}/ar/labs/city/${city.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.6,
        alternates: { languages: { en: `${baseUrl}/labs/city/${city.slug}`, ar: `${baseUrl}/ar/labs/city/${city.slug}` } },
      });
    }
    const hcLabs = LAB_PROFILES.filter((l) => l.cities.includes(city.slug) && l.homeCollection);
    if (hcLabs.length > 0) {
      entries.push({
        url: `${baseUrl}/ar/labs/home-collection/${city.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.6,
        alternates: { languages: { en: `${baseUrl}/labs/home-collection/${city.slug}`, ar: `${baseUrl}/ar/labs/home-collection/${city.slug}` } },
      });
    }
  }

  // ─── Arabic — Professionals Directory ──────────────────────────────────────
  entries.push({
    url: `${baseUrl}/ar/professionals`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.8,
    alternates: { languages: { en: `${baseUrl}/professionals`, ar: `${baseUrl}/ar/professionals` } },
  });
  entries.push({
    url: `${baseUrl}/ar/find-a-doctor`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.8,
    alternates: { languages: { en: `${baseUrl}/find-a-doctor`, ar: `${baseUrl}/ar/find-a-doctor` } },
  });
  entries.push({
    url: `${baseUrl}/ar/professionals/stats`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.7,
    alternates: { languages: { en: `${baseUrl}/professionals/stats`, ar: `${baseUrl}/ar/professionals/stats` } },
  });
  for (const cat of PROFESSIONAL_CATEGORIES) {
    entries.push({
      url: `${baseUrl}/ar/professionals/${cat.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.75,
      alternates: { languages: { en: `${baseUrl}/professionals/${cat.slug}`, ar: `${baseUrl}/ar/professionals/${cat.slug}` } },
    });
  }
  for (const spec of ALL_SPECIALTIES) {
    entries.push({
      url: `${baseUrl}/ar/professionals/${spec.category}/${spec.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.7,
      alternates: { languages: { en: `${baseUrl}/professionals/${spec.category}/${spec.slug}`, ar: `${baseUrl}/ar/professionals/${spec.category}/${spec.slug}` } },
    });
  }
  for (const slug of getAllFacilitySlugs(20)) {
    entries.push({
      url: `${baseUrl}/ar/professionals/facility/${slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.65,
      alternates: { languages: { en: `${baseUrl}/professionals/facility/${slug}`, ar: `${baseUrl}/ar/professionals/facility/${slug}` } },
    });
  }
  for (const area of getAreaStats()) {
    entries.push({
      url: `${baseUrl}/ar/professionals/area/${area.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.65,
      alternates: { languages: { en: `${baseUrl}/professionals/area/${area.slug}`, ar: `${baseUrl}/ar/professionals/area/${area.slug}` } },
    });
  }
  // Arabic — specialist/consultant split
  for (const spec of getSpecialtiesWithBothLevels()) {
    const specDef = ALL_SPECIALTIES.find((s) => s.slug === spec.slug);
    if (specDef) {
      entries.push({
        url: `${baseUrl}/ar/professionals/${specDef.category}/${spec.slug}/specialists`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.6,
        alternates: { languages: { en: `${baseUrl}/professionals/${specDef.category}/${spec.slug}/specialists`, ar: `${baseUrl}/ar/professionals/${specDef.category}/${spec.slug}/specialists` } },
      });
      entries.push({
        url: `${baseUrl}/ar/professionals/${specDef.category}/${spec.slug}/consultants`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.6,
        alternates: { languages: { en: `${baseUrl}/professionals/${specDef.category}/${spec.slug}/consultants`, ar: `${baseUrl}/ar/professionals/${specDef.category}/${spec.slug}/consultants` } },
      });
    }
  }
  // Arabic — specialty comparisons
  for (let i = 0; i < top15Specs.length; i++) {
    for (let j = i + 1; j < top15Specs.length; j++) {
      entries.push({
        url: `${baseUrl}/ar/professionals/compare/${top15Specs[i].slug}-vs-${top15Specs[j].slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.55,
        alternates: { languages: { en: `${baseUrl}/professionals/compare/${top15Specs[i].slug}-vs-${top15Specs[j].slug}`, ar: `${baseUrl}/ar/professionals/compare/${top15Specs[i].slug}-vs-${top15Specs[j].slug}` } },
      });
    }
  }
  // Arabic — professionals guide pages
  const PROF_GUIDE_SLUGS_AR = [
    "specialist-vs-consultant", "dha-licensing", "ftl-vs-reg", "how-to-verify-doctor",
    "choosing-right-specialist", "healthcare-workforce", "medical-specialties-explained", "international-doctors-dubai",
  ];
  for (const slug of PROF_GUIDE_SLUGS_AR) {
    entries.push({
      url: `${baseUrl}/ar/professionals/guide/${slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.65,
      alternates: { languages: { en: `${baseUrl}/professionals/guide/${slug}`, ar: `${baseUrl}/ar/professionals/guide/${slug}` } },
    });
  }

  // ─── Arabic — Best Doctors + Doctors-At ───────────────────────────────────
  entries.push({
    url: `${baseUrl}/ar/best`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.8,
    alternates: { languages: { en: `${baseUrl}/best`, ar: `${baseUrl}/ar/best` } },
  });
  for (const city of cities) {
    entries.push({
      url: `${baseUrl}/ar/best/${city.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.75,
      alternates: { languages: { en: `${baseUrl}/best/${city.slug}`, ar: `${baseUrl}/ar/best/${city.slug}` } },
    });
    for (const cat of categories) {
      entries.push({
        url: `${baseUrl}/ar/best/${city.slug}/${cat.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.7,
        alternates: { languages: { en: `${baseUrl}/best/${city.slug}/${cat.slug}`, ar: `${baseUrl}/ar/best/${city.slug}/${cat.slug}` } },
      });
    }
  }
  entries.push({
    url: `${baseUrl}/ar/best/doctors`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.8,
    alternates: { languages: { en: `${baseUrl}/best/doctors`, ar: `${baseUrl}/ar/best/doctors` } },
  });
  for (const spec of DOCTOR_SPECIALTIES) {
    entries.push({
      url: `${baseUrl}/ar/best/doctors/${spec.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.75,
      alternates: { languages: { en: `${baseUrl}/best/doctors/${spec.slug}`, ar: `${baseUrl}/ar/best/doctors/${spec.slug}` } },
    });
  }
  for (const fac of getAllFacilities(20).slice(0, 50)) {
    entries.push({
      url: `${baseUrl}/ar/doctors-at/${fac.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.65,
      alternates: { languages: { en: `${baseUrl}/doctors-at/${fac.slug}`, ar: `${baseUrl}/ar/doctors-at/${fac.slug}` } },
    });
  }

  // ─── Arabic — Workforce Intelligence ──────────────────────────────────────
  const arWorkforceHubs = ["workforce", "workforce/overview", "workforce/employers", "workforce/specialties", "workforce/areas", "workforce/benchmarks", "workforce/careers", "workforce/rankings", "workforce/compare", "workforce/supply"];
  for (const hub of arWorkforceHubs) {
    entries.push({
      url: `${baseUrl}/ar/${hub}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.7,
      alternates: { languages: { en: `${baseUrl}/${hub}`, ar: `${baseUrl}/ar/${hub}` } },
    });
  }
  for (const cat of PROFESSIONAL_CATEGORIES) {
    entries.push({
      url: `${baseUrl}/ar/workforce/category/${cat.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.65,
      alternates: { languages: { en: `${baseUrl}/workforce/category/${cat.slug}`, ar: `${baseUrl}/ar/workforce/category/${cat.slug}` } },
    });
    entries.push({
      url: `${baseUrl}/ar/workforce/career/category/${cat.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.6,
      alternates: { languages: { en: `${baseUrl}/workforce/career/category/${cat.slug}`, ar: `${baseUrl}/ar/workforce/career/category/${cat.slug}` } },
    });
  }
  for (const spec of ALL_SPECIALTIES) {
    entries.push({
      url: `${baseUrl}/ar/workforce/specialty/${spec.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.6,
      alternates: { languages: { en: `${baseUrl}/workforce/specialty/${spec.slug}`, ar: `${baseUrl}/ar/workforce/specialty/${spec.slug}` } },
    });
    entries.push({
      url: `${baseUrl}/ar/workforce/career/${spec.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.6,
      alternates: { languages: { en: `${baseUrl}/workforce/career/${spec.slug}`, ar: `${baseUrl}/ar/workforce/career/${spec.slug}` } },
    });
  }
  for (const spec of PHYSICIAN_SPECIALTIES) {
    entries.push({
      url: `${baseUrl}/ar/workforce/supply/${spec.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.6,
      alternates: { languages: { en: `${baseUrl}/workforce/supply/${spec.slug}`, ar: `${baseUrl}/ar/workforce/supply/${spec.slug}` } },
    });
  }
  for (const fac of getAllFacilities(20).slice(0, 100)) {
    entries.push({
      url: `${baseUrl}/ar/workforce/employer/${fac.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.6,
      alternates: { languages: { en: `${baseUrl}/workforce/employer/${fac.slug}`, ar: `${baseUrl}/ar/workforce/employer/${fac.slug}` } },
    });
  }
  for (const area of wfAreas) {
    entries.push({
      url: `${baseUrl}/ar/workforce/area/${area.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.6,
      alternates: { languages: { en: `${baseUrl}/workforce/area/${area.slug}`, ar: `${baseUrl}/ar/workforce/area/${area.slug}` } },
    });
    // Arabic — workforce area × category pages
    for (const cat of PROFESSIONAL_CATEGORIES) {
      const count = getProfessionalsByAreaAndCategory(area.slug, cat.slug).length;
      if (count >= 10) {
        entries.push({
          url: `${baseUrl}/ar/workforce/area/${area.slug}/${cat.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.55,
          alternates: { languages: { en: `${baseUrl}/workforce/area/${area.slug}/${cat.slug}`, ar: `${baseUrl}/ar/workforce/area/${area.slug}/${cat.slug}` } },
        });
      }
    }
  }
  // Arabic — workforce rankings
  entries.push({
    url: `${baseUrl}/ar/workforce/rankings/top-employers`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.65,
    alternates: { languages: { en: `${baseUrl}/workforce/rankings/top-employers`, ar: `${baseUrl}/ar/workforce/rankings/top-employers` } },
  });
  entries.push({
    url: `${baseUrl}/ar/workforce/rankings/largest-specialties`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.65,
    alternates: { languages: { en: `${baseUrl}/workforce/rankings/largest-specialties`, ar: `${baseUrl}/ar/workforce/rankings/largest-specialties` } },
  });
  for (const cat of PROFESSIONAL_CATEGORIES) {
    entries.push({
      url: `${baseUrl}/ar/workforce/rankings/top-employers/${cat.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.6,
      alternates: { languages: { en: `${baseUrl}/workforce/rankings/top-employers/${cat.slug}`, ar: `${baseUrl}/ar/workforce/rankings/top-employers/${cat.slug}` } },
    });
  }
  // Arabic — workforce benchmarks
  for (const slug of benchmarkSlugs) {
    entries.push({
      url: `${baseUrl}/ar/workforce/benchmarks/${slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.6,
      alternates: { languages: { en: `${baseUrl}/workforce/benchmarks/${slug}`, ar: `${baseUrl}/ar/workforce/benchmarks/${slug}` } },
    });
  }
  // Arabic — workforce compare sub-pages (specialty, area, employer, category)
  for (let i = 0; i < wfTop15.length; i++) {
    for (let j = i + 1; j < wfTop15.length; j++) {
      entries.push({
        url: `${baseUrl}/ar/workforce/compare/specialty/${wfTop15[i].slug}-vs-${wfTop15[j].slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.55,
        alternates: { languages: { en: `${baseUrl}/workforce/compare/specialty/${wfTop15[i].slug}-vs-${wfTop15[j].slug}`, ar: `${baseUrl}/ar/workforce/compare/specialty/${wfTop15[i].slug}-vs-${wfTop15[j].slug}` } },
      });
    }
  }
  for (let i = 0; i < wfTopAreas.length; i++) {
    for (let j = i + 1; j < wfTopAreas.length; j++) {
      entries.push({
        url: `${baseUrl}/ar/workforce/compare/area/${wfTopAreas[i].slug}-vs-${wfTopAreas[j].slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.55,
        alternates: { languages: { en: `${baseUrl}/workforce/compare/area/${wfTopAreas[i].slug}-vs-${wfTopAreas[j].slug}`, ar: `${baseUrl}/ar/workforce/compare/area/${wfTopAreas[i].slug}-vs-${wfTopAreas[j].slug}` } },
      });
    }
  }
  for (let i = 0; i < wfTopFacs.length; i++) {
    for (let j = i + 1; j < wfTopFacs.length; j++) {
      entries.push({
        url: `${baseUrl}/ar/workforce/compare/employer/${wfTopFacs[i].slug}-vs-${wfTopFacs[j].slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.5,
        alternates: { languages: { en: `${baseUrl}/workforce/compare/employer/${wfTopFacs[i].slug}-vs-${wfTopFacs[j].slug}`, ar: `${baseUrl}/ar/workforce/compare/employer/${wfTopFacs[i].slug}-vs-${wfTopFacs[j].slug}` } },
      });
    }
  }
  for (let i = 0; i < PROFESSIONAL_CATEGORIES.length; i++) {
    for (let j = i + 1; j < PROFESSIONAL_CATEGORIES.length; j++) {
      entries.push({
        url: `${baseUrl}/ar/workforce/compare/category/${PROFESSIONAL_CATEGORIES[i].slug}-vs-${PROFESSIONAL_CATEGORIES[j].slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.55,
        alternates: { languages: { en: `${baseUrl}/workforce/compare/category/${PROFESSIONAL_CATEGORIES[i].slug}-vs-${PROFESSIONAL_CATEGORIES[j].slug}`, ar: `${baseUrl}/ar/workforce/compare/category/${PROFESSIONAL_CATEGORIES[i].slug}-vs-${PROFESSIONAL_CATEGORIES[j].slug}` } },
      });
    }
  }

  // ─── Arabic — Pricing ─────────────────────────────────────────────────────
  entries.push({
    url: `${baseUrl}/ar/pricing`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.8,
    alternates: { languages: { en: `${baseUrl}/pricing`, ar: `${baseUrl}/ar/pricing` } },
  });
  for (const proc of PROCEDURES) {
    entries.push({
      url: `${baseUrl}/ar/pricing/${proc.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.7,
      alternates: { languages: { en: `${baseUrl}/pricing/${proc.slug}`, ar: `${baseUrl}/ar/pricing/${proc.slug}` } },
    });
    for (const city of CITIES) {
      if (proc.cityPricing[city.slug]) {
        entries.push({
          url: `${baseUrl}/ar/pricing/${proc.slug}/${city.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.65,
          alternates: { languages: { en: `${baseUrl}/pricing/${proc.slug}/${city.slug}`, ar: `${baseUrl}/ar/pricing/${proc.slug}/${city.slug}` } },
        });
      }
    }
  }
  for (const cat of PROCEDURE_CATEGORIES) {
    entries.push({
      url: `${baseUrl}/ar/pricing/category/${cat.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.6,
      alternates: { languages: { en: `${baseUrl}/pricing/category/${cat.slug}`, ar: `${baseUrl}/ar/pricing/category/${cat.slug}` } },
    });
    for (const city of CITIES) {
      entries.push({
        url: `${baseUrl}/ar/pricing/category/${cat.slug}/${city.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.55,
        alternates: { languages: { en: `${baseUrl}/pricing/category/${cat.slug}/${city.slug}`, ar: `${baseUrl}/ar/pricing/category/${cat.slug}/${city.slug}` } },
      });
    }
  }
  for (const city of CITIES) {
    entries.push({
      url: `${baseUrl}/ar/pricing/city/${city.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.65,
      alternates: { languages: { en: `${baseUrl}/pricing/city/${city.slug}`, ar: `${baseUrl}/ar/pricing/city/${city.slug}` } },
    });
  }
  entries.push({
    url: `${baseUrl}/ar/pricing/compare`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.6,
    alternates: { languages: { en: `${baseUrl}/pricing/compare`, ar: `${baseUrl}/ar/pricing/compare` } },
  });
  for (let i = 0; i < CITIES.length; i++) {
    for (let j = i + 1; j < CITIES.length; j++) {
      entries.push({
        url: `${baseUrl}/ar/pricing/compare/${CITIES[i].slug}-vs-${CITIES[j].slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.55,
        alternates: { languages: { en: `${baseUrl}/pricing/compare/${CITIES[i].slug}-vs-${CITIES[j].slug}`, ar: `${baseUrl}/ar/pricing/compare/${CITIES[i].slug}-vs-${CITIES[j].slug}` } },
      });
    }
  }
  entries.push({
    url: `${baseUrl}/ar/pricing/guide`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.6,
    alternates: { languages: { en: `${baseUrl}/pricing/guide`, ar: `${baseUrl}/ar/pricing/guide` } },
  });
  for (const guide of PRICING_GUIDES) {
    entries.push({
      url: `${baseUrl}/ar/pricing/guide/${guide.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.6,
      alternates: { languages: { en: `${baseUrl}/pricing/guide/${guide.slug}`, ar: `${baseUrl}/ar/pricing/guide/${guide.slug}` } },
    });
    for (const city of CITIES) {
      entries.push({
        url: `${baseUrl}/ar/pricing/guide/${guide.slug}/${city.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.55,
        alternates: { languages: { en: `${baseUrl}/pricing/guide/${guide.slug}/${city.slug}`, ar: `${baseUrl}/ar/pricing/guide/${guide.slug}/${city.slug}` } },
      });
    }
  }
  entries.push({
    url: `${baseUrl}/ar/pricing/journey`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.6,
    alternates: { languages: { en: `${baseUrl}/pricing/journey`, ar: `${baseUrl}/ar/pricing/journey` } },
  });
  for (const journey of CARE_JOURNEYS) {
    entries.push({
      url: `${baseUrl}/ar/pricing/journey/${journey.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.6,
      alternates: { languages: { en: `${baseUrl}/pricing/journey/${journey.slug}`, ar: `${baseUrl}/ar/pricing/journey/${journey.slug}` } },
    });
    for (const city of CITIES) {
      entries.push({
        url: `${baseUrl}/ar/pricing/journey/${journey.slug}/${city.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.55,
        alternates: { languages: { en: `${baseUrl}/pricing/journey/${journey.slug}/${city.slug}`, ar: `${baseUrl}/ar/pricing/journey/${journey.slug}/${city.slug}` } },
      });
    }
  }
  entries.push({
    url: `${baseUrl}/ar/pricing/lists`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.6,
    alternates: { languages: { en: `${baseUrl}/pricing/lists`, ar: `${baseUrl}/ar/pricing/lists` } },
  });
  for (const list of PRICING_LISTS) {
    for (const city of CITIES) {
      entries.push({
        url: `${baseUrl}/ar/pricing/lists/${list.slug}/${city.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.55,
        alternates: { languages: { en: `${baseUrl}/pricing/lists/${list.slug}/${city.slug}`, ar: `${baseUrl}/ar/pricing/lists/${list.slug}/${city.slug}` } },
      });
    }
  }
  entries.push({
    url: `${baseUrl}/ar/pricing/vs`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.6,
    alternates: { languages: { en: `${baseUrl}/pricing/vs`, ar: `${baseUrl}/ar/pricing/vs` } },
  });
  for (const comp of PROCEDURE_COMPARISONS) {
    entries.push({
      url: `${baseUrl}/ar/pricing/vs/${comp.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.6,
      alternates: { languages: { en: `${baseUrl}/pricing/vs/${comp.slug}`, ar: `${baseUrl}/ar/pricing/vs/${comp.slug}` } },
    });
    for (const city of CITIES) {
      entries.push({
        url: `${baseUrl}/ar/pricing/vs/${comp.slug}/${city.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.55,
        alternates: { languages: { en: `${baseUrl}/pricing/vs/${comp.slug}/${city.slug}`, ar: `${baseUrl}/ar/pricing/vs/${comp.slug}/${city.slug}` } },
      });
    }
  }

  // ─── Arabic — Directory Guides, Compare, Top ──────────────────────────────
  entries.push({
    url: `${baseUrl}/ar/directory/guide`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.6,
    alternates: { languages: { en: `${baseUrl}/directory/guide`, ar: `${baseUrl}/ar/directory/guide` } },
  });
  for (const slug of GUIDE_SLUGS) {
    entries.push({
      url: `${baseUrl}/ar/directory/guide/${slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.55,
      alternates: { languages: { en: `${baseUrl}/directory/guide/${slug}`, ar: `${baseUrl}/ar/directory/guide/${slug}` } },
    });
  }
  entries.push({
    url: `${baseUrl}/ar/directory/compare`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.6,
    alternates: { languages: { en: `${baseUrl}/directory/compare`, ar: `${baseUrl}/ar/directory/compare` } },
  });
  entries.push({
    url: `${baseUrl}/ar/directory/top`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.7,
    alternates: { languages: { en: `${baseUrl}/directory/top`, ar: `${baseUrl}/ar/directory/top` } },
  });
  for (const cat of categories) {
    entries.push({
      url: `${baseUrl}/ar/directory/top/${cat.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.65,
      alternates: { languages: { en: `${baseUrl}/directory/top/${cat.slug}`, ar: `${baseUrl}/ar/directory/top/${cat.slug}` } },
    });
  }

  // Arabic — intelligence category pages
  for (const cat of JOURNAL_CATEGORIES) {
    entries.push({
      url: `${baseUrl}/ar/intelligence/category/${cat.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "daily", priority: 0.65,
      alternates: { languages: { en: `${baseUrl}/intelligence/category/${cat.slug}`, ar: `${baseUrl}/ar/intelligence/category/${cat.slug}` } },
    });
  }

  // SEO Guides (cost guides, comparisons, system guides)
  entries.push({ url: `${baseUrl}/guides`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.9 });
  for (const guide of GUIDES) {
    entries.push({ url: `${baseUrl}/guides/${guide.slug}`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.85 });
  }

  return entries;
}
