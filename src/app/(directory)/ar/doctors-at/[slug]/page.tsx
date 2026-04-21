import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  getProfessionalsByFacility,
  getFacilityProfile,
  getAllFacilities,
} from "@/lib/professionals";
import { ALL_SPECIALTIES, PROFESSIONAL_STATS } from "@/lib/constants/professionals";
import { breadcrumbSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { ar } from "@/lib/i18n";

export const revalidate = 43200;
export const dynamicParams = true;

interface Props {
  params: { slug: string };
}

const DOCTOR_CATEGORIES = new Set(["physicians", "dentists"]);

export function generateStaticParams() {
  return getAllFacilities(5)
    .slice(0, 50)
    .map((f) => ({ slug: f.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const profile = getFacilityProfile(params.slug);
  if (!profile) {
    return {
      title: "الأطباء في منشأة صحية بدبي",
      description:
        "اعثر على الأطباء في هذه المنشأة الصحية بدبي. أطباء وأطباء أسنان مرخّصون من سجل شريان لهيئة الصحة بدبي.",
    };
  }

  const allProfessionals = getProfessionalsByFacility(params.slug);
  const doctorCount = allProfessionals.filter(
    (p) => DOCTOR_CATEGORIES.has(p.categorySlug)
  ).length;
  const base = getBaseUrl();

  return {
    title: `الأطباء في ${profile.name}`,
    description: `اعثر على ${doctorCount.toLocaleString("ar-AE")} طبيباً مرخّصاً في ${profile.name} بدبي. تصفّح الأطباء والأسنان حسب التخصص ونوع الترخيص. البيانات من سجل شريان لهيئة الصحة بدبي.`,
    alternates: {
      canonical: `${base}/ar/doctors-at/${profile.slug}`,
      languages: {
        "en-AE": `${base}/doctors-at/${profile.slug}`,
        "ar-AE": `${base}/ar/doctors-at/${profile.slug}`,
      },
    },
    keywords: [
      `الأطباء في ${profile.name}`,
      `قائمة أطباء ${profile.name}`,
      `موظفو ${profile.name}`,
      `أطباء ${profile.name}`,
      `أخصائيو ${profile.name}`,
    ],
    openGraph: {
      title: `الأطباء في ${profile.name} — ${doctorCount.toLocaleString("ar-AE")} كادر مرخّص`,
      description: `${doctorCount.toLocaleString("ar-AE")} طبيباً مرخّصاً يعملون في ${profile.name}. تصفّح حسب التخصص ونوع الترخيص ومستوى الأقدمية.`,
      url: `${base}/ar/doctors-at/${profile.slug}`,
      type: "website",
      siteName: ar.siteName,
    },
  };
}

export default function ArDoctorsAtPage({ params }: Props) {
  const profile = getFacilityProfile(params.slug);
  if (!profile) notFound();

  const allProfessionals = getProfessionalsByFacility(params.slug);
  if (allProfessionals.length === 0) notFound();

  const base = getBaseUrl();

  const doctors = allProfessionals.filter((p) =>
    DOCTOR_CATEGORIES.has(p.categorySlug)
  );
  const physicianCount = allProfessionals.filter(
    (p) => p.categorySlug === "physicians"
  ).length;
  const dentistCount = allProfessionals.filter(
    (p) => p.categorySlug === "dentists"
  ).length;

  const specCounts: Record<string, number> = {};
  for (const d of doctors) {
    if (d.specialtySlug) {
      specCounts[d.specialtySlug] = (specCounts[d.specialtySlug] || 0) + 1;
    }
  }
  const doctorSpecialties = Object.entries(specCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([slug, count]) => {
      const spec = ALL_SPECIALTIES.find((s) => s.slug === slug);
      return { slug, name: spec?.name || slug, nameAr: spec?.nameAr || slug, count };
    });

  const sortedDoctors = [...doctors].sort((a, b) => a.name.localeCompare(b.name));
  const displayLimit = 100;
  const displayDoctors = sortedDoctors.slice(0, displayLimit);

  return (
    <div dir="rtl" className="font-arabic max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd
        data={breadcrumbSchema([
          { name: "الإمارات", url: base },
          { name: "الدليل", url: `${base}/ar/directory` },
          { name: `الأطباء في ${profile.name}` },
        ])}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "MedicalBusiness",
          name: profile.name,
          url: `${base}/ar/doctors-at/${profile.slug}`,
          numberOfEmployees: {
            "@type": "QuantitativeValue",
            value: doctors.length,
            unitText: "doctors",
          },
          description: `يضم ${profile.name} ${doctors.length.toLocaleString()} طبيباً مرخّصاً (أطباء وأطباء أسنان) يعملون في دبي.`,
          employee: displayDoctors.slice(0, 20).map((d) => ({
            "@type": "Physician",
            name: d.name,
            medicalSpecialty: d.specialty || undefined,
            hasCredential: {
              "@type": "EducationalOccupationalCredential",
              credentialCategory: `DHA ${d.licenseType}`,
            },
          })),
          areaServed: {
            "@type": "City",
            name: "Dubai",
            addressCountry: "AE",
          },
        }}
      />

      <Breadcrumb
        items={[
          { label: "الإمارات", href: "/ar" },
          { label: "الدليل", href: "/ar/directory" },
          { label: `الأطباء في ${profile.name}` },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-2">
          الأطباء في {profile.name}
        </h1>
        <p className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium tracking-wider uppercase mb-4">
          {doctors.length.toLocaleString("ar-AE")} طبيباً مرخّصاً &middot; دبي
        </p>
        <div className="border-r-4 border-l-0 border-[#006828] bg-[#006828]/[0.04] py-5 px-6 mb-6">
          <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
            يضم {profile.name}{" "}
            <strong>{doctors.length.toLocaleString("ar-AE")}</strong> طبيباً مرخّصاً
            (أطباء وأطباء أسنان) مسجّلين لدى هيئة الصحة بدبي.
            {physicianCount > 0 && (
              <> يشمل ذلك {physicianCount.toLocaleString("ar-AE")} طبيباً</>
            )}
            {dentistCount > 0 && (
              <> و{dentistCount.toLocaleString("ar-AE")} طبيب أسنان</>
            )}
            {doctorSpecialties.length > 0 && (
              <> عبر {doctorSpecialties.length} تخصصاً</>
            )}
            . تضم المنشأة {profile.totalStaff.toLocaleString("ar-AE")} كادراً مرخّصاً
            إجمالاً بما في ذلك الممرضون والمهنيون المساندون. البيانات من سجل شريان الرسمي
            لهيئة الصحة بدبي ({PROFESSIONAL_STATS.scraped}).
          </p>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { value: doctors.length.toLocaleString("ar-AE"), label: "أطباء مرخّصون" },
            { value: physicianCount.toLocaleString("ar-AE"), label: "أطباء" },
            { value: dentistCount.toLocaleString("ar-AE"), label: "أطباء أسنان" },
            { value: doctorSpecialties.length.toString(), label: "التخصصات" },
          ].map(({ value, label }) => (
            <div key={label} className="bg-[#f8f8f6] p-4 text-center">
              <p className="text-2xl font-bold text-[#006828]">{value}</p>
              <p className="font-['Geist',sans-serif] text-xs text-black/40">
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Doctors by Specialty */}
      {doctorSpecialties.length > 0 && (
        <>
          <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
              الأطباء حسب التخصص
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-12">
            {doctorSpecialties.map((spec) => {
              const fullSpec = ALL_SPECIALTIES.find((s) => s.slug === spec.slug);
              const catSlug = fullSpec?.category || "physicians";
              return (
                <Link
                  key={spec.slug}
                  href={`/ar/professionals/facility/${profile.slug}/${spec.slug}`}
                  className="border border-black/[0.06] p-3 hover:border-[#006828]/15 transition-colors group"
                >
                  <h3 className="text-sm font-['Bricolage_Grotesque',sans-serif] font-semibold text-[#1c1c1c] tracking-tight mb-1 group-hover:text-[#006828] transition-colors">
                    {spec.nameAr || spec.name}
                  </h3>
                  <p className="text-[11px] text-black/40">
                    {spec.count} {spec.count === 1 ? "طبيب" : "أطباء"}
                  </p>
                  <p className="text-[10px] text-black/25 mt-0.5">
                    {catSlug === "dentists" ? "طب الأسنان" : "طب عام"}
                  </p>
                </Link>
              );
            })}
          </div>
        </>
      )}

      {/* Doctor Listing Table */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          دليل الأطباء — أ-ي
        </h2>
      </div>
      <p className="font-['Geist',sans-serif] text-xs text-black/40 mb-4">
        {displayLimit < doctors.length
          ? `عرض أول ${displayLimit} من `
          : "عرض "}
        {doctors.length.toLocaleString("ar-AE")} طبيباً مرخّصاً في {profile.name}،
        مرتّبون أبجدياً.
      </p>
      <div className="mb-8 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-[#1c1c1c]">
              <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pl-4">
                الاسم
              </th>
              <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pl-4 hidden sm:table-cell">
                التخصص
              </th>
              <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2">
                الترخيص
              </th>
            </tr>
          </thead>
          <tbody>
            {displayDoctors.map((doc) => (
              <tr key={doc.id} className="border-b border-black/[0.06]">
                <td className="py-2.5 pl-4 text-right">
                  <span className="font-['Bricolage_Grotesque',sans-serif] text-sm text-[#1c1c1c] tracking-tight">
                    {doc.name}
                  </span>
                </td>
                <td className="py-2.5 pl-4 hidden sm:table-cell text-right">
                  <span className="font-['Geist',sans-serif] text-xs text-black/40">
                    {doc.specialty || "--"}
                  </span>
                </td>
                <td className="py-2.5 text-right">
                  <span className="font-['Geist_Mono',monospace] text-xs text-black/40">
                    {doc.licenseType}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {doctors.length > displayLimit && (
        <p className="font-['Geist',sans-serif] text-xs text-black/40 mb-8">
          عرض {displayLimit} من {doctors.length.toLocaleString("ar-AE")} طبيباً.
          اطّلع على دليل الموظفين الكامل لجميع الكوادر بما فيها الممرضون والمهنيون المساندون.
        </p>
      )}

      {/* Top Specialties */}
      {doctorSpecialties.length > 0 && (
        <>
          <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
              أكثر تخصصات الأطباء شيوعاً
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
                    التخصص
                  </th>
                  <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pl-4">
                    الأطباء
                  </th>
                  <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2">
                    % من الأطباء
                  </th>
                </tr>
              </thead>
              <tbody>
                {doctorSpecialties.slice(0, 15).map((spec, i) => {
                  const pct =
                    doctors.length > 0
                      ? ((spec.count / doctors.length) * 100).toFixed(1)
                      : "0";
                  return (
                    <tr key={spec.slug} className="border-b border-black/[0.06]">
                      <td className="py-2.5 pl-4 font-['Geist_Mono',monospace] text-xs text-black/30 text-right">
                        {i + 1}
                      </td>
                      <td className="py-2.5 pl-4 text-right">
                        <span className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight">
                          {spec.nameAr || spec.name}
                        </span>
                      </td>
                      <td className="py-2.5 pl-4 text-left">
                        <span className="font-['Geist_Mono',monospace] text-sm font-bold text-[#006828]">
                          {spec.count}
                        </span>
                      </td>
                      <td className="py-2.5 text-left">
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

      {/* Cross-links */}
      <div className="border-t border-black/[0.06] pt-6 mb-4 space-y-2">
        <Link
          href={`/ar/professionals/facility/${profile.slug}`}
          className="block font-['Geist',sans-serif] text-sm text-[#006828] hover:underline"
        >
          عرض دليل الموظفين الكامل في {profile.name} ({profile.totalStaff.toLocaleString("ar-AE")} موظفاً إجمالاً بما فيهم الممرضون والمهنيون المساندون) &larr;
        </Link>
        <Link
          href={`/ar/directory/dubai?q=${encodeURIComponent(profile.name)}`}
          className="block font-['Geist',sans-serif] text-sm text-[#006828] hover:underline"
        >
          ابحث عن {profile.name} في دليل المنشآت &larr;
        </Link>
        <Link
          href="/ar/professionals"
          className="block font-['Geist',sans-serif] text-sm text-[#006828] hover:underline"
        >
          تصفّح جميع {PROFESSIONAL_STATS.total.toLocaleString("ar-AE")} كادراً صحياً في دبي &larr;
        </Link>
      </div>

      {/* Disclaimer */}
      <div className="border-t border-black/[0.06] pt-4 mt-8">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>المصدر:</strong> سجل المهنيين الطبيين شريان التابع لهيئة الصحة بدبي (DHA).
          تاريخ استخراج البيانات: {PROFESSIONAL_STATS.scraped}. هذا الدليل لأغراض معلوماتية فقط
          ولا يمثّل نصيحة طبية. يُرجى التحقق من أوراق اعتماد المهنيين مباشرة من هيئة الصحة بدبي
          قبل اتخاذ أي قرار صحي.
        </p>
      </div>
    </div>
  );
}
