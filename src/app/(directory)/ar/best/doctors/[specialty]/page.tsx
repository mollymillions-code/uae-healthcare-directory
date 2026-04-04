import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { FaqSection } from "@/components/seo/FaqSection";
import {
  getTopProfessionalsBySpecialty,
  getTopFacilitiesForSpecialty,
  getSpecialtyStats,
} from "@/lib/professionals";
import {
  PHYSICIAN_SPECIALTIES,
  DENTIST_SPECIALTIES,
  PROFESSIONAL_STATS,
  getSpecialtiesByCategory,
} from "@/lib/constants/professionals";
import { breadcrumbSchema, faqPageSchema, medicalWebPageSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { ar } from "@/lib/i18n";

export const revalidate = 43200;
export const dynamicParams = true;

const DOCTOR_SPECIALTIES = [...PHYSICIAN_SPECIALTIES, ...DENTIST_SPECIALTIES];

function getDoctorSpecialtyBySlug(slug: string) {
  return DOCTOR_SPECIALTIES.find((s) => s.slug === slug);
}

interface Props {
  params: { specialty: string };
}

export function generateStaticParams() {
  return DOCTOR_SPECIALTIES.map((s) => ({ specialty: s.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const spec = getDoctorSpecialtyBySlug(params.specialty);
  if (!spec) return {};

  const base = getBaseUrl();
  const url = `${base}/ar/best/doctors/${spec.slug}`;
  const title = `أفضل أطباء ${spec.nameAr} في دبي | Zavis`;
  const description = `ابحث عن أفضل أطباء ${spec.nameAr} في دبي. أفضل 10 أطباء ${spec.nameAr} مرتّبون بحسب الطاقة الاستيعابية للمنشأة، إضافةً إلى أبرز المستشفيات والعيادات. ${spec.count.toLocaleString("ar-AE")} كادر مرخّص من هيئة الصحة بدبي.`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        "en-AE": `${base}/best/doctors/${spec.slug}`,
        "ar-AE": url,
      },
    },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      siteName: ar.siteName,
    },
  };
}

