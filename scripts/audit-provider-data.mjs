#!/usr/bin/env node
/**
 * Provider Data Audit — Google Places Verification
 * ──────────────────────────────────────────────────
 * Compares all provider records in PostgreSQL against Google Places Details API
 * to detect stale, incorrect, or dangerous data (wrong website, wrong phone, etc.)
 *
 * Must run ON EC2 where the database is accessible at localhost:5432.
 *
 * Usage:
 *   node scripts/audit-provider-data.mjs                  # dry-run, first 10
 *   node scripts/audit-provider-data.mjs --limit 100      # dry-run, first 100
 *   node scripts/audit-provider-data.mjs --live            # audit ALL providers
 *   node scripts/audit-provider-data.mjs --live --resume   # resume from checkpoint
 *   node scripts/audit-provider-data.mjs --live --country ae  # only UAE providers
 *   node scripts/audit-provider-data.mjs --live --country sa  # only Saudi providers
 *   node scripts/audit-provider-data.mjs --report-only     # just print summary from last checkpoint
 *
 * Outputs:
 *   stdout — live progress + final summary
 *   data/audit/provider-audit-YYYY-MM-DD.json — full results
 *   data/audit/provider-audit-checkpoint.json — resume checkpoint (saved every 100)
 *   data/audit/provider-audit-critical.csv — CRITICAL issues for immediate review
 */

import pg from 'pg';
const { Pool } = pg;
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// ─── Configuration ─────────────────────────────────────────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');
const AUDIT_DIR = join(PROJECT_ROOT, 'data', 'audit');

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const RATE_LIMIT_MS = 110; // ~9 QPS to stay safely under 10 QPS limit
const CHECKPOINT_INTERVAL = 100; // Save progress every N providers
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

// Fields to request — Basic (free) + Contact ($0.003/req)
const PLACE_DETAILS_FIELDS = [
  'name',
  'formatted_address',
  'formatted_phone_number',
  'international_phone_number',
  'website',
  'geometry',
  'business_status',
  'place_id',
].join(',');

// ─── CLI args ──────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const isLive = args.includes('--live');
const shouldResume = args.includes('--resume');
const reportOnly = args.includes('--report-only');
const limitIdx = args.indexOf('--limit');
const limit = limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) : (isLive ? null : 10);
const countryIdx = args.indexOf('--country');
const countryFilter = countryIdx !== -1 ? args[countryIdx + 1] : null;

// ─── Environment / DB ──────────────────────────────────────────────────────────

function loadEnv() {
  const envPath = join(PROJECT_ROOT, '.env.local');
  try {
    const content = readFileSync(envPath, 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex === -1) continue;
      const key = trimmed.slice(0, eqIndex).trim();
      let val = trimmed.slice(eqIndex + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  } catch {
    // .env.local not found — rely on environment variables
  }
}

function getPool() {
  loadEnv();
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set. Check .env.local or environment.');
  }
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 3,
    idleTimeoutMillis: 30000,
  });
}

// ─── Google Places API ─────────────────────────────────────────────────────────

