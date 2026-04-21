import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { FaqSection } from "@/components/seo/FaqSection";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  getCityBySlug, getCities, getCategoryBySlug,
  getConditions, getProviders,
  getProviderCountByCategoryAndCity,
} from "@/lib/data";
import type { LocalProvider } from "@/lib/data";
import { speakableSchema, truncateTitle, truncateDescription } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { evaluateCombo, normalizeCombo } from "@/lib/seo/facet-rules";
import {
  getConditionDetail,
  type ConditionSpecialtyDetail,
} from "@/lib/constants/condition-specialty-map";
import {
  generateConditionPageSchema,
  generateConditionFaqs,
} from "@/lib/seo-conditions";
import { getProfessionalsIndexBySpecialty } from "@/lib/professionals";
import { safe } from "@/lib/safeData";
import { ListingsTemplate } from "@/components/directory-v2/templates/ListingsTemplate";

export const revalidate = 21600;

interface Props {
  params: { city: string; condition: string };
}

export async function generateStaticParams() {
  const cities = getCities();
  const conditions = getConditions();
  const params: { city: string; condition: string }[] = [];

  for (const city of cities) {
    for (const cond of conditions) {
      const detail = getConditionDetail(cond.slug);
      const specialties = detail?.specialties ?? cond.relatedCategories ?? [];
      const counts = await Promise.all(
        specialties.map((catSlug: string) =>
          getProviderCountByCategoryAndCity(catSlug, city.slug)
        )
      );
      const hasProviders = counts.some((c) => c > 0);
      if (hasProviders) {
        params.push({ city: city.slug, condition: cond.slug });
      }
    }
  }

  return params;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const city = getCityBySlug(params.city);
  if (!city) return {};
  const condition = getConditions().find((c) => c.slug === params.condition);
  if (!condition) return {};
  const base = getBaseUrl();
  const canonical = `${base}/directory/${city.slug}/condition/${condition.slug}`;

  // Facet-rules check: use Item 8's evaluateCombo for the city+condition combo.
  const decision = await evaluateCombo(
    normalizeCombo(["city", "condition"]),
    { city: city.slug, condition: condition.slug },
    base,
  );
  const noindex = decision.noindex === true;

  // Only advertise the ar-AE hreflang when the Arabic mirror actually
  // exists. The AR condition route `notFound()`s for conditions without
  // a hand-authored `introAr`, so emitting the alternate without this
  // check would point at a 404 and break hreflang round-trip.
  const hasArabic = Boolean(getConditionDetail(condition.slug)?.introAr);
  const languages: Record<string, string> = {
    "en-AE": canonical,
    "x-default": canonical,
  };
  if (hasArabic) {
    languages["ar-AE"] = `${base}/ar/directory/${city.slug}/condition/${condition.slug}`;
  }

  return {
    title: truncateTitle(`${condition.name} Treatment in ${city.name} — Specialists & Clinics`),
    description: truncateDescription(
      `Find specialists and clinics for ${condition.name.toLowerCase()} treatment in ${city.name}, UAE. ${condition.description} Browse verified providers, insurance coverage and FAQs.`,
    ),
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
    alternates: {
      canonical: noindex && decision.canonicalTarget ? decision.canonicalTarget : canonical,
      languages,
    },
    openGraph: {
      title: `${condition.name} Treatment in ${city.name}`,
      description: `Find specialists for ${condition.name.toLowerCase()} treatment in ${city.name}.`,
      type: "article",
      locale: "en_AE",
      siteName: "UAE Open Healthcare Directory",
      url: canonical,
    },
  };
}

/** Gather providers from all mapped specialties, deduplicated by ID + sorted by rating. */
async function getProvidersForCondition(
  citySlug: string,
  specialties: string[],
): Promise<LocalProvider[]> {
  const seen = new Set<string>();
  const result: LocalProvider[] = [];
  for (const catSlug of specialties) {
    const { providers } = await safe(
      getProviders({
        citySlug,
        categorySlug: catSlug,
        limit: 30,
        sort: "rating",
      }),
      { providers: [], total: 0, page: 1, totalPages: 1 } as Awaited<ReturnType<typeof getProviders>>,
      `condition-providers:${catSlug}`,
    );
    for (const p of providers) {
      if (!seen.has(p.id)) {
        seen.add(p.id);
        result.push(p);
      }
    }
  }
  result.sort((a, b) => {
    const rd = Number(b.googleRating) - Number(a.googleRating);
    if (rd !== 0) return rd;
    return (b.googleReviewCount || 0) - (a.googleReviewCount || 0);
  });
  return result;
}

