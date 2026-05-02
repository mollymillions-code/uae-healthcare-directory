import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { candidateProfiles } from "@/lib/db/schema";
import { authOptions } from "@/lib/auth/nextauth";
import {
  uploadCvToR2,
  deleteCvFromR2,
  MAX_CV_BYTES,
  ALLOWED_CV_MIME,
} from "@/lib/jobs/r2-cv";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.userType !== "candidate") {
    return NextResponse.json(
      { error: "Sign in as a candidate to upload a CV." },
      { status: 401 }
    );
  }

  const candidateUserId = session.user.id;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload payload." }, { status: 400 });
  }

  const file = formData.get("cv");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Attach a CV file." }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ error: "CV file is empty." }, { status: 400 });
  }
  if (file.size > MAX_CV_BYTES) {
    return NextResponse.json(
      { error: "CV must be smaller than 10 MB." },
      { status: 400 }
    );
  }
  if (!ALLOWED_CV_MIME.has(file.type)) {
    return NextResponse.json(
      { error: "CV must be a PDF or Word document." },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // Look up the existing profile + previous CV URL for cleanup.
  const existing = (
    await db
      .select({ id: candidateProfiles.id, cvUrl: candidateProfiles.cvUrl })
      .from(candidateProfiles)
      .where(eq(candidateProfiles.userId, candidateUserId))
      .limit(1)
  )[0];
  if (!existing) {
    return NextResponse.json(
      { error: "Profile not found. Complete signup first." },
      { status: 404 }
    );
  }

  const url = await uploadCvToR2(candidateUserId, buffer, file.type);
  if (!url) {
    return NextResponse.json(
      { error: "Storage is not configured. Contact Zavis support." },
      { status: 500 }
    );
  }

  // Best-effort: delete previous CV after successful upload.
  if (existing.cvUrl) {
    deleteCvFromR2(existing.cvUrl).catch(() => undefined);
  }

  await db
    .update(candidateProfiles)
    .set({
      cvUrl: url,
      cvUploadedAt: new Date(),
      updatedAt: new Date(),
      // Bump completeness — CV is the last 15% of the score (post-signup).
      profileCompleteness: sql`LEAST(100, ${candidateProfiles.profileCompleteness} + 15)`,
    })
    .where(eq(candidateProfiles.userId, candidateUserId));

  return NextResponse.json({ ok: true, cvUrl: url });
}

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.userType !== "candidate") {
    return NextResponse.json(
      { error: "Sign in as a candidate to manage your CV." },
      { status: 401 }
    );
  }

  const candidateUserId = session.user.id;
  const existing = (
    await db
      .select({ cvUrl: candidateProfiles.cvUrl })
      .from(candidateProfiles)
      .where(eq(candidateProfiles.userId, candidateUserId))
      .limit(1)
  )[0];

  if (existing?.cvUrl) {
    await deleteCvFromR2(existing.cvUrl);
  }

  await db
    .update(candidateProfiles)
    .set({
      cvUrl: null,
      cvUploadedAt: null,
      updatedAt: new Date(),
    })
    .where(eq(candidateProfiles.userId, candidateUserId));

  return NextResponse.json({ ok: true });
}
