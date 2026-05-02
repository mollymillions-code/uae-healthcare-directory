import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { getCurrentConsumerUser } from "@/lib/auth/current-user";
import { db } from "@/lib/db";
import { consumerSavedProviders } from "@/lib/db/schema";
import { UnsaveProviderButton } from "@/components/account/UnsaveProviderButton";
import { getAccountProviderSummaries } from "@/lib/account/provider-summaries";

export default async function SavedProvidersPage() {
  const user = await getCurrentConsumerUser();
  if (!user) return null;

  const saved = await db
    .select({
      providerId: consumerSavedProviders.providerId,
      source: consumerSavedProviders.source,
      savedAt: consumerSavedProviders.createdAt,
    })
    .from(consumerSavedProviders)
    .where(eq(consumerSavedProviders.userId, user.id))
    .orderBy(desc(consumerSavedProviders.createdAt));
  const providerSummaries = await getAccountProviderSummaries(saved.map((item) => item.providerId));

  return (
    <div className="rounded-2xl border border-black/[0.06] bg-white p-5 sm:p-6">
      <h2 className="font-['Bricolage_Grotesque',sans-serif] text-2xl font-medium tracking-tight text-[#1c1c1c]">
        Saved providers
      </h2>
      <p className="mt-1 font-['Geist',sans-serif] text-sm text-black/45">
        Clinics and healthcare providers you wanted to revisit.
      </p>

      <div className="mt-6 space-y-3">
        {saved.length > 0 ? (
          saved.map((item) => {
            const provider = providerSummaries.get(item.providerId);
            return (
            <div key={item.providerId} className="rounded-xl border border-black/[0.06] p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  {provider ? (
                    <Link
                      href={`/directory/${provider.citySlug}/${provider.categorySlug}/${provider.slug}`}
                      className="font-['Bricolage_Grotesque',sans-serif] text-lg font-medium tracking-tight text-[#1c1c1c] hover:text-[#006828]"
                    >
                      {provider.name}
                    </Link>
                  ) : (
                    <p className="font-['Bricolage_Grotesque',sans-serif] text-lg font-medium tracking-tight text-[#1c1c1c]">
                      {item.providerId}
                    </p>
                  )}
                  {provider?.address ? <p className="mt-1 font-['Geist',sans-serif] text-sm text-black/45">{provider.address}</p> : null}
                  <div className="mt-2 flex flex-wrap gap-2 font-['Geist',sans-serif] text-xs text-black/40">
                    {provider?.googleRating && Number(provider.googleRating) > 0 ? (
                      <span>{provider.googleRating}/5 from {provider.googleReviewCount ?? 0} reviews</span>
                    ) : null}
                    {provider?.phone ? <span>{provider.phone}</span> : null}
                    <span>Saved {item.savedAt.toLocaleDateString("en-GB")}</span>
                  </div>
                </div>
                <UnsaveProviderButton providerId={item.providerId} />
              </div>
            </div>
            );
          })
        ) : (
          <div className="rounded-xl bg-[#f8f8f6] p-6 text-center">
            <p className="font-['Geist',sans-serif] text-sm text-black/50">No saved providers yet.</p>
            <Link href="/directory/dubai" className="mt-3 inline-flex rounded-full bg-[#006828] px-4 py-2 font-['Geist',sans-serif] text-sm font-semibold text-white">
              Browse directory
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
