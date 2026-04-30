import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { getCurrentConsumerUser } from "@/lib/auth/current-user";
import { db } from "@/lib/db";
import { consumerProviderEvents } from "@/lib/db/schema";

function actionLabel(action: string): string {
  return action.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export default async function AccountActivityPage() {
  const user = await getCurrentConsumerUser();
  if (!user) return null;

  const events = await db
    .select({
      id: consumerProviderEvents.id,
      action: consumerProviderEvents.action,
      surface: consumerProviderEvents.surface,
      entityType: consumerProviderEvents.entityType,
      entityName: consumerProviderEvents.entityName,
      pageUrl: consumerProviderEvents.pageUrl,
      createdAt: consumerProviderEvents.createdAt,
      metadata: consumerProviderEvents.metadata,
    })
    .from(consumerProviderEvents)
    .where(eq(consumerProviderEvents.userId, user.id))
    .orderBy(desc(consumerProviderEvents.createdAt))
    .limit(100);

  return (
    <div className="rounded-2xl border border-black/[0.06] bg-white p-5 sm:p-6">
      <h2 className="font-['Bricolage_Grotesque',sans-serif] text-2xl font-medium tracking-tight text-[#1c1c1c]">
        Recent activity
      </h2>
      <p className="mt-1 font-['Geist',sans-serif] text-sm text-black/45">
        Calls, saves, WhatsApp clicks, directions, and owner-contact actions tied to your account.
      </p>

      <div className="mt-6 space-y-3">
        {events.length > 0 ? (
          events.map((event) => {
            const href = event.pageUrl || null;
            return (
              <div key={event.id} className="rounded-xl border border-black/[0.06] p-4">
                <p className="font-['Geist',sans-serif] text-sm font-semibold text-[#1c1c1c]">
                  {actionLabel(event.action)}
                </p>
                <p className="mt-1 font-['Geist',sans-serif] text-sm text-black/45">
                  {event.entityName || event.entityType} · {event.surface}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-3 font-['Geist',sans-serif] text-xs text-black/35">
                  <span>{event.createdAt.toLocaleString("en-GB")}</span>
                  {href ? (
                    <Link href={href} className="font-medium text-[#006828] hover:underline">
                      Open page
                    </Link>
                  ) : null}
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-xl bg-[#f8f8f6] p-6 text-center">
            <p className="font-['Geist',sans-serif] text-sm text-black/50">No account activity yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
