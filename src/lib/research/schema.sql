-- Zavis Research Platform — Unified Schema
-- Run against NeonDB to initialize

-- ============================================================
-- PIPELINE RUNS — tracks each research-to-publish cycle
-- ============================================================
CREATE TABLE IF NOT EXISTS pipeline_runs (
  id TEXT PRIMARY KEY,
  topic TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'research'
    CHECK (status IN ('research','synthesis','rendering','review','approved','publishing','published','distributing','complete','failed')),

  -- Research phase
  research_plan JSONB,
  research_findings JSONB,
  synthesis JSONB,

  -- Report phase
  report_html TEXT,
  report_slug TEXT UNIQUE,
  report_title TEXT,
  report_description TEXT,
  report_category TEXT DEFAULT 'Business',
  report_thumbnail TEXT,
  report_read_time TEXT DEFAULT '30 min read',

  -- SEO
  meta_title TEXT,
  meta_description TEXT,
  og_image TEXT,

  -- Pipeline metadata
  source TEXT DEFAULT 'manual',
  triggered_by TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pipeline_status ON pipeline_runs(status);
CREATE INDEX IF NOT EXISTS idx_pipeline_created ON pipeline_runs(created_at DESC);

-- ============================================================
-- PIPELINE COMMENTS — feedback at any stage
-- ============================================================
CREATE TABLE IF NOT EXISTS pipeline_comments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  run_id TEXT NOT NULL REFERENCES pipeline_runs(id) ON DELETE CASCADE,
  stage TEXT NOT NULL,
  author TEXT NOT NULL DEFAULT 'reviewer',
  content TEXT NOT NULL,
  resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_run ON pipeline_comments(run_id);

-- ============================================================
-- LINKEDIN POSTS — drafts, approved, scheduled, posted
-- ============================================================
CREATE TABLE IF NOT EXISTS linkedin_posts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  run_id TEXT REFERENCES pipeline_runs(id) ON DELETE SET NULL,
  account TEXT NOT NULL CHECK (account IN ('founder','company')),
  content TEXT NOT NULL,
  first_comment TEXT,
  hashtags TEXT[],
  assets TEXT[], -- file paths or URLs
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','approved','scheduled','posted','failed')),
  postiz_post_id TEXT,
  scheduled_for TIMESTAMPTZ,
  posted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_posts_status ON linkedin_posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_run ON linkedin_posts(run_id);

-- ============================================================
-- EMAIL BLASTS — drafts, approved, sent
-- ============================================================
CREATE TABLE IF NOT EXISTS email_blasts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  run_id TEXT REFERENCES pipeline_runs(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  preview_text TEXT,
  body_html TEXT NOT NULL,
  body_text TEXT,
  segment TEXT DEFAULT 'all',
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','approved','sending','sent','failed')),
  sent_at TIMESTAMPTZ,
  send_count INTEGER DEFAULT 0,
  open_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_emails_status ON email_blasts(status);
CREATE INDEX IF NOT EXISTS idx_emails_run ON email_blasts(run_id);

-- ============================================================
-- PERFORMANCE SCORES — post-publish metrics
-- ============================================================
CREATE TABLE IF NOT EXISTS performance_scores (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  run_id TEXT NOT NULL REFERENCES pipeline_runs(id) ON DELETE CASCADE,
  composite_score NUMERIC(5,2),
  breakdown JSONB NOT NULL DEFAULT '{}',
  linkedin_metrics JSONB DEFAULT '{}',
  website_metrics JSONB DEFAULT '{}',
  email_metrics JSONB DEFAULT '{}',
  search_metrics JSONB DEFAULT '{}',
  collected_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scores_run ON performance_scores(run_id);
CREATE INDEX IF NOT EXISTS idx_scores_composite ON performance_scores(composite_score DESC);

-- ============================================================
-- AUTO-UPDATE TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS pipeline_runs_updated ON pipeline_runs;
CREATE TRIGGER pipeline_runs_updated
  BEFORE UPDATE ON pipeline_runs FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS linkedin_posts_updated ON linkedin_posts;
CREATE TRIGGER linkedin_posts_updated
  BEFORE UPDATE ON linkedin_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS email_blasts_updated ON email_blasts;
CREATE TRIGGER email_blasts_updated
  BEFORE UPDATE ON email_blasts FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- AUTOMATION SCHEDULES — tracks each scheduled job
-- ============================================================
CREATE TABLE IF NOT EXISTS automation_schedules (
  id TEXT PRIMARY KEY,
  schedule_type TEXT NOT NULL
    CHECK (schedule_type IN ('weekly_pipeline','daily_posts','friday_review','health_check')),
  status TEXT NOT NULL DEFAULT 'idle'
    CHECK (status IN ('idle','running','completed','failed','paused')),
  cron_expression TEXT,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  current_run_id TEXT,
  config JSONB DEFAULT '{}',
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- AUTOMATION RUNS — each execution with full stage log
-- ============================================================
CREATE TABLE IF NOT EXISTS automation_runs (
  id TEXT PRIMARY KEY,
  schedule_id TEXT NOT NULL REFERENCES automation_schedules(id),
  run_type TEXT NOT NULL
    CHECK (run_type IN ('weekly_pipeline','daily_posts','friday_review','health_check')),
  status TEXT NOT NULL DEFAULT 'started'
    CHECK (status IN ('started','stage_topic','stage_research','stage_synthesis','stage_architecture','stage_render','stage_quality_gate','stage_publish','stage_deploy','stage_seed_posts','stage_compose','stage_assets','stage_post','stage_collect','stage_score','stage_analyze','stage_recommend','completed','failed','needs_human')),
  current_stage TEXT,
  pipeline_run_id TEXT REFERENCES pipeline_runs(id),
  topic TEXT,
  report_slug TEXT,
  stage_log JSONB DEFAULT '[]',
  error_message TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auto_runs_schedule ON automation_runs(schedule_id);
CREATE INDEX IF NOT EXISTS idx_auto_runs_status ON automation_runs(status);
CREATE INDEX IF NOT EXISTS idx_auto_runs_created ON automation_runs(created_at DESC);

-- ============================================================
-- POST QUEUE — briefs seeded per report, consumed 2/day
-- ============================================================
CREATE TABLE IF NOT EXISTS post_queue (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  automation_run_id TEXT REFERENCES automation_runs(id),
  run_id TEXT REFERENCES pipeline_runs(id) ON DELETE SET NULL,
  report_slug TEXT NOT NULL,
  post_number INTEGER NOT NULL,
  total_posts INTEGER NOT NULL,
  media_type TEXT NOT NULL DEFAULT 'image'
    CHECK (media_type IN ('image','video')),
  angle TEXT NOT NULL DEFAULT 'headline_stat',
  brief JSONB DEFAULT '{}',
  content TEXT,
  slide_indices INTEGER[],
  video_path TEXT,
  image_paths TEXT[],
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','content_ready','assets_ready','posting','posted','failed','skipped')),
  linkedin_post_id TEXT,
  scheduled_for TIMESTAMPTZ,
  posted_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_post_queue_status ON post_queue(status);
CREATE INDEX IF NOT EXISTS idx_post_queue_scheduled ON post_queue(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_post_queue_report ON post_queue(report_slug);

-- ============================================================
-- AUTOMATION NOTIFICATIONS — in-app notifications
-- ============================================================
CREATE TABLE IF NOT EXISTS automation_notifications (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  automation_run_id TEXT REFERENCES automation_runs(id),
  severity TEXT NOT NULL DEFAULT 'info'
    CHECK (severity IN ('info','warning','error','action_required')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auto_notif_read ON automation_notifications(read);
CREATE INDEX IF NOT EXISTS idx_auto_notif_created ON automation_notifications(created_at DESC);

-- ============================================================
-- PERFORMANCE INSIGHTS — learned patterns from improvement loop
-- ============================================================
CREATE TABLE IF NOT EXISTS performance_insights (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  week_start DATE NOT NULL,
  report_slug TEXT,
  pipeline_run_id TEXT REFERENCES pipeline_runs(id),
  topic_scores JSONB DEFAULT '{}',
  angle_scores JSONB DEFAULT '{}',
  timing_scores JSONB DEFAULT '{}',
  content_patterns JSONB DEFAULT '{}',
  recommendations JSONB DEFAULT '{}',
  raw_metrics JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_insights_week ON performance_insights(week_start DESC);

-- ── Automation triggers ─────────────────────────────────────────────
DROP TRIGGER IF EXISTS automation_schedules_updated ON automation_schedules;
CREATE TRIGGER automation_schedules_updated
  BEFORE UPDATE ON automation_schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS post_queue_updated ON post_queue;
CREATE TRIGGER post_queue_updated
  BEFORE UPDATE ON post_queue FOR EACH ROW EXECUTE FUNCTION update_updated_at();
