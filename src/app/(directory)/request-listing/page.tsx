import { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, FileCheck, ShieldCheck } from "lucide-react";
import { ListingRequestForm } from "@/components/listing-request/ListingRequestForm";
import { getBaseUrl } from "@/lib/helpers";

export const metadata: Metadata = {
  title: "Request a Healthcare Listing | Zavis Directory",
  description:
    "Request a new GCC healthcare provider listing with Google Business Profile, trade licence, regulator, and proof of authority details.",
  alternates: {
    canonical: `${getBaseUrl()}/request-listing`,
  },
  robots: { index: true, follow: true },
};

export default function RequestListingPage() {
  return (
    <>
      <section className="relative overflow-hidden bg-surface-cream">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 -right-40 h-[460px] w-[460px] rounded-full bg-[radial-gradient(closest-side,rgba(0,200,83,0.16),transparent_70%)]" />
          <div className="absolute -top-20 -left-32 h-[360px] w-[360px] rounded-full bg-[radial-gradient(closest-side,rgba(255,176,120,0.22),transparent_70%)]" />
        </div>

        <div className="relative max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-10">
          <nav
            className="font-sans text-z-body-sm text-ink-muted flex items-center gap-1.5 mb-5 flex-wrap"
            aria-label="Breadcrumb"
          >
            <Link href="/" className="hover:text-ink transition-colors">
              Home
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link href="/claim" className="hover:text-ink transition-colors">
              Claim
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-ink font-medium">Request listing</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-8">
              <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-3 inline-flex items-center gap-1.5">
                <FileCheck className="h-3.5 w-3.5" />
                New provider listing
              </p>
              <h1 className="font-display font-semibold text-ink text-display-lg lg:text-[56px] leading-[1.02] tracking-[-0.028em]">
                Request a listing.
              </h1>
              <p className="font-sans text-z-body sm:text-[17px] text-ink-soft mt-4 max-w-2xl leading-relaxed">
                Add a healthcare practice that is missing from the directory. Include
                the Google Business Profile link, country, city, category, trade licence,
                regulator licence, and proof that you are authorised to request the listing.
              </p>
            </div>
            <div className="lg:col-span-4 rounded-z-md bg-white border border-ink-line p-5">
              <div className="flex gap-3">
                <ShieldCheck className="h-5 w-5 text-accent-deep mt-0.5 flex-shrink-0" />
                <p className="font-sans text-z-body-sm text-ink-soft leading-relaxed">
                  Requests are reviewed against public regulator records before a new
                  provider page is published or made claimable.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="max-w-3xl mx-auto">
          <ListingRequestForm />
        </div>
      </section>
    </>
  );
}
