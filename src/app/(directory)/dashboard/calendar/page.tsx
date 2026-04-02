'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'

// ─── Types ───────────────────────────────────────────────────────────────────

type EventType = 'report' | 'linkedin' | 'email' | 'video'
type EventStatus = 'scheduled' | 'draft' | 'ready'
type ViewMode = 'daily' | 'weekly' | 'monthly'
type FilterType = 'all' | EventType

interface CalendarEvent {
  id: string
  date: string          // YYYY-MM-DD
  time: string          // HH:MM (24h)
  type: EventType
  title: string
  account?: string
  contentPreview: string
  assets?: string
  reportLink?: string
  status: EventStatus
  extra?: string        // additional context like video duration, segment, subject line
}

// ─── API Response Types ─────────────────────────────────────────────────────

interface PostRow {
  id: string
  account: string
  status: string
  content: string
  first_comment?: string
  hashtags?: string
  assets?: string
  scheduled_for?: string
  posted_at?: string
  created_at: string
}

interface EmailRow {
  id: string
  subject: string
  preview_text: string
  status: string
  segment?: string
  send_count?: number
  created_at: string
}

interface PipelineRun {
  id: string
  topic: string
  status: string
  report_title?: string
  report_slug?: string
  report_category?: string
  published_at?: string
  created_at: string
}

interface QueueItem {
  id: string
  report_slug: string
  post_number: number
  angle?: string
  media_type?: string
  status: string
  scheduled_for?: string
  content?: string
  brief?: string
}

// ─── Constants ───────────────────────────────────────────────────────────────

const TYPE_COLORS: Record<EventType, string> = {
  report: '#7b2cbf',
  linkedin: '#0077b5',
  email: '#e63946',
  video: '#d4a855',
}

const STATUS_STYLES: Record<EventStatus, { bg: string; color: string }> = {
  scheduled: { bg: '#e6f4ea', color: '#006828' },
  draft:     { bg: '#fff3cd', color: '#856404' },
  ready:     { bg: '#dbeafe', color: '#1d4ed8' },
}

const FILTER_OPTIONS: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'report', label: 'Reports' },
  { value: 'linkedin', label: 'LinkedIn Posts' },
  { value: 'email', label: 'Email Blasts' },
  { value: 'video', label: 'Videos' },
]

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const POLL_INTERVAL_MS = 30_000

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTime(time24: string): string {
  const [h, m] = time24.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`
}

function formatDateFull(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

function getToday(): string {
  const now = new Date()
  return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`
}

/** Get the Monday of the week containing the given date */
function getWeekStart(dateStr: string): Date {
  const d = new Date(dateStr + 'T00:00:00')
  const day = d.getDay() // 0=Sun, 1=Mon, ...
  const diff = day === 0 ? -6 : 1 - day // shift to Monday
  d.setDate(d.getDate() + diff)
  return d
}

