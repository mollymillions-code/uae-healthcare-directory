/**
 * Run pipeline AND persist to database.
 * Usage: npx tsx scripts/run-pipeline-persist.ts
 */

import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { fetchAllFeeds, filterRelevantItems } from "../src/lib/intelligence/automation/feeds";
import { generateArticleBatch } from "../src/lib/intelligence/automation/summarize";
import { getTopItems } from "../src/lib/intelligence/automation/scoring";
import { getLatestArticles } from "../src/lib/intelligence/data";
import { nanoid } from "nanoid";

const MINIMUM_SCORE = 35;

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  console.log("=== Full Pipeline + DB Persist ===\n");

  // Fetch
  const feedItems = await fetchAllFeeds();
  console.log(`Fetched: ${feedItems.length}`);

  // Filter
  const relevant = filterRelevantItems(feedItems);
  console.log(`Relevant: ${relevant.length}`);

  // Dedup against seed + DB
  const existing = getLatestArticles(200);
  const existingTitles = new Set(
    existing.map((a) => a.title.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 50))
  );
  // Also dedup against DB
  const dbArticles = await sql`SELECT title FROM journal_articles`;
  for (const row of dbArticles) {
    existingTitles.add((row.title as string).toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 50));
  }

  const newItems = relevant.filter((item) => {
    if (!item.title || typeof item.title !== "string") return false;
    const normalized = item.title.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 50);
    return normalized && !existingTitles.has(normalized);
  });
  console.log(`New after dedup: ${newItems.length}`);

  // Score
  const scored = getTopItems(newItems, 100);
  const qualified = scored.filter((s) => s.score >= MINIMUM_SCORE);
  console.log(`Qualified (>= ${MINIMUM_SCORE}): ${qualified.length}`);

  if (qualified.length === 0) {
    console.log("Nothing qualified. Done.");
    return;
  }

  // Generate
  const toProcess = qualified.map((s) => s.item);
  console.log(`\nGenerating ${toProcess.length} articles...\n`);
  const articles = await generateArticleBatch(toProcess, 2);
  console.log(`Generated: ${articles.length}`);

  // Persist to DB
  let persisted = 0;
  for (const article of articles) {
    const id = `j-auto-${nanoid(8)}`;
    try {
      await sql`
        INSERT INTO journal_articles (id, slug, title, excerpt, body, category, tags, source, source_url, source_name, author_name, author_role, is_featured, is_breaking, read_time_minutes, status, published_at)
        VALUES (${id}, ${article.slug}, ${article.title}, ${article.excerpt}, ${article.body}, ${article.category}, ${JSON.stringify(article.tags)}, ${article.source}, ${article.sourceUrl || null}, ${article.sourceName || null}, ${article.author.name}, ${article.author.role || null}, ${false}, ${false}, ${article.readTimeMinutes}, 'published', NOW())
        ON CONFLICT (slug) DO NOTHING
      `;
      persisted++;
      console.log(`  [DB] ${article.slug}`);
    } catch (err) {
      console.log(`  [SKIP] ${article.slug} — ${String(err).slice(0, 60)}`);
    }
  }

  console.log(`\n=== Done: ${persisted} articles persisted to DB ===`);

  // Verify
  const count = await sql`SELECT COUNT(*) FROM journal_articles`;
  console.log(`Total articles in DB: ${count[0].count}`);
}

main().catch(console.error);
