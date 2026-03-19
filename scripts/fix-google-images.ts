/**
 * Remove Google News logo images from DB and re-fetch real OG images.
 */

import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const BLOCKED = ["lh3.googleusercontent.com", "gstatic.com", "google.com/images"];

async function fetchRealOgImage(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) return null;
    const html = await response.text();

    const ogMatch = html.match(/<meta\s+(?:property|name)="og:image"\s+content="([^"]+)"/i)
      || html.match(/content="([^"]+)"\s+(?:property|name)="og:image"/i);

    if (ogMatch?.[1]) {
      const img = ogMatch[1];
      if (BLOCKED.some((b) => img.includes(b))) return null;
      if (img.includes("favicon") || img.includes("logo") || img.length < 30) return null;
      return img;
    }
    return null;
  } catch {
    return null;
  }
}

async function main() {
  const sql = neon(process.env.DATABASE_URL!);

  // Find articles with Google logo images
  const bad = await sql`
    SELECT id, slug, source_url, image_url FROM journal_articles
    WHERE image_url LIKE '%lh3.googleusercontent.com%'
    OR image_url LIKE '%gstatic.com%'
  `;

  console.log(`${bad.length} articles with Google logo images\n`);

  let fixed = 0;
  let cleared = 0;

  for (const article of bad) {
    const sourceUrl = article.source_url as string;
    if (!sourceUrl) {
      await sql`UPDATE journal_articles SET image_url = NULL WHERE id = ${article.id}`;
      cleared++;
      continue;
    }

    const realImage = await fetchRealOgImage(sourceUrl);
    if (realImage) {
      await sql`UPDATE journal_articles SET image_url = ${realImage} WHERE id = ${article.id}`;
      fixed++;
      console.log(`  [fix] ${(article.slug as string).slice(0, 50)} → ${realImage.slice(0, 70)}`);
    } else {
      await sql`UPDATE journal_articles SET image_url = NULL WHERE id = ${article.id}`;
      cleared++;
      console.log(`  [clear] ${(article.slug as string).slice(0, 50)} — no real image found`);
    }

    await new Promise((r) => setTimeout(r, 1500));
  }

  console.log(`\nDone: ${fixed} fixed, ${cleared} cleared (no image better than fake image)`);
}

main().catch(console.error);
