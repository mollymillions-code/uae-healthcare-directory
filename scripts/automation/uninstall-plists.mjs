#!/usr/bin/env node

/**
 * Uninstall macOS launchd plists — stops all automation.
 */

import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

const HOME = process.env.HOME;
const LAUNCH_AGENTS = join(HOME, 'Library', 'LaunchAgents');

const labels = [
  'ai.zavis.weekly-pipeline',
  'ai.zavis.daily-morning',
  'ai.zavis.daily-afternoon',
  'ai.zavis.friday-review',
];

console.log('Uninstalling launchd plists...\n');

for (const label of labels) {
  const plistPath = join(LAUNCH_AGENTS, `${label}.plist`);

  if (existsSync(plistPath)) {
    try { execSync(`launchctl unload "${plistPath}" 2>/dev/null`, { stdio: 'pipe' }); } catch { /* ignore */ }
    unlinkSync(plistPath);
    console.log(`  [OK] Removed ${label}`);
  } else {
    console.log(`  [SKIP] ${label} — not found`);
  }
}

console.log('\nAll automation schedules stopped and removed.');
