import { useState } from "react";
import { hostingApi } from "../hostingApi";
import { AdminPage, ErrorBlock, LoadingBlock, Panel, StatCard, TextInput, Toolbar } from "../ui";
import { useQuery } from "../hooks";
import { formatNaira } from "../../utils/v2Utils/host";

const pct = (n: number | null) => (n == null ? "—" : `${n}%`);

// /admin/hosting: the Hodrac Host numbers the business plan tracks.
export default function HostingInsightsPage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const { data, loading, error, reload } = useQuery(
    () => hostingApi.insights({ from: from || undefined, to: to || undefined }), [from, to]);

  return (
    <AdminPage title="Hosting" description="Hodrac Host: money through hosted trips, fees and hosts. Defaults to the last 12 months (WAT).">
      <Toolbar>
        <div className="flex items-center gap-1.5 text-xs text-ink-muted">
          <TextInput type="date" aria-label="From" value={from} max={to || undefined} onChange={e => setFrom(e.target.value)} className="w-auto! rounded-full" />
          <span>to</span>
          <TextInput type="date" aria-label="To" value={to} min={from || undefined} onChange={e => setTo(e.target.value)} className="w-auto! rounded-full" />
        </div>
      </Toolbar>

      {error ? <ErrorBlock message={error} onRetry={reload} /> : loading && !data ? <LoadingBlock /> : data && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard label="GMV" value={formatNaira(data.gmvKobo)} hint={`${formatNaira(data.viaHodracKobo)} through Hodrac`} />
            <StatCard label="Through Hodrac" value={pct(data.percentThroughHodrac)} hint="Target: 60% or more" />
            <StatCard label="Hodrac fees" value={formatNaira(data.hodracFeeKobo)} hint={`+ ${formatNaira(data.operatorPlanRevenueKobo)} operator plans`} />
            <StatCard label="Paid departures" value={data.paidDepartures} hint={`${data.seatsPaid} seats paid`} />
            <StatCard label="Verified hosts" value={data.verifiedHosts} hint={`${data.activeHosts} active in the period`} />
            <StatCard label="Founding hosts" value={`${data.foundingHostsUsed} / ${data.foundingHostLimit}`} hint={`${data.foundingFreeDeparturesClaimed} free departures claimed`} />
            <StatCard label="Operator plans" value={data.operatorPlansActive} hint="Active now" />
            <StatCard label="Refunded (Paystack)" value={formatNaira(data.refundedViaHodracKobo)} hint={`${formatNaira(data.manualNetKobo)} net recorded by hand`} />
          </div>

          <Panel title="By month" padded={false}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-ink-muted text-left">
                  <tr className="border-b border-line">
                    {["Month", "GMV", "Through Hodrac", "% Hodrac", "Hodrac fee", "Seats paid", "Paid departures", "Active hosts", "Plan revenue"].map(h => (
                      <th key={h} className={`px-4 py-3 font-normal whitespace-nowrap ${h === "Month" ? "" : "text-right"}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {data.months.map(m => (
                    <tr key={m.month}>
                      <td className="px-4 py-3 text-ink whitespace-nowrap">{new Date(`${m.month}-01T12:00:00`).toLocaleDateString(undefined, { month: "short", year: "numeric" })}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{formatNaira(m.gmvKobo)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{formatNaira(m.viaHodracKobo)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{pct(m.percentThroughHodrac)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{formatNaira(m.hodracFeeKobo)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{m.seatsPaid}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{m.paidDepartures}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{m.activeHosts}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{formatNaira(m.operatorPlanRevenueKobo)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      )}
    </AdminPage>
  );
}
