/**
 * Generate distinct, category-aware images for journal articles.
 * Each category gets a different visual language. Each article gets
 * a unique prompt seeded by its title and tags.
 *
 * Usage: GEMINI_API_KEY=xxx npx tsx scripts/generate-journal-images.ts
 */

import { writeFileSync, existsSync, unlinkSync } from "fs";
import { SEED_ARTICLES } from "../src/lib/intelligence/seed-articles";

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error("Set GEMINI_API_KEY");
  process.exit(1);
}

const MODEL = "gemini-3.1-flash-image-preview";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

// ─── Category-specific visual languages ─────────────────────────────────────────

const CATEGORY_STYLES: Record<string, string> = {
  regulatory: `Government and regulation visual: A sleek modern government building or regulatory office interior in Abu Dhabi or Dubai. Clean lines, marble, glass. Official documents or digital screens showing policy text. Muted blue-gray tones with gold accents. Formal, authoritative, institutional. Think: the corridor of power where healthcare policy gets made.`,

  "new-openings": `Architecture and construction visual: A striking new healthcare facility — glass curtain wall, dramatic lobby atrium, construction crane in background, or ribbon-cutting moment. Bright natural light, white and teal palette. Sense of scale and ambition. Think: an architectural photography award submission of a hospital.`,

  financial: `Financial data visualization: Abstract visualization of financial data — stock tickers, rising chart lines, currency symbols, Bloomberg terminal aesthetic. Dark background (near-black or deep navy) with glowing green/amber data points. Numbers and graphs overlaid on dark glass surfaces. Think: the view from a DIFC trading floor at night.`,

  events: `Conference and exhibition visual: Aerial or wide view of a large healthcare exhibition floor, conference keynote stage, or networking event. Dramatic overhead lighting, crowds of professionals in business attire, exhibition booths. Warm tungsten lighting. Think: Arab Health exhibition from the VIP balcony.`,

  "social-pulse": `Social media and conversation visual: Multiple smartphone screens showing social media feeds, overlapping conversation bubbles, LinkedIn/X interface elements. Shallow depth of field focused on one screen. Cool blue-white light from screens in a dimly lit environment. Think: a healthcare executive scrolling LinkedIn at night.`,

  "thought-leadership": `Portrait and leadership visual: A single professional figure (silhouette or profile) against floor-to-ceiling windows overlooking a Gulf city skyline. Dramatic side lighting, contemplative pose. Warm golden hour light. Minimal, powerful composition. Think: a CEO portrait in Monocle magazine.`,

  "market-intelligence": `Data dashboard and analytics visual: A large screen or wall display showing healthcare analytics — heat maps, geographic data overlays of the UAE, patient flow visualizations. Dark UI with accent colors. Clean, precise, data-rich. Think: a command center for healthcare market intelligence.`,

  technology: `Health tech and innovation visual: Close-up of cutting-edge medical technology — robotic surgery arm, AI diagnostic screen, wearable health devices, or a modern lab with holographic displays. Clean, futuristic, blue-white lighting. Think: the R&D lab of a health tech startup in Dubai Silicon Oasis.`,

  workforce: `Healthcare workers visual: Real healthcare workers in action — nurses at a modern hospital station, a diverse group of medical professionals in scrubs walking through a hospital corridor, or a training simulation. Natural, human, warm but professional lighting. Think: a NYT documentary photo of UAE hospital staff.`,
};

// ─── Per-article differentiators ────────────────────────────────────────────────

function buildPrompt(title: string, category: string, tags: string[]): string {
  const categoryStyle = CATEGORY_STYLES[category] || CATEGORY_STYLES.regulatory;

  // Extract location cues from tags
  const locationTags = tags.filter(t =>
    ["Dubai", "Abu Dhabi", "Sharjah", "MOHAP", "DHA", "DOH", "Ras Al Khaimah", "RAKEZ"].includes(t)
  );
  const locationHint = locationTags.length > 0
    ? `Location context: ${locationTags.join(", ")}. Include visual cues from this specific UAE location.`
    : "Location: general UAE/Gulf setting.";

  // Extract subject cues from title
  const subjectHints: string[] = [];
  if (title.toLowerCase().includes("ai") || title.toLowerCase().includes("artificial")) {
    subjectHints.push("Include subtle AI/technology visual elements — screens, neural network patterns, or digital overlays.");
  }
  if (title.toLowerCase().includes("ipo") || title.toLowerCase().includes("billion") || title.toLowerCase().includes("revenue")) {
    subjectHints.push("Include financial/market visual cues — rising graphs, ticker displays, or currency.");
  }
  if (title.toLowerCase().includes("nursing") || title.toLowerCase().includes("workforce") || title.toLowerCase().includes("staff")) {
    subjectHints.push("Show healthcare workers — nurses, doctors, diverse team in a clinical setting.");
  }
  if (title.toLowerCase().includes("clinic") || title.toLowerCase().includes("hospital") || title.toLowerCase().includes("center")) {
    subjectHints.push("Show the physical facility — modern architecture, lobby, patient areas.");
  }
  if (title.toLowerCase().includes("telemedicine") || title.toLowerCase().includes("digital") || title.toLowerCase().includes("app")) {
    subjectHints.push("Show digital health interfaces — tablet/phone screens, video call, remote consultation setup.");
  }

  return `Create a photorealistic editorial image for a healthcare journal article.

Article title: "${title}"

VISUAL DIRECTION:
${categoryStyle}

${locationHint}
${subjectHints.join("\n")}

HARD RULES:
- Absolutely NO text, NO words, NO numbers, NO watermarks, NO logos in the image
- NO generic stock photo compositions (no stethoscope on white, no handshake)
- 16:9 landscape aspect ratio
- Professional color grading — not oversaturated
- Each image must feel like it belongs in a specific place, not anywhere
- The image should make someone stop scrolling on LinkedIn`;
}

async function generateImage(
  title: string,
  category: string,
  tags: string[],
  slug: string,
  force: boolean
): Promise<boolean> {
  const outPath = `public/images/journal/${slug}.jpg`;

  if (!force && existsSync(outPath)) {
    console.log(`  [skip] ${slug}`);
    return true;
  }

  const prompt = buildPrompt(title, category, tags);

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.log(`  [error] ${slug} — ${response.status}: ${err.slice(0, 100)}`);
      return false;
    }

    const data = await response.json();
    const parts = data.candidates?.[0]?.content?.parts || [];

    for (const part of parts) {
      if (part.inlineData) {
        const buffer = Buffer.from(part.inlineData.data, "base64");
        writeFileSync(outPath, buffer);
        console.log(`  [done] ${slug} — ${(buffer.length / 1024).toFixed(0)}KB [${category}]`);
        return true;
      }
    }

    console.log(`  [no image] ${slug}`);
    return false;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.log(`  [error] ${slug} — ${msg.slice(0, 100)}`);
    return false;
  }
}

async function main() {
  const force = process.argv.includes("--force");
  console.log(`Generating images for ${SEED_ARTICLES.length} articles (force=${force})...\n`);

  let success = 0;
  let failed = 0;

  for (const article of SEED_ARTICLES) {
    const ok = await generateImage(article.title, article.category, article.tags, article.slug, force);
    if (ok) success++;
    else failed++;
    await new Promise((r) => setTimeout(r, 3000));
  }

  console.log(`\nDone: ${success} generated, ${failed} failed`);
}

main();
