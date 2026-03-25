/**
 * Fetch real images for providers from Google Places API.
 * Uses the Text Search endpoint to find the place, then gets the photo reference.
 *
 * Usage: npx tsx scripts/fetch-provider-images.ts [--offset 0] [--limit 500]
 */
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const PROVIDERS_PATH = join(process.cwd(), "src/lib/providers-scraped.json");
const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
const BATCH_SIZE = 5;
const DELAY_MS = 200;
const SAVE_EVERY = 100;

interface Provider {
  name: string;
  citySlug: string;
  areaSlug: string;
  address: string;
  coverImageUrl?: string;
  googlePhotoUrl?: string;
  [key: string]: unknown;
}

async function searchPlacePhoto(name: string, address: string, city: string): Promise<string | null> {
  if (!GOOGLE_API_KEY) return null;

  const query = `${name} ${city} UAE`;

  try {
    // Use Places Text Search to find the place
    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_API_KEY}`;
    const searchResp = await fetch(searchUrl, { signal: AbortSignal.timeout(8000) });
    if (!searchResp.ok) return null;

    const searchData = await searchResp.json();
    const place = searchData.results?.[0];
    if (!place?.photos?.[0]?.photo_reference) return null;

    // Get photo URL
    const photoRef = place.photos[0].photo_reference;
    const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photoRef}&key=${GOOGLE_API_KEY}`;

    // Follow redirect to get actual image URL
    const photoResp = await fetch(photoUrl, { redirect: "follow", signal: AbortSignal.timeout(8000) });
    if (!photoResp.ok) return null;

    return photoResp.url;
  } catch {
    return null;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const offset = parseInt(args[args.indexOf("--offset") + 1] || "0") || 0;
  const limit = parseInt(args[args.indexOf("--limit") + 1] || "500") || 500;

  if (!GOOGLE_API_KEY) {
    console.error("No Google API key found. Set GOOGLE_PLACES_API_KEY or NEXT_PUBLIC_GOOGLE_MAPS_KEY in .env.local");
    process.exit(1);
  }

  const providers: Provider[] = JSON.parse(readFileSync(PROVIDERS_PATH, "utf-8"));
  const toProcess = providers.slice(offset, offset + limit);

  console.log(`Processing ${toProcess.length} providers (offset ${offset}, limit ${limit})`);
  console.log(`API Key: ${GOOGLE_API_KEY.slice(0, 10)}...`);

  let found = 0, failed = 0, skipped = 0;

  for (let i = 0; i < toProcess.length; i += BATCH_SIZE) {
    const batch = toProcess.slice(i, i + BATCH_SIZE);

    await Promise.allSettled(
      batch.map(async (p, j) => {
        const idx = offset + i + j;

        // Skip if already has a real (non-category) image
        if (p.googlePhotoUrl) { skipped++; return; }

        const city = p.citySlug.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
        const photoUrl = await searchPlacePhoto(p.name, p.address, city);

        if (photoUrl) {
          providers[idx].googlePhotoUrl = photoUrl;
          providers[idx].coverImageUrl = photoUrl;
          found++;
        } else {
          failed++;
        }
      })
    );

    // Save periodically
    if (found > 0 && found % SAVE_EVERY === 0) {
      writeFileSync(PROVIDERS_PATH, JSON.stringify(providers, null, 2));
      console.log(`  [SAVED] ${found} found, ${failed} failed, ${skipped} skipped`);
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
