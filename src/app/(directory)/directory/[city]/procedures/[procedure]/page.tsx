import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Clock, Shield, Activity, MapPin, ArrowRight } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { ProviderCard } from "@/components/provider/ProviderCard";
import { FaqSection } from "@/components/seo/FaqSection";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  getCityBySlug,
  getCities,
  getProviders,
  getProviderCountByCategoryAndCity,
} from "@/lib/data";
import {
  PROCEDURES,
  getProcedureBySlug,
  formatAed,
  type MedicalProcedure,
} from "@/lib/constants/procedures";
import { CITIES } from "@/lib/constants/cities";
import {
  breadcrumbSchema,
  speakableSchema,
  faqPageSchema,
} from "@/lib/seo";
import {
  procedureSchema,
  procedureCityOffersSchema,
} from "@/lib/pricing";
import { getBaseUrl } from "@/lib/helpers";

export const revalidate = 43200;

interface Props {
  params: { city: string; procedure: string };
}

export function generateStaticParams() {
  const cities = getCities();
  const params: { city: string; procedure: string }[] = [];

  for (const city of cities) {
    for (const proc of PROCEDURES) {
      if (proc.cityPricing[city.slug]) {
        params.push({ city: city.slug, procedure: proc.slug });
      }
    }
  }

  return params;
}

export function generateMetadata({ params }: Props): Metadata {
  const city = getCityBySlug(params.city);
  if (!city) return {};
  const proc = getProcedureBySlug(params.procedure);
  if (!proc) return {};
  const pricing = proc.cityPricing[city.slug];
  if (!pricing) return {};

  const base = getBaseUrl();
  const providerCount = getProviderCountByCategoryAndCity(
    proc.categorySlug,
    city.slug
  );

  return {
    title: `${proc.name} Cost in ${city.name} — ${formatAed(pricing.min)} to ${formatAed(pricing.max)} | UAE Open Healthcare Directory`,
    description: `How much does a ${proc.name.toLowerCase()} cost in ${city.name}? Typical price: ${formatAed(pricing.typical)}. Range: ${formatAed(pricing.min)}–${formatAed(pricing.max)}. Compare ${providerCount} providers, check insurance coverage, and estimate your out-of-pocket cost.`,
    alternates: {
      canonical: `${base}/directory/${city.slug}/procedures/${proc.slug}`,
    },
    openGraph: {
      title: `${proc.name} Cost in ${city.name} — ${formatAed(pricing.typical)} Typical`,
      description: `Compare ${proc.name.toLowerCase()} prices in ${city.name}. Range: ${formatAed(pricing.min)}–${formatAed(pricing.max)}. Find providers and check insurance coverage.`,
      url: `${base}/directory/${city.slug}/procedures/${proc.slug}`,
      type: "website",
    },
  };
}

function getRegulatorName(citySlug: string): string {
  if (citySlug === "dubai") return "Dubai Health Authority (DHA)";
  if (citySlug === "abu-dhabi" || citySlug === "al-ain")
    return "Department of Health Abu Dhabi (DOH)";
  return "Ministry of Health and Prevention (MOHAP)";
}

function getCoverageLabel(coverage: MedicalProcedure["insuranceCoverage"]): string {
  switch (coverage) {
    case "typically-covered":
      return "Typically covered";
    case "partially-covered":
      return "Partially covered";
    case "rarely-covered":
      return "Rarely covered";
    case "not-covered":
      return "Not covered";
  }
}

function getCoverageBadgeClass(coverage: MedicalProcedure["insuranceCoverage"]): string {
  switch (coverage) {
    case "typically-covered":
      return "bg-green-100 text-green-800";
    case "partially-covered":
      return "bg-yellow-100 text-yellow-800";
    case "rarely-covered":
      return "bg-orange-100 text-orange-800";
    case "not-covered":
      return "bg-red-100 text-red-800";
  }
}

