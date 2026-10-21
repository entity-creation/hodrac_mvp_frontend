import { useState } from "react";
import {
  adminApi, enumName, fillDailySeries, LEAD_STATUSES, TRIP_STATUSES,
} from "../api";
import {
  AdminPage, DailyBars, ErrorBlock, LoadingBlock, Panel, Select, StatCard,
} from "../ui";
import { useQuery } from "../hooks";
import { fmtDate, fmtNumber } from "../format";

const WINDOWS = ["7", "30", "90"] as const;
type Window = (typeof WINDOWS)[number];

// Normalises a Record keyed by enum names or numeric strings into ordered rows.
function breakdown<T extends string>(rec: Record<string, number> | null | undefined, names: readonly T[]) {
  const totals = new Map<T, number>(names.map(n => [n, 0]));
  for (const [k, v] of Object.entries(rec ?? {})) {
    const key = /^\d+$/.test(k) ? Number(k) : k;
    const name = enumName(key, names);
    totals.set(name, (totals.get(name) ?? 0) + (v ?? 0));
  }
  return names.map(n => ({ name: n, count: totals.get(n) ?? 0 }));
}

function Breakdown({ title, rows, unavailable }: { title: string; rows: { name: string; count: number }[]; unavailable: boolean }) {
  const total = rows.reduce((s, r) => s + r.count, 0);
  return (
    <Panel title={title}>
      {unavailable ? (
        <p className="text-sm text-ink-muted">No data.</p>
      ) : (
        <ul className="space-y-2.5">
          {rows.map(r => (
            <li key={r.name} className="text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-ink-soft">{r.name}</span>
                <span className="text-ink tabular-nums">{fmtNumber(r.count)}</span>
              </div>
              <div className="mt-1 h-1 rounded-full bg-cream-deep overflow-hidden">
                <div className="h-full bg-ink/70 rounded-full" style={{ width: `${total ? (r.count / total) * 100 : 0}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

export default function OverviewPage() {
  const [days, setDays] = useState<Window>("30");
  const { data, loading, error, reload } = useQuery(() => adminApi.overview(Number(days)), [days]);

  const selector = (
    <Select<Window>
      label="Time window"
      value={days}
      onChange={setDays}
      options={WINDOWS.map(d => ({ value: d, label: `Last ${d} days` }))}
    />
  );

  return (
    <AdminPage title="Overview" description="Platform totals and recent activity. Times are UTC." actions={selector}>
      {error ? (
        <ErrorBlock message={error} onRetry={reload} />
      ) : !data ? (
        <LoadingBlock />
      ) : (
        <div className={`space-y-8 transition-opacity ${loading ? "opacity-60" : ""}`}>
          <section>
            <h2 className="text-[11px] uppercase tracking-[0.18em] text-ink-muted mb-3">
              Last {data.days} days · since {fmtDate(data.windowStart)}
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard label="Active users" value={fmtNumber(data.window.activeUsers)} />
              <StatCard label="New users" value={fmtNumber(data.window.newUsers)} />
              <StatCard label="New trips" value={fmtNumber(data.window.newTrips)} />
              <StatCard label="Partner clicks" value={fmtNumber(data.window.partnerClicks)} />
            </div>
          </section>

          <Panel>
            <div className="grid gap-8 md:grid-cols-3">
              <DailyBars label="New users" points={fillDailySeries(data.window.newUsersPerDay, data.windowStart, data.days)} />
              <DailyBars label="New trips" points={fillDailySeries(data.window.newTripsPerDay, data.windowStart, data.days)} />
              <DailyBars label="Partner clicks" points={fillDailySeries(data.window.partnerClicksPerDay, data.windowStart, data.days)} />
            </div>
          </Panel>

          <section>
            <h2 className="text-[11px] uppercase tracking-[0.18em] text-ink-muted mb-3">All time</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              <StatCard label="Users" value={fmtNumber(data.totals.users)} />
              <StatCard label="Confirmed" value={fmtNumber(data.totals.confirmedUsers)}
                hint={data.totals.users ? `${Math.round((data.totals.confirmedUsers / data.totals.users) * 100)}% of users` : undefined} />
              <StatCard label="Onboarded" value={fmtNumber(data.totals.onboardedUsers)}
                hint={data.totals.users ? `${Math.round((data.totals.onboardedUsers / data.totals.users) * 100)}% of users` : undefined} />
              <StatCard label="Templates" value={fmtNumber(data.totals.templates)} />
              <StatCard label="User wishlists" value={fmtNumber(data.totals.userWishlists)} />
              <StatCard label="Destinations" value={fmtNumber(data.totals.destinations)} />
              <StatCard label="Open trips" value={fmtNumber(data.totals.openTrips)} />
              <StatCard label="Pending join requests" value={fmtNumber(data.totals.pendingInterests)} />
              <StatCard label="Thread messages" value={fmtNumber(data.totals.threadMessages)} />
              <StatCard label="Newsletter subscribers" value={fmtNumber(data.totals.newsletterSubscribers)} />
              <StatCard label="Partner clicks" value={fmtNumber(data.totals.partnerClicks)} />
            </div>
          </section>

          <div className="grid gap-4 md:grid-cols-2">
            <Breakdown title="Trips by status" rows={breakdown(data.totals.tripsByStatus, TRIP_STATUSES)} unavailable={!data.totals.tripsByStatus} />
            <Breakdown title="Partner leads by status" rows={breakdown(data.totals.leadsByStatus, LEAD_STATUSES)} unavailable={!data.totals.leadsByStatus} />
          </div>
        </div>
      )}
    </AdminPage>
  );
}
