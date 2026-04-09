#!/usr/bin/env node
/**
 * fix-bahrain-data.mjs
 *
 * Reads data/parsed/bahrain_providers.json, fixes data-quality issues,
 * writes the cleaned file back, and prints a summary.
 *
 * Issues fixed:
 *   1. Name/address bleed — address fragments in the name field
 *   2. City slug normalization — deduplicate variant spellings
 *   3. Phone normalization — add +973 prefix, handle Saudi number
 *   4. Remove exact duplicates (same name + same city → keep first)
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FILE = resolve(__dirname, "../data/parsed/bahrain_providers.json");

// ── Counters ────────────────────────────────────────────────────────────────
const stats = {
  nameAddressBleed: 0,
  cityNormalized: 0,
  phoneFixed: 0,
  duplicatesRemoved: 0,
  doubleDotsFixed: 0,
};
const cityChanges = {};   // old → new, for reporting
const phoneChanges = [];  // { name, old, new }
const nameChanges = [];   // { old, newName, newAddr }

// ── 1. Load ─────────────────────────────────────────────────────────────────
const raw = readFileSync(FILE, "utf-8");
let data = JSON.parse(raw);
const originalCount = data.length;
console.log(`Loaded ${data.length} records from bahrain_providers.json\n`);

// ── 2. Name/address bleed ───────────────────────────────────────────────────
// Pattern: legitimate name followed by "Building NNN, Road" (or similar).
// Split at the address fragment and prepend it to the existing address.

const NAME_BLEED_RE =
  /^(.+?)\s+(Building\s+\d+[\w]*,?\s*Road.*)$/i;

for (const rec of data) {
  const m = rec.name.match(NAME_BLEED_RE);
  if (m) {
    const cleanName = m[1].replace(/\.+$/, "").trim();   // strip trailing dots
    const bleedAddr = m[2].trim();
    const oldName = rec.name;
    const oldAddr = rec.address;

    rec.name = cleanName;
    // Reconstruct full address: bleed fragment + existing address
    rec.address = bleedAddr + ", " + rec.address;

    nameChanges.push({ old: oldName, newName: rec.name, newAddr: rec.address });
    stats.nameAddressBleed++;
  }

  // Also fix stray double dots in names (e.g. "W.L.L..")
  if (/\.\./.test(rec.name)) {
    const before = rec.name;
    rec.name = rec.name.replace(/\.{2,}/g, ".");
    if (before !== rec.name) stats.doubleDotsFixed++;
  }
}

// ── 3. City slug normalization ──────────────────────────────────────────────
const CITY_MAP = {
  // Explicitly listed in task
  "alseef":            "al-seef",
  "rifaa":             "riffa",
  "rifaa--alhajiyat":  "riffa",
  "sar":               "saar",
  "adliyah":           "adliya",
  "al-adliyah":        "adliya",
  "salimabad":         "salmabad",
  "isa-towm":          "isa-town",

  // Additional variants found during analysis
  "al-janabiya":       "al-janabiyah",
  "janabiya":          "al-janabiyah",
  "al-musala":         "al-musalla",
  "al-sayh":           "al-sayah",
  "belad-alqdeem":     "bilad-al-qadeem",
  "hamala":            "al-hamalah",
};

for (const rec of data) {
  const mapped = CITY_MAP[rec.city];
  if (mapped) {
    const oldCity = rec.city;
    rec.city = mapped;
    cityChanges[oldCity] = mapped;
    stats.cityNormalized++;
  }
}

// ── 4. Phone normalization ──────────────────────────────────────────────────
for (const rec of data) {
  if (!rec.phone) continue;
  const original = rec.phone;

  // Saudi number: prefix with +966 if bare, or prefix with + if starts with 966
  if (/^966\d+$/.test(rec.phone)) {
    rec.phone = "+" + rec.phone;
    phoneChanges.push({ name: rec.name, old: original, new: rec.phone });
    stats.phoneFixed++;
    continue;
  }

  // Bare 7-8 digit Bahraini number → add +973
  if (/^\d{7,8}$/.test(rec.phone)) {
    rec.phone = "+973" + rec.phone;
    phoneChanges.push({ name: rec.name, old: original, new: rec.phone });
    stats.phoneFixed++;
    continue;
  }
}

// ── 5. Remove exact duplicates (same name + same city) ──────────────────────
// Keep the first occurrence (they all have the same number of fields populated).
// Note: records with different license numbers / addresses are legitimate
// branches, but the task says "same name + same city → keep one".
const seen = new Map();
const deduped = [];
const removed = [];

for (const rec of data) {
  const key = rec.name.toLowerCase().trim() + "|" + rec.city.toLowerCase().trim();
  if (seen.has(key)) {
    removed.push({
      name: rec.name,
      city: rec.city,
      license: rec.licenseNumber,
      keptLicense: seen.get(key).licenseNumber,
    });
    stats.duplicatesRemoved++;
  } else {
    seen.set(key, rec);
    deduped.push(rec);
  }
}
data = deduped;

// ── 6. Write back ───────────────────────────────────────────────────────────
writeFileSync(FILE, JSON.stringify(data, null, 2) + "\n", "utf-8");

// ── 7. Summary ──────────────────────────────────────────────────────────────
console.log("=".repeat(60));
console.log("  BAHRAIN DATA QUALITY FIX — SUMMARY");
console.log("=".repeat(60));

console.log(`\n[1] Name/address bleed fixed: ${stats.nameAddressBleed}`);
nameChanges.forEach((c) => {
  console.log(`    OLD name : ${c.old}`);
  console.log(`    NEW name : ${c.newName}`);
  console.log(`    NEW addr : ${c.newAddr}`);
  console.log("");
});

if (stats.doubleDotsFixed) {
  console.log(`[1b] Double-dot names fixed: ${stats.doubleDotsFixed}`);
}

console.log(`\n[2] City slugs normalized: ${stats.cityNormalized}`);
Object.entries(cityChanges).forEach(([old, nw]) => {
  console.log(`    ${old} → ${nw}`);
});

console.log(`\n[3] Phones fixed: ${stats.phoneFixed}`);
phoneChanges.forEach((c) => {
  console.log(`    ${c.name}: ${c.old} → ${c.new}`);
});

console.log(`\n[4] Duplicates removed: ${stats.duplicatesRemoved}`);
removed.forEach((r) => {
  console.log(
    `    "${r.name}" in ${r.city} (license ${r.license}, kept license ${r.keptLicense})`
  );
});

console.log(`\n${"─".repeat(60)}`);
console.log(`  Records: ${originalCount} → ${data.length}`);
console.log(`  Total fixes applied: ${
  stats.nameAddressBleed +
  stats.doubleDotsFixed +
  stats.cityNormalized +
  stats.phoneFixed +
  stats.duplicatesRemoved
}`);
console.log("─".repeat(60));

// ── 8. Post-fix validation ──────────────────────────────────────────────────
console.log("\n  POST-FIX VALIDATION");
console.log("─".repeat(60));

// Check no remaining name bleed
const remaining = data.filter((d) => NAME_BLEED_RE.test(d.name));
console.log(`  Name bleed remaining   : ${remaining.length}`);

// Check no remaining bare phones
const barePhones = data.filter(
  (d) => d.phone && /^\d{7,8}$/.test(d.phone)
);
console.log(`  Bare phones remaining  : ${barePhones.length}`);

// Check no remaining city variants
const badCities = data.filter((d) => CITY_MAP[d.city]);
console.log(`  Unmapped cities remain : ${badCities.length}`);

// Check no remaining same-name-same-city dupes
const dupeCheck = new Set();
let dupeCount = 0;
for (const d of data) {
  const k = d.name.toLowerCase().trim() + "|" + d.city.toLowerCase().trim();
  if (dupeCheck.has(k)) dupeCount++;
  dupeCheck.add(k);
}
console.log(`  Remaining duplicates   : ${dupeCount}`);

// Final city distribution
const finalCities = {};
data.forEach((d) => {
  finalCities[d.city] = (finalCities[d.city] || 0) + 1;
});
console.log(`\n  Final city distribution (${Object.keys(finalCities).length} unique cities):`);
Object.keys(finalCities)
  .sort()
  .forEach((k) => console.log(`    ${k}: ${finalCities[k]}`));

console.log("\nDone.");
