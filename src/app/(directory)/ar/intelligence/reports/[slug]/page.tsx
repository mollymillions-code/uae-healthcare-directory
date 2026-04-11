import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/JsonLd";
import { getReportBySlug } from "@/lib/reports/data";
import { reportSchema, type ReportRow } from "@/lib/seo-reports";
import { getBaseUrl } from "@/lib/helpers";

export const revalidate = 3600;

interface PageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const report = await getReportBySlug(params.slug);
  if (!report) return {};
  const base = getBaseUrl();
  const title = report.titleAr || report.title;
  const headline = report.headlineStatAr || report.headlineStat;
  return {
    title,
    description:
      headline.length > 155 ? `${headline.slice(0, 152)}...` : headline,
    openGraph: {
      type: "article",
      locale: "ar_AE",
      title,
      description: headline,
      publishedTime: report.releaseDate,
      modifiedTime: report.updatedAt || report.releaseDate,
      url: `${base}/ar/intelligence/reports/${report.slug}`,
    },
    alternates: {
      canonical: `${base}/ar/intelligence/reports/${report.slug}`,
      languages: {
        en: `${base}/intelligence/reports/${report.slug}`,
        ar: `${base}/ar/intelligence/reports/${report.slug}`,
      },
    },
  };
}

export default async function ReportPageAr({ params }: PageProps) {
  const report = await getReportBySlug(params.slug);
  if (!report) notFound();

  const baseUrl = getBaseUrl();
  const title = report.titleAr || report.title;
  const headline = report.headlineStatAr || report.headlineStat;
  const subtitle = report.subtitleAr || report.subtitle;
  const methodology = report.methodologyAr || report.methodology;

  const schemaRow: ReportRow = {
    slug: report.slug,
    title,
    titleAr: report.titleAr,
    subtitle,
    subtitleAr: report.subtitleAr,
    headlineStat: headline,
    headlineStatAr: report.headlineStatAr,
    coverImageUrl: report.coverImageUrl,
    pdfUrl: report.pdfUrl,
    releaseDate: report.releaseDate,
    methodology,
    methodologyAr: report.methodologyAr,
    dataSource: report.dataSource,
    sampleSize: report.sampleSize,
    pressReleaseUrl: report.pressReleaseUrl,
    authors: report.authors.length
      ? report.authors
      : [
          {
            slug: "zavis-intelligence-team",
            name: "فريق زافيس للمعلوماتية",
            role: "author",
          },
        ],
    updatedAt: report.updatedAt,
    createdAt: report.createdAt,
  };
  const schemaNodes = reportSchema(schemaRow, baseUrl);

  return (
    <div dir="rtl" className="text-right">
      {schemaNodes.map((node, i) => (
        <JsonLd key={`report-schema-ar-${i}`} data={node} />
      ))}

      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16">
        <div className="border-b-2 border-[#1c1c1c]" />
        <p className="font-['Geist',sans-serif] uppercase text-xs tracking-widest font-semibold text-[#006828] mt-8 mb-3">
          تقرير زافيس للمعلوماتية الصحية
        </p>
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-semibold text-[32px] sm:text-[44px] lg:text-[56px] leading-[1.05] text-[#1c1c1c] tracking-[-0.035em] max-w-4xl">
          {title}
        </h1>
        {subtitle && (
          <p className="font-['Geist',sans-serif] text-lg text-black/55 mt-5 max-w-3xl leading-relaxed">
            {subtitle}
          </p>
        )}

        <div className="border-r-4 border-[#006828] bg-[#006828]/[0.05] rounded-l-xl px-6 py-5 mt-8 max-w-3xl">
          <p className="font-['Geist',sans-serif] uppercase text-[10px] tracking-widest font-semibold text-[#006828] mb-2">
            أبرز النتائج
          </p>
          <p className="font-['Bricolage_Grotesque',sans-serif] font-semibold text-xl sm:text-2xl text-[#1c1c1c] tracking-tight leading-snug">
            {headline}
          </p>
        </div>

        <div className="mt-10 space-y-4">
          <p className="font-['Geist',sans-serif] text-base text-black/70 leading-relaxed max-w-3xl">
            يتوفر هذا التقرير حالياً باللغة الإنجليزية مع ملخص تنفيذي باللغة العربية. تنشر تقارير زافيس للمعلوماتية الصحية بشكل مفتوح دون بوابات تسجيل أو اشتراك.
          </p>
          <p className="font-['Geist',sans-serif] text-base text-black/70 leading-relaxed max-w-3xl">
            <span className="font-semibold text-[#1c1c1c]">المنهجية:</span> {methodology}
          </p>
          {report.sampleSize && (
            <p className="font-['Geist',sans-serif] text-base text-black/70 leading-relaxed max-w-3xl">
              <span className="font-semibold text-[#1c1c1c]">حجم العينة:</span> {report.sampleSize}
            </p>
          )}
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href={`/intelligence/reports/${report.slug}`}
            className="inline-flex items-center gap-2 px-5 py-3 bg-[#006828] text-white font-['Geist',sans-serif] text-sm font-semibold rounded-full hover:bg-[#004d1c] transition-colors"
          >
            View English report
          </Link>
          <Link
            href="/ar/intelligence/reports"
            className="inline-flex items-center gap-2 px-5 py-3 border border-black/[0.1] text-[#1c1c1c] font-['Geist',sans-serif] text-sm font-medium rounded-full hover:border-[#006828] hover:text-[#006828] transition-colors"
          >
            جميع التقارير
          </Link>
        </div>
      </div>
    </div>
  );
}
