import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { consumerUsers } from "@/lib/db/schema";
import { createId } from "@/lib/id";
import { hashPassword, isStrongEnoughPassword } from "@/lib/auth/password";
import { normalizeEmail } from "@/lib/auth/tokens";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = normalizeEmail(String(body.email ?? ""));
    const password = String(body.password ?? "");
    const name = String(body.name ?? "").trim() || null;
    const marketingOptIn = Boolean(body.marketingOptIn);

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }
    if (!isStrongEnoughPassword(password)) {
      return NextResponse.json({ error: "Use at least 8 characters for your password." }, { status: 400 });
    }

    const existing = (
      await db
        .select({ id: consumerUsers.id })
        .from(consumerUsers)
        .where(eq(consumerUsers.email, email))
        .limit(1)
    )[0];
    if (existing) {
      return NextResponse.json({ error: "An account already exists for this email." }, { status: 409 });
    }

    const user = {
      id: createId("usr"),
      email,
      name,
      passwordHash: await hashPassword(password),
      marketingOptIn,
    };

    await db.insert(consumerUsers).values(user);

    return NextResponse.json({
      ok: true,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (err) {
    console.error("[consumer-auth] signup failed:", err);
    return NextResponse.json({ error: "Could not create account." }, { status: 500 });
  }
}
