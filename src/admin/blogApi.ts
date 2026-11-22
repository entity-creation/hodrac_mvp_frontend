// Admin blog endpoints (/api/admin/blog). Errors: 400 { errors: { Field: [msg] } }.
import { http } from "../dataStore/v2Api/client";
import type { AdminPaged } from "./api";
import type {
  BlogDestinationCard, BlogEmbed, BlogEventCard, BlogPlace, BlogTag, BlogWishlistCard,
} from "../types/blog";

const A = "/api/admin/blog";

function qs(params: Record<string, unknown>): string {
  const q = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join("&");
  return q ? `?${q}` : "";
}

export const BLOG_STATUSES = ["Draft", "Scheduled", "Published"] as const;
export type BlogStatus = (typeof BLOG_STATUSES)[number];
export const blogStatusTone = (s: BlogStatus) => (s === "Published" ? "good" : s === "Scheduled" ? "info" : "neutral");

export interface AdminBlogPostSummary {
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
  status: BlogStatus;
  createdAt: string;
  isVisible: boolean; // live on the site right now
}

export interface AdminBlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  bodyMarkdown: string;
  coverImageUrl: string | null;
  coverImageAlt: string | null;
  authorName: string | null;
  createdByUserId: string;
  status: BlogStatus;
  isVisible: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  metaTitle: string | null;
  metaDescription: string | null;
  canonicalUrl: string | null;
  readingTimeMinutes: number;
  city: BlogPlace | null;
  country: BlogPlace | null;
  tags: BlogTag[];
  tagKeys: string[];
  destinationIds: string[];
  wishlistIds: string[];
  eventIds: string[];
  destinations: BlogDestinationCard[];
  wishlists: BlogWishlistCard[];
  events: BlogEventCard[];
  embeds: BlogEmbed[];
  previousSlugs: string[];
}

// Create: everything. Edit: only what changed; arrays replace the whole set
// ([] clears); "" clears optional text; clearCity/clearCountry remove those.
export interface BlogPostInput {
  title?: string;
  slug?: string | null;          // null on create = generated from the title
  excerpt?: string;
  bodyMarkdown?: string;
  coverImageUrl?: string | null;
  coverImageAlt?: string | null;
  authorName?: string | null;
  metaTitle?: string | null;     // ≤ 70
  metaDescription?: string | null; // ≤ 160
  canonicalUrl?: string | null;
  cityId?: string | null;
  clearCity?: boolean;
  countryId?: string | null;
  clearCountry?: boolean;
  tagKeys?: string[];
  destinationIds?: string[];
  wishlistIds?: string[];
  eventIds?: string[];
  status?: BlogStatus;
  publishedAt?: string | null;
}

export interface AdminBlogQuery {
  page?: number; pageSize?: number; search?: string; status?: string;
  tag?: string; cityId?: string; destinationId?: string; wishlistId?: string;
}

// Just what the event picker needs from GET /api/admin/events.
export interface AdminEventOption { id: string; name: string; slug: string; startsAt: string }

export const blogAdminApi = {
  list: (q: AdminBlogQuery) => http.get<AdminPaged<AdminBlogPostSummary>>(`${A}${qs({ ...q })}`),
  get: (id: string) => http.get<AdminBlogPost>(`${A}/${id}`),
  create: (body: BlogPostInput) => http.post<AdminBlogPost>(A, body),
  update: (id: string, body: BlogPostInput) => http.patch<AdminBlogPost>(`${A}/${id}`, body),
  // Without a date: publish now. A future date schedules it.
  publish: (id: string, publishedAt?: string | null) =>
    http.post<AdminBlogPost>(`${A}/${id}/publish`, publishedAt ? { publishedAt } : {}),
  unpublish: (id: string) => http.post<AdminBlogPost>(`${A}/${id}/unpublish`, {}),
  remove: (id: string) => http.del<void>(`${A}/${id}`),
  searchEvents: (search: string) =>
    http.get<AdminPaged<AdminEventOption>>(`/api/admin/events${qs({ search, pageSize: 10 })}`),
};
