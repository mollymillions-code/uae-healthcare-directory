/**
 * Full autonomous pipeline — runs on GitHub Actions every 2 hours.
 * No timeouts. Full 3-pass quality (draft + review + anti-AI-tells).
 * Generates images. Persists to DB. Zero human intervention.
 *
 * Usage: npx tsx scripts/run-pipeline-persist.ts
 */

import { Pool, QueryResult } from "pg";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

// Tagged template SQL helper (replaces neon() interface)
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

import { fetchAllFeeds, filterRelevantItems } from "../src/lib/intelligence/automation/feeds";
import { generateArticleBatch } from "../src/lib/intelligence/automation/summarize";
import { getTopItems } from "../src/lib/intelligence/automation/scoring";
import { nanoid } from "nanoid";

const MINIMUM_SCORE = 35;
const MAX_ARTICLES_PER_RUN = 25;
const GEMINI_KEY = process.env.GEMINI_API_KEY;

// ─── OG Image Fetcher ───────────────────────────────────────────────────────────

async function fetchOgImage(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      redirect: "follow",
      headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return null;
    const html = await response.text();

    const ogMatch = html.match(/<meta\s+(?:property|name)="og:image"\s+content="([^"]+)"/i)
      || html.match(/content="([^"]+)"\s+(?:property|name)="og:image"/i);

    if (ogMatch?.[1]) {
      const img = ogMatch[1];
      if (img.includes("googleusercontent.com") || img.includes("gstatic") ||
          img.includes("favicon") || img.includes("logo") || img.length < 30) return null;
      return img;
    }
    return null;
  } catch {
    return null;
  }
}

// ─── Gemini Image Generator (contextual, unique per article) ────────────────────

async function generateImage(title: string): Promise<string | null> {
  if (!GEMINI_KEY) return null;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `You are a photo editor. Generate ONE unique photorealistic image for this healthcare article. Depict the SPECIFIC subject, NOT a generic skyline.

ARTICLE: "${title}"

1. IPO/stock: stock exchange floor. Insurance: billing desk. Nursing: nurses. Drug law: pharmacy. Acquisition: boardroom. Funding: startup office. Tourism: airport/luxury hospital. Mental health: counseling room.
2. Vary composition: close-up, wide, overhead, portrait.
3. Vary color: warm for human stories, cool for tech, dark for financial, bright for openings.

NO text/words/numbers/watermarks/logos. 16:9 landscape. Photorealistic. Visually unique.` }] }],
          generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
        }),
      }
    );

    if (!response.ok) return null;
    const data = await response.json();
    for (const part of data.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch {
    return null;
  }
}

// ─── Main Pipeline ──────────────────────────────────────────────────────────────

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
  const sql = createSql(pool);
  console.log("=== Full Autonomous Pipeline ===\n");

  // 1. Fetch all feeds
  const feedItems = await fetchAllFeeds();
  console.log(`Fetched: ${feedItems.length}`);

  // 2. Filter for relevance
  const relevant = filterRelevantItems(feedItems);
  console.log(`Relevant: ${relevant.length}`);

  // 3. Dedup against DB (direct query)
  const dbRows = await sql`SELECT title, source_url FROM journal_articles`;
  const existingTitles = new Set<string>();
  const existingUrls = new Set<string>();
  for (const row of dbRows) {
    if (row.title) existingTitles.add((row.title as string).toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 50));
    if (row.source_url) existingUrls.add(row.source_url as string);
  }
  console.log(`DB has ${dbRows.length} existing articles`);

  const newItems = relevant.filter((item) => {
    if (!item.title || typeof item.title !== "string") return false;
    const normalized = item.title.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 50);
    if (!normalized || existingTitles.has(normalized)) return false;
    if (item.link && existingUrls.has(item.link)) return false;
    return true;
  });

  // Dedup within batch
  const seenUrls = new Set<string>();
  const dedupedItems = newItems.filter((item) => {
    if (item.link && seenUrls.has(item.link)) return false;
    if (item.link) seenUrls.add(item.link);
    return true;
  });
  console.log(`New after dedup: ${dedupedItems.length}`);

  // 4. Score and threshold
  const scored = getTopItems(dedupedItems, 50);
  const qualified = scored.filter((s) => s.score >= MINIMUM_SCORE);
  console.log(`Qualified (>= ${MINIMUM_SCORE}): ${qualified.length}`);

  if (qualified.length === 0) {
    console.log("Nothing qualified. Done.");
    await pool.end();
    return;
  }

  // 5. Generate articles (full 3-pass: draft + review + anti-AI-tells)
  const toProcess = qualified.slice(0, MAX_ARTICLES_PER_RUN).map((s) => s.item);
  console.log(`\nGenerating ${toProcess.length} articles (full 3-pass pipeline)...\n`);
  const articles = await generateArticleBatch(toProcess, 2);
  console.log(`Generated: ${articles.length}`);

  // 6. Fetch/generate images for each article
  console.log("\nFetching images...");
  for (const article of articles) {
    // Try real OG image from source first
    if (article.sourceUrl) {
      const ogImage = await fetchOgImage(article.sourceUrl);
      if (ogImage) {
        article.imageUrl = ogImage;
        console.log(`  [og] ${article.slug.slice(0, 40)}`);
        continue;
      }
    }
    // Fallback: Gemini generation
    const genImage = await generateImage(article.title);
    if (genImage) {
      article.imageUrl = genImage;
      console.log(`  [gen] ${article.slug.slice(0, 40)}`);
    } else {
      console.log(`  [none] ${article.slug.slice(0, 40)}`);
    }
    await new Promise((r) => setTimeout(r, 2000));
  }

  // 7. Persist to DB
  console.log("\nPersisting to DB...");
  let persisted = 0;
  for (const [idx, article] of articles.entries()) {
    const id = `j-auto-${nanoid(8)}`;
    const isFeatured = idx < 2;
    const isBreaking = idx === 0;
    try {
      await sql`
        INSERT INTO journal_articles (id, slug, title, excerpt, body, category, tags, source, source_url, source_name, author_name, author_role, image_url, is_featured, is_breaking, read_time_minutes, status, published_at)
        VALUES (${id}, ${article.slug}, ${article.title}, ${article.excerpt}, ${article.body}, ${article.category}, ${JSON.stringify(article.tags)}, ${article.source}, ${article.sourceUrl || null}, ${article.sourceName || null}, ${article.author.name}, ${article.author.role || null}, ${article.imageUrl || null}, ${isFeatured}, ${isBreaking}, ${article.readTimeMinutes}, 'published', NOW())
        ON CONFLICT (slug) DO NOTHING
      `;
      persisted++;
      console.log(`  [ok] ${article.slug.slice(0, 50)}`);
    } catch (err) {
      console.log(`  [skip] ${article.slug.slice(0, 50)} — ${String(err).slice(0, 50)}`);
    }
  }

  const finalCount = await sql`SELECT COUNT(*) FROM journal_articles`;
  console.log(`\n=== Done: ${persisted} new articles. Total in DB: ${finalCount[0].count} ===`);
  await pool.end();
}

main().catch(console.error);
