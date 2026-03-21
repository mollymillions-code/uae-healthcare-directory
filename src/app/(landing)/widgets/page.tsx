import type { Metadata } from "next";
import { WidgetsPageClient } from "@/components/landing/pages/WidgetsPageClient";

export const metadata: Metadata = {
  title: "Website Chat Widgets for Healthcare",
  description:
    "Embed AI-powered chat widgets on your clinic website to capture leads 24/7, book appointments, and route to specialists.",
};

export default function WidgetsPage() {
  return <WidgetsPageClient />;
}
