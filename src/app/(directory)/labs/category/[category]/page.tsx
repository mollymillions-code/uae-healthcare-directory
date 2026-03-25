import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { FaqSection } from "@/components/seo/FaqSection";
import {
  TEST_CATEGORIES,
  LAB_TESTS,
  getTestsByCategory,
  getPriceRange,
  formatPrice,
  type TestCategory,
} from "@/lib/labs";
import { breadcrumbSchema, faqPageSchema, speakableSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

export const revalidate = 43200;

export function generateStaticParams() {
  return TEST_CATEGORIES.map((cat) => ({ category: cat.slug }));
}

export function generateMetadata({
  params,
}: {
  params: { category: string };
}): Metadata {
  const cat = TEST_CATEGORIES.find((c) => c.slug === params.category);
  if (!cat) return { title: "Category Not Found" };

  const base = getBaseUrl();
  const tests = getTestsByCategory(cat.slug as TestCategory);
  const prices = tests
    .map((t) => getPriceRange(t.slug))
    .filter(Boolean);
  const cheapest = prices.length > 0 ? Math.min(...prices.map((p) => p!.min)) : null;

  return {
    title: `${cat.name} Prices in UAE — Compare ${tests.length} Tests Across Labs | UAE Lab Test Comparison`,
    description:
      `Compare ${tests.length} ${cat.name.toLowerCase()} test prices across UAE laboratories. ` +
      `${cheapest ? `Prices start from AED ${cheapest}. ` : ""}` +
      `Find the cheapest ${cat.name.toLowerCase()} in Dubai, Abu Dhabi, and Sharjah with home collection options.`,
    alternates: { canonical: `${base}/labs/category/${cat.slug}` },
    openGraph: {
      title: `${cat.name} — Compare Prices Across UAE Labs`,
      description: `${tests.length} ${cat.name.toLowerCase()} tests compared across UAE labs. ${cheapest ? `From AED ${cheapest}.` : ""}`,
      url: `${base}/labs/category/${cat.slug}`,
      type: "website",
    },
  };
}

export default function TestCategoryPage({
  params,
}: {
  params: { category: string };
}) {
  const cat = TEST_CATEGORIES.find((c) => c.slug === params.category);
  if (!cat) notFound();

  const base = getBaseUrl();
  const tests = getTestsByCategory(cat.slug as TestCategory);

  // Build price data for each test
  const testsWithPrices = tests.map((test) => {
    const range = getPriceRange(test.slug);
    return { ...test, priceRange: range };
  });

  const totalPricePoints = testsWithPrices.filter((t) => t.priceRange).length;
  const cheapestOverall = testsWithPrices
    .filter((t) => t.priceRange)
    .reduce<number | null>(
      (min, t) => (min === null || t.priceRange!.min < min ? t.priceRange!.min : min),
      null
    );

  const faqs = [
    {
      question: `How many ${cat.name.toLowerCase()} tests are available in the UAE?`,
      answer:
        `There are ${tests.length} ${cat.name.toLowerCase()} tests tracked across UAE laboratories ` +
        `on the UAE Open Healthcare Directory. These include ` +
        `${tests.slice(0, 4).map((t) => t.shortName).join(", ")}${tests.length > 4 ? ", and more" : ""}. ` +
        `Prices and availability vary by lab.`,
    },
    {
      question: `How much do ${cat.name.toLowerCase()} tests cost in the UAE?`,
      answer:
        cheapestOverall !== null
          ? `${cat.name} test prices in the UAE start from AED ${cheapestOverall}. ` +
            `Prices vary significantly between labs — comparing across ${totalPricePoints} available tests ` +
            `can save you up to 50%. Budget labs like Medsol and Alpha Medical generally offer the lowest prices, ` +
            `while premium labs like Unilabs charge more but include international accreditation and advanced diagnostics.`
          : `${cat.name} test prices vary by lab. Compare prices across UAE laboratories on this page.`,
    },
    {
      question: `Do I need a doctor's referral for ${cat.name.toLowerCase()} tests?`,
      answer:
        `Most standalone diagnostic labs in the UAE accept walk-in patients for routine ${cat.name.toLowerCase()} ` +
        `tests without a prescription. Labs like Al Borg, Thumbay, Medsol, and STAR Metropolis offer self-referral testing. ` +
        `Home collection services also don't require prescriptions for most tests. Some specialised tests may require a physician referral.`,
    },
    {
      question: `Can I get ${cat.name.toLowerCase()} tests done at home in the UAE?`,
      answer:
        `Yes, home blood collection is widely available in Dubai, Abu Dhabi, and Sharjah for most ${cat.name.toLowerCase()} tests. ` +
        `Services like DarDoc, Healthchecks360, and ServiceMarket send DHA-licensed nurses to your location. ` +
        `Many labs including Thumbay and Medsol offer free home collection. Results are delivered digitally within 24-48 hours.`,
    },
  ];

  return (
    <div className="container-tc py-8">
      <JsonLd
        data={breadcrumbSchema([
          { name: "UAE", url: base },
          { name: "Lab Test Comparison", url: `${base}/labs` },
          { name: cat.name },
        ])}
      />
      <JsonLd data={speakableSchema([".answer-block"])} />
      <JsonLd data={faqPageSchema(faqs)} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: `${cat.name} — UAE Lab Test Prices`,
          description: `Compare ${tests.length} ${cat.name.toLowerCase()} test prices across UAE laboratories.`,
          url: `${base}/labs/category/${cat.slug}`,
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: tests.length,
            itemListElement: testsWithPrices.slice(0, 20).map((t, i) => ({
              "@type": "ListItem",
              position: i + 1,
              item: {
                "@type": "MedicalTest",
                name: t.name,
                description: t.description,
                url: `${base}/labs/test/${t.slug}`,
                ...(t.priceRange
                  ? {
                      offers: {
                        "@type": "AggregateOffer",
                        lowPrice: t.priceRange.min,
                        highPrice: t.priceRange.max,
                        priceCurrency: "AED",
                        offerCount: t.priceRange.labCount,
                      },
                    }
                  : {}),
              },
            })),
          },
        }}
      />

      <Breadcrumb
        items={[
          { label: "UAE", href: "/" },
          { label: "Lab Test Comparison", href: "/labs" },
          { label: cat.name },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-dark mb-3">
          {cat.name} — Price Comparison Across UAE Labs
        </h1>
        <div className="answer-block mb-6" data-answer-block="true">
          <p className="text-muted leading-relaxed">
            Compare prices for {tests.length} {cat.name.toLowerCase()} tests
            across diagnostic laboratories in Dubai, Abu Dhabi, Sharjah, and
            across the UAE.
            {cheapestOverall !== null && (
              <>
                {" "}Prices start from <strong>AED {cheapestOverall}</strong>.
                Save up to 50% by comparing labs before booking.
              </>
            )}{" "}
            Most labs offer walk-in testing without a prescription, and many
            provide home sample collection.
          </p>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-light-50 p-4 text-center">
            <p className="text-2xl font-bold text-accent">{tests.length}</p>
            <p className="text-xs text-muted">Tests tracked</p>
          </div>
          {cheapestOverall !== null && (
            <div className="bg-light-50 p-4 text-center">
              <p className="text-2xl font-bold text-accent">
                AED {cheapestOverall}
              </p>
              <p className="text-xs text-muted">Starting from</p>
            </div>
          )}
          <div className="bg-light-50 p-4 text-center">
            <p className="text-2xl font-bold text-accent">
              {totalPricePoints}
            </p>
            <p className="text-xs text-muted">Price points</p>
          </div>
          <div className="bg-light-50 p-4 text-center">
            <p className="text-2xl font-bold text-accent">12+</p>
            <p className="text-xs text-muted">Labs compared</p>
          </div>
        </div>
      </div>

      {/* All tests in this category */}
      <div className="section-header">
        <h2>All {cat.name} Tests</h2>
        <span className="arrows">&gt;&gt;&gt;</span>
      </div>
      <div className="answer-block mb-4" data-answer-block="true">
        <p className="text-xs text-muted">
          Click any test below to see a full price comparison across all UAE
          laboratories, home collection options, and preparation instructions.
        </p>
      </div>
      <div className="space-y-2 mb-12">
        {testsWithPrices.map((test) => (
          <Link
            key={test.slug}
            href={`/labs/test/${test.slug}`}
            className="flex items-center justify-between gap-4 p-4 border border-light-200 hover:border-accent transition-colors group"
          >
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-dark group-hover:text-accent transition-colors">
                {test.shortName}
              </h3>
              <p className="text-[11px] text-muted line-clamp-1">
                {test.name}
              </p>
              <p className="text-[11px] text-muted mt-1 line-clamp-1">
                {test.description}
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {test.fastingRequired && (
                  <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 font-medium">
                    Fasting required
                  </span>
                )}
                <span className="text-[10px] bg-light-100 text-dark px-1.5 py-0.5 font-medium capitalize">
                  {test.sampleType}
                </span>
                <span className="text-[10px] bg-light-100 text-dark px-1.5 py-0.5 font-medium">
                  Results in {test.turnaroundHours}h
                </span>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              {test.priceRange ? (
                <>
                  <p className="text-sm font-bold text-accent">
                    {formatPrice(test.priceRange.min)}
                  </p>
                  {test.priceRange.min !== test.priceRange.max && (
                    <p className="text-[10px] text-muted">
                      – {formatPrice(test.priceRange.max)}
                    </p>
                  )}
                  <p className="text-[10px] text-muted">
                    {test.priceRange.labCount} labs
                  </p>
                </>
              ) : (
                <p className="text-[10px] text-muted">Contact labs</p>
              )}
              <ArrowRight className="w-4 h-4 text-muted group-hover:text-accent transition-colors ml-auto mt-1" />
            </div>
          </Link>
        ))}
      </div>

      {/* Other categories */}
      <div className="section-header">
        <h2>Other Test Categories</h2>
        <span className="arrows">&gt;&gt;&gt;</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-12">
        {TEST_CATEGORIES.filter((c) => c.slug !== cat.slug).map((c) => {
          const count = LAB_TESTS.filter((t) => t.category === c.slug).length;
          return (
            <Link
              key={c.slug}
              href={`/labs/category/${c.slug}`}
              className="border border-light-200 p-3 hover:border-accent transition-colors group"
            >
              <h3 className="text-sm font-bold text-dark group-hover:text-accent transition-colors">
                {c.name}
              </h3>
              <p className="text-[11px] text-muted">{count} tests</p>
            </Link>
          );
        })}
      </div>

      {/* FAQ */}
      <div className="mt-12">
        <FaqSection
          faqs={faqs}
          title={`${cat.name} in the UAE — FAQ`}
        />
      </div>

      {/* Disclaimer */}
      <div className="mt-8 border-t border-light-200 pt-4">
        <p className="text-[11px] text-muted leading-relaxed">
          <strong>Disclaimer:</strong> Prices for {cat.name.toLowerCase()} tests
          are indicative and based on publicly available data from UAE
          diagnostic laboratories. Actual prices may vary by branch, insurance
          coverage, and current promotions. This information is for price
          comparison only and does not constitute medical advice. Consult a
          physician to determine which tests are appropriate for your condition.
          Data sourced from DHA, DOH, and MOHAP licensed facilities. Last
          verified March 2026.
        </p>
      </div>
    </div>
  );
}
