export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/research/db'

export async function GET(request: NextRequest) {
  const sql = getDb()
  const { searchParams } = new URL(request.url)
  const unreadOnly = searchParams.get('unread') === 'true'
  const limit = parseInt(searchParams.get('limit') || '30', 10)

  const rows = unreadOnly
    ? await sql`
        SELECT * FROM automation_notifications WHERE read = false
        ORDER BY created_at DESC LIMIT ${limit}
      `
    : await sql`
        SELECT * FROM automation_notifications
        ORDER BY created_at DESC LIMIT ${limit}
      `

  return NextResponse.json({ notifications: rows })
}

export async function PATCH(request: NextRequest) {
  const sql = getDb()
  const body = await request.json()
  const { id, action } = body

  if (action === 'read' && id) {
    await sql`UPDATE automation_notifications SET read = true WHERE id = ${id}`
    return NextResponse.json({ message: 'Marked as read' })
  }

  if (action === 'read_all') {
    await sql`UPDATE automation_notifications SET read = true WHERE read = false`
    return NextResponse.json({ message: 'All marked as read' })
  }

  if (action === 'dismiss' && id) {
    await sql`DELETE FROM automation_notifications WHERE id = ${id}`
    return NextResponse.json({ message: 'Dismissed' })
  }

  return NextResponse.json({ error: 'id and action required' }, { status: 400 })
}
