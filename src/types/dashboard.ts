// ============================================================================
// Dashboard Types — Typed interfaces for all dashboard component data
// Based on SQL schema in scripts/db/run-schema.mjs and scripts/automation/migrate.mjs
// ============================================================================

// ---------------------------------------------------------------------------
// Pipeline Runs (pipeline_runs table)
// ---------------------------------------------------------------------------

export type PipelineRunStatus =
  | 'research'
  | 'synthesis'
  | 'rendering'
  | 'review'
  | 'approved'
  | 'publishing'
  | 'published'
  | 'distributing'
  | 'complete'
  | 'failed'

/** Row returned by GET /api/research/pipeline/runs (list view — subset of columns) */
export interface PipelineRunSummary {
  id: string
  topic: string
  status: string
  report_title: string | null
  report_slug: string | null
  report_category: string | null
  source: string
  triggered_by: string | null
  published_at: string | null
  created_at: string
  updated_at: string
}

/** Headline stat within a synthesis object */
export interface HeadlineStat {
  value: string
  label: string
}

/** Synthesis JSONB shape attached to a pipeline run */
export interface PipelineRunSynthesis {
  headline_stats?: HeadlineStat[]
  [key: string]: unknown
}

/** Full pipeline run row returned by GET /api/research/pipeline/runs/:id */
export interface PipelineRunDetail extends PipelineRunSummary {
  research_plan: Record<string, unknown> | null
  research_findings: Record<string, unknown> | null
  synthesis: PipelineRunSynthesis | null
  report_html: string | null
  report_description: string | null
  report_thumbnail: string | null
  report_read_time: string | null
  meta_title: string | null
  meta_description: string | null
  og_image: string | null
}

// ---------------------------------------------------------------------------
// Pipeline Comments (pipeline_comments table)
// ---------------------------------------------------------------------------

export interface PipelineComment {
  id: string
  run_id: string
  stage: string
  author: string
  content: string
  resolved: boolean
  created_at: string
}

// ---------------------------------------------------------------------------
// LinkedIn Posts (linkedin_posts table)
// ---------------------------------------------------------------------------

export interface LinkedInPost {
  id: string
  run_id: string | null
  account: string
  content: string
  first_comment: string | null
  hashtags: string[] | null
  assets: string[] | null
  status: string
  postiz_post_id: string | null
  scheduled_for: string | null
  posted_at: string | null
  created_at: string
  updated_at: string
}

// ---------------------------------------------------------------------------
// Email Blasts (email_blasts table)
// ---------------------------------------------------------------------------

export interface EmailBlast {
  id: string
  run_id: string | null
  subject: string
  preview_text: string | null
  body_html: string
  body_text: string | null
  segment: string
  status: string
  sent_at: string | null
  send_count: number
  open_count: number
  click_count: number
  created_at: string
  updated_at: string
}

// ---------------------------------------------------------------------------
// Performance Scores (performance_scores table)
// ---------------------------------------------------------------------------

export interface PerformanceScore {
  id: string
  run_id: string
  composite_score: number
  breakdown: Record<string, unknown>
  linkedin_metrics: Record<string, unknown>
  website_metrics: Record<string, unknown>
  email_metrics: Record<string, unknown>
  search_metrics: Record<string, unknown>
  collected_at: string
}

// ---------------------------------------------------------------------------
// Pipeline Detail API Response (/api/research/pipeline/runs/:id)
// ---------------------------------------------------------------------------

export interface PipelineRunDetailResponse {
  run: PipelineRunDetail
  comments: PipelineComment[]
  posts: LinkedInPost[]
  emails: EmailBlast[]
  score: PerformanceScore | null
}

// ---------------------------------------------------------------------------
// Analytics: run + score composite used in analytics page
// ---------------------------------------------------------------------------

export interface AnalyticsRun extends PipelineRunSummary {
  score: PerformanceScore | null
}

// ---------------------------------------------------------------------------
// Automation Types (automation tables)
// ---------------------------------------------------------------------------

/** automation_schedules row */
export interface AutomationSchedule {
  id: string
  schedule_type: string
  status: string
  cron_expression: string | null
  last_run_at: string | null
  next_run_at: string | null
  current_run_id: string | null
  config: Record<string, unknown>
  enabled: boolean
  created_at: string
  updated_at: string
}

/** Stage log entry within an automation run */
export interface AutomationStageLogEntry {
  stage: string
  status: string
  duration_ms?: number
  error?: string
  output?: string
}

/** automation_runs row */
export interface AutomationRun {
  id: string
  schedule_id: string
  run_type: string
  status: string
  current_stage: string | null
  pipeline_run_id: string | null
  topic: string | null
  report_slug: string | null
  stage_log: AutomationStageLogEntry[]
  error_message: string | null
  started_at: string
  completed_at: string | null
  created_at: string
}

/** post_queue row */
export interface PostQueueItem {
  id: string
  automation_run_id: string | null
  run_id: string | null
  report_slug: string
  post_number: number
  total_posts: number
  media_type: string
  angle: string
  brief: Record<string, unknown>
  content: string | null
  slide_indices: number[] | null
  video_path: string | null
  image_paths: string[] | null
  status: string
  linkedin_post_id: string | null
  scheduled_for: string | null
  posted_at: string | null
  error_message: string | null
  created_at: string
  updated_at: string
}

/** automation_notifications row */
export interface AutomationNotification {
  id: string
  automation_run_id: string | null
  severity: string
  title: string
  message: string
  details: Record<string, unknown>
  read: boolean
  created_at: string
}

/** Recommendations sub-object within a performance insight (from improvement-loop.mjs) */
export interface PerformanceInsightRecommendations {
  next_topic_category?: string
  adjust_video_ratio?: 'increase' | 'decrease' | 'maintain'
  posting_time_change?: string | null
  content_adjustments?: string[]
}

/** Content pattern analysis from improvement-loop.mjs */
export interface ContentPatterns {
  optimal_length?: number
  video_ratio?: number
  top_hashtags?: string[]
}

/** Timing scores from improvement-loop.mjs */
export interface TimingScores {
  morning?: number
  afternoon?: number
}

/** performance_insights row */
export interface PerformanceInsight {
  id: string
  week_start: string
  report_slug: string | null
  pipeline_run_id: string | null
  topic_scores: Record<string, number>
  angle_scores: Record<string, number>
  timing_scores: TimingScores
  content_patterns: ContentPatterns
  recommendations: PerformanceInsightRecommendations
  raw_metrics: Record<string, unknown>
  created_at: string
}

/** Subset of PipelineRunDetail used in the automation "latest report" display */
export interface AutomationLatestReport {
  report_title: string | null
  topic: string
  report_slug: string | null
  published_at: string | null
}

/** Subset of PerformanceScore used in the automation "latest score" display */
export interface AutomationLatestScore {
  composite_score: number
}
