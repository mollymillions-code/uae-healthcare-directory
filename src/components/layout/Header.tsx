"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Search, Menu, X } from "lucide-react";
import { CITIES } from "@/lib/constants/cities";

const NAV_LINKS = [
  { label: "Dubai", href: "/directory/dubai" },
  { label: "Abu Dhabi", href: "/directory/abu-dhabi" },
  { label: "Sharjah", href: "/directory/sharjah" },
  { label: "Ajman", href: "/directory/ajman" },
  { label: "RAK", href: "/directory/ras-al-khaimah" },
  { label: "Fujairah", href: "/directory/fujairah" },
  { label: "UAQ", href: "/directory/umm-al-quwain" },
  { label: "Al Ain", href: "/directory/al-ain" },
];

function getArabicPath(pathname: string): string {
  if (pathname.startsWith('/ar')) {
    return pathname.replace(/^\/ar/, '') || '/';
  }
  // Only directory and homepage have Arabic versions
  if (pathname === '/' || pathname.startsWith('/directory')) {
    return `/ar${pathname}`;
  }
  // Everything else — go to Arabic homepage
  return '/ar';
}

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="bg-dark text-white sticky top-0 z-50">
      <div className="container-tc">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <span className="bg-accent w-7 h-7 flex items-center justify-center text-white font-bold text-xs">
              Z
            </span>
            <span className="font-bold text-base tracking-tight hidden sm:inline">
              UAE Open Healthcare Directory
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-1.5 text-[13px] font-medium text-white/80 hover:text-white transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <span className="w-px h-5 bg-white/20 mx-2" />
            <Link href="/search" className="px-3 py-1.5 text-[13px] font-medium text-white/80 hover:text-white transition-colors">
              Search
            </Link>
            <Link href="/intelligence" className="px-3 py-1.5 text-[13px] font-medium text-white/80 hover:text-white transition-colors">
              Insights
            </Link>
            <Link href="/about" className="px-3 py-1.5 text-[13px] font-medium text-white/80 hover:text-white transition-colors">
              About
            </Link>
            <span className="w-px h-5 bg-white/20 mx-2" />
            <Link href={getArabicPath(pathname)} className="px-3 py-1.5 text-[13px] font-medium text-white/80 hover:text-white transition-colors">
              {pathname.startsWith('/ar') ? 'EN' : 'عربي'}
            </Link>
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <Link href="/claim" className="hidden sm:inline-flex items-center bg-accent hover:bg-accent-dark text-white text-xs font-bold px-4 py-2 transition-colors">
              Claim Listing
            </Link>
            <Link href="/search" className="lg:hidden p-2 text-white/70 hover:text-white">
              <Search className="h-5 w-5" />
            </Link>
            <button className="lg:hidden p-2 text-white/70 hover:text-white" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="lg:hidden bg-dark-800 border-t border-white/10">
          <div className="container-tc py-4 space-y-3">
            <div className="grid grid-cols-2 gap-1">
              {CITIES.map((city) => (
                <Link
                  key={city.slug}
                  href={`/directory/${city.slug}`}
                  className="text-sm text-white/70 hover:text-white py-1.5 px-2"
                  onClick={() => setMobileOpen(false)}
                >
                  {city.name}
                </Link>
              ))}
            </div>
            <div className="border-t border-white/10 pt-3 flex flex-wrap gap-4">
              <Link href="/search" className="text-sm font-bold text-accent" onClick={() => setMobileOpen(false)}>Search</Link>
              <Link href="/intelligence" className="text-sm font-bold text-accent" onClick={() => setMobileOpen(false)}>Insights</Link>
              <Link href="/claim" className="text-sm font-bold text-accent" onClick={() => setMobileOpen(false)}>Claim Listing</Link>
              <Link href="/about" className="text-sm text-white/70" onClick={() => setMobileOpen(false)}>About</Link>
              <Link href={getArabicPath(pathname)} className="text-sm font-bold text-accent" onClick={() => setMobileOpen(false)}>
                {pathname.startsWith('/ar') ? 'EN' : 'عربي'}
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
