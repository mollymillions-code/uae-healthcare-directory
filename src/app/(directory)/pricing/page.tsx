import { Metadata } from "next";
import Link from "next/link";
import {
  ChevronRight,
  Sparkles,
  DollarSign,
  ArrowRight,
  Search,
  TrendingDown,
  ShieldCheck,
} from "lucide-react";
import { JsonLd } from "@/components/seo/JsonLd";
import { FaqSection } from "@/components/seo/FaqSection";
import { ProcedureSearch } from "@/components/pricing/ProcedureSearch";
import { PROCEDURES, PROCEDURE_CATEGORIES, formatAed } from "@/lib/pricing";
import {
  breadcrumbSchema,
  speakableSchema,
  faqPageSchema,
  truncateTitle,
  truncateDescription,
} from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { PageEvent } from "@/components/analytics/PageEvent";

export const revalidate = 43200;

export function generateMetadata(): Metadata {
  const base = getBaseUrl();
  return {
    title: truncateTitle(
      "UAE Medical Procedure Costs — Compare Prices Across Dubai, Abu Dhabi & All Emirates"
    ),
    description: truncateDescription(
      "How much does an MRI, dental implant, or knee replacement cost in the UAE? Compare medical procedure prices across Dubai, Abu Dhabi, Sharjah, and all emirates. Estimate out-of-pocket cost. Based on DOH Mandatory Tariff data."
    ),
    alternates: { canonical: `${base}/pricing` },
    openGraph: {
      title: "UAE Medical Procedure Costs — Compare Prices Across All Emirates",
      description:
        "Compare 40+ medical procedure prices across 8 UAE cities. Based on official DOH tariff data. Includes insurance cost estimator.",
      url: `${base}/pricing`,
      type: "website",
    },
  };
}

