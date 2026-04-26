"use client";

import { Heart } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { cn } from "../shared/cn";

interface HeartButtonProps {
  initial?: boolean;
  size?: "sm" | "md";
  onToggle?: (saved: boolean) => void;
  className?: string;
  ariaLabel?: string;
  storageKey?: string;
}

/**
 * Optimistic-UI heart-save button. Animates on every click via the
 * CSS keyframe `animate-heart-pop`. Fires onToggle after the visual flip.
 */
export function HeartButton({
  initial = false,
  size = "md",
  onToggle,
  className,
  ariaLabel = "Save provider",
  storageKey,
}: HeartButtonProps) {
  const normalizedStorageKey = useMemo(
    () => storageKey?.replace(/[^a-zA-Z0-9:_-]/g, "-"),
    [storageKey],
  );
  const [saved, setSaved] = useState(initial);
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    if (!normalizedStorageKey || typeof window === "undefined") return;
    setSaved(window.localStorage.getItem(normalizedStorageKey) === "1");
  }, [normalizedStorageKey]);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const next = !saved;
      setSaved(next);
      if (normalizedStorageKey && typeof window !== "undefined") {
        if (next) window.localStorage.setItem(normalizedStorageKey, "1");
        else window.localStorage.removeItem(normalizedStorageKey);
      }
      setAnimKey((k) => k + 1);
      onToggle?.(next);
    },
    [normalizedStorageKey, onToggle, saved]
  );

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={ariaLabel}
      aria-pressed={saved}
      className={cn(
        "inline-flex items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent-deep transition-transform",
        "active:scale-95",
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
  );
}
