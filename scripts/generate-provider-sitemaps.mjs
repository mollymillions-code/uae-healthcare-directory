#!/usr/bin/env node
/**
 * scripts/generate-provider-sitemaps.mjs
 *
 * Out-of-band static provider sitemap generator.
 *
 * Per docs/seo/static-provider-sitemap-architecture-spec.md, provider
 * sitemaps must be built offline into shared storage and served directly
 * by Nginx. This script is the offline builder.
 *
 * Inputs:
 *   - PostgreSQL `providers` table (active, country='ae')
 *   - DATABASE_URL from /home/ubuntu/zavis-shared/.env.local
 *
 * Outputs (written to /home/ubuntu/zavis-shared/sitemaps/):
 *   - providers-index.xml           (English sitemapindex)
 *   - providers-ar-index.xml        (Arabic sitemapindex)
 *   - providers/<city>-<n>.xml      (English per-city urlset shards)
 *   - providers-ar/<city>-<n>.xml   (Arabic per-city urlset shards)
 *   - manifest.json                 (generation metadata)
 *
 * Operational properties:
 *   - Deterministic: same DB state produces byte-identical XML (ordering
 *     is explicit via ORDER BY)
 *   - Atomic per file: every write goes through a staging directory on
 *     the same filesystem and is committed via rename(2)
 *   - Idempotent: safe to run any number of times concurrently at the
 *     per-run level, but callers MUST wrap in `flock -n` to prevent two
 *     simultaneous runs from racing on the file moves
 *   - Single source of truth: the `isEnrichedForSitemap` gate here MUST
 *     match the gate in:
 *       - src/lib/sitemap-gating.ts (once extracted)
 *       - src/app/(directory)/directory/[city]/[...segments]/page.tsx
 *         (the `listing` case's noindex decision)
 *     If these drift, Google will see contradictory signals. Section 8.2
 *     of the architecture spec.
 *
 * Exit codes:
 *   0 — success
 *   1 — failure (logs written to /home/ubuntu/logs/sitemap-generation.log)
 *
 * Logging:
 *   Stdout + append to /home/ubuntu/logs/sitemap-generation.log
 *
 * Recommended invocation (from cron or deploy.sh):
 *   flock -n /tmp/zavis-sitemap-gen.lock \
 *     /usr/bin/node /home/ubuntu/zavis-deploy/generate-provider-sitemaps.mjs
 *
 * The `flock -n` wrapper prevents overlapping cron + post-deploy runs.
 */

import { Pool } from "pg";
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  renameSync,
  rmSync,
  readdirSync,
  existsSync,
} from "node:fs";
import { join } from "node:path";

// ─── Configuration ─────────────────────────────────────────────────────────────

const SHARED_ROOT = "/home/ubuntu/zavis-shared/sitemaps";
const STAGING_ROOT = join(SHARED_ROOT, ".tmp-build");
const ENV_FILE = "/home/ubuntu/zavis-shared/.env.local";
const LOG_FILE = "/home/ubuntu/logs/sitemap-generation.log";
const BASE_URL = "https://www.zavis.ai";
const SHARD_CEILING = 10_000; // per spec §9.2
const GENERATION_STARTED_AT = new Date();
// Keep in sync with src/lib/provider-removals.json. The sitemap generator is
// deployed as a standalone ops script, so it cannot rely on Next's TS imports.
const REMOVED_PROVIDER_ENTRIES = [
  {
    slug: "ghasaq-medical-center-sharjah",
    aliases: [
      "ghassaq-medical-center-sharjah",
      "ghsaq-medical-center-sharjah",
      "ghasaq-medical-centre-sharjah",
      "ghassaq-medical-centre-sharjah",
    ],
    names: [
      "Ghasaq Medical Center",
      "Ghassaq Medical Center",
      "Ghsaq Medical Center",
      "Ghasaq Medical Centre",
      "Ghassaq Medical Centre",
    ],
    citySlug: "sharjah",
    categorySlug: "clinics",
  },
];

