#!/usr/bin/env node
/**
 * Scrub stale numeric-rating claims from review_summary bullets where the
 * numeric claim doesn't match the actual google_rating in DB.
 *
 * Example: Al Yalayis google_rating=4.1, review_summary[0]="Solid 4.6-star rating..."
 * Remove that bullet. If the bullet list becomes empty, keep it empty (the
 * front-end already handles empty review_summary gracefully).
 *
 * Writes to review_summary_legacy before overwriting review_summary (same
 * pattern as the GCC rewriter, so we can rollback).
 *
 * Usage:
 *   node scripts/scrub-stale-rating-claims.mjs              # dry-run preview
 *   node scripts/scrub-stale-rating-claims.mjs --apply      # apply to live DB via SSH
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

const APPLY = process.argv.includes("--apply");
const DUMP_PATH = "/tmp/ae-providers-for-scrub.jsonl";
const SCRUB_OUT = path.join(ROOT, "data", "scrub-rating-claims.jsonl");

// ── 1. Dump all UAE providers with a review_summary AND a google_rating ──
// Write the dump command to a shell script, scp it over, run it, pull result.
const remoteScript = `#!/bin/bash
sudo -u postgres psql zavis_landing -P format=unaligned -P tuples_only=on -P pager=off -P recordsep_zero <<'PSQL'
SELECT json_build_object('id', id, 'name', name, 'google_rating', google_rating, 'review_summary', review_summary)::text
FROM providers
WHERE country = 'ae'
  AND status = 'active'
  AND review_summary IS NOT NULL
  AND jsonb_array_length(review_summary) > 0
  AND google_rating IS NOT NULL;
PSQL
`;
fs.writeFileSync("/tmp/dump-ae-scrub.sh", remoteScript);

console.error("Dumping UAE provider review_summaries from EC2...");
execSync(
  `scp -i ~/.ssh/zavis-ec2.pem /tmp/dump-ae-scrub.sh ubuntu@13.205.197.148:/tmp/dump-ae-scrub.sh`,
  { stdio: "inherit" }
);
execSync(
  `ssh -i ~/.ssh/zavis-ec2.pem ubuntu@13.205.197.148 "bash /tmp/dump-ae-scrub.sh > /tmp/ae-providers-for-scrub.jsonl && wc -c /tmp/ae-providers-for-scrub.jsonl"`,
  { stdio: "inherit" }
);
execSync(
  `scp -i ~/.ssh/zavis-ec2.pem ubuntu@13.205.197.148:/tmp/ae-providers-for-scrub.jsonl ${DUMP_PATH}`,
  { stdio: "inherit" }
);

// Parse null-byte-separated records
const raw = fs.readFileSync(DUMP_PATH);
const records = raw
  .toString("utf-8")
  .split("\x00")
  .map((s) => s.trim())
  .filter(Boolean);
console.error(`Loaded ${records.length} UAE providers`);

// ── 2. For each provider, find bullets with numeric rating claims that
//       don't match google_rating. Strip them. ──
//
// Match patterns like:
//   "4.6-star", "4.6 star", "4.6/5", "4.6 out of 5", "rated 4.6"
// Extract the number, compare to actual rating ± 0.15 tolerance.
const RATING_RE = /(\d\.\d)(?:\s?[\/-]|\s*-?\s*star|\s+out of|\s+on\s+a)/gi;

const updates = [];
let bulletsScrubbed = 0;
let providersAffected = 0;

for (const rec of records) {
  let parsed;
  try {
    parsed = JSON.parse(rec);
  } catch {
    continue;
  }
  const { id, name, google_rating, review_summary } = parsed;
  if (!Array.isArray(review_summary) || review_summary.length === 0) continue;
  const actual = Number(google_rating);
  if (!isFinite(actual) || actual === 0) continue;

  const newBullets = [];
  let changed = false;
  for (const bullet of review_summary) {
    if (typeof bullet !== "string") {
      newBullets.push(bullet);
      continue;
    }
    let badNumber = null;
    RATING_RE.lastIndex = 0;
    let m;
    while ((m = RATING_RE.exec(bullet)) !== null) {
      const claimed = Number(m[1]);
      if (isFinite(claimed) && Math.abs(claimed - actual) > 0.15) {
        badNumber = claimed;
        break;
      }
    }
    if (badNumber !== null) {
      // Drop the whole bullet — don't try to rewrite it, too risky.
      changed = true;
      bulletsScrubbed++;
      console.error(
        `  [${id}] actual=${actual} drop: "${bullet.slice(0, 80)}..."`
      );
    } else {
      newBullets.push(bullet);
    }
  }

  if (changed) {
    providersAffected++;
    updates.push({ id, name, oldBullets: review_summary, newBullets });
  }
}

console.error(`\nSummary:`);
console.error(`  Providers affected:  ${providersAffected}`);
console.error(`  Bullets scrubbed:    ${bulletsScrubbed}`);

// Write dry-run preview file
fs.writeFileSync(
  SCRUB_OUT,
  updates.map((u) => JSON.stringify(u)).join("\n") + "\n"
);
console.error(`  Preview file:        ${SCRUB_OUT}`);

if (!APPLY) {
  console.error(`\nDry-run. Re-run with --apply to write to live DB.`);
  if (updates.length > 0) {
    console.error(`\nFirst 3 affected providers:`);
    for (const u of updates.slice(0, 3)) {
      console.error(`\n  ${u.name} (${u.id})`);
      for (const b of u.oldBullets) console.error(`    old: ${b.slice(0, 80)}`);
      for (const b of u.newBullets) console.error(`    new: ${b.slice(0, 80)}`);
    }
  }
  process.exit(0);
}

// ── 3. Build SQL and apply via SSH ──
const sqlLines = ["BEGIN;"];
for (const u of updates) {
  const jsonbLiteral = JSON.stringify(u.newBullets);
  sqlLines.push(
    `UPDATE providers SET review_summary_legacy = COALESCE(review_summary_legacy, review_summary), review_summary = $gcc$${jsonbLiteral}$gcc$::jsonb, review_summary_generated_at = NOW(), updated_at = NOW() WHERE id = '${u.id.replace(/'/g, "''")}';`
  );
}
sqlLines.push("COMMIT;");
sqlLines.push(`\\echo 'Scrubbed ${updates.length} UAE provider rating claims'`);

const sql = sqlLines.join("\n");
const localTmp = "/tmp/scrub-rating-claims.sql";
fs.writeFileSync(localTmp, sql);
console.error(`\nWriting ${updates.length} UPDATEs (${(sql.length / 1024).toFixed(1)} KB)...`);

execSync(
  `scp -i ~/.ssh/zavis-ec2.pem ${localTmp} ubuntu@13.205.197.148:/tmp/scrub-rating-claims.sql`,
  { stdio: "inherit" }
);
execSync(
  `ssh -i ~/.ssh/zavis-ec2.pem ubuntu@13.205.197.148 "sudo -u postgres psql zavis_landing -f /tmp/scrub-rating-claims.sql"`,
  { stdio: "inherit" }
);

console.error("\nDone.");
