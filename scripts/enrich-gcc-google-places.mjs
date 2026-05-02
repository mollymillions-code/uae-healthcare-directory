#!/usr/bin/env node
/**
 * Google Places Details Enrichment for GCC Providers
 *
 * Enriches existing GCC providers (QA, SA, BH, KW) that have a google_place_id
 * but are missing phone, website, operating hours, reviews, or Google photo ref.
 *
 * Uses the Google Places Details API with field masks to minimize cost:
 *   - formatted_phone_number, international_phone_number
 *   - website
 *   - opening_hours (weekday_text)
 *   - reviews (top 5)
 *   - google_photo_url (primary photo reference only; never public photos)
 *
 * Cost: ~$0.017 per request (Place Details with Basic + Contact + Atmosphere fields)
 * Rate limit: 200ms between requests (5 QPS, well within 10 QPS limit)
 *
 * Usage:
 *   GOOGLE_PLACES_API_KEY=<key> node scripts/enrich-gcc-google-places.mjs
 *   GOOGLE_PLACES_API_KEY=<key> node scripts/enrich-gcc-google-places.mjs --country sa
 *   GOOGLE_PLACES_API_KEY=<key> node scripts/enrich-gcc-google-places.mjs --country qa --dry-run
 *   GOOGLE_PLACES_API_KEY=<key> node scripts/enrich-gcc-google-places.mjs --batch-size 50
 */

import pg from "pg";
const { Pool } = pg;
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// ── Configuration ────────────────────────────────────────────────────────────

const GCC_COUNTRIES = ["qa", "sa", "bh", "kw"];
const RATE_LIMIT_MS = 200; // 200ms between requests = 5 QPS
const DEFAULT_BATCH_SIZE = 100;
const PROGRESS_INTERVAL = 50;

const PLACES_DETAILS_URL =
  "https://maps.googleapis.com/maps/api/place/details/json";
const PLACES_FIELDS = [
  "formatted_phone_number",
  "international_phone_number",
  "website",
  "opening_hours",
  "reviews",
  "photos",
].join(",");

// ── Environment & CLI Args ───────────────────────────────────────────────────

function loadEnv() {
  const envPath = join(ROOT, ".env.local");
  try {
    const content = readFileSync(envPath, "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIndex = trimmed.indexOf("=");
      if (eqIndex === -1) continue;
      const key = trimmed.slice(0, eqIndex).trim();
      let val = trimmed.slice(eqIndex + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  } catch {
    // .env.local not found — rely on environment variables
  }
}

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    country: null,
    dryRun: false,
    batchSize: DEFAULT_BATCH_SIZE,
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--country" && args[i + 1]) {
      const c = args[i + 1].toLowerCase();
      if (!GCC_COUNTRIES.includes(c)) {
        console.error(
          `Invalid country: ${c}. Must be one of: ${GCC_COUNTRIES.join(", ")}`
        );
        process.exit(1);
      }
      opts.country = c;
      i++;
    } else if (args[i] === "--dry-run") {
      opts.dryRun = true;
    } else if (args[i] === "--batch-size" && args[i + 1]) {
      opts.batchSize = parseInt(args[i + 1], 10);
      if (isNaN(opts.batchSize) || opts.batchSize < 1) {
        console.error("Invalid batch size. Must be a positive integer.");
        process.exit(1);
      }
      i++;
    } else if (args[i] === "--help" || args[i] === "-h") {
      console.log(`
Google Places Details Enrichment for GCC Providers

Usage:
  GOOGLE_PLACES_API_KEY=<key> node scripts/enrich-gcc-google-places.mjs [options]

Options:
  --country <code>    Enrich only one country (qa, sa, bh, kw)
  --batch-size <n>    Process N providers per batch (default: ${DEFAULT_BATCH_SIZE})
  --dry-run           Query providers but don't call API or update DB
  -h, --help          Show this help message
      `);
      process.exit(0);
    }
  }

  return opts;
}

