"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { CITIES } from "@/lib/constants/cities";

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="bg-canvas">
      {/* Masthead */}
      <div className="container-wide">
        <div className="grid grid-cols-3 items-center rule-bottom py-4">
          {/* Left nav */}
          <nav className="hidden md:flex gap-6 font-kicker text-[0.85rem] uppercase tracking-[0.05em]">
            <Link href="/uae" className="text-ink hover:text-gold transition-colors">Directory</Link>
            <Link href="/search" className="text-ink hover:text-gold transition-colors">Search</Link>
            <Link href="/about" className="text-ink hover:text-gold transition-colors">About</Link>
          </nav>

          {/* Center logo */}
          <div className="text-center col-start-2">
            <Link href="/">
              <span className="font-display text-3xl sm:text-[3rem] font-bold tracking-[-0.02em] leading-none uppercase text-ink">
                UAE Health
              </span>
            </Link>
          </div>

          {/* Right */}
          <div className="hidden md:flex justify-end items-center gap-6">
            <span className="font-display text-xl italic text-ink-muted">Est. 2026</span>
            <Link href="/claim" className="btn-subscribe">Claim Listing</Link>
          </div>

          {/* Mobile hamburger */}
          <div className="md:hidden flex justify-end col-start-3">
            <button onClick={() => setMobileOpen(!mobileOpen)} className="p-1">
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* City nav bar */}
      <div className="container-wide">
        <nav className="hidden md:flex items-center border-b border-ink-light overflow-x-auto">
          {CITIES.map((city) => (
            <Link
              key={city.slug}
              href={`/uae/${city.slug}`}
              className="px-4 py-2.5 font-kicker text-[0.8rem] uppercase tracking-[0.05em] text-ink-muted hover:text-ink border-b-2 border-transparent hover:border-gold transition-colors whitespace-nowrap"
            >
              {city.name}
            </Link>
          ))}
        </nav>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="md:hidden border-t border-ink-light bg-white">
          <div className="container-wide py-6 space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {CITIES.map((city) => (
                <Link
                  key={city.slug}
                  href={`/uae/${city.slug}`}
                  className="text-sm text-ink-muted hover:text-gold py-1"
                  onClick={() => setMobileOpen(false)}
                >
                  {city.name}
                </Link>
              ))}
            </div>
            <div className="border-t border-ink-light pt-4 flex flex-wrap gap-6">
              <Link href="/search" className="font-kicker text-sm uppercase text-ink" onClick={() => setMobileOpen(false)}>Search</Link>
              <Link href="/claim" className="font-kicker text-sm uppercase text-gold" onClick={() => setMobileOpen(false)}>Claim Listing</Link>
              <Link href="/about" className="font-kicker text-sm uppercase text-ink" onClick={() => setMobileOpen(false)}>About</Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
