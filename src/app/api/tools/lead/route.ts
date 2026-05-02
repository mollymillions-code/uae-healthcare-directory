import { NextRequest, NextResponse } from "next/server";
import { appendFile, mkdir } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

/**
 * Lightweight lead capture for free tools (`/tools/*`).
 *
 * Different from `/api/notify-demo` (which is the full demo-request path
 * requiring name, email, phone, company, team). The tool email captures are
 * intentionally low-friction — just an email + tool source — so this endpoint
 * accepts the thin payload and persists/forwards as appropriate.
 *
 * Storage: appended to `${DEMO_LEADS_FALLBACK_FILE}` (or /tmp default) as
 * JSONL, plus forwarded to Plunk for email-list signup if PLUNK_SECRET_KEY
 * is set.
 */

interface ToolLeadBody {
  email: string;
  source: string;
  context?: Record<string, unknown>;
}

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

async function appendLocalLog(record: Record<string, unknown>) {
  const fallbackPath =
    process.env.TOOL_LEADS_FILE || path.join("/tmp", "zavis-tool-leads.jsonl");
  try {
    await mkdir(path.dirname(fallbackPath), { recursive: true });
    await appendFile(fallbackPath, `${JSON.stringify(record)}\n`, "utf8");
  } catch (err) {
    console.error("[tool-lead] local append failed:", err);
  }
}

async function forwardToPlunk(email: string, source: string) {
  const apiKey = process.env.PLUNK_SECRET_KEY;
  if (!apiKey) return;
  const apiBase = process.env.PLUNK_API_BASE || "https://next-api.useplunk.com/v1";
  try {
    await fetch(`${apiBase}/contacts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        subscribed: true,
        data: { source, capturedAt: new Date().toISOString() },
      }),
    });
  } catch (err) {
    console.error("[tool-lead] plunk forward failed:", err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as ToolLeadBody | null;
    if (!body || !body.email || !body.source) {
      return NextResponse.json(
        { error: "email and source required" },
        { status: 400 }
      );
    }
    const email = body.email.trim().toLowerCase();
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "invalid email" }, { status: 400 });
    }

    const record = {
      email,
      source: String(body.source).slice(0, 120),
      context: body.context ?? {},
      submittedAt: new Date().toISOString(),
      ip:
        request.headers.get("cf-connecting-ip") ||
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        null,
      userAgent: request.headers.get("user-agent"),
    };

    await Promise.all([appendLocalLog(record), forwardToPlunk(email, record.source)]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[tool-lead] handler failed:", err);
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}
