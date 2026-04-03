#!/usr/bin/env node
/**
 * DHA Sheryan Medical Directory — Professional Scraper
 *
 * Scrapes all 100,303+ healthcare professionals from the DHA Sheryan REST API.
 * Uses Playwright to make requests from browser context (API blocks direct HTTP).
 * Saves JSON per category + merged CSV.
 *
 * API: POST https://services.dha.gov.ae/sheryan/RestService/rest/retrieve/medicaldirectorysearchdetails?key=SHARED_KEY
 *
 * Categories: Physician (24K), Dentist (7.7K), Nurse and Midwife (34.7K), Allied Health (33K)
 *
 * Usage:
 *   node scripts/scrape-dha-professionals.mjs                    # scrape all
 *   node scripts/scrape-dha-professionals.mjs --category Physician  # scrape one category
 *   node scripts/scrape-dha-professionals.mjs --resume              # resume from checkpoint
 *   node scripts/scrape-dha-professionals.mjs --csv-only            # just rebuild CSV from existing JSON
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.join(ROOT, 'data', 'raw', 'dha-professionals');
const PARSED_DIR = path.join(ROOT, 'data', 'parsed');
const PROGRESS_FILE = path.join(PARSED_DIR, 'dha_professionals_progress.json');

const API_URL = 'https://services.dha.gov.ae/sheryan/RestService/rest/retrieve/medicaldirectorysearchdetails?key=SHARED_KEY';

const CATEGORIES = ['Physician', 'Dentist', 'Nurse and Midwife', 'Allied Health'];
const PAGE_SIZE = 100; // max supported by API
const DELAY_MS = 500; // polite delay between requests

// ── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function loadProgress() {
  if (fs.existsSync(PROGRESS_FILE)) {
    return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
  }
  return {};
}

function saveProgress(progress) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

function parseCategory(catSpec) {
  // "Physician-Specialist Obstetrics And Gynecology" → { category: "Physician", specialty: "Specialist Obstetrics And Gynecology" }
  const dash = catSpec.indexOf('-');
  if (dash === -1) return { category: catSpec.trim(), specialty: '' };
  return {
    category: catSpec.substring(0, dash).trim(),
    specialty: catSpec.substring(dash + 1).trim(),
  };
}

function parseLicenseType(lt) {
  const map = { FTL: 'Full Trade License', REG: 'Registered', TMP: 'Temporary' };
  return map[lt] || lt;
}

// ── Browser Setup ────────────────────────────────────────────────────────────

let browserPage = null;
let browserInstance = null;

async function initBrowser() {
  console.log('  🌐 Launching headless browser...');
  browserInstance = await chromium.launch({ headless: true });
  const context = await browserInstance.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });
  browserPage = await context.newPage();
  await browserPage.goto('https://services.dha.gov.ae/sheryan/wps/portal/home/medical-directory', {
    waitUntil: 'domcontentloaded',
    timeout: 60000,
  });
  // Wait a moment for any session cookies to settle
  await sleep(2000);
  console.log('  ✅ Browser ready — session established\n');
}

async function closeBrowser() {
  if (browserInstance) {
    await browserInstance.close();
    console.log('  🌐 Browser closed');
  }
}

// ── API Fetcher (via browser context) ────────────────────────────────────────

async function fetchPage(category, pageNo, retries = 5) {
  const bodyObj = {
    string: '',
    speciality: [],
    category: category ? [category] : [],
    facilityName: [],
    pageNo,
    pageSize: String(PAGE_SIZE),
    area: [],
    licenseType: [],
    nationality: [],
    gender: [],
    sortBy: '',
    languages: [],
    locale: 'en',
  };

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const result = await browserPage.evaluate(async ({ url, body }) => {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const parsed = JSON.parse(data.professionalSearch.professionals);
        return { total: parseInt(parsed.total, 10), records: parsed.professionalsDTO || [] };
      }, { url: API_URL, body: bodyObj });

      return result;
    } catch (err) {
      console.error(`  ⚠ Attempt ${attempt}/${retries} failed for ${category} page ${pageNo}: ${err.message}`);
      if (attempt < retries) {
        const backoff = 3000 * attempt + Math.random() * 2000;
        await sleep(backoff);
      } else {
        console.error(`  ❌ SKIPPING ${category} page ${pageNo} after ${retries} attempts`);
        return { total: 0, records: [], skipped: true };
      }
    }
  }
}

// ── Category Scraper ─────────────────────────────────────────────────────────

async function scrapeCategory(category, progress) {
  const catKey = category.replace(/\s+/g, '_').toLowerCase();
  const outFile = path.join(OUTPUT_DIR, `${catKey}.json`);

  // Load existing records if resuming
  let allRecords = [];
  let startPage = 1;
  let total, totalPages;

  if (progress[catKey]?.completedPages > 0 && fs.existsSync(outFile)) {
    allRecords = JSON.parse(fs.readFileSync(outFile, 'utf-8'));
    startPage = progress[catKey].completedPages + 1;
    total = progress[catKey].total;
    totalPages = progress[catKey].totalPages;
    console.log(`  ↻ Resuming ${category} from page ${startPage} (${allRecords.length} records loaded, ${total.toLocaleString()} total)`);
  } else {
    // Fresh start — get total count from page 1
    const firstPage = await fetchPage(category, 1);
    total = firstPage.total;
    totalPages = Math.ceil(total / PAGE_SIZE);
    console.log(`  📊 ${category}: ${total.toLocaleString()} professionals across ${totalPages} pages`);
    allRecords = firstPage.records;
    progress[catKey] = { total, completedPages: 1, totalPages };
    saveProgress(progress);
    startPage = 2;
  }

  // Paginate through remaining pages
  for (let pageNo = startPage; pageNo <= totalPages; pageNo++) {
    const { records } = await fetchPage(category, pageNo);
    allRecords.push(...records);

    progress[catKey].completedPages = pageNo;

    // Checkpoint every 10 pages
    if (pageNo % 10 === 0 || pageNo === totalPages) {
      fs.writeFileSync(outFile, JSON.stringify(allRecords, null, 2));
      saveProgress(progress);
      const pct = ((pageNo / totalPages) * 100).toFixed(1);
      console.log(`  ✓ ${category}: page ${pageNo}/${totalPages} (${pct}%) — ${allRecords.length} records`);
    }

    await sleep(DELAY_MS);
  }

  // Final save
  fs.writeFileSync(outFile, JSON.stringify(allRecords, null, 2));
  progress[catKey].completedPages = totalPages;
  progress[catKey].done = true;
  saveProgress(progress);

  console.log(`  ✅ ${category}: DONE — ${allRecords.length} records saved to ${path.basename(outFile)}`);
  return allRecords;
}

// ── CSV Export ────────────────────────────────────────────────────────────────

function escapeCsv(val) {
  if (val == null) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function buildCsv(allRecords) {
  const csvPath = path.join(PARSED_DIR, 'dha_professionals_all.csv');

  const headers = [
    'dha_unique_id', 'name', 'category', 'specialty', 'license_type',
    'license_type_full', 'facility_name', 'license_count', 'facility_count', 'photo_url'
  ];

  const rows = [headers.join(',')];

  for (const rec of allRecords) {
    const { category, specialty } = parseCategory(rec.categoryOrSpeciality || '');
    rows.push([
      escapeCsv(rec.dhaUniqueId),
      escapeCsv(rec.name),
      escapeCsv(category),
      escapeCsv(specialty),
      escapeCsv(rec.licenseType),
      escapeCsv(parseLicenseType(rec.licenseType)),
      escapeCsv(rec.facilityName || ''),
      escapeCsv(rec.licensecount),
      escapeCsv(rec.facilityCount),
      escapeCsv(rec.photo || ''),
    ].join(','));
  }

  fs.writeFileSync(csvPath, rows.join('\n'));
  console.log(`\n📄 CSV exported: ${csvPath} (${allRecords.length.toLocaleString()} rows)`);
  return csvPath;
}

// ── Analytics ─────────────────────────────────────────────────────────────────

function printAnalytics(allRecords) {
  console.log('\n════════════════════════════════════════════');
  console.log('  DHA Sheryan Professionals — Summary');
  console.log('════════════════════════════════════════════');
  console.log(`  Total professionals: ${allRecords.length.toLocaleString()}`);

  // Category breakdown
  const categories = {};
  const specialties = {};
  const facilities = {};
  const licenseTypes = {};

  for (const rec of allRecords) {
    const { category, specialty } = parseCategory(rec.categoryOrSpeciality || '');
    categories[category] = (categories[category] || 0) + 1;
    if (specialty) specialties[specialty] = (specialties[specialty] || 0) + 1;
    if (rec.facilityName) facilities[rec.facilityName] = (facilities[rec.facilityName] || 0) + 1;
    licenseTypes[rec.licenseType] = (licenseTypes[rec.licenseType] || 0) + 1;
  }

  console.log('\n  Categories:');
  for (const [cat, count] of Object.entries(categories).sort((a, b) => b[1] - a[1])) {
    console.log(`    ${cat}: ${count.toLocaleString()}`);
  }

  console.log(`\n  Unique specialties: ${Object.keys(specialties).length}`);
  console.log('  Top 20 specialties:');
  const topSpecs = Object.entries(specialties).sort((a, b) => b[1] - a[1]).slice(0, 20);
  for (const [spec, count] of topSpecs) {
    console.log(`    ${spec}: ${count.toLocaleString()}`);
  }

  console.log(`\n  License types:`);
  for (const [lt, count] of Object.entries(licenseTypes).sort((a, b) => b[1] - a[1])) {
    console.log(`    ${parseLicenseType(lt)} (${lt}): ${count.toLocaleString()}`);
  }

  const uniqueFacilities = Object.keys(facilities).length;
  console.log(`\n  Unique facilities: ${uniqueFacilities.toLocaleString()}`);
  console.log('  Top 10 facilities by professional count:');
  const topFac = Object.entries(facilities).sort((a, b) => b[1] - a[1]).slice(0, 10);
  for (const [fac, count] of topFac) {
    console.log(`    ${fac}: ${count.toLocaleString()}`);
  }

  console.log('════════════════════════════════════════════\n');
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const csvOnly = args.includes('--csv-only');
  const resume = args.includes('--resume');
  const catIdx = args.indexOf('--category');
  const targetCategory = catIdx >= 0 ? args[catIdx + 1] : null;

  ensureDir(OUTPUT_DIR);
  ensureDir(PARSED_DIR);

  if (csvOnly) {
    // Just rebuild CSV from existing JSON files
    console.log('📄 Rebuilding CSV from existing JSON files...');
    let allRecords = [];
    for (const cat of CATEGORIES) {
      const catKey = cat.replace(/\s+/g, '_').toLowerCase();
      const file = path.join(OUTPUT_DIR, `${catKey}.json`);
      if (fs.existsSync(file)) {
        const records = JSON.parse(fs.readFileSync(file, 'utf-8'));
        allRecords.push(...records);
        console.log(`  Loaded ${records.length.toLocaleString()} from ${catKey}.json`);
      }
    }
    buildCsv(allRecords);
    printAnalytics(allRecords);
    return;
  }

  console.log('🏥 DHA Sheryan Professional Directory Scraper');
  console.log(`   API: ${API_URL}`);
  console.log(`   Page size: ${PAGE_SIZE} | Delay: ${DELAY_MS}ms`);
  console.log(`   Output: ${OUTPUT_DIR}\n`);

  // Launch headless browser for API calls
  await initBrowser();

  const progress = resume ? loadProgress() : {};
  const categoriesToScrape = targetCategory ? [targetCategory] : CATEGORIES;

  let allRecords = [];
  const startTime = Date.now();

  try {
    for (const cat of categoriesToScrape) {
      const catKey = cat.replace(/\s+/g, '_').toLowerCase();
      if (progress[catKey]?.done && resume) {
        console.log(`  ⏭ Skipping ${cat} (already complete)`);
        const file = path.join(OUTPUT_DIR, `${catKey}.json`);
        if (fs.existsSync(file)) {
          allRecords.push(...JSON.parse(fs.readFileSync(file, 'utf-8')));
        }
        continue;
      }

      console.log(`\n🔍 Scraping: ${cat}`);
      const records = await scrapeCategory(cat, progress);
      allRecords.push(...records);
    }
  } finally {
    await closeBrowser();
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n⏱ Scraping completed in ${elapsed}s`);

  // Deduplicate by dhaUniqueId
  const seen = new Set();
  const deduped = [];
  for (const rec of allRecords) {
    if (!seen.has(rec.dhaUniqueId)) {
      seen.add(rec.dhaUniqueId);
      deduped.push(rec);
    }
  }
  if (deduped.length < allRecords.length) {
    console.log(`  Deduplicated: ${allRecords.length} → ${deduped.length} (${allRecords.length - deduped.length} duplicates removed)`);
  }

  // Save merged JSON
  const mergedPath = path.join(PARSED_DIR, 'dha_professionals_all.json');
  fs.writeFileSync(mergedPath, JSON.stringify(deduped, null, 2));
  console.log(`  📦 Merged JSON: ${mergedPath}`);

  // Export CSV
  buildCsv(deduped);

  // Print analytics
  printAnalytics(deduped);
}

main().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
