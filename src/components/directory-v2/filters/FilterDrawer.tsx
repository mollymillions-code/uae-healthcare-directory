"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect } from "react";
import { fade, slideInRight, tStandard } from "../shared/motion";

interface FilterDrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  /** How many providers match the current filter combo (live-updated). */
  matchCount?: number;
  /** Reset all filters. */
  onClearAll?: () => void;
  /** Submit / close with current filters applied. */
  onSubmit?: () => void;
  children: React.ReactNode;
}

/**
 * Right-side drawer with a sticky footer containing "Clear all" + apply CTA.
 * Live match count updates as children filters change.
 */
export function FilterDrawer({
  open,
  onClose,
  title = "Filters",
  matchCount,
  onClearAll,
  onSubmit,
  children,
}: FilterDrawerProps) {
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

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[95]"
          variants={fade}
          initial="hidden"
          animate="show"
          exit="exit"
          transition={tStandard}
        >
          {/* Scrim */}
          <motion.button
            type="button"
            aria-label="Close filters"
            onClick={onClose}
            className="absolute inset-0 bg-black/35"
            variants={fade}
          />

          {/* Drawer */}
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label={title}
            variants={slideInRight}
            className="absolute right-0 top-0 h-full w-[min(92vw,568px)] bg-white shadow-z-float flex flex-col"
          >
            <header className="flex items-center justify-between px-6 py-5 border-b border-ink-line">
              <h2 className="font-display font-semibold text-ink text-z-h2">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="p-2 rounded-full hover:bg-surface-cream"
              >
                <X className="h-5 w-5 text-ink" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-8">{children}</div>

            <footer className="flex items-center justify-between px-6 py-4 border-t border-ink-line bg-white">
              <button
                type="button"
                onClick={onClearAll}
                className="font-sans font-semibold text-z-body-sm text-ink underline underline-offset-2 hover:text-ink-soft"
              >
                Clear all
              </button>
              <button
                type="button"
                onClick={() => {
                  onSubmit?.();
                  onClose();
                }}
                className="font-sans font-semibold text-z-body-sm bg-accent hover:bg-accent-dark text-white px-5 py-3 rounded-z-md transition-colors"
              >
                {typeof matchCount === "number" ? `Show ${matchCount.toLocaleString()} providers` : "Apply filters"}
              </button>
            </footer>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
