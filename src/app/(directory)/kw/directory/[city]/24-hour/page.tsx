import {
  GccFilterPage,
  generateGccFilterMetadata,
  generateGccFilterStaticParams,
} from "@/components/directory/GccFilterPage";

export const revalidate = 43200;

export async function generateStaticParams() {
  return generateGccFilterStaticParams("kw", "24-hour");
}

export function generateMetadata({ params }: { params: { city: string } }) {
  return generateGccFilterMetadata({ countryCode: "kw", citySlug: params.city, filter: "24-hour" });
}

export default async function Page({ params }: { params: { city: string } }) {
  return <GccFilterPage countryCode="kw" citySlug={params.city} filter="24-hour" />;
}
