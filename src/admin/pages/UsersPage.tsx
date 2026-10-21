import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import {
  adminApi, totalPages, USER_SORTS, USER_STATUS_FILTERS,
  type AdminUserRow,
} from "../api";
import {
  AdminPage, Btn, DataTable, DetailList, Drawer, ErrorBlock, Field, LoadingBlock, Pager, Pill, SearchBox, Select, TextArea, TextInput, Toolbar, type Column,
} from "../ui";
import { useAction, useDebounced, useQuery } from "../hooks";
import { fmtDate, fmtDateTime, fmtNumber, fromLocalInput } from "../format";

type StatusFilter = (typeof USER_STATUS_FILTERS)[number];
type Sort = (typeof USER_SORTS)[number];

const STATUS_LABELS: Record<StatusFilter, string> = {
  all: "All users", confirmed: "Confirmed", unconfirmed: "Unconfirmed", locked: "Locked", onboarded: "Onboarded",
};
const SORT_LABELS: Record<Sort, string> = { newest: "Newest", oldest: "Oldest", lastActive: "Last active" };

const PAGE_SIZE = 25;

const pick = <T extends string>(v: string | null, list: readonly T[], fallback: T): T =>
  (list as readonly string[]).includes(v ?? "") ? (v as T) : fallback;

function StatusPills({ u }: { u: AdminUserRow }) {
  return (
    <div className="flex flex-wrap gap-1">
      {u.emailConfirmed ? <Pill tone="good">Confirmed</Pill> : <Pill tone="warn">Unconfirmed</Pill>}
      {u.hasCompletedOnboarding ? <Pill tone="info">Onboarded</Pill> : <Pill>Not onboarded</Pill>}
      {u.isLocked && <Pill tone="bad">Locked</Pill>}
    </div>
  );
}

