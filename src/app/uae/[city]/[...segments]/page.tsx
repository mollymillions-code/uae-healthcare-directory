import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { ProviderCard } from "@/components/provider/ProviderCard";
import { StarRating } from "@/components/shared/StarRating";
import { GoogleMapEmbed } from "@/components/maps/GoogleMapEmbed";
import { FaqSection } from "@/components/seo/FaqSection";
import { JsonLd } from "@/components/seo/JsonLd";
import { Pagination } from "@/components/shared/Pagination";
import {
  getCityBySlug, getCities, getCategoryBySlug, getCategories,
  getAreaBySlug, getAreasByCity, getSubcategoriesByCategory,
  getProviderBySlug, getProviders, getTopRatedProviders,
} from "@/lib/data";
import {
  medicalOrganizationSchema, breadcrumbSchema, itemListSchema,
  faqPageSchema, generateFacetAnswerBlock, generateFacetFaqs,
  generateProviderParagraph,
} from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
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
 * 1. /uae/dubai/{category}                  → City + Category
 * 2. /uae/dubai/{area}                      → City + Area
 * 3. /uae/dubai/{area}/{category}           → City + Area + Category (facet)
 * 4. /uae/dubai/{category}/{listing}        → Individual listing
 * 5. /uae/dubai/{area}/{category}/{listing} → Individual listing (via area path)
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
      // seg1 is category → seg2 must be a listing slug
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
    // City + Category
    for (const cat of categories) {
      params.push({ city: city.slug, segments: [cat.slug] });
    }
    // City + Area
    const areas = getAreasByCity(city.slug);
    for (const area of areas) {
      params.push({ city: city.slug, segments: [area.slug] });
      // Area + Category facets
      for (const cat of categories) {
        params.push({ city: city.slug, segments: [area.slug, cat.slug] });
      }
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
        title: `${resolved.category.name} in ${city.name}, UAE | ${total} Providers`,
        description: `Find the best ${resolved.category.name.toLowerCase()} in ${city.name}, UAE. ${total} verified providers with Google ratings, reviews, and contact details. Last verified March 2026.`,
        alternates: { canonical: `${base}/uae/${city.slug}/${resolved.category.slug}` },
      };
    }
    case "city-area": {
      const { total } = getProviders({ citySlug: city.slug, areaSlug: resolved.area.slug, limit: 1 });
      return {
        title: `Healthcare in ${resolved.area.name}, ${city.name} | ${total} Providers`,
        description: `Find healthcare providers in ${resolved.area.name}, ${city.name}, UAE. Hospitals, clinics, and specialists with ratings.`,
        alternates: { canonical: `${base}/uae/${city.slug}/${resolved.area.slug}` },
      };
    }
    case "area-category": {
      const { total } = getProviders({ citySlug: city.slug, areaSlug: resolved.area.slug, categorySlug: resolved.category.slug, limit: 1 });
      return {
        title: `${resolved.category.name} in ${resolved.area.name}, ${city.name} | ${total} Providers`,
        description: `Find ${resolved.category.name.toLowerCase()} in ${resolved.area.name}, ${city.name}, UAE. ${total} verified providers.`,
        alternates: { canonical: `${base}/uae/${city.slug}/${resolved.area.slug}/${resolved.category.slug}` },
      };
    }
    case "listing": {
      return {
        title: `${resolved.provider.name} | ${resolved.category.name} in ${city.name}`,
        description: `${resolved.provider.shortDescription} Rating: ${resolved.provider.googleRating}/5. Last verified ${resolved.provider.lastVerified}.`,
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

  // ─── City + Category Page ────────────────────────────────────────────────────
  if (resolved.type === "city-category") {
    const { category } = resolved;
    const { providers, total, totalPages } = getProviders({ citySlug: city.slug, categorySlug: category.slug, page, limit: 20, sort: "rating" });
    const areas = getAreasByCity(city.slug);
    const subcategories = getSubcategoriesByCategory(category.slug);
    const topProvider = providers[0];
    const facetFaqs = generateFacetFaqs(city, category, null, total);

    return (
      <div className="container-wide py-8">
        <JsonLd data={breadcrumbSchema([{ name: "UAE", url: base }, { name: city.name, url: `${base}/uae/${city.slug}` }, { name: category.name }])} />
        <JsonLd data={itemListSchema(`${category.name} in ${city.name}`, providers, city.name)} />
        <JsonLd data={faqPageSchema(facetFaqs)} />

        <Breadcrumb items={[{ label: "UAE", href: "/" }, { label: city.name, href: `/uae/${city.slug}` }, { label: category.name }]} />

        <h1 className="text-3xl font-bold text-gray-900 mb-2">{category.name} in {city.name}, UAE</h1>
        <p className="text-sm text-gray-500 mb-4">{total} verified providers · Last updated March 2026</p>

        <div className="answer-block mb-8" data-answer-block="true">
          <p className="text-gray-600 leading-relaxed">{generateFacetAnswerBlock(city, category, null, total, topProvider)}</p>
        </div>

        {subcategories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {subcategories.map((sub) => (<Link key={sub.slug} href={`/uae/${city.slug}/${category.slug}/${sub.slug}`} className="badge-green px-3 py-1.5 text-sm hover:bg-brand-100">{sub.name}</Link>))}
          </div>
        )}

        {areas.length > 0 && (
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-700 mb-2">Browse by area:</p>
            <div className="flex flex-wrap gap-2">
              {areas.map((a) => (<Link key={a.slug} href={`/uae/${city.slug}/${a.slug}/${category.slug}`} className="badge-gray hover:bg-gray-200 px-3 py-1.5 text-sm">{a.name}</Link>))}
            </div>
          </div>
        )}

        {providers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {providers.map((p) => (<ProviderCard key={p.id} name={p.name} slug={p.slug} citySlug={p.citySlug} categorySlug={p.categorySlug} address={p.address} phone={p.phone} website={p.website} shortDescription={p.shortDescription} googleRating={p.googleRating} googleReviewCount={p.googleReviewCount} isClaimed={p.isClaimed} isVerified={p.isVerified} />))}
          </div>
        ) : (
          <div className="text-center py-12"><p className="text-gray-500">No {category.name.toLowerCase()} found in {city.name} yet.</p></div>
        )}

        <Pagination currentPage={page} totalPages={totalPages} baseUrl={`/uae/${city.slug}/${category.slug}`} />
        <FaqSection faqs={facetFaqs} title={`${category.name} in ${city.name} — FAQ`} />
      </div>
    );
  }

  // ─── City + Area Page ────────────────────────────────────────────────────────
  if (resolved.type === "city-area") {
    const { area } = resolved;
    const { providers, total } = getProviders({ citySlug: city.slug, areaSlug: area.slug, sort: "rating", limit: 20 });
    const categories = getCategories();

    return (
      <div className="container-wide py-8">
        <JsonLd data={breadcrumbSchema([{ name: "UAE", url: base }, { name: city.name, url: `${base}/uae/${city.slug}` }, { name: area.name }])} />
        <Breadcrumb items={[{ label: "UAE", href: "/" }, { label: city.name, href: `/uae/${city.slug}` }, { label: area.name }]} />

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Healthcare in {area.name}, {city.name}</h1>
        <div className="answer-block mb-8" data-answer-block="true">
          <p className="text-gray-600">{area.name} in {city.name} has {total} healthcare providers. Browse by specialty below. Data from official UAE health authority registers. Last verified March 2026.</p>
        </div>

        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Specialties in {area.name}</h2>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (<Link key={cat.slug} href={`/uae/${city.slug}/${area.slug}/${cat.slug}`} className="badge-gray hover:bg-gray-200 px-3 py-1.5 text-sm">{cat.name}</Link>))}
          </div>
        </div>

        {providers.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {providers.map((p) => (<ProviderCard key={p.id} name={p.name} slug={p.slug} citySlug={p.citySlug} categorySlug={p.categorySlug} address={p.address} phone={p.phone} website={p.website} shortDescription={p.shortDescription} googleRating={p.googleRating} googleReviewCount={p.googleReviewCount} isClaimed={p.isClaimed} isVerified={p.isVerified} />))}
          </div>
        )}
      </div>
    );
  }

  // ─── Area + Category Facet Page ──────────────────────────────────────────────
  if (resolved.type === "area-category") {
    const { area, category } = resolved;
    const { providers, total } = getProviders({ citySlug: city.slug, areaSlug: area.slug, categorySlug: category.slug, sort: "rating", limit: 50 });
    const topProvider = providers[0];
    const facetFaqs = generateFacetFaqs(city, category, area, total);

    return (
      <div className="container-wide py-8">
        <JsonLd data={breadcrumbSchema([{ name: "UAE", url: base }, { name: city.name, url: `${base}/uae/${city.slug}` }, { name: area.name, url: `${base}/uae/${city.slug}/${area.slug}` }, { name: category.name }])} />
        <JsonLd data={itemListSchema(`${category.name} in ${area.name}, ${city.name}`, providers, city.name)} />
        <JsonLd data={faqPageSchema(facetFaqs)} />

        <Breadcrumb items={[{ label: "UAE", href: "/" }, { label: city.name, href: `/uae/${city.slug}` }, { label: area.name, href: `/uae/${city.slug}/${area.slug}` }, { label: category.name }]} />

        <h1 className="text-3xl font-bold text-gray-900 mb-2">{category.name} in {area.name}, {city.name}</h1>
        <p className="text-sm text-gray-500 mb-4">{total} verified providers · Last updated March 2026</p>

        <div className="answer-block mb-8" data-answer-block="true">
          <p className="text-gray-600 leading-relaxed">{generateFacetAnswerBlock(city, category, area, total, topProvider)}</p>
        </div>

        {providers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {providers.map((p) => (<ProviderCard key={p.id} name={p.name} slug={p.slug} citySlug={p.citySlug} categorySlug={p.categorySlug} address={p.address} phone={p.phone} website={p.website} shortDescription={p.shortDescription} googleRating={p.googleRating} googleReviewCount={p.googleReviewCount} isClaimed={p.isClaimed} isVerified={p.isVerified} />))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-2">No {category.name.toLowerCase()} found in {area.name} yet.</p>
            <Link href={`/uae/${city.slug}/${category.slug}`} className="text-brand-600 text-sm">View all {category.name.toLowerCase()} in {city.name} →</Link>
          </div>
        )}
        <FaqSection faqs={facetFaqs} title={`${category.name} in ${area.name} — FAQ`} />
      </div>
    );
  }

  // ─── Individual Listing Page ─────────────────────────────────────────────────
  if (resolved.type === "listing") {
    const { category, provider } = resolved;
    const area = provider.areaSlug ? getAreaBySlug(city.slug, provider.areaSlug) : null;
    const nearbyProviders = getTopRatedProviders(city.slug, 4).filter((p) => p.id !== provider.id);

    const answerBlock = `${provider.name} is a ${provider.isVerified ? "verified " : ""}${category.name.toLowerCase().replace(/s$/, "")} in ${area?.name ? area.name + ", " : ""}${city.name}, UAE${provider.operatingHours?.mon ? `, open ${provider.operatingHours.mon.open === "00:00" ? "24/7" : `${provider.operatingHours.mon.open}–${provider.operatingHours.mon.close}`}` : ""}. ${provider.services.length > 0 ? `Services: ${provider.services.slice(0, 4).join(", ")}.` : ""} ${provider.insurance.length > 0 ? "Insurance accepted." : ""} ${provider.googleRating ? `Google rating: ${provider.googleRating}/5 from ${provider.googleReviewCount?.toLocaleString()} reviews.` : ""} ${provider.phone ? `Contact: ${provider.phone}.` : ""} Last verified: ${provider.lastVerified}.`;

    const providerFaqs = [
      { question: `What are the operating hours of ${provider.name}?`, answer: provider.operatingHours ? `${provider.name}: ${Object.entries(provider.operatingHours).map(([d, h]) => `${DAY_NAMES[d]}: ${h.open === "00:00" && h.close === "23:59" ? "24h" : `${h.open}–${h.close}`}`).join(". ")}. Verified ${provider.lastVerified}.` : `Contact ${provider.name} for hours.` },
      { question: `Where is ${provider.name} located?`, answer: `${provider.name} is at ${provider.address}.${area ? ` In ${area.name}, ${city.name}.` : ` In ${city.name}, UAE.`}` },
      { question: `What services does ${provider.name} offer?`, answer: provider.services.length > 0 ? `${provider.name} offers: ${provider.services.join(", ")}. Per official UAE health authority records.` : `Contact ${provider.name} for services.` },
      { question: `Does ${provider.name} accept insurance?`, answer: provider.insurance.length > 0 ? `Yes. ${provider.name} accepts: ${provider.insurance.join(", ")}.` : `Contact ${provider.name} to confirm.` },
    ];

    return (
      <div className="container-wide py-8">
        <JsonLd data={medicalOrganizationSchema(provider, city, category, area)} />
        <JsonLd data={breadcrumbSchema([{ name: "UAE", url: base }, { name: city.name, url: `${base}/uae/${city.slug}` }, { name: category.name, url: `${base}/uae/${city.slug}/${category.slug}` }, { name: provider.name }])} />
        <JsonLd data={faqPageSchema(providerFaqs)} />

        <Breadcrumb items={[{ label: "UAE", href: "/" }, { label: city.name, href: `/uae/${city.slug}` }, { label: category.name, href: `/uae/${city.slug}/${category.slug}` }, { label: provider.name }]} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-3xl font-bold text-gray-900">{provider.name}</h1>
                {provider.isVerified && <CheckCircle className="h-6 w-6 text-brand-500" />}
              </div>
              <div className="flex items-center gap-3 mb-2">
                <span className="badge-green">{category.name}</span>
                {area && <span className="badge-gray">{area.name}</span>}
              </div>
              {provider.googleRating && <StarRating rating={Number(provider.googleRating)} reviewCount={provider.googleReviewCount} size="lg" />}
            </div>

            {/* 50-word LLM answer block */}
            <div className="answer-block mb-6" data-answer-block="true" data-last-verified={provider.lastVerified}>
              <p className="text-gray-700 leading-relaxed font-medium">{answerBlock}</p>
            </div>

            {/* About — self-contained chunk */}
            <div className="card p-6 mb-6" data-section="about">
              <h2 className="font-semibold text-gray-900 mb-3">About {provider.name}</h2>
              <p className="text-gray-600 leading-relaxed">{generateProviderParagraph(provider, city, category, area)}</p>
              <p className="text-xs text-gray-400 mt-3">Source: Official UAE health authority register. Last verified: {provider.lastVerified}.</p>
            </div>

            {/* Services — self-contained chunk */}
            {provider.services.length > 0 && (
              <div className="card p-6 mb-6" data-section="services">
                <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Stethoscope className="h-5 w-5 text-brand-600" /> Services</h2>
                <p className="text-sm text-gray-600 mb-3">{provider.name} provides these services in {city.name}:</p>
                <div className="flex flex-wrap gap-2">{provider.services.map((s) => (<span key={s} className="badge-green px-3 py-1">{s}</span>))}</div>
              </div>
            )}

            {/* Hours — self-contained chunk */}
            {provider.operatingHours && (
              <div className="card p-6 mb-6" data-section="hours">
                <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Clock className="h-5 w-5 text-brand-600" /> Operating Hours</h2>
                <div className="space-y-2">
                  {Object.entries(provider.operatingHours).map(([d, h]) => (
                    <div key={d} className="flex justify-between text-sm">
                      <span className="text-gray-600">{DAY_NAMES[d]}</span>
                      <span className="font-medium text-gray-900">{h.open === "00:00" && h.close === "23:59" ? "24 Hours" : `${h.open} – ${h.close}`}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Insurance — self-contained chunk */}
            {provider.insurance.length > 0 && (
              <div className="card p-6 mb-6" data-section="insurance">
                <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Shield className="h-5 w-5 text-brand-600" /> Accepted Insurance</h2>
                <p className="text-sm text-gray-600 mb-3">{provider.name} accepts these insurance plans:</p>
                <div className="flex flex-wrap gap-2">{provider.insurance.map((i) => (<span key={i} className="badge-gray px-3 py-1">{i}</span>))}</div>
              </div>
            )}

            {/* Languages — self-contained chunk */}
            {provider.languages.length > 0 && (
              <div className="card p-6 mb-6" data-section="languages">
                <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Languages className="h-5 w-5 text-brand-600" /> Languages Spoken</h2>
                <p className="text-sm text-gray-600">Staff at {provider.name} speak: {provider.languages.join(", ")}.</p>
              </div>
            )}

            {/* Map — self-contained chunk */}
            <div className="card p-6 mb-6" data-section="location">
              <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><MapPin className="h-5 w-5 text-brand-600" /> Location</h2>
              <GoogleMapEmbed query={`${provider.name}, ${provider.address}`} />
              <p className="text-sm text-gray-500 mt-3">{provider.address}</p>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-400 mb-6">
              <Calendar className="h-3.5 w-3.5" />
              <span>Last verified: {provider.lastVerified} · Data from official UAE health authority register</span>
            </div>

            <FaqSection faqs={providerFaqs} title={`${provider.name} — FAQ`} />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-4">
              <div className="card p-6">
                <h2 className="font-semibold text-gray-900 mb-4">Contact</h2>
                <div className="space-y-3">
                  {provider.phone && <a href={`tel:${provider.phone.replace(/[^+\d]/g, "")}`} className="flex items-center gap-3 text-sm text-gray-700 hover:text-brand-600"><Phone className="h-4 w-4" /> {provider.phone}</a>}
                  {provider.website && <a href={provider.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-gray-700 hover:text-brand-600"><Globe className="h-4 w-4" /> Website <ExternalLink className="h-3 w-3" /></a>}
                  <div className="flex items-center gap-3 text-sm text-gray-700"><MapPin className="h-4 w-4" /> {provider.address}</div>
                </div>
                <div className="mt-4 space-y-2">
                  {provider.phone && <a href={`tel:${provider.phone.replace(/[^+\d]/g, "")}`} className="btn-primary w-full"><Phone className="h-4 w-4 mr-2" /> Call Now</a>}
                  <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(provider.name + ", " + provider.address)}`} target="_blank" rel="noopener noreferrer" className="btn-secondary w-full"><MapPin className="h-4 w-4 mr-2" /> Directions</a>
                </div>
              </div>

              {!provider.isClaimed && (
                <div className="card p-6 bg-brand-50 border-brand-200">
                  <h3 className="font-semibold text-gray-900 mb-2">Is this your business?</h3>
                  <p className="text-sm text-gray-600 mb-4">Claim your listing to update information.</p>
                  <Link href={`/claim/${provider.id}`} className="btn-primary w-full">Claim Listing</Link>
                </div>
              )}

              {nearbyProviders.length > 0 && (
                <div className="card p-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Nearby</h3>
                  <div className="space-y-3">
                    {nearbyProviders.map((np) => (
                      <Link key={np.id} href={`/uae/${np.citySlug}/${np.categorySlug}/${np.slug}`} className="block text-sm hover:text-brand-600">
                        <p className="font-medium text-gray-900">{np.name}</p>
                        <p className="text-xs text-gray-500">{np.googleRating} stars</p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Subcategory page ────────────────────────────────────────────────────────
  if (resolved.type === "city-category-subcategory") {
    const { category, subcategory } = resolved;
    const { providers, total, totalPages } = getProviders({ citySlug: city.slug, categorySlug: category.slug, subcategorySlug: subcategory.slug, page, limit: 20, sort: "rating" });

    return (
      <div className="container-wide py-8">
        <Breadcrumb items={[{ label: "UAE", href: "/" }, { label: city.name, href: `/uae/${city.slug}` }, { label: category.name, href: `/uae/${city.slug}/${category.slug}` }, { label: subcategory.name }]} />
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{subcategory.name} in {city.name}</h1>
        <p className="text-sm text-gray-500 mb-6">{total} providers</p>
        {providers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {providers.map((p) => (<ProviderCard key={p.id} name={p.name} slug={p.slug} citySlug={p.citySlug} categorySlug={p.categorySlug} address={p.address} phone={p.phone} website={p.website} shortDescription={p.shortDescription} googleRating={p.googleRating} googleReviewCount={p.googleReviewCount} isClaimed={p.isClaimed} isVerified={p.isVerified} />))}
          </div>
        ) : (<div className="text-center py-12"><p className="text-gray-500">No providers found yet.</p></div>)}
        <Pagination currentPage={page} totalPages={totalPages} baseUrl={`/uae/${city.slug}/${category.slug}/${subcategory.slug}`} />
      </div>
    );
  }

  notFound();
}
