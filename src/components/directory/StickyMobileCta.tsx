"use client";

/**
 * StickyMobileCta — Mobile-only sticky bottom CTA bar for provider profile pages.
 *
 * Part of Zocdoc Roadmap Item 9 (Codex Rec 4). Trust-disciplined: only renders
 * a CTA for fields that actually exist on the provider. No fake phone numbers,
 * no invented websites, no broken `tel:` links.
 *
 * Behavior:
 *  - Fixed to viewport bottom on `<lg` breakpoints (`lg:hidden`).
 *  - Hidden at top of page; appears after the user scrolls past 200px.
 *  - Each CTA is a plain `<a>` link (not a button — assistive tech should
 *    announce them as links, and they must work with JS disabled).
 *  - Fires `trackEvent('cta_click', { type, provider, mode })` via
 *    `src/lib/gtag.ts`. Does NOT touch `window.gtag` directly — we never
 *    re-enter the layout.tsx gtag-shim recursion guard.
 *
 * Accessibility:
 *  - Container has `role="region"` + `aria-label="Contact provider"` so
 *    screen readers announce it on focus entry.
 *  - Icons are `aria-hidden` — the visible label provides the accessible name.
 *  - Keyboard accessible (default anchor tab order) with visible focus rings.
 */

import { useEffect, useState } from "react";
import { Phone, MessageCircle, MapPin, Globe } from "lucide-react";
import { trackProviderCta, type ProviderTrackingInfo } from "@/lib/provider-tracking";

export interface StickyMobileCtaProps {
  providerName: string;
  providerSlug: string;
  citySlug: string;
  categorySlug: string;
  providerId: string;
  isClaimed: boolean;
  phoneE164?: string | null;
  whatsappNumber?: string | null;
  /** Pre-built Google Maps deep link (`https://www.google.com/maps/...`). */
  directionsUrl?: string | null;
  websiteUrl?: string | null;
  mode?: "provider-profile" | "listing";
}

function cleanPhone(raw: string): string {
  return raw.replace(/[^+\d]/g, "");
}

function cleanWhatsapp(raw: string): string {
  // wa.me expects digits only, no leading +
  return raw.replace(/[^\d]/g, "");
}

export function StickyMobileCta({
  providerName,
  providerSlug,
  citySlug,
  categorySlug,
  providerId,
  isClaimed,
  phoneE164,
  whatsappNumber,
  directionsUrl,
  websiteUrl,
}: StickyMobileCtaProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 200);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const phone = phoneE164 ? cleanPhone(phoneE164) : null;
  const wa = whatsappNumber ? cleanWhatsapp(whatsappNumber) : null;

  // Don't render at all if we have nothing real to offer.
  const hasAnyCta = Boolean(phone || wa || directionsUrl || websiteUrl);
  if (!hasAnyCta) return null;

  const provider: ProviderTrackingInfo = {
    name: providerName,
    slug: providerSlug,
    citySlug,
    categorySlug,
    id: providerId,
    isClaimed,
  };

  function handleClick(type: "call" | "whatsapp" | "directions" | "website") {
    trackProviderCta(type, "sticky_mobile_cta", provider);
  }

  return (
    <div
      role="region"
      aria-label="Contact provider"
      className={`fixed bottom-0 left-0 right-0 z-40 lg:hidden transition-transform duration-200 ease-out ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="bg-white border-t border-black/[0.08] shadow-[0_-4px_24px_rgba(0,0,0,0.06)]">
        <div className="flex gap-2 px-3 py-3 max-w-[1280px] mx-auto">
          {phone && (
            <a
              href={`tel:${phone}`}
              onClick={() => handleClick("call")}
              aria-label={`Call ${providerName}`}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-[#006828] hover:bg-[#004d1c] text-white font-['Geist',sans-serif] font-medium text-sm py-3 rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006828]"
            >
              <Phone className="h-4 w-4" aria-hidden="true" />
              <span>Call</span>
            </a>
          )}
          {wa && (
            <a
              href={`https://wa.me/${wa}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => handleClick("whatsapp")}
              aria-label={`WhatsApp ${providerName}`}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe57] text-white font-['Geist',sans-serif] font-medium text-sm py-3 rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25D366]"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              <span>WhatsApp</span>
            </a>
          )}
          {directionsUrl && (
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => handleClick("directions")}
              aria-label={`Directions to ${providerName}`}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-[#1c1c1c] hover:bg-black text-white font-['Geist',sans-serif] font-medium text-sm py-3 rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1c1c1c]"
            >
              <MapPin className="h-4 w-4" aria-hidden="true" />
              <span>Directions</span>
            </a>
          )}
          {websiteUrl && (
            <a
              href={websiteUrl}
              target="_blank"
              rel="noopener noreferrer nofollow"
              onClick={() => handleClick("website")}
              aria-label={`${providerName} website`}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-white hover:bg-[#f8f8f6] text-[#1c1c1c] border border-black/[0.08] font-['Geist',sans-serif] font-medium text-sm py-3 rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1c1c1c]"
            >
              <Globe className="h-4 w-4" aria-hidden="true" />
              <span>Website</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
