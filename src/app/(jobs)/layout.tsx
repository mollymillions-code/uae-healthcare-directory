import { Footer } from "@/components/layout/Footer";
import { SkipToContent } from "@/components/layout/SkipToContent";
import { JsonLd } from "@/components/seo/JsonLd";
import { organizationSchema } from "@/lib/seo";
import { JobsHeader } from "@/components/jobs/JobsHeader";

export default function JobsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SkipToContent />
      <JsonLd data={organizationSchema()} />
      <JobsHeader />
      <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none bg-surface-cream min-h-screen">
        {children}
      </main>
      <Footer />
    </>
  );
}
