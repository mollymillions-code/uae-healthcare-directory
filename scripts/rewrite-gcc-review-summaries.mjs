#!/usr/bin/env node
/**
 * Rewrite GCC review_summary to remove duplicate-content liability.
 *
 * THE PROBLEM: GCC providers (BH/KW/QA/SA) currently store the first 200
 * characters of each top Google review verbatim in `review_summary`.
 * That's literally republishing user-generated content from Google Maps,
 * which (a) is a duplicate-content / de-rank risk on SERP, and (b) violates
 * Google Maps TOS §3.2.4(b) on permanent caching of review prose.
 *
 * THE FIX: Use the truncated quotes already in the DB as input, pass to
 * claude CLI (sonnet) with strict anti-AI-tells rules, and rewrite into
 * themed bullets in the directory editor's voice. No Places API calls.
 * Cost: $0 marginal — uses existing Claude subscription.
 *
 * Pipeline:
 *   1. Dump GCC providers + their existing review_summary to JSONL on EC2
 *   2. SCP locally
 *   3. For each provider, pipe to `claude -p --model sonnet` with rules
 *   4. Stream results to data/gcc-rewritten-summaries.jsonl
 *   5. Generate UPDATE SQL, push back to EC2, apply
 *
 * Usage:
 *   node scripts/rewrite-gcc-review-summaries.mjs [--test] [--limit=N] [--concurrency=N] [--resume]
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";

const args = process.argv.slice(2);
const TEST_MODE = args.includes("--test");
const RESUME = args.includes("--resume");
const getArg = (name, def) => {
  const a = args.find((x) => x.startsWith(`--${name}=`));
  return a ? a.split("=")[1] : def;
};
const LIMIT = parseInt(getArg("limit", TEST_MODE ? "10" : "100000"), 10);
const CONCURRENCY = parseInt(getArg("concurrency", "6"), 10);
const BATCH_SIZE = parseInt(getArg("batch-size", "8"), 10); // providers per claude call

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const INPUT_JSONL = path.join(ROOT, "data", "gcc-providers-with-summaries.jsonl");
const OUTPUT_JSONL = path.join(ROOT, "data", "gcc-rewritten-summaries.jsonl");

const RUN_ID = Date.now();
const LOG = `/tmp/regen-gcc-${RUN_ID}.log`;
const FAILED = `/tmp/regen-gcc-${RUN_ID}-failed.json`;
function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(LOG, line + "\n");
}

// ─── Prompt builder — batched: handles N providers in one claude call ──
function buildBatchPrompt(providers) {
  const items = providers
    .map((p, i) => {
      const existing = Array.isArray(p.review_summary) ? p.review_summary : [];
      const sourceList = existing.map((b, j) => `    [${j + 1}] "${b}"`).join("\n");
      return `=== PROVIDER ${i + 1} ===
ID: ${p.id}
NAME: ${p.name}
COUNTRY: ${p.country.toUpperCase()}
CATEGORY: ${p.category_slug}
RATING: ${p.google_rating || "?"}/5 (${p.google_review_count || 0} Google reviews)
SOURCE QUOTES (do NOT republish — paraphrase themes only):
${sourceList}`;
    })
    .join("\n\n");

  return `You are a healthcare directory editor for the UAE Open Healthcare Directory by Zavis. For each provider below, write a 4-bullet THEMED SUMMARY of the patient reviews in the directory editor's voice.

${items}

OUTPUT REQUIREMENTS — strict, no exceptions:
- Output exactly one JSON object, no markdown, no preamble, no code fences.
- The JSON object maps each provider ID to an array of 3-5 strings.
- Each bullet is one complete factual sentence (15-28 words) describing a recurring theme across multiple reviews for that provider.
- Group what reviewers commonly say. Patterns like "Most patients note...", "Several reviewers mention...", "A small number report..." are appropriate.
- Reference specifics that reviewers actually mentioned (treatments, wait times, cleanliness, communication, follow-up, pricing, staff helpfulness) but in YOUR words.
- If quotes are mixed, include both sides honestly. If overwhelmingly positive, say so without overselling.
- NEVER copy a phrase longer than 4 consecutive words from any source quote.
- NEVER fabricate facts not present in the source.
- Strip emojis and symbols entirely.
- NEVER use these AI-tell phrases: "stands as", "testament to", "vibrant", "renowned for", "boasts", "nestled", "in the heart of", "showcasing", "highlighting", "underscoring", "reflects", "underscores its", "commitment to excellence", "navigating the complexities", "delve into", "rich tapestry", "evolving landscape", "key turning point", "groundbreaking", "world-class", "state-of-the-art", "cutting-edge", "elevate", "elevate the experience".
- NEVER use the "not just X, but Y" / "not only X but also Y" parallel-negation construction.
- NEVER end sentences with present-participle "-ing" commentary clauses like "...creating a welcoming environment".
- NEVER use em dashes; use commas, semicolons, or periods.
- Plain factual healthcare directory tone. Not promotional, not dramatic.
- For providers with sparse source quotes, write 3 bullets instead of 4.

OUTPUT JSON SHAPE (exactly this structure, with one entry per provider above):
{
  "${providers[0]?.id || "provider_id_here"}": ["First themed bullet here.", "Second themed bullet here.", "Third themed bullet here.", "Fourth themed bullet here."]${providers.length > 1 ? ",\n  ..." : ""}
}`;
}

// ─── Spawn claude CLI with retry on timeout/transient failures ────────────
async function callClaude(prompt, attempt = 1, maxAttempts = 3) {
  try {
    return await callClaudeOnce(prompt);
  } catch (err) {
    const msg = err.message || String(err);
    const retryable =
      msg.includes("timeout") ||
      msg.includes("exit 1") ||
      msg.includes("ECONNRESET") ||
      msg.includes("rate");
    if (retryable && attempt < maxAttempts) {
      const backoff = 2000 * attempt + Math.random() * 1000;
      await new Promise((r) => setTimeout(r, backoff));
      return callClaude(prompt, attempt + 1, maxAttempts);
    }
    throw err;
  }
}

function callClaudeOnce(prompt) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      "claude",
      [
        "-p",
        "--model",
        "sonnet",
        "--allow-dangerously-skip-permissions",
        "--output-format",
        "text",
        "--disable-slash-commands",
      ],
      { stdio: ["pipe", "pipe", "pipe"] }
    );

    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error("claude timeout (240s)"));
    }, 240000);

    child.stdout.on("data", (d) => (stdout += d.toString()));
    child.stderr.on("data", (d) => (stderr += d.toString()));
    child.on("error", (e) => {
      clearTimeout(timer);
      reject(e);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code !== 0) {
        reject(new Error(`claude exit ${code}: ${stderr.slice(0, 300)}`));
      } else {
        resolve(stdout.trim());
      }
    });

    child.stdin.write(prompt);
    child.stdin.end();
  });
}

function parseBatchOutput(raw, expectedIds) {
  // Strip code fences
  let cleaned = raw.trim();
  const fence = cleaned.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
  if (fence) cleaned = fence[1];

  // Find the outermost JSON object
  const objMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!objMatch) throw new Error("no JSON object in output");

  const parsed = JSON.parse(objMatch[0]);
  if (typeof parsed !== "object" || Array.isArray(parsed))
    throw new Error("not an object");

  const validated = {};
  for (const id of expectedIds) {
    const bullets = parsed[id];
    if (!Array.isArray(bullets)) {
      // Skip silently — some providers may legitimately fail; we'll log and retry
      continue;
    }
    if (bullets.length < 2 || bullets.length > 6) continue;
    const valid = bullets.every(
      (b) => typeof b === "string" && b.length >= 15 && b.length <= 400
    );
    if (!valid) continue;
    validated[id] = bullets;
  }
  return validated;
}

async function processBatch(batch, stats, outStream) {
  const ids = batch.map((p) => p.id);
  try {
    const prompt = buildBatchPrompt(batch);
    const raw = await callClaude(prompt);
    const validated = parseBatchOutput(raw, ids);

    let writtenInBatch = 0;
    for (const provider of batch) {
      const summary = validated[provider.id];
      if (summary) {
        outStream.write(
          JSON.stringify({ id: provider.id, name: provider.name, summary }) + "\n"
        );
        stats.success++;
        writtenInBatch++;
      } else {
        stats.failed++;
        stats.failures.push({
          id: provider.id,
          name: provider.name,
          error: "no valid summary in batch response",
        });
      }
    }

    const elapsed = ((Date.now() - stats.startedAt) / 1000).toFixed(0);
    const rate = (stats.success / (elapsed || 1)).toFixed(1);
    log(
      `✓ batch +${writtenInBatch}/${batch.length} | total ${stats.success}/${stats.total} | ${rate}/s | ${elapsed}s`
    );
  } catch (err) {
    log(`✗ batch failed (${batch.length} providers): ${err.message}`);
    for (const provider of batch) {
      stats.failed++;
      stats.failures.push({
        id: provider.id,
        name: provider.name,
        error: err.message,
      });
    }
  }
}

// Chunk an array into batches of size N
function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
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
  log(`═══════════════════════════════════════════════`);
  log(`Rewrite GCC review_summary — run ${RUN_ID}`);
  log(`═══════════════════════════════════════════════`);
  log(`Mode: ${TEST_MODE ? "TEST" : "FULL"}`);
  log(`Limit: ${LIMIT}`);
  log(`Concurrency: ${CONCURRENCY}`);
  log(`Resume: ${RESUME}`);
  log(`Input:  ${INPUT_JSONL}`);
  log(`Output: ${OUTPUT_JSONL}`);

  const allProviders = fs
    .readFileSync(INPUT_JSONL, "utf-8")
    .split("\n")
    .filter((l) => l.trim().length > 0)
    .map((line, i) => {
      try {
        return JSON.parse(line);
      } catch (e) {
        log(`skip malformed line ${i + 1}: ${e.message.slice(0, 60)}`);
        return null;
      }
    })
    .filter(Boolean);
  log(`Loaded ${allProviders.length} providers`);

  let alreadyDone = new Set();
  if (RESUME && fs.existsSync(OUTPUT_JSONL)) {
    const existing = fs.readFileSync(OUTPUT_JSONL, "utf-8").split("\n").filter(Boolean);
    for (const line of existing) {
      try { alreadyDone.add(JSON.parse(line).id); } catch {}
    }
    log(`Resume: skipping ${alreadyDone.size} already-processed`);
  }

  const todo = allProviders.filter((p) => !alreadyDone.has(p.id)).slice(0, LIMIT);
  log(`To process: ${todo.length}`);
  log(`Batch size: ${BATCH_SIZE} providers per claude call`);

  const outStream = fs.createWriteStream(OUTPUT_JSONL, { flags: "a" });

  const stats = {
    total: todo.length,
    success: 0,
    failed: 0,
    failures: [],
    startedAt: Date.now(),
  };

  const batches = chunk(todo, BATCH_SIZE);
  log(`Total batches: ${batches.length}`);

  await runPool(batches, (batch) => processBatch(batch, stats, outStream), CONCURRENCY);

  outStream.end();

  const elapsed = ((Date.now() - stats.startedAt) / 1000).toFixed(0);
  log(``);
  log(`═══════════════════════════════════════════════`);
  log(`DONE in ${elapsed}s`);
  log(`═══════════════════════════════════════════════`);
  log(`  OK:     ${stats.success}/${stats.total}`);
  log(`  Failed: ${stats.failed}`);
  log(`  Output: ${OUTPUT_JSONL}`);

  if (stats.failures.length) {
    fs.writeFileSync(FAILED, JSON.stringify(stats.failures, null, 2));
    log(`  Failures → ${FAILED}`);
  }
}

main().catch((err) => {
  log(`FATAL: ${err.stack || err.message}`);
  process.exit(1);
});
