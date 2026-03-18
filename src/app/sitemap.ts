import { MetadataRoute } from "next";
import { getCities, getCategories, getAreasByCity, getProviders } from "@/lib/data";
import { getLatestArticles } from "@/lib/journal/data";
import { JOURNAL_CATEGORIES } from "@/lib/journal/categories";
import { getBaseUrl } from "@/lib/helpers";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getBaseUrl();
  const cities = getCities();
  const categories = getCategories();

  const entries: MetadataRoute.Sitemap = [];

  // Homepage
  entries.push({
    url: baseUrl,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 1.0,
  });

  // Skill directory for LLM agents
  entries.push({
    url: `${baseUrl}/directory-skill.md`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.3,
  });

  for (const city of cities) {
    // City pages
    entries.push({
      url: `${baseUrl}/uae/${city.slug}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    });

    // City + Category pages
    for (const cat of categories) {
      entries.push({
        url: `${baseUrl}/uae/${city.slug}/${cat.slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }

    // City + Area pages
    const areas = getAreasByCity(city.slug);
    for (const area of areas) {
      entries.push({
        url: `${baseUrl}/uae/${city.slug}/${area.slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.7,
      });

      // Area + Category facet pages (every permutation — the AEO surface area)
      for (const cat of categories) {
        entries.push({
          url: `${baseUrl}/uae/${city.slug}/${area.slug}/${cat.slug}`,
          lastModified: new Date(),
          changeFrequency: "weekly",
          priority: 0.7,
        });
      }
    }
  }

  // Provider listing pages
  const { providers } = getProviders({ limit: 10000 });
  for (const provider of providers) {
    entries.push({
      url: `${baseUrl}/uae/${provider.citySlug}/${provider.categorySlug}/${provider.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    });
  }

  // ─── Journal ───────────────────────────────────────────────────────────────

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
      url: `${baseUrl}/journal/category/${cat.slug}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    });
  }

  // Journal articles
  const journalArticles = getLatestArticles(100);
  for (const article of journalArticles) {
    entries.push({
      url: `${baseUrl}/journal/${article.slug}`,
      lastModified: new Date(article.updatedAt || article.publishedAt),
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }

  // Journal RSS feed
  entries.push({
    url: `${baseUrl}/journal/feed.xml`,
    lastModified: new Date(),
    changeFrequency: "hourly",
    priority: 0.3,
  });

  // Static pages
  entries.push(
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/claim`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
  );

  return entries;
}
