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
      <form onSubmit={handleSearch} className="flex gap-3 items-end">
        <div className="flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search providers..."
            className="input"
          />
        </div>
        <button type="submit" className="btn-subscribe">
          <Search className="h-4 w-4" />
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSearch}>
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 sm:gap-6 items-end">
        <div className="sm:col-span-5">
          <label className="kicker mb-2 block text-[0.65rem]">Search</label>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Doctor, clinic, hospital..."
            className="input"
          />
        </div>
        <div className="sm:col-span-3">
          <label className="kicker mb-2 block text-[0.65rem]">City</label>
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="input cursor-pointer"
          >
            <option value="">All cities</option>
            {CITIES.map((c) => (
              <option key={c.slug} value={c.slug}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-3">
          <label className="kicker mb-2 block text-[0.65rem]">Specialty</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="input cursor-pointer"
          >
            <option value="">All specialties</option>
            {CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-1">
          <button type="submit" className="btn-subscribe w-full py-3">
            <Search className="h-4 w-4" />
          </button>
        </div>
      </div>
    </form>
  );
}
