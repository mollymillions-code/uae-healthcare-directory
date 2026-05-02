"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function UnsaveProviderButton({ providerId }: { providerId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    await fetch(`/api/account/saved-providers?providerId=${encodeURIComponent(providerId)}`, {
      method: "DELETE",
    });
    router.refresh();
    setLoading(false);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="rounded-full border border-black/[0.10] px-3 py-1.5 font-['Geist',sans-serif] text-xs font-medium text-black/45 transition-colors hover:border-red-200 hover:text-red-600 disabled:cursor-wait disabled:opacity-70"
    >
      {loading ? "Removing..." : "Remove"}
    </button>
  );
}
