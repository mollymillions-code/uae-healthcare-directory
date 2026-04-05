import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";

const PIXEL_ID = "1045406841134462";

function hash(value: string): string {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

function normalizePhone(phone: string): string {
  // Strip everything except digits, remove leading 00 or +
  return phone.replace(/\D/g, "").replace(/^00/, "").replace(/^0/, "");
}

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    req.headers.get("cf-connecting-ip") || // Cloudflare
    ""
  );
}

export async function POST(req: NextRequest) {
  const token = process.env.META_ACCESS_TOKEN;
  if (!token) {
    // Silently succeed — don't break form flow if token isn't set yet
    return NextResponse.json({ ok: true, skipped: "no_token" });
  }

  let body: {
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    eventId?: string;
    fbp?: string;
    fbc?: string;
    sourceUrl?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const { email, phone, firstName, lastName, eventId, fbp, fbc, sourceUrl } = body;

  // Build user_data — only include fields that have values
  const userData: Record<string, unknown> = {
    client_ip_address: getClientIp(req),
    client_user_agent: req.headers.get("user-agent") || "",
    country: [hash("ae")], // All Zavis leads are UAE
  };

  if (email) {
    userData.em = [hash(email)];
    userData.external_id = [hash(email)]; // Strengthens identity matching
  }
  if (phone) {
    const normalized = normalizePhone(phone);
    if (normalized) userData.ph = [hash(normalized)];
  }
  if (firstName) userData.fn = [hash(firstName)];
  if (lastName) userData.ln = [hash(lastName)];

  // fbp and fbc are passed raw — Meta needs the unhashed cookie values
  if (fbp) userData.fbp = fbp;
  if (fbc) userData.fbc = fbc;

  const event: Record<string, unknown> = {
    event_name: "Lead",
    event_time: Math.floor(Date.now() / 1000),
    action_source: "website",
    event_source_url: sourceUrl || "https://www.zavis.ai/book-a-demo",
    user_data: userData,
    custom_data: { lead_type: "demo_request" },
  };

  // eventId links this server event to the client-side fbq pixel event
  // Meta uses it to deduplicate — both count as one conversion, not two
  if (eventId) event.event_id = eventId;

  const payload: Record<string, unknown> = {
    data: [event],
    access_token: token,
  };

  // Test event code — set META_TEST_EVENT_CODE in .env.local to validate
  // in Meta Events Manager without polluting real data
  const testCode = process.env.META_TEST_EVENT_CODE;
  if (testCode) payload.test_event_code = testCode;

  try {
    const resp = await fetch(
      `https://graph.facebook.com/v19.0/${PIXEL_ID}/events`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    const result = await resp.json() as Record<string, unknown>;

    if (!resp.ok) {
      console.error("[CAPI] Meta error:", JSON.stringify(result));
      // Don't fail the request — CAPI is supplementary
      return NextResponse.json({ ok: true, meta_error: result });
    }

    return NextResponse.json({ ok: true, events_received: result.events_received });
  } catch (err) {
    console.error("[CAPI] Network error:", err);
    // Non-blocking — form success is not dependent on CAPI
    return NextResponse.json({ ok: true, meta_error: "network_error" });
  }
}
