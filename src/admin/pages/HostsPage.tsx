import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Download, ExternalLink } from "lucide-react";
import { totalPages } from "../api";
import { HOST_STATUSES, hostingApi, type AdminHostSummary } from "../hostingApi";
import {
  AdminPage, Btn, ConfirmBtn, DataTable, DetailList, Drawer, ErrorBlock, Field, LoadingBlock, Pager, Pill, SearchBox, TextArea, TextInput, Toolbar, type Column,
} from "../ui";
import { useAction, useDebounced, useQuery } from "../hooks";
import { fmtDate, fmtDateTime } from "../format";
import { formatNaira } from "../../utils/v2Utils/host";
import type { HostVerificationStatus } from "../../types/host";

const PAGE_SIZE = 20;

const statusTone = (s: HostVerificationStatus) =>
  s === "Verified" ? "good" : s === "Pending" ? "warn" : s === "Rejected" ? "bad" : "neutral";

// /admin/hosts (verification queue) and /admin/hosts/:id (a host's details,
// the link in "new verification" emails).
export default function HostsPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const status = params.get("status") ?? "Pending";
  const page = Math.max(1, Number(params.get("page")) || 1);
  const [search, setSearch] = useState("");
  const debounced = useDebounced(search);

  const { data, loading, error, reload } = useQuery(
    () => hostingApi.hosts.list({ page, pageSize: PAGE_SIZE, status: status === "all" ? undefined : status, search: debounced || undefined }),
    [page, status, debounced],
  );

  const setStatus = (s: string) => setParams(s === "Pending" ? {} : { status: s }, { replace: true });

  const columns: Column<AdminHostSummary>[] = [
    {
      key: "host", header: "Host", render: h => (
        <div className="min-w-44">
          <p className="text-ink">{h.displayName}</p>
          <p className="text-xs text-ink-muted">{h.userEmail ?? h.slug}</p>
        </div>
      ),
    },
    {
      key: "status", header: "Status", render: h => (
        <div className="flex flex-wrap gap-1">
          <Pill tone={statusTone(h.verificationStatus)}>{h.verificationStatus}</Pill>
          {h.isFoundingHost && <Pill tone="info">Founding</Pill>}
          {h.plan === "Operator" && <Pill tone="info">Operator</Pill>}
        </div>
      ),
    },
    {
      key: "evidence", header: "Evidence", render: h => (
        <span className="text-ink-soft text-xs">
          {h.cacNumber ? "CAC · " : ""}{h.documentCount} doc{h.documentCount === 1 ? "" : "s"} · {h.pastTripProofUrls.length} link{h.pastTripProofUrls.length === 1 ? "" : "s"}
        </span>
      ),
    },
    { key: "payout", header: "Payout", render: h => <span className="text-ink-soft text-xs">{h.payoutAccountSet ? `${h.payoutBankName ?? "Bank"} ••${h.payoutAccountLast4}` : "Not set"}</span> },
    { key: "updated", header: "Updated", className: "whitespace-nowrap", render: h => <span className="text-ink-soft">{fmtDate(h.updatedAt)}</span> },
  ];

  return (
    <AdminPage title="Hosts" description="Hodrac Host verification queue. Pending hosts are shown oldest first.">
      <Toolbar>
        <SearchBox value={search} onChange={setSearch} placeholder="Search name, link or email" />
        <div className="inline-flex flex-wrap gap-1">
          {[...HOST_STATUSES, "all"].map(s => (
            <Btn key={s} size="sm" variant={status === s ? "primary" : "outline"} onClick={() => setStatus(s)}>{s === "all" ? "All" : s}</Btn>
          ))}
        </div>
      </Toolbar>

      {error ? <ErrorBlock message={error} onRetry={reload} /> : (
        <>
          <DataTable columns={columns} rows={data?.items} rowKey={h => h.id} loading={loading}
            onRowClick={h => navigate(`/admin/hosts/${h.id}${params.toString() ? `?${params}` : ""}`)}
            empty={status === "Pending" ? "No hosts waiting for review." : "No hosts here."} />
          {data && <Pager page={page} totalPages={totalPages(data)} totalCount={data.totalCount}
            onChange={p => setParams(prev => { const n = new URLSearchParams(prev); if (p === 1) n.delete("page"); else n.set("page", String(p)); return n; }, { replace: true })} />}
        </>
      )}

      <HostDrawer id={id ?? null} onClose={() => navigate(`/admin/hosts${params.toString() ? `?${params}` : ""}`)} onChanged={reload} />
    </AdminPage>
  );
}