// Category → procedure-slug mapping (kept identical to the original page)
const CATEGORY_MAP: Record<string, string[]> = {
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

export default function PricingPage() {
  const base = getBaseUrl();

  const procedureCount = PROCEDURES.length;
  const categoryCount = PROCEDURE_CATEGORIES.length;

  const searchData = PROCEDURES.map((p) => ({
    slug: p.slug,
    name: p.name,
    nameAr: p.nameAr,
    categorySlug: p.categorySlug,
    priceRange: p.priceRange,
    insuranceCoverage: p.insuranceCoverage,
  }));

  const popular = PROCEDURES.slice(0, 12);

  const faqs = [
    {
      question: "How much do medical procedures cost in the UAE?",
      answer:
        "Medical procedure costs in the UAE vary significantly by city, facility type, and complexity. Dubai is generally the most expensive, followed by Abu Dhabi, while Sharjah and the northern emirates offer lower rates. Prices in Abu Dhabi are governed by the DOH Mandatory Tariff (Shafafiya), which sets base rates that facilities can multiply by 1x to 3x. A GP consultation ranges from AED 100–500, an MRI from AED 800–5,000, and a knee replacement from AED 30,000–100,000.",
    },
    {
      question: "Are medical procedures covered by insurance in the UAE?",
      answer:
        "Health insurance is mandatory across all seven UAE emirates as of January 2025. Most medically necessary procedures (diagnostics, surgeries, emergency care) are covered, with co-pays of 0–20% depending on the plan tier. Cosmetic procedures (rhinoplasty, Botox, hair transplant) are generally not covered. Dental coverage depends on the plan — basic plans exclude dental, while enhanced and premium plans include it with annual sub-limits.",
    },
    {
      question: "Why are medical costs different across UAE cities?",
      answer:
        "Each emirate has its own health authority and pricing framework. Abu Dhabi uses the DOH Mandatory Tariff (based on US Medicare RVU rates converted to AED), while Dubai uses DRG-based billing for inpatients and market-driven pricing for outpatients. The northern emirates (Sharjah, Ajman, RAK, Fujairah, UAQ) under MOHAP have lower operating costs and rents, which translates to lower procedure prices.",
    },
    {
      question: "How accurate are the prices shown on this page?",
      answer:
        "Prices are indicative ranges based on the DOH Mandatory Tariff methodology, DHA DRG parameters, and market-observed data as of March 2026. Actual costs depend on the specific facility, doctor, clinical complexity, and your insurance plan. Always confirm the quote directly with the provider before proceeding.",
    },
    {
      question: "What is the DOH Mandatory Tariff (Shafafiya)?",
      answer:
        "The DOH Mandatory Tariff is the official pricelist published by the Department of Health Abu Dhabi under its Shafafiya (transparency) programme. It sets base prices for every medical procedure using CPT and HCPCS codes, calculated as a percentage of US Medicare rates converted to AED at 3.672. Providers can negotiate multipliers of 1x to 3x these base rates with insurance companies.",
    },
  ];

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "UAE", url: base },
          { name: "Medical Procedure Costs" },
        ])}
      />
      <JsonLd data={speakableSchema([".answer-block"])} />
      <JsonLd data={faqPageSchema(faqs)} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "UAE Medical Procedure Costs",
          description:
            "Compare medical procedure prices across all UAE emirates with insurance cost estimation.",
          url: `${base}/pricing`,
          isPartOf: {
            "@type": "WebSite",
            name: "UAE Open Healthcare Directory",
            url: base,
          },
          about: {
            "@type": "MedicalCondition",
            name: "Healthcare Cost Transparency in the UAE",
          },
        }}
      />

      <PageEvent event="pricing_page_view" />

      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden bg-surface-cream">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 -right-40 h-[460px] w-[460px] rounded-full bg-[radial-gradient(closest-side,rgba(0,200,83,0.16),transparent_70%)]" />
          <div className="absolute -top-20 -left-32 h-[360px] w-[360px] rounded-full bg-[radial-gradient(closest-side,rgba(255,176,120,0.22),transparent_70%)]" />
        </div>

        <div className="relative max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-10">
          {/* Breadcrumb */}
          <nav
            className="font-sans text-z-body-sm text-ink-muted flex items-center gap-1.5 mb-5 flex-wrap"
            aria-label="Breadcrumb"
          >
            <Link href="/" className="hover:text-ink transition-colors">
              UAE
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-ink font-medium">Medical procedure costs</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-8">
              <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-3 inline-flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                Pricing intelligence
              </p>
              <h1 className="font-display font-semibold text-ink text-display-lg lg:text-[56px] leading-[1.02] tracking-[-0.028em]">
                UAE medical procedure costs.
              </h1>
              <p className="font-sans text-z-body sm:text-[17px] text-ink-soft mt-4 max-w-2xl leading-relaxed">
                Compare prices for {procedureCount} procedures across Dubai, Abu Dhabi,
                Sharjah, and every UAE emirate. Based on the DOH Mandatory Tariff
                (Shafafiya) methodology and market-observed rates — with an insurance
                estimator to check your real out-of-pocket cost.
              </p>
            </div>

            {/* Stats */}
            <div className="lg:col-span-4 grid grid-cols-2 gap-3">
              {[
                { n: procedureCount.toString(), l: "Procedures priced" },
                { n: categoryCount.toString(), l: "Categories" },
                { n: "8", l: "Cities compared" },
                { n: "85+", l: "Insurance plans" },
              ].map((s) => (
                <div
                  key={s.l}
                  className="rounded-z-md bg-white border border-ink-line px-4 py-3"
                >
                  <p className="font-display font-semibold text-ink text-z-h1 leading-none">
                    {s.n}
                  </p>
                  <p className="font-sans text-z-caption text-ink-muted mt-1">
                    {s.l}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* AEO answer block in hero */}
          <div
            className="mt-8 answer-block rounded-z-md bg-white border border-ink-line p-5 sm:p-6 max-w-4xl"
            data-answer-block="true"
          >
            <p className="font-sans text-z-body-sm text-ink-soft leading-[1.75]">
              <span className="font-semibold text-ink">
                In the UAE, a GP consultation costs AED 100–500, an MRI AED 800–5,000,
                and a knee replacement AED 30,000–100,000.
              </span>{" "}
              Prices vary 2–3x between Dubai&apos;s premium hospitals and the northern
              emirates. Abu Dhabi uses the DOH Mandatory Tariff (base rate × 1–3
              multiplier), Dubai uses DRG billing for inpatients and market rates for
              outpatients, and MOHAP emirates set their own fee caps. Insurance is
              mandatory across all seven emirates and typically covers 80–100% of
              medically necessary procedures.
            </p>
          </div>
        </div>
      </section>

      {/* ─── Search ─── */}
      <section className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16">
        <header className="mb-6">
          <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-2">
            Search
          </p>
          <h2 className="font-display font-semibold text-ink text-display-md tracking-[-0.018em]">
            Find any procedure.
          </h2>
        </header>
        <div className="rounded-z-lg bg-white border border-ink-line p-5 sm:p-6">
          <ProcedureSearch procedures={searchData} />
        </div>
      </section>

      {/* ─── Browse by category (chip grid) ─── */}
      <section className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20">
        <header className="mb-6">
          <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-2">
            Browse by category
          </p>
          <h2 className="font-display font-semibold text-ink text-display-md tracking-[-0.018em]">
            Start with the procedure type.
          </h2>
        </header>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {PROCEDURE_CATEGORIES.map((cat) => {
            const count = PROCEDURES.filter((p) =>
              (CATEGORY_MAP[cat.slug] || []).includes(p.categorySlug)
            ).length;

            return (
              <Link
                key={cat.slug}
                href={`/pricing#${cat.slug}`}
                className="group rounded-z-md bg-white border border-ink-line p-4 hover:border-ink hover:shadow-z-card transition-all duration-z-base"
              >
                <h3 className="font-display font-semibold text-ink text-z-body leading-tight group-hover:underline decoration-1 underline-offset-2">
                  {cat.name}
                </h3>
                <p className="font-sans text-z-caption text-ink-muted mt-1">
                  {count} procedure{count !== 1 ? "s" : ""}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ─── Most searched procedures ─── */}
      <section className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20">
        <header className="flex items-end justify-between gap-6 mb-6">
          <div>
            <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-2">
              Most searched
            </p>
            <h2 className="font-display font-semibold text-ink text-display-md tracking-[-0.018em]">
              What patients look up most.
            </h2>
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {popular.map((proc) => {
            const coverageBadge = {
              "typically-covered": {
                label: "Covered",
                cls: "bg-accent-muted text-accent-dark",
              },
              "partially-covered": {
                label: "Partial",
                cls: "bg-amber-50 text-amber-700",
              },
              "rarely-covered": {
                label: "Rare",
                cls: "bg-orange-50 text-orange-700",
              },
              "not-covered": {
                label: "Not covered",
                cls: "bg-red-50 text-red-700",
              },
            }[proc.insuranceCoverage] ?? { label: "Check plan", cls: "bg-surface-cream text-ink-soft" };

            return (
              <Link
                key={proc.slug}
                href={`/pricing/${proc.slug}`}
                className="group flex flex-col justify-between rounded-z-md bg-white border border-ink-line p-5 hover:border-ink hover:shadow-z-card transition-all duration-z-base"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-display font-semibold text-ink text-z-body leading-tight group-hover:underline decoration-1 underline-offset-2">
                      {proc.name}
                    </h3>
                    <ArrowRight className="h-4 w-4 text-ink-muted group-hover:translate-x-0.5 transition-transform flex-shrink-0 mt-1" />
                  </div>
                  <p className="font-sans text-z-caption text-ink-muted mt-2 line-clamp-2">
                    {proc.description.slice(0, 140)}
                    {proc.description.length > 140 ? "…" : ""}
                  </p>
                </div>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-ink-hairline">
                  <p className="font-display font-semibold text-ink text-z-body-sm">
                    {formatAed(proc.priceRange.min)} – {formatAed(proc.priceRange.max)}
                  </p>
                  <span
                    className={`font-sans text-z-micro font-medium rounded-z-pill px-2 py-0.5 ${coverageBadge.cls}`}
                  >
                    {coverageBadge.label}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ─── All procedures by category (prose + table) ─── */}
      <section className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 space-y-14">
        {PROCEDURE_CATEGORIES.map((cat) => {
          const catProcs = PROCEDURES.filter((p) =>
            (CATEGORY_MAP[cat.slug] || []).includes(p.categorySlug)
          ).sort((a, b) => a.sortOrder - b.sortOrder);

          if (catProcs.length === 0) return null;

          return (
            <section key={cat.slug} id={cat.slug} className="scroll-mt-24">
              <header className="mb-5">
                <h2 className="font-display font-semibold text-ink text-z-h1 tracking-[-0.012em]">
                  {cat.name}
                </h2>
                <p className="font-sans text-z-body-sm text-ink-soft mt-1.5 leading-relaxed max-w-3xl">
                  {cat.description}
                </p>
              </header>

              <div className="rounded-z-md bg-white border border-ink-line overflow-hidden">
                <ul className="divide-y divide-ink-hairline">
                  {catProcs.map((proc) => (
                    <li key={proc.slug}>
                      <Link
                        href={`/pricing/${proc.slug}`}
                        className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-surface-cream transition-colors group"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-display font-semibold text-ink text-z-body leading-tight group-hover:underline decoration-1 underline-offset-2 truncate">
                              {proc.name}
                            </h3>
                            {proc.cptCode && (
                              <span className="font-sans text-z-micro text-ink-muted hidden sm:inline">
                                CPT {proc.cptCode}
                              </span>
                            )}
                          </div>
                          <p className="font-sans text-z-caption text-ink-muted mt-0.5">
                            {proc.duration} · {proc.setting} · {proc.recoveryTime} recovery
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-display font-semibold text-ink text-z-body-sm">
                            {formatAed(proc.priceRange.min)} –{" "}
                            {formatAed(proc.priceRange.max)}
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-ink-muted group-hover:translate-x-0.5 transition-transform flex-shrink-0 hidden sm:block" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          );
        })}
      </section>

      {/* ─── Key insights (AEO prose block) ─── */}
      <section className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20">
        <header className="mb-6">
          <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-2">
            Key facts
          </p>
          <h2 className="font-display font-semibold text-ink text-display-md tracking-[-0.018em]">
            UAE medical pricing in four lines.
          </h2>
        </header>

        <div
          className="answer-block rounded-z-md bg-white border border-ink-line p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-6"
          data-answer-block="true"
        >
          {[
            {
              Icon: TrendingDown,
              title: "Cheapest emirates",
              body:
                "Sharjah, Ajman, and UAQ consistently undercut Dubai by 30–40% for the same procedure — a direct result of lower rent and operating costs.",
            },
            {
              Icon: DollarSign,
              title: "Abu Dhabi pricing",
              body:
                "Governed by the DOH Mandatory Tariff (Shafafiya). Base rates derive from US Medicare RVUs × AED 3.672, with facility-negotiated multipliers of 1x–3x.",
            },
            {
              Icon: ShieldCheck,
              title: "Insurance since Jan 2025",
              body:
                "Health insurance is mandatory for every UAE resident across all seven emirates. Most medically necessary procedures are covered at 80–100%.",
            },
            {
              Icon: Search,
              title: "Price variation",
              body:
                "The same procedure can cost 2–3x more at a premium hospital versus a government or basic private facility. Always compare three providers.",
            },
          ].map((row) => (
            <div key={row.title} className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-z-sm bg-accent-muted flex items-center justify-center flex-shrink-0">
                <row.Icon className="h-5 w-5 text-accent-dark" strokeWidth={1.75} />
              </div>
              <div>
                <h3 className="font-display font-semibold text-ink text-z-h3">
                  {row.title}
                </h3>
                <p className="font-sans text-z-body-sm text-ink-soft mt-1 leading-relaxed">
                  {row.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20">
        <header className="mb-6">
          <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-2">
            Questions
          </p>
          <h2 className="font-display font-semibold text-ink text-display-md tracking-[-0.018em]">
            UAE medical pricing FAQ.
          </h2>
        </header>
        <div className="max-w-3xl">
          <FaqSection faqs={faqs} title="UAE Medical Pricing" />
        </div>
      </section>

      {/* ─── Disclaimer ─── */}
      <section className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16 sm:pb-24">
        <div className="border-t border-ink-hairline pt-6">
          <p className="font-sans text-z-caption text-ink-muted leading-relaxed max-w-4xl">
            <span className="font-semibold text-ink-soft">Disclaimer —</span> all prices
            are indicative ranges based on the DOH Mandatory Tariff (Shafafiya)
            methodology, DHA DRG parameters, and market-observed data as of March 2026.
            Actual costs vary by facility, doctor, clinical complexity, and insurance
            plan. This tool is informational and does not constitute medical or
            financial advice. Obtain a personalised quote from the provider before
            proceeding. Data cross-referenced with the UAE Open Healthcare Directory.
          </p>
        </div>
      </section>
    </>
  );
}
