const PLUNK_API_BASE = 'https://next-api.useplunk.com/v1'
const DEFAULT_FROM = 'research@zavis.ai'
const DEFAULT_FROM_NAME = 'Zavis Research'

function getKey(): string {
  if (!process.env.PLUNK_SECRET_KEY) {
    throw new Error('PLUNK_SECRET_KEY is not set')
  }
  return process.env.PLUNK_SECRET_KEY
}

async function plunkFetch(path: string, body: Record<string, unknown>) {
  const res = await fetch(`${PLUNK_API_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data?.error?.message || `Plunk API error: ${res.status}`)
  }
  return data
}

/**
 * Send a transactional email via Plunk.
 */
export async function sendEmail(opts: {
  to: string | string[]
  subject: string
  body: string
  from?: string
  name?: string
}) {
  const recipients = Array.isArray(opts.to) ? opts.to : [opts.to]
  const from = opts.from || DEFAULT_FROM

  const results = []
  for (const to of recipients) {
    try {
      const result = await plunkFetch('/send', {
        to,
        from,
        name: opts.name || DEFAULT_FROM_NAME,
        subject: opts.subject,
        body: opts.body,
      })
      results.push({ to, success: true, id: result.id })
    } catch (e: unknown) {
      results.push({ to, success: false, error: e instanceof Error ? e.message : String(e) })
    }
  }

  return results
}

/**
 * Track an event for a contact (creates the contact if new).
 * Uses the public-compatible track endpoint.
 */
export async function trackEvent(email: string, event: string, data?: Record<string, string>) {
  return plunkFetch('/track', { email, event, data })
}

/**
 * Get all contacts from Plunk.
 */
export async function getContacts() {
  const res = await fetch(`${PLUNK_API_BASE}/contacts`, {
    headers: { 'Authorization': `Bearer ${getKey()}` },
  })
  if (!res.ok) throw new Error(`Plunk API error: ${res.status}`)
  return res.json()
}
