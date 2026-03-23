#!/usr/bin/env node

/**
 * Zavis Automation Orchestrator
 *
 * Entry point for all automated tasks. Dispatches to mode-specific scripts.
 *
 * Usage:
 *   node scripts/automation/orchestrator.mjs --mode weekly
 *   node scripts/automation/orchestrator.mjs --mode daily --slot morning
 *   node scripts/automation/orchestrator.mjs --mode daily --slot afternoon
 *   node scripts/automation/orchestrator.mjs --mode review
 *   node scripts/automation/orchestrator.mjs --mode health
 */

import { getDb, updateSchedule } from './lib/db.mjs';
import { acquireLock, releaseLock } from './lib/lock.mjs';
import { notify } from './lib/notifications.mjs';
import crypto from 'crypto';

// ── Parse arguments ────────────────────────────────────────────────

const args = process.argv.slice(2);
const modeIdx = args.indexOf('--mode');
const slotIdx = args.indexOf('--slot');
const mode = modeIdx !== -1 ? args[modeIdx + 1] : null;
const slot = slotIdx !== -1 ? args[slotIdx + 1] : 'morning';

if (!mode || !['weekly', 'daily', 'review', 'health'].includes(mode)) {
  console.error('Usage: orchestrator.mjs --mode <weekly|daily|review|health> [--slot <morning|afternoon>]');
  process.exit(1);
}

// ── Map mode to schedule ID ────────────────────────────────────────

const SCHEDULE_MAP = {
  weekly: 'weekly_pipeline',
  daily: 'daily_posts',
  review: 'friday_review',
  health: 'health_check',
};

// ── Main ───────────────────────────────────────────────────────────

async function main() {
  const scheduleId = SCHEDULE_MAP[mode];
  const sql = getDb();

  console.log(`\n========================================`);
  console.log(`  Zavis Automation — ${mode.toUpperCase()}`);
  console.log(`  ${new Date().toISOString()}`);
  console.log(`========================================\n`);

  // 1. Check if schedule is enabled
  const schedules = await sql`SELECT * FROM automation_schedules WHERE id = ${scheduleId}`;
  if (schedules.length > 0 && !schedules[0].enabled) {
    console.log(`Schedule "${scheduleId}" is PAUSED. Exiting.`);
    return;
  }

  // 2. Acquire lock
  if (!acquireLock(mode)) {
    console.error(`Another ${mode} run is already in progress. Exiting.`);
    return;
  }

  // 3. Create automation_runs record
  const runId = crypto.randomUUID();

  try {
    await sql`
      INSERT INTO automation_runs (id, schedule_id, run_type, status, started_at)
      VALUES (${runId}, ${scheduleId}, ${SCHEDULE_MAP[mode]}, 'started', NOW())
    `;

    await updateSchedule(scheduleId, {
      status: 'running',
      lastRunAt: true,
      currentRunId: runId,
    });

    // 4. Dispatch to mode-specific handler
    let handler;
    switch (mode) {
      case 'weekly':
        handler = await import('./weekly-pipeline.mjs');
        break;
      case 'daily':
        handler = await import('./daily-distributor.mjs');
        break;
      case 'review':
        handler = await import('./improvement-loop.mjs');
        break;
      case 'health':
        handler = await import('./health-check.mjs');
        break;
    }

    await handler.run(runId, { slot, scheduleId });

    // 5. Mark completed
    await sql`UPDATE automation_runs SET status = 'completed', completed_at = NOW() WHERE id = ${runId}`;
    await updateSchedule(scheduleId, { status: 'idle', currentRunId: null });

    console.log(`\n[DONE] ${mode} completed successfully.`);

  } catch (err) {
    console.error(`\n[FATAL] ${mode} failed:`, err.message);

    // Mark failed
    try {
      await sql`UPDATE automation_runs SET status = 'failed', error_message = ${err.message}, completed_at = NOW() WHERE id = ${runId}`;
      await updateSchedule(scheduleId, { status: 'failed', currentRunId: null });
      await notify({
        title: `${mode} pipeline failed`,
        message: err.message,
        severity: 'error',
        automationRunId: runId,
      });
    } catch { /* ignore notification errors */ }

    process.exitCode = 1;

  } finally {
    releaseLock(mode);
  }
}

main();