function Avatar({ u }: { u: Pick<AdminUserRow, "avatarUrl" | "displayName" | "email"> }) {
  const initial = (u.displayName || u.email || "?").trim().charAt(0).toUpperCase();
  return u.avatarUrl ? (
    <img src={u.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover border border-line shrink-0" />
  ) : (
    <span className="w-8 h-8 rounded-full bg-cream-deep border border-line flex items-center justify-center text-xs text-ink-soft shrink-0">
      {initial}
    </span>
  );
}

// ─── Detail drawer ────────────────────────────────────────────────────────────

function UserDrawer({ id, onClose, onChanged }: { id: string | null; onClose: () => void; onChanged: () => void }) {
  const { data: user, loading, error, reload } = useQuery(
    () => (id ? adminApi.users.get(id) : Promise.resolve(null)),
    [id]
  );
  const { run, busy } = useAction();
  const [lockOpen, setLockOpen] = useState(false);
  const [until, setUntil] = useState("");
  const [reason, setReason] = useState("");

  const afterAction = () => { reload(); onChanged(); };

  const close = () => { setLockOpen(false); setUntil(""); setReason(""); onClose(); };

  const lock = async () => {
    if (!id) return;
    const r = await run(() => adminApi.users.lock(id, { until: fromLocalInput(until), reason: reason.trim() || null }), {
      success: "User locked.",
      fallback: "Couldn't lock this user.",
    });
    if (r.ok) { setLockOpen(false); setUntil(""); setReason(""); afterAction(); }
  };

  const unlock = async () => {
    if (!id) return;
    const r = await run(() => adminApi.users.unlock(id), { success: "User unlocked.", fallback: "Couldn't unlock this user." });
    if (r.ok) afterAction();
  };

  const resend = async () => {
    if (!id) return;
    const r = await run(() => adminApi.users.resendConfirmation(id), {
      success: "Confirmation email sent.",
      errors: { 409: "This user's email is already confirmed." },
      fallback: "Couldn't send the confirmation email.",
    });
    if (r.ok) afterAction();
  };

  const showing = user && user.id === id ? user : null;

  return (
    <Drawer
      open={!!id}
      onClose={close}
      title={showing ? showing.displayName || showing.email : "User"}
      footer={showing && (
        <>
          {!showing.emailConfirmed && <Btn onClick={resend} loading={busy}>Resend confirmation</Btn>}
          {showing.isLocked
            ? <Btn variant="primary" onClick={unlock} loading={busy}>Unlock</Btn>
            : !lockOpen && <Btn variant="danger" onClick={() => setLockOpen(true)}>Lock account…</Btn>}
        </>
      )}
    >
      {error ? (
        <ErrorBlock message={error} onRetry={reload} />
      ) : !showing ? (
        <LoadingBlock />
      ) : (
        <div className={`space-y-6 ${loading ? "opacity-60" : ""}`}>
          <div className="flex items-center gap-3">
            <Avatar u={showing} />
            <div className="min-w-0">
              <p className="text-sm text-ink truncate">{showing.email}</p>
              <div className="mt-1"><StatusPills u={showing} /></div>
            </div>
          </div>

          {lockOpen && !showing.isLocked && (
            <div className="rounded-2xl border border-red-200 bg-red-50/40 p-4 space-y-3">
              <p className="text-sm text-ink">Lock this account</p>
              <p className="text-xs text-ink-soft">
                Locking signs the user out on every device. Leave the date empty to lock indefinitely (effectively permanent until you unlock).
              </p>
              <Field label="Locked until (optional, your local time)">
                <TextInput type="datetime-local" value={until} onChange={e => setUntil(e.target.value)} />
              </Field>
              <Field label="Reason (optional)">
                <TextArea value={reason} onChange={e => setReason(e.target.value)} placeholder="Internal note" />
              </Field>
              <div className="flex flex-wrap justify-end gap-2">
                <Btn variant="ghost" onClick={() => setLockOpen(false)}>Cancel</Btn>
                <Btn variant="danger" onClick={lock} loading={busy}>{until ? "Lock until date" : "Lock indefinitely"}</Btn>
              </div>
            </div>
          )}

          <section>
            <h3 className="text-[11px] uppercase tracking-[0.18em] text-ink-muted mb-1">Profile</h3>
            <DetailList rows={[
              ["Display name", showing.displayName || "—"],
              ["Email", showing.email],
              ["Country", showing.countryCode ?? "—"],
              ["Email confirmed", showing.emailConfirmed ? "Yes" : "No"],
              ["Onboarding", showing.hasCompletedOnboarding ? "Completed" : "Not completed"],
              ["Notification emails", showing.notificationEmailOptIn ? "Opted in" : "Opted out"],
              ["Joined", fmtDateTime(showing.createdAt)],
              ["Last login", fmtDateTime(showing.lastLoginAt)],
              ["Last active", fmtDateTime(showing.lastActiveAt)],
              ["User ID", <span className="font-mono text-xs">{showing.id}</span>],
            ]} />
          </section>

          <section>
            <h3 className="text-[11px] uppercase tracking-[0.18em] text-ink-muted mb-1">Security</h3>
            <DetailList rows={[
              ["Locked", showing.isLocked ? <Pill tone="bad">Locked</Pill> : "No"],
              ["Lockout ends", showing.lockoutEnd ? fmtDateTime(showing.lockoutEnd) : "—"],
              ["Failed sign-ins", fmtNumber(showing.accessFailedCount)],
              ["Active sessions", fmtNumber(showing.counts.activeSessions)],
            ]} />
          </section>

          <section>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-[11px] uppercase tracking-[0.18em] text-ink-muted">Activity</h3>
              <Link to={`/admin/trips?authorId=${encodeURIComponent(showing.id)}`}
                className="inline-flex items-center gap-1 text-xs text-ink underline underline-offset-4 hover:text-ink-soft">
                View trips <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
            <DetailList rows={[
              ["Trips posted", fmtNumber(showing.counts.tripsPosted)],
              ["Trip join requests", fmtNumber(showing.counts.tripJoinRequests)],
              ["Wishlists owned", fmtNumber(showing.counts.wishlistsOwned)],
              ["Saved wishlists", fmtNumber(showing.counts.savedWishlists)],
              ["Saved destinations", fmtNumber(showing.counts.savedDestinations)],
              ["Unread notifications", fmtNumber(showing.counts.unreadNotifications)],
            ]} />
          </section>
        </div>
      )}
    </Drawer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, Number(params.get("page")) || 1);
  const status = pick(params.get("status"), USER_STATUS_FILTERS, "all");
  const sort = pick(params.get("sort"), USER_SORTS, "newest");
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

  // Push the debounced search into the URL (resetting to page 1) once it settles.
  useEffect(() => {
    const q = debounced.trim();
    if (q !== urlSearch) update({ q: q || null, page: null });
    // Only react to the user's typing, not to URL changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const { data, loading, error, reload } = useQuery(
    () => adminApi.users.list({
      page, pageSize: PAGE_SIZE, search: urlSearch.trim() || undefined,
      status: status === "all" ? undefined : status, sort,
    }),
    [page, urlSearch, status, sort]
  );

  const columns: Column<AdminUserRow>[] = [
    {
      key: "name", header: "User", render: u => (
        <div className="flex items-center gap-3 min-w-56">
          <Avatar u={u} />
          <div className="min-w-0">
            <p className="text-ink truncate">{u.displayName || "—"}</p>
            <p className="text-xs text-ink-muted truncate">{u.email}</p>
          </div>
        </div>
      ),
    },
    { key: "country", header: "Country", render: u => <span className="text-ink-soft">{u.countryCode ?? "—"}</span> },
    { key: "status", header: "Status", render: u => <StatusPills u={u} /> },
    { key: "created", header: "Joined", className: "whitespace-nowrap", render: u => <span className="text-ink-soft">{fmtDate(u.createdAt)}</span> },
    { key: "active", header: "Last active", className: "whitespace-nowrap", render: u => <span className="text-ink-soft">{fmtDateTime(u.lastActiveAt)}</span> },
  ];

  return (
    <AdminPage title="Users" description="Everyone with a Hodrac account. Click a row for details and account actions.">
      <Toolbar>
        <SearchBox value={search} onChange={setSearch} placeholder="Search name or email" />
        <Select<StatusFilter> label="Status" value={status}
          onChange={v => update({ status: v === "all" ? null : v, page: null })}
          options={USER_STATUS_FILTERS.map(s => ({ value: s, label: STATUS_LABELS[s] }))} />
        <Select<Sort> label="Sort" value={sort}
          onChange={v => update({ sort: v === "newest" ? null : v, page: null })}
          options={USER_SORTS.map(s => ({ value: s, label: SORT_LABELS[s] }))} />
      </Toolbar>

      {error ? (
        <ErrorBlock message={error} onRetry={reload} />
      ) : (
        <>
          <DataTable columns={columns} rows={data?.items} rowKey={u => u.id} loading={loading}
            onRowClick={u => setSelected(u.id)} empty="No users match these filters." />
          {data && (
            <Pager page={page} totalPages={totalPages(data)} totalCount={data.totalCount}
              onChange={p => update({ page: p === 1 ? null : String(p) })} />
          )}
        </>
      )}

      <UserDrawer id={selected} onClose={() => setSelected(null)} onChanged={reload} />
    </AdminPage>
  );
}
