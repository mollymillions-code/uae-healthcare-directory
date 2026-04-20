"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";

const NAV_ITEMS = [
  { href: "/admin/providers", label: "Providers", icon: "M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16m14 0H5m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5m-4 0h4" },
  { href: "/admin/medications", label: "Medications", icon: "M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" },
  { href: "/admin/professionals", label: "Professionals", icon: "M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" },
  { href: "/admin/changelog", label: "Change Log", icon: "M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  const [keyInput, setKeyInput] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const key = searchParams.get("key");
    if (key) {
      // Validate the key by calling a lightweight admin endpoint
      fetch(`/api/admin/providers?q=__auth_check__&key=${key}`)
        .then((res) => {
          if (res.ok) {
            sessionStorage.setItem("admin_key", key);
            setAuthenticated(true);
          } else {
            setError("Invalid key");
          }
        })
        .catch(() => setError("Network error"))
        .finally(() => setChecking(false));
    } else {
      const stored = sessionStorage.getItem("admin_key");
      if (stored) {
        fetch(`/api/admin/providers?q=__auth_check__&key=${stored}`)
          .then((res) => {
            if (res.ok) {
              setAuthenticated(true);
            } else {
              sessionStorage.removeItem("admin_key");
            }
          })
          .catch(() => {
            /* ignore */
          })
          .finally(() => setChecking(false));
      } else {
        setChecking(false);
      }
    }
  }, [searchParams]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyInput.trim()) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("key", keyInput.trim());
    router.push(`${pathname}?${params.toString()}`);
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-[#f8f8f6] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-[#006828]/30 border-t-[#006828] rounded-full animate-spin" />
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#f8f8f6] flex items-center justify-center px-4">
        <form
          onSubmit={handleLogin}
          className="bg-white rounded-2xl border border-black/[0.06] p-10 max-w-sm w-full text-center shadow-sm"
        >
          <div className="w-12 h-12 bg-[#006828] rounded-xl flex items-center justify-center mx-auto mb-5">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h1 className="font-['Bricolage_Grotesque',sans-serif] text-xl font-semibold text-[#1c1c1c] mb-2">
            Admin Dashboard
          </h1>
          <p className="font-['Geist',sans-serif] text-sm text-black/40 mb-6">
            Enter the dashboard key to continue
          </p>
          {error && (
            <div className="bg-red-50 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">
              {error}
            </div>
          )}
          <input
            type="password"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            placeholder="Dashboard Key"
            className="w-full border border-black/[0.06] rounded-lg px-3 py-2 text-sm font-['Geist',sans-serif] mb-4 focus:outline-none focus:ring-2 focus:ring-[#006828]/30"
          />
          <button
            type="submit"
            className="w-full bg-[#006828] text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#005520] transition-colors"
          >
            Log In
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f8f6] flex">
      {/* Sidebar */}
      <aside className="w-60 bg-white border-r border-black/[0.06] flex flex-col sticky top-0 h-screen shrink-0">
        <div className="px-5 py-5 border-b border-black/[0.06]">
          <Link href="/admin/providers" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#006828] rounded-lg flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
            </div>
            <span className="font-['Bricolage_Grotesque',sans-serif] text-base font-semibold text-[#1c1c1c]">
              Admin
            </span>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-['Geist',sans-serif] transition-colors ${
                  isActive
                    ? "bg-[#006828]/10 text-[#006828] font-medium"
                    : "text-black/60 hover:bg-black/[0.03] hover:text-[#1c1c1c]"
                }`}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d={item.icon} />
                </svg>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-black/[0.06]">
          <button
            onClick={() => {
              sessionStorage.removeItem("admin_key");
              setAuthenticated(false);
            }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-['Geist',sans-serif] text-black/40 hover:text-red-600 hover:bg-red-50 transition-colors w-full"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Log Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0">
        {children}
      </main>
    </div>
  );
}
