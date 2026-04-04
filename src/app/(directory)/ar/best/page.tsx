import { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { FaqSection } from "@/components/seo/FaqSection";
import {
  getCities, getCategories, getProviderCountByCity,
  getProviderCountByCategoryAndCity, getTopRatedProviders,
} from "@/lib/data";
import { breadcrumbSchema, faqPageSchema, speakableSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { getArabicCityName, getArabicCategoryName } from "@/lib/i18n";

export const revalidate = 43200;

export function generateMetadata(): Metadata {
  const base = getBaseUrl();
  const url = `${base}/ar/best`;

  const title = "أفضل المنشآت الصحية في الإمارات | Zavis";
  const description =
    "ابحث عن أفضل المستشفيات والعيادات وعيادات الأسنان والأطباء المتخصصين المُقيَّمين في جميع مدن الإمارات. مرتبة حسب تقييم Google. أكثر من 12,000 منشأة من سجلات DHA وDOH وMOHAP.";

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        "en-AE": `${base}/best`,
        "ar-AE": url,
        "x-default": `${base}/best`,
      },
    },
    openGraph: { title, description, url, type: "website", locale: "ar_AE" },
  };
}

export default async function ArBestIndexPage() {
  const base = getBaseUrl();
  const cities = getCities();
  const categories = getCategories();

  const cityDataRaw = await Promise.all(cities
    .map(async (city) => {
      const [count, topProviders, catCounts] = await Promise.all([
        getProviderCountByCity(city.slug),
        getTopRatedProviders(city.slug, 1),
        Promise.all(categories.map((cat) => getProviderCountByCategoryAndCity(cat.slug, city.slug))),
      ]);
      const topProvider = topProviders[0];
      const catCount = catCounts.filter((c) => c > 0).length;
      return { ...city, count, topProvider, catCount, catCounts };
    }));
  const cityData = cityDataRaw
    .filter((c) => c.count > 0)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const popularCombos: { citySlug: string; cityNameAr: string; catSlug: string; catNameAr: string; count: number }[] = [];
  for (const row of cityDataRaw) {
    for (let i = 0; i < categories.length; i++) {
      const count = row.catCounts[i];
      if (count >= 5) {
        popularCombos.push({
          citySlug: row.slug,
          cityNameAr: getArabicCityName(row.slug),
          catSlug: categories[i].slug,
          catNameAr: getArabicCategoryName(categories[i].slug),
          count,
        });
      }
    }
  }
  popularCombos.sort((a, b) => b.count - a.count);
  const topCombos = popularCombos.slice(0, 16);

  const totalProviders = cityData.reduce((sum, c) => sum + c.count, 0);

  const faqs = [
    {
      question: "كيف يُصنِّف دليل الإمارات المفتوح للرعاية الصحية مقدمي الخدمات؟",
      answer:
        "يُصنَّف مقدمو الخدمات حسب تقييم Google (الأعلى أولاً)، مع استخدام عدد التقييمات كمعيار ثانوي للمقارنة. يُدرج فقط مقدمو الخدمات الحاصلون على تقييم أعلى من صفر. جميع البيانات مصدرها السجلات الحكومية الرسمية: DHA وDOH وMOHAP.",
    },
    {
      question: "أي مدينة إماراتية تضم أكبر عدد من مقدمي الرعاية الصحية؟",
      answer: cityData.length > 0
        ? `تضم ${getArabicCityName(cityData.sort((a, b) => b.count - a.count)[0].slug)} أكبر عدد من مقدمي الرعاية الصحية بـ ${cityData[0].count.toLocaleString("ar-AE")} منشأة مُدرجة في دليل الإمارات المفتوح للرعاية الصحية، يليها ${getArabicCityName(cityData[1]?.slug || "")}.`
        : "تصفح قوائم المدن أدناه لمقارنة أعداد مقدمي الخدمات.",
    },
    {
      question: "هل هذه التصنيفات مبنية على مواضع مدفوعة؟",
      answer:
        "لا. التصنيفات مبنية حصراً على تقييمات Google وعدد المراجعات المتاحة للعموم. لا توجد مواضع مدفوعة أو ترتيبات مموّلة. دليل الإمارات المفتوح للرعاية الصحية مورد مجاني ومفتوح.",
    },
    {
      question: "كم مرة تُحدَّث التصنيفات؟",
      answer:
        "تُحدَّث بيانات مقدمي الخدمات بانتظام وتُتحقق منها في مقابل السجلات الرسمية لـ DHA وDOH وMOHAP. تُحدَّث تقييمات Google وعدد المراجعات بصفة دورية. آخر تحقق مارس 2026.",
    },
    {
      question: "هل يمكنني العثور على أفضل الأطباء المتخصصين في منطقتي؟",
      answer:
        "نعم. اختر مدينتك أدناه، ثم حدد فئة التخصص للاطلاع على أعلى مقدمي الخدمات تقييماً في منطقتك. يمكنك مقارنة التقييمات وعدد المراجعات وقبول التأمين والمزيد.",
    },
  ];

  const sortedCities = [...cityData].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div dir="rtl" lang="ar" className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd data={breadcrumbSchema([
        { name: "الإمارات", url: base },
        { name: "أفضل الرعاية الصحية" },
      ])} />
      <JsonLd data={faqPageSchema(faqs)} />
      <JsonLd data={speakableSchema([".answer-block"])} />

      <Breadcrumb items={[
        { label: "الإمارات", href: "/ar" },
        { label: "أفضل الرعاية الصحية" },
      ]} />

      <div className="mb-6">
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-2">
          أفضل المنشآت الصحية في الإمارات
        </h1>
        <p className="font-['Geist',sans-serif] text-sm text-black/40">
          {totalProviders.toLocaleString("ar-AE")} منشأة في {cityData.length} مدن
          {" "}· مرتبة حسب تقييم Google · DHA / DOH / MOHAP
          {" "}· محدّث مارس 2026
        </p>
      </div>

      <div className="border-r-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 mb-8" data-answer-block="true">
        <p className="font-['Geist',sans-serif] text-black/60 leading-relaxed">
          يضم دليل الإمارات المفتوح للرعاية الصحية {totalProviders.toLocaleString("ar-AE")} منشأة صحية
          في {cityData.length} مدن بالإمارات العربية المتحدة. اختر مدينة أدناه للعثور على
          أفضل المستشفيات والعيادات وعيادات الأسنان والأطباء المتخصصين المُقيَّمين —
          جميعها مرتبة حسب تقييم Google ومتحقق منها في مقابل السجلات الحكومية الرسمية لـ
          DHA وDOH وMOHAP. آخر تحقق من البيانات مارس 2026.
        </p>
      </div>

      <section className="mb-10">
        <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">اختر مدينة</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {sortedCities.map((city) => (
            <Link
              key={city.slug}
              href={`/ar/best/${city.slug}`}
              className="block border border-black/[0.06] rounded-2xl p-5 hover:border-[#006828]/15 transition-colors group"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-bold text-[#1c1c1c] group-hover:text-[#006828] transition-colors">
                  {getArabicCityName(city.slug)}
                </h3>
                <span className="font-['Geist',sans-serif] text-xs text-black/40">{city.emirate}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-black/40">
                  {city.count.toLocaleString("ar-AE")} منشأة
                </span>
                <span className="text-black/40">
                  {city.catCount} تخصص
                </span>
              </div>
              {city.topProvider && Number(city.topProvider.googleRating) > 0 && (
                <div className="border-t border-black/[0.06] mt-3 pt-3">
                  <p className="text-[10px] text-black/40 uppercase tracking-wider mb-1">
                    الأعلى تقييماً
                  </p>
                  <p className="text-xs font-bold text-[#1c1c1c] truncate">
                    {city.topProvider.name}
                  </p>
                  <span className="bg-green-600 text-white text-[10px] font-bold px-1.5 py-0.5 mt-1 inline-block">
                    {city.topProvider.googleRating} ★
                  </span>
                </div>
              )}
            </Link>
          ))}
        </div>
      </section>

      {topCombos.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">عمليات البحث الشائعة</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {topCombos.map((combo) => (
              <Link
                key={`${combo.citySlug}-${combo.catSlug}`}
                href={`/ar/best/${combo.citySlug}/${combo.catSlug}`}
                className="block border border-black/[0.06] p-3 hover:border-[#006828]/15 transition-colors group"
              >
                <p className="text-xs font-bold text-[#1c1c1c] group-hover:text-[#006828] transition-colors">
                  أفضل {combo.catNameAr} في {combo.cityNameAr}
                </p>
                <p className="text-[11px] text-[#006828] font-bold mt-1">
                  {combo.count.toLocaleString("ar-AE")} منشأة
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <FaqSection
        faqs={faqs}
        title="أفضل الرعاية الصحية في الإمارات — أسئلة شائعة"
      />

      <section className="mb-10 mt-10">
        <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">منهجية التصنيف</h2>
        </div>
        <div className="bg-[#f8f8f6] border border-black/[0.06] p-5">
          <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed mb-3">
            يُصنِّف دليل الإمارات المفتوح للرعاية الصحية مقدمي الخدمات حسب{" "}
            <strong>تقييم Google</strong> (الأعلى أولاً)، مع استخدام{" "}
            <strong>عدد المراجعات</strong> كمعيار ثانوي. يُدرج فقط مقدمو الخدمات
            الحاصلون على تقييم أعلى من صفر في التصنيفات.
          </p>
          <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed mb-3">
            جميع بيانات مقدمي الخدمات مصدرها ثلاثة سجلات رسمية لسلطات الصحة الإماراتية:
            <strong> هيئة الصحة بدبي (DHA)</strong> و
            <strong>دائرة الصحة أبوظبي (DOH)</strong> و
            <strong>وزارة الصحة ووقاية المجتمع (MOHAP)</strong>.
          </p>
          <p className="text-[11px] text-black/40">
            هذه التصنيفات لا تُعدّ نصيحة طبية. يُرجى دائماً التحقق من الاعتمادات
            واستشارة مقدم الرعاية الصحية قبل اتخاذ أي قرارات.
          </p>
        </div>
      </section>

      <div className="mt-8 border-t border-black/[0.06] pt-4 flex items-center justify-between gap-4 flex-wrap">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>إخلاء المسؤولية:</strong> التصنيفات مبنية على تقييمات Google وعدد المراجعات المتاحة للعموم
          ولا تُعدّ توصية طبية. بيانات مقدمي الخدمات مصدرها السجلات الرسمية لـ DHA وDOH وMOHAP،
          آخر تحقق مارس 2026.
        </p>
        <Link href="/best" className="text-[11px] text-[#006828] hover:underline whitespace-nowrap">
          English version →
        </Link>
      </div>
    </div>
  );
}
