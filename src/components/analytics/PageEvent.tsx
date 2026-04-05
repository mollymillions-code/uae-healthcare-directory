"use client";
import { useEffect } from "react";
import { trackEvent } from "@/lib/gtag";

interface Props {
  event: string;
  params?: Record<string, unknown>;
}

/**
 * Drop into any server-rendered page to fire a single analytics event on mount.
 * Renders nothing — purely a side-effect component.
 */
export function PageEvent({ event, params }: Props) {
  useEffect(() => {
    trackEvent(event, params);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
