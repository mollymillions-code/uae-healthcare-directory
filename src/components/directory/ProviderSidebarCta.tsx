"use client";

/**
 * ProviderSidebarCta — Desktop sidebar Contact + Claim Listing cards.
 *
 * Tracks every CTA click (call, website, directions, claim_listing) via
 * the shared `trackProviderCta` helper so desktop conversions are visible
 * in GA4 alongside the mobile sticky CTA events.
 */

import Link from "next/link";
import { Phone, Globe, MapPin, ExternalLink } from "lucide-react";
import { trackProviderCta, type ProviderTrackingInfo } from "@/lib/provider-tracking";

interface ProviderSidebarCtaProps {
  providerName: string;
  providerSlug: string;
  citySlug: string;
  categorySlug: string;
  providerId: string;
  isClaimed: boolean;
  phone?: string | null;
  website?: string | null;
  address: string;
  directionsUrl: string;
}

export function ProviderSidebarCta({
  providerName,
  providerSlug,
  citySlug,
  categorySlug,
  providerId,
  isClaimed,
  phone,
  website,
  address,
  directionsUrl,
}: ProviderSidebarCtaProps) {
  const provider: ProviderTrackingInfo = {
    name: providerName,
    slug: providerSlug,
    citySlug,
    categorySlug,
    id: providerId,
    isClaimed,
  };

  const cleanPhone = phone ? phone.replace(/[^+\d]/g, "") : null;

  return (
    <>
      <div className="border border-black/[0.06] rounded-2xl p-6">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[#1c1c1c] mb-4 tracking-tight">Contact</h2>
        <div className="space-y-3">
          {cleanPhone && (
            <a
              href={`tel:${cleanPhone}`}
              onClick={() => trackProviderCta("call", "sidebar", provider)}
              className="flex items-center gap-3 font-['Geist',sans-serif] text-sm text-black/50 hover:text-[#006828] transition-colors"
            >
              <Phone className="h-4 w-4" /> {phone}
            </a>
          )}
          {website && (
            <a
              href={website}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackProviderCta("website", "sidebar", provider)}
              className="flex items-center gap-3 font-['Geist',sans-serif] text-sm text-black/50 hover:text-[#006828] transition-colors"
            >
              <Globe className="h-4 w-4" /> Website <ExternalLink className="h-3 w-3" />
            </a>
          )}
          <div className="flex items-center gap-3 font-['Geist',sans-serif] text-sm text-black/50">
            <MapPin className="h-4 w-4" /> {address}
          </div>
        </div>
        <div className="mt-4 space-y-2">
          {cleanPhone && (
            <a
              href={`tel:${cleanPhone}`}
              onClick={() => trackProviderCta("call", "sidebar", provider)}
              className="flex items-center justify-center gap-2 w-full bg-[#006828] hover:bg-[#004d1c] text-white font-['Geist',sans-serif] font-medium text-sm py-3 rounded-full transition-colors"
            >
              <Phone className="h-4 w-4" /> Call Now
            </a>
          )}
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackProviderCta("directions", "sidebar", provider)}
            className="flex items-center justify-center gap-2 w-full bg-[#1c1c1c] hover:bg-black text-white font-['Geist',sans-serif] font-medium text-sm py-3 rounded-full transition-colors"
          >
            <MapPin className="h-4 w-4" /> Directions
          </a>
        </div>
      </div>

      {!isClaimed && (
        <div className="border border-black/[0.06] rounded-2xl p-6 bg-[#006828]/[0.04]">
          <h3 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[#1c1c1c] mb-2 tracking-tight">Is this your business?</h3>
          <p className="font-['Geist',sans-serif] text-sm text-black/40 mb-4">Claim your listing to update information.</p>
          <Link
            href={`/claim/${providerId}`}
            onClick={() => trackProviderCta("claim_listing", "sidebar", provider)}
            className="flex items-center justify-center w-full bg-[#006828] hover:bg-[#004d1c] text-white font-['Geist',sans-serif] font-medium text-sm py-3 rounded-full transition-colors"
          >
            Claim Listing
          </Link>
        </div>
      )}
    </>
  );
}
