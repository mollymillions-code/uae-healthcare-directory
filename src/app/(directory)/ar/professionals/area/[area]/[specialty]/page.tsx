import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  getProfessionalsByAreaAndSpecialty,
  getAreaSpecialtyCombos,
  DUBAI_AREAS,
} from "@/lib/professionals";
import { getSpecialtyBySlug } from "@/lib/constants/professionals";
import { breadcrumbSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { ar, getArabicAreaName } from "@/lib/i18n";

export const revalidate = 43200;
export const dynamicParams = true;

interface Props {
  params: { area: string; specialty: string };
}

export function generateStaticParams() {
  return getAreaSpecialtyCombos(3).map((combo) => ({
    area: combo.areaSlug,
    specialty: combo.specialtySlug,
  }));
}

export function generateMetadata({ params }: Props): Metadata {
  const areaInfo = DUBAI_AREAS.find((a) => a.slug === params.area);
  const spec = getSpecialtyBySlug(params.specialty);
  if (!areaInfo || !spec) {
    return {
      title: "الكوادر الصحية حسب المنطقة والتخصص | Zavis",
      description: "تصفح الكوادر الصحية المرخّصة من هيئة الصحة بدبي حسب المنطقة والتخصص.",
    };
  }
  const arabicAreaName = getArabicAreaName(params.area);
  const professionals = getProfessionalsByAreaAndSpecialty(
    params.area,
    params.specialty
  );
  const count = professionals.length;
  const base = getBaseUrl();
  return {
    title: `أفضل كوادر ${spec.name} في ${arabicAreaName}، دبي — ${count.toLocaleString("ar-AE")} كادر مرخّص | Zavis`,
    description: `ابحث عن ${count.toLocaleString("ar-AE")} كادر صحي مرخّص من هيئة الصحة بدبي في تخصص ${spec.name} بمنطقة ${arabicAreaName}. القائمة الكاملة بأنواع التراخيص وتفاصيل المنشآت، مصدرها السجل الطبي الرسمي شريان.`,
    alternates: {
      canonical: `${base}/ar/professionals/area/${areaInfo.slug}/${spec.slug}`,
      languages: {
        "en-AE": `${base}/professionals/area/${areaInfo.slug}/${spec.slug}`,
        "ar-AE": `${base}/ar/professionals/area/${areaInfo.slug}/${spec.slug}`,
      },
    },
    openGraph: {
      title: `أفضل كوادر ${spec.name} في ${arabicAreaName}، دبي`,
      description: `${count.toLocaleString("ar-AE")} كادر مرخّص في تخصص ${spec.name} بمنطقة ${arabicAreaName}.`,
      url: `${base}/ar/professionals/area/${areaInfo.slug}/${spec.slug}`,
      type: "website",
      siteName: ar.siteName,
    },
  };
}

export default function ArAreaSpecialtyPage({ params }: Props) {
  const areaInfo = DUBAI_AREAS.find((a) => a.slug === params.area);
  const spec = getSpecialtyBySlug(params.specialty);
  if (!areaInfo || !spec) notFound();

  const arabicAreaName = getArabicAreaName(params.area);
  const professionals = getProfessionalsByAreaAndSpecialty(
    params.area,
    params.specialty
  );
  if (professionals.length === 0) notFound();

  const base = getBaseUrl();

  // License type breakdown
  let ftlCount = 0;
  let regCount = 0;
  for (const p of professionals) {
    if (p.licenseType === "FTL") ftlCount++;
    if (p.licenseType === "REG") regCount++;
  }

  // Top facilities for this specialty in this area
  const facilityCounts: Record<
    string,
    { name: string; slug: string; count: number }
  > = {};
  for (const p of professionals) {
    if (p.facilityName) {
      if (!facilityCounts[p.facilitySlug]) {
        facilityCounts[p.facilitySlug] = {
          name: p.facilityName,
          slug: p.facilitySlug,
          count: 0,
        };
      }
      facilityCounts[p.facilitySlug].count++;
    }
  }
  const topFacilities = Object.values(facilityCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Full listing sorted alphabetically
  const sortedProfessionals = [...professionals].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  return (
    <div dir="rtl" lang="ar" className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd
        data={breadcrumbSchema([
          { name: "الرئيسية", url: base },
          { name: "الدليل", url: `${base}/ar/directory` },
          { name: "الكوادر الصحية", url: `${base}/ar/professionals` },
          {
            name: arabicAreaName,
            url: `${base}/ar/professionals/area/${areaInfo.slug}`,
          },
          { name: spec.nameAr || spec.name },
        ])}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "MedicalWebPage",
          name: `${spec.nameAr || spec.name} في ${arabicAreaName}، دبي`,
          description: `${professionals.length.toLocaleString("ar-AE")} كادر صحي مرخّص في تخصص ${spec.nameAr || spec.name} بمنطقة ${arabicAreaName}، دبي.`,
          url: `${base}/ar/professionals/area/${areaInfo.slug}/${spec.slug}`,
          about: {
            "@type": "MedicalSpecialty",
            name: spec.name,
          },
          mainEntity: {
            "@type": "Place",
            name: areaInfo.name,
            containedInPlace: {
              "@type": "City",
              name: "Dubai",
              addressCountry: "AE",
            },
          },
        }}
      />

      <Breadcrumb
        items={[
          { label: "الرئيسية", href: "/" },
          { label: "الدليل", href: "/ar/directory" },
          { label: "الكوادر الصحية", href: "/ar/professionals" },
          {
            label: arabicAreaName,
            href: `/ar/professionals/area/${areaInfo.slug}`,
          },
          { label: spec.nameAr || spec.name },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-2">
          {spec.nameAr || spec.name} في {arabicAreaName}، دبي
        </h1>
        <p className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium tracking-wider uppercase mb-4">
          {professionals.length.toLocaleString("ar-AE")} {ar.professionals.licensedProfessionals}
        </p>
        <div className="border-r-4 border-[#006828] bg-[#006828]/[0.04] py-5 px-6 mb-6">
          <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
            يعمل في منطقة {arabicAreaName} بدبي{" "}
            {professionals.length.toLocaleString("ar-AE")} كادراً صحياً
            مرخّصاً من هيئة الصحة بدبي في تخصص {spec.nameAr || spec.name}
            {ftlCount > 0 && regCount > 0
              ? `، منهم ${ftlCount.toLocaleString("ar-AE")} بترخيص دائم (FTL) و${regCount.toLocaleString("ar-AE")} مسجّل (REG)`
              : ""}
            {". "}
            يتوزعون على {topFacilities.length}{" "}
            {topFacilities.length === 1 ? "منشأة" : "منشآت"}
            {topFacilities.length > 0
              ? `، مع أعلى تركيز في ${topFacilities[0].name} (${topFacilities[0].count.toLocaleString("ar-AE")} كادر)`
              : ""}
            . جميع البيانات مصدرها السجل الطبي الرسمي شريان التابع لهيئة الصحة بدبي.
          </p>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#f8f8f6] p-4 text-center">
            <p className="text-2xl font-bold text-[#006828]">
              {professionals.length.toLocaleString("ar-AE")}
            </p>
            <p className="font-['Geist',sans-serif] text-xs text-black/40">
              {spec.nameAr || spec.name}
            </p>
          </div>
          <div className="bg-[#f8f8f6] p-4 text-center">
            <p className="text-2xl font-bold text-[#006828]">
              {topFacilities.length}
            </p>
            <p className="font-['Geist',sans-serif] text-xs text-black/40">
              {ar.workforce.facilities}
            </p>
          </div>
          {ftlCount > 0 && (
            <div className="bg-[#f8f8f6] p-4 text-center">
              <p className="text-2xl font-bold text-[#006828]">
                {ftlCount.toLocaleString("ar-AE")}
              </p>
              <p className="font-['Geist',sans-serif] text-xs text-black/40">
                ترخيص دائم (FTL)
              </p>
            </div>
          )}
          {regCount > 0 && (
            <div className="bg-[#f8f8f6] p-4 text-center">
              <p className="text-2xl font-bold text-[#006828]">
                {regCount.toLocaleString("ar-AE")}
              </p>
              <p className="font-['Geist',sans-serif] text-xs text-black/40">
                مسجّل (REG)
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Top Facilities */}
      {topFacilities.length > 1 && (
        <>
          <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
              أبرز منشآت {spec.nameAr || spec.name} في {arabicAreaName}
            </h2>
          </div>
          <div className="mb-12 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-[#1c1c1c]">
                  <th scope="col" className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pl-4">
                    {ar.professionals.facility}
                  </th>
                  <th scope="col" className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2">
                    كوادر {spec.nameAr || spec.name}
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
                    <td className="py-3 text-left">
                      <span className="text-sm font-bold text-[#006828]">
                        {fac.count.toLocaleString("ar-AE")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Full Listing */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          جميع كوادر {spec.nameAr || spec.name} — أ-ي
        </h2>
      </div>
      <p className="font-['Geist',sans-serif] text-xs text-black/40 mb-4">
        {professionals.length.toLocaleString("ar-AE")} كادر مرخّص في تخصص {spec.nameAr || spec.name}{" "}
        بمنطقة {arabicAreaName} ({ar.professionals.sortedAlphabetically}).
      </p>
      <div className="mb-8 overflow-x-auto">
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
            {sortedProfessionals.map((pro) => (
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
                      {pro.facilityName}
                    </Link>
                  ) : (
                    <span className="text-xs text-black/40">
                      {pro.facilityName || "—"}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Navigation links */}
      <div className="flex flex-col sm:flex-row gap-4 border-t border-black/[0.06] pt-6 mb-8">
        <Link
          href={`/ar/professionals/area/${areaInfo.slug}`}
          className="font-['Geist',sans-serif] text-sm text-[#006828] hover:underline"
        >
          استعرض جميع الكوادر في {arabicAreaName} &rarr;
        </Link>
        {spec.category && (
          <Link
            href={`/ar/professionals/${spec.category}/${spec.slug}`}
            className="font-['Geist',sans-serif] text-sm text-[#006828] hover:underline"
          >
            استعرض جميع كوادر {spec.nameAr || spec.name} في دبي &rarr;
          </Link>
        )}
        <Link
          href="/ar/professionals"
          className="font-['Geist',sans-serif] text-sm text-[#006828] hover:underline"
        >
          العودة إلى دليل الكوادر الصحية &rarr;
        </Link>
        <Link
          href={`/professionals/area/${areaInfo.slug}/${spec.slug}`}
          className="font-['Geist',sans-serif] text-sm text-[#006828] hover:underline"
        >
          View in English &rarr;
        </Link>
      </div>

      {/* Disclaimer */}
      <div className="border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>المصدر:</strong> {ar.professionals.disclaimer}
        </p>
      </div>
    </div>
  );
}
