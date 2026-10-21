import { http, downloadFile } from "../dataStore/v2Api/client";

// ─── Admin API ────────────────────────────────────────────────────────────────
// Every route requires an admin login. Times are UTC ISO strings.
// Field names follow the backend's OpenAPI schemas (Admin*Dto). Types the
// schema view didn't show are inferred; enums that may arrive as numbers are
// normalised with `enumName`.

const A = "/api/admin";

function qs(params: Record<string, unknown>): string {
  const q = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join("&");
  return q ? `?${q}` : "";
}

// ─── Shared shapes & enum helpers ─────────────────────────────────────────────

export interface AdminPaged<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
}

export const totalPages = (p: Pick<AdminPaged<unknown>, "totalCount" | "pageSize">) =>
  Math.max(1, Math.ceil((p.totalCount ?? 0) / Math.max(1, p.pageSize || 1)));

// Accepts an enum as its name or its numeric index.
export function enumName<T extends string>(value: unknown, names: readonly T[], fallback?: T): T {
  if (typeof value === "number") return names[value] ?? fallback ?? names[0];
  if (typeof value === "string") {
    const hit = names.find(n => n.toLowerCase() === value.toLowerCase());
    if (hit) return hit;
  }
  return fallback ?? names[0];
}

export const TRIP_STATUSES = ["Open", "Closed", "Cancelled"] as const;
export type TripStatus = (typeof TRIP_STATUSES)[number];

export const INTEREST_STATUSES = ["Requested", "Approved", "Declined", "Withdrawn"] as const;
export type InterestStatus = (typeof INTEREST_STATUSES)[number];

