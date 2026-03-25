import { NextRequest, NextResponse } from 'next/server'

const DASHBOARD_KEY = process.env.DASHBOARD_KEY || 'zavis_research_2026'
const API_KEY = process.env.REPORTS_API_KEY || ''

/**
 * Check if a request has a valid dashboard session cookie.
 */
export function isDashboardAuthenticated(request: NextRequest): boolean {
  const cookie = request.cookies.get('zavis_dashboard_auth')
  return cookie?.value === DASHBOARD_KEY
}

/**
 * Check if a request has a valid API key (for pipeline writes).
 */
export function isApiAuthenticated(request: NextRequest): boolean {
  const key = request.headers.get('x-api-key')
  return !!API_KEY && key === API_KEY
}

/**
 * Login API handler — sets the auth cookie.
 */
export async function handleLogin(request: NextRequest): Promise<NextResponse> {
  const body = await request.json()
  if (body.password === DASHBOARD_KEY) {
    const res = NextResponse.json({ ok: true })
    res.cookies.set('zavis_dashboard_auth', DASHBOARD_KEY, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })
    return res
  }
  return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
}

/**
 * Logout — clears the auth cookie.
 */
export function handleLogout(): NextResponse {
  const res = NextResponse.json({ ok: true })
  res.cookies.delete('zavis_dashboard_auth')
  return res
}
