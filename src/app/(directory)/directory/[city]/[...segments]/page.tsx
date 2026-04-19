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
  getCityBySlug, getCategories, getCategoryBySlug,
  getAreaBySlug, getAreasByCity,
  getProviders, getTopRatedProviders,
  getInsuranceProviders,
  getNeighborhoodsByCity,
} from "@/lib/data";
import { getHubEditorial } from "@/lib/constants/hub-editorial";
import { getRelatedSpecialties } from "@/lib/constants/related-specialties";
import { LANGUAGES } from "@/lib/constants/languages";
import {
  getInsurancePlansByGeo,
  isTriFacetEligible,
} from "@/lib/insurance-facets/data";
import { getProfessionalsIndexBySpecialty } from "@/lib/professionals";
import { isEnrichedForSitemap } from "@/lib/sitemap-gating";
import { neighborhoodHubSchema } from "@/lib/seo-neighborhoods";
import { StickyMobileCta } from "@/components/directory/StickyMobileCta";
import { ProviderSidebarCta } from "@/components/directory/ProviderSidebarCta";
import { loadDbArticles, getArticlesByDirectoryContext } from "@/lib/intelligence/data";
import { getJournalCategory } from "@/lib/intelligence/categories";
import { formatDate } from "@/components/intelligence/utils";
import {
  breadcrumbSchema, itemListSchema,
  faqPageSchema, speakableSchema, generateFacetAnswerBlock, generateFacetFaqs,
  generateProviderParagraph, truncateTitle, truncateDescription,
  generateFullProviderSchema,
} from "@/lib/seo";
import { getBaseUrl, getCategoryImagePath } from "@/lib/helpers";
import {
  getCategoryImageUrl, hasValidHours, formatVerifiedDate,
  resolveSegments,
} from "@/lib/directory-utils";
import { buildFaqDayLine, normalizeDayName, formatHoursRange } from "@/lib/hours-utils";
import Image from "next/image";
import {
  MapPin, Phone, Globe, Clock, Shield, Languages, Stethoscope,
  CheckCircle, ExternalLink, Calendar, Activity, ArrowRight,
  Accessibility, Image as ImageIcon, Star, Quote,
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
  searchParams?: { page?: string };
}

// Parse and clamp the ?page= query param to a positive integer.
// Item 0.5 + Item 22 — ensures deep-pagination URLs emitted by the
// sitemap actually render their target page instead of collapsing to 1.
function parsePage(raw: string | undefined): number {
  const n = Number(raw ?? 1);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.floor(n);
}

