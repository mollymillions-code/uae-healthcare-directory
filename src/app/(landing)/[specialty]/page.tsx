import { Metadata } from "next";
import { notFound } from "next/navigation";
import { SpecialtyPageClient } from "@/components/landing/pages/SpecialtyPageClient";
import { specialties } from "@/data/landing/specialties";

const SPECIALTY_SLUGS = [
  "dermatology",
  "optometry",
  "orthopedics",
  "ent",
  "urgent-care",
  "mental-health",
  "veterinary",
  "homecare",
  "aesthetic",
  "longevity-wellness",
] as const;

// Let unknown one-segment URLs fall through the page's explicit notFound()
// instead of Next's static fallback path. The static path logs NoFallbackError
// under crawler noise, which makes production health look worse than it is.
export const dynamicParams = true;

export function generateStaticParams() {
  return SPECIALTY_SLUGS.map((slug) => ({ specialty: slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ specialty: string }>;
}): Promise<Metadata> {
  const { specialty } = await params;
  const data = specialties[specialty];

  if (!data) notFound();

  const title = `${data.name} Patient Engagement Platform`;
  const description = data.heroDescription;

  return {
    title,
    description,
    alternates: {
      canonical: `https://www.zavis.ai/${specialty}`,
    },
  };
}

export default async function SpecialtyPage({
  params,
}: {
  params: Promise<{ specialty: string }>;
}) {
  const { specialty } = await params;
  if (!specialties[specialty]) notFound();
  return <SpecialtyPageClient specialty={specialty} />;
}
