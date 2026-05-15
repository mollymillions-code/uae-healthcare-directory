import {
  pgTable,
  text,
  integer,
  serial,
  numeric,
  boolean,
  timestamp,
  date,
  jsonb,
  index,
  uniqueIndex,
  primaryKey,
} from "drizzle-orm/pg-core";

// ─── Cities ────────────────────────────────────────────────────────────────────

export const cities = pgTable("cities", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  emirate: text("emirate").notNull(),
  country: text("country").notNull().default("ae"),
  nameAr: text("name_ar"),
  latitude: numeric("latitude", { precision: 10, scale: 7 }),
  longitude: numeric("longitude", { precision: 10, scale: 7 }),
  description: text("description"),
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  imageUrl: text("image_url"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Areas ─────────────────────────────────────────────────────────────────────

export const areas = pgTable(
  "areas",
  {
    id: text("id").primaryKey(),
    cityId: text("city_id")
      .notNull()
      .references(() => cities.id),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    nameAr: text("name_ar"),
    latitude: numeric("latitude", { precision: 10, scale: 7 }),
    longitude: numeric("longitude", { precision: 10, scale: 7 }),
    description: text("description"),
    // ─── Item 3 additive columns (neighborhood taxonomy upgrade) ─────────────
    // Matches `scripts/db/migrations/2026-04-11-neighborhoods-taxonomy.sql`.
    // parent_area_id is TEXT to match areas.id. level: 1=emirate, 2=district,
    // 3=community (default — what most rows will be).
    parentAreaId: text("parent_area_id"),
    aliases: jsonb("aliases").$type<string[]>().notNull().default([]),
    level: integer("level").notNull().default(3),
    // e.g. 'dubai-pulse' | 'abu-dhabi-open-data' | 'osm-overpass' | 'manual'
    source: text("source"),
    sourceId: text("source_id"),
    // [minLng, minLat, maxLng, maxLat]
    bbox: jsonb("bbox").$type<[number, number, number, number]>(),
    centroidLat: numeric("centroid_lat", { precision: 12, scale: 8 }),
    centroidLng: numeric("centroid_lng", { precision: 12, scale: 8 }),
    isPublished: boolean("is_published").notNull().default(true),
    minProviderCount: integer("min_provider_count").notNull().default(0),
    providerCountCached: integer("provider_count_cached"),
    providerCountUpdatedAt: timestamp("provider_count_updated_at", {
      withTimezone: true,
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    cityIdx: index("idx_areas_city").on(table.cityId),
    citySlugUnique: uniqueIndex("uq_areas_city_slug").on(
      table.cityId,
      table.slug
    ),
    parentIdx: index("idx_areas_parent").on(table.parentAreaId),
    sourceIdx: index("idx_areas_source").on(table.source, table.sourceId),
    isPublishedIdx: index("idx_areas_is_published").on(table.isPublished),
    centroidIdx: index("idx_areas_centroid").on(table.centroidLat, table.centroidLng),
    levelIdx: index("idx_areas_level").on(table.level),
  })
);

// ─── Categories ────────────────────────────────────────────────────────────────

export const categories = pgTable("categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  nameAr: text("name_ar"),
  icon: text("icon"),
  description: text("description"),
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Subcategories ─────────────────────────────────────────────────────────────

export const subcategories = pgTable(
  "subcategories",
  {
    id: text("id").primaryKey(),
    categoryId: text("category_id")
      .notNull()
      .references(() => categories.id),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    nameAr: text("name_ar"),
    description: text("description"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    categoryIdx: index("idx_subcategories_category").on(table.categoryId),
    categorySlugUnique: uniqueIndex("uq_subcategories_cat_slug").on(
      table.categoryId,
      table.slug
    ),
  })
);

// ─── Providers ─────────────────────────────────────────────────────────────────

export const providers = pgTable(
  "providers",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    nameAr: text("name_ar"),

    // Classification
    categoryId: text("category_id")
      .notNull()
      .references(() => categories.id),
    categorySlug: text("category_slug").notNull().default(""),
    subcategoryId: text("subcategory_id").references(() => subcategories.id),
    subcategorySlug: text("subcategory_slug"),
    facilityType: text("facility_type"),

    // Country
    country: text("country").notNull().default("ae"),

    // Location
    cityId: text("city_id")
      .notNull()
      .references(() => cities.id),
    citySlug: text("city_slug").notNull().default(""),
    areaId: text("area_id").references(() => areas.id),
    areaSlug: text("area_slug"),
    address: text("address").notNull(),
    addressAr: text("address_ar"),
    latitude: numeric("latitude", { precision: 10, scale: 7 }),
    longitude: numeric("longitude", { precision: 10, scale: 7 }),
    googlePlaceId: text("google_place_id"),

    // Contact
    phone: text("phone"),
    phoneSecondary: text("phone_secondary"),
    email: text("email"),
    website: text("website"),
    whatsapp: text("whatsapp"),

    // Details
    description: text("description"),
    descriptionAr: text("description_ar"),
    shortDescription: text("short_description"),
    reviewSummary: jsonb("review_summary").$type<string[]>().default([]),
    reviewSummaryAr: jsonb("review_summary_ar").$type<string[]>().default([]),
    // v2 bulky review block: { version, overall_sentiment, what_stood_out,
    // snippets, source, synced_at }. Produced by
    // scripts/rewrite-reviews-v2-or.mjs. See src/lib/data.ts LocalProvider
    // type for the full shape. Drizzle must declare this column so the
    // default SELECT includes it — otherwise rowToProvider silently drops
    // it at runtime (which was the bug that kept v2 from rendering after
    // commit a795db8 landed).
    reviewSummaryV2: jsonb("review_summary_v2").$type<{
      version: 2;
      overall_sentiment: string;
      what_stood_out: Array<{ theme: string; mention_count: number }>;
      snippets: Array<{
        text_fragment: string;
        author_display: string;
        rating: number;
        relative_time?: string;
      }>;
      source: string;
      synced_at: string;
      google_maps_url?: string;
    }>(),
    services: jsonb("services").$type<string[]>().default([]),
    languages: jsonb("languages").$type<string[]>().default([]),
    insurance: jsonb("insurance").$type<string[]>().default([]),
    operatingHours: jsonb("operating_hours").$type<Record<string, { open: string; close: string }>>(),
    amenities: jsonb("amenities").$type<string[]>().default([]),
    yearEstablished: integer("year_established"),
    licenseNumber: text("license_number"),

    // Google Reviews (cached)
    googleRating: numeric("google_rating", { precision: 2, scale: 1 }),
    googleReviewCount: integer("google_review_count").default(0),
    googleReviewsLastFetched: timestamp("google_reviews_last_fetched", {
      withTimezone: true,
    }),

    // Media
    logoUrl: text("logo_url"),
    coverImageUrl: text("cover_image_url"),
    // Kept on the column list for Drizzle SELECT safety during deploy transitions.
    // No longer read by any code path; slated for removal in a follow-up migration.
    googlePhotoUrl: text("google_photo_url"),
    photos: jsonb("photos").$type<string[]>().default([]),

    // Comprehensive Google Places (New API) data — fetched once, served forever from R2.
    // `gallery_photos` URLs live on our R2 bucket; we never hit the Places API at runtime.
    googlePlaceDetails: jsonb("google_place_details").$type<Record<string, unknown>>(),
    galleryPhotos: jsonb("gallery_photos")
      .$type<
        Array<{
          url: string;
          widthPx: number;
          heightPx: number;
          attributions: Array<{ displayName: string; uri: string }>;
        }>
      >()
      .default([]),
    googleReviews: jsonb("google_reviews")
      .$type<
        Array<{
          name?: string;
          rating: number;
          text?: { text: string; languageCode: string };
          originalText?: { text: string; languageCode: string };
          authorAttribution?: {
            displayName: string;
            uri?: string;
            photoUri?: string;
          };
          publishTime: string;
          relativePublishTimeDescription?: string;
        }>
      >()
      .default([]),
    editorialSummary: text("editorial_summary"),
    editorialSummaryLang: text("editorial_summary_lang"),
    accessibilityOptions: jsonb("accessibility_options").$type<{
      wheelchairAccessibleEntrance?: boolean;
      wheelchairAccessibleParking?: boolean;
      wheelchairAccessibleRestroom?: boolean;
      wheelchairAccessibleSeating?: boolean;
    }>(),
    googleTypes: jsonb("google_types").$type<string[]>().default([]),
    plusCodeGlobal: text("plus_code_global"),
    plusCodeCompound: text("plus_code_compound"),
    googleMapsUri: text("google_maps_uri"),
    priceLevel: text("price_level"),
    openingHoursPeriods: jsonb("opening_hours_periods").$type<
      Array<{
        open: { day: number; hour: number; minute: number };
        close?: { day: number; hour: number; minute: number };
      }>
    >(),
    currentOpeningHours: jsonb("current_opening_hours").$type<{
      openNow?: boolean;
      weekdayDescriptions?: string[];
      periods?: unknown[];
    }>(),
    addressComponents: jsonb("address_components").$type<
      Array<{ longText: string; shortText: string; types: string[] }>
    >(),
    googleFetchedAt: timestamp("google_fetched_at", { withTimezone: true }),

    // Status
    status: text("status").notNull().default("active"),
    isClaimed: boolean("is_claimed").default(false),
    isVerified: boolean("is_verified").default(false),
    isFeatured: boolean("is_featured").default(false),

    // SEO
    metaTitle: text("meta_title"),
    metaDescription: text("meta_description"),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    slugUnique: uniqueIndex("uq_providers_slug").on(table.slug),
    categoryIdx: index("idx_providers_category").on(table.categoryId),
    cityIdx: index("idx_providers_city").on(table.cityId),
    areaIdx: index("idx_providers_area").on(table.areaId),
    statusIdx: index("idx_providers_status").on(table.status),
    cityCategoryIdx: index("idx_providers_city_category").on(
      table.cityId,
      table.categoryId
    ),
    cityAreaIdx: index("idx_providers_city_area").on(
      table.cityId,
      table.areaId
    ),
    ratingIdx: index("idx_providers_rating").on(table.googleRating),
    citySlugIdx: index("idx_providers_city_slug").on(table.citySlug),
    categorySlugIdx: index("idx_providers_category_slug").on(table.categorySlug),
    countryIdx: index("idx_providers_country").on(table.country),
    countryCitySlugIdx: index("idx_providers_country_city_slug").on(
      table.country,
      table.citySlug
    ),
    citySlugCategorySlugIdx: index("idx_providers_city_cat_slug").on(
      table.citySlug,
      table.categorySlug
    ),
    citySlugAreaSlugIdx: index("idx_providers_city_area_slug").on(
      table.citySlug,
      table.areaSlug
    ),
    cityStatusIdx: index("idx_providers_city_status").on(
      table.cityId,
      table.status
    ),
    verifiedIdx: index("idx_providers_verified").on(table.isVerified),
    claimedIdx: index("idx_providers_claimed").on(table.isClaimed),
    featuredIdx: index("idx_providers_featured").on(table.isFeatured),
  })
);

// ─── Provider Categories (many-to-many) ────────────────────────────────────────

export const providerCategories = pgTable(
  "provider_categories",
  {
    id: text("id").primaryKey(),
    providerId: text("provider_id")
      .notNull()
      .references(() => providers.id, { onDelete: "cascade" }),
    categoryId: text("category_id")
      .notNull()
      .references(() => categories.id),
    subcategoryId: text("subcategory_id").references(() => subcategories.id),
    isPrimary: boolean("is_primary").default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    providerIdx: index("idx_provider_categories_provider").on(table.providerId),
    categoryIdx: index("idx_provider_categories_category").on(table.categoryId),
    provCatUnique: uniqueIndex("uq_provider_categories").on(
      table.providerId,
      table.categoryId
    ),
  })
);

// ─── Google Reviews ────────────────────────────────────────────────────────────

export const googleReviews = pgTable(
  "google_reviews",
  {
    id: text("id").primaryKey(),
    providerId: text("provider_id")
      .notNull()
      .references(() => providers.id, { onDelete: "cascade" }),
    googleReviewId: text("google_review_id"),
    authorName: text("author_name").notNull(),
    authorPhotoUrl: text("author_photo_url"),
    rating: integer("rating").notNull(),
    text: text("text"),
    language: text("language"),
    relativeTimeDescription: text("relative_time_description"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    providerIdx: index("idx_google_reviews_provider").on(table.providerId),
    ratingIdx: index("idx_google_reviews_rating").on(table.rating),
  })
);

// ─── Claim Requests ────────────────────────────────────────────────────────────

export const claimRequests = pgTable(
  "claim_requests",
  {
    id: text("id").primaryKey(),
    providerId: text("provider_id")
      .notNull()
      .references(() => providers.id, { onDelete: "cascade" }),

    contactName: text("contact_name").notNull(),
    contactEmail: text("contact_email").notNull(),
    contactPhone: text("contact_phone").notNull(),
    jobTitle: text("job_title"),

    proofType: text("proof_type"),
    proofDocumentUrl: text("proof_document_url"),

    requestedChanges: jsonb("requested_changes").$type<Record<string, string>>(),
    notes: text("notes"),

    status: text("status").notNull().default("pending"),
    reviewedBy: text("reviewed_by"),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    rejectionReason: text("rejection_reason"),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    providerIdx: index("idx_claim_requests_provider").on(table.providerId),
    statusIdx: index("idx_claim_requests_status").on(table.status),
  })
);

