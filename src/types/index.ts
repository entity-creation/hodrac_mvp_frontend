// ─── Auth ──────────────────────────────────────────────────────────────────────

export interface UserDto {
  userId: string;
  email: string;
  displayName: string;
  avatarUrl: string;
  hasCompletedOnboarding: boolean;
  emailConfirmed: boolean;
  notificationEmailOptIn: boolean;
  // ISO 3166-1 alpha-2 home country; drives the display currency.
  countryCode?: string | null;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: UserDto;
}

// ─── Currency ─────────────────────────────────────────────────────────────────

// GET /api/currency/rates?base=USD — units of each currency per 1 `base`.
export interface ExchangeRates {
  base: string;
  updatedAt: string;
  rates: Record<string, number>;
}

// ─── Partners (paid placements) ───────────────────────────────────────────────

// A travel business that has paid to sponsor or curate a wishlist or
// destination. When present, the UI shows its branding and a Book button
// that sends traffic to the partner.
export interface Partner {
  partnerId: string;
  name: string;
  logoUrl: string | null;
  bookingUrl: string;
  // Server-side click-logging redirect (GET /api/out/{linkId}); preferred
  // over bookingUrl when present so clicks are counted reliably.
  trackingUrl: string | null;
  ctaLabel: string | null;
  isSponsored: boolean;
}

export interface PartnerLeadPayload {
  companyName: string;
  contactName: string;
  email: string;
  website: string;
  businessType: string;
  interests: string[];
  message: string;
}

// ─── Destinations ─────────────────────────────────────────────────────────────

export interface DestinationSummary {
  destinationId: string;
  destinationName: string;
  location: string;
  thumbnailUrl: string;
  averageCostPerDay: number;
  safetyLevel: number;
  luxuryRating: number;
  tags: string[];
  categories: string[];
  partner?: Partner | null;
}

export interface DestinationImage {
  imageUrl: string;
  thumbnailUrl: string;
  caption: string;
  displayOrder: number;
  imageType: string; // "Hero" | "Gallery" | "Activity_Proof" | "Map_Overlay"
}

export interface DescriptionJson {
  overview: string;
  localPerspective: string;
  directions: string;
  whatToKnow: string;
  thingsToBeWaryOf: string;
  hiddenCost: string;
  nearbyComplements: string[];
  bestTimeToVisit: string;
  crowdLevel: string;
  accessibility: string;
  idealDuration: string;
}

export interface DestinationDetail extends DestinationSummary {
  countryName: string;
  timeZone: string;
  familyFriendlyScore: number;
  adventurePaceScore: number;
  accessibilityType: string
  description: DescriptionJson;
  languages: string[];
  currencies: string[];
  cities: string[];
  images: DestinationImage[];
}

// ─── Wishlists ────────────────────────────────────────────────────────────────

export interface WishlistCard {
  wishlistId: string;
  wishlistName: string;
  wishlistDescription: string;
  shortStory: string;
  wishlistHeroImage: string;
  totalDays: number;
  peopleType: string;
  basePricePerPerson: number;
  calculatedTotalCost: number;
  totalGlobalSaveCount: number;
  isFeatured: boolean;
  psychologicalVibeTags: string[];
  primaryPersonaTarget: string;
  partner?: Partner | null;
}

export interface ItineraryItem {
  itemId: string;
  // Position within the day; the itinerary edit routes use it.
  orderIndex: number;
  title: string;
  description: string;
  timeOfDay: string;
  imageUrl: string;
  socialProofBadge: string;
  costModifier: number;
  isOptional: boolean;
  isSelectedByDefault: boolean;
}

export interface TransitRoute {
  transitType: string;
  fromCity: string;
  toCity: string;
  costPerPerson: number;
  durationMinutes: number;
}

export interface ItineraryDay {
  dayId: string;
  dayNumber: number;
  dayTitle: string;
  morningCity: string | null;
  afternoonCity: string | null;
  eveningCity: string | null;
  transitFromPreviousDay: TransitRoute | null;
  items: ItineraryItem[];
}

export interface PricingSnapshot {
  travelersCount: number;
  basePricePerPerson: number;
  optionalActivitiesTotal: number;
  depositAmountRequired: number;
  validUntil: string;
  totalEstimate: number;
}

export interface CollaboratorDto {
  userId: string;
  email: string;
  role: string; // "Owner" | "Editor" | "Viewer"
  joinedAt: string;
}

export interface WishlistDetail extends WishlistCard {
  depositAmountRequired: number;
  globalInclusions: string[];
  accommodationInclusions: string;
  transitInclusions: string;
  activityInclusions: string;
  defaultTravelersCount: number
  itineraryDays: ItineraryDay[];
  activePricingSnapshot: PricingSnapshot | null;
  isUserOwner: boolean;
  isCollaborator: boolean;
  userRole: string; // "Owner" | "Editor" | "Viewer" | "None"
  creatorAttributions: WishlistCreatorAttributionDto[];
    /**
   * PostgreSQL xmin concurrency token. Pass this back in the PUT body
   * as `xmin` to enable optimistic concurrency — the server returns 409
   * if another collaborator saved between your GET and your PUT.
   */
  xmin: number;
}

