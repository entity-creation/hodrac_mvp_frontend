import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { adminApi, enumName, LEAD_STATUSES, totalPages, type AdminPartnerLead, type LeadStatus } from "../api";
import {
  AdminPage, Btn, DataTable, DetailList, Drawer, ErrorBlock, Field, Pager, Pill, SearchBox, Select, TextArea, Toolbar, type Column,
} from "../ui";
import { useAction, useDebounced, useQuery } from "../hooks";
import { fmtDate, fmtDateTime } from "../format";

const PAGE_SIZE = 25;

type Tone = "neutral" | "good" | "warn" | "bad" | "info";
const STATUS_TONE: Record<LeadStatus, Tone> = {
  New: "info", Contacted: "warn", Qualified: "neutral", Won: "good", Lost: "bad",
};

const statusOf = (l: AdminPartnerLead) => enumName(l.status, LEAD_STATUSES);

function StatusPill({ status }: { status: LeadStatus }) {
  return <Pill tone={STATUS_TONE[status]}>{status}</Pill>;
}

function Interests({ items, max }: { items: string[]; max?: number }) {
  if (!items?.length) return <span className="text-ink-muted">—</span>;
  const shown = max ? items.slice(0, max) : items;
  return (
    <div className="flex flex-wrap gap-1">
      {shown.map(i => <Pill key={i}>{i}</Pill>)}
      {max && items.length > max && <span className="text-xs text-ink-muted">+{items.length - max}</span>}
    </div>
  );
}

function LeadDrawer({ lead, onClose, onSaved }: { lead: AdminPartnerLead; onClose: () => void; onSaved: (l: AdminPartnerLead) => void }) {
  const original = statusOf(lead);
  const [status, setStatus] = useState<LeadStatus>(original);
  const [notes, setNotes] = useState(lead.internalNotes ?? "");
  const { run, busy } = useAction();

  const notesValue = notes.trim() === "" ? null : notes;
  const dirty = status !== original || notesValue !== (lead.internalNotes ?? null);

  const save = async () => {
    const body: { status?: LeadStatus; internalNotes?: string | null } = {};
    if (status !== original) body.status = status;
    if (notesValue !== (lead.internalNotes ?? null)) body.internalNotes = notesValue;
    if (!Object.keys(body).length) return onClose();
    const r = await run(() => adminApi.partnerLeads.update(lead.id, body), {
      success: "Lead updated.",
      errors: { 404: "This lead no longer exists." },
    });
    if (r.ok) onSaved(r.result);
  };

  return (
    <Drawer open onClose={onClose} title={lead.companyName}
      footer={<>
        <Btn variant="ghost" onClick={onClose}>Close</Btn>
        <Btn variant="primary" loading={busy} disabled={!dirty} onClick={save}>Save</Btn>
      </>}>
      <div className="flex flex-col gap-6">
        <DetailList rows={[
          ["Contact", lead.contactName],
          ["Email", <a href={`mailto:${lead.email}`} className="underline underline-offset-4">{lead.email}</a>],
          ["Website", lead.website ? (
            <a href={/^https?:\/\//i.test(lead.website) ? lead.website : `https://${lead.website}`} target="_blank" rel="noreferrer noopener"
              className="inline-flex items-center gap-1 underline underline-offset-4">
              {lead.website} <ExternalLink className="w-3 h-3" />
            </a>
          ) : null],
          ["Business type", lead.businessType],
          ["Interests", <Interests items={lead.interests} />],
          ["Received", fmtDateTime(lead.createdAt)],
          ["Updated", fmtDateTime(lead.updatedAt)],
        ]} />

        <div>
          <p className="text-xs font-medium text-ink-soft mb-1">Message</p>
          <div className="rounded-lg border border-line bg-cream-deep/40 px-4 py-3 text-sm text-ink whitespace-pre-wrap">
            {lead.message || <span className="text-ink-muted">No message.</span>}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <Field label="Status">
            <Select value={status} onChange={setStatus} label="Status" options={LEAD_STATUSES.map(s => ({ value: s, label: s }))} />
          </Field>
          <Field label="Internal notes" hint="Only visible to admins.">
            <TextArea rows={5} value={notes} onChange={e => setNotes(e.target.value)} />
          </Field>
        </div>
      </div>
    </Drawer>
  );
}

export default function LeadsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"" | LeadStatus>("");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<AdminPartnerLead | null>(null);
  const q = useDebounced(search);

  const { data, loading, error, reload } = useQuery(
    () => adminApi.partnerLeads.list({ search: q, status: status || undefined, page, pageSize: PAGE_SIZE }),
    [q, status, page]
  );

  const columns: Column<AdminPartnerLead>[] = [
    { key: "company", header: "Company", render: l => <span className="text-ink">{l.companyName}</span> },
    {
      key: "contact", header: "Contact", render: l => (
        <div className="min-w-0">
          <p className="text-ink truncate">{l.contactName}</p>
          <p className="text-xs text-ink-muted truncate">{l.email}</p>
        </div>
      ),
    },
    { key: "type", header: "Business type", render: l => l.businessType ?? <span className="text-ink-muted">—</span> },
    { key: "interests", header: "Interests", render: l => <Interests items={l.interests} max={2} /> },
    { key: "status", header: "Status", render: l => <StatusPill status={statusOf(l)} /> },
    { key: "received", header: "Received", render: l => <span className="text-ink-soft whitespace-nowrap">{fmtDate(l.createdAt)}</span> },
  ];

  return (
    <AdminPage title="Partner leads" description="Enquiries from the partner page, newest first.">
      <Toolbar>
        <SearchBox value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search company, contact or email" />
        <Select value={status} onChange={v => { setStatus(v); setPage(1); }} label="Status"
          options={[{ value: "" as const, label: "All statuses" }, ...LEAD_STATUSES.map(s => ({ value: s, label: s }))]} />
      </Toolbar>

      {error ? (
        <ErrorBlock message={error} onRetry={reload} />
      ) : (
        <>
          <DataTable columns={columns} rows={data?.items} rowKey={l => l.id} loading={loading}
            onRowClick={setOpen} empty={q || status ? "No leads match these filters." : "No leads yet."} />
          {data && <Pager page={page} totalPages={totalPages(data)} totalCount={data.totalCount} onChange={setPage} />}
        </>
      )}

      {open && (
        <LeadDrawer key={open.id} lead={open} onClose={() => setOpen(null)}
          onSaved={() => { setOpen(null); reload(); }} />
      )}
    </AdminPage>
  );
}