async function fetchPlaceDetails(placeId, retries = 0) {
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&fields=${PLACE_DETAILS_FIELDS}&key=${GOOGLE_PLACES_API_KEY}`;

  try {
    const res = await fetch(url);

    if (res.status === 429) {
      // Rate limited — back off and retry
      if (retries < MAX_RETRIES) {
        const backoff = RETRY_DELAY_MS * Math.pow(2, retries);
        console.warn(`  [429] Rate limited for ${placeId}, retrying in ${backoff}ms...`);
        await sleep(backoff);
        return fetchPlaceDetails(placeId, retries + 1);
      }
      return { error: 'RATE_LIMITED', placeId };
    }

    if (!res.ok) {
      if (retries < MAX_RETRIES) {
        const backoff = RETRY_DELAY_MS * Math.pow(2, retries);
        console.warn(`  [${res.status}] HTTP error for ${placeId}, retrying in ${backoff}ms...`);
        await sleep(backoff);
        return fetchPlaceDetails(placeId, retries + 1);
      }
      return { error: `HTTP_${res.status}`, placeId };
    }

    const data = await res.json();

    if (data.status === 'OK') {
      return { result: data.result, placeId };
    } else if (data.status === 'NOT_FOUND' || data.status === 'INVALID_REQUEST') {
      return { error: data.status, placeId };
    } else if (data.status === 'OVER_QUERY_LIMIT') {
      if (retries < MAX_RETRIES) {
        const backoff = RETRY_DELAY_MS * Math.pow(2, retries);
        console.warn(`  [OVER_QUERY_LIMIT] for ${placeId}, retrying in ${backoff}ms...`);
        await sleep(backoff);
        return fetchPlaceDetails(placeId, retries + 1);
      }
      return { error: 'OVER_QUERY_LIMIT', placeId };
    } else {
      return { error: data.status || 'UNKNOWN', placeId, errorMessage: data.error_message };
    }
  } catch (err) {
    if (retries < MAX_RETRIES) {
      const backoff = RETRY_DELAY_MS * Math.pow(2, retries);
      console.warn(`  [NETWORK] Error for ${placeId}: ${err.message}, retrying in ${backoff}ms...`);
      await sleep(backoff);
      return fetchPlaceDetails(placeId, retries + 1);
    }
    return { error: 'NETWORK_ERROR', placeId, errorMessage: err.message };
  }
}

// ─── Comparison Logic ──────────────────────────────────────────────────────────

/**
 * Extract the registrable domain from a URL.
 * "https://www.example.com/path" → "example.com"
 */
function extractDomain(urlStr) {
  if (!urlStr) return null;
  try {
    // Add protocol if missing
    let normalized = urlStr.trim();
    if (!normalized.match(/^https?:\/\//i)) {
      normalized = 'https://' + normalized;
    }
    const u = new URL(normalized);
    let host = u.hostname.toLowerCase();
    // Strip www.
    if (host.startsWith('www.')) host = host.slice(4);
    return host;
  } catch {
    // If URL parsing fails, try basic extraction
    let cleaned = urlStr.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '');
    const slashIdx = cleaned.indexOf('/');
    if (slashIdx !== -1) cleaned = cleaned.slice(0, slashIdx);
    return cleaned || null;
  }
}

/**
 * Normalize phone number to last 9 digits (covers UAE/GCC formats).
 * Strips all non-digit chars, country codes, leading zeros.
 */
function normalizePhone(phone) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 0) return null;
  // Take last 9 digits (covers +971-X-XXXXXXX, 0X-XXXXXXX, etc.)
  return digits.slice(-9);
}

/**
 * Jaccard word similarity: intersection / union of word sets.
 * Ignores common filler words. Case-insensitive.
 * Handles Arabic, English, and mixed-script names.
 */
function jaccardSimilarity(a, b) {
  if (!a || !b) return 0;
  const stopWords = new Set([
    'the', 'and', 'of', 'in', 'for', 'a', 'an', 'at', 'to', 'by',
    'llc', 'l.l.c', 'l.l.c.', 'fz-llc', 'fz', 'spc', 's.p.c',
    'w.l.l', 'w.l.l.', 'est', 'co',
    // Arabic stop words
    'و', 'في', 'من', 'على', 'إلى', 'ال', 'عن', 'أو',
  ]);
  const tokenize = (s) => {
    // Use Unicode-aware regex: keep letters (any script), digits, spaces
    const words = s.toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')  // Strip non-letter, non-digit, non-space (Unicode-aware)
      .split(/\s+/)
      .filter(w => w.length > 0 && !stopWords.has(w));
    return new Set(words);
  };
  const setA = tokenize(a);
  const setB = tokenize(b);
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const word of setA) {
    if (setB.has(word)) intersection++;
  }
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Haversine distance in km between two lat/lng pairs.
 */
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Compare a provider record against Google Places data.
 * Returns an array of issues with severity levels.
 */
function compareProvider(provider, googleData) {
  const issues = [];

  // 1. Business status
  if (googleData.business_status === 'CLOSED_PERMANENTLY') {
    issues.push({
      field: 'business_status',
      severity: 'CRITICAL',
      message: 'Google reports this business as PERMANENTLY CLOSED',
      dbValue: provider.status,
      googleValue: 'CLOSED_PERMANENTLY',
    });
  } else if (googleData.business_status === 'CLOSED_TEMPORARILY') {
    issues.push({
      field: 'business_status',
      severity: 'HIGH',
      message: 'Google reports this business as TEMPORARILY CLOSED',
      dbValue: provider.status,
      googleValue: 'CLOSED_TEMPORARILY',
    });
  }

  // 2. Name comparison
  const nameSimilarity = jaccardSimilarity(provider.name, googleData.name);
  if (nameSimilarity < 0.3) {
    issues.push({
      field: 'name',
      severity: 'CRITICAL',
      message: `Name mismatch — likely WRONG place_id (similarity: ${nameSimilarity.toFixed(2)})`,
      dbValue: provider.name,
      googleValue: googleData.name,
      similarity: nameSimilarity,
    });
  } else if (nameSimilarity < 0.5) {
    issues.push({
      field: 'name',
      severity: 'HIGH',
      message: `Name differs significantly (similarity: ${nameSimilarity.toFixed(2)})`,
      dbValue: provider.name,
      googleValue: googleData.name,
      similarity: nameSimilarity,
    });
  }

  // 3. Website comparison
  const dbDomain = extractDomain(provider.website);
  const googleDomain = extractDomain(googleData.website);

  if (dbDomain && googleDomain) {
    if (dbDomain !== googleDomain) {
      // Check if one is a subdomain of the other
      const isSubdomain = dbDomain.endsWith('.' + googleDomain) || googleDomain.endsWith('.' + dbDomain);
      if (isSubdomain) {
        issues.push({
          field: 'website',
          severity: 'MEDIUM',
          message: 'Website is a subdomain variant',
          dbValue: provider.website,
          googleValue: googleData.website,
          dbDomain,
          googleDomain,
        });
      } else {
        issues.push({
          field: 'website',
          severity: 'CRITICAL',
          message: 'Website domain COMPLETELY DIFFERENT — may be showing wrong company website',
          dbValue: provider.website,
          googleValue: googleData.website,
          dbDomain,
          googleDomain,
        });
      }
    }
    // Same domain — OK, skip
  } else if (!dbDomain && googleDomain) {
    issues.push({
      field: 'website',
      severity: 'MEDIUM',
      message: 'We have no website but Google does — could enrich',
      dbValue: provider.website,
      googleValue: googleData.website,
    });
  } else if (dbDomain && !googleDomain) {
    // We have a website but Google doesn't — potentially stale on our side
    issues.push({
      field: 'website',
      severity: 'MEDIUM',
      message: 'We have a website but Google does not — verify manually',
      dbValue: provider.website,
      googleValue: null,
    });
  }

  // 4. Phone comparison
  const dbPhone = normalizePhone(provider.phone);
  const googlePhone = normalizePhone(googleData.international_phone_number || googleData.formatted_phone_number);

  if (dbPhone && googlePhone) {
    if (dbPhone !== googlePhone) {
      // Check if partial match (last 7 digits)
      const dbLast7 = dbPhone.slice(-7);
      const googleLast7 = googlePhone.slice(-7);
      if (dbLast7 === googleLast7) {
        issues.push({
          field: 'phone',
          severity: 'MEDIUM',
          message: 'Phone differs in area/country code only',
          dbValue: provider.phone,
          googleValue: googleData.international_phone_number || googleData.formatted_phone_number,
        });
      } else {
        issues.push({
          field: 'phone',
          severity: 'HIGH',
          message: 'Phone number is completely different',
          dbValue: provider.phone,
          googleValue: googleData.international_phone_number || googleData.formatted_phone_number,
        });
      }
    }
  } else if (!dbPhone && googlePhone) {
    issues.push({
      field: 'phone',
      severity: 'MEDIUM',
      message: 'We have no phone but Google does — could enrich',
      dbValue: provider.phone,
      googleValue: googleData.international_phone_number || googleData.formatted_phone_number,
    });
  }

  // 5. Location comparison
  if (provider.latitude && provider.longitude && googleData.geometry?.location) {
    const dbLat = parseFloat(provider.latitude);
    const dbLng = parseFloat(provider.longitude);
    const gLat = googleData.geometry.location.lat;
    const gLng = googleData.geometry.location.lng;
    const distKm = haversineKm(dbLat, dbLng, gLat, gLng);

    if (distKm > 2) {
      issues.push({
        field: 'location',
        severity: 'HIGH',
        message: `Location is ${distKm.toFixed(1)}km off — may be wrong pin`,
        dbValue: `${dbLat}, ${dbLng}`,
        googleValue: `${gLat}, ${gLng}`,
        distanceKm: distKm,
      });
    } else if (distKm > 0.5) {
      issues.push({
        field: 'location',
        severity: 'MEDIUM',
        message: `Location is ${distKm.toFixed(1)}km off — minor discrepancy`,
        dbValue: `${dbLat}, ${dbLng}`,
        googleValue: `${gLat}, ${gLng}`,
        distanceKm: distKm,
      });
    }
  }

  // 6. Address (log only, don't flag)
  if (googleData.formatted_address && provider.address) {
    // Just store for reference — addresses have too many valid formats
  }

  return issues;
}

/**
 * Determine overall severity for a provider based on its issues.
 */
function overallSeverity(issues) {
  if (issues.some(i => i.severity === 'CRITICAL')) return 'CRITICAL';
  if (issues.some(i => i.severity === 'HIGH')) return 'HIGH';
  if (issues.some(i => i.severity === 'MEDIUM')) return 'MEDIUM';
  return 'OK';
}

// ─── Checkpoint Management ─────────────────────────────────────────────────────

function getCheckpointPath() {
  return join(AUDIT_DIR, 'provider-audit-checkpoint.json');
}

function loadCheckpoint() {
  const path = getCheckpointPath();
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
}

function saveCheckpoint(state) {
  mkdirSync(AUDIT_DIR, { recursive: true });
  writeFileSync(getCheckpointPath(), JSON.stringify(state, null, 2));
}

// ─── Report Generation ─────────────────────────────────────────────────────────

function generateReport(results, startTime) {
  const endTime = new Date();
  const durationMs = endTime - startTime;

  const counts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, OK: 0, ERROR: 0, SKIPPED: 0 };
  for (const r of results) {
    if (r.error) counts.ERROR++;
    else if (r.severity) counts[r.severity]++;
    else counts.SKIPPED++;
  }

  const report = {
    meta: {
      generatedAt: endTime.toISOString(),
      durationSeconds: Math.round(durationMs / 1000),
      totalProviders: results.length,
      providersWithPlaceId: results.filter(r => !r.skippedNoPlaceId).length,
      apiCallsMade: results.filter(r => r.googleData || r.error).length,
      estimatedCost: `$${(results.filter(r => r.googleData || r.error).length * 0.003).toFixed(2)}`,
    },
    summary: counts,
    criticalIssues: results
      .filter(r => r.severity === 'CRITICAL')
      .map(r => ({
        id: r.providerId,
        name: r.providerName,
        slug: r.providerSlug,
        city: r.city,
        country: r.country,
        url: `https://www.zavis.ai/directory/${r.city}/${r.providerSlug}`,
        issues: r.issues,
      })),
    highIssues: results
      .filter(r => r.severity === 'HIGH')
      .map(r => ({
        id: r.providerId,
        name: r.providerName,
        slug: r.providerSlug,
        city: r.city,
        country: r.country,
        issues: r.issues,
      })),
    allResults: results,
  };

  return report;
}

