"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

function getFragmentToken(): string {
  if (typeof window === "undefined") return "";
  const hash = window.location.hash.replace(/^#/, "");
  return new URLSearchParams(hash).get("token") || "";
}

export function ProviderPortalEmbedBootstrap({ token }: { token: string }) {
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    const effectiveToken = token || getFragmentToken();
    if (!effectiveToken) {
      setError("Missing embed token.");
      window.parent?.postMessage(
        { type: "zavis_provider_portal_auth_failed", reason: "missing_token" },
        "*"
      );
      return;
    }

    window.parent?.postMessage({ type: "zavis_provider_portal_loading" }, "*");

    fetch("/api/provider-portal/embed-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: effectiveToken }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Could not start embedded session.");
        }
        window.parent?.postMessage({ type: "zavis_provider_portal_loaded" }, "*");
        router.replace("/provider-portal?embed=1");
        router.refresh();
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Could not start embedded session.");
        window.parent?.postMessage({ type: "zavis_provider_portal_auth_failed" }, "*");
      });
  }, [router, token]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8f8f6] px-4">
      <div className="w-full max-w-sm rounded-2xl border border-black/[0.06] bg-white p-6 text-center shadow-sm">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-[#006828]/20 border-t-[#006828]" />
        <h1 className="font-['Bricolage_Grotesque',sans-serif] text-xl font-medium text-[#1c1c1c]">
          Opening listing manager
        </h1>
        <p className="mt-2 font-['Geist',sans-serif] text-sm text-black/45">
          {error || "Securely connecting your Zavis workspace."}
        </p>
      </div>
    </div>
  );
}
