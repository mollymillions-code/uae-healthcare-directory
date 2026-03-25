export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/research/db'

export async function GET() {
  const sql = getDb()
  const rows = await sql`SELECT * FROM automation_schedules ORDER BY id`
  return NextResponse.json({ schedules: rows })
}

export async function PATCH(request: NextRequest) {
  const sql = getDb()
  const body = await request.json()
  const { id, action } = body

  if (!id) {
    return NextResponse.json({ error: 'Schedule id required' }, { status: 400 })
  }

  if (action === 'pause') {
    await sql`UPDATE automation_schedules SET enabled = false, status = 'paused' WHERE id = ${id}`
    return NextResponse.json({ message: `Schedule ${id} paused` })
  }

  if (action === 'resume') {
    await sql`UPDATE automation_schedules SET enabled = true, status = 'idle' WHERE id = ${id}`
    return NextResponse.json({ message: `Schedule ${id} resumed` })
  }

  if (action === 'reset') {
    await sql`UPDATE automation_schedules SET status = 'idle', current_run_id = NULL WHERE id = ${id}`
    return NextResponse.json({ message: `Schedule ${id} reset` })
  }

  return NextResponse.json({ error: 'Unknown action. Use: pause, resume, reset' }, { status: 400 })
}
