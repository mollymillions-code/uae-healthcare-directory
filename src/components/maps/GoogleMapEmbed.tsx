"use client";

import { useEffect, useRef, useState } from "react";

interface GoogleMapEmbedProps {
  query: string;
  placeId?: string | null;
  className?: string;
}

export function GoogleMapEmbed({ query, className = "" }: GoogleMapEmbedProps) {
  // Free Google Maps embed — no API key required
  const src = `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [shouldLoadMap, setShouldLoadMap] = useState(false);

  useEffect(() => {
    const node = rootRef.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setShouldLoadMap(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShouldLoadMap(true);
          observer.disconnect();
        }
      },
      { rootMargin: "120px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={rootRef} className={className}>
      {shouldLoadMap ? (
        <iframe
          width="100%"
          height="300"
          style={{ border: 0 }}
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          src={src}
          title={`Map showing location of ${query}`}
          className="h-[300px] w-full"
        />
      ) : (
        <div className="flex h-[300px] items-center justify-center bg-white">
          <a
            href={mapsHref}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-z-pill border border-ink-line px-4 py-2 font-sans text-z-body-sm font-semibold text-ink hover:border-ink"
          >
            Open map
          </a>
        </div>
      )}
    </div>
  );
}
