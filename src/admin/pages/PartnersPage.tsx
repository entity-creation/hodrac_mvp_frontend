import { useState, type ReactNode } from "react";
import { Copy, Download, ExternalLink, Plus } from "lucide-react";
import {
  adminApi, fillDailySeries,
  type AdminPartnerDetail, type AdminPartnerLink, type AdminPartnerSummary,
  type ClickStats, type ClickStatsQuery, type PartnerInput, type PartnerLinkInput,
} from "../api";
import { PartnerAudiencePanel } from "../insightsUi";
import {
  AdminPage, Btn, Check, ConfirmBtn, DailyBars, DataTable, DetailList, Drawer, ErrorBlock, Field, LoadingBlock, NumberInput, Panel, Pill, SearchBox, StatCard, TextInput, type Column,
} from "../ui";
import { useAction, useDebounced, useQuery, useToast } from "../hooks";
import { fmtDate, fmtDateTime, fmtNumber, fromLocalInput, toLocalInput } from "../format";

// ─── Shared helpers (exported for reuse by other admin pages) ─────────────────

export interface PickedRef { id: string; label: string; sub?: string | null }

// Searchable single-select picker backed by an async search function.
export function SearchPicker({ value, onChange, search, placeholder = "Search", disabled }: {
  value: PickedRef | null;
  onChange: (v: PickedRef | null) => void;
  search: (term: string) => Promise<PickedRef[]>;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [term, setTerm] = useState("");
  const debounced = useDebounced(term);
  const open = !value && !disabled;
  const { data, loading, error, reload } = useQuery(() => (open ? search(debounced) : Promise.resolve([])), [debounced, open]);

  if (value) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border border-line bg-white px-3 py-2">
        <div className="min-w-0">
          <p className="text-sm text-ink truncate">{value.label}</p>
          {value.sub && <p className="text-xs text-ink-muted truncate">{value.sub}</p>}
        </div>
        {!disabled && <Btn size="sm" variant="ghost" onClick={() => onChange(null)}>Change</Btn>}
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      <SearchBox value={term} onChange={setTerm} placeholder={placeholder} />
      <div className="rounded-lg border border-line max-h-56 overflow-y-auto divide-y divide-line">
        {error ? (
          <div className="p-2"><ErrorBlock message={error} onRetry={reload} /></div>
        ) : loading && !data?.length ? (
          <p className="px-3 py-3 text-sm text-ink-muted">Searching…</p>
        ) : !data?.length ? (
          <p className="px-3 py-3 text-sm text-ink-muted">No matches.</p>
        ) : (
          data.map(o => (
            <button key={o.id} type="button" onClick={() => onChange(o)}
              className="w-full text-left px-3 py-2 hover:bg-cream-deep/60 transition-colors">
              <p className="text-sm text-ink truncate">{o.label}</p>
              {o.sub && <p className="text-xs text-ink-muted truncate">{o.sub}</p>}
            </button>
          ))
        )}
      </div>
    </div>
  );
}

const searchDestinations = (search: string) =>
  adminApi.destinations.list({ search, pageSize: 10 }).then(r =>
    r.items.map(d => ({ id: d.destinationId, label: d.destinationName, sub: d.countryName })));

const searchWishlists = (search: string) =>
  adminApi.wishlists.list({ search, pageSize: 10 }).then(r =>
    r.items.map(w => ({ id: w.wishlistId, label: w.wishlistName, sub: `${w.totalDays} days` })));

// Wishlist-only picker for other admin pages.
export function WishlistPicker(props: { value: PickedRef | null; onChange: (v: PickedRef | null) => void; disabled?: boolean }) {
  return <SearchPicker {...props} search={searchWishlists} placeholder="Search wishlists" />;
}

const isHttpUrl = (s: string) => {
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
};

const nullIfEmpty = (s: string) => (s.trim() === "" ? null : s.trim());

const isoDay = (d: Date) => d.toISOString().slice(0, 10);
const daysBetween = (from: string, to: string) =>
  Math.max(1, Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000) + 1);

function FormError({ children }: { children: ReactNode }) {
  return <p className="text-sm text-red-700">{children}</p>;
}

