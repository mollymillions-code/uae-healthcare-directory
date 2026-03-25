export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/research/db'

export async function GET(request: NextRequest) {
  const sql = getDb()
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const limit = parseInt(searchParams.get('limit') || '20', 10)

  const rows = status
    ? await sql`
        SELECT * FROM automation_runs WHERE status = ${status}
        ORDER BY created_at DESC LIMIT ${limit}
      `
    : await sql`
        SELECT * FROM automation_runs
        ORDER BY created_at DESC LIMIT ${limit}
      `

  return NextResponse.json({ runs: rows })
}
