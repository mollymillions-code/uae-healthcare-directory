#!/usr/bin/env node
/**
 * Comprehensive GCC Healthcare Facility Scraper — Google Places API
 *
 * Replaces OSM-based scrapers with richer data from Google Places.
 * Uses Text Search for discovery + Place Details for enrichment.
 *
 * Strategy:
 *   1. For each country/city, search for each healthcare facility type
 *   2. Paginate through all results (up to 60 per query via next_page_token)
 *   3. Enrich top providers (rating > 3.5 or reviews > 10) with Place Details
 *   4. Merge with existing JSON data, preserving license numbers etc.
 *   5. Deduplicate by Google Place ID + name similarity
 *
 * Usage:
 *   GOOGLE_PLACES_API_KEY=<key> node scripts/scrape-gcc-google-places.mjs
 *   GOOGLE_PLACES_API_KEY=<key> node scripts/scrape-gcc-google-places.mjs --country sa
 *   GOOGLE_PLACES_API_KEY=<key> node scripts/scrape-gcc-google-places.mjs --country sa --city riyadh
 *   GOOGLE_PLACES_API_KEY=<key> node scripts/scrape-gcc-google-places.mjs --dry-run
 *
 * Environment:
 *   GOOGLE_PLACES_API_KEY — required, read from env var only (NEVER hardcoded)
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import https from "https";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "..", "data", "parsed");

// ────────────────────────────── API Key ──────────────────────────────────────
const API_KEY = process.env.GOOGLE_PLACES_API_KEY;
if (!API_KEY) {
  console.error("ERROR: GOOGLE_PLACES_API_KEY environment variable is required.");
  console.error("Usage: GOOGLE_PLACES_API_KEY=<key> node scripts/scrape-gcc-google-places.mjs");
  process.exit(1);
}

// ────────────────────────────── CLI Flags ─────────────────────────────────────
const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const countryFlag = args.includes("--country") ? args[args.indexOf("--country") + 1] : null;
const cityFlag = args.includes("--city") ? args[args.indexOf("--city") + 1] : null;
const skipDetails = args.includes("--skip-details");

// ────────────────────────────── Rate Tracking ────────────────────────────────
let totalTextSearchRequests = 0;
let totalPlaceDetailsRequests = 0;
const TEXT_SEARCH_COST = 0.032;    // $ per request
const PLACE_DETAILS_COST = 0.017;  // $ per request

// ────────────────────────────── Country / City Definitions ────────────────────
// Order: SA (biggest market), QA, BH, KW
const COUNTRIES = {
  sa: {
    name: "Saudi Arabia",
    countryLabel: "Saudi Arabia",
    file: "saudi_providers.json",
    cities: [
      { slug: "riyadh",     name: "Riyadh",           lat: 24.7136, lng: 46.6753 },
      { slug: "jeddah",     name: "Jeddah",           lat: 21.4858, lng: 39.1925 },
      { slug: "mecca",      name: "Mecca",            lat: 21.3891, lng: 39.8579 },
      { slug: "medina",     name: "Medina",           lat: 24.4687, lng: 39.6142 },
      { slug: "dammam",     name: "Dammam",           lat: 26.3927, lng: 49.9777 },
      { slug: "khobar",     name: "Khobar",           lat: 26.2172, lng: 50.1971 },
      { slug: "dhahran",    name: "Dhahran",          lat: 26.2361, lng: 50.0393 },
      { slug: "tabuk",      name: "Tabuk",            lat: 28.3838, lng: 36.5550 },
      { slug: "abha",       name: "Abha",             lat: 18.2164, lng: 42.5053 },
      { slug: "taif",       name: "Taif",             lat: 21.2703, lng: 40.4158 },
      { slug: "buraidah",   name: "Buraidah",         lat: 26.3260, lng: 43.9750 },
      { slug: "hail",       name: "Hail",             lat: 27.5114, lng: 41.7208 },
      { slug: "jazan",      name: "Jazan",            lat: 16.8892, lng: 42.5700 },
      { slug: "najran",     name: "Najran",           lat: 17.4933, lng: 44.1277 },
      { slug: "al-ahsa",    name: "Al Ahsa",          lat: 25.3797, lng: 49.5866 },
      { slug: "al-kharj",   name: "Al Kharj",         lat: 24.1556, lng: 47.3120 },
      { slug: "yanbu",      name: "Yanbu",            lat: 24.0895, lng: 38.0618 },
      { slug: "al-jubail",  name: "Al Jubail",        lat: 27.0046, lng: 49.6225 },
      { slug: "khamis-mushait", name: "Khamis Mushait", lat: 18.3007, lng: 42.7297 },
    ],
  },
  qa: {
    name: "Qatar",
    countryLabel: "Qatar",
    file: "qatar_providers.json",
    cities: [
      { slug: "doha",       name: "Doha",             lat: 25.2855, lng: 51.5310 },
      { slug: "al-wakrah",  name: "Al Wakrah",        lat: 25.1659, lng: 51.5979 },
      { slug: "al-khor",    name: "Al Khor",          lat: 25.6804, lng: 51.4969 },
      { slug: "al-rayyan",  name: "Al Rayyan",        lat: 25.2919, lng: 51.4244 },
      { slug: "umm-salal",  name: "Umm Salal",        lat: 25.4085, lng: 51.3973 },
      { slug: "lusail",     name: "Lusail",           lat: 25.4300, lng: 51.4900 },
    ],
  },
  bh: {
    name: "Bahrain",
    countryLabel: "Bahrain",
    file: "bahrain_providers.json",
    cities: [
      { slug: "manama",     name: "Manama",           lat: 26.2235, lng: 50.5876 },
      { slug: "muharraq",   name: "Muharraq",         lat: 26.2572, lng: 50.6119 },
      { slug: "riffa",      name: "Riffa",            lat: 26.1300, lng: 50.5550 },
      { slug: "isa-town",   name: "Isa Town",         lat: 26.1736, lng: 50.5478 },
      { slug: "sitra",      name: "Sitra",            lat: 26.1547, lng: 50.6244 },
      { slug: "hamad-town", name: "Hamad Town",       lat: 26.1167, lng: 50.4833 },
      { slug: "budaiya",    name: "Budaiya",          lat: 26.2189, lng: 50.4500 },
    ],
  },
  kw: {
    name: "Kuwait",
    countryLabel: "Kuwait",
    file: "kuwait_providers.json",
    cities: [
      { slug: "kuwait-city", name: "Kuwait City",     lat: 29.3759, lng: 47.9774 },
      { slug: "hawalli",     name: "Hawalli",         lat: 29.3328, lng: 48.0286 },
      { slug: "salmiya",     name: "Salmiya",         lat: 29.3347, lng: 48.0758 },
      { slug: "farwaniya",   name: "Farwaniya",       lat: 29.2775, lng: 47.9581 },
      { slug: "jahra",       name: "Jahra",           lat: 29.3375, lng: 47.6581 },
      { slug: "ahmadi",      name: "Ahmadi",          lat: 29.0769, lng: 48.0839 },
      { slug: "mangaf",      name: "Mangaf",          lat: 29.0975, lng: 48.1286 },
    ],
  },
};

// ────────────────────────────── Search Queries ───────────────────────────────
// Each query type maps to a zavis category for fallback classification
const SEARCH_TYPES = [
  { query: "hospitals in {city}, {country}",              fallbackCategory: "hospitals" },
  { query: "medical clinics in {city}, {country}",        fallbackCategory: "clinics" },
  { query: "pharmacies in {city}, {country}",             fallbackCategory: "pharmacy" },
  { query: "dentists in {city}, {country}",               fallbackCategory: "dental" },
  { query: "medical laboratories in {city}, {country}",   fallbackCategory: "labs-diagnostics" },
  { query: "eye clinics in {city}, {country}",            fallbackCategory: "optical" },
  { query: "dermatology clinics in {city}, {country}",    fallbackCategory: "clinics" },
];

// ────────────────────────────── Category Mapping ─────────────────────────────
function mapGoogleTypesToCategory(types, fallback) {
  if (!types || !Array.isArray(types)) return fallback || "clinics";

  const typeSet = new Set(types.map((t) => t.toLowerCase()));

  if (typeSet.has("hospital"))                           return "hospitals";
  if (typeSet.has("pharmacy"))                           return "pharmacy";
  if (typeSet.has("dentist"))                            return "dental";
  if (typeSet.has("physiotherapist"))                    return "clinics";
  if (typeSet.has("doctor") || typeSet.has("health"))    return "clinics";

  // Check for lab/diagnostic in type strings
  for (const t of types) {
    const lower = t.toLowerCase();
    if (lower.includes("lab") || lower.includes("diagnostic")) return "labs-diagnostics";
  }

  return fallback || "clinics";
}

// ────────────────────────────── Facility Type Inference ───────────────────────
function inferFacilityType(category, types) {
  const map = {
    hospitals:          "hospital",
    clinics:            "clinic",
    pharmacy:           "pharmacy",
    dental:             "dental_clinic",
    "labs-diagnostics": "laboratory",
    optical:            "eye_clinic",
  };
  return map[category] || "healthcare_facility";
}

// ────────────────────────────── HTTP Helpers ──────────────────────────────────
function httpsGet(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { timeout: 15000 }, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`JSON parse error: ${e.message} — body: ${data.slice(0, 200)}`));
        }
      });
    });
    req.on("error", reject);
    req.on("timeout", () => { req.destroy(); reject(new Error("Request timed out")); });
  });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ────────────────────────────── Text Search ──────────────────────────────────
/**
 * Performs a Google Places Text Search and paginates through all pages.
 * Returns up to 60 results (20 per page x 3 pages).
 */
