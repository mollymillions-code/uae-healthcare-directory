"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  Search, MapPin, Stethoscope, SlidersHorizontal, X, ChevronDown, Siren,
} from "lucide-react";
import { CITIES } from "@/lib/constants/cities";
import { CATEGORIES } from "@/lib/constants/categories";
import { CONDITIONS } from "@/lib/constants/conditions";
import { LANGUAGES } from "@/lib/constants/languages";
import { INSURANCE_PROVIDERS } from "@/lib/constants/insurance";
import { FilterDrawer } from "@/components/directory-v2/filters/FilterDrawer";
import { cn } from "@/components/directory-v2/shared/cn";

interface Props {
  initialQuery: string;
  initialCity: string;
  initialSpecialty: string;
  initialCondition: string;
  initialInsurance: string;
  initialLanguage: string;
  initialEntityType: "doctor" | "facility" | "both";
  initialEmergency: boolean;
  totalResults: number;
}

export function SearchControls(props: Props) {
  const router = useRouter();

  const [query, setQuery] = useState(props.initialQuery);
  const [city, setCity] = useState(props.initialCity);
  const [specialty, setSpecialty] = useState(props.initialSpecialty);
  const [condition, setCondition] = useState(props.initialCondition);
  const [insurance, setInsurance] = useState(props.initialInsurance);
  const [language, setLanguage] = useState(props.initialLanguage);
  const [entityType, setEntityType] = useState<"doctor" | "facility" | "both">(props.initialEntityType);
  const [emergency, setEmergency] = useState(props.initialEmergency);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const buildHref = useCallback(
    (overrides: Partial<Record<string, string | null | boolean>> = {}): string => {
      const params = new URLSearchParams();
      const setParam = (k: string, v: string | null | boolean | undefined) => {
        if (v === null || v === undefined || v === "" || v === false) return;
        params.set(k, String(v));
      };
      setParam("q", (overrides.q as string | null | undefined) ?? query);
      setParam("city", (overrides.city as string | null | undefined) ?? city);
      setParam("specialty", (overrides.specialty as string | null | undefined) ?? specialty);
      setParam("condition", (overrides.condition as string | null | undefined) ?? condition);
      setParam("insurance", (overrides.insurance as string | null | undefined) ?? insurance);
      setParam("language", (overrides.language as string | null | undefined) ?? language);
      const et = (overrides.entityType as string | undefined) ?? entityType;
      if (et && et !== "both") params.set("entityType", et);
      const em = (overrides.emergency as boolean | undefined) ?? emergency;
      if (em) params.set("emergency", "true");
      return `/search?${params.toString()}`;
    },
    [query, city, specialty, condition, insurance, language, entityType, emergency]
  );

  const submit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      router.push(buildHref());
    },
    [buildHref, router]
  );

  const cityName = useMemo(() => CITIES.find((c) => c.slug === city)?.name, [city]);
  const specialtyName = useMemo(() => CATEGORIES.find((c) => c.slug === specialty)?.name, [specialty]);
  const conditionName = useMemo(() => CONDITIONS.find((c) => c.slug === condition)?.name, [condition]);
  const insuranceName = useMemo(() => INSURANCE_PROVIDERS.find((i) => i.slug === insurance)?.name, [insurance]);
  const languageName = useMemo(() => LANGUAGES.find((l) => l.slug === language)?.name, [language]);

  const appliedCount = [city, specialty, condition, insurance, language].filter(Boolean).length + (emergency ? 1 : 0) + (entityType !== "both" ? 1 : 0);

  return (
    <>
      {/* ─── Row 1: Inline expanded search pill ─── */}
      <form
        onSubmit={submit}
        className="bg-white rounded-z-search border border-ink-hairline shadow-z-pill flex items-stretch h-[68px] max-w-[860px] mx-auto"
      >
        <label className="flex-1 min-w-0 flex items-center gap-3 px-5 py-2.5 border-r border-ink-hairline">
          <Search className="h-4 w-4 text-ink-muted flex-shrink-0" strokeWidth={2} />
          <div className="flex flex-col min-w-0 w-full">
            <span className="font-sans text-z-micro text-ink uppercase tracking-[0.04em]">Reason, doctor or clinic</span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. back pain, Dr. Ahmed…"
              className="w-full bg-transparent outline-none font-sans text-z-body-sm text-ink placeholder:text-ink-muted mt-0.5 truncate"
            />
          </div>
        </label>
        <label className="hidden sm:flex items-center gap-3 px-4 py-2.5 border-r border-ink-hairline">
          <MapPin className="h-4 w-4 text-ink-muted flex-shrink-0" strokeWidth={2} />
          <div className="flex flex-col w-[120px]">
            <span className="font-sans text-z-micro text-ink uppercase tracking-[0.04em]">City</span>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="bg-transparent outline-none font-sans text-z-body-sm text-ink mt-0.5 appearance-none cursor-pointer truncate"
            >
              <option value="">Any city</option>
              {CITIES.filter((c) => c.country === "ae").map((c) => (
                <option key={c.slug} value={c.slug}>{c.name}</option>
              ))}
            </select>
          </div>
        </label>
        <label className="hidden md:flex items-center gap-3 px-4 py-2.5 border-r border-ink-hairline">
          <Stethoscope className="h-4 w-4 text-ink-muted flex-shrink-0" strokeWidth={2} />
          <div className="flex flex-col w-[140px]">
            <span className="font-sans text-z-micro text-ink uppercase tracking-[0.04em]">Specialty</span>
            <select
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              className="bg-transparent outline-none font-sans text-z-body-sm text-ink mt-0.5 appearance-none cursor-pointer truncate"
            >
              <option value="">Any specialty</option>
              {CATEGORIES.map((c) => (
                <option key={c.slug} value={c.slug}>{c.name}</option>
              ))}
            </select>
          </div>
        </label>
        <div className="flex items-center pr-2">
          <button
            type="submit"
            aria-label="Search"
            className="inline-flex items-center gap-2 h-12 px-5 rounded-z-pill bg-accent hover:bg-accent-dark text-white font-sans font-semibold text-z-body-sm transition-colors"
          >
            <Search className="h-4 w-4" strokeWidth={2.5} />
            <span className="hidden sm:inline">Search</span>
          </button>
        </div>
      </form>

      {/* ─── Row 2: Filter bar with clear visual hierarchy ─── */}
      <div className="mt-5 max-w-[1000px] mx-auto">
        <div className="flex items-center gap-4 flex-wrap sm:flex-nowrap">
          {/* Primary: entity type segmented toggle */}
          <EntityTypeToggle
            value={entityType}
            onChange={(v) => { setEntityType(v); router.push(buildHref({ entityType: v })); }}
          />

          {/* Thin divider on desktop */}
          <span className="hidden sm:block h-6 w-px bg-ink-line flex-shrink-0" />

          {/* Secondary: dropdown-style filter chips (no icons collapsed into text) */}
          <div className="flex items-center gap-2 overflow-x-auto z-no-scrollbar flex-1 min-w-0">
            <SelectChip
              label="Insurance"
              value={insurance}
              valueLabel={insuranceName}
              options={INSURANCE_PROVIDERS.map((i) => ({ value: i.slug, label: i.name }))}
              onChange={(v) => { setInsurance(v); router.push(buildHref({ insurance: v || null })); }}
            />
            <SelectChip
              label="Language"
              value={language}
              valueLabel={languageName}
              options={LANGUAGES.map((l) => ({ value: l.slug, label: l.name }))}
              onChange={(v) => { setLanguage(v); router.push(buildHref({ language: v || null })); }}
            />
            <SelectChip
              label="Condition"
              value={condition}
              valueLabel={conditionName}
              options={CONDITIONS.map((c) => ({ value: c.slug, label: c.name }))}
              onChange={(v) => { setCondition(v); router.push(buildHref({ condition: v || null })); }}
            />
            <SelectChip
              label="City"
              value={city}
              valueLabel={cityName}
              options={CITIES.filter((c) => c.country === "ae").map((c) => ({ value: c.slug, label: c.name }))}
              onChange={(v) => { setCity(v); router.push(buildHref({ city: v || null })); }}
            />
            <SelectChip
              label="Specialty"
              value={specialty}
              valueLabel={specialtyName}
              options={CATEGORIES.map((c) => ({ value: c.slug, label: c.name }))}
              onChange={(v) => { setSpecialty(v); router.push(buildHref({ specialty: v || null })); }}
            />
          </div>

          {/* Emergency + All filters — pinned right with distinct hierarchy */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => { const next = !emergency; setEmergency(next); router.push(buildHref({ emergency: next })); }}
              aria-pressed={emergency}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-z-pill px-3.5 py-1.5 font-sans text-z-body-sm whitespace-nowrap transition-colors",
                emergency
                  ? "bg-red-600 text-white border border-red-600"
                  : "bg-white text-red-600 border border-red-200 hover:border-red-600"
              )}
            >
              <Siren className="h-3.5 w-3.5" strokeWidth={2.5} />
              {emergency ? "Emergency: on" : "Emergency"}
            </button>
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-z-pill px-4 py-1.5 font-sans text-z-body-sm font-semibold whitespace-nowrap transition-colors",
                appliedCount > 0
                  ? "bg-ink text-white border border-ink"
                  : "bg-white text-ink border border-ink hover:bg-surface-cream"
              )}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" strokeWidth={2.5} />
              All filters
              {appliedCount > 0 && (
                <span className={cn(
                  "ml-0.5 h-4 min-w-[16px] px-1 rounded-full text-[10px] font-semibold inline-flex items-center justify-center",
                  "bg-white text-ink"
                )}>
                  {appliedCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Clear-all link shown only when something is applied */}
        {appliedCount > 0 && (
          <div className="mt-3 flex items-center justify-end">
            <button
              type="button"
              onClick={() => router.push("/search")}
              className="font-sans text-z-caption font-medium text-ink-soft hover:text-ink underline underline-offset-2"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      <FilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="All filters"
        onSubmit={() => router.push(buildHref())}
        onClearAll={() => router.push("/search")}
        matchCount={props.totalResults}
      >
        <DrawerSection label="City">
          <NativeSelect value={city} onChange={setCity} options={[{ value: "", label: "Any city" }, ...CITIES.filter((c) => c.country === "ae").map((c) => ({ value: c.slug, label: c.name }))]} />
        </DrawerSection>
        <DrawerSection label="Specialty">
          <NativeSelect value={specialty} onChange={setSpecialty} options={[{ value: "", label: "Any specialty" }, ...CATEGORIES.map((c) => ({ value: c.slug, label: c.name }))]} />
        </DrawerSection>
        <DrawerSection label="Condition">
          <NativeSelect value={condition} onChange={setCondition} options={[{ value: "", label: "Any condition" }, ...CONDITIONS.map((c) => ({ value: c.slug, label: c.name }))]} />
        </DrawerSection>
        <DrawerSection label="Insurance">
          <NativeSelect value={insurance} onChange={setInsurance} options={[{ value: "", label: "Any insurance" }, ...INSURANCE_PROVIDERS.map((i) => ({ value: i.slug, label: i.name }))]} />
        </DrawerSection>
        <DrawerSection label="Language">
          <NativeSelect value={language} onChange={setLanguage} options={[{ value: "", label: "Any language" }, ...LANGUAGES.map((l) => ({ value: l.slug, label: l.name }))]} />
        </DrawerSection>
        <DrawerSection label="Show">
          <EntityTypeToggle value={entityType} onChange={setEntityType} />
        </DrawerSection>
        <DrawerSection label="Urgency">
          <label className="flex items-center gap-3">
            <input type="checkbox" checked={emergency} onChange={(e) => setEmergency(e.target.checked)} className="h-4 w-4 rounded border-ink-hairline" />
            <span className="font-sans text-z-body text-ink inline-flex items-center gap-1.5">
              <Siren className="h-3.5 w-3.5 text-red-600" strokeWidth={2.25} /> I need care now
            </span>
          </label>
        </DrawerSection>
      </FilterDrawer>
    </>
  );
}

// ───────── Sub-components ─────────

function DrawerSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="font-display font-semibold text-ink text-z-h3 mb-3">{label}</h3>
      {children}
    </div>
  );
}

function NativeSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-surface-cream rounded-z-sm border border-ink-line px-3.5 py-2.5 font-sans text-z-body-sm text-ink appearance-none cursor-pointer pr-9"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown className="h-3.5 w-3.5 text-ink-muted absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
    </div>
  );
}

function EntityTypeToggle({
  value,
  onChange,
}: {
  value: "doctor" | "facility" | "both";
  onChange: (v: "doctor" | "facility" | "both") => void;
}) {
  const opts: { v: "doctor" | "facility" | "both"; label: string }[] = [
    { v: "both", label: "All" },
    { v: "doctor", label: "Doctors" },
    { v: "facility", label: "Facilities" },
  ];
  return (
    <div className="inline-flex items-center bg-white border border-ink-hairline rounded-z-pill p-1 flex-shrink-0 shadow-z-card">
      {opts.map((o) => (
        <button
          key={o.v}
          type="button"
          onClick={() => onChange(o.v)}
          aria-pressed={value === o.v}
          className={cn(
            "px-3.5 py-1 rounded-z-pill font-sans text-z-body-sm font-medium transition-colors",
            value === o.v ? "bg-ink text-white" : "text-ink-soft hover:text-ink"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/**
 * SelectChip — dropdown-style filter chip. Shows "<Label>" when empty,
 * "<Label>: <Value> ×" when applied. Native <select> for accessibility +
 * zero-cost mobile UX (system picker). No overlapping icon.
 */
function SelectChip({
  label,
  value,
  valueLabel,
  options,
  onChange,
}: {
  label: string;
  value: string;
  valueLabel?: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  const applied = Boolean(value);
  const selectRef = useRef<HTMLSelectElement | null>(null);
  const displayText = applied && valueLabel ? `${label}: ${valueLabel}` : label;

  return (
    <div
      className={cn(
        "relative inline-flex items-center flex-shrink-0 transition-colors",
        "rounded-z-pill border font-sans text-z-body-sm whitespace-nowrap",
        applied
          ? "bg-state-applied text-white border-state-applied"
          : "bg-white text-ink border-ink-hairline hover:border-ink"
      )}
    >
      {/* Native select sits transparently on top so clicks open the system picker */}
      <select
        ref={selectRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
      >
        <option value="">Any {label.toLowerCase()}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      {/* Visible chip surface */}
      <span className="flex items-center gap-1.5 pl-3.5 pr-2 py-1.5 pointer-events-none max-w-[220px]">
        <span className="truncate">{displayText}</span>
        {applied ? null : <ChevronDown className="h-3 w-3 opacity-60" strokeWidth={2.5} />}
      </span>

      {/* Clear-X button only when applied, overrides the transparent <select> via z-index */}
      {applied && (
        <button
          type="button"
          aria-label={`Clear ${label}`}
          onClick={(e) => {
            e.stopPropagation();
            onChange("");
          }}
          className="relative z-10 mr-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-white/15"
        >
          <X className="h-3 w-3" strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}
