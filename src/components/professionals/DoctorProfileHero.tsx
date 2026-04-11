/**
 * Hero block for /find-a-doctor/[specialty]/[doctor]-[id] profile pages.
 *
 * Renders: photo (or neutral initial avatar) + name + display title + DHA
 * license number + license type badge + primary specialty.
 *
 * NO invented trust marks — no "Verified", no "Accepting New Patients", no
 * "Available Today". Codex rule.
 */

import Image from "next/image";
import type { ProfessionalIndexRecord } from "@/lib/professionals";
import { DoctorInitialsAvatar } from "./DoctorInitialsAvatar";

interface DoctorProfileHeroProps {
  doctor: ProfessionalIndexRecord;
}

function licenseTypeLabel(type: "REG" | "FTL"): string {
  return type === "FTL" ? "Full-Time Licensed" : "Registered";
}

export function DoctorProfileHero({ doctor }: DoctorProfileHeroProps) {
  const showPhoto = Boolean(doctor.photoUrl && doctor.photoConsent);
  const titleCasedName = toTitleCase(doctor.name);

  return (
    <section className="rounded-2xl border border-black/[0.06] bg-white p-6 sm:p-8">
      <div className="flex flex-col items-start gap-6 sm:flex-row">
        <div className="flex-shrink-0">
          {showPhoto && doctor.photoUrl ? (
            <Image
              src={doctor.photoUrl}
              alt={`${titleCasedName} — DHA-licensed ${doctor.specialty || doctor.discipline}`}
              width={128}
              height={128}
              priority
              unoptimized
              className="h-32 w-32 rounded-full object-cover"
            />
          ) : (
            <DoctorInitialsAvatar
              name={titleCasedName}
              dhaUniqueId={doctor.dhaUniqueId}
              sizePx={128}
            />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-['Geist',sans-serif] text-[11px] uppercase tracking-[0.14em] text-black/40">
              DHA Register
            </span>
            <span className="rounded-full bg-[#f1f5ee] px-2 py-0.5 font-['Geist',sans-serif] text-[11px] font-medium text-[#006828]">
              {licenseTypeLabel(doctor.licenseType)}
            </span>
            {doctor.discipline === "dentist" ? (
              <span className="rounded-full bg-[#fff4e8] px-2 py-0.5 font-['Geist',sans-serif] text-[11px] font-medium text-[#7a3c0e]">
                Dentist
              </span>
            ) : null}
          </div>

          <h1 className="mt-2 font-['Bricolage_Grotesque',sans-serif] text-[28px] sm:text-[34px] font-medium tracking-tight text-[#1c1c1c]">
            {`Dr. ${titleCasedName}`}
          </h1>

          {doctor.specialty ? (
            <p className="mt-1 font-['Geist',sans-serif] text-base text-black/60">
              {toTitleCase(doctor.level.replace(/-/g, " "))}
              {doctor.specialty ? ` · ${doctor.specialty}` : ""}
            </p>
          ) : null}

          <dl className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div>
              <dt className="font-['Geist',sans-serif] text-[11px] uppercase tracking-[0.14em] text-black/40">
                DHA License
              </dt>
              <dd className="font-['Geist',sans-serif] text-sm text-[#1c1c1c]">
                {doctor.dhaUniqueId}
              </dd>
            </div>
            {doctor.primaryFacilityName ? (
              <div>
                <dt className="font-['Geist',sans-serif] text-[11px] uppercase tracking-[0.14em] text-black/40">
                  Primary Facility
                </dt>
                <dd className="font-['Geist',sans-serif] text-sm text-[#1c1c1c]">
                  {doctor.primaryFacilityName}
                </dd>
              </div>
            ) : null}
          </dl>
        </div>
      </div>
    </section>
  );
}

function toTitleCase(s: string): string {
  return s
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
