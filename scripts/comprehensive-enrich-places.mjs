#!/usr/bin/env node
/**
 * Comprehensive Google Places (New API) enrichment — ONE-TIME download of everything
 * the Places API offers into our DB + R2, so the site has ZERO runtime dependency on Google.
 *
 * What this does per provider:
 *   1. GET places.googleapis.com/v1/places/{id} with X-Goog-FieldMask: * (all fields)
 *   2. Parallel-download every photo (up to 10) at maxWidthPx=1600
 *   3. Normalize + compress each photo to WebP at upload time
 *   4. Upload each photo to R2 at providers/{id}/photo-{N}.webp (idempotent via HEAD)
 *   5. Store raw full response + extracted fields + R2 gallery URLs in DB in a single UPDATE
 *
 * Next image optimization is disabled in production, so this script must
 * write browser-ready assets. Do not upload raw Google bytes to provider
 * listings; those are often too heavy for cards/detail mosaics.
 *
 * GOOGLE TOS NOTE:
 *   Google Places TOS §3.2.4(b) prohibits permanent caching of Places content (photos, reviews).
 *   Enforcement is rare for small users, but risk exists. Mitigations:
 *     - Attribution (authorAttributions) is rendered in the frontend for every photo + review
 *     - "Data from Google Maps" footer on provider pages
 *     - Periodic re-fetch every ~90 days keeps cache "recent"
 *
 * USAGE (on EC2 where DB is localhost):
 *   cd /home/ubuntu/zavis-landing-active
 *   export GOOGLE_PLACES_API_KEY=<key>
 *   source .env.local
 *   node scripts/comprehensive-enrich-places.mjs [--test] [--resume] [--country=ae] [--limit=N] [--dry-run]
 *
 * Flags:
 *   --test          Only process 5 providers (for verification)
 *   --resume        Skip providers where google_fetched_at IS NOT NULL
 *   --dry-run       Report what WOULD be processed, skip API/R2/DB writes
 *   --country=<cc>  Country filter (default: ae)
 *   --limit=<n>     Hard cap on providers processed
 *   --concurrency=N Parallel workers (default: 8)
 */

import pg from "pg";
import fs from "fs";
import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";

const { Pool } = pg;

// ─── Config ────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const TEST_MODE = args.includes("--test");
const RESUME = args.includes("--resume");
const DRY_RUN = args.includes("--dry-run");
const getArg = (name, def) => {
  const a = args.find((x) => x.startsWith(`--${name}=`));
  return a ? a.split("=")[1] : def;
};
const COUNTRY = getArg("country", "ae");
const LIMIT = parseInt(getArg("limit", TEST_MODE ? "5" : "100000"), 10);
const CONCURRENCY = parseInt(getArg("concurrency", "8"), 10);

const PHOTO_WIDTH_PX = 1600; // single canonical size; Cloudflare transforms handle resizing
const MAX_PHOTOS = 10;
const MAX_REVIEWS = 5;
const OUTPUT_IMAGE_WIDTH_PX = 1200;
const OUTPUT_WEBP_QUALITY = 80;

// API pricing (as of 2026-04, Places API New) — for cost tracking only
const COST_PLACE_DETAILS_USD = 0.025; // Enterprise tier (fieldmask *)
const COST_PHOTO_USD = 0.007;

// ─── Env ───────────────────────────────────────────────────────────────────
const {
  GOOGLE_PLACES_API_KEY: API_KEY,
  DATABASE_URL,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_ENDPOINT,
  R2_BUCKET,
} = process.env;
const R2_PUBLIC_URL = (process.env.R2_PUBLIC_URL || "").replace(/\/$/, "");

const missing = [];
if (!API_KEY && !DRY_RUN) missing.push("GOOGLE_PLACES_API_KEY");
if (!DATABASE_URL) missing.push("DATABASE_URL");
if (!R2_ACCESS_KEY_ID && !DRY_RUN) missing.push("R2_ACCESS_KEY_ID");
if (!R2_SECRET_ACCESS_KEY && !DRY_RUN) missing.push("R2_SECRET_ACCESS_KEY");
if (!R2_ENDPOINT && !DRY_RUN) missing.push("R2_ENDPOINT");
if (!R2_BUCKET && !DRY_RUN) missing.push("R2_BUCKET");
if (!R2_PUBLIC_URL && !DRY_RUN) missing.push("R2_PUBLIC_URL");
if (missing.length) {
  console.error(`Missing env vars: ${missing.join(", ")}`);
  process.exit(1);
}

