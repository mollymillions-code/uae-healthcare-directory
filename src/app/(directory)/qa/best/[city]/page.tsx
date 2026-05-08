import { GccBestCityPage, generateGccBestCityMetadata } from "@/components/directory/GccBestPages";

export const revalidate = 43200;

export async function generateMetadata(props: { params: Promise<{ city: string }> }) {
  const params = await props.params;
  return generateGccBestCityMetadata("qa", params);
}

export default async function Page(props: { params: Promise<{ city: string }> }) {
  const params = await props.params;
  return <GccBestCityPage countryCode="qa" params={params} />;
}
