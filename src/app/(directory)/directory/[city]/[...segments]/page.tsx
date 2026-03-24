import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { ProviderCard } from "@/components/provider/ProviderCard";
// StarRating available if needed
import dynamic from "next/dynamic";
const GoogleMapEmbed = dynamic(() => import("@/components/maps/GoogleMapEmbed").then(mod => mod.GoogleMapEmbed), { ssr: false, loading: () => <div className="w-full h-64 bg-light-100 animate-pulse" /> });
import { FaqSection } from "@/components/seo/FaqSection";
import { JsonLd } from "@/components/seo/JsonLd";
import { Pagination } from "@/components/shared/Pagination";
import {
  getCityBySlug, getCities, getCategoryBySlug, getCategories,
  getAreaBySlug, getAreasByCity, getSubcategoriesByCategory,
  getProviderBySlug, getProviders, getTopRatedProviders,
  getProviderCountByCategoryAndCity, getProviderCountByAreaAndCity,
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
  return `${base}/images/categories/${file}.png`;
}
import {
  MapPin, Phone, Globe, Clock, Shield, Languages, Stethoscope,
  CheckCircle, ExternalLink, Calendar,
} from "lucide-react";

export const revalidate = 21600;

interface Props {
  params: { city: string; segments: string[] };
  searchParams: { page?: string };
}

/**
 * Resolve the URL segments into one of:
 * 1. /directory/dubai/{category}                  -> City + Category
 * 2. /directory/dubai/{area}                      -> City + Area
 * 3. /directory/dubai/{area}/{category}           -> City + Area + Category (facet)
 * 4. /directory/dubai/{category}/{listing}        -> Individual listing
 * 5. /directory/dubai/{area}/{category}/{listing} -> Individual listing (via area path)
 */
function resolveSegments(citySlug: string, segments: string[]) {
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
      const provider = getProviderBySlug(seg2);
      if (provider) return { type: "listing" as const, category: cat1, provider };
      // Could be a subcategory
      const subcats = getSubcategoriesByCategory(cat1.slug);
      const sub = subcats.find((s) => s.slug === seg2);
      if (sub) return { type: "city-category-subcategory" as const, category: cat1, subcategory: sub };
      return null;
    }

    const area = getAreaBySlug(citySlug, seg1);
    if (area) {
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
    const provider = getProviderBySlug(seg3);
    if (area && cat && provider) return { type: "listing" as const, area, category: cat, provider };
    return null;
  }

  return null;
}

