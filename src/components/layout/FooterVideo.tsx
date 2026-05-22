"use client";

import { useEffect, useRef, useState } from "react";

export function FooterVideo({ className }: { className: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    const prepareVideo = () => {
      video.muted = true;
      video.defaultMuted = true;
      video.controls = false;
      video.playsInline = true;
      video.disablePictureInPicture = true;
      video.setAttribute("muted", "");
      video.setAttribute("playsinline", "");
      video.setAttribute("webkit-playsinline", "");
      video.removeAttribute("controls");
    };

    const playVideo = () => {
      if (!shouldLoad) {
        return;
      }
      prepareVideo();
      void video.play().catch(() => {
        // iOS can defer autoplay in low-power or constrained browser modes.
      });
    };

    prepareVideo();

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: "600px 0px" }
    );
    observer.observe(video);

    video.addEventListener("loadeddata", playVideo);
    video.addEventListener("canplay", playVideo);
    window.addEventListener("pageshow", playVideo);
    document.addEventListener("visibilitychange", playVideo);

    return () => {
      observer.disconnect();
      video.removeEventListener("loadeddata", playVideo);
      video.removeEventListener("canplay", playVideo);
      window.removeEventListener("pageshow", playVideo);
      document.removeEventListener("visibilitychange", playVideo);
    };
  }, [shouldLoad]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !shouldLoad) return;
    video.load();
    void video.play().catch(() => {
      // iOS can defer autoplay in low-power or constrained browser modes.
    });
  }, [shouldLoad]);

  return (
    <>
      {shouldLoad ? (
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[url('/media/footer/zavis-footer-clinic-poster.jpg')] bg-cover bg-bottom"
        />
      ) : null}
      <video
        ref={videoRef}
        aria-hidden="true"
        className={`zavis-footer-video ${className}`}
        autoPlay
        loop
        muted
        playsInline
        preload={shouldLoad ? "metadata" : "none"}
        controls={false}
        disablePictureInPicture
        poster={shouldLoad ? "/media/footer/zavis-footer-clinic-poster.jpg" : undefined}
        tabIndex={-1}
      >
        {shouldLoad ? (
          <>
            <source src="/media/footer/zavis-footer-clinic-loop.mp4" type="video/mp4" />
            <source src="/media/footer/zavis-footer-clinic-loop.webm" type="video/webm" />
          </>
        ) : null}
      </video>
    </>
  );
}
