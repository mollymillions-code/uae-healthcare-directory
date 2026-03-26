import { MetadataRoute } from "next";
import {
  getCities, getCategories, getAreasByCity, getProviders,
  getProviderCountByCategoryAndCity, getProviderCountByAreaAndCity,
  getProviderCountByInsurance, getProviderCountByLanguage,
  get24HourProviders, getEmergencyProviders, getGovernmentProviders,
  getWalkInProviders, getProvidersByInsurance, getProvidersByLanguage,
} from "@/lib/data";
import { getLatestArticles } from "@/lib/intelligence/data";
import { JOURNAL_CATEGORIES } from "@/lib/intelligence/categories";
import { getBaseUrl } from "@/lib/helpers";
import { INSURANCE_PROVIDERS } from "@/lib/constants/insurance";
import { INSURER_PROFILES, getInsurerNetworkStats } from "@/lib/insurance";
import { LANGUAGES } from "@/lib/constants/languages";
import { CONDITIONS } from "@/lib/constants/conditions";
import { LAB_PROFILES, LAB_TESTS, LAB_TEST_PRICES, TEST_CATEGORIES } from "@/lib/constants/labs";
import { getAllLabLists } from "@/lib/labs-lists";
import { CITIES } from "@/lib/constants/cities";
import { PROCEDURES } from "@/lib/constants/procedures";
import { getAllComparisonSlugs } from "@/lib/compare";

const GUIDE_SLUGS = [
  "how-uae-healthcare-works",
  "health-insurance-uae",
  "what-is-dha",
  "what-is-doh",
  "what-is-mohap",
  "choosing-a-doctor-uae",
  "healthcare-free-zones-dubai",
  "emergency-services-uae",
];

const INSURANCE_GUIDE_SLUGS = [
  "freelancer-health-insurance",
  "maternity-insurance-uae",
  "how-to-claim-health-insurance",
  "domestic-worker-insurance",
  "switching-health-insurance",
];

const WALK_IN_CATS = ["clinics", "dental", "dermatology", "ophthalmology", "pediatrics", "ent", "pharmacy", "labs-diagnostics", "emergency-care"];

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

export const revalidate = 3600; // Cache for 1 hour

export async function generateSitemaps() {
  return [
    { id: 0 },  // Core pages + cities + categories + areas + area×category facets
    { id: 1 },  // Provider pages (first half by alphabet)
    { id: 2 },  // Provider pages (second half by alphabet)
    { id: 3 },  // Facet pages (insurance, language, conditions, area combos)
    { id: 4 },  // Intelligence articles + journal
    { id: 5 },  // Labs pages
    { id: 6 },  // Insurance navigator + comparison pages
    { id: 7 },  // Arabic mirror pages
    { id: 8 },  // Area-level specialty pages (walk-in, 24hr, emergency, govt)
    { id: 9 },  // Top 10, guides, and remaining pages
  ];
}

