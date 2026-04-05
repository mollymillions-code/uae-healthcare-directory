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

/** Fire Meta Lead event + Advanced Matching (hashes email client-side) */
export async function trackMetaLead(email: string): Promise<void> {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;
  // Hash email for Meta Advanced Matching
  const encoder = new TextEncoder();
  const data = encoder.encode(email.trim().toLowerCase());
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
  window.fbq("init", "1045406841134462", { em: hashHex });
  window.fbq("track", "Lead");
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
