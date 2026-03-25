import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertCircle, Clock, MapPin } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { FaqSection } from "@/components/seo/FaqSection";
import { TestPriceTable } from "@/components/labs/TestPriceTable";
import {
  LAB_TESTS,
  getLabTest,
  getTestPriceComparisonInCity,
  getTestsByCategory,
  getTestCategoryLabel,
  getLabsByCity,
  formatPrice,
} from "@/lib/labs";
import { CITIES } from "@/lib/constants/cities";
import { breadcrumbSchema, faqPageSchema, speakableSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

export const revalidate = 43200;

export function generateStaticParams() {
  const params: { test: string; city: string }[] = [];
  for (const test of LAB_TESTS) {
    for (const city of CITIES) {
      params.push({ test: test.slug, city: city.slug });
    }
  }
  return params;
}

function getCityName(slug: string): string {
  return CITIES.find((c) => c.slug === slug)?.name || slug.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

function getCityRegulator(slug: string): string {
  if (slug === "dubai") return "DHA";
  if (slug === "abu-dhabi" || slug === "al-ain") return "DOH";
  return "MOHAP";
}

export function generateMetadata({ params }: { params: { test: string; city: string } }): Metadata {
  const test = getLabTest(params.test);
  const cityName = getCityName(params.city);
  if (!test) return { title: "Not Found" };

  const base = getBaseUrl();
  const comparison = getTestPriceComparisonInCity(params.test, params.city);
  const range = comparison?.priceRange;

  return {
    title: `${test.name} Price in ${cityName} — Compare ${comparison?.prices.length || 0} Labs ${range ? `from ${formatPrice(range.min)}` : ""} | UAE Lab Tests`,
    description:
      `How much does a ${test.shortName} test cost in ${cityName}? Compare prices across ${comparison?.prices.length || 0} ${getCityRegulator(params.city)}-licensed labs. ` +
      `${range ? `Prices range from ${formatPrice(range.min)} to ${formatPrice(range.max)}, save up to ${range.savingsPercent}%. ` : ""}` +
      `Home collection available. ${test.fastingRequired ? "Fasting required." : "No fasting needed."}`,
    alternates: { canonical: `${base}/labs/test/${params.test}/${params.city}` },
    openGraph: {
      title: `${test.shortName} Test Price in ${cityName} — Compare Labs`,
      description: `${test.name} costs ${range ? `${formatPrice(range.min)}–${formatPrice(range.max)}` : "varies"} in ${cityName}. Compare and save.`,
      url: `${base}/labs/test/${params.test}/${params.city}`,
    },
  };
}

export default function TestCityPage({ params }: { params: { test: string; city: string } }) {
  const test = getLabTest(params.test);
  const city = CITIES.find((c) => c.slug === params.city);
  if (!test || !city) notFound();

  const base = getBaseUrl();
  const comparison = getTestPriceComparisonInCity(test.slug, city.slug);
  const range = comparison?.priceRange;
  const cityLabs = getLabsByCity(city.slug);
  const relatedTests = getTestsByCategory(test.category).filter((t) => t.slug !== test.slug).slice(0, 6);
  const otherCities = CITIES.filter((c) => c.slug !== city.slug);

  const faqs = [
    {
      question: `How much does a ${test.shortName} test cost in ${city.name}?`,
      answer: range
        ? `A ${test.name} in ${city.name} costs between ${formatPrice(range.min)} and ${formatPrice(range.max)}, depending on the laboratory. ${comparison!.prices[0] ? `The cheapest option is ${comparison!.prices[0].labName} at ${formatPrice(comparison!.prices[0].price)}.` : ""} By comparing ${comparison!.prices.length} ${getCityRegulator(city.slug)}-licensed labs, you can save up to ${formatPrice(range.savings)} (${range.savingsPercent}%).`
        : `Pricing for ${test.name} in ${city.name} varies by laboratory. Contact labs directly for current pricing.`,
    },
    {
      question: `Which is the cheapest lab for ${test.shortName} in ${city.name}?`,
      answer: comparison && comparison.prices.length > 0
        ? `The cheapest lab for ${test.name} in ${city.name} is ${comparison.prices[0].labName} at ${formatPrice(comparison.prices[0].price)}. ${comparison.prices[0].homeCollection ? `They offer home collection${comparison.prices[0].homeCollectionFee === 0 ? " for free" : ` for AED ${comparison.prices[0].homeCollectionFee}`}.` : "Walk-in only."}`
        : `Contact labs in ${city.name} directly for current ${test.shortName} pricing.`,
    },
    {
      question: `Can I get a ${test.shortName} test at home in ${city.name}?`,
      answer: `Yes, several labs in ${city.name} offer home sample collection for ${test.name}. ${cityLabs.filter((l) => l.homeCollection).map((l) => l.name).join(", ")} all provide home phlebotomy services with DHA/DOH/MOHAP-certified nurses. Results are typically delivered digitally within ${test.turnaroundHours} hours.`,
    },
    {
      question: `Do I need to fast before a ${test.shortName} test in ${city.name}?`,
      answer: test.fastingRequired
        ? `Yes, fasting for 8-12 hours is required before a ${test.name}. Water is allowed. Morning appointments (7-9 AM) are recommended. This applies at all labs in ${city.name}.`
        : `No, fasting is not required for a ${test.name}. You can visit any lab in ${city.name} at any time without dietary restrictions.`,
    },
  ];

  return (
    <div className="container-tc py-8">
      <JsonLd data={breadcrumbSchema([{ name: "UAE", url: base }, { name: "Lab Tests", url: `${base}/labs` }, { name: test.shortName, url: `${base}/labs/test/${test.slug}` }, { name: city.name }])} />
      <JsonLd data={speakableSchema([".answer-block"])} />
      <JsonLd data={faqPageSchema(faqs)} />
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "MedicalTest",
        name: `${test.name} in ${city.name}`,
        alternateName: test.shortName,
        description: `${test.description} Compare prices in ${city.name}.`,
        url: `${base}/labs/test/${test.slug}/${city.slug}`,
        availableIn: { "@type": "City", name: city.name },
        ...(comparison && {
          offers: comparison.prices.map((p) => ({
            "@type": "Offer",
            price: p.price,
            priceCurrency: "AED",
            seller: { "@type": "MedicalBusiness", name: p.labName },
            areaServed: { "@type": "City", name: city.name },
          })),
        }),
      }} />

      <Breadcrumb items={[{ label: "UAE", href: "/" }, { label: "Lab Tests", href: "/labs" }, { label: test.shortName, href: `/labs/test/${test.slug}` }, { label: city.name }]} />

      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="w-4 h-4 text-accent" />
          <span className="text-[11px] bg-accent-muted text-accent-dark px-2 py-0.5 font-bold uppercase">{city.name}</span>
          <span className="text-[11px] bg-light-100 text-dark px-2 py-0.5 font-bold uppercase">{getTestCategoryLabel(test.category)}</span>
        </div>
        <h1 className="text-3xl font-bold text-dark mb-3">
          {test.name} Price in {city.name}
        </h1>
        <div className="answer-block" data-answer-block="true">
          <p className="text-muted leading-relaxed mb-4">
            {test.description}
            {range && (
              <> In {city.name}, a {test.shortName} test costs between <strong>{formatPrice(range.min)}</strong> and <strong>{formatPrice(range.max)}</strong> across {comparison!.prices.length} {getCityRegulator(city.slug)}-licensed laboratories.
              {range.savingsPercent > 0 && <> Save up to <strong>{range.savingsPercent}%</strong> by comparing prices below.</>}</>
            )}
            {!range && <> Contact labs in {city.name} for current pricing.</>}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {range && (
            <div className="bg-light-50 p-3">
              <p className="text-lg font-bold text-accent">{formatPrice(range.min)}</p>
              <p className="text-[11px] text-muted">Cheapest in {city.name}</p>
            </div>
          )}
          {range && range.savings > 0 && (
            <div className="bg-light-50 p-3">
              <p className="text-lg font-bold text-accent">{formatPrice(range.savings)}</p>
              <p className="text-[11px] text-muted">Max savings ({range.savingsPercent}%)</p>
            </div>
          )}
          <div className="bg-light-50 p-3">
            <p className="text-xs font-bold text-dark">{cityLabs.length} labs</p>
            <p className="text-[11px] text-muted">in {city.name}</p>
          </div>
          <div className="bg-light-50 p-3">
            <div className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-accent" /><p className="text-xs font-bold text-dark">{test.turnaroundHours}h</p></div>
            <p className="text-[11px] text-muted">Turnaround time</p>
          </div>
        </div>

        {test.fastingRequired && (
          <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 mb-6">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <p className="text-xs text-amber-800"><strong>Fasting required:</strong> 8-12 hours. Morning appointments recommended.</p>
          </div>
        )}
      </div>

      {comparison && (
        <div className="mb-8">
          <div className="section-header"><h2>{test.shortName} Prices Across {city.name} Labs</h2><span className="arrows">&gt;&gt;&gt;</span></div>
          <TestPriceTable comparison={comparison} />
        </div>
      )}

      {!comparison && (
        <div className="mb-8 p-6 bg-light-50 text-center">
          <p className="text-sm text-muted">No labs in {city.name} currently list prices for {test.name}.</p>
          <Link href={`/labs/test/${test.slug}`} className="text-xs font-bold text-accent mt-2 inline-block">View UAE-wide prices →</Link>
        </div>
      )}

      {/* Other cities */}
      <div className="mb-8">
        <div className="section-header"><h2>{test.shortName} Prices in Other UAE Cities</h2><span className="arrows">&gt;&gt;&gt;</span></div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {otherCities.map((c) => (
            <Link key={c.slug} href={`/labs/test/${test.slug}/${c.slug}`} className="p-3 border border-light-200 hover:border-accent transition-colors group">
              <p className="text-xs font-bold text-dark group-hover:text-accent">{c.name}</p>
              <p className="text-[10px] text-muted">Compare prices →</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Related tests */}
      {relatedTests.length > 0 && (
        <div className="mb-8">
          <div className="section-header"><h2>Related Tests in {city.name}</h2><span className="arrows">&gt;&gt;&gt;</span></div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {relatedTests.map((t) => (
              <Link key={t.slug} href={`/labs/test/${t.slug}/${city.slug}`} className="p-3 border border-light-200 hover:border-accent transition-colors group">
                <p className="text-sm font-bold text-dark group-hover:text-accent">{t.shortName}</p>
                <p className="text-[11px] text-muted line-clamp-1">{t.name}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      <FaqSection faqs={faqs} title={`${test.shortName} in ${city.name} — FAQ`} />

      <div className="mt-8 border-t border-light-200 pt-4">
        <p className="text-[11px] text-muted leading-relaxed">
          <strong>Disclaimer:</strong> Prices for {test.name} in {city.name} are indicative. Actual prices may vary by branch, insurance, and promotions. Confirm with the lab before booking. Last verified March 2026.
        </p>
      </div>
    </div>
  );
}
