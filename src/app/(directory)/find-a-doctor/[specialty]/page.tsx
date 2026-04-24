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
import { ChevronRight, Sparkles, ArrowRight } from "lucide-react";
import { JsonLd } from "@/components/seo/JsonLd";
import { FaqSection } from "@/components/seo/FaqSection";
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
import { safe } from "@/lib/safeData";

export const revalidate = 3600;

interface Props {
  params: { specialty: string };
  searchParams: { page?: string };
}

const PAGE_SIZE = 24;
const MAX_STATIC_SPECIALTIES = 50;

export async function generateStaticParams() {
  if (process.env.PREBUILD_STATIC_ROUTES !== "1") return [];
  const slugs = await safe(
    getAllSpecialtySlugs(),
    [] as string[],
    "specialty:generateStaticParams",
  );
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
  const { total } = await safe(
    getProfessionalsIndexBySpecialty(params.specialty, { limit: 1 }),
    { total: 0, professionals: [] as ProfessionalIndexRecord[] },
    "specialty:metadataCount",
  );
  const year = new Date().getFullYear();
  const rawTitle =
    total > 0
      ? `${total}+ ${specialtyName} Doctors in Dubai [${year}] | Zavis`
      : `${specialtyName} Doctors in Dubai | Zavis`;
  const rawDescription =
    total > 0
      ? `Browse ${total} DHA-licensed ${specialtyName} doctors in Dubai, sourced from the official Sheryan register. Facility, license type, and specialty details verified monthly.`
      : `${specialtyName} doctors in Dubai, sourced from the official DHA Sheryan register.`;

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

  const { total, professionals } = await safe(
    getProfessionalsIndexBySpecialty(params.specialty, {
      limit: PAGE_SIZE,
      offset,
    }),
    { total: 0, professionals: [] as ProfessionalIndexRecord[] },
    "specialty:list",
  );

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (total > 0 && page > totalPages) notFound();

  const canonical = `${base}/find-a-doctor/${params.specialty}`;
  const faqs = [
    {
      question: `How many ${specialtyName} doctors are on the DHA register?`,
      answer:
        total > 0
          ? `The DHA Sheryan register currently lists ${total} active ${specialtyName} doctors practicing in Dubai.`
          : `The Zavis professional index has not yet been populated for ${specialtyName}. This page will populate after the next DHA data refresh.`,
    },
    {
      question: `What is the difference between Specialist and Consultant for ${specialtyName}?`,
      answer: `In the DHA classification, a Specialist has completed specialty training and holds a recognized specialist qualification, while a Consultant is a more senior grade requiring additional post-specialty experience. Both require DHA licensing.`,
    },
    {
      question: `Does Zavis book appointments with ${specialtyName} doctors?`,
      answer: `No. Zavis is a public directory that indexes the DHA Sheryan register. To book an appointment, contact the facility directly.`,
    },
  ];

  const schemaNodes = specialtyHubSchema(
    params.specialty,
    specialtyName,
    total,
    professionals,
    {
      canonicalUrl: canonical,
      faqs: faqs.map((f) => ({ q: f.question, a: f.answer })),
    },
  );

  const breadcrumbs: { label: string; href?: string }[] = [
    { label: "UAE", href: "/" },
    { label: "Find a Doctor", href: "/find-a-doctor" },
    { label: specialtyName },
  ];

  const isDentalLike =
    params.specialty === "general-dentist" ||
    params.specialty === "orthodontics" ||
    params.specialty === "endodontics" ||
    params.specialty === "prosthodontics" ||
    params.specialty === "pediatric-dentistry" ||
    params.specialty === "oral-maxillofacial-surgery";

  return (
    <>
      {schemaNodes.map((node, idx) => (
        <JsonLd key={idx} data={node} />
      ))}

      {/* Hero */}
      <section className="relative overflow-hidden bg-surface-cream">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 -right-40 h-[460px] w-[460px] rounded-full bg-[radial-gradient(closest-side,rgba(0,200,83,0.16),transparent_70%)]" />
          <div className="absolute -top-20 -left-32 h-[360px] w-[360px] rounded-full bg-[radial-gradient(closest-side,rgba(255,176,120,0.22),transparent_70%)]" />
        </div>

        <div className="relative max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-10">
          <nav
            className="font-sans text-z-body-sm text-ink-muted flex items-center gap-1.5 mb-5 flex-wrap"
            aria-label="Breadcrumb"
          >
            {breadcrumbs.map((b, i) => {
              const isLast = i === breadcrumbs.length - 1;
              return (
                <span key={i} className="inline-flex items-center gap-1.5">
                  {b.href && !isLast ? (
                    <Link href={b.href} className="hover:text-ink transition-colors">
                      {b.label}
                    </Link>
                  ) : (
                    <span className={isLast ? "text-ink font-medium" : undefined}>
                      {b.label}
                    </span>
                  )}
                  {!isLast && <ChevronRight className="h-3.5 w-3.5" />}
                </span>
              );
            })}
          </nav>

          <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-3 inline-flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            DHA Sheryan register
          </p>
          <h1 className="font-display font-semibold text-ink text-display-lg lg:text-[56px] leading-[1.02] tracking-[-0.028em]">
            {specialtyName} Doctors in the UAE
          </h1>
          <p className="font-sans text-z-body sm:text-[17px] text-ink-soft mt-4 max-w-3xl leading-relaxed">
            {total > 0
              ? `${total} DHA-licensed ${specialtyName} doctors are indexed from the official Sheryan register.`
              : `No ${specialtyName} doctors are indexed yet. This page will populate after the next DHA data refresh.`}
          </p>

          <div className="mt-8 answer-block rounded-z-md bg-white border border-ink-line p-5 sm:p-6 max-w-4xl" data-answer-block="true">
            <p className="font-sans text-z-body-sm text-ink-soft leading-[1.75]">
              {total > 0
                ? `Every profile below links to a facility listing when available and surfaces DHA license details rather than fabricated trust signals.`
                : `This page will populate after the next DHA data refresh. In the meantime, browse the facility-first directory below.`}
              {" "}
              Zavis does not show fake insurance acceptance, availability,
              languages, or ratings. If a field is not in the DHA register, we
              don&rsquo;t invent one.
            </p>
          </div>
        </div>
      </section>

      {/* Doctor list */}
      <div className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-14">
        {professionals.length > 0 ? (
          <section>
            <header className="mb-6">
              <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-2">
                Licensed specialists
              </p>
              <h2 className="font-display font-semibold text-ink text-display-md tracking-[-0.018em]">
                {specialtyName} doctors on the DHA register.
              </h2>
            </header>
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
          </section>
        ) : (
          <EmptyState specialtyName={specialtyName} />
        )}

        {/* Cross-links */}
        <section>
          <header className="mb-6">
            <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-2">
              Keep browsing
            </p>
            <h2 className="font-display font-semibold text-ink text-display-md tracking-[-0.018em]">
              Browse more of the directory.
            </h2>
          </header>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <li>
              <Link
                href="/directory"
                className="group flex items-start gap-3 rounded-z-md bg-white border border-ink-line p-5 hover:border-ink hover:shadow-z-card transition-all duration-z-base"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-sans font-semibold text-ink text-z-body leading-tight group-hover:underline decoration-1 underline-offset-2">
                    Facility-first directory
                  </p>
                  <p className="font-sans text-z-caption text-ink-muted mt-0.5">
                    12,500+ providers across the UAE
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-ink-muted group-hover:translate-x-0.5 transition-transform flex-shrink-0 mt-1" />
              </Link>
            </li>
            <li>
              <Link
                href="/find-a-doctor"
                className="group flex items-start gap-3 rounded-z-md bg-white border border-ink-line p-5 hover:border-ink hover:shadow-z-card transition-all duration-z-base"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-sans font-semibold text-ink text-z-body leading-tight group-hover:underline decoration-1 underline-offset-2">
                    All DHA-licensed professionals
                  </p>
                  <p className="font-sans text-z-caption text-ink-muted mt-0.5">
                    Physicians, dentists, nurses, allied health
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-ink-muted group-hover:translate-x-0.5 transition-transform flex-shrink-0 mt-1" />
              </Link>
            </li>
            {isDentalLike && (
              <li>
                <Link
                  href="/directory/dubai/dental-clinic"
                  className="group flex items-start gap-3 rounded-z-md bg-white border border-ink-line p-5 hover:border-ink hover:shadow-z-card transition-all duration-z-base"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-sans font-semibold text-ink text-z-body leading-tight group-hover:underline decoration-1 underline-offset-2">
                      Dental clinics in Dubai
                    </p>
                    <p className="font-sans text-z-caption text-ink-muted mt-0.5">
                      Browse clinics that employ {specialtyName.toLowerCase()} doctors
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-ink-muted group-hover:translate-x-0.5 transition-transform flex-shrink-0 mt-1" />
                </Link>
              </li>
            )}
          </ul>
        </section>

        {/* FAQ */}
        <section>
          <header className="mb-6">
            <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-2">
              Questions
            </p>
            <h2 className="font-display font-semibold text-ink text-display-md tracking-[-0.018em]">
              About {specialtyName} care in Dubai.
            </h2>
          </header>
          <div className="max-w-3xl">
            <FaqSection faqs={faqs} />
          </div>
        </section>
      </div>
    </>
  );
}

