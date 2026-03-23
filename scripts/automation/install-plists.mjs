#!/usr/bin/env node

/**
 * Install macOS launchd plists for automation scheduling.
 * Creates plist files in ~/Library/LaunchAgents/ and optionally loads them.
 *
 * Usage:
 *   node scripts/automation/install-plists.mjs         # install only
 *   node scripts/automation/install-plists.mjs --load   # install and activate
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';
import { PROJECT_ROOT } from './lib/config.mjs';

const HOME = process.env.HOME;
const LAUNCH_AGENTS = join(HOME, 'Library', 'LaunchAgents');
const NODE_PATH = execSync('which node', { stdio: 'pipe' }).toString().trim();
const ORCHESTRATOR = join(PROJECT_ROOT, 'scripts', 'automation', 'orchestrator.mjs');
const LOGS_DIR = join(PROJECT_ROOT, 'logs');

if (!existsSync(LAUNCH_AGENTS)) mkdirSync(LAUNCH_AGENTS, { recursive: true });
if (!existsSync(LOGS_DIR)) mkdirSync(LOGS_DIR, { recursive: true });

function createPlist(label, args, calendar) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${label}</string>
  <key>ProgramArguments</key>
  <array>
    <string>${NODE_PATH}</string>
    <string>${ORCHESTRATOR}</string>
${args.map(a => `    <string>${a}</string>`).join('\n')}
  </array>
  <key>StartCalendarInterval</key>
  ${calendar}
  <key>WorkingDirectory</key>
  <string>${PROJECT_ROOT}</string>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key>
    <string>/usr/local/bin:/usr/bin:/bin:${join(HOME, '.local', 'bin')}</string>
    <key>NODE_ENV</key>
    <string>production</string>
  </dict>
  <key>StandardOutPath</key>
  <string>${LOGS_DIR}/${label.split('.').pop()}.log</string>
  <key>StandardErrorPath</key>
  <string>${LOGS_DIR}/${label.split('.').pop()}-error.log</string>
  <key>RunAtLoad</key>
  <false/>
</dict>
</plist>`;
}

const plists = [
  {
    label: 'ai.zavis.weekly-pipeline',
    args: ['--mode', 'weekly'],
    calendar: `<dict>
    <key>Weekday</key>
    <integer>1</integer>
    <key>Hour</key>
    <integer>4</integer>
    <key>Minute</key>
    <integer>0</integer>
  </dict>`,
  },
  {
    label: 'ai.zavis.daily-morning',
    args: ['--mode', 'daily', '--slot', 'morning'],
    calendar: `<dict>
    <key>Hour</key>
    <integer>11</integer>
    <key>Minute</key>
    <integer>0</integer>
  </dict>`,
  },
  {
    label: 'ai.zavis.daily-afternoon',
    args: ['--mode', 'daily', '--slot', 'afternoon'],
    calendar: `<dict>
    <key>Hour</key>
    <integer>15</integer>
    <key>Minute</key>
    <integer>0</integer>
  </dict>`,
  },
  {
    label: 'ai.zavis.friday-review',
    args: ['--mode', 'review'],
    calendar: `<dict>
    <key>Weekday</key>
    <integer>5</integer>
    <key>Hour</key>
    <integer>18</integer>
    <key>Minute</key>
    <integer>0</integer>
  </dict>`,
  },
];

console.log('Installing launchd plists...\n');

for (const p of plists) {
  const plistPath = join(LAUNCH_AGENTS, `${p.label}.plist`);
  const content = createPlist(p.label, p.args, p.calendar);

  // Unload if already loaded
  try { execSync(`launchctl unload "${plistPath}" 2>/dev/null`, { stdio: 'pipe' }); } catch { /* ignore */ }

  writeFileSync(plistPath, content);
  console.log(`  [OK] ${p.label} → ${plistPath}`);

  if (process.argv.includes('--load')) {
    try {
      execSync(`launchctl load "${plistPath}"`, { stdio: 'pipe' });
      console.log(`       Loaded into launchd`);
    } catch (e) {
      console.error(`       Failed to load: ${e.message}`);
    }
  }
}

console.log('\nInstallation complete.');
if (!process.argv.includes('--load')) {
  console.log('Run with --load to activate, or use: npm run auto:start');
}
