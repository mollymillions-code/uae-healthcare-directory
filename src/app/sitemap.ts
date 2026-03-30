import { MetadataRoute } from "next";
import { getCities, getCategories, getAreasByCity } from "@/lib/data";
import { getBaseUrl } from "@/lib/helpers";
import { INSURANCE_PROVIDERS } from "@/lib/constants/insurance";
import { INSURER_PROFILES } from "@/lib/insurance";
import { LANGUAGES } from "@/lib/constants/languages";
import { CONDITIONS } from "@/lib/constants/conditions";
import { LAB_PROFILES, LAB_TESTS, TEST_CATEGORIES } from "@/lib/constants/labs";
import { getAllLabLists } from "@/lib/labs-lists";
import { CITIES } from "@/lib/constants/cities";
import { PROCEDURES } from "@/lib/constants/procedures";
import { getAllComparisonSlugs } from "@/lib/compare";
import { JOURNAL_CATEGORIES } from "@/lib/intelligence/categories";

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

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getBaseUrl();
  const cities = getCities();
  const categories = getCategories();
  const entries: MetadataRoute.Sitemap = [];

  // Homepage
  entries.push({ url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 });

  // Directory: city pages + city×category + city×area structural pages (with hreflang)
  for (const city of cities) {
    entries.push({
      url: `${baseUrl}/directory/${city.slug}`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9,
      alternates: { languages: { en: `${baseUrl}/directory/${city.slug}`, ar: `${baseUrl}/ar/directory/${city.slug}` } },
    });
    for (const cat of categories) {
      entries.push({
        url: `${baseUrl}/directory/${city.slug}/${cat.slug}`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8,
        alternates: { languages: { en: `${baseUrl}/directory/${city.slug}/${cat.slug}`, ar: `${baseUrl}/ar/directory/${city.slug}/${cat.slug}` } },
      });
    }
    const areas = getAreasByCity(city.slug);
    for (const area of areas) {
      entries.push({
        url: `${baseUrl}/directory/${city.slug}/${area.slug}`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7,
        alternates: { languages: { en: `${baseUrl}/directory/${city.slug}/${area.slug}`, ar: `${baseUrl}/ar/directory/${city.slug}/${area.slug}` } },
      });
      for (const cat of categories) {
        entries.push({ url: `${baseUrl}/directory/${city.slug}/${area.slug}/${cat.slug}`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 });
      }
    }
    // Special filter pages
    entries.push({ url: `${baseUrl}/directory/${city.slug}/24-hours`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 });
    entries.push({ url: `${baseUrl}/directory/${city.slug}/insurance`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 });
    entries.push({ url: `${baseUrl}/directory/${city.slug}/language`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 });
    entries.push({ url: `${baseUrl}/directory/${city.slug}/condition`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 });
    // Insurance per city
    for (const insurer of INSURANCE_PROVIDERS) {
      entries.push({ url: `${baseUrl}/directory/${city.slug}/insurance/${insurer.slug}`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 });
    }
    // Language per city
    for (const lang of LANGUAGES) {
      entries.push({ url: `${baseUrl}/directory/${city.slug}/language/${lang.slug}`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 });
    }
    // Condition per city
    for (const condition of CONDITIONS) {
      entries.push({ url: `${baseUrl}/directory/${city.slug}/condition/${condition.slug}`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 });
    }
    // Procedure pages per city
    const procsInCity = PROCEDURES.filter((p) => p.cityPricing[city.slug]);
    if (procsInCity.length > 0) {
      entries.push({ url: `${baseUrl}/directory/${city.slug}/procedures`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 });
      for (const proc of procsInCity) {
        entries.push({ url: `${baseUrl}/directory/${city.slug}/procedures/${proc.slug}`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.75 });
      }
    }
  }

  // Best pages
  entries.push({ url: `${baseUrl}/best`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 });
  for (const city of cities) {
    entries.push({ url: `${baseUrl}/best/${city.slug}`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.85 });
    for (const cat of categories) {
      entries.push({ url: `${baseUrl}/best/${city.slug}/${cat.slug}`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.85 });
    }
  }

  // Top 10
  entries.push({ url: `${baseUrl}/directory/top`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 });
  for (const cat of categories) {
    entries.push({ url: `${baseUrl}/directory/top/${cat.slug}`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.85 });
  }
  for (const city of cities) {
    entries.push({ url: `${baseUrl}/directory/${city.slug}/top`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.85 });
  }

  // Guides
  entries.push({ url: `${baseUrl}/directory/guide`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 });
  for (const slug of GUIDE_SLUGS) {
    entries.push({ url: `${baseUrl}/directory/guide/${slug}`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 });
  }

  // Comparisons
  entries.push({ url: `${baseUrl}/directory/compare`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 });
  for (const slug of getAllComparisonSlugs()) {
    entries.push({ url: `${baseUrl}/directory/compare/${slug}`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 });
  }

  // Intelligence / Journal
  entries.push({ url: `${baseUrl}/intelligence`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.95 });
  for (const cat of JOURNAL_CATEGORIES) {
    entries.push({ url: `${baseUrl}/intelligence/category/${cat.slug}`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 });
  }

  // Labs
  entries.push({ url: `${baseUrl}/labs`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 });
  entries.push({ url: `${baseUrl}/labs/compare`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 });
  for (const lab of LAB_PROFILES) {
    entries.push({ url: `${baseUrl}/labs/${lab.slug}`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 });
  }
  for (const test of LAB_TESTS) {
    entries.push({ url: `${baseUrl}/labs/test/${test.slug}`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 });
    for (const city of CITIES) {
      entries.push({ url: `${baseUrl}/labs/test/${test.slug}/${city.slug}`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 });
    }
  }
  for (const cat of TEST_CATEGORIES) {
    entries.push({ url: `${baseUrl}/labs/category/${cat.slug}`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 });
  }
  entries.push(
    { url: `${baseUrl}/labs/home-collection`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/labs/packages`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
  );
  for (const city of CITIES) {
    const hcLabs = LAB_PROFILES.filter((l) => l.cities.includes(city.slug) && l.homeCollection);
    if (hcLabs.length > 0) {
      entries.push({ url: `${baseUrl}/labs/home-collection/${city.slug}`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 });
    }
    const cityLabs = LAB_PROFILES.filter((l) => l.cities.includes(city.slug));
    if (cityLabs.length > 0) {
      entries.push({ url: `${baseUrl}/labs/city/${city.slug}`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 });
    }
  }
  for (const list of getAllLabLists()) {
    entries.push({ url: `${baseUrl}/labs/lists/${list.slug}`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 });
  }
  // Lab guides
  for (const guide of GUIDE_SLUGS_LABS) {
    entries.push({ url: `${baseUrl}/labs/guides/${guide}`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 });
    for (const city of CITIES) {
      const cityLabs = LAB_PROFILES.filter((l) => l.cities.includes(city.slug));
      if (cityLabs.length >= 2) {
        entries.push({ url: `${baseUrl}/labs/guides/${guide}/${city.slug}`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 });
      }
    }
  }
  // Lab conditions
  for (const condition of CONDITION_SLUGS) {
    entries.push({ url: `${baseUrl}/labs/conditions/${condition}`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 });
    for (const city of CITIES) {
      entries.push({ url: `${baseUrl}/labs/conditions/${condition}/${city.slug}`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 });
    }
  }
  // Lab results interpretation
  for (const test of RESULTS_SLUGS) {
    entries.push({ url: `${baseUrl}/labs/results/${test}`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 });
  }

  // Insurance navigator
  entries.push({ url: `${baseUrl}/insurance`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 });
  entries.push({ url: `${baseUrl}/insurance/compare`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 });
  for (const insurer of INSURANCE_PROVIDERS) {
    entries.push({ url: `${baseUrl}/insurance/${insurer.slug}`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 });
  }
  for (let i = 0; i < INSURER_PROFILES.length; i++) {
    for (let j = i + 1; j < INSURER_PROFILES.length; j++) {
      const [a, b] = [INSURER_PROFILES[i].slug, INSURER_PROFILES[j].slug].sort();
      entries.push({ url: `${baseUrl}/insurance/compare/${a}-vs-${b}`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 });
    }
  }
  entries.push({ url: `${baseUrl}/insurance/guide`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 });
  for (const slug of INSURANCE_GUIDE_SLUGS) {
    entries.push({ url: `${baseUrl}/insurance/guide/${slug}`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.65 });
  }

  // Static pages
  entries.push(
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/editorial-policy`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/privacy-policy`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/terms`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
  );

  // Arabic mirrors — structural pages with hreflang pointing back to English
  entries.push({ url: `${baseUrl}/ar`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 });
  for (const city of cities) {
    entries.push({
      url: `${baseUrl}/ar/directory/${city.slug}`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8,
      alternates: { languages: { en: `${baseUrl}/directory/${city.slug}`, ar: `${baseUrl}/ar/directory/${city.slug}` } },
    });
    for (const cat of categories) {
      entries.push({
        url: `${baseUrl}/ar/directory/${city.slug}/${cat.slug}`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7,
        alternates: { languages: { en: `${baseUrl}/directory/${city.slug}/${cat.slug}`, ar: `${baseUrl}/ar/directory/${city.slug}/${cat.slug}` } },
      });
    }
    const areas = getAreasByCity(city.slug);
    for (const area of areas) {
      entries.push({
        url: `${baseUrl}/ar/directory/${city.slug}/${area.slug}`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6,
        alternates: { languages: { en: `${baseUrl}/directory/${city.slug}/${area.slug}`, ar: `${baseUrl}/ar/directory/${city.slug}/${area.slug}` } },
      });
    }
  }

  return entries;
}
