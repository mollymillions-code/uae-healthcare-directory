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

  const markCopied = useCallback(() => {
    setCopied(true);
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    resetTimerRef.current = setTimeout(() => setCopied(false), 1600);
  }, []);

  const copyText = useCallback(async (value: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      // Continue to the textarea fallback below.
    }

    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.top = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    try {
      return document.execCommand("copy");
    } catch {
      return false;
    } finally {
      document.body.removeChild(textarea);
    }
  }, []);

  const handleShare = useCallback(async () => {
    const url = window.location.href;
    const shareText = text ?? title;
    const canUseNativeShare =
      typeof navigator.share === "function" &&
      /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    try {
      if (canUseNativeShare) {
        await navigator.share({ title, text: shareText, url });
        markCopied();
        return;
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
    }

    if (await copyText(url)) {
      markCopied();
      return;
    }

    window.location.href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${shareText}\n${url}`)}`;
  }, [copyText, markCopied, text, title]);

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
