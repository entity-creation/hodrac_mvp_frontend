import type {
  AuthResponse, UserDto, DestinationSummary, DestinationDetail,
  WishlistCard, WishlistDetail, FilterOptions, PagedResult,
  SavedContent, SearchResponse, UserProfile, CollaboratorDto,
  PricingSnapshot, DestinationFilters, WishlistFilters,
} from "../../types/index";

// ─── Config ───────────────────────────────────────────────────────────────────

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://localhost:7116";

// ─── Token storage ────────────────────────────────────────────────────────────

const TOKEN_KEY   = "hodrac_access_token";
const REFRESH_KEY = "hodrac_refresh_token";
const USER_ID_KEY = "hodrac_user_id";

export const tokenStore = {
  getAccess:    () => localStorage.getItem(TOKEN_KEY),
  getRefresh:   () => localStorage.getItem(REFRESH_KEY),
  getUserId:    () => localStorage.getItem(USER_ID_KEY),
  set: (auth: AuthResponse) => {
    localStorage.setItem(TOKEN_KEY,   auth.accessToken);
    localStorage.setItem(REFRESH_KEY, auth.refreshToken);
    localStorage.setItem(USER_ID_KEY, auth.user.userId);
  },
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_ID_KEY);
  },
};

// ─── Core fetch wrapper ───────────────────────────────────────────────────────

let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

