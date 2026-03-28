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
  getCityBySlug, getCategoryBySlug, getCategories,
  getAreaBySlug, getAreasByCity, getSubcategoriesByCategory,
  getProviderBySlug, getProviders, getTopRatedProviders,
  getInsuranceProviders,
} from "@/lib/data";
import {
  medicalOrganizationSchema, breadcrumbSchema, itemListSchema,
  faqPageSchema, speakableSchema, generateFacetAnswerBlock, generateFacetFaqs,
  generateProviderParagraph,
} from "@/lib/seo";
import { getBaseUrl, getCategoryImagePath } from "@/lib/helpers";
import Image from "next/image";

function getCategoryImageUrl(categorySlug: string, base: string): string {
  const CATEGORY_IMAGE_MAP: Record<string, string> = {
    "hospitals": "hospitals", "clinics": "clinics", "dental": "dental",
    "dermatology": "dermatology", "ophthalmology": "ophthalmology",
    "cardiology": "cardiology", "orthopedics": "orthopedics",
    "mental-health": "mental-health", "pediatrics": "pediatrics",
    "ob-gyn": "obstetrics-gynecology", "ent": "ent",
    "fertility-ivf": "fertility", "physiotherapy": "physiotherapy",
    "pharmacy": "pharmacy", "labs-diagnostics": "laboratory",
    "radiology-imaging": "radiology", "home-healthcare": "home-healthcare",
    "alternative-medicine": "alternative-medicine", "neurology": "neurology",
    "urology": "urology", "gastroenterology": "gastroenterology",
    "oncology": "oncology", "emergency-care": "hospitals",
  };
  const file = CATEGORY_IMAGE_MAP[categorySlug] || "clinics";
  return `${base}/images/categories/${file}.webp`;
}
import {
  MapPin, Phone, Globe, Clock, Shield, Languages, Stethoscope,
  CheckCircle, ExternalLink, Calendar, MessageSquareQuote,
} from "lucide-react";

// ISR: pages built on first visit, cached for 6 hours. No SSG pre-rendering.
export const revalidate = 21600;
export const dynamicParams = true;

interface Props {
  params: { city: string; segments: string[] };
}

/**
 * Resolve the URL segments into one of:
 * 1. /directory/dubai/{category}                  -> City + Category
 * 2. /directory/dubai/{area}                      -> City + Area
 * 3. /directory/dubai/{area}/{category}           -> City + Area + Category (facet)
 * 4. /directory/dubai/{category}/{listing}        -> Individual listing
 * 5. /directory/dubai/{area}/{category}/{listing} -> Individual listing (via area path)
 */
async function resolveSegments(citySlug: string, segments: string[]) {
  const [seg1, seg2, seg3] = segments;

  if (segments.length === 1) {
    // Could be category or area
    const category = getCategoryBySlug(seg1);
    if (category) return { type: "city-category" as const, category };
    const area = getAreaBySlug(citySlug, seg1);
    if (area) return { type: "city-area" as const, area };
    return null;
  }

  if (segments.length === 2) {
    // Could be: area+category, category+listing, or area+listing
    const cat1 = getCategoryBySlug(seg1);
    if (cat1) {
      // seg1 is category -> seg2 must be a listing slug
      const provider = await getProviderBySlug(seg2);
      if (provider) return { type: "listing" as const, category: cat1, provider };
      // Could be a subcategory
      const subcats = getSubcategoriesByCategory(cat1.slug);
      const sub = subcats.find((s) => s.slug === seg2);
      if (sub) return { type: "city-category-subcategory" as const, category: cat1, subcategory: sub };
      return null;
    }

    const area = getAreaBySlug(citySlug, seg1);
    if (area) {
      if (seg2 === "insurance") return { type: "area-insurance" as const, area };
      const cat2 = getCategoryBySlug(seg2);
      if (cat2) return { type: "area-category" as const, area, category: cat2 };
      return null;
    }
    return null;
  }

  if (segments.length === 3) {
    // area + category + listing
    const area = getAreaBySlug(citySlug, seg1);
    const cat = getCategoryBySlug(seg2);
    const provider = await getProviderBySlug(seg3);
    if (area && cat && provider) return { type: "listing" as const, area, category: cat, provider };
    return null;
  }

  return null;
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
          },
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
          },
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
        },
      };
    }
    case "listing": {
      const listingCanonical = `${base}/directory/${city.slug}/${resolved.category.slug}/${resolved.provider.slug}`;
      const isEnriched = Boolean(resolved.provider.googleRating && Number(resolved.provider.googleRating) > 0) || Boolean(resolved.provider.phone) || Boolean(resolved.provider.website);
      return {
        title: `${resolved.provider.name} | ${resolved.category.name} in ${city.name}`,
        description: `${resolved.provider.shortDescription} ${resolved.provider.googleRating && Number(resolved.provider.googleRating) > 0 ? `Rating: ${resolved.provider.googleRating}/5.` : ""} Last verified ${resolved.provider.lastVerified}.`,
        ...(!isEnriched ? { robots: { index: true, follow: true, "max-snippet": 50 } } : {}),
        alternates: {
          canonical: listingCanonical,
          languages: {
            'en-AE': listingCanonical,
            'ar-AE': `${base}/ar/directory/${city.slug}/${resolved.category.slug}/${resolved.provider.slug}`,
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

  const DAY_NAMES: Record<string, string> = {
    mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday",
    fri: "Friday", sat: "Saturday", sun: "Sunday",
  };

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
    const answerBlock = `According to the UAE Open Healthcare Directory, ${provider.name} is a ${provider.isVerified ? "verified " : ""}${category.name.toLowerCase().replace(/s$/, "")} in ${area?.name ? area.name + ", " : ""}${city.name}, UAE${provider.operatingHours?.mon ? `, open ${provider.operatingHours.mon.open === "00:00" ? "24/7" : `${provider.operatingHours.mon.open}–${provider.operatingHours.mon.close}`}` : ""}. ${provider.services.length > 0 ? `Services: ${provider.services.slice(0, 4).join(", ")}.` : ""} ${provider.insurance.length > 0 ? "Insurance accepted." : ""} ${hasValidRating ? `Google rating: ${provider.googleRating}/5 from ${provider.googleReviewCount?.toLocaleString()} reviews.` : ""} ${provider.phone ? `Contact: ${provider.phone}.` : ""} Data sourced from official government registers. Last verified: ${provider.lastVerified}.`;

    const providerFaqs = [
      { question: `What are the operating hours of ${provider.name}?`, answer: provider.operatingHours ? `${provider.name}: ${Object.entries(provider.operatingHours).map(([d, h]) => `${DAY_NAMES[d]}: ${h.open === "00:00" && h.close === "23:59" ? "24h" : `${h.open}–${h.close}`}`).join(". ")}. Verified ${provider.lastVerified}.` : `Contact ${provider.name} for hours.` },
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
              <p className="font-['Geist',sans-serif] text-sm text-black/50 leading-relaxed">{generateProviderParagraph(provider, city, category, area)}</p>
              <p className="font-['Geist',sans-serif] text-xs text-black/30 mt-3">Source: Official UAE health authority register. Last verified: {provider.lastVerified}.</p>
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
              <span>Last verified: {provider.lastVerified} · Data from official UAE health authority register</span>
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

  notFound();
}
