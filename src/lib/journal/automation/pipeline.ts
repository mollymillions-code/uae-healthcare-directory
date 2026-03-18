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

import { fetchAllFeeds, isUAEHealthcareRelevant, type RawFeedItem } from "./feeds";
import { generateArticleBatch, generateArticleImage } from "./summarize";
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

  const paths = ["/journal"];
  for (const path of paths) {
    try {
      await fetch(`${baseUrl}/api/revalidate?secret=${secret}&path=${path}`);
    } catch {
      // Revalidation is best-effort
    }
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

  // 2. Filter for UAE healthcare relevance
  const relevant = feedItems.filter(isUAEHealthcareRelevant);
  console.log(`[Pipeline] ${relevant.length} items are UAE healthcare relevant`);

  // 3. Deduplicate against existing articles
  const existing = getLatestArticles(100);
  const existingTitles = new Set(
    existing.map((a) => a.title.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 50))
  );

  const newItems = relevant.filter((item) => {
    const normalized = item.title.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 50);
    return !existingTitles.has(normalized);
  });
  console.log(`[Pipeline] ${newItems.length} new items after dedup`);

  if (newItems.length === 0) {
    return {
      feedItemsFetched: feedItems.length,
      relevantItems: relevant.length,
      newItems: 0,
      articlesGenerated: 0,
      errors,
      timestamp,
    };
  }

  // 4. Generate articles via Claude (max 10 per run to control costs)
  const toProcess = newItems.slice(0, 10);
  let articles: Omit<JournalArticle, "id">[] = [];
  try {
    articles = await generateArticleBatch(toProcess, 3);
    console.log(`[Pipeline] Generated ${articles.length} articles`);
  } catch (error) {
    errors.push(`Article generation failed: ${String(error)}`);
  }

  // 5. Generate images for articles
  for (const article of articles) {
    try {
      const imageData = await generateArticleImage(article.title, article.category);
      if (imageData) {
        article.imageUrl = imageData;
        console.log(`[Pipeline] Generated image for: ${article.title}`);
      }
    } catch {
      console.log(`[Pipeline] Image generation skipped for: ${article.title}`);
    }
  }

  // 6. Assign IDs and store
  const fullArticles: JournalArticle[] = articles.map((a) => ({
    ...a,
    id: `j-auto-${nanoid(8)}`,
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
