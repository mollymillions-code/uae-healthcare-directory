/**
 * Regenerate ALL DB article images with contextual, unique prompts.
 * Forces regeneration even if image exists.
 */

import { Pool, QueryResult } from "pg";
import { writeFileSync, mkdirSync, existsSync } from "fs";
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

const GEMINI_KEY = process.env.GEMINI_API_KEY!;
const IMG_DIR = "public/images/intelligence";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent?key=${GEMINI_KEY}`;

async function generateImage(slug: string, title: string): Promise<string | null> {
  const outPath = `${IMG_DIR}/${slug}.jpg`;

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `You are a photo editor for a top-tier healthcare journal. Generate ONE unique photorealistic image for this specific article.

ARTICLE: "${title}"

CRITICAL RULES FOR UNIQUENESS:
1. Read the title. What is the SPECIFIC subject? Depict THAT — not a generic skyline.
   - "insurance premiums rise" → hospital billing counter, insurance paperwork, worried administrator
   - "Burjeel IPO" → Abu Dhabi stock exchange floor, IPO bell, trading screens
   - "drug law fines" → pharmacy shelves, courtroom, MOHAP enforcement officer
   - "nursing shortage" → empty hospital ward, exhausted nurses, recruitment fair
   - "health tech funding" → startup office, laptop with health app, venture capital meeting
   - "medical tourism" → international patient arriving at airport, luxury hospital lobby
   - "mental health" → therapy session, counseling room, community wellness center
   - "hospital acquisition" → corporate boardroom, signing ceremony, two building logos merging
2. Choose a DIFFERENT composition than other articles:
   - Vary between: macro close-up, medium portrait, wide establishing shot, bird's eye, over-the-shoulder
3. Vary the color temperature:
   - Financial → cool blues and dark navy
   - Healthcare workers → warm amber and natural light
   - Technology → cyan and clinical white
   - Regulatory → formal gray-blue with gold
   - New openings → bright daylight with architectural whites

NO text, NO words, NO numbers, NO watermarks, NO logos. 16:9 landscape. Photorealistic editorial quality.` }] }],
        generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
      }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    for (const part of data.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        writeFileSync(outPath, Buffer.from(part.inlineData.data, "base64"));
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
  const articles = await sql`SELECT id, slug, title FROM journal_articles ORDER BY published_at DESC`;

  console.log(`Regenerating images for ${articles.length} articles...\n`);

  let done = 0;
  let failed = 0;

  for (const article of articles) {
    const slug = article.slug as string;
    const title = article.title as string;

    const imageUrl = await generateImage(slug, title);
    if (imageUrl) {
      await sql`UPDATE journal_articles SET image_url = ${imageUrl} WHERE id = ${article.id}`;
      done++;
      console.log(`  [${done}/${articles.length}] ${slug.slice(0, 50)}`);
    } else {
      failed++;
      console.log(`  [FAIL] ${slug.slice(0, 50)}`);
    }

    await new Promise((r) => setTimeout(r, 3000));
  }

  console.log(`\nDone: ${done} regenerated, ${failed} failed`);

  await pool.end();
}

main().catch(console.error);
