import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ChevronRight, Sparkles, Home, Clock, MapPin, Award } from "lucide-react";
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

  const cheapestPackage =
    packages.length > 0
      ? packages.reduce((min, p) => Math.min(min, p.price), Infinity)
      : null;

  const faqs = [
    {
      question: `How much do blood tests cost at ${lab.name}?`,
      answer:
        `${lab.name} offers ${prices.length} lab tests with prices starting ` +
        `from ${cheapest ? `AED ${cheapest}` : "competitive rates"}. ` +
        `Common tests: CBC ${prices.find((p) => p.testSlug === "cbc") ? `AED ${prices.find((p) => p.testSlug === "cbc")!.price}` : "available"}, ` +
        `Vitamin D ${prices.find((p) => p.testSlug === "vitamin-d") ? `AED ${prices.find((p) => p.testSlug === "vitamin-d")!.price}` : "available"}, ` +
        `Thyroid Panel ${prices.find((p) => p.testSlug === "thyroid-panel") ? `AED ${prices.find((p) => p.testSlug === "thyroid-panel")!.price}` : "available"}. ` +
        `Health check packages start from AED ${cheapestPackage ?? "99"}.`,
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

  const breadcrumbs = [
    { label: "UAE", href: "/" },
    { label: "Lab Test Comparison", href: "/labs" },
    { label: lab.name },
  ];

  return (
    <>
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

          <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-3 inline-flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            UAE diagnostic lab
          </p>
          <h1 className="font-display font-semibold text-ink text-display-lg lg:text-[56px] leading-[1.02] tracking-[-0.028em]">
            {lab.name}
          </h1>
          <p className="font-sans text-z-body sm:text-[17px] text-ink-soft mt-4 max-w-3xl leading-relaxed">
            {lab.description}
          </p>

          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl">
            {cheapest !== null && (
              <div className="rounded-z-md bg-white border border-ink-line px-4 py-3">
                <p className="font-display font-semibold text-ink text-z-h3 leading-none">
                  From AED {cheapest}
                </p>
                <p className="font-sans text-z-caption text-ink-muted mt-1">
                  {prices.length} tests
                </p>
              </div>
            )}
            <div className="rounded-z-md bg-white border border-ink-line px-4 py-3">
              <div className="inline-flex items-center gap-1.5 mb-1">
                <Home className="h-3.5 w-3.5 text-accent-dark" />
                <p className="font-sans text-z-caption text-ink-soft font-medium">
                  Home collection
                </p>
              </div>
              <p className="font-sans text-z-body-sm text-ink">
                {lab.homeCollection
                  ? lab.homeCollectionFee === 0
                    ? "Free"
                    : `AED ${lab.homeCollectionFee}`
                  : "Not available"}
              </p>
            </div>
            <div className="rounded-z-md bg-white border border-ink-line px-4 py-3">
              <div className="inline-flex items-center gap-1.5 mb-1">
                <Clock className="h-3.5 w-3.5 text-accent-dark" />
                <p className="font-sans text-z-caption text-ink-soft font-medium">
                  Results
                </p>
              </div>
              <p className="font-sans text-z-body-sm text-ink">
                {lab.turnaroundHours}h turnaround
              </p>
            </div>
            <div className="rounded-z-md bg-white border border-ink-line px-4 py-3">
              <div className="inline-flex items-center gap-1.5 mb-1">
                <Award className="h-3.5 w-3.5 text-accent-dark" />
                <p className="font-sans text-z-caption text-ink-soft font-medium">
                  Accreditations
                </p>
              </div>
              <p className="font-sans text-z-body-sm text-ink">
                {lab.accreditations.join(", ") || "DHA Licensed"}
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-4 font-sans text-z-caption text-ink-muted">
            {lab.branchCount > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {lab.branchCount} branches in{" "}
                {lab.cities
                  .map((c) => c.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()))
                  .join(", ")}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {lab.operatingHours}
            </span>
            <span>Founded {lab.foundedYear}</span>
            <span>
              Licensed by {lab.regulators.map((r) => r.toUpperCase()).join(", ")}
            </span>
          </div>
        </div>
      </section>

      <div className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-14">
        {/* Highlights */}
        {lab.highlights.length > 0 && (
          <section>
            <header className="mb-6">
              <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-2">
                What sets it apart
              </p>
              <h2 className="font-display font-semibold text-ink text-display-md tracking-[-0.018em]">
                Key highlights.
              </h2>
            </header>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {lab.highlights.map((h) => (
                <li
                  key={h}
                  className="flex items-start gap-2.5 rounded-z-md bg-white border border-ink-line p-4 font-sans text-z-body-sm text-ink leading-relaxed"
                >
                  <ArrowRight className="h-4 w-4 text-accent-dark mt-0.5 shrink-0" />
                  {h}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Health Packages */}
        {packages.length > 0 && (
          <section>
            <header className="mb-6">
              <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-2">
                Bundled tests
              </p>
              <h2 className="font-display font-semibold text-ink text-display-md tracking-[-0.018em]">
                Health check packages.
              </h2>
            </header>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {packages.map((pkg) => (
                <PackageCard key={pkg.id} pkg={pkg} />
              ))}
            </div>
          </section>
        )}

        {/* Test Prices by Category */}
        <section>
          <header className="mb-6">
            <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-2">
              Pricebook
            </p>
            <h2 className="font-display font-semibold text-ink text-display-md tracking-[-0.018em]">
              Test prices at {lab.name}.
            </h2>
            <p className="font-sans text-z-body-sm text-ink-muted mt-2 max-w-3xl">
              {lab.name} offers {prices.length} lab tests across{" "}
              {pricesByCategory.size} categories. Prices are for walk-in
              patients without insurance. Click any test to compare prices
              across all UAE labs.
            </p>
          </header>

          <div className="space-y-8">
            {Array.from(pricesByCategory.entries()).map(([category, catPrices]) => (
              <div key={category}>
                <h3 className="font-display font-semibold text-ink text-z-h3 mb-3 capitalize">
                  {category.replace(/-/g, " ")}
                </h3>
                <div className="rounded-z-md bg-white border border-ink-line overflow-x-auto">
                  <table className="w-full font-sans text-z-body-sm">
                    <thead>
                      <tr className="border-b border-ink-line text-ink-soft text-z-caption uppercase tracking-[0.04em]">
                        <th className="px-4 py-3 text-left font-medium">Test</th>
                        <th className="px-4 py-3 text-right font-medium">Price</th>
                        <th className="px-4 py-3 text-right font-medium" />
                      </tr>
                    </thead>
                    <tbody>
                      {catPrices.map((p) => (
                        <tr
                          key={p.testSlug}
                          className="border-b border-ink-hairline last:border-b-0"
                        >
                          <td className="px-4 py-3">
                            <Link
                              href={`/labs/test/${p.testSlug}`}
                              className="text-ink hover:text-accent-dark hover:underline decoration-1 underline-offset-2"
                            >
                              {p.testName}
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-ink">
                            {formatPrice(p.price)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Link
                              href={`/labs/test/${p.testSlug}`}
                              className="inline-flex items-center gap-1 font-sans text-z-caption font-medium text-accent-dark hover:underline"
                            >
                              Compare <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* FAQ */}
      <section className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-16 sm:pb-24">
        <header className="mb-6">
          <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-2">
            Questions
          </p>
          <h2 className="font-display font-semibold text-ink text-display-md tracking-[-0.018em]">
            About {lab.name}.
          </h2>
        </header>
        <div className="max-w-3xl">
          <FaqSection faqs={faqs} title={`${lab.name} — FAQ`} />
        </div>

        <div className="mt-12 rounded-z-md bg-white border border-ink-line p-6 max-w-3xl">
          <p className="font-sans text-z-caption text-ink-muted leading-relaxed">
            <strong className="text-ink-soft">Disclaimer.</strong> Prices shown
            for {lab.name} are indicative and based on publicly available data.
            Actual prices may vary by branch, insurance, and current
            promotions. Contact {lab.name} directly to confirm pricing before
            your visit. Last verified March 2026.
          </p>
        </div>
      </section>
    </>
  );
}
