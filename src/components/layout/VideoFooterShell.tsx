"use client";

import type { ReactNode } from "react";

export const videoFooterHeadingClass =
  "mb-2 font-['Geist',sans-serif] text-[11px] font-semibold uppercase text-[#006828]";

export const videoFooterLinkClass =
  "text-sm leading-5 text-black/55 transition-colors hover:text-[#006828] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006828] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fbf7f2]";

export const videoFooterMutedClass =
  "text-sm leading-5 text-black/55";

type VideoFooterShellProps = {
  brand: ReactNode;
  description: ReactNode;
  social?: ReactNode;
  children: ReactNode;
  trustRail?: ReactNode;
  discoveryRail?: ReactNode;
  bottom: ReactNode;
  compact?: boolean;
  className?: string;
};

export function VideoFooterShell({
  brand,
  description,
  social,
  children,
  trustRail,
  discoveryRail,
  bottom,
  compact = false,
  className = "",
}: VideoFooterShellProps) {
  if (compact) {
    return (
      <footer
        role="contentinfo"
        aria-label="Site footer"
        className={`mt-16 bg-[#0b0b0b] px-3 py-4 text-[#1c1c1c] sm:px-4 ${className}`}
      >
        <div className="relative mx-auto aspect-[16/9] min-h-[680px] w-full max-w-[1600px] overflow-hidden rounded-[18px] bg-[#fbf7f2] shadow-[0_24px_80px_rgba(0,0,0,0.22)] max-sm:aspect-auto max-sm:min-h-0">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-[15%] h-full bg-[url('/media/footer/zavis-footer-clinic-poster.jpg')] bg-cover bg-center max-sm:hidden"
          />
          <video
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-[15%] h-full w-full object-cover object-center motion-reduce:hidden max-sm:hidden"
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            poster="/media/footer/zavis-footer-clinic-poster.jpg"
          >
            <source src="/media/footer/zavis-footer-clinic-loop.mp4" type="video/mp4" />
            <source src="/media/footer/zavis-footer-clinic-loop.webm" type="video/webm" />
          </video>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-[48%] bg-gradient-to-b from-[#fbf7f2] via-[#fbf7f2]/95 to-[#fbf7f2]/0 max-sm:hidden"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_12%,rgba(255,255,255,0.58),rgba(255,255,255,0)_45%)] max-sm:hidden"
          />

          <div className="relative z-10 flex h-full flex-col px-[5.4%] pb-[4.2%] pt-[4.7%] max-sm:h-auto max-sm:px-5 max-sm:py-7">
            <div className="grid gap-9 lg:grid-cols-6 lg:gap-14">
              <div className="lg:col-span-2">
                {brand}
                <p className="mt-4 max-w-[300px] font-['Geist',sans-serif] text-[21px] leading-[1.2] text-[#374151] max-sm:text-base">
                  {description}
                </p>
                {social ? <div className="mt-6">{social}</div> : null}
              </div>
              <div className="lg:col-span-4">{children}</div>
            </div>

            <div className="mt-8 border-t border-black/15 pt-4">{bottom}</div>
          </div>
          <div className="relative z-10 aspect-[16/9] overflow-hidden sm:hidden">
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-[url('/media/footer/zavis-footer-clinic-poster.jpg')] bg-cover bg-center"
            />
            <video
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-cover object-center motion-reduce:hidden"
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              poster="/media/footer/zavis-footer-clinic-poster.jpg"
            >
              <source src="/media/footer/zavis-footer-clinic-loop.mp4" type="video/mp4" />
              <source src="/media/footer/zavis-footer-clinic-loop.webm" type="video/webm" />
            </video>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer
      role="contentinfo"
      aria-label="Site footer"
      className={`mt-16 bg-[#fbf7f2] text-[#1c1c1c] ${className}`}
    >
      <div className="flex min-h-[100svh] flex-col">
        <div className="mx-auto w-full max-w-[1280px] px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
          <div className="grid gap-8 lg:grid-cols-[minmax(220px,0.8fr)_minmax(0,2.8fr)] lg:gap-14">
            <div>
              {brand}
              <p className="mt-3 max-w-[300px] font-['Geist',sans-serif] text-sm leading-5 text-black/60">
                {description}
              </p>
              {social ? <div className="mt-4">{social}</div> : null}
            </div>
            {children}
          </div>
          {trustRail ? <div className="mt-7">{trustRail}</div> : null}
          {discoveryRail ? <div className="mt-5">{discoveryRail}</div> : null}
          <div className="mt-6 border-t border-black/10 pt-5">{bottom}</div>
        </div>
        <div className="relative min-h-[132px] flex-1 overflow-hidden border-t border-black/10 sm:min-h-[300px] lg:min-h-[360px]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[url('/media/footer/zavis-footer-clinic-poster.jpg')] bg-cover bg-bottom"
          />
          <video
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full object-cover object-bottom motion-reduce:hidden"
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            poster="/media/footer/zavis-footer-clinic-poster.jpg"
          >
            <source src="/media/footer/zavis-footer-clinic-loop.mp4" type="video/mp4" />
            <source src="/media/footer/zavis-footer-clinic-loop.webm" type="video/webm" />
          </video>
        </div>
      </div>
    </footer>
  );
}
