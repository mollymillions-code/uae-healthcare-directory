export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/research/db'

export async function GET(request: NextRequest) {
  const sql = getDb()
  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') || '12', 10)

  const rows = await sql`
    SELECT * FROM performance_insights
    ORDER BY week_start DESC LIMIT ${limit}
  `

  return NextResponse.json({ insights: rows })
}
