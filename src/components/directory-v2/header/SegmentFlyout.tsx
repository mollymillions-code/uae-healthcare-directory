"use client";

import { motion } from "framer-motion";
import { Check, Search as SearchIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { CITIES } from "@/lib/constants/cities";
import { CATEGORIES } from "@/lib/constants/categories";
import { INSURER_PROFILES } from "@/lib/constants/insurance-plans";
import { scaleIn } from "../shared/motion";
import { cn } from "../shared/cn";
import type { SearchSegment } from "./SearchPill";

interface SegmentFlyoutProps {
  segment: SearchSegment;
  value: string;
  onSelect: (val: string, label: string) => void;
  onClose: () => void;
}

export function SegmentFlyout({ segment, value, onSelect }: SegmentFlyoutProps) {
  const [query, setQuery] = useState("");

  const items = useMemo(() => {
    if (segment === "specialty") {
      return CATEGORIES.map((c) => ({ value: c.slug, label: c.name }));
    }
    if (segment === "city") {
      return CITIES.filter((c) => c.country === "ae").map((c) => ({ value: c.slug, label: c.name }));
    }
    if (segment === "insurance") {
      return INSURER_PROFILES.map((p) => ({ value: p.slug, label: p.name }));
    }
    return [];
  }, [segment]);

  const filtered = query
    ? items.filter((it) => it.label.toLowerCase().includes(query.toLowerCase()))
    : items;

  if (segment === "date") {
    return <DateFlyout value={value} onSelect={onSelect} />;
  }

  return (
    <motion.div
      variants={scaleIn}
      initial="hidden"
      animate="show"
      exit="exit"
      className="bg-white rounded-z-lg shadow-z-float border border-ink-line overflow-hidden"
      style={{ width: 420, maxHeight: 460 }}
    >
      <div className="p-3 border-b border-ink-line sticky top-0 bg-white z-10">
        <div className="flex items-center gap-2 bg-surface-cream rounded-z-pill px-4 py-2.5">
          <SearchIcon className="h-4 w-4 text-ink-muted" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${segment}…`}
            className="flex-1 bg-transparent outline-none font-sans text-z-body-sm text-ink placeholder:text-ink-muted"
          />
        </div>
      </div>
      <div className="overflow-y-auto" style={{ maxHeight: 388 }}>
        {filtered.length === 0 ? (
          <div className="p-6 text-center font-sans text-z-body-sm text-ink-muted">No matches</div>
        ) : (
          <ul className="py-2">
            {filtered.map((it) => {
              const isSelected = value === it.value || value === it.label;
              return (
                <li key={it.value}>
                  <button
                    type="button"
                    onClick={() => onSelect(it.value, it.label)}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-surface-cream transition-colors duration-z-fast",
                      isSelected && "bg-accent-muted"
                    )}
                  >
                    <span className="font-sans text-z-body text-ink">{it.label}</span>
                    {isSelected && <Check className="h-4 w-4 text-accent-dark" />}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </motion.div>
  );
}

function DateFlyout({ value, onSelect }: { value: string; onSelect: (v: string, l: string) => void }) {
  const presets = [
    { v: "today", l: "Today" },
    { v: "tomorrow", l: "Tomorrow" },
    { v: "this-week", l: "This week" },
    { v: "this-weekend", l: "This weekend" },
    { v: "next-week", l: "Next week" },
    { v: "flexible", l: "I'm flexible" },
  ];
  return (
    <motion.div
      variants={scaleIn}
      initial="hidden"
      animate="show"
      exit="exit"
      className="bg-white rounded-z-lg shadow-z-float border border-ink-line p-5"
      style={{ width: 360 }}
    >
      <p className="font-sans text-z-micro text-ink-muted uppercase tracking-[0.04em] mb-3">
        When do you need care?
      </p>
      <div className="grid grid-cols-2 gap-2">
        {presets.map((p) => {
          const isSelected = value === p.v || value === p.l;
          return (
            <button
              key={p.v}
              type="button"
              onClick={() => onSelect(p.v, p.l)}
              className={cn(
                "px-3 py-3 rounded-z-md border transition-colors duration-z-fast font-sans text-z-body-sm text-left",
                isSelected
                  ? "border-ink bg-ink text-white"
                  : "border-ink-line text-ink hover:border-ink hover:bg-surface-cream"
              )}
            >
              {p.l}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}
