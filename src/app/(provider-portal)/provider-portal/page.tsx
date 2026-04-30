import Link from "next/link";
import { redirect } from "next/navigation";
import { BadgeCheck, Building2, Clock3, ExternalLink, FilePenLine } from "lucide-react";
import { ProviderPortalLogoutButton } from "@/components/provider-portal/ProviderPortalLogoutButton";
import { getCurrentProviderPortalContext } from "@/lib/provider-portal/current-user";
import { listOwnedProviders, listProviderEditRequests } from "@/lib/provider-portal/access";

function formatDate(value: Date | string | null) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function ProviderPortalPage({
  searchParams,
}: {
  searchParams: { embed?: string };
}) {
  const context = await getCurrentProviderPortalContext();
  if (!context) redirect("/provider-portal/login?redirect=/provider-portal");

  const [listings, editRequests] = await Promise.all([
    listOwnedProviders(context),
    listProviderEditRequests(context),
  ]);
  const pendingCount = editRequests.filter((request) => request.status === "pending").length;
  const embedded = searchParams.embed === "1";

  return (
    <main className="mx-auto min-h-screen max-w-[1180px] px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-6 flex flex-col gap-4 rounded-2xl border border-black/[0.06] bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-['Geist',sans-serif] text-xs font-semibold uppercase tracking-[0.14em] text-[#006828]">
            {embedded ? "Embedded listing manager" : "Clinic listing portal"}
          </p>
          <h1 className="mt-1 font-['Bricolage_Grotesque',sans-serif] text-[30px] font-medium tracking-tight text-[#1c1c1c]">
            {context.organization.name}
          </h1>
          <p className="mt-1 font-['Geist',sans-serif] text-sm text-black/45">
            Signed in as {context.user.name || context.user.email} · {context.user.role}
          </p>
        </div>
        {!embedded && <ProviderPortalLogoutButton />}
      </header>

      <section className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-black/[0.06] bg-white p-5">
          <Building2 className="h-5 w-5 text-[#006828]" />
          <p className="mt-3 font-['Bricolage_Grotesque',sans-serif] text-3xl font-medium text-[#1c1c1c]">
            {listings.length}
          </p>
          <p className="font-['Geist',sans-serif] text-sm text-black/45">owned listings</p>
        </div>
        <div className="rounded-2xl border border-black/[0.06] bg-white p-5">
          <Clock3 className="h-5 w-5 text-amber-600" />
          <p className="mt-3 font-['Bricolage_Grotesque',sans-serif] text-3xl font-medium text-[#1c1c1c]">
            {pendingCount}
          </p>
          <p className="font-['Geist',sans-serif] text-sm text-black/45">pending edits</p>
        </div>
        <div className="rounded-2xl border border-black/[0.06] bg-white p-5">
          <BadgeCheck className="h-5 w-5 text-[#006828]" />
          <p className="mt-3 font-['Bricolage_Grotesque',sans-serif] text-3xl font-medium text-[#1c1c1c]">
            {listings.filter((listing) => listing.isVerified).length}
          </p>
          <p className="font-['Geist',sans-serif] text-sm text-black/45">verified profiles</p>
        </div>
      </section>

      <section className="rounded-2xl border border-black/[0.06] bg-white">
        <div className="border-b border-black/[0.06] p-5">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] text-2xl font-medium tracking-tight text-[#1c1c1c]">
            Listings
          </h2>
          <p className="mt-1 font-['Geist',sans-serif] text-sm text-black/45">
            Edit requests are reviewed by Zavis before they update public pages.
          </p>
        </div>

        {listings.length === 0 ? (
          <div className="p-8 text-center">
            <p className="font-['Geist',sans-serif] text-sm text-black/45">
              No listings are attached to this clinic account yet.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-black/[0.06]">
            {listings.map((listing) => {
              const listingEditRequests = editRequests.filter(
                (request) => request.providerId === listing.id
              );
              const latestEdit = listingEditRequests[0];
              const publicHref = `/directory/${listing.citySlug}/${listing.categorySlug}/${listing.slug}`;
              return (
                <article key={listing.id} className="grid gap-4 p-5 lg:grid-cols-[1fr_auto] lg:items-center">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-['Bricolage_Grotesque',sans-serif] text-xl font-medium text-[#1c1c1c]">
                        {listing.name}
                      </h3>
                      {listing.isVerified && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#006828]/10 px-2.5 py-1 font-['Geist',sans-serif] text-xs font-semibold text-[#006828]">
                          <BadgeCheck className="h-3.5 w-3.5" />
                          Verified
                        </span>
                      )}
                    </div>
                    <p className="mt-1 font-['Geist',sans-serif] text-sm text-black/45">
                      {listing.address || `${listing.citySlug} · ${listing.categorySlug}`}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2 font-['Geist',sans-serif] text-xs text-black/45">
                      <span className="rounded-full bg-black/[0.04] px-2.5 py-1">{listing.phone || "No phone"}</span>
                      <span className="rounded-full bg-black/[0.04] px-2.5 py-1">{listing.website || "No website"}</span>
                      {latestEdit && (
                        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-700">
                          Latest edit {latestEdit.status} · {formatDate(latestEdit.createdAt)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 lg:justify-end">
                    <Link
                      href={`/provider-portal/listings/${listing.id}${embedded ? "?embed=1" : ""}`}
                      className="inline-flex items-center gap-2 rounded-full bg-[#006828] px-4 py-2 font-['Geist',sans-serif] text-sm font-semibold text-white transition-colors hover:bg-[#004d1c]"
                    >
                      <FilePenLine className="h-4 w-4" />
                      Manage
                    </Link>
                    <Link
                      href={publicHref}
                      target="_blank"
                      className="inline-flex items-center gap-2 rounded-full border border-black/[0.08] px-4 py-2 font-['Geist',sans-serif] text-sm font-medium text-black/55 transition-colors hover:border-[#006828]/30 hover:text-[#006828]"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Public page
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
