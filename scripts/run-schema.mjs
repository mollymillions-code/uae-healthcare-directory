import { neon } from '@neondatabase/serverless'

const DATABASE_URL = 'postgresql://neondb_owner:npg_of39WSHMlnvG@ep-dawn-shape-aefjck3y.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require'

const sql = neon(DATABASE_URL)

console.log('Creating tables...')

// pipeline_runs
await sql`
CREATE TABLE IF NOT EXISTS pipeline_runs (
  id TEXT PRIMARY KEY,
  topic TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'research',
  research_plan JSONB,
  research_findings JSONB,
  synthesis JSONB,
  report_html TEXT,
  report_slug TEXT UNIQUE,
  report_title TEXT,
  report_description TEXT,
  report_category TEXT DEFAULT 'Business',
  report_thumbnail TEXT,
  report_read_time TEXT DEFAULT '30 min read',
  meta_title TEXT,
  meta_description TEXT,
  og_image TEXT,
  source TEXT DEFAULT 'manual',
  triggered_by TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
)`
console.log('  + pipeline_runs')

// pipeline_comments
await sql`
CREATE TABLE IF NOT EXISTS pipeline_comments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  run_id TEXT NOT NULL REFERENCES pipeline_runs(id) ON DELETE CASCADE,
  stage TEXT NOT NULL,
  author TEXT NOT NULL DEFAULT 'reviewer',
  content TEXT NOT NULL,
  resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
)`
console.log('  + pipeline_comments')

// linkedin_posts
await sql`
CREATE TABLE IF NOT EXISTS linkedin_posts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  run_id TEXT REFERENCES pipeline_runs(id) ON DELETE SET NULL,
  account TEXT NOT NULL,
  content TEXT NOT NULL,
  first_comment TEXT,
  hashtags TEXT[],
  assets TEXT[],
  status TEXT NOT NULL DEFAULT 'draft',
  postiz_post_id TEXT,
  scheduled_for TIMESTAMPTZ,
  posted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
)`
console.log('  + linkedin_posts')

// email_blasts
await sql`
CREATE TABLE IF NOT EXISTS email_blasts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  run_id TEXT REFERENCES pipeline_runs(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  preview_text TEXT,
  body_html TEXT NOT NULL,
  body_text TEXT,
  segment TEXT DEFAULT 'all',
  status TEXT NOT NULL DEFAULT 'draft',
  sent_at TIMESTAMPTZ,
  send_count INTEGER DEFAULT 0,
  open_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
)`
console.log('  + email_blasts')

// performance_scores
await sql`
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
)`
console.log('  + performance_scores')

// Indexes
console.log('Creating indexes...')
await sql`CREATE INDEX IF NOT EXISTS idx_pipeline_status ON pipeline_runs(status)`
await sql`CREATE INDEX IF NOT EXISTS idx_pipeline_created ON pipeline_runs(created_at DESC)`
await sql`CREATE INDEX IF NOT EXISTS idx_comments_run ON pipeline_comments(run_id)`
await sql`CREATE INDEX IF NOT EXISTS idx_posts_status ON linkedin_posts(status)`
await sql`CREATE INDEX IF NOT EXISTS idx_posts_run ON linkedin_posts(run_id)`
await sql`CREATE INDEX IF NOT EXISTS idx_emails_status ON email_blasts(status)`
await sql`CREATE INDEX IF NOT EXISTS idx_emails_run ON email_blasts(run_id)`
await sql`CREATE INDEX IF NOT EXISTS idx_scores_run ON performance_scores(run_id)`
await sql`CREATE INDEX IF NOT EXISTS idx_scores_composite ON performance_scores(composite_score DESC)`
console.log('  + all indexes')

// Auto-update trigger
console.log('Creating triggers...')
await sql`
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql`

await sql`DROP TRIGGER IF EXISTS pipeline_runs_updated ON pipeline_runs`
await sql`CREATE TRIGGER pipeline_runs_updated BEFORE UPDATE ON pipeline_runs FOR EACH ROW EXECUTE FUNCTION update_updated_at()`
await sql`DROP TRIGGER IF EXISTS linkedin_posts_updated ON linkedin_posts`
await sql`CREATE TRIGGER linkedin_posts_updated BEFORE UPDATE ON linkedin_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at()`
await sql`DROP TRIGGER IF EXISTS email_blasts_updated ON email_blasts`
await sql`CREATE TRIGGER email_blasts_updated BEFORE UPDATE ON email_blasts FOR EACH ROW EXECUTE FUNCTION update_updated_at()`
console.log('  + all triggers')

// Verify
const tables = await sql`SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`
console.log('\nAll tables:')
tables.forEach(t => console.log(`  - ${t.tablename}`))
console.log('\nDone.')
