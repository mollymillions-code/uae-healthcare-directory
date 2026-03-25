import { getAllPublishedReports, ReportMeta } from '@/lib/research/reports-fs'
import { sampleReports } from '@/data/reports'
import { Clock, ArrowRight, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

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
  const featured = reports[0]
  const categories = Array.from(new Set(reports.map(r => r.category)))
  const restReports = reports.slice(1)

  return (
    <div className="min-h-screen bg-[#f8f8f6]">

      {/* Navbar — minimal, editorial */}
      <nav className="sticky top-0 z-50 bg-[#f8f8f6]/95 backdrop-blur-sm border-b border-black/[0.06]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <Link href="/research" className="flex items-baseline gap-1.5">
            <span className="font-['Bricolage_Grotesque',sans-serif] font-semibold text-[#1c1c1c] text-lg tracking-tight">ZAVIS</span>
            <span className="text-black/30 text-[13px] font-medium tracking-wide">RESEARCH</span>
          </Link>

          <div className="flex items-center gap-6">
            {/* Topic links — desktop only */}
            <div className="hidden md:flex items-center gap-5">
              {categories.slice(0, 5).map(cat => (
                <a key={cat} href={`#${cat.toLowerCase()}`} className="text-[13px] font-medium text-black/40 hover:text-[#006828] transition-colors">
                  {cat}
                </a>
              ))}
            </div>
            <Link
              href="/"
              className="text-[13px] font-medium text-[#006828] hover:underline"
            >
              zavis.ai
            </Link>
          </div>
        </div>
      </nav>

      {/* Masthead */}
      <header className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8 sm:pt-16 sm:pb-10">
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[36px] lg:text-[44px] leading-[1.1] text-[#1c1c1c] tracking-tight max-w-[700px]">
          Research and insights shaping the future of healthcare and business
        </h1>
        <p className="mt-4 text-[15px] text-black/45 leading-relaxed max-w-[560px]">
          In-depth analysis, data-driven reports, and expert perspectives across the industries driving transformation in the UAE and GCC.
        </p>
      </header>

      {/* Featured Report — editorial style, large */}
      {featured && (
        <section className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <Link href={`/research/${featured.slug}`} className="group block">
            <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6 lg:gap-10 bg-white rounded-2xl overflow-hidden border border-black/[0.06] hover:border-black/10 transition-colors">
              {/* Image */}
              <div className="relative aspect-[16/10] lg:aspect-auto bg-[#f0f0ee]">
                {featured.thumbnail && (
                  <Image
                    src={featured.thumbnail}
                    alt={featured.title}
                    fill
                    className="object-cover"
                  />
                )}
              </div>
              {/* Content */}
              <div className="p-6 sm:p-8 lg:py-10 lg:pr-10 lg:pl-0 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-[11px] font-semibold uppercase tracking-widest text-[#006828]">
                    {featured.category}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-black/20" />
                  <span className="text-[11px] font-medium uppercase tracking-wider text-black/30">
                    Featured
                  </span>
                </div>
                <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[22px] sm:text-[28px] leading-[1.15] text-[#1c1c1c] tracking-tight mb-3 group-hover:text-[#006828] transition-colors">
                  {featured.title}
                </h2>
                <p className="text-[14px] text-black/45 leading-relaxed mb-6 line-clamp-3">
                  {featured.description}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-[12px] text-black/30">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {featured.readTime}
                    </span>
                    <span>{new Date(featured.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                  <span className="text-[13px] font-medium text-[#006828] flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    Read <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>
          </Link>
        </section>
      )}

      {/* Divider with category pills */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="flex items-center gap-4 border-b border-black/[0.06] pb-4">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-black/30">Topics</span>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {categories.map(cat => (
              <span
                key={cat}
                className="inline-block text-[12px] font-medium text-black/50 bg-black/[0.03] px-3 py-1 rounded-full whitespace-nowrap hover:bg-[#006828]/[0.08] hover:text-[#006828] transition-colors cursor-pointer"
              >
                {cat}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* All Reports — editorial grid */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pb-16 lg:pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
          {restReports.map((report) => (
            <Link
              key={report.slug}
              href={`/research/${report.slug}`}
              className="group block"
            >
              {/* Thumbnail */}
              <div className="relative w-full aspect-[16/10] rounded-xl overflow-hidden bg-[#f0f0ee] mb-4">
                {report.thumbnail && (
                  <Image
                    src={report.thumbnail}
                    alt={report.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                )}
              </div>

              {/* Meta */}
              <div className="flex items-center gap-3 mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-widest text-[#006828]">
                  {report.category}
                </span>
                <span className="w-1 h-1 rounded-full bg-black/15" />
                <span className="text-[11px] text-black/30">
                  {new Date(report.publishedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </span>
              </div>

              {/* Title */}
              <h3 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[17px] sm:text-[19px] leading-[1.25] text-[#1c1c1c] tracking-tight mb-2 group-hover:text-[#006828] transition-colors">
                {report.title}
              </h3>

              {/* Description */}
              <p className="text-[13px] text-black/40 leading-relaxed line-clamp-2 mb-3">
                {report.description}
              </p>

              {/* Read time */}
              <div className="flex items-center gap-1 text-[12px] text-black/25">
                <Clock className="w-3 h-3" />
                <span>{report.readTime}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* About section — positioned subtly, not as a CTA */}
      <section className="border-t border-black/[0.06]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
          <div className="max-w-[600px]">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-black/30 mb-3 block">About Zavis Research</span>
            <p className="text-[15px] text-black/50 leading-[1.7]">
              Zavis Research publishes original, data-driven reports covering healthcare, hospitality, fintech, retail, and real estate across the UAE and GCC. Our research helps decision-makers understand market dynamics, technology adoption, and emerging opportunities in the region.
            </p>
            <p className="text-[15px] text-black/50 leading-[1.7] mt-4">
              Each report combines proprietary analysis with industry data to deliver actionable intelligence for executives, investors, and practitioners.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#006828] mt-6 hover:underline"
            >
              Learn more about Zavis <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer — clean, minimal */}
      <footer className="border-t border-black/[0.06] bg-[#f8f8f6]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="font-['Bricolage_Grotesque',sans-serif] font-semibold text-[#1c1c1c] text-sm">ZAVIS</span>
              <span className="text-black/20 text-[12px] ml-1.5">Research</span>
            </div>
            <div className="flex items-center gap-5 text-[12px] text-black/30">
              <Link href="/" className="hover:text-black/60 transition-colors">zavis.ai</Link>
              <a href="https://www.linkedin.com/company/zavis" target="_blank" rel="noopener noreferrer" className="hover:text-black/60 transition-colors">LinkedIn</a>
              <a href="https://www.zavis.ai/privacy-policy" target="_blank" rel="noopener noreferrer" className="hover:text-black/60 transition-colors">Privacy</a>
              <span>2026 Zavis Inc.</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
