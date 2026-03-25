import { NextRequest, NextResponse } from 'next/server'

const DASHBOARD_KEY = process.env.DASHBOARD_KEY || 'zavis_research_2026'

export async function POST(request: NextRequest) {
  const body = await request.json()

  if (body.password === DASHBOARD_KEY) {
    const res = NextResponse.json({ ok: true })
    res.cookies.set('zavis_dashboard_auth', DASHBOARD_KEY, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })
    return res
  }

  return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.delete('zavis_dashboard_auth')
  return res
}
