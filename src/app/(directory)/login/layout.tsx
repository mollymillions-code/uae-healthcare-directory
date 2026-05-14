import type { Metadata } from "next";
import { getBaseUrl } from "@/lib/helpers";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your Zavis account.",
  alternates: { canonical: `${getBaseUrl()}/login` },
  robots: { index: false, follow: false },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
