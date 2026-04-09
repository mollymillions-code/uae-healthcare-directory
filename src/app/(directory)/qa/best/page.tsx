import { GccBestIndexPage, generateGccBestIndexMetadata } from "@/components/directory/GccBestPages";

export const revalidate = 43200;

export async function generateMetadata() {
  return generateGccBestIndexMetadata("qa");
}

export default function Page() {
  return <GccBestIndexPage countryCode="qa" />;
}
