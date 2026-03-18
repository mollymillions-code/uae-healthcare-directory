"use client";

import { useState } from "react";

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("loading");
    try {
      const res = await fetch("/api/journal/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setStatus("success");
        setEmail("");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <aside className="bg-ink p-6">
      <h3 className="font-display text-lg font-semibold text-canvas mb-2">
        The Daily Briefing
      </h3>
      <p className="text-sm text-canvas/50 leading-relaxed mb-4">
        UAE healthcare news delivered to your inbox every morning. Free, concise,
        and actionable for industry professionals.
      </p>
      {status === "success" ? (
        <p className="text-sm text-gold font-medium py-2">
          Subscribed. Check your inbox.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@hospital.ae"
            required
            className="flex-1 bg-white/10 border border-white/20 px-3 py-2 text-sm text-canvas placeholder:text-canvas/30 focus:border-gold focus:outline-none transition-colors"
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="bg-gold text-white px-4 py-2 text-sm font-medium hover:bg-gold-dark transition-colors shrink-0 disabled:opacity-50"
          >
            {status === "loading" ? "..." : "Subscribe"}
          </button>
        </form>
      )}
      {status === "error" && (
        <p className="text-[10px] text-red-400 mt-2">Something went wrong. Try again.</p>
      )}
      <p className="text-[10px] text-canvas/30 mt-2">
        Join 2,400+ healthcare professionals. Unsubscribe anytime.
      </p>
    </aside>
  );
}
