import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const NOTIFY_EMAILS = [
  "syed@zavis.ai",
  "sayan@zavis.ai",
  "anuj@zavis.ai",
  "mohit@zavis.ai",
];

function esc(s: string | null | undefined): string {
  if (s == null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, company, team, website } = body;

    if (!name || !email) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const emailBody = `
      <h2>New Demo Request</h2>
      <table style="border-collapse:collapse;width:100%;max-width:500px;">
        <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;">Name</td><td style="padding:8px;border-bottom:1px solid #eee;font-weight:600;">${esc(name)}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;">Email</td><td style="padding:8px;border-bottom:1px solid #eee;"><a href="mailto:${esc(email)}">${esc(email)}</a></td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;">Phone</td><td style="padding:8px;border-bottom:1px solid #eee;"><a href="tel:${esc(phone)}">${esc(phone)}</a></td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;">Company</td><td style="padding:8px;border-bottom:1px solid #eee;">${esc(company)}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;">Team Size</td><td style="padding:8px;border-bottom:1px solid #eee;">${esc(team)}</td></tr>
        ${website ? `<tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;">Website</td><td style="padding:8px;border-bottom:1px solid #eee;"><a href="${esc(website)}">${esc(website)}</a></td></tr>` : ""}
      </table>
      <p style="color:#999;font-size:12px;margin-top:16px;">Submitted via zavis.ai/book-a-demo</p>
    `;

    // Try Plunk
    if (process.env.PLUNK_SECRET_KEY) {
      try {
        const { sendEmail } = await import("@/lib/research/plunk");
        await sendEmail({
          to: NOTIFY_EMAILS,
          subject: `New Demo Request: ${name} — ${company}`,
          body: emailBody,
          from: "demos@zavis.ai",
          name: "Zavis Demos",
        });
        return NextResponse.json({ sent: true });
      } catch (err) {
        console.error("[notify-demo] Plunk failed:", err);
      }
    }

    // Try Resend
    if (process.env.RESEND_API_KEY) {
      try {
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: "Zavis Demos <demos@zavis.ai>",
          to: NOTIFY_EMAILS,
          subject: `New Demo Request: ${name} — ${company}`,
          html: emailBody,
        });
        return NextResponse.json({ sent: true });
      } catch (err) {
        console.error("[notify-demo] Resend failed:", err);
      }
    }

    console.warn("[notify-demo] No email provider configured");
    return NextResponse.json({ sent: false, reason: "no provider" });
  } catch (err) {
    console.error("[notify-demo] Error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
