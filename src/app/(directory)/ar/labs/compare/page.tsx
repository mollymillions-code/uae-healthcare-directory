import { Metadata } from "next";
import { Scale, CheckCircle, AlertCircle, TrendingDown, MapPin } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { FaqSection } from "@/components/seo/FaqSection";
import { LabCompareInteractive } from "@/components/labs/LabCompareInteractive";
import { LAB_PROFILES } from "@/lib/labs";
import { breadcrumbSchema, faqPageSchema, speakableSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

export const revalidate = 43200;

export function generateMetadata(): Metadata {
  const base = getBaseUrl();
  const labCount = LAB_PROFILES.length;

  return {
    title: `قارن المختبرات الإماراتية جنباً إلى جنب — أسعار الفحوصات عبر ${labCount} مختبراً | فحوصات المختبر في الإمارات`,
    description:
      `قارن أسعار الفحوصات التشخيصية عبر ${labCount} مختبراً إماراتياً جنباً إلى جنب. ` +
      `اعثر على أرخص مختبر لإجراء فحوصات CBC وVitamin D وHbA1c ولوحة الدهون ولوحة الغدة الدرقية وأكثر من 30 فحصاً آخر. ` +
      `تصفية حسب الاعتماد (CAP، JCI) وتوافر السحب المنزلي والمدينة.`,
    alternates: {
      canonical: `${base}/ar/labs/compare`,
      languages: {
        "en-AE": `${base}/labs/compare`,
        "ar-AE": `${base}/ar/labs/compare`,
      },
    },
    openGraph: {
      title: `قارن ${labCount} مختبراً إماراتياً جنباً إلى جنب — اعثر على أرخص مختبر`,
      description:
        `مقارنة جنباً إلى جنب لأسعار ${labCount} مختبراً تشخيصياً في الإمارات. ` +
        `تعرف على المختبر الذي يقدم أفضل سعر لكل فحص ووفّر حتى 60%.`,
      url: `${base}/ar/labs/compare`,
      type: "website",
    },
  };
}

const faqs = [
  {
    question: "كيف أقارن أسعار المختبرات في الإمارات؟",
    answer:
      "حدد من 2 إلى 4 مختبرات باستخدام مربعات الاختيار في أداة المقارنة أعلاه. ستعرض الجداول تلقائياً أسعار جميع الفحوصات المشتركة بين المختبرات المحددة، مع تمييز أرخص سعر باللون الأخضر. يمكنك مقارنة ما يصل إلى 4 مختبرات في آنٍ واحد عبر أكثر من 30 فحصاً روتينياً.",
  },
  {
    question: "ما الذي يجب مراعاته عند اختيار مختبر في الإمارات؟",
    answer:
      "بالإضافة إلى السعر، انتبه إلى أربعة عوامل: (1) الاعتماد — تتبع المختبرات المعتمدة من CAP (كلية علماء الأمريكيين في أمراض الباثولوجيا) ومن JCI بروتوكولات معيارية دولية تقلل من معدلات الخطأ. (2) وقت الاستجابة — قد تستدعي النتائج العاجلة استلامها في نفس اليوم. (3) السحب المنزلي — تقدم عدة مختبرات إماراتية كـDarDoc وPureLab وThumbay Labs سحباً منزلياً مجانياً أو بتكلفة منخفضة، مما يوفر الوقت. (4) الجهة التنظيمية — مختبرات دبي مرخصة من DHA، ومختبرات أبوظبي من DOH، وبقية الإمارات من MOHAP.",
  },
  {
    question: "هل المختبر الأرخص دائماً هو الخيار الأفضل؟",
    answer:
      "ليس بالضرورة. تعكس فوارق الأسعار في الإمارات في الغالب تكاليف الاعتماد وجودة المعدات ومعايير إعداد التقارير، وليس دقة الفحص وحدها. بالنسبة للمتابعة الروتينية (كـHbA1c والكوليسترول)، يكفي مختبر اقتصادي معتمد وفق معيار ISO 15189. أما لأطباق الفحص المعقدة وعلامات السرطان والفحوصات المرجعية، فإن مختبراً معتمداً من CAP أو JCI كـAl Borg Diagnostics أو NRL يستحق التكلفة الإضافية. تأكد دائماً من أن المختبر الذي تختاره مرخص من الجهة الصحية المختصة في الإمارات (DHA أو DOH أو MOHAP).",
  },
  {
    question: "هل تتفاوت أسعار المختبرات بحسب موقع الفرع في الإمارات؟",
    answer:
      "نعم. تفرض مختبرات التشخيص في الإمارات عادةً أسعاراً مختلفة بين الفروع، ولا سيما بين مواقع دبي وأبوظبي، أو بين الفروع الموجودة في المراكز التجارية وتلك التابعة للمستشفيات. الأسعار الواردة في أداة المقارنة هذه هي أسعار استرشادية عامة — اتصل دائماً بالفرع المحدد الذي تنوي زيارته للتحقق من الأسعار الحالية قبل حجز موعدك.",
  },
  {
    question: "هل يغطي التأمين الصحي في الإمارات الفحوصات المخبرية في جميع المختبرات؟",
    answer:
      "تعتمد تغطية التأمين على خطتك ووضع المختبر ضمن الشبكة. تغطي خطة التأمين الصحي الأساسية الإلزامية في دبي (خطة المزايا الأساسية لـDHA) قائمة محددة من الفحوصات التشخيصية في المختبرات ضمن الشبكة. تمتلك Thiqa (مواطنو أبوظبي) وDaman (المقيمون) قوائم شبكة خاصة بهم. كما أن المختبرات التابعة للمستشفيات — كتلك الموجودة في Aster وMediclinic وCleveland Clinic Abu Dhabi — أكثر انتشاراً ضمن الشبكة. قد تكون مختبرات الخدمة المنزلية كـDarDoc مشمولة أو غير مشمولة بالتأمين؛ تحقق مباشرة مع شركة التأمين قبل الحجز.",
  },
];

export default function ArabicLabComparePage() {
  const base = getBaseUrl();
  const labCount = LAB_PROFILES.length;

  return (
    <div className="font-arabic container-tc py-8" dir="rtl">
      {/* Schema.org */}
      <JsonLd
        data={breadcrumbSchema([
          { name: "الإمارات", url: base },
          { name: "مقارنة الفحوصات المخبرية", url: `${base}/ar/labs` },
          { name: "قارن المختبرات", url: `${base}/ar/labs/compare` },
        ])}
      />
      <JsonLd data={speakableSchema([".answer-block"])} />
      <JsonLd data={faqPageSchema(faqs)} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "أداة مقارنة أسعار المختبرات في الإمارات",
          url: `${base}/ar/labs/compare`,
          description: `أداة تفاعلية لمقارنة أسعار الفحوصات المخبرية التشخيصية عبر ${labCount} مختبراً إماراتياً جنباً إلى جنب.`,
          applicationCategory: "HealthApplication",
          operatingSystem: "Web",
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "AED",
          },
        }}
      />

      <Breadcrumb
        items={[
          { label: "الإمارات", href: "/ar" },
          { label: "مقارنة الفحوصات المخبرية", href: "/ar/labs" },
          { label: "قارن المختبرات" },
        ]}
      />

      {/* Hero */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <Scale className="w-8 h-8 text-accent" />
          <h1 className="text-3xl font-bold text-dark">
            قارن المختبرات الإماراتية جنباً إلى جنب
          </h1>
        </div>

        <div className="answer-block" data-answer-block="true">
          <p className="text-muted leading-relaxed mb-4">
            تضم الإمارات {labCount} شبكة مختبرات تشخيصية رئيسية تشغّل مئات الفروع في دبي وأبوظبي
            والشارقة وعجمان والفجيرة ورأس الخيمة. قد تتفاوت أسعار الفحص الواحد بنسبة تصل
            إلى <strong>40–60%</strong> بين المختبرات، مما يجعل المقارنة ضرورة قبل الحجز.
            استخدم الأداة أدناه لتحديد 2–4 مختبرات ورؤية تفصيل أسعار جنباً إلى جنب لكل
            فحص مشترك.
          </p>
        </div>
      </div>

      {/* Why Compare Section */}
      <div className="mb-8">
        <div className="section-header">
          <h2>لماذا تُعدّ مقارنة أسعار المختبرات مهمة في الإمارات؟</h2>
          <span className="arrows">&gt;&gt;&gt;</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-light-50 border border-black/[0.06] p-4">
            <TrendingDown className="w-5 h-5 text-accent mb-2" />
            <p className="text-xs font-bold text-dark mb-1">تفاوت في الأسعار يصل إلى 60%</p>
            <p className="text-[11px] text-muted leading-relaxed">
              قد يكلف نفس فحص CBC ما بين AED 30 في مختبر وAED 85 في آخر. المقارنة توفر
              مالاً حقيقياً، لا سيما للفحوصات الروتينية السنوية.
            </p>
          </div>
          <div className="bg-light-50 border border-black/[0.06] p-4">
            <CheckCircle className="w-5 h-5 text-accent mb-2" />
            <p className="text-xs font-bold text-dark mb-1">اختلافات في الاعتماد</p>
            <p className="text-[11px] text-muted leading-relaxed">
              تتبع المختبرات المعتمدة من CAP معايير الجودة الدولية مع اختبارات الكفاءة
              الإلزامية. معلومة مفيدة لأطباق الفحص المعقدة أو الإحالات المتخصصة.
            </p>
          </div>
          <div className="bg-light-50 border border-black/[0.06] p-4">
            <MapPin className="w-5 h-5 text-accent mb-2" />
            <p className="text-xs font-bold text-dark mb-1">خدمة السحب المنزلي</p>
            <p className="text-[11px] text-muted leading-relaxed">
              تقدم مختبرات إماراتية متعددة سحباً منزلياً للدم — بعضها مجاناً. مثالي
              لفحوصات الصيام التي تستدعي سحب العينة باكراً مع تجنب عناء التنقل.
            </p>
          </div>
          <div className="bg-light-50 border border-black/[0.06] p-4">
            <AlertCircle className="w-5 h-5 text-accent mb-2" />
            <p className="text-xs font-bold text-dark mb-1">وضع التأمين ضمن الشبكة</p>
            <p className="text-[11px] text-muted leading-relaxed">
              ليس كل مختبر ضمن شبكة كل خطة صحية في الإمارات. تميل المختبرات التابعة
              للمستشفيات إلى تغطية تأمينية أوسع مقارنة بالسلاسل المستقلة.
            </p>
          </div>
        </div>

        <div className="answer-block" data-answer-block="true">
          <p className="text-sm text-muted leading-relaxed">
            <strong>كيف تعمل هذه الأداة:</strong> حدد أياً من {labCount} مختبراً مدرجاً أدناه
            (من 2 إلى 4 مختبرات). تعرض جداول المقارنة تلقائياً الأسعار جنباً إلى جنب للفحوصات
            المتاحة في جميع المختبرات المحددة، مع تمييز الخيار الأرخص باللون الأخضر. الأسعار
            هي معدلات عامة استرشادية اعتباراً من مارس 2026 — تأكد مع المختبر قبل الحجز.
          </p>
        </div>
      </div>

      {/* Interactive comparison tool — client component */}
      <div>
        <p className="text-sm font-bold text-dark mb-4">اختر المختبرات للمقارنة</p>
        <LabCompareInteractive />
      </div>

      {/* FAQ */}
      <div className="mt-12">
        <FaqSection
          faqs={faqs}
          title="مقارنة المختبرات في الإمارات — الأسئلة الشائعة"
        />
      </div>

      {/* Disclaimer */}
      <div className="mt-8 border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-muted leading-relaxed">
          <strong>إخلاء المسؤولية:</strong> الأسعار المعروضة استرشادية ومستقاة من قوائم
          الأسعار المتاحة للعموم ومنصات التجميع والتواصل المباشر مع المختبرات اعتباراً من
          مارس 2026. قد تتفاوت الأسعار بحسب الفرع والوضع التأميني والعروض الترويجية
          الجارية. هذه الأداة للأغراض الإعلامية والمقارنية فحسب ولا تُعدّ نصيحة طبية.
          تأكد دائماً من الأسعار الحالية وتغطية التأمين مباشرة مع المختبر قبل الحجز.
        </p>
      </div>
    </div>
  );
}
