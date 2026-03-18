/**
 * RSS Feed Ingestion — pulls healthcare news from external sources.
 *
 * Sources organized by tier:
 *  Tier 1 (UAE-native): WAM, Gulf News, Khaleej Times, The National, Arabian Business
 *         → Skip UAE keyword check — these are already UAE sources
 *  Tier 2 (Regional): Zawya, Arab News, Al Jazeera English
 *         → Require healthcare keyword but not UAE keyword
 *  Tier 3 (Global health): MobiHealthNews, STAT News, Fierce Healthcare, Reuters
 *         → Require both UAE + healthcare keywords
 *  Tier 4 (Google News): Automated queries for UAE healthcare topics
 *         → Pre-filtered by query, light keyword check
 */

import Parser from "rss-parser";
import type { JournalCategory, ContentSource } from "../types";

const parser = new Parser({
  timeout: 10000,
  headers: {
    "User-Agent": "Zavis-Healthcare-Intelligence/1.0",
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
  /** Tier determines relevance filtering strictness */
  tier: 1 | 2 | 3 | 4;
  transform?: (item: RawFeedItem) => RawFeedItem;
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
  // ─── TIER 1: UAE-Native Sources (skip UAE keyword check) ────────────────────
  {
    id: "wam-health",
    name: "WAM (Emirates News Agency)",
    url: "https://www.wam.ae/en/rss/health",
    category: "regulatory",
    contentSource: "government",
    pollInterval: 30,
    autoPublish: false,
    tier: 1,
  },
  {
    id: "gulfnews-health",
    name: "Gulf News — Health",
    url: "https://gulfnews.com/rss/uae/health",
    category: "regulatory",
    contentSource: "aggregated",
    pollInterval: 60,
    autoPublish: false,
    tier: 1,
  },
  {
    id: "khaleejtimes-health",
    name: "Khaleej Times — Health",
    url: "https://www.khaleejtimes.com/rss",
    category: "regulatory",
    contentSource: "aggregated",
    pollInterval: 60,
    autoPublish: false,
    tier: 1,
  },
  {
    id: "thenationalnews",
    name: "The National",
    url: "https://www.thenationalnews.com/rss",
    category: "regulatory",
    contentSource: "aggregated",
    pollInterval: 60,
    autoPublish: false,
    tier: 1,
  },
  {
    id: "arabianbusiness-health",
    name: "Arabian Business",
    url: "https://www.arabianbusiness.com/rss",
    category: "financial",
    contentSource: "aggregated",
    pollInterval: 120,
    autoPublish: false,
    tier: 1,
  },

  // ─── TIER 2: Regional Sources (require healthcare keyword) ──────────────────
  {
    id: "zawya-health",
    name: "Zawya",
    url: "https://www.zawya.com/en/rss",
    category: "financial",
    contentSource: "aggregated",
    pollInterval: 60,
    autoPublish: false,
    tier: 2,
  },
  {
    id: "arabnews",
    name: "Arab News",
    url: "https://www.arabnews.com/rss.xml",
    category: "regulatory",
    contentSource: "aggregated",
    pollInterval: 120,
    autoPublish: false,
    tier: 2,
  },

  // ─── TIER 3: Global Health Sources (require UAE + healthcare keywords) ──────
  {
    id: "mobihealthnews",
    name: "MobiHealthNews",
    url: "https://www.mobihealthnews.com/feed",
    category: "technology",
    contentSource: "aggregated",
    pollInterval: 120,
    autoPublish: false,
    tier: 3,
  },
  {
    id: "fiercehealthcare",
    name: "Fierce Healthcare",
    url: "https://www.fiercehealthcare.com/rss/xml",
    category: "regulatory",
    contentSource: "aggregated",
    pollInterval: 120,
    autoPublish: false,
    tier: 3,
  },
  {
    id: "healthcaredive",
    name: "Healthcare Dive",
    url: "https://www.healthcaredive.com/feeds/news/",
    category: "regulatory",
    contentSource: "aggregated",
    pollInterval: 120,
    autoPublish: false,
    tier: 3,
  },
  {
    id: "beckers",
    name: "Becker's Hospital Review",
    url: "https://www.beckershospitalreview.com/rss/all-news.html",
    category: "regulatory",
    contentSource: "aggregated",
    pollInterval: 120,
    autoPublish: false,
    tier: 3,
  },

  // ─── TIER 4: Google News (pre-filtered by query) ────────────────────────────
  {
    id: "gnews-uae-healthcare",
    name: "Google News — UAE Healthcare",
    url: "https://news.google.com/rss/search?q=UAE+healthcare&hl=en-AE&gl=AE&ceid=AE:en",
    category: "regulatory",
    contentSource: "aggregated",
    pollInterval: 60,
    autoPublish: false,
    tier: 4,
  },
  {
    id: "gnews-dubai-hospitals",
    name: "Google News — Dubai Hospitals",
    url: "https://news.google.com/rss/search?q=Dubai+hospital+clinic&hl=en-AE&gl=AE&ceid=AE:en",
    category: "new-openings",
    contentSource: "aggregated",
    pollInterval: 60,
    autoPublish: false,
    tier: 4,
  },
  {
    id: "gnews-dha-mohap",
    name: "Google News — DHA MOHAP DOH",
    url: "https://news.google.com/rss/search?q=DHA+OR+MOHAP+OR+%22Department+of+Health%22+Abu+Dhabi&hl=en-AE&gl=AE&ceid=AE:en",
    category: "regulatory",
    contentSource: "government",
    pollInterval: 60,
    autoPublish: false,
    tier: 4,
  },
  {
    id: "gnews-uae-healthtech",
    name: "Google News — UAE Health Tech",
    url: "https://news.google.com/rss/search?q=UAE+health+tech+OR+healthtech+OR+telemedicine&hl=en-AE&gl=AE&ceid=AE:en",
    category: "technology",
    contentSource: "aggregated",
    pollInterval: 120,
    autoPublish: false,
    tier: 4,
  },
  {
    id: "gnews-gcc-healthcare-investment",
    name: "Google News — GCC Healthcare Investment",
    url: "https://news.google.com/rss/search?q=GCC+healthcare+investment+OR+IPO+OR+acquisition&hl=en-AE&gl=AE&ceid=AE:en",
    category: "financial",
    contentSource: "aggregated",
    pollInterval: 120,
    autoPublish: false,
    tier: 4,
  },
  {
    id: "gnews-uae-pharma",
    name: "Google News — UAE Pharma",
    url: "https://news.google.com/rss/search?q=UAE+pharmaceutical+OR+pharmacy+regulation&hl=en-AE&gl=AE&ceid=AE:en",
    category: "regulatory",
    contentSource: "aggregated",
    pollInterval: 120,
    autoPublish: false,
    tier: 4,
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
      return source.transform ? source.transform(raw) : raw;
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
  for (const result of results) {
    if (result.status === "fulfilled") {
      allItems.push(...result.value);
    }
  }

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

// ─── Tiered Relevance Filtering ─────────────────────────────────────────────────

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
];

export function isRelevantForTier(item: RawFeedItem, tier: number): boolean {
  const text = `${item.title} ${item.description}`.toLowerCase();
  const hasUAE = UAE_KEYWORDS.some((kw) => text.includes(kw));
  const hasHealth = HEALTHCARE_KEYWORDS.some((kw) => text.includes(kw));

  switch (tier) {
    case 1:
      // UAE-native sources: only need healthcare keyword
      return hasHealth;
    case 2:
      // Regional sources: need healthcare keyword
      return hasHealth;
    case 3:
      // Global sources: need both UAE + healthcare
      return hasUAE && hasHealth;
    case 4:
      // Google News: pre-filtered by query, light check
      return hasHealth || hasUAE;
    default:
      return hasUAE && hasHealth;
  }
}

export function filterRelevantItems(items: RawFeedItem[]): RawFeedItem[] {
  return items.filter((item) => {
    const source = FEED_SOURCES.find((s) => s.name === item.source);
    const tier = source?.tier ?? 3;
    return isRelevantForTier(item, tier);
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
  if (/\b(market|data|statistic|survey|report|trend|forecast|growth)\b/.test(text))
    return "market-intelligence";

  return item.category;
}