function getWeekDates(today: string): { day: string; date: string; label: string }[] {
  const monday = getWeekStart(today)
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return days.map((day, i) => {
    const d = new Date(monday)
    d.setDate(d.getDate() + i)
    const dateStr = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`
    return { day, date: dateStr, label: `${months[d.getMonth()]} ${d.getDate()}` }
  })
}

function getWeekLabel(weekDates: { label: string }[]): string {
  if (weekDates.length < 7) return ''
  return `Week of ${weekDates[0].label} \u2013 ${weekDates[6].label}`
}

function getMonthGrid(today: string): { grid: (string | null)[][]; year: number; month: number } {
  const d = new Date(today + 'T00:00:00')
  const year = d.getFullYear()
  const month = d.getMonth() // 0-indexed
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayOfWeek = new Date(year, month, 1).getDay() // 0=Sun
  // Convert to Mon=0 ... Sun=6
  const firstDayCol = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1

  const grid: (string | null)[][] = []
  let row: (string | null)[] = []
  for (let i = 0; i < firstDayCol; i++) row.push(null)
  for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
    const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${dayNum.toString().padStart(2, '0')}`
    row.push(dateStr)
    if (row.length === 7) {
      grid.push(row)
      row = []
    }
  }
  if (row.length > 0) {
    while (row.length < 7) row.push(null)
    grid.push(row)
  }
  return { grid, year, month }
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

/** Extract date (YYYY-MM-DD) and time (HH:MM) from an ISO string or date string */
function extractDateTime(isoStr: string | undefined | null): { date: string; time: string } {
  if (!isoStr) return { date: '', time: '09:00' }
  try {
    const d = new Date(isoStr)
    if (isNaN(d.getTime())) return { date: '', time: '09:00' }
    const date = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`
    const time = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
    return { date, time }
  } catch {
    return { date: '', time: '09:00' }
  }
}

/** Map API status strings to the CalendarEvent status */
function mapPostStatus(status: string): EventStatus {
  switch (status.toLowerCase()) {
    case 'posted':
    case 'published':
    case 'approved':
    case 'scheduled':
      return 'scheduled'
    case 'ready':
      return 'ready'
    default:
      return 'draft'
  }
}

function mapEmailStatus(status: string): EventStatus {
  switch (status.toLowerCase()) {
    case 'sent':
    case 'delivered':
      return 'scheduled'
    case 'ready':
      return 'ready'
    default:
      return 'draft'
  }
}

// ─── Data Fetching ──────────────────────────────────────────────────────────

function buildEventsFromData(
  posts: PostRow[],
  emails: EmailRow[],
  runs: PipelineRun[],
  queue: QueueItem[],
): CalendarEvent[] {
  const events: CalendarEvent[] = []

  // LinkedIn posts
  for (const post of posts) {
    const { date, time } = extractDateTime(post.scheduled_for || post.posted_at || post.created_at)
    if (!date) continue
    const contentSnippet = (post.content || '').slice(0, 200)
    const assetCount = post.assets ? (() => {
      try {
        const parsed = JSON.parse(post.assets)
        return Array.isArray(parsed) ? parsed.length : 0
      } catch {
        return post.assets ? 1 : 0
      }
    })() : 0

    events.push({
      id: `post-${post.id}`,
      date,
      time,
      type: 'linkedin',
      title: contentSnippet.split('\n')[0]?.slice(0, 80) || 'LinkedIn Post',
      account: post.account || undefined,
      contentPreview: contentSnippet,
      assets: assetCount > 0 ? `${assetCount} image${assetCount > 1 ? 's' : ''}` : undefined,
      status: mapPostStatus(post.status),
    })
  }

  // Email blasts
  for (const email of emails) {
    const { date, time } = extractDateTime(email.created_at)
    if (!date) continue
    events.push({
      id: `email-${email.id}`,
      date,
      time,
      type: 'email',
      title: email.subject || 'Email Blast',
      contentPreview: email.preview_text || email.subject || '',
      status: mapEmailStatus(email.status),
      extra: [
        email.segment ? `Segment: ${email.segment}` : null,
        email.send_count ? `Sent: ${email.send_count}` : null,
      ].filter(Boolean).join(' | ') || undefined,
    })
  }

  // Published pipeline runs -> Report events
  for (const run of runs) {
    if (run.status !== 'published') continue
    const { date, time } = extractDateTime(run.published_at || run.created_at)
    if (!date) continue
    events.push({
      id: `report-${run.id}`,
      date,
      time,
      type: 'report',
      title: run.report_title || run.topic || 'Report',
      contentPreview: `Published report: ${run.report_title || run.topic}`,
      reportLink: run.report_slug ? `https://research.zavis.ai/reports/${run.report_slug}` : undefined,
      status: 'scheduled',
      extra: run.report_category ? `Category: ${run.report_category}` : undefined,
    })
  }

  // Post queue items with scheduled_for
  for (const item of queue) {
    if (!item.scheduled_for) continue
    const { date, time } = extractDateTime(item.scheduled_for)
    if (!date) continue
    // Avoid duplicating if we already have a post with matching content
    const isVideo = item.media_type?.toLowerCase() === 'video'
    events.push({
      id: `queue-${item.id}`,
      date,
      time,
      type: isVideo ? 'video' : 'linkedin',
      title: item.angle || `Scheduled Post #${item.post_number}`,
      contentPreview: item.content || item.brief || item.angle || '',
      status: item.status === 'posted' ? 'scheduled' : item.status === 'ready' ? 'ready' : 'draft',
      extra: item.media_type ? `Media: ${item.media_type}` : undefined,
    })
  }

  return events
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function EventCard({ event, expanded }: { event: CalendarEvent; expanded: boolean }) {
  const typeColor = TYPE_COLORS[event.type]
  const statusStyle = STATUS_STYLES[event.status]

  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid #e8e3da',
      borderRadius: 8,
      borderLeft: `4px solid ${typeColor}`,
      padding: expanded ? 16 : 10,
      marginBottom: 8,
      transition: 'box-shadow 0.15s ease',
    }}>
      {/* Time */}
      <div style={{
        fontFamily: "'Space Mono', monospace",
        fontSize: 11,
        color: '#999',
        marginBottom: 4,
      }}>
        {formatTime(event.time)}
      </div>

      {/* Title */}
      <div style={{
        fontFamily: "'DM Sans', sans-serif",
        fontWeight: 600,
        fontSize: expanded ? 15 : 13,
        color: '#1a1a1a',
        lineHeight: 1.3,
        marginBottom: 6,
      }}>
        {event.title}
      </div>

      {/* Account badge */}
      {event.account && (
        <span style={{
          display: 'inline-block',
          background: '#e6f4ea',
          color: '#006828',
          fontSize: 10,
          fontWeight: 600,
          padding: '2px 8px',
          borderRadius: 99,
          marginBottom: 6,
          fontFamily: "'DM Sans', sans-serif",
          letterSpacing: '0.02em',
        }}>
          {event.account}
        </span>
      )}

      {/* Content preview */}
      <div style={{
        fontSize: 12,
        color: '#666',
        lineHeight: 1.5,
        marginBottom: 6,
        ...(expanded ? {} : {
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical' as const,
          overflow: 'hidden',
        }),
      }}>
        {event.contentPreview}
      </div>

      {/* Extra info (email segment, video duration) */}
      {expanded && event.extra && (
        <div style={{
          fontSize: 11,
          color: '#999',
          marginBottom: 6,
          fontFamily: "'Space Mono', monospace",
        }}>
          {event.extra}
        </div>
      )}

      {/* Bottom row: assets, status, link */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap',
        marginTop: 4,
      }}>
        {/* Assets indicator */}
        {event.assets && (
          <span style={{
            fontSize: 11,
            color: '#999',
            display: 'flex',
            alignItems: 'center',
            gap: 3,
          }}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="#999" strokeWidth="1.5">
              {event.assets.includes('video') ? (
                <path d="M2 4h8v8H2zM10 6.5l4-2v7l-4-2z" />
              ) : (
                <>
                  <rect x="1" y="3" width="14" height="10" rx="1.5" />
                  <circle cx="5.5" cy="7" r="1.5" />
                  <path d="M1 11l3.5-3 2.5 2 3-3.5L15 11" />
                </>
              )}
            </svg>
            {event.assets}
          </span>
        )}

        {/* Status badge */}
        <span style={{
          fontSize: 10,
          fontWeight: 600,
          padding: '2px 8px',
          borderRadius: 99,
          background: statusStyle.bg,
          color: statusStyle.color,
          textTransform: 'capitalize',
          fontFamily: "'DM Sans', sans-serif",
        }}>
          {event.status}
        </span>

        {/* Report link */}
        {event.reportLink && (
          <a
            href={event.reportLink}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              color: '#999',
              transition: 'color 0.15s ease',
            }}
            title="View report"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 3H3a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-3" />
              <path d="M9 1h6v6" />
              <path d="M15 1L7 9" />
            </svg>
          </a>
        )}
      </div>
    </div>
  )
}

