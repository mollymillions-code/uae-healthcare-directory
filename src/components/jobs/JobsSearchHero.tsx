"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, ChevronDown } from "lucide-react";
import { DISCIPLINES } from "@/lib/jobs/disciplines";
import { UAE_CITIES } from "@/lib/jobs/format";

const EXPERIENCE_BUCKETS = [
  { value: "any", label: "Any experience" },
  { value: "0-1", label: "0–1 yrs (entry / new grad)" },
  { value: "1-3", label: "1–3 yrs (junior)" },
  { value: "3-6", label: "3–6 yrs (mid-level)" },
  { value: "6-10", label: "6–10 yrs (senior)" },
  { value: "10+", label: "10+ yrs (consultant / leadership)" },
];

export function JobsSearchHero() {
  const router = useRouter();
  const [role, setRole] = useState("");
  const [city, setCity] = useState("");
  const [experience, setExperience] = useState("any");

  const matchedDiscipline = useMemo(() => {
    if (!role.trim()) return null;
    const q = role.trim().toLowerCase();
    return (
      DISCIPLINES.find((d) => d.name.toLowerCase() === q) ??
      DISCIPLINES.find((d) => d.slug === q) ??
      DISCIPLINES.find((d) => d.name.toLowerCase().includes(q)) ??
      null
    );
  }, [role]);

  const suggestions = useMemo(() => {
    if (!role.trim()) return [];
    const q = role.trim().toLowerCase();
    return DISCIPLINES.filter((d) => d.name.toLowerCase().includes(q)).slice(0, 6);
  }, [role]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (matchedDiscipline) {
      // Direct land on discipline×city or discipline page
      const path = city
        ? `/jobs/discipline/${matchedDiscipline.slug}/${city}`
        : `/jobs/discipline/${matchedDiscipline.slug}`;
      router.push(path);
      return;
    }
    // No discipline match — funnel into signup wizard with whatever we have
    if (role.trim()) params.set("role_q", role.trim());
    if (city) params.set("city", city);
    if (experience !== "any") params.set("experience", experience);
    router.push(`/jobs/signup${params.toString() ? `?${params}` : ""}`);
  }

  function pickSuggestion(slug: string) {
    const d = DISCIPLINES.find((x) => x.slug === slug);
    if (!d) return;
    setRole(d.name);
  }

  return (
    <form onSubmit={handleSearch} className="relative">
      <div className="flex flex-col gap-1 rounded-2xl border border-black/[0.08] bg-white p-1.5 shadow-[0_24px_60px_-30px_rgba(0,104,40,0.25)] sm:flex-row sm:items-stretch sm:gap-0 sm:rounded-full">
        {/* Role search */}
        <div className="relative flex-1 sm:flex-[1.4]">
          <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-black/35" strokeWidth={2.25} />
          <input
            type="text"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="Discipline or role  (e.g. Lab Technician, Pharmacist, ICU Nurse)"
            className="w-full rounded-2xl bg-transparent py-3.5 pl-11 pr-4 font-['Geist',sans-serif] text-[15px] text-[#1c1c1c] placeholder:text-black/35 outline-none sm:rounded-full"
            autoComplete="off"
          />
          {suggestions.length > 0 && role && !matchedDiscipline && (
            <ul className="absolute left-0 right-0 top-[110%] z-20 max-h-72 overflow-auto rounded-2xl border border-black/[0.08] bg-white py-1.5 shadow-[0_18px_48px_-20px_rgba(0,0,0,0.18)]">
              {suggestions.map((d) => (
                <li key={d.slug}>
                  <button
                    type="button"
                    onClick={() => pickSuggestion(d.slug)}
                    className="flex w-full items-center justify-between px-4 py-2 text-left font-['Geist',sans-serif] text-[14px] text-[#1c1c1c] hover:bg-[#006828]/[0.04]"
                  >
                    <span>{d.name}</span>
                    <span className="font-['Geist_Mono',monospace] text-[10px] uppercase tracking-[0.16em] text-black/40">
                      {d.role.replace("_", " ")}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <span className="hidden h-6 w-px self-center bg-black/[0.08] sm:block" />

        {/* Experience */}
        <div className="relative sm:w-[170px]">
          <select
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
            className="w-full appearance-none rounded-2xl bg-transparent py-3.5 pl-4 pr-8 font-['Geist',sans-serif] text-[14px] text-[#1c1c1c] outline-none sm:rounded-none"
          >
            {EXPERIENCE_BUCKETS.map((b) => (
              <option key={b.value} value={b.value}>
                {b.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-black/35" strokeWidth={2.25} />
        </div>

        <span className="hidden h-6 w-px self-center bg-black/[0.08] sm:block" />

        {/* City */}
        <div className="relative sm:w-[200px]">
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full appearance-none rounded-2xl bg-transparent py-3.5 pl-4 pr-8 font-['Geist',sans-serif] text-[14px] text-[#1c1c1c] outline-none sm:rounded-none"
          >
            <option value="">Any UAE city</option>
            {UAE_CITIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-black/35" strokeWidth={2.25} />
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="rounded-2xl bg-[#006828] px-6 py-3 font-['Geist',sans-serif] text-[14px] font-semibold text-white transition-colors hover:bg-[#005220] sm:rounded-full"
        >
          Search
        </button>
      </div>

      <p className="mt-3 px-1 font-['Geist',sans-serif] text-[12px] text-black/45">
        Search opens the discipline page for your role. Build your profile from there to be found by hiring clinics.
      </p>
    </form>
  );
}
