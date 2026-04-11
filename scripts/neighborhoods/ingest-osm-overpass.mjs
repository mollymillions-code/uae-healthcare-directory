#!/usr/bin/env node
/**
 * ingest-osm-overpass.mjs
 * ---------------------------------------------------------------------------
 * Zocdoc roadmap Item 3 — UAE neighborhood taxonomy (Northern Emirates).
 *
 * Queries the OpenStreetMap Overpass API for admin_level 8/9/10 relations
 * inside Sharjah, Ajman, Ras Al Khaimah, Umm Al Quwain, and Fujairah, and
 * upserts each result as an `areas` row, bilingual (name + name:ar), with
 * source='osm-overpass' and source_id=<osm relation id>.
 *
 * Target: 15–30 neighborhoods per emirate = ~100 rows total.
 *
 * IDEMPOTENT — upserts on (source, source_id).
 *
 * Rate-limited: 1 Overpass request per second, so we batch one emirate per
 * call and sleep between calls. Overpass recommends no more than a few
 * requests per minute for free tier (https://overpass-api.de/).
 *
 * Fallback: `data/neighborhoods/osm-northern-emirates.json` — a local
 * snapshot (object keyed by city slug → Overpass response JSON).
 *
 * Usage:
 *   DATABASE_URL=postgres://... node scripts/neighborhoods/ingest-osm-overpass.mjs
 *   DATABASE_URL=postgres://... node scripts/neighborhoods/ingest-osm-overpass.mjs --dry-run
 * ---------------------------------------------------------------------------
 */

import { Pool } from "pg";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..", "..");

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const LOCAL_SNAPSHOT_PATH = path.join(
  REPO_ROOT,
  "data",
  "neighborhoods",
  "osm-northern-emirates.json"
);

const DRY_RUN = process.argv.includes("--dry-run");

/**
 * Each entry queries one emirate's neighborhoods (admin_level=8, 9, 10).
 * `areaName` is the OSM english name of the emirate-level admin relation
 * used by `area[name="..."]` to scope the inner query. `citySlug` maps the
 * result rows back to our cities table.
 */
const EMIRATES = [
  { citySlug: "sharjah", areaName: "Sharjah" },
  { citySlug: "ajman", areaName: "Ajman" },
  { citySlug: "ras-al-khaimah", areaName: "Ras Al Khaimah" },
  { citySlug: "umm-al-quwain", areaName: "Umm Al Quwain" },
  { citySlug: "fujairah", areaName: "Fujairah" },
];

// Overpass QL template. `{{areaName}}` is substituted at runtime.
// We request geometry (`out geom`) so we can compute bbox + centroid without
// a second round trip. 180s timeout is Overpass-side.
const OVERPASS_QUERY_TEMPLATE = `
[out:json][timeout:180];
area["name"="{{areaName}}"]["admin_level"~"^[4-6]$"]->.searchArea;
(
  relation["boundary"="administrative"]["admin_level"~"^(8|9|10)$"](area.searchArea);
);
out tags geom;
`.trim();

