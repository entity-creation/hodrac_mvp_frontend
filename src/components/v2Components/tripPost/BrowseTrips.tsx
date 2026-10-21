import { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, X, PlusCircle, MapPin, Map } from "lucide-react";
import TripFeedCard, { TripCardSkeleton } from "./TripFeedCard";
import TripPlaceSearch, { type PlaceSelection } from "./TripPlaceSearch";
import type { BrowseTripsFilters, TripApiClient, TripPost } from "../../../types";
import { useTripInterestHub, useTripPostCreatedHub, useTripPostLifecycleHub, type TripInterestUpdate } from "../../../hooks/v2Hooks/useSignalR";
import { useRequireAuth } from "../../../hooks/v2Hooks/useRequireAuth";
import { Button, EmptyState, PageHeader } from "../ui";
import { createTripForPlacePath } from "../../../utils/v2Utils/routes";
import { tripMatchesPlace } from "../../../utils/v2Utils/trips";
import { isApiError, normalizeInterestStatus, normalizeTrip } from "../../../dataStore/v2Api/client";

const PAGE_SIZE = 24;
const RATE_LIMIT_MSG = "Too many searches in a short time. Please wait a minute and try again.";

interface BrowseTripsProps {
  api: TripApiClient;
}

// Filters live in the URL so detail pages can deep-link here, e.g.
// /browse-trip?destinationId=…&place=Kyoto
function filtersFromParams(params: URLSearchParams): BrowseTripsFilters {
  return {
    destination: params.get("dest") ?? "",
    from: params.get("from") ?? "",
    to: params.get("to") ?? "",
    destinationId: params.get("destinationId") ?? undefined,
    wishlistId: params.get("wishlistId") ?? undefined,
  };
}

// All filtering happens here on the client, so search works whether or not
// the API applies dest/from/to/destinationId/wishlistId itself.
function matchesFilters(trip: TripPost, f: BrowseTripsFilters): boolean {
  if (!tripMatchesPlace(trip, f)) return false;

  // Free text: trip name or any stop name.
  const text = f.destination.trim().toLowerCase();
  if (text) {
    const haystack = [trip.destinationLabel, ...(trip.stops ?? []).map(s => s.name)]
      .filter(Boolean)
      .map(s => s.toLowerCase());
    if (!haystack.some(s => s.includes(text))) return false;
  }

  // Dates: keep trips whose range overlaps the chosen range. Flexible or
  // undated trips always match.
  if ((f.from || f.to) && !trip.isDateFlexible && (trip.startDate || trip.endDate)) {
    const start = trip.startDate ?? trip.endDate!;
    const end = trip.endDate ?? trip.startDate!;
    if (f.from && end.slice(0, 10) < f.from) return false;
    if (f.to && start.slice(0, 10) > f.to) return false;
  }

  return true;
}

const inputClass =
  "w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-ink transition-colors";

