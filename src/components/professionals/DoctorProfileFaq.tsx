/**
 * Contextual FAQ block for the doctor profile page. Re-uses the existing
 * client-side `FaqSection` component to match the rest of the directory.
 * Questions are derived from real source data only — no fabricated answers.
 */

import { FaqSection } from "@/components/seo/FaqSection";
import type { ProfessionalIndexRecord } from "@/lib/professionals";

interface DoctorProfileFaqProps {
  doctor: ProfessionalIndexRecord;
  cityName?: string | null;
}

export function buildDoctorFaqs(
  doctor: ProfessionalIndexRecord,
  cityName?: string | null
): { question: string; answer: string }[] {
  // FAQ uniqueness strategy (Zocdoc roadmap P0 #9):
  // Each question weaves at least 3 variables from the record — name,
  // specialty, facility, city, discipline, licenseType — so that per-page
  // answer text differs meaningfully across 65-75k doctor profiles rather
  // than reading as a name-swap template.
  const faqs: { question: string; answer: string }[] = [];
  const name = toTitleCase(doctor.name);
  const facility = doctor.primaryFacilityName;
  const city = cityName || doctor.primaryCitySlug || null;
  const specialty = doctor.specialty || "general practice";
  const disciplineLabel =
    doctor.discipline === "dentist" ? "Dental Practitioner" : "Physician";
  const levelLabel =
    doctor.level && doctor.level !== "unknown"
      ? toTitleCase(doctor.level.replace(/-/g, " "))
      : null;
  const licenseLong =
    doctor.licenseType === "FTL"
      ? "FTL (Full-Time Licensed, typically a private-sector specialist)"
      : "REG (Registered, typically a government or semi-government role)";
  const practiceLocation = facility
    ? city
      ? `${facility} in ${city}`
      : facility
    : city
      ? `a facility in ${city}`
      : "a DHA-registered facility in Dubai";

  // Q1 — Where does Dr. X practice?
  // Varies by: facility name, city, specialty
  //
  // Note: DHA lists a practitioner's registered primary facility but
  // does NOT classify facilities by specialty. We therefore say
  // "primary practice facility" (a claim DHA data supports) rather than
  // "primary facility for X care" (which implies a specialty ranking
  // DHA does not provide).
  if (facility) {
    faqs.push({
      question: `Where does Dr. ${name} practice in ${city ?? "Dubai"}?`,
      answer: `Dr. ${name} is listed in the DHA Sheryan register with ${facility}${
        city ? ` in ${city}` : ""
      } as their primary practice facility. The listing reflects DHA's most recent public register. For current appointment availability, contact ${facility} directly — Zavis is a public directory and does not handle bookings.`,
    });
  } else {
    faqs.push({
      question: `How can I contact Dr. ${name} for ${specialty} care?`,
      answer: `The DHA Sheryan register lists Dr. ${name} as a ${disciplineLabel.toLowerCase()} working in ${specialty}${
        city ? ` in ${city}` : ""
      }, but does not currently list a primary practice facility. Check the DHA Sheryan portal at sheryan.dha.gov.ae for the most current facility assignment.`,
    });
  }

  // Q2 — DHA license number + license type explanation
  // Varies by: dhaUniqueId, licenseType, discipline
  faqs.push({
    question: `How do I verify Dr. ${name}'s DHA license and ${specialty} credentials?`,
    answer: `Dr. ${name}'s DHA unique identifier is ${doctor.dhaUniqueId}, recorded in the public Sheryan register as a ${disciplineLabel} practising ${specialty}. Verify the current status directly at sheryan.dha.gov.ae by searching for this ID. License type: ${licenseLong}.`,
  });

  // Q3 — Specialty + level
  // Varies by: specialty, displayTitle, level
  if (doctor.specialty) {
    faqs.push({
      question: `What kind of ${specialty} doctor is Dr. ${name}?`,
      answer: `Dr. ${name} is listed in the DHA register as ${doctor.displayTitle}. Specialty area: ${doctor.specialty}.${
        levelLabel ? ` Level of practice: ${levelLabel}.` : ""
      } All specialty information is pulled verbatim from the DHA Sheryan register and is not editorial interpretation by Zavis.`,
    });
  }

  // Q4 — License-type meaning in context of specialty + city
  // Varies by: licenseType, specialty, city, discipline
  faqs.push({
    question: `What does ${doctor.licenseType === "FTL" ? "Full-Time Licensed" : "Registered"} status mean for a ${specialty} doctor${
      city ? ` in ${city}` : ""
    }?`,
    answer:
      doctor.licenseType === "FTL"
        ? `An FTL (Full-Time Licensed) ${disciplineLabel.toLowerCase()} practising ${specialty}${
            city ? ` in ${city}` : ""
          } is permitted to see patients independently at a specific facility under DHA supervision. FTL holders in ${specialty} typically work in private or semi-private clinics and are the most common licence class you will see for practising specialists.`
        : `A REG (Registered) ${disciplineLabel.toLowerCase()} listed for ${specialty}${
            city ? ` in ${city}` : ""
          } is formally registered on the DHA Sheryan roster but may be in a training, resident, consultant, or visiting role at a public or semi-government facility. REG status reflects a different regulatory track than FTL — not a quality difference. Check sheryan.dha.gov.ae for the current scope of practice.`,
  });

  // Q5 — Finding other specialty doctors at same facility / in same city
  // Varies by: specialty, facility, city, discipline
  faqs.push({
    question: `Are there other ${specialty} doctors${
      facility ? ` at ${facility}` : city ? ` in ${city}` : ""
    }?`,
    answer: `Yes. You can browse every DHA-licensed ${specialty} ${disciplineLabel.toLowerCase()} in the Zavis Find-a-Doctor hub for ${specialty}${
      city ? `, filter by ${city}` : ""
    }, and cross-reference against ${practiceLocation}. Zavis indexes publicly-available DHA register entries only — the list updates when DHA publishes a new Sheryan snapshot.`,
  });

  // Q6 — Data provenance specific to this doctor's facility match state
  // Varies by: dhaUniqueId, facility-match state, discipline
  //
  // Note: Zavis does not currently operate a doctor-level claim workflow
  // (the /claim route is for facilities only). We route corrections to
  // trust@zavis.ai rather than promising a "claim" flow that does not
  // exist.
  faqs.push({
    question: `How was this profile for Dr. ${name} built?`,
    answer: `Zavis built this profile by parsing the DHA Sheryan public professional register (ID ${doctor.dhaUniqueId}) and ${
      facility
        ? `matching it to the Zavis facility listing for ${facility}`
        : "indexing it without a matched facility because the register did not include one"
    }. We do not edit DHA data, we do not invent credentials, and we do not represent Dr. ${name}. If you are Dr. ${name} and wish to request a correction to this listing, email trust@zavis.ai with the DHA ID and the field you want updated.`,
  });

  return faqs;
}

function toTitleCase(s: string): string {
  return s
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function DoctorProfileFaq({ doctor, cityName }: DoctorProfileFaqProps) {
  const faqs = buildDoctorFaqs(doctor, cityName);
  return <FaqSection title="Frequently Asked Questions" faqs={faqs} />;
}