// ─── Helpers ─────────────────────────────────────────────────────────────────

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function slugify(s) {
  return String(s || "")
    .toLowerCase()
    .trim()
    .replace(/[\u2018\u2019'`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Overpass `out geom` gives us a relation with `members[].geometry[].{lat,lon}`
 * for ways. Walk every lat/lon and compute bbox + mean centroid.
 */
function bboxAndCentroidFromRelation(rel) {
  let minLng = Infinity,
    minLat = Infinity,
    maxLng = -Infinity,
    maxLat = -Infinity;
  let sumLng = 0,
    sumLat = 0,
    n = 0;

  const addPoint = (lat, lon) => {
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
    if (lon < minLng) minLng = lon;
    if (lat < minLat) minLat = lat;
    if (lon > maxLng) maxLng = lon;
    if (lat > maxLat) maxLat = lat;
    sumLng += lon;
    sumLat += lat;
    n += 1;
  };

  if (rel.center && Number.isFinite(rel.center.lat)) {
    addPoint(rel.center.lat, rel.center.lon);
  }
  if (Array.isArray(rel.members)) {
    for (const m of rel.members) {
      if (Array.isArray(m.geometry)) {
        for (const pt of m.geometry) addPoint(pt.lat, pt.lon);
      }
    }
  }
  if (rel.bounds) {
    addPoint(rel.bounds.minlat, rel.bounds.minlon);
    addPoint(rel.bounds.maxlat, rel.bounds.maxlon);
  }

  if (n === 0 || !Number.isFinite(minLng)) return null;
  return {
    bbox: [minLng, minLat, maxLng, maxLat],
    centroidLng: sumLng / n,
    centroidLat: sumLat / n,
  };
}

async function queryOverpass(areaName) {
  const query = OVERPASS_QUERY_TEMPLATE.replace("{{areaName}}", areaName);
  const body = new URLSearchParams({ data: query });
  console.log(`[osm-overpass] Querying Overpass for "${areaName}" ...`);
  const res = await fetch(OVERPASS_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    throw new Error(`Overpass HTTP ${res.status}: ${res.statusText}`);
  }
  return res.json();
}

async function loadFromNetworkOrSnapshot() {
  // Try network; if any emirate query fails, fall back to local snapshot.
  const byCity = {};
  let networkOk = true;
  for (const e of EMIRATES) {
    try {
      const json = await queryOverpass(e.areaName);
      byCity[e.citySlug] = json;
      await sleep(1200); // ~1 req/s rate limit
    } catch (err) {
      console.warn(
        `[osm-overpass] Overpass fetch failed for ${e.areaName} (${
          err instanceof Error ? err.message : err
        }).`
      );
      networkOk = false;
      break;
    }
  }

  if (networkOk) return byCity;

  // Fallback: local snapshot (object keyed by citySlug → Overpass JSON).
  try {
    const buf = await fs.readFile(LOCAL_SNAPSHOT_PATH, "utf8");
    const json = JSON.parse(buf);
    console.log(`[osm-overpass] Loaded local snapshot ${LOCAL_SNAPSHOT_PATH}`);
    return json;
  } catch (err) {
    // TODO for the user: if Overpass is rate-limiting, build the snapshot
    // manually by running each emirate's query one at a time (copy the
    // template from OVERPASS_QUERY_TEMPLATE at the top of this file) and
    // save the merged object to `data/neighborhoods/osm-northern-emirates.json`
    // with the shape { "sharjah": {...}, "ajman": {...}, ... }.
    console.error(
      `[osm-overpass] Local snapshot missing or invalid at ${LOCAL_SNAPSHOT_PATH}.`
    );
    throw err;
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set — aborting.");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  try {
    const citySlugs = EMIRATES.map((e) => e.citySlug);
    const cityRes = await pool.query(
      `SELECT id, slug FROM cities WHERE slug = ANY($1::text[])`,
      [citySlugs]
    );
    const cityIdBySlug = new Map(cityRes.rows.map((r) => [r.slug, r.id]));
    for (const s of citySlugs) {
      if (!cityIdBySlug.has(s)) {
        throw new Error(
          `cities row for slug='${s}' not found — seed cities first.`
        );
      }
    }

    const byCity = await loadFromNetworkOrSnapshot();

    for (const emirate of EMIRATES) {
      const response = byCity[emirate.citySlug];
      if (!response || !Array.isArray(response.elements)) {
        console.warn(
          `[osm-overpass] No data for ${emirate.citySlug} — skipping.`
        );
        continue;
      }
      const cityId = cityIdBySlug.get(emirate.citySlug);

      for (const el of response.elements) {
        if (el.type !== "relation") continue;
        const tags = el.tags || {};
        const nameEn = tags["name:en"] || tags.name;
        const nameAr = tags["name:ar"] || null;
        const osmId = el.id != null ? String(el.id) : null;

        if (!nameEn || !osmId) {
          skipped += 1;
          continue;
        }

        const slug = slugify(nameEn);
        if (!slug) {
          skipped += 1;
          continue;
        }

        const bc = bboxAndCentroidFromRelation(el);
        if (!bc) {
          skipped += 1;
          continue;
        }

        const areaId = `osm-${osmId}`;
        const bboxJson = JSON.stringify(bc.bbox);
        const level = Number(tags.admin_level) || 3;

        if (DRY_RUN) {
          console.log(
            `[dry-run] ${areaId} city=${emirate.citySlug} "${nameEn}" (${nameAr || "-"}) slug=${slug}`
          );
          continue;
        }

        const existing = await pool.query(
          `SELECT id FROM areas WHERE source = 'osm-overpass' AND source_id = $1 LIMIT 1`,
          [osmId]
        );

        if (existing.rowCount > 0) {
          await pool.query(
            `UPDATE areas SET
                city_id = $1,
                name = $2,
                slug = $3,
                name_ar = $4,
                latitude = $5,
                longitude = $6,
                bbox = $7::jsonb,
                centroid_lat = $5,
                centroid_lng = $6,
                level = $8,
                updated_at = NOW()
              WHERE id = $9`,
            [
              cityId,
              nameEn,
              slug,
              nameAr,
              bc.centroidLat,
              bc.centroidLng,
              bboxJson,
              level,
              existing.rows[0].id,
            ]
          );
          updated += 1;
        } else {
          const slugCollision = await pool.query(
            `SELECT 1 FROM areas WHERE city_id = $1 AND slug = $2 LIMIT 1`,
            [cityId, slug]
          );
          const finalSlug =
            slugCollision.rowCount > 0 ? `${slug}-osm` : slug;

          await pool.query(
            `INSERT INTO areas
               (id, city_id, name, slug, name_ar, latitude, longitude,
                bbox, centroid_lat, centroid_lng, level, source, source_id,
                is_published, min_provider_count, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $6, $7, $9,
                     'osm-overpass', $10, TRUE, 0, NOW(), NOW())`,
            [
              areaId,
              cityId,
              nameEn,
              finalSlug,
              nameAr,
              bc.centroidLat,
              bc.centroidLng,
              bboxJson,
              level,
              osmId,
            ]
          );
          inserted += 1;
        }
      }
    }

    console.log(
      `[osm-overpass] done. inserted=${inserted} updated=${updated} skipped=${skipped}`
    );
    if (DRY_RUN) console.log("(dry-run: no rows written)");
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
