import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { FaqSection } from "@/components/seo/FaqSection";
import { CostEstimator } from "@/components/pricing/CostEstimator";
import {
  PROCEDURE_CATEGORIES,
  getProceduresByCategory,
  getProcedureCategoryBySlug,
  formatAed,
} from "@/lib/pricing";
import { INSURER_PROFILES } from "@/lib/constants/insurance-plans";
import { CITIES } from "@/lib/constants/cities";
import { getProviders } from "@/lib/data";
import { breadcrumbSchema, speakableSchema, faqPageSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

export const revalidate = 43200;

export function generateStaticParams() {
  const params: { category: string; city: string }[] = [];
  for (const cat of PROCEDURE_CATEGORIES) {
    const procs = getProceduresByCategory(cat.slug);
    if (procs.length === 0) continue;
    for (const city of CITIES) {
      // Only generate if at least one procedure has pricing for this city
      if (procs.some((p) => p.cityPricing[city.slug])) {
        params.push({ category: cat.slug, city: city.slug });
      }
    }
  }
  return params;
}

interface Props {
  params: Promise<{ category: string; city: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category: catSlug, city: citySlug } = await params;
  const cat = getProcedureCategoryBySlug(catSlug);
  const city = CITIES.find((c) => c.slug === citySlug);
  if (!cat || !city) return {};

  const base = getBaseUrl();
  const procs = getProceduresByCategory(catSlug).filter((p) => p.cityPricing[citySlug]);
  if (procs.length === 0) return {};

  const minPrice = procs.reduce((m, p) => Math.min(m, p.cityPricing[citySlug].min), Infinity);
  const maxPrice = procs.reduce((m, p) => Math.max(m, p.cityPricing[citySlug].max), 0);

  return {
    title: `${cat.name} Costs in ${city.name} — ${formatAed(minPrice)} to ${formatAed(maxPrice)} | UAE Medical Pricing`,
    description: `How much do ${cat.name.toLowerCase()} cost in ${city.name}? Compare ${procs.length} procedures from ${formatAed(minPrice)} to ${formatAed(maxPrice)}. Insurance coverage, out-of-pocket estimates, and top-rated providers in ${city.name}.`,
    alternates: { canonical: `${base}/pricing/category/${catSlug}/${citySlug}` },
    openGraph: {
      title: `${cat.name} Costs in ${city.name} — ${procs.length} Procedures Compared`,
      description: `Compare ${cat.name.toLowerCase()} prices in ${city.name}. Range: ${formatAed(minPrice)}–${formatAed(maxPrice)}.`,
      url: `${base}/pricing/category/${catSlug}/${citySlug}`,
      type: "website",
    },
  };
}

export default async function CategoryCityPricingPage({ params }: Props) {
  const { category: catSlug, city: citySlug } = await params;
  const cat = getProcedureCategoryBySlug(catSlug);
  const city = CITIES.find((c) => c.slug === citySlug);
  if (!cat || !city) notFound();

  const base = getBaseUrl();
  const allCatProcs = getProceduresByCategory(catSlug);
  const procs = allCatProcs.filter((p) => p.cityPricing[citySlug]);
  if (procs.length === 0) notFound();

  const regulator =
    citySlug === "dubai" ? "Dubai Health Authority (DHA)"
    : (citySlug === "abu-dhabi" || citySlug === "al-ain") ? "Department of Health Abu Dhabi (DOH)"
    : "Ministry of Health and Prevention (MOHAP)";

  // Sort by typical price
  const sortedProcs = [...procs].sort(
    (a, b) => (a.cityPricing[citySlug]?.typical ?? 0) - (b.cityPricing[citySlug]?.typical ?? 0)
  );

  const typicals = procs.map((p) => p.cityPricing[citySlug].typical);
  const avgTypical = Math.round(typicals.reduce((a, b) => a + b, 0) / typicals.length);

  // Compare same category across cities
  const otherCities = CITIES.filter((c) => c.slug !== citySlug)
    .map((c) => {
      const cityProcs = allCatProcs.filter((p) => p.cityPricing[c.slug]);
      const typs = cityProcs.map((p) => p.cityPricing[c.slug].typical);
      return {
        slug: c.slug,
        name: c.name,
        avg: typs.length > 0 ? Math.round(typs.reduce((a, b) => a + b, 0) / typs.length) : 0,
      };
    })
    .sort((a, b) => a.avg - b.avg);

  // Get directory category slugs for provider lookup
  const categoryMap: Record<string, string[]> = {
    diagnostics: ["radiology-imaging", "labs-diagnostics"],
    dental: ["dental"],
    "eye-care": ["ophthalmology"],
    surgical: ["hospitals", "gastroenterology"],
    orthopedic: ["orthopedics"],
    maternity: ["ob-gyn", "fertility-ivf"],
    cosmetic: ["cosmetic-plastic", "dermatology"],
    cardiac: ["cardiology"],
    wellness: ["clinics"],
    therapy: ["physiotherapy", "mental-health"],
  };
  const dirCatSlugs = categoryMap[catSlug] || [];
  const allCityProviders = (await getProviders({ citySlug })).providers;
  const categoryProviders = allCityProviders.filter((p) => dirCatSlugs.includes(p.categorySlug));

  // Cost estimator - use average typical for the category
  const estimatorPlans = INSURER_PROFILES.flatMap((insurer) =>
    insurer.plans.map((plan) => ({
      id: plan.id,
      insurerSlug: insurer.slug,
      insurerName: insurer.name,
      name: plan.name,
      tier: plan.tier,
      copayOutpatient: plan.copayOutpatient,
      annualLimit: plan.annualLimit,
    }))
  );

  const coveredCount = procs.filter((p) => p.insuranceCoverage === "typically-covered").length;
  const dominantCoverage = coveredCount > procs.length / 2 ? "typically-covered" : "partially-covered";

  const faqs = [
    {
      question: `How much do ${cat.name.toLowerCase()} cost in ${city.name}?`,
      answer: `${cat.name} in ${city.name} range from ${formatAed(procs.reduce((m, p) => Math.min(m, p.cityPricing[citySlug].min), Infinity))} to ${formatAed(procs.reduce((m, p) => Math.max(m, p.cityPricing[citySlug].max), 0))}. The average typical cost across ${procs.length} procedures is ${formatAed(avgTypical)}. ${categoryProviders.length} providers offer these services in ${city.name}.`,
    },
    {
      question: `Which ${cat.name.toLowerCase().replace(/ costs?$/, "")} procedure is cheapest in ${city.name}?`,
      answer: `The most affordable ${cat.name.toLowerCase().replace(/ costs?$/, "")} procedure in ${city.name} is ${sortedProcs[0].name} at a typical cost of ${formatAed(sortedProcs[0].cityPricing[citySlug].typical)}. The most expensive is ${sortedProcs[sortedProcs.length - 1].name} at ${formatAed(sortedProcs[sortedProcs.length - 1].cityPricing[citySlug].typical)}.`,
    },
    {
      question: `Does insurance cover ${cat.name.toLowerCase()} in ${city.name}?`,
      answer: `Of the ${procs.length} ${cat.name.toLowerCase()} procedures, ${coveredCount} are typically covered by insurance, ${procs.filter((p) => p.insuranceCoverage === "partially-covered").length} are partially covered, and ${procs.filter((p) => p.insuranceCoverage === "not-covered").length} are not covered (cosmetic). Healthcare in ${city.name} is regulated by the ${regulator}.`,
    },
    {
      question: `How many providers offer ${cat.name.toLowerCase()} in ${city.name}?`,
      answer: `There are ${categoryProviders.length} ${cat.name.toLowerCase().replace(/ costs?$/, "")} providers in ${city.name} listed in the UAE Open Healthcare Directory. Browse listings to compare by rating, insurance acceptance, and services.`,
    },
  ];

  return (
    <div className="container-tc py-8">
      <JsonLd
        data={breadcrumbSchema([
          { name: "UAE", url: base },
          { name: "Medical Procedure Costs", url: `${base}/pricing` },
          { name: cat.name, url: `${base}/pricing/category/${catSlug}` },
          { name: city.name },
        ])}
      />
      <JsonLd data={faqPageSchema(faqs)} />
      <JsonLd data={speakableSchema([".answer-block"])} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Service",
          name: `${cat.name} in ${city.name}`,
          description: `Compare ${procs.length} ${cat.name.toLowerCase()} prices in ${city.name}, UAE`,
          url: `${base}/pricing/category/${catSlug}/${citySlug}`,
          areaServed: { "@type": "City", name: city.name },
          provider: {
            "@type": "MedicalOrganization",
            name: `${city.name} Healthcare Providers`,
          },
          offers: {
            "@type": "AggregateOffer",
            priceCurrency: "AED",
            lowPrice: procs.reduce((m, p) => Math.min(m, p.cityPricing[citySlug].min), Infinity),
            highPrice: procs.reduce((m, p) => Math.max(m, p.cityPricing[citySlug].max), 0),
            offerCount: procs.length,
          },
        }}
      />

      <Breadcrumb
        items={[
          { label: "UAE", href: "/" },
          { label: "Procedure Costs", href: "/pricing" },
          { label: cat.name, href: `/pricing/category/${catSlug}` },
          { label: city.name },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <h1 className="text-2xl sm:text-3xl font-bold text-dark mb-2">
          {cat.name} Costs in {city.name}
        </h1>
        <p className="text-xs text-muted mb-1">{city.nameAr} · Regulated by {regulator}</p>

        <div className="answer-block mt-4 bg-light-50 border border-light-200 p-4" data-answer-block="true">
          <p className="text-sm text-muted leading-relaxed">
            There are {procs.length} {cat.name.toLowerCase()} procedures priced in {city.name}, UAE,
            with costs ranging from {formatAed(procs.reduce((m, p) => Math.min(m, p.cityPricing[citySlug].min), Infinity))} to{" "}
            {formatAed(procs.reduce((m, p) => Math.max(m, p.cityPricing[citySlug].max), 0))}. The
            average typical cost is {formatAed(avgTypical)}. {categoryProviders.length} providers
            offer these services in {city.name}. {coveredCount} of {procs.length} procedures are
            typically covered by UAE health insurance.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        <div className="bg-light-50 p-4 text-center">
          <p className="text-xl font-bold text-accent">{procs.length}</p>
          <p className="text-xs text-muted">Procedures</p>
        </div>
        <div className="bg-light-50 p-4 text-center">
          <p className="text-xl font-bold text-accent">{formatAed(avgTypical)}</p>
          <p className="text-xs text-muted">Avg. typical</p>
        </div>
        <div className="bg-light-50 p-4 text-center">
          <p className="text-xl font-bold text-accent">{categoryProviders.length}</p>
          <p className="text-xs text-muted">Providers</p>
        </div>
        <div className="bg-light-50 p-4 text-center">
          <p className="text-xl font-bold text-accent">
            {coveredCount}/{procs.length}
          </p>
          <p className="text-xs text-muted">Insured</p>
        </div>
      </div>

      {/* Procedure pricing table */}
      <div className="section-header">
        <h2>All {cat.name} in {city.name}</h2>
        <span className="arrows">&gt;&gt;&gt;</span>
      </div>
      <div className="border border-light-200 divide-y divide-light-200 mb-10">
        <div className="hidden sm:grid grid-cols-5 gap-4 p-3 bg-light-50 text-[11px] font-bold text-muted uppercase tracking-wider">
          <div className="col-span-2">Procedure</div>
          <div className="text-right">Typical</div>
          <div className="text-right">Range</div>
          <div className="text-right">Insurance</div>
        </div>
        {sortedProcs.map((proc) => {
          const pricing = proc.cityPricing[citySlug];
          const coverageColor =
            proc.insuranceCoverage === "typically-covered" ? "text-green-700 bg-green-50"
            : proc.insuranceCoverage === "partially-covered" ? "text-yellow-700 bg-yellow-50"
            : proc.insuranceCoverage === "rarely-covered" ? "text-orange-700 bg-orange-50"
            : "text-red-700 bg-red-50";
          const coverageLabel =
            proc.insuranceCoverage === "typically-covered" ? "Covered"
            : proc.insuranceCoverage === "partially-covered" ? "Partial"
            : proc.insuranceCoverage === "rarely-covered" ? "Rare"
            : "Not covered";

          return (
            <Link
              key={proc.slug}
              href={`/pricing/${proc.slug}/${citySlug}`}
              className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-4 p-3 hover:bg-light-50 transition-colors group items-center"
            >
              <div className="col-span-2 sm:col-span-2">
                <h3 className="text-sm font-bold text-dark group-hover:text-accent">
                  {proc.name}
                </h3>
                <p className="text-[11px] text-muted">{proc.duration} · {proc.setting}</p>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-dark">{formatAed(pricing.typical)}</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-muted">
                  {formatAed(pricing.min)}–{formatAed(pricing.max)}
                </span>
              </div>
              <div className="text-right">
                <span className={`text-[10px] font-medium px-2 py-0.5 ${coverageColor}`}>
                  {coverageLabel}
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Compare with other cities */}
      <div className="section-header">
        <h2>{cat.name} in Other Cities</h2>
        <span className="arrows">&gt;&gt;&gt;</span>
      </div>
      <div className="border border-light-200 divide-y divide-light-200 mb-10">
        <div className="grid grid-cols-3 gap-4 p-3 bg-accent/5 border-l-2 border-accent">
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-accent" />
            <span className="text-sm font-bold text-accent">{city.name}</span>
          </div>
          <div className="text-right">
            <span className="text-sm font-bold text-dark">{formatAed(avgTypical)}</span>
          </div>
          <div className="text-right text-xs text-muted">Current</div>
        </div>
        {otherCities.map((c) => {
          const diff = c.avg - avgTypical;
          const pctDiff = avgTypical > 0 ? Math.round((diff / avgTypical) * 100) : 0;
          return (
            <Link
              key={c.slug}
              href={`/pricing/category/${catSlug}/${c.slug}`}
              className="grid grid-cols-3 gap-4 p-3 hover:bg-light-50 transition-colors group"
            >
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-muted" />
                <span className="text-sm text-dark group-hover:text-accent">{c.name}</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-dark">{formatAed(c.avg)}</span>
              </div>
              <div className="text-right">
                <span className={`text-xs font-medium ${diff < 0 ? "text-green-700" : diff > 0 ? "text-red-700" : "text-muted"}`}>
                  {diff < 0 ? `${pctDiff}%` : diff > 0 ? `+${pctDiff}%` : "Same"}
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Cost Estimator for category average */}
      <div className="section-header">
        <h2>Estimate Your Cost</h2>
        <span className="arrows">&gt;&gt;&gt;</span>
      </div>
      <p className="text-xs text-muted mb-4">
        Estimate based on the average {cat.name.toLowerCase()} cost in {city.name} ({formatAed(avgTypical)}).
        For procedure-specific estimates, visit individual procedure pages.
      </p>
      <div className="mb-10">
        <CostEstimator
          procedureName={`${cat.name} (average)`}
          typicalCost={avgTypical}
          insuranceCoverage={dominantCoverage}
          setting="outpatient"
          plans={estimatorPlans}
        />
      </div>

      {/* FAQ */}
      <FaqSection faqs={faqs} title={`${cat.name} in ${city.name} — FAQ`} />

      {/* Disclaimer */}
      <div className="mt-8 border-t border-light-200 pt-4">
        <p className="text-[11px] text-muted leading-relaxed">
          <strong>Disclaimer:</strong> Prices for {cat.name.toLowerCase()} in {city.name} are
          indicative ranges based on DOH/DHA tariff data and market-observed prices as of
          March 2026. Healthcare in {city.name} is regulated by the {regulator}. Always confirm
          quotes directly with providers.
        </p>
      </div>
    </div>
  );
}