function generateCriticalCsv(results) {
  const criticals = results.filter(r => r.severity === 'CRITICAL');
  if (criticals.length === 0) return 'No critical issues found.';

  const headers = ['Provider ID', 'Provider Name', 'City', 'Country', 'Issue Field', 'Issue', 'DB Value', 'Google Value', 'URL'];
  const rows = [headers.join(',')];

  for (const r of criticals) {
    for (const issue of r.issues) {
      if (issue.severity !== 'CRITICAL') continue;
      const row = [
        r.providerId,
        `"${(r.providerName || '').replace(/"/g, '""')}"`,
        r.city,
        r.country,
        issue.field,
        `"${issue.message.replace(/"/g, '""')}"`,
        `"${(issue.dbValue || '').toString().replace(/"/g, '""')}"`,
        `"${(issue.googleValue || '').toString().replace(/"/g, '""')}"`,
        `https://www.zavis.ai/directory/${r.city}/${r.providerSlug}`,
      ];
      rows.push(row.join(','));
    }
  }

  return rows.join('\n');
}

// ─── Utilities ─────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function progressBar(current, total, width = 30) {
  const pct = total > 0 ? current / total : 0;
  const filled = Math.round(width * pct);
  const bar = '█'.repeat(filled) + '░'.repeat(width - filled);
  return `[${bar}] ${current}/${total} (${(pct * 100).toFixed(1)}%)`;
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║       ZAVIS PROVIDER DATA AUDIT — Google Places Check       ║');
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log(`║  Mode: ${isLive ? 'LIVE (calling Google API)' : 'DRY-RUN (showing what would be checked)'}${' '.repeat(isLive ? 12 : 0)}  ║`);
  if (limit) {
    console.log(`║  Limit: ${limit} providers${' '.repeat(44 - String(limit).length)}║`);
  }
  if (countryFilter) {
    console.log(`║  Country filter: ${countryFilter}${' '.repeat(39 - countryFilter.length)}║`);
  }
  if (shouldResume) {
    console.log('║  Resume: YES (continuing from checkpoint)                   ║');
  }
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('');

  // Report-only mode: just print the last report
  if (reportOnly) {
    const checkpoint = loadCheckpoint();
    if (!checkpoint) {
      console.log('No checkpoint found. Run the audit first.');
      process.exit(1);
    }
    const report = generateReport(checkpoint.results, new Date(checkpoint.startTime));
    printSummary(report);
    process.exit(0);
  }

  mkdirSync(AUDIT_DIR, { recursive: true });

  // Connect to DB
  console.log('[DB] Connecting to PostgreSQL...');
  const pool = getPool();

  try {
    const testResult = await pool.query('SELECT COUNT(*) as count FROM providers');
    console.log(`[DB] Connected. Total providers in database: ${testResult.rows[0].count}`);
  } catch (err) {
    console.error(`[DB] Connection failed: ${err.message}`);
    console.error('    Make sure this script runs on EC2 where the DB is accessible.');
    process.exit(1);
  }

  // Query providers
  let query = `
    SELECT
      id, name, slug, website, phone, address, latitude, longitude,
      google_place_id, city_slug, country, status,
      google_rating, google_review_count
    FROM providers
    WHERE status = 'active'
  `;
  const queryParams = [];

  if (countryFilter) {
    queryParams.push(countryFilter);
    query += ` AND country = $${queryParams.length}`;
  }

  query += ' ORDER BY google_place_id IS NOT NULL DESC, google_review_count DESC NULLS LAST, id';

  if (limit) {
    queryParams.push(limit);
    query += ` LIMIT $${queryParams.length}`;
  }

  console.log('[DB] Querying providers...');
  const { rows: providers } = await pool.query(query, queryParams);
  console.log(`[DB] Found ${providers.length} providers to audit.`);

  const withPlaceId = providers.filter(p => p.google_place_id);
  const withoutPlaceId = providers.filter(p => !p.google_place_id);
  console.log(`     - With google_place_id: ${withPlaceId.length} (will call Google API)`);
  console.log(`     - Without google_place_id: ${withoutPlaceId.length} (skipped — no way to verify)`);
  console.log('');

  if (!isLive) {
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║  DRY-RUN MODE — No API calls will be made.                  ║');
    console.log('║  Add --live to actually call Google Places API.             ║');
    console.log(`║  Estimated cost: ~$${(withPlaceId.length * 0.003).toFixed(2)} (${withPlaceId.length} calls x $0.003)${' '.repeat(Math.max(0, 24 - String((withPlaceId.length * 0.003).toFixed(2)).length - String(withPlaceId.length).length))}║`);
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log('Sample providers that would be checked:');
    for (const p of withPlaceId.slice(0, 10)) {
      console.log(`  - ${p.name} (${p.city_slug}) — place_id: ${p.google_place_id}`);
      console.log(`    website: ${p.website || '(none)'} | phone: ${p.phone || '(none)'}`);
    }
    await pool.end();
    process.exit(0);
  }

  // Load checkpoint if resuming
  let results = [];
  let processedIds = new Set();
  const startTime = new Date();

  if (shouldResume) {
    const checkpoint = loadCheckpoint();
    if (checkpoint && checkpoint.results) {
      results = checkpoint.results;
      processedIds = new Set(results.map(r => r.providerId));
      console.log(`[RESUME] Loaded checkpoint with ${results.length} already-processed providers.`);
    } else {
      console.log('[RESUME] No checkpoint found — starting fresh.');
    }
  }

  // Process providers without place_id first (just mark as skipped)
  for (const p of withoutPlaceId) {
    if (processedIds.has(p.id)) continue;
    results.push({
      providerId: p.id,
      providerName: p.name,
      providerSlug: p.slug,
      city: p.city_slug,
      country: p.country,
      skippedNoPlaceId: true,
      severity: null,
      issues: [],
    });
    processedIds.add(p.id);
  }

  // Process providers with place_id
  const toProcess = withPlaceId.filter(p => !processedIds.has(p.id));
  console.log(`\n[AUDIT] Processing ${toProcess.length} providers (${processedIds.size - withoutPlaceId.length} already done)...\n`);

  let apiCalls = 0;
  let errors = 0;
  const auditStartTime = Date.now();

  for (let i = 0; i < toProcess.length; i++) {
    const provider = toProcess[i];
    const elapsed = ((Date.now() - auditStartTime) / 1000).toFixed(0);
    const eta = i > 0 ? Math.round(((Date.now() - auditStartTime) / i) * (toProcess.length - i) / 1000) : 0;

    process.stdout.write(`\r  ${progressBar(i + 1, toProcess.length)}  ${elapsed}s elapsed  ETA: ${eta}s  Errors: ${errors}  `);

    // Call Google Places API
    const response = await fetchPlaceDetails(provider.google_place_id);
    apiCalls++;

    if (response.error) {
      errors++;
      results.push({
        providerId: provider.id,
        providerName: provider.name,
        providerSlug: provider.slug,
        city: provider.city_slug,
        country: provider.country,
        googlePlaceId: provider.google_place_id,
        error: response.error,
        errorMessage: response.errorMessage || null,
        severity: null,
        issues: [],
      });
    } else {
      // Compare
      const issues = compareProvider(provider, response.result);
      const severity = overallSeverity(issues);

      results.push({
        providerId: provider.id,
        providerName: provider.name,
        providerSlug: provider.slug,
        city: provider.city_slug,
        country: provider.country,
        googlePlaceId: provider.google_place_id,
        severity,
        issues,
        googleData: {
          name: response.result.name,
          address: response.result.formatted_address,
          phone: response.result.international_phone_number || response.result.formatted_phone_number,
          website: response.result.website,
          businessStatus: response.result.business_status,
          location: response.result.geometry?.location,
        },
      });

      // Log critical issues immediately
      if (severity === 'CRITICAL') {
        console.log('');
        console.log(`  ⚠ CRITICAL: ${provider.name} (${provider.city_slug})`);
        for (const issue of issues.filter(i => i.severity === 'CRITICAL')) {
          console.log(`    └─ ${issue.field}: ${issue.message}`);
          console.log(`       DB:     ${issue.dbValue}`);
          console.log(`       Google: ${issue.googleValue}`);
        }
      }
    }

    processedIds.add(provider.id);

    // Checkpoint every N providers
    if ((i + 1) % CHECKPOINT_INTERVAL === 0) {
      saveCheckpoint({
        startTime: startTime.toISOString(),
        lastProcessedIndex: i,
        totalToProcess: toProcess.length,
        results,
      });
      // Also write a line break so the progress bar doesn't overwrite checkpoint log
      console.log('');
      console.log(`  [CHECKPOINT] Saved at ${i + 1}/${toProcess.length} — ${results.length} total results`);
    }

    // Rate limiting
    await sleep(RATE_LIMIT_MS);
  }

  console.log('\n');

  // Final save
  saveCheckpoint({
    startTime: startTime.toISOString(),
    lastProcessedIndex: toProcess.length - 1,
    totalToProcess: toProcess.length,
    results,
    completed: true,
  });

  // Generate report
  const report = generateReport(results, startTime);

  // Save full JSON report
  const dateStr = new Date().toISOString().split('T')[0];
  const reportPath = join(AUDIT_DIR, `provider-audit-${dateStr}.json`);
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`[REPORT] Full report saved: ${reportPath}`);

  // Save critical CSV
  const csvPath = join(AUDIT_DIR, `provider-audit-critical-${dateStr}.csv`);
  writeFileSync(csvPath, generateCriticalCsv(results));
  console.log(`[REPORT] Critical issues CSV: ${csvPath}`);

  // Print summary
  printSummary(report);

  await pool.end();
}

