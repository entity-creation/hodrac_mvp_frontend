import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { friendlyError, TRIP_CONFLICTS } from "../../../utils/v2Utils/apiErrors";
import EditTripModal from "./EditTripModal";
import type {
  MyTripPost,
  MyTripRequest,
  TripApiClient,
  TripInterest,
  TripPost,
  TripPostStatus,
} from "../../../types";

interface MyTripsPageProps {
  api: TripApiClient;
}

type Tab = "requests" | "posts";

export default function MyTripsPage({ api }: MyTripsPageProps) {
  const [tab, setTab] = useState<Tab>("requests");

  return (
    <div>
      <div className="mx-auto w-full max-w-5xl px-5 py-10 md:px-8">
        {/* Header */}
        <div className="mb-8">
          <p className="inline-block mb-4 text-xs font-medium uppercase tracking-widest text-ink bg-sun-300 border border-line rounded-full px-3 py-1">
            Your travel activity
          </p>

          <h1 className="text-4xl font-light text-ink sm:text-5xl">
            My trips
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft sm:text-base">
            Keep track of trips you've asked to join and people interested in
            the trips you've shared.
          </p>
        </div>

        {/* Tabs */}
        <div
          className="mb-8 inline-flex flex-wrap rounded-full border border-line bg-white p-1"
          role="tablist"
        >
          <button
            type="button"
            role="tab"
            aria-selected={tab === "requests"}
            onClick={() => setTab("requests")}
            className={tabClass(tab === "requests")}
          >
            <span>Trips I've asked to join</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={tab === "posts"}
            onClick={() => setTab("posts")}
            className={tabClass(tab === "posts")}
          >
            <span>Trips I've posted</span>
          </button>
        </div>

        {tab === "requests" ? (
          <MyRequestsTab api={api} />
        ) : (
          <MyPostsTab api={api} />
        )}
      </div>
    </div>
  );
}

function tabClass(isActive: boolean) {
  return `
    rounded-full px-4 py-2 text-sm font-medium transition-all duration-200
    ${
      isActive
        ? "bg-ink text-white"
        : "text-ink-soft hover:bg-cream hover:text-ink"
    }
  `;
}

// ───────────────────────────────────────────────────────────────────────────
// Tab 1: trips I've asked to join
// ───────────────────────────────────────────────────────────────────────────

