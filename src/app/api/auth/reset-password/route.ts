import { NextRequest, NextResponse } from "next/server";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { consumerPasswordResetTokens, consumerUsers } from "@/lib/db/schema";
import { hashPassword, isStrongEnoughPassword } from "@/lib/auth/password";
import { hashToken } from "@/lib/auth/tokens";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token = String(body.token ?? "");
    const password = String(body.password ?? "");

    if (!token || !isStrongEnoughPassword(password)) {
      return NextResponse.json({ error: "Use a valid reset link and a password with at least 8 characters." }, { status: 400 });
    }

    const tokenHash = hashToken(token);
    const reset = (
      await db
        .select()
        .from(consumerPasswordResetTokens)
        .where(
          and(
            eq(consumerPasswordResetTokens.tokenHash, tokenHash),
            isNull(consumerPasswordResetTokens.usedAt),
            gt(consumerPasswordResetTokens.expiresAt, new Date())
          )
        )
        .limit(1)
    )[0];

    if (!reset) {
      return NextResponse.json({ error: "This reset link is invalid or expired." }, { status: 400 });
    }

    await db
      .update(consumerUsers)
      .set({ passwordHash: await hashPassword(password), updatedAt: new Date() })
      .where(eq(consumerUsers.id, reset.userId));

    await db
      .update(consumerPasswordResetTokens)
      .set({ usedAt: new Date() })
      .where(eq(consumerPasswordResetTokens.id, reset.id));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[consumer-auth] reset password failed:", err);
    return NextResponse.json({ error: "Could not reset password." }, { status: 500 });
  }
}
