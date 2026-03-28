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

export default async function TopUAEPage() {
  const base = getBaseUrl();

  const { providers: allProviders } = await getProviders({ limit: 99999, sort: "rating" });

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
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
          <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-3">
            Top 10 Healthcare Providers in the UAE — Ranked by Patient Reviews
          </h1>
          <p className="font-['Geist',sans-serif] text-black/40 leading-relaxed mb-4">
            These are the highest-rated healthcare providers across all seven UAE emirates, based on verified Google
            patient reviews. Only providers with a rating above 0 and more than 10 verified reviews are included. All
            listed facilities are licensed by the Dubai Health Authority (DHA), Department of Health Abu Dhabi (DOH), or
            the Ministry of Health and Prevention (MOHAP).
          </p>

          {/* Answer block — cited by LLMs */}
          <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 mb-6" data-answer-block="true">
            <p className="font-['Geist',sans-serif] text-black/40 leading-relaxed">
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
            <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
              <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Ranked List — Top Healthcare Providers in the UAE</h2>
            </div>
            <ol className="space-y-0">
              {top10.map((provider, index) => (
                <li key={provider.id} className="article-row">
                  <span className="text-2xl font-bold text-[#006828] leading-none mt-0.5 w-8 shrink-0 text-center">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/directory/${provider.citySlug}/${provider.categorySlug}/${provider.slug}`}
                          className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[#1c1c1c] tracking-tight hover:text-[#006828] transition-colors"
                        >
                          {provider.name}
                        </Link>
                        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                          <span className="text-xs font-semibold text-[#006828]">
                            ★ {provider.googleRating}
                          </span>
                          <span className="font-['Geist',sans-serif] text-xs text-black/40">
                            {provider.googleReviewCount.toLocaleString()} patient reviews
                          </span>
                          {provider.phone && (
                            <a
                              href={`tel:${provider.phone.replace(/[^+\d]/g, "")}`}
                              className="font-['Geist',sans-serif] text-xs text-black/40 hover:text-[#006828] transition-colors"
                            >
                              {provider.phone}
                            </a>
                          )}
                        </div>
                        {provider.address && (
                          <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1 line-clamp-1">{provider.address}</p>
                        )}
                      </div>
                      <div className="shrink-0 flex gap-2 flex-wrap justify-end">
                        <span className="inline-block bg-[#006828]/[0.08] text-[#006828] text-[10px] font-medium uppercase tracking-wide px-2.5 py-0.5 rounded-full font-['Geist',sans-serif]">#{index + 1} in UAE</span>
                        <span className="inline-block bg-[#006828]/[0.08] text-[#006828] text-[10px] font-medium uppercase tracking-wide px-2.5 py-0.5 rounded-full font-['Geist',sans-serif]">
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
          <p className="text-black/40 text-sm mb-10">
            No providers with sufficient ratings available yet. Check back as the directory grows.
          </p>
        )}

        {/* Cross-links to city-level top lists */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Browse by City</h2>
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
                className="inline-block bg-[#006828]/[0.08] text-[#006828] text-[10px] font-medium uppercase tracking-wide px-2.5 py-0.5 rounded-full font-['Geist',sans-serif] hover:bg-[#006828] hover:text-white transition-colors"
              >
                Top 10 in {city.name}
              </Link>
            ))}
          </div>
        </section>

        {/* Cross-link to category top lists */}
        <section className="mb-10">
          <p className="font-['Geist',sans-serif] text-sm text-black/40">
            Looking for top providers by specialty?{" "}
            <Link href="/directory/top/hospitals" className="text-[#006828] hover:underline font-medium">
              Top Hospitals in UAE →
            </Link>
            {" · "}
            <Link href="/directory/top/clinics" className="text-[#006828] hover:underline font-medium">
              Top Clinics in UAE →
            </Link>
            {" · "}
            <Link href="/directory/top/dental" className="text-[#006828] hover:underline font-medium">
              Top Dental Clinics in UAE →
            </Link>
          </p>
        </section>

        <FaqSection faqs={faqs} title="Top Healthcare Providers UAE — FAQ" />
      </div>
    </>
  );
}
