import { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import {
  getNurseToDoctorRatios,
  getWorkforceRatios,
  PROFESSIONAL_STATS,
} from "@/lib/workforce";
import { ar } from "@/lib/i18n";

export const revalidate = 43200;

export function generateMetadata(): Metadata {
  const base = getBaseUrl();
  return {
    title: `تحليل نسبة الممرضين إلى الأطباء في دبي — تصنيفات المنشآت ومعايير منظمة الصحة العالمية`,
    description: `تحليل نسبة الممرضين إلى الأطباء في منشآت الرعاية الصحية بدبي. النسبة الإجمالية، مقارنة معايير منظمة الصحة العالمية، وتصنيفات المنشآت لـ ${PROFESSIONAL_STATS.uniqueFacilities.toLocaleString("ar-AE")} منشأة. مصدره سجل شريان DHA.`,
    alternates: {
      canonical: `${base}/ar/workforce/benchmarks/nurse-to-doctor`,
      languages: {
        "en-AE": `${base}/workforce/benchmarks/nurse-to-doctor`,
        "ar-AE": `${base}/ar/workforce/benchmarks/nurse-to-doctor`,
      },
    },
    openGraph: {
      title: `تحليل نسبة الممرضين إلى الأطباء في دبي`,
      description: `كيف تقارن منشآت الرعاية الصحية في دبي من حيث نسبة التوظيف؟ تحليل ${PROFESSIONAL_STATS.total.toLocaleString("ar-AE")} كادر مهني.`,
      url: `${base}/ar/workforce/benchmarks/nurse-to-doctor`,
      type: "website",
      siteName: ar.siteName,
    },
  };
}

export default function ArNurseToDoctorPage() {
  const base = getBaseUrl();
  const ratios = getNurseToDoctorRatios(20);
  const workforce = getWorkforceRatios();

  const totalNurses = ratios.reduce((s, r) => s + r.nurses, 0);
  const totalDoctors = ratios.reduce((s, r) => s + r.doctors, 0);
  const overallRatio =
    totalDoctors > 0 ? Math.round((totalNurses / totalDoctors) * 100) / 100 : 0;
  const medianIdx = Math.floor(ratios.length / 2);
  const medianRatio = ratios.length > 0 ? ratios[medianIdx].ratio : 0;

  const top30 = ratios.slice(0, 30);

  return (
    <div dir="rtl" lang="ar" className="font-arabic max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "تحليل نسبة الممرضين إلى الأطباء — الرعاية الصحية في دبي",
          description: `تحليل نسبة الممرضين إلى الأطباء في دبي: النسبة الإجمالية ${workforce.nurseToPhysicianRatio}:1، توصية منظمة الصحة العالمية 3:1.`,
          url: `${base}/ar/workforce/benchmarks/nurse-to-doctor`,
          inLanguage: "ar",
        }}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: "الإمارات", url: `${base}/` },
          { name: ar.workforce.title, url: `${base}/ar/workforce` },
          { name: ar.workforce.benchmarks, url: `${base}/ar/workforce/benchmarks` },
          { name: ar.workforce.nurseToDoctorRatio },
        ])}
      />

      <Breadcrumb
        items={[
          { label: "الإمارات", href: "/" },
          { label: ar.workforce.title, href: "/ar/workforce" },
          { label: ar.workforce.benchmarks, href: "/ar/workforce/benchmarks" },
          { label: ar.workforce.nurseToDoctorRatio },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <p className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium tracking-wider uppercase mb-2">
          معيار التوظيف
        </p>
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-2">
          تحليل نسبة الممرضين إلى الأطباء — دبي
        </h1>
        <p className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium tracking-wider uppercase mb-4">
          {ratios.length.toLocaleString("ar-AE")} منشأة محللة &middot; البيانات كما في{" "}
          {PROFESSIONAL_STATS.scraped}
        </p>
        <div className="border-r-4 border-[#006828] bg-[#006828]/[0.04] py-5 px-6 mb-6">
          <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
            تُعدّ نسبة الممرضين إلى الأطباء معياراً حيوياً للتوظيف تستخدمه الاقتصاديات الصحية
            والجهات التنظيمية ومديرو المستشفيات. توصي منظمة الصحة العالمية بنسبة دنيا 3:1
            (ثلاثة ممرضين لكل طبيب) لتقديم رعاية صحية فعّالة. تبلغ النسبة الإجمالية في دبي{" "}
            {workforce.nurseToPhysicianRatio}:1، مما يعكس التركيبة التي يغلب عليها الأطباء.
            تُصنّف هذه الصفحة المنشآت التي يبلغ موظفوها 20+ وفق نسبة ممرضيها إلى أطبائها.
          </p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
        {[
          {
            value: `${workforce.nurseToPhysicianRatio}:1`,
            label: "النسبة الإجمالية (دبي كلها)",
          },
          { value: `${overallRatio}:1`, label: "النسبة (منشآت 20+ موظف)" },
          { value: `${medianRatio}:1`, label: "متوسط نسبة المنشآت" },
          { value: "3:1", label: "الحد الأدنى الموصى به من منظمة الصحة العالمية" },
        ].map(({ value, label }) => (
          <div key={label} className="bg-[#f8f8f6] p-4 text-center">
            <p className="font-['Geist_Mono',monospace] text-2xl font-bold text-[#006828]">
              {value}
            </p>
            <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* WHO Context */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          مقارنة معايير منظمة الصحة العالمية
        </h2>
      </div>
      <div className="border-r-4 border-[#006828] bg-[#006828]/[0.04] py-5 px-6 mb-8">
        <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed mb-3">
          توصي منظمة الصحة العالمية بنسبة ممرضين إلى أطباء لا تقل عن 3:1. تحقق كثير من
          الأنظمة الصحية المتقدمة نسبة 4:1 أو أعلى. تعمل دبي حالياً بنسبة{" "}
          {workforce.nurseToPhysicianRatio}:1 في جميع المنشآت، وهو ما يضعها دون توصية
          منظمة الصحة العالمية.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          {[
            { label: "الحد الأدنى للصحة العالمية", value: "3.0:1" },
            { label: "متوسط منظمة OECD", value: "2.7:1" },
            { label: "المملكة المتحدة (NHS)", value: "3.8:1" },
            {
              label: "دبي",
              value: `${workforce.nurseToPhysicianRatio}:1`,
            },
          ].map(({ label, value }) => (
            <div key={label} className="text-center">
              <p className="font-['Geist_Mono',monospace] text-lg font-bold text-[#1c1c1c]">
                {value}
              </p>
              <p className="font-['Geist',sans-serif] text-[11px] text-black/40">
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Facility Rankings Table */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          أفضل 30 منشأة حسب نسبة الممرضين إلى الأطباء
        </h2>
      </div>
      <div className="mb-12 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-[#1c1c1c]">
              <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pl-4 w-10">
                #
              </th>
              <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pl-4">
                المنشأة
              </th>
              <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pl-4">
                النسبة
              </th>
              <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pl-4 hidden sm:table-cell">
                الممرضون
              </th>
              <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pl-4 hidden sm:table-cell">
                الأطباء
              </th>
              <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 hidden md:table-cell">
                إجمالي الموظفين
              </th>
            </tr>
          </thead>
          <tbody>
            {top30.map((fac, i) => (
              <tr key={fac.slug} className="border-b border-black/[0.06]">
                <td className="py-2.5 pl-4 font-['Geist_Mono',monospace] text-xs text-black/30 text-right">
                  {(i + 1).toLocaleString("ar-AE")}
                </td>
                <td className="py-2.5 pl-4 text-right">
                  <Link
                    href={`/ar/workforce/employer/${fac.slug}`}
                    className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight hover:text-[#006828] transition-colors"
                  >
                    {fac.name}
                  </Link>
                </td>
                <td className="py-2.5 pl-4 text-left">
                  <span className="font-['Geist_Mono',monospace] text-sm font-bold text-[#006828]">
                    {fac.ratio}:1
                  </span>
                </td>
                <td className="py-2.5 pl-4 text-left hidden sm:table-cell">
                  <span className="font-['Geist_Mono',monospace] text-sm text-[#1c1c1c]">
                    {fac.nurses.toLocaleString("ar-AE")}
                  </span>
                </td>
                <td className="py-2.5 pl-4 text-left hidden sm:table-cell">
                  <span className="font-['Geist_Mono',monospace] text-sm text-[#1c1c1c]">
                    {fac.doctors.toLocaleString("ar-AE")}
                  </span>
                </td>
                <td className="py-2.5 text-left hidden md:table-cell">
                  <span className="font-['Geist_Mono',monospace] text-xs text-black/40">
                    {fac.totalStaff.toLocaleString("ar-AE")}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Related Benchmarks */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          معايير أخرى
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
        <Link
          href="/ar/workforce/benchmarks/staff-per-facility"
          className="border border-black/[0.06] p-4 hover:border-[#006828]/15 transition-colors group"
        >
          <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
            {ar.workforce.staffPerFacility}
          </p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">
            توزيع أحجام المنشآت وتحليل فئات التوظيف
          </p>
        </Link>
        <Link
          href="/ar/workforce/benchmarks/specialist-per-capita"
          className="border border-black/[0.06] p-4 hover:border-[#006828]/15 transition-colors group"
        >
          <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
            {ar.workforce.specialistPerCapita}
          </p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">
            معدلات لكل 100,000 نسمة لكل تخصص
          </p>
        </Link>
        <Link
          href="/ar/workforce/benchmarks/ftl-rate"
          className="border border-black/[0.06] p-4 hover:border-[#006828]/15 transition-colors group"
        >
          <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
            {ar.workforce.ftlRate}
          </p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">
            انتشار ترخيص الممارسة المستقلة حسب التخصص والمنطقة
          </p>
        </Link>
      </div>

      {/* Disclaimer */}
      <div className="border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>المصدر:</strong> سجل المهنيين الطبيين شريان التابع لهيئة الصحة بدبي (DHA).
          تم جمع البيانات في {PROFESSIONAL_STATS.scraped}. تشمل فئة &quot;الأطباء&quot; الأطباء
          وأطباء الأسنان. تشمل فقط المنشآت التي يضم كادرها المرخص 20+ شخصاً. معايير منظمة
          الصحة العالمية ومنظمة OECD هي متوسطات عالمية تقريبية. تحقق من أوراق الاعتماد
          مباشرة من هيئة الصحة بدبي.
        </p>
      </div>
    </div>
  );
}
