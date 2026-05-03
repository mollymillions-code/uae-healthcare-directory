import { Metadata } from "next";
import Link from "next/link";
import {
  Stethoscope,
  Beaker,
  Activity,
  Pill,
  Heart,
  Hospital,
  Brain,
  Briefcase,
  ScanLine,
  ClipboardList,
  HandHeart,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema, faqPageSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { ROLE_LABELS, ROLE_ORDER, disciplinesByRole } from "@/lib/jobs/disciplines";
import { rolesUrl, UAE_CITIES } from "@/lib/jobs/format";
import { JobsSearchHero } from "@/components/jobs/JobsSearchHero";

export const revalidate = 3600;

const TITLE = "UAE Healthcare Jobs — Find Your Next Role";
const DESCRIPTION =
  "Search UAE healthcare jobs by discipline, city and experience. Build a professional profile, upload your CV, and get found by hiring clinics. Free for healthcare workers.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${getBaseUrl()}/jobs` },
  openGraph: { title: TITLE, description: DESCRIPTION, type: "website", url: `${getBaseUrl()}/jobs` },
};

const FEATURED_TILES: Array<{
  label: string;
  href: string;
  Icon: LucideIcon;
}> = [
  { label: "Doctors", href: "/jobs/discipline/specialist-physician", Icon: Stethoscope },
  { label: "Nurses", href: "/jobs/discipline/registered-nurse", Icon: Heart },
  { label: "Lab Techs", href: "/jobs/discipline/lab-technician", Icon: Beaker },
  { label: "Radiology", href: "/jobs/discipline/radiology-technologist", Icon: ScanLine },
  { label: "Pharmacy", href: "/jobs/discipline/pharmacist", Icon: Pill },
  { label: "Dental", href: "/jobs/discipline/dentist", Icon: Activity },
  { label: "Hospitalists", href: "/jobs/discipline/consultant-physician", Icon: Hospital },
  { label: "Mental Health", href: "/jobs/discipline/psychologist", Icon: Brain },
  { label: "Physio / OT", href: "/jobs/discipline/physiotherapist", Icon: HandHeart },
  { label: "Operations", href: "/jobs/discipline/clinic-manager", Icon: Briefcase },
  { label: "Coding & Billing", href: "/jobs/discipline/medical-coder", Icon: ClipboardList },
  { label: "Front Desk", href: "/jobs/discipline/medical-receptionist", Icon: Users },
];

const FAQS = [
  {
    question: "Is this a job board with public listings?",
    answer:
      "Not today — Phase 1 is the candidate side. You build a structured professional profile, upload your CV, and Zavis surfaces your candidacy to hiring clinics in our UAE network. Think of it as LinkedIn for UAE healthcare. Public clinic-posted listings (employer-side) come in the next phase, once the candidate network reaches critical mass.",
  },
  {
    question: "Is registering on Zavis really free?",
    answer:
      "Yes. There are no candidate fees, no premium tiers, no paid CV-distribution add-ons. The platform exists as part of Zavis's open-data programme alongside the UAE healthcare directory.",
  },
  {
    question: "What kinds of healthcare roles can I register for?",
    answer:
      "All UAE-licensable and clinic-operations roles. That includes physicians, nurses, midwives, lab technicians, medical lab scientists, sonographers, MRI / CT technologists, radiographers, phlebotomists, pharmacists, pharmacy technicians, dentists, dental hygienists, dental assistants, physiotherapists, occupational therapists, speech-language pathologists, dietitians, audiologists, psychologists, OR techs, anaesthesia techs, medical coders, medical billers, insurance coordinators, patient coordinators, medical receptionists, clinic managers, compliance officers and more.",
  },
  {
    question: "Do I need a UAE healthcare licence to register?",
    answer:
      "Most clinical and allied-health roles in the UAE require a regulator-issued licence specific to the emirate where you'll work — Dubai, Abu Dhabi, or the Northern Emirates. You can register your profile at any stage of the licensing journey, including pre-Dataflow. Non-clinical roles (billing, coding, reception, management) generally do not require a licence.",
  },
  {
    question: "What happens after I register?",
    answer:
      "Your profile sits in our verified-candidate pool. When a Zavis clinic client tells us what they're hiring for, we filter the pool by discipline, city, licence status and visa status, and surface profiles that match. If a clinic wants to talk, Zavis facilitates an introduction. Interview scheduling and offer negotiation happen between you and the clinic, off-platform. Your contact information is never shared without your consent.",
  },
];

