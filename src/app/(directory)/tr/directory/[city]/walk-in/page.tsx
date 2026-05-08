import {
  GccFilterPage,
  generateGccFilterMetadata,
  generateGccFilterStaticParams,
} from "@/components/directory/GccFilterPage";

export const revalidate = 43200;

export async function generateStaticParams() {
  if (process.env.PREBUILD_STATIC_ROUTES !== "1") return [];
  return generateGccFilterStaticParams("tr", "walk-in");
}

export async function generateMetadata(props: { params: Promise<{ city: string }> }) {
  const params = await props.params;
  return generateGccFilterMetadata({ countryCode: "tr", citySlug: params.city, filter: "walk-in" });
}

export default async function Page(props: { params: Promise<{ city: string }> }) {
  const params = await props.params;
  return <GccFilterPage countryCode="tr" citySlug={params.city} filter="walk-in" />;
}
