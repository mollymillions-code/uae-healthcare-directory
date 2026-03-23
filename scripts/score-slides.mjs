/**
 * Slide Quality Scorer v2
 *
 * Comprehensive quality evaluation for report slides. Scores on 8 dimensions:
 *
 * 1. TYPOGRAPHY       (15%) — font size minimums, hierarchy presence
 * 2. CONTRAST         (20%) — WCAG AA text-to-background ratios
 * 3. VISIBILITY       (10%) — no hidden/transparent text after animation
 * 4. OVERLAY          (10%) — background images have adequate darkening
 * 5. CONTENT DENSITY  (10%) — not too crowded, not too empty
 * 6. VISUAL HIERARCHY (15%) — clear size differentiation between heading/body/caption
 * 7. WHITESPACE       (10%) — adequate breathing room, not cramped
 * 8. READABILITY      (10%) — line lengths, line heights, text clipping
 *
 * Usage:
 *   node scripts/score-slides.mjs <report-slug> [--threshold=70] [--fail]
 *
 * --threshold=N  Minimum passing score per slide (default: 70)
 * --fail         Exit with code 1 if any slide fails threshold (used by screenshot script)
 */

import puppeteer from 'puppeteer'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

// ─── CONFIG ───
const WEIGHTS = {
  typography: 0.15,
  contrast: 0.20,
  visibility: 0.10,
  overlay: 0.10,
  contentDensity: 0.10,
  visualHierarchy: 0.15,
  whitespace: 0.10,
  readability: 0.10,
}

const MIN_FONT_SIZES = {
  body: 16,
  bodySm: 14,
  heading: 18,
  caption: 12,
  label: 11,
  absolute: 11,  // hard floor — nothing below this
}

const MIN_CONTRAST = {
  normalText: 4.5,  // WCAG AA
  largeText: 3.0,   // ≥18px or ≥14px bold
}

// ─── PARSE ARGS ───
const reportSlug = process.argv[2]
if (!reportSlug) {
  console.error('Usage: node scripts/score-slides.mjs <report-slug> [--threshold=70] [--fail]')
  process.exit(1)
}

const args = process.argv.slice(3)
const threshold = parseInt(args.find(a => a.startsWith('--threshold='))?.split('=')[1] || '70')
const failOnThreshold = args.includes('--fail')

const htmlPath = join(process.cwd(), `data/reports/${reportSlug}/report.html`)
if (!existsSync(htmlPath)) {
  console.error(`Report not found: ${htmlPath}`)
  process.exit(1)
}

let html = readFileSync(htmlPath, 'utf8')
html = html.replace(/url\(\/reports\//g, 'url(http://localhost:3000/reports/')
html = html.replace(/src="\/reports\//g, 'src="http://localhost:3000/reports/')

// ─── MAIN ───
const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
})

const page = await browser.newPage()
await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 2 })
await page.setContent(html, { waitUntil: 'networkidle2', timeout: 30000 })
await new Promise(r => setTimeout(r, 3000))

// Trigger all animations
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

const slideCount = await page.evaluate(() => document.querySelectorAll('section').length)

console.log(`\n${'═'.repeat(76)}`)
console.log(`  SLIDE QUALITY REPORT: ${reportSlug}`)
console.log(`  ${slideCount} slides | threshold: ${threshold}/100 | ${new Date().toISOString().split('T')[0]}`)
console.log(`${'═'.repeat(76)}\n`)

const slideScores = []

