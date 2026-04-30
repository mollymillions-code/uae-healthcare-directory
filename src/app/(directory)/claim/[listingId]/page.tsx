import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { ClaimForm } from "@/components/claim/ClaimForm";
import { OwnerWhatsappCta } from "@/components/owner/OwnerWhatsappCta";
import { getProviderByIdOrSlug } from "@/lib/data";

interface ClaimFormPageProps {
  params: { listingId: string };
}

export async function generateMetadata({
  params,
}: ClaimFormPageProps): Promise<Metadata> {
  const provider = await getProviderByIdOrSlug(params.listingId);

  if (!provider) {
    return {
      title: "Listing not found | Claim Provider Listing",
      robots: { index: false, follow: false },
    };
  }

  return {
    title: `Claim ${provider.name} | Zavis Directory`,
    description: `Submit an authority check to claim and manage the Zavis listing for ${provider.name}.`,
    robots: { index: false, follow: false },
  };
}

export default async function ClaimFormPage({ params }: ClaimFormPageProps) {
  const provider = await getProviderByIdOrSlug(params.listingId);

  if (!provider) {
    notFound();
  }

  if (!provider.id || !provider.slug) {
    return (
      <section className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-2xl rounded-z-lg bg-white border border-red-200 p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <h1 className="font-display font-semibold text-ink text-z-h2">
                This listing cannot be claimed yet.
              </h1>
              <p className="font-sans text-z-body-sm text-ink-soft mt-2 leading-relaxed">
                The provider record is missing a claimable identifier. Return to search
                and choose another result, or request a new listing if this practice
                needs to be added.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href="/claim"
                  className="inline-flex items-center gap-2 rounded-z-pill bg-white border border-ink text-ink hover:bg-surface-cream px-4 py-2.5 font-sans font-medium text-z-body-sm transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to claim search
                </Link>
                <Link
                  href="/request-listing"
                  className="inline-flex items-center gap-2 rounded-z-pill bg-accent text-white hover:bg-accent-dark px-4 py-2.5 font-sans font-semibold text-z-body-sm transition-colors"
                >
                  Request listing
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="rounded-z-md border border-accent/20 bg-accent/[0.04] p-5">
          <p className="font-sans text-z-body-sm text-ink-soft mb-3">
            Prefer WhatsApp? Confirm your role and send the listing details directly to Zavis.
          </p>
          <OwnerWhatsappCta
            action={provider.isClaimed ? "edit" : "claim"}
            surface="claim_form_whatsapp_cta"
            providerId={provider.id}
            providerName={provider.name}
            providerSlug={provider.slug}
            citySlug={provider.citySlug}
            categorySlug={provider.categorySlug}
            label={provider.isClaimed ? "Edit via WhatsApp" : "Claim or edit via WhatsApp"}
            variant="secondary"
          />
        </div>
      </section>
      <ClaimForm
        provider={{
          id: provider.id,
          name: provider.name,
          slug: provider.slug,
          address: provider.address,
          citySlug: provider.citySlug,
          categorySlug: provider.categorySlug,
          phone: provider.phone,
          website: provider.website,
          licenseNumber: provider.licenseNumber,
          isClaimed: provider.isClaimed,
        }}
      />
    </>
  );
}
