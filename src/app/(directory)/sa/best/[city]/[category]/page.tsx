import { GccBestCategoryPage, generateGccBestCategoryMetadata } from "@/components/directory/GccBestPages";

export const revalidate = 43200;

export async function generateMetadata({ params }: { params: { city: string; category: string } }) {
  return generateGccBestCategoryMetadata("sa", params);
}

export default function Page({ params }: { params: { city: string; category: string } }) {
  return <GccBestCategoryPage countryCode="sa" params={params} />;
}
