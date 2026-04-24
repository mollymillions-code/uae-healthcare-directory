import { GccCityPage, generateGccCityMetadata } from "@/components/directory/GccDirectoryPages";

export const revalidate = 43200;
export const dynamicParams = true;

export function generateStaticParams() {
  if (process.env.PREBUILD_STATIC_ROUTES !== "1") return [];
  return [];
}

export async function generateMetadata({ params }: { params: { city: string } }) {
  return generateGccCityMetadata("kw", params);
}

export default function Page({ params }: { params: { city: string } }) {
  return <GccCityPage countryCode="kw" params={params} />;
}
