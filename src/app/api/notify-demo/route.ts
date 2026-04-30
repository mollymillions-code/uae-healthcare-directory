import { NextRequest, NextResponse } from "next/server";
import { appendFile } from "fs/promises";
import path from "path";
import { readJsonObject } from "@/lib/http/read-json";

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

type DemoLead = {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  team?: string;
  website?: string | null;
};

async function appendFallbackLead(lead: DemoLead, req: NextRequest) {
  const fallbackPath =
    process.env.DEMO_LEADS_FALLBACK_FILE ||
    path.join("/tmp", "zavis-demo-leads.jsonl");

  const record = {
    ...lead,
    submittedAt: new Date().toISOString(),
    source: "zavis.ai/book-a-demo",
    ip:
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      null,
    userAgent: req.headers.get("user-agent"),
  };

  try {
    await appendFile(fallbackPath, `${JSON.stringify(record)}\n`, "utf8");
  } catch (err) {
    console.error("[notify-demo] Fallback lead append failed:", err);
  }
}

async function forwardLeadToInternalApi(lead: DemoLead) {
  const baseUrl = process.env.ZAVIS_API_URL || process.env.NEXT_PUBLIC_ZAVIS_API_URL;
  const webhookSecret =
    process.env.LEADS_WEBHOOK_SECRET || process.env.NEXT_PUBLIC_LEADS_WEBHOOK_SECRET;

  if (!baseUrl || !webhookSecret) {
    return { attempted: false, ok: false, reason: "not_configured" };
  }

  try {
    const res = await fetch(`${baseUrl.replace(/\/$/, "")}/api/leads/website`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-webhook-secret": webhookSecret,
      },
      body: JSON.stringify(lead),
    });

    if (!res.ok) {
      console.error("[notify-demo] Internal lead API failed:", res.status, await res.text().catch(() => ""));
      return { attempted: true, ok: false, reason: `http_${res.status}` };
    }

    return { attempted: true, ok: true };
  } catch (err) {
    console.error("[notify-demo] Internal lead API error:", err);
    return { attempted: true, ok: false, reason: "request_failed" };
  }
}

export async function POST(req: NextRequest) {
  try {
    const parsed = await readJsonObject(req);
    if (parsed.error) return parsed.error;

    const body = parsed.data;
    const { name, email, phone, company, team, website } = body;

    if (!name || !email || !phone || !company || !team) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const lead: DemoLead = {
      name: String(name).trim(),
      email: String(email).trim(),
      phone: String(phone).trim(),
      company: String(company).trim(),
      team: String(team).trim(),
      website: website ? String(website).trim() : null,
    };

    await appendFallbackLead(lead, req);

    const emailBody = `
      <h2>New Demo Request</h2>
      <table style="border-collapse:collapse;width:100%;max-width:500px;">
        <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;">Name</td><td style="padding:8px;border-bottom:1px solid #eee;font-weight:600;">${esc(lead.name)}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;">Email</td><td style="padding:8px;border-bottom:1px solid #eee;"><a href="mailto:${esc(lead.email)}">${esc(lead.email)}</a></td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;">Phone</td><td style="padding:8px;border-bottom:1px solid #eee;"><a href="tel:${esc(lead.phone)}">${esc(lead.phone)}</a></td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;">Company</td><td style="padding:8px;border-bottom:1px solid #eee;">${esc(lead.company)}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;">Team / Function</td><td style="padding:8px;border-bottom:1px solid #eee;">${esc(lead.team)}</td></tr>
        ${lead.website ? `<tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;">Website</td><td style="padding:8px;border-bottom:1px solid #eee;"><a href="${esc(lead.website)}">${esc(lead.website)}</a></td></tr>` : ""}
      </table>
      <p style="color:#999;font-size:12px;margin-top:16px;">Submitted via zavis.ai/book-a-demo</p>
    `;

    const internalLead = await forwardLeadToInternalApi(lead);

    // Try Plunk
    if (process.env.PLUNK_SECRET_KEY) {
      try {
        const { sendEmail } = await import("@/lib/research/plunk");
        await sendEmail({
          to: NOTIFY_EMAILS,
          subject: `New Demo Request: ${lead.name} — ${lead.company}`,
          body: emailBody,
          from: "demos@zavis.ai",
          name: "Zavis Demos",
        });
        return NextResponse.json({ accepted: true, sent: true, provider: "plunk", internalLead });
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
          subject: `New Demo Request: ${lead.name} — ${lead.company}`,
          html: emailBody,
        });
        return NextResponse.json({ accepted: true, sent: true, provider: "resend", internalLead });
      } catch (err) {
        console.error("[notify-demo] Resend failed:", err);
      }
    }

    console.warn("[notify-demo] No email provider configured");
    return NextResponse.json({ accepted: true, sent: false, reason: "no provider", internalLead });
  } catch (err) {
    console.error("[notify-demo] Error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
