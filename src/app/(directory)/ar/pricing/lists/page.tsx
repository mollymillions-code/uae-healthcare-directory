import { Metadata } from "next";
import Link from "next/link";
import { List, ArrowRight } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { PRICING_LISTS } from "@/lib/constants/pricing-lists";
import { CITIES } from "@/lib/constants/cities";
import { breadcrumbSchema, speakableSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { getArabicCityName } from "@/lib/i18n";

export const revalidate = 43200;

export function generateMetadata(): Metadata {
  const base = getBaseUrl();
  return {
    title:
      "قوائم التسعير الطبي في الإمارات — الأرخص والأغلى والمشمول بالتأمين | دليل الإمارات المفتوح للرعاية الصحية",
    description:
      "تصفح قوائم منتقاة لتكاليف الإجراءات الطبية في الإمارات. ابحث عن الإجراءات الأرخص والعمليات الأغلى والعلاجات المشمولة بالتأمين وغيرها — حسب المدينة والفئة.",
    alternates: {
      canonical: `${base}/ar/pricing/lists`,
      languages: {
        "en-AE": `${base}/pricing/lists`,
        "ar-AE": `${base}/ar/pricing/lists`,
      },
    },
    openGraph: {
      title: "قوائم التسعير الطبي في الإمارات — تصنيفات منتقاة",
      description: `${PRICING_LISTS.length.toLocaleString("ar-AE")} قائمة تسعير منتقاة عبر ٨ مدن إماراتية.`,
      url: `${base}/ar/pricing/lists`,
      type: "website",
    },
  };
}

export default function ArPricingListsHubPage() {
  const base = getBaseUrl();

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
          { name: "قوائم الأسعار" },
        ])}
      />
      <JsonLd data={speakableSchema([".answer-block"])} />

      <Breadcrumb
        items={[
          { label: "الإمارات", href: "/ar" },
          { label: "تكاليف الإجراءات الطبية", href: "/ar/pricing" },
          { label: "قوائم الأسعار" },
        ]}
      />

      <div className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <List className="w-8 h-8 text-[#006828]" />
          <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight">
            قوائم التسعير الطبي في الإمارات
          </h1>
        </div>
        <div className="border-r-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6" data-answer-block="true">
          <p className="font-['Geist',sans-serif] text-black/40 leading-relaxed">
            تصفح {PRICING_LISTS.length.toLocaleString("ar-AE")} قوائم منتقاة لتصنيفات تكاليف الإجراءات الطبية
            عبر ٨ مدن إماراتية. ابحث عن الإجراءات الأرخص والعمليات الأغلى
            وما يُغطيه التأمين وخيارات العيادات الخارجية السريعة.
          </p>
        </div>
      </div>

      {/* List cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
        {PRICING_LISTS.map((list) => (
          <div key={list.slug} className="border border-black/[0.06] rounded-2xl p-5">
            <h2 className="text-sm font-['Bricolage_Grotesque',sans-serif] font-semibold text-[#1c1c1c] tracking-tight mb-2">
              {list.title}
            </h2>
            <p className="font-['Geist',sans-serif] text-xs text-black/40 mb-3">{list.description}</p>
            <div className="flex flex-wrap gap-2">
              {CITIES.slice(0, 4).map((city) => {
                const items = list.getItems(city.slug);
                if (items.length === 0) return null;
                return (
                  <Link
                    key={city.slug}
                    href={`/ar/pricing/lists/${list.slug}/${city.slug}`}
                    className="text-[11px] text-[#006828] hover:underline"
                  >
                    {getArabicCityName(city.slug)} ←
                  </Link>
                );
              })}
              {CITIES.length > 4 && (
                <span className="text-[11px] text-black/40">
                  +{(CITIES.length - 4).toLocaleString("ar-AE")} مدن أخرى
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* All cities quick links */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          تصفح حسب المدينة
        </h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
        {CITIES.map((city) => (
          <div key={city.slug} className="border border-black/[0.06] p-3">
            <h3 className="text-sm font-['Bricolage_Grotesque',sans-serif] font-semibold text-[#1c1c1c] tracking-tight mb-2">
              {getArabicCityName(city.slug)}
            </h3>
            <div className="space-y-1">
              {PRICING_LISTS.slice(0, 4).map((list) => {
                const items = list.getItems(city.slug);
                if (items.length === 0) return null;
                return (
                  <Link
                    key={list.slug}
                    href={`/ar/pricing/lists/${list.slug}/${city.slug}`}
                    className="flex items-center justify-between text-[11px] text-black/40 hover:text-[#006828]"
                  >
                    <span className="truncate">{list.titleTemplate.replace("{city}", "")}</span>
                    <ArrowRight className="w-3 h-3 flex-shrink-0 rotate-180" />
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 border-t border-black/[0.06] pt-4 flex justify-end">
        <Link href="/pricing/lists" className="text-xs text-[#006828] hover:underline">
          English version
        </Link>
      </div>
    </div>
  );
}
