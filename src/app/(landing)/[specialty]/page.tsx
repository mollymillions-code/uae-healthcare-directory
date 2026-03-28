import { Metadata } from "next";
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

export const dynamicParams = false;

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
  const title = data
    ? `${data.name} Patient Engagement Platform`
    : "Specialty Not Found";
  const description = data?.heroDescription ?? "";

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
  return <SpecialtyPageClient specialty={specialty} />;
}
