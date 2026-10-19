import type { TripPost } from "../../types";

export interface PlaceFilter {
  destinationId?: string | null;
  wishlistId?: string | null;
}

// Whether a trip belongs to a destination or wishlist.
// - Wishlist: the trip follows that wishlist.
// - Destination: any of the trip's stops is that destination.
//
// Applied on the client as well as sent to /api/trips/browse, so results stay
// correct even when the API ignores the destinationId/wishlistId params.
export function tripMatchesPlace(trip: TripPost, place: PlaceFilter): boolean {
  if (place.wishlistId && trip.wishlistId !== place.wishlistId) return false;
  if (place.destinationId && !trip.stops?.some(s => s.destinationId === place.destinationId)) return false;
  return true;
}
