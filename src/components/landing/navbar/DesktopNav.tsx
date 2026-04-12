"use client";

import React from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { megaMenus } from "./types";
import { MegaMenuPanel } from "./MegaMenuPanel";

interface DesktopNavProps {
  activeMenu: string | null;
  navRef: React.RefObject<HTMLElement | null>;
  menuButtonRefs: React.MutableRefObject<Record<string, HTMLButtonElement | null>>;
  handleMenuEnter: (label: string) => void;
  handleMenuLeave: () => void;
  setActiveMenu: React.Dispatch<React.SetStateAction<string | null>>;
  closeMega: () => void;
}

function getArrowOffset(
  label: string,
  menuButtonRefs: React.MutableRefObject<Record<string, HTMLButtonElement | null>>,
  navRef: React.RefObject<HTMLElement | null>,
): number {
  const btn = menuButtonRefs.current[label];
  const nav = navRef.current;
  if (!btn || !nav) return 0;
  const btnRect = btn.getBoundingClientRect();
  const navRect = nav.getBoundingClientRect();
  return btnRect.left + btnRect.width / 2 - navRect.left;
}

export function DesktopNav({
  activeMenu,
  navRef,
  menuButtonRefs,
  handleMenuEnter,
  handleMenuLeave,
  setActiveMenu,
  closeMega,
}: DesktopNavProps) {
  return (
    <>
      {/* Desktop menu buttons */}
      <div className="hidden lg:flex lg:absolute lg:left-1/2 lg:-translate-x-1/2 items-center gap-0.5 whitespace-nowrap">
        {megaMenus.map((menu) => (
          <div
            key={menu.label}
            onMouseEnter={() => handleMenuEnter(menu.label)}
            onMouseLeave={handleMenuLeave}
          >
            <button
              ref={(el) => {
                menuButtonRefs.current[menu.label] = el;
              }}
              className={`flex items-center gap-1 px-4 py-2 font-['Bricolage_Grotesque',sans-serif] font-medium text-[16px] transition-colors rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006828] ${
                activeMenu === menu.label ? "text-[#006828]" : "text-black hover:text-[#006828]"
              }`}
              onClick={() => setActiveMenu(activeMenu === menu.label ? null : menu.label)}
              aria-expanded={activeMenu === menu.label}
              aria-haspopup="true"
            >
              {menu.label}
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  activeMenu === menu.label ? "rotate-180" : ""
                }`}
              />
            </button>
          </div>
        ))}
        <a
          href="/directory"
          className="flex items-center gap-1.5 px-4 py-2 font-['Bricolage_Grotesque',sans-serif] font-medium text-[16px] text-black hover:text-[#006828] transition-colors rounded-lg"
        >
          UAE Healthcare Directory
        </a>
        <a
          href="/intelligence"
          className="flex items-center gap-1.5 px-4 py-2 font-['Bricolage_Grotesque',sans-serif] font-medium text-[16px] text-black hover:text-[#006828] transition-colors rounded-lg"
        >
          Intelligence
        </a>
        <a
          href="/research"
          className="flex items-center gap-1.5 px-4 py-2 font-['Bricolage_Grotesque',sans-serif] font-medium text-[16px] text-black hover:text-[#006828] transition-colors rounded-lg"
        >
          Research
        </a>
      </div>

      {/* Desktop CTA button */}
      <div className="hidden lg:block ml-auto pl-6">
        <Link
          href="/book-a-demo"
          className="group relative z-0 inline-flex items-center justify-center overflow-hidden rounded-full bg-[#0a0a0a] px-6 py-2.5 font-['Bricolage_Grotesque',sans-serif] font-medium text-[16px] text-white transition-all duration-500 hover:text-[#004a1c] hover:shadow-[0_0_32px_rgba(0,104,40,0.45)]"
          style={{
            "--spread": "90deg",
            "--shimmer-color": "#006828",
            "--radius": "100px",
            "--speed": "2.5s",
            "--cut": "1.5px",
            "--bg": "rgba(0,0,0,1)",
          } as React.CSSProperties}
        >
          {/* Shimmer border spark */}
          <div
            className="absolute inset-0 overflow-visible [container-type:size]"
            style={{ zIndex: -30 }}
          >
            <div
              className="absolute inset-0 h-[100cqh] [aspect-ratio:1] [border-radius:0] [mask:none]"
              style={{ animation: "shimmer-slide var(--speed) ease-in-out infinite alternate" }}
            >
              <div
                className="absolute -inset-full w-auto rotate-0 [translate:0_0]"
                style={{
                  background: "conic-gradient(from calc(270deg - (var(--spread) * 0.5)), transparent 0, var(--shimmer-color) var(--spread), transparent var(--spread))",
                  animation: "spin-around calc(var(--speed) * 2) infinite linear",
                }}
              />
            </div>
          </div>
          {/* Shimmer border glow */}
          <div
            className="pointer-events-none absolute overflow-visible [container-type:size]"
            style={{ inset: "-8px", zIndex: -31, filter: "blur(12px)", opacity: 0.6 }}
          >
            <div
              className="absolute inset-0 h-[100cqh] [aspect-ratio:1] [border-radius:0] [mask:none]"
              style={{ animation: "shimmer-slide var(--speed) ease-in-out infinite alternate" }}
            >
              <div
                className="absolute -inset-full w-auto rotate-0 [translate:0_0]"
                style={{
                  background: "conic-gradient(from calc(270deg - (var(--spread) * 0.5)), transparent 0, var(--shimmer-color) var(--spread), transparent var(--spread))",
                  animation: "spin-around calc(var(--speed) * 2) infinite linear",
                }}
              />
            </div>
          </div>
          {/* Backdrop */}
          <div
            className="absolute [background:var(--bg)] rounded-full transition-colors duration-500 group-hover:[background:#e0f2e7]"
            style={{ inset: "var(--cut)", zIndex: -20 }}
          />
          {/* Gradient mesh */}
          <div
            className="pointer-events-none absolute rounded-full opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            style={{ inset: "var(--cut)", zIndex: -19 }}
            aria-hidden="true"
          >
            <div className="absolute inset-0 rounded-full overflow-hidden">
              <div className="absolute inset-0 bg-[#e0f2e7]" />
              <div
                className="absolute rounded-full"
                style={{
                  width: "150%", height: "150%", top: "-25%", left: "-25%",
                  background: "radial-gradient(circle, rgba(0,104,40,0.7) 0%, transparent 55%)",
                  animation: "mesh-blob-1 6s ease-in-out infinite",
                  filter: "blur(16px)",
                }}
              />
              <div
                className="absolute rounded-full"
                style={{
                  width: "130%", height: "130%", top: "-15%", left: "10%",
                  background: "radial-gradient(circle, rgba(0,166,62,0.65) 0%, transparent 50%)",
                  animation: "mesh-blob-2 7s ease-in-out infinite",
                  filter: "blur(14px)",
                }}
              />
              <div
                className="absolute rounded-full"
                style={{
                  width: "140%", height: "140%", top: "-20%", left: "-10%",
                  background: "radial-gradient(circle, rgba(74,222,128,0.6) 0%, transparent 50%)",
                  animation: "mesh-blob-3 5s ease-in-out infinite",
                  filter: "blur(18px)",
                }}
              />
              <div
                className="absolute rounded-full"
                style={{
                  width: "100%", height: "100%", top: "0%", left: "5%",
                  background: "radial-gradient(circle, rgba(255,255,255,0.85) 0%, transparent 55%)",
                  animation: "mesh-blob-4 8s ease-in-out infinite",
                  filter: "blur(12px)",
                }}
              />
              <div
                className="absolute inset-0 mix-blend-overlay opacity-30"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                  backgroundSize: "128px 128px",
                }}
              />
            </div>
          </div>
          <span className="relative z-10 transition-colors duration-500">Book a Demo</span>
        </Link>
      </div>

      {/* Desktop mega menu dropdowns */}
      {megaMenus.map((menu) => {
        const isOpen = activeMenu === menu.label;
        const arrowOffset = getArrowOffset(menu.label, menuButtonRefs, navRef);

        return (
          <div
            key={menu.label}
            className="hidden lg:block"
            onMouseEnter={() => handleMenuEnter(menu.label)}
            onMouseLeave={handleMenuLeave}
          >
            <div
              className={`absolute left-0 right-0 top-full z-50 flex justify-center transition-all duration-200 origin-top ${
                isOpen
                  ? "opacity-100 scale-100 pointer-events-auto"
                  : "opacity-0 scale-[0.98] pointer-events-none"
              }`}
            >
              {/* Scrim removed — the dark overlay behind the mega menu
                  made the page look broken when hovering the navbar. The
                  white dropdown panel with border + shadow is sufficient
                  visual separation. */}

              <div className="relative w-full max-w-[1000px] mx-4 mt-2">
                <div
                  className="absolute -top-[6px] w-3 h-3 bg-white border-l border-t border-black/[0.06] rotate-45 z-10"
                  style={{ left: `${arrowOffset - 24}px` }}
                />

                <div className="relative bg-white border border-black/[0.06] rounded-2xl shadow-xl overflow-hidden">
                  <MegaMenuPanel menu={menu} onClose={closeMega} />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}
