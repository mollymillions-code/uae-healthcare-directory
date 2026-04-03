import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { ProviderCard } from "@/components/provider/ProviderCard";
import { ProviderListPaginated } from "@/components/directory/ProviderListPaginated";
// StarRating available if needed
import dynamic from "next/dynamic";
const GoogleMapEmbed = dynamic(() => import("@/components/maps/GoogleMapEmbed").then(mod => mod.GoogleMapEmbed), { ssr: false, loading: () => <div className="w-full h-64 bg-[#f8f8f6] animate-pulse" /> });
import { FaqSection } from "@/components/seo/FaqSection";
import { JsonLd } from "@/components/seo/JsonLd";
import { Pagination } from "@/components/shared/Pagination";
import {
  getCityBySlug, getCategories,
  getAreaBySlug, getAreasByCity,
  getProviders, getTopRatedProviders,
  getInsuranceProviders,
} from "@/lib/data";
import { loadDbArticles, getArticlesByDirectoryContext } from "@/lib/intelligence/data";
import { getJournalCategory } from "@/lib/intelligence/categories";
import { formatDate } from "@/components/intelligence/utils";
import {
  medicalOrganizationSchema, breadcrumbSchema, itemListSchema,
  faqPageSchema, speakableSchema, generateFacetAnswerBlock, generateFacetFaqs,
  generateProviderParagraph,
} from "@/lib/seo";
import { getBaseUrl, getCategoryImagePath } from "@/lib/helpers";
import {
  getCategoryImageUrl, hasValidHours, formatVerifiedDate,
  resolveSegments, DAY_NAMES_EN,
} from "@/lib/directory-utils";
import Image from "next/image";
import {
  MapPin, Phone, Globe, Clock, Shield, Languages, Stethoscope,
  CheckCircle, ExternalLink, Calendar, MessageSquareQuote, Activity, ArrowRight,
} from "lucide-react";
import {
  PROCEDURES,
  getProcedureBySlug,
  formatAed,
  type MedicalProcedure,
} from "@/lib/constants/procedures";
import { CITIES } from "@/lib/constants/cities";

// ISR: pages built on first visit, cached for 6 hours. No SSG pre-rendering.
export const revalidate = 21600;
export const dynamicParams = true;

interface Props {
  params: { city: string; segments: string[] };
}

// No generateStaticParams — pages render on-demand via ISR.
// Google discovers them via sitemap.xml and internal links.

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const city = getCityBySlug(params.city);
  if (!city) return {};
  const resolved = await resolveSegments(city.slug, params.segments);
  if (!resolved) return {};
  const base = getBaseUrl();

  switch (resolved.type) {
    case "city-category": {
      const { total } = await getProviders({ citySlug: city.slug, categorySlug: resolved.category.slug, limit: 1 });
      return {
        title: `${resolved.category.name} in ${city.name}, UAE | ${total} ${total === 1 ? "Provider" : "Providers"}`,
        description: `Find ${resolved.category.name.toLowerCase()} in ${city.name}, UAE. ${total} verified ${total === 1 ? "provider" : "providers"} with contact details. Last verified March 2026.`,
        alternates: {
          canonical: `${base}/directory/${city.slug}/${resolved.category.slug}`,
          languages: {
            'en-AE': `${base}/directory/${city.slug}/${resolved.category.slug}`,
            'ar-AE': `${base}/ar/directory/${city.slug}/${resolved.category.slug}`,
            'x-default': `${base}/directory/${city.slug}/${resolved.category.slug}`,
          },
        },
        openGraph: {
          title: `${resolved.category.name} in ${city.name}, UAE`,
          description: `${total} ${resolved.category.name.toLowerCase()} in ${city.name}. Browse verified listings.`,
          type: 'website',
          locale: 'en_AE',
          siteName: 'UAE Open Healthcare Directory',
          url: `${base}/directory/${city.slug}/${resolved.category.slug}`,
          images: [{ url: getCategoryImageUrl(resolved.category.slug, base), width: 1200, height: 630, alt: `${resolved.category.name} in ${city.name}` }],
        },
      };
    }
    case "city-area": {
      const { total } = await getProviders({ citySlug: city.slug, areaSlug: resolved.area.slug, limit: 1 });
      return {
        title: `Healthcare in ${resolved.area.name}, ${city.name} | ${total} ${total === 1 ? "Provider" : "Providers"}`,
        description: `Find healthcare providers in ${resolved.area.name}, ${city.name}, UAE. Hospitals, clinics, and specialists with ratings.`,
        alternates: {
          canonical: `${base}/directory/${city.slug}/${resolved.area.slug}`,
          languages: {
            'en-AE': `${base}/directory/${city.slug}/${resolved.area.slug}`,
            'ar-AE': `${base}/ar/directory/${city.slug}/${resolved.area.slug}`,
            'x-default': `${base}/directory/${city.slug}/${resolved.area.slug}`,
          },
        },
        openGraph: {
          title: `Healthcare in ${resolved.area.name}, ${city.name}`,
          description: `${total} healthcare providers in ${resolved.area.name}, ${city.name}. Browse verified listings.`,
          type: 'website',
          locale: 'en_AE',
          siteName: 'UAE Open Healthcare Directory',
          url: `${base}/directory/${city.slug}/${resolved.area.slug}`,
          images: [{ url: `${base}/images/categories/clinics.webp`, width: 1200, height: 630, alt: `Healthcare in ${resolved.area.name}, ${city.name}` }],
        },
      };
    }
    case "area-category": {
      const { total } = await getProviders({ citySlug: city.slug, areaSlug: resolved.area.slug, categorySlug: resolved.category.slug, limit: 1 });
      return {
        title: `${resolved.category.name} in ${resolved.area.name}, ${city.name} | ${total} ${total === 1 ? "Provider" : "Providers"}`,
        description: `Find ${resolved.category.name.toLowerCase()} in ${resolved.area.name}, ${city.name}, UAE. ${total} verified ${total === 1 ? "provider" : "providers"}.`,
        alternates: {
          canonical: `${base}/directory/${city.slug}/${resolved.area.slug}/${resolved.category.slug}`,
          languages: {
            'en-AE': `${base}/directory/${city.slug}/${resolved.area.slug}/${resolved.category.slug}`,
            'ar-AE': `${base}/ar/directory/${city.slug}/${resolved.area.slug}/${resolved.category.slug}`,
            'x-default': `${base}/directory/${city.slug}/${resolved.area.slug}/${resolved.category.slug}`,
          },
        },
        openGraph: {
          title: `${resolved.category.name} in ${resolved.area.name}, ${city.name}`,
          description: `${total} ${resolved.category.name.toLowerCase()} in ${resolved.area.name}, ${city.name}. Browse verified listings.`,
          type: 'website',
          locale: 'en_AE',
          siteName: 'UAE Open Healthcare Directory',
          url: `${base}/directory/${city.slug}/${resolved.area.slug}/${resolved.category.slug}`,
          images: [{ url: getCategoryImageUrl(resolved.category.slug, base), width: 1200, height: 630, alt: `${resolved.category.name} in ${resolved.area.name}, ${city.name}` }],
        },
      };
    }
    case "area-insurance": {
      const { area } = resolved;
      const url = `${base}/directory/${city.slug}/${area.slug}/insurance`;
      return {
        title: `Insurance Coverage in ${area.name}, ${city.name} | UAE Open Healthcare Directory`,
        description: `Find healthcare providers by insurance plan in ${area.name}, ${city.name}, UAE. Browse accepted insurers — Daman, Thiqa, AXA, Cigna, and more. Verified listings, last updated March 2026.`,
        alternates: { canonical: url },
        openGraph: {
          title: `Insurance Coverage in ${area.name}, ${city.name}`,
          description: `Healthcare providers by insurance plan in ${area.name}, ${city.name}. Browse all accepted insurers.`,
          url,
          type: "website",
          locale: 'en_AE',
          siteName: 'UAE Open Healthcare Directory',
          images: [{ url: `${base}/images/categories/clinics.webp`, width: 1200, height: 630, alt: `Insurance Coverage in ${area.name}, ${city.name}` }],
        },
      };
    }
    case "listing": {
      const listingCanonical = `${base}/directory/${city.slug}/${resolved.category.slug}/${resolved.provider.slug}`;
      const isEnriched = Boolean(resolved.provider.googleRating && Number(resolved.provider.googleRating) > 0) || Boolean(resolved.provider.phone) || Boolean(resolved.provider.website);
      return {
        title: `${resolved.provider.name} | ${resolved.category.name} in ${city.name}`,
        description: `${resolved.provider.shortDescription} ${resolved.provider.googleRating && Number(resolved.provider.googleRating) > 0 ? `Rating: ${resolved.provider.googleRating}/5.` : ""} Last verified ${formatVerifiedDate(resolved.provider.lastVerified)}.`,
        ...(!isEnriched ? { robots: { index: true, follow: true, "max-snippet": 50 } } : {}),
        alternates: {
          canonical: listingCanonical,
          languages: {
            'en-AE': listingCanonical,
            'ar-AE': `${base}/ar/directory/${city.slug}/${resolved.category.slug}/${resolved.provider.slug}`,
            'x-default': listingCanonical,
          },
        },
        openGraph: {
          title: `${resolved.provider.name} | ${resolved.category.name} in ${city.name}`,
          description: resolved.provider.shortDescription || '',
          type: 'website',
          locale: 'en_AE',
          siteName: 'UAE Open Healthcare Directory',
          url: listingCanonical,
          images: [{ url: getCategoryImageUrl(resolved.category.slug, base), width: 1200, height: 630, alt: `${resolved.provider.name} — ${resolved.category.name} in ${city.name}` }],
        },
      };
    }
    case "city-category-subcategory": {
      const { total } = await getProviders({ citySlug: city.slug, categorySlug: resolved.category.slug, subcategorySlug: resolved.subcategory.slug, limit: 1 });
      return {
        title: `${resolved.subcategory.name} in ${city.name} | ${resolved.category.name}`,
        description: `Find ${resolved.subcategory.name} specialists in ${city.name}, UAE. ${total} verified ${total === 1 ? "provider" : "providers"} with ratings and reviews. Last verified March 2026.`,
        alternates: {
          canonical: `${base}/directory/${city.slug}/${resolved.category.slug}/${resolved.subcategory.slug}`,
        },
        openGraph: {
          title: `${resolved.subcategory.name} in ${city.name} | ${resolved.category.name}`,
          description: `${total} ${resolved.subcategory.name.toLowerCase()} specialists in ${city.name}. Browse verified listings.`,
          type: 'website',
          locale: 'en_AE',
          siteName: 'UAE Open Healthcare Directory',
          url: `${base}/directory/${city.slug}/${resolved.category.slug}/${resolved.subcategory.slug}`,
          images: [{ url: getCategoryImageUrl(resolved.category.slug, base), width: 1200, height: 630, alt: `${resolved.subcategory.name} in ${city.name}` }],
        },
      };
    }
    case "city-service": {
      const proc = resolved.procedure;
      const pricing = proc.cityPricing[city.slug];
      const providerCount = (await getProviders({ citySlug: city.slug, categorySlug: proc.categorySlug, limit: 1 })).total;
      const url = `${base}/directory/${city.slug}/${proc.slug}`;
      return {
        title: `${proc.name} in ${city.name} — Find Providers & Costs [2026]`,
        description: `Find providers offering ${proc.name.toLowerCase()} in ${city.name}. ${providerCount} verified providers. ${pricing ? `Typical cost: ${formatAed(pricing.typical)} (${formatAed(pricing.min)}–${formatAed(pricing.max)}).` : ""} Compare ratings, insurance, and book.`,
        alternates: { canonical: url },
        openGraph: {
          title: `${proc.name} in ${city.name} — Providers & Costs`,
          description: `${providerCount} providers offer ${proc.name.toLowerCase()} in ${city.name}. Compare ratings and costs.`,
          type: "website",
          locale: "en_AE",
          siteName: "UAE Open Healthcare Directory",
          url,
          images: [{ url: getCategoryImageUrl(proc.categorySlug, base), width: 1200, height: 630, alt: `${proc.name} in ${city.name}` }],
        },
      };
    }
    default:
      return {};
  }
}

