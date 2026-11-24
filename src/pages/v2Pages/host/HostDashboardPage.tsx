import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Download, MessageCircle, Search, UserX, X } from "lucide-react";
import { hostApi } from "../../../dataStore/v2Api/hostApi";
import { Button } from "../../../components/v2Components/ui";
import { FormError, PaymentStatusChip } from "../../../components/v2Components/host/HostUi";
import MonthlyCollectedChart from "../../../components/v2Components/host/MonthlyCollectedChart";
import RemoveTravellerModal from "../../../components/v2Components/host/RemoveTravellerModal";
import { inputClass } from "../../../components/v2Components/host/hostStyles";
import { formatNaira, formErrorText, trackHost } from "../../../utils/v2Utils/host";
import { ROUTES, hostManifestPath } from "../../../utils/v2Utils/routes";
import type {
  HostDashboardFilters, HostDashboardTraveller, HostDashboardTravellerSort,
  HostDashboardTrip, HostDashboardTripSort, HostPaged, TripStatus,
} from "../../../types/host";

const PAGE_SIZE = 25;
const fmtDay = (d: string | null | undefined) =>
  d ? new Date(`${d}T12:00:00`).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "—";

// yyyy-MM-dd of the first day of the month `n - 1` months ago (chart period start).
function monthsAgo(n: number) {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - (n - 1));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

