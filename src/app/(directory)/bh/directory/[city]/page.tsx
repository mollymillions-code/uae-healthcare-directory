import { GccCityPage, generateGccCityMetadata } from "@/components/directory/GccDirectoryPages";

export const revalidate = 43200;
export const dynamicParams = true;

export function generateStaticParams() {
  if (process.env.PREBUILD_STATIC_ROUTES !== "1") return [];
  return [];
}

export async function generateMetadata(props: { params: Promise<{ city: string }> }) {
  const params = await props.params;
  return generateGccCityMetadata("bh", params);
}

export default async function Page(props: { params: Promise<{ city: string }> }) {
  const params = await props.params;
  return <GccCityPage countryCode="bh" params={params} />;
}
