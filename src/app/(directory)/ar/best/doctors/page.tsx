import { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { FaqSection } from "@/components/seo/FaqSection";
import {
  PHYSICIAN_SPECIALTIES,
  DENTIST_SPECIALTIES,
  PROFESSIONAL_STATS,
} from "@/lib/constants/professionals";
import { breadcrumbSchema, faqPageSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { ar } from "@/lib/i18n";

export const revalidate = 43200;

const DOCTOR_SPECIALTIES = [...PHYSICIAN_SPECIALTIES, ...DENTIST_SPECIALTIES];
const TOTAL_DOCTORS = PROFESSIONAL_STATS.physicians + PROFESSIONAL_STATS.dentists;

export function generateMetadata(): Metadata {
  const base = getBaseUrl();
  const url = `${base}/ar/best/doctors`;
  const title = "أفضل الأطباء في دبي — مصنّفون حسب الخبرة والتخصص";
  const description = `ابحث عن أفضل الأطباء في دبي عبر ${DOCTOR_SPECIALTIES.length} تخصصاً طبياً. ${TOTAL_DOCTORS.toLocaleString("ar-AE")} طبيباً وطبيبة أسنان مرخّصاً من هيئة الصحة بدبي، مُصنَّفون بحسب الطاقة الاستيعابية للمنشأة من السجل الطبي الرسمي شريان.`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        "en-AE": `${base}/best/doctors`,
        "ar-AE": url,
      },
    },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      siteName: ar.siteName,
    },
  };
}

