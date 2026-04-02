"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { CITIES } from "@/lib/constants/cities";
import { CATEGORIES } from "@/lib/constants/categories";

interface SearchBarProps {
  defaultCity?: string;
  defaultCategory?: string;
  defaultQuery?: string;
  compact?: boolean;
}

export function SearchBar({ defaultCity, defaultCategory, defaultQuery, compact }: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState(defaultQuery || "");
  const [city, setCity] = useState(defaultCity || "");
  const [category, setCategory] = useState(defaultCategory || "");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (city) params.set("city", city);
    if (category) params.set("category", category);
    router.push(`/search?${params.toString()}`);
  }

  if (compact) {
    return (
      <form onSubmit={handleSearch} className="flex gap-2 items-center" role="search">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search providers..."
          className="input-tc flex-1"
          aria-label="Search healthcare providers"
        />
        <button type="submit" className="btn-accent px-4 py-3" aria-label="Search">
          <Search className="h-4 w-4" />
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSearch}>
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
        <div className="sm:col-span-5">
          <label className="text-[11px] font-bold text-black/40 uppercase tracking-wider mb-1.5 block">Search</label>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Doctor, clinic, hospital..."
            className="input-tc"
          />
        </div>
        <div className="sm:col-span-3">
          <label className="text-[11px] font-bold text-black/40 uppercase tracking-wider mb-1.5 block">City</label>
          <select value={city} onChange={(e) => setCity(e.target.value)} className="input-tc cursor-pointer">
            <option value="">All cities</option>
            {CITIES.map((c) => (
              <option key={c.slug} value={c.slug}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-3">
          <label className="text-[11px] font-bold text-black/40 uppercase tracking-wider mb-1.5 block">Specialty</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="input-tc cursor-pointer">
            <option value="">All specialties</option>
            {CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-1">
          <button type="submit" className="btn-accent w-full py-3">
            <Search className="h-4 w-4" />
          </button>
        </div>
      </div>
    </form>
  );
}
