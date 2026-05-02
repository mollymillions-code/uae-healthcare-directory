/**
 * Main render for /find-a-doctor/[specialty]/[doctor]-[id] profile pages.
 * Server component — composes hero, facts, related doctors, FAQ, disclaimer.
 */

import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { DoctorProfileHero } from "./DoctorProfileHero";
import { DoctorProfileFacts } from "./DoctorProfileFacts";
import { DoctorProfileFaq } from "./DoctorProfileFaq";
import { DoctorInitialsAvatar } from "./DoctorInitialsAvatar";
import type { ProfessionalIndexRecord } from "@/lib/professionals";
import { OwnerWhatsappCta } from "@/components/owner/OwnerWhatsappCta";

interface DoctorProfilePageProps {
  doctor: ProfessionalIndexRecord;
  relatedDoctors: ProfessionalIndexRecord[];
  facilityUrl?: string | null;
  cityName?: string | null;
}

function toTitleCase(s: string): string {
  return s
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function DoctorProfilePage({
  doctor,
  relatedDoctors,
  facilityUrl,
  cityName,
}: DoctorProfilePageProps) {
  const specialtyName = doctor.specialty || toTitleCase(doctor.specialtySlug.replace(/-/g, " "));
  const titleCasedName = toTitleCase(doctor.name);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
      <Breadcrumb
        items={[
          { label: "Find a Doctor", href: "/find-a-doctor" },
          {
            label: specialtyName,
            href: `/find-a-doctor/${doctor.specialtySlug}`,
          },
          { label: `Dr. ${titleCasedName}` },
        ]}
      />

      <DoctorProfileHero doctor={doctor} />

      <section className="mt-6 rounded-2xl border border-[#006828]/15 bg-white p-5 sm:flex sm:items-center sm:justify-between sm:gap-6">
        <div>
          <h2 className="font-['Bricolage_Grotesque',sans-serif] text-lg font-medium tracking-tight text-[#1c1c1c]">
            Need to update this doctor or clinic profile?
          </h2>
          <p className="mt-1 font-['Geist',sans-serif] text-sm text-black/45">
            Clinic owners and authorized teams can request edits through WhatsApp.
          </p>
        </div>
        <OwnerWhatsappCta
          action="edit"
          surface="doctor_profile_owner_cta"
          doctorName={`Dr. ${titleCasedName}`}
          doctorSlug={doctor.slug}
          providerName={doctor.primaryFacilityName}
          label="Request edit via WhatsApp"
          variant="secondary"
          className="mt-4 shrink-0 sm:mt-0"
        />
      </section>

      {/* Editorial intro */}
      <section className="mt-6 rounded-2xl border border-black/[0.06] bg-white p-6 sm:p-8">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] text-[20px] sm:text-[24px] font-medium tracking-tight text-[#1c1c1c]">
          About this listing
        </h2>
        <p className="mt-3 font-['Geist',sans-serif] text-sm leading-relaxed text-black/70">
          This profile for <strong>Dr. {titleCasedName}</strong> is generated
          from the publicly-available DHA Sheryan professional register.
          {doctor.primaryFacilityName
            ? ` According to the register, their primary facility is ${doctor.primaryFacilityName}${cityName ? ` in ${cityName}` : ""}.`
            : " No primary facility is listed in the register."}
          {" "}
          Zavis indexes this data to improve healthcare discoverability in the UAE and does not
          represent, endorse, or book appointments on behalf of any doctor.
          License status changes over time — always verify directly with DHA
          before making a clinical decision.
        </p>
      </section>

      <DoctorProfileFacts doctor={doctor} />

      {/* Facility card */}
      {doctor.primaryFacilityName ? (
        <section className="mt-6 rounded-2xl border border-black/[0.06] bg-white p-6 sm:p-8">
          <div className="mb-4 border-b-2 border-[#1c1c1c] pb-3">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] text-[20px] sm:text-[24px] font-medium tracking-tight text-[#1c1c1c]">
              Primary Facility
            </h2>
          </div>
          <p className="font-['Geist',sans-serif] text-sm text-[#1c1c1c]">
            {doctor.primaryFacilityName}
          </p>
          {facilityUrl ? (
            <Link
              href={facilityUrl}
              className="mt-3 inline-flex items-center gap-1 font-['Geist',sans-serif] text-sm font-medium text-[#006828] hover:underline"
            >
              View facility details →
            </Link>
          ) : (
            <p className="mt-2 font-['Geist',sans-serif] text-xs text-black/40">
              This facility is not yet matched to a Zavis listing.
            </p>
          )}
        </section>
      ) : null}

      {/* Related doctors */}
      {relatedDoctors.length > 0 ? (
        <section className="mt-6 rounded-2xl border border-black/[0.06] bg-white p-6 sm:p-8">
          <div className="mb-4 border-b-2 border-[#1c1c1c] pb-3">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] text-[20px] sm:text-[24px] font-medium tracking-tight text-[#1c1c1c]">
              Other {specialtyName} doctors
              {cityName ? ` in ${cityName}` : " on the DHA register"}
            </h2>
          </div>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {relatedDoctors.map((rd) => {
              const rdNameTitle = toTitleCase(rd.name);
              return (
                <li key={rd.id}>
                  <Link
                    href={`/find-a-doctor/${rd.specialtySlug}/${rd.slug}`}
                    className="flex items-center gap-3 rounded-xl border border-black/[0.06] p-3 transition-colors hover:border-[#006828]/30 hover:bg-[#f8f8f6]"
                  >
                    <DoctorInitialsAvatar
                      name={rdNameTitle}
                      dhaUniqueId={rd.dhaUniqueId}
                      sizePx={44}
                    />
                    <div className="min-w-0">
                      <p className="truncate font-['Bricolage_Grotesque',sans-serif] text-sm font-medium text-[#1c1c1c]">
                        Dr. {rdNameTitle}
                      </p>
                      <p className="truncate font-['Geist',sans-serif] text-xs text-black/50">
                        {rd.primaryFacilityName || "DHA-licensed · Dubai"}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <DoctorProfileFaq doctor={doctor} cityName={cityName} />

      {/* Disclaimer */}
      <section className="mt-6 rounded-2xl border border-black/[0.06] bg-[#f8f8f6] p-6">
        <p className="font-['Geist',sans-serif] text-xs leading-relaxed text-black/60">
          <strong>Disclaimer.</strong> Data sourced from the DHA official
          register. Zavis indexes publicly-available professional licensing
          data and does not represent or endorse any doctor. This page does
          not display patient reviews, availability, insurance acceptance, or
          languages spoken — those fields are not present in the DHA source
          dataset and we refuse to invent them.{" "}
          <a
            href="https://sheryan.dha.gov.ae/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#006828] underline hover:no-underline"
          >
            Verify this license on the DHA Sheryan portal
          </a>
          .
        </p>
      </section>
    </div>
  );
}
