/**
 * Automation system configuration.
 * Central place for all tunables — timezones, thresholds, integration IDs.
 */

import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const PROJECT_ROOT = join(__dirname, '..', '..', '..');

export const CONFIG = {
  // ── Postiz Integration IDs (non-secret, env overrides supported) ─
  integrations: {
    HIDAYAT_LINKEDIN: process.env.POSTIZ_HIDAYAT_LINKEDIN_ID || 'cmmxtchdd0001u36fkx2nb7h2',
    ZAVIS_FACEBOOK: process.env.POSTIZ_ZAVIS_FACEBOOK_ID || 'cmmk8a7k80001oi77q7624t0t',
  },

  // ── Posting schedule (UAE time = UTC+4) ─────────────────────────
  posting: {
    morningHourUAE: 9,   // 9:30 AM UAE
    morningMinuteUAE: 30,
    afternoonHourUAE: 13, // 1:30 PM UAE
    afternoonMinuteUAE: 30,
    defaultIntegration: 'HIDAYAT_LINKEDIN',
    defaultAccount: 'founder',
  },

  // ── Quality thresholds ──────────────────────────────────────────
  quality: {
    reportScoreThreshold: 75,      // minimum avg slide score to auto-approve
    slideMinScore: 50,             // any slide below this fails the report
    postMinLength: 200,
    postMaxLength: 3000,
    hashtagMin: 3,
    hashtagMax: 5,
  },

  // ── Post queue ──────────────────────────────────────────────────
  postQueue: {
    totalBriefs: 12,               // target briefs per report (2/day x 6 days)
    videoPercentage: 0.3,          // 30% video, 70% image
    postsPerDay: 2,
  },

  // ── Timeouts (ms) ──────────────────────────────────────────────
  timeouts: {
    topicSelection: 5 * 60 * 1000,     // 5 min
    research: 10 * 60 * 1000,          // 10 min
    synthesis: 5 * 60 * 1000,           // 5 min
    architecture: 10 * 60 * 1000,       // 10 min
    rendering: 15 * 60 * 1000,          // 15 min
    qualityGate: 2 * 60 * 1000,         // 2 min
    postSeeding: 5 * 60 * 1000,         // 5 min
    postCompose: 3 * 60 * 1000,         // 3 min
    voiceover: 5 * 60 * 1000,           // 5 min
    videoRender: 10 * 60 * 1000,        // 10 min
    metricsCollection: 5 * 60 * 1000,   // 5 min
  },

  // ── Lock files ─────────────────────────────────────────────────
  locks: {
    dir: '/tmp',
    weeklyMaxAge: 4 * 60 * 60 * 1000,   // 4 hours
    dailyMaxAge: 30 * 60 * 1000,          // 30 min
    reviewMaxAge: 60 * 60 * 1000,         // 1 hour
  },

  // ── API base URLs ─────────────────────────────────────────────
  api: {
    local: 'http://localhost:3000',
    postiz: 'http://localhost:4007',
  },

  // ── Paths ─────────────────────────────────────────────────────
  paths: {
    logs: join(PROJECT_ROOT, 'logs'),
    reports: join(PROJECT_ROOT, 'data', 'reports'),
    references: join(PROJECT_ROOT, 'references'),
  },
};
