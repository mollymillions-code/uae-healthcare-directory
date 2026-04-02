'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { PipelineRunSummary, PerformanceScore, AnalyticsRun } from '@/types/dashboard'

export default function AnalyticsPage() {
  const [runs, setRuns] = useState<AnalyticsRun[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Fetch completed runs with scores
    fetch('/api/research/pipeline/runs?status=complete')
      .then(r => {
        if (!r.ok) throw new Error(`Failed to fetch completed runs (${r.status})`)
        return r.json()
      })
      .then(async (data: { runs?: PipelineRunSummary[] }) => {
        const runsWithScores: AnalyticsRun[] = await Promise.all(
          (data.runs || []).map(async (run: PipelineRunSummary) => {
            const detail: { score: PerformanceScore | null } = await fetch(`/api/research/pipeline/runs/${run.id}`).then(r => r.json())
            return { ...run, score: detail.score }
          })
        )
        setRuns(runsWithScores)
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Something went wrong'))
      .finally(() => setLoading(false))
  }, [])

  // Also fetch published runs
  useEffect(() => {
    fetch('/api/research/pipeline/runs?status=published')
      .then(r => {
        if (!r.ok) throw new Error(`Failed to fetch published runs (${r.status})`)
        return r.json()
      })
      .then(async (data: { runs?: PipelineRunSummary[] }) => {
        const runsWithScores: AnalyticsRun[] = await Promise.all(
          (data.runs || []).map(async (run: PipelineRunSummary) => {
            const detail: { score: PerformanceScore | null } = await fetch(`/api/research/pipeline/runs/${run.id}`).then(r => r.json())
            return { ...run, score: detail.score }
          })
        )
        setRuns(prev => [...prev, ...runsWithScores])
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Something went wrong'))
  }, [])

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Performance Analytics</h1>
      <p style={{ color: '#5e5e72', fontSize: 14, marginBottom: 24 }}>
        Post-publish performance scores from LinkedIn, website traffic, email metrics, and search.
      </p>

      {error && (
        <p style={{ color: '#e63946', fontSize: 14, marginBottom: 16 }}>{error}</p>
      )}

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#5e5e72' }}>Loading...</div>
      ) : runs.length === 0 ? (
        <div style={{
          background: '#12121a', borderRadius: 12, padding: 40,
          border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center', color: '#5e5e72',
        }}>
          No performance data yet. Scores are collected 72 hours after publishing.
        </div>
      ) : (
        <div style={{
          background: '#12121a', borderRadius: 12,
          border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <th style={thStyle}>Report</th>
                <th style={thStyle}>Score</th>
                <th style={thStyle}>Published</th>
                <th style={thStyle}></th>
              </tr>
            </thead>
            <tbody>
              {runs.map(run => (
                <tr key={run.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <td style={tdStyle}>
                    <span style={{ fontWeight: 500 }}>{run.report_title || run.topic}</span>
                    <div style={{ fontSize: 12, color: '#5e5e72' }}>{run.report_category}</div>
                  </td>
                  <td style={tdStyle}>
                    {run.score ? (
                      <span style={{
                        fontSize: 20, fontWeight: 700,
                        color: run.score.composite_score >= 70 ? '#006828'
                          : run.score.composite_score >= 40 ? '#d4a855' : '#e63946',
                      }}>
                        {run.score.composite_score}
                      </span>
                    ) : (
                      <span style={{ color: '#5e5e72', fontSize: 13 }}>Pending</span>
                    )}
                  </td>
                  <td style={tdStyle}>
                    {run.published_at ? new Date(run.published_at).toLocaleDateString() : '-'}
                  </td>
                  <td style={tdStyle}>
                    <Link href={`/dashboard/pipeline/${run.id}`}
                      style={{ color: '#006828', textDecoration: 'none', fontSize: 13, fontWeight: 500 }}>
                      Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

const thStyle: React.CSSProperties = {
  textAlign: 'left', padding: '10px 20px', fontSize: 12, fontWeight: 600,
  color: '#5e5e72', textTransform: 'uppercase', letterSpacing: '0.05em',
}

const tdStyle: React.CSSProperties = {
  padding: '12px 20px', fontSize: 14, color: '#9a9aaf',
}
