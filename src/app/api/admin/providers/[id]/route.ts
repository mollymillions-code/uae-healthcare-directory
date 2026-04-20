import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { providers, adminChanges } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { validateAdminAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

// Allowlisted fields that can be edited through the admin panel
const EDITABLE_FIELDS = new Set([
  "name", "phone", "phoneSecondary", "email", "website", "address",
  "description", "shortDescription", "insurance", "services", "languages",
  "operatingHours", "googleRating", "googleReviewCount",
  "isClaimed", "isVerified", "status",
]);

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = validateAdminAuth(req);
  if (authError) return authError;

  try {
    const rows = await db.select().from(providers).where(eq(providers.id, params.id)).limit(1);
    if (rows.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ provider: rows[0] });
  } catch (err) {
    console.error("[admin] GET /providers/[id] failed:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = validateAdminAuth(req);
  if (authError) return authError;

  try {
    // Get current state
    const current = await db.select().from(providers).where(eq(providers.id, params.id)).limit(1);
    if (current.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await req.json();
    const { reason, ...fields } = body;

    // Filter to only allowlisted fields
    const updates: Record<string, unknown> = {};
    const changeLogs: { field: string; oldVal: unknown; newVal: unknown }[] = [];

    for (const [key, value] of Object.entries(fields)) {
      if (!EDITABLE_FIELDS.has(key)) continue;
      const currentRow = current[0] as Record<string, unknown>;
      const snakeKey = key.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
      const oldVal = currentRow[key] ?? currentRow[snakeKey];
      if (JSON.stringify(oldVal) !== JSON.stringify(value)) {
        updates[snakeKey] = value;
        changeLogs.push({ field: key, oldVal, newVal: value });
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ message: "No changes detected" });
    }

    // Apply updates
    updates.updated_at = new Date();
    await db.update(providers).set(updates).where(eq(providers.id, params.id));

    // Log changes
    for (const log of changeLogs) {
      await db.insert(adminChanges).values({
        entityType: "provider",
        entityId: params.id,
        entityName: current[0].name,
        fieldName: log.field,
        oldValue: log.oldVal as Record<string, unknown>,
        newValue: log.newVal as Record<string, unknown>,
        changedBy: "admin",
        reason: reason || null,
      });
    }

    return NextResponse.json({
      message: `Updated ${changeLogs.length} field(s)`,
      changes: changeLogs.map((c) => c.field),
    });
  } catch (err) {
    console.error("[admin] PATCH /providers/[id] failed:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
