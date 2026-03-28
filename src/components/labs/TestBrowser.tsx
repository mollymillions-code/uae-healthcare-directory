"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, ChevronDown } from "lucide-react";
import {
  LAB_TESTS,
  TEST_CATEGORIES,
  getPriceRange,
  formatPrice,
  type TestCategory,
} from "@/lib/labs";

export function TestBrowser() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<TestCategory | "all">("all");

  const filteredTests = useMemo(() => {
    let tests = LAB_TESTS;

    if (selectedCategory !== "all") {
      tests = tests.filter((t) => t.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      tests = tests.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.shortName.toLowerCase().includes(q) ||
          t.commonReasons.some((r) => r.toLowerCase().includes(q))
      );
    }

    return tests;
  }, [searchQuery, selectedCategory]);

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/40" />
          <input
            type="text"
            placeholder="Search tests... (e.g. vitamin D, thyroid, cholesterol)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-black/[0.06] text-sm focus:outline-none focus:border-[#006828]"
          />
        </div>
        <div className="relative">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as TestCategory | "all")}
            className="appearance-none w-full sm:w-auto pl-3 pr-8 py-2.5 border border-black/[0.06] text-sm bg-white focus:outline-none focus:border-[#006828]"
          >
            <option value="all">All Categories</option>
            {TEST_CATEGORIES.map((cat) => (
              <option key={cat.slug} value={cat.slug}>
                {cat.name}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-black/40 pointer-events-none" />
        </div>
      </div>

      {/* Results count */}
      <p className="text-xs text-black/40 mb-3">
        {filteredTests.length} test{filteredTests.length !== 1 ? "s" : ""} found
      </p>

      {/* Test list */}
      <div className="space-y-2">
        {filteredTests.map((test) => {
          const range = getPriceRange(test.slug);
          return (
            <Link
              key={test.slug}
              href={`/labs/test/${test.slug}`}
              className="flex items-center justify-between gap-4 p-3 border border-black/[0.06] hover:border-[#006828]/15 transition-colors group"
            >
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-[#1c1c1c] group-hover:text-[#006828] transition-colors truncate">
                  {test.name}
                </h3>
                <p className="text-[11px] text-black/40 line-clamp-1 mt-0.5">{test.description}</p>
                <div className="flex items-center gap-2 mt-1">
                  {test.fastingRequired && (
                    <span className="text-[9px] bg-amber-100 text-amber-800 px-1 py-0.5 font-medium">
                      Fasting required
                    </span>
                  )}
                  <span className="text-[9px] bg-[#f8f8f6] text-[#1c1c1c] px-1 py-0.5 font-medium capitalize">
                    {test.sampleType}
                  </span>
                </div>
              </div>
              {range && (
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-[#006828]">
                    {formatPrice(range.min)}
                  </p>
                  {range.min !== range.max && (
                    <p className="text-[10px] text-black/40">
                      to {formatPrice(range.max)}
                    </p>
                  )}
                  <p className="text-[10px] text-black/40">{range.labCount} labs</p>
                </div>
              )}
            </Link>
          );
        })}
      </div>

      {filteredTests.length === 0 && (
        <div className="text-center py-8 text-black/40 text-sm">
          No tests found matching your search. Try a different keyword.
        </div>
      )}
    </div>
  );
}
