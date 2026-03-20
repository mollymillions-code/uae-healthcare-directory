process.on('unhandledRejection', (reason) => {
  console.error('UnhandledRejection:', reason && reason.message);
});

const { chromium } = require('playwright');
const fs = require('fs');

const enrichment = JSON.parse(fs.readFileSync('data/parsed/google_enrichment.json','utf8'));
const providers = JSON.parse(fs.readFileSync('src/lib/providers-scraped.json','utf8'));
// Start from first unenriched after 646
let startAt = 646;
for (let i = 646; i < providers.length; i++) {
  if (!enrichment[providers[i].id]) { startAt = i; break; }
}
console.log('Starting at index:', startAt, providers[startAt].name);
const batch = providers.slice(startAt, startAt + 25);

function rand(min, max) { return Math.floor(Math.random() * (max - min) + min); }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const browser = await chromium.launch({ headless: true, args: ['--disable-blink-features=AutomationControlled'] });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: 'en-AE',
    timezoneId: 'Asia/Dubai',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
  });
  await context.route('**/*.{png,jpg,jpeg,gif,svg,woff,woff2,ttf}', route => route.abort());
  const page = await context.newPage();

  let ok = 0, fail = 0;

  for (let i = 0; i < batch.length; i++) {
    const p = batch[i];
    const city = p.citySlug === 'dubai' ? 'Dubai' :
      p.citySlug === 'abu-dhabi' ? 'Abu Dhabi' :
      p.citySlug === 'sharjah' ? 'Sharjah' :
      (p.address || '').split(',').pop()?.trim() || 'UAE';
    const url = `https://www.google.com/maps/search/${encodeURIComponent(p.name + ' ' + city + ' UAE')}`;

    console.log(`[${startAt+i}] ${p.name}`);
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await sleep(rand(2000, 3000));

      const firstResult = await page.$('a[aria-label][href*="/maps/place/"]');
      if (firstResult) {
        await firstResult.click();
        await sleep(rand(2000, 3000));
      }

      await page.mouse.wheel(0, rand(100, 300));
      await sleep(rand(500, 1000));

      const data = await page.evaluate(() => {
        const result = { rating: null, reviewCount: null };
        document.querySelectorAll('[aria-label]').forEach(el => {
          const label = el.getAttribute('aria-label') || '';
          if (!result.rating && /\d\.\d\s*star/i.test(label)) {
            result.rating = parseFloat(label.match(/(\d\.\d)/)[1]);
          }
          if (!result.reviewCount && /\d+\s*review/i.test(label)) {
            result.reviewCount = parseInt(label.match(/(\d[\d,]*)\s*review/i)[1].replace(/,/g,''));
          }
        });
        return result;
      });

      console.log(`  rating: ${data.rating} reviews: ${data.reviewCount}`);
      ok++;
    } catch(e) {
      console.error(`  ERR: ${e.message}`);
      fail++;
    }

    await sleep(rand(1500, 3000));
  }

  await browser.close();
  console.log(`ok: ${ok} fail: ${fail}`);
}

main().catch(e => { console.error('FATAL:', e.message, e.stack); });