// ─── Chunk 0: Core pages + cities + categories + areas + area×category ───────
async function generateCorePages(baseUrl: string): Promise<MetadataRoute.Sitemap> {
  const cities = getCities();
  const categories = getCategories();
  const entries: MetadataRoute.Sitemap = [];

  // Homepage
  entries.push({
    url: baseUrl,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 1.0,
    alternates: {
      languages: {
        "en-AE": baseUrl,
        "ar-AE": `${baseUrl}/ar`,
      },
    },
  });

  // Static pages
  entries.push(
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/editorial-policy`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/privacy-policy`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/terms`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
  );

  // Best index
  entries.push({
    url: `${baseUrl}/best`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.9,
  });

  for (const city of cities) {
    // City pages
    entries.push({
      url: `${baseUrl}/directory/${city.slug}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    });

    // City + Category pages — only if providers exist
    for (const cat of categories) {
      const catCount = await getProviderCountByCategoryAndCity(cat.slug, city.slug);
      if (catCount > 0) {
        entries.push({
          url: `${baseUrl}/directory/${city.slug}/${cat.slug}`,
          lastModified: new Date(),
          changeFrequency: "weekly",
          priority: 0.8,
        });
      }
    }

    // City + Area pages — only if providers exist
    const areas = getAreasByCity(city.slug);
    for (const area of areas) {
      const areaCount = await getProviderCountByAreaAndCity(area.slug, city.slug);
      if (areaCount > 0) {
        entries.push({
          url: `${baseUrl}/directory/${city.slug}/${area.slug}`,
          lastModified: new Date(),
          changeFrequency: "weekly",
          priority: 0.7,
        });

        // Area + Category facet pages — only if providers exist in this combination
        for (const cat of categories) {
          const { total } = await getProviders({ citySlug: city.slug, areaSlug: area.slug, categorySlug: cat.slug, limit: 1 });
          if (total > 0) {
            entries.push({
              url: `${baseUrl}/directory/${city.slug}/${area.slug}/${cat.slug}`,
              lastModified: new Date(),
              changeFrequency: "weekly",
              priority: 0.7,
            });
          }
        }
      }
    }

    // 24-Hours page per city (the "24-hours" variant under directory)
    entries.push({
      url: `${baseUrl}/directory/${city.slug}/24-hours`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    });

    // Best city-level
    entries.push({
      url: `${baseUrl}/best/${city.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.85,
    });

    // Best category-level per city — only where rated providers exist
    for (const cat of categories) {
      const bestCatCount = await getProviderCountByCategoryAndCity(cat.slug, city.slug);
      if (bestCatCount > 0) {
        entries.push({
          url: `${baseUrl}/best/${city.slug}/${cat.slug}`,
          lastModified: new Date(),
          changeFrequency: "weekly",
          priority: 0.85,
        });
      }
    }

    // Procedure cost pages per city
    const procsInCity = PROCEDURES.filter((p) => p.cityPricing[city.slug]);
    if (procsInCity.length > 0) {
      entries.push({
        url: `${baseUrl}/directory/${city.slug}/procedures`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      });
      for (const proc of procsInCity) {
        entries.push({
          url: `${baseUrl}/directory/${city.slug}/procedures/${proc.slug}`,
          lastModified: new Date(),
          changeFrequency: "weekly",
          priority: 0.75,
        });
      }
    }
  }

  return entries;
}

// ─── Chunk 1: Provider pages (first half by alphabet) ────────────────────────
async function generateProviderPagesFirstHalf(baseUrl: string): Promise<MetadataRoute.Sitemap> {
  const { providers } = await getProviders({ limit: 99999 });
  const sorted = [...providers].sort((a, b) => a.slug.localeCompare(b.slug));
  const midpoint = Math.ceil(sorted.length / 2);
  const firstHalf = sorted.slice(0, midpoint);

  return firstHalf.map((provider) => ({
    url: `${baseUrl}/directory/${provider.citySlug}/${provider.categorySlug}/${provider.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));
}

