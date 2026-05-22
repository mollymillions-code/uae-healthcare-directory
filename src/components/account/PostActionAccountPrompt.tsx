"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X, Heart } from "lucide-react";
import {
  POST_ACTION_EVENT,
  type PostActionEventDetail,
} from "@/lib/consumer-intent-client";

const SNOOZE_KEY = "zavis_account_prompt_last_seen";
const SNOOZE_24H_MS = 24 * 60 * 60 * 1000;
const SNOOZE_7D_MS = 7 * 24 * 60 * 60 * 1000;
const PROMPT_DELAY_MS = 1500;

const QUALIFYING_ACTIONS = new Set([
  "provider_call_click",
  "provider_whatsapp_click",
  "provider_directions_click",
  "provider_website_click",
  "provider_save_click",
]);

/**
 * Global, single-mount account-acquisition prompt.
 *
 * Listens for `zavis:post-action` window CustomEvent. When a qualifying action
 * fires (call/whatsapp/directions/website/save) and the user is unauthenticated
 * and outside the snooze window, schedules a warm "create account" modal after
 * the primary action has had time to start (`PROMPT_DELAY_MS`).
 *
 * Throttling:
 *   - 24h snooze on dismiss (X / "Continue")
 *   - 7d snooze on "Maybe later"
 *   - Persisted in localStorage under SNOOZE_KEY
 *
 * Authenticated users never see it. The prompt does NOT block the original
 * action — the click goes through, `tel:`/`https:` opens, and only then the
 * modal appears.
 *
 * Mount once near the root. It checks session state lazily so public pages do
 * not load NextAuth during the first paint.
 */
export function PostActionAccountPrompt() {
  const [authenticated, setAuthenticated] = useState(false);
  const [open, setOpen] = useState(false);
  const [redirectPath, setRedirectPath] = useState("/account");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/session", { credentials: "same-origin" })
      .then((res) => (res.ok ? res.json() : null))
      .then((session) => {
        if (!cancelled) setAuthenticated(Boolean(session?.user));
      })
      .catch(() => {
        if (!cancelled) setAuthenticated(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    function handlePostAction(event: Event) {
      const detail = (event as CustomEvent<PostActionEventDetail>).detail;
      if (!detail || !QUALIFYING_ACTIONS.has(detail.action)) return;
      if (authenticated) return;

      const lastSeen = Number(window.localStorage.getItem(SNOOZE_KEY) || 0);
      if (Date.now() - lastSeen < SNOOZE_24H_MS) return;

      // Capture redirect for /signup so post-signup the user lands on the same page.
      setRedirectPath(`${window.location.pathname}${window.location.search}`);

      // Mark prompt-shown timestamp now (prevents duplicate prompts firing in
      // the delay window from rapid second clicks). Snooze is bumped on dismiss.
      window.localStorage.setItem(SNOOZE_KEY, String(Date.now()));

      window.setTimeout(() => setOpen(true), PROMPT_DELAY_MS);
    }

    window.addEventListener(POST_ACTION_EVENT, handlePostAction);
    return () => window.removeEventListener(POST_ACTION_EVENT, handlePostAction);
  }, [authenticated]);

  function dismiss(snoozeMs: number) {
    if (typeof window !== "undefined") {
      // Bump snooze deadline forward by the chosen amount.
      window.localStorage.setItem(SNOOZE_KEY, String(Date.now() + snoozeMs - SNOOZE_24H_MS));
    }
    setOpen(false);
  }

  if (!open || authenticated) return null;

  const encodedRedirect = encodeURIComponent(redirectPath);

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center bg-black/30 px-4 pb-4 sm:pb-0"
      role="dialog"
      aria-modal="true"
      aria-labelledby="zavis-post-action-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-[#006828]" fill="#006828" strokeWidth={0} aria-hidden />
            <h2
              id="zavis-post-action-title"
              className="font-['Bricolage_Grotesque',sans-serif] text-2xl font-semibold tracking-tight text-[#1c1c1c]"
            >
              Enjoying Zavis?
            </h2>
          </div>
          <button
            type="button"
            onClick={() => dismiss(SNOOZE_24H_MS)}
            className="rounded-full p-2 text-black/40 transition-colors hover:bg-black/[0.04] hover:text-black"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-3 font-['Geist',sans-serif] text-sm leading-relaxed text-black/65">
          We&apos;re glad it&apos;s helping. Create a free account to save the clinics
          you find, keep your insurance preferences handy, and pick up your search
          across phone, laptop, and future visits.
        </p>
        <p className="mt-2 font-['Geist',sans-serif] text-xs leading-relaxed text-black/45">
          No spam. No ads. Just better healthcare info — with love, Team Zavis. 💚
        </p>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Link
            href={`/signup?redirect=${encodedRedirect}`}
            onClick={() => setOpen(false)}
            className="inline-flex flex-1 items-center justify-center rounded-full bg-[#006828] px-4 py-3 font-['Geist',sans-serif] text-sm font-semibold text-white transition-colors hover:bg-[#004d1c]"
          >
            Create free account
          </Link>
          <Link
            href={`/login?redirect=${encodedRedirect}`}
            onClick={() => setOpen(false)}
            className="inline-flex flex-1 items-center justify-center rounded-full border border-black/[0.10] px-4 py-3 font-['Geist',sans-serif] text-sm font-semibold text-[#1c1c1c] transition-colors hover:border-[#006828]/30 hover:text-[#006828]"
          >
            I already have one
          </Link>
        </div>
        <button
          type="button"
          onClick={() => dismiss(SNOOZE_7D_MS)}
          className="mt-3 w-full font-['Geist',sans-serif] text-sm text-black/45 transition-colors hover:text-black/70"
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}
