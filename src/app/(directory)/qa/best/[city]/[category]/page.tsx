import { GccBestCategoryPage, generateGccBestCategoryMetadata } from "@/components/directory/GccBestPages";

export const revalidate = 43200;

export async function generateMetadata({ params }: { params: { city: string; category: string } }) {
  return generateGccBestCategoryMetadata("qa", params);
}

export default function Page({ params }: { params: { city: string; category: string } }) {
  return <GccBestCategoryPage countryCode="qa" params={params} />;
}