// ─── Clinic Portal: Organizations, Users, Ownership & Edits ─────────────────

export const clinicOrganizations = pgTable(
  "clinic_organizations",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug"),
    primaryEmail: text("primary_email"),
    phone: text("phone"),
    website: text("website"),
    status: text("status").notNull().default("active"),
    source: text("source").notNull().default("claim"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    slugIdx: index("idx_clinic_organizations_slug").on(table.slug),
    primaryEmailIdx: index("idx_clinic_organizations_primary_email").on(table.primaryEmail),
    statusIdx: index("idx_clinic_organizations_status").on(table.status),
  })
);

export const clinicUsers = pgTable(
  "clinic_users",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    name: text("name"),
    passwordHash: text("password_hash"),
    phone: text("phone"),
    status: text("status").notNull().default("invited"),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    emailUnique: uniqueIndex("uq_clinic_users_email").on(table.email),
    statusIdx: index("idx_clinic_users_status").on(table.status),
    createdAtIdx: index("idx_clinic_users_created_at").on(table.createdAt),
  })
);

export const clinicMemberships = pgTable(
  "clinic_memberships",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => clinicOrganizations.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => clinicUsers.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("manager"),
    status: text("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    orgUserUnique: uniqueIndex("uq_clinic_memberships_org_user").on(
      table.organizationId,
      table.userId
    ),
    orgIdx: index("idx_clinic_memberships_org").on(table.organizationId),
    userIdx: index("idx_clinic_memberships_user").on(table.userId),
    statusIdx: index("idx_clinic_memberships_status").on(table.status),
  })
);

