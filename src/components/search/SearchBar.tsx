"use client";

/**
 * SearchBar — Healthcare-intent search bar for the UAE Open Healthcare
 * Directory.
 *
 * Part of Zocdoc Roadmap Item 9 (Codex Rec 5). The bar is UX-first, not
 * SEO-first: the destination `/search` route is `noindex,follow` per Item 0,
 * so every filter combination can be surfaced here without facet-explosion
 * risk.
 *
 * Filters (all optional):
 *  - query (free text)
 *  - condition (mapped to `CONDITIONS[].slug`)
 *  - specialty (mapped to `CATEGORIES[].slug`)
 *  - city (mapped to `CITIES[].slug`)
 *  - insurance (mapped to `INSURANCE_PROVIDERS[].slug`)
 *  - language (mapped to `LANGUAGES[].slug`)
 *  - entityType: "doctor" | "facility" | "both"
 *  - emergency: boolean
 *
 * Back-compat: still accepts the legacy `defaultCity` / `defaultCategory` /
 * `defaultQuery` / `compact` props so existing call sites (homepage hero,
 * city hub, /search results header) keep working.
 */

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Search, Siren } from "lucide-react";
import { CITIES } from "@/lib/constants/cities";
import { CATEGORIES } from "@/lib/constants/categories";
import { CONDITIONS } from "@/lib/constants/conditions";
import { INSURANCE_PROVIDERS } from "@/lib/constants/insurance";
import { LANGUAGES } from "@/lib/constants/languages";
import type { HealthcareEntityType } from "@/lib/search/types";

export interface SearchBarProps {
  defaultQuery?: string;
  defaultCity?: string;
  defaultCategory?: string;
  defaultCondition?: string;
  defaultInsurance?: string;
  defaultLanguage?: string;
  defaultEntityType?: HealthcareEntityType;
  defaultEmergency?: boolean;
  /** Render the minimal single-line version used in embedded hero contexts. */
  compact?: boolean;
  /** When true, route to `/ar/search` instead of `/search`. */
  arabic?: boolean;
}

