"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

type LenisInstance = { scrollTo: (target: number, opts?: { immediate?: boolean }) => void; raf: (time: number) => void; destroy: () => void; on: (event: string, callback: (...args: unknown[]) => void) => void };

let lenisInstance: LenisInstance | null = null;

export function getLenis(): LenisInstance | null {
  return lenisInstance;
}

export default function LenisProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const mainRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);

  // Initialize Lenis smooth scroll (once)
  useEffect(() => {
    let destroyed = false;

    (async () => {
      const [{ default: gsap }, { ScrollTrigger }, { default: Lenis }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
        import("lenis"),
      ]);
      gsap.registerPlugin(ScrollTrigger);

      if (destroyed) return;

      const lenis = new Lenis({
        duration: 1.2,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
      });

      lenisInstance = lenis;

      lenis.on("scroll", ScrollTrigger.update);

      gsap.ticker.add((time: number) => {
        lenis.raf(time * 1000);
      });
      gsap.ticker.lagSmoothing(0);
    })();

    return () => {
      destroyed = true;
      if (lenisInstance) {
        lenisInstance.destroy();
        lenisInstance = null;
      }
    };
  }, []);

  // Handle route changes: scroll to top + page entrance
  useEffect(() => {
    if (lenisInstance) {
      lenisInstance.scrollTo(0, { immediate: true });
    } else {
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    }

    (async () => {
      const { default: gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);

      ScrollTrigger.refresh();

      if (mainRef.current) {
        if (isFirstRender.current) {
          gsap.fromTo(
            mainRef.current,
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }
          );
          isFirstRender.current = false;
        } else {
          gsap.fromTo(
            mainRef.current,
            { opacity: 0, y: 12 },
            { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" }
          );
        }
      }
    })();
  }, [pathname]);

  return (
    <main ref={mainRef} className="flex-1">
      {children}
    </main>
  );
}
