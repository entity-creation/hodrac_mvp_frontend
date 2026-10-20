import type {
  AuthResponse, UserDto, DestinationSummary, DestinationDetail,
  WishlistCard, WishlistDetail, FilterOptions, PagedResult,
  SavedContent, SearchResponse, UserProfile, CollaboratorDto,
  PricingSnapshot, DestinationFilters, WishlistFilters,
  NewsLetterEmail,
  TripNotification,
  BrowseTripsFilters,
  DestinationSearchResult,
  ThreadMessage,
  TripApiClient,
  TripPost,
  WishlistSearchResult,
  CreateTripPayload,
  MyTripPost,
  MyTripRequest,
  TripInterest,
  PartnerLeadPayload,
  UpdateTripPayload,
  TripPostStatus,
  TripInterestStatus,
  ExchangeRates,
} from "../../types/index";
import { TRIP_STATUS_CODE } from "../../types/index";
import { withPreviewPartner, withPreviewPartnerList } from "../../utils/v2Utils/partnerPreview";

// ─── Config ───────────────────────────────────────────────────────────────────

// Backend root. Set VITE_API_BASE_URL in .env (or .env.local to point a local
// dev build at https://localhost:7116); defaults to production.
export const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL || "https://hodrac-mvp2-backend-2050972.onrender.com";
const BASE_URL = API_BASE_URL;

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

// Error thrown for any non-2xx response, with the HTTP status so callers can
// react to specific cases (409 conflicts, 404s, 429 rate limits).
export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export const isApiError = (e: unknown, status?: number): e is ApiError =>
  e instanceof ApiError && (status === undefined || e.status === status);

// Accepts { error }, { message } and ASP.NET ProblemDetails ({ title, detail }).
function errorMessage(body: unknown, status: number): string {
  const b = (body ?? {}) as Record<string, unknown>;
  const msg = [b.error, b.message, b.detail, b.title].find(v => typeof v === "string" && v.trim());
  if (msg) return msg as string;
  if (status === 429) return "Too many requests. Please wait a minute and try again.";
  return `API error ${status}`;
}

let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

// Notified when a signed-in session can't be refreshed (refresh token
// expired or revoked). AuthProvider uses this to sign out and redirect.
const unauthorizedHandlers = new Set<() => void>();

export function onUnauthorized(handler: () => void): () => void {
  unauthorizedHandlers.add(handler);
  return () => unauthorizedHandlers.delete(handler);
}

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
      // Only a real session expiring should sign the user out; anonymous
      // visitors hitting an auth-only endpoint just get the error.
      const hadSession = !!tokenStore.getRefresh();
      const newToken = await refreshAccessToken().catch(() => null);
      isRefreshing   = false;
      refreshQueue.forEach(cb => cb(newToken ?? ""));
      refreshQueue = [];
      if (newToken) return request<T>(path, options, false);
      if (hadSession) {
        tokenStore.clear();
        unauthorizedHandlers.forEach(h => h());
      }
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
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new ApiError(res.status, errorMessage(body, res.status));
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

  // Home country (ISO alpha-2), used to pick the display currency.
  updateCountry: (countryCode: string) =>
    patch<UserDto | void>("/api/auth/me", { countryCode }),

  updateNotificationPreferences: (notificationEmailOptIn: boolean) =>
    patch<UserDto | void>("/api/auth/me/notification-preferences", { notificationEmailOptIn }),

  // Changing or resetting the password ends every session on the server.
  changePassword: (currentPassword: string, newPassword: string) =>
    post<void>("/api/auth/change-password", { currentPassword, newPassword }),

  forgotPassword: (email: string) =>
    post<void>("/api/auth/forgot-password", { email }),

  // From the emailed link: /reset-password?userId=…&token=…
  resetPassword: (userId: string, token: string, newPassword: string) =>
    post<void>("/api/auth/reset-password", { userId, token, newPassword }),

  // From the emailed link: /confirm-email?userId=…&token=…
  confirmEmail: (userId: string, token: string) =>
    post<void>("/api/auth/confirm-email", { userId, token }),

  // Signed-in: send the confirmation email again.
  resendConfirmation: () =>
    post<void>("/api/auth/resend-confirmation", {}),

  newsletter: (email: string) =>
    post<NewsLetterEmail>("/api/auth/newletter", { userEmail: email }),
};

//
// ─── Trip posts API ───────────────────────────────────────────────────────────
//
// Reuses your existing helpers (get/post/patch/buildQuery) and endpoints
// where they already cover what the trip feature needs, rather than
// inventing new ones.

