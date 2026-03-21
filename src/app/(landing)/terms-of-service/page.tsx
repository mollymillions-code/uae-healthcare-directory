import { Metadata } from "next";
import { TermsOfServicePageClient } from "@/components/landing/pages/TermsOfServicePageClient";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Zavis terms of service for using our AI-powered healthcare patient engagement platform.",
};

export default function TermsOfServicePage() {
  return <TermsOfServicePageClient />;
}