export default async function CatchAllPage({ params }: Props) {
  const city = getCityBySlug(params.city);
  if (!city) notFound();

  const resolved = await resolveSegments(city.slug, params.segments);
  if (!resolved) notFound();

  const base = getBaseUrl();

  const DAY_NAMES = DAY_NAMES_EN;

  // --- City + Category Page ---
  if (resolved.type === "city-category") {
    const { category } = resolved;
    const { providers, total, totalPages } = await getProviders({ citySlug: city.slug, categorySlug: category.slug, page: 1, limit: 20, sort: "rating" });
    const areas = getAreasByCity(city.slug);
    const topProvider = providers[0];
    const facetFaqs = generateFacetFaqs(city, category, null, total);

    return (
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <JsonLd data={breadcrumbSchema([{ name: "UAE", url: base }, { name: city.name, url: `${base}/directory/${city.slug}` }, { name: category.name }])} />
        <JsonLd data={itemListSchema(`${category.name} in ${city.name}`, providers, city.name, base)} />
        <JsonLd data={faqPageSchema(facetFaqs)} />
        <JsonLd data={speakableSchema([".answer-block"])} />

        <Breadcrumb items={[{ label: "UAE", href: "/" }, { label: city.name, href: `/directory/${city.slug}` }, { label: category.name }]} />

        {/* Category hero banner — compact */}
        <div className="relative h-32 w-full mb-6 overflow-hidden rounded-2xl">
          <Image
            src={getCategoryImagePath(category.slug)}
            alt={`${category.name} in ${city.name}`}
            fill
            className="object-cover"
            sizes="(max-width: 1280px) 100vw, 1280px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-2xl text-white mb-1 tracking-tight">{category.name} in {city.name}, UAE</h1>
            <p className="font-['Geist',sans-serif] text-sm text-white/70">{total} verified {total === 1 ? "provider" : "providers"} · Last updated March 2026</p>
          </div>
        </div>

        <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 mb-8" data-answer-block="true">
          <p className="font-['Geist',sans-serif] font-medium text-sm text-black/50 leading-relaxed">{generateFacetAnswerBlock(city, category, null, total, topProvider)}</p>
        </div>

        {/* Subcategory links hidden — no providers have subcategory data yet */}

        {areas.length > 0 && (
          <div className="mb-6">
            <p className="font-['Geist',sans-serif] text-sm font-medium text-[#1c1c1c] mb-2">Browse by area:</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {areas.map((a) => (<Link key={a.slug} href={`/directory/${city.slug}/${a.slug}/${category.slug}`} className="inline-block font-['Geist',sans-serif] bg-[#f8f8f6] text-[#1c1c1c] text-sm px-3 py-1.5 rounded-lg border border-black/[0.06] hover:border-[#006828]/20 hover:bg-[#006828]/[0.04] transition-colors">{a.name}</Link>))}
            </div>
          </div>
        )}

        <Suspense fallback={
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {providers.map((p) => (<ProviderCard key={p.id} name={p.name} slug={p.slug} citySlug={p.citySlug} categorySlug={p.categorySlug} address={p.address} phone={p.phone} website={p.website} shortDescription={p.shortDescription} googleRating={p.googleRating} googleReviewCount={p.googleReviewCount} isClaimed={p.isClaimed} isVerified={p.isVerified} />))}
          </div>
        }>
          <ProviderListPaginated
            initialProviders={providers}
            initialTotalPages={totalPages}
            citySlug={city.slug}
            categorySlug={category.slug}
            baseUrl={`/directory/${city.slug}/${category.slug}`}
            emptyMessage={`No ${category.name.toLowerCase()} found in ${city.name} yet.`}
          />
        </Suspense>
        <FaqSection faqs={facetFaqs} title={`${category.name} in ${city.name} — FAQ`} />

        {/* Related Intelligence — hub-and-spoke cross-link */}
        {await (async () => {
          await loadDbArticles();
          const relatedArticles = getArticlesByDirectoryContext(city.name, category.slug, category.name, 4);
          if (relatedArticles.length === 0) return null;
          return (
            <section className="mt-10 mb-4">
              <div className="flex items-center justify-between gap-3 mb-4 border-b-2 border-[#1c1c1c] pb-3">
                <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Related Intelligence</h2>
                <Link href="/intelligence" className="font-['Geist',sans-serif] text-xs font-semibold text-[#006828] hover:underline">All coverage &rarr;</Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {relatedArticles.map((a) => {
                  const cat = getJournalCategory(a.category);
                  return (
                    <Link
                      key={a.id}
                      href={`/intelligence/${a.slug}`}
                      className="group block border border-black/[0.06] rounded-xl p-4 hover:border-[#006828]/15 hover:bg-[#006828]/[0.02] transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-['Geist',sans-serif] uppercase text-[10px] tracking-widest font-semibold text-[#006828]">{cat?.name ?? a.category}</span>
                        <span className="text-black/20">&middot;</span>
                        <span className="font-['Geist',sans-serif] text-[10px] text-black/30">{formatDate(a.publishedAt)}</span>
                      </div>
                      <h3 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-sm text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors leading-snug mb-1.5">
                        {a.title}
                      </h3>
                      <p className="font-['Geist',sans-serif] text-xs text-black/40 leading-relaxed line-clamp-2">{a.excerpt}</p>
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })()}

        {/* Cross-link: Other specialties in this city */}
        {(() => {
          const allCategories = getCategories();
          const siblings = allCategories.filter((c) => c.slug !== category.slug).slice(0, 8);
          if (siblings.length === 0) return null;
          return (
            <section className="mt-10 mb-4">
              <div className="flex items-center gap-3 mb-4 border-b-2 border-[#1c1c1c] pb-3">
                <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Other specialties in {city.name}</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {siblings.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/directory/${city.slug}/${c.slug}`}
                    className="inline-block font-['Geist',sans-serif] bg-[#f8f8f6] text-[#1c1c1c] text-sm px-3 py-1.5 rounded-lg border border-black/[0.06] hover:border-[#006828]/20 hover:bg-[#006828]/[0.04] transition-colors"
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            </section>
          );
        })()}
      </div>
    );
  }

  // --- City + Area Page ---
  if (resolved.type === "city-area") {
    const { area } = resolved;
    const { providers, total } = await getProviders({ citySlug: city.slug, areaSlug: area.slug, sort: "rating", limit: 20 });
    const categories = getCategories();

    const areaFaqs = [
      { question: `How many healthcare providers are in ${area.name}, ${city.name}?`, answer: `According to the UAE Open Healthcare Directory, ${area.name} in ${city.name} has ${total} registered healthcare ${total === 1 ? "provider" : "providers"} across multiple specialties. Data from official government registers, last verified March 2026.` },
      { question: `What medical specialties are available in ${area.name}?`, answer: `Healthcare providers in ${area.name}, ${city.name} cover specialties including hospitals, dental clinics, dermatology, ophthalmology, and more. Browse by specialty above to find the right provider.` },
      { question: `Which insurance plans are accepted in ${area.name}, ${city.name}?`, answer: `Most providers in ${area.name} accept major UAE insurance plans including Daman, Thiqa, AXA, and Cigna. Check individual listings for specific insurance acceptance.` },
    ];

    return (
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <JsonLd data={breadcrumbSchema([{ name: "UAE", url: base }, { name: city.name, url: `${base}/directory/${city.slug}` }, { name: area.name }])} />
        <JsonLd data={speakableSchema([".answer-block"])} />
        <JsonLd data={faqPageSchema(areaFaqs)} />
        <Breadcrumb items={[{ label: "UAE", href: "/" }, { label: city.name, href: `/directory/${city.slug}` }, { label: area.name }]} />

        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-2">Healthcare in {area.name}, {city.name}</h1>
        <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 mb-8" data-answer-block="true">
          <p className="text-black/40">According to the UAE Open Healthcare Directory, {area.name} in {city.name} has {total} healthcare {total === 1 ? "provider" : "providers"}. Browse by specialty below. Data from official UAE health authority registers. Last verified March 2026.</p>
        </div>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Specialties in {area.name}</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {categories.map((cat) => (<Link key={cat.slug} href={`/directory/${city.slug}/${area.slug}/${cat.slug}`} className="inline-block bg-[#f8f8f6] text-[#1c1c1c] text-sm px-3 py-1.5 border border-black/[0.06] hover:border-[#006828]/15 hover:bg-[#006828]/[0.04] transition-colors">{cat.name}</Link>))}
          </div>
        </div>

        {providers.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {providers.map((p) => (<ProviderCard key={p.id} name={p.name} slug={p.slug} citySlug={p.citySlug} categorySlug={p.categorySlug} address={p.address} phone={p.phone} website={p.website} shortDescription={p.shortDescription} googleRating={p.googleRating} googleReviewCount={p.googleReviewCount} isClaimed={p.isClaimed} isVerified={p.isVerified} />))}
          </div>
        )}

        <FaqSection faqs={areaFaqs} title={`Healthcare in ${area.name} — FAQ`} />
      </div>
    );
  }

  // --- Area + Category Facet Page ---
  if (resolved.type === "area-category") {
    const { area, category } = resolved;
    const { providers, total } = await getProviders({ citySlug: city.slug, areaSlug: area.slug, categorySlug: category.slug, sort: "rating", limit: 50 });
    if (total === 0) notFound();
    const topProvider = providers[0];
    const facetFaqs = generateFacetFaqs(city, category, area, total);

    return (
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <JsonLd data={breadcrumbSchema([{ name: "UAE", url: base }, { name: city.name, url: `${base}/directory/${city.slug}` }, { name: area.name, url: `${base}/directory/${city.slug}/${area.slug}` }, { name: category.name }])} />
        <JsonLd data={itemListSchema(`${category.name} in ${area.name}, ${city.name}`, providers, city.name, base)} />
        <JsonLd data={faqPageSchema(facetFaqs)} />
        <JsonLd data={speakableSchema([".answer-block"])} />

        <Breadcrumb items={[{ label: "UAE", href: "/" }, { label: city.name, href: `/directory/${city.slug}` }, { label: area.name, href: `/directory/${city.slug}/${area.slug}` }, { label: category.name }]} />

        {/* Category hero banner — compact */}
        <div className="relative h-32 w-full mb-6 overflow-hidden rounded-2xl">
          <Image
            src={getCategoryImagePath(category.slug)}
            alt={`${category.name} in ${area.name}, ${city.name}`}
            fill
            className="object-cover"
            sizes="(max-width: 1280px) 100vw, 1280px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-2xl text-white tracking-tight mb-1">{category.name} in {area.name}, {city.name}</h1>
            <p className="font-['Geist',sans-serif] text-sm text-white/70">{total} verified {total === 1 ? "provider" : "providers"} · Last updated March 2026</p>
          </div>
        </div>

        <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 mb-8" data-answer-block="true">
          <p className="font-['Geist',sans-serif] text-black/40 leading-relaxed">{generateFacetAnswerBlock(city, category, area, total, topProvider)}</p>
        </div>

        {providers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {providers.map((p) => (<ProviderCard key={p.id} name={p.name} slug={p.slug} citySlug={p.citySlug} categorySlug={p.categorySlug} address={p.address} phone={p.phone} website={p.website} shortDescription={p.shortDescription} googleRating={p.googleRating} googleReviewCount={p.googleReviewCount} isClaimed={p.isClaimed} isVerified={p.isVerified} />))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-black/40 mb-2">No {category.name.toLowerCase()} found in {area.name} yet.</p>
            <Link href={`/directory/${city.slug}/${category.slug}`} className="text-[#006828] text-sm">View all {category.name.toLowerCase()} in {city.name} &rarr;</Link>
          </div>
        )}
        <FaqSection faqs={facetFaqs} title={`${category.name} in ${area.name} — FAQ`} />
      </div>
    );
  }

  // --- Area + Insurance Page ---
  if (resolved.type === "area-insurance") {
    const { area } = resolved;
    const insurers = getInsuranceProviders();

    // Get all providers in this area
    const { providers: areaProviders } = await getProviders({ citySlug: city.slug, areaSlug: area.slug, limit: 99999 });

    // Count providers per insurer in this area
    const insurerBreakdown = insurers
      .map((ins) => {
        const matchTerms = [ins.slug, ins.name.toLowerCase()];
        const count = areaProviders.filter((p) =>
          p.insurance.some((pIns) => matchTerms.some((term) => pIns.toLowerCase().includes(term)))
        ).length;
        return { ...ins, count };
      })
      .filter((i) => i.count > 0)
      .sort((a, b) => b.count - a.count);

    const top5 = insurerBreakdown.slice(0, 5);
    const totalProviders = areaProviders.length;

    const regulator = city.slug === "dubai"
      ? "the Dubai Health Authority (DHA)"
      : (city.slug === "abu-dhabi" || city.slug === "al-ain")
        ? "the Department of Health (DOH)"
        : "the Ministry of Health and Prevention (MOHAP)";

    const mandateNote = city.slug === "dubai"
      ? "Dubai mandates health insurance for all residents and employees under the DHA Essential Benefits Plan."
      : (city.slug === "abu-dhabi" || city.slug === "al-ain")
        ? "Abu Dhabi requires mandatory health insurance for all residents under DOH regulations. UAE nationals receive Thiqa coverage."
        : "Health insurance follows UAE federal MOHAP guidelines. Most employers provide group health plans.";

    const areaInsuranceFaqs = [
      {
        question: `Which insurance plans are accepted in ${area.name}, ${city.name}?`,
        answer: `According to the UAE Open Healthcare Directory, healthcare providers in ${area.name}, ${city.name} accept ${insurerBreakdown.length} different insurance plans. ${top5.length > 0 ? `The most widely accepted are ${top5.map((i) => `${i.name} (${i.count} providers)`).join(", ")}.` : ""} ${mandateNote} Check individual provider listings for plan-specific acceptance.`,
      },
      {
        question: `How many healthcare providers are in ${area.name}, ${city.name}?`,
        answer: `The UAE Open Healthcare Directory lists ${totalProviders} healthcare ${totalProviders === 1 ? "provider" : "providers"} in ${area.name}, ${city.name}. These include hospitals, clinics, pharmacies, and specialist centers. All providers are licensed by ${regulator}. Data last verified March 2026.`,
      },
      {
        question: `Do providers in ${area.name} accept Daman insurance?`,
        answer: `${(() => { const daman = insurerBreakdown.find((i) => i.slug === "daman"); return daman ? `Yes. ${daman.count} healthcare ${daman.count === 1 ? "provider" : "providers"} in ${area.name}, ${city.name} accept Daman insurance.` : `Check individual provider listings in ${area.name} for Daman acceptance.`; })()} Daman is the UAE's largest health insurer, covering over 3 million lives. Browse individual listings on the UAE Open Healthcare Directory for detailed insurance acceptance.`,
      },
      {
        question: `Is health insurance required in ${city.name}?`,
        answer: `${mandateNote} All residents and employees must have valid health insurance coverage. In ${area.name}, ${city.name}, most healthcare providers accept a wide range of insurance plans. Uninsured patients may pay out-of-pocket, but emergency care cannot be refused regardless of insurance status.`,
      },
      {
        question: `Where can I find doctors that accept my insurance in ${area.name}?`,
        answer: `Browse the UAE Open Healthcare Directory to find healthcare providers in ${area.name}, ${city.name} by insurance plan. Use the insurance filter on individual provider listings or visit the ${city.name} insurance index to see all accepted plans. Always confirm insurance acceptance directly with the provider before your visit.`,
      },
    ];

    return (
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* JSON-LD */}
        <JsonLd data={breadcrumbSchema([
          { name: "UAE", url: base },
          { name: city.name, url: `${base}/directory/${city.slug}` },
          { name: area.name, url: `${base}/directory/${city.slug}/${area.slug}` },
          { name: "Insurance" },
        ])} />
        <JsonLd data={faqPageSchema(areaInsuranceFaqs)} />
        <JsonLd data={speakableSchema([".answer-block"])} />

        {/* Breadcrumb */}
        <Breadcrumb items={[
          { label: "UAE", href: "/" },
          { label: city.name, href: `/directory/${city.slug}` },
          { label: area.name, href: `/directory/${city.slug}/${area.slug}` },
          { label: "Insurance" },
        ]} />

        {/* Header */}
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-2">
          Insurance Coverage in {area.name}, {city.name}
        </h1>
        <p className="font-['Geist',sans-serif] text-sm text-black/40 mb-6">
          {totalProviders} providers &middot; {insurerBreakdown.length} accepted insurers &middot; Last updated March 2026
        </p>

        {/* Answer Block */}
        <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 mb-8" data-answer-block="true">
          <p className="font-['Geist',sans-serif] text-black/40 leading-relaxed">
            According to the UAE Open Healthcare Directory, {totalProviders} healthcare {totalProviders === 1 ? "provider" : "providers"} in {area.name}, {city.name} accept
            insurance from {insurerBreakdown.length} different {insurerBreakdown.length === 1 ? "plan" : "plans"}.
            {top5.length > 0 && ` The most widely accepted insurers are ${top5.map((i) => i.name).join(", ")}.`}
            {" "}{mandateNote} All listings are regulated by {regulator}, last verified March 2026.
          </p>
        </div>

        {/* Top 5 Insurers */}
        {top5.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
              <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Most Accepted Insurers in {area.name}</h2>
            </div>
            <div className="space-y-0">
              {top5.map((ins, idx) => (
                <div key={ins.slug} className="flex items-center gap-3 py-3 border-b border-black/[0.06] last:border-b-0">
                  <span className="text-xs font-bold text-black/40 w-5 flex-shrink-0">#{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/directory/${city.slug}/insurance/${ins.slug}`}
                      className="text-sm font-['Bricolage_Grotesque',sans-serif] font-medium text-[#1c1c1c] tracking-tight hover:text-[#006828] transition-colors block truncate"
                    >
                      {ins.name}
                    </Link>
                    <p className="font-['Geist',sans-serif] text-xs text-black/40 truncate">{ins.description}</p>
                  </div>
                  <span className="bg-[#006828] text-white text-[10px] font-bold px-1.5 py-0.5 flex-shrink-0">
                    {ins.count} {ins.count === 1 ? "provider" : "providers"}
                  </span>
                  <span className="inline-block bg-[#006828]/[0.08] text-[#006828] text-[10px] font-medium uppercase tracking-wide px-2.5 py-0.5 rounded-full font-['Geist',sans-serif] text-[9px] flex-shrink-0">{ins.type}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* All Insurers Grid */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">All Insurance Plans Accepted in {area.name}</h2>
          </div>
          {insurerBreakdown.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {insurerBreakdown.map((ins) => (
                <Link
                  key={ins.slug}
                  href={`/directory/${city.slug}/insurance/${ins.slug}`}
                  className="block border border-black/[0.06] rounded-2xl p-5 hover:border-[#006828]/15 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-[#1c1c1c] text-sm">{ins.name}</h3>
                    <span className="inline-block bg-[#006828]/[0.08] text-[#006828] text-[10px] font-medium uppercase tracking-wide px-2.5 py-0.5 rounded-full font-['Geist',sans-serif] text-[9px]">{ins.type}</span>
                  </div>
                  <p className="font-['Geist',sans-serif] text-xs text-black/40 line-clamp-2 mb-2">{ins.description}</p>
                  <p className="text-xs font-bold text-[#006828]">
                    {ins.count} {ins.count === 1 ? "provider" : "providers"} in {area.name}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border border-black/[0.06]">
              <p className="text-black/40 mb-2">No insurance data available for {area.name} yet.</p>
              <Link href={`/directory/${city.slug}/insurance`} className="text-[#006828] text-sm font-bold">
                View insurance plans for all of {city.name} &rarr;
              </Link>
            </div>
          )}
        </section>

        {/* FAQs */}
        <FaqSection faqs={areaInsuranceFaqs} title={`Insurance in ${area.name}, ${city.name} — FAQ`} />

        {/* Cross-links */}
        <section className="mt-10 mb-10">
          <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Related Pages</h2>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <Link
              href={`/directory/${city.slug}/insurance`}
              className="border border-black/[0.06] px-3 py-1.5 text-black/40 hover:border-[#006828]/15 hover:text-[#006828] transition-colors"
            >
              Insurance in {city.name}
            </Link>
            <Link
              href={`/directory/${city.slug}/${area.slug}`}
              className="border border-black/[0.06] px-3 py-1.5 text-black/40 hover:border-[#006828]/15 hover:text-[#006828] transition-colors"
            >
              All healthcare in {area.name}
            </Link>
            <Link
              href={`/directory/${city.slug}`}
              className="border border-black/[0.06] px-3 py-1.5 text-black/40 hover:border-[#006828]/15 hover:text-[#006828] transition-colors"
            >
              All healthcare in {city.name}
            </Link>
            <Link
              href="/insurance/compare"
              className="border border-black/[0.06] px-3 py-1.5 text-black/40 hover:border-[#006828]/15 hover:text-[#006828] transition-colors"
            >
              Compare insurers
            </Link>
          </div>
        </section>

        {/* Disclaimer */}
        <div className="border-t border-black/[0.06] pt-4">
          <p className="text-[11px] text-black/40 leading-relaxed">
            <strong>Disclaimer:</strong> Insurance acceptance data is sourced from official health authority registers and provider-submitted data, last verified March 2026.
            Insurance networks can change — always confirm with the provider&apos;s insurance desk before your visit.
          </p>
        </div>
      </div>
    );
  }

  // --- Individual Listing Page ---
  if (resolved.type === "listing") {
    const { category, provider } = resolved;
    const area = provider.areaSlug ? getAreaBySlug(city.slug, provider.areaSlug) : null;
    const nearbyProviders = (await getTopRatedProviders(city.slug, 4)).filter((p) => p.id !== provider.id);

    const hasValidRating = Number(provider.googleRating) > 0;
    const answerBlock = `According to the UAE Open Healthcare Directory, ${provider.name} is a ${provider.isVerified ? "verified " : ""}${category.name.toLowerCase().replace(/s$/, "")} in ${area?.name ? area.name + ", " : ""}${city.name}, UAE${hasValidHours(provider.operatingHours) && provider.operatingHours.mon ? `, open ${provider.operatingHours.mon.open === "00:00" ? "24/7" : `${provider.operatingHours.mon.open}–${provider.operatingHours.mon.close}`}` : ""}. ${provider.services.length > 0 ? `Services: ${provider.services.slice(0, 4).join(", ")}.` : ""} ${provider.insurance.length > 0 ? "Insurance accepted." : ""} ${hasValidRating ? `Google rating: ${provider.googleRating}/5 from ${provider.googleReviewCount?.toLocaleString()} reviews.` : ""} ${provider.phone ? `Contact: ${provider.phone}.` : ""} Data sourced from official government registers. Last verified: ${formatVerifiedDate(provider.lastVerified)}.`;

    const providerFaqs = [
      { question: `What are the operating hours of ${provider.name}?`, answer: hasValidHours(provider.operatingHours) ? `${provider.name}: ${Object.entries(provider.operatingHours).filter(([, h]) => h && h.open && h.close).map(([d, h]) => `${DAY_NAMES[d]}: ${h.open === "00:00" && h.close === "23:59" ? "24h" : `${h.open}–${h.close}`}`).join(". ")}. Verified ${formatVerifiedDate(provider.lastVerified)}.` : `Contact ${provider.name} directly for current operating hours.` },
      { question: `Where is ${provider.name} located?`, answer: `${provider.name} is at ${provider.address}.${area ? ` In ${area.name}, ${city.name}.` : ` In ${city.name}, UAE.`}` },
      { question: `What services does ${provider.name} offer?`, answer: provider.services.length > 0 ? `${provider.name} offers: ${provider.services.join(", ")}. Per official UAE health authority records.` : `Contact ${provider.name} for services.` },
      { question: `Does ${provider.name} accept insurance?`, answer: provider.insurance.length > 0 ? `Yes. ${provider.name} accepts: ${provider.insurance.join(", ")}.` : `Contact ${provider.name} to confirm.` },
    ];

    return (
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <JsonLd data={medicalOrganizationSchema(provider, city, category, area, city.slug)} />
        <JsonLd data={breadcrumbSchema([{ name: "UAE", url: base }, { name: city.name, url: `${base}/directory/${city.slug}` }, { name: category.name, url: `${base}/directory/${city.slug}/${category.slug}` }, { name: provider.name }])} />
        <JsonLd data={faqPageSchema(providerFaqs)} />
        <JsonLd data={speakableSchema([".answer-block"])} />

        <Breadcrumb items={[{ label: "UAE", href: "/" }, { label: city.name, href: `/directory/${city.slug}` }, { label: category.name, href: `/directory/${city.slug}/${category.slug}` }, { label: provider.name }]} />

        {/* Listing hero banner with category image */}
        <div className="relative h-56 sm:h-64 w-full mb-8 overflow-hidden rounded-2xl">
          <Image
            src={provider.coverImageUrl || getCategoryImagePath(category.slug)}
            alt={`${provider.name} — ${category.name} in ${city.name}`}
            fill
            className="object-cover"
            sizes="(max-width: 1280px) 100vw, 1280px"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="flex items-center gap-2 mb-2">
              <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-2xl sm:text-3xl text-white tracking-tight">{provider.name}</h1>
              {provider.isVerified && <CheckCircle className="h-6 w-6 text-[#006828]" />}
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-block bg-[#006828] text-white text-[11px] font-medium uppercase tracking-wide px-3 py-0.5 rounded-full font-['Geist',sans-serif]">{category.name}</span>
              {area && <span className="inline-block bg-white/20 text-white text-[11px] font-medium uppercase tracking-wide px-3 py-0.5 rounded-full font-['Geist',sans-serif]">{area.name}</span>}
            </div>
            {provider.googleRating && Number(provider.googleRating) > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="font-['Geist',sans-serif] text-sm font-medium text-[#006828]">{provider.googleRating}/5 ★</span>
                {provider.googleReviewCount && <span className="font-['Geist',sans-serif] text-sm text-white/60">({provider.googleReviewCount.toLocaleString()} reviews)</span>}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">

            {/* 50-word LLM answer block */}
            <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 mb-6" data-answer-block="true" data-last-verified={provider.lastVerified}>
              <p className="font-['Geist',sans-serif] font-medium text-sm text-black/50 leading-relaxed">{answerBlock}</p>
            </div>

            {/* About */}
            <div className="border border-black/[0.06] rounded-2xl p-6 mb-5" data-section="about">
              <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[#1c1c1c] mb-3 tracking-tight">About {provider.name}</h2>
              {provider.description ? (
                <>
                  <div className="font-['Geist',sans-serif] text-sm text-black/50 leading-relaxed whitespace-pre-line">{provider.description}</div>
                  <p className="font-['Geist',sans-serif] text-sm text-black/50 leading-relaxed mt-3">{generateProviderParagraph(provider, city, category, area)}</p>
                </>
              ) : (
                <p className="font-['Geist',sans-serif] text-sm text-black/50 leading-relaxed">{generateProviderParagraph(provider, city, category, area)}</p>
              )}
              <p className="font-['Geist',sans-serif] text-xs text-black/30 mt-3">Source: Official UAE health authority register. Last verified: {formatVerifiedDate(provider.lastVerified)}.</p>
            </div>

            {/* Services */}
            {provider.services.length > 0 && (
              <div className="border border-black/[0.06] rounded-2xl p-6 mb-5" data-section="services">
                <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[#1c1c1c] mb-3 flex items-center gap-2 tracking-tight"><Stethoscope className="h-5 w-5 text-[#006828]" /> Services</h2>
                <p className="font-['Geist',sans-serif] text-sm text-black/40 mb-3">{provider.name} provides these services in {city.name}:</p>
                <div className="flex flex-wrap gap-2">{provider.services.map((s) => (<span key={s} className="inline-block font-['Geist',sans-serif] border border-[#006828]/20 text-[#006828] text-sm px-3 py-1 rounded-full">{s}</span>))}</div>
              </div>
            )}

            {/* Hours */}
            {provider.operatingHours && Object.keys(provider.operatingHours).length > 0 && (
              <div className="border border-black/[0.06] rounded-2xl p-6 mb-5" data-section="hours">
                <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[#1c1c1c] mb-3 flex items-center gap-2 tracking-tight"><Clock className="h-5 w-5 text-[#006828]" /> Operating Hours</h2>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                  {Object.entries(provider.operatingHours).map(([d, h]) => (
                    <div key={d} className="flex justify-between text-sm py-1 border-b border-black/[0.06] last:border-b-0">
                      <span className="font-['Geist',sans-serif] text-black/40">{DAY_NAMES[d]}</span>
                      <span className="font-['Geist',sans-serif] font-medium text-[#1c1c1c]">{h.open === "00:00" && h.close === "23:59" ? "24 Hours" : `${h.open} – ${h.close}`}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Insurance */}
            {provider.insurance.length > 0 && (
              <div className="border border-black/[0.06] rounded-2xl p-6 mb-5" data-section="insurance">
                <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[#1c1c1c] mb-3 flex items-center gap-2 tracking-tight"><Shield className="h-5 w-5 text-[#006828]" /> Accepted Insurance</h2>
                <p className="font-['Geist',sans-serif] text-sm text-black/40 mb-3">{provider.name} accepts these insurance plans:</p>
                <div className="flex flex-wrap gap-2">{provider.insurance.map((i) => (<span key={i} className="inline-block font-['Geist',sans-serif] bg-[#f8f8f6] text-[#1c1c1c] text-sm px-3 py-1.5 rounded-lg border border-black/[0.06]">{i}</span>))}</div>
              </div>
            )}

            {/* Review highlights */}
            {provider.reviewSummary && provider.reviewSummary.length > 0 && provider.reviewSummary[0] !== "No patient reviews available yet" && (
              <div className="border border-black/[0.06] rounded-2xl p-6 mb-5 bg-[#f8f8f6]" data-section="reviews">
                <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[#1c1c1c] mb-3 flex items-center gap-2 tracking-tight"><MessageSquareQuote className="h-5 w-5 text-[#006828]" /> What patients say</h2>
                <ul className="space-y-2">
                  {provider.reviewSummary.map((point: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2 font-['Geist',sans-serif] text-sm text-black/50">
                      <CheckCircle className="h-4 w-4 text-[#006828] flex-shrink-0 mt-0.5" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
                {hasValidRating && (
                  <p className="font-['Geist',sans-serif] text-xs text-black/30 mt-4 pt-3 border-t border-black/[0.06]">
                    Based on {provider.googleReviewCount?.toLocaleString()} Google reviews. Rating: {provider.googleRating}/5 stars.
                  </p>
                )}
              </div>
            )}

            {/* Languages */}
            {provider.languages.length > 0 && (
              <div className="border border-black/[0.06] rounded-2xl p-6 mb-5" data-section="languages">
                <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[#1c1c1c] mb-3 flex items-center gap-2 tracking-tight"><Languages className="h-5 w-5 text-[#006828]" /> Languages Spoken</h2>
                <p className="font-['Geist',sans-serif] text-sm text-black/50">Staff at {provider.name} speak: {provider.languages.join(", ")}.</p>
              </div>
            )}

            {/* Map */}
            <div className="border border-black/[0.06] rounded-2xl p-6 mb-5" data-section="location">
              <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[#1c1c1c] mb-3 flex items-center gap-2 tracking-tight"><MapPin className="h-5 w-5 text-[#006828]" /> Location</h2>
              <div className="rounded-xl overflow-hidden"><GoogleMapEmbed query={`${provider.name}, ${provider.address}`} /></div>
              <p className="font-['Geist',sans-serif] text-sm text-black/40 mt-3">{provider.address}</p>
            </div>

            <div className="flex items-center gap-2 font-['Geist',sans-serif] text-xs text-black/30 mb-6">
              <Calendar className="h-3.5 w-3.5" />
              <span>Last verified: {formatVerifiedDate(provider.lastVerified)} · Data from official UAE health authority register</span>
            </div>

            <div className="bg-[#006828]/[0.04] rounded-2xl p-6">
              <FaqSection faqs={providerFaqs} title={`${provider.name} — FAQ`} />
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-4">
              <div className="border border-black/[0.06] rounded-2xl p-6">
                <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[#1c1c1c] mb-4 tracking-tight">Contact</h2>
                <div className="space-y-3">
                  {provider.phone && <a href={`tel:${provider.phone.replace(/[^+\d]/g, "")}`} className="flex items-center gap-3 font-['Geist',sans-serif] text-sm text-black/50 hover:text-[#006828] transition-colors"><Phone className="h-4 w-4" /> {provider.phone}</a>}
                  {provider.website && <a href={provider.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 font-['Geist',sans-serif] text-sm text-black/50 hover:text-[#006828] transition-colors"><Globe className="h-4 w-4" /> Website <ExternalLink className="h-3 w-3" /></a>}
                  <div className="flex items-center gap-3 font-['Geist',sans-serif] text-sm text-black/50"><MapPin className="h-4 w-4" /> {provider.address}</div>
                </div>
                <div className="mt-4 space-y-2">
                  {provider.phone && <a href={`tel:${provider.phone.replace(/[^+\d]/g, "")}`} className="flex items-center justify-center gap-2 w-full bg-[#006828] hover:bg-[#004d1c] text-white font-['Geist',sans-serif] font-medium text-sm py-3 rounded-full transition-colors"><Phone className="h-4 w-4" /> Call Now</a>}
                  <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(provider.name + ", " + provider.address)}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full bg-[#1c1c1c] hover:bg-black text-white font-['Geist',sans-serif] font-medium text-sm py-3 rounded-full transition-colors"><MapPin className="h-4 w-4" /> Directions</a>
                </div>
              </div>

              {!provider.isClaimed && (
                <div className="border border-black/[0.06] rounded-2xl p-6 bg-[#006828]/[0.04]">
                  <h3 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[#1c1c1c] mb-2 tracking-tight">Is this your business?</h3>
                  <p className="font-['Geist',sans-serif] text-sm text-black/40 mb-4">Claim your listing to update information.</p>
                  <Link href={`/claim/${provider.id}`} className="flex items-center justify-center w-full bg-[#006828] hover:bg-[#004d1c] text-white font-['Geist',sans-serif] font-medium text-sm py-3 rounded-full transition-colors">Claim Listing</Link>
                </div>
              )}

              {nearbyProviders.length > 0 && (
                <div className="border border-black/[0.06] rounded-2xl p-6">
                  <h3 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[#1c1c1c] mb-3 tracking-tight">Nearby</h3>
                  <div className="space-y-3">
                    {nearbyProviders.map((np) => (
                      <Link key={np.id} href={`/directory/${np.citySlug}/${np.categorySlug}/${np.slug}`} className="block font-['Geist',sans-serif] text-sm hover:text-[#006828] transition-colors">
                        <p className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[#1c1c1c] tracking-tight">{np.name}</p>
                        {Number(np.googleRating) > 0 && (
                          <p className="font-['Geist',sans-serif] text-xs text-black/30">{np.googleRating} stars</p>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sticky mobile CTA bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-black/[0.06] p-3 flex gap-2 z-40 lg:hidden">
          {provider.phone && (
            <a
              href={`tel:${provider.phone.replace(/[^+\d]/g, "")}`}
              className="flex-1 flex items-center justify-center gap-2 bg-[#006828] text-white font-['Geist',sans-serif] font-medium text-sm py-3 rounded-full"
            >
              <Phone className="h-4 w-4" /> Call
            </a>
          )}
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(provider.name + ", " + provider.address)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 bg-[#1c1c1c] text-white font-['Geist',sans-serif] font-medium text-sm py-3 rounded-full"
          >
            <MapPin className="h-4 w-4" /> Directions
          </a>
        </div>
      </div>
    );
  }

  // --- Subcategory page ---
  if (resolved.type === "city-category-subcategory") {
    const { category, subcategory } = resolved;
    const { providers, total, totalPages } = await getProviders({ citySlug: city.slug, categorySlug: category.slug, subcategorySlug: subcategory.slug, page: 1, limit: 20, sort: "rating" });

    return (
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb items={[{ label: "UAE", href: "/" }, { label: city.name, href: `/directory/${city.slug}` }, { label: category.name, href: `/directory/${city.slug}/${category.slug}` }, { label: subcategory.name }]} />
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-2">{subcategory.name} in {city.name}</h1>
        <p className="font-['Geist',sans-serif] text-sm text-black/40 mb-6">{total} {total === 1 ? "provider" : "providers"}</p>
        {providers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {providers.map((p) => (<ProviderCard key={p.id} name={p.name} slug={p.slug} citySlug={p.citySlug} categorySlug={p.categorySlug} address={p.address} phone={p.phone} website={p.website} shortDescription={p.shortDescription} googleRating={p.googleRating} googleReviewCount={p.googleReviewCount} isClaimed={p.isClaimed} isVerified={p.isVerified} />))}
          </div>
        ) : (<div className="text-center py-12"><p className="text-black/40">No providers found yet.</p></div>)}
        <Pagination currentPage={1} totalPages={totalPages} baseUrl={`/directory/${city.slug}/${category.slug}/${subcategory.slug}`} />
      </div>
    );
  }

  // --- City + Service/Procedure Page ---
  if (resolved.type === "city-service") {
    const proc = resolved.procedure;
    const pricing = proc.cityPricing[city.slug];
    const regulator = city.slug === "dubai" ? "Dubai Health Authority (DHA)" : (city.slug === "abu-dhabi" || city.slug === "al-ain") ? "Department of Health Abu Dhabi (DOH)" : "Ministry of Health and Prevention (MOHAP)";

    // Providers in this category
    const { providers, total: providerCount } = await getProviders({
      citySlug: city.slug,
      categorySlug: proc.categorySlug,
      limit: 12,
      sort: "rating",
    });

    // City comparison
    const cityComparisons = CITIES.map((c) => {
      const cp = proc.cityPricing[c.slug];
      if (!cp) return null;
      return { slug: c.slug, name: c.name, min: cp.min, max: cp.max, typical: cp.typical, isCurrent: c.slug === city.slug };
    }).filter(Boolean) as { slug: string; name: string; min: number; max: number; typical: number; isCurrent: boolean }[];

    // Related procedures in this city
    const relatedProcs = proc.relatedProcedures
      .map((slug) => getProcedureBySlug(slug))
      .filter((p): p is MedicalProcedure => !!p && !!p.cityPricing[city.slug])
      .slice(0, 6);

    // Other procedures in this city (same category)
    const sameCategoryProcs = PROCEDURES
      .filter((p) => p.categorySlug === proc.categorySlug && p.slug !== proc.slug && p.cityPricing[city.slug])
      .slice(0, 8);

    const coverageLabel = proc.insuranceCoverage === "typically-covered" ? "Typically covered" : proc.insuranceCoverage === "partially-covered" ? "Partially covered" : proc.insuranceCoverage === "rarely-covered" ? "Rarely covered" : "Not covered";
    const coverageBadge = proc.insuranceCoverage === "typically-covered" ? "bg-green-100 text-green-800" : proc.insuranceCoverage === "partially-covered" ? "bg-yellow-100 text-yellow-800" : proc.insuranceCoverage === "rarely-covered" ? "bg-orange-100 text-orange-800" : "bg-red-100 text-red-800";

    // FAQs
    const serviceFaqs = [
      {
        question: `Where can I get ${proc.name.toLowerCase()} in ${city.name}?`,
        answer: `There are ${providerCount} ${proc.categorySlug.replace(/-/g, " ")} providers in ${city.name} listed in the UAE Open Healthcare Directory that may offer ${proc.name.toLowerCase()}. Browse providers below to compare by rating, insurance acceptance, and services. All data from official ${regulator} registers.`,
      },
      ...(pricing ? [{
        question: `How much does ${proc.name.toLowerCase()} cost in ${city.name}?`,
        answer: `${proc.name} in ${city.name} costs ${formatAed(pricing.min)} to ${formatAed(pricing.max)}, with a typical price of ${formatAed(pricing.typical)}. Pricing depends on facility type (government vs. private vs. premium), doctor experience, and clinical complexity. For detailed pricing, see our pricing page.`,
      }] : []),
      {
        question: `Does insurance cover ${proc.name.toLowerCase()} in ${city.name}?`,
        answer: proc.insuranceNotes,
      },
      {
        question: `How long does ${proc.name.toLowerCase()} take?`,
        answer: `${proc.name} typically takes ${proc.duration}. ${proc.recoveryTime !== "No recovery needed" ? `Recovery time is ${proc.recoveryTime.toLowerCase()}.` : "No recovery time is needed."} ${proc.anaesthesia !== "none" ? `${proc.anaesthesia.charAt(0).toUpperCase() + proc.anaesthesia.slice(1)} anaesthesia is typically used.` : "No anaesthesia is required."}`,
      },
      {
        question: `What should I look for when choosing a provider for ${proc.name.toLowerCase()} in ${city.name}?`,
        answer: `When choosing a provider for ${proc.name.toLowerCase()} in ${city.name}, consider: (1) patient ratings and review volume — higher-rated providers with more reviews indicate consistent quality, (2) insurance acceptance — check if the provider accepts your plan, (3) years of operation — established facilities signal clinical experience, (4) verify the provider is licensed by the ${regulator}. All providers listed below are verified against official government registers.`,
      },
      {
        question: `Is ${proc.name.toLowerCase()} available in other UAE cities?`,
        answer: cityComparisons.length > 1
          ? `Yes, ${proc.name.toLowerCase()} is available in ${cityComparisons.filter((c) => !c.isCurrent).map((c) => c.name).join(", ")}. ${pricing ? `${city.name}'s typical price is ${formatAed(pricing.typical)}. ` : ""}Compare prices and providers across cities using the table below.`
          : `${proc.name} pricing and availability varies across UAE cities. Check our pricing hub for city-by-city comparison.`,
      },
    ];

    return (
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <JsonLd data={breadcrumbSchema([{ name: "UAE", url: base }, { name: city.name, url: `${base}/directory/${city.slug}` }, { name: proc.name }])} />
        <JsonLd data={faqPageSchema(serviceFaqs)} />
        <JsonLd data={speakableSchema([".answer-block"])} />

        <Breadcrumb items={[{ label: "UAE", href: "/" }, { label: city.name, href: `/directory/${city.slug}` }, { label: proc.name }]} />

        {/* Header */}
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-2">
          {proc.name} in {city.name}
        </h1>
        <p className="font-['Geist',sans-serif] text-sm text-black/40 mb-6">
          {providerCount} providers &middot; {proc.duration} &middot;{" "}
          {coverageLabel} by insurance
          {pricing && <> &middot; Typical cost: {formatAed(pricing.typical)}</>}
          {" "}&middot; Updated March 2026
        </p>

        {/* Answer block */}
        <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 mb-8" data-answer-block="true">
          <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
            Looking for {proc.name.toLowerCase()} in {city.name}? The UAE Open Healthcare Directory lists {providerCount} {proc.categorySlug.replace(/-/g, " ")} providers in {city.name} who may offer this procedure.
            {pricing && <> The typical cost is {formatAed(pricing.typical)} (range: {formatAed(pricing.min)}–{formatAed(pricing.max)}).</>}
            {" "}Providers below are ranked by patient ratings. All facilities are licensed by the {regulator}. {proc.description}
          </p>
        </div>

        {/* Quick info cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <div className="bg-[#f8f8f6] border border-black/[0.06] rounded-xl p-4">
            <Clock className="h-4 w-4 text-[#006828] mb-1.5" />
            <p className="font-['Bricolage_Grotesque',sans-serif] text-xs font-semibold text-[#1c1c1c] tracking-tight">Duration</p>
            <p className="font-['Geist',sans-serif] text-xs text-black/50">{proc.duration}</p>
          </div>
          <div className="bg-[#f8f8f6] border border-black/[0.06] rounded-xl p-4">
            <Activity className="h-4 w-4 text-[#006828] mb-1.5" />
            <p className="font-['Bricolage_Grotesque',sans-serif] text-xs font-semibold text-[#1c1c1c] tracking-tight">Recovery</p>
            <p className="font-['Geist',sans-serif] text-xs text-black/50">{proc.recoveryTime}</p>
          </div>
          <div className="bg-[#f8f8f6] border border-black/[0.06] rounded-xl p-4">
            <Shield className="h-4 w-4 text-[#006828] mb-1.5" />
            <p className="font-['Bricolage_Grotesque',sans-serif] text-xs font-semibold text-[#1c1c1c] tracking-tight">Insurance</p>
            <span className={`inline-block mt-0.5 px-1.5 py-0.5 text-[9px] font-bold rounded ${coverageBadge}`}>{coverageLabel}</span>
          </div>
          {pricing && (
            <div className="bg-[#006828]/[0.04] border border-[#006828]/20 rounded-xl p-4">
              <MapPin className="h-4 w-4 text-[#006828] mb-1.5" />
              <p className="font-['Bricolage_Grotesque',sans-serif] text-xs font-semibold text-[#1c1c1c] tracking-tight">Typical Cost</p>
              <p className="font-['Geist',sans-serif] text-sm font-bold text-[#006828]">{formatAed(pricing.typical)}</p>
            </div>
          )}
        </div>

        {/* Providers offering this service */}
        {providers.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
              <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
                Providers Offering {proc.name} in {city.name}
              </h2>
            </div>
            <p className="font-['Geist',sans-serif] text-sm text-black/40 mb-4">
              {providerCount} {proc.categorySlug.replace(/-/g, " ")} providers in {city.name} may perform {proc.name.toLowerCase()}. Ranked by patient rating. Contact providers directly to confirm availability and pricing.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              {providers.slice(0, 9).map((p) => (
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
            {providerCount > 9 && (
              <Link
                href={`/directory/${city.slug}/${proc.categorySlug}`}
                className="inline-flex items-center gap-1 text-sm font-bold text-[#006828] hover:underline"
              >
                View all {providerCount} {proc.categorySlug.replace(/-/g, " ")} providers in {city.name}
                <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </section>
        )}

        {/* Price comparison across cities */}
        {pricing && cityComparisons.length > 1 && (
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
              <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
                {proc.name} Cost — UAE City Comparison
              </h2>
            </div>
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="w-full min-w-[500px] text-sm border-collapse">
                <thead>
                  <tr className="bg-[#f8f8f6]">
                    <th className="font-['Geist',sans-serif] text-[11px] font-semibold text-black/50 uppercase tracking-wider text-left px-3 py-3 border-b border-black/[0.08]">City</th>
                    <th className="font-['Geist',sans-serif] text-[11px] font-semibold text-black/50 uppercase tracking-wider text-right px-3 py-3 border-b border-black/[0.08]">From</th>
                    <th className="font-['Geist',sans-serif] text-[11px] font-semibold text-black/50 uppercase tracking-wider text-right px-3 py-3 border-b border-black/[0.08]">Typical</th>
                    <th className="font-['Geist',sans-serif] text-[11px] font-semibold text-black/50 uppercase tracking-wider text-right px-3 py-3 border-b border-black/[0.08]">Up to</th>
                    <th className="font-['Geist',sans-serif] text-[11px] font-semibold text-black/50 uppercase tracking-wider text-right px-3 py-3 border-b border-black/[0.08]"></th>
                  </tr>
                </thead>
                <tbody>
                  {cityComparisons.map((comp, idx) => (
                    <tr key={comp.slug} className={`${comp.isCurrent ? "bg-[#006828]/[0.04] font-bold" : idx % 2 === 0 ? "bg-white" : "bg-[#fafaf9]"} border-b border-black/[0.04]`}>
                      <td className="px-3 py-3 text-[#1c1c1c]">
                        {comp.name}
                        {comp.isCurrent && <span className="text-[9px] text-[#006828] ml-1">(current)</span>}
                      </td>
                      <td className="px-3 py-3 text-right text-black/40">{formatAed(comp.min)}</td>
                      <td className="px-3 py-3 text-right font-bold text-[#1c1c1c]">{formatAed(comp.typical)}</td>
                      <td className="px-3 py-3 text-right text-black/40">{formatAed(comp.max)}</td>
                      <td className="px-3 py-3 text-right">
                        {comp.isCurrent ? (
                          <span className="text-xs text-black/30">Viewing</span>
                        ) : (
                          <Link href={`/directory/${comp.slug}/${proc.slug}`} className="text-xs text-[#006828] font-semibold hover:underline">View</Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* What to expect */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">What to Expect</h2>
          </div>
          <p className="font-['Geist',sans-serif] text-sm text-black/50 leading-relaxed mb-3">
            {proc.whatToExpect}
          </p>
          {proc.anaesthesia !== "none" && (
            <p className="font-['Geist',sans-serif] text-sm text-black/50">
              <strong>Anaesthesia:</strong> {proc.anaesthesia.charAt(0).toUpperCase() + proc.anaesthesia.slice(1)} anaesthesia is typically used for this procedure.
            </p>
          )}
        </section>

        {/* Insurance coverage */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Insurance Coverage</h2>
          </div>
          <div className="bg-[#f8f8f6] border border-black/[0.06] rounded-xl p-5">
            <span className={`inline-block px-2 py-1 text-xs font-bold rounded ${coverageBadge} mb-2`}>{coverageLabel}</span>
            <p className="font-['Geist',sans-serif] text-sm text-black/50 leading-relaxed">{proc.insuranceNotes}</p>
          </div>
        </section>

        {/* Related procedures in this city */}
        {relatedProcs.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
              <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Related Procedures in {city.name}</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {relatedProcs.map((rp) => {
                const rpPricing = rp.cityPricing[city.slug];
                return (
                  <Link
                    key={rp.slug}
                    href={`/directory/${city.slug}/${rp.slug}`}
                    className="flex items-center justify-between border border-black/[0.06] rounded-xl px-4 py-3 hover:border-[#006828]/15 hover:bg-[#006828]/[0.02] transition-colors"
                  >
                    <div>
                      <span className="font-['Bricolage_Grotesque',sans-serif] text-sm font-medium text-[#1c1c1c] tracking-tight">{rp.name}</span>
                      <p className="font-['Geist',sans-serif] text-xs text-black/40">{rp.duration}</p>
                    </div>
                    {rpPricing && (
                      <span className="text-sm font-bold text-[#006828] whitespace-nowrap">{formatAed(rpPricing.typical)}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* More procedures in same category */}
        {sameCategoryProcs.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
              <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">More Procedures in {city.name}</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {sameCategoryProcs.map((sp) => (
                <Link
                  key={sp.slug}
                  href={`/directory/${city.slug}/${sp.slug}`}
                  className="inline-block font-['Geist',sans-serif] bg-[#f8f8f6] text-[#1c1c1c] text-sm px-3 py-2 rounded-lg border border-black/[0.06] hover:border-[#006828]/20 hover:bg-[#006828]/[0.04] transition-colors"
                >
                  {sp.name}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Cross-links */}
        <div className="flex flex-wrap gap-3 mb-6">
          {pricing && (
            <Link
              href={`/pricing/${proc.slug}/${city.slug}`}
              className="inline-block border border-[#006828]/20 text-[#006828] rounded-full font-['Geist',sans-serif] px-3 py-1.5 text-sm hover:bg-[#006828]/[0.04] transition-colors"
            >
              Detailed pricing breakdown &rarr;
            </Link>
          )}
          <Link
            href={`/directory/${city.slug}/${proc.categorySlug}`}
            className="inline-block border border-[#006828]/20 text-[#006828] rounded-full font-['Geist',sans-serif] px-3 py-1.5 text-sm hover:bg-[#006828]/[0.04] transition-colors"
          >
            All {proc.categorySlug.replace(/-/g, " ")} in {city.name} &rarr;
          </Link>
          <Link
            href={`/best/${city.slug}/${proc.categorySlug}`}
            className="inline-block border border-[#006828]/20 text-[#006828] rounded-full font-['Geist',sans-serif] px-3 py-1.5 text-sm hover:bg-[#006828]/[0.04] transition-colors"
          >
            Best {proc.categorySlug.replace(/-/g, " ")} in {city.name} &rarr;
          </Link>
        </div>

        <FaqSection faqs={serviceFaqs} title={`${proc.name} in ${city.name} — FAQ`} />

        {/* Disclaimer */}
        <div className="border-t border-black/[0.06] pt-4 mt-6">
          <p className="text-[11px] text-black/40 leading-relaxed">
            <strong>Disclaimer:</strong> Pricing is indicative and based on DOH Mandatory Tariff methodology and market-observed ranges. Actual costs depend on facility type, clinical complexity, and insurance coverage. Always confirm pricing directly with the provider. Provider data is sourced from official {regulator} registers, last verified March 2026.
          </p>
        </div>
      </div>
    );
  }

  notFound();
}