// ── Database ─────────────────────────────────────────────────────────────────

let pool = null;

function getPool() {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is not set. Check .env.local or env vars.");
    }
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
  }
  return pool;
}

/**
 * Fetch providers that need enrichment:
 *   - country IN GCC countries
 *   - google_place_id IS NOT NULL
 *   - phone IS NULL OR website IS NULL (missing contact data)
 *   - Skip providers that already have BOTH phone AND website (already enriched)
 */
async function getProvidersToEnrich(country = null) {
  const db = getPool();

  const countries = country ? [country] : GCC_COUNTRIES;
  const placeholders = countries.map((_, i) => `$${i + 1}`).join(", ");

  const query = `
    SELECT id, name, google_place_id, phone, website, operating_hours, review_summary, photos, google_photo_url
    FROM providers
    WHERE country IN (${placeholders})
      AND google_place_id IS NOT NULL
      AND (phone IS NULL OR website IS NULL)
    ORDER BY country, name
  `;

  const result = await db.query(query, countries);
  return result.rows;
}

/**
 * Update a provider with enriched data from Google Places.
 */
async function updateProvider(providerId, data) {
  const db = getPool();

  const setClauses = [];
  const values = [];
  let paramIdx = 1;

  if (data.phone !== undefined) {
    setClauses.push(`phone = $${paramIdx++}`);
    values.push(data.phone);
  }
  if (data.website !== undefined) {
    setClauses.push(`website = $${paramIdx++}`);
    values.push(data.website);
  }
  if (data.operatingHours !== undefined) {
    setClauses.push(`operating_hours = $${paramIdx++}`);
    values.push(JSON.stringify(data.operatingHours));
  }
  if (data.reviewSummary !== undefined) {
    setClauses.push(`review_summary = $${paramIdx++}`);
    values.push(JSON.stringify(data.reviewSummary));
  }
  if (data.googlePhotoUrl !== undefined) {
    setClauses.push(`google_photo_url = $${paramIdx++}`);
    values.push(data.googlePhotoUrl);
  }

  // Always update the timestamp
  setClauses.push(`updated_at = NOW()`);

  if (setClauses.length <= 1) return false; // Only timestamp, nothing to update

  values.push(providerId);
  const query = `
    UPDATE providers
    SET ${setClauses.join(", ")}
    WHERE id = $${paramIdx}
  `;

  await db.query(query, values);
  return true;
}

// ── Google Places API ────────────────────────────────────────────────────────

/**
 * Call Google Places Details API for a single place ID.
 * Returns the parsed result or null on failure.
 */
async function fetchPlaceDetails(placeId, apiKey) {
  const url = new URL(PLACES_DETAILS_URL);
  url.searchParams.set("place_id", placeId);
  url.searchParams.set("fields", PLACES_FIELDS);
  url.searchParams.set("key", apiKey);

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const body = await response.json();

  if (body.status === "OK") {
    return body.result;
  }

  if (body.status === "NOT_FOUND" || body.status === "INVALID_REQUEST") {
    // Place no longer exists or ID is invalid — skip silently
    return null;
  }

  if (body.status === "OVER_QUERY_LIMIT") {
    throw new Error("OVER_QUERY_LIMIT — API quota exceeded. Stop and retry later.");
  }

  if (body.status === "REQUEST_DENIED") {
    throw new Error(
      `REQUEST_DENIED — ${body.error_message || "Check your API key and enabled APIs."}`
    );
  }

  // Unknown status
  console.warn(`  Unexpected API status: ${body.status} — ${body.error_message || ""}`);
  return null;
}

/**
 * Parse Google Places opening_hours.weekday_text into the DB schema format.
 *
 * Google returns: ["Monday: 9:00 AM – 9:00 PM", "Tuesday: 9:00 AM – 9:00 PM", ...]
 * DB schema expects: { "Monday": { "open": "9:00 AM", "close": "9:00 PM" }, ... }
 *
 * Handles "Closed" and "Open 24 hours" cases.
 */
