import { useState } from "react";
import { formatNaira } from "../../../utils/v2Utils/host";
import type { HostDashboardMonth } from "../../../types/host";

// Two series, validated together (light surface, CVD-safe): through Hodrac
// and recorded by hand. Text never uses these colours.
const VIA = "#11845F";
const MANUAL = "#B8860B";

const monthLabel = (m: string, long = false) =>
  new Date(`${m}-01T12:00:00`).toLocaleDateString(undefined, long ? { month: "long", year: "numeric" } : { month: "short" });

// Stacked monthly bars of money received: via Hodrac (bottom) and recorded by
// hand (top). A month where hand-recorded refunds outweigh payments shows only
// its positive part as a bar; the tooltip and table give the exact figures.
export default function MonthlyCollectedChart({ months, timeZone }: { months: HostDashboardMonth[]; timeZone: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const [asTable, setAsTable] = useState(false);
  const max = Math.max(1, ...months.map(m => Math.max(0, m.viaHodracKobo) + Math.max(0, m.manualKobo)));
  const H = 180;
  const h = (kobo: number) => (Math.max(0, kobo) / max) * H;
  const total = months.reduce((s, m) => s + m.totalKobo, 0);

  return (
    <section className="rounded-2xl border border-line bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-normal text-ink">Money received by month</h2>
          <p className="text-xs text-ink-muted">{formatNaira(total)} in this period · months in {timeZone}</p>
        </div>
        <div className="flex items-center gap-4 text-xs text-ink-soft">
          <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: VIA }} /> Through Hodrac</span>
          <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: MANUAL }} /> Recorded by hand</span>
          <button type="button" onClick={() => setAsTable(t => !t)} className="underline underline-offset-4 text-ink">
            {asTable ? "Show chart" : "Show table"}
          </button>
        </div>
      </div>

      {asTable ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-ink-muted border-b border-line">
                <th className="py-2 pr-4 font-normal">Month</th>
                <th className="py-2 pr-4 font-normal text-right">Through Hodrac</th>
                <th className="py-2 pr-4 font-normal text-right">Recorded by hand</th>
                <th className="py-2 font-normal text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {months.map(m => (
                <tr key={m.month} className="border-b border-line last:border-0">
                  <td className="py-2 pr-4 text-ink">{monthLabel(m.month, true)}</td>
                  <td className="py-2 pr-4 text-right text-ink-soft">{formatNaira(m.viaHodracKobo)}</td>
                  <td className="py-2 pr-4 text-right text-ink-soft">{formatNaira(m.manualKobo)}</td>
                  <td className="py-2 text-right text-ink">{formatNaira(m.totalKobo)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="relative">
          {/* Recessive gridlines: top value and middle */}
          <div className="absolute inset-x-0 top-0 border-t border-line" style={{ height: H }} aria-hidden>
            <span className="absolute -top-2.5 right-0 bg-white pl-1 text-[10px] text-ink-muted">{formatNaira(max)}</span>
            <div className="absolute inset-x-0 border-t border-dashed border-line" style={{ top: H / 2 }} />
          </div>
          <div className="relative flex items-end gap-1 sm:gap-1.5 pr-12" style={{ height: H }} role="img"
            aria-label={`Money received by month, ${monthLabel(months[0]?.month ?? "", true)} to ${monthLabel(months[months.length - 1]?.month ?? "", true)}`}>
            {months.map((m, i) => {
              const via = h(m.viaHodracKobo);
              const manual = h(m.manualKobo);
              return (
                <div key={m.month} className="relative flex-1 h-full flex flex-col justify-end items-stretch cursor-default"
                  onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}
                  onFocus={() => setHover(i)} onBlur={() => setHover(null)} tabIndex={0}
                  aria-label={`${monthLabel(m.month, true)}: ${formatNaira(m.totalKobo)}`}>
                  {manual > 0 && <div style={{ height: manual, background: MANUAL }} className={`rounded-t-[4px] ${via > 0 ? "mb-[2px]" : ""}`} />}
                  {via > 0 && <div style={{ height: via, background: VIA }} className={manual > 0 ? "" : "rounded-t-[4px]"} />}
                  {hover === i && <div className="absolute inset-0 -z-10 rounded bg-cream-deep/70" aria-hidden />}
                  {hover === i && (
                    <div className={`absolute top-1 z-10 w-48 rounded-xl border border-line bg-white p-3 shadow-pop text-xs ${i > months.length / 2 ? "right-full mr-2" : "left-full ml-2"}`}>
                      <p className="text-ink font-medium mb-1.5">{monthLabel(m.month, true)}</p>
                      <p className="flex justify-between gap-2 text-ink-soft"><span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm" style={{ background: VIA }} />Through Hodrac</span>{formatNaira(m.viaHodracKobo)}</p>
                      <p className="flex justify-between gap-2 text-ink-soft"><span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm" style={{ background: MANUAL }} />By hand</span>{formatNaira(m.manualKobo)}</p>
                      <p className="flex justify-between gap-2 text-ink border-t border-line mt-1.5 pt-1.5"><span>Total</span>{formatNaira(m.totalKobo)}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex gap-1 sm:gap-1.5 pr-12 mt-2" aria-hidden>
            {months.map((m, i) => (
              <span key={m.month} className="flex-1 text-center text-[10px] text-ink-muted">
                {months.length <= 12 || i % 3 === 0 ? monthLabel(m.month) : ""}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
