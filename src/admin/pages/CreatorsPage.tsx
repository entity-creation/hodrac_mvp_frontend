import { useState } from "react";
import { BadgeCheck, ExternalLink, Plus } from "lucide-react";
import { adminApi, totalPages, type AdminCreator, type CreatorInput } from "../api";
import {
  AdminPage, Btn, Check, DataTable, DetailList, Drawer, ErrorBlock, Field, Pager, Pill, SearchBox, Select, TextArea, TextInput, Toolbar, type Column,
} from "../ui";
import { useAction, useDebounced, useQuery } from "../hooks";
import { fmtDate, fmtDateTime, fmtNumber } from "../format";

const PAGE_SIZE = 25;
type VerifiedFilter = "all" | "verified" | "unverified";

const isHttpUrl = (s: string) => {
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
};
const nullIfEmpty = (s: string) => (s.trim() === "" ? null : s.trim());

function Avatar({ url, name }: { url: string | null; name: string }) {
  return url ? (
    <img src={url} alt="" className="w-8 h-8 rounded-full object-cover border border-line shrink-0" />
  ) : (
    <div className="w-8 h-8 rounded-full border border-line bg-cream-deep flex items-center justify-center text-xs text-ink-soft shrink-0">
      {name.slice(0, 1).toUpperCase()}
    </div>
  );
}

const VerifiedPill = ({ verified }: { verified: boolean }) =>
  verified ? <Pill tone="good">Verified</Pill> : <Pill>Unverified</Pill>;

type TextKey = "displayName" | "handle" | "platformName" | "profileUrl" | "avatarUrl" | "bio" | "contactEmail";
const TEXT_KEYS: TextKey[] = ["displayName", "handle", "platformName", "profileUrl", "avatarUrl", "bio", "contactEmail"];

function CreatorDrawer({ creator, onClose, onSaved }: { creator: AdminCreator | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<Record<TextKey, string>>(() =>
    Object.fromEntries(TEXT_KEYS.map(k => [k, creator?.[k] ?? ""])) as Record<TextKey, string>);
  const [isVerified, setIsVerified] = useState(creator?.isVerified ?? false);
  const [err, setErr] = useState("");
  const { run, busy } = useAction();
  const quick = useAction();

  const set = (k: TextKey) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const errors = { 404: "This creator no longer exists.", 409: "A creator with this handle already exists." };

  const save = async () => {
    setErr("");
    if (!form.displayName.trim()) return setErr("Display name is required.");
    for (const k of ["profileUrl", "avatarUrl"] as const) {
      if (form[k].trim() && !isHttpUrl(form[k].trim())) return setErr(`${k === "profileUrl" ? "Profile" : "Avatar"} URL must start with http:// or https://.`);
    }
    if (form.contactEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail.trim())) return setErr("Contact email doesn't look valid.");

    const body: CreatorInput = {};
    for (const k of TEXT_KEYS) {
      const v = k === "displayName" ? form.displayName.trim() : nullIfEmpty(form[k]);
      if (!creator || v !== (creator[k] ?? null)) {
        if (!creator && v === null) continue;
        (body as Record<TextKey, string | null>)[k] = v;
      }
    }
    if (!creator) {
      if (isVerified) body.isVerified = true;
      const r = await run(() => adminApi.creators.create(body), { success: "Creator created.", errors });
      if (r.ok) onSaved();
      return;
    }
    if (isVerified !== creator.isVerified) body.isVerified = isVerified;
    if (!Object.keys(body).length) return onClose();
    const r = await run(() => adminApi.creators.update(creator.creatorId, body), { success: "Creator saved.", errors });
    if (r.ok) onSaved();
  };

  const toggleVerified = async () => {
    if (!creator) return;
    const next = !creator.isVerified;
    const r = await quick.run(() => adminApi.creators.update(creator.creatorId, { isVerified: next }), {
      success: next ? "Creator verified." : "Creator unverified.", errors,
    });
    if (r.ok) onSaved();
  };

  return (
    <Drawer open onClose={onClose} title={creator ? creator.displayName : "New creator"}
      footer={<>
        {creator && (
          <Btn className="mr-auto" loading={quick.busy} onClick={toggleVerified}>
            <BadgeCheck className="w-4 h-4" /> {creator.isVerified ? "Unverify" : "Verify"}
          </Btn>
        )}
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" loading={busy} onClick={save}>{creator ? "Save" : "Create creator"}</Btn>
      </>}>
      <div className="flex flex-col gap-6">
        {creator && (
          <DetailList rows={[
            ["Status", <VerifiedPill verified={creator.isVerified} />],
            ["Attributions", `${fmtNumber(creator.activeAttributionCount)} active of ${fmtNumber(creator.attributionCount)}`],
            ["Profile", creator.profileUrl ? (
              <a href={creator.profileUrl} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 underline underline-offset-4">
                Open profile <ExternalLink className="w-3 h-3" />
              </a>
            ) : null],
            ["Created", fmtDateTime(creator.createdAt)],
          ]} />
        )}
        <div className="flex flex-col gap-4">
          <Field label="Display name *"><TextInput value={form.displayName} onChange={set("displayName")} autoFocus={!creator} /></Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Handle"><TextInput value={form.handle} onChange={set("handle")} placeholder="@handle" /></Field>
            <Field label="Platform"><TextInput value={form.platformName} onChange={set("platformName")} placeholder="Instagram, TikTok, YouTube…" /></Field>
          </div>
          <Field label="Profile URL"><TextInput value={form.profileUrl} onChange={set("profileUrl")} placeholder="https://" /></Field>
          <Field label="Avatar URL"><TextInput value={form.avatarUrl} onChange={set("avatarUrl")} placeholder="https://" /></Field>
          <Field label="Contact email"><TextInput type="email" value={form.contactEmail} onChange={set("contactEmail")} /></Field>
          <Field label="Bio"><TextArea rows={4} value={form.bio} onChange={set("bio")} /></Field>
          <Check label="Verified" checked={isVerified} onChange={setIsVerified} />
          {err && <p className="text-sm text-red-700">{err}</p>}
        </div>
      </div>
    </Drawer>
  );
}

