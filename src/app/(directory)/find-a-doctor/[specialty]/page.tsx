/**
 * Specialty hub — /find-a-doctor/[specialty]
 *
 * Lists DHA-licensed doctors for a given specialty, paginated via `?page=`
 * for crawlability (SSR). Uses the new `professionals_index` table.
 * Graceful zero-state when the table is empty OR when the specialty has no
 * matching rows.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { DoctorInitialsAvatar } from "@/components/professionals/DoctorInitialsAvatar";
import {
  getProfessionalsIndexBySpecialty,
  getAllSpecialtySlugs,
  type ProfessionalIndexRecord,
} from "@/lib/professionals";
import { getSpecialtyBySlug } from "@/lib/constants/professionals";
import { specialtyHubSchema } from "@/lib/professionals-seo";
import { truncateTitle, truncateDescription } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

export const revalidate = 3600;

interface Props {
  params: { specialty: string };
  searchParams: { page?: string };
}

const PAGE_SIZE = 24;
const MAX_STATIC_SPECIALTIES = 50;

export async function generateStaticParams() {
  const slugs = await getAllSpecialtySlugs();
  return slugs.slice(0, MAX_STATIC_SPECIALTIES).map((s) => ({ specialty: s }));
}

function resolveSpecialtyName(specialtySlug: string): string {
  const constant = getSpecialtyBySlug(specialtySlug);
  if (constant) return constant.name;
  return specialtySlug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function toTitleCase(s: string): string {
  return s
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const base = getBaseUrl();
  const specialtyName = resolveSpecialtyName(params.specialty);
  const { total } = await getProfessionalsIndexBySpecialty(params.specialty, {
    limit: 1,
  });
  const year = new Date().getFullYear();
  const rawTitle = total > 0
    ? `${total}+ ${specialtyName} Doctors in UAE [${year}] | Zavis`
    : `${specialtyName} Doctors in the UAE | Zavis`;
  const rawDescription =
    total > 0
      ? `Browse ${total} DHA-licensed ${specialtyName} doctors in the UAE, sourced from the official Sheryan register. Facility, license type, and specialty details verified monthly.`
      : `${specialtyName} doctors in the UAE, sourced from the official DHA Sheryan register.`;

  const canonical = `${base}/find-a-doctor/${params.specialty}`;
  return {
    title: truncateTitle(rawTitle),
    description: truncateDescription(rawDescription),
    alternates: {
      canonical,
      languages: {
        "en-AE": canonical,
        "x-default": canonical,
      },
    },
    openGraph: {
      title: truncateTitle(rawTitle),
      description: truncateDescription(rawDescription),
      url: canonical,
      type: "website",
      siteName: "UAE Open Healthcare Directory by Zavis",
    },
  };
}

export default async function SpecialtyHubPage({ params, searchParams }: Props) {
  const base = getBaseUrl();
  const specialtyName = resolveSpecialtyName(params.specialty);
  const pageRaw = Number(searchParams?.page ?? "1");
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1;
  const offset = (page - 1) * PAGE_SIZE;

  const { total, professionals } = await getProfessionalsIndexBySpecialty(
    params.specialty,
    { limit: PAGE_SIZE, offset }
  );

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (total > 0 && page > totalPages) notFound();

  const canonical = `${base}/find-a-doctor/${params.specialty}`;
  const schemaNodes = specialtyHubSchema(
    params.specialty,
    specialtyName,
    total,
    professionals,
    {
      canonicalUrl: canonical,
      faqs: [
        {
          q: `How many ${specialtyName} doctors are on the DHA register?`,
          a: total > 0
            ? `The DHA Sheryan register currently lists ${total} active ${specialtyName} doctors practicing in Dubai.`
            : `The new Zavis professional index has not yet been populated for ${specialtyName}. This page will populate after the next DHA data refresh.`,
        },
        {
          q: `What is the difference between Specialist and Consultant for ${specialtyName}?`,
          a: `In the DHA classification, a Specialist has completed specialty training and holds a recognized specialist qualification, while a Consultant is a more senior grade requiring additional post-specialty experience. Both require DHA licensing.`,
        },
        {
          q: `Does Zavis book appointments with ${specialtyName} doctors?`,
          a: `No. Zavis is a public directory that indexes the DHA Sheryan register. To book an appointment, contact the facility directly.`,
        },
      ],
    }
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
      {schemaNodes.map((node, idx) => (
        <JsonLd key={idx} data={node} />
      ))}

      <Breadcrumb
        items={[
          { label: "Find a Doctor", href: "/find-a-doctor" },
          { label: specialtyName },
        ]}
      />

      <header className="rounded-2xl border border-black/[0.06] bg-white p-6 sm:p-8">
        <p className="font-['Geist',sans-serif] text-[11px] uppercase tracking-[0.14em] text-black/40">
          DHA Sheryan Register
        </p>
        <h1 className="mt-2 font-['Bricolage_Grotesque',sans-serif] text-[28px] sm:text-[34px] font-medium tracking-tight text-[#1c1c1c]">
          {specialtyName} Doctors in the UAE
        </h1>
        <p className="mt-3 font-['Geist',sans-serif] text-sm leading-relaxed text-black/70">
          {total > 0
            ? `${total} DHA-licensed ${specialtyName} doctors are indexed from the official Sheryan register. Each profile links to a facility listing when available, and emits DHA license details instead of fabricated trust signals.`
            : `No ${specialtyName} doctors are indexed yet. This page will populate after the next DHA data refresh.`}
          {" "}Zavis does not show fake insurance acceptance, availability, languages, or ratings. If a field is not in the DHA register, we don&rsquo;t invent one.
        </p>
      </header>

      {professionals.length > 0 ? (
        <>
          <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {professionals.map((d) => (
              <li key={d.id}>
                <DoctorCard doctor={d} />
              </li>
            ))}
          </ul>

          <Pagination
            basePath={`/find-a-doctor/${params.specialty}`}
            currentPage={page}
            totalPages={totalPages}
          />
        </>
      ) : (
        <EmptyState specialtyName={specialtyName} />
      )}

      {/* Cross-links */}
      <section className="mt-8 rounded-2xl border border-black/[0.06] bg-[#f8f8f6] p-6">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] text-[18px] font-medium tracking-tight text-[#1c1c1c]">
          Browse more of the directory
        </h2>
        <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <li>
            <Link
              href="/directory"
              className="font-['Geist',sans-serif] text-sm text-[#006828] hover:underline"
            >
              Facility-first directory (12,500+ providers)
            </Link>
          </li>
          <li>
            <Link
              href="/find-a-doctor"
              className="font-['Geist',sans-serif] text-sm text-[#006828] hover:underline"
            >
              All DHA-licensed professionals
            </Link>
          </li>
          {params.specialty === "general-dentist" ||
          params.specialty === "orthodontics" ||
          params.specialty === "endodontics" ||
          params.specialty === "prosthodontics" ||
          params.specialty === "pediatric-dentistry" ||
          params.specialty === "oral-maxillofacial-surgery" ? (
            <li>
              <Link
                href="/directory/dubai/dental-clinic"
                className="font-['Geist',sans-serif] text-sm text-[#006828] hover:underline"
              >
                See dental clinics in Dubai
              </Link>
            </li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}

// ─── UI helpers ──────────────────────────────────────────────────────────────

function DoctorCard({ doctor }: { doctor: ProfessionalIndexRecord }) {
  const titleCasedName = toTitleCase(doctor.name);
  return (
    <Link
      href={`/find-a-doctor/${doctor.specialtySlug}/${doctor.slug}`}
      className="flex items-center gap-3 rounded-2xl border border-black/[0.06] bg-white p-4 transition-colors hover:border-[#006828]/30 hover:bg-[#f8f8f6]"
    >
      <DoctorInitialsAvatar
        name={titleCasedName}
        dhaUniqueId={doctor.dhaUniqueId}
        sizePx={56}
      />
      <div className="min-w-0">
        <p className="font-['Bricolage_Grotesque',sans-serif] text-base font-medium text-[#1c1c1c]">
          Dr. {titleCasedName}
        </p>
        <p className="truncate font-['Geist',sans-serif] text-xs text-black/50">
          {doctor.specialty || doctor.specialtySlug}
          {doctor.primaryFacilityName ? ` · ${doctor.primaryFacilityName}` : ""}
        </p>
        <div className="mt-1 flex items-center gap-2">
          <span className="rounded-full bg-[#f1f5ee] px-2 py-0.5 font-['Geist',sans-serif] text-[10px] font-medium text-[#006828]">
            {doctor.licenseType === "FTL" ? "FTL" : "REG"}
          </span>
          <span className="font-['Geist',sans-serif] text-[10px] text-black/30">
            DHA #{doctor.dhaUniqueId}
          </span>
        </div>
      </div>
    </Link>
  );
}

function Pagination({
  basePath,
  currentPage,
  totalPages,
}: {
  basePath: string;
  currentPage: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;
  const prev = currentPage > 1 ? currentPage - 1 : null;
  const next = currentPage < totalPages ? currentPage + 1 : null;
  const hrefFor = (p: number) =>
    p === 1 ? basePath : `${basePath}?page=${p}`;
  return (
    <nav
      aria-label="Pagination"
      className="mt-8 flex items-center justify-between rounded-2xl border border-black/[0.06] bg-white p-4"
    >
      <div className="font-['Geist',sans-serif] text-xs text-black/50">
        Page {currentPage} of {totalPages}
      </div>
      <div className="flex items-center gap-2">
        {prev ? (
          <Link
            href={hrefFor(prev)}
            className="rounded-full border border-black/[0.06] px-3 py-1 font-['Geist',sans-serif] text-xs text-[#1c1c1c] hover:bg-[#f8f8f6]"
          >
            ← Previous
          </Link>
        ) : (
          <span className="rounded-full border border-black/[0.04] px-3 py-1 font-['Geist',sans-serif] text-xs text-black/30">
            ← Previous
          </span>
        )}
        {next ? (
          <Link
            href={hrefFor(next)}
            className="rounded-full border border-black/[0.06] px-3 py-1 font-['Geist',sans-serif] text-xs text-[#1c1c1c] hover:bg-[#f8f8f6]"
          >
            Next →
          </Link>
        ) : (
          <span className="rounded-full border border-black/[0.04] px-3 py-1 font-['Geist',sans-serif] text-xs text-black/30">
            Next →
          </span>
        )}
      </div>
    </nav>
  );
}

function EmptyState({ specialtyName }: { specialtyName: string }) {
  return (
    <div className="mt-6 rounded-2xl border border-dashed border-black/[0.12] bg-white p-8 text-center">
      <h2 className="font-['Bricolage_Grotesque',sans-serif] text-[18px] font-medium tracking-tight text-[#1c1c1c]">
        No {specialtyName} doctors indexed yet
      </h2>
      <p className="mt-2 font-['Geist',sans-serif] text-sm text-black/60">
        The Zavis professional index has not been populated for this specialty yet.
        Check back after the next DHA Sheryan data refresh, or browse the
        facility-first directory instead.
      </p>
      <Link
        href="/directory"
        className="mt-4 inline-flex items-center gap-1 font-['Geist',sans-serif] text-sm font-medium text-[#006828] hover:underline"
      >
        Browse the facility directory →
      </Link>
    </div>
  );
}
