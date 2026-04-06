/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { notFound } from 'next/navigation'
import { getReportBySlug, getAllPublishedReports } from '@/lib/research/reports-fs'
import { Metadata } from 'next'
import { ReportViewer } from '@/components/research/report-viewer'
import { Header } from '@/components/research/header'
import { Clock, ArrowLeft, ArrowDown, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

interface Props {
  params: { slug: string }
}

export const revalidate = 3600

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const report = getReportBySlug(params.slug)
  if (!report) return { title: 'Report Not Found' }

  return {
    title: `${report.meta.title} | Zavis Research`,
    description: report.meta.description,
    openGraph: {
      title: report.meta.title,
      description: report.meta.description,
      type: 'article',
      publishedTime: report.meta.publishedAt,
      images: report.meta.thumbnail ? [report.meta.thumbnail] : [],
    },
  }
}

export default function ReportPage({ params }: Props) {
  const report = getReportBySlug(params.slug)

  if (!report) {
    notFound()
  }

  // Interactive HTML report — full viewport
  if (report.html) {
    return <ReportViewer html={report.html} title={report.meta.title} slug={params.slug} />
  }

  // Editorial report detail page (for PDF-based legacy reports)
  const publishDate = new Date(report.meta.publishedAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="min-h-screen bg-[#f8f8f6]">
      <Header />

      <article className="max-w-[900px] mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16 lg:pb-24">
        {/* Breadcrumb */}
        <Link href="/research" className="inline-flex items-center gap-1.5 text-[13px] text-black/30 hover:text-[#006828] transition-colors mb-8">
          <ArrowLeft className="w-3 h-3" />
          All Reports
        </Link>

        {/* Meta */}
        <div className="flex items-center gap-3 mb-5">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-[#006828]">
            {report.meta.category}
          </span>
          <span className="w-1 h-1 rounded-full bg-black/15" />
          <span className="text-[12px] text-black/30">{publishDate}</span>
          <span className="w-1 h-1 rounded-full bg-black/15" />
          <span className="flex items-center gap-1 text-[12px] text-black/30">
            <Clock className="w-3 h-3" />
            {report.meta.readTime}
          </span>
        </div>

        {/* Title */}
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[36px] lg:text-[44px] leading-[1.1] text-[#1c1c1c] tracking-tight mb-5">
          {report.meta.title}
        </h1>

        {/* Description */}
        <p className="text-[16px] text-black/50 leading-[1.7] mb-10 max-w-[700px]">
          {report.meta.description}
        </p>

        {/* Cover image */}
        {report.meta.thumbnail && (
          <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden bg-[#f0f0ee] mb-10 ring-1 ring-black/[0.06]">
            <Image
              src={report.meta.thumbnail}
              alt={report.meta.title}
              fill
              unoptimized
              className="object-cover"
            />
          </div>
        )}

        {/* Key findings */}
        {report.meta.summary && report.meta.summary.length > 0 && (
          <div className="mb-10">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[18px] text-[#1c1c1c] tracking-tight mb-4">
              Key Findings
            </h2>
            <div className="space-y-3">
              {report.meta.summary.map((point, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-[#006828]/[0.08] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-[11px] font-semibold text-[#006828]">{i + 1}</span>
                  </span>
                  <p className="text-[14px] text-black/60 leading-relaxed">{point}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Download / Access */}
        {report.pdfFile && (
          <div className="bg-white rounded-xl border border-black/[0.06] p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[16px] text-[#1c1c1c] mb-1">
                  Access the Full Report
                </h3>
                <p className="text-[13px] text-black/40">Download the complete PDF with detailed analysis and data.</p>
              </div>
              <a
                href={report.pdfFile}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#1c1c1c] text-white px-6 py-2.5 rounded-full text-[14px] font-medium hover:bg-black transition-colors flex-shrink-0"
              >
                <ArrowDown className="w-3.5 h-3.5" />
                Download PDF
              </a>
            </div>
          </div>
        )}
      </article>

      {/* Footer */}
      <footer className="border-t border-black/[0.06]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between text-[12px] text-black/25">
            <span className="font-['Bricolage_Grotesque',sans-serif] font-medium text-black/40">Zavis Research</span>
            <span>2026 Zavis Inc.</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
