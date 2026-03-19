/**
 * Content Pipeline — orchestrates the full automation cycle.
 *
 * Pipeline:
 *  1. Fetch all RSS feeds
 *  2. Filter for UAE healthcare relevance
 *  3. Deduplicate against existing articles
 *  4. Classify into journal categories
 *  5. Generate articles via Claude
 *  6. Store in database / append to seed data
 *  7. Send daily briefing newsletter
 *
 * Designed to run as:
 *  - Vercel Cron Job (every 2 hours for feeds, daily for newsletter)
 *  - Manual trigger via API route
 */

import { fetchAllFeeds, filterRelevantItems, type RawFeedItem } from "./feeds";
import { generateArticleBatch } from "./summarize";
import { getTopItems } from "./scoring";
import { sendDailyBriefing } from "./newsletter";
import { getLatestArticles } from "../data";
import type { JournalArticle } from "../types";
import { nanoid } from "nanoid";

// ─── DB Persistence ─────────────────────────────────────────────────────────────

async function persistArticle(article: JournalArticle): Promise<boolean> {
  if (!process.env.DATABASE_URL) {
    console.log(`[Pipeline] No DATABASE_URL — skipping DB persist for: ${article.slug}`);
    return false;
  }

  try {
    const { db } = await import("@/lib/db");
    const { journalArticles } = await import("@/lib/db/schema");

    await db.insert(journalArticles).values({
      id: article.id,
      slug: article.slug,
      title: article.title,
      excerpt: article.excerpt,
      body: article.body,
      category: article.category,
      tags: article.tags,
      source: article.source,
      sourceUrl: article.sourceUrl || null,
      sourceName: article.sourceName || null,
      authorName: article.author.name,
      authorRole: article.author.role || null,
      imageUrl: article.imageUrl || null,
      isFeatured: article.isBreaking, // breaking stories auto-feature
      isBreaking: article.isBreaking,
      readTimeMinutes: article.readTimeMinutes,
      status: "published",
      publishedAt: new Date(article.publishedAt),
    });

    return true;
  } catch (error) {
    console.error(`[Pipeline] DB persist failed for ${article.slug}:`, error);
    return false;
  }
}

async function triggerRevalidation(): Promise<void> {
  const secret = process.env.REVALIDATION_SECRET;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  if (!secret || !baseUrl) return;

  const paths = ["/intelligence"];
  for (const path of paths) {
    try {
      await fetch(`${baseUrl}/api/revalidate?secret=${secret}&path=${path}`);
    } catch {
      // Revalidation is best-effort
    }
  }
}

// ─── OG Image Fetcher ───────────────────────────────────────────────────────────

// Images to reject — generic platform logos, not real article photos
const BLOCKED_IMAGE_PATTERNS = [
  "lh3.googleusercontent.com",
  "google.com/images",
  "gstatic.com",
  "favicon",
  "logo",
  "icon",
  "default-source",
  "placeholder",
];

function isRealImage(url: string): boolean {
  const lower = url.toLowerCase();
  return !BLOCKED_IMAGE_PATTERNS.some((p) => lower.includes(p)) && url.length > 30;
}

async function fetchSourceOgImage(url: string): Promise<string | null> {
  try {
    // Google News URLs are redirects — follow to get the real publisher URL
    const response = await fetch(url, {
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return null;
    const html = await response.text();

    // Try og:image first
    const ogMatch = html.match(/<meta\s+(?:property|name)="og:image"\s+content="([^"]+)"/i)
      || html.match(/content="([^"]+)"\s+(?:property|name)="og:image"/i);
    if (ogMatch?.[1] && isRealImage(ogMatch[1])) {
      return ogMatch[1];
    }

    // Fallback: twitter:image
    const twitterMatch = html.match(/<meta\s+(?:property|name)="twitter:image"\s+content="([^"]+)"/i)
      || html.match(/content="([^"]+)"\s+(?:property|name)="twitter:image"/i);
    if (twitterMatch?.[1] && isRealImage(twitterMatch[1])) {
      return twitterMatch[1];
    }

    return null;
  } catch {
    return null;
  }
}

export interface PipelineResult {
  feedItemsFetched: number;
  relevantItems: number;
  newItems: number;
  articlesGenerated: number;
  errors: string[];
  timestamp: string;
}

// ─── Main Pipeline ──────────────────────────────────────────────────────────────

