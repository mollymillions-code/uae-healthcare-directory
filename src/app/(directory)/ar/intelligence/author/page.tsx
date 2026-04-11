import { redirect } from "next/navigation";

// Arabic intelligence pages don't have full mirrors yet — redirect to English masthead
export default function ArabicMastheadPage() {
  redirect("/intelligence/author");
}
