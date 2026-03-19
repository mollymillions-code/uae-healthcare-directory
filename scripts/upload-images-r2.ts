/**
 * Compress all local article images with Sharp and upload to Cloudflare R2.
 * Updates DB with public R2 URLs.
 *
 * Usage: npx tsx scripts/upload-images-r2.ts
 */
import { execSync } from "child_process";
import { readFileSync, readdirSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const R2_BUCKET = "zavis-images";
const R2_PUBLIC_URL = "https://pub-12b97f7acbe84e70aacc715287b58c72.r2.dev";
const IMG_DIR = join(process.cwd(), "public/images/intelligence");
const COMPRESSED_DIR = "/tmp/zavis-compressed";

async function main() {
  const sql = neon(process.env.DATABASE_URL!);

  // Get all articles from DB
  const articles = await sql`SELECT id, slug, image_url FROM journal_articles`;
  console.log(`Found ${articles.length} articles in DB`);

  // Ensure compressed dir exists
  execSync(`mkdir -p ${COMPRESSED_DIR}`);

  // Also grab any local images not in DB
  const localFiles = existsSync(IMG_DIR)
    ? readdirSync(IMG_DIR).filter((f) => f.endsWith(".jpg") || f.endsWith(".png") || f.endsWith(".webp"))
    : [];
  console.log(`Found ${localFiles.length} local image files`);

  let uploaded = 0;
  let failed = 0;

  for (const file of localFiles) {
    const slug = file.replace(/\.(jpg|png|webp)$/, "");
    const inputPath = join(IMG_DIR, file);
    const outputPath = join(COMPRESSED_DIR, `${slug}.webp`);
    const r2Key = `intelligence/${slug}.webp`;

    try {
      // Compress with Sharp via CLI (avoids import issues)
      execSync(
        `npx sharp-cli --input "${inputPath}" --output "${outputPath}" resize 1200 675 --fit cover --format webp --quality 80`,
        { stdio: "pipe" }
      );
    } catch {
      // Fallback: just convert to webp without resize
      try {
        execSync(
          `npx sharp-cli --input "${inputPath}" --output "${outputPath}" --format webp --quality 80`,
          { stdio: "pipe" }
        );
      } catch {
        // Last resort: copy as-is
        execSync(`cp "${inputPath}" "${outputPath.replace('.webp', '.jpg')}"`, { stdio: "pipe" });
        // Upload the original
        try {
          execSync(
            `wrangler r2 object put ${R2_BUCKET}/intelligence/${slug}.jpg --file "${inputPath}" --content-type "image/jpeg" --remote`,
            { stdio: "pipe" }
          );
          const r2Url = `${R2_PUBLIC_URL}/intelligence/${slug}.jpg`;
          await sql`UPDATE journal_articles SET image_url = ${r2Url} WHERE slug = ${slug}`;
          console.log(`  [ok] ${slug} (original)`);
          uploaded++;
          continue;
        } catch (e) {
          console.log(`  [FAIL] ${slug}: ${e}`);
          failed++;
          continue;
        }
      }
    }

    // Upload compressed webp to R2
    try {
      execSync(
        `wrangler r2 object put ${R2_BUCKET}/${r2Key} --file "${outputPath}" --content-type "image/webp" --remote`,
        { stdio: "pipe" }
      );
      const r2Url = `${R2_PUBLIC_URL}/${r2Key}`;

      // Update DB
      await sql`UPDATE journal_articles SET image_url = ${r2Url} WHERE slug = ${slug}`;
      console.log(`  [ok] ${slug}`);
      uploaded++;
    } catch (e) {
      console.log(`  [FAIL] ${slug}: ${e}`);
      failed++;
    }
  }

  // For articles with no local image, generate one with Gemini and upload
  const noImageArticles = await sql`SELECT id, slug, title, category FROM journal_articles WHERE image_url IS NULL OR image_url = '' OR image_url LIKE '/images/%'`;
  console.log(`\n${noImageArticles.length} articles still need images`);

  for (const article of noImageArticles) {
    const slug = article.slug as string;
    const title = article.title as string;
    const category = article.category as string;

    console.log(`  Generating image for: ${slug}`);

    try {
      // Generate with Gemini
      const prompt = buildImagePrompt(title, category);
      const imageData = await generateGeminiImage(prompt);

      if (!imageData) {
        console.log(`    [skip] Gemini returned no image`);
        continue;
      }

      // Write to temp file
      const tmpPath = join(COMPRESSED_DIR, `${slug}-raw.png`);
      writeFileSync(tmpPath, Buffer.from(imageData, "base64"));

      // Compress
      const compressedPath = join(COMPRESSED_DIR, `${slug}.webp`);
      try {
        execSync(
          `npx sharp-cli --input "${tmpPath}" --output "${compressedPath}" resize 1200 675 --fit cover --format webp --quality 80`,
          { stdio: "pipe" }
        );
      } catch {
        execSync(`cp "${tmpPath}" "${compressedPath}"`, { stdio: "pipe" });
      }

      // Upload
      const r2Key = `intelligence/${slug}.webp`;
      execSync(
        `wrangler r2 object put ${R2_BUCKET}/${r2Key} --file "${compressedPath}" --content-type "image/webp" --remote`,
        { stdio: "pipe" }
      );

      const r2Url = `${R2_PUBLIC_URL}/${r2Key}`;
      await sql`UPDATE journal_articles SET image_url = ${r2Url} WHERE slug = ${slug}`;
      console.log(`    [ok] ${slug}`);
      uploaded++;
    } catch (e) {
      console.log(`    [FAIL] ${slug}: ${e}`);
      failed++;
    }
  }

  console.log(`\n=== Done: ${uploaded} uploaded, ${failed} failed ===`);
}

function buildImagePrompt(title: string, category: string): string {
  const categoryStyles: Record<string, string> = {
    regulatory: "a government building with UAE flag, official documents on a desk, warm lighting",
    financial: "a stock trading floor with green/red tickers, UAE dirham notes, glass office",
    technology: "a futuristic medical device with holographic display, clean lab environment",
    "new-openings": "a modern hospital lobby with glass walls, patients walking, bright daylight",
    "market-intelligence": "a data dashboard on a large screen, analyst at desk, city skyline through window",
    workforce: "diverse medical professionals in scrubs walking through a hospital corridor",
    events: "a large conference hall with stage lighting, audience in business attire",
    "thought-leadership": "a healthcare executive at a podium, modern auditorium, professional setting",
    "social-pulse": "a smartphone showing social media feeds, healthcare content, clean desk setup",
  };

  const style = categoryStyles[category] || "a modern UAE hospital with clean architecture";

  return `Professional editorial photograph for a healthcare news article titled "${title}". Scene: ${style}. Style: photojournalistic, high resolution, natural lighting, no text overlay, no watermarks. UAE/Middle East context.`;
}

async function generateGeminiImage(prompt: string): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseModalities: ["IMAGE", "TEXT"],
            responseMimeType: "image/png",
          },
        }),
      }
    );

    const data = await response.json();
    const parts = data?.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData?.mimeType?.startsWith("image/")) {
        return part.inlineData.data;
      }
    }
    return null;
  } catch {
    return null;
  }
}

main().catch(console.error);
