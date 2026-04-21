import Link from "next/link";
import { ChevronRight, ShieldCheck, Clock, Activity, ArrowRight, Info } from "lucide-react";
import { FaqSection } from "@/components/seo/FaqSection";
import { ProviderCardV2 } from "../cards/ProviderCardV2";
import { EmptyStateV2 } from "../shared/EmptyStateV2";

export interface ProcedurePricingBreadcrumb {
  label: string;
  href?: string;
}

export interface ProcedurePricingProvider {
  id: string;
  name: string;
  slug: string;
  citySlug: string;
  categorySlug: string;
  categoryName?: string | null;
  address?: string | null;
  googleRating?: string | null;
  googleReviewCount?: number | null;
  isClaimed?: boolean | null;
  isVerified?: boolean | null;
  photos?: string[] | null;
  coverImageUrl?: string | null;
}

export interface ProcedurePricingCityRow {
  slug: string;
  name: string;
  min: number;
  max: number;
  typical: number;
  isCurrent: boolean;
  href?: string;
}

export interface ProcedurePricingRelatedProcedure {
  slug: string;
  name: string;
  href: string;
  duration?: string | null;
  typicalPrice?: string | null;
}

export interface ProcedurePricingPrice {
  min: number;
  max: number;
  typical: number;
}

interface ProcedurePricingTemplateProps {
  /** Breadcrumb — typically: UAE → City → Procedure. */
  breadcrumbs: ProcedurePricingBreadcrumb[];
  /** Small eyebrow label (regulator badge, e.g. "DHA Verified · Dubai"). */
  eyebrow?: React.ReactNode;
  /** H1 — e.g. "LASIK in Dubai". */
  title: string;
  /** Subhead / meta line (providers · duration · coverage · typical cost). */
  subtitle?: React.ReactNode;
  /** AEO answer block content. */
  aeoAnswer?: React.ReactNode;
  /** The city we're viewing. */
  cityName: string;
  /** Regulator short name (DHA / DOH / MOHAP). */
  regulatorShort: string;
  /** Regulator full name for schema/copy. */
  regulatorFull: string;
  /** Procedure name. */
  procedureName: string;
  /** Category slug (to link back to category hub). */
  categorySlug: string;
  /** Category display name. */
  categoryName: string;
  /** Duration copy. */
  duration?: string | null;
  /** Recovery copy. */
  recoveryTime?: string | null;
  /** Anaesthesia label. */
  anaesthesia?: string | null;
  /** Coverage label (e.g. "Typically covered"). */
  coverageLabel: string;
  /** Coverage notes — free copy. */
  coverageNotes?: React.ReactNode;
  /** Current-city pricing. Optional — omit if no pricing for this city. */
  pricing?: ProcedurePricingPrice | null;
  /** Rows for the city-comparison table. Must include the current city flagged. */
  cityComparison: ProcedurePricingCityRow[];
  /** Providers in this category+city. */
  providers: ProcedurePricingProvider[];
  /** Total provider count (for "view all" link). */
  providerTotal: number;
  /** Href for "view all providers" link. */
  viewAllProvidersHref: string;
  /** Related procedures (within/outside category) — rendered as a chip row. */
  relatedProcedures: ProcedurePricingRelatedProcedure[];
  /** "More in same category" chip row. */
  sameCategoryProcedures?: ProcedurePricingRelatedProcedure[];
  /** FAQ list. */
  faqs?: Array<{ question: string; answer: string }>;
  /** JSON-LD schemas — passed straight through. */
  schemas?: React.ReactNode;
  /** Hreflang Arabic counterpart. */
  arabicHref?: string | null;
  /** What-to-expect copy. */
  whatToExpect?: React.ReactNode;
  /** Optional cross-link chips (pricing detail, best-of, category). */
  crossLinks?: Array<{ label: string; href: string }>;
  /** Formatter for AED values. Defaults to en-US. */
  formatAed?: (n: number) => string;
  /** Last-verified copy (e.g. "March 2026"). */
  lastVerified?: string;
}

const defaultFormatAed = (n: number) => `AED ${n.toLocaleString("en-US")}`;

/**
 * Server-rendered template for city-scoped procedure-pricing pages
 * (e.g. /directory/dubai/lasik, /directory/abu-dhabi/ivf).
 *
 * Renders: breadcrumb → hero with eyebrow, H1, subtitle, regulator badge →
 * AEO answer block → pricing card (min/typical/max big numbers) → city
 * comparison table → providers grid → related procedures chips → FAQ.
 */
