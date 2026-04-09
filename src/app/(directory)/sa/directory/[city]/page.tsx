import { GccCityPage, generateGccCityMetadata } from "@/components/directory/GccDirectoryPages";

export const revalidate = 43200;
export const dynamicParams = true;

export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: { params: { city: string } }) {
  return generateGccCityMetadata("sa", params);
}

export default function Page({ params }: { params: { city: string } }) {
  return <GccCityPage countryCode="sa" params={params} />;
}
