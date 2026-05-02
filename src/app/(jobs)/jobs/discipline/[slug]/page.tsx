import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema, faqPageSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { CITIES } from "@/lib/constants/cities";
import { DISCIPLINES, getDiscipline } from "@/lib/jobs/disciplines";
import { listJobs, countJobs } from "@/lib/jobs/queries";
import { jobsListSchema } from "@/lib/jobs/jobposting-schema";
import { JobCard } from "@/components/jobs/JobCard";

export const revalidate = 3600;

export async function generateStaticParams() {
  return DISCIPLINES.map((d) => ({ slug: d.slug }));
}

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const d = getDiscipline(params.slug);
  if (!d) return {};
  const title = `${d.name} Jobs in UAE — Free Healthcare Job Board | Zavis`;
  const description = `${d.plural} jobs across UAE. ${d.blurb} ${d.licenseAuthority ? "DHA, DOH and MOHAP licence-aware listings." : ""} Free for candidates, free for clinics.`;
  return {
    title,
    description,
    alternates: { canonical: `${getBaseUrl()}/jobs/discipline/${d.slug}` },
    openGraph: { title, description, type: "website" },
  };
}

export default async function DisciplineHubPage({ params }: Props) {
  const d = getDiscipline(params.slug);
  if (!d) notFound();
  const base = getBaseUrl();

  const [openJobs, total] = await Promise.all([
    listJobs({ disciplineSlug: d.slug, limit: 50 }),
    countJobs({ disciplineSlug: d.slug }),
  ]);

  // City breakdown — only show cities with at least one open role
  const cityCounts = await Promise.all(
    CITIES.map(async (city) => ({
      city,
      count: await countJobs({ disciplineSlug: d.slug, citySlug: city.slug }),
    }))
  );
  const activeCities = cityCounts.filter((c) => c.count > 0);

  const faqs = buildDisciplineFaqs(d);

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "UAE", url: base },
          { name: "Healthcare Jobs", url: `${base}/jobs` },
          { name: `${d.name} jobs` },
        ])}
      />
      <JsonLd data={faqPageSchema(faqs)} />
      {openJobs.length > 0 && (
        <JsonLd
          data={jobsListSchema(openJobs, {
            name: `${d.name} jobs in UAE`,
            url: `${base}/jobs/discipline/${d.slug}`,
          })}
        />
      )}

      <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumb
          items={[
            { label: "UAE", href: "/" },
            { label: "Healthcare Jobs", href: "/jobs" },
            { label: `${d.name} jobs` },
          ]}
        />

        <section className="mt-6 max-w-3xl">
          <p className="font-['Geist_Mono',monospace] text-[11px] font-medium uppercase tracking-[0.18em] text-[#006828]">
            {d.licenseAuthority === "shared" ? "DHA · DOH · MOHAP licensable" : d.licenseAuthority?.toUpperCase() ?? "Open"}
          </p>
          <h1 className="mt-3 font-['Bricolage_Grotesque',sans-serif] text-[34px] font-medium leading-[1.05] tracking-tight text-[#1c1c1c] sm:text-[44px]">
            {d.name} Jobs in UAE
          </h1>
          <p className="mt-4 font-['Geist',sans-serif] text-base leading-relaxed text-black/55">
            {d.blurb} {total > 0 ? `${total} active openings on Zavis.` : "New listings are added weekly — set up an alert to be notified."}
          </p>

          {d.salaryRefAed && (
            <div className="mt-5 inline-flex items-center gap-2 rounded-2xl border border-[#006828]/15 bg-[#006828]/[0.04] px-4 py-2 font-['Geist',sans-serif] text-[13px] text-[#1c1c1c]">
              <span className="text-black/55">2026 UAE salary band:</span>
              <span className="font-medium">
                AED {d.salaryRefAed.min.toLocaleString()}–{d.salaryRefAed.max.toLocaleString()} / month
              </span>
            </div>
          )}
        </section>

        {activeCities.length > 0 && (
          <section className="mt-12">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] text-[20px] font-medium tracking-tight text-[#1c1c1c]">
              {d.plural} jobs by city
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {activeCities.map(({ city, count }) => (
                <Link
                  key={city.slug}
                  href={`/jobs/discipline/${d.slug}/${city.slug}`}
                  className="inline-flex items-center gap-2 rounded-full border border-black/[0.08] bg-white px-3.5 py-1.5 font-['Geist',sans-serif] text-[13px] text-[#1c1c1c] transition-colors hover:border-[#006828]/40 hover:text-[#006828]"
                >
                  <span>
                    {d.name} in {city.name}
                  </span>
                  <span className="rounded-full bg-[#006828]/[0.08] px-1.5 py-0.5 text-[11px] font-medium text-[#006828]">
                    {count}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="mt-12">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] text-[20px] font-medium tracking-tight text-[#1c1c1c]">
            {openJobs.length > 0 ? `Open ${d.name.toLowerCase()} roles` : `No open ${d.name.toLowerCase()} roles right now`}
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
                Set up a free email alert and we&apos;ll let you know when new {d.plural.toLowerCase()} roles open in the UAE.
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
        : `${d.plural} salaries in the UAE vary widely by employer, seniority and credentials. Each posting on Zavis surfaces the salary band when the employer has chosen to disclose it.`,
    },
    {
      question: `Do I need a UAE licence to work as a ${d.name.toLowerCase()}?`,
      answer: d.licenseAuthority
        ? `Yes — most ${d.plural.toLowerCase()} roles in the UAE require a clinical licence from DHA (Dubai), DOH (Abu Dhabi) or MOHAP (Sharjah, Ajman, Ras Al Khaimah, Fujairah, Umm Al Quwain). Each posting tells you which regulator the employer is licensed under and which licence you need. International candidates also typically need to clear Dataflow primary-source verification before sitting the licence-eligibility test.`
        : `${d.plural} roles do not always require a clinical licence in the UAE — many are open to candidates with a relevant degree or certification. Specific employer requirements are listed on each job.`,
    },
    {
      question: "Are the jobs on Zavis really free for candidates?",
      answer:
        "Yes. There are no candidate fees, no premium tiers, no paid CV-distribution add-ons. The platform exists as part of Zavis's open-data programme alongside the UAE healthcare directory.",
    },
    {
      question: `What's the typical hiring process for ${d.plural.toLowerCase()} in the UAE?`,
      answer:
        "Most clinic groups run a 2–3 step process — initial screening (phone or 30-min video), a clinical or technical interview, and a final round with the medical director or department head. International candidates also need to complete Dataflow primary-source verification and pass the relevant Prometric / DHA computer-based assessment before they can be issued a licence. The full timeline from offer to UAE start-date is typically 6–10 weeks.",
    },
  ];
  return faqs;
}
