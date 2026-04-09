#!/usr/bin/env node
/**
 * Scrape Bahrain NHRA healthcare provider data from PDF + Excel sources.
 * Usage: node scripts/scrape-bahrain-nhra.mjs
 *
 * Sources:
 *   1. Private Hospitals PDF (NHRA HCF dept)
 *   2. Licensed Pharmacies Excel (NHRA PPR dept)
 *   3. Open Data page — checked for additional facility datasets
 */

import { createRequire } from "module";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import https from "https";
import http from "http";

// Use CJS require for packages that don't export ESM properly
const require = createRequire(import.meta.url);
const XLSX = require("xlsx");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "..", "data", "parsed");
const DOWNLOAD_DIR = path.join(OUT_DIR, "bahrain-raw");
const OUT_FILE = path.join(OUT_DIR, "bahrain_providers.json");

const SOURCES = {
  hospitals_pdf: {
    url: "https://www.nhra.bh/Departments/HCF/MediaHandler/GenericHandler/documents/departments/HCF/Lists/private%20hospitals%20english%20new.pdf",
    filename: "private_hospitals.pdf",
  },
  pharmacies_xlsx: {
    url: "https://nhra.bh/Departments/PPR/MediaHandler/GenericHandler/documents/departments/PPR/Pharmaceutical%20Facilities/PPR_LIST_Licensed%20Pharmacies_20200211.xlsx",
    filename: "licensed_pharmacies.xlsx",
  },
};

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept: "*/*",
  "Accept-Language": "en-US,en;q=0.9",
};

// --------------- Helpers ---------------

function mapCategory(raw) {
  if (!raw) return "clinics";
  const l = raw.toLowerCase();
  if (l.includes("hospital") || l.includes("specialized") || l.includes("general")) return "hospitals";
  if (l.includes("pharmacy") || l.includes("pharmacies")) return "pharmacy";
  if (l.includes("dental")) return "dental";
  if (l.includes("lab") || l.includes("diagnostic")) return "labs-diagnostics";
  if (l.includes("clinic") || l.includes("medical center") || l.includes("medical centre"))
    return "clinics";
  return "clinics";
}

function normalizePhone(phone) {
  if (!phone) return "";
  let cleaned = String(phone).replace(/[^\d+]/g, "");
  if (cleaned.startsWith("973")) cleaned = "+" + cleaned;
  if (!cleaned.startsWith("+973") && cleaned.length === 8) cleaned = "+973" + cleaned;
  return cleaned || String(phone).trim();
}

function normalizeCity(area) {
  if (!area) return "manama";
  const l = area.toLowerCase().trim();
  // Map Bahrain areas to main city slugs
  if (l.includes("muharraq")) return "muharraq";
  if (l.includes("riffa") || l.includes("buhair") || l.includes("suwayf")) return "riffa";
  if (l.includes("isa town") || l.includes("isa city")) return "isa-town";
  if (l.includes("hamad town") || l.includes("hamad city")) return "hamad-town";
  if (l.includes("sitra")) return "sitra";
  if (l.includes("budaiya") || l.includes("budaya")) return "budaiya";
  if (l.includes("jidhafs") || l.includes("jidhaf")) return "jidhafs";
  if (l.includes("awali")) return "awali";
  if (l.includes("buri")) return "buri";
  if (l.includes("sanabis")) return "sanabis";
  if (l.includes("tubli")) return "tubli";
  if (l.includes("hidd")) return "hidd";
  if (l.includes("manama") || l.includes("center") || l.includes("suqayyah") || l.includes("salmaniya") || l.includes("fateh") || l.includes("bughazal") || l.includes("hassam")) return "manama";
  return l.replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") || "manama";
}

