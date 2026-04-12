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
