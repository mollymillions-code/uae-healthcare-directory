import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { consumerPasswordResetTokens, consumerUsers } from "@/lib/db/schema";
import { createId } from "@/lib/id";
import { createPlainToken, hashToken, normalizeEmail } from "@/lib/auth/tokens";
import { sendPasswordResetEmail } from "@/lib/auth/email";
import { getBaseUrl } from "@/lib/helpers";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = normalizeEmail(String(body.email ?? ""));
    if (!email) {
      return NextResponse.json({ ok: true });
    }

    const user = (
      await db
        .select({
          id: consumerUsers.id,
          email: consumerUsers.email,
          name: consumerUsers.name,
        })
        .from(consumerUsers)
        .where(eq(consumerUsers.email, email))
        .limit(1)
    )[0];

    if (!user) {
      return NextResponse.json({ ok: true });
    }

    const token = createPlainToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await db.insert(consumerPasswordResetTokens).values({
      id: createId("rst"),
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt,
    });

    const resetUrl = `${getBaseUrl()}/reset-password?token=${encodeURIComponent(token)}`;
    await sendPasswordResetEmail({ to: user.email, name: user.name, resetUrl });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[consumer-auth] forgot password failed:", err);
    return NextResponse.json({ error: "Could not process password reset." }, { status: 500 });
  }
}
