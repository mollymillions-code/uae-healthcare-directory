/**
 * Enrich provider descriptions using Gemini Flash Lite.
 *
 * Takes existing provider data (name, type, location, rating, reviews,
 * services, phone, website) and generates rich, SEO-valuable descriptions
 * following the anti-AI-tells writing skill.
 *
 * Usage: npx tsx scripts/enrich-descriptions.ts [--offset 0] [--limit 100] [--dry-run]
 */
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const PROVIDERS_PATH = join(process.cwd(), "src/lib/providers-scraped.json");
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const MODEL = "gemini-2.5-flash-preview-05-20";
const BATCH_SIZE = 10; // Concurrent requests
const DELAY_MS = 300; // Between batches

const SYSTEM_PROMPT = `You write provider descriptions for the UAE Open Healthcare Directory. Each description is 2-3 sentences (60-100 words). Voice: Financial Times health desk. Factual, dry, authoritative. The data speaks for itself.

STRUCTURE:
- Sentence 1: Name + what they do + area + city
- Sentence 2: Rating, review count, and 1-2 specific services (if data exists)
- Sentence 3: Regulator (DHA for Dubai, DOH for Abu Dhabi/Al Ain, MOHAP for others) + one practical detail (phone or website)

CONTENT WRITER RULES:
- Every claim needs a number, a name, or a date
- Name sources directly — "licensed by DHA" not "licensed by the relevant authority"
- Simple copulatives: "is", "has", "offers" — not "serves as", "stands as", "features"
- Vary sentence lengths: mix short (8-12 words) with medium (15-20 words)

ANTI-AI-TELLS FILTER (mandatory, zero tolerance):
1. No parallel negation ("not X, it's Y") or "not only...but also"
2. No inflated symbolism: cut "stands as a testament", "plays a vital role", "key turning point"
3. No superficial -ing analyses: cut "ensuring seamless", "highlighting the importance of"
4. No promotional tone: cut "state-of-the-art", "cutting-edge", "world-class", "vibrant", "nestled in", "bustling", "comprehensive", "premier"
5. No em dashes — use commas or periods
6. No weasel attribution: no "experts say", "widely regarded as"
7. No empty editorializing: cut "It's important to note", "worth mentioning"
8. No conjunctive padding: no "Moreover", "Furthermore", "Additionally" to start sentences
9. No unearned flattering adjectives: no "remarkable", "groundbreaking", "exceptional" unless backed by specific data
10. Use simple verbs: "is" not "serves as", "has" not "features", "runs" not "operates"
11. No synonym cycling: if you said "clinic" don't switch to "the facility" then "the establishment" — just say the name again
12. BANNED WORDS: delve, pivotal, tapestry, landscape, underscore, foster, intricate, garner, showcase, testament, enduring, vibrant, crucial, enhance, align with, valuable, nestled, bustling, comprehensive, premier, renowned, esteemed

OUTPUT: Return ONLY the description text. No quotes, no markdown, no preamble.`;

interface Provider {
  name: string;
  facilityType: string;
  citySlug: string;
  areaSlug: string;
  address: string;
  phone: string;
  website: string;
  googleRating: string | number | null;
  googleReviewCount: string | number | null;
  services: string[];
  description: string;
  [key: string]: unknown;
}

async function generateDescription(provider: Provider): Promise<string | null> {
  if (!GEMINI_KEY) return null;

  const rating = provider.googleRating && Number(provider.googleRating) > 0
    ? `${provider.googleRating} stars (${provider.googleReviewCount} reviews)`
    : "no rating yet";

  const services = provider.services?.length > 0
    ? `Services: ${provider.services.slice(0, 5).join(", ")}`
    : "";

  const city = provider.citySlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const area = provider.areaSlug?.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) || "";

  const prompt = `Write a description for this healthcare provider:

Name: ${provider.name}
Type: ${provider.facilityType}
City: ${city}
Area: ${area}
Address: ${provider.address}
Rating: ${rating}
${services}
Phone: ${provider.phone || "not listed"}
Website: ${provider.website || "not listed"}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          generationConfig: { maxOutputTokens: 200, temperature: 0.3 },
        }),
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!response.ok) {
      console.error(`  [${response.status}] ${provider.name}`);
      return null;
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!text || text.length < 30) return null;

    return text;
  } catch (e) {
    console.error(`  [ERR] ${provider.name}: ${e}`);
    return null;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const offset = parseInt(args.find((a) => a.startsWith("--offset"))?.split("=")[1] || args[args.indexOf("--offset") + 1] || "0") || 0;
  const limit = parseInt(args.find((a) => a.startsWith("--limit"))?.split("=")[1] || args[args.indexOf("--limit") + 1] || "100") || 100;
  const dryRun = args.includes("--dry-run");

  const providers: Provider[] = JSON.parse(readFileSync(PROVIDERS_PATH, "utf-8"));
  console.log(`Total providers: ${providers.length}`);
  console.log(`Processing: offset=${offset}, limit=${limit}, dryRun=${dryRun}`);

  const slice = providers.slice(offset, offset + limit);
  let enriched = 0;
  let failed = 0;
  let skipped = 0;

  for (let i = 0; i < slice.length; i += BATCH_SIZE) {
    const batch = slice.slice(i, i + BATCH_SIZE);

    const results = await Promise.allSettled(
      batch.map(async (p, j) => {
        const idx = offset + i + j;
        // Skip already enriched descriptions
        if (p.description && !p.description.includes("Licensed by") && p.description.length > 80) {
          skipped++;
          return;
        }
        const desc = await generateDescription(p);
        if (desc) {
          if (!dryRun) {
            providers[idx].description = desc;
          }
          console.log(`  [${idx}] ${p.name.slice(0, 40)} → ${desc.slice(0, 80)}...`);
          enriched++;
        } else {
          failed++;
        }
      })
    );

    // Rate limit
    if (i + BATCH_SIZE < slice.length) {
      await new Promise((r) => setTimeout(r, DELAY_MS));
    }

    // Progress
    if ((i + BATCH_SIZE) % 50 === 0) {
      console.log(`  Progress: ${i + BATCH_SIZE}/${slice.length} (${enriched} enriched, ${failed} failed)`);
    }
  }

  if (!dryRun) {
    writeFileSync(PROVIDERS_PATH, JSON.stringify(providers, null, 2));
    console.log(`\nSaved to ${PROVIDERS_PATH}`);
  }

  console.log(`\n=== Done: ${enriched} enriched, ${failed} failed, ${skipped} skipped ===`);
}

main().catch(console.error);