// ─── Creator attribution ──────────────────────────────────────────────────────

export interface CreatorDto {
  creatorId:    string;
  displayName:  string;
  handle:       string;
  platformName: string;
  profileUrl:   string;
  avatarUrl:    string | null;
  bio:          string | null;
  isVerified:   boolean;
}

export interface WishlistCreatorAttributionDto {
  wishlistCreatorAttributionId: string;
  wishlistId:            string;
  creator:               CreatorDto;
  originalContentUrl:    string;
  permissionType:        string;
  permissionGrantedAt:   string;
  permissionEvidenceUrl: string | null;
  isActive:              boolean;
  attributionNote:       string | null;
  createdAt:             string;
}


// ─── Filter options ───────────────────────────────────────────────────────────

export interface TagDto {
  tagId: string;
  key: string;
  tagName: string;
  targetPersonaType: string;
}

export interface CategoryDto {
  categoryId: string;
  key: string;
  categoryName: string;
  categoryDescription: string;
  iconName: string;
  colorHex: string;
}

export interface CountryDto {
  countryId: string;
  countryName: string;
  continent: string;
  flagEmoji: string;
  heroImage: string;
  destinationCount: number;
}

export interface PriceRange { min: number; max: number; }
export interface RangeDto   { min: number; max: number; }

export interface SortOption {
  value: string;
  label: string;
}

export interface FilterOptions {
  tags: TagDto[];
  categories: CategoryDto[];
  countries: CountryDto[];
  personaTypes: string[];
  destinationPriceRange: PriceRange;
  luxuryRatings: RangeDto;
  safetyLevels: RangeDto;
  accessibilityTypes: string[];
  wishlistPriceRange: PriceRange;
  tripDurations: RangeDto;
  destinationSortOptions: SortOption[];
  wishlistSortOptions: SortOption[];
}

// ─── Paged results ────────────────────────────────────────────────────────────

export interface PagedResult<T> {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  items: T[];
}

// ─── Saved content ────────────────────────────────────────────────────────────

export interface SavedContent {
  savedWishlists: WishlistCard[];
  savedDestinations: DestinationSummary[];
}

// ─── Search ───────────────────────────────────────────────────────────────────

export interface SearchResponse {
  canonicalPhrase: string;
  clusterId: string;
  destinations: DestinationSummary[];
  wishlists: WishlistCard[];
}

// ─── Psychographic profile ────────────────────────────────────────────────────

export interface UserProfile {
  userId: string;
  travelGroup: string;
  budgetProfile: string;
  primaryPriority: string;
  topTags: string[];
  primaryTravelerType: string;
  secondaryTravelerTypes: string[];
}

// ─── News Letter Emial ────────────────────────────────────────────────────
export interface NewsLetterEmail {
  userEmail: string;
}

// ─── Explore filters (query params) ──────────────────────────────────────────

export interface DestinationFilters {
  tags?: string;
  categories?: string;
  countryId?: string;
  accessibility?: string;
  minLuxury?: number;
  maxLuxury?: number;
  maxSafetyLevel?: number;
  minFamilyScore?: number;
  minAdventureScore?: number;
  minCost?: number;
  maxCost?: number;
  sort?: string;
  page?: number;
  pageSize?: number;
}

export interface WishlistFilters {
  vibeTags?: string;
  personaTypes?: string;
  minPrice?: number;
  maxPrice?: number;
  minDays?: number;
  maxDays?: number;
  sort?: string;
  page?: number;
  pageSize?: number;
}

// Shared types for the trip-posting feature. Mirrors backend/Dtos/TripPostDto.cs
// and the Models — keep these in sync if the C# side changes shape.

export type TripPostStatus = "Open" | "Closed" | "Cancelled";

export type TripInterestStatus = "Requested" | "Approved" | "Declined" | "Withdrawn";

export interface TripStop {
  destinationId: string; // Guid
  name: string;
  imageUrl: string | null;
}

// Matches TripPostDto.FromEntity's flattened output — the frontend never
// branches on whether the post was Destination-mode, Wishlist-mode, or
// free-text; it just reads destinationLabel/stops/wishlistId.
export interface TripPost {
  id: string; // Guid
  // Omitted by the public endpoint (GET /api/trips/public).
  authorUserId?: string; // Guid
  destinationLabel: string;
  stops: TripStop[];
  wishlistId: string | null;
  startDate: string | null; // ISO date, e.g. "2027-06-01"
  endDate: string | null;
  isDateFlexible: boolean;
  caption: string;
  coverImageUrl: string | null;
  maxGroupSize: number | null;
  status: TripPostStatus;
  createdAt: string; // ISO datetime
  myInterestStatus?: TripInterestStatus | null;
}

