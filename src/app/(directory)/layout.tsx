import { Footer } from "@/components/layout/Footer";
import { SkipToContent } from "@/components/layout/SkipToContent";
import { JsonLd } from "@/components/seo/JsonLd";
import { organizationSchema } from "@/lib/seo";
import { ZavisHeader } from "@/components/directory-v2/header/ZavisHeader";

export default function DirectoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SkipToContent />
      <JsonLd data={organizationSchema()} />
      <ZavisHeader />
      <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none bg-surface-cream min-h-screen">
        {children}
      </main>
      <Footer />
    </>
  );
}
