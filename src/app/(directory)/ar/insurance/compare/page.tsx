import { Metadata } from "next";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { FaqSection } from "@/components/seo/FaqSection";
import { CompareClient } from "@/components/insurance/CompareClient";
import { INSURER_PROFILES, getAllPlans } from "@/lib/insurance";
import { breadcrumbSchema, faqPageSchema, speakableSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

export const revalidate = 43200;

export function generateMetadata(): Metadata {
  const base = getBaseUrl();
  const totalPlans = getAllPlans().length;

  return {
    title: `قارن خطط التأمين الصحي في الإمارات جنباً إلى جنب | ${totalPlans} خطة، ${INSURER_PROFILES.length} شركة تأمين`,
    description: `قارن حتى 4 خطط تأمين صحي إماراتية جنباً إلى جنب. التغطية والأقساط والاشتراك وحدود الأسنان وفترات انتظار الأمومة والاستثناءات لدى ${INSURER_PROFILES.length} شركة تأمين بما فيها Daman وAXA وCigna وBupa وغيرها.`,
    alternates: {
      canonical: `${base}/ar/insurance/compare`,
      languages: {
        "en-AE": `${base}/insurance/compare`,
        "ar-AE": `${base}/ar/insurance/compare`,
      },
    },
    openGraph: {
      title: "قارن خطط التأمين الصحي في الإمارات جنباً إلى جنب",
      description: `${totalPlans} خطة عبر ${INSURER_PROFILES.length} شركة تأمين. اختر حتى 4 خطط وقارن التغطية والأقساط والاشتراك وأحجام الشبكات.`,
      url: `${base}/ar/insurance/compare`,
      type: "website",
    },
  };
}

export default function ArabicComparePage() {
  const base = getBaseUrl();
  const totalPlans = getAllPlans().length;

  const faqs = [
    {
      question: "كيف أقارن خطط التأمين الصحي في الإمارات؟",
      answer: `استخدم أداة المقارنة في دليل التأمين الصحي الإماراتي لاختيار حتى 4 خطط من ${INSURER_PROFILES.length} شركة تأمين ومقارنتها جنباً إلى جنب. تعرض الأداة الأقساط السنوية وحدود التغطية ونسب الاشتراك والحدود الفرعية للأسنان والبصريات وفترات انتظار الأمومة وأنواع الغرف والاستثناءات الرئيسية لكل خطة.`,
    },
    {
      question: "على ماذا أركز عند مقارنة خطط التأمين الصحي الإماراتية؟",
      answer: "عند مقارنة خطط التأمين الصحي في الإمارات، ركّز على: (1) القسط السنوي في مقابل حد التغطية السنوي، (2) نسبة الاشتراك في العيادات الخارجية — الفرق بين 0% و20% يتراكم بشكل ملحوظ على مدار العام، (3) الحدود الفرعية للأسنان والبصريات إن كنت بحاجة إليها، (4) فترة انتظار الأمومة — التي تتراوح بين صفر و12 شهراً، (5) فترة انتظار الحالات الصحية السابقة، (6) حجم الشبكة — كم عدد المستشفيات والعيادات التي تقبل الخطة في مدينتك، (7) مدى توافق الخطة مع متطلبات DHA أو HAAD أو MOHAP في إمارتك.",
    },
    {
      question: "ما الفرق بين التأمين الصحي الأساسي والمحسّن في الإمارات؟",
      answer: "الخطط الأساسية (2,000–6,000 درهم سنوياً) تستوفي الحد الأدنى الإلزامي لـ DHA/HAAD وتشمل التنويم والعيادات الخارجية والطوارئ، لكنها تستثني عادةً الأسنان والبصريات والصحة النفسية. الخطط المحسّنة (5,000–16,000 درهم سنوياً) تُضيف الأسنان والبصريات والأمومة والصحة النفسية مع نسب اشتراك أقل. الخطط المميزة (14,000–45,000 درهم سنوياً) تُوفر اشتراكاً صفرياً وغرفاً خاصة وتغطية دولية وحدوداً شاملة للأسنان والبصريات.",
    },
    {
      question: "هل يمكنني مقارنة خطط من شركات تأمين مختلفة؟",
      answer: `نعم. تتيح لك أداة المقارنة اختيار أي مجموعة من الخطط عبر جميع شركات التأمين الـ ${INSURER_PROFILES.length} — على سبيل المثال، مقارنة خطة Daman المحسّنة مع خطة Cigna Global Health وخطة Bupa Essential. تُعرض كل خطة بنفس الحقول الموحدة لتسهيل المقارنة.`,
    },
  ];

  return (
    <div className="container-tc py-8">
      <JsonLd
        data={breadcrumbSchema([
          { name: "الإمارات", url: `${base}/ar` },
          { name: "دليل التأمين الصحي", url: `${base}/ar/insurance` },
          { name: "مقارنة الخطط" },
        ])}
      />
      <JsonLd data={faqPageSchema(faqs)} />
      <JsonLd data={speakableSchema([".answer-block"])} />

      <Breadcrumb
        items={[
          { label: "الإمارات", href: "/ar" },
          { label: "دليل التأمين الصحي", href: "/ar/insurance" },
          { label: "مقارنة الخطط" },
        ]}
      />

      <h1 className="text-3xl font-bold text-dark mb-2">قارن خطط التأمين الصحي جنباً إلى جنب</h1>

      <div className="answer-block mb-6" data-answer-block="true">
        <p className="text-muted leading-relaxed">
          اختر حتى 4 خطط للمقارنة من بين {INSURER_PROFILES.length} شركة تأمين إماراتية.
          تشمل المقارنة الأقساط السنوية وحدود التغطية ونسب الاشتراك والحدود الفرعية للأسنان
          والبصريات وفترات انتظار الأمومة والحالات الصحية السابقة وأنواع الغرف والاستثناءات الرئيسية.
          {" "}{totalPlans} خطة متاحة عبر مستويات الأساسي والمحسّن والمميز وVIP.
        </p>
      </div>

      <CompareClient />

      {/* الأسئلة الشائعة للـ SEO */}
      <div className="mt-12">
        <FaqSection faqs={faqs} title="مقارنة التأمين الصحي في الإمارات — الأسئلة الشائعة" />
      </div>

      {/* إخلاء المسؤولية */}
      <div className="mt-8 border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-muted leading-relaxed">
          <strong>إخلاء المسؤولية:</strong> تفاصيل الخطط والأقساط المعروضة هي أرقام استرشادية مستندة إلى
          بيانات متاحة للعموم من سوق التأمين الإماراتي. احرص على الحصول على عروض أسعار شخصية من شركات
          التأمين أو الوسطاء المعتمدين. بيانات شبكات مقدمي الخدمة مصدرها الدليل الصحي المفتوح في الإمارات،
          آخر تحقق مارس 2026.
        </p>
      </div>
    </div>
  );
}
