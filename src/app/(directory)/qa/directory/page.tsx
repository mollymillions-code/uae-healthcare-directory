import { GccDirectoryHome, generateGccDirectoryMetadata } from "@/components/directory/GccDirectoryPages";

export const revalidate = 21600;

export async function generateMetadata() {
  return generateGccDirectoryMetadata("qa");
}

export default function Page() {
  return <GccDirectoryHome countryCode="qa" />;
}
