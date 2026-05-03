import type { Metadata } from "next";
import { getBaseUrl } from "@/lib/helpers";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your Zavis candidate profile.",
  alternates: { canonical: `${getBaseUrl()}/jobs/login` },
  // Transactional auth pages are deliberately not indexed.
  robots: { index: false, follow: false },
};

export default function CandidateLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
