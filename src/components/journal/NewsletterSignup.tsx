"use client";

export function NewsletterSignup() {
  return (
    <aside className="bg-ink p-6">
      <h3 className="font-display text-lg font-semibold text-canvas mb-2">
        The Daily Briefing
      </h3>
      <p className="text-sm text-canvas/50 leading-relaxed mb-4">
        UAE healthcare news delivered to your inbox every morning. Free, concise,
        and actionable for industry professionals.
      </p>
      <form
        onSubmit={(e) => e.preventDefault()}
        className="flex gap-2"
      >
        <input
          type="email"
          placeholder="you@hospital.ae"
          className="flex-1 bg-white/10 border border-white/20 px-3 py-2 text-sm text-canvas placeholder:text-canvas/30 focus:border-gold focus:outline-none transition-colors"
        />
        <button
          type="submit"
          className="bg-gold text-white px-4 py-2 text-sm font-medium hover:bg-gold-dark transition-colors shrink-0"
        >
          Subscribe
        </button>
      </form>
      <p className="text-[10px] text-canvas/30 mt-2">
        Join 2,400+ healthcare professionals. Unsubscribe anytime.
      </p>
    </aside>
  );
}
