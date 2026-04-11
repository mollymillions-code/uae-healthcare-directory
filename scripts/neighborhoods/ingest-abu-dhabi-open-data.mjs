#!/usr/bin/env node
/**
 * ingest-abu-dhabi-open-data.mjs
 * ---------------------------------------------------------------------------
 * Zocdoc roadmap Item 3 — UAE neighborhood taxonomy (Abu Dhabi Emirate).
 *
 * Seeds `areas` for Abu Dhabi city + Al Ain from the Abu Dhabi Open Data
 * Portal district/community layer. Target ~80 nodes across both cities.
 *
 * Data source: https://addata.gov.ae/ (Open Data Portal)
 * Concrete endpoint varies by release; leave the URL in one place so the
 * user can update it without touching the parsing logic.
 *
 * IDEMPOTENT — upserts on (source, source_id).
 *
 * Fallback: `data/neighborhoods/abu-dhabi-districts.geojson` — a local
 * snapshot. See TODO inside `loadGeoJson`.
 *
 * Usage:
 *   DATABASE_URL=postgres://... node scripts/neighborhoods/ingest-abu-dhabi-open-data.mjs
 *   DATABASE_URL=postgres://... node scripts/neighborhoods/ingest-abu-dhabi-open-data.mjs --dry-run
 * ---------------------------------------------------------------------------
 */

import { Pool } from "pg";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..", "..");

// TODO: update with concrete Abu Dhabi Open Data URL. The portal is
// https://addata.gov.ae/ — search for "district" / "community" / "plan area".
const ABU_DHABI_OPEN_DATA_URL = process.env.ABU_DHABI_OPEN_DATA_URL || "";
const LOCAL_SNAPSHOT_PATH = path.join(
  REPO_ROOT,
  "data",
  "neighborhoods",
  "abu-dhabi-districts.geojson"
);

const DRY_RUN = process.argv.includes("--dry-run");

