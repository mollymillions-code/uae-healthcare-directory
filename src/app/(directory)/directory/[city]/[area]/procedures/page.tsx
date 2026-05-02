import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { FaqSection } from "@/components/seo/FaqSection";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  getCities,
  getAreasByCity,
  getAreaBySlug,
  getCityBySlug,
  getProviders,
} from "@/lib/data";
import { PROCEDURES, MedicalProcedure } from "@/lib/constants/procedures";
import { faqPageSchema, breadcrumbSchema, speakableSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { safe } from "@/lib/safeData";
import { HubPageTemplate } from "@/components/directory-v2/templates/HubPageTemplate";

export const revalidate = 43200;

interface Props {
  params: { city: string; area: string };
}

/** Return procedures whose related category has at least 1 provider in this area */
async function getProceduresWithProviders(citySlug: string, areaSlug: string): Promise<MedicalProcedure[]> {
  const results = await Promise.all(
    PROCEDURES.map(async (proc) => {
      const { total } = await safe(
        getProviders({
          citySlug,
          areaSlug,
          categorySlug: proc.categorySlug,
          limit: 1,
        }),
        { providers: [], total: 0, page: 1, totalPages: 1 } as Awaited<ReturnType<typeof getProviders>>,
        `proc-area-count:${proc.slug}`,
      );
      return total > 0 ? proc : null;
    })
  );
  return results.filter((proc): proc is MedicalProcedure => proc !== null);
}

export async function generateStaticParams() {
  if (process.env.PREBUILD_STATIC_ROUTES !== "1") return [];
  const cities = getCities();
  const params: { city: string; area: string }[] = [];

  for (const city of cities) {
    const areas = getAreasByCity(city.slug);
    for (const area of areas) {
      const available = await getProceduresWithProviders(city.slug, area.slug);
      if (available.length > 0) {
        params.push({ city: city.slug, area: area.slug });
      }
    }
  }

  return params;
}

function getRegulatorName(citySlug: string): string {
  if (citySlug === "dubai") return "the Dubai Health Authority (DHA)";
  if (citySlug === "abu-dhabi" || citySlug === "al-ain") return "the Department of Health (DOH)";
  return "the Ministry of Health and Prevention (MOHAP)";
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const city = getCityBySlug(params.city);
  const area = getAreaBySlug(params.city, params.area);
  if (!city || !area) return {};

  const base = getBaseUrl();
  const available = await getProceduresWithProviders(city.slug, area.slug);
  const title = `Medical Procedures in ${area.name}, ${city.name} | Costs & Providers (${available.length} Procedures)`;
  const description = `Compare costs for ${available.length} medical procedures in ${area.name}, ${city.name}, UAE. Real AED pricing for dental, LASIK, IVF, diagnostics, cosmetic surgery, and more. Find providers near you.`;
  const url = `${base}/directory/${city.slug}/${area.slug}/procedures`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      type: "website",
      locale: "en_AE",
      siteName: "UAE Open Healthcare Directory",
      url,
    },
  };
}

