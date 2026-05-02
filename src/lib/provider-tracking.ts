import { trackEvent } from "@/lib/gtag";
import { recordConsumerEvent } from "@/lib/consumer-intent-client";

export type CtaType = "call" | "whatsapp" | "directions" | "website" | "claim_listing";
export type CtaSurface = "sidebar" | "sticky_mobile_cta";

export interface ProviderTrackingInfo {
  name: string;
  slug: string;
  citySlug: string;
  categorySlug: string;
  id: string;
  isClaimed: boolean;
}

const CTA_TO_CONSUMER_ACTION: Record<CtaType, string> = {
  call: "provider_call_click",
  whatsapp: "provider_whatsapp_click",
  directions: "provider_directions_click",
  website: "provider_website_click",
  claim_listing: "provider_claim_click",
};

export function trackProviderCta(
  ctaType: CtaType,
  surface: CtaSurface,
  provider: ProviderTrackingInfo,
) {
  trackEvent("cta_click", {
    cta_type: ctaType,
    surface,
    provider_name: provider.name,
    provider_slug: provider.slug,
    directory_city: provider.citySlug,
    directory_category: provider.categorySlug,
    provider_id: provider.id,
    is_claimed: provider.isClaimed,
    cta_location: surface,
    content_type: "provider-listing",
    funnel_stage: "conversion",
  });

  // Also dispatch the consumer-account event bus so the global
  // PostActionAccountPrompt can surface the "Enjoying Zavis?" modal,
  // and so the action is recorded against the anonymous_id for
  // attribution-on-signup.
  recordConsumerEvent({
    action: CTA_TO_CONSUMER_ACTION[ctaType],
    surface,
    providerId: provider.id,
    entityType: "provider",
    entitySlug: provider.slug,
    entityName: provider.name,
    ctaLabel: ctaType,
  }).catch(() => undefined);
}
