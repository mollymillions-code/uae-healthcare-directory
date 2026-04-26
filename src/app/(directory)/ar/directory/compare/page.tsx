import { Metadata } from "next";
import Link from "next/link";
import { GitCompareArrows, MapPin, Layers } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { FaqSection } from "@/components/seo/FaqSection";
import { breadcrumbSchema, faqPageSchema, speakableSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { getCities, getProviderCountByCity } from "@/lib/data";
import { getArabicCityName } from "@/lib/i18n";
import {
  getAllCityPairSlugs,
  getAllCategoryComparisonSlugs,
} from "@/lib/compare";

export const revalidate = 43200;
export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  const base = getBaseUrl();
  const cityPairCount = getAllCityPairSlugs().length;
  const catCompCount = getAllCategoryComparisonSlugs().length;
  const totalPages = cityPairCount + catCompCount;

  const title = `مقارنة الرعاية الصحية في الإمارات: ${totalPages} مقارنة بين المدن والتخصصات | دليل الإمارات المفتوح`;
  const description =
    "مقارنات صحية جنباً إلى جنب عبر مدن الإمارات الثماني. قارن عدد مقدمي الخدمات والتقييمات المتوسطة وتكاليف الاستشارة والجهات التنظيمية وأفضل مزودي الخدمة بين دبي وأبوظبي والشارقة وغيرها.";

  return {
    title,
    description,
    alternates: {
      canonical: `${base}/ar/directory/compare`,
      languages: {
        "en-AE": `${base}/directory/compare`,
        "ar-AE": `${base}/ar/directory/compare`,
        "x-default": `${base}/directory/compare`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${base}/ar/directory/compare`,
      type: "website",
      locale: "ar_AE",
    },
  };
}

const faqs = [
  {
    question: "كيف تختلف الرعاية الصحية في دبي عن أبوظبي؟",
    answer:
      "دبي وأبوظبي هما أكبر سوقين للرعاية الصحية في الإمارات. تُنظِّم هيئة الصحة بدبي (DHA) الخدمات في دبي التي تتميز بأعلى كثافة لمقدمي الخدمة، مع رسوم استشارة طبيب عام تتراوح بين 150-300 درهم. تُنظِّم دائرة الصحة (DOH) في أبوظبي مع رسوم تتراوح بين 100-250 درهم. كلا الإمارتين يُلزمان بالتأمين الصحي من صاحب العمل. تتمتع دبي بكثافة أعلى من العيادات المتخصصة الخاصة، بينما تضم أبوظبي مراكز طبية أكاديمية كبرى مثل كليفلاند كلينك أبوظبي.",
  },
  {
    question: "أي إمارة توفر رعاية صحية أرخص؟",
    answer:
      "تتميز إمارات الشمال (عجمان ورأس الخيمة والفجيرة وأم القيوين) عموماً بأدنى رسوم استشارة، حيث تتراوح تكلفة زيارة طبيب عام بين 80-200 درهم مقارنةً بـ 150-300 درهم في دبي. الشارقة في منتصف المدى عادةً (100-200 درهم). لكن التكلفة المنخفضة قد تعني خيارات أقل للتخصصات. دبي وأبوظبي لديهما أوسع نطاق من مقدمي التخصصات والمجموعات الطبية الدولية.",
  },
  {
    question: "أي إمارة لديها أعلى تقييمات لمقدمي الرعاية الصحية؟",
    answer:
      "تمتلك دبي وأبوظبي عادةً أعلى متوسطات تقييمات Google نظراً لتركّز مجموعات المستشفيات الدولية (ميدكلينك وأستر وكليفلاند كلينك وNMC). لكن هناك مقدمين متميزين في كل إمارة. استخدم صفحات مقارنة المدينة بمدينة لمعرفة متوسطات التقييمات الفعلية وأبرز مزودي الخدمة في كل مدينة.",
  },
  {
    question: "ما الفرق بين المستشفيات والعيادات في الإمارات؟",
    answer:
      "المستشفيات في الإمارات منشآت كبرى تضم أسرة للمرضى الداخليين وأقسام طوارئ وغرف عمليات وتخصصات متعددة تحت سقف واحد، بتكاليف استشارة تتراوح بين 300-800 درهم في دبي. العيادات (المتعددة التخصصات) منشآت خارجية تركز على الاستشارات الأولية والمتخصصة برسوم طبيب عام 150-300 درهم في دبي. المستشفيات ضرورية للجراحات وعلاج الحالات الحرجة والتشخيص المتقدم. العيادات تتولى الفحوصات الروتينية والإجراءات البسيطة والاستشارات المتخصصة.",
  },
];

export default async function ArCompareHubPage() {
  const base = getBaseUrl();
  const cities = getCities();
  const cityPairs = getAllCityPairSlugs();
  const catComps = getAllCategoryComparisonSlugs();
  const totalPages = cityPairs.length + catComps.length;
  const cityCounts = await Promise.all(cities.map((c) => getProviderCountByCity(c.slug)));
  const cityCountMap = Object.fromEntries(cities.map((c, i) => [c.slug, cityCounts[i]]));
  const totalProviders = cityCounts.reduce((sum, count) => sum + count, 0);

  return (
    <div dir="rtl" lang="ar" className="font-arabic max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd
        data={breadcrumbSchema([
          { name: "الإمارات", url: base },
          { name: "الدليل", url: `${base}/ar/directory` },
          { name: "مقارنة الرعاية الصحية", url: `${base}/ar/directory/compare` },
        ])}
      />
      <JsonLd data={speakableSchema([".answer-block"])} />
      <JsonLd data={faqPageSchema(faqs)} />

      <Breadcrumb
        items={[
          { label: "الإمارات", href: "/ar" },
          { label: "الدليل", href: "/ar/directory" },
          { label: "مقارنة الرعاية الصحية" },
        ]}
      />

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <GitCompareArrows className="w-8 h-8 text-[#006828]" />
          <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight">
            مقارنة الرعاية الصحية في الإمارات: مدينة مقابل مدينة ومقارنات التخصصات
          </h1>
        </div>

        <div className="border-r-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6" data-answer-block="true">
          <p className="font-['Geist',sans-serif] text-black/60 leading-relaxed">
            وفقاً لدليل الإمارات المفتوح للرعاية الصحية، يوجد{" "}
            {totalProviders.toLocaleString("ar-AE")}+ مقدم رعاية صحية مرخص في
            8 مدن إماراتية. تُنظِّم الرعاية الصحية في الإمارات ثلاث جهات:
            هيئة الصحة بدبي (DHA) ودائرة الصحة أبوظبي (DOH) ووزارة الصحة ووقاية المجتمع
            (MOHAP). تتباين التكاليف وتوافر مقدمي الخدمة واشتراطات التأمين والجودة تبايناً
            ملحوظاً بين الإمارات. تقدم هذه الصفحة {totalPages}{" "}
            مقارنة مدعومة بالبيانات جنباً إلى جنب لمساعدة المرضى والأسر وأصحاب العمل
            في اتخاذ قرارات مستنيرة بشأن مكان الحصول على الرعاية. جميع البيانات مصدرها
            السجلات الحكومية الرسمية وتقييمات Google Maps، آخر تحقق مارس 2026.
          </p>
        </div>
      </div>

      <div className="mb-10">
        <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
            <MapPin className="inline w-5 h-5 ml-1 text-[#006828]" />
            مدينة مقابل مدينة ({cityPairs.length.toLocaleString("ar-AE")} مقارنة)
          </h2>
        </div>
        <p className="font-['Geist',sans-serif] text-sm text-black/40 mb-4">
          قارن المنظومات الصحية وعدد مقدمي الخدمة ومتوسط التقييمات وتكاليف الاستشارة
          وأبرز مقدمي الخدمة بين أي مدينتين في الإمارات.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0">
          {cityPairs.map((pair) => {
            const cityA = cities.find((c) => c.slug === pair.cityASlug);
            const cityB = cities.find((c) => c.slug === pair.cityBSlug);
            if (!cityA || !cityB) return null;
            const countA = cityCountMap[cityA.slug] ?? 0;
            const countB = cityCountMap[cityB.slug] ?? 0;
            return (
              <Link
                key={pair.slug}
                href={`/ar/directory/compare/${pair.slug}`}
                className="flex items-center justify-between py-3 px-3 border-b border-black/[0.06] hover:bg-[#f8f8f6] transition-colors group"
              >
                <span className="text-sm font-medium text-[#1c1c1c] group-hover:text-[#006828] transition-colors">
                  {getArabicCityName(cityA.slug)} مقابل {getArabicCityName(cityB.slug)}
                </span>
                <span className="font-['Geist',sans-serif] text-xs text-black/40 whitespace-nowrap">
                  {(countA + countB).toLocaleString("ar-AE")} منشأة
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="mb-10">
        <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
            <Layers className="inline w-5 h-5 ml-1 text-[#006828]" />
            مستشفيات مقابل عيادات ({catComps.length.toLocaleString("ar-AE")} مقارنة)
          </h2>
        </div>
        <p className="font-['Geist',sans-serif] text-sm text-black/40 mb-4">
          قارن المستشفيات والعيادات داخل المدينة ذاتها: عدد مقدمي الخدمة
          والتكاليف والتقييمات ومتى تختار أحدهما على الآخر.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0">
          {catComps.map((comp) => {
            const city = cities.find((c) => c.slug === comp.citySlug);
            if (!city) return null;
            return (
              <Link
                key={comp.slug}
                href={`/ar/directory/compare/${comp.slug}`}
                className="flex items-center justify-between py-3 px-3 border-b border-black/[0.06] hover:bg-[#f8f8f6] transition-colors group"
              >
                <span className="text-sm font-medium text-[#1c1c1c] group-hover:text-[#006828] transition-colors">
                  مستشفيات مقابل عيادات في {getArabicCityName(city.slug)}
                </span>
                <span className="font-['Geist',sans-serif] text-xs text-black/40 whitespace-nowrap">
                  مقارنة ←
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="mt-12">
        <FaqSection faqs={faqs} title="أسئلة شائعة حول مقارنة الرعاية الصحية" />
      </div>

      <div className="mt-8 border-t border-black/[0.06] pt-4 flex items-center justify-between gap-4 flex-wrap">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>إخلاء المسؤولية:</strong> جميع أعداد مقدمي الخدمة والتقييمات وتقديرات التكاليف مبنية على بيانات من سجلات
          سلطات الصحة الإماراتية الرسمية (DHA وDOH وMOHAP) وخرائط Google، آخر تحقق مارس 2026.
          رسوم الاستشارة تقديرية وقد تتفاوت. هذه المعلومات للمقارنة والتعليم فحسب ولا تُعدّ نصيحة طبية.
        </p>
        <Link href="/directory/compare" className="text-[11px] text-[#006828] hover:underline whitespace-nowrap">
          English →
        </Link>
      </div>
    </div>
  );
}
