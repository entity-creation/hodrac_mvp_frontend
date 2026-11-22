// Blog (GET /api/blog…). Times are UTC ISO strings.

export interface BlogTag { key: string; name: string }
export interface BlogPlace { id: string; name: string }

export interface BlogDestinationCard {
  id: string;
  name: string;
  city: string | null;
  country: string;
  heroImageUrl: string | null;
  shortDescription: string | null;
}

export interface BlogWishlistCard {
  id: string;
  name: string;
  totalDays: number;
  basePricePerPerson: number; // USD, like other wishlist prices
  heroImage: string | null;
}

export interface BlogEventCard {
  id: string;
  slug: string;
  name: string;
  startsAt: string;
  endsAt: string | null;
  timeZone: string; // IANA, for showing local times
  venueName: string | null;
  city: string;
  isFree: boolean;
  imageUrl: string | null;
}

// One {{type:ref}} marker in the body, resolved by the API.
export interface BlogEmbed {
  marker: string;
  type: "destination" | "wishlist" | "event" | string;
  ref: string;
  found: boolean;
  destination: BlogDestinationCard | null;
  wishlist: BlogWishlistCard | null;
  event: BlogEventCard | null;
}

export interface BlogPostSummary {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImageUrl: string | null;
  coverImageAlt: string | null;
  authorName: string | null;
  publishedAt: string | null;
  updatedAt: string;
  readingTimeMinutes: number;
  tags: BlogTag[];
  city: BlogPlace | null;
  country: BlogPlace | null;
}

export interface BlogPost extends BlogPostSummary {
  bodyMarkdown: string;
  metaTitle: string;        // falls back to the title
  metaDescription: string;  // falls back to the excerpt
  canonicalUrl: string | null;
  destinations: BlogDestinationCard[];
  wishlists: BlogWishlistCard[];
  events: BlogEventCard[];
  embeds: BlogEmbed[];
  relatedPosts: BlogPostSummary[];
}

export interface BlogPaged<T> { page: number; pageSize: number; totalCount: number; totalPages: number; items: T[] }

export interface BlogTagCount { key: string; name: string; postCount: number }

export interface BlogSitemapEntry { slug: string; updatedAt: string; publishedAt: string | null }

export interface BlogListQuery {
  tag?: string;
  cityId?: string;
  countryId?: string;
  destinationId?: string;
  wishlistId?: string;
  eventId?: string;
  search?: string;
  page?: number;
  pageSize?: number; // max 50
}
