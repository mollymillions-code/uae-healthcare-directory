import type { Metadata } from "next";
import { getBaseUrl } from "@/lib/helpers";

export const metadata: Metadata = {
  title: "Create your candidate profile",
  description: "Build a structured Zavis healthcare-professional profile in 3 minutes — discipline, city, licence, salary, CV.",
  alternates: { canonical: `${getBaseUrl()}/jobs/signup` },
  // Transactional auth pages are deliberately not indexed.
  robots: { index: false, follow: false },
};

export default function CandidateSignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
