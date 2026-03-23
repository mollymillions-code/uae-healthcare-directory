import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/research/db'

// GET /api/emails — list email blasts
export async function GET(request: NextRequest) {
  const sql = getDb()
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')

  const rows = status
    ? await sql`SELECT * FROM email_blasts WHERE status = ${status} ORDER BY updated_at DESC`
    : await sql`SELECT * FROM email_blasts ORDER BY updated_at DESC LIMIT 50`

  return NextResponse.json({ emails: rows })
}

// POST /api/emails — create an email blast draft
export async function POST(request: NextRequest) {
  const sql = getDb()
  const body = await request.json()
  const { runId, subject, previewText, bodyHtml, bodyText, segment = 'all' } = body

  if (!subject || !bodyHtml) {
    return NextResponse.json({ error: 'subject and bodyHtml are required' }, { status: 400 })
  }

  const rows = await sql`
    INSERT INTO email_blasts (run_id, subject, preview_text, body_html, body_text, segment)
    VALUES (${runId || null}, ${subject}, ${previewText || null}, ${bodyHtml}, ${bodyText || null}, ${segment})
    RETURNING *
  `

  return NextResponse.json({ email: rows[0] }, { status: 201 })
}

// PATCH /api/emails — actions
export async function PATCH(request: NextRequest) {
  const sql = getDb()
  const body = await request.json()
  const { id, action } = body

  if (!id || !action) {
    return NextResponse.json({ error: 'id and action are required' }, { status: 400 })
  }

  if (action === 'approve') {
    await sql`UPDATE email_blasts SET status = 'approved' WHERE id = ${id}`
  } else if (action === 'sent') {
    await sql`UPDATE email_blasts SET status = 'sent', sent_at = NOW() WHERE id = ${id}`
  } else {
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  }

  const updated = await sql`SELECT * FROM email_blasts WHERE id = ${id}`
  return NextResponse.json({ email: updated[0] })
}
