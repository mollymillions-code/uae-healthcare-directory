import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/research/db'
import { isDashboardAuthenticated, isApiAuthenticated } from '@/lib/research/auth'

// GET /api/emails — list email blasts
export async function GET(request: NextRequest) {
  const sql = getDb()
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')

  const rows = status
    ? await sql`SELECT id, run_id, subject, preview_text, status, segment, sent_at, created_at, updated_at FROM email_blasts WHERE status = ${status} ORDER BY updated_at DESC`
    : await sql`SELECT id, run_id, subject, preview_text, status, segment, sent_at, created_at, updated_at FROM email_blasts ORDER BY updated_at DESC LIMIT 50`

  return NextResponse.json({ emails: rows })
}

// POST /api/emails — create an email blast draft
export async function POST(request: NextRequest) {
  if (!isDashboardAuthenticated(request) && !isApiAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const sql = getDb()
  const body = await request.json()
  const { runId, subject, previewText, bodyHtml, bodyText, segment = 'all' } = body

  if (!subject || !bodyHtml) {
    return NextResponse.json({ error: 'subject and bodyHtml are required' }, { status: 400 })
  }

  if (typeof subject !== 'string' || typeof bodyHtml !== 'string') {
    return NextResponse.json({ error: 'subject and bodyHtml must be strings' }, { status: 400 })
  }

  if (subject.length > 500) {
    return NextResponse.json({ error: 'subject must be under 500 characters' }, { status: 400 })
  }

  if (bodyHtml.length > 200000) {
    return NextResponse.json({ error: 'bodyHtml must be under 200,000 characters' }, { status: 400 })
  }

  if (bodyText && typeof bodyText === 'string' && bodyText.length > 200000) {
    return NextResponse.json({ error: 'bodyText must be under 200,000 characters' }, { status: 400 })
  }

  if (previewText && typeof previewText === 'string' && previewText.length > 500) {
    return NextResponse.json({ error: 'previewText must be under 500 characters' }, { status: 400 })
  }

  const validSegments = ['all', 'subscribers', 'leads', 'enterprise']
  if (!validSegments.includes(segment)) {
    return NextResponse.json({ error: `segment must be one of: ${validSegments.join(', ')}` }, { status: 400 })
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
  if (!isDashboardAuthenticated(request) && !isApiAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

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
