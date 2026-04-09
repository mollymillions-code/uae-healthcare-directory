#!/usr/bin/env node
/**
 * Comprehensive Bahrain healthcare provider scraper.
 *
 * Augments the existing NHRA data (hospitals + pharmacies) with OSM Overpass
 * data to fill category gaps: clinics, dental, labs-diagnostics, and more
 * hospitals/pharmacies that NHRA may have missed.
 *
 * Strategy:
 *   1. Load existing NHRA data from bahrain_providers.json (license numbers, emails, phones)
 *   2. Query Overpass API for ALL healthcare facilities in Bahrain
 *   3. Merge: when an OSM entry matches an NHRA entry (name similarity + proximity or city),
 *      merge fields (OSM provides coordinates, NHRA provides license/phone/email)
 *   4. Dedup by name + proximity (200m threshold — Bahrain is dense)
 *   5. Map cities via bounding boxes
 *   6. Output merged dataset to bahrain_providers.json
 *
 * Usage: node scripts/scrape-bahrain-comprehensive.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import https from "https";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "..", "data", "parsed");
const OUT_FILE = path.join(DATA_DIR, "bahrain_providers.json");

// ─────────────────────────── City Bounding Boxes ───────────────────────────
// Bahrain is ~765 km² — tight boxes work fine.
// Format: [south, west, north, east] (lat/lon)
const CITY_BOXES = {
  manama:      { slug: "manama",      bounds: [26.19, 50.55, 26.25, 50.62] },
  muharraq:    { slug: "muharraq",    bounds: [26.23, 50.60, 26.30, 50.67] },
  riffa:       { slug: "riffa",       bounds: [26.08, 50.52, 26.16, 50.58] },
  "isa-town":  { slug: "isa-town",    bounds: [26.15, 50.52, 26.19, 50.56] },
  sitra:       { slug: "sitra",       bounds: [26.11, 50.58, 26.18, 50.64] },
  "hamad-town":{ slug: "hamad-town",  bounds: [26.10, 50.46, 26.16, 50.52] },
  budaiya:     { slug: "budaiya",     bounds: [26.19, 50.43, 26.24, 50.52] },
  // Additional areas that appear in NHRA data
  hidd:        { slug: "hidd",        bounds: [26.21, 50.63, 26.25, 50.67] },
  jidhafs:     { slug: "jidhafs",     bounds: [26.19, 50.52, 26.22, 50.56] },
  tubli:       { slug: "tubli",       bounds: [26.17, 50.55, 26.20, 50.58] },
  sanabis:     { slug: "sanabis",     bounds: [26.21, 50.51, 26.23, 50.55] },
  aali:        { slug: "aali",        bounds: [26.15, 50.53, 26.18, 50.56] },
  saar:        { slug: "saar",        bounds: [26.17, 50.48, 26.20, 50.52] },
  zinj:        { slug: "zinj",        bounds: [26.20, 50.56, 26.22, 50.58] },
  adliya:      { slug: "adliya",      bounds: [26.21, 50.58, 26.23, 50.60] },
};

// ─────────────────────────── Category Mapping ───────────────────────────
function mapOsmCategory(tags) {
  const amenity = (tags.amenity || "").toLowerCase();
  const healthcare = (tags.healthcare || "").toLowerCase();

  if (amenity === "hospital") return "hospitals";
  if (amenity === "dentist") return "dental";
  if (amenity === "pharmacy") return "pharmacy";
  if (amenity === "clinic" || amenity === "doctors") return "clinics";

  // healthcare=* tag
  if (healthcare === "hospital") return "hospitals";
  if (healthcare === "dentist" || healthcare === "dental") return "dental";
  if (healthcare === "pharmacy") return "pharmacy";
  if (healthcare === "laboratory") return "labs-diagnostics";
  if (healthcare === "centre" || healthcare === "clinic" || healthcare === "doctor" || healthcare === "doctors") return "clinics";
  if (healthcare === "optometrist") return "optical";
  if (healthcare === "alternative" || healthcare === "physiotherapist") return "clinics";

  // Fallback: if any healthcare tag is set, assume clinic
  if (healthcare) return "clinics";
  return "clinics";
}

// ─────────────────────────── Helpers ───────────────────────────

/** Haversine distance in meters */
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

