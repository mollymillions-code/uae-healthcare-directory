import { Suspense } from "react";
import { Footer } from "@/components/layout/Footer";
import { SkipToContent } from "@/components/layout/SkipToContent";
import { JsonLd } from "@/components/seo/JsonLd";
import { organizationSchema } from "@/lib/seo";
import { ZavisHeader } from "@/components/directory-v2/header/ZavisHeader";
import { DeferredAuthModal } from "@/components/auth/DeferredAuthModal";

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
      {/* Global auth modal — opens when ?auth=login or ?auth=signup is in
          the URL. Header "Sign in" link adds the param without navigating
          so the modal overlays the current page (Airbnb-style). */}
      <Suspense fallback={null}>
        <DeferredAuthModal />
      </Suspense>
    </>
  );
}
