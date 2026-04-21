import { Metadata } from "next";
import { notFound } from "next/navigation";
import { ListingsTemplate, ListingsCrossLink } from "@/components/directory-v2/templates/ListingsTemplate";
import { FaqSection } from "@/components/seo/FaqSection";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  getCityBySlug, getCategoryBySlug, getProviders, getProviderCountByCategoryAndCity,
  LocalProvider,
} from "@/lib/data";
import { breadcrumbSchema, speakableSchema, faqPageSchema, itemListSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { safe } from "@/lib/safeData";

export const revalidate = 43200;
// ISR only — no generateStaticParams. Prerendering ~54 city × category combos
// fired 54 DB count queries during build which exhausted the pg pool
// (Deploy 6 failure, 2026-04-11). ISR renders on first visit and caches 12h.
export const dynamicParams = true;
interface Props { params: { city: string; category: string } }
const WALK_IN_CATEGORY_SLUGS = ["clinics","dental","dermatology","ophthalmology","pediatrics","ent","pharmacy","labs-diagnostics","emergency-care"];

function getRegulatorName(s: string): string {
  if (s === "dubai") return "the Dubai Health Authority (DHA)";
  if (s === "abu-dhabi" || s === "al-ain") return "the Department of Health (DOH)";
  return "the Ministry of Health and Prevention (MOHAP)";
}
function getGPFeeRange(s: string): string {
  if (s === "dubai") return "AED 150-300";
  if (s === "abu-dhabi" || s === "al-ain") return "AED 100-250";
  if (s === "sharjah") return "AED 100-200";
  return "AED 80-200";
}
function getWalkInWaitEstimate(s: string): string {
  if (s === "emergency-care") return "immediate triage; non-critical cases within 30-120 minutes";
  if (s === "pharmacy") return "5-15 minutes";
  if (s === "labs-diagnostics") return "10-30 minutes";
  if (s === "dental") return "15-45 minutes for routine check-ups";
  return "15-45 minutes";
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const city = getCityBySlug(params.city);
  const cat = getCategoryBySlug(params.category);
  if (!city || !cat) return {};
  const count = await safe(
    getProviderCountByCategoryAndCity(cat.slug, city.slug),
    0,
    "walkin-cat:meta",
  );
  const base = getBaseUrl();
  const url = `${base}/directory/${city.slug}/walk-in/${cat.slug}`;
  return {
    title: `Walk-In ${cat.name} in ${city.name}, UAE | ${count}+ Providers`,
    description: `Find ${count}+ walk-in ${cat.name.toLowerCase()} in ${city.name}, UAE. No appointment needed. Browse by ratings, insurance, and hours. Updated March 2026.`,
    alternates: { canonical: url },
    openGraph: { title: `Walk-In ${cat.name} in ${city.name}, UAE`, description: `${count}+ walk-in ${cat.name.toLowerCase()} in ${city.name}. No appointment required.`, type: "website", locale: "en_AE", siteName: "UAE Open Healthcare Directory", url },
  };
}

export default async function WalkInCategoryPage({ params }: Props) {
  const city = getCityBySlug(params.city);
  const cat = getCategoryBySlug(params.category);
  if (!city || !cat) notFound();
  if (!WALK_IN_CATEGORY_SLUGS.includes(cat.slug)) notFound();
  const { providers: allProviders } = await safe(
    getProviders({ citySlug: city.slug, categorySlug: cat.slug, limit: 99999 }),
    { providers: [] as LocalProvider[], total: 0, page: 1, totalPages: 0 },
    "walkin-cat:page",
  );
  if (allProviders.length === 0) notFound();
  const base = getBaseUrl();
  const regulator = getRegulatorName(city.slug);
  const gpFee = getGPFeeRange(city.slug);
  const waitEstimate = getWalkInWaitEstimate(cat.slug);
  const count = allProviders.length;
  const catLower = cat.name.toLowerCase();
  const sorted = [...allProviders].sort((a, b) => {
    const r = Number(b.googleRating) - Number(a.googleRating);
    return r !== 0 ? r : (b.googleReviewCount || 0) - (a.googleReviewCount || 0);
  });
  const ratedProviders = sorted.filter((p) => Number(p.googleRating) > 0);

  const faqs = [
    { question: `How many walk-in ${catLower} are there in ${city.name}?`, answer: `According to the UAE Open Healthcare Directory, there are ${count} ${catLower} in ${city.name}, UAE that accept walk-in patients. Most ${catLower} in the UAE operate on a walk-in basis alongside appointment-based care. Data sourced from official government registers, last verified March 2026.` },
    { question: `What is the typical wait time at walk-in ${catLower} in ${city.name}?`, answer: `Walk-in wait times at ${catLower} in ${city.name} are typically ${waitEstimate}. Wait times may be longer during peak hours (8-10 AM and 5-8 PM). Calling ahead can help estimate current wait times.` },
    { question: `How much does a walk-in visit cost in ${city.name}?`, answer: `Walk-in consultation fees at ${catLower} in ${city.name} typically range from ${gpFee} for a general visit. Specialist or procedure-specific fees may be higher. Always confirm fees directly with the provider.` },
    { question: `Do walk-in ${catLower} in ${city.name} accept insurance?`, answer: `Yes, most ${catLower} in ${city.name} accept major UAE insurance plans including Daman, AXA, Cigna, MetLife, Bupa, and Oman Insurance. Use the insurance filter on individual provider pages to confirm.` },
    { question: `Are walk-in ${catLower} in ${city.name} open on weekends?`, answer: `Many ${catLower} in ${city.name} operate on weekends. Saturday hours are common. Friday hours may be limited to afternoons. Some 24-hour facilities accept walk-ins around the clock.` },
  ];

  const breadcrumbSchemaItems = [
    { name: "UAE", url: base },
    { name: city.name, url: `${base}/directory/${city.slug}` },
    { name: "Walk-In Clinics", url: `${base}/directory/${city.slug}/walk-in` },
    { name: cat.name, url: `${base}/directory/${city.slug}/walk-in/${cat.slug}` },
  ];

  const topRated = ratedProviders[0];

  return (
    <ListingsTemplate
      breadcrumbs={[
        { label: "UAE", href: "/" },
        { label: city.name, href: `/directory/${city.slug}` },
        { label: "Walk-In Clinics", href: `/directory/${city.slug}/walk-in` },
        { label: cat.name },
      ]}
      eyebrow={`Walk-in · ${cat.name} · ${city.name}`}
      title={`Walk-in ${catLower} in ${city.name}.`}
      subtitle={
        <span>
          {count} {catLower} in {city.name} accept walk-in patients. Typical wait: {waitEstimate}. Regulated by {regulator}.
        </span>
      }
      aeoAnswer={
        <>
          According to the UAE Open Healthcare Directory, there are {count} walk-in {catLower} in {city.name}. Most UAE clinics accept walk-in patients without appointments, though wait times vary from 15-45 minutes for GPs.
          {topRated && (
            <>
              {" "}The highest-rated is <strong>{topRated.name}</strong> with a {topRated.googleRating}-star Google rating{topRated.googleReviewCount > 0 ? ` based on ${topRated.googleReviewCount.toLocaleString()} patient reviews` : ""}.
            </>
          )}{" "}
          A standard consultation costs approximately {gpFee}. All listings are sourced from official government registers, last verified March 2026.
        </>
      }
      total={count}
      providers={sorted.map((p) => ({
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
          {ratedProviders.length >= 5 && (
            <JsonLd data={itemListSchema(`Walk-In ${cat.name} in ${city.name}`, ratedProviders.slice(0, 10), city.name, base)} />
          )}
        </>
      }
      belowGrid={
        <>
          <div>
            <h2 className="font-display font-semibold text-ink text-z-h1 mb-4">
              Related in {city.name}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <ListingsCrossLink
                label={`All walk-in clinics in ${city.name}`}
                href={`/directory/${city.slug}/walk-in`}
              />
              <ListingsCrossLink
                label={`All ${catLower} in ${city.name}`}
                href={`/directory/${city.slug}/${cat.slug}`}
              />
              <ListingsCrossLink
                label={`Insurance in ${city.name}`}
                href={`/directory/${city.slug}/insurance`}
                sub="Daman, AXA, Cigna..."
              />
            </div>
          </div>

          {faqs.length > 0 && (
            <div>
              <h2 className="font-display font-semibold text-ink text-z-h1 mb-5">
                Walk-in {catLower} in {city.name} — FAQ
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
