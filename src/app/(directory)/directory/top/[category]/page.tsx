import { Metadata } from "next";
import { notFound } from "next/navigation";
import { ListingsTemplate, ListingsCrossLink } from "@/components/directory-v2/templates/ListingsTemplate";
import { FaqSection } from "@/components/seo/FaqSection";
import { JsonLd } from "@/components/seo/JsonLd";
import { getCategories, getCategoryBySlug, getProviders, LocalProvider } from "@/lib/data";
import { faqPageSchema, breadcrumbSchema, speakableSchema, itemListSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { safe } from "@/lib/safeData";

export const revalidate = 43200;

interface Props {
  params: { category: string };
}

/** Return categories that have 5+ qualified providers UAE-wide */
export async function generateStaticParams() {
  const categories = getCategories();
  const params: { category: string }[] = [];

  for (const cat of categories) {
    const { providers } = await safe(
      getProviders({ categorySlug: cat.slug, limit: 99999 }),
      { providers: [] as LocalProvider[], total: 0, page: 1, totalPages: 0 },
      "top-uae-cat:params",
    );
    const qualified = providers.filter(
      (p) => Number(p.googleRating) > 0 && p.googleReviewCount > 10
    );
    if (qualified.length >= 5) {
      params.push({ category: cat.slug });
    }
  }

  return params;
}

export function generateMetadata({ params }: Props): Metadata {
  const cat = getCategoryBySlug(params.category);
  if (!cat) return {};

  const base = getBaseUrl();
  const title = `Top 10 ${cat.name} in the UAE | Ranked by Patient Reviews`;
  const description = `The 10 highest-rated ${cat.name.toLowerCase()} across all emirates in the UAE, ranked by verified Google patient reviews. Updated March 2026.`;
  const url = `${base}/directory/top/${cat.slug}`;

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

export default async function TopCategoryUAEPage({ params }: Props) {
  const cat = getCategoryBySlug(params.category);
  if (!cat) notFound();

  const { providers: allProviders } = await safe(
    getProviders({
      categorySlug: cat.slug,
      limit: 99999,
    }),
    { providers: [] as LocalProvider[], total: 0, page: 1, totalPages: 0 },
    "top-uae-cat:page",
  );

  const top10 = allProviders
    .filter((p) => Number(p.googleRating) > 0 && p.googleReviewCount > 10)
    .sort((a, b) => {
      const ratingDiff = Number(b.googleRating) - Number(a.googleRating);
      if (ratingDiff !== 0) return ratingDiff;
      return (b.googleReviewCount || 0) - (a.googleReviewCount || 0);
    })
    .slice(0, 10);

  if (top10.length < 5) notFound();

  const base = getBaseUrl();
  const catLower = cat.name.toLowerCase();

  const faqs = [
    {
      question: `What are the top-rated ${catLower} in the UAE?`,
      answer: `According to the UAE Open Healthcare Directory, the highest-rated ${catLower} in the UAE as of March 2026 are: ${top10.slice(0, 5).map((p, i) => `${i + 1}. ${p.name} (${p.googleRating}★, ${p.googleReviewCount.toLocaleString()} reviews)`).join("; ")}. Rankings are based on verified Google patient reviews.`,
    },
    {
      question: `How are the top ${catLower} in the UAE ranked?`,
      answer:
        "Rankings on the UAE Open Healthcare Directory are determined by Google patient review ratings, with tie-breaking by total review count. Only providers with a rating above 0 and more than 10 verified reviews are eligible. Data is sourced from official government licensed facility registers and last verified March 2026.",
    },
    {
      question: `Are these ${catLower} in the UAE licensed?`,
      answer:
        "Yes. All providers listed in the UAE Open Healthcare Directory are sourced from official government registers. Depending on the emirate, healthcare is regulated by the Dubai Health Authority (DHA), the Department of Health (DOH), or the Ministry of Health and Prevention (MOHAP). All listed facilities hold valid health authority licenses.",
    },
  ];

  const breadcrumbSchemaItems = [
    { name: "UAE", url: base },
    { name: "Directory", url: `${base}/directory` },
    { name: "Top 10", url: `${base}/directory/top` },
    { name: cat.name, url: `${base}/directory/top/${cat.slug}` },
  ];

  const topRated = top10[0];

  return (
    <ListingsTemplate
      breadcrumbs={[
        { label: "UAE", href: "/" },
        { label: "Directory", href: "/directory" },
        { label: "Top 10", href: "/directory/top" },
        { label: cat.name },
      ]}
      eyebrow={`Top-rated · ${cat.name} · UAE`}
      title={`Top 10 ${catLower} in the UAE.`}
      subtitle={
        <span>
          The highest-rated {catLower} across all emirates by verified Google patient reviews. Only providers with a rating above 0 and more than 10 verified reviews are included.
        </span>
      }
      aeoAnswer={
        <>
          According to the UAE Open Healthcare Directory, these are the 10 highest-rated {catLower} in the UAE, ranked by Google patient reviews as of March 2026.
          {topRated && (
            <>
              {" "}The top-ranked provider is <strong>{topRated.name}</strong> with a {topRated.googleRating}-star rating based on {topRated.googleReviewCount.toLocaleString()} verified patient reviews.
            </>
          )}{" "}
          All listings are sourced from official DHA, DOH, and MOHAP licensed facility registers.
        </>
      }
      total={top10.length}
      providers={top10.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        citySlug: p.citySlug,
        categorySlug: p.categorySlug,
        categoryName: cat.name,
        address: p.address,
        googleRating: p.googleRating,
        googleReviewCount: p.googleReviewCount,
        isClaimed: p.isClaimed,
        isVerified: p.isVerified,
        photos: p.photos ?? null,
        coverImageUrl: p.coverImageUrl ?? null,
      }))}
      schemas={
        <>
          <JsonLd data={breadcrumbSchema(breadcrumbSchemaItems)} />
          <JsonLd data={speakableSchema([".answer-block"])} />
          <JsonLd data={faqPageSchema(faqs)} />
          <JsonLd data={itemListSchema(`Top 10 ${cat.name} in the UAE`, top10, "UAE", base)} />
        </>
      }
      belowGrid={
        <>
          <div>
            <h2 className="font-display font-semibold text-ink text-z-h1 mb-4">
              Related
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <ListingsCrossLink
                label="Browse the full UAE directory"
                href="/directory"
              />
              <ListingsCrossLink
                label="Top 10 across UAE"
                href="/directory/top"
              />
            </div>
          </div>

          {faqs.length > 0 && (
            <div>
              <h2 className="font-display font-semibold text-ink text-z-h1 mb-5">
                Top {catLower} in the UAE — FAQ
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
