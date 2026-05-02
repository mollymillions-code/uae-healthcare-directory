"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function ProviderPortalLogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    await fetch("/api/provider-portal/logout", { method: "POST" });
    router.push("/provider-portal/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={logout}
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-full border border-black/[0.08] bg-white px-4 py-2 font-['Geist',sans-serif] text-sm font-medium text-black/55 transition-colors hover:border-[#006828]/30 hover:text-[#006828] disabled:cursor-wait disabled:opacity-60"
    >
      <LogOut className="h-4 w-4" />
      {loading ? "Signing out..." : "Sign out"}
    </button>
  );
}
