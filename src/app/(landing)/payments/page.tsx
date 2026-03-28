import { Metadata } from "next";
import { PaymentsPageClient } from "@/components/landing/pages/PaymentsPageClient";

export const metadata: Metadata = {
  title: "Healthcare Payment Processing",
  description:
    "Accept payments via WhatsApp, website, and front desk with Tabby, Tamara, Stripe, and PayPal integration.",
  alternates: {
    canonical: "https://www.zavis.ai/payments",
  },
};

export default function PaymentsPage() {
  return <PaymentsPageClient />;
}
