import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Briefcase, Heart, Shield } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema, faqPageSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import {
  ROLE_LABELS,
  ROLE_ORDER,
  disciplinesByRole,
} from "@/lib/jobs/disciplines";
import { listJobs, getJobsHubAggregates } from "@/lib/jobs/queries";
import { JobCard } from "@/components/jobs/JobCard";
import { rolesUrl, UAE_CITIES } from "@/lib/jobs/format";

export const revalidate = 3600;

const TITLE = "Healthcare Jobs in UAE — Free Job Board | Zavis";
const DESCRIPTION =
  "Free UAE healthcare-jobs platform. Doctors, nurses, lab techs, radiographers, pharmacists, dental, billers, clinic managers — DHA, DOH, MOHAP aware.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${getBaseUrl()}/jobs` },
  openGraph: { title: TITLE, description: DESCRIPTION, type: "website", url: `${getBaseUrl()}/jobs` },
};

const FAQS = [
  {
    question: "Is Open Healthcare Jobs by Zavis really free?",
    answer:
      "Yes. The platform is free for candidates and free for clinics. There are no posting fees, no per-applicant fees, and no premium tiers. The directory and the jobs platform are part of Zavis's open-data programme — they exist to keep UAE healthcare hiring efficient and transparent.",
  },
  {
    question: "What kinds of healthcare roles can I find here?",
    answer:
      "All UAE-licensable and clinic-operations roles. That includes physicians, nurses, midwives, lab technicians, medical lab scientists, sonographers, MRI / CT technologists, radiographers, phlebotomists, pharmacists, pharmacy technicians, dentists, dental hygienists, dental assistants, physiotherapists, occupational therapists, speech-language pathologists, dietitians, audiologists, psychologists, OR techs, anaesthesia techs, medical coders, medical billers, insurance coordinators, patient coordinators, medical receptionists, clinic managers, compliance officers and more.",
  },
  {
    question: "Do I need DHA, DOH or MOHAP licensing to apply?",
    answer:
      "Most clinical and allied-health roles in the UAE require a licence from one of the three regulators — DHA (Dubai), DOH (Abu Dhabi) or MOHAP (federal — covers Sharjah, Ajman, Ras Al Khaimah, Fujairah, Umm Al Quwain). Each job posting tells you which licence is required and whether the employer expects Dataflow Verification before applying. Non-clinical roles (billing, coding, reception, management) generally do not require a licence.",
  },
  {
    question: "Can clinics post jobs directly?",
    answer:
      "Yes. Clinics that have claimed their listing on the Zavis directory can post unlimited jobs through the provider portal once they're enrolled. There is no posting cost. To get started, claim your listing first — once verified, jobs posting will appear in your provider dashboard.",
  },
  {
    question: "Do I need to upload a CV to apply?",
    answer:
      "Not at signup. CV upload is optional during signup and can be added later from your profile. Most clinics will ask for it at apply-time, but Zavis does not require it to create your candidate profile.",
  },
];