export default function ArBestDoctorsBySpecialtyPage({ params }: Props) {
  const spec = getDoctorSpecialtyBySlug(params.specialty);
  if (!spec) notFound();

  const base = getBaseUrl();
  const isDentist = spec.category === "dentists";
  const doctorLabel = isDentist ? "أطباء الأسنان" : "الأطباء";
  const doctorLabelSingular = isDentist ? "طبيب أسنان" : "طبيباً";

  const topProfessionals = getTopProfessionalsBySpecialty(spec.slug, 10);
  const topFacilities = getTopFacilitiesForSpecialty(spec.slug, 10);
  const stats = getSpecialtyStats(spec.slug);

  const relatedSpecialties = getSpecialtiesByCategory(spec.category)
    .filter((s) => s.slug !== spec.slug && DOCTOR_SPECIALTIES.some((d) => d.slug === s.slug))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const faqs = [
    {
      question: `كم عدد ${doctorLabel} المتخصصين في ${spec.nameAr} بدبي؟`,
      answer: `اعتباراً من ${PROFESSIONAL_STATS.scraped}، يبلغ عدد الكوادر المرخّصة في تخصص ${spec.nameAr} ${stats.totalProfessionals.toLocaleString("ar-AE")} كادراً موزّعين على ${stats.totalFacilities.toLocaleString("ar-AE")} منشأة صحية. منهم ${stats.ftlCount.toLocaleString("ar-AE")} يحملون ترخيص دوام كامل (FTL) و${stats.regCount.toLocaleString("ar-AE")} مسجّلون (REG). البيانات من سجل شريان لهيئة الصحة بدبي.`,
    },
    {
      question: `ما أفضل مستشفى لتخصص ${spec.nameAr} في دبي؟`,
      answer: stats.topFacilities[0]
        ? `بناءً على عدد الموظفين، يمتلك ${stats.topFacilities[0].name} أكبر قسم لتخصص ${spec.nameAr} في دبي بـ${stats.topFacilities[0].count} كادراً مرخّصاً${stats.topFacilities[1] ? `، يليه ${stats.topFacilities[1].name} بـ${stats.topFacilities[1].count} كادراً` : ""}. تُتيح الأقسام الأكبر عادةً تغطية أشمل للتخصصات الفرعية ومراجعة أفضل من الأقران وتوفراً على مدار الساعة.`
        : `تصفّح تصنيفات المنشآت أعلاه للاطلاع على المستشفيات الرائدة في تخصص ${spec.nameAr} بدبي.`,
    },
    {
      question: `كيف يُصنَّف أفضل ${doctorLabel} في تخصص ${spec.nameAr} بدبي؟`,
      answer: `يُصنَّف ${doctorLabel} المتخصصون في ${spec.nameAr} بحسب الطاقة الاستيعابية المؤسسية — يحتل المراتب الأولى ${doctorLabel} العاملون في منشآت أكبر مسجّلة لدى هيئة الصحة بدبي. تُضم في التصنيف فقط ${doctorLabel} الحاملون لترخيص دوام كامل (FTL). يعتمد هذا المنهج على بيانات موثّقة من سجل شريان بدلاً من تقييمات المرضى الذاتية أو المواضع المدفوعة.`,
    },
    {
      question: `ما الفرق بين الأخصائي والاستشاري في ${spec.nameAr}؟`,
      answer: `أخصائي ${spec.nameAr} أتمّ تدريبه التخصصي وحصل على ترخيص تخصصي من هيئة الصحة بدبي. أما استشاري ${spec.nameAr} فلقب أرفع يستلزم 10+ سنوات من الخبرة السريرية بعد التخصص. كلاهما حاصل على الترخيص الكامل للممارسة في دبي، لكن مرتبة الاستشاري تعكس أقدمية وخبرة أكبر.`,
    },
    {
      question: `كيف أتحقق من ترخيص طبيب ${spec.nameAr} في دبي؟`,
      answer: `يمكنك التحقق من ترخيص أي طبيب ${spec.nameAr} عبر موقع هيئة الصحة بدبي (dha.gov.ae) أو بوابة شريان. ابحث باسم الطبيب أو رقم الترخيص لتأكيد حالته وتخصصه وانتمائه المؤسسي. جميع الـ${stats.totalProfessionals.toLocaleString("ar-AE")} كادراً في تخصص ${spec.nameAr} المُدرجين هنا تم التحقق منهم في سجل شريان.`,
    },
  ];

  return (
    <div dir="rtl" className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd
        data={medicalWebPageSchema(
          `أفضل أطباء ${spec.nameAr} في دبي 2026`,
          `أفضل 10 أطباء ${spec.nameAr} في دبي مرتّبون بحسب الطاقة الاستيعابية المؤسسية. ${stats.totalProfessionals.toLocaleString()} كادر مرخّص من هيئة الصحة بدبي.`,
          PROFESSIONAL_STATS.scraped
        )}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: `أفضل ${doctorLabel} في ${spec.nameAr} بدبي 2026`,
          numberOfItems: topProfessionals.length,
          itemListElement: topProfessionals.map((pro, i) => ({
            "@type": "ListItem",
            position: i + 1,
            item: {
              "@type": "Physician",
              name: pro.name,
              medicalSpecialty: spec.name,
              worksFor: {
                "@type": "MedicalOrganization",
                name: pro.facilityName,
              },
              hasCredential: {
                "@type": "EducationalOccupationalCredential",
                credentialCategory: pro.licenseType === "FTL" ? "Full-Time License" : "Registration",
                recognizedBy: {
                  "@type": "Organization",
                  name: "Dubai Health Authority (DHA)",
                },
              },
            },
          })),
        }}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: "الإمارات", url: base },
          { name: "الدليل", url: `${base}/ar/directory` },
          { name: "أفضل الأطباء", url: `${base}/ar/best/doctors` },
          { name: spec.nameAr },
        ])}
      />
      <JsonLd data={faqPageSchema(faqs)} />

      <Breadcrumb
        items={[
          { label: "الإمارات", href: "/ar" },
          { label: "الدليل", href: "/ar/directory" },
          { label: "أفضل الأطباء", href: "/ar/best/doctors" },
          { label: spec.nameAr },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-2">
          أفضل أطباء {spec.nameAr} في دبي 2026
        </h1>
        <p className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium tracking-wider uppercase mb-4">
          أفضل 10 {doctorLabel} في {spec.nameAr} &middot;{" "}
          {stats.totalProfessionals.toLocaleString("ar-AE")} كادر مرخّص
        </p>

        <div className="border-r-4 border-l-0 border-[#006828] bg-[#006828]/[0.04] py-5 px-6 mb-6">
          <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
            يعمل في دبي {stats.totalProfessionals.toLocaleString("ar-AE")} {doctorLabelSingular} مرخّصاً
            في تخصص {spec.nameAr} عبر {stats.totalFacilities.toLocaleString("ar-AE")} منشأة صحية.
            يحدّد التصنيف أدناه أفضل 10 بناءً على الطاقة الاستيعابية المؤسسية — {doctorLabel} في{" "}
            {stats.topFacilities[0]?.name || "المستشفيات الكبرى"}{" "}
            و{stats.topFacilities[1]?.name || "العيادات الرائدة"} وغيرها من المنشآت الكبرى
            المسجّلة لدى هيئة الصحة بدبي يحتلون المراتب الأولى. من إجمالي كوادر {spec.nameAr}
            في دبي، يحمل {stats.ftlCount.toLocaleString("ar-AE")} ترخيص دوام كامل (FTL)
            و{stats.regCount.toLocaleString("ar-AE")} مسجّلون (REG). جميع البيانات مصدرها
            سجل شريان الرسمي لهيئة الصحة بدبي.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            {
              value: stats.totalProfessionals.toLocaleString("ar-AE"),
              label: `إجمالي ${spec.nameAr}`,
            },
            {
              value: stats.totalFacilities.toLocaleString("ar-AE"),
              label: "المنشآت",
            },
            {
              value: stats.ftlCount.toLocaleString("ar-AE"),
              label: "مرخّصون بدوام كامل",
            },
            {
              value: stats.regCount.toLocaleString("ar-AE"),
              label: "مسجّلون",
            },
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

      {/* Top 10 Professionals Table */}
      {topProfessionals.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
              أفضل 10 {doctorLabel} في {spec.nameAr} بدبي
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-[#1c1c1c]">
                  <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pl-3 w-12">
                    #
                  </th>
                  <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pl-4">
                    الاسم
                  </th>
                  <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pl-4">
                    المنشأة
                  </th>
                  <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 hidden sm:table-cell">
                    الترخيص
                  </th>
                </tr>
              </thead>
              <tbody>
                {topProfessionals.map((pro, i) => (
                  <tr key={pro.id} className="border-b border-black/[0.06]">
                    <td className="py-3 pl-3 text-right">
                      <span className="inline-flex items-center justify-center w-7 h-7 bg-[#006828] text-white font-['Geist_Mono',monospace] text-xs font-bold">
                        {i + 1}
                      </span>
                    </td>
                    <td className="py-3 pl-4 text-right">
                      <span className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight">
                        {pro.name}
                      </span>
                    </td>
                    <td className="py-3 pl-4 text-right">
                      <Link
                        href={`/ar/professionals/facility/${pro.facilitySlug}`}
                        className="font-['Geist',sans-serif] text-sm text-black/60 hover:text-[#006828] transition-colors"
                      >
                        {pro.facilityName || "\u2014"}
                      </Link>
                    </td>
                    <td className="py-3 hidden sm:table-cell text-right">
                      <span className="font-['Geist_Mono',monospace] text-xs text-black/40">
                        {pro.licenseType}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Top 10 Hospitals/Clinics */}
      {topFacilities.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
              أفضل 10 مستشفيات وعيادات لتخصص {spec.nameAr}
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-[#1c1c1c]">
                  <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pl-3 w-12">
                    #
                  </th>
                  <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pl-4">
                    المنشأة
                  </th>
                  <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pl-4">
                    كوادر {spec.nameAr}
                  </th>
                  <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 hidden sm:table-cell">
                    إجمالي الموظفين
                  </th>
                </tr>
              </thead>
              <tbody>
                {topFacilities.map((fac, i) => (
                  <tr key={fac.slug} className="border-b border-black/[0.06]">
                    <td className="py-3 pl-3 text-right">
                      <span className="inline-flex items-center justify-center w-7 h-7 bg-[#f8f8f6] text-[#1c1c1c] font-['Geist_Mono',monospace] text-xs font-bold border border-black/[0.06]">
                        {i + 1}
                      </span>
                    </td>
                    <td className="py-3 pl-4 text-right">
                      <Link
                        href={`/ar/professionals/facility/${fac.slug}/${spec.slug}`}
                        className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight hover:text-[#006828] transition-colors"
                      >
                        {fac.name}
                      </Link>
                    </td>
                    <td className="py-3 pl-4 text-left">
                      <span className="text-sm font-bold text-[#006828]">
                        {fac.count.toLocaleString("ar-AE")}
                      </span>
                    </td>
                    <td className="py-3 text-left hidden sm:table-cell">
                      <span className="font-['Geist',sans-serif] text-sm text-black/40">
                        {fac.totalStaff.toLocaleString("ar-AE")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* How We Rank */}
      <section className="mb-12">
        <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
            كيف نُصنّف {doctorLabel} في {spec.nameAr}؟
          </h2>
        </div>
        <div className="bg-[#f8f8f6] border border-black/[0.06] p-5">
          <p className="font-['Geist',sans-serif] text-sm text-black/40 leading-relaxed mb-3">
            يقوم تصنيف {spec.nameAr} على <strong>حجم المنشأة</strong> وفق ما يُفيد به سجل
            شريان لهيئة الصحة بدبي. يحتل المراتب الأولى {doctorLabel} العاملون في منشآت أكبر
            مسجّلة لدى هيئة الصحة بدبي، لأن المؤسسات الأكبر تُطبّق عادةً معايير اعتماد أكثر
            صرامة، وتحافظ على لجان مراجعة متعددة التخصصات، وتلتزم بمعايير اعتماد JCI/CBAHI.
          </p>
          <p className="font-['Geist',sans-serif] text-sm text-black/40 leading-relaxed mb-3">
            تُضم في التصنيف فقط حاملو <strong>ترخيص دوام كامل (FTL)</strong>، مما يضمن
            أن التصنيف يعكس الممارسين المتفرغين لتخصص {spec.nameAr} لا التسجيلات
            بدوام جزئي أو الامتيازات الزيارية.
          </p>
          <p className="font-['Geist',sans-serif] text-sm text-black/40 leading-relaxed">
            يتجنب هذا المنهج عدم موثوقية تقييمات المرضى الذاتية وتحيّز المواضع المدفوعة،
            ويعتمد بدلاً منها على بيانات مؤسسية موثّقة من هيئة الصحة بدبي.
          </p>
        </div>
      </section>

      {/* Related Directory Category */}
      {spec.relatedDirectoryCategory && (
        <section className="mb-10">
          <div className="border border-black/[0.06] p-4">
            <Link
              href={`/ar/directory/dubai/${spec.relatedDirectoryCategory}`}
              className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#006828] hover:underline"
            >
              تصفّح عيادات ومستشفيات {spec.nameAr} في دبي &larr;
            </Link>
            <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">
              ابحث عن منشآت {spec.relatedDirectoryCategory.replace(/-/g, " ")} مع التقييمات
              وخطط التأمين وتفاصيل التواصل.
            </p>
          </div>
        </section>
      )}

      {/* FAQs */}
      <FaqSection faqs={faqs} title={`أفضل أطباء ${spec.nameAr} في دبي — أسئلة شائعة`} />

      {/* Related Specialties */}
      {relatedSpecialties.length > 0 && (
        <section className="mb-10 mt-10">
          <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
              {isDentist ? "تخصصات سنّية ذات صلة" : "تخصصات طبية ذات صلة"}
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {relatedSpecialties.map((rel) => (
              <Link
                key={rel.slug}
                href={`/ar/best/doctors/${rel.slug}`}
                className="border border-black/[0.06] p-3 hover:border-[#006828]/15 transition-colors group"
              >
                <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
                  أفضل أطباء {rel.nameAr || rel.name}
                </p>
                <p className="text-[11px] text-black/40 mt-1">
                  {rel.count.toLocaleString("ar-AE")} {doctorLabel}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Cross-links */}
      <section className="mb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/ar/best/doctors"
            className="border border-black/[0.06] p-4 hover:border-[#006828]/15 transition-colors group"
          >
            <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] group-hover:text-[#006828] transition-colors tracking-tight">
              &rarr; جميع التخصصات الطبية
            </p>
            <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">
              تصفّح جميع {DOCTOR_SPECIALTIES.length} تخصصاً طبياً وسنّياً
            </p>
          </Link>
          <Link
            href={`/ar/professionals/${spec.category}/${spec.slug}`}
            className="border border-black/[0.06] p-4 hover:border-[#006828]/15 transition-colors group"
          >
            <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] group-hover:text-[#006828] transition-colors tracking-tight">
              دليل {spec.nameAr} الكامل &larr;
            </p>
            <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">
              جميع {stats.totalProfessionals.toLocaleString("ar-AE")} كادراً في {spec.nameAr} مُدرجون
            </p>
          </Link>
        </div>
      </section>

      {/* DHA Disclaimer */}
      <div className="border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>المصدر:</strong> سجل المهنيين الطبيين شريان التابع لهيئة الصحة بدبي (DHA).
          تاريخ استخراج البيانات: {PROFESSIONAL_STATS.scraped}. التصنيفات مبنية على الطاقة
          الاستيعابية المؤسسية ولا تمثّل نصيحة طبية أو تزكيةً. تحقق من أوراق الاعتماد
          مباشرةً من هيئة الصحة بدبي (dha.gov.ae) قبل اتخاذ أي قرار صحي. لا توجد مواضع مدفوعة
          أو تصنيفات مموّلة في هذه الصفحة.
        </p>
      </div>
    </div>
  );
}
