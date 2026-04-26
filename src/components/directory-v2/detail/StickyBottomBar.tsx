"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Star } from "lucide-react";
import { slideUp } from "../shared/motion";
import { trackProviderCta, type CtaType } from "@/lib/provider-tracking";

interface StickyBottomBarProps {
  /** ID of the sticky sidebar element — when it scrolls out of view, this bar appears. */
  watchElementId: string;
  providerName: string;
  providerId?: string;
  providerSlug?: string;
  citySlug?: string;
  categorySlug?: string;
  isClaimed?: boolean | null;
  googleRating?: string | number | null;
  googleReviewCount?: number | null;
  ctaLabel: string;
  ctaHref: string;
  /** CTA type for analytics classification. */
  ctaType?: CtaType;
}

/**
 * Fixed-bottom bar that slides up when the sticky booking card exits the
 * viewport. Preserves the provider's primary CTA destination.
 */
export function StickyBottomBar({
  watchElementId,
  providerName,
  providerId,
  providerSlug,
  citySlug,
  categorySlug,
  isClaimed,
  googleRating,
  googleReviewCount,
  ctaLabel,
  ctaHref,
  ctaType = "call",
}: StickyBottomBarProps) {
  const handleClick = () => {
    if (!providerId || !providerSlug || !citySlug || !categorySlug) return;
    trackProviderCta(ctaType, "sticky_mobile_cta", {
      name: providerName,
      slug: providerSlug,
      citySlug,
      categorySlug,
      id: providerId,
      isClaimed: !!isClaimed,
    });
  };
  const [visible, setVisible] = useState(false);
  const obsRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const target = document.getElementById(watchElementId);
    if (!target) return;
    obsRef.current?.disconnect();
    const obs = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0, rootMargin: "0px 0px -100px 0px" }
    );
    obs.observe(target);
    obsRef.current = obs;
    return () => obs.disconnect();
  }, [watchElementId]);

  const rating = googleRating ? Number(googleRating) : 0;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="sbb"
          role="complementary"
          aria-label={`Book ${providerName}`}
          variants={slideUp}
          initial="hidden"
          animate="show"
          exit="exit"
          className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-ink-line shadow-z-sticky lg:hidden"
        >
          <div className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="font-sans font-semibold text-ink text-z-body-sm truncate">{providerName}</p>
              {rating > 0 && (
                <p className="font-sans text-z-caption text-ink-soft mt-0.5 inline-flex items-center gap-1">
                  <Star className="h-3 w-3 fill-ink text-ink" />
                  {rating.toFixed(2)}
                  {googleReviewCount ? <span className="text-ink-muted"> · {googleReviewCount} reviews</span> : null}
                </p>
              )}
            </div>
            <Link
              href={ctaHref}
              onClick={handleClick}
              target={ctaHref.startsWith("http") ? "_blank" : undefined}
              rel={ctaHref.startsWith("http") ? "noopener" : undefined}
              className="bg-accent hover:bg-accent-dark text-white rounded-z-pill px-5 py-2.5 font-sans font-semibold text-z-body-sm whitespace-nowrap transition-colors flex-shrink-0"
            >
              {ctaLabel}
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
