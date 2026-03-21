import { Metadata } from "next";
import { CaptainPageClient } from "@/components/landing/pages/CaptainPageClient";

export const metadata: Metadata = {
  title: "Captain AI Operations Co-Pilot",
  description:
    "AI-powered operations assistant that provides daily briefings, flags urgent issues, and recommends actions for healthcare managers.",
};

export default function CaptainPage() {
  return <CaptainPageClient />;
}
