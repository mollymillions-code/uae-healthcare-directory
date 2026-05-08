import {
  GccFilterPage,
  generateGccFilterMetadata,
  generateGccFilterStaticParams,
} from "@/components/directory/GccFilterPage";

export const revalidate = 43200;

export async function generateStaticParams() {
  if (process.env.PREBUILD_STATIC_ROUTES !== "1") return [];
  return generateGccFilterStaticParams("qa", "24-hour");
}

export async function generateMetadata(props: { params: Promise<{ city: string }> }) {
  const params = await props.params;
  return generateGccFilterMetadata({ countryCode: "qa", citySlug: params.city, filter: "24-hour" });
}

export default async function Page(props: { params: Promise<{ city: string }> }) {
  const params = await props.params;
  return <GccFilterPage countryCode="qa" citySlug={params.city} filter="24-hour" />;
}
