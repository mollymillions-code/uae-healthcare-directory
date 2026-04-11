/**
 * src/lib/reports/data.ts
 *
 * Async DB accessors for the `reports` + `report_authors` tables
 * (Item 6 — "What UAE Patients Want" report scaffold). Consumed by the
 * `/intelligence/reports/` route class, the press kit page, and the
 * sitemap. Read-only — writes go through `scripts/seed-reports.mjs` or
 * a future admin interface.
 *
 * All functions return POJOs (not Drizzle row types) so the page layer
 * never touches `@/lib/db/schema` directly. Empty arrays are returned
 * on DB error so the pages can still render (matching the pattern used
 * in `src/lib/intelligence/data.ts`).
 */

import type { ReportChart, ReportSection } from "@/lib/db/schema";
import type { ReportAuthorRef } from "@/lib/seo-reports";

export type ReportStatus = "draft" | "scheduled" | "published" | "archived";

export interface ReportListItem {
  id: number;
  slug: string;
  title: string;
  titleAr: string | null;
  subtitle: string | null;
  subtitleAr: string | null;
  headlineStat: string;
  headlineStatAr: string | null;
  coverImageUrl: string | null;
  releaseDate: string; // YYYY-MM-DD
  sampleSize: string | null;
  status: ReportStatus;
  featured: boolean;
  embargoDate: string | null;
  readTimeMinutes: number;
}

export interface ReportDetail extends ReportListItem {
  pdfUrl: string | null;
  methodology: string;
  methodologyAr: string | null;
  dataSource: string;
  bodyMd: string;
  bodyMdAr: string | null;
  chartData: ReportChart[];
  sections: ReportSection[];
  pressReleaseUrl: string | null;
  authors: ReportAuthorRef[];
  createdAt: string;
  updatedAt: string;
}

// Rough estimator — reports are long-form, ~180 wpm reading speed.
function estimateReadTime(bodyMd: string): number {
  const words = bodyMd.split(/\s+/).filter(Boolean).length;
  return Math.max(3, Math.round(words / 180));
}

function normalizeDate(v: Date | string | null | undefined): string {
  if (!v) return "";
  if (typeof v === "string") return v.length >= 10 ? v.slice(0, 10) : v;
  return v.toISOString().slice(0, 10);
}

function normalizeTimestamp(v: Date | string | null | undefined): string {
  if (!v) return "";
  if (typeof v === "string") return v;
  return v.toISOString();
}

type RawReportRow = {
  id: number;
  slug: string;
  title: string;
  titleAr: string | null;
  subtitle: string | null;
  subtitleAr: string | null;
  headlineStat: string;
  headlineStatAr: string | null;
  coverImageUrl: string | null;
  pdfUrl: string | null;
  releaseDate: Date | string;
  methodology: string;
  methodologyAr: string | null;
  dataSource: string;
  sampleSize: string | null;
  bodyMd: string;
  bodyMdAr: string | null;
  chartData: unknown;
  sections: unknown;
  pressReleaseUrl: string | null;
  embargoDate: Date | string | null;
  status: string;
  featured: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
};

function rowToListItem(row: RawReportRow): ReportListItem {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    titleAr: row.titleAr,
    subtitle: row.subtitle,
    subtitleAr: row.subtitleAr,
    headlineStat: row.headlineStat,
    headlineStatAr: row.headlineStatAr,
    coverImageUrl: row.coverImageUrl,
    releaseDate: normalizeDate(row.releaseDate),
    sampleSize: row.sampleSize,
    status: (row.status as ReportStatus) || "draft",
    featured: Boolean(row.featured),
    embargoDate: normalizeDate(row.embargoDate),
    readTimeMinutes: estimateReadTime(row.bodyMd || ""),
  };
}

function rowToDetail(row: RawReportRow, authors: ReportAuthorRef[]): ReportDetail {
  return {
    ...rowToListItem(row),
    pdfUrl: row.pdfUrl,
    methodology: row.methodology,
    methodologyAr: row.methodologyAr,
    dataSource: row.dataSource,
    bodyMd: row.bodyMd,
    bodyMdAr: row.bodyMdAr,
    chartData: (Array.isArray(row.chartData) ? row.chartData : []) as ReportChart[],
    sections: (Array.isArray(row.sections) ? row.sections : []) as ReportSection[],
    pressReleaseUrl: row.pressReleaseUrl,
    authors,
    createdAt: normalizeTimestamp(row.createdAt),
    updatedAt: normalizeTimestamp(row.updatedAt),
  };
}

