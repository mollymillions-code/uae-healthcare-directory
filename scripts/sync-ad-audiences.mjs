#!/usr/bin/env node
/**
 * Ad Audience Sync — Google Customer Match + Meta Custom Audiences + LinkedIn
 *
 * Reads from data/parsed/ad-audiences/*.csv, tracks a watermark so only
 * NEW rows are uploaded on each run. Safe to run every 2-3 hours.
 *
 * Watermark: data/parsed/ad-audiences/.sync-watermark.json
 *
 * Required env vars (in .env.local):
 *   GOOGLE_ADS_DEVELOPER_TOKEN   — Google Ads developer token
 *   GOOGLE_ADS_CUSTOMER_ID       — format: XXX-XXX-XXXX
 *   GOOGLE_ADS_USER_LIST_ID      — Customer Match user list resource name
 *   GOOGLE_ADS_LOGIN_CUSTOMER_ID — MCC account ID (if using MCC)
 *   META_ACCESS_TOKEN            — Meta Marketing API long-lived token
 *   META_AD_ACCOUNT_ID           — format: act_XXXXXXXXXX
 *   META_AUDIENCE_ID             — Custom Audience ID
 *   LINKEDIN_ACCESS_TOKEN        — LinkedIn Marketing API token
 *   LINKEDIN_CONTACT_SEGMENT_ID  — DMP segment ID for contacts
 *   LINKEDIN_COMPANY_SEGMENT_ID  — DMP segment ID for companies
 *
 * Usage:
 *   node scripts/sync-ad-audiences.mjs           # sync new records only
 *   node scripts/sync-ad-audiences.mjs --full    # re-upload everything
 *   node scripts/sync-ad-audiences.mjs --dry-run # preview, no API calls
 *   node scripts/sync-ad-audiences.mjs --google  # Google only
 *   node scripts/sync-ad-audiences.mjs --meta    # Meta only
 *   node scripts/sync-ad-audiences.mjs --linkedin # LinkedIn only
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import https from "https";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// ── Load .env.local ───────────────────────────────────────────────────────────
const envPath = path.join(ROOT, ".env.local");
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, "utf8").split("\n").forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match && !process.env[match[1].trim()]) {
      process.env[match[1].trim()] = match[2].trim();
    }
  });
}

const AUDIENCES_DIR = path.join(ROOT, "data/parsed/ad-audiences");
const WATERMARK_FILE = path.join(AUDIENCES_DIR, ".sync-watermark.json");
const DRY_RUN = process.argv.includes("--dry-run");
const FULL_SYNC = process.argv.includes("--full");
const ONLY_GOOGLE = process.argv.includes("--google");
const ONLY_META = process.argv.includes("--meta");
const ONLY_LINKEDIN = process.argv.includes("--linkedin");
const RUN_ALL = !ONLY_GOOGLE && !ONLY_META && !ONLY_LINKEDIN;

// ── Helpers ───────────────────────────────────────────────────────────────────

const sha256 = v => v ? crypto.createHash("sha256").update(v.trim().toLowerCase()).digest("hex") : "";

function parseCSV(filepath) {
  const lines = fs.readFileSync(filepath, "utf8").trim().split("\n");
  const headers = lines[0].split(",").map(h => h.trim().replace(/"/g, ""));
  return lines.slice(1).map(line => {
    const values = line.split(",").map(v => v.trim().replace(/"/g, ""));
    return Object.fromEntries(headers.map((h, i) => [h, values[i] || ""]));
  });
}

function loadWatermark() {
  if (FULL_SYNC || !fs.existsSync(WATERMARK_FILE)) return {};
  try { return JSON.parse(fs.readFileSync(WATERMARK_FILE, "utf8")); }
  catch { return {}; }
}

function saveWatermark(mark) {
  fs.writeFileSync(WATERMARK_FILE, JSON.stringify(
    { ...mark, last_sync: new Date().toISOString() }, null, 2
  ));
}

const log = msg => console.log(`[${new Date().toISOString().slice(11, 19)}] ${msg}`);

function apiFetch(url, { method = "GET", headers = {}, body } = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const opts = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method,
      headers: { "Content-Type": "application/json", ...headers },
    };
    const req = https.request(opts, res => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        try { resolve({ ok: res.statusCode < 300, status: res.statusCode, data: JSON.parse(data) }); }
        catch { resolve({ ok: res.statusCode < 300, status: res.statusCode, data }); }
      });
    });
    req.on("error", reject);
    if (body) req.write(typeof body === "string" ? body : JSON.stringify(body));
    req.end();
  });
}

// Chunk array into batches
const chunk = (arr, n) => Array.from({ length: Math.ceil(arr.length / n) }, (_, i) => arr.slice(i * n, i * n + n));

// ── Google Customer Match ─────────────────────────────────────────────────────

async function syncGoogleCustomerMatch(rows) {
  const devToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  const customerId = (process.env.GOOGLE_ADS_CUSTOMER_ID || "").replace(/-/g, "");
  const userListId = process.env.GOOGLE_ADS_USER_LIST_ID;
  const loginCustomerId = (process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID || "").replace(/-/g, "");

  // Get OAuth token via gcloud ADC
  let accessToken;
  try {
    const { execSync } = await import("child_process");
    accessToken = execSync("gcloud auth print-access-token 2>/dev/null", { encoding: "utf8" }).trim();
  } catch {
    log("Google: could not get access token via gcloud");
    return false;
  }

  if (!customerId || !userListId) {
    log("Google: GOOGLE_ADS_CUSTOMER_ID or GOOGLE_ADS_USER_LIST_ID not set");
    return false;
  }

  // Build user identifiers — SHA-256 hash all PII
  const userIdentifiers = rows
    .filter(r => r.Email)
    .map(r => ({
      hashedEmail: sha256(r.Email),
      ...(r.Phone ? { hashedPhoneNumber: sha256(r.Phone.replace(/\D/g, "")) } : {}),
      addressInfo: {
        ...(r["First Name"] ? { hashedFirstName: sha256(r["First Name"]) } : {}),
        ...(r["Last Name"] ? { hashedLastName: sha256(r["Last Name"]) } : {}),
        ...(r["Country Code"] ? { countryCode: r["Country Code"].toUpperCase() } : {}),
      },
    }));

  if (!userIdentifiers.length) {
    log("Google: no valid emails found");
    return false;
  }

  if (DRY_RUN) {
    log(`[DRY RUN] Google: would upload ${userIdentifiers.length} users to list ${userListId}`);
    return true;
  }

  // Google Ads API v17 — offline user data job
  const headers = {
    "Authorization": `Bearer ${accessToken}`,
    "developer-token": devToken,
    ...(loginCustomerId ? { "login-customer-id": loginCustomerId } : {}),
  };

  const baseUrl = `https://googleads.googleapis.com/v17/customers/${customerId}`;

  // Step 1: Create offline user data job
  const jobResp = await apiFetch(`${baseUrl}/offlineUserDataJobs:create`, {
    method: "POST", headers,
    body: {
      job: {
        type: "CUSTOMER_MATCH_USER_LIST",
        customerMatchUserListMetadata: {
          userList: `customers/${customerId}/userLists/${userListId}`,
        },
      },
    },
  });

  if (!jobResp.ok) {
    log(`Google: job creation failed — ${JSON.stringify(jobResp.data)}`);
    return false;
  }

  const jobResourceName = jobResp.data.resourceName;
  log(`Google: created job ${jobResourceName}`);

  // Step 2: Add users in batches of 100k
  let totalAdded = 0;
  for (const batch of chunk(userIdentifiers, 100000)) {
    const addResp = await apiFetch(
      `https://googleads.googleapis.com/v17/${jobResourceName}:addOperations`,
      {
        method: "POST", headers,
        body: {
          operations: batch.map(u => ({
            create: { userIdentifiers: [u] },
          })),
          enablePartialFailure: true,
        },
      }
    );
    if (!addResp.ok) {
      log(`Google: add batch failed — ${JSON.stringify(addResp.data)}`);
    } else {
      totalAdded += batch.length;
      log(`Google: added batch of ${batch.length}`);
    }
  }

  // Step 3: Run the job
  const runResp = await apiFetch(
    `https://googleads.googleapis.com/v17/${jobResourceName}:run`,
    { method: "POST", headers, body: {} }
  );

  if (runResp.ok) {
    log(`Google Customer Match: ✓ ${totalAdded} users queued for list ${userListId}`);
    return true;
  } else {
    log(`Google: run failed — ${JSON.stringify(runResp.data)}`);
    return false;
  }
}

// ── Meta Custom Audiences ─────────────────────────────────────────────────────

async function syncMeta(rows) {
  const token = process.env.META_ACCESS_TOKEN;
  const audienceId = process.env.META_AUDIENCE_ID;

  if (!token || !audienceId) {
    log("Meta: META_ACCESS_TOKEN or META_AUDIENCE_ID not set — skipping");
    return false;
  }

  const schema = ["EMAIL", "PHONE", "FN", "LN", "CT"];
  const data = rows.map(r => [
    r.email ? sha256(r.email) : "",
    r.phone ? sha256(r.phone.replace(/\D/g, "")) : "",
    r.fn ? sha256(r.fn) : "",
    r.ln ? sha256(r.ln) : "",
    r.country ? sha256(r.country.toLowerCase()) : "",
  ]);

  if (DRY_RUN) {
    log(`[DRY RUN] Meta: would upload ${rows.length} contacts to audience ${audienceId}`);
    return true;
  }

  // Meta allows max 10k rows per request
  let total = 0;
  for (const batch of chunk(data, 10000)) {
    const resp = await apiFetch(
      `https://graph.facebook.com/v19.0/${audienceId}/users`,
      {
        method: "POST",
        body: { payload: { schema, data: batch }, access_token: token },
      }
    );
    if (resp.ok) { total += batch.length; }
    else { log(`Meta ERROR: ${JSON.stringify(resp.data)}`); }
  }

  if (total) log(`Meta: ✓ ${total} contacts uploaded to audience ${audienceId}`);
  return total > 0;
}

// ── LinkedIn Matched Audiences ────────────────────────────────────────────────

async function syncLinkedInContacts(rows) {
  const token = process.env.LINKEDIN_ACCESS_TOKEN;
  const segmentId = process.env.LINKEDIN_CONTACT_SEGMENT_ID;

  if (!token || !segmentId) {
    log("LinkedIn contacts: credentials not set — skipping");
    return false;
  }

  const elements = rows
    .filter(r => r.Email)
    .map(r => ({
      action: "ADD",
      userIds: [{ idType: "SHA256_EMAIL", idValue: sha256(r.Email) }],
    }));

  if (!elements.length) return false;
  if (DRY_RUN) { log(`[DRY RUN] LinkedIn: would upload ${elements.length} contacts`); return true; }

  let total = 0;
  for (const batch of chunk(elements, 100)) {
    const resp = await apiFetch(
      `https://api.linkedin.com/v2/dmpSegments/${segmentId}/contacts`,
      {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "LinkedIn-Version": "202401" },
        body: { elements: batch },
      }
    );
    if (resp.ok) { total += batch.length; }
    else { log(`LinkedIn ERROR: ${JSON.stringify(resp.data)}`); }
  }

  if (total) log(`LinkedIn contacts: ✓ ${total} uploaded to segment ${segmentId}`);
  return total > 0;
}

async function syncLinkedInCompanies(rows) {
  const token = process.env.LINKEDIN_ACCESS_TOKEN;
  const segmentId = process.env.LINKEDIN_COMPANY_SEGMENT_ID;

  if (!token || !segmentId) {
    log("LinkedIn companies: credentials not set — skipping");
    return false;
  }

  const elements = rows
    .filter(r => r["Company Name"] || r.Website)
    .map(r => ({
      action: "ADD",
      companyName: r["Company Name"] || null,
      companyWebsite: r.Website ? r.Website.replace(/^https?:\/\//, "").replace(/\/$/, "") : null,
    }))
    .filter(r => r.companyName || r.companyWebsite);

  if (!elements.length) return false;
  if (DRY_RUN) { log(`[DRY RUN] LinkedIn companies: would upload ${elements.length}`); return true; }

  let total = 0;
  for (const batch of chunk(elements, 100)) {
    const resp = await apiFetch(
      `https://api.linkedin.com/v2/dmpSegments/${segmentId}/companies`,
      {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "LinkedIn-Version": "202401" },
        body: { elements: batch },
      }
    );
    if (resp.ok) { total += batch.length; }
    else { log(`LinkedIn companies ERROR: ${JSON.stringify(resp.data)}`); }
  }

  if (total) log(`LinkedIn companies: ✓ ${total} uploaded to segment ${segmentId}`);
  return total > 0;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  log(`=== Ad Audience Sync${DRY_RUN ? " [DRY RUN]" : ""}${FULL_SYNC ? " [FULL]" : ""} ===`);

  const watermark = loadWatermark();
  const newMark = { ...watermark };

  // ── Google Customer Match
  if (RUN_ALL || ONLY_GOOGLE) {
    const file = path.join(AUDIENCES_DIR, "google_ads_customer_match.csv");
    if (fs.existsSync(file)) {
      const all = parseCSV(file);
      const from = FULL_SYNC ? 0 : (watermark.google ?? 0);
      const newRows = all.slice(from);
      log(`Google: ${all.length} total, ${newRows.length} new`);
      if (newRows.length) {
        const ok = await syncGoogleCustomerMatch(newRows);
        if (ok && !DRY_RUN) newMark.google = all.length;
      }
    }
  }

  // ── Meta
  if (RUN_ALL || ONLY_META) {
    const file = path.join(AUDIENCES_DIR, "facebook_custom_audience.csv");
    if (fs.existsSync(file)) {
      const all = parseCSV(file);
      const from = FULL_SYNC ? 0 : (watermark.facebook ?? 0);
      const newRows = all.slice(from);
      log(`Meta: ${all.length} total, ${newRows.length} new`);
      if (newRows.length) {
        const ok = await syncMeta(newRows);
        if (ok && !DRY_RUN) newMark.facebook = all.length;
      }
    }
  }

  // ── LinkedIn contacts
  if (RUN_ALL || ONLY_LINKEDIN) {
    const file = path.join(AUDIENCES_DIR, "linkedin_contact_list.csv");
    if (fs.existsSync(file)) {
      const all = parseCSV(file);
      const from = FULL_SYNC ? 0 : (watermark.linkedin_contacts ?? 0);
      const newRows = all.slice(from);
      log(`LinkedIn contacts: ${all.length} total, ${newRows.length} new`);
      if (newRows.length) {
        const ok = await syncLinkedInContacts(newRows);
        if (ok && !DRY_RUN) newMark.linkedin_contacts = all.length;
      }
    }
  }

  // ── LinkedIn companies
  if (RUN_ALL || ONLY_LINKEDIN) {
    const file = path.join(AUDIENCES_DIR, "linkedin_company_list.csv");
    if (fs.existsSync(file)) {
      const all = parseCSV(file);
      const from = FULL_SYNC ? 0 : (watermark.linkedin_companies ?? 0);
      const newRows = all.slice(from);
      log(`LinkedIn companies: ${all.length} total, ${newRows.length} new`);
      if (newRows.length) {
        const ok = await syncLinkedInCompanies(newRows);
        if (ok && !DRY_RUN) newMark.linkedin_companies = all.length;
      }
    }
  }

  if (!DRY_RUN) {
    saveWatermark(newMark);
    log(`Watermark: ${JSON.stringify(newMark)}`);
  }

  log("=== Done ===");
}

main().catch(err => { console.error("FATAL:", err); process.exit(1); });