function printSummary(report) {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║                    AUDIT RESULTS SUMMARY                    ║');
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log(`║  Total providers audited:  ${String(report.meta.totalProviders).padEnd(34)}║`);
  console.log(`║  Providers with place_id:  ${String(report.meta.providersWithPlaceId).padEnd(34)}║`);
  console.log(`║  API calls made:           ${String(report.meta.apiCallsMade).padEnd(34)}║`);
  console.log(`║  Estimated API cost:       ${String(report.meta.estimatedCost).padEnd(34)}║`);
  console.log(`║  Duration:                 ${String(report.meta.durationSeconds + 's').padEnd(34)}║`);
  console.log('╠══════════════════════════════════════════════════════════════╣');

  const { CRITICAL, HIGH, MEDIUM, OK, ERROR } = report.summary;

  console.log(`║  🔴 CRITICAL:  ${String(CRITICAL).padEnd(46)}║`);
  console.log(`║  🟠 HIGH:      ${String(HIGH).padEnd(46)}║`);
  console.log(`║  🟡 MEDIUM:    ${String(MEDIUM).padEnd(46)}║`);
  console.log(`║  🟢 OK:        ${String(OK).padEnd(46)}║`);
  console.log(`║  ⚪ ERROR:     ${String(ERROR).padEnd(46)}║`);
  console.log('╚══════════════════════════════════════════════════════════════╝');

  if (CRITICAL > 0) {
    console.log('');
    console.log('┌──────────────────────────────────────────────────────────────┐');
    console.log('│  CRITICAL ISSUES — REQUIRES IMMEDIATE ATTENTION              │');
    console.log('├──────────────────────────────────────────────────────────────┤');
    for (const item of report.criticalIssues.slice(0, 50)) {
      console.log(`│  ${item.name}`);
      console.log(`│  ${item.url}`);
      for (const issue of item.issues.filter(i => i.severity === 'CRITICAL')) {
        console.log(`│    ${issue.field}: ${issue.message}`);
        if (issue.dbValue) console.log(`│      Ours:   ${issue.dbValue}`);
        if (issue.googleValue) console.log(`│      Google: ${issue.googleValue}`);
      }
      console.log('│');
    }
    if (report.criticalIssues.length > 50) {
      console.log(`│  ... and ${report.criticalIssues.length - 50} more critical issues (see JSON report)`);
    }
    console.log('└──────────────────────────────────────────────────────────────┘');
  }

  if (HIGH > 0 && HIGH <= 20) {
    console.log('');
    console.log('HIGH severity issues (showing up to 20):');
    for (const item of report.highIssues.slice(0, 20)) {
      console.log(`  ${item.name} (${item.city})`);
      for (const issue of item.issues.filter(i => i.severity === 'HIGH')) {
        console.log(`    ${issue.field}: ${issue.message}`);
      }
    }
  } else if (HIGH > 20) {
    console.log(`\n  ${HIGH} HIGH severity issues — see JSON report for full list.`);
  }

  console.log('');
}

// ─── Entry ─────────────────────────────────────────────────────────────────────

main().catch(err => {
  console.error('\n[FATAL]', err.message);
  console.error(err.stack);
  process.exit(1);
});
