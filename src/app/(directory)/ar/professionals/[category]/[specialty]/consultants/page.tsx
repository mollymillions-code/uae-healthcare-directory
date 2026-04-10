import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  getSpecialists,
  getConsultants,
  getSpecialtiesWithBothLevels,
  getSpecialtyStats,
  getTopFacilitiesForSpecialty,
} from "@/lib/professionals";
import {
  getCategoryBySlug,
  getSpecialtyBySlug,
  PROFESSIONAL_STATS,
} from "@/lib/constants/professionals";
import { breadcrumbSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { ar } from "@/lib/i18n";

export const revalidate = 43200;
export const dynamicParams = true;

interface Props {
  params: { category: string; specialty: string };
}

export function generateStaticParams() {
  const specialties = getSpecialtiesWithBothLevels();
  return specialties
    .map((s) => {
      const spec = getSpecialtyBySlug(s.slug);
      if (!spec) return null;
      return { category: spec.category, specialty: s.slug };
    })
    .filter((p): p is { category: string; specialty: string } => p !== null);
}

export function generateMetadata({ params }: Props): Metadata {
  const spec = getSpecialtyBySlug(params.specialty);
  if (!spec || spec.category !== params.category) return {};

  const consultantsList = getConsultants(params.specialty);
  const count = consultantsList.length;
  const base = getBaseUrl();

  return {
    title: `استشاريو ${spec.nameAr} في دبي — ${count.toLocaleString("ar-AE")} مرخّص من DHA`,
    description: `${count.toLocaleString("ar-AE")} استشاري في ${spec.nameAr} مرخّصون من هيئة صحة دبي. الاستشاريون هم أعلى درجة سريرية ويتطلب الوصول إليها أكثر من 8 سنوات من الخبرة بعد التخصص. تصفح القائمة الكاملة مع تفاصيل المنشأة.`,
    alternates: {
      canonical: `${base}/ar/professionals/${params.category}/${spec.slug}/consultants`,
      languages: {
        "en-AE": `${base}/professionals/${params.category}/${spec.slug}/consultants`,
        "ar-AE": `${base}/ar/professionals/${params.category}/${spec.slug}/consultants`,
      },
    },
    openGraph: {
      title: `استشاريو ${spec.nameAr} في دبي — ${count.toLocaleString("ar-AE")} مرخّص من DHA`,
      description: `${count.toLocaleString("ar-AE")} استشاري في ${spec.nameAr} في دبي. دليل شامل مصدره السجل الطبي شريان.`,
      url: `${base}/ar/professionals/${params.category}/${spec.slug}/consultants`,
      type: "website",
      siteName: ar.siteName,
    },
  };
}

export default function ArConsultantsPage({ params }: Props) {
  const spec = getSpecialtyBySlug(params.specialty);
  if (!spec || spec.category !== params.category) notFound();

  const cat = getCategoryBySlug(params.category);
  if (!cat) notFound();

  const specialists = getSpecialists(params.specialty);
  const consultantsList = getConsultants(params.specialty);

  if (consultantsList.length === 0) notFound();

  const stats = getSpecialtyStats(params.specialty);
  const topFacilities = getTopFacilitiesForSpecialty(params.specialty, 5);
  const base = getBaseUrl();

  const displayed = consultantsList
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, 100);

  const ftlCount = consultantsList.filter((p) => p.licenseType === "FTL").length;
  const regCount = consultantsList.filter((p) => p.licenseType === "REG").length;

  return (
    <div dir="rtl" lang="ar" className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "MedicalWebPage",
          name: `استشاريو ${spec.nameAr} في دبي`,
          description: `${consultantsList.length.toLocaleString("ar-AE")} استشاري في ${spec.nameAr} مرخّصون من هيئة صحة دبي.`,
          url: `${base}/ar/professionals/${params.category}/${spec.slug}/consultants`,
          mainContentOfPage: {
            "@type": "WebPageElement",
            cssSelector: ".professional-listing",
          },
          about: {
            "@type": "MedicalSpecialty",
            name: spec.name,
          },
          isPartOf: {
            "@type": "WebSite",
            name: ar.siteName,
            url: base,
          },
        }}
      />

      <JsonLd
        data={breadcrumbSchema([
          { name: ar.home, url: `${base}/ar` },
          { name: "الدليل", url: `${base}/ar/directory` },
          { name: "الكوادر الصحية", url: `${base}/ar/professionals` },
          { name: cat.nameAr, url: `${base}/ar/professionals/${cat.slug}` },
          { name: spec.nameAr, url: `${base}/ar/professionals/${cat.slug}/${spec.slug}` },
          { name: "الاستشاريون" },
        ])}
      />

      <Breadcrumb
        items={[
          { label: ar.home, href: "/ar" },
          { label: "الدليل", href: "/ar/directory" },
          { label: "الكوادر الصحية", href: "/ar/professionals" },
          { label: cat.nameAr, href: `/ar/professionals/${cat.slug}` },
          { label: spec.nameAr, href: `/ar/professionals/${cat.slug}/${spec.slug}` },
          { label: "الاستشاريون" },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <p className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium tracking-wider uppercase mb-2">
          درجة الاستشاري
        </p>
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-2">
          استشاريو {spec.nameAr} في دبي
        </h1>
        <p className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium tracking-wider uppercase mb-4">
          {consultantsList.length.toLocaleString("ar-AE")} استشاري مرخّص من هيئة صحة دبي
        </p>

        {/* Consultant grade explanation */}
        <div className="border-r-4 border-[#006828] bg-[#006828]/[0.04] py-5 px-6 mb-6">
          <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
            <strong className="text-[#1c1c1c]">ما هو الاستشاري؟</strong> في نظام ترخيص هيئة صحة دبي،
            &ldquo;الاستشاري&rdquo; هو أعلى درجة سريرية يمكن أن يحملها الطبيب أو طبيب الأسنان.
            يستلزم ذلك ما لا يقل عن 8 سنوات من الخبرة السريرية بعد التخصص، وإثبات الخبرة في
            المجال، والقدرة على الإشراف على الأخصائيين وقيادة الأقسام السريرية. يُعدّ الاستشاريون
            أعلى مرجعية في قرارات رعاية المرضى ضمن تخصصهم. يوجد حالياً{" "}
            {consultantsList.length.toLocaleString("ar-AE")} استشاري في {spec.nameAr}{" "}
            يمارسون في دبي.
          </p>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { value: consultantsList.length.toLocaleString("ar-AE"), label: ar.professionals.consultants },
            { value: ftlCount.toLocaleString("ar-AE"), label: "ترخيص دائم" },
            { value: regCount.toLocaleString("ar-AE"), label: "مسجّل" },
            { value: stats.totalFacilities.toLocaleString("ar-AE"), label: ar.professionals.healthcareFacilities },
          ].map(({ value, label }) => (
            <div key={label} className="bg-[#f8f8f6] p-4 text-center">
              <p className="text-2xl font-bold text-[#006828]">{value}</p>
              <p className="font-['Geist',sans-serif] text-xs text-black/40">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Consultant vs Specialist comparison callout */}
      <div className="mb-10 border border-black/[0.06] p-5">
        <div className="flex items-center gap-3 mb-3 border-b-2 border-[#1c1c1c] pb-3">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[18px] sm:text-[20px] text-[#1c1c1c] tracking-tight">
            الاستشاريون والأخصائيون في {spec.nameAr}
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-6 mb-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-[#006828]">
              {consultantsList.length.toLocaleString("ar-AE")}
            </p>
            <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">
              {ar.professionals.consultants}
            </p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-[#1c1c1c]">
              {specialists.length.toLocaleString("ar-AE")}
            </p>
            <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">
              {ar.professionals.specialists}
            </p>
          </div>
        </div>
        <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed mb-3">
          يوجد في دبي {consultantsList.length.toLocaleString("ar-AE")} استشاري و{specialists.length.toLocaleString("ar-AE")} أخصائي
          في {spec.nameAr}. نسبة الاستشاريين إلى الأخصائيين{" "}
          {specialists.length > 0
            ? `1:${(specialists.length / consultantsList.length).toFixed(1)}`
            : "—"}{" "}
          تعكس هرم الأقدمية الطبيعي للأنظمة الصحية المنظَّمة، حيث يُشرف عدد أقل من الاستشاريين
          على قاعدة أوسع من الأخصائيين.
        </p>
        {specialists.length > 0 && (
          <Link
            href={`/ar/professionals/${cat.slug}/${spec.slug}/specialists`}
            className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#006828] hover:underline"
          >
            عرض جميع الأخصائيين البالغ عددهم {specialists.length.toLocaleString("ar-AE")} في {spec.nameAr} &larr;
          </Link>
        )}
      </div>

      {/* Top Facilities */}
      {topFacilities.length > 0 && (
        <>
          <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
              أبرز المنشآت لاستشاريي {spec.nameAr}
            </h2>
          </div>
          <div className="mb-12">
            <table className="w-full">
              <thead>
                <tr className="border-b border-black/[0.06]">
                  <th scope="col" className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pl-4">
                    {ar.professionals.facility}
                  </th>
                  <th scope="col" className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pl-4">
                    {ar.professionals.staff}
                  </th>
                  <th scope="col" className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2">
                    إجمالي الكوادر
                  </th>
                </tr>
              </thead>
              <tbody>
                {topFacilities.map((fac, i) => (
                  <tr key={fac.slug} className="border-b border-black/[0.06]">
                    <td className="py-3 pl-4">
                      <Link
                        href={`/ar/professionals/facility/${fac.slug}`}
                        className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight hover:text-[#006828] transition-colors"
                      >
                        {i + 1}. {fac.name}
                      </Link>
                    </td>
                    <td className="py-3 text-left pl-4">
                      <span className="text-sm font-bold text-[#006828]">
                        {fac.count.toLocaleString("ar-AE")}
                      </span>
                    </td>
                    <td className="py-3 text-left">
                      <span className="font-['Geist_Mono',monospace] text-xs text-black/40">
                        {fac.totalStaff.toLocaleString("ar-AE")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Full Consultant Listing */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          جميع استشاريي {spec.nameAr}
        </h2>
      </div>
      <p className="font-['Geist',sans-serif] text-xs text-black/40 mb-4">
        {ar.professionals.showing} {displayed.length.toLocaleString("ar-AE")} {ar.professionals.of}{" "}
        {consultantsList.length.toLocaleString("ar-AE")} استشاري في {spec.nameAr}، {ar.professionals.sortedAlphabetically}.
      </p>
      <div className="mb-8 professional-listing">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-[#1c1c1c]">
              <th scope="col" className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pl-4">
                {ar.professionals.name}
              </th>
              <th scope="col" className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pl-4 hidden sm:table-cell">
                {ar.professionals.licenseType}
              </th>
              <th scope="col" className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2">
                {ar.professionals.facility}
              </th>
            </tr>
          </thead>
          <tbody>
            {displayed.map((pro) => (
              <tr key={pro.id} className="border-b border-black/[0.06]">
                <td className="py-2.5 pl-4">
                  <span className="font-['Bricolage_Grotesque',sans-serif] text-sm text-[#1c1c1c] tracking-tight">
                    {pro.name}
                  </span>
                </td>
                <td className="py-2.5 pl-4 hidden sm:table-cell">
                  <span className="font-['Geist_Mono',monospace] text-xs text-black/40">
                    {pro.licenseType}
                  </span>
                </td>
                <td className="py-2.5">
                  {pro.facilitySlug ? (
                    <Link
                      href={`/ar/professionals/facility/${pro.facilitySlug}`}
                      className="text-xs text-black/40 hover:text-[#006828] transition-colors"
                    >
                      {pro.facilityName || "\u2014"}
                    </Link>
                  ) : (
                    <span className="text-xs text-black/40">{pro.facilityName || "\u2014"}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cross-links */}
      <div className="mb-8 border border-black/[0.06] p-5">
        <div className="flex items-center gap-3 mb-4 border-b-2 border-[#1c1c1c] pb-3">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[18px] text-[#1c1c1c] tracking-tight">
            صفحات ذات صلة
          </h2>
        </div>
        <div className="flex flex-col gap-2">
          <Link
            href={`/ar/professionals/${cat.slug}/${spec.slug}`}
            className="font-['Geist',sans-serif] text-sm text-[#006828] hover:underline"
          >
            جميع كوادر {spec.nameAr} ({stats.totalProfessionals.toLocaleString("ar-AE")}) &larr;
          </Link>
          {specialists.length > 0 && (
            <Link
              href={`/ar/professionals/${cat.slug}/${spec.slug}/specialists`}
              className="font-['Geist',sans-serif] text-sm text-[#006828] hover:underline"
            >
              أخصائيو {spec.nameAr} ({specialists.length.toLocaleString("ar-AE")}) &larr;
            </Link>
          )}
          <Link
            href={`/ar/professionals/${cat.slug}`}
            className="font-['Geist',sans-serif] text-sm text-[#006828] hover:underline"
          >
            جميع كوادر {cat.nameAr} &larr;
          </Link>
          <Link
            href="/ar/professionals"
            className="font-['Geist',sans-serif] text-sm text-[#006828] hover:underline"
          >
            الصفحة الرئيسية — دليل الكوادر الصحية &larr;
          </Link>
        </div>
      </div>

      {/* Data source info */}
      <div className="mb-6 bg-[#f8f8f6] p-4">
        <p className="font-['Geist_Mono',monospace] text-[10px] text-black/40 uppercase tracking-wider mb-1">
          {ar.professionals.source}
        </p>
        <p className="font-['Geist',sans-serif] text-xs text-black/50">
          {PROFESSIONAL_STATS.total.toLocaleString("ar-AE")} كادر صحي في{" "}
          {PROFESSIONAL_STATS.uniqueFacilities.toLocaleString("ar-AE")} منشأة. آخر تحديث:{" "}
          {PROFESSIONAL_STATS.scraped}. المصدر: {PROFESSIONAL_STATS.source}.
        </p>
      </div>

      {/* Disclaimer */}
      <div className="border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>{ar.professionals.source}:</strong> {ar.professionals.disclaimer}
        </p>
      </div>
    </div>
  );
}