// Readable names for the `src` the public site sends with each click.
const SOURCE_LABELS: Record<string, string> = {
  destination_detail: "Destination page",
  destination_card: "Destination card",
  wishlist_detail: "Wishlist page",
  wishlist_card: "Wishlist card",
  featured: "Featured",
  search: "Search",
  share: "Shared link",
  trip: "Trip page",
  other: "Other",
  unknown: "Not specified",
};

function SourceBars({ rows }: { rows: ClickStats["bySource"] }) {
  const sorted = [...(rows ?? [])].sort((a, b) => b.clicks - a.clicks);
  const total = sorted.reduce((s, r) => s + r.clicks, 0);
  const max = Math.max(1, ...sorted.map(r => r.clicks));
  return (
    <div>
      <h3 className="text-sm font-medium text-ink font-sans mb-3">Where clicks came from</h3>
      {sorted.length === 0 ? (
        <p className="text-sm text-ink-muted">No clicks in this range.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {sorted.map(r => {
            const unknown = r.source === "unknown";
            return (
              <li key={r.source} className="text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className={`truncate ${unknown ? "text-ink-muted italic" : "text-ink"}`} title={r.source}>
                    {SOURCE_LABELS[r.source] ?? r.source}
                  </span>
                  <span className="shrink-0 text-xs text-ink-soft tabular-nums">
                    {fmtNumber(r.clicks)} <span className="text-ink-muted">· {total ? Math.round((r.clicks / total) * 100) : 0}%</span>
                  </span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-cream-deep overflow-hidden">
                  <div className={`h-full rounded-full ${unknown ? "bg-ink/25" : "bg-ink/80"}`} style={{ width: `${(r.clicks / max) * 100}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// Click stats with a from/to date range (defaults to the last 30 days).
// `actions` gets the selected range, e.g. for an export button.
export function ClickStatsPanel({ load, title = "Clicks", actions }: {
  load: (q: ClickStatsQuery) => Promise<ClickStats>;
  title?: string;
  actions?: (range: { from: string; to: string }) => ReactNode;
}) {
  const today = new Date();
  const [to, setTo] = useState(() => isoDay(today));
  const [from, setFrom] = useState(() => isoDay(new Date(today.getTime() - 29 * 86400000)));
  const [includeBots, setIncludeBots] = useState(false);
  const valid = !!from && !!to && from <= to;
  const range = { from: `${from}T00:00:00Z`, to: `${to}T23:59:59Z` };
  const { data, loading, error, reload } = useQuery(
    () => (valid ? load({ ...range, includeBots }) : Promise.resolve(null)),
    [from, to, valid, includeBots]
  );
  const points = data ? fillDailySeries(data.daily.map(d => ({ date: d.date, clicks: d.clicks })), from, daysBetween(from, to)) : [];

  return (
    <Panel title={title} actions={
      <div className="flex flex-wrap items-center gap-2">
        <input type="date" value={from} max={to} onChange={e => setFrom(e.target.value)} aria-label="From"
          className="rounded-lg border border-line bg-white px-2 py-1 text-xs text-ink focus:outline-none focus:border-ink" />
        <span className="text-xs text-ink-muted">to</span>
        <input type="date" value={to} min={from} onChange={e => setTo(e.target.value)} aria-label="To"
          className="rounded-lg border border-line bg-white px-2 py-1 text-xs text-ink focus:outline-none focus:border-ink" />
        {valid && actions?.(range)}
      </div>
    }>
      {!valid ? (
        <FormError>Choose a valid date range.</FormError>
      ) : error ? (
        <ErrorBlock message={error} onRetry={reload} />
      ) : loading && !data ? (
        <LoadingBlock />
      ) : data ? (
        <div className={`flex flex-col gap-4 ${loading ? "opacity-60" : ""}`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Check label="Include bots" checked={includeBots} onChange={setIncludeBots} />
            {!includeBots && data.botClicksExcluded > 0 && (
              <span className="text-xs text-ink-muted">{fmtNumber(data.botClicksExcluded)} bot/preview clicks hidden</span>
            )}
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard label="Clicks" value={fmtNumber(data.totalClicks)} />
            <StatCard label="Unique visitors" value={fmtNumber(data.uniqueVisitors)} hint="Logged in or not" />
            <StatCard label="Logged-in clicks" value={fmtNumber(data.loggedInClicks)} />
            <StatCard label="Unique users" value={fmtNumber(data.uniqueUsers)} hint="Logged in only" />
          </div>
          <SourceBars rows={data.bySource} />
          <DailyBars points={points} label="Clicks per day" />
        </div>
      ) : null}
    </Panel>
  );
}

function ActivePill({ active }: { active: boolean }) {
  return active ? <Pill tone="good">Active</Pill> : <Pill>Inactive</Pill>;
}

function Logo({ url, name }: { url: string | null; name: string }) {
  return url ? (
    <img src={url} alt="" className="w-8 h-8 rounded-lg object-contain border border-line bg-white shrink-0" />
  ) : (
    <div className="w-8 h-8 rounded-lg border border-line bg-cream-deep flex items-center justify-center text-xs text-ink-soft shrink-0">
      {name.slice(0, 1).toUpperCase()}
    </div>
  );
}

// ─── Partner form ─────────────────────────────────────────────────────────────

function PartnerFormDrawer({ open, partner, onClose, onSaved }: {
  open: boolean;
  partner: Pick<AdminPartnerSummary, "partnerId" | "name" | "logoUrl" | "defaultCtaLabel" | "isActive"> | null;
  onClose: () => void;
  onSaved: (id: string) => void;
}) {
  const [name, setName] = useState(partner?.name ?? "");
  const [logoUrl, setLogoUrl] = useState(partner?.logoUrl ?? "");
  const [cta, setCta] = useState(partner?.defaultCtaLabel ?? "");
  const [isActive, setIsActive] = useState(partner?.isActive ?? true);
  const [err, setErr] = useState("");
  const { run, busy } = useAction();

  const save = async () => {
    setErr("");
    if (!name.trim()) return setErr("Name is required.");
    if (logoUrl.trim() && !isHttpUrl(logoUrl.trim())) return setErr("Logo URL must start with http:// or https://.");
    const errors = { 409: "A partner with this name already exists.", 404: "This partner no longer exists." };
    if (!partner) {
      const body: PartnerInput = { name: name.trim(), logoUrl: nullIfEmpty(logoUrl), defaultCtaLabel: nullIfEmpty(cta), isActive };
      const r = await run(() => adminApi.partners.create(body), { success: "Partner created.", errors });
      if (r.ok) onSaved(r.result.partnerId);
      return;
    }
    const body: PartnerInput = {};
    if (name.trim() !== partner.name) body.name = name.trim();
    if (nullIfEmpty(logoUrl) !== (partner.logoUrl ?? null)) body.logoUrl = nullIfEmpty(logoUrl);
    if (nullIfEmpty(cta) !== (partner.defaultCtaLabel ?? null)) body.defaultCtaLabel = nullIfEmpty(cta);
    if (isActive !== partner.isActive) body.isActive = isActive;
    if (!Object.keys(body).length) return onClose();
    const r = await run(() => adminApi.partners.update(partner.partnerId, body), { success: "Partner saved.", errors });
    if (r.ok) onSaved(partner.partnerId);
  };

  return (
    <Drawer open={open} onClose={onClose} title={partner ? `Edit ${partner.name}` : "New partner"}
      footer={<>
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" loading={busy} onClick={save}>{partner ? "Save" : "Create partner"}</Btn>
      </>}>
      <div className="flex flex-col gap-4">
        <Field label="Name *"><TextInput value={name} onChange={e => setName(e.target.value)} autoFocus /></Field>
        <Field label="Logo URL"><TextInput value={logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder="https://" /></Field>
        <Field label="Default CTA label" hint="Used when a link has no CTA of its own, e.g. “Book now”.">
          <TextInput value={cta} onChange={e => setCta(e.target.value)} />
        </Field>
        <Check label="Active" checked={isActive} onChange={setIsActive} />
        {err && <FormError>{err}</FormError>}
      </div>
    </Drawer>
  );
}

// ─── Link form ────────────────────────────────────────────────────────────────

type TargetType = "Destination" | "Wishlist";

function LinkDrawer({ open, partnerId, link, onClose, onSaved }: {
  open: boolean; partnerId: string; link: AdminPartnerLink | null; onClose: () => void; onSaved: () => void;
}) {
  const notify = useToast();
  const initialType: TargetType = link?.wishlistId ? "Wishlist" : "Destination";
  const initialTarget: PickedRef | null = link
    ? { id: (link.wishlistId ?? link.destinationId) ?? "", label: link.targetName }
    : null;
  const [targetType, setTargetType] = useState<TargetType>(initialType);
  const [target, setTarget] = useState<PickedRef | null>(initialTarget);
  const [bookingUrl, setBookingUrl] = useState(link?.bookingUrl ?? "");
  const [cta, setCta] = useState(link?.ctaLabel ?? "");
  const [isSponsored, setIsSponsored] = useState(link?.isSponsored ?? false);
  const [appendUtm, setAppendUtm] = useState(link?.appendUtm ?? true);
  const [priority, setPriority] = useState<number | null>(link?.priority ?? 0);
  const [isActive, setIsActive] = useState(link?.isActive ?? true);
  const [startsAt, setStartsAt] = useState(toLocalInput(link?.startsAt));
  const [endsAt, setEndsAt] = useState(toLocalInput(link?.endsAt));
  const [err, setErr] = useState("");
  const { run, busy } = useAction();
  const del = useAction();

  const errors = { 404: "This link (or its target) no longer exists.", 409: "A link for this partner and target already exists." };

  const switchType = (t: TargetType) => {
    if (t === targetType) return;
    setTargetType(t);
    setTarget(null);
  };

  const save = async () => {
    setErr("");
    if (!target?.id) return setErr(`Pick a ${targetType.toLowerCase()}.`);
    if (!bookingUrl.trim()) return setErr("Booking URL is required.");
    if (!isHttpUrl(bookingUrl.trim())) return setErr("Booking URL must start with http:// or https://.");
    if (priority != null && !Number.isFinite(priority)) return setErr("Priority must be a number.");
    const s = fromLocalInput(startsAt);
    const e = fromLocalInput(endsAt);
    if (s && e && s >= e) return setErr("End must be after start.");

    if (!link) {
      const body: PartnerLinkInput = {
        partnerId,
        destinationId: targetType === "Destination" ? target.id : null,
        wishlistId: targetType === "Wishlist" ? target.id : null,
        bookingUrl: bookingUrl.trim(),
        ctaLabel: nullIfEmpty(cta),
        isSponsored,
        appendUtm,
        priority: priority ?? 0,
        isActive,
        startsAt: s,
        endsAt: e,
      };
      const r = await run(() => adminApi.partnerLinks.create(body), { success: "Link created.", errors });
      if (r.ok) onSaved();
      return;
    }

    const body: PartnerLinkInput = {};
    const origId = link.wishlistId ?? link.destinationId;
    if (targetType !== initialType || target.id !== origId) {
      body.destinationId = targetType === "Destination" ? target.id : null;
      body.wishlistId = targetType === "Wishlist" ? target.id : null;
    }
    if (bookingUrl.trim() !== link.bookingUrl) body.bookingUrl = bookingUrl.trim();
    if (nullIfEmpty(cta) !== (link.ctaLabel ?? null)) body.ctaLabel = nullIfEmpty(cta);
    if (isSponsored !== link.isSponsored) body.isSponsored = isSponsored;
    if (appendUtm !== (link.appendUtm ?? true)) body.appendUtm = appendUtm;
    if ((priority ?? 0) !== link.priority) body.priority = priority ?? 0;
    if (isActive !== link.isActive) body.isActive = isActive;
    if (startsAt !== toLocalInput(link.startsAt)) {
      if (s) body.startsAt = s; else body.clearStartsAt = true;
    }
    if (endsAt !== toLocalInput(link.endsAt)) {
      if (e) body.endsAt = e; else body.clearEndsAt = true;
    }
    if (!Object.keys(body).length) return onClose();
    const r = await run(() => adminApi.partnerLinks.update(link.linkId, body), { success: "Link saved.", errors });
    if (r.ok) onSaved();
  };

  const deactivate = async () => {
    if (!link) return;
    const r = await run(() => adminApi.partnerLinks.update(link.linkId, { isActive: false }), { success: "Link deactivated.", errors });
    if (r.ok) onSaved();
  };

  const remove = async () => {
    if (!link) return;
    const r = await del.run(() => adminApi.partnerLinks.remove(link.linkId), { success: "Link deleted.", errors });
    if (r.ok) onSaved();
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      notify("Tracking URL copied.");
    } catch {
      notify("Couldn't copy to the clipboard.", "error");
    }
  };

  return (
    <Drawer open={open} onClose={onClose} title={link ? `Link · ${link.targetName}` : "New link"} wide
      footer={<>
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" loading={busy} onClick={save}>{link ? "Save link" : "Create link"}</Btn>
      </>}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <Field label="Target type">
            <div className="inline-flex gap-1">
              {(["Destination", "Wishlist"] as const).map(t => (
                <Btn key={t} size="sm" variant={targetType === t ? "primary" : "outline"} onClick={() => switchType(t)}>{t}</Btn>
              ))}
            </div>
          </Field>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-ink-soft">{targetType} *</span>
            <SearchPicker value={target} onChange={setTarget}
              search={targetType === "Destination" ? searchDestinations : searchWishlists}
              placeholder={`Search ${targetType === "Destination" ? "destinations" : "wishlists"}`} />
          </div>
          <Field label="Booking URL *"><TextInput value={bookingUrl} onChange={e => setBookingUrl(e.target.value)} placeholder="https://" /></Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="CTA label" hint="Leave blank to use the partner default."><TextInput value={cta} onChange={e => setCta(e.target.value)} /></Field>
            <Field label="Priority" hint="Higher shows first."><NumberInput value={priority} onChange={setPriority} step={1} /></Field>
            <Field label="Starts at" hint="Local time; blank = immediately.">
              <TextInput type="datetime-local" value={startsAt} onChange={e => setStartsAt(e.target.value)} />
            </Field>
            <Field label="Ends at" hint="Local time; blank = no end.">
              <TextInput type="datetime-local" value={endsAt} onChange={e => setEndsAt(e.target.value)} />
            </Field>
          </div>
          <div className="flex flex-wrap gap-6">
            <Check label="Sponsored" checked={isSponsored} onChange={setIsSponsored} />
            <Check label="Active" checked={isActive} onChange={setIsActive} />
          </div>
          <div className="flex flex-col gap-1">
            <Check label="Add Hodrac tracking tags to the link" checked={appendUtm} onChange={setAppendUtm} />
            <p className="text-xs text-ink-muted pl-6">
              Adds utm_source=hodrac and similar tags so the partner sees Hodrac visits in their own analytics.
              Turn this off only if their booking page breaks with extra URL parameters.
            </p>
          </div>
          {err && <FormError>{err}</FormError>}
        </div>

        {link && (
          <>
            <Panel title="Tracking">
              <div className="flex items-center gap-2">
                <TextInput readOnly value={link.trackingUrl ?? ""} placeholder="No tracking URL" className="font-mono text-xs" />
                <Btn size="sm" disabled={!link.trackingUrl} onClick={() => link.trackingUrl && copy(link.trackingUrl)} aria-label="Copy tracking URL">
                  <Copy className="w-3.5 h-3.5" /> Copy
                </Btn>
              </div>
              <p className="text-xs text-ink-muted mt-2">Created {fmtDateTime(link.createdAt)}</p>
            </Panel>

            <ClickStatsPanel title="Link clicks" load={q => adminApi.partnerLinks.stats(link.linkId, q)} />

            <Panel title="Remove">
              <div className="flex flex-col gap-3">
                <p className="text-sm text-ink-soft">
                  Deleting permanently removes this link and all of its click history. Deactivating hides it but keeps the stats.
                </p>
                <div className="flex flex-wrap gap-2">
                  {link.isActive && <Btn size="sm" loading={busy} onClick={deactivate}>Deactivate</Btn>}
                  <ConfirmBtn size="sm" label="Delete link" confirmLabel="Delete permanently" loading={del.busy} onConfirm={remove} />
                </div>
              </div>
            </Panel>
          </>
        )}
      </div>
    </Drawer>
  );
}

// ─── Partner detail ───────────────────────────────────────────────────────────

const truncate = (s: string, n = 40) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

function PartnerDetailDrawer({ partnerId, onClose, onChanged }: {
  partnerId: string; onClose: () => void; onChanged: () => void;
}) {
  const { data, loading, error, reload } = useQuery<AdminPartnerDetail>(() => adminApi.partners.get(partnerId), [partnerId]);
  const [editing, setEditing] = useState(false);
  const [linkDrawer, setLinkDrawer] = useState<{ link: AdminPartnerLink | null } | null>(null);
  const [tab, setTab] = useState<"overview" | "audience">("overview");
  const { run, busy } = useAction();
  const exporter = useAction();

  const exportCsv = (range: { from: string; to: string }) => {
    if (!data) return;
    exporter.run(() => adminApi.partners.exportClicks(partnerId, data.name, range), {
      errors: { 404: "This partner no longer exists." }, fallback: "Couldn't export clicks.",
    });
  };

  const toggleActive = async () => {
    if (!data) return;
    const r = await run(
      () => (data.isActive ? adminApi.partners.deactivate(partnerId) : adminApi.partners.activate(partnerId)),
      { success: data.isActive ? "Partner deactivated." : "Partner activated.", errors: { 404: "This partner no longer exists." } }
    );
    if (r.ok) { reload(); onChanged(); }
  };

  const linkColumns: Column<AdminPartnerLink>[] = [
    {
      key: "target", header: "Target", render: l => (
        <div className="min-w-0">
          <p className="text-ink truncate max-w-56">{l.targetName}</p>
          <p className="text-xs text-ink-muted">{l.targetType}</p>
        </div>
      ),
    },
    {
      key: "url", header: "Booking URL", render: l => (
        <a href={l.bookingUrl} target="_blank" rel="noreferrer noopener" onClick={e => e.stopPropagation()}
          className="inline-flex items-center gap-1 text-ink-soft hover:text-ink underline-offset-4 hover:underline" title={l.bookingUrl}>
          {truncate(l.bookingUrl.replace(/^https?:\/\//, ""), 32)} <ExternalLink className="w-3 h-3 shrink-0" />
        </a>
      ),
    },
    { key: "cta", header: "CTA", render: l => l.ctaLabel ?? <span className="text-ink-muted">Default</span> },
    {
      key: "sponsored", header: "Sponsored", render: l => (
        <span className="inline-flex flex-wrap gap-1">
          {l.isSponsored ? <Pill tone="warn">Sponsored</Pill> : <span className="text-ink-muted">—</span>}
          {l.appendUtm === false && <Pill>No UTM</Pill>}
        </span>
      ),
    },
    { key: "priority", header: "Priority", render: l => fmtNumber(l.priority), className: "text-right" },
    { key: "active", header: "Status", render: l => <ActivePill active={l.isActive} /> },
    {
      key: "window", header: "Window", render: l => (
        <span className="text-xs text-ink-soft whitespace-nowrap">{fmtDate(l.startsAt)} – {fmtDate(l.endsAt)}</span>
      ),
    },
  ];

  return (
    <>
      <Drawer open onClose={onClose} wide title={data ? (
        <span className="inline-flex items-center gap-3"><Logo url={data.logoUrl} name={data.name} />{data.name}</span>
      ) : "Partner"}>
        {error ? (
          <ErrorBlock message={error} onRetry={reload} />
        ) : !data ? (
          <LoadingBlock />
        ) : (
          <div className={`flex flex-col gap-6 ${loading ? "opacity-60" : ""}`}>
            <div className="flex flex-wrap items-center gap-2">
              <ActivePill active={data.isActive} />
              <span className="flex-1" />
              <Btn size="sm" onClick={() => setEditing(true)}>Edit</Btn>
              <Btn size="sm" loading={busy} onClick={toggleActive}>{data.isActive ? "Deactivate" : "Activate"}</Btn>
            </div>
            <div className="flex gap-1 border-b border-line overflow-x-auto" role="tablist">
              {([["overview", "Overview"], ["audience", "Who clicks"]] as const).map(([id, label]) => (
                <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
                  className={`px-3 py-2 text-sm whitespace-nowrap border-b-2 -mb-px transition-colors ${tab === id ? "border-ink text-ink" : "border-transparent text-ink-muted hover:text-ink"}`}>
                  {label}
                </button>
              ))}
            </div>

            {tab === "audience" ? <PartnerAudiencePanel partnerId={partnerId} /> : <>
            <DetailList rows={[
              ["Default CTA", data.defaultCtaLabel],
              ["Logo URL", data.logoUrl ? <a href={data.logoUrl} target="_blank" rel="noreferrer noopener" className="underline underline-offset-4">{truncate(data.logoUrl, 60)}</a> : null],
              ["Created", fmtDateTime(data.createdAt)],
            ]} />

            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-normal text-ink">Links <span className="text-ink-muted text-sm">({data.links.length})</span></h3>
                <Btn size="sm" variant="primary" onClick={() => setLinkDrawer({ link: null })}><Plus className="w-3.5 h-3.5" /> Add link</Btn>
              </div>
              <DataTable columns={linkColumns} rows={data.links} rowKey={l => l.linkId}
                onRowClick={l => setLinkDrawer({ link: l })} empty="This partner has no links yet." />
            </div>

            <ClickStatsPanel title="Partner clicks" load={q => adminApi.partners.stats(partnerId, q)}
              actions={range => (
                <Btn size="sm" loading={exporter.busy} onClick={() => exportCsv(range)}>
                  <Download className="w-3.5 h-3.5" /> Export CSV
                </Btn>
              )} />
            </>}
          </div>
        )}
      </Drawer>

      {editing && data && (
        <PartnerFormDrawer open partner={data} onClose={() => setEditing(false)}
          onSaved={() => { setEditing(false); reload(); onChanged(); }} />
      )}
      {linkDrawer && (
        <LinkDrawer key={linkDrawer.link?.linkId ?? "new"} open partnerId={partnerId} link={linkDrawer.link}
          onClose={() => setLinkDrawer(null)}
          onSaved={() => { setLinkDrawer(null); reload(); onChanged(); }} />
      )}
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PartnersPage() {
  const { data, loading, error, reload } = useQuery(() => adminApi.partners.list(), []);
  const [creating, setCreating] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const columns: Column<AdminPartnerSummary>[] = [
    {
      key: "name", header: "Partner", render: p => (
        <div className="flex items-center gap-3 min-w-0">
          <Logo url={p.logoUrl} name={p.name} />
          <span className="truncate">{p.name}</span>
        </div>
      ),
    },
    { key: "cta", header: "Default CTA", render: p => p.defaultCtaLabel ?? <span className="text-ink-muted">—</span> },
    { key: "active", header: "Status", render: p => <ActivePill active={p.isActive} /> },
    {
      key: "links", header: "Links", render: p => (
        <span><span className="text-ink">{fmtNumber(p.activeLinkCount)}</span><span className="text-ink-muted"> / {fmtNumber(p.linkCount)}</span></span>
      ),
    },
    { key: "created", header: "Created", render: p => <span className="text-ink-soft whitespace-nowrap">{fmtDate(p.createdAt)}</span> },
  ];

  return (
    <AdminPage title="Partners" description="Booking partners and the destinations and wishlists their links appear on."
      actions={<Btn variant="primary" onClick={() => setCreating(true)}><Plus className="w-4 h-4" /> New partner</Btn>}>
      {error ? (
        <ErrorBlock message={error} onRetry={reload} />
      ) : (
        <DataTable columns={columns} rows={data} rowKey={p => p.partnerId} loading={loading}
          onRowClick={p => setOpenId(p.partnerId)} empty="No partners yet." />
      )}

      {creating && (
        <PartnerFormDrawer open partner={null} onClose={() => setCreating(false)}
          onSaved={id => { setCreating(false); reload(); setOpenId(id); }} />
      )}
      {openId && <PartnerDetailDrawer key={openId} partnerId={openId} onClose={() => setOpenId(null)} onChanged={reload} />}
    </AdminPage>
  );
}
