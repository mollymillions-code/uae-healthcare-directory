/**
 * Facts grid for the doctor profile page — pure DHA-sourced fields only.
 * Codex rule: do not show languages, insurance, availability, accepting-new-
 * patients, or ratings. Only fields explicitly in the source dataset.
 */

import type { ProfessionalIndexRecord } from "@/lib/professionals";
import { DHA_DATA_VERIFIED_AT } from "@/lib/professionals";

interface DoctorProfileFactsProps {
  doctor: ProfessionalIndexRecord;
}

function licenseTypeLong(type: "REG" | "FTL"): string {
  return type === "FTL"
    ? "FTL — Full-Time Licensed (private-sector employment)"
    : "REG — Registered (government or semi-government facility)";
}

function toTitleCase(s: string): string {
  return s
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function DoctorProfileFacts({ doctor }: DoctorProfileFactsProps) {
  const disciplineLabel = toTitleCase(doctor.discipline.replace(/-/g, " "));
  const levelLabel =
    doctor.level && doctor.level !== "unknown"
      ? toTitleCase(doctor.level.replace(/-/g, " "))
      : "—";

  const rows: { label: string; value: React.ReactNode }[] = [
    { label: "Discipline", value: disciplineLabel },
    { label: "Level", value: levelLabel },
    {
      label: "Specialty",
      value: doctor.specialty || "—",
    },
    {
      label: "License Type",
      value: licenseTypeLong(doctor.licenseType),
    },
    {
      label: "License Count",
      value: String(doctor.licenseCount),
    },
    // Education — from DHA register, only shown when non-null
    ...(doctor.education
      ? [
          {
            label: "Education",
            value: (
              <span>
                {doctor.education}
                {doctor.educationDescription && (
                  <span className="block mt-0.5 text-xs text-black/40 font-normal">
                    {doctor.educationDescription}
                  </span>
                )}
              </span>
            ),
          },
        ]
      : []),
    {
      label: "Data Source",
      value: (
        <a
          href="https://sheryan.dha.gov.ae/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#006828] underline hover:no-underline"
        >
          DHA Sheryan official register
        </a>
      ),
    },
    {
      label: "Last Verified",
      value: DHA_DATA_VERIFIED_AT,
    },
  ];

  return (
    <section className="mt-6 rounded-2xl border border-black/[0.06] bg-[#f8f8f6] p-6 sm:p-8">
      <div className="mb-4 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] text-[20px] sm:text-[24px] font-medium tracking-tight text-[#1c1c1c]">
          Professional Facts
        </h2>
      </div>
      <dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
        {rows.map((row) => (
          <div key={row.label}>
            <dt className="font-['Geist',sans-serif] text-[11px] uppercase tracking-[0.14em] text-black/40">
              {row.label}
            </dt>
            <dd className="mt-1 font-['Geist',sans-serif] text-sm text-[#1c1c1c]">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-6 font-['Geist',sans-serif] text-xs text-black/50 leading-relaxed">
        Data sourced from the DHA official register. Zavis indexes
        publicly-available professional licensing data and does not represent
        or endorse any doctor.
      </p>
    </section>
  );
}
