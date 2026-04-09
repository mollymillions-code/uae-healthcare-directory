#!/usr/bin/env node
/**
 * fix-kuwait-data.mjs
 * -------------------
 * Fixes data quality issues in data/parsed/kuwait_providers.json:
 *   1. Category normalization: "pharmacies" → "pharmacy", "dentists" → "dental"
 *   2. City mapping: "Adan Hospital" is in Ahmadi, not Kuwait City
 *   3. Arabic addresses: transliterate Arabic text to Latin script
 *   4. Phone normalization: ensure all phones have +965 prefix
 *   5. Duplicate removal: same name + same city → keep the one with more data
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = resolve(__dirname, "../data/parsed/kuwait_providers.json");

// --- Load data ---
const raw = readFileSync(DATA_PATH, "utf-8");
const providers = JSON.parse(raw);
const total = providers.length;

// --- Counters ---
const stats = {
  categoryNormalized: 0,
  cityFixed: 0,
  addressTransliterated: 0,
  phoneNormalized: 0,
  duplicatesRemoved: 0,
};

const detailedLog = [];

// ======================================================================
// Arabic → Latin transliteration map for Kuwait addresses
// ======================================================================
const ARABIC_TO_LATIN = [
  // Governorates / major areas
  { ar: "الجهراء", en: "Jahra" },
  { ar: "حولي", en: "Hawalli" },
  { ar: "الفروانية", en: "Farwaniya" },
  { ar: "الأحمدي", en: "Ahmadi" },
  { ar: "مبارك الكبير", en: "Mubarak Al-Kabeer" },

  // Neighborhoods / areas
  { ar: "السالمية", en: "Salmiya" },
  { ar: "الرميثية", en: "Rumaithiya" },
  { ar: "العارضيه", en: "Ardiya" },
  { ar: "الدوحة", en: "Doha" },
  { ar: "النسيم", en: "Naseem" },
  { ar: "الشويخ الصحية", en: "Shuwaikh Health" },
  { ar: "صباح السالم", en: "Sabah Al-Salem" },
  { ar: "مدينة الكويت", en: "Kuwait City" },
  { ar: "العديلية", en: "Adailiya" },
  { ar: "المهبولة", en: "Mahboula" },
  { ar: "الصدّيق", en: "Al-Siddiq" },
  { ar: "جمعية الصدّيق التعاونية", en: "Al-Siddiq Co-Op" },

  // Street / road names
  { ar: "شارع ناصر المبارك", en: "Nasser Al-Mubarak Street" },
  { ar: "شارع سالم المبارك", en: "Salem Al-Mubarak Street" },
  { ar: "شارع بغداد", en: "Baghdad Street" },
  { ar: "شارع 8", en: "Street 8" },
  { ar: "شارع 20", en: "Street 20" },
  { ar: "طريق الجهراء السريع", en: "Jahra Expressway" },
  { ar: "طريق 1", en: "Road 1" },
  { ar: "برج التجارية", en: "Al-Tijaria Tower" },

  // Misc
  { ar: "قطعة", en: "Block" },
  { ar: "ق", en: "Block" },
];

/**
 * Transliterate an address string, replacing Arabic tokens with Latin equivalents.
 * Handles mixed Arabic/Latin addresses (e.g. "Mohammed Bin Al Qasim Road, العارضيه, 92400").
 * Works by replacing longest matches first to avoid partial replacements.
 */
