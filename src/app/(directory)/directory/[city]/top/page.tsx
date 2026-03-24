import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { FaqSection } from "@/components/seo/FaqSection";
import { JsonLd } from "@/components/seo/JsonLd";
import { getCities, getCityBySlug, getProviders } from "@/lib/data";
import { faqPageSchema, breadcrumbSchema, speakableSchema, itemListSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

export const revalidate = 43200;

interface Props {
  params: { city: string };
}

/** Return cities that have 5+ qualified providers */
export function generateStaticParams() {
  const cities = getCities();
  const params: { city: string }[] = [];

  for (const city of cities) {
    const { providers } = getProviders({ citySlug: city.slug, limit: 99999 });
    const qualified = providers.filter(
      (p) => Number(p.googleRating) > 0 && p.googleReviewCount > 10
    );
    if (qualified.length >= 5) {
      params.push({ city: city.slug });
    }
  }

  return params;
}

function getRegulatorName(citySlug: string): string {
  if (citySlug === "dubai") return "the Dubai Health Authority (DHA)";
  if (citySlug === "abu-dhabi" || citySlug === "al-ain") return "the Department of Health (DOH)";
  return "the Ministry of Health and Prevention (MOHAP)";
}

export function generateMetadata({ params }: Props): Metadata {
  const city = getCityBySlug(params.city);
  if (!city) return {};

  const base = getBaseUrl();
  const title = `Top 10 Healthcare Providers in ${city.name}, UAE | Ranked by Patient Reviews`;
  const description = `The 10 highest-rated healthcare providers in ${city.name}, UAE, ranked by verified Google patient reviews. Updated March 2026.`;
  const url = `${base}/directory/${city.slug}/top`;

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

export default function TopCityPage({ params }: Props) {
  const city = getCityBySlug(params.city);
  if (!city) notFound();

  const { providers: allProviders } = getProviders({
    citySlug: city.slug,
    limit: 99999,
  });

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
  const regulator = getRegulatorName(city.slug);
  const pageUrl = `${base}/directory/${city.slug}/top`;

  const faqs = [
    {
      question: `What are the top-rated healthcare providers in ${city.name}, UAE?`,
      answer: `According to the UAE Open Healthcare Directory, the highest-rated healthcare providers in ${city.name} as of March 2026 are: ${top10.slice(0, 5).map((p, i) => `${i + 1}. ${p.name} (${p.googleRating}★, ${p.googleReviewCount.toLocaleString()} reviews)`).join("; ")}. Rankings are based on verified Google patient reviews.`,
    },
    {
      question: `How are the top healthcare providers in ${city.name} ranked?`,
      answer:
        "Rankings on the UAE Open Healthcare Directory are determined by Google patient review ratings, with tie-breaking by total review count. Only providers with a rating above 0 and more than 10 verified reviews are eligible. Data is sourced from official government licensed facility registers and last verified March 2026.",
    },
    {
      question: `Are these healthcare providers in ${city.name} licensed?`,
      answer: `Yes. All providers listed in the UAE Open Healthcare Directory are sourced from official government registers. Healthcare in ${city.name} is regulated by ${regulator}. All listed facilities hold valid health authority licenses.`,
    },
  ];

  const breadcrumbItems = [
    { name: "UAE", url: base },
    { name: city.name, url: `${base}/directory/${city.slug}` },
    { name: "Top 10", url: pageUrl },
  ];

  return (
    <>
      <div className="container-tc py-8">
        <JsonLd data={breadcrumbSchema(breadcrumbItems)} />
        <JsonLd data={speakableSchema([".answer-block"])} />
        <JsonLd data={faqPageSchema(faqs)} />
        <JsonLd data={itemListSchema(`Top 10 Healthcare Providers in ${city.name}`, top10, city.name, base)} />

        <Breadcrumb
          items={[
            { label: "UAE", href: "/" },
            { label: city.name, href: `/directory/${city.slug}` },
            { label: "Top 10" },
          ]}
        />

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-dark mb-3">
            Top 10 Healthcare Providers in {city.name}, UAE
          </h1>
          <p className="text-muted leading-relaxed mb-4">
            The healthcare providers below are the highest-rated in {city.name} by verified Google patient reviews,
            sourced from the UAE Open Healthcare Directory. Only providers with a rating above 0 and more than 10
            verified reviews are included. Healthcare in {city.name} is regulated by {regulator}.
          </p>

          <div className="answer-block mb-6" data-answer-block="true">
            <p className="text-muted leading-relaxed">
              According to the UAE Open Healthcare Directory, these are the 10 highest-rated healthcare providers in{" "}
              {city.name}, UAE, ranked by Google patient reviews as of March 2026.
              {top10[0] && (
                <>
                  {" "}
                  The top-ranked provider is <strong>{top10[0].name}</strong> with a {top10[0].googleRating}-star
                  rating based on {top10[0].googleReviewCount.toLocaleString()} verified patient reviews.
                </>
              )}{" "}
              All listings are sourced from official {regulator} licensed facility registers.
            </p>
          </div>
        </div>

        <section className="mb-10">
          <div className="section-header">
            <h2>Ranked List — Healthcare Providers in {city.name}</h2>
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
                    <div className="shrink-0 flex items-center gap-2">
                      <span className="badge">
                        #{index + 1} in {city.name}
                      </span>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="mb-10">
          <p className="text-sm text-muted">
            Looking for more options?{" "}
            <Link
              href={`/directory/${city.slug}`}
              className="text-accent hover:underline font-medium"
            >
              Browse all healthcare providers in {city.name} →
            </Link>
          </p>
        </section>

        <FaqSection faqs={faqs} title={`Top Healthcare Providers in ${city.name} — FAQ`} />
      </div>
    </>
  );
}
