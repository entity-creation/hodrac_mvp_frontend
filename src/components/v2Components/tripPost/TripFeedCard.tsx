import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, Users, MessageCircle, Map, Inbox } from "lucide-react";
import type {
  TripPost,
  TripInterestStatus,
  TripInterest,
} from "../../../types";
import { tripClient } from "../../../dataStore/v2Api/client";
import { useTripInterestUpdatedHub, type TripInterestUpdate } from "../../../hooks/v2Hooks/useSignalR";
import { useRequireAuth } from "../../../hooks/v2Hooks/useRequireAuth";
import { colourwayFor } from "../../../utils/v2Utils/format";
import { tripCapacity } from "../../../utils/v2Utils/trips";
import { Modal } from "../ui";
import { isApiError, normalizeInterestStatus } from "../../../dataStore/v2Api/client";
import { friendlyError, TRIP_CONFLICTS } from "../../../utils/v2Utils/apiErrors";

interface TripFeedCardProps {
  trip: TripPost;
  currentUserId: string;
  myInterestStatus?: TripInterestStatus | null;
  pendingInterests?: TripInterest[];
  onRequestToJoin: (tripId: string) => Promise<void>;
  onRespondToInterest?: (
    tripId: string,
    interestId: string,
    approve: boolean
  ) => Promise<void>;
  onOpenThread: (tripId: string) => void;
}

// How many stop pills fit on the single stops row before collapsing to "+N".
const VISIBLE_STOPS = 2;

