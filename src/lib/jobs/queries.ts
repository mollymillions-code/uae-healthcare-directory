import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { jobs, jobApplications, candidateSavedJobs } from "@/lib/db/schema";

export type JobRow = typeof jobs.$inferSelect;

export interface ListJobsFilter {
  citySlug?: string;
  disciplineSlug?: string;
  specialtySlug?: string;
  role?: string;
  clinicId?: string;
  status?: "draft" | "published" | "closed" | "archived";
  limit?: number;
  offset?: number;
}

/**
 * List published jobs with optional filters. Default ordering is most-recently-posted first.
 * Pass status="published" by default — anything else is admin/recruiter only.
 */
export async function listJobs(filter: ListJobsFilter = {}): Promise<JobRow[]> {
  const status = filter.status ?? "published";
  const conditions = [eq(jobs.status, status)];
  if (filter.citySlug) conditions.push(eq(jobs.citySlug, filter.citySlug));
  if (filter.disciplineSlug) conditions.push(eq(jobs.disciplineSlug, filter.disciplineSlug));
  if (filter.specialtySlug) conditions.push(eq(jobs.specialtySlug, filter.specialtySlug));
  if (filter.role) conditions.push(eq(jobs.role, filter.role));
  if (filter.clinicId) conditions.push(eq(jobs.clinicId, filter.clinicId));

  return db
    .select()
    .from(jobs)
    .where(and(...conditions))
    .orderBy(desc(jobs.postedAt))
    .limit(filter.limit ?? 50)
    .offset(filter.offset ?? 0);
}

export async function countJobs(filter: ListJobsFilter = {}): Promise<number> {
  const status = filter.status ?? "published";
  const conditions = [eq(jobs.status, status)];
  if (filter.citySlug) conditions.push(eq(jobs.citySlug, filter.citySlug));
  if (filter.disciplineSlug) conditions.push(eq(jobs.disciplineSlug, filter.disciplineSlug));
  if (filter.specialtySlug) conditions.push(eq(jobs.specialtySlug, filter.specialtySlug));
  if (filter.role) conditions.push(eq(jobs.role, filter.role));
  if (filter.clinicId) conditions.push(eq(jobs.clinicId, filter.clinicId));

  const result = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(jobs)
    .where(and(...conditions));

  return result[0]?.count ?? 0;
}

export async function getJobBySlug(slug: string): Promise<JobRow | null> {
  const row = (
    await db.select().from(jobs).where(eq(jobs.slug, slug)).limit(1)
  )[0];
  return row ?? null;
}

export async function getJobById(id: string): Promise<JobRow | null> {
  const row = (
    await db.select().from(jobs).where(eq(jobs.id, id)).limit(1)
  )[0];
  return row ?? null;
}

export async function incrementJobView(id: string): Promise<void> {
  await db
    .update(jobs)
    .set({ viewCount: sql`${jobs.viewCount} + 1` })
    .where(eq(jobs.id, id));
}

/** Aggregate counts for /jobs hub: jobs per discipline, per city, total */
export async function getJobsHubAggregates() {
  const [byDiscipline, byCity, total] = await Promise.all([
    db
      .select({
        disciplineSlug: jobs.disciplineSlug,
        count: sql<number>`count(*)::int`,
      })
      .from(jobs)
      .where(eq(jobs.status, "published"))
      .groupBy(jobs.disciplineSlug),
    db
      .select({
        citySlug: jobs.citySlug,
        count: sql<number>`count(*)::int`,
      })
      .from(jobs)
      .where(eq(jobs.status, "published"))
      .groupBy(jobs.citySlug),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(jobs)
      .where(eq(jobs.status, "published")),
  ]);

  return {
    byDiscipline: Object.fromEntries(
      byDiscipline
        .filter((r) => r.disciplineSlug)
        .map((r) => [r.disciplineSlug as string, r.count])
    ),
    byCity: Object.fromEntries(byCity.map((r) => [r.citySlug, r.count])),
    total: total[0]?.count ?? 0,
  };
}

export async function isJobSavedBy(candidateUserId: string, jobId: string): Promise<boolean> {
  const row = (
    await db
      .select({ id: candidateSavedJobs.id })
      .from(candidateSavedJobs)
      .where(
        and(
          eq(candidateSavedJobs.candidateUserId, candidateUserId),
          eq(candidateSavedJobs.jobId, jobId)
        )
      )
      .limit(1)
  )[0];
  return Boolean(row);
}

export async function hasAppliedTo(candidateUserId: string, jobId: string): Promise<boolean> {
  const row = (
    await db
      .select({ id: jobApplications.id })
      .from(jobApplications)
      .where(
        and(
          eq(jobApplications.candidateUserId, candidateUserId),
          eq(jobApplications.jobId, jobId)
        )
      )
      .limit(1)
  )[0];
  return Boolean(row);
}
