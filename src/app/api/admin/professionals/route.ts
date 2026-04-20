import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { professionalsIndex } from "@/lib/db/schema";
import { ilike, or } from "drizzle-orm";
import { validateAdminAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authError = validateAdminAuth(req);
  if (authError) return authError;

  const q = req.nextUrl.searchParams.get("q") || "";
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") || 50), 200);

  try {
    const where = q.trim()
      ? or(
          ilike(professionalsIndex.name, `%${q}%`),
          ilike(professionalsIndex.slug, `%${q}%`),
          ilike(professionalsIndex.dhaUniqueId, `%${q}%`),
          ilike(professionalsIndex.primaryFacilityName, `%${q}%`)
        )
      : undefined;

    const rows = await db
      .select()
      .from(professionalsIndex)
      .where(where)
      .orderBy(professionalsIndex.name)
      .limit(limit);

    return NextResponse.json({ professionals: rows, total: rows.length });
  } catch (err) {
    console.error("[admin] GET /professionals failed:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
