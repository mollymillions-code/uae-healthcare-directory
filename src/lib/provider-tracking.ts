import { trackEvent } from "@/lib/gtag";

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
}
