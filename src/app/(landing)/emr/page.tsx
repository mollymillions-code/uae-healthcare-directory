import type { Metadata } from "next";
import { EMRPageClient } from "@/components/landing/pages/EMRPageClient";

export const metadata: Metadata = {
  title: "EMR Integration Platform",
  description:
    "Bidirectional EMR sync for appointments, patient records, and billing. Connect with Practo, Medas, Unite, and more.",
  alternates: {
    canonical: "https://www.zavis.ai/emr",
  },
};

export default function EMRPage() {
  return <EMRPageClient />;
}
