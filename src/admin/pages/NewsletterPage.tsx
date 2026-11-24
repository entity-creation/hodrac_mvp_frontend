import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Download, Sparkles } from "lucide-react";
import { adminApi, totalPages, type AdminSubscriber } from "../api";
import {
  ISSUE_STATUSES, issueStatusTone, newsletterAdminApi, type NewsletterIssueSummary,
} from "../newsletterApi";
import {
  AdminPage, Btn, ConfirmBtn, DataTable, ErrorBlock, Pager, Pill, SearchBox, StatCard, Toolbar, type Column,
} from "../ui";
import { useAction, useDebounced, useQuery } from "../hooks";
import { fmtDate, fmtNumber } from "../format";
import { fmtIssueDate, fmtWat } from "./newsletterFormat";

const SUB_PAGE_SIZE = 50;
const ISSUE_PAGE_SIZE = 20;

// /admin/newsletter: weekly issues (default tab) and the sign-up list.
export default function NewsletterPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") === "subscribers" ? "subscribers" : "issues";
  const generator = useAction();

  const generate = async () => {
    const r = await generator.run(() => newsletterAdminApi.generate(), {
      success: "Draft ready.",
      errors: { 409: "Next week's issue is already approved or sent, so it can't be regenerated. Unapprove it first." },
      fallback: "Couldn't generate the draft.",
    });
    if (r.ok) navigate(`/admin/newsletter/${r.result.id}`);
  };

  const setTab = (t: "issues" | "subscribers") => setParams(t === "issues" ? {} : { tab: t }, { replace: true });

  return (
    <AdminPage
      title="Newsletter"
      description="The weekly email. A draft is generated every Wednesday; nothing is sent until you approve it."
      actions={
        <Btn variant="primary" onClick={generate} loading={generator.busy}>
          {!generator.busy && <Sparkles className="w-4 h-4" />} Generate next issue
        </Btn>
      }
    >
      <Audience />

      <div role="tablist" className="inline-flex gap-1 rounded-full border border-line bg-white p-1 mb-4">
        {(["issues", "subscribers"] as const).map(t => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
            className={`rounded-full px-4 py-1.5 text-sm transition-colors ${tab === t ? "bg-ink text-white" : "text-ink-soft hover:text-ink"}`}>
            {t === "issues" ? "Issues" : "Sign-up list"}
          </button>
        ))}
      </div>

      {tab === "issues" ? <IssuesTab /> : <SubscribersTab />}
    </AdminPage>
  );
}

function Audience() {
  const { data, error, reload } = useQuery(() => newsletterAdminApi.audience(), []);
  if (error) return <div className="mb-6"><ErrorBlock message={error} onRetry={reload} /></div>;
  const n = (v: number | undefined) => (data ? fmtNumber(v) : "…");
  return (
    <div className="grid gap-4 sm:grid-cols-3 mb-6">
      <StatCard label="Next issue goes to" value={n(data?.totalUniqueRecipients)}
        hint="Unique emails: sign-ups plus confirmed accounts that haven't opted out." />
      <StatCard label="Sign-up list" value={n(data?.activeSubscribers)}
        hint={data ? `${fmtNumber(data.unsubscribedSubscribers)} unsubscribed` : undefined} />
      <StatCard label="Accounts" value={n(data?.optedInUsers)}
        hint={data ? `opted in · ${fmtNumber(data.optedOutUsers)} opted out` : undefined} />
    </div>
  );
}

// ─── Issues ───────────────────────────────────────────────────────────────────

