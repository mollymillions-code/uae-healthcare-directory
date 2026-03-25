import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Clock, Activity, Shield, MapPin } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { FaqSection } from "@/components/seo/FaqSection";
import { CostEstimator } from "@/components/pricing/CostEstimator";
import {
  getProcedureBySlug,
  getProcedureWithStats,
  getProcedureCityPricing,
  generateProcedureAnswerBlock,
  generateProcedureFaqs,
  procedureSchema,
  formatAed,
  PROCEDURES,
} from "@/lib/pricing";
import { INSURER_PROFILES } from "@/lib/constants/insurance-plans";
import { breadcrumbSchema, speakableSchema, faqPageSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

export const revalidate = 43200;

export function generateStaticParams() {
  return PROCEDURES.map((p) => ({ procedure: p.slug }));
}

interface Props {
  params: Promise<{ procedure: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { procedure: slug } = await params;
  const proc = getProcedureBySlug(slug);
  if (!proc) return {};

  const base = getBaseUrl();
  const avgTypical = Math.round(
    Object.values(proc.cityPricing).reduce((sum, p) => sum + p.typical, 0) /
      Object.keys(proc.cityPricing).length
  );

  return {
    title: `${proc.name} Cost in UAE — ${formatAed(proc.priceRange.min)} to ${formatAed(proc.priceRange.max)} | Compare Prices by City`,
    description: `How much does a ${proc.name.toLowerCase()} cost in the UAE? Typical price: ${formatAed(avgTypical)}. Compare prices across Dubai, Abu Dhabi, Sharjah, and all emirates. Insurance coverage: ${proc.insuranceCoverage.replace(/-/g, " ")}. Based on DOH Mandatory Tariff data.`,
    alternates: { canonical: `${base}/pricing/${slug}` },
    openGraph: {
      title: `${proc.name} Cost in UAE — ${formatAed(proc.priceRange.min)} to ${formatAed(proc.priceRange.max)}`,
      description: `Compare ${proc.name.toLowerCase()} prices across 8 UAE cities. Typical: ${formatAed(avgTypical)}. Estimate your out-of-pocket with insurance calculator.`,
      url: `${base}/pricing/${slug}`,
      type: "website",
    },
  };
}

export default async function ProcedureDetailPage({ params }: Props) {
  const { procedure: slug } = await params;
  const proc = getProcedureWithStats(slug);
  if (!proc) notFound();

  const base = getBaseUrl();
  const cityPricing = getProcedureCityPricing(slug);
  const faqs = generateProcedureFaqs(proc);
  const answerBlock = generateProcedureAnswerBlock(proc);

  // Related procedures
  const related = proc.relatedProcedures
    .map((s) => getProcedureBySlug(s))
    .filter(Boolean);

  // Plans for cost estimator — flatten to what the client needs
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

  const coverageColor =
    proc.insuranceCoverage === "typically-covered"
      ? "text-green-700 bg-green-50 border-green-200"
      : proc.insuranceCoverage === "partially-covered"
      ? "text-yellow-700 bg-yellow-50 border-yellow-200"
      : proc.insuranceCoverage === "rarely-covered"
      ? "text-orange-700 bg-orange-50 border-orange-200"
      : "text-red-700 bg-red-50 border-red-200";

  const coverageLabel =
    proc.insuranceCoverage === "typically-covered"
      ? "Typically Covered"
      : proc.insuranceCoverage === "partially-covered"
      ? "Partially Covered"
      : proc.insuranceCoverage === "rarely-covered"
      ? "Rarely Covered"
      : "Not Covered by Insurance";

  return (
    <div className="container-tc py-8">
      {/* Schema.org */}
      <JsonLd data={procedureSchema(proc)} />
      <JsonLd
        data={breadcrumbSchema([
          { name: "UAE", url: base },
          { name: "Medical Procedure Costs", url: `${base}/pricing` },
          { name: proc.name },
        ])}
      />
      <JsonLd data={faqPageSchema(faqs)} />
      <JsonLd data={speakableSchema([".answer-block"])} />

      <Breadcrumb
        items={[
          { label: "UAE", href: "/" },
          { label: "Procedure Costs", href: "/pricing" },
          { label: proc.name },
        ]}
      />

      {/* Hero */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-dark mb-2">
          {proc.name} Cost in the UAE
        </h1>
        <p className="text-sm text-muted mb-1">
          {proc.nameAr} · CPT {proc.cptCode}
        </p>

        {/* Answer block — AEO optimised */}
        <div className="answer-block mt-4 bg-light-50 border border-light-200 p-4" data-answer-block="true">
          <p className="text-sm text-muted leading-relaxed">{answerBlock}</p>
        </div>
      </div>

      {/* Price headline + key facts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        {/* Price card */}
        <div className="lg:col-span-2 border border-light-200 p-6">
          <div className="flex items-baseline gap-2 mb-1">
            <p className="text-3xl font-bold text-dark">
              {formatAed(proc.priceRange.min)} – {formatAed(proc.priceRange.max)}
            </p>
          </div>
          <p className="text-xs text-muted mb-6">
            Price range across all UAE facilities · Typical: {formatAed(proc.averageTypical)}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-light-50 p-3 text-center">
              <p className="text-[11px] text-muted mb-1">Cheapest City</p>
              <p className="text-sm font-bold text-green-700">
                {proc.cheapestCity.name}
              </p>
              <p className="text-xs text-muted">
                ~{formatAed(proc.cheapestCity.typical)}
              </p>
            </div>
            <div className="bg-light-50 p-3 text-center">
              <p className="text-[11px] text-muted mb-1">Most Expensive</p>
              <p className="text-sm font-bold text-red-700">
                {proc.mostExpensiveCity.name}
              </p>
              <p className="text-xs text-muted">
                ~{formatAed(proc.mostExpensiveCity.typical)}
              </p>
            </div>
            <div className="bg-light-50 p-3 text-center">
              <p className="text-[11px] text-muted mb-1">Duration</p>
              <p className="text-sm font-bold text-dark">{proc.duration}</p>
            </div>
            <div className="bg-light-50 p-3 text-center">
              <p className="text-[11px] text-muted mb-1">Recovery</p>
              <p className="text-sm font-bold text-dark">{proc.recoveryTime}</p>
            </div>
          </div>
        </div>

        {/* Quick facts sidebar */}
        <div className="space-y-4">
          <div className={`border p-4 ${coverageColor}`}>
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-4 h-4" />
              <p className="text-sm font-bold">{coverageLabel}</p>
            </div>
            <p className="text-xs">{proc.insuranceNotes.slice(0, 150)}...</p>
          </div>

          <div className="border border-light-200 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted" />
              <p className="text-xs text-muted">
                <strong className="text-dark">Setting:</strong>{" "}
                {proc.setting === "inpatient"
                  ? "Hospital admission required"
                  : proc.setting === "outpatient"
                  ? "No hospital stay needed"
                  : proc.setting === "day-case"
                  ? "Day-case (home same day)"
                  : "Inpatient or day-case"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-muted" />
              <p className="text-xs text-muted">
                <strong className="text-dark">Anaesthesia:</strong>{" "}
                {proc.anaesthesia === "none"
                  ? "None required"
                  : proc.anaesthesia.charAt(0).toUpperCase() + proc.anaesthesia.slice(1)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* City-by-City Pricing Table */}
      <div className="section-header">
        <h2>Price by City</h2>
        <span className="arrows">&gt;&gt;&gt;</span>
      </div>
      <div className="border border-light-200 divide-y divide-light-200 mb-10">
        {/* Header */}
        <div className="hidden sm:grid grid-cols-5 gap-4 p-3 bg-light-50 text-[11px] font-bold text-muted uppercase tracking-wider">
          <div>City</div>
          <div className="text-right">Low</div>
          <div className="text-right">Typical</div>
          <div className="text-right">High</div>
          <div className="text-right">Providers</div>
        </div>
        {cityPricing
          .sort((a, b) => a.pricing.typical - b.pricing.typical)
          .map((city) => (
            <Link
              key={city.citySlug}
              href={`/pricing/${slug}/${city.citySlug}`}
              className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-4 p-3 hover:bg-light-50 transition-colors group items-center"
            >
              <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
                <MapPin className="w-3.5 h-3.5 text-muted" />
                <span className="text-sm font-bold text-dark group-hover:text-accent">
                  {city.cityName}
                </span>
              </div>
              <div className="text-right">
                <span className="sm:hidden text-[10px] text-muted mr-1">Low:</span>
                <span className="text-sm text-muted">{formatAed(city.pricing.min)}</span>
              </div>
              <div className="text-right">
                <span className="sm:hidden text-[10px] text-muted mr-1">Typical:</span>
                <span className="text-sm font-bold text-dark">
                  {formatAed(city.pricing.typical)}
                </span>
              </div>
              <div className="text-right">
                <span className="sm:hidden text-[10px] text-muted mr-1">High:</span>
                <span className="text-sm text-muted">{formatAed(city.pricing.max)}</span>
              </div>
              <div className="text-right flex items-center justify-end gap-1">
                <span className="text-xs text-muted">
                  {city.providerCount} provider{city.providerCount !== 1 ? "s" : ""}
                </span>
                <ArrowRight className="w-3 h-3 text-muted group-hover:text-accent" />
              </div>
            </Link>
          ))}
      </div>

      {/* About the Procedure */}
      <div className="section-header">
        <h2>About {proc.name}</h2>
        <span className="arrows">&gt;&gt;&gt;</span>
      </div>
      <div className="mb-10 space-y-4">
        <div className="prose-sm text-muted leading-relaxed">
          <p>{proc.description}</p>
        </div>
        <div className="bg-light-50 border border-light-200 p-4">
          <h3 className="text-sm font-bold text-dark mb-2">What to Expect</h3>
          <p className="text-sm text-muted leading-relaxed">{proc.whatToExpect}</p>
        </div>
      </div>

      {/* Insurance Cost Estimator */}
      <div className="section-header">
        <h2>Insurance Cost Estimator</h2>
        <span className="arrows">&gt;&gt;&gt;</span>
      </div>
      <div className="mb-10">
        <CostEstimator
          procedureName={proc.name}
          typicalCost={proc.averageTypical}
          insuranceCoverage={proc.insuranceCoverage}

          setting={proc.setting}
          plans={estimatorPlans}
        />
      </div>

      {/* Related Procedures */}
      {related.length > 0 && (
        <>
          <div className="section-header">
            <h2>Related Procedures</h2>
            <span className="arrows">&gt;&gt;&gt;</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-10">
            {related.map((rel) => (
              <Link
                key={rel!.slug}
                href={`/pricing/${rel!.slug}`}
                className="border border-light-200 p-3 hover:border-accent transition-colors group"
              >
                <h3 className="text-sm font-bold text-dark group-hover:text-accent mb-1">
                  {rel!.name}
                </h3>
                <p className="text-xs text-muted">
                  {formatAed(rel!.priceRange.min)} – {formatAed(rel!.priceRange.max)}
                </p>
              </Link>
            ))}
          </div>
        </>
      )}

      {/* FAQ */}
      <FaqSection
        faqs={faqs}
        title={`${proc.name} in the UAE — Frequently Asked Questions`}
      />

      {/* Disclaimer */}
      <div className="mt-8 border-t border-light-200 pt-4">
        <p className="text-[11px] text-muted leading-relaxed">
          <strong>Disclaimer:</strong> Prices shown are indicative ranges based on the DOH
          Mandatory Tariff (Shafafiya) methodology, DHA DRG parameters, and market-observed
          data as of March 2026. Actual costs vary by facility, doctor, clinical complexity,
          and insurance plan. Always obtain a personalised quote from the healthcare provider.
          This page does not constitute medical or financial advice.
        </p>
      </div>
    </div>
  );
}
