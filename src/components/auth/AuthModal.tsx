"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { X, ArrowRight } from "lucide-react";

type Mode = "login" | "signup";

/**
 * Global auth modal. Mounted once in the directory layout, controlled
 * by the `auth` search param (`?auth=login` or `?auth=signup`).
 * Optional `?redirect=<path>` survives the auth flow and is forwarded
 * to NextAuth so the user lands where they meant to.
 *
 * Closing the modal removes the `auth` param and stays on the current
 * page — no navigation, no scroll loss.
 *
 * The `/login` and `/signup` full-page routes are kept as direct-link
 * fallbacks (refresh, share, deep link).
 */
export function AuthModal() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const auth = searchParams.get("auth");
  const open = auth === "login" || auth === "signup";
  const mode: Mode = auth === "signup" ? "signup" : "login";
  const redirect = searchParams.get("redirect") || pathname || "/account";

  const close = useCallback(() => {
    const next = new URLSearchParams(searchParams.toString());
    next.delete("auth");
    next.delete("redirect");
    const queryString = next.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
      scroll: false,
    });
  }, [pathname, router, searchParams]);

  const switchMode = useCallback(
    (next: Mode) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("auth", next);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  // Lock body scroll while modal is open.
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, close]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/45 px-4 pb-4 backdrop-blur-sm sm:items-center sm:pb-0"
      role="dialog"
      aria-modal="true"
      aria-labelledby="zavis-auth-modal-title"
      onMouseDown={(event) => {
        // Close when clicking the backdrop (but not when clicking the modal body).
        if (event.target === event.currentTarget) close();
      }}
    >
      <div className="relative w-full max-w-[460px] overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Top bar with close */}
        <div className="flex items-center justify-between border-b border-black/[0.06] px-5 py-4">
          <span className="font-['Bricolage_Grotesque',sans-serif] text-base font-semibold tracking-tight text-[#1c1c1c]">
            {mode === "login" ? "Sign in or sign up" : "Create your account"}
          </span>
          <button
            type="button"
            onClick={close}
            className="rounded-full p-1.5 text-black/40 transition-colors hover:bg-black/[0.05] hover:text-black"
            aria-label="Close"
          >
            <X className="h-4 w-4" strokeWidth={2.25} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 pt-6 pb-6 sm:px-7 sm:pt-7">
          {mode === "login" ? (
            <LoginInner
              redirect={redirect}
              onSwitch={() => switchMode("signup")}
            />
          ) : (
            <SignupInner
              redirect={redirect}
              onSwitch={() => switchMode("login")}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Login inner ──────────────────────────────────────────────────────────

function LoginInner({ redirect, onSwitch }: { redirect: string; onSwitch: () => void }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.ok) {
      router.push(redirect);
      router.refresh();
    } else {
      setError("Invalid email or password.");
      setLoading(false);
    }
  }

  return (
    <>
      <h2
        id="zavis-auth-modal-title"
        className="font-['Bricolage_Grotesque',sans-serif] text-2xl font-medium tracking-tight text-[#1c1c1c]"
      >
        Welcome back.
      </h2>
      <p className="mt-1.5 font-['Geist',sans-serif] text-sm text-black/50">
        Sign in to pick up your saved clinics and continue your search.
      </p>

      <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          required
          placeholder="Email"
          className="w-full rounded-xl border border-black/[0.08] bg-white px-4 py-3 font-['Geist',sans-serif] text-[15px] text-[#1c1c1c] placeholder:text-black/30 outline-none transition-all focus:border-[#006828] focus:ring-2 focus:ring-[#006828]/15"
        />
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          required
          placeholder="Password"
          className="w-full rounded-xl border border-black/[0.08] bg-white px-4 py-3 font-['Geist',sans-serif] text-[15px] text-[#1c1c1c] placeholder:text-black/30 outline-none transition-all focus:border-[#006828] focus:ring-2 focus:ring-[#006828]/15"
        />

        {error && (
          <p
            role="alert"
            className="rounded-lg bg-red-50 px-3 py-2 font-['Geist',sans-serif] text-sm text-red-700"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#006828] px-5 py-3 font-['Geist',sans-serif] text-[15px] font-semibold text-white transition-colors hover:bg-[#005220] disabled:cursor-wait disabled:opacity-70"
        >
          <span>{loading ? "Signing in…" : "Continue"}</span>
          {!loading && (
            <ArrowRight
              className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
              strokeWidth={2.25}
            />
          )}
        </button>
      </form>

      <div className="mt-4 flex items-center justify-between font-['Geist',sans-serif] text-sm">
        <a
          href={`/forgot-password?redirect=${encodeURIComponent(redirect)}`}
          className="text-black/55 hover:text-[#006828]"
        >
          Forgot password?
        </a>
        <button
          type="button"
          onClick={onSwitch}
          className="font-medium text-[#006828] hover:underline"
        >
          Create account
        </button>
      </div>

      <p className="mt-5 border-t border-black/[0.06] pt-4 font-['Geist',sans-serif] text-[12px] leading-relaxed text-black/40">
        Are you a clinic? Manage your listing through the Zavis platform — provider sign-in is not on this directory.
      </p>
    </>
  );
}

// ─── Signup inner ─────────────────────────────────────────────────────────

function SignupInner({ redirect, onSwitch }: { redirect: string; onSwitch: () => void }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, marketingOptIn }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Could not create account.");
      setLoading(false);
      return;
    }

    const result = await signIn("credentials", { email, password, redirect: false });

    if (result?.ok) {
      router.push(redirect);
      router.refresh();
    } else {
      onSwitch();
    }
    setLoading(false);
  }

  return (
    <>
      <h2
        id="zavis-auth-modal-title"
        className="font-['Bricolage_Grotesque',sans-serif] text-2xl font-medium tracking-tight text-[#1c1c1c]"
      >
        Create your account.
      </h2>
      <p className="mt-1.5 font-['Geist',sans-serif] text-sm text-black/50">
        Save clinics, set your insurance once, and pick up your search across devices.
      </p>

      <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          autoComplete="name"
          placeholder="Name"
          className="w-full rounded-xl border border-black/[0.08] bg-white px-4 py-3 font-['Geist',sans-serif] text-[15px] text-[#1c1c1c] placeholder:text-black/30 outline-none transition-all focus:border-[#006828] focus:ring-2 focus:ring-[#006828]/15"
        />
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          required
          placeholder="Email"
          className="w-full rounded-xl border border-black/[0.08] bg-white px-4 py-3 font-['Geist',sans-serif] text-[15px] text-[#1c1c1c] placeholder:text-black/30 outline-none transition-all focus:border-[#006828] focus:ring-2 focus:ring-[#006828]/15"
        />
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="new-password"
          minLength={8}
          required
          placeholder="Password (8+ characters)"
          className="w-full rounded-xl border border-black/[0.08] bg-white px-4 py-3 font-['Geist',sans-serif] text-[15px] text-[#1c1c1c] placeholder:text-black/30 outline-none transition-all focus:border-[#006828] focus:ring-2 focus:ring-[#006828]/15"
        />

        <label className="flex items-start gap-2.5">
          <input
            type="checkbox"
            checked={marketingOptIn}
            onChange={(event) => setMarketingOptIn(event.target.checked)}
            className="mt-1 h-4 w-4 rounded border-black/20 accent-[#006828]"
          />
          <span className="font-['Geist',sans-serif] text-[12.5px] leading-relaxed text-black/55">
            Email me occasional Zavis updates. No spam.
          </span>
        </label>

        {error && (
          <p
            role="alert"
            className="rounded-lg bg-red-50 px-3 py-2 font-['Geist',sans-serif] text-sm text-red-700"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#006828] px-5 py-3 font-['Geist',sans-serif] text-[15px] font-semibold text-white transition-colors hover:bg-[#005220] disabled:cursor-wait disabled:opacity-70"
        >
          <span>{loading ? "Creating account…" : "Create free account"}</span>
          {!loading && (
            <ArrowRight
              className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
              strokeWidth={2.25}
            />
          )}
        </button>
      </form>

      <p className="mt-4 font-['Geist',sans-serif] text-sm text-black/55">
        Already have an account?{" "}
        <button
          type="button"
          onClick={onSwitch}
          className="font-medium text-[#006828] hover:underline"
        >
          Sign in
        </button>
      </p>

      <p className="mt-4 border-t border-black/[0.06] pt-4 font-['Geist',sans-serif] text-[11px] leading-relaxed text-black/40">
        By creating an account you agree to the{" "}
        <a href="/terms" className="text-black/55 underline decoration-black/15 underline-offset-2 hover:text-black/70">terms</a>
        {" "}and{" "}
        <a href="/privacy" className="text-black/55 underline decoration-black/15 underline-offset-2 hover:text-black/70">privacy policy</a>.
      </p>
    </>
  );
}
