// ─── Auth ──────────────────────────────────────────────────────────────────────

export interface UserDto {
  userId: string;
  email: string;
  displayName: string;
  avatarUrl: string;
  hasCompletedOnboarding: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: UserDto;
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
}

export interface ItineraryItem {
  itemId: string;
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