async function safeLoad<T>(fn: () => Promise<T>, fallback: T, label: string): Promise<T> {
  if (!process.env.DATABASE_URL) return fallback;
  try {
    return await fn();
  } catch (e: unknown) {
    console.error(`[Reports] ${label} failed:`, e instanceof Error ? e.message : e);
    return fallback;
  }
}

/**
 * Public-facing list of published reports (used by the hub page + sitemap).
 * Includes drafts ONLY when `includeDrafts` is true (used by the press page
 * for internal preview links and by the seed validator).
 */
export async function getPublishedReports(): Promise<ReportListItem[]> {
  return safeLoad(
    async () => {
      const { db } = await import("@/lib/db");
      const { reports } = await import("@/lib/db/schema");
      const { desc, eq } = await import("drizzle-orm");
      const rows = (await db
        .select()
        .from(reports)
        .where(eq(reports.status, "published"))
        .orderBy(desc(reports.releaseDate))) as unknown as RawReportRow[];
      return rows.map(rowToListItem);
    },
    [],
    "getPublishedReports"
  );
}

/**
 * Every non-archived report — used by the press kit page so journalists can
 * see upcoming + embargoed releases alongside published ones.
 */
export async function getAllActiveReports(): Promise<ReportListItem[]> {
  return safeLoad(
    async () => {
      const { db } = await import("@/lib/db");
      const { reports } = await import("@/lib/db/schema");
      const { desc, ne } = await import("drizzle-orm");
      const rows = (await db
        .select()
        .from(reports)
        .where(ne(reports.status, "archived"))
        .orderBy(desc(reports.releaseDate))) as unknown as RawReportRow[];
      return rows.map(rowToListItem);
    },
    [],
    "getAllActiveReports"
  );
}

/**
 * Fetch a single report detail by slug (for the `/intelligence/reports/[slug]`
 * route). Returns null if the row is missing or the status is not publishable.
 * `allowDraft` surfaces drafts for preview URLs — set by the page only when
 * a trusted preview flag is set. Not used by default.
 */
export async function getReportBySlug(
  slug: string,
  opts: { allowDraft?: boolean } = {}
): Promise<ReportDetail | null> {
  return safeLoad(
    async () => {
      const { db } = await import("@/lib/db");
      const { reports, reportAuthors } = await import("@/lib/db/schema");
      const { eq, asc } = await import("drizzle-orm");
      const reportRows = (await db
        .select()
        .from(reports)
        .where(eq(reports.slug, slug))
        .limit(1)) as unknown as RawReportRow[];
      const row = reportRows[0];
      if (!row) return null;
      if (row.status !== "published" && !opts.allowDraft) return null;

      const authorRows = await db
        .select()
        .from(reportAuthors)
        .where(eq(reportAuthors.reportId, row.id))
        .orderBy(asc(reportAuthors.sortOrder));

      const authors: ReportAuthorRef[] = authorRows.map((a) => ({
        slug: a.authorSlug,
        name: slugToDisplayName(a.authorSlug),
        role: (a.role as ReportAuthorRef["role"]) || "author",
      }));

      return rowToDetail(row, authors);
    },
    null,
    "getReportBySlug"
  );
}

/**
 * Given a current report, return up to `limit` other published reports that
 * share the most topical overlap. Current scoring is naive (release recency)
 * because Item 6 ships before the topic taxonomy lands. Good enough for a
 * "Related reports" strip.
 */
export async function getRelatedReports(
  currentSlug: string,
  limit = 3
): Promise<ReportListItem[]> {
  const all = await getPublishedReports();
  return all.filter((r) => r.slug !== currentSlug).slice(0, limit);
}

/**
 * Light helper — turn a slug into a readable display name for the byline.
 * Replaced with a real `authors` table lookup once Item 5 ships.
 */
function slugToDisplayName(slug: string): string {
  if (!slug) return "Zavis Intelligence Team";
  return slug
    .split("-")
    .map((part) => (part.length > 0 ? part[0].toUpperCase() + part.slice(1) : part))
    .join(" ");
}

/**
 * Convenience — sync helper for the seed script and tests. NOT used by
 * pages. Given a body markdown string, returns the rough read time.
 */
export function readTimeMinutes(bodyMd: string): number {
  return estimateReadTime(bodyMd);
}
