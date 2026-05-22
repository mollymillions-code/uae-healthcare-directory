"use client";

import { useEffect } from "react";

type TrackingWindow = Window & {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
  fbq?: ((...args: unknown[]) => void) & {
    queue?: unknown[];
    callMethod?: (...args: unknown[]) => void;
    loaded?: boolean;
    version?: string;
    push?: (...args: unknown[]) => void;
  };
  _fbq?: TrackingWindow["fbq"];
  lintrk?: ((...args: unknown[]) => void) & { q?: unknown[] };
  _linkedin_data_partner_ids?: string[];
  _linkedin_partner_id?: string;
  clarity?: ((...args: unknown[]) => void) & { q?: unknown[] };
  reb2b?: { loaded?: boolean };
};

function appendScript(src: string): void {
  if (document.querySelector(`script[src="${src}"]`)) return;
  const script = document.createElement("script");
  script.async = true;
  script.src = src;
  document.head.appendChild(script);
}

function installMetaPixel(win: TrackingWindow): void {
  if (win.fbq?.loaded) return;

  const previousQueue = win.fbq?.queue ?? [];
  const fbq = function (...args: unknown[]) {
    if (fbq.callMethod) {
      fbq.callMethod(...args);
    } else {
      fbq.queue?.push(args);
    }
  } as NonNullable<TrackingWindow["fbq"]>;

  fbq.queue = previousQueue;
  fbq.loaded = true;
  fbq.version = "2.0";
  fbq.push = fbq;
  win.fbq = fbq;
  win._fbq = fbq;

  appendScript("https://connect.facebook.net/en_US/fbevents.js");
  fbq("init", "1045406841134462");
  fbq("track", "PageView");
}

function installLinkedIn(win: TrackingWindow): void {
  win._linkedin_partner_id = "8657833";
  win._linkedin_data_partner_ids = win._linkedin_data_partner_ids || [];
  if (!win._linkedin_data_partner_ids.includes(win._linkedin_partner_id)) {
    win._linkedin_data_partner_ids.push(win._linkedin_partner_id);
  }

  if (!win.lintrk) {
    const lintrk = function (...args: unknown[]) {
      lintrk.q?.push(args);
    } as NonNullable<TrackingWindow["lintrk"]>;
    lintrk.q = [];
    win.lintrk = lintrk;
  }

  appendScript("https://snap.licdn.com/li.lms-analytics/insight.min.js");
}

function installMarketingTags(): void {
  const win = window as TrackingWindow;

  win.dataLayer = win.dataLayer || [];
  win.dataLayer.push({
    "gtm.start": new Date().getTime(),
    event: "gtm.js",
  });
  appendScript("https://www.googletagmanager.com/gtm.js?id=GTM-T9N3FDMQ");

  win.clarity =
    win.clarity ||
    function (...args: unknown[]) {
      win.clarity!.q?.push(args);
    };
  win.clarity.q = win.clarity.q || [];
  appendScript("https://www.clarity.ms/tag/swpafowqk4");

  installLinkedIn(win);
  installMetaPixel(win);

  if (!win.reb2b?.loaded) {
    win.reb2b = { loaded: true };
    appendScript("https://ddwl4m2hdecbv.cloudfront.net/b/GOYPYHQZ9POX/GOYPYHQZ9POX.js.gz");
  }
}

export function DeferredMarketingTags() {
  useEffect(() => {
    let loaded = false;

    function load() {
      if (loaded) return;
      loaded = true;
      cleanup();
      installMarketingTags();
    }

    const timer = window.setTimeout(load, 8000);

    function cleanup() {
      window.removeEventListener("pointerdown", load);
      window.removeEventListener("keydown", load);
      window.removeEventListener("touchstart", load);
      window.removeEventListener("scroll", load);
      window.clearTimeout(timer);
    }

    window.addEventListener("pointerdown", load, { passive: true, once: true });
    window.addEventListener("keydown", load, { passive: true, once: true });
    window.addEventListener("touchstart", load, { passive: true, once: true });
    window.addEventListener("scroll", load, { passive: true, once: true });

    return cleanup;
  }, []);

  return null;
}
