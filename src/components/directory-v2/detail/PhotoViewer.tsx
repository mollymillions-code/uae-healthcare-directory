"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect } from "react";
import { X, Share2 } from "lucide-react";
import { HeartButton } from "../cards/HeartButton";
import { fade, scaleIn, tStandard } from "../shared/motion";
import { cn } from "../shared/cn";

interface PhotoViewerProps {
  open: boolean;
  onClose: () => void;
  photos: string[];
  startIndex?: number;
  alt: string;
}

/**
 * Full-screen photo viewer modal. White background (preserves interior-photo
 * colour), vertical scrolling column. Keyboard: arrows jump photo-to-photo,
 * Esc closes. Share + Save icons in header.
 */
export function PhotoViewer({ open, onClose, photos, startIndex = 0, alt }: PhotoViewerProps) {
  useEffect(() => {
    if (!open) return;
    document.body.setAttribute("data-modal-open", "true");
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.removeAttribute("data-modal-open");
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  // Scroll to the starting photo once opened
  useEffect(() => {
    if (!open) return;
    const el = document.getElementById(`photo-viewer-${startIndex}`);
    if (el) setTimeout(() => el.scrollIntoView({ behavior: "instant", block: "start" }), 0);
  }, [open, startIndex]);

  const handleShare = useCallback(async () => {
    try {
      await navigator.share?.({ url: window.location.href, title: alt });
    } catch {
      /* user cancelled or unsupported */
    }
  }, [alt]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={`${alt} photo viewer`}
          className="fixed inset-0 z-[120] bg-white"
          variants={fade}
          initial="hidden"
          animate="show"
          exit="exit"
          transition={tStandard}
        >
          <header className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-ink-line">
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
              <button
                type="button"
                onClick={onClose}
                aria-label="Close viewer"
                className="p-2 rounded-full hover:bg-surface-cream transition-colors"
              >
                <X className="h-5 w-5 text-ink" />
              </button>
              <span className="font-sans text-z-body-sm text-ink-soft">
                {photos.length > 0 ? `Photos of ${alt}` : "Photos"}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleShare}
                  className="p-2 rounded-full hover:bg-surface-cream transition-colors flex items-center gap-1 font-sans text-z-body-sm text-ink"
                >
                  <Share2 className="h-4 w-4" strokeWidth={2.5} />
                  <span className="hidden sm:inline">Share</span>
                </button>
                <div className="p-2 rounded-full hover:bg-surface-cream transition-colors">
                  <HeartButton size="sm" ariaLabel={`Save ${alt}`} storageKey={`zavis:saved:${alt}`} />
                </div>
              </div>
            </div>
          </header>

          <motion.div
            variants={scaleIn}
            className="overflow-y-auto"
            style={{ height: "calc(100vh - 60px)" }}
          >
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 flex flex-col gap-10">
              {photos.map((src, i) => (
                <div
                  key={src + i}
                  id={`photo-viewer-${i}`}
                  className={cn("relative w-full rounded-z-md overflow-hidden bg-ink-line aspect-[4/3]")}
                >
                  <Image
                    src={src}
                    alt={`${alt} photo ${i + 1}`}
                    fill
                    sizes="(max-width: 768px) 100vw, 1200px"
                    className="object-contain"
                  />
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
