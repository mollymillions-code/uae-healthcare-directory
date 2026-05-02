import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { UAE_CITIES } from "@/lib/jobs/format";
import { db } from "@/lib/db";
import { providers, candidateProfiles } from "@/lib/db/schema";
import {
  getJobById,
  incrementJobView,
  isJobSavedBy,
  hasAppliedTo,
  listJobs,
} from "@/lib/jobs/queries";
import { jobPostingSchema } from "@/lib/jobs/jobposting-schema";
import { authOptions } from "@/lib/auth/nextauth";
import {
  cityName,
  disciplineName,
  formatSalaryRange,
  postedAgo,
  jobDetailUrl,
} from "@/lib/jobs/format";
import { JobActions } from "@/components/jobs/JobActions";
import { JobCard } from "@/components/jobs/JobCard";
import { Building2, Globe, MapPin, Briefcase, Shield, ShieldCheck } from "lucide-react";

export const revalidate = 600;

interface Props {
  params: { city: string; specialty: string; idSlug: string };
}

function parseIdSlug(idSlug: string): { id: string; slug: string } | null {
  // Expected: <id-prefix>_<random>-<title-slug>-<city-slug>
  // The ID always starts with "job_" so we split on the first "-" after that.
  if (!idSlug.startsWith("job_")) return null;
  const dash = idSlug.indexOf("-");
  if (dash === -1) return { id: idSlug, slug: "" };
  return { id: idSlug.slice(0, dash), slug: idSlug.slice(dash + 1) };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const parsed = parseIdSlug(params.idSlug);
  if (!parsed) return {};
  const job = await getJobById(parsed.id);
  if (!job) return {};
  const city = UAE_CITIES.find((c) => c.slug === job.citySlug);
  const title = `${job.title} — ${cityName(job.citySlug)} | Zavis Jobs`;
  const description = job.descriptionMd.slice(0, 155);
  return {
    title,
    description,
    alternates: { canonical: `${getBaseUrl()}${jobDetailUrl(job)}` },
    openGraph: {
      title,
      description,
      type: "website",
      url: `${getBaseUrl()}${jobDetailUrl(job)}`,
      ...(city ? { locale: "en_AE" } : {}),
    },
  };
}

