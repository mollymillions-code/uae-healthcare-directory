import type { Metadata } from "next";
import { getBaseUrl } from "@/lib/helpers";

export const metadata: Metadata = {
  title: "Create your Zavis account",
  description: "Create a Zavis account to save providers and manage healthcare preferences.",
  alternates: { canonical: `${getBaseUrl()}/signup` },
  robots: { index: false, follow: false },
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
