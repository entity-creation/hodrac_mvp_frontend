import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, BarChart3, Download, ExternalLink, MessageCircle, Pencil, Plus, Trash2, UserX } from "lucide-react";
import { tripClient } from "../../../dataStore/v2Api/client";
import { hostApi } from "../../../dataStore/v2Api/hostApi";
import { useManifestHub } from "../../../hooks/v2Hooks/useManifestHub";
import { Button, FullPageSpinner, Modal } from "../../../components/v2Components/ui";
import { FormError, HostField, PaymentStatusChip, SeatHoldCountdown } from "../../../components/v2Components/host/HostUi";
import RemoveTravellerModal from "../../../components/v2Components/host/RemoveTravellerModal";
import { inputClass } from "../../../components/v2Components/host/hostStyles";
import { fieldErrors, formatNaira, formErrorText, trackHost } from "../../../utils/v2Utils/host";
import { friendlyError, TRIP_CONFLICTS } from "../../../utils/v2Utils/apiErrors";
import { parseNaira } from "../../../utils/v2Utils/hostSchedule";
import { ROUTES, hostEditTripPath, tripPath } from "../../../utils/v2Utils/routes";
import type { Manifest, ManifestRow, ManualPayment, ManualPaymentMethod } from "../../../types/host";

type Filter = "all" | "owes" | "overdue" | "paid";

const fmtDay = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString(undefined, { day: "numeric", month: "short" });
// The API works out overdue (unpaid instalments past due, WAT; never the deposit).
const isOverdue = (r: ManifestRow) => r.overdueKobo > 0;

