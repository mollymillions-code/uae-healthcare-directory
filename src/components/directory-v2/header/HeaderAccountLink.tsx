"use client";

import Link from "next/link";
import { User } from "lucide-react";
import { useEffect, useState } from "react";

interface HeaderAccountLinkProps {
  pathname: string;
  mobile?: boolean;
  onNavigate?: () => void;
}

export function HeaderAccountLink({
  pathname,
  mobile = false,
  onNavigate,
}: HeaderAccountLinkProps) {
  const [authenticated, setAuthenticated] = useState(false);

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

  if (authenticated) {
    return (
      <Link
        href="/account"
        prefetch={false}
        onClick={onNavigate}
        className={
          mobile
            ? "flex items-center justify-center gap-2 font-sans font-medium text-ink-soft hover:text-ink py-2"
            : "inline-flex items-center gap-1.5 font-sans text-z-body-sm font-medium text-ink-soft hover:text-ink px-3 py-2 rounded-z-pill hover:bg-surface-cream transition-colors duration-z-fast whitespace-nowrap"
        }
      >
        <User className="h-4 w-4" strokeWidth={2} />
        {mobile ? "My account" : "Account"}
      </Link>
    );
  }

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
