import { redirect } from "next/navigation";

// Arabic intelligence pages don't exist yet — redirect to English version
export default function ArabicIntelligencePage() {
  redirect("/intelligence");
}
