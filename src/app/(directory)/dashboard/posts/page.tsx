'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import type { LinkedInPost } from '@/types/dashboard'

export default function PostsPage() {
  const [posts, setPosts] = useState<LinkedInPost[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('')

  const fetchPosts = useCallback(() => {
    const url = filter ? `/api/research/posts?status=${filter}` : '/api/research/posts'
    fetch(url)
      .then(r => r.json())
      .then(data => setPosts(data.posts || []))
      .finally(() => setLoading(false))
  }, [filter])

  useEffect(() => { fetchPosts() }, [fetchPosts])

  const handleAction = async (postId: string, action: string) => {
    await fetch('/api/research/posts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: postId, action }),
    })
    fetchPosts()
  }

  const draftCount = posts.filter(p => p.status === 'draft').length
  const approvedCount = posts.filter(p => p.status === 'approved').length
  const postedCount = posts.filter(p => p.status === 'posted').length

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>LinkedIn Posts</h1>
      <p style={{ color: '#5e5e72', fontSize: 14, marginBottom: 24 }}>
        Review and approve LinkedIn posts generated from published research.
      </p>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {[
          { key: '', label: 'All', count: posts.length },
          { key: 'draft', label: 'Pending', count: draftCount },
          { key: 'approved', label: 'Approved', count: approvedCount },
          { key: 'posted', label: 'Posted', count: postedCount },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)} style={{
            padding: '6px 14px', borderRadius: 6, border: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: 500,
            background: filter === f.key ? 'rgba(0,104,40,0.15)' : 'rgba(255,255,255,0.04)',
            color: filter === f.key ? '#f0ece4' : '#5e5e72',
          }}>
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#5e5e72' }}>Loading...</div>
      ) : posts.length === 0 ? (
        <div style={{
          background: '#12121a', borderRadius: 12, padding: 40,
          border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center', color: '#5e5e72',
        }}>
          No posts{filter ? ` with status "${filter}"` : ''} yet.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {posts.map(post => (
            <div key={post.id} style={{
              background: '#12121a', borderRadius: 12, padding: 20,
              border: '1px solid rgba(255,255,255,0.06)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{
                    fontSize: 12, fontWeight: 600, textTransform: 'uppercase',
                    color: post.account === 'founder' ? '#d4a855' : '#3a86ff',
                  }}>
                    {post.account}
                  </span>
                  <span style={{
                    padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600,
                    background: post.status === 'draft' ? '#ff6b3520' : '#00682820',
                    color: post.status === 'draft' ? '#ff6b35' : '#006828',
                  }}>
                    {post.status}
                  </span>
                </div>
                <span style={{ fontSize: 12, color: '#5e5e72' }}>
                  {new Date(post.created_at).toLocaleDateString()}
                </span>
              </div>

              <div style={{
                fontSize: 14, color: '#f0ece4', whiteSpace: 'pre-wrap',
                lineHeight: 1.6, marginBottom: 12,
                maxHeight: 200, overflow: 'hidden',
              }}>
                {post.content}
              </div>

              {post.first_comment && (
                <div style={{ fontSize: 12, color: '#5e5e72', marginBottom: 12 }}>
                  First comment: {post.first_comment}
                </div>
              )}

              <div style={{ display: 'flex', gap: 8 }}>
                {post.status === 'draft' && (
                  <button onClick={() => handleAction(post.id, 'approve')}
                    style={actionBtn('#006828')}>
                    Approve
                  </button>
                )}
                {post.run_id && (
                  <Link href={`/dashboard/pipeline/${post.run_id}`}
                    style={{ ...actionBtn('transparent'), border: '1px solid rgba(255,255,255,0.1)', color: '#9a9aaf' }}>
                    View Pipeline
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const actionBtn = (bg: string): React.CSSProperties => ({
  padding: '6px 14px', borderRadius: 6, border: 'none', cursor: 'pointer',
  fontSize: 13, fontWeight: 600, color: '#fff', background: bg, textDecoration: 'none',
  display: 'inline-block',
})
