import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { ar } from "@/lib/i18n";
import {
  getFacilityBenchmarks,
  getAllFacilities,
  PROFESSIONAL_CATEGORIES,
  PROFESSIONAL_STATS,
} from "@/lib/workforce";
import { getSpecialtyBySlug } from "@/lib/constants/professionals";

export const revalidate = 43200;
export const dynamicParams = true;

interface Props {
  params: { slug: string };
}

export function generateStaticParams() {
  return getAllFacilities(20)
    .slice(0, 100)
    .map((f) => ({ slug: f.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const bench = getFacilityBenchmarks(params.slug);
  if (!bench) {
    return {
      title: "ملف القوى العاملة في المنشأة",
      description:
        "ملف القوى العاملة لمنشأة صحية في دبي. عدد الموظفين المرخّصين، توزيع التخصصات، ومعايير التوظيف.",
    };
  }
  const base = getBaseUrl();
  return {
    title: `القوى العاملة في ${bench.name}`,
    description: `ملف القوى العاملة لـ ${bench.name}: ${bench.totalStaff.toLocaleString("ar-AE")} موظفاً مرخّصاً من هيئة صحة دبي، ${bench.specialtyBreadth} تخصصاً، نسبة ممرض/طبيب ${bench.nurseToDoctorRatio}:1. توزيع الفئات ومعايير التوظيف.`,
    alternates: {
      canonical: `${base}/ar/workforce/employer/${bench.slug}`,
      languages: {
        "en-AE": `${base}/workforce/employer/${bench.slug}`,
        "ar-AE": `${base}/ar/workforce/employer/${bench.slug}`,
      },
    },
    openGraph: {
      title: `القوى العاملة في ${bench.name}`,
      description: `${bench.totalStaff.toLocaleString("ar-AE")} كادر صحي مرخّص في ${bench.specialtyBreadth} تخصصاً. معايير التوظيف وتوزيع الفئات.`,
      url: `${base}/ar/workforce/employer/${bench.slug}`,
      type: "website",
      siteName: ar.siteName,
    },
  };
}

function sizeTierLabelAr(tier: string): string {
  switch (tier) {
    case "mega":
      return "عملاق (500+ موظف)";
    case "large":
      return "كبير (100–499 موظف)";
    case "mid":
      return "متوسط (20–99 موظف)";
    case "small":
      return "صغير (5–19 موظف)";
    case "micro":
      return "مصغّر (أقل من 5 موظفين)";
    default:
      return tier;
  }
}

export default function ArabicEmployerProfilePage({ params }: Props) {
  const bench = getFacilityBenchmarks(params.slug);
  if (!bench) notFound();

  const base = getBaseUrl();

  const categoryBreakdown = PROFESSIONAL_CATEGORIES.map((cat) => ({
    nameAr: cat.nameAr,
    name: cat.name,
    count: bench.categories[cat.slug] || 0,
    pct:
      bench.totalStaff > 0
        ? ((bench.categories[cat.slug] || 0) / bench.totalStaff) * 100
        : 0,
  })).filter((c) => c.count > 0);

  return (
    <div
      dir="rtl"
      lang="ar"
      className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8"
    >
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: `القوى العاملة في ${bench.name}`,
          description: `ملف القوى العاملة لـ ${bench.name}: ${bench.totalStaff.toLocaleString()} موظفاً مرخّصاً من هيئة صحة دبي.`,
          url: `${base}/ar/workforce/employer/${bench.slug}`,
          inLanguage: "ar",
          about: {
            "@type": "MedicalBusiness",
            name: bench.name,
            numberOfEmployees: {
              "@type": "QuantitativeValue",
              value: bench.totalStaff,
            },
          },
        }}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: "الإمارات", url: `${base}/` },
          { name: ar.workforce.title, url: `${base}/ar/workforce/overview` },
          {
            name: "أصحاب العمل",
            url: `${base}/workforce/rankings/top-employers`,
          },
          { name: bench.name },
        ])}
      />

      <Breadcrumb
        items={[
          { label: "الإمارات", href: "/" },
          { label: ar.workforce.title, href: "/ar/workforce/overview" },
          {
            label: "أصحاب العمل",
            href: "/ar/workforce/rankings/top-employers",
          },
          { label: bench.name },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <p className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium tracking-wider uppercase mb-2">
          ملف قوى عاملة — صاحب عمل
        </p>
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-2">
          {bench.name}
        </h1>
        <p className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium tracking-wider uppercase mb-4">
          {bench.totalStaff.toLocaleString("ar-AE")} موظف مرخّص &middot;{" "}
          {sizeTierLabelAr(bench.sizeTier)} &middot; البيانات:{" "}
          {PROFESSIONAL_STATS.scraped}
        </p>
        <div className="border-r-4 border-[#006828] bg-[#006828]/[0.04] py-5 px-6 mb-6">
          <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
            ملف القوى العاملة لـ {bench.name} مبنيٌّ على بيانات السجل الطبي
            المهني لهيئة صحة دبي (شريان). تضم هذه المنشأة{" "}
            {bench.totalStaff.toLocaleString("ar-AE")} كادراً مرخّصاً في{" "}
            {bench.specialtyBreadth} تخصصاً، بنسبة ممرض إلى طبيب{" "}
            {bench.nurseToDoctorRatio}:1 ومعدل ترخيص FTL (مستقل){" "}
            {bench.ftlRate}%.
          </p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
        {[
          {
            value: bench.totalStaff.toLocaleString("ar-AE"),
            label: "إجمالي الكوادر المرخّصة",
          },
          {
            value: `${bench.nurseToDoctorRatio}:1`,
            label: ar.workforce.nurseToDoctorRatio,
          },
          { value: `${bench.ftlRate}%`, label: ar.workforce.ftlRate },
          {
            value: bench.specialtyBreadth.toString(),
            label: "التخصصات الفريدة",
          },
          {
            value: sizeTierLabelAr(bench.sizeTier).split(" (")[0],
            label: "حجم المنشأة",
          },
          {
            value: bench.physicians.toLocaleString("ar-AE"),
            label: "الأطباء",
          },
        ].map(({ value, label }) => (
          <div key={label} className="bg-[#f8f8f6] p-4 text-center">
            <p className="font-['Geist_Mono',monospace] text-xl font-bold text-[#006828]">
              {value}
            </p>
            <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* Category Breakdown */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          القوى العاملة حسب الفئة
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        {categoryBreakdown.map((cat) => (
          <div key={cat.name} className="border border-black/[0.06] p-4">
            <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight mb-1">
              {cat.nameAr}
            </p>
            <p className="font-['Geist_Mono',monospace] text-xl font-bold text-[#006828] mb-1">
              {cat.count.toLocaleString("ar-AE")}
            </p>
            <div className="w-full bg-black/[0.04] h-1.5 mb-2">
              <div
                className="bg-[#006828] h-1.5"
                style={{ width: `${Math.min(cat.pct, 100)}%` }}
              />
            </div>
            <p className="font-['Geist_Mono',monospace] text-[11px] text-black/40">
              {cat.pct.toFixed(1)}% من موظفي المنشأة
            </p>
          </div>
        ))}
      </div>

      {/* Top Specialties */}
      {bench.topSpecialties.length > 0 && (
        <>
          <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
              أبرز التخصصات
            </h2>
          </div>
          <div className="mb-12 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-[#1c1c1c]">
                  <th
                    scope="col"
                    className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pl-4 w-10"
                  >
                    #
                  </th>
                  <th
                    scope="col"
                    className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pl-4"
                  >
                    التخصص
                  </th>
                  <th
                    scope="col"
                    className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pl-4"
                  >
                    العدد
                  </th>
                  <th
                    scope="col"
                    className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2"
                  >
                    % من الموظفين
                  </th>
                </tr>
              </thead>
              <tbody>
                {bench.topSpecialties.map((spec, i) => {
                  const pct =
                    bench.totalStaff > 0
                      ? ((spec.count / bench.totalStaff) * 100).toFixed(1)
                      : "0.0";
                  const specData = getSpecialtyBySlug(spec.slug);
                  return (
                    <tr
                      key={spec.slug}
                      className="border-b border-black/[0.06]"
                    >
                      <td className="py-2.5 pl-4 font-['Geist_Mono',monospace] text-xs text-black/30 text-right">
                        {i + 1}
                      </td>
                      <td className="py-2.5 pl-4 text-right">
                        <Link
                          href={`/ar/workforce/specialty/${spec.slug}`}
                          className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight hover:text-[#006828] transition-colors"
                        >
                          {specData?.nameAr || spec.name}
                        </Link>
                      </td>
                      <td className="py-2.5 pl-4">
                        <span className="font-['Geist_Mono',monospace] text-sm font-bold text-[#006828]">
                          {spec.count.toLocaleString("ar-AE")}
                        </span>
                      </td>
                      <td className="py-2.5">
                        <span className="font-['Geist_Mono',monospace] text-xs text-black/40">
                          {pct}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Cross-Links */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          صفحات ذات صلة
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
        <Link
          href={`/ar/professionals/facility/${bench.slug}`}
          className="border border-black/[0.06] p-4 hover:border-[#006828]/15 transition-colors group"
        >
          <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
            دليل الكوادر الكامل
          </p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">
            تصفّح جميع الـ {bench.totalStaff.toLocaleString("ar-AE")} كادر
            مرخّص في هذه المنشأة
          </p>
        </Link>
        <Link
          href={`/ar/doctors-at/${bench.slug}`}
          className="border border-black/[0.06] p-4 hover:border-[#006828]/15 transition-colors group"
        >
          <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
            الأطباء في {bench.name}
          </p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">
            الأطباء وأطباء الأسنان حسب التخصص ومستوى الأقدمية
          </p>
        </Link>
        <Link
          href="/ar/workforce/rankings/top-employers"
          className="border border-black/[0.06] p-4 hover:border-[#006828]/15 transition-colors group"
        >
          <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
            أكبر 50 صاحب عمل
          </p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">
            شاهد ترتيب هذه المنشأة مقارنةً بأكبر أصحاب العمل في دبي
          </p>
        </Link>
      </div>

      {/* Disclaimer */}
      <div className="border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>المصدر:</strong> السجل الطبي المهني لهيئة صحة دبي (DHA) —
          شريان. تاريخ الجمع: {PROFESSIONAL_STATS.scraped}. أعداد الموظفين
          تعكس الكوادر المرخّصة من هيئة صحة دبي فحسب ولا تشمل الإداريين
          أو طاقم الدعم غير المرخّص. تحقق من الاعتمادات مباشرةً من هيئة
          صحة دبي.
        </p>
      </div>
    </div>
  );
}
