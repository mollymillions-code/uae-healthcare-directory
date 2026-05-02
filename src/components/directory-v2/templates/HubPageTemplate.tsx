import Link from "next/link";
import { ChevronRight, ArrowRight, Sparkles } from "lucide-react";
import { cn } from "../shared/cn";

export interface HubItem {
  href: string;
  label: string;
  subLabel?: string | null;
  count?: number | null;
  icon?: React.ReactNode;
  imageSrc?: string | null;
}

interface HubSection {
  title: string;
  eyebrow?: string;
  items: HubItem[];
  layout?: "grid" | "list" | "chips";
  gridCols?: "2" | "3" | "4" | "5";
}

interface HubPageTemplateProps {
  breadcrumbs: { label: string; href?: string }[];
  eyebrow?: string;
  title: string;
  subtitle?: React.ReactNode;
  stats?: { n: string; l: string }[];
  aeoAnswer?: React.ReactNode;
  schemas?: React.ReactNode;
  arabicHref?: string | null;
  sections: HubSection[];
  faqs?: Array<{ question: string; answer: string }>;
  ctaBanner?: React.ReactNode;
  tocAnchor?: boolean;
}

/**
 * Reusable template for content hubs (/specialties, /conditions, /medications,
 * /pharmacy, /brands, /insurance, /labs, etc.). Renders a consistent
 * breadcrumb + hero + optional stat ribbon + AEO block + sections of items,
 * with per-section layouts (grid of image cards, text list, chip row).
 */
export function HubPageTemplate({
  breadcrumbs,
  eyebrow,
  title,
  subtitle,
  stats,
  aeoAnswer,
  schemas,
  arabicHref,
  sections,
  // faqs accepted in props for API uniformity; consumer renders via <FaqSection />
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  faqs: _unusedFaqs,
  ctaBanner,
}: HubPageTemplateProps) {
  return (
    <>
      {schemas}

      {/* Hero */}
      <section className="relative overflow-hidden bg-surface-cream">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 -right-40 h-[460px] w-[460px] rounded-full bg-[radial-gradient(closest-side,rgba(0,200,83,0.16),transparent_70%)]" />
          <div className="absolute -top-20 -left-32 h-[360px] w-[360px] rounded-full bg-[radial-gradient(closest-side,rgba(255,176,120,0.22),transparent_70%)]" />
        </div>

        <div className="relative max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-10">
          {/* Breadcrumb */}
          {breadcrumbs.length > 0 && (
            <nav className="font-sans text-z-body-sm text-ink-muted flex items-center gap-1.5 mb-5 flex-wrap" aria-label="Breadcrumb">
              {breadcrumbs.map((b, i) => {
                const isLast = i === breadcrumbs.length - 1;
                return (
                  <span key={i} className="inline-flex items-center gap-1.5">
                    {b.href && !isLast ? (
                      <Link href={b.href} className="hover:text-ink transition-colors">{b.label}</Link>
                    ) : (
                      <span className={isLast ? "text-ink font-medium" : undefined}>{b.label}</span>
                    )}
                    {!isLast && <ChevronRight className="h-3.5 w-3.5" />}
                  </span>
                );
              })}
            </nav>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-8">
              {eyebrow && (
                <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-3 inline-flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  {eyebrow}
                </p>
              )}
              <h1 className="font-display font-semibold text-ink text-display-lg lg:text-[56px] leading-[1.02] tracking-[-0.028em]">
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

            {stats && stats.length > 0 && (
              <div className="lg:col-span-4 grid grid-cols-2 gap-3">
                {stats.map((s) => (
                  <div key={s.l} className="rounded-z-md bg-white border border-ink-line px-4 py-3">
                    <p className="font-display font-semibold text-ink text-z-h1 leading-none">{s.n}</p>
                    <p className="font-sans text-z-caption text-ink-muted mt-1">{s.l}</p>
                  </div>
                ))}
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

      {/* Content sections */}
      <div className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-14">
        {sections.map((s, idx) => (
          <HubSectionView key={idx} section={s} />
        ))}

        {ctaBanner && <div>{ctaBanner}</div>}
      </div>
    </>
  );
}

function HubSectionView({ section }: { section: HubSection }) {
  const layout = section.layout ?? "grid";
  const gridColsMap = { "2": "sm:grid-cols-2", "3": "sm:grid-cols-2 lg:grid-cols-3", "4": "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4", "5": "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5" } as const;

  return (
    <section>
      <header className="mb-6">
        {section.eyebrow && (
          <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-2">
            {section.eyebrow}
          </p>
        )}
        <h2 className="font-display font-semibold text-ink text-display-md tracking-[-0.018em]">
          {section.title}
        </h2>
      </header>

      {layout === "grid" && (
        <div className={cn("grid grid-cols-1 gap-4", gridColsMap[section.gridCols ?? "3"])}>
          {section.items.map((it) => (
            <Link
              key={it.href}
              href={it.href}
              className="group flex items-start gap-4 rounded-z-md bg-white border border-ink-line p-5 hover:border-ink hover:shadow-z-card transition-all duration-z-base"
            >
              {it.icon && (
                <div className="h-11 w-11 rounded-z-sm bg-accent-muted flex items-center justify-center flex-shrink-0">
                  <span className="text-accent-deep">{it.icon}</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-sans font-semibold text-ink text-z-body leading-tight line-clamp-2 group-hover:underline decoration-1 underline-offset-2">
                  {it.label}
                </p>
                {it.subLabel && (
                  <p className="font-sans text-z-caption text-ink-muted mt-0.5 line-clamp-2">
                    {it.subLabel}
                  </p>
                )}
                {typeof it.count === "number" && it.count > 0 && (
                  <p className="font-sans text-z-caption text-ink-muted mt-1">
                    {it.count.toLocaleString()} {it.count === 1 ? "provider" : "providers"}
                  </p>
                )}
              </div>
              <ArrowRight className="h-4 w-4 text-ink-muted group-hover:translate-x-0.5 transition-transform flex-shrink-0 mt-1" />
            </Link>
          ))}
        </div>
      )}

      {layout === "list" && (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-2 border-t border-ink-line pt-4">
          {section.items.map((it) => (
            <li key={it.href}>
              <Link
                href={it.href}
                className="flex items-center justify-between py-2.5 group"
              >
                <span className="font-sans text-z-body text-ink group-hover:underline decoration-1 underline-offset-2">
                  {it.label}
                </span>
                {typeof it.count === "number" && it.count > 0 && (
                  <span className="font-sans text-z-caption text-ink-muted">{it.count.toLocaleString()}</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}

      {layout === "chips" && (
        <ul className="flex flex-wrap gap-2">
          {section.items.map((it) => (
            <li key={it.href}>
              <Link
                href={it.href}
                className="inline-flex items-center rounded-z-pill bg-white border border-ink-hairline px-3.5 py-1.5 font-sans text-z-body-sm text-ink hover:border-ink transition-colors"
              >
                {it.label}
                {typeof it.count === "number" && it.count > 0 && (
                  <span className="ml-1.5 text-ink-muted">· {it.count}</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