function parseOperatingHours(openingHours) {
  if (!openingHours || !openingHours.weekday_text) return null;

  const hours = {};
  for (const entry of openingHours.weekday_text) {
    // Format: "Monday: 9:00 AM – 9:00 PM" or "Monday: Closed" or "Monday: Open 24 hours"
    const colonIdx = entry.indexOf(": ");
    if (colonIdx === -1) continue;

    const day = entry.slice(0, colonIdx).trim();
    const timeStr = entry.slice(colonIdx + 2).trim();

    if (timeStr.toLowerCase() === "closed") {
      hours[day] = { open: "Closed", close: "Closed" };
    } else if (timeStr.toLowerCase() === "open 24 hours") {
      hours[day] = { open: "12:00 AM", close: "11:59 PM" };
    } else {
      // Split on en-dash (–) or hyphen (-)
      const parts = timeStr.split(/\s*[–\-]\s*/);
      if (parts.length === 2) {
        hours[day] = { open: parts[0].trim(), close: parts[1].trim() };
      } else {
        // Multiple periods (e.g., "9:00 AM – 1:00 PM, 4:00 PM – 9:00 PM")
        // Take the full span: first open to last close
        const allParts = timeStr.split(/\s*,\s*/);
        if (allParts.length > 0) {
          const firstPeriod = allParts[0].split(/\s*[–\-]\s*/);
          const lastPeriod = allParts[allParts.length - 1].split(/\s*[–\-]\s*/);
          hours[day] = {
            open: firstPeriod[0]?.trim() || timeStr,
            close: lastPeriod[lastPeriod.length - 1]?.trim() || timeStr,
          };
        }
      }
    }
  }

  return Object.keys(hours).length > 0 ? hours : null;
}

/**
 * Extract review summary as bullet points (first sentence of top reviews).
 * Takes up to 5 reviews, extracts the first sentence of each.
 */
function extractReviewSummary(reviews) {
  if (!reviews || reviews.length === 0) return null;

  const summaries = [];
  const topReviews = reviews
    .filter((r) => r.text && r.text.trim().length > 0)
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 5);

  for (const review of topReviews) {
    const text = review.text.trim();
    // Extract first sentence (split on period, exclamation, or question mark)
    const match = text.match(/^(.+?[.!?])\s/);
    const sentence = match ? match[1] : text.slice(0, 150);
    // Clean up and add
    const clean = sentence.replace(/\n/g, " ").trim();
    if (clean.length > 10) {
      summaries.push(clean);
    }
  }

  return summaries.length > 0 ? summaries : null;
}

/**
 * Extract the primary Google photo reference without publishing it as a photo URL.
 */
function extractPrimaryPhotoRef(photos) {
  if (!photos || photos.length === 0) return null;

  return photos[0]?.photo_reference || null;
}

// ── Rate Limiter ─────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Main Enrichment Loop ─────────────────────────────────────────────────────

