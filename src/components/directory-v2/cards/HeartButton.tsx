"use client";

import { Heart } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import {
  addLocalSavedProviderId,
  getLocalSavedProviderIds,
  recordConsumerEvent,
  removeLocalSavedProviderId,
} from "@/lib/consumer-intent-client";
import { cn } from "../shared/cn";

interface HeartButtonProps {
  initial?: boolean;
  size?: "sm" | "md";
  onToggle?: (saved: boolean) => void;
  className?: string;
  ariaLabel?: string;
  /** Legacy local-only save mode. Use providerId instead for consumer-account integration. */
  storageKey?: string;
  /** Provider ID — when set, the heart syncs with the user's consumer account (or localStorage + prompt if anonymous). */
  providerId?: string;
  providerName?: string;
  /** Tracking surface name (e.g. "card_v2", "provider_detail"). */
  surface?: string;
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

/**
 * Optimistic-UI heart-save button. Animates on every click via the
 * CSS keyframe `animate-heart-pop`.
 *
 * Two modes:
 * - **Consumer-account mode** (preferred): pass `providerId`. Reads/writes
 *   `/api/account/saved-providers` for authenticated users, falls back to
 *   localStorage + signup prompt for anonymous users. Fires consumer events
 *   for analytics.
 * - **Legacy local-only mode**: pass `storageKey` only. Saves to localStorage
 *   without backend sync. Kept for backward compatibility with non-provider
 *   contexts.
 */
export function HeartButton({
  initial = false,
  size = "md",
  onToggle,
  className,
  ariaLabel = "Save provider",
  storageKey,
  providerId,
  providerName,
  surface = "heart_button",
}: HeartButtonProps) {
  const { status: sessionStatus } = useSession();
  const useConsumerAccount = Boolean(providerId);
  const normalizedStorageKey = useMemo(
    () => (useConsumerAccount ? null : storageKey?.replace(/[^a-zA-Z0-9:_-]/g, "-") ?? null),
    [storageKey, useConsumerAccount],
  );
  const [saved, setSaved] = useState(initial);
  const [animKey, setAnimKey] = useState(0);
  const [pending, setPending] = useState(false);

  // Consumer-account mode: hydrate saved state from API or local.
  useEffect(() => {
    if (!useConsumerAccount || !providerId) return;
    if (sessionStatus === "authenticated") {
      loadSavedProviderIds()
        .then((ids) => setSaved(ids.has(providerId)))
        .catch(() => undefined);
      return;
    }
    if (sessionStatus === "unauthenticated") {
      setSaved(getLocalSavedProviderIds().includes(providerId));
    }
  }, [providerId, sessionStatus, useConsumerAccount]);

  // Legacy local-storage mode.
  useEffect(() => {
    if (useConsumerAccount) return;
    if (!normalizedStorageKey || typeof window === "undefined") return;
    setSaved(window.localStorage.getItem(normalizedStorageKey) === "1");
  }, [normalizedStorageKey, useConsumerAccount]);

  const handleClick = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (pending) return;
      const next = !saved;
      setSaved(next);
      setAnimKey((k) => k + 1);

      if (useConsumerAccount && providerId) {
        setPending(true);
        try {
          await recordConsumerEvent({
            action: next ? "provider_save_click" : "provider_unsave_click",
            surface,
            providerId,
            entityType: "provider",
            entityName: providerName,
            ctaLabel: next ? "Save provider" : "Unsave provider",
          });

          if (sessionStatus === "authenticated") {
            if (next) {
              await fetch("/api/account/saved-providers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ providerId, source: surface }),
              });
              savedProviderIdsCache?.add(providerId);
            } else {
              await fetch(
                `/api/account/saved-providers?providerId=${encodeURIComponent(providerId)}`,
                { method: "DELETE" },
              );
              savedProviderIdsCache?.delete(providerId);
            }
          } else {
            // Anonymous user — keep save in localStorage. The global
            // PostActionAccountPrompt (mounted in src/app/layout.tsx) listens
            // to the recordConsumerEvent above and will surface the warm
            // "Enjoying Zavis?" modal subject to its 24h throttle.
            if (next) {
              addLocalSavedProviderId(providerId);
            } else {
              removeLocalSavedProviderId(providerId);
            }
          }
        } finally {
          setPending(false);
        }
      } else if (normalizedStorageKey && typeof window !== "undefined") {
        if (next) window.localStorage.setItem(normalizedStorageKey, "1");
        else window.localStorage.removeItem(normalizedStorageKey);
      }

      onToggle?.(next);
    },
    [
      normalizedStorageKey,
      onToggle,
      pending,
      providerId,
      providerName,
      saved,
      sessionStatus,
      surface,
      useConsumerAccount,
    ]
  );

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        aria-label={ariaLabel}
        aria-pressed={saved}
        className={cn(
          "inline-flex items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent-deep transition-transform",
          "active:scale-95 disabled:cursor-wait",
          className
        )}
      >
        <Heart
          key={animKey}
          className={cn(
            "animate-heart-pop drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]",
            size === "sm" ? "h-5 w-5" : "h-6 w-6",
            saved ? "fill-[#FF385C] text-[#FF385C]" : "fill-black/45 text-white"
          )}
          strokeWidth={2}
        />
      </button>
    </>
  );
}
