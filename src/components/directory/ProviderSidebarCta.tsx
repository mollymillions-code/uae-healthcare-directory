"use client";

/**
 * ProviderSidebarCta — Desktop sidebar Contact + Claim Listing cards.
 *
 * Tracks every CTA click (call, website, directions, claim_listing) via
 * the shared `trackProviderCta` helper so desktop conversions are visible
 * in GA4 alongside the mobile sticky CTA events.
 */

import Link from "next/link";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { Phone, Globe, MapPin, ExternalLink } from "lucide-react";
import { trackProviderCta, type ProviderTrackingInfo } from "@/lib/provider-tracking";
import { ConsumerAccountPrompt } from "@/components/account/ConsumerAccountPrompt";
import { recordConsumerEvent } from "@/lib/consumer-intent-client";
import { OwnerWhatsappCta } from "@/components/owner/OwnerWhatsappCta";

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
  const { status } = useSession();
  const [promptOpen, setPromptOpen] = useState(false);
  const provider: ProviderTrackingInfo = {
    name: providerName,
    slug: providerSlug,
    citySlug,
    categorySlug,
    id: providerId,
    isClaimed,
  };

  const cleanPhone = phone ? phone.replace(/[^+\d]/g, "") : null;

  function maybePromptForAccount() {
    if (status !== "unauthenticated" || typeof window === "undefined") return;
    const key = "zavis_account_prompt_last_seen";
    const lastSeen = Number(window.localStorage.getItem(key) || 0);
    if (Date.now() - lastSeen < 24 * 60 * 60 * 1000) return;
    window.localStorage.setItem(key, String(Date.now()));
    window.setTimeout(() => setPromptOpen(true), 250);
  }

  function handleTrackedClick(type: "call" | "website" | "directions") {
    trackProviderCta(type, "sidebar", provider);
    recordConsumerEvent({
      action: `provider_${type}_click`,
      surface: "provider_sidebar",
      providerId,
      entityType: "provider",
      entitySlug: providerSlug,
      entityName: providerName,
      ctaLabel: type,
      metadata: { citySlug, categorySlug, isClaimed },
    }).catch(() => undefined);
    if (type === "call") maybePromptForAccount();
  }

  return (
    <>
      <div className="border border-black/[0.06] rounded-2xl p-6">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[#1c1c1c] mb-4 tracking-tight">Contact</h2>
        <div className="space-y-3">
          {cleanPhone && (
            <a
              href={`tel:${cleanPhone}`}
              onClick={() => handleTrackedClick("call")}
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
              onClick={() => handleTrackedClick("website")}
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
              onClick={() => handleTrackedClick("call")}
              className="flex items-center justify-center gap-2 w-full bg-[#006828] hover:bg-[#004d1c] text-white font-['Geist',sans-serif] font-medium text-sm py-3 rounded-full transition-colors"
            >
              <Phone className="h-4 w-4" /> Call Now
            </a>
          )}
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => handleTrackedClick("directions")}
            className="flex items-center justify-center gap-2 w-full bg-[#1c1c1c] hover:bg-black text-white font-['Geist',sans-serif] font-medium text-sm py-3 rounded-full transition-colors"
          >
            <MapPin className="h-4 w-4" /> Directions
          </a>
        </div>
      </div>

      <div className="border border-black/[0.06] rounded-2xl p-6 bg-[#006828]/[0.04]">
        <h3 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[#1c1c1c] mb-2 tracking-tight">Is this your business?</h3>
        <p className="font-['Geist',sans-serif] text-sm text-black/40 mb-4">
          {isClaimed ? "Request edits to this listing via WhatsApp." : "Claim your listing or request edits via WhatsApp."}
        </p>
          <OwnerWhatsappCta
            action={isClaimed ? "edit" : "claim"}
            surface="provider_sidebar_claim_card"
            providerId={providerId}
            providerName={providerName}
            providerSlug={providerSlug}
            citySlug={citySlug}
            categorySlug={categorySlug}
            label={isClaimed ? "Edit via WhatsApp" : "Claim or edit via WhatsApp"}
            className="w-full"
          />
        {!isClaimed && (
            <Link
              href={`/claim/${providerId}`}
              onClick={() => trackProviderCta("claim_listing", "sidebar", provider)}
              className="mt-2 flex items-center justify-center w-full border border-black/[0.10] hover:border-[#006828]/25 text-[#1c1c1c] hover:text-[#006828] font-['Geist',sans-serif] font-medium text-sm py-3 rounded-full transition-colors"
            >
              Use claim form
            </Link>
          )}
      </div>
      <ConsumerAccountPrompt
        open={promptOpen}
        onClose={() => setPromptOpen(false)}
        title="Keep this clinic handy"
        message="Create a free account to save clinics, keep your recent calls, and continue your search later."
      />
    </>
  );
}
