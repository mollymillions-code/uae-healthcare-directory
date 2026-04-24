import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { FaqSection } from "@/components/seo/FaqSection";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema, speakableSchema, faqPageSchema, truncateTitle, truncateDescription } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { getCategories, getCategoryBySlug, getCities, getProviderCountByCategoryAndCity } from "@/lib/data";
import { getMedicationsBySpecialty, getAllSpecialtiesWithMedications } from "@/lib/medications";
import { safe } from "@/lib/safeData";
import { HubPageTemplate } from "@/components/directory-v2/templates/HubPageTemplate";
import type { HubItem } from "@/components/directory-v2/templates/HubPageTemplate";
import { Pill, Stethoscope } from "lucide-react";

export const revalidate = 43200;
export const dynamicParams = true;

interface Props { params: { specialty: string } }

function toTitle(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

export async function generateStaticParams() {
  if (process.env.PREBUILD_STATIC_ROUTES !== "1") return [];
  const cats = getCategories();
  return cats.map((c) => ({ specialty: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const cat = getCategoryBySlug(params.specialty);
  const specName = cat?.name ?? toTitle(params.specialty);
  const base = getBaseUrl();
  const year = new Date().getFullYear();

  return {
    title: truncateTitle(`${specName} in the UAE — Specialists, Clinics & Medications [${year}]`),
    description: truncateDescription(
      `Find licensed ${specName.toLowerCase()} specialists across Dubai, Abu Dhabi, Sharjah, and the Northern Emirates. Compare clinics, typical medications prescribed, and insurance coverage.`,
    ),
    alternates: {
      canonical: `${base}/specialties/${params.specialty}`,
      languages: {
        "en-AE": `${base}/specialties/${params.specialty}`,
        "ar-AE": `${base}/ar/specialties/${params.specialty}`,
      },
    },
    openGraph: {
      title: `${specName} Specialists in the UAE`,
      description: `Licensed ${specName.toLowerCase()} specialists across the UAE. Clinics, medications, and insurance coverage.`,
      type: "website",
      url: `${base}/specialties/${params.specialty}`,
      locale: "en_AE",
      siteName: "UAE Open Healthcare Directory",
    },
  };
}

export default async function SpecialtyDetailPage({ params }: Props) {
  const cat = getCategoryBySlug(params.specialty);
  // Accept either a known category or a specialty slug with medications
  const allSpecs = await safe(
    getAllSpecialtiesWithMedications(),
    [] as Awaited<ReturnType<typeof getAllSpecialtiesWithMedications>>,
    "allSpecsDetail",
  );
  const specEntry = allSpecs.find((s) => s.slug === params.specialty);

  if (!cat && !specEntry) notFound();

  const specName = cat?.name ?? specEntry?.specialty ?? toTitle(params.specialty);
  const base = getBaseUrl();

  const cities = getCities().filter((c) => c.country === "ae");
  const meds = specEntry
    ? specEntry.medications
    : await safe(getMedicationsBySpecialty(params.specialty), [] as Awaited<ReturnType<typeof getMedicationsBySpecialty>>, "specDetailMeds");

  // Per-city provider counts (preserves data fetch pattern from city page)
  const categorySlug = cat ? cat.slug : params.specialty;
  const cityCounts = await safe(
    Promise.all(cities.map((c) => getProviderCountByCategoryAndCity(categorySlug, c.slug))),
    cities.map(() => 0) as number[],
    "cityCounts",
  );

  const totalProviders = cityCounts.reduce((s, n) => s + n, 0);

  const specialtyFaqs = [
    {
      question: `How do I find a ${specName.toLowerCase()} specialist in the UAE?`,
      answer: `Browse licensed ${specName.toLowerCase()} specialists by city — Dubai, Abu Dhabi, Sharjah, Al Ain, Ajman, RAK, Fujairah, or Umm Al Quwain. Each listing shows ratings, accepted insurance, typical consultation fees, and working hours. All providers are verified against DHA, DOH, or MOHAP licensed registers.`,
    },
    {
      question: `What medications do ${specName.toLowerCase()} specialists commonly prescribe?`,
      answer:
        meds.length > 0
          ? `${specName} specialists in the UAE commonly prescribe ${meds.length} medications across several drug classes. See the full list below, or browse each medication's dedicated page for generic-vs-brand guidance and pharmacy access.`
          : `${specName} prescribing varies by sub-condition. See each clinic's profile for typical treatment pathways, or consult a licensed ${specName.toLowerCase()} specialist directly.`,
    },
    {
      question: `Is a referral needed to see a ${specName.toLowerCase()} specialist in the UAE?`,
      answer: `In Dubai and Abu Dhabi, most private insurance plans allow direct self-referral to specialists. Basic mandatory plans and Thiqa may require a GP referral first. Check your policy or contact the clinic before booking.`,
    },
    {
      question: `What does a ${specName.toLowerCase()} consultation typically cost in the UAE?`,
      answer: `Specialist consultation fees in the UAE typically range from AED 300 to AED 800 depending on the clinic, emirate, and seniority of the practitioner. Many private insurance plans cover specialist visits with a copay; basic plans may require GP triage first.`,
    },
  ];

  const cityItems: HubItem[] = cities.map((city, i) => ({
    href: `/directory/${city.slug}/${categorySlug}`,
    label: city.name,
    count: cityCounts[i] ?? 0,
  }));

  const medicationItems: HubItem[] = meds.slice(0, 12).map((m) => ({
    href: `/medications/${m.slug}`,
    label: m.genericName,
    subLabel: m.shortDescription ?? undefined,
    icon: <Pill className="h-4 w-4" />,
  }));

  const sections = [
    {
      title: `${specName} by city`,
      eyebrow: "Browse providers",
      items: cityItems,
      layout: "grid" as const,
      gridCols: "4" as const,
    },
    ...(medicationItems.length > 0
      ? [{
          title: `Medications commonly prescribed in ${specName}`,
          eyebrow: "Typical prescribing",
          items: medicationItems,
          layout: "grid" as const,
          gridCols: "3" as const,
        }]
      : []),
  ];

  return (
    <>
      <HubPageTemplate
        breadcrumbs={[
          { label: "UAE", href: "/" },
          { label: "Specialties", href: "/specialties" },
          { label: specName },
        ]}
        eyebrow="Specialty guide"
        title={`${specName} in the UAE`}
        subtitle={`Licensed ${specName.toLowerCase()} specialists across the UAE. Compare clinics by emirate, see typical medications, and review accepted insurance.`}
        stats={[
          ...(totalProviders > 0 ? [{ n: totalProviders.toLocaleString(), l: "Licensed providers" }] : []),
          ...(meds.length > 0 ? [{ n: String(meds.length), l: "Typical medications" }] : []),
          { n: String(cities.length), l: "Emirates covered" },
        ].slice(0, 4)}
        aeoAnswer={
          <>
            {specName} care in the UAE is delivered by licensed specialists regulated by DHA (Dubai),
            DOH (Abu Dhabi), or MOHAP (other emirates).
            {totalProviders > 0 && ` ${totalProviders.toLocaleString()}+ ${specName.toLowerCase()} providers are listed across the seven emirates.`}
            {meds.length > 0 && ` Specialists in this field commonly prescribe ${meds.length} medications across multiple drug classes.`}
            {" "}Use this page to browse clinics by emirate, compare ratings and accepted insurance, and review typical prescribing.
          </>
        }
        arabicHref={`/ar/specialties/${params.specialty}`}
        schemas={
          <>
            <JsonLd data={breadcrumbSchema([
              { name: "UAE", url: base },
              { name: "Specialties", url: `${base}/specialties` },
              { name: specName },
            ])} />
            <JsonLd data={speakableSchema([".answer-block"])} />
            <JsonLd data={faqPageSchema(specialtyFaqs)} />
          </>
        }
        sections={sections}
        faqs={specialtyFaqs}
      />

      {/* Link to full medications page */}
      {meds.length >= 2 && (
        <section className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
          <div className="rounded-z-md bg-white border border-ink-line p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-1 inline-flex items-center gap-1.5">
                <Stethoscope className="h-3.5 w-3.5" />
                Full prescribing list
              </p>
              <p className="font-display font-semibold text-ink text-z-h3">
                All {meds.length} medications prescribed by {specName} specialists
              </p>
            </div>
            <Link
              href={`/specialties/${params.specialty}/medications`}
              className="inline-flex items-center gap-2 rounded-z-pill bg-ink text-white font-sans font-semibold text-z-body-sm px-5 py-2.5 hover:bg-ink-soft transition-colors self-start sm:self-auto"
            >
              View all medications
            </Link>
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16 sm:pb-24">
        <header className="mb-6">
          <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-2">
            Questions
          </p>
          <h2 className="font-display font-semibold text-ink text-display-md tracking-[-0.018em]">
            About {specName} care.
          </h2>
        </header>
        <div className="max-w-3xl">
          <FaqSection faqs={specialtyFaqs} />
        </div>
      </section>
    </>
  );
}
