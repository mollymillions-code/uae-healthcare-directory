"use client";

import { useEffect } from "react";
import { SessionProvider } from "next-auth/react";
import { useSession } from "next-auth/react";
import { syncLocalSavedProviders } from "@/lib/consumer-intent-client";

function AnonymousIntentSync() {
  const { status } = useSession();

  useEffect(() => {
    if (status !== "authenticated") return;
    syncLocalSavedProviders().catch(() => undefined);
  }, [status]);

  return null;
}

export function NextAuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AnonymousIntentSync />
      {children}
    </SessionProvider>
  );
}