export const providerOwnerships = pgTable(
  "provider_ownerships",
  {
    id: text("id").primaryKey(),
    providerId: text("provider_id")
      .notNull()
      .references(() => providers.id, { onDelete: "cascade" }),
    organizationId: text("organization_id")
      .notNull()
      .references(() => clinicOrganizations.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("active"),
    source: text("source").notNull().default("claim_approved"),
    claimRequestId: text("claim_request_id").references(() => claimRequests.id, {
      onDelete: "set null",
    }),
    approvedBy: text("approved_by"),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    providerOrgUnique: uniqueIndex("uq_provider_ownerships_provider_org").on(
      table.providerId,
      table.organizationId
    ),
    providerIdx: index("idx_provider_ownerships_provider").on(table.providerId),
    orgIdx: index("idx_provider_ownerships_org").on(table.organizationId),
    statusIdx: index("idx_provider_ownerships_status").on(table.status),
    claimIdx: index("idx_provider_ownerships_claim").on(table.claimRequestId),
  })
);

export const clinicInvites = pgTable(
  "clinic_invites",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => clinicOrganizations.id, { onDelete: "cascade" }),
    providerId: text("provider_id").references(() => providers.id, {
      onDelete: "cascade",
    }),
    email: text("email").notNull(),
    role: text("role").notNull().default("manager"),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdBy: text("created_by"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    tokenHashUnique: uniqueIndex("uq_clinic_invites_token_hash").on(table.tokenHash),
    orgIdx: index("idx_clinic_invites_org").on(table.organizationId),
    providerIdx: index("idx_clinic_invites_provider").on(table.providerId),
    emailIdx: index("idx_clinic_invites_email").on(table.email),
    expiresAtIdx: index("idx_clinic_invites_expires_at").on(table.expiresAt),
  })
);

export type ProviderPortalEditPayload = {
  phone?: string | null;
  phoneSecondary?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  website?: string | null;
  address?: string | null;
  shortDescription?: string | null;
  description?: string | null;
  services?: string[];
  insurance?: string[];
  languages?: string[];
  operatingHours?: Record<string, unknown> | null;
  logoUrl?: string | null;
  coverImageUrl?: string | null;
  photos?: string[];
};

export const providerEditRequests = pgTable(
  "provider_edit_requests",
  {
    id: text("id").primaryKey(),
    providerId: text("provider_id")
      .notNull()
      .references(() => providers.id, { onDelete: "cascade" }),
    organizationId: text("organization_id")
      .notNull()
      .references(() => clinicOrganizations.id, { onDelete: "cascade" }),
    requestedByUserId: text("requested_by_user_id").references(() => clinicUsers.id, {
      onDelete: "set null",
    }),
    status: text("status").notNull().default("pending"),
    payload: jsonb("payload").$type<ProviderPortalEditPayload>().notNull(),
    reviewedBy: text("reviewed_by"),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    rejectionReason: text("rejection_reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    providerIdx: index("idx_provider_edit_requests_provider").on(table.providerId),
    orgIdx: index("idx_provider_edit_requests_org").on(table.organizationId),
    userIdx: index("idx_provider_edit_requests_user").on(table.requestedByUserId),
    statusIdx: index("idx_provider_edit_requests_status").on(table.status),
    createdAtIdx: index("idx_provider_edit_requests_created_at").on(table.createdAt),
  })
);

export const providerPortalSessions = pgTable(
  "provider_portal_sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => clinicUsers.id, { onDelete: "cascade" }),
    organizationId: text("organization_id")
      .notNull()
      .references(() => clinicOrganizations.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    source: text("source").notNull().default("portal"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    tokenHashUnique: uniqueIndex("uq_provider_portal_sessions_token_hash").on(
      table.tokenHash
    ),
    userIdx: index("idx_provider_portal_sessions_user").on(table.userId),
    orgIdx: index("idx_provider_portal_sessions_org").on(table.organizationId),
    expiresAtIdx: index("idx_provider_portal_sessions_expires_at").on(table.expiresAt),
  })
);

export const providerPortalLoginTokens = pgTable(
  "provider_portal_login_tokens",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    tokenHash: text("token_hash").notNull(),
    source: text("source").notNull().default("magic_link"),
    redirectTo: text("redirect_to").notNull().default("/provider-portal"),
    providerId: text("provider_id").references(() => providers.id, {
      onDelete: "set null",
    }),
    organizationId: text("organization_id").references(() => clinicOrganizations.id, {
      onDelete: "cascade",
    }),
    inviteId: text("invite_id").references(() => clinicInvites.id, {
      onDelete: "set null",
    }),
    role: text("role").notNull().default("manager"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    tokenHashUnique: uniqueIndex("uq_provider_portal_login_tokens_hash").on(
      table.tokenHash
    ),
    emailIdx: index("idx_provider_portal_login_tokens_email").on(table.email),
    providerIdx: index("idx_provider_portal_login_tokens_provider").on(table.providerId),
    orgIdx: index("idx_provider_portal_login_tokens_org").on(table.organizationId),
    inviteIdx: index("idx_provider_portal_login_tokens_invite").on(table.inviteId),
    expiresAtIdx: index("idx_provider_portal_login_tokens_expires_at").on(table.expiresAt),
  })
);