// Abu Dhabi Emirate has two "cities" in the Zavis data model: abu-dhabi and
// al-ain. Each feature carries a municipality / plan-area attribute we use
// to route rows to the correct Zavis city slug.
const EMIRATE_CITY_SLUGS = ["abu-dhabi", "al-ain"];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function slugify(s) {
  return String(s || "")
    .toLowerCase()
    .trim()
    .replace(/[\u2018\u2019'`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function bboxAndCentroidFromGeometry(geometry) {
  if (!geometry || !geometry.coordinates) return null;
  let minLng = Infinity,
    minLat = Infinity,
    maxLng = -Infinity,
    maxLat = -Infinity;
  let sumLng = 0,
    sumLat = 0,
    n = 0;
  const walk = (coords) => {
    if (typeof coords[0] === "number") {
      const [lng, lat] = coords;
      if (Number.isFinite(lng) && Number.isFinite(lat)) {
        if (lng < minLng) minLng = lng;
        if (lat < minLat) minLat = lat;
        if (lng > maxLng) maxLng = lng;
        if (lat > maxLat) maxLat = lat;
        sumLng += lng;
        sumLat += lat;
        n += 1;
      }
      return;
    }
    for (const c of coords) walk(c);
  };
  walk(geometry.coordinates);
  if (n === 0 || !Number.isFinite(minLng)) return null;
  return {
    bbox: [minLng, minLat, maxLng, maxLat],
    centroidLng: sumLng / n,
    centroidLat: sumLat / n,
  };
}

async function loadGeoJson() {
  if (ABU_DHABI_OPEN_DATA_URL) {
    try {
      console.log(`[ad-open-data] Fetching ${ABU_DHABI_OPEN_DATA_URL} ...`);
      const res = await fetch(ABU_DHABI_OPEN_DATA_URL, {
        headers: { accept: "application/json, */*" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      const json = JSON.parse(text);
      if (!json.features || !Array.isArray(json.features)) {
        throw new Error("response not a FeatureCollection");
      }
      console.log(
        `[ad-open-data] Fetched ${json.features.length} features from network.`
      );
      return json;
    } catch (err) {
      console.warn(
        `[ad-open-data] Network fetch failed (${
          err instanceof Error ? err.message : err
        }). Falling back to local snapshot.`
      );
    }
  } else {
    console.log(
      `[ad-open-data] ABU_DHABI_OPEN_DATA_URL not set — going straight to local snapshot.`
    );
  }

  try {
    const buf = await fs.readFile(LOCAL_SNAPSHOT_PATH, "utf8");
    const json = JSON.parse(buf);
    if (!json.features || !Array.isArray(json.features)) {
      throw new Error("local snapshot is not a FeatureCollection");
    }
    console.log(
      `[ad-open-data] Loaded ${json.features.length} features from ${LOCAL_SNAPSHOT_PATH}`
    );
    return json;
  } catch (err) {
    // TODO for the user: download the district / plan area dataset from
    // https://addata.gov.ae/ and save it to
    // `data/neighborhoods/abu-dhabi-districts.geojson`. The loader expects a
    // GeoJSON FeatureCollection where each feature has an EN + AR district
    // name and an `EMIRATE_MUNICIPALITY` / `CITY` property that maps to
    // "abu-dhabi" or "al-ain".
    console.error(
      `[ad-open-data] Local snapshot missing or invalid at ${LOCAL_SNAPSHOT_PATH}.`
    );
    console.error(
      `[ad-open-data] Download the dataset from addata.gov.ae and save it to the path above, then re-run.`
    );
    throw err;
  }
}

function extractNameEn(props) {
  return (
    props.DISTRICT_EN ||
    props.DISTRICT_NAME_EN ||
    props.COMMUNITY_EN ||
    props.NAME_EN ||
    props.name_en ||
    props.name ||
    null
  );
}

function extractNameAr(props) {
  return (
    props.DISTRICT_AR ||
    props.DISTRICT_NAME_AR ||
    props.COMMUNITY_AR ||
    props.NAME_AR ||
    props.name_ar ||
    null
  );
}

function extractFeatureId(props) {
  const id =
    props.DISTRICT_ID ||
    props.OBJECTID ||
    props.FID ||
    props.PLAN_AREA_ID ||
    props.feature_id;
  return id == null ? null : String(id);
}

function resolveCitySlug(props) {
  const raw = String(
    props.CITY || props.MUNICIPALITY || props.CITY_SLUG || ""
  ).toLowerCase();
  if (raw.includes("al ain") || raw.includes("al-ain") || raw === "al_ain") {
    return "al-ain";
  }
  // Default every other Abu Dhabi Emirate feature to the capital city slug.
  return "abu-dhabi";
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
    const cityRes = await pool.query(
      `SELECT id, slug FROM cities WHERE slug = ANY($1::text[])`,
      [EMIRATE_CITY_SLUGS]
    );
    if (cityRes.rowCount === 0) {
      throw new Error(
        `cities rows not found for slugs=${EMIRATE_CITY_SLUGS.join(",")} — seed cities first.`
      );
    }
    const cityIdBySlug = new Map(
      cityRes.rows.map((r) => [r.slug, r.id])
    );

    const geojson = await loadGeoJson();

    for (const feature of geojson.features) {
      const props = feature.properties || {};
      const nameEn = extractNameEn(props);
      const nameAr = extractNameAr(props);
      const featureId = extractFeatureId(props);

      if (!nameEn || !featureId) {
        skipped += 1;
        continue;
      }

      const citySlug = resolveCitySlug(props);
      const cityId = cityIdBySlug.get(citySlug);
      if (!cityId) {
        skipped += 1;
        continue;
      }

      const slug = slugify(nameEn);
      if (!slug) {
        skipped += 1;
        continue;
      }

      const bc = bboxAndCentroidFromGeometry(feature.geometry);
      if (!bc) {
        skipped += 1;
        continue;
      }

      const areaId = `ad-open-${featureId}`;
      const bboxJson = JSON.stringify(bc.bbox);

      if (DRY_RUN) {
        console.log(
          `[dry-run] ${areaId} city=${citySlug} "${nameEn}" (${nameAr || "-"}) slug=${slug}`
        );
        continue;
      }

      const existing = await pool.query(
        `SELECT id FROM areas WHERE source = 'abu-dhabi-open-data' AND source_id = $1 LIMIT 1`,
        [featureId]
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
              level = 3,
              updated_at = NOW()
            WHERE id = $8`,
          [
            cityId,
            nameEn,
            slug,
            nameAr,
            bc.centroidLat,
            bc.centroidLng,
            bboxJson,
            existing.rows[0].id,
          ]
        );
        updated += 1;
      } else {
        const slugCollision = await pool.query(
          `SELECT 1 FROM areas WHERE city_id = $1 AND slug = $2 LIMIT 1`,
          [cityId, slug]
        );
        const finalSlug = slugCollision.rowCount > 0 ? `${slug}-ad` : slug;

        await pool.query(
          `INSERT INTO areas
             (id, city_id, name, slug, name_ar, latitude, longitude,
              bbox, centroid_lat, centroid_lng, level, source, source_id,
              is_published, min_provider_count, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $6, $7, 3,
                   'abu-dhabi-open-data', $9, TRUE, 0, NOW(), NOW())`,
          [
            areaId,
            cityId,
            nameEn,
            finalSlug,
            nameAr,
            bc.centroidLat,
            bc.centroidLng,
            bboxJson,
            featureId,
          ]
        );
        inserted += 1;
      }
    }

    console.log(
      `[ad-open-data] done. inserted=${inserted} updated=${updated} skipped=${skipped}`
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
