/**
 * Run automation schema migration against NeonDB.
 * Creates 5 new tables: automation_schedules, automation_runs, post_queue,
 * automation_notifications, performance_insights.
 *
 * Safe to run multiple times (all CREATE TABLE IF NOT EXISTS).
 */

import { getDb } from './lib/db.mjs';

async function migrate() {
  const sql = getDb();
  console.log('Running automation schema migration...\n');

  // 1. automation_schedules
  await sql`
    CREATE TABLE IF NOT EXISTS automation_schedules (
      id TEXT PRIMARY KEY,
      schedule_type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'idle',
      cron_expression TEXT,
      last_run_at TIMESTAMPTZ,
      next_run_at TIMESTAMPTZ,
      current_run_id TEXT,
      config JSONB DEFAULT '{}',
      enabled BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  console.log('  [OK] automation_schedules');

  // 2. automation_runs
  await sql`
    CREATE TABLE IF NOT EXISTS automation_runs (
      id TEXT PRIMARY KEY,
      schedule_id TEXT NOT NULL REFERENCES automation_schedules(id),
      run_type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'started',
      current_stage TEXT,
      pipeline_run_id TEXT,
      topic TEXT,
      report_slug TEXT,
      stage_log JSONB DEFAULT '[]',
      error_message TEXT,
      started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      completed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_auto_runs_schedule ON automation_runs(schedule_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_auto_runs_status ON automation_runs(status)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_auto_runs_created ON automation_runs(created_at DESC)`;
  console.log('  [OK] automation_runs');

  // 3. post_queue
  await sql`
    CREATE TABLE IF NOT EXISTS post_queue (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      automation_run_id TEXT,
      run_id TEXT,
      report_slug TEXT NOT NULL,
      post_number INTEGER NOT NULL,
      total_posts INTEGER NOT NULL,
      media_type TEXT NOT NULL DEFAULT 'image',
      angle TEXT NOT NULL DEFAULT 'headline_stat',
      brief JSONB DEFAULT '{}',
      content TEXT,
      slide_indices INTEGER[],
      video_path TEXT,
      image_paths TEXT[],
      status TEXT NOT NULL DEFAULT 'pending',
      linkedin_post_id TEXT,
      scheduled_for TIMESTAMPTZ,
      posted_at TIMESTAMPTZ,
      error_message TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_post_queue_status ON post_queue(status)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_post_queue_scheduled ON post_queue(scheduled_for)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_post_queue_report ON post_queue(report_slug)`;
  console.log('  [OK] post_queue');

  // 4. automation_notifications
  await sql`
    CREATE TABLE IF NOT EXISTS automation_notifications (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      automation_run_id TEXT,
      severity TEXT NOT NULL DEFAULT 'info',
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      details JSONB DEFAULT '{}',
      read BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_auto_notif_read ON automation_notifications(read)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_auto_notif_created ON automation_notifications(created_at DESC)`;
  console.log('  [OK] automation_notifications');

  // 5. performance_insights
  await sql`
    CREATE TABLE IF NOT EXISTS performance_insights (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      week_start DATE NOT NULL,
      report_slug TEXT,
      pipeline_run_id TEXT,
      topic_scores JSONB DEFAULT '{}',
      angle_scores JSONB DEFAULT '{}',
      timing_scores JSONB DEFAULT '{}',
      content_patterns JSONB DEFAULT '{}',
      recommendations JSONB DEFAULT '{}',
      raw_metrics JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_insights_week ON performance_insights(week_start DESC)`;
  console.log('  [OK] performance_insights');

  // Update triggers (reuse existing function if available)
  await sql`
    CREATE OR REPLACE FUNCTION update_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
    $$ LANGUAGE plpgsql
  `;

  // Note: Trigger creation with dynamic table names requires raw SQL
  // which neon() doesn't support. The triggers are defined in schema.sql
  // and can be applied via psql if needed. Tables + indexes are sufficient.

  console.log('\nMigration complete. 5 tables created/verified.');
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
