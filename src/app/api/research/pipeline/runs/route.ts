import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/research/db'

// GET /api/research/pipeline/runs — list pipeline runs
export async function GET(request: NextRequest) {
  const sql = getDb()
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const limit = parseInt(searchParams.get('limit') || '50', 10)

  const rows = status
    ? await sql`
        SELECT id, topic, status, report_title, report_slug, report_category,
               source, triggered_by, published_at, created_at, updated_at
        FROM pipeline_runs WHERE status = ${status}
        ORDER BY updated_at DESC LIMIT ${limit}
      `
    : await sql`
        SELECT id, topic, status, report_title, report_slug, report_category,
               source, triggered_by, published_at, created_at, updated_at
        FROM pipeline_runs
        ORDER BY updated_at DESC LIMIT ${limit}
      `

  return NextResponse.json({ runs: rows })
}

// POST /api/research/pipeline/runs — create a new pipeline run
export async function POST(request: NextRequest) {
  const sql = getDb()
  const body = await request.json()
  const { id, topic, source = 'pipeline', triggeredBy } = body

  if (!id || !topic) {
    return NextResponse.json({ error: 'id and topic are required' }, { status: 400 })
  }

  const rows = await sql`
    INSERT INTO pipeline_runs (id, topic, status, source, triggered_by)
    VALUES (${id}, ${topic}, 'research', ${source}, ${triggeredBy || null})
    RETURNING id, topic, status, created_at
  `

  return NextResponse.json({ run: rows[0] }, { status: 201 })
}
