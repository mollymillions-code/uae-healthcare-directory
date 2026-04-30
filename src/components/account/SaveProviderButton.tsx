"use client";

import { useEffect, useState } from "react";
import { Bookmark } from "lucide-react";
import { useSession } from "next-auth/react";
import {
  addLocalSavedProviderId,
  getLocalSavedProviderIds,
  recordConsumerEvent,
  removeLocalSavedProviderId,
} from "@/lib/consumer-intent-client";
import { ConsumerAccountPrompt } from "@/components/account/ConsumerAccountPrompt";

interface SaveProviderButtonProps {
  providerId: string;
  providerName: string;
  surface: string;
  className?: string;
  compact?: boolean;
}

let savedProviderIdsCache: Set<string> | null = null;
let savedProviderIdsPromise: Promise<Set<string>> | null = null;

async function loadSavedProviderIds(): Promise<Set<string>> {
  if (savedProviderIdsCache) return savedProviderIdsCache;
  if (!savedProviderIdsPromise) {
    savedProviderIdsPromise = fetch("/api/account/saved-providers")
      .then((res) => (res.ok ? res.json() : { providers: [] }))
      .then((data) => {
        const providers = Array.isArray(data?.providers) ? data.providers : [];
        savedProviderIdsCache = new Set(
          providers.map((item: { providerId: string }) => item.providerId)
        );
        return savedProviderIdsCache;
      })
      .catch(() => {
        savedProviderIdsCache = new Set();
        return savedProviderIdsCache;
      });
  }
  return savedProviderIdsPromise;
}

export function SaveProviderButton({
  providerId,
  providerName,
  surface,
  className = "",
  compact = false,
}: SaveProviderButtonProps) {
  const { status } = useSession();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [promptOpen, setPromptOpen] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      loadSavedProviderIds()
        .then((ids) => setSaved(ids.has(providerId)))
        .catch(() => undefined);
      return;
    }
    setSaved(getLocalSavedProviderIds().includes(providerId));
  }, [providerId, status]);

  async function handleClick(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (loading) return;
    setLoading(true);

    await recordConsumerEvent({
      action: saved ? "provider_unsave_click" : "provider_save_click",
      surface,
      providerId,
      entityType: "provider",
      entityName: providerName,
      ctaLabel: saved ? "Unsave provider" : "Save provider",
    });

    if (status === "authenticated") {
      if (saved) {
        await fetch(`/api/account/saved-providers?providerId=${encodeURIComponent(providerId)}`, {
          method: "DELETE",
        });
        savedProviderIdsCache?.delete(providerId);
        setSaved(false);
      } else {
        await fetch("/api/account/saved-providers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ providerId, source: surface }),
        });
        savedProviderIdsCache?.add(providerId);
        setSaved(true);
      }
    } else {
      if (saved) {
        removeLocalSavedProviderId(providerId);
        setSaved(false);
      } else {
        addLocalSavedProviderId(providerId);
        setSaved(true);
        setPromptOpen(true);
      }
    }

    setLoading(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        aria-pressed={saved}
        aria-label={`${saved ? "Remove saved provider" : "Save provider"} ${providerName}`}
        className={`inline-flex items-center justify-center gap-1.5 rounded-full border font-['Geist',sans-serif] font-semibold transition-colors disabled:cursor-wait disabled:opacity-70 ${
          saved
            ? "border-[#006828]/25 bg-[#006828]/[0.08] text-[#006828]"
            : "border-black/[0.10] bg-white text-black/55 hover:border-[#006828]/25 hover:text-[#006828]"
        } ${compact ? "h-8 px-2.5 text-xs" : "px-4 py-2 text-sm"} ${className}`}
      >
        <Bookmark className={`${compact ? "h-3.5 w-3.5" : "h-4 w-4"} ${saved ? "fill-current" : ""}`} aria-hidden="true" />
        {!compact && <span>{saved ? "Saved" : "Save"}</span>}
      </button>
      <ConsumerAccountPrompt
        open={promptOpen}
        onClose={() => setPromptOpen(false)}
        title="Provider saved"
        message="Create a free account to keep saved clinics across your phone, laptop, and future searches."
      />
    </>
  );
}
