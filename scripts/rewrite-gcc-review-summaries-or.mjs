#!/usr/bin/env node
/**
 * Fast GCC review-summary rewriter using OpenRouter (Gemini 3.1 Flash Lite by default).
 *
 * Much faster than spawning claude CLI per batch:
 *   - Direct HTTP to OpenRouter
 *   - Round-robin across 9 API keys for higher throughput
 *   - Node-native concurrency (not process fanout)
 *   - Same prompt + anti-AI-tells rules as the claude variant
 *   - Writes to same output file (data/gcc-rewritten-summaries.jsonl) — resume-compatible
 *
 * Usage:
 *   OPENROUTER_API_KEY=... node scripts/rewrite-gcc-review-summaries-or.mjs [--test] [--resume] [--concurrency=N] [--batch-size=N] [--model=NAME]
 *
 * Flags:
 *   --test           Process 10 providers only
 *   --resume         Skip already-processed IDs in output file
 *   --concurrency=N  Parallel in-flight requests (default: 20)
 *   --batch-size=N   Providers per API call (default: 10)
 *   --model=NAME     OpenRouter model name (default: google/gemini-2.5-flash-lite)
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const args = process.argv.slice(2);
const TEST_MODE = args.includes("--test");
const RESUME = args.includes("--resume");
const getArg = (name, def) => {
  const a = args.find((x) => x.startsWith(`--${name}=`));
  return a ? a.split("=")[1] : def;
};
const LIMIT = parseInt(getArg("limit", TEST_MODE ? "10" : "100000"), 10);
const CONCURRENCY = parseInt(getArg("concurrency", "20"), 10);
const BATCH_SIZE = parseInt(getArg("batch-size", "10"), 10);
const MODEL = getArg("model", "google/gemini-2.5-flash-lite");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const INPUT_JSONL = path.join(ROOT, "data", "gcc-providers-with-summaries.jsonl");
const OUTPUT_JSONL = path.join(ROOT, "data", "gcc-rewritten-summaries.jsonl");

const RUN_ID = Date.now();
const LOG = `/tmp/regen-gcc-or-${RUN_ID}.log`;
const FAILED = `/tmp/regen-gcc-or-${RUN_ID}-failed.json`;
function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(LOG, line + "\n");
}

// ─── Key pool (round-robin across up to 9 keys) ───────────────────────────
// Supports both naming conventions: OPENROUTER_KEY* (EC2) and OPENROUTER_API_KEY* (dev)
const API_KEYS = [];
const candidates = [
  process.env.OPENROUTER_KEY || process.env.OPENROUTER_API_KEY,
];
for (let i = 2; i <= 9; i++) {
  candidates.push(
    process.env[`OPENROUTER_KEY_${i}`] || process.env[`OPENROUTER_API_KEY_${i}`]
  );
}
for (const k of candidates) if (k) API_KEYS.push(k);
if (API_KEYS.length === 0) {
  console.error("No OPENROUTER_KEY* in env. Source /tmp/.or-keys.env first.");
  process.exit(1);
}
log(`Loaded ${API_KEYS.length} OpenRouter API keys for round-robin`);

let keyIndex = 0;
function nextKey() {
  const k = API_KEYS[keyIndex % API_KEYS.length];
  keyIndex++;
  return k;
}

// ─── Prompt — content-research-writer skill + anti-AI-tells skill (full 21 rules) ──
// NON-NEGOTIABLE per user: these rules are the full content-research-writer +
// anti-ai-tells skill, embedded inline because OpenRouter cannot invoke local skills.
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
SOURCE PATIENT FEEDBACK (truncated quotes — extract themes, never republish verbatim):
${sourceList}`;
    })
    .join("\n\n");

  return `You are operating under two strict skills combined:

SKILL 1 — CONTENT RESEARCH WRITER
You are a senior editorial writer synthesizing patient feedback into themed summaries for a healthcare directory. Your voice is direct, factual, and trustworthy. You preserve nuance, surface both positive and negative signals honestly, and write in the publication's editorial voice — never as a reviewer, never as a marketer. You ground every claim in the source material provided. Every sentence earns its place with specific, verifiable detail.

SKILL 2 — ANTI-AI WRITING TELLS (21 non-negotiable rules based on Wikipedia "Signs of AI Writing")
Apply these to EVERY bullet you produce. Self-check before returning:

1. NO PARALLEL NEGATION: never write "not X, it's Y", "not just X, but Y", "not only X but also Y", or set up a claim and reframe with "however"/"but". State both points directly.
2. NO INFLATED SYMBOLISM: cut "stands as", "testament to", "plays a vital role", "key turning point", "serves as a reminder", "marks a milestone", "defines an era".
3. NO SUPERFICIAL -ING ANALYSES: never end sentences with "-ing" commentary clauses like "...ensuring seamless care", "...highlighting the importance of", "...reflecting the broader trend", "...creating a welcoming environment".
4. NO PROMOTIONAL TONE: cut "rich heritage", "breathtaking", "vibrant", "nestled in", "in the heart of", "a must-visit", "world-class", "state-of-the-art", "cutting-edge", "elevate", "groundbreaking".
5. NO EM DASHES: use commas, semicolons, parentheses, or periods. Zero em dashes in the output.
6. NO WEASEL ATTRIBUTION: never write "experts say", "industry reports suggest", "it is widely believed", "many consider". Either name the source or drop the claim.
7. NO EMPTY EDITORIALIZING: cut "It's important to note", "worth mentioning", "it should be emphasized", "notably", "importantly".
8. NO CONJUNCTIVE PADDING: never start a sentence with "Moreover", "Furthermore", "Additionally", "In addition", "Subsequently".
9. NO BOLD-TITLE BULLETS: don't bold a lead phrase and then restate it in the bullet.
10. NO RULE OF THREE: vary list lengths. Never always group items in threes.
11. NO SECTION SUMMARIES: never write "In summary", "Overall", "In conclusion", "To sum up".
12. NO "NOT ONLY... BUT ALSO..." construction anywhere.
13. NO UNEARNED ADJECTIVES: cut "fascinating", "remarkable", "exceptional", "outstanding", "phenomenal" unless backed by specific evidence in the source.
14. SUBSTANCE OVER POLISH: prioritize concrete names of procedures, specific wait times, exact services, mentioned staff roles (not names unless clearly public). No smooth empty prose.
15. USE SIMPLE COPULATIVES: prefer "is", "are", "has", "does" over "serves as", "features", "offers", "provides", "encompasses".
16. NO SYNONYM CYCLING: don't rotate "the clinic", "the facility", "the establishment", "the provider" in successive sentences. Use "the clinic" consistently or "it".
17. NO FALSE RANGES: don't write "from X to Y" unless X and Y are on a real continuous scale.
18. NO "DESPITE CHALLENGES" FORMULA: don't sandwich a negative between two promotional bookends.
19. FORBIDDEN AI VOCABULARY CLUSTER: delve, pivotal, tapestry, landscape, underscore, foster, intricate, garner, showcase, testament, enduring, vibrant, crucial, enhance, align with, valuable insights, deeply rooted, commitment to excellence, navigating the complexities, rich tapestry, evolving landscape.
20. NO EMOJIS OR DECORATIVE SYMBOLS: strip anything like ★, ✓, 🌟, ❤️, emoji, arrows, bullets in bullet text.
21. SENTENCE CASE: never Title Case Every Major Word in the bullet text.

ADDITIONAL TASK-SPECIFIC RULES (beyond the 21):
- Output a JSON object mapping provider ID → array of 3–5 themed bullets. Each bullet is one complete sentence, 15–28 words, with a concrete factual theme.
- NEVER copy a phrase longer than 4 consecutive words from any source quote.
- NEVER fabricate facts not present in the source quotes.
- If source quotes are mixed (positive + negative), include both sides honestly. If overwhelmingly positive, say so without overselling.
- Use aggregation language only when justified by count: "Most patients note..." (3+ mentions), "Several reviewers mention..." (2+), "At least one reviewer notes..." (1).
- No first-person (no "I", no "we", no "us"). Write in third-person editorial voice.

INPUT — ${providers.length} healthcare providers:

${items}

OUTPUT FORMAT — JSON object ONLY, no markdown, no preamble, no code fences, no explanation:
{
  "${providers[0]?.id || "provider_id_here"}": ["First themed bullet here.", "Second themed bullet here.", "Third themed bullet here.", "Fourth themed bullet here."]${providers.length > 1 ? ",\n  ..." : ""}
}

Before returning your output, self-check: scan for each of the 21 forbidden patterns above and rewrite any bullet that matches. Return only the JSON object.`;
}

// ─── OpenRouter HTTP call with retry ──────────────────────────────────────
async function callOpenRouter(prompt, attempt = 1, maxAttempts = 4) {
  const key = nextKey();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000); // 120s
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${key}`,
        "HTTP-Referer": "https://www.zavis.ai",
        "X-Title": "Zavis GCC Review Rewriter",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 4000,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`HTTP ${res.status}: ${errText.slice(0, 200)}`);
    }
    const json = await res.json();
    const content = json.choices?.[0]?.message?.content;
    if (!content) throw new Error("no content in response");
    return content.trim();
  } catch (err) {
    const msg = err.message || String(err);
    const retryable =
      msg.includes("timeout") ||
      msg.includes("aborted") ||
      msg.includes("429") ||
      msg.includes("503") ||
      msg.includes("500") ||
      msg.includes("ECONNRESET");
    if (retryable && attempt < maxAttempts) {
      const backoff = 1500 * attempt + Math.random() * 1000;
      await new Promise((r) => setTimeout(r, backoff));
      return callOpenRouter(prompt, attempt + 1, maxAttempts);
    }
    throw err;
  }
}

function parseBatchOutput(raw, expectedIds) {
  let cleaned = raw.trim();
  const fence = cleaned.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
  if (fence) cleaned = fence[1];
  const objMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!objMatch) throw new Error("no JSON object in output");
  const parsed = JSON.parse(objMatch[0]);
  if (typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("not an object");

  const validated = {};
  for (const id of expectedIds) {
    const bullets = parsed[id];
    if (!Array.isArray(bullets)) continue;
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
    const raw = await callOpenRouter(prompt);
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
    const eta = stats.total > stats.success + stats.failed
      ? (((stats.total - stats.success - stats.failed) / parseFloat(rate)) / 60).toFixed(0)
      : 0;
    log(
      `✓ batch +${writtenInBatch}/${batch.length} | ${stats.success}/${stats.total} ok, ${stats.failed} fail | ${rate}/s | ${elapsed}s | ETA ${eta}m`
    );
  } catch (err) {
    log(`✗ batch of ${batch.length} failed: ${err.message}`);
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

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
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
  log(`GCC rewrite via OpenRouter — run ${RUN_ID}`);
  log(`═══════════════════════════════════════════════`);
  log(`Model: ${MODEL}`);
  log(`Concurrency: ${CONCURRENCY}`);
  log(`Batch size: ${BATCH_SIZE}`);
  log(`Mode: ${TEST_MODE ? "TEST" : "FULL"}`);
  log(`Resume: ${RESUME}`);

  const allProviders = fs
    .readFileSync(INPUT_JSONL, "utf-8")
    .split("\n")
    .filter((l) => l.trim())
    .map((l) => {
      try {
        return JSON.parse(l);
      } catch {
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
