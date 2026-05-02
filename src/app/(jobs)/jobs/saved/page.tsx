import { redirect } from "next/navigation";
import Link from "next/link";
import { eq, desc } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { candidateSavedJobs, jobs } from "@/lib/db/schema";
import { authOptions } from "@/lib/auth/nextauth";
import { JobCard } from "@/components/jobs/JobCard";

export const dynamic = "force-dynamic";

export default async function SavedJobsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.userType !== "candidate") {
    redirect(`/jobs/login?redirect=${encodeURIComponent("/jobs/saved")}`);
  }

  const userId = session.user.id;

  const rows = await db
    .select({ job: jobs })
    .from(candidateSavedJobs)
    .innerJoin(jobs, eq(candidateSavedJobs.jobId, jobs.id))
    .where(eq(candidateSavedJobs.candidateUserId, userId))
    .orderBy(desc(candidateSavedJobs.createdAt))
    .limit(100);

  return (
    <div className="mx-auto max-w-[920px] px-4 py-10 sm:px-6 lg:px-8">
      <p className="font-['Geist_Mono',monospace] text-[11px] font-medium uppercase tracking-[0.18em] text-[#006828]">
        Candidate dashboard
      </p>
      <h1 className="mt-2 font-['Bricolage_Grotesque',sans-serif] text-[32px] font-medium tracking-tight text-[#1c1c1c] sm:text-[40px]">
        Saved jobs
      </h1>

      <nav className="mt-6 flex flex-wrap gap-2">
        <Link href="/jobs/profile" className="rounded-full border border-black/[0.08] bg-white px-4 py-1.5 font-['Geist',sans-serif] text-[13px] font-medium text-[#1c1c1c] hover:border-[#006828]/40">
          Profile
        </Link>
        <Link href="/jobs/applications" className="rounded-full border border-black/[0.08] bg-white px-4 py-1.5 font-['Geist',sans-serif] text-[13px] font-medium text-[#1c1c1c] hover:border-[#006828]/40">
          Applications
        </Link>
        <Link href="/jobs/saved" className="rounded-full bg-[#006828] px-4 py-1.5 font-['Geist',sans-serif] text-[13px] font-medium text-white">
          Saved
        </Link>
        <Link href="/jobs" className="rounded-full border border-black/[0.08] bg-white px-4 py-1.5 font-['Geist',sans-serif] text-[13px] font-medium text-[#1c1c1c] hover:border-[#006828]/40">
          Browse jobs
        </Link>
      </nav>

      {rows.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-black/[0.06] bg-white p-8 text-center">
          <p className="font-['Bricolage_Grotesque',sans-serif] text-[20px] font-medium text-[#1c1c1c]">
            No saved jobs yet.
          </p>
          <p className="mt-2 font-['Geist',sans-serif] text-[14px] text-black/55">
            Bookmark roles you want to revisit — they all appear here.
          </p>
          <Link
            href="/jobs"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#006828] px-5 py-2 font-['Geist',sans-serif] text-[13px] font-semibold text-white"
          >
            Browse jobs
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {rows.map(({ job }) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  );
}
