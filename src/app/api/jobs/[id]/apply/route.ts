import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import {
  jobs,
  jobApplications,
  candidateProfiles,
} from "@/lib/db/schema";
import { authOptions } from "@/lib/auth/nextauth";
import { createId } from "@/lib/id";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.userType !== "candidate") {
    return NextResponse.json(
      { error: "Sign in as a candidate to apply." },
      { status: 401 }
    );
  }

  const candidateUserId = session.user.id;
  const jobId = params.id;

  const body = await request.json().catch(() => ({}));
  const coverNoteMd = String(body.coverNoteMd ?? "").slice(0, 4000) || null;

  const job = (
    await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1)
  )[0];
  if (!job || job.status !== "published") {
    return NextResponse.json({ error: "This job is not accepting applications." }, { status: 404 });
  }

  const profile = (
    await db
      .select({ id: candidateProfiles.id, cvUrl: candidateProfiles.cvUrl })
      .from(candidateProfiles)
      .where(eq(candidateProfiles.userId, candidateUserId))
      .limit(1)
  )[0];

  // Idempotent — DB unique(job_id, candidate_user_id) is the source of truth.
  // We try the insert and let the unique-violation be the dedup signal so we
  // don't double-count the counter on a race between two concurrent applies.
  try {
    const inserted = await db
      .insert(jobApplications)
      .values({
        id: createId("app"),
        jobId,
        candidateUserId,
        candidateProfileId: profile?.id ?? null,
        coverNoteMd,
        cvUrlAtApply: profile?.cvUrl ?? null,
        status: "submitted",
      })
      .onConflictDoNothing({
        target: [jobApplications.jobId, jobApplications.candidateUserId],
      })
      .returning({ id: jobApplications.id });

    if (inserted.length === 0) {
      return NextResponse.json({ ok: true, alreadyApplied: true });
    }

    await db
      .update(jobs)
      .set({ applicationCount: sql`${jobs.applicationCount} + 1` })
      .where(eq(jobs.id, jobId));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[jobs] apply failed:", err);
    return NextResponse.json({ error: "Could not submit application." }, { status: 500 });
  }
}
