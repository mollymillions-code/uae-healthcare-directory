#!/usr/bin/env node
/**
 * Thicken thin GCC provider pages — Stage 1: Places enrichment only.
 *
 * Targets: providers in (sa, qa, bh, kw) AND category in
 *   (clinics, hospitals, dental, physiotherapy, neurology) where the row has
 *   no description, no gallery_photos, and no google_place_id.
 *
 * Per provider:
 *   1. Places searchText -> match top result by jaccard(name) >= 0.3
 *   2. Place Details (FieldMask *) with Referer header
 *   3. Download up to 10 photos -> sharp -> WebP -> R2
 *   4. Single atomic UPDATE (no description — that's Stage 2)
 *
 * Stage 2 (descriptions) runs in scripts/write-gcc-descriptions.mjs which
 * batches providers and shells out to the local `claude` CLI to use the
 * Claude Code subscription (no API key needed, no per-token spend).
 *
 * Environment:
 *   GOOGLE_PLACES_API_KEY        Places-restricted key (referer-locked)
 *   GOOGLE_PLACES_REFERER        e.g. https://www.zavis.ai/
 *   DATABASE_URL                 Postgres (local on EC2 or via SSH tunnel)
 *   R2_*                         R2 credentials + bucket + public url
 *
 * Flags:
 *   --test          Cap to 5 providers
 *   --limit=N       Hard cap
 *   --country=cc    Single country (default: all four)
 *   --concurrency=N Workers (default: 6)
 *   --dry-run       Plan only, no API/R2/DB writes
 */

import pg from "pg";
import fs from "fs";
import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";

const { Pool } = pg;

const args = process.argv.slice(2);
const TEST_MODE = args.includes("--test");
const DRY_RUN = args.includes("--dry-run");
const getArg = (name, def) => {
  const a = args.find((x) => x.startsWith(`--${name}=`));
  return a ? a.split("=")[1] : def;
};
const COUNTRY_FILTER = getArg("country", null);
const LIMIT = parseInt(getArg("limit", TEST_MODE ? "5" : "10000"), 10);
const CONCURRENCY = parseInt(getArg("concurrency", "6"), 10);

const COUNTRIES = COUNTRY_FILTER ? [COUNTRY_FILTER] : ["sa", "qa", "bh", "kw"];
const CATEGORIES = ["clinics", "hospitals", "dental", "physiotherapy", "neurology"];

const PHOTO_WIDTH_PX = 1600;
const MAX_PHOTOS = 10;
const MAX_REVIEWS = 5;
const OUT_WIDTH_PX = 1200;
const OUT_WEBP_QUALITY = 80;
const JACCARD_MATCH_THRESHOLD = 0.3;

const COST_SEARCH_USD = 0.032;
const COST_DETAILS_USD = 0.025;
const COST_PHOTO_USD = 0.007;

const {
  GOOGLE_PLACES_API_KEY: PLACES_KEY,
  GOOGLE_PLACES_REFERER: PLACES_REFERER,
  DATABASE_URL,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_ENDPOINT,
  R2_BUCKET,
} = process.env;
const R2_PUBLIC_URL = (process.env.R2_PUBLIC_URL || "").replace(/\/$/, "");

const missing = [];
if (!DATABASE_URL) missing.push("DATABASE_URL");
if (!DRY_RUN) {
  if (!PLACES_KEY) missing.push("GOOGLE_PLACES_API_KEY");
  if (!PLACES_REFERER) missing.push("GOOGLE_PLACES_REFERER");
  if (!R2_ACCESS_KEY_ID) missing.push("R2_ACCESS_KEY_ID");
  if (!R2_SECRET_ACCESS_KEY) missing.push("R2_SECRET_ACCESS_KEY");
  if (!R2_ENDPOINT) missing.push("R2_ENDPOINT");
  if (!R2_BUCKET) missing.push("R2_BUCKET");
  if (!R2_PUBLIC_URL) missing.push("R2_PUBLIC_URL");
}
if (missing.length) {
  console.error(`Missing env vars: ${missing.join(", ")}`);
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL, max: CONCURRENCY + 2 });
const s3 = DRY_RUN
  ? null
  : new S3Client({
      region: "auto",
      endpoint: R2_ENDPOINT,
      credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
    });

