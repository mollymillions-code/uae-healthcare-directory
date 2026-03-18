/**
 * Generate creative assets for the UAE Healthcare Directory
 * using Google's Nano Banana Pro 2 (Gemini 3.1 Flash Image Preview)
 *
 * Generates: hero image, city images, category illustrations
 */

import * as fs from "fs";
import * as path from "path";

const API_KEY = "AIzaSyBlb-6SaGxmdcf1AhOc5tImzVTsDqd0ptY";
const MODEL = "gemini-3.1-flash-image-preview";
const OUTPUT_DIR = path.resolve("public/images");

interface GenerationConfig {
  prompt: string;
  filename: string;
  subfolder?: string;
}

async function generateImage(config: GenerationConfig): Promise<boolean> {
  const { prompt, filename, subfolder } = config;
  const dir = subfolder ? path.join(OUTPUT_DIR, subfolder) : OUTPUT_DIR;

  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const outPath = path.join(dir, filename);
  if (fs.existsSync(outPath)) {
    console.log(`  ⏭ ${filename} already exists, skipping`);
    return true;
  }

  console.log(`  🎨 Generating: ${filename}`);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            responseModalities: ["image", "text"],
            temperature: 1.0,
          },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      console.error(`  ❌ API error (${response.status}): ${err.slice(0, 200)}`);
      return false;
    }

    const data = await response.json();

    // Extract image from response
    const parts = data.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData?.mimeType?.startsWith("image/")) {
        const buffer = Buffer.from(part.inlineData.data, "base64");
        fs.writeFileSync(outPath, buffer);
        console.log(`  ✅ Saved: ${outPath} (${(buffer.length / 1024).toFixed(1)}KB)`);
        return true;
      }
    }

    console.error(`  ❌ No image in response for ${filename}`);
    return false;
  } catch (err) {
    console.error(`  ❌ Error: ${(err as Error).message}`);
    return false;
  }
}

async function main() {
  console.log("🎨 UAE Healthcare Directory — Asset Generation\n");
  console.log(`  Model: ${MODEL}\n`);

  const assets: GenerationConfig[] = [
    // Hero image
    {
      prompt:
        "Create a modern, elegant editorial-style illustration for a healthcare directory website hero section. Abstract geometric shapes in warm sand (#d4a574), deep teal (#0d7377), and cream (#f5f0e8) tones. Include subtle medical motifs — a stylized stethoscope, heartbeat line, and cross — woven into flowing architectural forms inspired by modern UAE skylines. Wide panoramic composition, 1400x600px aspect ratio. Minimalist, sophisticated, editorial magazine feel. No text, no photos of people.",
      filename: "hero-bg.png",
    },

    // City images
    {
      prompt:
        "Abstract geometric illustration of Dubai skyline — Burj Khalifa silhouette, flowing curves, in warm teal (#0d7377) and sand gold (#d4a574) on cream background. Minimalist editorial style, no text, no photos. Clean vector-like aesthetic. 600x400px.",
      filename: "dubai.png",
      subfolder: "cities",
    },
    {
      prompt:
        "Abstract geometric illustration of Abu Dhabi — Sheikh Zayed Mosque dome silhouette, flowing arches, in warm teal (#0d7377) and sand gold (#d4a574) on cream background. Minimalist editorial style, no text, no photos. 600x400px.",
      filename: "abu-dhabi.png",
      subfolder: "cities",
    },
    {
      prompt:
        "Abstract geometric illustration of Sharjah — Islamic art-inspired geometric patterns with a minaret silhouette, in warm teal (#0d7377) and terracotta on cream background. Minimalist editorial style, no text, no photos. 600x400px.",
      filename: "sharjah.png",
      subfolder: "cities",
    },
    {
      prompt:
        "Abstract geometric illustration of Al Ain city — oasis palms and mountain silhouette (Jebel Hafeet), in warm teal (#0d7377) and earthy brown on cream background. Minimalist editorial style, no text. 600x400px.",
      filename: "al-ain.png",
      subfolder: "cities",
    },

    // Category illustrations
    {
      prompt:
        "Minimalist geometric icon illustration of a hospital — clean architectural lines forming a medical building with a cross, in deep teal (#0d7377) on cream background. Modern, editorial, vector-like. No text. 300x300px.",
      filename: "hospitals.png",
      subfolder: "categories",
    },
    {
      prompt:
        "Minimalist geometric icon illustration of dental care — stylized tooth with clean geometric lines, in deep teal (#0d7377) on cream background. Modern editorial style. No text. 300x300px.",
      filename: "dental.png",
      subfolder: "categories",
    },
    {
      prompt:
        "Minimalist geometric icon illustration of a pharmacy — mortar and pestle with clean flowing lines, in deep teal (#0d7377) on cream background. Modern editorial style. No text. 300x300px.",
      filename: "pharmacy.png",
      subfolder: "categories",
    },
    {
      prompt:
        "Minimalist geometric icon illustration of cardiology — anatomical heart with flowing geometric lines and a heartbeat rhythm, in deep teal (#0d7377) and warm coral on cream background. Modern editorial. No text. 300x300px.",
      filename: "cardiology.png",
      subfolder: "categories",
    },
    {
      prompt:
        "Minimalist geometric icon illustration of an eye for ophthalmology — stylized eye with geometric iris patterns, in deep teal (#0d7377) on cream background. Modern editorial style. No text. 300x300px.",
      filename: "ophthalmology.png",
      subfolder: "categories",
    },
    {
      prompt:
        "Minimalist geometric icon illustration of dermatology — skin layers with flowing abstract waves, in deep teal (#0d7377) and soft coral on cream background. Modern editorial style. No text. 300x300px.",
      filename: "dermatology.png",
      subfolder: "categories",
    },
  ];

  let success = 0;
  let failed = 0;

  for (const asset of assets) {
    const result = await generateImage(asset);
    if (result) success++;
    else failed++;

    // Rate limiting — 200ms between requests
    await new Promise((r) => setTimeout(r, 200));
  }

  console.log(`\n✅ Generated ${success} assets (${failed} failed)`);
}

main().catch(console.error);
