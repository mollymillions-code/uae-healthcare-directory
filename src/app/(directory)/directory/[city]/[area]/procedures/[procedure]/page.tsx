import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { ProviderCard } from "@/components/provider/ProviderCard";
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
  const { providers: areaProviders } = await getProviders({
    citySlug: city.slug,
    areaSlug: area.slug,
    categorySlug: proc.categorySlug,
    sort: "rating",
    limit: 12,
  });

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
        const { total } = await getProviders({
          citySlug: city.slug,
          areaSlug: area.slug,
          categorySlug: rp.categorySlug,
          limit: 1,
        });
        return total > 0 ? rp : null;
      })
  );
  const relatedProcedures = relatedProcedureResults.filter((rp): rp is MedicalProcedure => rp !== null);

  // Insurance coverage label
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

  // City names for pricing comparison table
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

  return (
    <>
      <div className="container-tc py-8">
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

        <Breadcrumb
          items={[
            { label: "UAE", href: "/" },
            { label: city.name, href: `/directory/${city.slug}` },
            { label: area.name, href: `/directory/${city.slug}/${area.slug}` },
            { label: "Procedures", href: `/directory/${city.slug}/${area.slug}/procedures` },
            { label: proc.name },
          ]}
        />

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="badge text-[10px]">{categoryName}</span>
            <span className={`inline-block text-[10px] font-bold px-2 py-0.5 ${insuranceBadgeClass}`}>
              {insuranceLabel}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-dark mb-2">
            {proc.name} in {area.name}, {city.name}
          </h1>
          <p className="text-sm text-muted">
            {proc.nameAr} &middot; CPT {proc.cptCode} &middot; {proc.duration} &middot;{" "}
            {proc.recoveryTime} recovery
          </p>
        </div>

        {/* Answer block */}
        <div className="answer-block mb-8" data-answer-block="true">
          <p className="text-muted leading-relaxed">
            According to the UAE Open Healthcare Directory, {proc.name.toLowerCase()} in{" "}
            {area.name}, {city.name} costs between AED {priceMin.toLocaleString()} and AED{" "}
            {priceMax.toLocaleString()}, with a typical price of AED{" "}
            {priceTypical.toLocaleString()}. There{" "}
            {areaProviders.length === 1 ? "is 1 provider" : `are ${areaProviders.length} providers`}{" "}
            offering related {categoryName.toLowerCase()} services in {area.name}. {insuranceLabel}.{" "}
            The procedure takes {proc.duration.toLowerCase()} with {proc.recoveryTime.toLowerCase()}{" "}
            recovery. Pricing based on market-observed data. Last updated March 2026.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2">
            {/* Cost table */}
            <section className="mb-8">
              <div className="section-header">
                <h2>{proc.name} Cost in {area.name}, {city.name}</h2>
                <span className="arrows">&gt;&gt;&gt;</span>
              </div>
              <div className="border border-light-200">
                <div className="grid grid-cols-3 gap-0 border-b border-light-200">
                  <div className="p-4 text-center border-r border-light-200">
                    <p className="text-xs text-muted mb-1">Minimum</p>
                    <p className="text-lg font-bold text-dark">
                      AED {priceMin.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 text-center border-r border-light-200 bg-accent-muted">
                    <p className="text-xs text-muted mb-1">Typical</p>
                    <p className="text-lg font-bold text-accent">
                      AED {priceTypical.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 text-center">
                    <p className="text-xs text-muted mb-1">Maximum</p>
                    <p className="text-lg font-bold text-dark">
                      AED {priceMax.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-xs text-muted">
                    Prices reflect observed ranges across government, private, and premium facilities
                    in {city.name}. Individual provider quotes may differ. Prices in AED, excluding
                    VAT where applicable.
                  </p>
                </div>
              </div>
            </section>

            {/* UAE city comparison table */}
            <section className="mb-8">
              <div className="section-header">
                <h2>{proc.name} Cost Across UAE Cities</h2>
                <span className="arrows">&gt;&gt;&gt;</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-light-200">
                      <th className="text-left py-3 pr-4 font-bold text-dark">City</th>
                      <th className="text-right py-3 px-4 font-bold text-dark">Min</th>
                      <th className="text-right py-3 px-4 font-bold text-dark">Typical</th>
                      <th className="text-right py-3 pl-4 font-bold text-dark">Max</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(proc.cityPricing).map(([slug, pricing]) => {
                      const isCurrentCity = slug === city.slug;
                      return (
                        <tr
                          key={slug}
                          className={`border-b border-light-200 ${isCurrentCity ? "bg-accent-muted font-semibold" : ""}`}
                        >
                          <td className="py-2.5 pr-4">
                            {cityNames[slug] || slug}
                            {isCurrentCity && (
                              <span className="ml-2 text-[10px] font-bold text-accent">
                                (current)
                              </span>
                            )}
                          </td>
                          <td className="text-right py-2.5 px-4">
                            AED {pricing.min.toLocaleString()}
                          </td>
                          <td className="text-right py-2.5 px-4 font-bold">
                            AED {pricing.typical.toLocaleString()}
                          </td>
                          <td className="text-right py-2.5 pl-4">
                            AED {pricing.max.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted mt-2">
                Source: DOH Mandatory Tariff (Shafafiya), DHA DRG parameters, and market-observed data
                2024-2026. Base tariff: AED {proc.baseTariffAed.toLocaleString()}.
              </p>
            </section>

            {/* About the procedure */}
            <section className="mb-8">
              <div className="section-header">
                <h2>About {proc.name}</h2>
                <span className="arrows">&gt;&gt;&gt;</span>
              </div>
              <div className="border border-light-200 p-6">
                <p className="text-muted leading-relaxed mb-4">{proc.description}</p>

                <h3 className="font-bold text-dark mb-2">What to Expect</h3>
                <p className="text-muted leading-relaxed mb-4">{proc.whatToExpect}</p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t border-light-200">
                  <div>
                    <p className="text-xs text-muted mb-1">Duration</p>
                    <p className="font-semibold text-dark text-sm">{proc.duration}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted mb-1">Recovery</p>
                    <p className="font-semibold text-dark text-sm">{proc.recoveryTime}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted mb-1">Setting</p>
                    <p className="font-semibold text-dark text-sm capitalize">{proc.setting}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted mb-1">Anaesthesia</p>
                    <p className="font-semibold text-dark text-sm capitalize">{proc.anaesthesia}</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Insurance coverage */}
            <section className="mb-8">
              <div className="section-header">
                <h2>Insurance Coverage for {proc.name}</h2>
                <span className="arrows">&gt;&gt;&gt;</span>
              </div>
              <div className="border border-light-200 p-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className={`inline-block text-xs font-bold px-3 py-1 ${insuranceBadgeClass}`}>
                    {insuranceLabel}
                  </span>
                </div>
                <p className="text-muted leading-relaxed">{proc.insuranceNotes}</p>
              </div>
            </section>

            {/* Providers in this area */}
            <section className="mb-8">
              <div className="section-header">
                <h2>
                  {categoryName} in {area.name}, {city.name}
                </h2>
                <span className="arrows">&gt;&gt;&gt;</span>
              </div>
              <p className="text-sm text-muted mb-4">
                These {categoryName.toLowerCase()} in {area.name} offer {proc.name.toLowerCase()} or
                related services. Ranked by patient reviews.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {areaProviders.map((p) => (
                  <ProviderCard
                    key={p.id}
                    name={p.name}
                    slug={p.slug}
                    citySlug={p.citySlug}
                    categorySlug={p.categorySlug}
                    address={p.address}
                    phone={p.phone}
                    website={p.website}
                    shortDescription={p.shortDescription}
                    googleRating={p.googleRating}
                    googleReviewCount={p.googleReviewCount}
                    isClaimed={p.isClaimed}
                    isVerified={p.isVerified}
                  />
                ))}
              </div>
              <p className="text-sm text-muted mt-4">
                <Link
                  href={`/directory/${city.slug}/${area.slug}/${proc.categorySlug}`}
                  className="text-accent hover:underline font-medium"
                >
                  View all {categoryName.toLowerCase()} in {area.name} &rarr;
                </Link>
              </p>
            </section>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-4">
              {/* Quick facts card */}
              <div className="border border-light-200 p-6">
                <h3 className="font-bold text-dark mb-4">Quick Facts</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm border-b border-light-200 pb-2">
                    <span className="text-muted">Cost</span>
                    <span className="font-semibold text-dark">
                      AED {priceMin.toLocaleString()} - {priceMax.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm border-b border-light-200 pb-2">
                    <span className="text-muted">Typical</span>
                    <span className="font-bold text-accent">
                      AED {priceTypical.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm border-b border-light-200 pb-2">
                    <span className="text-muted">Duration</span>
                    <span className="font-semibold text-dark">{proc.duration}</span>
                  </div>
                  <div className="flex justify-between text-sm border-b border-light-200 pb-2">
                    <span className="text-muted">Recovery</span>
                    <span className="font-semibold text-dark">{proc.recoveryTime}</span>
                  </div>
                  <div className="flex justify-between text-sm border-b border-light-200 pb-2">
                    <span className="text-muted">Setting</span>
                    <span className="font-semibold text-dark capitalize">{proc.setting}</span>
                  </div>
                  <div className="flex justify-between text-sm border-b border-light-200 pb-2">
                    <span className="text-muted">Anaesthesia</span>
                    <span className="font-semibold text-dark capitalize">{proc.anaesthesia}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">Insurance</span>
                    <span className={`text-xs font-bold px-2 py-0.5 ${insuranceBadgeClass}`}>
                      {proc.insuranceCoverage === "typically-covered"
                        ? "Covered"
                        : proc.insuranceCoverage === "partially-covered"
                          ? "Partial"
                          : proc.insuranceCoverage === "rarely-covered"
                            ? "Rare"
                            : "Not covered"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Related procedures */}
              {relatedProcedures.length > 0 && (
                <div className="border border-light-200 p-6">
                  <h3 className="font-bold text-dark mb-3">Related Procedures</h3>
                  <div className="space-y-2">
                    {relatedProcedures.map((rp) => {
                      const rpCityPrice = rp.cityPricing[city.slug];
                      const rpPrice = rpCityPrice
                        ? `AED ${rpCityPrice.min.toLocaleString()} - ${rpCityPrice.max.toLocaleString()}`
                        : `AED ${rp.priceRange.min.toLocaleString()} - ${rp.priceRange.max.toLocaleString()}`;
                      return (
                        <Link
                          key={rp.slug}
                          href={`/directory/${city.slug}/${area.slug}/procedures/${rp.slug}`}
                          className="block text-sm hover:text-accent transition-colors"
                        >
                          <p className="font-medium text-dark">{rp.name}</p>
                          <p className="text-xs text-muted">{rpPrice}</p>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* CTA */}
              <div className="border border-light-200 p-6 bg-accent-muted">
                <h3 className="font-bold text-dark mb-2">Need {proc.name}?</h3>
                <p className="text-sm text-muted mb-4">
                  Browse verified {categoryName.toLowerCase()} in {area.name}, {city.name} and
                  compare ratings, reviews, and insurance acceptance.
                </p>
                <Link
                  href={`/directory/${city.slug}/${area.slug}/${proc.categorySlug}`}
                  className="btn-accent w-full text-center block"
                >
                  Find Providers
                </Link>
              </div>
            </div>
          </div>
        </div>

        <FaqSection
          faqs={faqs}
          title={`${proc.name} in ${area.name}, ${city.name} — FAQ`}
        />
      </div>
    </>
  );
}
