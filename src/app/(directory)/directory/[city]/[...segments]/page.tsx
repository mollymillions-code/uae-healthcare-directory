import { Metadata } from "next";
import { unstable_noStore as noStore } from "next/cache";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { ProviderDetailTemplate } from "@/components/directory-v2/templates/ProviderDetailTemplate";
import { ListingsTemplate } from "@/components/directory-v2/templates/ListingsTemplate";
import { ProcedurePricingTemplate } from "@/components/directory-v2/templates/ProcedurePricingTemplate";
import { FaqSection } from "@/components/seo/FaqSection";
import { JsonLd } from "@/components/seo/JsonLd";
import { Pagination } from "@/components/shared/Pagination";
import {
  getCityBySlug, getCategories, getCategoryBySlug,
  getAreaBySlug,
  getSubcategoriesByCategory,
  getProviders,
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
import { getProfessionalsIndexBySpecialtyAndCity } from "@/lib/professionals";
import { isEnrichedForSitemap } from "@/lib/sitemap-gating";
import { neighborhoodHubSchema } from "@/lib/seo-neighborhoods";
import {
  breadcrumbSchema, itemListSchema,
  faqPageSchema, speakableSchema, generateFacetAnswerBlock, generateFacetFaqs,
  truncateTitle, truncateDescription,
  generateFullProviderSchema,
} from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import {
  getCategoryImageUrl, hasValidHours, formatVerifiedDate,
  resolveSegments,
} from "@/lib/directory-utils";
import { buildFaqDayLine } from "@/lib/hours-utils";
import Image from "next/image";
import {
  ArrowRight, Star,
} from "lucide-react";
import {
  PROCEDURES,
  getProcedureBySlug,
  formatAed,
  type MedicalProcedure,
} from "@/lib/constants/procedures";
import { CITIES } from "@/lib/constants/cities";
import { safe } from "@/lib/safeData";
import { getPrimaryProviderImageUrl } from "@/lib/media/provider-images";

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

function isPotentialListingRoute(citySlug: string, segments: string[]): boolean {
  const [seg1, seg2, seg3] = segments;

  if (segments.length === 2) {
    const category = getCategoryBySlug(seg1);
    if (!category) return false;
    return !getSubcategoriesByCategory(category.slug).some((sub) => sub.slug === seg2);
  }

  if (segments.length === 3) {
    return Boolean(seg3 && getAreaBySlug(citySlug, seg1) && getCategoryBySlug(seg2));
  }

  return false;
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const city = getCityBySlug(params.city);
  if (!city) return {};
  if (isPotentialListingRoute(city.slug, params.segments)) noStore();
  const resolved = await resolveSegments(city.slug, params.segments);
  if (!resolved) return {};
  if (resolved.type === "listing") noStore();
  const base = getBaseUrl();
  const page = parsePage(searchParams?.page);
  const pageSuffix = page > 1 ? `?page=${page}` : "";
  const pageTitleSuffix = page > 1 ? ` — Page ${page}` : "";

  switch (resolved.type) {
    case "city-category": {
      const { total } = await getProviders({ citySlug: city.slug, categorySlug: resolved.category.slug, limit: 1 });
      const doctorCount =
        total === 0
          ? (await getProfessionalsIndexBySpecialtyAndCity(resolved.category.slug, city.slug, { limit: 1 })).total
          : 0;
      const displayCount = total > 0 ? total : doctorCount;
      const resultLabel = total > 0 || doctorCount === 0
        ? resolved.category.name
        : `${resolved.category.name} Doctors`;
      const year = new Date().getFullYear();
      const baseCategoryUrl = `${base}/directory/${city.slug}/${resolved.category.slug}`;
      const canonicalUrl = `${baseCategoryUrl}${pageSuffix}`;
      const arCanonicalUrl = `${base}/ar/directory/${city.slug}/${resolved.category.slug}${pageSuffix}`;

      return {
        title: truncateTitle(`${displayCount} Best ${resultLabel} in ${city.name} [${year}]${pageTitleSuffix}`),
        description: truncateDescription(
          total > 0
            ? `Compare ${total} ${resolved.category.name.toLowerCase()} in ${city.name}, UAE. Ratings, reviews, insurance accepted, hours & directions. DHA/DOH/MOHAP licensed. Free directory.`
            : doctorCount > 0
            ? `Browse ${doctorCount} licensed ${resolved.category.name.toLowerCase()} doctors in ${city.name}, UAE. Facility listings for this specialty are being expanded.`
            : `No facility-level ${resolved.category.name.toLowerCase()} listings are available in ${city.name} yet. Browse all clinics in ${city.name} instead.`
        ),
        alternates: {
          canonical: canonicalUrl,
          languages: {
            'en-AE': canonicalUrl,
            'ar-AE': arCanonicalUrl,
            'x-default': canonicalUrl,
          },
        },
        openGraph: {
          title: `${resultLabel} in ${city.name}, UAE${pageTitleSuffix}`,
          description: total > 0
            ? `${total} ${resolved.category.name.toLowerCase()} in ${city.name}. Browse verified listings.`
            : doctorCount > 0
            ? `${doctorCount} licensed ${resolved.category.name.toLowerCase()} doctors in ${city.name}.`
            : `Browse clinics and healthcare providers in ${city.name}.`,
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
      const providerOgImage =
        getPrimaryProviderImageUrl(resolved.provider, { absoluteOnly: true }) ??
        getCategoryImageUrl(resolved.category.slug, base);

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
          images: [{ url: providerOgImage, width: 1200, height: 630, alt: `${resolved.provider.name} — ${resolved.category.name} in ${city.name}` }],
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
  if (isPotentialListingRoute(city.slug, params.segments)) noStore();

  const resolved = await resolveSegments(city.slug, params.segments);
  if (!resolved) notFound();
  if (resolved.type === "listing") noStore();

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
      getProfessionalsIndexBySpecialtyAndCity(category.slug, city.slug, { limit: 9 }),
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
    const doctorTotal =
      doctorCrossLinksRes.status === "fulfilled"
        ? doctorCrossLinksRes.value.total
        : 0;
    const displayedTotal = total > 0 ? total : doctorTotal;
    const displayedTotalLabel =
      total > 0
        ? `${total === 1 ? "provider" : "providers"} found`
        : doctorTotal > 0
        ? `${doctorTotal === 1 ? "doctor" : "doctors"} found`
        : "providers found";

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


    const arabicHref = `/ar/directory/${city.slug}/${category.slug}`;
    return (
      <>
        <JsonLd data={collectionPageNode} />
        <JsonLd data={breadcrumbNode} />
        <JsonLd data={itemListNode} />
        <JsonLd data={faqPageSchema(facetFaqs)} />
        <JsonLd data={speakableSchema([".answer-block"])} />

        <ListingsTemplate
          breadcrumbs={[
            { label: "UAE", href: "/" },
            { label: city.name, href: `/directory/${city.slug}` },
            { label: category.name },
          ]}
          eyebrow={`${category.name} · ${city.name}`}
          title={`${category.name} in ${city.name}.`}
          subtitle={
            <>
              {total === 0 && doctorTotal > 0 ? (
                <span>
                  {city.name} has {doctorTotal.toLocaleString()} licensed {category.name.toLowerCase()} doctors in the Zavis professional index. Facility-level clinic listings for this specialty are still being expanded, so start with the doctor results below or browse all clinics in {city.name}.
                </span>
              ) : total === 0 ? (
                <span>
                  We do not have facility-level {category.name.toLowerCase()} listings in {city.name} yet. Browse all clinics in {city.name} or search nearby specialties while this category is expanded.
                </span>
              ) : editorial?.en ? (
                <span>{editorial.en}</span>
              ) : (
                <>
                  <span>
                    Compare {total} {category.name.toLowerCase()} in {city.name}, UAE — regulated by {regulator}. Every listing is cross-referenced against official government registers.
                  </span>
                </>
              )}
            </>
          }
          aeoAnswer={
            total === 0 && doctorTotal > 0 ? (
              <>
                According to the UAE Open Healthcare Directory, there are{" "}
                <span className="font-semibold text-ink">{doctorTotal.toLocaleString()} licensed {category.name.toLowerCase()} doctors</span>{" "}
                associated with {city.name}. Facility-level clinic listings for this exact specialty are still being expanded; browse the doctors below or view all clinics in {city.name}.
              </>
            ) : total === 0 ? (
              <>
                There are currently no facility-level {category.name.toLowerCase()} listings in {city.name}. Browse all clinics in {city.name} or use search to find related providers nearby.
              </>
            ) : (
              generateFacetAnswerBlock(city, category, null, total, providers[0])
            )
          }
          total={displayedTotal}
          totalLabel={displayedTotalLabel}
          providers={providers.map((p) => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
            citySlug: p.citySlug,
            categorySlug: p.categorySlug,
            categoryName: category.name,
            address: p.address,
            googleRating: p.googleRating,
            googleReviewCount: p.googleReviewCount,
            isClaimed: p.isClaimed,
            isVerified: p.isVerified,
            photos: p.photos ?? null,
            coverImageUrl: p.coverImageUrl ?? null,
          }))}
          emptyState={
            total === 0 && doctorTotal > 0 ? (
              <div className="rounded-z-lg border border-ink-line bg-white p-6 sm:p-8">
                <div className="max-w-3xl">
                  <p className="font-display text-z-h1 font-semibold text-ink">
                    Browse doctors for this specialty.
                  </p>
                  <p className="mt-2 font-sans text-z-body text-ink-soft leading-relaxed">
                    We do not have facility cards tagged directly as {category.name.toLowerCase()} in {city.name} yet, but the professional index has {doctorTotal.toLocaleString()} matching doctors.
                  </p>
                </div>
                <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {doctorCrossLinks.slice(0, 9).map((d) => (
                    <Link
                      key={d.slug}
                      href={`/find-a-doctor/${d.specialtySlug || category.slug}/${d.slug}`}
                      className="rounded-z-md border border-ink-line px-4 py-3 font-sans text-z-body-sm font-semibold text-ink transition-colors hover:border-ink hover:bg-surface-cream"
                    >
                      {d.name}
                      <span className="mt-1 block text-z-caption font-normal text-ink-muted">
                        {d.displayTitle}
                      </span>
                    </Link>
                  ))}
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href={`/find-a-doctor/${category.slug}`}
                    className="inline-flex items-center rounded-z-pill bg-accent text-white px-4 py-2.5 font-sans text-z-body-sm font-semibold hover:bg-accent-dark"
                  >
                    See all doctors
                  </Link>
                  <Link
                    href={`/directory/${city.slug}/clinics`}
                    className="inline-flex items-center rounded-z-pill border border-ink text-ink px-4 py-2.5 font-sans text-z-body-sm font-semibold hover:bg-surface-cream"
                  >
                    Browse clinics in {city.name}
                  </Link>
                </div>
              </div>
            ) : total === 0 ? (
              <div className="rounded-z-lg border border-ink-line bg-white p-6 sm:p-8">
                <div className="max-w-3xl">
                  <p className="font-display text-z-h1 font-semibold text-ink">
                    No exact listings in this category yet.
                  </p>
                  <p className="mt-2 font-sans text-z-body text-ink-soft leading-relaxed">
                    We do not have facility cards tagged directly as {category.name.toLowerCase()} in {city.name}. Continue with all clinics in {city.name}, or search this specialty across the directory.
                  </p>
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href={`/directory/${city.slug}/clinics`}
                    className="inline-flex items-center rounded-z-pill bg-accent text-white px-4 py-2.5 font-sans text-z-body-sm font-semibold hover:bg-accent-dark"
                  >
                    Browse clinics in {city.name}
                  </Link>
                  <Link
                    href={`/search?city=${city.slug}&specialty=${category.slug}`}
                    className="inline-flex items-center rounded-z-pill border border-ink text-ink px-4 py-2.5 font-sans text-z-body-sm font-semibold hover:bg-surface-cream"
                  >
                    Search this specialty
                  </Link>
                </div>
              </div>
            ) : undefined
          }
          pagination={
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(total / LIST_PAGE_SIZE)}
              baseUrl={`/directory/${city.slug}/${category.slug}`}
            />
          }
          arabicHref={arabicHref}
          belowGrid={
            <>
              {/* Neighborhoods */}
              {topNeighborhoods.length > 0 && (
                <div>
                  <h2 className="font-display font-semibold text-ink text-z-h1 mb-4">
                    {category.name} by neighborhood in {city.name}
                  </h2>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-2 border-t border-ink-line pt-4">
                    {topNeighborhoods.map((n) => (
                      <li key={n.slug}>
                        <Link
                          href={`/directory/${city.slug}/${n.slug}/${category.slug}`}
                          className="flex items-center justify-between py-2.5 group"
                        >
                          <span className="font-sans text-z-body text-ink group-hover:underline decoration-1 underline-offset-2">
                            {category.name} in {n.name}
                          </span>
                          {n.providerCountCached ? (
                            <span className="font-sans text-z-caption text-ink-muted">
                              {n.providerCountCached} {n.providerCountCached === 1 ? "provider" : "providers"}
                            </span>
                          ) : null}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Insurance pivot */}
              {insurerPivots.length > 0 && (
                <div>
                  <h2 className="font-display font-semibold text-ink text-z-h1 mb-4">
                    {category.name} in {city.name} by insurance
                  </h2>
                  <ul className="flex flex-wrap gap-2">
                    {insurerPivots.map((ins) => (
                      <li key={ins.slug}>
                        <Link
                          href={`/directory/${city.slug}/insurance/${ins.slug}/${category.slug}`}
                          className="inline-flex items-center rounded-z-pill bg-white border border-ink-line px-3.5 py-1.5 font-sans text-z-body-sm text-ink hover:border-ink transition-colors"
                        >
                          Accepts {ins.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Language pivot */}
              {languagePivots.length > 0 && (
                <div>
                  <h2 className="font-display font-semibold text-ink text-z-h1 mb-4">
                    {category.name} in {city.name} by language spoken
                  </h2>
                  <ul className="flex flex-wrap gap-2">
                    {languagePivots.map((l) => (
                      <li key={l.slug}>
                        <Link
                          href={`/directory/${city.slug}/language/${l.slug}/${category.slug}`}
                          className="inline-flex items-center rounded-z-pill bg-white border border-ink-line px-3.5 py-1.5 font-sans text-z-body-sm text-ink hover:border-ink transition-colors"
                        >
                          {l.name}-speaking
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Related specialties */}
              {relatedCategories.length > 0 && (
                <div>
                  <h2 className="font-display font-semibold text-ink text-z-h1 mb-4">
                    Related specialties in {city.name}
                  </h2>
                  <ul className="flex flex-wrap gap-2">
                    {relatedCategories.map((rc) => (
                      <li key={rc.slug}>
                        <Link
                          href={`/directory/${city.slug}/${rc.slug}`}
                          className="inline-flex items-center rounded-z-pill bg-white border border-ink-line px-3.5 py-1.5 font-sans text-z-body-sm text-ink hover:border-ink transition-colors"
                        >
                          {rc.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Doctor cross-links */}
              {doctorCrossLinks.length > 0 && (
                <div>
                  <h2 className="font-display font-semibold text-ink text-z-h1 mb-4">
                    Top {category.name.toLowerCase()} doctors in {city.name}
                  </h2>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3 border-t border-ink-line pt-4">
                    {doctorCrossLinks.slice(0, 9).map((d) => (
                      <li key={d.slug}>
                        <Link
                          href={`/find-a-doctor/${d.specialtySlug || category.slug}/${d.slug}`}
                          className="font-sans text-z-body text-ink hover:underline decoration-1 underline-offset-2"
                        >
                          {d.name}
                          {d.primaryCitySlug ? <span className="text-ink-muted"> · {d.primaryCitySlug}</span> : null}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* FAQ */}
              {facetFaqs.length > 0 && (
                <div>
                  <h2 className="font-display font-semibold text-ink text-z-h1 mb-5">
                    Good to know about {category.name.toLowerCase()} in {city.name}
                  </h2>
                  <div className="max-w-3xl">
                    <FaqSection faqs={facetFaqs} />
                  </div>
                </div>
              )}
            </>
          }
        />
      </>
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
      <>
        {neighborhoodNodes.map((node, i) => (
          <JsonLd key={`neighborhood-schema-${i}`} data={node} />
        ))}
        <JsonLd data={speakableSchema([".answer-block"])} />
        <JsonLd data={faqPageSchema(areaFaqs)} />

        <ListingsTemplate
          breadcrumbs={[
            { label: "UAE", href: "/" },
            { label: city.name, href: `/directory/${city.slug}` },
            { label: area.name },
          ]}
          eyebrow={`Neighborhood · ${city.name}`}
          title={`Healthcare in ${area.name}, ${city.name}.`}
          subtitle={
            <span>
              {total} {total === 1 ? "provider" : "providers"} across multiple specialties in {area.name}. Browse by specialty below or view all providers in {city.name}.
            </span>
          }
          aeoAnswer={
            <>
              According to the UAE Open Healthcare Directory, {area.name} in {city.name} has{" "}
              <span className="font-semibold text-ink">{total} healthcare {total === 1 ? "provider" : "providers"}</span>. Data sourced from official UAE health authority registers.
            </>
          }
          total={total}
          providers={providers.map((p) => {
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
          belowGrid={
            <>
              <div>
                <h2 className="font-display font-semibold text-ink text-z-h1 mb-4">
                  Specialties in {area.name}
                </h2>
                <ul className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <li key={cat.slug}>
                      <Link
                        href={`/directory/${city.slug}/${area.slug}/${cat.slug}`}
                        className="inline-flex items-center rounded-z-pill bg-white border border-ink-line px-3.5 py-1.5 font-sans text-z-body-sm text-ink hover:border-ink transition-colors"
                      >
                        {cat.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {areaFaqs.length > 0 && (
                <div>
                  <h2 className="font-display font-semibold text-ink text-z-h1 mb-5">
                    About healthcare in {area.name}
                  </h2>
                  <div className="max-w-3xl">
                    <FaqSection faqs={areaFaqs} />
                  </div>
                </div>
              )}
            </>
          }
        />
      </>
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
      <>
        <JsonLd data={breadcrumbSchema([{ name: "UAE", url: base }, { name: city.name, url: `${base}/directory/${city.slug}` }, { name: area.name, url: `${base}/directory/${city.slug}/${area.slug}` }, { name: category.name }])} />
        <JsonLd data={itemListSchema(`${category.name} in ${area.name}, ${city.name}`, providers, city.name, base)} />
        <JsonLd data={faqPageSchema(facetFaqs)} />
        <JsonLd data={speakableSchema([".answer-block"])} />

        <ListingsTemplate
          breadcrumbs={[
            { label: "UAE", href: "/" },
            { label: city.name, href: `/directory/${city.slug}` },
            { label: area.name, href: `/directory/${city.slug}/${area.slug}` },
            { label: category.name },
          ]}
          eyebrow={`${category.name} · ${area.name}`}
          title={`${category.name} in ${area.name}, ${city.name}.`}
          subtitle={
            <span>
              {total > 0 ? `${total} verified ${total === 1 ? "provider" : "providers"} · ${category.name} in ${area.name}, ${city.name}` : `No ${category.name.toLowerCase()} listed in ${area.name} yet — browse the city-wide category instead.`}
            </span>
          }
          aeoAnswer={
            total > 0 && topProvider
              ? generateFacetAnswerBlock(city, category, area, total, topProvider)
              : `There are currently no registered ${category.name.toLowerCase()} providers in ${area.name}, ${city.name}. Browse all ${category.name.toLowerCase()} across ${city.name} instead.`
          }
          total={total}
          providers={providers.map((p) => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
            citySlug: p.citySlug,
            categorySlug: p.categorySlug,
            categoryName: category.name,
            address: p.address,
            googleRating: p.googleRating,
            googleReviewCount: p.googleReviewCount,
            isClaimed: p.isClaimed,
            isVerified: p.isVerified,
            photos: p.photos ?? null,
            coverImageUrl: p.coverImageUrl ?? null,
          }))}
          belowGrid={
            <>
              {providers.length === 0 && (
                <div className="rounded-z-md border border-ink-line bg-white p-6">
                  <p className="font-sans text-z-body text-ink-soft">
                    Looking for {category.name.toLowerCase()} in {area.name}?{" "}
                    <Link href={`/directory/${city.slug}/${category.slug}`} className="font-semibold text-ink underline underline-offset-2">
                      View all {category.name.toLowerCase()} in {city.name} →
                    </Link>
                  </p>
                </div>
              )}
              {facetFaqs.length > 0 && (
                <div>
                  <h2 className="font-display font-semibold text-ink text-z-h1 mb-5">
                    About {category.name.toLowerCase()} in {area.name}
                  </h2>
                  <div className="max-w-3xl">
                    <FaqSection faqs={facetFaqs} />
                  </div>
                </div>
              )}
            </>
          }
        />
      </>
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
      <>
        {providerSchemaNodes.map((node, i) => (
          <JsonLd key={`provider-schema-${i}`} data={node} />
        ))}
        <JsonLd data={speakableSchema([".answer-block"])} />

        <ProviderDetailTemplate
          provider={{
            id: provider.id,
            name: provider.name,
            slug: provider.slug,
            citySlug: provider.citySlug,
            categorySlug: provider.categorySlug,
            subcategorySlug: provider.subcategorySlug,
            areaSlug: provider.areaSlug,
            address: provider.address,
            phone: provider.phone,
            whatsapp: (provider as unknown as { whatsapp?: string }).whatsapp,
            email: provider.email,
            website: provider.website,
            googleMapsUri: (provider as unknown as { googleMapsUri?: string }).googleMapsUri,
            description: provider.description,
            shortDescription: provider.shortDescription,
            googleRating: provider.googleRating,
            googleReviewCount: provider.googleReviewCount,
            licenseNumber: provider.licenseNumber,
            yearEstablished: provider.yearEstablished,
            isClaimed: provider.isClaimed,
            isVerified: provider.isVerified,
            facilityType: provider.facilityType,
            languages: provider.languages,
            insurance: provider.insurance,
            services: provider.services,
            amenities: provider.amenities,
            photos: provider.photos ?? [],
            coverImageUrl: provider.coverImageUrl,
            galleryPhotos: provider.galleryPhotos,
            reviewSummary: provider.reviewSummary,
            reviewSummaryV2: provider.reviewSummaryV2
              ? {
                  overall_sentiment: provider.reviewSummaryV2.overall_sentiment,
                  what_stood_out: provider.reviewSummaryV2.what_stood_out ?? [],
                  snippets: provider.reviewSummaryV2.snippets ?? [],
                  google_maps_url: provider.reviewSummaryV2.google_maps_url,
                }
              : null,
            operatingHours: provider.operatingHours,
            accessibilityOptions: provider.accessibilityOptions,
            latitude: provider.latitude,
            longitude: provider.longitude,
          }}
          categoryName={category.name}
          cityName={city.name}
          areaName={area?.name ?? null}
          breadcrumbs={[
            { label: "UAE", href: "/" },
            { label: city.name, href: `/directory/${city.slug}` },
            { label: category.name, href: `/directory/${city.slug}/${category.slug}` },
            { label: provider.name },
          ]}
          aeoAnswer={answerBlock}
          faqs={providerFaqs}
          arabicHref={`/ar/directory/${city.slug}/${category.slug}/${provider.slug}`}
          relatedSection={
            sameCategoryProviders.length > 0 ? (
              <section className="pt-4 pb-8 border-t border-ink-line z-anchor" id="related">
                <h2 className="font-display font-semibold text-ink text-z-h1 mb-5">
                  Other {category.name.toLowerCase()} in {city.name}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-8">
                  {sameCategoryProviders.map((rp) => {
                    const rating = Number(rp.googleRating) || 0;
                    return (
                      <Link
                        key={rp.id}
                        href={`/directory/${rp.citySlug}/${rp.categorySlug}/${rp.slug}`}
                        className="group flex items-start gap-4"
                      >
                        {rp.coverImageUrl ? (
                          <div className="relative h-24 w-28 flex-shrink-0 rounded-z-md overflow-hidden bg-ink-line">
                            <Image
                              src={rp.coverImageUrl}
                              alt={rp.name}
                              fill
                              sizes="112px"
                              className="object-cover group-hover:scale-[1.04] transition-transform duration-z-med"
                            />
                          </div>
                        ) : null}
                        <div className="flex-1 min-w-0">
                          <p className="font-sans font-semibold text-ink text-z-body line-clamp-1 group-hover:underline decoration-1 underline-offset-2">
                            {rp.name}
                          </p>
                          {rating > 0 && (
                            <p className="font-sans text-z-caption text-ink-soft mt-1 inline-flex items-center gap-1">
                              <Star className="h-3 w-3 fill-ink text-ink" />
                              {rating.toFixed(2)}
                              {rp.googleReviewCount
                                ? <span className="text-ink-muted"> ({rp.googleReviewCount})</span>
                                : null}
                            </p>
                          )}
                          {rp.address && (
                            <p className="font-sans text-z-caption text-ink-muted mt-0.5 line-clamp-1">
                              {rp.address}
                            </p>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
                {sameCategoryTotal > sameCategoryProviders.length && (
                  <Link
                    href={`/directory/${city.slug}/${category.slug}`}
                    className="mt-6 inline-flex items-center gap-1.5 font-sans text-z-body-sm font-semibold text-ink underline decoration-1 underline-offset-2"
                  >
                    See all {sameCategoryTotal + 1} {category.name.toLowerCase()} in {city.name}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                )}
              </section>
            ) : null
          }
        />
      </>
    );
  }

  // --- Subcategory page ---
  if (resolved.type === "city-category-subcategory") {
    const { category, subcategory } = resolved;
    const { providers, total, totalPages } = await getProviders({ citySlug: city.slug, categorySlug: category.slug, subcategorySlug: subcategory.slug, page: 1, limit: 20, sort: "rating" });

    return (
      <ListingsTemplate
        breadcrumbs={[
          { label: "UAE", href: "/" },
          { label: city.name, href: `/directory/${city.slug}` },
          { label: category.name, href: `/directory/${city.slug}/${category.slug}` },
          { label: subcategory.name },
        ]}
        eyebrow={`${subcategory.name} · ${category.name}`}
        title={`${subcategory.name} in ${city.name}.`}
        subtitle={`${total} ${total === 1 ? "provider" : "providers"} — a refined view of ${category.name.toLowerCase()} offering ${subcategory.name.toLowerCase()} in ${city.name}.`}
        total={total}
        providers={providers.map((p) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          citySlug: p.citySlug,
          categorySlug: p.categorySlug,
          categoryName: category.name,
          address: p.address,
          googleRating: p.googleRating,
          googleReviewCount: p.googleReviewCount,
          isClaimed: p.isClaimed,
          isVerified: p.isVerified,
          photos: p.photos ?? null,
          coverImageUrl: p.coverImageUrl ?? null,
        }))}
        pagination={
          <Pagination
            currentPage={1}
            totalPages={totalPages}
            baseUrl={`/directory/${city.slug}/${category.slug}/${subcategory.slug}`}
          />
        }
      />
    );
  }

  // --- City + Service/Procedure Page ---
  if (resolved.type === "city-service") {
    const proc = resolved.procedure;
    const pricing = proc.cityPricing[city.slug];
    const regulator = city.slug === "dubai" ? "Dubai Health Authority (DHA)" : (city.slug === "abu-dhabi" || city.slug === "al-ain") ? "Department of Health Abu Dhabi (DOH)" : "Ministry of Health and Prevention (MOHAP)";
    const regulatorShort = city.slug === "dubai" ? "DHA" : (city.slug === "abu-dhabi" || city.slug === "al-ain") ? "DOH" : "MOHAP";

    // Providers in this category (wrapped in safe())
    type ProvidersResp = Awaited<ReturnType<typeof getProviders>>;
    const providerResp = await safe<ProvidersResp>(
      getProviders({
        citySlug: city.slug,
        categorySlug: proc.categorySlug,
        limit: 12,
        sort: "rating",
      }),
      { providers: [] as ProvidersResp["providers"], total: 0, page: 1, totalPages: 1 } as ProvidersResp,
      "cityServiceProviders"
    );
    const providers = providerResp.providers;
    const providerCount = providerResp.total;

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

    const categoryName = (getCategoryBySlug(proc.categorySlug)?.name) ?? proc.categorySlug.replace(/-/g, " ");
    const categoryNameLower = categoryName.toLowerCase();

    const aeoAnswer = (
      <>
        Looking for {proc.name.toLowerCase()} in {city.name}? The UAE Open Healthcare Directory lists {providerCount}{" "}
        {categoryNameLower} providers in {city.name} who may offer this procedure.
        {pricing && (
          <>
            {" "}The typical cost is {formatAed(pricing.typical)} (range: {formatAed(pricing.min)}–{formatAed(pricing.max)}).
          </>
        )}
        {" "}Providers below are ranked by patient ratings. All facilities are licensed by the {regulator}. {proc.description}
      </>
    );

    const subtitle = (
      <>
        {providerCount} providers &middot; {proc.duration} &middot; {coverageLabel} by insurance
        {pricing && <> &middot; Typical cost: {formatAed(pricing.typical)}</>} &middot; Updated March 2026
      </>
    );

    return (
      <ProcedurePricingTemplate
        schemas={
          <>
            <JsonLd data={breadcrumbSchema([{ name: "UAE", url: base }, { name: city.name, url: `${base}/directory/${city.slug}` }, { name: proc.name }])} />
            <JsonLd data={faqPageSchema(serviceFaqs)} />
            <JsonLd data={speakableSchema([".answer-block"])} />
          </>
        }
        breadcrumbs={[
          { label: "UAE", href: "/" },
          { label: city.name, href: `/directory/${city.slug}` },
          { label: proc.name },
        ]}
        eyebrow={`${regulatorShort} Verified · ${city.name}`}
        title={`${proc.name} in ${city.name}`}
        subtitle={subtitle}
        aeoAnswer={aeoAnswer}
        cityName={city.name}
        regulatorShort={regulatorShort}
        regulatorFull={regulator}
        procedureName={proc.name}
        categorySlug={proc.categorySlug}
        categoryName={categoryName}
        duration={proc.duration}
        recoveryTime={proc.recoveryTime}
        anaesthesia={proc.anaesthesia}
        coverageLabel={coverageLabel}
        coverageNotes={proc.insuranceNotes}
        pricing={pricing ?? null}
        cityComparison={cityComparisons.map((c) => ({
          slug: c.slug,
          name: c.name,
          min: c.min,
          max: c.max,
          typical: c.typical,
          isCurrent: c.isCurrent,
          href: `/directory/${c.slug}/${proc.slug}`,
        }))}
        providers={providers.slice(0, 12).map((p) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          citySlug: p.citySlug,
          categorySlug: p.categorySlug,
          categoryName: categoryName,
          address: p.address ?? null,
          googleRating: p.googleRating,
          googleReviewCount: p.googleReviewCount,
          isClaimed: p.isClaimed,
          isVerified: p.isVerified,
          photos: (p as { photos?: string[] | null }).photos ?? [],
          coverImageUrl: p.coverImageUrl ?? null,
        }))}
        providerTotal={providerCount}
        viewAllProvidersHref={`/directory/${city.slug}/${proc.categorySlug}`}
        relatedProcedures={relatedProcs.map((rp) => {
          const rpPricing = rp.cityPricing[city.slug];
          return {
            slug: rp.slug,
            name: rp.name,
            href: `/directory/${city.slug}/${rp.slug}`,
            duration: rp.duration,
            typicalPrice: rpPricing ? formatAed(rpPricing.typical) : null,
          };
        })}
        sameCategoryProcedures={sameCategoryProcs.map((sp) => ({
          slug: sp.slug,
          name: sp.name,
          href: `/directory/${city.slug}/${sp.slug}`,
        }))}
        whatToExpect={proc.whatToExpect}
        crossLinks={[
          ...(pricing ? [{ label: "Detailed pricing breakdown", href: `/pricing/${proc.slug}/${city.slug}` }] : []),
          { label: `All ${categoryNameLower} in ${city.name}`, href: `/directory/${city.slug}/${proc.categorySlug}` },
          { label: `Best ${categoryNameLower} in ${city.name}`, href: `/best/${city.slug}/${proc.categorySlug}` },
        ]}
        faqs={serviceFaqs}
        formatAed={formatAed}
        lastVerified="March 2026"
        arabicHref={`/ar/directory/${city.slug}/${proc.slug}`}
      />
    );
  }

  notFound();
}