// One trip post in a grid. Every card has the same fixed structure — each
// slot reserves its height even when empty — so cards line up regardless of
// how long the caption is or how many stops the trip has.
export default function TripFeedCard({
  trip,
  currentUserId,
  myInterestStatus = null,
  pendingInterests = [],
  onRequestToJoin,
  onRespondToInterest,
  onOpenThread,
}: TripFeedCardProps) {
  const [requestsOpen, setRequestsOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  // Set when the API says this user can't request again (409 after a decline).
  const [blocked, setBlocked] = useState(false);
  const [tripInterest, setTripInterest] = useState(pendingInterests);
  const requireAuth = useRequireAuth();

  const isAuthor = !!currentUserId && trip.authorUserId === currentUserId;
  const capacity = tripCapacity(trip);
  const colour = colourwayFor(trip.id);
  const extraStops = Math.max(0, trip.stops.length - VISIBLE_STOPS);

  const dateLabel = trip.isDateFlexible
    ? "Flexible dates"
    : formatDateRange(trip.startDate, trip.endDate);

  // Joining needs an account — logged-out visitors go to login and back.
  const handleInterested = () =>
    requireAuth(async () => {
      setBusy(true);
      setError("");
      try {
        await onRequestToJoin(trip.id);
      } catch (e) {
        if (isApiError(e, 409)) setBlocked(true);
        setError(friendlyError(e, { 409: TRIP_CONFLICTS.join }, "Couldn't send your request."));
      } finally {
        setBusy(false);
      }
    });

  const handleInterestUpdate = useCallback(
    (update: TripInterestUpdate) => {
      if (update.event === "interestUpdated" && update.interestList) {
        // The hub broadcasts every trip's updates; only take this trip's.
        const forThisTrip = update.interestList
          .filter(i => i.tripPostId === trip.id)
          .map(i => ({ ...i, status: normalizeInterestStatus(i.status) }));
        if (forThisTrip.length || update.interestList.length === 0) {
          setTripInterest(forThisTrip.filter(i => i.status !== "Approved"));
        }
      }
    },
    [trip.id]
  );

  useTripInterestUpdatedHub({ onUpdate: handleInterestUpdate });

  // Only the author can see join requests, so only they fetch them.
  useEffect(() => {
    if (!isAuthor) return;
    let cancelled = false;
    tripClient
      .getInterests(trip.id)
      .then(results => {
        if (!cancelled) setTripInterest(results.filter(i => i.status !== "Approved"));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [isAuthor, trip.id]);

  return (
    <article className="group h-full bg-white border border-line rounded-2xl overflow-hidden shadow-pop pop-hover flex flex-col">
      {/* Cover — fixed ratio */}
      <div className="relative shrink-0 overflow-hidden">
        {trip.coverImageUrl ? (
          <img
            src={trip.coverImageUrl}
            alt=""
            loading="lazy"
            className="w-full aspect-16/10 object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          />
        ) : (
          <div className={`w-full aspect-16/10 ${colour.bg} flex items-center justify-center`}>
            <Map className="w-8 h-8 text-ink-muted" strokeWidth={1.25} />
          </div>
        )}

        <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 bg-white/70 backdrop-blur-md rounded-full px-3 py-1 text-xs font-medium text-ink">
          <CalendarDays className="w-3.5 h-3.5" />
          {dateLabel}
        </span>
        {capacity.label && (
          <span
            className={`absolute top-3 right-3 inline-flex items-center gap-1.5 backdrop-blur-md rounded-full px-3 py-1 text-xs font-medium ${
              capacity.isFull ? "bg-ink/80 text-white" : "bg-white/70 text-ink"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            {capacity.label}
          </span>
        )}
      </div>

      {/* Content — every row has a fixed height */}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="text-xl font-normal text-ink leading-tight truncate" title={trip.destinationLabel}>
          <Link to={`/trips/${trip.id}`} className="hover:underline underline-offset-4">{trip.destinationLabel}</Link>
        </h3>

        {/* Stops: single row */}
        <div className="h-7 mt-2 flex items-center gap-1.5 overflow-hidden">
          {trip.stops.slice(0, VISIBLE_STOPS).map((stop) => (
            <Link
              key={stop.destinationId}
              to={`/destinations/${stop.destinationId}`}
              className="shrink min-w-0 truncate inline-flex items-center px-2.5 py-0.5 rounded-full bg-cream border border-line text-xs text-ink-soft hover:text-ink hover:border-ink/30 transition-colors"
            >
              {stop.name}
            </Link>
          ))}
          {extraStops > 0 && (
            <span className="shrink-0 text-xs text-ink-muted" title={trip.stops.slice(VISIBLE_STOPS).map(s => s.name).join(", ")}>
              +{extraStops} more
            </span>
          )}
        </div>

        {/* Caption: always reserves two lines */}
        <p className="mt-3 text-sm text-ink-soft leading-relaxed line-clamp-2 min-h-[2lh]">
          {trip.caption || <span className="text-ink-muted italic">No description yet.</span>}
        </p>

        {/* Itinerary link: fixed slot */}
        <div className="h-5 mt-3">
          {trip.wishlistId && (
            <Link
              to={`/wishlists/${trip.wishlistId}`}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-soft hover:text-ink"
            >
              <Map className="w-3.5 h-3.5" /> Follows an itinerary
            </Link>
          )}
        </div>

        {/* Actions: pinned to the bottom, fixed height */}
        <div className="mt-auto pt-4">
          <div className="pt-4 border-t border-line flex items-center gap-2 h-14">
            {!isAuthor && (
              <button
                disabled={busy || blocked || !!myInterestStatus || (capacity.isFull && !myInterestStatus)}
                onClick={handleInterested}
                title={error || undefined}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  blocked || (capacity.isFull && !myInterestStatus)
                    ? "bg-cream-deep text-ink-muted cursor-default"
                    : error
                      ? "bg-red-50 text-red-700 border border-red-200"
                      : myInterestStatus
                        ? "bg-cream-deep text-ink-muted cursor-default"
                        : "bg-ink text-white hover:bg-ink-soft"
                }`}
              >
                {blocked
                  ? "Unavailable"
                  : error
                    ? "Try again"
                    : capacity.isFull && !myInterestStatus
                      ? "Trip full"
                      : interestButtonLabel(myInterestStatus, busy)}
              </button>
            )}

            {(myInterestStatus === "Approved" || isAuthor) && (
              <button
                onClick={() => onOpenThread(trip.id)}
                className="inline-flex items-center gap-1.5 rounded-full border border-ink/25 px-4 py-2 text-sm font-medium text-ink hover:border-ink transition-colors"
              >
                <MessageCircle className="w-4 h-4" /> Chat
              </button>
            )}

            {isAuthor && tripInterest.length > 0 && (
              <button
                onClick={() => setRequestsOpen(true)}
                aria-label={`${tripInterest.length} join requests`}
                className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-sun-100 border border-sun-300 px-3 py-2 text-sm font-medium text-ink"
              >
                <Inbox className="w-4 h-4" />
                {tripInterest.length}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Join requests open in a dialog so the card never changes height. */}
      <Modal isOpen={requestsOpen} onClose={() => setRequestsOpen(false)} label="Join requests">
        <div className="p-6 md:p-8">
          <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-ink-muted mb-2">Join requests</p>
          <h3 className="text-2xl font-normal text-ink mb-6 pr-10">{trip.destinationLabel}</h3>
          {tripInterest.length === 0 ? (
            <p className="text-sm text-ink-muted">No pending requests.</p>
          ) : (
            <ul className="space-y-3">
              {tripInterest.map((interest) => (
                <InterestRequest key={interest.id} interest={interest} onRespond={onRespondToInterest} />
              ))}
            </ul>
          )}
        </div>
      </Modal>
    </article>
  );
}

interface InterestRequestProps {
  interest: TripInterest;
  onRespond?: (
    tripId: string,
    interestId: string,
    approve: boolean
  ) => Promise<void>;
}

function InterestRequest({ interest, onRespond }: InterestRequestProps) {
  const [responding, setResponding] = useState(false);
  const [error, setError] = useState("");

  const handleResponse = async (approve: boolean) => {
    if (!onRespond) return;
    setResponding(true);
    setError("");
    try {
      await onRespond(interest.tripPostId, interest.id, approve);
    } catch (e) {
      setError(friendlyError(e, { 409: TRIP_CONFLICTS.approve }, "Couldn't update this request."));
    } finally {
      setResponding(false);
    }
  };

  return (
    <li className="rounded-xl bg-white border border-line p-4">
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-9 h-9 rounded-full bg-cream-deep flex items-center justify-center text-sm font-medium text-ink">
          {interest.requesterName?.charAt(0)?.toUpperCase() ?? "?"}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-ink">{interest.requesterName}</p>
          {interest.message && (
            <p className="text-sm text-ink-soft mt-1 leading-relaxed">{interest.message}</p>
          )}

          <div className="flex gap-2 mt-3">
            <button
              type="button"
              disabled={responding}
              onClick={() => handleResponse(true)}
              className="rounded-full bg-ink text-white px-4 py-1.5 text-xs font-medium hover:bg-ink-soft disabled:opacity-50"
            >
              Approve
            </button>
            <button
              type="button"
              disabled={responding}
              onClick={() => handleResponse(false)}
              className="rounded-full border border-ink/25 px-4 py-1.5 text-xs font-medium text-ink-soft hover:border-ink hover:text-ink disabled:opacity-50"
            >
              Decline
            </button>
          </div>
          {error && <p className="text-xs text-red-700 mt-2">{error}</p>}
        </div>
      </div>
    </li>
  );
}

function interestButtonLabel(
  status: TripInterestStatus | null | undefined,
  busy: boolean
): string {
  if (busy) return "Sending…";
  if (status === "Requested") return "Request sent";
  if (status === "Approved") return "You're in";
  if (status === "Declined") return "Declined";
  return "Request to join";
}

function formatDateRange(start: string | null, end: string | null): string {
  if (!start && !end) return "Dates TBC";

  const fmt = (date: string) =>
    new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric" });

  if (start && end) return `${fmt(start)} – ${fmt(end)}`;
  return fmt((start ?? end) as string);
}

export function TripCardSkeleton() {
  return (
    <div className="h-full bg-white border border-line rounded-2xl overflow-hidden animate-pulse">
      <div className="aspect-16/10 bg-ink/5" />
      <div className="p-5 space-y-3">
        <div className="h-5 bg-ink/5 rounded w-3/4" />
        <div className="h-5 bg-ink/5 rounded-full w-1/2" />
        <div className="h-3 bg-ink/5 rounded w-full" />
        <div className="h-3 bg-ink/5 rounded w-5/6" />
        <div className="pt-6">
          <div className="h-9 bg-ink/5 rounded-full w-32" />
        </div>
      </div>
    </div>
  );
}
