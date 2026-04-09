import { GccBestIndexPage, generateGccBestIndexMetadata } from "@/components/directory/GccBestPages";

export const revalidate = 43200;

export async function generateMetadata() {
  return generateGccBestIndexMetadata("sa");
}

export default function Page() {
  return <GccBestIndexPage countryCode="sa" />;
}
