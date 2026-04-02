"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLink, Mail } from "lucide-react";
import type { MegaMenuData, ExternalItem } from "./types";

export function MegaMenuPanel({
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
