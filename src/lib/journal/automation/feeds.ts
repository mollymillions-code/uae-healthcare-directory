/**
 * RSS Feed Ingestion — pulls healthcare news from external sources.
 *
 * Sources:
 *  - UAE government health authority feeds
 *  - Regional healthcare news outlets
 *  - Medical industry publications with Middle East coverage
 *  - Health tech / startup news
 *
 * Each feed is parsed, deduplicated, and queued for AI summarization.
 */

import Parser from "rss-parser";
import type { JournalCategory, ContentSource } from "../types";

const parser = new Parser({
  timeout: 10000,
  headers: {
    "User-Agent": "UAE-Healthcare-Journal/1.0 (https://uae-healthcare-directory.vercel.app)",
  },
});

// ─── Feed Registry ──────────────────────────────────────────────────────────────

export interface FeedSource {
  id: string;
  name: string;
  url: string;
  category: JournalCategory;
  contentSource: ContentSource;
  /** How often to poll (minutes) */
  pollInterval: number;
  /** Whether to auto-publish or queue for review */
  autoPublish: boolean;
  /** Transform function for title/content if needed */
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
  // ─── Government / Regulatory ────────────────────────────────────────────────
  {
    id: "wam-health",
    name: "WAM (Emirates News Agency) — Health",
    url: "https://www.wam.ae/en/rss/health",
    category: "regulatory",
    contentSource: "government",
    pollInterval: 30,
    autoPublish: false,
  },
  {
    id: "gulfnews-health",
    name: "Gulf News — Health",
    url: "https://gulfnews.com/rss/uae/health",
    category: "regulatory",
    contentSource: "aggregated",
    pollInterval: 60,
    autoPublish: false,
  },

  // ─── Financial / Business ───────────────────────────────────────────────────
  {
    id: "zawya-health",
    name: "Zawya — Healthcare",
    url: "https://www.zawya.com/en/rss/healthcare",
    category: "financial",
    contentSource: "aggregated",
    pollInterval: 60,
    autoPublish: false,
  },
  {
    id: "arabianbusiness-health",
    name: "Arabian Business — Healthcare",
    url: "https://www.arabianbusiness.com/rss/healthcare",
    category: "financial",
    contentSource: "aggregated",
    pollInterval: 120,
    autoPublish: false,
  },

  // ─── Health Tech / Innovation ───────────────────────────────────────────────
  {
    id: "mobihealthnews-mena",
    name: "MobiHealthNews",
    url: "https://www.mobihealthnews.com/feed",
    category: "technology",
    contentSource: "aggregated",
    pollInterval: 120,
    autoPublish: false,
  },

  // ─── General Healthcare ─────────────────────────────────────────────────────
  {
    id: "khaleejtimes-health",
    name: "Khaleej Times — Health",
    url: "https://www.khaleejtimes.com/rss/health",
    category: "regulatory",
    contentSource: "aggregated",
    pollInterval: 60,
    autoPublish: false,
  },
  {
    id: "thenationalnews-health",
    name: "The National — Health",
    url: "https://www.thenationalnews.com/rss/uae/health",
    category: "regulatory",
    contentSource: "aggregated",
    pollInterval: 60,
    autoPublish: false,
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

    return items;
  } catch (error) {
    console.error(`[Feed] Error fetching ${source.id}:`, error);
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

  // Sort by date, newest first
  allItems.sort(
    (a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
  );

  // Deduplicate by title similarity
  return deduplicateItems(allItems);
}

function deduplicateItems(items: RawFeedItem[]): RawFeedItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    // Normalize title for dedup
    const key = item.title.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 60);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ─── UAE Healthcare Relevance Filter ────────────────────────────────────────────

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
  "diagnosis", "treatment", "surgery", "radiology",
];

export function isUAEHealthcareRelevant(item: RawFeedItem): boolean {
  const text = `${item.title} ${item.description}`.toLowerCase();
  const hasUAE = UAE_KEYWORDS.some((kw) => text.includes(kw));
  const hasHealth = HEALTHCARE_KEYWORDS.some((kw) => text.includes(kw));
  return hasUAE && hasHealth;
}

export function classifyCategory(item: RawFeedItem): JournalCategory {
  const text = `${item.title} ${item.description}`.toLowerCase();

  if (/\b(regulation|mandate|license|policy|compliance|circular|law)\b/.test(text))
    return "regulatory";
  if (/\b(open|launch|inaugurat|expand|new facility|break ground)\b/.test(text))
    return "new-openings";
  if (/\b(ipo|revenue|earning|invest|funding|acquisition|merger|billion|million)\b/.test(text))
    return "financial";
  if (/\b(conference|summit|exhibition|congress|forum|arab health)\b/.test(text))
    return "events";
  if (/\b(ai|artificial intelligence|digital|app|tech|startup|innovat)\b/.test(text))
    return "technology";
  if (/\b(hire|recruit|workforce|salary|nurse shortage|staffing|golden visa)\b/.test(text))
    return "workforce";
  if (/\b(market|data|statistic|survey|report|trend|forecast)\b/.test(text))
    return "market-intelligence";

  return item.category; // fallback to source default
}