function transliterateAddress(address) {
  if (!address) return address;

  let result = address;

  // Sort by length descending so longer matches replace first
  // (e.g. "جمعية الصدّيق التعاونية" before "الصدّيق")
  const sorted = [...ARABIC_TO_LATIN].sort((a, b) => b.ar.length - a.ar.length);

  for (const { ar, en } of sorted) {
    result = result.replace(new RegExp(escapeRegex(ar), "g"), en);
  }

  // Clean up any remaining Arabic characters (fallback — shouldn't happen with complete map)
  // We don't strip them; just log if any remain
  return result.trim();
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Check if a string contains Arabic characters.
 */
function hasArabic(str) {
  return /[\u0600-\u06FF]/.test(str);
}

/**
 * Count the number of non-null, non-empty fields in a provider entry.
 * Used to decide which duplicate to keep.
 */
function fieldCount(p) {
  let count = 0;
  for (const [key, val] of Object.entries(p)) {
    if (val !== null && val !== undefined && val !== "") {
      count++;
    }
  }
  return count;
}

// ======================================================================
// Pass 1: Category normalization
// ======================================================================
for (const p of providers) {
  if (p.category === "pharmacies") {
    detailedLog.push(`  CAT: "${p.name}" pharmacies → pharmacy`);
    p.category = "pharmacy";
    stats.categoryNormalized++;
  } else if (p.category === "dentists") {
    detailedLog.push(`  CAT: "${p.name}" dentists → dental`);
    p.category = "dental";
    stats.categoryNormalized++;
  }
  // "hospitals" and "clinics" are correct as-is
}

// ======================================================================
// Pass 2: City mapping fix — Adan Hospital → ahmadi
// ======================================================================
for (const p of providers) {
  if (p.name === "Adan Hospital" && p.city === "kuwait-city") {
    detailedLog.push(`  CITY: "${p.name}" kuwait-city → ahmadi (Ahmadi governorate)`);
    p.city = "ahmadi";
    stats.cityFixed++;
  }
}

// ======================================================================
// Pass 3: Arabic address transliteration
// ======================================================================
for (const p of providers) {
  if (p.address && hasArabic(p.address)) {
    const original = p.address;
    const transliterated = transliterateAddress(p.address);
    // Only count if we actually changed something
    if (transliterated !== original) {
      detailedLog.push(`  ADDR: "${p.name}" "${original}" → "${transliterated}"`);
      p.address = transliterated;
      stats.addressTransliterated++;

      // Warn if Arabic chars remain
      if (hasArabic(transliterated)) {
        detailedLog.push(`    ⚠ Residual Arabic in: "${transliterated}"`);
      }
    }
  }
}

// ======================================================================
// Pass 4: Phone normalization — ensure +965 prefix
// ======================================================================
for (const p of providers) {
  if (!p.phone) continue;

  // Handle multi-number phones (e.g. "+96555231736;+96592230824")
  const parts = p.phone.split(";").map((s) => s.trim());
  let changed = false;
  const normalized = parts.map((num) => {
    // Strip whitespace, dashes for analysis
    const stripped = num.replace(/[\s\-()]/g, "");

    // Already has +965
    if (stripped.startsWith("+965")) return num;

    // Has 965 without the +
    if (stripped.startsWith("965")) {
      changed = true;
      return "+" + stripped;
    }

    // Bare Kuwait number (8 digits)
    if (/^\d{8}$/.test(stripped)) {
      changed = true;
      return "+965" + stripped;
    }

    // Bare Kuwait number starting with 1, 2, 5, 6, 9 (common Kuwait prefixes)
    if (/^[125689]\d{6,7}$/.test(stripped)) {
      changed = true;
      return "+965" + stripped;
    }

    // Already looks international — leave as-is
    return num;
  });

  if (changed) {
    const newPhone = normalized.join("; ");
    detailedLog.push(`  PHONE: "${p.name}" "${p.phone}" → "${newPhone}"`);
    p.phone = newPhone;
    stats.phoneNormalized++;
  }
}

// ======================================================================
// Pass 5: Remove duplicates — same name + same city → keep richer entry
// ======================================================================
const seen = new Map(); // key: "name|city" → index of best entry
const toRemove = new Set();

for (let i = 0; i < providers.length; i++) {
  const p = providers[i];
  const key = `${p.name.toLowerCase().trim()}|${p.city}`;

  if (seen.has(key)) {
    const existingIdx = seen.get(key);
    const existing = providers[existingIdx];
    const existingCount = fieldCount(existing);
    const currentCount = fieldCount(p);

    if (currentCount > existingCount) {
      // Current entry is richer — remove the existing one
      detailedLog.push(
        `  DUP: "${p.name}" in ${p.city} — keeping entry with ${currentCount} fields, removing one with ${existingCount} fields`
      );
      toRemove.add(existingIdx);
      seen.set(key, i);
    } else {
      // Existing entry is richer or equal — remove current
      detailedLog.push(
        `  DUP: "${p.name}" in ${p.city} — keeping entry with ${existingCount} fields, removing one with ${currentCount} fields`
      );
      toRemove.add(i);
    }
    stats.duplicatesRemoved++;
  } else {
    seen.set(key, i);
  }
}

// Filter out duplicates
const cleaned = providers.filter((_, idx) => !toRemove.has(idx));

// --- Write back ---
writeFileSync(DATA_PATH, JSON.stringify(cleaned, null, 2) + "\n", "utf-8");

// --- Print summary ---
console.log("=== Kuwait Data Quality Fix — Summary ===\n");
console.log(`Total entries (before): ${total}`);
console.log(`Total entries (after):  ${cleaned.length}`);
console.log(`\nFixes applied:`);
console.log(`  Category normalized:       ${stats.categoryNormalized}`);
console.log(`  City mapping fixed:        ${stats.cityFixed}`);
console.log(`  Addresses transliterated:  ${stats.addressTransliterated}`);
console.log(`  Phones normalized:         ${stats.phoneNormalized}`);
console.log(`  Duplicates removed:        ${stats.duplicatesRemoved}`);
console.log(
  `\nTotal fields fixed: ${Object.values(stats).reduce((a, b) => a + b, 0)}`
);
console.log("\n--- Detailed changes ---");
for (const line of detailedLog) {
  console.log(line);
}
console.log("\nDone. File overwritten at:", DATA_PATH);
