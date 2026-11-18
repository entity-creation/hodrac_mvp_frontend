import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { totalPages } from "../api";
import { PAYMENT_STATUSES, hostingApi, type AdminPayment, type AdminPaymentEvent } from "../hostingApi";
import {
  AdminPage, Btn, Check, DataTable, DetailList, Drawer, ErrorBlock, LoadingBlock, Pager, Pill, SearchBox, Select, TextInput, Toolbar, type Column,
} from "../ui";
import { useAction, useDebounced, useQuery, useToast } from "../hooks";
import { fmtDateTime } from "../format";
import { formatNaira } from "../../utils/v2Utils/host";
import type { SeatPaymentStatus } from "../../types/host";

const PAGE_SIZE = 25;

const tone = (s: SeatPaymentStatus) =>
  s === "Success" ? "good" : s === "Initialized" ? "warn" : s === "Failed" || s === "Disputed" ? "bad" : "neutral";

const pretty = (json: string | null) => {
  if (!json) return "—";
  try { return JSON.stringify(JSON.parse(json), null, 2); } catch { return json; }
};

// /admin/payments: seat payments (Paystack) and the webhook audit log.
export default function HostPaymentsPage() {
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") === "events" ? "events" : "payments";
  return (
    <AdminPage title="Payments" description="Hosted-trip seat payments through Paystack, and the webhook events behind them.">
      <div className="flex gap-1 border-b border-line mb-4" role="tablist">
        {([["payments", "Payments"], ["events", "Webhook events"]] as const).map(([key, label]) => (
          <button key={key} role="tab" aria-selected={tab === key} onClick={() => setParams(key === "payments" ? {} : { tab: key }, { replace: true })}
            className={`px-3 py-2 text-sm border-b-2 -mb-px ${tab === key ? "border-ink text-ink" : "border-transparent text-ink-muted hover:text-ink"}`}>
            {label}
          </button>
        ))}
      </div>
      {tab === "payments" ? <PaymentsTab /> : <EventsTab />}
    </AdminPage>
  );
}

function PaymentsTab() {
  const [reference, setReference] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string | null>(null);
  const ref = useDebounced(reference);
  const payer = useDebounced(email);

  const { data, loading, error, reload } = useQuery(
    () => hostingApi.payments.list({
      page, pageSize: PAGE_SIZE, reference: ref.trim() || undefined, payerEmail: payer.trim() || undefined,
      status: status === "all" ? undefined : status, from: from || undefined, to: to || undefined,
    }),
    [page, ref, payer, status, from, to],
  );

  const columns: Column<AdminPayment>[] = [
    { key: "ref", header: "Reference", render: p => <span className="font-mono text-xs text-ink">{p.reference}</span> },
    { key: "status", header: "Status", render: p => <Pill tone={tone(p.status)}>{p.status}</Pill> },
    {
      key: "trip", header: "Trip", render: p => (
        <div className="min-w-40">
          <p className="text-ink truncate">{p.trip.title}</p>
          <p className="text-xs text-ink-muted truncate">{p.host?.displayName ?? "—"}</p>
        </div>
      ),
    },
    { key: "payer", header: "Payer", render: p => <span className="text-ink-soft text-xs">{p.payer.name ?? "—"}<br />{p.payer.email}</span> },
    { key: "kind", header: "Kind", render: p => <span className="text-ink-soft">{p.kind === "Instalment" ? `Instalment ${p.instalmentSequence}` : p.kind}</span> },
    { key: "total", header: "Charged", className: "text-right", render: p => <span className="tabular-nums">{formatNaira(p.totalChargedKobo)}</span> },
    { key: "fee", header: "Hodrac fee", className: "text-right", render: p => <span className="tabular-nums text-ink-soft">{formatNaira(p.hodracFeeKobo)}</span> },
    { key: "when", header: "Created", className: "whitespace-nowrap", render: p => <span className="text-ink-soft">{fmtDateTime(p.createdAt)}</span> },
  ];

  const resetPage = <T,>(set: (v: T) => void) => (v: T) => { set(v); setPage(1); };

  return (
    <>
      <Toolbar>
        <SearchBox value={reference} onChange={resetPage(setReference)} placeholder="Reference (HDR-…)" />
        <SearchBox value={email} onChange={resetPage(setEmail)} placeholder="Payer email" />
        <Select label="Status" value={status} onChange={resetPage(setStatus)}
          options={[{ value: "all", label: "All statuses" }, ...PAYMENT_STATUSES.map(s => ({ value: s, label: s }))]} />
        <div className="flex items-center gap-1.5 text-xs text-ink-muted">
          <TextInput type="date" aria-label="From" value={from} max={to || undefined} onChange={e => { setFrom(e.target.value); setPage(1); }} className="w-auto! rounded-full" />
          <span>to</span>
          <TextInput type="date" aria-label="To" value={to} min={from || undefined} onChange={e => { setTo(e.target.value); setPage(1); }} className="w-auto! rounded-full" />
        </div>
      </Toolbar>
      {error ? <ErrorBlock message={error} onRetry={reload} /> : (
        <>
          <DataTable columns={columns} rows={data?.items} rowKey={p => p.id} loading={loading}
            onRowClick={p => setSelected(p.reference)} empty="No payments match." />
          {data && <Pager page={page} totalPages={totalPages(data)} totalCount={data.totalCount} onChange={setPage} />}
        </>
      )}
      <PaymentDrawer reference={selected} onClose={() => setSelected(null)} />
    </>
  );
}

