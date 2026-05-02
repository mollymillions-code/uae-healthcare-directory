import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { ProviderCard } from "@/components/provider/ProviderCard";
import { FaqSection } from "@/components/seo/FaqSection";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  getCityBySlug, getCategoryBySlug,
  getConditions, getProviders,
} from "@/lib/data";
import type { LocalProvider } from "@/lib/data";
import { speakableSchema, truncateTitle, truncateDescription } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import {
  getConditionDetail,
  type ConditionSpecialtyDetail,
} from "@/lib/constants/condition-specialty-map";
import {
  generateConditionPageSchema,
  generateConditionFaqs,
} from "@/lib/seo-conditions";
import { getArabicCityName, getArabicCategoryName } from "@/lib/i18n";

export const revalidate = 21600;

interface Props {
  params: { city: string; condition: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const city = getCityBySlug(params.city);
  if (!city) return {};
  const condition = getConditions().find((c) => c.slug === params.condition);
  if (!condition) return {};
  const base = getBaseUrl();
  const enCanonical = `${base}/directory/${city.slug}/condition/${condition.slug}`;
  const arCanonical = `${base}/ar/directory/${city.slug}/condition/${condition.slug}`;
  const cityNameAr = getArabicCityName(city.slug);
  const detail = getConditionDetail(condition.slug);
  const nameAr = detail?.nameAr ?? condition.name;

  return {
    title: truncateTitle(`علاج ${nameAr} في ${cityNameAr} — الأخصائيون والعيادات`, 50),
    description: truncateDescription(
      `ابحث عن الأخصائيين والعيادات لعلاج ${nameAr} في ${cityNameAr}، الإمارات. قارن مقدمي الخدمة المعتمدين، التغطية التأمينية، والأسئلة الشائعة.`,
      145,
    ),
    alternates: {
      canonical: arCanonical,
      languages: {
        "en-AE": enCanonical,
        "ar-AE": arCanonical,
        "x-default": enCanonical,
      },
    },
    openGraph: {
      title: `علاج ${nameAr} في ${cityNameAr}`,
      description: `اعثر على الأخصائيين لعلاج ${nameAr} في ${cityNameAr}.`,
      type: "article",
      locale: "ar_AE",
      siteName: "دليل الإمارات المفتوح للرعاية الصحية",
      url: arCanonical,
    },
  };
}

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

export default async function ArabicConditionPage({ params }: Props) {
  const city = getCityBySlug(params.city);
  if (!city) notFound();

  const legacyCondition = getConditions().find((c) => c.slug === params.condition);
  if (!legacyCondition) notFound();

  // IMPORTANT: on the Arabic mirror, a fallback condition with no Arabic
  // translation must NOT render. Previously the synthetic fallback set
  // `introAr: legacyCondition.description` (an English string) which
  // served English text inside `<div dir="rtl" lang="ar">`. Instead, we
  // now 404 the Arabic page when there is no hand-authored AR detail,
  // and let the English mirror + hreflang carry the content.
  const handAuthoredDetail = getConditionDetail(params.condition);
  if (!handAuthoredDetail || !handAuthoredDetail.introAr) notFound();
  const detail: ConditionSpecialtyDetail = handAuthoredDetail;

  const providers = await getProvidersForCondition(city.slug, detail.specialties);
  const count = providers.length;
  if (count === 0) notFound();

  const base = getBaseUrl();
  const canonicalUrl = `${base}/ar/directory/${city.slug}/condition/${detail.slug}`;
  const cityNameAr = getArabicCityName(city.slug);
  const nameAr = detail.nameAr ?? detail.name;

  const relatedCats = detail.specialties
    .map((slug) => ({
      slug,
      name: getCategoryBySlug(slug)?.name ?? slug,
      nameAr: getArabicCategoryName(slug),
    }))
    .filter((c) => c.name);

  const faqs = generateConditionFaqs(detail, city, count);

  const breadcrumbs = [
    { name: "الإمارات", url: base },
    { name: cityNameAr, url: `${base}/ar/directory/${city.slug}` },
    { name: "الحالات الصحية", url: `${base}/ar/directory/${city.slug}/condition` },
    { name: nameAr },
  ];

  const schemaNodes = generateConditionPageSchema({
    detail,
    city,
    providers,
    faqs,
    breadcrumbs,
    canonicalUrl,
    locale: "ar-AE",
  });

  return (
    <div dir="rtl" lang="ar" className="font-arabic max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {schemaNodes.map((node, idx) => (
        <JsonLd key={idx} data={node} />
      ))}
      <JsonLd data={speakableSchema([".answer-block"])} />

      <Breadcrumb items={[
        { label: "الإمارات", href: "/ar" },
        { label: cityNameAr, href: `/ar/directory/${city.slug}` },
        { label: "الحالات الصحية", href: `/ar/directory/${city.slug}/condition` },
        { label: nameAr },
      ]} />

      <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-2">
        علاج {nameAr} في {cityNameAr}
      </h1>
      <p className="font-['Geist',sans-serif] text-sm text-black/40 mb-4">
        {count} مقدم خدمة معتمد · آخر تحديث مارس 2026
      </p>

      {/* Condition intro */}
      <div className="border-r-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 mb-6" data-answer-block="true">
        <p className="font-['Geist',sans-serif] text-black/60 leading-relaxed">
          {detail.introAr}
        </p>
      </div>

      {/* Symptoms + urgent signs */}
      {(detail.symptomsAr?.length || detail.urgentSignsAr?.length) && (
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {detail.symptomsAr && detail.symptomsAr.length > 0 && (
            <div className="bg-white rounded-xl border border-black/[0.06] p-5">
              <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-base text-[#1c1c1c] tracking-tight mb-3">
                الأعراض الشائعة
              </h2>
              <ul className="space-y-1.5">
                {detail.symptomsAr.map((s, idx) => (
                  <li key={idx} className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
                    &middot; {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {detail.urgentSignsAr && detail.urgentSignsAr.length > 0 && (
            <div className="bg-amber-50 rounded-xl border border-amber-400/30 p-5" role="alert">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-4 w-4 text-amber-700" aria-hidden="true" />
                <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-base text-amber-900 tracking-tight">
                  متى تحتاج إلى رعاية عاجلة
                </h2>
              </div>
              <ul className="space-y-1.5">
                {detail.urgentSignsAr.map((s, idx) => (
                  <li key={idx} className="font-['Geist',sans-serif] text-sm text-amber-800 leading-relaxed">
                    &middot; {s}
                  </li>
                ))}
              </ul>
              <p className="font-['Geist',sans-serif] text-xs text-amber-700 mt-3">
                في حال ظهور أي من الأعراض أعلاه، توجه مباشرة إلى أقرب قسم طوارئ في {cityNameAr}، أو اتصل بالرقم 999. تستقبل أقسام الطوارئ المرخصة في الإمارات الحالات المهددة للحياة بغض النظر عن حالة التأمين.
              </p>
            </div>
          )}
        </section>
      )}

      {/* Related specialties */}
      {relatedCats.length > 0 && (
        <section className="mb-8">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] text-[#1c1c1c] tracking-tight mb-3 border-b-2 border-[#1c1c1c] pb-2">
            التخصصات التي تعالج {nameAr}
          </h2>
          <div className="flex flex-wrap gap-2">
            {relatedCats.map((cat) => (
              <Link
                key={cat.slug}
                href={`/ar/directory/${city.slug}/${cat.slug}`}
                className="inline-block border border-[#006828]/20 text-[#006828] text-sm rounded-full font-['Geist',sans-serif] px-3 py-1.5 hover:bg-[#006828]/[0.04] transition-colors"
              >
                {cat.nameAr} في {cityNameAr}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Top providers */}
      {providers.length > 0 && (
        <section className="mb-10">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] text-[#1c1c1c] tracking-tight mb-4 border-b-2 border-[#1c1c1c] pb-2">
            أفضل مقدمي الخدمة لعلاج {nameAr} في {cityNameAr}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" dir="ltr">
            {providers.slice(0, 18).map((p) => (
              <ProviderCard
                key={p.id}
                providerId={p.id}
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
                basePath="/ar/directory"
              />
            ))}
          </div>
        </section>
      )}

      {/* Insurance note */}
      {detail.insuranceNotesAr && (
        <section className="mb-10 bg-[#006828]/[0.03] rounded-xl p-5 border border-[#006828]/[0.08]">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-base text-[#006828] tracking-tight mb-2">
            التغطية التأمينية لعلاج {nameAr}
          </h2>
          <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
            {detail.insuranceNotesAr}
          </p>
        </section>
      )}

      <FaqSection faqs={faqs} title={`علاج ${nameAr} في ${cityNameAr} — الأسئلة الشائعة`} />
    </div>
  );
}