async function textSearch(query, lat, lng, radius = 30000) {
  const results = [];
  let pageToken = null;
  let page = 1;
  const maxPages = 3;

  while (page <= maxPages) {
    let url = `https://maps.googleapis.com/maps/api/place/textsearch/json`
      + `?query=${encodeURIComponent(query)}`
      + `&location=${lat},${lng}`
      + `&radius=${radius}`
      + `&key=${API_KEY}`;

    if (pageToken) {
      url = `https://maps.googleapis.com/maps/api/place/textsearch/json`
        + `?pagetoken=${pageToken}`
        + `&key=${API_KEY}`;
    }

    if (DRY_RUN) {
      console.log(`  [DRY RUN] Would fetch: ${query} (page ${page})`);
      break;
    }

    try {
      totalTextSearchRequests++;
      const data = await httpsGet(url);

      if (data.status === "OK" && data.results) {
        results.push(...data.results);
      } else if (data.status === "ZERO_RESULTS") {
        break;
      } else if (data.status === "OVER_QUERY_LIMIT") {
        console.error("  RATE LIMIT HIT — waiting 60s...");
        await sleep(60000);
        continue; // retry same page
      } else if (data.status === "REQUEST_DENIED") {
        console.error(`  REQUEST DENIED: ${data.error_message || "Check API key"}`);
        break;
      } else {
        console.warn(`  Unexpected status: ${data.status} — ${data.error_message || ""}`);
        break;
      }

      // Check for next page
      if (data.next_page_token && page < maxPages) {
        pageToken = data.next_page_token;
        page++;
        // Google requires a delay before the next_page_token becomes valid
        await sleep(2000);
      } else {
        break;
      }
    } catch (err) {
      console.error(`  Error fetching page ${page}: ${err.message}`);
      break;
    }

    // Rate limiting: 200ms between requests (10 QPS limit)
    await sleep(200);
  }

  return { results, pages: page };
}

