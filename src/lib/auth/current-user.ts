import { getServerSession } from "next-auth";
import { eq } from "drizzle-orm";
import { authOptions } from "@/lib/auth/nextauth";
import { db } from "@/lib/db";
import { consumerUsers } from "@/lib/db/schema";

export async function getCurrentConsumerSession() {
  return getServerSession(authOptions);
}

export async function getCurrentConsumerUser() {
  const session = await getCurrentConsumerSession();
  const userId = session?.user?.id;
  if (!userId) return null;

  return (
    await db
      .select({
        id: consumerUsers.id,
        email: consumerUsers.email,
        name: consumerUsers.name,
        phone: consumerUsers.phone,
        preferredCitySlug: consumerUsers.preferredCitySlug,
        preferredInsurance: consumerUsers.preferredInsurance,
        marketingOptIn: consumerUsers.marketingOptIn,
        createdAt: consumerUsers.createdAt,
      })
      .from(consumerUsers)
      .where(eq(consumerUsers.id, userId))
      .limit(1)
  )[0] ?? null;
}
