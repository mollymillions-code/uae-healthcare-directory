import { GccSegmentsPage, generateGccSegmentsMetadata } from "@/components/directory/GccDirectoryPages";

export const revalidate = 21600;
export const dynamicParams = true;

interface Props {
  params: Promise<{ city: string; segments: string[] }>;
  searchParams?: Promise<{ page?: string }>;
}

export async function generateMetadata(props: Props) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  return generateGccSegmentsMetadata("qa", params, searchParams);
}

export default async function Page(props: Props) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  return <GccSegmentsPage countryCode="qa" params={params} searchParams={searchParams} />;
}
