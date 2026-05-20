import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { db } from "@/lib/db";
import { consumerProviderEvents, ownerLeadRequests } from "@/lib/db/schema";
import { createId } from "@/lib/id";

const OWNER_LEAD_ACTIONS = new Set([
  "owner_get_listed_cta_confirmed",
  "owner_claim_cta_confirmed",
  "owner_edit_cta_confirmed",
]);

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
    const providerId = clean(body.providerId, 120);
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
      await db.insert(ownerLeadRequests).values({
        id: createId("olr"),
        consumerEventId: eventId,
        providerId,
        action: ownerActionKind(action),
        surface,
        entityType,
        entitySlug,
        entityName,
        pageUrl,
        ctaLabel,
        ownerRole: clean(metadata.ownerRole, 80),
        anonymousId,
        contactName: clean(body.contactName ?? metadata.contactName, 160),
        contactEmail: clean(body.contactEmail ?? metadata.contactEmail, 255),
        contactPhone: clean(body.contactPhone ?? metadata.contactPhone, 80),
        metadata: {
          ...(metadata ?? {}),
          sourceEventAction: action,
          ownerRole: clean(metadata.ownerRole, 80),
        },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[consumer-events] log failed:", err);
    return NextResponse.json({ error: "Could not log event." }, { status: 500 });
  }
}
