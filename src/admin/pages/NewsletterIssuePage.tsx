import { useEffect, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Monitor, RefreshCw, Send, Smartphone } from "lucide-react";
import { totalPages } from "../api";
import {
  DELIVERY_STATUSES, MAX_PREVIEW_TEXT, MAX_SUBJECT, deliveryStatusTone, issueStatusTone, newsletterAdminApi,
  type IssueEdit, type NewsletterDelivery, type NewsletterIssue,
} from "../newsletterApi";
import { AdminPage, Btn, ConfirmBtn, DataTable, ErrorBlock, LoadingBlock, Pager, Panel, Pill, TextArea, TextInput, Toolbar, type Column } from "../ui";
import { useQuery, useToast } from "../hooks";
import { fmtNumber } from "../format";
import { fieldErrors, formErrorText } from "../../utils/v2Utils/host";
import { fmtIssueDate, fmtWat, watInputToIso } from "./newsletterFormat";

// /admin/newsletter/:id. The "draft ready" email links here.
export default function NewsletterIssuePage() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, error, reload } = useQuery(() => newsletterAdminApi.get(id!), [id]);

  return (
    <AdminPage title={data ? `Issue for ${fmtIssueDate(data.issueDate)}` : "Newsletter issue"}
      actions={<Link to="/admin/newsletter" className="inline-flex items-center gap-1 text-sm text-ink-soft hover:text-ink"><ArrowLeft className="w-4 h-4" /> All issues</Link>}>
      {error ? <ErrorBlock message={error} onRetry={reload} />
        : loading && !data ? <LoadingBlock />
        : data && <Editor key={data.id} initial={data} />}
    </AdminPage>
  );
}

interface Form { subject: string; previewText: string; bodyMarkdown: string }
const toForm = (i: NewsletterIssue): Form => ({ subject: i.subject, previewText: i.previewText, bodyMarkdown: i.bodyMarkdown });

function changes(f: Form, saved: Form): IssueEdit {
  const body: IssueEdit = {};
  if (f.subject !== saved.subject) body.subject = f.subject;
  if (f.previewText !== saved.previewText) body.previewText = f.previewText;
  if (f.bodyMarkdown !== saved.bodyMarkdown) body.bodyMarkdown = f.bodyMarkdown;
  return body;
}

const CONFLICTS = { 404: "This issue no longer exists." };

