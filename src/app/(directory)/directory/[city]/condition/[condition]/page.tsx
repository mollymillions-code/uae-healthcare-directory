import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { ProviderCard } from "@/components/provider/ProviderCard";
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
    const { providers } = await getProviders({
      citySlug,
      categorySlug: catSlug,
      limit: 30,
      sort: "rating",
    });
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
  // indexing. The page still renders (for the occasional direct visitor)
  // but the metadata gate above already emitted `noindex,follow` via the
  // facet-rules evaluateCombo call. We double-gate here by bailing early
  // to 404 when the fallback detail + city produces <10 providers — this
  // prevents templated thin content on ~96 fallback condition×city combos
  // from leaking into the sitemap or getting crawled.
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
    const { professionals } = await getProfessionalsIndexBySpecialty(spec, { limit: 4 });
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

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {schemaNodes.map((node, idx) => (
        <JsonLd key={idx} data={node} />
      ))}
      <JsonLd data={speakableSchema([".answer-block"])} />

      <Breadcrumb items={[
        { label: "UAE", href: "/" },
        { label: city.name, href: `/directory/${city.slug}` },
        { label: "Conditions", href: `/directory/${city.slug}/condition` },
        { label: detail.name },
      ]} />

      <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-2">
        {detail.name} Treatment in {city.name}
      </h1>
      <p className="font-['Geist',sans-serif] text-sm text-black/40 mb-4">
        {count} verified {count === 1 ? "provider" : "providers"} · Last updated March 2026
      </p>

      {/* ── (1) Condition intro ─────────────────────────────────────── */}
      <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 mb-6" data-answer-block="true">
        <p className="font-['Geist',sans-serif] text-black/60 leading-relaxed">
          {detail.introEn}
        </p>
      </div>

      {/* Arabic intro mirror */}
      {detail.introAr && (
        <div dir="rtl" lang="ar" className="border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 mb-8" data-answer-block="true">
          <p className="font-['Geist',sans-serif] text-black/60 leading-relaxed">
            {detail.introAr}
          </p>
        </div>
      )}

      {/* Symptoms + urgent signs block */}
      {(detail.symptomsEn?.length || detail.urgentSignsEn?.length) && (
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {detail.symptomsEn && detail.symptomsEn.length > 0 && (
            <div className="bg-white rounded-xl border border-black/[0.06] p-5">
              <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-base text-[#1c1c1c] tracking-tight mb-3">
                Common symptoms
              </h2>
              <ul className="space-y-1.5">
                {detail.symptomsEn.map((s, idx) => (
                  <li key={idx} className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
                    &middot; {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {detail.urgentSignsEn && detail.urgentSignsEn.length > 0 && (
            // ── (6) Urgent-care red banner ───────────────────────────
            <div className="bg-amber-50 rounded-xl border border-amber-400/30 p-5" role="alert">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-4 w-4 text-amber-700" aria-hidden="true" />
                <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-base text-amber-900 tracking-tight">
                  When to seek urgent care
                </h2>
              </div>
              <ul className="space-y-1.5">
                {detail.urgentSignsEn.map((s, idx) => (
                  <li key={idx} className="font-['Geist',sans-serif] text-sm text-amber-800 leading-relaxed">
                    &middot; {s}
                  </li>
                ))}
              </ul>
              <p className="font-['Geist',sans-serif] text-xs text-amber-700 mt-3">
                If you experience any of the above, go directly to the nearest {city.name} emergency department, or call 999. UAE-licensed emergency rooms triage life-threatening symptoms regardless of insurance status.
              </p>
            </div>
          )}
        </section>
      )}

      {/* ── (2) Which specialties treat this condition ──────────────── */}
      {relatedCats.length > 0 && (
        <section className="mb-8">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] text-[#1c1c1c] tracking-tight mb-3 border-b-2 border-[#1c1c1c] pb-2">
            Specialties that treat {detail.name.toLowerCase()}
          </h2>
          <div className="flex flex-wrap gap-2">
            {relatedCats.map((cat) => (
              <Link
                key={cat.slug}
                href={`/directory/${city.slug}/${cat.slug}`}
                className="inline-block border border-[#006828]/20 text-[#006828] text-sm rounded-full font-['Geist',sans-serif] px-3 py-1.5 hover:bg-[#006828]/[0.04] transition-colors"
              >
                {cat.name} in {city.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── (3) Top relevant facilities ─────────────────────────────── */}
      {providers.length > 0 && (
        <section className="mb-10">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] text-[#1c1c1c] tracking-tight mb-4 border-b-2 border-[#1c1c1c] pb-2">
            Top providers for {detail.name.toLowerCase()} in {city.name}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {providers.slice(0, 18).map((p) => (
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

      {/* ── (4) Top relevant doctors ───────────────────────────────── */}
      {doctorCrossLinks.length > 0 && (
        <section className="mb-10">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] text-[#1c1c1c] tracking-tight mb-4 border-b-2 border-[#1c1c1c] pb-2">
            Individual specialists for {detail.name.toLowerCase()}
          </h2>
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

      {/* ── (5) Related tests / labs cross-link ─────────────────────── */}
      {detail.relatedTests && detail.relatedTests.length > 0 && (
        <section className="mb-10">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] text-[#1c1c1c] tracking-tight mb-4 border-b-2 border-[#1c1c1c] pb-2">
            Related diagnostic tests
          </h2>
          <div className="flex flex-wrap gap-2">
            {detail.relatedTests.map((testSlug) => (
              <Link
                key={testSlug}
                href={`/labs/test/${testSlug}`}
                className="inline-block bg-white text-[#1c1c1c] text-sm px-3 py-2 rounded-lg border border-black/[0.06] hover:border-[#006828]/20 hover:bg-[#006828]/[0.04] transition-colors font-['Geist',sans-serif]"
              >
                {testSlug.replace(/-/g, " ")}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── (7) Insurance coverage note ─────────────────────────────── */}
      {detail.insuranceNotesEn && (
        <section className="mb-10 bg-[#006828]/[0.03] rounded-xl p-5 border border-[#006828]/[0.08]">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-base text-[#006828] tracking-tight mb-2">
            Insurance coverage for {detail.name.toLowerCase()}
          </h2>
          <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
            {detail.insuranceNotesEn}
          </p>
        </section>
      )}

      {/* ── (8) FAQ block ───────────────────────────────────────────── */}
      <FaqSection faqs={faqs} title={`${detail.name} Treatment in ${city.name} — FAQ`} />
    </div>
  );
}