async function main() {
  loadEnv();
  const opts = parseArgs();

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey && !opts.dryRun) {
    console.error(
      "GOOGLE_PLACES_API_KEY is not set. Set it via env var or .env.local"
    );
    process.exit(1);
  }

  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║   Google Places Details Enrichment — GCC Providers          ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");
  console.log();

  if (opts.dryRun) {
    console.log("  Mode: DRY RUN (no API calls, no DB updates)");
  }
  if (opts.country) {
    console.log(`  Country filter: ${opts.country.toUpperCase()}`);
  } else {
    console.log(`  Countries: ${GCC_COUNTRIES.map((c) => c.toUpperCase()).join(", ")}`);
  }
  console.log(`  Batch size: ${opts.batchSize}`);
  console.log(`  Rate limit: ${RATE_LIMIT_MS}ms between requests`);
  console.log();

  // Fetch providers to enrich
  console.log("Querying providers that need enrichment...");
  const providers = await getProvidersToEnrich(opts.country);
  console.log(`  Found ${providers.length} providers with google_place_id but missing phone/website`);
  console.log();

  if (providers.length === 0) {
    console.log("Nothing to enrich. All providers already have phone + website.");
    await cleanup();
    return;
  }

  // Estimate cost
  const estimatedCost = (providers.length * 0.017).toFixed(2);
  console.log(`  Estimated API cost: ~$${estimatedCost} (${providers.length} requests × $0.017)`);
  console.log();

  if (opts.dryRun) {
    // Show sample of what would be enriched
    console.log("Sample providers (first 10):");
    for (const p of providers.slice(0, 10)) {
      console.log(
        `  - ${p.name} | placeId: ${p.google_place_id?.slice(0, 20)}... | phone: ${p.phone || "MISSING"} | website: ${p.website || "MISSING"}`
      );
    }
    console.log();
    console.log("Dry run complete. No changes made.");
    await cleanup();
    return;
  }

  // Process in batches
  const totalBatches = Math.ceil(providers.length / opts.batchSize);
  let enriched = 0;
  let skipped = 0;
  let failed = 0;
  let apiErrors = 0;

  const stats = {
    phoneFilled: 0,
    websiteFilled: 0,
    hoursFilled: 0,
    reviewsFilled: 0,
    photosFilled: 0,
  };

  const startTime = Date.now();

  for (let batchIdx = 0; batchIdx < totalBatches; batchIdx++) {
    const batchStart = batchIdx * opts.batchSize;
    const batchEnd = Math.min(batchStart + opts.batchSize, providers.length);
    const batch = providers.slice(batchStart, batchEnd);

    console.log(
      `\n── Batch ${batchIdx + 1}/${totalBatches} (providers ${batchStart + 1}–${batchEnd}) ──`
    );

    for (let i = 0; i < batch.length; i++) {
      const provider = batch[i];
      const globalIdx = batchStart + i + 1;

      try {
        // Call Google Places Details API
        const details = await fetchPlaceDetails(provider.google_place_id, apiKey);

        if (!details) {
          skipped++;
          if (globalIdx % PROGRESS_INTERVAL === 0) {
            console.log(
              `[${globalIdx}/${providers.length}] Skipped ${provider.name} — place not found`
            );
          }
          await sleep(RATE_LIMIT_MS);
          continue;
        }

        // Parse the response into our DB format
        const updateData = {};
        let hasNewData = false;

        // Phone: only update if provider doesn't already have one
        if (!provider.phone && details.international_phone_number) {
          updateData.phone = details.international_phone_number;
          stats.phoneFilled++;
          hasNewData = true;
        } else if (!provider.phone && details.formatted_phone_number) {
          updateData.phone = details.formatted_phone_number;
          stats.phoneFilled++;
          hasNewData = true;
        }

        // Website: only update if provider doesn't already have one
        if (!provider.website && details.website) {
          updateData.website = details.website;
          stats.websiteFilled++;
          hasNewData = true;
        }

        // Operating hours: update if provider doesn't have valid hours
        const existingHours = provider.operating_hours;
        const hasValidHours =
          existingHours &&
          typeof existingHours === "object" &&
          Object.keys(existingHours).length > 0;

        if (!hasValidHours) {
          const parsedHours = parseOperatingHours(details.opening_hours);
          if (parsedHours) {
            updateData.operatingHours = parsedHours;
            stats.hoursFilled++;
            hasNewData = true;
          }
        }

        // Review summary: update if provider doesn't have reviews
        const existingReviews = provider.review_summary;
        const hasReviews =
          existingReviews &&
          Array.isArray(existingReviews) &&
          existingReviews.length > 0;

        if (!hasReviews) {
          const summaries = extractReviewSummary(details.reviews);
          if (summaries) {
            updateData.reviewSummary = summaries;
            stats.reviewsFilled++;
            hasNewData = true;
          }
        }

        // Photo references are internal data only. Do not write them into
        // photos, which is rendered directly on directory pages.
        const hasPhotoRef = Boolean(provider.google_photo_url);

        if (!hasPhotoRef) {
          const photoRef = extractPrimaryPhotoRef(details.photos);
          if (photoRef) {
            updateData.googlePhotoUrl = photoRef;
            stats.photosFilled++;
            hasNewData = true;
          }
        }

        // Write to DB
        if (hasNewData) {
          await updateProvider(provider.id, updateData);
          enriched++;
        } else {
          skipped++;
        }

        // Progress log every N providers
        if (globalIdx % PROGRESS_INTERVAL === 0 || globalIdx === providers.length) {
          const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
          console.log(
            `[${globalIdx}/${providers.length}] Enriched ${provider.name} — ` +
              `phone: ${updateData.phone ? "yes" : "no"}, ` +
              `website: ${updateData.website ? "yes" : "no"}, ` +
              `hours: ${updateData.operatingHours ? "yes" : "no"} ` +
              `(${elapsed}s elapsed)`
          );
        }
      } catch (err) {
        failed++;
        apiErrors++;

        // Fatal errors — stop immediately
        if (
          err.message.includes("OVER_QUERY_LIMIT") ||
          err.message.includes("REQUEST_DENIED")
        ) {
          console.error(`\nFATAL: ${err.message}`);
          console.error(
            `Stopping after ${enriched} enriched, ${failed} failed.`
          );
          await printSummary(enriched, skipped, failed, stats, startTime, providers.length);
          await cleanup();
          process.exit(1);
        }

        // Non-fatal — log and continue
        if (apiErrors <= 10 || apiErrors % 50 === 0) {
          console.warn(
            `  [${globalIdx}/${providers.length}] Error for ${provider.name}: ${err.message}`
          );
        }

        // Back off on repeated errors
        if (apiErrors > 5) {
          const backoffMs = Math.min(apiErrors * 500, 10000);
          await sleep(backoffMs);
        }
      }

      // Rate limit between requests
      await sleep(RATE_LIMIT_MS);
    }

    // Batch complete log
    console.log(
      `  Batch ${batchIdx + 1} complete: ${enriched} enriched, ${skipped} skipped, ${failed} failed so far`
    );
  }

  // Final summary
  await printSummary(enriched, skipped, failed, stats, startTime, providers.length);
  await cleanup();
}

