"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Fires Meta Pixel PageView and GTM virtual_pageview on Next.js soft navigations.
 * The initial hard page load is handled by layout.tsx scripts.
 * This component catches all subsequent client-side route changes
 * that Next.js App Router handles without a full page reload.
 */
export function RouteChangeTracker() {
  const pathname = usePathname();
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Skip first render — layout.tsx already fires PageView on initial load
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Meta Pixel PageView on soft navigation
    if (typeof window !== "undefined" && typeof window.fbq === "function") {
      window.fbq("track", "PageView");
    }

    // GTM virtual pageview — picked up by GA4 and any GTM triggers
    if (typeof window !== "undefined" && window.dataLayer) {
      window.dataLayer.push({
        event: "virtual_pageview",
        page_path: pathname,
      });
    }
  }, [pathname]);

  return null;
}
