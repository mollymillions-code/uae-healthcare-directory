import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { FaqSection } from "@/components/seo/FaqSection";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  getCities,
  getCityBySlug,
  getCategoryBySlug,
  getProviders,
  getProviderCountByCategoryAndCity,
} from "@/lib/data";
import type { LocalProvider } from "@/lib/data";
import { ListingsTemplate } from "@/components/directory-v2/templates/ListingsTemplate";
import {
  breadcrumbSchema,
  faqPageSchema,
  itemListSchema,
  speakableSchema,
} from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { safe } from "@/lib/safeData";
import { INSURANCE_PROVIDERS } from "@/lib/constants/insurance";
import {
  getInsurancePlan,
  isTriFacetEligible,
} from "@/lib/insurance-facets/data";
import {
  TRI_FACET_INSURER_ALLOW,
  TRI_FACET_CATEGORY_ALLOW,
} from "@/lib/seo/facet-rules";
import { getArabicCityName, getArabicCategoryName } from "@/lib/i18n";

/**
 * AR mirror of /best/[city]/[category]/accepting/[insurer].
 * Renders Arabic copy + uses insurer.nameAr when available.
 */

export const revalidate = 21600; // 6h
export const dynamicParams = true;

const TOP_N = 20;

interface Props {
  params: Promise<{ city: string; category: string; insurer: string }>;
}

function rankProviders(providers: LocalProvider[]): LocalProvider[] {
  return [...providers]
    .filter((p) => Number(p.googleRating) > 0)
    .sort((a, b) => {
      const ratingDiff = Number(b.googleRating) - Number(a.googleRating);
      if (ratingDiff !== 0) return ratingDiff;
      const reviewDiff =
        (b.googleReviewCount || 0) - (a.googleReviewCount || 0);
      if (reviewDiff !== 0) return reviewDiff;
      return a.name.localeCompare(b.name);
    });
}

function getRegulatorShortAr(citySlug: string): string {
  if (citySlug === "dubai") return "هيئة الصحة بدبي";
  if (citySlug === "abu-dhabi" || citySlug === "al-ain") return "دائرة الصحة أبوظبي";
  return "وزارة الصحة ووقاية المجتمع";
}

