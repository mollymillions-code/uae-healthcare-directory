/**
 * Scrape Google Maps for provider ratings, phone, hours, address.
 * Stealth mode: random delays, viewport jitter, human-like scrolling.
 * Uses agent-browser (headless, isolated) — does NOT touch user's browser.
 *
 * Usage: node scripts/scrape-google-ratings.js [startIndex] [batchSize]
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const PROVIDERS_FILE = path.resolve("src/lib/providers-scraped.json");
const ENRICHMENT_FILE = path.resolve("data/parsed/google_enrichment.json");

const startIdx = parseInt(process.argv[2]) || 0;
const batchSize = parseInt(process.argv[3]) || 500;

let enrichment = {};
try {
  enrichment = JSON.parse(fs.readFileSync(ENRICHMENT_FILE, "utf8"));
  console.log(`Loaded ${Object.keys(enrichment).length} existing entries`);
} catch { console.log("Starting fresh"); }

const providers = JSON.parse(fs.readFileSync(PROVIDERS_FILE, "utf8"));
const batch = providers.slice(startIdx, startIdx + batchSize);
console.log(`Processing ${batch.length} providers (${startIdx}–${startIdx + batch.length})\n`);

function randomDelay(min, max) {
  return new Promise(r => setTimeout(r, Math.floor(Math.random() * (max - min) + min)));
}

function run(cmd, timeout = 15000) {
  try { return execSync(cmd, { timeout, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] }).trim(); }
  catch { return ""; }
}

async function scrape(provider) {
  if (enrichment[provider.id]) return null;

  const query = encodeURIComponent(`${provider.name} ${provider.citySlug === "dubai" ? "Dubai" : provider.address} UAE`);
  const url = `https://www.google.com/maps/search/${query}`;

  // Stealth: random viewport
  const w = [1366, 1440, 1536, 1920][Math.floor(Math.random() * 4)];
  run(`agent-browser set viewport ${w} 900`, 3000);
  run(`agent-browser open "${url}"`, 20000);
  await randomDelay(3000, 5000);

  // Click first result to open detail panel
  run('agent-browser eval \'(() => { var a = document.querySelector("a[aria-label][href*=place]"); if (a) a.click(); })()\'', 5000);
  await randomDelay(2000, 4000);

  // Stealth: slight scroll
  run("agent-browser scroll down 150", 3000);
  await randomDelay(500, 1000);

  // Extract from full page text (most reliable method)
  const raw = run(`agent-browser eval '
(() => {
  var text = document.body.innerText;
  var result = {rating: null, phone: null, hours: null, address: null, type: null};

  // Rating: "4.0" or "4.5" appearing before "Pharmacy/Clinic/Hospital" etc
  var ratingMatch = text.match(/See photos[\\s\\S]{0,100}?(\\d\\.\\d)/);
  if (ratingMatch) result.rating = parseFloat(ratingMatch[1]);
  if (!result.rating) {
    var rm2 = text.match(/(\\d\\.\\d)\\s*\\n/);
    if (rm2) result.rating = parseFloat(rm2[1]);
  }

  // Phone: +971 pattern
  var phoneMatch = text.match(/(\\+971[\\d\\s\\-]{7,15})/);
  if (phoneMatch) result.phone = phoneMatch[1].replace(/\\s+/g, " ").trim();

  // Address: "Al Rolla Rd - Al Raffa - Dubai" pattern (after share, before Open/Closes)
  var addrMatch = text.match(/Share\\s+([^\\n]+?(?:Dubai|Abu Dhabi|Sharjah|Ajman|Al Ain|Ras Al|Fujairah|Umm Al)[^\\n]*)/i);
  if (addrMatch) result.address = addrMatch[1].replace(/Located in:.*/, "").trim().slice(0, 200);

  // Hours: "Open · Closes X" or "Closed · Opens X"
  var hoursMatch = text.match(/((?:Open|Closed)\\s*·\\s*(?:Closes|Opens)\\s*[^\\n]{3,30})/i);
  if (hoursMatch) result.hours = hoursMatch[1].trim();

  // Type: Pharmacy, Clinic, Hospital etc (appears right after rating)
  var typeMatch = text.match(/\\d\\.\\d\\s*\\n?\\s*(Pharmacy|Hospital|Clinic|Medical|Dental|Center|Centre|Laboratory)/i);
  if (typeMatch) result.type = typeMatch[1];

  return JSON.stringify(result);
})()
'`, 10000);

  run("agent-browser close", 5000);

  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw.replace(/^"|"$/g, ""));
    if (parsed.rating || parsed.phone) return parsed;
    return null;
  } catch { return null; }
}

async function main() {
  let ok = 0, fail = 0, skip = 0;
  const t0 = Date.now();

  for (let i = 0; i < batch.length; i++) {
    const p = batch[i];
    if (enrichment[p.id]) { skip++; continue; }

    const data = await scrape(p);
    if (data) {
      enrichment[p.id] = data;
      ok++;
    } else {
      fail++;
    }

    if ((ok + fail) % 10 === 0 && (ok + fail) > 0) {
      const min = ((Date.now() - t0) / 60000).toFixed(1);
      console.log(`[${startIdx + i + 1}] ✓${ok} ✗${fail} ⏭${skip} | ${min}m | ${p.name.slice(0, 35)}${data ? " → " + data.rating + "★" : ""}`);
      fs.writeFileSync(ENRICHMENT_FILE, JSON.stringify(enrichment));
    }

    await randomDelay(2000, 5000);

    // Stealth: long pause every ~50
    if ((ok + fail) % 50 === 0 && (ok + fail) > 0) {
      console.log("  💤 stealth break...");
      await randomDelay(15000, 30000);
    }
  }

  fs.writeFileSync(ENRICHMENT_FILE, JSON.stringify(enrichment));
  console.log(`\nDone in ${((Date.now() - t0) / 60000).toFixed(1)}m | ✓${ok} ✗${fail} ⏭${skip} | Total: ${Object.keys(enrichment).length}`);
}

main();
