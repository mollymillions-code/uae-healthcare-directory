import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { getCurrentConsumerUser } from "@/lib/auth/current-user";
import { db } from "@/lib/db";
import { consumerProviderEvents, consumerSavedProviders } from "@/lib/db/schema";
import { getAccountProviderSummaries } from "@/lib/account/provider-summaries";

export default async function AccountPage() {
  const user = await getCurrentConsumerUser();
  if (!user) return null;

  const saved = await db
    .select({
      providerId: consumerSavedProviders.providerId,
      createdAt: consumerSavedProviders.createdAt,
    })
    .from(consumerSavedProviders)
    .where(eq(consumerSavedProviders.userId, user.id))
    .orderBy(desc(consumerSavedProviders.createdAt))
    .limit(3);
  const providerSummaries = await getAccountProviderSummaries(saved.map((item) => item.providerId));

  const activity = await db
    .select({
      id: consumerProviderEvents.id,
      action: consumerProviderEvents.action,
      entityName: consumerProviderEvents.entityName,
      surface: consumerProviderEvents.surface,
      createdAt: consumerProviderEvents.createdAt,
    })
    .from(consumerProviderEvents)
    .where(eq(consumerProviderEvents.userId, user.id))
    .orderBy(desc(consumerProviderEvents.createdAt))
    .limit(5);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-black/[0.06] bg-white p-5">
          <p className="font-['Geist',sans-serif] text-xs uppercase tracking-[0.14em] text-black/35">Saved</p>
          <p className="mt-2 font-['Bricolage_Grotesque',sans-serif] text-3xl font-medium text-[#1c1c1c]">{saved.length}</p>
          <p className="font-['Geist',sans-serif] text-sm text-black/45">recent providers shown</p>
        </div>
        <div className="rounded-2xl border border-black/[0.06] bg-white p-5">
          <p className="font-['Geist',sans-serif] text-xs uppercase tracking-[0.14em] text-black/35">Preferred city</p>
          <p className="mt-2 font-['Bricolage_Grotesque',sans-serif] text-xl font-medium text-[#1c1c1c]">{user.preferredCitySlug || "Not set"}</p>
        </div>
        <div className="rounded-2xl border border-black/[0.06] bg-white p-5">
          <p className="font-['Geist',sans-serif] text-xs uppercase tracking-[0.14em] text-black/35">Insurance</p>
          <p className="mt-2 font-['Bricolage_Grotesque',sans-serif] text-xl font-medium text-[#1c1c1c]">{user.preferredInsurance || "Not set"}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-black/[0.06] bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] text-xl font-medium tracking-tight text-[#1c1c1c]">Saved providers</h2>
            <Link href="/account/saved" className="font-['Geist',sans-serif] text-sm font-medium text-[#006828] hover:underline">View all</Link>
          </div>
          {saved.length > 0 ? (
            <div className="space-y-3">
              {saved.map((item) => (
                (() => {
                  const provider = providerSummaries.get(item.providerId);
                  const content = (
                    <>
                      <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-medium text-[#1c1c1c]">
                        {provider?.name || item.providerId}
                      </p>
                      <p className="font-['Geist',sans-serif] text-xs text-black/40">Saved {item.createdAt.toLocaleDateString("en-GB")}</p>
                    </>
                  );
                  return provider ? (
                    <Link
                      key={item.providerId}
                      href={`/directory/${provider.citySlug}/${provider.categorySlug}/${provider.slug}`}
                      className="block rounded-xl border border-black/[0.06] p-3 transition-colors hover:border-[#006828]/25 hover:bg-[#006828]/[0.03]"
                    >
                      {content}
                    </Link>
                  ) : (
                    <div key={item.providerId} className="rounded-xl border border-black/[0.06] p-3">
                      {content}
                    </div>
                  );
                })()
              ))}
            </div>
          ) : (
            <p className="font-['Geist',sans-serif] text-sm text-black/45">Save a clinic to see it here.</p>
          )}
        </section>

        <section className="rounded-2xl border border-black/[0.06] bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] text-xl font-medium tracking-tight text-[#1c1c1c]">Recent activity</h2>
            <Link href="/account/activity" className="font-['Geist',sans-serif] text-sm font-medium text-[#006828] hover:underline">View all</Link>
          </div>
          {activity.length > 0 ? (
            <div className="space-y-3">
              {activity.map((item) => (
                <div key={item.id} className="rounded-xl border border-black/[0.06] p-3">
                  <p className="font-['Geist',sans-serif] text-sm font-medium text-[#1c1c1c]">{item.action.replace(/_/g, " ")}</p>
                  <p className="font-['Geist',sans-serif] text-xs text-black/40">{item.entityName || item.surface} · {item.createdAt.toLocaleDateString("en-GB")}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="font-['Geist',sans-serif] text-sm text-black/45">Your provider interactions will appear here.</p>
          )}
        </section>
      </div>
    </div>
  );
}
