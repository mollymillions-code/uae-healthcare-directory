export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/research/db'

export async function GET(request: NextRequest) {
  const sql = getDb()
  const { searchParams } = new URL(request.url)
  const reportSlug = searchParams.get('report_slug')
  const status = searchParams.get('status')

  let rows
  if (reportSlug && status) {
    rows = await sql`
      SELECT * FROM post_queue WHERE report_slug = ${reportSlug} AND status = ${status}
      ORDER BY post_number ASC
    `
  } else if (reportSlug) {
    rows = await sql`
      SELECT * FROM post_queue WHERE report_slug = ${reportSlug}
      ORDER BY post_number ASC
    `
  } else {
    rows = await sql`
      SELECT * FROM post_queue ORDER BY created_at DESC, post_number ASC LIMIT 50
    `
  }

  return NextResponse.json({ queue: rows })
}

export async function PATCH(request: NextRequest) {
  const sql = getDb()
  const body = await request.json()
  const { id, action } = body

  if (!id || !action) {
    return NextResponse.json({ error: 'id and action required' }, { status: 400 })
  }

  if (action === 'skip') {
    await sql`UPDATE post_queue SET status = 'skipped' WHERE id = ${id}`
    return NextResponse.json({ message: 'Post skipped' })
  }

  if (action === 'reset') {
    await sql`UPDATE post_queue SET status = 'pending', error_message = NULL WHERE id = ${id}`
    return NextResponse.json({ message: 'Post reset to pending' })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