export const providerPortalAuditLogs = pgTable(
  "provider_portal_audit_logs",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").references(() => clinicOrganizations.id, {
      onDelete: "set null",
    }),
    providerId: text("provider_id").references(() => providers.id, {
      onDelete: "set null",
    }),
    actorUserId: text("actor_user_id").references(() => clinicUsers.id, {
      onDelete: "set null",
    }),
    actorType: text("actor_type").notNull().default("clinic_user"),
    action: text("action").notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    orgIdx: index("idx_provider_portal_audit_logs_org").on(table.organizationId),
    providerIdx: index("idx_provider_portal_audit_logs_provider").on(table.providerId),
    actorIdx: index("idx_provider_portal_audit_logs_actor").on(table.actorUserId),
    actionIdx: index("idx_provider_portal_audit_logs_action").on(table.action),
    createdAtIdx: index("idx_provider_portal_audit_logs_created_at").on(table.createdAt),
  })
);

// ─── Consumer Accounts ───────────────────────────────────────────────────────

export const consumerUsers = pgTable(
  "consumer_users",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    name: text("name"),
    passwordHash: text("password_hash").notNull(),
    phone: text("phone"),
    preferredCitySlug: text("preferred_city_slug"),
    preferredInsurance: text("preferred_insurance"),
    marketingOptIn: boolean("marketing_opt_in").notNull().default(false),
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    emailUnique: uniqueIndex("uq_consumer_users_email").on(table.email),
    createdAtIdx: index("idx_consumer_users_created_at").on(table.createdAt),
  })
);

export const consumerPasswordResetTokens = pgTable(
  "consumer_password_reset_tokens",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => consumerUsers.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    tokenHashUnique: uniqueIndex("uq_consumer_reset_tokens_hash").on(table.tokenHash),
    userIdx: index("idx_consumer_reset_tokens_user").on(table.userId),
    expiresAtIdx: index("idx_consumer_reset_tokens_expires_at").on(table.expiresAt),
  })
);

export const consumerSavedProviders = pgTable(
  "consumer_saved_providers",
  {
    userId: text("user_id")
      .notNull()
      .references(() => consumerUsers.id, { onDelete: "cascade" }),
    providerId: text("provider_id")
      .notNull()
      .references(() => providers.id, { onDelete: "cascade" }),
    source: text("source"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.providerId] }),
    userIdx: index("idx_consumer_saved_providers_user").on(table.userId),
    providerIdx: index("idx_consumer_saved_providers_provider").on(table.providerId),
    createdAtIdx: index("idx_consumer_saved_providers_created_at").on(table.createdAt),
  })
);

export const consumerProviderEvents = pgTable(
  "consumer_provider_events",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").references(() => consumerUsers.id, { onDelete: "set null" }),
    providerId: text("provider_id").references(() => providers.id, { onDelete: "set null" }),
    entityType: text("entity_type").notNull().default("provider"),
    entitySlug: text("entity_slug"),
    entityName: text("entity_name"),
    action: text("action").notNull(),
    surface: text("surface").notNull(),
    pageUrl: text("page_url"),
    ctaLabel: text("cta_label"),
    anonymousId: text("anonymous_id"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdx: index("idx_consumer_provider_events_user").on(table.userId),
    providerIdx: index("idx_consumer_provider_events_provider").on(table.providerId),
    actionIdx: index("idx_consumer_provider_events_action").on(table.action),
    surfaceIdx: index("idx_consumer_provider_events_surface").on(table.surface),
    createdAtIdx: index("idx_consumer_provider_events_created_at").on(table.createdAt),
  })
);

// ─── Journal Articles ─────────────────────────────────────────────────────────

export type ArticleCitation = {
  id?: string;
  label: string;
  url: string;
  publisher?: string;
  doi?: string;
  pubmedId?: string;
  accessedAt?: string;
};

export const journalArticles = pgTable(
  "journal_articles",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    excerpt: text("excerpt").notNull(),
    body: text("body").notNull(),
    category: text("category").notNull(),
    tags: jsonb("tags").$type<string[]>().default([]),
    source: text("source").notNull().default("original"),
    sourceUrl: text("source_url"),
    sourceName: text("source_name"),
    authorName: text("author_name").notNull().default("Journal Staff"),
    authorRole: text("author_role"),
    imageUrl: text("image_url"),
    imageCaption: text("image_caption"),
    isFeatured: boolean("is_featured").default(false),
    isBreaking: boolean("is_breaking").default(false),
    readTimeMinutes: integer("read_time_minutes").notNull().default(3),
    status: text("status").notNull().default("published"), // draft | published | archived
    publishedAt: timestamp("published_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    // ─── Item 5 additive columns (E-E-A-T leapfrog) ──────────────────────────
    // Matches `scripts/db/migrations/2026-04-11-authors-reviewers.sql`.
    // author_slug / reviewer_slug are soft refs to authors.slug / reviewers.slug
    // — not FKs, because legacy rows have no byline. The renderer looks up the
    // full profile when present and falls back to authorName/authorRole when
    // author_slug is null. is_clinical gates MedicalWebPage schema emission;
    // last_reviewed_at feeds the honest `dateModified` signal.
    authorSlug: text("author_slug"),
    reviewerSlug: text("reviewer_slug"),
    // Mirror of reviewers.reviewer_type for fast filtering without a join.
    reviewerType: text("reviewer_type"),
    lastReviewedAt: timestamp("last_reviewed_at", { withTimezone: true }),
    isClinical: boolean("is_clinical").notNull().default(false),
    citations: jsonb("citations").$type<ArticleCitation[]>().notNull().default([]),
  },
  (table) => ({
    slugUnique: uniqueIndex("uq_journal_slug").on(table.slug),
    categoryIdx: index("idx_journal_category").on(table.category),
    statusIdx: index("idx_journal_status").on(table.status),
    publishedIdx: index("idx_journal_published").on(table.publishedAt),
    featuredIdx: index("idx_journal_featured").on(table.isFeatured),
    authorSlugIdx: index("idx_journal_author_slug").on(table.authorSlug),
    reviewerSlugIdx: index("idx_journal_reviewer_slug").on(table.reviewerSlug),
    isClinicalIdx: index("idx_journal_is_clinical").on(table.isClinical),
  })
);

// ─── Authors & Reviewers (additive — Item 5 E-E-A-T leapfrog) ────────────────
//
// Matches `scripts/db/migrations/2026-04-11-authors-reviewers.sql`. These tables
// back the new `/intelligence/author/[slug]`, `/intelligence/reviewer/[slug]`
// and `/intelligence/author/` masthead routes, plus the `MedicalWebPage` +
// `reviewedBy` schema stack on clinical Intelligence articles.
//
// Design notes:
// - `authors` and `reviewers` are deliberately separate. Authors are Zavis
//   editorial staff; reviewers are external medical/policy/economic experts
//   who validate clinical or regulatory claims. Conflating the two blurs the
//   trust boundary that `MedicalWebPage.reviewedBy` relies on.
// - Both tables have `is_active` — the seed script lands every placeholder
//   reviewer as `is_active = false` so no unbacked "Medically reviewed by
//   Dr. TBD" byline can leak to production until a real assignment is made.
// - `photo_consent` must be checked before rendering `photo_url`; the profile
//   renderer falls back to an initials avatar when false.
// - Licence number columns are NULLable and only populated with explicit
//   reviewer consent — they feed `schema.org/identifier` on the Person JSON-LD.

