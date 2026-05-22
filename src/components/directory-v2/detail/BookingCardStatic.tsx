import Link from "next/link";
import { Globe, MapPin, MessageCircle, Phone, Star } from "lucide-react";
import { cn } from "../shared/cn";

interface BookingCardStaticProps {
  providerName: string;
  providerId: string;
  googleRating?: string | number | null;
  googleReviewCount?: number | null;
  phone?: string | null;
  whatsapp?: string | null;
  website?: string | null;
  isClaimed?: boolean | null;
  address?: string | null;
  googleMapsUri?: string | null;
  directionsUrl?: string | null;
  primaryCtaLabel?: string;
  primaryCtaHref?: string;
  className?: string;
}

export function BookingCardStatic(p: BookingCardStaticProps) {
  const rating = p.googleRating ? Number(p.googleRating) : 0;
  const hasPhone = Boolean(p.phone);
  const hasWhatsApp = Boolean(p.whatsapp);
  const primaryLabel = p.primaryCtaLabel ?? (hasPhone ? "Call to book" : hasWhatsApp ? "WhatsApp now" : "Visit website");
  const primaryHref =
    p.primaryCtaHref ??
    (hasPhone ? `tel:${p.phone}` : hasWhatsApp ? `https://wa.me/${(p.whatsapp ?? "").replace(/[^\d]/g, "")}` : p.website ?? "#");
  const showSecondaryCall = hasPhone && primaryHref !== `tel:${p.phone}`;
  const claimHref = `/claim/${p.providerId}`;

  return (
    <aside
      className={cn(
        "rounded-z-md border border-ink-line bg-white p-6 sticky top-[88px] self-start",
        "shadow-z-card",
        p.className
      )}
      aria-label={`Contact ${p.providerName}`}
    >
      {rating > 0 && (
        <div className="flex items-center gap-2 pb-4 border-b border-ink-line mb-4">
          <Star className="h-4 w-4 fill-ink text-ink" />
          <span className="font-sans font-semibold text-ink text-z-body">{rating.toFixed(2)}</span>
          {p.googleReviewCount ? (
            <span className="font-sans text-ink-muted text-z-body-sm">· {p.googleReviewCount} reviews</span>
          ) : null}
        </div>
      )}

      <p className="font-sans text-z-micro text-ink-muted uppercase tracking-[0.04em] mb-2">
        Contact this provider
      </p>
      <h3 className="font-display font-semibold text-ink text-z-h2 leading-tight">{p.providerName}</h3>
      {p.address && (
        <p className="font-sans text-z-body-sm text-ink-soft mt-2 inline-flex items-start gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-ink-muted flex-shrink-0 mt-0.5" />
          <span className="leading-snug">{p.address}</span>
        </p>
      )}

      <div className="mt-5 space-y-2.5">
        <Link
          href={primaryHref}
          target={primaryHref.startsWith("http") ? "_blank" : undefined}
          rel={primaryHref.startsWith("http") ? "noopener" : undefined}
          className="flex items-center justify-center gap-2 bg-accent-deep hover:bg-ink text-white rounded-z-md py-3.5 font-sans font-semibold text-z-body-sm transition-colors"
        >
          {primaryLabel}
        </Link>

        {(showSecondaryCall || hasWhatsApp || p.website || p.googleMapsUri || p.directionsUrl) && (
          <div className="grid grid-cols-2 gap-2">
            {showSecondaryCall && (
              <a
                href={`tel:${p.phone}`}
                className="flex items-center justify-center gap-2 bg-white border border-ink-hairline hover:border-ink rounded-z-md py-2.5 font-sans font-medium text-z-body-sm text-ink transition-colors"
              >
                <Phone className="h-3.5 w-3.5" strokeWidth={2.5} />
                Call
              </a>
            )}
            {hasWhatsApp && (
              <a
                href={`https://wa.me/${(p.whatsapp ?? "").replace(/[^\d]/g, "")}`}
                target="_blank"
                rel="noopener"
                className="flex items-center justify-center gap-2 bg-white border border-ink-hairline hover:border-ink rounded-z-md py-2.5 font-sans font-medium text-z-body-sm text-ink transition-colors"
              >
                <MessageCircle className="h-3.5 w-3.5" strokeWidth={2.5} />
                WhatsApp
              </a>
            )}
            {p.website && (
              <a
                href={p.website}
                target="_blank"
                rel="noopener"
                className="flex items-center justify-center gap-2 bg-white border border-ink-hairline hover:border-ink rounded-z-md py-2.5 font-sans font-medium text-z-body-sm text-ink transition-colors"
              >
                <Globe className="h-3.5 w-3.5" strokeWidth={2.5} />
                Website
              </a>
            )}
            {(p.googleMapsUri || p.directionsUrl) && (
              <a
                href={p.googleMapsUri ?? p.directionsUrl ?? "#"}
                target="_blank"
                rel="noopener"
                className="flex items-center justify-center gap-2 bg-white border border-ink-hairline hover:border-ink rounded-z-md py-2.5 font-sans font-medium text-z-body-sm text-ink transition-colors"
              >
                <MapPin className="h-3.5 w-3.5" strokeWidth={2.5} />
                Directions
              </a>
            )}
          </div>
        )}
      </div>

      <div className="mt-5 pt-5 border-t border-ink-line">
        <p className="font-sans text-z-caption text-ink-muted mb-2">Work here?</p>
        <Link
          href={claimHref}
          prefetch={false}
          className="font-sans text-z-body-sm font-medium text-accent-dark underline-offset-2 hover:underline"
        >
          {p.isClaimed ? "Edit this listing" : "Claim or edit this listing"}
        </Link>
      </div>
    </aside>
  );
}
