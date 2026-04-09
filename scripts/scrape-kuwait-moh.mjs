#!/usr/bin/env node
/**
 * Kuwait Healthcare Provider Scraper
 *
 * Sources:
 *   1. Wikipedia — List of hospitals in Kuwait (public + private tables)
 *   2. Overpass API (OpenStreetMap) — hospitals, clinics, pharmacies, dentists
 *
 * Merges, deduplicates, maps to Kuwait governorate cities, and outputs
 * data/parsed/kuwait_providers.json
 *
 * Usage:
 *   node scripts/scrape-kuwait-moh.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(ROOT, "data", "parsed");
const OUTPUT_FILE = path.join(OUTPUT_DIR, "kuwait_providers.json");

// ── Kuwait Governorate Bounding Boxes ───────────────────────────────────────
// Used to map lat/lon → city slug. Order matters: more specific first.

const GOVERNORATES = [
  {
    slug: "hawalli",
    name: "Hawalli",
    // Includes Salmiya, Hawalli, Mishref, Salwa, Bayan
    minLat: 29.30, maxLat: 29.36, minLon: 48.03, maxLon: 48.12,
  },
  {
    slug: "salmiya",
    name: "Salmiya",
    // Salmiya is within Hawalli governorate but gets its own slug
    minLat: 29.325, maxLat: 29.345, minLon: 48.06, maxLon: 48.09,
  },
  {
    slug: "farwaniya",
    name: "Farwaniya",
    minLat: 29.25, maxLat: 29.35, minLon: 47.90, maxLon: 48.03,
  },
  {
    slug: "jahra",
    name: "Jahra",
    minLat: 29.30, maxLat: 29.70, minLon: 47.50, maxLon: 47.90,
  },
  {
    slug: "ahmadi",
    name: "Ahmadi",
    minLat: 28.50, maxLat: 29.25, minLon: 47.85, maxLon: 48.20,
  },
  {
    slug: "kuwait-city",
    name: "Kuwait City",
    // Capital area — broad fallback for central Kuwait
    minLat: 29.30, maxLat: 29.42, minLon: 47.90, maxLon: 48.06,
  },
];

// Fallback city for anything that doesn't match bounding boxes
const DEFAULT_CITY = "kuwait-city";

function coordsToCity(lat, lon) {
  if (lat == null || lon == null) return DEFAULT_CITY;
  // Check Salmiya first (subset of Hawalli)
  const salmiya = GOVERNORATES.find((g) => g.slug === "salmiya");
  if (
    lat >= salmiya.minLat && lat <= salmiya.maxLat &&
    lon >= salmiya.minLon && lon <= salmiya.maxLon
  ) return "salmiya";

  for (const g of GOVERNORATES) {
    if (g.slug === "salmiya") continue;
    if (
      lat >= g.minLat && lat <= g.maxLat &&
      lon >= g.minLon && lon <= g.maxLon
    ) return g.slug;
  }
  return DEFAULT_CITY;
}

// ── OSM amenity → category mapping ──────────────────────────────────────────

const AMENITY_TO_CATEGORY = {
  hospital: "hospitals",
  clinic: "clinics",
  pharmacy: "pharmacies",
  dentist: "dentists",
};

const AMENITY_TO_FACILITY = {
  hospital: "Hospital",
  clinic: "Clinic",
  pharmacy: "Pharmacy",
  dentist: "Dental Clinic",
};

// ── Hardcoded Wikipedia fallback (in case of rate limiting) ─────────────────
// Source: https://en.wikipedia.org/wiki/List_of_hospitals_in_Kuwait (verified 2026-04-07)

const WIKI_HOSPITALS = [
  { name: "Al Razi Hospital", facilityType: "Government Hospital" },
  { name: "Al Sabah Hospital", facilityType: "Government Hospital" },
  { name: "Amiri Hospital", facilityType: "Government Hospital" },
  { name: "Adan Hospital", facilityType: "Government Hospital" },
  { name: "Mubarak Al-Kabeer Hospital", facilityType: "Government Hospital" },
  { name: "Farwaniya Hospital", facilityType: "Government Hospital" },
  { name: "Jahra Hospital", facilityType: "Government Hospital" },
  { name: "Ibn Sina Hospital", facilityType: "Government Hospital" },
  { name: "Babtain Burn Center", facilityType: "Government Hospital" },
  { name: "Hamad Organ Transplant Center", facilityType: "Government Hospital" },
  { name: "Nefesi Nephrology Center", facilityType: "Government Hospital" },
  { name: "NBK Children Hospital", facilityType: "Government Hospital" },
  { name: "Kuwait Cancer Control Center", facilityType: "Government Hospital" },
  { name: "Military Hospital", facilityType: "Military Hospital" },
  { name: "Al Ahmadi Hospital", facilityType: "Government Hospital" },
  { name: "Zain ENT Hospital", facilityType: "Government Hospital" },
  { name: "Sheikh Jaber Al-Ahmad Hospital", facilityType: "Government Hospital" },
];

// ── Fetch helpers ───────────────────────────────────────────────────────────

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function fetchWithRetry(url, options = {}, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options);
      if (res.status === 429 || res.status === 504) {
        const wait = (i + 1) * 5000;
        console.log(`    Retrying in ${wait / 1000}s (HTTP ${res.status})...`);
        await sleep(wait);
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      return res;
    } catch (err) {
      if (i === retries - 1) throw err;
      await sleep((i + 1) * 3000);
    }
  }
}

async function fetchJSON(url) {
  const res = await fetchWithRetry(url);
  return res.json();
}

async function fetchHTML(url) {
  const res = await fetchWithRetry(url, {
    headers: {
      "User-Agent": "ZavisBot/1.0 (https://zavis.ai; healthcare directory research)",
      "Accept": "text/html",
    },
  });
  return res.text();
}

// ── Source 1: Wikipedia ─────────────────────────────────────────────────────

function parseWikiTables(html) {
  const providers = [];

  // Find all wikitable instances
  const tableRegex = /<table[^>]*class="[^"]*wikitable[^"]*"[^>]*>([\s\S]*?)<\/table>/gi;
  let tableMatch;

  while ((tableMatch = tableRegex.exec(html)) !== null) {
    const tableHTML = tableMatch[1];

    // Determine if this is public or private by checking preceding heading
    const beforeTable = html.substring(Math.max(0, tableMatch.index - 500), tableMatch.index);
    const isPrivate = /private/i.test(beforeTable);
    const facilityType = isPrivate ? "Private Hospital" : "Government Hospital";

    // Parse rows
    const rowRegex = /<tr>([\s\S]*?)<\/tr>/gi;
    let rowMatch;
    let isHeader = true;

    while ((rowMatch = rowRegex.exec(tableHTML)) !== null) {
      if (isHeader) { isHeader = false; continue; }

      const cellRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
      const cells = [];
      let cellMatch;
      while ((cellMatch = cellRegex.exec(rowMatch[1])) !== null) {
        // Strip HTML tags and clean whitespace
        const text = cellMatch[1]
          .replace(/<[^>]+>/g, "")
          .replace(/&#\d+;/g, "")
          .replace(/&amp;/g, "&")
          .replace(/&nbsp;/g, " ")
          .replace(/\[\d+\]/g, "") // remove citation refs like [1]
          .trim();
        cells.push(text);
      }

      if (cells.length < 1 || !cells[0]) continue;

      const name = cells[0];
      // Some tables have: Name, Location, Beds or Name, Beds
      const beds = cells.find((c) => /^\d+$/.test(c.replace(/,/g, "")));

      providers.push({
        name,
        country: "kw",
        city: DEFAULT_CITY, // Wikipedia doesn't give precise locations
        category: "hospitals",
        address: "",
        phone: "",
        facilityType,
        source: "Wikipedia",
        beds: beds ? parseInt(beds.replace(/,/g, ""), 10) : null,
        lat: null,
        lon: null,
      });
    }
  }

  return providers;
}

async function fetchWikipedia() {
  console.log("Fetching Wikipedia hospitals list...");
  try {
    const html = await fetchHTML(
      "https://en.wikipedia.org/wiki/List_of_hospitals_in_Kuwait"
    );
    const providers = parseWikiTables(html);
    if (providers.length > 0) {
      console.log(`  Found ${providers.length} hospitals from Wikipedia (live)`);
      return providers;
    }
    // Parsing may fail on markup changes — fall through to hardcoded
    console.log("  Live parse returned 0, using hardcoded fallback...");
  } catch (err) {
    console.log(`  Wikipedia fetch failed (${err.message}), using hardcoded fallback...`);
  }

  // Fallback to hardcoded list
  const providers = WIKI_HOSPITALS.map((h) => ({
    name: h.name,
    country: "kw",
    city: DEFAULT_CITY,
    category: "hospitals",
    address: "",
    phone: "",
    facilityType: h.facilityType,
    source: "Wikipedia",
    beds: null,
    lat: null,
    lon: null,
  }));
  console.log(`  Using ${providers.length} hospitals from hardcoded Wikipedia data`);
  return providers;
}

// ── Source 2: Overpass API (OpenStreetMap) ───────────────────────────────────

async function fetchOSM() {
  console.log("Fetching OSM data via Overpass API...");
  const query = `[out:json];area["ISO3166-1"="KW"]->.kw;(node["amenity"="hospital"](area.kw);node["amenity"="clinic"](area.kw);node["amenity"="pharmacy"](area.kw);node["amenity"="dentist"](area.kw););out body;`;
  const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;

  try {
    const data = await fetchJSON(url);
    const elements = data.elements || [];
    console.log(`  Found ${elements.length} elements from OSM`);

    return elements.map((el) => {
      const amenity = el.tags?.amenity || "clinic";
      const name =
        el.tags?.["name:en"] || el.tags?.name || el.tags?.["name:ar"] || "Unknown";
      const phone = el.tags?.phone || el.tags?.["contact:phone"] || "";
      const addr = [
        el.tags?.["addr:street"],
        el.tags?.["addr:city"],
        el.tags?.["addr:postcode"],
      ]
        .filter(Boolean)
        .join(", ");

      return {
        name,
        country: "kw",
        city: coordsToCity(el.lat, el.lon),
        category: AMENITY_TO_CATEGORY[amenity] || "clinics",
        address: addr,
        phone: phone.startsWith("+") ? phone : phone ? `+965${phone.replace(/\D/g, "")}` : "",
        facilityType: AMENITY_TO_FACILITY[amenity] || "Clinic",
        source: "OSM",
        beds: null,
        lat: el.lat,
        lon: el.lon,
      };
    });
  } catch (err) {
    console.error(`  OSM fetch failed: ${err.message}`);
    return [];
  }
}

// ── Merge & Deduplicate ─────────────────────────────────────────────────────

function normalize(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function dedup(providers) {
  const seen = new Map();

  for (const p of providers) {
    const key = normalize(p.name);
    if (!key) continue;

    if (seen.has(key)) {
      // Merge: prefer the one with more data
      const existing = seen.get(key);
      // Prefer coordinates
      if (!existing.lat && p.lat) {
        existing.lat = p.lat;
        existing.lon = p.lon;
        existing.city = p.city; // use coord-based city
      }
      if (!existing.address && p.address) existing.address = p.address;
      if (!existing.phone && p.phone) existing.phone = p.phone;
      if (!existing.beds && p.beds) existing.beds = p.beds;
      // Merge sources
      if (!existing.source.includes(p.source)) {
        existing.source += `/${p.source}`;
      }
    } else {
      seen.set(key, { ...p });
    }
  }

  return [...seen.values()];
}

// ── Clean output (remove internal fields) ───────────────────────────────────

function cleanForOutput(providers) {
  return providers.map(({ lat, lon, beds, ...rest }) => {
    const out = { ...rest };
    if (beds) out.beds = beds;
    // Remove empty strings
    if (!out.address) delete out.address;
    if (!out.phone) delete out.phone;
    return out;
  });
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("Kuwait Healthcare Provider Scraper\n");

  const [wikiProviders, osmProviders] = await Promise.all([
    fetchWikipedia(),
    fetchOSM(),
  ]);

  const all = [...wikiProviders, ...osmProviders];
  console.log(`\nTotal raw: ${all.length}`);

  const merged = dedup(all);
  console.log(`After dedup: ${merged.length}`);

  // Stats by category
  const byCat = {};
  const byCity = {};
  for (const p of merged) {
    byCat[p.category] = (byCat[p.category] || 0) + 1;
    byCity[p.city] = (byCity[p.city] || 0) + 1;
  }
  console.log("\nBy category:", byCat);
  console.log("By city:", byCity);

  const output = cleanForOutput(merged);

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
  console.log(`\nWrote ${output.length} providers to ${OUTPUT_FILE}`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
