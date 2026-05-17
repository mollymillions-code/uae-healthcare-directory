#!/usr/bin/env node
/**
 * Convert existing provider R2 JPEG/PNG image URLs to source WebP files.
 *
 * This is separate from Next.js runtime image optimization:
 * - Next serves AVIF/WebP variants via /_next/image for browser requests.
 * - This script rewrites old R2 source URLs to permanent WebP files so any
 *   direct image usage is also lighter.
 *
 * It is idempotent and conservative:
 * - skips URLs that are already WebP
 * - uploads the WebP before updating the provider row
 * - preserves original JPEG/PNG objects in R2
 * - supports --dry-run and small --limit batches
 *
 * Usage:
 *   node scripts/convert-provider-r2-images-to-webp.mjs --dry-run --limit=20
 *   node scripts/convert-provider-r2-images-to-webp.mjs --limit=500 --concurrency=4
 *   node scripts/convert-provider-r2-images-to-webp.mjs --provider-id=dha_00255
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import sharp from "sharp";
import { S3Client, HeadObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";

const { Pool } = pg;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const rawLine of fs.readFileSync(filePath, "utf8").split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (!match || process.env[match[1]]) continue;
    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[match[1]] = value;
  }
}

loadEnvFile(path.join(PROJECT_ROOT, ".env.local"));

const args = process.argv.slice(2);
const hasFlag = (name) => args.includes(`--${name}`);
const getArg = (name, fallback) => {
  const eq = args.find((arg) => arg.startsWith(`--${name}=`));
  if (eq) return eq.slice(name.length + 3);
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const DRY_RUN = hasFlag("dry-run");
const LIMIT = Number.parseInt(getArg("limit", "250"), 10);
const OFFSET = Number.parseInt(getArg("offset", "0"), 10);
const CONCURRENCY = Number.parseInt(getArg("concurrency", "4"), 10);
const COUNTRY = getArg("country", "");
const PROVIDER_ID = getArg("provider-id", "");
const R2_PUBLIC_URL = (process.env.R2_PUBLIC_URL || "").replace(/\/$/, "");
const R2_PUBLIC_HOST = R2_PUBLIC_URL ? new URL(R2_PUBLIC_URL).hostname : "";

const REQUIRED = ["DATABASE_URL", "R2_PUBLIC_URL"];
if (!DRY_RUN) {
  REQUIRED.push("R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_ENDPOINT", "R2_BUCKET");
}
const missing = REQUIRED.filter((key) => !process.env[key]);
if (missing.length) {
  console.error(`Missing env vars: ${missing.join(", ")}`);
  process.exit(1);
}

const SOURCE_EXT_RE = /\.(?:jpe?g|png)$/i;
const SOURCE_URL_RE = /\.(?:jpe?g|png)(?:$|[?#])/i;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: Math.max(2, CONCURRENCY + 1),
});

const s3 = DRY_RUN
  ? null
  : new S3Client({
      region: "auto",
      endpoint: process.env.R2_ENDPOINT,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      },
    });

function isConvertibleR2Url(value) {
  if (typeof value !== "string" || !SOURCE_URL_RE.test(value)) return false;
  try {
    const url = new URL(value);
    return url.hostname === R2_PUBLIC_HOST;
  } catch {
    return false;
  }
}

function r2KeyFromUrl(value) {
  const url = new URL(value);
  return decodeURIComponent(url.pathname.replace(/^\/+/, ""));
}

function webpKeyForUrl(value) {
  return r2KeyFromUrl(value).replace(SOURCE_EXT_RE, ".webp");
}

function publicUrlForKey(key) {
  return `${R2_PUBLIC_URL}/${key}`;
}

async function r2Exists(key) {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: process.env.R2_BUCKET, Key: key }));
    return true;
  } catch {
    return false;
  }
}

async function downloadSource(url) {
  const response = await fetch(url, { redirect: "follow" });
  if (!response.ok) throw new Error(`download ${response.status}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length < 512) throw new Error(`download too small (${buffer.length} bytes)`);
  return buffer;
}

async function toWebp(buffer) {
  return sharp(buffer, { failOn: "none" })
    .rotate()
    .resize({ width: 1600, height: 1200, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 78, effort: 4 })
    .toBuffer();
}

async function uploadWebp(key, buffer) {
  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: "image/webp",
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
}

function collectUrlsFromRow(row) {
  const urls = new Set();
  for (const field of ["cover_image_url", "google_photo_url"]) {
    if (isConvertibleR2Url(row[field])) urls.add(row[field].trim());
  }
  if (Array.isArray(row.photos)) {
    for (const value of row.photos) {
      const url = typeof value === "string" ? value : value?.url;
      if (isConvertibleR2Url(url)) urls.add(url.trim());
    }
  }
  if (Array.isArray(row.gallery_photos)) {
    for (const value of row.gallery_photos) {
      const url = typeof value === "string" ? value : value?.url;
      if (isConvertibleR2Url(url)) urls.add(url.trim());
    }
  }
  return [...urls];
}

function replaceUrlsInValue(value, replacements) {
  if (typeof value === "string") return replacements.get(value.trim()) || value;
  return value;
}

function buildUpdatedMedia(row, replacements) {
  const coverImageUrl = replaceUrlsInValue(row.cover_image_url, replacements);
  const googlePhotoUrl = replaceUrlsInValue(row.google_photo_url, replacements);
  const photos = Array.isArray(row.photos)
    ? row.photos.map((value) => {
        if (typeof value === "string") return replaceUrlsInValue(value, replacements);
        if (value && typeof value === "object" && typeof value.url === "string") {
          return { ...value, url: replaceUrlsInValue(value.url, replacements), format: "webp" };
        }
        return value;
      })
    : row.photos;
  const galleryPhotos = Array.isArray(row.gallery_photos)
    ? row.gallery_photos.map((value) => {
        if (typeof value === "string") return replaceUrlsInValue(value, replacements);
        if (value && typeof value === "object" && typeof value.url === "string") {
          return { ...value, url: replaceUrlsInValue(value.url, replacements), format: "webp" };
        }
        return value;
      })
    : row.gallery_photos;

  return { coverImageUrl, googlePhotoUrl, photos, galleryPhotos };
}

async function queryRows() {
  const filters = [
    `(
      cover_image_url ~* $1
      OR google_photo_url ~* $1
      OR photos::text ~* $1
      OR gallery_photos::text ~* $1
    )`,
  ];
  const params = [`${R2_PUBLIC_HOST.replace(/\./g, "\\.")}.+\\.(jpe?g|png)`];

  if (COUNTRY) {
    params.push(COUNTRY);
    filters.push(`country = $${params.length}`);
  }
  if (PROVIDER_ID) {
    params.push(PROVIDER_ID);
    filters.push(`id = $${params.length}`);
  }

  params.push(LIMIT);
  const limitIdx = params.length;
  params.push(OFFSET);
  const offsetIdx = params.length;

  const result = await pool.query(
    `SELECT id, name, country, city_slug, category_slug,
            cover_image_url, google_photo_url, photos, gallery_photos
       FROM providers
      WHERE ${filters.join(" AND ")}
      ORDER BY country, city_slug, category_slug, id
      LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
    params,
  );
  return result.rows;
}

async function convertUrl(sourceUrl, stats) {
  const targetKey = webpKeyForUrl(sourceUrl);
  const targetUrl = publicUrlForKey(targetKey);

  if (DRY_RUN) {
    stats.plannedUrls++;
    return targetUrl;
  }

  if (await r2Exists(targetKey)) {
    stats.reusedUrls++;
    return targetUrl;
  }

  const sourceBuffer = await downloadSource(sourceUrl);
  const webpBuffer = await toWebp(sourceBuffer);
  await uploadWebp(targetKey, webpBuffer);
  stats.convertedUrls++;
  stats.sourceBytes += sourceBuffer.length;
  stats.webpBytes += webpBuffer.length;
  return targetUrl;
}

async function processProvider(row, stats) {
  const urls = collectUrlsFromRow(row);
  if (!urls.length) return;

  const replacements = new Map();
  for (const sourceUrl of urls) {
    try {
      replacements.set(sourceUrl, await convertUrl(sourceUrl, stats));
    } catch (error) {
      stats.failedUrls++;
      stats.failures.push({ providerId: row.id, sourceUrl, error: error.message });
      console.error(`[fail:url] ${row.id} ${sourceUrl}: ${error.message}`);
    }
  }

  if (replacements.size === 0) return;

  const nextMedia = buildUpdatedMedia(row, replacements);
  if (DRY_RUN) {
    stats.plannedProviders++;
    console.log(`[dry] ${row.id} ${row.name}: ${replacements.size} URL(s) -> WebP`);
    return;
  }

  await pool.query(
    `UPDATE providers
        SET cover_image_url = $2,
            google_photo_url = $3,
            photos = $4::jsonb,
            gallery_photos = $5::jsonb
      WHERE id = $1`,
    [
      row.id,
      nextMedia.coverImageUrl ?? null,
      nextMedia.googlePhotoUrl ?? null,
      nextMedia.photos == null ? null : JSON.stringify(nextMedia.photos),
      nextMedia.galleryPhotos == null ? null : JSON.stringify(nextMedia.galleryPhotos),
    ],
  );
  stats.updatedProviders++;
  console.log(`[ok] ${row.id} ${row.name}: ${replacements.size} URL(s) -> WebP`);
}

async function runPool(items, worker, concurrency) {
  let index = 0;
  const workers = Array.from({ length: Math.max(1, concurrency) }, async () => {
    while (index < items.length) {
      const item = items[index++];
      await worker(item);
    }
  });
  await Promise.all(workers);
}

async function main() {
  const rows = await queryRows();
  console.log(
    `Provider R2 WebP conversion: ${rows.length} candidate row(s), ` +
      `${DRY_RUN ? "dry run" : "live"}, limit=${LIMIT}, offset=${OFFSET}, concurrency=${CONCURRENCY}`,
  );

  const stats = {
    plannedProviders: 0,
    updatedProviders: 0,
    plannedUrls: 0,
    convertedUrls: 0,
    reusedUrls: 0,
    failedUrls: 0,
    sourceBytes: 0,
    webpBytes: 0,
    failures: [],
  };

  await runPool(rows, (row) => processProvider(row, stats), CONCURRENCY);

  console.log("\n=== Provider R2 WebP conversion summary ===");
  console.log(`  Providers planned: ${stats.plannedProviders}`);
  console.log(`  Providers updated: ${stats.updatedProviders}`);
  console.log(`  URLs planned:       ${stats.plannedUrls}`);
  console.log(`  URLs converted:     ${stats.convertedUrls}`);
  console.log(`  URLs reused:        ${stats.reusedUrls}`);
  console.log(`  URLs failed:        ${stats.failedUrls}`);
  if (stats.sourceBytes > 0) {
    const reduction = 1 - stats.webpBytes / stats.sourceBytes;
    console.log(`  Source MB:          ${(stats.sourceBytes / 1024 / 1024).toFixed(2)}`);
    console.log(`  WebP MB:            ${(stats.webpBytes / 1024 / 1024).toFixed(2)}`);
    console.log(`  Byte reduction:     ${(reduction * 100).toFixed(1)}%`);
  }
  if (stats.failures.length) {
    const out = `/tmp/zavis-provider-webp-failures-${Date.now()}.json`;
    fs.writeFileSync(out, JSON.stringify(stats.failures, null, 2));
    console.log(`  Failures written:   ${out}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end().catch(() => {});
  });
