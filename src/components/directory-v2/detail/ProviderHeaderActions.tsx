"use client";

import { ShareButton } from "./ShareButton";
import { HeartButton } from "../cards/HeartButton";

interface ProviderHeaderActionsProps {
  providerId: string;
  providerName: string;
  providerSlug: string;
  citySlug: string;
  categorySlug: string;
  cityName?: string | null;
}

export function ProviderHeaderActions({
  providerId,
  providerName,
  providerSlug,
  cityName,
}: ProviderHeaderActionsProps) {
  return (
    <div className="flex items-center gap-1 flex-shrink-0">
      <ShareButton title={providerName} text={`${providerName}${cityName ? ` in ${cityName}` : ""}`} />
      <div className="inline-flex items-center gap-1.5 px-2 py-1.5 rounded-z-pill hover:bg-surface-cream">
        <HeartButton
          size="sm"
          ariaLabel={`Save ${providerName}`}
          providerId={providerId}
          providerName={providerName}
          surface="provider_detail"
          storageKey={providerId ? undefined : `zavis:saved:${providerSlug}`}
        />
        <span className="hidden sm:inline font-sans text-z-body-sm text-ink">Save</span>
      </div>
    </div>
  );
}
