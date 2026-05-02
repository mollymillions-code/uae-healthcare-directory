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
  return DISCIPLINES.flatMap((d) =>
    UAE_CITIES.map((c) => ({ slug: d.slug, city: c.slug }))
  );
}

interface Props {
  params: { slug: string; city: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const d = getDiscipline(params.slug);
  const city = UAE_CITIES.find((c) => c.slug === params.city);
  if (!d || !city) return {};
  const title = `${d.name} Jobs in ${city.name} | Zavis`;
  const description = `${d.plural} jobs in ${city.name}, UAE. ${d.blurb} Free for healthcare workers.`.slice(0, 155);
  return {
    title,
    description,
    alternates: { canonical: `${getBaseUrl()}/jobs/discipline/${d.slug}/${city.slug}` },
    openGraph: { title, description, type: "website" },
  };
}

export default function DisciplineCityPage({ params }: Props) {
  const d = getDiscipline(params.slug);
  const city = UAE_CITIES.find((c) => c.slug === params.city);
  if (!d || !city) notFound();
  const base = getBaseUrl();

  const faqs = [
    {
      question: `What does a ${d.name.toLowerCase()} earn in ${city.name}?`,
      answer: d.salaryRefAed
        ? `Mid-experience ${d.plural.toLowerCase()} in ${city.name} typically earn AED ${d.salaryRefAed.min.toLocaleString()}–${d.salaryRefAed.max.toLocaleString()} per month. Premium hospital groups and group-leadership roles push to the higher end. Salaries are usually quoted as monthly gross before housing, schooling and flight allowances.`
        : `${d.plural} salaries in ${city.name} vary widely by employer, seniority and credentials. Each candidate profile on Zavis surfaces salary expectations to clinics in context.`,
    },
    {
      question: `Do I need a UAE healthcare licence to work as a ${d.name.toLowerCase()} in ${city.name}?`,
      answer: d.licenseAuthority
        ? `Yes — clinical and allied-health roles in ${city.name} require a regulator-issued clinical licence specific to the ${city.emirate} emirate. International candidates also typically need to clear Dataflow primary-source verification before sitting the licence-eligibility test.`
        : `${d.plural} roles do not always require a clinical licence — specific employer requirements are listed when clinics search the candidate pool.`,
    },
    {
      question: `How long does the hiring process take in ${city.name}?`,
      answer: `Typical UAE timeline for ${d.plural.toLowerCase()}: 1–2 weeks for screening rounds, 4–6 weeks for Dataflow + licence eligibility, then 1–2 weeks for visa processing and onboarding. Total offer-to-start: 6–10 weeks for most international candidates.`,
    },
  ];

  const otherCities = UAE_CITIES.filter((c) => c.slug !== city.slug);

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "UAE", url: base },
          { name: "Healthcare Careers", url: `${base}/jobs` },
          { name: `${d.name} jobs`, url: `${base}/jobs/discipline/${d.slug}` },
          { name: city.name },
        ])}
      />
      <JsonLd data={faqPageSchema(faqs)} />

      <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumb
          items={[
            { label: "UAE", href: "/" },
            { label: "Careers", href: "/jobs" },
            { label: `${d.name} jobs`, href: `/jobs/discipline/${d.slug}` },
            { label: city.name },
          ]}
        />

        <section className="mt-6 max-w-3xl">
          <p className="font-['Geist_Mono',monospace] text-[11px] font-medium uppercase tracking-[0.18em] text-[#006828]">
            {city.name} · {city.emirate} emirate
          </p>
          <h1 className="mt-3 font-['Bricolage_Grotesque',sans-serif] text-[34px] font-medium leading-[1.05] tracking-tight text-[#1c1c1c] sm:text-[44px]">
            {d.name} Jobs in {city.name}
          </h1>
          <p className="mt-4 font-['Geist',sans-serif] text-base leading-relaxed text-black/55">
            {d.blurb} Build your Zavis profile and let hiring clinics in {city.name} find you when they&apos;re looking for {d.plural.toLowerCase()}.
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
              href={`/jobs/signup?discipline=${d.slug}&city=${city.slug}`}
              className="group inline-flex items-center gap-2 rounded-full bg-[#006828] px-5 py-2.5 font-['Geist',sans-serif] text-[14px] font-semibold text-white shadow-[0_8px_24px_-8px_rgba(0,104,40,0.45)] hover:bg-[#005220]"
            >
              Build your {d.name} profile for {city.name}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" strokeWidth={2.25} />
            </Link>
          </div>
        </section>

        <section className="mt-12">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] text-[20px] font-medium tracking-tight text-[#1c1c1c]">
            {d.plural} in other UAE cities
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {otherCities.map((c) => (
              <Link
                key={c.slug}
                href={`/jobs/discipline/${d.slug}/${c.slug}`}
                className="inline-flex items-center gap-2 rounded-full border border-black/[0.08] bg-white px-3.5 py-1.5 font-['Geist',sans-serif] text-[13px] text-[#1c1c1c] transition-colors hover:border-[#006828]/40 hover:text-[#006828]"
              >
                {d.name} in {c.name}
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-12 max-w-3xl">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] text-[18px] font-medium tracking-tight text-[#1c1c1c]">
            Frequently asked
          </h2>
          <div className="mt-3 space-y-3">
            {faqs.map((f) => (
              <details
                key={f.question}
                className="rounded-2xl border border-black/[0.06] bg-white px-5 py-4 open:bg-[#006828]/[0.02]"
              >
                <summary className="cursor-pointer font-['Bricolage_Grotesque',sans-serif] text-[15px] font-medium tracking-tight text-[#1c1c1c]">
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
