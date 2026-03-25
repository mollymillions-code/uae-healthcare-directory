/**
 * Fetch real OG images from source article URLs.
 * Each DB article has a source_url — we fetch the page and extract
 * the og:image meta tag to get the real editorial photo.
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

async function fetchOgImage(url: string): Promise<string | null> {
  try {
    // Google News URLs redirect — follow them
    const response = await fetch(url, {
      redirect: "follow",
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Zavis/1.0)" },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) return null;
    const html = await response.text();

    // Extract og:image
    const ogMatch = html.match(/<meta\s+(?:property|name)="og:image"\s+content="([^"]+)"/i)
      || html.match(/content="([^"]+)"\s+(?:property|name)="og:image"/i);

    if (ogMatch?.[1]) {
      const imageUrl = ogMatch[1];
      // Skip tiny icons, placeholder images
      if (imageUrl.includes("favicon") || imageUrl.includes("logo") || imageUrl.length < 20) return null;
      return imageUrl;
    }

    // Fallback: twitter:image
    const twitterMatch = html.match(/<meta\s+(?:property|name)="twitter:image"\s+content="([^"]+)"/i)
      || html.match(/content="([^"]+)"\s+(?:property|name)="twitter:image"/i);

    return twitterMatch?.[1] || null;
  } catch {
    return null;
  }
}

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
  const sql = createSql(pool);

  const articles = await sql`
    SELECT id, slug, title, source_url, image_url
    FROM journal_articles
    WHERE source_url IS NOT NULL
    AND (image_url IS NULL OR image_url = '' OR image_url LIKE '/images/%')
    ORDER BY published_at DESC
  `;

  console.log(`${articles.length} articles to fetch images for\n`);

  let found = 0;
  let failed = 0;

  for (const article of articles) {
    const sourceUrl = article.source_url as string;
    if (!sourceUrl) continue;

    const imageUrl = await fetchOgImage(sourceUrl);

    if (imageUrl) {
      await sql`UPDATE journal_articles SET image_url = ${imageUrl} WHERE id = ${article.id}`;
      found++;
      console.log(`  [ok] ${(article.slug as string).slice(0, 50)} → ${imageUrl.slice(0, 80)}`);
    } else {
      failed++;
      console.log(`  [--] ${(article.slug as string).slice(0, 50)} — no OG image found`);
    }

    await new Promise((r) => setTimeout(r, 1000));
  }

  console.log(`\nDone: ${found} images found, ${failed} failed`);

  await pool.end();
}

main().catch(console.error);
