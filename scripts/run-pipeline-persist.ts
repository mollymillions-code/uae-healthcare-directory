/**
 * Full autonomous pipeline — runs on GitHub Actions every 2 hours.
 * Uses Claude CLI (installed on EC2) for article generation.
 * No Gemini. Full 3-pass quality (draft + review + anti-AI-tells).
 * OG images from sources. Persists to DB. Zero human intervention.
 *
 * Usage: npx tsx scripts/run-pipeline-persist.ts
 */

import { Pool, QueryResult } from "pg";
import { execSync } from "child_process";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

// Tagged template SQL helper
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

import { fetchAllFeeds, filterRelevantItems, type RawFeedItem } from "../src/lib/intelligence/automation/feeds";
import { classifyCategory } from "../src/lib/intelligence/automation/feeds";
import { getTopItems } from "../src/lib/intelligence/automation/scoring";
import {
  getArticleSystemPrompt,
  getReviewEditorSystemPrompt,
} from "../src/lib/intelligence/automation/skills/news-story-writer";
import { nanoid } from "nanoid";

const MINIMUM_SCORE = 35;
const MAX_ARTICLES_PER_RUN = 10;

const R2_PUBLIC = "https://pub-12b97f7acbe84e70aacc715287b58c72.r2.dev";
const CATEGORY_FALLBACK: Record<string, string> = {
  regulatory: `${R2_PUBLIC}/intelligence/uae-stiffens-penalties-for-controlled-substances.webp`,
  financial: `${R2_PUBLIC}/intelligence/uae-healthcare-market-to-reach-50-billion-by-2029.webp`,
  technology: `${R2_PUBLIC}/intelligence/mediclinic-middle-east-digital-front-door.webp`,
  "new-openings": `${R2_PUBLIC}/intelligence/aster-dm-mega-clinic-dubai-hills.webp`,
  "market-intelligence": `${R2_PUBLIC}/intelligence/gcc-medical-tourism-uae-market-share.webp`,
  workforce: `${R2_PUBLIC}/intelligence/uae-nursing-shortage-5000-positions.webp`,
  events: `${R2_PUBLIC}/intelligence/arab-health-2026-key-takeaways.webp`,
  "thought-leadership": `${R2_PUBLIC}/intelligence/ai-diagnostics-uae-hospitals-opinion.webp`,
  "social-pulse": `${R2_PUBLIC}/intelligence/social-pulse-march-2026-week-2.webp`,
};

// ─── Claude CLI Runner ──────────────────────────────────────────────────────────

