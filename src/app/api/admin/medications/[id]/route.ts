import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { medications, adminChanges } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { validateAdminAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const EDITABLE_FIELDS = new Set([
  "genericName", "classSlug", "rxStatus", "description", "shortDescription",
  "commonConditions", "commonSpecialties", "labMonitoringNotes",
  "genericSubstitutionNote", "insurerNote",
  "isPrescriptionRequired", "hasGenericEquivalent", "requiresMonitoringLabs",
  "isHighIntent", "isCitySensitive", "pageState", "status",
]);

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = validateAdminAuth(req);
  if (authError) return authError;

  try {
    const current = await db.select().from(medications).where(eq(medications.id, Number(params.id))).limit(1);
    if (current.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await req.json();
    const { reason, ...fields } = body;

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

    updates.updated_at = new Date();
    await db.update(medications).set(updates).where(eq(medications.id, Number(params.id)));

    for (const log of changeLogs) {
      await db.insert(adminChanges).values({
        entityType: "medication",
        entityId: params.id,
        entityName: current[0].genericName,
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
    console.error("[admin] PATCH /medications/[id] failed:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
