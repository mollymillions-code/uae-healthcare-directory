import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Clock, Shield, DollarSign } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { FaqSection } from "@/components/seo/FaqSection";
import { getCityBySlug, getCities } from "@/lib/data";
import {
  PROCEDURES,
  PROCEDURE_CATEGORIES,
  formatAed,
} from "@/lib/constants/procedures";
import { breadcrumbSchema, speakableSchema, faqPageSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

export const revalidate = 43200;

interface Props {
  params: { city: string };
}

export function generateStaticParams() {
  return getCities().map((c) => ({ city: c.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const city = getCityBySlug(params.city);
  if (!city) return {};
  const base = getBaseUrl();

  const procsInCity = PROCEDURES.filter((p) => p.cityPricing[city.slug]);
  const cheapest = procsInCity.reduce(
    (min, p) => Math.min(min, p.cityPricing[city.slug]?.min ?? Infinity),
    Infinity
  );
  const mostExpensive = procsInCity.reduce(
    (max, p) => Math.max(max, p.cityPricing[city.slug]?.max ?? 0),
    0
  );

  return {
    title: `Medical Procedure Costs in ${city.name} — ${formatAed(cheapest)} to ${formatAed(mostExpensive)} | UAE Open Healthcare Directory`,
    description: `Compare costs for ${procsInCity.length}+ medical procedures in ${city.name}, UAE. From blood tests (${formatAed(cheapest)}) to major surgeries (${formatAed(mostExpensive)}). Verified pricing, insurance coverage info, and provider links. Last updated March 2026.`,
    alternates: {
      canonical: `${base}/directory/${city.slug}/procedures`,
    },
    openGraph: {
      title: `Medical Procedure Costs in ${city.name} — Compare ${procsInCity.length}+ Procedures`,
      description: `How much do medical procedures cost in ${city.name}? Compare pricing for dental implants, LASIK, IVF, MRI scans, and more.`,
      url: `${base}/directory/${city.slug}/procedures`,
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

export default function ProcedureIndexPage({ params }: Props) {
  const city = getCityBySlug(params.city);
  if (!city) notFound();

  const base = getBaseUrl();
  const regulator = getRegulatorName(city.slug);

  // All procedures available in this city
  const procsInCity = PROCEDURES.filter((p) => p.cityPricing[city.slug]).sort(
    (a, b) => a.sortOrder - b.sortOrder
  );

  // Group by procedure category
  const procsByCategory = PROCEDURE_CATEGORIES.map((cat) => {
    const procs = procsInCity.filter((p) => {
      const catMap: Record<string, string[]> = {
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
      const slugs = catMap[cat.slug] || [];
      return slugs.includes(p.categorySlug);
    });
    return { ...cat, procedures: procs };
  }).filter((cat) => cat.procedures.length > 0);

  const faqs = [
    {
      question: `How much do medical procedures cost in ${city.name}?`,
      answer: `Medical procedure costs in ${city.name} range from ${formatAed(50)} for basic blood tests to ${formatAed(80000)}+ for major surgeries like knee replacements. Pricing depends on the facility type (government, private, or premium), the doctor's experience, and whether you use insurance. Government hospitals generally charge 30-50% less than private facilities. Use our procedure cost pages to compare specific prices.`,
    },
    {
      question: `Does health insurance cover medical procedures in ${city.name}?`,
      answer: `Most medically necessary procedures in ${city.name} are covered by UAE health insurance plans, including consultations, diagnostic tests, and inpatient surgeries. Cosmetic and elective procedures like rhinoplasty, Botox, and teeth whitening are generally not covered. Co-pays of 10-20% apply on most outpatient procedures. Check individual procedure pages for specific insurance coverage details.`,
    },
    {
      question: `Which city in the UAE has the cheapest medical procedures?`,
      answer: `Northern emirates like Sharjah, Ajman, and Ras Al Khaimah generally offer lower procedure prices than Dubai and Abu Dhabi. For example, an MRI scan that costs AED 2,500 in Dubai may cost AED 1,800 in Sharjah. Government facilities across all emirates offer the most competitive pricing. Dubai is typically the most expensive emirate for medical procedures.`,
    },
    {
      question: `Who regulates healthcare pricing in ${city.name}?`,
      answer: `Healthcare in ${city.name} is regulated by the ${regulator}. In Abu Dhabi, the DOH Mandatory Tariff (Shafafiya) sets base prices using Relative Value Units (RVUs), and facilities can charge 1x to 3x the base rate. Dubai uses DRG-based pricing for inpatient care. All pricing data in the UAE Open Healthcare Directory reflects market-observed ranges as of March 2026.`,
    },
    {
      question: `How can I find the cheapest provider for a procedure in ${city.name}?`,
      answer: `To find affordable healthcare in ${city.name}: (1) Compare prices on each procedure page in the UAE Open Healthcare Directory, (2) Consider government hospitals which charge 30-50% less, (3) Ask for self-pay or cash-pay discounts at private clinics, (4) Get diagnostic tests at standalone labs rather than hospitals, (5) Check if your insurance plan covers the procedure to reduce out-of-pocket costs.`,
    },
  ];

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd
        data={breadcrumbSchema([
          { name: "UAE", url: base },
          { name: city.name, url: `${base}/directory/${city.slug}` },
          { name: "Procedures & Costs" },
        ])}
      />
      <JsonLd data={speakableSchema([".answer-block"])} />
      <JsonLd data={faqPageSchema(faqs)} />

      <Breadcrumb
        items={[
          { label: "UAE", href: "/" },
          { label: city.name, href: `/directory/${city.slug}` },
          { label: "Procedures & Costs" },
        ]}
      />

      <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-3">
        Medical Procedure Costs in {city.name}
      </h1>

      <p className="font-['Geist',sans-serif] text-sm text-black/40 mb-4">
        {procsInCity.length} procedures with verified pricing &middot; Last
        updated March 2026
      </p>

      <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 mb-8" data-answer-block="true">
        <p className="font-['Geist',sans-serif] text-black/40 leading-relaxed">
          According to the UAE Open Healthcare Directory, {city.name} has
          verified pricing data for {procsInCity.length} common medical
          procedures. Costs range from basic consultations and blood tests
          starting at {formatAed(50)} to major surgeries exceeding{" "}
          {formatAed(40000)}. Healthcare in {city.name} is regulated by the{" "}
          {regulator}. All pricing reflects market-observed ranges across
          government, private, and premium facilities as of March 2026. Each
          procedure page includes a cost comparison table, insurance coverage
          information, and links to providers in {city.name}.
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <div className="bg-[#f8f8f6] border border-black/[0.06] rounded-2xl p-5">
          <DollarSign className="h-5 w-5 text-[#006828] mb-2" />
          <p className="font-['Bricolage_Grotesque',sans-serif] font-semibold text-[22px] sm:text-[26px] text-[#1c1c1c] tracking-tight">
            {procsInCity.length}
          </p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40">Procedures with pricing</p>
        </div>
        <div className="bg-[#f8f8f6] border border-black/[0.06] rounded-2xl p-5">
          <Shield className="h-5 w-5 text-[#006828] mb-2" />
          <p className="font-['Bricolage_Grotesque',sans-serif] font-semibold text-[22px] sm:text-[26px] text-[#1c1c1c] tracking-tight">
            {procsInCity.filter((p) => p.insuranceCoverage === "typically-covered").length}
          </p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40">Covered by insurance</p>
        </div>
        <div className="bg-[#f8f8f6] border border-black/[0.06] rounded-2xl p-5">
          <Clock className="h-5 w-5 text-[#006828] mb-2" />
          <p className="font-['Bricolage_Grotesque',sans-serif] font-semibold text-[22px] sm:text-[26px] text-[#1c1c1c] tracking-tight">
            {procsInCity.filter((p) => p.setting === "outpatient").length}
          </p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40">Outpatient procedures</p>
        </div>
      </div>

      {/* Procedure categories */}
      {procsByCategory.map((cat) => (
        <section key={cat.slug} className="mb-10">
          <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">{cat.name}</h2>
          </div>
          <p className="font-['Geist',sans-serif] text-sm text-black/40 mb-4">{cat.description}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {cat.procedures.map((proc) => {
              const pricing = proc.cityPricing[city.slug];
              if (!pricing) return null;

              return (
                <Link
                  key={proc.slug}
                  href={`/directory/${city.slug}/procedures/${proc.slug}`}
                  className="block border border-black/[0.06] rounded-2xl p-5 hover:border-[#006828]/15 transition-colors group"
                >
                  <h3 className="font-bold text-[#1c1c1c] text-sm mb-1 group-hover:text-[#006828] transition-colors">
                    {proc.name}
                  </h3>
                  <p className="font-['Geist',sans-serif] text-xs text-black/40 mb-2 line-clamp-2">
                    {proc.description.slice(0, 100)}...
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-[#006828]">
                      {formatAed(pricing.min)}–{formatAed(pricing.max)}
                    </span>
                    <span className="text-[10px] text-black/40">
                      {proc.duration}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    {proc.insuranceCoverage === "typically-covered" && (
                      <span className="inline-block bg-[#006828]/[0.08] text-[#006828] text-[10px] font-medium uppercase tracking-wide px-2.5 py-0.5 rounded-full font-['Geist',sans-serif] text-[9px]">
                        Insurance covered
                      </span>
                    )}
                    {proc.insuranceCoverage === "not-covered" && (
                      <span className="inline-block bg-[#006828]/[0.08] text-[#006828] text-[10px] font-medium uppercase tracking-wide px-2.5 py-0.5 rounded-full font-['Geist',sans-serif] text-[9px]">Self-pay only</span>
                    )}
                    <span className="inline-block bg-[#006828]/[0.08] text-[#006828] text-[10px] font-medium uppercase tracking-wide px-2.5 py-0.5 rounded-full font-['Geist',sans-serif] text-[9px]">{proc.setting}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ))}

      {/* Cross-link to full pricing hub */}
      <div className="bg-[#f8f8f6] border border-black/[0.06] rounded-2xl p-6 mb-6">
        <h3 className="font-['Bricolage_Grotesque',sans-serif] font-semibold text-[#1c1c1c] tracking-tight mb-2">
          Compare prices across all UAE cities
        </h3>
        <p className="font-['Geist',sans-serif] text-sm text-black/40 mb-3">
          See how {city.name} compares to Dubai, Abu Dhabi, Sharjah, and other
          emirates for each procedure.
        </p>
        <Link
          href="/pricing"
          className="text-sm font-bold text-[#006828] hover:underline"
        >
          View UAE Medical Pricing Hub &rarr;
        </Link>
      </div>

      <FaqSection
        faqs={faqs}
        title={`Medical Costs in ${city.name} — FAQ`}
      />
    </div>
  );
}
