/**
 * Direct NeonDB connection for automation scripts.
 * Reads DATABASE_URL from .env.local.
 */

import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { join } from 'path';
import { PROJECT_ROOT } from './config.mjs';

let _sql = null;

function loadEnv() {
  const envPath = join(PROJECT_ROOT, '.env.local');
  try {
    const content = readFileSync(envPath, 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex === -1) continue;
      const key = trimmed.slice(0, eqIndex).trim();
      let val = trimmed.slice(eqIndex + 1).trim();
      // Strip surrounding quotes
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  } catch {
    // .env.local not found — rely on environment variables
  }
}

export function getDb() {
  if (!_sql) {
    loadEnv();
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is not set. Check .env.local');
    }
    _sql = neon(process.env.DATABASE_URL);
  }
  return _sql;
}

// ── Helper functions ────────────────────────────────────────────────

export async function updateAutomationRun(runId, updates) {
  const sql = getDb();
  const stageLog = updates.stageLog ? JSON.stringify(updates.stageLog) : undefined;

  if (updates.status) {
    await sql`UPDATE automation_runs SET status = ${updates.status}, current_stage = ${updates.currentStage || null} WHERE id = ${runId}`;
  }
  if (stageLog) {
    await sql`UPDATE automation_runs SET stage_log = ${stageLog}::jsonb WHERE id = ${runId}`;
  }
  if (updates.errorMessage) {
    await sql`UPDATE automation_runs SET error_message = ${updates.errorMessage} WHERE id = ${runId}`;
  }
  if (updates.pipelineRunId) {
    await sql`UPDATE automation_runs SET pipeline_run_id = ${updates.pipelineRunId} WHERE id = ${runId}`;
  }
  if (updates.topic) {
    await sql`UPDATE automation_runs SET topic = ${updates.topic} WHERE id = ${runId}`;
  }
  if (updates.reportSlug) {
    await sql`UPDATE automation_runs SET report_slug = ${updates.reportSlug} WHERE id = ${runId}`;
  }
  if (updates.completed) {
    await sql`UPDATE automation_runs SET status = 'completed', completed_at = NOW() WHERE id = ${runId}`;
  }
}

export async function updateSchedule(scheduleId, updates) {
  const sql = getDb();
  if (updates.status) {
    await sql`UPDATE automation_schedules SET status = ${updates.status} WHERE id = ${scheduleId}`;
  }
  if (updates.lastRunAt) {
    await sql`UPDATE automation_schedules SET last_run_at = NOW() WHERE id = ${scheduleId}`;
  }
  if (updates.currentRunId !== undefined) {
    await sql`UPDATE automation_schedules SET current_run_id = ${updates.currentRunId} WHERE id = ${scheduleId}`;
  }
  if (updates.enabled !== undefined) {
    await sql`UPDATE automation_schedules SET enabled = ${updates.enabled} WHERE id = ${scheduleId}`;
  }
}

export async function getLatestPublishedReport() {
  const sql = getDb();
  const rows = await sql`
    SELECT id, topic, report_slug, report_title, published_at
    FROM pipeline_runs
    WHERE status = 'published' OR status = 'distributing' OR status = 'complete'
    ORDER BY published_at DESC LIMIT 1
  `;
  return rows[0] || null;
}

export async function getNextPendingPost(reportSlug) {
  const sql = getDb();
  const rows = await sql`
    SELECT * FROM post_queue
    WHERE report_slug = ${reportSlug} AND status = 'pending'
    ORDER BY post_number ASC LIMIT 1
  `;
  return rows[0] || null;
}

export async function getPendingPostCount(reportSlug) {
  const sql = getDb();
  const rows = await sql`
    SELECT COUNT(*)::int as count FROM post_queue
    WHERE report_slug = ${reportSlug} AND status = 'pending'
  `;
  return rows[0]?.count || 0;
}
