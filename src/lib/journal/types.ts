export type JournalCategory =
  | "regulatory"
  | "new-openings"
  | "financial"
  | "events"
  | "social-pulse"
  | "thought-leadership"
  | "market-intelligence"
  | "technology"
  | "workforce";

export type ContentSource =
  | "original"
  | "aggregated"
  | "social-media"
  | "press-release"
  | "government";

export interface JournalArticle {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string; // HTML content
  category: JournalCategory;
  tags: string[];
  source: ContentSource;
  sourceUrl?: string;
  sourceName?: string;
  author: {
    name: string;
    role?: string;
    avatarUrl?: string;
  };
  publishedAt: string; // ISO 8601
  updatedAt?: string;
  imageUrl?: string;
  imageCaption?: string;
  isFeatured: boolean;
  isBreaking: boolean;
  readTimeMinutes: number;
}

export interface JournalCategoryMeta {
  slug: JournalCategory;
  name: string;
  description: string;
  icon: string; // emoji or symbol
}

export interface JournalEvent {
  id: string;
  name: string;
  date: string; // ISO 8601
  endDate?: string;
  location: string;
  url?: string;
  description: string;
  tags: string[];
}

export interface SocialPost {
  id: string;
  platform: "linkedin" | "x" | "instagram";
  author: string;
  authorHandle: string;
  content: string;
  publishedAt: string;
  url?: string;
  engagement: {
    likes: number;
    comments: number;
    shares: number;
  };
}