function LoadingSpinner() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '64px 0',
    }}>
      <div style={{
        width: 32,
        height: 32,
        border: '3px solid #e8e3da',
        borderTopColor: '#006828',
        borderRadius: '50%',
        animation: 'calendar-spin 0.8s linear infinite',
      }} />
      <style>{`
        @keyframes calendar-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

function EmptyState() {
  return (
    <div style={{
      textAlign: 'center',
      padding: '64px 24px',
      color: '#999',
    }}>
      <div style={{
        fontSize: 40,
        marginBottom: 16,
        opacity: 0.4,
      }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="1.5" style={{ display: 'inline-block' }}>
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
      </div>
      <div style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 16,
        fontWeight: 600,
        color: '#666',
        marginBottom: 8,
      }}>
        No content scheduled this week
      </div>
      <div style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 13,
        color: '#999',
        maxWidth: 360,
        margin: '0 auto',
        lineHeight: 1.5,
      }}>
        Run the weekly pipeline to populate the calendar with reports, LinkedIn posts, emails, and videos.
      </div>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function CalendarPage() {
  const [view, setView] = useState<ViewMode>('weekly')
  const [activeFilters, setActiveFilters] = useState<Set<FilterType>>(() => new Set<FilterType>(['all']))
  const [expandedMonthDay, setExpandedMonthDay] = useState<string | null>(null)

  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const today = getToday()
  const weekDates = useMemo(() => getWeekDates(today), [today])
  const [selectedDay, setSelectedDay] = useState<string>(weekDates[0]?.date || today)
  const { grid: monthGrid, year: monthYear, month: monthIndex } = useMemo(() => getMonthGrid(today), [today])

  // Determine which week dates are "this week" for highlighting in monthly view
  const weekDateSet = useMemo(() => new Set(weekDates.map(wd => wd.date)), [weekDates])

  const fetchData = useCallback(async () => {
    try {
      const [postsRes, emailsRes, runsRes] = await Promise.all([
        fetch('/api/research/posts').then(r => r.ok ? r.json() : { posts: [] }).catch(() => ({ posts: [] })),
        fetch('/api/research/emails').then(r => r.ok ? r.json() : { emails: [] }).catch(() => ({ emails: [] })),
        fetch('/api/research/pipeline/runs').then(r => r.ok ? r.json() : { runs: [] }).catch(() => ({ runs: [] })),
      ])

      const posts: PostRow[] = postsRes.posts || []
      const emails: EmailRow[] = emailsRes.emails || []
      const runs: PipelineRun[] = runsRes.runs || []

      // Fetch queue for the latest published report
      let queue: QueueItem[] = []
      const latestPublished = runs.find((r: PipelineRun) => r.status === 'published' && r.report_slug)
      if (latestPublished?.report_slug) {
        try {
          const queueRes = await fetch(`/api/research/automation/queue?report_slug=${encodeURIComponent(latestPublished.report_slug)}`)
          if (queueRes.ok) {
            const queueData = await queueRes.json()
            queue = queueData.queue || []
          }
        } catch {
          // Non-critical, continue without queue data
        }
      }

      const built = buildEventsFromData(posts, emails, runs, queue)
      setEvents(built)
      setError(null)
    } catch (err) {
      console.error('Failed to fetch calendar data:', err)
      setError('Failed to load calendar data. Retrying...')
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial fetch + polling every 30s
  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [fetchData])

  // Filter events
  const filteredEvents = useMemo(() => {
    if (activeFilters.has('all')) return events
    return events.filter(e => activeFilters.has(e.type))
  }, [activeFilters, events])

  const eventsForDate = (date: string) =>
    filteredEvents.filter(e => e.date === date).sort((a, b) => a.time.localeCompare(b.time))

  const toggleFilter = (f: FilterType) => {
    setActiveFilters(prev => {
      const next = new Set<FilterType>(prev)
      if (f === 'all') {
        return new Set<FilterType>(['all'])
      }
      next.delete('all')
      if (next.has(f)) {
        next.delete(f)
        if (next.size === 0) return new Set<FilterType>(['all'])
      } else {
        next.add(f)
      }
      return next
    })
  }

  // Time slots for daily view
  const timeSlots = Array.from({ length: 13 }, (_, i) => i + 6) // 6 AM to 6 PM

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Header row */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        flexWrap: 'wrap',
        gap: 12,
      }}>
        <div>
          <h1 style={{
            fontSize: 24,
            fontWeight: 700,
            fontFamily: "'DM Sans', sans-serif",
            margin: 0,
          }}>
            Content Calendar
          </h1>
          <p style={{
            fontSize: 13,
            color: '#666',
            margin: '4px 0 0',
            fontFamily: "'DM Sans', sans-serif",
          }}>
            {getWeekLabel(weekDates)}, {monthYear}
          </p>
        </div>

        {/* View toggle */}
        <div style={{ display: 'flex', gap: 0, borderRadius: 8, overflow: 'hidden', border: '1px solid #e8e3da' }}>
          {(['daily', 'weekly', 'monthly'] as ViewMode[]).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{
                padding: '8px 18px',
                fontSize: 13,
                fontWeight: 600,
                fontFamily: "'DM Sans', sans-serif",
                border: 'none',
                borderRight: v !== 'monthly' ? '1px solid #e8e3da' : 'none',
                cursor: 'pointer',
                textTransform: 'capitalize',
                background: view === v ? '#006828' : '#ffffff',
                color: view === v ? '#ffffff' : '#666',
                transition: 'all 0.15s ease',
              }}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Filter bar */}
      <div style={{
        display: 'flex',
        gap: 8,
        marginBottom: 24,
        flexWrap: 'wrap',
      }}>
        {FILTER_OPTIONS.map(f => {
          const isActive = activeFilters.has(f.value)
          const dotColor = f.value !== 'all' ? TYPE_COLORS[f.value as EventType] : undefined
          return (
            <button
              key={f.value}
              onClick={() => toggleFilter(f.value)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                fontSize: 12,
                fontWeight: 600,
                fontFamily: "'DM Sans', sans-serif",
                border: isActive ? '1.5px solid transparent' : '1px solid #e8e3da',
                borderRadius: 99,
                cursor: 'pointer',
                background: isActive ? (dotColor || '#006828') : '#ffffff',
                color: isActive ? '#ffffff' : '#666',
                transition: 'all 0.15s ease',
                opacity: isActive ? 1 : 0.85,
              }}
            >
              {dotColor && !isActive && (
                <span style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: dotColor,
                  flexShrink: 0,
                }} />
              )}
              {f.label}
            </button>
          )
        })}
      </div>

      {/* Error banner */}
      {error && (
        <div style={{
          background: '#fff3cd',
          border: '1px solid #ffc107',
          borderRadius: 8,
          padding: '12px 16px',
          marginBottom: 16,
          fontSize: 13,
          color: '#856404',
          fontFamily: "'DM Sans', sans-serif",
        }}>
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading && <LoadingSpinner />}

      {/* Empty state (only show after loading completes) */}
      {!loading && events.length === 0 && !error && <EmptyState />}

      {/* ─── Weekly View ─────────────────────────────────────────────── */}
      {!loading && view === 'weekly' && events.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 12,
        }}>
          {weekDates.map(wd => {
            const dayEvents = eventsForDate(wd.date)
            const isToday = wd.date === today
            const isWeekend = wd.day === 'Sat' || wd.day === 'Sun'
            return (
              <div key={wd.date} style={{
                minHeight: 200,
                borderLeft: isToday ? '3px solid #006828' : '1px solid transparent',
                paddingLeft: isToday ? 9 : 12,
                background: isWeekend ? '#faf7f2' : 'transparent',
                borderRadius: 8,
                padding: 12,
              }}>
                {/* Day header */}
                <div style={{ marginBottom: 12, textAlign: 'center' }}>
                  <div style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: isToday ? '#006828' : '#999',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    fontFamily: "'DM Sans', sans-serif",
                    marginBottom: 2,
                  }}>
                    {wd.day}
                  </div>
                  <div style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 18,
                    fontWeight: 700,
                    color: isToday ? '#006828' : '#1a1a1a',
                  }}>
                    {parseInt(wd.label.split(' ')[1])}
                  </div>
                </div>

                {/* Events */}
                {dayEvents.length > 0 ? (
                  dayEvents.map(ev => <EventCard key={ev.id} event={ev} expanded={false} />)
                ) : (
                  <div style={{
                    textAlign: 'center',
                    fontSize: 12,
                    color: '#ccc',
                    paddingTop: 24,
                    fontStyle: 'italic',
                  }}>
                    {isWeekend ? 'Weekend' : 'No content'}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ─── Daily View ──────────────────────────────────────────────── */}
      {!loading && view === 'daily' && events.length > 0 && (
        <div>
          {/* Day selector */}
          <div style={{
            display: 'flex',
            gap: 8,
            marginBottom: 24,
          }}>
            {weekDates.map(wd => (
              <button
                key={wd.date}
                onClick={() => setSelectedDay(wd.date)}
                style={{
                  padding: '8px 16px',
                  fontSize: 12,
                  fontWeight: 600,
                  fontFamily: "'Space Mono', monospace",
                  border: selectedDay === wd.date ? '2px solid #006828' : '1px solid #e8e3da',
                  borderRadius: 8,
                  cursor: 'pointer',
                  background: selectedDay === wd.date ? '#e6f4ea' : '#ffffff',
                  color: selectedDay === wd.date ? '#006828' : '#666',
                  transition: 'all 0.15s ease',
                }}
              >
                {wd.day} {parseInt(wd.label.split(' ')[1])}
              </button>
            ))}
          </div>

          <h2 style={{
            fontSize: 18,
            fontWeight: 700,
            fontFamily: "'DM Sans', sans-serif",
            marginBottom: 20,
          }}>
            {formatDateFull(selectedDay)}
          </h2>

          {/* Timeline */}
          <div style={{ position: 'relative', paddingLeft: 72 }}>
            {timeSlots.map(hour => {
              const hourStr = hour.toString().padStart(2, '0')
              const eventsAtHour = eventsForDate(selectedDay).filter(e => {
                const evHour = parseInt(e.time.split(':')[0])
                return evHour === hour
              })

              return (
                <div key={hour} style={{
                  position: 'relative',
                  minHeight: eventsAtHour.length > 0 ? 'auto' : 48,
                  borderTop: '1px solid #f0ebe0',
                  paddingTop: 8,
                  paddingBottom: 8,
                  marginBottom: 0,
                }}>
                  {/* Time label */}
                  <div style={{
                    position: 'absolute',
                    left: -72,
                    top: 6,
                    width: 60,
                    textAlign: 'right',
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 12,
                    color: '#999',
                  }}>
                    {formatTime(`${hourStr}:00`)}
                  </div>

                  {/* Events at this hour */}
                  {eventsAtHour.map(ev => (
                    <div key={ev.id} style={{ maxWidth: 560, marginBottom: 8 }}>
                      <EventCard event={ev} expanded={true} />
                    </div>
                  ))}
                </div>
              )
            })}

            {eventsForDate(selectedDay).length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: '48px 0',
                color: '#999',
                fontSize: 14,
              }}>
                No content scheduled for this day.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Monthly View ────────────────────────────────────────────── */}
      {!loading && view === 'monthly' && events.length > 0 && (
        <div>
          <h2 style={{
            fontSize: 18,
            fontWeight: 700,
            fontFamily: "'DM Sans', sans-serif",
            marginBottom: 16,
          }}>
            {MONTH_NAMES[monthIndex]} {monthYear}
          </h2>

          {/* Day-of-week headers */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: 1,
            marginBottom: 1,
          }}>
            {DAYS_OF_WEEK.map(d => (
              <div key={d} style={{
                textAlign: 'center',
                fontSize: 11,
                fontWeight: 600,
                color: '#999',
                padding: '8px 0',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                fontFamily: "'DM Sans', sans-serif",
              }}>
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          {monthGrid.map((week, wi) => (
            <div key={wi} style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: 1,
            }}>
              {week.map((dateStr, di) => {
                if (!dateStr) {
                  return <div key={`empty-${wi}-${di}`} style={{
                    minHeight: 80,
                    background: '#faf7f2',
                    borderRadius: 4,
                    margin: 1,
                  }} />
                }

                const dayNum = parseInt(dateStr.split('-')[2])
                const dayEvents = eventsForDate(dateStr)
                const isInTargetWeek = weekDateSet.has(dateStr)
                const isToday = dateStr === today
                const isExpanded = expandedMonthDay === dateStr

                return (
                  <div
                    key={dateStr}
                    onClick={() => setExpandedMonthDay(isExpanded ? null : dateStr)}
                    style={{
                      minHeight: isExpanded ? 'auto' : 80,
                      background: isInTargetWeek ? '#fffef8' : '#ffffff',
                      border: isToday ? '2px solid #006828' : '1px solid #f0ebe0',
                      borderRadius: 6,
                      margin: 1,
                      padding: 8,
                      cursor: dayEvents.length > 0 ? 'pointer' : 'default',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {/* Day number */}
                    <div style={{
                      fontFamily: "'Space Mono', monospace",
                      fontSize: 13,
                      fontWeight: isToday ? 700 : 400,
                      color: isToday ? '#006828' : '#1a1a1a',
                      marginBottom: 4,
                    }}>
                      {dayNum}
                    </div>

                    {/* Dots / expanded events */}
                    {!isExpanded ? (
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {dayEvents.map(ev => (
                          <span key={ev.id} style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: TYPE_COLORS[ev.type],
                            display: 'inline-block',
                          }} />
                        ))}
                      </div>
                    ) : (
                      <div style={{ marginTop: 4 }}>
                        {dayEvents.map(ev => (
                          <div key={ev.id} style={{
                            fontSize: 11,
                            color: '#1a1a1a',
                            padding: '4px 0',
                            borderBottom: '1px solid #f0ebe0',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                          }}>
                            <span style={{
                              width: 6,
                              height: 6,
                              borderRadius: '50%',
                              background: TYPE_COLORS[ev.type],
                              flexShrink: 0,
                            }} />
                            <span style={{
                              fontFamily: "'Space Mono', monospace",
                              fontSize: 10,
                              color: '#999',
                              flexShrink: 0,
                            }}>
                              {formatTime(ev.time)}
                            </span>
                            <span style={{
                              fontWeight: 600,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}>
                              {ev.title}
                            </span>
                          </div>
                        ))}
                        {dayEvents.length === 0 && (
                          <div style={{ fontSize: 11, color: '#ccc', fontStyle: 'italic' }}>
                            No content
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      )}

      {/* ─── Responsive: stacked on mobile ───────────────────────────── */}
      <style>{`
        @media (max-width: 768px) {
          div[style*="grid-template-columns: repeat(7"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}
