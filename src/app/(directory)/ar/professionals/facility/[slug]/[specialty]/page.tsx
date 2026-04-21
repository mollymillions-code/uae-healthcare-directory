import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  getProfessionalsByFacilityAndSpecialty,
  getFacilityProfile,
  getFacilitySpecialtyCombos,
} from "@/lib/professionals";
import { getSpecialtyBySlug } from "@/lib/constants/professionals";
import { breadcrumbSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { ar } from "@/lib/i18n";

export const revalidate = 43200;
export const dynamicParams = true;

interface Props {
  params: { slug: string; specialty: string };
}

export function generateStaticParams() {
  return getFacilitySpecialtyCombos(5).map((combo) => ({
    slug: combo.facilitySlug,
    specialty: combo.specialtySlug,
  }));
}

export function generateMetadata({ params }: Props): Metadata {
  const profile = getFacilityProfile(params.slug);
  const spec = getSpecialtyBySlug(params.specialty);
  if (!profile || !spec) {
    return {
      title: "تخصص في المنشأة — دليل الكوادر",
      description: "استعرض الكوادر الصحية المرخّصة حسب التخصص في هذه المنشأة الصحية في دبي.",
    };
  }
  const professionals = getProfessionalsByFacilityAndSpecialty(params.slug, params.specialty);
  const count = professionals.length;
  const base = getBaseUrl();
  return {
    title: `${spec.name} في ${profile.name} — ${count.toLocaleString("ar-AE")} كادر مرخّص`,
    description: `${count.toLocaleString("ar-AE")} كادر صحي مرخّص من هيئة الصحة بدبي في تخصص ${spec.name} بـ ${profile.name}. قائمة كاملة بأنواع التراخيص، مصدرها السجل الطبي الرسمي شريان.`,
    alternates: {
      canonical: `${base}/ar/professionals/facility/${profile.slug}/${spec.slug}`,
      languages: {
        "en-AE": `${base}/professionals/facility/${profile.slug}/${spec.slug}`,
        "ar-AE": `${base}/ar/professionals/facility/${profile.slug}/${spec.slug}`,
      },
    },
    openGraph: {
      title: `${spec.name} في ${profile.name}`,
      description: `${count.toLocaleString("ar-AE")} كادر مرخّص في تخصص ${spec.name} بـ ${profile.name}.`,
      url: `${base}/ar/professionals/facility/${profile.slug}/${spec.slug}`,
      type: "website",
      siteName: ar.siteName,
    },
  };
}

export default function ArFacilitySpecialtyPage({ params }: Props) {
  const profile = getFacilityProfile(params.slug);
  const spec = getSpecialtyBySlug(params.specialty);
  const professionals = getProfessionalsByFacilityAndSpecialty(
    params.slug,
    params.specialty
  );
  const base = getBaseUrl();

  if (!profile || !spec || professionals.length === 0) {
    notFound();
  }

  // License type breakdown
  let ftlCount = 0;
  let regCount = 0;
  for (const p of professionals) {
    if (p.licenseType === "FTL") ftlCount++;
    if (p.licenseType === "REG") regCount++;
  }

  const sortedProfessionals = [...professionals].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  return (
    <div dir="rtl" lang="ar" className="font-arabic max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd
        data={breadcrumbSchema([
          { name: "الرئيسية", url: base },
          { name: "الكوادر الصحية", url: `${base}/ar/professionals` },
          { name: profile.name, url: `${base}/ar/professionals/facility/${profile.slug}` },
          { name: spec.nameAr || spec.name },
        ])}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "MedicalWebPage",
          name: `${spec.nameAr || spec.name} في ${profile.name}`,
          description: `${professionals.length.toLocaleString("ar-AE")} كادر صحي مرخّص في تخصص ${spec.nameAr || spec.name} بـ ${profile.name}، دبي.`,
          url: `${base}/ar/professionals/facility/${profile.slug}/${spec.slug}`,
          about: {
            "@type": "MedicalSpecialty",
            name: spec.name,
          },
          mainEntity: {
            "@type": "MedicalBusiness",
            name: profile.name,
            numberOfEmployees: {
              "@type": "QuantitativeValue",
              value: profile.totalStaff,
            },
          },
        }}
      />

      <Breadcrumb
        items={[
          { label: "الرئيسية", href: "/" },
          { label: "الكوادر الصحية", href: "/ar/professionals" },
          { label: profile.name, href: `/ar/professionals/facility/${profile.slug}` },
          { label: spec.nameAr || spec.name },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-2">
          {spec.nameAr || spec.name} في {profile.name}
        </h1>
        <p className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium tracking-wider uppercase mb-4">
          {professionals.length.toLocaleString("ar-AE")} {ar.professionals.licensedProfessionals}
        </p>
        <div className="border-r-4 border-[#006828] bg-[#006828]/[0.04] py-5 px-6 mb-6">
          <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
            يضم {profile.name} {professionals.length.toLocaleString("ar-AE")} كادراً صحياً
            مرخّصاً من هيئة الصحة بدبي في تخصص {spec.nameAr || spec.name}
            {ftlCount > 0 && regCount > 0
              ? `، منهم ${ftlCount.toLocaleString("ar-AE")} بترخيص دائم (FTL) و${regCount.toLocaleString("ar-AE")} مسجّل (REG)`
              : ""}
            . يبلغ إجمالي كوادر هذه المنشأة المرخّصة {profile.totalStaff.toLocaleString("ar-AE")} كادراً في جميع التخصصات.
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
              {profile.totalStaff.toLocaleString("ar-AE")}
            </p>
            <p className="font-['Geist',sans-serif] text-xs text-black/40">إجمالي الكوادر</p>
          </div>
          {ftlCount > 0 && (
            <div className="bg-[#f8f8f6] p-4 text-center">
              <p className="text-2xl font-bold text-[#006828]">
                {ftlCount.toLocaleString("ar-AE")}
              </p>
              <p className="font-['Geist',sans-serif] text-xs text-black/40">ترخيص دائم (FTL)</p>
            </div>
          )}
          {regCount > 0 && (
            <div className="bg-[#f8f8f6] p-4 text-center">
              <p className="text-2xl font-bold text-[#006828]">
                {regCount.toLocaleString("ar-AE")}
              </p>
              <p className="font-['Geist',sans-serif] text-xs text-black/40">مسجّل (REG)</p>
            </div>
          )}
        </div>
      </div>

      {/* Full Listing */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          كوادر {spec.nameAr || spec.name} — أ-ي
        </h2>
      </div>
      <div className="mb-8 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-[#1c1c1c]">
              <th scope="col" className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pl-4">
                {ar.professionals.name}
              </th>
              <th scope="col" className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pl-4 hidden sm:table-cell">
                تفاصيل التخصص
              </th>
              <th scope="col" className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2">
                {ar.professionals.licenseType}
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
                  <span className="text-xs text-black/40">
                    {pro.specialty || spec.nameAr || spec.name}
                  </span>
                </td>
                <td className="py-2.5">
                  <span className="font-['Geist_Mono',monospace] text-xs text-black/40">
                    {pro.licenseType}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Navigation links */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <Link
          href={`/ar/professionals/facility/${profile.slug}`}
          className="font-['Geist',sans-serif] text-sm text-[#006828] hover:underline"
        >
          استعرض جميع الكوادر الـ {profile.totalStaff.toLocaleString("ar-AE")} في {profile.name} &rarr;
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
          href={`/professionals/facility/${profile.slug}/${spec.slug}`}
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
