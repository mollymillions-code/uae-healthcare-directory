"use client";

import Link from "next/link";
import { useState } from "react";
import { Search, Menu, X, MapPin } from "lucide-react";
import { CITIES } from "@/lib/constants/cities";
import { CATEGORIES } from "@/lib/constants/categories";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [citiesOpen, setCitiesOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-200">
      <div className="container-wide">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-brand-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">UAE</span>
            </div>
            <div className="hidden sm:block">
              <span className="font-bold text-gray-900">UAE Health</span>
              <span className="text-brand-500 font-bold"> Directory</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            {/* Cities Dropdown */}
            <div className="relative">
              <button
                onClick={() => { setCitiesOpen(!citiesOpen); setCategoriesOpen(false); }}
                className="flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-brand-600 transition-colors"
              >
                <MapPin className="h-4 w-4" />
                Cities
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>
              {citiesOpen && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                  {CITIES.map((city) => (
                    <Link
                      key={city.slug}
                      href={`/uae/${city.slug}`}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-brand-50 hover:text-brand-700"
                      onClick={() => setCitiesOpen(false)}
                    >
                      {city.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Categories Dropdown */}
            <div className="relative">
              <button
                onClick={() => { setCategoriesOpen(!categoriesOpen); setCitiesOpen(false); }}
                className="flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-brand-600 transition-colors"
              >
                Categories
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>
              {categoriesOpen && (
                <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50 max-h-96 overflow-y-auto">
                  {CATEGORIES.map((cat) => (
                    <Link
                      key={cat.slug}
                      href={`/uae/dubai/${cat.slug}`}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-brand-50 hover:text-brand-700"
                      onClick={() => setCategoriesOpen(false)}
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link href="/search" className="text-sm font-medium text-gray-700 hover:text-brand-600">
              Search
            </Link>
            <Link href="/claim" className="text-sm font-medium text-gray-700 hover:text-brand-600">
              Claim Listing
            </Link>
          </nav>

          {/* Search + Mobile Menu */}
          <div className="flex items-center gap-3">
            <Link
              href="/search"
              className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-500 hover:bg-gray-200 transition-colors"
            >
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline">Search providers...</span>
            </Link>

            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white">
          <div className="container-wide py-4 space-y-4">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Cities</p>
              <div className="grid grid-cols-2 gap-2">
                {CITIES.map((city) => (
                  <Link
                    key={city.slug}
                    href={`/uae/${city.slug}`}
                    className="text-sm text-gray-700 hover:text-brand-600 py-1"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {city.name}
                  </Link>
                ))}
              </div>
            </div>
            <div className="border-t border-gray-100 pt-4">
              <Link href="/search" className="block text-sm font-medium text-gray-700 py-2" onClick={() => setMobileMenuOpen(false)}>
                Search
              </Link>
              <Link href="/claim" className="block text-sm font-medium text-gray-700 py-2" onClick={() => setMobileMenuOpen(false)}>
                Claim Listing
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
