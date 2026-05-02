import {
  GccFilterPage,
  generateGccFilterMetadata,
  generateGccFilterStaticParams,
} from "@/components/directory/GccFilterPage";

export const revalidate = 43200;

export async function generateStaticParams() {
  if (process.env.PREBUILD_STATIC_ROUTES !== "1") return [];
  return generateGccFilterStaticParams("bh", "24-hour");
}

export function generateMetadata({ params }: { params: { city: string } }) {
  return generateGccFilterMetadata({ countryCode: "bh", citySlug: params.city, filter: "24-hour" });
}

export default async function Page({ params }: { params: { city: string } }) {
  return <GccFilterPage countryCode="bh" citySlug={params.city} filter="24-hour" />;
}