export interface TripInterest {
  id: string; // Guid
  tripPostId: string;
  requesterUserId: string;
  requesterName: string; // hydrated for display; not on the raw entity
  status: TripInterestStatus;
  message: string | null;
  requestedAt: string;
  respondedAt: string | null;
}

export interface ThreadMessage {
  id: string;
  tripThreadId: string;
  senderUserId: string;
  body: string;
  createdAt: string;
}

export interface ThreadParticipant {
  displayName: string | undefined;
  userId: string;
  joinedAt: string;
}

export type NotificationType =
  | "InterestReceived"
  | "InterestApproved"
  | "InterestDeclined"
  | "NewThreadMessage"
  | "TripStartingSoon";

export interface TripNotification {
  id: string;
  recipientUserId: string;
  type: NotificationType;
  tripPostId: string | null;
  actorUserId: string | null;
  isRead: boolean;
  createdAt: string;
}

// ── Search results (destination/wishlist picker in the composer) ──────────

export interface DestinationSearchResult {
  id: string;
  name: string;
  country: string | null;
}

export interface WishlistSearchResult {
  id: string;
  name: string;
  stopNames: string[];
}

// ── Payloads the frontend sends ────────────────────────────────────────────

export interface CreateTripPayload {
  destinationId: string | null;
  wishlistId: string | null;
  freeTextDestination: string | null;
  startDate: string | null;
  endDate: string | null;
  isDateFlexible: boolean;
  caption: string;
  maxGroupSize: number | null;
}

// PATCH /api/trips/{id} — every field optional; send only what changes.
// `status` is numeric on the wire: see TRIP_STATUS_CODE.
export interface UpdateTripPayload {
  caption?: string;
  startDate?: string | null;
  endDate?: string | null;
  isDateFlexible?: boolean;
  coverImageUrl?: string | null;
  maxGroupSize?: number | null;
  status?: TripPostStatus;
}

export const TRIP_STATUS_CODE: Record<TripPostStatus, number> = {
  Open: 0,
  Closed: 1,
  Cancelled: 2,
};

export interface BrowseTripsFilters {
  destination: string;
  from: string;
  to: string;
  destinationId?: string;
  wishlistId?: string;
}

// Row shapes for the "My Trips" page.
export interface MyTripRequest {
  interestId: string;
  status: TripInterestStatus;
  message: string | null;
  requestedAt: string;
  respondedAt: string | null;
  trip: TripPost;
}

export interface MyTripPost {
  trip: TripPost;
  pendingInterestCount: number;
  hasThread: boolean;
}

// ── API client contract ────────────────────────────────────────────────────
// The host app implements this against its real HTTP client / SignalR
// connection and passes it into these components as the `api` prop.

export interface TripApiClient {
  currentUserId: string;

  searchDestinations(query: string): Promise<DestinationSearchResult[]>;
  searchWishlists(query: string): Promise<WishlistSearchResult[]>;
  createTrip: (payload: CreateTripPayload) => Promise<TripPost>;

  browseTrips(filters: BrowseTripsFilters): Promise<TripPost[]>;
  // Logged-out listing: no auth, paged, rate-limited (60/min per IP).
  browsePublicTrips(filters: BrowseTripsFilters, page?: number, pageSize?: number): Promise<PagedResult<TripPost>>;
  // Picks browse (signed in: includes my request status) or public (signed out).
  findTrips(filters: BrowseTripsFilters, page?: number, pageSize?: number): Promise<PagedResult<TripPost>>;
  updateTrip(tripId: string, changes: UpdateTripPayload): Promise<TripPost>;
  getTrip: (tripId: string) => Promise<TripPost>;
  requestToJoin(tripId: string): Promise<void>;
  openThread(tripId: string): void;

  // "My Trips" page
  getMyRequests(): Promise<MyTripRequest[]>;
  getMyPosts(): Promise<MyTripPost[]>;
  getInterests(tripId: string): Promise<TripInterest[]>;
  respondToInterest(tripId: string, interestId: string, approve: boolean): Promise<void>;
  withdrawInterest(tripId: string, interestId: string): Promise<void>;

  getThreadMessages(tripId: string): Promise<ThreadMessage[]>;
  sendMessage(tripId: string, body: string): Promise<ThreadMessage>;
  subscribeToThread?(tripId: string, onMessage: (message: ThreadMessage) => void): () => void;
  subscribeToInterestUpdate?(onupdate: (args: TripInterest) => void): () => void
  getNotifications(): Promise<TripNotification[]>;
  getUnreadNotificationCount(): Promise<number>;
  markNotificationRead(id: string): Promise<void>;
  markAllNotificationsRead(): Promise<void>;
}
