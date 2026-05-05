import {
  GccFilterPage,
  generateGccFilterMetadata,
  generateGccFilterStaticParams,
} from "@/components/directory/GccFilterPage";

export const revalidate = 43200;

export async function generateStaticParams() {
  if (process.env.PREBUILD_STATIC_ROUTES !== "1") return [];
  return generateGccFilterStaticParams("tr", "24-hour");
}

export function generateMetadata({ params }: { params: { city: string } }) {
  return generateGccFilterMetadata({ countryCode: "tr", citySlug: params.city, filter: "24-hour" });
}

export default async function Page({ params }: { params: { city: string } }) {
  return <GccFilterPage countryCode="tr" citySlug={params.city} filter="24-hour" />;
}
