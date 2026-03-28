import type { Metadata } from "next";
import { VoicePageClient } from "@/components/landing/pages/VoicePageClient";

export const metadata: Metadata = {
  title: "Healthcare Voice & Call Center Platform",
  description:
    "Cloud-based voice platform for healthcare with live call transcription, AI-powered call scoring, and seamless integration with Twilio and Avaya.",
  alternates: {
    canonical: "https://www.zavis.ai/voice",
  },
};

export default function VoicePage() {
  return <VoicePageClient />;
}
