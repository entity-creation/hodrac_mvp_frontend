import { inputClass } from "./hostStyles";
import { formatNaira } from "../../../utils/v2Utils/host";
import type { DateRow } from "../../../utils/v2Utils/hostSchedule";

// One date input per instalment (TravellerChooses trips). Errors are keyed by
// the row's position: the API's instalmentDates[i].dueDate.
export default function InstalmentDatesPicker({ rows, onChange, min, max, errors }: {
  rows: DateRow[];
  onChange: (rows: DateRow[]) => void;
  min: string; // yyyy-MM-dd, today
  max: string | null; // payInFullByDate
  errors: Record<string, string>;
}) {
  return (
    <div className="space-y-3">
      {rows.map((r, i) => {
        const err = errors[`instalmentDates[${i}].dueDate`];
        return (
          <label key={r.sequence} className="grid grid-cols-[1fr_11rem] items-center gap-3">
            <span className="text-sm text-ink">
              Instalment {r.sequence} <span className="text-ink-muted">· {formatNaira(r.amountKobo)}</span>
            </span>
            <input type="date" className={inputClass} value={r.dueDate} required
              min={rows[i - 1]?.dueDate || min} max={max ?? undefined} aria-invalid={!!err}
              onChange={e => onChange(rows.map((x, j) => (j === i ? { ...x, dueDate: e.target.value } : x)))} />
            {err && <span className="col-span-2 text-xs text-red-700 -mt-1">{err}</span>}
          </label>
        );
      })}
    </div>
  );
}
