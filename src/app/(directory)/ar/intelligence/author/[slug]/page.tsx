import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Arabic intelligence pages don't have full mirrors yet — redirect to the
// English author profile. The English page emits hreflang back to the same
// /ar URL so search engines see the round-trip.
export default async function ArabicAuthorProfilePage(props: PageProps) {
  const params = await props.params;
  redirect(`/intelligence/author/${params.slug}`);
}
