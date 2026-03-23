/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/research/db'
import { sendEmail, trackEvent } from '@/lib/research/plunk'

/**
 * POST /api/emails/send — Send an approved email blast via Plunk.
 * Expects: { id } where id is the email_blasts row id.
 * Only sends if status is 'approved'.
 */
export async function POST(request: NextRequest) {
  const sql = getDb()
  const body = await request.json()
  const { id } = body

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 })
  }

  // Fetch the email blast
  const rows = await sql`SELECT * FROM email_blasts WHERE id = ${id}`
  if (rows.length === 0) {
    return NextResponse.json({ error: 'Email blast not found' }, { status: 404 })
  }

  const email = rows[0]

  if (email.status !== 'approved') {
    return NextResponse.json(
      { error: `Cannot send email in "${email.status}" status. Must be "approved".` },
      { status: 400 }
    )
  }

  try {
    // Update status to sending
    await sql`UPDATE email_blasts SET status = 'sending' WHERE id = ${id}`

    // Get contacts to send to
    // For now, send to a specific list. In production, this would
    // query Plunk contacts by segment or use a contact list from NeonDB.
    const segment = email.segment || 'all'

    // If specific recipients are provided in the body, use those
    const recipients = body.recipients || []

    if (recipients.length === 0) {
      // No recipients provided — update status back and inform
      await sql`UPDATE email_blasts SET status = 'approved' WHERE id = ${id}`
      return NextResponse.json({
        error: 'No recipients provided. Pass a "recipients" array of email addresses.',
      }, { status: 400 })
    }

    // Send via Plunk
    const results = await sendEmail({
      to: recipients,
      subject: email.subject,
      body: email.body_html,
    })

    const sentCount = results.filter(r => r.success).length

    // Track the send event for each recipient
    for (const recipient of recipients) {
      try {
        await trackEvent(recipient, 'research_email_received', {
          email_id: id,
          subject: email.subject,
          segment,
        })
      } catch {
        // Non-critical — don't fail the send if tracking fails
      }
    }

    // Update status and counts
    await sql`
      UPDATE email_blasts
      SET status = 'sent', sent_at = NOW(), send_count = ${sentCount}
      WHERE id = ${id}
    `

    // Update the pipeline run status if linked
    if (email.run_id) {
      // Check if all distribution items are done
      const pendingPosts = await sql`
        SELECT count(*) as c FROM linkedin_posts
        WHERE run_id = ${email.run_id} AND status NOT IN ('posted', 'failed')
      `
      const pendingEmails = await sql`
        SELECT count(*) as c FROM email_blasts
        WHERE run_id = ${email.run_id} AND status NOT IN ('sent', 'failed')
      `
      if (Number(pendingPosts[0].c) === 0 && Number(pendingEmails[0].c) === 0) {
        await sql`UPDATE pipeline_runs SET status = 'complete' WHERE id = ${email.run_id}`
      }
    }

    return NextResponse.json({
      message: `Email sent to ${sentCount} recipients`,
      sent: sentCount,
      total: recipients.length,
      results,
    })
  } catch (error: any) {
    // Revert status on failure
    await sql`UPDATE email_blasts SET status = 'failed' WHERE id = ${id}`
    return NextResponse.json(
      { error: `Send failed: ${error.message}` },
      { status: 500 }
    )
  }
}