function generateBestAcceptingFaqsAr(opts: {
  cityNameAr: string;
  categoryNameAr: string;
  insurerNameAr: string;
  rankedCount: number;
  totalAccepting: number;
  topProviderName?: string;
  topProviderRating?: string | null;
  topProviderReviewCount?: number | null;
  regulatorAr: string;
}): { question: string; answer: string }[] {
  const {
    cityNameAr,
    categoryNameAr,
    insurerNameAr,
    rankedCount,
    totalAccepting,
    topProviderName,
    topProviderRating,
    topProviderReviewCount,
    regulatorAr,
  } = opts;

  return [
    {
      question: `ما هي ${categoryNameAr} في ${cityNameAr} التي تقبل تأمين ${insurerNameAr}؟`,
      answer: topProviderName
        ? `هناك ${totalAccepting} ${categoryNameAr} في ${cityNameAr} تقبل تأمين ${insurerNameAr}. الأعلى تقييماً هو ${topProviderName} بتقييم ${topProviderRating} نجوم بناءً على ${topProviderReviewCount?.toLocaleString("ar-AE") || "0"} تقييم. تأكد دائماً من ترتيبات الفوترة المباشرة مع العيادة قبل الزيارة.`
        : `يوجد عدد من ${categoryNameAr} في ${cityNameAr} تقبل ${insurerNameAr}. تأكد من ترتيبات الفوترة المباشرة مع العيادة قبل الزيارة.`,
    },
    {
      question: `كم عدد ${categoryNameAr} في ${cityNameAr} التي تقبل ${insurerNameAr}؟`,
      answer: `وفقاً لدليل الرعاية الصحية المفتوح في الإمارات، هناك ${totalAccepting} ${categoryNameAr} في ${cityNameAr} تقبل ${insurerNameAr}، منها ${rankedCount} لديها تقييمات Google متاحة ومدرجة في هذه القائمة. قبول التأمين قد يتغير — تأكد من العيادة قبل الحجز.`,
    },
    {
      question: `كيف يتم ترتيب ${categoryNameAr} في هذه القائمة؟`,
      answer: `الترتيب حسب تقييم Google (الأعلى أولاً)، مع عدد التقييمات كعامل ترجيح للمقدمين بنفس التقييم، ثم حالة التحقق وأخيراً الترتيب الأبجدي. مصدر بيانات المقدمين: سجلات ${regulatorAr} الرسمية وتقييمات Google العامة.`,
    },
    {
      question: `هل أحتاج إلى إحالة لزيارة عيادة في ${cityNameAr} مع تأمين ${insurerNameAr}؟`,
      answer: `يعتمد ذلك على نوع خطة ${insurerNameAr} الخاصة بك. كثير من الخطط تسمح بالوصول المباشر للممارسين العامين والرعاية الطارئة دون إحالة، بينما تتطلب زيارات الأخصائيين عادة إحالة أو موافقة مسبقة. تحقق من بوليصتك أو اتصل بخدمة عملاء ${insurerNameAr} قبل الحجز.`,
    },
    {
      question: `ما هي المستندات التي أحتاج إلى إحضارها مع بطاقة تأمين ${insurerNameAr}؟`,
      answer: `أحضر (1) بطاقة ${insurerNameAr} أو رقم البوليصة، (2) الهوية الإماراتية أو جواز السفر، (3) أي سجلات طبية سابقة أو خطابات إحالة ذات صلة بالزيارة، و(4) رمز الموافقة المسبقة إذا كانت خطتك تتطلبه للإجراء. معظم العيادات في هذه القائمة تقبل الزيارات بدون موعد، لكن يُنصح بالحجز للاستشارات المتخصصة.`,
    },
  ];
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const city = getCityBySlug(params.city);
  if (!city) return {};
  const category = getCategoryBySlug(params.category);
  if (!category) return {};
  const insurer = getInsurancePlan(params.insurer);
  if (!insurer) return {};

  const eligible = await safe(
    isTriFacetEligible(insurer.slug, city.slug, category.slug),
    false,
    "ar-best-accepting-meta-eligible",
  );

  const base = getBaseUrl();
  const url = `${base}/ar/best/${city.slug}/${category.slug}/accepting/${insurer.slug}`;
  const cityNameAr = getArabicCityName(city.slug);
  const insurerNameAr = insurer.nameAr || insurer.nameEn;
  const categoryNameAr = getArabicCategoryName(category.slug) || category.name;

  if (!eligible) {
    return {
      title: `أفضل ${categoryNameAr} في ${cityNameAr} يقبلون ${insurerNameAr}`,
      alternates: { canonical: `${base}/ar/directory/${city.slug}/insurance/${insurer.slug}` },
      robots: { index: false, follow: true },
    };
  }

  const currentYear = new Date().getFullYear();
  const title = `أفضل ${categoryNameAr} في ${cityNameAr} يقبلون ${insurerNameAr} — أعلى ${TOP_N} [${currentYear}]`;
  const description = `قائمة بأفضل ${categoryNameAr} في ${cityNameAr} الذين يقبلون تأمين ${insurerNameAr}. مرتبة حسب تقييم Google.`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        "en-AE": `${base}/best/${city.slug}/${category.slug}/accepting/${insurer.slug}`,
        "ar-AE": url,
      },
    },
    openGraph: { title, description, url, type: "website", locale: "ar_AE" },
  };
}

