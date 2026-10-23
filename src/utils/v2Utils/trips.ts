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

// How full a trip is, for display. Head-counts only come on logged-in
// responses; logged-out visitors just see the size limit.
export function tripCapacity(trip: TripPost): {
  going: number | null;
  spotsLeft: number | null; // null = no limit, or counts not available
  isFull: boolean;
  label: string | null; // e.g. "3 going · 2 spots left", "Full", "Up to 5"
} {
  const going = typeof trip.goingCount === "number" ? trip.goingCount : null;
  const spotsLeft = typeof trip.spotsLeft === "number" ? trip.spotsLeft : null;
  const isFull = spotsLeft === 0;

  if (going !== null) {
    const goingText = `${going} going`;
    if (isFull) return { going, spotsLeft, isFull, label: `${goingText} · Full` };
    if (spotsLeft !== null) return { going, spotsLeft, isFull, label: `${goingText} · ${spotsLeft} ${spotsLeft === 1 ? "spot" : "spots"} left` };
    return { going, spotsLeft, isFull, label: goingText };
  }
  return { going, spotsLeft, isFull, label: trip.maxGroupSize ? `Up to ${trip.maxGroupSize}` : null };
}
