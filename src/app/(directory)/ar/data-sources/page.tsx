import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema, truncateTitle, truncateDescription } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

const TITLE = "مصادر البيانات — الدليل المفتوح للرعاية الصحية في الإمارات";
const DESCRIPTION =
  "كل مصدر بيانات أساسي يغذي الدليل المفتوح للرعاية الصحية في الإمارات وذكاء الصناعة الصحية في زافيس — هيئة الصحة بدبي، دائرة الصحة، وزارة الصحة، دبي بالس، بيانات أبوظبي المفتوحة، OSM، خرائط جوجل — مع روابط وتواريخ وشروط ترخيص.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: `${getBaseUrl()}/ar/data-sources`,
    languages: {
      en: `${getBaseUrl()}/data-sources`,
      ar: `${getBaseUrl()}/ar/data-sources`,
      "x-default": `${getBaseUrl()}/data-sources`,
    },
  },
  openGraph: {
    title: truncateTitle(TITLE),
    description: truncateDescription(DESCRIPTION),
    type: "website",
    locale: "ar_AE",
    siteName: "الدليل المفتوح للرعاية الصحية في الإمارات",
    url: `${getBaseUrl()}/ar/data-sources`,
  },
};

interface SourceRow {
  name: string;
  authority: string;
  url: string;
  scope: string;
  lastPull: string;
  license: string;
}

const SOURCES_AR: SourceRow[] = [
  {
    name: "شريان هيئة الصحة بدبي — المنشآت المرخصة",
    authority: "هيئة الصحة بدبي",
    url: "https://www.dha.gov.ae/en/sheryan",
    scope: "كل منشأة رعاية صحية مرخصة في دبي (مستشفى، عيادة، أسنان، صيدلية، مختبر، تصوير، صحة مساندة).",
    lastPull: "الربع الأول 2026",
    license: "سجل عام؛ يُسمح بالاستخدام غير التجاري للدليل مع ذكر المصدر.",
  },
  {
    name: "شريان هيئة الصحة بدبي — المهنيون",
    authority: "هيئة الصحة بدبي",
    url: "https://www.dha.gov.ae/en/sheryan",
    scope: "كل ممارس صحي مرخص يعمل في دبي.",
    lastPull: "الربع الأول 2026",
    license: "سجل عام؛ يُسمح بالاستخدام غير التجاري للدليل مع ذكر المصدر.",
  },
  {
    name: "تم — مزودو الرعاية الصحية المرخصون",
    authority: "دائرة الصحة في أبوظبي",
    url: "https://www.doh.gov.ae/en",
    scope: "كل منشأة رعاية صحية مرخصة في إمارة أبوظبي.",
    lastPull: "الربع الأول 2026",
    license: "سجل عام؛ يلزم ذكر المصدر.",
  },
  {
    name: "سجل المرخصين لدى وزارة الصحة ووقاية المجتمع",
    authority: "وزارة الصحة ووقاية المجتمع",
    url: "https://mohap.gov.ae/en",
    scope: "منشآت الرعاية الصحية المرخصة في الإمارات الشمالية.",
    lastPull: "الربع الأول 2026",
    license: "سجل عام؛ يلزم ذكر المصدر.",
  },
  {
    name: "دبي بالس — dm_community-open",
    authority: "دبي الذكية / دبي بالس",
    url: "https://www.dubaipulse.gov.ae/data/dm-community/dm_community-open",
    scope: "مضلعات الأحياء والمجتمعات الموثوقة لدبي (أسماء عربية + إنجليزية، GeoJSON).",
    lastPull: "الربع الأول 2026",
    license: "بيانات مفتوحة — رخصة المشاع الإبداعي بنسب المصنف.",
  },
  {
    name: "بيانات أبوظبي المفتوحة",
    authority: "هيئة أبوظبي الرقمية",
    url: "https://data.abudhabi/opendata",
    scope: "المناطق والقطاعات وتصنيف المجتمعات لأبوظبي.",
    lastPull: "الربع الأول 2026",
    license: "رخصة بيانات مفتوحة مع نسب المصنف.",
  },
  {
    name: "OpenStreetMap",
    authority: "مؤسسة OSM",
    url: "https://www.openstreetmap.org",
    scope: "بيانات احتياطية للأحياء والمناطق للإمارات الشمالية وأي جغرافيا غير مغطاة.",
    lastPull: "الربع الأول 2026",
    license: "رخصة قاعدة البيانات المفتوحة (ODbL). يلزم ذكر: \u00a9 OpenStreetMap contributors.",
  },
  {
    name: "Google Places API (الجديدة)",
    authority: "جوجل",
    url: "https://developers.google.com/maps/documentation/places/web-service",
    scope: "إثراء اختياري لملفات المنشآت — عدد التقييمات، متوسط التقييم، صور المعرض، ساعات العمل.",
    lastPull: "متجدد — يُجلب مرة واحدة لكل منشأة.",
    license: "شروط خدمة منصة Google Maps.",
  },
];

