"use client";

import { useEffect, useRef, useState } from "react";

export default function VideoSection() {
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
          }
        });
      },
      { threshold: 0.3 }
    );

    if (videoContainerRef.current) {
      observer.observe(videoContainerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section className="bg-white py-12 md:py-20">
      <div className="mx-auto container px-6 md:px-12 lg:px-16">
        <h2 className="text-center text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-10">
          See How Zavis Transforms Your Healthcare Organization
        </h2>
        <div ref={videoContainerRef} className="w-full">
          <div className="aspect-video rounded-2xl overflow-hidden shadow-xl bg-gray-900">
            {isInView ? (
              <iframe
                src="https://www.youtube.com/embed/wszl0By4K94?autoplay=1&mute=1&loop=1&playlist=wszl0By4K94&controls=1&rel=0&modestbranding=1"
                title="Zavis Healthcare - The Future of Patient Engagement"
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin" />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
