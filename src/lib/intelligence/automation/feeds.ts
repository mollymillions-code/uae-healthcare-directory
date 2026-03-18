/**
 * RSS Feed Ingestion — pulls healthcare news from verified working sources.
 *
 * Reality check (March 2026):
 *  - Most UAE news sites (Gulf News, KT, The National) have killed their RSS feeds
 *  - Many sites (Arabian Business, MobiHealthNews, Arab News) block with Cloudflare
 *  - WAM serves an SPA, not RSS
 *
 * What actually works:
 *  - Google News RSS search queries (reliable, dozens of articles per query)
 *  - WHO RSS feeds (verified working)
 *
 * Google News is the primary source. Each query targets a specific content
 * vertical and returns articles from Gulf News, KT, The National, etc. —
 * the same sources, accessed through Google's aggregation.
 */

import Parser from "rss-parser";
import type { JournalCategory, ContentSource } from "../types";

const parser = new Parser({
  timeout: 15000,
  headers: {
    "User-Agent": "Mozilla/5.0 (compatible; Zavis/1.0)",
  },
});

// ─── Feed Registry ──────────────────────────────────────────────────────────────

export interface FeedSource {
  id: string;
  name: string;
  url: string;
  category: JournalCategory;
  contentSource: ContentSource;
  pollInterval: number;
  autoPublish: boolean;
  tier: 1 | 2 | 3 | 4;
}

export interface RawFeedItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  source: string;
  sourceUrl: string;
  category: JournalCategory;
  contentSource: ContentSource;
  fullContent?: string;
}

export const FEED_SOURCES: FeedSource[] = [
  // ─── Google News: UAE Healthcare (primary source) ─────────────────────────────
  {
    id: "gnews-uae-healthcare",
    name: "Google News — UAE Healthcare",
    url: "https://news.google.com/rss/search?q=UAE+healthcare+OR+%22health+authority%22&hl=en&gl=AE&ceid=AE:en",
    category: "regulatory",
    contentSource: "aggregated",
    pollInterval: 60,
    autoPublish: false,
    tier: 4,
  },
  {
    id: "gnews-dubai-health",
    name: "Google News — Dubai Health",
    url: "https://news.google.com/rss/search?q=Dubai+hospital+OR+clinic+OR+%22Dubai+Health+Authority%22&hl=en&gl=AE&ceid=AE:en",
    category: "new-openings",
    contentSource: "aggregated",
    pollInterval: 60,
    autoPublish: false,
    tier: 4,
  },
  {
    id: "gnews-abudhabi-health",
    name: "Google News — Abu Dhabi Health",
    url: "https://news.google.com/rss/search?q=%22Abu+Dhabi%22+healthcare+OR+hospital+OR+DOH&hl=en&gl=AE&ceid=AE:en",
    category: "regulatory",
    contentSource: "aggregated",
    pollInterval: 60,
    autoPublish: false,
    tier: 4,
  },
  {
    id: "gnews-mohap",
    name: "Google News — MOHAP",
    url: "https://news.google.com/rss/search?q=MOHAP+OR+%22Ministry+of+Health%22+UAE&hl=en&gl=AE&ceid=AE:en",
    category: "regulatory",
    contentSource: "government",
    pollInterval: 60,
    autoPublish: false,
    tier: 4,
  },
  {
    id: "gnews-uae-healthtech",
    name: "Google News — UAE Health Tech",
    url: "https://news.google.com/rss/search?q=UAE+%22health+tech%22+OR+healthtech+OR+telemedicine+OR+%22digital+health%22&hl=en&gl=AE&ceid=AE:en",
    category: "technology",
    contentSource: "aggregated",
    pollInterval: 120,
    autoPublish: false,
    tier: 4,
  },
  {
    id: "gnews-gcc-healthcare-business",
    name: "Google News — GCC Healthcare Business",
    url: "https://news.google.com/rss/search?q=GCC+OR+UAE+healthcare+investment+OR+IPO+OR+acquisition+OR+funding&hl=en&gl=AE&ceid=AE:en",
    category: "financial",
    contentSource: "aggregated",
    pollInterval: 120,
    autoPublish: false,
    tier: 4,
  },
  {
    id: "gnews-uae-pharma",
    name: "Google News — UAE Pharma",
    url: "https://news.google.com/rss/search?q=UAE+pharmacy+OR+pharmaceutical+OR+drug+regulation&hl=en&gl=AE&ceid=AE:en",
    category: "regulatory",
    contentSource: "aggregated",
    pollInterval: 120,
    autoPublish: false,
    tier: 4,
  },
  {
    id: "gnews-uae-medical-tourism",
    name: "Google News — UAE Medical Tourism",
    url: "https://news.google.com/rss/search?q=UAE+OR+Dubai+%22medical+tourism%22+OR+%22health+tourism%22&hl=en&gl=AE&ceid=AE:en",
    category: "market-intelligence",
    contentSource: "aggregated",
    pollInterval: 120,
    autoPublish: false,
    tier: 4,
  },
  {
    id: "gnews-uae-nursing-workforce",
    name: "Google News — UAE Healthcare Workforce",
    url: "https://news.google.com/rss/search?q=UAE+nurse+OR+%22healthcare+workers%22+OR+%22medical+staff%22+OR+%22Golden+Visa%22+doctor&hl=en&gl=AE&ceid=AE:en",
    category: "workforce",
    contentSource: "aggregated",
    pollInterval: 120,
    autoPublish: false,
    tier: 4,
  },
  {
    id: "gnews-uae-insurance",
    name: "Google News — UAE Health Insurance",
    url: "https://news.google.com/rss/search?q=UAE+%22health+insurance%22+OR+Daman+OR+Thiqa+OR+%22insurance+claim%22&hl=en&gl=AE&ceid=AE:en",
    category: "financial",
    contentSource: "aggregated",
    pollInterval: 120,
    autoPublish: false,
    tier: 4,
  },
  {
    id: "gnews-uae-mental-health",
    name: "Google News — UAE Mental Health",
    url: "https://news.google.com/rss/search?q=UAE+%22mental+health%22+OR+psychiatry+OR+psychology&hl=en&gl=AE&ceid=AE:en",
    category: "regulatory",
    contentSource: "aggregated",
    pollInterval: 120,
    autoPublish: false,
    tier: 4,
  },

  // ─── WHO (verified working) ───────────────────────────────────────────────────
  {
    id: "who-emro",
    name: "WHO — Global Health News",
    url: "https://www.who.int/rss-feeds/news-english.xml",
    category: "regulatory",
    contentSource: "government",
    pollInterval: 120,
    autoPublish: false,
    tier: 3,
  },
];

