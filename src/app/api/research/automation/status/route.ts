export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { getDb } from '@/lib/research/db'

export async function GET() {
  const sql = getDb()

  const [schedules, latestRuns, queueStats, unreadNotifs] = await Promise.all([
    sql`SELECT * FROM automation_schedules ORDER BY id`,
    sql`SELECT * FROM automation_runs ORDER BY created_at DESC LIMIT 10`,
    sql`
      SELECT
        report_slug,
        COUNT(*) FILTER (WHERE status = 'pending')::int as pending,
        COUNT(*) FILTER (WHERE status = 'posted')::int as posted,
        COUNT(*) FILTER (WHERE status = 'failed')::int as failed,
        COUNT(*) FILTER (WHERE status = 'skipped')::int as skipped,
        COUNT(*)::int as total
      FROM post_queue
      GROUP BY report_slug
      ORDER BY MAX(created_at) DESC LIMIT 1
    `,
    sql`SELECT COUNT(*)::int as count FROM automation_notifications WHERE read = false`,
  ])

  // Get latest published report
  const latestReport = await sql`
    SELECT id, topic, report_slug, report_title, published_at
    FROM pipeline_runs
    WHERE status IN ('published', 'distributing', 'complete')
    ORDER BY published_at DESC LIMIT 1
  `

  // Get latest performance score
  let latestScore = null
  if (latestReport[0]) {
    const scores = await sql`
      SELECT composite_score, breakdown, linkedin_metrics, website_metrics, search_metrics, collected_at
      FROM performance_scores WHERE run_id = ${latestReport[0].id}
      ORDER BY collected_at DESC LIMIT 1
    `
    latestScore = scores[0] || null
  }

  return NextResponse.json({
    schedules,
    latestRuns,
    queueStats: queueStats[0] || null,
    unreadNotifications: unreadNotifs[0]?.count || 0,
    latestReport: latestReport[0] || null,
    latestScore,
  })
}