// ────────────────────────────── Place Details ────────────────────────────────
/**
 * Fetches detailed information for a place by its place_id.
 * Only called for top providers (rating > 3.5 or reviews > 10).
 */
async function getPlaceDetails(placeId) {
  const fields = [
    "formatted_phone_number",
    "international_phone_number",
    "website",
    "reviews",
    "opening_hours",
  ].join(",");

  const url = `https://maps.googleapis.com/maps/api/place/details/json`
    + `?place_id=${encodeURIComponent(placeId)}`
    + `&fields=${fields}`
    + `&key=${API_KEY}`;

  if (DRY_RUN) return null;

  try {
    totalPlaceDetailsRequests++;
    const data = await httpsGet(url);

    if (data.status === "OK" && data.result) {
      return data.result;
    } else if (data.status === "OVER_QUERY_LIMIT") {
      console.error("  Place Details RATE LIMIT — waiting 60s...");
      await sleep(60000);
      // retry once
      totalPlaceDetailsRequests++;
      const retry = await httpsGet(url);
      if (retry.status === "OK" && retry.result) return retry.result;
    }
  } catch (err) {
    console.error(`  Place Details error for ${placeId}: ${err.message}`);
  }

  return null;
}

// ────────────────────────────── Name Similarity ──────────────────────────────
/** Jaccard similarity on word sets (lowercased, stripped of punctuation) */
function jaccardSimilarity(a, b) {
  const tokenize = (s) =>
    new Set(
      s
        .toLowerCase()
        .replace(/[^\w\s]/g, "")
        .split(/\s+/)
        .filter((w) => w.length > 1)
    );
  const setA = tokenize(a);
  const setB = tokenize(b);
  if (setA.size === 0 && setB.size === 0) return 1;
  if (setA.size === 0 || setB.size === 0) return 0;

  let intersection = 0;
  for (const w of setA) {
    if (setB.has(w)) intersection++;
  }
  return intersection / (setA.size + setB.size - intersection);
}

