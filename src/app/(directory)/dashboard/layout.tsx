'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Pipeline' },
  { href: '/dashboard/calendar', label: 'Calendar' },
  { href: '/dashboard/posts', label: 'LinkedIn Posts' },
  { href: '/dashboard/emails', label: 'Email Blasts' },
  { href: '/dashboard/analytics', label: 'Analytics' },
  { href: '/dashboard/automation', label: 'Automation' },
  { href: '/dashboard/skill-graph', label: 'Skill Graph' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    await fetch('/api/research/auth', { method: 'DELETE' })
    router.push('/login')
  }

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap');
      `}</style>
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        background: '#f5f0e8',
        fontFamily: "'DM Sans', sans-serif",
        color: '#1a1a1a',
      }}>
        {/* Sidebar */}
        <aside style={{
          width: 240,
          minHeight: '100vh',
          background: '#ffffff',
          borderRight: '1px solid #e8e3da',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 10,
        }}>
          {/* Wordmark */}
          <div style={{
            padding: '28px 24px 24px',
            borderBottom: '1px solid #f0ebe0',
          }}>
            <Link href="/research" style={{
              color: '#006828',
              fontSize: 22,
              fontWeight: 700,
              textDecoration: 'none',
              letterSpacing: '0.04em',
              fontFamily: "'DM Sans', sans-serif",
            }}>
              ZAVIS
            </Link>
            <div style={{
              fontSize: 11,
              color: '#999',
              marginTop: 4,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              fontWeight: 500,
            }}>
              Research Dashboard
            </div>
          </div>

          {/* Nav Items */}
          <nav style={{ padding: '16px 0', flex: 1 }}>
            {NAV_ITEMS.map(item => {
              const isActive = item.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname.startsWith(item.href)

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: 'block',
                    padding: '10px 24px',
                    fontSize: 14,
                    fontWeight: isActive ? 600 : 500,
                    textDecoration: 'none',
                    color: isActive ? '#006828' : '#666',
                    borderLeft: isActive ? '3px solid #006828' : '3px solid transparent',
                    background: isActive ? '#f5f0e8' : 'transparent',
                    transition: 'all 0.15s ease',
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* Logout */}
          <div style={{ padding: '16px 24px', borderTop: '1px solid #f0ebe0' }}>
            <button
              onClick={handleLogout}
              style={{
                width: '100%',
                padding: '8px 12px',
                background: 'transparent',
                border: '1px solid #e8e3da',
                borderRadius: 6,
                color: '#999',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 500,
                fontFamily: "'DM Sans', sans-serif",
                transition: 'all 0.15s ease',
              }}
            >
              Logout
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main style={{
          marginLeft: 240,
          flex: 1,
          padding: 32,
          maxWidth: 1200,
          width: '100%',
        }}>
          {children}
        </main>
      </div>
    </>
  )
}
