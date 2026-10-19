import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, PlusCircle } from "lucide-react";
import TripFeedCard, { TripCardSkeleton } from "./TripFeedCard";
import { tripClient } from "../../../dataStore/v2Api/client";
import { useRequireAuth } from "../../../hooks/v2Hooks/useRequireAuth";
import { Button } from "../ui";
import { createTripForPlacePath, tripsForPlacePath } from "../../../utils/v2Utils/routes";
import type { TripPost } from "../../../types";
import { tripMatchesPlace } from "../../../utils/v2Utils/trips";

interface TripsForPlaceProps {
  destinationId?: string;
  wishlistId?: string;
  placeName: string;
  limit?: number;
}

// "Who else is going here?" — open trips for a destination or wishlist,
// plus a CTA to post your own. Used on the wishlist and destination pages.
export default function TripsForPlace({ destinationId, wishlistId, placeName, limit = 3 }: TripsForPlaceProps) {
  const navigate = useNavigate();
  const requireAuth = useRequireAuth();
  const [trips, setTrips] = useState<TripPost[] | null>(null);
  // Total matching trips, which can exceed what we loaded when paged.
  const [total, setTotal] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setTrips(null);
    tripClient
      .findTrips({ destination: "", from: "", to: "", destinationId, wishlistId }, 1, 24)
      .then((r) => {
        if (cancelled) return;
        const matching = r.items.filter((t) => tripMatchesPlace(t, { destinationId, wishlistId }));
        setTrips(matching);
        // Paged (public) results carry the real total; otherwise count what matched.
        setTotal(r.totalPages > 1 ? Math.max(r.totalCount, matching.length) : matching.length);
      })
      .catch(() => { if (!cancelled) setTrips([]); });
    return () => { cancelled = true; };
  }, [destinationId, wishlistId]);

  const createPath = createTripForPlacePath({ destinationId, wishlistId });
  const seeAllPath = tripsForPlacePath({ destinationId, wishlistId, name: placeName });
  const planTrip = () => requireAuth(() => navigate(createPath), createPath);

  const handleRequestToJoin = async (tripId: string) => {
    await tripClient.requestToJoin(tripId);
    setTrips((prev) => prev?.map((t) => (t.id === tripId ? { ...t, myInterestStatus: "Requested" } : t)) ?? prev);
  };

  const visible = trips?.slice(0, limit) ?? [];

  return (
    <section id="trips" className="scroll-mt-24">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-ink-muted mb-3">Travel together</p>
          <h2 className="text-2xl md:text-3xl font-light text-ink">
            {trips && trips.length > 0
              ? `${total} ${total === 1 ? "trip" : "trips"} heading to ${placeName}`
              : `Travelling to ${placeName}`}
          </h2>
        </div>
        {trips && total > limit && (
          <Link to={seeAllPath} className="group inline-flex items-center gap-2 text-sm font-medium text-ink hover:text-brand-600">
            See all trips
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        )}
      </div>

      {trips === null ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({ length: Math.min(limit, 3) }).map((_, i) => <TripCardSkeleton key={i} />)}
        </div>
      ) : visible.length === 0 ? (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 bg-grape-50 border border-line rounded-3xl p-6 shadow-pop">
          
          <div className="flex-1">
            <p className="font-display text-xl font-normal text-ink">No one has shared a trip to {placeName} yet</p>
            <p className="text-sm text-ink-soft mt-1">Share your plans and other travellers can ask to join you.</p>
          </div>
          <Button onClick={planTrip} variant="secondary">
            <PlusCircle className="w-4 h-4" /> Share a trip
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {visible.map((trip) => (
              <TripFeedCard
                key={trip.id}
                trip={trip}
                currentUserId={tripClient.currentUserId}
                myInterestStatus={trip.myInterestStatus}
                onRequestToJoin={handleRequestToJoin}
                onRespondToInterest={tripClient.respondToInterest}
                onOpenThread={(id) => navigate(`/trip-thread/${id}`)}
              />
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-6">
            <Button onClick={planTrip} variant="secondary">
              <PlusCircle className="w-4 h-4" /> Share your own trip
            </Button>
            <Link to={seeAllPath} className="text-sm font-medium text-ink hover:text-brand-600 underline underline-offset-4">
              Browse all {placeName} trips
            </Link>
          </div>
        </>
      )}
    </section>
  );
}
