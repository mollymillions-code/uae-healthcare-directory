"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

interface DeferredHeaderAccountLinkProps {
  pathname: string;
  mobile?: boolean;
  onNavigate?: () => void;
}

const HeaderAccountLink = dynamic(
  () => import("./HeaderAccountLink").then((mod) => mod.HeaderAccountLink),
  { ssr: false, loading: () => null }
);

function SignInFallback({
  pathname,
  mobile = false,
  onNavigate,
}: DeferredHeaderAccountLinkProps) {
  return (
    <Link
      href={`${pathname}?auth=login`}
      prefetch={false}
      scroll={false}
      replace
      onClick={onNavigate}
      className={
        mobile
          ? "block text-center font-sans font-medium text-ink-soft hover:text-ink py-2"
          : "font-sans text-z-body-sm font-medium text-ink-soft hover:text-ink px-3 py-2 rounded-z-pill hover:bg-surface-cream transition-colors duration-z-fast whitespace-nowrap"
      }
    >
      Sign in
    </Link>
  );
}

export function DeferredHeaderAccountLink(props: DeferredHeaderAccountLinkProps) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    let done = false;
    const enable = () => {
      if (done) return;
      done = true;
      setEnabled(true);
    };
    const timer = window.setTimeout(enable, 3500);
    const events: Array<keyof WindowEventMap> = ["pointerdown", "keydown", "scroll"];
    events.forEach((eventName) =>
      window.addEventListener(eventName, enable, { passive: true, once: true })
    );

    return () => {
      window.clearTimeout(timer);
      events.forEach((eventName) => window.removeEventListener(eventName, enable));
    };
  }, []);

  if (!enabled) {
    return <SignInFallback {...props} />;
  }

  return <HeaderAccountLink {...props} />;
}
