import { GccSegmentsPage, generateGccSegmentsMetadata } from "@/components/directory/GccDirectoryPages";

export const revalidate = 21600;
export const dynamicParams = true;

interface Props {
  params: { city: string; segments: string[] };
  searchParams?: { page?: string };
}

export async function generateMetadata({ params, searchParams }: Props) {
  return generateGccSegmentsMetadata("bh", params, searchParams);
}

export default function Page({ params, searchParams }: Props) {
  return <GccSegmentsPage countryCode="bh" params={params} searchParams={searchParams} />;
}
