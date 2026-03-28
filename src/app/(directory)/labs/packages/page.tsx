import { Metadata } from "next";
import Link from "next/link";
import {
  Package,
  ArrowRight,
  CheckCircle,
  TrendingDown,
  Star,
  Users,
  FlaskConical,
  Wallet,
  Shield,
  Clock,
  ChevronRight,
} from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { FaqSection } from "@/components/seo/FaqSection";
import { PackageCard } from "@/components/labs/PackageCard";
import {
  LAB_PROFILES,
  HEALTH_PACKAGES,
  getLabStats,
  getLabProfile,
  formatPrice,
} from "@/lib/labs";
import { breadcrumbSchema, faqPageSchema, speakableSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

export const revalidate = 43200;

export function generateMetadata(): Metadata {
  const base = getBaseUrl();
  const stats = getLabStats();
  const cheapest = Math.min(...HEALTH_PACKAGES.map((p) => p.price));
  return {
    title: `Health Check Packages UAE — Compare ${stats.totalPackages} Packages from AED ${cheapest}`,
    description: `Compare ${stats.totalPackages} health check packages across UAE labs. Budget plans from AED ${cheapest}, comprehensive wellness packages from AED 230, executive packages from AED 899. Find the best value health screening in Dubai & Abu Dhabi.`,
    alternates: { canonical: `${base}/labs/packages` },
    openGraph: {
      title: `Health Check Packages in the UAE — Compare ${stats.totalPackages} Packages from AED ${cheapest}`,
      description: `Save 30-50% vs ordering individual tests. Compare ${stats.totalPackages} health screening packages from ${stats.totalLabs} UAE labs. Budget to executive tiers.`,
      url: `${base}/labs/packages`,
      type: "website",
    },
  };
}

// Tier classification
const BUDGET_MAX = 200;
const STANDARD_MIN = 200;
const STANDARD_MAX = 500;
const PREMIUM_MIN = 500;

export default function PackagesPage() {
  const base = getBaseUrl();
  const stats = getLabStats();

  const allPackages = HEALTH_PACKAGES;
  const cheapestPrice = Math.min(...allPackages.map((p) => p.price));
  const mostBiomarkers = Math.max(...allPackages.map((p) => p.biomarkerCount));
  const labsWithPackages = new Set(allPackages.map((p) => p.labSlug)).size;

  const budgetPackages = allPackages.filter((p) => p.price < BUDGET_MAX);
  const standardPackages = allPackages.filter(
    (p) => p.price >= STANDARD_MIN && p.price < STANDARD_MAX
  );
  const premiumPackages = allPackages.filter((p) => p.price >= PREMIUM_MIN);
  const womensPackages = allPackages.filter(
    (p) => p.suitableFor.includes("female") && !p.suitableFor.includes("male")
  );

  // Group packages by lab for the "Compare by Lab" section
  const packagesByLab = LAB_PROFILES.filter(
    (lab) => allPackages.some((p) => p.labSlug === lab.slug)
  ).map((lab) => ({
    lab,
    packages: allPackages
      .filter((p) => p.labSlug === lab.slug)
      .sort((a, b) => a.price - b.price),
  }));

  // Example savings calculation — pick a popular comprehensive package
  const comprehensiveExample = allPackages.find((p) => p.id === "alborg-comprehensive");

  const faqs = [
    {
      question: "What is included in a health check package in the UAE?",
      answer:
        "Health check packages in the UAE typically include a bundle of blood tests covering multiple health dimensions. A basic package (AED 99-199) covers CBC (complete blood count), lipid profile, fasting glucose, liver function, and kidney function — about 35-45 biomarkers. A standard wellness package (AED 200-499) adds TSH, Vitamin D, Vitamin B12, iron studies, HbA1c, and urinalysis — 60-85 biomarkers. Premium executive packages (AED 500+) further add cardiac markers (CRP, troponin), cancer screening (PSA, CEA, CA-125), and sometimes full thyroid panel and hormones — 120-150+ biomarkers.",
    },
    {
      question: "How often should I get a health check package in the UAE?",
      answer:
        "For healthy adults aged 18-40 with no risk factors, an annual comprehensive health check is generally sufficient. Adults over 40, those with diabetes, hypertension, heart disease family history, or obesity should consider a comprehensive check every 6 months. People managing chronic conditions (diabetes, thyroid disorders) typically need specific tests every 3 months. The high prevalence of Vitamin D deficiency in UAE residents (due to indoor lifestyle despite the sun) makes an annual Vitamin D test particularly important regardless of age.",
    },
    {
      question: "Which health check package offers the best value in the UAE?",
      answer:
        "For pure value, Medsol Diagnostics' Budget Health Check at AED 99 is the most affordable in the UAE, covering 5 core tests (CBC, lipid, glucose, liver, kidney). For the best comprehensive value, Thumbay Labs' Wellness Plus at AED 349 covers 72 biomarkers including vitamins and thyroid — ordering those tests individually at Thumbay would cost approximately AED 545, a 36% saving. For a full premium check, Al Borg's Comprehensive Wellness at AED 499 (85 biomarkers) compares favourably to the individual test cost of around AED 820 at the same lab.",
    },
    {
      question: "Does insurance cover health check packages in the UAE?",
      answer:
        "Many UAE employer health insurance plans include an annual preventive health screening benefit — check your policy's preventive care or wellness rider. Daman's enhanced plans and some corporate AXA, Cigna, and MSH plans cover annual check-up packages. However, many plans that cover individual tests require a physician's referral and may not cover a self-referral package booking directly at a lab. Thiqa (Daman's government employee plan for Abu Dhabi) typically covers annual health checks at DOH-licensed facilities. Always verify with your insurer and the lab before booking.",
    },
    {
      question: "Do I need to fast before a health check package?",
      answer:
        "Most comprehensive health check packages require fasting for 8-12 hours because they include tests that need fasting samples: fasting glucose (diabetes screening), HbA1c in some methodologies, lipid profile (for accurate triglycerides and LDL), and fasting insulin. Water is fine during the fast — staying hydrated actually helps with blood draw. If your package includes only CBC, kidney function, liver function, and thyroid (no glucose or lipids), fasting may not be required, but it is safest to confirm with the lab when booking.",
    },
    {
      question: "How do I book a health check package in the UAE?",
      answer:
        "Most labs allow online booking through their website or app. For walk-in labs (Al Borg, Thumbay, Medsol, STAR Metropolis), you can also walk in without an appointment at any branch, though early morning slots fill quickly. For home collection packages (DarDoc, ServiceMarket, Healthchecks360), book via their app or website and choose a home visit time. Bring your Emirates ID or passport. For fasting packages, schedule a morning visit and stop eating the night before. Most labs accept credit/debit cards, Apple Pay, and some accept insurance vouchers.",
    },
  ];

  const breadcrumbs = [
    { name: "UAE", url: base },
    { name: "Lab Tests", url: `${base}/labs` },
    { name: "Health Check Packages" },
  ];

  // JSON-LD ItemList of packages with Offer pricing
  const packageItemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Health Check Packages in the UAE",
    description: `${allPackages.length} health screening packages from ${labsWithPackages} UAE labs, from AED ${cheapestPrice}`,
    url: `${base}/labs/packages`,
    numberOfItems: allPackages.length,
    itemListElement: allPackages.map((pkg, i) => {
      const lab = getLabProfile(pkg.labSlug);
      return {
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "Product",
          name: pkg.name,
          description: pkg.targetAudience,
          offers: {
            "@type": "Offer",
            price: pkg.discountedPrice || pkg.price,
            priceCurrency: "AED",
            availability: "https://schema.org/InStock",
            seller: {
              "@type": "Organization",
              name: lab?.name || pkg.labSlug,
            },
          },
        },
      };
    }),
  };

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd data={breadcrumbSchema(breadcrumbs)} />
      <JsonLd data={speakableSchema([".answer-block", "h1"])} />
      <JsonLd data={faqPageSchema(faqs)} />
      <JsonLd data={packageItemListSchema} />

      <Breadcrumb
        items={[
          { label: "UAE", href: "/" },
          { label: "Lab Tests", href: "/labs" },
          { label: "Health Check Packages" },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <Package className="w-8 h-8 text-[#006828]" />
          <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight">
            Health Check Packages in the UAE — Compare {allPackages.length} Packages from{" "}
            {formatPrice(cheapestPrice)}
          </h1>
        </div>

        <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 mb-6" data-answer-block="true">
          <p className="font-['Geist',sans-serif] text-black/40 leading-relaxed">
            Health check packages bundle multiple lab tests at a discounted rate
            compared to ordering them individually. In the UAE, packages range from
            a{" "}
            <strong className="text-[#1c1c1c]">
              {formatPrice(cheapestPrice)} budget panel
            </strong>{" "}
            covering 5 core tests, to a{" "}
            <strong className="text-[#1c1c1c]">
              {formatPrice(Math.max(...allPackages.map((p) => p.price)))} executive
              screen
            </strong>{" "}
            with {mostBiomarkers} biomarkers including cardiac and cancer markers.
            Packages typically save 30–50% versus the sum of individual test prices.
            The {allPackages.length} packages tracked here span{" "}
            {labsWithPackages} labs across Dubai, Abu Dhabi, Sharjah, and the
            Northern Emirates — including home collection options.
          </p>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { value: allPackages.length.toString(), label: "Packages compared" },
            { value: formatPrice(cheapestPrice), label: "Cheapest package" },
            { value: mostBiomarkers.toString(), label: "Most biomarkers" },
            { value: labsWithPackages.toString(), label: "Labs offering packages" },
          ].map(({ value, label }) => (
            <div key={label} className="bg-[#f8f8f6] p-4 text-center border border-black/[0.06]">
              <p className="text-xl font-bold text-[#006828]">{value}</p>
              <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Budget Packages */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Budget Packages — Under {formatPrice(BUDGET_MAX)}</h2>
      </div>
      <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 mb-4" data-answer-block="true">
        <p className="font-['Geist',sans-serif] text-xs text-black/40">
          Budget packages cover the five core tests every adult should check
          annually: CBC (blood count), lipid profile (cholesterol), fasting glucose
          (diabetes screening), liver function, and kidney function. At AED 99-199,
          these packages cost less than ordering just two tests individually at a
          hospital-based lab. Suitable for healthy adults with no existing conditions
          who want a basic annual check or pre-employment screening.
        </p>
      </div>
      {budgetPackages.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {budgetPackages.map((pkg) => (
            <PackageCard key={pkg.id} pkg={pkg} />
          ))}
        </div>
      ) : (
        <p className="font-['Geist',sans-serif] text-sm text-black/40 mb-12">No packages in this tier currently tracked.</p>
      )}

      {/* Standard Packages */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Standard Wellness Packages — {formatPrice(STANDARD_MIN)} to {formatPrice(STANDARD_MAX)}</h2>
      </div>
      <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 mb-4" data-answer-block="true">
        <p className="font-['Geist',sans-serif] text-xs text-black/40">
          Standard wellness packages add vitamins (D, B12), thyroid (TSH or full
          panel), iron studies, HbA1c (3-month diabetes average), and urinalysis
          to the core tests. This is the recommended tier for most UAE residents
          given the very high rates of Vitamin D deficiency (affecting over 80%
          of the population), thyroid disorders, and pre-diabetes. These packages
          cover 60-85 biomarkers and represent the best balance of value and depth.
        </p>
      </div>
      {standardPackages.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {standardPackages.map((pkg) => (
            <PackageCard key={pkg.id} pkg={pkg} />
          ))}
        </div>
      ) : (
        <p className="font-['Geist',sans-serif] text-sm text-black/40 mb-12">No packages in this tier currently tracked.</p>
      )}

      {/* Premium Packages */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Premium &amp; Executive Packages — {formatPrice(PREMIUM_MIN)}+</h2>
      </div>
      <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 mb-4" data-answer-block="true">
        <p className="font-['Geist',sans-serif] text-xs text-black/40">
          Premium and executive packages extend the standard wellness screen with
          advanced cardiac risk markers (high-sensitivity CRP, troponin, BNP),
          cancer screening biomarkers (PSA for men, CA-125 for women, CEA), hormone
          panels, allergy screening, and stool analysis. These packages — covering
          120 to 150+ biomarkers — are suitable for adults over 40, those with
          family history of cancer or cardiac disease, and executives whose
          employers include premium health screening as a benefit. Unilabs&apos;
          European-standard diagnostics and Al Borg&apos;s Quest Diagnostics
          partnership add international credentialing at this tier.
        </p>
      </div>
      {premiumPackages.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {premiumPackages.map((pkg) => (
            <PackageCard key={pkg.id} pkg={pkg} />
          ))}
        </div>
      ) : (
        <p className="font-['Geist',sans-serif] text-sm text-black/40 mb-12">No packages in this tier currently tracked.</p>
      )}

      {/* Women's Health Packages */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Women&apos;s Health Packages</h2>
      </div>
      <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 mb-4" data-answer-block="true">
        <p className="font-['Geist',sans-serif] text-xs text-black/40">
          Women&apos;s health packages include gender-specific additions beyond the
          standard wellness screen: reproductive hormones (FSH, LH, estradiol,
          prolactin), ovarian reserve (AMH), folate (critical for pregnancy
          planning), and thyroid function (thyroid disorders are 5-8x more common
          in women). These panels are recommended annually for women from age 25
          and are particularly valuable for those planning pregnancy, experiencing
          irregular cycles, or approaching perimenopause.
        </p>
      </div>
      {womensPackages.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {womensPackages.map((pkg) => (
            <PackageCard key={pkg.id} pkg={pkg} />
          ))}
        </div>
      ) : (
        <div className="bg-[#f8f8f6] border border-black/[0.06] p-5 mb-12">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-[#006828]" />
            <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight">Women&apos;s Health Screening</p>
          </div>
          <p className="font-['Geist',sans-serif] text-xs text-black/40 leading-relaxed">
            Several labs offer women&apos;s health packages that include fertility
            hormones and reproductive markers alongside the standard wellness panel.
            Medsol&apos;s Women&apos;s Health Panel (AED 399, 82 biomarkers) covers FSH,
            estradiol, prolactin, AMH, folate, and the full thyroid panel.
            Browse individual lab profiles to see their current women&apos;s health
            offerings.
          </p>
          <Link href="/labs" className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#006828] hover:text-[#006828]-dark transition-colors">
            Browse all labs <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Package vs Individual — savings analysis */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Package vs Individual Tests — Which Saves More?</h2>
      </div>
      <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 mb-6" data-answer-block="true">
        <p className="font-['Geist',sans-serif] text-sm text-black/40 leading-relaxed">
          Packages consistently save 30–50% compared to ordering the same tests
          individually at the same lab. The saving compounds as package complexity
          increases. Here is a concrete example using Al Borg Diagnostics&apos;
          Comprehensive Wellness Package:
        </p>
      </div>

      {comprehensiveExample && (
        <div className="border border-black/[0.06] mb-6 overflow-x-auto">
          <div className="p-4 bg-[#f8f8f6] border-b border-black/[0.06]">
            <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight">
              Al Borg Diagnostics — Comprehensive Wellness (AED 499 package vs individual)
            </p>
            <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">
              {comprehensiveExample.biomarkerCount} biomarkers across{" "}
              {comprehensiveExample.testSlugs.length} test panels
            </p>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-[#f8f8f6]">
                <th className="text-left p-3 font-bold text-[#1c1c1c] border-b border-black/[0.06]">Test</th>
                <th className="text-right p-3 font-bold text-[#1c1c1c] border-b border-black/[0.06]">Individual price (AED)</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: "CBC (Complete Blood Count)", price: 85 },
                { name: "Lipid Profile", price: 110 },
                { name: "Fasting Glucose", price: 40 },
                { name: "HbA1c", price: 80 },
                { name: "Liver Function Test", price: 90 },
                { name: "Kidney Function Test", price: 90 },
                { name: "Thyroid Panel (T3, T4, TSH)", price: 180 },
                { name: "Vitamin D", price: 120 },
                { name: "Vitamin B12", price: 110 },
                { name: "Iron Studies", price: 180 },
                { name: "Urinalysis", price: 40 },
              ].map((row, i) => (
                <tr key={row.name} className={i % 2 === 0 ? "bg-white" : "bg-[#f8f8f6]"}>
                  <td className="p-3 border-b border-black/[0.06] text-[#1c1c1c]">{row.name}</td>
                  <td className="p-3 border-b border-black/[0.06] text-right text-[#1c1c1c] font-medium">
                    {row.price}
                  </td>
                </tr>
              ))}
              <tr className="bg-[#f8f8f6] font-bold">
                <td className="p-3 border-b border-black/[0.06] text-[#1c1c1c]">
                  Total if ordered individually
                </td>
                <td className="p-3 border-b border-black/[0.06] text-right text-[#1c1c1c]">825</td>
              </tr>
              <tr className="bg-[#006828]/[0.04]">
                <td className="p-3 text-[#1c1c1c] font-bold">
                  Comprehensive Wellness Package price
                </td>
                <td className="p-3 text-right font-bold text-[#006828] text-base">499</td>
              </tr>
            </tbody>
          </table>
          <div className="p-4 bg-[#f8f8f6] border-t border-black/[0.06] flex items-center gap-3">
            <TrendingDown className="w-5 h-5 text-[#006828] flex-shrink-0" />
            <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight">
              Package saves AED 326 — a{" "}
              <span className="text-[#006828]">39% saving</span> vs ordering
              individually at the same lab.
            </p>
          </div>
        </div>
      )}

      <div className="bg-[#f8f8f6] border border-black/[0.06] p-5 mb-12">
        <div className="flex items-start gap-3">
          <Wallet className="w-5 h-5 text-[#006828] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-['Bricolage_Grotesque',sans-serif] font-semibold text-[#1c1c1c] tracking-tight mb-2">
              When individual tests beat packages
            </p>
            <p className="font-['Geist',sans-serif] text-xs text-black/40 leading-relaxed">
              Packages are best value when you need most of the included tests.
              If you only need one or two tests (e.g., a repeat Vitamin D check
              three months into supplementation, or a single HbA1c for diabetes
              monitoring), ordering individually is cheaper than buying a full
              package. Budget labs like Medsol offer individual CBC from AED 69
              and Vitamin D from AED 85 — making targeted single-test monitoring
              highly affordable without buying a bundle.
            </p>
          </div>
        </div>
      </div>

      {/* Compare by Lab */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Compare Packages by Lab</h2>
      </div>
      <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 mb-4" data-answer-block="true">
        <p className="font-['Geist',sans-serif] text-xs text-black/40 mb-4">
          Each lab positions its packages differently. Medsol targets
          budget-conscious patients. Thumbay offers a strong mid-range value.
          Al Borg provides the widest range from basic to executive. Unilabs
          focuses on premium European-standard diagnostics. DarDoc adds the
          convenience of home collection included in the package price.
        </p>
      </div>
      <div className="space-y-6 mb-12">
        {packagesByLab.map(({ lab, packages }) => (
          <div key={lab.slug} className="border border-black/[0.06]">
            {/* Lab header */}
            <div className="p-4 bg-[#f8f8f6] border-b border-black/[0.06] flex items-center justify-between">
              <div>
                <Link
                  href={`/labs/${lab.slug}`}
                  className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[#1c1c1c] tracking-tight hover:text-[#006828] transition-colors text-sm"
                >
                  {lab.name}
                </Link>
                <p className="text-[11px] text-black/40 mt-0.5">{lab.description.slice(0, 100)}…</p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                {lab.homeCollection && (
                  <span className="text-[10px] bg-[#006828]/[0.04] text-[#006828]-dark px-2 py-0.5 font-bold">
                    Home collection{lab.homeCollectionFee === 0 ? " (free)" : ` (AED ${lab.homeCollectionFee})`}
                  </span>
                )}
                <Link
                  href={`/labs/${lab.slug}`}
                  className="flex items-center gap-1 text-xs font-bold text-[#006828] hover:text-[#006828]-dark transition-colors"
                >
                  View lab <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Package tiers for this lab */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {packages.map((pkg, i) => (
                <div
                  key={pkg.id}
                  className={`p-4 ${i < packages.length - 1 ? "border-b sm:border-b-0 sm:border-r border-black/[0.06]" : ""}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="text-xs font-bold text-[#1c1c1c]">{pkg.name}</p>
                      <p className="text-[10px] text-black/40 mt-0.5">{pkg.targetAudience}</p>
                    </div>
                    {pkg.price < BUDGET_MAX && (
                      <span className="text-[9px] bg-[#006828]/[0.04] text-[#006828]-dark px-1.5 py-0.5 font-bold flex-shrink-0">
                        Budget
                      </span>
                    )}
                    {pkg.price >= PREMIUM_MIN && (
                      <span className="text-[9px] bg-[#f8f8f6] text-[#1c1c1c] px-1.5 py-0.5 font-bold border border-black/[0.06] flex-shrink-0">
                        Premium
                      </span>
                    )}
                  </div>
                  <p className="text-lg font-bold text-[#1c1c1c]">{formatPrice(pkg.price)}</p>
                  <p className="text-[11px] text-black/40 mb-2">{pkg.biomarkerCount} biomarkers</p>
                  <div className="space-y-1">
                    {pkg.includes.slice(0, 3).map((item) => (
                      <div key={item} className="flex items-center gap-1.5 text-[11px] text-[#1c1c1c]">
                        <CheckCircle className="w-3 h-3 text-[#006828] flex-shrink-0" />
                        {item}
                      </div>
                    ))}
                    {pkg.includes.length > 3 && (
                      <p className="text-[10px] text-black/40">
                        +{pkg.includes.length - 3} more tests included
                      </p>
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {pkg.suitableFor.map((s) => (
                      <span key={s} className="text-[10px] bg-[#006828]/[0.04] text-[#006828]-dark px-1.5 py-0.5">
                        {s === "all" ? "Men & Women" : s === "male" ? "Men" : "Women"}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Choosing guide */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Which Package Should You Choose?</h2>
      </div>
      <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 mb-6" data-answer-block="true">
        <p className="font-['Geist',sans-serif] text-sm text-black/40 leading-relaxed mb-2">
          The right package depends on your age, health history, and budget. This
          quick guide matches common profiles to appropriate tiers:
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
        {[
          {
            icon: Wallet,
            profile: "Budget-conscious, under 35, no symptoms",
            recommendation: "Medsol Budget Health Check — AED 99",
            details:
              "Covers the 5 core tests. Sufficient for a young healthy adult seeking pre-employment or annual routine check. Add Vitamin D separately (AED 85) given UAE prevalence.",
          },
          {
            icon: FlaskConical,
            profile: "UAE resident 30-50, wants a thorough annual check",
            recommendation: "Thumbay Wellness Plus — AED 349 (72 biomarkers)",
            details:
              "The best-value comprehensive package in this directory. Covers vitamins, thyroid, diabetes markers, and full organ function. Free home collection available.",
          },
          {
            icon: Users,
            profile: "Woman planning pregnancy or with cycle concerns",
            recommendation: "Medsol Women's Health Panel — AED 399 (82 biomarkers)",
            details:
              "Includes FSH, estradiol, prolactin, AMH (ovarian reserve), folate, thyroid panel, iron, and all core wellness markers. Clinically appropriate pre-conception baseline.",
          },
          {
            icon: Star,
            profile: "Over 50, family history of heart or cancer",
            recommendation: "Al Borg Executive Health Screen — AED 899 (120 biomarkers)",
            details:
              "Adds cardiac CRP, PSA (men) or CA-125 (women), CEA (colorectal marker), and stool analysis on top of the full comprehensive panel. CAP and JCI accredited.",
          },
          {
            icon: Shield,
            profile: "Executive, wants premium European-standard diagnostics",
            recommendation: "Unilabs Executive Diagnostics — AED 999 (150 biomarkers)",
            details:
              "The most comprehensive package in the UAE. UKAS, CAP, ISO 15189 accredited. Includes cardiac troponin, BNP, full cancer marker panel, and advanced pathology review.",
          },
          {
            icon: Clock,
            profile: "Busy professional, doesn't want to leave home or office",
            recommendation: "DarDoc At-Home Comprehensive — AED 449 (78 biomarkers)",
            details:
              "Full wellness panel with DHA-licensed nurse visiting your location. Home collection included in the price. Results digitally within 24 hours. Book via app.",
          },
        ].map(({ icon: Icon, profile, recommendation, details }) => (
          <div key={profile} className="border border-black/[0.06] rounded-2xl p-5 hover:border-[#006828]/15 transition-colors">
            <div className="flex items-start gap-3 mb-3">
              <Icon className="w-5 h-5 text-[#006828] flex-shrink-0 mt-0.5" />
              <p className="text-xs font-bold text-black/40 uppercase tracking-wide">{profile}</p>
            </div>
            <p className="text-sm font-['Bricolage_Grotesque',sans-serif] font-semibold text-[#1c1c1c] tracking-tight mb-2">{recommendation}</p>
            <p className="font-['Geist',sans-serif] text-xs text-black/40 leading-relaxed">{details}</p>
          </div>
        ))}
      </div>

      {/* FAQ */}
      <FaqSection
        faqs={faqs}
        title="Health Check Packages UAE — Frequently Asked Questions"
      />

      {/* Browse more links */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            href: "/labs",
            label: "All UAE Labs",
            sublabel: `Compare prices across ${stats.totalLabs} labs`,
          },
          {
            href: "/labs/home-collection",
            label: "Home Collection",
            sublabel: `${stats.labsWithHomeCollection} labs deliver to your door`,
          },
          {
            href: "/labs/category/blood-routine",
            label: "Individual Blood Tests",
            sublabel: "Compare CBC, lipid, glucose & more",
          },
        ].map(({ href, label, sublabel }) => (
          <Link
            key={href}
            href={href}
            className="border border-black/[0.06] rounded-2xl p-5 hover:border-[#006828]/15 transition-colors group flex items-center justify-between gap-3"
          >
            <div>
              <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
                {label}
              </p>
              <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-0.5">{sublabel}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-black/40 group-hover:text-[#006828] transition-colors flex-shrink-0" />
          </Link>
        ))}
      </div>

      {/* Disclaimer */}
      <div className="mt-8 border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>Disclaimer:</strong> Package prices are based on publicly available
          pricing from lab websites and aggregator platforms (2024–2025). Actual prices
          may vary by branch location, insurance coverage, promotions, and seasonal
          offers. Savings calculations compare package prices to individually listed
          test prices at the same lab and are indicative only. This directory does not
          provide medical advice. Consult a physician to determine which health
          screening is appropriate for your individual circumstances. All labs listed
          are licensed by DHA, DOH, or MOHAP. Data last verified March 2026.
        </p>
      </div>
    </div>
  );
}