export async function runContentPipeline(): Promise<PipelineResult> {
  const errors: string[] = [];
  const timestamp = new Date().toISOString();

  console.log(`[Pipeline] Starting content pipeline at ${timestamp}`);

  // 1. Fetch all feeds
  let feedItems: RawFeedItem[] = [];
  try {
    feedItems = await fetchAllFeeds();
    console.log(`[Pipeline] Fetched ${feedItems.length} feed items`);
  } catch (error) {
    errors.push(`Feed fetch failed: ${String(error)}`);
    return { feedItemsFetched: 0, relevantItems: 0, newItems: 0, articlesGenerated: 0, errors, timestamp };
  }

  // 2. Filter by tiered relevance (Tier 1 UAE sources = loose, Tier 3 global = strict)
  const relevant = filterRelevantItems(feedItems);
  console.log(`[Pipeline] ${relevant.length} items passed relevance filter`);

  // 3. Deduplicate against existing DB articles (direct query, not cached)
  const existingTitles = new Set<string>();
  const existingSourceUrls = new Set<string>();

  if (process.env.DATABASE_URL) {
    try {
      const { neon } = await import("@neondatabase/serverless");
      const sql = neon(process.env.DATABASE_URL);
      const dbRows = await sql`SELECT title, source_url FROM journal_articles`;
      for (const row of dbRows) {
        if (row.title) existingTitles.add((row.title as string).toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 50));
        if (row.source_url) existingSourceUrls.add(row.source_url as string);
      }
      console.log(`[Pipeline] Loaded ${dbRows.length} existing articles from DB for dedup`);
    } catch {
      console.log("[Pipeline] DB dedup failed, using empty set");
    }
  }

  const newItems = relevant.filter((item) => {
    if (!item.title || typeof item.title !== "string") return false;
    const normalized = item.title.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 50);
    if (!normalized || existingTitles.has(normalized)) return false;
    if (item.link && existingSourceUrls.has(item.link)) return false;
    return true;
  });

  // Also dedup within the batch itself (same source URL = same story)
  const seenUrls = new Set<string>();
  const dedupedItems = newItems.filter((item) => {
    if (item.link && seenUrls.has(item.link)) return false;
    if (item.link) seenUrls.add(item.link);
    return true;
  });

  console.log(`[Pipeline] ${dedupedItems.length} new items after dedup (from ${newItems.length})`);

  if (dedupedItems.length === 0) {
    return {
      feedItemsFetched: feedItems.length,
      relevantItems: relevant.length,
      newItems: 0,
      articlesGenerated: 0,
      errors,
      timestamp,
    };
  }

  // 4. Score and rank by newsworthiness (virality, audience impact, specificity, timeliness)
  const scored = getTopItems(dedupedItems, 25);
  console.log(`[Pipeline] Top 25 scored. #1: "${scored[0]?.item.title.slice(0, 60)}" (score: ${scored[0]?.score})`);

  // 5. Apply absolute quality threshold — minimum score of 35/100 to publish
  // This prevents low-quality or generic articles from being published just
  // because they ranked highest in a weak batch.
  const MINIMUM_SCORE = 35;
  const qualified = scored.filter((s) => s.score >= MINIMUM_SCORE);
  console.log(`[Pipeline] ${qualified.length} items above minimum threshold (${MINIMUM_SCORE}/100)`);

  if (qualified.length === 0) {
    console.log("[Pipeline] No items met quality threshold — skipping generation");
    return {
      feedItemsFetched: feedItems.length,
      relevantItems: relevant.length,
      newItems: newItems.length,
      articlesGenerated: 0,
      errors,
      timestamp,
    };
  }

  // Serverless: generate top 3 with full 3-pass pipeline (within 60s timeout)
  // Heavy generation (10-25 articles) runs via GitHub Actions with full review
  const toProcess = qualified.slice(0, 3).map((s) => s.item);
  let articles: Omit<JournalArticle, "id">[] = [];
  try {
    articles = await generateArticleBatch(toProcess, 3);
    console.log(`[Pipeline] Generated ${articles.length} articles`);
  } catch (error) {
    errors.push(`Article generation failed: ${String(error)}`);
  }

  // 5. Fetch real OG images from source article URLs
  for (const article of articles) {
    if (article.sourceUrl) {
      try {
        const imgUrl = await fetchSourceOgImage(article.sourceUrl);
        if (imgUrl) {
          article.imageUrl = imgUrl;
          console.log(`[Pipeline] Image: ${article.slug} → ${imgUrl.slice(0, 60)}`);
        }
      } catch {
        // Image fetch is best-effort
      }
    }
  }

  // 6. Assign IDs, set featured/breaking based on score rank
  const fullArticles: JournalArticle[] = articles.map((a, idx) => ({
    ...a,
    id: `j-auto-${nanoid(8)}`,
    isFeatured: idx < 2,  // Top 2 by score = featured (hero + secondary)
    isBreaking: idx === 0, // #1 by score = breaking
  }));

  // 7. Persist to database and trigger revalidation
  let persisted = 0;
  for (const article of fullArticles) {
    const ok = await persistArticle(article);
    if (ok) persisted++;
    console.log(`[Pipeline] ${ok ? "Published" : "Logged"}: [${article.category}] ${article.title}`);
  }

  if (persisted > 0) {
    await triggerRevalidation();
    console.log(`[Pipeline] Revalidation triggered for ${persisted} new articles`);
  }

  return {
    feedItemsFetched: feedItems.length,
    relevantItems: relevant.length,
    newItems: newItems.length,
    articlesGenerated: fullArticles.length,
    errors,
    timestamp,
  };
}

// ─── Daily Newsletter Pipeline ──────────────────────────────────────────────────

export async function runNewsletterPipeline(): Promise<{
  success: boolean;
  sent: number;
  errors: string[];
}> {
  console.log("[Pipeline] Running daily newsletter pipeline");

  const latestArticles = getLatestArticles(5);

  if (latestArticles.length === 0) {
    return { success: false, sent: 0, errors: ["No articles to send"] };
  }

  // In production, fetch subscriber list from database/Resend
  // For now, this is a placeholder
  const subscribers: string[] = [];

  if (subscribers.length === 0) {
    console.log("[Pipeline] No subscribers yet — skipping send");
    return { success: true, sent: 0, errors: [] };
  }

  return sendDailyBriefing(latestArticles, subscribers);
}
