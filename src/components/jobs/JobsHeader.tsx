import Link from "next/link";
import { Briefcase } from "lucide-react";

export function JobsHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-black/[0.06] bg-white/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[1320px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="font-['Bricolage_Grotesque',sans-serif] text-[18px] font-semibold tracking-tight text-[#1c1c1c]"
          >
            zavis<span className="text-[#006828]">.</span>
          </Link>
          <span className="hidden font-['Geist',sans-serif] text-[12px] text-black/30 sm:inline">/</span>
          <Link
            href="/jobs"
            className="hidden font-['Geist',sans-serif] text-[13px] font-medium text-[#1c1c1c] sm:inline"
          >
            Open Healthcare Jobs
          </Link>
        </div>
        <nav className="flex items-center gap-3 sm:gap-4">
          <Link
            href="/jobs"
            className="hidden font-['Geist',sans-serif] text-[13px] font-medium text-black/55 transition-colors hover:text-[#006828] sm:inline"
          >
            Browse jobs
          </Link>
          <Link
            href="/jobs/login"
            className="font-['Geist',sans-serif] text-[13px] font-medium text-black/55 transition-colors hover:text-[#006828]"
          >
            Sign in
          </Link>
          <Link
            href="/jobs/signup"
            className="inline-flex items-center gap-1.5 rounded-full bg-[#006828] px-4 py-1.5 font-['Geist',sans-serif] text-[13px] font-semibold text-white transition-colors hover:bg-[#005220]"
          >
            <Briefcase className="h-3.5 w-3.5" strokeWidth={2.25} />
            Create profile
          </Link>
        </nav>
      </div>
    </header>
  );
}
