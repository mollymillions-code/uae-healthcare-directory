/**
 * Seed journal articles into Neon Postgres.
 * Pushes the real content from seed-articles.ts into the journalArticles table.
 *
 * Usage: npx tsx scripts/seed-journal-to-db.ts
 */

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as dotenv from "dotenv";
import { journalArticles } from "../src/lib/db/schema";
import { SEED_ARTICLES } from "../src/lib/intelligence/seed-articles";

dotenv.config({ path: ".env.local" });

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL not set. Add it to .env.local");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

async function seedJournalArticles() {
  console.log("📰 Seeding journal articles to database...\n");

  let inserted = 0;
  let skipped = 0;

  for (const article of SEED_ARTICLES) {
    try {
      await db
        .insert(journalArticles)
        .values({
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
          imageCaption: article.imageCaption || null,
          isFeatured: article.isFeatured,
          isBreaking: article.isBreaking,
          readTimeMinutes: article.readTimeMinutes,
          status: "published",
          publishedAt: new Date(article.publishedAt),
          createdAt: new Date(article.publishedAt),
          updatedAt: new Date(article.updatedAt || article.publishedAt),
        })
        .onConflictDoNothing();

      inserted++;
      console.log(`  ✓ ${article.title.slice(0, 60)}...`);
    } catch (err) {
      skipped++;
      console.log(`  ⊘ Skipped (exists): ${article.slug}`);
    }
  }

  console.log(`\n✅ Done. ${inserted} inserted, ${skipped} skipped.`);
}

seedJournalArticles().catch(console.error);
