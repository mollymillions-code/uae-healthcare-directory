import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { adminChanges } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { validateAdminAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authError = validateAdminAuth(req);
  if (authError) return authError;

  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") || 100), 500);

  try {
    const rows = await db
      .select()
      .from(adminChanges)
      .orderBy(desc(adminChanges.createdAt))
      .limit(limit);

    return NextResponse.json({ changes: rows, total: rows.length });
  } catch (err) {
    console.error("[admin] GET /changelog failed:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
