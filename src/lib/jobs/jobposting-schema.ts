import type { JobRow } from "@/lib/jobs/queries";
import { getDiscipline } from "@/lib/jobs/disciplines";
import { getBaseUrl } from "@/lib/helpers";

interface ClinicForSchema {
  name: string;
  websiteUrl?: string | null;
  citySlug?: string | null;
  emirate?: string | null;
  addressLine?: string | null;
}

const EMPLOYMENT_TYPE_MAP: Record<string, string> = {
  full_time: "FULL_TIME",
  part_time: "PART_TIME",
  locum: "TEMPORARY",
  visiting: "CONTRACTOR",
};

const CITY_DISPLAY_NAME: Record<string, string> = {
  dubai: "Dubai",
  "abu-dhabi": "Abu Dhabi",
  sharjah: "Sharjah",
  ajman: "Ajman",
  "ras-al-khaimah": "Ras Al Khaimah",
  fujairah: "Fujairah",
  "umm-al-quwain": "Umm Al Quwain",
  "al-ain": "Al Ain",
};

const CITY_TO_EMIRATE: Record<string, string> = {
  dubai: "Dubai",
  "abu-dhabi": "Abu Dhabi",
  sharjah: "Sharjah",
  ajman: "Ajman",
  "ras-al-khaimah": "Ras Al Khaimah",
  fujairah: "Fujairah",
  "umm-al-quwain": "Umm Al Quwain",
  "al-ain": "Abu Dhabi",
};

/**
 * Default validity window for JobPosting JSON-LD when the job has no explicit
 * deadline or closing date. Google for Jobs requires `validThrough`; without
 * it the listing is dropped from the index. 90 days matches typical UAE
 * clinic-hire windows.
 */
const DEFAULT_VALID_DAYS = 90;

/**
 * Build a Schema.org JobPosting object for a job. Used for Google for Jobs.
 *
 * Per Google for Jobs guidelines, only published jobs with concrete locations
 * and dates should emit this schema. We tighten the field set so disclosed
 * salary is the only path to BaseSalary (no fake estimates).
 */
export function jobPostingSchema(
  job: JobRow,
  clinic?: ClinicForSchema | null
): Record<string, unknown> {
  const base = getBaseUrl();
  const url = `${base}/jobs/${job.citySlug}/${job.specialtySlug}/${job.id}-${job.slug}`;
  const employerName = clinic?.name || job.externalClinicName || "UAE healthcare provider";
  const employerUrl = clinic?.websiteUrl || job.externalClinicUrl || undefined;
  const jobCityDisplay = CITY_DISPLAY_NAME[job.citySlug] || job.citySlug;
  const jobEmirate = CITY_TO_EMIRATE[job.citySlug] || "Dubai";
  const clinicCityDisplay = clinic?.citySlug
    ? CITY_DISPLAY_NAME[clinic.citySlug] || clinic.citySlug
    : jobCityDisplay;
  const clinicEmirate = clinic?.citySlug
    ? CITY_TO_EMIRATE[clinic.citySlug] || jobEmirate
    : jobEmirate;

  const postedAt = job.postedAt ?? new Date();
  const validThrough =
    job.applicationDeadline ??
    job.closingAt ??
    new Date(postedAt.getTime() + DEFAULT_VALID_DAYS * 86400 * 1000);

  // directApply is true only when the candidate completes the application on
  // Zavis. If the listing redirects to the employer's own site, set false.
  const isInternalApply = !job.externalClinicUrl;

  const datum: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: job.descriptionMd,
    identifier: {
      "@type": "PropertyValue",
      name: "Open Healthcare Jobs by Zavis",
      value: job.id,
    },
    datePosted: postedAt.toISOString(),
    validThrough: validThrough.toISOString(),
    employmentType: EMPLOYMENT_TYPE_MAP[job.employmentType ?? ""] || "FULL_TIME",
    hiringOrganization: {
      "@type": "Organization",
      name: employerName,
      ...(employerUrl ? { sameAs: employerUrl } : {}),
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: clinicCityDisplay,
        addressRegion: clinicEmirate,
        addressCountry: "AE",
        ...(clinic?.addressLine ? { streetAddress: clinic.addressLine } : {}),
      },
    },
    url,
    applicantLocationRequirements: {
      "@type": "Country",
      name: "United Arab Emirates",
    },
    directApply: isInternalApply,
  };

  if (job.salaryDisclosed && job.salaryMinAed) {
    datum.baseSalary = {
      "@type": "MonetaryAmount",
      currency: "AED",
      value: {
        "@type": "QuantitativeValue",
        minValue: job.salaryMinAed,
        ...(job.salaryMaxAed ? { maxValue: job.salaryMaxAed } : {}),
        unitText: "MONTH",
      },
    };
  }

  const disc = getDiscipline(job.disciplineSlug);
  if (disc) {
    datum.occupationalCategory = disc.name;
  }

  return datum;
}

export function jobsListSchema(
  jobsList: JobRow[],
  context: { name: string; url: string }
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: context.name,
    url: context.url,
    numberOfItems: jobsList.length,
    itemListElement: jobsList.map((job, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${getBaseUrl()}/jobs/${job.citySlug}/${job.specialtySlug}/${job.id}-${job.slug}`,
      name: job.title,
    })),
  };
}
