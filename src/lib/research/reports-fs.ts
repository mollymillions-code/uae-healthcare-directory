import { readFileSync, readdirSync, existsSync, writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

const REPORTS_DIR = join(process.cwd(), 'data', 'reports')

export interface ReportMeta {
  slug: string
  title: string
  description: string
  summary?: string[]
  category: string
  publishedAt: string
  readTime: string
  thumbnail?: string
  isTopReport?: boolean
  isLatest?: boolean
  draft?: boolean
  pdfFile?: string // legacy
}

/**
 * Read all published report metadata from the filesystem.
 */
export function getAllPublishedReports(): ReportMeta[] {
  if (!existsSync(REPORTS_DIR)) return []

  const dirs = readdirSync(REPORTS_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())

  const reports: ReportMeta[] = []

  for (const dir of dirs) {
    const metaPath = join(REPORTS_DIR, dir.name, 'meta.json')
    if (!existsSync(metaPath)) continue

    try {
      const raw = readFileSync(metaPath, 'utf8')
      const meta = JSON.parse(raw) as ReportMeta
      if (meta.draft) continue // skip draft reports — not ready for production
      if (meta.slug !== dir.name) meta.slug = dir.name
      reports.push(meta)
    } catch {
      // skip malformed meta files
    }
  }

  // Sort by publishedAt descending
  reports.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
  return reports
}

/**
 * Read a single report by slug.
 */
export function getReportBySlug(slug: string): { meta: ReportMeta; html: string | null; pdfFile: string | null } | null {
  const dir = join(REPORTS_DIR, slug)
  const metaPath = join(dir, 'meta.json')

  if (!existsSync(metaPath)) return null

  const meta = JSON.parse(readFileSync(metaPath, 'utf8')) as ReportMeta
  if (meta.slug !== slug) meta.slug = slug

  const htmlPath = join(dir, 'report.html')
  const html = existsSync(htmlPath) ? readFileSync(htmlPath, 'utf8') : null

  return { meta, html, pdfFile: meta.pdfFile || null }
}

/**
 * Publish a report — write HTML + meta to filesystem.
 * Called when a pipeline run is approved.
 */
export function publishReportToFilesystem(
  slug: string,
  html: string,
  meta: Omit<ReportMeta, 'slug'>
): string {
  const dir = join(REPORTS_DIR, slug)
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }

  writeFileSync(join(dir, 'report.html'), html, 'utf8')
  writeFileSync(join(dir, 'meta.json'), JSON.stringify({ slug, ...meta }, null, 2), 'utf8')

  return `/reports/${slug}`
}
