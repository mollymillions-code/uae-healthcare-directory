import { Metadata } from "next";
import Link from "next/link";
import { FlaskConical } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { FaqSection } from "@/components/seo/FaqSection";
import { LabCard } from "@/components/labs/LabCard";
import { PackageCard } from "@/components/labs/PackageCard";
import { TestBrowser } from "@/components/labs/TestBrowser";
import {
  LAB_PROFILES,
  LAB_TESTS,
  HEALTH_PACKAGES,
  TEST_CATEGORIES,
  getLabStats,
  getPopularTests,
  getPricesForLab,
  getPackagesForLab,
  formatPrice,
} from "@/lib/labs";
import { breadcrumbSchema, faqPageSchema, speakableSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

export const revalidate = 43200;

export function generateMetadata(): Metadata {
  const base = getBaseUrl();
  const stats = getLabStats();
  return {
    title:
      "UAE Lab Test Price Comparison — Compare Blood Test Costs Across " +
      stats.totalLabs +
      " Labs | UAE Open Healthcare Directory",
    description:
      "Compare prices for " +
      stats.totalTests +
      " lab tests across " +
      stats.totalLabs +
      " diagnostic laboratories in the UAE. CBC from AED 69, Vitamin D from AED 85, Thyroid Panel from AED 130. Find the cheapest blood test near you in Dubai, Abu Dhabi, and Sharjah with home collection options.",
    alternates: { canonical: `${base}/labs` },
    openGraph: {
      title: "UAE Lab Test Price Comparison — Compare Blood Test Costs",
      description:
        `Compare ${stats.totalTests} lab tests across ${stats.totalLabs} UAE labs. ` +
        `Save up to 50% by comparing prices. Home collection available.`,
      url: `${base}/labs`,
      type: "website",
    },
  };
}

export default function LabsPage() {
  const base = getBaseUrl();
  const stats = getLabStats();
  const popularTests = getPopularTests();
  const featuredPackages = HEALTH_PACKAGES.filter(
    (p) =>
      p.id === "medsol-basic" ||
      p.id === "alborg-comprehensive" ||
      p.id === "dardoc-athome-basic" ||
      p.id === "thumbay-wellness"
  );

  const faqs = [
    {
      question: "How much does a blood test cost in the UAE?",
      answer:
        "Blood test prices in the UAE vary significantly by lab and test type. A basic CBC costs between AED 69 and AED 120 depending on the laboratory. Comprehensive health check packages range from AED 99 (budget labs like Medsol) to AED 999 (premium labs like Unilabs). Home collection services typically start from AED 99 for a basic panel. Standalone labs in areas like Deira, Bur Dubai, and Al Karama tend to be cheaper than hospital-based labs or those in DIFC and Downtown Dubai.",
    },
    {
      question: "Can I get a blood test at home in the UAE?",
      answer:
        "Yes, home blood test collection is widely available across Dubai, Abu Dhabi, and Sharjah. DHA-licensed nurses or phlebotomists visit your location, typically arriving within 30-60 minutes. Services like DarDoc, ServiceMarket, and Healthchecks360 operate daily from 7 AM to 10 PM. Many labs including Thumbay, Medsol, and Alpha Medical offer free home collection, while others charge AED 50-100. Results are delivered digitally within 24-48 hours.",
    },
    {
      question: "Which is the cheapest lab for blood tests in the UAE?",
      answer:
        "Medsol Diagnostics and Alpha Medical Laboratory generally offer the lowest walk-in prices in the UAE. A basic health check at Medsol starts from AED 99 covering CBC, lipid profile, glucose, liver, and kidney function. For individual tests, Medsol offers CBC from AED 69 and Vitamin D from AED 85. However, prices vary by test — for some specialised tests, Thumbay Labs or STAR Metropolis may be more affordable. Always compare prices for your specific test needs.",
    },
    {
      question: "What blood tests should I get annually in the UAE?",
      answer:
        "For UAE residents, an annual health screening should include: CBC (complete blood count), Lipid Profile (cholesterol), Fasting Glucose and HbA1c (diabetes screening), Liver Function Test, Kidney Function Test, Thyroid TSH, Vitamin D (widespread deficiency in UAE despite the sun), Vitamin B12, and Iron Studies. Men over 50 should add PSA (prostate screening). Women should consider thyroid panel, folate, and fertility hormones if relevant. Most labs offer comprehensive packages covering these tests at better value than ordering individually.",
    },
    {
      question: "Do I need a doctor's prescription for lab tests in the UAE?",
      answer:
        "No, most standalone diagnostic labs in the UAE accept walk-in patients without a prescription for routine blood tests. Labs like Al Borg, Thumbay, Medsol, and STAR Metropolis offer self-referral testing. Home collection services like DarDoc and Healthchecks360 also don't require prescriptions. However, some specialised tests (genetic testing, biopsies) may require a physician referral. Hospital-based labs typically require an internal referral from their doctors.",
    },
    {
      question: "How long do lab test results take in the UAE?",
      answer:
        "Turnaround times vary by test type and lab. Routine blood tests (CBC, glucose, liver function, kidney function) are typically ready within 4-6 hours for walk-in patients. Vitamin D, B12, and thyroid tests usually take 12-24 hours. Specialised tests (hormones, tumor markers, allergy panels) may take 24-72 hours. Home collection services deliver results digitally within 24-48 hours. PureLab in Abu Dhabi, with AI-powered processing, offers some of the fastest turnaround times in the UAE at 12 hours for routine tests.",
    },
  ];

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd
        data={breadcrumbSchema([
          { name: "UAE", url: base },
          { name: "Lab Test Price Comparison" },
        ])}
      />
      <JsonLd data={speakableSchema([".answer-block"])} />
      <JsonLd data={faqPageSchema(faqs)} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "UAE Lab Test Price Comparison",
          description: `Compare prices for ${stats.totalTests} lab tests across ${stats.totalLabs} diagnostic laboratories in the UAE.`,
          url: `${base}/labs`,
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: stats.totalTests,
            itemListElement: popularTests.slice(0, 10).map((t, i) => ({
              "@type": "ListItem",
              position: i + 1,
              item: {
                "@type": "MedicalTest",
                name: t.name,
                description: t.description,
                url: `${base}/labs/test/${t.slug}`,
              },
            })),
          },
        }}
      />

      <Breadcrumb
        items={[
          { label: "UAE", href: "/" },
          { label: "Lab Test Price Comparison" },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <FlaskConical className="w-8 h-8 text-[#006828]" />
          <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight">
            UAE Lab Test & Diagnostic Price Comparison
          </h1>
        </div>
        <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 mb-6" data-answer-block="true">
          <p className="font-['Geist',sans-serif] text-black/40 leading-relaxed">
            Compare prices for {stats.totalTests} lab tests across {stats.totalLabs} diagnostic
            laboratories in Dubai, Abu Dhabi, Sharjah, and across the UAE. A CBC
            costs between AED 69 and AED 120 depending on the lab. Vitamin D
            ranges from AED 85 to AED 150. Save up to 50% by comparing prices
            before booking. {stats.labsWithHomeCollection} labs offer home sample
            collection — many for free.
          </p>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { value: stats.totalLabs.toString(), label: "Labs compared" },
            { value: stats.totalTests.toString(), label: "Tests tracked" },
            { value: stats.totalPackages.toString(), label: "Health packages" },
            { value: stats.labsWithHomeCollection.toString(), label: "With home collection" },
          ].map(({ value, label }) => (
            <div key={label} className="bg-[#f8f8f6] p-4 text-center">
              <p className="text-2xl font-bold text-[#006828]">{value}</p>
              <p className="font-['Geist',sans-serif] text-xs text-black/40">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Popular Tests */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Most Popular Lab Tests in the UAE</h2>
      </div>
      <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 mb-2" data-answer-block="true">
        <p className="font-['Geist',sans-serif] text-xs text-black/40 mb-4">
          These are the most commonly ordered lab tests in the UAE. Vitamin D testing is
          particularly prevalent due to widespread deficiency among UAE residents — despite
          abundant sunlight, indoor lifestyles and clothing coverage lead to low levels in
          over 80% of the population. Click any test to see prices across all labs.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-12">
        {popularTests.map((test) => (
          <Link
            key={test.slug}
            href={`/labs/test/${test.slug}`}
            className="flex items-center justify-between gap-4 p-4 border border-black/[0.06] hover:border-[#006828]/15 transition-colors group"
          >
            <div className="min-w-0">
              <h3 className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
                {test.shortName}
              </h3>
              <p className="text-[11px] text-black/40 line-clamp-1">{test.name}</p>
            </div>
            <div className="text-right flex-shrink-0">
              {test.priceRange && (
                <>
                  <p className="text-sm font-bold text-[#006828]">
                    {formatPrice(test.priceRange.min)}
                  </p>
                  {test.priceRange.min !== test.priceRange.max && (
                    <p className="text-[10px] text-black/40">
                      – {formatPrice(test.priceRange.max)}
                    </p>
                  )}
                  <p className="text-[10px] text-black/40">
                    {test.priceRange.labCount} labs
                  </p>
                </>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* Labs */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Diagnostic Laboratories</h2>
      </div>
      <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 mb-2" data-answer-block="true">
        <p className="font-['Geist',sans-serif] text-xs text-black/40 mb-4">
          The UAE has {stats.totalLabs} major diagnostic laboratory providers, from large chains
          like Al Borg Diagnostics (17 branches, exclusive Quest Diagnostics partner) to
          home-service platforms like DarDoc that bring the lab to your door. Most labs are
          licensed by DHA (Dubai), DOH (Abu Dhabi), or MOHAP (Northern Emirates) and many
          hold international CAP accreditation.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
        {LAB_PROFILES.map((lab) => {
          const prices = getPricesForLab(lab.slug);
          const packages = getPackagesForLab(lab.slug);
          const cheapest = prices.length > 0 ? Math.min(...prices.map((p) => p.price)) : undefined;
          return (
            <LabCard
              key={lab.slug}
              lab={lab}
              testCount={prices.length}
              packageCount={packages.length}
              cheapestFrom={cheapest}
            />
          );
        })}
      </div>

      {/* Health Packages */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Health Check Packages</h2>
      </div>
      <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 mb-2" data-answer-block="true">
        <p className="font-['Geist',sans-serif] text-xs text-black/40 mb-4">
          Health check packages bundle multiple tests at a discounted price compared to
          ordering tests individually. A basic package (CBC, lipid profile, glucose, liver,
          kidney) starts from AED 99 at Medsol, while comprehensive wellness packages
          including vitamins, thyroid, and diabetes markers range from AED 230 to AED 499.
          Premium executive packages with cardiac and cancer markers start from AED 899.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        {featuredPackages.map((pkg) => (
          <PackageCard key={pkg.id} pkg={pkg} />
        ))}
      </div>

      {/* Test Categories */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Browse by Category</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-12">
        {TEST_CATEGORIES.map((cat) => {
          const testCount = LAB_TESTS.filter((t) => t.category === cat.slug).length;
          return (
            <Link
              key={cat.slug}
              href={`/labs/category/${cat.slug}`}
              className="border border-black/[0.06] p-3 hover:border-[#006828]/15 transition-colors group"
            >
              <h3 className="text-sm font-['Bricolage_Grotesque',sans-serif] font-semibold text-[#1c1c1c] tracking-tight mb-1 group-hover:text-[#006828] transition-colors">{cat.name}</h3>
              <p className="text-[11px] text-black/40">{testCount} tests</p>
            </Link>
          );
        })}
      </div>

      {/* Full Test Browser */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Search All {stats.totalTests} Tests</h2>
      </div>
      <p className="font-['Geist',sans-serif] text-xs text-black/40 mb-4">
        Search for any lab test to see prices across all {stats.totalLabs} laboratories.
      </p>
      <div className="mb-12">
        <TestBrowser />
      </div>

      {/* FAQ */}
      <div className="mt-12">
        <FaqSection faqs={faqs} title="Lab Tests in the UAE — Frequently Asked Questions" />
      </div>

      {/* Disclaimer */}
      <div className="mt-8 border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>Disclaimer:</strong> Prices shown are indicative and based on publicly
          available pricing from lab websites, aggregator platforms, and walk-in price lists
          (2024-2025). Actual prices may vary by branch location, insurance coverage,
          promotions, and test methodology. Always confirm pricing directly with the
          laboratory before booking. This tool is for informational purposes only and does
          not constitute medical advice. Consult a physician before ordering lab tests.
          Data sourced from DHA, DOH, and MOHAP licensed facility registers. Last verified March 2026.
        </p>
      </div>
    </div>
  );
}
