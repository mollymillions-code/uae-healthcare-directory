import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { db } from "@/lib/db";
import { consumerProviderEvents, ownerLeadRequests, providers } from "@/lib/db/schema";
import { createId } from "@/lib/id";

const OWNER_LEAD_ACTIONS = new Set([
  "owner_get_listed_cta_confirmed",
  "owner_claim_cta_confirmed",
  "owner_edit_cta_confirmed",
]);

const NOTIFY_EMAILS = [
  "syed@zavis.ai",
  "sayan@zavis.ai",
  "anuj@zavis.ai",
  "mohit@zavis.ai",
];

function clean(value: unknown, max = 240): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

function ownerActionKind(action: string): string {
  if (action.includes("_claim_")) return "claim";
  if (action.includes("_edit_")) return "edit";
  return "get_listed";
}

function esc(value: unknown): string {
  if (value == null) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function normalizeProviderId(providerId: string | null): Promise<string | null> {
  if (!providerId) return null;
  const [provider] = await db
    .select({ id: providers.id })
    .from(providers)
    .where(eq(providers.id, providerId))
    .limit(1);
  return provider?.id ?? null;
}

async function notifyOwnerLead(lead: {
  id: string;
  action: string;
  surface: string;
  providerName: string | null;
  entityName: string | null;
  pageUrl: string | null;
  ownerRole: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
}) {
  if (!process.env.PLUNK_SECRET_KEY) return;

  const displayName = lead.providerName || lead.entityName || "Unknown clinic/listing";
  const contact =
    [lead.contactName, lead.contactEmail, lead.contactPhone].filter(Boolean).join(" / ") ||
    "No contact supplied";

  const html = `
    <h2>New Owner Lead</h2>
    <table style="border-collapse:collapse;width:100%;max-width:640px;">
      <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;">Lead ID</td><td style="padding:8px;border-bottom:1px solid #eee;font-weight:600;">${esc(lead.id)}</td></tr>
      <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;">Action</td><td style="padding:8px;border-bottom:1px solid #eee;">${esc(lead.action)}</td></tr>
      <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;">Clinic / listing</td><td style="padding:8px;border-bottom:1px solid #eee;">${esc(displayName)}</td></tr>
      <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;">Contact</td><td style="padding:8px;border-bottom:1px solid #eee;">${esc(contact)}</td></tr>
      <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;">Role</td><td style="padding:8px;border-bottom:1px solid #eee;">${esc(lead.ownerRole)}</td></tr>
      <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;">Surface</td><td style="padding:8px;border-bottom:1px solid #eee;">${esc(lead.surface)}</td></tr>
      ${
        lead.pageUrl
          ? `<tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;">Page</td><td style="padding:8px;border-bottom:1px solid #eee;"><a href="${esc(lead.pageUrl)}">${esc(lead.pageUrl)}</a></td></tr>`
          : ""
      }
    </table>
    <p style="color:#999;font-size:12px;margin-top:16px;">Captured from owner CTA on zavis.ai</p>
  `;

  try {
    const { sendEmail } = await import("@/lib/research/plunk");
    const results = await sendEmail({
      to: NOTIFY_EMAILS,
      subject: `New owner lead: ${displayName}`,
      body: html,
      from: "leads@zavis.ai",
      name: "Zavis Leads",
    });
    const failed = results.filter((result) => !result.success);
    if (failed.length > 0) {
      console.error("[consumer-events] owner lead email failures:", failed);
    }
  } catch (error) {
    console.error("[consumer-events] owner lead notification failed:", error);
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db
    .select({
      id: consumerProviderEvents.id,
      providerId: consumerProviderEvents.providerId,
      entityType: consumerProviderEvents.entityType,
      entitySlug: consumerProviderEvents.entitySlug,
      entityName: consumerProviderEvents.entityName,
      action: consumerProviderEvents.action,
      surface: consumerProviderEvents.surface,
      pageUrl: consumerProviderEvents.pageUrl,
      ctaLabel: consumerProviderEvents.ctaLabel,
      metadata: consumerProviderEvents.metadata,
      createdAt: consumerProviderEvents.createdAt,
    })
    .from(consumerProviderEvents)
    .where(eq(consumerProviderEvents.userId, userId))
    .orderBy(desc(consumerProviderEvents.createdAt))
    .limit(100);

  return NextResponse.json({ events: rows });
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();

    const action = clean(body.action, 80);
    const surface = clean(body.surface, 120);
    if (!action || !surface) {
      return NextResponse.json({ error: "Missing action or surface" }, { status: 400 });
    }

    const metadata: Record<string, unknown> =
      body.metadata && typeof body.metadata === "object" && !Array.isArray(body.metadata)
        ? body.metadata
        : {};

    const eventId = createId("evt");
    const providerId = await normalizeProviderId(clean(body.providerId, 120));
    const entityType = clean(body.entityType, 60) ?? "provider";
    const entitySlug = clean(body.entitySlug, 240);
    const entityName = clean(body.entityName, 240);
    const pageUrl = clean(body.pageUrl, 1000);
    const ctaLabel = clean(body.ctaLabel, 160);
    const anonymousId = clean(body.anonymousId, 120);

    await db.insert(consumerProviderEvents).values({
      id: eventId,
      userId: session?.user?.id ?? null,
      providerId,
      entityType,
      entitySlug,
      entityName,
      action,
      surface,
      pageUrl,
      ctaLabel,
      anonymousId,
      metadata,
    });

    if (OWNER_LEAD_ACTIONS.has(action)) {
      const ownerAction = ownerActionKind(action);
      const contactName = clean(body.contactName ?? metadata.contactName, 160);
      const contactEmail = clean(body.contactEmail ?? metadata.contactEmail, 255);
      const contactPhone = clean(body.contactPhone ?? metadata.contactPhone, 80);
      const ownerRole = clean(metadata.ownerRole, 80);
      const leadId = createId("olr");

      await db.insert(ownerLeadRequests).values({
        id: leadId,
        consumerEventId: eventId,
        providerId,
        action: ownerAction,
        surface,
        entityType,
        entitySlug,
        entityName,
        pageUrl,
        ctaLabel,
        ownerRole,
        anonymousId,
        contactName,
        contactEmail,
        contactPhone,
        metadata: {
          ...(metadata ?? {}),
          sourceEventAction: action,
          ownerRole,
        },
      });

      void notifyOwnerLead({
        id: leadId,
        action: ownerAction,
        surface,
        providerName: null,
        entityName,
        pageUrl,
        ownerRole,
        contactName,
        contactEmail,
        contactPhone,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[consumer-events] log failed:", err);
    return NextResponse.json({ error: "Could not log event." }, { status: 500 });
  }
}
