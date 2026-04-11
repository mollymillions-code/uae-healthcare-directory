/**
 * Schema.org helpers for the new doctor profile + specialty hub route class
 * (Item 0.75 — /find-a-doctor/[specialty]/[doctor]-[id]).
 *
 * Keep this file independent from `src/lib/seo.ts` — that file is owned by
 * Item 0 and Item 2 in the Zocdoc roadmap. These helpers intentionally import
 * only the small shared truncation utilities.
 *
 * Trust discipline (Codex zocdoc-brutal-action-plan.md):
 * - NEVER emit `isAcceptingNewPatients`. We do not model it.
 * - NEVER emit `aggregateRating`. We do not have doctor ratings.
 * - NEVER emit `knowsLanguage` unless the value is real.
 * - NEVER emit `image` unless `photoUrl && photoConsent`.
 * - DO cite the DHA register as the source and emit a DHA license identifier.
 */

import type { ProfessionalIndexRecord } from "@/lib/professionals";

// ─── Breadcrumb helper (matches the `@id: url` shape used elsewhere) ────────

export function professionalBreadcrumbSchema(
  items: { name: string; url?: string }[]
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      ...(item.url
        ? { item: { "@type": "WebPage", "@id": item.url } }
        : {}),
    })),
  };
}

// ─── Doctor profile ──────────────────────────────────────────────────────────

export interface DoctorProfileSchemaOptions {
  /** Public canonical URL for the doctor profile. */
  canonicalUrl: string;
  /** Optional resolved provider link when facility is matched. */
  facilityUrl?: string | null;
  /** Optional resolved city name for areaServed. */
  cityName?: string | null;
}

/**
 * Emit the full JSON-LD graph for a doctor profile page. Returns an array of
 * nodes — each node should be injected via the existing `<JsonLd data={...} />`
 * component.
 */
export function doctorProfileSchema(
  doctor: ProfessionalIndexRecord,
  options: DoctorProfileSchemaOptions
): Record<string, unknown>[] {
  const { canonicalUrl, facilityUrl, cityName } = options;
  const physicianId = `${canonicalUrl}#physician`;
  const webpageId = `${canonicalUrl}#webpage`;

  const hasFacility = Boolean(
    doctor.primaryFacilityName && doctor.primaryFacilitySlug
  );

  const physicianType: string | string[] = hasFacility
    ? ["Physician", "MedicalOrganization"]
    : "Physician";

  const physicianNode: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": physicianType,
    "@id": physicianId,
    url: canonicalUrl,
    name: doctor.displayTitle,
    // Identifier = DHA license number. PropertyValue per schema.org guidance.
    identifier: {
      "@type": "PropertyValue",
      propertyID: "DHA License",
      value: doctor.dhaUniqueId,
    },
  };

  if (doctor.nameAr) {
    physicianNode.alternateName = doctor.nameAr;
  }

  if (doctor.specialty) {
    physicianNode.medicalSpecialty = doctor.specialty;
  }

  // Only emit image if we have explicit consent. Codex: do not show scraped
  // faces without consent.
  if (doctor.photoUrl && doctor.photoConsent) {
    physicianNode.image = doctor.photoUrl;
  }

  if (hasFacility) {
    const worksFor: Record<string, unknown> = {
      "@type": "MedicalClinic",
      name: doctor.primaryFacilityName,
    };
    if (facilityUrl) worksFor.url = facilityUrl;
    physicianNode.worksFor = worksFor;
    physicianNode.affiliation = worksFor;
  }

  if (doctor.primaryCitySlug) {
    physicianNode.areaServed = {
      "@type": "City",
      name: cityName ?? titleCase(doctor.primaryCitySlug.replace(/-/g, " ")),
    };
  }

  // Declarative data source — "sourced from DHA official register".
  physicianNode.isBasedOn = {
    "@type": "CreativeWork",
    name: "DHA Sheryan Medical Registry",
    url: "https://sheryan.dha.gov.ae/",
    publisher: {
      "@type": "Organization",
      name: "Dubai Health Authority",
    },
  };

  // ─── MedicalWebPage (the page itself) ─────────────────────────────────────

  const webpageLanguages: string[] = ["en-AE"];
  if (doctor.nameAr) webpageLanguages.push("ar-AE");

  const webpageNode: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    "@id": webpageId,
    url: canonicalUrl,
    name: doctor.displayTitle,
    inLanguage: webpageLanguages,
    about: { "@id": physicianId },
    audience: {
      "@type": "MedicalAudience",
      audienceType: "Patient",
    },
    isPartOf: {
      "@type": "WebSite",
      name: "UAE Open Healthcare Directory by Zavis",
    },
  };

  // ─── FAQPage: only questions with real answers from source data ───────────

  const faqs: { q: string; a: string }[] = [];
  if (doctor.primaryFacilityName) {
    faqs.push({
      q: `Where does ${doctor.name} practice?`,
      a: `${doctor.name} is listed in the DHA Sheryan register with ${doctor.primaryFacilityName} as their primary facility${
        cityName ? ` in ${cityName}` : ""
      }.`,
    });
  }
  faqs.push({
    q: `What is ${doctor.name}'s DHA license number?`,
    a: `${doctor.name}'s DHA unique identifier in the Sheryan register is ${doctor.dhaUniqueId}. You can verify this directly on the official DHA Sheryan portal at https://sheryan.dha.gov.ae/.`,
  });
  if (doctor.specialty) {
    faqs.push({
      q: `What is ${doctor.name}'s specialty?`,
      a: `${doctor.displayTitle} — ${doctor.specialty} (DHA-licensed ${doctor.licenseType === "FTL" ? "Full-Time Licensed" : "Registered"} professional).`,
    });
  }
  faqs.push({
    q: `Is this profile verified by ${doctor.name}?`,
    a: `This profile is generated from the publicly available DHA Sheryan register. It is not a claimed or self-authored profile. If you are ${doctor.name} and wish to claim, update, or correct this profile, please contact Zavis via the claim flow on the directory.`,
  });

  const faqNode: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.a,
      },
    })),
  };

  // ─── BreadcrumbList ───────────────────────────────────────────────────────

  const origin = extractOrigin(canonicalUrl);
  const breadcrumbs = professionalBreadcrumbSchema([
    { name: "Home", url: `${origin}/` },
    { name: "Find a Doctor", url: `${origin}/find-a-doctor` },
    doctor.specialtySlug
      ? {
          name: doctor.specialty || doctor.specialtySlug,
          url: `${origin}/find-a-doctor/${doctor.specialtySlug}`,
        }
      : { name: "Specialty" },
    { name: doctor.name },
  ]);

  return [physicianNode, webpageNode, breadcrumbs, faqNode];
}