export default async function BestAcceptingPageAr(props: Props) {
  const params = await props.params;
  const city = getCityBySlug(params.city);
  if (!city) notFound();
  const category = getCategoryBySlug(params.category);
  if (!category) notFound();
  const insurer = getInsurancePlan(params.insurer);
  if (!insurer) notFound();

  const inAllowList =
    TRI_FACET_INSURER_ALLOW.has(insurer.slug) &&
    TRI_FACET_CATEGORY_ALLOW.has(category.slug);
  const eligible = await isTriFacetEligible(insurer.slug, city.slug, category.slug);
  if (!inAllowList || !eligible) notFound();

  const base = getBaseUrl();
  const cityNameAr = getArabicCityName(city.slug);
  const insurerNameAr = insurer.nameAr || insurer.nameEn;
  const categoryNameAr = getArabicCategoryName(category.slug) || category.name;
  const regulatorAr = getRegulatorShortAr(city.slug);

  const totalCityCount = await safe(
    getProviderCountByCategoryAndCity(category.slug, city.slug),
    0,
    "ar-best-accepting-totalCount",
  );
  const { providers: allProviders } = await safe(
    getProviders({
      citySlug: city.slug,
      categorySlug: category.slug,
      limit: 99999,
    }),
    { providers: [], total: 0, page: 1, totalPages: 1 } as Awaited<
      ReturnType<typeof getProviders>
    >,
    "ar-best-accepting-providers",
  );

  const accepting = allProviders.filter((p) =>
    p.insurance.some((label) => {
      const norm = label.toLowerCase().replace(/\s+/g, "-");
      return (
        norm.includes(insurer.slug) ||
        label.toLowerCase().includes(insurer.nameEn.toLowerCase())
      );
    })
  );
  const ranked = rankProviders(accepting);
  if (ranked.length === 0) notFound();

  const topN = ranked.slice(0, TOP_N);
  const topProvider = ranked[0];
  const totalAccepting = accepting.length;

  const faqs = generateBestAcceptingFaqsAr({
    cityNameAr,
    categoryNameAr,
    insurerNameAr,
    rankedCount: ranked.length,
    totalAccepting,
    topProviderName: topProvider?.name,
    topProviderRating: topProvider?.googleRating,
    topProviderReviewCount: topProvider?.googleReviewCount,
    regulatorAr,
  });

  const breadcrumbs = breadcrumbSchema([
    { name: "الرئيسية", url: `${base}/ar` },
    { name: "الدليل", url: `${base}/ar/directory` },
    { name: cityNameAr, url: `${base}/ar/directory/${city.slug}` },
    {
      name: categoryNameAr,
      url: `${base}/ar/directory/${city.slug}/${category.slug}`,
    },
    { name: `يقبلون ${insurerNameAr}` },
  ]);

  const itemList = itemListSchema(
    `أفضل ${Math.min(TOP_N, ranked.length)} ${categoryNameAr} في ${cityNameAr} يقبلون ${insurerNameAr}`,
    topN,
    cityNameAr,
    base,
  );

  return (
    <>
      <ListingsTemplate
        breadcrumbs={[
          { label: "الإمارات", href: "/ar" },
          { label: cityNameAr, href: `/ar/directory/${city.slug}` },
          {
            label: categoryNameAr,
            href: `/ar/directory/${city.slug}/${category.slug}`,
          },
          { label: `يقبلون ${insurerNameAr}` },
        ]}
        eyebrow={`الأفضل · ${cityNameAr} · ${insurerNameAr}`}
        title={`أفضل ${categoryNameAr} في ${cityNameAr} يقبلون ${insurerNameAr}.`}
        subtitle={
          <>
            أعلى {Math.min(ranked.length, TOP_N)} مقدم خدمة من أصل{" "}
            {totalAccepting} يقبلون {insurerNameAr}. مرتبة حسب تقييمات المرضى ·{" "}
            {regulatorAr} · آخر تحديث مايو 2026.
          </>
        }
        aeoAnswer={
          <p>
            <strong>{topProvider.name}</strong> هو الأعلى تقييماً بين{" "}
            {categoryNameAr} في {cityNameAr} الذين يقبلون{" "}
            <strong>{insurerNameAr}</strong>، بناءً على{" "}
            {topProvider.googleReviewCount?.toLocaleString("ar-AE") || "0"}{" "}
            تقييم Google ({topProvider.googleRating} نجوم). تتضمن هذه القائمة{" "}
            {ranked.length} {categoryNameAr} يقبلون {insurerNameAr} في{" "}
            {cityNameAr} (من إجمالي {totalCityCount}).
          </p>
        }
        providers={topN.map((p) => ({
          ...p,
          categoryName: categoryNameAr,
          address: p.address,
          googleRating: p.googleRating,
          googleReviewCount: p.googleReviewCount,
          isClaimed: p.isClaimed,
          isVerified: p.isVerified,
          coverImageUrl: p.coverImageUrl,
        }))}
        providerBasePath="/ar/directory"
        total={Math.min(TOP_N, ranked.length)}
        belowGrid={
          <div className="space-y-8 mt-8">
            <nav
              className="border-t border-ink-line pt-8"
              aria-label="عروض ذات صلة"
            >
              <h2 className="font-display font-semibold text-ink text-z-h2 mb-4">
                عروض أخرى لـ {categoryNameAr} في {cityNameAr}
              </h2>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/ar/directory/${city.slug}/insurance/${insurer.slug}/${category.slug}`}
                  className="rounded-z-pill border border-ink-hairline bg-white px-4 py-2 font-sans text-z-body-sm text-ink hover:border-ink"
                >
                  جميع {categoryNameAr} في {cityNameAr} الذين يقبلون {insurerNameAr} ←
                </Link>
                <Link
                  href={`/ar/best/${city.slug}/${category.slug}`}
                  className="rounded-z-pill border border-ink-hairline bg-white px-4 py-2 font-sans text-z-body-sm text-ink hover:border-ink"
                >
                  أفضل {categoryNameAr} في {cityNameAr} (أي تأمين) ←
                </Link>
                <Link
                  href={`/ar/insurance/${insurer.slug}`}
                  className="rounded-z-pill border border-ink-hairline bg-white px-4 py-2 font-sans text-z-body-sm text-ink hover:border-ink"
                >
                  عن {insurerNameAr} ←
                </Link>
              </div>
            </nav>

            {INSURANCE_PROVIDERS.filter(
              (i) => i.slug !== insurer.slug && TRI_FACET_INSURER_ALLOW.has(i.slug),
            ).length > 0 && (
              <nav
                className="border-t border-ink-line pt-8"
                aria-label="خطط تأمين أخرى"
              >
                <h2 className="font-display font-semibold text-ink text-z-h2 mb-4">
                  خطط تأمين أخرى يقبلها {categoryNameAr} في {cityNameAr}
                </h2>
                <div className="flex flex-wrap gap-2">
                  {INSURANCE_PROVIDERS.filter(
                    (i) => i.slug !== insurer.slug && TRI_FACET_INSURER_ALLOW.has(i.slug),
                  ).map((i) => (
                    <Link
                      key={i.slug}
                      href={`/ar/best/${city.slug}/${category.slug}/accepting/${i.slug}`}
                      className="rounded-z-pill border border-ink-hairline bg-white px-3 py-1.5 font-sans text-z-caption text-ink hover:border-ink"
                    >
                      يقبلون {i.name} ←
                    </Link>
                  ))}
                </div>
              </nav>
            )}

            <section className="border-t border-ink-line pt-8">
              <h2 className="font-display font-semibold text-ink text-z-h2 mb-4">
                الأسئلة الشائعة
              </h2>
              <FaqSection faqs={faqs} />
            </section>
          </div>
        }
        schemas={
          <>
            <JsonLd data={breadcrumbs} />
            <JsonLd data={itemList} />
            <JsonLd data={faqPageSchema(faqs)} />
            <JsonLd data={speakableSchema([".answer-block"])} />
          </>
        }
        arabicHref={`/best/${city.slug}/${category.slug}/accepting/${insurer.slug}`}
      />
    </>
  );
}

export async function generateStaticParams() {
  if (process.env.PREBUILD_STATIC_ROUTES !== "1") return [];
  const cities = getCities().filter((c) => c.country === "ae");
  const params: { city: string; category: string; insurer: string }[] = [];
  const allowedCategories = Array.from(TRI_FACET_CATEGORY_ALLOW);
  const allowedInsurers = Array.from(TRI_FACET_INSURER_ALLOW);
  for (const city of cities) {
    for (const catSlug of allowedCategories) {
      for (const insurerSlug of allowedInsurers) {
        params.push({
          city: city.slug,
          category: catSlug,
          insurer: insurerSlug,
        });
      }
    }
  }
  return params;
}
