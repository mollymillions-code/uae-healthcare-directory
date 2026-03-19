/**
 * Fill missing images: try real OG image first, fall back to Gemini generation.
 * Every article MUST have an image. No exceptions.
 */

import { neon } from "@neondatabase/serverless";
import { writeFileSync, existsSync, mkdirSync } from "fs";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const GEMINI_KEY = process.env.GEMINI_API_KEY!;
const IMG_DIR = "public/images/intelligence";

const CATEGORY_STYLES: Record<string, string> = {
  regulatory: "Modern government building in Abu Dhabi or Dubai, marble halls, official meeting room, blue-gray tones with gold accents",
  "new-openings": "New hospital or clinic building exterior, glass facade, bright daylight, medical professionals entering, teal and white",
  financial: "Financial district skyline at dusk, stock ticker overlay effect, dark with glowing amber data points",
  events: "Healthcare conference hall, keynote presentation, professional audience, warm stage lighting",
  "social-pulse": "Person scrolling phone in modern office, social media feeds visible, cool blue-white screen glow",
  "thought-leadership": "Executive silhouette against floor-to-ceiling windows overlooking Gulf city, golden hour light",
  "market-intelligence": "Data analytics dashboard on large screen, healthcare metrics, dark interface with green accent highlights",
  technology: "Medical technology close-up, robotic surgery arm or AI diagnostic screen, clean futuristic blue-white",
  workforce: "Diverse group of healthcare workers in hospital corridor, scrubs and white coats, warm natural light",
};

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

async function generateImage(slug: string, title: string, category: string): Promise<string | null> {
  const outPath = `${IMG_DIR}/${slug}.jpg`;
  if (existsSync(outPath)) return `/images/intelligence/${slug}.jpg`;

  const style = CATEGORY_STYLES[category] || CATEGORY_STYLES.regulatory;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent?key=${GEMINI_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `You are a photo editor. Generate ONE unique photorealistic image for this specific healthcare article. The image MUST depict the SPECIFIC subject of the article, NOT a generic cityscape.

ARTICLE: "${title}"

INSTRUCTIONS:
1. Identify the specific subject from the title. IPO? Show stock exchange. Insurance? Show billing desk. Nursing shortage? Show nurses. Drug law? Show pharmacy. Acquisition? Show boardroom.
2. Include contextual details from the title.
3. Vary composition: close-ups, wide shots, overhead, eye-level.
4. Vary color: warm for human stories, cool for tech, dark for financial, bright for openings.

RULES: NO text/words/numbers/watermarks/logos. 16:9 landscape. Photorealistic. Must be visually unique — not the same as any other article's image.` }] }],
          generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
        }),
      }
    );

    if (!response.ok) return null;
    const data = await response.json();
    for (const part of data.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        const buffer = Buffer.from(part.inlineData.data, "base64");
        writeFileSync(outPath, buffer);
        return `/images/intelligence/${slug}.jpg`;
      }
    }
    return null;
  } catch {
    return null;
  }
}

async function main() {
  if (!existsSync(IMG_DIR)) mkdirSync(IMG_DIR, { recursive: true });

  const sql = neon(process.env.DATABASE_URL!);
  const articles = await sql`
    SELECT id, slug, title, category, source_url, image_url
    FROM journal_articles
    WHERE image_url IS NULL OR image_url = ''
    ORDER BY published_at DESC
  `;

  console.log(`${articles.length} articles missing images\n`);

  let ogFound = 0;
  let generated = 0;
  let failed = 0;

  for (const article of articles) {
    const slug = article.slug as string;
    const title = article.title as string;
    const category = article.category as string;
    const sourceUrl = article.source_url as string;

    // Try 1: real OG image from source
    if (sourceUrl) {
      const ogImage = await fetchOgImage(sourceUrl);
      if (ogImage) {
        await sql`UPDATE journal_articles SET image_url = ${ogImage} WHERE id = ${article.id}`;
        ogFound++;
        console.log(`  [real] ${slug.slice(0, 45)} → OG image`);
        await new Promise((r) => setTimeout(r, 500));
        continue;
      }
    }

    // Try 2: generate with Gemini
    const genImage = await generateImage(slug, title, category);
    if (genImage) {
      await sql`UPDATE journal_articles SET image_url = ${genImage} WHERE id = ${article.id}`;
      generated++;
      console.log(`  [gen]  ${slug.slice(0, 45)} → Gemini image`);
    } else {
      failed++;
      console.log(`  [FAIL] ${slug.slice(0, 45)}`);
    }

    await new Promise((r) => setTimeout(r, 3000));
  }

  console.log(`\nDone: ${ogFound} real OG, ${generated} Gemini generated, ${failed} failed`);

  const count = await sql`SELECT COUNT(*) FROM journal_articles WHERE image_url IS NOT NULL AND image_url != ''`;
  console.log(`Articles with images: ${count[0].count}`);
}

main().catch(console.error);
