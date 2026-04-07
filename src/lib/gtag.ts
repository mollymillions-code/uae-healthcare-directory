declare global {
  interface Window {
    gtag?: (command: string, eventName: string, params?: Record<string, unknown>) => void;
    dataLayer?: Record<string, unknown>[];
    fbq?: (...args: unknown[]) => void;
    twq?: (...args: unknown[]) => void;
    lintrk?: (action: string, params?: Record<string, unknown>) => void;
  }
}

export function gtag_report_conversion(transactionId?: string): void {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", "conversion", {
      send_to: "AW-17389420890/BYN3CLLm4JQbENqC9uNA",
      transaction_id: transactionId || crypto.randomUUID(),
    });
  }
}

export function trackEvent(eventName: string, params?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: eventName, ...params });
}

/** Generate a unique event ID for Meta pixel ↔ CAPI deduplication */
export function generateEventId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Fallback for older environments
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

/** Fire Meta Lead event + Advanced Matching (hashes email client-side) */
export async function trackMetaLead(email: string, eventId?: string): Promise<void> {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;
  // Don't re-init the pixel — it's already initialized in layout.tsx.
  // Advanced Matching email is handled server-side via CAPI (/api/capi).
  // Just fire the Lead event with eventID for deduplication against CAPI.
  window.fbq("track", "Lead", { content_name: "demo_request" }, eventId ? { eventID: eventId } : undefined);
}

/** Fire Twitter/X Lead event */
export function trackTwitterLead(): void {
  if (typeof window === "undefined" || typeof window.twq !== "function") return;
  window.twq("event", "tw-pb3r6-lead", {});
}

/** Fire LinkedIn conversion — replace CONVERSION_ID with your Campaign Manager conversion ID */
export function trackLinkedInConversion(): void {
  if (typeof window === "undefined" || typeof window.lintrk !== "function") return;
  // conversion_id 0 is invalid — LinkedIn will silently discard this.
  // Replace with your actual conversion ID from LinkedIn Campaign Manager → Conversions → Create Conversion → get the ID
  // Until then, this is a no-op to avoid sending bad data
  // window.lintrk("track", { conversion_id: YOUR_LINKEDIN_CONVERSION_ID });
}
