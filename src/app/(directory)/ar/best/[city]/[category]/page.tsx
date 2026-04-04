import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { FaqSection } from "@/components/seo/FaqSection";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  getCities, getCityBySlug, getCategories, getCategoryBySlug,
  getProviders, getProviderCountByCategoryAndCity,
} from "@/lib/data";
import type { LocalProvider } from "@/lib/data";
import {
  breadcrumbSchema, faqPageSchema, itemListSchema, speakableSchema,
} from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { getArabicCityName, getArabicCategoryName, getArabicRegulator } from "@/lib/i18n";

export const revalidate = 43200;
export const dynamicParams = true;

function rankProviders(providers: LocalProvider[]): LocalProvider[] {
  return [...providers]
    .filter((p) => Number(p.googleRating) > 0)
    .sort((a, b) => {
      const ratingDiff = Number(b.googleRating) - Number(a.googleRating);
      if (ratingDiff !== 0) return ratingDiff;
      return (b.googleReviewCount || 0) - (a.googleReviewCount || 0);
    });
}

function avgRating(providers: LocalProvider[]): string {
  const rated = providers.filter((p) => Number(p.googleRating) > 0);
  if (rated.length === 0) return "غير متوفر";
  const sum = rated.reduce((acc, p) => acc + Number(p.googleRating), 0);
  return (sum / rated.length).toFixed(1);
}

interface Props {
  params: { city: string; category: string };
}

export function generateStaticParams() {
  const cities = getCities();
  const categories = getCategories();
  const params: { city: string; category: string }[] = [];
  for (const city of cities) {
    for (const cat of categories) {
      params.push({ city: city.slug, category: cat.slug });
    }
  }
  return params;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const city = getCityBySlug(params.city);
  if (!city) return {};
  const category = getCategoryBySlug(params.category);
  if (!category) return {};

  const count = await getProviderCountByCategoryAndCity(category.slug, city.slug);
  const base = getBaseUrl();
  const cityNameAr = getArabicCityName(city.slug);
  const catNameAr = getArabicCategoryName(category.slug);
  const url = `${base}/ar/best/${city.slug}/${category.slug}`;

  const title = `أفضل ${catNameAr} في ${cityNameAr} — أعلى 10 تقييمات [2026]`;
  const description = `قارن ${count.toLocaleString("ar-AE")} ${catNameAr} في ${cityNameAr}، الإمارات. مرتبة حسب تقييم Google وعدد مراجعات المرضى. محدّث مارس 2026.`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        "en-AE": `${base}/best/${city.slug}/${category.slug}`,
        "ar-AE": url,
        "x-default": `${base}/best/${city.slug}/${category.slug}`,
      },
    },
    openGraph: { title, description, url, type: "website", locale: "ar_AE" },
  };
}

