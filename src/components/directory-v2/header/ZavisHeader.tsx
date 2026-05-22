"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter, usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Menu, X } from "lucide-react";
import { COUNTRIES } from "@/lib/constants/countries";
import type { SearchPillProps, SearchPillState, SearchSegment } from "./SearchPill";
import { DeferredHeaderAccountLink } from "./DeferredHeaderAccountLink";
import { cn } from "../shared/cn";
import { dispatchRouteLoadingStart } from "@/components/layout/navigation-events";

const DesktopSearchPill = dynamic<SearchPillProps>(
  () => import("./SearchPill").then((mod) => mod.SearchPill),
  {
    ssr: false,
    loading: () => <div className="h-12 w-[min(48vw,560px)]" aria-hidden="true" />,
  },
);

const SearchPillModal = dynamic(
  () => import("./SearchPillModal").then((mod) => mod.SearchPillModal),
  { ssr: false, loading: () => null }
);

interface ZavisHeaderProps {
  /** When true, the hero will render its own expanded pill — header starts
   *  with pill hidden until scroll. Set on /directory home only. */
  heroHasPill?: boolean;
}

const SECTION_LINKS = [
  { label: "Find a Doctor", href: "/find-a-doctor" },
  { label: "Specialties", href: "/specialties" },
  { label: "Medications", href: "/medications" },
  { label: "Insurance", href: "/insurance" },
  { label: "Labs", href: "/labs" },
];

const UAE_CITY_LINKS = [
  { label: "Dubai", href: "/directory/dubai" },
  { label: "Abu Dhabi", href: "/directory/abu-dhabi" },
  { label: "Sharjah", href: "/directory/sharjah" },
  { label: "Ajman", href: "/directory/ajman" },
  { label: "RAK", href: "/directory/ras-al-khaimah" },
  { label: "Fujairah", href: "/directory/fujairah" },
  { label: "UAQ", href: "/directory/umm-al-quwain" },
  { label: "Al Ain", href: "/directory/al-ain" },
];

type CountryCode = "qa" | "sa" | "bh" | "kw" | "tr";

