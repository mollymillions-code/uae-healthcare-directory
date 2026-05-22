"use client";

import Link from "next/link";
import { MapPin, Newspaper, BookOpen, User, LogIn } from "lucide-react";
import { useSession } from "next-auth/react";
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
  const { status: sessionStatus } = useSession();
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
          <Link
            href="/directory"
            prefetch={false}
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2.5 py-4 font-['Bricolage_Grotesque',sans-serif] font-medium text-black"
          >
            <MapPin className="w-4 h-4 opacity-50" />
            UAE Healthcare Directory
          </Link>
        </div>
        <div className="border-b border-black/5">
          <Link
            href="/intelligence"
            prefetch={false}
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2.5 py-4 font-['Bricolage_Grotesque',sans-serif] font-medium text-black"
          >
            <Newspaper className="w-4 h-4 opacity-50" />
            Intelligence
          </Link>
        </div>
        <div className="border-b border-black/5">
          <Link
            href="/research"
            prefetch={false}
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2.5 py-4 font-['Bricolage_Grotesque',sans-serif] font-medium text-black"
          >
            <BookOpen className="w-4 h-4 opacity-50" />
            Research
          </Link>
        </div>
        <div className="border-b border-black/5">
          {sessionStatus === "authenticated" ? (
            <Link
              href="/account"
              prefetch={false}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2.5 py-4 font-['Bricolage_Grotesque',sans-serif] font-medium text-black"
            >
              <User className="w-4 h-4 opacity-50" />
              My account
            </Link>
          ) : (
            <Link
              href="/login"
              prefetch={false}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2.5 py-4 font-['Bricolage_Grotesque',sans-serif] font-medium text-black"
            >
              <LogIn className="w-4 h-4 opacity-50" />
              Sign in
            </Link>
          )}
        </div>
        <div className="mt-6">
          <ShimmerLink
            href="/book-a-demo"
            prefetch={false}
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
