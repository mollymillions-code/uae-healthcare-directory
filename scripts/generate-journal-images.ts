/**
 * Generate images for all seed articles using Gemini 3.1 Flash Image Preview.
 * Uses the REST API directly for image generation with responseModalities.
 *
 * Usage: GEMINI_API_KEY=xxx npx tsx scripts/generate-journal-images.ts
 */

import { writeFileSync, existsSync } from "fs";
import { SEED_ARTICLES } from "../src/lib/journal/seed-articles";

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error("Set GEMINI_API_KEY");
  process.exit(1);
}

const MODEL = "gemini-3.1-flash-image-preview";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

async function generateImage(title: string, category: string, slug: string): Promise<boolean> {
  const outPath = `public/images/journal/${slug}.jpg`;

  if (existsSync(outPath)) {
    console.log(`  [skip] ${slug}`);
    return true;
  }

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Generate a photorealistic editorial photograph for a healthcare news article.

Title: "${title}"
Category: ${category}

Style: Editorial photography for a Bloomberg/FT-level healthcare publication. UAE/Middle East context — modern hospital architecture, diverse medical professionals, Gulf city skylines. High contrast, warm muted tones, one strong accent. NO text, NO watermarks, NO logos. 16:9 landscape. Professional, not stock photo.`,
              },
            ],
          },
        ],
        generationConfig: {
          responseModalities: ["TEXT", "IMAGE"],
        },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.log(`  [error] ${slug} — ${response.status}: ${err.slice(0, 120)}`);
      return false;
    }

    const data = await response.json();
    const parts = data.candidates?.[0]?.content?.parts || [];

    for (const part of parts) {
      if (part.inlineData) {
        const buffer = Buffer.from(part.inlineData.data, "base64");
        writeFileSync(outPath, buffer);
        console.log(`  [done] ${slug} — ${(buffer.length / 1024).toFixed(0)}KB`);
        return true;
      }
    }

    console.log(`  [no image] ${slug}`);
    return false;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.log(`  [error] ${slug} — ${msg.slice(0, 120)}`);
    return false;
  }
}

async function main() {
  console.log(`Generating images for ${SEED_ARTICLES.length} articles using ${MODEL}...\n`);

  let success = 0;
  let failed = 0;

  for (const article of SEED_ARTICLES) {
    const ok = await generateImage(article.title, article.category, article.slug);
    if (ok) success++;
    else failed++;

    // Rate limit pause
    await new Promise((r) => setTimeout(r, 3000));
  }

  console.log(`\nDone: ${success} generated, ${failed} failed`);
}

main();
