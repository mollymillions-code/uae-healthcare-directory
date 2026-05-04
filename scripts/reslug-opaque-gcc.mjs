#!/usr/bin/env node
/**
 * Re-slug GCC providers that have opaque hashed slugs (e.g. "provider-6f0956f2")
 * to proper transliterated slugs. These providers were seeded with hashed slugs
 * which cause page 404s because the page generator's slug-alias matcher can't
 * resolve them.
 *
 * Strategy:
 *   1. Pick opaque-slug providers that ARE enriched (have description from Sonnet).
 *      We focus on the enriched ones first — they're the ones whose 404s actually
 *      hurt SEO.
 *   2. Use Haiku via local `claude` CLI to generate transliterated slugs in batches
 *      of 20.
 *   3. Resolve uniqueness collisions deterministically (append city, then -2, -3).
 *   4. Atomically: INSERT into provider_slug_history (old → id), UPDATE slug.
 *
 * Uses local DB tunnel (port 15432).
 *
 * Flags:
 *   --test          5 providers
 *   --limit=N
 *   --batch-size=N  default 20
 *   --concurrency=N default 3 (claude CLI bound)
 *   --dry-run
 */

import pg from "pg";
import fs from "fs";
import { spawn } from "child_process";

const { Pool } = pg;

const args = process.argv.slice(2);
const TEST_MODE = args.includes("--test");
const DRY_RUN = args.includes("--dry-run");
const getArg = (name, def) => {
  const a = args.find((x) => x.startsWith(`--${name}=`));
  return a ? a.split("=")[1] : def;
};
const LIMIT = parseInt(getArg("limit", TEST_MODE ? "5" : "10000"), 10);
const BATCH_SIZE = parseInt(getArg("batch-size", "20"), 10);
const CONCURRENCY = parseInt(getArg("concurrency", "3"), 10);
const CLAUDE_CLI = process.env.CLAUDE_CLI || "claude";
const MODEL = process.env.CLAUDE_MODEL || "haiku";
const CLAUDE_TIMEOUT_MS = parseInt(process.env.CLAUDE_TIMEOUT_MS || "120000", 10);

const COUNTRIES = ["sa", "qa", "bh", "kw"];
const CATEGORIES = ["clinics", "hospitals", "dental", "physiotherapy", "neurology"];

const { DATABASE_URL } = process.env;
if (!DATABASE_URL) {
  console.error("Missing DATABASE_URL");
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL, max: CONCURRENCY + 2 });

const RUN_ID = Date.now();
const LOG_FILE = `/tmp/reslug-gcc-${RUN_ID}.log`;
const FAILED_FILE = `/tmp/reslug-gcc-${RUN_ID}-failures.json`;

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  try { fs.appendFileSync(LOG_FILE, line + "\n"); } catch {}
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function runClaudeCLI(prompt) {
  return new Promise((resolve, reject) => {
    const cliArgs = [
      "--print", "--model", MODEL, "--output-format", "json",
      "--disallowedTools", "Bash Read Write Edit Glob Grep WebFetch WebSearch Agent TodoWrite NotebookEdit",
      "--append-system-prompt", "Output ONLY raw JSON. No preamble, no markdown fences, no commentary.",
      prompt,
    ];
    const proc = spawn(CLAUDE_CLI, cliArgs, { stdio: ["ignore", "pipe", "pipe"] });
    let out = "", err = "";
    let settled = false;
    const settle = (fn) => (...a) => { if (!settled) { settled = true; fn(...a); } };
    const ok = settle(resolve);
    const fail = settle(reject);
    const timer = setTimeout(() => { try { proc.kill("SIGKILL"); } catch {} fail(new Error(`claude timeout`)); }, CLAUDE_TIMEOUT_MS);
    proc.stdout.on("data", (d) => (out += d.toString()));
    proc.stderr.on("data", (d) => (err += d.toString()));
    proc.on("error", (e) => { clearTimeout(timer); fail(e); });
    proc.on("close", (code) => {
      clearTimeout(timer);
      if (code !== 0) return fail(new Error(`claude exit ${code}: ${err.slice(0, 200)}`));
      try {
        const env = JSON.parse(out);
        if (env.is_error) return fail(new Error(`is_error: ${(env.result || "").slice(0, 200)}`));
        ok(env.result || "");
      } catch (e) { fail(new Error(`envelope parse: ${out.slice(0, 200)}`)); }
    });
  });
}

