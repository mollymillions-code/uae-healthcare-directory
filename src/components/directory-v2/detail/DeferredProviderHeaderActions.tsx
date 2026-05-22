"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const ProviderHeaderActions = dynamic(
  () => import("./ProviderHeaderActions").then((mod) => mod.ProviderHeaderActions),
  { ssr: false },
);

interface DeferredProviderHeaderActionsProps {
  providerId: string;
  providerName: string;
  providerSlug: string;
  citySlug: string;
  categorySlug: string;
  cityName?: string | null;
}

export function DeferredProviderHeaderActions(props: DeferredProviderHeaderActionsProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const enable = () => setReady(true);
    const timer = window.setTimeout(enable, 2500);
    window.addEventListener("pointerdown", enable, { once: true, passive: true });
    window.addEventListener("keydown", enable, { once: true });
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("pointerdown", enable);
      window.removeEventListener("keydown", enable);
    };
  }, []);

  if (!ready) {
    return (
      <div className="h-9 w-[104px] flex-shrink-0" aria-hidden="true" />
    );
  }

  return <ProviderHeaderActions {...props} />;
}

