"use client";

import { Heart } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
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
  const useConsumerAccount = Boolean(providerId);
  const normalizedStorageKey = useMemo(
    () => (useConsumerAccount ? null : storageKey?.replace(/[^a-zA-Z0-9:_-]/g, "-") ?? null),
    [storageKey, useConsumerAccount],
  );
  const [saved, setSaved] = useState(initial);
  const [animKey, setAnimKey] = useState(0);
  const [pending, setPending] = useState(false);

  // Consumer-account mode: render local state immediately. Authenticated saved
  // state is hydrated lazily after the first paint so directory pages do not
  // load NextAuth/session code on the critical path.
  useEffect(() => {
    if (!useConsumerAccount || !providerId) return;
    setSaved(getLocalSavedProviderIds().includes(providerId));

    let cancelled = false;
    const hydrate = () => {
      loadSavedProviderIds()
        .then((ids) => {
          if (!cancelled && ids.size > 0) setSaved(ids.has(providerId));
        })
        .catch(() => undefined);
    };
    const timer = window.setTimeout(hydrate, 4000);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [providerId, useConsumerAccount]);

  const persistLocalProvider = useCallback((next: boolean) => {
    if (!providerId) return;
    if (next) {
      addLocalSavedProviderId(providerId);
    } else {
      removeLocalSavedProviderId(providerId);
    }
  }, [providerId]);

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

          const response = next
            ? await fetch("/api/account/saved-providers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ providerId, source: surface }),
              })
            : await fetch(
                `/api/account/saved-providers?providerId=${encodeURIComponent(providerId)}`,
                { method: "DELETE" },
              );

          if (response.ok) {
            if (next) savedProviderIdsCache?.add(providerId);
            else savedProviderIdsCache?.delete(providerId);
          } else if (response.status === 401) {
            // Anonymous user — keep save in localStorage. The global
            // PostActionAccountPrompt listens to the event above and surfaces
            // the warm account prompt after the primary action goes through.
            persistLocalProvider(next);
          } else {
            // If account sync fails for a transient backend reason, retain a
            // local save so the UI does not lose the user's intent.
            persistLocalProvider(next);
            if (next) {
              savedProviderIdsCache?.add(providerId);
            } else {
              savedProviderIdsCache?.delete(providerId);
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
      persistLocalProvider,
      providerId,
      providerName,
      saved,
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
