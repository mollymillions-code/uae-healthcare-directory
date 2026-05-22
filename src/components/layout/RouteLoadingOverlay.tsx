"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";

const NAVIGATION_EVENT = "zavis:navigation-start";
const CHUNK_RELOAD_KEY = "zavis:chunk-reload-attempted";

function isModifiedClick(event: MouseEvent): boolean {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0;
}

function isSamePageHashNavigation(nextUrl: URL): boolean {
  return (
    nextUrl.origin === window.location.origin &&
    nextUrl.pathname === window.location.pathname &&
    nextUrl.search === window.location.search &&
    Boolean(nextUrl.hash)
  );
}

function isChunkLoadFailure(value: unknown): boolean {
  const text =
    value instanceof Error
      ? `${value.name} ${value.message}`
      : typeof value === "string"
        ? value
        : String(value ?? "");

  return /ChunkLoadError|Loading chunk|webpackChunk|ERR_QUIC_PROTOCOL_ERROR/i.test(text);
}

export function dispatchRouteLoadingStart() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(NAVIGATION_EVENT));
}

export function RouteLoadingOverlay() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const clearTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (clearTimerRef.current) window.clearTimeout(clearTimerRef.current);
    clearTimerRef.current = window.setTimeout(() => setLoading(false), 150);
    return () => {
      if (clearTimerRef.current) window.clearTimeout(clearTimerRef.current);
    };
  }, [pathname]);

  useEffect(() => {
    const start = () => {
      setLoading(true);
      if (clearTimerRef.current) window.clearTimeout(clearTimerRef.current);
      clearTimerRef.current = window.setTimeout(() => setLoading(false), 12000);
    };

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || isModifiedClick(event)) return;
      const target = event.target as Element | null;
      const anchor = target?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor || anchor.target || anchor.hasAttribute("download")) return;

      const nextUrl = new URL(anchor.href, window.location.href);
      if (nextUrl.origin !== window.location.origin) return;
      if (isSamePageHashNavigation(nextUrl)) return;
      if (nextUrl.href === window.location.href) return;
      start();
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (!isChunkLoadFailure(event.reason)) return;
      const alreadyAttempted = sessionStorage.getItem(CHUNK_RELOAD_KEY) === "1";
      if (alreadyAttempted) return;
      sessionStorage.setItem(CHUNK_RELOAD_KEY, "1");
      start();
      window.location.reload();
    };

    const onError = (event: ErrorEvent) => {
      if (!isChunkLoadFailure(event.error || event.message)) return;
      const alreadyAttempted = sessionStorage.getItem(CHUNK_RELOAD_KEY) === "1";
      if (alreadyAttempted) return;
      sessionStorage.setItem(CHUNK_RELOAD_KEY, "1");
      start();
      window.location.reload();
    };

    window.addEventListener(NAVIGATION_EVENT, start);
    document.addEventListener("click", onClick, true);
    window.addEventListener("unhandledrejection", onUnhandledRejection);
    window.addEventListener("error", onError);
    window.addEventListener("pageshow", () => sessionStorage.removeItem(CHUNK_RELOAD_KEY));
    return () => {
      window.removeEventListener(NAVIGATION_EVENT, start);
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
      window.removeEventListener("error", onError);
    };
  }, []);

  if (!loading) return null;

  return (
    <div
      aria-live="polite"
      aria-label="Loading next page"
      className="pointer-events-none fixed inset-0 z-[2147483000] flex items-center justify-center bg-surface-cream/75 backdrop-blur-[2px]"
    >
      <div className="flex flex-col items-center gap-3 rounded-z-md border border-ink-line bg-white/95 px-6 py-5 shadow-z-float">
        <div className="relative h-12 w-12">
          <div className="absolute inset-0 rounded-full border-2 border-accent/15" />
          <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-accent" />
          <span className="absolute inset-1 flex items-center justify-center overflow-hidden rounded-full">
            <Image
              src="/zavis-icon-dark.svg"
              alt="Zavis"
              width={40}
              height={40}
              className="h-full w-full"
              priority
              draggable={false}
            />
          </span>
        </div>
        <span className="font-sans text-z-body-sm font-semibold text-ink">Loading</span>
      </div>
    </div>
  );
}
