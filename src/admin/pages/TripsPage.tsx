import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { X } from "lucide-react";
import {
  adminApi, enumName, INTEREST_STATUSES, totalPages, TRIP_STATUSES,
  type AdminThreadMessage, type AdminTripSummary, type InterestStatus, type TripStatus,
} from "../api";
import {
  AdminPage, Btn, ConfirmBtn, DataTable, DetailList, Drawer, ErrorBlock, Field, LoadingBlock, Pager, Pill, SearchBox, Select, TextArea, TextInput, Toolbar, type Column,
} from "../ui";
import { useAction, useDebounced, useQuery } from "../hooks";
import { fmtDate, fmtDateTime, fmtNumber } from "../format";

const PAGE_SIZE = 25;
const MESSAGE_PAGE_SIZE = 30;

const STATUS_FILTERS = ["all", ...TRIP_STATUSES] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];
const HIDDEN_FILTERS = ["all", "hidden", "visible"] as const;
type HiddenFilter = (typeof HIDDEN_FILTERS)[number];

const pick = <T extends string>(v: string | null, list: readonly T[], fallback: T): T => {
  const hit = list.find(x => x.toLowerCase() === (v ?? "").toLowerCase());
  return hit ?? fallback;
};
const isDate = (v: string | null) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : "");

const tripTone = (s: TripStatus) => (s === "Open" ? "good" : s === "Cancelled" ? "bad" : "neutral");
const interestTone = (s: InterestStatus) =>
  s === "Approved" ? "good" : s === "Requested" ? "warn" : s === "Declined" ? "bad" : "neutral";

function StatusPill({ status }: { status: unknown }) {
  const s = enumName(status, TRIP_STATUSES);
  return <Pill tone={tripTone(s)}>{s}</Pill>;
}

function dateRange(start: string | null, end: string | null, flexible?: boolean) {
  if (!start && !end) return flexible ? "Flexible" : "—";
  const text = start && end ? `${fmtDate(start)} – ${fmtDate(end)}` : fmtDate(start ?? end);
  return flexible ? `${text} (flexible)` : text;
}