async function refreshAccessToken(): Promise<string | null> {
  const userId       = tokenStore.getUserId();
  const refreshToken = tokenStore.getRefresh();
  if (!userId || !refreshToken) return null;

  const res = await fetch(`${BASE_URL}/api/auth/refresh`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ userId, refreshToken }),
  });

  if (!res.ok) { tokenStore.clear(); return null; }
  const auth: AuthResponse = await res.json();
  tokenStore.set(auth);
  return auth.accessToken;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  retry = true
): Promise<T> {
  const token = tokenStore.getAccess();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> ?? {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  // 401 → attempt token refresh once
  if (res.status === 401 && retry) {
    if (!isRefreshing) {
      isRefreshing = true;
      const newToken = await refreshAccessToken();
      isRefreshing   = false;
      refreshQueue.forEach(cb => cb(newToken ?? ""));
      refreshQueue = [];
      if (newToken) return request<T>(path, options, false);
    } else {
      return new Promise((resolve, reject) => {
        refreshQueue.push((newToken) => {
          if (newToken) resolve(request<T>(path, options, false));
          else reject(new Error("Unauthorized"));
        });
      });
    }
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err?.error ?? `API error ${res.status}`);
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;

  return res.json();
}

const get  = <T>(path: string)                => request<T>(path);
const post = <T>(path: string, body: unknown) => request<T>(path, { method: "POST", body: JSON.stringify(body) });
const put  = <T>(path: string, body: unknown) => request<T>(path, { method: "PUT",  body: JSON.stringify(body) });
const del  = <T>(path: string)               => request<T>(path, { method: "DELETE" });
const patch = <T>(path: string, body: unknown) => request<T>(path, { method: "PATCH", body: JSON.stringify(body) });

// ─── Auth API ─────────────────────────────────────────────────────────────────

export const authApi = {
  register: (email: string, password: string, displayName: string) =>
    post<AuthResponse>("/api/auth/register", { email, password, displayName }),

  login: (email: string, password: string) =>
    post<AuthResponse>("/api/auth/login", { email, password }),

  refresh: (userId: string, refreshToken: string) =>
    post<AuthResponse>("/api/auth/refresh", { userId, refreshToken }),

  logout: (userId: string, refreshToken: string, logoutAllDevices = false) =>
    post<void>("/api/auth/logout", { userId, refreshToken, logoutAllDevices }),

  me: () => get<UserDto>("/api/auth/me"),

  updateMe: (displayName?: string, avatarUrl?: string) =>
    patch<UserDto>("/api/auth/me", { displayName, avatarUrl }),

  completeOnboarding: () =>
    patch<void>("/api/auth/me/onboarding", {}),
};

// ─── Filter options API ───────────────────────────────────────────────────────

export const lookupApi = {
  filterOptions: () => get<FilterOptions>("/api/filter-options"),
  tags:          () => get<FilterOptions["tags"]>("/api/tags"),
  categories:    () => get<FilterOptions["categories"]>("/api/categories"),
  countries:     () => get<FilterOptions["countries"]>("/api/countries"),
  personaTypes:  () => get<string[]>("/api/persona-types"),
  citiesByCountry: (countryId: string) =>
    get<{ cityId: string; cityName: string }[]>(`/api/countries/${countryId}/cities`),
};

// ─── Destinations API ─────────────────────────────────────────────────────────

function buildQuery(params: Record<string, unknown>): string {
  const q = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join("&");
  return q ? `?${q}` : "";
}

export const destinationsApi = {
  list: (params: DestinationFilters = {}) =>
    get<PagedResult<DestinationSummary>>(`/api/explore/destinations${buildQuery(params as Record<string, unknown>)}`),

  byId: (id: string) =>
    get<DestinationDetail>(`/api/destinations/${id}`),

  byCountry: (countryId: string, params: DestinationFilters = {}) =>
    get<PagedResult<DestinationSummary>>(`/api/explore/destinations/by-country/${countryId}${buildQuery(params as Record<string, unknown>)}`),

  matchingUser: (userId?: string, limit = 12) =>
    get<DestinationSummary[]>(`/api/destinations/matching-user${buildQuery({ user_id: userId, limit })}`),

  similarToWishlist: (wishlistId: string, limit = 6) =>
    get<DestinationSummary[]>(`/api/destinations/similar-to-wishlist/${wishlistId}?limit=${limit}`),

   destinationsInWishlist: (wishlistId: string, page = 1) =>
    get<DestinationSummary[]>(`/api/destinations/destinations-in-wishlist/${wishlistId}?page=${page}`),

  similarName: (name: string) =>
    get<DestinationSummary[]>(`/api/destinations/similar-name?name=${encodeURIComponent(name)}`),

  save:   (id: string) => post<void>(`/api/destinations/${id}/save`, {}),
  unsave: (id: string) => del<void>(`/api/destinations/${id}/save`),
};

// ─── Wishlists API ────────────────────────────────────────────────────────────

export const wishlistsApi = {
  list: (params: WishlistFilters = {}) =>
    get<PagedResult<WishlistCard>>(`/api/explore/wishlists${buildQuery(params as Record<string, unknown>)}`),

  byId: (id: string) =>
    get<WishlistDetail>(`/api/wishlists/${id}`),

  popular: (userId?: string, limit = 20) =>
    get<WishlistCard[]>(`/api/wishlists/popular${buildQuery({ user_id: userId, limit })}`),

  featured: () =>
    get<WishlistCard[]>("/api/wishlists/featured"),

  similar: (id: string, limit = 6) =>
    get<WishlistCard[]>(`/api/wishlists/similar/${id}?limit=${limit}`),

  destinationInWishlist: (id: string, limit = 6) =>
    get<WishlistCard[]>(`/api/wishlists/wishlist-with-destination/${id}?limit=${limit}`),

  matchingUser: (userId?: string, limit = 12) =>
    get<WishlistCard[]>(`/api/wishlists/matching-user${buildQuery({ user_id: userId, limit })}`),

  fork: (id: string) =>
    post<{ newWishlistId: string; message: string }>(`/api/wishlists/${id}/fork`, {}),

  save:   (id: string) => post<void>(`/api/wishlists/${id}/save`, {}),
  unsave: (id: string) => del<void>(`/api/wishlists/${id}/save`),

  collaborators: (id: string) =>
    get<CollaboratorDto[]>(`/api/wishlists/${id}/collaborators`),

  pricingSnapshot: (id: string) =>
    get<PricingSnapshot>(`/api/wishlists/${id}/pricing-snapshot`),

  createSnapshot: (id: string, travelersCount?: number) =>
    post<PricingSnapshot>(`/api/wishlists/${id}/pricing-snapshot`, { travelersCount }),
};

// ─── User wishlists API ───────────────────────────────────────────────────────

export const userWishlistsApi = {
  list:   () => get<WishlistCard[]>("/api/user-wishlists"),
  byId:   (id: string) => get<WishlistDetail>(`/api/user-wishlists/${id}`),
  shared: () => get<WishlistCard[]>("/api/shared-wishlists"),

  update: (id: string, data: {
    wishlistName?: string;
    wishlistDescription?: string;
    shortStory?: string;
    defaultTravelersCount?: number;
    globalInclusions?: string[];
    /** Pass the xmin value from the WishlistDetail GET response to enable optimistic concurrency. */
    xmin?: number;
  }) => put<WishlistDetail>(`/api/user-wishlists/${id}`, data),

  delete: (id: string) => del<void>(`/api/user-wishlists/${id}`),

  addCollaborator: (id: string, email: string, role: "Editor" | "Viewer") =>
    post<CollaboratorDto>(`/api/user-wishlists/${id}/collaborators`, { email, role }),

  removeCollaborator: (id: string, userId: string) =>
    del<void>(`/api/user-wishlists/${id}/collaborators/${userId}`),

  changeRole: (id: string, userId: string, newRole: string) =>
    put<void>(`/api/user-wishlists/${id}/collaborators/${userId}`, { newRole }),
};

// ─── Saved content API ────────────────────────────────────────────────────────

export const savedApi = {
  all: () => get<SavedContent>("/api/user/saved"),
};

// ─── Search API ───────────────────────────────────────────────────────────────

export const searchApi = {
  search: (q: string, userId?: string) =>
    get<SearchResponse>(`/api/search?q=${encodeURIComponent(q)}${userId ? `&user_id=${userId}` : ""}`),

  popular: (limit = 10) =>
    get<{ phrase: string; count: number }[]>(`/api/popular-searches?limit=${limit}`),
};

// ─── Events API ───────────────────────────────────────────────────────────────

export const eventsApi = {
  track: (eventType: string, entityId: string, entityTags: string[] = [], page = "", position = 0) =>
    post<void>("/api/events/interaction", { eventType, entityId, entityTags, page, position })
      .catch(() => {}), // fire-and-forget, never throw
};

// ─── Creator API ──────────────────────────────────────────────────────────────

export const creatorApi = {
  list: () =>
    get<import("../../types").CreatorDto[]>("/api/creators"),

  byId: (id: string) =>
    get<import("../../types").CreatorDto>(`/api/creators/${id}`),

  create: (body: {
    displayName: string;
    handle: string;
    platformName: string;
    profileUrl: string;
    avatarUrl?: string;
    bio?: string;
    contactEmail?: string;
  }) => post<import("../../types").CreatorDto>("/api/creators", body),

  update: (id: string, body: Partial<{
    displayName: string;
    handle: string;
    platformName: string;
    profileUrl: string;
    avatarUrl: string;
    bio: string;
    contactEmail: string;
    isVerified: boolean;
  }>) => patch<import("../../types").CreatorDto>(`/api/creators/${id}`, body),

  // ── Attributions ────────────────────────────────────────────────────────────

  getAttributions: (wishlistId: string) =>
    get<import("../../types").WishlistCreatorAttributionDto[]>(
      `/api/wishlists/${wishlistId}/attributions`
    ),

  attachAttribution: (wishlistId: string, body: {
    creatorId: string;
    originalContentUrl: string;
    permissionType: string;
    permissionGrantedAt: string;
    permissionEvidenceUrl?: string;
    attributionNote?: string;
  }) =>
    post<import("../../types").WishlistCreatorAttributionDto>(
      `/api/wishlists/${wishlistId}/attributions`,
      body
    ),

  updateAttribution: (wishlistId: string, attributionId: string, body: Partial<{
    originalContentUrl: string;
    permissionType: string;
    permissionGrantedAt: string;
    permissionEvidenceUrl: string;
    isActive: boolean;
    attributionNote: string;
  }>) =>
    patch<import("../../types").WishlistCreatorAttributionDto>(
      `/api/wishlists/${wishlistId}/attributions/${attributionId}`,
      body
    ),

  deactivateAttribution: (wishlistId: string, attributionId: string) =>
    del<void>(`/api/wishlists/${wishlistId}/attributions/${attributionId}`),
};

// ─── User profile API ─────────────────────────────────────────────────────────

export const userApi = {
  profile: () => get<UserProfile>("/api/user/profile"),
};