// ─── Specialty hub schema ────────────────────────────────────────────────────

export interface SpecialtyHubSchemaOptions {
  canonicalUrl: string;
  faqs?: { q: string; a: string }[];
}

export function specialtyHubSchema(
  specialtySlug: string,
  specialtyName: string,
  totalDoctors: number,
  topDoctors: ProfessionalIndexRecord[],
  options: SpecialtyHubSchemaOptions
): Record<string, unknown>[] {
  const { canonicalUrl, faqs } = options;
  const origin = extractOrigin(canonicalUrl);

  const collection: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${canonicalUrl}#collection`,
    url: canonicalUrl,
    name: `${specialtyName} Doctors in the UAE`,
    description: `Directory of ${totalDoctors.toLocaleString()} DHA-licensed ${specialtyName} professionals in the UAE, sourced from the official Sheryan register.`,
    inLanguage: ["en-AE"],
    isPartOf: {
      "@type": "WebSite",
      name: "UAE Open Healthcare Directory by Zavis",
    },
  };

  const itemList: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${canonicalUrl}#doctors`,
    name: `Top ${Math.min(topDoctors.length, 20)} ${specialtyName} Doctors`,
    numberOfItems: topDoctors.length,
    itemListElement: topDoctors.slice(0, 20).map((d, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${origin}/find-a-doctor/${d.specialtySlug}/${d.slug}`,
      item: {
        "@type": "Physician",
        "@id": `${origin}/find-a-doctor/${d.specialtySlug}/${d.slug}#physician`,
        name: d.displayTitle,
        url: `${origin}/find-a-doctor/${d.specialtySlug}/${d.slug}`,
        identifier: {
          "@type": "PropertyValue",
          propertyID: "DHA License",
          value: d.dhaUniqueId,
        },
        ...(d.specialty ? { medicalSpecialty: d.specialty } : {}),
      },
    })),
  };

  const breadcrumbs = professionalBreadcrumbSchema([
    { name: "Home", url: `${origin}/` },
    { name: "Find a Doctor", url: `${origin}/find-a-doctor` },
    { name: specialtyName },
  ]);

  const nodes: Record<string, unknown>[] = [collection, itemList, breadcrumbs];

  if (faqs && faqs.length > 0) {
    nodes.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: {
          "@type": "Answer",
          text: f.a,
        },
      })),
    });
  }

  return nodes;
}

// ─── utils ──────────────────────────────────────────────────────────────────

function extractOrigin(url: string): string {
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.host}`;
  } catch {
    return url.replace(/\/find-a-doctor.*$/, "");
  }
}

function titleCase(s: string): string {
  return s
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
