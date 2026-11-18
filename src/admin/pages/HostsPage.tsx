import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Download, ExternalLink } from "lucide-react";
import { totalPages } from "../api";
import { HOST_STATUSES, hostingApi, type AdminDeleteHostConflict, type AdminHostSummary } from "../hostingApi";
import {
  AdminPage, Btn, ConfirmBtn, DataTable, DetailList, Drawer, ErrorBlock, Field, LoadingBlock, Pager, Pill, SearchBox, TextArea, TextInput, Toolbar, type Column,
} from "../ui";
import { useAction, useDebounced, useQuery, useToast } from "../hooks";
import { isApiError } from "../../dataStore/v2Api/client";
import { friendlyError } from "../../utils/v2Utils/apiErrors";
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
    () => hostingApi.hosts.list({
      page, pageSize: PAGE_SIZE,
      status: status === "all" || status === "closed" ? undefined : status,
      closed: status === "closed" ? true : undefined,
      search: debounced || undefined,
    }),
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
          {h.closedAt && <Pill tone="bad">Closed</Pill>}
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
          {[...HOST_STATUSES, "closed", "all"].map(s => (
            <Btn key={s} size="sm" variant={status === s ? "primary" : "outline"} onClick={() => setStatus(s)}>{s === "all" ? "All" : s === "closed" ? "Closed" : s}</Btn>
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

      <HostDrawer key={id ?? "none"} id={id ?? null} onClose={() => navigate(`/admin/hosts${params.toString() ? `?${params}` : ""}`)} onChanged={reload} />
    </AdminPage>
  );
}

function HostDrawer({ id, onClose, onChanged }: { id: string | null; onClose: () => void; onChanged: () => void }) {
  const detail = useQuery(() => (id ? hostingApi.hosts.get(id) : Promise.resolve(null)), [id]);
  const docs = useQuery(() => (id ? hostingApi.hosts.documents(id) : Promise.resolve([])), [id]);
  const act = useAction();
  const notify = useToast();
  const [reason, setReason] = useState("");
  const [closeReason, setCloseReason] = useState("");
  // Outcome of close/reopen, kept on screen (toasts disappear).
  const [notice, setNotice] = useState<{ tone: "good" | "warn"; lines: string[] } | null>(null);
  const [deleteBlocked, setDeleteBlocked] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [plan, setPlan] = useState({ reference: "", amountNaira: "900000", periodStart: "", periodEnd: "" });

  const d = detail.data;
  const s = d?.summary;

  const run = async (fn: () => Promise<unknown>, success: string, errors: Partial<Record<number, string>> = {}) => {
    const r = await act.run(fn, { success, errors });
    if (r.ok) { detail.reload(); onChanged(); setReason(""); }
  };

  const closeAccount = async (hostId: string) => {
    const r = await act.run(() => hostingApi.hosts.close(hostId, closeReason.trim() || undefined));
    if (!r.ok) return;
    const { subaccountDeactivated: sub, hiddenTripIds } = r.result;
    const lines = ["Host account closed."];
    if (sub === true) lines.push("Paystack payouts turned off.");
    if (sub === false) lines.push("Paystack couldn't turn off their payout subaccount. Press Close account again to retry.");
    if (sub === null) lines.push("They had no payout account.");
    const n = hiddenTripIds.length;
    if (n) lines.push(`${n} trip${n === 1 ? "" : "s"} with no payments ${n === 1 ? "was" : "were"} hidden.`);
    setNotice({ tone: sub === false ? "warn" : "good", lines });
    notify(sub === false ? "Closed, but Paystack payouts are still on." : "Host account closed.", sub === false ? "error" : undefined);
    setCloseReason("");
    setDeleteBlocked("");
    detail.reload();
    onChanged();
  };

  const reopenAccount = async (hostId: string) => {
    const r = await act.run(() => hostingApi.hosts.reopen(hostId));
    if (!r.ok) return;
    const { subaccountReactivated: sub, unhiddenTripIds } = r.result;
    const n = unhiddenTripIds.length;
    const lines = ["Host account reopened."];
    if (sub === true) lines.push("Paystack payouts turned back on.");
    if (sub === false) lines.push("Paystack payouts couldn't be turned back on. Admins have been emailed about it.");
    if (n) lines.push(`${n} hidden trip${n === 1 ? " is" : "s are"} visible again.`);
    lines.push("Verify them again before travellers can pay. Their documents are still on file. Founding status isn't restored.");
    setNotice({ tone: sub === false ? "warn" : "good", lines });
    notify("Host account reopened.");
    detail.reload();
    onChanged();
  };

  const deleteHost = async (hostId: string) => {
    setDeleting(true);
    setDeleteBlocked("");
    try {
      await hostingApi.hosts.remove(hostId);
      notify("Host deleted.");
      onChanged();
      onClose();
    } catch (e) {
      if (isApiError(e, 409)) {
        const body = e.body as AdminDeleteHostConflict | undefined;
        setDeleteBlocked(body?.detail || e.message || "This host has trips or payments, so it can't be deleted. Close the account instead.");
      } else {
        notify(friendlyError(e, {}, "Couldn't delete this host."), "error");
      }
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Drawer open={!!id} onClose={onClose} title={s ? s.displayName : "Host"} wide>
      {detail.loading && !d ? <LoadingBlock /> : detail.error ? <ErrorBlock message={detail.error} onRetry={detail.reload} /> : d && s && (
        <div className="space-y-8">
          <div className="flex flex-wrap gap-1">
            {s.closedAt && <Pill tone="bad">Closed</Pill>}
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
            ...(s.closedAt ? [["Closed", `${fmtDateTime(s.closedAt)}${d.closedByUserId ? ` by admin ${d.closedByUserId}` : ""}`] as [string, string]] : []),
            ...(s.closedAt && s.closedReason ? [["Closing reason", s.closedReason] as [string, string]] : []),
          ]} />

          {notice && (
            <div role="status" className={`rounded-xl border px-3 py-2 text-sm space-y-1 ${notice.tone === "warn" ? "bg-sun-100 border-sun-300" : "bg-mint-100 border-mint-300"}`}>
              {notice.lines.map(l => <p key={l} className="text-ink">{l}</p>)}
            </div>
          )}

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

          {!s.closedAt && <section className="space-y-3">
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
          </section>}

          {!s.closedAt && <section className="space-y-3">
            <h3 className="text-sm font-medium text-ink">Founding host</h3>
            {s.isFoundingHost ? (
              <>
                <p className="text-sm text-ink-soft">Founding host. Free departure {d.foundingFreeDepartureTripId ? "used" : "not used yet"}.</p>
                <ConfirmBtn label="Remove founding" confirmLabel="Yes, remove founding" loading={act.busy}
                  message="They lose their founding place and any unused free departure. A free departure already used stays fee-free."
                  onConfirm={() => { void run(() => hostingApi.hosts.removeFounding(s.id), "Founding status removed."); }} />
              </>
            ) : (
              <ConfirmBtn label="Mark as founding host" confirmLabel="Mark founding" variant="outline" loading={act.busy}
                onConfirm={() => { void run(() => hostingApi.hosts.markFounding(s.id), "Marked as a founding host."); }} />
            )}
          </section>}

          {!s.closedAt && <section className="space-y-3">
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
          </section>}

          <section className="space-y-3 border-t border-line pt-6">
            <h3 className="text-sm font-medium text-ink">Account</h3>
            {s.closedAt ? (
              <>
                <p className="text-sm text-ink-soft">
                  This account is closed. Reopening turns their payouts back on and shows their hidden trips again.
                  They'll need verifying again before travellers can pay.
                </p>
                <ConfirmBtn label="Reopen account" confirmLabel="Yes, reopen" variant="outline" loading={act.busy}
                  onConfirm={() => { void reopenAccount(s.id); }} />
              </>
            ) : (
              <>
                <Field label="Reason for closing (optional)">
                  <TextInput value={closeReason} onChange={e => setCloseReason(e.target.value)} maxLength={450}
                    placeholder="e.g. Repeated complaints from travellers" />
                </Field>
                <ConfirmBtn label="Close account" confirmLabel="Yes, close account" loading={act.busy}
                  message="This removes their verified badge and founding status, hides their trips that have no payments, turns off their Paystack payouts and stops them changing their host setup. Travellers who've paid keep access."
                  onConfirm={() => { void closeAccount(s.id); }} />
              </>
            )}
            <div>
              <ConfirmBtn label="Delete host" confirmLabel="Yes, delete" loading={deleting}
                message="Deletes their host profile and ID documents. Their user account stays."
                onConfirm={() => { void deleteHost(s.id); }} />
            </div>
            {deleteBlocked && (
              <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-ink space-y-1">
                <p>{deleteBlocked}</p>
                {!s.closedAt && <p className="text-ink-soft">Use Close account above instead.</p>}
              </div>
            )}
          </section>
        </div>
      )}
    </Drawer>
  );
}
