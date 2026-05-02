import Link from "next/link";
import { MapPin, Briefcase, Building2 } from "lucide-react";
import type { JobRow } from "@/lib/jobs/queries";
import { cityName, disciplineName, formatSalaryRange, postedAgo, jobDetailUrl } from "@/lib/jobs/format";

interface Props {
  job: JobRow;
}

export function JobCard({ job }: Props) {
  return (
    <Link
      href={jobDetailUrl(job)}
      className="group block rounded-2xl border border-black/[0.06] bg-white px-6 py-5 transition-all hover:border-[#006828]/40 hover:shadow-[0_8px_24px_-8px_rgba(0,104,40,0.18)]"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-['Geist_Mono',monospace] text-[10px] font-medium uppercase tracking-[0.18em] text-[#006828]">
            {disciplineName(job.disciplineSlug)} · {cityName(job.citySlug)}
          </p>
          <h3 className="mt-1.5 font-['Bricolage_Grotesque',sans-serif] text-[18px] font-medium leading-snug tracking-tight text-[#1c1c1c] group-hover:text-[#006828]">
            {job.title}
          </h3>
        </div>
        {job.salaryDisclosed && job.salaryMinAed && (
          <p className="shrink-0 rounded-full border border-[#006828]/20 bg-[#006828]/[0.04] px-3 py-1 font-['Geist',sans-serif] text-[12px] font-medium text-[#006828]">
            {formatSalaryRange(job.salaryMinAed, job.salaryMaxAed, true)}
          </p>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 font-['Geist',sans-serif] text-[13px] text-black/55">
        <span className="inline-flex items-center gap-1.5">
          <Building2 className="h-3.5 w-3.5" strokeWidth={1.75} />
          {job.externalClinicName ?? "Verified clinic"}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5" strokeWidth={1.75} />
          {cityName(job.citySlug)}
        </span>
        {job.employmentType && (
          <span className="inline-flex items-center gap-1.5">
            <Briefcase className="h-3.5 w-3.5" strokeWidth={1.75} />
            {job.employmentType.replace(/_/g, " ")}
          </span>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[12px] text-black/40">
        <span className="font-['Geist_Mono',monospace] uppercase tracking-[0.12em]">
          {job.licenseRequired ? `${job.licenseRequired.toUpperCase()} licence` : "License flexible"}
        </span>
        <span>{postedAgo(job.postedAt)}</span>
      </div>
    </Link>
  );
}
