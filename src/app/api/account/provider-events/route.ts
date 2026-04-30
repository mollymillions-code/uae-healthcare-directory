import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { db } from "@/lib/db";
import { consumerProviderEvents } from "@/lib/db/schema";
import { createId } from "@/lib/id";

function clean(value: unknown, max = 240): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
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

    const metadata =
      body.metadata && typeof body.metadata === "object" && !Array.isArray(body.metadata)
        ? body.metadata
        : {};

    await db.insert(consumerProviderEvents).values({
      id: createId("evt"),
      userId: session?.user?.id ?? null,
      providerId: clean(body.providerId, 120),
      entityType: clean(body.entityType, 60) ?? "provider",
      entitySlug: clean(body.entitySlug, 240),
      entityName: clean(body.entityName, 240),
      action,
      surface,
      pageUrl: clean(body.pageUrl, 1000),
      ctaLabel: clean(body.ctaLabel, 160),
      anonymousId: clean(body.anonymousId, 120),
      metadata,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[consumer-events] log failed:", err);
    return NextResponse.json({ error: "Could not log event." }, { status: 500 });
  }
}
