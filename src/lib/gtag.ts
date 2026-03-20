declare global {
  interface Window {
    gtag?: (
      command: string,
      eventName: string,
      params?: Record<string, unknown>
    ) => void;
  }
}

export function gtag_report_conversion(): boolean {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", "conversion", {
      send_to: "AW-17389420890/BYN3CLLm4JQbENqC9uNA",
      // event_callback: callback,
    });
  } else {
    console.log("failed");
  }

  return false;
}