const CITY_LINKS_BY_COUNTRY: Record<CountryCode, Array<{ label: string; href: string }>> = {
  qa: [
    { label: "Doha", href: "/qa/directory/doha" },
    { label: "Al Wakrah", href: "/qa/directory/al-wakrah" },
    { label: "Al Khor", href: "/qa/directory/al-khor" },
    { label: "Al Rayyan", href: "/qa/directory/al-rayyan" },
    { label: "Umm Salal", href: "/qa/directory/umm-salal" },
    { label: "Lusail", href: "/qa/directory/lusail" },
    { label: "Al Jumailiya", href: "/qa/directory/al-jumailiya" },
    { label: "Al Shahaniya", href: "/qa/directory/al-shahaniya" },
    { label: "Dukhan", href: "/qa/directory/dukhan" },
    { label: "Umm Bab", href: "/qa/directory/umm-bab" },
  ],
  sa: [
    { label: "Riyadh", href: "/sa/directory/riyadh" },
    { label: "Jeddah", href: "/sa/directory/jeddah" },
    { label: "Mecca", href: "/sa/directory/mecca" },
    { label: "Medina", href: "/sa/directory/medina" },
    { label: "Dammam", href: "/sa/directory/dammam" },
    { label: "Khobar", href: "/sa/directory/khobar" },
    { label: "Dhahran", href: "/sa/directory/dhahran" },
    { label: "Tabuk", href: "/sa/directory/tabuk" },
    { label: "Abha", href: "/sa/directory/abha" },
    { label: "Taif", href: "/sa/directory/taif" },
    { label: "Buraidah", href: "/sa/directory/buraidah" },
    { label: "Hail", href: "/sa/directory/hail" },
    { label: "Jazan", href: "/sa/directory/jazan" },
    { label: "Najran", href: "/sa/directory/najran" },
    { label: "Al Ahsa", href: "/sa/directory/al-ahsa" },
    { label: "Khamis Mushait", href: "/sa/directory/khamis-mushait" },
    { label: "Al Kharj", href: "/sa/directory/al-kharj" },
    { label: "Al Jubail", href: "/sa/directory/al-jubail" },
    { label: "Jubail", href: "/sa/directory/jubail" },
    { label: "Yanbu", href: "/sa/directory/yanbu" },
    { label: "Qassim", href: "/sa/directory/qassim" },
    { label: "Hafar Al Batin", href: "/sa/directory/hafar-al-batin" },
    { label: "Al Lith", href: "/sa/directory/al-lith" },
    { label: "Al Sulayyil", href: "/sa/directory/al-sulayyil" },
    { label: "Dawadmi", href: "/sa/directory/dawadmi" },
    { label: "Khafji", href: "/sa/directory/khafji" },
    { label: "Neom", href: "/sa/directory/neom" },
    { label: "Nuairiyah", href: "/sa/directory/nuairiyah" },
    { label: "Wadi Al Dawasir", href: "/sa/directory/wadi-al-dawasir" },
  ],
  bh: [
    { label: "Manama", href: "/bh/directory/manama" },
    { label: "Muharraq", href: "/bh/directory/muharraq" },
    { label: "Riffa", href: "/bh/directory/riffa" },
    { label: "Isa Town", href: "/bh/directory/isa-town" },
    { label: "Sitra", href: "/bh/directory/sitra" },
    { label: "Hamad Town", href: "/bh/directory/hamad-town" },
    { label: "Budaiya", href: "/bh/directory/budaiya" },
    { label: "Aali", href: "/bh/directory/aali" },
    { label: "Adliya", href: "/bh/directory/adliya" },
    { label: "Al Seef", href: "/bh/directory/al-seef" },
    { label: "Amwaj", href: "/bh/directory/amwaj" },
    { label: "Arad", href: "/bh/directory/arad" },
    { label: "Busaiteen", href: "/bh/directory/busaiteen" },
    { label: "Hidd", href: "/bh/directory/hidd" },
    { label: "Jid Hafs", href: "/bh/directory/jid-hafs" },
    { label: "Saar", href: "/bh/directory/saar" },
    { label: "Sanabis", href: "/bh/directory/sanabis" },
    { label: "Sanad", href: "/bh/directory/sanad" },
    { label: "Tubli", href: "/bh/directory/tubli" },
    { label: "Zinj", href: "/bh/directory/zinj" },
  ],
  kw: [
    { label: "Kuwait City", href: "/kw/directory/kuwait-city" },
    { label: "Hawalli", href: "/kw/directory/hawalli" },
    { label: "Salmiya", href: "/kw/directory/salmiya" },
    { label: "Farwaniya", href: "/kw/directory/farwaniya" },
    { label: "Jahra", href: "/kw/directory/jahra" },
    { label: "Ahmadi", href: "/kw/directory/ahmadi" },
    { label: "Mangaf", href: "/kw/directory/mangaf" },
  ],
  tr: [{ label: "Istanbul", href: "/tr/directory/istanbul" }],
};

function useCountryContext(pathname: string) {
  return useMemo(() => {
    const match = pathname.match(/^\/(qa|sa|bh|kw|tr)(\/|$)/);
    if (!match) return null;
    const code = match[1] as CountryCode;
    const country = COUNTRIES.find((c) => c.code === code);
    if (!country) return null;
    return {
      code,
      name: country.name,
      cityLinks: CITY_LINKS_BY_COUNTRY[code],
    };
  }, [pathname]);
}

function getArabicPath(pathname: string): string | null {
  if (pathname.startsWith("/ar")) return pathname.replace(/^\/ar/, "") || "/";
  if (pathname === "/" || pathname.startsWith("/directory") || pathname.startsWith("/best"))
    return `/ar${pathname}`;
  return null;
}

