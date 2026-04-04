import { Metadata } from "next";
import Link from "next/link";
import {
  ShieldOff,
  Plane,
  Globe,
  PiggyBank,
  Crown,
  Baby,
  ArrowRight,
  BookOpen,
} from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { FaqSection } from "@/components/seo/FaqSection";
import { PRICING_GUIDES } from "@/lib/constants/pricing-guides";
import { CITIES } from "@/lib/constants/cities";
import { breadcrumbSchema, speakableSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { getArabicCityName } from "@/lib/i18n";

export const revalidate = 43200;

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  ShieldOff,
  Plane,
  Globe,
  PiggyBank,
  Crown,
  Baby,
};

const GUIDE_NAME_AR: Record<string, string> = {
  "without-insurance": "الرعاية الصحية بدون تأمين",
  "for-tourists": "للسياح والزوار",
  "for-expats": "للمقيمين الوافدين",
  "budget-healthcare": "الرعاية الصحية الاقتصادية",
  "premium-healthcare": "الرعاية الصحية المتميزة",
  "maternity-costs": "تكاليف الأمومة والولادة",
};

export function generateMetadata(): Metadata {
  const base = getBaseUrl();
  return {
    title:
      "أدلة التسعير الطبي — للسياح والمقيمين والميزانيات المختلفة | دليل الإمارات المفتوح للرعاية الصحية",
    description:
      "اختر دليل التسعير الذي يناسب وضعك. أدلة للسياح، والمقيمين الوافدين، وغير المؤمَّنين، والباحثين عن رعاية اقتصادية أو مميزة، والأمهات الحوامل في الإمارات.",
    alternates: {
      canonical: `${base}/ar/pricing/guide`,
      languages: {
        "en-AE": `${base}/pricing/guide`,
        "ar-AE": `${base}/ar/pricing/guide`,
      },
    },
    openGraph: {
      title: "أدلة التسعير الطبي في الإمارات — اختر الدليل المناسب",
      description:
        "أدلة تكاليف الرعاية الصحية في الإمارات حسب الفئة: سياح ومقيمون وغير مؤمَّنون وباحثون عن أفضل الأسعار.",
      url: `${base}/ar/pricing/guide`,
      type: "website",
    },
  };
}

