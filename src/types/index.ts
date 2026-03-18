import type { InferSelectModel } from "drizzle-orm";
import type {
  cities,
  areas,
  categories,
  subcategories,
  providers,
  providerCategories,
  googleReviews,
  claimRequests,
  faqs,
} from "@/lib/db/schema";

export type City = InferSelectModel<typeof cities>;
export type Area = InferSelectModel<typeof areas>;
export type Category = InferSelectModel<typeof categories>;
export type Subcategory = InferSelectModel<typeof subcategories>;
export type Provider = InferSelectModel<typeof providers>;
export type ProviderCategory = InferSelectModel<typeof providerCategories>;
export type GoogleReview = InferSelectModel<typeof googleReviews>;
export type ClaimRequest = InferSelectModel<typeof claimRequests>;
export type FAQ = InferSelectModel<typeof faqs>;

export interface ProviderWithRelations extends Provider {
  city: City;
  area: Area | null;
  category: Category;
  subcategory: Subcategory | null;
  reviews: GoogleReview[];
}

export interface SearchParams {
  q?: string;
  city?: string;
  category?: string;
  subcategory?: string;
  area?: string;
  lat?: number;
  lng?: number;
  radius?: number;
  rating?: number;
  insurance?: string;
  page?: number;
  limit?: number;
  sort?: "relevance" | "rating" | "distance" | "name";
}

export interface SearchResult {
  providers: Provider[];
  total: number;
  page: number;
  totalPages: number;
}