// ─── Chunk 2: Provider pages (second half by alphabet) ───────────────────────
async function generateProviderPagesSecondHalf(baseUrl: string): Promise<MetadataRoute.Sitemap> {
  const { providers } = await getProviders({ limit: 99999 });
  const sorted = [...providers].sort((a, b) => a.slug.localeCompare(b.slug));
  const midpoint = Math.ceil(sorted.length / 2);
  const secondHalf = sorted.slice(midpoint);

  return secondHalf.map((provider) => ({
    url: `${baseUrl}/directory/${provider.citySlug}/${provider.categorySlug}/${provider.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));
}

// ─── Chunk 3: Facet pages (insurance, language, conditions, area combos) ─────
async function generateFacetPages(baseUrl: string): Promise<MetadataRoute.Sitemap> {
  const cities = getCities();
  const categories = getCategories();
  const entries: MetadataRoute.Sitemap = [];

  for (const city of cities) {
    const areas = getAreasByCity(city.slug);

    // Area + Insurance pages — only if area has providers
    for (const area of areas) {
      const areaCount = await getProviderCountByAreaAndCity(area.slug, city.slug);
      if (areaCount > 0) {
        entries.push({
          url: `${baseUrl}/directory/${city.slug}/${area.slug}/insurance`,
          lastModified: new Date(),
          changeFrequency: "weekly",
          priority: 0.7,
        });
      }
    }

    // Insurance pages per city — only if providers accept that insurer
    entries.push({
      url: `${baseUrl}/directory/${city.slug}/insurance`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    });
    for (const insurer of INSURANCE_PROVIDERS) {
      const insCount = await getProviderCountByInsurance(insurer.slug, city.slug);
      if (insCount > 0) {
        entries.push({
          url: `${baseUrl}/directory/${city.slug}/insurance/${insurer.slug}`,
          lastModified: new Date(),
          changeFrequency: "weekly",
          priority: 0.7,
        });

        // Insurance x Category cross-reference pages (only where >= 2 providers)
        const insurerProviders = await getProvidersByInsurance(insurer.slug, city.slug);
        for (const cat of categories) {
          const catCount = insurerProviders.filter((p) => p.categorySlug === cat.slug).length;
          if (catCount >= 2) {
            entries.push({
              url: `${baseUrl}/directory/${city.slug}/insurance/${insurer.slug}/${cat.slug}`,
              lastModified: new Date(),
              changeFrequency: "weekly",
              priority: 0.65,
            });
          }
        }
      }
    }

    // Language pages per city — only if providers speak that language
    entries.push({
      url: `${baseUrl}/directory/${city.slug}/language`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    });
    for (const lang of LANGUAGES) {
      const langCount = await getProviderCountByLanguage(lang.slug, city.slug);
      if (langCount > 0) {
        entries.push({
          url: `${baseUrl}/directory/${city.slug}/language/${lang.slug}`,
          lastModified: new Date(),
          changeFrequency: "weekly",
          priority: 0.7,
        });
      }
    }

    // Language x Category pages per city
    for (const lang of LANGUAGES) {
      const langProviders = await getProvidersByLanguage(lang.slug, city.slug);
      if (langProviders.length === 0) continue;
      for (const cat of categories) {
        const catCount = langProviders.filter((p) => p.categorySlug === cat.slug).length;
        if (catCount >= 2) {
          entries.push({
            url: `${baseUrl}/directory/${city.slug}/language/${lang.slug}/${cat.slug}`,
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 0.65,
          });
        }
      }
    }

    // Condition pages per city — only if related categories have providers
    entries.push({
      url: `${baseUrl}/directory/${city.slug}/condition`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    });
    for (const condition of CONDITIONS) {
      const condCounts = await Promise.all((condition.relatedCategories ?? []).map((catSlug: string) => getProviderCountByCategoryAndCity(catSlug, city.slug)));
      const hasProviders = condCounts.some((c) => c > 0);
      if (hasProviders) {
        entries.push({
          url: `${baseUrl}/directory/${city.slug}/condition/${condition.slug}`,
          lastModified: new Date(),
          changeFrequency: "weekly",
          priority: 0.7,
        });
      }
    }
  }

  return entries;
}

// ─── Chunk 4: Intelligence articles + journal ────────────────────────────────
async function generateIntelligencePages(baseUrl: string): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  // Journal landing
  entries.push({
    url: `${baseUrl}/intelligence`,
    lastModified: new Date(),
    changeFrequency: "hourly",
    priority: 0.95,
  });

  // Journal category pages
  for (const cat of JOURNAL_CATEGORIES) {
    entries.push({
      url: `${baseUrl}/intelligence/category/${cat.slug}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    });
  }

  // Journal articles
  const journalArticles = getLatestArticles(100);
  for (const article of journalArticles) {
    entries.push({
      url: `${baseUrl}/intelligence/${article.slug}`,
      lastModified: new Date(article.updatedAt || article.publishedAt),
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }

  // Journal RSS feed
  entries.push({
    url: `${baseUrl}/intelligence/feed.xml`,
    lastModified: new Date(),
    changeFrequency: "hourly",
    priority: 0.3,
  });

  return entries;
}

// ─── Chunk 5: Labs pages ─────────────────────────────────────────────────────
async function generateLabsPages(baseUrl: string): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  // Labs landing + compare
  entries.push({
    url: `${baseUrl}/labs`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.9,
  });
  entries.push({
    url: `${baseUrl}/labs/compare`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.7,
  });

  // Lab profiles
  for (const lab of LAB_PROFILES) {
    entries.push({
      url: `${baseUrl}/labs/${lab.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }

  // Lab tests
  for (const test of LAB_TESTS) {
    entries.push({
      url: `${baseUrl}/labs/test/${test.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }

  // Test category pages
  for (const cat of TEST_CATEGORIES) {
    entries.push({
      url: `${baseUrl}/labs/category/${cat.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }

  // Home collection & packages hubs
  entries.push(
    { url: `${baseUrl}/labs/home-collection`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/labs/packages`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
  );

  // Home collection per city + city x category permutations
  for (const city of CITIES) {
    const hcLabs = LAB_PROFILES.filter((l) => l.cities.includes(city.slug) && l.homeCollection);
    if (hcLabs.length === 0) continue;
    entries.push({
      url: `${baseUrl}/labs/home-collection/${city.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    });
    const hcLabSlugs = new Set(hcLabs.map((l) => l.slug));
    for (const cat of TEST_CATEGORIES) {
      const hasCatTests = LAB_TESTS.some(
        (t) => t.category === cat.slug && LAB_TEST_PRICES.some((p) => hcLabSlugs.has(p.labSlug) && p.testSlug === t.slug)
      );
      if (hasCatTests) {
        entries.push({
          url: `${baseUrl}/labs/home-collection/${city.slug}/${cat.slug}`,
          lastModified: new Date(),
          changeFrequency: "weekly",
          priority: 0.7,
        });
      }
    }
  }

  // City-specific lab pages + city x category permutations
  for (const city of CITIES) {
    const cityLabs = LAB_PROFILES.filter((l) => l.cities.includes(city.slug));
    if (cityLabs.length === 0) continue;
    entries.push({
      url: `${baseUrl}/labs/city/${city.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    });
    for (const cat of TEST_CATEGORIES) {
      entries.push({
        url: `${baseUrl}/labs/city/${city.slug}/${cat.slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  }

  // Test x City permutations (/labs/test/[test]/[city])
  for (const test of LAB_TESTS) {
    for (const city of CITIES) {
      entries.push({
        url: `${baseUrl}/labs/test/${test.slug}/${city.slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  }

  // Programmatic Top-N Lists (/labs/lists/[slug])
  for (const list of getAllLabLists()) {
    entries.push({
      url: `${baseUrl}/labs/lists/${list.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }

  // Lab Guides (/labs/guides/[guide] + /labs/guides/[guide]/[city])
  for (const guide of GUIDE_SLUGS_LABS) {
    entries.push({
      url: `${baseUrl}/labs/guides/${guide}`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    });
    for (const city of CITIES) {
      const cityLabs = LAB_PROFILES.filter((l) => l.cities.includes(city.slug));
      if (cityLabs.length >= 2) {
        entries.push({
          url: `${baseUrl}/labs/guides/${guide}/${city.slug}`,
          lastModified: new Date(),
          changeFrequency: "monthly",
          priority: 0.7,
        });
      }
    }
  }

  // Lab Conditions (/labs/conditions/[condition] + /[city])
  for (const condition of CONDITION_SLUGS) {
    entries.push({
      url: `${baseUrl}/labs/conditions/${condition}`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    });
    for (const city of CITIES) {
      const cityLabs = LAB_PROFILES.filter((l) => l.cities.includes(city.slug));
      if (cityLabs.length >= 1) {
        entries.push({
          url: `${baseUrl}/labs/conditions/${condition}/${city.slug}`,
          lastModified: new Date(),
          changeFrequency: "monthly",
          priority: 0.7,
        });
      }
    }
  }

  // Lab vs Lab comparisons (/labs/vs/[comparison])
  for (let i = 0; i < LAB_PROFILES.length; i++) {
    for (let j = i + 1; j < LAB_PROFILES.length; j++) {
      const [a, b] = [LAB_PROFILES[i].slug, LAB_PROFILES[j].slug].sort();
      const aPrices = LAB_TEST_PRICES.filter((p) => p.labSlug === a).length;
      const bPrices = LAB_TEST_PRICES.filter((p) => p.labSlug === b).length;
      if (aPrices >= 5 && bPrices >= 5) {
        entries.push({
          url: `${baseUrl}/labs/vs/${a}-vs-${b}`,
          lastModified: new Date(),
          changeFrequency: "monthly",
          priority: 0.7,
        });
      }
    }
  }

  // Test Results Interpretation (/labs/results/[test])
  for (const test of RESULTS_SLUGS) {
    entries.push({
      url: `${baseUrl}/labs/results/${test}`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    });
  }

  return entries;
}

// ─── Chunk 6: Insurance navigator + comparison pages ─────────────────────────
async function generateInsurancePages(baseUrl: string): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  // Insurance Navigator (root)
  entries.push({
    url: `${baseUrl}/insurance`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.9,
  });
  entries.push({
    url: `${baseUrl}/insurance/compare`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.7,
  });
  for (const insurer of INSURANCE_PROVIDERS) {
    entries.push({
      url: `${baseUrl}/insurance/${insurer.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }

  // Insurer vs Insurer head-to-head comparison pages (top 10 by network size)
  const top10Insurers = (await Promise.all(INSURER_PROFILES.map(async (p) => {
    const stats = await getInsurerNetworkStats(p.slug);
    return { slug: p.slug, networkSize: stats?.totalProviders ?? 0 };
  })))
    .sort((a, b) => b.networkSize - a.networkSize)
    .slice(0, 10);

  for (let i = 0; i < top10Insurers.length; i++) {
    for (let j = i + 1; j < top10Insurers.length; j++) {
      const [a, b] = [top10Insurers[i].slug, top10Insurers[j].slug].sort();
      entries.push({
        url: `${baseUrl}/insurance/compare/${a}-vs-${b}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  }

  // Insurance Guides
  entries.push({
    url: `${baseUrl}/insurance/guide`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.7,
  });
  for (const slug of INSURANCE_GUIDE_SLUGS) {
    entries.push({
      url: `${baseUrl}/insurance/guide/${slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.65,
    });
  }

  return entries;
}

// ─── Chunk 7: Arabic mirror pages ────────────────────────────────────────────
async function generateArabicPages(baseUrl: string): Promise<MetadataRoute.Sitemap> {
  const cities = getCities();
  const categories = getCategories();
  const entries: MetadataRoute.Sitemap = [];

  // Arabic homepage
  entries.push({
    url: `${baseUrl}/ar`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 0.9,
  });

  // Arabic city pages + city+category + area + area+category pages
  for (const city of cities) {
    entries.push({
      url: `${baseUrl}/ar/directory/${city.slug}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    });

    // Arabic city+category — only if providers exist
    for (const cat of categories) {
      const catCount = await getProviderCountByCategoryAndCity(cat.slug, city.slug);
      if (catCount > 0) {
        entries.push({
          url: `${baseUrl}/ar/directory/${city.slug}/${cat.slug}`,
          lastModified: new Date(),
          changeFrequency: "weekly",
          priority: 0.7,
        });
      }
    }

    // Arabic area pages + area+category facets — only if providers exist
    const arAreas = getAreasByCity(city.slug);
    for (const area of arAreas) {
      const areaCount = await getProviderCountByAreaAndCity(area.slug, city.slug);
      if (areaCount > 0) {
        entries.push({
          url: `${baseUrl}/ar/directory/${city.slug}/${area.slug}`,
          lastModified: new Date(),
          changeFrequency: "weekly",
          priority: 0.6,
        });
        for (const cat of categories) {
          const { total } = await getProviders({ citySlug: city.slug, areaSlug: area.slug, categorySlug: cat.slug, limit: 1 });
          if (total > 0) {
            entries.push({
              url: `${baseUrl}/ar/directory/${city.slug}/${area.slug}/${cat.slug}`,
              lastModified: new Date(),
              changeFrequency: "weekly",
              priority: 0.6,
            });
          }
        }
      }
    }
  }

  // Arabic individual provider listing pages
  const { providers } = await getProviders({ limit: 99999 });
  for (const provider of providers) {
    entries.push({
      url: `${baseUrl}/ar/directory/${provider.citySlug}/${provider.categorySlug}/${provider.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.5,
    });
  }

  return entries;
}

// ─── Chunk 8: Area-level specialty pages (walk-in, 24hr, emergency, govt) ────
async function generateAreaSpecialtyPages(baseUrl: string): Promise<MetadataRoute.Sitemap> {
  const cities = getCities();
  const categories = getCategories();
  const entries: MetadataRoute.Sitemap = [];

  for (const city of cities) {
    // 24-Hour & Emergency pages
    // 24-hour city pages — only if 3+ 24-hour providers
    const twentyFourHourAll = await get24HourProviders(city.slug);
    if (twentyFourHourAll.length >= 3) {
      entries.push({
        url: `${baseUrl}/directory/${city.slug}/24-hour`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      });

      // 24-hour city x category pages — only if 3+ 24-hour providers in that category
      for (const cat of categories) {
        const twentyFourHourCat = await get24HourProviders(city.slug, cat.slug);
        if (twentyFourHourCat.length >= 3) {
          entries.push({
            url: `${baseUrl}/directory/${city.slug}/24-hour/${cat.slug}`,
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 0.75,
          });
        }
      }
    }

    // Emergency city pages — only if 3+ emergency providers
    const emergencyProviders = await getEmergencyProviders(city.slug);
    if (emergencyProviders.length >= 3) {
      entries.push({
        url: `${baseUrl}/directory/${city.slug}/emergency`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.85,
      });
    }

    // Area-level 24-hour & emergency pages
    const areasFor24Hr = getAreasByCity(city.slug);
    for (const area of areasFor24Hr) {
      const area24Hr = await get24HourProviders(city.slug, undefined, area.slug);
      if (area24Hr.length >= 3) {
        entries.push({
          url: `${baseUrl}/directory/${city.slug}/${area.slug}/24-hour`,
          lastModified: new Date(),
          changeFrequency: "weekly",
          priority: 0.75,
        });
        for (const cat of categories) {
          const area24HrCat = await get24HourProviders(city.slug, cat.slug, area.slug);
          if (area24HrCat.length >= 3) {
            entries.push({
              url: `${baseUrl}/directory/${city.slug}/${area.slug}/24-hour/${cat.slug}`,
              lastModified: new Date(),
              changeFrequency: "weekly",
              priority: 0.7,
            });
          }
        }
      }
      const areaEmergency = await getEmergencyProviders(city.slug, area.slug);
      if (areaEmergency.length >= 3) {
        entries.push({
          url: `${baseUrl}/directory/${city.slug}/${area.slug}/emergency`,
          lastModified: new Date(),
          changeFrequency: "weekly",
          priority: 0.8,
        });
      }
    }

    // Walk-In Clinic pages
    const walkInAll = await getWalkInProviders(city.slug);
    if (walkInAll.length >= 3) {
      entries.push({ url: `${baseUrl}/directory/${city.slug}/walk-in`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 });
      for (const cs of WALK_IN_CATS) {
        const walkInCat = await getWalkInProviders(city.slug, cs);
        if (walkInCat.length >= 3) {
          entries.push({ url: `${baseUrl}/directory/${city.slug}/walk-in/${cs}`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.75 });
        }
      }
    }

    // Area-level walk-in pages
    const walkInAreas = getAreasByCity(city.slug);
    for (const area of walkInAreas) {
      const areaWalkIn = await getWalkInProviders(city.slug, undefined, area.slug);
      if (areaWalkIn.length >= 3) {
        entries.push({ url: `${baseUrl}/directory/${city.slug}/${area.slug}/walk-in`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.75 });
        for (const cs of WALK_IN_CATS) {
          const areaWalkInCat = await getWalkInProviders(city.slug, cs, area.slug);
          if (areaWalkInCat.length >= 3) {
            entries.push({ url: `${baseUrl}/directory/${city.slug}/${area.slug}/walk-in/${cs}`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 });
          }
        }
      }
    }

    // Government facility pages
    const govAll = await getGovernmentProviders(city.slug);
    if (govAll.length >= 3) {
      entries.push({ url: `${baseUrl}/directory/${city.slug}/government`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 });

      // Government city x category pages
      for (const cat of categories) {
        const govCat = await getGovernmentProviders(city.slug, cat.slug);
        if (govCat.length >= 3) {
          entries.push({ url: `${baseUrl}/directory/${city.slug}/government/${cat.slug}`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.75 });
        }
      }
    }

    // Government area pages
    const govAreas = getAreasByCity(city.slug);
    for (const area of govAreas) {
      const govArea = await getGovernmentProviders(city.slug, undefined, area.slug);
      if (govArea.length >= 3) {
        entries.push({ url: `${baseUrl}/directory/${city.slug}/${area.slug}/government`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.75 });
      }
    }
  }

  return entries;
}

// ─── Chunk 9: Top 10, guides, comparisons, and remaining pages ──────────────
async function generateTop10AndGuidesPages(baseUrl: string): Promise<MetadataRoute.Sitemap> {
  const cities = getCities();
  const categories = getCategories();
  const entries: MetadataRoute.Sitemap = [];

  // UAE overall top 10
  entries.push({
    url: `${baseUrl}/directory/top`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.9,
  });

  // Top 10 per category (UAE-wide) — only if 5+ qualified providers
  for (const cat of categories) {
    const { providers: catProviders } = await getProviders({ categorySlug: cat.slug, limit: 99999 });
    const qualCat = catProviders.filter(
      (p) => Number(p.googleRating) > 0 && p.googleReviewCount > 10
    ).length;
    if (qualCat >= 5) {
      entries.push({
        url: `${baseUrl}/directory/top/${cat.slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.85,
      });
    }
  }

  // Top 10 per city (all categories) — only if 5+ qualified providers
  for (const city of cities) {
    const { providers: cityAllProviders } = await getProviders({ citySlug: city.slug, limit: 99999 });
    const qualCity = cityAllProviders.filter(
      (p) => Number(p.googleRating) > 0 && p.googleReviewCount > 10
    ).length;
    if (qualCity >= 5) {
      entries.push({
        url: `${baseUrl}/directory/${city.slug}/top`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.85,
      });
    }
  }

  // Top 10 city x category combos — only if 10+ qualified providers
  for (const city of cities) {
    for (const cat of categories) {
      const { providers: cityProviders } = await getProviders({
        citySlug: city.slug,
        categorySlug: cat.slug,
        limit: 99999,
      });
      const qualifiedCount = cityProviders.filter(
        (p) => Number(p.googleRating) > 0 && p.googleReviewCount > 10
      ).length;
      if (qualifiedCount >= 10) {
        entries.push({
          url: `${baseUrl}/directory/${city.slug}/top/${cat.slug}`,
          lastModified: new Date(),
          changeFrequency: "weekly",
          priority: 0.85,
        });
      }
    }
  }

  // Top 10 area x category combos — only if 5+ qualified providers
  for (const city of cities) {
    const areas = getAreasByCity(city.slug);
    for (const area of areas) {
      for (const cat of categories) {
        const { providers: areaProviders } = await getProviders({
          citySlug: city.slug,
          areaSlug: area.slug,
          categorySlug: cat.slug,
          limit: 99999,
        });
        const qualifiedArea = areaProviders.filter(
          (p) => Number(p.googleRating) > 0 && p.googleReviewCount > 10
        ).length;
        if (qualifiedArea >= 5) {
          entries.push({
            url: `${baseUrl}/directory/${city.slug}/${area.slug}/top/${cat.slug}`,
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 0.8,
          });
        }
      }
    }
  }

  // Guide pages
  entries.push({
    url: `${baseUrl}/directory/guide`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.7,
  });
  for (const slug of GUIDE_SLUGS) {
    entries.push({
      url: `${baseUrl}/directory/guide/${slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    });
  }

  // Comparison pages
  entries.push({
    url: `${baseUrl}/directory/compare`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  });
  for (const compSlug of getAllComparisonSlugs()) {
    entries.push({
      url: `${baseUrl}/directory/compare/${compSlug}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }

  return entries;
}

// ─── Main sitemap function (dispatches by chunk id) ──────────────────────────
export default async function sitemap({ id }: { id: number }): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();

  switch (id) {
    case 0: return generateCorePages(baseUrl);
    case 1: return generateProviderPagesFirstHalf(baseUrl);
    case 2: return generateProviderPagesSecondHalf(baseUrl);
    case 3: return generateFacetPages(baseUrl);
    case 4: return generateIntelligencePages(baseUrl);
    case 5: return generateLabsPages(baseUrl);
    case 6: return generateInsurancePages(baseUrl);
    case 7: return generateArabicPages(baseUrl);
    case 8: return generateAreaSpecialtyPages(baseUrl);
    case 9: return generateTop10AndGuidesPages(baseUrl);
    default: return [];
  }
}
