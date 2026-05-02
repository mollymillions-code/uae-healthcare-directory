"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "../shared/cn";

export interface CategoryRailItem {
  slug: string;
  name: string;
  count?: number;
  icon: React.ReactNode;
  href: string;
}

interface CategoryRailProps {
  items: CategoryRailItem[];
  activeSlug?: string;
  className?: string;
  /** Called to select without navigation (filter contexts). */
  onSelect?: (slug: string) => void;
}

/**
 * Short-label map for categories whose full names are verbose.
 * Keeps rail tiles to ~1–2 words so the horizontal-scroll intent reads clearly.
 */
const SHORT_LABELS: Record<string, string> = {
  hospitals: "Hospitals",
  clinics: "Clinics",
  "general-clinics-polyclinics": "Clinics",
  "dental-clinics": "Dental",
  dental: "Dental",
  dentists: "Dental",
  dermatology: "Skin",
  pediatrics: "Pediatrics",
  cardiology: "Heart",
  ophthalmology: "Eye",
  ent: "ENT",
  orthopedics: "Ortho",
  "mental-health": "Mental health",
  "general-medicine": "GP",
  gynecology: "Women's",
  fertility: "Fertility",
  pharmacy: "Pharmacy",
  laboratory: "Labs",
  aesthetic: "Aesthetic",
  aesthetics: "Aesthetic",
  "alternative-medicine": "Alt. medicine",
  endocrinology: "Endocrine",
  gastroenterology: "Digestive",
  "home-healthcare": "Home care",
  "medical-equipment": "Equipment",
  nephrology: "Kidney",
  "physiotherapy-rehabilitation": "Physio",
  physiotherapy: "Physio",
};

function short(slug: string, fallback: string): string {
  return SHORT_LABELS[slug] ?? fallback.split(/[&·]/)[0].trim();
}

/**
 * Horizontal chip-rail of category pills. Hidden scrollbar, auto-appearing
 * scroll arrows with edge-fade gradients. Active chip gets solid-black fill
 * (Airbnb's applied-state pattern) so clickability is unambiguous.
 */
export function CategoryRail({ items, activeSlug, className, onSelect }: CategoryRailProps) {
  const railRef = useRef<HTMLDivElement | null>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);

  const recalc = useCallback(() => {
    const el = railRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    recalc();
    const el = railRef.current;
    if (!el) return;
    el.addEventListener("scroll", recalc, { passive: true });
    window.addEventListener("resize", recalc);
    return () => {
      el.removeEventListener("scroll", recalc);
      window.removeEventListener("resize", recalc);
    };
  }, [recalc]);

  const scroll = (dir: 1 | -1) => () => {
    const el = railRef.current;
    if (!el) return;
    const page = el.clientWidth * 0.8;
    el.scrollBy({ left: page * dir, behavior: "smooth" });
  };

  return (
    <div className={cn("relative group", className)}>
      {canLeft && (
        <button
          type="button"
          onClick={scroll(-1)}
          aria-label="Scroll categories left"
          className={cn(
            "absolute left-2 top-1/2 -translate-y-1/2 z-10 h-7 w-7 rounded-full bg-white border border-ink-hairline",
            "shadow-[0_2px_8px_rgba(0,0,0,0.12)] flex items-center justify-center hover:bg-surface-cream transition-colors"
          )}
        >
          <ChevronLeft className="h-3.5 w-3.5 text-ink" strokeWidth={2.5} />
        </button>
      )}
      {canRight && (
        <button
          type="button"
          onClick={scroll(1)}
          aria-label="Scroll categories right"
          className={cn(
            "absolute right-2 top-1/2 -translate-y-1/2 z-10 h-7 w-7 rounded-full bg-white border border-ink-hairline",
            "shadow-[0_2px_8px_rgba(0,0,0,0.12)] flex items-center justify-center hover:bg-surface-cream transition-colors"
          )}
        >
          <ChevronRight className="h-3.5 w-3.5 text-ink" strokeWidth={2.5} />
        </button>
      )}

      {/* Edge fades */}
      {canLeft && (
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-surface-cream to-transparent z-[5]" />
      )}
      {canRight && (
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-surface-cream to-transparent z-[5]" />
      )}

      <div
        ref={railRef}
        className={cn(
          "flex items-center gap-2 overflow-x-auto z-no-scrollbar",
          "px-3 sm:px-4 py-2.5"
        )}
        style={{ scrollSnapType: "x proximity" }}
      >
        {items.map((item) => {
          const isActive = activeSlug === item.slug;
          const label = short(item.slug, item.name);

          const chipClass = cn(
            "group/chip flex-shrink-0 inline-flex items-center gap-1.5 rounded-z-pill px-3 py-1.5",
            "font-sans text-z-body-sm whitespace-nowrap border transition-colors duration-z-fast",
            isActive
              ? "bg-ink text-white border-ink shadow-z-card"
              : "bg-white text-ink border-ink-hairline hover:border-ink"
          );

          const children = (
            <>
              <span
                className={cn(
                  "flex items-center justify-center h-4 w-4",
                  isActive ? "text-white" : "text-ink-soft group-hover/chip:text-ink"
                )}
              >
                {item.icon}
              </span>
              <span className="font-medium">{label}</span>
              {typeof item.count === "number" && item.count > 0 && (
                <span
                  className={cn(
                    "font-normal",
                    isActive ? "text-white/70" : "text-ink-muted"
                  )}
                >
                  {item.count}
                </span>
              )}
            </>
          );

          if (onSelect) {
            return (
              <button
                key={item.slug}
                type="button"
                onClick={() => onSelect(item.slug)}
                className={chipClass}
                style={{ scrollSnapAlign: "start" }}
                aria-pressed={isActive}
              >
                {children}
              </button>
            );
          }

          return (
            <Link
              key={item.slug}
              href={item.href}
              className={chipClass}
              style={{ scrollSnapAlign: "start" }}
              aria-current={isActive ? "page" : undefined}
            >
              {children}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
