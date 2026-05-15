import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  providerEditRequests,
  providerOwnerships,
  providers,
} from "@/lib/db/schema";
import type { ProviderPortalContext } from "@/lib/provider-portal/auth";

export async function listOwnedProviders(context: ProviderPortalContext) {
  if (context.staff?.isZavisStaff) {
    if (!context.staff.providerId) return [];

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
      .from(providers)
      .leftJoin(
        providerOwnerships,
        and(
          eq(providerOwnerships.providerId, providers.id),
          eq(providerOwnerships.status, "active")
        )
      )
      .where(eq(providers.id, context.staff.providerId))
      .orderBy(providers.name);
  }

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
  if (context.staff?.isZavisStaff) {
    return (
      await db
        .select({
          id: providers.id,
          name: providers.name,
          nameAr: providers.nameAr,
          slug: providers.slug,
          citySlug: providers.citySlug,
          categorySlug: providers.categorySlug,
          phone: providers.phone,
          phoneSecondary: providers.phoneSecondary,
          whatsapp: providers.whatsapp,
          email: providers.email,
          website: providers.website,
          address: providers.address,
          addressAr: providers.addressAr,
          shortDescription: providers.shortDescription,
          description: providers.description,
          descriptionAr: providers.descriptionAr,
          services: providers.services,
          insurance: providers.insurance,
          languages: providers.languages,
          amenities: providers.amenities,
          operatingHours: providers.operatingHours,
          logoUrl: providers.logoUrl,
          coverImageUrl: providers.coverImageUrl,
          photos: providers.photos,
          galleryPhotos: providers.galleryPhotos,
          googleReviews: providers.googleReviews,
          googleMapsUri: providers.googleMapsUri,
          latitude: providers.latitude,
          longitude: providers.longitude,
          isClaimed: providers.isClaimed,
          isVerified: providers.isVerified,
          googleRating: providers.googleRating,
          googleReviewCount: providers.googleReviewCount,
        })
        .from(providers)
        .where(eq(providers.id, providerId))
        .limit(1)
    )[0] ?? null;
  }

  return (
    await db
      .select({
        id: providers.id,
        name: providers.name,
        nameAr: providers.nameAr,
        slug: providers.slug,
        citySlug: providers.citySlug,
        categorySlug: providers.categorySlug,
        phone: providers.phone,
        phoneSecondary: providers.phoneSecondary,
        whatsapp: providers.whatsapp,
        email: providers.email,
        website: providers.website,
        address: providers.address,
        addressAr: providers.addressAr,
        shortDescription: providers.shortDescription,
        description: providers.description,
        descriptionAr: providers.descriptionAr,
        services: providers.services,
        insurance: providers.insurance,
        languages: providers.languages,
        amenities: providers.amenities,
        operatingHours: providers.operatingHours,
        logoUrl: providers.logoUrl,
        coverImageUrl: providers.coverImageUrl,
        photos: providers.photos,
        galleryPhotos: providers.galleryPhotos,
        googleReviews: providers.googleReviews,
        googleMapsUri: providers.googleMapsUri,
        latitude: providers.latitude,
        longitude: providers.longitude,
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
  if (context.staff?.isZavisStaff) {
    if (!providerId) return [];

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
      .where(eq(providerEditRequests.providerId, providerId))
      .orderBy(desc(providerEditRequests.createdAt))
      .limit(50);
  }

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
