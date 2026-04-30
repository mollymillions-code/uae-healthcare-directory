"use client";

import Link from "next/link";
import { X } from "lucide-react";

interface ConsumerAccountPromptProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  redirectPath?: string;
}

export function ConsumerAccountPrompt({
  open,
  onClose,
  title = "Keep this search going",
  message = "Create a free Zavis account to save clinics, keep useful calls in one place, and continue across devices.",
  redirectPath,
}: ConsumerAccountPromptProps) {
  if (!open) return null;

  const redirect =
    redirectPath || (typeof window !== "undefined" ? `${window.location.pathname}${window.location.search}` : "/account");
  const encodedRedirect = encodeURIComponent(redirect);

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/35 px-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-['Bricolage_Grotesque',sans-serif] text-2xl font-medium tracking-tight text-[#1c1c1c]">
              {title}
            </h2>
            <p className="mt-2 font-['Geist',sans-serif] text-sm leading-relaxed text-black/55">
              {message}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-black/40 transition-colors hover:bg-black/[0.04] hover:text-black"
            aria-label="Close account prompt"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Link
            href={`/signup?redirect=${encodedRedirect}`}
            className="inline-flex flex-1 items-center justify-center rounded-full bg-[#006828] px-4 py-3 font-['Geist',sans-serif] text-sm font-semibold text-white transition-colors hover:bg-[#004d1c]"
          >
            Create account
          </Link>
          <Link
            href={`/login?redirect=${encodedRedirect}`}
            className="inline-flex flex-1 items-center justify-center rounded-full border border-black/[0.10] px-4 py-3 font-['Geist',sans-serif] text-sm font-semibold text-[#1c1c1c] transition-colors hover:border-[#006828]/30 hover:text-[#006828]"
          >
            Log in
          </Link>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-3 w-full font-['Geist',sans-serif] text-sm text-black/40 transition-colors hover:text-black/70"
        >
          Continue without account
        </button>
      </div>
    </div>
  );
}