function IssuesTab() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const status = params.get("status") ?? "";
  const page = Math.max(1, Number(params.get("page")) || 1);

  const { data, loading, error, reload } = useQuery(
    () => newsletterAdminApi.list({ status: status || undefined, page, pageSize: ISSUE_PAGE_SIZE }),
    [status, page],
  );

  const columns: Column<NewsletterIssueSummary>[] = [
    { key: "date", header: "Issue", className: "whitespace-nowrap", render: i => <span className="text-ink">{fmtIssueDate(i.issueDate)}</span> },
    {
      key: "subject", header: "Subject", render: i => (
        <div className="min-w-56">
          <p className="text-ink">{i.subject || "No subject"}</p>
          {i.previewText && <p className="text-xs text-ink-muted line-clamp-1">{i.previewText}</p>}
        </div>
      ),
    },
    { key: "status", header: "Status", render: i => <Pill tone={issueStatusTone(i.status)}>{i.status}</Pill> },
    {
      key: "when", header: "Sends", className: "whitespace-nowrap", render: i => (
        <span className="text-ink-soft">
          {i.status === "Sent" ? `Sent ${fmtDate(i.sentAt)}` : i.status === "Cancelled" ? "—" : fmtWat(i.scheduledFor)}
        </span>
      ),
    },
    {
      key: "delivered", header: "Delivered", className: "whitespace-nowrap text-right", render: i => (
        i.recipientCount ? (
          <span className="text-ink-soft">
            {fmtNumber(i.sentCount)} / {fmtNumber(i.recipientCount)}
            {i.failedCount > 0 && <span className="text-red-700"> · {fmtNumber(i.failedCount)} failed</span>}
          </span>
        ) : <span className="text-ink-muted">—</span>
      ),
    },
  ];

  const setStatus = (s: string) => setParams(s ? { status: s } : {}, { replace: true });

  return (
    <>
      <Toolbar>
        <div className="inline-flex flex-wrap gap-1">
          {["", ...ISSUE_STATUSES].map(s => (
            <Btn key={s || "all"} size="sm" variant={status === s ? "primary" : "outline"} onClick={() => setStatus(s)}>{s || "All"}</Btn>
          ))}
        </div>
      </Toolbar>
      {error ? <ErrorBlock message={error} onRetry={reload} /> : (
        <>
          <DataTable columns={columns} rows={data?.items} rowKey={i => i.id} loading={loading}
            onRowClick={i => navigate(`/admin/newsletter/${i.id}`)}
            empty={status ? `No ${status.toLowerCase()} issues.` : "No issues yet. Generate one, or wait for Wednesday's draft."} />
          {data && <Pager page={page} totalPages={totalPages(data)} totalCount={data.totalCount}
            onChange={p => setParams(prev => { const n = new URLSearchParams(prev); if (p === 1) n.delete("page"); else n.set("page", String(p)); return n; }, { replace: true })} />}
        </>
      )}
    </>
  );
}

// ─── Sign-up list ─────────────────────────────────────────────────────────────

function RemoveButton({ sub, onRemoved }: { sub: AdminSubscriber; onRemoved: () => void }) {
  const { run, busy } = useAction();
  return (
    <ConfirmBtn size="sm" label="Remove" confirmLabel="Remove" loading={busy}
      onConfirm={async () => {
        const r = await run(() => adminApi.newsletter.remove(sub.emailId), {
          success: `${sub.userEmail} removed from the newsletter.`,
          errors: { 404: "That subscriber was already removed." },
          fallback: "Couldn't remove this subscriber.",
        });
        if (r.ok) onRemoved();
      }} />
  );
}

function SubscribersTab() {
  const [search, setSearch] = useState("");
  const debounced = useDebounced(search.trim());
  const [page, setPage] = useState(1);
  const exporter = useAction();

  const { data, loading, error, reload } = useQuery(
    () => adminApi.newsletter.list({ page, pageSize: SUB_PAGE_SIZE, search: debounced || undefined }),
    [page, debounced]
  );

  const exportCsv = () => exporter.run(() => adminApi.newsletter.exportCsv(), {
    fallback: "Couldn't export subscribers. Please try again.",
  });

  const columns: Column<AdminSubscriber>[] = [
    { key: "email", header: "Email", render: s => <span className={s.unsubscribedAt ? "text-ink-muted" : "text-ink"}>{s.userEmail}</span> },
    {
      key: "unsubscribed", header: "Unsubscribed", className: "whitespace-nowrap", render: s => (
        s.unsubscribedAt ? <Pill tone="neutral">{fmtDate(s.unsubscribedAt)}</Pill> : <span className="text-ink-muted">—</span>
      ),
    },
    { key: "actions", header: "", className: "text-right w-0 whitespace-nowrap", render: s => <RemoveButton sub={s} onRemoved={reload} /> },
  ];

  return (
    <>
      <Toolbar>
        <SearchBox value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search email" />
        <span className="flex-1" />
        <Btn onClick={exportCsv} loading={exporter.busy}>
          {!exporter.busy && <Download className="w-4 h-4" />} Export CSV
        </Btn>
      </Toolbar>
      <p className="text-xs text-ink-muted mb-3">
        People who signed up with the form. No sign-up date is stored, so the list is ordered by email. Unsubscribed people aren't emailed; signing up again re-subscribes them.
      </p>

      {error ? (
        <ErrorBlock message={error} onRetry={reload} />
      ) : (
        <>
          <DataTable columns={columns} rows={data?.items} rowKey={s => s.emailId} loading={loading}
            empty={debounced ? "No subscribers match that search." : "No subscribers yet."} />
          {data && <Pager page={page} totalPages={totalPages(data)} totalCount={data.totalCount} onChange={setPage} />}
        </>
      )}
    </>
  );
}
