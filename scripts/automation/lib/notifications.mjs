/**
 * In-app notification system.
 * Writes to automation_notifications table in NeonDB.
 * All notifications appear on the dashboard — no external email.
 */

import { getDb } from './db.mjs';
import crypto from 'crypto';

/**
 * Create a notification visible on the dashboard.
 *
 * @param {object} opts
 * @param {string} opts.title - Short headline
 * @param {string} opts.message - Descriptive message
 * @param {'info'|'warning'|'error'|'action_required'} opts.severity
 * @param {string} [opts.automationRunId] - Link to automation run
 * @param {object} [opts.details] - Additional structured data
 */
export async function notify({ title, message, severity = 'info', automationRunId = null, details = {} }) {
  const sql = getDb();
  const id = crypto.randomUUID();

  await sql`
    INSERT INTO automation_notifications (id, automation_run_id, severity, title, message, details)
    VALUES (${id}, ${automationRunId}, ${severity}, ${title}, ${message}, ${JSON.stringify(details)})
  `;

  const prefix = { info: 'INFO', warning: 'WARN', error: 'ERROR', action_required: 'ACTION' }[severity];
  console.log(`[${prefix}] ${title}: ${message}`);

  return id;
}

/**
 * Get unread notification count.
 */
export async function getUnreadCount() {
  const sql = getDb();
  const rows = await sql`SELECT COUNT(*)::int as count FROM automation_notifications WHERE read = false`;
  return rows[0]?.count || 0;
}