function Editor({ initial }: { initial: NewsletterIssue }) {
  const notify = useToast();
  const [issue, setIssue] = useState(initial);
  const [form, setForm] = useState<Form>(toForm(initial));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [scheduleAt, setScheduleAt] = useState("");
  const [deliveriesTick, setDeliveriesTick] = useState(0);

  const saved = toForm(issue);
  const dirty = Object.keys(changes(form, saved)).length > 0;
  const editable = issue.status === "Draft" || issue.status === "Approved";
  const status = issue.status;

  const apply = (i: NewsletterIssue) => {
    setIssue(i);
    setForm(toForm(i));
    setDeliveriesTick(t => t + 1);
  };

  // While sending, follow progress.
  useEffect(() => {
    if (status !== "Sending") return;
    const t = setInterval(() => {
      newsletterAdminApi.get(issue.id).then(i => { setIssue(i); setDeliveriesTick(n => n + 1); }).catch(() => {});
    }, 15000);
    return () => clearInterval(t);
  }, [status, issue.id]);

  const fail = (e: unknown, fallback: string) => {
    setErrors(fieldErrors(e));
    setFormError(formErrorText(e, CONFLICTS, fallback));
  };

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm(f => ({ ...f, [k]: v }));

  // Saves if there are changes. Returns false if the save failed.
  const save = async (): Promise<boolean> => {
    const local: Record<string, string> = {};
    if (!form.subject.trim()) local.subject = "Subject can't be empty.";
    if (!form.bodyMarkdown.trim()) local.bodyMarkdown = "The body can't be empty.";
    if (Object.keys(local).length) { setErrors(local); setFormError("Please check the highlighted fields."); return false; }
    if (!dirty) return true;
    try {
      apply(await newsletterAdminApi.update(issue.id, changes(form, saved)));
      return true;
    } catch (e) {
      fail(e, "Couldn't save the issue.");
      return false;
    }
  };

  const run = async (label: string, fn: () => Promise<void>) => {
    setBusy(label);
    setErrors({});
    setFormError("");
    try { await fn(); } finally { setBusy(null); }
  };

  const onSave = () => run("save", async () => {
    const wasApproved = issue.status === "Approved";
    if (await save()) notify(wasApproved ? "Saved. It's back to draft, so approve it again." : "Saved.");
  });

  const onTest = () => run("test", async () => {
    if (!(await save())) return;
    try {
      const r = await newsletterAdminApi.sendTest(issue.id);
      notify(`Test sent to ${r.sentTo}.`);
    } catch (e) { fail(e, "Couldn't send the test."); }
  });

  const onApprove = (when: string | null) => run(when ? "schedule" : "approve", async () => {
    if (!(await save())) return;
    try {
      const i = await newsletterAdminApi.approve(issue.id, when);
      apply(i);
      setScheduleAt("");
      notify(`Approved. It goes out ${fmtWat(i.scheduledFor)}.`);
    } catch (e) { fail(e, "Couldn't approve the issue."); }
  });

  const simple = (label: string, call: () => Promise<NewsletterIssue>, done: string, fallback: string) => run(label, async () => {
    try { apply(await call()); notify(done); } catch (e) { fail(e, fallback); }
  });

  const onSendNow = () => run("send-now", async () => {
    if (!(await save())) return;
    try { apply(await newsletterAdminApi.sendNow(issue.id)); notify("Sending starts within a few minutes."); }
    catch (e) { fail(e, "Couldn't start sending."); }
  });

  const refresh = () => run("refresh", async () => {
    try { apply(await newsletterAdminApi.get(issue.id)); } catch (e) { fail(e, "Couldn't refresh."); }
  });

  const err = (k: string) => errors[k] ? <p className="text-xs text-red-700">{errors[k]}</p> : null;
  const d = issue.deliveries;
  const started = d.pending + d.sent + d.failed + d.skipped > 0;

  return (
    <div className="space-y-6">
      {/* Status and actions */}
      <div className="sticky top-0 z-10 -mx-1 px-1 py-3 bg-cream/95 backdrop-blur flex flex-wrap items-center gap-2 border-b border-line">
        <Pill tone={issueStatusTone(status)}>{status}</Pill>
        <span className="text-xs text-ink-muted">
          {status === "Sent" ? `Sent ${fmtWat(issue.sentAt)}`
            : status === "Sending" ? `Sending since ${fmtWat(issue.sendStartedAt)}`
            : status === "Approved" ? `Goes out ${fmtWat(issue.scheduledFor)}`
            : status === "Draft" ? `Sends ${fmtWat(issue.scheduledFor)} once approved`
            : "Won't be sent"}
        </span>
        {dirty && <span className="text-xs text-sun-500">Unsaved changes</span>}
        <span className="flex-1" />
        {status === "Sending" && (
          <Btn size="sm" variant="ghost" loading={busy === "refresh"} disabled={!!busy} onClick={refresh}><RefreshCw className="w-3.5 h-3.5" /> Refresh</Btn>
        )}
        {editable && (
          <Btn loading={busy === "save"} disabled={!!busy || !dirty} onClick={onSave}>Save changes</Btn>
        )}
        <Btn loading={busy === "test"} disabled={!!busy} onClick={onTest}><Send className="w-3.5 h-3.5" /> {dirty ? "Save and send test" : "Send test"}</Btn>
        {status === "Draft" && (
          <Btn variant="primary" loading={busy === "approve"} disabled={!!busy} onClick={() => onApprove(null)}>
            {dirty ? "Save and approve" : "Approve"}
          </Btn>
        )}
        {status === "Approved" && (
          <Btn loading={busy === "unapprove"} disabled={!!busy}
            onClick={() => simple("unapprove", () => newsletterAdminApi.unapprove(issue.id), "Back to draft. It won't be sent until you approve it again.", "Couldn't unapprove the issue.")}>
            Unapprove
          </Btn>
        )}
      </div>

      {formError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</p>}
      {status === "Approved" && (
        <p className="rounded-xl border border-sky-300 bg-sky-100/60 px-4 py-3 text-sm text-ink">
          Approved. Any change you save puts it back to draft, and it won't go out until you approve it again.
        </p>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* Editor */}
        <div className="space-y-6 min-w-0">
          <Panel>
            <div className="space-y-4">
              <Labeled label={`Subject (${form.subject.length}/${MAX_SUBJECT})`}>
                <TextInput value={form.subject} onChange={e => set("subject", e.target.value)} maxLength={MAX_SUBJECT} disabled={!editable} className="text-base" />
                {err("subject")}
              </Labeled>
              <Labeled label={`Preview text (${form.previewText.length}/${MAX_PREVIEW_TEXT})`} hint="Shown after the subject in most inboxes.">
                <TextArea value={form.previewText} onChange={e => set("previewText", e.target.value)} maxLength={MAX_PREVIEW_TEXT} rows={2} disabled={!editable} />
                {err("previewText")}
              </Labeled>
            </div>
          </Panel>
          <Panel title="Body (Markdown)">
            <textarea value={form.bodyMarkdown} onChange={e => set("bodyMarkdown", e.target.value)} disabled={!editable}
              aria-label="Body (Markdown)"
              className="w-full min-h-[600px] rounded-lg border border-line bg-white px-3 py-2 font-mono text-[13px] leading-relaxed focus:outline-none focus:border-ink resize-y disabled:opacity-60" />
            {err("bodyMarkdown")}
          </Panel>
        </div>

        {/* Preview */}
        <div className="min-w-0">
          <Preview html={issue.previewHtml} stale={dirty} />
        </div>
      </div>

      {/* Scheduling, sending, cancelling */}
      {(editable || status === "Sending") && (
        <Panel title="Sending">
          <div className="grid gap-6 lg:grid-cols-3">
            {editable && (
              <div className="space-y-2">
                <p className="text-sm text-ink">Approve for a different time</p>
                <p className="text-xs text-ink-muted">In WAT. Leave it and use Approve to send at {fmtWat(issue.scheduledFor)}.</p>
                <TextInput type="datetime-local" value={scheduleAt} onChange={e => setScheduleAt(e.target.value)} aria-label="Send at" />
                {err("scheduledFor")}
                <Btn loading={busy === "schedule"} disabled={!!busy || !scheduleAt || (watInputToIso(scheduleAt) ?? "") <= new Date().toISOString()}
                  onClick={() => onApprove(watInputToIso(scheduleAt))}>
                  {dirty ? "Save and approve for this time" : "Approve for this time"}
                </Btn>
              </div>
            )}
            {editable && (
              <div className="space-y-2">
                <p className="text-sm text-ink">Send now</p>
                <p className="text-xs text-ink-muted">Approves it and starts sending within about five minutes.</p>
                <ConfirmBtn label="Send now" confirmLabel="Yes, send it now" variant="outline" loading={busy === "send-now"}
                  message={<>This goes to everyone on the list{dirty ? ", with your unsaved changes saved first" : ""}. It can be cancelled while sending, but emails already sent stay sent.</>}
                  onConfirm={() => { void onSendNow(); }} />
              </div>
            )}
            <div className="space-y-2">
              <p className="text-sm text-ink">Cancel this issue</p>
              <p className="text-xs text-ink-muted">{status === "Sending" ? "Stops the send. Anyone not emailed yet is skipped." : "It won't be sent. A cancelled issue can't be reopened."}</p>
              <ConfirmBtn label="Cancel issue" confirmLabel="Yes, cancel it" loading={busy === "cancel"}
                message={status === "Sending" ? "Emails already sent stay sent. Everyone else is skipped." : "This can't be undone."}
                onConfirm={() => { void simple("cancel", () => newsletterAdminApi.cancel(issue.id), "Issue cancelled.", "Couldn't cancel the issue."); }} />
            </div>
          </div>
        </Panel>
      )}

      {/* Deliveries */}
      <Panel title="Deliveries">
        {!started ? (
          <p className="text-sm text-ink-muted">Nothing sent yet. Deliveries show here once sending starts.</p>
        ) : (
          <Deliveries issueId={issue.id} counts={d} tick={deliveriesTick} />
        )}
      </Panel>
    </div>
  );
}

// The server's rendered email, in a sandbox with no scripts. It reflects the
// last save; the unsubscribe link is a placeholder.
function Preview({ html, stale }: { html: string; stale: boolean }) {
  const [width, setWidth] = useState<"desktop" | "mobile">("desktop");
  return (
    <Panel title="Email preview" padded={false}
      actions={
        <div className="inline-flex gap-1">
          <Btn size="sm" variant={width === "desktop" ? "primary" : "ghost"} onClick={() => setWidth("desktop")} aria-label="Desktop width"><Monitor className="w-3.5 h-3.5" /></Btn>
          <Btn size="sm" variant={width === "mobile" ? "primary" : "ghost"} onClick={() => setWidth("mobile")} aria-label="Phone width"><Smartphone className="w-3.5 h-3.5" /></Btn>
        </div>
      }>
      {stale && <p className="px-5 py-2 text-xs text-sun-500 border-b border-line">Shows the last saved version. Save to update it.</p>}
      <div className="bg-cream-deep/50 p-4 flex justify-center">
        <iframe title="Email preview" sandbox="" srcDoc={html}
          className="bg-white rounded-lg border border-line h-[760px] transition-[width]"
          style={{ width: width === "desktop" ? "100%" : 375, maxWidth: "100%" }} />
      </div>
    </Panel>
  );
}

const DELIVERY_PAGE_SIZE = 50;

function Deliveries({ issueId, counts, tick }: {
  issueId: string; counts: NewsletterIssue["deliveries"]; tick: number;
}) {
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useQuery(
    () => newsletterAdminApi.deliveries(issueId, { status: status || undefined, page, pageSize: DELIVERY_PAGE_SIZE }),
    [issueId, status, page, tick],
  );

  const columns: Column<NewsletterDelivery>[] = [
    { key: "email", header: "Email", render: r => <span className="text-ink">{r.email}</span> },
    { key: "status", header: "Status", render: r => <Pill tone={deliveryStatusTone(r.status)}>{r.status}</Pill> },
    { key: "attempts", header: "Attempts", className: "text-right", render: r => <span className="text-ink-soft">{r.attempts}</span> },
    { key: "sent", header: "Sent", className: "whitespace-nowrap", render: r => <span className="text-ink-soft">{r.sentAt ? fmtWat(r.sentAt) : "—"}</span> },
    { key: "error", header: "Last error", render: r => <span className="text-xs text-red-700 break-words">{r.lastError ?? ""}</span> },
  ];

  const count = (s: string) => s === "Pending" ? counts.pending : s === "Sent" ? counts.sent : s === "Failed" ? counts.failed : counts.skipped;

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <Count label="Sent" value={counts.sent} />
        <Count label="Failed" value={counts.failed} bad={counts.failed > 0} />
        <Count label="Waiting" value={counts.pending} />
        <Count label="Skipped" value={counts.skipped} hint="Unsubscribed or cancelled" />
      </div>
      <Toolbar>
        <div className="inline-flex flex-wrap gap-1">
          {["", ...DELIVERY_STATUSES].map(s => (
            <Btn key={s || "all"} size="sm" variant={status === s ? "primary" : "outline"} onClick={() => { setStatus(s); setPage(1); }}>
              {s ? `${s} (${fmtNumber(count(s))})` : "All"}
            </Btn>
          ))}
        </div>
      </Toolbar>
      {error ? <ErrorBlock message={error} onRetry={reload} /> : (
        <>
          <DataTable columns={columns} rows={data?.items} rowKey={r => r.id} loading={loading}
            empty={status ? `No ${status.toLowerCase()} deliveries.` : "No deliveries."} />
          {data && <Pager page={page} totalPages={totalPages(data)} totalCount={data.totalCount} onChange={setPage} />}
        </>
      )}
    </div>
  );
}

function Count({ label, value, bad, hint }: { label: string; value: number; bad?: boolean; hint?: string }) {
  return (
    <div className="rounded-xl border border-line px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.18em] text-ink-muted">{label}</p>
      <p className={`text-2xl font-light mt-1 ${bad ? "text-red-700" : "text-ink"}`}>{fmtNumber(value)}</p>
      {hint && <p className="text-[11px] text-ink-muted">{hint}</p>}
    </div>
  );
}

function Labeled({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-ink-soft">{label}</span>
      {children}
      {hint && <span className="text-[11px] text-ink-muted">{hint}</span>}
    </div>
  );
}