function normalizeSlug(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/\bcentre\b/g, "center")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeName(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/\bcentre\b/g, "center")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const REMOVED_PROVIDER_SLUGS = new Set(
  REMOVED_PROVIDER_ENTRIES.flatMap((entry) => [
    entry.slug,
    ...(entry.aliases ?? []),
  ]).map(normalizeSlug),
);

function isRemovedProviderRow(row) {
  if (REMOVED_PROVIDER_SLUGS.has(normalizeSlug(row.slug))) return true;

  const city = normalizeSlug(row.city_slug);
  const category = normalizeSlug(row.category_slug);
  const name = normalizeName(row.name);
  return REMOVED_PROVIDER_ENTRIES.some((entry) => {
    if (entry.citySlug && normalizeSlug(entry.citySlug) !== city) return false;
    if (
      entry.categorySlug &&
      category &&
      normalizeSlug(entry.categorySlug) !== category
    ) {
      return false;
    }
    return (entry.names ?? []).map(normalizeName).includes(name);
  });
}

// ─── Logging ──────────────────────────────────────────────────────────────────

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  process.stdout.write(line);
  try {
    writeFileSync(LOG_FILE, line, { flag: "a" });
  } catch (_) {
    // Logging failure is non-fatal. If /home/ubuntu/logs/ doesn't exist,
    // stdout still captures everything, and cron will email non-zero
    // exits anyway.
  }
}

function die(msg, err) {
  const suffix = err
    ? " — " + (err.stack || err.message || String(err))
    : "";
  log(`FATAL: ${msg}${suffix}`);
  process.exit(1);
}

// ─── Env loader ───────────────────────────────────────────────────────────────

