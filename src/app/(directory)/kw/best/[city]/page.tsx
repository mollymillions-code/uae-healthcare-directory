import { GccBestCityPage, generateGccBestCityMetadata } from "@/components/directory/GccBestPages";

export const revalidate = 43200;

export async function generateMetadata({ params }: { params: { city: string } }) {
  return generateGccBestCityMetadata("kw", params);
}

export default function Page({ params }: { params: { city: string } }) {
  return <GccBestCityPage countryCode="kw" params={params} />;
}
