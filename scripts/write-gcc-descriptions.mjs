#!/usr/bin/env node
/**
 * Stage 2: write English + Arabic descriptions for GCC providers that have
 * Places data (google_place_details set) but still no description.
 *
 * Uses the local `claude` CLI in --print mode with --model haiku, batching
 * BATCH_SIZE descriptions per call so we amortize the ~10K cache_creation
 * tokens across multiple outputs. Uses the Claude Code subscription, NOT
 * an API key.
 *
 * Targets: same scope as Stage 1 — country in (sa, qa, bh, kw),
 * category in (clinics, hospitals, dental, physiotherapy, neurology),
 * description IS NULL OR '', google_place_details IS NOT NULL.
 *
 * Flags:
 *   --test          Cap to one batch (8 providers)
 *   --limit=N       Hard cap on providers
 *   --batch-size=N  Providers per claude call (default: 8)
 *   --concurrency=N Parallel claude subprocesses (default: 3)
 *   --dry-run       Plan only, no claude calls, no DB writes
 *   --country=cc    Single country (default: all four)
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
const COUNTRY_FILTER = getArg("country", null);
const LIMIT = parseInt(getArg("limit", TEST_MODE ? "8" : "10000"), 10);
const BATCH_SIZE = parseInt(getArg("batch-size", "8"), 10);
const CONCURRENCY = parseInt(getArg("concurrency", "3"), 10);
const CLAUDE_CLI = process.env.CLAUDE_CLI || "claude";
const MODEL = process.env.CLAUDE_MODEL || "haiku";

const COUNTRIES = COUNTRY_FILTER ? [COUNTRY_FILTER] : ["sa", "qa", "bh", "kw"];
const CATEGORIES = ["clinics", "hospitals", "dental", "physiotherapy", "neurology"];

const { DATABASE_URL } = process.env;
if (!DATABASE_URL) {
  console.error("Missing DATABASE_URL");
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL, max: CONCURRENCY + 2 });

const RUN_ID = Date.now();
const LOG_FILE = `/tmp/write-desc-${RUN_ID}.log`;
const FAILED_FILE = `/tmp/write-desc-${RUN_ID}-failures.json`;

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  try {
    fs.appendFileSync(LOG_FILE, line + "\n");
  } catch {}
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const COUNTRY_NAME = { sa: "Saudi Arabia", qa: "Qatar", bh: "Bahrain", kw: "Kuwait" };
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

// ─── claude CLI ─────────────────────────────────────────────────────────────
function runClaudeCLI(prompt) {
  return new Promise((resolve, reject) => {
    const cliArgs = [
      "--print",
      "--model",
      MODEL,
      "--output-format",
      "json",
      "--disallowedTools",
      "Bash Read Write Edit Glob Grep WebFetch WebSearch Agent TodoWrite NotebookEdit",
      "--append-system-prompt",
      "Output ONLY raw JSON with no preamble, no markdown fences, no commentary. The output must be valid JSON parseable by JSON.parse().",
      prompt,
    ];
    const proc = spawn(CLAUDE_CLI, cliArgs, { stdio: ["ignore", "pipe", "pipe"] });
    let out = "";
    let err = "";
    proc.stdout.on("data", (d) => (out += d.toString()));
    proc.stderr.on("data", (d) => (err += d.toString()));
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code !== 0) return reject(new Error(`claude exit ${code}: ${err.slice(0, 200)}`));
      try {
        const envelope = JSON.parse(out);
        if (envelope.is_error) return reject(new Error(`claude is_error: ${(envelope.result || "").slice(0, 200)}`));
        resolve({
          text: envelope.result || "",
          usage: envelope.usage || {},
        });
      } catch (e) {
        reject(new Error(`envelope parse: ${out.slice(0, 200)}`));
      }
    });
  });
}

function buildBatchContext(providers) {
  return providers.map((p, i) => {
    const place = p.google_place_details || {};
    return {
      idx: i,
      name: p.name,
      city: cityDisplay(p.city_slug),
      country: COUNTRY_NAME[p.country],
      category: p.category_slug,
      address: place.formattedAddress || p.address || "",
      rating: place.rating || null,
      ratingCount: place.userRatingCount || 0,
      types: (place.types || []).slice(0, 8),
      editorialSummary: place.editorialSummary?.text || null,
      topReviews: (place.reviews || [])
        .slice(0, 3)
        .map((r) => r.text?.text || r.originalText?.text)
        .filter(Boolean),
    };
  });
}

function buildBatchPrompt(items) {
  return `Write ${items.length} objective directory listings (one per facility), 120-160 words each. Return a strict JSON array, one object per facility.

Schema: [{"idx": <number>, "en": "<English description>", "ar": "<Arabic translation>"}, ...]

Rules:
- Factual, neutral tone. NO superlatives ("best", "leading", "premier"), NO marketing fluff.
- Mention: facility type, city/country, what it offers based on Google data, rating if present, and one notable detail from reviews if useful.
- Do NOT invent services, hours, doctors, certifications, or insurance.
- Do NOT mention DHA, DOH, MOHAP, or any UAE regulator (this is GCC, not UAE).
- The Arabic translation must be natural Modern Standard Arabic, not literal.
- Output ONLY the JSON array — no prose, no markdown fences, no preamble.
- Match each idx exactly to the facility data input.

Facilities:
${JSON.stringify(items, null, 2)}`;
}

async function processBatch(batch, stats) {
  const items = buildBatchContext(batch);
  const prompt = buildBatchPrompt(items);

  if (DRY_RUN) {
    log(`[DRY] would write ${batch.length} descriptions: ${batch.map((p) => p.name).slice(0, 3).join(", ")}…`);
    stats.success += batch.length;
    return;
  }

  let parsed;
  try {
    const { text, usage } = await runClaudeCLI(prompt);
    stats.cliCalls++;
    stats.tokensIn += (usage.input_tokens || 0) + (usage.cache_creation_input_tokens || 0);
    stats.tokensOut += usage.output_tokens || 0;

    const cleaned = text
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "");
    parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) throw new Error("not an array");
  } catch (err) {
    stats.batchFailed++;
    for (const p of batch) {
      stats.failures.push({ id: p.id, name: p.name, error: err.message });
    }
    log(`✗ batch fail (${batch.length}): ${err.message}`);
    return;
  }

  for (const result of parsed) {
    const provider = batch[result.idx];
    if (!provider) {
      log(`  warn: idx ${result.idx} out of range`);
      continue;
    }
    if (!result.en || !result.ar) {
      stats.failed++;
      stats.failures.push({ id: provider.id, name: provider.name, error: "missing en/ar in batch result" });
      continue;
    }
    try {
      await pool.query(
        `UPDATE providers SET
           description    = COALESCE(NULLIF(description, ''), $1),
           description_ar = COALESCE(NULLIF(description_ar, ''), $2),
           updated_at     = NOW()
         WHERE id = $3`,
        [String(result.en).trim(), String(result.ar).trim(), provider.id]
      );
      stats.success++;
    } catch (err) {
      stats.failed++;
      stats.failures.push({ id: provider.id, name: provider.name, error: `db: ${err.message}` });
    }
  }

  const elapsed = ((Date.now() - stats.startedAt) / 1000).toFixed(0);
  const rate = (stats.success / (elapsed || 1)).toFixed(1);
  log(
    `✓ batch [${stats.success}/${stats.total}] — ${batch.length} written, ${rate}/s, ${elapsed}s elapsed, tokens: ${stats.tokensIn}in/${stats.tokensOut}out`
  );
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
  log(`Write GCC descriptions — run ${RUN_ID}`);
  log(`═══════════════════════════════════════════════════════════════════`);
  log(`Mode:        ${TEST_MODE ? "TEST (1 batch)" : "FULL"}${DRY_RUN ? " [DRY RUN]" : ""}`);
  log(`Model:       ${MODEL}`);
  log(`Countries:   ${COUNTRIES.join(", ")}`);
  log(`Categories:  ${CATEGORIES.join(", ")}`);
  log(`Limit:       ${LIMIT}`);
  log(`Batch size:  ${BATCH_SIZE}`);
  log(`Concurrency: ${CONCURRENCY}`);
  log(``);

  const { rows } = await pool.query(
    `SELECT id, name, slug, address, city_slug, category_slug, country, google_place_details
     FROM providers
     WHERE country = ANY($1)
       AND category_slug = ANY($2)
       AND status = 'active'
       AND COALESCE(description, '') = ''
       AND google_place_details IS NOT NULL
     ORDER BY country, city_slug, name
     LIMIT $3`,
    [COUNTRIES, CATEGORIES, LIMIT]
  );

  log(`Found ${rows.length} providers needing descriptions`);
  log(``);

  if (rows.length === 0) {
    log("Nothing to do.");
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
    batchFailed: 0,
    cliCalls: 0,
    tokensIn: 0,
    tokensOut: 0,
    failures: [],
    startedAt: Date.now(),
  };

  await runPool(batches, (b) => processBatch(b, stats), CONCURRENCY);

  const elapsed = ((Date.now() - stats.startedAt) / 1000).toFixed(1);
  log(``);
  log(`═══════════════════════════════════════════════════════════════════`);
  log(`DONE in ${elapsed}s`);
  log(`═══════════════════════════════════════════════════════════════════`);
  log(`  Descriptions written: ${stats.success}/${stats.total}`);
  log(`  Failed:               ${stats.failed}`);
  log(`  Batch failures:       ${stats.batchFailed}`);
  log(`  Claude CLI calls:     ${stats.cliCalls}`);
  log(`  Tokens (in/out):      ${stats.tokensIn} / ${stats.tokensOut}`);

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
