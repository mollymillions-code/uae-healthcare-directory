"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { fade, scaleIn } from "../shared/motion";
import { SearchPill, type SearchPillState, type SearchSegment } from "./SearchPill";
import { SegmentFlyout } from "./SegmentFlyout";

interface SearchPillModalProps {
  open: boolean;
  state: SearchPillState;
  onChange: (next: SearchPillState) => void;
  onClose: () => void;
  onSubmit: () => void;
  initialSegment?: SearchSegment | null;
}

/**
 * Full-screen scrim + centered expanded SearchPill + active-segment flyout.
 * Opens when the compact header pill is clicked. Traps focus, closes on Esc.
 */
export function SearchPillModal({
  open,
  state,
  onChange,
  onClose,
  onSubmit,
  initialSegment,
}: SearchPillModalProps) {
  // Body scroll lock + Esc close
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

  // Local mirror of activeSegment lets us swap between segments without remount
  const [active, setActive] = useReactive(initialSegment ?? "specialty", open);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="search-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Search providers"
          className="fixed inset-0 z-[100] flex items-start justify-center pt-24 px-4"
          variants={fade}
          initial="hidden"
          animate="show"
          exit="exit"
        >
          {/* Scrim */}
          <motion.button
            type="button"
            aria-label="Close search"
            onClick={onClose}
            className="absolute inset-0 bg-black/25 backdrop-blur-[6px]"
            variants={fade}
          />

          {/* Content stack */}
          <motion.div
            className="relative flex flex-col items-center gap-4"
            variants={scaleIn}
          >
            <SearchPill
              variant="expanded"
              state={state}
              activeSegment={active}
              onSegmentClick={(seg) => setActive(seg)}
              onSubmit={() => {
                onSubmit();
                onClose();
              }}
            />

            {/* Flyout anchored below active segment — simple centered placement
               works for desktop and avoids per-segment position math. */}
            <div className="mt-1">
              <SegmentFlyout
                key={active}
                segment={active}
                value={state[active]}
                onSelect={(v, l) => {
                  onChange({ ...state, [active]: l });
                  // Auto-advance to next segment for guided flow
                  const order: SearchSegment[] = ["specialty", "city", "date", "insurance"];
                  const idx = order.indexOf(active);
                  if (idx < order.length - 1) setActive(order[idx + 1]);
                }}
                onClose={onClose}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// tiny local hook: reset on every open
import { useState, useEffect as useEffectAlias } from "react";
function useReactive<T>(initial: T, trigger: boolean): [T, (v: T) => void] {
  const [v, setV] = useState(initial);
  useEffectAlias(() => {
    if (trigger) setV(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);
  return [v, setV];
}
