import {
  GccFilterPage,
  generateGccFilterMetadata,
  generateGccFilterStaticParams,
} from "@/components/directory/GccFilterPage";

export const revalidate = 43200;

export async function generateStaticParams() {
  return generateGccFilterStaticParams("bh", "emergency");
}

export function generateMetadata({ params }: { params: { city: string } }) {
  return generateGccFilterMetadata({ countryCode: "bh", citySlug: params.city, filter: "emergency" });
}

export default async function Page({ params }: { params: { city: string } }) {
  return <GccFilterPage countryCode="bh" citySlug={params.city} filter="emergency" />;
}
