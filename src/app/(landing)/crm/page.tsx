import { Metadata } from "next";
import { CRMPageClient } from "@/components/landing/pages/CRMPageClient";

export const metadata: Metadata = {
  title: "Healthcare CRM & Patient Management",
  description:
    "Unified patient profiles with full conversation history, booking records, and revenue analytics. Built for healthcare operations teams.",
};

export default function CRMPage() {
  return <CRMPageClient />;
}
