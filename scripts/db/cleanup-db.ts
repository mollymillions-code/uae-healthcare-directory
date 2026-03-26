/**
 * Clean up DB: remove duplicates and fix Google logo images.
 */

import { Pool, QueryResult } from "pg";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

function createSql(pool: Pool) {
  return async (strings: TemplateStringsArray, ...values: unknown[]): Promise<Record<string, unknown>[]> => {
    let text = "";
    for (let i = 0; i < strings.length; i++) {
      text += strings[i];
      if (i < values.length) text += `$${i + 1}`;
    }
    const result: QueryResult = await pool.query(text, values);
    return result.rows;
  };
}

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
  const sql = createSql(pool);

  // 1. Find and remove duplicate articles (same source story, different slugs)
  const all = await sql`SELECT id, slug, title, source_url, image_url FROM journal_articles ORDER BY published_at ASC`;
  console.log(`Total articles: ${all.length}\n`);

  // Group by normalized title (first 50 chars, lowercased, alphanumeric only)
  const groups = new Map<string, typeof all>();
  for (const row of all) {
    const key = (row.title as string).toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 50);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
  }

  const dupes: string[] = [];
  for (const [key, rows] of groups) {
    if (rows.length > 1) {
      // Keep the first one (oldest), delete the rest
      console.log(`  [dupe] "${(rows[0].title as string).slice(0, 60)}" — ${rows.length} copies`);
      for (let i = 1; i < rows.length; i++) {
        dupes.push(rows[i].id as string);
      }
    }
  }

  if (dupes.length > 0) {
    for (const id of dupes) {
      await sql`DELETE FROM journal_articles WHERE id = ${id}`;
    }
    console.log(`\nDeleted ${dupes.length} duplicates`);
  } else {
    console.log("No duplicates found");
  }

  // 2. Clear Google logo images
  const googleImages = await sql`
    UPDATE journal_articles SET image_url = NULL
    WHERE image_url LIKE '%lh3.googleusercontent.com%'
    OR image_url LIKE '%gstatic.com%'
    RETURNING id
  `;
  console.log(`Cleared ${googleImages.length} Google logo images`);

  // 3. Re-fetch real images for articles that now have NULL image_url
  const needImages = await sql`
    SELECT id, slug, source_url FROM journal_articles
    WHERE image_url IS NULL AND source_url IS NOT NULL
  `;
  console.log(`\n${needImages.length} articles need real images\n`);

  let found = 0;
  for (const article of needImages) {
    const sourceUrl = article.source_url as string;
    try {
      const response = await fetch(sourceUrl, {
        redirect: "follow",
        headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" },
        signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) continue;
      const html = await response.text();

      const ogMatch = html.match(/<meta\s+(?:property|name)="og:image"\s+content="([^"]+)"/i)
        || html.match(/content="([^"]+)"\s+(?:property|name)="og:image"/i);

      if (ogMatch?.[1]) {
        const img = ogMatch[1];
        // Reject Google logos, favicons, tiny images
        if (img.includes("googleusercontent.com") || img.includes("gstatic") ||
            img.includes("favicon") || img.includes("logo") || img.length < 30) {
          continue;
        }
        await sql`UPDATE journal_articles SET image_url = ${img} WHERE id = ${article.id}`;
        found++;
        console.log(`  [img] ${(article.slug as string).slice(0, 40)} → ${img.slice(0, 60)}`);
      }
    } catch {
      // skip
    }
    await new Promise((r) => setTimeout(r, 1000));
  }

  // Final count
  const finalCount = await sql`SELECT COUNT(*) FROM journal_articles`;
  const withImages = await sql`SELECT COUNT(*) FROM journal_articles WHERE image_url IS NOT NULL`;
  console.log(`\n--- Final ---`);
  console.log(`Total articles: ${finalCount[0].count}`);
  console.log(`With images: ${withImages[0].count}`);
  console.log(`Without images: ${Number(finalCount[0].count) - Number(withImages[0].count)}`);

  await pool.end();
}

main().catch(console.error);
