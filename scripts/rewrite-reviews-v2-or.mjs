#!/usr/bin/env node
/**
 * V2 review-section rewriter — builds the bulky "What patients say" block.
 *
 * Input per provider: raw google_reviews JSONB (from comprehensive enrichment).
 * Output per provider: JSONB written to providers.review_summary_v2 with shape:
 *
 *   {
 *     "version": 2,
 *     "overall_sentiment": "<80-120 word original editorial paragraph>",
 *     "what_stood_out": [
 *       { "theme": "Staff professionalism", "mention_count": 12 },
 *       ...
 *     ],
 *     "snippets": [
 *       {
 *         "text_fragment": "<half-sentence partial quote, not verbatim start-to-end>",
 *         "author_display": "Rashid M.",
 *         "rating": 5,
 *         "relative_time": "3 months ago"
 *       },
 *       ...
 *     ],
 *     "source": "google_maps",
 *     "synced_at": "<ISO8601>"
 *   }
 *
 * SEO goals this format targets:
 *   - 80-120 words original editorial per provider × thousands of providers
 *     = mass of unique long-form content.
 *   - Partial-quote snippets (half-sentence, never the full review) avoid
 *     duplicate-content penalties while staying authentic.
 *   - Author names + relative times support schema.org Review rich snippets.
 *   - Theme bullets with counts give scannable unique answers to
 *     "what do people say about X".
 *
 * Anti-AI-tells rules (21-rule set from content-research-writer skill)
 * embedded inline — LLM cannot invoke local skills.
 *
 * Usage (from local dev laptop):
 *   source /tmp/.or-keys.env  (round-robin OpenRouter keys)
 *   node scripts/rewrite-reviews-v2-or.mjs [--test] [--resume] [--limit=N]
 *
 * Pipeline:
 *   1. SSH-dump providers with google_reviews to JSONL
 *   2. Process each via OpenRouter (round-robin keys, high concurrency)
 *   3. Stream results to JSONL
 *   4. Run separate apply step to UPDATE live DB
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const args = process.argv.slice(2);
const TEST_MODE = args.includes("--test");
const RESUME = args.includes("--resume");
const getArg = (name, def) => {
  const a = args.find((x) => x.startsWith(`--${name}=`));
  return a ? a.split("=")[1] : def;
};
const LIMIT = parseInt(getArg("limit", TEST_MODE ? "5" : "100000"), 10);
const CONCURRENCY = parseInt(getArg("concurrency", "10"), 10);
const MODEL = getArg("model", "google/gemini-2.5-flash-lite");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const INPUT_JSONL = path.join(ROOT, "data", "providers-v2-input.jsonl");
const OUTPUT_JSONL = path.join(ROOT, "data", "review-summary-v2-out.jsonl");

const RUN_ID = Date.now();
const LOG = `/tmp/rewrite-v2-${RUN_ID}.log`;
const FAILED = `/tmp/rewrite-v2-${RUN_ID}-failed.json`;
function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(LOG, line + "\n");
}

// ─── Key pool ──────────────────────────────────────────────────────────────
const API_KEYS = [];
const candidates = [process.env.OPENROUTER_KEY || process.env.OPENROUTER_API_KEY];
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
log(`Loaded ${API_KEYS.length} OpenRouter API keys`);
let keyIndex = 0;
const nextKey = () => API_KEYS[keyIndex++ % API_KEYS.length];

// ─── SSH-dump stage ───────────────────────────────────────────────────────
function dumpProvidersIfMissing() {
  if (fs.existsSync(INPUT_JSONL) && fs.statSync(INPUT_JSONL).size > 1000) {
    log(`Using existing dump: ${INPUT_JSONL}`);
    return;
  }
  log("Dumping providers with raw google_reviews from EC2...");
  const remoteScript = `#!/bin/bash
sudo -u postgres psql zavis_landing -P format=unaligned -P tuples_only=on -P pager=off -P recordsep_zero <<'PSQL'
SELECT json_build_object(
  'id', id,
  'name', name,
  'country', country,
  'category_slug', category_slug,
  'google_rating', google_rating,
  'google_review_count', google_review_count,
  'google_maps_uri', google_maps_uri,
  'google_reviews', google_reviews
)::text
FROM providers
WHERE country = 'ae'
  AND status = 'active'
  AND google_reviews IS NOT NULL
  AND jsonb_array_length(google_reviews) >= 3
ORDER BY id;
PSQL
`;
  fs.writeFileSync("/tmp/dump-v2-input.sh", remoteScript);
  execSync(
    `scp -i ~/.ssh/zavis-ec2.pem /tmp/dump-v2-input.sh ubuntu@13.205.197.148:/tmp/`,
    { stdio: "inherit" }
  );
  execSync(
    `ssh -i ~/.ssh/zavis-ec2.pem ubuntu@13.205.197.148 "bash /tmp/dump-v2-input.sh > /tmp/providers-v2-input.raw"`,
    { stdio: "inherit" }
  );
  // Normalize null-byte separators to newlines
  const pyNorm = `
import sys
with open('/tmp/providers-v2-input.raw','rb') as f: data=f.read()
records=data.split(b'\\x00')
out=[]
import json
for r in records:
  r=r.strip()
  if not r: continue
  try:
    json.loads(r.decode('utf-8'))
    out.append(r.decode('utf-8'))
  except: pass
with open('/tmp/providers-v2-input.jsonl','w') as f:
  for line in out: f.write(line+'\\n')
print(f'Wrote {len(out)} rows')
`;
  fs.writeFileSync("/tmp/norm-v2.py", pyNorm);
  execSync(
    `scp -i ~/.ssh/zavis-ec2.pem /tmp/norm-v2.py ubuntu@13.205.197.148:/tmp/`,
    { stdio: "inherit" }
  );
  execSync(
    `ssh -i ~/.ssh/zavis-ec2.pem ubuntu@13.205.197.148 "python3 /tmp/norm-v2.py"`,
    { stdio: "inherit" }
  );
  execSync(
    `scp -i ~/.ssh/zavis-ec2.pem ubuntu@13.205.197.148:/tmp/providers-v2-input.jsonl "${INPUT_JSONL}"`,
    { stdio: "inherit" }
  );
  log(`Dumped to ${INPUT_JSONL}`);
}

// ─── Prompt builder ────────────────────────────────────────────────────────
function buildPrompt(provider) {
  const {
    id,
    name,
    country,
    category_slug,
    google_rating,
    google_review_count,
    google_reviews,
  } = provider;

  // Use ALL available raw reviews (not just 5) — we want quantity + volume.
  // Google Places (New) returns max 5 reviews per place, so this pulls the
  // full set the API gives us. Filtered only on minimum length so garbage
  // doesn't bloat the prompt.
  const reviewsForPrompt = (Array.isArray(google_reviews) ? google_reviews : [])
    .filter((r) => (r.text?.text || r.originalText?.text || "").length > 20)
    .map((r, i) => ({
      idx: i + 1,
      text: (r.text?.text || r.originalText?.text || "").trim(),
      rating: r.rating || 0,
      author: r.authorAttribution?.displayName || "",
      relative_time: r.relativePublishTimeDescription || "",
    }));

  const reviewsBlock = reviewsForPrompt
    .map(
      (r) =>
        `[R${r.idx}] ${r.rating}★ by "${r.author}" (${r.relative_time}):\n${r.text}`
    )
    .join("\n\n");

  return `You are the senior editorial writer for the UAE Open Healthcare Directory by Zavis. Your goal is to build a rich "What patients say" section for a provider page that maximizes SEO value (original long-form content + structured data) and user trust (authentic voices, scannable themes).

BEFORE YOU WRITE, MEMORIZE THIS BANNED-WORD LIST. YOU MAY NOT USE ANY OF THESE IN YOUR OUTPUT:
stands as, testament to, nestled, in the heart of, world-class, state-of-the-art, cutting-edge, vibrant, showcasing, commitment to excellence, rich tapestry, evolving landscape, key turning point, renowned, groundbreaking, boasts, serves as, delve, pivotal, tapestry, underscore, foster, fosters, intricate, garner, garners, garnering, enduring, align with, not only, not just, overall, moreover, furthermore, additionally, notably, importantly, it's important to note, worth mentioning, experts say, industry reports suggest, in summary, in conclusion, to sum up, despite challenges, remarkable, fascinating, enhance.

ALSO: never use em dashes (—). Use commas, semicolons, or periods.
ALSO: never start a sentence with "Moreover", "Furthermore", "Additionally", "Overall", or "Notably".
ALSO: never end a sentence with an -ing clause like "...ensuring patient satisfaction" or "...fostering a welcoming environment".


PROVIDER
========
ID:         ${id}
Name:       ${name}
Country:    ${country.toUpperCase()}
Category:   ${category_slug}
Rating:     ${google_rating || "?"}/5 (${google_review_count || 0} Google reviews)

RAW PATIENT REVIEWS (do NOT reproduce verbatim — paraphrase themes, and only quote HALF a sentence at most)
================================================================================
${reviewsBlock}

YOUR TASK
=========
Produce a single JSON object with this exact shape (no markdown, no preamble, no code fences):

{
  "version": 2,
  "overall_sentiment": "<A LONG 6-10 sentence original editorial paragraph, 180-260 words, in the directory editor's voice. Write with substance and volume — pages need lots of original readable content. Synthesize every theme reviewers commonly mention, going into specific detail on each: staff conduct, wait times, cleanliness, communication, specific procedures offered, follow-up care, pricing, parking, language support, front desk experience, scheduling, insurance handling. Balance positive and negative if both exist. Use patterns like 'Most patients describe...', 'Several reviewers mention...', 'A small number report...'. Never copy more than 4 consecutive words from any review. Never invent facts not present in the reviews.>",
  "what_stood_out": [
    { "theme": "<3-6 word topic>", "mention_count": <realistic count> },
    <6-10 total bullets — go for MORE themes, not fewer. Break general themes into specific subtopics where possible.>
  ],
  "snippets": [
    {
      "text_fragment": "<A partial quote from one of the reviews. Take roughly HALF of the most impactful sentence or clause. 60-180 chars. Start with '...' if cutting the beginning, end with '...' if cutting the end. Must exist as a contiguous substring inside the source review text, minus the ellipses. The substring itself must be exactly as written in the source (no paraphrasing inside the snippet).>",
      "author_display": "<First name + last initial, e.g. 'Rashid M.' (derive from review author data — strip all but first letter of surname)>",
      "rating": <1-5>,
      "relative_time": "<e.g. '3 months ago', from review data>"
    },
    <Emit ONE snippet per provided review, so if 5 raw reviews, emit 5 snippets; if 4 raw, emit 4. Never skip a review. Volume matters.>
  ],
  "source": "google_maps",
  "synced_at": "${new Date().toISOString()}"
}

OUTPUT RULES (21 anti-AI-tell rules, non-negotiable)
====================================================
1.  NO parallel negation: "not X, it's Y", "not just X but Y", "not only X but also Y".
2.  NO inflated symbolism: "stands as", "testament to", "plays a vital role", "key turning point".
3.  NO superficial -ing endings: "...ensuring seamless care", "...highlighting the importance".
4.  NO promotional tone: "rich heritage", "vibrant", "nestled", "in the heart of", "world-class", "state-of-the-art", "cutting-edge".
5.  NO em dashes anywhere. Use commas, semicolons, or periods.
6.  NO weasel attribution: "experts say", "industry reports suggest".
7.  NO empty editorializing: "It's important to note", "worth mentioning".
8.  NO conjunctive padding: "Moreover", "Furthermore", "Additionally".
9.  NO bold-title bullets restating the title in the bullet text.
10. NO strict rule of three: vary list lengths.
11. NO section summaries: "In summary", "Overall", "In conclusion".
12. NO "not only X but also Y".
13. NO unearned adjectives: "fascinating", "remarkable" without specific evidence.
14. SUBSTANCE over polish: concrete procedures, specific wait times, named roles.
15. Use simple copulatives: "is", "are", "has" — not "serves as", "features", "offers".
16. NO synonym cycling: stick with "the clinic" or "it" across sentences.
17. NO false ranges: "from X to Y" unless X and Y are on a real scale.
18. NO "despite challenges" formula.
19. FORBIDDEN vocabulary: delve, pivotal, tapestry, landscape, underscore, foster, intricate, garner, showcase, testament, enduring, vibrant, crucial, enhance, align with.
20. NO emojis, stars, or decorative symbols in text (snippets can have star ratings as data).
21. SENTENCE CASE — never Title Case Every Word.

SNIPPET-SPECIFIC RULES
======================
- Each snippet text_fragment must be a HALF-QUOTE: exactly one clause, 40-120 characters. Must exist inside the source review as a contiguous substring (with the "..." ellipses added by you).
- First name + last initial only (strip anything after first letter of surname). If no surname, use first name only.
- Keep the relative_time exactly as provided.
- Pick snippets that collectively paint a balanced picture. If 5 reviews are all 5-star raves, the snippets should reflect that. If reviews are mixed, include at least one critical voice.

Return ONLY the JSON object. No explanation before or after. No markdown fencing.`;
}

// ─── OpenRouter call ───────────────────────────────────────────────────────
async function callOpenRouter(prompt, attempt = 1, maxAttempts = 4) {
  const key = nextKey();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000);
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
        "HTTP-Referer": "https://www.zavis.ai",
        "X-Title": "Zavis v2 Reviews Rewriter",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.35,
        // Higher ceiling for the new bulky format: long overview (up to ~350
        // tokens) + 6-10 themes + up to 5 snippets each up to 50 tokens.
        max_tokens: 3500,
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
      msg.includes("500") ||
      msg.includes("503") ||
      msg.includes("ECONNRESET");
    if (retryable && attempt < maxAttempts) {
      const backoff = 1500 * attempt + Math.random() * 800;
      await new Promise((r) => setTimeout(r, backoff));
      return callOpenRouter(prompt, attempt + 1, maxAttempts);
    }
    throw err;
  }
}

// ─── Output parser + validator ────────────────────────────────────────────
function parseV2Output(raw, provider) {
  let cleaned = raw.trim();
  const fence = cleaned.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
  if (fence) cleaned = fence[1];
  const objMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!objMatch) throw new Error("no JSON object in output");
  const parsed = JSON.parse(objMatch[0]);

  // Validate shape — enforce the QUANTITY + VOLUME targets.
  if (parsed.version !== 2) throw new Error("missing version=2");
  if (
    typeof parsed.overall_sentiment !== "string" ||
    parsed.overall_sentiment.length < 500 ||
    parsed.overall_sentiment.length > 2500
  ) {
    throw new Error(
      `overall_sentiment bad length: ${parsed.overall_sentiment?.length} (need 500-2500 chars = ~180-260 words)`
    );
  }
  if (
    !Array.isArray(parsed.what_stood_out) ||
    parsed.what_stood_out.length < 5 ||
    parsed.what_stood_out.length > 12
  ) {
    throw new Error(
      `what_stood_out bad length: ${parsed.what_stood_out?.length} (need 5-12 themes)`
    );
  }
  for (const t of parsed.what_stood_out) {
    if (!t.theme || typeof t.theme !== "string") throw new Error("theme missing");
    if (typeof t.mention_count !== "number") throw new Error("mention_count missing");
  }
  if (!Array.isArray(parsed.snippets) || parsed.snippets.length < 2) {
    throw new Error("snippets missing");
  }
  for (const s of parsed.snippets) {
    if (
      typeof s.text_fragment !== "string" ||
      s.text_fragment.length < 18 ||
      s.text_fragment.length > 300
    ) {
      throw new Error(`snippet length bad: ${s.text_fragment?.length}`);
    }
    if (!s.author_display || typeof s.author_display !== "string") {
      throw new Error("author_display missing");
    }
    if (typeof s.rating !== "number" || s.rating < 1 || s.rating > 5) {
      throw new Error("rating bad");
    }
  }

  // Anti-AI-tell scan on overall_sentiment — the 21-rule set from the
  // content-research-writer skill. Failures force the rewriter to retry
  // via the caller's catch-retry loop (or get logged as final failures).
  const tells = [
    // Inflated symbolism / promotional
    "stands as",
    "testament to",
    "nestled",
    "in the heart of",
    "world-class",
    "state-of-the-art",
    "cutting-edge",
    "vibrant",
    "showcasing",
    "commitment to excellence",
    "rich tapestry",
    "evolving landscape",
    "key turning point",
    "renowned",
    "groundbreaking",
    "boasts",
    "serves as",
    // Forbidden vocabulary cluster
    "delve",
    "pivotal",
    "tapestry",
    "underscore",
    " foster",
    "fosters",
    "fostering",
    "intricate",
    "garner",
    "garners",
    "garnering",
    "enduring",
    "align with",
    "enhance",
    "enhances",
    "enhancing",
    "remarkable",
    "fascinating",
    // Parallel negation
    "not only",
    "not just",
    "it's not just",
    // Section summaries
    "overall,",
    "in summary",
    "in conclusion",
    "to sum up",
    // Empty editorializing
    "it's important to note",
    "worth mentioning",
    "notably,",
    "importantly,",
    // Conjunctive padding
    "moreover,",
    "furthermore,",
    "additionally,",
    // Weasel
    "experts say",
    "industry reports suggest",
  ];
  const lowerSent = parsed.overall_sentiment.toLowerCase();
  for (const t of tells) {
    if (lowerSent.includes(t)) throw new Error(`AI-tell detected: "${t.trim()}"`);
  }
  if (parsed.overall_sentiment.includes("—")) {
    throw new Error("em dash in overall_sentiment");
  }

  // Ensure source is set correctly
  parsed.source = "google_maps";
  parsed.synced_at = new Date().toISOString();

  return parsed;
}

// ─── Per-provider processing ──────────────────────────────────────────────
async function processProvider(provider, stats, outStream) {
  try {
    // Retry up to 2 extra times when validation catches an AI-tell:
    // each retry appends the specific banned phrase to the user prompt
    // as a targeted warning. Non-tell failures (length, shape) don't
    // benefit from retry so we fail fast on those.
    let prompt = buildPrompt(provider);
    let v2 = null;
    let lastErr = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const raw = await callOpenRouter(prompt);
        v2 = parseV2Output(raw, provider);
        break;
      } catch (err) {
        lastErr = err;
        const msg = err.message || String(err);
        if (attempt < 2 && msg.startsWith("AI-tell detected")) {
          // Amplify the ban in the next try
          const match = msg.match(/"([^"]+)"/);
          const banned = match ? match[1] : "";
          prompt = `${prompt}\n\nCRITICAL: On your previous attempt you used the banned phrase "${banned}". This phrase is forbidden. Rewrite without it. Do not use any promotional or inflated language. Be concrete and factual.`;
          continue;
        }
        if (attempt < 2 && (msg.includes("length bad") || msg.includes("bad length"))) {
          prompt = `${prompt}\n\nCRITICAL: Your previous attempt had invalid output length. Hit the exact targets: overall_sentiment MUST be 180-260 words (500-2500 chars), what_stood_out MUST be 5-12 items, snippets MUST be 25-300 chars each.`;
          continue;
        }
        throw err;
      }
    }
    if (!v2) throw lastErr || new Error("no v2 produced");

    outStream.write(
      JSON.stringify({ id: provider.id, name: provider.name, v2 }) + "\n"
    );

    stats.success++;
    if (stats.success % 20 === 0 || stats.success === stats.total) {
      const elapsed = ((Date.now() - stats.startedAt) / 1000).toFixed(0);
      const rate = (stats.success / (elapsed || 1)).toFixed(1);
      const eta =
        stats.total > stats.success + stats.failed
          ? (
              ((stats.total - stats.success - stats.failed) / parseFloat(rate)) /
              60
            ).toFixed(0)
          : 0;
      log(
        `✓ ${stats.success}/${stats.total} ok, ${stats.failed} fail | ${rate}/s | ${elapsed}s | ETA ${eta}m`
      );
    }
  } catch (err) {
    stats.failed++;
    stats.failures.push({
      id: provider.id,
      name: provider.name,
      error: err.message,
    });
    if (stats.failed <= 10) {
      log(`✗ ${provider.name}: ${err.message}`);
    }
  }
}

// ─── Concurrency pool ─────────────────────────────────────────────────────
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

// ─── Main ─────────────────────────────────────────────────────────────────
async function main() {
  log("═══════════════════════════════════════════════");
  log(`Review summary v2 rewrite — run ${RUN_ID}`);
  log("═══════════════════════════════════════════════");
  log(`Model: ${MODEL}`);
  log(`Concurrency: ${CONCURRENCY}`);
  log(`Mode: ${TEST_MODE ? "TEST" : "FULL"}`);
  log(`Resume: ${RESUME}`);

  dumpProvidersIfMissing();

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
      try {
        alreadyDone.add(JSON.parse(line).id);
      } catch {}
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

  await runPool(todo, (p) => processProvider(p, stats, outStream), CONCURRENCY);
  outStream.end();

  const elapsed = ((Date.now() - stats.startedAt) / 1000).toFixed(0);
  log("");
  log("═══════════════════════════════════════════════");
  log(`DONE in ${elapsed}s`);
  log("═══════════════════════════════════════════════");
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
