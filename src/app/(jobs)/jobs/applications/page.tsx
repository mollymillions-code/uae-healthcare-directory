import { redirect } from "next/navigation";
import Link from "next/link";
import { eq, desc } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { jobApplications, jobs } from "@/lib/db/schema";
import { authOptions } from "@/lib/auth/nextauth";
import { jobDetailUrl, postedAgo, cityName } from "@/lib/jobs/format";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  submitted: "Submitted",
  seen_by_clinic: "Seen by clinic",
  shortlisted: "Shortlisted",
  interviewed: "Interviewed",
  offered: "Offered",
  hired: "Hired",
  rejected: "Not progressing",
  withdrawn: "Withdrawn",
};

export default async function ApplicationsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.userType !== "candidate") {
    redirect(`/jobs/login?redirect=${encodeURIComponent("/jobs/applications")}`);
  }

  const userId = session.user.id;

  const rows = await db
    .select({
      app: jobApplications,
      job: jobs,
    })
    .from(jobApplications)
    .innerJoin(jobs, eq(jobApplications.jobId, jobs.id))
    .where(eq(jobApplications.candidateUserId, userId))
    .orderBy(desc(jobApplications.createdAt))
    .limit(100);

  return (
    <div className="mx-auto max-w-[920px] px-4 py-10 sm:px-6 lg:px-8">
      <p className="font-['Geist_Mono',monospace] text-[11px] font-medium uppercase tracking-[0.18em] text-[#006828]">
        Candidate dashboard
      </p>
      <h1 className="mt-2 font-['Bricolage_Grotesque',sans-serif] text-[32px] font-medium tracking-tight text-[#1c1c1c] sm:text-[40px]">
        Your applications
      </h1>

      <nav className="mt-6 flex flex-wrap gap-2">
        <Link href="/jobs/profile" className="rounded-full border border-black/[0.08] bg-white px-4 py-1.5 font-['Geist',sans-serif] text-[13px] font-medium text-[#1c1c1c] hover:border-[#006828]/40">
          Profile
        </Link>
        <Link href="/jobs/applications" className="rounded-full bg-[#006828] px-4 py-1.5 font-['Geist',sans-serif] text-[13px] font-medium text-white">
          Applications
        </Link>
        <Link href="/jobs/saved" className="rounded-full border border-black/[0.08] bg-white px-4 py-1.5 font-['Geist',sans-serif] text-[13px] font-medium text-[#1c1c1c] hover:border-[#006828]/40">
          Saved
        </Link>
        <Link href="/jobs" className="rounded-full border border-black/[0.08] bg-white px-4 py-1.5 font-['Geist',sans-serif] text-[13px] font-medium text-[#1c1c1c] hover:border-[#006828]/40">
          Browse jobs
        </Link>
      </nav>

      {rows.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-black/[0.06] bg-white p-8 text-center">
          <p className="font-['Bricolage_Grotesque',sans-serif] text-[20px] font-medium text-[#1c1c1c]">
            No applications yet.
          </p>
          <p className="mt-2 font-['Geist',sans-serif] text-[14px] text-black/55">
            Browse open UAE healthcare jobs and apply with one click — your saved profile fills the rest.
          </p>
          <Link
            href="/jobs"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#006828] px-5 py-2 font-['Geist',sans-serif] text-[13px] font-semibold text-white"
          >
            Browse jobs
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-3">
          {rows.map(({ app, job }) => (
            <Link
              key={app.id}
              href={jobDetailUrl(job)}
              className="block rounded-2xl border border-black/[0.06] bg-white p-5 transition-colors hover:border-[#006828]/40"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-['Geist_Mono',monospace] text-[10px] font-medium uppercase tracking-[0.16em] text-black/45">
                    {cityName(job.citySlug)} · {job.externalClinicName ?? "Verified clinic"}
                  </p>
                  <h3 className="mt-1 font-['Bricolage_Grotesque',sans-serif] text-[18px] font-medium tracking-tight text-[#1c1c1c]">
                    {job.title}
                  </h3>
                </div>
                <span className="inline-flex items-center rounded-full border border-[#006828]/20 bg-[#006828]/[0.04] px-3 py-1 font-['Geist_Mono',monospace] text-[11px] font-medium text-[#006828]">
                  {STATUS_LABEL[app.status] ?? app.status}
                </span>
              </div>
              <p className="mt-3 font-['Geist',sans-serif] text-[12px] text-black/45">
                Applied {postedAgo(app.createdAt)}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
