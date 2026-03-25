import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
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

export const revalidate = 43200;

interface Props {
  params: { city: string; area: string };
}

/** Return procedures whose related category has at least 1 provider in this area */
async function getProceduresWithProviders(citySlug: string, areaSlug: string): Promise<MedicalProcedure[]> {
  const results = await Promise.all(
    PROCEDURES.map(async (proc) => {
      const { total } = await getProviders({
        citySlug,
        areaSlug,
        categorySlug: proc.categorySlug,
        limit: 1,
      });
      return total > 0 ? proc : null;
    })
  );
  return results.filter((proc): proc is MedicalProcedure => proc !== null);
}

export async function generateStaticParams() {
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

  return (
    <>
      <div className="container-tc py-8">
        <JsonLd data={breadcrumbSchema(breadcrumbItems)} />
        <JsonLd data={speakableSchema([".answer-block"])} />
        <JsonLd data={faqPageSchema(faqs)} />

        <Breadcrumb
          items={[
            { label: "UAE", href: "/" },
            { label: city.name, href: `/directory/${city.slug}` },
            { label: area.name, href: `/directory/${city.slug}/${area.slug}` },
            { label: "Procedures" },
          ]}
        />

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-dark mb-3">
            Medical Procedures in {area.name}, {city.name}
          </h1>
          <p className="text-muted leading-relaxed mb-4">
            Compare costs and find providers for {available.length} medical procedures available
            in {area.name}, {city.name}, UAE. All pricing is in AED and reflects observed ranges
            across government, private, and premium facilities. Healthcare in {city.name} is
            regulated by {regulator}.
          </p>

          <div className="answer-block mb-6" data-answer-block="true">
            <p className="text-muted leading-relaxed">
              According to the UAE Open Healthcare Directory, {area.name} in {city.name} has
              providers offering {available.length} medical procedures. Costs vary by facility
              tier, insurance coverage, and procedure complexity. Data sourced from official
              government registers and market-observed pricing. Last updated March 2026.
            </p>
          </div>
        </div>

        {/* Procedure categories */}
        {Array.from(grouped.entries()).map(([catSlug, procs]) => (
          <section key={catSlug} className="mb-10">
            <div className="section-header">
              <h2>{catSlug.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}</h2>
              <span className="arrows">&gt;&gt;&gt;</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-light-200">
                    <th className="text-left py-3 pr-4 font-bold text-dark">Procedure</th>
                    <th className="text-right py-3 px-4 font-bold text-dark">
                      Cost in {city.name}
                    </th>
                    <th className="text-center py-3 px-4 font-bold text-dark">Insurance</th>
                    <th className="text-right py-3 pl-4 font-bold text-dark">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {procs
                    .sort((a, b) => a.sortOrder - b.sortOrder)
                    .map((proc) => {
                      const cityPrice = proc.cityPricing[city.slug];
                      const priceDisplay = cityPrice
                        ? `AED ${cityPrice.min.toLocaleString()} - ${cityPrice.max.toLocaleString()}`
                        : `AED ${proc.priceRange.min.toLocaleString()} - ${proc.priceRange.max.toLocaleString()}`;

                      const insuranceBadge =
                        proc.insuranceCoverage === "typically-covered"
                          ? "bg-green-100 text-green-800"
                          : proc.insuranceCoverage === "partially-covered"
                            ? "bg-yellow-100 text-yellow-800"
                            : proc.insuranceCoverage === "rarely-covered"
                              ? "bg-orange-100 text-orange-800"
                              : "bg-red-100 text-red-800";
                      const insuranceLabel =
                        proc.insuranceCoverage === "typically-covered"
                          ? "Covered"
                          : proc.insuranceCoverage === "partially-covered"
                            ? "Partial"
                            : proc.insuranceCoverage === "rarely-covered"
                              ? "Rare"
                              : "Not covered";

                      return (
                        <tr
                          key={proc.slug}
                          className="border-b border-light-200 hover:bg-light-50 transition-colors"
                        >
                          <td className="py-3 pr-4">
                            <Link
                              href={`/directory/${city.slug}/${area.slug}/procedures/${proc.slug}`}
                              className="font-medium text-dark hover:text-accent transition-colors"
                            >
                              {proc.name}
                            </Link>
                            <p className="text-xs text-muted mt-0.5">{proc.nameAr}</p>
                          </td>
                          <td className="text-right py-3 px-4 font-semibold text-dark whitespace-nowrap">
                            {priceDisplay}
                          </td>
                          <td className="text-center py-3 px-4">
                            <span
                              className={`inline-block text-[10px] font-bold px-2 py-0.5 ${insuranceBadge}`}
                            >
                              {insuranceLabel}
                            </span>
                          </td>
                          <td className="text-right py-3 pl-4 text-muted whitespace-nowrap">
                            {proc.duration}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </section>
        ))}

        {/* Cross-links */}
        <section className="mb-10">
          <div className="section-header">
            <h2>Explore {area.name}</h2>
            <span className="arrows">&gt;&gt;&gt;</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Link
              href={`/directory/${city.slug}/${area.slug}`}
              className="inline-block bg-light-100 text-dark text-sm px-4 py-2 border border-light-200 hover:border-accent hover:bg-accent-muted transition-colors"
            >
              All providers in {area.name}
            </Link>
            <Link
              href={`/directory/${city.slug}`}
              className="inline-block bg-light-100 text-dark text-sm px-4 py-2 border border-light-200 hover:border-accent hover:bg-accent-muted transition-colors"
            >
              Healthcare in {city.name}
            </Link>
          </div>
        </section>

        <FaqSection faqs={faqs} title={`Medical Procedures in ${area.name}, ${city.name} — FAQ`} />
      </div>
    </>
  );
}
