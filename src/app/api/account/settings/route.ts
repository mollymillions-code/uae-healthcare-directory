import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { db } from "@/lib/db";
import { consumerUsers } from "@/lib/db/schema";

function optionalText(value: unknown, max = 160): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  await db
    .update(consumerUsers)
    .set({
      name: optionalText(body.name),
      phone: optionalText(body.phone, 40),
      preferredCitySlug: optionalText(body.preferredCitySlug, 80),
      preferredInsurance: optionalText(body.preferredInsurance, 120),
      marketingOptIn: Boolean(body.marketingOptIn),
      updatedAt: new Date(),
    })
    .where(eq(consumerUsers.id, userId));

  return NextResponse.json({ ok: true });
}
