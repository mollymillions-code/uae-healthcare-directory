"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin } from "lucide-react";
import { CITIES } from "@/lib/constants/cities";
import { CATEGORIES } from "@/lib/constants/categories";

interface SearchBarProps {
  defaultCity?: string;
  defaultCategory?: string;
  defaultQuery?: string;
  compact?: boolean;
}

export function SearchBar({
  defaultCity,
  defaultCategory,
  defaultQuery,
  compact,
}: SearchBarProps) {
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
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-cream-300" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search healthcare providers..."
            className="input pl-10"
          />
        </div>
        <button type="submit" className="btn-primary">
          Search
        </button>
      </form>
    );
  }

  return (
    <form
      onSubmit={handleSearch}
      className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.12)] border border-white/50 p-4 sm:p-5"
    >
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        {/* Search Input */}
        <div className="relative sm:col-span-5">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-cream-300" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Doctors, clinics, hospitals..."
            className="input pl-10"
          />
        </div>

        {/* City Select */}
        <div className="relative sm:col-span-3">
          <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-cream-300" />
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="input pl-10 appearance-none cursor-pointer"
          >
            <option value="">All Cities</option>
            {CITIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Category + Button */}
        <div className="flex gap-2 sm:col-span-4">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="input flex-1 appearance-none cursor-pointer"
          >
            <option value="">All Specialties</option>
            {CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
          <button type="submit" className="btn-primary whitespace-nowrap">
            <Search className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Search</span>
          </button>
        </div>
      </div>
    </form>
  );
}
