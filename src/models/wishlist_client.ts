import type { DestinationClient, DestinationClientView } from "./destination_client";
import type { ItineraryDay, ItineraryItem } from "./itinerary_client";

export type ClientWishlistDto = {
  wishlistId: string;
  wishlistName: string;
  wishlistDescription: string;
  wishlistHeroImage: string;
  shortStory: string;
  totalDays: number;
  peopleType: string;
  itineraryDays: ItineraryDay[];
  itineraryItems: ItineraryItem[];
  destinations: DestinationClient[];
};

export type ClientWishlistView = {
  wishlistId: string;
  wishlistName: string;
  wishlistDescription: string;
  wishlistHeroImage: string;
  shortStory: string;
  totalDays: number;
  peopleType: string;
  itineraryDays: ItineraryDay[];
  itineraryItems: ItineraryItem[];
  destinations: DestinationClientView[];
};