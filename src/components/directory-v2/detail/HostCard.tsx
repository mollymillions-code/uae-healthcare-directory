import Link from "next/link";
import { BadgeCheck, Globe, Clock, MessageCircle } from "lucide-react";
import { cn } from "../shared/cn";

interface HostCardProps {
  providerName: string;
  licenseNumber?: string | null;
  yearEstablished?: number | null;
  isClaimed?: boolean | null;
  isVerified?: boolean | null;
  languages?: string[] | null;
  facilityType?: string | null;
  /** Preserve existing provider CTA. */
  contactHref?: string;
  contactLabel?: string;
  className?: string;
}

/**
 * "Meet the provider" section — Airbnb's host card, remixed for clinics.
 * Icon + name header, stats row, facts grid, ghost CTA.
 */
export function HostCard({
  providerName,
  licenseNumber,
  yearEstablished,
  isClaimed,
  isVerified,
  languages,
  facilityType,
  contactHref,
  contactLabel = "Message this provider",
  className,
}: HostCardProps) {
  const years = yearEstablished ? new Date().getFullYear() - yearEstablished : null;

  return (
    <section
      className={cn(
        "py-8 border-b border-ink-line z-anchor",
        className
      )}
    >
      <h2 className="font-display font-semibold text-ink text-z-h1 mb-6">Meet this provider</h2>

      <div className="rounded-z-md bg-white border border-ink-line p-6 sm:p-7">
        <div className="flex items-start gap-5">
          <div className="h-16 w-16 rounded-full bg-accent-muted flex items-center justify-center flex-shrink-0">
            <span className="font-display font-semibold text-accent-deep text-z-h1">
              {providerName
                .split(/\s+/)
                .slice(0, 2)
                .map((w) => w[0])
                .join("")
                .toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-semibold text-ink text-z-h2 truncate">{providerName}</h3>
            <p className="font-sans text-z-body-sm text-ink-soft mt-1">
              {facilityType ?? "Healthcare provider"}
              {years && years > 0 && ` · ${years} ${years === 1 ? "year" : "years"} in practice`}
            </p>
            {(isClaimed || isVerified) && (
              <div className="flex items-center gap-2 mt-3">
                {isClaimed && (
                  <span className="inline-flex items-center gap-1 rounded-z-pill bg-accent-muted px-2.5 py-1 font-sans text-z-micro text-accent-deep uppercase tracking-[0.04em]">
                    <BadgeCheck className="h-3 w-3" strokeWidth={2.5} /> Claimed
                  </span>
                )}
                {isVerified && (
                  <span className="inline-flex items-center gap-1 rounded-z-pill bg-ink text-white px-2.5 py-1 font-sans text-z-micro uppercase tracking-[0.04em]">
                    <BadgeCheck className="h-3 w-3" strokeWidth={2.5} /> Verified
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          {licenseNumber && (
            <div className="flex items-start gap-3">
              <BadgeCheck className="h-4 w-4 text-ink-muted flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-sans text-z-caption text-ink-muted">Licence</p>
                <p className="font-sans font-semibold text-z-body-sm text-ink">{licenseNumber}</p>
              </div>
            </div>
          )}
          {yearEstablished && (
            <div className="flex items-start gap-3">
              <Clock className="h-4 w-4 text-ink-muted flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-sans text-z-caption text-ink-muted">Since</p>
                <p className="font-sans font-semibold text-z-body-sm text-ink">{yearEstablished}</p>
              </div>
            </div>
          )}
          {languages && languages.length > 0 && (
            <div className="flex items-start gap-3">
              <Globe className="h-4 w-4 text-ink-muted flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-sans text-z-caption text-ink-muted">Languages</p>
                <p className="font-sans font-semibold text-z-body-sm text-ink line-clamp-1">{languages.join(", ")}</p>
              </div>
            </div>
          )}
        </div>

        {contactHref && (
          <div className="mt-6 pt-6 border-t border-ink-line">
            <Link
              href={contactHref}
              target={contactHref.startsWith("http") ? "_blank" : undefined}
              rel={contactHref.startsWith("http") ? "noopener" : undefined}
              className="inline-flex items-center gap-2 bg-white border border-ink hover:bg-ink hover:text-white text-ink rounded-z-sm px-5 py-2.5 font-sans font-semibold text-z-body-sm transition-colors"
            >
              <MessageCircle className="h-3.5 w-3.5" strokeWidth={2.5} />
              {contactLabel}
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
