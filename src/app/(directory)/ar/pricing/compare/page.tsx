import { Metadata } from "next";
import Link from "next/link";
import { BarChart3, ArrowRight } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { CITIES } from "@/lib/constants/cities";
import { breadcrumbSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { getArabicCityName } from "@/lib/i18n";

export const revalidate = 43200;

export function generateMetadata(): Metadata {
  const base = getBaseUrl();
  return {
    title:
      "مقارنة تكاليف الرعاية الصحية بين المدن الإماراتية — دليل الإمارات المفتوح للرعاية الصحية",
    description:
      "قارن أسعار الإجراءات الطبية بين مدن الإمارات الثماني. شاهد أي المدن أرخص في التشخيص والأسنان والجراحة والأمومة وأكثر من ٤٠ إجراءً طبياً.",
    alternates: {
      canonical: `${base}/ar/pricing/compare`,
      languages: {
        "en-AE": `${base}/pricing/compare`,
        "ar-AE": `${base}/ar/pricing/compare`,
      },
    },
    openGraph: {
      title: "مقارنة تكاليف الرعاية الصحية بين مدن الإمارات",
      description:
        "مقارنة جانبية لأسعار الإجراءات الطبية في ٨ مدن إماراتية. بناءً على بيانات تعرفة وزارة الصحة الإلزامية.",
      url: `${base}/ar/pricing/compare`,
      type: "website",
    },
  };
}

/** All 28 alphabetically-ordered city pairs */
function getAllCityPairs(): { cityA: string; cityB: string }[] {
  const slugs = CITIES.map((c) => c.slug);
  const pairs: { cityA: string; cityB: string }[] = [];
  for (let i = 0; i < slugs.length; i++) {
    for (let j = i + 1; j < slugs.length; j++) {
      pairs.push({ cityA: slugs[i], cityB: slugs[j] });
    }
  }
  return pairs;
}

export default function ArPricingCompareHubPage() {
  const base = getBaseUrl();
  const pairs = getAllCityPairs();

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
          { name: "مقارنة المدن" },
        ])}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "مقارنة تكاليف الرعاية الصحية بين المدن الإماراتية",
          description:
            "مقارنة أسعار الإجراءات الطبية بين مدن الإمارات العربية المتحدة",
          url: `${base}/ar/pricing/compare`,
          inLanguage: "ar",
        }}
      />

      <Breadcrumb
        items={[
          { label: "الإمارات", href: "/ar" },
          { label: "تكاليف الإجراءات الطبية", href: "/ar/pricing" },
          { label: "مقارنة المدن" },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <BarChart3 className="w-8 h-8 text-[#006828]" />
          <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight">
            مقارنة تكاليف الرعاية الصحية بين المدن
          </h1>
        </div>
        <div
          className="border-r-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 mb-6"
          data-answer-block="true"
        >
          <p className="font-['Geist',sans-serif] text-black/40 leading-relaxed">
            قارن أسعار الإجراءات الطبية بين مدن الإمارات الثماني. تغطي
            المقارنات أكثر من ٤٠ إجراءً طبياً تشمل التشخيص والأسنان والجراحة
            والأمومة وغيرها. تستند البيانات إلى تعرفة وزارة الصحة الإلزامية
            ومعدلات السوق المرصودة حتى مارس ٢٠٢٦.
          </p>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { value: pairs.length.toLocaleString("ar-AE"), label: "زوج مقارنة بين المدن" },
            { value: (40).toLocaleString("ar-AE") + "+", label: "إجراء طبي" },
            { value: CITIES.length.toLocaleString("ar-AE"), label: "مدينة إماراتية" },
            { value: "٢٠٢٦", label: "سنة البيانات" },
          ].map(({ value, label }) => (
            <div key={label} className="bg-[#f8f8f6] p-4 text-center">
              <p className="text-2xl font-bold text-[#006828]">{value}</p>
              <p className="font-['Geist',sans-serif] text-xs text-black/40">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* City pair grid */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          جميع مقارنات المدن
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-12">
        {pairs.map(({ cityA, cityB }) => {
          const cityAObj = CITIES.find((c) => c.slug === cityA)!;
          const cityBObj = CITIES.find((c) => c.slug === cityB)!;
          const slug = `${cityA}-vs-${cityB}`;
          return (
            <Link
              key={slug}
              href={`/ar/pricing/compare/${slug}`}
              className="border border-black/[0.06] p-4 hover:border-[#006828]/15 transition-colors group flex items-center justify-between"
            >
              <span className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] group-hover:text-[#006828] transition-colors">
                {getArabicCityName(cityAObj.slug)} مقابل {getArabicCityName(cityBObj.slug)}
              </span>
              <ArrowRight className="w-4 h-4 text-black/40 group-hover:text-[#006828] flex-shrink-0 rotate-180" />
            </Link>
          );
        })}
      </div>

      {/* Cross-link to English */}
      <div className="mt-8 border-t border-black/[0.06] pt-4 flex justify-between items-center">
        <p className="text-[11px] text-black/40">
          <strong>إخلاء المسؤولية:</strong> جميع الأسعار المعروضة نطاقات تقريبية
          مستندة إلى منهجية التعرفة الإلزامية لوزارة الصحة (شفافية) وبيانات
          السوق المرصودة حتى مارس ٢٠٢٦.
        </p>
        <Link
          href="/pricing/compare"
          className="text-xs text-[#006828] hover:underline whitespace-nowrap mr-4"
        >
          English version
        </Link>
      </div>
    </div>
  );
}
