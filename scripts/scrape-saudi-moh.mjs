#!/usr/bin/env node
/**
 * Saudi Arabia Healthcare Provider Scraper
 *
 * Sources (in priority order):
 * 1. HDX (Humanitarian Data Exchange) — OSM export of Saudi health facilities
 * 2. Overpass API — direct OpenStreetMap query for Saudi health facilities
 * 3. MOH directory — noted for manual follow-up (JS-rendered SharePoint)
 *
 * Output: data/parsed/saudi_providers.json
 */

import { writeFileSync, mkdirSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = resolve(__dirname, "../data/parsed/saudi_providers.json");

// ---------------------------------------------------------------------------
// Saudi city bounding boxes (lat/lng)
// ---------------------------------------------------------------------------
const SAUDI_CITIES = [
  { slug: "riyadh",   name: "Riyadh",   latMin: 24.50, latMax: 24.95, lngMin: 46.50, lngMax: 46.95 },
  { slug: "jeddah",   name: "Jeddah",   latMin: 21.35, latMax: 21.75, lngMin: 39.05, lngMax: 39.35 },
  { slug: "mecca",    name: "Mecca",     latMin: 21.35, latMax: 21.50, lngMin: 39.75, lngMax: 39.95 },
  { slug: "medina",   name: "Medina",    latMin: 24.35, latMax: 24.55, lngMin: 39.50, lngMax: 39.75 },
  { slug: "dammam",   name: "Dammam",    latMin: 26.35, latMax: 26.55, lngMin: 49.95, lngMax: 50.20 },
  { slug: "khobar",   name: "Khobar",    latMin: 26.15, latMax: 26.40, lngMin: 50.15, lngMax: 50.30 },
  { slug: "dhahran",  name: "Dhahran",   latMin: 26.25, latMax: 26.35, lngMin: 50.05, lngMax: 50.20 },
  { slug: "tabuk",    name: "Tabuk",     latMin: 28.30, latMax: 28.50, lngMin: 36.50, lngMax: 36.70 },
  { slug: "taif",     name: "Taif",      latMin: 21.20, latMax: 21.35, lngMin: 40.40, lngMax: 40.60 },
  { slug: "abha",     name: "Abha",      latMin: 18.15, latMax: 18.30, lngMin: 42.45, lngMax: 42.60 },
  { slug: "khamis-mushait", name: "Khamis Mushait", latMin: 18.25, latMax: 18.40, lngMin: 42.65, lngMax: 42.80 },
  { slug: "hail",     name: "Hail",      latMin: 27.48, latMax: 27.58, lngMin: 41.65, lngMax: 41.80 },
  { slug: "najran",   name: "Najran",    latMin: 17.45, latMax: 17.60, lngMin: 44.15, lngMax: 44.35 },
  { slug: "jubail",   name: "Jubail",    latMin: 26.90, latMax: 27.10, lngMin: 49.55, lngMax: 49.75 },
  { slug: "yanbu",    name: "Yanbu",     latMin: 24.00, latMax: 24.15, lngMin: 38.00, lngMax: 38.15 },
  { slug: "buraidah", name: "Buraidah",  latMin: 26.25, latMax: 26.45, lngMin: 43.90, lngMax: 44.10 },
  { slug: "al-ahsa",  name: "Al Ahsa",   latMin: 25.30, latMax: 25.50, lngMin: 49.50, lngMax: 49.75 },
];

// ---------------------------------------------------------------------------
// Amenity → category mapping
// ---------------------------------------------------------------------------
function amenityToCategory(amenity) {
  const map = {
    hospital: "hospitals",
    clinic: "clinics",
    doctors: "clinics",
    pharmacy: "pharmacies",
    dentist: "dental-clinics",
    optician: "optical-centers",
    veterinary: "veterinary",
    nursing_home: "nursing-homes",
  };
  return map[amenity] || "clinics";
}

function amenityToFacilityType(amenity, tags) {
  if (tags?.healthcare === "laboratory") return "Laboratory";
  if (tags?.["operator:type"] === "government" || tags?.operator?.toLowerCase()?.includes("ministry"))
    return "Government Hospital";
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

// ---------------------------------------------------------------------------
// City resolver from lat/lng
// ---------------------------------------------------------------------------
function resolveCity(lat, lng) {
  for (const city of SAUDI_CITIES) {
    if (lat >= city.latMin && lat <= city.latMax && lng >= city.lngMin && lng <= city.lngMax) {
      return city;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Source 1: HDX API
// ---------------------------------------------------------------------------
async function fetchHDX() {
  console.log("[HDX] Fetching dataset metadata...");
  const metaUrl = "https://data.humdata.org/api/3/action/package_show?id=hotosm_sau_health_facilities";
  const resp = await fetch(metaUrl, {
    signal: AbortSignal.timeout(15000),
    headers: { "User-Agent": "Zavis-Healthcare-Scraper/1.0 (zavis.ai)" },
  });
  if (!resp.ok) throw new Error(`HDX metadata ${resp.status}`);
  const meta = await resp.json();

  if (!meta.success || !meta.result?.resources?.length) {
    throw new Error("HDX: no resources found");
  }

  // Find GeoJSON or CSV resource
  const resources = meta.result.resources;
  const geojson = resources.find(r =>
    r.format?.toLowerCase() === "geojson" || r.url?.endsWith(".geojson")
  );
  const csv = resources.find(r =>
    r.format?.toLowerCase() === "csv" || r.url?.endsWith(".csv")
  );
  const target = geojson || csv;

  if (!target) {
    console.log("[HDX] Available formats:", resources.map(r => `${r.format} (${r.name})`).join(", "));
    throw new Error("HDX: no GeoJSON or CSV resource");
  }

  console.log(`[HDX] Downloading ${target.format}: ${target.name} (${target.url})`);
  const dataResp = await fetch(target.url, {
    signal: AbortSignal.timeout(60000),
    headers: { "User-Agent": "Zavis-Healthcare-Scraper/1.0 (zavis.ai)" },
  });
  if (!dataResp.ok) throw new Error(`HDX download ${dataResp.status}`);

  if (target.format?.toLowerCase() === "geojson" || target.url?.endsWith(".geojson")) {
    const gj = await dataResp.json();
    return parseGeoJSON(gj, "HDX/OSM");
  } else {
    const text = await dataResp.text();
    return parseCSV(text, "HDX/OSM");
  }
}

function parseGeoJSON(gj, source) {
  const features = gj.features || [];
  console.log(`[${source}] Parsing ${features.length} GeoJSON features...`);
  const results = [];

  for (const f of features) {
    const props = f.properties || {};
    const coords = f.geometry?.coordinates;
    if (!coords) continue;

    const lng = coords[0];
    const lat = coords[1];
    const name = props.name || props["name:en"] || props["name:ar"] || "";
    if (!name) continue;

    const amenity = props.amenity || props.healthcare || "clinic";
    const city = resolveCity(lat, lng);

    results.push({
      name: name.trim(),
      nameAr: (props["name:ar"] || "").trim() || undefined,
      country: "sa",
      city: city?.slug || "other",
      cityName: city?.name || "Other",
      category: amenityToCategory(amenity),
      address: [props["addr:street"], props["addr:city"], props["addr:postcode"]].filter(Boolean).join(", ") || undefined,
      phone: props.phone || props["contact:phone"] || undefined,
      website: props.website || props["contact:website"] || undefined,
      facilityType: amenityToFacilityType(amenity, props),
      lat,
      lng,
      source,
      osmId: f.id || props["@id"] || undefined,
    });
  }
  return results;
}

function parseCSV(text, source) {
  const lines = text.split("\n").filter(l => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
  console.log(`[${source}] Parsing ${lines.length - 1} CSV rows. Headers: ${headers.slice(0, 10).join(", ")}...`);

  const results = [];
  for (let i = 1; i < lines.length; i++) {
    // Simple CSV parse (handles quoted fields)
    const row = parseCSVLine(lines[i]);
    const obj = {};
    headers.forEach((h, idx) => { obj[h] = row[idx] || ""; });

    const lat = parseFloat(obj.latitude || obj.lat || obj.Y || "");
    const lng = parseFloat(obj.longitude || obj.lon || obj.lng || obj.X || "");
    const name = obj.name || obj["name:en"] || "";
    if (!name || isNaN(lat) || isNaN(lng)) continue;

    const amenity = obj.amenity || obj.healthcare || "clinic";
    const city = resolveCity(lat, lng);

    results.push({
      name: name.trim(),
      nameAr: (obj["name:ar"] || "").trim() || undefined,
      country: "sa",
      city: city?.slug || "other",
      cityName: city?.name || "Other",
      category: amenityToCategory(amenity),
      address: [obj["addr:street"], obj["addr:city"]].filter(Boolean).join(", ") || undefined,
      phone: obj.phone || undefined,
      website: obj.website || undefined,
      facilityType: amenityToFacilityType(amenity, obj),
      lat, lng,
      source,
    });
  }
  return results;
}

function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (const ch of line) {
    if (ch === '"') { inQuotes = !inQuotes; }
    else if (ch === "," && !inQuotes) { result.push(current.trim()); current = ""; }
    else { current += ch; }
  }
  result.push(current.trim());
  return result;
}

// ---------------------------------------------------------------------------
// Source 2: Overpass API (OpenStreetMap)
// ---------------------------------------------------------------------------
async function fetchOverpassBatch(amenities, label) {
  const amenityFilter = amenities
    .map(a => `node["amenity"="${a}"](area.sa);way["amenity"="${a}"](area.sa);`)
    .join("\n  ");
  const query = `[out:json][timeout:180];
area["ISO3166-1"="SA"]->.sa;
(
  ${amenityFilter}
);
out body center;`;

  console.log(`[Overpass] Fetching ${label}...`);
  const resp = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `data=${encodeURIComponent(query)}`,
    signal: AbortSignal.timeout(240000),
  });

  if (!resp.ok) throw new Error(`Overpass API ${resp.status} for ${label}`);
  const data = await resp.json();
  return data.elements || [];
}

async function fetchOverpass() {
  console.log("[Overpass] Querying Saudi health facilities in batches...");

  // Split into batches to avoid timeout
  const batches = [
    { amenities: ["hospital"], label: "hospitals" },
    { amenities: ["clinic", "doctors"], label: "clinics" },
    { amenities: ["pharmacy"], label: "pharmacies" },
    { amenities: ["dentist"], label: "dentists" },
  ];

  const sleep = ms => new Promise(r => setTimeout(r, ms));
  let allElements = [];
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    if (i > 0) {
      console.log(`[Overpass]   Waiting 15s to avoid rate limit...`);
      await sleep(15000);
    }
    // Retry once on 429/504
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const elements = await fetchOverpassBatch(batch.amenities, batch.label);
        console.log(`[Overpass]   ${batch.label}: ${elements.length} elements`);
        allElements.push(...elements);
        break;
      } catch (err) {
        console.log(`[Overpass]   ${batch.label} attempt ${attempt + 1} failed: ${err.message}`);
        if (attempt === 0) { console.log(`[Overpass]   Retrying in 30s...`); await sleep(30000); }
      }
    }
  }

  const elements = allElements;
  console.log(`[Overpass] Got ${elements.length} total elements`);

  const results = [];
  for (const el of elements) {
    const lat = el.lat || el.center?.lat;
    const lng = el.lon || el.center?.lon;
    const tags = el.tags || {};
    const name = tags.name || tags["name:en"] || tags["name:ar"] || "";
    if (!name || !lat || !lng) continue;

    const amenity = tags.amenity || tags.healthcare || "clinic";
    const city = resolveCity(lat, lng);

    results.push({
      name: name.trim(),
      nameAr: (tags["name:ar"] || "").trim() || undefined,
      country: "sa",
      city: city?.slug || "other",
      cityName: city?.name || "Other",
      category: amenityToCategory(amenity),
      address: [tags["addr:street"], tags["addr:city"], tags["addr:postcode"]].filter(Boolean).join(", ") || undefined,
      phone: tags.phone || tags["contact:phone"] || undefined,
      website: tags.website || tags["contact:website"] || undefined,
      facilityType: amenityToFacilityType(amenity, tags),
      operatingHours: tags.opening_hours || undefined,
      lat, lng,
      source: "OSM/Overpass",
      osmId: `${el.type}/${el.id}`,
    });
  }
  return results;
}

