"use client";

import { MapPin, Newspaper, BookOpen } from "lucide-react";
import { ShimmerLink } from "@/components/landing/ui/shimmer-button";
import { megaMenus } from "./types";
import { MobileAccordion } from "./MobileAccordion";

interface MobileNavProps {
  mobileOpen: boolean;
  mobileExpanded: string | null;
  setMobileExpanded: React.Dispatch<React.SetStateAction<string | null>>;
  setMobileOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export function MobileNav({
  mobileOpen,
  mobileExpanded,
  setMobileExpanded,
  setMobileOpen,
}: MobileNavProps) {
  return (
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
        <div className="border-b border-black/5">
          <a
            href="/research"
            className="flex items-center gap-2.5 py-4 font-['Bricolage_Grotesque',sans-serif] font-medium text-black"
          >
            <BookOpen className="w-4 h-4 opacity-50" />
            Research
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
  );
}
