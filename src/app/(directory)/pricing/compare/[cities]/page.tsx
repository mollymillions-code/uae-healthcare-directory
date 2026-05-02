import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, TrendingDown, TrendingUp, Minus, BarChart3, MapPin } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { FaqSection } from "@/components/seo/FaqSection";
import {
  PROCEDURES,
  PROCEDURE_CATEGORIES,
  formatAed,
} from "@/lib/pricing";
import { CITIES } from "@/lib/constants/cities";
import { breadcrumbSchema, faqPageSchema, speakableSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

export const revalidate = 43200;

// ─── City Pair Utilities ──────────────────────────────────────────────────────

const CITY_SLUGS = CITIES.map((c) => c.slug);

/** All 28 alphabetically-ordered city pairs */
function getAllCityPairs(): { cityA: string; cityB: string }[] {
  const pairs: { cityA: string; cityB: string }[] = [];
  for (let i = 0; i < CITY_SLUGS.length; i++) {
    for (let j = i + 1; j < CITY_SLUGS.length; j++) {
      pairs.push({ cityA: CITY_SLUGS[i], cityB: CITY_SLUGS[j] });
    }
  }
  return pairs;
}

function getCityBySlug(slug: string) {
  return CITIES.find((c) => c.slug === slug);
}

function parseCitiesSlug(slug: string): { cityASlug: string; cityBSlug: string } | null {
  const parts = slug.split("-vs-");
  if (parts.length !== 2) return null;
  const cityASlug = parts[0];
  const cityBSlug = parts[1];
  if (!getCityBySlug(cityASlug) || !getCityBySlug(cityBSlug)) return null;
  return { cityASlug, cityBSlug };
}

/** Build the canonical slug: always alphabetical by city slug */
function canonicalSlug(cityA: string, cityB: string): string {
  return `${cityA}-vs-${cityB}`;
}

function getRegulatorShort(citySlug: string): string {
  if (citySlug === "dubai") return "DHA";
  if (citySlug === "abu-dhabi" || citySlug === "al-ain") return "DOH";
  return "MOHAP";
}

function getRegulatorFull(citySlug: string): string {
  if (citySlug === "dubai") return "Dubai Health Authority (DHA)";
  if (citySlug === "abu-dhabi" || citySlug === "al-ain") return "Department of Health Abu Dhabi (DOH)";
  return "Ministry of Health and Prevention (MOHAP)";
}

// ─── Pricing Analysis ─────────────────────────────────────────────────────────

interface ProcedureComparison {
  slug: string;
  name: string;
  categorySlug: string;
  cityATypical: number;
  cityBTypical: number;
  diffPercent: number;  // positive = cityB is more expensive
  cheaperCity: "A" | "B" | "tie";
  cityAMin: number;
  cityAMax: number;
  cityBMin: number;
  cityBMax: number;
}

interface CategoryWinner {
  categorySlug: string;
  categoryName: string;
  cityAWins: number;
  cityBWins: number;
  ties: number;
  winner: "A" | "B" | "tie";
}

function analysePricing(cityASlug: string, cityBSlug: string) {
  const comparisons: ProcedureComparison[] = [];

  for (const proc of PROCEDURES) {
    const pricingA = proc.cityPricing[cityASlug];
    const pricingB = proc.cityPricing[cityBSlug];
    if (!pricingA || !pricingB) continue;

    const diff = pricingB.typical - pricingA.typical;
    const avg = (pricingA.typical + pricingB.typical) / 2;
    const diffPercent = avg === 0 ? 0 : Math.round((diff / avg) * 100);
    const cheaper: "A" | "B" | "tie" =
      pricingA.typical < pricingB.typical ? "A" :
      pricingB.typical < pricingA.typical ? "B" : "tie";

    comparisons.push({
      slug: proc.slug,
      name: proc.name,
      categorySlug: proc.categorySlug,
      cityATypical: pricingA.typical,
      cityBTypical: pricingB.typical,
      diffPercent,
      cheaperCity: cheaper,
      cityAMin: pricingA.min,
      cityAMax: pricingA.max,
      cityBMin: pricingB.min,
      cityBMax: pricingB.max,
    });
  }

  // Category mapping (same as pricing page)
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

  const categoryWinners: CategoryWinner[] = PROCEDURE_CATEGORIES
    .map((cat) => {
      const catSlugs = categoryMap[cat.slug] || [];
      const catComps = comparisons.filter((c) => catSlugs.includes(c.categorySlug));
      if (catComps.length === 0) return null;

      const cityAWins = catComps.filter((c) => c.cheaperCity === "A").length;
      const cityBWins = catComps.filter((c) => c.cheaperCity === "B").length;
      const ties = catComps.filter((c) => c.cheaperCity === "tie").length;
      const winner: "A" | "B" | "tie" =
        cityAWins > cityBWins ? "A" :
        cityBWins > cityAWins ? "B" : "tie";

      return {
        categorySlug: cat.slug,
        categoryName: cat.name,
        cityAWins,
        cityBWins,
        ties,
        winner,
      };
    })
    .filter(Boolean) as CategoryWinner[];

  const totalA = comparisons.filter((c) => c.cheaperCity === "A").length;
  const totalB = comparisons.filter((c) => c.cheaperCity === "B").length;
  const totalTie = comparisons.filter((c) => c.cheaperCity === "tie").length;
  const overallWinner: "A" | "B" | "tie" =
    totalA > totalB ? "A" :
    totalB > totalA ? "B" : "tie";

  // Average difference — how much cheaper is the winning city on average?
  const allDiffs = comparisons.map((c) => {
    const diff = c.cityBTypical - c.cityATypical;
    return overallWinner === "A" ? diff : -diff;
  });
  const avgDiffAed = allDiffs.length > 0
    ? Math.round(allDiffs.reduce((a, b) => a + b, 0) / allDiffs.length)
    : 0;

  // Average percentage difference (absolute)
  const avgDiffPercent = comparisons.length > 0
    ? Math.round(
        comparisons.reduce((sum, c) => sum + Math.abs(c.diffPercent), 0) /
        comparisons.length
      )
    : 0;

  return {
    comparisons,
    categoryWinners,
    totalA,
    totalB,
    totalTie,
    overallWinner,
    avgDiffAed,
    avgDiffPercent,
    totalProcedures: comparisons.length,
  };
}

// ─── Why Prices Differ (editorial) ────────────────────────────────────────────

function getCityPricingContext(citySlug: string, cityName: string): string {
  if (citySlug === "dubai") {
    return `${cityName} is the most expensive emirate for healthcare because of high facility rents, premium hospital zones like Dubai Healthcare City, and DHA's DRG-based billing framework that allows market-driven pricing for outpatient services.`;
  }
  if (citySlug === "abu-dhabi") {
    return `${cityName} pricing is governed by the DOH Mandatory Tariff (Shafafiya), which sets base rates derived from US Medicare RVU values converted at 3.672 AED/USD. Facilities negotiate multipliers of 1x to 3x, keeping prices more structured than Dubai.`;
  }
  if (citySlug === "sharjah") {
    return `${cityName} benefits from lower commercial rents and proximity to Dubai, which creates competition and keeps prices 15-25% below Dubai levels. MOHAP regulation applies.`;
  }
  if (citySlug === "ajman") {
    return `${cityName} offers some of the most affordable healthcare in the UAE, driven by low operating costs and a smaller, less premium facility mix. MOHAP regulates pricing.`;
  }
  if (citySlug === "ras-al-khaimah") {
    return `${cityName} has a growing healthcare sector with moderate pricing. The emirate is investing in medical tourism, particularly in wellness and rehabilitation. MOHAP governs pricing.`;
  }
  if (citySlug === "fujairah") {
    return `${cityName}, on the UAE's eastern coast, has limited facility density which can mean less price competition, but overall costs remain below Dubai and Abu Dhabi levels. MOHAP regulated.`;
  }
  if (citySlug === "umm-al-quwain") {
    return `${cityName} is the smallest emirate by population and has the fewest healthcare facilities, resulting in the lowest prices in the UAE for most procedures. MOHAP regulated.`;
  }
  if (citySlug === "al-ain") {
    return `${cityName} shares Abu Dhabi's DOH regulatory framework but has lower facility rents than the capital, making it a more affordable option within the Abu Dhabi emirate. Tawam Hospital is a major anchor.`;
  }
  return `${cityName} healthcare is regulated by the relevant emirate health authority.`;
}

// ─── Generate Static Params ───────────────────────────────────────────────────

export function generateStaticParams() {
  if (process.env.PREBUILD_STATIC_ROUTES !== "1") return [];
  return getAllCityPairs().map(({ cityA, cityB }) => ({
    cities: canonicalSlug(cityA, cityB),
  }));
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export function generateMetadata({
  params,
}: {
  params: { cities: string };
}): Metadata {
  const base = getBaseUrl();
  const parsed = parseCitiesSlug(params.cities);
  if (!parsed) return { title: "City Comparison Not Found" };

  const cityA = getCityBySlug(parsed.cityASlug)!;
  const cityB = getCityBySlug(parsed.cityBSlug)!;
  const analysis = analysePricing(parsed.cityASlug, parsed.cityBSlug);
  const winnerName = analysis.overallWinner === "A" ? cityA.name
    : analysis.overallWinner === "B" ? cityB.name
    : "neither city";

  return {
    title: `${cityA.name} vs ${cityB.name} Medical Costs Compared — Procedure Prices Across ${analysis.totalProcedures} Procedures | UAE Open Healthcare Directory`,
    description: `Compare medical procedure costs between ${cityA.name} and ${cityB.name}. ${winnerName === "neither city" ? "Both cities" : winnerName} is cheaper overall across ${analysis.totalProcedures} procedures. Side-by-side pricing for MRI, dental, surgery, maternity, and more.`,
    alternates: { canonical: `${base}/pricing/compare/${params.cities}` },
    openGraph: {
      title: `${cityA.name} vs ${cityB.name} — Medical Procedure Costs Compared`,
      description: `Side-by-side comparison of ${analysis.totalProcedures} medical procedure prices between ${cityA.name} and ${cityB.name}, UAE.`,
      url: `${base}/pricing/compare/${params.cities}`,
      type: "website",
    },
  };
}

// ─── Page Component ───────────────────────────────────────────────────────────

export default function CityComparisonPage({
  params,
}: {
  params: { cities: string };
}) {
  const base = getBaseUrl();
  const parsed = parseCitiesSlug(params.cities);
  if (!parsed) notFound();

  const cityA = getCityBySlug(parsed.cityASlug);
  const cityB = getCityBySlug(parsed.cityBSlug);
  if (!cityA || !cityB) notFound();

  const analysis = analysePricing(parsed.cityASlug, parsed.cityBSlug);
  const {
    comparisons,
    categoryWinners,
    totalA,
    totalB,
    totalTie,
    overallWinner,
    avgDiffPercent,
    totalProcedures,
  } = analysis;

  const winnerCity = overallWinner === "A" ? cityA : overallWinner === "B" ? cityB : null;
  const loserCity = overallWinner === "A" ? cityB : overallWinner === "B" ? cityA : null;

  // Sort comparisons by absolute difference (largest savings first)
  const sortedComparisons = [...comparisons].sort(
    (a, b) => Math.abs(b.diffPercent) - Math.abs(a.diffPercent)
  );

  // Dynamic FAQs
  const faqs = [
    {
      question: `Is ${cityA.name} or ${cityB.name} cheaper for medical care?`,
      answer: winnerCity
        ? `${winnerCity.name} is cheaper overall for medical care. Out of ${totalProcedures} procedures compared, ${cityA.name} is cheaper for ${totalA} and ${cityB.name} is cheaper for ${totalB}${totalTie > 0 ? ` (${totalTie} are priced equally)` : ""}. On average, procedures in ${winnerCity.name} cost approximately ${avgDiffPercent}% less than in ${loserCity!.name}. However, specific procedures may be cheaper in ${loserCity!.name} — always compare individual procedure prices.`
        : `${cityA.name} and ${cityB.name} are similarly priced overall. Out of ${totalProcedures} procedures compared, ${cityA.name} is cheaper for ${totalA} and ${cityB.name} for ${totalB}. The best choice depends on the specific procedure you need.`,
    },
    {
      question: `How much can I save by choosing ${winnerCity?.name || cityA.name} over ${loserCity?.name || cityB.name} for surgery?`,
      answer: (() => {
        const surgicalComps = comparisons.filter((c) =>
          ["hospitals", "gastroenterology", "orthopedics"].includes(c.categorySlug)
        );
        if (surgicalComps.length === 0) return "Surgical pricing data is not available for this comparison.";
        const avgSurgDiff = Math.round(
          surgicalComps.reduce((sum, c) => sum + Math.abs(c.cityATypical - c.cityBTypical), 0) /
          surgicalComps.length
        );
        return `For surgical procedures, the average price difference between ${cityA.name} and ${cityB.name} is approximately ${formatAed(avgSurgDiff)}. Major surgeries like knee replacements and C-sections show the largest absolute savings. Always get quotes from multiple providers in both cities.`;
      })(),
    },
    {
      question: `Why are medical prices different in ${cityA.name} and ${cityB.name}?`,
      answer: `Medical prices differ because each city operates under different regulatory frameworks and has different operating costs. ${cityA.name} is regulated by the ${getRegulatorFull(parsed.cityASlug)}, while ${cityB.name} is under the ${getRegulatorFull(parsed.cityBSlug)}. Facility rents, doctor fees, equipment costs, and the competitive landscape all contribute to pricing differences. Premium hospital zones in larger cities command higher rates.`,
    },
    {
      question: `Does my insurance work in both ${cityA.name} and ${cityB.name}?`,
      answer: `UAE health insurance is mandatory across all emirates since January 2025. Most major insurance plans (Daman, AXA, Cigna, MetLife, Bupa, Oman Insurance) are accepted across both ${cityA.name} and ${cityB.name}. However, the network of approved providers may differ by city. Always verify that the specific facility is in your plan's network before booking.`,
    },
    {
      question: `Which procedures have the biggest price difference between ${cityA.name} and ${cityB.name}?`,
      answer: (() => {
        const top3 = sortedComparisons.slice(0, 3);
        if (top3.length === 0) return "No comparable procedures are available.";
        const items = top3.map((c) => {
          const cheaper = c.cheaperCity === "A" ? cityA.name : cityB.name;
          return `${c.name} (${Math.abs(c.diffPercent)}% cheaper in ${cheaper})`;
        });
        return `The procedures with the largest price difference are: ${items.join(", ")}. For these procedures, choosing the more affordable city can result in significant savings.`;
      })(),
    },
  ];

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Schema.org */}
      <JsonLd
        data={breadcrumbSchema([
          { name: "UAE", url: base },
          { name: "Medical Procedure Costs", url: `${base}/pricing` },
          { name: `${cityA.name} vs ${cityB.name}` },
        ])}
      />
      <JsonLd data={speakableSchema([".answer-block", "[data-answer-block]"])} />
      <JsonLd data={faqPageSchema(faqs)} />

      <Breadcrumb
        items={[
          { label: "UAE", href: "/" },
          { label: "Medical Procedure Costs", href: "/pricing" },
          { label: `${cityA.name} vs ${cityB.name}` },
        ]}
      />

      {/* H1 */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <BarChart3 className="w-8 h-8 text-[#006828]" />
          <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight">
            {cityA.name} vs {cityB.name} — Medical Procedure Costs Compared
          </h1>
        </div>

        {/* Answer Block */}
        <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 mb-6" data-answer-block="true">
          <p className="font-['Geist',sans-serif] text-black/40 leading-relaxed">
            {winnerCity ? (
              <>
                <strong className="text-[#1c1c1c]">{winnerCity.name} is cheaper overall</strong> for
                medical care compared to {loserCity!.name}.{" "}
                Out of {totalProcedures} procedures compared, {cityA.name} is the more
                affordable option for {totalA} procedures and {cityB.name} for {totalB}
                {totalTie > 0 ? ` (${totalTie} are equally priced)` : ""}.{" "}
                On average, procedures in {winnerCity.name} cost approximately{" "}
                <strong className="text-green-700">{avgDiffPercent}% less</strong> than
                in {loserCity!.name}.{" "}
                Pricing based on DOH Mandatory Tariff methodology and market-observed data
                across government, private, and premium facilities as of March 2026.
              </>
            ) : (
              <>
                <strong className="text-[#1c1c1c]">{cityA.name} and {cityB.name} are similarly priced</strong>{" "}
                for medical care overall. Out of {totalProcedures} procedures compared,{" "}
                {cityA.name} wins on {totalA} and {cityB.name} on {totalB}
                {totalTie > 0 ? ` (${totalTie} tied)` : ""}.{" "}
                The better choice depends on the specific procedure you need.
              </>
            )}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#f8f8f6] p-4 text-center">
            <p className="text-2xl font-bold text-[#006828]">{totalProcedures}</p>
            <p className="font-['Geist',sans-serif] text-xs text-black/40">Procedures compared</p>
          </div>
          <div className="bg-[#f8f8f6] p-4 text-center">
            <p className="text-2xl font-bold text-green-700">{totalA}</p>
            <p className="font-['Geist',sans-serif] text-xs text-black/40">Cheaper in {cityA.name}</p>
          </div>
          <div className="bg-[#f8f8f6] p-4 text-center">
            <p className="text-2xl font-bold text-green-700">{totalB}</p>
            <p className="font-['Geist',sans-serif] text-xs text-black/40">Cheaper in {cityB.name}</p>
          </div>
          <div className="bg-[#f8f8f6] p-4 text-center">
            <p className="text-2xl font-bold text-[#006828]">{avgDiffPercent}%</p>
            <p className="font-['Geist',sans-serif] text-xs text-black/40">Avg. price difference</p>
          </div>
        </div>
      </div>

      {/* Why Prices Differ */}
      <div className="bg-[#f8f8f6] border border-black/[0.06] rounded-2xl p-6 mb-10">
        <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Why Prices Differ</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-[#006828]" />
              <h3 className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight">{cityA.name}</h3>
              <span className="text-[10px] text-black/40 font-['Geist',sans-serif]">{getRegulatorShort(parsed.cityASlug)}</span>
            </div>
            <p className="font-['Geist',sans-serif] text-xs text-black/40 leading-relaxed">
              {getCityPricingContext(parsed.cityASlug, cityA.name)}
            </p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-[#006828]" />
              <h3 className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight">{cityB.name}</h3>
              <span className="text-[10px] text-black/40 font-['Geist',sans-serif]">{getRegulatorShort(parsed.cityBSlug)}</span>
            </div>
            <p className="font-['Geist',sans-serif] text-xs text-black/40 leading-relaxed">
              {getCityPricingContext(parsed.cityBSlug, cityB.name)}
            </p>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Category Breakdown — Which City Wins?</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-12">
        {categoryWinners.map((cw) => {
          const winnerName =
            cw.winner === "A" ? cityA.name :
            cw.winner === "B" ? cityB.name : "Tie";
          const winnerColor =
            cw.winner === "A" ? "text-green-700 bg-green-50" :
            cw.winner === "B" ? "text-green-700 bg-green-50" :
            "text-yellow-700 bg-yellow-50";

          return (
            <div
              key={cw.categorySlug}
              className="border border-black/[0.06] rounded-2xl p-5"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight">{cw.categoryName}</h3>
                <span className={`text-[10px] font-medium px-2 py-0.5 ${winnerColor}`}>
                  {winnerName}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-black/40">
                <span>{cityA.name}: {cw.cityAWins} wins</span>
                <span>{cityB.name}: {cw.cityBWins} wins</span>
                {cw.ties > 0 && <span>Tied: {cw.ties}</span>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Winner Summary */}
      <div className="bg-[#f8f8f6] border border-black/[0.06] rounded-2xl p-6 mb-10" data-answer-block="true">
        <h2 className="text-lg font-['Bricolage_Grotesque',sans-serif] font-semibold text-[#1c1c1c] tracking-tight mb-3">
          {winnerCity ? (
            <>{winnerCity.name} is cheaper for {overallWinner === "A" ? totalA : totalB} of {totalProcedures} procedures</>
          ) : (
            <>Both cities are evenly matched across {totalProcedures} procedures</>
          )}
        </h2>
        <div className="space-y-2">
          {winnerCity && loserCity && (
            <>
              <div className="flex items-start gap-2">
                <TrendingDown className="w-4 h-4 text-green-700 flex-shrink-0 mt-0.5" />
                <p className="font-['Geist',sans-serif] text-sm text-black/40">
                  <strong className="text-[#1c1c1c]">{winnerCity.name}</strong> is the more
                  affordable option for the majority of procedures, especially in{" "}
                  {categoryWinners
                    .filter((cw) => cw.winner === overallWinner)
                    .slice(0, 3)
                    .map((cw) => cw.categoryName.toLowerCase())
                    .join(", ") || "most categories"}.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <TrendingUp className="w-4 h-4 text-red-700 flex-shrink-0 mt-0.5" />
                <p className="font-['Geist',sans-serif] text-sm text-black/40">
                  <strong className="text-[#1c1c1c]">{loserCity.name}</strong> may still be
                  cheaper for specific procedures —{" "}
                  {(() => {
                    const loserWins = comparisons
                      .filter((c) => c.cheaperCity === (overallWinner === "A" ? "B" : "A"))
                      .sort((a, b) => Math.abs(b.diffPercent) - Math.abs(a.diffPercent))
                      .slice(0, 3);
                    if (loserWins.length === 0) return "check individual procedures below";
                    return loserWins.map((c) => c.name.toLowerCase()).join(", ");
                  })()}.
                </p>
              </div>
            </>
          )}
          <div className="flex items-start gap-2">
            <Minus className="w-4 h-4 text-[#006828] flex-shrink-0 mt-0.5" />
            <p className="font-['Geist',sans-serif] text-sm text-black/40">
              Prices vary by facility tier (government vs. private vs. premium),
              doctor experience, and clinical complexity. The figures below are typical
              mid-range estimates. Always get a direct quote before proceeding.
            </p>
          </div>
        </div>
      </div>

      {/* Procedure-by-Procedure Comparison Table */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Procedure-by-Procedure Comparison</h2>
      </div>
      <p className="font-['Geist',sans-serif] text-xs text-black/40 mb-4">
        Sorted by largest price difference. Click any procedure for full city-specific pricing.
      </p>

      {/* Desktop table */}
      <div className="hidden md:block border border-black/[0.06] mb-12 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#f8f8f6] border-b border-black/[0.06]">
              <th className="text-left p-3 font-bold text-[#1c1c1c]">Procedure</th>
              <th className="text-right p-3 font-bold text-[#1c1c1c]">{cityA.name}</th>
              <th className="text-right p-3 font-bold text-[#1c1c1c]">{cityB.name}</th>
              <th className="text-right p-3 font-bold text-[#1c1c1c]">Difference</th>
              <th className="text-center p-3 font-bold text-[#1c1c1c]">Cheaper</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-light-200">
            {sortedComparisons.map((comp) => {
              const cheaperName =
                comp.cheaperCity === "A" ? cityA.name :
                comp.cheaperCity === "B" ? cityB.name : "Tied";
              const diffColor = Math.abs(comp.diffPercent) >= 15
                ? "text-green-700 font-bold"
                : Math.abs(comp.diffPercent) >= 5
                ? "text-green-700"
                : "text-black/40";
              const cityAColor = comp.cheaperCity === "A" ? "text-green-700 font-bold" : "";
              const cityBColor = comp.cheaperCity === "B" ? "text-green-700 font-bold" : "";

              return (
                <tr key={comp.slug} className="hover:bg-[#f8f8f6] transition-colors">
                  <td className="p-3">
                    <Link
                      href={`/pricing/${comp.slug}`}
                      className="text-[#1c1c1c] hover:text-[#006828] transition-colors font-medium"
                    >
                      {comp.name}
                    </Link>
                  </td>
                  <td className={`p-3 text-right ${cityAColor}`}>
                    <Link href={`/pricing/${comp.slug}/${parsed.cityASlug}`} className="hover:underline">
                      {formatAed(comp.cityATypical)}
                    </Link>
                  </td>
                  <td className={`p-3 text-right ${cityBColor}`}>
                    <Link href={`/pricing/${comp.slug}/${parsed.cityBSlug}`} className="hover:underline">
                      {formatAed(comp.cityBTypical)}
                    </Link>
                  </td>
                  <td className={`p-3 text-right ${diffColor}`}>
                    {Math.abs(comp.diffPercent)}%
                  </td>
                  <td className="p-3 text-center">
                    <span className={
                      comp.cheaperCity === "tie"
                        ? "text-[10px] text-black/40 px-2 py-0.5 bg-[#f8f8f6]"
                        : "text-[10px] text-green-700 px-2 py-0.5 bg-green-50 font-medium"
                    }>
                      {cheaperName}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3 mb-12">
        {sortedComparisons.map((comp) => {
          const cheaperName =
            comp.cheaperCity === "A" ? cityA.name :
            comp.cheaperCity === "B" ? cityB.name : "Tied";

          return (
            <div key={comp.slug} className="border border-black/[0.06] p-3">
              <div className="flex items-start justify-between mb-2">
                <Link
                  href={`/pricing/${comp.slug}`}
                  className="text-sm font-['Bricolage_Grotesque',sans-serif] font-medium text-[#1c1c1c] tracking-tight hover:text-[#006828] transition-colors"
                >
                  {comp.name}
                </Link>
                <span className={
                  comp.cheaperCity === "tie"
                    ? "text-[10px] text-black/40 px-2 py-0.5 bg-[#f8f8f6] flex-shrink-0"
                    : "text-[10px] text-green-700 px-2 py-0.5 bg-green-50 font-medium flex-shrink-0"
                }>
                  {cheaperName}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <p className="text-black/40">{cityA.name}</p>
                  <p className={`font-bold ${comp.cheaperCity === "A" ? "text-green-700" : "text-[#1c1c1c]"}`}>
                    <Link href={`/pricing/${comp.slug}/${parsed.cityASlug}`} className="hover:underline">
                      {formatAed(comp.cityATypical)}
                    </Link>
                  </p>
                </div>
                <div>
                  <p className="text-black/40">{cityB.name}</p>
                  <p className={`font-bold ${comp.cheaperCity === "B" ? "text-green-700" : "text-[#1c1c1c]"}`}>
                    <Link href={`/pricing/${comp.slug}/${parsed.cityBSlug}`} className="hover:underline">
                      {formatAed(comp.cityBTypical)}
                    </Link>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-black/40">Diff</p>
                  <p className="font-bold text-[#006828]">{Math.abs(comp.diffPercent)}%</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Biggest Savings */}
      {sortedComparisons.length >= 3 && (
        <>
          <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Biggest Savings Between {cityA.name} &amp; {cityB.name}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
            {sortedComparisons.slice(0, 3).map((comp) => {
              const cheaperCity = comp.cheaperCity === "A" ? cityA : cityB;
              const savings = Math.abs(comp.cityATypical - comp.cityBTypical);

              return (
                <Link
                  key={comp.slug}
                  href={`/pricing/${comp.slug}`}
                  className="border border-black/[0.06] rounded-2xl p-5 hover:border-[#006828]/15 transition-colors group"
                >
                  <h3 className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors mb-1">
                    {comp.name}
                  </h3>
                  <p className="font-['Geist',sans-serif] text-xs text-black/40 mb-3">
                    Save {formatAed(savings)} ({Math.abs(comp.diffPercent)}%) by choosing{" "}
                    {cheaperCity.name}
                  </p>
                  <div className="flex items-center justify-between text-xs">
                    <span className={comp.cheaperCity === "A" ? "text-green-700 font-bold" : "text-black/40"}>
                      {cityA.name}: {formatAed(comp.cityATypical)}
                    </span>
                    <ArrowRight className="w-3 h-3 text-light-300" />
                    <span className={comp.cheaperCity === "B" ? "text-green-700 font-bold" : "text-black/40"}>
                      {cityB.name}: {formatAed(comp.cityBTypical)}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}

      {/* Compare Other Cities */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Compare Other Cities</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-12">
        {getAllCityPairs()
          .filter(
            ({ cityA: a, cityB: b }) =>
              canonicalSlug(a, b) !== params.cities
          )
          .slice(0, 8)
          .map(({ cityA: a, cityB: b }) => {
            const cA = getCityBySlug(a)!;
            const cB = getCityBySlug(b)!;
            return (
              <Link
                key={`${a}-${b}`}
                href={`/pricing/compare/${canonicalSlug(a, b)}`}
                className="border border-black/[0.06] p-3 hover:border-[#006828]/15 transition-colors group text-center"
              >
                <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
                  {cA.name} vs {cB.name}
                </p>
              </Link>
            );
          })}
      </div>

      {/* FAQ */}
      <FaqSection
        faqs={faqs}
        title={`${cityA.name} vs ${cityB.name} — Frequently Asked Questions`}
      />

      {/* Disclaimer */}
      <div className="mt-8 border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>Disclaimer:</strong> All prices shown are indicative ranges based on the
          DOH Mandatory Tariff (Shafafiya) methodology, DHA DRG parameters, and
          market-observed data as of March 2026. Actual costs vary by facility, doctor,
          clinical complexity, and insurance plan. This comparison is for informational
          purposes only and does not constitute medical or financial advice. Always obtain a
          personalised quote from the healthcare provider before proceeding with any
          procedure. Data cross-referenced with the UAE Open Healthcare Directory.
        </p>
      </div>
    </div>
  );
}