function MyRequestsTab({ api }: { api: TripApiClient }) {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<MyTripRequest[]>([]);
  const [loading, setLoading] = useState(true);
  // Which request is showing its "are you sure?" step, and per-request errors.
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const withdraw = async (r: MyTripRequest) => {
    setWithdrawingId(r.interestId);
    setErrors((e) => ({ ...e, [r.interestId]: "" }));
    try {
      await api.withdrawInterest(r.trip.id, r.interestId);
      setRequests((prev) => prev.map((x) => (x.interestId === r.interestId ? { ...x, status: "Withdrawn" } : x)));
      setConfirmingId(null);
    } catch (err) {
      setErrors((e) => ({
        ...e,
        [r.interestId]: friendlyError(err, { 409: TRIP_CONFLICTS.withdraw }, "Couldn't withdraw your request."),
      }));
    } finally {
      setWithdrawingId(null);
    }
  };

  useEffect(() => {
    let cancelled = false;

    api.getMyRequests()
      .then((list) => { if (!cancelled) setRequests(list); })
      .catch(() => { if (!cancelled) setRequests([]); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => {
      cancelled = true;
    };
  }, [api]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-line bg-white p-8">
        <p className="text-sm text-ink-soft">Loading your trips…</p>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-ink/30 bg-white px-6 py-12 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-cream-deep">
          <span className="text-lg text-ink-soft">✈</span>
        </div>

        <h3 className="mt-4 text-base font-normal text-ink">
          No trip requests yet
        </h3>

        <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-ink-soft">
          You haven't asked to join any trips yet. Browse trips to find
          something that interests you.
        </p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-4">
      {requests.map((r) => (
        <li
          key={r.interestId}
          className="rounded-2xl border border-line bg-white p-5 shadow-sm transition-shadow hover:shadow-md sm:p-6"
        >
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-ink" />

                <span className="text-xs font-medium uppercase tracking-[0.12em] text-ink-muted">
                  Trip request
                </span>
              </div>

              <h3 className="mt-2 text-lg font-normal tracking-tight text-ink">
                {r.trip.destinationLabel}
              </h3>

              <p className="mt-1 text-sm text-ink-soft">
                {formatDateRange(r.trip)}
              </p>
            </div>

            <StatusBadge status={r.status} />
          </div>

          {r.message && (
            <div className="mt-5 rounded-xl bg-cream px-4 py-3">
              <p className="text-sm leading-6 text-ink-soft">
                "{r.message}"
              </p>
            </div>
          )}

          {(r.status === "Approved" || r.status === "Requested") && (
            <div className="mt-5 border-t border-line pt-4 flex flex-wrap items-center gap-2">
              {r.status === "Approved" && (
                <button
                  type="button"
                  onClick={() => navigate(`/trip-thread/${r.trip.id}`)}
                  className="rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-white transition hover:bg-ink-soft"
                >
                  Open trip chat
                </button>
              )}

              {confirmingId === r.interestId ? (
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-ink-soft">
                    {r.status === "Approved" ? "Leave this trip?" : "Withdraw your request?"}
                  </span>
                  <button
                    type="button"
                    disabled={withdrawingId === r.interestId}
                    onClick={() => withdraw(r)}
                    className="rounded-full bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800 disabled:opacity-50"
                  >
                    {withdrawingId === r.interestId ? "Withdrawing…" : "Yes, withdraw"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingId(null)}
                    className="rounded-full border border-line px-4 py-2 text-sm text-ink hover:border-ink"
                  >
                    Keep it
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmingId(r.interestId)}
                  className="rounded-full border border-line px-4 py-2.5 text-sm text-ink-soft hover:border-ink hover:text-ink transition"
                >
                  {r.status === "Approved" ? "Leave trip" : "Withdraw request"}
                </button>
              )}
            </div>
          )}

          {errors[r.interestId] && (
            <p role="alert" className="mt-3 text-sm text-red-700">{errors[r.interestId]}</p>
          )}
        </li>
      ))}
    </ul>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Tab 2: trips I've posted
// ───────────────────────────────────────────────────────────────────────────

function MyPostsTab({ api }: { api: TripApiClient }) {
  const [posts, setPosts] = useState<MyTripPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    api.getMyPosts()
      .then((list) => { if (!cancelled) setPosts(list); })
      .catch(() => { if (!cancelled) setPosts([]); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => {
      cancelled = true;
    };
  }, [api]);

  const handleApproved = useCallback((tripId: string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.trip.id === tripId
          ? {
              ...p,
              hasThread: true,
              pendingInterestCount: Math.max(
                0,
                p.pendingInterestCount - 1
              ),
            }
          : p
      )
    );
  }, []);

  const handleTripUpdated = useCallback((trip: TripPost) => {
    setPosts((prev) => prev.map((p) => (p.trip.id === trip.id ? { ...p, trip: { ...p.trip, ...trip } } : p)));
  }, []);

  const handleDeclined = useCallback((tripId: string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.trip.id === tripId
          ? {
              ...p,
              pendingInterestCount: Math.max(
                0,
                p.pendingInterestCount - 1
              ),
            }
          : p
      )
    );
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-line bg-white p-8">
        <p className="text-sm text-ink-soft">Loading your trips…</p>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-ink/30 bg-white px-6 py-12 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-cream-deep">
          <span className="text-lg text-ink-soft">＋</span>
        </div>

        <h3 className="mt-4 text-base font-normal text-ink">
          No trips posted yet
        </h3>

        <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-ink-soft">
          When you create a trip, you'll be able to manage interested
          travelers here.
        </p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-4">
      {posts.map((p) => (
        <MyPostCard
          key={p.trip.id}
          post={p}
          api={api}
          onApproved={handleApproved}
          onDeclined={handleDeclined}
          onTripUpdated={handleTripUpdated}
        />
      ))}
    </ul>
  );
}

