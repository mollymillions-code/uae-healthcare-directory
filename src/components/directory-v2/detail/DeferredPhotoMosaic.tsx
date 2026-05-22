"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

const PhotoMosaic = dynamic(
  () => import("./PhotoMosaic").then((mod) => mod.PhotoMosaic),
  { ssr: false },
);

interface DeferredPhotoMosaicProps {
  photos: string[];
  alt: string;
  priorityCount?: number;
  fallbackSrc?: string;
}

export function DeferredPhotoMosaic(props: DeferredPhotoMosaicProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const node = rootRef.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setReady(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setReady(true);
          observer.disconnect();
        }
      },
      { rootMargin: "240px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={rootRef} className="relative w-full">
      {ready ? (
        <PhotoMosaic {...props} deferUntilVisible={false} />
      ) : (
        <div className="rounded-z-lg border border-ink-line bg-white/70 aspect-[5/3] md:aspect-[2/1]" />
      )}
    </div>
  );
}
