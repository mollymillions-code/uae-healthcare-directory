#!/usr/bin/env node
/**
 * Apply the v2 review-summary content to live DB.
 *
 * Reads data/review-summary-v2-out.jsonl (produced by rewrite-reviews-v2-or.mjs),
 * builds one big SQL transaction with an UPDATE per provider, scp's it to EC2,
 * applies via psql.
 *
 * Safety:
 *   - Default is dry-run (pass --apply to execute)
 *   - Each UPDATE writes only review_summary_v2, never touches review_summary
 *     or review_summary_legacy, so legacy + rollback paths stay intact
 *   - Final spot-check of AI-tells per row before including in SQL
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const INPUT = path.join(ROOT, "data", "review-summary-v2-out.jsonl");

const APPLY = process.argv.includes("--apply");

if (!fs.existsSync(INPUT)) {
  console.error(`Input file not found: ${INPUT}`);
  process.exit(1);
}

const rows = fs
  .readFileSync(INPUT, "utf-8")
  .split("\n")
  .filter((l) => l.trim())
  .map((l, i) => {
    try {
      return JSON.parse(l);
    } catch {
      console.error(`Skipping malformed line ${i + 1}`);
      return null;
    }
  })
  .filter(Boolean);

console.error(`Loaded ${rows.length} v2 rewrites`);

// Validate each row before including in UPDATE. Second-pass safety net
// because the rewriter already validates, but we want to catch any
// regression before writing to DB.
const seen = new Set();
const valid = [];
const bannedPhrases = [
  "stands as",
  "testament to",
  "nestled",
  "world-class",
  "state-of-the-art",
  "cutting-edge",
  "vibrant",
  "fosters",
  "foster a",
  "garner",
  "underscore",
  "rich tapestry",
  "evolving landscape",
  "overall,",
  "in summary",
  "not only",
  "not just",
  "moreover,",
  "furthermore,",
];

let skipped = 0;
for (const row of rows) {
  if (!row.id || !row.v2) {
    skipped++;
    continue;
  }
  if (seen.has(row.id)) continue;
  seen.add(row.id);

  const v2 = row.v2;
  if (v2.version !== 2) {
    console.error(`  skip ${row.id}: missing version=2`);
    skipped++;
    continue;
  }
  if (typeof v2.overall_sentiment !== "string" || v2.overall_sentiment.length < 400) {
    console.error(`  skip ${row.id}: overview too short (${v2.overall_sentiment?.length})`);
    skipped++;
    continue;
  }
  if (!Array.isArray(v2.what_stood_out) || v2.what_stood_out.length < 4) {
    console.error(`  skip ${row.id}: themes too few (${v2.what_stood_out?.length})`);
    skipped++;
    continue;
  }
  if (!Array.isArray(v2.snippets) || v2.snippets.length < 2) {
    console.error(`  skip ${row.id}: snippets too few (${v2.snippets?.length})`);
    skipped++;
    continue;
  }

  const lowerOverview = v2.overall_sentiment.toLowerCase();
  let banned = null;
  for (const b of bannedPhrases) {
    if (lowerOverview.includes(b)) {
      banned = b;
      break;
    }
  }
  if (banned) {
    console.error(`  skip ${row.id}: banned phrase "${banned}"`);
    skipped++;
    continue;
  }
  if (v2.overall_sentiment.includes("—")) {
    console.error(`  skip ${row.id}: em dash`);
    skipped++;
    continue;
  }

  valid.push(row);
}

console.error(`\nValid rows to apply: ${valid.length} / ${rows.length} (${skipped} skipped)`);

// Build SQL with dollar-quoted JSONB literals
const sqlLines = ["BEGIN;"];
for (const row of valid) {
  const jsonbLiteral = JSON.stringify(row.v2);
  // Use a randomish dollar-tag to avoid accidental collisions with the JSON
  sqlLines.push(
    `UPDATE providers SET review_summary_v2 = $zv2$${jsonbLiteral}$zv2$::jsonb, updated_at = NOW() WHERE id = '${row.id.replace(/'/g, "''")}';`
  );
}
sqlLines.push("COMMIT;");
sqlLines.push(`\\echo 'Applied ${valid.length} v2 review summaries'`);

const sql = sqlLines.join("\n");
const localTmp = "/tmp/apply-review-summary-v2.sql";
fs.writeFileSync(localTmp, sql);

console.error(`SQL size: ${(sql.length / 1024).toFixed(1)} KB`);
console.error(`Local SQL file: ${localTmp}`);

if (!APPLY) {
  console.error(`\nDry run — not applying. Re-run with --apply.`);
  console.error(`\nFirst 400 chars of SQL:\n${sql.slice(0, 400)}...`);
  process.exit(0);
}

console.error("\nCopying SQL to EC2...");
execSync(
  `scp -i ~/.ssh/zavis-ec2.pem ${localTmp} ubuntu@13.205.197.148:/tmp/apply-review-summary-v2.sql`,
  { stdio: "inherit" }
);

console.error("\nApplying SQL on EC2...");
execSync(
  `ssh -i ~/.ssh/zavis-ec2.pem ubuntu@13.205.197.148 "sudo -u postgres psql zavis_landing -f /tmp/apply-review-summary-v2.sql"`,
  { stdio: "inherit" }
);

console.error("\nDone.");