const RUN_ID = Date.now();
const LOG_FILE = `/tmp/thicken-gcc-${RUN_ID}.log`;
const FAILED_FILE = `/tmp/thicken-gcc-${RUN_ID}-failures.json`;
const NO_MATCH_FILE = `/tmp/thicken-gcc-${RUN_ID}-no-match.json`;

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  try {
    fs.appendFileSync(LOG_FILE, line + "\n");
  } catch {}
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function retry(fn, label, attempts = 3) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      const msg = e.message || String(e);
      if (msg.includes("403") || msg.includes("API_KEY") || msg.includes("INVALID_ARGUMENT")) throw e;
      if (i < attempts - 1) {
        await sleep(1000 * Math.pow(2, i));
      }
    }
  }
  throw lastErr;
}

function jaccard(a, b) {
  const norm = (s) =>
    new Set(
      String(s || "")
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((t) => t.length > 1)
    );
  const sa = norm(a);
  const sb = norm(b);
  if (sa.size === 0 || sb.size === 0) return 0;
  const inter = new Set([...sa].filter((x) => sb.has(x))).size;
  const union = new Set([...sa, ...sb]).size;
  return inter / union;
}

const COUNTRY_NAME = { sa: "Saudi Arabia", qa: "Qatar", bh: "Bahrain", kw: "Kuwait" };

// Country bounding boxes — used as locationRestriction so Places search can't
// jump countries on us. (lat/lng pairs: low=south-west, high=north-east)
const COUNTRY_BBOX = {
  sa: { low: { latitude: 16.0, longitude: 34.0 }, high: { latitude: 32.5, longitude: 55.7 } },
  qa: { low: { latitude: 24.4, longitude: 50.7 }, high: { latitude: 26.2, longitude: 51.7 } },
  bh: { low: { latitude: 25.5, longitude: 50.3 }, high: { latitude: 26.4, longitude: 50.8 } },
  kw: { low: { latitude: 28.5, longitude: 46.5 }, high: { latitude: 30.1, longitude: 48.5 } },
};

const CITY_DISPLAY_OVERRIDE = {
  "al-rayyan": "Al Rayyan",
  "isa-town": "Isa Town",
  "kuwait-city": "Kuwait City",
  "hamad-town": "Hamad Town",
};
function cityDisplay(slug) {
  if (CITY_DISPLAY_OVERRIDE[slug]) return CITY_DISPLAY_OVERRIDE[slug];
  return slug
    .split("-")
    .map((p) => p[0].toUpperCase() + p.slice(1))
    .join(" ");
}

// ─── Places API ─────────────────────────────────────────────────────────────
async function searchPlace(name, citySlug, country) {
  return retry(async () => {
    const query = `${name}, ${cityDisplay(citySlug)}, ${COUNTRY_NAME[country]}`;
    const body = { textQuery: query, maxResultCount: 3 };
    const bbox = COUNTRY_BBOX[country];
    if (bbox) {
      body.locationRestriction = { rectangle: bbox };
    }
    const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": PLACES_KEY,
        "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.rating,places.location",
        Referer: PLACES_REFERER,
      },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok || json.error) {
      throw new Error(`search ${res.status} ${json.error?.message || res.statusText}`);
    }
    return json.places || [];
  }, `search(${name.slice(0, 30)})`);
}