export default function ProcedureCityPage({ params }: Props) {
  const city = getCityBySlug(params.city);
  if (!city) notFound();

  const proc = getProcedureBySlug(params.procedure);
  if (!proc) notFound();

  const pricing = proc.cityPricing[city.slug];
  if (!pricing) notFound();

  const base = getBaseUrl();
  const regulator = getRegulatorName(city.slug);

  // Related providers in this city + category
  const { providers, total: providerCount } = getProviders({
    citySlug: city.slug,
    categorySlug: proc.categorySlug,
    limit: 12,
    sort: "rating",
  });

  // City comparison table data
  const cityComparisons = CITIES.map((c) => {
    const cp = proc.cityPricing[c.slug];
    if (!cp) return null;
    return {
      slug: c.slug,
      name: c.name,
      min: cp.min,
      max: cp.max,
      typical: cp.typical,
      isCurrent: c.slug === city.slug,
    };
  }).filter(Boolean) as {
    slug: string;
    name: string;
    min: number;
    max: number;
    typical: number;
    isCurrent: boolean;
  }[];

  // Related procedures
  const relatedProcs = proc.relatedProcedures
    .map((slug) => getProcedureBySlug(slug))
    .filter((p): p is MedicalProcedure => !!p && !!p.cityPricing[city.slug]);

  // Generate FAQs
  const faqs = [
    {
      question: `How much does a ${proc.name.toLowerCase()} cost in ${city.name}?`,
      answer: `A ${proc.name.toLowerCase()} in ${city.name} costs ${formatAed(pricing.min)} to ${formatAed(pricing.max)}, with a typical price of ${formatAed(pricing.typical)}. Pricing depends on the facility type (government, private, or premium), the doctor's experience, and specific clinical requirements. Healthcare in ${city.name} is regulated by the ${regulator}.`,
    },
    {
      question: `Where can I get a ${proc.name.toLowerCase()} in ${city.name}?`,
      answer: `There are ${providerCount} ${proc.categorySlug.replace(/-/g, " ")} providers in ${city.name} listed in the UAE Open Healthcare Directory. Browse listings below to compare providers by rating, insurance acceptance, and services offered. All data from official government registers, last verified March 2026.`,
    },
    {
      question: `Does insurance cover a ${proc.name.toLowerCase()} in ${city.name}?`,
      answer: proc.insuranceNotes,
    },
    {
      question: `How long does a ${proc.name.toLowerCase()} take?`,
      answer: `A ${proc.name.toLowerCase()} typically takes ${proc.duration}. ${proc.recoveryTime !== "No recovery needed" ? `Recovery time is ${proc.recoveryTime.toLowerCase()}.` : "No recovery time is needed — you can resume normal activities immediately."} ${proc.anaesthesia !== "none" ? `${proc.anaesthesia.charAt(0).toUpperCase() + proc.anaesthesia.slice(1)} anaesthesia is typically used.` : "No anaesthesia is required."}`,
    },
    {
      question: `What is the cheapest option for a ${proc.name.toLowerCase()} in ${city.name}?`,
      answer: `The lowest price for a ${proc.name.toLowerCase()} in ${city.name} starts from ${formatAed(pricing.min)} at government or basic private facilities. For competitive pricing, compare multiple providers in the UAE Open Healthcare Directory and confirm the quote directly with the facility. Government hospitals generally charge 30-50% less than premium private hospitals.`,
    },
    {
      question: `Is a ${proc.name.toLowerCase()} cheaper in ${city.name} compared to other UAE cities?`,
      answer: (() => {
        const sorted = cityComparisons
          .slice()
          .sort((a, b) => a.typical - b.typical);
        const cheapestCity = sorted[0];
        const currentRank =
          sorted.findIndex((c) => c.slug === city.slug) + 1;
        return `${city.name} ranks #${currentRank} out of ${sorted.length} UAE cities for ${proc.name.toLowerCase()} pricing (typical: ${formatAed(pricing.typical)}). The cheapest city is ${cheapestCity.name} at ${formatAed(cheapestCity.typical)} typical. See the city comparison table above for full details.`;
      })(),
    },
  ];

  // Schema.org data
  const offersSchema = procedureCityOffersSchema(proc, city.slug, city.name);

  return (
    <>
      <div className="container-tc py-8">
        <JsonLd
          data={breadcrumbSchema([
            { name: "UAE", url: base },
            { name: city.name, url: `${base}/directory/${city.slug}` },
            {
              name: "Procedures",
              url: `${base}/directory/${city.slug}/procedures`,
            },
            { name: proc.name },
          ])}
        />
        <JsonLd data={procedureSchema(proc)} />
        {offersSchema && <JsonLd data={offersSchema} />}
        <JsonLd data={faqPageSchema(faqs)} />
        <JsonLd data={speakableSchema([".answer-block"])} />

        <Breadcrumb
          items={[
            { label: "UAE", href: "/" },
            { label: city.name, href: `/directory/${city.slug}` },
            {
              label: "Procedures",
              href: `/directory/${city.slug}/procedures`,
            },
            { label: proc.name },
          ]}
        />

        {/* Header */}
        <h1 className="text-3xl font-bold text-dark mb-2">
          {proc.name} Cost in {city.name}
        </h1>

        <p className="text-sm text-muted mb-4">
          {providerCount} providers &middot; {proc.duration} &middot;{" "}
          {getCoverageLabel(proc.insuranceCoverage)} by insurance &middot;
          Last updated March 2026
        </p>

        {/* Answer block for AEO */}
        <div className="answer-block mb-8" data-answer-block="true">
          <p className="text-muted leading-relaxed">
            According to the UAE Open Healthcare Directory, a{" "}
            {proc.name.toLowerCase()} in {city.name} costs {formatAed(pricing.min)}{" "}
            to {formatAed(pricing.max)}, with a typical price of{" "}
            {formatAed(pricing.typical)}. There are {providerCount}{" "}
            {proc.categorySlug.replace(/-/g, " ")} providers in {city.name}{" "}
            listed in the directory.{" "}
            {proc.insuranceCoverage === "typically-covered"
              ? "Most health insurance plans in the UAE cover this procedure when medically indicated. "
              : proc.insuranceCoverage === "not-covered"
                ? "This is a cosmetic/elective procedure and is not covered by UAE health insurance. "
                : ""}
            Healthcare in {city.name} is regulated by the {regulator}. Prices
            vary based on facility type (government vs. private vs. premium),
            doctor experience, and clinical complexity. Data sourced from DOH
            Mandatory Tariff methodology and market-observed ranges, last
            verified March 2026.
          </p>
        </div>

        {/* Price highlight card */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-light-50 border border-light-200 p-5 text-center">
            <p className="text-xs text-muted uppercase tracking-wider mb-1">
              From
            </p>
            <p className="text-2xl font-bold text-dark">
              {formatAed(pricing.min)}
            </p>
            <p className="text-xs text-muted">Lowest price</p>
          </div>
          <div className="bg-accent-muted border border-accent p-5 text-center">
            <p className="text-xs text-accent uppercase tracking-wider mb-1">
              Typical
            </p>
            <p className="text-2xl font-bold text-dark">
              {formatAed(pricing.typical)}
            </p>
            <p className="text-xs text-muted">Most common price</p>
          </div>
          <div className="bg-light-50 border border-light-200 p-5 text-center">
            <p className="text-xs text-muted uppercase tracking-wider mb-1">
              Up to
            </p>
            <p className="text-2xl font-bold text-dark">
              {formatAed(pricing.max)}
            </p>
            <p className="text-xs text-muted">Premium facilities</p>
          </div>
        </div>

        {/* Procedure details */}
        <section className="mb-10">
          <div className="section-header">
            <h2>About {proc.name}</h2>
            <span className="arrows">&gt;&gt;&gt;</span>
          </div>
          <p className="text-sm text-muted leading-relaxed mb-4">
            {proc.description}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-light-50 border border-light-200 p-3">
              <Clock className="h-4 w-4 text-accent mb-1" />
              <p className="text-xs font-bold text-dark">Duration</p>
              <p className="text-xs text-muted">{proc.duration}</p>
            </div>
            <div className="bg-light-50 border border-light-200 p-3">
              <Activity className="h-4 w-4 text-accent mb-1" />
              <p className="text-xs font-bold text-dark">Recovery</p>
              <p className="text-xs text-muted">{proc.recoveryTime}</p>
            </div>
            <div className="bg-light-50 border border-light-200 p-3">
              <Shield className="h-4 w-4 text-accent mb-1" />
              <p className="text-xs font-bold text-dark">Insurance</p>
              <p className="text-xs text-muted">
                <span
                  className={`inline-block px-1.5 py-0.5 text-[9px] font-bold ${getCoverageBadgeClass(proc.insuranceCoverage)}`}
                >
                  {getCoverageLabel(proc.insuranceCoverage)}
                </span>
              </p>
            </div>
            <div className="bg-light-50 border border-light-200 p-3">
              <MapPin className="h-4 w-4 text-accent mb-1" />
              <p className="text-xs font-bold text-dark">Setting</p>
              <p className="text-xs text-muted capitalize">{proc.setting}</p>
            </div>
          </div>
        </section>

        {/* What to expect */}
        <section className="mb-10">
          <div className="section-header">
            <h2>What to Expect</h2>
            <span className="arrows">&gt;&gt;&gt;</span>
          </div>
          <p className="text-sm text-muted leading-relaxed">
            {proc.whatToExpect}
          </p>
          {proc.anaesthesia !== "none" && (
            <p className="text-sm text-muted mt-2">
              <strong>Anaesthesia:</strong>{" "}
              {proc.anaesthesia.charAt(0).toUpperCase() +
                proc.anaesthesia.slice(1)}{" "}
              anaesthesia is typically used for this procedure.
            </p>
          )}
        </section>
      </div>

      {/* City comparison table — bg-light-50 section */}
      <section className="bg-light-50 py-10">
        <div className="container-tc">
          <div className="section-header">
            <h2>
              {proc.name} Cost Comparison — All UAE Cities
            </h2>
            <span className="arrows">&gt;&gt;&gt;</span>
          </div>
          <p className="text-sm text-muted mb-4">
            Compare {proc.name.toLowerCase()} prices across all UAE emirates.{" "}
            {city.name} is highlighted below.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b-2 border-light-200">
                  <th className="text-left py-3 pr-4 font-bold text-dark">
                    City
                  </th>
                  <th className="text-right py-3 px-4 font-bold text-dark">
                    From
                  </th>
                  <th className="text-right py-3 px-4 font-bold text-dark">
                    Typical
                  </th>
                  <th className="text-right py-3 px-4 font-bold text-dark">
                    Up to
                  </th>
                  <th className="text-right py-3 pl-4 font-bold text-dark">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody>
                {cityComparisons.map((comp) => (
                  <tr
                    key={comp.slug}
                    className={`border-b border-light-200 ${comp.isCurrent ? "bg-accent-muted font-bold" : ""}`}
                  >
                    <td className="py-3 pr-4 text-dark">
                      {comp.name}
                      {comp.isCurrent && (
                        <span className="text-[9px] text-accent ml-1">
                          (current)
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right text-muted">
                      {formatAed(comp.min)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-dark">
                      {formatAed(comp.typical)}
                    </td>
                    <td className="py-3 px-4 text-right text-muted">
                      {formatAed(comp.max)}
                    </td>
                    <td className="py-3 pl-4 text-right">
                      {comp.isCurrent ? (
                        <span className="text-xs text-muted">
                          Viewing
                        </span>
                      ) : (
                        <Link
                          href={`/directory/${comp.slug}/procedures/${proc.slug}`}
                          className="text-xs text-accent hover:underline"
                        >
                          View
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Insurance coverage section */}
      <div className="container-tc py-10">
        <section className="mb-10">
          <div className="section-header">
            <h2>Insurance Coverage</h2>
            <span className="arrows">&gt;&gt;&gt;</span>
          </div>
          <div className="bg-light-50 border border-light-200 p-5">
            <div className="flex items-center gap-3 mb-3">
              <span
                className={`px-2 py-1 text-xs font-bold ${getCoverageBadgeClass(proc.insuranceCoverage)}`}
              >
                {getCoverageLabel(proc.insuranceCoverage)}
              </span>
              {proc.setting !== "outpatient" && (
                <span className="text-xs text-muted">
                  {proc.setting === "inpatient"
                    ? "Inpatient — typically 0% co-pay"
                    : proc.setting === "day-case"
                      ? "Day-case — reduced co-pay on most plans"
                      : ""}
                </span>
              )}
            </div>
            <p className="text-sm text-muted leading-relaxed">
              {proc.insuranceNotes}
            </p>
          </div>
        </section>

        {/* Related providers */}
        {providers.length > 0 && (
          <section className="mb-10">
            <div className="section-header">
              <h2>
                {proc.categorySlug
                  .split("-")
                  .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                  .join(" ")}{" "}
                Providers in {city.name}
              </h2>
              <span className="arrows">&gt;&gt;&gt;</span>
            </div>
            <p className="text-sm text-muted mb-4">
              {providerCount} providers offer{" "}
              {proc.categorySlug.replace(/-/g, " ")} services in {city.name}.
              These clinics and hospitals may perform{" "}
              {proc.name.toLowerCase()} procedures. Contact providers directly
              to confirm availability and pricing.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              {providers.slice(0, 6).map((p) => (
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

            {providerCount > 6 && (
              <Link
                href={`/directory/${city.slug}/${proc.categorySlug}`}
                className="inline-flex items-center gap-1 text-sm font-bold text-accent hover:underline"
              >
                View all {providerCount}{" "}
                {proc.categorySlug.replace(/-/g, " ")} providers in{" "}
                {city.name}
                <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </section>
        )}

        {/* Related procedures */}
        {relatedProcs.length > 0 && (
          <section className="mb-10">
            <div className="section-header">
              <h2>Related Procedures</h2>
              <span className="arrows">&gt;&gt;&gt;</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {relatedProcs.map((rp) => {
                const rpPricing = rp.cityPricing[city.slug];
                if (!rpPricing) return null;
                return (
                  <Link
                    key={rp.slug}
                    href={`/directory/${city.slug}/procedures/${rp.slug}`}
                    className="flex items-center justify-between border border-light-200 px-4 py-3 hover:border-accent transition-colors"
                  >
                    <div>
                      <span className="text-sm font-medium text-dark">
                        {rp.name}
                      </span>
                      <p className="text-xs text-muted">{rp.duration}</p>
                    </div>
                    <span className="text-sm font-bold text-accent whitespace-nowrap">
                      {formatAed(rpPricing.typical)}
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Cross-links */}
        <div className="flex flex-wrap gap-3 mb-6">
          <Link
            href={`/pricing/${proc.slug}/${city.slug}`}
            className="badge-outline px-3 py-1.5 text-sm hover:bg-accent-muted"
          >
            Detailed pricing breakdown &rarr;
          </Link>
          <Link
            href={`/pricing/${proc.slug}`}
            className="badge-outline px-3 py-1.5 text-sm hover:bg-accent-muted"
          >
            UAE-wide {proc.name} pricing &rarr;
          </Link>
          <Link
            href={`/directory/${city.slug}/procedures`}
            className="badge-outline px-3 py-1.5 text-sm hover:bg-accent-muted"
          >
            All procedures in {city.name} &rarr;
          </Link>
        </div>

        <FaqSection
          faqs={faqs}
          title={`${proc.name} in ${city.name} — FAQ`}
        />
      </div>
    </>
  );
}
