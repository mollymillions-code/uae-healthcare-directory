"use client";

import { signOut } from "next-auth/react";

export function LogoutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/directory" })}
      className="rounded-full border border-black/[0.10] px-4 py-2 font-['Geist',sans-serif] text-sm font-medium text-black/60 transition-colors hover:border-[#006828]/30 hover:text-[#006828]"
    >
      Log out
    </button>
  );
}