function MyPostCard({
  post,
  api,
  onApproved,
  onDeclined,
  onTripUpdated,
}: {
  post: MyTripPost;
  api: TripApiClient;
  onApproved: (tripId: string) => void;
  onDeclined: (tripId: string) => void;
  onTripUpdated: (trip: TripPost) => void;
}) {
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);
  const [statusError, setStatusError] = useState("");
  const status = post.trip.status;

  const setTripStatus = async (next: TripPostStatus) => {
    setStatusBusy(true);
    setStatusError("");
    try {
      const updated = await api.updateTrip(post.trip.id, { status: next });
      onTripUpdated(updated ?? { ...post.trip, status: next });
      setConfirmCancel(false);
    } catch (err) {
      setStatusError(friendlyError(err, { 404: "This trip no longer exists." }, "Couldn't update the trip."));
    } finally {
      setStatusBusy(false);
    }
  };
  const [expanded, setExpanded] = useState(false);
  const [requesters, setRequesters] = useState<TripInterest[] | null>(null);
  const [loadingRequesters, setLoadingRequesters] = useState(false);

  const toggleExpanded = async () => {
    const next = !expanded;

    setExpanded(next);

    if (next && requesters === null) {
      setLoadingRequesters(true);
      try {
        setRequesters(await api.getInterests(post.trip.id));
      } catch {
        setRequesters([]);
      } finally {
        setLoadingRequesters(false);
      }
    }
  };

  const [respondError, setRespondError] = useState("");

  const respond = async (interestId: string, approve: boolean) => {
    setRespondError("");
    try {
      await api.respondToInterest(post.trip.id, interestId, approve);
    } catch (e) {
      setRespondError(friendlyError(e, { 409: TRIP_CONFLICTS.approve }, "Couldn't update this request."));
      return;
    }

    setRequesters((prev) =>
      prev ? prev.filter((r) => r.id !== interestId) : prev
    );

    if (approve) {
      onApproved(post.trip.id);
    } else {
      onDeclined(post.trip.id);
    }
  };

  return (
    <li className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm transition-shadow hover:shadow-md">
      {/* Trip header */}
      <div className="p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-ink" />

              <span className="text-xs font-medium uppercase tracking-[0.12em] text-ink-muted">
                Your trip
              </span>
            </div>

            <h3 className="mt-2 text-lg font-normal tracking-tight text-ink">
              {post.trip.destinationLabel}
            </h3>

            <p className="mt-1 text-sm text-ink-soft">
              {formatDateRange(post.trip)}
            </p>
          </div>

          <TripStatusBadge status={status} />

          {post.pendingInterestCount > 0 && status === "Open" && (
            <div className="rounded-full bg-cream-deep px-3 py-1.5 text-xs font-medium text-ink">
              {post.pendingInterestCount}{" "}
              {post.pendingInterestCount === 1
                ? "person interested"
                : "people interested"}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-5 flex flex-wrap gap-2">
          {post.pendingInterestCount > 0 && (
            <button
              type="button"
              onClick={toggleExpanded}
              className={`rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                expanded
                  ? "bg-ink text-white"
                  : "border border-line bg-white text-ink hover:bg-cream"
              }`}
            >
              {expanded ? "Hide requests" : "View interested travelers"}
            </button>
          )}

          {post.hasThread && (
            <button
              type="button"
              onClick={() => navigate(`/trip-thread/${post.trip.id}`)}
              className="rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-medium text-ink transition hover:bg-cream"
            >
              Open trip chat
            </button>
          )}

          {post.pendingInterestCount === 0 && !post.hasThread && (
            <span className="flex items-center rounded-xl bg-cream px-4 py-2.5 text-sm text-ink-muted">
              No requests yet
            </span>
          )}
        </div>

        {/* Manage */}
        {status !== "Cancelled" && (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded-full border border-line px-4 py-2 text-sm text-ink hover:border-ink transition"
            >
              Edit trip
            </button>

            {status === "Open" ? (
              <button
                type="button"
                disabled={statusBusy}
                onClick={() => setTripStatus("Closed")}
                className="rounded-full border border-line px-4 py-2 text-sm text-ink hover:border-ink transition disabled:opacity-50"
                title="Stop accepting new join requests"
              >
                Close to new requests
              </button>
            ) : (
              <button
                type="button"
                disabled={statusBusy}
                onClick={() => setTripStatus("Open")}
                className="rounded-full border border-line px-4 py-2 text-sm text-ink hover:border-ink transition disabled:opacity-50"
              >
                Reopen
              </button>
            )}

            {confirmCancel ? (
              <span className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-ink-soft">Cancel this trip for everyone?</span>
                <button
                  type="button"
                  disabled={statusBusy}
                  onClick={() => setTripStatus("Cancelled")}
                  className="rounded-full bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800 disabled:opacity-50"
                >
                  Yes, cancel trip
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmCancel(false)}
                  className="rounded-full border border-line px-4 py-2 text-sm text-ink hover:border-ink"
                >
                  Keep it
                </button>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmCancel(true)}
                className="rounded-full px-4 py-2 text-sm text-red-700 hover:bg-red-50 transition"
              >
                Cancel trip
              </button>
            )}
          </div>
        )}

        {statusError && <p role="alert" className="mt-3 text-sm text-red-700">{statusError}</p>}

        <EditTripModal
          trip={editing ? post.trip : null}
          api={api}
          onClose={() => setEditing(false)}
          onSaved={onTripUpdated}
        />
      </div>

      {/* Expanded requests */}
      {expanded && (
        <div className="border-t border-line bg-cream px-5 py-5 sm:px-6">
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-ink">
              Interested travelers
            </h4>

            <p className="mt-1 text-xs text-ink-soft">
              Review requests before adding someone to the trip.
            </p>
          </div>

          {loadingRequesters && (
            <div className="rounded-xl border border-line bg-white p-4">
              <p className="text-sm text-ink-soft">
                Loading requests…
              </p>
            </div>
          )}

          {!loadingRequesters &&
            requesters &&
            requesters.length === 0 && (
              <div className="rounded-xl border border-line bg-white p-4">
                <p className="text-sm text-ink-soft">
                  No pending requests.
                </p>
              </div>
            )}

          {respondError && (
            <p role="alert" className="mb-3 text-sm text-red-700">{respondError}</p>
          )}

          {!loadingRequesters &&
            requesters &&
            requesters.length > 0 && (
              <ul className="flex flex-col gap-3">
                {requesters.map((r) => (
                  <li
                    key={r.id}
                    className="rounded-xl border border-line bg-white p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <span className="text-sm font-semibold text-ink">
                          {r.requesterName}
                        </span>

                        {r.message && (
                          <p className="mt-1 text-sm leading-6 text-ink-soft">
                            {r.message}
                          </p>
                        )}
                      </div>

                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() => respond(r.id, true)}
                          className="rounded-lg bg-ink px-3 py-2 text-xs font-medium text-white transition hover:bg-ink-soft"
                        >
                          Approve
                        </button>

                        <button
                          type="button"
                          onClick={() => respond(r.id, false)}
                          className="rounded-lg border border-line bg-white px-3 py-2 text-xs font-medium text-ink transition hover:bg-cream"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
        </div>
      )}
    </li>
  );
}

// ───────────────────────────────────────────────────────────────────────────

function TripStatusBadge({ status }: { status: TripPostStatus }) {
  const styles: Record<TripPostStatus, string> = {
    Open: "bg-mint-100 text-mint-500 border-mint-300",
    Closed: "bg-cream-deep text-ink-soft border-line",
    Cancelled: "bg-red-50 text-red-700 border-red-200",
  };
  const labels: Record<TripPostStatus, string> = {
    Open: "Open",
    Closed: "Closed to requests",
    Cancelled: "Cancelled",
  };
  return (
    <span className={`inline-flex w-fit shrink-0 items-center rounded-full border px-3 py-1 text-xs font-medium ${styles[status] ?? styles.Closed}`}>
      {labels[status] ?? status}
    </span>
  );
}

function StatusBadge({
  status,
}: {
  status: MyTripRequest["status"];
}) {
  const styles: Record<string, string> = {
    Requested: "bg-sun-100 text-ink border-sun-500",
    Approved: "bg-mint-100 text-mint-500 border-mint-500",
    Declined: "bg-cream-deep text-ink-soft border-line",
    Withdrawn: "bg-cream-deep text-ink-muted border-line",
  };

  const labels: Record<string, string> = {
    Requested: "Pending",
    Approved: "Approved",
    Declined: "Declined",
    Withdrawn: "Withdrawn",
  };

  return (
    <span
      className={`inline-flex w-fit shrink-0 items-center rounded-full border px-3 py-1 text-xs font-medium ${
        styles[status] ?? "border-line bg-cream-deep text-ink-soft"
      }`}
    >
      {labels[status] ?? status}
    </span>
  );
}

function formatDateRange(trip: {
  isDateFlexible: boolean;
  startDate: string | null;
  endDate: string | null;
}) {
  if (trip.isDateFlexible) return "Flexible dates";

  if (!trip.startDate && !trip.endDate) return "No dates set";

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });

  if (trip.startDate && trip.endDate) {
    return `${fmt(trip.startDate)} – ${fmt(trip.endDate)}`;
  }

  return fmt((trip.startDate ?? trip.endDate) as string);
}

