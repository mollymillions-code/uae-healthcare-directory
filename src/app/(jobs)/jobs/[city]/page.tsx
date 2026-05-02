import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema, faqPageSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import {
  ROLE_LABELS,
  ROLE_ORDER,
  disciplinesByRole,
} from "@/lib/jobs/disciplines";
import { UAE_CITIES } from "@/lib/jobs/format";

export const revalidate = 3600;

export async function generateStaticParams() {
  return UAE_CITIES.map((c) => ({ city: c.slug }));
}

interface Props {
  params: { city: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const city = UAE_CITIES.find((c) => c.slug === params.city);
  if (!city) return {};
  const title = `Healthcare Careers in ${city.name} | Zavis`;
  const description = `Healthcare workers in ${city.name}, UAE — register your profile and let hiring clinics find you. Free, PDPL-compliant.`.slice(0, 155);
  return {
    title,
    description,
    alternates: { canonical: `${getBaseUrl()}/jobs/${city.slug}` },
    openGraph: { title, description, type: "website" },
  };
}

export default function CityHubPage({ params }: Props) {
  const city = UAE_CITIES.find((c) => c.slug === params.city);
  if (!city) notFound();
  const base = getBaseUrl();

  const faqs = [
    {
      question: `Do I need a UAE healthcare licence to work in ${city.name}?`,
      answer: `Yes for clinical and allied-health roles — the licence required depends on the emirate where the clinic operates. ${city.name} is in the ${city.emirate} emirate, so the regulator licence specific to that emirate applies. Non-clinical roles (billing, coding, reception, management) generally do not require a clinical licence.`,
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
      answer: `${city.name} hosts a mix of public-sector hospital systems, private hospital groups (Mediclinic, NMC, Aster, Burjeel, VPS, Saudi German, Medcare, Cleveland Clinic), and large multi-clinic groups (Aster Clinics, Mediclinic, Prime Medical, Medeor). Single-clinic and specialty practices also actively hire — the Zavis directory lists 12,500+ licensed UAE healthcare facilities, most of which periodically need new staff.`,
    },
    {
      question: "How does Zavis match me to a clinic?",
      answer: `Once you register, your profile sits in our verified-candidate pool. Clinics looking for staff in ${city.name} ask Zavis what's available — we filter by discipline, licence status, salary band and visa requirement, then surface matching profiles. Clinic outreach happens through Zavis; interview, offer and negotiation happen directly with the clinic, off-platform.`,
    },
  ];

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "UAE", url: base },
          { name: "Healthcare Careers", url: `${base}/jobs` },
          { name: city.name },
        ])}
      />
      <JsonLd data={faqPageSchema(faqs)} />

      <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumb
          items={[
            { label: "UAE", href: "/" },
            { label: "Careers", href: "/jobs" },
            { label: city.name },
          ]}
        />

        <section className="mt-6 max-w-3xl">
          <p className="font-['Geist_Mono',monospace] text-[11px] font-medium uppercase tracking-[0.18em] text-[#006828]">
            {city.emirate} emirate · UAE
          </p>
          <h1 className="mt-3 font-['Bricolage_Grotesque',sans-serif] text-[34px] font-medium leading-[1.05] tracking-tight text-[#1c1c1c] sm:text-[44px]">
            Healthcare Careers in {city.name}
          </h1>
          <p className="mt-4 font-['Geist',sans-serif] text-base leading-relaxed text-black/55">
            {city.description} If you&apos;re looking for healthcare work in {city.name} — physician, nurse, allied-health, dental, pharmacy, imaging or operations — register your profile and Zavis will share it with hiring clinics.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={`/jobs/signup?city=${city.slug}`}
              className="group inline-flex items-center gap-2 rounded-full bg-[#006828] px-5 py-2.5 font-['Geist',sans-serif] text-[14px] font-semibold text-white shadow-[0_8px_24px_-8px_rgba(0,104,40,0.45)] hover:bg-[#005220]"
            >
              Register interest in {city.name}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" strokeWidth={2.25} />
            </Link>
          </div>
        </section>

        <section className="mt-16">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] text-[22px] font-medium tracking-tight text-[#1c1c1c]">
            All UAE healthcare roles
          </h2>
          <p className="mt-2 font-['Geist',sans-serif] text-[14px] text-black/55">
            Each discipline links to a {city.name}-specific page covering the licensing route, typical salary band and which clinic groups hire most actively.
          </p>
          <div className="mt-4 space-y-6">
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
                        {d.name} in {city.name}
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