export default async function ArBestCategoryInCityPage({ params }: Props) {
  const city = getCityBySlug(params.city);
  if (!city) notFound();

  const category = getCategoryBySlug(params.category);
  if (!category) notFound();

  const base = getBaseUrl();
  const cityNameAr = getArabicCityName(city.slug);
  const catNameAr = getArabicCategoryName(category.slug);
  const regulatorAr = getArabicRegulator(city.slug);
  const totalCount = await getProviderCountByCategoryAndCity(category.slug, city.slug);

  const { providers: allProviders } = await getProviders({
    citySlug: city.slug,
    categorySlug: category.slug,
    limit: 99999,
  });
  const ranked = rankProviders(allProviders);

  if (ranked.length === 0) notFound();

  const top15 = ranked.slice(0, 15);
  const top20ForSchema = ranked.slice(0, 20);
  const topProvider = ranked[0];
  const mostReviewed = [...ranked].sort(
    (a, b) => (b.googleReviewCount || 0) - (a.googleReviewCount || 0)
  )[0];

  const average = avgRating(allProviders);

  const otherCitiesRaw = await Promise.all(getCities()
    .filter((c) => c.slug !== city.slug)
    .map(async (c) => ({
      ...c,
      count: await getProviderCountByCategoryAndCity(category.slug, c.slug),
    })));
  const otherCities = otherCitiesRaw
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count);

  const otherCategoriesRaw = await Promise.all(getCategories()
    .filter((c) => c.slug !== category.slug)
    .map(async (c) => ({
      ...c,
      count: await getProviderCountByCategoryAndCity(c.slug, city.slug),
    })));
  const otherCategories = otherCategoriesRaw
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const faqs = [
    {
      question: `ما هي أفضل ${catNameAr} في ${cityNameAr}؟`,
      answer: `وفقاً لدليل الإمارات المفتوح للرعاية الصحية، أعلى ${catNameAr} تقييماً في ${cityNameAr} هي ${topProvider.name} بتقييم ${topProvider.googleRating} نجوم على Google بناءً على ${topProvider.googleReviewCount?.toLocaleString("ar-AE")} مراجعة من المرضى. جميع التصنيفات مبنية على تقييمات Google المعتمدة وحجم المراجعات. البيانات مصدرها سجلات ${regulatorAr} الرسمية، آخر تحقق مارس 2026.`,
    },
    {
      question: `كم عدد ${catNameAr} في ${cityNameAr}؟`,
      answer: `يوجد ${totalCount.toLocaleString("ar-AE")} ${catNameAr} مُدرجة في ${cityNameAr} في دليل الإمارات المفتوح للرعاية الصحية. من بينها، ${ranked.length.toLocaleString("ar-AE")} حصلت على تقييمات Google أعلى من صفر نجوم. متوسط التقييم عبر جميع المنشآت المُقيَّمة هو ${average} نجوم.`,
    },
    {
      question: `أي ${catNameAr} في ${cityNameAr} لديها أكثر المراجعات؟`,
      answer: mostReviewed
        ? `${mostReviewed.name} لديها أكثر مراجعات Google بين ${catNameAr} في ${cityNameAr}، بـ ${mostReviewed.googleReviewCount?.toLocaleString("ar-AE")} مراجعة وتقييم ${mostReviewed.googleRating} نجوم. عدد المراجعات المرتفع يدل على تدفق منتظم للمرضى وتغذية راجعة شاملة.`
        : `تصفح القائمة الكاملة أدناه لمقارنة عدد المراجعات لكل ${catNameAr} في ${cityNameAr}.`,
    },
    {
      question: `هل ${catNameAr} في ${cityNameAr} مرخصة؟`,
      answer: `نعم. جميع ${catNameAr} المُدرجة في دليل الإمارات المفتوح للرعاية الصحية مرخصة من قِبل ${regulatorAr}. المصدر الأساسي لبيانات الدليل هو السجلات الحكومية الرسمية لضمان الدقة.`,
    },
    {
      question: `هل التأمين الصحي مقبول في ${catNameAr} بـ ${cityNameAr}؟`,
      answer: `معظم ${catNameAr} المُدرجة في ${cityNameAr} تقبل الخطط التأمينية الرئيسية. تفقد تفاصيل كل منشأة في الدليل لمعرفة شبكات التأمين المحددة المقبولة. التأمين الصحي إلزامي في دبي وأبوظبي ويوفره أصحاب العمل.`,
    },
  ];

  return (
    <div dir="rtl" lang="ar" className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd data={breadcrumbSchema([
        { name: "الإمارات", url: base },
        { name: "أفضل", url: `${base}/ar/best` },
        { name: cityNameAr, url: `${base}/ar/best/${city.slug}` },
        { name: catNameAr },
      ])} />
      <JsonLd data={faqPageSchema(faqs)} />
      <JsonLd data={speakableSchema([".answer-block"])} />
      {top20ForSchema.length > 0 && (
        <JsonLd data={itemListSchema(`أفضل 10 ${catNameAr} في ${cityNameAr}`, top20ForSchema, cityNameAr, base)} />
      )}

      <Breadcrumb items={[
        { label: "الإمارات", href: "/ar" },
        { label: "أفضل", href: "/ar/best" },
        { label: cityNameAr, href: `/ar/best/${city.slug}` },
        { label: catNameAr },
      ]} />

      <div className="mb-6">
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-2">
          أفضل {catNameAr} في {cityNameAr}
        </h1>
        <p className="font-['Geist',sans-serif] text-sm text-black/40">
          {totalCount.toLocaleString("ar-AE")} منشأة · متوسط التقييم {average} نجوم
          {" "}· {regulatorAr} · محدّث مارس 2026
        </p>
      </div>

      <div className="border-r-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 mb-8" data-answer-block="true">
        <p className="font-['Geist',sans-serif] text-black/60 leading-relaxed">
          وفقاً لدليل الإمارات المفتوح للرعاية الصحية، يوجد {totalCount.toLocaleString("ar-AE")} {catNameAr}
          في {cityNameAr}. أعلاها تقييماً هي <strong>{topProvider.name}</strong> بتقييم{" "}
          {topProvider.googleRating} نجوم على Google بناءً على{" "}
          {topProvider.googleReviewCount?.toLocaleString("ar-AE")} مراجعة معتمدة من المرضى.
          جميع المنشآت مرخصة من قِبل {regulatorAr}.
          البيانات مصدرها السجلات الحكومية الرسمية، آخر تحقق مارس 2026.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-8 text-xs">
        <Link
          href={`/ar/directory/${city.slug}/${category.slug}`}
          className="border border-black/[0.06] px-3 py-1.5 text-black/40 hover:border-[#006828]/15 hover:text-[#006828] transition-colors"
        >
          الدليل الكامل لـ {catNameAr} في {cityNameAr}
        </Link>
        <Link
          href={`/ar/best/${city.slug}`}
          className="border border-black/[0.06] px-3 py-1.5 text-black/40 hover:border-[#006828]/15 hover:text-[#006828] transition-colors"
        >
          جميع التخصصات في {cityNameAr}
        </Link>
        <Link
          href="/ar/best"
          className="border border-black/[0.06] px-3 py-1.5 text-black/40 hover:border-[#006828]/15 hover:text-[#006828] transition-colors"
        >
          جميع المدن
        </Link>
      </div>

      <section className="mb-10">
        <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
            قائمة مرتبة — {catNameAr} في {cityNameAr}
          </h2>
        </div>
        <ol className="space-y-0">
          {top15.map((provider, index) => (
            <li key={provider.id} className="article-row">
              <span className="text-2xl font-bold text-[#006828] leading-none mt-0.5 w-8 shrink-0 text-center">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/ar/directory/${provider.citySlug}/${provider.categorySlug}/${provider.slug}`}
                      className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[#1c1c1c] tracking-tight hover:text-[#006828] transition-colors"
                    >
                      {provider.name}
                    </Link>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className="text-xs font-semibold text-[#006828]">
                        ★ {provider.googleRating}
                      </span>
                      <span className="font-['Geist',sans-serif] text-xs text-black/40">
                        {provider.googleReviewCount.toLocaleString("ar-AE")} مراجعة
                      </span>
                      {provider.phone && (
                        <a
                          href={`tel:${provider.phone.replace(/[^+\d]/g, "")}`}
                          className="font-['Geist',sans-serif] text-xs text-black/40 hover:text-[#006828] transition-colors"
                        >
                          {provider.phone}
                        </a>
                      )}
                    </div>
                    {provider.address && (
                      <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1 line-clamp-1">{provider.address}</p>
                    )}
                  </div>
                  <div className="shrink-0">
                    <span className="inline-block bg-[#006828]/[0.08] text-[#006828] text-[10px] font-medium uppercase tracking-wide px-2.5 py-0.5 rounded-full font-['Geist',sans-serif]">
                      #{index + 1} في {cityNameAr}
                    </span>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ol>

        {ranked.length > 15 && (
          <div className="mt-6 text-center">
            <Link
              href={`/ar/directory/${city.slug}/${category.slug}`}
              className="inline-block border border-black/[0.06] px-5 py-2.5 text-sm text-[#1c1c1c] hover:border-[#006828]/15 hover:text-[#006828] transition-colors"
            >
              عرض جميع {totalCount.toLocaleString("ar-AE")} منشأة →
            </Link>
          </div>
        )}
      </section>

      <FaqSection
        faqs={faqs}
        title={`أفضل ${catNameAr} في ${cityNameAr} — أسئلة شائعة`}
      />

      {otherCities.length > 0 && (
        <section className="mb-10 mt-10">
          <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
              {catNameAr} في مدن أخرى
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {otherCities.map((c) => (
              <Link
                key={c.slug}
                href={`/ar/best/${c.slug}/${category.slug}`}
                className="block border border-black/[0.06] p-3 hover:border-[#006828]/15 transition-colors group text-center"
              >
                <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
                  {getArabicCityName(c.slug)}
                </p>
                <p className="text-xs text-[#006828] font-bold mt-1">
                  {c.count.toLocaleString("ar-AE")} منشأة
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {otherCategories.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
              تخصصات أخرى في {cityNameAr}
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {otherCategories.map((c) => (
              <Link
                key={c.slug}
                href={`/ar/best/${city.slug}/${c.slug}`}
                className="border border-black/[0.06] px-3 py-1.5 text-sm text-[#1c1c1c] hover:border-[#006828]/15 hover:text-[#006828] transition-colors"
              >
                {getArabicCategoryName(c.slug)}
                <span className="text-xs text-black/40 mr-1">({c.count.toLocaleString("ar-AE")})</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="border-t border-black/[0.06] pt-4 flex items-center justify-between gap-4 flex-wrap">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>إخلاء المسؤولية:</strong> التصنيفات مبنية على تقييمات Google وعدد المراجعات المتاحة للعموم
          ولا تُعدّ توصية طبية. بيانات مقدمي الخدمات مصدرها سجلات {regulatorAr} الرسمية،
          آخر تحقق مارس 2026.
        </p>
        <Link href={`/best/${city.slug}/${category.slug}`} className="text-[11px] text-[#006828] hover:underline whitespace-nowrap">
          English →
        </Link>
      </div>
    </div>
  );
}