// No generateStaticParams — pages render on-demand via ISR.
// Google discovers them via sitemap.xml and internal links.

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const city = getCityBySlug(params.city);
  if (!city) return {};
  const resolved = await resolveSegments(city.slug, params.segments);
  if (!resolved) return {};
  const base = getBaseUrl();
  const page = parsePage(searchParams?.page);
  const pageSuffix = page > 1 ? `?page=${page}` : "";
  const pageTitleSuffix = page > 1 ? ` — Page ${page}` : "";

  switch (resolved.type) {
    case "city-category": {
      const { total } = await getProviders({ citySlug: city.slug, categorySlug: resolved.category.slug, limit: 1 });
      const year = new Date().getFullYear();
      const baseCategoryUrl = `${base}/directory/${city.slug}/${resolved.category.slug}`;
      const canonicalUrl = `${baseCategoryUrl}${pageSuffix}`;
      const arCanonicalUrl = `${base}/ar/directory/${city.slug}/${resolved.category.slug}${pageSuffix}`;
      return {
        title: truncateTitle(`${total} Best ${resolved.category.name} in ${city.name} [${year}]${pageTitleSuffix}`),
        description: truncateDescription(`Compare ${total} ${resolved.category.name.toLowerCase()} in ${city.name}, UAE. Ratings, reviews, insurance accepted, hours & directions. DHA/DOH/MOHAP licensed. Free directory.`),
        alternates: {
          canonical: canonicalUrl,
          languages: {
            'en-AE': canonicalUrl,
            'ar-AE': arCanonicalUrl,
            'x-default': canonicalUrl,
          },
        },
        openGraph: {
          title: `${resolved.category.name} in ${city.name}, UAE${pageTitleSuffix}`,
          description: `${total} ${resolved.category.name.toLowerCase()} in ${city.name}. Browse verified listings.`,
          type: 'website',
          locale: 'en_AE',
          siteName: 'UAE Open Healthcare Directory',
          url: canonicalUrl,
          images: [{ url: getCategoryImageUrl(resolved.category.slug, base), width: 1200, height: 630, alt: `${resolved.category.name} in ${city.name}` }],
        },
      };
    }
    case "city-area": {
      const { total } = await getProviders({ citySlug: city.slug, areaSlug: resolved.area.slug, limit: 1 });
      const year = new Date().getFullYear();
      return {
        title: truncateTitle(`${total} Providers in ${resolved.area.name}, ${city.name} [${year}]`),
        description: truncateDescription(`Compare ${total} healthcare providers in ${resolved.area.name}, ${city.name}. Hospitals, clinics & specialists with ratings, reviews, insurance & directions. Free.`),
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
      const year = new Date().getFullYear();
      return {
        title: total > 0
          ? truncateTitle(`${total} ${resolved.category.name} in ${resolved.area.name}, ${city.name} [${year}]`)
          : truncateTitle(`${resolved.category.name} in ${resolved.area.name}, ${city.name}`),
        description: total > 0
          ? truncateDescription(`Compare ${total} ${resolved.category.name.toLowerCase()} in ${resolved.area.name}, ${city.name}. Ratings, reviews, insurance & hours. Verified, free directory.`)
          : truncateDescription(`Looking for ${resolved.category.name.toLowerCase()} in ${resolved.area.name}, ${city.name}? Browse all ${resolved.category.name.toLowerCase()} across ${city.name} instead.`),
        // Empty area+category combos get noindex to prevent thin-content
        // pollution while preserving link equity via follow:true.
        ...(total === 0 ? { robots: { index: false, follow: true } } : {}),
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
          description: `${total > 0 ? total : "Find"} ${resolved.category.name.toLowerCase()} in ${resolved.area.name}, ${city.name}. Browse verified listings.`,
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
        title: truncateTitle(`Insurance Coverage in ${area.name}, ${city.name}`),
        description: truncateDescription(`Find healthcare providers by insurance plan in ${area.name}, ${city.name}, UAE. Browse accepted insurers — Daman, Thiqa, AXA, Cigna, and more. Verified listings.`),
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
      // Thin-content guard: a provider is "enriched" only if it has at least 2 of
      // the key fields. This decision MUST agree with sitemap inclusion — see
      // docs/seo/static-provider-sitemap-architecture-spec.md §8.2 for the drift
      // risk if these two gates diverge. We import the canonical gate from
      // src/lib/sitemap-gating.ts so the page-level `robots: { index: false }`
      // and the offline sitemap generator (`scripts/generate-provider-sitemaps.mjs`)
      // both reference identical inclusion logic.
      const isEnriched = isEnrichedForSitemap(resolved.provider);

      // --- SEO title: CTR-optimized for position 3-8 SERPs ---
      // Goal: differentiate from generic directory titles. Include rating
      // stars (eye-catching in SERP), category name (matches intent), and
      // review count (social proof). Hard 55-char cap leaves room for
      // " | Zavis" appended by root layout.
      const maxTitleLen = 55;
      const cleanProviderName = (name: string): string =>
        name
          .replace(/\s*[-–—]\s*(Branch|Br\.?)\s*\d*\s*$/i, "")
          .replace(/\s*\bL\.?\s*L\.?\s*C\.?\b\s*$/i, "")
          .replace(/\s*\bFZ[- ]?LLC\b\s*$/i, "")
          .replace(/\s*\bF[. ]?Z[. ]?E\.?\b\s*$/i, "")
          .replace(/\s+/g, " ")
          .trim();
      const providerDisplay = cleanProviderName(resolved.provider.name) || resolved.provider.name;
      const prov = resolved.provider;
      const hasRating = prov.googleRating && Number(prov.googleRating) > 0;
      const ratingBit = hasRating ? `★${prov.googleRating}` : "";
      const reviewBit = prov.googleReviewCount && prov.googleReviewCount > 0
        ? `${prov.googleReviewCount.toLocaleString()} Reviews`
        : "";
      const catShort = resolved.category.name;

      // Build title from most CTR-impactful parts, progressively trimming
      // Format priority: "Name City — ★4.5 · Category · 123 Reviews"
      const titleParts = [ratingBit, catShort, reviewBit].filter(Boolean);
      const titleTail = titleParts.length > 0 ? ` — ${titleParts.join(" · ")}` : "";
      const idealTitle = `${providerDisplay} ${city.name}${titleTail}`;

      let seoTitle: string;
      if (idealTitle.length <= maxTitleLen) {
        seoTitle = idealTitle;
      } else {
        // Drop review count first
        const medParts = [ratingBit, catShort].filter(Boolean);
        const medTitle = `${providerDisplay} ${city.name} — ${medParts.join(" · ")}`;
        if (medTitle.length <= maxTitleLen) {
          seoTitle = medTitle;
        } else {
          // Drop city, keep rating + category
          const shortParts = [ratingBit, catShort].filter(Boolean);
          const shortTitle = `${providerDisplay} — ${shortParts.join(" · ")}`;
          if (shortTitle.length <= maxTitleLen) {
            seoTitle = shortTitle;
          } else {
            // Word-boundary trim on name + rating only
            const tail = hasRating ? ` — ${ratingBit}` : "";
            const nameBudget = maxTitleLen - tail.length;
            let trimmedName = providerDisplay;
            if (trimmedName.length > nameBudget) {
              const lastSpace = trimmedName.lastIndexOf(" ", nameBudget);
              trimmedName = (lastSpace > 0 ? trimmedName.slice(0, lastSpace) : trimmedName.slice(0, nameBudget)).trim();
            }
            seoTitle = `${trimmedName}${tail}`;
          }
        }
      }

      // --- SEO description: CTR-optimized, max ~155 chars ---
      // Lead with rating (eye-catching), then insurance names (matches
      // insurance-intent queries), then services, end with CTA.
      const descParts: string[] = [];
      if (hasRating && prov.googleReviewCount) {
        descParts.push(`Rated ${prov.googleRating}/5 from ${prov.googleReviewCount.toLocaleString()} patient reviews`);
      }
      if (prov.insurance && prov.insurance.length > 0) {
        descParts.push(`Accepts ${prov.insurance.slice(0, 3).join(", ")}${prov.insurance.length > 3 ? ` +${prov.insurance.length - 3} more` : ""}`);
      }
      if (prov.services && prov.services.length > 0) {
        descParts.push(prov.services.slice(0, 3).join(", "));
      }
      let seoDesc: string;
      if (descParts.length > 0) {
        seoDesc = truncateDescription(`${providerDisplay}: ${descParts.join(". ")}. View hours, directions & contact.`);
      } else if (prov.shortDescription) {
        seoDesc = truncateDescription(`${providerDisplay}: ${prov.shortDescription}. View hours, directions & contact.`);
      } else {
        const areaBit = resolved.area?.name ? `${resolved.area.name}, ` : "";
        seoDesc = truncateDescription(
          `${prov.name} is a ${resolved.category.name.toLowerCase()} in ${areaBit}${city.name}, UAE. Address, hours & directions on the UAE Open Healthcare Directory by Zavis.`
        );
      }

      return {
        title: seoTitle,
        description: seoDesc,
        // Non-enriched providers get noindex,follow to protect site quality signals
        // while preserving link equity. They'll be re-indexed once enrichment completes.
        ...(!isEnriched ? { robots: { index: false, follow: true } } : {}),
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
          description: seoDesc, // Reuse the same full description (never empty)
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
        title: truncateTitle(`${proc.name} in ${city.name} — Providers & Costs [${new Date().getFullYear()}]`),
        description: truncateDescription(`Find providers offering ${proc.name.toLowerCase()} in ${city.name}. ${providerCount} verified providers. ${pricing ? `Typical cost: ${formatAed(pricing.typical)} (${formatAed(pricing.min)}–${formatAed(pricing.max)}).` : ""} Compare ratings, insurance, and book.`),
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

export default async function CatchAllPage({ params, searchParams }: Props) {
  const city = getCityBySlug(params.city);
  if (!city) notFound();

  const resolved = await resolveSegments(city.slug, params.segments);
  if (!resolved) notFound();

  const base = getBaseUrl();
  // Item 0.5 + Item 22 — thread searchParams.page end-to-end so the ~136
  // deep-pagination URLs emitted by sitemap.ts actually render their
  // target page instead of collapsing to 1. Current branches that honour
  // the page param: city-category (below). Other branches fall through
  // to page 1 silently.
  const currentPage = parsePage(searchParams?.page);
  const LIST_PAGE_SIZE = 20;

  // --- City + Category Page ---
  // --- City + Category Page (FAT HUB — Item 4 Part B) ---
  //
  // Target ≥500 internal links per page, composed of:
  //   (1) Editorial intro (~200 words, bilingual)               ~0 links
  //   (2) Sibling neighborhood grid (≥3 providers gated)        ~12 links
  //   (3) Insurance pivot strip (geo + tri-facet gated)         ~8 links
  //   (4) Language pivot strip                                  ~5 links
  //   (5) Related specialties strip                             ~8 links
  //   (6) Doctor cross-links (find-a-doctor)                    ~8 links
  //   (7) Top-rated module (deterministic daily rotation)       ~5 links
  //   (8) FAQ block                                             ~0 links
  //   plus 20 provider cards in the main list                   ~20 links
  //   plus pagination (5 deep pages)                            ~5 links
  //   plus "Other specialties" sibling grid                     ~8 links
  //   plus breadcrumbs + intelligence + header/footer links     ~400+ links
  //   = ≈ 500+ internal links per fat hub page.
  if (resolved.type === "city-category") {
    const { category } = resolved;
    const { providers, total } = await getProviders({
      citySlug: city.slug,
      categorySlug: category.slug,
      page: currentPage,
      limit: LIST_PAGE_SIZE,
      sort: "rating",
    });
    // 404 past-end: if the sitemap pointed at a ?page= that no longer
    // has providers, return a real 404 rather than an empty grid.
    if (currentPage > 1 && providers.length === 0) notFound();
    const areas = getAreasByCity(city.slug);
    const topProvider = providers[0];
    const facetFaqs = generateFacetFaqs(city, category, null, total);
    const baseCategoryUrl = `${base}/directory/${city.slug}/${category.slug}`;
    const canonicalUrl =
      currentPage > 1 ? `${baseCategoryUrl}?page=${currentPage}` : baseCategoryUrl;

    // ── Editorial intro ───────────────────────────────────────────────
    const regulator =
      city.slug === "dubai"
        ? "Dubai Health Authority (DHA)"
        : city.slug === "abu-dhabi" || city.slug === "al-ain"
        ? "Department of Health Abu Dhabi (DOH)"
        : "Ministry of Health and Prevention (MOHAP)";
    const regulatorAr =
      city.slug === "dubai"
        ? "هيئة الصحة بدبي (DHA)"
        : city.slug === "abu-dhabi" || city.slug === "al-ain"
        ? "دائرة الصحة أبوظبي (DOH)"
        : "وزارة الصحة ووقاية المجتمع (MOHAP)";
    const editorial = getHubEditorial(city.slug, category.slug, {
      city: city.name,
      specialty: category.name,
      specialtyLower: category.name.toLowerCase(),
      providerCount: total,
      regulator,
      regulatorAr,
    });

    // ── Fat-hub optional blocks — run in parallel via Promise.allSettled ──
    //
    // DEFENSE IN DEPTH: every one of these blocks enriches the page but is
    // non-essential. If any single query times out (pool pressure, slow
    // index, cold cache), we gracefully drop that block and still serve the
    // page. Previously an `await X` throw here would propagate up to the
    // server component and trip error.tsx — user saw "Something went wrong"
    // on 2026-04-11 when the PM2 worker was being SIGTERM'd mid-render.
    //
    // Running these in parallel also shaves ~2-3 round-trips of latency vs.
    // the prior sequential awaits (neighborhood → insurer → doctor-xlinks).
    const eligibleInsurers = getInsurancePlansByGeo(city.slug);
    const insurerCandidates = eligibleInsurers.slice(0, 10);

    const [
      neighborhoodsRes,
      insurerEligibilityRes,
      doctorCrossLinksRes,
    ] = await Promise.allSettled([
      getNeighborhoodsByCity(city.slug, { minProviders: 3 }),
      Promise.all(
        insurerCandidates.map(async (plan) => {
          try {
            const eligible = await isTriFacetEligible(
              plan.slug,
              city.slug,
              category.slug,
            );
            return eligible ? { slug: plan.slug, name: plan.nameEn } : null;
          } catch {
            return null;
          }
        }),
      ),
      getProfessionalsIndexBySpecialty(category.slug, { limit: 8 }),
    ]);

    // ── Sibling neighborhood grid (DB-first, ≥3 providers gated) ────
    const neighborhoods =
      neighborhoodsRes.status === "fulfilled" ? neighborhoodsRes.value : [];
    const topNeighborhoods = neighborhoods.slice(0, 12);

    // ── Insurance pivot strip (geo + tri-facet gated) ───────────────
    const insurerEligibility =
      insurerEligibilityRes.status === "fulfilled"
        ? insurerEligibilityRes.value
        : [];
    const insurerPivots = insurerEligibility
      .filter((x): x is { slug: string; name: string } => x !== null)
      .slice(0, 8);

    // ── Language pivot strip ─────────────────────────────────────────
    const LANG_SEEDS = ["arabic", "english", "hindi", "urdu", "tagalog"];
    const languagePivots = LANG_SEEDS
      .map((slug) => LANGUAGES.find((l) => l.slug === slug))
      .filter((l): l is (typeof LANGUAGES)[number] => Boolean(l))
      .slice(0, 5);

    // ── Related specialties ──────────────────────────────────────────
    const relatedSlugs = getRelatedSpecialties(category.slug, 8);
    const relatedCategories = relatedSlugs
      .map((slug) => getCategoryBySlug(slug))
      .filter((c): c is NonNullable<ReturnType<typeof getCategoryBySlug>> => Boolean(c));

    // ── Doctor cross-links (find-a-doctor) ───────────────────────────
    // Pulled from the Promise.allSettled above — gracefully empty on failure.
    const doctorCrossLinks =
      doctorCrossLinksRes.status === "fulfilled"
        ? doctorCrossLinksRes.value.professionals
        : [];

    // ── Top-rated module (deterministic daily rotation) ──────────────
    const topRatedPool = [...providers]
      .filter((p) => p.googleReviewCount >= 3 && Number(p.googleRating) >= 4)
      .sort((a, b) => {
        const rd = Number(b.googleRating) - Number(a.googleRating);
        if (rd !== 0) return rd;
        return (b.googleReviewCount || 0) - (a.googleReviewCount || 0);
      });
    const nowDate = new Date();
    const dayOfYear = Math.floor(
      (nowDate.getTime() - new Date(nowDate.getFullYear(), 0, 0).getTime()) / 86400000,
    );
    const seedOffset = topRatedPool.length > 0 ? dayOfYear % topRatedPool.length : 0;
    const topRated: typeof providers = [];
    for (let i = 0; i < Math.min(5, topRatedPool.length); i++) {
      topRated.push(topRatedPool[(seedOffset + i) % topRatedPool.length]);
    }

    // ── JSON-LD: CollectionPage + BreadcrumbList + ItemList + FAQPage ──
    const collectionPageNode: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "@id": `${canonicalUrl}#webpage`,
      url: canonicalUrl,
      name: `${category.name} in ${city.name}`,
      inLanguage: ["en-AE", "ar-AE"],
      about: {
        "@type": "MedicalSpecialty",
        name: category.name,
      },
      spatialCoverage: {
        "@type": "Place",
        name: city.name,
        address: {
          "@type": "PostalAddress",
          addressLocality: city.name,
          addressCountry: "AE",
        },
      },
      mainEntity: { "@id": `${canonicalUrl}#providers` },
      breadcrumb: { "@id": `${canonicalUrl}#breadcrumb` },
      isPartOf: {
        "@type": "WebSite",
        "@id": `${base}/#website`,
        name: "UAE Open Healthcare Directory by Zavis",
        url: base,
      },
    };
    const breadcrumbNode = breadcrumbSchema([
      { name: "UAE", url: base },
      { name: city.name, url: `${base}/directory/${city.slug}` },
      { name: category.name },
    ]) as Record<string, unknown>;
    breadcrumbNode["@id"] = `${canonicalUrl}#breadcrumb`;
    const itemListNode = itemListSchema(
      `${category.name} in ${city.name}`,
      providers,
      city.name,
      base,
    ) as Record<string, unknown>;
    itemListNode["@id"] = `${canonicalUrl}#providers`;

    return (
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <JsonLd data={collectionPageNode} />
        <JsonLd data={breadcrumbNode} />
        <JsonLd data={itemListNode} />
        <JsonLd data={faqPageSchema(facetFaqs)} />
        <JsonLd data={speakableSchema([".answer-block"])} />

        <Breadcrumb items={[{ label: "UAE", href: "/" }, { label: city.name, href: `/directory/${city.slug}` }, { label: category.name }]} />

        {/* Category hero banner — compact. `priority` forces preload so this
            above-the-fold LCP element isn't lazy-loaded on the ~10k
            city×specialty pages in this branch. */}
        <div className="relative h-32 w-full mb-6 overflow-hidden rounded-2xl">
          <Image
            src={getCategoryImagePath(category.slug)}
            alt={`${category.name} in ${city.name}`}
            fill
            priority
            className="object-cover"
            sizes="(max-width: 1280px) 100vw, 1280px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-2xl text-white mb-1 tracking-tight">{category.name} in {city.name}, UAE</h1>
            <p className="font-['Geist',sans-serif] text-sm text-white/70">{total} verified {total === 1 ? "provider" : "providers"} · Last updated March 2026</p>
          </div>
        </div>

        <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 mb-6" data-answer-block="true">
          <p className="font-['Geist',sans-serif] font-medium text-sm text-black/50 leading-relaxed">{generateFacetAnswerBlock(city, category, null, total, topProvider)}</p>
        </div>

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
            {providers.map((p) => (<ProviderCard key={p.id} name={p.name} slug={p.slug} citySlug={p.citySlug} categorySlug={p.categorySlug} address={p.address} phone={p.phone} website={p.website} shortDescription={p.shortDescription} googleRating={p.googleRating} googleReviewCount={p.googleReviewCount} isClaimed={p.isClaimed} isVerified={p.isVerified} coverImageUrl={p.coverImageUrl} insurance={p.insurance} languages={p.languages} services={p.services} operatingHours={p.operatingHours} accessibilityOptions={p.accessibilityOptions} />))}
          </div>
        }>
          <ProviderListPaginated
            providers={providers}
            currentPage={currentPage}
            totalCount={total}
            pageSize={LIST_PAGE_SIZE}
            baseUrl={`/directory/${city.slug}/${category.slug}`}
            emptyMessage={`No ${category.name.toLowerCase()} found in ${city.name} yet.`}
          />
        </Suspense>

        {/* ── (1) Editorial intro — ~200 words, bilingual ─────────────── */}
        <section className="mt-10 mb-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] text-[#1c1c1c] tracking-tight mb-3 border-b-2 border-[#1c1c1c] pb-2">
              About {category.name} in {city.name}
            </h2>
            <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
              {editorial.en}
            </p>
            {!editorial.handWritten && (
              <p className="font-['Geist',sans-serif] text-[10px] text-black/30 mt-2">
                Automated city-specialty overview — editorial review pending.
              </p>
            )}
          </div>
          <div dir="rtl" lang="ar">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] text-[#1c1c1c] tracking-tight mb-3 border-b-2 border-[#1c1c1c] pb-2">
              {category.name} في {city.name}
            </h2>
            <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
              {editorial.ar}
            </p>
          </div>
        </section>

        {/* ── (2) Sibling neighborhood grid ─────────────────────────── */}
        {topNeighborhoods.length > 0 && (
          <section className="mt-10 mb-8">
            <div className="flex items-center gap-3 mb-4 border-b-2 border-[#1c1c1c] pb-3">
              <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
                {category.name} by neighborhood in {city.name}
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {topNeighborhoods.map((n) => (
                <Link
                  key={n.slug}
                  href={`/directory/${city.slug}/${n.slug}/${category.slug}`}
                  className="inline-block font-['Geist',sans-serif] bg-white text-[#1c1c1c] text-sm px-3 py-2 rounded-lg border border-black/[0.06] hover:border-[#006828]/20 hover:bg-[#006828]/[0.04] transition-colors"
                >
                  {category.name} in {n.name}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── (3) Insurance pivot strip (geo + tri-facet gated) ─────── */}
        {insurerPivots.length > 0 && (
          <section className="mt-10 mb-8">
            <div className="flex items-center gap-3 mb-4 border-b-2 border-[#1c1c1c] pb-3">
              <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
                {category.name} by insurance in {city.name}
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {insurerPivots.map((ins) => (
                <Link
                  key={ins.slug}
                  href={`/directory/${city.slug}/insurance/${ins.slug}/${category.slug}`}
                  className="inline-flex items-center gap-1.5 font-['Geist',sans-serif] bg-white text-[#1c1c1c] text-sm px-3 py-2 rounded-lg border border-black/[0.06] hover:border-[#006828]/20 hover:bg-[#006828]/[0.04] transition-colors"
                >
                  <Shield className="h-3 w-3 text-[#006828]" aria-hidden="true" />
                  {category.name} accepting {ins.name}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── (4) Language pivot strip ───────────────────────────────── */}
        {languagePivots.length > 0 && (
          <section className="mt-10 mb-8">
            <div className="flex items-center gap-3 mb-4 border-b-2 border-[#1c1c1c] pb-3">
              <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
                {category.name} by language in {city.name}
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {languagePivots.map((lang) => (
                <Link
                  key={lang.slug}
                  href={`/directory/${city.slug}/language/${lang.slug}/${category.slug}`}
                  className="inline-flex items-center gap-1.5 font-['Geist',sans-serif] bg-white text-[#1c1c1c] text-sm px-3 py-2 rounded-lg border border-black/[0.06] hover:border-[#006828]/20 hover:bg-[#006828]/[0.04] transition-colors"
                >
                  <Languages className="h-3 w-3 text-[#006828]" aria-hidden="true" />
                  {lang.name}-speaking {category.name.toLowerCase()}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── (5) Related specialties strip ──────────────────────────── */}
        {relatedCategories.length > 0 && (
          <section className="mt-10 mb-8">
            <div className="flex items-center gap-3 mb-4 border-b-2 border-[#1c1c1c] pb-3">
              <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
                Related specialties in {city.name}
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {relatedCategories.map((c) => (
                <Link
                  key={c.slug}
                  href={`/directory/${city.slug}/${c.slug}`}
                  className="inline-flex items-center gap-1.5 font-['Geist',sans-serif] bg-white text-[#1c1c1c] text-sm px-3 py-2 rounded-lg border border-black/[0.06] hover:border-[#006828]/20 hover:bg-[#006828]/[0.04] transition-colors"
                >
                  <Stethoscope className="h-3 w-3 text-[#006828]" aria-hidden="true" />
                  {c.name}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── (6) Doctor cross-links — bridges facility ↔ doctor ────── */}
        {doctorCrossLinks.length > 0 && (
          <section className="mt-10 mb-8">
            <div className="flex items-center justify-between gap-3 mb-4 border-b-2 border-[#1c1c1c] pb-3">
              <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
                Individual {category.name.toLowerCase()} in {city.name}
              </h2>
              <Link href={`/find-a-doctor/${category.slug}`} className="font-['Geist',sans-serif] text-xs font-semibold text-[#006828] hover:underline">
                All doctors &rarr;
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {doctorCrossLinks.map((doc) => (
                <Link
                  key={doc.id}
                  href={`/find-a-doctor/${doc.specialtySlug}/${doc.slug}`}
                  className="group block bg-white border border-black/[0.06] rounded-xl p-4 hover:border-[#006828]/15 hover:bg-[#006828]/[0.02] transition-colors"
                >
                  <h3 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-sm text-[#1c1c1c] group-hover:text-[#006828] tracking-tight mb-1 truncate">
                    {doc.displayTitle}
                  </h3>
                  <p className="font-['Geist',sans-serif] text-xs text-black/40 truncate">
                    {doc.specialty}
                  </p>
                  {doc.primaryFacilityName && (
                    <p className="font-['Geist',sans-serif] text-xs text-black/30 mt-0.5 truncate">
                      {doc.primaryFacilityName}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── (7) Top-rated module — deterministic daily rotation ────── */}
        {topRated.length > 0 && (
          <section className="mt-10 mb-8">
            <div className="flex items-center gap-3 mb-4 border-b-2 border-[#1c1c1c] pb-3">
              <Star className="h-4 w-4 text-[#006828]" aria-hidden="true" />
              <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
                Top-rated {category.name.toLowerCase()} today in {city.name}
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {topRated.map((p) => (
                <ProviderCard
                  key={`tr-${p.id}`}
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
                  coverImageUrl={p.coverImageUrl}
                  insurance={p.insurance}
                  languages={p.languages}
                  services={p.services}
                  operatingHours={p.operatingHours}
                  accessibilityOptions={p.accessibilityOptions}
                />
              ))}
            </div>
          </section>
        )}

        {/* ── (8) FAQ block ──────────────────────────────────────────── */}
        <FaqSection faqs={facetFaqs} title={`${category.name} in ${city.name} — FAQ`} />

        {/* Related Intelligence — hub-and-spoke cross-link */}
        {await (async () => {
          // Gracefully skip this block if article loading fails — page must
          // still render even if the intelligence DB is slow or unreachable.
          let relatedArticles: ReturnType<typeof getArticlesByDirectoryContext> = [];
          try {
            await loadDbArticles();
            relatedArticles = getArticlesByDirectoryContext(city.name, category.slug, category.name, 4);
          } catch {
            return null;
          }
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

    // Item 3 — neighborhood hub schema: emits CollectionPage + Place +
    // ItemList + BreadcrumbList + FAQPage (with centroid / bbox when the
    // area has polygon data from Dubai Pulse / Abu Dhabi Open Data / OSM).
    // Falls back gracefully when the area row has no polygon fields.
    const neighborhoodNodes = neighborhoodHubSchema(
      city,
      area,
      null,
      providers,
      total,
      base,
    );

    return (
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {neighborhoodNodes.map((node, i) => (
          <JsonLd key={`neighborhood-schema-${i}`} data={node} />
        ))}
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
            {providers.map((p) => (<ProviderCard key={p.id} name={p.name} slug={p.slug} citySlug={p.citySlug} categorySlug={p.categorySlug} address={p.address} phone={p.phone} website={p.website} shortDescription={p.shortDescription} googleRating={p.googleRating} googleReviewCount={p.googleReviewCount} isClaimed={p.isClaimed} isVerified={p.isVerified} coverImageUrl={p.coverImageUrl} />))}
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
    // Empty area+category combos show an empty state instead of a hard
    // 404 — preserves link equity and guides users to the city-level
    // category page. noindex prevents thin-content pollution.
    const topProvider = providers[0] ?? null;
    const facetFaqs = total > 0 ? generateFacetFaqs(city, category, area, total) : [];

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
          <p className="font-['Geist',sans-serif] text-black/40 leading-relaxed">
            {total > 0 && topProvider
              ? generateFacetAnswerBlock(city, category, area, total, topProvider)
              : `There are currently no registered ${category.name.toLowerCase()} providers in ${area.name}, ${city.name}. Browse all ${category.name.toLowerCase()} across ${city.name} instead.`}
          </p>
        </div>

        {providers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {providers.map((p) => (<ProviderCard key={p.id} name={p.name} slug={p.slug} citySlug={p.citySlug} categorySlug={p.categorySlug} address={p.address} phone={p.phone} website={p.website} shortDescription={p.shortDescription} googleRating={p.googleRating} googleReviewCount={p.googleReviewCount} isClaimed={p.isClaimed} isVerified={p.isVerified} coverImageUrl={p.coverImageUrl} />))}
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

    // Cap at 200 — enough for insurer counting without an unbounded query.
    // The old limit: 99999 was a performance liability on large areas.
    const { providers: areaProviders } = await getProviders({ citySlug: city.slug, areaSlug: area.slug, limit: 200 });

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

    // Same-category providers for internal linking
    const sameCategoryResult = await getProviders({
      citySlug: city.slug,
      categorySlug: category.slug,
      areaSlug: area?.slug,
      limit: 7,
      sort: "rating",
    });
    const sameCategoryProviders = sameCategoryResult.providers.filter((p) => p.id !== provider.id).slice(0, 6);
    const sameCategoryTotal = sameCategoryResult.total > 0 ? sameCategoryResult.total - 1 : 0;

    // Build insurance slug lookup for linking
    const allInsurers = getInsuranceProviders();
    const insurerSlugMap = new Map<string, string>();
    for (const ins of allInsurers) {
      insurerSlugMap.set(ins.name.toLowerCase(), ins.slug);
    }

    const hasValidRating = Number(provider.googleRating) > 0;
    const answerBlock = `According to the UAE Open Healthcare Directory, ${provider.name} is a ${provider.isVerified ? "verified " : ""}${category.name.toLowerCase().replace(/s$/, "")} in ${area?.name ? area.name + ", " : ""}${city.name}, UAE${hasValidHours(provider.operatingHours) && provider.operatingHours.mon ? `, open ${provider.operatingHours.mon.open === "00:00" ? "24/7" : `${provider.operatingHours.mon.open}–${provider.operatingHours.mon.close}`}` : ""}. ${provider.services.length > 0 ? `Services: ${provider.services.slice(0, 4).join(", ")}.` : ""} ${provider.insurance.length > 0 ? "Insurance accepted." : ""} ${hasValidRating ? `Google rating: ${provider.googleRating}/5 from ${provider.googleReviewCount?.toLocaleString()} reviews.` : ""} ${provider.phone ? `Contact: ${provider.phone}.` : ""} Data sourced from official government registers. Last verified: ${formatVerifiedDate(provider.lastVerified)}.`;

    const areaName = area?.name || "";
    const locationLabel = areaName ? `${areaName}, ${city.name}` : city.name;
    const providerFaqs: { question: string; answer: string }[] = [
      {
        question: `What are the opening hours of ${provider.name} in ${city.name}?`,
        answer: (() => {
          if (!hasValidHours(provider.operatingHours)) {
            return `Contact ${provider.name} directly for current opening hours. Phone: ${provider.phone || "see listing"}.`;
          }
          const dayLines = Object.entries(provider.operatingHours)
            .map(([d, h]) => buildFaqDayLine(d, h?.open, h?.close))
            .filter(Boolean);
          if (dayLines.length === 0) {
            return `Contact ${provider.name} directly for current opening hours. Phone: ${provider.phone || "see listing"}.`;
          }
          return `${provider.name} in ${city.name} operates on the following schedule: ${dayLines.join(". ")}. Last verified ${formatVerifiedDate(provider.lastVerified)}.`;
        })(),
      },
      { question: `Which insurance plans does ${provider.name} accept?`, answer: provider.insurance.length > 0 ? `${provider.name} accepts the following insurance plans: ${provider.insurance.join(", ")}. Always confirm coverage details directly with the provider before your visit.` : `Contact ${provider.name} directly to confirm which insurance plans are currently accepted.` },
      { question: `What medical services are available at ${provider.name}?`, answer: provider.services.length > 0 ? `${provider.name} provides the following medical services: ${provider.services.join(", ")}. This information is sourced from official UAE health authority records.` : `Contact ${provider.name} for a full list of available medical services.` },
      { question: `How do I get to ${provider.name} in ${locationLabel}?`, answer: `${provider.name} is located at ${provider.address}${areaName ? `, in the ${areaName} area of ${city.name}` : `, ${city.name}`}, UAE.${parseFloat(provider.latitude) !== 0 ? " You can find directions via Google Maps." : ""} ${provider.phone ? `For directions or appointments, call ${provider.phone}.` : ""}` },
    ];
    // Dynamic FAQ: Google rating
    if (hasValidRating && provider.googleReviewCount && provider.googleReviewCount > 0) {
      providerFaqs.push({
        question: `What is the Google rating of ${provider.name}?`,
        answer: `${provider.name} has a rating of ${provider.googleRating}/5 based on ${provider.googleReviewCount.toLocaleString()} patient reviews on Google.`,
      });
    }
    // Dynamic FAQ: Languages spoken
    if (provider.languages.length > 0) {
      providerFaqs.push({
        question: `What languages do staff speak at ${provider.name}?`,
        answer: `Staff at ${provider.name} speak ${provider.languages.join(", ")}. This makes the facility accessible to a diverse patient population in ${city.name}.`,
      });
    }
    // Dynamic FAQ: Year established
    if (provider.yearEstablished && provider.yearEstablished > 0) {
      const yearsOperating = new Date().getFullYear() - provider.yearEstablished;
      providerFaqs.push({
        question: `How long has ${provider.name} been operating?`,
        answer: `${provider.name} has been serving patients since ${provider.yearEstablished}${yearsOperating > 0 ? `, making it a healthcare provider with ${yearsOperating} years of experience in ${city.name}` : ""}.`,
      });
    }

    // Build HTML-enriched FAQ answers for JSON-LD schema (Google supports HTML in acceptedAnswer.text)
    const providerProfileUrl = `/directory/${city.slug}/${category.slug}/${provider.slug}`;
    const lat = parseFloat(provider.latitude);
    const lng = parseFloat(provider.longitude);
    const hasValidCoords = lat !== 0 && lng !== 0;

    const providerFaqsRich: { question: string; answer: string }[] = [
      {
        question: `What are the opening hours of ${provider.name} in ${city.name}?`,
        answer: (() => {
          if (!hasValidHours(provider.operatingHours)) {
            return `Contact ${provider.name} directly for current opening hours. Phone: ${provider.phone || "see listing"}. <a href="${providerProfileUrl}">View full profile</a>`;
          }
          const dayLines = Object.entries(provider.operatingHours)
            .map(([d, h]) => buildFaqDayLine(d, h?.open, h?.close))
            .filter(Boolean);
          if (dayLines.length === 0) {
            return `Contact ${provider.name} directly for current opening hours. Phone: ${provider.phone || "see listing"}. <a href="${providerProfileUrl}">View full profile</a>`;
          }
          return `${provider.name} in ${city.name} operates on the following schedule: ${dayLines.join(". ")}. Last verified ${formatVerifiedDate(provider.lastVerified)}. <a href="${providerProfileUrl}">View full profile</a>`;
        })(),
      },
      {
        question: `Which insurance plans does ${provider.name} accept?`,
        answer: provider.insurance.length > 0
          ? `${provider.name} accepts the following insurance plans: ${provider.insurance.map((ins) => { const slug = insurerSlugMap.get(ins.toLowerCase()); return slug ? `<a href="/insurance/${slug}">${ins}</a>` : ins; }).join(", ")}. Always confirm coverage details directly with the provider before your visit.`
          : `Contact ${provider.name} directly to confirm which insurance plans are currently accepted.`,
      },
      {
        question: `What medical services are available at ${provider.name}?`,
        answer: provider.services.length > 0
          ? `${provider.name} provides the following medical services: ${provider.services.join(", ")}. This information is sourced from official UAE health authority records. See all <a href="/directory/${city.slug}/${category.slug}">${category.name} in ${city.name}</a>`
          : `Contact ${provider.name} for a full list of available medical services.`,
      },
      {
        question: `How do I get to ${provider.name} in ${locationLabel}?`,
        answer: `${provider.name} is located at ${provider.address}${areaName ? `, in the ${areaName} area of ${city.name}` : `, ${city.name}`}, UAE.${hasValidCoords ? ` <a href="https://maps.google.com/?q=${lat},${lng}">Get directions</a>` : ""} ${provider.phone ? `For directions or appointments, call ${provider.phone}.` : ""}`,
      },
    ];
    if (hasValidRating && provider.googleReviewCount && provider.googleReviewCount > 0) {
      providerFaqsRich.push({
        question: `What is the Google rating of ${provider.name}?`,
        answer: `${provider.name} has a rating of ${provider.googleRating}/5 based on ${provider.googleReviewCount.toLocaleString()} patient reviews on Google. <a href="${providerProfileUrl}">View full profile and reviews</a>`,
      });
    }
    if (provider.languages.length > 0) {
      providerFaqsRich.push({
        question: `What languages do staff speak at ${provider.name}?`,
        answer: `Staff at ${provider.name} speak ${provider.languages.join(", ")}. This makes the facility accessible to a diverse patient population in ${city.name}.`,
      });
    }
    if (provider.yearEstablished && provider.yearEstablished > 0) {
      const yearsOp = new Date().getFullYear() - provider.yearEstablished;
      providerFaqsRich.push({
        question: `How long has ${provider.name} been operating?`,
        answer: `${provider.name} has been serving patients since ${provider.yearEstablished}${yearsOp > 0 ? `, making it a healthcare provider with ${yearsOp} years of experience in ${city.name}` : ""}.`,
      });
    }

    // Item 2 — emit the layered schema graph via generateFullProviderSchema
    // so every provider profile ships Provider + MedicalWebPage + BreadcrumbList
    // + FAQPage with stable #provider / #webpage / #breadcrumb @id anchors,
    // not the bare medicalOrganizationSchema node that earlier versions used.
    // IMPORTANT: pass an ABSOLUTE canonicalUrl. The earlier version passed
    // `providerProfileUrl` which is a relative path (e.g., "/directory/..."),
    // and the composer used it verbatim for the `#provider / #webpage /
    // #breadcrumb` @id anchors, which would emit relative JSON-LD @ids —
    // defeating the whole point of the composer. Caught by reviewer pass.
    const providerSchemaNodes = generateFullProviderSchema({
      provider,
      city,
      category,
      area: area ?? null,
      breadcrumbs: [
        { name: "UAE", url: base },
        { name: city.name, url: `${base}/directory/${city.slug}` },
        { name: category.name, url: `${base}/directory/${city.slug}/${category.slug}` },
        { name: provider.name },
      ],
      faqs: providerFaqsRich,
      options: { canonicalUrl: `${base}${providerProfileUrl}`, baseUrl: base },
    });

    return (
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {providerSchemaNodes.map((node, i) => (
          <JsonLd key={`provider-schema-${i}`} data={node} />
        ))}
        <JsonLd data={speakableSchema([".answer-block"])} />

        <Breadcrumb items={[{ label: "UAE", href: "/" }, { label: city.name, href: `/directory/${city.slug}` }, { label: category.name, href: `/directory/${city.slug}/${category.slug}` }, { label: provider.name }]} />

        {/* Cross-language crawl anchor — one visible body-level link to
            the Arabic counterpart on every provider profile. hreflang in
            metadata is a canonicalization hint only; Google needs a real
            <a href> to flow PageRank into /ar/. Multiplied across 25K+
            English profiles, this is the primary discovery path for the
            Arabic listing graph. */}
        <div className="mb-4 flex items-center justify-end">
          <Link
            href={`/ar/directory/${city.slug}/${category.slug}/${provider.slug}`}
            lang="ar"
            hrefLang="ar-AE"
            dir="rtl"
            className="inline-flex items-center gap-1.5 font-['Geist',sans-serif] text-xs font-medium text-black/50 hover:text-[#006828] transition-colors"
            aria-label={`عرض ${provider.name} بالعربية`}
          >
            <Globe className="h-3.5 w-3.5" aria-hidden="true" />
            اقرأ هذه الصفحة بالعربية
          </Link>
        </div>

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

        {/* Photo gallery — shown above the fold when Google provided multiple images */}
        {provider.galleryPhotos && provider.galleryPhotos.length > 1 && (
          <div className="mb-8" data-section="gallery">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[#1c1c1c] flex items-center gap-2 tracking-tight">
                <ImageIcon className="h-5 w-5 text-[#006828]" /> Photos
              </h2>
              <span className="font-['Geist',sans-serif] text-xs text-black/30">
                {provider.galleryPhotos.length} photos · via Google
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {provider.galleryPhotos.slice(0, 8).map((photo, idx) => (
                <div
                  key={idx}
                  className="relative aspect-square overflow-hidden rounded-xl border border-black/[0.06]"
                >
                  <Image
                    src={photo.url}
                    alt={`${provider.name} — photo ${idx + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    loading={idx < 4 ? "eager" : "lazy"}
                  />
                </div>
              ))}
            </div>
            {provider.galleryPhotos.some((p) => p.attributions?.length > 0) && (
              <p className="font-['Geist',sans-serif] text-[11px] text-black/25 mt-2">
                Photos by {Array.from(new Set(provider.galleryPhotos.flatMap((p) => p.attributions?.map((a) => a.displayName) || []))).slice(0, 3).join(", ")} via Google Maps
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">

            {/* 50-word LLM answer block */}
            <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 mb-6" data-answer-block="true" data-last-verified={provider.lastVerified}>
              <p className="font-['Geist',sans-serif] font-medium text-sm text-black/50 leading-relaxed">{answerBlock}</p>
            </div>

            {/* About */}
            <div className="border border-black/[0.06] rounded-2xl p-6 mb-5" data-section="about">
              <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[#1c1c1c] mb-3 tracking-tight">About {provider.name}</h2>
              {provider.editorialSummary && (
                <div className="bg-[#f8f8f6] border border-black/[0.04] rounded-lg p-3 mb-3">
                  <p className="font-['Geist',sans-serif] text-[10px] uppercase tracking-wider text-black/40 mb-1">Google summary</p>
                  <p className="font-['Geist',sans-serif] text-sm text-[#1c1c1c] leading-relaxed">{provider.editorialSummary}</p>
                </div>
              )}
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

            {/* Accessibility */}
            {provider.accessibilityOptions &&
              Object.values(provider.accessibilityOptions).some((v) => v === true) && (
                <div className="border border-black/[0.06] rounded-2xl p-6 mb-5" data-section="accessibility">
                  <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[#1c1c1c] mb-3 flex items-center gap-2 tracking-tight">
                    <Accessibility className="h-5 w-5 text-[#006828]" /> Accessibility
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {provider.accessibilityOptions.wheelchairAccessibleEntrance && (
                      <span className="inline-flex items-center gap-1.5 font-['Geist',sans-serif] bg-[#006828]/[0.08] text-[#006828] text-xs font-medium px-3 py-1.5 rounded-full">
                        <CheckCircle className="h-3.5 w-3.5" /> Wheelchair-accessible entrance
                      </span>
                    )}
                    {provider.accessibilityOptions.wheelchairAccessibleParking && (
                      <span className="inline-flex items-center gap-1.5 font-['Geist',sans-serif] bg-[#006828]/[0.08] text-[#006828] text-xs font-medium px-3 py-1.5 rounded-full">
                        <CheckCircle className="h-3.5 w-3.5" /> Wheelchair-accessible parking
                      </span>
                    )}
                    {provider.accessibilityOptions.wheelchairAccessibleRestroom && (
                      <span className="inline-flex items-center gap-1.5 font-['Geist',sans-serif] bg-[#006828]/[0.08] text-[#006828] text-xs font-medium px-3 py-1.5 rounded-full">
                        <CheckCircle className="h-3.5 w-3.5" /> Wheelchair-accessible restroom
                      </span>
                    )}
                    {provider.accessibilityOptions.wheelchairAccessibleSeating && (
                      <span className="inline-flex items-center gap-1.5 font-['Geist',sans-serif] bg-[#006828]/[0.08] text-[#006828] text-xs font-medium px-3 py-1.5 rounded-full">
                        <CheckCircle className="h-3.5 w-3.5" /> Wheelchair-accessible seating
                      </span>
                    )}
                  </div>
                </div>
              )}

            {/* Services */}
            {provider.services.length > 0 && (
              <div className="border border-black/[0.06] rounded-2xl p-6 mb-5" data-section="services">
                <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[#1c1c1c] mb-3 flex items-center gap-2 tracking-tight"><Stethoscope className="h-5 w-5 text-[#006828]" /> Services</h2>
                <p className="font-['Geist',sans-serif] text-sm text-black/40 mb-3">{provider.name} provides these services in {city.name}:</p>
                <div className="flex flex-wrap gap-2">{provider.services.map((s) => (<span key={s} className="inline-block font-['Geist',sans-serif] border border-[#006828]/20 text-[#006828] text-sm px-3 py-1 rounded-full">{s}</span>))}</div>
                <Link href={`/directory/${city.slug}/${category.slug}`} className="inline-flex items-center gap-1.5 font-['Geist',sans-serif] text-sm text-[#006828] hover:text-[#004d1c] mt-4 transition-colors">
                  Browse all {category.name} in {city.name} <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}

            {/* Hours — prefer Google's rich weekday descriptions when available */}
            {(() => {
              const weekday = provider.currentOpeningHours?.weekdayDescriptions;
              const hasWeekday = Array.isArray(weekday) && weekday.length > 0;
              const hasLegacy =
                provider.operatingHours &&
                Object.keys(provider.operatingHours).length > 0;
              if (!hasWeekday && !hasLegacy) return null;
              return (
                <div className="border border-black/[0.06] rounded-2xl p-6 mb-5" data-section="hours">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[#1c1c1c] flex items-center gap-2 tracking-tight">
                      <Clock className="h-5 w-5 text-[#006828]" /> Operating Hours
                    </h2>
                    {provider.currentOpeningHours?.openNow !== undefined && (
                      <span
                        className={`font-['Geist',sans-serif] text-xs font-medium px-3 py-1 rounded-full ${
                          provider.currentOpeningHours.openNow
                            ? "bg-[#006828]/[0.08] text-[#006828]"
                            : "bg-black/[0.04] text-black/50"
                        }`}
                      >
                        {provider.currentOpeningHours.openNow ? "Open now" : "Closed now"}
                      </span>
                    )}
                  </div>
                  {hasWeekday ? (
                    <ul className="space-y-1">
                      {weekday!.map((line, i) => (
                        <li
                          key={i}
                          className="font-['Geist',sans-serif] text-sm text-[#1c1c1c] py-1 border-b border-black/[0.06] last:border-b-0"
                        >
                          {line}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    (() => {
                      // Normalize legacy operatingHours shapes (full English
                      // day names, 12-hour AM/PM, etc.) — drop rows whose
                      // day key or time range can't be resolved instead of
                      // rendering "undefined – undefined".
                      const rows = Object.entries(provider.operatingHours!)
                        .map(([d, h]) => {
                          const day = normalizeDayName(d);
                          const range = formatHoursRange(h?.open, h?.close);
                          if (!day || !range) return null;
                          return { key: d, day, range };
                        })
                        .filter(
                          (row): row is { key: string; day: string; range: string } => row !== null
                        );
                      if (rows.length === 0) return null;
                      return (
                        <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                          {rows.map((row) => (
                            <div key={row.key} className="flex justify-between text-sm py-1 border-b border-black/[0.06] last:border-b-0">
                              <span className="font-['Geist',sans-serif] text-black/40">{row.day}</span>
                              <span className="font-['Geist',sans-serif] font-medium text-[#1c1c1c]">{row.range}</span>
                            </div>
                          ))}
                        </div>
                      );
                    })()
                  )}
                </div>
              );
            })()}

            {/* Insurance */}
            {provider.insurance.length > 0 && (
              <div className="border border-black/[0.06] rounded-2xl p-6 mb-5" data-section="insurance">
                <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[#1c1c1c] mb-3 flex items-center gap-2 tracking-tight"><Shield className="h-5 w-5 text-[#006828]" /> Accepted Insurance</h2>
                <p className="font-['Geist',sans-serif] text-sm text-black/40 mb-3">{provider.name} accepts these insurance plans:</p>
                <div className="flex flex-wrap gap-2">{provider.insurance.map((i) => {
                  const insurerSlug = insurerSlugMap.get(i.toLowerCase());
                  return insurerSlug ? (
                    <Link key={i} href={`/insurance/${insurerSlug}`} className="inline-block font-['Geist',sans-serif] bg-[#f8f8f6] text-[#1c1c1c] text-sm px-3 py-1.5 rounded-lg border border-black/[0.06] hover:border-[#006828]/30 hover:text-[#006828] transition-colors">{i}</Link>
                  ) : (
                    <span key={i} className="inline-block font-['Geist',sans-serif] bg-[#f8f8f6] text-[#1c1c1c] text-sm px-3 py-1.5 rounded-lg border border-black/[0.06]">{i}</span>
                  );
                })}</div>
              </div>
            )}

            {/* Patient reviews section. Three-tier fallback, picks the best
                data available per provider:
                  1. reviewSummaryV2 — bulky block with editorial overview,
                     theme chips, and partial-quote snippet cards. Produced by
                     scripts/rewrite-reviews-v2-or.mjs from raw google_reviews.
                  2. reviewSummary (legacy) — themed bullet list (pre-v2 work).
                  3. (nothing) — section is hidden.
                All tiers cap at half-sentence partial quotes; never republish
                verbatim user content. Avoids duplicate-content de-ranking +
                complies with Google TOS §3.2.4(b) on review display. */}
            {provider.reviewSummaryV2 ? (
              <div
                className="border border-black/[0.06] rounded-2xl p-6 mb-5 bg-[#f8f8f6]"
                data-section="reviews"
              >
                <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                  <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[#1c1c1c] flex items-center gap-2 tracking-tight">
                    <Quote className="h-5 w-5 text-[#006828]" /> What patients say
                  </h2>
                  {hasValidRating && (
                    <div className="flex items-center gap-1.5 font-['Geist',sans-serif] text-sm">
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3.5 w-3.5 ${
                              i < Math.round(Number(provider.googleRating))
                                ? "text-[#006828] fill-[#006828]"
                                : "text-black/15"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="font-medium text-[#1c1c1c]">{provider.googleRating}</span>
                      <span className="text-black/40">
                        ({provider.googleReviewCount?.toLocaleString()} reviews)
                      </span>
                    </div>
                  )}
                </div>

                {/* Overall sentiment — the editorial synthesis paragraph */}
                <div className="mb-5">
                  <h3 className="font-['Geist',sans-serif] text-xs font-semibold uppercase tracking-wider text-black/40 mb-2">
                    Overall sentiment
                  </h3>
                  <p className="font-['Geist',sans-serif] text-sm text-black/70 leading-relaxed">
                    {provider.reviewSummaryV2.overall_sentiment}
                  </p>
                </div>

                {/* What stood out — theme chips */}
                {provider.reviewSummaryV2.what_stood_out && provider.reviewSummaryV2.what_stood_out.length > 0 && (
                  <div className="mb-5">
                    <h3 className="font-['Geist',sans-serif] text-xs font-semibold uppercase tracking-wider text-black/40 mb-2">
                      What stood out
                    </h3>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
                      {provider.reviewSummaryV2.what_stood_out.map((t, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 font-['Geist',sans-serif] text-sm text-black/60"
                        >
                          <CheckCircle className="h-4 w-4 text-[#006828] flex-shrink-0 mt-0.5" />
                          <span>
                            {t.theme}
                            {t.mention_count > 1 && (
                              <span className="text-black/30 text-xs ml-1">
                                ({t.mention_count} mentions)
                              </span>
                            )}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Partial-quote snippet cards */}
                {provider.reviewSummaryV2.snippets && provider.reviewSummaryV2.snippets.length > 0 && (
                  <div className="mb-3">
                    <h3 className="font-['Geist',sans-serif] text-xs font-semibold uppercase tracking-wider text-black/40 mb-3">
                      Recent patient voices
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {provider.reviewSummaryV2.snippets.map((s, i) => (
                        // NOTE: no microdata attrs on these cards. The JSON-LD
                        // graph emitted by generateFullProviderSchema already
                        // ships these snippets as nested Review nodes inside
                        // the MedicalBusiness (so itemReviewed is implicit).
                        // Earlier versions declared itemScope/itemType on the
                        // <article> which made Google parse it as a standalone
                        // Review requiring its own itemReviewed + Person author,
                        // failing the Rich Results Test on every provider page.
                        // The JSON-LD is the canonical signal; the card is
                        // presentational only.
                        <article
                          key={i}
                          className="bg-white rounded-xl p-4 border border-black/[0.04]"
                        >
                          <div className="flex items-center gap-0.5 mb-2">
                            {Array.from({ length: 5 }).map((_, starIdx) => (
                              <Star
                                key={starIdx}
                                className={`h-3 w-3 ${
                                  starIdx < s.rating
                                    ? "text-[#006828] fill-[#006828]"
                                    : "text-black/15"
                                }`}
                              />
                            ))}
                          </div>
                          <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed italic mb-2">
                            {s.text_fragment}
                          </p>
                          <p className="font-['Geist',sans-serif] text-xs text-black/40">
                            <span className="font-medium">
                              {s.author_display}
                            </span>
                            {s.relative_time && <span> · {s.relative_time}</span>}
                          </p>
                        </article>
                      ))}
                    </div>
                  </div>
                )}

                <p className="font-['Geist',sans-serif] text-xs text-black/30 mt-4 pt-3 border-t border-black/[0.06]">
                  Themes and patient voices synthesized from {provider.googleReviewCount?.toLocaleString() || "recent"} Google reviews, last synced{" "}
                  {provider.reviewSummaryV2.synced_at
                    ? new Date(provider.reviewSummaryV2.synced_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                    : "recently"}
                  .{" "}
                  {provider.googleMapsUri && (
                    <a
                      href={provider.googleMapsUri}
                      target="_blank"
                      rel="nofollow noopener"
                      className="text-[#006828] hover:underline"
                    >
                      Read original reviews on Google Maps →
                    </a>
                  )}
                </p>
              </div>
            ) : (
              provider.reviewSummary &&
              provider.reviewSummary.length > 0 &&
              provider.reviewSummary[0] !== "No patient reviews available yet" && (
                <div className="border border-black/[0.06] rounded-2xl p-6 mb-5 bg-[#f8f8f6]" data-section="reviews">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[#1c1c1c] flex items-center gap-2 tracking-tight">
                      <Quote className="h-5 w-5 text-[#006828]" /> What patients say
                    </h2>
                    {hasValidRating && (
                      <div className="flex items-center gap-1.5 font-['Geist',sans-serif] text-sm">
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3.5 w-3.5 ${
                                i < Math.round(Number(provider.googleRating))
                                  ? "text-[#006828] fill-[#006828]"
                                  : "text-black/15"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="font-medium text-[#1c1c1c]">{provider.googleRating}</span>
                        <span className="text-black/40">({provider.googleReviewCount?.toLocaleString()})</span>
                      </div>
                    )}
                  </div>
                  {provider.reviewSummary.length === 1 ? (
                    <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
                      {provider.reviewSummary[0]}
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {provider.reviewSummary.map((point: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2 font-['Geist',sans-serif] text-sm text-black/50">
                          <CheckCircle className="h-4 w-4 text-[#006828] flex-shrink-0 mt-0.5" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {hasValidRating && (
                    <p className="font-['Geist',sans-serif] text-xs text-black/30 mt-4 pt-3 border-t border-black/[0.06]">
                      Themes synthesized from {provider.googleReviewCount?.toLocaleString()} Google reviews.{" "}
                      {provider.googleMapsUri && (
                        <a
                          href={provider.googleMapsUri}
                          target="_blank"
                          rel="nofollow noopener"
                          className="text-[#006828] hover:underline"
                        >
                          Read original reviews on Google Maps →
                        </a>
                      )}
                    </p>
                  )}
                </div>
              )
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

            {/* Same-category providers for internal linking */}
            {sameCategoryProviders.length > 0 && (
              <div className="border border-black/[0.06] rounded-2xl p-6 mt-5">
                <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[#1c1c1c] mb-4 tracking-tight">
                  More {category.name} in {area?.name || city.name}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {sameCategoryProviders.map((sp) => (
                    <Link
                      key={sp.id}
                      href={`/directory/${sp.citySlug}/${sp.categorySlug}/${sp.slug}`}
                      className="flex items-start gap-3 p-3 rounded-xl border border-black/[0.04] hover:border-[#006828]/20 transition-colors group"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-['Bricolage_Grotesque',sans-serif] font-medium text-sm text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors truncate">{sp.name}</p>
                        {Number(sp.googleRating) > 0 && (
                          <p className="font-['Geist',sans-serif] text-xs text-black/30 mt-0.5">{sp.googleRating}/5 ★ · {sp.googleReviewCount?.toLocaleString()} reviews</p>
                        )}
                        {sp.areaSlug && (
                          <p className="font-['Geist',sans-serif] text-xs text-black/25 mt-0.5">{getAreaBySlug(city.slug, sp.areaSlug)?.name || sp.areaSlug}</p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
                {sameCategoryTotal > sameCategoryProviders.length && (
                  <Link
                    href={`/directory/${city.slug}/${category.slug}${area ? `/${area.slug}` : ""}`}
                    className="inline-flex items-center gap-1.5 font-['Geist',sans-serif] text-sm text-[#006828] hover:text-[#004d1c] mt-4 transition-colors"
                  >
                    View all {sameCategoryTotal} {category.name} in {area?.name || city.name} <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>
            )}

            {/* Best page callout — only show when at least one provider has a rating */}
            {sameCategoryProviders.some(p => Number(p.googleRating) > 0) && (
              <Link
                href={`/best/${city.slug}/${category.slug}`}
                className="flex items-center justify-between border border-[#006828]/15 bg-[#006828]/[0.03] rounded-2xl p-5 mt-5 group hover:border-[#006828]/30 transition-colors"
              >
                <div>
                  <p className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
                    See the Best {category.name} in {city.name}
                  </p>
                  <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-0.5">Curated ranking based on ratings, reviews, and verification status</p>
                </div>
                <ArrowRight className="h-5 w-5 text-[#006828] flex-shrink-0" />
              </Link>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-4">
              <ProviderSidebarCta
                providerName={provider.name}
                providerSlug={provider.slug}
                citySlug={city.slug}
                categorySlug={category.slug}
                providerId={provider.id}
                isClaimed={provider.isClaimed}
                phone={provider.phone}
                website={provider.website}
                address={provider.address}
                directionsUrl={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(provider.name + ", " + provider.address)}`}
              />

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

        {/* Sticky mobile CTA — uses the proper StickyMobileCta component
            (Item 9): scroll-reveal, analytics via trackEvent, a11y region,
            honest gating (each CTA only renders when real data exists). */}
        <StickyMobileCta
          providerName={provider.name}
          providerSlug={provider.slug}
          citySlug={city.slug}
          categorySlug={category.slug}
          providerId={provider.id}
          isClaimed={provider.isClaimed}
          phoneE164={provider.phone}
          directionsUrl={
            hasValidCoords
              ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
              : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  provider.name + ", " + provider.address,
                )}`
          }
          websiteUrl={provider.website}
          mode="provider-profile"
        />
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
            {providers.map((p) => (<ProviderCard key={p.id} name={p.name} slug={p.slug} citySlug={p.citySlug} categorySlug={p.categorySlug} address={p.address} phone={p.phone} website={p.website} shortDescription={p.shortDescription} googleRating={p.googleRating} googleReviewCount={p.googleReviewCount} isClaimed={p.isClaimed} isVerified={p.isVerified} coverImageUrl={p.coverImageUrl} />))}
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
                  coverImageUrl={p.coverImageUrl}
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
