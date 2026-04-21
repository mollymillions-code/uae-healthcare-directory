import { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Sparkles, FlaskConical, Home, Clock, Award } from "lucide-react";
import { JsonLd } from "@/components/seo/JsonLd";
import { FaqSection } from "@/components/seo/FaqSection";
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
      p.id === "thumbay-wellness",
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

  const breadcrumbs = [
    { label: "UAE", href: "/" },
    { label: "Lab Test Price Comparison" },
  ];

  return (
    <>
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

      {/* Hero */}
      <section className="relative overflow-hidden bg-surface-cream">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 -right-40 h-[460px] w-[460px] rounded-full bg-[radial-gradient(closest-side,rgba(0,200,83,0.16),transparent_70%)]" />
          <div className="absolute -top-20 -left-32 h-[360px] w-[360px] rounded-full bg-[radial-gradient(closest-side,rgba(255,176,120,0.22),transparent_70%)]" />
        </div>

        <div className="relative max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-10">
          <nav
            className="font-sans text-z-body-sm text-ink-muted flex items-center gap-1.5 mb-5 flex-wrap"
            aria-label="Breadcrumb"
          >
            {breadcrumbs.map((b, i) => {
              const isLast = i === breadcrumbs.length - 1;
              return (
                <span key={i} className="inline-flex items-center gap-1.5">
                  {b.href && !isLast ? (
                    <Link href={b.href} className="hover:text-ink transition-colors">
                      {b.label}
                    </Link>
                  ) : (
                    <span className={isLast ? "text-ink font-medium" : undefined}>
                      {b.label}
                    </span>
                  )}
                  {!isLast && <ChevronRight className="h-3.5 w-3.5" />}
                </span>
              );
            })}
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-8">
              <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-3 inline-flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                Lab price intelligence
              </p>
              <h1 className="font-display font-semibold text-ink text-display-lg lg:text-[56px] leading-[1.02] tracking-[-0.028em] flex items-center gap-3">
                <FlaskConical className="h-9 w-9 text-accent-dark shrink-0" />
                UAE Lab Test & Diagnostic Price Comparison
              </h1>
              <p className="font-sans text-z-body sm:text-[17px] text-ink-soft mt-4 max-w-2xl leading-relaxed">
                Compare {stats.totalTests} lab tests across {stats.totalLabs}{" "}
                diagnostic laboratories in Dubai, Abu Dhabi, Sharjah, and across
                the UAE.
              </p>
            </div>

            <div className="lg:col-span-4 grid grid-cols-2 gap-3">
              {[
                { n: stats.totalLabs.toString(), l: "Labs compared" },
                { n: stats.totalTests.toString(), l: "Tests tracked" },
                { n: stats.totalPackages.toString(), l: "Health packages" },
                { n: stats.labsWithHomeCollection.toString(), l: "Home collection" },
              ].map((s) => (
                <div
                  key={s.l}
                  className="rounded-z-md bg-white border border-ink-line px-4 py-3"
                >
                  <p className="font-display font-semibold text-ink text-z-h1 leading-none">
                    {s.n}
                  </p>
                  <p className="font-sans text-z-caption text-ink-muted mt-1">{s.l}</p>
                </div>
              ))}
            </div>
          </div>

          <div
            className="mt-8 answer-block rounded-z-md bg-white border border-ink-line p-5 sm:p-6 max-w-4xl"
            data-answer-block="true"
          >
            <p className="font-sans text-z-body-sm text-ink-soft leading-[1.75]">
              A CBC costs between AED 69 and AED 120 depending on the lab.
              Vitamin D ranges from AED 85 to AED 150. Save up to 50% by
              comparing prices before booking. {stats.labsWithHomeCollection}{" "}
              labs offer home sample collection — many for free.
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-14">
        {/* Popular Tests */}
        <section>
          <header className="mb-6">
            <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-2">
              Most searched
            </p>
            <h2 className="font-display font-semibold text-ink text-display-md tracking-[-0.018em]">
              Most popular lab tests in the UAE.
            </h2>
            <p className="font-sans text-z-body-sm text-ink-muted mt-2 max-w-3xl">
              Vitamin D testing is particularly prevalent due to widespread
              deficiency among UAE residents — despite abundant sunlight, indoor
              lifestyles and clothing coverage leave over 80% of the population
              low. Click any test to see prices across all labs.
            </p>
          </header>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {popularTests.map((test) => (
              <Link
                key={test.slug}
                href={`/labs/test/${test.slug}`}
                className="group flex items-center justify-between gap-4 rounded-z-md bg-white border border-ink-line p-5 hover:border-ink hover:shadow-z-card transition-all duration-z-base"
              >
                <div className="min-w-0">
                  <p className="font-sans font-semibold text-ink text-z-body leading-tight group-hover:underline decoration-1 underline-offset-2">
                    {test.shortName}
                  </p>
                  <p className="font-sans text-z-caption text-ink-muted mt-0.5 line-clamp-1">
                    {test.name}
                  </p>
                </div>
                {test.priceRange && (
                  <div className="text-right shrink-0">
                    <p className="font-display font-semibold text-ink text-z-h3 leading-none">
                      {formatPrice(test.priceRange.min)}
                    </p>
                    {test.priceRange.min !== test.priceRange.max && (
                      <p className="font-sans text-z-micro text-ink-muted mt-1">
                        – {formatPrice(test.priceRange.max)}
                      </p>
                    )}
                    <p className="font-sans text-z-micro text-ink-muted">
                      {test.priceRange.labCount} labs
                    </p>
                  </div>
                )}
              </Link>
            ))}
          </div>
        </section>

        {/* Labs */}
        <section>
          <header className="mb-6">
            <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-2">
              UAE lab providers
            </p>
            <h2 className="font-display font-semibold text-ink text-display-md tracking-[-0.018em]">
              Diagnostic laboratories.
            </h2>
            <p className="font-sans text-z-body-sm text-ink-muted mt-2 max-w-3xl">
              The UAE has {stats.totalLabs} major diagnostic lab providers, from
              large chains like Al Borg (17 branches, Quest Diagnostics partner)
              to home-service platforms like DarDoc. Most are licensed by DHA,
              DOH, or MOHAP and many hold international CAP accreditation.
            </p>
          </header>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {LAB_PROFILES.map((lab) => {
              const prices = getPricesForLab(lab.slug);
              const packages = getPackagesForLab(lab.slug);
              const cheapest =
                prices.length > 0 ? Math.min(...prices.map((p) => p.price)) : null;
              return (
                <Link
                  key={lab.slug}
                  href={`/labs/${lab.slug}`}
                  className="group flex flex-col rounded-z-md bg-white border border-ink-line p-5 hover:border-ink hover:shadow-z-card transition-all duration-z-base"
                >
                  <p className="font-sans font-semibold text-ink text-z-body leading-tight group-hover:underline decoration-1 underline-offset-2">
                    {lab.name}
                  </p>
                  <p className="font-sans text-z-caption text-ink-muted mt-1 line-clamp-2">
                    {lab.description}
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2 font-sans text-z-caption">
                    <div className="inline-flex items-center gap-1.5 text-ink-soft">
                      <Home className="h-3.5 w-3.5 text-accent-dark" />
                      {lab.homeCollection
                        ? lab.homeCollectionFee === 0
                          ? "Free home"
                          : `Home AED ${lab.homeCollectionFee}`
                        : "Walk-in only"}
                    </div>
                    <div className="inline-flex items-center gap-1.5 text-ink-soft">
                      <Clock className="h-3.5 w-3.5 text-accent-dark" />
                      {lab.turnaroundHours}h results
                    </div>
                    <div className="inline-flex items-center gap-1.5 text-ink-soft col-span-2">
                      <Award className="h-3.5 w-3.5 text-accent-dark" />
                      {lab.accreditations.join(", ") || "DHA Licensed"}
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-ink-hairline flex items-center justify-between">
                    <p className="font-sans text-z-caption text-ink-muted">
                      {prices.length} tests · {packages.length} packages
                    </p>
                    {cheapest !== null && (
                      <p className="font-display font-semibold text-ink text-z-body">
                        From AED {cheapest}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Health Packages */}
        <section>
          <header className="mb-6">
            <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-2">
              Bundled tests
            </p>
            <h2 className="font-display font-semibold text-ink text-display-md tracking-[-0.018em]">
              Health check packages.
            </h2>
            <p className="font-sans text-z-body-sm text-ink-muted mt-2 max-w-3xl">
              Health check packages bundle multiple tests at a discount. A basic
              package (CBC, lipid profile, glucose, liver, kidney) starts from
              AED 99 at Medsol. Comprehensive wellness packages with vitamins,
              thyroid, and diabetes markers range AED 230–499. Premium
              executive packages with cardiac and cancer markers start from AED
              899.
            </p>
          </header>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {featuredPackages.map((pkg) => (
              <PackageCard key={pkg.id} pkg={pkg} />
            ))}
          </div>
        </section>

        {/* Test Categories */}
        <section>
          <header className="mb-6">
            <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-2">
              By category
            </p>
            <h2 className="font-display font-semibold text-ink text-display-md tracking-[-0.018em]">
              Browse by category.
            </h2>
          </header>
          <ul className="flex flex-wrap gap-2">
            {TEST_CATEGORIES.map((cat) => {
              const testCount = LAB_TESTS.filter((t) => t.category === cat.slug).length;
              return (
                <li key={cat.slug}>
                  <Link
                    href={`/labs/category/${cat.slug}`}
                    className="inline-flex items-center rounded-z-pill bg-white border border-ink-hairline px-3.5 py-1.5 font-sans text-z-body-sm text-ink hover:border-ink transition-colors"
                  >
                    {cat.name}
                    {testCount > 0 && (
                      <span className="ml-1.5 text-ink-muted">· {testCount}</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Full Test Browser */}
        <section>
          <header className="mb-6">
            <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-2">
              Search
            </p>
            <h2 className="font-display font-semibold text-ink text-display-md tracking-[-0.018em]">
              Search all {stats.totalTests} tests.
            </h2>
            <p className="font-sans text-z-body-sm text-ink-muted mt-2 max-w-2xl">
              Search for any lab test to see prices across all {stats.totalLabs} laboratories.
            </p>
          </header>
          <TestBrowser />
        </section>
      </div>

      {/* FAQ */}
      <section className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-16 sm:pb-24">
        <header className="mb-6">
          <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-2">
            Questions
          </p>
          <h2 className="font-display font-semibold text-ink text-display-md tracking-[-0.018em]">
            Lab tests in the UAE.
          </h2>
        </header>
        <div className="max-w-3xl">
          <FaqSection
            faqs={faqs}
            title="Lab Tests in the UAE — Frequently Asked Questions"
          />
        </div>

        <div className="mt-12 rounded-z-md bg-white border border-ink-line p-6 max-w-3xl">
          <p className="font-sans text-z-caption text-ink-muted leading-relaxed">
            <strong className="text-ink-soft">Disclaimer.</strong> Prices shown
            are indicative and based on publicly available pricing from lab
            websites, aggregator platforms, and walk-in price lists (2024–2025).
            Actual prices may vary by branch location, insurance coverage,
            promotions, and test methodology. Always confirm pricing directly
            with the laboratory before booking. Data sourced from DHA, DOH, and
            MOHAP licensed facility registers. Last verified March 2026.
          </p>
        </div>
      </section>
    </>
  );
}