/** Assign a city slug based on coordinates falling in bounding boxes */
function assignCity(lat, lon) {
  if (!lat || !lon) return "manama"; // fallback
  for (const [, city] of Object.entries(CITY_BOXES)) {
    const [s, w, n, e] = city.bounds;
    if (lat >= s && lat <= n && lon >= w && lon <= e) return city.slug;
  }
  // Fallback: assign to nearest city center
  const centers = {
    manama:       [26.22, 50.58],
    muharraq:     [26.26, 50.63],
    riffa:        [26.12, 50.55],
    "isa-town":   [26.17, 50.54],
    sitra:        [26.15, 50.61],
    "hamad-town": [26.13, 50.49],
    budaiya:      [26.22, 50.47],
  };
  let nearest = "manama";
  let minDist = Infinity;
  for (const [slug, [clat, clon]] of Object.entries(centers)) {
    const d = haversineM(lat, lon, clat, clon);
    if (d < minDist) {
      minDist = d;
      nearest = slug;
    }
  }
  return nearest;
}

/** Assign city from NHRA address string (no coordinates) */
function assignCityFromAddress(address) {
  if (!address) return "manama";
  const l = address.toLowerCase();
  if (l.includes("muharraq")) return "muharraq";
  if (l.includes("riffa") || l.includes("buhair")) return "riffa";
  if (l.includes("isa town") || l.includes("isa city")) return "isa-town";
  if (l.includes("hamad town") || l.includes("hamad city") || l.includes("hamad")) return "hamad-town";
  if (l.includes("sitra")) return "sitra";
  if (l.includes("budaiya") || l.includes("budaya")) return "budaiya";
  if (l.includes("hidd")) return "hidd";
  if (l.includes("jidhafs") || l.includes("jidhaf") || l.includes("jid hafs")) return "jidhafs";
  if (l.includes("tubli")) return "tubli";
  if (l.includes("sanabis")) return "sanabis";
  if (l.includes("aali")) return "aali";
  if (l.includes("saar")) return "saar";
  if (l.includes("zinj")) return "zinj";
  if (l.includes("adliya")) return "adliya";
  if (l.includes("manama") || l.includes("salmaniya") || l.includes("fateh") || l.includes("suqayyah")) return "manama";
  return "manama";
}

