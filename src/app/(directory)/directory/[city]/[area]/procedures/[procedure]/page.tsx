import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { FaqSection } from "@/components/seo/FaqSection";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  getCities,
  getAreasByCity,
  getAreaBySlug,
  getCityBySlug,
  getCategoryBySlug,
  getProviders,
} from "@/lib/data";
import { PROCEDURES, MedicalProcedure } from "@/lib/constants/procedures";
import { faqPageSchema, breadcrumbSchema, speakableSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { safe } from "@/lib/safeData";

export const revalidate = 43200;

interface Props {
  params: { city: string; area: string; procedure: string };
}

function getProcedureBySlug(slug: string): MedicalProcedure | undefined {
  return PROCEDURES.find((p) => p.slug === slug);
}

function getRegulatorName(citySlug: string): string {
  if (citySlug === "dubai") return "the Dubai Health Authority (DHA)";
  if (citySlug === "abu-dhabi" || citySlug === "al-ain") return "the Department of Health (DOH)";
  return "the Ministry of Health and Prevention (MOHAP)";
}

/**
 * generateStaticParams: area x procedure combos where
 * the procedure's related category has providers in that area.
 */
export async function generateStaticParams() {
  if (process.env.PREBUILD_STATIC_ROUTES !== "1") return [];
  const cities = getCities();
  const params: { city: string; area: string; procedure: string }[] = [];

  for (const city of cities) {
    const areas = getAreasByCity(city.slug);
    for (const area of areas) {
      for (const proc of PROCEDURES) {
        const { total } = await getProviders({
          citySlug: city.slug,
          areaSlug: area.slug,
          categorySlug: proc.categorySlug,
          limit: 1,
        });
        if (total > 0) {
          params.push({
            city: city.slug,
            area: area.slug,
            procedure: proc.slug,
          });
        }
      }
    }
  }

  return params;
}

export function generateMetadata({ params }: Props): Metadata {
  const city = getCityBySlug(params.city);
  const area = getAreaBySlug(params.city, params.area);
  const proc = getProcedureBySlug(params.procedure);
  if (!city || !area || !proc) return {};

  const base = getBaseUrl();
  const cityPrice = proc.cityPricing[city.slug];
  const priceStr = cityPrice
    ? `AED ${cityPrice.min.toLocaleString()} - ${cityPrice.max.toLocaleString()}`
    : `AED ${proc.priceRange.min.toLocaleString()} - ${proc.priceRange.max.toLocaleString()}`;

  const title = `${proc.name} in ${area.name}, ${city.name} | Cost: ${priceStr} | Providers & Insurance`;
  const description = `${proc.name} cost in ${area.name}, ${city.name}: ${priceStr}. Compare providers, check insurance coverage, and learn about recovery time. Updated March 2026.`;
  const url = `${base}/directory/${city.slug}/${area.slug}/procedures/${proc.slug}`;

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

export default async function AreaProcedurePage({ params }: Props) {
  const city = getCityBySlug(params.city);
  const area = getAreaBySlug(params.city, params.area);
  const proc = getProcedureBySlug(params.procedure);
  if (!city || !area || !proc) notFound();

  const base = getBaseUrl();
  const regulator = getRegulatorName(city.slug);
  const category = getCategoryBySlug(proc.categorySlug);
  const categoryName = category?.name || proc.categorySlug;

  // Get providers from this area in the procedure's category
  const { providers: areaProviders } = await safe(
    getProviders({
      citySlug: city.slug,
      areaSlug: area.slug,
      categorySlug: proc.categorySlug,
      sort: "rating",
      limit: 12,
    }),
    { providers: [], total: 0, page: 1, totalPages: 1 } as Awaited<ReturnType<typeof getProviders>>,
    "areaProcProviders",
  );

  if (areaProviders.length === 0) notFound();

  // Get city-level pricing
  const cityPrice = proc.cityPricing[city.slug];
  const priceMin = cityPrice?.min ?? proc.priceRange.min;
  const priceMax = cityPrice?.max ?? proc.priceRange.max;
  const priceTypical = cityPrice?.typical ?? Math.round((priceMin + priceMax) / 2);

  // Related procedures that also have providers in this area
  const relatedProcedureResults = await Promise.all(
    proc.relatedProcedures
      .map((slug) => PROCEDURES.find((p) => p.slug === slug))
      .filter((rp): rp is MedicalProcedure => Boolean(rp))
      .map(async (rp) => {
        const { total } = await safe(
          getProviders({
            citySlug: city.slug,
            areaSlug: area.slug,
            categorySlug: rp.categorySlug,
            limit: 1,
          }),
          { providers: [], total: 0, page: 1, totalPages: 1 } as Awaited<ReturnType<typeof getProviders>>,
          `relatedProc:${rp.slug}`,
        );
        return total > 0 ? rp : null;
      })
  );
  const relatedProcedures = relatedProcedureResults.filter((rp): rp is MedicalProcedure => rp !== null);

  const insuranceLabel =
    proc.insuranceCoverage === "typically-covered"
      ? "Typically covered by insurance"
      : proc.insuranceCoverage === "partially-covered"
        ? "Partially covered by insurance"
        : proc.insuranceCoverage === "rarely-covered"
          ? "Rarely covered by insurance"
          : "Not typically covered by insurance";

  const insuranceBadgeClass =
    proc.insuranceCoverage === "typically-covered"
      ? "bg-green-100 text-green-800"
      : proc.insuranceCoverage === "partially-covered"
        ? "bg-yellow-100 text-yellow-800"
        : proc.insuranceCoverage === "rarely-covered"
          ? "bg-orange-100 text-orange-800"
          : "bg-red-100 text-red-800";

  const cityNames: Record<string, string> = {
    dubai: "Dubai",
    "abu-dhabi": "Abu Dhabi",
    sharjah: "Sharjah",
    ajman: "Ajman",
    "ras-al-khaimah": "Ras Al Khaimah",
    fujairah: "Fujairah",
    "umm-al-quwain": "Umm Al Quwain",
    "al-ain": "Al Ain",
  };

  const faqs = [
    {
      question: `How much does ${proc.name.toLowerCase()} cost in ${area.name}, ${city.name}?`,
      answer: `${proc.name} in ${area.name}, ${city.name} typically costs between AED ${priceMin.toLocaleString()} and AED ${priceMax.toLocaleString()}, with a typical price of AED ${priceTypical.toLocaleString()}. Prices vary based on the facility (government vs. premium private), the doctor's experience, and whether additional tests or follow-ups are included. These prices are based on market-observed data as of March 2026.`,
    },
    {
      question: `Does insurance cover ${proc.name.toLowerCase()} in ${area.name}, ${city.name}?`,
      answer: `${insuranceLabel}. ${proc.insuranceNotes} If you are in ${city.name}, check with your specific plan provider — major insurers in ${city.name} include Daman, AXA, Cigna, and MetLife. Your co-pay and pre-authorisation requirements will depend on your plan tier.`,
    },
    {
      question: `How long does recovery take after ${proc.name.toLowerCase()}?`,
      answer: `Recovery time for ${proc.name.toLowerCase()} is typically ${proc.recoveryTime.toLowerCase()}. The procedure itself takes ${proc.duration.toLowerCase()} and is usually performed as ${proc.setting === "outpatient" ? "an outpatient procedure" : proc.setting === "inpatient" ? "an inpatient procedure" : proc.setting === "day-case" ? "a day-case procedure" : "either inpatient or outpatient"}.${proc.anaesthesia !== "none" ? ` ${proc.anaesthesia.charAt(0).toUpperCase() + proc.anaesthesia.slice(1)} anaesthesia is typically used.` : " No anaesthesia is required."}`,
    },
    {
      question: `What should I expect during ${proc.name.toLowerCase()} in ${area.name}?`,
      answer: proc.whatToExpect,
    },
    {
      question: `Where can I get ${proc.name.toLowerCase()} in ${area.name}, ${city.name}?`,
      answer: `The UAE Open Healthcare Directory lists ${areaProviders.length} ${categoryName.toLowerCase()} in ${area.name}, ${city.name} that offer ${proc.name.toLowerCase()} or related services. Providers are sourced from official ${regulator} licensed facility registers and ranked by Google patient reviews.`,
    },
  ];

  const breadcrumbItems = [
    { name: "UAE", url: base },
    { name: city.name, url: `${base}/directory/${city.slug}` },
    { name: area.name, url: `${base}/directory/${city.slug}/${area.slug}` },
    { name: "Procedures", url: `${base}/directory/${city.slug}/${area.slug}/procedures` },
    {
      name: proc.name,
      url: `${base}/directory/${city.slug}/${area.slug}/procedures/${proc.slug}`,
    },
  ];

  const pageUrl = `${base}/directory/${city.slug}/${area.slug}/procedures/${proc.slug}`;

  const breadcrumbs = [
    { label: "UAE", href: "/" },
    { label: city.name, href: `/directory/${city.slug}` },
    { label: area.name, href: `/directory/${city.slug}/${area.slug}` },
    { label: "Procedures", href: `/directory/${city.slug}/${area.slug}/procedures` },
    { label: proc.name },
  ];

  return (
    <>
      <JsonLd data={breadcrumbSchema(breadcrumbItems)} />
      <JsonLd data={speakableSchema([".answer-block"])} />
      <JsonLd data={faqPageSchema(faqs)} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "MedicalWebPage",
          name: `${proc.name} in ${area.name}, ${city.name}`,
          url: pageUrl,
          about: {
            "@type": "MedicalProcedure",
            name: proc.name,
            procedureType: proc.setting === "outpatient" ? "NoninvasiveProcedure" : "SurgicalProcedure",
            description: proc.description,
            howPerformed: proc.whatToExpect,
            preparation: proc.anaesthesia !== "none" ? `${proc.anaesthesia} anaesthesia` : "No anaesthesia required",
            status: "EventScheduled",
          },
          mainContentOfPage: {
            "@type": "WebPageElement",
            cssSelector: ".answer-block",
          },
          lastReviewed: "2026-03-25",
        }}
      />

      {/* Hero */}
      <section className="relative overflow-hidden bg-surface-cream">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 -right-24 h-[380px] w-[380px] rounded-full bg-[radial-gradient(closest-side,rgba(0,200,83,0.16),transparent_70%)]" />
        </div>
        <div className="relative max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-10">
          <nav className="font-sans text-z-body-sm text-ink-muted flex items-center gap-1.5 mb-5 flex-wrap" aria-label="Breadcrumb">
            {breadcrumbs.map((b, i) => {
              const isLast = i === breadcrumbs.length - 1;
              return (
                <span key={i} className="inline-flex items-center gap-1.5">
                  {b.href && !isLast ? (
                    <Link href={b.href} className="hover:text-ink transition-colors">{b.label}</Link>
                  ) : (
                    <span className={isLast ? "text-ink font-medium" : undefined}>{b.label}</span>
                  )}
                  {!isLast && <ChevronRight className="h-3.5 w-3.5" />}
                </span>
              );
            })}
          </nav>

          <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-3">
            Procedure · {area.name}, {city.name}
          </p>
          <h1 className="font-display font-semibold text-ink text-display-lg lg:text-[52px] leading-[1.04] tracking-[-0.025em]">
            {proc.name} in {area.name}, {city.name}.
          </h1>
          <p className="font-sans text-z-body sm:text-[17px] text-ink-soft mt-4 max-w-2xl leading-relaxed">
            {proc.nameAr} · CPT {proc.cptCode} · {proc.duration} · {proc.recoveryTime} recovery
          </p>

          <div className="mt-8 answer-block rounded-z-md bg-white border border-ink-line p-5 sm:p-6 max-w-4xl" data-answer-block="true">
            <p className="font-sans text-z-body-sm text-ink-soft leading-[1.75]">
              According to the UAE Open Healthcare Directory, {proc.name.toLowerCase()} in {area.name}, {city.name} costs between AED {priceMin.toLocaleString()} and AED {priceMax.toLocaleString()}, with a typical price of AED {priceTypical.toLocaleString()}. There {areaProviders.length === 1 ? "is 1 provider" : `are ${areaProviders.length} providers`} offering related {categoryName.toLowerCase()} services in {area.name}. {insuranceLabel}. The procedure takes {proc.duration.toLowerCase()} with {proc.recoveryTime.toLowerCase()} recovery. Pricing based on market-observed data. Last updated March 2026.
            </p>
          </div>
        </div>
      </section>

      {/* Prose body */}
      <section className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        <div className="max-w-[720px]">
          <h2 className="font-display font-semibold text-ink text-z-h2 tracking-[-0.018em] mb-4">
            {proc.name} cost in {area.name}, {city.name}
          </h2>
          <div className="grid grid-cols-3 gap-0 bg-white rounded-z-md border border-ink-line overflow-hidden mb-4">
            <div className="p-4 text-center border-r border-ink-line">
              <p className="font-sans text-z-caption text-ink-muted mb-1">Minimum</p>
              <p className="font-display font-semibold text-ink text-z-h3">AED {priceMin.toLocaleString()}</p>
            </div>
            <div className="p-4 text-center border-r border-ink-line bg-surface-cream">
              <p className="font-sans text-z-caption text-ink-muted mb-1">Typical</p>
              <p className="font-display font-semibold text-accent-dark text-z-h3">AED {priceTypical.toLocaleString()}</p>
            </div>
            <div className="p-4 text-center">
              <p className="font-sans text-z-caption text-ink-muted mb-1">Maximum</p>
              <p className="font-display font-semibold text-ink text-z-h3">AED {priceMax.toLocaleString()}</p>
            </div>
          </div>
          <p className="font-sans text-z-caption text-ink-muted mb-10">
            Prices reflect observed ranges across government, private, and premium facilities in {city.name}. Individual provider quotes may differ. Prices in AED, excluding VAT where applicable.
          </p>

          <h2 className="font-display font-semibold text-ink text-z-h2 tracking-[-0.018em] mb-4">
            About {proc.name}
          </h2>
          <p className="font-sans text-z-body text-ink-soft leading-relaxed mb-4">
            {proc.description}
          </p>
          <h3 className="font-display font-semibold text-ink text-z-h3 mb-2">What to expect</h3>
          <p className="font-sans text-z-body text-ink-soft leading-relaxed mb-6">
            {proc.whatToExpect}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
            <div className="bg-white border border-ink-line rounded-z-sm p-3">
              <p className="font-sans text-z-caption text-ink-muted mb-1">Duration</p>
              <p className="font-sans text-z-body-sm font-semibold text-ink">{proc.duration}</p>
            </div>
            <div className="bg-white border border-ink-line rounded-z-sm p-3">
              <p className="font-sans text-z-caption text-ink-muted mb-1">Recovery</p>
              <p className="font-sans text-z-body-sm font-semibold text-ink">{proc.recoveryTime}</p>
            </div>
            <div className="bg-white border border-ink-line rounded-z-sm p-3">
              <p className="font-sans text-z-caption text-ink-muted mb-1">Setting</p>
              <p className="font-sans text-z-body-sm font-semibold text-ink capitalize">{proc.setting}</p>
            </div>
            <div className="bg-white border border-ink-line rounded-z-sm p-3">
              <p className="font-sans text-z-caption text-ink-muted mb-1">Anaesthesia</p>
              <p className="font-sans text-z-body-sm font-semibold text-ink capitalize">{proc.anaesthesia}</p>
            </div>
          </div>

          <h2 className="font-display font-semibold text-ink text-z-h2 tracking-[-0.018em] mb-4">
            Insurance coverage
          </h2>
          <div className="bg-surface-cream border border-ink-line rounded-z-md p-5 mb-10">
            <div className="flex items-center gap-3 mb-3">
              <span className={`inline-block text-xs font-bold px-3 py-1 ${insuranceBadgeClass}`}>
                {insuranceLabel}
              </span>
            </div>
            <p className="font-sans text-z-body-sm text-ink-soft leading-relaxed">
              {proc.insuranceNotes}
            </p>
          </div>
        </div>
      </section>

      {/* UAE city comparison table */}
      <section className="bg-surface-cream py-12">
        <div className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-display font-semibold text-ink text-display-md tracking-[-0.018em] mb-6">
            {proc.name} cost across UAE cities
          </h2>
          <div className="overflow-x-auto bg-white rounded-z-md border border-ink-line">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-ink-line">
                  <th className="text-left py-3 px-4 font-sans font-semibold text-ink">City</th>
                  <th className="text-right py-3 px-4 font-sans font-semibold text-ink">Min</th>
                  <th className="text-right py-3 px-4 font-sans font-semibold text-ink">Typical</th>
                  <th className="text-right py-3 px-4 font-sans font-semibold text-ink">Max</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(proc.cityPricing).map(([slug, pricing]) => {
                  const isCurrentCity = slug === city.slug;
                  return (
                    <tr
                      key={slug}
                      className={`border-b border-ink-line last:border-b-0 ${isCurrentCity ? "bg-surface-cream font-semibold" : ""}`}
                    >
                      <td className="py-2.5 px-4 text-ink">
                        {cityNames[slug] || slug}
                        {isCurrentCity && (
                          <span className="ml-2 text-z-micro font-semibold text-accent-dark">(current)</span>
                        )}
                      </td>
                      <td className="text-right py-2.5 px-4 text-ink-soft">AED {pricing.min.toLocaleString()}</td>
                      <td className="text-right py-2.5 px-4 font-semibold text-ink">AED {pricing.typical.toLocaleString()}</td>
                      <td className="text-right py-2.5 px-4 text-ink-soft">AED {pricing.max.toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="font-sans text-z-caption text-ink-muted mt-3">
            Source: DOH Mandatory Tariff (Shafafiya), DHA DRG parameters, and market-observed data 2024-2026. Base tariff: AED {proc.baseTariffAed.toLocaleString()}.
          </p>
        </div>
      </section>

      {/* Providers in this area */}
      <section className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="font-display font-semibold text-ink text-z-h1 mb-3">
          {categoryName} in {area.name}, {city.name}
        </h2>
        <p className="font-sans text-z-body-sm text-ink-muted mb-6">
          These {categoryName.toLowerCase()} in {area.name} offer {proc.name.toLowerCase()} or related services. Ranked by patient reviews.
        </p>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {areaProviders.map((p) => (
            <li key={p.id}>
              <Link
                href={`/directory/${p.citySlug}/${p.categorySlug}/${p.slug}`}
                className="block bg-white border border-ink-line rounded-z-md p-4 hover:border-ink transition-colors"
              >
                <p className="font-sans font-semibold text-ink text-z-body-sm line-clamp-2">{p.name}</p>
                {p.address && (
                  <p className="font-sans text-z-caption text-ink-muted mt-1 line-clamp-1">{p.address}</p>
                )}
                {p.googleRating && (
                  <p className="font-sans text-z-caption text-ink-muted mt-1">
                    {p.googleRating} ★ {p.googleReviewCount ? `(${p.googleReviewCount.toLocaleString()})` : ""}
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>
        <Link
          href={`/directory/${city.slug}/${area.slug}/${proc.categorySlug}`}
          className="inline-flex items-center mt-6 font-sans text-z-body-sm font-semibold text-accent-dark hover:underline"
        >
          View all {categoryName.toLowerCase()} in {area.name} &rarr;
        </Link>
      </section>

      {/* Related procedures */}
      {relatedProcedures.length > 0 && (
        <section className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <h2 className="font-display font-semibold text-ink text-z-h1 mb-4">
            Related procedures
          </h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {relatedProcedures.map((rp) => {
              const rpCityPrice = rp.cityPricing[city.slug];
              const rpPrice = rpCityPrice
                ? `AED ${rpCityPrice.min.toLocaleString()}–${rpCityPrice.max.toLocaleString()}`
                : `AED ${rp.priceRange.min.toLocaleString()}–${rp.priceRange.max.toLocaleString()}`;
              return (
                <li key={rp.slug}>
                  <Link
                    href={`/directory/${city.slug}/${area.slug}/procedures/${rp.slug}`}
                    className="block bg-white border border-ink-line rounded-z-md p-4 hover:border-ink transition-colors"
                  >
                    <p className="font-sans font-semibold text-ink text-z-body-sm">{rp.name}</p>
                    <p className="font-sans text-z-caption text-ink-muted mt-0.5">{rpPrice}</p>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* FAQ */}
      <section className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pb-16 sm:pb-20">
        <div className="max-w-3xl">
          <FaqSection faqs={faqs} title={`${proc.name} in ${area.name}, ${city.name} — FAQ`} />
        </div>
      </section>
    </>
  );
}
