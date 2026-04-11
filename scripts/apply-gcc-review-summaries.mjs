#!/usr/bin/env node
/**
 * Apply rewritten GCC review summaries to the DB via SSH + psql.
 *
 * Input:  data/gcc-rewritten-summaries.jsonl (produced by rewrite-gcc-review-summaries.mjs)
 * Action: For each row, build an UPDATE statement that:
 *           - Backs up existing review_summary to review_summary_legacy (if not already)
 *           - Writes the new bullets to review_summary
 *           - Stamps review_summary_generated_at = NOW()
 *
 * Executes via a temporary SQL file scp'd to EC2 and applied in a single transaction.
 * Dry-run is the default — pass --apply to actually write.
 *
 * Usage:
 *   node scripts/apply-gcc-review-summaries.mjs              # dry-run (prints SQL)
 *   node scripts/apply-gcc-review-summaries.mjs --apply      # actually run on EC2
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const INPUT = path.join(ROOT, "data", "gcc-rewritten-summaries.jsonl");

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

console.error(`Loaded ${rows.length} rewritten summaries`);

// Validate: dedupe IDs, check shape
const seen = new Set();
const valid = [];
for (const row of rows) {
  if (!row.id || !Array.isArray(row.summary) || row.summary.length < 2) {
    console.error(`  skip invalid row: ${row.id || "(no id)"}`);
    continue;
  }
  if (seen.has(row.id)) continue;
  seen.add(row.id);
  // Quick AI-tell spot check on output — reject if it slipped through
  const joined = row.summary.join(" ").toLowerCase();
  const tells = [
    "stands as",
    "testament to",
    "nestled",
    "in the heart of",
    "vibrant tapestry",
    "world-class",
    "state-of-the-art",
    "cutting-edge",
  ];
  if (tells.some((t) => joined.includes(t))) {
    console.error(`  skip AI-tell detected: ${row.id}`);
    continue;
  }
  valid.push(row);
}

console.error(`Valid rows to apply: ${valid.length}`);

// Build SQL: one big transaction with UPDATE per row.
// Uses PostgreSQL dollar-quoted strings ($gcc$) to avoid escaping hell.
const sqlLines = ["BEGIN;"];
for (const row of valid) {
  const jsonbLiteral = JSON.stringify(row.summary)
    .replace(/\$gcc\$/g, "$$gcc$$"); // defense in depth (no-op in practice)
  sqlLines.push(
    `UPDATE providers SET review_summary_legacy = COALESCE(review_summary_legacy, review_summary), review_summary = $gcc$${jsonbLiteral}$gcc$::jsonb, review_summary_generated_at = NOW(), updated_at = NOW() WHERE id = '${row.id.replace(/'/g, "''")}';`
  );
}
sqlLines.push("COMMIT;");
sqlLines.push(
  `\\echo 'Applied ${valid.length} GCC review summaries'`
);

const sql = sqlLines.join("\n");
const localTmp = "/tmp/apply-gcc-review-summaries.sql";
fs.writeFileSync(localTmp, sql);

console.error(`SQL size: ${(sql.length / 1024).toFixed(1)} KB`);
console.error(`Local SQL file: ${localTmp}`);

if (!APPLY) {
  console.error(`\nDry run — not applying. Re-run with --apply to execute on EC2.`);
  console.error(`First 500 chars of SQL:\n${sql.slice(0, 500)}`);
  process.exit(0);
}

// SCP to EC2 and run
console.error("\nCopying SQL to EC2...");
execSync(
  `scp -i ~/.ssh/zavis-ec2.pem ${localTmp} ubuntu@13.205.197.148:/tmp/apply-gcc-review-summaries.sql`,
  { stdio: "inherit" }
);

console.error("\nApplying SQL on EC2...");
execSync(
  `ssh -i ~/.ssh/zavis-ec2.pem ubuntu@13.205.197.148 "sudo -u postgres psql zavis_landing -f /tmp/apply-gcc-review-summaries.sql"`,
  { stdio: "inherit" }
);

console.error("\nDone.");
