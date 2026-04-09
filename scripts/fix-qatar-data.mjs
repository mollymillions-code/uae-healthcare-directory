#!/usr/bin/env node
/**
 * fix-qatar-data.mjs
 * ------------------
 * Fixes data quality issues in data/parsed/qatar_providers.json:
 *   1. Fake phone numbers ("+974 107 (PHCC Hotline)") → null
 *   2. Empty string phones → null
 *   3. City mapping: Naufar → al-wakrah; infer city from address for non-Doha cities
 *   4. Vague "Qatar" addresses: infer from facility name when possible
 *   5. Category normalization: "rehabilitation" → "physiotherapy"
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = resolve(__dirname, "../data/parsed/qatar_providers.json");

// --- Load data ---
const raw = readFileSync(DATA_PATH, "utf-8");
const providers = JSON.parse(raw);
const total = providers.length;

// --- Counters ---
const stats = {
  fakePhones: 0,
  emptyPhones: 0,
  cityFixes: 0,
  addressInferred: 0,
  categoryFixed: 0,
};

// --- Known Qatar city slugs and their detection patterns ---
const CITY_PATTERNS = [
  { pattern: /\bAl[\s-]?Khor\b/i,       slug: "al-khor",    label: "Al Khor" },
  { pattern: /\bAl[\s-]?Wakr[ae]h?\b/i,  slug: "al-wakrah",  label: "Al Wakrah" },
  { pattern: /\bAl[\s-]?Rayyan\b/i,      slug: "al-rayyan",  label: "Al Rayyan" },
  { pattern: /\bLusail\b/i,              slug: "lusail",      label: "Lusail" },
  { pattern: /\bUmm[\s-]?S[al]+[ae]?l\b/i, slug: "umm-salal",  label: "Umm Salal" },
  { pattern: /\bAl[\s-]?Daayen\b/i,      slug: "al-daayen",  label: "Al Daayen" },
  { pattern: /\bAl[\s-]?Sheehaniya\b/i,  slug: "al-shahaniya", label: "Al Shahaniya" },
  { pattern: /\bDukhan\b/i,              slug: "dukhan",      label: "Dukhan" },
  { pattern: /\bMesaimeer\b/i,           slug: "doha",        label: "Doha" },
  { pattern: /\bUmm[\s-]?Bab\b/i,        slug: "umm-bab",    label: "Umm Bab" },
  { pattern: /\bUmm[\s-]?Ghuwailina\b/i, slug: "doha",        label: "Doha" },
  { pattern: /\bAl[\s-]?Jumailiya\b/i,   slug: "al-jumailiya", label: "Al Jumailiya" },
  { pattern: /\bAl[\s-]?Karaana\b/i,     slug: "doha",        label: "Doha" },
  { pattern: /\bAl[\s-]?Kaaban\b/i,      slug: "doha",        label: "Doha" },
  { pattern: /\bLeabaib\b/i,             slug: "doha",        label: "Doha" },
  { pattern: /\bAl[\s-]?Ruwais\b/i,      slug: "doha",        label: "Doha" },
  { pattern: /\bWest[\s-]?Bay\b/i,       slug: "doha",        label: "Doha" },
  { pattern: /\bAl[\s-]?Thumama\b/i,     slug: "doha",        label: "Doha" },
  { pattern: /\bAl[\s-]?Waab\b/i,        slug: "doha",        label: "Doha" },
  { pattern: /\bAl[\s-]?Wajbah\b/i,      slug: "doha",        label: "Doha" },
  { pattern: /\bAl[\s-]?Leghwairiya\b/i, slug: "doha",        label: "Doha" },
  { pattern: /\bMadinat[\s-]?Khalifa\b/i, slug: "doha",       label: "Doha" },
  { pattern: /\bGharrafat\b/i,           slug: "al-rayyan",   label: "Al Rayyan" },
  { pattern: /\bMuaither\b/i,            slug: "doha",        label: "Doha" },
  { pattern: /\bAbu[\s-]?Nakhla\b/i,     slug: "doha",        label: "Doha" },
];

// Larger cities for address-based city fix (only change city if address explicitly says a non-Doha city)
// NOTE: "Al Rayyan Rd" is a major road IN Doha — exclude patterns that match road names
const ADDRESS_CITY_PATTERNS = [
  { pattern: /\bAl[\s-]?Khor\b(?!\s+Rd)/i,       slug: "al-khor" },
  { pattern: /\bAl[\s-]?Wakr[ae]h?\b(?!\s+Rd)/i,  slug: "al-wakrah" },
  // Only match "Al Rayyan" when it's NOT followed by "Rd" or "Road" (which is a street in Doha)
  { pattern: /\bAl[\s-]?Rayyan\b(?!\s+R[do])/i,    slug: "al-rayyan" },
  { pattern: /\bLusail\b/i,              slug: "lusail" },
  { pattern: /\bUmm[\s-]?S[al]+[ae]?l\b/i, slug: "umm-salal" },
];

// --- Helper: try to extract a location from a facility name ---
function inferLocationFromName(name) {
  for (const { pattern, label } of CITY_PATTERNS) {
    if (pattern.test(name)) {
      return label;
    }
  }
  return null;
}

// --- Helper: try to extract a city slug from name ---
function inferCitySlugFromName(name) {
  for (const { pattern, slug } of CITY_PATTERNS) {
    if (pattern.test(name)) {
      return slug;
    }
  }
  return null;
}

// --- Process each entry ---
const detailedLog = [];

for (const p of providers) {
  // 1. Fake phone numbers
  if (p.phone && p.phone.includes("107 (PHCC Hotline)")) {
    detailedLog.push(`  PHONE null: "${p.name}" had fake PHCC hotline`);
    p.phone = null;
    stats.fakePhones++;
  }

  // 2. Empty string phones
  if (p.phone === "") {
    detailedLog.push(`  PHONE null: "${p.name}" had empty string`);
    p.phone = null;
    stats.emptyPhones++;
  }

  // 3. City mapping from address
  //    Specific fix: Naufar
  if (p.name === "Naufar (Addiction Treatment Center)" && p.city === "doha") {
    detailedLog.push(`  CITY fix: "${p.name}" doha → al-wakrah (address says Al Wakrah)`);
    p.city = "al-wakrah";
    stats.cityFixes++;
  } else if (p.city === "doha" && p.address && p.address !== "Qatar") {
    // Check address for non-Doha cities
    for (const { pattern, slug } of ADDRESS_CITY_PATTERNS) {
      if (pattern.test(p.address) && slug !== "doha") {
        detailedLog.push(`  CITY fix: "${p.name}" doha → ${slug} (address: "${p.address}")`);
        p.city = slug;
        stats.cityFixes++;
        break;
      }
    }
  }

  // Also check name for city inference when address is just "Qatar"
  if (p.address === "Qatar" && p.city === "doha") {
    const inferredSlug = inferCitySlugFromName(p.name);
    if (inferredSlug && inferredSlug !== "doha") {
      detailedLog.push(`  CITY fix: "${p.name}" doha → ${inferredSlug} (inferred from name)`);
      p.city = inferredSlug;
      stats.cityFixes++;
    }
  }

  // 4. Vague addresses: "Qatar" → infer from facility name
  if (p.address === "Qatar") {
    const location = inferLocationFromName(p.name);
    if (location) {
      const newAddress = `${location}, Qatar`;
      detailedLog.push(`  ADDR fix: "${p.name}" "Qatar" → "${newAddress}"`);
      p.address = newAddress;
      stats.addressInferred++;
    }
  }

  // 5. Category normalization: "rehabilitation" → "physiotherapy"
  if (p.category === "rehabilitation") {
    detailedLog.push(`  CAT fix: "${p.name}" rehabilitation → physiotherapy`);
    p.category = "physiotherapy";
    stats.categoryFixed++;
  }
}

// --- Write back ---
writeFileSync(DATA_PATH, JSON.stringify(providers, null, 2) + "\n", "utf-8");

// --- Print summary ---
console.log("=== Qatar Data Quality Fix — Summary ===\n");
console.log(`Total entries: ${total}`);
console.log(`Fake PHCC phones → null:    ${stats.fakePhones}`);
console.log(`Empty string phones → null: ${stats.emptyPhones}`);
console.log(`City mapping fixes:         ${stats.cityFixes}`);
console.log(`Vague address inferred:     ${stats.addressInferred}`);
console.log(`Category normalized:        ${stats.categoryFixed}`);
console.log(`\nTotal fields fixed: ${Object.values(stats).reduce((a, b) => a + b, 0)}`);
console.log("\n--- Detailed changes ---");
for (const line of detailedLog) {
  console.log(line);
}
console.log("\nDone. File overwritten at:", DATA_PATH);
