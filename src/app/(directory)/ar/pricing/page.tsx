import { Metadata } from "next";
import Link from "next/link";
import { DollarSign, ArrowRight, TrendingDown, Shield, Search } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { FaqSection } from "@/components/seo/FaqSection";
import {
  PROCEDURES,
  PROCEDURE_CATEGORIES,
  formatAed,
} from "@/lib/pricing";
import { breadcrumbSchema, speakableSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

export const revalidate = 43200;

export function generateMetadata(): Metadata {
  const base = getBaseUrl();
  return {
    title: "أسعار الإجراءات الطبية في الإمارات",
    description:
      "كم تبلغ تكلفة التصوير بالرنين المغناطيسي أو زراعة الأسنان أو استبدال مفصل الركبة في الإمارات؟ قارن أسعار الإجراءات الطبية عبر دبي وأبوظبي والشارقة وجميع الإمارات. قدّر تكلفتك بعد خصم التأمين. الأسعار مبنية على بيانات التعرفة الإلزامية لدائرة الصحة.",
    alternates: {
      canonical: `${base}/ar/pricing`,
      languages: {
        "en-AE": `${base}/pricing`,
        "ar-AE": `${base}/ar/pricing`,
      },
    },
    openGraph: {
      title: "أسعار الإجراءات الطبية في الإمارات",
      description:
        "قارن أسعار أكثر من 40 إجراءً طبياً عبر 8 مدن إماراتية. مبنية على التعرفة الرسمية لدائرة الصحة. تشمل حاسبة التأمين.",
      url: `${base}/ar/pricing`,
      type: "website",
    },
  };
}

export default function ArPricingPage() {
  const base = getBaseUrl();

  const procedureCount = PROCEDURES.length;
  const categoryCount = PROCEDURE_CATEGORIES.length;

  const popular = PROCEDURES.slice(0, 12);

  const CATEGORY_NAMES_AR: Record<string, string> = {
    diagnostics: "التشخيص والتصوير الطبي",
    dental: "طب الأسنان",
    "eye-care": "طب العيون والرؤية",
    surgical: "الجراحة العامة",
    orthopedic: "جراحة العظام والمفاصل",
    maternity: "الأمومة والولادة",
    cosmetic: "الجراحة التجميلية والترميمية",
    cardiac: "إجراءات القلب",
    wellness: "الاستشارات والرعاية الوقائية",
    therapy: "العلاج وإعادة التأهيل",
  };

  const categoryMap: Record<string, string[]> = {
    diagnostics: ["radiology-imaging", "labs-diagnostics"],
    dental: ["dental"],
    "eye-care": ["ophthalmology"],
    surgical: ["hospitals", "gastroenterology"],
    orthopedic: ["orthopedics"],
    maternity: ["ob-gyn", "fertility-ivf"],
    cosmetic: ["cosmetic-plastic", "dermatology"],
    cardiac: ["cardiology"],
    wellness: ["clinics"],
    therapy: ["physiotherapy", "mental-health"],
  };

  const coverageLabelAr = (coverage: string) => {
    if (coverage === "typically-covered") return "مشمول";
    if (coverage === "partially-covered") return "جزئي";
    if (coverage === "rarely-covered") return "نادر";
    return "غير مشمول";
  };

  const coverageColorClass = (coverage: string) => {
    if (coverage === "typically-covered") return "text-green-700 bg-green-50";
    if (coverage === "partially-covered") return "text-yellow-700 bg-yellow-50";
    if (coverage === "rarely-covered") return "text-orange-700 bg-orange-50";
    return "text-red-700 bg-red-50";
  };

  const faqs = [
    {
      question: "كم تبلغ تكاليف الإجراءات الطبية في الإمارات؟",
      answer:
        "تتفاوت أسعار الإجراءات الطبية في الإمارات بشكل كبير تبعاً للمدينة ونوع المنشأة ودرجة تعقيد الإجراء. تعدّ دبي الأغلى عموماً، تليها أبوظبي، فيما تتميز الشارقة والإمارات الشمالية بأسعار أدنى. تخضع الأسعار في أبوظبي للتعرفة الإلزامية الصادرة عن دائرة الصحة (شفافية)، التي تحدد أسعاراً أساسية تستطيع المنشآت مضاعفتها من 1 إلى 3 أضعاف. تتراوح تكلفة زيارة الطبيب العام بين 100 و500 درهم، والتصوير بالرنين المغناطيسي بين 800 و5000 درهم، واستبدال مفصل الركبة بين 30,000 و100,000 درهم.",
    },
    {
      question: "هل يغطّي التأمين الإجراءات الطبية في الإمارات؟",
      answer:
        "أصبح التأمين الصحي إلزامياً في جميع إمارات الدولة السبع اعتباراً من يناير 2025. تغطي معظم خطط التأمين الإجراءاتِ الضرورية طبياً — كالتشخيص والجراحة والرعاية الطارئة — مع نسب تحمّل تتراوح بين 0% و20% وفقاً لمستوى الخطة. لا تُغطى الإجراءات التجميلية (تجميل الأنف، البوتوكس، زراعة الشعر) في الغالب. ويتوقف تغطية علاج الأسنان على طبيعة الخطة.",
    },
    {
      question: "لماذا تختلف التكاليف الطبية بين مدن الإمارات؟",
      answer:
        "لكل إمارة هيئتها الصحية ونظامها التسعيري الخاص. تعتمد أبوظبي التعرفة الإلزامية لدائرة الصحة (المستندة إلى معدلات Medicare الأمريكية المحوّلة بسعر صرف 3.672 درهم للدولار)، بينما تعتمد دبي أنظمة DRG للمرضى الداخليين وآليات السوق للمرضى الخارجيين. أما الإمارات الشمالية (الشارقة وعجمان ورأس الخيمة والفجيرة وأم القيوين) الخاضعة لوزارة الصحة فتتميز بتكاليف تشغيل وإيجارات أدنى، مما يُفضي إلى أسعار إجراءات أقل.",
    },
    {
      question: "ما درجة دقة الأسعار المعروضة في هذه الصفحة؟",
      answer:
        "الأسعار المعروضة نطاقات استرشادية مستندة إلى منهجية التعرفة الإلزامية لدائرة الصحة وبارامترات DRG لهيئة صحة دبي وبيانات السوق الموثّقة حتى مارس 2026. تتوقف التكاليف الفعلية على المنشأة والطبيب ودرجة التعقيد السريري وخطة التأمين. احرص دائماً على تأكيد السعر مباشرة مع مقدم الخدمة قبل اتخاذ قرارك.",
    },
    {
      question: "ما هي التعرفة الإلزامية (شفافية) الصادرة عن دائرة الصحة؟",
      answer:
        "التعرفة الإلزامية هي القائمة الرسمية للأسعار الصادرة عن دائرة الصحة أبوظبي ضمن برنامج شفافية. وهي تُحدد أسعاراً أساسية لكل إجراء طبي باستخدام رموز CPT وHCPCS، محتسبةً بنسبة مئوية من معدلات Medicare الأمريكية مُحوَّلة بسعر 3.672 درهم للدولار. ويحق للمنشآت التفاوض مع شركات التأمين على معاملات تتراوح بين 1 و3 أضعاف هذه الأسعار الأساسية.",
    },
  ];

  return (
    <div dir="rtl" className="font-arabic max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd
        data={breadcrumbSchema([
          { name: "الإمارات", url: base },
          { name: "أسعار الإجراءات الطبية" },
        ])}
      />
      <JsonLd data={speakableSchema([".answer-block"])} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "أسعار الإجراءات الطبية في الإمارات",
          description:
            "قارن أسعار الإجراءات الطبية عبر جميع إمارات الدولة مع تقدير التكلفة بعد خصم التأمين.",
          url: `${base}/ar/pricing`,
          inLanguage: "ar",
          isPartOf: {
            "@type": "WebSite",
            name: "دليل الرعاية الصحية المفتوح في الإمارات",
            url: base,
          },
        }}
      />

      <Breadcrumb
        items={[
          { label: "الإمارات", href: "/ar" },
          { label: "أسعار الإجراءات الطبية" },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <DollarSign className="w-8 h-8 text-[#006828]" />
          <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight">
            أسعار الإجراءات الطبية في الإمارات
          </h1>
        </div>
        <div
          className="border-r-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 mb-6"
          data-answer-block="true"
        >
          <p className="font-['Geist',sans-serif] text-black/40 leading-relaxed">
            قارن أسعار {procedureCount.toLocaleString("ar-AE")} إجراءً طبياً عبر دبي وأبوظبي والشارقة وجميع إمارات الدولة.
            الأسعار مبنية على منهجية التعرفة الإلزامية لدائرة الصحة (شفافية) وبيانات السوق الموثّقة.
            استخدم حاسبة التأمين لتقدير تكلفتك الفعلية.
          </p>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { value: procedureCount.toLocaleString("ar-AE"), label: "إجراء مسعَّر" },
            { value: categoryCount.toLocaleString("ar-AE"), label: "تصنيف طبي" },
            { value: "٨", label: "مدينة إماراتية مقارَنة" },
            { value: "+٨٥", label: "خطة تأمين مُدرَجة" },
          ].map(({ value, label }) => (
            <div key={label} className="bg-[#f8f8f6] p-4 text-center">
              <p className="text-2xl font-bold text-[#006828]">{value}</p>
              <p className="font-['Geist',sans-serif] text-xs text-black/40">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* English version link */}
      <div className="mb-8 text-center">
        <Link
          href="/pricing"
          className="text-sm text-[#006828] hover:underline"
        >
          View in English →
        </Link>
      </div>

      {/* Categories */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          تصفح حسب التصنيف
        </h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-12">
        {PROCEDURE_CATEGORIES.map((cat) => {
          const count = PROCEDURES.filter((p) =>
            (categoryMap[cat.slug] || []).includes(p.categorySlug)
          ).length;

          return (
            <Link
              key={cat.slug}
              href={`/ar/pricing#${cat.slug}`}
              className="border border-black/[0.06] p-3 hover:border-[#006828]/15 transition-colors group"
            >
              <h3 className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors mb-1">
                {CATEGORY_NAMES_AR[cat.slug] || cat.name}
              </h3>
              <p className="text-[11px] text-black/40">
                {count.toLocaleString("ar-AE")} إجراء
              </p>
            </Link>
          );
        })}
      </div>

      {/* Popular Procedures */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          أكثر الإجراءات بحثاً
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
        {popular.map((proc) => (
          <Link
            key={proc.slug}
            href={`/ar/pricing/${proc.slug}`}
            className="border border-black/[0.06] rounded-2xl p-5 hover:border-[#006828]/15 transition-colors group"
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
                {proc.nameAr || proc.name}
              </h3>
              <ArrowRight className="w-3.5 h-3.5 text-black/40 group-hover:text-[#006828] flex-shrink-0 mt-0.5 rotate-180" />
            </div>
            <p className="font-['Geist',sans-serif] text-xs text-black/40 mb-3 line-clamp-2">
              {proc.description.slice(0, 120)}...
            </p>
            <div className="flex items-center justify-between">
              <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight">
                {formatAed(proc.priceRange.min)} – {formatAed(proc.priceRange.max)}
              </p>
              <span className={`text-[10px] font-medium px-2 py-0.5 ${coverageColorClass(proc.insuranceCoverage)}`}>
                {coverageLabelAr(proc.insuranceCoverage)}
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* All Procedures by Category */}
      {PROCEDURE_CATEGORIES.map((cat) => {
        const catProcs = PROCEDURES.filter((p) =>
          (categoryMap[cat.slug] || []).includes(p.categorySlug)
        ).sort((a, b) => a.sortOrder - b.sortOrder);

        if (catProcs.length === 0) return null;

        return (
          <div key={cat.slug} id={cat.slug} className="mb-10">
            <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
              <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
                {CATEGORY_NAMES_AR[cat.slug] || cat.name}
              </h2>
            </div>
            <p className="font-['Geist',sans-serif] text-xs text-black/40 mb-4">{cat.description}</p>
            <div className="border border-black/[0.06] divide-y divide-light-200">
              {catProcs.map((proc) => (
                <Link
                  key={proc.slug}
                  href={`/ar/pricing/${proc.slug}`}
                  className="flex items-center justify-between p-3 hover:bg-[#f8f8f6] transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors truncate">
                        {proc.nameAr || proc.name}
                      </h3>
                      {proc.cptCode && (
                        <span className="text-[9px] text-black/40 font-['Geist',sans-serif] hidden sm:inline">
                          CPT {proc.cptCode}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-black/40">
                      {proc.duration} · {proc.setting} · {proc.recoveryTime}
                    </p>
                  </div>
                  <div className="text-left flex-shrink-0 mr-4">
                    <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight">
                      {formatAed(proc.priceRange.min)} – {formatAed(proc.priceRange.max)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        );
      })}

      {/* Key Insights */}
      <div className="bg-[#f8f8f6] border border-black/[0.06] rounded-2xl p-6 mb-10">
        <h2 className="text-lg font-['Bricolage_Grotesque',sans-serif] font-semibold text-[#1c1c1c] tracking-tight mb-4">
          حقائق جوهرية حول أسعار الرعاية الصحية في الإمارات
        </h2>
        <div
          className="border-r-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 space-y-3"
          data-answer-block="true"
        >
          <div className="flex items-start gap-3">
            <TrendingDown className="w-5 h-5 text-[#006828] flex-shrink-0 mt-0.5" />
            <p className="font-['Geist',sans-serif] text-sm text-black/40">
              <strong className="text-[#1c1c1c]">أرخص الإمارات:</strong>{" "}
              تتصدر الإمارات الشمالية (الشارقة وعجمان وأم القيوين) قائمة الأسعار المنخفضة، إذ تقل تكاليف الإجراءات الطبية فيها في الغالب بنسبة 30–40% عن دبي للإجراء ذاته.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <DollarSign className="w-5 h-5 text-[#006828] flex-shrink-0 mt-0.5" />
            <p className="font-['Geist',sans-serif] text-sm text-black/40">
              <strong className="text-[#1c1c1c]">تسعير أبوظبي:</strong>{" "}
              يخضع للتعرفة الإلزامية (شفافية) — أسعار أساسية مستمدة من معدلات Medicare الأمريكية مضروبة في 3.672 درهم/دولار، مع معاملات تفاوضية تتراوح بين 1× و3×.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-[#006828] flex-shrink-0 mt-0.5" />
            <p className="font-['Geist',sans-serif] text-sm text-black/40">
              <strong className="text-[#1c1c1c]">التأمين منذ يناير 2025:</strong>{" "}
              أصبح التأمين الصحي إلزامياً لجميع المقيمين في الإمارات في الإمارات السبع. تغطي معظم الخطط الإجراءاتِ الضرورية طبياً بنسبة تحمّل تتراوح بين 0% و20%.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <Search className="w-5 h-5 text-[#006828] flex-shrink-0 mt-0.5" />
            <p className="font-['Geist',sans-serif] text-sm text-black/40">
              <strong className="text-[#1c1c1c]">تفاوت الأسعار:</strong>{" "}
              قد يكون الإجراء ذاته أغلى بمقدار 2–3 أضعاف في المستشفى المتميز مقارنةً بالمستشفى الحكومي أو العيادة الخاصة الأساسية. احرص دائماً على مقارنة أسعار أكثر من مقدم خدمة.
            </p>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <FaqSection
        faqs={faqs}
        title="أسئلة شائعة حول أسعار الرعاية الطبية في الإمارات"
      />

      {/* Disclaimer */}
      <div className="mt-8 border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>إخلاء مسؤولية:</strong> جميع الأسعار المعروضة نطاقات استرشادية مبنية على منهجية التعرفة الإلزامية لدائرة الصحة (شفافية) وبارامترات DRG لهيئة صحة دبي وبيانات السوق الموثّقة حتى مارس 2026.
          تتوقف التكاليف الفعلية على المنشأة والطبيب ودرجة التعقيد السريري وخطة التأمين. هذه الأداة لأغراض إعلامية فقط ولا تمثل نصيحة طبية أو مالية.
          احرص دائماً على الحصول على عرض سعر شخصي من مقدم الرعاية الصحية قبل الإقدام على أي إجراء. البيانات مرجعٌ له دليل الرعاية الصحية المفتوح في الإمارات.
        </p>
      </div>
    </div>
  );
}
