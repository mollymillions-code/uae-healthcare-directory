import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { ar, getArabicAreaName } from "@/lib/i18n";
import {
  getCategoryWorkforceProfile,
  getTopEmployersByCategory,
  getLicenseTypeByCategory,
  PROFESSIONAL_CATEGORIES,
  PROFESSIONAL_STATS,
  DUBAI_POPULATION,
} from "@/lib/workforce";
import { getSpecialtyBySlug } from "@/lib/constants/professionals";

export const revalidate = 43200;
export const dynamicParams = true;

export function generateStaticParams() {
  return PROFESSIONAL_CATEGORIES.map((c) => ({ category: c.slug }));
}

export function generateMetadata({
  params,
}: {
  params: { category: string };
}): Metadata {
  const profile = getCategoryWorkforceProfile(params.category);
  if (!profile) return {};
  const cat = PROFESSIONAL_CATEGORIES.find((c) => c.slug === params.category);
  const base = getBaseUrl();
  const nameAr = cat?.nameAr || profile.name;

  return {
    title: `القوى العاملة في فئة ${nameAr} — دبي`,
    description: `ملف سوق العمل لـ ${profile.totalCount.toLocaleString("ar-AE")} من ${nameAr} المرخّصين في دبي. توزيع التراخيص، التخصصات، كبار أصحاب العمل، والتوزيع الجغرافي. مصدره سجل هيئة صحة دبي شريان.`,
    alternates: {
      canonical: `${base}/ar/workforce/category/${params.category}`,
      languages: {
        "en-AE": `${base}/workforce/category/${params.category}`,
        "ar-AE": `${base}/ar/workforce/category/${params.category}`,
      },
    },
    openGraph: {
      title: `القوى العاملة في فئة ${nameAr} — ${profile.totalCount.toLocaleString("ar-AE")} كادر مرخّص`,
      description: `${profile.totalCount.toLocaleString("ar-AE")} من ${nameAr} يمثّلون ${profile.percentOfWorkforce}% من القوى العاملة الصحية في دبي.`,
      url: `${base}/ar/workforce/category/${params.category}`,
      type: "website",
      siteName: ar.siteName,
    },
  };
}

// ─── معايير منظمة OECD للسياق التحريري ──────────────────────────────────────

const OECD_BENCHMARKS: Record<string, { label: string; per100K: number }> = {
  physicians: { label: "متوسط منظمة OECD للأطباء", per100K: 360 },
  dentists: { label: "متوسط منظمة OECD لأطباء الأسنان", per100K: 70 },
  nurses: { label: "متوسط منظمة OECD للممرضين", per100K: 900 },
  "allied-health": { label: "متوسط منظمة OECD للمهن الصحية المساندة", per100K: 500 },
};