// ---------------------------------------------------------------------------
// Deduplicate by name+city
// ---------------------------------------------------------------------------
function deduplicate(providers) {
  const seen = new Map();
  for (const p of providers) {
    const key = `${p.name.toLowerCase().replace(/\s+/g, " ")}|${p.city}`;
    if (!seen.has(key)) {
      seen.set(key, p);
    } else {
      // Merge: keep the one with more data
      const existing = seen.get(key);
      if (!existing.phone && p.phone) existing.phone = p.phone;
      if (!existing.website && p.website) existing.website = p.website;
      if (!existing.address && p.address) existing.address = p.address;
      if (!existing.nameAr && p.nameAr) existing.nameAr = p.nameAr;
    }
  }
  return [...seen.values()];
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log("=== Saudi Arabia Healthcare Provider Scraper ===\n");

  let providers = [];

  // Try HDX first
  try {
    const hdxData = await fetchHDX();
    console.log(`[HDX] Got ${hdxData.length} providers\n`);
    providers.push(...hdxData);
  } catch (err) {
    console.log(`[HDX] Failed: ${err.message}\n`);
  }

  // Always try Overpass for additional coverage
  try {
    const overpassData = await fetchOverpass();
    console.log(`[Overpass] Got ${overpassData.length} providers\n`);
    providers.push(...overpassData);
  } catch (err) {
    console.log(`[Overpass] Failed: ${err.message}\n`);
  }

  if (providers.length === 0) {
    console.error("ERROR: No data from any source. Exiting.");
    process.exit(1);
  }

  // Deduplicate
  const deduped = deduplicate(providers);
  console.log(`Total after dedup: ${deduped.length}`);

  // Clean up undefined fields
  const cleaned = deduped.map(p => {
    const out = {};
    for (const [k, v] of Object.entries(p)) {
      if (v !== undefined && v !== "") out[k] = v;
    }
    return out;
  });

  // Stats
  const cityStats = {};
  const catStats = {};
  for (const p of cleaned) {
    cityStats[p.city] = (cityStats[p.city] || 0) + 1;
    catStats[p.category] = (catStats[p.category] || 0) + 1;
  }
  console.log("\n--- By City ---");
  Object.entries(cityStats).sort((a, b) => b[1] - a[1]).forEach(([c, n]) => console.log(`  ${c}: ${n}`));
  console.log("\n--- By Category ---");
  Object.entries(catStats).sort((a, b) => b[1] - a[1]).forEach(([c, n]) => console.log(`  ${c}: ${n}`));

  // Write output
  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, JSON.stringify(cleaned, null, 2));
  console.log(`\nWritten ${cleaned.length} providers to ${OUTPUT_PATH}`);

  // Note about MOH
  console.log("\n--- Note ---");
  console.log("MOH directory (moh.gov.sa) is SharePoint/JS-rendered and requires browser automation.");
  console.log("For manual scraping, visit: https://www.moh.gov.sa/en/eServices/Directory/Pages/Hospitals.aspx");
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