export type AuthorCredential = {
  label: string;
  issuer?: string;
  year?: number;
};

export const authors = pgTable(
  "authors",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    nameAr: text("name_ar"),
    role: text("role").notNull(),
    roleAr: text("role_ar"),
    bio: text("bio").notNull(),
    bioAr: text("bio_ar"),
    photoUrl: text("photo_url"),
    photoConsent: boolean("photo_consent").notNull().default(false),
    email: text("email"),
    linkedinUrl: text("linkedin_url"),
    twitterUrl: text("twitter_url"),
    websiteUrl: text("website_url"),
    orcidId: text("orcid_id"),
    credentials: jsonb("credentials")
      .$type<AuthorCredential[]>()
      .notNull()
      .default([]),
    expertise: jsonb("expertise").$type<string[]>().notNull().default([]),
    articlesCount: integer("articles_count").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    joinedAt: date("joined_at"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    isActiveIdx: index("idx_authors_is_active").on(table.isActive),
    activeSlugIdx: index("idx_authors_active_slug").on(table.isActive, table.slug),
  })
);

export const reviewers = pgTable(
  "reviewers",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    nameAr: text("name_ar"),
    title: text("title").notNull(),
    titleAr: text("title_ar"),
    institution: text("institution"),
    bio: text("bio").notNull(),
    bioAr: text("bio_ar"),
    photoUrl: text("photo_url"),
    photoConsent: boolean("photo_consent").notNull().default(false),
    linkedinUrl: text("linkedin_url"),
    orcidId: text("orcid_id"),
    dhaLicenseNumber: text("dha_license_number"),
    dohLicenseNumber: text("doh_license_number"),
    mohapLicenseNumber: text("mohap_license_number"),
    specialty: text("specialty"),
    specialtyAr: text("specialty_ar"),
    // 'medical' | 'industry' | 'policy' | 'economic' | 'actuarial'
    reviewerType: text("reviewer_type").notNull(),
    expertise: jsonb("expertise").$type<string[]>().notNull().default([]),
    reviewsCount: integer("reviews_count").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    joinedAt: date("joined_at"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    isActiveIdx: index("idx_reviewers_is_active").on(table.isActive),
    typeIdx: index("idx_reviewers_type").on(table.reviewerType),
    activeTypeIdx: index("idx_reviewers_active_type").on(
      table.isActive,
      table.reviewerType
    ),
  })
);

// ─── Journal Newsletter Subscribers ───────────────────────────────────────────

export const journalSubscribers = pgTable(
  "journal_subscribers",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    subscribedAt: timestamp("subscribed_at", { withTimezone: true }).notNull().defaultNow(),
    unsubscribedAt: timestamp("unsubscribed_at", { withTimezone: true }),
    status: text("status").notNull().default("active"), // active | unsubscribed
  },
  (table) => ({
    emailUnique: uniqueIndex("uq_journal_subscribers_email").on(table.email),
    statusIdx: index("idx_journal_subscribers_status").on(table.status),
  })
);

// ─── Insurance plans (additive — Item 1 insurance-facet layer) ────────────────
//
// Matches `scripts/db/migrations/2026-04-11-insurance-plans.sql`. The
// application currently still reads insurance acceptance from the
// `providers.insurance` jsonb column; these tables are staged for a
// future backfill once `provider_insurance_acceptance` is seeded by
// `scripts/seed-insurance-plans.mjs`.

export const insurancePlans = pgTable(
  "insurance_plans",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    nameEn: text("name_en").notNull(),
    nameAr: text("name_ar"),
    // "carrier" | "TPA" | "gov"
    type: text("type").notNull(),
    // "uae" | "abu-dhabi" | "dubai" | "sharjah" | "northern-emirates"
    geoScope: text("geo_scope").notNull().default("uae"),
    isDental: boolean("is_dental").notNull().default(false),
    isMedical: boolean("is_medical").notNull().default(true),
    parentPlanId: integer("parent_plan_id"),
    logoUrl: text("logo_url"),
    editorialCopyEn: text("editorial_copy_en"),
    editorialCopyAr: text("editorial_copy_ar"),
    website: text("website"),
    foundedYear: integer("founded_year"),
    // Postgres TEXT[] — e.g. ['DHA','DOH','MOHAP']
    regulatorCodes: text("regulator_codes").array(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    geoScopeIdx: index("idx_insurance_plans_geo_scope").on(table.geoScope),
    typeIdx: index("idx_insurance_plans_type").on(table.type),
    parentIdx: index("idx_insurance_plans_parent").on(table.parentPlanId),
  })
);

export const providerInsuranceAcceptance = pgTable(
  "provider_insurance_acceptance",
  {
    providerId: text("provider_id")
      .notNull()
      .references(() => providers.id, { onDelete: "cascade" }),
    planId: integer("plan_id")
      .notNull()
      .references(() => insurancePlans.id, { onDelete: "cascade" }),
    // 'legacy_jsonb' | 'daman_network_scrape' | 'thiqa_network_scrape' |
    // 'provider_self_declared' | 'manual_verify'
    source: text("source").notNull().default("legacy_jsonb"),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.providerId, table.planId] }),
    planIdx: index("idx_pia_plan").on(table.planId),
    sourceIdx: index("idx_pia_source").on(table.source),
    verifiedIdx: index("idx_pia_verified").on(table.verifiedAt),
  })
);

// ─── Professionals Index (additive — Item 0.75 doctor pages layer) ───────────
//
// Matches `scripts/db/migrations/2026-04-11-professionals-index.sql`. Populated
// by `scripts/build-professionals-index.mjs` from the DHA Sheryan JSON dataset.
// Backs the `/find-a-doctor/[specialty]/[doctor]-[id]` route class. The legacy
// JSON-backed `src/lib/professionals.ts` module stays untouched; new async
// helpers in that same module read from this table.