export default async function AreaProceduresPage({ params }: Props) {
  const city = getCityBySlug(params.city);
  const area = getAreaBySlug(params.city, params.area);
  if (!city || !area) notFound();

  const base = getBaseUrl();
  const regulator = getRegulatorName(city.slug);
  const available = await getProceduresWithProviders(city.slug, area.slug);
  const pageUrl = `${base}/directory/${city.slug}/${area.slug}/procedures`;

  if (available.length === 0) notFound();

  // Group by procedure category
  const grouped = new Map<string, MedicalProcedure[]>();
  for (const proc of available) {
    const cat = proc.categorySlug;
    if (!grouped.has(cat)) grouped.set(cat, []);
    grouped.get(cat)!.push(proc);
  }

  const faqs = [
    {
      question: `What medical procedures are available in ${area.name}, ${city.name}?`,
      answer: `According to the UAE Open Healthcare Directory, ${area.name} in ${city.name} has providers offering ${available.length} medical procedures across dental, eye care, diagnostics, surgery, and more. All providers are licensed by ${regulator}. Pricing varies by provider and facility tier.`,
    },
    {
      question: `How much do medical procedures cost in ${area.name}, ${city.name}?`,
      answer: `Procedure costs in ${area.name}, ${city.name} range widely depending on the type. For example, a blood test may cost AED 50-500, dental cleaning AED 200-800, LASIK AED 5,000-15,000, and knee replacement AED 40,000-80,000. Prices vary by provider, facility type, and insurance coverage.`,
    },
    {
      question: `Does insurance cover medical procedures in ${area.name}, ${city.name}?`,
      answer: `Most diagnostic and essential medical procedures in ${area.name} are covered by major UAE insurance plans (Daman, Thiqa, AXA, Cigna, MetLife). Cosmetic procedures are typically not covered. Coverage depends on your plan tier and whether the procedure is medically necessary. Always confirm with your insurer before booking.`,
    },
    {
      question: `How do I find the best provider for a procedure in ${area.name}?`,
      answer: `Use the UAE Open Healthcare Directory to compare providers in ${area.name}, ${city.name} by Google patient rating, reviews, insurance acceptance, and services offered. All listed providers are sourced from official ${regulator} licensed facility registers.`,
    },
  ];

  const breadcrumbItems = [
    { name: "UAE", url: base },
    { name: city.name, url: `${base}/directory/${city.slug}` },
    { name: area.name, url: `${base}/directory/${city.slug}/${area.slug}` },
    { name: "Procedures", url: pageUrl },
  ];

  const sections = Array.from(grouped.entries()).map(([catSlug, procs]) => ({
    title: catSlug.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
    items: procs
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((proc) => {
        const cityPrice = proc.cityPricing[city.slug];
        const priceDisplay = cityPrice
          ? `AED ${cityPrice.min.toLocaleString()}–${cityPrice.max.toLocaleString()}`
          : `AED ${proc.priceRange.min.toLocaleString()}–${proc.priceRange.max.toLocaleString()}`;
        return {
          href: `/directory/${city.slug}/${area.slug}/procedures/${proc.slug}`,
          label: proc.name,
          subLabel: `${priceDisplay} · ${proc.duration}`,
        };
      }),
    layout: "grid" as const,
    gridCols: "3" as const,
  }));

  return (
    <>
      <HubPageTemplate
        breadcrumbs={[
          { label: "UAE", href: "/" },
          { label: city.name, href: `/directory/${city.slug}` },
          { label: area.name, href: `/directory/${city.slug}/${area.slug}` },
          { label: "Procedures" },
        ]}
        eyebrow={`${area.name} · ${city.name}`}
        title={`Medical Procedures in ${area.name}, ${city.name}.`}
        subtitle={
          <>
            Compare costs and find providers for {available.length} medical procedures available in {area.name}, {city.name}. All pricing in AED, reflecting observed ranges across government, private, and premium facilities. Healthcare in {city.name} is regulated by {regulator}.
          </>
        }
        stats={[
          { n: String(available.length), l: "Procedures" },
          { n: area.name, l: "Neighborhood" },
        ]}
        aeoAnswer={
          <>
            According to the UAE Open Healthcare Directory, {area.name} in {city.name} has providers offering {available.length} medical procedures. Costs vary by facility tier, insurance coverage, and procedure complexity. Data sourced from official government registers and market-observed pricing. Last updated March 2026.
          </>
        }
        schemas={
          <>
            <JsonLd data={breadcrumbSchema(breadcrumbItems)} />
            <JsonLd data={speakableSchema([".answer-block"])} />
            <JsonLd data={faqPageSchema(faqs)} />
          </>
        }
        sections={sections}
        ctaBanner={
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/directory/${city.slug}/${area.slug}`}
              className="inline-flex items-center rounded-z-pill bg-white border border-ink-line px-3.5 py-1.5 font-sans text-z-body-sm text-ink hover:border-ink transition-colors"
            >
              All providers in {area.name}
            </Link>
            <Link
              href={`/directory/${city.slug}`}
              className="inline-flex items-center rounded-z-pill bg-white border border-ink-line px-3.5 py-1.5 font-sans text-z-body-sm text-ink hover:border-ink transition-colors"
            >
              Healthcare in {city.name}
            </Link>
          </div>
        }
      />

      {/* FAQ */}
      <section className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-16 sm:pb-24">
        <div className="max-w-3xl">
          <FaqSection faqs={faqs} title={`Medical Procedures in ${area.name}, ${city.name} — FAQ`} />
        </div>
      </section>
    </>
  );
}
