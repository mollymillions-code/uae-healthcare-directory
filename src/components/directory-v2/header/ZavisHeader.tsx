"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { Menu, X } from "lucide-react";
import { CITIES } from "@/lib/constants/cities";
import { COUNTRIES } from "@/lib/constants/countries";
import { SearchPill, type SearchPillState, type SearchSegment } from "./SearchPill";
import { SearchPillModal } from "./SearchPillModal";
import { fade, tStandard } from "../shared/motion";
import { cn } from "../shared/cn";

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

function useCountryContext(pathname: string) {
  return useMemo(() => {
    const match = pathname.match(/^\/(qa|sa|bh|kw)(\/|$)/);
    if (!match) return null;
    const code = match[1];
    const country = COUNTRIES.find((c) => c.code === code);
    if (!country) return null;
    const cities = CITIES.filter((c) => c.country === code);
    return {
      code,
      name: country.name,
      cityLinks: cities.map((c) => ({ label: c.name, href: `/${code}/directory/${c.slug}` })),
    };
  }, [pathname]);
}

function getArabicPath(pathname: string): string | null {
  if (pathname.startsWith("/ar")) return pathname.replace(/^\/ar/, "") || "/";
  if (pathname === "/" || pathname.startsWith("/directory") || pathname.startsWith("/best"))
    return `/ar${pathname}`;
  return null;
}

export function ZavisHeader({ heroHasPill: heroHasPillProp }: ZavisHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const countryCtx = useCountryContext(pathname);
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
  const { scrollY } = useScroll();
  const [pillVisible, setPillVisible] = useState(!heroHasPill);
  useMotionValueEvent(scrollY, "change", (y) => {
    setPillVisible(heroHasPill ? y > 280 : true);
  });

  // Search state shared between header pill and modal
  const [searchState, setSearchState] = useState<SearchPillState>({
    specialty: "",
    city: "",
    date: "",
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
  const mobileCities = countryCtx
    ? CITIES.filter((c) => c.country === countryCtx.code)
    : CITIES.filter((c) => c.country === "ae");
  const arabicHref = getArabicPath(pathname);

  const handleSubmit = useCallback(() => {
    const params = new URLSearchParams();
    if (searchState.specialty) params.set("category", searchState.specialty);
    if (searchState.city) params.set("city", searchState.city);
    if (searchState.date) params.set("when", searchState.date);
    if (searchState.insurance) params.set("insurance", searchState.insurance);
    router.push(`/search?${params.toString()}`);
  }, [router, searchState]);

  const openModal = useCallback((seg: SearchSegment) => {
    setInitialSegment(seg);
    setModalOpen(true);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-ink-line">
        <div className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 gap-4">
            {/* Left — Brand */}
            <Link href={directoryHome} className="flex items-center gap-2.5 flex-shrink-0">
              <Image
                src="/zavis-logo-dark.svg"
                alt="Zavis"
                width={88}
                height={28}
                className="h-7 w-auto"
                priority
                draggable={false}
              />
              <span className="hidden sm:inline-block font-display font-semibold text-ink text-[15px] tracking-[-0.01em] whitespace-nowrap">
                Healthcare Directory
              </span>
            </Link>

            {/* Center — compact SearchPill (desktop) */}
            <div className="hidden md:flex flex-1 justify-center">
              <AnimatePresence mode="wait">
                {pillVisible ? (
                  <motion.div
                    key="pill"
                    variants={fade}
                    initial="hidden"
                    animate="show"
                    exit="exit"
                    transition={tStandard}
                  >
                    <SearchPill
                      variant="compact"
                      state={searchState}
                      onSegmentClick={(seg) => openModal(seg)}
                      onSubmit={() => openModal("specialty")}
                    />
                  </motion.div>
                ) : (
                  <motion.div key="pill-spacer" className="h-12" />
                )}
              </AnimatePresence>
            </div>

            {/* Right — CTAs */}
            <div className="hidden md:flex items-center gap-2 flex-shrink-0">
              {arabicHref && (
                <Link
                  href={arabicHref}
                  className="font-sans text-z-body-sm font-medium text-ink-soft hover:text-ink px-3 py-2 rounded-z-pill hover:bg-surface-cream transition-colors duration-z-fast"
                >
                  {pathname.startsWith("/ar") ? "EN" : "عربي"}
                </Link>
              )}
              <Link
                href="/claim"
                className="font-sans text-z-body-sm font-medium text-ink-soft hover:text-ink px-3 py-2 rounded-z-pill hover:bg-surface-cream transition-colors duration-z-fast whitespace-nowrap"
              >
                Claim your listing
              </Link>
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
                className="inline-flex items-center gap-2 border border-ink-hairline rounded-z-pill pl-3 pr-1 py-1 hover:shadow-z-card transition-shadow duration-z-fast"
              >
                <Menu className="h-4 w-4 text-ink" strokeWidth={2.5} />
                <span className="w-8 h-8 rounded-full bg-ink text-white inline-flex items-center justify-center font-sans text-[12px] font-semibold">
                  Z
                </span>
              </button>
            </div>

            {/* Mobile — compact */}
            <div className="md:hidden flex items-center gap-2">
              <button
                type="button"
                onClick={() => openModal("specialty")}
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
          {pathname.startsWith("/directory") || pathname.startsWith("/qa") || pathname.startsWith("/sa") || pathname.startsWith("/bh") || pathname.startsWith("/kw") ? (
            <div className="hidden lg:flex items-center justify-between border-t border-ink-line py-2">
              <nav className="flex items-center gap-0 overflow-x-auto z-no-scrollbar">
                {cityLinks.map((link) => {
                  const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
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
      <SearchPillModal
        open={modalOpen}
        state={searchState}
        onChange={setSearchState}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        initialSegment={initialSegment}
      />

      {/* Mobile nav drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 z-[90] bg-black/30 backdrop-blur-sm md:hidden"
            variants={fade}
            initial="hidden"
            animate="show"
            exit="exit"
            onClick={() => setMobileOpen(false)}
          >
            <motion.aside
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 top-0 h-full w-[min(86vw,380px)] bg-white shadow-z-float flex flex-col"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={tStandard}
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
                        key={city.slug}
                        href={countryCtx ? `/${countryCtx.code}/directory/${city.slug}` : `/directory/${city.slug}`}
                        className="font-sans text-z-body text-ink py-1.5"
                      >
                        {city.name}
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
                        className="font-sans text-z-body text-ink py-2"
                      >
                        {link.label}
                      </Link>
                    ))}
                    <Link href="/pharmacy" className="font-sans text-z-body text-ink py-2">Pharmacy</Link>
                    <Link href="/conditions" className="font-sans text-z-body text-ink py-2">Conditions</Link>
                    <Link href="/verified-reviews" className="font-sans text-z-body text-ink py-2">Verified Reviews</Link>
                  </div>
                </section>
              </nav>
              <div className="border-t border-ink-line px-6 py-5 space-y-3">
                <Link
                  href="/claim"
                  className="block text-center bg-accent hover:bg-accent-dark text-white font-sans font-semibold text-z-body-sm py-3 rounded-z-pill transition-colors"
                >
                  Claim your listing
                </Link>
                {arabicHref && (
                  <Link
                    href={arabicHref}
                    className="block text-center font-sans font-medium text-ink-soft py-2"
                  >
                    {pathname.startsWith("/ar") ? "Switch to English" : "Switch to عربي"}
                  </Link>
                )}
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
