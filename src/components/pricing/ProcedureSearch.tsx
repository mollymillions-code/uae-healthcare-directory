"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search } from "lucide-react";

interface Procedure {
  slug: string;
  name: string;
  nameAr: string;
  categorySlug: string;
  priceRange: { min: number; max: number };
  insuranceCoverage: string;
}

export function ProcedureSearch({ procedures }: { procedures: Procedure[] }) {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return [];

    return procedures
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.nameAr.includes(q) ||
          p.categorySlug.replace(/-/g, " ").includes(q)
      )
      .slice(0, 8);
  }, [query, procedures]);

  const coverageLabel = (coverage: string) => {
    switch (coverage) {
      case "typically-covered": return "Covered";
      case "partially-covered": return "Partial";
      case "rarely-covered": return "Rare";
      case "not-covered": return "Not covered";
      default: return "";
    }
  };

  const coverageColor = (coverage: string) => {
    switch (coverage) {
      case "typically-covered": return "text-green-700 bg-green-50";
      case "partially-covered": return "text-yellow-700 bg-yellow-50";
      case "rarely-covered": return "text-orange-700 bg-orange-50";
      case "not-covered": return "text-red-700 bg-red-50";
      default: return "";
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder='Search procedures — e.g. "MRI", "dental implant", "knee replacement"'
          className="w-full pl-10 pr-4 py-3 border border-light-200 bg-white text-sm text-dark placeholder:text-muted focus:outline-none focus:border-accent"
          aria-label="Search medical procedures"
        />
      </div>

      {results.length > 0 && (
        <div className="absolute z-40 w-full bg-white border border-light-200 border-t-0 shadow-lg max-h-96 overflow-y-auto">
          {results.map((proc) => (
            <Link
              key={proc.slug}
              href={`/pricing/${proc.slug}`}
              className="flex items-center justify-between p-3 hover:bg-light-50 border-b border-light-200 last:border-0"
              onClick={() => setQuery("")}
            >
              <div>
                <p className="text-sm font-bold text-dark">{proc.name}</p>
                <p className="text-[11px] text-muted">
                  AED {proc.priceRange.min.toLocaleString()} – AED{" "}
                  {proc.priceRange.max.toLocaleString()}
                </p>
              </div>
              <span
                className={`text-[10px] font-medium px-2 py-0.5 ${coverageColor(proc.insuranceCoverage)}`}
              >
                {coverageLabel(proc.insuranceCoverage)}
              </span>
            </Link>
          ))}
        </div>
      )}

      {query.length > 2 && results.length === 0 && (
        <div className="absolute z-40 w-full bg-white border border-light-200 border-t-0 shadow-lg p-4">
          <p className="text-sm text-muted text-center">
            No procedures found for &ldquo;{query}&rdquo;. Try a different term.
          </p>
        </div>
      )}
    </div>
  );
}
