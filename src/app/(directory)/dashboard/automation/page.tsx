'use client'

import { useEffect, useState, useCallback } from 'react'
import type {
  AutomationSchedule,
  AutomationRun,
  PostQueueItem,
  AutomationNotification,
  PerformanceInsight,
  AutomationLatestReport,
  AutomationLatestScore,
} from '@/types/dashboard'

const SEVERITY_COLORS: Record<string, string> = {
  info: '#3a86ff',
  warning: '#d4a855',
  error: '#e63946',
  action_required: '#ff6b35',
}

const STATUS_COLORS: Record<string, string> = {
  idle: '#666',
  running: '#3a86ff',
  completed: '#006828',
  failed: '#e63946',
  paused: '#d4a855',
  started: '#3a86ff',
  needs_human: '#ff6b35',
  pending: '#666',
  posted: '#006828',
  skipped: '#d4a855',
  content_ready: '#7b2cbf',
  assets_ready: '#2ec4b6',
  posting: '#3a86ff',
}

export default function AutomationDashboard() {
  const [schedules, setSchedules] = useState<AutomationSchedule[]>([])
  const [runs, setRuns] = useState<AutomationRun[]>([])
  const [queue, setQueue] = useState<PostQueueItem[]>([])
  const [notifications, setNotifications] = useState<AutomationNotification[]>([])
  const [insights, setInsights] = useState<PerformanceInsight[]>([])
  const [latestReport, setLatestReport] = useState<AutomationLatestReport | null>(null)
  const [latestScore, setLatestScore] = useState<AutomationLatestScore | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [expandedRun, setExpandedRun] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const [statusRes, runsRes, notifRes, insightsRes] = await Promise.all([
        fetch('/api/research/automation/status').then(r => r.json()),
        fetch('/api/research/automation/runs').then(r => r.json()),
        fetch('/api/research/automation/notifications').then(r => r.json()),
        fetch('/api/research/automation/insights').then(r => r.json()),
      ])

      setSchedules(statusRes.schedules || [])
      setLatestReport(statusRes.latestReport)
      setLatestScore(statusRes.latestScore)
      setUnreadCount(statusRes.unreadNotifications || 0)
      setRuns(runsRes.runs || [])
      setNotifications(notifRes.notifications || [])
      setInsights(insightsRes.insights || [])

      // Fetch queue for latest report
      if (statusRes.latestReport?.report_slug) {
        const queueRes = await fetch(`/api/research/automation/queue?report_slug=${statusRes.latestReport.report_slug}`).then(r => r.json())
        setQueue(queueRes.queue || [])
      }
    } catch (e) {
      console.error('Failed to fetch automation data:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000) // Refresh every 30s
    return () => clearInterval(interval)
  }, [fetchData])

  async function toggleSchedule(id: string, enabled: boolean) {
    await fetch('/api/research/automation/schedules', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: enabled ? 'pause' : 'resume' }),
    })
    fetchData()
  }

  async function markAllRead() {
    await fetch('/api/research/automation/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'read_all' }),
    })
    fetchData()
  }

  if (loading) {
    return <div style={{ padding: 40, color: '#999', fontFamily: 'system-ui' }}>Loading automation dashboard...</div>
  }

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1200, margin: '0 auto', fontFamily: 'system-ui', color: '#e0e0e0' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, color: '#fff' }}>Automation Dashboard</h1>
      <p style={{ color: '#888', marginBottom: 32, fontSize: 14 }}>
        Autonomous research publishing and social distribution pipeline
      </p>

      {/* Section 1: Schedule Status */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        {schedules.map(s => (
          <div key={s.id} style={{
            background: '#12121a', borderRadius: 12, padding: 20,
            border: `1px solid ${s.enabled ? '#222' : '#443'}`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>
                {s.schedule_type.replace(/_/g, ' ')}
              </span>
              <button
                onClick={() => toggleSchedule(s.id, s.enabled)}
                style={{
                  background: 'none', cursor: 'pointer', fontSize: 11,
                  color: s.enabled ? '#006828' : '#d4a855', padding: '2px 8px',
                  borderRadius: 4, border: `1px solid ${s.enabled ? '#006828' : '#d4a855'}`,
                }}
              >
                {s.enabled ? 'Active' : 'Paused'}
              </button>
            </div>
            <div style={{
              fontSize: 18, fontWeight: 600,
              color: STATUS_COLORS[s.status] || '#888',
            }}>
              {s.status.toUpperCase()}
            </div>
            <div style={{ fontSize: 11, color: '#666', marginTop: 8 }}>
              Last: {s.last_run_at ? new Date(s.last_run_at).toLocaleString() : 'Never'}
            </div>
          </div>
        ))}
      </div>

      {/* Section 2: This Week's Report */}
      {latestReport && (
        <div style={{
          background: '#12121a', borderRadius: 12, padding: 24, marginBottom: 32,
          border: '1px solid #222',
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: '#fff' }}>This Week&apos;s Report</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 24 }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 600, color: '#fff', marginBottom: 4 }}>
                {latestReport.report_title || latestReport.topic}
              </div>
              <div style={{ fontSize: 13, color: '#888' }}>
                <a href={`https://research.zavis.ai/reports/${latestReport.report_slug}`}
                   target="_blank" style={{ color: '#006828' }}>
                  research.zavis.ai/reports/{latestReport.report_slug}
                </a>
              </div>
              <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                {latestReport.published_at ? `Published ${new Date(latestReport.published_at).toLocaleDateString()}` : 'Not yet published'}
              </div>
            </div>
            <MetricCard
              label="Score"
              value={latestScore ? `${latestScore.composite_score.toFixed(0)}/100` : '--'}
              color={latestScore && latestScore.composite_score >= 75 ? '#006828' : '#d4a855'}
            />
            <MetricCard label="Posts Queued" value={String(queue.length)} color="#3a86ff" />
            <MetricCard
              label="Posts Done"
              value={String(queue.filter(q => q.status === 'posted').length)}
              color="#006828"
            />
          </div>
        </div>
      )}

      {/* Section 3: Post Queue */}
      <div style={{
        background: '#12121a', borderRadius: 12, padding: 24, marginBottom: 32,
        border: '1px solid #222',
      }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: '#fff' }}>Post Queue</h2>
        {queue.length === 0 ? (
          <div style={{ color: '#666', fontSize: 14 }}>No posts in queue</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #222' }}>
                <th style={thStyle}>#</th>
                <th style={thStyle}>Angle</th>
                <th style={thStyle}>Type</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Posted</th>
              </tr>
            </thead>
            <tbody>
              {queue.map(q => (
                <tr key={q.id} style={{ borderBottom: '1px solid #1a1a2a' }}>
                  <td style={tdStyle}>{q.post_number}/{q.total_posts}</td>
                  <td style={tdStyle}>{q.angle}</td>
                  <td style={tdStyle}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 4, fontSize: 11,
                      background: q.media_type === 'video' ? '#1a1a3a' : '#1a2a1a',
                      color: q.media_type === 'video' ? '#7b9bff' : '#4ade80',
                    }}>
                      {q.media_type}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ color: STATUS_COLORS[q.status] || '#888' }}>
                      {q.status}
                    </span>
                    {q.error_message && (
                      <span style={{ fontSize: 11, color: '#e63946', display: 'block' }}>{q.error_message}</span>
                    )}
                  </td>
                  <td style={tdStyle}>{q.posted_at ? new Date(q.posted_at).toLocaleString() : '--'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Section 4: Run History */}
      <div style={{
        background: '#12121a', borderRadius: 12, padding: 24, marginBottom: 32,
        border: '1px solid #222',
      }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: '#fff' }}>Run History</h2>
        {runs.map(run => (
          <div key={run.id} style={{
            borderBottom: '1px solid #1a1a2a', padding: '12px 0',
            cursor: 'pointer',
          }}
          onClick={() => setExpandedRun(expandedRun === run.id ? null : run.id)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{
                  color: STATUS_COLORS[run.status] || '#888', fontWeight: 600, fontSize: 13,
                }}>
                  {run.status.toUpperCase()}
                </span>
                <span style={{ color: '#888', fontSize: 13, marginLeft: 12 }}>
                  {run.run_type.replace(/_/g, ' ')}
                </span>
                {run.topic && <span style={{ color: '#aaa', fontSize: 13, marginLeft: 12 }}>{run.topic}</span>}
              </div>
              <span style={{ color: '#666', fontSize: 12 }}>
                {new Date(run.started_at).toLocaleString()}
                {run.completed_at && ` (${((new Date(run.completed_at).getTime() - new Date(run.started_at).getTime()) / 1000 / 60).toFixed(1)} min)`}
              </span>
            </div>
            {run.error_message && (
              <div style={{ color: '#e63946', fontSize: 12, marginTop: 4 }}>{run.error_message}</div>
            )}
            {expandedRun === run.id && run.stage_log && run.stage_log.length > 0 && (
              <div style={{ marginTop: 12, paddingLeft: 16 }}>
                {run.stage_log.map((stage, i) => (
                  <div key={i} style={{ fontSize: 12, padding: '4px 0', color: stage.status === 'failed' ? '#e63946' : stage.status === 'completed' ? '#4ade80' : '#888' }}>
                    {stage.status === 'completed' ? '\u2713' : stage.status === 'failed' ? '\u2717' : '\u25CB'}{' '}
                    {stage.stage}
                    {stage.duration_ms && ` (${(stage.duration_ms / 1000).toFixed(1)}s)`}
                    {stage.output && <span style={{ color: '#666' }}> — {stage.output}</span>}
                    {stage.error && <span style={{ color: '#e63946' }}> — {stage.error}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {runs.length === 0 && <div style={{ color: '#666', fontSize: 14 }}>No automation runs yet</div>}
      </div>

      {/* Section 5: Notifications */}
      <div style={{
        background: '#12121a', borderRadius: 12, padding: 24, marginBottom: 32,
        border: '1px solid #222',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>
            Notifications {unreadCount > 0 && (
              <span style={{
                background: '#e63946', color: '#fff', borderRadius: 10, padding: '2px 8px',
                fontSize: 11, marginLeft: 8, fontWeight: 400,
              }}>
                {unreadCount}
              </span>
            )}
          </h2>
          {unreadCount > 0 && (
            <button onClick={markAllRead} style={{
              background: 'none', border: '1px solid #333', color: '#888',
              padding: '4px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 12,
            }}>
              Mark all read
            </button>
          )}
        </div>
        {notifications.slice(0, 10).map(n => (
          <div key={n.id} style={{
            padding: '10px 0', borderBottom: '1px solid #1a1a2a',
            opacity: n.read ? 0.6 : 1,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: SEVERITY_COLORS[n.severity] || '#666',
                display: 'inline-block', flexShrink: 0,
              }} />
              <span style={{ fontWeight: 600, fontSize: 13, color: '#fff' }}>{n.title}</span>
              <span style={{ fontSize: 11, color: '#666', marginLeft: 'auto' }}>
                {new Date(n.created_at).toLocaleString()}
              </span>
            </div>
            <div style={{ fontSize: 12, color: '#888', marginTop: 4, paddingLeft: 16 }}>{n.message}</div>
          </div>
        ))}
        {notifications.length === 0 && <div style={{ color: '#666', fontSize: 14 }}>No notifications</div>}
      </div>

      {/* Section 6: Performance Trends */}
      <div style={{
        background: '#12121a', borderRadius: 12, padding: 24, marginBottom: 32,
        border: '1px solid #222',
      }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: '#fff' }}>Performance Trends</h2>
        {insights.length === 0 ? (
          <div style={{ color: '#666', fontSize: 14 }}>No insights yet. First review runs on Friday.</div>
        ) : (
          <div>
            {/* Score timeline */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 24, overflowX: 'auto' }}>
              {insights.map(i => (
                <div key={i.week_start} style={{
                  background: '#0a0a14', borderRadius: 8, padding: '12px 16px', minWidth: 120,
                  border: '1px solid #1a1a2a',
                }}>
                  <div style={{ fontSize: 11, color: '#666' }}>Week of {i.week_start}</div>
                  <div style={{ fontSize: 13, color: '#fff', marginTop: 4 }}>{i.report_slug || '--'}</div>
                  {i.recommendations?.next_topic_category && (
                    <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>
                      Next: {i.recommendations.next_topic_category}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Latest recommendations */}
            {insights[0]?.recommendations && (
              <div>
                <h3 style={{ fontSize: 13, fontWeight: 600, color: '#888', marginBottom: 8 }}>Latest Recommendations</h3>
                <pre style={{ fontSize: 12, color: '#aaa', background: '#0a0a14', padding: 12, borderRadius: 8, overflow: 'auto' }}>
                  {JSON.stringify(insights[0].recommendations, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function MetricCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 28, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>{label}</div>
    </div>
  )
}

const thStyle: React.CSSProperties = {
  textAlign: 'left', padding: '8px 12px', color: '#666', fontWeight: 500, fontSize: 12,
}
const tdStyle: React.CSSProperties = {
  padding: '10px 12px', color: '#ccc',
}
