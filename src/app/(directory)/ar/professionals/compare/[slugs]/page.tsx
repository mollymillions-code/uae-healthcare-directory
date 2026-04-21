import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { getSpecialtyStats, getSpecialtiesWithBothLevels } from "@/lib/professionals";
import {
  PHYSICIAN_SPECIALTIES,
  PROFESSIONAL_STATS,
  getSpecialtyBySlug,
} from "@/lib/constants/professionals";
import { breadcrumbSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { ar } from "@/lib/i18n";

export const revalidate = 43200;
export const dynamicParams = true;

interface Props {
  params: { slugs: string };
}

export function generateStaticParams() {
  const top15 = [...PHYSICIAN_SPECIALTIES]
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

  const params: { slugs: string }[] = [];
  for (let i = 0; i < top15.length; i++) {
    for (let j = i + 1; j < top15.length; j++) {
      params.push({ slugs: `${top15[i].slug}-vs-${top15[j].slug}` });
    }
  }
  return params;
}

function parseSlugs(slugs: string): { slugA: string; slugB: string } | null {
  const parts = slugs.split("-vs-");
  if (parts.length !== 2) return null;
  return { slugA: parts[0], slugB: parts[1] };
}

export function generateMetadata({ params }: Props): Metadata {
  const parsed = parseSlugs(params.slugs);
  if (!parsed) return {};

  const specA = getSpecialtyBySlug(parsed.slugA);
  const specB = getSpecialtyBySlug(parsed.slugB);
  if (!specA || !specB) return {};

  const base = getBaseUrl();
  return {
    title: `مقارنة ${specA.nameAr} مع ${specB.nameAr} في دبي`,
    description: `قارن بين ${specA.nameAr} (${specA.count.toLocaleString("ar-AE")} كادر) و${specB.nameAr} (${specB.count.toLocaleString("ar-AE")} كادر) في دبي. تحليل جنباً إلى جنب لحجم القوى العاملة وأنواع التراخيص وأبرز المنشآت ومستويات الأقدمية.`,
    alternates: {
      canonical: `${base}/ar/professionals/compare/${params.slugs}`,
      languages: {
        "en-AE": `${base}/professionals/compare/${params.slugs}`,
        "ar-AE": `${base}/ar/professionals/compare/${params.slugs}`,
      },
    },
    openGraph: {
      title: `مقارنة ${specA.nameAr} مع ${specB.nameAr} في دبي`,
      description: `مقارنة ${specA.count.toLocaleString("ar-AE")} كادر في ${specA.nameAr} مع ${specB.count.toLocaleString("ar-AE")} كادر في ${specB.nameAr} في دبي.`,
      url: `${base}/ar/professionals/compare/${params.slugs}`,
      type: "website",
      siteName: ar.siteName,
    },
  };
}

export default function ArCompareSpecialtiesPage({ params }: Props) {
  const parsed = parseSlugs(params.slugs);
  if (!parsed) notFound();

  const specA = getSpecialtyBySlug(parsed.slugA);
  const specB = getSpecialtyBySlug(parsed.slugB);
  if (!specA || !specB) notFound();

  const base = getBaseUrl();
  const statsA = getSpecialtyStats(parsed.slugA);
  const statsB = getSpecialtyStats(parsed.slugB);

  const bothLevels = getSpecialtiesWithBothLevels();
  const levelsA = bothLevels.find((s) => s.slug === parsed.slugA);
  const levelsB = bothLevels.find((s) => s.slug === parsed.slugB);

  return (
    <div dir="rtl" lang="ar" className="font-arabic max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd
        data={breadcrumbSchema([
          { name: "الإمارات", url: base },
          { name: "الدليل", url: `${base}/ar/directory` },
          { name: "الكوادر المهنية", url: `${base}/ar/professionals` },
          { name: "مقارنة" },
          { name: `${specA.nameAr} مقابل ${specB.nameAr}` },
        ])}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: `${specA.nameAr} مقابل ${specB.nameAr} في دبي`,
          description: `مقارنة جنباً إلى جنب بين تخصصَي ${specA.nameAr} و${specB.nameAr} في دبي.`,
          url: `${base}/ar/professionals/compare/${params.slugs}`,
          about: [
            { "@type": "MedicalSpecialty", name: specA.name },
            { "@type": "MedicalSpecialty", name: specB.name },
          ],
        }}
      />

      <Breadcrumb
        items={[
          { label: "الإمارات", href: "/ar" },
          { label: "الدليل", href: "/ar/directory" },
          { label: "الكوادر المهنية", href: "/ar/professionals" },
          { label: "مقارنة" },
          { label: `${specA.nameAr} مقابل ${specB.nameAr}` },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-2">
          {specA.nameAr} مقابل {specB.nameAr} في دبي
        </h1>
        <p className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium tracking-wider uppercase mb-4">
          مقارنة تخصصات جنباً إلى جنب
        </p>
        <div className="border-r-4 border-l-0 border-[#006828] bg-[#006828]/[0.04] py-5 px-6 mb-6">
          <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
            مقارنة مبنية على البيانات بين <strong>{specA.nameAr}</strong>{" "}
            ({statsA.totalProfessionals.toLocaleString("ar-AE")} كادر) و<strong>{specB.nameAr}</strong>{" "}
            ({statsB.totalProfessionals.toLocaleString("ar-AE")} كادر) في المنظومة الصحية بدبي.
            جميع البيانات مصدرها سجل المهنيين الطبيين شريان التابع لهيئة الصحة بدبي.
          </p>
        </div>
      </div>

      {/* Side-by-Side Stats */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          لمحة سريعة
        </h2>
      </div>
      <div className="overflow-x-auto mb-12">
        <div className="grid grid-cols-3 gap-0 border border-black/[0.06] min-w-[480px]">
          {/* Header Row */}
          <div className="p-4 bg-[#f8f8f6] border-b border-l border-black/[0.06]">
            <span className="font-['Geist',sans-serif] text-xs text-black/40 font-medium">
              المعيار
            </span>
          </div>
          <div className="p-4 bg-[#f8f8f6] border-b border-l border-black/[0.06] text-center">
            <span className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight">
              {specA.nameAr}
            </span>
          </div>
          <div className="p-4 bg-[#f8f8f6] border-b border-black/[0.06] text-center">
            <span className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight">
              {specB.nameAr}
            </span>
          </div>

          {/* Total Professionals */}
          <div className="p-4 border-b border-l border-black/[0.06]">
            <span className="font-['Geist',sans-serif] text-xs text-black/40">
              إجمالي الكوادر
            </span>
          </div>
          <div className="p-4 border-b border-l border-black/[0.06] text-center">
            <span className="text-xl font-bold text-[#006828]">
              {statsA.totalProfessionals.toLocaleString("ar-AE")}
            </span>
          </div>
          <div className="p-4 border-b border-black/[0.06] text-center">
            <span className="text-xl font-bold text-[#006828]">
              {statsB.totalProfessionals.toLocaleString("ar-AE")}
            </span>
          </div>

          {/* FTL Count */}
          <div className="p-4 border-b border-l border-black/[0.06]">
            <span className="font-['Geist',sans-serif] text-xs text-black/40">
              FTL (ترخيص تجاري كامل)
            </span>
          </div>
          <div className="p-4 border-b border-l border-black/[0.06] text-center">
            <span className="font-['Geist_Mono',monospace] text-sm text-[#1c1c1c]">
              {statsA.ftlCount.toLocaleString("ar-AE")}
            </span>
            <span className="font-['Geist_Mono',monospace] text-[11px] text-black/30 mr-1">
              ({statsA.totalProfessionals > 0 ? ((statsA.ftlCount / statsA.totalProfessionals) * 100).toFixed(0) : 0}%)
            </span>
          </div>
          <div className="p-4 border-b border-black/[0.06] text-center">
            <span className="font-['Geist_Mono',monospace] text-sm text-[#1c1c1c]">
              {statsB.ftlCount.toLocaleString("ar-AE")}
            </span>
            <span className="font-['Geist_Mono',monospace] text-[11px] text-black/30 mr-1">
              ({statsB.totalProfessionals > 0 ? ((statsB.ftlCount / statsB.totalProfessionals) * 100).toFixed(0) : 0}%)
            </span>
          </div>

          {/* REG Count */}
          <div className="p-4 border-b border-l border-black/[0.06]">
            <span className="font-['Geist',sans-serif] text-xs text-black/40">
              REG (مسجّل)
            </span>
          </div>
          <div className="p-4 border-b border-l border-black/[0.06] text-center">
            <span className="font-['Geist_Mono',monospace] text-sm text-[#1c1c1c]">
              {statsA.regCount.toLocaleString("ar-AE")}
            </span>
            <span className="font-['Geist_Mono',monospace] text-[11px] text-black/30 mr-1">
              ({statsA.totalProfessionals > 0 ? ((statsA.regCount / statsA.totalProfessionals) * 100).toFixed(0) : 0}%)
            </span>
          </div>
          <div className="p-4 border-b border-black/[0.06] text-center">
            <span className="font-['Geist_Mono',monospace] text-sm text-[#1c1c1c]">
              {statsB.regCount.toLocaleString("ar-AE")}
            </span>
            <span className="font-['Geist_Mono',monospace] text-[11px] text-black/30 mr-1">
              ({statsB.totalProfessionals > 0 ? ((statsB.regCount / statsB.totalProfessionals) * 100).toFixed(0) : 0}%)
            </span>
          </div>

          {/* Facilities */}
          <div className="p-4 border-b border-l border-black/[0.06]">
            <span className="font-['Geist',sans-serif] text-xs text-black/40">
              المنشآت
            </span>
          </div>
          <div className="p-4 border-b border-l border-black/[0.06] text-center">
            <span className="font-['Geist_Mono',monospace] text-sm text-[#1c1c1c]">
              {statsA.totalFacilities.toLocaleString("ar-AE")}
            </span>
          </div>
          <div className="p-4 border-b border-black/[0.06] text-center">
            <span className="font-['Geist_Mono',monospace] text-sm text-[#1c1c1c]">
              {statsB.totalFacilities.toLocaleString("ar-AE")}
            </span>
          </div>

          {/* Specialists */}
          <div className="p-4 border-b border-l border-black/[0.06]">
            <span className="font-['Geist',sans-serif] text-xs text-black/40">
              أخصائيون
            </span>
          </div>
          <div className="p-4 border-b border-l border-black/[0.06] text-center">
            <span className="font-['Geist_Mono',monospace] text-sm text-[#1c1c1c]">
              {levelsA ? levelsA.specialists.toLocaleString("ar-AE") : "غير متاح"}
            </span>
          </div>
          <div className="p-4 border-b border-black/[0.06] text-center">
            <span className="font-['Geist_Mono',monospace] text-sm text-[#1c1c1c]">
              {levelsB ? levelsB.specialists.toLocaleString("ar-AE") : "غير متاح"}
            </span>
          </div>

          {/* Consultants */}
          <div className="p-4 border-l border-black/[0.06]">
            <span className="font-['Geist',sans-serif] text-xs text-black/40">
              استشاريون
            </span>
          </div>
          <div className="p-4 border-l border-black/[0.06] text-center">
            <span className="font-['Geist_Mono',monospace] text-sm text-[#1c1c1c]">
              {levelsA ? levelsA.consultants.toLocaleString("ar-AE") : "غير متاح"}
            </span>
          </div>
          <div className="p-4 text-center">
            <span className="font-['Geist_Mono',monospace] text-sm text-[#1c1c1c]">
              {levelsB ? levelsB.consultants.toLocaleString("ar-AE") : "غير متاح"}
            </span>
          </div>
        </div>
      </div>

      {/* Top Facilities Comparison */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          أبرز المنشآت حسب التخصص
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-12">
        {/* Specialty A Facilities */}
        <div>
          <h3 className="font-['Bricolage_Grotesque',sans-serif] text-base font-semibold text-[#1c1c1c] tracking-tight mb-4">
            أبرز المنشآت لتخصص {specA.nameAr}
          </h3>
          <div className="space-y-0">
            {statsA.topFacilities.slice(0, 5).map((fac, i) => (
              <div key={fac.slug} className="flex items-center justify-between py-2.5 border-b border-black/[0.06]">
                <Link
                  href={`/ar/professionals/facility/${fac.slug}`}
                  className="font-['Geist',sans-serif] text-sm text-[#1c1c1c] hover:text-[#006828] transition-colors"
                >
                  {i + 1}. {fac.name}
                </Link>
                <span className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-bold mr-2 shrink-0">
                  {fac.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Specialty B Facilities */}
        <div>
          <h3 className="font-['Bricolage_Grotesque',sans-serif] text-base font-semibold text-[#1c1c1c] tracking-tight mb-4">
            أبرز المنشآت لتخصص {specB.nameAr}
          </h3>
          <div className="space-y-0">
            {statsB.topFacilities.slice(0, 5).map((fac, i) => (
              <div key={fac.slug} className="flex items-center justify-between py-2.5 border-b border-black/[0.06]">
                <Link
                  href={`/ar/professionals/facility/${fac.slug}`}
                  className="font-['Geist',sans-serif] text-sm text-[#1c1c1c] hover:text-[#006828] transition-colors"
                >
                  {i + 1}. {fac.name}
                </Link>
                <span className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-bold mr-2 shrink-0">
                  {fac.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* When to See Each Specialty */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          أيّ التخصصين تحتاج؟
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
        <div className="border border-black/[0.06] p-6">
          <h3 className="font-['Bricolage_Grotesque',sans-serif] text-base font-semibold text-[#006828] tracking-tight mb-3">
            متى تزور أخصائي {specA.nameAr}؟
          </h3>
          <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed mb-3">
            يُعنى أخصائيو {specA.nameAr} بالحالات المتعلقة بمجال خبرتهم. يُحال إليهم المرضى
            عادةً من طبيب الرعاية الأولية أو عند ظهور أعراض خاصة بهذا التخصص.
          </p>
          {specA.searchTerms.length > 0 && (
            <p className="font-['Geist',sans-serif] text-xs text-black/40">
              <span className="font-medium">عمليات البحث الشائعة:</span>{" "}
              {specA.searchTerms.join("، ")}
            </p>
          )}
        </div>
        <div className="border border-black/[0.06] p-6">
          <h3 className="font-['Bricolage_Grotesque',sans-serif] text-base font-semibold text-[#006828] tracking-tight mb-3">
            متى تزور أخصائي {specB.nameAr}؟
          </h3>
          <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed mb-3">
            يُعنى أخصائيو {specB.nameAr} بالحالات المتعلقة بمجال خبرتهم. يُحال إليهم المرضى
            عادةً من طبيب الرعاية الأولية أو عند ظهور أعراض خاصة بهذا التخصص.
          </p>
          {specB.searchTerms.length > 0 && (
            <p className="font-['Geist',sans-serif] text-xs text-black/40">
              <span className="font-medium">عمليات البحث الشائعة:</span>{" "}
              {specB.searchTerms.join("، ")}
            </p>
          )}
        </div>
      </div>

      {/* Cross-links */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          استكشف كل تخصص
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
        <div className="border border-black/[0.06] p-5">
          <h3 className="font-['Bricolage_Grotesque',sans-serif] text-base font-semibold text-[#1c1c1c] tracking-tight mb-3">
            {specA.nameAr}
          </h3>
          <div className="space-y-2">
            <Link
              href={`/ar/professionals/${specA.category}/${specA.slug}`}
              className="block font-['Geist',sans-serif] text-sm text-[#006828] hover:underline"
            >
              دليل {specA.nameAr} الكامل ({statsA.totalProfessionals.toLocaleString("ar-AE")} كادر) &larr;
            </Link>
            <Link
              href={`/ar/best/doctors/${specA.slug}`}
              className="block font-['Geist',sans-serif] text-sm text-[#006828] hover:underline"
            >
              أفضل أطباء {specA.nameAr} في دبي &larr;
            </Link>
          </div>
        </div>
        <div className="border border-black/[0.06] p-5">
          <h3 className="font-['Bricolage_Grotesque',sans-serif] text-base font-semibold text-[#1c1c1c] tracking-tight mb-3">
            {specB.nameAr}
          </h3>
          <div className="space-y-2">
            <Link
              href={`/ar/professionals/${specB.category}/${specB.slug}`}
              className="block font-['Geist',sans-serif] text-sm text-[#006828] hover:underline"
            >
              دليل {specB.nameAr} الكامل ({statsB.totalProfessionals.toLocaleString("ar-AE")} كادر) &larr;
            </Link>
            <Link
              href={`/ar/best/doctors/${specB.slug}`}
              className="block font-['Geist',sans-serif] text-sm text-[#006828] hover:underline"
            >
              أفضل أطباء {specB.nameAr} في دبي &larr;
            </Link>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>المصدر:</strong> سجل المهنيين الطبيين شريان التابع لهيئة الصحة بدبي (DHA).
          تاريخ استخراج البيانات: {PROFESSIONAL_STATS.scraped}. هذه المقارنة لأغراض معلوماتية فقط
          ولا تمثّل نصيحة طبية. استشر طبيبك العام للحصول على إحالة للأخصائي المناسب. يُرجى
          التحقق من أوراق الاعتماد مباشرة من هيئة الصحة بدبي.
        </p>
      </div>
    </div>
  );
}
