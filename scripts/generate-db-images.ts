/**
 * Generate images for all DB articles that don't have one.
 * Saves to public/images/intelligence/ and updates the DB.
 */

import { Pool, QueryResult } from "pg";
import { writeFileSync, existsSync, mkdirSync } from "fs";
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

const API_KEY = process.env.GEMINI_API_KEY!;
const MODEL = "gemini-3.1-flash-image-preview";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;
const IMG_DIR = "public/images/intelligence";

const CATEGORY_STYLES: Record<string, string> = {
  regulatory: "Government regulation: modern Abu Dhabi/Dubai government building, marble and glass, official screens, muted blue-gray with gold accents.",
  "new-openings": "Architecture: new healthcare facility, glass curtain wall, dramatic lobby, bright natural light, white and teal.",
  financial: "Financial data: Bloomberg terminal aesthetic, dark background with glowing green/amber charts, DIFC trading floor at night.",
  events: "Conference: exhibition floor or keynote stage, warm tungsten lighting, professional crowds.",
  "social-pulse": "Social media: smartphone screens with feeds, cool blue-white glow in dim environment.",
  "thought-leadership": "Leadership: professional silhouette against Gulf city skyline, golden hour, contemplative.",
  "market-intelligence": "Analytics: large screen showing healthcare heat maps, dark UI with accent colors, data-rich.",
  technology: "Health tech: medical technology close-up, robotic arm or AI diagnostic screen, futuristic blue-white lighting.",
  workforce: "Healthcare workers: nurses at modern station, diverse medical team, warm professional lighting.",
};

async function generateImage(slug: string, title: string, category: string): Promise<string | null> {
  const outPath = `${IMG_DIR}/${slug}.jpg`;
  if (existsSync(outPath)) return `/images/intelligence/${slug}.jpg`;

  const style = CATEGORY_STYLES[category] || CATEGORY_STYLES.regulatory;

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `Photorealistic editorial image for healthcare article: "${title}". Style: ${style} NO text, NO watermarks, NO logos. 16:9 landscape.` }] }],
        generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
      }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    const parts = data.candidates?.[0]?.content?.parts || [];

    for (const part of parts) {
      if (part.inlineData) {
        const buffer = Buffer.from(part.inlineData.data, "base64");
        writeFileSync(outPath, buffer);
        console.log(`  [img] ${slug} — ${(buffer.length / 1024).toFixed(0)}KB`);
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

  const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
  const sql = createSql(pool);
  const articles = await sql`SELECT id, slug, title, category, image_url FROM journal_articles WHERE image_url IS NULL OR image_url = ''`;

  console.log(`${articles.length} articles need images\n`);

  let done = 0;
  for (const article of articles) {
    const imageUrl = await generateImage(article.slug as string, article.title as string, article.category as string);
    if (imageUrl) {
      await sql`UPDATE journal_articles SET image_url = ${imageUrl} WHERE id = ${article.id}`;
      done++;
    }
    await new Promise((r) => setTimeout(r, 3000));
  }

  console.log(`\nDone: ${done} images generated and saved to DB`);

  await pool.end();
}

main().catch(console.error);
