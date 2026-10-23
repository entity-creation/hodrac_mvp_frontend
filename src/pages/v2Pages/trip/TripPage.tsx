import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CalendarDays, Map, MapPin, MessageCircle, Users } from "lucide-react";
import { isApiError, tripClient } from "../../../dataStore/v2Api/client";
import { useAuth } from "../../../hooks/v2Hooks/useAuth";
import { useRequireAuth } from "../../../hooks/v2Hooks/useRequireAuth";
import { Badge, Button, EmptyState, FullPageSpinner } from "../../../components/v2Components/ui";
import ShareButton from "../../../components/v2Components/share/ShareButton";
import { tripCapacity } from "../../../utils/v2Utils/trips";
import { colourwayFor } from "../../../utils/v2Utils/format";
import { friendlyError, TRIP_CONFLICTS } from "../../../utils/v2Utils/apiErrors";
import { ROUTES } from "../../../utils/v2Utils/routes";
import type { TripPost, TripInterestStatus } from "../../../types";

// /trips/:id — the shareable trip page. Works without login (public endpoint:
// no author or head-counts); signed-in visitors get the full trip, including
// head-counts and their own request status.
export default function TripPage() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const requireAuth = useRequireAuth();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();

  const [trip, setTrip] = useState<TripPost | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "missing" | "error">("loading");
  const [joinBusy, setJoinBusy] = useState(false);
  const [joinError, setJoinError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    const load = async () => {
      // Signed in: the full trip; fall back to the public view if that fails.
      if (isAuthenticated) {
        try {
          return await tripClient.getTrip(id);
        } catch (e) {
          if (!isApiError(e, 404) && !isApiError(e, 403)) throw e;
        }
      }
      return tripClient.getPublicTrip(id);
    };
    load()
      .then(t => { if (!cancelled) { setTrip(t); setState("ready"); } })
      .catch(e => { if (!cancelled) setState(isApiError(e, 404) ? "missing" : "error"); });
    return () => { cancelled = true; };
  }, [id, isAuthenticated, authLoading]);

  if (state === "loading") return <FullPageSpinner />;

  if (state !== "ready" || !trip) {
    return (
      <EmptyState
        emoji="🧭"
        title={state === "missing" ? "This trip isn't available" : "Couldn't load this trip"}
        subtitle={state === "missing"
          ? "It may have been removed, or its author has taken it down."
          : "Please try again in a moment."}
        action={<Button onClick={() => navigate(ROUTES.PUBLIC.BROWSETRIPS)}>Browse open trips</Button>}
      />
    );
  }

  const capacity = tripCapacity(trip);
  const isAuthor = !!user?.userId && trip.authorUserId === user.userId;
  const status: TripInterestStatus | null = trip.myInterestStatus ?? null;
  const open = trip.status === "Open";
  const colour = colourwayFor(trip.id);

  const dateLabel = trip.isDateFlexible
    ? "Flexible dates"
    : trip.startDate || trip.endDate
      ? [trip.startDate, trip.endDate].filter(Boolean).map(d => new Date(d!).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })).join(" – ")
      : "Dates to be confirmed";

  const join = () =>
    requireAuth(async () => {
      setJoinBusy(true);
      setJoinError("");
      try {
        await tripClient.requestToJoin(trip.id);
        setTrip(t => (t ? { ...t, myInterestStatus: "Requested" } : t));
      } catch (e) {
        setJoinError(friendlyError(e, { 409: TRIP_CONFLICTS.join }, "Couldn't send your request."));
      } finally {
        setJoinBusy(false);
      }
    });

  const joinLabel =
    status === "Requested" ? "Request sent"
    : status === "Approved" ? "You're in"
    : status === "Declined" ? "Request declined"
    : !open ? `Trip ${trip.status.toLowerCase()}`
    : capacity.isFull ? "Trip full"
    : isAuthenticated ? "Request to join" : "Sign in to request to join";
  const canJoin = open && !isAuthor && !status && !capacity.isFull;

  return (
    <div className="max-w-5xl mx-auto px-5 md:px-8 pt-6 pb-24">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm text-ink-soft hover:text-ink">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <ShareButton type="trip" id={trip.id} label="Share this trip" />
      </div>

      <div className={`aspect-16/9 md:aspect-21/9 rounded-2xl overflow-hidden ${colour.bg}`}>
        {trip.coverImageUrl
          ? <img src={trip.coverImageUrl} alt="" className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center"><Map className="w-12 h-12 text-ink-muted" strokeWidth={1} /></div>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 pt-10">
        <div className="lg:col-span-2">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Badge tone="neutral">Trip</Badge>
            {!open && <Badge tone="sun">{trip.status}</Badge>}
            {trip.isHidden && isAuthor && <Badge tone="sponsored">Hidden by moderators</Badge>}
          </div>
          <h1 className="text-4xl md:text-5xl font-light text-ink leading-[1.05]">{trip.destinationLabel}</h1>

          <div className="flex flex-wrap gap-x-6 gap-y-2 mt-5 text-sm text-ink-soft">
            <span className="inline-flex items-center gap-1.5"><CalendarDays className="w-4 h-4" /> {dateLabel}</span>
            {capacity.label && <span className="inline-flex items-center gap-1.5"><Users className="w-4 h-4" /> {capacity.label}</span>}
          </div>

          {trip.caption && (
            <p className="mt-8 text-lg text-ink-soft leading-relaxed whitespace-pre-line">{trip.caption}</p>
          )}

          {trip.stops?.length > 0 && (
            <div className="mt-10">
              <p className="text-[11px] uppercase tracking-[0.25em] text-ink-muted mb-3">Stops</p>
              <div className="flex flex-wrap gap-2">
                {trip.stops.map(s => (
                  <Link key={s.destinationId} to={`/destinations/${s.destinationId}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-sm text-ink hover:border-ink transition-colors">
                    <MapPin className="w-3.5 h-3.5 text-ink-muted" /> {s.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {trip.wishlistId && (
            <Link to={`/wishlists/${trip.wishlistId}`} className="mt-8 inline-flex items-center gap-2 text-sm text-ink underline underline-offset-4">
              <Map className="w-4 h-4" /> See the itinerary this trip follows
            </Link>
          )}
        </div>

        <aside>
          <div className="sticky top-24 rounded-2xl border border-line bg-white p-6 flex flex-col gap-3 shadow-pop">
            <p className="text-sm text-ink-soft">
              {isAuthor ? "This is your trip." : "Like the sound of this? Ask to join, and the organiser decides who comes."}
            </p>
            {!isAuthor && (
              <Button fullWidth size="lg" onClick={join} loading={joinBusy} disabled={!canJoin}>
                {joinLabel}
              </Button>
            )}
            {(status === "Approved" || isAuthor) && (
              <Button fullWidth variant="outline" onClick={() => navigate(`/trip-thread/${trip.id}`)}>
                <MessageCircle className="w-4 h-4" /> Open trip chat
              </Button>
            )}
            {joinError && <p role="alert" className="text-sm text-red-700">{joinError}</p>}
            <ShareButton type="trip" id={trip.id} variant="button" label="Share with friends" />
            <Link to={ROUTES.PUBLIC.BROWSETRIPS} className="text-center text-sm text-ink-soft hover:text-ink underline underline-offset-4 mt-1">
              Browse more trips
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
