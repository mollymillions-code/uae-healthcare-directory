import { GccBestCityPage, generateGccBestCityMetadata } from "@/components/directory/GccBestPages";

export const revalidate = 43200;

export async function generateMetadata(props: { params: Promise<{ city: string }> }) {
  const params = await props.params;
  return generateGccBestCityMetadata("sa", params);
}

export default async function Page(props: { params: Promise<{ city: string }> }) {
  const params = await props.params;
  return <GccBestCityPage countryCode="sa" params={params} />;
}