export default async function ConditionPage({ params }: Props) {
  const city = getCityBySlug(params.city);
  if (!city) notFound();

  const legacyCondition = getConditions().find((c) => c.slug === params.condition);
  if (!legacyCondition) notFound();

  // Prefer the rich CONDITION_SPECIALTY_MAP entry when available; fall back
  // to a synthetic detail derived from the legacy constants so every
  // condition page renders, even those we haven't hand-authored yet.
  //
  // IMPORTANT: the synthetic fallback must NOT emit an English string as
  // `introAr`. Previously the fallback set `introAr: legacyCondition.description`
  // which served English text inside the `<div dir="rtl" lang="ar">` block on
  // the Arabic mirror — a hard E-E-A-T fail. Leaving `introAr` undefined here
  // lets downstream render paths hide the AR block entirely.
  const handAuthoredDetail = getConditionDetail(params.condition);
  const detail: ConditionSpecialtyDetail =
    handAuthoredDetail ?? {
      slug: legacyCondition.slug,
      name: legacyCondition.name,
      specialties: legacyCondition.relatedCategories ?? [],
      introEn: legacyCondition.description,
      // No introAr — the synthetic fallback is English-only.
    };
  const isHandAuthored = Boolean(handAuthoredDetail);

  const providers = await getProvidersForCondition(city.slug, detail.specialties);
  const count = providers.length;
  if (count === 0) notFound();

  // Thin-content gate (Zocdoc roadmap P0 #11): if this condition is NOT
  // hand-authored AND has fewer than 10 matched providers across all
  // mapped specialties in the city, the page body is too thin to justify
  // indexing.
  if (!isHandAuthored && count < 10) notFound();

  const base = getBaseUrl();
  const canonicalUrl = `${base}/directory/${city.slug}/condition/${detail.slug}`;

  // Resolve related category names for display
  const relatedCats = detail.specialties
    .map((slug) => getCategoryBySlug(slug))
    .filter(Boolean) as { slug: string; name: string }[];

  // Doctor cross-links — pull up to 4 doctors from each of the first 2 mapped specialties.
  const doctorCrossLinks: Awaited<ReturnType<typeof getProfessionalsIndexBySpecialty>>["professionals"] = [];
  for (const spec of detail.specialties.slice(0, 2)) {
    const { professionals } = await safe(
      getProfessionalsIndexBySpecialty(spec, { limit: 4 }),
      { professionals: [], total: 0 } as Awaited<ReturnType<typeof getProfessionalsIndexBySpecialty>>,
      `doctorXlinks:${spec}`,
    );
    doctorCrossLinks.push(...professionals);
  }

  const faqs = generateConditionFaqs(detail, city, count);

  const breadcrumbs = [
    { name: "UAE", url: base },
    { name: city.name, url: `${base}/directory/${city.slug}` },
    { name: "Conditions", url: `${base}/directory/${city.slug}/condition` },
    { name: detail.name },
  ];

  const schemaNodes = generateConditionPageSchema({
    detail,
    city,
    providers,
    faqs,
    breadcrumbs,
    canonicalUrl,
    locale: "en-AE",
  });

  const displayProviders = providers.slice(0, 18);

  return (
    <ListingsTemplate
      breadcrumbs={[
        { label: "UAE", href: "/" },
        { label: city.name, href: `/directory/${city.slug}` },
        { label: "Conditions", href: `/directory/${city.slug}/condition` },
        { label: detail.name },
      ]}
      eyebrow={`Condition · ${city.name}`}
      title={`${detail.name} Treatment in ${city.name}.`}
      subtitle={
        <>
          {count} verified {count === 1 ? "provider" : "providers"} · Last updated March 2026
        </>
      }
      aeoAnswer={
        <>
          <p>{detail.introEn}</p>
          {detail.introAr && (
            <p dir="rtl" lang="ar" className="mt-3">{detail.introAr}</p>
          )}
        </>
      }
      total={count}
      providers={displayProviders.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        citySlug: p.citySlug,
        categorySlug: p.categorySlug,
        categoryName: null,
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
          {schemaNodes.map((node, idx) => (
            <JsonLd key={idx} data={node} />
          ))}
          <JsonLd data={speakableSchema([".answer-block"])} />
        </>
      }
      belowGrid={
        <>
          {/* Symptoms + urgent signs */}
          {(detail.symptomsEn?.length || detail.urgentSignsEn?.length) ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {detail.symptomsEn && detail.symptomsEn.length > 0 && (
                <div className="bg-white rounded-z-md border border-ink-line p-5">
                  <h2 className="font-display font-semibold text-ink text-z-h3 mb-3">
                    Common symptoms
                  </h2>
                  <ul className="space-y-1.5">
                    {detail.symptomsEn.map((s, idx) => (
                      <li key={idx} className="font-sans text-z-body-sm text-ink-soft leading-relaxed">
                        &middot; {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {detail.urgentSignsEn && detail.urgentSignsEn.length > 0 && (
                <div className="bg-amber-50 rounded-z-md border border-amber-400/30 p-5" role="alert">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="h-4 w-4 text-amber-700" aria-hidden="true" />
                    <h2 className="font-display font-semibold text-amber-900 text-z-h3">
                      When to seek urgent care
                    </h2>
                  </div>
                  <ul className="space-y-1.5">
                    {detail.urgentSignsEn.map((s, idx) => (
                      <li key={idx} className="font-sans text-z-body-sm text-amber-800 leading-relaxed">
                        &middot; {s}
                      </li>
                    ))}
                  </ul>
                  <p className="font-sans text-z-caption text-amber-700 mt-3">
                    If you experience any of the above, go directly to the nearest {city.name} emergency department, or call 999. UAE-licensed emergency rooms triage life-threatening symptoms regardless of insurance status.
                  </p>
                </div>
              )}
            </div>
          ) : null}

          {/* Specialties that treat this condition */}
          {relatedCats.length > 0 && (
            <div>
              <h2 className="font-display font-semibold text-ink text-z-h1 mb-4">
                Specialties that treat {detail.name.toLowerCase()}
              </h2>
              <ul className="flex flex-wrap gap-2">
                {relatedCats.map((cat) => (
                  <li key={cat.slug}>
                    <Link
                      href={`/directory/${city.slug}/${cat.slug}`}
                      className="inline-flex items-center rounded-z-pill bg-white border border-ink-line px-3.5 py-1.5 font-sans text-z-body-sm text-ink hover:border-ink transition-colors"
                    >
                      {cat.name} in {city.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Individual specialists */}
          {doctorCrossLinks.length > 0 && (
            <div>
              <h2 className="font-display font-semibold text-ink text-z-h1 mb-4">
                Individual specialists for {detail.name.toLowerCase()}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {doctorCrossLinks.map((doc) => (
                  <Link
                    key={doc.id}
                    href={`/find-a-doctor/${doc.specialtySlug}/${doc.slug}`}
                    className="group block bg-white border border-ink-line rounded-z-md p-4 hover:border-ink transition-colors"
                  >
                    <h3 className="font-sans font-semibold text-ink text-z-body-sm group-hover:underline decoration-1 underline-offset-2 truncate">
                      {doc.displayTitle}
                    </h3>
                    <p className="font-sans text-z-caption text-ink-muted mt-0.5 truncate">
                      {doc.specialty}
                    </p>
                    {doc.primaryFacilityName && (
                      <p className="font-sans text-z-caption text-ink-muted mt-0.5 truncate">
                        {doc.primaryFacilityName}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Related tests */}
          {detail.relatedTests && detail.relatedTests.length > 0 && (
            <div>
              <h2 className="font-display font-semibold text-ink text-z-h1 mb-4">
                Related diagnostic tests
              </h2>
              <ul className="flex flex-wrap gap-2">
                {detail.relatedTests.map((testSlug) => (
                  <li key={testSlug}>
                    <Link
                      href={`/labs/test/${testSlug}`}
                      className="inline-flex items-center rounded-z-pill bg-white border border-ink-line px-3.5 py-1.5 font-sans text-z-body-sm text-ink hover:border-ink transition-colors"
                    >
                      {testSlug.replace(/-/g, " ")}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Insurance note */}
          {detail.insuranceNotesEn && (
            <div className="bg-surface-cream rounded-z-md border border-ink-line p-5">
              <h2 className="font-display font-semibold text-ink text-z-h3 mb-2">
                Insurance coverage for {detail.name.toLowerCase()}
              </h2>
              <p className="font-sans text-z-body-sm text-ink-soft leading-relaxed">
                {detail.insuranceNotesEn}
              </p>
            </div>
          )}

          {/* FAQ */}
          <div>
            <h2 className="font-display font-semibold text-ink text-z-h1 mb-5">
              Good to know
            </h2>
            <div className="max-w-3xl">
              <FaqSection faqs={faqs} title={`${detail.name} Treatment in ${city.name} — FAQ`} />
            </div>
          </div>
        </>
      }
    />
  );
}
