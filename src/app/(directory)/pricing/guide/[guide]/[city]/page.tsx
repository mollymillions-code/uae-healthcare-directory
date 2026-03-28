import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ShieldOff,
  Plane,
  Globe,
  PiggyBank,
  Crown,
  Baby,
  ArrowRight,
  MapPin,
  Lightbulb,
  Shield,
  ExternalLink,
} from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { FaqSection } from "@/components/seo/FaqSection";
import {
  PRICING_GUIDES,
  getGuideBySlug,
} from "@/lib/constants/pricing-guides";
import {
  PROCEDURES,
  formatAed,
  getProcedureBySlug,
} from "@/lib/constants/procedures";
import { CITIES } from "@/lib/constants/cities";
import {
  breadcrumbSchema,
  speakableSchema,
  faqPageSchema,
  medicalWebPageSchema,
} from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

export const revalidate = 43200;

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  ShieldOff,
  Plane,
  Globe,
  PiggyBank,
  Crown,
  Baby,
};

interface PageProps {
  params: Promise<{ guide: string; city: string }>;
}

export async function generateStaticParams() {
  const params: { guide: string; city: string }[] = [];
  for (const guide of PRICING_GUIDES) {
    for (const city of CITIES) {
      params.push({ guide: guide.slug, city: city.slug });
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { guide: guideSlug, city: citySlug } = await params;
  const guide = getGuideBySlug(guideSlug);
  const city = CITIES.find((c) => c.slug === citySlug);
  if (!guide || !city) return {};

  const base = getBaseUrl();
  const title = `${guide.name.replace("in UAE", "").replace("in the UAE", "").trim()} in ${city.name}`;

  return {
    title: `${title} — Procedure Prices & Tips | UAE Open Healthcare Directory`,
    description: `${guide.description.split(".")[0]} in ${city.name}. Compare ${guide.featuredProcedures.length} procedure prices, get city-specific tips, and find providers in ${city.name}.`,
    alternates: {
      canonical: `${base}/pricing/guide/${guide.slug}/${city.slug}`,
    },
    openGraph: {
      title,
      description: `${guide.description.split(".")[0]} in ${city.name}. Compare procedure prices across ${city.name} healthcare facilities.`,
      url: `${base}/pricing/guide/${guide.slug}/${city.slug}`,
      type: "website",
    },
  };
}

/** Get the health authority name for a city */
function getRegulator(citySlug: string): string {
  if (citySlug === "dubai") return "Dubai Health Authority (DHA)";
  if (citySlug === "abu-dhabi" || citySlug === "al-ain")
    return "Department of Health Abu Dhabi (DOH)";
  return "Ministry of Health and Prevention (MOHAP)";
}

/** Generate city-specific answer block */
function generateCityGuideAnswer(
  guide: typeof PRICING_GUIDES[number],
  cityName: string,
  citySlug: string,
  featuredProcs: typeof PROCEDURES
): string {
  const procsWithCityPricing = featuredProcs.filter(
    (p) => p.cityPricing[citySlug]
  );
  const avgTypical =
    procsWithCityPricing.length > 0
      ? Math.round(
          procsWithCityPricing.reduce(
            (sum, p) => sum + (p.cityPricing[citySlug]?.typical ?? 0),
            0
          ) / procsWithCityPricing.length
        )
      : 0;

  const cheapestProc = procsWithCityPricing.reduce(
    (cheapest, p) =>
      (p.cityPricing[citySlug]?.typical ?? Infinity) <
      (cheapest.cityPricing[citySlug]?.typical ?? Infinity)
        ? p
        : cheapest,
    procsWithCityPricing[0]
  );

  const regulator = getRegulator(citySlug);

  let answer = `This guide covers ${procsWithCityPricing.length} medical procedures in ${cityName} relevant to ${guide.audience.split(",")[0].toLowerCase()}.`;

  if (avgTypical > 0) {
    answer += ` The average typical price for these procedures in ${cityName} is ${formatAed(avgTypical)}.`;
  }

  if (cheapestProc?.cityPricing[citySlug]) {
    answer += ` The most affordable procedure is ${cheapestProc.name.toLowerCase()} at ${formatAed(cheapestProc.cityPricing[citySlug].typical)} typical.`;
  }

  answer += ` Healthcare in ${cityName} is regulated by the ${regulator}. Prices reflect market data as of March 2026.`;

  return answer;
}

/** Generate city-specific tips */
function getCitySpecificTips(
  guideSlug: string,
  citySlug: string,
  cityName: string
): string[] {
  const baseTips: string[] = [];

  // City-specific healthcare tips
  if (citySlug === "dubai") {
    baseTips.push(
      `Dubai Healthcare City (DHCC) in ${cityName} has the highest concentration of specialist clinics — compare multiple providers within walking distance.`
    );
    if (guideSlug === "for-tourists") {
      baseTips.push(
        "Dubai hospitals are experienced with international patients. American Hospital, Mediclinic, and Saudi German Hospital all have multilingual staff and international insurance desks."
      );
    }
    if (guideSlug === "budget-healthcare") {
      baseTips.push(
        "Rashid Hospital and Dubai Hospital (DHA government facilities) offer the lowest prices in Dubai for most procedures."
      );
    }
    if (guideSlug === "without-insurance") {
      baseTips.push(
        "DHA primary health centres in Deira, Al Karama, and Al Barsha offer GP consultations from AED 100-200 for self-pay patients."
      );
    }
  } else if (citySlug === "abu-dhabi") {
    baseTips.push(
      `Abu Dhabi pricing is governed by the DOH Mandatory Tariff (Shafafiya) — facilities charge 1x-3x the base tariff depending on their tier.`
    );
    if (guideSlug === "premium-healthcare") {
      baseTips.push(
        "Cleveland Clinic Abu Dhabi on Al Maryah Island is the UAE's only multi-specialty hospital affiliated with a top US medical institution."
      );
    }
    if (guideSlug === "maternity-costs") {
      baseTips.push(
        "Corniche Hospital in Abu Dhabi is the largest government maternity hospital, offering affordable delivery packages with experienced teams."
      );
    }
  } else if (citySlug === "sharjah") {
    baseTips.push(
      `Sharjah offers 25-35% lower prices than Dubai for most procedures, making it a popular choice for budget-conscious residents.`
    );
    baseTips.push(
      "Al Nahda and Al Taawun areas in Sharjah have the highest density of clinics and hospitals, making it easy to compare prices."
    );
  } else if (citySlug === "ajman") {
    baseTips.push(
      `Ajman has some of the lowest healthcare prices in the UAE — ideal for budget-conscious patients and those paying self-pay.`
    );
    baseTips.push(
      "Thumbay Hospital Ajman and GMC Hospital are the main private facilities. Government clinics offer the lowest rates."
    );
  } else if (citySlug === "ras-al-khaimah") {
    baseTips.push(
      `RAK Hospital and Saqr Hospital are the main facilities in Ras Al Khaimah, offering competitive rates for most procedures.`
    );
    if (guideSlug === "for-tourists") {
      baseTips.push(
        "Ras Al Khaimah is growing as a wellness tourism destination with competitive rates for dental, dermatology, and rehabilitation services."
      );
    }
  } else if (citySlug === "fujairah") {
    baseTips.push(
      `Fujairah Hospital is the main government facility. For specialist care, some patients travel to Sharjah or Dubai.`
    );
  } else if (citySlug === "umm-al-quwain") {
    baseTips.push(
      `Umm Al Quwain has the lowest healthcare prices in the UAE due to lower operating costs and rents.`
    );
    baseTips.push(
      "For specialist procedures not available locally, Sheikh Khalifa Hospital or facilities in Ajman and Sharjah are the nearest options."
    );
  } else if (citySlug === "al-ain") {
    baseTips.push(
      `Tawam Hospital in Al Ain is a leading government facility with specialist departments and affordable rates under the DOH tariff.`
    );
    baseTips.push(
      "Al Ain is part of the Abu Dhabi emirate, so DOH Mandatory Tariff pricing applies — the same base rates as Abu Dhabi city."
    );
  }

  return baseTips;
}

/** Generate city-specific FAQs */
function generateCityGuideFaqs(
  guide: typeof PRICING_GUIDES[number],
  city: typeof CITIES[number],
  featuredProcs: typeof PROCEDURES
): { question: string; answer: string }[] {
  const procsWithPricing = featuredProcs.filter(
    (p) => p.cityPricing[city.slug]
  );
  const avgTypical =
    procsWithPricing.length > 0
      ? Math.round(
          procsWithPricing.reduce(
            (sum, p) => sum + (p.cityPricing[city.slug]?.typical ?? 0),
            0
          ) / procsWithPricing.length
        )
      : 0;

  const cheapestProc = procsWithPricing.length > 0
    ? procsWithPricing.reduce((c, p) =>
        (p.cityPricing[city.slug]?.typical ?? Infinity) <
        (c.cityPricing[city.slug]?.typical ?? Infinity)
          ? p
          : c
      )
    : null;

  const mostExpensiveProc = procsWithPricing.length > 0
    ? procsWithPricing.reduce((c, p) =>
        (p.cityPricing[city.slug]?.typical ?? 0) >
        (c.cityPricing[city.slug]?.typical ?? 0)
          ? p
          : c
      )
    : null;

  const regulator = getRegulator(city.slug);

  const faqs: { question: string; answer: string }[] = [];

  // FAQ 1: always about this guide topic + city
  if (guide.slug === "without-insurance") {
    faqs.push({
      question: `How much does medical care cost without insurance in ${city.name}?`,
      answer: `Without insurance, the average typical price for common medical procedures in ${city.name} is ${formatAed(avgTypical)}. ${cheapestProc ? `The most affordable procedure is ${cheapestProc.name.toLowerCase()} at ${formatAed(cheapestProc.cityPricing[city.slug]?.typical ?? 0)} typical.` : ""} Government facilities regulated by the ${regulator} offer the lowest self-pay rates.`,
    });
  } else if (guide.slug === "for-tourists") {
    faqs.push({
      question: `How much does medical treatment cost for tourists in ${city.name}?`,
      answer: `Tourist medical costs in ${city.name} depend on the procedure. The average typical price across common procedures is ${formatAed(avgTypical)}. Walk-in GP consultations cost AED 150-400. ER visits cost AED 500-1,500. Most major hospitals in ${city.name} accept travel insurance and have English-speaking staff.`,
    });
  } else if (guide.slug === "for-expats") {
    faqs.push({
      question: `What are typical healthcare costs for expats in ${city.name}?`,
      answer: `With mandatory insurance, expats in ${city.name} typically pay 10-20% co-pay for covered procedures. The full price for common procedures averages ${formatAed(avgTypical)}. With a standard co-pay of 20%, your out-of-pocket would be approximately ${formatAed(Math.round(avgTypical * 0.2))} per visit.`,
    });
  } else if (guide.slug === "budget-healthcare") {
    faqs.push({
      question: `What are the cheapest healthcare options in ${city.name}?`,
      answer: `The most affordable medical care in ${city.name} is available at government facilities regulated by the ${regulator}. ${cheapestProc ? `The cheapest common procedure is ${cheapestProc.name.toLowerCase()} starting from ${formatAed(cheapestProc.cityPricing[city.slug]?.min ?? 0)}.` : ""} Average typical prices in ${city.name} are ${formatAed(avgTypical)} across common procedures.`,
    });
  } else if (guide.slug === "premium-healthcare") {
    faqs.push({
      question: `What does premium healthcare cost in ${city.name}?`,
      answer: `Premium healthcare in ${city.name} is priced at the top of the tariff range. ${mostExpensiveProc ? `The most expensive procedure in this guide is ${mostExpensiveProc.name.toLowerCase()} at up to ${formatAed(mostExpensiveProc.cityPricing[city.slug]?.max ?? 0)}.` : ""} Premium facilities in ${city.name} use DOH tariff multipliers of 2.5-3x, offering private rooms, shorter waits, and named consultant access.`,
    });
  } else {
    // maternity
    faqs.push({
      question: `How much does maternity care cost in ${city.name}?`,
      answer: `Maternity costs in ${city.name} range from AED 15,000 to AED 50,000 for the full pregnancy journey. Normal delivery typically costs AED 8,000-25,000 and C-section AED 15,000-45,000 depending on the facility type. Government hospitals in ${city.name} offer the most affordable maternity packages.`,
    });
  }

  // FAQ 2: provider recommendations
  faqs.push({
    question: `Where can I find healthcare providers in ${city.name}?`,
    answer: `Browse the UAE Open Healthcare Directory for a comprehensive list of licensed healthcare providers in ${city.name}. Filter by specialty, insurance acceptance, rating, and location. All listings include contact details, operating hours, and directions. Healthcare in ${city.name} is regulated by the ${regulator}.`,
  });

  // FAQ 3: comparison with other cities
  const otherCities = CITIES.filter((c) => c.slug !== city.slug).slice(0, 2);
  const otherCityPrices = otherCities.map((oc) => {
    const avg = procsWithPricing.reduce(
      (sum, p) => sum + (p.cityPricing[oc.slug]?.typical ?? 0),
      0
    );
    return {
      name: oc.name,
      avg: procsWithPricing.length > 0 ? Math.round(avg / procsWithPricing.length) : 0,
    };
  });

  faqs.push({
    question: `How do ${city.name} medical prices compare to other UAE cities?`,
    answer: `The average typical price in ${city.name} is ${formatAed(avgTypical)} for the procedures in this guide. ${otherCityPrices.map((oc) => `In ${oc.name}, the same procedures average ${formatAed(oc.avg)}`).join(". ")}. Price differences reflect facility costs, market dynamics, and regulatory frameworks in each emirate.`,
  });

  // FAQ 4: insurance
  faqs.push({
    question: `Do providers in ${city.name} accept insurance?`,
    answer: `Yes. Most healthcare providers in ${city.name} accept major UAE insurance plans. The ${regulator} oversees healthcare delivery in ${city.name}. Major insurers (Daman, AXA, Cigna, MetLife, Bupa, Oman Insurance) have networks covering ${city.name} providers. Always verify that a specific provider is in your insurance network before booking.`,
  });

  return faqs;
}

export default async function CityGuidePage({ params }: PageProps) {
  const { guide: guideSlug, city: citySlug } = await params;
  const guide = getGuideBySlug(guideSlug);
  const city = CITIES.find((c) => c.slug === citySlug);
  if (!guide || !city) notFound();

  const base = getBaseUrl();
  const Icon = ICON_MAP[guide.icon] || ShieldOff;

  const pageTitle = `${guide.name.replace("in UAE", "").replace("in the UAE", "").trim()} in ${city.name}`;

  // Resolve featured procedures
  const featuredProcs = guide.featuredProcedures
    .map((s) => getProcedureBySlug(s))
    .filter(Boolean) as typeof PROCEDURES;

  // Filter to procedures that have city pricing
  const procsWithCityPricing = featuredProcs.filter(
    (p) => p.cityPricing[citySlug]
  );

  // Sort by typical price ascending
  const sortedProcs = [...procsWithCityPricing].sort(
    (a, b) =>
      (a.cityPricing[citySlug]?.typical ?? 0) -
      (b.cityPricing[citySlug]?.typical ?? 0)
  );

  const answerText = generateCityGuideAnswer(
    guide,
    city.name,
    citySlug,
    featuredProcs
  );

  const cityTips = getCitySpecificTips(guide.slug, citySlug, city.name);
  // Combine city-specific tips with a subset of guide tips
  const allTips = [...cityTips, ...guide.tips.slice(0, 4)];

  const faqs = generateCityGuideFaqs(guide, city, featuredProcs);

  // Compare with other cities
  const otherCityAverages = CITIES.filter((c) => c.slug !== citySlug)
    .map((c) => {
      const typicals = procsWithCityPricing
        .map((p) => p.cityPricing[c.slug]?.typical)
        .filter(Boolean) as number[];
      const avg =
        typicals.length > 0
          ? Math.round(typicals.reduce((a, b) => a + b, 0) / typicals.length)
          : 0;
      return { city: c, avg };
    })
    .filter((c) => c.avg > 0)
    .sort((a, b) => a.avg - b.avg);

  const currentCityAvg =
    procsWithCityPricing.length > 0
      ? Math.round(
          procsWithCityPricing.reduce(
            (sum, p) => sum + (p.cityPricing[citySlug]?.typical ?? 0),
            0
          ) / procsWithCityPricing.length
        )
      : 0;

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd
        data={breadcrumbSchema([
          { name: "UAE", url: base },
          { name: "Medical Procedure Costs", url: `${base}/pricing` },
          { name: "Pricing Guides", url: `${base}/pricing/guide` },
          {
            name: guide.name,
            url: `${base}/pricing/guide/${guide.slug}`,
          },
          { name: city.name },
        ])}
      />
      <JsonLd data={speakableSchema([".answer-block"])} />
      <JsonLd data={faqPageSchema(faqs)} />
      <JsonLd
        data={medicalWebPageSchema(
          pageTitle,
          `${guide.description.split(".")[0]} in ${city.name}.`,
          "2026-03-25"
        )}
      />

      <Breadcrumb
        items={[
          { label: "UAE", href: "/" },
          { label: "Medical Procedure Costs", href: "/pricing" },
          { label: "Pricing Guides", href: "/pricing/guide" },
          { label: guide.name, href: `/pricing/guide/${guide.slug}` },
          { label: city.name },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <Icon className="w-8 h-8 text-[#006828]" />
          <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight">{pageTitle}</h1>
        </div>
        <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 mb-6" data-answer-block="true">
          <p className="font-['Geist',sans-serif] text-black/40 leading-relaxed">{answerText}</p>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            {
              value: procsWithCityPricing.length.toString(),
              label: "Procedures priced",
            },
            {
              value: currentCityAvg > 0 ? formatAed(currentCityAvg) : "N/A",
              label: "Avg. typical price",
            },
            {
              value: sortedProcs[0]
                ? formatAed(sortedProcs[0].cityPricing[citySlug]?.min ?? 0)
                : "N/A",
              label: "Lowest starting price",
            },
            {
              value: allTips.length.toString(),
              label: "Tips for you",
            },
          ].map(({ value, label }) => (
            <div key={label} className="bg-[#f8f8f6] p-4 text-center">
              <p className="text-2xl font-bold text-[#006828]">{value}</p>
              <p className="font-['Geist',sans-serif] text-xs text-black/40">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* City-specific Procedure Prices */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Procedure Prices in {city.name}</h2>
      </div>
      <p className="font-['Geist',sans-serif] text-xs text-black/40 mb-4">
        Prices for {city.name} facilities. Click any procedure for full details and
        insurance calculator.
      </p>
      <div className="border border-black/[0.06] divide-y divide-light-200 mb-10">
        <div className="hidden sm:grid grid-cols-12 gap-2 p-3 bg-[#f8f8f6] text-[10px] font-bold text-black/40 uppercase tracking-wider">
          <div className="col-span-4">Procedure</div>
          <div className="col-span-2 text-right">Min</div>
          <div className="col-span-2 text-right">Typical</div>
          <div className="col-span-2 text-right">Max</div>
          <div className="col-span-2 text-right">Insurance</div>
        </div>
        {sortedProcs.map((proc) => {
          const cp = proc.cityPricing[citySlug];
          if (!cp) return null;

          const coverageColor =
            proc.insuranceCoverage === "typically-covered"
              ? "text-green-700 bg-green-50"
              : proc.insuranceCoverage === "partially-covered"
              ? "text-yellow-700 bg-yellow-50"
              : proc.insuranceCoverage === "rarely-covered"
              ? "text-orange-700 bg-orange-50"
              : "text-red-700 bg-red-50";

          const coverageLabel =
            proc.insuranceCoverage === "typically-covered"
              ? "Covered"
              : proc.insuranceCoverage === "partially-covered"
              ? "Partial"
              : proc.insuranceCoverage === "rarely-covered"
              ? "Rare"
              : "Not covered";

          return (
            <Link
              key={proc.slug}
              href={`/pricing/${proc.slug}/${citySlug}`}
              className="grid grid-cols-12 gap-2 p-3 hover:bg-[#f8f8f6] transition-colors group items-center"
            >
              <div className="col-span-12 sm:col-span-4">
                <h3 className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
                  {proc.name}
                </h3>
                <p className="text-[10px] text-black/40 sm:hidden">
                  {formatAed(cp.min)} – {formatAed(cp.max)}
                </p>
              </div>
              <div className="hidden sm:block col-span-2 text-right text-sm text-black/40">
                {formatAed(cp.min)}
              </div>
              <div className="hidden sm:block col-span-2 text-right font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight">
                {formatAed(cp.typical)}
              </div>
              <div className="hidden sm:block col-span-2 text-right text-sm text-black/40">
                {formatAed(cp.max)}
              </div>
              <div className="hidden sm:flex col-span-2 justify-end">
                <span
                  className={`text-[10px] font-medium px-2 py-0.5 ${coverageColor}`}
                >
                  {coverageLabel}
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Compare with Other Cities */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Compare with Other Cities</h2>
      </div>
      <p className="font-['Geist',sans-serif] text-xs text-black/40 mb-4">
        How {city.name} compares to other UAE cities for the same procedures.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
        {/* Current city first */}
        <div className="border-2 border-[#006828] p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <MapPin className="w-3.5 h-3.5 text-[#006828]" />
            <span className="text-xs font-bold text-[#006828]">
              {city.name}
            </span>
          </div>
          <p className="text-lg font-bold text-[#1c1c1c]">
            {formatAed(currentCityAvg)}
          </p>
          <p className="text-[9px] text-black/40">avg. typical (current)</p>
        </div>
        {otherCityAverages.slice(0, 7).map(({ city: otherCity, avg }) => {
          const diff = currentCityAvg > 0
            ? Math.round(((avg - currentCityAvg) / currentCityAvg) * 100)
            : 0;
          return (
            <Link
              key={otherCity.slug}
              href={`/pricing/guide/${guide.slug}/${otherCity.slug}`}
              className="border border-black/[0.06] p-3 hover:border-[#006828]/15 transition-colors group"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <MapPin className="w-3.5 h-3.5 text-black/40 group-hover:text-[#006828]" />
                <span className="text-xs font-bold text-[#1c1c1c] group-hover:text-[#006828] transition-colors">
                  {otherCity.name}
                </span>
              </div>
              <p className="text-lg font-bold text-[#1c1c1c]">
                {formatAed(avg)}
              </p>
              <p className="text-[9px] text-black/40">
                {diff > 0 ? `+${diff}%` : `${diff}%`} vs {city.name}
              </p>
            </Link>
          );
        })}
      </div>

      {/* Tips */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Tips for {city.name}</h2>
      </div>
      <div className="bg-[#f8f8f6] border border-black/[0.06] rounded-2xl p-6 mb-10">
        <div className="space-y-4">
          {allTips.map((tip, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-[#006828] text-white flex items-center justify-center text-xs font-bold">
                {i + 1}
              </div>
              <p className="font-['Geist',sans-serif] text-sm text-black/40 leading-relaxed">{tip}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Provider Recommendations */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Find Providers in {city.name}</h2>
      </div>
      <div className="bg-[#f8f8f6] border border-black/[0.06] rounded-2xl p-6 mb-10">
        <p className="font-['Geist',sans-serif] text-sm text-black/40 mb-4">
          Browse the UAE Open Healthcare Directory to find licensed healthcare
          providers in {city.name} that match your needs and budget.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/directory/${citySlug}/clinics`}
            className="text-xs text-[#006828] border border-[#006828] px-3 py-1.5 hover:bg-[#006828] hover:text-white transition-colors inline-flex items-center gap-1.5"
          >
            Clinics in {city.name}
            <ExternalLink className="w-3 h-3" />
          </Link>
          <Link
            href={`/directory/${citySlug}/hospitals`}
            className="text-xs text-[#006828] border border-[#006828] px-3 py-1.5 hover:bg-[#006828] hover:text-white transition-colors inline-flex items-center gap-1.5"
          >
            Hospitals in {city.name}
            <ExternalLink className="w-3 h-3" />
          </Link>
          <Link
            href={`/directory/${citySlug}/dental`}
            className="text-xs text-[#006828] border border-[#006828] px-3 py-1.5 hover:bg-[#006828] hover:text-white transition-colors inline-flex items-center gap-1.5"
          >
            Dental in {city.name}
            <ExternalLink className="w-3 h-3" />
          </Link>
          <Link
            href={`/directory/${citySlug}/labs-diagnostics`}
            className="text-xs text-[#006828] border border-[#006828] px-3 py-1.5 hover:bg-[#006828] hover:text-white transition-colors inline-flex items-center gap-1.5"
          >
            Labs in {city.name}
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Insurance Section */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Insurance in {city.name}</h2>
      </div>
      <div className="bg-[#f8f8f6] border border-black/[0.06] rounded-2xl p-6 mb-10">
        <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 space-y-3" data-answer-block="true">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-[#006828] flex-shrink-0 mt-0.5" />
            <p className="font-['Geist',sans-serif] text-sm text-black/40">
              <strong className="text-[#1c1c1c]">
                Regulated by {getRegulator(citySlug)}:
              </strong>{" "}
              {citySlug === "dubai"
                ? "Dubai mandates employer-provided health insurance under the DHA Essential Benefits Plan. Major insurers include Daman, AXA, Cigna, MetLife, and Bupa."
                : citySlug === "abu-dhabi" || citySlug === "al-ain"
                ? "Abu Dhabi mandates health insurance under the DOH framework. UAE nationals are covered by Thiqa. Expats are typically covered by Daman or employer plans."
                : "MOHAP oversees healthcare in this emirate. Common plans include Daman, AXA, Cigna, and Orient Insurance. Many employers offer group plans."}
            </p>
          </div>
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-[#006828] flex-shrink-0 mt-0.5" />
            <p className="font-['Geist',sans-serif] text-sm text-black/40">
              <strong className="text-[#1c1c1c]">Coverage for this guide:</strong>{" "}
              Of the {procsWithCityPricing.length} procedures priced in{" "}
              {city.name},{" "}
              {
                procsWithCityPricing.filter(
                  (p) => p.insuranceCoverage === "typically-covered"
                ).length
              }{" "}
              are typically covered,{" "}
              {
                procsWithCityPricing.filter(
                  (p) => p.insuranceCoverage === "partially-covered"
                ).length
              }{" "}
              partially covered, and{" "}
              {
                procsWithCityPricing.filter(
                  (p) =>
                    p.insuranceCoverage === "not-covered" ||
                    p.insuranceCoverage === "rarely-covered"
                ).length
              }{" "}
              rarely or not covered.
            </p>
          </div>
        </div>
      </div>

      {/* Other Cities for This Guide */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">This Guide in Other Cities</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
        {CITIES.filter((c) => c.slug !== citySlug).map((c) => (
          <Link
            key={c.slug}
            href={`/pricing/guide/${guide.slug}/${c.slug}`}
            className="border border-black/[0.06] p-3 hover:border-[#006828]/15 transition-colors group text-center"
          >
            <h3 className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
              {c.name}
            </h3>
            <p className="text-[10px] text-black/40">View prices</p>
          </Link>
        ))}
      </div>

      {/* Other Guides */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Other Pricing Guides</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-10">
        {PRICING_GUIDES.filter((g) => g.slug !== guide.slug).map((g) => {
          const OtherIcon = ICON_MAP[g.icon] || ShieldOff;
          return (
            <Link
              key={g.slug}
              href={`/pricing/guide/${g.slug}/${citySlug}`}
              className="border border-black/[0.06] rounded-2xl p-5 hover:border-[#006828]/15 transition-colors group flex items-center gap-3"
            >
              <OtherIcon className="w-5 h-5 text-[#006828] flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h3 className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors truncate">
                  {g.name.replace("in UAE", "").replace("in the UAE", "").trim()} in {city.name}
                </h3>
                <p className="text-[10px] text-black/40 truncate">
                  {g.featuredProcedures.length} procedures
                </p>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-black/40 group-hover:text-[#006828] flex-shrink-0" />
            </Link>
          );
        })}
      </div>

      {/* FAQ */}
      <FaqSection faqs={faqs} title={`${pageTitle} — FAQ`} />

      {/* Disclaimer */}
      <div className="mt-8 border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>Disclaimer:</strong> All prices shown are indicative ranges
          for {city.name} based on the DOH Mandatory Tariff (Shafafiya) methodology,
          DHA DRG parameters, and market-observed data as of March 2026. Actual
          costs vary by facility, doctor, clinical complexity, and insurance
          plan. This tool is for informational purposes only and does not
          constitute medical or financial advice. Always obtain a personalised
          quote from the healthcare provider before proceeding with any
          procedure.
        </p>
      </div>
    </div>
  );
}
