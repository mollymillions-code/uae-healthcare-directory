import { Metadata } from "next";
import Link from "next/link";
import { FlaskConical } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { FaqSection } from "@/components/seo/FaqSection";
import { LabCard } from "@/components/labs/LabCard";
import { PackageCard } from "@/components/labs/PackageCard";
import { TestBrowser } from "@/components/labs/TestBrowser";
import {
  LAB_PROFILES,
  LAB_TESTS,
  HEALTH_PACKAGES,
  TEST_CATEGORIES,
  getLabStats,
  getPopularTests,
  getPricesForLab,
  getPackagesForLab,
  formatPrice,
} from "@/lib/labs";
import { breadcrumbSchema, faqPageSchema, speakableSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { ar } from "@/lib/i18n";

export const revalidate = 43200;

export function generateMetadata(): Metadata {
  const base = getBaseUrl();
  const stats = getLabStats();
  return {
    title:
      "مقارنة أسعار الفحوصات المخبرية في الإمارات — قارن تكاليف فحوصات الدم عبر " +
      stats.totalLabs +
      " مختبر | دليل الرعاية الصحية المفتوح في الإمارات",
    description:
      "قارن أسعار " +
      stats.totalTests +
      " فحصاً مخبرياً عبر " +
      stats.totalLabs +
      " مختبراً تشخيصياً في الإمارات. تحليل CBC من AED 69، فيتامين D من AED 85، لوحة الغدة الدرقية من AED 130. اعثر على أرخص فحص دم في دبي وأبوظبي والشارقة مع خيارات السحب المنزلي.",
    alternates: {
      canonical: `${base}/ar/labs`,
      languages: {
        "en-AE": `${base}/labs`,
        "ar-AE": `${base}/ar/labs`,
      },
    },
    openGraph: {
      title: "مقارنة أسعار الفحوصات المخبرية في الإمارات",
      description:
        `قارن ${stats.totalTests} فحصاً مخبرياً عبر ${stats.totalLabs} مختبراً في الإمارات. ` +
        `وفّر حتى 50% من خلال مقارنة الأسعار. خدمة السحب المنزلي متاحة.`,
      url: `${base}/ar/labs`,
      type: "website",
    },
  };
}

export default function ArabicLabsPage() {
  const base = getBaseUrl();
  const stats = getLabStats();
  const popularTests = getPopularTests();
  const featuredPackages = HEALTH_PACKAGES.filter(
    (p) =>
      p.id === "medsol-basic" ||
      p.id === "alborg-comprehensive" ||
      p.id === "dardoc-athome-basic" ||
      p.id === "thumbay-wellness"
  );

  const faqs = [
    {
      question: "كم تبلغ تكلفة فحص الدم في الإمارات؟",
      answer:
        "تتفاوت أسعار فحوصات الدم في الإمارات بشكل ملحوظ بحسب المختبر ونوع الفحص. يتراوح سعر تحليل CBC الأساسي بين AED 69 وAED 120 تبعاً للمختبر. تتراوح باقات الفحص الصحي الشامل بين AED 99 في المختبرات الاقتصادية كـ Medsol وAED 999 في المختبرات المتميزة كـ Unilabs. تبدأ خدمات السحب المنزلي عادةً من AED 99 للباقة الأساسية. تميل المختبرات المستقلة في مناطق كالديرة وبر دبي والكرامة إلى تقديم أسعار أوفر مقارنةً بمختبرات المستشفيات أو تلك الواقعة في DIFC ووسط مدينة دبي.",
    },
    {
      question: "هل يمكنني إجراء فحص دم في المنزل داخل الإمارات؟",
      answer:
        "نعم، خدمة سحب عينات الدم المنزلية متاحة على نطاق واسع في دبي وأبوظبي والشارقة. تزور ممرضة أو فني مختبر مرخص من DHA موقعك عادةً في غضون 30 إلى 60 دقيقة. تعمل خدمات مثل DarDoc وServiceMarket وHealthchecks360 يومياً من الساعة 7 صباحاً حتى 10 مساءً. تقدم مختبرات عديدة من بينها Thumbay وMedsol وAlpha Medical سحب المنازل مجاناً، فيما تتقاضى أخرى رسوماً تتراوح بين AED 50 وAED 100. تُسلَّم النتائج رقمياً في غضون 24 إلى 48 ساعة.",
    },
    {
      question: "أي مختبر يقدم أرخص فحوصات الدم في الإمارات؟",
      answer:
        "تُعدّ مختبرات Medsol Diagnostics وAlpha Medical Laboratory من أوفر الخيارات من حيث الأسعار في الإمارات. تبدأ باقة الفحص الصحي الأساسية في Medsol من AED 99 وتشمل CBC ولوحة الدهون والجلوكوز ووظائف الكبد والكلى. أما للفحوصات الفردية، فيقدم Medsol CBC من AED 69 وفيتامين D من AED 85. غير أن الأسعار تتباين بحسب الفحص — فبعض الفحوصات المتخصصة قد تكون أكثر اقتصادية في Thumbay Labs أو STAR Metropolis. يُنصح دائماً بالمقارنة بحسب الفحص المطلوب تحديداً.",
    },
    {
      question: "ما الفحوصات الدموية التي ينبغي إجراؤها سنوياً في الإمارات؟",
      answer:
        "للمقيمين في الإمارات، ينبغي أن تشمل الفحوصات الصحية السنوية: CBC (تعداد الدم الكامل)، لوحة الدهون (الكوليسترول)، جلوكوز الصيام وHbA1c (كشف السكري)، وظائف الكبد، وظائف الكلى، هرمون TSH للغدة الدرقية، فيتامين D (نقصه شائع في الإمارات رغم وفرة الشمس)، فيتامين B12، وفحوصات الحديد. يُنصح الرجال فوق الخمسين بإضافة PSA (كشف سرطان البروستاتا). وتستفيد النساء من فحص لوحة الغدة الدرقية والفولات وهرمونات الخصوبة عند الحاجة. تقدم معظم المختبرات باقات شاملة لهذه الفحوصات بقيمة أفضل من طلب كل فحص منفرداً.",
    },
    {
      question: "هل أحتاج إلى وصفة طبية لإجراء فحوصات المختبر في الإمارات؟",
      answer:
        "لا، تقبل معظم المختبرات التشخيصية المستقلة في الإمارات المرضى مباشرةً دون وصفة طبية لإجراء فحوصات الدم الاعتيادية. تتيح مختبرات Al Borg وThumboy وMedsol وSTAR Metropolis الفحص الذاتي دون إحالة. كما لا تستوجب خدمات السحب المنزلي كـ DarDoc وHealthchecks360 وصفةً طبية. أما الفحوصات المتخصصة (الفحوصات الجينية والخزعات) فقد تستلزم إحالة من طبيب. وتشترط مختبرات المستشفيات عادةً إحالة داخلية من أطبائها.",
    },
    {
      question: "كم يستغرق الحصول على نتائج الفحوصات المخبرية في الإمارات؟",
      answer:
        "تتفاوت أوقات التسليم بحسب نوع الفحص والمختبر. فحوصات الدم الاعتيادية (CBC، الجلوكوز، وظائف الكبد والكلى) تكون جاهزة عادةً في غضون 4 إلى 6 ساعات للمرضى الحاضرين مباشرةً. تستغرق فحوصات فيتامين D وB12 والغدة الدرقية عادةً 12 إلى 24 ساعة. الفحوصات المتخصصة (الهرمونات وعلامات الأورام ولوحات الحساسية) قد تحتاج 24 إلى 72 ساعة. تُسلِّم خدمات السحب المنزلي النتائج رقمياً في غضون 24 إلى 48 ساعة. يُتيح PureLab في أبوظبي، بفضل المعالجة بالذكاء الاصطناعي، بعض أسرع أوقات التسليم في الإمارات بـ 12 ساعة للفحوصات الاعتيادية.",
    },
  ];

  return (
    <div className="font-arabic container-tc py-8" dir="rtl" lang="ar">
      <JsonLd
        data={breadcrumbSchema([
          { name: ar.home, url: `${base}/ar` },
          { name: "مقارنة أسعار الفحوصات المخبرية" },
        ])}
      />
      <JsonLd data={speakableSchema([".answer-block"])} />
      <JsonLd data={faqPageSchema(faqs)} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "مقارنة أسعار الفحوصات المخبرية في الإمارات",
          description: `قارن أسعار ${stats.totalTests} فحصاً مخبرياً عبر ${stats.totalLabs} مختبراً تشخيصياً في الإمارات.`,
          url: `${base}/ar/labs`,
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: stats.totalTests,
            itemListElement: popularTests.slice(0, 10).map((t, i) => ({
              "@type": "ListItem",
              position: i + 1,
              item: {
                "@type": "MedicalTest",
                name: t.name,
                description: t.description,
                url: `${base}/labs/test/${t.slug}`,
              },
            })),
          },
        }}
      />

      <Breadcrumb
        items={[
          { label: ar.home, href: "/ar" },
          { label: "مقارنة أسعار الفحوصات المخبرية" },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <FlaskConical className="w-8 h-8 text-accent" />
          <h1 className="text-3xl font-bold text-dark">
            مقارنة أسعار الفحوصات المخبرية في الإمارات
          </h1>
        </div>
        <div className="answer-block mb-6" data-answer-block="true">
          <p className="text-muted leading-relaxed">
            قارن أسعار {stats.totalTests} فحصاً مخبرياً عبر {stats.totalLabs} مختبراً تشخيصياً
            في دبي وأبوظبي والشارقة وسائر أرجاء الإمارات. يتراوح سعر CBC
            بين AED 69 وAED 120 بحسب المختبر. يتراوح فيتامين D
            بين AED 85 وAED 150. وفّر حتى 50% بمقارنة الأسعار
            قبل الحجز. يوفر {stats.labsWithHomeCollection} مختبراً خدمة
            السحب المنزلي — مجاناً في كثير من الحالات.
          </p>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { value: stats.totalLabs.toString(), label: "مختبر مقارن" },
            { value: stats.totalTests.toString(), label: "فحص متتبع" },
            { value: stats.totalPackages.toString(), label: "باقات صحية" },
            { value: stats.labsWithHomeCollection.toString(), label: "مع خدمة السحب المنزلي" },
          ].map(({ value, label }) => (
            <div key={label} className="bg-light-50 p-4 text-center">
              <p className="text-2xl font-bold text-accent">{value}</p>
              <p className="text-xs text-muted">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Popular Tests */}
      <div className="section-header">
        <h2>الفحوصات الأكثر طلباً في الإمارات</h2>
        <span className="arrows">&lt;&lt;&lt;</span>
      </div>
      <div className="answer-block mb-2" data-answer-block="true">
        <p className="text-xs text-muted mb-4">
          هذه هي الفحوصات المخبرية الأكثر طلباً في الإمارات. يحتل فحص فيتامين D مكانةً بارزة
          نظراً لانتشار نقصه الواسع بين المقيمين — إذ يعاني أكثر من 80% من السكان من انخفاض
          مستوياته على الرغم من وفرة أشعة الشمس، وذلك بسبب نمط الحياة الداخلية وتغطية الملابس.
          انقر على أي فحص للاطلاع على أسعاره في جميع المختبرات.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-12">
        {popularTests.map((test) => (
          <Link
            key={test.slug}
            href={`/labs/test/${test.slug}`}
            className="flex items-center justify-between gap-4 p-4 border border-black/[0.06] hover:border-accent transition-colors group"
          >
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-dark group-hover:text-accent transition-colors">
                {test.shortName}
              </h3>
              <p className="text-[11px] text-muted line-clamp-1">{test.name}</p>
            </div>
            <div className="text-left flex-shrink-0">
              {test.priceRange && (
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
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* Labs */}
      <div className="section-header">
        <h2>المختبرات التشخيصية</h2>
        <span className="arrows">&lt;&lt;&lt;</span>
      </div>
      <div className="answer-block mb-2" data-answer-block="true">
        <p className="text-xs text-muted mb-4">
          يضم الإمارات {stats.totalLabs} مزوداً رئيسياً للمختبرات التشخيصية، من سلاسل كبرى
          كـ Al Borg Diagnostics (17 فرعاً، الشريك الحصري لـ Quest Diagnostics) إلى
          منصات خدمات منزلية كـ DarDoc التي تُحضر المختبر إلى باب منزلك. تعمل معظم المختبرات
          بترخيص من DHA (دبي) أو DOH (أبوظبي) أو MOHAP (الإمارات الشمالية)، وكثير منها
          يحمل اعتماداً دولياً من CAP.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
        {LAB_PROFILES.map((lab) => {
          const prices = getPricesForLab(lab.slug);
          const packages = getPackagesForLab(lab.slug);
          const cheapest = prices.length > 0 ? Math.min(...prices.map((p) => p.price)) : undefined;
          return (
            <LabCard
              key={lab.slug}
              lab={lab}
              testCount={prices.length}
              packageCount={packages.length}
              cheapestFrom={cheapest}
            />
          );
        })}
      </div>

      {/* Health Packages */}
      <div className="section-header">
        <h2>باقات الفحص الصحي</h2>
        <span className="arrows">&lt;&lt;&lt;</span>
      </div>
      <div className="answer-block mb-2" data-answer-block="true">
        <p className="text-xs text-muted mb-4">
          تجمع باقات الفحص الصحي عدة فحوصات بسعر مخفّض مقارنةً بطلب كل فحص على حدة.
          تبدأ الباقات الأساسية (CBC ولوحة الدهون والجلوكوز ووظائف الكبد والكلى) من AED 99
          في Medsol، فيما تتراوح باقات العافية الشاملة التي تضم فحوصات الفيتامينات والغدة
          الدرقية ومؤشرات السكري بين AED 230 وAED 499. أما الباقات التنفيذية المميزة
          التي تشمل مؤشرات القلب والأورام فتبدأ من AED 899.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        {featuredPackages.map((pkg) => (
          <PackageCard key={pkg.id} pkg={pkg} />
        ))}
      </div>

      {/* Test Categories */}
      <div className="section-header">
        <h2>تصفح حسب الفئة</h2>
        <span className="arrows">&lt;&lt;&lt;</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-12">
        {TEST_CATEGORIES.map((cat) => {
          const testCount = LAB_TESTS.filter((t) => t.category === cat.slug).length;
          return (
            <Link
              key={cat.slug}
              href={`/labs/category/${cat.slug}`}
              className="border border-black/[0.06] p-3 hover:border-accent transition-colors group"
            >
              <h3 className="text-sm font-bold text-dark mb-1 group-hover:text-accent transition-colors">{cat.name}</h3>
              <p className="text-[11px] text-muted">{testCount} فحص</p>
            </Link>
          );
        })}
      </div>

      {/* Full Test Browser */}
      <div className="section-header">
        <h2>ابحث في جميع الفحوصات البالغ عددها {stats.totalTests} فحصاً</h2>
        <span className="arrows">&lt;&lt;&lt;</span>
      </div>
      <p className="text-xs text-muted mb-4">
        ابحث عن أي فحص مخبري للاطلاع على أسعاره عبر جميع {stats.totalLabs} مختبراً.
      </p>
      <div className="mb-12">
        <TestBrowser />
      </div>

      {/* FAQ */}
      <div className="mt-12">
        <FaqSection faqs={faqs} title="الأسئلة الشائعة عن الفحوصات المخبرية في الإمارات" />
      </div>

      {/* Disclaimer */}
      <div className="mt-8 border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-muted leading-relaxed">
          <strong>إخلاء مسؤولية:</strong> الأسعار المعروضة استرشادية وتستند إلى التسعير المتاح
          للعموم من مواقع المختبرات ومنصات التجميع وقوائم أسعار الزيارات المباشرة (2024–2025).
          قد تتباين الأسعار الفعلية بحسب موقع الفرع والتغطية التأمينية والعروض الترويجية
          ومنهجية الفحص. يُرجى دائماً التأكد من الأسعار مباشرةً مع المختبر قبل الحجز.
          هذه الأداة للأغراض المعلوماتية فحسب ولا تُشكّل نصيحةً طبية.
          استشر طبيبك قبل طلب أي فحوصات مخبرية.
          البيانات مصدرها سجلات المنشآت المرخصة لدى DHA وDOH وMOHAP. آخر تحقق مارس 2026.
        </p>
      </div>

      {/* Language Switch */}
      <div className="text-center pt-4 pb-8">
        <Link href="/labs" className="text-accent text-sm hover:underline">
          View in English / عرض بالإنجليزية
        </Link>
      </div>
    </div>
  );
}
