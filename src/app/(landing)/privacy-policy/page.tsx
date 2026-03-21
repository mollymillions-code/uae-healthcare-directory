import { Metadata } from "next";
import { PrivacyPolicyPageClient } from "@/components/landing/pages/PrivacyPolicyPageClient";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Zavis privacy policy — how we collect, use, and protect your data. HIPAA compliant and SOC 2 certified.",
};

export default function PrivacyPolicyPage() {
  return <PrivacyPolicyPageClient />;
}
