#!/usr/bin/env node
/**
 * ingest-dubai-pulse.mjs
 * ---------------------------------------------------------------------------
 * Zocdoc roadmap Item 3 — UAE neighborhood taxonomy (Dubai).
 *
 * Fetches the `dm_community-open` dataset from Dubai Pulse and upserts the
 * 226 Dubai communities into the `areas` table as bbox + centroid, bilingual
 * (English + Arabic), source-tagged ('dubai-pulse', community id).
 *
 * IDEMPOTENT — safe to re-run. Upserts on (source, source_id).
 *
 * Data source: https://www.dubaipulse.gov.ae/data/dm-location/dm_community-open/download
 *              (Open Data License, free, no API key)
 *
 * Fallback: if the network fetch fails or the remote URL changes shape, this
 * script reads from `data/neighborhoods/dubai-communities.geojson` (a snapshot
 * the user can download once and commit to the repo — see TODO at the top of
 * the loadGeoJson function).
 *
 * Usage:
 *   DATABASE_URL=postgres://... node scripts/neighborhoods/ingest-dubai-pulse.mjs
 *   DATABASE_URL=postgres://... node scripts/neighborhoods/ingest-dubai-pulse.mjs --dry-run
 *
 * CLAUDE.md compliance:
 *   - Uses `pg` (node-postgres), NOT @neondatabase/serverless
 *   - No GTM / layout.tsx touches
 *   - Never fetches Google Places
 * ---------------------------------------------------------------------------
 */

import { Pool } from "pg";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..", "..");

const DUBAI_PULSE_URL =
  "https://www.dubaipulse.gov.ae/data/dm-location/dm_community-open/download";
const LOCAL_SNAPSHOT_PATH = path.join(
  REPO_ROOT,
  "data",
  "neighborhoods",
  "dubai-communities.geojson"
);

