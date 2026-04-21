import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ListingsTemplate, ListingsCrossLink } from "@/components/directory-v2/templates/ListingsTemplate";
import { FaqSection } from "@/components/seo/FaqSection";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  getCityBySlug, getCategories, getProviders, getProviderCountByCategoryAndCity,
  LocalProvider,
} from "@/lib/data";
import { breadcrumbSchema, speakableSchema, faqPageSchema, itemListSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { safe } from "@/lib/safeData";

export const revalidate = 43200;
// ISR only — no generateStaticParams. The page does a heavy
// getProviders({ limit: 99999 }) during render; prerendering all cities at
// build time in parallel blew the pg pool (Deploy 6 failure, 2026-04-11).
// Pages render on first visit and cache for 12 hours.
export const dynamicParams = true;
interface Props { params: { city: string } }

async function getWalkInProvidersLocal(citySlug: string) {
  const { providers } = await safe(
    getProviders({ citySlug, categorySlug: "clinics", limit: 99999 }),
    { providers: [] as LocalProvider[], total: 0, page: 1, totalPages: 0 },
    "walkin:city",
  );
  return providers;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const city = getCityBySlug(params.city);
  if (!city) return {};
  const count = (await getWalkInProvidersLocal(city.slug)).length;
  const base = getBaseUrl();
  const url = `${base}/directory/${city.slug}/walk-in`;
  return {
    title: `Walk-In Clinics in ${city.name}, UAE | ${count}+ No-Appointment Clinics`,
    description: `Find ${count}+ walk-in clinics in ${city.name}, UAE that accept patients without appointments. Browse polyclinics, general clinics, and medical centers with ratings, hours, and insurance details. Updated March 2026.`,
    alternates: { canonical: url },
    openGraph: { title: `Walk-In Clinics in ${city.name}, UAE`, description: `${count}+ walk-in clinics in ${city.name} that accept patients without appointments.`, type: "website", locale: "en_AE", siteName: "UAE Open Healthcare Directory", url },
  };
}

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

export default async function WalkInClinicsPage({ params }: Props) {
  const city = getCityBySlug(params.city);
  if (!city) notFound();
  const allWalkIns = await getWalkInProvidersLocal(city.slug);
  if (allWalkIns.length === 0) notFound();
  const base = getBaseUrl();
  const regulator = getRegulatorName(city.slug);
  const gpFee = getGPFeeRange(city.slug);
  const count = allWalkIns.length;
  const sorted = [...allWalkIns].sort((a, b) => {
    const r = Number(b.googleRating) - Number(a.googleRating);
    return r !== 0 ? r : (b.googleReviewCount || 0) - (a.googleReviewCount || 0);
  });
  const ratedProviders = sorted.filter((p) => Number(p.googleRating) > 0);
  const walkInCategorySlugs = ["clinics","dental","dermatology","ophthalmology","pediatrics","ent","pharmacy","labs-diagnostics","emergency-care"];
  const catCounts = await Promise.all(
    walkInCategorySlugs.map((slug) =>
      safe(getProviderCountByCategoryAndCity(slug, city.slug), 0, `walkin:count:${slug}`),
    ),
  );
  const categories = getCategories();
  const walkInCategories = categories.filter((cat) => {
    const idx = walkInCategorySlugs.indexOf(cat.slug);
    return idx >= 0 && catCounts[idx] > 0;
  });

  const faqs = [
    { question: `How many walk-in clinics are there in ${city.name}?`, answer: `According to the UAE Open Healthcare Directory, there are ${count}+ walk-in friendly clinics and polyclinics in ${city.name}, UAE. These include general practice clinics, multi-specialty polyclinics, and family medicine centers that accept patients without prior appointments. Data sourced from official ${regulator} registers, last verified March 2026.` },
    { question: `What is the typical wait time at walk-in clinics in ${city.name}?`, answer: `Walk-in wait times at clinics in ${city.name} typically range from 15 to 45 minutes for GP consultations. Wait times may be longer during morning rush (8-10 AM) and evening hours (5-8 PM). Multi-specialty polyclinics generally have shorter wait times due to multiple practitioners on staff.` },
    { question: `How much does a walk-in GP consultation cost in ${city.name}?`, answer: `A standard walk-in GP consultation in ${city.name} typically costs ${gpFee}, depending on the clinic tier and whether you pay out-of-pocket or through insurance. Specialist walk-in consultations may cost AED 300-800. Always confirm fees directly with the provider.` },
    { question: `Do walk-in clinics in ${city.name} accept insurance?`, answer: `Yes, most walk-in clinics in ${city.name} accept major UAE insurance plans including Daman, AXA, Cigna, MetLife, Bupa, and Oman Insurance. Check individual provider listings for specific plan acceptance.` },
    { question: `Are walk-in clinics in ${city.name} open on weekends?`, answer: `Many walk-in clinics in ${city.name} operate on weekends, particularly those in shopping malls, residential areas, and 24-hour polyclinics. Saturday hours are common; Friday hours may be limited to afternoon/evening.` },
    { question: `What services do walk-in clinics in ${city.name} offer?`, answer: `Walk-in clinics in ${city.name} typically offer general practice consultations, basic health screenings, minor injury treatment, vaccinations, prescription renewals, sick notes, blood tests, and referrals to specialists.` },
  ];

  const breadcrumbSchemaItems = [
    { name: "UAE", url: base },
    { name: city.name, url: `${base}/directory/${city.slug}` },
    { name: "Walk-In Clinics", url: `${base}/directory/${city.slug}/walk-in` },
  ];

  const topRated = ratedProviders[0];

  return (
    <ListingsTemplate
      breadcrumbs={[
        { label: "UAE", href: "/" },
        { label: city.name, href: `/directory/${city.slug}` },
        { label: "Walk-In Clinics" },
      ]}
      eyebrow={`Walk-in · ${city.name}`}
      title={`Walk-in clinics in ${city.name}.`}
      subtitle={
        <span>
          {count}+ clinics and polyclinics in {city.name} that accept walk-in patients — typical GP wait: 15-45 minutes. Regulated by {regulator}.
        </span>
      }
      aeoAnswer={
        <>
          According to the UAE Open Healthcare Directory, there are {count}+ walk-in clinics in {city.name}. Most UAE clinics accept walk-in patients without appointments, though wait times vary from 15-45 minutes for GPs.
          {topRated && (
            <>
              {" "}The highest-rated walk-in clinic is <strong>{topRated.name}</strong> with a {topRated.googleRating}-star Google rating{topRated.googleReviewCount > 0 ? ` based on ${topRated.googleReviewCount.toLocaleString()} patient reviews` : ""}.
            </>
          )}{" "}
          A standard GP walk-in consultation costs {gpFee}. All listings are sourced from official government registers, last verified March 2026.
        </>
      }
      total={count}
      providers={sorted.map((p) => {
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
          {ratedProviders.length >= 5 && (
            <JsonLd data={itemListSchema(`Walk-In Clinics in ${city.name}`, ratedProviders.slice(0, 10), city.name, base)} />
          )}
        </>
      }
      belowGrid={
        <>
          {walkInCategories.length > 1 && (
            <div>
              <h2 className="font-display font-semibold text-ink text-z-h1 mb-4">
                Walk-in {city.name.toLowerCase()} by specialty
              </h2>
              <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {walkInCategories.map((cat) => {
                  const cc = catCounts[walkInCategorySlugs.indexOf(cat.slug)] ?? 0;
                  return (
                    <li key={cat.slug}>
                      <Link
                        href={`/directory/${city.slug}/walk-in/${cat.slug}`}
                        className="flex items-center justify-between bg-white border border-ink-line rounded-z-md px-4 py-3 hover:border-ink transition-colors"
                      >
                        <span className="font-sans text-z-body-sm font-medium text-ink">Walk-in {cat.name}</span>
                        <span className="font-sans text-z-caption text-ink-muted">{cc} {cc === 1 ? "provider" : "providers"}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          <div>
            <h2 className="font-display font-semibold text-ink text-z-h1 mb-4">
              Related in {city.name}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <ListingsCrossLink
                label={`All healthcare in ${city.name}`}
                href={`/directory/${city.slug}`}
              />
              <ListingsCrossLink
                label={`Insurance in ${city.name}`}
                href={`/directory/${city.slug}/insurance`}
                sub="Daman, AXA, Cigna..."
              />
              <ListingsCrossLink
                label={`Top-rated in ${city.name}`}
                href={`/directory/${city.slug}/top`}
                sub="By patient reviews"
              />
            </div>
          </div>

          {faqs.length > 0 && (
            <div>
              <h2 className="font-display font-semibold text-ink text-z-h1 mb-5">
                Walk-in clinics in {city.name} — FAQ
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
