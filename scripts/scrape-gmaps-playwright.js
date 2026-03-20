/**
 * Google Maps scraper using Playwright CLI (headless).
 * Stealth: random delays, human-like scrolling, viewport jitter.
 * Does NOT touch user's browser — uses its own headless Chromium.
 *
 * Usage: node scripts/scrape-gmaps-playwright.js [startIndex] [batchSize]
 */

const { chromium } = require("playwright");
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

function rand(min, max) { return Math.floor(Math.random() * (max - min) + min); }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function scrapeProvider(page, provider) {
  if (enrichment[provider.id]) return null;

  const city = provider.citySlug === "dubai" ? "Dubai" :
    provider.citySlug === "abu-dhabi" ? "Abu Dhabi" :
    provider.citySlug === "sharjah" ? "Sharjah" :
    provider.address.split(",").pop()?.trim() || "UAE";

  const query = `${provider.name} ${city} UAE`;
  const url = `https://www.google.com/maps/search/${encodeURIComponent(query)}`;

  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });
    await sleep(rand(2000, 4000));

    // Click first result link if it's a search results page
    const firstResult = await page.$('a[aria-label][href*="/maps/place/"]');
    if (firstResult) {
      await firstResult.click();
      await sleep(rand(2000, 3000));
    }

    // Scroll slightly for human behavior
    await page.mouse.wheel(0, rand(100, 300));
    await sleep(rand(500, 1500));

    // Extract data from the page
    const data = await page.evaluate(() => {
      const result = { rating: null, reviewCount: null, phone: null, website: null, hours: null, address: null };
      const body = document.body.innerText;

      // Rating from aria-labels
      document.querySelectorAll("[aria-label]").forEach(el => {
        const label = el.getAttribute("aria-label") || "";
        if (!result.rating && /\d\.\d\s*star/i.test(label)) {
          result.rating = parseFloat(label.match(/(\d\.\d)/)[1]);
        }
        if (!result.reviewCount && /\d+\s*review/i.test(label)) {
          result.reviewCount = parseInt(label.match(/(\d[\d,]*)\s*review/i)[1].replace(/,/g, ""));
        }
        if (!result.phone && /phone/i.test(label)) {
          const m = label.match(/([\+\d][\d\s\-]{6,})/);
          if (m) result.phone = m[1].trim();
        }
      });

      // Fallback: text patterns
      if (!result.rating) {
        const m = body.match(/See photos[\s\S]{0,100}?(\d\.\d)/);
        if (m) result.rating = parseFloat(m[1]);
      }
      if (!result.phone) {
        const m = body.match(/(\+971[\d\s\-]{7,15})/);
        if (m) result.phone = m[1].replace(/\s+/g, " ").trim();
      }

      // Address
      const addrMatch = body.match(/Share\s+([^\n]+?(?:Dubai|Abu Dhabi|Sharjah|Ajman|Al Ain|Ras Al|Fujairah|Umm Al)[^\n]*)/i);
      if (addrMatch) result.address = addrMatch[1].replace(/Located in:.*/, "").trim().slice(0, 200);

      // Hours
      const hoursMatch = body.match(/((?:Open|Closed)\s*·\s*(?:Closes|Opens)\s*[^\n]{3,30})/i);
      if (hoursMatch) result.hours = hoursMatch[1].trim();

      // Website
      document.querySelectorAll("a[data-item-id*=authority], a[aria-label*=Website]").forEach(el => {
        if (!result.website && el.href && !el.href.includes("google.com")) result.website = el.href;
      });

      return result;
    });

    if (data.rating || data.phone || data.website) return data;
    return null;
  } catch {
    return null;
  }
}

async function newBrowser() {
  const browser = await chromium.launch({
    headless: true,
    args: ["--disable-blink-features=AutomationControlled", "--no-sandbox", "--disable-setuid-sandbox"],
  });
  const context = await browser.newContext({
    viewport: { width: rand(1366, 1920), height: rand(768, 1080) },
    locale: "en-AE",
    timezoneId: "Asia/Dubai",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
  });
  await context.route("**/*.{png,jpg,jpeg,gif,svg,woff,woff2,ttf}", route => route.abort());
  const page = await context.newPage();
  return { browser, page };
}

async function main() {
  let { browser, page } = await newBrowser();

  let ok = 0, fail = 0, skip = 0;
  const t0 = Date.now();

  for (let i = 0; i < batch.length; i++) {
    const p = batch[i];
    if (enrichment[p.id]) { skip++; continue; }

    let data = null;
    try {
      data = await scrapeProvider(page, p);
    } catch (err) {
      console.error(`  [crash] ${p.name}: ${err.message}`);
      // Try to recover with a fresh browser
      try { await browser.close(); } catch {}
      await sleep(rand(5000, 10000));
      try {
        const fresh = await newBrowser();
        browser = fresh.browser;
        page = fresh.page;
        data = await scrapeProvider(page, p);
      } catch (err2) {
        console.error(`  [crash2] ${p.name}: ${err2.message}`);
      }
    }

    if (data) {
      enrichment[p.id] = data;
      ok++;
    } else {
      fail++;
    }

    // Save every 5 entries to reduce I/O contention
    if ((ok + fail + skip) % 5 === 0) {
      fs.writeFileSync(ENRICHMENT_FILE, JSON.stringify(enrichment));
    }

    if ((ok + fail) % 10 === 0 && (ok + fail) > 0) {
      const min = ((Date.now() - t0) / 60000).toFixed(1);
      console.log(`[${startIdx + i + 1}] ✓${ok} ✗${fail} ⏭${skip} | ${min}m | ${p.name.slice(0, 35)}${data ? " → " + data.rating + "★" : ""}`);
    }

    // Stealth delays — reduced for speed
    await sleep(rand(400, 1000));
    if ((ok + fail) % 120 === 0 && (ok + fail) > 0) {
      console.log("  💤 stealth break...");
      await sleep(rand(5000, 10000));
    }
  }

  try { await browser.close(); } catch {}
  console.log(`\nDone in ${((Date.now() - t0) / 60000).toFixed(1)}m | ✓${ok} ✗${fail} ⏭${skip} | Total: ${Object.keys(enrichment).length}`);
}

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection (non-fatal):', reason);
  // Do NOT exit — the main loop has its own error recovery
});

main().catch(err => {
  console.error('Fatal error:', err.message, err.stack);
  // Don't exit — keep the process running if possible
});