export default function CreatorsPage() {
  const [search, setSearch] = useState("");
  const [verified, setVerified] = useState<VerifiedFilter>("all");
  const [page, setPage] = useState(1);
  const [drawer, setDrawer] = useState<{ creator: AdminCreator | null } | null>(null);
  const q = useDebounced(search);
  const { run, busy } = useAction();
  const [busyId, setBusyId] = useState<string | null>(null);

  const { data, loading, error, reload } = useQuery(
    () => adminApi.creators.list({
      search: q, page, pageSize: PAGE_SIZE,
      verified: verified === "all" ? undefined : verified === "verified",
    }),
    [q, verified, page]
  );

  const quickToggle = async (c: AdminCreator) => {
    setBusyId(c.creatorId);
    const r = await run(() => adminApi.creators.update(c.creatorId, { isVerified: !c.isVerified }), {
      success: c.isVerified ? "Creator unverified." : "Creator verified.",
      errors: { 404: "This creator no longer exists." },
    });
    setBusyId(null);
    if (r.ok) reload();
  };

  const columns: Column<AdminCreator>[] = [
    {
      key: "name", header: "Creator", render: c => (
        <div className="flex items-center gap-3 min-w-0">
          <Avatar url={c.avatarUrl} name={c.displayName} />
          <span className="truncate">{c.displayName}</span>
        </div>
      ),
    },
    { key: "handle", header: "Handle", render: c => c.handle ?? <span className="text-ink-muted">—</span> },
    { key: "platform", header: "Platform", render: c => c.platformName ?? <span className="text-ink-muted">—</span> },
    { key: "verified", header: "Status", render: c => <VerifiedPill verified={c.isVerified} /> },
    {
      key: "attr", header: "Attributions", render: c => (
        <span><span className="text-ink">{fmtNumber(c.activeAttributionCount)}</span><span className="text-ink-muted"> / {fmtNumber(c.attributionCount)}</span></span>
      ),
    },
    { key: "created", header: "Created", render: c => <span className="text-ink-soft whitespace-nowrap">{fmtDate(c.createdAt)}</span> },
    {
      key: "actions", header: "", className: "text-right", render: c => (
        <span onClick={e => e.stopPropagation()}>
          <Btn size="sm" variant="ghost" loading={busy && busyId === c.creatorId} disabled={busy && busyId !== c.creatorId}
            onClick={() => quickToggle(c)}>
            {c.isVerified ? "Unverify" : "Verify"}
          </Btn>
        </span>
      ),
    },
  ];

  return (
    <AdminPage title="Creators" description="Creators credited on platform wishlists."
      actions={<Btn variant="primary" onClick={() => setDrawer({ creator: null })}><Plus className="w-4 h-4" /> New creator</Btn>}>
      <Toolbar>
        <SearchBox value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search name or handle" />
        <Select value={verified} onChange={v => { setVerified(v); setPage(1); }} label="Verification"
          options={[{ value: "all", label: "All creators" }, { value: "verified", label: "Verified" }, { value: "unverified", label: "Unverified" }]} />
      </Toolbar>

      {error ? (
        <ErrorBlock message={error} onRetry={reload} />
      ) : (
        <>
          <DataTable columns={columns} rows={data?.items} rowKey={c => c.creatorId} loading={loading}
            onRowClick={c => setDrawer({ creator: c })} empty={q || verified !== "all" ? "No creators match these filters." : "No creators yet."} />
          {data && <Pager page={page} totalPages={totalPages(data)} totalCount={data.totalCount} onChange={setPage} />}
        </>
      )}

      {drawer && (
        <CreatorDrawer key={drawer.creator?.creatorId ?? "new"} creator={drawer.creator}
          onClose={() => setDrawer(null)} onSaved={() => { setDrawer(null); reload(); }} />
      )}
    </AdminPage>
  );
}
