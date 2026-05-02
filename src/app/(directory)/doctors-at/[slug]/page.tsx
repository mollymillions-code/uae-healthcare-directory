import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight, ChevronRight, Sparkles } from "lucide-react";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  getProfessionalsByFacility,
  getFacilityProfile,
  getAllFacilities,
} from "@/lib/professionals";
import { ALL_SPECIALTIES, PROFESSIONAL_STATS } from "@/lib/constants/professionals";
import { breadcrumbSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

export const revalidate = 43200;
export const dynamicParams = true;

interface Props {
  params: { slug: string };
}

const DOCTOR_CATEGORIES = new Set(["physicians", "dentists"]);

export function generateStaticParams() {
  if (process.env.PREBUILD_STATIC_ROUTES !== "1") return [];
  return getAllFacilities(5)
    .slice(0, 50)
    .map((f) => ({ slug: f.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const profile = getFacilityProfile(params.slug);
  if (!profile) {
    return {
      title: "Doctors at Healthcare Facility, Dubai",
      description:
        "Find doctors at this healthcare facility in Dubai. Licensed physicians and dentists sourced from the DHA Sheryan Medical Registry.",
    };
  }

  const allProfessionals = getProfessionalsByFacility(params.slug);
  const doctorCount = allProfessionals.filter((p) =>
    DOCTOR_CATEGORIES.has(p.categorySlug),
  ).length;
  const base = getBaseUrl();

  return {
    title: `Doctors at ${profile.name}, Dubai — ${doctorCount.toLocaleString()} Licensed Professionals`,
    description: `Find ${doctorCount.toLocaleString()} licensed doctors at ${profile.name} in Dubai. Browse physicians and dentists by specialty and license type. All data sourced from the DHA Sheryan Medical Registry.`,
    alternates: { canonical: `${base}/doctors-at/${profile.slug}` },
    keywords: [
      `doctors at ${profile.name}`,
      `${profile.name} doctors list`,
      `${profile.name} staff`,
      `${profile.name} physicians`,
      `${profile.name} specialists`,
    ],
    openGraph: {
      title: `Doctors at ${profile.name}, Dubai — ${doctorCount.toLocaleString()} Licensed Professionals`,
      description: `${doctorCount.toLocaleString()} licensed doctors practicing at ${profile.name}. Browse by specialty, license type, and seniority level.`,
      url: `${base}/doctors-at/${profile.slug}`,
      type: "website",
      siteName: "UAE Open Healthcare Directory",
    },
  };
}

export default function DoctorsAtPage({ params }: Props) {
  const profile = getFacilityProfile(params.slug);
  if (!profile) notFound();

  const allProfessionals = getProfessionalsByFacility(params.slug);
  if (allProfessionals.length === 0) notFound();

  const base = getBaseUrl();

  const doctors = allProfessionals.filter((p) => DOCTOR_CATEGORIES.has(p.categorySlug));
  const physicianCount = allProfessionals.filter(
    (p) => p.categorySlug === "physicians",
  ).length;
  const dentistCount = allProfessionals.filter(
    (p) => p.categorySlug === "dentists",
  ).length;

  const specCounts: Record<string, number> = {};
  for (const d of doctors) {
    if (d.specialtySlug) {
      specCounts[d.specialtySlug] = (specCounts[d.specialtySlug] || 0) + 1;
    }
  }
  const doctorSpecialties = Object.entries(specCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([slug, count]) => {
      const spec = ALL_SPECIALTIES.find((s) => s.slug === slug);
      return { slug, name: spec?.name || slug, count };
    });

  const sortedDoctors = [...doctors].sort((a, b) => a.name.localeCompare(b.name));
  const displayLimit = 100;
  const displayDoctors = sortedDoctors.slice(0, displayLimit);

  const breadcrumbs = [
    { label: "UAE", href: "/" },
    { label: "Directory", href: "/directory" },
    { label: `Doctors at ${profile.name}` },
  ];

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "UAE", url: base },
          { name: "Directory", url: `${base}/directory` },
          { name: `Doctors at ${profile.name}` },
        ])}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "MedicalBusiness",
          name: profile.name,
          url: `${base}/doctors-at/${profile.slug}`,
          numberOfEmployees: {
            "@type": "QuantitativeValue",
            value: doctors.length,
            unitText: "doctors",
          },
          description: `${profile.name} has ${doctors.length.toLocaleString()} licensed doctors (physicians and dentists) practicing in Dubai.`,
          employee: displayDoctors.slice(0, 20).map((d) => ({
            "@type": "Physician",
            name: d.name,
            medicalSpecialty: d.specialty || undefined,
            hasCredential: {
              "@type": "EducationalOccupationalCredential",
              credentialCategory: `DHA ${d.licenseType}`,
            },
          })),
          areaServed: {
            "@type": "City",
            name: "Dubai",
            addressCountry: "AE",
          },
        }}
      />

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

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-8">
              <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-3 inline-flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                DHA Sheryan register
              </p>
              <h1 className="font-display font-semibold text-ink text-display-lg lg:text-[56px] leading-[1.02] tracking-[-0.028em]">
                Doctors at {profile.name}
              </h1>
              <p className="font-sans text-z-body sm:text-[17px] text-ink-soft mt-4 max-w-2xl leading-relaxed">
                {doctors.length.toLocaleString()} licensed doctors · Dubai
              </p>
            </div>

            <div className="lg:col-span-4 grid grid-cols-2 gap-3">
              {[
                { n: doctors.length.toLocaleString(), l: "Licensed doctors" },
                { n: physicianCount.toLocaleString(), l: "Physicians" },
                { n: dentistCount.toLocaleString(), l: "Dentists" },
                { n: doctorSpecialties.length.toString(), l: "Specialties" },
              ].map((s) => (
                <div
                  key={s.l}
                  className="rounded-z-md bg-white border border-ink-line px-4 py-3"
                >
                  <p className="font-display font-semibold text-ink text-z-h1 leading-none">
                    {s.n}
                  </p>
                  <p className="font-sans text-z-caption text-ink-muted mt-1">{s.l}</p>
                </div>
              ))}
            </div>
          </div>

          <div
            className="mt-8 answer-block rounded-z-md bg-white border border-ink-line p-5 sm:p-6 max-w-4xl"
            data-answer-block="true"
          >
            <p className="font-sans text-z-body-sm text-ink-soft leading-[1.75]">
              {profile.name} has{" "}
              <strong className="text-ink">
                {doctors.length.toLocaleString()}
              </strong>{" "}
              licensed doctors (physicians and dentists) on record with the
              Dubai Health Authority.
              {physicianCount > 0 && (
                <> This includes {physicianCount.toLocaleString()} physicians</>
              )}
              {dentistCount > 0 && <> and {dentistCount.toLocaleString()} dentists</>}
              {doctorSpecialties.length > 0 && (
                <> across {doctorSpecialties.length} specialties</>
              )}
              . The facility has {profile.totalStaff.toLocaleString()} total
              licensed staff including nurses and allied health professionals.
              Data sourced from the official DHA Sheryan Medical Professional
              Registry ({PROFESSIONAL_STATS.scraped}).
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-14">
        {/* Doctors by Specialty */}
        {doctorSpecialties.length > 0 && (
          <section>
            <header className="mb-6">
              <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-2">
                Browse by specialty
              </p>
              <h2 className="font-display font-semibold text-ink text-display-md tracking-[-0.018em]">
                Doctors by specialty.
              </h2>
            </header>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {doctorSpecialties.map((spec) => {
                const fullSpec = ALL_SPECIALTIES.find((s) => s.slug === spec.slug);
                const catSlug = fullSpec?.category || "physicians";
                return (
                  <Link
                    key={spec.slug}
                    href={`/professionals/facility/${profile.slug}/${spec.slug}`}
                    className="group flex flex-col rounded-z-md bg-white border border-ink-line p-5 hover:border-ink hover:shadow-z-card transition-all duration-z-base"
                  >
                    <p className="font-sans font-semibold text-ink text-z-body leading-tight group-hover:underline decoration-1 underline-offset-2">
                      {spec.name}
                    </p>
                    <p className="font-sans text-z-caption text-ink-muted mt-1">
                      {spec.count} doctor{spec.count !== 1 ? "s" : ""}
                    </p>
                    <span className="mt-3 inline-flex w-fit items-center rounded-z-pill bg-accent-muted px-2.5 py-0.5 font-sans text-z-micro font-medium text-accent-dark">
                      {catSlug === "dentists" ? "Dental" : "Medical"}
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Doctor Listing Table */}
        <section>
          <header className="mb-6">
            <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-2">
              Full roster
            </p>
            <h2 className="font-display font-semibold text-ink text-display-md tracking-[-0.018em]">
              Doctor directory — A–Z.
            </h2>
            <p className="font-sans text-z-body-sm text-ink-muted mt-2">
              Showing {displayLimit < doctors.length ? `first ${displayLimit} of ` : ""}
              {doctors.length.toLocaleString()} licensed doctors at {profile.name},
              sorted alphabetically.
            </p>
          </header>

          <div className="rounded-z-md bg-white border border-ink-line overflow-x-auto">
            <table className="w-full font-sans text-z-body-sm">
              <thead>
                <tr className="border-b border-ink-line text-ink-soft text-z-caption uppercase tracking-[0.04em]">
                  <th className="px-4 py-3 text-left font-medium">Name</th>
                  <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">
                    Specialty
                  </th>
                  <th className="px-4 py-3 text-left font-medium">License</th>
                </tr>
              </thead>
              <tbody>
                {displayDoctors.map((doc) => (
                  <tr
                    key={doc.id}
                    className="border-b border-ink-hairline last:border-b-0"
                  >
                    <td className="px-4 py-3 text-ink font-medium">{doc.name}</td>
                    <td className="px-4 py-3 text-ink-soft hidden sm:table-cell">
                      {doc.specialty || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-z-pill bg-accent-muted px-2 py-0.5 font-sans text-z-micro font-medium text-accent-dark">
                        {doc.licenseType}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {doctors.length > displayLimit && (
            <p className="font-sans text-z-caption text-ink-muted mt-3">
              Showing {displayLimit} of {doctors.length.toLocaleString()} doctors.
              View the full staff directory for all professionals including
              nurses and allied health.
            </p>
          )}
        </section>

        {/* Top Specialties breakdown */}
        {doctorSpecialties.length > 0 && (
          <section>
            <header className="mb-6">
              <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-2">
                Distribution
              </p>
              <h2 className="font-display font-semibold text-ink text-display-md tracking-[-0.018em]">
                Most common doctor specialties.
              </h2>
            </header>
            <div className="rounded-z-md bg-white border border-ink-line overflow-x-auto">
              <table className="w-full font-sans text-z-body-sm">
                <thead>
                  <tr className="border-b border-ink-line text-ink-soft text-z-caption uppercase tracking-[0.04em]">
                    <th className="px-4 py-3 text-left font-medium w-10">#</th>
                    <th className="px-4 py-3 text-left font-medium">Specialty</th>
                    <th className="px-4 py-3 text-right font-medium">Doctors</th>
                    <th className="px-4 py-3 text-right font-medium">
                      % of doctors
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {doctorSpecialties.slice(0, 15).map((spec, i) => {
                    const pct =
                      doctors.length > 0
                        ? ((spec.count / doctors.length) * 100).toFixed(1)
                        : "0";
                    return (
                      <tr
                        key={spec.slug}
                        className="border-b border-ink-hairline last:border-b-0"
                      >
                        <td className="px-4 py-3 text-ink-muted">{i + 1}</td>
                        <td className="px-4 py-3 text-ink font-medium">
                          {spec.name}
                        </td>
                        <td className="px-4 py-3 text-right text-ink font-medium">
                          {spec.count}
                        </td>
                        <td className="px-4 py-3 text-right text-ink-muted">
                          {pct}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Cross-links */}
        <section>
          <header className="mb-6">
            <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-2">
              Keep browsing
            </p>
            <h2 className="font-display font-semibold text-ink text-display-md tracking-[-0.018em]">
              Related pages.
            </h2>
          </header>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <li>
              <Link
                href={`/professionals/facility/${profile.slug}`}
                className="group flex items-start gap-3 rounded-z-md bg-white border border-ink-line p-5 hover:border-ink hover:shadow-z-card transition-all duration-z-base"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-sans font-semibold text-ink text-z-body leading-tight group-hover:underline decoration-1 underline-offset-2">
                    Full staff directory at {profile.name}
                  </p>
                  <p className="font-sans text-z-caption text-ink-muted mt-0.5">
                    {profile.totalStaff.toLocaleString()} total staff including
                    nurses and allied health
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-ink-muted group-hover:translate-x-0.5 transition-transform shrink-0 mt-1" />
              </Link>
            </li>
            <li>
              <Link
                href={`/directory/dubai?q=${encodeURIComponent(profile.name)}`}
                className="group flex items-start gap-3 rounded-z-md bg-white border border-ink-line p-5 hover:border-ink hover:shadow-z-card transition-all duration-z-base"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-sans font-semibold text-ink text-z-body leading-tight group-hover:underline decoration-1 underline-offset-2">
                    Search {profile.name} in the directory
                  </p>
                  <p className="font-sans text-z-caption text-ink-muted mt-0.5">
                    Find branches, hours, and contact details
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-ink-muted group-hover:translate-x-0.5 transition-transform shrink-0 mt-1" />
              </Link>
            </li>
            <li>
              <Link
                href="/professionals"
                className="group flex items-start gap-3 rounded-z-md bg-white border border-ink-line p-5 hover:border-ink hover:shadow-z-card transition-all duration-z-base"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-sans font-semibold text-ink text-z-body leading-tight group-hover:underline decoration-1 underline-offset-2">
                    All healthcare professionals in Dubai
                  </p>
                  <p className="font-sans text-z-caption text-ink-muted mt-0.5">
                    {PROFESSIONAL_STATS.total.toLocaleString()} licensed
                    professionals on the DHA register
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-ink-muted group-hover:translate-x-0.5 transition-transform shrink-0 mt-1" />
              </Link>
            </li>
          </ul>
        </section>

        <div className="rounded-z-md bg-white border border-ink-line p-6 max-w-3xl">
          <p className="font-sans text-z-caption text-ink-muted leading-relaxed">
            <strong className="text-ink-soft">Source.</strong> Dubai Health
            Authority (DHA) Sheryan Medical Professional Registry. Data scraped{" "}
            {PROFESSIONAL_STATS.scraped}. This directory is for informational
            purposes only and does not constitute medical advice. Verify
            professional credentials directly with DHA before making healthcare
            decisions.
          </p>
        </div>
      </div>
    </>
  );
}
