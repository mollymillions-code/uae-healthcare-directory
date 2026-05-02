import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  providerEditRequests,
  providerOwnerships,
  providers,
} from "@/lib/db/schema";
import type { ProviderPortalContext } from "@/lib/provider-portal/auth";

export async function listOwnedProviders(context: ProviderPortalContext) {
  return db
    .select({
      id: providers.id,
      name: providers.name,
      slug: providers.slug,
      citySlug: providers.citySlug,
      categorySlug: providers.categorySlug,
      phone: providers.phone,
      phoneSecondary: providers.phoneSecondary,
      whatsapp: providers.whatsapp,
      email: providers.email,
      website: providers.website,
      address: providers.address,
      shortDescription: providers.shortDescription,
      description: providers.description,
      services: providers.services,
      insurance: providers.insurance,
      languages: providers.languages,
      operatingHours: providers.operatingHours,
      logoUrl: providers.logoUrl,
      coverImageUrl: providers.coverImageUrl,
      photos: providers.photos,
      isClaimed: providers.isClaimed,
      isVerified: providers.isVerified,
      googleRating: providers.googleRating,
      googleReviewCount: providers.googleReviewCount,
      ownershipStatus: providerOwnerships.status,
    })
    .from(providerOwnerships)
    .innerJoin(providers, eq(providerOwnerships.providerId, providers.id))
    .where(
      and(
        eq(providerOwnerships.organizationId, context.organization.id),
        eq(providerOwnerships.status, "active")
      )
    )
    .orderBy(providers.name);
}

export async function getOwnedProvider(
  context: ProviderPortalContext,
  providerId: string
) {
  return (
    await db
      .select({
        id: providers.id,
        name: providers.name,
        slug: providers.slug,
        citySlug: providers.citySlug,
        categorySlug: providers.categorySlug,
        phone: providers.phone,
        phoneSecondary: providers.phoneSecondary,
        whatsapp: providers.whatsapp,
        email: providers.email,
        website: providers.website,
        address: providers.address,
        shortDescription: providers.shortDescription,
        description: providers.description,
        services: providers.services,
        insurance: providers.insurance,
        languages: providers.languages,
        operatingHours: providers.operatingHours,
        logoUrl: providers.logoUrl,
        coverImageUrl: providers.coverImageUrl,
        photos: providers.photos,
        isClaimed: providers.isClaimed,
        isVerified: providers.isVerified,
        googleRating: providers.googleRating,
        googleReviewCount: providers.googleReviewCount,
      })
      .from(providerOwnerships)
      .innerJoin(providers, eq(providerOwnerships.providerId, providers.id))
      .where(
        and(
          eq(providerOwnerships.organizationId, context.organization.id),
          eq(providerOwnerships.providerId, providerId),
          eq(providerOwnerships.status, "active")
        )
      )
      .limit(1)
  )[0] ?? null;
}

export async function listProviderEditRequests(
  context: ProviderPortalContext,
  providerId?: string
) {
  return db
    .select({
      id: providerEditRequests.id,
      providerId: providerEditRequests.providerId,
      status: providerEditRequests.status,
      payload: providerEditRequests.payload,
      rejectionReason: providerEditRequests.rejectionReason,
      reviewedBy: providerEditRequests.reviewedBy,
      reviewedAt: providerEditRequests.reviewedAt,
      createdAt: providerEditRequests.createdAt,
      updatedAt: providerEditRequests.updatedAt,
    })
    .from(providerEditRequests)
    .where(
      providerId
        ? and(
            eq(providerEditRequests.organizationId, context.organization.id),
            eq(providerEditRequests.providerId, providerId)
          )
        : eq(providerEditRequests.organizationId, context.organization.id)
    )
    .orderBy(desc(providerEditRequests.createdAt))
    .limit(50);
}