function HostDrawer({ id, onClose, onChanged }: { id: string | null; onClose: () => void; onChanged: () => void }) {
  const detail = useQuery(() => (id ? hostingApi.hosts.get(id) : Promise.resolve(null)), [id]);
  const docs = useQuery(() => (id ? hostingApi.hosts.documents(id) : Promise.resolve([])), [id]);
  const act = useAction();
  const [reason, setReason] = useState("");
  const [plan, setPlan] = useState({ reference: "", amountNaira: "900000", periodStart: "", periodEnd: "" });

  const d = detail.data;
  const s = d?.summary;

  const run = async (fn: () => Promise<unknown>, success: string, errors: Partial<Record<number, string>> = {}) => {
    const r = await act.run(fn, { success, errors });
    if (r.ok) { detail.reload(); onChanged(); setReason(""); }
  };

  return (
    <Drawer open={!!id} onClose={onClose} title={s ? s.displayName : "Host"} wide>
      {detail.loading && !d ? <LoadingBlock /> : detail.error ? <ErrorBlock message={detail.error} onRetry={detail.reload} /> : d && s && (
        <div className="space-y-8">
          <div className="flex flex-wrap gap-1">
            <Pill tone={statusTone(s.verificationStatus)}>{s.verificationStatus}</Pill>
            {s.isFoundingHost && <Pill tone="info">Founding host</Pill>}
            {s.plan === "Operator" && <Pill tone="info">Operator plan</Pill>}
          </div>

          <DetailList rows={[
            ["Account", <>{d.userDisplayName ?? "—"} · {s.userEmail ?? "—"}</>],
            ["Link name", s.slug],
            ["Instagram", d.instagramHandle ? <a href={`https://instagram.com/${d.instagramHandle}`} target="_blank" rel="noopener noreferrer" className="underline">@{d.instagramHandle}</a> : "—"],
            ["WhatsApp", d.whatsAppNumber ?? "—"],
            ["Bio", d.bio ?? "—"],
            ["Payout", s.payoutAccountSet ? `${d.payoutAccountName ?? ""} · ${s.payoutBankName ?? ""} ••${s.payoutAccountLast4}` : "Not set"],
            ["Paystack subaccount", d.paystackSubaccountCode ?? "—"],
            ["Joined", fmtDateTime(s.createdAt)],
            ...(d.verifiedAt ? [["Last decision", fmtDateTime(d.verifiedAt)] as [string, string]] : []),
            ...(d.rejectionReason ? [["Reason", d.rejectionReason] as [string, string]] : []),
          ]} />

          <section className="space-y-3">
            <h3 className="text-sm font-medium text-ink">Verification evidence</h3>
            <p className="text-sm text-ink-soft">CAC number: {s.cacNumber ?? "not given"}</p>
            {docs.loading ? <LoadingBlock /> : (docs.data ?? []).length === 0 ? (
              <p className="text-sm text-ink-muted">No documents uploaded.</p>
            ) : (
              <ul className="space-y-2">
                {(docs.data ?? []).map(doc => (
                  <li key={doc.id} className="flex items-center justify-between gap-3 rounded-xl border border-line px-3 py-2 text-sm">
                    <span className="min-w-0 truncate">{doc.kind === "IdDocument" ? "ID document" : "CAC certificate"} · {doc.fileName} · {Math.round(doc.sizeBytes / 1024)} KB · {fmtDate(doc.uploadedAt)}</span>
                    <Btn size="sm" loading={act.busy}
                      onClick={() => act.run(() => hostingApi.hosts.downloadDocument(doc), { errors: { 403: "This link has expired. Close and reopen the host to get a fresh one." } })}>
                      <Download className="w-3.5 h-3.5" /> Download
                    </Btn>
                  </li>
                ))}
              </ul>
            )}
            {s.pastTripProofUrls.length > 0 && (
              <ul className="space-y-1">
                {s.pastTripProofUrls.map(u => (
                  <li key={u}><a href={u} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1 text-sm text-ink underline break-all">{u} <ExternalLink className="w-3 h-3 shrink-0" /></a></li>
                ))}
              </ul>
            )}
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-medium text-ink">Decision</h3>
            {s.verificationStatus === "Verified" ? (
              <>
                <Field label="Reason for removing the badge (optional)">
                  <TextInput value={reason} onChange={e => setReason(e.target.value)} maxLength={450} />
                </Field>
                <ConfirmBtn label="Remove badge" confirmLabel="Yes, remove badge" loading={act.busy}
                  onConfirm={() => { void run(() => hostingApi.hosts.revoke(s.id, reason.trim()), "Verification removed."); }} />
              </>
            ) : (
              <>
                <Btn variant="primary" loading={act.busy} onClick={() => run(() => hostingApi.hosts.verify(s.id), "Host verified.")}>Verify host</Btn>
                {s.verificationStatus !== "Rejected" && (
                  <div className="space-y-2">
                    <Field label="Reason for rejecting (shown to the host)">
                      <TextArea value={reason} onChange={e => setReason(e.target.value)} maxLength={500} placeholder="e.g. The ID document is unreadable. Please upload a clearer photo." />
                    </Field>
                    <Btn disabled={!reason.trim()} loading={act.busy} onClick={() => run(() => hostingApi.hosts.reject(s.id, reason.trim()), "Host rejected.")}>Reject</Btn>
                  </div>
                )}
              </>
            )}
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-medium text-ink">Founding host</h3>
            {s.isFoundingHost ? (
              <p className="text-sm text-ink-soft">Founding host. Free departure {d.foundingFreeDepartureTripId ? "used" : "not used yet"}.</p>
            ) : (
              <ConfirmBtn label="Mark as founding host" confirmLabel="Mark founding" variant="outline" loading={act.busy}
                onConfirm={() => { void run(() => hostingApi.hosts.markFounding(s.id), "Marked as a founding host."); }} />
            )}
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-medium text-ink">Operator plan</h3>
            <p className="text-sm text-ink-soft">
              {s.plan === "Operator" && s.operatorPlanExpiresAt ? `Active until ${fmtDate(s.operatorPlanExpiresAt)}.` : "Not on the Operator plan."}
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Payment reference"><TextInput value={plan.reference} onChange={e => setPlan(p => ({ ...p, reference: e.target.value }))} maxLength={100} /></Field>
              <Field label="Amount (₦)"><TextInput inputMode="numeric" value={plan.amountNaira} onChange={e => setPlan(p => ({ ...p, amountNaira: e.target.value }))} /></Field>
              <Field label="Period start"><TextInput type="date" value={plan.periodStart} onChange={e => setPlan(p => ({ ...p, periodStart: e.target.value }))} /></Field>
              <Field label="Period end"><TextInput type="date" value={plan.periodEnd} min={plan.periodStart || undefined} onChange={e => setPlan(p => ({ ...p, periodEnd: e.target.value }))} /></Field>
            </div>
            <Btn loading={act.busy}
              disabled={!plan.reference.trim() || !plan.periodStart || !plan.periodEnd || !(Number(plan.amountNaira.replace(/[^\d.]/g, "")) > 0)}
              onClick={() => run(() => hostingApi.hosts.recordOperatorPlan(s.id, {
                reference: plan.reference.trim(),
                amountKobo: Math.round(Number(plan.amountNaira.replace(/[^\d.]/g, "")) * 100),
                periodStart: plan.periodStart, periodEnd: plan.periodEnd,
              }), "Operator plan payment recorded.")}>
              Record plan payment
            </Btn>
            {d.operatorPlanPayments.length > 0 && (
              <ul className="text-sm text-ink-soft space-y-1">
                {d.operatorPlanPayments.map(p => (
                  <li key={p.id}>{formatNaira(p.amountKobo)} · {fmtDate(p.periodStart)} – {fmtDate(p.periodEnd)} · {p.reference}</li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </Drawer>
  );
}
