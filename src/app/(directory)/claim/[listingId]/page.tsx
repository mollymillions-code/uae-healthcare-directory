import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  MessageCircle,
  Sparkles,
} from "lucide-react";
import { OwnerWhatsappCta } from "@/components/owner/OwnerWhatsappCta";
import { getProviderByIdOrSlug } from "@/lib/data";

interface ClaimFormPageProps {
  params: Promise<{ listingId: string }>;
}

export async function generateMetadata(props: ClaimFormPageProps): Promise<Metadata> {
  const params = await props.params;
  const provider = await getProviderByIdOrSlug(params.listingId);

  if (!provider) {
    return {
      title: "Listing not found | Claim Provider Listing",
      robots: { index: false, follow: false },
    };
  }

  return {
    title: `Claim ${provider.name} | Zavis Directory`,
    description: `Open WhatsApp to claim and manage the Zavis listing for ${provider.name}.`,
    robots: { index: false, follow: false },
  };
}

export default async function ClaimFormPage(props: ClaimFormPageProps) {
  const params = await props.params;
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
                The provider record is missing a claimable identifier. Return to the
                claim hub and reach out via WhatsApp — our team will help.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href="/claim"
                  className="inline-flex items-center gap-2 rounded-z-pill bg-white border border-ink text-ink hover:bg-surface-cream px-4 py-2.5 font-sans font-medium text-z-body-sm transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to claim
                </Link>
                <OwnerWhatsappCta
                  action="get_listed"
                  surface="claim_listing_missing_id"
                  label="Reach out via WhatsApp"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const action = provider.isClaimed ? "edit" : "claim";
  const headline = provider.isClaimed ? "Edit your listing." : "Claim your listing.";
  const lead = provider.isClaimed
    ? `${provider.name} is already verified on Zavis. Use WhatsApp to request edits — hours, insurance, services, photos, or contact details.`
    : `${provider.name} is on Zavis. Confirm your role at the clinic, share your DHA/DOH/MOHAP licence on WhatsApp, and our team takes it from there.`;

  return (
    <>
      <section className="relative overflow-hidden bg-surface-cream">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 -right-40 h-[460px] w-[460px] rounded-full bg-[radial-gradient(closest-side,rgba(0,200,83,0.16),transparent_70%)]" />
        </div>

        <div className="relative max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-12">
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
            <span className="text-ink font-medium truncate">{provider.name}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7">
              <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-3 inline-flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                For {provider.name}
              </p>
              <h1 className="font-display font-semibold text-ink text-display-lg lg:text-[48px] leading-[1.04] tracking-[-0.024em]">
                {headline}
              </h1>
              <p className="font-sans text-z-body sm:text-[17px] text-ink-soft mt-4 leading-relaxed">
                {lead}
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <OwnerWhatsappCta
                  action={action}
                  surface="claim_listing_detail_hero"
                  providerId={provider.id}
                  providerName={provider.name}
                  providerSlug={provider.slug}
                  citySlug={provider.citySlug}
                  categorySlug={provider.categorySlug}
                  label={provider.isClaimed ? "Edit via WhatsApp" : "Claim via WhatsApp"}
                />
              </div>
              <p className="mt-3 font-sans text-z-caption text-ink-muted leading-relaxed">
                You will be asked to confirm you are authorised before WhatsApp opens.
              </p>
            </div>

            <aside className="lg:col-span-5 space-y-3">
              <div className="rounded-z-md bg-white border border-ink-line p-5">
                <p className="font-sans text-z-micro text-ink-muted uppercase tracking-[0.06em] mb-1">
                  Listing
                </p>
                <p className="font-display font-semibold text-ink text-z-h3 leading-tight">
                  {provider.name}
                </p>
                {provider.address && (
                  <p className="font-sans text-z-body-sm text-ink-soft mt-2 leading-relaxed">
                    {provider.address}
                  </p>
                )}
                {provider.licenseNumber && (
                  <p className="font-sans text-z-caption text-ink-muted mt-2">
                    Licence: {provider.licenseNumber}
                  </p>
                )}
                {provider.isClaimed && (
                  <p className="mt-3 inline-flex items-center gap-1.5 font-sans text-z-caption text-accent-dark">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Already verified on Zavis
                  </p>
                )}
              </div>

              <div className="rounded-z-md bg-white border border-ink-line p-5">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-full bg-accent-deep flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="h-4 w-4 text-white" strokeWidth={2} />
                  </div>
                  <div>
                    <p className="font-display font-semibold text-ink text-z-body-sm">
                      One conversation, end to end
                    </p>
                    <p className="font-sans text-z-caption text-ink-muted mt-1 leading-relaxed">
                      We collect your role and clinic details before WhatsApp opens, so
                      the chat starts with everything we need.
                    </p>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}