export default function ArabicCategoryWorkforcePage({
  params,
}: {
  params: { category: string };
}) {
  const profile = getCategoryWorkforceProfile(params.category);
  if (!profile) notFound();

  const cat = PROFESSIONAL_CATEGORIES.find((c) => c.slug === params.category);
  const nameAr = cat?.nameAr || profile.name;

  const base = getBaseUrl();
  const license = getLicenseTypeByCategory(params.category);
  const employers = getTopEmployersByCategory(params.category, 20);
  const oecd = OECD_BENCHMARKS[params.category];
  const otherCategories = PROFESSIONAL_CATEGORIES.filter(
    (c) => c.slug !== params.category
  );

  return (
    <div
      dir="rtl"
      lang="ar"
      className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8"
    >
      {/* JSON-LD */}
      <JsonLd
        data={breadcrumbSchema([
          { name: "الإمارات", url: base },
          { name: ar.workforce.title, url: `${base}/ar/workforce/overview` },
          { name: nameAr },
        ])}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: `القوى العاملة في فئة ${nameAr} — دبي`,
          description: `ملف سوق العمل لـ ${profile.totalCount.toLocaleString()} من ${nameAr} المرخّصين من هيئة صحة دبي.`,
          url: `${base}/ar/workforce/category/${params.category}`,
          inLanguage: "ar",
          mainEntity: {
            "@type": "Dataset",
            name: `بيانات القوى العاملة — ${nameAr} في دبي`,
            description: `إحصاءات القوى العاملة لـ ${profile.totalCount.toLocaleString()} من ${nameAr} المرخّصين من DHA.`,
            creator: {
              "@type": "Organization",
              name: "Zavis",
              url: base,
            },
            temporalCoverage: "2026",
            spatialCoverage: {
              "@type": "Place",
              name: "دبي، الإمارات العربية المتحدة",
            },
          },
        }}
      />

      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "الإمارات", href: "/" },
          { label: ar.workforce.title, href: "/ar/workforce/overview" },
          { label: nameAr },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-2">
          {nameAr}: ملف القوى العاملة
        </h1>
        <p className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium tracking-wider uppercase mb-4">
          {profile.totalCount.toLocaleString("ar-AE")} كادر مرخّص &middot;{" "}
          {profile.percentOfWorkforce}% من القوى العاملة الصحية في دبي &middot;{" "}
          {profile.per100K} لكل 100,000 نسمة
        </p>
        <div className="border-r-4 border-[#006828] bg-[#006828]/[0.04] py-5 px-6">
          <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
            تحليل سوق العمل لفئة {nameAr} في دبي، يتناول توزيع التراخيص،
            تفصيل التخصصات، تركّز أصحاب العمل، والانتشار الجغرافي. جميع
            البيانات مصدرها السجل الطبي المهني لهيئة صحة دبي (شريان).
          </p>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
        {[
          {
            value: profile.totalCount.toLocaleString("ar-AE"),
            label: "إجمالي المرخّصين",
          },
          {
            value: `${license.ftlPercent}% / ${license.regPercent}%`,
            label: "FTL / REG",
          },
          {
            value: profile.per100K.toString(),
            label: ar.workforce.perCapita,
          },
          {
            value: profile.specialties.length.toString(),
            label: "عدد التخصصات",
          },
        ].map(({ value, label }) => (
          <div key={label} className="bg-[#f8f8f6] p-5 text-center">
            <p className="font-['Geist_Mono',monospace] text-2xl sm:text-3xl font-bold text-[#006828]">
              {value}
            </p>
            <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* OECD Benchmark Note */}
      {oecd && (
        <div className="border-r-4 border-[#006828] bg-[#006828]/[0.04] py-4 px-6 mb-12">
          <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
            <strong>المعيار المرجعي:</strong> معدّل دبي البالغ{" "}
            <span className="font-['Geist_Mono',monospace] font-bold text-[#1c1c1c]">
              {profile.per100K}
            </span>{" "}
            من {nameAr} لكل 100,000 نسمة يُقارَن بـ{" "}
            {oecd.label} البالغ{" "}
            <span className="font-['Geist_Mono',monospace] font-bold text-[#1c1c1c]">
              {oecd.per100K}
            </span>{" "}
            لكل 100,000 نسمة.{" "}
            {profile.per100K < oecd.per100K * 0.7
              ? "يشير ذلك إلى نقص نسبي في العرض، وإن كانت التركيبة السكانية لدبي (الشابة والوافدة بكثافة) تؤثر على أنماط الطلب."
              : profile.per100K > oecd.per100K * 1.1
                ? "يتجاوز هذا المعيار OECD، ما يعكس مكانة دبي مركزاً إقليمياً للسياحة الطبية."
                : "يتماشى هذا عموماً مع معايير OECD، مع مراعاة الخصائص الديموغرافية الفريدة لدبي."}
          </p>
        </div>
      )}

      {/* License Type Breakdown */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          توزيع أنواع التراخيص
        </h2>
      </div>
      <div className="border-r-4 border-[#006828] bg-[#006828]/[0.04] py-5 px-6 mb-6">
        <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
          تُصدر هيئة صحة دبي نوعين رئيسيين من التراخيص:{" "}
          <strong>FTL</strong> (ترخيص تجاري كامل) للمهنيين الذين يعملون تحت
          ترخيصهم الخاص، و<strong>REG</strong> (مسجّل) للمهنيين العاملين
          تحت ترخيص منشأة. ارتفاع نسبة FTL يدل عادةً على وجود ممارسين
          مستقلين وأصحاب عيادات خاصة.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-12">
        <div className="bg-[#f8f8f6] p-5">
          <p className="font-['Geist_Mono',monospace] text-xs text-black/40 uppercase tracking-wider mb-2">
            FTL — ترخيص تجاري كامل
          </p>
          <p className="text-2xl font-bold text-[#006828]">
            {license.ftl.toLocaleString("ar-AE")}
          </p>
          <div className="w-full bg-black/[0.04] h-1.5 mt-2 mb-1">
            <div
              className="bg-[#006828] h-1.5"
              style={{ width: `${license.ftlPercent}%` }}
            />
          </div>
          <p className="font-['Geist',sans-serif] text-xs text-black/40">
            {license.ftlPercent}% من {nameAr}
          </p>
        </div>
        <div className="bg-[#f8f8f6] p-5">
          <p className="font-['Geist_Mono',monospace] text-xs text-black/40 uppercase tracking-wider mb-2">
            REG — مسجّل
          </p>
          <p className="text-2xl font-bold text-[#1c1c1c]">
            {license.reg.toLocaleString("ar-AE")}
          </p>
          <div className="w-full bg-black/[0.04] h-1.5 mt-2 mb-1">
            <div
              className="bg-[#1c1c1c] h-1.5"
              style={{ width: `${license.regPercent}%` }}
            />
          </div>
          <p className="font-['Geist',sans-serif] text-xs text-black/40">
            {license.regPercent}% من {nameAr}
          </p>
        </div>
      </div>

      {/* Specialties Table */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          جميع تخصصات {nameAr}
        </h2>
      </div>
      <p className="font-['Geist',sans-serif] text-xs text-black/40 mb-4">
        {profile.specialties.length} تخصصاً مرتّبةً حسب عدد الكوادر المرخّصة.
        انقر على التخصص للاطلاع على ملف القوى العاملة الكامل.
      </p>
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
                لكل 100,000
              </th>
            </tr>
          </thead>
          <tbody>
            {profile.specialties.map((spec, i) => {
              const per100K = Math.round(
                (spec.count / DUBAI_POPULATION) * 100000
              );
              return (
                <tr key={spec.slug} className="border-b border-black/[0.06]">
                  <td className="py-2.5 pl-4 font-['Geist_Mono',monospace] text-xs text-black/30 text-right">
                    {i + 1}
                  </td>
                  <td className="py-2.5 pl-4 text-right">
                    <Link
                      href={`/ar/workforce/specialty/${spec.slug}`}
                      className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight hover:text-[#006828] transition-colors"
                    >
                      {getSpecialtyBySlug(spec.slug)?.nameAr || spec.name}
                    </Link>
                  </td>
                  <td className="py-2.5 pl-4">
                    <span className="font-['Geist_Mono',monospace] text-sm font-bold text-[#006828]">
                      {spec.count.toLocaleString("ar-AE")}
                    </span>
                  </td>
                  <td className="py-2.5">
                    <span className="font-['Geist_Mono',monospace] text-xs text-black/40">
                      {per100K}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Top 20 Employers */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          أكبر 20 صاحب عمل لفئة {nameAr}
        </h2>
      </div>
      <p className="font-['Geist',sans-serif] text-xs text-black/40 mb-4">
        المنشآت الصحية مرتّبةً حسب عدد {nameAr} العاملين فيها.
        &quot;إجمالي الموظفين&quot; يشمل جميع الفئات في المنشأة.
      </p>
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
                المنشأة
              </th>
              <th
                scope="col"
                className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pl-4"
              >
                عدد {nameAr}
              </th>
              <th
                scope="col"
                className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2"
              >
                إجمالي الموظفين
              </th>
            </tr>
          </thead>
          <tbody>
            {employers.map((emp, i) => (
              <tr key={emp.slug} className="border-b border-black/[0.06]">
                <td className="py-2.5 pl-4 font-['Geist_Mono',monospace] text-xs text-black/30 text-right">
                  {i + 1}
                </td>
                <td className="py-2.5 pl-4 text-right">
                  <Link
                    href={`/ar/workforce/employer/${emp.slug}`}
                    className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight hover:text-[#006828] transition-colors"
                  >
                    {emp.name}
                  </Link>
                </td>
                <td className="py-2.5 pl-4">
                  <span className="font-['Geist_Mono',monospace] text-sm font-bold text-[#006828]">
                    {emp.count.toLocaleString("ar-AE")}
                  </span>
                </td>
                <td className="py-2.5">
                  <span className="font-['Geist_Mono',monospace] text-xs text-black/40">
                    {emp.totalStaff.toLocaleString("ar-AE")}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Geographic Distribution */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          التوزيع الجغرافي
        </h2>
      </div>
      <p className="font-['Geist',sans-serif] text-xs text-black/40 mb-4">
        توزيع {nameAr} على مناطق دبي حسب موقع المنشأة. أعلى{" "}
        {Math.min(profile.areaDistribution.length, 3)} مناطق تستوعب{" "}
        {(() => {
          const total = profile.areaDistribution.reduce(
            (s, a) => s + a.count,
            0
          );
          const top3 = profile.areaDistribution
            .slice(0, 3)
            .reduce((s, a) => s + a.count, 0);
          return total > 0 ? Math.round((top3 / total) * 100) : 0;
        })()}
        % من هذه القوى العاملة.
      </p>
      <div className="mb-12 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-[#1c1c1c]">
              <th
                scope="col"
                className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pl-4"
              >
                المنطقة
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
                % من الفئة
              </th>
            </tr>
          </thead>
          <tbody>
            {profile.areaDistribution.map((area) => {
              const pct = (
                (area.count / profile.totalCount) *
                100
              ).toFixed(1);
              return (
                <tr key={area.slug} className="border-b border-black/[0.06]">
                  <td className="py-2.5 pl-4 text-right">
                    <Link
                      href={`/ar/workforce/area/${area.slug}`}
                      className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight hover:text-[#006828] transition-colors"
                    >
                      {getArabicAreaName(area.slug)}
                    </Link>
                  </td>
                  <td className="py-2.5 pl-4">
                    <span className="font-['Geist_Mono',monospace] text-sm font-bold text-[#006828]">
                      {area.count.toLocaleString("ar-AE")}
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

      {/* Cross-links */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          صفحات ذات صلة
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
        <Link
          href={`/ar/professionals/${params.category}`}
          className="border border-black/[0.06] p-4 hover:border-[#006828]/15 transition-colors group"
        >
          <h3 className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
            تصفّح دليل {nameAr}
          </h3>
          <p className="font-['Geist',sans-serif] text-[11px] text-black/40 mt-1">
            ابحث عن كوادر صحية فردية في هذه الفئة
          </p>
        </Link>
        <Link
          href="/ar/workforce/overview"
          className="border border-black/[0.06] p-4 hover:border-[#006828]/15 transition-colors group"
        >
          <h3 className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
            {ar.workforce.title}
          </h3>
          <p className="font-['Geist',sans-serif] text-[11px] text-black/40 mt-1">
            نظرة عامة على القوى العاملة الصحية في دبي
          </p>
        </Link>
        {otherCategories.map((c) => (
          <Link
            key={c.slug}
            href={`/ar/workforce/category/${c.slug}`}
            className="border border-black/[0.06] p-4 hover:border-[#006828]/15 transition-colors group"
          >
            <h3 className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
              قوى عاملة: {c.nameAr}
            </h3>
            <p className="font-['Geist',sans-serif] text-[11px] text-black/40 mt-1">
              {c.count.toLocaleString("ar-AE")} كادر مرخّص
            </p>
          </Link>
        ))}
      </div>

      {/* DHA Disclaimer */}
      <div className="border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>المصدر:</strong> السجل الطبي المهني لهيئة صحة دبي (DHA) —
          شريان. تاريخ الجمع: {PROFESSIONAL_STATS.scraped}. تقدير الحجم السكاني:{" "}
          {DUBAI_POPULATION.toLocaleString("ar-AE")} نسمة (مركز دبي للإحصاء).
          هذه الصفحة لأغراض تحليل سوق العمل المعلوماتية فحسب ولا تُشكّل
          توصية للتوظيف أو المشورة الطبية. تحقق من أوراق اعتماد المهنيين
          مباشرةً من هيئة صحة دبي.
        </p>
      </div>
    </div>
  );
}