// Loads `fn` whenever `key` changes; `loading` while the result is for an older key.
function useLoad<T>(key: string, fn: () => Promise<T>) {
  const [result, setResult] = useState<{ key: string; data?: T; error?: string } | null>(null);
  const [nonce, setNonce] = useState(0);
  useEffect(() => {
    let cancelled = false;
    fn().then(data => { if (!cancelled) setResult({ key, data }); })
      .catch(e => { if (!cancelled) setResult({ key, error: formErrorText(e, { 400: "One of the filters isn't valid." }, "Couldn't load this.") }); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, nonce]);
  const current = result?.key === key ? result : null;
  return { data: current?.data, error: current?.error, loading: !current, stale: result?.data, reload: () => setNonce(n => n + 1) };
}

// /host/dashboard: every hosted trip at once. Filters live in the URL
// (?tripId= from a manifest's "Money" link, status, upcoming, search, dates).
export default function HostDashboardPage() {
  const [params, setParams] = useSearchParams();
  const get = (k: string) => params.get(k) ?? "";
  const tab = get("tab") === "travellers" ? "travellers" : "trips";

  const filters: HostDashboardFilters = useMemo(() => ({
    tripId: params.get("tripId") || undefined,
    status: (params.get("status") as TripStatus) || undefined,
    upcoming: params.get("upcoming") === "true" ? true : params.get("upcoming") === "false" ? false : undefined,
    search: params.get("search") || undefined,
    startFrom: params.get("startFrom") || undefined,
    startTo: params.get("startTo") || undefined,
  }), [params]);
  const filterKey = JSON.stringify(filters);

  const setParam = (k: string, v: string | null) => setParams(prev => {
    const n = new URLSearchParams(prev);
    if (v) n.set(k, v); else n.delete(k);
    if (k !== "tPage" && k !== "vPage") { n.delete("tPage"); n.delete("vPage"); }
    return n;
  }, { replace: true });

  // Search box: applied when typing pauses.
  const [search, setSearch] = useState(get("search"));
  useEffect(() => {
    const t = window.setTimeout(() => { if (search !== get("search")) setParam("search", search.trim() || null); }, 400);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const [chartMonths, setChartMonths] = useState(12);
  const summary = useLoad(`${filterKey}|${chartMonths}`, () => hostApi.dashboard.summary({ ...filters, paidFrom: monthsAgo(chartMonths) }));
  const s = summary.data ?? summary.stale;
  const filtered = Object.values(filters).some(v => v !== undefined);

  return (
    <div className="max-w-6xl mx-auto px-5 md:px-8 pt-6 pb-24 space-y-6">
      <Link to={ROUTES.HOST.TRIPS} className="inline-flex items-center gap-2 text-sm text-ink-soft hover:text-ink"><ArrowLeft className="w-4 h-4" /> Your trips</Link>

      <header>
        <p className="text-[11px] uppercase tracking-[0.25em] text-ink-muted mb-2">Hodrac Host</p>
        <h1 className="text-3xl md:text-4xl font-light text-ink">Money across your trips</h1>
        <p className="text-sm text-ink-muted mt-1">Collected, owed and overdue for every hosted trip, and who to chase.</p>
      </header>

      {/* Filters */}
      <div className="rounded-2xl border border-line bg-white p-4 flex flex-wrap items-end gap-3">
        <label className="flex-1 min-w-48">
          <span className="block text-xs text-ink-muted mb-1">Search</span>
          <span className="relative block">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input className={`${inputClass} pl-9`} value={search} onChange={e => setSearch(e.target.value)} placeholder="Trip or traveller" />
          </span>
        </label>
        <label>
          <span className="block text-xs text-ink-muted mb-1">Status</span>
          <select className={inputClass} value={get("status")} onChange={e => setParam("status", e.target.value || null)}>
            <option value="">All</option><option value="Open">Open</option><option value="Closed">Closed</option><option value="Cancelled">Cancelled</option>
          </select>
        </label>
        <label>
          <span className="block text-xs text-ink-muted mb-1">Trips</span>
          <select className={inputClass} value={get("upcoming")} onChange={e => setParam("upcoming", e.target.value || null)}>
            <option value="">Upcoming and past</option><option value="true">Upcoming</option><option value="false">Past</option>
          </select>
        </label>
        <label>
          <span className="block text-xs text-ink-muted mb-1">Starting from</span>
          <input type="date" className={inputClass} value={get("startFrom")} onChange={e => setParam("startFrom", e.target.value || null)} />
        </label>
        <label>
          <span className="block text-xs text-ink-muted mb-1">Starting by</span>
          <input type="date" className={inputClass} value={get("startTo")} min={get("startFrom") || undefined} onChange={e => setParam("startTo", e.target.value || null)} />
        </label>
        {filtered && (
          <button type="button" onClick={() => { setSearch(""); setParams(tab === "travellers" ? { tab } : {}, { replace: true }); }}
            className="inline-flex items-center gap-1 text-sm text-ink-soft hover:text-ink pb-3">
            <X className="w-4 h-4" /> Clear filters
          </button>
        )}
      </div>
      {filters.tripId && (
        <p className="text-sm text-ink-soft -mt-3">
          Showing one trip. <button type="button" className="underline underline-offset-4 text-ink" onClick={() => setParam("tripId", null)}>Show all trips</button>
        </p>
      )}

      {summary.error ? <FormError message={summary.error} /> : !s ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 motion-safe:animate-pulse" aria-busy="true">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 rounded-2xl bg-cream-deep" />)}
        </div>
      ) : (
        <div className={summary.loading ? "opacity-60 transition-opacity" : ""}>
          <dl className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat label="Collected" value={formatNaira(s.collectedTotalKobo)}
              hint={`${formatNaira(s.collectedViaHodracKobo)} through Hodrac · ${formatNaira(s.collectedManualKobo)} by hand`} />
            <Stat label="Still owed" value={formatNaira(s.owedKobo)}
              hint={s.overdueKobo > 0 ? `${formatNaira(s.overdueKobo)} overdue from ${s.overdueTravellers} traveller${s.overdueTravellers === 1 ? "" : "s"}` : "Nothing overdue"}
              tone={s.overdueKobo > 0 ? "warn" : undefined} />
            <Stat label="Seats sold" value={`${s.seatsSold} of ${s.seatsTotal}`}
              hint={`${s.seatsPaidInFull} paid in full · ${s.seatsWithDeposit} with a deposit · ${s.trips} trip${s.trips === 1 ? "" : "s"}`} />
            <Stat label="Estimated net to you" value={formatNaira(s.fees.estimatedNetToHostKobo)}
              hint="Paid through Hodrac, minus the Hodrac fee you absorbed and Paystack's fee. An estimate: Paystack settles on its own schedule." />
          </dl>

          <details className="mt-3 rounded-2xl border border-line bg-white px-4 py-3 text-sm">
            <summary className="cursor-pointer text-ink">Fees and refunds</summary>
            <dl className="grid sm:grid-cols-2 gap-x-8 gap-y-2 mt-3">
              <Row label="Hodrac fee paid by travellers" value={formatNaira(s.fees.hodracFeeTravellerPaidKobo)} />
              <Row label="Hodrac fee you absorbed" value={formatNaira(s.fees.hodracFeeHostAbsorbedKobo)} />
              <Row label="Paystack fees" value={formatNaira(s.fees.paystackFeeKobo)} />
              <Row label="Refunded through Hodrac" value={formatNaira(s.fees.refundedViaHodracKobo)} />
              <Row label="Refunded by hand" value={formatNaira(s.fees.refundedManualKobo)} />
              <Row label="Refunded in total" value={formatNaira(s.fees.refundedTotalKobo)} />
            </dl>
            <p className="text-xs text-ink-muted mt-3">Collected includes travellers who withdrew or were removed, since that money was received. Owed and overdue only count current seats on trips that aren't cancelled. A deposit is never counted as overdue.</p>
          </details>

          <div className="mt-6">
            <div className="flex justify-end gap-1 mb-2 text-xs">
              {[12, 24, 36].map(n => (
                <button key={n} type="button" onClick={() => setChartMonths(n)} aria-pressed={chartMonths === n}
                  className={`rounded-full px-3 py-1 border ${chartMonths === n ? "bg-ink text-white border-ink" : "border-line text-ink hover:border-ink/40"}`}>
                  {n} months
                </button>
              ))}
            </div>
            <MonthlyCollectedChart months={s.monthly} timeZone={s.timeZone} />
          </div>
        </div>
      )}

      <div className="flex gap-2 border-b border-line" role="tablist">
        {([["trips", "Trips"], ["travellers", "Who owes me"]] as const).map(([key, label]) => (
          <button key={key} role="tab" aria-selected={tab === key} type="button" onClick={() => setParam("tab", key === "trips" ? null : key)}
            className={`px-4 py-2.5 -mb-px border-b-2 text-sm ${tab === key ? "border-ink text-ink font-medium" : "border-transparent text-ink-soft hover:text-ink"}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === "trips"
        ? <TripsTable filters={filters} filterKey={filterKey} page={Math.max(1, Number(get("tPage")) || 1)} onPage={p => setParam("tPage", p > 1 ? String(p) : null)} />
        : <TravellersTable filters={filters} filterKey={filterKey} page={Math.max(1, Number(get("vPage")) || 1)} onPage={p => setParam("vPage", p > 1 ? String(p) : null)} onChanged={summary.reload} />}
    </div>
  );
}

function Stat({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: "warn" }) {
  return (
    <div className={`rounded-2xl border p-4 ${tone === "warn" ? "border-red-200 bg-red-50/40" : "border-line bg-white"}`}>
      <dt className="text-xs text-ink-muted">{label}</dt>
      <dd className="text-xl text-ink mt-1">{value}</dd>
      {hint && <dd className="text-xs text-ink-muted mt-1 leading-snug">{hint}</dd>}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-4"><dt className="text-ink-soft">{label}</dt><dd className="text-ink">{value}</dd></div>;
}

// ─── Trips ────────────────────────────────────────────────────────────────────

const TRIP_SORTS: { value: HostDashboardTripSort; label: string }[] = [
  { value: "startDate", label: "Start date" }, { value: "owed", label: "Most owed" },
  { value: "overdue", label: "Most overdue" }, { value: "collected", label: "Most collected" },
];

function TripsTable({ filters, filterKey, page, onPage }: { filters: HostDashboardFilters; filterKey: string; page: number; onPage: (p: number) => void }) {
  const navigate = useNavigate();
  const [sort, setSort] = useState<HostDashboardTripSort>("startDate");
  const res = useLoad(`${filterKey}|${sort}|${page}`, () => hostApi.dashboard.trips({ ...filters, sort, page, pageSize: PAGE_SIZE }));
  const data = res.data ?? res.stale;

  return (
    <Listing
      toolbar={<>
        <SortSelect value={sort} options={TRIP_SORTS} onChange={v => { setSort(v); onPage(1); }} />
        <CsvButton label="Download trips" run={() => hostApi.dashboard.downloadTripsCsv({ ...filters, sort })} />
      </>}
      error={res.error} loading={res.loading} data={data} page={page} onPage={onPage} empty="No trips match these filters."
      head={["Trip", "Seats", "Collected", "Owed", "Overdue", "Next due"]}
      row={(t: HostDashboardTrip) => {
        const seats = Math.max(0, (t.seatsTotal ?? 1) - 1); // seatsTotal includes the host
        return (
          <tr key={t.id} className="border-b border-line last:border-0 hover:bg-cream cursor-pointer" onClick={() => navigate(hostManifestPath(t.id))}>
            <td className="py-3 pr-4">
              <Link to={hostManifestPath(t.id)} className="text-ink hover:underline underline-offset-4" onClick={e => e.stopPropagation()}>{t.title}</Link>
              <p className="text-xs text-ink-muted">
                {[t.locationLabel, t.startDate ? fmtDay(t.startDate) : null].filter(Boolean).join(" · ")}
                {t.status !== "Open" && <span className="ml-1 rounded-full bg-sun-100 text-sun-500 px-1.5">{t.status}</span>}
                {t.instalmentDatesMode === "TravellerChooses" && <span className="ml-1">· travellers choose dates</span>}
              </p>
            </td>
            <td className="py-3 pr-4 text-ink-soft whitespace-nowrap">{t.seatsPaidInFull} paid · {t.approved} of {seats || "—"}</td>
            <td className="py-3 pr-4 text-ink whitespace-nowrap">{formatNaira(t.collectedTotalKobo)}</td>
            <td className="py-3 pr-4 text-ink whitespace-nowrap">{formatNaira(t.owedKobo)}</td>
            <td className={`py-3 pr-4 whitespace-nowrap ${t.overdueKobo > 0 ? "text-red-700" : "text-ink-muted"}`}>
              {t.overdueKobo > 0 ? `${formatNaira(t.overdueKobo)} · ${t.overdueTravellers}` : "—"}
            </td>
            <td className="py-3 text-ink-soft whitespace-nowrap">{fmtDay(t.nextDueDate)}</td>
          </tr>
        );
      }}
    />
  );
}

// ─── Travellers ("who owes me") ───────────────────────────────────────────────

const TRAVELLER_SORTS: { value: HostDashboardTravellerSort; label: string }[] = [
  { value: "nextDueDate", label: "Next due" }, { value: "owes", label: "Owes most" }, { value: "overdue", label: "Most overdue" },
];
type Who = "owing" | "overdue" | "all";

function TravellersTable({ filters, filterKey, page, onPage, onChanged }: {
  filters: HostDashboardFilters; filterKey: string; page: number; onPage: (p: number) => void; onChanged: () => void;
}) {
  const [sort, setSort] = useState<HostDashboardTravellerSort>("nextDueDate");
  const [who, setWho] = useState<Who>("owing");
  const [removing, setRemoving] = useState<HostDashboardTraveller | null>(null);
  const [notice, setNotice] = useState("");
  const scope = who === "owing" ? { owing: true } : who === "overdue" ? { overdue: true } : {};
  const res = useLoad(`${filterKey}|${sort}|${who}|${page}`, () => hostApi.dashboard.travellers({ ...filters, ...scope, sort, page, pageSize: PAGE_SIZE }));
  const data = res.data ?? res.stale;

  const nudge = async (t: HostDashboardTraveller) => {
    setNotice("");
    try {
      const n = await hostApi.whatsAppNudge(t.tripId, t.interestId);
      trackHost("whatsapp_nudge_clicked", { from: "dashboard" });
      window.open(n.url, "_blank", "noopener,noreferrer");
    } catch (e) {
      setNotice(formErrorText(e, {}, "Couldn't create the WhatsApp message."));
    }
  };

  return (
    <>
      {notice && <p role="status" className="rounded-2xl border border-line bg-white px-4 py-3 text-sm text-ink">{notice}</p>}
      <Listing
        toolbar={<>
          <div className="inline-flex gap-1">
            {([["owing", "Owes money"], ["overdue", "Overdue"], ["all", "Everyone"]] as const).map(([key, label]) => (
              <button key={key} type="button" aria-pressed={who === key} onClick={() => { setWho(key); onPage(1); }}
                className={`rounded-full px-3 py-1.5 text-sm border ${who === key ? "bg-ink text-white border-ink" : "border-line text-ink hover:border-ink/40"}`}>{label}</button>
            ))}
          </div>
          <SortSelect value={sort} options={TRAVELLER_SORTS} onChange={v => { setSort(v); onPage(1); }} />
          <CsvButton label="Download travellers" run={() => hostApi.dashboard.downloadTravellersCsv({ ...filters, ...scope, sort })} />
        </>}
        error={res.error} loading={res.loading} data={data} page={page} onPage={onPage}
        empty={who === "overdue" ? "Nobody is overdue." : who === "owing" ? "Nobody owes you money right now." : "No travellers match these filters."}
        head={["Traveller", "Trip", "Paid", "Owes", "Next due", ""]}
        row={(t: HostDashboardTraveller) => (
          <tr key={t.interestId} className="border-b border-line last:border-0 align-top">
            <td className="py-3 pr-4">
              <p className="text-ink">{t.travellerName}</p>
              <p className="text-xs text-ink-muted break-all">{[t.phone, t.email].filter(Boolean).join(" · ") || "No contact details"}</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {t.interestStatus === "Removed" ? <span className="rounded-full bg-red-50 text-red-700 text-xs px-2 py-0.5">Removed</span>
                  : t.interestStatus !== "Approved" ? <span className="rounded-full bg-cream-deep text-ink-muted text-xs px-2 py-0.5">{t.interestStatus}</span>
                  : <PaymentStatusChip status={t.paymentStatus} />}
              </div>
              {t.removedReason && <p className="text-xs text-ink-muted mt-1">{t.removedReason}</p>}
            </td>
            <td className="py-3 pr-4">
              <Link to={hostManifestPath(t.tripId)} className="text-ink hover:underline underline-offset-4">{t.tripTitle}</Link>
              <p className="text-xs text-ink-muted">{fmtDay(t.tripStartDate)}</p>
            </td>
            <td className="py-3 pr-4 text-ink-soft whitespace-nowrap">{formatNaira(t.paidKobo)}</td>
            <td className="py-3 pr-4 text-ink whitespace-nowrap">{formatNaira(t.owesKobo)}</td>
            <td className="py-3 pr-4 whitespace-nowrap">
              <p className="text-ink-soft">{fmtDay(t.nextDueDate)}{t.nextDueAmountKobo ? ` · ${formatNaira(t.nextDueAmountKobo)}` : ""}</p>
              {t.overdueKobo > 0 && (
                <p className="text-xs text-red-700">{formatNaira(t.overdueKobo)} overdue{t.daysOverdue != null ? ` · ${t.daysOverdue} day${t.daysOverdue === 1 ? "" : "s"}` : ""}</p>
              )}
              {t.datesChosenByTraveller && <p className="text-xs text-ink-muted">Their own dates</p>}
              {t.lastReminderAt && <p className="text-xs text-ink-muted">Reminded {new Date(t.lastReminderAt).toLocaleDateString()}</p>}
            </td>
            <td className="py-3">
              <div className="flex flex-col items-start gap-1">
                {t.owesKobo > 0 && t.interestStatus === "Approved" && (
                  <button type="button" onClick={() => nudge(t)} className="inline-flex items-center gap-1 text-sm text-ink hover:underline underline-offset-4 whitespace-nowrap">
                    <MessageCircle className="w-4 h-4" /> Remind
                  </button>
                )}
                {t.canRemove && (
                  <button type="button" onClick={() => setRemoving(t)} className="inline-flex items-center gap-1 text-sm text-red-700 hover:underline underline-offset-4 whitespace-nowrap">
                    <UserX className="w-4 h-4" /> Remove
                  </button>
                )}
              </div>
            </td>
          </tr>
        )}
      />
      {removing && (
        <RemoveTravellerModal tripId={removing.tripId} interestId={removing.interestId} travellerName={removing.travellerName}
          onClose={() => setRemoving(null)}
          onRemoved={() => { setNotice(`${removing.travellerName} was removed from ${removing.tripTitle}. Their seat is free.`); setRemoving(null); res.reload(); onChanged(); }} />
      )}
    </>
  );
}

// ─── Shared list pieces ───────────────────────────────────────────────────────

function Listing<T>({ toolbar, error, loading, data, page, onPage, empty, head, row }: {
  toolbar: ReactNode; error?: string; loading: boolean; data?: HostPaged<T>; page: number; onPage: (p: number) => void;
  empty: string; head: string[]; row: (item: T) => ReactNode;
}) {
  const totalPages = data ? Math.max(1, Math.ceil(data.totalCount / data.pageSize)) : 1;
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">{toolbar}</div>
      {error ? <FormError message={error} /> : !data ? (
        <div className="space-y-2 motion-safe:animate-pulse" aria-busy="true">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 rounded-xl bg-cream-deep" />)}
        </div>
      ) : data.items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line p-8 text-center text-ink-muted">{empty}</p>
      ) : (
        <div className={`rounded-2xl border border-line bg-white overflow-x-auto ${loading ? "opacity-60" : ""}`}>
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="text-left text-xs text-ink-muted border-b border-line">
                {head.map((h, i) => <th key={i} className="py-2.5 px-0 first:pl-4 pr-4 font-normal">{h}</th>)}
              </tr>
            </thead>
            <tbody className="[&_td:first-child]:pl-4">{data.items.map(row)}</tbody>
          </table>
        </div>
      )}
      {data && totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-ink-muted">{data.totalCount} in total</span>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => onPage(page - 1)}>Previous</Button>
            <span className="text-ink-soft">Page {page} of {totalPages}</span>
            <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>Next</Button>
          </div>
        </div>
      )}
    </section>
  );
}

function SortSelect<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <label className="inline-flex items-center gap-2 text-sm text-ink-soft ml-auto whitespace-nowrap">
      Sort by
      <select className={`${inputClass} py-1.5`} value={value} onChange={e => onChange(e.target.value as T)}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}

function CsvButton({ label, run }: { label: string; run: () => Promise<unknown> }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <span className="inline-flex flex-col">
      <Button size="sm" variant="outline" loading={busy} onClick={async () => {
        setBusy(true); setError("");
        try { await run(); } catch (e) { setError(formErrorText(e, {}, "Couldn't download the CSV.")); } finally { setBusy(false); }
      }}>
        <Download className="w-4 h-4" /> {label}
      </Button>
      {error && <span className="text-xs text-red-700 mt-1">{error}</span>}
    </span>
  );
}
