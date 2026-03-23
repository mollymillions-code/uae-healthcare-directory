/**
 * Quality gates for automated report approval and post validation.
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { CONFIG, PROJECT_ROOT } from './config.mjs';

// ── Report Quality Gate ─────────────────────────────────────────────

/**
 * Run slide quality scoring and determine if report passes auto-approval.
 *
 * @param {string} reportSlug
 * @returns {{ passed: boolean, avgScore: number, slideCount: number, failedSlides: number, details: object }}
 */
export function evaluateReportQuality(reportSlug) {
  const scorePath = join(PROJECT_ROOT, 'data', 'reports', reportSlug, 'quality-score.json');

  // Run score-slides.mjs (it writes quality-score.json)
  try {
    execSync(
      `node scripts/score-slides.mjs ${reportSlug}`,
      { cwd: PROJECT_ROOT, stdio: 'pipe', timeout: CONFIG.timeouts.qualityGate }
    );
  } catch (e) {
    return {
      passed: false,
      avgScore: 0,
      slideCount: 0,
      failedSlides: 0,
      details: { error: `Score script failed: ${e.message}` },
    };
  }

  if (!existsSync(scorePath)) {
    return {
      passed: false,
      avgScore: 0,
      slideCount: 0,
      failedSlides: 0,
      details: { error: 'quality-score.json not found after scoring' },
    };
  }

  const scoreData = JSON.parse(readFileSync(scorePath, 'utf8'));
  const slides = scoreData.slides || [];
  const avgScore = scoreData.averageScore || 0;
  const failedSlides = slides.filter(s => s.composite < CONFIG.quality.slideMinScore).length;

  const passed = avgScore >= CONFIG.quality.reportScoreThreshold && failedSlides === 0;

  return {
    passed,
    avgScore,
    slideCount: slides.length,
    failedSlides,
    details: scoreData,
  };
}

// ── Post Content Quality Gate ───────────────────────────────────────

/**
 * Validate LinkedIn post content before posting.
 *
 * @param {string} content - Post text
 * @param {string} mediaType - 'image' or 'video'
 * @param {string[]} mediaPaths - Paths to attached media
 * @returns {{ passed: boolean, issues: string[] }}
 */
export function validatePostContent(content, mediaType, mediaPaths = []) {
  const issues = [];

  if (!content || content.trim().length === 0) {
    issues.push('Content is empty');
    return { passed: false, issues };
  }

  // Length checks
  if (content.length > CONFIG.quality.postMaxLength) {
    issues.push(`Over ${CONFIG.quality.postMaxLength} characters (${content.length})`);
  }
  if (content.length < CONFIG.quality.postMinLength) {
    issues.push(`Under ${CONFIG.quality.postMinLength} characters (${content.length})`);
  }

  // AI writing pattern detection
  if (content.includes('\u2014')) issues.push('Contains em dashes (\u2014)');
  if (/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}]/u.test(content)) {
    issues.push('Contains emojis');
  }

  // First line check
  const firstLine = content.split('\n')[0].trim();
  if (firstLine.endsWith('?')) issues.push('First line is a question (weak hook)');

  // Hashtag count
  const hashtags = content.match(/#\w+/g) || [];
  if (hashtags.length < CONFIG.quality.hashtagMin) {
    issues.push(`Only ${hashtags.length} hashtags (minimum ${CONFIG.quality.hashtagMin})`);
  }
  if (hashtags.length > CONFIG.quality.hashtagMax) {
    issues.push(`${hashtags.length} hashtags (maximum ${CONFIG.quality.hashtagMax})`);
  }

  // Media checks
  if (mediaType === 'image' && mediaPaths.length === 0) {
    issues.push('No images attached for image post');
  }
  if (mediaType === 'video' && mediaPaths.length === 0) {
    issues.push('No video file for video post');
  }

  // Common AI patterns
  if (/\bdelve\b/i.test(content)) issues.push('Contains "delve" (AI pattern)');
  if (/\blandscape\b/i.test(content) && /\beverchanging\b|\bever-changing\b/i.test(content)) {
    issues.push('Contains "ever-changing landscape" (AI cliche)');
  }

  return { passed: issues.length === 0, issues };
}
