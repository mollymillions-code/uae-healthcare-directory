/**
 * Google Places API enrichment — fast, no browser needed.
 * Usage: GOOGLE_PLACES_API_KEY=xxx node scripts/enrich-places-api.js [offset] [count]
 */
const fs = require("fs");
const https = require("https");

const KEY = process.env.GOOGLE_PLACES_API_KEY || fs.readFileSync(".env.local", "utf8").match(/GOOGLE_PLACES_API_KEY=(.+)/)?.[1];
if (!KEY) { console.error("No GOOGLE_PLACES_API_KEY"); process.exit(1); }

const ENRICHMENT_FILE = "data/parsed/google_enrichment.json";
const PROVIDERS_FILE = "src/lib/providers-scraped.json";

const offset = parseInt(process.argv[2]) || 0;
const count = parseInt(process.argv[3]) || 5000;

let enrichment = {};
try { enrichment = JSON.parse(fs.readFileSync(ENRICHMENT_FILE)); } catch {}

const providers = JSON.parse(fs.readFileSync(PROVIDERS_FILE));
const slice = providers.slice(offset, offset + count);

console.log(`Google Places API Enrichment`);
console.log(`Key: ${KEY.slice(0, 10)}...`);
console.log(`Providers: ${offset}–${offset + count} (${slice.length})`);
console.log(`Already enriched: ${Object.keys(enrichment).length}`);

function searchPlace(query) {
  return new Promise((resolve) => {
    const body = JSON.stringify({
      textQuery: query,
      languageCode: "en",
      maxResultCount: 1,
    });

    const req = https.request("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": KEY,
        "X-Goog-FieldMask": "places.displayName,places.rating,places.userRatingCount,places.internationalPhoneNumber,places.websiteUri,places.currentOpeningHours.weekdayDescriptions,places.formattedAddress",
      },
    }, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          if (json.places && json.places[0]) {
            const p = json.places[0];
            resolve({
              rating: p.rating || null,
              reviewCount: p.userRatingCount || 0,
              phone: p.internationalPhoneNumber || null,
              website: p.websiteUri || null,
              address: p.formattedAddress || null,
              hours: p.currentOpeningHours?.weekdayDescriptions?.join(" | ") || null,
            });
          } else {
            resolve(null);
          }
        } catch {
          resolve(null);
        }
      });
    });
    req.on("error", () => resolve(null));
    req.setTimeout(10000, () => { req.destroy(); resolve(null); });
    req.write(body);
    req.end();
  });
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function main() {
  let ok = 0, fail = 0, skip = 0;
  const t0 = Date.now();

  for (let i = 0; i < slice.length; i++) {
    const p = slice[i];

    if (enrichment[p.id]) { skip++; continue; }

    const query = `${p.name} ${p.address} UAE`;
    const data = await searchPlace(query);

    if (data) {
      enrichment[p.id] = data;
      ok++;
    } else {
      fail++;
    }

    // Log every 50
    if ((ok + fail) % 50 === 0 && (ok + fail) > 0) {
      const min = ((Date.now() - t0) / 60000).toFixed(1);
      const rate = ((ok + fail) / ((Date.now() - t0) / 60000)).toFixed(0);
      console.log(`[${offset + i + 1}] ✓${ok} ✗${fail} ⏭${skip} | ${min}m | ${rate}/min | ${p.name.slice(0, 40)}${data ? " → " + data.rating + "★" : ""}`);
    }

    // Save checkpoint every 100
    if ((ok + fail) % 100 === 0 && (ok + fail) > 0) {
      fs.writeFileSync(ENRICHMENT_FILE, JSON.stringify(enrichment));
    }

    // Small delay to stay under rate limits (10 QPS free tier)
    await sleep(120);
  }

  fs.writeFileSync(ENRICHMENT_FILE, JSON.stringify(enrichment));
  const min = ((Date.now() - t0) / 60000).toFixed(1);
  console.log(`\nDone in ${min}m | ✓${ok} ✗${fail} ⏭${skip} | Total enriched: ${Object.keys(enrichment).length}`);
}

main().catch(console.error);
