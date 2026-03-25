import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, ArrowRight, Phone } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { FaqSection } from "@/components/seo/FaqSection";
import { CostEstimator } from "@/components/pricing/CostEstimator";
import {
  getProcedureBySlug,
  generateCityProcedureAnswerBlock,
  generateCityProcedureFaqs,
  procedureSchema,
  procedureCityOffersSchema,
  formatAed,
  PROCEDURES,
} from "@/lib/pricing";
import { INSURER_PROFILES } from "@/lib/constants/insurance-plans";
import { CITIES } from "@/lib/constants/cities";
import { getProviders } from "@/lib/data";
import {
  breadcrumbSchema,
  speakableSchema,
  faqPageSchema,
} from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

export const revalidate = 43200;

export function generateStaticParams() {
  const params: { procedure: string; city: string }[] = [];
  for (const proc of PROCEDURES) {
    for (const citySlug of Object.keys(proc.cityPricing)) {
      params.push({ procedure: proc.slug, city: citySlug });
    }
  }
  return params;
}

interface Props {
  params: Promise<{ procedure: string; city: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { procedure: procSlug, city: citySlug } = await params;
  const proc = getProcedureBySlug(procSlug);
  const city = CITIES.find((c) => c.slug === citySlug);
  if (!proc || !city) return {};

  const pricing = proc.cityPricing[citySlug];
  if (!pricing) return {};

  const base = getBaseUrl();

  return {
    title: `${proc.name} Cost in ${city.name} — ${formatAed(pricing.min)} to ${formatAed(pricing.max)} | UAE Medical Pricing`,
    description: `How much does a ${proc.name.toLowerCase()} cost in ${city.name}? Typical price: ${formatAed(pricing.typical)}. Range: ${formatAed(pricing.min)}–${formatAed(pricing.max)}. Find providers, compare prices, and estimate your out-of-pocket cost with insurance.`,
    alternates: { canonical: `${base}/pricing/${procSlug}/${citySlug}` },
    openGraph: {
      title: `${proc.name} Cost in ${city.name} — ${formatAed(pricing.typical)} Typical`,
      description: `Compare ${proc.name.toLowerCase()} prices in ${city.name}. Range: ${formatAed(pricing.min)}–${formatAed(pricing.max)}. Estimate out-of-pocket with insurance calculator.`,
      url: `${base}/pricing/${procSlug}/${citySlug}`,
      type: "website",
    },
  };
}

export default async function CityProcedurePricingPage({ params }: Props) {
  const { procedure: procSlug, city: citySlug } = await params;
  const proc = getProcedureBySlug(procSlug);
  const city = CITIES.find((c) => c.slug === citySlug);
  if (!proc || !city) notFound();

  const pricing = proc.cityPricing[citySlug];
  if (!pricing) notFound();

  const base = getBaseUrl();

  // Providers in this city + category
  const allCityProviders = (await getProviders({ citySlug })).providers;
  const categoryProviders = allCityProviders.filter(
    (p) => p.categorySlug === proc.categorySlug
  );
  const providerCount = categoryProviders.length;

  // Top-rated providers (up to 10)
  const topProviders = [...categoryProviders]
    .filter((p) => p.googleRating && Number(p.googleRating) > 0)
    .sort((a, b) => Number(b.googleRating) - Number(a.googleRating))
    .slice(0, 10);

  // SEO content
  const answerBlock = generateCityProcedureAnswerBlock(
    proc,
    citySlug,
    city.name,
    providerCount
  );
  const faqs = generateCityProcedureFaqs(proc, citySlug, city.name, providerCount);
  const offersSchema = procedureCityOffersSchema(proc, citySlug, city.name);

  // Other cities for comparison
  const otherCities = Object.entries(proc.cityPricing)
    .filter(([slug]) => slug !== citySlug)
    .map(([slug, p]) => ({
      slug,
      name: CITIES.find((c) => c.slug === slug)?.name || slug,
      typical: p.typical,
    }))
    .sort((a, b) => a.typical - b.typical);

  // Related procedures
  const related = proc.relatedProcedures
    .map((s) => getProcedureBySlug(s))
    .filter(Boolean);

  // Plans for cost estimator
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

  const regulator =
    citySlug === "dubai"
      ? "Dubai Health Authority (DHA)"
      : citySlug === "abu-dhabi" || citySlug === "al-ain"
      ? "Department of Health Abu Dhabi (DOH)"
      : "Ministry of Health and Prevention (MOHAP)";

  return (
    <div className="container-tc py-8">
      {/* Schema.org */}
      <JsonLd data={procedureSchema(proc)} />
      {offersSchema && <JsonLd data={offersSchema} />}
      <JsonLd
        data={breadcrumbSchema([
          { name: "UAE", url: base },
          { name: "Medical Procedure Costs", url: `${base}/pricing` },
          { name: proc.name, url: `${base}/pricing/${proc.slug}` },
          { name: city.name },
        ])}
      />
      <JsonLd data={faqPageSchema(faqs)} />
      <JsonLd data={speakableSchema([".answer-block"])} />

      <Breadcrumb
        items={[
          { label: "UAE", href: "/" },
          { label: "Procedure Costs", href: "/pricing" },
          { label: proc.name, href: `/pricing/${proc.slug}` },
          { label: city.name },
        ]}
      />

      {/* Hero */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-dark mb-2">
          {proc.name} Cost in {city.name}
        </h1>
        <p className="text-sm text-muted mb-1">
          {proc.nameAr} · {city.nameAr} · CPT {proc.cptCode}
        </p>
        <p className="text-xs text-muted">
          Regulated by the {regulator}
        </p>

        {/* Answer block — AEO */}
        <div
          className="answer-block mt-4 bg-light-50 border border-light-200 p-4"
          data-answer-block="true"
        >
          <p className="text-sm text-muted leading-relaxed">{answerBlock}</p>
        </div>
      </div>

      {/* Price card */}
      <div className="border border-light-200 p-6 mb-10">
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <p className="text-[11px] text-muted mb-1">Low</p>
            <p className="text-xl font-bold text-green-700">
              {formatAed(pricing.min)}
            </p>
            <p className="text-[10px] text-muted">Government / basic</p>
          </div>
          <div className="text-center border-x border-light-200">
            <p className="text-[11px] text-muted mb-1">Typical</p>
            <p className="text-2xl font-bold text-dark">
              {formatAed(pricing.typical)}
            </p>
            <p className="text-[10px] text-muted">Average private</p>
          </div>
          <div className="text-center">
            <p className="text-[11px] text-muted mb-1">High</p>
            <p className="text-xl font-bold text-red-700">
              {formatAed(pricing.max)}
            </p>
            <p className="text-[10px] text-muted">Premium facility</p>
          </div>
        </div>

        {/* Price bar visualisation */}
        <div className="h-4 bg-gradient-to-r from-green-200 via-yellow-100 to-red-200 relative mb-2">
          <div
            className="absolute top-0 h-full w-0.5 bg-dark"
            style={{
              left: `${(((pricing.typical - pricing.min) / (pricing.max - pricing.min)) * 100).toFixed(0)}%`,
            }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-muted">
          <span>{formatAed(pricing.min)}</span>
          <span>Typical: {formatAed(pricing.typical)}</span>
          <span>{formatAed(pricing.max)}</span>
        </div>
      </div>

      {/* Compare with Other Cities */}
      {otherCities.length > 0 && (
        <>
          <div className="section-header">
            <h2>Compare with Other Cities</h2>
            <span className="arrows">&gt;&gt;&gt;</span>
          </div>
          <div className="border border-light-200 divide-y divide-light-200 mb-10">
            {/* Current city highlighted */}
            <div className="grid grid-cols-3 gap-4 p-3 bg-accent/5 border-l-2 border-accent">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-accent" />
                <span className="text-sm font-bold text-accent">{city.name}</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-dark">
                  {formatAed(pricing.typical)}
                </span>
              </div>
              <div className="text-right text-xs text-muted">Current</div>
            </div>
            {otherCities.map((other) => {
              const diff = other.typical - pricing.typical;
              const pctDiff = Math.round((diff / pricing.typical) * 100);
              return (
                <Link
                  key={other.slug}
                  href={`/pricing/${proc.slug}/${other.slug}`}
                  className="grid grid-cols-3 gap-4 p-3 hover:bg-light-50 transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-muted" />
                    <span className="text-sm text-dark group-hover:text-accent">
                      {other.name}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-dark">
                      {formatAed(other.typical)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-xs font-medium ${
                        diff < 0 ? "text-green-700" : diff > 0 ? "text-red-700" : "text-muted"
                      }`}
                    >
                      {diff < 0 ? `${pctDiff}%` : diff > 0 ? `+${pctDiff}%` : "Same"}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}

      {/* Insurance Cost Estimator */}
      <div className="section-header">
        <h2>Estimate Your Out-of-Pocket Cost</h2>
        <span className="arrows">&gt;&gt;&gt;</span>
      </div>
      <div className="mb-10">
        <CostEstimator
          procedureName={proc.name}
          typicalCost={pricing.typical}
          insuranceCoverage={proc.insuranceCoverage}

          setting={proc.setting}
          plans={estimatorPlans}
        />
      </div>

      {/* Providers in this city */}
      {topProviders.length > 0 && (
        <>
          <div className="section-header">
            <h2>
              {proc.categorySlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}{" "}
              Providers in {city.name}
            </h2>
            <span className="arrows">&gt;&gt;&gt;</span>
          </div>
          <p className="text-xs text-muted mb-4">
            {providerCount} {proc.categorySlug.replace(/-/g, " ")} providers in {city.name}.
            Contact providers directly for accurate procedure quotes.
          </p>
          <div className="border border-light-200 divide-y divide-light-200 mb-10">
            {topProviders.map((provider) => (
              <Link
                key={provider.slug}
                href={`/directory/${citySlug}/${proc.categorySlug}/${provider.slug}`}
                className="flex items-center justify-between p-3 hover:bg-light-50 transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-dark group-hover:text-accent truncate">
                    {provider.name}
                  </h3>
                  <p className="text-[11px] text-muted truncate">{provider.address}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                  {provider.googleRating && Number(provider.googleRating) > 0 && (
                    <span className="text-xs font-bold text-dark bg-green-50 px-2 py-0.5">
                      {Number(provider.googleRating).toFixed(1)} ★
                    </span>
                  )}
                  {provider.phone && (
                    <span className="hidden sm:flex items-center gap-1 text-xs text-muted">
                      <Phone className="w-3 h-3" />
                      {provider.phone}
                    </span>
                  )}
                  <ArrowRight className="w-3.5 h-3.5 text-muted group-hover:text-accent" />
                </div>
              </Link>
            ))}
          </div>
          {providerCount > 10 && (
            <div className="text-center mb-10">
              <Link
                href={`/directory/${citySlug}/${proc.categorySlug}`}
                className="text-sm font-bold text-accent hover:underline"
              >
                View all {providerCount} {proc.categorySlug.replace(/-/g, " ")} providers in{" "}
                {city.name} →
              </Link>
            </div>
          )}
        </>
      )}

      {/* About the Procedure */}
      <div className="section-header">
        <h2>About {proc.name}</h2>
        <span className="arrows">&gt;&gt;&gt;</span>
      </div>
      <div className="mb-10 space-y-4">
        <p className="text-sm text-muted leading-relaxed">{proc.description}</p>
        <div className="bg-light-50 border border-light-200 p-4">
          <h3 className="text-sm font-bold text-dark mb-2">What to Expect</h3>
          <p className="text-sm text-muted leading-relaxed">{proc.whatToExpect}</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="border border-light-200 p-3 text-center">
            <p className="text-[11px] text-muted">Duration</p>
            <p className="text-xs font-bold text-dark">{proc.duration}</p>
          </div>
          <div className="border border-light-200 p-3 text-center">
            <p className="text-[11px] text-muted">Recovery</p>
            <p className="text-xs font-bold text-dark">{proc.recoveryTime}</p>
          </div>
          <div className="border border-light-200 p-3 text-center">
            <p className="text-[11px] text-muted">Setting</p>
            <p className="text-xs font-bold text-dark capitalize">{proc.setting}</p>
          </div>
          <div className="border border-light-200 p-3 text-center">
            <p className="text-[11px] text-muted">Anaesthesia</p>
            <p className="text-xs font-bold text-dark capitalize">{proc.anaesthesia}</p>
          </div>
        </div>
      </div>

      {/* Related Procedures */}
      {related.length > 0 && (
        <>
          <div className="section-header">
            <h2>Related Procedures in {city.name}</h2>
            <span className="arrows">&gt;&gt;&gt;</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-10">
            {related.map((rel) => {
              const relPricing = rel!.cityPricing[citySlug];
              return (
                <Link
                  key={rel!.slug}
                  href={`/pricing/${rel!.slug}/${citySlug}`}
                  className="border border-light-200 p-3 hover:border-accent transition-colors group"
                >
                  <h3 className="text-sm font-bold text-dark group-hover:text-accent mb-1">
                    {rel!.name}
                  </h3>
                  <p className="text-xs text-muted">
                    {relPricing
                      ? `${formatAed(relPricing.min)} – ${formatAed(relPricing.max)} in ${city.name}`
                      : `${formatAed(rel!.priceRange.min)} – ${formatAed(rel!.priceRange.max)}`}
                  </p>
                </Link>
              );
            })}
          </div>
        </>
      )}

      {/* FAQ */}
      <FaqSection
        faqs={faqs}
        title={`${proc.name} in ${city.name} — Frequently Asked Questions`}
      />

      {/* Disclaimer */}
      <div className="mt-8 border-t border-light-200 pt-4">
        <p className="text-[11px] text-muted leading-relaxed">
          <strong>Disclaimer:</strong> Prices shown are indicative ranges for {city.name},
          UAE, based on the DOH Mandatory Tariff (Shafafiya) methodology, DHA DRG
          parameters, and market-observed data as of March 2026. Actual costs depend on the
          specific facility, doctor, clinical complexity, and insurance plan. Contact
          providers directly for accurate quotes. Healthcare in {city.name} is regulated by
          the {regulator}. This page does not constitute medical or financial advice.
        </p>
      </div>
    </div>
  );
}
