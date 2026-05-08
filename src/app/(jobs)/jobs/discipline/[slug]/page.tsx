import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema, faqPageSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { DISCIPLINES, getDiscipline } from "@/lib/jobs/disciplines";
import { UAE_CITIES } from "@/lib/jobs/format";

export const revalidate = 3600;

export async function generateStaticParams() {
  return DISCIPLINES.map((d) => ({ slug: d.slug }));
}

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const d = getDiscipline(params.slug);
  if (!d) return {};
  const title = `${d.name} Jobs in UAE`;
  const description = `${d.plural} in UAE — build your professional profile, upload your CV, get found by hiring clinics. ${
    d.licenseAuthority ? "Regulator-aware. " : ""
  }Free for healthcare workers.`.slice(0, 155);
  return {
    title,
    description,
    alternates: { canonical: `${getBaseUrl()}/jobs/discipline/${d.slug}` },
    openGraph: { title, description, type: "website" },
  };
}

export default async function DisciplineHubPage(props: Props) {
  const params = await props.params;
  const d = getDiscipline(params.slug);
  if (!d) notFound();
  const base = getBaseUrl();

  const faqs = buildDisciplineFaqs(d);

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "UAE", url: base },
          { name: "Healthcare Careers", url: `${base}/jobs` },
          { name: `${d.name} jobs` },
        ])}
      />
      <JsonLd data={faqPageSchema(faqs)} />

      <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumb
          items={[
            { label: "UAE", href: "/" },
            { label: "Careers", href: "/jobs" },
            { label: `${d.name} jobs` },
          ]}
        />

        <section className="mt-6 max-w-3xl">
          <p className="font-['Geist_Mono',monospace] text-[11px] font-medium uppercase tracking-[0.18em] text-[#006828]">
            {d.licenseAuthority === "shared" ? "UAE-licensable" : d.licenseAuthority ? "UAE-licensable" : "Open"}
          </p>
          <h1 className="mt-3 font-['Bricolage_Grotesque',sans-serif] text-[34px] font-medium leading-[1.05] tracking-tight text-[#1c1c1c] sm:text-[44px]">
            {d.name} Jobs in UAE
          </h1>
          <p className="mt-4 font-['Geist',sans-serif] text-base leading-relaxed text-black/55">
            {d.blurb} Zavis is the professional network for UAE healthcare — build your profile once, and hiring clinics find you when they&apos;re looking for {d.plural.toLowerCase()}.
          </p>

          {d.salaryRefAed && (
            <div className="mt-5 inline-flex items-center gap-2 rounded-2xl border border-[#006828]/15 bg-[#006828]/[0.04] px-4 py-2 font-['Geist',sans-serif] text-[13px] text-[#1c1c1c]">
              <span className="text-black/55">2026 UAE salary band:</span>
              <span className="font-medium">
                AED {d.salaryRefAed.min.toLocaleString()}–{d.salaryRefAed.max.toLocaleString()} / month
              </span>
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={`/jobs/signup?discipline=${d.slug}`}
              className="group inline-flex items-center gap-2 rounded-full bg-[#006828] px-5 py-2.5 font-['Geist',sans-serif] text-[14px] font-semibold text-white shadow-[0_8px_24px_-8px_rgba(0,104,40,0.45)] hover:bg-[#005220]"
            >
              Build your {d.name} profile
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" strokeWidth={2.25} />
            </Link>
          </div>
        </section>

        <section className="mt-12">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] text-[20px] font-medium tracking-tight text-[#1c1c1c]">
            {d.plural} in UAE — by city
          </h2>
          <p className="mt-2 font-['Geist',sans-serif] text-[14px] text-black/55">
            Each city page covers the licensing authority for that emirate, salary context, and the typical clinic groups hiring {d.plural.toLowerCase()}.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {UAE_CITIES.map((city) => (
              <Link
                key={city.slug}
                href={`/jobs/discipline/${d.slug}/${city.slug}`}
                className="inline-flex items-center gap-2 rounded-full border border-black/[0.08] bg-white px-3.5 py-1.5 font-['Geist',sans-serif] text-[13px] text-[#1c1c1c] transition-colors hover:border-[#006828]/40 hover:text-[#006828]"
              >
                {d.name} in {city.name}
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-16 rounded-2xl border border-[#006828]/15 bg-[#006828]/[0.04] p-6">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] text-[20px] font-medium tracking-tight text-[#1c1c1c]">
            Get found by clinics hiring {d.plural.toLowerCase()}
          </h2>
          <p className="mt-3 max-w-2xl font-['Geist',sans-serif] text-[14px] leading-relaxed text-black/65">
            Skip the inbox-shotgun routine of mailing every clinic separately. Build your Zavis profile once, keep it current, and Zavis surfaces your candidacy to clinics in our network as they hire. Free for healthcare workers, always.
          </p>
          <Link
            href={`/jobs/signup?discipline=${d.slug}`}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#006828] px-5 py-2.5 font-['Geist',sans-serif] text-[14px] font-semibold text-white"
          >
            Create your profile
          </Link>
        </section>

        <section className="mt-16 max-w-3xl">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] text-[20px] font-medium tracking-tight text-[#1c1c1c]">
            Frequently asked
          </h2>
          <div className="mt-4 space-y-3">
            {faqs.map((f) => (
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

function buildDisciplineFaqs(d: ReturnType<typeof getDiscipline>) {
  if (!d) return [];
  const faqs = [
    {
      question: `What does a ${d.name.toLowerCase()} earn in the UAE?`,
      answer: d.salaryRefAed
        ? `Mid-experience ${d.plural.toLowerCase()} in the UAE typically earn AED ${d.salaryRefAed.min.toLocaleString()}–${d.salaryRefAed.max.toLocaleString()} per month. Senior roles, group-leadership posts and specialist credentials push to the higher end. Salaries are usually quoted as monthly gross before any housing, schooling and flight allowances.`
        : `${d.plural} salaries in the UAE vary widely by employer, seniority and credentials. We surface salary expectations on each candidate profile so clinics see them in context.`,
    },
    {
      question: `Do I need a UAE licence to work as a ${d.name.toLowerCase()}?`,
      answer: d.licenseAuthority
        ? `Yes — most ${d.plural.toLowerCase()} roles in the UAE require a clinical licence from the regulator that covers the emirate where you'll work. You can build your Zavis profile at any stage, including pre-Dataflow. Clinics filter for the licence status they need.`
        : `${d.plural} roles do not always require a clinical licence in the UAE — many are open to candidates with a relevant degree or certification. Your Zavis profile captures whatever credentials you do have.`,
    },
    {
      question: "How does Zavis match me to clinics?",
      answer:
        "Once you create a profile, your record sits in our verified-candidate pool. When clinics in our client network look for your discipline, city and licence status, Zavis surfaces matching profiles to them. They reach out through Zavis; interviews, offers and negotiations happen between you and the clinic, off-platform.",
    },
    {
      question: "Can clinics post jobs publicly here?",
      answer:
        "Not yet. Phase 1 is the candidate side — building the professional network. Clinic-side tools (job posts, candidate search, employer pages, applicant tracking) ship in the next phase, once the candidate network reaches critical mass. Today, Zavis acts as the matchmaker.",
    },
  ];
  return faqs;
}