export default function ArPricingGuideHubPage() {
  const base = getBaseUrl();

  const faqs = [
    {
      question: "أي دليل تسعير يناسبني؟",
      answer:
        "اختر الدليل الذي يتطابق مع وضعك. إذا لم يكن لديك تأمين صحي، ابدأ بدليل 'بدون تأمين'. السياح يستخدمون دليل 'للسياح'. المقيمون بتأمين من جهة العمل يجدون دليل 'للمقيمين الوافدين' الأنسب. وللباحثين عن الرعاية الاقتصادية دليل 'الرعاية الاقتصادية'، وللحوامل دليل 'تكاليف الأمومة'.",
    },
    {
      question: "هل الأسعار في هذه الأدلة دقيقة؟",
      answer:
        "الأسعار نطاقات استرشادية مستندة إلى منهجية التعرفة الإلزامية للصحة في أبوظبي (شفافية) وبيانات DHA وأسعار السوق المرصودة حتى مارس ٢٠٢٦. تتباين التكاليف الفعلية حسب المنشأة والطبيب والتعقيد السريري وخطة التأمين.",
    },
    {
      question: "هل تشمل هذه الأدلة جميع مدن الإمارات؟",
      answer:
        `نعم. يتضمن كل دليل بيانات تسعير لجميع مدن الإمارات الثماني: دبي وأبوظبي والشارقة وعجمان ورأس الخيمة والفجيرة وأم القيوين والعين. يمكنك الاطلاع على أسعار مدينتك باختيار المدينة داخل كل دليل.`,
    },
    {
      question: "كم مرة تُحدَّث أدلة التسعير؟",
      answer:
        "تُراجَع بيانات التسعير وتُحدَّث بانتظام بناءً على أحدث منشورات تعرفة DOH وتحديثات DHA وتغيرات السوق. البيانات الحالية تعكس الأسعار حتى مارس ٢٠٢٦.",
    },
    {
      question: "هل يمكنني استخدام هذه الأدلة لتقدير اشتراكي التأميني؟",
      answer:
        "يتضمن دليل 'للمقيمين الوافدين' نسب الاشتراك الاعتيادية للإجراءات الشائعة. للحصول على تقدير أدق، استخدم حاسبة تكاليف التأمين في صفحات الإجراءات الفردية.",
    },
  ];

  return (
    <div
      className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8"
      dir="rtl"
      lang="ar"
    >
      <JsonLd
        data={breadcrumbSchema([
          { name: "الإمارات", url: base },
          { name: "تكاليف الإجراءات الطبية", url: `${base}/ar/pricing` },
          { name: "أدلة التسعير" },
        ])}
      />
      <JsonLd data={speakableSchema([".answer-block"])} />

      <Breadcrumb
        items={[
          { label: "الإمارات", href: "/ar" },
          { label: "تكاليف الإجراءات الطبية", href: "/ar/pricing" },
          { label: "أدلة التسعير" },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <BookOpen className="w-8 h-8 text-[#006828]" />
          <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight">
            أدلة التسعير الطبي في الإمارات
          </h1>
        </div>
        <div className="border-r-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 mb-6" data-answer-block="true">
          <p className="font-['Geist',sans-serif] text-black/40 leading-relaxed">
            تتفاوت تكاليف الرعاية الصحية في الإمارات بحسب هويتك وجهة خدمتك
            ونوع تأمينك. صُمِّمت هذه الأدلة لفئات محددة — سواء كنت سائحاً يحتاج
            علاجاً طارئاً، أو مقيماً وافداً يُخطِّط لميزانية أسرته، أو غير مؤمَّن
            يبحث عن خيارات اقتصادية. اختر الدليل المناسب للعثور على الأسعار
            والنصائح وأفضل المزودين عبر {CITIES.length.toLocaleString("ar-AE")} مدينة إماراتية.
          </p>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { value: PRICING_GUIDES.length.toLocaleString("ar-AE"), label: "أدلة متخصصة" },
            { value: "٤٠+", label: "إجراء طبي مُسعَّر" },
            { value: CITIES.length.toLocaleString("ar-AE"), label: "مدينة إماراتية" },
            { value: "٥٥", label: "صفحة دليل" },
          ].map(({ value, label }) => (
            <div key={label} className="bg-[#f8f8f6] p-4 text-center">
              <p className="text-2xl font-bold text-[#006828]">{value}</p>
              <p className="font-['Geist',sans-serif] text-xs text-black/40">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Guide Cards */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          اختر دليلك
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
        {PRICING_GUIDES.map((guide) => {
          const Icon = ICON_MAP[guide.icon] || BookOpen;
          const nameAr = GUIDE_NAME_AR[guide.slug] || guide.name;
          return (
            <Link
              key={guide.slug}
              href={`/ar/pricing/guide/${guide.slug}`}
              className="border border-black/[0.06] p-5 hover:border-[#006828]/15 transition-colors group"
            >
              <div className="flex items-start gap-3 mb-3">
                <Icon className="w-6 h-6 text-[#006828] flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors mb-1">
                    {nameAr}
                  </h3>
                  <p className="text-[11px] text-black/40 line-clamp-2">
                    {guide.audience.slice(0, 120)}...
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-black/40 group-hover:text-[#006828] flex-shrink-0 mt-0.5 rotate-180" />
              </div>
              <div className="flex items-center gap-2 text-[10px] text-black/40">
                <span className="bg-[#f8f8f6] px-2 py-0.5">
                  {guide.featuredProcedures.length.toLocaleString("ar-AE")} إجراءً
                </span>
                <span className="bg-[#f8f8f6] px-2 py-0.5">
                  {CITIES.length.toLocaleString("ar-AE")} مدينة
                </span>
                <span className="bg-[#f8f8f6] px-2 py-0.5">
                  {guide.tips.length.toLocaleString("ar-AE")} نصائح
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* City-specific guides */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          أدلة حسب المدينة
        </h2>
      </div>
      <p className="font-['Geist',sans-serif] text-xs text-black/40 mb-4">
        كل دليل متاح أيضاً لمدن إماراتية محددة مع أسعار محلية ونصائح خاصة بالمدينة.
      </p>
      <div className="border border-black/[0.06] divide-y divide-black/[0.06] mb-12">
        {CITIES.map((city) => (
          <div key={city.slug} className="p-3">
            <h3 className="text-sm font-['Bricolage_Grotesque',sans-serif] font-semibold text-[#1c1c1c] tracking-tight mb-2">
              {getArabicCityName(city.slug)}
            </h3>
            <div className="flex flex-wrap gap-2">
              {PRICING_GUIDES.map((guide) => (
                <Link
                  key={`${city.slug}-${guide.slug}`}
                  href={`/ar/pricing/guide/${guide.slug}/${city.slug}`}
                  className="text-[11px] text-black/40 hover:text-[#006828] transition-colors border border-black/[0.06] px-2 py-1"
                >
                  {GUIDE_NAME_AR[guide.slug] || guide.name}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* FAQ */}
      <FaqSection faqs={faqs} title="أدلة التسعير — الأسئلة الشائعة" />

      {/* Disclaimer */}
      <div className="mt-8 border-t border-black/[0.06] pt-4 flex justify-between items-start">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>إخلاء المسؤولية:</strong> جميع الأسعار المعروضة نطاقات استرشادية
          مستندة إلى منهجية تعرفة وزارة الصحة الإلزامية ومعدلات السوق حتى مارس ٢٠٢٦.
          هذه المعلومات لأغراض توعوية فقط وليست استشارة طبية أو مالية.
        </p>
        <Link href="/pricing/guide" className="text-xs text-[#006828] hover:underline whitespace-nowrap mr-4">
          English version
        </Link>
      </div>
    </div>
  );
}
