import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Route, Clock, DollarSign } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { FaqSection } from "@/components/seo/FaqSection";
import {
  CARE_JOURNEYS,
  calculateJourneyCost,
} from "@/lib/constants/care-journeys";
import { formatAed } from "@/lib/constants/procedures";
import { breadcrumbSchema, speakableSchema, faqPageSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

export const revalidate = 43200;

export function generateMetadata(): Metadata {
  const base = getBaseUrl();
  return {
    title:
      "تكاليف علاج الأمراض من البداية إلى النهاية — مسارات الرعاية في الإمارات | دليل الإمارات المفتوح للرعاية الصحية",
    description:
      "كم يكلف علاج الحمل أو LASIK أو زراعة الأسنان أو علاج الركبة في الإمارات؟ تصفح ١٥ مسار رعاية بتكاليف تفصيلية عبر دبي وأبوظبي والشارقة وجميع الإمارات. مستند إلى بيانات تعرفة وزارة الصحة.",
    alternates: {
      canonical: `${base}/ar/pricing/journey`,
      languages: {
        "en-AE": `${base}/pricing/journey`,
        "ar-AE": `${base}/ar/pricing/journey`,
      },
    },
    openGraph: {
      title: "مسارات رعاية الأمراض — إجمالي تكاليف العلاج في الإمارات",
      description:
        "تصفح ١٥ مسار رعاية بتقديرات إجمالية للتكاليف. الحمل، IVF، تجميل الأسنان، علاج الركبة وأكثر في ٨ مدن إماراتية.",
      url: `${base}/ar/pricing/journey`,
      type: "website",
    },
  };
}

export default function ArJourneyHubPage() {
  const base = getBaseUrl();

  const journeysWithCosts = CARE_JOURNEYS.map((journey) => {
    const cost = calculateJourneyCost(journey);
    return { journey, cost };
  }).sort((a, b) => a.journey.sortOrder - b.journey.sortOrder);

  const faqs = [
    {
      question: "ما هي حزم تكاليف مسار الرعاية؟",
      answer:
        "تُقدِّر حزم مسار الرعاية التكلفة الإجمالية لعلاج حالة طبية أو إتمام مسار علاجي في الإمارات. بدلاً من النظر في أسعار إجراءات فردية، تجمع الحزم جميع الاستشارات والفحوصات والإجراءات في تقدير إجمالي واحد. على سبيل المثال، يشمل مسار الحمل زيارات الطبيب والتصوير بالموجات وفحوصات الدم والولادة.",
    },
    {
      question: "ما مدى دقة هذه التقديرات؟",
      answer:
        "التقديرات نطاقات استرشادية مستندة إلى منهجية تعرفة وزارة الصحة الإلزامية وبيانات السوق حتى مارس ٢٠٢٦. تعتمد التكاليف الفعلية على المنشأة والطبيب والتعقيد السريري وخطة التأمين.",
    },
    {
      question: "هل تُغطي هذه التكاليف العلاجية التأمينُ في الإمارات؟",
      answer:
        "تتباين التغطية حسب المسار وخطة التأمين. العلاجات الضرورية طبياً (فحوصات القلب، التهاب الزائدة، آلام الظهر) مغطاة عادةً باشتراك 10-20٪. الإجراءات الانتخابية والتجميلية (تجميل الأسنان، تجميل الأنف، زراعة الشعر) غير مشمولة عموماً.",
    },
    {
      question: "أي مدينة إماراتية هي الأرخص للعلاج الطبي؟",
      answer:
        "تُقدِّم الإمارات الشمالية (الشارقة وعجمان وأم القيوين) أدنى الأسعار باستمرار، وغالباً أقل بـ 30-40٪ من دبي. أبوظبي في المنتصف. دبي هي الأغلى عموماً بسبب ارتفاع تكاليف المنشآت والتسعير المتميز.",
    },
    {
      question: "هل يمكنني استخدام هذه التقديرات للتخطيط لميزانيتي الطبية؟",
      answer:
        "نعم — صُمِّمت هذه الحزم لمساعدتك على التخطيط والميزنة للعلاج الطبي في الإمارات. تشمل جميع الخطوات من الاستشارة الأولى حتى المتابعة. تأكد دائماً من الأسعار مباشرة مع مزود الرعاية الصحية.",
    },
  ];

  return (
    <div
      className="font-arabic max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8"
      dir="rtl"
      lang="ar"
    >
      <JsonLd
        data={breadcrumbSchema([
          { name: "الإمارات", url: base },
          { name: "تكاليف الإجراءات الطبية", url: `${base}/ar/pricing` },
          { name: "حزم مسار الرعاية" },
        ])}
      />
      <JsonLd data={speakableSchema([".answer-block"])} />
      <JsonLd data={faqPageSchema(faqs)} />

      <Breadcrumb
        items={[
          { label: "الإمارات", href: "/ar" },
          { label: "تكاليف الإجراءات الطبية", href: "/ar/pricing" },
          { label: "حزم مسار الرعاية" },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <Route className="w-8 h-8 text-[#006828]" />
          <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight">
            حزم التكاليف العلاجية في الإمارات
          </h1>
        </div>
        <div className="border-r-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 mb-6" data-answer-block="true">
          <p className="font-['Geist',sans-serif] text-black/40 leading-relaxed">
            كم يكلف علاج حالة طبية حقاً في الإمارات؟ تجمع هذه الـ{CARE_JOURNEYS.length.toLocaleString("ar-AE")} حزمة
            جميع الاستشارات والفحوصات والإجراءات في تكلفة إجمالية تقديرية.
            قارن الأسعار عبر دبي وأبوظبي والشارقة وجميع الإمارات.
            مستند إلى بيانات التعرفة الإلزامية لوزارة الصحة ومعدلات السوق حتى مارس ٢٠٢٦.
          </p>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { value: CARE_JOURNEYS.length.toLocaleString("ar-AE"), label: "مسار رعاية" },
            { value: "٨", label: "مدن مقارنة" },
            { value: "١٣٦", label: "صفحة إجمالية" },
            { value: "٢٠٢٦", label: "سنة البيانات" },
          ].map(({ value, label }) => (
            <div key={label} className="bg-[#f8f8f6] p-4 text-center">
              <p className="text-2xl font-bold text-[#006828]">{value}</p>
              <p className="font-['Geist',sans-serif] text-xs text-black/40">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Journey Cards */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          جميع مسارات الرعاية
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
        {journeysWithCosts.map(({ journey, cost }) => (
          <Link
            key={journey.slug}
            href={`/ar/pricing/journey/${journey.slug}`}
            className="border border-black/[0.06] rounded-2xl p-5 hover:border-[#006828]/15 transition-colors group"
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
                {journey.nameAr || journey.name}
              </h3>
              <ArrowRight className="w-3.5 h-3.5 text-black/40 group-hover:text-[#006828] flex-shrink-0 mt-0.5 rotate-180" />
            </div>
            <p className="font-['Geist',sans-serif] text-xs text-black/40 mb-3 line-clamp-2">
              {journey.description.slice(0, 120)}...
            </p>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center gap-1">
                <DollarSign className="w-3 h-3 text-[#006828]" />
                <span className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight">
                  {formatAed(cost.requiredMin)} – {formatAed(cost.requiredMax)}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between text-[11px] text-black/40">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {journey.totalDuration}
              </span>
              <span>
                {journey.steps.filter((s) => !s.isOptional).length.toLocaleString("ar-AE")} خطوات
                {journey.steps.some((s) => s.isOptional) &&
                  ` + ${journey.steps.filter((s) => s.isOptional).length.toLocaleString("ar-AE")} اختيارية`}
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* How It Works */}
      <div className="bg-[#f8f8f6] border border-black/[0.06] rounded-2xl p-6 mb-10">
        <h2 className="text-lg font-['Bricolage_Grotesque',sans-serif] font-semibold text-[#1c1c1c] tracking-tight mb-4">
          كيف تعمل حزم مسار الرعاية؟
        </h2>
        <div className="border-r-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 space-y-3" data-answer-block="true">
          <p className="font-['Geist',sans-serif] text-sm text-black/40">
            تجمع كل حزمة رعاية الإجراءات الفردية اللازمة لعلاج حالة من البداية
            إلى النهاية. تُحسَب الأسعار بجمع تكلفة كل خطوة (تكلفة الإجراء × الكمية)
            باستخدام بيانات التسعير القائمة على تعرفة وزارة الصحة.
            الخطوات الإلزامية تُظهر الحد الأدنى المتوقع، فيما تُظهر الإضافات
            الاختيارية (كالقيصرية للحمل، أو جراحة الرباط الصليبي لإصابات الركبة)
            التكاليف الإضافية المحتملة.
          </p>
          <p className="font-['Geist',sans-serif] text-sm text-black/40">
            تتفاوت التكاليف بين المدن — دبي عموماً الأغلى، بينما تُقدِّم
            الشارقة والإمارات الشمالية أسعاراً أدنى. تتضمن كل صفحة مسار
            مقارنة مدينة بمدينة.
          </p>
        </div>
      </div>

      {/* FAQ */}
      <FaqSection faqs={faqs} title="تكاليف مسار الرعاية — الأسئلة الشائعة" />

      <div className="mt-8 border-t border-black/[0.06] pt-4 flex justify-between items-start">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>إخلاء المسؤولية:</strong> جميع الحزم تقديرات استرشادية مستندة إلى بيانات التعرفة الإلزامية وبيانات السوق حتى مارس ٢٠٢٦. هذه المعلومات لأغراض التخطيط فقط وليست استشارة طبية.
        </p>
        <Link href="/pricing/journey" className="text-xs text-[#006828] hover:underline whitespace-nowrap mr-4">
          English version
        </Link>
      </div>
    </div>
  );
}
