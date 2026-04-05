declare global {
  interface Window {
    gtag?: (command: string, eventName: string, params?: Record<string, unknown>) => void;
    dataLayer?: Record<string, unknown>[];
    fbq?: (...args: unknown[]) => void;
    twq?: (...args: unknown[]) => void;
    lintrk?: (action: string, params?: Record<string, unknown>) => void;
  }
}

export function gtag_report_conversion(): void {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", "conversion", {
      send_to: "AW-17389420890/BYN3CLLm4JQbENqC9uNA",
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
  // Hash email for Meta Advanced Matching
  const encoder = new TextEncoder();
  const data = encoder.encode(email.trim().toLowerCase());
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
  window.fbq("init", "1045406841134462", { em: hashHex });
  // Pass eventID so Meta can deduplicate this client event against the CAPI server event
  window.fbq("track", "Lead", {}, eventId ? { eventID: eventId } : undefined);
}

/** Fire Twitter/X Lead event */
export function trackTwitterLead(): void {
  if (typeof window === "undefined" || typeof window.twq !== "function") return;
  window.twq("event", "tw-pb3r6-lead", {});
}

/** Fire LinkedIn conversion — replace CONVERSION_ID with your Campaign Manager conversion ID */
export function trackLinkedInConversion(): void {
  if (typeof window === "undefined" || typeof window.lintrk !== "function") return;
  window.lintrk("track", { conversion_id: 0 }); // TODO: replace 0 with your LinkedIn conversion ID
}
