import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Heart, Briefcase, Building2 } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

export const revalidate = 86400;

const TITLE = "Get started with Zavis — patient, candidate, or clinic | Zavis";
const DESCRIPTION =
  "Zavis is the open UAE healthcare network — directory, jobs board, and editorial intelligence in one place. Pick your path: patients save clinics and insurance prefs, candidates apply to UAE healthcare jobs for free, clinics manage their listings and post jobs.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${getBaseUrl()}/get-started` },
  openGraph: { title: TITLE, description: DESCRIPTION, type: "website" },
};

export default function GetStartedPage() {
  const base = getBaseUrl();

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "UAE", url: base },
          { name: "Get started" },
        ])}
      />

      <div className="mx-auto max-w-[1180px] px-4 py-10 sm:px-6 lg:px-8">
        <Breadcrumb
          items={[
            { label: "UAE", href: "/" },
            { label: "Get started" },
          ]}
        />

        <section className="mt-6 max-w-3xl">
          <p className="font-['Geist_Mono',monospace] text-[11px] font-medium uppercase tracking-[0.18em] text-[#006828]">
            Three free paths
          </p>
          <h1 className="mt-3 font-['Bricolage_Grotesque',sans-serif] text-[34px] font-medium leading-[1.05] tracking-tight text-[#1c1c1c] sm:text-[44px]">
            Get started with Zavis.
          </h1>
          <p className="mt-4 font-['Geist',sans-serif] text-base leading-relaxed text-black/55">
            One open UAE healthcare network — three first-class user types. Patients save clinics and insurance preferences. Healthcare workers apply to UAE jobs. Clinics manage their listings and post openings. All free.
          </p>
        </section>

        <section className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {/* Patient */}
          <div className="flex flex-col rounded-2xl border border-black/[0.06] bg-white p-6">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#006828]/[0.06]">
              <Heart className="h-4 w-4 text-[#006828]" fill="#006828" strokeWidth={0} />
            </span>
            <h2 className="mt-4 font-['Bricolage_Grotesque',sans-serif] text-[22px] font-medium tracking-tight text-[#1c1c1c]">
              I&apos;m a patient
            </h2>
            <p className="mt-2 font-['Geist',sans-serif] text-[14px] leading-relaxed text-black/55">
              Save clinics, set your insurance once and see direct-billing-eligible providers first. The Zavis directory covers 17,000+ DHA, DOH and MOHAP-licensed UAE healthcare facilities.
            </p>
            <ul className="mt-5 space-y-2 font-['Geist',sans-serif] text-[13px] text-black/65">
              <li>• Save unlimited clinics &amp; doctors</li>
              <li>• Track your insurance preferences</li>
              <li>• Personal health-record vault (coming soon)</li>
            </ul>
            <div className="mt-auto flex flex-col gap-2 pt-6">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#006828] px-5 py-2.5 font-['Geist',sans-serif] text-[14px] font-semibold text-white shadow-[0_8px_24px_-8px_rgba(0,104,40,0.45)] hover:bg-[#005220]"
              >
                Create patient account
                <ArrowRight className="h-4 w-4" strokeWidth={2.25} />
              </Link>
              <Link
                href="/login"
                className="font-['Geist',sans-serif] text-center text-[13px] text-black/55 hover:text-[#1c1c1c]"
              >
                Already have one? Sign in
              </Link>
            </div>
          </div>

          {/* Candidate */}
          <div className="flex flex-col rounded-2xl border border-[#006828]/15 bg-[#006828]/[0.02] p-6">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#006828]/[0.1]">
              <Briefcase className="h-4 w-4 text-[#006828]" strokeWidth={2.25} />
            </span>
            <h2 className="mt-4 font-['Bricolage_Grotesque',sans-serif] text-[22px] font-medium tracking-tight text-[#1c1c1c]">
              I&apos;m looking for a healthcare job
            </h2>
            <p className="mt-2 font-['Geist',sans-serif] text-[14px] leading-relaxed text-black/55">
              Doctors, nurses, lab techs, sonographers, pharmacists, dental staff, billers, coders, clinic managers — every UAE healthcare role, in one place. Free for candidates, free for clinics.
            </p>
            <ul className="mt-5 space-y-2 font-['Geist',sans-serif] text-[13px] text-black/65">
              <li>• Apply to UAE jobs in seconds</li>
              <li>• Save jobs and track applications</li>
              <li>• PDPL-compliant privacy by default</li>
            </ul>
            <div className="mt-auto flex flex-col gap-2 pt-6">
              <Link
                href="/jobs/signup"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#006828] px-5 py-2.5 font-['Geist',sans-serif] text-[14px] font-semibold text-white shadow-[0_8px_24px_-8px_rgba(0,104,40,0.45)] hover:bg-[#005220]"
              >
                Create candidate profile
                <ArrowRight className="h-4 w-4" strokeWidth={2.25} />
              </Link>
              <Link
                href="/jobs/login"
                className="font-['Geist',sans-serif] text-center text-[13px] text-black/55 hover:text-[#1c1c1c]"
              >
                Already have one? Sign in
              </Link>
            </div>
          </div>

          {/* Clinic */}
          <div className="flex flex-col rounded-2xl border border-black/[0.06] bg-white p-6">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#006828]/[0.06]">
              <Building2 className="h-4 w-4 text-[#006828]" strokeWidth={2.25} />
            </span>
            <h2 className="mt-4 font-['Bricolage_Grotesque',sans-serif] text-[22px] font-medium tracking-tight text-[#1c1c1c]">
              I run a clinic
            </h2>
            <p className="mt-2 font-['Geist',sans-serif] text-[14px] leading-relaxed text-black/55">
              Claim your Zavis listing to manage your details, hours, services and insurance panel. Once verified, post unlimited jobs through the provider portal — also free.
            </p>
            <ul className="mt-5 space-y-2 font-['Geist',sans-serif] text-[13px] text-black/65">
              <li>• Free listing management</li>
              <li>• Free job posting (no per-applicant fees)</li>
              <li>• Free Zavis tools for clinics (review reply, intake forms, more)</li>
            </ul>
            <div className="mt-auto flex flex-col gap-2 pt-6">
              <Link
                href="/claim"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#006828] px-5 py-2.5 font-['Geist',sans-serif] text-[14px] font-semibold text-white shadow-[0_8px_24px_-8px_rgba(0,104,40,0.45)] hover:bg-[#005220]"
              >
                Claim your listing
                <ArrowRight className="h-4 w-4" strokeWidth={2.25} />
              </Link>
              <Link
                href="/list-your-practice"
                className="font-['Geist',sans-serif] text-center text-[13px] text-black/55 hover:text-[#1c1c1c]"
              >
                Not listed yet? Add your clinic
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-14 max-w-3xl">
          <p className="font-['Geist',sans-serif] text-[14px] leading-relaxed text-black/55">
            Why three separate paths? Each role has different data sensitivity, different consent boundaries, different feature surface. We keep them deliberately apart so a recruiter never sees a patient&apos;s health-related searches, a patient never lands on the recruiter side by accident, and a clinic owner can run their listing without an account that doubles as a personal profile.
          </p>
        </section>
      </div>
    </>
  );
}
