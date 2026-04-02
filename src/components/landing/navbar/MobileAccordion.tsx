"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import type { MegaMenuData, ExternalItem } from "./types";

export function MobileAccordion({
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