// ─── Feed Fetching ──────────────────────────────────────────────────────────────

export async function fetchFeed(source: FeedSource): Promise<RawFeedItem[]> {
  try {
    const feed = await parser.parseURL(source.url);
    const items: RawFeedItem[] = (feed.items || []).map((item) => {
      const raw: RawFeedItem = {
        title: item.title || "Untitled",
        link: item.link || "",
        description: item.contentSnippet || item.content || "",
        pubDate: item.pubDate || new Date().toISOString(),
        source: source.name,
        sourceUrl: source.url,
        category: source.category,
        contentSource: source.contentSource,
        fullContent: item.content || item["content:encoded"] || undefined,
      };
      return raw;
    });

    console.log(`[Feed] ${source.id}: ${items.length} items`);
    return items;
  } catch (error) {
    console.error(`[Feed] ${source.id} failed: ${String(error).slice(0, 80)}`);
    return [];
  }
}

export async function fetchAllFeeds(): Promise<RawFeedItem[]> {
  const results = await Promise.allSettled(
    FEED_SOURCES.map((source) => fetchFeed(source))
  );

  const allItems: RawFeedItem[] = [];
  let successCount = 0;
  for (const result of results) {
    if (result.status === "fulfilled" && result.value.length > 0) {
      allItems.push(...result.value);
      successCount++;
    }
  }

  console.log(`[Feed] ${successCount}/${FEED_SOURCES.length} feeds returned items, ${allItems.length} total`);

  allItems.sort(
    (a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
  );

  return deduplicateItems(allItems);
}

function deduplicateItems(items: RawFeedItem[]): RawFeedItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.title.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 60);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ─── Relevance Filtering ────────────────────────────────────────────────────────

const UAE_KEYWORDS = [
  "uae", "dubai", "abu dhabi", "sharjah", "ajman", "ras al khaimah",
  "fujairah", "umm al quwain", "al ain", "dha", "doh", "mohap",
  "emirates", "gulf", "gcc", "mena", "middle east",
  "daman", "thiqa", "enaya",
];

const HEALTHCARE_KEYWORDS = [
  "hospital", "clinic", "healthcare", "health care", "medical",
  "doctor", "physician", "nurse", "patient", "pharma",
  "telemedicine", "telehealth", "mental health", "insurance",
  "diagnosis", "treatment", "surgery", "radiology", "dental",
  "cardiology", "oncology", "pediatric", "fertility", "ivf",
  "health", "wellness",
];

export function filterRelevantItems(items: RawFeedItem[]): RawFeedItem[] {
  return items.filter((item) => {
    const source = FEED_SOURCES.find((s) => s.name === item.source);
    const tier = source?.tier ?? 3;
    const text = `${item.title} ${item.description}`.toLowerCase();
    const hasUAE = UAE_KEYWORDS.some((kw) => text.includes(kw));
    const hasHealth = HEALTHCARE_KEYWORDS.some((kw) => text.includes(kw));

    switch (tier) {
      case 4:
        // Google News: pre-filtered by query, accept almost everything
        return true;
      case 3:
        // Global (WHO): need UAE keyword
        return hasUAE;
      default:
        return hasUAE && hasHealth;
    }
  });
}

export function classifyCategory(item: RawFeedItem): JournalCategory {
  const text = `${item.title} ${item.description}`.toLowerCase();

  if (/\b(regulation|mandate|license|policy|compliance|circular|law|ban|approve)\b/.test(text))
    return "regulatory";
  if (/\b(open|launch|inaugurat|expand|new facility|break ground|new clinic|new hospital)\b/.test(text))
    return "new-openings";
  if (/\b(ipo|revenue|earning|invest|funding|acquisition|merger|billion|million|valuation|stock)\b/.test(text))
    return "financial";
  if (/\b(conference|summit|exhibition|congress|forum|arab health|event)\b/.test(text))
    return "events";
  if (/\b(ai|artificial intelligence|digital|app|tech|startup|innovat|robot|telemedic)\b/.test(text))
    return "technology";
  if (/\b(hire|recruit|workforce|salary|nurse shortage|staffing|golden visa|talent)\b/.test(text))
    return "workforce";
  if (/\b(market|data|statistic|survey|report|trend|forecast|growth|tourism)\b/.test(text))
    return "market-intelligence";

  return item.category;
}
