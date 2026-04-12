#!/usr/bin/env node
/**
 * Upload DHA professional headshots from local disk → Cloudflare R2
 *
 * Reads all .jpg files from data/photos/dha/, uploads to R2 at
 * professionals/dha/{dhaUniqueId}.jpg, then patches the enriched JSON
 * with the public R2 URLs.
 *
 * Resumable: skips files already present in R2 (HeadObject check).
 *
 * Usage:
 *   cd /path/to/project
 *   node scripts/upload-dha-photos-to-r2.mjs
 *   node scripts/upload-dha-photos-to-r2.mjs --dry-run   # count only
 *   node scripts/upload-dha-photos-to-r2.mjs --limit 50  # test with 50
 */

import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");

// ── Config from .env.local ──────────────────────────────────────────────────
// Load .env.local manually (no dotenv dependency needed)
const envPath = path.join(PROJECT_ROOT, ".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const R2_ACCESS_KEY_ID     = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_ENDPOINT          = process.env.R2_ENDPOINT;
const R2_BUCKET            = process.env.R2_BUCKET;
const R2_PUBLIC_URL        = process.env.R2_PUBLIC_URL?.replace(/\/$/, "");

if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET || !R2_PUBLIC_URL) {
  console.error("Missing R2_* env vars. Ensure .env.local has R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_URL");
  process.exit(1);
}

const PHOTO_DIR     = path.join(PROJECT_ROOT, "data/photos/dha");
const ENRICHED_JSON = path.join(PROJECT_ROOT, "data/parsed/dha_professionals_enriched.json");
const CONCURRENCY   = 15;
const R2_PREFIX     = "professionals/dha";

// ── CLI flags ───────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const limitIdx = args.indexOf("--limit");
const LIMIT = limitIdx >= 0 ? parseInt(args[limitIdx + 1], 10) : Infinity;

// ── S3 client ───────────────────────────────────────────────────────────────
const s3 = new S3Client({
  region: "auto",
  endpoint: R2_ENDPOINT,
  credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
});

// ── Helpers ─────────────────────────────────────────────────────────────────
async function existsInR2(key) {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: R2_BUCKET, Key: key }));
    return true;
  } catch {
    return false;
  }
}

async function uploadOne(filePath, key) {
  const body = fs.readFileSync(filePath);
  await s3.send(new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    Body: body,
    ContentType: "image/jpeg",
    CacheControl: "public, max-age=31536000, immutable",
  }));
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  // 1. List all .jpg files
  const allFiles = fs.readdirSync(PHOTO_DIR).filter(f => f.endsWith(".jpg"));
  const files = allFiles.slice(0, LIMIT);

  console.log(`Found ${allFiles.length} photos in ${PHOTO_DIR}`);
  if (LIMIT < Infinity) console.log(`Limiting to ${files.length} (--limit ${LIMIT})`);
  if (DRY_RUN) { console.log("DRY RUN — no uploads."); return; }

  const stats = { uploaded: 0, skipped: 0, failed: 0, failures: [] };
  const total = files.length;
  const startTime = Date.now();

  // 2. Upload in batches
  for (let i = 0; i < total; i += CONCURRENCY) {
    const batch = files.slice(i, i + CONCURRENCY);

    await Promise.all(batch.map(async (filename) => {
      const dhaId = filename.replace(".jpg", "");
      const key = `${R2_PREFIX}/${dhaId}.jpg`;
      const filePath = path.join(PHOTO_DIR, filename);

      try {
        if (await existsInR2(key)) {
          stats.skipped++;
          return;
        }
        await uploadOne(filePath, key);
        stats.uploaded++;
      } catch (e) {
        stats.failed++;
        stats.failures.push({ dhaId, error: e.message });
      }
    }));

    const done = Math.min(i + CONCURRENCY, total);
    if (done % 500 < CONCURRENCY || done === total) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const rate = (done / (elapsed || 1)).toFixed(1);
      console.log(`[${elapsed}s] ${done}/${total} — ✓${stats.uploaded} skipped:${stats.skipped} ✗${stats.failed} (${rate}/s)`);
    }
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n=== DONE in ${totalTime}s ===`);
  console.log(`  Uploaded:  ${stats.uploaded}`);
  console.log(`  Skipped:   ${stats.skipped} (already in R2)`);
  console.log(`  Failed:    ${stats.failed}`);

  if (stats.failures.length > 0) {
    const failPath = path.join(PROJECT_ROOT, "data/dha-photo-upload-failures.json");
    fs.writeFileSync(failPath, JSON.stringify(stats.failures, null, 2));
    console.log(`  Failures written to: ${failPath}`);
  }

  // 3. Patch enriched JSON with R2 URLs
  console.log("\nPatching enriched JSON with R2 URLs...");
  const enriched = JSON.parse(fs.readFileSync(ENRICHED_JSON, "utf-8"));

  let patched = 0;
  // The JSON could be either an object keyed by dhaUniqueId or an array
  const isArray = Array.isArray(enriched);
  const records = isArray ? enriched : Object.values(enriched);

  for (const record of records) {
    if (record.photoPath && record.photoPath !== "") {
      const dhaId = record.dhaUniqueId || path.basename(record.photoPath, ".jpg");
      const r2Url = `${R2_PUBLIC_URL}/${R2_PREFIX}/${dhaId}.jpg`;
      record.photoR2Url = r2Url;
      patched++;
    }
  }

  fs.writeFileSync(ENRICHED_JSON, JSON.stringify(isArray ? records : enriched, null, 2));
  console.log(`Patched ${patched} records with photoR2Url field.`);
  console.log("Done.");
}

main().catch((e) => {
  console.error(`FATAL: ${e.message}`);
  process.exit(1);
});
