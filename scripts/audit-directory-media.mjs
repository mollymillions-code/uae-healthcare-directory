#!/usr/bin/env node
/**
 * Audit provider media for the directory.
 *
 * Checks:
 * - cover_image_url / photos / gallery_photos URL shape
 * - legacy bare Google photo_reference tokens
 * - duplicate media URLs per provider
 * - remote content-type, content-length, and cache-control headers
 * - oversized provider images that should have been compressed before upload
 *
 * Usage:
 *   node scripts/audit-directory-media.mjs --limit=500
 *   node scripts/audit-directory-media.mjs --provider=dha_01117
 *   node scripts/audit-directory-media.mjs --json --limit=1000 > media-audit.json
 */

import pg from "pg";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "..", ".env.local") });

const args = process.argv.slice(2);
const getArg = (name, fallback = "") => {
  const arg = args.find((x) => x.startsWith(`--${name}=`));
  return arg ? arg.slice(name.length + 3) : fallback;
};

const LIMIT = Math.max(1, Number.parseInt(getArg("limit", "500"), 10) || 500);
const PROVIDER_ID = getArg("provider", "");
const JSON_MODE = args.includes("--json");
const CHECK_REMOTE = !args.includes("--no-remote");
const MAX_IMAGE_BYTES = Math.max(
  50 * 1024,
  Number.parseInt(getArg("max-bytes", `${700 * 1024}`), 10) || 700 * 1024,
);

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("Missing DATABASE_URL. Set it in .env.local or the environment.");
  process.exit(1);
}

const IMAGE_URL_RE = /^https?:\/\//i;
const LOCAL_IMAGE_RE = /^\/(?:images|reports|cdn-cgi\/image)\//i;

function normalizeGallery(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item : item?.url))
    .filter(Boolean);
}

function isUsableImageUrl(value) {
  return (
    typeof value === "string" &&
    (IMAGE_URL_RE.test(value.trim()) || LOCAL_IMAGE_RE.test(value.trim()))
  );
}

function issue(provider, severity, field, value, message) {
  return {
    providerId: provider.id,
    providerSlug: provider.slug,
    providerName: provider.name,
    severity,
    field,
    value,
    message,
  };
}

async function headImage(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(url, { method: "HEAD", signal: controller.signal });
    return {
      ok: res.ok,
      status: res.status,
      contentType: res.headers.get("content-type") || "",
      contentLength: Number(res.headers.get("content-length") || 0),
      cacheControl: res.headers.get("cache-control") || "",
    };
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  const pool = new Pool({ connectionString: DATABASE_URL, max: 2 });
  const where = PROVIDER_ID ? "WHERE id = $1" : "WHERE status = 'active'";
  const params = PROVIDER_ID ? [PROVIDER_ID] : [];
  const limitClause = PROVIDER_ID ? "" : `LIMIT ${LIMIT}`;

  const { rows } = await pool.query(
    `
      SELECT id, name, slug, city_slug, category_slug, cover_image_url, photos, gallery_photos
      FROM providers
      ${where}
      ORDER BY updated_at DESC
      ${limitClause}
    `,
    params,
  );

  const findings = [];
  let providersWithMedia = 0;
  let urlsChecked = 0;

  for (const row of rows) {
    const urls = [];
    if (row.cover_image_url) urls.push({ field: "cover_image_url", value: row.cover_image_url });
    if (Array.isArray(row.photos)) {
      row.photos.forEach((value, index) => urls.push({ field: `photos[${index}]`, value }));
    }
    normalizeGallery(row.gallery_photos).forEach((value, index) => {
      urls.push({ field: `gallery_photos[${index}].url`, value });
    });

    if (urls.length > 0) providersWithMedia++;

    const seen = new Set();
    for (const item of urls) {
      const value = typeof item.value === "string" ? item.value.trim() : item.value;
      if (!isUsableImageUrl(value)) {
        findings.push(
          issue(
            row,
            "high",
            item.field,
            String(value ?? ""),
            "Invalid provider media URL. This is often a bare Google photo_reference token or malformed path.",
          ),
        );
        continue;
      }

      if (seen.has(value)) {
        findings.push(issue(row, "low", item.field, value, "Duplicate provider media URL."));
      }
      seen.add(value);

      if (!CHECK_REMOTE || !IMAGE_URL_RE.test(value)) continue;

      urlsChecked++;
      try {
        const head = await headImage(value);
        if (!head.ok) {
          findings.push(issue(row, "high", item.field, value, `Image returned HTTP ${head.status}.`));
          continue;
        }
        if (!head.contentType.startsWith("image/")) {
          findings.push(
            issue(row, "high", item.field, value, `Content-Type is ${head.contentType || "missing"}, not image/*.`),
          );
        }
        if (head.contentLength > MAX_IMAGE_BYTES) {
          findings.push(
            issue(
              row,
              "medium",
              item.field,
              value,
              `Image is ${Math.round(head.contentLength / 1024)}KB, above ${Math.round(MAX_IMAGE_BYTES / 1024)}KB budget.`,
            ),
          );
        }
        if (!/max-age=31536000|immutable/i.test(head.cacheControl)) {
          findings.push(
            issue(
              row,
              "medium",
              item.field,
              value,
              `Cache-Control is "${head.cacheControl || "missing"}", expected long immutable caching for versioned media.`,
            ),
          );
        }
      } catch (err) {
        findings.push(
          issue(row, "medium", item.field, value, `HEAD request failed: ${err instanceof Error ? err.message : String(err)}`),
        );
      }
    }
  }

  await pool.end();

  const summary = {
    providersScanned: rows.length,
    providersWithMedia,
    urlsChecked,
    findings: findings.length,
    high: findings.filter((x) => x.severity === "high").length,
    medium: findings.filter((x) => x.severity === "medium").length,
    low: findings.filter((x) => x.severity === "low").length,
  };

  if (JSON_MODE) {
    console.log(JSON.stringify({ summary, findings }, null, 2));
    return;
  }

  console.log("Directory media audit");
  console.log(JSON.stringify(summary, null, 2));
  for (const finding of findings.slice(0, 100)) {
    console.log(
      `[${finding.severity}] ${finding.providerId} ${finding.field}: ${finding.message} ${finding.value}`,
    );
  }
  if (findings.length > 100) {
    console.log(`... ${findings.length - 100} more findings omitted; rerun with --json for full output.`);
  }

  if (summary.high > 0) process.exitCode = 2;
}

main().catch((err) => {
  console.error(err instanceof Error ? err.stack || err.message : err);
  process.exit(1);
});