// ────────────────────────────── Haversine Distance ───────────────────────────
function haversineM(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ────────────────────────────── Transform Result ─────────────────────────────
/**
 * Transforms a Google Places Text Search result into our provider format.
 */
function transformResult(result, country, citySlug, cityName, fallbackCategory) {
  const category = mapGoogleTypesToCategory(result.types, fallbackCategory);

  return {
    name: result.name || "Unknown",
    nameAr: null,
    country,
    city: citySlug,
    cityName,
    category,
    address: result.formatted_address || null,
    phone: null,  // filled by Place Details
    email: null,
    website: null, // filled by Place Details
    googlePlaceId: result.place_id || null,
    googleRating: result.rating || null,
    googleReviewCount: result.user_ratings_total || 0,
    latitude: result.geometry?.location?.lat || null,
    longitude: result.geometry?.location?.lng || null,
    services: [],
    insurance: [],
    operatingHours: null,  // filled by Place Details
    reviewSummary: [],     // filled by Place Details
    // Do not put Google photo_reference values in the public photos field.
    // Provider renderers expect dereferenceable URLs only; refs belong in
    // google_photo_url or gallery_photos after an upload-time R2 transform.
    googlePhotoUrl: result.photos?.[0]?.photo_reference || null,
    photos: [],
    facilityType: inferFacilityType(category, result.types),
    source: "Google Places",
    licenseNumber: null,
    status: result.business_status === "OPERATIONAL" ? "active"
          : result.business_status === "CLOSED_TEMPORARILY" ? "temporarily_closed"
          : result.business_status === "CLOSED_PERMANENTLY" ? "closed"
          : "active",
  };
}

// ────────────────────────────── Enrich with Details ──────────────────────────
/**
 * Enriches a provider record with Place Details data.
 */
function enrichWithDetails(provider, details) {
  if (!details) return provider;

  provider.phone =
    details.international_phone_number ||
    details.formatted_phone_number ||
    provider.phone;

  provider.website = details.website || provider.website;

  // Operating hours
  if (details.opening_hours?.weekday_text) {
    const hours = {};
    for (const line of details.opening_hours.weekday_text) {
      // Format: "Monday: 9:00 AM – 5:00 PM"
      const colonIdx = line.indexOf(":");
      if (colonIdx > 0) {
        const day = line.slice(0, colonIdx).trim();
        const time = line.slice(colonIdx + 1).trim();
        hours[day] = time;
      }
    }
    if (Object.keys(hours).length > 0) {
      provider.operatingHours = hours;
    }
  }

  // Review summaries (first 5 review texts, truncated)
  if (details.reviews?.length) {
    provider.reviewSummary = details.reviews
      .slice(0, 5)
      .map((r) => r.text?.slice(0, 200) || "")
      .filter((t) => t.length > 10);
  }

  return provider;
}

// ────────────────────────────── Merge with Existing ──────────────────────────
/**
 * Merges new Google Places data with existing JSON data.
 * For matching providers (same city + name similarity > 0.7):
 *   - Keep Google Places data (richer)
 *   - Preserve license numbers and fields that Google doesn't have
 */
function mergeWithExisting(existingProviders, newProviders, countryCode) {
  // Index new providers by placeId for fast lookup
  const byPlaceId = new Map();
  for (const p of newProviders) {
    if (p.googlePlaceId) byPlaceId.set(p.googlePlaceId, p);
  }

  // Index existing providers that have placeId (from previous runs)
  const existingByPlaceId = new Map();
  for (const p of existingProviders) {
    if (p.googlePlaceId) existingByPlaceId.set(p.googlePlaceId, p);
  }

  const merged = [];
  const usedExistingIndices = new Set();

  // First pass: add all new providers, merging with existing where matched
  for (const newP of newProviders) {
    // Skip non-operational
    if (newP.status === "closed") continue;

    // Check if this placeId already exists in existing data
    if (newP.googlePlaceId && existingByPlaceId.has(newP.googlePlaceId)) {
      const existing = existingByPlaceId.get(newP.googlePlaceId);
      // Google data is richer, but preserve existing fields Google doesn't have
      newP.licenseNumber = existing.licenseNumber || newP.licenseNumber;
      newP.email = existing.email || newP.email;
      newP.nameAr = existing.nameAr || newP.nameAr;
      if (existing.osmId) newP.osmId = existing.osmId;
      merged.push(newP);
      continue;
    }

    // Try to find a match in existing data by name similarity + city
    let bestMatch = null;
    let bestScore = 0;
    let bestIdx = -1;

    for (let i = 0; i < existingProviders.length; i++) {
      if (usedExistingIndices.has(i)) continue;
      const existing = existingProviders[i];

      // Same city check (relaxed: check if slugs match or both are in the same city area)
      const sameCity = existing.city === newP.city;
      if (!sameCity) continue;

      const similarity = jaccardSimilarity(existing.name, newP.name);
      if (similarity > bestScore) {
        bestScore = similarity;
        bestMatch = existing;
        bestIdx = i;
      }
    }

    if (bestScore > 0.7 && bestMatch) {
      // Merge: prefer Google data but preserve existing unique fields
      newP.licenseNumber = bestMatch.licenseNumber || newP.licenseNumber;
      newP.email = bestMatch.email || newP.email;
      newP.nameAr = bestMatch.nameAr || newP.nameAr;
      if (bestMatch.osmId) newP.osmId = bestMatch.osmId;
      // Keep existing phone if Google doesn't have one
      if (!newP.phone && bestMatch.phone) newP.phone = bestMatch.phone;
      usedExistingIndices.add(bestIdx);
      merged.push(newP);
    } else {
      merged.push(newP);
    }
  }

  // Second pass: add existing providers that weren't matched (preserves NHRA/MOH/OSM data)
  for (let i = 0; i < existingProviders.length; i++) {
    if (usedExistingIndices.has(i)) continue;
    merged.push(existingProviders[i]);
  }

  return merged;
}

// ────────────────────────────── Dedup by Place ID + Proximity ────────────────
/**
 * Removes duplicates found across different search queries.
 * Two entries are considered duplicates if:
 *   - Same googlePlaceId, OR
 *   - Same city + name similarity > 0.85 + within 200m
 */
function dedup(providers) {
  const seen = new Map(); // placeId -> provider
  const unique = [];

  for (const p of providers) {
    // Dedup by placeId
    if (p.googlePlaceId) {
      if (seen.has(p.googlePlaceId)) {
        // Keep the one with more data (higher review count or rating)
        const existing = seen.get(p.googlePlaceId);
        if ((p.googleReviewCount || 0) > (existing.googleReviewCount || 0)) {
          // Replace in unique array
          const idx = unique.indexOf(existing);
          if (idx >= 0) unique[idx] = p;
          seen.set(p.googlePlaceId, p);
        }
        continue;
      }
      seen.set(p.googlePlaceId, p);
    }

    // Dedup by name similarity + proximity (for non-Google entries merged in)
    let isDup = false;
    for (const u of unique) {
      if (u.city !== p.city) continue;

      const nameSim = jaccardSimilarity(u.name, p.name);
      if (nameSim < 0.85) continue;

      // Check proximity if both have coordinates
      if (u.latitude && u.longitude && p.latitude && p.longitude) {
        const dist = haversineM(
          u.latitude, u.longitude,
          p.latitude, p.longitude
        );
        if (dist < 200) {
          isDup = true;
          // Keep the richer record
          if ((p.googlePlaceId && !u.googlePlaceId) ||
              (p.googleReviewCount || 0) > (u.googleReviewCount || 0)) {
            const idx = unique.indexOf(u);
            if (idx >= 0) unique[idx] = p;
          }
          break;
        }
      } else if (nameSim > 0.95) {
        // No coordinates but very high name similarity — still a dup
        isDup = true;
        if (p.googlePlaceId && !u.googlePlaceId) {
          const idx = unique.indexOf(u);
          if (idx >= 0) unique[idx] = p;
        }
        break;
      }
    }

    if (!isDup) {
      unique.push(p);
    }
  }

  return unique;
}

// ────────────────────────────── Find Nearest City ────────────────────────────
/**
 * Given a lat/lng and a list of city definitions, return the nearest city slug.
 * Used when Google returns results outside the expected city.
 */
function findNearestCity(lat, lng, cities) {
  let bestDist = Infinity;
  let bestCity = cities[0];
  for (const city of cities) {
    const d = haversineM(lat, lng, city.lat, city.lng);
    if (d < bestDist) {
      bestDist = d;
      bestCity = city;
    }
  }
  return bestCity;
}

// ────────────────────────────── Main Scraper ─────────────────────────────────
async function scrapeCountry(countryCode, countryDef) {
  const outFile = path.join(DATA_DIR, countryDef.file);
  const countryName = countryDef.name;
  const cities = countryDef.cities;

  console.log(`\n${"=".repeat(70)}`);
  console.log(`  SCRAPING: ${countryName.toUpperCase()} (${countryCode})`);
  console.log(`${"=".repeat(70)}\n`);

  // ── Resume support: check if output file has > 100 Google Places entries ──
  let existingProviders = [];
  if (fs.existsSync(outFile)) {
    try {
      existingProviders = JSON.parse(fs.readFileSync(outFile, "utf8"));
      const googleCount = existingProviders.filter(
        (p) => p.source === "Google Places"
      ).length;
      if (googleCount > 100) {
        console.log(
          `  SKIPPING ${countryName} — already has ${googleCount} Google Places entries.`
        );
        console.log(`  (Delete ${countryDef.file} or remove Google Places entries to re-scrape)\n`);
        return { providers: existingProviders, skipped: true };
      }
      console.log(
        `  Loaded ${existingProviders.length} existing providers (${
          existingProviders.filter((p) => p.source === "Google Places").length
        } from Google Places)`
      );
    } catch {
      console.log(`  No valid existing data found — starting fresh`);
    }
  }

  // ── Scrape each city x type ──
  const allNewProviders = [];
  let cityIdx = 0;

  const filteredCities = cityFlag
    ? cities.filter((c) => c.slug === cityFlag)
    : cities;

  if (cityFlag && filteredCities.length === 0) {
    console.error(`  City '${cityFlag}' not found for ${countryName}`);
    return { providers: existingProviders, skipped: true };
  }

  for (const city of filteredCities) {
    cityIdx++;
    console.log(
      `\n  [${cityIdx}/${filteredCities.length}] ${city.name} (${city.slug})`
    );
    console.log(`  ${"─".repeat(50)}`);

    for (const searchType of SEARCH_TYPES) {
      const query = searchType.query
        .replace("{city}", city.name)
        .replace("{country}", countryDef.countryLabel);

      const { results, pages } = await textSearch(
        query,
        city.lat,
        city.lng,
        30000 // 30km radius
      );

      // Filter: only OPERATIONAL businesses
      const operational = results.filter(
        (r) => !r.business_status || r.business_status === "OPERATIONAL"
      );

      console.log(
        `  [${countryCode.toUpperCase()}] [${city.name}] [${searchType.fallbackCategory}] — Found ${operational.length} results (${pages} page${pages > 1 ? "s" : ""})`
      );

      // Transform each result
      for (const result of operational) {
        // Assign to nearest city (Google may return results from nearby cities)
        const resultLat = result.geometry?.location?.lat;
        const resultLng = result.geometry?.location?.lng;
        let assignedCity = city;
        if (resultLat && resultLng) {
          assignedCity = findNearestCity(resultLat, resultLng, cities);
        }

        const provider = transformResult(
          result,
          countryCode,
          assignedCity.slug,
          assignedCity.name,
          searchType.fallbackCategory
        );
        allNewProviders.push(provider);
      }

      // Rate limiting between queries
      await sleep(200);
    }
  }

  // ── Dedup new results (cross-query duplicates) ──
  console.log(`\n  Deduplicating ${allNewProviders.length} raw results...`);
  const dedupedNew = dedup(allNewProviders);
  console.log(`  After dedup: ${dedupedNew.length} unique providers`);

  // ── Enrich top providers with Place Details ──
  if (!skipDetails) {
    const enrichCandidates = dedupedNew.filter(
      (p) =>
        p.googlePlaceId &&
        ((p.googleRating && p.googleRating > 3.5) ||
          (p.googleReviewCount && p.googleReviewCount > 10))
    );

    console.log(
      `\n  Enriching ${enrichCandidates.length} top providers with Place Details...`
    );

    let enriched = 0;
    for (const provider of enrichCandidates) {
      const details = await getPlaceDetails(provider.googlePlaceId);
      if (details) {
        enrichWithDetails(provider, details);
        enriched++;
      }

      // Progress every 50
      if (enriched > 0 && enriched % 50 === 0) {
        console.log(`    Enriched ${enriched}/${enrichCandidates.length}...`);
      }

      // Rate limiting
      await sleep(200);
    }

    console.log(`  Enriched ${enriched} providers with details`);
  } else {
    console.log(`  Skipping Place Details (--skip-details flag)`);
  }

  // ── Merge with existing data ──
  console.log(`\n  Merging with ${existingProviders.length} existing providers...`);
  const merged = mergeWithExisting(existingProviders, dedupedNew, countryCode);
  const finalDeduped = dedup(merged);

  console.log(`  Final count: ${finalDeduped.length} providers`);

  // ── Category breakdown ──
  const catCounts = {};
  for (const p of finalDeduped) {
    catCounts[p.category] = (catCounts[p.category] || 0) + 1;
  }
  console.log(`\n  Category breakdown:`);
  for (const [cat, count] of Object.entries(catCounts).sort(
    (a, b) => b[1] - a[1]
  )) {
    console.log(`    ${cat}: ${count}`);
  }

  // ── Source breakdown ──
  const srcCounts = {};
  for (const p of finalDeduped) {
    srcCounts[p.source || "unknown"] = (srcCounts[p.source || "unknown"] || 0) + 1;
  }
  console.log(`\n  Source breakdown:`);
  for (const [src, count] of Object.entries(srcCounts).sort(
    (a, b) => b[1] - a[1]
  )) {
    console.log(`    ${src}: ${count}`);
  }

  // ── City breakdown ──
  const cityCounts = {};
  for (const p of finalDeduped) {
    cityCounts[p.city] = (cityCounts[p.city] || 0) + 1;
  }
  console.log(`\n  City breakdown:`);
  for (const [c, count] of Object.entries(cityCounts).sort(
    (a, b) => b[1] - a[1]
  )) {
    console.log(`    ${c}: ${count}`);
  }

  // ── Write output ──
  if (!DRY_RUN) {
    // Ensure data directory exists
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(outFile, JSON.stringify(finalDeduped, null, 2));
    console.log(`\n  Written to: ${outFile}`);
  } else {
    console.log(`\n  [DRY RUN] Would write to: ${outFile}`);
  }

  return { providers: finalDeduped, skipped: false };
}

// ────────────────────────────── Main Entry Point ─────────────────────────────
async function main() {
  const startTime = Date.now();

  console.log(`\nGoogle Places API — GCC Healthcare Facility Scraper`);
  console.log(`${"─".repeat(52)}`);
  console.log(`API Key: ${API_KEY.slice(0, 10)}...${API_KEY.slice(-4)}`);
  console.log(`Mode: ${DRY_RUN ? "DRY RUN (no API calls)" : "LIVE"}`);
  if (countryFlag) console.log(`Country filter: ${countryFlag}`);
  if (cityFlag) console.log(`City filter: ${cityFlag}`);
  if (skipDetails) console.log(`Place Details: SKIPPED`);
  console.log(`Output dir: ${DATA_DIR}\n`);

  const totalStats = { countries: 0, providers: 0, skipped: 0 };

  // Process countries in order: SA, QA, BH, KW
  const countriesToProcess = countryFlag
    ? { [countryFlag]: COUNTRIES[countryFlag] }
    : COUNTRIES;

  if (countryFlag && !COUNTRIES[countryFlag]) {
    console.error(
      `Unknown country: ${countryFlag}. Valid: ${Object.keys(COUNTRIES).join(", ")}`
    );
    process.exit(1);
  }

  for (const [code, def] of Object.entries(countriesToProcess)) {
    try {
      const result = await scrapeCountry(code, def);
      totalStats.countries++;
      totalStats.providers += result.providers.length;
      if (result.skipped) totalStats.skipped++;
    } catch (err) {
      console.error(`\nFATAL ERROR scraping ${def.name}: ${err.message}`);
      console.error(err.stack);
    }
  }

  // ── Final Report ──
  const elapsedMin = ((Date.now() - startTime) / 60000).toFixed(1);

  console.log(`\n${"=".repeat(70)}`);
  console.log(`  SCRAPING COMPLETE`);
  console.log(`${"=".repeat(70)}\n`);
  console.log(`  Duration:          ${elapsedMin} minutes`);
  console.log(`  Countries:         ${totalStats.countries} (${totalStats.skipped} skipped)`);
  console.log(`  Total providers:   ${totalStats.providers}`);
  console.log();
  console.log(`  ── API Cost Estimate ──`);
  console.log(`  Text Search requests:    ${totalTextSearchRequests}  @ $${TEXT_SEARCH_COST}/req = $${(totalTextSearchRequests * TEXT_SEARCH_COST).toFixed(2)}`);
  console.log(`  Place Details requests:  ${totalPlaceDetailsRequests}  @ $${PLACE_DETAILS_COST}/req = $${(totalPlaceDetailsRequests * PLACE_DETAILS_COST).toFixed(2)}`);
  const totalCost =
    totalTextSearchRequests * TEXT_SEARCH_COST +
    totalPlaceDetailsRequests * PLACE_DETAILS_COST;
  console.log(`  ─────────────────────────────────────────────`);
  console.log(`  Total estimated cost:    $${totalCost.toFixed(2)}`);
  console.log();
}

main().catch((err) => {
  console.error(`\nUnhandled error: ${err.message}`);
  console.error(err.stack);
  process.exit(1);
});