function SectionTitle({ children, actions }: { children: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 mb-1">
      <h3 className="text-[11px] uppercase tracking-[0.18em] text-ink-muted">{children}</h3>
      {actions}
    </div>
  );
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

function ChatSection({ tripId, onChanged }: { tripId: string; onChanged: () => void }) {
  // Page 1 comes from useQuery; "Load more" appends further pages on demand.
  const { data, loading, error, reload } = useQuery(
    () => adminApi.trips.messages(tripId, { page: 1, pageSize: MESSAGE_PAGE_SIZE }),
    [tripId]
  );
  const [more, setMore] = useState<AdminThreadMessage[]>([]);
  const [lastPage, setLastPage] = useState(1);
  const [pages, setPages] = useState<number | null>(null);
  const [deleted, setDeleted] = useState<Set<string>>(() => new Set());
  const loader = useAction();
  const { run, busy } = useAction();
  const [deleting, setDeleting] = useState<string | null>(null);

  const seen = new Set<string>();
  const items = [...(data?.items ?? []), ...more].filter(m => {
    if (seen.has(m.id) || deleted.has(m.id)) return false;
    seen.add(m.id);
    return true;
  });

  const loadMore = async () => {
    const next = lastPage + 1;
    const r = await loader.run(() => adminApi.trips.messages(tripId, { page: next, pageSize: MESSAGE_PAGE_SIZE }), {
      fallback: "Couldn't load more messages.",
    });
    if (r.ok) {
      setMore(prev => [...prev, ...r.result.items]);
      setLastPage(next);
      setPages(totalPages(r.result));
    }
  };

  const retry = () => { setMore([]); setLastPage(1); setPages(null); reload(); };

  const remove = async (m: AdminThreadMessage) => {
    setDeleting(m.id);
    const r = await run(() => adminApi.trips.deleteMessage(tripId, m.id), {
      success: "Message deleted.",
      errors: { 404: "That message was already deleted." },
      fallback: "Couldn't delete this message.",
    });
    setDeleting(null);
    if (r.ok) { setDeleted(prev => new Set(prev).add(m.id)); onChanged(); }
  };

  const hasMore = !!data && lastPage < (pages ?? totalPages(data));

  return (
    <section>
      <SectionTitle actions={data && <span className="text-xs text-ink-muted">{fmtNumber(data.totalCount)} messages</span>}>
        Chat
      </SectionTitle>
      {error ? (
        <ErrorBlock message={error} onRetry={retry} />
      ) : !data && loading ? (
        <LoadingBlock />
      ) : !items.length ? (
        <p className="text-sm text-ink-muted py-3">No messages in this trip's thread.</p>
      ) : (
        <ul className="divide-y divide-line border border-line rounded-2xl">
          {items.map(m => (
            <li key={m.id} className="px-4 py-3 flex gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="text-sm text-ink">{m.senderName || "Unknown"}</span>
                  <span className="text-[11px] text-ink-muted">{fmtDateTime(m.createdAt)}</span>
                </div>
                <p className="text-sm text-ink-soft mt-0.5 whitespace-pre-wrap wrap-break-word">{m.body}</p>
              </div>
              <div className="shrink-0">
                <ConfirmBtn size="sm" label="Delete" confirmLabel="Delete" loading={busy && deleting === m.id} onConfirm={() => remove(m)} />
              </div>
            </li>
          ))}
        </ul>
      )}
      {hasMore && (
        <div className="flex justify-center mt-3">
          <Btn size="sm" onClick={loadMore} loading={loader.busy}>Load more</Btn>
        </div>
      )}
    </section>
  );
}

// ─── Detail drawer ────────────────────────────────────────────────────────────

type Mode = "hide" | "cancel" | null;

function TripDrawer({ id, onClose, onChanged }: { id: string | null; onClose: () => void; onChanged: () => void }) {
  const { data, loading, error, reload } = useQuery(
    () => (id ? adminApi.trips.get(id) : Promise.resolve(null)),
    [id]
  );
  const { run, busy } = useAction();
  const [mode, setMode] = useState<Mode>(null);
  const [reason, setReason] = useState("");

  const trip = data && data.id === id ? data : null;
  const status = trip ? enumName(trip.status, TRIP_STATUSES) : null;

  const reset = () => { setMode(null); setReason(""); };
  const close = () => { reset(); onClose(); };
  const afterAction = () => { reset(); reload(); onChanged(); };

  const hide = async () => {
    if (!id || !reason.trim()) return;
    const r = await run(() => adminApi.trips.hide(id, reason.trim()), { success: "Trip hidden.", fallback: "Couldn't hide this trip." });
    if (r.ok) afterAction();
  };
  const unhide = async () => {
    if (!id) return;
    const r = await run(() => adminApi.trips.unhide(id), { success: "Trip is visible again.", fallback: "Couldn't unhide this trip." });
    if (r.ok) afterAction();
  };
  const cancel = async () => {
    if (!id) return;
    const r = await run(() => adminApi.trips.cancel(id, reason.trim() || undefined), {
      success: "Trip cancelled. The author and members have been notified.",
      errors: { 409: "This trip is already cancelled." },
      fallback: "Couldn't cancel this trip.",
    });
    if (r.ok) afterAction();
  };

  return (
    <Drawer
      open={!!id}
      onClose={close}
      wide
      title={trip ? trip.destinationLabel || "Trip" : "Trip"}
      footer={trip && !mode && (
        <>
          {trip.isHidden
            ? <Btn onClick={unhide} loading={busy}>Unhide</Btn>
            : <Btn onClick={() => setMode("hide")}>Hide…</Btn>}
          <Btn variant="danger" disabled={status === "Cancelled"} onClick={() => setMode("cancel")}
            title={status === "Cancelled" ? "Already cancelled" : undefined}>
            Cancel trip…
          </Btn>
        </>
      )}
    >
      {error ? (
        <ErrorBlock message={error} onRetry={reload} />
      ) : !trip ? (
        <LoadingBlock />
      ) : (
        <div className={`space-y-7 ${loading ? "opacity-60" : ""}`}>
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill status={trip.status} />
            {trip.isHidden && <Pill tone="bad">Hidden</Pill>}
            <span className="text-xs text-ink-muted">Posted {fmtDateTime(trip.createdAt)}</span>
          </div>

          {mode === "hide" && (
            <div className="rounded-2xl border border-line bg-cream-deep/40 p-4 space-y-3">
              <p className="text-sm text-ink">Hide this trip</p>
              <p className="text-xs text-ink-soft">Hidden trips are removed from public listings. The reason is kept for the moderation record.</p>
              <Field label="Reason (required)">
                <TextArea value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. Spam, inappropriate content" autoFocus />
              </Field>
              <div className="flex flex-wrap justify-end gap-2">
                <Btn variant="ghost" onClick={reset}>Back</Btn>
                <Btn variant="primary" onClick={hide} loading={busy} disabled={!reason.trim()}>Hide trip</Btn>
              </div>
            </div>
          )}

          {mode === "cancel" && (
            <div className="rounded-2xl border border-red-200 bg-red-50/40 p-4 space-y-3">
              <p className="text-sm text-ink">Cancel this trip</p>
              <p className="text-xs text-ink-soft">
                The author and every member are notified that the trip was cancelled. This can't be undone from the admin.
              </p>
              <Field label="Reason (optional)" hint="Included in the notification if provided.">
                <TextArea value={reason} onChange={e => setReason(e.target.value)} autoFocus />
              </Field>
              <div className="flex flex-wrap justify-end gap-2">
                <Btn variant="ghost" onClick={reset}>Back</Btn>
                <Btn variant="danger" onClick={cancel} loading={busy}>Cancel trip</Btn>
              </div>
            </div>
          )}

          {trip.coverImageUrl && (
            <img src={trip.coverImageUrl} alt="" className="w-full max-h-56 object-cover rounded-2xl border border-line" />
          )}

          <section>
            <SectionTitle>Details</SectionTitle>
            <DetailList rows={[
              ["Destination", trip.destinationLabel || "—"],
              ["Free-text destination", trip.freeTextDestination ?? "—"],
              ["Caption", trip.caption ? <span className="whitespace-pre-wrap">{trip.caption}</span> : "—"],
              ["Dates", dateRange(trip.startDate, trip.endDate, trip.isDateFlexible)],
              ["Max group size", trip.maxGroupSize ?? "—"],
              ["Destination ID", trip.destinationId ? <span className="font-mono text-xs">{trip.destinationId}</span> : "—"],
              ["Wishlist ID", trip.wishlistId ? <span className="font-mono text-xs">{trip.wishlistId}</span> : "—"],
              ["Posted", fmtDateTime(trip.createdAt)],
              ["Updated", fmtDateTime(trip.updatedAt)],
              ["Trip ID", <span className="font-mono text-xs">{trip.id}</span>],
            ]} />
          </section>

          <section>
            <SectionTitle actions={
              <Link to={`/admin/trips?authorId=${encodeURIComponent(trip.author.userId)}`} onClick={close}
                className="text-xs text-ink underline underline-offset-4 hover:text-ink-soft">
                All trips by author
              </Link>
            }>Author</SectionTitle>
            <DetailList rows={[
              ["Name", trip.author.displayName || "—"],
              ["Email", trip.author.email],
              ["User ID", <span className="font-mono text-xs">{trip.author.userId}</span>],
            ]} />
          </section>

          {(trip.isHidden || trip.hiddenAt) && (
            <section>
              <SectionTitle>Moderation</SectionTitle>
              <DetailList rows={[
                ["Hidden", trip.isHidden ? "Yes" : "No"],
                ["Hidden at", fmtDateTime(trip.hiddenAt)],
                ["Reason", trip.hiddenReason ?? "—"],
                ["Hidden by", trip.hiddenByUserId ? <span className="font-mono text-xs">{trip.hiddenByUserId}</span> : "—"],
              ]} />
            </section>
          )}

          <section>
            <SectionTitle>Join requests</SectionTitle>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
              {([
                ["Requested", trip.interestCounts.requested],
                ["Approved", trip.interestCounts.approved],
                ["Declined", trip.interestCounts.declined],
                ["Withdrawn", trip.interestCounts.withdrawn],
              ] as const).map(([label, n]) => (
                <div key={label} className="rounded-xl border border-line px-3 py-2">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-ink-muted">{label}</p>
                  <p className="text-lg font-light text-ink">{fmtNumber(n)}</p>
                </div>
              ))}
            </div>
            {!trip.interests.length ? (
              <p className="text-sm text-ink-muted">No join requests.</p>
            ) : (
              <ul className="divide-y divide-line border border-line rounded-2xl">
                {trip.interests.map(i => {
                  const s = enumName(i.status, INTEREST_STATUSES);
                  return (
                    <li key={i.id} className="px-4 py-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm text-ink truncate">{i.requesterName || "—"}</p>
                          <p className="text-xs text-ink-muted truncate">{i.requesterEmail}</p>
                        </div>
                        <Pill tone={interestTone(s)}>{s}</Pill>
                      </div>
                      {i.message && <p className="text-sm text-ink-soft mt-1.5 whitespace-pre-wrap wrap-break-word">{i.message}</p>}
                      <p className="text-[11px] text-ink-muted mt-1">
                        Requested {fmtDateTime(i.requestedAt)}{i.respondedAt ? ` · Responded ${fmtDateTime(i.respondedAt)}` : ""}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section>
            <SectionTitle>Thread</SectionTitle>
            <DetailList rows={[
              ["Thread ID", trip.threadId ? <span className="font-mono text-xs">{trip.threadId}</span> : "No thread"],
              ["Participants", fmtNumber(trip.threadParticipantCount)],
              ["Messages", fmtNumber(trip.messageCount)],
            ]} />
          </section>

          {trip.threadId && <ChatSection key={trip.id} tripId={trip.id} onChanged={onChanged} />}
        </div>
      )}
    </Drawer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TripsPage() {
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, Number(params.get("page")) || 1);
  const status = pick(params.get("status"), STATUS_FILTERS, "all");
  const hidden = pick(params.get("hidden"), HIDDEN_FILTERS, "all");
  const from = isDate(params.get("from"));
  const to = isDate(params.get("to"));
  const authorId = params.get("authorId") ?? "";
  const urlSearch = params.get("q") ?? "";
  const [search, setSearch] = useState(urlSearch);
  const debounced = useDebounced(search);
  const [selected, setSelected] = useState<string | null>(null);

  const update = useCallback((patch: Record<string, string | null>) => {
    setParams(prev => {
      const next = new URLSearchParams(prev);
      for (const [k, v] of Object.entries(patch)) {
        if (v === null || v === "") next.delete(k); else next.set(k, v);
      }
      return next;
    }, { replace: true });
  }, [setParams]);

  useEffect(() => {
    const q = debounced.trim();
    if (q !== urlSearch) update({ q: q || null, page: null });
    // Only react to the user's typing, not to URL changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const { data, loading, error, reload } = useQuery(
    () => adminApi.trips.list({
      page, pageSize: PAGE_SIZE,
      search: urlSearch.trim() || undefined,
      status: status === "all" ? undefined : status,
      hidden: hidden === "all" ? undefined : hidden === "hidden",
      authorId: authorId || undefined,
      from: from || undefined,
      to: to || undefined,
    }),
    [page, urlSearch, status, hidden, authorId, from, to]
  );

  // Name the author for the chip once a row from them is loaded.
  const authorLabel = authorId
    ? data?.items.find(t => t.author.userId === authorId)?.author
    : undefined;

  const columns: Column<AdminTripSummary>[] = [
    {
      key: "trip", header: "Trip", render: t => (
        <div className="min-w-56 max-w-80">
          <p className="text-ink truncate">{t.destinationLabel || "—"}</p>
          {t.caption && <p className="text-xs text-ink-muted truncate">{t.caption}</p>}
        </div>
      ),
    },
    {
      key: "author", header: "Author", render: t => (
        <div className="min-w-40 max-w-60">
          <p className="text-ink truncate">{t.author.displayName || "—"}</p>
          <p className="text-xs text-ink-muted truncate">{t.author.email}</p>
        </div>
      ),
    },
    {
      key: "status", header: "Status", render: t => (
        <div className="flex flex-wrap gap-1">
          <StatusPill status={t.status} />
          {t.isHidden && <Pill tone="bad">Hidden</Pill>}
        </div>
      ),
    },
    { key: "dates", header: "Dates", className: "whitespace-nowrap", render: t => <span className="text-ink-soft">{dateRange(t.startDate, t.endDate)}</span> },
    {
      key: "interests", header: "Requests", className: "whitespace-nowrap", render: t => (
        <span className="text-ink-soft" title="Requested / approved">
          {fmtNumber(t.interestCounts.requested)} / {fmtNumber(t.interestCounts.approved)}
        </span>
      ),
    },
    { key: "messages", header: "Messages", className: "text-right", render: t => <span className="text-ink-soft tabular-nums">{fmtNumber(t.messageCount)}</span> },
    { key: "posted", header: "Posted", className: "whitespace-nowrap", render: t => <span className="text-ink-soft">{fmtDate(t.createdAt)}</span> },
  ];

  const anyFilter = !!(urlSearch || status !== "all" || hidden !== "all" || from || to || authorId);

  return (
    <AdminPage title="Trips" description="Community trip posts. Click a row to moderate, review join requests and read the chat.">
      <Toolbar>
        <SearchBox value={search} onChange={setSearch} placeholder="Search destination or caption" />
        <Select<StatusFilter> label="Status" value={status}
          onChange={v => update({ status: v === "all" ? null : v, page: null })}
          options={STATUS_FILTERS.map(s => ({ value: s, label: s === "all" ? "All statuses" : s }))} />
        <Select<HiddenFilter> label="Visibility" value={hidden}
          onChange={v => update({ hidden: v === "all" ? null : v, page: null })}
          options={[
            { value: "all", label: "Hidden & visible" },
            { value: "hidden", label: "Hidden only" },
            { value: "visible", label: "Visible only" },
          ]} />
        <div className="flex items-center gap-1.5 text-xs text-ink-muted">
          <span>Posted</span>
          <TextInput type="date" aria-label="Posted from" value={from} max={to || undefined}
            onChange={e => update({ from: e.target.value || null, page: null })} className="w-auto! rounded-full" />
          <span>to</span>
          <TextInput type="date" aria-label="Posted to" value={to} min={from || undefined}
            onChange={e => update({ to: e.target.value || null, page: null })} className="w-auto! rounded-full" />
        </div>
        {authorId && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-cream-deep pl-3 pr-1.5 py-1 text-xs text-ink">
            Author: {authorLabel ? authorLabel.displayName || authorLabel.email : <span className="font-mono">{authorId.slice(0, 8)}…</span>}
            <button type="button" aria-label="Clear author filter" onClick={() => update({ authorId: null, page: null })}
              className="w-5 h-5 rounded-full hover:bg-white flex items-center justify-center text-ink-muted hover:text-ink">
              <X className="w-3 h-3" />
            </button>
          </span>
        )}
        {anyFilter && (
          <Btn size="sm" variant="ghost" onClick={() => { setSearch(""); setParams({}, { replace: true }); }}>Clear filters</Btn>
        )}
      </Toolbar>

      {error ? (
        <ErrorBlock message={error} onRetry={reload} />
      ) : (
        <>
          <DataTable columns={columns} rows={data?.items} rowKey={t => t.id} loading={loading}
            onRowClick={t => setSelected(t.id)}
            empty={anyFilter ? "No trips match these filters." : "No trips posted yet."} />
          {data && (
            <Pager page={page} totalPages={totalPages(data)} totalCount={data.totalCount}
              onChange={p => update({ page: p === 1 ? null : String(p) })} />
          )}
        </>
      )}

      <TripDrawer id={selected} onClose={() => setSelected(null)} onChanged={reload} />
    </AdminPage>
  );
}
