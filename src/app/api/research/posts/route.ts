import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/research/db'
import { isDashboardAuthenticated, isApiAuthenticated } from '@/lib/research/auth'

// GET /api/posts — list LinkedIn posts
export async function GET(request: NextRequest) {
  const sql = getDb()
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')

  const rows = status
    ? await sql`SELECT id, run_id, account, content, first_comment, hashtags, status, scheduled_for, posted_at, created_at, updated_at FROM linkedin_posts WHERE status = ${status} ORDER BY updated_at DESC`
    : await sql`SELECT id, run_id, account, content, first_comment, hashtags, status, scheduled_for, posted_at, created_at, updated_at FROM linkedin_posts ORDER BY updated_at DESC LIMIT 50`

  return NextResponse.json({ posts: rows })
}

// POST /api/posts — create a LinkedIn post draft
export async function POST(request: NextRequest) {
  if (!isDashboardAuthenticated(request) && !isApiAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const sql = getDb()
  const body = await request.json()
  const { runId, account, content, firstComment, hashtags = [], assets = [] } = body

  if (!account || !content) {
    return NextResponse.json({ error: 'account and content are required' }, { status: 400 })
  }

  if (typeof account !== 'string' || typeof content !== 'string') {
    return NextResponse.json({ error: 'account and content must be strings' }, { status: 400 })
  }

  if (account.length > 100) {
    return NextResponse.json({ error: 'account must be under 100 characters' }, { status: 400 })
  }

  if (content.length > 10000) {
    return NextResponse.json({ error: 'content must be under 10,000 characters' }, { status: 400 })
  }

  if (firstComment && typeof firstComment === 'string' && firstComment.length > 5000) {
    return NextResponse.json({ error: 'firstComment must be under 5,000 characters' }, { status: 400 })
  }

  if (!Array.isArray(hashtags) || hashtags.length > 30) {
    return NextResponse.json({ error: 'hashtags must be an array of up to 30 items' }, { status: 400 })
  }

  const rows = await sql`
    INSERT INTO linkedin_posts (run_id, account, content, first_comment, hashtags, assets)
    VALUES (${runId || null}, ${account}, ${content}, ${firstComment || null}, ${hashtags}, ${assets})
    RETURNING *
  `

  return NextResponse.json({ post: rows[0] }, { status: 201 })
}

// PATCH /api/posts — bulk action (approve, etc.)
export async function PATCH(request: NextRequest) {
  if (!isDashboardAuthenticated(request) && !isApiAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const sql = getDb()
  const body = await request.json()
  const { id, action, content, scheduledFor, postizPostId } = body

  if (!id || !action) {
    return NextResponse.json({ error: 'id and action are required' }, { status: 400 })
  }

  if (action === 'approve') {
    await sql`UPDATE linkedin_posts SET status = 'approved' WHERE id = ${id}`
  } else if (action === 'schedule') {
    await sql`UPDATE linkedin_posts SET status = 'scheduled', scheduled_for = ${scheduledFor ? new Date(scheduledFor) : null}, postiz_post_id = ${postizPostId || null} WHERE id = ${id}`
  } else if (action === 'posted') {
    await sql`UPDATE linkedin_posts SET status = 'posted', posted_at = NOW() WHERE id = ${id}`
  } else if (action === 'update') {
    if (content) await sql`UPDATE linkedin_posts SET content = ${content} WHERE id = ${id}`
  } else {
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  }

  const updated = await sql`SELECT * FROM linkedin_posts WHERE id = ${id}`
  return NextResponse.json({ post: updated[0] })
}
