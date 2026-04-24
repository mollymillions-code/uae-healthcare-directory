import {
  GccFilterPage,
  generateGccFilterMetadata,
  generateGccFilterStaticParams,
} from "@/components/directory/GccFilterPage";

export const revalidate = 43200;

export async function generateStaticParams() {
  if (process.env.PREBUILD_STATIC_ROUTES !== "1") return [];
  return generateGccFilterStaticParams("sa", "emergency");
}

export function generateMetadata({ params }: { params: { city: string } }) {
  return generateGccFilterMetadata({ countryCode: "sa", citySlug: params.city, filter: "emergency" });
}

export default async function Page({ params }: { params: { city: string } }) {
  return <GccFilterPage countryCode="sa" citySlug={params.city} filter="emergency" />;
}
