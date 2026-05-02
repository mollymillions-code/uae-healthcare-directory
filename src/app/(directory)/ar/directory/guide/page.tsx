import { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

export const revalidate = 43200;

export function generateMetadata(): Metadata {
  const base = getBaseUrl();
  return {
    title: "دليل الرعاية الصحية الإماراتية | دليل الإمارات المفتوح للرعاية الصحية",
    description:
      "افهم المنظومة الصحية في الإمارات. أدلة حول DHA وDOH وMOHAP والتأمين الصحي واختيار الطبيب والمناطق الحرة وخدمات الطوارئ.",
    alternates: {
      canonical: `${base}/ar/directory/guide`,
      languages: {
        "en-AE": `${base}/directory/guide`,
        "ar-AE": `${base}/ar/directory/guide`,
        "x-default": `${base}/directory/guide`,
      },
    },
  };
}

const GUIDE_LINKS = [
  {
    title: "كيف تعمل منظومة الرعاية الصحية في الإمارات",
    slug: "how-uae-healthcare-works",
    description:
      "نظرة عامة على نظام السلطات الثلاث والتأمين الإلزامي وآلية عمل القطاعين العام والخاص.",
  },
  {
    title: "فهم التأمين الصحي في الإمارات",
    slug: "health-insurance-uae",
    description:
      "قواعد التأمين الإلزامي والمزودون الرئيسيون مثل ضمان وثيقة وكيفية التحقق من تغطيتك.",
  },
  {
    title: "ما هي هيئة الصحة بدبي (DHA)؟",
    slug: "what-is-dha",
    description:
      "الجهة التنظيمية للقطاع الصحي في دبي ودورها في الترخيص ومدينة دبي الطبية.",
  },
  {
    title: "ما هي دائرة الصحة أبوظبي (DOH)؟",
    slug: "what-is-doh",
    description:
      "الجهة التنظيمية الصحية في أبوظبي وإرث هيئة الصحة وتأمين ثيقة للمواطنين.",
  },
  {
    title: "ما هي وزارة الصحة ووقاية المجتمع (MOHAP)؟",
    slug: "what-is-mohap",
    description:
      "وزارة الصحة الاتحادية المشرفة على الرعاية الصحية في إمارات الشمال.",
  },
  {
    title: "كيف تختار طبيباً في الإمارات",
    slug: "choosing-a-doctor-uae",
    description:
      "نصائح عملية حول التحقق من الاعتمادات وشبكات التأمين والعثور على المتخصص المناسب.",
  },
  {
    title: "المناطق الحرة الصحية في دبي",
    slug: "healthcare-free-zones-dubai",
    description:
      "ما تعنيه مدينة دبي الطبية والمناطق الحرة الأخرى للمرضى ومقدمي الرعاية الدوليين.",
  },
  {
    title: "خدمات الطوارئ في الإمارات",
    slug: "emergency-services-uae",
    description:
      "أرقام الطوارئ الأساسية وأين تذهب في حالة الطوارئ الطبية ومتى تختار الرعاية العاجلة.",
  },
];

export default function ArGuideHubPage() {
  const base = getBaseUrl();

  return (
    <div dir="rtl" lang="ar" className="font-arabic max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd
        data={breadcrumbSchema([
          { name: "الرئيسية", url: base },
          { name: "دليل الرعاية الصحية", url: `${base}/ar/directory/guide` },
        ])}
      />

      <Breadcrumb
        items={[
          { label: "الرئيسية", href: "/ar" },
          { label: "دليل الرعاية الصحية" },
        ]}
      />

      <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-6">
        دليل الرعاية الصحية في الإمارات
      </h1>

      <div className="border-r-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 mb-10" data-answer-block="true">
        <p className="font-['Geist',sans-serif] text-black/60 leading-relaxed text-lg">
          دليل شامل للتعامل مع منظومة الرعاية الصحية في الإمارات العربية المتحدة.
          تعرّف على آلية عمل الجهاز التنظيمي، وافهم خيارات التأمين المتاحة،
          وابحث عن الطبيب المناسب، واعرف ما يجب فعله في حالات الطوارئ.
          كل مقالة مكتوبة للمقيمين والزوار الباحثين عن معلومات واضحة وموثوقة.
        </p>
      </div>

      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">جميع الأدلة</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        {GUIDE_LINKS.map((guide) => (
          <Link
            key={guide.slug}
            href={`/ar/directory/guide/${guide.slug}`}
            className="border border-black/[0.06] p-5 hover:border-[#006828]/15 transition-colors group"
          >
            <h3 className="text-lg font-bold text-[#1c1c1c] group-hover:text-[#006828] transition-colors mb-2">
              {guide.title}
            </h3>
            <p className="font-['Geist',sans-serif] text-sm text-black/40">
              {guide.description}
            </p>
          </Link>
        ))}
      </div>

      <div className="mt-10 border-t border-black/[0.06] pt-4 flex items-center justify-between gap-4 flex-wrap">
        <p className="text-[11px] text-black/40">
          هذه الأدلة لأغراض معلوماتية فقط ولا تُعدّ نصيحة طبية.
        </p>
        <Link href="/directory/guide" className="text-[11px] text-[#006828] hover:underline whitespace-nowrap">
          English version →
        </Link>
      </div>
    </div>
  );
}
