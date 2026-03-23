import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/research/db'

// GET /api/pipeline/runs/[id]/comments
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const sql = getDb()
  const rows = await sql`
    SELECT * FROM pipeline_comments
    WHERE run_id = ${params.id}
    ORDER BY created_at ASC
  `
  return NextResponse.json({ comments: rows })
}

// POST /api/pipeline/runs/[id]/comments — add a comment
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const sql = getDb()
  const body = await request.json()
  const { stage, content, author = 'reviewer' } = body

  if (!stage || !content) {
    return NextResponse.json({ error: 'stage and content are required' }, { status: 400 })
  }

  // Verify run exists
  const runs = await sql`SELECT id FROM pipeline_runs WHERE id = ${params.id}`
  if (runs.length === 0) {
    return NextResponse.json({ error: 'Run not found' }, { status: 404 })
  }

  const rows = await sql`
    INSERT INTO pipeline_comments (run_id, stage, author, content)
    VALUES (${params.id}, ${stage}, ${author}, ${content})
    RETURNING *
  `

  return NextResponse.json({ comment: rows[0] }, { status: 201 })
}