/** Normalize a name for comparison */
function normalizeName(name) {
  return (name || "")
    .toLowerCase()
    .replace(/\bw\.?l\.?l\.?\b/gi, "")
    .replace(/\bs\.?p\.?c\.?\b/gi, "")
    .replace(/\b(pvt|private|ltd|llc|co|company|est|establishment)\b/gi, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Compute similarity ratio (0-1) between two normalized strings */
function similarity(a, b) {
  if (!a || !b) return 0;
  // Jaccard on word tokens
  const wordsA = new Set(a.split(" ").filter(Boolean));
  const wordsB = new Set(b.split(" ").filter(Boolean));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  let intersect = 0;
  for (const w of wordsA) if (wordsB.has(w)) intersect++;
  const union = new Set([...wordsA, ...wordsB]).size;
  return intersect / union;
}

/** Normalize phone to +973XXXXXXXX */
function normalizePhone(phone) {
  if (!phone) return "";
  let cleaned = String(phone).replace(/[^\d+]/g, "");
  if (cleaned.startsWith("00973")) cleaned = "+" + cleaned.slice(2);
  if (cleaned.startsWith("973") && !cleaned.startsWith("+")) cleaned = "+" + cleaned;
  if (!cleaned.startsWith("+973") && /^\d{8}$/.test(cleaned)) cleaned = "+973" + cleaned;
  return cleaned || "";
}

// ─────────────────────────── Overpass API ───────────────────────────

function fetchOverpass(query) {
  return new Promise((resolve, reject) => {
    const postData = `data=${encodeURIComponent(query)}`;
    const options = {
      hostname: "overpass-api.de",
      port: 443,
      path: "/api/interpreter",
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(postData),
        "User-Agent": "ZavisHealthcareDirectory/1.0 (https://zavis.ai)",
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        if (res.statusCode !== 200) {
          return reject(new Error(`Overpass HTTP ${res.statusCode}: ${data.slice(0, 500)}`));
        }
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Overpass JSON parse error: ${e.message}`));
        }
      });
    });

    req.on("error", reject);
    req.setTimeout(180000, () => {
      req.destroy();
      reject(new Error("Overpass request timed out (180s)"));
    });
    req.write(postData);
    req.end();
  });
}

// ─────────────────────────── Main Pipeline ───────────────────────────

async function main() {
  console.log("=== Bahrain Comprehensive Healthcare Provider Scraper ===\n");

  // ── Step 1: Load existing NHRA data ──
  console.log("Step 1: Loading existing NHRA data...");
  let nhraProviders = [];
  if (fs.existsSync(OUT_FILE)) {
    nhraProviders = JSON.parse(fs.readFileSync(OUT_FILE, "utf8"));
    console.log(`  Loaded ${nhraProviders.length} existing NHRA records`);
    const byCat = {};
    for (const p of nhraProviders) byCat[p.category] = (byCat[p.category] || 0) + 1;
    console.log(`  Existing categories: ${JSON.stringify(byCat)}`);
  } else {
    console.log("  No existing file found. Starting fresh.");
  }

  // ── Step 2: Query Overpass API ──
  console.log("\nStep 2: Querying Overpass API for all Bahrain healthcare facilities...");

  const overpassQuery = `
[out:json][timeout:120];
area["ISO3166-1"="BH"]->.bh;
(
  node["amenity"="hospital"](area.bh);
  node["amenity"="clinic"](area.bh);
  node["amenity"="pharmacy"](area.bh);
  node["amenity"="dentist"](area.bh);
  node["amenity"="doctors"](area.bh);
  node["healthcare"](area.bh);
  way["amenity"="hospital"](area.bh);
  way["amenity"="clinic"](area.bh);
  way["amenity"="pharmacy"](area.bh);
  way["amenity"="dentist"](area.bh);
  way["amenity"="doctors"](area.bh);
  way["healthcare"](area.bh);
);
out body center;
`;

  let osmData;
  try {
    osmData = await fetchOverpass(overpassQuery);
    console.log(`  Overpass returned ${osmData.elements?.length || 0} elements`);
  } catch (err) {
    console.error(`  Overpass query failed: ${err.message}`);
    console.log("  Falling back to NHRA data only.");
    osmData = { elements: [] };
  }

  // ── Step 3: Parse OSM elements into providers ──
  console.log("\nStep 3: Parsing OSM elements...");

  const osmProviders = [];
  const skipped = { noName: 0, duplicate: 0 };
  const osmSeen = new Set(); // track OSM IDs to avoid duplicates from overlapping queries

  for (const el of osmData.elements || []) {
    const id = `${el.type}/${el.id}`;
    if (osmSeen.has(id)) {
      skipped.duplicate++;
      continue;
    }
    osmSeen.add(id);

    const tags = el.tags || {};
    // Get name — prefer name:en, then name, then fallback
    const name = tags["name:en"] || tags.name || "";
    if (!name || name.length < 2) {
      skipped.noName++;
      continue;
    }

    // Get coordinates (center for ways)
    const lat = el.center?.lat || el.lat || null;
    const lon = el.center?.lon || el.lon || null;

    const category = mapOsmCategory(tags);
    const city = assignCity(lat, lon);

    // Build address from OSM tags
    const addrParts = [];
    if (tags["addr:housenumber"]) addrParts.push(`Building ${tags["addr:housenumber"]}`);
    if (tags["addr:street"]) addrParts.push(tags["addr:street"]);
    if (tags["addr:city"]) addrParts.push(tags["addr:city"]);
    const address = addrParts.join(", ") || "";

    const phone = normalizePhone(tags.phone || tags["contact:phone"] || "");
    const email = (tags.email || tags["contact:email"] || "").toLowerCase();
    const website = tags.website || tags["contact:website"] || "";

    // Healthcare-specific tags
    const openingHours = tags.opening_hours || "";
    const operator = tags.operator || "";

    osmProviders.push({
      osmId: id,
      name: name.trim(),
      country: "bh",
      city,
      category,
      address,
      phone,
      email,
      website,
      lat,
      lon,
      openingHours,
      operator,
      source: "OSM",
    });
  }

  console.log(`  Parsed ${osmProviders.length} named OSM providers`);
  console.log(`  Skipped: ${skipped.noName} with no name, ${skipped.duplicate} OSM duplicates`);

  const osmByCat = {};
  for (const p of osmProviders) osmByCat[p.category] = (osmByCat[p.category] || 0) + 1;
  console.log(`  OSM categories: ${JSON.stringify(osmByCat)}`);

  // ── Step 4: Merge OSM with NHRA ──
  console.log("\nStep 4: Merging OSM data with NHRA data...");

  // Index NHRA providers by normalized name for fast lookup
  const nhraByNorm = new Map();
  for (const p of nhraProviders) {
    const norm = normalizeName(p.name);
    if (!nhraByNorm.has(norm)) nhraByNorm.set(norm, []);
    nhraByNorm.get(norm).push({ ...p, _matched: false });
  }

  const merged = [];
  let mergeCount = 0;
  let osmNewCount = 0;

  for (const osm of osmProviders) {
    const osmNorm = normalizeName(osm.name);

    // Try exact normalized match first
    let bestMatch = null;
    let bestScore = 0;

    for (const [nhraNorm, nhraList] of nhraByNorm) {
      const sim = similarity(osmNorm, nhraNorm);
      if (sim > bestScore) {
        // Find an unmatched NHRA entry in this group
        const unmatched = nhraList.find((p) => !p._matched);
        if (unmatched) {
          bestScore = sim;
          bestMatch = unmatched;
        }
      }
    }

    if (bestMatch && bestScore >= 0.6) {
      // Merge: NHRA data takes priority for license/phone/email, OSM provides coords
      bestMatch._matched = true;
      mergeCount++;
      merged.push({
        name: bestMatch.name, // keep NHRA name (usually cleaner)
        country: "bh",
        city: osm.lat ? assignCity(osm.lat, osm.lon) : bestMatch.city,
        category: bestMatch.category || osm.category,
        address: bestMatch.address || osm.address,
        phone: bestMatch.phone || osm.phone,
        email: bestMatch.email || osm.email,
        licenseNumber: bestMatch.licenseNumber || "",
        facilityType: bestMatch.facilityType || "",
        source: "NHRA+OSM",
        lat: osm.lat,
        lon: osm.lon,
        website: osm.website || "",
        openingHours: osm.openingHours || "",
      });
    } else {
      // New from OSM — no NHRA match
      osmNewCount++;
      merged.push({
        name: osm.name,
        country: "bh",
        city: osm.city,
        category: osm.category,
        address: osm.address,
        phone: osm.phone,
        email: osm.email,
        licenseNumber: "",
        facilityType: "",
        source: "OSM",
        lat: osm.lat,
        lon: osm.lon,
        website: osm.website || "",
        openingHours: osm.openingHours || "",
      });
    }
  }

  // Add unmatched NHRA providers (preserve them as-is)
  let nhraKeptCount = 0;
  for (const [, nhraList] of nhraByNorm) {
    for (const p of nhraList) {
      if (!p._matched) {
        nhraKeptCount++;
        const { _matched, ...clean } = p;
        merged.push({
          ...clean,
          lat: null,
          lon: null,
          website: "",
          openingHours: "",
        });
      }
    }
  }

  console.log(`  Merged NHRA+OSM: ${mergeCount}`);
  console.log(`  New from OSM: ${osmNewCount}`);
  console.log(`  Unmatched NHRA kept: ${nhraKeptCount}`);
  console.log(`  Total before dedup: ${merged.length}`);

  // ── Step 5: Dedup by name + proximity (200m) ──
  console.log("\nStep 5: Deduplicating by name similarity + proximity (200m)...");

  // Sort: prefer records with more data (license > coords > phone)
  merged.sort((a, b) => {
    const scoreA = (a.licenseNumber ? 4 : 0) + (a.lat ? 2 : 0) + (a.phone ? 1 : 0);
    const scoreB = (b.licenseNumber ? 4 : 0) + (b.lat ? 2 : 0) + (b.phone ? 1 : 0);
    return scoreB - scoreA;
  });

  const deduped = [];
  const removed = [];

  for (const provider of merged) {
    const provNorm = normalizeName(provider.name);
    let isDupe = false;

    for (const existing of deduped) {
      const existNorm = normalizeName(existing.name);
      const nameSim = similarity(provNorm, existNorm);

      if (nameSim >= 0.65) {
        // Check proximity if both have coordinates
        if (provider.lat && existing.lat) {
          const dist = haversineM(provider.lat, provider.lon, existing.lat, existing.lon);
          if (dist <= 200) {
            isDupe = true;
            // Merge any missing fields into the kept record
            if (!existing.lat && provider.lat) { existing.lat = provider.lat; existing.lon = provider.lon; }
            if (!existing.phone && provider.phone) existing.phone = provider.phone;
            if (!existing.email && provider.email) existing.email = provider.email;
            if (!existing.licenseNumber && provider.licenseNumber) existing.licenseNumber = provider.licenseNumber;
            if (!existing.website && provider.website) existing.website = provider.website;
            if (existing.source !== provider.source) existing.source = "NHRA+OSM";
            removed.push({ name: provider.name, reason: `dup of "${existing.name}" (${dist.toFixed(0)}m)` });
            break;
          }
        } else if (nameSim >= 0.85 && provider.city === existing.city) {
          // No coords but very similar name + same city — likely duplicate
          isDupe = true;
          if (!existing.lat && provider.lat) { existing.lat = provider.lat; existing.lon = provider.lon; }
          if (!existing.phone && provider.phone) existing.phone = provider.phone;
          if (!existing.email && provider.email) existing.email = provider.email;
          if (!existing.licenseNumber && provider.licenseNumber) existing.licenseNumber = provider.licenseNumber;
          if (!existing.website && provider.website) existing.website = provider.website;
          if (existing.source !== provider.source) existing.source = "NHRA+OSM";
          removed.push({ name: provider.name, reason: `dup of "${existing.name}" (name match, same city)` });
          break;
        }
      }
    }

    if (!isDupe) {
      deduped.push(provider);
    }
  }

  console.log(`  Removed ${removed.length} duplicates`);
  if (removed.length > 0 && removed.length <= 30) {
    for (const r of removed) console.log(`    - "${r.name}": ${r.reason}`);
  } else if (removed.length > 30) {
    for (const r of removed.slice(0, 15)) console.log(`    - "${r.name}": ${r.reason}`);
    console.log(`    ... and ${removed.length - 15} more`);
  }

  // ── Step 6: Clean up city assignments for NHRA records that had no coords ──
  // For NHRA records, use their existing city slug (already cleaned in fix-bahrain-data)
  // For OSM records, city was assigned from coordinates above

  // ── Step 7: Final cleanup and output ──
  console.log("\nStep 6: Final cleanup...");

  // Remove internal fields, ensure consistent structure
  const final = deduped.map((p) => {
    const record = {
      name: p.name,
      country: "bh",
      city: p.city || "manama",
      category: p.category || "clinics",
      address: p.address || "",
      phone: p.phone || "",
      email: p.email || "",
      licenseNumber: p.licenseNumber || "",
      facilityType: p.facilityType || "",
      source: p.source || "OSM",
    };
    // Only add lat/lon if they exist
    if (p.lat != null && p.lon != null) {
      record.lat = parseFloat(p.lat.toFixed(6));
      record.lon = parseFloat(p.lon.toFixed(6));
    }
    // Only add optional fields if non-empty
    if (p.website) record.website = p.website;
    if (p.openingHours) record.openingHours = p.openingHours;
    return record;
  });

  // Sort by category, then city, then name
  final.sort((a, b) => {
    const catOrder = { hospitals: 0, clinics: 1, dental: 2, pharmacy: 3, "labs-diagnostics": 4, optical: 5 };
    const catA = catOrder[a.category] ?? 99;
    const catB = catOrder[b.category] ?? 99;
    if (catA !== catB) return catA - catB;
    if (a.city !== b.city) return a.city.localeCompare(b.city);
    return a.name.localeCompare(b.name);
  });

  // Write output
  fs.writeFileSync(OUT_FILE, JSON.stringify(final, null, 2), "utf8");
  console.log(`\n${"=".repeat(60)}`);
  console.log(`Output: ${OUT_FILE}`);
  console.log(`${"=".repeat(60)}\n`);

  // ── Report ──
  console.log("=== FINAL REPORT ===\n");
  console.log(`Total providers: ${final.length}`);

  const byCat = {};
  for (const p of final) byCat[p.category] = (byCat[p.category] || 0) + 1;
  console.log("\nBreakdown by category:");
  for (const [cat, count] of Object.entries(byCat).sort(([, a], [, b]) => b - a)) {
    console.log(`  ${cat.padEnd(20)} ${count}`);
  }

  const byCity = {};
  for (const p of final) byCity[p.city] = (byCity[p.city] || 0) + 1;
  console.log("\nBreakdown by city:");
  for (const [city, count] of Object.entries(byCity).sort(([, a], [, b]) => b - a)) {
    console.log(`  ${city.padEnd(20)} ${count}`);
  }

  const bySource = {};
  for (const p of final) bySource[p.source] = (bySource[p.source] || 0) + 1;
  console.log("\nBreakdown by source:");
  for (const [src, count] of Object.entries(bySource).sort(([, a], [, b]) => b - a)) {
    console.log(`  ${src.padEnd(20)} ${count}`);
  }

  const hasCoords = final.filter((p) => p.lat != null).length;
  const hasPhone = final.filter((p) => p.phone).length;
  const hasEmail = final.filter((p) => p.email).length;
  const hasLicense = final.filter((p) => p.licenseNumber).length;
  const hasWebsite = final.filter((p) => p.website).length;

  console.log("\nData completeness:");
  console.log(`  Has coordinates:  ${hasCoords} / ${final.length} (${((hasCoords / final.length) * 100).toFixed(1)}%)`);
  console.log(`  Has phone:        ${hasPhone} / ${final.length} (${((hasPhone / final.length) * 100).toFixed(1)}%)`);
  console.log(`  Has email:        ${hasEmail} / ${final.length} (${((hasEmail / final.length) * 100).toFixed(1)}%)`);
  console.log(`  Has license:      ${hasLicense} / ${final.length} (${((hasLicense / final.length) * 100).toFixed(1)}%)`);
  console.log(`  Has website:      ${hasWebsite} / ${final.length} (${((hasWebsite / final.length) * 100).toFixed(1)}%)`);

  // Category gaps analysis
  console.log("\n=== CATEGORY GAP ANALYSIS (before vs after) ===");
  const beforeCats = {};
  for (const p of nhraProviders) beforeCats[p.category] = (beforeCats[p.category] || 0) + 1;
  const allCats = new Set([...Object.keys(beforeCats), ...Object.keys(byCat)]);
  console.log(`  ${"Category".padEnd(20)} ${"Before".padEnd(10)} ${"After".padEnd(10)} Change`);
  for (const cat of [...allCats].sort()) {
    const before = beforeCats[cat] || 0;
    const after = byCat[cat] || 0;
    const change = after - before;
    console.log(`  ${cat.padEnd(20)} ${String(before).padEnd(10)} ${String(after).padEnd(10)} ${change > 0 ? "+" : ""}${change}`);
  }
  console.log(`  ${"TOTAL".padEnd(20)} ${String(nhraProviders.length).padEnd(10)} ${String(final.length).padEnd(10)} ${final.length > nhraProviders.length ? "+" : ""}${final.length - nhraProviders.length}`);

  console.log("\nDone.");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
