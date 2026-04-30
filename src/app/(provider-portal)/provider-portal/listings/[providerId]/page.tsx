import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, BadgeCheck, Clock3 } from "lucide-react";
import { ProviderListingEditForm } from "@/components/provider-portal/ProviderListingEditForm";
import { ProviderPortalLogoutButton } from "@/components/provider-portal/ProviderPortalLogoutButton";
import { getCurrentProviderPortalContext } from "@/lib/provider-portal/current-user";
import { getOwnedProvider, listProviderEditRequests } from "@/lib/provider-portal/access";

function formatDate(value: Date | string | null) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function ProviderPortalListingPage({
  params,
  searchParams,
}: {
  params: { providerId: string };
  searchParams: { embed?: string };
}) {
  const context = await getCurrentProviderPortalContext();
  if (!context) {
    const redirectTarget = `/provider-portal/listings/${encodeURIComponent(params.providerId)}${
      searchParams.embed === "1" ? "?embed=1" : ""
    }`;
    redirect(`/provider-portal/login?redirect=${encodeURIComponent(redirectTarget)}`);
  }

  const [provider, editRequests] = await Promise.all([
    getOwnedProvider(context, params.providerId),
    listProviderEditRequests(context, params.providerId),
  ]);
  if (!provider) notFound();

  const embedded = searchParams.embed === "1";

  return (
    <main className="mx-auto min-h-screen max-w-[1180px] px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-6 flex flex-col gap-4 rounded-2xl border border-black/[0.06] bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href={`/provider-portal${embedded ? "?embed=1" : ""}`}
            className="inline-flex items-center gap-2 font-['Geist',sans-serif] text-sm font-medium text-black/45 hover:text-[#006828]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to listings
          </Link>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <h1 className="font-['Bricolage_Grotesque',sans-serif] text-[30px] font-medium tracking-tight text-[#1c1c1c]">
              {provider.name}
            </h1>
            {provider.isVerified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#006828]/10 px-2.5 py-1 font-['Geist',sans-serif] text-xs font-semibold text-[#006828]">
                <BadgeCheck className="h-3.5 w-3.5" />
                Verified
              </span>
            )}
          </div>
          <p className="mt-1 font-['Geist',sans-serif] text-sm text-black/45">
            Submit profile changes for Zavis review.
          </p>
        </div>
        {!embedded && <ProviderPortalLogoutButton />}
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="rounded-2xl border border-black/[0.06] bg-white p-5 sm:p-6">
          <ProviderListingEditForm provider={provider} />
        </section>

        <aside className="space-y-4">
          <section className="rounded-2xl border border-black/[0.06] bg-white p-5">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] text-xl font-medium text-[#1c1c1c]">
              Review history
            </h2>
            {editRequests.length === 0 ? (
              <p className="mt-3 font-['Geist',sans-serif] text-sm text-black/45">
                No edit requests yet.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {editRequests.map((request) => (
                  <div key={request.id} className="rounded-xl border border-black/[0.06] p-3">
                    <div className="flex items-center gap-2">
                      <Clock3 className="h-4 w-4 text-black/35" />
                      <p className="font-['Geist',sans-serif] text-sm font-semibold capitalize text-[#1c1c1c]">
                        {request.status}
                      </p>
                    </div>
                    <p className="mt-1 font-['Geist',sans-serif] text-xs text-black/40">
                      {formatDate(request.createdAt)} · {Object.keys(request.payload || {}).length} fields
                    </p>
                    {request.rejectionReason && (
                      <p className="mt-2 font-['Geist',sans-serif] text-xs text-red-600">
                        {request.rejectionReason}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </aside>
      </div>
    </main>
  );
}