export function SearchBar({
  defaultQuery,
  defaultCity,
  defaultCategory,
  defaultCondition,
  defaultInsurance,
  defaultLanguage,
  defaultEntityType,
  defaultEmergency,
  compact,
  arabic,
}: SearchBarProps) {
  const router = useRouter();

  const [query, setQuery] = useState(defaultQuery || "");
  const [city, setCity] = useState(defaultCity || "");
  const [specialty, setSpecialty] = useState(defaultCategory || "");
  const [condition, setCondition] = useState(defaultCondition || "");
  const [insurance, setInsurance] = useState(defaultInsurance || "");
  const [language, setLanguage] = useState(defaultLanguage || "");
  const [entityType, setEntityType] = useState<HealthcareEntityType>(
    defaultEntityType || "both"
  );
  const [emergency, setEmergency] = useState<boolean>(defaultEmergency || false);

  const basePath = arabic ? "/ar/search" : "/search";
  const uaeCities = CITIES.filter((c) => c.country === "ae");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (city) params.set("city", city);
    if (specialty) params.set("specialty", specialty);
    if (condition) params.set("condition", condition);
    if (insurance) params.set("insurance", insurance);
    if (language) params.set("language", language);
    if (entityType && entityType !== "both") params.set("entityType", entityType);
    if (emergency) params.set("emergency", "true");
    router.push(`${basePath}?${params.toString()}`);
  }

  // ── Compact mode (hero strip) ────────────────────────────────────────
  if (compact) {
    return (
      <form onSubmit={handleSubmit} className="flex gap-2 items-center" role="search">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={arabic ? "ابحث عن طبيب أو عيادة..." : "Doctor, clinic, reason for visit..."}
          className="input-tc flex-1"
          aria-label={arabic ? "بحث" : "Search healthcare providers"}
        />
        <button
          type="submit"
          className="btn-accent px-4 py-3"
          aria-label={arabic ? "بحث" : "Search"}
        >
          <Search className="h-4 w-4" aria-hidden="true" />
        </button>
      </form>
    );
  }

  // ── Full mode ────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} role="search" aria-label={arabic ? "بحث الرعاية الصحية" : "Healthcare search"}>
      {/* Row 1 — free text + emergency */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
        <div className="sm:col-span-9">
          <label htmlFor="search-q" className="text-[11px] font-bold text-black/40 uppercase tracking-wider mb-1.5 block">
            {arabic ? "سبب الزيارة أو اسم الطبيب" : "Reason for visit, doctor, clinic"}
          </label>
          <input
            id="search-q"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={arabic ? "مثلاً: ألم الظهر، فحص سنوي..." : "e.g. back pain, annual checkup, Dr. Ahmed..."}
            className="input-tc"
            autoComplete="off"
          />
        </div>
        <div className="sm:col-span-3">
          <button
            type="button"
            onClick={() => setEmergency((v) => !v)}
            aria-pressed={emergency}
            aria-label={arabic ? "أحتاج رعاية الآن" : "I need care now"}
            className={`inline-flex items-center justify-center gap-2 w-full font-['Geist',sans-serif] font-medium text-sm py-3 rounded-full border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c62828] ${
              emergency
                ? "bg-[#c62828] text-white border-[#c62828] hover:bg-[#a11f1f]"
                : "bg-white text-[#c62828] border-[#c62828]/30 hover:bg-[#c62828]/[0.06]"
            }`}
          >
            <Siren className="h-4 w-4" aria-hidden="true" />
            <span>{arabic ? "رعاية الآن" : "Need care now"}</span>
          </button>
        </div>
      </div>

      {/* Row 2 — structured filters */}
      <div className="mt-3 grid grid-cols-2 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-3">
          <label htmlFor="search-city" className="text-[11px] font-bold text-black/40 uppercase tracking-wider mb-1.5 block">
            {arabic ? "المدينة" : "City"}
          </label>
          <select
            id="search-city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="input-tc cursor-pointer"
          >
            <option value="">{arabic ? "كل المدن" : "All cities"}</option>
            {uaeCities.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-3">
          <label htmlFor="search-specialty" className="text-[11px] font-bold text-black/40 uppercase tracking-wider mb-1.5 block">
            {arabic ? "التخصص" : "Specialty"}
          </label>
          <select
            id="search-specialty"
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
            className="input-tc cursor-pointer"
          >
            <option value="">{arabic ? "كل التخصصات" : "All specialties"}</option>
            {CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-3">
          <label htmlFor="search-condition" className="text-[11px] font-bold text-black/40 uppercase tracking-wider mb-1.5 block">
            {arabic ? "الحالة" : "Condition"}
          </label>
          <select
            id="search-condition"
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            className="input-tc cursor-pointer"
          >
            <option value="">{arabic ? "كل الحالات" : "All conditions"}</option>
            {CONDITIONS.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-3">
          <label htmlFor="search-insurance" className="text-[11px] font-bold text-black/40 uppercase tracking-wider mb-1.5 block">
            {arabic ? "التأمين" : "Insurance"}
          </label>
          <select
            id="search-insurance"
            value={insurance}
            onChange={(e) => setInsurance(e.target.value)}
            className="input-tc cursor-pointer"
          >
            <option value="">{arabic ? "كل شركات التأمين" : "Any insurance"}</option>
            {INSURANCE_PROVIDERS.map((i) => (
              <option key={i.slug} value={i.slug}>
                {i.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Row 3 — language + entity type + submit */}
      <div className="mt-3 grid grid-cols-2 sm:grid-cols-12 gap-3 items-end">
        <div className="sm:col-span-3">
          <label htmlFor="search-language" className="text-[11px] font-bold text-black/40 uppercase tracking-wider mb-1.5 block">
            {arabic ? "اللغة" : "Language"}
          </label>
          <select
            id="search-language"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="input-tc cursor-pointer"
          >
            <option value="">{arabic ? "كل اللغات" : "Any language"}</option>
            {LANGUAGES.map((l) => (
              <option key={l.slug} value={l.slug}>
                {l.name}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-6">
          <span className="text-[11px] font-bold text-black/40 uppercase tracking-wider mb-1.5 block">
            {arabic ? "عرض" : "Show"}
          </span>
          <div
            role="radiogroup"
            aria-label={arabic ? "نوع النتيجة" : "Result type"}
            className="inline-flex rounded-full border border-black/[0.08] bg-white p-1 w-full"
          >
            {(
              [
                { value: "both", label: arabic ? "الكل" : "All" },
                { value: "doctor", label: arabic ? "أطباء" : "Doctors" },
                { value: "facility", label: arabic ? "منشآت" : "Facilities" },
              ] as const
            ).map((opt) => {
              const active = entityType === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setEntityType(opt.value)}
                  className={`flex-1 font-['Geist',sans-serif] text-sm py-2 rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006828] ${
                    active
                      ? "bg-[#006828] text-white"
                      : "text-[#1c1c1c] hover:bg-[#006828]/[0.06]"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="sm:col-span-3">
          <button
            type="submit"
            className="btn-accent w-full py-3 inline-flex items-center justify-center gap-2"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
            <span>{arabic ? "بحث" : "Search"}</span>
          </button>
        </div>
      </div>
    </form>
  );
}
