import { GccBestCategoryPage, generateGccBestCategoryMetadata } from "@/components/directory/GccBestPages";

export const revalidate = 43200;

export async function generateMetadata(props: { params: Promise<{ city: string; category: string }> }) {
  const params = await props.params;
  return generateGccBestCategoryMetadata("sa", params);
}

export default async function Page(props: { params: Promise<{ city: string; category: string }> }) {
  const params = await props.params;
  return <GccBestCategoryPage countryCode="sa" params={params} />;
}