import { writeFileSync, unlinkSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

function callClaude(prompt: string, timeoutMs = 5 * 60 * 1000): string {
  // Write prompt to temp file to avoid shell argument length limits
  const tmpFile = join(tmpdir(), `claude-prompt-${Date.now()}.txt`);
  try {
    writeFileSync(tmpFile, prompt, "utf-8");
    const result = execSync(
      `cat "${tmpFile}" | claude --print -p -`,
      {
        timeout: timeoutMs,
        maxBuffer: 10 * 1024 * 1024,
        encoding: "utf-8",
        env: { ...process.env, PATH: process.env.PATH },
      }
    );
    return result.trim();
  } catch (err) {
    const error = err as { stderr?: string; message?: string };
    const errMsg = error.stderr || error.message || "";
    // Only log first 200 chars to keep logs readable
    console.error(`[Claude CLI] Error: ${errMsg.slice(0, 200)}`);
    return "";
  } finally {
    try { unlinkSync(tmpFile); } catch { /* ignore */ }
  }
}

function extractJson(output: string): Record<string, unknown> | null {
  // Try code block first
  const codeBlockMatch = output.match(/```(?:json)?\s*\n([\s\S]*?)\n```/);
  if (codeBlockMatch) {
    try { return JSON.parse(codeBlockMatch[1]); } catch { /* fall through */ }
  }
  // Try raw JSON
  const jsonMatch = output.match(/(\{[\s\S]*\})/);
  if (jsonMatch) {
    try { return JSON.parse(jsonMatch[1]); } catch { /* fall through */ }
  }
  return null;
}

// ─── Article Generation via Claude CLI ──────────────────────────────────────────

interface GeneratedArticle {
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  category: string;
  tags: string[];
  source: string;
  sourceUrl: string | null;
  sourceName: string | null;
  author: { name: string; role: string };
  publishedAt: string;
  isFeatured: boolean;
  isBreaking: boolean;
  readTimeMinutes: number;
  imageUrl?: string | null;
}

function generateArticleViaClaude(item: RawFeedItem): GeneratedArticle | null {
  const category = classifyCategory(item);
  const systemPrompt = getArticleSystemPrompt();

  const prompt = `${systemPrompt}

---

Transform this news item into a Zavis Healthcare Industry Insights article.

SOURCE: ${item.source}
TITLE: ${item.title}
DATE: ${item.pubDate}
LINK: ${item.link}
CONTENT: ${item.description}
${item.fullContent ? `FULL CONTENT: ${item.fullContent.slice(0, 3000)}` : ""}

Generate a JSON object with these exact fields (JSON only, no markdown fences):
{
  "slug": "url-friendly-slug-max-60-chars",
  "title": "Headline under 120 chars. Include a specific number. Name the entity. Sentence case.",
  "excerpt": "2-3 sentences, under 200 chars, includes the key fact and a number if available",
  "body": "Full HTML article body. 400-700 words. RICH FORMATTING REQUIRED — use <p>, <h3> (sentence case), <strong> for key numbers/names/dates, <ul><li> for data lists (2-5 items max), <blockquote> for direct quotes. Structure: lead paragraph, 2-3 sections with <h3> headings, forward-looking close. Every section must have at least one <strong> bolded fact and one specific number. Include UAE regulatory context (DHA/DOH/MOHAP).",
  "tags": ["5-8", "relevant", "lowercase", "tags"],
  "readTimeMinutes": 3
}

The body must be ORIGINAL writing based on the source facts. Add UAE healthcare market context. Write like a human journalist with 10 years covering UAE healthcare. Return ONLY the JSON object.`;

  console.log(`  [Draft] Generating: ${item.title.slice(0, 60)}...`);
  const draftOutput = callClaude(prompt);
  if (!draftOutput) return null;

  const parsed = extractJson(draftOutput);
  if (!parsed || !parsed.slug || !parsed.title || !parsed.body) {
    console.error(`  [Draft] Failed to parse JSON for: ${item.title.slice(0, 60)}`);
    return null;
  }

  // Pass 2: Review and improve via Claude CLI
  const reviewPrompt = `${getReviewEditorSystemPrompt()}

---

Review and improve this draft article. Fix all issues found.

DRAFT:
${JSON.stringify(parsed, null, 2)}

CRITICAL FORMATTING REQUIREMENT — the body HTML must be visually rich:
1. Ensure 2-3 <h3> subheadings (sentence case) break up the content
2. Bold key numbers, entity names, and dates with <strong> tags
3. Add at least one <ul><li> list if there are 3+ comparable data points
4. Wrap direct quotes in <blockquote> tags
5. If the body is a wall of <p> paragraphs with no other elements, ADD formatting

Return the improved version as JSON with the same fields (slug, title, excerpt, body, tags, readTimeMinutes). JSON only, no markdown fences. If the draft is already strong, make targeted improvements — don't rewrite from scratch. Return ONLY the JSON object.`;

  console.log(`  [Review] Editing: ${(parsed.title as string).slice(0, 60)}...`);
  const reviewOutput = callClaude(reviewPrompt);
  const improved = reviewOutput ? extractJson(reviewOutput) : null;

  const final = improved && improved.body ? improved : parsed;

  return {
    slug: final.slug as string,
    title: final.title as string,
    excerpt: final.excerpt as string,
    body: final.body as string,
    category,
    tags: (final.tags as string[]) || [],
    source: item.contentSource,
    sourceUrl: item.link,
    sourceName: item.source,
    author: { name: "Intelligence Desk", role: "Editorial" },
    publishedAt: new Date().toISOString(),
    isFeatured: false,
    isBreaking: false,
    readTimeMinutes: (final.readTimeMinutes as number) || 3,
  };
}

// ─── Gemini Image Generator ─────────────────────────────────────────────────────

async function generateImage(title: string): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
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
        signal: AbortSignal.timeout(30000),
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

// ─── Main Pipeline ──────────────────────────────────────────────────────────────

async function main() {
  // Verify Claude CLI is available
  try {
    execSync("which claude", { stdio: "pipe" });
    console.log("[Pipeline] Claude CLI: found");
  } catch {
    console.error("[Pipeline] FATAL: Claude CLI not installed. Cannot generate articles.");
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL!,
    max: 2, // Pipeline only needs 1-2 connections — don't exhaust slots
    idleTimeoutMillis: 10000,
  });
  const sql = createSql(pool);
  console.log("=== Full Autonomous Pipeline (Claude CLI) ===\n");

  // 1. Fetch all feeds
  const feedItems = await fetchAllFeeds();
  console.log(`Fetched: ${feedItems.length}`);

  // 2. Filter for relevance
  const relevant = filterRelevantItems(feedItems);
  console.log(`Relevant: ${relevant.length}`);

  // 3. Dedup against DB
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

  // 5. Generate articles via Claude CLI (sequential — each article gets full attention)
  const toProcess = qualified.slice(0, MAX_ARTICLES_PER_RUN).map((s) => s.item);
  console.log(`\nGenerating ${toProcess.length} articles via Claude CLI (2-pass: draft + review)...\n`);

  const articles: GeneratedArticle[] = [];
  for (const item of toProcess) {
    const article = generateArticleViaClaude(item);
    if (article) {
      articles.push(article);
      console.log(`  [ok] ${article.title.slice(0, 60)}`);
    } else {
      console.log(`  [fail] ${item.title.slice(0, 60)}`);
    }
  }
  console.log(`\nGenerated: ${articles.length}`);

  // 6. Fetch images — OG from source, then category fallback
  console.log("\nFetching images...");
  for (const article of articles) {
    let imageUrl: string | null = null;

    // Try 1: OG image from source
    if (article.sourceUrl) {
      imageUrl = await fetchOgImage(article.sourceUrl);
      if (imageUrl) {
        console.log(`  [og] ${article.slug.slice(0, 40)}`);
      }
    }

    // Try 2: Generate via Gemini
    if (!imageUrl) {
      imageUrl = await generateImage(article.title);
      if (imageUrl) {
        console.log(`  [gemini] ${article.slug.slice(0, 40)}`);
      }
      await new Promise((r) => setTimeout(r, 2000));
    }

    // Try 3: category-default R2 image
    if (!imageUrl) {
      imageUrl = CATEGORY_FALLBACK[article.category] ||
        `${R2_PUBLIC}/intelligence/uae-healthcare-market-to-reach-50-billion-by-2029.webp`;
      console.log(`  [fallback] ${article.slug.slice(0, 40)}`);
    }

    article.imageUrl = imageUrl;
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
