/**
 * Shared Framer Motion variants + easing constants for directory-v2 components.
 * Keep this file small and boring. Every component pulls from the same vocabulary.
 */
import type { Variants, Transition } from "framer-motion";

// Canonical easing curves — must match CSS custom properties in globals.css
export const EASE_STANDARD = [0.2, 0, 0, 1] as const;
export const EASE_EXIT = [0.4, 0, 1, 1] as const;
export const EASE_OVERSHOOT = [0.17, 0.67, 0.3, 1.33] as const;

// Canonical durations in seconds (Framer uses seconds, CSS uses ms)
export const DUR_FAST = 0.15;
export const DUR_BASE = 0.2;
export const DUR_MED = 0.3;
export const DUR_SLOW = 0.45;

// Standard transition — use everywhere that doesn't need something special
export const tStandard: Transition = { duration: DUR_BASE, ease: EASE_STANDARD };
export const tMed: Transition = { duration: DUR_MED, ease: EASE_STANDARD };
export const tExit: Transition = { duration: DUR_FAST, ease: EASE_EXIT };

// Fade up (card / section entrance)
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: tMed },
};

// Fade only (modal backdrop)
export const fade: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: tStandard },
  exit: { opacity: 0, transition: tExit },
};

// Scale+fade (modal content)
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.26, ease: EASE_STANDARD } },
  exit: { opacity: 0, scale: 0.98, transition: { duration: 0.18, ease: EASE_EXIT } },
};

// Slide up from bottom (sticky bottom bar)
export const slideUp: Variants = {
  hidden: { y: "100%" },
  show: { y: 0, transition: { duration: 0.22, ease: EASE_STANDARD } },
  exit: { y: "100%", transition: tExit },
};

// Slide in from right (filter drawer)
export const slideInRight: Variants = {
  hidden: { x: "100%" },
  show: { x: 0, transition: { duration: DUR_MED, ease: EASE_STANDARD } },
  exit: { x: "100%", transition: { duration: DUR_BASE, ease: EASE_EXIT } },
};

// Stagger container (reveal children in sequence)
export const staggerContainer: Variants = {
  hidden: { opacity: 1 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.02,
    },
  },
};

// Heart pop keyframes — for Framer version (CSS version also exists in globals.css)
export const heartPop: Variants = {
  idle: { scale: 1 },
  pop: {
    scale: [1, 1.25, 0.9, 1.08, 1],
    transition: { duration: DUR_SLOW, ease: EASE_OVERSHOOT, times: [0, 0.3, 0.55, 0.8, 1] },
  },
};
