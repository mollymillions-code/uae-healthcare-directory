#!/usr/bin/env node
/**
 * assign-providers-to-areas.mjs
 * ---------------------------------------------------------------------------
 * Zocdoc roadmap Item 3 — Provider-to-neighborhood assignment.
 *
 * For every provider with (latitude, longitude), find the best-fit published
 * `areas` row in the SAME city:
 *   1. If the provider falls inside an area's bbox → candidate set.
 *   2. Inside that candidate set, pick the area whose centroid is closest by
 *      haversine distance.
 *   3. If no bbox match (common for small areas with imprecise OSM polygons),
 *      fall back to nearest centroid within 3 km.
 *   4. If the nearest centroid is still > 3 km away, leave `area_id` NULL
 *      (unmatched — reported but not guessed).
 *
 * After every provider pass, recompute `provider_count_cached` on every area
 * the script touched and set `provider_count_updated_at = NOW()` so the
 * sitemap builder can gate neighborhood×category URLs.
 *
 * SAFETY:
 *   - `--apply` flag required to actually write `providers.area_id`.
 *   - Default is dry-run with a full report.
 *   - Respects existing `providers.area_id` unless `--overwrite` is passed.
 *
 * Usage:
 *   DATABASE_URL=... node scripts/neighborhoods/assign-providers-to-areas.mjs           # dry-run report
 *   DATABASE_URL=... node scripts/neighborhoods/assign-providers-to-areas.mjs --apply   # write changes
 *   DATABASE_URL=... node scripts/neighborhoods/assign-providers-to-areas.mjs --apply --overwrite
 *
 * CLAUDE.md compliance: `pg` driver, idempotent, no Google Places calls.
 * ---------------------------------------------------------------------------
 */

import { Pool } from "pg";

const APPLY = process.argv.includes("--apply");
const OVERWRITE = process.argv.includes("--overwrite");

const MAX_CENTROID_KM = 3.0; // nearest-centroid fallback radius

// ─── Helpers ─────────────────────────────────────────────────────────────────

function haversineKm(lat1, lng1, lat2, lng2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371.0088;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function bboxContains(bbox, lat, lng) {
  if (!Array.isArray(bbox) || bbox.length !== 4) return false;
  const [minLng, minLat, maxLng, maxLat] = bbox;
  return lng >= minLng && lng <= maxLng && lat >= minLat && lat <= maxLat;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set — aborting.");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    // 1. Load published areas grouped by city.
    const areasRes = await pool.query(
      `SELECT id, city_id, slug, bbox, centroid_lat, centroid_lng
         FROM areas
        WHERE is_published = TRUE
          AND centroid_lat IS NOT NULL
          AND centroid_lng IS NOT NULL`
    );

    if (areasRes.rowCount === 0) {
      console.log(
        "[assign] No published areas with centroids found. Run an ingestion script first."
      );
      return;
    }

    const areasByCity = new Map();
    for (const row of areasRes.rows) {
      const key = row.city_id;
      if (!areasByCity.has(key)) areasByCity.set(key, []);
      areasByCity.get(key).push({
        id: row.id,
        slug: row.slug,
        bbox: row.bbox,
        centroidLat: Number(row.centroid_lat),
        centroidLng: Number(row.centroid_lng),
      });
    }

    console.log(
      `[assign] Loaded ${areasRes.rowCount} published areas across ${areasByCity.size} cities.`
    );

    // 2. Stream providers with coordinates.
    const providersRes = await pool.query(
      `SELECT id, city_id, latitude, longitude, area_id
         FROM providers
        WHERE latitude IS NOT NULL
          AND longitude IS NOT NULL`
    );

    console.log(
      `[assign] Considering ${providersRes.rowCount} providers with coordinates.`
    );

    let matchedHighConf = 0; // bbox hit
    let matchedLowConf = 0; // centroid-only
    let unchanged = 0;
    let unmatched = 0;
    let skippedHasAreaId = 0;

    const touchedAreaIds = new Set();
    const updates = []; // { providerId, areaId, confidence }

    for (const p of providersRes.rows) {
      if (p.area_id && !OVERWRITE) {
        skippedHasAreaId += 1;
        continue;
      }
      const lat = Number(p.latitude);
      const lng = Number(p.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        unmatched += 1;
        continue;
      }

      const candidates = areasByCity.get(p.city_id) || [];
      if (candidates.length === 0) {
        unmatched += 1;
        continue;
      }

      // Pass 1: areas whose bbox contains this point.
      const inside = candidates.filter((a) => bboxContains(a.bbox, lat, lng));

      let best = null;
      let bestDistance = Infinity;
      let confidence = "none";

      if (inside.length > 0) {
        for (const a of inside) {
          const d = haversineKm(lat, lng, a.centroidLat, a.centroidLng);
          if (d < bestDistance) {
            bestDistance = d;
            best = a;
          }
        }
        confidence = "bbox";
        matchedHighConf += 1;
      } else {
        // Pass 2: nearest centroid within MAX_CENTROID_KM.
        for (const a of candidates) {
          const d = haversineKm(lat, lng, a.centroidLat, a.centroidLng);
          if (d < bestDistance) {
            bestDistance = d;
            best = a;
          }
        }
        if (best && bestDistance <= MAX_CENTROID_KM) {
          confidence = "centroid";
          matchedLowConf += 1;
        } else {
          best = null;
          unmatched += 1;
        }
      }

      if (!best) continue;
      if (p.area_id === best.id) {
        unchanged += 1;
      } else {
        updates.push({
          providerId: p.id,
          areaId: best.id,
          slug: best.slug,
          confidence,
          distanceKm: Number(bestDistance.toFixed(3)),
        });
      }
      touchedAreaIds.add(best.id);
    }

    console.log(
      `[assign] report:
  - inside-bbox matches:       ${matchedHighConf}
  - centroid-only matches:     ${matchedLowConf}
  - no change (already set):   ${unchanged}
  - skipped (had area_id):     ${skippedHasAreaId}
  - unmatched:                 ${unmatched}
  - updates to apply:          ${updates.length}`
    );

    if (!APPLY) {
      console.log("[assign] dry-run complete. Re-run with --apply to write.");
      return;
    }

    // 3. Apply provider updates in batches of 500 (single UPDATE per batch).
    const BATCH = 500;
    for (let i = 0; i < updates.length; i += BATCH) {
      const slice = updates.slice(i, i + BATCH);
      const values = slice
        .map((_, j) => `($${j * 2 + 1}::text, $${j * 2 + 2}::text)`)
        .join(", ");
      const params = slice.flatMap((u) => [u.providerId, u.areaId]);
      await pool.query(
        `UPDATE providers AS p
            SET area_id = v.area_id,
                area_slug = a.slug
           FROM (VALUES ${values}) AS v(provider_id, area_id)
           JOIN areas AS a ON a.id = v.area_id
          WHERE p.id = v.provider_id`,
        params
      );
    }

    console.log(
      `[assign] applied ${updates.length} provider → area assignments.`
    );

    // 4. Recompute provider_count_cached on every touched area.
    if (touchedAreaIds.size > 0) {
      const ids = Array.from(touchedAreaIds);
      await pool.query(
        `UPDATE areas a
            SET provider_count_cached = sub.n,
                provider_count_updated_at = NOW()
           FROM (
             SELECT area_id, COUNT(*)::int AS n
               FROM providers
              WHERE area_id = ANY($1::text[])
              GROUP BY area_id
           ) AS sub
          WHERE a.id = sub.area_id`,
        [ids]
      );
      console.log(
        `[assign] refreshed provider_count_cached on ${ids.length} areas.`
      );
    }
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