export const tripClient: TripApiClient = {
  // Reads live from tokenStore rather than being frozen at module load.
  get currentUserId(): string {
    return tokenStore.getUserId() ?? "";
  },

  // Reuses your fuzzy destination-name search — Destination already has
  // the Metaphone/normalized-search infra behind this endpoint.
  searchDestinations: async (query: string) => {
    const results = await get<DestinationSummary[]>(
      `/api/destinations/similar-name?name=${encodeURIComponent(query)}`
    );
    return results.map(mapDestinationResult);
  },

  // No dedicated wishlist search endpoint exists yet. For the trip
  // composer, the relevant universe is the user's OWN wishlists (they're
  // posting a trip based on their own itinerary plan), so this filters
  // client-side over `userWishlistsApi.list()` rather than the public
  // explore/wishlists catalog. Fine for a personal wishlist count in the
  // dozens; if that list grows large, move the filtering server-side.
  searchWishlists: async (query: string) => {
    const mine = await get<WishlistCard[]>("/api/wishlists/full");
    const q = query.trim().toLowerCase();
    return mine
      .filter((w) => (w as any).wishlistName?.toLowerCase().includes(q))
      .map(mapWishlistResult);
  },

  createTrip: async (payload: CreateTripPayload) => post<TripPost>("/api/trips", payload).then(normalizeTrip),

  getTrip: (id: string) => get<TripPost>(`/api/trips/${id}`).then(normalizeTrip),

  browseTrips: (filters: BrowseTripsFilters) => get<TripPost[]>(
    `/api/trips/browse${buildQuery({
      dest: filters.destination,
      from: filters.from,
      to: filters.to,
      destinationId: filters.destinationId,
      wishlistId: filters.wishlistId,
    })}`
  ).then(list => list.map(normalizeTrip)),

  browsePublicTrips: (filters: BrowseTripsFilters, page = 1, pageSize = 24) => get<PagedResult<TripPost>>(
    `/api/trips/public${buildQuery({
      destination: filters.destination,
      destinationId: filters.destinationId,
      wishlistId: filters.wishlistId,
      from: filters.from,
      to: filters.to,
      page,
      pageSize,
    })}`
  ).then(r => ({ ...r, items: (r.items ?? []).map(normalizeTrip) })),

  // Signed in → /browse (includes authorUserId + my request status), returned
  // as a single page. Signed out → the paged public endpoint.
  findTrips: async (filters: BrowseTripsFilters, page = 1, pageSize = 24) => {
    if (tokenStore.getAccess()) {
      const items = await tripClient.browseTrips(filters);
      return { page: 1, pageSize: items.length, totalCount: items.length, totalPages: 1, items };
    }
    return tripClient.browsePublicTrips(filters, page, pageSize);
  },

  updateTrip: (tripId: string, changes: UpdateTripPayload) => {
    const { status, ...rest } = changes;
    return patch<TripPost>(`/api/trips/${tripId}`, {
      ...rest,
      ...(status !== undefined ? { status: TRIP_STATUS_CODE[status] } : {}),
    }).then(normalizeTrip);
  },

  requestToJoin: (tripId: string) => post<void>(`/api/trips/${tripId}/interests`, {}),

  // 409 if the request is no longer pending or approved.
  withdrawInterest: (tripId: string, interestId: string) =>
    del<void>(`/api/trips/${tripId}/interests/${interestId}`),

  // Navigation, not a network call — swap this for your router's
  // navigate() if you're using react-router/etc. Left as a plain redirect
  // so the interface has a working default without pulling in a router
  // dependency here.
  openThread: (tripId: string) => {
    window.location.assign(`/trip-thread/${tripId}`);
  },

  getThreadMessages: (tripId: string) => get<ThreadMessage[]>(`/api/trips/${tripId}/thread/messages`),

  sendMessage: (tripId: string, body: string) => post<ThreadMessage>(`/api/trips/${tripId}/thread/messages`, { body }),

  getNotifications: () => get<TripNotification[]>("/api/notifications"),

  // Accepts either a bare number or { count } / { unreadCount } from the API.
  getUnreadNotificationCount: async () => {
    const res = await get<number | { count?: number; unreadCount?: number }>(
      "/api/notifications/unread-count"
    );
    return typeof res === "number" ? res : res?.count ?? res?.unreadCount ?? 0;
  },

  markNotificationRead: (id: string) => patch<void>(`/api/notifications/${id}/read`, {}),

  markAllNotificationsRead: () => post<void>("/api/notifications/read-all", {}),

  getMyRequests: (): Promise<MyTripRequest[]> =>
    get<MyTripRequest[]>("/api/trips/mine/requests").then(list =>
      list.map(r => ({ ...r, status: normalizeInterestStatus(r.status), trip: normalizeTrip(r.trip) }))),

  getMyPosts: (): Promise<MyTripPost[]> =>
    get<MyTripPost[]>("/api/trips/mine/posts").then(list => list.map(p => ({ ...p, trip: normalizeTrip(p.trip) }))),

  getInterests: (tripId: string): Promise<TripInterest[]> =>
    get<TripInterest[]>(`/api/trips/${tripId}/interests`).then(list =>
      list.map(i => ({ ...i, status: normalizeInterestStatus(i.status) }))),

  respondToInterest: (tripId: string, interestId: string, approve: boolean): Promise<void> =>
     patch(`/api/trips/${tripId}/interests/${interestId}`, {approve: approve}),
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
    get<PagedResult<DestinationSummary>>(`/api/explore/destinations${buildQuery(params as Record<string, unknown>)}`)
      .then(r => ({ ...r, items: withPreviewPartnerList(r.items) })),

  byId: (id: string) =>
    get<DestinationDetail>(`/api/destinations/${id}`).then(withPreviewPartner),

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
    get<PagedResult<WishlistCard>>(`/api/explore/wishlists${buildQuery(params as Record<string, unknown>)}`)
      .then(r => ({ ...r, items: withPreviewPartnerList(r.items) })),

  byId: (id: string) =>
    get<WishlistDetail>(`/api/wishlists/${id}`).then(withPreviewPartner),

  popular: (userId?: string, limit = 20) =>
    get<WishlistCard[]>(`/api/wishlists/popular${buildQuery({ user_id: userId, limit })}`).then(withPreviewPartnerList),

  featured: () =>
    get<WishlistCard[]>("/api/wishlists/featured").then(withPreviewPartnerList),

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

// ─── Currency API ─────────────────────────────────────────────────────────────

export const currencyApi = {
  // Public; the backend refreshes and caches rates daily.
  rates: (base = "USD") => get<ExchangeRates>(`/api/currency/rates?base=${encodeURIComponent(base)}`),
};

// ─── Partners API ─────────────────────────────────────────────────────────────

export const partnerApi = {
  // "For Business" lead form — public, no login.
  submitLead: (payload: PartnerLeadPayload) => post<void>("/api/partner-leads", payload),
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


// ─── Trip status normalisation ────────────────────────────────────────────────
// The API may send enum values as numbers (0 = Open …). Normalise to the names
// the UI compares against, whatever the wire format.

const TRIP_STATUS_NAMES: TripPostStatus[] = ["Open", "Closed", "Cancelled"];
const INTEREST_STATUS_NAMES: TripInterestStatus[] = ["Requested", "Approved", "Declined", "Withdrawn"];

export function normalizeTrip(trip: TripPost): TripPost {
  if (!trip) return trip;
  const raw = trip.status as unknown;
  const status = typeof raw === "number" ? TRIP_STATUS_NAMES[raw] ?? "Open" : (raw as TripPostStatus);
  return {
    ...trip,
    status,
    stops: trip.stops ?? [],
    myInterestStatus: trip.myInterestStatus == null ? trip.myInterestStatus : normalizeInterestStatus(trip.myInterestStatus),
  };
}

export function normalizeInterestStatus(status: TripInterestStatus): TripInterestStatus {
  const raw = status as unknown;
  return typeof raw === "number" ? INTEREST_STATUS_NAMES[raw] ?? "Requested" : status;
}

function mapDestinationResult(d: DestinationSummary): DestinationSearchResult {
  // ⚠️ Verify these field names against your real DestinationSummary shape —
  // I don't have that type, only the Destination entity it's presumably
  // projected from (DestinationId, DestinationName, Country.CountryName).
  return {
    id: (d as any).destinationId,
    name: (d as any).destinationName,
    country: (d as any).country?.countryName ?? null,
  };
}

function mapWishlistResult(w: WishlistCard): WishlistSearchResult {
  // ⚠️ Same caveat — verify against your real WishlistCard shape. If the
  // card doesn't carry stop names, this falls back to just the wishlist
  // name, which is fine for the composer (it just won't show the
  // "Tokyo · Kyoto · Osaka" preview until you enrich the card).
  return {
    id: (w as any).wishlistId,
    name: (w as any).wishlistName,
    stopNames: (w as any).destinationNames ?? [],
  };
}