#!/usr/bin/env node

import fs from "node:fs";
import process from "node:process";
import { Client } from "pg";

const DEFAULT_BASE_URL = "https://www.zavis.ai";

function loadEnvFile(path = ".env.local") {
  if (!fs.existsSync(path)) return;
  const text = fs.readFileSync(path, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const idx = trimmed.indexOf("=");
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

function parseArgs(argv) {
  const args = {
    paths: [],
    pathsFile: null,
    allProviders: false,
    limit: null,
    city: null,
    category: null,
    country: "ae",
    concurrency: 4,
    baseUrl: process.env.NEXT_PUBLIC_BASE_URL || process.env.SITE_URL || DEFAULT_BASE_URL,
    dryRun: false,
    noRevalidate: false,
    noCloudflare: false,
    pageOneVariant: true,
    purgeDirectoryPrefix: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const readValue = () => {
      const value = argv[i + 1];
      if (!value || value.startsWith("--")) {
        throw new Error(`Missing value for ${arg}`);
      }
      i += 1;
      return value;
    };

    switch (arg) {
      case "--path":
        args.paths.push(readValue());
        break;
      case "--paths-file":
        args.pathsFile = readValue();
        break;
      case "--all-providers":
        args.allProviders = true;
        break;
      case "--limit":
        args.limit = Number(readValue());
        break;
      case "--city":
        args.city = readValue();
        break;
      case "--category":
        args.category = readValue();
        break;
      case "--country":
        args.country = readValue();
        break;
      case "--concurrency":
        args.concurrency = Math.max(1, Number(readValue()));
        break;
      case "--base-url":
        args.baseUrl = readValue();
        break;
      case "--dry-run":
        args.dryRun = true;
        break;
      case "--no-revalidate":
        args.noRevalidate = true;
        break;
      case "--no-cloudflare":
        args.noCloudflare = true;
        break;
      case "--no-page-one-variant":
        args.pageOneVariant = false;
        break;
      case "--purge-directory-prefix":
        args.purgeDirectoryPrefix = true;
        break;
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!Number.isFinite(args.concurrency)) args.concurrency = 4;
  if (args.limit !== null && (!Number.isFinite(args.limit) || args.limit < 1)) {
    throw new Error("--limit must be a positive number");
  }
  return args;
}

function normalizePath(rawPath, baseUrl) {
  const parsed = rawPath.startsWith("http://") || rawPath.startsWith("https://")
    ? new URL(rawPath)
    : new URL(rawPath, baseUrl);
  if (!parsed.pathname.startsWith("/") || parsed.pathname.includes("..")) {
    throw new Error(`Unsafe path: ${rawPath}`);
  }
  return parsed.pathname;
}

function readPathsFile(file, baseUrl) {
  const text = fs.readFileSync(file, "utf8");
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((path) => normalizePath(path, baseUrl));
}

async function loadProviderPaths(args) {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for --all-providers");
  }

  const where = [
    "status = 'active'",
    "slug IS NOT NULL",
    "city_slug IS NOT NULL",
    "category_slug IS NOT NULL",
  ];
  const values = [];

  if (args.country) {
    values.push(args.country);
    where.push(`country = $${values.length}`);
  }
  if (args.city) {
    values.push(args.city);
    where.push(`city_slug = $${values.length}`);
  }
  if (args.category) {
    values.push(args.category);
    where.push(`category_slug = $${values.length}`);
  }

  const limit = args.limit ? ` LIMIT ${Math.floor(args.limit)}` : "";
  const sql = `
    SELECT city_slug, category_slug, slug
    FROM providers
    WHERE ${where.join(" AND ")}
    ORDER BY updated_at DESC NULLS LAST, id
    ${limit}
  `;

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    const result = await client.query(sql, values);
    return result.rows.map(
      (row) => `/directory/${row.city_slug}/${row.category_slug}/${row.slug}`
    );
  } finally {
    await client.end();
  }
}

function unique(values) {
  return Array.from(new Set(values));
}

function getRevalidationTargets(path, args) {
  const targets = [path];
  if (args.pageOneVariant && path.startsWith("/directory/")) {
    targets.push(`${path}?page=1`);
  }
  return unique(targets);
}

function getPurgeHosts(baseUrl) {
  const baseHost = new URL(baseUrl).host;
  const configured = (process.env.CLOUDFLARE_PURGE_HOSTS || "")
    .split(",")
    .map((host) => host.trim())
    .filter(Boolean);
  return unique([baseHost, ...configured]);
}

async function revalidatePath(baseUrl, secret, path) {
  const url = new URL("/api/revalidate", baseUrl);
  url.searchParams.set("secret", secret);
  url.searchParams.set("path", path);
  const response = await fetch(url, { method: "GET" });
  const body = await response.json().catch(() => null);
  if (!response.ok || body?.revalidated !== true) {
    throw new Error(`revalidate failed for ${path}: HTTP ${response.status}`);
  }
  return body;
}

async function purgeCloudflarePrefixes(prefixes) {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  const zoneId = process.env.CLOUDFLARE_ZONE_ID;
  if (!token || !zoneId) {
    throw new Error("CLOUDFLARE_API_TOKEN and CLOUDFLARE_ZONE_ID are required");
  }

  const chunks = [];
  for (let i = 0; i < prefixes.length; i += 30) {
    chunks.push(prefixes.slice(i, i + 30));
  }

  for (const chunk of chunks) {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prefixes: chunk }),
      }
    );
    const body = await response.json().catch(() => null);
    if (!response.ok || body?.success !== true) {
      throw new Error(
        `cloudflare purge failed: ${JSON.stringify(body?.errors || response.status)}`
      );
    }
  }
}

