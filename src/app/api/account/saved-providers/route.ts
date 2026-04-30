import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { db } from "@/lib/db";
import { consumerSavedProviders } from "@/lib/db/schema";
import { getAccountProviderSummaries, providerTableHasProvider } from "@/lib/account/provider-summaries";

async function requireUserId() {
  const session = await getServerSession(authOptions);
  return session?.user?.id ?? null;
}

export async function GET() {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db
    .select({
      providerId: consumerSavedProviders.providerId,
      savedAt: consumerSavedProviders.createdAt,
      source: consumerSavedProviders.source,
    })
    .from(consumerSavedProviders)
    .where(eq(consumerSavedProviders.userId, userId))
    .orderBy(desc(consumerSavedProviders.createdAt));
  const summaries = await getAccountProviderSummaries(rows.map((row) => row.providerId));

  return NextResponse.json({
    providers: rows.map((row) => ({ ...row, provider: summaries.get(row.providerId) ?? null })),
  });
}

export async function POST(request: NextRequest) {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const providerId = String(body.providerId ?? "");
  const source = body.source ? String(body.source).slice(0, 120) : null;
  if (!providerId) {
    return NextResponse.json({ error: "Missing providerId" }, { status: 400 });
  }

  const exists = await providerTableHasProvider(providerId);
  if (exists === false) {
    return NextResponse.json({ error: "Provider not found" }, { status: 404 });
  }

  await db
    .insert(consumerSavedProviders)
    .values({ userId, providerId, source })
    .onConflictDoNothing();

  return NextResponse.json({ ok: true, providerId });
}

export async function DELETE(request: NextRequest) {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const providerId = searchParams.get("providerId");
  if (!providerId) {
    return NextResponse.json({ error: "Missing providerId" }, { status: 400 });
  }

  await db
    .delete(consumerSavedProviders)
    .where(
      and(
        eq(consumerSavedProviders.userId, userId),
        eq(consumerSavedProviders.providerId, providerId)
      )
    );

  return NextResponse.json({ ok: true });
}

export async function PUT(request: NextRequest) {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const providerIds = Array.isArray(body.providerIds)
    ? body.providerIds.map((id: unknown) => String(id)).filter(Boolean).slice(0, 100)
    : [];
  if (providerIds.length === 0) {
    return NextResponse.json({ ok: true, synced: 0 });
  }

  const summaries = await getAccountProviderSummaries(providerIds);
  const validProviderIds = summaries.size > 0 ? Array.from(summaries.keys()) : providerIds;

  for (const providerId of validProviderIds) {
    await db
      .insert(consumerSavedProviders)
      .values({ userId, providerId, source: "anonymous_sync" })
      .onConflictDoNothing();
  }

  return NextResponse.json({ ok: true, synced: validProviderIds.length });
}
