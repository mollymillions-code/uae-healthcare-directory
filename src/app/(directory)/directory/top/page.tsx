import { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { FaqSection } from "@/components/seo/FaqSection";
import { JsonLd } from "@/components/seo/JsonLd";
import { getCategories, getProviders } from "@/lib/data";
import { faqPageSchema, breadcrumbSchema, speakableSchema, itemListSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

export const revalidate = 43200;

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

export default function TopUAEPage() {
  const base = getBaseUrl();

  const { providers: allProviders } = getProviders({ limit: 99999, sort: "rating" });

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

  const breadcrumbItems = [
    { name: "UAE", url: base },
    { name: "Directory", url: `${base}/directory` },
    { name: "Top 10 UAE", url: `${base}/directory/top` },
  ];

  return (
    <>
      <div className="container-tc py-8">
        <JsonLd data={breadcrumbSchema(breadcrumbItems)} />
        <JsonLd data={speakableSchema([".answer-block"])} />
        <JsonLd data={faqPageSchema(faqs)} />
        {top10.length > 0 && (
          <JsonLd data={itemListSchema("Top 10 Healthcare Providers in the UAE", top10, "UAE", base)} />
        )}

        <Breadcrumb
          items={[
            { label: "Directory", href: "/directory" },
            { label: "Top 10 UAE" },
          ]}
        />

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-dark mb-3">
            Top 10 Healthcare Providers in the UAE — Ranked by Patient Reviews
          </h1>
          <p className="text-muted leading-relaxed mb-4">
            These are the highest-rated healthcare providers across all seven UAE emirates, based on verified Google
            patient reviews. Only providers with a rating above 0 and more than 10 verified reviews are included. All
            listed facilities are licensed by the Dubai Health Authority (DHA), Department of Health Abu Dhabi (DOH), or
            the Ministry of Health and Prevention (MOHAP).
          </p>

          {/* Answer block — cited by LLMs */}
          <div className="answer-block mb-6" data-answer-block="true">
            <p className="text-muted leading-relaxed">
              According to the UAE Open Healthcare Directory, these are the highest-rated healthcare providers in the
              United Arab Emirates as of March 2026, ranked by Google patient reviews.
              {top10[0] && (
                <>
                  {" "}
                  The top-ranked provider is <strong>{top10[0].name}</strong> with a {top10[0].googleRating}-star rating
                  based on {top10[0].googleReviewCount.toLocaleString()} verified patient reviews.
                </>
              )}
              {" "}All listings are sourced from official government-licensed facility registers.
            </p>
          </div>
        </div>

        {top10.length > 0 ? (
          <section className="mb-10">
            <div className="section-header">
              <h2>Ranked List — Top Healthcare Providers in the UAE</h2>
              <span className="arrows">&gt;&gt;&gt;</span>
            </div>
            <ol className="space-y-0">
              {top10.map((provider, index) => (
                <li key={provider.id} className="article-row">
                  <span className="text-2xl font-bold text-accent leading-none mt-0.5 w-8 shrink-0 text-center">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/directory/${provider.citySlug}/${provider.categorySlug}/${provider.slug}`}
                          className="font-bold text-dark hover:text-accent transition-colors"
                        >
                          {provider.name}
                        </Link>
                        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                          <span className="text-xs font-semibold text-accent">
                            ★ {provider.googleRating}
                          </span>
                          <span className="text-xs text-muted">
                            {provider.googleReviewCount.toLocaleString()} patient reviews
                          </span>
                          {provider.phone && (
                            <a
                              href={`tel:${provider.phone.replace(/[^+\d]/g, "")}`}
                              className="text-xs text-muted hover:text-accent transition-colors"
                            >
                              {provider.phone}
                            </a>
                          )}
                        </div>
                        {provider.address && (
                          <p className="text-xs text-muted mt-1 line-clamp-1">{provider.address}</p>
                        )}
                      </div>
                      <div className="shrink-0 flex gap-2 flex-wrap justify-end">
                        <span className="badge">#{index + 1} in UAE</span>
                        <span className="badge">
                          {categories.find((c) => c.slug === provider.categorySlug)?.name || provider.categorySlug}
                        </span>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        ) : (
          <p className="text-muted text-sm mb-10">
            No providers with sufficient ratings available yet. Check back as the directory grows.
          </p>
        )}

        {/* Cross-links to city-level top lists */}
        <section className="mb-10">
          <div className="section-header">
            <h2>Browse by City</h2>
            <span className="arrows">&gt;&gt;&gt;</span>
          </div>
          <div className="flex flex-wrap gap-3">
            {[
              { slug: "dubai", name: "Dubai" },
              { slug: "abu-dhabi", name: "Abu Dhabi" },
              { slug: "sharjah", name: "Sharjah" },
              { slug: "al-ain", name: "Al Ain" },
              { slug: "ajman", name: "Ajman" },
              { slug: "ras-al-khaimah", name: "Ras Al Khaimah" },
              { slug: "fujairah", name: "Fujairah" },
              { slug: "umm-al-quwain", name: "Umm Al Quwain" },
            ].map((city) => (
              <Link
                key={city.slug}
                href={`/directory/${city.slug}/top`}
                className="badge hover:bg-accent hover:text-white transition-colors"
              >
                Top 10 in {city.name}
              </Link>
            ))}
          </div>
        </section>

        {/* Cross-link to category top lists */}
        <section className="mb-10">
          <p className="text-sm text-muted">
            Looking for top providers by specialty?{" "}
            <Link href="/directory/top/hospitals" className="text-accent hover:underline font-medium">
              Top Hospitals in UAE →
            </Link>
            {" · "}
            <Link href="/directory/top/clinics" className="text-accent hover:underline font-medium">
              Top Clinics in UAE →
            </Link>
            {" · "}
            <Link href="/directory/top/dental" className="text-accent hover:underline font-medium">
              Top Dental Clinics in UAE →
            </Link>
          </p>
        </section>

        <FaqSection faqs={faqs} title="Top Healthcare Providers UAE — FAQ" />
      </div>
    </>
  );
}
