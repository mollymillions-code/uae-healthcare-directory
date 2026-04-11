import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import { getPublishedReports } from "@/lib/reports/data";
import { reportsHubSchema } from "@/lib/seo-reports";
import { getBaseUrl } from "@/lib/helpers";

export const revalidate = 3600;

const HUB_TITLE_AR = "تقارير زافيس للمعلوماتية الصحية";
const HUB_DESCRIPTION_AR =
  "تقارير بيانات سنوية وفصلية حول وصول المرضى في الإمارات إلى الرعاية الصحية، وتجربة المرضى، وشبكات التأمين، ومعروض مقدمي الخدمة — منشورة بشكل مفتوح من زافيس.";

export const metadata: Metadata = {
  title: "تقارير زافيس للمعلوماتية الصحية — بيانات وأبحاث الرعاية الصحية في الإمارات",
  description: HUB_DESCRIPTION_AR,
  openGraph: {
    type: "website",
    locale: "ar_AE",
    siteName: "تقارير زافيس للمعلوماتية الصحية",
    url: `${getBaseUrl()}/ar/intelligence/reports`,
    title: HUB_TITLE_AR,
    description: HUB_DESCRIPTION_AR,
  },
  alternates: {
    canonical: `${getBaseUrl()}/ar/intelligence/reports`,
    languages: {
      en: `${getBaseUrl()}/intelligence/reports`,
      ar: `${getBaseUrl()}/ar/intelligence/reports`,
    },
  },
};

function formatReleaseDateAr(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("ar-AE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function ReportsHubPageAr() {
  const baseUrl = getBaseUrl();
  const reports = await getPublishedReports();

  const schemaNodes = reportsHubSchema(
    reports.map((r) => ({
      slug: r.slug,
      title: r.titleAr || r.title,
      headlineStat: r.headlineStatAr || r.headlineStat,
      releaseDate: r.releaseDate,
      methodology: "",
      dataSource: "",
      authors: [],
    })),
    baseUrl
  );

  return (
    <div dir="rtl" className="text-right">
      {schemaNodes.map((node, i) => (
        <JsonLd key={`report-hub-schema-ar-${i}`} data={node} />
      ))}

      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-4">
        <div className="border-b-2 border-[#1c1c1c]" />
        <div className="pt-8">
          <p className="font-['Geist',sans-serif] uppercase text-xs tracking-widest font-semibold text-[#006828] mb-3">
            {HUB_TITLE_AR}
          </p>
          <h1 className="font-['Bricolage_Grotesque',sans-serif] font-semibold text-[32px] sm:text-[44px] lg:text-[52px] leading-[1.05] text-[#1c1c1c] tracking-[-0.03em] max-w-3xl">
            ما يختبره المرضى في الإمارات فعلياً — مقاساً، ومرسوماً، ومنشوراً.
          </h1>
          <p className="font-['Geist',sans-serif] text-base text-black/50 mt-5 max-w-2xl leading-relaxed">
            {HUB_DESCRIPTION_AR}
          </p>
        </div>
      </div>

      <section className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-14">
        {reports.length === 0 ? (
          <div className="border border-black/[0.06] rounded-2xl p-10 text-center bg-[#f8f8f6]">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-semibold text-xl text-[#1c1c1c] tracking-tight mb-2">
              التقارير قيد الإصدار.
            </h2>
            <p className="font-['Geist',sans-serif] text-sm text-black/50 max-w-lg mx-auto">
              أول تقرير رئيسي قيد الإعداد. انضم إلى قائمة زافيس للمعلوماتية لاستلام حزمة المنهجية ونسخة مسبقة في يوم الإصدار.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10">
            {reports.map((r) => (
              <Link
                key={r.id}
                href={`/ar/intelligence/reports/${r.slug}`}
                className="group block"
              >
                <div className="relative w-full aspect-[16/10] rounded-xl bg-[#f8f8f6] mb-4" />
                <p className="font-['Geist',sans-serif] uppercase text-[10px] tracking-widest font-medium text-black/40 mb-2">
                  {formatReleaseDateAr(r.releaseDate)}
                </p>
                <h3 className="font-['Bricolage_Grotesque',sans-serif] font-semibold text-lg text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors mb-2">
                  {r.titleAr || r.title}
                </h3>
                <p className="font-['Geist',sans-serif] text-sm text-black/50 leading-relaxed line-clamp-3">
                  {r.headlineStatAr || r.headlineStat}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
