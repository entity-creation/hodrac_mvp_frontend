// Public blog endpoints.
import { http } from "./client";
import type { BlogListQuery, BlogPaged, BlogPost, BlogPostSummary, BlogTagCount } from "../../types/blog";

const qs = (params: Record<string, unknown>) => {
  const q = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join("&");
  return q ? `?${q}` : "";
};

export const blogApi = {
  // Newest first.
  list: (q: BlogListQuery = {}) => http.get<BlogPaged<BlogPostSummary>>(`/api/blog${qs({ ...q })}`),
  // A renamed slug answers 301 to the new one; fetch follows it, so compare
  // the returned slug with the one asked for. 404 = missing or unpublished.
  get: (slug: string) => http.get<BlogPost>(`/api/blog/${encodeURIComponent(slug)}`),
  tags: () => http.get<BlogTagCount[]>("/api/blog/tags"),
};
