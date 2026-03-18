"use client";

import Link from "next/link";
import { useState } from "react";
import { Search, Menu, X, MapPin, ChevronDown } from "lucide-react";
import { CITIES } from "@/lib/constants/cities";
import { CATEGORIES } from "@/lib/constants/categories";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [citiesOpen, setCitiesOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-cream/90 backdrop-blur-md border-b border-cream-200">
      <div className="container-wide">
        <div className="flex h-16 items-center justify-between">
          {/* Logo — editorial serif */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="h-9 w-9 rounded-lg bg-teal-500 flex items-center justify-center shadow-sm">
              <span className="text-white font-display font-bold text-sm tracking-tight">
                UAE
              </span>
            </div>
            <div className="hidden sm:block">
              <span className="font-display text-lg font-semibold text-dark tracking-tight">
                Health
              </span>
              <span className="font-display text-lg font-semibold text-teal-500 tracking-tight">
                Directory
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {/* Cities */}
            <div className="relative">
              <button
                onClick={() => {
                  setCitiesOpen(!citiesOpen);
                  setCategoriesOpen(false);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-charcoal hover:text-teal-600 hover:bg-teal-50 transition-colors"
              >
                <MapPin className="h-3.5 w-3.5" />
                Cities
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform ${citiesOpen ? "rotate-180" : ""}`}
                />
              </button>
              {citiesOpen && (
                <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-xl shadow-lg border border-cream-200 py-2 z-50 animate-fade-in">
                  {CITIES.map((city) => (
                    <Link
                      key={city.slug}
                      href={`/uae/${city.slug}`}
                      className="block px-4 py-2.5 text-sm text-charcoal hover:bg-teal-50 hover:text-teal-700 transition-colors"
                      onClick={() => setCitiesOpen(false)}
                    >
                      {city.name}
                      <span className="text-xs text-cream-300 ml-2">
                        {city.emirate !== city.name ? city.emirate : ""}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Categories */}
            <div className="relative">
              <button
                onClick={() => {
                  setCategoriesOpen(!categoriesOpen);
                  setCitiesOpen(false);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-charcoal hover:text-teal-600 hover:bg-teal-50 transition-colors"
              >
                Specialties
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform ${categoriesOpen ? "rotate-180" : ""}`}
                />
              </button>
              {categoriesOpen && (
                <div className="absolute top-full left-0 mt-1 w-72 bg-white rounded-xl shadow-lg border border-cream-200 py-2 z-50 max-h-96 overflow-y-auto animate-fade-in">
                  {CATEGORIES.map((cat) => (
                    <Link
                      key={cat.slug}
                      href={`/uae/dubai/${cat.slug}`}
                      className="block px-4 py-2.5 text-sm text-charcoal hover:bg-teal-50 hover:text-teal-700 transition-colors"
                      onClick={() => setCategoriesOpen(false)}
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link
              href="/search"
              className="px-3 py-2 rounded-lg text-sm font-medium text-charcoal hover:text-teal-600 hover:bg-teal-50 transition-colors"
            >
              Search
            </Link>
            <Link
              href="/claim"
              className="px-3 py-2 rounded-lg text-sm font-medium text-charcoal hover:text-teal-600 hover:bg-teal-50 transition-colors"
            >
              Claim Listing
            </Link>
          </nav>

          {/* Search button + Mobile toggle */}
          <div className="flex items-center gap-2">
            <Link
              href="/search"
              className="flex items-center gap-2 rounded-xl bg-white border border-cream-200 px-4 py-2 text-sm text-cream-300 hover:border-teal-300 hover:text-teal-500 transition-all"
            >
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline">Search providers...</span>
            </Link>

            <button
              className="md:hidden p-2 rounded-lg hover:bg-teal-50 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-cream-200 bg-white animate-fade-in">
          <div className="container-wide py-6 space-y-6">
            <div>
              <p className="text-[10px] font-semibold text-cream-300 uppercase tracking-[0.2em] mb-3">
                Cities
              </p>
              <div className="grid grid-cols-2 gap-1">
                {CITIES.map((city) => (
                  <Link
                    key={city.slug}
                    href={`/uae/${city.slug}`}
                    className="text-sm text-charcoal hover:text-teal-600 py-1.5 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {city.name}
                  </Link>
                ))}
              </div>
            </div>
            <div className="border-t border-cream-200 pt-4 space-y-1">
              <Link
                href="/search"
                className="block text-sm font-medium text-charcoal py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Search
              </Link>
              <Link
                href="/claim"
                className="block text-sm font-medium text-charcoal py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Claim Listing
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
