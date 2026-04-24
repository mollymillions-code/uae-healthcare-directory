/**
 * Doctor profile page — /find-a-doctor/[specialty]/[doctor-slug]-[id]
 *
 * Backed by the `professionals_index` table (Item 0.75 — see
 * `scripts/build-professionals-index.mjs`). Graceful fallback: when the table
 * is empty (freshly applied migration), every DB helper returns null/[] and
 * the page emits a 404 via `notFound()`.
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/JsonLd";
import { DoctorProfilePage } from "@/components/professionals/DoctorProfilePage";
import { cache } from "react";
import {
  getProfessionalBySlug,
  getRelatedProfessionalsFromIndex,
  getProfessionalSlugsBySpecialty,
  getAllSpecialtySlugs,
  type ProfessionalIndexRecord,
} from "@/lib/professionals";

// Deduplicate: generateMetadata() and the page component both need the
// doctor record. React's cache() ensures the DB query runs once per
// request, not twice.
const getCachedDoctor = cache((slug: string) => getProfessionalBySlug(slug));
import { doctorProfileSchema } from "@/lib/professionals-seo";
import { truncateTitle, truncateDescription } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { getCityBySlug, getProviderBySlug } from "@/lib/data";

interface Props {
  params: { specialty: string; doctor: string };
}

// Revalidate once per hour. Profiles are additive; any upsert to the index
// refreshes the page on the next request.
export const revalidate = 3600;

export async function generateStaticParams() {
  if (process.env.PREBUILD_STATIC_ROUTES !== "1") return [];
  // Pre-generate the top ~1,000 well-formed doctors per session. Remaining
  // doctors are generated on-demand via ISR. During build on an empty DB,
  // this function safely returns [] and the route becomes pure on-demand.
  const specialties = await getAllSpecialtySlugs();
  if (specialties.length === 0) return [];

  // Limit total pre-generated paths to keep the static build bounded.
  const PER_SPECIALTY_LIMIT = 20;
  const MAX_SPECIALTIES = 50;
  const top = specialties.slice(0, MAX_SPECIALTIES);

  // Parallelize the ~50 slug queries via Promise.all. Previously this was a
  // sequential for-await loop adding ~2.5s to every `next build`.
  const slugsPerSpecialty = await Promise.all(
    top.map((specialty) =>
      getProfessionalSlugsBySpecialty(specialty, {
        limit: PER_SPECIALTY_LIMIT,
        requireFacility: true,
      }).then((slugs) => ({ specialty, slugs })),
    ),
  );

  const params: { specialty: string; doctor: string }[] = [];
  for (const { specialty, slugs } of slugsPerSpecialty) {
    for (const doctor of slugs) {
      params.push({ specialty, doctor });
    }
  }
  return params;
}

function buildCanonicalUrl(doctor: ProfessionalIndexRecord): string {
  return `${getBaseUrl()}/find-a-doctor/${doctor.specialtySlug}/${doctor.slug}`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const doctor = await getCachedDoctor(params.doctor);
  if (!doctor || doctor.specialtySlug !== params.specialty) {
    return { title: "Doctor not found | Zavis" };
  }
  const base = getBaseUrl();
  const canonical = buildCanonicalUrl(doctor);
  const titleSpecialty = doctor.specialty || "DHA-licensed professional";
  const rawTitle = `Dr. ${toTitleCase(doctor.name)}, ${titleSpecialty} | Zavis`;
  const rawDescription = `DHA Sheryan register profile for Dr. ${toTitleCase(doctor.name)}${
    doctor.primaryFacilityName ? ` at ${doctor.primaryFacilityName}` : ""
  }. License ${doctor.dhaUniqueId} (${doctor.licenseType}). Sourced from the DHA official register.`;

  return {
    title: truncateTitle(rawTitle),
    description: truncateDescription(rawDescription),
    alternates: {
      canonical,
      languages: {
        "en-AE": canonical,
        ...(doctor.nameAr
          ? { "ar-AE": `${base}/ar/find-a-doctor/${doctor.specialtySlug}/${doctor.slug}` }
          : {}),
        "x-default": canonical,
      },
    },
    openGraph: {
      title: truncateTitle(rawTitle),
      description: truncateDescription(rawDescription),
      url: canonical,
      type: "profile",
      siteName: "UAE Open Healthcare Directory by Zavis",
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

function toTitleCase(s: string): string {
  return s
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default async function DoctorPage({ params }: Props) {
  const doctor = await getCachedDoctor(params.doctor);
  // Not found OR slug mismatch against specialty parent
  if (!doctor || doctor.status !== "active") notFound();
  if (doctor.specialtySlug !== params.specialty) notFound();

  const canonical = buildCanonicalUrl(doctor);

  // Optional facility URL when the provider is matched. Soft lookup — errors
  // become `null` so the page still renders.
  let facilityUrl: string | null = null;
  let cityName: string | null = null;

  if (doctor.primaryFacilitySlug) {
    try {
      const provider = await getProviderBySlug(doctor.primaryFacilitySlug);
      if (provider && provider.citySlug && provider.categorySlug) {
        facilityUrl = `/directory/${provider.citySlug}/${provider.categorySlug}/${provider.slug}`;
      }
    } catch {
      facilityUrl = null;
    }
  }

  if (doctor.primaryCitySlug) {
    const city = getCityBySlug(doctor.primaryCitySlug);
    if (city) cityName = city.name;
  }

  const relatedDoctors = await getRelatedProfessionalsFromIndex(doctor, 6);

  const schemaNodes = doctorProfileSchema(doctor, {
    canonicalUrl: canonical,
    facilityUrl: facilityUrl ? `${getBaseUrl()}${facilityUrl}` : null,
    cityName,
  });

  return (
    <>
      {schemaNodes.map((node, idx) => (
        <JsonLd key={idx} data={node} />
      ))}
      <DoctorProfilePage
        doctor={doctor}
        relatedDoctors={relatedDoctors}
        facilityUrl={facilityUrl}
        cityName={cityName}
      />
    </>
  );
}
