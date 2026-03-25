import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Home, Clock, MapPin, Award } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { FaqSection } from "@/components/seo/FaqSection";
import { PackageCard } from "@/components/labs/PackageCard";
import {
  LAB_PROFILES,
  getLabProfile,
  getPricesForLab,
  getPackagesForLab,
  getLabTest,
  formatPrice,
} from "@/lib/labs";
import { breadcrumbSchema, faqPageSchema, speakableSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

export const revalidate = 43200;

export function generateStaticParams() {
  return LAB_PROFILES.map((lab) => ({ lab: lab.slug }));
}

export function generateMetadata({ params }: { params: { lab: string } }): Metadata {
  const lab = getLabProfile(params.lab);
  if (!lab) return { title: "Lab Not Found" };

  const base = getBaseUrl();
  const prices = getPricesForLab(lab.slug);
  const cheapest = prices.length > 0 ? Math.min(...prices.map((p) => p.price)) : null;

  return {
    title: `${lab.name} — Lab Test Prices, Home Collection & Reviews | UAE Lab Test Comparison`,
    description:
      `${lab.name}: ${prices.length} lab test prices starting from ${cheapest ? `AED ${cheapest}` : "competitive rates"}. ` +
      `${lab.homeCollection ? `Home collection ${lab.homeCollectionFee === 0 ? "free" : `AED ${lab.homeCollectionFee}`}. ` : ""}` +
      `${lab.accreditations.join(", ")} accredited. Branches in ${lab.cities.map((c) => c.replace(/-/g, " ")).join(", ")}. ` +
      `Compare prices and book.`,
    alternates: { canonical: `${base}/labs/${lab.slug}` },
    openGraph: {
      title: `${lab.name} — Lab Test Prices & Home Collection`,
      description: `Compare ${prices.length} test prices at ${lab.name}. ${lab.accreditations.join(", ")} accredited.`,
      url: `${base}/labs/${lab.slug}`,
      type: "website",
    },
  };
}

export default function LabDetailPage({ params }: { params: { lab: string } }) {
  const lab = getLabProfile(params.lab);
  if (!lab) notFound();

  const base = getBaseUrl();
  const prices = getPricesForLab(lab.slug);
  const packages = getPackagesForLab(lab.slug);
  const cheapest = prices.length > 0 ? Math.min(...prices.map((p) => p.price)) : null;

  // Group prices by test category
  const pricesByCategory = new Map<string, typeof prices>();
  for (const p of prices) {
    const test = getLabTest(p.testSlug);
    if (!test) continue;
    const cat = test.category;
    if (!pricesByCategory.has(cat)) pricesByCategory.set(cat, []);
    pricesByCategory.get(cat)!.push(p);
  }

  const faqs = [
    {
      question: `How much do blood tests cost at ${lab.name}?`,
      answer:
        `${lab.name} offers ${prices.length} lab tests with prices starting ` +
        `from ${cheapest ? `AED ${cheapest}` : "competitive rates"}. ` +
        `Common tests: CBC ${prices.find((p) => p.testSlug === "cbc") ? `AED ${prices.find((p) => p.testSlug === "cbc")!.price}` : "available"}, ` +
        `Vitamin D ${prices.find((p) => p.testSlug === "vitamin-d") ? `AED ${prices.find((p) => p.testSlug === "vitamin-d")!.price}` : "available"}, ` +
        `Thyroid Panel ${prices.find((p) => p.testSlug === "thyroid-panel") ? `AED ${prices.find((p) => p.testSlug === "thyroid-panel")!.price}` : "available"}. ` +
        `Health check packages start from AED ${packages.length > 0 ? packages.reduce((min, p) => Math.min(min, p.price), Infinity) : "99"}.`,
    },
    {
      question: `Does ${lab.name} offer home collection?`,
      answer: lab.homeCollection
        ? `Yes, ${lab.name} offers home sample collection ${lab.homeCollectionFee === 0 ? "for free" : `for AED ${lab.homeCollectionFee}`}. ` +
          `DHA-licensed nurses visit your location and results are delivered digitally within ${lab.turnaroundHours} hours.`
        : `${lab.name} currently operates as a walk-in laboratory. You can visit any of their ${lab.branchCount} branch${lab.branchCount !== 1 ? "es" : ""} during operating hours.`,
    },
    {
      question: `Where are ${lab.name} branches located?`,
      answer:
        `${lab.name} has ${lab.branchCount > 0 ? `${lab.branchCount} branches` : "operations"} across ` +
        `${lab.cities.map((c) => c.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())).join(", ")}. ` +
        `Operating hours: ${lab.operatingHours}.`,
    },
    {
      question: `Is ${lab.name} accredited?`,
      answer:
        lab.accreditations.length > 0
          ? `${lab.name} holds ${lab.accreditations.join(", ")} accreditation${lab.accreditations.length > 1 ? "s" : ""}, ` +
            `and is licensed by ${lab.regulators.map((r) => r.toUpperCase()).join(", ")}. ` +
            `${lab.accreditations.includes("CAP") ? "CAP (College of American Pathologists) accreditation is the gold standard for clinical laboratories internationally." : ""}`
          : `${lab.name} is licensed by ${lab.regulators.map((r) => r.toUpperCase()).join(", ")} to operate diagnostic laboratory services in the UAE.`,
    },
  ];

  return (
    <div className="container-tc py-8">
      <JsonLd
        data={breadcrumbSchema([
          { name: "UAE", url: base },
          { name: "Lab Test Comparison", url: `${base}/labs` },
          { name: lab.name },
        ])}
      />
      <JsonLd data={speakableSchema([".answer-block"])} />
      <JsonLd data={faqPageSchema(faqs)} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "MedicalBusiness",
          name: lab.name,
          description: lab.description,
          url: `${base}/labs/${lab.slug}`,
          telephone: lab.phone,
          foundingDate: lab.foundedYear.toString(),
          areaServed: lab.cities.map((c) => ({
            "@type": "City",
            name: c.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
          })),
          hasCredential: lab.accreditations.map((a) => ({
            "@type": "EducationalOccupationalCredential",
            credentialCategory: a,
          })),
          openingHours: lab.operatingHours,
          makesOffer: prices.slice(0, 20).map((p) => ({
            "@type": "Offer",
            itemOffered: {
              "@type": "MedicalTest",
              name: p.testName,
            },
            price: p.price,
            priceCurrency: "AED",
          })),
        }}
      />

      <Breadcrumb
        items={[
          { label: "UAE", href: "/" },
          { label: "Lab Test Comparison", href: "/labs" },
          { label: lab.name },
        ]}
      />

      {/* Hero */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-dark mb-3">{lab.name}</h1>
        <div className="answer-block" data-answer-block="true">
          <p className="text-muted leading-relaxed mb-4">{lab.description}</p>
        </div>

        {/* Key info grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {cheapest && (
            <div className="bg-light-50 p-3">
              <p className="text-lg font-bold text-accent">From AED {cheapest}</p>
              <p className="text-[11px] text-muted">{prices.length} tests listed</p>
            </div>
          )}
          <div className="bg-light-50 p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Home className="w-4 h-4 text-accent" />
              <p className="text-xs font-bold text-dark">Home Collection</p>
            </div>
            <p className="text-[11px] text-muted">
              {lab.homeCollection
                ? lab.homeCollectionFee === 0
                  ? "Free"
                  : `AED ${lab.homeCollectionFee}`
                : "Not available"}
            </p>
          </div>
          <div className="bg-light-50 p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Clock className="w-4 h-4 text-accent" />
              <p className="text-xs font-bold text-dark">Results</p>
            </div>
            <p className="text-[11px] text-muted">{lab.turnaroundHours}h turnaround</p>
          </div>
          <div className="bg-light-50 p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Award className="w-4 h-4 text-accent" />
              <p className="text-xs font-bold text-dark">Accreditations</p>
            </div>
            <p className="text-[11px] text-muted">{lab.accreditations.join(", ") || "DHA Licensed"}</p>
          </div>
        </div>

        {/* Details row */}
        <div className="flex flex-wrap gap-4 text-xs text-muted">
          {lab.branchCount > 0 && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {lab.branchCount} branches in {lab.cities.map((c) => c.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())).join(", ")}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {lab.operatingHours}
          </span>
          <span>Founded {lab.foundedYear}</span>
          <span>Licensed by {lab.regulators.map((r) => r.toUpperCase()).join(", ")}</span>
        </div>
      </div>

      {/* Highlights */}
      {lab.highlights.length > 0 && (
        <div className="mb-8">
          <div className="section-header">
            <h2>Key Highlights</h2>
            <span className="arrows">&gt;&gt;&gt;</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {lab.highlights.map((h) => (
              <div key={h} className="flex items-center gap-2 text-sm text-dark p-2 bg-light-50">
                <ArrowRight className="w-3.5 h-3.5 text-accent flex-shrink-0" />
                {h}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Health Packages */}
      {packages.length > 0 && (
        <div className="mb-8">
          <div className="section-header">
            <h2>Health Check Packages</h2>
            <span className="arrows">&gt;&gt;&gt;</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {packages.map((pkg) => (
              <PackageCard key={pkg.id} pkg={pkg} />
            ))}
          </div>
        </div>
      )}

      {/* Test Prices by Category */}
      <div className="section-header">
        <h2>Test Prices at {lab.name}</h2>
        <span className="arrows">&gt;&gt;&gt;</span>
      </div>
      <div className="answer-block mb-4" data-answer-block="true">
        <p className="text-xs text-muted">
          {lab.name} offers {prices.length} lab tests across {pricesByCategory.size} categories.
          Prices are for walk-in patients without insurance. Click any test to compare
          prices across all UAE labs.
        </p>
      </div>

      {Array.from(pricesByCategory.entries()).map(([category, catPrices]) => (
        <div key={category} className="mb-6">
          <h3 className="text-sm font-bold text-dark mb-2 capitalize">
            {category.replace(/-/g, " ")}
          </h3>
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-light-200">
                  <th className="text-left py-2 px-3 text-xs font-bold text-dark">Test</th>
                  <th className="text-right py-2 px-3 text-xs font-bold text-dark">Price</th>
                  <th className="text-right py-2 px-3 text-xs font-bold text-dark" />
                </tr>
              </thead>
              <tbody>
                {catPrices.map((p, i) => (
                  <tr key={p.testSlug} className={i % 2 === 0 ? "bg-light-50" : ""}>
                    <td className="py-2 px-3">
                      <Link
                        href={`/labs/test/${p.testSlug}`}
                        className="text-xs font-medium text-dark hover:text-accent transition-colors"
                      >
                        {p.testName}
                      </Link>
                    </td>
                    <td className="py-2 px-3 text-right text-xs font-bold text-dark">
                      {formatPrice(p.price)}
                    </td>
                    <td className="py-2 px-3 text-right">
                      <Link
                        href={`/labs/test/${p.testSlug}`}
                        className="text-[11px] text-accent hover:text-accent-dark font-bold"
                      >
                        Compare →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {/* FAQ */}
      <div className="mt-12">
        <FaqSection faqs={faqs} title={`${lab.name} — FAQ`} />
      </div>

      {/* Disclaimer */}
      <div className="mt-8 border-t border-light-200 pt-4">
        <p className="text-[11px] text-muted leading-relaxed">
          <strong>Disclaimer:</strong> Prices shown for {lab.name} are indicative and based
          on publicly available data. Actual prices may vary by branch, insurance, and
          current promotions. Contact {lab.name} directly to confirm pricing before your
          visit. Last verified March 2026.
        </p>
      </div>
    </div>
  );
}
