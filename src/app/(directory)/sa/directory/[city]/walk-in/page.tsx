import {
  GccFilterPage,
  generateGccFilterMetadata,
  generateGccFilterStaticParams,
} from "@/components/directory/GccFilterPage";

export const revalidate = 43200;

export async function generateStaticParams() {
  return generateGccFilterStaticParams("sa", "walk-in");
}

export function generateMetadata({ params }: { params: { city: string } }) {
  return generateGccFilterMetadata({ countryCode: "sa", citySlug: params.city, filter: "walk-in" });
}

export default async function Page({ params }: { params: { city: string } }) {
  return <GccFilterPage countryCode="sa" citySlug={params.city} filter="walk-in" />;
}