// /host/trips/:id: who has paid, who owes, and what to chase. Live.
export default function HostManifestPage() {
  const { id = "" } = useParams<{ id: string }>();
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [toast, setToast] = useState("");
  const [recording, setRecording] = useState<ManifestRow | null>(null);
  const [removing, setRemoving] = useState<ManifestRow | null>(null);
  const [csvBusy, setCsvBusy] = useState(false);
  const previous = useRef<Map<string, number>>(new Map());

  const refresh = useCallback(async () => {
    const m = await hostApi.manifest(id);
    // A row whose Hodrac payments went up: say so.
    const prev = previous.current;
    if (prev.size) {
      const paid = m.rows.find(r => r.viaHodracKobo > (prev.get(r.interestId) ?? 0));
      if (paid) setToast(`${paid.travellerName} paid ${formatNaira(paid.viaHodracKobo - (prev.get(paid.interestId) ?? 0))}`);
    }
    previous.current = new Map(m.rows.map(r => [r.interestId, r.viaHodracKobo]));
    setManifest(m);
  }, [id]);

  useEffect(() => {
    refresh().catch(e => setError(formErrorText(e, { 404: "This trip doesn't exist or isn't one of your hosted trips." }, "Couldn't load the manifest.")));
  }, [refresh]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(""), 6000);
    return () => window.clearTimeout(t);
  }, [toast]);

  useManifestHub(id, () => { refresh().catch(() => {}); });

  const rows = useMemo(() => {
    const all = manifest?.rows ?? [];
    if (filter === "owes") return all.filter(r => r.owesKobo > 0);
    if (filter === "overdue") return all.filter(isOverdue);
    if (filter === "paid") return all.filter(r => r.paymentStatus === "PaidInFull");
    return all;
  }, [manifest, filter]);

  if (error) return <div className="max-w-xl mx-auto px-5 py-16 space-y-4"><FormError message={error} /><Link to={ROUTES.HOST.TRIPS} className="text-ink underline underline-offset-4">Back to your trips</Link></div>;
  if (!manifest) return <FullPageSpinner />;

  const t = manifest.totals;
  const seats = Math.max(0, (manifest.seatsTotal ?? 1) - 1);
  const viaShare = t.paidKobo > 0 ? Math.round((t.viaHodracKobo / t.paidKobo) * 100) : null;
  const counts = {
    all: manifest.rows.length,
    owes: manifest.rows.filter(r => r.owesKobo > 0).length,
    overdue: manifest.rows.filter(isOverdue).length,
    paid: manifest.rows.filter(r => r.paymentStatus === "PaidInFull").length,
  };

  const downloadCsv = async () => {
    setCsvBusy(true);
    try { await hostApi.downloadManifestCsv(id); }
    catch (e) { setToast(formErrorText(e, {}, "Couldn't download the CSV.")); }
    finally { setCsvBusy(false); }
  };

  return (
    <div className="max-w-6xl mx-auto px-5 md:px-8 pt-6 pb-24 space-y-6">
      <Link to={ROUTES.HOST.TRIPS} className="inline-flex items-center gap-2 text-sm text-ink-soft hover:text-ink"><ArrowLeft className="w-4 h-4" /> Your trips</Link>

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.25em] text-ink-muted mb-2">Manifest</p>
          <h1 className="text-3xl md:text-4xl font-light text-ink">{manifest.title}</h1>
          {manifest.startDate && <p className="text-sm text-ink-muted mt-1">{fmtDay(manifest.startDate)}{manifest.endDate ? ` – ${fmtDay(manifest.endDate)}` : ""} · {formatNaira(manifest.pricePerSeatKobo)} a seat · terms version {manifest.termsVersion}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" loading={csvBusy} onClick={downloadCsv}><Download className="w-4 h-4" /> Download CSV</Button>
          <Link to={`${ROUTES.HOST.DASHBOARD}?tripId=${id}`} className="inline-flex items-center gap-1.5 rounded-full border border-line px-4 py-2 text-sm text-ink hover:border-ink"><BarChart3 className="w-4 h-4" /> Money</Link>
          <Link to={hostEditTripPath(id)} className="inline-flex items-center gap-1.5 rounded-full border border-line px-4 py-2 text-sm text-ink hover:border-ink"><Pencil className="w-4 h-4" /> Edit</Link>
          <a href={tripPath(id)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-line px-4 py-2 text-sm text-ink hover:border-ink"><ExternalLink className="w-4 h-4" /> Trip page</a>
        </div>
      </header>

      <dl className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Total label="Seats paid in full" value={`${t.seatsPaidInFull} of ${seats || "—"}`} hint={`${t.seatsWithDeposit} with a deposit`} />
        <Total label="Collected" value={formatNaira(t.paidKobo)}
          hint={`${formatNaira(t.owesKobo)} still owed${t.overdueKobo > 0 ? ` · ${formatNaira(t.overdueKobo)} overdue` : ""}`} />
        <Total label="Through Hodrac" value={viaShare != null ? `${viaShare}%` : "—"}
          hint="Payments recorded by hand aren't covered by receipts, terms evidence or reminders." />
        <Total label="Approved travellers" value={String(t.approved)} hint={`${t.travellers} on the list`} />
      </dl>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter travellers">
        {([["all", "All"], ["owes", "Owes money"], ["overdue", "Overdue"], ["paid", "Paid in full"]] as const).map(([key, label]) => (
          <button key={key} role="tab" aria-selected={filter === key} onClick={() => setFilter(key)}
            className={`rounded-full px-4 py-1.5 text-sm border transition-colors ${filter === key ? "bg-ink text-white border-ink" : "border-line text-ink hover:border-ink/40"}`}>
            {label} · {counts[key]}
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line p-8 text-center text-ink-muted">
          {manifest.rows.length ? "Nobody matches this filter." : "No requests yet. Share your trip link to get started."}
        </p>
      ) : (
        <ul className="space-y-3">
          {rows.map(r => (
            <ManifestRowCard key={r.interestId} tripId={id} row={r} termsVersion={manifest.termsVersion}
              onChanged={() => refresh().catch(() => {})} onRecord={() => setRecording(r)} onRemove={() => setRemoving(r)} />
          ))}
        </ul>
      )}

      {recording && (
        <RecordPaymentModal tripId={id} row={recording} onClose={() => setRecording(null)}
          onChanged={() => refresh().catch(() => {})}
          onSaved={() => { setRecording(null); setToast("Payment recorded."); refresh().catch(() => {}); }} />
      )}

      {removing && (
        <RemoveTravellerModal tripId={id} interestId={removing.interestId} travellerName={removing.travellerName}
          onClose={() => setRemoving(null)}
          onRemoved={() => { setToast(`${removing.travellerName} was removed. Their seat is free.`); setRemoving(null); refresh().catch(() => {}); }} />
      )}

      {toast && (
        <div role="status" className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-full bg-palm text-white px-5 py-3 text-sm shadow-pop-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

function Total({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <dt className="text-xs text-ink-muted">{label}</dt>
      <dd className="text-xl text-ink mt-1">{value}</dd>
      {hint && <dd className="text-xs text-ink-muted mt-1">{hint}</dd>}
    </div>
  );
}

function ManifestRowCard({ tripId, row: r, termsVersion, onChanged, onRecord, onRemove }: {
  tripId: string; row: ManifestRow; termsVersion: number;
  onChanged: () => void; onRecord: () => void; onRemove: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const paid = r.paymentStatus === "PaidInFull" || r.paymentStatus === "DepositPaid" || r.paymentStatus === "PartPaid";

  const respond = async (approve: boolean) => {
    setBusy(true);
    setError("");
    try {
      await tripClient.respondToInterest(tripId, r.interestId, approve);
      if (approve) trackHost("interest_approved", { tripType: "hosted" });
      onChanged();
    } catch (e) {
      setError(friendlyError(e, { 409: TRIP_CONFLICTS.approve }, "Couldn't update this request."));
    } finally {
      setBusy(false);
    }
  };

  const nudge = async () => {
    setError("");
    try {
      const n = await hostApi.whatsAppNudge(tripId, r.interestId);
      trackHost("whatsapp_nudge_clicked");
      window.open(n.url, "_blank", "noopener,noreferrer");
    } catch (e) {
      setError(formErrorText(e, {}, "Couldn't create the WhatsApp message."));
    }
  };

  return (
    <li className={`rounded-2xl border bg-white p-4 sm:p-5 ${paid ? "border-palm/30" : "border-line"}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-ink font-medium">{r.travellerName}</p>
            {r.interestStatus === "Requested" ? <span className="rounded-full bg-cream-deep text-ink-soft text-xs px-2.5 py-0.5">Requested</span>
              : r.interestStatus === "Withdrawn" ? <span className="rounded-full bg-cream-deep text-ink-muted text-xs px-2.5 py-0.5">Withdrawn</span>
              : r.interestStatus === "Removed" ? <span className="rounded-full bg-red-50 text-red-700 text-xs px-2.5 py-0.5">Removed</span>
              : <PaymentStatusChip status={r.paymentStatus} />}
            {isOverdue(r) && <span className="rounded-full bg-red-50 text-red-700 text-xs px-2.5 py-0.5">Overdue {formatNaira(r.overdueKobo)}</span>}
          </div>
          {r.interestStatus === "Removed" && (
            <p className="text-xs text-ink-muted mt-0.5">
              Removed{r.removedAt ? ` ${new Date(r.removedAt).toLocaleDateString()}` : ""}{r.removedReason ? `: ${r.removedReason}` : "."}
            </p>
          )}
          <p className="text-sm text-ink-muted mt-0.5 break-all">{[r.phone, r.email].filter(Boolean).join(" · ") || "No contact details"}</p>
          {r.paymentStatus === "AwaitingDeposit" && r.seatHoldExpiresAt && <div className="mt-1"><SeatHoldCountdown until={r.seatHoldExpiresAt} /></div>}
        </div>

        <div className="flex flex-wrap gap-2">
          {(r.interestStatus === "Requested" || (r.interestStatus === "Approved" && r.paymentStatus === "Expired")) && (
            <>
              <Button size="sm" loading={busy} onClick={() => respond(true)}>
                {r.paymentStatus === "Expired" ? "Approve again" : "Approve"}
              </Button>
              <Button size="sm" variant="outline" disabled={busy} onClick={() => respond(false)}>Decline</Button>
            </>
          )}
          {r.owesKobo > 0 && r.interestStatus === "Approved" && (
            <Button size="sm" variant="outline" onClick={nudge}><MessageCircle className="w-4 h-4" /> Remind on WhatsApp</Button>
          )}
          {(r.interestStatus === "Approved" || r.interestStatus === "Withdrawn" || r.interestStatus === "Removed") && (
            <Button size="sm" variant="ghost" onClick={onRecord}><Plus className="w-4 h-4" /> Record a payment</Button>
          )}
          {r.canRemove && (
            <Button size="sm" variant="ghost" onClick={onRemove} className="text-red-700!"><UserX className="w-4 h-4" /> Remove traveller</Button>
          )}
        </div>
      </div>

      {r.interestStatus !== "Requested" && (
        <dl className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-3 text-sm">
          <Cell label="Paid" value={formatNaira(r.paidKobo)} hint={r.manualKobo !== 0 ? `${formatNaira(r.manualKobo)} outside Hodrac` : undefined} />
          <Cell label="Owes" value={formatNaira(r.owesKobo)} />
          <Cell label="Next due" value={r.nextDueDate ? `${fmtDay(r.nextDueDate)}${r.nextDueAmountKobo ? ` · ${formatNaira(r.nextDueAmountKobo)}` : ""}` : "—"}
            hint={r.datesChosenByTraveller ? "Their own dates" : undefined} />
          <Cell label="Terms" value={r.termsVersionAccepted ? `v${r.termsVersionAccepted}${r.termsVersionAccepted < termsVersion ? " (older)" : ""}` : "Not yet"}
            hint={r.termsAcceptedAt ? new Date(r.termsAcceptedAt).toLocaleDateString() : undefined} />
          <Cell label="Last reminder" value={r.lastReminderAt ? new Date(r.lastReminderAt).toLocaleDateString() : "—"} />
        </dl>
      )}
      {error && <p className="text-sm text-red-700 mt-3">{error}</p>}
    </li>
  );
}

function Cell({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div>
      <dt className="text-xs text-ink-muted">{label}</dt>
      <dd className="text-ink">{value}</dd>
      {hint && <dd className="text-xs text-ink-muted">{hint}</dd>}
    </div>
  );
}

const METHODS: { value: ManualPaymentMethod; label: string }[] = [
  { value: "Transfer", label: "Bank transfer" },
  { value: "Cash", label: "Cash" },
  { value: "Other", label: "Other" },
  { value: "Refund", label: "Refund (money you gave back)" },
];

function RecordPaymentModal({ tripId, row, onClose, onSaved, onChanged }: {
  tripId: string; row: ManifestRow; onClose: () => void; onSaved: () => void; onChanged: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<ManualPaymentMethod>("Transfer");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState<ManualPayment[] | null>(null);

  const loadHistory = useCallback(() => hostApi.manualPayments(tripId, row.interestId).then(setHistory), [tripId, row.interestId]);
  useEffect(() => { loadHistory().catch(() => setHistory([])); }, [loadHistory]);

  const save = async () => {
    const naira = parseNaira(amount);
    if (!(naira > 0)) { setErrors({ amountKobo: "Enter an amount." }); return; }
    const kobo = Math.round(naira * 100);
    setBusy(true);
    setErrors({});
    setFormError("");
    try {
      await hostApi.recordManualPayment(tripId, {
        interestId: row.interestId,
        amountKobo: method === "Refund" ? -kobo : kobo, // refunds are negative
        method,
        note: note.trim() || null,
      });
      trackHost("manual_payment_recorded", { method });
      onSaved();
    } catch (e) {
      setErrors(fieldErrors(e));
      setFormError(formErrorText(e, {}, "Couldn't record this payment."));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (p: ManualPayment) => {
    setFormError("");
    try {
      await hostApi.deleteManualPayment(tripId, p.id);
      await loadHistory();
      onChanged();
    } catch (e) {
      setFormError(formErrorText(e, {}, "Couldn't delete this payment."));
    }
  };

  return (
    <Modal isOpen onClose={onClose} label="Record a payment">
      <div className="p-6 md:p-8 space-y-5">
        <div className="pr-10">
          <h3 className="text-2xl font-normal text-ink">Record a payment</h3>
          <p className="text-sm text-ink-soft mt-1">
            For money {row.travellerName} paid you outside Hodrac, or a refund you gave them. It shows on the manifest tagged "outside Hodrac".
          </p>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <HostField label="Amount (₦)" error={errors.amountKobo}>
            <input inputMode="numeric" className={inputClass} value={amount} onChange={e => setAmount(e.target.value)} placeholder="50,000" />
          </HostField>
          <HostField label="Method" error={errors.method}>
            <select className={inputClass} value={method} onChange={e => setMethod(e.target.value as ManualPaymentMethod)}>
              {METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </HostField>
        </div>
        <HostField label="Note (optional)">
          <input className={inputClass} value={note} onChange={e => setNote(e.target.value)} maxLength={500} placeholder="e.g. GTBank transfer, 12 Dec" />
        </HostField>
        <FormError message={formError} />
        <div className="flex gap-2">
          <Button loading={busy} onClick={save}>{method === "Refund" ? "Record refund" : "Record payment"}</Button>
          <Button variant="ghost" onClick={onClose} disabled={busy}>Cancel</Button>
        </div>

        {history && history.length > 0 && (
          <div className="border-t border-line pt-4">
            <p className="text-sm font-medium text-ink mb-2">Recorded by hand</p>
            <ul className="divide-y divide-line">
              {history.map(p => (
                <li key={p.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span className="min-w-0">
                    <span className="text-ink">{formatNaira(p.amountKobo)}</span>
                    <span className="text-ink-muted"> · {p.method} · {new Date(p.recordedAt).toLocaleDateString()}</span>
                    {p.note && <span className="block text-xs text-ink-muted truncate">{p.note}</span>}
                  </span>
                  <button type="button" onClick={() => remove(p)} aria-label="Delete this payment"
                    className="w-8 h-8 shrink-0 rounded-full border border-line text-ink-muted hover:text-red-700 flex items-center justify-center">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Modal>
  );
}
