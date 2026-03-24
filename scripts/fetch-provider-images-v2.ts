/**
 * Fetch real images for providers using Google Places API (New).
 * Uses Text Search to find place, then constructs photo URL.
 *
 * Usage: npx tsx scripts/fetch-provider-images-v2.ts [--offset 0] [--limit 500]
 */
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const PROVIDERS_PATH = join(process.cwd(), "src/lib/providers-scraped.json");
const GOOGLE_KEY = process.env.GOOGLE_PLACES_API_KEY;
const BATCH_SIZE = 5;
const DELAY_MS = 300;
const SAVE_EVERY = 50;

interface Provider {
  name: string;
  citySlug: string;
  address: string;
  coverImageUrl?: string;
  googlePhotoUrl?: string;
  [key: string]: unknown;
}

async function fetchPlacePhoto(name: string, city: string): Promise<string | null> {
  if (!GOOGLE_KEY) return null;

  try {
    const resp = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_KEY,
        "X-Goog-FieldMask": "places.photos",
      },
      body: JSON.stringify({ textQuery: `${name} ${city} UAE` }),
      signal: AbortSignal.timeout(8000),
    });

    if (!resp.ok) return null;
    const data = await resp.json();
    const photoName = data.places?.[0]?.photos?.[0]?.name;
    if (!photoName) return null;

    // Construct the photo URL (maxWidthPx)
    return `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=800&key=${GOOGLE_KEY}`;
  } catch {
    return null;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const offset = parseInt(args[args.indexOf("--offset") + 1] || "0") || 0;
  const limit = parseInt(args[args.indexOf("--limit") + 1] || "500") || 500;

  if (!GOOGLE_KEY) {
    console.error("Set GOOGLE_PLACES_API_KEY in .env.local");
    process.exit(1);
  }

  const providers: Provider[] = JSON.parse(readFileSync(PROVIDERS_PATH, "utf-8"));
  const toProcess = providers.slice(offset, offset + limit);

  console.log(`Fetching images for ${toProcess.length} providers (offset ${offset})`);

  let found = 0, failed = 0, skipped = 0;

  for (let i = 0; i < toProcess.length; i += BATCH_SIZE) {
    const batch = toProcess.slice(i, i + BATCH_SIZE);

    await Promise.allSettled(
      batch.map(async (p, j) => {
        const idx = offset + i + j;
        if (p.googlePhotoUrl) { skipped++; return; }

        const city = p.citySlug.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
        const photoUrl = await fetchPlacePhoto(p.name, city);

        if (photoUrl) {
          providers[idx].googlePhotoUrl = photoUrl;
          providers[idx].coverImageUrl = photoUrl;
          found++;
        } else {
          failed++;
        }
      })
    );

    if (found > 0 && found % SAVE_EVERY === 0) {
      writeFileSync(PROVIDERS_PATH, JSON.stringify(providers, null, 2));
      console.log(`  [SAVED] ${found} found`);
    }

    if ((i + BATCH_SIZE) % 100 === 0) {
      console.log(`  Progress: ${i + BATCH_SIZE}/${toProcess.length} (${found} found, ${failed} failed)`);
    }

    await new Promise((r) => setTimeout(r, DELAY_MS));
  }

  if (found > 0) {
    writeFileSync(PROVIDERS_PATH, JSON.stringify(providers, null, 2));
  }

  console.log(`\n=== Done: ${found} found, ${failed} failed, ${skipped} skipped ===`);
}

main().catch(console.error);
