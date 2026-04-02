import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { ProviderCard } from "@/components/provider/ProviderCard";
import { FaqSection } from "@/components/seo/FaqSection";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  getCityBySlug, getCategories, getCategoryBySlug,
  getInsuranceProviders, getProvidersByInsurance,
} from "@/lib/data";
import {
  breadcrumbSchema, faqPageSchema, itemListSchema, speakableSchema,
} from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

export const revalidate = 21600;

interface Props {
  params: { city: string; insurer: string; category: string };
}

// ─── Regulator helpers ────────────────────────────────────────────────────────

function getRegulatorName(citySlug: string): string {
  if (citySlug === "dubai") return "Dubai Health Authority (DHA)";
  if (citySlug === "abu-dhabi" || citySlug === "al-ain")
    return "Department of Health Abu Dhabi (DOH)";
  return "Ministry of Health and Prevention (MOHAP)";
}

function getRegulatorSlug(citySlug: string): "dha" | "doh" | "mohap" {
  if (citySlug === "dubai") return "dha";
  if (citySlug === "abu-dhabi" || citySlug === "al-ain") return "doh";
  return "mohap";
}

export const dynamicParams = true;

// ─── generateMetadata ─────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const city = getCityBySlug(params.city);
  if (!city) return {};
  const insurer = getInsuranceProviders().find((i) => i.slug === params.insurer);
  if (!insurer) return {};
  const category = getCategoryBySlug(params.category);
  if (!category) return {};

  const allProviders = await getProvidersByInsurance(insurer.slug, city.slug);
  const filtered = allProviders.filter((p) => p.categorySlug === category.slug);
  const count = filtered.length;
  const base = getBaseUrl();
  const regulator = getRegulatorName(city.slug);
  const url = `${base}/directory/${city.slug}/insurance/${insurer.slug}/${category.slug}`;

  const title = `${category.name} Accepting ${insurer.name} Insurance in ${city.name} | ${count} ${count === 1 ? "Provider" : "Providers"}`;
  const description = `Find ${count} ${regulator}-licensed ${category.name.toLowerCase()} in ${city.name} that accept ${insurer.name} insurance. Verified listings with ratings, reviews, and contact details. Last verified March 2026.`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${category.name} Accepting ${insurer.name} in ${city.name} — ${count} Providers`,
      description: `${count} ${regulator}-regulated ${category.name.toLowerCase()} in ${city.name} accept ${insurer.name}. Browse verified listings with ratings and contact details.`,
      url,
      type: "website",
    },
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function InsuranceCategoryPage({ params }: Props) {
  const city = getCityBySlug(params.city);
  if (!city) notFound();

  const allInsurers = getInsuranceProviders();
  const insurer = allInsurers.find((i) => i.slug === params.insurer);
  if (!insurer) notFound();

  const category = getCategoryBySlug(params.category);
  if (!category) notFound();

  const allProviders = await getProvidersByInsurance(insurer.slug, city.slug);
  const providers = allProviders
    .filter((p) => p.categorySlug === category.slug)
    .sort((a, b) => {
      const ratingDiff = Number(b.googleRating) - Number(a.googleRating);
      if (ratingDiff !== 0) return ratingDiff;
      return (b.googleReviewCount || 0) - (a.googleReviewCount || 0);
    });
  const count = providers.length;

  if (count === 0) notFound();

  const base = getBaseUrl();
  const regulator = getRegulatorName(city.slug);
  const regulatorSlug = getRegulatorSlug(city.slug);

  // ─── Quick stats ──────────────────────────────────────────────────────────────
  const ratedProviders = providers.filter((p) => Number(p.googleRating) > 0);
  const avgRating =
    ratedProviders.length > 0
      ? (
          ratedProviders.reduce((sum, p) => sum + Number(p.googleRating), 0) /
          ratedProviders.length
        ).toFixed(1)
      : null;
  const highestRated = ratedProviders.length > 0 ? ratedProviders[0] : null;

  // ─── Other categories accepting this insurer in this city (top 5) ────────────
  const categories = getCategories();
  const otherCategories = categories
    .filter((cat) => cat.slug !== category.slug)
    .map((cat) => ({
      ...cat,
      insurerCount: allProviders.filter((p) => p.categorySlug === cat.slug).length,
    }))
    .filter((c) => c.insurerCount > 0)
    .sort((a, b) => b.insurerCount - a.insurerCount)
    .slice(0, 5);

  // ─── Answer paragraph ────────────────────────────────────────────────────────
  const answerParagraph = `According to the UAE Open Healthcare Directory, there are ${count} ${category.name.toLowerCase()} in ${city.name} that accept ${insurer.name} insurance. Healthcare providers in ${city.name} are licensed by the ${regulator}. ${insurer.description} Data last verified March 2026.`;

  // ─── FAQs ────────────────────────────────────────────────────────────────────
  const catLower = category.name.toLowerCase();
  const catSingular = catLower.replace(/s$/, "");
  const faqs = [
    {
      question: `How many ${catLower} accept ${insurer.name} in ${city.name}?`,
      answer: `According to the UAE Open Healthcare Directory, there are ${count} ${regulatorSlug.toUpperCase()}-licensed ${catLower} in ${city.name} that accept ${insurer.name} insurance. All listings are cross-referenced with official government registers, last verified March 2026.`,
    },
    {
      question: `What is the best ${catSingular} accepting ${insurer.name} in ${city.name}?`,
      answer: highestRated
        ? `The highest-rated ${catSingular} accepting ${insurer.name} in ${city.name} is ${highestRated.name} with a ${highestRated.googleRating}-star Google rating${highestRated.googleReviewCount > 0 ? ` based on ${highestRated.googleReviewCount.toLocaleString()} patient reviews` : ""}. Browse all ${count} ${catLower} on this page to compare ratings, services, and contact details.`
        : `Browse all ${count} ${catLower} accepting ${insurer.name} in ${city.name} on this page to compare services, locations, and contact details. All providers are ${regulator}-licensed.`,
    },
    {
      question: `Does ${insurer.name} cover ${catLower} in ${city.name}?`,
      answer: `Yes. ${insurer.name} insurance is accepted at ${count} ${catLower} in ${city.name}, regulated by the ${regulator}. Coverage details, co-pay rates, and pre-authorisation requirements depend on your specific ${insurer.name} plan tier. Contact ${insurer.name} directly or your employer's HR broker for plan-specific details.`,
    },
    {
      question: `How do I find a ${catSingular} near me in ${city.name} that accepts ${insurer.name}?`,
      answer: `Use the UAE Open Healthcare Directory to browse ${count} ${catLower} in ${city.name} that accept ${insurer.name}. Each listing includes the full address, phone number, operating hours, and accepted insurance plans. You can also use the search tool to filter by area or services offered.`,
    },
  ];

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* JSON-LD */}
      <JsonLd data={breadcrumbSchema([
        { name: "UAE", url: base },
        { name: city.name, url: `${base}/directory/${city.slug}` },
        { name: "Insurance", url: `${base}/directory/${city.slug}/insurance` },
        { name: insurer.name, url: `${base}/directory/${city.slug}/insurance/${insurer.slug}` },
        { name: category.name },
      ])} />
      {providers.length > 0 && (
        <JsonLd data={itemListSchema(
          `${category.name} Accepting ${insurer.name} in ${city.name}`,
          providers.slice(0, 20),
          city.name,
          base,
        )} />
      )}
      <JsonLd data={faqPageSchema(faqs)} />
      <JsonLd data={speakableSchema([".answer-block"])} />

      {/* Breadcrumb */}
      <Breadcrumb items={[
        { label: "UAE", href: "/" },
        { label: city.name, href: `/directory/${city.slug}` },
        { label: "Insurance", href: `/directory/${city.slug}/insurance` },
        { label: insurer.name, href: `/directory/${city.slug}/insurance/${insurer.slug}` },
        { label: category.name },
      ]} />

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4 mb-2">
          <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight">
            {category.name} Accepting {insurer.name} in {city.name}
          </h1>
          <span className="inline-block bg-[#006828]/[0.08] text-[#006828] text-[10px] font-medium uppercase tracking-wide px-2.5 py-0.5 rounded-full font-['Geist',sans-serif] text-[9px] flex-shrink-0 mt-1">{insurer.type}</span>
        </div>
        <p className="font-['Geist',sans-serif] text-sm text-black/40">
          {count} verified {count === 1 ? "provider" : "providers"} · {regulator} licensed · Last updated March 2026
        </p>
      </div>

      {/* Answer Block */}
      <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 mb-8" data-answer-block="true">
        <p className="font-['Geist',sans-serif] text-black/40 leading-relaxed">{answerParagraph}</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="border border-black/[0.06] rounded-2xl p-5 text-center">
          <p className="text-2xl font-bold text-[#006828]">{count}</p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">Total Providers</p>
        </div>
        <div className="border border-black/[0.06] rounded-2xl p-5 text-center">
          <p className="text-2xl font-bold text-[#006828]">{avgRating || "—"}</p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">Average Rating</p>
        </div>
        <div className="border border-black/[0.06] rounded-2xl p-5 text-center">
          <p className="text-sm font-bold text-[#006828] truncate px-1">
            {highestRated ? highestRated.name : "—"}
          </p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">Highest Rated</p>
        </div>
      </div>

      {/* Cross-links */}
      <div className="flex flex-wrap gap-2 mb-8 text-xs">
        <Link
          href={`/directory/${city.slug}/${category.slug}`}
          className="border border-black/[0.06] px-3 py-1.5 text-black/40 hover:border-[#006828]/15 hover:text-[#006828] transition-colors"
        >
          All {category.name} in {city.name}
        </Link>
        <Link
          href={`/directory/${city.slug}/insurance/${insurer.slug}`}
          className="border border-black/[0.06] px-3 py-1.5 text-black/40 hover:border-[#006828]/15 hover:text-[#006828] transition-colors"
        >
          All {insurer.name} providers in {city.name}
        </Link>
        <Link
          href={`/insurance/${insurer.slug}`}
          className="border border-black/[0.06] px-3 py-1.5 text-black/40 hover:border-[#006828]/15 hover:text-[#006828] transition-colors"
        >
          {insurer.name} plans &amp; coverage
        </Link>
        <Link
          href="/insurance/compare"
          className="border border-black/[0.06] px-3 py-1.5 text-black/40 hover:border-[#006828]/15 hover:text-[#006828] transition-colors"
        >
          Compare insurers
        </Link>
      </div>

      {/* Other categories accepting this insurer */}
      {otherCategories.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Other Categories Accepting {insurer.name} in {city.name}</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {otherCategories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/directory/${city.slug}/insurance/${insurer.slug}/${cat.slug}`}
                className="flex items-center gap-2 border border-black/[0.06] px-3 py-2 hover:border-[#006828]/15 group transition-colors"
              >
                <span className="text-xs font-bold text-[#1c1c1c] group-hover:text-[#006828] transition-colors">
                  {cat.name}
                </span>
                <span className="bg-[#006828] text-white text-[10px] font-bold px-1.5 py-0.5 flex-shrink-0">
                  {cat.insurerCount}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Provider list */}
      <section className="mb-10">
        <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">{category.name} Accepting {insurer.name} in {city.name}</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {providers.slice(0, 40).map((p) => (
            <ProviderCard
              key={p.id}
              name={p.name}
              slug={p.slug}
              citySlug={p.citySlug}
              categorySlug={p.categorySlug}
              address={p.address}
              phone={p.phone}
              website={p.website}
              shortDescription={p.shortDescription}
              googleRating={p.googleRating}
              googleReviewCount={p.googleReviewCount}
              isClaimed={p.isClaimed}
              isVerified={p.isVerified}
            />
          ))}
        </div>
        {providers.length > 40 && (
          <div className="mt-4 text-center">
            <p className="font-['Geist',sans-serif] text-xs text-black/40">
              Showing 40 of {count.toLocaleString()} providers. Use the{" "}
              <Link href={`/search?city=${city.slug}&q=${encodeURIComponent(insurer.name + " " + category.name)}`} className="text-[#006828] font-bold">
                search tool
              </Link>{" "}
              to browse all.
            </p>
          </div>
        )}
      </section>

      {/* FAQs */}
      <FaqSection faqs={faqs} title={`${category.name} Accepting ${insurer.name} in ${city.name} — FAQ`} />

      {/* Disclaimer */}
      <div className="border-t border-black/[0.06] pt-4 mt-8">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>Disclaimer:</strong> Provider network data is sourced from official {regulator} registers and the UAE Open Healthcare Directory, last verified March 2026.
          Insurance acceptance can change — always confirm with the provider&apos;s insurance desk before your visit.
          For plan-specific coverage, co-pay, and pre-authorisation queries, contact {insurer.name} directly or your employer&apos;s HR broker.
        </p>
      </div>
    </div>
  );
}
