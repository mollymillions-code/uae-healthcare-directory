"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShimmerLink } from "@/components/landing/ui/shimmer-button";
import {
  Menu,
  X,
  ChevronDown,
  Smile,
  Droplets,
  Eye,
  Bone,
  Ear,
  Clock,
  Brain,
  PawPrint,
  Home,
  Sparkles,
  HeartPulse,
  ExternalLink,
  Mail,
  MapPin,
  Newspaper,
} from "lucide-react";
import svgPaths from "@/imports/svg-a821gkm5bu";

export function ZavisLogo({ color = "black" }: { color?: string }) {
  return (
    <svg width="80" height="21" viewBox="0 0 80 21" fill="none" aria-label="Zavis" role="img">
      <g clipPath="url(#zavisLogo)">
        <path d={svgPaths.p5d2e200} fill={color} />
      </g>
      <defs>
        <clipPath id="zavisLogo">
          <rect width="80" height="21" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}

type SpecialtyItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

type DescItem = {
  label: string;
  href: string;
  desc: string;
};

type ComingSoonItem = {
  label: string;
  comingSoon: true;
};

type CardItem = {
  label: string;
  href: string;
  desc: string;
  card: true;
};

type ExternalItem = {
  label: string;
  externalHref: string;
  external?: boolean;
  dimmed?: boolean;
};

type MegaColumn = {
  heading: string;
} & (
  | { type: "specialty"; items: SpecialtyItem[] }
  | { type: "desc"; items: DescItem[] }
  | { type: "coming-soon"; items: ComingSoonItem[] }
  | { type: "card"; items: CardItem[] }
  | { type: "mixed"; items: (ExternalItem | { label: string; href: string })[] }
);

type MegaMenuData = {
  label: string;
  columns: MegaColumn[];
};

const specialties: SpecialtyItem[] = [
  { label: "Dental", href: "/dental", icon: Smile },
  { label: "Dermatology", href: "/dermatology", icon: Droplets },
  { label: "Optometry", href: "/optometry", icon: Eye },
  { label: "Orthopedics", href: "/orthopedics", icon: Bone },
  { label: "ENT", href: "/ent", icon: Ear },
  { label: "Urgent Care", href: "/urgent-care", icon: Clock },
  { label: "Mental Health", href: "/mental-health", icon: Brain },
  { label: "Veterinary", href: "/veterinary", icon: PawPrint },
  { label: "Homecare", href: "/homecare", icon: Home },
  { label: "Aesthetic", href: "/aesthetic", icon: Sparkles },
  { label: "Longevity & Wellness", href: "/longevity-wellness", icon: HeartPulse },
];

const megaMenus: MegaMenuData[] = [
  {
    label: "Solutions",
    columns: [
      {
        heading: "BY SPECIALTY",
        type: "specialty",
        items: specialties,
      },
      {
        heading: "KEY OPERATIONS",
        type: "desc",
        items: [
          { label: "CRM", href: "/crm", desc: "Native patient CRM & pipeline" },
          { label: "Analytics", href: "/analytics", desc: "Revenue attribution & reporting" },
          { label: "Automations", href: "/automations", desc: "Always-on patient journeys" },
          { label: "Campaigns", href: "/campaigns", desc: "Multi-channel broadcast campaigns" },
        ],
      },
      {
        heading: "RESOURCES",
        type: "coming-soon",
        items: [
          { label: "Case Studies", comingSoon: true },
          { label: "Blog", comingSoon: true },
        ],
      },
    ],
  },
  {
    label: "Platform",
    columns: [
      {
        heading: "COMMUNICATION",
        type: "desc",
        items: [
          {
            label: "Omnichannel Inbox",
            href: "/chat",
            desc: "WhatsApp, Instagram, Facebook, TikTok, web. One thread per patient",
          },
          {
            label: "Voice",
            href: "/voice",
            desc: "Native cloud calling with screen pop, recording & transcripts",
          },
          {
            label: "Website Widgets",
            href: "/widgets",
            desc: "Booking + chat widgets on your site with EMR writeback",
          },
        ],
      },
      {
        heading: "AI & AUTOMATION",
        type: "desc",
        items: [
          {
            label: "AI Agents",
            href: "/ai-agents",
            desc: "Brand-tuned chat & voice AI that qualifies, books, and follows up",
          },
          {
            label: "EMR Integration",
            href: "/emr",
            desc: "Bidirectional EMR sync. Zero double entry, one source of truth",
          },
          {
            label: "Integrations",
            href: "/integrations",
            desc: "Webhooks, OpenAI, Google Translate, Dyte & more",
          },
        ],
      },
      {
        heading: "OPERATIONS",
        type: "desc",
        items: [
          {
            label: "Bookings",
            href: "/bookings",
            desc: "Live EMR sync. Create, reschedule, cancel with writeback",
          },
          {
            label: "Payment Collection",
            href: "/payments",
            desc: "In-chat payment links with tracking & EMR-linked invoicing",
          },
          {
            label: "Mobile App",
            href: "/mobile",
            desc: "Full Zavis on iOS & Android. Conversations, reports, team management",
          },
        ],
      },
    ],
  },
  {
    label: "Company",
    columns: [
      {
        heading: "COMPANY",
        type: "card",
        items: [
          { label: "About", href: "/about", desc: "Our mission, values & UAE-based team", card: true },
        ],
      },
      {
        heading: "GET IN TOUCH",
        type: "card",
        items: [
          {
            label: "Contact",
            href: "/contact",
            desc: "Book a demo, get pricing, or ask anything",
            card: true,
          },
        ],
      },
      {
        heading: "MORE",
        type: "mixed",
        items: [
          { label: "Help Center", externalHref: "#", external: true, dimmed: true },
          { label: "Email Us", externalHref: "mailto:syed@zavis.ai" },
        ],
      },
    ],
  },
];

function MegaMenuPanel({
  menu,
  onClose,
}: {
  menu: MegaMenuData;
  onClose: () => void;
}) {
  const pathname = usePathname();

  return (
    <div className="grid grid-cols-3 gap-8 p-8">
      {menu.columns.map((col) => (
        <div key={col.heading}>
          <div className="uppercase text-xs tracking-wider text-black/40 font-['Geist',sans-serif] font-medium mb-4">
            {col.heading}
          </div>

          {col.type === "specialty" && (
            <div className="grid grid-cols-2 gap-1">
              {col.items.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors ${
                      active
                        ? "bg-[#006828]/10 text-[#006828]"
                        : "text-[#1c1c1c] hover:bg-[#006828]/5"
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0 opacity-60" />
                    <span className="font-['Bricolage_Grotesque',sans-serif] font-medium text-sm">
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}

          {col.type === "desc" && (
            <div className="space-y-1">
              {col.items.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={`block px-3 py-2.5 rounded-lg transition-colors ${
                      active ? "bg-[#006828]/10" : "hover:bg-[#006828]/5"
                    }`}
                  >
                    <span
                      className={`block font-['Bricolage_Grotesque',sans-serif] font-medium text-sm ${
                        active ? "text-[#006828]" : "text-[#1c1c1c]"
                      }`}
                    >
                      {item.label}
                    </span>
                    <span className="block font-['Geist',sans-serif] text-xs text-black/40 mt-0.5">
                      {item.desc}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}

          {col.type === "coming-soon" && (
            <div className="space-y-1">
              {col.items.map((item) => (
                <div
                  key={item.label}
                  className="px-3 py-2.5 rounded-lg opacity-40 cursor-default"
                >
                  <span className="block font-['Bricolage_Grotesque',sans-serif] font-medium text-sm text-[#1c1c1c]">
                    {item.label}
                  </span>
                  <span className="block font-['Geist',sans-serif] text-xs text-black/40 mt-0.5">
                    Coming soon
                  </span>
                </div>
              ))}
            </div>
          )}

          {col.type === "card" && (
            <div className="space-y-2">
              {col.items.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={`block px-4 py-4 rounded-xl border transition-colors ${
                      active
                        ? "border-[#006828]/20 bg-[#006828]/5"
                        : "border-black/[0.06] hover:bg-[#006828]/5 hover:border-[#006828]/10"
                    }`}
                  >
                    <span
                      className={`block font-['Bricolage_Grotesque',sans-serif] font-semibold text-base ${
                        active ? "text-[#006828]" : "text-[#1c1c1c]"
                      }`}
                    >
                      {item.label}
                    </span>
                    <span className="block font-['Geist',sans-serif] text-xs text-black/40 mt-1">
                      {item.desc}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}

          {col.type === "mixed" && (
            <div className="space-y-1">
              {col.items.map((item) => {
                if ("externalHref" in item) {
                  const ext = item as ExternalItem;
                  return (
                    <a
                      key={ext.label}
                      href={ext.externalHref}
                      target={ext.external ? "_blank" : undefined}
                      rel={ext.external ? "noopener noreferrer" : undefined}
                      onClick={onClose}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg transition-colors ${
                        ext.dimmed
                          ? "opacity-40 cursor-default"
                          : "hover:bg-[#006828]/5 text-[#1c1c1c]"
                      }`}
                    >
                      <span className="font-['Bricolage_Grotesque',sans-serif] font-medium text-sm">
                        {ext.label}
                      </span>
                      {ext.external && <ExternalLink className="w-3 h-3 opacity-40" />}
                      {ext.externalHref.startsWith("mailto:") && <Mail className="w-3 h-3 opacity-40" />}
                    </a>
                  );
                }
                const link = item as { label: string; href: string };
                return (
                  <Link
                    key={link.label}
                    href={link.href}
                    onClick={onClose}
                    className="block px-3 py-2.5 rounded-lg hover:bg-[#006828]/5 transition-colors"
                  >
                    <span className="font-['Bricolage_Grotesque',sans-serif] font-medium text-sm text-[#1c1c1c]">
                      {link.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function MobileAccordion({
  menu,
  expanded,
  onToggle,
  onClose,
}: {
  menu: MegaMenuData;
  expanded: boolean;
  onToggle: () => void;
  onClose: () => void;
}) {
  const pathname = usePathname();

  const allLinks: { label: string; href?: string; externalHref?: string; dimmed?: boolean; section?: string }[] = [];

  for (const col of menu.columns) {
    if (col.type === "specialty") {
      for (const item of col.items) {
        allLinks.push({ label: item.label, href: item.href, section: col.heading });
      }
    } else if (col.type === "desc") {
      for (const item of col.items) {
        allLinks.push({ label: item.label, href: item.href, section: col.heading });
      }
    } else if (col.type === "coming-soon") {
      for (const item of col.items) {
        allLinks.push({ label: item.label, dimmed: true, section: col.heading });
      }
    } else if (col.type === "card") {
      for (const item of col.items) {
        allLinks.push({ label: item.label, href: item.href, section: col.heading });
      }
    } else if (col.type === "mixed") {
      for (const item of col.items) {
        if ("externalHref" in item) {
          const ext = item as ExternalItem;
          allLinks.push({ label: ext.label, externalHref: ext.externalHref, dimmed: ext.dimmed, section: col.heading });
        } else {
          const link = item as { label: string; href: string };
          allLinks.push({ label: link.label, href: link.href, section: col.heading });
        }
      }
    }
  }

  let lastSection = "";

  return (
    <div className="border-b border-black/5">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full py-4 font-['Bricolage_Grotesque',sans-serif] font-medium text-black focus-visible:outline-none focus-visible:text-[#006828]"
        aria-expanded={expanded}
      >
        {menu.label}
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          expanded ? "max-h-[800px] pb-3" : "max-h-0"
        }`}
      >
        <div className="pl-2 space-y-0.5">
          {allLinks.map((item, i) => {
            const showSection = item.section !== lastSection;
            lastSection = item.section || "";

            return (
              <div key={`${item.label}-${i}`}>
                {showSection && item.section && (
                  <div className="uppercase text-[10px] tracking-wider text-black/30 font-['Geist',sans-serif] font-medium mt-3 mb-1 px-3">
                    {item.section}
                  </div>
                )}
                {item.dimmed ? (
                  <div className="py-2 px-3 rounded-lg opacity-40 cursor-default font-['Geist',sans-serif] font-medium text-sm text-black/60">
                    {item.label}
                    <span className="text-xs ml-2">Coming soon</span>
                  </div>
                ) : item.externalHref ? (
                  <a
                    href={item.externalHref}
                    onClick={onClose}
                    className="block py-2 px-3 rounded-lg font-['Geist',sans-serif] font-medium text-sm text-black/60 hover:text-black hover:bg-black/5"
                  >
                    {item.label}
                  </a>
                ) : item.href ? (
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={`block py-2 px-3 rounded-lg font-['Geist',sans-serif] font-medium text-sm ${
                      pathname === item.href
                        ? "bg-[#006828]/10 text-[#006828]"
                        : "text-black/60 hover:text-black hover:bg-black/5"
                    }`}
                  >
                    {item.label}
                  </Link>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const menuButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    setMobileOpen(false);
    setMobileExpanded(null);
    setActiveMenu(null);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (!activeMenu) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeMenu]);

  const handleMenuEnter = useCallback((label: string) => {
    clearTimeout(closeTimeoutRef.current);
    setActiveMenu(label);
  }, []);

  const handleMenuLeave = useCallback(() => {
    closeTimeoutRef.current = setTimeout(() => setActiveMenu(null), 150);
  }, []);

  useEffect(() => {
    return () => clearTimeout(closeTimeoutRef.current);
  }, []);

  const closeMega = useCallback(() => {
    setActiveMenu(null);
  }, []);

  const getArrowOffset = (label: string): number => {
    const btn = menuButtonRefs.current[label];
    const nav = navRef.current;
    if (!btn || !nav) return 0;
    const btnRect = btn.getBoundingClientRect();
    const navRect = nav.getBoundingClientRect();
    return btnRect.left + btnRect.width / 2 - navRect.left;
  };

  return (
    <>
      <nav ref={navRef} className="sticky top-0 z-50 bg-[#f8f8f6]/90 border-b border-black/5" style={{ backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link
              href="/"
              className="flex-shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006828] rounded"
            >
              <ZavisLogo />
            </Link>

            <div className="hidden lg:flex items-center gap-0.5">
              {megaMenus.map((menu) => (
                <div
                  key={menu.label}
                  onMouseEnter={() => handleMenuEnter(menu.label)}
                  onMouseLeave={handleMenuLeave}
                >
                  <button
                    ref={(el) => {
                      menuButtonRefs.current[menu.label] = el;
                    }}
                    className={`flex items-center gap-1 px-4 py-2 font-['Bricolage_Grotesque',sans-serif] font-medium text-[16px] transition-colors rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006828] ${
                      activeMenu === menu.label ? "text-[#006828]" : "text-black hover:text-[#006828]"
                    }`}
                    onClick={() => setActiveMenu(activeMenu === menu.label ? null : menu.label)}
                    aria-expanded={activeMenu === menu.label}
                    aria-haspopup="true"
                  >
                    {menu.label}
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${
                        activeMenu === menu.label ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                </div>
              ))}
              <a
                href="/directory"
                className="flex items-center gap-1.5 px-4 py-2 font-['Bricolage_Grotesque',sans-serif] font-medium text-[16px] text-black hover:text-[#006828] transition-colors rounded-lg"
              >
                UAE Healthcare Directory
              </a>
              <a
                href="/intelligence"
                className="flex items-center gap-1.5 px-4 py-2 font-['Bricolage_Grotesque',sans-serif] font-medium text-[16px] text-black hover:text-[#006828] transition-colors rounded-lg"
              >
                Intelligence
              </a>
            </div>

            <div className="hidden lg:block">
              <Link
                href="/contact"
                className="group relative z-0 inline-flex items-center justify-center overflow-hidden rounded-full bg-[#0a0a0a] px-6 py-2.5 font-['Bricolage_Grotesque',sans-serif] font-medium text-[16px] text-white transition-all duration-500 hover:text-[#004a1c] hover:shadow-[0_0_32px_rgba(0,104,40,0.45)]"
                style={{
                  "--spread": "90deg",
                  "--shimmer-color": "#006828",
                  "--radius": "100px",
                  "--speed": "2.5s",
                  "--cut": "1.5px",
                  "--bg": "rgba(0,0,0,1)",
                } as React.CSSProperties}
              >
                {/* Shimmer border spark -- same as other buttons */}
                <div
                  className="absolute inset-0 overflow-visible [container-type:size]"
                  style={{ zIndex: -30 }}
                >
                  <div
                    className="absolute inset-0 h-[100cqh] [aspect-ratio:1] [border-radius:0] [mask:none]"
                    style={{ animation: "shimmer-slide var(--speed) ease-in-out infinite alternate" }}
                  >
                    <div
                      className="absolute -inset-full w-auto rotate-0 [translate:0_0]"
                      style={{
                        background: "conic-gradient(from calc(270deg - (var(--spread) * 0.5)), transparent 0, var(--shimmer-color) var(--spread), transparent var(--spread))",
                        animation: "spin-around calc(var(--speed) * 2) infinite linear",
                      }}
                    />
                  </div>
                </div>
                {/* Shimmer border glow */}
                <div
                  className="pointer-events-none absolute overflow-visible [container-type:size]"
                  style={{ inset: "-8px", zIndex: -31, filter: "blur(12px)", opacity: 0.6 }}
                >
                  <div
                    className="absolute inset-0 h-[100cqh] [aspect-ratio:1] [border-radius:0] [mask:none]"
                    style={{ animation: "shimmer-slide var(--speed) ease-in-out infinite alternate" }}
                  >
                    <div
                      className="absolute -inset-full w-auto rotate-0 [translate:0_0]"
                      style={{
                        background: "conic-gradient(from calc(270deg - (var(--spread) * 0.5)), transparent 0, var(--shimmer-color) var(--spread), transparent var(--spread))",
                        animation: "spin-around calc(var(--speed) * 2) infinite linear",
                      }}
                    />
                  </div>
                </div>
                {/* Backdrop -- solid bg inset by shimmer border width */}
                <div
                  className="absolute [background:var(--bg)] rounded-full transition-colors duration-500 group-hover:[background:#e0f2e7]"
                  style={{ inset: "var(--cut)", zIndex: -20 }}
                />
                {/* Gradient mesh -- fully covers button on hover, green + white */}
                <div
                  className="pointer-events-none absolute rounded-full opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  style={{ inset: "var(--cut)", zIndex: -19 }}
                  aria-hidden="true"
                >
                  <div className="absolute inset-0 rounded-full overflow-hidden">
                    {/* Base fill */}
                    <div className="absolute inset-0 bg-[#e0f2e7]" />
                    {/* Blob 1 -- deep Zavis green */}
                    <div
                      className="absolute rounded-full"
                      style={{
                        width: "150%", height: "150%", top: "-25%", left: "-25%",
                        background: "radial-gradient(circle, rgba(0,104,40,0.7) 0%, transparent 55%)",
                        animation: "mesh-blob-1 6s ease-in-out infinite",
                        filter: "blur(16px)",
                      }}
                    />
                    {/* Blob 2 -- bright emerald */}
                    <div
                      className="absolute rounded-full"
                      style={{
                        width: "130%", height: "130%", top: "-15%", left: "10%",
                        background: "radial-gradient(circle, rgba(0,166,62,0.65) 0%, transparent 50%)",
                        animation: "mesh-blob-2 7s ease-in-out infinite",
                        filter: "blur(14px)",
                      }}
                    />
                    {/* Blob 3 -- light mint */}
                    <div
                      className="absolute rounded-full"
                      style={{
                        width: "140%", height: "140%", top: "-20%", left: "-10%",
                        background: "radial-gradient(circle, rgba(74,222,128,0.6) 0%, transparent 50%)",
                        animation: "mesh-blob-3 5s ease-in-out infinite",
                        filter: "blur(18px)",
                      }}
                    />
                    {/* Blob 4 -- white highlight */}
                    <div
                      className="absolute rounded-full"
                      style={{
                        width: "100%", height: "100%", top: "0%", left: "5%",
                        background: "radial-gradient(circle, rgba(255,255,255,0.85) 0%, transparent 55%)",
                        animation: "mesh-blob-4 8s ease-in-out infinite",
                        filter: "blur(12px)",
                      }}
                    />
                    {/* Grain overlay */}
                    <div
                      className="absolute inset-0 mix-blend-overlay opacity-30"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                        backgroundSize: "128px 128px",
                      }}
                    />
                  </div>
                </div>
                <span className="relative z-10 transition-colors duration-500">Book a Demo</span>
              </Link>
            </div>

            <button
              className="lg:hidden p-2 -mr-2 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006828]"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {megaMenus.map((menu) => {
          const isOpen = activeMenu === menu.label;
          const arrowOffset = getArrowOffset(menu.label);

          return (
            <div
              key={menu.label}
              className="hidden lg:block"
              onMouseEnter={() => handleMenuEnter(menu.label)}
              onMouseLeave={handleMenuLeave}
            >
              <div
                className={`absolute left-0 right-0 top-full z-50 flex justify-center transition-all duration-200 origin-top ${
                  isOpen
                    ? "opacity-100 scale-100 pointer-events-auto"
                    : "opacity-0 scale-[0.98] pointer-events-none"
                }`}
              >
                <div
                  className="fixed inset-0 top-16 bg-black/5 -z-10 transition-opacity duration-200"
                  style={{ opacity: isOpen ? 1 : 0 }}
                />

                <div className="relative w-full max-w-[1000px] mx-4 mt-2">
                  <div
                    className="absolute -top-[6px] w-3 h-3 bg-white border-l border-t border-black/[0.06] rotate-45 z-10"
                    style={{ left: `${arrowOffset - 24}px` }}
                  />

                  <div className="relative bg-white border border-black/[0.06] rounded-2xl shadow-xl overflow-hidden">
                    <MegaMenuPanel menu={menu} onClose={closeMega} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </nav>

      {/* Mobile drawer - MUST be outside <nav> so backdrop-filter doesn't break fixed positioning */}
      <div
        className={`lg:hidden fixed inset-0 top-16 bg-[#f8f8f6] z-[60] transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!mobileOpen}
      >
        <div className="px-5 pb-6 pt-3 h-full overflow-y-auto">
          {megaMenus.map((menu) => (
            <MobileAccordion
              key={menu.label}
              menu={menu}
              expanded={mobileExpanded === menu.label}
              onToggle={() =>
                setMobileExpanded(mobileExpanded === menu.label ? null : menu.label)
              }
              onClose={() => setMobileOpen(false)}
            />
          ))}
          <div className="border-b border-black/5">
            <a
              href="/directory"
              className="flex items-center gap-2.5 py-4 font-['Bricolage_Grotesque',sans-serif] font-medium text-black"
            >
              <MapPin className="w-4 h-4 opacity-50" />
              UAE Healthcare Directory
            </a>
          </div>
          <div className="border-b border-black/5">
            <a
              href="/intelligence"
              className="flex items-center gap-2.5 py-4 font-['Bricolage_Grotesque',sans-serif] font-medium text-black"
            >
              <Newspaper className="w-4 h-4 opacity-50" />
              Intelligence
            </a>
          </div>
          <div className="mt-6">
            <ShimmerLink
              href="/contact"
              onClick={() => setMobileOpen(false)}
              className="w-full py-3.5 font-['Bricolage_Grotesque',sans-serif] font-medium shadow-[0_0_20px_rgba(0,104,40,0.4)]"
            >
              Book a Demo
            </ShimmerLink>
          </div>
        </div>
      </div>
    </>
  );
}
