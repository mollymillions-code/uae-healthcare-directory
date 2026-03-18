/**
 * Google Places API Enrichment Layer (Tier 2)
 *
 * Takes providers scraped from official registers (DHA/DOH/MOHAP)
 * and enriches them with Google Places data:
 * - place_id (for embedding Google Maps and reviews)
 * - rating + review_count
 * - photos
 * - operating_hours
 * - website (if not already known)
 * - formatted phone number
 *
 * Cost: ~$17 per 1,000 Place Details requests
 * $200/month free credit covers ~11,000 requests
 * For ~5,000 UAE facilities = ~$85 total bootstrap cost
 *
 * Strategy:
 * 1. Text Search: "facility name" + "city, UAE" → get place_id
 * 2. Place Details: place_id → get rating, reviews, hours, photos
 * 3. Match by name similarity to avoid false positives
 */

import * as fs from "fs";
import * as path from "path";

const PARSED_DIR = path.resolve("data/parsed");

interface ScrapedProvider {
  name: string;
  citySlug: string;
  categorySlug: string;
  address: string;
  phone?: string;
  email?: string;
  website?: string;
}

interface EnrichedProvider extends ScrapedProvider {
  googlePlaceId?: string;
  googleRating?: number;
  googleReviewCount?: number;
  googlePhotos?: string[];
  operatingHours?: Record<string, { open: string; close: string }>;
  latitude?: number;
  longitude?: number;
  formattedAddress?: string;
  formattedPhone?: string;
}

const CITY_NAME_MAP: Record<string, string> = {
  "dubai": "Dubai",
  "abu-dhabi": "Abu Dhabi",
  "sharjah": "Sharjah",
  "ajman": "Ajman",
  "ras-al-khaimah": "Ras Al Khaimah",
  "fujairah": "Fujairah",
  "umm-al-quwain": "Umm Al Quwain",
  "al-ain": "Al Ain",
};

/**
 * Search Google Places for a facility and return the best match
 */
async function searchPlace(
  name: string,
  city: string,
  apiKey: string
): Promise<{ placeId: string; name: string } | null> {
  const query = `${name} ${city} UAE`;
  const url = `https://places.googleapis.com/v1/places:searchText`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "places.id,places.displayName",
    },
    body: JSON.stringify({
      textQuery: query,
      locationBias: {
        circle: {
          center: { latitude: 25.2, longitude: 55.3 }, // UAE center
          radius: 200000, // 200km
        },
      },
      maxResultCount: 3,
    }),
  });

  if (!response.ok) {
    console.error(`  Google Places search failed: ${response.status}`);
    return null;
  }

  const data = await response.json();
  const places = data.places || [];

  if (places.length === 0) return null;

  // Return the first result (best match)
  return {
    placeId: places[0].id,
    name: places[0].displayName?.text || name,
  };
}

/**
 * Get place details from Google Places API
 */
async function getPlaceDetails(
  placeId: string,
  apiKey: string
): Promise<{
  rating?: number;
  reviewCount?: number;
  phone?: string;
  website?: string;
  address?: string;
  lat?: number;
  lng?: number;
  hours?: Record<string, { open: string; close: string }>;
  photos?: string[];
} | null> {
  const url = `https://places.googleapis.com/v1/places/${placeId}`;

  const response = await fetch(url, {
    headers: {
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": [
        "rating",
        "userRatingCount",
        "nationalPhoneNumber",
        "internationalPhoneNumber",
        "websiteUri",
        "formattedAddress",
        "location",
        "currentOpeningHours",
        "photos",
      ].join(","),
    },
  });

  if (!response.ok) {
    console.error(`  Place details failed: ${response.status}`);
    return null;
  }

  const data = await response.json();

  // Parse opening hours
  let hours: Record<string, { open: string; close: string }> | undefined;
  if (data.currentOpeningHours?.periods) {
    const dayMap = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
    hours = {};
    for (const period of data.currentOpeningHours.periods) {
      const day = dayMap[period.open?.day || 0];
      if (day) {
        hours[day] = {
          open: `${String(period.open?.hour || 0).padStart(2, "0")}:${String(period.open?.minute || 0).padStart(2, "0")}`,
          close: `${String(period.close?.hour || 23).padStart(2, "0")}:${String(period.close?.minute || 59).padStart(2, "0")}`,
        };
      }
    }
  }

  return {
    rating: data.rating,
    reviewCount: data.userRatingCount,
    phone: data.internationalPhoneNumber || data.nationalPhoneNumber,
    website: data.websiteUri,
    address: data.formattedAddress,
    lat: data.location?.latitude,
    lng: data.location?.longitude,
    hours,
    photos: data.photos?.slice(0, 5).map((p: { name: string }) => p.name),
  };
}

/**
 * Enrich a batch of providers with Google Places data
 */
export async function enrichProviders(
  providers: ScrapedProvider[],
  apiKey: string,
  batchSize = 50,
  delayMs = 200
): Promise<EnrichedProvider[]> {
  console.log(`\n🔍 Google Places Enrichment — ${providers.length} providers\n`);

  const enriched: EnrichedProvider[] = [];
  const progressFile = path.join(PARSED_DIR, "google_enrichment_progress.json");

  let startIdx = 0;
  if (fs.existsSync(progressFile)) {
    const existing = JSON.parse(fs.readFileSync(progressFile, "utf-8"));
    enriched.push(...existing.enriched);
    startIdx = existing.lastIndex + 1;
    console.log(`  Resuming from index ${startIdx}`);
  }

  let searchCount = 0;
  let detailCount = 0;

  for (let i = startIdx; i < providers.length; i++) {
    const provider = providers[i];
    const cityName = CITY_NAME_MAP[provider.citySlug] || "UAE";

    console.log(`  [${i + 1}/${providers.length}] ${provider.name} (${cityName})`);

    // Step 1: Search for place_id
    const searchResult = await searchPlace(provider.name, cityName, apiKey);
    searchCount++;

    if (!searchResult) {
      enriched.push(provider);
      continue;
    }

    // Step 2: Get place details
    const details = await getPlaceDetails(searchResult.placeId, apiKey);
    detailCount++;

    enriched.push({
      ...provider,
      googlePlaceId: searchResult.placeId,
      googleRating: details?.rating,
      googleReviewCount: details?.reviewCount,
      formattedPhone: details?.phone || provider.phone,
      website: details?.website || provider.website,
      formattedAddress: details?.address || provider.address,
      latitude: details?.lat,
      longitude: details?.lng,
      operatingHours: details?.hours,
      googlePhotos: details?.photos,
    });

    // Rate limiting
    await new Promise((resolve) => setTimeout(resolve, delayMs));

    // Save progress every batchSize
    if (i % batchSize === 0 && i > 0) {
      fs.writeFileSync(
        progressFile,
        JSON.stringify({
          lastIndex: i,
          enriched,
          searchCount,
          detailCount,
          scrapedAt: new Date().toISOString(),
        })
      );
      console.log(
        `  Checkpoint: ${enriched.length} enriched (${searchCount} searches, ${detailCount} details)`
      );
    }
  }

  // Final save
  const outputFile = path.join(PARSED_DIR, "enriched_providers.json");
  fs.writeFileSync(outputFile, JSON.stringify(enriched, null, 2));
  console.log(
    `\n✅ Enrichment complete: ${enriched.length} providers`
  );
  console.log(
    `   API calls: ${searchCount} searches + ${detailCount} details = ${searchCount + detailCount} total`
  );
  console.log(
    `   Estimated cost: ~$${((searchCount + detailCount) * 0.017).toFixed(2)}`
  );

  return enriched;
}
