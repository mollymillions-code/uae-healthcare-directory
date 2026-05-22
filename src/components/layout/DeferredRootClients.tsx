"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const DeferredMarketingTags = dynamic(
  () =>
    import("@/components/analytics/DeferredMarketingTags").then(
      (mod) => mod.DeferredMarketingTags,
    ),
  { ssr: false, loading: () => null },
);

const RouteChangeTracker = dynamic(
  () =>
    import("@/components/analytics/RouteChangeTracker").then(
      (mod) => mod.RouteChangeTracker,
    ),
  { ssr: false, loading: () => null },
);

const RouteLoadingOverlay = dynamic(
  () =>
    import("@/components/layout/RouteLoadingOverlay").then(
      (mod) => mod.RouteLoadingOverlay,
    ),
  { ssr: false, loading: () => null },
);

const DeferredPostActionAccountPrompt = dynamic(
  () =>
    import("@/components/account/DeferredPostActionAccountPrompt").then(
      (mod) => mod.DeferredPostActionAccountPrompt,
    ),
  { ssr: false, loading: () => null },
);

export function DeferredRootClients() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (enabled) return;

    const enable = () => setEnabled(true);
    const timer = window.setTimeout(enable, 4000);
    const passiveOnce: AddEventListenerOptions = { passive: true, once: true };

    window.addEventListener("pointerdown", enable, passiveOnce);
    window.addEventListener("touchstart", enable, passiveOnce);
    window.addEventListener("keydown", enable, { once: true });
    window.addEventListener("scroll", enable, passiveOnce);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("pointerdown", enable);
      window.removeEventListener("touchstart", enable);
      window.removeEventListener("keydown", enable);
      window.removeEventListener("scroll", enable);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <>
      <DeferredMarketingTags />
      <RouteChangeTracker />
      <RouteLoadingOverlay />
      <DeferredPostActionAccountPrompt />
    </>
  );
}