// ─── Clients ───────────────────────────────────────────────────────────────
const pool = new Pool({ connectionString: DATABASE_URL, max: CONCURRENCY + 2 });

const s3 = DRY_RUN
  ? null
  : new S3Client({
      region: "auto",
      endpoint: R2_ENDPOINT,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    });

// ─── Logging ───────────────────────────────────────────────────────────────
const RUN_ID = Date.now();
const LOG_FILE = `/tmp/comprehensive-enrich-${RUN_ID}.log`;
const FAILED_FILE = `/tmp/comprehensive-enrich-${RUN_ID}-failures.json`;
const DRIFT_FILE = `/tmp/comprehensive-enrich-${RUN_ID}-drift.json`;

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(LOG_FILE, line + "\n");
}

// ─── Utilities ─────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function retryWithBackoff(fn, label, attempts = 3) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      const msg = e.message || String(e);
      // Don't retry on permanent errors
      if (msg.includes("403") || msg.includes("API_KEY") || msg.includes("NOT_FOUND")) {
        throw e;
      }
      if (i < attempts - 1) {
        const wait = 1000 * Math.pow(2, i);
        log(`  retry ${label} in ${wait}ms (attempt ${i + 1}/${attempts}): ${msg}`);
        await sleep(wait);
      }
    }
  }
  throw lastErr;
}

// Simple Jaccard similarity for place_id drift detection
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

// ─── R2 helpers ────────────────────────────────────────────────────────────
async function r2KeyExists(key) {
  if (DRY_RUN) return false;
  try {
    await s3.send(new HeadObjectCommand({ Bucket: R2_BUCKET, Key: key }));
    return true;
  } catch {
    return false;
  }
}

async function uploadToR2(key, buffer, contentType) {
  if (DRY_RUN) return `${R2_PUBLIC_URL}/${key}`;
  await s3.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType || "image/jpeg",
      CacheControl: "public, max-age=31536000, immutable",
    })
  );
  return `${R2_PUBLIC_URL}/${key}`;
}

