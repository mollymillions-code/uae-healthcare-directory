/**
 * Screenshot Slides with Quality Gate
 *
 * Takes screenshots of report slides for LinkedIn carousels.
 * REQUIRES quality scoring to pass before screenshots are finalized.
 *
 * Flow:
 *   1. Run quality scorer first
 *   2. If any slide fails threshold → BLOCK (no screenshots produced)
 *   3. If all slides pass → take screenshots
 *
 * Usage:
 *   node scripts/screenshot-slides.mjs <report-slug> [output-dir] [--threshold=70] [--force]
 *
 * --force    Skip quality gate (use only for debugging, never for production)
 */

import puppeteer from 'puppeteer'
import { readFileSync, mkdirSync, existsSync, rmSync } from 'fs'
import { join } from 'path'
import { execSync } from 'child_process'

const reportSlug = process.argv[2] || 'ai-healthcare-uae'
const outputDir = process.argv[3] || `references/linkedin-carousel-${reportSlug}`
const forceMode = process.argv.includes('--force')
const scoreThreshold = parseInt(
  (process.argv.find(a => a.startsWith('--threshold=')) || '--threshold=70').split('=')[1]
)

const htmlPath = join(process.cwd(), `data/reports/${reportSlug}/report.html`)
if (!existsSync(htmlPath)) {
  console.error(`Report not found: ${htmlPath}`)
  process.exit(1)
}

// ═══════════════════════════════════════════
// STEP 1: QUALITY GATE (runs BEFORE screenshots)
// ═══════════════════════════════════════════
if (!forceMode) {
  console.log('\n🔍 STEP 1: Running quality scorer...\n')

  try {
    execSync(
      `node scripts/score-slides.mjs ${reportSlug} --threshold=${scoreThreshold} --fail`,
      { stdio: 'inherit', cwd: process.cwd() }
    )
  } catch (e) {
    // scorer exited with code 1 → slides failed
    console.error('\n🚫 SCREENSHOTS BLOCKED — quality gate failed.')
    console.error('   Fix the failing slides and re-run this script.')
    console.error('   Use --force to bypass (debugging only, never for production).\n')
    process.exit(1)
  }

  console.log('\n✅ Quality gate passed. Proceeding to screenshots...\n')
} else {
  console.log('\n⚠️  Quality gate SKIPPED (--force mode). Screenshots may have readability issues.\n')
}

// ═══════════════════════════════════════════
// STEP 2: TAKE SCREENSHOTS
// ═══════════════════════════════════════════
if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true })

let html = readFileSync(htmlPath, 'utf8')
html = html.replace(/url\(\/reports\//g, 'url(http://localhost:3000/reports/')
html = html.replace(/src="\/reports\//g, 'src="http://localhost:3000/reports/')

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
})

const page = await browser.newPage()
await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 2 })

await page.setContent(html, { waitUntil: 'networkidle2', timeout: 30000 })
await new Promise(r => setTimeout(r, 3000))

const slideCount = await page.evaluate(() => document.querySelectorAll('section').length)
console.log(`📸 Capturing ${slideCount} slides...`)

// Trigger all reveal animations
await page.evaluate(() => {
  document.querySelectorAll('.rv, .reveal').forEach(el => {
    el.classList.add('vis')
    el.style.opacity = '1'
    el.style.transform = 'none'
  })
  document.querySelectorAll('[data-w]').forEach(el => {
    el.style.width = el.dataset.w
  })
})
await new Promise(r => setTimeout(r, 1000))

for (let i = 0; i < slideCount; i++) {
  const slideNum = String(i + 1).padStart(2, '0')

  await page.evaluate((index) => {
    const sections = document.querySelectorAll('section')
    if (sections[index]) sections[index].scrollIntoView({ behavior: 'instant' })
  }, i)

  await new Promise(r => setTimeout(r, 800))

  // Re-trigger animations for this slide
  await page.evaluate((index) => {
    const section = document.querySelectorAll('section')[index]
    if (section) {
      section.querySelectorAll('.rv, .reveal').forEach(el => {
        el.style.opacity = '1'
        el.style.transform = 'none'
      })
      section.querySelectorAll('[data-w]').forEach(el => {
        el.style.width = el.dataset.w
      })
    }
  }, i)

  await new Promise(r => setTimeout(r, 500))

  await page.screenshot({ path: `${outputDir}/slide-${slideNum}.png`, type: 'png' })
  console.log(`  ✓ slide-${slideNum}.png`)
}

await browser.close()
console.log(`\n✅ Done. ${slideCount} slides saved to ${outputDir}/\n`)