// ─── UI helpers ──────────────────────────────────────────────────────────────

function DoctorCard({ doctor }: { doctor: ProfessionalIndexRecord }) {
  const titleCasedName = toTitleCase(doctor.name);
  return (
    <Link
      href={`/find-a-doctor/${doctor.specialtySlug}/${doctor.slug}`}
      className="group flex items-center gap-4 rounded-z-md bg-white border border-ink-line p-5 hover:border-ink hover:shadow-z-card transition-all duration-z-base"
    >
      <DoctorInitialsAvatar
        name={titleCasedName}
        dhaUniqueId={doctor.dhaUniqueId}
        sizePx={56}
      />
      <div className="min-w-0 flex-1">
        <p className="font-sans font-semibold text-ink text-z-body leading-tight group-hover:underline decoration-1 underline-offset-2">
          Dr. {titleCasedName}
        </p>
        <p className="truncate font-sans text-z-caption text-ink-muted mt-0.5">
          {doctor.specialty || doctor.specialtySlug}
          {doctor.primaryFacilityName ? ` · ${doctor.primaryFacilityName}` : ""}
        </p>
        <div className="mt-2 flex items-center gap-2">
          <span className="rounded-z-pill bg-accent-muted px-2 py-0.5 font-sans text-z-micro font-medium text-accent-dark">
            {doctor.licenseType === "FTL" ? "FTL" : "REG"}
          </span>
          <span className="font-sans text-z-micro text-ink-muted">
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
  const hrefFor = (p: number) => (p === 1 ? basePath : `${basePath}?page=${p}`);
  return (
    <nav
      aria-label="Pagination"
      className="mt-8 flex items-center justify-between rounded-z-md bg-white border border-ink-line p-4"
    >
      <div className="font-sans text-z-caption text-ink-muted">
        Page {currentPage} of {totalPages}
      </div>
      <div className="flex items-center gap-2">
        {prev ? (
          <Link
            href={hrefFor(prev)}
            className="rounded-z-pill border border-ink-hairline px-3 py-1 font-sans text-z-caption text-ink hover:border-ink transition-colors"
          >
            ← Previous
          </Link>
        ) : (
          <span className="rounded-z-pill border border-ink-hairline px-3 py-1 font-sans text-z-caption text-ink-muted opacity-50">
            ← Previous
          </span>
        )}
        {next ? (
          <Link
            href={hrefFor(next)}
            className="rounded-z-pill border border-ink-hairline px-3 py-1 font-sans text-z-caption text-ink hover:border-ink transition-colors"
          >
            Next →
          </Link>
        ) : (
          <span className="rounded-z-pill border border-ink-hairline px-3 py-1 font-sans text-z-caption text-ink-muted opacity-50">
            Next →
          </span>
        )}
      </div>
    </nav>
  );
}

function EmptyState({ specialtyName }: { specialtyName: string }) {
  return (
    <div className="rounded-z-md border border-dashed border-ink-line bg-white p-8 text-center">
      <h2 className="font-display font-semibold text-ink text-z-h2">
        No {specialtyName} doctors indexed yet
      </h2>
      <p className="mt-2 font-sans text-z-body-sm text-ink-muted max-w-xl mx-auto leading-relaxed">
        The Zavis professional index has not been populated for this specialty
        yet. Check back after the next DHA Sheryan data refresh, or browse the
        facility-first directory instead.
      </p>
      <Link
        href="/directory"
        className="mt-5 inline-flex items-center gap-1.5 font-sans text-z-body-sm font-medium text-accent-dark hover:underline"
      >
        Browse the facility directory →
      </Link>
    </div>
  );
}
