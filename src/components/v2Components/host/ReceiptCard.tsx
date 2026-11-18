import { formatNaira } from "../../../utils/v2Utils/host";
import type { PaymentReceipt } from "../../../types/host";

const fmtDay = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

const kindLabel = (r: PaymentReceipt) =>
  r.kind === "Deposit" ? "Deposit" : r.kind === "Full" ? "Full balance" : `Instalment ${r.instalmentSequence ?? ""}`.trim();

// A printable payment receipt.
export function ReceiptCard({ receipt: r }: { receipt: PaymentReceipt }) {
  const rows: [string, string][] = [
    ["Trip", r.tripTitle + (r.startDate ? ` (${fmtDay(r.startDate)}${r.endDate ? ` – ${fmtDay(r.endDate)}` : ""})` : "")],
    ["Host", r.hostDisplayName],
    ["Payment", kindLabel(r)],
    ["Seat amount", formatNaira(r.seatAmountKobo)],
    ...(r.feeKobo > 0 ? [["Booking fee", formatNaira(r.feeKobo)] as [string, string]] : []),
    ["Total paid", formatNaira(r.totalKobo)],
    ...(r.refundedKobo > 0 ? [["Refunded", formatNaira(r.refundedKobo)] as [string, string]] : []),
    ["Paid on", r.paidAt ? new Date(r.paidAt).toLocaleString() : "—"],
    ...(r.channel ? [["Method", r.channel.replace(/_/g, " ")] as [string, string]] : []),
    ...(r.termsVersionAccepted ? [["Terms accepted", `Version ${r.termsVersionAccepted}`] as [string, string]] : []),
    ["Reference", r.reference],
  ];
  return (
    <div className="rounded-2xl border border-line bg-white p-6 print:border-0 print:p-0">
      <p className="text-[11px] uppercase tracking-[0.25em] text-ink-muted mb-4">Receipt · Hodrac</p>
      <dl className="divide-y divide-line text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 py-2.5">
            <dt className="text-ink-soft">{k}</dt>
            <dd className="text-ink text-right break-all">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="text-xs text-ink-muted mt-4">
        Paid to {r.hostDisplayName} through Paystack. Hodrac (operated by Ionva Limited) never holds traveller money.
      </p>
    </div>
  );
}
