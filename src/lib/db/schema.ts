import {
  pgTable,
  text,
  integer,
  numeric,
  boolean,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
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
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    cityIdx: index("idx_areas_city").on(table.cityId),
    citySlugUnique: uniqueIndex("uq_areas_city_slug").on(
      table.cityId,
      table.slug
    ),
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
  },
  (table) => ({
    slugUnique: uniqueIndex("uq_journal_slug").on(table.slug),
    categoryIdx: index("idx_journal_category").on(table.category),
    statusIdx: index("idx_journal_status").on(table.status),
    publishedIdx: index("idx_journal_published").on(table.publishedAt),
    featuredIdx: index("idx_journal_featured").on(table.isFeatured),
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
