import { CITIES } from "@/lib/constants/cities";
import { getDiscipline } from "@/lib/jobs/disciplines";

/**
 * UAE-only city list for the jobs platform. The base CITIES constant also
 * includes Qatar / Saudi / Bahrain / Kuwait entries from the GCC expansion;
 * jobs is UAE-only at launch, so every iterator over cities goes through
 * this filter to avoid generating orphan static routes for non-UAE cities.
 */
export const UAE_CITIES = CITIES.filter((c) => c.country === "ae");

const CITY_NAME_BY_SLUG: Record<string, string> = Object.fromEntries(
  CITIES.map((c) => [c.slug, c.name])
);

export function cityName(slug: string | null | undefined, fallback = "UAE"): string {
  if (!slug) return fallback;
  return CITY_NAME_BY_SLUG[slug] || slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function disciplineName(slug: string | null | undefined): string {
  if (!slug) return "Healthcare role";
  const d = getDiscipline(slug);
  return d?.name ?? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function disciplinePlural(slug: string | null | undefined): string {
  if (!slug) return "Healthcare roles";
  const d = getDiscipline(slug);
  return d?.plural ?? `${disciplineName(slug)}s`;
}

export function formatSalaryRange(min: number | null, max: number | null, disclosed?: boolean | null): string {
  if (!disclosed) return "Salary on application";
  if (min && max) return `AED ${min.toLocaleString()}–${max.toLocaleString()} / month`;
  if (min) return `AED ${min.toLocaleString()}+ / month`;
  return "Salary on application";
}

const RELATIVE_TIME_FMT = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

export function postedAgo(date: Date | null | undefined): string {
  if (!date) return "";
  const now = Date.now();
  const then = new Date(date).getTime();
  const diffMs = now - then;
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHr = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHr / 24);
  if (diffMin < 60) return RELATIVE_TIME_FMT.format(-diffMin, "minute");
  if (diffHr < 24) return RELATIVE_TIME_FMT.format(-diffHr, "hour");
  if (diffDay < 14) return RELATIVE_TIME_FMT.format(-diffDay, "day");
  if (diffDay < 60) return RELATIVE_TIME_FMT.format(-Math.round(diffDay / 7), "week");
  return RELATIVE_TIME_FMT.format(-Math.round(diffDay / 30), "month");
}

export function jobDetailUrl(job: {
  citySlug: string;
  specialtySlug: string;
  id: string;
  slug: string;
}): string {
  return `/jobs/${job.citySlug}/${job.specialtySlug}/${job.id}-${job.slug}`;
}

export function buildJobSlug(input: {
  title: string;
  disciplineSlug?: string | null;
  citySlug: string;
}): string {
  const titlePart = input.title
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const trimmed = titlePart.length > 80 ? titlePart.slice(0, 80).replace(/-+[^-]*$/, "") : titlePart;
  return `${trimmed}-${input.citySlug}`;
}

export function rolesUrl(disciplineSlug: string, citySlug?: string): string {
  if (citySlug) return `/jobs/discipline/${disciplineSlug}/${citySlug}`;
  return `/jobs/discipline/${disciplineSlug}`;
}
