'use client'

import { useEffect, useState } from 'react'
import type { EmailBlast } from '@/types/dashboard'

export default function EmailsPage() {
  const [emails, setEmails] = useState<EmailBlast[]>([])
  const [loading, setLoading] = useState(true)
  const [previewId, setPreviewId] = useState<string | null>(null)

  const fetchEmails = () => {
    fetch('/api/research/emails')
      .then(r => r.json())
      .then(data => setEmails(data.emails || []))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchEmails() }, [])

  const handleAction = async (emailId: string, action: string) => {
    await fetch('/api/research/emails', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: emailId, action }),
    })
    fetchEmails()
  }

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Email Blasts</h1>
      <p style={{ color: '#5e5e72', fontSize: 14, marginBottom: 24 }}>
        Review and approve email blasts to send research reports to clients.
      </p>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#5e5e72' }}>Loading...</div>
      ) : emails.length === 0 ? (
        <div style={{
          background: '#12121a', borderRadius: 12, padding: 40,
          border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center', color: '#5e5e72',
        }}>
          No email blasts yet. They will be generated after reports are published.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {emails.map(email => (
            <div key={email.id} style={{
              background: '#12121a', borderRadius: 12, padding: 20,
              border: '1px solid rgba(255,255,255,0.06)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#f0ece4' }}>
                    {email.subject}
                  </div>
                  {email.preview_text && (
                    <div style={{ fontSize: 13, color: '#5e5e72', marginTop: 2 }}>
                      {email.preview_text}
                    </div>
                  )}
                </div>
                <span style={{
                  padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600, height: 'fit-content',
                  background: email.status === 'draft' ? '#ff6b3520' : email.status === 'sent' ? '#00682820' : '#3a86ff20',
                  color: email.status === 'draft' ? '#ff6b35' : email.status === 'sent' ? '#006828' : '#3a86ff',
                }}>
                  {email.status}
                </span>
              </div>

              <div style={{ fontSize: 13, color: '#5e5e72', marginBottom: 12 }}>
                Segment: {email.segment}
                {email.send_count > 0 && ` | Sent: ${email.send_count}`}
                {email.open_count > 0 && ` | Opens: ${email.open_count}`}
                {email.click_count > 0 && ` | Clicks: ${email.click_count}`}
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setPreviewId(previewId === email.id ? null : email.id)}
                  style={{
                    padding: '6px 14px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)',
                    cursor: 'pointer', fontSize: 13, fontWeight: 500,
                    background: 'transparent', color: '#9a9aaf',
                  }}>
                  {previewId === email.id ? 'Hide Preview' : 'Preview'}
                </button>
                {email.status === 'draft' && (
                  <button onClick={() => handleAction(email.id, 'approve')}
                    style={{
                      padding: '6px 14px', borderRadius: 6, border: 'none', cursor: 'pointer',
                      fontSize: 13, fontWeight: 600, color: '#fff', background: '#006828',
                    }}>
                    Approve
                  </button>
                )}
                {email.status === 'approved' && (
                  <button onClick={async () => {
                    const recipientInput = prompt('Enter recipient emails (comma-separated):')
                    if (!recipientInput) return
                    const recipients = recipientInput.split(',').map((e: string) => e.trim()).filter(Boolean)
                    if (recipients.length === 0) return
                    const res = await fetch('/api/research/emails/send', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ id: email.id, recipients }),
                    })
                    const data = await res.json()
                    if (res.ok) {
                      alert(`Sent to ${data.sent} recipients`)
                      fetchEmails()
                    } else {
                      alert(`Error: ${data.error}`)
                    }
                  }}
                    style={{
                      padding: '6px 14px', borderRadius: 6, border: 'none', cursor: 'pointer',
                      fontSize: 13, fontWeight: 600, color: '#fff', background: '#3a86ff',
                    }}>
                    Send via Plunk
                  </button>
                )}
              </div>

              {previewId === email.id && (
                <div style={{
                  marginTop: 12, background: '#fff', borderRadius: 8, padding: 2, maxHeight: 400, overflow: 'auto',
                }}>
                  <iframe
                    srcDoc={email.body_html}
                    style={{ width: '100%', height: 380, border: 'none', borderRadius: 8 }}
                    title="Email Preview"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