for (let i = 0; i < slideCount; i++) {
  await page.evaluate((index) => {
    const sections = document.querySelectorAll('section')
    if (sections[index]) sections[index].scrollIntoView({ behavior: 'instant' })
  }, i)
  await new Promise(r => setTimeout(r, 600))

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
  await new Promise(r => setTimeout(r, 400))

  const result = await page.evaluate((index, minFonts, minContrast) => {
    const section = document.querySelectorAll('section')[index]
    if (!section) return null

    const issues = []
    const sectionRect = section.getBoundingClientRect()

    // ─── HELPERS ───
    function parseColor(colorStr) {
      const el = document.createElement('div')
      el.style.color = colorStr
      document.body.appendChild(el)
      const computed = getComputedStyle(el).color
      document.body.removeChild(el)
      const match = computed.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
      if (!match) return null
      return { r: parseInt(match[1]), g: parseInt(match[2]), b: parseInt(match[3]) }
    }

    function sRGBtoLinear(c) {
      c = c / 255
      return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    }

    function luminance(r, g, b) {
      return 0.2126 * sRGBtoLinear(r) + 0.7152 * sRGBtoLinear(g) + 0.0722 * sRGBtoLinear(b)
    }

    function cr(l1, l2) {
      return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
    }

    // Collect all visible text elements with direct text content
    const allTextEls = section.querySelectorAll('h1,h2,h3,h4,h5,h6,p,span,div,a,li,td,th,label')
    const textElements = []
    allTextEls.forEach(el => {
      const text = el.textContent?.trim()
      if (!text) return
      const hasDirectText = Array.from(el.childNodes).some(n => n.nodeType === 3 && n.textContent.trim())
      if (!hasDirectText && el.children.length > 0) return
      const rect = el.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) return
      textElements.push(el)
    })

    // ═══════════════════════════════════════════
    // 1. TYPOGRAPHY (15%) — font size minimums
    // ═══════════════════════════════════════════
    let typographyScore = 100
    let tooSmallCount = 0
    const fontSizes = []

    textElements.forEach(el => {
      const computed = getComputedStyle(el)
      const fontSize = parseFloat(computed.fontSize)
      fontSizes.push(fontSize)

      if (fontSize < minFonts.absolute) {
        tooSmallCount++
        issues.push({
          type: 'typography',
          severity: 'critical',
          msg: `${fontSize}px text (min: ${minFonts.absolute}px)`,
          text: el.textContent.trim().substring(0, 50),
        })
      }
    })

    if (textElements.length > 0) {
      const violationRate = tooSmallCount / textElements.length
      typographyScore = Math.round(Math.max(0, (1 - violationRate * 3) * 100)) // 3x penalty
    }

    // ═══════════════════════════════════════════
    // 2. CONTRAST (20%) — WCAG AA compliance
    // ═══════════════════════════════════════════
    let contrastScore = 100
    let contrastChecks = 0
    let contrastFails = 0
    const contrastRatios = []

    textElements.forEach(el => {
      const computed = getComputedStyle(el)
      const fontSize = parseFloat(computed.fontSize)
      const fontWeight = parseInt(computed.fontWeight) || 400
      const isLargeText = fontSize >= 18 || (fontSize >= 14 && fontWeight >= 700)

      const fgColor = parseColor(computed.color)
      let bgColor = null
      let current = el
      while (current && current !== document.body) {
        const bg = getComputedStyle(current).backgroundColor
        const parsed = parseColor(bg)
        if (parsed) {
          const alphaMatch = bg.match(/rgba\(\d+,\s*\d+,\s*\d+,\s*([\d.]+)\)/)
          if (!alphaMatch || parseFloat(alphaMatch[1]) > 0.3) {
            bgColor = parsed
            break
          }
        }
        current = current.parentElement
      }
      if (!bgColor) bgColor = { r: 8, g: 11, b: 18 } // report dark bg

      if (fgColor) {
        contrastChecks++
        const fgLum = luminance(fgColor.r, fgColor.g, fgColor.b)
        const bgLum = luminance(bgColor.r, bgColor.g, bgColor.b)
        const ratio = cr(fgLum, bgLum)
        contrastRatios.push(ratio)
        const required = isLargeText ? minContrast.largeText : minContrast.normalText

        if (ratio < required) {
          contrastFails++
          issues.push({
            type: 'contrast',
            severity: ratio < 2.5 ? 'critical' : 'warning',
            msg: `${ratio.toFixed(1)}:1 ratio (need ${required}:1)`,
            text: el.textContent.trim().substring(0, 50),
          })
        }
      }
    })

    if (contrastChecks > 0) {
      contrastScore = Math.round(((contrastChecks - contrastFails) / contrastChecks) * 100)
    }

    // ═══════════════════════════════════════════
    // 3. VISIBILITY (10%) — hidden elements
    // ═══════════════════════════════════════════
    let visibilityScore = 100
    let hiddenCount = 0

    textElements.forEach(el => {
      const computed = getComputedStyle(el)
      const opacity = parseFloat(computed.opacity)
      if (opacity < 0.5 || computed.visibility === 'hidden' || computed.display === 'none') {
        hiddenCount++
        issues.push({
          type: 'visibility',
          severity: opacity === 0 ? 'critical' : 'warning',
          msg: `opacity: ${opacity.toFixed(2)}`,
          text: el.textContent.trim().substring(0, 50),
        })
      }
    })

    if (textElements.length > 0) {
      visibilityScore = Math.round(((textElements.length - hiddenCount) / textElements.length) * 100)
    }

    // ═══════════════════════════════════════════
    // 4. OVERLAY (10%) — bg image coverage
    // ═══════════════════════════════════════════
    let overlayScore = 100
    const bgEl = section.querySelector('.s-bg')
    const hasOverlayClass = section.className.includes('ov-')

    if (bgEl) {
      const bgImage = bgEl.style.backgroundImage
      if (bgImage && bgImage !== 'none' && bgImage !== '') {
        if (!hasOverlayClass) {
          overlayScore = 20
          issues.push({
            type: 'overlay',
            severity: 'critical',
            msg: 'Background image without overlay class',
            text: 'Text will be unreadable over raw image',
          })
        }
      }
    }

    // ═══════════════════════════════════════════
    // 5. CONTENT DENSITY (10%) — element count
    // ═══════════════════════════════════════════
    let contentDensityScore = 100
    const elementCount = textElements.length
    const slideArea = sectionRect.width * sectionRect.height

    // Too empty (< 3 text elements on a non-hero slide)
    if (elementCount < 2) {
      contentDensityScore = 50
      issues.push({
        type: 'density',
        severity: 'warning',
        msg: `Only ${elementCount} text element(s) — slide may look empty`,
        text: '',
      })
    }
    // Too crowded (> 25 text elements)
    else if (elementCount > 25) {
      contentDensityScore = Math.max(30, 100 - (elementCount - 25) * 5)
      issues.push({
        type: 'density',
        severity: elementCount > 35 ? 'critical' : 'warning',
        msg: `${elementCount} text elements — slide is overcrowded`,
        text: 'Consider splitting into multiple slides',
      })
    }

    // ═══════════════════════════════════════════
    // 6. VISUAL HIERARCHY (15%) — size differentiation
    // ═══════════════════════════════════════════
    let visualHierarchyScore = 100

    if (fontSizes.length >= 3) {
      const uniqueSizes = [...new Set(fontSizes.map(s => Math.round(s)))]
      uniqueSizes.sort((a, b) => b - a)

      // Need at least 3 distinct size tiers (heading, body, caption/label)
      if (uniqueSizes.length < 2) {
        visualHierarchyScore = 40
        issues.push({
          type: 'hierarchy',
          severity: 'critical',
          msg: `Only ${uniqueSizes.length} font size tier(s) — no visual hierarchy`,
          text: `All text at ~${uniqueSizes[0]}px`,
        })
      } else if (uniqueSizes.length < 3) {
        visualHierarchyScore = 70
        issues.push({
          type: 'hierarchy',
          severity: 'warning',
          msg: '2 font size tiers — weak hierarchy',
          text: `Sizes: ${uniqueSizes.join('px, ')}px`,
        })
      }

      // Check that largest is meaningfully bigger than smallest
      const largest = uniqueSizes[0]
      const smallest = uniqueSizes[uniqueSizes.length - 1]
      const ratio = largest / smallest

      if (ratio < 1.5) {
        visualHierarchyScore = Math.min(visualHierarchyScore, 50)
        issues.push({
          type: 'hierarchy',
          severity: 'warning',
          msg: `Size ratio ${ratio.toFixed(1)}x (need ≥1.5x between heading and body)`,
          text: `Range: ${smallest}px – ${largest}px`,
        })
      }
    }

    // ═══════════════════════════════════════════
    // 7. WHITESPACE (10%) — padding & spacing
    // ═══════════════════════════════════════════
    let whitespaceScore = 100

    // Check slide padding
    const padEl = section.querySelector('.s-pad')
    if (padEl) {
      const padStyle = getComputedStyle(padEl)
      const padTop = parseFloat(padStyle.paddingTop)
      const padLeft = parseFloat(padStyle.paddingLeft)

      if (padTop < 20 || padLeft < 20) {
        whitespaceScore = 50
        issues.push({
          type: 'whitespace',
          severity: 'warning',
          msg: `Padding too tight: ${padTop}px top, ${padLeft}px left`,
          text: 'Content may feel cramped',
        })
      }
    }

    // Check if text elements are overlapping
    let overlapCount = 0
    for (let a = 0; a < Math.min(textElements.length, 20); a++) {
      const rectA = textElements[a].getBoundingClientRect()
      for (let b = a + 1; b < Math.min(textElements.length, 20); b++) {
        if (textElements[b].contains(textElements[a]) || textElements[a].contains(textElements[b])) continue
        const rectB = textElements[b].getBoundingClientRect()
        const overlapX = Math.max(0, Math.min(rectA.right, rectB.right) - Math.max(rectA.left, rectB.left))
        const overlapY = Math.max(0, Math.min(rectA.bottom, rectB.bottom) - Math.max(rectA.top, rectB.top))
        if (overlapX > 5 && overlapY > 5) overlapCount++
      }
    }

    if (overlapCount > 0) {
      whitespaceScore = Math.max(20, whitespaceScore - overlapCount * 15)
      issues.push({
        type: 'whitespace',
        severity: overlapCount > 3 ? 'critical' : 'warning',
        msg: `${overlapCount} overlapping text element pair(s)`,
        text: 'Text is colliding',
      })
    }

    // ═══════════════════════════════════════════
    // 8. READABILITY (10%) — line length, line height, clipping
    // ═══════════════════════════════════════════
    let readabilityScore = 100
    let readabilityIssues = 0

    textElements.forEach(el => {
      const computed = getComputedStyle(el)
      const fontSize = parseFloat(computed.fontSize)
      const lineHeight = parseFloat(computed.lineHeight)
      const rect = el.getBoundingClientRect()

      // Line height check (should be ≥ 1.3x font size for body text)
      if (fontSize <= 20 && lineHeight > 0 && lineHeight / fontSize < 1.3) {
        readabilityIssues++
        issues.push({
          type: 'readability',
          severity: 'warning',
          msg: `Line height ${(lineHeight / fontSize).toFixed(2)}x (need ≥1.3x)`,
          text: el.textContent.trim().substring(0, 50),
        })
      }

      // Text clipping — element extends beyond slide bounds
      if (rect.right > sectionRect.right + 10 || rect.bottom > sectionRect.bottom + 10) {
        readabilityIssues++
        issues.push({
          type: 'readability',
          severity: 'critical',
          msg: 'Text extends beyond slide boundary (clipped)',
          text: el.textContent.trim().substring(0, 50),
        })
      }
    })

    if (textElements.length > 0 && readabilityIssues > 0) {
      readabilityScore = Math.max(20, 100 - readabilityIssues * 10)
    }

    // ═══════════════════════════════════════════
    // COMPOSITE SCORE
    // ═══════════════════════════════════════════
    const scores = {
      typography: typographyScore,
      contrast: contrastScore,
      visibility: visibilityScore,
      overlay: overlayScore,
      contentDensity: contentDensityScore,
      visualHierarchy: visualHierarchyScore,
      whitespace: whitespaceScore,
      readability: readabilityScore,
    }

    // Detect slide title for reporting
    const titleEl = section.querySelector('h1, h2, .h1, .h2, .tag')
    const slideTitle = titleEl ? titleEl.textContent.trim().substring(0, 60) : '(untitled)'

    return {
      scores,
      issues: issues
        .sort((a, b) => (a.severity === 'critical' ? 0 : 1) - (b.severity === 'critical' ? 0 : 1))
        .slice(0, 10),
      slideTitle,
      textElementCount: textElements.length,
      fontSizeRange: fontSizes.length > 0
        ? { min: Math.round(Math.min(...fontSizes)), max: Math.round(Math.max(...fontSizes)) }
        : null,
      contrastRange: contrastRatios.length > 0
        ? { min: parseFloat(Math.min(...contrastRatios).toFixed(1)), max: parseFloat(Math.max(...contrastRatios).toFixed(1)) }
        : null,
    }
  }, i, MIN_FONT_SIZES, MIN_CONTRAST)

  if (!result) continue

  const slideNum = String(i + 1).padStart(2, '0')

  // Calculate weighted composite
  const composite = Math.round(
    Object.entries(WEIGHTS).reduce((sum, [key, weight]) => {
      return sum + (result.scores[key] || 0) * weight
    }, 0)
  )

  const passed = composite >= threshold
  const icon = passed ? '✅' : '❌'

  slideScores.push({
    slide: i + 1,
    title: result.slideTitle,
    composite,
    passed,
    ...result.scores,
    issues: result.issues,
    textElementCount: result.textElementCount,
    fontSizeRange: result.fontSizeRange,
    contrastRange: result.contrastRange,
  })

  // Print score card
  console.log(`${icon} Slide ${slideNum}  │  ${composite}/100  │  "${result.slideTitle}"`)
  console.log(`   Typo: ${result.scores.typography}  Contrast: ${result.scores.contrast}  Vis: ${result.scores.visibility}  Overlay: ${result.scores.overlay}  Density: ${result.scores.contentDensity}  Hierarchy: ${result.scores.visualHierarchy}  Space: ${result.scores.whitespace}  Read: ${result.scores.readability}`)

  if (result.fontSizeRange) {
    console.log(`   Font range: ${result.fontSizeRange.min}px – ${result.fontSizeRange.max}px  |  Elements: ${result.textElementCount}${result.contrastRange ? `  |  Contrast: ${result.contrastRange.min}:1 – ${result.contrastRange.max}:1` : ''}`)
  }

  const criticalIssues = result.issues.filter(i => i.severity === 'critical')
  const warnings = result.issues.filter(i => i.severity === 'warning')

  if (criticalIssues.length > 0) {
    criticalIssues.forEach(issue => {
      console.log(`   🔴 ${issue.type}: ${issue.msg}`)
      if (issue.text) console.log(`      "${issue.text}"`)
    })
  }
  if (warnings.length > 0) {
    warnings.slice(0, 3).forEach(issue => {
      console.log(`   🟡 ${issue.type}: ${issue.msg}`)
    })
  }
  console.log('')
}