export default async function JobsHubPage() {
  const base = getBaseUrl();
  const [latest, aggregates] = await Promise.all([
    listJobs({ limit: 12 }),
    getJobsHubAggregates(),
  ]);

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "UAE", url: base },
          { name: "Healthcare Jobs" },
        ])}
      />
      <JsonLd data={faqPageSchema(FAQS)} />

      <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumb
          items={[
            { label: "UAE", href: "/" },
            { label: "Healthcare Jobs" },
          ]}
        />

        {/* ── Hero ────────────────────────────────────────────────── */}
        <section className="mt-6 max-w-3xl">
          <p className="font-['Geist_Mono',monospace] text-[11px] font-medium uppercase tracking-[0.18em] text-[#006828]">
            Free · No fees · Open
          </p>
          <h1 className="mt-3 font-['Bricolage_Grotesque',sans-serif] text-[34px] font-medium leading-[1.05] tracking-tight text-[#1c1c1c] sm:text-[48px]">
            Open Healthcare Jobs in the UAE.
          </h1>
          <p className="mt-4 font-['Geist',sans-serif] text-base leading-relaxed text-black/55">
            From DHA-licensed GPs in Dubai to MOHAP-licensed pharmacy technicians in Ajman — and everything in between. Doctors, nurses, allied health, dental, pharmacy, imaging, billing, coding, clinic operations. {aggregates.total > 0 ? `${aggregates.total} active openings.` : "Now indexing the UAE healthcare-jobs market."}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/jobs/signup"
              className="group inline-flex items-center gap-2 rounded-full bg-[#006828] px-5 py-2.5 font-['Geist',sans-serif] text-[14px] font-semibold text-white shadow-[0_8px_24px_-8px_rgba(0,104,40,0.45)] transition-all hover:bg-[#005220]"
            >
              Create your profile
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" strokeWidth={2.25} />
            </Link>
            <Link
              href="/jobs/guides"
              className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-5 py-2.5 font-['Geist',sans-serif] text-[14px] font-medium text-[#1c1c1c] transition-colors hover:border-[#006828] hover:text-[#006828]"
            >
              Read the UAE healthcare-careers guides
            </Link>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 font-['Geist',sans-serif] text-[12px] text-black/45">
            <span className="inline-flex items-center gap-1.5">
              <Heart className="h-3.5 w-3.5 text-[#006828]" fill="#006828" strokeWidth={0} />
              Always free for candidates
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-[#006828]" strokeWidth={2.25} />
              UAE PDPL-compliant
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Briefcase className="h-3.5 w-3.5 text-[#006828]" strokeWidth={2.25} />
              DHA, DOH, MOHAP licence-aware
            </span>
          </div>
        </section>

        {/* ── Browse by city ─────────────────────────────────────── */}
        <section className="mt-16">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] text-[22px] font-medium tracking-tight text-[#1c1c1c]">
            Browse by city
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {UAE_CITIES.map((city) => (
              <Link
                key={city.slug}
                href={`/jobs/${city.slug}`}
                className="group rounded-2xl border border-black/[0.06] bg-white px-4 py-3 transition-all hover:border-[#006828]/40 hover:shadow-[0_6px_18px_-8px_rgba(0,104,40,0.18)]"
              >
                <p className="font-['Bricolage_Grotesque',sans-serif] text-[16px] font-medium text-[#1c1c1c] group-hover:text-[#006828]">
                  {city.name}
                </p>
                <p className="mt-0.5 font-['Geist',sans-serif] text-[12px] text-black/45">
                  {aggregates.byCity[city.slug] ?? 0} open roles
                </p>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Browse by role family ──────────────────────────────── */}
        <section className="mt-16">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] text-[22px] font-medium tracking-tight text-[#1c1c1c]">
            Browse by role
          </h2>
          <div className="mt-4 space-y-8">
            {ROLE_ORDER.filter((r) => r !== "other").map((role) => {
              const list = disciplinesByRole(role);
              if (list.length === 0) return null;
              return (
                <div key={role}>
                  <h3 className="font-['Geist_Mono',monospace] text-[11px] font-medium uppercase tracking-[0.18em] text-black/45">
                    {ROLE_LABELS[role]}
                  </h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {list.map((d) => {
                      const count = aggregates.byDiscipline[d.slug] ?? 0;
                      return (
                        <Link
                          key={d.slug}
                          href={rolesUrl(d.slug)}
                          className="inline-flex items-center gap-2 rounded-full border border-black/[0.08] bg-white px-3.5 py-1.5 font-['Geist',sans-serif] text-[13px] text-[#1c1c1c] transition-colors hover:border-[#006828]/40 hover:text-[#006828]"
                        >
                          <span>{d.name}</span>
                          {count > 0 && (
                            <span className="rounded-full bg-[#006828]/[0.08] px-1.5 py-0.5 text-[11px] font-medium text-[#006828]">
                              {count}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Latest jobs ────────────────────────────────────────── */}
        {latest.length > 0 && (
          <section className="mt-16">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] text-[22px] font-medium tracking-tight text-[#1c1c1c]">
              Latest openings
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {latest.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          </section>
        )}

        {/* ── FAQs ───────────────────────────────────────────────── */}
        <section className="mt-16 max-w-3xl">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] text-[22px] font-medium tracking-tight text-[#1c1c1c]">
            Frequently asked
          </h2>
          <div className="mt-4 space-y-3">
            {FAQS.map((f) => (
              <details
                key={f.question}
                className="rounded-2xl border border-black/[0.06] bg-white px-5 py-4 open:bg-[#006828]/[0.02]"
              >
                <summary className="cursor-pointer font-['Bricolage_Grotesque',sans-serif] text-[16px] font-medium tracking-tight text-[#1c1c1c]">
                  {f.question}
                </summary>
                <p className="mt-3 font-['Geist',sans-serif] text-[14px] leading-relaxed text-black/65">
                  {f.answer}
                </p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
