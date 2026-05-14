import type { Metadata } from "next";
import { getBaseUrl } from "@/lib/helpers";

export const metadata: Metadata = {
  title: "Reset your password",
  description: "Reset your Zavis account password.",
  alternates: { canonical: `${getBaseUrl()}/forgot-password` },
  robots: { index: false, follow: false },
};

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