// Standalone page: search/filter all open trips, not just people you follow.
export default function BrowseTrips({ api }: BrowseTripsProps) {
  const navigate = useNavigate();
  const requireAuth = useRequireAuth();
  const [params, setParams] = useSearchParams();
  const applied = filtersFromParams(params);
  const placeName = params.get("place");
  const placeFilterActive = !!(applied.destinationId || applied.wishlistId);

  // The chosen destination/wishlist comes straight from the URL.
  const selectedPlace: PlaceSelection | null = applied.destinationId
    ? { kind: "destination", id: applied.destinationId, name: placeName ?? "Selected destination" }
    : applied.wishlistId
      ? { kind: "wishlist", id: applied.wishlistId, name: placeName ?? "Selected wishlist" }
      : null;

  // Date inputs, applied to the URL on submit.
  const [from, setFrom] = useState(applied.from);
  const [to, setTo] = useState(applied.to);

  const [trips, setTrips] = useState<TripPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // Paging only applies to the public (signed-out) endpoint.
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  const handleInterestUpdate = useCallback((update: TripInterestUpdate) => {
    if (update.event === "statusChanged" && update.interest) {
      const interest = update.interest;
      setTrips((prev) =>
        prev.map((trip) =>
          trip.id === interest.tripPostId ? { ...trip, myInterestStatus: normalizeInterestStatus(interest.status) } : trip
        )
      );
    }
  }, []);

  useTripInterestHub({ onUpdate: handleInterestUpdate });

  const queryKey = params.toString();

  const handlePostUpdate = useCallback((update: TripInterestUpdate) => {
    if (update.event !== "tripPostCreated" || !update.tripPost) return;
    const post = normalizeTrip(update.tripPost);
    if (!matchesFilters(post, filtersFromParams(new URLSearchParams(queryKey)))) return;
    setTrips((prev) => (prev.some((t) => t.id === post.id) ? prev : [post, ...prev]));
  }, [queryKey]);

  useTripPostCreatedHub({ onUpdate: handlePostUpdate });

  // Hidden/removed trips vanish; closed or cancelled ones leave the open list.
  const handleTripRemoved = useCallback((tripId: string) => {
    setTrips((prev) => prev.filter((t) => t.id !== tripId));
  }, []);
  const handleTripStatus = useCallback((tripId: string, status: unknown) => {
    setTrips((prev) => {
      const next = prev.map((t) => (t.id === tripId ? normalizeTrip({ ...t, status: status as TripPost["status"] }) : t));
      return next.filter((t) => t.id !== tripId || t.status === "Open");
    });
  }, []);
  useTripPostLifecycleHub({ onRemoved: handleTripRemoved, onStatusChanged: handleTripStatus });

  // Reload whenever the URL filters change.
  useEffect(() => {
    let cancelled = false;
    const f = filtersFromParams(new URLSearchParams(queryKey));
    setFrom(f.from);
    setTo(f.to);
    setLoading(true);
    setError("");
    setPage(1);
    // Signed in: /browse. Signed out: /public (paged). Filters go to the API
    // and are re-checked on the client so results are right either way.
    api
      .findTrips(f, 1, PAGE_SIZE)
      .then((res) => {
        if (cancelled) return;
        setTrips(res.items.filter((t) => matchesFilters(t, f)));
        setTotalPages(res.totalPages);
        setTotalCount(res.totalCount);
      })
      .catch((e) => {
        if (cancelled) return;
        setTrips([]);
        setError(isApiError(e, 429) ? RATE_LIMIT_MSG : "We couldn't load trips right now.");
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [api, queryKey]);

  const loadMore = async () => {
    const f = filtersFromParams(new URLSearchParams(queryKey));
    setLoadingMore(true);
    try {
      const res = await api.findTrips(f, page + 1, PAGE_SIZE);
      const fresh = res.items.filter((t) => matchesFilters(t, f));
      setTrips((prev) => [...prev, ...fresh.filter((t) => !prev.some((p) => p.id === t.id))]);
      setPage(res.page);
      setTotalPages(res.totalPages);
    } catch (e) {
      setError(isApiError(e, 429) ? RATE_LIMIT_MSG : "We couldn't load more trips.");
    } finally {
      setLoadingMore(false);
    }
  };

  const updateParams = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    setParams(next);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateParams({ from: from || null, to: to || null });
  };

  // Picking a destination/wishlist or searching text replaces any other place filter.
  const selectPlace = (sel: PlaceSelection) =>
    updateParams({
      destinationId: sel.kind === "destination" ? sel.id : null,
      wishlistId: sel.kind === "wishlist" ? sel.id : null,
      place: sel.name,
      dest: null,
      from: from || null,
      to: to || null,
    });

  const searchText = (text: string) =>
    updateParams({ dest: text || null, destinationId: null, wishlistId: null, place: null, from: from || null, to: to || null });

  const clearPlace = () => updateParams({ destinationId: null, wishlistId: null, place: null, dest: null });
  const clearAll = () => setParams(new URLSearchParams());

  const handleRequestToJoin = async (tripId: string) => {
    await api.requestToJoin(tripId);
    setTrips((prev) =>
      prev.map((trip) => (trip.id === tripId ? { ...trip, myInterestStatus: "Requested" } : trip))
    );
  };

  const handleResponseToInterest = (tripId: string, interestId: string, approve: boolean) =>
    api.respondToInterest(tripId, interestId, approve);

  const createPath = createTripForPlacePath({
    destinationId: applied.destinationId,
    wishlistId: applied.wishlistId,
  });
  const anyFilter = placeFilterActive || !!(applied.destination || applied.from || applied.to);

  return (
    <div className="max-w-7xl mx-auto px-5 md:px-8 pb-20">
      <PageHeader
        label="Travel together"
        title={placeFilterActive && placeName ? `Trips to ${placeName}` : applied.destination ? `Trips matching “${applied.destination}”` : "Find people going your way"}
        subtitle="Browse open trips, see who's heading where you want to go, and ask to tag along. Or post your own."
      >
        <div className="mt-6">
          <Button onClick={() => requireAuth(() => navigate(createPath), createPath)}>
            <PlusCircle className="w-4 h-4" /> Post a trip
          </Button>
        </div>
      </PageHeader>

      {/* Search / Filters */}
      <form
        onSubmit={handleSearchSubmit}
        className="bg-white border border-line rounded-3xl p-4 md:p-5 mb-6 shadow-pop"
      >
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="flex-1">
            <span className="block text-xs font-medium text-ink-soft mb-1.5 px-1">Where to?</span>
            <TripPlaceSearch
              selected={selectedPlace}
              text={applied.destination}
              onSelect={selectPlace}
              onText={searchText}
              onClear={clearPlace}
            />
          </div>
          <label className="w-full lg:w-44">
            <span className="block text-xs font-medium text-ink-soft mb-1.5 px-1">From</span>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={inputClass} />
          </label>
          <label className="w-full lg:w-44">
            <span className="block text-xs font-medium text-ink-soft mb-1.5 px-1">To</span>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={inputClass} />
          </label>
          <div className="flex items-end">
            <Button type="submit" variant="dark" size="lg" fullWidth loading={loading}>
              <Search className="w-4 h-4" /> Search
            </Button>
          </div>
        </div>
      </form>

      {/* Active filter chips */}
      {anyFilter && (
        <div className="flex flex-wrap items-center gap-2 mb-6">
          {placeFilterActive && (
            <button
              onClick={clearPlace}
              className="inline-flex items-center gap-1.5 rounded-full bg-cream-deep border border-line px-3 py-1.5 text-sm text-ink hover:border-ink transition-colors"
            >
              {applied.wishlistId ? <Map className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
              {placeName ? `Trips to ${placeName}` : "This place"}
              <X className="w-4 h-4" />
            </button>
          )}
          {applied.destination && (
            <button
              onClick={() => updateParams({ dest: null })}
              className="inline-flex items-center gap-1.5 rounded-full bg-cream-deep border border-line px-3 py-1.5 text-sm text-ink hover:border-ink transition-colors"
            >
              <Search className="w-4 h-4" />
              “{applied.destination}”
              <X className="w-4 h-4" />
            </button>
          )}
          {(applied.from || applied.to) && (
            <button
              onClick={() => updateParams({ from: null, to: null })}
              className="inline-flex items-center gap-1.5 rounded-full bg-cream-deep border border-line px-3 py-1.5 text-sm text-ink hover:border-ink transition-colors"
            >
              {applied.from || "Any"} – {applied.to || "Any"}
              <X className="w-4 h-4" />
            </button>
          )}
          <button onClick={clearAll} className="text-sm font-medium text-ink-soft hover:text-ink underline underline-offset-4">
            Clear all
          </button>
        </div>
      )}

      {!loading && trips.length > 0 && (
        <p className="text-sm font-semibold text-ink-muted mb-6">
          {Math.max(trips.length, totalCount).toLocaleString()} {Math.max(trips.length, totalCount) === 1 ? "trip" : "trips"} open
        </p>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => <TripCardSkeleton key={index} />)}
        </div>
      ) : trips.length === 0 ? (
        <EmptyState
          emoji={error ? "😵" : "🧭"}
          title={error || (placeFilterActive && placeName ? `No one's planning ${placeName} yet` : "No trips found")}
          subtitle={error ? "Please try again in a moment." : "Be the first: post a trip and let others join you."}
          action={
            <div className="flex flex-wrap gap-3 justify-center">
              <Button onClick={() => requireAuth(() => navigate(createPath), createPath)}>
                <PlusCircle className="w-4 h-4" /> Post a trip
              </Button>
              {anyFilter && <Button variant="outline" onClick={clearAll}>Clear filters</Button>}
            </div>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {trips.map((trip, index) => (
            <motion.div
              key={trip.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.3) }}
              className="h-full"
            >
              <TripFeedCard
                trip={trip}
                currentUserId={api.currentUserId}
                myInterestStatus={trip.myInterestStatus}
                onRequestToJoin={handleRequestToJoin}
                onRespondToInterest={handleResponseToInterest}
                onOpenThread={(id) => navigate(`/trip-thread/${id}`)}
              />
            </motion.div>
          ))}
        </div>
      )}

      {!loading && trips.length > 0 && page < totalPages && (
        <div className="flex flex-col items-center gap-3 mt-12">
          <Button variant="outline" size="lg" loading={loadingMore} onClick={loadMore}>
            Load more trips
          </Button>
          {error && <p className="text-sm text-red-700">{error}</p>}
        </div>
      )}
    </div>
  );
}
