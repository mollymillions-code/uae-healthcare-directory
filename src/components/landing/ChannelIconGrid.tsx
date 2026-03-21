"use client";

import { type FC, useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface ChannelIconGridProps {
  channels: { icon: FC<{ className?: string }>; name: string; color: string }[];
  className?: string;
}

export function ChannelIconGrid({ channels, className = "" }: ChannelIconGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const items = itemRefs.current.filter(Boolean) as HTMLDivElement[];
    if (!items.length) return;

    // Scroll-triggered stagger entrance
    gsap.set(items, { opacity: 0, y: 24, scale: 0.9 });

    const entranceTween = gsap.to(items, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.6,
      stagger: 0.07,
      ease: "power3.out",
      scrollTrigger: {
        trigger: container,
        start: "top 88%",
        toggleActions: "play none none none",
      },
    });

    // GSAP hover handlers for each icon
    const enterHandlers: (() => void)[] = [];
    const leaveHandlers: (() => void)[] = [];

    items.forEach((el, i) => {
      const onEnter = () => {
        gsap.to(el, {
          scale: 1.06,
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          duration: 0.3,
          ease: "power2.out",
        });
      };
      const onLeave = () => {
        gsap.to(el, {
          scale: 1,
          boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
          duration: 0.3,
          ease: "power2.out",
        });
      };

      el.addEventListener("mouseenter", onEnter);
      el.addEventListener("mouseleave", onLeave);
      enterHandlers[i] = onEnter;
      leaveHandlers[i] = onLeave;
    });

    return () => {
      entranceTween.scrollTrigger?.kill();
      entranceTween.kill();
      items.forEach((el, i) => {
        el.removeEventListener("mouseenter", enterHandlers[i]);
        el.removeEventListener("mouseleave", leaveHandlers[i]);
      });
    };
  }, [channels]);

  return (
    <div
      ref={containerRef}
      className={`flex items-center justify-center flex-wrap gap-5 sm:gap-8 ${className}`}
    >
      {channels.map((channel, i) => {
        const ChannelIcon = channel.icon;
        return (
          <div
            key={channel.name}
            ref={(el) => { itemRefs.current[i] = el; }}
            className="flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white ring-1 ring-black/5 shadow-sm"
            style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
            title={channel.name}
          >
            <ChannelIcon className="w-9 h-9 sm:w-10 sm:h-10" />
          </div>
        );
      })}
    </div>
  );
}
