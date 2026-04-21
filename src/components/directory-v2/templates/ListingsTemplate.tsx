import Link from "next/link";
import { ChevronRight, ShieldCheck, ArrowRight } from "lucide-react";
import { ProviderCardV2 } from "../cards/ProviderCardV2";
import { EmptyStateV2 } from "../shared/EmptyStateV2";
import { CategoryRail, type CategoryRailItem } from "../rails/CategoryRail";

export interface ListingsTemplateBreadcrumb {
  label: string;
  href?: string;
}

export interface ListingsTemplateProvider {
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

interface ListingsTemplateProps {
  /** Breadcrumb trail — last item is current page. */
  breadcrumbs: ListingsTemplateBreadcrumb[];
  /** Eyebrow label (e.g. "DHA Verified · Dubai"). */
  eyebrow?: React.ReactNode;
  /** H1 headline. */
  title: string;
  /** Editorial subtitle / blurb. */
  subtitle?: React.ReactNode;
  /** AEO answer block content (preserved for search visibility). */
  aeoAnswer?: React.ReactNode;
  /** Sticky category rail under header. Omit to hide. */
  railItems?: CategoryRailItem[];
  activeRailSlug?: string;
  /** Provider grid. */
  providers: ListingsTemplateProvider[];
  /** Total count for "X providers found" label. */
  total?: number;
  /** Pagination element if present. */
  pagination?: React.ReactNode;
  /** Related sections to show below the grid. */
  belowGrid?: React.ReactNode;
  /** Optional structured-data JSON-LD children (passed through SSR). */
  schemas?: React.ReactNode;
  /** Hreflang AR link to render inline. */
  arabicHref?: string | null;
}

/**
 * Server-rendered listings template. Zero client JS inside — the only client
 * moments are the CategoryRail (for scroll arrows) and ProviderCardV2 (for
 * heart-save). All static content is SSR for SEO and Core Web Vitals.
 */
export function ListingsTemplate({
  breadcrumbs,
  eyebrow,
  title,
  subtitle,
  aeoAnswer,
  railItems,
  activeRailSlug,
  providers,
  total,
  pagination,
  belowGrid,
  schemas,
  arabicHref,
}: ListingsTemplateProps) {
  return (
    <>
      {schemas}

      {/* Hero */}
      <section className="relative overflow-hidden bg-surface-cream">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 -right-24 h-[380px] w-[380px] rounded-full bg-[radial-gradient(closest-side,rgba(0,200,83,0.16),transparent_70%)]" />
        </div>

        <div className="relative max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-6 sm:pb-10">
          {/* Breadcrumb */}
          <nav className="font-sans text-z-body-sm text-ink-muted flex items-center gap-1.5 mb-5 flex-wrap" aria-label="Breadcrumb">
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
            {typeof total === "number" && (
              <div className="lg:col-span-4 flex lg:justify-end">
                <div className="bg-white rounded-z-md border border-ink-line px-5 py-4 inline-block">
                  <p className="font-display font-semibold text-ink text-display-md leading-none">
                    {total.toLocaleString()}
                  </p>
                  <p className="font-sans text-z-caption text-ink-muted mt-1">
                    {total === 1 ? "provider" : "providers"} found
                  </p>
                </div>
              </div>
            )}
          </div>

          {aeoAnswer && (
            <div className="mt-8 answer-block rounded-z-md bg-white border border-ink-line p-5 sm:p-6 max-w-4xl" data-answer-block="true">
              <div className="font-sans text-z-body-sm text-ink-soft leading-[1.75]">{aeoAnswer}</div>
            </div>
          )}
        </div>
      </section>

      {/* Sticky category rail */}
      {railItems && railItems.length > 0 && (
        <div className="sticky top-20 z-20 bg-surface-cream/90 backdrop-blur-md border-b border-ink-line">
          <div className="max-w-z-container mx-auto">
            <CategoryRail items={railItems} activeSlug={activeRailSlug} />
          </div>
        </div>
      )}

      {/* Provider grid */}
      <section className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-12">
        {providers.length === 0 ? (
          <EmptyStateV2
            title="No providers match those filters."
            description="Try adjusting your filters or browse all providers in this city."
            actionLabel="Clear filters"
            onAction={undefined}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10 z-stagger">
              {providers.map((p, i) => (
                <ProviderCardV2
                  key={p.id}
                  name={p.name}
                  slug={p.slug}
                  citySlug={p.citySlug}
                  categorySlug={p.categorySlug}
                  categoryName={p.categoryName ?? null}
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
            {pagination && <div className="mt-10">{pagination}</div>}
          </>
        )}
      </section>

      {belowGrid && (
        <section className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pb-16 sm:pb-20 space-y-12">
          {belowGrid}
        </section>
      )}
    </>
  );
}

/** Arrow-link used in cross-link strips under listings. */
export function ListingsCrossLink({ label, href, sub }: { label: string; href: string; sub?: string }) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between bg-white border border-ink-line rounded-z-md px-5 py-4 hover:border-ink transition-colors"
    >
      <div>
        <p className="font-sans font-semibold text-ink text-z-body-sm">{label}</p>
        {sub && <p className="font-sans text-z-caption text-ink-muted mt-0.5">{sub}</p>}
      </div>
      <ArrowRight className="h-4 w-4 text-ink-muted group-hover:translate-x-0.5 transition-transform" />
    </Link>
  );
}
