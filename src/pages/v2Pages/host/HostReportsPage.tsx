import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { hostApi } from "../../../dataStore/v2Api/hostApi";
import { FullPageSpinner } from "../../../components/v2Components/ui";
import { FormError } from "../../../components/v2Components/host/HostUi";
import { formatNaira, formErrorText } from "../../../utils/v2Utils/host";
import { ROUTES, hostManifestPath } from "../../../utils/v2Utils/routes";
import type { HostWeeklyReport, WeeklyReportStats } from "../../../types/host";

const fmtDay = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString(undefined, { day: "numeric", month: "short" });

function shiftWeek(weekStart: string, weeks: number) {
  const d = new Date(`${weekStart}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + weeks * 7);
  return d.toISOString().slice(0, 10);
}

const METRICS: { key: keyof WeeklyReportStats; label: string; money?: boolean }[] = [
  { key: "pageViews", label: "Page views" },
  { key: "joinRequests", label: "Join requests" },
  { key: "approvals", label: "Approvals" },
  { key: "seatsPaid", label: "Seats paid" },
  { key: "collectedViaHodracKobo", label: "Through Hodrac", money: true },
  { key: "collectedManualKobo", label: "Recorded by hand", money: true },
];

// /host/reports: the weekly report (Mon–Sun, WAT), week by week.
export default function HostReportsPage() {
  const [weekStart, setWeekStart] = useState<string | undefined>(undefined);
  const [report, setReport] = useState<HostWeeklyReport | null>(null);
  const [previous, setPrevious] = useState<HostWeeklyReport | null>(null);
  const [error, setError] = useState("");
  // The latest full week (the default report); "Later" stops there.
  const [latest, setLatest] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    hostApi.weeklyReport(weekStart)
      .then(async r => {
        const prev = await hostApi.weeklyReport(shiftWeek(r.weekStart, -1)).catch(() => null);
        if (!cancelled) {
          setReport(r); setPrevious(prev); setError("");
          if (!weekStart) setLatest(r.weekStart);
        }
      })
      .catch(e => { if (!cancelled) setError(formErrorText(e, { 404: "Set up hosting to see reports." }, "Couldn't load the report.")); });
    return () => { cancelled = true; };
  }, [weekStart]);

  if (error) return <div className="max-w-xl mx-auto px-5 py-16"><FormError message={error} /></div>;
  if (!report) return <FullPageSpinner />;

  const canGoForward = !!latest && report.weekStart < latest;
  const share = report.totals.hodracSharePercentWeek;

  return (
    <div className="max-w-5xl mx-auto px-5 md:px-8 pt-6 pb-24 space-y-8">
      <Link to={ROUTES.HOST.TRIPS} className="inline-flex items-center gap-2 text-sm text-ink-soft hover:text-ink"><ArrowLeft className="w-4 h-4" /> Your trips</Link>

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.25em] text-ink-muted mb-2">Weekly report</p>
          <h1 className="text-3xl md:text-4xl font-light text-ink">{fmtDay(report.weekStart)} – {fmtDay(report.weekEnd)}</h1>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => { setReport(null); setWeekStart(shiftWeek(report.weekStart, -1)); }}
            className="inline-flex items-center gap-1 rounded-full border border-line px-3 py-1.5 text-sm text-ink hover:border-ink"><ChevronLeft className="w-4 h-4" /> Earlier</button>
          <button type="button" disabled={!canGoForward} onClick={() => { setReport(null); setWeekStart(shiftWeek(report.weekStart, 1)); }}
            className="inline-flex items-center gap-1 rounded-full border border-line px-3 py-1.5 text-sm text-ink hover:border-ink disabled:opacity-40">Later <ChevronRight className="w-4 h-4" /></button>
        </div>
      </header>

      <dl className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {METRICS.map(m => {
          const now = report.totals[m.key] as number;
          const before = previous ? (previous.totals[m.key] as number) : null;
          const diff = before == null ? null : now - before;
          return (
            <div key={m.key} className="rounded-2xl border border-line bg-white p-4">
              <dt className="text-xs text-ink-muted">{m.label}</dt>
              <dd className="text-xl text-ink mt-1">{m.money ? formatNaira(now) : now}</dd>
              {diff != null && diff !== 0 && (
                <dd className={`text-xs mt-1 ${diff > 0 ? "text-palm" : "text-ink-muted"}`}>
                  {diff > 0 ? "+" : "−"}{m.money ? formatNaira(Math.abs(diff)) : Math.abs(diff)} on the week before
                </dd>
              )}
            </div>
          );
        })}
      </dl>

      <div className="rounded-2xl border border-line bg-white p-5">
        <p className="text-sm text-ink">
          Share of seat money through Hodrac: <span className="font-medium">{share != null ? `${share}%` : "—"}</span> this week
          {report.totals.hodracSharePercentAllTime != null && <span className="text-ink-muted"> · {report.totals.hodracSharePercentAllTime}% all time</span>}
        </p>
        {share != null && (
          <div className="mt-3 h-2.5 rounded-full bg-cream-deep overflow-hidden"><div className="h-full bg-palm" style={{ width: `${Math.min(100, share)}%` }} /></div>
        )}
        <p className="text-xs text-ink-muted mt-3">Payments recorded by hand aren't covered by receipts, terms evidence or reminders. Page views count visits to your shared trip links.</p>
      </div>

      {report.trips.length > 0 && (
        <section>
          <h2 className="text-xl font-normal text-ink mb-4">By trip</h2>
          <div className="overflow-x-auto rounded-2xl border border-line bg-white">
            <table className="w-full text-sm">
              <thead className="text-xs text-ink-muted text-left">
                <tr className="border-b border-line">
                  <th className="px-4 py-3 font-normal">Trip</th>
                  {METRICS.map(m => <th key={m.key} className="px-4 py-3 font-normal text-right whitespace-nowrap">{m.label}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {report.trips.map(tr => (
                  <tr key={tr.tripId}>
                    <td className="px-4 py-3"><Link to={hostManifestPath(tr.tripId)} className="text-ink hover:underline underline-offset-4">{tr.title}</Link></td>
                    {METRICS.map(m => {
                      const v = tr.stats[m.key] as number;
                      return <td key={m.key} className="px-4 py-3 text-right text-ink tabular-nums">{m.money ? formatNaira(v) : v}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
