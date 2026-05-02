import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { FaqSection } from "@/components/seo/FaqSection";
import { JsonLd } from "@/components/seo/JsonLd";
import { Pagination } from "@/components/shared/Pagination";
import {
  getCityBySlug, getCategories, getCategoryBySlug,
  getProvidersByInsurance,
} from "@/lib/data";
import {
  insuranceLandingPageSchema, speakableSchema,
  truncateTitle, truncateDescription,
} from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import {
  getInsurancePlan,
  getProvidersAcceptingInsurance,
  getSiblingInsurersForCity,
  isTriFacetEligible,
  INSURANCE_DATA_VERIFIED_AT,
} from "@/lib/insurance-facets/data";
import { safe } from "@/lib/safeData";
import { ListingsTemplate } from "@/components/directory-v2/templates/ListingsTemplate";

export const revalidate = 21600;

// SSR pagination (Item 0.5). Tri-facet grids page in-memory since the
// upstream filter (city × insurer × category) is already narrow.
const INSURANCE_CAT_PAGE_SIZE = 24;

function parsePage(searchParams?: { page?: string }): number {
  const raw = Number(searchParams?.page ?? "1");
  if (!Number.isFinite(raw) || raw < 1) return 1;
  return Math.floor(raw);
}

interface Props {
  params: { city: string; insurer: string; category: string };
  searchParams?: { page?: string };
}

// ─── Regulator helpers ────────────────────────────────────────────────────────

function getRegulatorName(citySlug: string): string {
  if (citySlug === "dubai") return "Dubai Health Authority (DHA)";
  if (citySlug === "abu-dhabi" || citySlug === "al-ain")
    return "Department of Health Abu Dhabi (DOH)";
  return "Ministry of Health and Prevention (MOHAP)";
}

function getRegulatorSlug(citySlug: string): "dha" | "doh" | "mohap" {
  if (citySlug === "dubai") return "dha";
  if (citySlug === "abu-dhabi" || citySlug === "al-ain") return "doh";
  return "mohap";
}

export const dynamicParams = true;