function titleCase(s) {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

// --------------- Download ---------------

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    function doRequest(reqUrl, redirectCount = 0) {
      if (redirectCount > 5) return reject(new Error("Too many redirects"));
      const get = reqUrl.startsWith("https") ? https.get : http.get;
      get(reqUrl, { headers: HEADERS }, (res) => {
        if ([301, 302, 303, 307, 308].includes(res.statusCode)) {
          const loc = res.headers.location;
          if (!loc) return reject(new Error("Redirect with no location"));
          const next = loc.startsWith("http") ? loc : new URL(loc, reqUrl).href;
          return doRequest(next, redirectCount + 1);
        }
        if (res.statusCode !== 200) {
          file.close();
          try { fs.unlinkSync(dest); } catch {}
          return reject(new Error(`HTTP ${res.statusCode} for ${reqUrl}`));
        }
        res.pipe(file);
        file.on("finish", () => file.close(resolve));
      }).on("error", (e) => {
        file.close();
        try { fs.unlinkSync(dest); } catch {}
        reject(e);
      });
    }
    doRequest(url);
  });
}

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    function doFetch(reqUrl, redirects = 0) {
      if (redirects > 5) return reject(new Error("Too many redirects"));
      const get = reqUrl.startsWith("https") ? https.get : http.get;
      get(reqUrl, { headers: HEADERS }, (res) => {
        if ([301, 302, 303, 307, 308].includes(res.statusCode)) {
          const loc = res.headers.location;
          const next = loc?.startsWith("http") ? loc : new URL(loc, reqUrl).href;
          return doFetch(next, redirects + 1);
        }
        if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => resolve(data));
      }).on("error", reject);
    }
    doFetch(url);
  });
}

// --------------- PDF Parser (Hospitals) ---------------

async function parseHospitalsPdf(filePath) {
  // pdf-parse v4+ exports { PDFParse } — use the class API
  const { PDFParse } = require("pdf-parse");
  const buf = new Uint8Array(fs.readFileSync(filePath));
  const parser = new PDFParse(buf);
  await parser.load();
  const result = await parser.getText();

  // result.pages is an array of { text: string }
  const fullText = result.pages.map((p) => p.text).join("\n");
  console.log(`  PDF pages: ${result.pages.length}, chars: ${fullText.length}`);

  // Write raw text for debug
  fs.writeFileSync(path.join(DOWNLOAD_DIR, "hospitals_raw_text.txt"), fullText, "utf8");

  // The PDF has a structured table. Each hospital entry looks like:
  //   100101-\n0001\nGeneral\nHospital\nAmerican Mission Hospital\nS.P.C\nBuilding 133, Road 365,\nBlock 307, MANAMA\n17177711 freeda.emilia@amh.org.bh
  // Strategy: split by license number pattern (6-digit with dash)
  const licensePattern = /(\d{6}-\n\d{4})/g;
  const parts = fullText.split(licensePattern);

  const providers = [];
  // parts alternates: [preamble, licNum, content, licNum, content, ...]
  for (let i = 1; i < parts.length - 1; i += 2) {
    const licRaw = parts[i].replace(/\n/g, ""); // e.g., "100101-0001"
    const content = parts[i + 1].trim();
    const lines = content.split("\n").map((l) => l.trim()).filter(Boolean);

    // Category lines come first — can be multi-line like "General\nHospital" or "1 Day\nSurgery\nHospital"
    // or "Specialized\nMedical\nHospital". Consume lines until we hit one that doesn't look like a category keyword.
    const catKeywords = /^(general|specialized|specialty|medical|surgical|1\s*day|surgery|hospital|day)$/i;
    let category = "";
    let nameStartIdx = 0;
    for (let j = 0; j < lines.length; j++) {
      if (catKeywords.test(lines[j])) {
        category += (category ? " " : "") + lines[j];
        nameStartIdx = j + 1;
      } else {
        break;
      }
    }
    if (!category) category = "Hospital";

    // Collect remaining lines, extract email and phone
    const remaining = lines.slice(nameStartIdx);
    const emailPattern = /[\w.-]+@[\w.-]+\.\w+/gi;
    const phonePattern = /(\d{8})/g;

    let name = "";
    let address = "";
    let phone = "";
    let email = "";
    const nameParts = [];
    const addressParts = [];
    let inAddress = false;

    for (const line of remaining) {
      const emails = line.match(emailPattern);
      if (emails) {
        email = emails[0];
      }
      const phones = line.match(phonePattern);
      if (phones) {
        phone = phones[0];
      }

      // Clean line of phone/email for name/address extraction
      let clean = line.replace(emailPattern, "").replace(/\d{8}[,\s]*/g, "").trim();
      if (!clean) continue;

      // Address lines typically start with "Building" or contain "Road", "Block"
      if (/^building|road\s+\d|block\s+\d/i.test(clean) || inAddress) {
        inAddress = true;
        addressParts.push(clean);
      } else {
        nameParts.push(clean);
      }
    }

    name = nameParts.join(" ").trim();
    address = addressParts.join(", ").replace(/,\s*,/g, ",").trim();

    // Extract city from address (look for MANAMA, MUHARRAQ, RIFFA, etc.)
    const cityFromAddr = address.match(/(?:Area\s+)?([A-Z]{3,}(?:\s*\/\s*[A-Z]+)*)\s*$/i);
    const area = cityFromAddr ? cityFromAddr[1].trim() : "";

    if (name.length > 2) {
      providers.push({
        licenseNumber: licRaw,
        name: titleCase(name.toLowerCase()).replace(/\bW\.l\.l\b/gi, "W.L.L.").replace(/\bS\.p\.c\b/gi, "S.P.C."),
        category,
        address,
        phone: normalizePhone(phone),
        email: email.toLowerCase(),
        area,
      });
    }
  }

  return providers;
}

