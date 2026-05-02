import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema, faqPageSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { CITIES } from "@/lib/constants/cities";
import { DISCIPLINES, getDiscipline } from "@/lib/jobs/disciplines";
import { listJobs } from "@/lib/jobs/queries";
import { jobsListSchema } from "@/lib/jobs/jobposting-schema";
import { JobCard } from "@/components/jobs/JobCard";

export const revalidate = 3600;

export async function generateStaticParams() {
  return DISCIPLINES.flatMap((d) =>
    CITIES.map((c) => ({ slug: d.slug, city: c.slug }))
  );
}

interface Props {
  params: { slug: string; city: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const d = getDiscipline(params.slug);
  const city = CITIES.find((c) => c.slug === params.city);
  if (!d || !city) return {};
  const title = `${d.name} Jobs in ${city.name} — Free Healthcare Job Board | Zavis`;
  const description = `${d.plural} jobs in ${city.name}, UAE. ${d.blurb} Free for candidates, free for clinics. ${d.licenseAuthority ? "DHA, DOH and MOHAP licence-aware listings." : ""}`;
  return {
    title,
    description,
    alternates: { canonical: `${getBaseUrl()}/jobs/discipline/${d.slug}/${city.slug}` },
    openGraph: { title, description, type: "website" },
  };
}

export default async function DisciplineCityPage({ params }: Props) {
  const d = getDiscipline(params.slug);
  const city = CITIES.find((c) => c.slug === params.city);
  if (!d || !city) notFound();
  const base = getBaseUrl();

  const openJobs = await listJobs({
    disciplineSlug: d.slug,
    citySlug: city.slug,
    limit: 50,
  });

  const otherCities = await Promise.all(
    CITIES.filter((c) => c.slug !== city.slug).map(async (c) => {
      const list = await listJobs({ disciplineSlug: d.slug, citySlug: c.slug, limit: 1 });
      return { city: c, hasJobs: list.length > 0 };
    })
  );

  const faqs = [
    {
      question: `What does a ${d.name.toLowerCase()} earn in ${city.name}?`,
      answer: d.salaryRefAed
        ? `Mid-experience ${d.plural.toLowerCase()} in ${city.name} typically earn AED ${d.salaryRefAed.min.toLocaleString()}–${d.salaryRefAed.max.toLocaleString()} per month. Premium hospital groups and group-leadership roles push to the higher end. Salaries are usually quoted as monthly gross before housing, schooling and flight allowances.`
        : `${d.plural} salaries in ${city.name} vary widely by employer, seniority and credentials. Each posting on Zavis surfaces the salary band when the employer has chosen to disclose it.`,
    },
    {
      question: `Do I need a ${city.emirate === "Dubai" ? "DHA" : city.emirate === "Abu Dhabi" ? "DOH" : "MOHAP"} licence to work as a ${d.name.toLowerCase()} in ${city.name}?`,
      answer: d.licenseAuthority
        ? `Yes — clinical and allied-health roles in ${city.name} require the regulator licence appropriate to the emirate. ${city.emirate === "Dubai" ? "DHA" : city.emirate === "Abu Dhabi" ? "DOH" : "MOHAP"} is the licensing authority for ${city.name}. International candidates also typically need to clear Dataflow primary-source verification before sitting the licence-eligibility test.`
        : `${d.plural} roles do not always require a clinical licence — specific employer requirements are listed on each job posting.`,
    },
    {
      question: `How long does the hiring process take in ${city.name}?`,
      answer: `Typical UAE timeline for ${d.plural.toLowerCase()}: 1–2 weeks for screening rounds, 4–6 weeks for Dataflow + licence eligibility, then 1–2 weeks for visa processing and onboarding. Total offer-to-start: 6–10 weeks for most international candidates.`,
    },
  ];

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "UAE", url: base },
          { name: "Healthcare Jobs", url: `${base}/jobs` },
          { name: `${d.name} jobs`, url: `${base}/jobs/discipline/${d.slug}` },
          { name: city.name },
        ])}
      />
      <JsonLd data={faqPageSchema(faqs)} />
      {openJobs.length > 0 && (
        <JsonLd
          data={jobsListSchema(openJobs, {
            name: `${d.name} jobs in ${city.name}`,
            url: `${base}/jobs/discipline/${d.slug}/${city.slug}`,
          })}
        />
      )}

      <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumb
          items={[
            { label: "UAE", href: "/" },
            { label: "Jobs", href: "/jobs" },
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
            {d.blurb} {openJobs.length > 0 ? `${openJobs.length} active openings in ${city.name}.` : `New listings appear weekly. Set up an alert to be notified.`}
          </p>
        </section>

        <section className="mt-10">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] text-[20px] font-medium tracking-tight text-[#1c1c1c]">
            {openJobs.length > 0 ? `Open ${d.name.toLowerCase()} roles in ${city.name}` : `No open roles right now`}
          </h2>
          {openJobs.length > 0 ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {openJobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-black/[0.06] bg-white p-6">
              <p className="font-['Geist',sans-serif] text-[14px] text-black/65">
                Set up a free alert and we&apos;ll let you know when new {d.plural.toLowerCase()} roles open in {city.name}.
              </p>
              <Link
                href="/jobs/signup"
                className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#006828] px-4 py-2 font-['Geist',sans-serif] text-[13px] font-semibold text-white"
              >
                Create your candidate profile
              </Link>
            </div>
          )}
        </section>

        <section className="mt-12">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] text-[18px] font-medium tracking-tight text-[#1c1c1c]">
            {d.plural} jobs in other cities
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {otherCities.map(({ city: c, hasJobs }) => (
              <Link
                key={c.slug}
                href={`/jobs/discipline/${d.slug}/${c.slug}`}
                className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 font-['Geist',sans-serif] text-[13px] transition-colors ${
                  hasJobs
                    ? "border-black/[0.08] bg-white text-[#1c1c1c] hover:border-[#006828]/40 hover:text-[#006828]"
                    : "border-black/[0.06] bg-black/[0.02] text-black/45"
                }`}
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
