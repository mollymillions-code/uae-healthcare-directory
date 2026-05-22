import type { ReactNode } from "react";

export function getLenis(): null {
  return null;
}

export default function LenisProvider({ children }: { children: ReactNode }) {
  return (
    <main className="flex-1">
      {children}
    </main>
  );
}