export function ProcedurePricingTemplate({
  breadcrumbs,
  eyebrow,
  title,
  subtitle,
  aeoAnswer,
  cityName,
  regulatorShort,
  regulatorFull,
  procedureName,
  // categorySlug accepted for template API parity; not read directly here.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  categorySlug: _unusedCategorySlug,
  categoryName,
  duration,
  recoveryTime,
  anaesthesia,
  coverageLabel,
  coverageNotes,
  pricing,
  cityComparison,
  providers,
  providerTotal,
  viewAllProvidersHref,
  relatedProcedures,
  sameCategoryProcedures,
  faqs,
  schemas,
  arabicHref,
  whatToExpect,
  crossLinks,
  formatAed = defaultFormatAed,
  lastVerified,
}: ProcedurePricingTemplateProps) {
  return (
    <>
      {schemas}

      {/* Hero */}
      <section className="relative overflow-hidden bg-surface-cream">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 -right-24 h-[380px] w-[380px] rounded-full bg-[radial-gradient(closest-side,rgba(0,200,83,0.18),transparent_70%)]" />
          <div className="absolute -top-16 -left-24 h-[320px] w-[320px] rounded-full bg-[radial-gradient(closest-side,rgba(255,176,120,0.22),transparent_70%)]" />
        </div>

        <div className="relative max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-6 sm:pb-10">
          {/* Breadcrumb */}
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
                    <span className={isLast ? "text-ink font-medium" : undefined}>{b.label}</span>
                  )}
                  {!isLast && <ChevronRight className="h-3.5 w-3.5" />}
                </span>
              );
            })}
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-8">
              {eyebrow && (
                <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-3 inline-flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2.5} />
                  {eyebrow}
                </p>
              )}
              <h1 className="font-display font-semibold text-ink text-display-lg lg:text-[52px] leading-[1.04] tracking-[-0.025em]">
                {title}
              </h1>
              {subtitle && (
                <div className="font-sans text-z-body sm:text-[17px] text-ink-soft mt-4 max-w-2xl leading-relaxed">
                  {subtitle}
                </div>
              )}
              {arabicHref && (
                <div className="mt-5">
                  <Link
                    href={arabicHref}
                    lang="ar"
                    hrefLang="ar-AE"
                    dir="rtl"
                    className="inline-flex items-center gap-1.5 font-sans text-z-caption font-medium text-ink-soft hover:text-ink transition-colors"
                  >
                    اقرأ هذه الصفحة بالعربية
                  </Link>
                </div>
              )}
            </div>

            {/* Pricing big numbers (right column) */}
            {pricing && (
              <div className="lg:col-span-4">
                <div className="rounded-z-lg bg-white border border-ink-line p-5">
                  <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-3">
                    Typical cost in {cityName}
                  </p>
                  <p className="font-display font-semibold text-ink text-display-lg leading-none tracking-[-0.025em]">
                    {formatAed(pricing.typical)}
                  </p>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div>
                      <p className="font-sans text-z-caption text-ink-muted">From</p>
                      <p className="font-display font-semibold text-ink text-z-h2 mt-0.5">
                        {formatAed(pricing.min)}
                      </p>
                    </div>
                    <div>
                      <p className="font-sans text-z-caption text-ink-muted">Up to</p>
                      <p className="font-display font-semibold text-ink text-z-h2 mt-0.5">
                        {formatAed(pricing.max)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {aeoAnswer && (
            <div
              className="mt-8 answer-block rounded-z-md bg-white border border-ink-line p-5 sm:p-6 max-w-4xl"
              data-answer-block="true"
            >
              <div className="font-sans text-z-body-sm text-ink-soft leading-[1.75]">{aeoAnswer}</div>
            </div>
          )}
        </div>
      </section>

      {/* Quick info strip */}
      <section className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-12">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {duration && (
            <InfoCard Icon={Clock} label="Duration" value={duration} />
          )}
          {recoveryTime && (
            <InfoCard Icon={Activity} label="Recovery" value={recoveryTime} />
          )}
          <InfoCard Icon={ShieldCheck} label="Insurance" value={coverageLabel} />
          <InfoCard Icon={Info} label="Regulator" value={regulatorShort} />
        </div>
      </section>

      {/* City comparison table */}
      {cityComparison.length > 1 && (
        <section className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16">
          <header className="mb-6">
            <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-2">
              UAE comparison
            </p>
            <h2 className="font-display font-semibold text-ink text-display-md tracking-[-0.018em]">
              {procedureName} — pricing across the UAE.
            </h2>
          </header>

          <div className="overflow-x-auto -mx-4 sm:mx-0 rounded-z-md border border-ink-line bg-white">
            <table className="w-full min-w-[560px] text-sm border-collapse">
              <thead>
                <tr className="bg-surface-cream">
                  <th className="font-sans text-z-caption font-semibold text-ink-muted uppercase tracking-[0.04em] text-left px-4 py-3 border-b border-ink-line">
                    City
                  </th>
                  <th className="font-sans text-z-caption font-semibold text-ink-muted uppercase tracking-[0.04em] text-right px-4 py-3 border-b border-ink-line">
                    From
                  </th>
                  <th className="font-sans text-z-caption font-semibold text-ink-muted uppercase tracking-[0.04em] text-right px-4 py-3 border-b border-ink-line">
                    Typical
                  </th>
                  <th className="font-sans text-z-caption font-semibold text-ink-muted uppercase tracking-[0.04em] text-right px-4 py-3 border-b border-ink-line">
                    Up to
                  </th>
                  <th className="font-sans text-z-caption font-semibold text-ink-muted uppercase tracking-[0.04em] text-right px-4 py-3 border-b border-ink-line"></th>
                </tr>
              </thead>
              <tbody>
                {cityComparison.map((c) => (
                  <tr
                    key={c.slug}
                    className={
                      c.isCurrent
                        ? "bg-accent-muted/40 border-b border-ink-line"
                        : "bg-white border-b border-ink-hairline"
                    }
                  >
                    <td className="px-4 py-3 font-sans text-ink">
                      <span className={c.isCurrent ? "font-semibold" : undefined}>{c.name}</span>
                      {c.isCurrent && (
                        <span className="ml-2 inline-flex items-center rounded-z-pill bg-accent px-2 py-0.5 font-sans text-[10px] font-semibold text-white uppercase tracking-[0.04em]">
                          You&rsquo;re here
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-sans text-ink-muted">{formatAed(c.min)}</td>
                    <td className="px-4 py-3 text-right font-display font-semibold text-ink">
                      {formatAed(c.typical)}
                    </td>
                    <td className="px-4 py-3 text-right font-sans text-ink-muted">{formatAed(c.max)}</td>
                    <td className="px-4 py-3 text-right">
                      {c.isCurrent ? (
                        <span className="font-sans text-z-caption text-ink-muted">Viewing</span>
                      ) : (
                        <Link
                          href={c.href ?? `/directory/${c.slug}`}
                          className="font-sans text-z-body-sm font-medium text-accent-dark hover:underline decoration-1 underline-offset-2"
                        >
                          View
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Providers grid */}
      <section className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16">
        <header className="flex items-end justify-between gap-6 mb-6">
          <div>
            <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-2">
              {categoryName} in {cityName}
            </p>
            <h2 className="font-display font-semibold text-ink text-display-md tracking-[-0.018em]">
              Providers offering {procedureName}.
            </h2>
          </div>
          {providerTotal > providers.length && (
            <Link
              href={viewAllProvidersHref}
              className="hidden md:inline-flex items-center gap-1.5 font-sans text-z-body-sm font-medium text-ink hover:text-ink-soft group"
            >
              See all {providerTotal.toLocaleString()}
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          )}
        </header>

        {providers.length === 0 ? (
          <EmptyStateV2
            title={`No ${categoryName.toLowerCase()} providers listed yet in ${cityName}.`}
            description="We're still indexing providers. Browse related specialties or check nearby cities."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10 z-stagger">
            {providers.map((p, i) => (
              <ProviderCardV2
                key={p.id}
                name={p.name}
                slug={p.slug}
                citySlug={p.citySlug}
                categorySlug={p.categorySlug}
                categoryName={p.categoryName ?? categoryName}
                address={p.address ?? null}
                googleRating={p.googleRating}
                googleReviewCount={p.googleReviewCount}
                isClaimed={p.isClaimed}
                isVerified={p.isVerified}
                photos={p.photos ?? []}
                coverImageUrl={p.coverImageUrl ?? null}
                priority={i < 4}
              />
            ))}
          </div>
        )}
      </section>

      {/* What to expect */}
      {whatToExpect && (
        <section className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16">
          <header className="mb-6">
            <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-2">
              What to expect
            </p>
            <h2 className="font-display font-semibold text-ink text-display-md tracking-[-0.018em]">
              Your {procedureName.toLowerCase()} day.
            </h2>
          </header>
          <div className="rounded-z-md bg-white border border-ink-line p-6 sm:p-8 max-w-4xl">
            <div className="font-sans text-z-body text-ink-soft leading-[1.75]">{whatToExpect}</div>
            {anaesthesia && anaesthesia !== "none" && (
              <p className="mt-4 font-sans text-z-body-sm text-ink-muted">
                <span className="font-semibold text-ink">Anaesthesia:</span>{" "}
                {anaesthesia.charAt(0).toUpperCase() + anaesthesia.slice(1)} anaesthesia is typically used.
              </p>
            )}
          </div>
        </section>
      )}

      {/* Insurance notes */}
      {coverageNotes && (
        <section className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16">
          <header className="mb-6">
            <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-2">
              Insurance
            </p>
            <h2 className="font-display font-semibold text-ink text-display-md tracking-[-0.018em]">
              What your plan covers.
            </h2>
          </header>
          <div className="rounded-z-md bg-white border border-ink-line p-6 sm:p-8 max-w-4xl">
            <span className="inline-flex items-center rounded-z-pill bg-accent-muted px-3 py-1 font-sans text-z-caption font-semibold text-accent-deep mb-3">
              {coverageLabel}
            </span>
            <div className="font-sans text-z-body text-ink-soft leading-[1.75]">{coverageNotes}</div>
          </div>
        </section>
      )}

      {/* Related procedures chips */}
      {relatedProcedures.length > 0 && (
        <section className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16">
          <header className="mb-6">
            <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-2">
              Related
            </p>
            <h2 className="font-display font-semibold text-ink text-display-md tracking-[-0.018em]">
              More procedures in {cityName}.
            </h2>
          </header>
          <ul className="flex flex-wrap gap-2.5">
            {relatedProcedures.map((rp) => (
              <li key={rp.slug}>
                <Link
                  href={rp.href}
                  className="inline-flex items-center gap-2 rounded-z-pill bg-white border border-ink-line px-4 py-2 font-sans text-z-body-sm text-ink hover:border-ink transition-colors"
                >
                  <span className="font-medium">{rp.name}</span>
                  {rp.typicalPrice && (
                    <span className="font-sans text-z-caption text-ink-muted">· {rp.typicalPrice}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* More in same category */}
      {sameCategoryProcedures && sameCategoryProcedures.length > 0 && (
        <section className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16">
          <header className="mb-6">
            <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-2">
              {categoryName}
            </p>
            <h2 className="font-display font-semibold text-ink text-display-md tracking-[-0.018em]">
              More in {categoryName.toLowerCase()}.
            </h2>
          </header>
          <ul className="flex flex-wrap gap-2">
            {sameCategoryProcedures.map((sp) => (
              <li key={sp.slug}>
                <Link
                  href={sp.href}
                  className="inline-flex items-center rounded-z-sm bg-white border border-ink-hairline px-3.5 py-1.5 font-sans text-z-body-sm text-ink hover:border-ink transition-colors"
                >
                  {sp.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Cross-links */}
      {crossLinks && crossLinks.length > 0 && (
        <section className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16">
          <div className="flex flex-wrap gap-3">
            {crossLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="inline-flex items-center gap-1.5 rounded-z-pill bg-white border border-ink-line px-4 py-2 font-sans text-z-body-sm font-medium text-ink hover:border-ink transition-colors"
              >
                {l.label}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* FAQ */}
      {faqs && faqs.length > 0 && (
        <section className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-20 pb-12">
          <header className="mb-6">
            <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-2">
              Questions
            </p>
            <h2 className="font-display font-semibold text-ink text-display-md tracking-[-0.018em]">
              About {procedureName.toLowerCase()} in {cityName}.
            </h2>
          </header>
          <div className="max-w-3xl">
            <FaqSection faqs={faqs} />
          </div>
        </section>
      )}

      {/* Disclaimer */}
      <section className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pb-16 sm:pb-20">
        <div className="border-t border-ink-line pt-5 max-w-4xl">
          <p className="font-sans text-z-caption text-ink-muted leading-relaxed">
            <span className="font-semibold text-ink-soft">Disclaimer:</span> Pricing is indicative and based on DOH
            Mandatory Tariff methodology and market-observed ranges. Actual costs depend on facility type, clinical
            complexity, and insurance coverage. Always confirm pricing directly with the provider. Provider data is
            sourced from official {regulatorFull} registers
            {lastVerified ? `, last verified ${lastVerified}` : ""}.
          </p>
        </div>
      </section>
    </>
  );
}

function InfoCard({
  Icon,
  label,
  value,
}: {
  // Broadened type: accept any component that takes className + strokeWidth,
  // including lucide-react's ForwardRefExoticComponent.
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement> & { strokeWidth?: string | number }>;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-z-md bg-white border border-ink-line p-4">
      <div className="h-8 w-8 rounded-z-sm bg-accent-muted flex items-center justify-center mb-2.5">
        <Icon className="h-4 w-4" strokeWidth={2} />
      </div>
      <p className="font-sans text-z-caption text-ink-muted uppercase tracking-[0.04em]">{label}</p>
      <p className="font-display font-semibold text-ink text-z-body-sm mt-0.5 leading-tight">{value}</p>
    </div>
  );
}
