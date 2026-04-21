import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Clock, Shield, Activity, MapPin, ArrowRight, ChevronRight } from "lucide-react";
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
import { safe } from "@/lib/safeData";

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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const city = getCityBySlug(params.city);
  if (!city) return {};
  const proc = getProcedureBySlug(params.procedure);
  if (!proc) return {};
  const pricing = proc.cityPricing[city.slug];
  if (!pricing) return {};

  const base = getBaseUrl();
  const providerCount = await safe(
    getProviderCountByCategoryAndCity(proc.categorySlug, city.slug),
    0,
    "provCountCatCity-meta",
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

export default async function ProcedureCityPage({ params }: Props) {
  const city = getCityBySlug(params.city);
  if (!city) notFound();

  const proc = getProcedureBySlug(params.procedure);
  if (!proc) notFound();

  const pricing = proc.cityPricing[city.slug];
  if (!pricing) notFound();

  const base = getBaseUrl();
  const regulator = getRegulatorName(city.slug);

  // Related providers in this city + category
  const { providers, total: providerCount } = await safe(
    getProviders({
      citySlug: city.slug,
      categorySlug: proc.categorySlug,
      limit: 12,
      sort: "rating",
    }),
    { providers: [], total: 0, page: 1, totalPages: 1 } as Awaited<ReturnType<typeof getProviders>>,
    "procProviders",
  );

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

  const breadcrumbs = [
    { label: "UAE", href: "/" },
    { label: city.name, href: `/directory/${city.slug}` },
    { label: "Procedures", href: `/directory/${city.slug}/procedures` },
    { label: proc.name },
  ];

  return (
    <>
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
            Procedure cost · {city.name}
          </p>
          <h1 className="font-display font-semibold text-ink text-display-lg lg:text-[52px] leading-[1.04] tracking-[-0.025em]">
            {proc.name} Cost in {city.name}.
          </h1>
          <p className="font-sans text-z-body sm:text-[17px] text-ink-soft mt-4 max-w-2xl leading-relaxed">
            {providerCount} providers · {proc.duration} · {getCoverageLabel(proc.insuranceCoverage)} by insurance · Last updated March 2026
          </p>

          {/* AEO Answer Block */}
          <div className="mt-8 answer-block rounded-z-md bg-white border border-ink-line p-5 sm:p-6 max-w-4xl" data-answer-block="true">
            <p className="font-sans text-z-body-sm text-ink-soft leading-[1.75]">
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
        </div>
      </section>

      {/* Price highlight cards */}
      <section className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-ink-line rounded-z-md p-5 text-center">
            <p className="font-sans text-z-micro text-ink-muted uppercase tracking-[0.04em] mb-1">From</p>
            <p className="font-display font-semibold text-ink text-display-md leading-none">{formatAed(pricing.min)}</p>
            <p className="font-sans text-z-caption text-ink-muted mt-1">Lowest price</p>
          </div>
          <div className="bg-surface-cream border border-accent-dark/40 rounded-z-md p-5 text-center">
            <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-1">Typical</p>
            <p className="font-display font-semibold text-ink text-display-md leading-none">{formatAed(pricing.typical)}</p>
            <p className="font-sans text-z-caption text-ink-muted mt-1">Most common price</p>
          </div>
          <div className="bg-white border border-ink-line rounded-z-md p-5 text-center">
            <p className="font-sans text-z-micro text-ink-muted uppercase tracking-[0.04em] mb-1">Up to</p>
            <p className="font-display font-semibold text-ink text-display-md leading-none">{formatAed(pricing.max)}</p>
            <p className="font-sans text-z-caption text-ink-muted mt-1">Premium facilities</p>
          </div>
        </div>
      </section>

      {/* Prose body — about + what to expect */}
      <section className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        <div className="max-w-[720px]">
          <h2 className="font-display font-semibold text-ink text-z-h2 tracking-[-0.018em] mb-4">
            About {proc.name}
          </h2>
          <p className="font-sans text-z-body text-ink-soft leading-relaxed mb-6">
            {proc.description}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
            <div className="bg-white border border-ink-line rounded-z-sm p-3">
              <Clock className="h-4 w-4 text-accent-dark mb-1" />
              <p className="font-sans text-z-caption font-semibold text-ink">Duration</p>
              <p className="font-sans text-z-caption text-ink-muted">{proc.duration}</p>
            </div>
            <div className="bg-white border border-ink-line rounded-z-sm p-3">
              <Activity className="h-4 w-4 text-accent-dark mb-1" />
              <p className="font-sans text-z-caption font-semibold text-ink">Recovery</p>
              <p className="font-sans text-z-caption text-ink-muted">{proc.recoveryTime}</p>
            </div>
            <div className="bg-white border border-ink-line rounded-z-sm p-3">
              <Shield className="h-4 w-4 text-accent-dark mb-1" />
              <p className="font-sans text-z-caption font-semibold text-ink">Insurance</p>
              <p className="font-sans text-z-caption text-ink-muted">
                <span className={`inline-block px-1.5 py-0.5 text-[9px] font-bold ${getCoverageBadgeClass(proc.insuranceCoverage)}`}>
                  {getCoverageLabel(proc.insuranceCoverage)}
                </span>
              </p>
            </div>
            <div className="bg-white border border-ink-line rounded-z-sm p-3">
              <MapPin className="h-4 w-4 text-accent-dark mb-1" />
              <p className="font-sans text-z-caption font-semibold text-ink">Setting</p>
              <p className="font-sans text-z-caption text-ink-muted capitalize">{proc.setting}</p>
            </div>
          </div>

          <h2 className="font-display font-semibold text-ink text-z-h2 tracking-[-0.018em] mb-4">
            What to expect
          </h2>
          <p className="font-sans text-z-body text-ink-soft leading-relaxed">
            {proc.whatToExpect}
          </p>
          {proc.anaesthesia !== "none" && (
            <p className="font-sans text-z-body-sm text-ink-muted mt-3">
              <strong className="text-ink">Anaesthesia:</strong>{" "}
              {proc.anaesthesia.charAt(0).toUpperCase() + proc.anaesthesia.slice(1)} anaesthesia is typically used for this procedure.
            </p>
          )}
        </div>
      </section>

      {/* City comparison table */}
      <section className="bg-surface-cream py-12 mt-16">
        <div className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-display font-semibold text-ink text-display-md tracking-[-0.018em] mb-3">
            {proc.name} cost comparison — all UAE cities
          </h2>
          <p className="font-sans text-z-body-sm text-ink-muted mb-6">
            Compare {proc.name.toLowerCase()} prices across all UAE emirates. {city.name} is highlighted below.
          </p>

          <div className="overflow-x-auto bg-white rounded-z-md border border-ink-line">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-ink-line">
                  <th className="text-left py-3 px-4 font-sans font-semibold text-ink">City</th>
                  <th className="text-right py-3 px-4 font-sans font-semibold text-ink">From</th>
                  <th className="text-right py-3 px-4 font-sans font-semibold text-ink">Typical</th>
                  <th className="text-right py-3 px-4 font-sans font-semibold text-ink">Up to</th>
                  <th className="text-right py-3 px-4 font-sans font-semibold text-ink">Details</th>
                </tr>
              </thead>
              <tbody>
                {cityComparisons.map((comp) => (
                  <tr
                    key={comp.slug}
                    className={`border-b border-ink-line last:border-b-0 ${comp.isCurrent ? "bg-surface-cream font-semibold" : ""}`}
                  >
                    <td className="py-3 px-4 text-ink">
                      {comp.name}
                      {comp.isCurrent && (
                        <span className="text-z-micro text-accent-dark ml-1">(current)</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right text-ink-soft">{formatAed(comp.min)}</td>
                    <td className="py-3 px-4 text-right font-semibold text-ink">{formatAed(comp.typical)}</td>
                    <td className="py-3 px-4 text-right text-ink-soft">{formatAed(comp.max)}</td>
                    <td className="py-3 px-4 text-right">
                      {comp.isCurrent ? (
                        <span className="font-sans text-z-caption text-ink-muted">Viewing</span>
                      ) : (
                        <Link
                          href={`/directory/${comp.slug}/procedures/${proc.slug}`}
                          className="font-sans text-z-caption text-accent-dark hover:underline"
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

      {/* Insurance coverage */}
      <section className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-[720px]">
          <h2 className="font-display font-semibold text-ink text-z-h2 tracking-[-0.018em] mb-4">
            Insurance coverage
          </h2>
          <div className="bg-surface-cream border border-ink-line rounded-z-md p-5">
            <div className="flex items-center gap-3 mb-3">
              <span className={`px-2 py-1 text-xs font-bold ${getCoverageBadgeClass(proc.insuranceCoverage)}`}>
                {getCoverageLabel(proc.insuranceCoverage)}
              </span>
              {proc.setting !== "outpatient" && (
                <span className="font-sans text-z-caption text-ink-muted">
                  {proc.setting === "inpatient"
                    ? "Inpatient — typically 0% co-pay"
                    : proc.setting === "day-case"
                      ? "Day-case — reduced co-pay on most plans"
                      : ""}
                </span>
              )}
            </div>
            <p className="font-sans text-z-body-sm text-ink-soft leading-relaxed">
              {proc.insuranceNotes}
            </p>
          </div>
        </div>
      </section>

      {/* Related providers */}
      {providers.length > 0 && (
        <section className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <h2 className="font-display font-semibold text-ink text-z-h1 mb-3">
            {proc.categorySlug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")} providers in {city.name}
          </h2>
          <p className="font-sans text-z-body-sm text-ink-muted mb-6">
            {providerCount} providers offer {proc.categorySlug.replace(/-/g, " ")} services in {city.name}. These clinics and hospitals may perform {proc.name.toLowerCase()} procedures. Contact providers directly to confirm availability and pricing.
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {providers.slice(0, 6).map((p) => (
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
          {providerCount > 6 && (
            <Link
              href={`/directory/${city.slug}/${proc.categorySlug}`}
              className="inline-flex items-center gap-1 mt-6 font-sans text-z-body-sm font-semibold text-accent-dark hover:underline"
            >
              View all {providerCount} {proc.categorySlug.replace(/-/g, " ")} providers in {city.name}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </section>
      )}

      {/* Related procedures */}
      {relatedProcs.length > 0 && (
        <section className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <h2 className="font-display font-semibold text-ink text-z-h1 mb-4">
            Related procedures
          </h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {relatedProcs.map((rp) => {
              const rpPricing = rp.cityPricing[city.slug];
              if (!rpPricing) return null;
              return (
                <li key={rp.slug}>
                  <Link
                    href={`/directory/${city.slug}/procedures/${rp.slug}`}
                    className="flex items-center justify-between bg-white border border-ink-line rounded-z-md px-4 py-3 hover:border-ink transition-colors"
                  >
                    <div>
                      <span className="font-sans text-z-body-sm font-semibold text-ink">{rp.name}</span>
                      <p className="font-sans text-z-caption text-ink-muted">{rp.duration}</p>
                    </div>
                    <span className="font-sans text-z-body-sm font-semibold text-accent-dark whitespace-nowrap">
                      {formatAed(rpPricing.typical)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Related links */}
      <section className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <ul className="flex flex-wrap gap-2">
          <li>
            <Link
              href={`/pricing/${proc.slug}/${city.slug}`}
              className="inline-flex items-center rounded-z-pill bg-white border border-ink-line px-3.5 py-1.5 font-sans text-z-body-sm text-ink hover:border-ink transition-colors"
            >
              Detailed pricing breakdown &rarr;
            </Link>
          </li>
          <li>
            <Link
              href={`/pricing/${proc.slug}`}
              className="inline-flex items-center rounded-z-pill bg-white border border-ink-line px-3.5 py-1.5 font-sans text-z-body-sm text-ink hover:border-ink transition-colors"
            >
              UAE-wide {proc.name} pricing &rarr;
            </Link>
          </li>
          <li>
            <Link
              href={`/directory/${city.slug}/procedures`}
              className="inline-flex items-center rounded-z-pill bg-white border border-ink-line px-3.5 py-1.5 font-sans text-z-body-sm text-ink hover:border-ink transition-colors"
            >
              All procedures in {city.name} &rarr;
            </Link>
          </li>
        </ul>
      </section>

      {/* FAQ */}
      <section className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pb-16 sm:pb-20">
        <div className="max-w-3xl">
          <FaqSection faqs={faqs} title={`${proc.name} in ${city.name} — FAQ`} />
        </div>
      </section>
    </>
  );
}
