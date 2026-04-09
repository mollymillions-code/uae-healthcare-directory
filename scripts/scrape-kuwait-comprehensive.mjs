#!/usr/bin/env node
/**
 * Kuwait Comprehensive Healthcare Provider Scraper
 *
 * Sources:
 * 1. Overpass API (OpenStreetMap) — ALL healthcare facilities in Kuwait
 *    including hospitals, clinics, pharmacies, dentists, doctors, and
 *    any node/way tagged with healthcare=*
 * 2. Existing curated data from data/parsed/kuwait_providers.json
 *    (curated data takes priority for name/category)
 *
 * Output: data/parsed/kuwait_providers.json (overwrites)
 *
 * Usage:
 *   node scripts/scrape-kuwait-comprehensive.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(ROOT, "data", "parsed");
const OUTPUT_FILE = path.join(OUTPUT_DIR, "kuwait_providers.json");

// ── Kuwait City/Governorate Bounding Boxes ───────────────────────────────────
// Order: more specific / smaller areas first

const KUWAIT_CITIES = [
  {
    slug: "salmiya",
    name: "Salmiya",
    // Salmiya is within Hawalli governorate but important enough for its own slug
    latMin: 29.325, latMax: 29.350, lngMin: 48.060, lngMax: 48.090,
  },
  {
    slug: "mangaf",
    name: "Mangaf",
    // South of Kuwait City in Ahmadi governorate
    latMin: 29.06, latMax: 29.12, lngMin: 48.10, lngMax: 48.18,
  },
  {
    slug: "hawalli",
    name: "Hawalli",
    // Hawalli governorate: Hawalli, Mishref, Salwa, Bayan, Salmiya (wider)
    latMin: 29.28, latMax: 29.37, lngMin: 48.03, lngMax: 48.13,
  },
  {
    slug: "farwaniya",
    name: "Farwaniya",
    // Farwaniya governorate: Farwaniya, Khaitan, Jleeb, Fahaheel
    latMin: 29.22, latMax: 29.35, lngMin: 47.88, lngMax: 48.03,
  },
  {
    slug: "jahra",
    name: "Jahra",
    // Jahra governorate (northwest)
    latMin: 29.28, latMax: 29.70, lngMin: 47.30, lngMax: 47.90,
  },
  {
    slug: "ahmadi",
    name: "Ahmadi",
    // Ahmadi governorate (south): Ahmadi, Fahaheel, Fintas, Mangaf (wider)
    latMin: 28.50, latMax: 29.22, lngMin: 47.85, lngMax: 48.25,
  },
  {
    slug: "kuwait-city",
    name: "Kuwait City",
    // Capital area — broad fallback for central Kuwait
    latMin: 29.30, latMax: 29.44, lngMin: 47.88, lngMax: 48.06,
  },
];

const DEFAULT_CITY_SLUG = "kuwait-city";
const DEFAULT_CITY_NAME = "Kuwait City";

function resolveCity(lat, lng) {
  if (lat == null || lng == null) return { slug: DEFAULT_CITY_SLUG, name: DEFAULT_CITY_NAME };
  for (const city of KUWAIT_CITIES) {
    if (lat >= city.latMin && lat <= city.latMax && lng >= city.lngMin && lng <= city.lngMax) {
      return city;
    }
  }
  return { slug: DEFAULT_CITY_SLUG, name: DEFAULT_CITY_NAME };
}

// ── Category Mapping (same as Saudi) ─────────────────────────────────────────

function amenityToCategory(amenity, tags) {
  if (tags?.healthcare === "laboratory") return "labs-diagnostics";
  if (tags?.healthcare === "optometrist" || tags?.healthcare === "optician") return "optical-centers";
  if (tags?.healthcare === "rehabilitation" || tags?.healthcare === "physiotherapist") return "physiotherapy";
  if (tags?.healthcare === "pharmacy") return "pharmacy";
  if (tags?.healthcare === "dentist") return "dental";
  if (tags?.healthcare === "hospital") return "hospitals";
  if (tags?.healthcare === "clinic" || tags?.healthcare === "doctor") return "clinics";
  const map = {
    hospital: "hospitals",
    clinic: "clinics",
    doctors: "clinics",
    pharmacy: "pharmacy",
    dentist: "dental",
    optician: "optical-centers",
    veterinary: "veterinary",
    nursing_home: "nursing-homes",
  };
  return map[amenity] || "clinics";
}

function amenityToFacilityType(amenity, tags) {
  if (tags?.healthcare === "laboratory") return "Laboratory";
  if (tags?.healthcare === "rehabilitation") return "Rehabilitation Center";
  if (tags?.healthcare === "pharmacy") return "Pharmacy";
  if (tags?.healthcare === "dentist") return "Dental Clinic";
  if (tags?.healthcare === "optometrist" || tags?.healthcare === "optician") return "Optical Center";
  if (
    tags?.["operator:type"] === "government" ||
    tags?.operator?.toLowerCase()?.includes("ministry") ||
    tags?.operator?.toLowerCase()?.includes("moh")
  ) {
    return amenity === "hospital" ? "Government Hospital" : "Government Clinic";
  }
  const map = {
    hospital: "Hospital",
    clinic: "Medical Clinic",
    doctors: "Medical Clinic",
    pharmacy: "Pharmacy",
    dentist: "Dental Clinic",
    optician: "Optical Center",
  };
  return map[amenity] || "Healthcare Facility";
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Overpass API Fetch ────────────────────────────────────────────────────────

async function fetchOverpassBatch(queryParts, label, attempt = 0) {
  const query = `[out:json][timeout:120];
area["ISO3166-1"="KW"]->.kw;
(
  ${queryParts.join("\n  ")}
);
out body center;`;

  console.log(`  [Overpass] Fetching ${label}... (attempt ${attempt + 1})`);

  try {
    const resp = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(query)}`,
      signal: AbortSignal.timeout(180000),
    });

    if (resp.status === 429 || resp.status === 504) {
      if (attempt < 3) {
        const waitSec = (attempt + 1) * 30;
        console.log(`    Rate limited (${resp.status}), retrying in ${waitSec}s...`);
        await sleep(waitSec * 1000);
        return fetchOverpassBatch(queryParts, label, attempt + 1);
      }
      throw new Error(`Overpass API ${resp.status} after ${attempt + 1} attempts`);
    }

    if (!resp.ok) throw new Error(`Overpass API ${resp.status}`);
    const data = await resp.json();
    const elements = data.elements || [];
    console.log(`    ${label}: ${elements.length} elements`);
    return elements;
  } catch (err) {
    if (attempt < 2) {
      const waitSec = (attempt + 1) * 15;
      console.log(`    ${label} failed: ${err.message}. Retrying in ${waitSec}s...`);
      await sleep(waitSec * 1000);
      return fetchOverpassBatch(queryParts, label, attempt + 1);
    }
    console.error(`    ${label} FAILED after ${attempt + 1} attempts: ${err.message}`);
    return [];
  }
}

function parseOverpassElements(elements) {
  const results = [];
  for (const el of elements) {
    const lat = el.lat || el.center?.lat;
    const lng = el.lon || el.center?.lon;
    const tags = el.tags || {};
    const name = tags["name:en"] || tags.name || tags["name:ar"] || "";
    if (!name || !lat || !lng) continue;

    const amenity = tags.amenity || tags.healthcare || "clinic";
    const city = resolveCity(lat, lng);

    results.push({
      name: name.trim(),
      nameAr: (tags["name:ar"] || "").trim() || undefined,
      country: "kw",
      city: city.slug,
      cityName: city.name,
      category: amenityToCategory(amenity, tags),
      address:
        [tags["addr:street"], tags["addr:city"], tags["addr:postcode"]]
          .filter(Boolean)
          .join(", ") || undefined,
      phone: tags.phone || tags["contact:phone"] || undefined,
      website: tags.website || tags["contact:website"] || undefined,
      facilityType: amenityToFacilityType(amenity, tags),
      operatingHours: tags.opening_hours || undefined,
      lat,
      lng,
      source: "OSM/Overpass",
      osmId: `${el.type}/${el.id}`,
    });
  }
  return results;
}

async function fetchAllOverpass() {
  console.log("\n[1/3] Fetching Kuwait healthcare facilities from Overpass API...\n");

  // Split into batches to avoid timeout and rate limits
  const batches = [
    {
      label: "hospitals (nodes + ways)",
      parts: [
        'node["amenity"="hospital"](area.kw);',
        'way["amenity"="hospital"](area.kw);',
      ],
    },
    {
      label: "clinics + doctors (nodes + ways)",
      parts: [
        'node["amenity"="clinic"](area.kw);',
        'node["amenity"="doctors"](area.kw);',
        'way["amenity"="clinic"](area.kw);',
      ],
    },
    {
      label: "pharmacies (nodes + ways)",
      parts: [
        'node["amenity"="pharmacy"](area.kw);',
        'way["amenity"="pharmacy"](area.kw);',
      ],
    },
    {
      label: "dentists (nodes)",
      parts: [
        'node["amenity"="dentist"](area.kw);',
      ],
    },
    {
      label: "healthcare=* (all other healthcare tags)",
      parts: [
        'node["healthcare"](area.kw);',
        'way["healthcare"](area.kw);',
      ],
    },
  ];

  let allElements = [];
  for (let i = 0; i < batches.length; i++) {
    if (i > 0) {
      console.log(`  Waiting 30s before next batch...`);
      await sleep(30000);
    }
    const elements = await fetchOverpassBatch(batches[i].parts, batches[i].label);
    allElements.push(...elements);
  }

  // Deduplicate by OSM ID (same element may appear in multiple queries)
  const byOsmId = new Map();
  for (const el of allElements) {
    const id = `${el.type}/${el.id}`;
    if (!byOsmId.has(id)) {
      byOsmId.set(id, el);
    }
  }
  const uniqueElements = [...byOsmId.values()];
  console.log(`\n  Total unique OSM elements: ${uniqueElements.length}`);

  return parseOverpassElements(uniqueElements);
}

// ── Load Existing Curated Data ───────────────────────────────────────────────

function loadExistingCurated() {
  console.log("\n[2/3] Loading existing curated data...");
  try {
    const raw = fs.readFileSync(OUTPUT_FILE, "utf-8");
    const data = JSON.parse(raw);
    console.log(`  Loaded ${data.length} existing curated providers`);
    return data;
  } catch (err) {
    console.log(`  No existing data found (${err.message})`);
    return [];
  }
}

// ── Merge & Deduplicate ──────────────────────────────────────────────────────

function normalizeName(name) {
  return (name || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function mergeAndDedup(osmProviders, curatedProviders) {
  console.log("\n[3/3] Merging and deduplicating...");

  // Build a map of curated providers by normalized name for quick lookup
  const curatedByName = new Map();
  for (const p of curatedProviders) {
    const key = normalizeName(p.name);
    if (key) curatedByName.set(key, p);
  }

  // Start with all OSM providers
  const merged = new Map();

  for (const p of osmProviders) {
    const key = normalizeName(p.name);
    if (!key) continue;

    // Check if curated data has this provider (curated takes priority)
    const curated = curatedByName.get(key);
    if (curated) {
      // Merge: curated name/category take priority, OSM coordinates/details fill gaps
      merged.set(key, {
        name: curated.name || p.name,
        nameAr: p.nameAr || curated.nameAr,
        country: "kw",
        city: p.city || curated.city || DEFAULT_CITY_SLUG, // OSM coords more precise
        cityName: p.cityName || undefined,
        category: curated.category || p.category,
        address: curated.address ? curated.address : p.address,
        phone: curated.phone || p.phone,
        website: p.website || curated.website,
        facilityType: curated.facilityType || p.facilityType,
        operatingHours: p.operatingHours,
        lat: p.lat,
        lng: p.lng,
        source: `${curated.source || "curated"}/OSM`,
        osmId: p.osmId,
        beds: curated.beds || undefined,
      });
      curatedByName.delete(key); // Mark as matched
    } else {
      merged.set(key, p);
    }
  }

  // Add remaining curated providers that had no OSM match
  for (const [key, p] of curatedByName) {
    if (!merged.has(key)) {
      merged.set(key, {
        ...p,
        country: "kw",
        city: p.city || DEFAULT_CITY_SLUG,
      });
    }
  }

  let providers = [...merged.values()];

  // Proximity-based dedup: if two providers have very similar names
  // and are within 200m, keep the one with more data
  const toRemove = new Set();
  for (let i = 0; i < providers.length; i++) {
    if (toRemove.has(i)) continue;
    for (let j = i + 1; j < providers.length; j++) {
      if (toRemove.has(j)) continue;
      const a = providers[i];
      const b = providers[j];

      // Check name similarity (one is substring of the other)
      const na = normalizeName(a.name);
      const nb = normalizeName(b.name);
      const similar = na === nb || na.includes(nb) || nb.includes(na);
      if (!similar) continue;

      // Check proximity (within 200m)
      if (a.lat && a.lng && b.lat && b.lng) {
        const dist = haversineKm(a.lat, a.lng, b.lat, b.lng);
        if (dist > 0.2) continue; // More than 200m apart — different branches
      } else if (a.city !== b.city) {
        continue; // No coords and different cities — keep both
      }

      // Keep the one with more fields populated
      const aScore =
        (a.phone ? 1 : 0) + (a.address ? 1 : 0) + (a.website ? 1 : 0) + (a.lat ? 1 : 0);
      const bScore =
        (b.phone ? 1 : 0) + (b.address ? 1 : 0) + (b.website ? 1 : 0) + (b.lat ? 1 : 0);
      if (bScore > aScore) {
        toRemove.add(i);
      } else {
        toRemove.add(j);
      }
    }
  }

  if (toRemove.size > 0) {
    console.log(`  Removed ${toRemove.size} proximity duplicates`);
    providers = providers.filter((_, i) => !toRemove.has(i));
  }

  return providers;
}

// ── Clean Output ─────────────────────────────────────────────────────────────

// Normalize category slugs to match the directory's CATEGORIES constant
const CATEGORY_NORMALIZE = {
  pharmacies: "pharmacy",
  rehabilitation: "physiotherapy",
  "dental-clinics": "dental",
  "optical-centers": "optical",
  "labs-diagnostics": "labs-diagnostics",
  "nursing-homes": "nursing-homes",
};

function cleanForOutput(providers) {
  return providers.map((p) => {
    const out = {};
    for (const [k, v] of Object.entries(p)) {
      if (v !== undefined && v !== null && v !== "") out[k] = v;
    }
    // Ensure required fields
    out.country = "kw";
    if (!out.city) out.city = DEFAULT_CITY_SLUG;
    if (!out.category) out.category = "clinics";
    // Normalize category slug
    if (CATEGORY_NORMALIZE[out.category]) out.category = CATEGORY_NORMALIZE[out.category];
    if (!out.facilityType) out.facilityType = "Healthcare Facility";
    if (!out.source) out.source = "OSM/Overpass";
    return out;
  });
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("=== Kuwait Comprehensive Healthcare Provider Scraper ===\n");

  // Source 1: Overpass API (OSM)
  const osmProviders = await fetchAllOverpass();
  console.log(`  OSM providers (parsed): ${osmProviders.length}`);

  // Source 2: Existing curated data
  const curatedProviders = loadExistingCurated();

  // Merge (curated takes priority for name/category)
  const merged = mergeAndDedup(osmProviders, curatedProviders);
  console.log(`  After merge + dedup: ${merged.length}`);

  // Clean output
  const cleaned = cleanForOutput(merged);

  // Stats
  const byCat = {};
  const byCity = {};
  for (const p of cleaned) {
    byCat[p.category] = (byCat[p.category] || 0) + 1;
    byCity[p.city] = (byCity[p.city] || 0) + 1;
  }

  console.log("\n--- By Category ---");
  Object.entries(byCat)
    .sort((a, b) => b[1] - a[1])
    .forEach(([c, n]) => console.log(`  ${c}: ${n}`));

  console.log("\n--- By City ---");
  Object.entries(byCity)
    .sort((a, b) => b[1] - a[1])
    .forEach(([c, n]) => console.log(`  ${c}: ${n}`));

  // Write output
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(cleaned, null, 2));
  console.log(`\nWritten ${cleaned.length} providers to ${OUTPUT_FILE}`);
  console.log(`\nPrevious count: 177 → New count: ${cleaned.length}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
