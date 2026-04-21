import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { FaqSection } from "@/components/seo/FaqSection";
import {
  TEST_CATEGORIES,
  LAB_TESTS,
  getTestsByCategory,
  getPriceRange,
  formatPrice,
  type TestCategory,
} from "@/lib/labs";
import { breadcrumbSchema, faqPageSchema, speakableSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { ar } from "@/lib/i18n";

export const revalidate = 43200;

export function generateStaticParams() {
  return TEST_CATEGORIES.map((cat) => ({ category: cat.slug }));
}

export function generateMetadata({
  params,
}: {
  params: { category: string };
}): Metadata {
  const cat = TEST_CATEGORIES.find((c) => c.slug === params.category);
  if (!cat) return { title: "الفئة غير موجودة" };

  const base = getBaseUrl();
  const tests = getTestsByCategory(cat.slug as TestCategory);
  const prices = tests.map((t) => getPriceRange(t.slug)).filter(Boolean);
  const cheapest =
    prices.length > 0 ? Math.min(...prices.map((p) => p!.min)) : null;

  return {
    title: `فحوصات ${cat.name} في الإمارات — قارن ${tests.length} فحصاً عبر المختبرات | دليل الرعاية الصحية المفتوح`,
    description:
      `قارن ${tests.length} فحصاً من فئة ${cat.name} عبر المختبرات التشخيصية في الإمارات. ` +
      `${cheapest ? `تبدأ الأسعار من AED ${cheapest}. ` : ""}` +
      `اعثر على أرخص فحوصات ${cat.name} في دبي وأبوظبي والشارقة مع خيارات السحب المنزلي.`,
    alternates: {
      canonical: `${base}/ar/labs/category/${cat.slug}`,
      languages: {
        "en-AE": `${base}/labs/category/${cat.slug}`,
        "ar-AE": `${base}/ar/labs/category/${cat.slug}`,
      },
    },
    openGraph: {
      title: `فحوصات ${cat.name} — قارن الأسعار عبر مختبرات الإمارات`,
      description: `${tests.length} فحصاً من فئة ${cat.name} مقارنةً عبر مختبرات الإمارات. ${cheapest ? `من AED ${cheapest}.` : ""}`,
      url: `${base}/ar/labs/category/${cat.slug}`,
      type: "website",
    },
  };
}

export default function ArabicTestCategoryPage({
  params,
}: {
  params: { category: string };
}) {
  const cat = TEST_CATEGORIES.find((c) => c.slug === params.category);
  if (!cat) notFound();

  const base = getBaseUrl();
  const tests = getTestsByCategory(cat.slug as TestCategory);

  // Build price data for each test
  const testsWithPrices = tests.map((test) => {
    const range = getPriceRange(test.slug);
    return { ...test, priceRange: range };
  });

  const totalPricePoints = testsWithPrices.filter((t) => t.priceRange).length;
  const cheapestOverall = testsWithPrices
    .filter((t) => t.priceRange)
    .reduce<number | null>(
      (min, t) =>
        min === null || t.priceRange!.min < min ? t.priceRange!.min : min,
      null
    );

  const faqs = [
    {
      question: `كم عدد فحوصات ${cat.name} المتاحة في الإمارات؟`,
      answer:
        `يتم تتبع ${tests.length} فحصاً من فئة ${cat.name} عبر المختبرات التشخيصية في الإمارات ` +
        `ضمن دليل الرعاية الصحية المفتوح. تشمل هذه الفحوصات: ` +
        `${tests.slice(0, 4).map((t) => t.shortName).join("، ")}${tests.length > 4 ? "، وغيرها" : ""}. ` +
        `تتفاوت الأسعار والتوافر بحسب المختبر.`,
    },
    {
      question: `كم تبلغ تكلفة فحوصات ${cat.name} في الإمارات؟`,
      answer:
        cheapestOverall !== null
          ? `تبدأ أسعار فحوصات ${cat.name} في الإمارات من AED ${cheapestOverall}. ` +
            `تتفاوت الأسعار بشكل ملحوظ بين المختبرات — فمقارنة ${totalPricePoints} نقطة سعر متاحة ` +
            `قد توفر لك ما يصل إلى 50%. تقدم المختبرات الاقتصادية كـ Medsol وAlpha Medical ` +
            `عموماً الأسعار الأوفر، بينما تتقاضى المختبرات المتميزة كـ Unilabs أسعاراً أعلى ` +
            `مقابل الاعتماد الدولي والتشخيصات المتقدمة.`
          : `تتفاوت أسعار فحوصات ${cat.name} بحسب المختبر. قارن الأسعار عبر مختبرات الإمارات في هذه الصفحة.`,
    },
    {
      question: `هل أحتاج إلى إحالة طبية لإجراء فحوصات ${cat.name}؟`,
      answer:
        `تقبل معظم المختبرات التشخيصية المستقلة في الإمارات المرضى مباشرةً دون وصفة طبية لإجراء فحوصات ${cat.name} ` +
        `الاعتيادية. تتيح مختبرات Al Borg وThumboy وMedsol وSTAR Metropolis الفحص الذاتي دون إحالة. ` +
        `كما لا تستوجب خدمات السحب المنزلي وصفةً طبية لمعظم الفحوصات. ` +
        `بعض الفحوصات المتخصصة قد تستلزم إحالة من طبيب.`,
    },
    {
      question: `هل يمكنني إجراء فحوصات ${cat.name} في المنزل داخل الإمارات؟`,
      answer:
        `نعم، خدمة سحب عينات الدم المنزلية متاحة على نطاق واسع في دبي وأبوظبي والشارقة ` +
        `لمعظم فحوصات ${cat.name}. ` +
        `تُرسل خدمات مثل DarDoc وHealthchecks360 وServiceMarket ممرضين مرخصين من DHA إلى موقعك. ` +
        `توفر مختبرات عديدة من بينها Thumbay وMedsol السحب المنزلي مجاناً. ` +
        `تُسلَّم النتائج رقمياً في غضون 24 إلى 48 ساعة.`,
    },
  ];

  return (
    <div className="font-arabic container-tc py-8" dir="rtl" lang="ar">
      <JsonLd
        data={breadcrumbSchema([
          { name: ar.home, url: `${base}/ar` },
          { name: "مقارنة أسعار الفحوصات المخبرية", url: `${base}/ar/labs` },
          { name: `فحوصات ${cat.name}` },
        ])}
      />
      <JsonLd data={speakableSchema([".answer-block"])} />
      <JsonLd data={faqPageSchema(faqs)} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: `فحوصات ${cat.name} — أسعار المختبرات في الإمارات`,
          description: `قارن ${tests.length} فحصاً من فئة ${cat.name} عبر المختبرات التشخيصية في الإمارات.`,
          url: `${base}/ar/labs/category/${cat.slug}`,
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: tests.length,
            itemListElement: testsWithPrices.slice(0, 20).map((t, i) => ({
              "@type": "ListItem",
              position: i + 1,
              item: {
                "@type": "MedicalTest",
                name: t.name,
                description: t.description,
                url: `${base}/labs/test/${t.slug}`,
                ...(t.priceRange
                  ? {
                      offers: {
                        "@type": "AggregateOffer",
                        lowPrice: t.priceRange.min,
                        highPrice: t.priceRange.max,
                        priceCurrency: "AED",
                        offerCount: t.priceRange.labCount,
                      },
                    }
                  : {}),
              },
            })),
          },
        }}
      />

      <Breadcrumb
        items={[
          { label: ar.home, href: "/ar" },
          { label: "مقارنة أسعار الفحوصات المخبرية", href: "/ar/labs" },
          { label: `فحوصات ${cat.name}` },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-dark mb-3">
          فحوصات {cat.name} في الإمارات — قارن الأسعار عبر المختبرات
        </h1>
        <div className="answer-block mb-6" data-answer-block="true">
          <p className="text-muted leading-relaxed">
            قارن أسعار {tests.length} فحصاً من فئة {cat.name} عبر
            المختبرات التشخيصية في دبي وأبوظبي والشارقة وسائر أرجاء الإمارات.
            {cheapestOverall !== null && (
              <>
                {" "}تبدأ الأسعار من <strong>AED {cheapestOverall}</strong>.
                وفّر ما يصل إلى 50% بمقارنة المختبرات قبل الحجز.
              </>
            )}{" "}
            تقبل معظم المختبرات المرضى مباشرةً دون وصفة طبية، وكثير منها
            يوفر خدمة السحب المنزلي.
          </p>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-light-50 p-4 text-center">
            <p className="text-2xl font-bold text-accent">{tests.length}</p>
            <p className="text-xs text-muted">فحص متتبع</p>
          </div>
          {cheapestOverall !== null && (
            <div className="bg-light-50 p-4 text-center">
              <p className="text-2xl font-bold text-accent">
                AED {cheapestOverall}
              </p>
              <p className="text-xs text-muted">تبدأ من</p>
            </div>
          )}
          <div className="bg-light-50 p-4 text-center">
            <p className="text-2xl font-bold text-accent">{totalPricePoints}</p>
            <p className="text-xs text-muted">نقاط أسعار</p>
          </div>
          <div className="bg-light-50 p-4 text-center">
            <p className="text-2xl font-bold text-accent">12+</p>
            <p className="text-xs text-muted">مختبر مقارن</p>
          </div>
        </div>
      </div>

      {/* All tests in this category */}
      <div className="section-header">
        <h2>جميع فحوصات {cat.name}</h2>
        <span className="arrows">&lt;&lt;&lt;</span>
      </div>
      <div className="answer-block mb-4" data-answer-block="true">
        <p className="text-xs text-muted">
          انقر على أي فحص أدناه للاطلاع على مقارنة كاملة للأسعار عبر جميع
          مختبرات الإمارات، وخيارات السحب المنزلي، وتعليمات التحضير.
        </p>
      </div>
      <div className="space-y-2 mb-12">
        {testsWithPrices.map((test) => (
          <Link
            key={test.slug}
            href={`/labs/test/${test.slug}`}
            className="flex items-center justify-between gap-4 p-4 border border-black/[0.06] hover:border-accent transition-colors group"
          >
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-dark group-hover:text-accent transition-colors">
                {test.shortName}
              </h3>
              <p className="text-[11px] text-muted line-clamp-1">
                {test.name}
              </p>
              <p className="text-[11px] text-muted mt-1 line-clamp-1">
                {test.description}
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {test.fastingRequired && (
                  <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 font-medium">
                    يُشترط الصيام
                  </span>
                )}
                <span className="text-[10px] bg-light-100 text-dark px-1.5 py-0.5 font-medium capitalize">
                  {test.sampleType}
                </span>
                <span className="text-[10px] bg-light-100 text-dark px-1.5 py-0.5 font-medium">
                  النتائج خلال {test.turnaroundHours} ساعة
                </span>
              </div>
            </div>
            <div className="text-left flex-shrink-0">
              {test.priceRange ? (
                <>
                  <p className="text-sm font-bold text-accent">
                    {formatPrice(test.priceRange.min)}
                  </p>
                  {test.priceRange.min !== test.priceRange.max && (
                    <p className="text-[10px] text-muted">
                      – {formatPrice(test.priceRange.max)}
                    </p>
                  )}
                  <p className="text-[10px] text-muted">
                    {test.priceRange.labCount} مختبرات
                  </p>
                </>
              ) : (
                <p className="text-[10px] text-muted">تواصل مع المختبرات</p>
              )}
              <ArrowRight className="w-4 h-4 text-muted group-hover:text-accent transition-colors ml-auto mt-1" />
            </div>
          </Link>
        ))}
      </div>

      {/* Other categories */}
      <div className="section-header">
        <h2>فئات الفحوصات الأخرى</h2>
        <span className="arrows">&lt;&lt;&lt;</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-12">
        {TEST_CATEGORIES.filter((c) => c.slug !== cat.slug).map((c) => {
          const count = LAB_TESTS.filter((t) => t.category === c.slug).length;
          return (
            <Link
              key={c.slug}
              href={`/ar/labs/category/${c.slug}`}
              className="border border-black/[0.06] p-3 hover:border-accent transition-colors group"
            >
              <h3 className="text-sm font-bold text-dark group-hover:text-accent transition-colors">
                {c.name}
              </h3>
              <p className="text-[11px] text-muted">{count} فحص في هذه الفئة</p>
            </Link>
          );
        })}
      </div>

      {/* FAQ */}
      <div className="mt-12">
        <FaqSection
          faqs={faqs}
          title={`فحوصات ${cat.name} في الإمارات — الأسئلة الشائعة`}
        />
      </div>

      {/* Disclaimer */}
      <div className="mt-8 border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-muted leading-relaxed">
          <strong>إخلاء مسؤولية:</strong> أسعار فحوصات {cat.name} استرشادية
          وتستند إلى البيانات المتاحة للعموم من المختبرات التشخيصية في الإمارات.
          قد تتباين الأسعار الفعلية بحسب موقع الفرع والتغطية التأمينية
          والعروض الترويجية. هذه المعلومات للمقارنة فحسب ولا تُشكّل نصيحةً طبية.
          استشر طبيبك لتحديد الفحوصات المناسبة لحالتك.
          البيانات مصدرها المنشآت المرخصة لدى DHA وDOH وMOHAP. آخر تحقق مارس 2026.
        </p>
      </div>

      {/* Language Switch */}
      <div className="text-center pt-4 pb-8">
        <Link
          href={`/labs/category/${cat.slug}`}
          className="text-accent text-sm hover:underline"
        >
          View in English / عرض بالإنجليزية
        </Link>
      </div>
    </div>
  );
}
