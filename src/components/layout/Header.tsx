"use client";

import Link from "next/link";
import { useState } from "react";
import { Search, Menu, X } from "lucide-react";
import { CITIES } from "@/lib/constants/cities";

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="bg-stone">
      {/* Top bar — date + label */}
      <div className="container-wide">
        <div className="flex items-center justify-between py-2 rule">
          <span className="label">
            Free &middot; Open &middot; Official Data
          </span>
          <span className="label">
            March 2026
          </span>
        </div>
      </div>

      {/* Masthead */}
      <div className="container-wide">
        <div className="flex items-end justify-between py-4">
          <Link href="/" className="group">
            <span className="font-serif text-2xl sm:text-3xl font-bold text-ink tracking-tight">
              UAE Health
            </span>
            <span className="font-serif text-2xl sm:text-3xl font-light text-ink tracking-tight italic">
              {" "}Directory
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link href="/search" className="flex items-center gap-2 text-sm text-ink-400 hover:text-ink transition-colors">
              <Search className="h-4 w-4" />
              Search
            </Link>
            <Link href="/claim" className="text-sm text-ink-400 hover:text-ink transition-colors">
              Claim listing
            </Link>
            <Link href="/about" className="text-sm text-ink-400 hover:text-ink transition-colors">
              About
            </Link>
          </div>

          <button
            className="md:hidden p-1"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Navigation bar */}
        <nav className="hidden md:block rule-thick">
          <div className="flex items-center gap-0 -mb-px overflow-x-auto">
            {CITIES.map((city) => (
              <Link
                key={city.slug}
                href={`/uae/${city.slug}`}
                className="px-4 py-2.5 text-sm font-medium text-ink-400 hover:text-ink border-b-2 border-transparent hover:border-warm transition-colors whitespace-nowrap"
              >
                {city.name}
              </Link>
            ))}
          </div>
        </nav>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="md:hidden rule bg-white">
          <div className="container-wide py-6 space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {CITIES.map((city) => (
                <Link
                  key={city.slug}
                  href={`/uae/${city.slug}`}
                  className="text-sm text-ink-500 hover:text-warm py-1"
                  onClick={() => setMobileOpen(false)}
                >
                  {city.name}
                </Link>
              ))}
            </div>
            <div className="rule pt-4 flex gap-6">
              <Link href="/search" className="text-sm font-medium" onClick={() => setMobileOpen(false)}>Search</Link>
              <Link href="/claim" className="text-sm font-medium" onClick={() => setMobileOpen(false)}>Claim</Link>
              <Link href="/about" className="text-sm font-medium" onClick={() => setMobileOpen(false)}>About</Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