async function printSummary(enriched, skipped, failed, stats, startTime, total) {
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const cost = (enriched * 0.017).toFixed(2);

  console.log("\n╔══════════════════════════════════════════════════════════════╗");
  console.log("║                    Enrichment Summary                       ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");
  console.log(`  Total providers queried:  ${total}`);
  console.log(`  Successfully enriched:    ${enriched}`);
  console.log(`  Skipped (no new data):    ${skipped}`);
  console.log(`  Failed (API errors):      ${failed}`);
  console.log(`  Time elapsed:             ${elapsed}s`);
  console.log(`  Estimated API cost:       ~$${cost}`);
  console.log();
  console.log("  Fields filled:");
  console.log(`    Phone numbers:          ${stats.phoneFilled}`);
  console.log(`    Websites:               ${stats.websiteFilled}`);
  console.log(`    Operating hours:        ${stats.hoursFilled}`);
  console.log(`    Review summaries:       ${stats.reviewsFilled}`);
  console.log(`    Photo references:       ${stats.photosFilled}`);
  console.log();
}

async function cleanup() {
  if (pool) {
    await pool.end();
  }
}

// ── Run ──────────────────────────────────────────────────────────────────────

main().catch(async (err) => {
  console.error("Fatal error:", err);
  await cleanup();
  process.exit(1);
});
