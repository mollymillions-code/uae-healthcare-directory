import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  PROFESSIONAL_CATEGORIES,
  PROFESSIONAL_STATS,
} from "@/lib/constants/professionals";
import {
  getCategoryWorkforceProfile,
  getTopEmployersByCategory,
} from "@/lib/workforce";
import { breadcrumbSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { ar, getArabicAreaName } from "@/lib/i18n";

export const revalidate = 43200;
export const dynamicParams = true;

interface Props {
  params: { category: string };
}

export function generateStaticParams() {
  return PROFESSIONAL_CATEGORIES.map((c) => ({ category: c.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const catInfo = PROFESSIONAL_CATEGORIES.find((c) => c.slug === params.category);
  if (!catInfo) return {};

  const base = getBaseUrl();
  return {
    title: `مسار ${catInfo.nameAr} المهني في دبي — ${catInfo.count.toLocaleString("ar-AE")} كادر`,
    description: `نظرة عامة على مسار ${catInfo.nameAr} المهني في دبي. ${catInfo.count.toLocaleString("ar-AE")} كادر مرخص وأبرز التخصصات وأكبر أصحاب العمل ونظرة عامة على الترخيص والتوزيع الجغرافي.`,
    alternates: {
      canonical: `${base}/ar/workforce/career/category/${catInfo.slug}`,
      languages: {
        "en-AE": `${base}/workforce/career/category/${catInfo.slug}`,
        "ar-AE": `${base}/ar/workforce/career/category/${catInfo.slug}`,
      },
    },
    openGraph: {
      title: `مسار ${catInfo.nameAr} المهني في دبي`,
      description: `معلومات مهنية لـ ${catInfo.count.toLocaleString("ar-AE")} ${catInfo.nameAr} في دبي.`,
      url: `${base}/ar/workforce/career/category/${catInfo.slug}`,
      type: "website",
      siteName: ar.siteName,
    },
  };
}

export default function ArCareerCategoryPage({ params }: Props) {
  const catInfo = PROFESSIONAL_CATEGORIES.find((c) => c.slug === params.category);
  if (!catInfo) notFound();

  const profile = getCategoryWorkforceProfile(params.category);
  if (!profile) notFound();

  const topEmployers = getTopEmployersByCategory(params.category, 15);
  const base = getBaseUrl();

  return (
    <div dir="rtl" lang="ar" className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd
        data={breadcrumbSchema([
          { name: "الإمارات", url: base },
          { name: ar.workforce.title, url: `${base}/ar/workforce` },
          { name: ar.workforce.careers, url: `${base}/ar/workforce/careers` },
          { name: catInfo.nameAr },
        ])}
      />

      <Breadcrumb
        items={[
          { label: "الإمارات", href: "/" },
          { label: ar.workforce.title, href: "/ar/workforce" },
          { label: ar.workforce.careers, href: "/ar/workforce/careers" },
          { label: catInfo.nameAr },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-2">
          مسار {catInfo.nameAr} المهني في دبي
        </h1>
        <p className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium tracking-wider uppercase mb-4">
          {profile.totalCount.toLocaleString("ar-AE")} كادر مرخص &middot; {profile.percentOfWorkforce}% من القوى العاملة
        </p>
        <div className="border-r-4 border-[#006828] bg-[#006828]/[0.04] py-5 px-6">
          <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
            {catInfo.description} بوجود {profile.totalCount.toLocaleString("ar-AE")} كادراً نشطاً،
            يُمثّل {catInfo.nameAr} {profile.percentOfWorkforce}% من إجمالي القوى العاملة
            الصحية في دبي. يبلغ المعدل للفرد {profile.per100K} لكل 100,000 نسمة.
          </p>
        </div>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
        <div className="bg-[#f8f8f6] p-4 text-center">
          <p className="text-2xl font-bold text-[#006828]">{profile.totalCount.toLocaleString("ar-AE")}</p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40">إجمالي الكوادر</p>
        </div>
        <div className="bg-[#f8f8f6] p-4 text-center">
          <p className="text-2xl font-bold text-[#006828]">{profile.per100K}</p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40">لكل 100K نسمة</p>
        </div>
        <div className="bg-[#f8f8f6] p-4 text-center">
          <p className="text-2xl font-bold text-[#006828]">{profile.license.ftlPercent}%</p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40">معدل الترخيص الدائم</p>
        </div>
        <div className="bg-[#f8f8f6] p-4 text-center">
          <p className="text-2xl font-bold text-[#006828]">{profile.specialties.length}</p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40">تخصصات</p>
        </div>
      </div>

      {/* Top Specialties */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          أبرز التخصصات
        </h2>
      </div>
      <p className="font-['Geist',sans-serif] text-sm text-black/60 mb-4">
        أكثر التخصصات شيوعاً ضمن فئة {catInfo.nameAr} في دبي، مصنّفةً حسب عدد الكوادر النشطة.
      </p>
      <div className="mb-12 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-[#1c1c1c]">
              <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pl-4 w-10">#</th>
              <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pl-4">التخصص</th>
              <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pl-4">العدد</th>
              <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2">%</th>
            </tr>
          </thead>
          <tbody>
            {profile.specialties.slice(0, 15).map((spec, i) => (
              <tr key={spec.slug} className="border-b border-black/[0.06]">
                <td className="py-2.5 pl-4 font-['Geist_Mono',monospace] text-xs text-black/30 text-right">{(i + 1).toLocaleString("ar-AE")}</td>
                <td className="py-2.5 pl-4 text-right">
                  <Link
                    href={`/ar/workforce/career/${spec.slug}`}
                    className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight hover:text-[#006828] transition-colors"
                  >
                    {spec.name}
                  </Link>
                </td>
                <td className="py-2.5 pl-4 text-left">
                  <span className="font-['Geist_Mono',monospace] text-sm font-bold text-[#006828]">{spec.count.toLocaleString("ar-AE")}</span>
                </td>
                <td className="py-2.5 text-left">
                  <span className="font-['Geist_Mono',monospace] text-xs text-black/40">
                    {((spec.count / profile.totalCount) * 100).toFixed(1)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Top Employers */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          أكبر أصحاب العمل
        </h2>
      </div>
      <div className="mb-12 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-[#1c1c1c]">
              <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pl-4 w-10">#</th>
              <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pl-4">المنشأة</th>
              <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pl-4">{catInfo.nameAr}</th>
              <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 hidden sm:table-cell">إجمالي الموظفين</th>
            </tr>
          </thead>
          <tbody>
            {topEmployers.map((emp, i) => (
              <tr key={emp.slug} className="border-b border-black/[0.06]">
                <td className="py-2.5 pl-4 font-['Geist_Mono',monospace] text-xs text-black/30 text-right">{(i + 1).toLocaleString("ar-AE")}</td>
                <td className="py-2.5 pl-4 text-right">
                  <Link
                    href={`/ar/professionals/facility/${emp.slug}`}
                    className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight hover:text-[#006828] transition-colors"
                  >
                    {emp.name}
                  </Link>
                </td>
                <td className="py-2.5 pl-4 text-left">
                  <span className="font-['Geist_Mono',monospace] text-sm font-bold text-[#006828]">{emp.count.toLocaleString("ar-AE")}</span>
                </td>
                <td className="py-2.5 text-left hidden sm:table-cell">
                  <span className="font-['Geist_Mono',monospace] text-xs text-black/40">{emp.totalStaff.toLocaleString("ar-AE")}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Licensing Overview */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          نظرة عامة على الترخيص
        </h2>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-[#f8f8f6] p-5">
          <p className="font-['Geist_Mono',monospace] text-xs text-black/40 uppercase tracking-wider mb-2">FTL (رخصة خاصة)</p>
          <p className="text-2xl font-bold text-[#006828]">{profile.license.ftl.toLocaleString("ar-AE")}</p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">{profile.license.ftlPercent}%</p>
        </div>
        <div className="bg-[#f8f8f6] p-5">
          <p className="font-['Geist_Mono',monospace] text-xs text-black/40 uppercase tracking-wider mb-2">REG (رخصة منشأة)</p>
          <p className="text-2xl font-bold text-[#006828]">{profile.license.reg.toLocaleString("ar-AE")}</p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">{profile.license.regPercent}%</p>
        </div>
      </div>
      <div className="border-r-4 border-[#006828] bg-[#006828]/[0.04] py-5 px-6 mb-12">
        <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
          تُصدر هيئة الصحة بدبي نوعين من التراخيص: <strong>FTL</strong> (ترخيص تجاري كامل) للممارسين
          المستقلين، و<strong>REG</strong> (مُسجَّل) للعاملين تحت رخصة منشأة. ضمن فئة{" "}
          {catInfo.nameAr}، {profile.license.ftlPercent}% يحملون ترخيص FTL مقارنةً بمتوسط
          القوى العاملة الإجمالي.
        </p>
      </div>

      {/* Geographic Distribution */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          التوزيع الجغرافي
        </h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-12">
        {profile.areaDistribution.slice(0, 12).map((area) => (
          <Link
            key={area.slug}
            href={`/ar/workforce/area/${area.slug}/${catInfo.slug}`}
            className="border border-black/[0.06] p-3 hover:border-[#006828]/15 transition-colors group"
          >
            <h3 className="text-sm font-['Bricolage_Grotesque',sans-serif] font-semibold text-[#1c1c1c] tracking-tight mb-1 group-hover:text-[#006828] transition-colors">
              {getArabicAreaName(area.slug) || area.name}
            </h3>
            <p className="font-['Geist_Mono',monospace] text-[11px] text-black/40">
              {area.count.toLocaleString("ar-AE")} {catInfo.nameAr}
            </p>
          </Link>
        ))}
      </div>

      {/* Cross-links */}
      <div className="flex flex-col sm:flex-row gap-4 border-t border-black/[0.06] pt-6 mb-8">
        <Link href={`/ar/professionals/${catInfo.slug}`} className="font-['Geist',sans-serif] text-sm text-[#006828] hover:underline">
          تصفح جميع {catInfo.nameAr} &larr;
        </Link>
        <Link href="/ar/workforce/compare" className="font-['Geist',sans-serif] text-sm text-[#006828] hover:underline">
          مقارنة الفئات &larr;
        </Link>
        <Link href="/ar/professionals/stats" className="font-['Geist',sans-serif] text-sm text-[#006828] hover:underline">
          إحصائيات القوى العاملة الكاملة &larr;
        </Link>
      </div>

      {/* Disclaimer */}
      <div className="border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>المصدر:</strong> سجل المهنيين الطبيين شريان التابع لهيئة الصحة بدبي (DHA).
          تم جمع البيانات في {PROFESSIONAL_STATS.scraped}. هذه النظرة العامة المهنية
          لأغراض معلوماتية فقط.
        </p>
      </div>
    </div>
  );
}