export default async function JobDetailPage({ params }: Props) {
  const parsed = parseIdSlug(params.idSlug);
  if (!parsed) notFound();

  const job = await getJobById(parsed.id);
  if (!job || job.citySlug !== params.city || job.specialtySlug !== params.specialty) {
    notFound();
  }
  if (job.status !== "published") notFound();

  const base = getBaseUrl();

  // Fire and forget — view counter
  incrementJobView(job.id).catch(() => undefined);

  // Resolve clinic for JobPosting JSON-LD if linked
  let clinic = null;
  if (job.clinicId) {
    clinic = (
      await db
        .select({
          name: providers.name,
          websiteUrl: providers.website,
          citySlug: providers.citySlug,
          addressLine: providers.address,
          slug: providers.slug,
        })
        .from(providers)
        .where(eq(providers.id, job.clinicId))
        .limit(1)
    )[0];
  }

  // Session-aware action state
  const session = await getServerSession(authOptions);
  let initiallySaved = false;
  let initiallyApplied = false;
  let hasCv = false;
  let userType: "candidate" | "consumer" | "clinic" | null = null;
  if (session?.user?.id) {
    userType = (session.user.userType as "candidate" | "consumer" | "clinic" | undefined) ?? null;
    if (userType === "candidate") {
      const [saved, applied, profile] = await Promise.all([
        isJobSavedBy(session.user.id, job.id),
        hasAppliedTo(session.user.id, job.id),
        db
          .select({ cvUrl: candidateProfiles.cvUrl })
          .from(candidateProfiles)
          .where(eq(candidateProfiles.userId, session.user.id))
          .limit(1),
      ]);
      initiallySaved = saved;
      initiallyApplied = applied;
      hasCv = Boolean(profile[0]?.cvUrl);
    }
  }

  // Related: same discipline, different city — limit 4
  const related = (
    await listJobs({ disciplineSlug: job.disciplineSlug ?? undefined, limit: 5 })
  ).filter((j) => j.id !== job.id).slice(0, 4);

  const cityRow = UAE_CITIES.find((c) => c.slug === job.citySlug);

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "UAE", url: base },
          { name: "Healthcare Jobs", url: `${base}/jobs` },
          { name: cityName(job.citySlug), url: `${base}/jobs/${job.citySlug}` },
          { name: job.title },
        ])}
      />
      <JsonLd data={jobPostingSchema(job, clinic)} />

      <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumb
          items={[
            { label: "UAE", href: "/" },
            { label: "Jobs", href: "/jobs" },
            { label: cityName(job.citySlug), href: `/jobs/${job.citySlug}` },
            { label: job.title },
          ]}
        />

        <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_320px]">
          <article className="min-w-0">
            <p className="font-['Geist_Mono',monospace] text-[11px] font-medium uppercase tracking-[0.18em] text-[#006828]">
              {disciplineName(job.disciplineSlug)} · {cityName(job.citySlug)}
            </p>
            <h1 className="mt-3 font-['Bricolage_Grotesque',sans-serif] text-[30px] font-medium leading-tight tracking-tight text-[#1c1c1c] sm:text-[36px]">
              {job.title}
            </h1>

            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 font-['Geist',sans-serif] text-[14px] text-black/65">
              <span className="inline-flex items-center gap-2">
                <Building2 className="h-4 w-4" strokeWidth={1.75} />
                {clinic?.name ?? job.externalClinicName ?? "UAE healthcare provider"}
              </span>
              <span className="inline-flex items-center gap-2">
                <MapPin className="h-4 w-4" strokeWidth={1.75} />
                {cityName(job.citySlug)}
                {cityRow ? `, ${cityRow.emirate} emirate` : ""}
              </span>
              {job.employmentType && (
                <span className="inline-flex items-center gap-2 capitalize">
                  <Briefcase className="h-4 w-4" strokeWidth={1.75} />
                  {job.employmentType.replace(/_/g, " ")}
                </span>
              )}
              {job.licenseRequired && (
                <span className="inline-flex items-center gap-2 uppercase">
                  <ShieldCheck className="h-4 w-4 text-[#006828]" strokeWidth={1.75} />
                  {job.licenseRequired} licence
                </span>
              )}
              {job.dataflowRequired && (
                <span className="inline-flex items-center gap-2">
                  <Shield className="h-4 w-4" strokeWidth={1.75} />
                  Dataflow required
                </span>
              )}
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3 font-['Geist',sans-serif] text-[14px]">
              <span className="rounded-full border border-[#006828]/20 bg-[#006828]/[0.04] px-3 py-1 font-medium text-[#006828]">
                {formatSalaryRange(job.salaryMinAed, job.salaryMaxAed, job.salaryDisclosed)}
              </span>
              <span className="text-black/45">Posted {postedAgo(job.postedAt)}</span>
              {job.visaSponsorship && (
                <span className="rounded-full bg-black/[0.04] px-3 py-1 text-black/60">
                  Visa sponsorship available
                </span>
              )}
            </div>

            <div className="mt-8">
              <h2 className="font-['Bricolage_Grotesque',sans-serif] text-[18px] font-medium tracking-tight text-[#1c1c1c]">
                About this role
              </h2>
              <div className="mt-3 whitespace-pre-line font-['Geist',sans-serif] text-[15px] leading-relaxed text-black/70">
                {job.descriptionMd}
              </div>
            </div>

            {job.requirementsMd && (
              <div className="mt-8">
                <h2 className="font-['Bricolage_Grotesque',sans-serif] text-[18px] font-medium tracking-tight text-[#1c1c1c]">
                  What you need
                </h2>
                <div className="mt-3 whitespace-pre-line font-['Geist',sans-serif] text-[15px] leading-relaxed text-black/70">
                  {job.requirementsMd}
                </div>
              </div>
            )}

            {job.benefitsMd && (
              <div className="mt-8">
                <h2 className="font-['Bricolage_Grotesque',sans-serif] text-[18px] font-medium tracking-tight text-[#1c1c1c]">
                  What the clinic offers
                </h2>
                <div className="mt-3 whitespace-pre-line font-['Geist',sans-serif] text-[15px] leading-relaxed text-black/70">
                  {job.benefitsMd}
                </div>
              </div>
            )}

            {clinic?.slug && (
              <div className="mt-8 rounded-2xl border border-black/[0.06] bg-white p-5">
                <p className="font-['Geist_Mono',monospace] text-[11px] font-medium uppercase tracking-[0.18em] text-black/45">
                  About the employer
                </p>
                <p className="mt-2 font-['Bricolage_Grotesque',sans-serif] text-[18px] font-medium text-[#1c1c1c]">
                  {clinic.name}
                </p>
                <Link
                  href={`/${clinic.slug}`}
                  className="mt-2 inline-flex items-center gap-1.5 font-['Geist',sans-serif] text-[13px] font-medium text-[#006828]"
                >
                  View on Zavis directory
                </Link>
              </div>
            )}

            {!clinic && job.externalClinicUrl && (
              <div className="mt-8 rounded-2xl border border-black/[0.06] bg-white p-5">
                <p className="font-['Geist_Mono',monospace] text-[11px] font-medium uppercase tracking-[0.18em] text-black/45">
                  Listing source
                </p>
                <p className="mt-2 font-['Bricolage_Grotesque',sans-serif] text-[16px] font-medium text-[#1c1c1c]">
                  {job.externalClinicName ?? "External listing"}
                </p>
                <a
                  href={job.externalClinicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 font-['Geist',sans-serif] text-[13px] font-medium text-[#006828]"
                >
                  <Globe className="h-3.5 w-3.5" strokeWidth={2.25} /> Original listing
                </a>
              </div>
            )}
          </article>

          <aside className="lg:sticky lg:top-20 lg:self-start">
            <div className="rounded-2xl border border-black/[0.06] bg-white p-5">
              <p className="font-['Geist_Mono',monospace] text-[11px] font-medium uppercase tracking-[0.18em] text-black/45">
                Apply with Zavis
              </p>
              <p className="mt-2 font-['Bricolage_Grotesque',sans-serif] text-[16px] font-medium leading-snug text-[#1c1c1c]">
                Free for candidates. No fees. No spam.
              </p>
              <div className="mt-4">
                <JobActions
                  jobId={job.id}
                  initiallySaved={initiallySaved}
                  initiallyApplied={initiallyApplied}
                  hasCv={hasCv}
                  candidateUserType={userType}
                />
              </div>
            </div>

            {related.length > 0 && (
              <div className="mt-6">
                <p className="font-['Geist_Mono',monospace] text-[11px] font-medium uppercase tracking-[0.18em] text-black/45">
                  Similar roles
                </p>
                <div className="mt-3 space-y-3">
                  {related.map((j) => (
                    <JobCard key={j.id} job={j} />
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </>
  );
}
