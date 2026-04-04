"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Search, Menu, X } from "lucide-react";
import { CITIES } from "@/lib/constants/cities";

const CITY_LINKS = [
  { label: "Dubai", href: "/directory/dubai" },
  { label: "Abu Dhabi", href: "/directory/abu-dhabi" },
  { label: "Sharjah", href: "/directory/sharjah" },
  { label: "Ajman", href: "/directory/ajman" },
  { label: "RAK", href: "/directory/ras-al-khaimah" },
  { label: "Fujairah", href: "/directory/fujairah" },
  { label: "UAQ", href: "/directory/umm-al-quwain" },
  { label: "Al Ain", href: "/directory/al-ain" },
];

const SECTION_LINKS = [
  { label: "Search", href: "/search" },
  { label: "Professionals", href: "/professionals" },
  { label: "Labs", href: "/labs" },
  { label: "Insights", href: "/intelligence" },
  { label: "Research", href: "/research" },
  { label: "About", href: "/about" },
];

function getArabicPath(pathname: string): string | null {
  if (pathname.startsWith('/ar')) {
    return pathname.replace(/^\/ar/, '') || '/';
  }
  if (pathname === '/' || pathname.startsWith('/directory')) {
    return `/ar${pathname}`;
  }
  return null;
}

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const activeCity = CITY_LINKS.find((c) => pathname.startsWith(c.href))?.href;

  useEffect(() => {
    if (!mobileOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50">
      {/* ─── Top bar: brand + CTA ─── */}
      <div className="bg-[#1c1c1c]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo — prominent like Bloomberg masthead */}
            <Link href="/directory" className="flex items-center gap-3 flex-shrink-0">
              <span className="bg-[#006828] w-8 h-8 rounded-lg flex items-center justify-center text-white font-medium text-sm font-['Bricolage_Grotesque',sans-serif]">
                Z
              </span>
              <span className="font-['Bricolage_Grotesque',sans-serif] font-semibold text-[20px] sm:text-[22px] tracking-tight text-white whitespace-nowrap">
                UAE Healthcare Directory
              </span>
            </Link>

            {/* Right side — clean, minimal */}
            <div className="hidden lg:flex items-center gap-4">
              {getArabicPath(pathname) && (
                <Link
                  href={getArabicPath(pathname)!}
                  className="font-['Geist',sans-serif] text-[14px] font-semibold text-white/60 hover:text-white transition-colors"
                >
                  {pathname.startsWith('/ar') ? 'EN' : 'عربي'}
                </Link>
              )}
              <Link
                href="/claim"
                className="inline-flex items-center bg-transparent border border-white/20 hover:border-white/40 text-white text-[13px] font-semibold px-5 py-2 rounded-full transition-colors whitespace-nowrap font-['Geist',sans-serif]"
              >
                Claim Listing
              </Link>
              <Link href="/search" className="p-2 text-white/60 hover:text-white transition-colors">
                <Search className="h-5 w-5" />
              </Link>
            </div>

            {/* Mobile controls */}
            <div className="flex items-center gap-2 lg:hidden">
              <Link href="/search" className="p-2 text-white/60 hover:text-white transition-colors">
                <Search className="h-5 w-5" />
              </Link>
              <button
                className="p-2 text-white/60 hover:text-white transition-colors"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-expanded={mobileOpen}
                aria-label="Toggle navigation menu"
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Bottom bar: city tabs + section links ─── */}
      <div className="bg-[#111] border-b border-white/10 hidden lg:block">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* City tabs — left */}
            <nav className="flex items-center gap-0 overflow-x-auto scrollbar-none">
              {CITY_LINKS.map((link) => {
                const isActive = activeCity === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-4 py-3 text-[14px] font-semibold whitespace-nowrap transition-colors font-['Geist',sans-serif] ${
                      isActive
                        ? "text-white"
                        : "text-white/50 hover:text-white"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            {/* Section links — right */}
            <nav className="flex items-center gap-0 flex-shrink-0">
              {SECTION_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-3 text-[14px] font-semibold whitespace-nowrap transition-colors font-['Geist',sans-serif] ${
                    pathname.startsWith(link.href) ? "text-white" : "text-white/50 hover:text-white"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* ─── Mobile nav ─── */}
      {mobileOpen && (
        <div className="lg:hidden bg-[#111] border-t border-white/10">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-3">
            <p className="uppercase text-[10px] tracking-widest font-medium text-white/30 font-['Geist',sans-serif]">Emirates</p>
            <div className="grid grid-cols-2 gap-1">
              {CITIES.map((city) => (
                <Link
                  key={city.slug}
                  href={`/directory/${city.slug}`}
                  className="font-['Geist',sans-serif] text-sm text-white/60 hover:text-white py-1.5 px-2 transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  {city.name}
                </Link>
              ))}
            </div>
            <div className="border-t border-white/10 pt-3 flex flex-wrap gap-4">
              <Link href="/search" className="font-['Geist',sans-serif] text-sm font-medium text-[#006828]" onClick={() => setMobileOpen(false)}>Search</Link>
              <Link href="/professionals" className="font-['Geist',sans-serif] text-sm font-medium text-[#006828]" onClick={() => setMobileOpen(false)}>Professionals</Link>
              <Link href="/labs" className="font-['Geist',sans-serif] text-sm font-medium text-[#006828]" onClick={() => setMobileOpen(false)}>Labs</Link>
              <Link href="/intelligence" className="font-['Geist',sans-serif] text-sm font-medium text-[#006828]" onClick={() => setMobileOpen(false)}>Insights</Link>
              <Link href="/research" className="font-['Geist',sans-serif] text-sm font-medium text-[#006828]" onClick={() => setMobileOpen(false)}>Research</Link>
              <Link href="/claim" className="font-['Geist',sans-serif] text-sm font-medium text-[#006828]" onClick={() => setMobileOpen(false)}>Claim Listing</Link>
              <Link href="/about" className="font-['Geist',sans-serif] text-sm text-white/60" onClick={() => setMobileOpen(false)}>About</Link>
              {getArabicPath(pathname) && (
                <Link href={getArabicPath(pathname)!} className="font-['Geist',sans-serif] text-sm font-medium text-[#006828]" onClick={() => setMobileOpen(false)}>
                  {pathname.startsWith('/ar') ? 'EN' : 'عربي'}
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
