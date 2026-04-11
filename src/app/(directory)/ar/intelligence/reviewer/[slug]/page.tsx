import { redirect } from "next/navigation";

interface PageProps {
  params: { slug: string };
}

// Arabic intelligence pages don't have full mirrors yet — redirect to the
// English reviewer profile. Hreflang round-trips on the English page.
export default function ArabicReviewerProfilePage({ params }: PageProps) {
  redirect(`/intelligence/reviewer/${params.slug}`);
}