// ═══════════════════════════════════════════
// SUMMARY
// ═══════════════════════════════════════════
console.log(`${'═'.repeat(76)}`)
console.log(`  SUMMARY`)
console.log(`${'═'.repeat(76)}`)

const avgScore = Math.round(slideScores.reduce((s, r) => s + r.composite, 0) / slideScores.length)
const failedSlides = slideScores.filter(s => !s.passed)
const passedSlides = slideScores.filter(s => s.passed)

const grade = avgScore >= 90 ? 'A' : avgScore >= 80 ? 'B' : avgScore >= 70 ? 'C' : avgScore >= 60 ? 'D' : 'F'

console.log(`\n  Report:     ${reportSlug}`)
console.log(`  Grade:      ${grade} (${avgScore}/100)`)
console.log(`  Passed:     ${passedSlides.length}/${slideScores.length} slides`)
console.log(`  Threshold:  ${threshold}/100`)

if (failedSlides.length > 0) {
  console.log(`\n  ❌ FAILED SLIDES:`)
  failedSlides.forEach(s => {
    console.log(`     Slide #${s.slide} — ${s.composite}/100 — "${s.title}"`)
    const crits = s.issues.filter(i => i.severity === 'critical')
    crits.forEach(issue => {
      console.log(`       🔴 ${issue.type}: ${issue.msg}`)
    })
  })
}