export default function ArabicDataSourcesPage() {
  const base = getBaseUrl();
  const webPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${base}/ar/data-sources#webpage`,
    url: `${base}/ar/data-sources`,
    name: TITLE,
    description: DESCRIPTION,
    inLanguage: "ar",
    isPartOf: {
      "@type": "WebSite",
      "@id": `${base}#website`,
      url: base,
      name: "الدليل المفتوح للرعاية الصحية في الإمارات",
    },
    publisher: {
      "@type": "Organization",
      "@id": `${base}#organization`,
      name: "Zavis",
      url: base,
    },
  };

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16" dir="rtl">
      <JsonLd data={webPageJsonLd} />
      <JsonLd
        data={breadcrumbSchema([
          { name: "الرئيسية", url: `${base}/ar` },
          { name: "مصادر البيانات", url: `${base}/ar/data-sources` },
        ])}
      />

      <h1 className="font-semibold text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-3">
        مصادر البيانات
      </h1>
      <p className="text-sm text-black/45 mb-10 max-w-3xl">
        كل مصدر بيانات أساسي يغذي الدليل وفهرس المهنيين وتصنيف الأحياء
        والطبقة التحريرية للذكاء. نسرد كل مصدر بالاسم والجهة والرابط
        والنطاق وتاريخ آخر سحب وشروط الترخيص.
      </p>

      <div className="overflow-x-auto border border-black/[0.08] rounded-2xl">
        <table className="w-full text-sm">
          <thead className="bg-[#f8f8f6] text-right">
            <tr>
              <th className="px-4 py-3 uppercase text-[11px] tracking-widest font-semibold text-[#006828]">
                المصدر
              </th>
              <th className="px-4 py-3 uppercase text-[11px] tracking-widest font-semibold text-[#006828]">
                الجهة
              </th>
              <th className="px-4 py-3 uppercase text-[11px] tracking-widest font-semibold text-[#006828]">
                النطاق
              </th>
              <th className="px-4 py-3 uppercase text-[11px] tracking-widest font-semibold text-[#006828]">
                آخر سحب
              </th>
              <th className="px-4 py-3 uppercase text-[11px] tracking-widest font-semibold text-[#006828]">
                الترخيص
              </th>
            </tr>
          </thead>
          <tbody>
            {SOURCES_AR.map((s, i) => (
              <tr
                key={s.name}
                className={i % 2 === 0 ? "bg-white" : "bg-[#fcfcfb]"}
              >
                <td className="px-4 py-4 align-top">
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-[#1c1c1c] hover:text-[#006828] transition-colors"
                  >
                    {s.name}
                  </a>
                </td>
                <td className="px-4 py-4 align-top text-black/55">{s.authority}</td>
                <td className="px-4 py-4 align-top text-black/55 max-w-md">{s.scope}</td>
                <td className="px-4 py-4 align-top text-black/55 whitespace-nowrap">
                  {s.lastPull}
                </td>
                <td className="px-4 py-4 align-top text-black/55 max-w-xs">{s.license}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-6 text-xs text-black/40 max-w-3xl">
        للإبلاغ عن مصدر بيانات مفقود أو غير صحيح، راسلنا على{" "}
        <a
          href="mailto:data@zavis.ai"
          className="text-[#006828] hover:underline"
        >
          data@zavis.ai
        </a>
        .
      </p>
    </div>
  );
}