// --------------- Excel Parser (Pharmacies) ---------------

function parsePharmaciesXlsx(filePath) {
  const wb = XLSX.readFile(filePath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  // Use header:1 to get raw arrays (the sheet has merged header rows)
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

  console.log(`  Excel sheet: "${wb.SheetNames[0]}", raw rows: ${rows.length}`);

  // Headers are on row index 2-3 (merged):
  // Row 2: No. | Name of Pharmacy | Name of Owner | Practice | Address(5 cols) | Tel. No. | Tel. No. | Fax No. | Email | Type of Pharmacy
  // Row 3: (sub-headers for address) Shop | Bldg | Road | Block | Area
  // Data starts at row index 4

  const providers = [];
  for (let i = 4; i < rows.length; i++) {
    const r = rows[i];
    if (!r || !r[1]) continue; // Skip empty rows

    const no = r[0];
    const name = String(r[1] || "").trim();
    const owner = String(r[2] || "").trim();
    const practice = String(r[3] || "").trim();
    // Address columns: Shop(4), Bldg(5), Road(6), Block(7), Area(8)
    const shop = r[4] ? `Shop ${r[4]}` : "";
    const bldg = r[5] ? `Building ${r[5]}` : "";
    const road = r[6] ? `Road ${r[6]}` : "";
    const block = r[7] ? `Block ${r[7]}` : "";
    const area = String(r[8] || "").trim();
    const addressParts = [shop, bldg, road, block, area].filter((p) => p && p !== "Shop 0" && p !== "Building 0");
    const address = addressParts.join(", ");

    const tel1 = r[9] ? String(r[9]) : "";
    const tel2 = r[10] ? String(r[10]) : "";
    const fax = r[11] ? String(r[11]) : "";
    const email = String(r[12] || "").trim();
    const pharmacyType = String(r[13] || "Pharmacy").trim();

    if (!name || name.length < 2) continue;

    providers.push({
      licenseNumber: no ? String(no) : "",
      name,
      category: "Pharmacy",
      facilitySubtype: pharmacyType || practice,
      address,
      phone: normalizePhone(tel1 || tel2),
      email: email.toLowerCase(),
      area,
    });
  }

  return providers;
}

// --------------- Main ---------------

function toZavisProvider(raw) {
  return {
    name: raw.name || "Unknown",
    country: "bh",
    city: normalizeCity(raw.area),
    category: mapCategory(raw.category),
    address: raw.address || "",
    phone: raw.phone || "",
    email: raw.email || "",
    licenseNumber: raw.licenseNumber || "",
    facilityType: raw.category || "",
    source: "NHRA",
  };
}

async function main() {
  console.log("=== Bahrain NHRA Healthcare Provider Scraper ===\n");
  fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });

  const allProviders = [];

  // 1. Download and parse each source
  for (const [key, src] of Object.entries(SOURCES)) {
    const dest = path.join(DOWNLOAD_DIR, src.filename);

    // Download (skip if already exists and recent)
    const exists = fs.existsSync(dest);
    if (exists) {
      const age = Date.now() - fs.statSync(dest).mtimeMs;
      if (age < 24 * 60 * 60 * 1000) {
        console.log(`Using cached ${src.filename} (${(fs.statSync(dest).size / 1024).toFixed(1)} KB)`);
      } else {
        exists && fs.unlinkSync(dest);
      }
    }
    if (!fs.existsSync(dest)) {
      console.log(`Downloading ${key}: ${src.url}`);
      try {
        await download(src.url, dest);
        console.log(`  Saved (${(fs.statSync(dest).size / 1024).toFixed(1)} KB)`);
      } catch (e) {
        console.error(`  FAILED to download: ${e.message}`);
        console.log(`  Manual step: Download from browser and place at ${dest}`);
        continue;
      }
    }

    // Parse
    try {
      let records;
      if (key === "hospitals_pdf") {
        records = await parseHospitalsPdf(dest);
        console.log(`  Parsed ${records.length} hospital records`);
      } else if (key === "pharmacies_xlsx") {
        records = parsePharmaciesXlsx(dest);
        console.log(`  Parsed ${records.length} pharmacy records`);
      }
      if (records) {
        for (const r of records) allProviders.push(toZavisProvider(r));
      }
    } catch (e) {
      console.error(`  FAILED to parse ${key}: ${e.message}`);
      console.log(`  Stack: ${e.stack?.split("\n").slice(1, 3).join("\n")}`);
    }
  }

  // 2. Check NHRA Open Data page for additional datasets
  console.log("\nChecking NHRA Open Data page...");
  try {
    const html = await fetchPage("https://www.nhra.bh/OpenData/");
    const linkPattern = /href=["']([^"']*\.(xlsx|xlsm|xls|csv|pdf|json)[^"']*)/gi;
    const links = [];
    let m;
    while ((m = linkPattern.exec(html)) !== null) links.push(m[1]);

    if (links.length > 0) {
      console.log(`  Found ${links.length} downloadable file links:`);
      for (const link of links) console.log(`    - ${link}`);
      fs.writeFileSync(path.join(DOWNLOAD_DIR, "open_data_links.txt"), links.join("\n"), "utf8");
      console.log("  Saved links to open_data_links.txt");
    } else {
      console.log("  No direct file links found.");
      fs.writeFileSync(path.join(DOWNLOAD_DIR, "open_data_page.html"), html, "utf8");
    }
  } catch (e) {
    console.error(`  Failed to fetch Open Data page: ${e.message}`);
  }

  // 3. Write output
  fs.writeFileSync(OUT_FILE, JSON.stringify(allProviders, null, 2), "utf8");
  console.log(`\n=== Results ===`);
  console.log(`Total providers: ${allProviders.length}`);
  console.log(`Output: ${OUT_FILE}`);

  const byCat = {};
  for (const p of allProviders) byCat[p.category] = (byCat[p.category] || 0) + 1;
  console.log("By category:", byCat);

  // Show sample
  if (allProviders.length > 0) {
    console.log("\nSample hospital:", JSON.stringify(allProviders.find((p) => p.category === "hospitals"), null, 2));
    console.log("\nSample pharmacy:", JSON.stringify(allProviders.find((p) => p.category === "pharmacy"), null, 2));
  }
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
