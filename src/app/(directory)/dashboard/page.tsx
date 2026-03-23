'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface PipelineRun {
  id: string
  topic: string
  status: string
  report_title: string | null
  report_slug: string | null
  report_category: string | null
  source: string
  published_at: string | null
  created_at: string
  updated_at: string
}

const STATUS_COLORS: Record<string, string> = {
  research: '#3a86ff',
  synthesis: '#7b2cbf',
  rendering: '#d4a855',
  review: '#ff6b35',
  approved: '#2ec4b6',
  publishing: '#2ec4b6',
  published: '#006828',
  distributing: '#006828',
  complete: '#006828',
  failed: '#e63946',
}

export default function DashboardPage() {
  const [runs, setRuns] = useState<PipelineRun[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ review: 0, published: 0, inProgress: 0, total: 0 })

  useEffect(() => {
    fetch('/api/research/pipeline/runs')
      .then(r => r.json())
      .then(data => {
        setRuns(data.runs || [])
        const allRuns = data.runs || []
        const review = allRuns.filter((r: PipelineRun) => r.status === 'review').length
        const published = allRuns.filter((r: PipelineRun) => r.status === 'published' || r.status === 'complete').length
        const inProgress = allRuns.filter((r: PipelineRun) =>
          ['research', 'synthesis', 'rendering', 'approved', 'publishing', 'distributing'].includes(r.status)
        ).length
        setStats({ review, published, inProgress, total: allRuns.length })
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      {/* Page Header */}
      <h1 style={{
        fontSize: 24,
        fontWeight: 700,
        color: '#1a1a1a',
        margin: '0 0 24px 0',
        fontFamily: "'DM Sans', sans-serif",
      }}>
        Pipeline Overview
      </h1>

      {/* Stats Row — 4 columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        <StatCard label="Pending Review" value={stats.review} color="#d4a855" />
        <StatCard label="Published" value={stats.published} color="#006828" />
        <StatCard label="In Progress" value={stats.inProgress} color="#3a86ff" />
        <StatCard label="Total Runs" value={stats.total} color="#666" />
      </div>

      {/* Pipeline Runs Table */}
      <div style={{
        background: '#ffffff',
        borderRadius: 10,
        border: '1px solid #e8e3da',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid #f0ebe0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <h2 style={{
            fontSize: 15,
            fontWeight: 600,
            margin: 0,
            color: '#1a1a1a',
            fontFamily: "'DM Sans', sans-serif",
          }}>
            Pipeline Runs
          </h2>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#999' }}>Loading...</div>
        ) : runs.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#999', fontFamily: "'DM Sans', sans-serif" }}>
            No pipeline runs yet. The ecosystem will create runs when research is triggered.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #f0ebe0' }}>
                <th style={thStyle}>Topic</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Category</th>
                <th style={thStyle}>Source</th>
                <th style={thStyle}>Updated</th>
                <th style={thStyle}></th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run, i) => (
                <tr key={run.id} style={{
                  borderBottom: '1px solid #f0ebe0',
                  background: i % 2 === 0 ? '#ffffff' : '#faf7f2',
                }}>
                  <td style={tdStyle}>
                    <span style={{ fontWeight: 500, color: '#1a1a1a' }}>
                      {run.report_title || run.topic}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <span style={{
                      display: 'inline-block',
                      padding: '3px 12px',
                      borderRadius: 12,
                      fontSize: 12,
                      fontWeight: 600,
                      background: `${STATUS_COLORS[run.status] || '#666'}15`,
                      color: STATUS_COLORS[run.status] || '#666',
                      fontFamily: "'DM Sans', sans-serif",
                    }}>
                      {run.status}
                    </span>
                  </td>
                  <td style={tdStyle}>{run.report_category || '-'}</td>
                  <td style={tdStyle}>{run.source}</td>
                  <td style={tdStyle}>
                    {new Date(run.updated_at).toLocaleDateString()}
                  </td>
                  <td style={tdStyle}>
                    <Link
                      href={`/dashboard/pipeline/${run.id}`}
                      style={{
                        display: 'inline-block',
                        padding: '4px 14px',
                        borderRadius: 6,
                        border: '1px solid #006828',
                        color: '#006828',
                        textDecoration: 'none',
                        fontSize: 13,
                        fontWeight: 500,
                        fontFamily: "'DM Sans', sans-serif",
                        transition: 'all 0.15s ease',
                      }}
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{
      background: '#ffffff',
      borderRadius: 10,
      padding: 24,
      border: '1px solid #e8e3da',
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    }}>
      <div style={{
        fontSize: 32,
        fontWeight: 700,
        color,
        fontFamily: "'Space Mono', monospace",
        lineHeight: 1,
      }}>
        {value}
      </div>
      <div style={{
        fontSize: 11,
        color: '#999',
        marginTop: 8,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        fontWeight: 600,
        fontFamily: "'DM Sans', sans-serif",
      }}>
        {label}
      </div>
    </div>
  )
}

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '10px 24px',
  fontSize: 11,
  fontWeight: 600,
  color: '#999',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  fontFamily: "'DM Sans', sans-serif",
}

const tdStyle: React.CSSProperties = {
  padding: '12px 24px',
  fontSize: 14,
  color: '#666',
  fontFamily: "'DM Sans', sans-serif",
}