export const LEAD_STATUSES = ["New", "Contacted", "Qualified", "Won", "Lost"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const POOL_TYPES = ["Editorial", "Paid", "Random"] as const;
export type PoolType = (typeof POOL_TYPES)[number];

export const IMAGE_TYPES = ["Hero", "Gallery", "Activity_Proof", "Map_Overlay"] as const;

export interface AdminDailyCount { date: string; count: number }

// ─── Me & overview ────────────────────────────────────────────────────────────

export interface AdminMe {
  email: string;
  displayName: string;
  isAdmin: boolean;
}

export interface AdminOverview {
  days: number;
  windowStart: string;
  totals: {
    users: number;
    confirmedUsers: number;
    onboardedUsers: number;
    templates: number;
    userWishlists: number;
    destinations: number;
    tripsByStatus: Record<string, number> | null;
    openTrips: number;
    pendingInterests: number;
    threadMessages: number;
    newsletterSubscribers: number;
    leadsByStatus: Record<string, number> | null;
    partnerClicks: number;
  };
  window: {
    activeUsers: number;
    newUsers: number;
    newTrips: number;
    partnerClicks: number;
    // Days with zero activity are omitted — see fillDailySeries.
    newUsersPerDay: AdminDailyCount[];
    newTripsPerDay: AdminDailyCount[];
    partnerClicksPerDay: AdminDailyCount[];
  };
}

// ─── Users ────────────────────────────────────────────────────────────────────

export const USER_STATUS_FILTERS = ["all", "confirmed", "unconfirmed", "locked", "onboarded"] as const;
export const USER_SORTS = ["newest", "oldest", "lastActive"] as const;

export interface AdminUserRow {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  countryCode: string | null;
  emailConfirmed: boolean;
  hasCompletedOnboarding: boolean;
  isLocked: boolean;
  lockoutEnd: string | null;
  createdAt: string;
  lastLoginAt: string | null;
  lastActiveAt: string | null;
}

export interface AdminUserDetail extends AdminUserRow {
  notificationEmailOptIn: boolean;
  accessFailedCount: number;
  counts: {
    tripsPosted: number;
    tripJoinRequests: number;
    wishlistsOwned: number;
    savedWishlists: number;
    savedDestinations: number;
    unreadNotifications: number;
    activeSessions: number;
  };
}

// ─── Newsletter ───────────────────────────────────────────────────────────────

export interface AdminSubscriber { emailId: string; userEmail: string }

// ─── Lookups ──────────────────────────────────────────────────────────────────

export interface AdminTag {
  tagId: string;
  key: string;
  tagName: string;
  targetPersonaType: string | null;
  destinationCount: number;
}
export type TagInput = Pick<AdminTag, "key" | "tagName"> & { targetPersonaType?: string | null };

export interface AdminCategory {
  categoryId: string;
  key: string;
  categoryName: string;
  categoryDescription: string | null;
  iconName: string | null;
  colorHex: string | null;
  destinationCount: number;
}
export type CategoryInput = Omit<AdminCategory, "categoryId" | "destinationCount">;

export interface AdminCountry {
  countryId: string;
  countryName: string;
  continent: string | null;
  countryFlagEmoji: string | null;
  globalHeroImage: string | null;
  visaRequirementsSummary: string | null;
  powerPlugType: string | null;
  drivingSide: string | null;
  estimatedDailyTaxRate: number | null;
  cityCount: number;
  destinationCount: number;
}
export type CountryInput = Omit<AdminCountry, "countryId" | "cityCount" | "destinationCount">;

export interface AdminCity {
  cityId: string;
  cityName: string;
  cityDescription: string | null;
  latitude: number | null;
  longitude: number | null;
  countryId: string;
  countryName: string;
  destinationCount: number;
}
export type CityInput = Pick<AdminCity, "cityName" | "countryId"> &
  Partial<Pick<AdminCity, "cityDescription" | "latitude" | "longitude">>;

export interface AdminRef { id: string; name: string; key?: string | null }

// ─── Destinations ─────────────────────────────────────────────────────────────

export const DESTINATION_SORTS = ["name", "popularity", "cost"] as const;

export interface DescriptionJson {
  overview?: string | null;
  localPerspective?: string | null;
  directions?: string | null;
  whatToKnow?: string | null;
  thingsToBeWaryOf?: string | null;
  hiddenCost?: string | null;
  nearbyComplements?: string[] | null;
  bestTimeToVisit?: string | null;
  crowdLevel?: string | null;
  accessibility?: string | null;
  idealDuration?: string | null;
}

export interface AdminDestinationListItem {
  destinationId: string;
  destinationName: string;
  countryId: string;
  countryName: string;
  cityNames: string[];
  heroThumbnailUrl: string | null;
  averageCostPerDay: number;
  safetyLevel: number;
  luxuryRating: number;
  searchHitCount: number;
  tagKeys: string[];
  categoryKeys: string[];
  imageCount: number;
  wishlistCount: number;
  partnerLinkCount: number;
  // Featuring (featuredUntil in the past = expired, still listed for admins).
  isFeatured?: boolean;
  featuredUntil?: string | null;
  featuredOrder?: number | null;
}

export interface AdminDestinationImage {
  destinationImageId: string;
  imageUrl: string;
  thumbnailUrl: string | null;
  caption: string | null;
  displayOrder: number;
  imageType: string;
  shotContext: string | null;
  isAiGenerated: boolean;
}
export type DestinationImageInput = Partial<Omit<AdminDestinationImage, "destinationImageId">> & { imageUrl?: string };

export interface AdminDestinationDetail {
  destinationId: string;
  destinationName: string;
  countryId: string;
  countryName: string;
  description: DescriptionJson | null;
  commonAlternateSpellings: string[];
  psychographicVibeTags: string[];
  averageCostPerDay: number;
  luxuryRating: number;
  accessibilityType: string | null;
  familyFriendlyScore: number;
  adventurePaceScore: number;
  aestheticTrendScore: number;
  latitude: number | null;
  longitude: number | null;
  searchHitCount: number;
  timeZone: string | null;
  safetyLevel: number;
  images: AdminDestinationImage[];
  // Ref lists ({ id, name, key }) — tags/categories carry `key`.
  tags: AdminRef[];
  categories: AdminRef[];
  languages: AdminRef[];
  currencies: AdminRef[];
  cities: AdminRef[];
  wishlistCount: number;
  tripPostCount: number;
  partnerLinkCount: number;
  isFeatured?: boolean;
  featuredUntil?: string | null;
  featuredOrder?: number | null;
}

// One entry of the featured-destinations list (GET, and the response of
// feature/reorder). featuredOrder runs 1, 2, 3… with no gaps in display order;
// isActive is false once featuredUntil has passed.
export interface AdminFeaturedDestination {
  destinationId: string;
  destinationName: string;
  countryName: string;
  heroThumbnailUrl: string | null; // null when the destination has no images
  featuredOrder: number;
  featuredUntil: string | null;
  isActive: boolean;
}

export interface DestinationInput {
  destinationName: string;
  countryId: string;
  latitude?: number | null;
  longitude?: number | null;
  averageCostPerDay?: number;
  luxuryRating?: number;
  safetyLevel?: number;
  familyFriendlyScore?: number;
  adventurePaceScore?: number;
  aestheticTrendScore?: number;
  accessibilityType?: string | null;
  timeZone?: string | null;
  description?: DescriptionJson;
  commonAlternateSpellings?: string[];
  psychographicVibeTags?: string[];
  tagKeys?: string[];
  categoryKeys?: string[];
  languageIds?: string[];
  currencyIds?: string[];
  cityIds?: string[];
}

// ─── Wishlist templates ───────────────────────────────────────────────────────

export const WISHLIST_SORTS = ["newest", "saves", "name"] as const;

export interface AdminWishlistSummary {
  wishlistId: string;
  wishlistName: string;
  wishlistHeroImage: string | null;
  totalDays: number;
  peopleType: string | null;
  basePricePerPerson: number;
  totalGlobalSaveCount: number;
  isFeatured: boolean;
  featuredUntil: string | null;
  destinationCount: number;
  forkCount: number;
  partnerLinkCount: number;
  createdAt: string;
}

export interface AdminItineraryItem {
  itemId: string;
  orderIndex: number;
  title: string;
  description: string | null;
  timeOfDay: string | null;
  imageUrl: string | null;
  socialProofBadge: string | null;
  costModifier: number;
  isOptional: boolean;
  isSelectedByDefault: boolean;
}
export type ItineraryItemInput = Omit<AdminItineraryItem, "itemId" | "orderIndex"> & { orderIndex?: number };

export interface AdminItineraryDay {
  dayId: string;
  dayNumber: number;
  dayTitle: string | null;
  morningCityId: string | null;
  morningCityName: string | null;
  afternoonCityId: string | null;
  afternoonCityName: string | null;
  eveningCityId: string | null;
  eveningCityName: string | null;
  transitFromPreviousDayRouteId: string | null;
  items: AdminItineraryItem[];
}
export interface ItineraryDayInput {
  dayTitle?: string | null;
  dayNumber?: number;
  morningCityId?: string | null;
  afternoonCityId?: string | null;
  eveningCityId?: string | null;
  transitFromPreviousDayRouteId?: string | null;
}

export interface AdminAttribution {
  wishlistCreatorAttributionId: string;
  creatorId: string;
  creatorDisplayName: string;
  creatorHandle: string | null;
  creatorPlatformName: string | null;
  creatorIsVerified: boolean;
  originalContentUrl: string | null;
  permissionType: string | null;
  permissionGrantedAt: string | null;
  permissionEvidenceUrl: string | null;
  isActive: boolean;
  attributionNote: string | null;
  createdAt: string;
}
export interface AttributionInput {
  creatorId?: string;
  originalContentUrl?: string | null;
  permissionType?: string | null;
  permissionGrantedAt?: string | null;
  permissionEvidenceUrl?: string | null;
  attributionNote?: string | null;
  isActive?: boolean;
}

export interface AdminFeaturedPoolEntry {
  featuredWishlistPoolId: string;
  wishlistId: string;
  wishlistName: string;
  poolType: PoolType | number;
  paidAmount: number | null;
  dailyImpressionLimit: number | null;
  currentImpressionsToday: number;
  randomSelectionWeight: number | null;
  lastRotationDate: string | null;
}
export interface FeaturedPoolInput {
  wishlistId?: string;
  poolType?: PoolType;
  paidAmount?: number | null;
  dailyImpressionLimit?: number | null;
  randomSelectionWeight?: number | null;
  resetImpressionsToday?: boolean;
}

export interface AdminWishlistDetail {
  wishlistId: string;
  wishlistName: string;
  wishlistDescription: string | null;
  shortStory: string | null;
  totalDays: number;
  peopleType: string | null;
  wishlistHeroImage: string | null;
  globalInclusions: string[];
  rawContentKeywords: string | null;
  psychologicalVibeTags: string[];
  defaultTravelersCount: number;
  basePricePerPerson: number;
  calculatedTotalCost: number;
  depositAmountRequired: number;
  accommodationInclusions: string | null;
  transitInclusions: string | null;
  activityInclusions: string | null;
  totalGlobalSaveCount: number;
  isFeatured: boolean;
  featuredUntil: string | null;
  primaryPersonaTarget: string | null;
  createdAt: string;
  lastInteractedAt: string | null;
  forkCount: number;
  partnerLinkCount: number;
  tripPostCount: number;
  // Optimistic-concurrency token: send back on PATCH to detect edit conflicts (409).
  xmin: number;
  destinations: { destinationId: string; destinationName: string }[];
  itineraryDays: AdminItineraryDay[];
  attributions: AdminAttribution[];
  featuredPoolEntries: AdminFeaturedPoolEntry[];
}

export interface WishlistInput {
  wishlistName?: string;
  wishlistDescription?: string | null;
  shortStory?: string | null;
  totalDays?: number;
  peopleType?: string | null;
  wishlistHeroImage?: string | null;
  globalInclusions?: string[];
  rawContentKeywords?: string | null;
  psychologicalVibeTags?: string[];
  defaultTravelersCount?: number;
  basePricePerPerson?: number;
  calculatedTotalCost?: number;
  depositAmountRequired?: number;
  accommodationInclusions?: string | null;
  transitInclusions?: string | null;
  activityInclusions?: string | null;
  primaryPersonaTarget?: string | null;
  destinationIds?: string[]; // create only
  xmin?: number; // update only
}

// ─── Creators ─────────────────────────────────────────────────────────────────

export interface AdminCreator {
  creatorId: string;
  displayName: string;
  handle: string | null;
  platformName: string | null;
  profileUrl: string | null;
  avatarUrl: string | null;
  bio: string | null;
  contactEmail: string | null;
  isVerified: boolean;
  createdAt: string;
  attributionCount: number;
  activeAttributionCount: number;
}
export type CreatorInput = Partial<Omit<AdminCreator, "creatorId" | "createdAt" | "attributionCount" | "activeAttributionCount">>;

// ─── Trips ────────────────────────────────────────────────────────────────────

export interface AdminTripAuthor { userId: string; displayName: string; email: string }
export interface AdminInterestCounts { requested: number; approved: number; declined: number; withdrawn: number }

export interface AdminTripSummary {
  id: string;
  caption: string | null;
  destinationLabel: string;
  author: AdminTripAuthor;
  status: TripStatus | number;
  isHidden: boolean;
  startDate: string | null;
  endDate: string | null;
  maxGroupSize: number | null;
  interestCounts: AdminInterestCounts;
  messageCount: number;
  createdAt: string;
}

export interface AdminTripInterest {
  id: string;
  requesterUserId: string;
  requesterName: string;
  requesterEmail: string;
  status: InterestStatus | number;
  message: string | null;
  requestedAt: string;
  respondedAt: string | null;
}

export interface AdminTripDetail extends Omit<AdminTripSummary, "messageCount"> {
  destinationId: string | null;
  wishlistId: string | null;
  freeTextDestination: string | null;
  coverImageUrl: string | null;
  isDateFlexible: boolean;
  hiddenAt: string | null;
  hiddenReason: string | null;
  hiddenByUserId: string | null;
  interests: AdminTripInterest[];
  threadId: string | null;
  threadParticipantCount: number;
  messageCount: number;
  updatedAt: string | null;
}

export interface AdminThreadMessage {
  id: string;
  senderUserId: string;
  senderName: string;
  body: string;
  createdAt: string;
}

// ─── Partners ─────────────────────────────────────────────────────────────────

export interface AdminPartnerSummary {
  partnerId: string;
  name: string;
  logoUrl: string | null;
  defaultCtaLabel: string | null;
  isActive: boolean;
  createdAt: string;
  linkCount: number;
  activeLinkCount: number;
}

export interface AdminPartnerLink {
  linkId: string;
  partnerId: string;
  partnerName: string;
  destinationId: string | null;
  wishlistId: string | null;
  targetType: string; // "Destination" | "Wishlist"
  targetName: string;
  bookingUrl: string;
  trackingUrl: string | null;
  ctaLabel: string | null;
  isSponsored: boolean;
  priority: number;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
}

export interface AdminPartnerDetail extends Omit<AdminPartnerSummary, "linkCount" | "activeLinkCount"> {
  links: AdminPartnerLink[];
}

export interface PartnerInput {
  name?: string;
  logoUrl?: string | null;
  defaultCtaLabel?: string | null;
  isActive?: boolean;
}

export interface PartnerLinkInput {
  partnerId?: string; // create only
  destinationId?: string | null;
  wishlistId?: string | null;
  bookingUrl?: string;
  ctaLabel?: string | null;
  isSponsored?: boolean;
  priority?: number;
  isActive?: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
  clearStartsAt?: boolean; // update only
  clearEndsAt?: boolean; // update only
}

export interface ClickStats {
  from: string;
  to: string;
  totalClicks: number;
  uniqueUsers: number;
  daily: { date: string; clicks: number }[];
}

export interface AdminPartnerLead {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  website: string | null;
  businessType: string | null;
  interests: string[];
  message: string | null;
  status: LeadStatus | number;
  internalNotes: string | null;
  createdAt: string;
  updatedAt: string | null;
}

// ─── Endpoints ────────────────────────────────────────────────────────────────

type Paging = { page?: number; pageSize?: number };

export const adminApi = {
  me: () => http.get<AdminMe>(`${A}/me`),
  overview: (days = 30) => http.get<AdminOverview>(`${A}/overview${qs({ days })}`),

  users: {
    list: (p: Paging & { search?: string; status?: string; sort?: string }) =>
      http.get<AdminPaged<AdminUserRow>>(`${A}/users${qs(p)}`),
    get: (id: string) => http.get<AdminUserDetail>(`${A}/users/${id}`),
    // No `until` = effectively permanent. Logs the user out everywhere.
    lock: (id: string, body: { until?: string | null; reason?: string | null }) =>
      http.post<void>(`${A}/users/${id}/lock`, body),
    unlock: (id: string) => http.post<void>(`${A}/users/${id}/unlock`, {}),
    // 409 if already confirmed.
    resendConfirmation: (id: string) => http.post<void>(`${A}/users/${id}/resend-confirmation`, {}),
  },

  newsletter: {
    list: (p: Paging & { search?: string }) =>
      http.get<AdminPaged<AdminSubscriber>>(`${A}/newsletter${qs(p)}`),
    exportCsv: () => downloadFile(`${A}/newsletter/export`, "newsletter-subscribers.csv"),
    remove: (id: string) => http.del<void>(`${A}/newsletter/${id}`),
  },

  destinations: {
    list: (p: Paging & { search?: string; countryId?: string; cityId?: string; tag?: string; category?: string; sort?: string }) =>
      http.get<AdminPaged<AdminDestinationListItem>>(`${A}/destinations${qs(p)}`),
    get: (id: string) => http.get<AdminDestinationDetail>(`${A}/destinations/${id}`),
    create: (body: DestinationInput) => http.post<AdminDestinationDetail>(`${A}/destinations`, body),
    update: (id: string, body: Partial<DestinationInput>) => http.patch<AdminDestinationDetail>(`${A}/destinations/${id}`, body),
    // 409 if a wishlist or trip uses it.
    remove: (id: string) => http.del<void>(`${A}/destinations/${id}`),
    // Also updates an already-featured destination (never 409). Every call
    // REPLACES both settings:
    //  - order: 1-based; omitted → moves to the end; > length → last; < 1 → 400.
    //    To keep its place, send the current featuredOrder.
    //  - featuredUntil: must be in the future (else 400); null/omitted removes
    //    the end date. To end featuring now, use unfeature.
    // Returns the full featured list in order.
    feature: (id: string, body: { featuredUntil?: string | null; order?: number | null } = {}) =>
      http.post<AdminFeaturedDestination[]>(`${A}/destinations/${id}/feature`, body),
    // The others close the gap. 204.
    unfeature: (id: string) => http.post<void>(`${A}/destinations/${id}/unfeature`, {}),
    images: {
      list: (id: string) => http.get<AdminDestinationImage[]>(`${A}/destinations/${id}/images`),
      // A new Hero image demotes the previous one.
      add: (id: string, body: DestinationImageInput) => http.post<AdminDestinationImage>(`${A}/destinations/${id}/images`, body),
      update: (id: string, imageId: string, body: DestinationImageInput) =>
        http.patch<AdminDestinationImage>(`${A}/destinations/${id}/images/${imageId}`, body),
      remove: (id: string, imageId: string) => http.del<void>(`${A}/destinations/${id}/images/${imageId}`),
      reorder: (id: string, imageIds: string[]) => http.put<void>(`${A}/destinations/${id}/images/order`, { imageIds }),
    },
  },

  featuredDestinations: {
    // Display order, including expired entries (isActive: false).
    list: () => http.get<AdminFeaturedDestination[]>(`${A}/featured-destinations`),
    // Must list every featured destination exactly once. Returns the list.
    reorder: (destinationIds: string[]) =>
      http.put<AdminFeaturedDestination[]>(`${A}/featured-destinations/order`, { destinationIds }),
  },

  tags: {
    list: () => http.get<AdminTag[]>(`${A}/tags`),
    create: (body: TagInput) => http.post<AdminTag>(`${A}/tags`, body),
    update: (id: string, body: Partial<TagInput>) => http.patch<AdminTag>(`${A}/tags/${id}`, body),
    remove: (id: string) => http.del<void>(`${A}/tags/${id}`), // 409 while in use
  },
  categories: {
    list: () => http.get<AdminCategory[]>(`${A}/categories`),
    create: (body: CategoryInput) => http.post<AdminCategory>(`${A}/categories`, body),
    update: (id: string, body: Partial<CategoryInput>) => http.patch<AdminCategory>(`${A}/categories/${id}`, body),
    remove: (id: string) => http.del<void>(`${A}/categories/${id}`), // 409 while in use
  },
  countries: {
    list: () => http.get<AdminCountry[]>(`${A}/countries`),
    create: (body: CountryInput) => http.post<AdminCountry>(`${A}/countries`, body),
    update: (id: string, body: Partial<CountryInput>) => http.patch<AdminCountry>(`${A}/countries/${id}`, body),
  },
  cities: {
    list: (p: { countryId?: string; search?: string } = {}) => http.get<AdminCity[]>(`${A}/cities${qs(p)}`),
    create: (body: CityInput) => http.post<AdminCity>(`${A}/cities`, body),
    update: (id: string, body: Partial<CityInput>) => http.patch<AdminCity>(`${A}/cities/${id}`, body),
  },

  wishlists: {
    list: (p: Paging & { search?: string; sort?: string }) =>
      http.get<AdminPaged<AdminWishlistSummary>>(`${A}/wishlists${qs(p)}`),
    get: (id: string) => http.get<AdminWishlistDetail>(`${A}/wishlists/${id}`),
    create: (body: WishlistInput) => http.post<AdminWishlistDetail>(`${A}/wishlists`, body),
    // Include xmin to get a 409 if someone else edited it since you loaded it.
    update: (id: string, body: WishlistInput) => http.patch<AdminWishlistDetail>(`${A}/wishlists/${id}`, body),
    remove: (id: string) => http.del<void>(`${A}/wishlists/${id}`), // 409 if forked/used by trips
    setDestinations: (id: string, destinationIds: string[]) =>
      http.put<void>(`${A}/wishlists/${id}/destinations`, { destinationIds }),
    feature: (id: string, featuredUntil?: string | null) =>
      http.post<void>(`${A}/wishlists/${id}/feature`, { featuredUntil: featuredUntil ?? null }),
    unfeature: (id: string) => http.post<void>(`${A}/wishlists/${id}/unfeature`, {}),
    itinerary: {
      addDay: (id: string, body: ItineraryDayInput) => http.post<AdminItineraryDay>(`${A}/wishlists/${id}/itinerary/days`, body),
      updateDay: (id: string, dayId: string, body: ItineraryDayInput) =>
        http.put<AdminItineraryDay>(`${A}/wishlists/${id}/itinerary/days/${dayId}`, body),
      removeDay: (id: string, dayId: string) => http.del<void>(`${A}/wishlists/${id}/itinerary/days/${dayId}`),
      addItem: (id: string, dayId: string, body: ItineraryItemInput) =>
        http.post<AdminItineraryItem>(`${A}/wishlists/${id}/itinerary/days/${dayId}/items`, body),
      updateItem: (id: string, dayId: string, itemId: string, body: ItineraryItemInput) =>
        http.put<AdminItineraryItem>(`${A}/wishlists/${id}/itinerary/days/${dayId}/items/${itemId}`, body),
      removeItem: (id: string, dayId: string, itemId: string) =>
        http.del<void>(`${A}/wishlists/${id}/itinerary/days/${dayId}/items/${itemId}`),
      reorder: (id: string, body: { dayOrder: string[]; itemOrder: { dayId: string; itemIds: string[] }[] }) =>
        http.put<void>(`${A}/wishlists/${id}/itinerary/order`, body),
    },
    // Creator credits on platform wishlists (admin-only).
    attributions: {
      list: (wishlistId: string) => http.get<AdminAttribution[]>(`/api/wishlists/${wishlistId}/attributions`),
      add: (wishlistId: string, body: AttributionInput) =>
        http.post<AdminAttribution>(`/api/wishlists/${wishlistId}/attributions`, body),
      update: (wishlistId: string, attributionId: string, body: AttributionInput) =>
        http.patch<AdminAttribution>(`/api/wishlists/${wishlistId}/attributions/${attributionId}`, body),
      remove: (wishlistId: string, attributionId: string) =>
        http.del<void>(`/api/wishlists/${wishlistId}/attributions/${attributionId}`),
    },
  },

  featuredPool: {
    list: () => http.get<AdminFeaturedPoolEntry[]>(`${A}/featured-pool`),
    create: (body: FeaturedPoolInput) => http.post<AdminFeaturedPoolEntry>(`${A}/featured-pool`, body),
    update: (id: string, body: FeaturedPoolInput) => http.patch<AdminFeaturedPoolEntry>(`${A}/featured-pool/${id}`, body),
    remove: (id: string) => http.del<void>(`${A}/featured-pool/${id}`),
  },

  creators: {
    list: (p: Paging & { search?: string; verified?: boolean }) =>
      http.get<AdminPaged<AdminCreator>>(`${A}/creators${qs(p)}`),
    create: (body: CreatorInput) => http.post<AdminCreator>(`/api/creators`, body),
    update: (id: string, body: CreatorInput) => http.patch<AdminCreator>(`/api/creators/${id}`, body),
  },

  trips: {
    list: (p: Paging & { search?: string; status?: string; hidden?: boolean; authorId?: string; from?: string; to?: string }) =>
      http.get<AdminPaged<AdminTripSummary>>(`${A}/trips${qs(p)}`),
    get: (id: string) => http.get<AdminTripDetail>(`${A}/trips/${id}`),
    messages: (id: string, p: Paging = {}) => http.get<AdminPaged<AdminThreadMessage>>(`${A}/trips/${id}/messages${qs(p)}`),
    hide: (id: string, reason: string) => http.post<void>(`${A}/trips/${id}/hide`, { reason }),
    unhide: (id: string) => http.post<void>(`${A}/trips/${id}/unhide`, {}),
    // Notifies the author and members.
    cancel: (id: string, reason?: string) => http.post<void>(`${A}/trips/${id}/cancel`, { reason: reason || null }),
    deleteMessage: (id: string, messageId: string) => http.del<void>(`${A}/trips/${id}/messages/${messageId}`),
  },

  partners: {
    list: () => http.get<AdminPartnerSummary[]>(`${A}/partners`),
    get: (id: string) => http.get<AdminPartnerDetail>(`${A}/partners/${id}`),
    create: (body: PartnerInput) => http.post<AdminPartnerDetail>(`${A}/partners`, body),
    update: (id: string, body: PartnerInput) => http.patch<AdminPartnerDetail>(`${A}/partners/${id}`, body),
    activate: (id: string) => http.post<void>(`${A}/partners/${id}/activate`, {}),
    deactivate: (id: string) => http.post<void>(`${A}/partners/${id}/deactivate`, {}),
    stats: (id: string, range: { from?: string; to?: string } = {}) =>
      http.get<ClickStats>(`${A}/partners/${id}/stats${qs(range)}`),
  },

  partnerLinks: {
    list: (f: { partnerId?: string; destinationId?: string; wishlistId?: string; active?: boolean } = {}) =>
      http.get<AdminPartnerLink[]>(`${A}/partner-links${qs(f)}`),
    get: (linkId: string) => http.get<AdminPartnerLink>(`${A}/partner-links/${linkId}`),
    create: (body: PartnerLinkInput) => http.post<AdminPartnerLink>(`${A}/partner-links`, body),
    update: (linkId: string, body: PartnerLinkInput) => http.patch<AdminPartnerLink>(`${A}/partner-links/${linkId}`, body),
    // Hard delete, including click history — prefer isActive: false.
    remove: (linkId: string) => http.del<void>(`${A}/partner-links/${linkId}`),
    stats: (linkId: string, range: { from?: string; to?: string } = {}) =>
      http.get<ClickStats>(`${A}/partner-links/${linkId}/stats${qs(range)}`),
  },

  partnerLeads: {
    list: (p: Paging & { search?: string; status?: string }) =>
      http.get<AdminPaged<AdminPartnerLead>>(`${A}/partner-leads${qs(p)}`),
    get: (id: string) => http.get<AdminPartnerLead>(`${A}/partner-leads/${id}`),
    update: (id: string, body: { status?: LeadStatus; internalNotes?: string | null }) =>
      http.patch<AdminPartnerLead>(`${A}/partner-leads/${id}`, body),
  },
};

// Fills a sparse daily series (zero days omitted by the API) into one entry
// per UTC day from `start`, `days` long.
export function fillDailySeries(series: { date: string; count?: number; clicks?: number }[], start: string, days: number) {
  const byDay = new Map<string, number>();
  for (const p of series ?? []) byDay.set(p.date.slice(0, 10), p.count ?? p.clicks ?? 0);
  const out: { date: string; value: number }[] = [];
  const d0 = new Date(`${start.slice(0, 10)}T00:00:00Z`);
  for (let i = 0; i < days; i++) {
    const d = new Date(d0.getTime() + i * 86400000).toISOString().slice(0, 10);
    out.push({ date: d, value: byDay.get(d) ?? 0 });
  }
  return out;
}
