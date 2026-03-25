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

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getBaseUrl();
  const cities = getCities();
  const categories = getCategories();

  const entries: MetadataRoute.Sitemap = [];

  // ─── Homepage ──────────────────────────────────────────────────────────────
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

  // ─── Directory: Cities, Categories, Areas, Facets ─────────────────────────
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
      const catCount = getProviderCountByCategoryAndCity(cat.slug, city.slug);
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
      const areaCount = getProviderCountByAreaAndCity(area.slug, city.slug);
      if (areaCount > 0) {
        entries.push({
          url: `${baseUrl}/directory/${city.slug}/${area.slug}`,
          lastModified: new Date(),
          changeFrequency: "weekly",
          priority: 0.7,
        });

        // Area + Category facet pages — only if providers exist in this combination
        for (const cat of categories) {
          const { total } = getProviders({ citySlug: city.slug, areaSlug: area.slug, categorySlug: cat.slug, limit: 1 });
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

    // ─── 24-Hour pages per city ────────────────────────────────────────────
    entries.push({
      url: `${baseUrl}/directory/${city.slug}/24-hours`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    });

    // ─── Area + Insurance pages — only if area has providers ──────────────
    for (const area of areas) {
      const areaCount = getProviderCountByAreaAndCity(area.slug, city.slug);
      if (areaCount > 0) {
        entries.push({
          url: `${baseUrl}/directory/${city.slug}/${area.slug}/insurance`,
          lastModified: new Date(),
          changeFrequency: "weekly",
          priority: 0.7,
        });
      }
    }

    // ─── Insurance pages per city — only if providers accept that insurer ──
    entries.push({
      url: `${baseUrl}/directory/${city.slug}/insurance`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    });
    for (const insurer of INSURANCE_PROVIDERS) {
      const insCount = getProviderCountByInsurance(insurer.slug, city.slug);
      if (insCount > 0) {
        entries.push({
          url: `${baseUrl}/directory/${city.slug}/insurance/${insurer.slug}`,
          lastModified: new Date(),
          changeFrequency: "weekly",
          priority: 0.7,
        });

        // Insurance × Category cross-reference pages (only where >= 2 providers)
        const insurerProviders = getProvidersByInsurance(insurer.slug, city.slug);
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

    // ─── Language pages per city — only if providers speak that language ───
    entries.push({
      url: `${baseUrl}/directory/${city.slug}/language`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    });
    for (const lang of LANGUAGES) {
      const langCount = getProviderCountByLanguage(lang.slug, city.slug);
      if (langCount > 0) {
        entries.push({
          url: `${baseUrl}/directory/${city.slug}/language/${lang.slug}`,
          lastModified: new Date(),
          changeFrequency: "weekly",
          priority: 0.7,
        });
      }
    }

    // ─── Language × Category pages per city ─────────────────────────────────
    for (const lang of LANGUAGES) {
      const langProviders = getProvidersByLanguage(lang.slug, city.slug);
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

    // ─── Condition pages per city — only if related categories have providers
    entries.push({
      url: `${baseUrl}/directory/${city.slug}/condition`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    });
    for (const condition of CONDITIONS) {
      const hasProviders = condition.relatedCategories?.some(
        (catSlug: string) => getProviderCountByCategoryAndCity(catSlug, city.slug) > 0
      );
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

  // ─── Best [category] in [city] pages ────────────────────────────────────

  // Master index: /best
  entries.push({
    url: `${baseUrl}/best`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.9,
  });

  for (const city of cities) {
    // City-level: /best/[city]
    entries.push({
      url: `${baseUrl}/best/${city.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.85,
    });

    // Category-level: /best/[city]/[category] — only where rated providers exist
    for (const cat of categories) {
      const bestCatCount = getProviderCountByCategoryAndCity(cat.slug, city.slug);
      if (bestCatCount > 0) {
        entries.push({
          url: `${baseUrl}/best/${city.slug}/${cat.slug}`,
          lastModified: new Date(),
          changeFrequency: "weekly",
          priority: 0.85,
        });
      }
    }
  }

  // ─── Top 10 pages ───────────────────────────────────────────────────────

  // UAE overall top 10
  entries.push({
    url: `${baseUrl}/directory/top`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.9,
  });

  // Top 10 per category (UAE-wide) — only if 5+ qualified providers
  for (const cat of categories) {
    const { providers: catProviders } = getProviders({ categorySlug: cat.slug, limit: 99999 });
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
    const { providers: cityAllProviders } = getProviders({ citySlug: city.slug, limit: 99999 });
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

  // Top 10 city × category combos — only if 10+ qualified providers
  for (const city of cities) {
    for (const cat of categories) {
      const { providers: cityProviders } = getProviders({
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

  // Top 10 area × category combos — only if 5+ qualified providers
  for (const city of cities) {
    const areas = getAreasByCity(city.slug);
    for (const area of areas) {
      for (const cat of categories) {
        const { providers: areaProviders } = getProviders({
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

  // ─── 24-Hour & Emergency pages ────────────────────────────────────────────
  for (const city of cities) {
    // 24-hour city pages — only if 3+ 24-hour providers
    const twentyFourHourAll = get24HourProviders(city.slug);
    if (twentyFourHourAll.length >= 3) {
      entries.push({
        url: `${baseUrl}/directory/${city.slug}/24-hour`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      });

      // 24-hour city × category pages — only if 3+ 24-hour providers in that category
      for (const cat of categories) {
        const twentyFourHourCat = get24HourProviders(city.slug, cat.slug);
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
    const emergencyProviders = getEmergencyProviders(city.slug);
    if (emergencyProviders.length >= 3) {
      entries.push({
        url: `${baseUrl}/directory/${city.slug}/emergency`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.85,
      });
    }

    // ─── Area-level 24-hour & emergency pages ───────────────────────────────
    const areasFor24Hr = getAreasByCity(city.slug);
    for (const area of areasFor24Hr) {
      const area24Hr = get24HourProviders(city.slug, undefined, area.slug);
      if (area24Hr.length >= 3) {
        entries.push({
          url: `${baseUrl}/directory/${city.slug}/${area.slug}/24-hour`,
          lastModified: new Date(),
          changeFrequency: "weekly",
          priority: 0.75,
        });
        for (const cat of categories) {
          const area24HrCat = get24HourProviders(city.slug, cat.slug, area.slug);
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
      const areaEmergency = getEmergencyProviders(city.slug, area.slug);
      if (areaEmergency.length >= 3) {
        entries.push({
          url: `${baseUrl}/directory/${city.slug}/${area.slug}/emergency`,
          lastModified: new Date(),
          changeFrequency: "weekly",
          priority: 0.8,
        });
      }
    }
  }

  // ─── Procedure cost pages per city ───────────────────────────────────────
  for (const city of cities) {
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

  // ─── Walk-In Clinic pages ─────────────────────────────────────────────────
  const WALK_IN_CATS = ["clinics", "dental", "dermatology", "ophthalmology", "pediatrics", "ent", "pharmacy", "labs-diagnostics", "emergency-care"];
  for (const city of cities) {
    const walkInAll = getWalkInProviders(city.slug);
    if (walkInAll.length >= 3) {
      entries.push({ url: `${baseUrl}/directory/${city.slug}/walk-in`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 });
      for (const cs of WALK_IN_CATS) {
        const walkInCat = getWalkInProviders(city.slug, cs);
        if (walkInCat.length >= 3) {
          entries.push({ url: `${baseUrl}/directory/${city.slug}/walk-in/${cs}`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.75 });
        }
      }
    }

    // Area-level walk-in pages
    const walkInAreas = getAreasByCity(city.slug);
    for (const area of walkInAreas) {
      const areaWalkIn = getWalkInProviders(city.slug, undefined, area.slug);
      if (areaWalkIn.length >= 3) {
        entries.push({ url: `${baseUrl}/directory/${city.slug}/${area.slug}/walk-in`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.75 });
        for (const cs of WALK_IN_CATS) {
          const areaWalkInCat = getWalkInProviders(city.slug, cs, area.slug);
          if (areaWalkInCat.length >= 3) {
            entries.push({ url: `${baseUrl}/directory/${city.slug}/${area.slug}/walk-in/${cs}`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 });
          }
        }
      }
    }
  }

    // ─── Government facility pages ──────────────────────────────────────────────
  for (const city of cities) {
    const govAll = getGovernmentProviders(city.slug);
    if (govAll.length >= 3) {
      entries.push({ url: `${baseUrl}/directory/${city.slug}/government`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 });

      // Government city x category pages
      for (const cat of categories) {
        const govCat = getGovernmentProviders(city.slug, cat.slug);
        if (govCat.length >= 3) {
          entries.push({ url: `${baseUrl}/directory/${city.slug}/government/${cat.slug}`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.75 });
        }
      }
    }

    // Government area pages
    const govAreas = getAreasByCity(city.slug);
    for (const area of govAreas) {
      const govArea = getGovernmentProviders(city.slug, undefined, area.slug);
      if (govArea.length >= 3) {
        entries.push({ url: `${baseUrl}/directory/${city.slug}/${area.slug}/government`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.75 });
      }
    }
  }

  // ─── Provider listing pages ───────────────────────────────────────────────
  const { providers } = getProviders({ limit: 99999 });
  for (const provider of providers) {
    entries.push({
      url: `${baseUrl}/directory/${provider.citySlug}/${provider.categorySlug}/${provider.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    });
  }

  // ─── Guide pages ─────────────────────────────────────────────────────────
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

  // ─── Comparison pages ─────────────────────────────────────────────────────
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

  // ─── Journal ──────────────────────────────────────────────────────────────

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

  // ─── Lab Test Comparison ────────────────────────────────────────────────
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
  for (const lab of LAB_PROFILES) {
    entries.push({
      url: `${baseUrl}/labs/${lab.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }
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
  // Home collection per city + city×category permutations
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
  // City-specific lab pages + city×category permutations
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
  // Test × City permutations (/labs/test/[test]/[city])
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

  // ─── Insurance Navigator (root) ──────────────────────────────────────────
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
  const top10Insurers = INSURER_PROFILES.map((p) => {
    const stats = getInsurerNetworkStats(p.slug);
    return { slug: p.slug, networkSize: stats?.totalProviders ?? 0 };
  })
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

  // ─── Insurance Guides ───────────────────────────────────────────────────
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

  // ─── Static pages (trust pages only — transactional pages like /claim excluded) ─
  entries.push(
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/editorial-policy`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/privacy-policy`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/terms`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
  );

  // ─── Arabic mirrors ──────────────────────────────────────────────────────
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
      const catCount = getProviderCountByCategoryAndCity(cat.slug, city.slug);
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
      const areaCount = getProviderCountByAreaAndCity(area.slug, city.slug);
      if (areaCount > 0) {
        entries.push({
          url: `${baseUrl}/ar/directory/${city.slug}/${area.slug}`,
          lastModified: new Date(),
          changeFrequency: "weekly",
          priority: 0.6,
        });
        for (const cat of categories) {
          const { total } = getProviders({ citySlug: city.slug, areaSlug: area.slug, categorySlug: cat.slug, limit: 1 });
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