function loadDatabaseUrl() {
  if (!existsSync(ENV_FILE)) {
    die(`env file missing: ${ENV_FILE}`);
  }
  const content = readFileSync(ENV_FILE, "utf8");
  const match = content.match(/^DATABASE_URL=(.+)$/m);
  if (!match) {
    die(`DATABASE_URL not found in ${ENV_FILE}`);
  }
  return match[1].trim().replace(/^["']|["']$/g, "");
}

// ─── Thin-content gate ────────────────────────────────────────────────────────
// CRITICAL: keep this identical to:
//   - src/app/sitemap-providers.xml/route.ts
//   - src/app/sitemap-providers-ar.xml/route.ts
//   - the listing page's noindex check in
//     src/app/(directory)/directory/[city]/[...segments]/page.tsx
// If any of these four places disagree, Google gets contradictory signals
// (sitemap says "index this" while the page says "noindex", or vice
// versa) and crawl trust erodes. See spec §8.2.

function isEnrichedForSitemap(row) {
  const rating = row.google_rating;
  const phone = row.phone;
  const website = row.website;
  const description = row.description;
  const hours = row.operating_hours;

  const fields = [
    Boolean(rating && Number(rating) > 0),
    Boolean(phone && String(phone).trim().length > 0),
    Boolean(website && String(website).trim().length > 0),
    Boolean(description && String(description).trim().length > 80),
    Boolean(
      hours &&
        typeof hours === "object" &&
        Object.keys(hours).length > 0,
    ),
  ];
  return fields.filter(Boolean).length >= 2;
}

// ─── XML helpers ──────────────────────────────────────────────────────────────

function escapeXml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildUrlset(entries) {
  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n` +
    entries.join("\n") +
    `\n</urlset>\n`
  );
}

function buildSitemapIndex(entries) {
  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    entries.join("\n") +
    `\n</sitemapindex>\n`
  );
}

// Format a Date (or date-ish input) as YYYY-MM-DD for sitemap lastmod.
// Handles pg's node-postgres conversion of `timestamptz` columns into JS
// Date objects, as well as string fallback.
function formatLastmod(value) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().split("T")[0];
}

// ─── Entry builders ───────────────────────────────────────────────────────────

function buildEnEntry(row, fallbackLastmod) {
  const path = `/directory/${row.city_slug}/${row.category_slug}/${row.slug}`;
  const lastmod =
    formatLastmod(row.updated_at) || fallbackLastmod;
  const enUrl = escapeXml(`${BASE_URL}${path}`);
  const arUrl = escapeXml(`${BASE_URL}/ar${path}`);
  return (
    `  <url>` +
    `<loc>${enUrl}</loc>` +
    `<lastmod>${lastmod}</lastmod>` +
    `<changefreq>monthly</changefreq>` +
    `<priority>0.8</priority>` +
    `<xhtml:link rel="alternate" hreflang="en-AE" href="${enUrl}"/>` +
    `<xhtml:link rel="alternate" hreflang="ar-AE" href="${arUrl}"/>` +
    `<xhtml:link rel="alternate" hreflang="x-default" href="${enUrl}"/>` +
    `</url>`
  );
}

function buildArEntry(row, fallbackLastmod) {
  const path = `/directory/${row.city_slug}/${row.category_slug}/${row.slug}`;
  const lastmod =
    formatLastmod(row.updated_at) || fallbackLastmod;
  const enUrl = escapeXml(`${BASE_URL}${path}`);
  const arUrl = escapeXml(`${BASE_URL}/ar${path}`);
  return (
    `  <url>` +
    `<loc>${arUrl}</loc>` +
    `<lastmod>${lastmod}</lastmod>` +
    `<changefreq>monthly</changefreq>` +
    `<priority>0.7</priority>` +
    `<xhtml:link rel="alternate" hreflang="en-AE" href="${enUrl}"/>` +
    `<xhtml:link rel="alternate" hreflang="ar-AE" href="${arUrl}"/>` +
    `<xhtml:link rel="alternate" hreflang="x-default" href="${enUrl}"/>` +
    `</url>`
  );
}

// ─── Sharding ────────────────────────────────────────────────────────────────

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

// ─── Atomic file writes ──────────────────────────────────────────────────────
// All files are first written under STAGING_ROOT (same filesystem as the
// live path), then rename(2)'d into place. rename within the same fs is
// atomic on Linux, so in-flight crawler reads never see a half-written
// file. Rename ordering puts children before indexes so the index never
// references a missing shard.

function writeStaged(relativePath, content) {
  const absPath = join(STAGING_ROOT, relativePath);
  mkdirSync(join(absPath, ".."), { recursive: true });
  writeFileSync(absPath, content, "utf8");
}

function promoteStagedFile(relativePath) {
  const src = join(STAGING_ROOT, relativePath);
  const dst = join(SHARED_ROOT, relativePath);
  mkdirSync(join(dst, ".."), { recursive: true });
  renameSync(src, dst);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  log("starting provider sitemap generation");

  // Prep staging — always start fresh.
  if (existsSync(STAGING_ROOT)) {
    rmSync(STAGING_ROOT, { recursive: true, force: true });
  }
  mkdirSync(join(STAGING_ROOT, "providers"), { recursive: true });
  mkdirSync(join(STAGING_ROOT, "providers-ar"), { recursive: true });

  // DB connect. Short-lived, isolated from the app's pool.
  const databaseUrl = loadDatabaseUrl();
  const pool = new Pool({
    connectionString: databaseUrl,
    max: 2,
    connectionTimeoutMillis: 10_000,
  });

  let rows;
  try {
    const result = await pool.query(
      `SELECT
         slug,
         name,
         city_slug,
         category_slug,
         updated_at,
         google_rating,
         phone,
         website,
         description,
         operating_hours
       FROM providers
       WHERE status = 'active'
         AND country = 'ae'
         AND slug IS NOT NULL
         AND city_slug IS NOT NULL
         AND category_slug IS NOT NULL
       ORDER BY city_slug ASC, slug ASC`,
    );
    rows = result.rows;
  } catch (err) {
    await pool.end().catch(() => {});
    die("DB query failed", err);
  } finally {
    // Pool is closed after the query regardless of success; this
    // generator is a one-shot process.
  }
  await pool.end().catch(() => {});

  log(`fetched ${rows.length} candidate providers from DB`);

  const publicRows = rows.filter((row) => !isRemovedProviderRow(row));
  const skippedRemoved = rows.length - publicRows.length;
  if (skippedRemoved > 0) {
    log(`after provider opt-out gate: ${publicRows.length} kept, ${skippedRemoved} removed`);
  }

  // Apply thin-content gate.
  const enriched = publicRows.filter(isEnrichedForSitemap);
  const skippedThin = publicRows.length - enriched.length;
  log(`after thin-content gate: ${enriched.length} enriched, ${skippedThin} skipped`);

  if (enriched.length === 0) {
    die(
      "no enriched providers — refusing to write empty sitemaps over " +
        "previous live files (spec §10.3)",
    );
  }

  // Group by city, preserving DB order (already ORDER BY city_slug, slug).
  const byCity = new Map();
  for (const row of enriched) {
    const city = row.city_slug;
    if (!byCity.has(city)) byCity.set(city, []);
    byCity.get(city).push(row);
  }

  const fallbackLastmod = GENERATION_STARTED_AT.toISOString().split("T")[0];

  // Build shards for both languages in parallel.
  const enShardPaths = []; // { relPath, lastmod }
  const arShardPaths = [];
  let totalEnUrls = 0;
  let totalArUrls = 0;

  // Deterministic city ordering — alphabetical.
  const cities = [...byCity.keys()].sort();

  for (const city of cities) {
    const cityRows = byCity.get(city);
    const shards = chunk(cityRows, SHARD_CEILING);

    shards.forEach((shardRows, shardIndex) => {
      const shardNum = shardIndex + 1;
      const shardBasename = `${city}-${shardNum}.xml`;

      // English
      const enEntries = shardRows.map((row) =>
        buildEnEntry(row, fallbackLastmod),
      );
      const enXml = buildUrlset(enEntries);
      writeStaged(`providers/${shardBasename}`, enXml);

      // Arabic
      const arEntries = shardRows.map((row) =>
        buildArEntry(row, fallbackLastmod),
      );
      const arXml = buildUrlset(arEntries);
      writeStaged(`providers-ar/${shardBasename}`, arXml);

      // Max lastmod for the shard, for the index entry
      let maxLastmod = null;
      for (const row of shardRows) {
        const lm = formatLastmod(row.updated_at);
        if (lm && (!maxLastmod || lm > maxLastmod)) maxLastmod = lm;
      }
      const shardLastmod = maxLastmod || fallbackLastmod;

      enShardPaths.push({
        relPath: `providers/${shardBasename}`,
        lastmod: shardLastmod,
      });
      arShardPaths.push({
        relPath: `providers-ar/${shardBasename}`,
        lastmod: shardLastmod,
      });

      totalEnUrls += shardRows.length;
      totalArUrls += shardRows.length;

      log(
        `built ${shardBasename}: ${shardRows.length} urls (EN+AR), lastmod ${shardLastmod}`,
      );
    });
  }

  // Build the two index files.
  const enIndexEntries = enShardPaths.map((s) => {
    const loc = escapeXml(`${BASE_URL}/sitemaps/${s.relPath}`);
    return `  <sitemap><loc>${loc}</loc><lastmod>${s.lastmod}</lastmod></sitemap>`;
  });
  const arIndexEntries = arShardPaths.map((s) => {
    const loc = escapeXml(`${BASE_URL}/sitemaps/${s.relPath}`);
    return `  <sitemap><loc>${loc}</loc><lastmod>${s.lastmod}</lastmod></sitemap>`;
  });

  writeStaged("providers-index.xml", buildSitemapIndex(enIndexEntries));
  writeStaged("providers-ar-index.xml", buildSitemapIndex(arIndexEntries));
  log(
    `built index files: ${enIndexEntries.length} EN shards, ${arIndexEntries.length} AR shards`,
  );

  // Validation — per spec §10.3 step 2.
  const expectedFiles = [
    "providers-index.xml",
    "providers-ar-index.xml",
    ...enShardPaths.map((s) => s.relPath),
    ...arShardPaths.map((s) => s.relPath),
  ];
  for (const rel of expectedFiles) {
    const abs = join(STAGING_ROOT, rel);
    if (!existsSync(abs)) {
      die(`validation failed: staged file missing ${rel}`);
    }
    const content = readFileSync(abs, "utf8");
    if (!content || content.length < 100) {
      die(`validation failed: staged file too small ${rel} (${content.length} bytes)`);
    }
    if (!content.includes("<urlset") && !content.includes("<sitemapindex")) {
      die(`validation failed: staged file has no urlset/sitemapindex tag ${rel}`);
    }
  }
  if (totalEnUrls === 0 || totalArUrls === 0) {
    die(`validation failed: zero URLs in output (en=${totalEnUrls}, ar=${totalArUrls})`);
  }
  log(`validation passed: ${expectedFiles.length} staged files`);

  // Promote to live. Order: children first, then index files last.
  // If a crawler fetches the old index during this step, it still points
  // at the old children which are still in place. If it fetches the new
  // index, it points at the new children which are also now in place.
  // The in-between state briefly has some new children alongside the old
  // index but that's consistent (the old index just lists a subset).
  for (const { relPath } of [...enShardPaths, ...arShardPaths]) {
    promoteStagedFile(relPath);
  }
  promoteStagedFile("providers-index.xml");
  promoteStagedFile("providers-ar-index.xml");
  log("promoted all files from staging to live");

  // Manifest — written last, atomically.
  let gitSha = null;
  try {
    gitSha = readFileSync("/home/ubuntu/zavis-landing-active/.git/HEAD", "utf8").trim();
    if (gitSha.startsWith("ref: ")) {
      const refPath = gitSha.slice(5);
      gitSha = readFileSync(
        `/home/ubuntu/zavis-landing-active/.git/${refPath}`,
        "utf8",
      ).trim();
    }
  } catch (_) {
    // git sha is best-effort; not fatal.
  }

  const manifest = {
    generatedAt: GENERATION_STARTED_AT.toISOString(),
    completedAt: new Date().toISOString(),
    gitSha,
    totalEnUrls,
    totalArUrls,
    skippedThinProviders: skippedThin,
    cities: cities.map((c) => ({
      city: c,
      providerCount: byCity.get(c).length,
    })),
    shards: enShardPaths.map((s) => s.relPath),
  };
  writeStaged("manifest.json", JSON.stringify(manifest, null, 2));
  promoteStagedFile("manifest.json");

  // Cleanup staging directory (should be empty after all promotes).
  try {
    // Remove remaining empty staging dirs.
    const remaining = readdirSync(STAGING_ROOT, { recursive: true });
    if (remaining.length === 0 || remaining.every((f) => {
      try {
        return existsSync(join(STAGING_ROOT, f));
      } catch {
        return false;
      }
    })) {
      rmSync(STAGING_ROOT, { recursive: true, force: true });
    }
  } catch (_) {
    // best-effort cleanup; leftover staging is harmless
  }

  log(
    `SUCCESS: ${totalEnUrls} EN urls + ${totalArUrls} AR urls, ` +
      `${enShardPaths.length} EN shards, ${arShardPaths.length} AR shards, ` +
      `${skippedThin} thin providers skipped`,
  );
}

main().catch((err) => {
  die("unhandled error in main()", err);
});