export const professionalsIndex = pgTable(
  "professionals_index",
  {
    id: serial("id").primaryKey(),
    dhaUniqueId: text("dha_unique_id").notNull().unique(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    nameAr: text("name_ar"),
    displayTitle: text("display_title").notNull(),
    // physician | dentist | nurse | pharmacist | allied-health | other
    discipline: text("discipline").notNull(),
    // specialist | consultant | general-practitioner | intern | resident | ...
    level: text("level").notNull(),
    specialty: text("specialty").notNull(),
    specialtySlug: text("specialty_slug").notNull(),
    // Maps to existing Zavis directory category slug (e.g. dental-clinic).
    categorySlug: text("category_slug"),
    primaryFacilityName: text("primary_facility_name"),
    // Soft ref to providers.slug — NOT a FK on purpose. Match rate <100%.
    primaryFacilitySlug: text("primary_facility_slug"),
    primaryCitySlug: text("primary_city_slug"),
    // REG | FTL
    licenseType: text("license_type").notNull(),
    licenseCount: integer("license_count").notNull().default(1),
    // Populated later by image scraper. UI MUST check photoConsent before rendering.
    photoUrl: text("photo_url"),
    photoConsent: boolean("photo_consent").notNull().default(false),
    // Education institution name (cleaned from DHA register).
    education: text("education"),
    // AI-generated one-liner about the institution (e.g. "Top-ranked
    // medical school in Syria, founded 1903."). NULL when the
    // institution is unknown or too generic to describe.
    educationDescription: text("education_description"),
    searchTerms: jsonb("search_terms").$type<string[]>().notNull().default([]),
    relatedConditions: jsonb("related_conditions").$type<string[]>().notNull().default([]),
    dataSource: text("data_source").notNull().default("dha"),
    // active | inactive
    status: text("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    specialtySlugIdx: index("idx_professionals_specialty_slug").on(table.specialtySlug),
    primaryCityIdx: index("idx_professionals_primary_city").on(table.primaryCitySlug),
    disciplineIdx: index("idx_professionals_discipline").on(table.discipline),
    facilityIdx: index("idx_professionals_facility").on(table.primaryFacilitySlug),
    statusIdx: index("idx_professionals_status").on(table.status),
    disciplineStatusIdx: index("idx_professionals_discipline_status").on(
      table.discipline,
      table.status
    ),
  })
);

// ─── Reports (additive — Item 6 "What UAE Patients Want" report scaffold) ───
//
// Matches `scripts/db/migrations/2026-04-11-reports.sql`. Backs the new
// `/intelligence/reports/` + `/intelligence/reports/[slug]/` route class and
// the press kit page at `/intelligence/press/`. Lifecycle is separate from
// `journalArticles` — reports are long-form, data-led, PDF-backed tentpoles
// pitched to press, not weekly news posts.
//
// The `chart_data` + `sections` jsonb payloads are pre-computed by the
// editorial team so the page renderer can swap in real charts later
// without another migration. `status` gates sitemap + public visibility:
// only `published` rows appear on the hub page and in the sitemap.

export type ReportChart = {
  id: string;
  title: string;
  titleAr?: string;
  type: "bar" | "line" | "donut" | "map" | "scatter" | "table";
  caption?: string;
  captionAr?: string;
  source?: string;
  // Arbitrary shape — the chart renderer decides how to consume this.
  data: unknown;
};

export type ReportSection = {
  id: string;
  title: string;
  titleAr?: string;
  anchor: string;
  summary?: string;
};

export const reports = pgTable(
  "reports",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    titleAr: text("title_ar"),
    subtitle: text("subtitle"),
    subtitleAr: text("subtitle_ar"),
    headlineStat: text("headline_stat").notNull(),
    headlineStatAr: text("headline_stat_ar"),
    coverImageUrl: text("cover_image_url"),
    pdfUrl: text("pdf_url"),
    releaseDate: date("release_date").notNull(),
    methodology: text("methodology").notNull(),
    methodologyAr: text("methodology_ar"),
    dataSource: text("data_source").notNull(),
    sampleSize: text("sample_size"),
    bodyMd: text("body_md").notNull(),
    bodyMdAr: text("body_md_ar"),
    chartData: jsonb("chart_data").$type<ReportChart[]>().notNull().default([]),
    sections: jsonb("sections").$type<ReportSection[]>().notNull().default([]),
    pressReleaseUrl: text("press_release_url"),
    embargoDate: date("embargo_date"),
    // 'draft' | 'scheduled' | 'published' | 'archived'
    status: text("status").notNull().default("draft"),
    featured: boolean("featured").notNull().default(false),
    viewCount: integer("view_count").notNull().default(0),
    downloadCount: integer("download_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    statusIdx: index("idx_reports_status").on(table.status),
    releaseDateIdx: index("idx_reports_release_date").on(table.releaseDate),
    featuredIdx: index("idx_reports_featured").on(table.featured),
    statusReleaseIdx: index("idx_reports_status_release").on(
      table.status,
      table.releaseDate
    ),
  })
);

// Join table linking reports to author slugs. `authorSlug` is intentionally
// NOT a FK — Item 5 will create the canonical `authors` table, and a later
// migration will convert this into a real FK at that time. For now it is a
// plain TEXT column that the report page uses to link out to
// `/intelligence/author/[slug]` once Item 5 ships (the links render as a
// byline-only fallback until then).
export const reportAuthors = pgTable(
  "report_authors",
  {
    reportId: integer("report_id")
      .notNull()
      .references(() => reports.id, { onDelete: "cascade" }),
    authorSlug: text("author_slug").notNull(),
    // 'author' | 'editor' | 'reviewer' | 'data'
    role: text("role").notNull().default("author"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.reportId, table.authorSlug] }),
    authorSlugIdx: index("idx_report_authors_slug").on(table.authorSlug),
    roleIdx: index("idx_report_authors_role").on(table.role),
  })
);

// ─── FAQs ──────────────────────────────────────────────────────────────────────

// entityId is polymorphic — references cities, categories, or providers depending
// on entityType ("city" | "category" | "provider"). A foreign key constraint is
// intentionally omitted because no single FK can cover all three target tables.
// Referential integrity is enforced at the application layer in seed.ts and data.ts.
// ─── Medications (Phase 1 of medication-pharmacy intent graph) ────────────────
//
// Implements § 5–6 and § 14 of
// docs/playbooks/medication-pharmacy-intent-graph-execution-spec.md.
//
// Three tables:
//   - medicationClasses: therapeutic groupings (e.g. "Antidiabetics")
//   - medications: canonical generic-drug entities
//   - medicationBrands: brand aliases (may self-canonicalize or point to generic)
//
// The generic medication page is the default canonical. Brand pages
// self-canonicalize only when they have meaningful independent search demand
// (see the isCanonicalBrand flag). Pharmacy capability flags live on the
// existing providers table via ALTER TABLE (Phase 1b).

export const medicationClasses = pgTable(
  "medication_classes",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    nameAr: text("name_ar"),
    description: text("description"),
    // e.g. "Medications that lower blood sugar levels"
    shortDescription: text("short_description"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  }
);

