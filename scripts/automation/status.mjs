#!/usr/bin/env node

/**
 * Show current automation status in terminal.
 */

import { getDb, getLatestPublishedReport, getPendingPostCount } from './lib/db.mjs';
import { isLocked } from './lib/lock.mjs';
import { existsSync } from 'fs';
import { join } from 'path';

async function status() {
  const sql = getDb();

  console.log('\n========================================');
  console.log('  Zavis Automation Status');
  console.log('========================================\n');

  // Schedules
  const schedules = await sql`SELECT * FROM automation_schedules ORDER BY id`;
  console.log('SCHEDULES:');
  for (const s of schedules) {
    const icon = s.enabled ? (s.status === 'running' ? '\u25B6' : '\u2713') : '\u275A\u275A';
    console.log(`  ${icon} ${s.schedule_type.padEnd(20)} ${s.status.padEnd(10)} ${s.enabled ? 'enabled' : 'PAUSED'}`);
    if (s.last_run_at) console.log(`    Last run: ${new Date(s.last_run_at).toLocaleString()}`);
  }

  // Latest report
  console.log('\nLATEST REPORT:');
  const report = await getLatestPublishedReport();
  if (report) {
    console.log(`  ${report.report_title}`);
    console.log(`  Slug: ${report.report_slug}`);
    console.log(`  Published: ${new Date(report.published_at).toLocaleString()}`);
    const pending = await getPendingPostCount(report.report_slug);
    console.log(`  Posts remaining: ${pending}`);
  } else {
    console.log('  No published reports');
  }

  // Locks
  console.log('\nLOCKS:');
  for (const mode of ['weekly', 'daily', 'review', 'health']) {
    console.log(`  ${mode}: ${isLocked(mode) ? 'LOCKED' : 'free'}`);
  }

  // Recent runs
  const runs = await sql`SELECT run_type, status, started_at, completed_at FROM automation_runs ORDER BY created_at DESC LIMIT 5`;
  console.log('\nRECENT RUNS:');
  for (const r of runs) {
    const duration = r.completed_at ? `${((new Date(r.completed_at) - new Date(r.started_at)) / 1000 / 60).toFixed(1)} min` : 'in progress';
    console.log(`  ${r.run_type.padEnd(20)} ${r.status.padEnd(12)} ${new Date(r.started_at).toLocaleString()} (${duration})`);
  }

  // Notifications
  const unread = await sql`SELECT COUNT(*)::int as count FROM automation_notifications WHERE read = false`;
  console.log(`\nUNREAD NOTIFICATIONS: ${unread[0].count}`);

  // Plist status
  console.log('\nLAUNCHD PLISTS:');
  const home = process.env.HOME;
  const labels = ['ai.zavis.weekly-pipeline', 'ai.zavis.daily-morning', 'ai.zavis.daily-afternoon', 'ai.zavis.friday-review'];
  for (const label of labels) {
    const path = join(home, 'Library', 'LaunchAgents', `${label}.plist`);
    console.log(`  ${label}: ${existsSync(path) ? 'installed' : 'NOT installed'}`);
  }

  console.log('');
}

status().catch(err => {
  console.error('Status check failed:', err.message);
  process.exit(1);
});