// Dimension averages
console.log(`\n  Dimension Averages:`)
const dims = ['typography', 'contrast', 'visibility', 'overlay', 'contentDensity', 'visualHierarchy', 'whitespace', 'readability']
dims.forEach(dim => {
  const avg = Math.round(slideScores.reduce((s, r) => s + (r[dim] || 0), 0) / slideScores.length)
  const bar = '█'.repeat(Math.round(avg / 5)) + '░'.repeat(20 - Math.round(avg / 5))
  const label = dim.replace(/([A-Z])/g, ' $1').padEnd(18)
  console.log(`    ${label} ${bar} ${avg}/100`)
})

console.log('')

await browser.close()

// ─── WRITE JSON REPORT ───
const output = {
  report: reportSlug,
  timestamp: new Date().toISOString(),
  grade,
  averageScore: avgScore,
  threshold,
  passed: failedSlides.length === 0,
  slideCount: slideScores.length,
  failedCount: failedSlides.length,
  dimensionAverages: Object.fromEntries(dims.map(dim => [
    dim,
    Math.round(slideScores.reduce((s, r) => s + (r[dim] || 0), 0) / slideScores.length),
  ])),
  slides: slideScores.map(s => ({
    slide: s.slide,
    title: s.title,
    score: s.composite,
    passed: s.passed,
    dimensions: {
      typography: s.typography,
      contrast: s.contrast,
      visibility: s.visibility,
      overlay: s.overlay,
      contentDensity: s.contentDensity,
      visualHierarchy: s.visualHierarchy,
      whitespace: s.whitespace,
      readability: s.readability,
    },
    fontSizeRange: s.fontSizeRange,
    contrastRange: s.contrastRange,
    textElementCount: s.textElementCount,
    criticalIssues: s.issues.filter(i => i.severity === 'critical').map(i => i.msg),
    warnings: s.issues.filter(i => i.severity === 'warning').map(i => i.msg),
  })),
}

const jsonPath = join(process.cwd(), `data/reports/${reportSlug}/quality-score.json`)
writeFileSync(jsonPath, JSON.stringify(output, null, 2))
console.log(`📄 Score report: ${jsonPath}`)

if (failOnThreshold && failedSlides.length > 0) {
  console.error(`\n💀 QUALITY GATE FAILED: ${failedSlides.length}/${slideScores.length} slide(s) below ${threshold}`)
  console.error(`   These slides MUST be redesigned before screenshots can be taken.\n`)
  process.exit(1)
}

if (failedSlides.length === 0) {
  console.log(`\n✅ ALL SLIDES PASSED (${avgScore}/100 average, grade ${grade})\n`)
}
