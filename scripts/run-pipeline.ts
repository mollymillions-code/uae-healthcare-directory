/**
 * Run the full content pipeline locally — no timeout limits.
 * Generates ALL qualified articles (score >= 35), not just top 3.
 *
 * Usage: npx tsx scripts/run-pipeline.ts
 */

import { fetchAllFeeds, filterRelevantItems } from "../src/lib/intelligence/automation/feeds";
import { generateArticleBatch } from "../src/lib/intelligence/automation/summarize";
import { getTopItems } from "../src/lib/intelligence/automation/scoring";
import { getLatestArticles } from "../src/lib/intelligence/data";
import { nanoid } from "nanoid";

const MINIMUM_SCORE = 35;

async function main() {
  console.log("=== Full Pipeline Run (local, no timeout) ===\n");

  // 1. Fetch
  const feedItems = await fetchAllFeeds();
  console.log(`\nFetched: ${feedItems.length} items`);

  // 2. Filter
  const relevant = filterRelevantItems(feedItems);
  console.log(`Relevant: ${relevant.length}`);

  // 3. Dedup
  const existing = getLatestArticles(100);
  const existingTitles = new Set(
    existing.map((a) => a.title.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 50))
  );
  const newItems = relevant.filter((item) => {
    if (!item.title || typeof item.title !== "string") return false;
    const normalized = item.title.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 50);
    return normalized && !existingTitles.has(normalized);
  });
  console.log(`New after dedup: ${newItems.length}`);

  // 4. Score
  const scored = getTopItems(newItems, 100);
  const qualified = scored.filter((s) => s.score >= MINIMUM_SCORE);
  console.log(`Qualified (score >= ${MINIMUM_SCORE}): ${qualified.length}`);

  if (qualified.length === 0) {
    console.log("No qualified items. Exiting.");
    return;
  }

  // Show what we're generating
  console.log("\n--- Generating articles for: ---");
  qualified.forEach((s) => {
    console.log(`  [${s.score}] ${s.item.title.slice(0, 80)}`);
  });

  // 5. Generate ALL qualified articles (batch of 3 at a time for rate limiting)
  const toProcess = qualified.map((s) => s.item);
  console.log(`\nGenerating ${toProcess.length} articles...\n`);

  const articles = await generateArticleBatch(toProcess, 2);
  console.log(`\nGenerated: ${articles.length} articles`);

  // 6. Output results
  for (const article of articles) {
    const id = `j-auto-${nanoid(8)}`;
    console.log(`\n  [${article.category}] ${article.title}`);
    console.log(`  Slug: ${article.slug}`);
    console.log(`  Excerpt: ${article.excerpt.slice(0, 100)}...`);
  }

  console.log(`\n=== Done: ${articles.length} articles generated ===`);
}

main().catch(console.error);