export const medications = pgTable(
  "medications",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    genericName: text("generic_name").notNull(),
    genericNameAr: text("generic_name_ar"),
    // FK to medication_classes — soft ref by slug, not integer FK
    classSlug: text("class_slug"),
    // "prescription" | "otc" | "controlled"
    rxStatus: text("rx_status").notNull().default("prescription"),
    // One-paragraph clinical summary (AI-generated, reviewed)
    description: text("description"),
    shortDescription: text("short_description"),
    // Structured fields from spec § 14
    commonConditions: jsonb("common_conditions").$type<string[]>().notNull().default([]),
    commonSpecialties: jsonb("common_specialties").$type<string[]>().notNull().default([]),
    // e.g. ["HbA1c every 3 months", "kidney function annually"]
    labMonitoringNotes: jsonb("lab_monitoring_notes").$type<string[]>().notNull().default([]),
    genericSubstitutionNote: text("generic_substitution_note"),
    insurerNote: text("insurer_note"),
    // Capability flags from spec § 5.3
    isPrescriptionRequired: boolean("is_prescription_required").notNull().default(true),
    hasGenericEquivalent: boolean("has_generic_equivalent").notNull().default(false),
    requiresMonitoringLabs: boolean("requires_monitoring_labs").notNull().default(false),
    isHighIntent: boolean("is_high_intent").notNull().default(false),
    isCitySensitive: boolean("is_city_sensitive").notNull().default(false),
    // Gating — from spec § 7 page-state model
    // "canonical" | "secondary" | "not-generated"
    pageState: text("page_state").notNull().default("canonical"),
    status: text("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    classSlugIdx: index("idx_medications_class_slug").on(table.classSlug),
    statusIdx: index("idx_medications_status").on(table.status),
    highIntentIdx: index("idx_medications_high_intent").on(table.isHighIntent),
  })
);

export const medicationBrands = pgTable(
  "medication_brands",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    brandName: text("brand_name").notNull(),
    brandNameAr: text("brand_name_ar"),
    // FK to medications — soft ref by slug
    genericSlug: text("generic_slug").notNull(),
    // Brand-specific fields
    manufacturer: text("manufacturer"),
    description: text("description"),
    shortDescription: text("short_description"),
    // True → brand page self-canonicalizes (e.g. Ozempic, Panadol).
    // False → brand page canonicalizes to the generic page.
    isCanonicalBrand: boolean("is_canonical_brand").notNull().default(false),
    isHighIntent: boolean("is_high_intent").notNull().default(false),
    // Gating
    pageState: text("page_state").notNull().default("canonical"),
    status: text("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    genericSlugIdx: index("idx_brands_generic_slug").on(table.genericSlug),
    statusIdx: index("idx_brands_status").on(table.status),
  })
);

// ─── FAQs ─────────────────────────────────────────────────────────────────────

export const faqs = pgTable(
  "faqs",
  {
    id: text("id").primaryKey(),
    entityType: text("entity_type").notNull(), // "city" | "category" | "provider"
    entityId: text("entity_id").notNull(),
    question: text("question").notNull(),
    answer: text("answer").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    entityIdx: index("idx_faqs_entity").on(table.entityType, table.entityId),
  })
);

// ─── Admin Change Log ─────────────────────────────────────────────────────
//
// Tracks every edit made through the admin dashboard. Stores the before/after
// values as JSONB so we can diff and audit. Never deleted.

export const adminChanges = pgTable(
  "admin_changes",
  {
    id: serial("id").primaryKey(),
    // "provider" | "medication" | "brand" | "professional" | "medication_class"
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    entityName: text("entity_name"),
    // Which field(s) changed
    fieldName: text("field_name").notNull(),
    oldValue: jsonb("old_value"),
    newValue: jsonb("new_value"),
    // Who made the change (email or "admin" for key-based auth)
    changedBy: text("changed_by").notNull().default("admin"),
    reason: text("reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    entityIdx: index("idx_admin_changes_entity").on(table.entityType, table.entityId),
    createdIdx: index("idx_admin_changes_created").on(table.createdAt),
  })
);

// Tracks every slug a provider has ever had. When a provider's slug changes
// (rename, admin edit, marketing-friendly short URL), the old slug is archived
// here. Lookups on a missing slug consult this table and 301 to the canonical
// provider URL — predictable, no fuzzy matching, search-engine safe.
export const providerSlugHistory = pgTable(
  "provider_slug_history",
  {
    oldSlug: text("old_slug").primaryKey(),
    providerId: text("provider_id").notNull(),
    citySlug: text("city_slug"),
    archivedAt: timestamp("archived_at", { withTimezone: true }).notNull().defaultNow(),
    reason: text("reason"),
  },
  (table) => ({
    providerIdx: index("idx_provider_slug_history_provider").on(table.providerId),
  })
);

// ===========================================================================
// Open Healthcare Jobs by Zavis — schema for the third user-type marketplace.
// ===========================================================================

export const candidateUsers = pgTable(
  "candidate_users",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    name: text("name"),
    passwordHash: text("password_hash"),
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    marketingOptIn: boolean("marketing_opt_in").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    emailUnique: uniqueIndex("uq_candidate_users_email").on(table.email),
    createdAtIdx: index("idx_candidate_users_created_at").on(table.createdAt),
  })
);

export const candidateProfiles = pgTable(
  "candidate_profiles",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .unique()
      .references(() => candidateUsers.id, { onDelete: "cascade" }),
    role: text("role").notNull(), // role family — see DISCIPLINES taxonomy
    disciplineSlug: text("discipline_slug"),
    specialtySlug: text("specialty_slug"),
    subspecialtySlug: text("subspecialty_slug"),
    experienceYears: integer("experience_years"),
    currentEmployerOptional: text("current_employer_optional"),
    licenseStatus: text("license_status"), // 'dha'|'doh'|'mohap'|'dataflow_pending'|'outside_uae'|'none'
    licenseNumberOptional: text("license_number_optional"),
    preferredCitySlugs: text("preferred_city_slugs").array(),
    currentCitySlug: text("current_city_slug"),
    willingToRelocate: boolean("willing_to_relocate").default(false),
    visaStatus: text("visa_status"), // 'citizen'|'residence'|'needs_sponsorship'
    salaryExpectationMinAed: integer("salary_expectation_min_aed"),
    salaryExpectationMaxAed: integer("salary_expectation_max_aed"),
    employmentTypePref: text("employment_type_pref").array(),
    bioMd: text("bio_md"),
    cvUrl: text("cv_url"),
    cvUploadedAt: timestamp("cv_uploaded_at", { withTimezone: true }),
    photoUrl: text("photo_url"),
    languages: text("languages").array(),
    availability: text("availability").default("open"),
    visibility: text("visibility").notNull().default("limited"),
    profileCompleteness: integer("profile_completeness").notNull().default(0),
    notifyEmail: boolean("notify_email").notNull().default(true),
    notifyWhatsapp: boolean("notify_whatsapp").notNull().default(false),
    whatsappNumber: text("whatsapp_number"),
    consentTermsAt: timestamp("consent_terms_at", { withTimezone: true }).notNull(),
    consentTermsVersion: text("consent_terms_version").notNull(),
    consentDataProcessingAt: timestamp("consent_data_processing_at", { withTimezone: true }).notNull(),
    consentRecruiterVisibilityAt: timestamp("consent_recruiter_visibility_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    specialtyCityIdx: index("idx_candidate_profiles_specialty_city").on(table.specialtySlug, table.currentCitySlug),
    disciplineCityIdx: index("idx_candidate_profiles_discipline_city").on(table.disciplineSlug, table.currentCitySlug),
    visibilityIdx: index("idx_candidate_profiles_visibility").on(table.visibility, table.availability),
  })
);

