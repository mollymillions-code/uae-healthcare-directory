"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

// SSR enabled so the browser can discover and prioritise the first image
// during HTML parse — critical for LCP on provider detail pages.
const PhotoMosaic = dynamic(
  () => import("./PhotoMosaic").then((mod) => mod.PhotoMosaic),
  { ssr: true },
);

interface DeferredPhotoMosaicProps {
  photos: string[];
  alt: string;
  priorityCount?: number;
  fallbackSrc?: string;
}

export function DeferredPhotoMosaic(props: DeferredPhotoMosaicProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(true); // render immediately — first image needs priority

  useEffect(() => {
    // For images beyond the first (priorityCount), still use IntersectionObserver
    // to avoid loading off-screen images. But the component itself renders on server.
    const node = rootRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setReady(true);
          observer.disconnect();
        }
      },
      { rootMargin: "400px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={rootRef} className="relative w-full">
      <PhotoMosaic {...props} deferUntilVisible={false} />
    </div>
  );
}
