import { GccBestCategoryPage, generateGccBestCategoryMetadata } from "@/components/directory/GccBestPages";

export const revalidate = 43200;

export async function generateMetadata(props: { params: Promise<{ city: string; category: string }> }) {
  const params = await props.params;
  return generateGccBestCategoryMetadata("qa", params);
}

export default async function Page(props: { params: Promise<{ city: string; category: string }> }) {
  const params = await props.params;
  return <GccBestCategoryPage countryCode="qa" params={params} />;
}
