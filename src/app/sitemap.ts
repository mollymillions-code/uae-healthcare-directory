import { MetadataRoute } from "next";
import { getCities, getCategories, getAreasByCity, getProviders } from "@/lib/data";
import { getLatestArticles } from "@/lib/intelligence/data";
import { JOURNAL_CATEGORIES } from "@/lib/intelligence/categories";
import { getBaseUrl } from "@/lib/helpers";
import { INSURANCE_PROVIDERS } from "@/lib/constants/insurance";
import { LANGUAGES } from "@/lib/constants/languages";
import { CONDITIONS } from "@/lib/constants/conditions";

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

  // Skill directory for LLM agents
  entries.push({
    url: `${baseUrl}/directory-skill.md`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.3,
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

    // City + Category pages
    for (const cat of categories) {
      entries.push({
        url: `${baseUrl}/directory/${city.slug}/${cat.slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }

    // City + Area pages
    const areas = getAreasByCity(city.slug);
    for (const area of areas) {
      entries.push({
        url: `${baseUrl}/directory/${city.slug}/${area.slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.7,
      });

      // Area + Category facet pages (every permutation — the AEO surface area)
      for (const cat of categories) {
        entries.push({
          url: `${baseUrl}/directory/${city.slug}/${area.slug}/${cat.slug}`,
          lastModified: new Date(),
          changeFrequency: "weekly",
          priority: 0.7,
        });
      }
    }

    // ─── Insurance pages per city ─────────────────────────────────────────
    entries.push({
      url: `${baseUrl}/directory/${city.slug}/insurance`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    });
    for (const insurer of INSURANCE_PROVIDERS) {
      entries.push({
        url: `${baseUrl}/directory/${city.slug}/insurance/${insurer.slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }

    // ─── Language pages per city ──────────────────────────────────────────
    entries.push({
      url: `${baseUrl}/directory/${city.slug}/language`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    });
    for (const lang of LANGUAGES) {
      entries.push({
        url: `${baseUrl}/directory/${city.slug}/language/${lang.slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }

    // ─── Condition pages per city ─────────────────────────────────────────
    entries.push({
      url: `${baseUrl}/directory/${city.slug}/condition`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    });
    for (const condition of CONDITIONS) {
      entries.push({
        url: `${baseUrl}/directory/${city.slug}/condition/${condition.slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  }

  // ─── Provider listing pages ───────────────────────────────────────────────
  const { providers } = getProviders({ limit: 10000 });
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

  // ─── Journal ──────────────────────────────────────────────────────────────

  // Journal landing
  entries.push({
    url: `${baseUrl}/journal`,
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

  // ─── Static pages ────────────────────────────────────────────────────────
  entries.push(
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/claim`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/editorial-policy`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
  );

  // ─── Arabic mirrors ──────────────────────────────────────────────────────
  // Arabic homepage
  entries.push({
    url: `${baseUrl}/ar`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 0.9,
  });

  // Arabic city pages + city+category pages
  for (const city of cities) {
    entries.push({
      url: `${baseUrl}/ar/directory/${city.slug}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    });

    for (const cat of categories) {
      entries.push({
        url: `${baseUrl}/ar/directory/${city.slug}/${cat.slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  }

  return entries;
}

// ─── Estimated page count ──────────────────────────────────────────────────
// Homepage (1) + LLM skill (1)
// + cities * (1 city + N categories + N areas + N areas*categories)
// + cities * (1 insurance index + 13 insurers)
// + cities * (1 language index + 20 languages)
// + cities * (1 condition index + 20 conditions)
// + provider listings (~10,000 max)
// + guide index (1) + 8 guide articles
// + journal landing (1) + journal categories (~9) + journal articles (~100) + RSS (1)
// + static pages (3: about, claim, editorial-policy)
// + Arabic: 1 homepage + cities * (1 + N categories)
// Rough estimate: ~12,000–15,000 URLs depending on city/area/category/provider counts
