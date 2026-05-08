import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Arabic intelligence pages don't have full mirrors yet — redirect to the
// English reviewer profile. Hreflang round-trips on the English page.
export default async function ArabicReviewerProfilePage(props: PageProps) {
  const params = await props.params;
  redirect(`/intelligence/reviewer/${params.slug}`);
}