function focusPageSearch(segment: SearchSegment | "query" = "query"): boolean {
  if (typeof document === "undefined") return false;

  const root = document.querySelector<HTMLElement>("[data-zavis-search-root='true']");
  if (!root) return false;

  root.scrollIntoView({ behavior: "smooth", block: "center" });
  root.classList.remove("zavis-search-focus");
  window.requestAnimationFrame(() => root.classList.add("zavis-search-focus"));
  window.setTimeout(() => root.classList.remove("zavis-search-focus"), 1800);

  const fieldMap: Record<string, string> = {
    query: "[data-zavis-search-query='true']",
    specialty: "[data-zavis-search-specialty='true']",
    city: "[data-zavis-search-city='true']",
    condition: "[data-zavis-search-condition='true']",
    insurance: "[data-zavis-search-insurance='true']",
  };
  const selector = fieldMap[segment] || fieldMap.query;
  const field = root.matches(selector)
    ? root
    : root.querySelector<HTMLElement>(selector);
  window.setTimeout(() => field?.focus({ preventScroll: true }), 250);
  return true;
}

function useDesktopHeaderMedia() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const update = () => setIsDesktop(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return isDesktop;
}

export function ZavisHeader({ heroHasPill: heroHasPillProp }: ZavisHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const countryCtx = useCountryContext(pathname);
  const isDesktopHeader = useDesktopHeaderMedia();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [initialSegment, setInitialSegment] = useState<SearchSegment | null>(null);

  // Auto-detect the hero-pill routes unless explicitly overridden. These
  // pages render their own expanded pill in the hero, so the header pill
  // should collapse in after scroll.
  const isHeroRoute =
    pathname === "/directory" ||
    pathname === "/" ||
    pathname === "/find-a-doctor" ||
    pathname === "/ar/directory";
  const heroHasPill = heroHasPillProp ?? isHeroRoute;

  // Sticky pill visibility: if hero has its own pill, show header pill only
  // after user scrolls past the hero. Otherwise, always show the compact pill.
  const [pillVisible, setPillVisible] = useState(!heroHasPill);
  useEffect(() => {
    if (!heroHasPill) {
      setPillVisible(true);
      return;
    }
    const update = () => setPillVisible(window.scrollY > 280);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [heroHasPill]);

  // Search state shared between header pill and modal
  const [searchState, setSearchState] = useState<SearchPillState>({
    specialty: "",
    city: "",
    condition: "",
    insurance: "",
  });

  // Close mobile on route change
  useEffect(() => setMobileOpen(false), [pathname]);

  // Esc closes mobile
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  const cityLinks = countryCtx?.cityLinks ?? UAE_CITY_LINKS;
  const directoryHome = countryCtx ? `/${countryCtx.code}/directory` : "/directory";
  const mobileCities = cityLinks;
  const arabicHref = getArabicPath(pathname);

  const handleSubmit = useCallback(() => {
    const params = new URLSearchParams();
    if (searchState.specialty) params.set("category", searchState.specialty);
    if (searchState.city) params.set("city", searchState.city);
    if (searchState.condition) params.set("condition", searchState.condition);
    if (searchState.insurance) params.set("insurance", searchState.insurance);
    dispatchRouteLoadingStart();
    router.push(`/search?${params.toString()}`);
  }, [router, searchState]);

  const openModal = useCallback((seg: SearchSegment) => {
    setInitialSegment(seg);
    setModalOpen(true);
  }, []);

  const handleSearchIntent = useCallback((seg: SearchSegment | "query" = "query") => {
    if (focusPageSearch(seg)) return;
    openModal(seg === "query" ? "specialty" : seg);
  }, [openModal]);

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-ink-line">
        <div className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 gap-4">
            {/* Left — Brand. Both pieces are text so they share the same
                font baseline (the previous SVG-image + text combination
                had a visible vertical-alignment mismatch). */}
            <Link href={directoryHome} prefetch={false} className="flex items-baseline gap-2.5 flex-shrink-0">
              <span
                aria-label="Zavis"
                className="font-[system-ui,sans-serif] sm:font-display text-[24px] font-semibold tracking-[-0.02em] text-ink leading-none"
              >
                zavis<span className="text-[#006828]">.</span>
              </span>
              <span className="hidden sm:inline-block font-display font-semibold text-ink text-[15px] tracking-[-0.01em] whitespace-nowrap leading-none">
                Healthcare Directory
              </span>
            </Link>

            {/* Center — compact SearchPill (desktop) */}
            <div className="hidden md:flex flex-1 justify-center">
              {pillVisible ? (
                <div key="pill" className="animate-fade-up">
                  {isDesktopHeader ? (
                    <DesktopSearchPill
                      variant="compact"
                      state={searchState}
                      onSegmentClick={(seg) => handleSearchIntent(seg)}
                      onSubmit={() => handleSearchIntent("query")}
                    />
                  ) : (
                    <div className="h-12 w-[min(48vw,560px)]" aria-hidden="true" />
                  )}
                </div>
              ) : (
                <div key="pill-spacer" className="h-12" />
              )}
            </div>

            {/* Right — CTAs */}
            <div className="hidden md:flex items-center gap-2 flex-shrink-0">
              {arabicHref && (
                <Link
                  href={arabicHref}
                  prefetch={false}
                  className="font-sans text-z-body-sm font-medium text-ink-soft hover:text-ink px-3 py-2 rounded-z-pill hover:bg-surface-cream transition-colors duration-z-fast"
                >
                  {pathname.startsWith("/ar") ? "EN" : "عربي"}
                </Link>
              )}
              <Link
                href="/tools"
                prefetch={false}
                className="font-sans text-z-body-sm font-medium text-ink-soft hover:text-ink px-3 py-2 rounded-z-pill hover:bg-surface-cream transition-colors duration-z-fast whitespace-nowrap"
              >
                Free tools
              </Link>
              <Link
                href="/jobs"
                prefetch={false}
                className="font-sans text-z-body-sm font-medium text-ink-soft hover:text-ink px-3 py-2 rounded-z-pill hover:bg-surface-cream transition-colors duration-z-fast whitespace-nowrap"
              >
                Jobs
              </Link>
              <Link
                href="/claim"
                prefetch={false}
                className="font-sans text-z-body-sm font-medium text-ink-soft hover:text-ink px-3 py-2 rounded-z-pill hover:bg-surface-cream transition-colors duration-z-fast whitespace-nowrap"
              >
                Claim your listing
              </Link>
              <DeferredHeaderAccountLink pathname={pathname} />
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
                className="inline-flex items-center justify-center h-10 w-10 border border-ink-hairline rounded-full hover:shadow-z-card transition-shadow duration-z-fast"
              >
                <Menu className="h-4 w-4 text-ink" strokeWidth={2.5} />
              </button>
            </div>

            {/* Mobile — compact */}
            <div className="md:hidden flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSearchIntent("query")}
                aria-label="Search"
                className="px-4 py-2 border border-ink-hairline rounded-z-pill font-sans text-z-body-sm text-ink shadow-z-card"
              >
                Search
              </button>
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
                className="p-2"
              >
                <Menu className="h-6 w-6 text-ink" />
              </button>
            </div>
          </div>

          {/* City strip (desktop, directory routes only) — subtle secondary nav */}
          {pathname.startsWith("/directory") || pathname.startsWith("/qa") || pathname.startsWith("/sa") || pathname.startsWith("/bh") || pathname.startsWith("/kw") || pathname.startsWith("/tr") ? (
            <div className="hidden lg:flex items-center justify-between border-t border-ink-line py-2">
              <nav className="flex items-center gap-0 overflow-x-auto z-no-scrollbar">
                {cityLinks.map((link) => {
                  const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      prefetch={false}
                      className={cn(
                        "px-3 py-1.5 font-sans text-z-body-sm whitespace-nowrap transition-colors duration-z-fast",
                        isActive ? "text-ink font-semibold" : "text-ink-soft hover:text-ink"
                      )}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </nav>
              <nav className="flex items-center gap-0 flex-shrink-0">
                {SECTION_LINKS.map((link) => {
                  const isActive = pathname.startsWith(link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      prefetch={false}
                      className={cn(
                        "px-3 py-1.5 font-sans text-z-body-sm whitespace-nowrap transition-colors duration-z-fast",
                        isActive ? "text-ink font-semibold" : "text-ink-soft hover:text-ink"
                      )}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
          ) : null}
        </div>
      </header>

      {/* Search modal (expanded pill + flyouts) */}
      {modalOpen ? (
        <SearchPillModal
          open={modalOpen}
          state={searchState}
          onChange={setSearchState}
          onClose={() => setModalOpen(false)}
          onSubmit={handleSubmit}
          initialSegment={initialSegment}
        />
      ) : null}

      {/* Mobile nav drawer */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-[90] bg-black/30 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        >
          <aside
            onClick={(e) => e.stopPropagation()}
            className="absolute right-0 top-0 h-full w-[min(86vw,380px)] bg-white shadow-z-float flex flex-col"
          >
              <div className="flex items-center justify-between px-6 py-5 border-b border-ink-line">
                <span className="font-display font-semibold text-ink text-z-h3">Menu</span>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close menu"
                  className="p-2 hover:bg-surface-cream rounded-full"
                >
                  <X className="h-5 w-5 text-ink" />
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
                <section>
                  <h3 className="font-sans text-z-micro text-ink-muted uppercase tracking-[0.04em] mb-3">
                    {countryCtx ? "Cities" : "Emirates"}
                  </h3>
                  <div className="grid grid-cols-2 gap-y-2">
                    {mobileCities.map((city) => (
                      <Link
                        key={city.href}
                        href={city.href}
                        prefetch={false}
                        className="font-sans text-z-body text-ink py-1.5"
                      >
                        {city.label}
                      </Link>
                    ))}
                  </div>
                </section>
                <section>
                  <h3 className="font-sans text-z-micro text-ink-muted uppercase tracking-[0.04em] mb-3">
                    Explore
                  </h3>
                  <div className="flex flex-col gap-0">
                    {SECTION_LINKS.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        prefetch={false}
                        className="font-sans text-z-body text-ink py-2"
                      >
                        {link.label}
                      </Link>
                    ))}
                    <Link href="/pharmacy" prefetch={false} className="font-sans text-z-body text-ink py-2">Pharmacy</Link>
                    <Link href="/conditions" prefetch={false} className="font-sans text-z-body text-ink py-2">Conditions</Link>
                    <Link href="/verified-reviews" prefetch={false} className="font-sans text-z-body text-ink py-2">Verified Reviews</Link>
                  </div>
                </section>
              </nav>
              <div className="border-t border-ink-line px-6 py-5 space-y-3">
                <Link
                  href="/claim"
                  prefetch={false}
                  className="block text-center bg-accent hover:bg-accent-dark text-white font-sans font-semibold text-z-body-sm py-3 rounded-z-pill transition-colors"
                >
                  Claim your listing
                </Link>
                <DeferredHeaderAccountLink
                  pathname={pathname}
                  mobile
                  onNavigate={() => setMobileOpen(false)}
                />
                {arabicHref && (
                  <Link
                    href={arabicHref}
                    prefetch={false}
                    className="block text-center font-sans font-medium text-ink-soft py-2"
                  >
                    {pathname.startsWith("/ar") ? "Switch to English" : "Switch to عربي"}
                  </Link>
                )}
              </div>
          </aside>
        </div>
      )}
    </>
  );
}
