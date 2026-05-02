import { NextRequest, NextResponse } from "next/server";
import { eq, and, sql } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { jobs, candidateSavedJobs } from "@/lib/db/schema";
import { authOptions } from "@/lib/auth/nextauth";
import { createId } from "@/lib/id";

async function requireCandidate() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.userType !== "candidate") {
    return null;
  }
  return session.user.id;
}

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const candidateUserId = await requireCandidate();
  if (!candidateUserId) {
    return NextResponse.json({ error: "Sign in as a candidate to save jobs." }, { status: 401 });
  }
  const jobId = params.id;

  const job = (
    await db.select({ id: jobs.id }).from(jobs).where(eq(jobs.id, jobId)).limit(1)
  )[0];
  if (!job) {
    return NextResponse.json({ error: "Job not found." }, { status: 404 });
  }

  const existing = (
    await db
      .select({ id: candidateSavedJobs.id })
      .from(candidateSavedJobs)
      .where(
        and(
          eq(candidateSavedJobs.candidateUserId, candidateUserId),
          eq(candidateSavedJobs.jobId, jobId)
        )
      )
      .limit(1)
  )[0];

  if (!existing) {
    await db.insert(candidateSavedJobs).values({
      id: createId("sav"),
      candidateUserId,
      jobId,
    });
    await db
      .update(jobs)
      .set({ savedCount: sql`${jobs.savedCount} + 1` })
      .where(eq(jobs.id, jobId));
  }

  return NextResponse.json({ ok: true, saved: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const candidateUserId = await requireCandidate();
  if (!candidateUserId) {
    return NextResponse.json({ error: "Sign in as a candidate to manage saved jobs." }, { status: 401 });
  }
  const jobId = params.id;

  await db
    .delete(candidateSavedJobs)
    .where(
      and(
        eq(candidateSavedJobs.candidateUserId, candidateUserId),
        eq(candidateSavedJobs.jobId, jobId)
      )
    );

  return NextResponse.json({ ok: true, saved: false });
}
