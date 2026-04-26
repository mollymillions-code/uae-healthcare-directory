import { Metadata } from "next";
import Link from "next/link";
import { ListingsTemplate, ListingsCrossLink } from "@/components/directory-v2/templates/ListingsTemplate";
import { FaqSection } from "@/components/seo/FaqSection";
import { JsonLd } from "@/components/seo/JsonLd";
import { getCategories, getTopRatedProviders } from "@/lib/data";
import { faqPageSchema, breadcrumbSchema, speakableSchema, itemListSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { safe } from "@/lib/safeData";

export const revalidate = 43200;
export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  const base = getBaseUrl();
  const title = "Top 10 Healthcare Providers in the UAE | Ranked by Patient Reviews";
  const description =
    "The 10 highest-rated healthcare providers across the UAE, ranked by verified Google patient reviews as of March 2026. Sourced from official DHA, DOH, and MOHAP registers.";
  const url = `${base}/directory/top`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      type: "website",
      locale: "en_AE",
      siteName: "UAE Open Healthcare Directory",
      url,
    },
  };
}

export default async function TopUAEPage() {
  const base = getBaseUrl();

  const allProviders = await safe(
    getTopRatedProviders(undefined, 100),
    [],
    "top-uae:page",
  );

  const top10 = allProviders
    .filter((p) => Number(p.googleRating) > 0 && p.googleReviewCount > 10)
    .sort((a, b) => {
      const ratingDiff = Number(b.googleRating) - Number(a.googleRating);
      if (ratingDiff !== 0) return ratingDiff;
      return (b.googleReviewCount || 0) - (a.googleReviewCount || 0);
    })
    .slice(0, 10);

  const categories = getCategories();

  const faqs = [
    {
      question: "What is the best healthcare provider in the UAE?",
      answer:
        top10[0]
          ? `According to the UAE Open Healthcare Directory, the highest-rated healthcare provider in the UAE as of March 2026 is ${top10[0].name} with a ${top10[0].googleRating}-star Google rating based on ${top10[0].googleReviewCount.toLocaleString()} verified patient reviews.`
          : "According to the UAE Open Healthcare Directory, rankings are based on verified Google patient reviews. Browse all listings to compare providers by rating.",
    },
    {
      question: "How are UAE healthcare providers ranked?",
      answer:
        "Rankings on the UAE Open Healthcare Directory are determined by Google patient review ratings, with tie-breaking by total review count. Only providers with a rating above 0 and more than 10 verified reviews are eligible. Data sourced from official DHA, DOH, and MOHAP licensed facility registers, last verified March 2026.",
    },
    {
      question: "How many licensed healthcare providers are there in the UAE?",
      answer:
        "According to official government registers from the Dubai Health Authority (DHA), Department of Health Abu Dhabi (DOH), and the Ministry of Health and Prevention (MOHAP), there are 12,500+ licensed healthcare facilities across the seven emirates of the UAE.",
    },
  ];

  const breadcrumbSchemaItems = [
    { name: "UAE", url: base },
    { name: "Directory", url: `${base}/directory` },
    { name: "Top 10 UAE", url: `${base}/directory/top` },
  ];

  const topRated = top10[0];

  const cityLinks = [
    { slug: "dubai", name: "Dubai" },
    { slug: "abu-dhabi", name: "Abu Dhabi" },
    { slug: "sharjah", name: "Sharjah" },
    { slug: "al-ain", name: "Al Ain" },
    { slug: "ajman", name: "Ajman" },
    { slug: "ras-al-khaimah", name: "Ras Al Khaimah" },
    { slug: "fujairah", name: "Fujairah" },
    { slug: "umm-al-quwain", name: "Umm Al Quwain" },
  ];

  return (
    <ListingsTemplate
      breadcrumbs={[
        { label: "Directory", href: "/directory" },
        { label: "Top 10 UAE" },
      ]}
      eyebrow="Top-rated · UAE"
      title="Top 10 healthcare providers in the UAE."
      subtitle={
        <span>
          The highest-rated providers across all seven UAE emirates, by verified Google patient reviews. Only providers with a rating above 0 and more than 10 verified reviews are included. All facilities licensed by DHA, DOH, or MOHAP.
        </span>
      }
      aeoAnswer={
        <>
          According to the UAE Open Healthcare Directory, these are the highest-rated healthcare providers in the United Arab Emirates as of March 2026, ranked by Google patient reviews.
          {topRated && (
            <>
              {" "}The top-ranked provider is <strong>{topRated.name}</strong> with a {topRated.googleRating}-star rating based on {topRated.googleReviewCount.toLocaleString()} verified patient reviews.
            </>
          )}{" "}
          All listings are sourced from official government-licensed facility registers.
        </>
      }
      total={top10.length}
      providers={top10.map((p) => {
        const cat = categories.find((c) => c.slug === p.categorySlug);
        return {
          id: p.id,
          name: p.name,
          slug: p.slug,
          citySlug: p.citySlug,
          categorySlug: p.categorySlug,
          categoryName: cat?.name ?? null,
          address: p.address,
          googleRating: p.googleRating,
          googleReviewCount: p.googleReviewCount,
          isClaimed: p.isClaimed,
          isVerified: p.isVerified,
          photos: p.photos ?? null,
          coverImageUrl: p.coverImageUrl ?? null,
        };
      })}
      schemas={
        <>
          <JsonLd data={breadcrumbSchema(breadcrumbSchemaItems)} />
          <JsonLd data={speakableSchema([".answer-block"])} />
          <JsonLd data={faqPageSchema(faqs)} />
          {top10.length > 0 && (
            <JsonLd data={itemListSchema("Top 10 Healthcare Providers in the UAE", top10, "UAE", base)} />
          )}
        </>
      }
      belowGrid={
        <>
          <div>
            <h2 className="font-display font-semibold text-ink text-z-h1 mb-4">
              Top 10 by city
            </h2>
            <ul className="flex flex-wrap gap-2">
              {cityLinks.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/directory/${c.slug}/top`}
                    className="inline-flex items-center rounded-z-pill bg-white border border-ink-line px-3.5 py-1.5 font-sans text-z-body-sm text-ink hover:border-ink transition-colors"
                  >
                    Top 10 in {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="font-display font-semibold text-ink text-z-h1 mb-4">
              Top by specialty
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <ListingsCrossLink label="Top hospitals in UAE" href="/directory/top/hospitals" />
              <ListingsCrossLink label="Top clinics in UAE" href="/directory/top/clinics" />
              <ListingsCrossLink label="Top dental clinics in UAE" href="/directory/top/dental" />
            </div>
          </div>

          {faqs.length > 0 && (
            <div>
              <h2 className="font-display font-semibold text-ink text-z-h1 mb-5">
                Top healthcare providers UAE — FAQ
              </h2>
              <div className="max-w-3xl">
                <FaqSection faqs={faqs} />
              </div>
            </div>
          )}
        </>
      }
    />
  );
}
