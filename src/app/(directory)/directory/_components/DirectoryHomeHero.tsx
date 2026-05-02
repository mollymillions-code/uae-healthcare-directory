"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { SearchControls } from "@/app/(directory)/search/_components/SearchControls";
import { fadeUp, staggerContainer } from "@/components/directory-v2/shared/motion";

interface Props {
  totalProviders: number;
}

const QUICK_CHIPS = [
  { label: "Dental clinics in Dubai", href: "/directory/dubai/dental-clinics" },
  { label: "Pediatrics in Abu Dhabi", href: "/directory/abu-dhabi/pediatrics" },
  { label: "Dermatology in Sharjah", href: "/directory/sharjah/dermatology" },
  { label: "24-hour clinics", href: "/directory/dubai/24-hour" },
];

/**
 * Hero for /directory home — warm gradient backdrop, big editorial headline,
 * the unified `SearchControls` component (same one used on /search) as the
 * hero protagonist, quick-search chips below as supplementary affordance.
 *
 * Submitting any field on `SearchControls` navigates to /search with the
 * applied params, so the home hero is now a true entry point into the
 * search flow rather than a separate UI archetype.
 */
export function DirectoryHomeHero({ totalProviders }: Props) {
  return (
    <section className="relative overflow-hidden bg-surface-cream">
      {/* Ambient gradient blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -right-40 h-[540px] w-[540px] rounded-full bg-[radial-gradient(closest-side,rgba(0,200,83,0.22),transparent_70%)]" />
        <div className="absolute top-10 -left-32 h-[420px] w-[420px] rounded-full bg-[radial-gradient(closest-side,rgba(255,176,120,0.32),transparent_70%)]" />
      </div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="relative max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-20 pb-16 sm:pb-24 text-center"
      >
        <motion.div variants={fadeUp} className="inline-flex items-center gap-2 rounded-z-pill bg-white/85 backdrop-blur border border-ink-line pl-1 pr-3 py-1 mb-6 shadow-z-card">
          <span className="inline-flex items-center gap-1 rounded-z-pill bg-accent text-white text-[10px] font-semibold uppercase tracking-[0.06em] px-2 py-0.5">
            <Sparkles className="h-3 w-3" /> New
          </span>
          <span className="font-sans text-z-body-sm text-ink-soft">
            UAE-licensed · Verified
          </span>
        </motion.div>

        <motion.h1
          variants={fadeUp}
          className="font-display font-semibold text-ink text-[44px] xs:text-[52px] sm:text-[64px] lg:text-display-xl leading-[1.02] tracking-[-0.035em] max-w-[14ch] mx-auto"
        >
          Find trusted care,
          <br />
          <span className="italic font-normal text-accent-dark">anywhere</span>{" "}
          in the UAE.
        </motion.h1>

        <motion.p
          variants={fadeUp}
          className="font-sans text-ink-soft text-z-body sm:text-[17px] mt-5 max-w-xl mx-auto leading-relaxed"
        >
          Browse{" "}
          <span className="font-semibold text-ink">{totalProviders.toLocaleString()}+ licensed providers</span>{" "}
          across 8 cities and 26 specialties — sourced from official government registers. Free. Open. No paywall.
        </motion.p>

        {/* Unified search — same component as /search so the experience is
            consistent. Submitting navigates to /search with applied params. */}
        <motion.div variants={fadeUp} className="mt-10 text-left">
          <SearchControls
            initialQuery=""
            initialCity=""
            initialSpecialty=""
            initialCondition=""
            initialInsurance=""
            initialLanguage=""
            initialEntityType="both"
            initialEmergency={false}
            totalResults={totalProviders}
          />
        </motion.div>

        {/* Popular quick-links — supplementary one-click destinations to
            common combos that take more steps via the filter chips. */}
        <motion.div variants={fadeUp} className="mt-8 flex flex-wrap items-center justify-center gap-2">
          <span className="font-sans text-z-caption text-ink-muted mr-1">Popular:</span>
          {QUICK_CHIPS.map((q) => (
            <Link
              key={q.href}
              href={q.href}
              className="inline-flex items-center rounded-z-pill bg-white border border-ink-hairline px-3.5 py-1.5 font-sans text-z-body-sm text-ink hover:border-ink transition-colors duration-z-fast"
            >
              {q.label}
            </Link>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}
