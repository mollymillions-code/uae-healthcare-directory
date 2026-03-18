/**
 * Newsletter — sends daily briefing emails via Resend.
 *
 * The Daily Briefing: top 5 articles from the last 24 hours,
 * formatted as a clean text-heavy email matching the journal aesthetic.
 */

import type { Resend } from "resend";
import type { JournalArticle } from "../types";
import { getJournalCategory } from "../categories";

let _resend: Resend | null = null;
async function getResend(): Promise<Resend> {
  if (!_resend) {
    const mod = await import("resend");
    _resend = new mod.Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

const FROM_EMAIL = "journal@uae-healthcare-directory.vercel.app";
const REPLY_TO = "hello@zavis.ae";
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://uae-healthcare-directory.vercel.app";

// ─── Email Templates ────────────────────────────────────────────────────────────

function buildDailyBriefingHTML(articles: JournalArticle[], date: string): string {
  const articleBlocks = articles
    .map((a, i) => {
      const category = getJournalCategory(a.category);
      return `
        <tr>
          <td style="padding: 24px 0; ${i > 0 ? "border-top: 1px solid #e5e5df;" : ""}">
            <p style="font-family: 'Oswald', Helvetica, sans-serif; font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #b69a52; margin: 0 0 8px 0;">
              ${category?.name || a.category}
            </p>
            <h3 style="font-family: Georgia, 'Cormorant Garamond', serif; font-size: 20px; font-weight: 700; color: #1a1a1a; margin: 0 0 8px 0; line-height: 1.25;">
              <a href="${BASE_URL}/intelligence/${a.slug}" style="color: #1a1a1a; text-decoration: none;">${a.title}</a>
            </h3>
            <p style="font-family: Georgia, serif; font-size: 14px; color: #6b6b60; margin: 0 0 8px 0; line-height: 1.6;">
              ${a.excerpt}
            </p>
            <p style="font-family: 'Oswald', Helvetica, sans-serif; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #9a9a90; margin: 0;">
              ${a.readTimeMinutes} min read
            </p>
          </td>
        </tr>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;700&family=Oswald:wght@400;500&display=swap" rel="stylesheet">
</head>
<body style="margin: 0; padding: 0; background-color: #fafaf7;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fafaf7;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px;">

          <!-- Header -->
          <tr>
            <td style="border-bottom: 3px solid #1a1a1a; padding-bottom: 16px;">
              <h1 style="font-family: Georgia, 'Cormorant Garamond', serif; font-size: 28px; font-weight: 700; color: #1a1a1a; margin: 0;">
                Daily Briefing
              </h1>
              <p style="font-family: 'Oswald', Helvetica, sans-serif; font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #9a9a90; margin: 4px 0 0 0;">
                UAE Healthcare Intelligence · ${date}
              </p>
            </td>
          </tr>

          <!-- Articles -->
          ${articleBlocks}

          <!-- Footer -->
          <tr>
            <td style="border-top: 3px solid #1a1a1a; padding-top: 24px;">
              <p style="font-family: Georgia, serif; font-size: 13px; color: #6b6b60; margin: 0 0 12px 0;">
                <a href="${BASE_URL}/intelligence" style="color: #b69a52; text-decoration: none;">Read all stories →</a>
              </p>
              <p style="font-family: 'Oswald', Helvetica, sans-serif; font-size: 9px; text-transform: uppercase; letter-spacing: 0.05em; color: #9a9a90; margin: 0;">
                UAE Healthcare Intelligence · Powered by <a href="https://zavis.ae" style="color: #9a9a90;">Zavis</a>
                <br>
                <a href="${BASE_URL}/intelligence/unsubscribe" style="color: #9a9a90;">Unsubscribe</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildDailyBriefingText(articles: JournalArticle[], date: string): string {
  const lines = [
    "THE ZAVIS BRIEFING",
    `UAE Healthcare Intelligence — ${date}`,
    "━".repeat(50),
    "",
  ];

  for (const a of articles) {
    const category = getJournalCategory(a.category);
    lines.push(`[${(category?.name || a.category).toUpperCase()}]`);
    lines.push(a.title);
    lines.push(a.excerpt);
    lines.push(`Read: ${BASE_URL}/intelligence/${a.slug}`);
    lines.push("");
  }

  lines.push("━".repeat(50));
  lines.push(`Read all stories: ${BASE_URL}/intelligence`);
  lines.push("UAE Healthcare Intelligence · Powered by Zavis");

  return lines.join("\n");
}

// ─── Send Functions ─────────────────────────────────────────────────────────────

export async function sendDailyBriefing(
  articles: JournalArticle[],
  recipients: string[]
): Promise<{ success: boolean; sent: number; errors: string[] }> {
  if (!process.env.RESEND_API_KEY) {
    return { success: false, sent: 0, errors: ["RESEND_API_KEY not set"] };
  }

  const date = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const top5 = articles.slice(0, 5);
  const html = buildDailyBriefingHTML(top5, date);
  const text = buildDailyBriefingText(top5, date);

  const errors: string[] = [];
  let sent = 0;

  // Send in batches of 50 (Resend limit)
  for (let i = 0; i < recipients.length; i += 50) {
    const batch = recipients.slice(i, i + 50);
    try {
      await (await getResend()).emails.send({
        from: FROM_EMAIL,
        to: batch,
        subject: `Daily Briefing: ${top5[0]?.title.slice(0, 60) || "UAE Healthcare News"}`,
        html,
        text,
        replyTo: REPLY_TO,
      });
      sent += batch.length;
    } catch (error) {
      errors.push(`Batch ${i / 50 + 1}: ${String(error)}`);
    }
  }

  return { success: errors.length === 0, sent, errors };
}

// ─── Subscriber Management (simple file-based for V1) ───────────────────────────

export async function addSubscriber(email: string): Promise<boolean> {
  // In production, this would use the database
  // For V1, we store in Resend's audience/contact system
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_AUDIENCE_ID) {
    console.log(`[Newsletter] Would add subscriber: ${email}`);
    return true;
  }

  try {
    await (await getResend()).contacts.create({
      email,
      audienceId: process.env.RESEND_AUDIENCE_ID,
    });
    return true;
  } catch (error) {
    console.error(`[Newsletter] Error adding subscriber ${email}:`, error);
    return false;
  }
}