export default function ArBestDoctorsHubPage() {
  const base = getBaseUrl();

  const faqs = [
    {
      question: "كيف يُصنَّف أفضل الأطباء في دبي؟",
      answer: `يُصنَّف الأطباء بحسب الطاقة الاستيعابية للمنشأة — إذ يحتل المراتب الأولى الأطباء العاملون في منشآت أكبر مسجّلة لدى هيئة الصحة بدبي. تخضع المنشآت الأكبر لإجراءات مراجعة أكثر صرامة من الأقران، وضمان جودة أشمل، واعتماد أكثر دقةً. تُضم في التصنيفات الأطباءُ الحاملون لترخيص دوام كامل (FTL) من هيئة الصحة بدبي فقط. يتجنب هذا المنهج التقييمات الذاتية ويعتمد بدلاً منها على بيانات مؤسسية موثّقة من سجل شريان.`,
    },
    {
      question: "ما معنى الترخيص من هيئة الصحة بدبي؟",
      answer:
        "هيئة الصحة بدبي هي الجهة التنظيمية المشرفة على جميع الأنشطة الصحية في دبي. يتعين على كل طبيب يمارس مهنته في دبي الحصول على ترخيص سارٍ من هيئة الصحة بدبي يُصدر عبر نظام شريان بعد التحقق من المؤهلات والخبرة والوضع المهني. يُثبت الترخيص أن الطبيب استوفى الحد الأدنى لمعايير ممارسة الطب في دبي.",
    },
    {
      question: "كيف أتحقق من أوراق اعتماد الطبيب؟",
      answer:
        "يمكنك التحقق من ترخيص أي طبيب عبر موقع هيئة الصحة بدبي (dha.gov.ae) أو بوابة شريان. ابحث باسم الطبيب أو رقم الترخيص لتأكيد حالته وتخصصه وانتمائه المؤسسي. يستقي دليل الرعاية الصحية المفتوح في الإمارات بياناته مباشرةً من سجل شريان.",
    },
    {
      question: "ما الفرق بين الأخصائي والاستشاري؟",
      answer:
        "في منظومة الرعاية الصحية الإماراتية، الأخصائي طبيب أتمّ تدريبه التخصصي وحصل على ترخيص تخصصي من هيئة الصحة بدبي. أما الاستشاري فلقب أرفع يستلزم سنوات خبرة إضافية تتجاوز مرحلة التخصص — عادةً 10+ سنوات بعد الممارسة التخصصية. يتولى الاستشاريون في الغالب رئاسة الأقسام أو يشغلون مناصب الأطباء الأقدم.",
    },
    {
      question: "كم عدد الأطباء الممارسين في دبي؟",
      answer: `اعتباراً من ${PROFESSIONAL_STATS.scraped}، يبلغ عدد الأطباء المرخّصين ${PROFESSIONAL_STATS.physicians.toLocaleString("ar-AE")} وعدد أطباء الأسنان ${PROFESSIONAL_STATS.dentists.toLocaleString("ar-AE")} وفق سجل شريان لهيئة الصحة بدبي، ليبلغ الإجمالي ${TOTAL_DOCTORS.toLocaleString("ar-AE")} طبيباً عبر ${DOCTOR_SPECIALTIES.length} تخصصاً في ${PROFESSIONAL_STATS.uniqueFacilities.toLocaleString("ar-AE")} منشأة. تمتلك دبي إحدى أعلى نسب الأطباء إلى السكان في الشرق الأوسط.`,
    },
    {
      question: "ما أكثر التخصصات الطبية شيوعاً في دبي؟",
      answer: `أكثر التخصصات شيوعاً في دبي بعدد الأطباء المرخّصين: الطبيب العام (${PHYSICIAN_SPECIALTIES[0].count.toLocaleString("ar-AE")})، وطبيب الأسنان العام (${DENTIST_SPECIALTIES[0].count.toLocaleString("ar-AE")})، وأمراض النساء والتوليد (${PHYSICIAN_SPECIALTIES[1].count.toLocaleString("ar-AE")})، وطب الأطفال (${PHYSICIAN_SPECIALTIES[2].count.toLocaleString("ar-AE")})، وطب الأسرة (${PHYSICIAN_SPECIALTIES[3].count.toLocaleString("ar-AE")})، والأمراض الجلدية (${PHYSICIAN_SPECIALTIES[4].count.toLocaleString("ar-AE")}).`,
    },
  ];

  const physiciansSorted = [...PHYSICIAN_SPECIALTIES].sort((a, b) => b.count - a.count);
  const dentistsSorted = [...DENTIST_SPECIALTIES].sort((a, b) => b.count - a.count);

  return (
    <div dir="rtl" className="font-arabic max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "أفضل الأطباء في دبي 2026",
          description: `ابحث عن أفضل الأطباء في دبي عبر ${DOCTOR_SPECIALTIES.length} تخصصاً. ${TOTAL_DOCTORS.toLocaleString()} طبيباً مرخّصاً.`,
          url: `${base}/ar/best/doctors`,
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: DOCTOR_SPECIALTIES.length,
            itemListElement: DOCTOR_SPECIALTIES.map((spec, i) => ({
              "@type": "ListItem",
              position: i + 1,
              item: {
                "@type": "MedicalWebPage",
                name: `أفضل أطباء ${spec.nameAr} في دبي`,
                url: `${base}/ar/best/doctors/${spec.slug}`,
              },
            })),
          },
        }}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: "الإمارات", url: base },
          { name: "الدليل", url: `${base}/ar/directory` },
          { name: "أفضل الأطباء" },
        ])}
      />
      <JsonLd data={faqPageSchema(faqs)} />

      <Breadcrumb
        items={[
          { label: "الإمارات", href: "/ar" },
          { label: "الدليل", href: "/ar/directory" },
          { label: "أفضل الأطباء" },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-2">
          أفضل الأطباء في دبي 2026
        </h1>
        <p className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium tracking-wider uppercase mb-4">
          {TOTAL_DOCTORS.toLocaleString("ar-AE")} طبيباً وطبيبة أسنان مرخّصاً
          &middot; {DOCTOR_SPECIALTIES.length} تخصصاً
        </p>

        <div className="border-r-4 border-l-0 border-[#006828] bg-[#006828]/[0.04] py-5 px-6 mb-6">
          <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
            يبدأ البحث عن أفضل طبيب في دبي بالبيانات الموثّقة لا بالادعاءات التسويقية. يُصنّف
            هذا الدليل {TOTAL_DOCTORS.toLocaleString("ar-AE")} طبيباً مرخّصاً من هيئة الصحة بدبي
            عبر {DOCTOR_SPECIALTIES.length} تخصصاً طبياً باستخدام بيانات الطاقة الاستيعابية
            المؤسسية من سجل شريان الرسمي. يحتل المراتب الأولى الأطباء العاملون في منشآت صحية
            أكبر وأكثر رسوخاً{" "}
            <span className="text-black/40">
              — لأن حجم المنشأة يرتبط بمعايير المراجعة من الأقران والرقابة متعددة التخصصات
              وصرامة الاعتماد.
            </span>{" "}
            اختر تخصصاً أدناه لعرض أفضل 10 أطباء والمستشفيات الرائدة في ذلك المجال.
          </p>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            {
              value: PROFESSIONAL_STATS.physicians.toLocaleString("ar-AE"),
              label: "أطباء مرخّصون",
            },
            {
              value: PROFESSIONAL_STATS.dentists.toLocaleString("ar-AE"),
              label: "أطباء أسنان مرخّصون",
            },
            {
              value: PROFESSIONAL_STATS.uniqueFacilities.toLocaleString("ar-AE"),
              label: "منشآت صحية",
            },
            {
              value: PROFESSIONAL_STATS.scraped,
              label: "تاريخ مصدر البيانات",
            },
          ].map(({ value, label }) => (
            <div key={label} className="bg-[#f8f8f6] p-4 text-center">
              <p className="text-2xl font-bold text-[#006828]">{value}</p>
              <p className="font-['Geist',sans-serif] text-xs text-black/40">
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Physician Specialties Grid */}
      <section className="mb-10">
        <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
            تخصصات الأطباء
          </h2>
          <span className="font-['Geist_Mono',monospace] text-xs text-black/40">
            {PHYSICIAN_SPECIALTIES.length} تخصصاً
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {physiciansSorted.map((spec) => (
            <Link
              key={spec.slug}
              href={`/ar/best/doctors/${spec.slug}`}
              className="border border-black/[0.06] p-5 hover:border-[#006828]/15 transition-colors group"
            >
              <h3 className="font-['Bricolage_Grotesque',sans-serif] text-base font-semibold text-[#1c1c1c] tracking-tight mb-1 group-hover:text-[#006828] transition-colors">
                {spec.nameAr}
              </h3>
              <p className="text-sm font-bold text-[#006828] mb-2">
                {spec.count.toLocaleString("ar-AE")} طبيباً
              </p>
              <p className="font-['Geist',sans-serif] text-xs text-black/40">
                عرض أفضل 10 &larr;
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Dentist Specialties Grid */}
      <section className="mb-10">
        <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
            تخصصات طب الأسنان
          </h2>
          <span className="font-['Geist_Mono',monospace] text-xs text-black/40">
            {DENTIST_SPECIALTIES.length} تخصصاً
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {dentistsSorted.map((spec) => (
            <Link
              key={spec.slug}
              href={`/ar/best/doctors/${spec.slug}`}
              className="border border-black/[0.06] p-5 hover:border-[#006828]/15 transition-colors group"
            >
              <h3 className="font-['Bricolage_Grotesque',sans-serif] text-base font-semibold text-[#1c1c1c] tracking-tight mb-1 group-hover:text-[#006828] transition-colors">
                {spec.nameAr}
              </h3>
              <p className="text-sm font-bold text-[#006828] mb-2">
                {spec.count.toLocaleString("ar-AE")} طبيب أسنان
              </p>
              <p className="font-['Geist',sans-serif] text-xs text-black/40">
                عرض أفضل 10 &larr;
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* FAQs */}
      <FaqSection faqs={faqs} title="أفضل الأطباء في دبي — أسئلة شائعة" />

      {/* Methodology */}
      <section className="mb-10 mt-10">
        <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
            منهجية التصنيف
          </h2>
        </div>
        <div className="bg-[#f8f8f6] border border-black/[0.06] p-5">
          <p className="font-['Geist',sans-serif] text-sm text-black/40 leading-relaxed mb-3">
            يُبنى تصنيف الأطباء على <strong>الطاقة الاستيعابية للمنشأة</strong> — إذ يحتل
            المراتب الأولى الأطباء العاملون في منشآت صحية أكبر مسجّلة لدى هيئة الصحة بدبي.
            يقوم هذا النهج على مبدأ بسيط: تخضع المنشآت الأكبر لاعتماد أكثر صرامة، وتحافظ
            على فرق متعددة التخصصات للمراجعة من الأقران، ولها عمليات ضمان جودة أكثر دقة.
          </p>
          <p className="font-['Geist',sans-serif] text-sm text-black/40 leading-relaxed mb-3">
            تُضم في التصنيفات الأطباءُ الحاملون لـ<strong>ترخيص دوام كامل (FTL)</strong> من
            هيئة الصحة بدبي فقط، مما يضمن أن التصنيف يعكس الممارسين بدوام كامل لا التسجيلات
            بدوام جزئي أو الامتيازات الزيارية.
          </p>
          <p className="font-['Geist',sans-serif] text-sm text-black/40 leading-relaxed mb-3">
            تستقى جميع البيانات مباشرةً من{" "}
            <strong>سجل شريان الطبي لهيئة الصحة بدبي</strong> — قاعدة البيانات الرسمية
            لهيئة الصحة بدبي. لا توجد مواضع مدفوعة أو تصنيفات مموّلة أو درجات مراجعة ذاتية.
          </p>
          <p className="text-[11px] text-black/40">
            لا تُمثّل هذه التصنيفات نصيحةً طبية. تحقق دائماً من الأوراق الاعتمادية واستشر
            مقدمي الرعاية الصحية مباشرةً قبل اتخاذ أي قرار.
          </p>
        </div>
      </section>

      {/* Cross-links */}
      <section className="mb-10">
        <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
            صفحات ذات صلة
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/ar/professionals"
            className="border border-black/[0.06] p-4 hover:border-[#006828]/15 transition-colors group"
          >
            <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] group-hover:text-[#006828] transition-colors tracking-tight">
              دليل المهنيين الكامل
            </p>
            <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">
              ابحث بين جميع {PROFESSIONAL_STATS.total.toLocaleString("ar-AE")} كادراً صحياً
            </p>
          </Link>
          <Link
            href="/ar/find-a-doctor"
            className="border border-black/[0.06] p-4 hover:border-[#006828]/15 transition-colors group"
          >
            <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] group-hover:text-[#006828] transition-colors tracking-tight">
              ابحث عن طبيب
            </p>
            <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">
              تصفّح حسب الفئة أو التخصص أو المنشأة
            </p>
          </Link>
          <Link
            href="/ar/directory"
            className="border border-black/[0.06] p-4 hover:border-[#006828]/15 transition-colors group"
          >
            <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] group-hover:text-[#006828] transition-colors tracking-tight">
              دليل الرعاية الصحية في الإمارات
            </p>
            <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">
              تصفّح أكثر من 12,000 منشأة عبر جميع مدن الإمارات
            </p>
          </Link>
        </div>
      </section>

      {/* Disclaimer */}
      <div className="border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>المصدر:</strong> سجل المهنيين الطبيين شريان التابع لهيئة الصحة بدبي (DHA).
          تاريخ استخراج البيانات: {PROFESSIONAL_STATS.scraped}. هذا الدليل لأغراض معلوماتية فقط
          ولا يمثّل نصيحة طبية. يُرجى التحقق من أوراق اعتماد المهنيين مباشرة من هيئة الصحة بدبي
          قبل اتخاذ أي قرار صحي.
        </p>
      </div>
    </div>
  );
}