export async function generateStaticParams() {
  const params: { city: string; segments: string[] }[] = [];
  const cities = getCities();
  const categories = getCategories();

  for (const city of cities) {
    // City + Category pages — only if providers exist
    for (const cat of categories) {
      const count = getProviderCountByCategoryAndCity(cat.slug, city.slug);
      if (count > 0) {
        params.push({ city: city.slug, segments: [cat.slug] });
      }
    }
    // City + Area pages — only if providers exist
    const areas = getAreasByCity(city.slug);
    for (const area of areas) {
      const areaCount = getProviderCountByAreaAndCity(area.slug, city.slug);
      if (areaCount > 0) {
        params.push({ city: city.slug, segments: [area.slug] });
        // Area + Category facet pages — only if providers exist in this combination
        for (const cat of categories) {
          const { total } = getProviders({ citySlug: city.slug, areaSlug: area.slug, categorySlug: cat.slug, limit: 1 });
          if (total > 0) {
            params.push({ city: city.slug, segments: [area.slug, cat.slug] });
          }
        }
      }
    }

    // Individual listing pages — every provider gets a page at /directory/{city}/{category}/{slug}
    const { providers: cityProviders } = getProviders({ citySlug: city.slug, limit: 99999 });
    for (const provider of cityProviders) {
      params.push({ city: city.slug, segments: [provider.categorySlug, provider.slug] });
    }
  }

  return params;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const city = getCityBySlug(params.city);
  if (!city) return {};
  const resolved = resolveSegments(city.slug, params.segments);
  if (!resolved) return {};
  const base = getBaseUrl();

  switch (resolved.type) {
    case "city-category": {
      const { total } = getProviders({ citySlug: city.slug, categorySlug: resolved.category.slug, limit: 1 });
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
      const { total } = getProviders({ citySlug: city.slug, areaSlug: resolved.area.slug, limit: 1 });
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
      const { total } = getProviders({ citySlug: city.slug, areaSlug: resolved.area.slug, categorySlug: resolved.category.slug, limit: 1 });
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
      const { total } = getProviders({ citySlug: city.slug, categorySlug: resolved.category.slug, subcategorySlug: resolved.subcategory.slug, limit: 1 });
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

export default function CatchAllPage({ params, searchParams }: Props) {
  const city = getCityBySlug(params.city);
  if (!city) notFound();

  const resolved = resolveSegments(city.slug, params.segments);
  if (!resolved) notFound();

  const page = Number(searchParams.page) || 1;
  const base = getBaseUrl();

  const DAY_NAMES: Record<string, string> = {
    mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday",
    fri: "Friday", sat: "Saturday", sun: "Sunday",
  };

  // --- City + Category Page ---
  if (resolved.type === "city-category") {
    const { category } = resolved;
    const { providers, total, totalPages } = getProviders({ citySlug: city.slug, categorySlug: category.slug, page, limit: 20, sort: "rating" });
    const areas = getAreasByCity(city.slug);
    const _subcategories = getSubcategoriesByCategory(category.slug);
    const topProvider = providers[0];
    const facetFaqs = generateFacetFaqs(city, category, null, total);

    return (
      <div className="container-tc py-8">
        <JsonLd data={breadcrumbSchema([{ name: "UAE", url: base }, { name: city.name, url: `${base}/directory/${city.slug}` }, { name: category.name }])} />
        <JsonLd data={itemListSchema(`${category.name} in ${city.name}`, providers, city.name, base)} />
        <JsonLd data={faqPageSchema(facetFaqs)} />
        <JsonLd data={speakableSchema([".answer-block"])} />

        <Breadcrumb items={[{ label: "UAE", href: "/" }, { label: city.name, href: `/directory/${city.slug}` }, { label: category.name }]} />

        {/* Category hero banner — compact */}
        <div className="relative h-32 w-full mb-6 overflow-hidden">
          <Image
            src={getCategoryImagePath(category.slug)}
            alt={`${category.name} in ${city.name}`}
            fill
            className="object-cover"
            sizes="(max-width: 1280px) 100vw, 1280px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <h1 className="text-2xl font-bold text-white mb-1">{category.name} in {city.name}, UAE</h1>
            <p className="text-sm text-white/80">{total} verified {total === 1 ? "provider" : "providers"} · Last updated March 2026</p>
          </div>
        </div>

        <div className="answer-block mb-8" data-answer-block="true">
          <p className="text-muted leading-relaxed">{generateFacetAnswerBlock(city, category, null, total, topProvider)}</p>
        </div>

        {/* Subcategory links hidden — no providers have subcategory data yet */}

        {areas.length > 0 && (
          <div className="mb-6">
            <p className="text-sm font-medium text-dark mb-2">Browse by area:</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {areas.map((a) => (<Link key={a.slug} href={`/directory/${city.slug}/${a.slug}/${category.slug}`} className="inline-block bg-light-100 text-dark text-sm px-3 py-1.5 border border-light-200 hover:border-accent hover:bg-accent-muted transition-colors">{a.name}</Link>))}
            </div>
          </div>
        )}

        {providers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {providers.map((p) => (<ProviderCard key={p.id} name={p.name} slug={p.slug} citySlug={p.citySlug} categorySlug={p.categorySlug} address={p.address} phone={p.phone} website={p.website} shortDescription={p.shortDescription} googleRating={p.googleRating} googleReviewCount={p.googleReviewCount} isClaimed={p.isClaimed} isVerified={p.isVerified} />))}
          </div>
        ) : (
          <div className="text-center py-12"><p className="text-muted">No {category.name.toLowerCase()} found in {city.name} yet.</p></div>
        )}

        <Pagination currentPage={page} totalPages={totalPages} baseUrl={`/directory/${city.slug}/${category.slug}`} />
        <FaqSection faqs={facetFaqs} title={`${category.name} in ${city.name} — FAQ`} />
      </div>
    );
  }

  // --- City + Area Page ---
  if (resolved.type === "city-area") {
    const { area } = resolved;
    const { providers, total } = getProviders({ citySlug: city.slug, areaSlug: area.slug, sort: "rating", limit: 20 });
    const categories = getCategories();

    const areaFaqs = [
      { question: `How many healthcare providers are in ${area.name}, ${city.name}?`, answer: `According to the UAE Open Healthcare Directory, ${area.name} in ${city.name} has ${total} registered healthcare ${total === 1 ? "provider" : "providers"} across multiple specialties. Data from official government registers, last verified March 2026.` },
      { question: `What medical specialties are available in ${area.name}?`, answer: `Healthcare providers in ${area.name}, ${city.name} cover specialties including hospitals, dental clinics, dermatology, ophthalmology, and more. Browse by specialty above to find the right provider.` },
      { question: `Which insurance plans are accepted in ${area.name}, ${city.name}?`, answer: `Most providers in ${area.name} accept major UAE insurance plans including Daman, Thiqa, AXA, and Cigna. Check individual listings for specific insurance acceptance.` },
    ];

    return (
      <div className="container-tc py-8">
        <JsonLd data={breadcrumbSchema([{ name: "UAE", url: base }, { name: city.name, url: `${base}/directory/${city.slug}` }, { name: area.name }])} />
        <JsonLd data={speakableSchema([".answer-block"])} />
        <JsonLd data={faqPageSchema(areaFaqs)} />
        <Breadcrumb items={[{ label: "UAE", href: "/" }, { label: city.name, href: `/directory/${city.slug}` }, { label: area.name }]} />

        <h1 className="text-3xl font-bold text-dark mb-2">Healthcare in {area.name}, {city.name}</h1>
        <div className="answer-block mb-8" data-answer-block="true">
          <p className="text-muted">According to the UAE Open Healthcare Directory, {area.name} in {city.name} has {total} healthcare {total === 1 ? "provider" : "providers"}. Browse by specialty below. Data from official UAE health authority registers. Last verified March 2026.</p>
        </div>

        <div className="mb-8">
          <div className="section-header">
            <h2>Specialties in {area.name}</h2>
            <span className="arrows">&gt;&gt;&gt;</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {categories.map((cat) => (<Link key={cat.slug} href={`/directory/${city.slug}/${area.slug}/${cat.slug}`} className="inline-block bg-light-100 text-dark text-sm px-3 py-1.5 border border-light-200 hover:border-accent hover:bg-accent-muted transition-colors">{cat.name}</Link>))}
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
    const { providers, total } = getProviders({ citySlug: city.slug, areaSlug: area.slug, categorySlug: category.slug, sort: "rating", limit: 50 });
    const topProvider = providers[0];
    const facetFaqs = generateFacetFaqs(city, category, area, total);

    return (
      <div className="container-tc py-8">
        <JsonLd data={breadcrumbSchema([{ name: "UAE", url: base }, { name: city.name, url: `${base}/directory/${city.slug}` }, { name: area.name, url: `${base}/directory/${city.slug}/${area.slug}` }, { name: category.name }])} />
        <JsonLd data={itemListSchema(`${category.name} in ${area.name}, ${city.name}`, providers, city.name, base)} />
        <JsonLd data={faqPageSchema(facetFaqs)} />
        <JsonLd data={speakableSchema([".answer-block"])} />

        <Breadcrumb items={[{ label: "UAE", href: "/" }, { label: city.name, href: `/directory/${city.slug}` }, { label: area.name, href: `/directory/${city.slug}/${area.slug}` }, { label: category.name }]} />

        {/* Category hero banner — compact */}
        <div className="relative h-32 w-full mb-6 overflow-hidden">
          <Image
            src={getCategoryImagePath(category.slug)}
            alt={`${category.name} in ${area.name}, ${city.name}`}
            fill
            className="object-cover"
            sizes="(max-width: 1280px) 100vw, 1280px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <h1 className="text-2xl font-bold text-white mb-1">{category.name} in {area.name}, {city.name}</h1>
            <p className="text-sm text-white/80">{total} verified {total === 1 ? "provider" : "providers"} · Last updated March 2026</p>
          </div>
        </div>

        <div className="answer-block mb-8" data-answer-block="true">
          <p className="text-muted leading-relaxed">{generateFacetAnswerBlock(city, category, area, total, topProvider)}</p>
        </div>

        {providers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {providers.map((p) => (<ProviderCard key={p.id} name={p.name} slug={p.slug} citySlug={p.citySlug} categorySlug={p.categorySlug} address={p.address} phone={p.phone} website={p.website} shortDescription={p.shortDescription} googleRating={p.googleRating} googleReviewCount={p.googleReviewCount} isClaimed={p.isClaimed} isVerified={p.isVerified} />))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted mb-2">No {category.name.toLowerCase()} found in {area.name} yet.</p>
            <Link href={`/directory/${city.slug}/${category.slug}`} className="text-accent text-sm">View all {category.name.toLowerCase()} in {city.name} &rarr;</Link>
          </div>
        )}
        <FaqSection faqs={facetFaqs} title={`${category.name} in ${area.name} — FAQ`} />
      </div>
    );
  }

  // --- Individual Listing Page ---
  if (resolved.type === "listing") {
    const { category, provider } = resolved;
    const area = provider.areaSlug ? getAreaBySlug(city.slug, provider.areaSlug) : null;
    const nearbyProviders = getTopRatedProviders(city.slug, 4).filter((p) => p.id !== provider.id);

    const hasValidRating = Number(provider.googleRating) > 0;
    const answerBlock = `According to the UAE Open Healthcare Directory, ${provider.name} is a ${provider.isVerified ? "verified " : ""}${category.name.toLowerCase().replace(/s$/, "")} in ${area?.name ? area.name + ", " : ""}${city.name}, UAE${provider.operatingHours?.mon ? `, open ${provider.operatingHours.mon.open === "00:00" ? "24/7" : `${provider.operatingHours.mon.open}–${provider.operatingHours.mon.close}`}` : ""}. ${provider.services.length > 0 ? `Services: ${provider.services.slice(0, 4).join(", ")}.` : ""} ${provider.insurance.length > 0 ? "Insurance accepted." : ""} ${hasValidRating ? `Google rating: ${provider.googleRating}/5 from ${provider.googleReviewCount?.toLocaleString()} reviews.` : ""} ${provider.phone ? `Contact: ${provider.phone}.` : ""} Data sourced from official government registers. Last verified: ${provider.lastVerified}.`;

    const providerFaqs = [
      { question: `What are the operating hours of ${provider.name}?`, answer: provider.operatingHours ? `${provider.name}: ${Object.entries(provider.operatingHours).map(([d, h]) => `${DAY_NAMES[d]}: ${h.open === "00:00" && h.close === "23:59" ? "24h" : `${h.open}–${h.close}`}`).join(". ")}. Verified ${provider.lastVerified}.` : `Contact ${provider.name} for hours.` },
      { question: `Where is ${provider.name} located?`, answer: `${provider.name} is at ${provider.address}.${area ? ` In ${area.name}, ${city.name}.` : ` In ${city.name}, UAE.`}` },
      { question: `What services does ${provider.name} offer?`, answer: provider.services.length > 0 ? `${provider.name} offers: ${provider.services.join(", ")}. Per official UAE health authority records.` : `Contact ${provider.name} for services.` },
      { question: `Does ${provider.name} accept insurance?`, answer: provider.insurance.length > 0 ? `Yes. ${provider.name} accepts: ${provider.insurance.join(", ")}.` : `Contact ${provider.name} to confirm.` },
    ];

    return (
      <div className="container-tc py-8">
        <JsonLd data={medicalOrganizationSchema(provider, city, category, area, city.slug)} />
        <JsonLd data={breadcrumbSchema([{ name: "UAE", url: base }, { name: city.name, url: `${base}/directory/${city.slug}` }, { name: category.name, url: `${base}/directory/${city.slug}/${category.slug}` }, { name: provider.name }])} />
        <JsonLd data={faqPageSchema(providerFaqs)} />
        <JsonLd data={speakableSchema([".answer-block"])} />

        <Breadcrumb items={[{ label: "UAE", href: "/" }, { label: city.name, href: `/directory/${city.slug}` }, { label: category.name, href: `/directory/${city.slug}/${category.slug}` }, { label: provider.name }]} />

        {/* Listing hero banner with category image */}
        <div className="relative h-56 sm:h-64 w-full mb-8 overflow-hidden">
          <Image
            src={getCategoryImagePath(category.slug)}
            alt={`${provider.name} — ${category.name} in ${city.name}`}
            fill
            className="object-cover"
            sizes="(max-width: 1280px) 100vw, 1280px"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-white">{provider.name}</h1>
              {provider.isVerified && <CheckCircle className="h-6 w-6 text-accent" />}
            </div>
            <div className="flex items-center gap-3 mb-2">
              <span className="inline-block bg-accent text-white text-[11px] font-bold uppercase tracking-wide px-2 py-0.5">{category.name}</span>
              {area && <span className="inline-block bg-white/20 text-white text-[11px] font-bold uppercase tracking-wide px-2 py-0.5">{area.name}</span>}
            </div>
            {provider.googleRating && Number(provider.googleRating) > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-accent">{provider.googleRating}/5 ★</span>
                {provider.googleReviewCount && <span className="text-sm text-white/70">({provider.googleReviewCount.toLocaleString()} reviews)</span>}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">

            {/* 50-word LLM answer block */}
            <div className="answer-block mb-6" data-answer-block="true" data-last-verified={provider.lastVerified}>
              <p className="text-dark/80 leading-relaxed font-medium">{answerBlock}</p>
            </div>

            {/* About -- self-contained chunk */}
            <div className="border border-light-200 p-6 mb-6" data-section="about">
              <h2 className="font-semibold text-dark mb-3">About {provider.name}</h2>
              <p className="text-muted leading-relaxed">{generateProviderParagraph(provider, city, category, area)}</p>
              <p className="text-xs text-muted mt-3">Source: Official UAE health authority register. Last verified: {provider.lastVerified}.</p>
            </div>

            {/* Services -- self-contained chunk */}
            {provider.services.length > 0 && (
              <div className="border border-light-200 p-6 mb-6" data-section="services">
                <h2 className="font-semibold text-dark mb-3 flex items-center gap-2"><Stethoscope className="h-5 w-5 text-accent" /> Services</h2>
                <p className="text-sm text-muted mb-3">{provider.name} provides these services in {city.name}:</p>
                <div className="flex flex-wrap gap-2">{provider.services.map((s) => (<span key={s} className="badge-outline px-3 py-1">{s}</span>))}</div>
              </div>
            )}

            {/* Hours -- compact 2-column grid */}
            {provider.operatingHours && Object.keys(provider.operatingHours).length > 0 && (
              <div className="border border-light-200 p-6 mb-6" data-section="hours">
                <h2 className="font-semibold text-dark mb-3 flex items-center gap-2"><Clock className="h-5 w-5 text-accent" /> Operating Hours</h2>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                  {Object.entries(provider.operatingHours).map(([d, h]) => (
                    <div key={d} className="flex justify-between text-sm py-1 border-b border-light-200 last:border-b-0">
                      <span className="text-muted">{DAY_NAMES[d]}</span>
                      <span className="font-medium text-dark">{h.open === "00:00" && h.close === "23:59" ? "24 Hours" : `${h.open} – ${h.close}`}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Insurance -- self-contained chunk */}
            {provider.insurance.length > 0 && (
              <div className="border border-light-200 p-6 mb-6" data-section="insurance">
                <h2 className="font-semibold text-dark mb-3 flex items-center gap-2"><Shield className="h-5 w-5 text-accent" /> Accepted Insurance</h2>
                <p className="text-sm text-muted mb-3">{provider.name} accepts these insurance plans:</p>
                <div className="flex flex-wrap gap-2">{provider.insurance.map((i) => (<span key={i} className="inline-block bg-light-100 text-dark text-sm px-3 py-1.5 border border-light-200">{i}</span>))}</div>
              </div>
            )}

            {/* Languages -- self-contained chunk */}
            {provider.languages.length > 0 && (
              <div className="border border-light-200 p-6 mb-6" data-section="languages">
                <h2 className="font-semibold text-dark mb-3 flex items-center gap-2"><Languages className="h-5 w-5 text-accent" /> Languages Spoken</h2>
                <p className="text-sm text-muted">Staff at {provider.name} speak: {provider.languages.join(", ")}.</p>
              </div>
            )}

            {/* Map -- self-contained chunk */}
            <div className="border border-light-200 p-6 mb-6" data-section="location">
              <h2 className="font-semibold text-dark mb-3 flex items-center gap-2"><MapPin className="h-5 w-5 text-accent" /> Location</h2>
              <GoogleMapEmbed query={`${provider.name}, ${provider.address}`} />
              <p className="text-sm text-muted mt-3">{provider.address}</p>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted mb-6">
              <Calendar className="h-3.5 w-3.5" />
              <span>Last verified: {provider.lastVerified} · Data from official UAE health authority register</span>
            </div>

            <div className="bg-accent-muted p-6">
              <FaqSection faqs={providerFaqs} title={`${provider.name} — FAQ`} />
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-4">
              <div className="border border-light-200 p-6">
                <h2 className="font-semibold text-dark mb-4">Contact</h2>
                <div className="space-y-3">
                  {provider.phone && <a href={`tel:${provider.phone.replace(/[^+\d]/g, "")}`} className="flex items-center gap-3 text-sm text-dark/70 hover:text-accent transition-colors"><Phone className="h-4 w-4" /> {provider.phone}</a>}
                  {provider.website && <a href={provider.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-dark/70 hover:text-accent transition-colors"><Globe className="h-4 w-4" /> Website <ExternalLink className="h-3 w-3" /></a>}
                  <div className="flex items-center gap-3 text-sm text-dark/70"><MapPin className="h-4 w-4" /> {provider.address}</div>
                </div>
                <div className="mt-4 space-y-2">
                  {provider.phone && <a href={`tel:${provider.phone.replace(/[^+\d]/g, "")}`} className="btn-accent w-full"><Phone className="h-4 w-4 mr-2" /> Call Now</a>}
                  <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(provider.name + ", " + provider.address)}`} target="_blank" rel="noopener noreferrer" className="btn-dark w-full"><MapPin className="h-4 w-4 mr-2" /> Directions</a>
                </div>
              </div>

              {!provider.isClaimed && (
                <div className="border border-light-200 p-6 bg-accent-muted">
                  <h3 className="font-semibold text-dark mb-2">Is this your business?</h3>
                  <p className="text-sm text-muted mb-4">Claim your listing to update information.</p>
                  <Link href={`/claim/${provider.id}`} className="btn-accent w-full">Claim Listing</Link>
                </div>
              )}

              {nearbyProviders.length > 0 && (
                <div className="border border-light-200 p-6">
                  <h3 className="font-semibold text-dark mb-3">Nearby</h3>
                  <div className="space-y-3">
                    {nearbyProviders.map((np) => (
                      <Link key={np.id} href={`/directory/${np.citySlug}/${np.categorySlug}/${np.slug}`} className="block text-sm hover:text-accent transition-colors">
                        <p className="font-medium text-dark">{np.name}</p>
                        {Number(np.googleRating) > 0 && (
                          <p className="text-xs text-muted">{np.googleRating} stars</p>
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
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-light-200 p-3 flex gap-2 z-40 lg:hidden">
          {provider.phone && (
            <a
              href={`tel:${provider.phone.replace(/[^+\d]/g, "")}`}
              className="btn-accent flex-1 flex items-center justify-center gap-2"
            >
              <Phone className="h-4 w-4" /> Call
            </a>
          )}
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(provider.name + ", " + provider.address)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-dark flex-1 flex items-center justify-center gap-2"
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
    const { providers, total, totalPages } = getProviders({ citySlug: city.slug, categorySlug: category.slug, subcategorySlug: subcategory.slug, page, limit: 20, sort: "rating" });

    return (
      <div className="container-tc py-8">
        <Breadcrumb items={[{ label: "UAE", href: "/" }, { label: city.name, href: `/directory/${city.slug}` }, { label: category.name, href: `/directory/${city.slug}/${category.slug}` }, { label: subcategory.name }]} />
        <h1 className="text-3xl font-bold text-dark mb-2">{subcategory.name} in {city.name}</h1>
        <p className="text-sm text-muted mb-6">{total} {total === 1 ? "provider" : "providers"}</p>
        {providers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {providers.map((p) => (<ProviderCard key={p.id} name={p.name} slug={p.slug} citySlug={p.citySlug} categorySlug={p.categorySlug} address={p.address} phone={p.phone} website={p.website} shortDescription={p.shortDescription} googleRating={p.googleRating} googleReviewCount={p.googleReviewCount} isClaimed={p.isClaimed} isVerified={p.isVerified} />))}
          </div>
        ) : (<div className="text-center py-12"><p className="text-muted">No providers found yet.</p></div>)}
        <Pagination currentPage={page} totalPages={totalPages} baseUrl={`/directory/${city.slug}/${category.slug}/${subcategory.slug}`} />
      </div>
    );
  }

  notFound();
}