async function optimizeProviderPhoto(buffer) {
  const image = sharp(buffer, { failOn: "none" }).rotate();
  const optimized = await image
    .resize({
      width: OUTPUT_IMAGE_WIDTH_PX,
      height: OUTPUT_IMAGE_WIDTH_PX,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({
      quality: OUTPUT_WEBP_QUALITY,
      effort: 4,
    })
    .toBuffer();

  const metadata = await sharp(optimized).metadata();
  return {
    buffer: optimized,
    contentType: "image/webp",
    widthPx: metadata.width || 0,
    heightPx: metadata.height || 0,
    bytes: optimized.length,
  };
}

// ─── Google Places (New API) ──────────────────────────────────────────────
async function fetchPlaceDetails(placeId) {
  return retryWithBackoff(
    async () => {
      const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`;
      const res = await fetch(url, {
        headers: {
          "X-Goog-Api-Key": API_KEY,
          "X-Goog-FieldMask": "*",
        },
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(
          `${res.status} ${json.error?.status || ""} ${json.error?.message || res.statusText}`
        );
      }
      return json;
    },
    `details(${placeId.slice(0, 12)})`
  );
}

async function downloadPhoto(photoResourceName) {
  return retryWithBackoff(
    async () => {
      const url = `https://places.googleapis.com/v1/${photoResourceName}/media?maxWidthPx=${PHOTO_WIDTH_PX}&key=${API_KEY}`;
      const res = await fetch(url, { redirect: "follow" });
      if (!res.ok) throw new Error(`photo ${res.status} ${res.statusText}`);
      const contentType = res.headers.get("content-type") || "image/jpeg";
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 500) throw new Error(`photo too small (${buf.length}b)`);
      return { buffer: buf, contentType };
    },
    `photo(${photoResourceName.slice(-12)})`
  );
}

// ─── Per-provider processing ──────────────────────────────────────────────
async function processOne(row, stats) {
  const { id, name, google_place_id } = row;

  try {
    if (DRY_RUN) {
      log(`[DRY] would fetch ${name} (${google_place_id})`);
      stats.success++;
      return;
    }

    const place = await fetchPlaceDetails(google_place_id);
    stats.placeDetailsCalls++;

    // Drift check — Google may have merged/replaced the place_id
    const returnedName = place.displayName?.text || "";
    const similarity = jaccard(name, returnedName);
    if (similarity < 0.2) {
      stats.drift++;
      stats.drifts.push({ id, dbName: name, googleName: returnedName, similarity });
      log(`  DRIFT ${id}: "${name}" ↔ "${returnedName}" (sim=${similarity.toFixed(2)}) — skipping write`);
      return;
    }

    // Parallel photo download
    const photoDescriptors = (place.photos || []).slice(0, MAX_PHOTOS);
    const photoResults = await Promise.all(
      photoDescriptors.map(async (photo, i) => {
        const key = `providers/${id}/photo-${i}.webp`;
        try {
          let r2Url;
          let optimizedMeta = null;
          if (await r2KeyExists(key)) {
            r2Url = `${R2_PUBLIC_URL}/${key}`;
            stats.photosSkipped++;
          } else {
            const { buffer } = await downloadPhoto(photo.name);
            optimizedMeta = await optimizeProviderPhoto(buffer);
            r2Url = await uploadToR2(
              key,
              optimizedMeta.buffer,
              optimizedMeta.contentType,
            );
            stats.photosDownloaded++;
          }
          return {
            url: r2Url,
            widthPx: optimizedMeta?.widthPx || photo.widthPx || 0,
            heightPx: optimizedMeta?.heightPx || photo.heightPx || 0,
            ...(optimizedMeta ? { bytes: optimizedMeta.bytes, format: "webp" } : {}),
            attributions: (photo.authorAttributions || []).map((a) => ({
              displayName: a.displayName || "",
              uri: a.uri || "",
            })),
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

    // Extract all the other fields
    const reviews = (place.reviews || []).slice(0, MAX_REVIEWS).map((r) => ({
      rating: r.rating,
      text: r.text || null,
      originalText: r.originalText || null,
      authorAttribution: r.authorAttribution || null,
      publishTime: r.publishTime || null,
      relativePublishTimeDescription: r.relativePublishTimeDescription || null,
    }));

    const editorialSummary = place.editorialSummary?.text || null;
    const editorialSummaryLang = place.editorialSummary?.languageCode || null;
    const accessibilityOptions = place.accessibilityOptions || null;
    const googleTypes = place.types || [];
    const plusCodeGlobal = place.plusCode?.globalCode || null;
    const plusCodeCompound = place.plusCode?.compoundCode || null;
    const googleMapsUri = place.googleMapsUri || null;
    const priceLevel = place.priceLevel || null;
    const openingHoursPeriods = place.regularOpeningHours?.periods || null;
    const currentOpeningHours = place.currentOpeningHours || null;
    const addressComponents = place.addressComponents || null;
    const rating = place.rating || null;
    const ratingCount = place.userRatingCount || null;
    const websiteUri = place.websiteUri || null;
    const internationalPhone = place.internationalPhoneNumber || null;
    const businessStatus = place.businessStatus || null;

    // Single atomic UPDATE. DHA-sourced fields (website, phone) are ONLY filled when empty.
    await pool.query(
      `UPDATE providers SET
         google_place_details   = $1,
         gallery_photos         = $2,
         google_reviews         = $3,
         editorial_summary      = $4,
         editorial_summary_lang = $5,
         accessibility_options  = $6,
         google_types           = $7,
         plus_code_global       = $8,
         plus_code_compound     = $9,
         google_maps_uri        = $10,
         price_level            = $11,
         opening_hours_periods  = $12,
         current_opening_hours  = $13,
         address_components     = $14,
         google_fetched_at      = NOW(),
         cover_image_url        = COALESCE($15, cover_image_url),
         google_rating          = COALESCE($16, google_rating),
         google_review_count    = COALESCE($17, google_review_count),
         website                = COALESCE(NULLIF(website, ''), $18),
         phone                  = COALESCE(NULLIF(phone, ''), $19),
         business_status        = COALESCE($20, business_status),
         updated_at             = NOW()
       WHERE id = $21`,
      [
        JSON.stringify(place),
        JSON.stringify(galleryPhotos),
        JSON.stringify(reviews),
        editorialSummary,
        editorialSummaryLang,
        accessibilityOptions ? JSON.stringify(accessibilityOptions) : null,
        JSON.stringify(googleTypes),
        plusCodeGlobal,
        plusCodeCompound,
        googleMapsUri,
        priceLevel,
        openingHoursPeriods ? JSON.stringify(openingHoursPeriods) : null,
        currentOpeningHours ? JSON.stringify(currentOpeningHours) : null,
        addressComponents ? JSON.stringify(addressComponents) : null,
        coverImageUrl,
        rating,
        ratingCount,
        websiteUri,
        internationalPhone,
        businessStatus,
        id,
      ]
    );

    stats.success++;

    if (stats.success % 10 === 0 || stats.success === stats.total) {
      const costSoFar =
        stats.placeDetailsCalls * COST_PLACE_DETAILS_USD +
        stats.photosDownloaded * COST_PHOTO_USD;
      const elapsed = ((Date.now() - stats.startedAt) / 1000).toFixed(0);
      const rate = (stats.success / (elapsed || 1)).toFixed(1);
      log(
        `✓ [${stats.success}/${stats.total}] ${name.slice(0, 40)} — ${galleryPhotos.length}ph ${reviews.length}rv | ` +
          `${stats.photosDownloaded}dl ${stats.photosSkipped}sk ${stats.photosFailed}fx | ` +
          `$${costSoFar.toFixed(2)} | ${rate}/s | ${elapsed}s`
      );
    }
  } catch (err) {
    stats.failed++;
    stats.failures.push({ id, name, placeId: google_place_id, error: err.message });
    log(`✗ ${name} (${id}): ${err.message}`);
  }

  // Gentle pacing
  await sleep(50);
}

// ─── Concurrency pool ──────────────────────────────────────────────────────
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

// ─── Main ──────────────────────────────────────────────────────────────────
async function main() {
  log(`═══════════════════════════════════════════════════════════════════`);
  log(`Comprehensive Google Places Enrichment — run ${RUN_ID}`);
  log(`═══════════════════════════════════════════════════════════════════`);
  log(`Mode: ${TEST_MODE ? "TEST (5 providers)" : "FULL"}${DRY_RUN ? " [DRY RUN]" : ""}`);
  log(`Country: ${COUNTRY}`);
  log(`Limit: ${LIMIT}`);
  log(`Concurrency: ${CONCURRENCY}`);
  log(`Resume: ${RESUME}`);
  log(``);
  log(`⚠️  TOS NOTE: Permanently caching Google Places photos/reviews is technically`);
  log(`   against §3.2.4(b). Attribution is rendered in the frontend.`);
  log(``);

  const whereResume = RESUME ? "AND google_fetched_at IS NULL" : "";
  const { rows } = await pool.query(
    `SELECT id, name, google_place_id
     FROM providers
     WHERE google_place_id IS NOT NULL
       AND country = $1
       AND status = 'active'
       ${whereResume}
     ORDER BY id
     LIMIT $2`,
    [COUNTRY, LIMIT]
  );

  log(`Found ${rows.length} providers to process`);
  log(``);

  if (rows.length === 0) {
    log("Nothing to do. Exiting.");
    await pool.end();
    return;
  }

  const stats = {
    total: rows.length,
    success: 0,
    failed: 0,
    drift: 0,
    placeDetailsCalls: 0,
    photosDownloaded: 0,
    photosSkipped: 0,
    photosFailed: 0,
    failures: [],
    drifts: [],
    startedAt: Date.now(),
  };

  await runPool(rows, (row) => processOne(row, stats), CONCURRENCY);

  const elapsed = ((Date.now() - stats.startedAt) / 1000).toFixed(1);
  const cost =
    stats.placeDetailsCalls * COST_PLACE_DETAILS_USD + stats.photosDownloaded * COST_PHOTO_USD;

  log(``);
  log(`═══════════════════════════════════════════════════════════════════`);
  log(`DONE in ${elapsed}s`);
  log(`═══════════════════════════════════════════════════════════════════`);
  log(`  Providers OK:         ${stats.success}/${stats.total}`);
  log(`  Providers failed:     ${stats.failed}`);
  log(`  Place_id drift:       ${stats.drift}`);
  log(`  Place Details calls:  ${stats.placeDetailsCalls}`);
  log(`  Photos downloaded:    ${stats.photosDownloaded}`);
  log(`  Photos skipped (R2):  ${stats.photosSkipped}`);
  log(`  Photos failed:        ${stats.photosFailed}`);
  log(`  Estimated cost:       $${cost.toFixed(2)}`);
  log(`    (Place Details: $${(stats.placeDetailsCalls * COST_PLACE_DETAILS_USD).toFixed(2)})`);
  log(`    (Photos:        $${(stats.photosDownloaded * COST_PHOTO_USD).toFixed(2)})`);

  if (stats.failures.length) {
    fs.writeFileSync(FAILED_FILE, JSON.stringify(stats.failures, null, 2));
    log(`  Failures → ${FAILED_FILE}`);
  }
  if (stats.drifts.length) {
    fs.writeFileSync(DRIFT_FILE, JSON.stringify(stats.drifts, null, 2));
    log(`  Drifts → ${DRIFT_FILE}`);
  }

  await pool.end();
}

main().catch((err) => {
  log(`FATAL: ${err.stack || err.message}`);
  process.exit(1);
});