// ─── generateMetadata ─────────────────────────────────────────────────────────

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const city = getCityBySlug(params.city);
  if (!city) return {};
  const plan = getInsurancePlan(params.insurer);
  if (!plan) return {};
  const category = getCategoryBySlug(params.category);
  if (!category) return {};

  const { total: count } = await safe(
    getProvidersAcceptingInsurance(plan.slug, city.slug, category.slug),
    { providers: [], total: 0, page: 1, totalPages: 0 } as Awaited<ReturnType<typeof getProvidersAcceptingInsurance>>,
    "providersAcceptingInsurance-meta",
  );
  const base = getBaseUrl();
  const regulator = getRegulatorName(city.slug);
  const page = parsePage(searchParams);
  const pageSuffix = page > 1 ? `?page=${page}` : "";
  const titlePageSuffix = page > 1 ? ` | Page ${page}` : "";
  const urlBase = `${base}/directory/${city.slug}/insurance/${plan.slug}/${category.slug}`;
  const url = `${urlBase}${pageSuffix}`;
  const parentUrl = `${base}/directory/${city.slug}/insurance/${plan.slug}`;

  // Thin-content gate: the canonical eligibility check lives in
  // `isTriFacetEligible` (geo-scope + min-provider-count). Metadata
  // relies on the same function the sitemap would so behaviour is
  // identical across emission surfaces.
  const isEligible = await safe(
    isTriFacetEligible(plan.slug, city.slug, category.slug),
    false,
    "triFacetEligible-meta",
  );

  const rawTitle = `${category.name} Accepting ${plan.nameEn} Insurance in ${city.name} | ${count} ${count === 1 ? "Provider" : "Providers"}${titlePageSuffix}`;
  const rawDescription = `Find ${count} ${regulator}-licensed ${category.name.toLowerCase()} in ${city.name} that accept ${plan.nameEn} insurance. Verified listings with ratings, reviews, and contact details. Last verified ${INSURANCE_DATA_VERIFIED_AT}.`;
  const title = truncateTitle(rawTitle, 58);
  const description = truncateDescription(rawDescription, 155);

  return {
    title,
    description,
    // Self-canonical per paginated page when eligible (Item 0.5).
    alternates: { canonical: isEligible ? url : parentUrl },
    robots: isEligible
      ? undefined
      : { index: false, follow: true, nocache: false },
    openGraph: {
      title: truncateTitle(`${category.name} Accepting ${plan.nameEn} in ${city.name} — ${count} Providers${titlePageSuffix}`, 58),
      description: truncateDescription(`${count} ${regulator}-regulated ${category.name.toLowerCase()} in ${city.name} accept ${plan.nameEn}. Browse verified listings with ratings and contact details.`, 155),
      url,
      type: "website",
    },
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function InsuranceCategoryPage({ params, searchParams }: Props) {
  const city = getCityBySlug(params.city);
  if (!city) notFound();

  const plan = getInsurancePlan(params.insurer);
  if (!plan) notFound();
  // Back-compat alias used across the template below. Legacy insurer shape
  // is kept available so existing micro-copy (`insurer.type`, the short
  // `description`) stays unchanged.
  const insurer = plan.legacy ?? {
    slug: plan.slug,
    name: plan.nameEn,
    description: plan.editorialCopyEn.slice(0, 240),
    type: plan.type === "gov" ? "mandatory" : plan.type === "TPA" ? "tpa" : "private",
  } as const;

  const category = getCategoryBySlug(params.category);
  if (!category) notFound();

  // Single DB round-trip: fetch every provider in this city that
  // accepts this plan, then filter + sort in memory. The previous
  // implementation called both `getProvidersByInsurance` AND
  // `getProvidersAcceptingInsurance`, and the latter re-ran the
  // former internally.
  const all = await safe(
    getProvidersByInsurance(plan.slug, city.slug),
    [] as Awaited<ReturnType<typeof getProvidersByInsurance>>,
    "providersByInsurance-tri",
  );
  const filtered = all.filter((p) => p.categorySlug === category.slug);
  const providers = [...filtered].sort((a, b) => {
    const ratingDiff = Number(b.googleRating) - Number(a.googleRating);
    if (ratingDiff !== 0) return ratingDiff;
    return (b.googleReviewCount || 0) - (a.googleReviewCount || 0);
  });
  const count = providers.length;

  // Below-gate pages still render (200) but the metadata has already
  // emitted noindex+canonical to the 2-facet parent in generateMetadata.
  // Still 404 on an empty tuple so we don't serve a blank grid.
  if (count === 0) notFound();

  // ─── SSR pagination (Item 0.5) ─────────────────────────────────────────────
  // Tri-facet inventory is already narrow — slice in-memory per page.
  const currentPage = parsePage(searchParams);
  const totalPages = Math.max(1, Math.ceil(count / INSURANCE_CAT_PAGE_SIZE));
  if (currentPage > totalPages) notFound();
  const pageStart = (currentPage - 1) * INSURANCE_CAT_PAGE_SIZE;
  const pagedProviders = providers.slice(pageStart, pageStart + INSURANCE_CAT_PAGE_SIZE);

  const base = getBaseUrl();
  const regulator = getRegulatorName(city.slug);
  const regulatorSlug = getRegulatorSlug(city.slug);

  // ─── Quick stats ──────────────────────────────────────────────────────────────
  const ratedProviders = providers.filter((p) => Number(p.googleRating) > 0);
  const highestRated = ratedProviders.length > 0 ? ratedProviders[0] : null;

  // ─── Other categories accepting this insurer in this city (top 5) ────────────
  const categories = getCategories();
  const otherCategories = categories
    .filter((cat) => cat.slug !== category.slug)
    .map((cat) => ({
      ...cat,
      insurerCount: all.filter((p) => p.categorySlug === cat.slug).length,
    }))
    .filter((c) => c.insurerCount > 0)
    .sort((a, b) => b.insurerCount - a.insurerCount)
    .slice(0, 5);

  // ─── Sibling insurers for the same city × category ───────────────────────────
  // Strip of 4–6 alternate payers for internal linking — respects the
  // Thiqa-AD-only geographic gate via getSiblingInsurersForCity.
  const siblingInsurers = getSiblingInsurersForCity(city.slug, plan.slug, 6);

  // ─── Editorial intro (bilingual-ready) ───────────────────────────────────────
  // Composes city × specialty × insurer variables into a ~300-word block.
  // Uses the real payer-specific editorial copy when available, falling
  // back to the legacy one-line description for plans not yet hydrated.
  const payerBlurb = plan.editorialCopyEn;
  const geoCaveat =
    plan.geoScope === "abu-dhabi"
      ? ` Note: ${plan.nameEn} coverage is restricted to Abu Dhabi and Al Ain, so the providers listed on this page are physically located inside that emirate.`
      : "";
  const editorialIntroEn = `According to the UAE Open Healthcare Directory, ${count} ${regulator}-licensed ${category.name.toLowerCase()} in ${city.name} currently accept ${plan.nameEn} insurance. ${payerBlurb}${geoCaveat} Co-pay, annual benefit limits and pre-authorisation rules for ${category.name.toLowerCase()} depend on your specific ${plan.nameEn} plan tier — always confirm with the provider's insurance desk before your visit, and with ${plan.nameEn} or your employer's HR broker for plan-specific schedules. Provider licenses are sourced from the official ${regulator} register. Insurance acceptance is self-reported by providers and may change — please confirm with the clinic before your visit. Last verified ${INSURANCE_DATA_VERIFIED_AT}.`;

  // ─── Answer paragraph (kept short for the green answer-block card) ──────────
  const answerParagraph = `According to the UAE Open Healthcare Directory, there are ${count} ${category.name.toLowerCase()} in ${city.name} that accept ${plan.nameEn} insurance. Healthcare providers in ${city.name} are licensed by the ${regulator}. ${insurer.description} Last verified ${INSURANCE_DATA_VERIFIED_AT}.`;

  // ─── FAQs (6 questions — spec requires at least 6) ───────────────────────────
  const catLower = category.name.toLowerCase();
  const catSingular = catLower.replace(/s$/, "");
  const faqs = [
    {
      question: `Does ${plan.nameEn} cover ${catLower} in ${city.name}?`,
      answer: `Yes. ${plan.nameEn} insurance is accepted at ${count} ${catLower} in ${city.name}, regulated by the ${regulator}. Coverage details, co-pay rates, and pre-authorisation requirements depend on your specific ${plan.nameEn} plan tier. Contact ${plan.nameEn} directly or your employer's HR broker for plan-specific details.`,
    },
    {
      question: `How many ${catLower} accept ${plan.nameEn} in ${city.name}?`,
      answer: `According to the UAE Open Healthcare Directory, there are ${count} ${regulatorSlug.toUpperCase()}-licensed ${catLower} in ${city.name} that accept ${plan.nameEn} insurance. Provider licenses are sourced from the official ${regulator} register. Insurance acceptance is self-reported by providers and may change — please confirm with the clinic before your visit. Last verified ${INSURANCE_DATA_VERIFIED_AT}.`,
    },
    {
      question: `What is the co-pay for ${catSingular} visits on ${plan.nameEn} in ${city.name}?`,
      answer: `Co-pay for ${catSingular} visits on ${plan.nameEn} varies by plan tier. Most enhanced ${plan.nameEn} plans charge 10–20% outpatient co-pay (typically capped between AED 500 and AED 1,000 per year). Basic / mandatory tiers may charge higher co-pay and have a narrower network. Always confirm the exact rate with the ${catSingular}'s insurance desk and with your ${plan.nameEn} policy schedule before your visit.`,
    },
    {
      question: `What is the best ${catSingular} accepting ${plan.nameEn} in ${city.name}?`,
      answer: highestRated
        ? `The highest-rated ${catSingular} accepting ${plan.nameEn} in ${city.name} is ${highestRated.name} with a ${highestRated.googleRating}-star Google rating${highestRated.googleReviewCount > 0 ? ` based on ${highestRated.googleReviewCount.toLocaleString()} patient reviews` : ""}. Browse all ${count} ${catLower} on this page to compare ratings, services, and contact details.`
        : `Browse all ${count} ${catLower} accepting ${plan.nameEn} in ${city.name} on this page to compare services, locations, and contact details. All providers are ${regulator}-licensed.`,
    },
    {
      question: `Are there Arabic-speaking ${catLower} in ${city.name} that accept ${plan.nameEn}?`,
      answer: `Arabic is an official language of the UAE and most ${regulator}-licensed ${catLower} in ${city.name} offer Arabic-speaking staff or physicians on request. Use the Zavis directory language filter to browse ${catLower} that explicitly advertise Arabic-speaking clinicians, and cross-reference with the ${plan.nameEn} accepted list on this page.`,
    },
    {
      question: `How do I find a ${catSingular} near me in ${city.name} that accepts ${plan.nameEn}?`,
      answer: `Use the UAE Open Healthcare Directory to browse ${count} ${catLower} in ${city.name} that accept ${plan.nameEn}. Each listing includes the full address, phone number, operating hours, and accepted insurance plans. You can also use the search tool to filter by area or services offered.`,
    },
  ];

  // ─── Canonical URL for JSON-LD @id anchors ──────────────────────────────────
  const canonicalUrl = `${base}/directory/${city.slug}/insurance/${plan.slug}/${category.slug}`;
  const jsonLdNodes = insuranceLandingPageSchema({
    city: { name: city.name, slug: city.slug },
    category: { name: category.name, slug: category.slug },
    insurer: {
      slug: plan.slug,
      nameEn: plan.nameEn,
      nameAr: plan.nameAr,
      type: plan.type,
      geoScope: plan.geoScope,
      editorialCopyEn: plan.editorialCopyEn,
    },
    providers,
    faqs,
    breadcrumbs: [
      { name: "UAE", url: base },
      { name: city.name, url: `${base}/directory/${city.slug}` },
      { name: category.name, url: `${base}/directory/${city.slug}/${category.slug}` },
      { name: `${plan.nameEn} accepted`, url: canonicalUrl },
    ],
    url: canonicalUrl,
    language: "en",
  });

  return (
    <ListingsTemplate
      breadcrumbs={[
        { label: "UAE", href: "/" },
        { label: city.name, href: `/directory/${city.slug}` },
        { label: "Insurance", href: `/directory/${city.slug}/insurance` },
        { label: insurer.name, href: `/directory/${city.slug}/insurance/${insurer.slug}` },
        { label: category.name },
      ]}
      eyebrow={`${category.name} · ${insurer.name}`}
      title={`${category.name} Accepting ${insurer.name} in ${city.name}.`}
      subtitle={
        <>
          {count} verified {count === 1 ? "provider" : "providers"} · {regulator} licensed · Last updated {INSURANCE_DATA_VERIFIED_AT}
        </>
      }
      aeoAnswer={
        <>
          <p>{answerParagraph}</p>
          <p className="mt-3 text-z-caption">{editorialIntroEn}</p>
        </>
      }
      total={count}
      providers={pagedProviders.map((p) => ({
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
        totalPages > 1 ? (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            baseUrl={`/directory/${city.slug}/insurance/${plan.slug}/${category.slug}`}
          />
        ) : undefined
      }
      schemas={
        <>
          {jsonLdNodes.map((node, i) => (
            <JsonLd key={`ins-jsonld-${i}`} data={node} />
          ))}
          <JsonLd data={speakableSchema([".answer-block"])} />
        </>
      }
      belowGrid={
        <>
          {/* Sibling insurers */}
          {siblingInsurers.length > 0 && (
            <div>
              <h2 className="font-display font-semibold text-ink text-z-h1 mb-4">
                Other insurers covering {category.name} in {city.name}
              </h2>
              <ul className="flex flex-wrap gap-2">
                {siblingInsurers.map((s) => (
                  <li key={s.slug}>
                    <Link
                      href={`/directory/${city.slug}/insurance/${s.slug}/${category.slug}`}
                      className="inline-flex items-center rounded-z-pill bg-white border border-ink-line px-3.5 py-1.5 font-sans text-z-body-sm text-ink hover:border-ink transition-colors"
                    >
                      {s.nameEn}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Other categories accepting this insurer */}
          {otherCategories.length > 0 && (
            <div>
              <h2 className="font-display font-semibold text-ink text-z-h1 mb-4">
                Other categories accepting {insurer.name} in {city.name}
              </h2>
              <ul className="flex flex-wrap gap-2">
                {otherCategories.map((cat) => (
                  <li key={cat.slug}>
                    <Link
                      href={`/directory/${city.slug}/insurance/${insurer.slug}/${cat.slug}`}
                      className="inline-flex items-center gap-2 rounded-z-pill bg-white border border-ink-line px-3.5 py-1.5 font-sans text-z-body-sm text-ink hover:border-ink transition-colors"
                    >
                      {cat.name}
                      <span className="text-ink-muted">· {cat.insurerCount}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* FAQ */}
          <div>
            <h2 className="font-display font-semibold text-ink text-z-h1 mb-5">
              Good to know
            </h2>
            <div className="max-w-3xl">
              <FaqSection faqs={faqs} title={`${category.name} Accepting ${insurer.name} in ${city.name} — FAQ`} />
            </div>
          </div>

          {/* Disclaimer */}
          <div className="border-t border-ink-line pt-4">
            <p className="font-sans text-z-caption text-ink-muted leading-relaxed">
              <strong>Disclaimer:</strong> Provider licenses are sourced from the official {regulator} register.
              Insurance acceptance is self-reported by providers and may change — please confirm with the clinic before your visit.
              For plan-specific coverage, co-pay, and pre-authorisation queries, contact {insurer.name} directly or your employer&apos;s HR broker. Last verified {INSURANCE_DATA_VERIFIED_AT}.
            </p>
          </div>
        </>
      }
    />
  );
}
