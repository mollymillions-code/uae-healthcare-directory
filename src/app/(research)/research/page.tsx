import { getAllPublishedReports, ReportMeta } from '@/lib/research/reports-fs'
import { sampleReports } from '@/data/reports'
import ResearchPageClient from '@/components/research/research-page-client'

export const revalidate = 3600

function getReports(): ReportMeta[] {
  const fsReports = getAllPublishedReports()
  if (fsReports.length > 0) return fsReports
  return sampleReports.reports.map(r => ({
    slug: r.id,
    title: r.title,
    description: r.description,
    summary: r.summary,
    category: r.category,
    publishedAt: r.publishedAt,
    readTime: r.readTime,
    thumbnail: r.thumbnail,
    isTopReport: r.isTopReport,
    isLatest: r.isLatest,
    pdfFile: r.pdfFile,
  }))
}

export default function HomePage() {
  const reports = getReports()
  return <ResearchPageClient reports={reports} />
}
