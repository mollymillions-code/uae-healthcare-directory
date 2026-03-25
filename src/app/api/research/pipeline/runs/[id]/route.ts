/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/research/db'
import { publishReportToFilesystem } from '@/lib/research/reports-fs'

// GET /api/pipeline/runs/[id] — get full pipeline run detail
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const sql = getDb()

  const runs = await sql`SELECT * FROM pipeline_runs WHERE id = ${params.id}`
  if (runs.length === 0) {
    return NextResponse.json({ error: 'Run not found' }, { status: 404 })
  }

  const comments = await sql`
    SELECT * FROM pipeline_comments WHERE run_id = ${params.id}
    ORDER BY created_at ASC
  `

  const posts = await sql`
    SELECT * FROM linkedin_posts WHERE run_id = ${params.id}
    ORDER BY created_at ASC
  `

  const emails = await sql`
    SELECT * FROM email_blasts WHERE run_id = ${params.id}
    ORDER BY created_at ASC
  `

  const scores = await sql`
    SELECT * FROM performance_scores WHERE run_id = ${params.id}
    ORDER BY collected_at DESC LIMIT 1
  `

  return NextResponse.json({
    run: runs[0],
    comments,
    posts,
    emails,
    score: scores[0] || null,
  })
}

// PUT /api/pipeline/runs/[id] — update pipeline run (stage transitions, content)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const sql = getDb()
  const body = await request.json()

  // Verify run exists
  const existing = await sql`SELECT id, status FROM pipeline_runs WHERE id = ${params.id}`
  if (existing.length === 0) {
    return NextResponse.json({ error: 'Run not found' }, { status: 404 })
  }

  // Update fields that are provided
  if (body.status) await sql`UPDATE pipeline_runs SET status = ${body.status} WHERE id = ${params.id}`
  if (body.researchPlan) await sql`UPDATE pipeline_runs SET research_plan = ${JSON.stringify(body.researchPlan)} WHERE id = ${params.id}`
  if (body.researchFindings) await sql`UPDATE pipeline_runs SET research_findings = ${JSON.stringify(body.researchFindings)} WHERE id = ${params.id}`
  if (body.synthesis) await sql`UPDATE pipeline_runs SET synthesis = ${JSON.stringify(body.synthesis)} WHERE id = ${params.id}`
  if (body.reportHtml) await sql`UPDATE pipeline_runs SET report_html = ${body.reportHtml} WHERE id = ${params.id}`
  if (body.reportSlug) await sql`UPDATE pipeline_runs SET report_slug = ${body.reportSlug} WHERE id = ${params.id}`
  if (body.reportTitle) await sql`UPDATE pipeline_runs SET report_title = ${body.reportTitle} WHERE id = ${params.id}`
  if (body.reportDescription) await sql`UPDATE pipeline_runs SET report_description = ${body.reportDescription} WHERE id = ${params.id}`
  if (body.reportCategory) await sql`UPDATE pipeline_runs SET report_category = ${body.reportCategory} WHERE id = ${params.id}`
  if (body.reportThumbnail) await sql`UPDATE pipeline_runs SET report_thumbnail = ${body.reportThumbnail} WHERE id = ${params.id}`
  if (body.metaTitle) await sql`UPDATE pipeline_runs SET meta_title = ${body.metaTitle} WHERE id = ${params.id}`
  if (body.metaDescription) await sql`UPDATE pipeline_runs SET meta_description = ${body.metaDescription} WHERE id = ${params.id}`

  const updated = await sql`SELECT id, topic, status, updated_at FROM pipeline_runs WHERE id = ${params.id}`
  return NextResponse.json({ run: updated[0] })
}

// PATCH /api/pipeline/runs/[id] — actions: approve, reject, publish
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const sql = getDb()
  const body = await request.json()
  const action = body.action

  const existing = await sql`SELECT * FROM pipeline_runs WHERE id = ${params.id}`
  if (existing.length === 0) {
    return NextResponse.json({ error: 'Run not found' }, { status: 404 })
  }

  const run = existing[0]

  if (action === 'approve') {
    // Move from review → approved
    if (run.status !== 'review') {
      return NextResponse.json({ error: `Cannot approve a run in "${run.status}" status` }, { status: 400 })
    }

    await sql`UPDATE pipeline_runs SET status = 'approved' WHERE id = ${params.id}`
    return NextResponse.json({ message: 'Run approved', status: 'approved' })
  }

  if (action === 'request_changes') {
    // Keep in review, comment should be added separately
    return NextResponse.json({ message: 'Changes requested. Add comments with the comments endpoint.' })
  }

  if (action === 'reject') {
    await sql`UPDATE pipeline_runs SET status = 'failed' WHERE id = ${params.id}`
    return NextResponse.json({ message: 'Run rejected', status: 'failed' })
  }

  if (action === 'publish') {
    // Move from approved → published, write to filesystem
    if (run.status !== 'approved') {
      return NextResponse.json({ error: `Cannot publish a run in "${run.status}" status` }, { status: 400 })
    }

    if (!run.report_html || !run.report_slug) {
      return NextResponse.json({ error: 'Report HTML and slug are required to publish' }, { status: 400 })
    }

    // Write to filesystem
    const url = publishReportToFilesystem(run.report_slug, run.report_html, {
      title: run.report_title || run.topic,
      description: run.report_description || '',
      category: run.report_category || 'Business',
      publishedAt: new Date().toISOString(),
      readTime: run.report_read_time || '30 min read',
      thumbnail: run.report_thumbnail,
      summary: run.synthesis?.headline_stats?.map((s: any) => `${s.value} — ${s.label}`) || [],
    })

    await sql`
      UPDATE pipeline_runs
      SET status = 'published', published_at = NOW()
      WHERE id = ${params.id}
    `

    return NextResponse.json({
      message: 'Report published',
      status: 'published',
      url,
    })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
