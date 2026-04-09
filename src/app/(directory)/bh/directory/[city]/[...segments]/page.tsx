import { GccSegmentsPage, generateGccSegmentsMetadata } from "@/components/directory/GccDirectoryPages";

export const revalidate = 21600;
export const dynamicParams = true;

export async function generateMetadata({ params }: { params: { city: string; segments: string[] } }) {
  return generateGccSegmentsMetadata("bh", params);
}

export default function Page({ params }: { params: { city: string; segments: string[] } }) {
  return <GccSegmentsPage countryCode="bh" params={params} />;
}
