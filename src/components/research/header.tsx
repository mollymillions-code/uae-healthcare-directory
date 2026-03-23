"use client"

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

/**
 * Shared header for report detail pages and legacy pages.
 * The homepage uses its own inline nav (editorial style).
 */
export function Header() {
  return (
    <nav className="sticky top-0 z-50 bg-[#f8f8f6]/95 backdrop-blur-sm border-b border-black/[0.06]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <Link href="/research" className="flex items-baseline gap-1.5">
          <span className="font-['Bricolage_Grotesque',sans-serif] font-semibold text-[#1c1c1c] text-lg tracking-tight">ZAVIS</span>
          <span className="text-black/30 text-[13px] font-medium tracking-wide">RESEARCH</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/research" className="text-[13px] font-medium text-black/40 hover:text-[#006828] transition-colors">
            All Reports
          </Link>
          <Link
            href="/"
            className="text-[13px] font-medium text-[#006828] hover:underline flex items-center gap-0.5"
          >
            zavis.ai <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </nav>
  )
}
