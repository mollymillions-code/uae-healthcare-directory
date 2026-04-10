import {
  GccFilterPage,
  generateGccFilterMetadata,
  generateGccFilterStaticParams,
} from "@/components/directory/GccFilterPage";

export const revalidate = 43200;

export async function generateStaticParams() {
  return generateGccFilterStaticParams("sa", "24-hour");
}

export function generateMetadata({ params }: { params: { city: string } }) {
  return generateGccFilterMetadata({ countryCode: "sa", citySlug: params.city, filter: "24-hour" });
}

export default async function Page({ params }: { params: { city: string } }) {
  return <GccFilterPage countryCode="sa" citySlug={params.city} filter="24-hour" />;
}
