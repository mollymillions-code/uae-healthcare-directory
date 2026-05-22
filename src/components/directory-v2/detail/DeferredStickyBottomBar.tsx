"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { CtaType } from "@/lib/provider-tracking";

const StickyBottomBar = dynamic(
  () => import("./StickyBottomBar").then((mod) => mod.StickyBottomBar),
  { ssr: false },
);

interface DeferredStickyBottomBarProps {
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
  ctaType?: CtaType;
}

export function DeferredStickyBottomBar(props: DeferredStickyBottomBarProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const enable = () => setReady(true);
    const timer = window.setTimeout(enable, 2200);
    window.addEventListener("scroll", enable, { once: true, passive: true });
    window.addEventListener("pointerdown", enable, { once: true, passive: true });
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("scroll", enable);
      window.removeEventListener("pointerdown", enable);
    };
  }, []);

  return ready ? <StickyBottomBar {...props} /> : null;
}