async function fetchPlaceDetails(placeId) {
  return retry(async () => {
    const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`;
    const res = await fetch(url, {
      headers: {
        "X-Goog-Api-Key": PLACES_KEY,
        "X-Goog-FieldMask": "*",
        Referer: PLACES_REFERER,
      },
    });
    const json = await res.json();
    if (!res.ok || json.error) {
      throw new Error(`details ${res.status} ${json.error?.message || res.statusText}`);
    }
    return json;
  }, `details(${placeId.slice(0, 12)})`);
}

async function downloadPhoto(photoResourceName) {
  return retry(async () => {
    const url = `https://places.googleapis.com/v1/${photoResourceName}/media?maxWidthPx=${PHOTO_WIDTH_PX}&key=${PLACES_KEY}`;
    const res = await fetch(url, {
      redirect: "follow",
      headers: { Referer: PLACES_REFERER },
    });
    if (!res.ok) throw new Error(`photo ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 500) throw new Error(`photo too small (${buf.length}b)`);
    return { buffer: buf, contentType: res.headers.get("content-type") || "image/jpeg" };
  }, `photo(${photoResourceName.slice(-12)})`);
}

// ─── R2 ─────────────────────────────────────────────────────────────────────
async function r2Exists(key) {
  if (DRY_RUN) return false;
  try {
    await s3.send(new HeadObjectCommand({ Bucket: R2_BUCKET, Key: key }));
    return true;
  } catch {
    return false;
  }
}

async function r2Upload(key, buffer, contentType) {
  if (DRY_RUN) return `${R2_PUBLIC_URL}/${key}`;
  await s3.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    })
  );
  return `${R2_PUBLIC_URL}/${key}`;
}

async function optimizePhoto(buffer) {
  const optimized = await sharp(buffer, { failOn: "none" })
    .rotate()
    .resize({ width: OUT_WIDTH_PX, height: OUT_WIDTH_PX, fit: "inside", withoutEnlargement: true })
    .webp({ quality: OUT_WEBP_QUALITY, effort: 4 })
    .toBuffer();
  const meta = await sharp(optimized).metadata();
  return { buffer: optimized, contentType: "image/webp", widthPx: meta.width || 0, heightPx: meta.height || 0, bytes: optimized.length };
}

// ─── Per-provider ───────────────────────────────────────────────────────────
async function processOne(provider, stats) {
  const { id, name, city_slug, category_slug, country, google_place_id: existingPid } = provider;

  try {
    if (DRY_RUN) {
      log(`[DRY] ${name} (${city_slug}/${category_slug}/${country})`);
      stats.success++;
      return;
    }

    // If we already have a place_id from a prior pass, skip search and go
    // straight to details. Drift check below catches stale ids.
    let topId = existingPid || null;
    if (!topId) {
      const candidates = await searchPlace(name, city_slug, country);
      stats.searchCalls++;

      if (candidates.length === 0) {
        stats.noMatch++;
        stats.noMatches.push({ id, name, reason: "zero_results" });
        log(`✗ ${name}: zero results`);
        return;
      }

      const top = candidates[0];
      const sim = jaccard(name, top.displayName?.text || "");
      if (sim < JACCARD_MATCH_THRESHOLD) {
        stats.noMatch++;
        stats.noMatches.push({
          id,
          name,
          reason: "low_jaccard",
          topGoogle: top.displayName?.text,
          sim: Number(sim.toFixed(2)),
        });
        log(`? ${name} ↔ "${top.displayName?.text}" sim=${sim.toFixed(2)} — skip`);
        return;
      }
      topId = top.id;
    } else {
      stats.preExistingPid++;
    }

    const place = await fetchPlaceDetails(topId);
    stats.detailsCalls++;

    // Drift guard for pre-existing place_ids — if Google's name no longer
    // resembles the DB name, treat as orphan and skip.
    if (existingPid) {
      const sim = jaccard(name, place.displayName?.text || "");
      if (sim < 0.2) {
        stats.drift++;
        stats.noMatches.push({
          id,
          name,
          reason: "drift",
          topGoogle: place.displayName?.text,
          sim: Number(sim.toFixed(2)),
        });
        log(`⚠ drift ${name} ↔ "${place.displayName?.text}" sim=${sim.toFixed(2)} — skip`);
        return;
      }
    }

    const photoDescriptors = (place.photos || []).slice(0, MAX_PHOTOS);
    const photoResults = await Promise.all(
      photoDescriptors.map(async (photo, i) => {
        const key = `providers/${id}/photo-${i}.webp`;
        try {
          if (await r2Exists(key)) {
            stats.photosSkipped++;
            return { url: `${R2_PUBLIC_URL}/${key}`, widthPx: 0, heightPx: 0, attributions: [] };
          }
          const { buffer } = await downloadPhoto(photo.name);
          const opt = await optimizePhoto(buffer);
          const url = await r2Upload(key, opt.buffer, opt.contentType);
          stats.photosDownloaded++;
          return {
            url,
            widthPx: opt.widthPx,
            heightPx: opt.heightPx,
            bytes: opt.bytes,
            format: "webp",
            attributions: (photo.authorAttributions || []).map((a) => ({ displayName: a.displayName || "", uri: a.uri || "" })),
          };
        } catch (err) {
          stats.photosFailed++;
          log(`  photo ${i} fail for ${id}: ${err.message}`);
          return null;
        }
      })
    );
    const galleryPhotos = photoResults.filter(Boolean);
    const coverImageUrl = galleryPhotos[0]?.url || null;

    const reviews = (place.reviews || []).slice(0, MAX_REVIEWS).map((r) => ({
      rating: r.rating,
      text: r.text || null,
      originalText: r.originalText || null,
      authorAttribution: r.authorAttribution || null,
      publishTime: r.publishTime || null,
      relativePublishTimeDescription: r.relativePublishTimeDescription || null,
    }));

    // Derive operating_hours legacy shape from weekdayDescriptions if present
    const weekdayDescriptions =
      place.regularOpeningHours?.weekdayDescriptions ||
      place.currentOpeningHours?.weekdayDescriptions ||
      null;
    const operatingHours = weekdayDescriptions
      ? { weekdayDescriptions, source: "google_places" }
      : null;

    // Derive is_24_hours from descriptions
    const is24Hours = !!(
      weekdayDescriptions &&
      weekdayDescriptions.length > 0 &&
      weekdayDescriptions.every((d) => /open 24 hours/i.test(d))
    );

    // Coordinates (clamp to numeric(10,7))
    const lat = place.location?.latitude != null ? Number(place.location.latitude.toFixed(7)) : null;
    const lng = place.location?.longitude != null ? Number(place.location.longitude.toFixed(7)) : null;

    // Arabic name if Google's displayName came back in Arabic
    const nameAr =
      place.displayName?.languageCode === "ar" ? place.displayName.text : null;

    await pool.query(
      `UPDATE providers SET
         google_place_id              = $1,
         google_place_details         = $2,
         gallery_photos               = $3,
         google_reviews               = $4,
         google_reviews_last_fetched  = NOW(),
         editorial_summary            = $5,
         editorial_summary_lang       = $6,
         accessibility_options        = $7,
         google_types                 = $8,
         plus_code_global             = $9,
         plus_code_compound           = $10,
         google_maps_uri              = $11,
         price_level                  = $12,
         opening_hours_periods        = $13,
         current_opening_hours        = $14,
         operating_hours              = COALESCE($15, operating_hours),
         is_24_hours                  = COALESCE($16, is_24_hours),
         address_components           = $17,
         business_status              = COALESCE($18, business_status),
         google_fetched_at            = NOW(),
         cover_image_url              = COALESCE($19, cover_image_url),
         google_photo_url             = COALESCE($20, google_photo_url),
         google_rating                = COALESCE($21, google_rating),
         google_review_count          = COALESCE($22, google_review_count),
         latitude                     = COALESCE($23, latitude),
         longitude                    = COALESCE($24, longitude),
         name_ar                      = COALESCE(NULLIF(name_ar, ''), $25),
         address                      = COALESCE(NULLIF(address, ''), $26),
         website                      = COALESCE(NULLIF(website, ''), $27),
         phone                        = COALESCE(NULLIF(phone, ''), $28),
         phone_secondary              = COALESCE(NULLIF(phone_secondary, ''), $29),
         updated_at                   = NOW()
       WHERE id = $30`,
      [
        topId,
        JSON.stringify(place),
        JSON.stringify(galleryPhotos),
        JSON.stringify(reviews),
        place.editorialSummary?.text || null,
        place.editorialSummary?.languageCode || null,
        place.accessibilityOptions ? JSON.stringify(place.accessibilityOptions) : null,
        JSON.stringify(place.types || []),
        place.plusCode?.globalCode || null,
        place.plusCode?.compoundCode || null,
        place.googleMapsUri || null,
        place.priceLevel || null,
        place.regularOpeningHours?.periods ? JSON.stringify(place.regularOpeningHours.periods) : null,
        place.currentOpeningHours ? JSON.stringify(place.currentOpeningHours) : null,
        operatingHours ? JSON.stringify(operatingHours) : null,
        is24Hours,
        place.addressComponents ? JSON.stringify(place.addressComponents) : null,
        place.businessStatus || null,
        coverImageUrl,
        coverImageUrl, // legacy google_photo_url alias
        place.rating || null,
        place.userRatingCount || null,
        lat,
        lng,
        nameAr,
        place.formattedAddress || null,
        place.websiteUri || null,
        place.internationalPhoneNumber || null,
        place.nationalPhoneNumber && place.nationalPhoneNumber !== place.internationalPhoneNumber
          ? place.nationalPhoneNumber
          : null,
        id,
      ]
    );

    stats.success++;

    if (stats.success % 5 === 0 || stats.success === stats.total) {
      const cost =
        stats.searchCalls * COST_SEARCH_USD +
        stats.detailsCalls * COST_DETAILS_USD +
        stats.photosDownloaded * COST_PHOTO_USD;
      const elapsed = ((Date.now() - stats.startedAt) / 1000).toFixed(0);
      const rate = (stats.success / (elapsed || 1)).toFixed(1);
      log(
        `✓ [${stats.success}/${stats.total}] ${name.slice(0, 40)} — ${galleryPhotos.length}ph ${reviews.length}rv | $${cost.toFixed(2)} | ${rate}/s | ${elapsed}s`
      );
    }
  } catch (err) {
    stats.failed++;
    stats.failures.push({ id, name, error: err.message });
    log(`✗ ${name} (${id}): ${err.message}`);
  }

  await sleep(50);
}

async function runPool(items, worker, concurrency) {
  const queue = [...items];
  const workers = Array.from({ length: concurrency }, async () => {
    while (queue.length > 0) {
      const item = queue.shift();
      if (!item) return;
      await worker(item);
    }
  });
  await Promise.all(workers);
}

async function main() {
  log(`═══════════════════════════════════════════════════════════════════`);
  log(`Thicken thin GCC providers — run ${RUN_ID}`);
  log(`═══════════════════════════════════════════════════════════════════`);
  log(`Mode:        ${TEST_MODE ? "TEST (5)" : "FULL"}${DRY_RUN ? " [DRY RUN]" : ""}`);
  log(`Countries:   ${COUNTRIES.join(", ")}`);
  log(`Categories:  ${CATEGORIES.join(", ")}`);
  log(`Limit:       ${LIMIT}`);
  log(`Concurrency: ${CONCURRENCY}`);
  log(``);

  // "Thin" = no description AND no gallery photos. Many providers already have
  // a google_place_id from a prior incomplete enrichment — we still want to
  // re-fetch details for them, so we skip the search step in processOne when
  // an existing place_id is present.
  // google_fetched_at IS NULL acts as a resume guard so re-runs skip what's done.
  const { rows } = await pool.query(
    `SELECT id, name, slug, address, city_slug, category_slug, country, google_place_id
     FROM providers
     WHERE country = ANY($1)
       AND category_slug = ANY($2)
       AND status = 'active'
       AND COALESCE(description, '') = ''
       AND jsonb_array_length(COALESCE(gallery_photos, '[]'::jsonb)) = 0
       AND google_fetched_at IS NULL
     ORDER BY country, city_slug, name
     LIMIT $3`,
    [COUNTRIES, CATEGORIES, LIMIT]
  );

  log(`Found ${rows.length} thin providers to process`);
  log(``);

  if (rows.length === 0) {
    log("Nothing to do.");
    await pool.end();
    return;
  }

  const stats = {
    total: rows.length,
    success: 0,
    failed: 0,
    noMatch: 0,
    drift: 0,
    preExistingPid: 0,
    searchCalls: 0,
    detailsCalls: 0,
    photosDownloaded: 0,
    photosSkipped: 0,
    photosFailed: 0,
    failures: [],
    noMatches: [],
    startedAt: Date.now(),
  };

  await runPool(rows, (row) => processOne(row, stats), CONCURRENCY);

  const elapsed = ((Date.now() - stats.startedAt) / 1000).toFixed(1);
  const cost =
    stats.searchCalls * COST_SEARCH_USD +
    stats.detailsCalls * COST_DETAILS_USD +
    stats.photosDownloaded * COST_PHOTO_USD;

  log(``);
  log(`═══════════════════════════════════════════════════════════════════`);
  log(`DONE in ${elapsed}s`);
  log(`═══════════════════════════════════════════════════════════════════`);
  log(`  Providers OK:        ${stats.success}/${stats.total}`);
  log(`  Pre-existing PID:    ${stats.preExistingPid} (skipped search)`);
  log(`  No match (skipped):  ${stats.noMatch}`);
  log(`  PID drift skipped:   ${stats.drift}`);
  log(`  Failures:            ${stats.failed}`);
  log(`  Search calls:        ${stats.searchCalls}`);
  log(`  Details calls:       ${stats.detailsCalls}`);
  log(`  Photos downloaded:   ${stats.photosDownloaded}`);
  log(`  Photos skipped:      ${stats.photosSkipped}`);
  log(`  Photos failed:       ${stats.photosFailed}`);
  log(`  Estimated cost:      $${cost.toFixed(2)}`);

  if (stats.failures.length) {
    fs.writeFileSync(FAILED_FILE, JSON.stringify(stats.failures, null, 2));
    log(`  Failures → ${FAILED_FILE}`);
  }
  if (stats.noMatches.length) {
    fs.writeFileSync(NO_MATCH_FILE, JSON.stringify(stats.noMatches, null, 2));
    log(`  No-matches → ${NO_MATCH_FILE}`);
  }

  await pool.end();
}

main().catch((err) => {
  log(`FATAL: ${err.stack || err.message}`);
  process.exit(1);
});
