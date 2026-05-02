import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema, faqPageSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { CITIES } from "@/lib/constants/cities";
import {
  DISCIPLINES,
  ROLE_LABELS,
  ROLE_ORDER,
  disciplinesByRole,
} from "@/lib/jobs/disciplines";
import { listJobs, countJobs } from "@/lib/jobs/queries";
import { jobsListSchema } from "@/lib/jobs/jobposting-schema";
import { JobCard } from "@/components/jobs/JobCard";

export const revalidate = 3600;

export async function generateStaticParams() {
  return CITIES.map((c) => ({ city: c.slug }));
}

interface Props {
  params: { city: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const city = CITIES.find((c) => c.slug === params.city);
  if (!city) return {};
  const title = `Healthcare Jobs in ${city.name} — Free Job Board for Doctors, Nurses, Lab Techs | Zavis`;
  const description = `Open healthcare jobs in ${city.name}, UAE. Doctors, nurses, allied health, dental, pharmacy, imaging, billing, clinic operations. ${city.emirate === "Dubai" ? "DHA" : city.emirate === "Abu Dhabi" ? "DOH" : "MOHAP"}-licence aware. Free for candidates.`;
  return {
    title,
    description,
    alternates: { canonical: `${getBaseUrl()}/jobs/${city.slug}` },
    openGraph: { title, description, type: "website" },
  };
}

export default async function CityHubPage({ params }: Props) {
  const city = CITIES.find((c) => c.slug === params.city);
  if (!city) notFound();
  const base = getBaseUrl();

  const [openJobs, total] = await Promise.all([
    listJobs({ citySlug: city.slug, limit: 30 }),
    countJobs({ citySlug: city.slug }),
  ]);

  // Per-discipline counts in this city
  const perDisc = await Promise.all(
    DISCIPLINES.map(async (d) => ({
      d,
      count: await countJobs({ citySlug: city.slug, disciplineSlug: d.slug }),
    }))
  );
  const activeDisciplines = perDisc.filter((p) => p.count > 0);

  const regulator =
    city.emirate === "Dubai" ? "DHA" : city.emirate === "Abu Dhabi" ? "DOH" : "MOHAP";

  const faqs = [
    {
      question: `Which licensing authority covers ${city.name}?`,
      answer: `${regulator} is the licensing authority for ${city.name}${
        city.emirate === "Dubai" || city.emirate === "Abu Dhabi" ? ` (${city.emirate} emirate).` : ` and other emirates outside Dubai and Abu Dhabi.`
      } Most clinical and allied-health roles in ${city.name} require a ${regulator} licence; some clinic-operations roles (billing, coding, reception, management) do not require one.`,
    },
    {
      question: `What's the cost of living for healthcare workers in ${city.name}?`,
      answer:
        city.slug === "dubai"
          ? "Dubai is the most expensive emirate. A 1-bed apartment in marina-tier neighbourhoods averages AED 7,000–10,000 per month; further out (Discovery Gardens, JVC, Al Nahda Dubai), AED 4,000–6,000. Most clinic salaries in Dubai factor housing into the all-in package."
          : city.slug === "abu-dhabi"
          ? "Abu Dhabi cost of living sits below Dubai. A 1-bed apartment averages AED 5,000–7,500 per month in central neighbourhoods (Reem Island, Khalidiya, Hamdan); cheaper in Khalifa City, Mussafah and the inland clusters."
          : `Cost of living in ${city.name} sits below the Dubai / Abu Dhabi premium. A 1-bed apartment averages AED 2,500–5,000 per month, depending on neighbourhood. Many candidates commute in from ${city.name} to nearby emirates with a daily car or shared transport.`,
    },
    {
      question: `What healthcare networks hire in ${city.name}?`,
      answer: `${city.name} hosts a mix of public-sector hospital systems (SEHA, DHA-direct, MOHAP-direct), private hospital groups (Mediclinic, NMC, Aster, Burjeel, VPS, Saudi German, Medcare, Cleveland Clinic), and large multi-clinic groups (Aster Clinics, Mediclinic, Prime Medical, Medeor). Single-clinic and specialty practices also actively hire — the Zavis directory lists 12,500+ licensed UAE healthcare facilities, most of which periodically post openings.`,
    },
    {
      question: "Is there a fee to apply or post jobs?",
      answer:
        "No. Open Healthcare Jobs by Zavis is free for candidates and free for clinics. There are no application fees, posting fees or premium-tier upgrades. The platform exists as part of Zavis's open-data programme.",
    },
  ];

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "UAE", url: base },
          { name: "Healthcare Jobs", url: `${base}/jobs` },
          { name: `${city.name} jobs` },
        ])}
      />
      <JsonLd data={faqPageSchema(faqs)} />
      {openJobs.length > 0 && (
        <JsonLd
          data={jobsListSchema(openJobs, {
            name: `Healthcare jobs in ${city.name}`,
            url: `${base}/jobs/${city.slug}`,
          })}
        />
      )}

      <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumb
          items={[
            { label: "UAE", href: "/" },
            { label: "Jobs", href: "/jobs" },
            { label: `${city.name} jobs` },
          ]}
        />

        <section className="mt-6 max-w-3xl">
          <p className="font-['Geist_Mono',monospace] text-[11px] font-medium uppercase tracking-[0.18em] text-[#006828]">
            {regulator} · {city.emirate} emirate
          </p>
          <h1 className="mt-3 font-['Bricolage_Grotesque',sans-serif] text-[34px] font-medium leading-[1.05] tracking-tight text-[#1c1c1c] sm:text-[44px]">
            Healthcare Jobs in {city.name}
          </h1>
          <p className="mt-4 font-['Geist',sans-serif] text-base leading-relaxed text-black/55">
            {city.description} {total > 0 ? `${total} active openings on Zavis.` : ""}
          </p>
        </section>

        {activeDisciplines.length > 0 && (
          <section className="mt-12">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] text-[20px] font-medium tracking-tight text-[#1c1c1c]">
              Roles hiring in {city.name}
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {activeDisciplines.map(({ d, count }) => (
                <Link
                  key={d.slug}
                  href={`/jobs/discipline/${d.slug}/${city.slug}`}
                  className="inline-flex items-center gap-2 rounded-full border border-black/[0.08] bg-white px-3.5 py-1.5 font-['Geist',sans-serif] text-[13px] text-[#1c1c1c] transition-colors hover:border-[#006828]/40 hover:text-[#006828]"
                >
                  <span>{d.name}</span>
                  <span className="rounded-full bg-[#006828]/[0.08] px-1.5 py-0.5 text-[11px] font-medium text-[#006828]">
                    {count}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {openJobs.length > 0 && (
          <section className="mt-12">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] text-[20px] font-medium tracking-tight text-[#1c1c1c]">
              Latest openings in {city.name}
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {openJobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          </section>
        )}

        <section className="mt-12">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] text-[18px] font-medium tracking-tight text-[#1c1c1c]">
            Browse all UAE healthcare roles
          </h2>
          <div className="mt-3 space-y-6">
            {ROLE_ORDER.filter((r) => r !== "other").map((role) => {
              const list = disciplinesByRole(role);
              if (list.length === 0) return null;
              return (
                <div key={role}>
                  <h3 className="font-['Geist_Mono',monospace] text-[10px] font-medium uppercase tracking-[0.18em] text-black/45">
                    {ROLE_LABELS[role]}
                  </h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {list.map((d) => (
                      <Link
                        key={d.slug}
                        href={`/jobs/discipline/${d.slug}/${city.slug}`}
                        className="inline-flex items-center gap-2 rounded-full border border-black/[0.06] bg-white px-3 py-1 font-['Geist',sans-serif] text-[12px] text-black/60 transition-colors hover:border-[#006828]/40 hover:text-[#006828]"
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
