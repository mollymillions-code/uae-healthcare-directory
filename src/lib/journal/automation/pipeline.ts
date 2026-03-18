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
import { generateArticleBatch } from "./summarize";
import { sendDailyBriefing } from "./newsletter";
import { getLatestArticles } from "../data";
import type { JournalArticle } from "../types";
import { nanoid } from "nanoid";

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

  // 5. Assign IDs and store
  const fullArticles: JournalArticle[] = articles.map((a) => ({
    ...a,
    id: `j-auto-${nanoid(8)}`,
  }));

  // In production, this would write to the database.
  // For now, log the generated articles.
  if (fullArticles.length > 0) {
    console.log(`[Pipeline] Articles ready for publishing:`);
    for (const article of fullArticles) {
      console.log(`  - [${article.category}] ${article.title}`);
    }
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
