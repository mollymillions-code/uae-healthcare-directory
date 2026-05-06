import { GccDirectoryHome, generateGccDirectoryMetadata } from "@/components/directory/GccDirectoryPages";
import { getBaseUrl } from "@/lib/helpers";

export const revalidate = 21600;

export async function generateMetadata() {
  const metadata = await generateGccDirectoryMetadata("tr");
  const url = `${getBaseUrl().replace(/\/+$/, "")}/tr`;

  return {
    ...metadata,
    alternates: {
      ...metadata.alternates,
      canonical: url,
    },
    openGraph: metadata.openGraph
      ? {
          ...metadata.openGraph,
          url,
        }
      : metadata.openGraph,
  };
}

export default function Page() {
  return <GccDirectoryHome countryCode="tr" />;
}