function sanitizeSlug(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function isSlugTaken(slug) {
  const r = await pool.query(
    `SELECT EXISTS (
       SELECT 1 FROM providers WHERE slug = $1
       UNION ALL
       SELECT 1 FROM provider_slug_history WHERE old_slug = $1
     ) AS taken`,
    [slug]
  );
  return r.rows[0].taken;
}

async function pickUniqueSlug(rawSlug, citySlug) {
  let candidate = sanitizeSlug(rawSlug);
  if (!candidate) return null;

  if (!(await isSlugTaken(candidate))) return candidate;

  // Try with city suffix
  const withCity = sanitizeSlug(`${candidate}-${citySlug}`);
  if (withCity !== candidate && !(await isSlugTaken(withCity))) return withCity;

  // Numeric suffix
  for (let i = 2; i <= 20; i++) {
    const numbered = sanitizeSlug(`${withCity || candidate}-${i}`);
    if (!(await isSlugTaken(numbered))) return numbered;
  }
  return null;
}

async function generateBatchSlugs(providers) {
  const items = providers.map((p, i) => ({
    idx: i,
    name_en: p.name && /[a-zA-Z]/.test(p.name) ? p.name : null,
    name_native: p.name,
    name_ar: p.name_ar,
    google_display_name: p.google_display_name,
    city: p.city_slug,
    country: p.country,
    category: p.category_slug,
  }));

  const prompt = `Generate URL slugs for these healthcare facilities. The slug should be a transliterated English version of the name, suitable for a directory URL.

Rules:
- lowercase, hyphen-separated, ASCII letters/digits only
- 20-60 characters typically
- Transliterate Arabic phonetically (e.g. "مركز" → "markaz", but prefer English equivalent like "center" if a clear English translation exists)
- For names with both Arabic and English (e.g. "Smile Clinic عيادة الابتسامة"), use the English part
- Drop honorifics (Dr., Doctor, Mr., LLC, W.L.L., FZ, etc.) unless central to the name
- If google_display_name has an English/transliterated version, prefer that
- Do NOT include city or country in the slug — that comes from the URL path
- Do NOT include the word "Hospital", "Clinic", etc. UNLESS dropping them makes the slug ambiguous
- Output strict JSON array: [{"idx": 0, "slug": "kent-healthcare"}, ...]
- One entry per input idx, no missing/extra entries.

Inputs:
${JSON.stringify(items, null, 2)}`;

  const result = await runClaudeCLI(prompt);
  const cleaned = result.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  const parsed = JSON.parse(cleaned);
  if (!Array.isArray(parsed)) throw new Error("not array");
  return parsed;
}

async function processBatch(batch, stats) {
  let suggestions;
  try {
    suggestions = await generateBatchSlugs(batch);
    stats.cliCalls++;
  } catch (err) {
    stats.batchFailed++;
    for (const p of batch) {
      stats.failures.push({ id: p.id, old_slug: p.slug, error: `gen: ${err.message}` });
    }
    log(`✗ batch fail (${batch.length}): ${err.message}`);
    return;
  }

  for (const sugg of suggestions) {
    const provider = batch[sugg.idx];
    if (!provider) continue;
    if (!sugg.slug) {
      stats.skipped++;
      continue;
    }

    const newSlug = await pickUniqueSlug(sugg.slug, provider.city_slug);
    if (!newSlug) {
      stats.skipped++;
      stats.failures.push({ id: provider.id, old_slug: provider.slug, raw: sugg.slug, reason: "no unique slug" });
      log(`? ${provider.slug} → "${sugg.slug}" (no unique alternative)`);
      continue;
    }

    if (DRY_RUN) {
      log(`[DRY] ${provider.slug} → ${newSlug}`);
      stats.success++;
      continue;
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `INSERT INTO provider_slug_history (old_slug, provider_id, city_slug, archived_at, reason)
         VALUES ($1, $2, $3, NOW(), $4)
         ON CONFLICT (old_slug) DO NOTHING`,
        [provider.slug, provider.id, provider.city_slug, "gcc-reslug-2026-05"]
      );
      await client.query(
        `UPDATE providers SET slug = $1, updated_at = NOW() WHERE id = $2`,
        [newSlug, provider.id]
      );
      await client.query("COMMIT");
      stats.success++;
      if (stats.success % 5 === 0) {
        log(`✓ [${stats.success}/${stats.total}] ${provider.slug} → ${newSlug}`);
      }
    } catch (err) {
      await client.query("ROLLBACK").catch(() => {});
      stats.failed++;
      stats.failures.push({ id: provider.id, old_slug: provider.slug, new_slug: newSlug, error: err.message });
      log(`✗ ${provider.slug}: ${err.message}`);
    } finally {
      client.release();
    }
  }
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
  log(`Re-slug opaque GCC providers — run ${RUN_ID}`);
  log(`═══════════════════════════════════════════════════════════════════`);
  log(`Mode:        ${TEST_MODE ? "TEST (5)" : "FULL"}${DRY_RUN ? " [DRY RUN]" : ""}`);
  log(`Model:       ${MODEL}`);
  log(`Limit:       ${LIMIT}`);
  log(`Batch size:  ${BATCH_SIZE}`);
  log(`Concurrency: ${CONCURRENCY}`);
  log(``);

  // Pick opaque-slug enriched providers, prefer those with description set first
  const { rows } = await pool.query(
    `SELECT
       id, slug, name, name_ar, city_slug, country, category_slug,
       (google_place_details->'displayName'->>'text') AS google_display_name
     FROM providers
     WHERE slug LIKE 'provider-%'
       AND country = ANY($1)
       AND category_slug = ANY($2)
       AND status = 'active'
       AND google_fetched_at IS NOT NULL
     ORDER BY (description IS NOT NULL AND description <> '') DESC, country, city_slug, name
     LIMIT $3`,
    [COUNTRIES, CATEGORIES, LIMIT]
  );

  log(`Found ${rows.length} opaque-slug enriched providers to re-slug`);

  if (rows.length === 0) {
    await pool.end();
    return;
  }

  const batches = [];
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    batches.push(rows.slice(i, i + BATCH_SIZE));
  }
  log(`→ ${batches.length} batches of up to ${BATCH_SIZE}`);
  log(``);

  const stats = {
    total: rows.length,
    success: 0,
    failed: 0,
    skipped: 0,
    batchFailed: 0,
    cliCalls: 0,
    failures: [],
    startedAt: Date.now(),
  };

  await runPool(batches, (b) => processBatch(b, stats), CONCURRENCY);

  const elapsed = ((Date.now() - stats.startedAt) / 1000).toFixed(1);
  log(``);
  log(`═══════════════════════════════════════════════════════════════════`);
  log(`DONE in ${elapsed}s`);
  log(`═══════════════════════════════════════════════════════════════════`);
  log(`  Re-slugged:           ${stats.success}/${stats.total}`);
  log(`  Skipped (no unique):  ${stats.skipped}`);
  log(`  Failed:               ${stats.failed}`);
  log(`  Batch failures:       ${stats.batchFailed}`);
  log(`  Claude CLI calls:     ${stats.cliCalls}`);

  if (stats.failures.length) {
    fs.writeFileSync(FAILED_FILE, JSON.stringify(stats.failures, null, 2));
    log(`  Failures → ${FAILED_FILE}`);
  }

  await pool.end();
}

main().catch((err) => {
  log(`FATAL: ${err.stack || err.message}`);
  process.exit(1);
});