export const jobs = pgTable(
  "jobs",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    titleAr: text("title_ar"),
    clinicId: text("clinic_id"),
    externalClinicName: text("external_clinic_name"),
    externalClinicUrl: text("external_clinic_url"),
    citySlug: text("city_slug").notNull(),
    role: text("role"), // role family — see DISCIPLINES taxonomy
    disciplineSlug: text("discipline_slug"),
    specialtySlug: text("specialty_slug").notNull(),
    subspecialtySlug: text("subspecialty_slug"),
    seniority: text("seniority"),
    employmentType: text("employment_type"),
    descriptionMd: text("description_md").notNull(),
    requirementsMd: text("requirements_md"),
    benefitsMd: text("benefits_md"),
    licenseRequired: text("license_required"),
    dataflowRequired: boolean("dataflow_required"),
    visaSponsorship: boolean("visa_sponsorship"),
    salaryMinAed: integer("salary_min_aed"),
    salaryMaxAed: integer("salary_max_aed"),
    salaryDisclosed: boolean("salary_disclosed").default(false),
    applicationDeadline: timestamp("application_deadline", { withTimezone: true }),
    postedAt: timestamp("posted_at", { withTimezone: true }).notNull().defaultNow(),
    closingAt: timestamp("closing_at", { withTimezone: true }),
    status: text("status").notNull().default("draft"),
    source: text("source").notNull().default("zavis_curated"),
    postedByClinicUserId: text("posted_by_clinic_user_id"),
    viewCount: integer("view_count").notNull().default(0),
    applicationCount: integer("application_count").notNull().default(0),
    savedCount: integer("saved_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    statusPostedIdx: index("idx_jobs_status_posted").on(table.status, table.postedAt),
    cityCatIdx: index("idx_jobs_city_specialty").on(table.citySlug, table.specialtySlug, table.status),
    cityDisciplineIdx: index("idx_jobs_city_discipline").on(table.citySlug, table.disciplineSlug, table.status),
    disciplineIdx: index("idx_jobs_discipline").on(table.disciplineSlug, table.status),
    clinicIdx: index("idx_jobs_clinic").on(table.clinicId),
  })
);

export const jobApplications = pgTable(
  "job_applications",
  {
    id: text("id").primaryKey(),
    jobId: text("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),
    candidateUserId: text("candidate_user_id")
      .notNull()
      .references(() => candidateUsers.id, { onDelete: "cascade" }),
    candidateProfileId: text("candidate_profile_id").references(() => candidateProfiles.id),
    coverNoteMd: text("cover_note_md"),
    cvUrlAtApply: text("cv_url_at_apply"),
    status: text("status").notNull().default("submitted"),
    statusUpdatedAt: timestamp("status_updated_at", { withTimezone: true }),
    statusUpdatedByClinicUserId: text("status_updated_by_clinic_user_id"),
    candidateVisibleStatus: text("candidate_visible_status"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    jobCandidateUnique: uniqueIndex("uq_job_applications_job_candidate").on(table.jobId, table.candidateUserId),
    candidateIdx: index("idx_job_applications_candidate").on(table.candidateUserId, table.createdAt),
    jobIdx: index("idx_job_applications_job").on(table.jobId, table.status),
  })
);

export const profileInterestEvents = pgTable(
  "profile_interest_events",
  {
    id: text("id").primaryKey(),
    candidateProfileId: text("candidate_profile_id")
      .notNull()
      .references(() => candidateProfiles.id, { onDelete: "cascade" }),
    recruiterClinicId: text("recruiter_clinic_id"),
    recruiterClinicUserId: text("recruiter_clinic_user_id"),
    source: text("source").notNull(),
    jobId: text("job_id").references(() => jobs.id),
    messageMd: text("message_md"),
    notifiedCandidateAt: timestamp("notified_candidate_at", { withTimezone: true }),
    candidateRespondedAt: timestamp("candidate_responded_at", { withTimezone: true }),
    candidateResponse: text("candidate_response"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    candidateIdx: index("idx_profile_interest_candidate").on(table.candidateProfileId, table.createdAt),
  })
);

export const candidateSavedJobs = pgTable(
  "candidate_saved_jobs",
  {
    id: text("id").primaryKey(),
    candidateUserId: text("candidate_user_id")
      .notNull()
      .references(() => candidateUsers.id, { onDelete: "cascade" }),
    jobId: text("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),
    source: text("source"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userJobUnique: uniqueIndex("uq_candidate_saved_jobs_user_job").on(table.candidateUserId, table.jobId),
  })
);

export const jobAlertSubscriptions = pgTable(
  "job_alert_subscriptions",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    candidateUserId: text("candidate_user_id").references(() => candidateUsers.id),
    citySlugs: text("city_slugs").array(),
    specialtySlugs: text("specialty_slugs").array(),
    seniority: text("seniority").array(),
    frequency: text("frequency").notNull().default("weekly"),
    consentPdplAt: timestamp("consent_pdpl_at", { withTimezone: true }).notNull().defaultNow(),
    unsubscribeToken: text("unsubscribe_token").notNull().unique(),
    unsubscribedAt: timestamp("unsubscribed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  }
);

export const candidateNotifications = pgTable(
  "candidate_notifications",
  {
    id: text("id").primaryKey(),
    candidateUserId: text("candidate_user_id")
      .notNull()
      .references(() => candidateUsers.id, { onDelete: "cascade" }),
    channel: text("channel").notNull(),
    type: text("type").notNull(),
    payload: jsonb("payload"),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdx: index("idx_candidate_notifications_user").on(table.candidateUserId, table.createdAt),
  })
);

export const jobCandidateInterests = pgTable(
  "job_candidate_interests",
  {
    id: text("id").primaryKey(),
    jobId: text("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),
    candidateProfileId: text("candidate_profile_id")
      .notNull()
      .references(() => candidateProfiles.id, { onDelete: "cascade" }),
    source: text("source"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    jobCandidateUnique: uniqueIndex("uq_job_candidate_interests_job_candidate").on(table.jobId, table.candidateProfileId),
  })
);
