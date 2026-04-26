"use client";

import { useCallback, useRef, useState } from "react";
import { Share2 } from "lucide-react";
import { cn } from "../shared/cn";

interface ShareButtonProps {
  title: string;
  text?: string;
  className?: string;
}

export function ShareButton({ title, text, className }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleShare = useCallback(async () => {
    const url = window.location.href;
    const shareText = text ?? title;

    try {
      if (navigator.share) {
        await navigator.share({ title, text: shareText, url });
        return;
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
      resetTimerRef.current = setTimeout(() => setCopied(false), 1600);
    } catch {
      window.location.href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${shareText}\n${url}`)}`;
    }
  }, [text, title]);

  return (
    <button
      type="button"
      onClick={handleShare}
      aria-label={`Share ${title}`}
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-z-pill hover:bg-surface-cream font-sans text-z-body-sm text-ink",
        className
      )}
    >
      <Share2 className="h-3.5 w-3.5" strokeWidth={2.5} />
      <span className="hidden sm:inline" aria-live="polite">
        {copied ? "Copied" : "Share"}
      </span>
    </button>
  );
}
