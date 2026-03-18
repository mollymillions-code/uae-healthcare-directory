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
    subcategoryId: text("subcategory_id").references(() => subcategories.id),

    // Location
    cityId: text("city_id")
      .notNull()
      .references(() => cities.id),
    areaId: text("area_id").references(() => areas.id),
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
    shortDescription: text("short_description"),
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
    photos: jsonb("photos").$type<string[]>().default([]),

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
      .references(() => providers.id),

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

// ─── FAQs ──────────────────────────────────────────────────────────────────────

export const faqs = pgTable(
  "faqs",
  {
    id: text("id").primaryKey(),
    entityType: text("entity_type").notNull(),
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
