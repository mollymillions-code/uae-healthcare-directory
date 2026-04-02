"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { ZavisLogo } from "./ZavisLogo";
import { DesktopNav } from "./DesktopNav";
import { MobileNav } from "./MobileNav";

export { ZavisLogo } from "./ZavisLogo";

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const menuButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    setMobileOpen(false);
    setMobileExpanded(null);
    setActiveMenu(null);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (!activeMenu) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeMenu]);

  const handleMenuEnter = useCallback((label: string) => {
    clearTimeout(closeTimeoutRef.current);
    setActiveMenu(label);
  }, []);

  const handleMenuLeave = useCallback(() => {
    closeTimeoutRef.current = setTimeout(() => setActiveMenu(null), 150);
  }, []);

  useEffect(() => {
    return () => clearTimeout(closeTimeoutRef.current);
  }, []);

  const closeMega = useCallback(() => {
    setActiveMenu(null);
  }, []);

  return (
    <>
      <nav ref={navRef} className="sticky top-0 z-50 bg-[#f8f8f6]/90 border-b border-black/5" style={{ backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link
              href="/"
              className="flex-shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006828] rounded"
            >
              <ZavisLogo />
            </Link>

            <DesktopNav
              activeMenu={activeMenu}
              navRef={navRef}
              menuButtonRefs={menuButtonRefs}
              handleMenuEnter={handleMenuEnter}
              handleMenuLeave={handleMenuLeave}
              setActiveMenu={setActiveMenu}
              closeMega={closeMega}
            />

            <button
              className="lg:hidden p-2 -mr-2 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006828]"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile drawer - MUST be outside <nav> so backdrop-filter doesn't break fixed positioning */}
      <MobileNav
        mobileOpen={mobileOpen}
        mobileExpanded={mobileExpanded}
        setMobileExpanded={setMobileExpanded}
        setMobileOpen={setMobileOpen}
      />
    </>
  );
}
