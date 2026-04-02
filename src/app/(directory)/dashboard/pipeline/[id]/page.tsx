'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import type {
  PipelineRunDetail,
  PipelineComment,
  LinkedInPost,
  EmailBlast,
  PerformanceScore,
  HeadlineStat,
} from '@/types/dashboard'

export default function PipelineDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [run, setRun] = useState<PipelineRunDetail | null>(null)
  const [comments, setComments] = useState<PipelineComment[]>([])
  const [posts, setPosts] = useState<LinkedInPost[]>([])
  const [emails, setEmails] = useState<EmailBlast[]>([])
  const [score, setScore] = useState<PerformanceScore | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<'overview' | 'report' | 'research' | 'distribution'>('overview')
  const [newComment, setNewComment] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const fetchData = useCallback(() => {
    setError(null)
    fetch(`/api/research/pipeline/runs/${params.id}`)
      .then(r => {
        if (!r.ok) throw new Error(`Failed to fetch run (${r.status})`)
        return r.json()
      })
      .then(data => {
        setRun(data.run)
        setComments(data.comments || [])
        setPosts(data.posts || [])
        setEmails(data.emails || [])
        setScore(data.score)
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Something went wrong'))
      .finally(() => setLoading(false))
  }, [params.id])

  useEffect(() => { fetchData() }, [fetchData])

  // Render report HTML in iframe when on report tab
  useEffect(() => {
    if (tab === 'report' && run?.report_html && iframeRef.current) {
      const doc = iframeRef.current.contentDocument
      if (doc) {
        doc.open()
        doc.write(run.report_html)
        doc.close()
      }
    }
  }, [tab, run?.report_html])

  const handleAction = async (action: string) => {
    setActionLoading(true)
    try {
      const r = await fetch(`/api/research/pipeline/runs/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      if (!r.ok) throw new Error(`Action failed (${r.status})`)
      fetchData()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setActionLoading(false)
    }
  }

  const handleComment = async () => {
    if (!newComment.trim()) return
    try {
      const r = await fetch(`/api/research/pipeline/runs/${params.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: run?.status || 'review', content: newComment }),
      })
      if (!r.ok) throw new Error(`Failed to add comment (${r.status})`)
      setNewComment('')
      fetchData()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  const handlePostAction = async (postId: string, action: string) => {
    try {
      const r = await fetch('/api/research/posts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: postId, action }),
      })
      if (!r.ok) throw new Error(`Post action failed (${r.status})`)
      fetchData()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  const handleEmailAction = async (emailId: string, action: string) => {
    try {
      const r = await fetch('/api/research/emails', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: emailId, action }),
      })
      if (!r.ok) throw new Error(`Email action failed (${r.status})`)
      fetchData()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#5e5e72' }}>Loading...</div>
  }

  if (error) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <p style={{ color: '#e63946', fontSize: 14, marginBottom: 12 }}>{error}</p>
        <button onClick={fetchData} style={{ ...btnStyle, background: '#006828' }}>Retry</button>
      </div>
    )
  }

  if (!run) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#e63946' }}>Run not found</div>
  }

  const STATUS_COLORS: Record<string, string> = {
    research: '#3a86ff', synthesis: '#7b2cbf', rendering: '#d4a855',
    review: '#ff6b35', approved: '#2ec4b6', published: '#006828',
    distributing: '#006828', complete: '#006828', failed: '#e63946',
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <button onClick={() => router.push('/dashboard')} style={backBtnStyle}>Back to Pipeline</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 12 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>
            {run.report_title || run.topic}
          </h1>
          <span style={{
            padding: '4px 12px', borderRadius: 12, fontSize: 13, fontWeight: 600,
            background: `${STATUS_COLORS[run.status]}20`,
            color: STATUS_COLORS[run.status],
          }}>
            {run.status}
          </span>
        </div>
        <div style={{ color: '#5e5e72', fontSize: 13, marginTop: 4 }}>
          {run.report_category || 'Uncategorized'} | Created {new Date(run.created_at).toLocaleDateString()}
          {run.published_at && ` | Published ${new Date(run.published_at).toLocaleDateString()}`}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24 }}>
        {(['overview', 'report', 'research', 'distribution'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '8px 16px', borderRadius: 6, border: 'none', cursor: 'pointer',
              fontSize: 14, fontWeight: 500,
              background: tab === t ? 'rgba(0,104,40,0.15)' : 'transparent',
              color: tab === t ? '#f0ece4' : '#5e5e72',
            }}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24 }}>
          {/* Main Content */}
          <div>
            {/* Action Buttons */}
            {run.status === 'review' && (
              <div style={{ ...cardStyle, display: 'flex', gap: 12, marginBottom: 24 }}>
                <button onClick={() => handleAction('approve')} disabled={actionLoading}
                  style={{ ...btnStyle, background: '#006828' }}>
                  Approve Report
                </button>
                <button onClick={() => handleAction('request_changes')} disabled={actionLoading}
                  style={{ ...btnStyle, background: '#ff6b35' }}>
                  Request Changes
                </button>
                <button onClick={() => handleAction('reject')} disabled={actionLoading}
                  style={{ ...btnStyle, background: '#e63946' }}>
                  Reject
                </button>
              </div>
            )}

            {run.status === 'approved' && (
              <div style={{ ...cardStyle, display: 'flex', gap: 12, marginBottom: 24 }}>
                <button onClick={() => handleAction('publish')} disabled={actionLoading}
                  style={{ ...btnStyle, background: '#006828' }}>
                  Publish to research.zavis.ai
                </button>
              </div>
            )}

            {/* Research Plan Summary */}
            {run.research_plan && (
              <div style={{ ...cardStyle, marginBottom: 16 }}>
                <h3 style={sectionTitle}>Research Plan</h3>
                <pre style={preStyle}>{JSON.stringify(run.research_plan, null, 2)}</pre>
              </div>
            )}

            {/* Synthesis Summary */}
            {run.synthesis && (
              <div style={{ ...cardStyle, marginBottom: 16 }}>
                <h3 style={sectionTitle}>Synthesis</h3>
                {run.synthesis.headline_stats && (
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
                    {run.synthesis.headline_stats.map((s: HeadlineStat, i: number) => (
                      <div key={i} style={{
                        background: 'rgba(0,104,40,0.1)', borderRadius: 8, padding: '8px 16px',
                      }}>
                        <div style={{ fontSize: 24, fontWeight: 700, color: '#006828' }}>{s.value}</div>
                        <div style={{ fontSize: 12, color: '#9a9aaf' }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                )}
                <pre style={preStyle}>{JSON.stringify(run.synthesis, null, 2)}</pre>
              </div>
            )}

            {/* Score */}
            {score && (
              <div style={{ ...cardStyle, marginBottom: 16 }}>
                <h3 style={sectionTitle}>Performance Score</h3>
                <div style={{ fontSize: 48, fontWeight: 700, color: '#006828' }}>
                  {score.composite_score}
                </div>
                <pre style={preStyle}>{JSON.stringify(score.breakdown, null, 2)}</pre>
              </div>
            )}
          </div>

          {/* Sidebar: Comments */}
          <div style={cardStyle}>
            <h3 style={sectionTitle}>Comments</h3>

            <div style={{ maxHeight: 400, overflowY: 'auto', marginBottom: 16 }}>
              {comments.length === 0 ? (
                <p style={{ color: '#5e5e72', fontSize: 13 }}>No comments yet</p>
              ) : comments.map(c => (
                <div key={c.id} style={{
                  padding: '10px 0',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#9a9aaf' }}>{c.author}</span>
                    <span style={{ fontSize: 11, color: '#5e5e72' }}>
                      {new Date(c.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div style={{ fontSize: 14, color: '#f0ece4', lineHeight: 1.5 }}>{c.content}</div>
                  <span style={{
                    fontSize: 11, color: '#5e5e72',
                    background: 'rgba(255,255,255,0.04)', padding: '1px 6px', borderRadius: 4,
                  }}>
                    {c.stage}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                onKeyDown={e => e.key === 'Enter' && handleComment()}
                style={{
                  flex: 1, padding: '10px 12px', background: '#0a0a0f',
                  border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6,
                  color: '#f0ece4', fontSize: 14, outline: 'none',
                }}
              />
              <button onClick={handleComment} style={{ ...btnStyle, background: '#006828', padding: '10px 16px' }}>
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === 'report' && (
        <div style={cardStyle}>
          {run.report_html ? (
            <iframe
              ref={iframeRef}
              style={{ width: '100%', height: '80vh', border: 'none', borderRadius: 8 }}
              sandbox="allow-scripts allow-same-origin"
              title="Report Preview"
            />
          ) : (
            <p style={{ color: '#5e5e72', textAlign: 'center', padding: 40 }}>
              No report HTML generated yet. The report will appear here once the rendering phase is complete.
            </p>
          )}
        </div>
      )}

      {tab === 'research' && (
        <div>
          {run.research_findings ? (
            <div style={cardStyle}>
              <h3 style={sectionTitle}>Research Findings</h3>
              <pre style={preStyle}>{JSON.stringify(run.research_findings, null, 2)}</pre>
            </div>
          ) : (
            <div style={{ ...cardStyle, textAlign: 'center', padding: 40, color: '#5e5e72' }}>
              Research findings will appear here once the deep-researcher completes.
            </div>
          )}
        </div>
      )}

      {tab === 'distribution' && (
        <div>
          {/* LinkedIn Posts */}
          <div style={{ ...cardStyle, marginBottom: 24 }}>
            <h3 style={sectionTitle}>LinkedIn Posts</h3>
            {posts.length === 0 ? (
              <p style={{ color: '#5e5e72', fontSize: 13 }}>
                Posts will be generated after the report is published.
              </p>
            ) : posts.map(post => (
              <div key={post.id} style={{
                padding: 16, marginBottom: 12, borderRadius: 8,
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{
                    fontSize: 12, fontWeight: 600, textTransform: 'uppercase',
                    color: post.account === 'founder' ? '#d4a855' : '#3a86ff',
                  }}>
                    {post.account} account
                  </span>
                  <span style={{
                    padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600,
                    background: post.status === 'draft' ? '#ff6b3520' : '#00682820',
                    color: post.status === 'draft' ? '#ff6b35' : '#006828',
                  }}>
                    {post.status}
                  </span>
                </div>
                <div style={{ fontSize: 14, color: '#f0ece4', whiteSpace: 'pre-wrap', lineHeight: 1.6, marginBottom: 12 }}>
                  {post.content}
                </div>
                {post.status === 'draft' && (
                  <button onClick={() => handlePostAction(post.id, 'approve')}
                    style={{ ...btnStyle, background: '#006828', padding: '6px 14px', fontSize: 13 }}>
                    Approve
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Email Blasts */}
          <div style={cardStyle}>
            <h3 style={sectionTitle}>Email Blasts</h3>
            {emails.length === 0 ? (
              <p style={{ color: '#5e5e72', fontSize: 13 }}>
                Emails will be generated after the report is published.
              </p>
            ) : emails.map(email => (
              <div key={email.id} style={{
                padding: 16, marginBottom: 12, borderRadius: 8,
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)',
              }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#f0ece4', marginBottom: 4 }}>
                  {email.subject}
                </div>
                <div style={{ fontSize: 13, color: '#5e5e72', marginBottom: 8 }}>
                  Segment: {email.segment} | Status: {email.status}
                </div>
                {email.status === 'draft' && (
                  <button onClick={() => handleEmailAction(email.id, 'approve')}
                    style={{ ...btnStyle, background: '#006828', padding: '6px 14px', fontSize: 13 }}>
                    Approve
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const cardStyle: React.CSSProperties = {
  background: '#12121a',
  borderRadius: 12,
  padding: 20,
  border: '1px solid rgba(255,255,255,0.06)',
}

const sectionTitle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: '#9a9aaf',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: 12,
  marginTop: 0,
}

const btnStyle: React.CSSProperties = {
  padding: '10px 20px',
  border: 'none',
  borderRadius: 8,
  color: '#fff',
  fontWeight: 600,
  fontSize: 14,
  cursor: 'pointer',
}

const backBtnStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: '#5e5e72',
  cursor: 'pointer',
  fontSize: 13,
  padding: 0,
}

const preStyle: React.CSSProperties = {
  background: '#0a0a0f',
  padding: 16,
  borderRadius: 8,
  fontSize: 12,
  color: '#9a9aaf',
  overflow: 'auto',
  maxHeight: 300,
  whiteSpace: 'pre-wrap',
}
