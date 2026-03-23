/**
 * Health Check — verifies all automation infrastructure is operational.
 * Runs every 6 hours. Auto-pauses schedules if critical systems are down.
 */

import { execSync } from 'child_process';
import { getDb, updateSchedule, getPendingPostCount, getLatestPublishedReport } from './lib/db.mjs';
import { notify } from './lib/notifications.mjs';
import { isLocked } from './lib/lock.mjs';
import { CONFIG, PROJECT_ROOT } from './lib/config.mjs';

async function check(name, fn) {
  try {
    const result = await fn();
    console.log(`  [OK] ${name}${result ? ': ' + result : ''}`);
    return { name, status: 'ok', detail: result };
  } catch (e) {
    console.error(`  [FAIL] ${name}: ${e.message}`);
    return { name, status: 'fail', error: e.message };
  }
}

export async function run(runId) {
  console.log('Running health checks...\n');
  const results = [];

  // 1. NeonDB connectivity
  results.push(await check('NeonDB', async () => {
    const sql = getDb();
    const rows = await sql`SELECT COUNT(*)::int as count FROM automation_schedules`;
    return `${rows[0].count} schedules found`;
  }));

  // 2. Postiz availability
  results.push(await check('Postiz', async () => {
    const res = await fetch(`${CONFIG.api.postiz}/api/posts`, {
      signal: AbortSignal.timeout(5000),
    }).catch(() => null);
    if (!res) throw new Error('Postiz unreachable at localhost:4007');
    return `Status ${res.status}`;
  }));

  // 3. Claude CLI
  results.push(await check('Claude CLI', async () => {
    const output = execSync('claude --version', { timeout: 10000, stdio: 'pipe' }).toString().trim();
    return output;
  }));

  // 4. Next.js dev server
  results.push(await check('Next.js', async () => {
    const res = await fetch(`${CONFIG.api.local}/api/pipeline/runs?limit=1`, {
      signal: AbortSignal.timeout(5000),
    }).catch(() => null);
    if (!res) throw new Error('Next.js unreachable at localhost:3000');
    return `Status ${res.status}`;
  }));

  // 5. Post queue depth
  results.push(await check('Post Queue', async () => {
    const report = await getLatestPublishedReport();
    if (!report) return 'No published reports';
    const count = await getPendingPostCount(report.report_slug);
    if (count < 2) throw new Error(`Only ${count} pending posts — queue nearly empty`);
    return `${count} pending posts for ${report.report_slug}`;
  }));

  // 6. Stale locks
  results.push(await check('Locks', async () => {
    const modes = ['weekly', 'daily', 'review', 'health'];
    const stale = modes.filter(m => isLocked(m));
    if (stale.length > 0) throw new Error(`Active locks: ${stale.join(', ')}`);
    return 'No stale locks';
  }));

  // 7. Disk space
  results.push(await check('Disk', async () => {
    const output = execSync(`df -h "${PROJECT_ROOT}" | tail -1`, { stdio: 'pipe' }).toString().trim();
    const parts = output.split(/\s+/);
    const usePct = parseInt(parts[4]);
    if (usePct > 90) throw new Error(`Disk ${usePct}% full`);
    return `${parts[3]} available (${parts[4]} used)`;
  }));

  // ── Evaluate results ──────────────────────────────────────────────

  const failed = results.filter(r => r.status === 'fail');
  const critical = failed.filter(r => ['NeonDB', 'Claude CLI'].includes(r.name));

  console.log(`\n${results.length} checks: ${results.length - failed.length} passed, ${failed.length} failed`);

  if (critical.length > 0) {
    console.error('\nCRITICAL failures detected — pausing all schedules');

    const sql = getDb();
    for (const sched of ['weekly_pipeline', 'daily_posts', 'friday_review']) {
      await updateSchedule(sched, { enabled: false });
    }

    await notify({
      title: 'Automation PAUSED — critical failure',
      message: `${critical.map(c => `${c.name}: ${c.error}`).join('; ')}. All schedules disabled until issue is resolved.`,
      severity: 'error',
      automationRunId: runId,
      details: { results },
    });
  } else if (failed.length > 0) {
    await notify({
      title: `Health check: ${failed.length} warning(s)`,
      message: failed.map(f => `${f.name}: ${f.error}`).join('; '),
      severity: 'warning',
      automationRunId: runId,
      details: { results },
    });
  }

  // Store results in stage_log
  const sql = getDb();
  await sql`UPDATE automation_runs SET stage_log = ${JSON.stringify(results)}::jsonb WHERE id = ${runId}`;
}
