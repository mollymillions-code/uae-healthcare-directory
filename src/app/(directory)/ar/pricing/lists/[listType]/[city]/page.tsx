import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, MapPin } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { FaqSection } from "@/components/seo/FaqSection";
import { getListBySlug, getAllListCityParams } from "@/lib/constants/pricing-lists";
import { formatAed } from "@/lib/constants/procedures";
import { CITIES } from "@/lib/constants/cities";
import { breadcrumbSchema, speakableSchema, faqPageSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { getArabicCityName } from "@/lib/i18n";

export const revalidate = 43200;
export const dynamicParams = true;

export function generateStaticParams() {
  return getAllListCityParams();
}

interface Props {
  params: Promise<{ listType: string; city: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { listType, city: citySlug } = await params;
  const list = getListBySlug(listType);
  const city = CITIES.find((c) => c.slug === citySlug);
  if (!list || !city) return {};

  const base = getBaseUrl();
  const items = list.getItems(citySlug);
  const cityNameAr = getArabicCityName(citySlug);
  const title = list.titleTemplate.replace("{city}", cityNameAr);
  const description = list.descriptionTemplate.replace("{city}", cityNameAr);

  return {
    title: `${title} | التسعير الطبي في الإمارات`,
    description: `${description} ${items.length.toLocaleString("ar-AE")} إجراءً مصنّفاً.`,
    alternates: {
      canonical: `${base}/ar/pricing/lists/${listType}/${citySlug}`,
      languages: {
        "en-AE": `${base}/pricing/lists/${listType}/${citySlug}`,
        "ar-AE": `${base}/ar/pricing/lists/${listType}/${citySlug}`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${base}/ar/pricing/lists/${listType}/${citySlug}`,
      type: "website",
    },
  };
}

export default async function ArPricingListPage({ params }: Props) {
  const { listType, city: citySlug } = await params;
  const list = getListBySlug(listType);
  const city = CITIES.find((c) => c.slug === citySlug);
  if (!list || !city) notFound();

  const base = getBaseUrl();
  const items = list.getItems(citySlug);
  if (items.length === 0) notFound();

  const cityNameAr = getArabicCityName(citySlug);
  const title = list.titleTemplate.replace("{city}", cityNameAr);
  const description = list.descriptionTemplate.replace("{city}", cityNameAr);

  const regulatorAr =
    citySlug === "dubai" ? "هيئة الصحة بدبي (DHA)"
    : (citySlug === "abu-dhabi" || citySlug === "al-ain") ? "دائرة الصحة - أبوظبي (DOH)"
    : "وزارة الصحة ووقاية المجتمع (MOHAP)";

  const otherCities = CITIES.filter((c) => c.slug !== citySlug && list.getItems(c.slug).length > 0);

  const coverageLabelAr = (coverage: string) => {
    switch (coverage) {
      case "typically-covered": return "مغطى";
      case "partially-covered": return "جزئياً";
      case "rarely-covered": return "نادراً";
      default: return "غير مغطى";
    }
  };

  const faqs = [
    {
      question: `ما هي أبرز الإجراءات الطبية في ${cityNameAr} وفق هذه القائمة؟`,
      answer: `أبرز ${items.length.toLocaleString("ar-AE")} إجراءً مصنّفاً: ${items.slice(0, 5).map((p, i) => `${(i + 1).toLocaleString("ar-AE")}. ${p.name} (${formatAed(p.cityPricing[citySlug]?.typical ?? 0)})`).join("، ")}${items.length > 5 ? `، وأكثر من ذلك` : ""}.`,
    },
    {
      question: `كيف تقارن تكاليف الرعاية الطبية في ${cityNameAr} بمدن الإمارات الأخرى؟`,
      answer: `${cityNameAr} ${citySlug === "dubai" ? "هي عموماً الأغلى في الإمارات" : citySlug === "abu-dhabi" ? "ثاني أغلى إمارة" : "أوفر من دبي وأبوظبي"} للإجراءات الطبية. تتفاوت الأسعار بنسبة 30-50٪ بين أرخص الإمارات وأغلاها للإجراء ذاته.`,
    },
    {
      question: `هل تُغطي هذه الإجراءات التأمينُ في ${cityNameAr}؟`,
      answer: `تعتمد التغطية على الإجراء وخطتك التأمينية. ${items.filter((p) => p.insuranceCoverage === "typically-covered").length.toLocaleString("ar-AE")} من ${items.length.toLocaleString("ar-AE")} إجراءً في هذه القائمة مشمولة عادةً بالتأمين الصحي الإماراتي. الرعاية الصحية في ${cityNameAr} تُنظِّمها ${regulatorAr}.`,
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
          { name: "قوائم الأسعار", url: `${base}/ar/pricing/lists` },
          { name: title },
        ])}
      />
      <JsonLd data={faqPageSchema(faqs)} />
      <JsonLd data={speakableSchema([".answer-block"])} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: title,
          description,
          numberOfItems: items.length,
          inLanguage: "ar",
          itemListOrder: "https://schema.org/ItemListOrderDescending",
          itemListElement: items.map((proc, i) => ({
            "@type": "ListItem",
            position: i + 1,
            item: {
              "@type": "MedicalProcedure",
              name: proc.name,
              url: `${base}/ar/pricing/${proc.slug}/${citySlug}`,
              estimatedCost: {
                "@type": "MonetaryAmount",
                currency: "AED",
                value: proc.cityPricing[citySlug]?.typical ?? 0,
              },
            },
          })),
        }}
      />

      <Breadcrumb
        items={[
          { label: "الإمارات", href: "/ar" },
          { label: "تكاليف الإجراءات الطبية", href: "/ar/pricing" },
          { label: "قوائم الأسعار", href: "/ar/pricing/lists" },
          { label: title },
        ]}
      />

      {/* Hero */}
      <div className="mb-8">
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-2">
          {title}
        </h1>
        <div className="flex items-center gap-2 text-sm text-black/40 mb-4">
          <MapPin className="w-4 h-4" />
          <span>{cityNameAr}، الإمارات</span>
          <span>·</span>
          <span>{items.length.toLocaleString("ar-AE")} إجراءً</span>
          <span>·</span>
          <span>مرتّبة: {list.sortLabel}</span>
        </div>

        <div className="border-r-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6" data-answer-block="true">
          <p className="font-['Geist',sans-serif] text-sm text-black/40 leading-relaxed">{description}</p>
        </div>
      </div>

      {/* Ranked list */}
      <div className="border border-black/[0.06] divide-y divide-black/[0.06] mb-10">
        <div className="hidden sm:grid grid-cols-6 gap-4 p-3 bg-[#f8f8f6] text-[11px] font-bold text-black/40 uppercase tracking-wider">
          <div>#</div>
          <div className="col-span-2">الإجراء</div>
          <div className="text-left">السعر النموذجي</div>
          <div className="text-left">النطاق</div>
          <div className="text-left">التأمين</div>
        </div>
        {items.map((proc, i) => {
          const pricing = proc.cityPricing[citySlug];
          if (!pricing) return null;

          const coverageColor =
            proc.insuranceCoverage === "typically-covered" ? "text-green-700 bg-green-50"
            : proc.insuranceCoverage === "partially-covered" ? "text-yellow-700 bg-yellow-50"
            : proc.insuranceCoverage === "rarely-covered" ? "text-orange-700 bg-orange-50"
            : "text-red-700 bg-red-50";

          return (
            <Link
              key={proc.slug}
              href={`/ar/pricing/${proc.slug}/${citySlug}`}
              className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-4 p-3 hover:bg-[#f8f8f6] transition-colors group items-center"
            >
              <div className="hidden sm:block">
                <span className="text-lg font-bold text-[#006828]">#{(i + 1).toLocaleString("ar-AE")}</span>
              </div>
              <div className="col-span-2">
                <div className="flex items-center gap-2">
                  <span className="sm:hidden text-sm font-bold text-[#006828]">#{(i + 1).toLocaleString("ar-AE")}</span>
                  <h3 className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] truncate">
                    {proc.name}
                  </h3>
                </div>
                <p className="text-[11px] text-black/40">
                  {proc.duration} · {proc.setting} · {proc.recoveryTime}
                </p>
              </div>
              <div className="text-left">
                <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight">
                  {formatAed(pricing.typical)}
                </p>
              </div>
              <div className="text-left hidden sm:block">
                <p className="font-['Geist',sans-serif] text-xs text-black/40">
                  {formatAed(pricing.min)}–{formatAed(pricing.max)}
                </p>
              </div>
              <div className="text-left">
                <span className={`text-[10px] font-medium px-2 py-0.5 ${coverageColor}`}>
                  {coverageLabelAr(proc.insuranceCoverage)}
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Same list in other cities */}
      {otherCities.length > 0 && (
        <>
          <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
              نفس القائمة في مدن أخرى
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
            {otherCities.map((c) => (
              <Link
                key={c.slug}
                href={`/ar/pricing/lists/${listType}/${c.slug}`}
                className="border border-black/[0.06] p-3 hover:border-[#006828]/15 transition-colors group flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-black/40" />
                  <span className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828]">
                    {getArabicCityName(c.slug)}
                  </span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-black/40 group-hover:text-[#006828] rotate-180" />
              </Link>
            ))}
          </div>
        </>
      )}

      {/* FAQ */}
      <FaqSection faqs={faqs} title={`${title} — الأسئلة الشائعة`} />

      <div className="mt-8 border-t border-black/[0.06] pt-4 flex justify-between items-start">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>إخلاء المسؤولية:</strong> التصنيفات مستندة إلى أسعار الإجراءات النموذجية في {cityNameAr} من بيانات تعرفة DOH/DHA وأسعار السوق حتى مارس ٢٠٢٦. الرعاية الصحية تُنظِّمها {regulatorAr}.
        </p>
        <Link href={`/pricing/lists/${listType}/${city.slug}`} className="text-xs text-[#006828] hover:underline whitespace-nowrap mr-4">
          English version
        </Link>
      </div>
    </div>
  );
}