function PaymentDrawer({ reference, onClose }: { reference: string | null; onClose: () => void }) {
  const { data, loading, error, reload } = useQuery(
    () => (reference ? hostingApi.payments.get(reference) : Promise.resolve(null)), [reference]);
  const p = data?.payment;
  return (
    <Drawer open={!!reference} onClose={onClose} title={reference ?? "Payment"} wide>
      {loading && !data ? <LoadingBlock /> : error ? <ErrorBlock message={error} onRetry={reload} /> : data && p && (
        <div className="space-y-6">
          <DetailList rows={[
            ["Status", <Pill tone={tone(p.status)}>{p.status}</Pill>],
            ["Trip", p.trip.title],
            ["Host", p.host?.displayName ?? "—"],
            ["Payer", `${p.payer.name ?? "—"} · ${p.payer.email ?? "—"}`],
            ["Kind", p.kind === "Instalment" ? `Instalment ${p.instalmentSequence}` : p.kind],
            ["Seat amount", formatNaira(p.seatAmountKobo)],
            ["Traveller fee", formatNaira(p.travellerFeeKobo)],
            ["Hodrac fee", formatNaira(p.hodracFeeKobo)],
            ["Total charged", formatNaira(p.totalChargedKobo)],
            ["Paystack fee", p.paystackFeeKobo != null ? formatNaira(p.paystackFeeKobo) : "—"],
            ["Refunded", formatNaira(p.refundedKobo)],
            ["Channel", p.channel ?? "—"],
            ["Created", fmtDateTime(p.createdAt)],
            ["Paid", fmtDateTime(p.paidAt)],
            ["Interest", <span className="font-mono text-xs">{data.tripInterestId}</span>],
          ]} />
          <section>
            <h3 className="text-sm font-medium text-ink mb-2">Webhook events</h3>
            {data.webhookEvents.length === 0 ? <p className="text-sm text-ink-muted">None.</p> : (
              <ul className="text-sm space-y-1">
                {data.webhookEvents.map(e => (
                  <li key={e.id} className="flex flex-wrap gap-2 items-center">
                    <span className="font-mono text-xs">{e.eventType}</span>
                    <span className="text-ink-muted">{fmtDateTime(e.receivedAt)}</span>
                    {e.error ? <Pill tone="bad">Error</Pill> : e.processedAt ? <Pill tone="good">Processed</Pill> : <Pill tone="warn">Unprocessed</Pill>}
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section>
            <h3 className="text-sm font-medium text-ink mb-2">Paystack verify response</h3>
            <pre className="text-xs bg-cream rounded-xl p-3 overflow-auto max-h-80">{pretty(data.verifyResponseJson)}</pre>
          </section>
        </div>
      )}
    </Drawer>
  );
}

function EventsTab() {
  const [unprocessed, setUnprocessed] = useState(true);
  const [reference, setReference] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string | null>(null);
  const ref = useDebounced(reference);

  const { data, loading, error, reload } = useQuery(
    () => hostingApi.events.list({ page, pageSize: PAGE_SIZE, unprocessed, reference: ref.trim() || undefined }),
    [page, unprocessed, ref],
  );

  const columns: Column<AdminPaymentEvent>[] = [
    { key: "type", header: "Event", render: e => <span className="font-mono text-xs text-ink">{e.eventType}</span> },
    { key: "ref", header: "Reference", render: e => <span className="font-mono text-xs text-ink-soft">{e.reference ?? "—"}</span> },
    { key: "state", header: "State", render: e => e.error ? <Pill tone="bad">Error</Pill> : e.processedAt ? <Pill tone="good">Processed</Pill> : <Pill tone="warn">Unprocessed</Pill> },
    { key: "error", header: "Error", render: e => <span className="text-xs text-red-700 line-clamp-2 max-w-72">{e.error ?? ""}</span> },
    { key: "when", header: "Received", className: "whitespace-nowrap", render: e => <span className="text-ink-soft">{fmtDateTime(e.receivedAt)}</span> },
  ];

  return (
    <>
      <Toolbar>
        <SearchBox value={reference} onChange={v => { setReference(v); setPage(1); }} placeholder="Reference" />
        <Check label="Unprocessed or failed only" checked={unprocessed} onChange={v => { setUnprocessed(v); setPage(1); }} />
      </Toolbar>
      {error ? <ErrorBlock message={error} onRetry={reload} /> : (
        <>
          <DataTable columns={columns} rows={data?.items} rowKey={e => e.id} loading={loading}
            onRowClick={e => setSelected(e.id)} empty={unprocessed ? "Nothing needs attention." : "No webhook events yet."} />
          {data && <Pager page={page} totalPages={totalPages(data)} totalCount={data.totalCount} onChange={setPage} />}
        </>
      )}
      <EventDrawer id={selected} onClose={() => setSelected(null)} onChanged={reload} />
    </>
  );
}

function EventDrawer({ id, onClose, onChanged }: { id: string | null; onClose: () => void; onChanged: () => void }) {
  const { data, loading, error, reload } = useQuery(() => (id ? hostingApi.events.get(id) : Promise.resolve(null)), [id]);
  const act = useAction();
  const notify = useToast();
  const reprocess = async () => {
    if (!id) return;
    const r = await act.run(() => hostingApi.events.reprocess(id));
    if (!r.ok) return;
    const { outcome, event } = r.result;
    if (outcome === "Failed") notify(`Failed again: ${event.error ?? "see the event"}`, "error");
    else notify(outcome === "Processed" ? "Event processed." : "Already processed.");
    reload();
    onChanged();
  };
  const e = data?.event;
  return (
    <Drawer open={!!id} onClose={onClose} title={e?.eventType ?? "Webhook event"} wide
      footer={e && <Btn variant="primary" loading={act.busy} onClick={reprocess}>Reprocess</Btn>}>
      {loading && !data ? <LoadingBlock /> : error ? <ErrorBlock message={error} onRetry={reload} /> : data && e && (
        <div className="space-y-6">
          <DetailList rows={[
            ["Reference", e.reference ?? "—"],
            ["Received", fmtDateTime(e.receivedAt)],
            ["Processed", fmtDateTime(e.processedAt)],
            ["Error", e.error ?? "—"],
            ["Payload hash", <span className="font-mono text-xs break-all">{data.payloadSha256}</span>],
          ]} />
          <pre className="text-xs bg-cream rounded-xl p-3 overflow-auto max-h-[28rem]">{pretty(data.payload)}</pre>
        </div>
      )}
    </Drawer>
  );
}