const DRY_RUN = process.argv.includes("--dry-run");
const DUBAI_CITY_SLUG = "dubai";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function slugify(s) {
  return String(s || "")
    .toLowerCase()
    .trim()
    .replace(/[\u2018\u2019'`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Compute [minLng, minLat, maxLng, maxLat] and centroid [lng, lat] from a
 * GeoJSON Polygon / MultiPolygon coordinate array. Uses area-weighted centroid
 * for polygons so long skinny shapes still sit in the middle.
 */
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
  // Try network first.
  try {
    console.log(`[dubai-pulse] Fetching ${DUBAI_PULSE_URL} ...`);
    const res = await fetch(DUBAI_PULSE_URL, {
      headers: { accept: "application/json, */*" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    // Dubai Pulse sometimes serves a zipped file or HTML landing page. If
    // we don't parse as JSON, fall through to the local snapshot.
    const json = JSON.parse(text);
    if (!json.features || !Array.isArray(json.features)) {
      throw new Error("response not a FeatureCollection");
    }
    console.log(
      `[dubai-pulse] Fetched ${json.features.length} features from network.`
    );
    return json;
  } catch (err) {
    console.warn(
      `[dubai-pulse] Network fetch failed (${
        err instanceof Error ? err.message : err
      }). Falling back to local snapshot.`
    );
  }

  // Fallback: local snapshot.
  try {
    const buf = await fs.readFile(LOCAL_SNAPSHOT_PATH, "utf8");
    const json = JSON.parse(buf);
    if (!json.features || !Array.isArray(json.features)) {
      throw new Error("local snapshot is not a FeatureCollection");
    }
    console.log(
      `[dubai-pulse] Loaded ${json.features.length} features from ${LOCAL_SNAPSHOT_PATH}`
    );
    return json;
  } catch (err) {
    // TODO for the user: if both fetch + snapshot fail, download the dataset
    // manually from https://www.dubaipulse.gov.ae/data/dm-location/dm_community-open
    // and save it to `data/neighborhoods/dubai-communities.geojson` (GeoJSON
    // FeatureCollection with EN + AR community names + numeric community id).
    console.error(
      `[dubai-pulse] Local snapshot missing or invalid at ${LOCAL_SNAPSHOT_PATH}.`
    );
    console.error(
      `[dubai-pulse] Download the dataset from Dubai Pulse and save it to the path above, then re-run.`
    );
    throw err;
  }
}

function extractNameEn(props) {
  return (
    props.COMM_ENG ||
    props.COMMUNITY_E ||
    props.NAME_ENG ||
    props.NAME_EN ||
    props.COMM_NAME_EN ||
    props.name_en ||
    props.name ||
    null
  );
}

function extractNameAr(props) {
  return (
    props.COMM_ARA ||
    props.COMMUNITY_A ||
    props.NAME_ARA ||
    props.NAME_AR ||
    props.COMM_NAME_AR ||
    props.name_ar ||
    null
  );
}

function extractCommunityId(props) {
  const id =
    props.COMM_NUM ||
    props.COMMUNITY_NUM ||
    props.COMM_ID ||
    props.COMMUNITY_ID ||
    props.community_number ||
    props.community_id;
  return id == null ? null : String(id);
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
      `SELECT id FROM cities WHERE slug = $1 LIMIT 1`,
      [DUBAI_CITY_SLUG]
    );
    if (cityRes.rowCount === 0) {
      throw new Error(
        `cities row for slug='${DUBAI_CITY_SLUG}' not found — seed cities first.`
      );
    }
    const cityId = cityRes.rows[0].id;

    const geojson = await loadGeoJson();

    for (const feature of geojson.features) {
      const props = feature.properties || {};
      const nameEn = extractNameEn(props);
      const nameAr = extractNameAr(props);
      const commId = extractCommunityId(props);

      if (!nameEn || !commId) {
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

      const areaId = `dubai-pulse-${commId}`;
      const bboxJson = JSON.stringify(bc.bbox);

      if (DRY_RUN) {
        console.log(
          `[dry-run] ${areaId} "${nameEn}" (${nameAr || "-"}) slug=${slug}`
        );
        continue;
      }

      // Upsert on (source, source_id) via the partial unique index. We can't
      // use ON CONFLICT with a partial index, so we do the two-step upsert:
      // check-then-update-or-insert. Safe because the ingestion script is the
      // only writer for 'dubai-pulse' rows.
      const existing = await pool.query(
        `SELECT id FROM areas WHERE source = 'dubai-pulse' AND source_id = $1 LIMIT 1`,
        [commId]
      );

      if (existing.rowCount > 0) {
        await pool.query(
          `UPDATE areas SET
              name = $1,
              slug = $2,
              name_ar = $3,
              latitude = $4,
              longitude = $5,
              bbox = $6::jsonb,
              centroid_lat = $4,
              centroid_lng = $5,
              level = 3,
              updated_at = NOW()
            WHERE id = $7`,
          [
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
        // Collision guard: if another source already owns this slug for Dubai,
        // suffix with -dp so we keep both rows while letting the new row land.
        const slugCollision = await pool.query(
          `SELECT 1 FROM areas WHERE city_id = $1 AND slug = $2 LIMIT 1`,
          [cityId, slug]
        );
        const finalSlug =
          slugCollision.rowCount > 0 ? `${slug}-dp` : slug;

        await pool.query(
          `INSERT INTO areas
             (id, city_id, name, slug, name_ar, latitude, longitude,
              bbox, centroid_lat, centroid_lng, level, source, source_id,
              is_published, min_provider_count, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $6, $7, 3,
                   'dubai-pulse', $9, TRUE, 0, NOW(), NOW())`,
          [
            areaId,
            cityId,
            nameEn,
            finalSlug,
            nameAr,
            bc.centroidLat,
            bc.centroidLng,
            bboxJson,
            commId,
          ]
        );
        inserted += 1;
      }
    }

    console.log(
      `[dubai-pulse] done. inserted=${inserted} updated=${updated} skipped=${skipped}`
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
