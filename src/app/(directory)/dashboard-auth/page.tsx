'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function DashboardLoginForm() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/dashboard'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/research/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })

    if (res.ok) {
      router.push(redirect)
    } else {
      setError('Invalid password')
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0f',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      <form onSubmit={handleSubmit} style={{
        background: '#12121a',
        borderRadius: 12,
        padding: 40,
        width: 400,
        border: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ marginBottom: 24 }}>
          <span style={{ color: '#006828', fontSize: 28, fontWeight: 700 }}>ZAVIS</span>
          <span style={{ color: '#5e5e72', fontSize: 14, marginLeft: 8 }}>Research Dashboard</span>
        </div>

        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Dashboard password"
          autoFocus
          style={{
            width: '100%',
            padding: '14px 16px',
            background: '#0a0a0f',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8,
            color: '#f0ece4',
            fontSize: 16,
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />

        {error && (
          <p style={{ color: '#e63946', fontSize: 14, marginTop: 8 }}>{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            marginTop: 16,
            padding: '14px 16px',
            background: '#006828',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontSize: 16,
            fontWeight: 600,
            cursor: loading ? 'wait' : 'pointer',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}

export default function DashboardAuthPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh', background: '#0a0a0f',
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5e5e72',
      }}>
        Loading...
      </div>
    }>
      <DashboardLoginForm />
    </Suspense>
  )
}