export default function JobsHubPage() {
  const base = getBaseUrl();

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "UAE", url: base },
          { name: "Healthcare Jobs" },
        ])}
      />
      <JsonLd data={faqPageSchema(FAQS)} />

      {/* ── Hero with search bar ─────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#f5f8f5] via-white to-white pb-16 pt-10 sm:pb-24 sm:pt-16">
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[480px] w-[640px] -translate-x-1/2 rounded-full bg-[#006828]/[0.06] blur-3xl" />
        <div className="relative mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
          <Breadcrumb
            items={[
              { label: "UAE", href: "/" },
              { label: "Healthcare Jobs" },
            ]}
          />

          <div className="mx-auto mt-6 max-w-3xl text-center">
            <p className="font-['Geist_Mono',monospace] text-[11px] font-medium uppercase tracking-[0.18em] text-[#006828]">
              The UAE healthcare network · Free · PDPL-compliant
            </p>
            <h1 className="mt-4 font-['Bricolage_Grotesque',sans-serif] text-[36px] font-medium leading-[1.05] tracking-tight text-[#1c1c1c] sm:text-[56px]">
              Find your next healthcare job in the UAE.
            </h1>
            <p className="mx-auto mt-5 max-w-2xl font-['Geist',sans-serif] text-[15px] leading-relaxed text-black/55 sm:text-[17px]">
              Search by discipline, experience and city — or build a free profile and let hiring clinics in the Zavis network find you. From GPs in Dubai to pharmacy technicians in Ajman.
            </p>
          </div>

          <div className="mx-auto mt-8 max-w-4xl">
            <JobsSearchHero />
          </div>

          <div className="mx-auto mt-10 max-w-5xl">
            <p className="text-center font-['Geist_Mono',monospace] text-[11px] font-medium uppercase tracking-[0.18em] text-black/40">
              Popular disciplines
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {FEATURED_TILES.map((tile) => (
                <Link
                  key={tile.label}
                  href={tile.href}
                  className="group flex items-center gap-3 rounded-2xl border border-black/[0.06] bg-white px-4 py-3 transition-all hover:border-[#006828]/40 hover:shadow-[0_8px_24px_-12px_rgba(0,104,40,0.18)]"
                >
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#006828]/[0.08] transition-colors group-hover:bg-[#006828]/[0.16]">
                    <tile.Icon className="h-4 w-4 text-[#006828]" strokeWidth={2} />
                  </span>
                  <span className="font-['Geist',sans-serif] text-[14px] font-medium text-[#1c1c1c]">
                    {tile.label}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <div className="mx-auto mt-8 flex max-w-4xl flex-wrap items-center justify-center gap-2">
            <span className="font-['Geist',sans-serif] text-[12px] text-black/45">By city:</span>
            {UAE_CITIES.map((city) => (
              <Link
                key={city.slug}
                href={`/jobs/${city.slug}`}
                className="rounded-full border border-black/[0.08] bg-white px-3 py-1 font-['Geist',sans-serif] text-[12px] text-[#1c1c1c] transition-colors hover:border-[#006828]/40 hover:text-[#006828]"
              >
                {city.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────────── */}
      <section className="mx-auto max-w-[1280px] px-4 pt-4 sm:px-6 lg:px-8">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] text-[24px] font-medium tracking-tight text-[#1c1c1c]">
          How it works
        </h2>
        <ol className="mt-4 grid gap-3 sm:grid-cols-3">
          <li className="rounded-2xl border border-black/[0.06] bg-white px-5 py-4">
            <span className="font-['Geist_Mono',monospace] text-[11px] font-medium uppercase tracking-[0.18em] text-[#006828]">Step 01</span>
            <p className="mt-2 font-['Bricolage_Grotesque',sans-serif] text-[18px] font-medium tracking-tight text-[#1c1c1c]">Build your profile.</p>
            <p className="mt-2 font-['Geist',sans-serif] text-[13px] leading-relaxed text-black/55">Discipline, preferred cities, licence status, salary band, employment type, visa preferences. 7-step structured wizard with PDPL-compliant clickwrap consent.</p>
          </li>
          <li className="rounded-2xl border border-black/[0.06] bg-white px-5 py-4">
            <span className="font-['Geist_Mono',monospace] text-[11px] font-medium uppercase tracking-[0.18em] text-[#006828]">Step 02</span>
            <p className="mt-2 font-['Bricolage_Grotesque',sans-serif] text-[18px] font-medium tracking-tight text-[#1c1c1c]">Upload your CV.</p>
            <p className="mt-2 font-['Geist',sans-serif] text-[13px] leading-relaxed text-black/55">Optional but strongly recommended — most clinics want it before agreeing to talk. Stored encrypted on Zavis-controlled storage. Shared only when you authorise it.</p>
          </li>
          <li className="rounded-2xl border border-black/[0.06] bg-white px-5 py-4">
            <span className="font-['Geist_Mono',monospace] text-[11px] font-medium uppercase tracking-[0.18em] text-[#006828]">Step 03</span>
            <p className="mt-2 font-['Bricolage_Grotesque',sans-serif] text-[18px] font-medium tracking-tight text-[#1c1c1c]">Get found.</p>
            <p className="mt-2 font-['Geist',sans-serif] text-[13px] leading-relaxed text-black/55">Hiring clinics in the Zavis network filter by discipline + city + licence + experience. They reach you through Zavis; interview, offer and negotiation happen with the clinic directly.</p>
          </li>
        </ol>
      </section>

      {/* ── Browse by role family ──────────────────────────────── */}
      <section className="mx-auto max-w-[1280px] px-4 pt-16 sm:px-6 lg:px-8">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] text-[24px] font-medium tracking-tight text-[#1c1c1c]">
          All UAE healthcare roles
        </h2>
        <p className="mt-2 font-['Geist',sans-serif] text-[14px] text-black/55">
          Pick the role family closest to your work; you can refine to a specific discipline on the next page.
        </p>
        <div className="mt-6 space-y-8">
          {ROLE_ORDER.filter((r) => r !== "other").map((role) => {
            const list = disciplinesByRole(role);
            if (list.length === 0) return null;
            return (
              <div key={role}>
                <h3 className="font-['Geist_Mono',monospace] text-[11px] font-medium uppercase tracking-[0.18em] text-black/45">
                  {ROLE_LABELS[role]}
                </h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {list.map((d) => (
                    <Link
                      key={d.slug}
                      href={rolesUrl(d.slug)}
                      className="inline-flex items-center gap-2 rounded-full border border-black/[0.08] bg-white px-3.5 py-1.5 font-['Geist',sans-serif] text-[13px] text-[#1c1c1c] transition-colors hover:border-[#006828]/40 hover:text-[#006828]"
                    >
                      {d.name}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── For employers (Phase 2 teaser) ─────────────────────── */}
      <section className="mx-auto max-w-[1280px] px-4 pt-16 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-black/[0.06] bg-[#0e1410] px-8 py-10 text-white">
          <p className="font-['Geist_Mono',monospace] text-[11px] font-medium uppercase tracking-[0.18em] text-[#88e0a8]">
            For employers · Coming soon
          </p>
          <h2 className="mt-2 font-['Bricolage_Grotesque',sans-serif] text-[24px] font-medium tracking-tight text-white">
            Hiring for a UAE clinic?
          </h2>
          <p className="mt-3 max-w-2xl font-['Geist',sans-serif] text-[14px] leading-relaxed text-white/65">
            The employer side — job postings, candidate search, ATS — ships in the next phase. Until then, Zavis runs concierge matching: tell us what you&apos;re hiring for and we&apos;ll surface matching candidates from our verified-candidate pool.
          </p>
          <Link
            href="/jobs/employers"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 font-['Geist',sans-serif] text-[14px] font-semibold text-[#0e1410] transition-colors hover:bg-white/90"
          >
            Get notified when employer tools launch
          </Link>
        </div>
      </section>

      {/* ── FAQs ───────────────────────────────────────────────── */}
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] text-[24px] font-medium tracking-tight text-[#1c1c1c]">
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
    </>
  );
}