async function runPool(items, concurrency, worker) {
  let index = 0;
  const failures = [];
  const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (index < items.length) {
      const itemIndex = index;
      index += 1;
      const item = items[itemIndex];
      try {
        await worker(item, itemIndex);
      } catch (error) {
        failures.push({ item, error });
      }
    }
  });
  await Promise.all(runners);
  return failures;
}

async function main() {
  loadEnvFile();
  const args = parseArgs(process.argv.slice(2));

  let paths = args.paths.map((path) => normalizePath(path, args.baseUrl));
  if (args.pathsFile) paths.push(...readPathsFile(args.pathsFile, args.baseUrl));
  if (args.allProviders) paths.push(...await loadProviderPaths(args));
  paths = unique(paths);

  if (paths.length === 0 && !args.purgeDirectoryPrefix) {
    throw new Error("Provide --path, --paths-file, --all-providers, or --purge-directory-prefix");
  }

  console.log(JSON.stringify({
    paths: paths.length,
    allProviders: args.allProviders,
    city: args.city,
    category: args.category,
    country: args.country,
    baseUrl: args.baseUrl,
    concurrency: args.concurrency,
    dryRun: args.dryRun,
    noRevalidate: args.noRevalidate,
    noCloudflare: args.noCloudflare,
    pageOneVariant: args.pageOneVariant,
    purgeDirectoryPrefix: args.purgeDirectoryPrefix,
  }));

  if (args.dryRun) {
    console.log(paths.slice(0, 20).join("\n"));
    return;
  }

  if (!args.noRevalidate) {
    if (!process.env.REVALIDATION_SECRET) {
      throw new Error("REVALIDATION_SECRET is required unless --no-revalidate is set");
    }
    const totalRevalidations = paths.reduce(
      (total, path) => total + getRevalidationTargets(path, args).length,
      0
    );
    let completed = 0;
    const failures = await runPool(paths, args.concurrency, async (path) => {
      for (const target of getRevalidationTargets(path, args)) {
        await revalidatePath(args.baseUrl, process.env.REVALIDATION_SECRET, target);
        completed += 1;
      }
      if (completed % 100 === 0 || completed === totalRevalidations) {
        console.log(`revalidated ${completed}/${totalRevalidations}`);
      }
    });
    if (failures.length > 0) {
      for (const failure of failures.slice(0, 10)) {
        console.error(`${failure.item}: ${failure.error.message}`);
      }
      throw new Error(`revalidation failed for ${failures.length} paths`);
    }
  }

  if (!args.noCloudflare) {
    const hosts = getPurgeHosts(args.baseUrl);
    const prefixes = args.purgeDirectoryPrefix
      ? hosts.map((host) => `${host}/directory`)
      : paths.flatMap((path) => hosts.map((host) => `${host}${path}`));
    await purgeCloudflarePrefixes(unique(prefixes));
    console.log(`cloudflare purged ${unique(prefixes).length} prefixes`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
