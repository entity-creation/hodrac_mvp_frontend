import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowDown, ArrowUp, ExternalLink, Pencil, Plus, X } from "lucide-react";
import { isApiError } from "../../dataStore/v2Api/client";
import {
  adminApi, enumName, totalPages, POOL_TYPES, WISHLIST_SORTS,
  type AdminAttribution, type AdminCity, type AdminCreator, type AdminItineraryDay, type AdminItineraryItem,
  type AdminWishlistDetail, type AdminWishlistSummary, type AttributionInput, type ItineraryDayInput,
  type ItineraryItemInput, type WishlistInput,
} from "../api";
import {
  AdminPage, Btn, Check, ConfirmBtn, DataTable, DetailList, Drawer, ErrorBlock, Field, ListInput, LoadingBlock, NumberInput, Pager, Pill, SearchBox, Select, TextArea, TextInput, Toolbar, type Column,
} from "../ui";
import { useAction, useDebounced, useQuery, useToast } from "../hooks";
import { fmtDate, fmtDateTime, fmtNumber, fmtUsd, fromLocalInput, toLocalInput } from "../format";
import { FieldError, SectionTitle, Thumb } from "./DestinationsPage";
import { WishlistAudiencePanel } from "../insightsUi";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function changedFields<T extends object>(next: T, prev: T): Partial<T> {
  const out: Partial<T> = {};
  for (const k of Object.keys(next) as (keyof T)[]) {
    if (JSON.stringify(next[k]) !== JSON.stringify(prev[k])) out[k] = next[k];
  }
  return out;
}

const nullIfBlank = (s: string) => (s.trim() ? s.trim() : null);
const numOrUndef = (n: number | null) => (n == null ? undefined : n);
const selectCls = "w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:border-ink";
const CONFLICT = "Someone else changed this template since you opened it. Reload to see their changes.";
const GONE = "This template no longer exists.";

function swap<T>(arr: T[], i: number, j: number): T[] {
  const out = [...arr];
  [out[i], out[j]] = [out[j], out[i]];
  return out;
}

// ─── List page ────────────────────────────────────────────────────────────────

export default function WishlistsPage() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const sort = params.get("sort") ?? "newest";
  const page = Math.max(1, Number(params.get("page")) || 1);
  const setParam = (patch: Record<string, string>) => setParams(prev => {
    const next = new URLSearchParams(prev);
    for (const [k, v] of Object.entries(patch)) { if (v) next.set(k, v); else next.delete(k); }
    if (!("page" in patch)) next.delete("page");
    return next;
  }, { replace: true });

  const [searchDraft, setSearchDraft] = useState(q);
  const debounced = useDebounced(searchDraft);
  useEffect(() => {
    if (debounced !== q) setParam({ q: debounced });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const list = useQuery(() => adminApi.wishlists.list({ page, pageSize: 25, search: q, sort }), [page, q, sort]);
  const [editing, setEditing] = useState<string | "new" | null>(null);

  const columns: Column<AdminWishlistSummary>[] = [
    {
      key: "name", header: "Template",
      render: w => (
        <div className="flex items-center gap-3 min-w-56">
          <Thumb src={w.wishlistHeroImage} alt="" />
          <span className="font-medium">{w.wishlistName}</span>
        </div>
      ),
    },
    { key: "days", header: "Days", className: "text-right", render: w => w.totalDays },
    { key: "people", header: "People", render: w => w.peopleType || "—" },
    { key: "price", header: "Price / person", className: "text-right", render: w => fmtUsd(w.basePricePerPerson) },
    { key: "saves", header: "Saves", className: "text-right", render: w => fmtNumber(w.totalGlobalSaveCount) },
    {
      key: "featured", header: "Featured",
      render: w => w.isFeatured ? (
        <div className="flex flex-col gap-0.5">
          <Pill tone="info">Featured</Pill>
          {w.featuredUntil && <span className="text-[11px] text-ink-muted whitespace-nowrap">until {fmtDate(w.featuredUntil)}</span>}
        </div>
      ) : <span className="text-ink-muted">—</span>,
    },
    { key: "dest", header: "Destinations", className: "text-right", render: w => fmtNumber(w.destinationCount) },
    { key: "forks", header: "Forks", className: "text-right", render: w => fmtNumber(w.forkCount) },
    { key: "links", header: "Partner links", className: "text-right", render: w => fmtNumber(w.partnerLinkCount) },
    { key: "created", header: "Created", render: w => <span className="whitespace-nowrap">{fmtDate(w.createdAt)}</span> },
  ];

  return (
    <AdminPage title="Wishlist templates" description="Curated itineraries travellers can save and copy."
      actions={<Btn variant="primary" onClick={() => setEditing("new")}><Plus className="w-4 h-4" /> New template</Btn>}>
      <Toolbar>
        <SearchBox value={searchDraft} onChange={setSearchDraft} placeholder="Search templates" />
        <Select label="Sort" value={sort} onChange={v => setParam({ sort: v === "newest" ? "" : v })}
          options={WISHLIST_SORTS.map(s => ({ value: s, label: `Sort: ${s === "saves" ? "Most saved" : s[0].toUpperCase() + s.slice(1)}` }))} />
      </Toolbar>
      {list.error ? <ErrorBlock message={list.error} onRetry={list.reload} /> : (
        <>
          <DataTable columns={columns} rows={list.data?.items} rowKey={w => w.wishlistId} loading={list.loading}
            onRowClick={w => setEditing(w.wishlistId)} empty={q ? "No templates match." : "No templates yet."} />
          {list.data && (
            <Pager page={page} totalPages={totalPages(list.data)} totalCount={list.data.totalCount}
              onChange={p => setParam({ page: p > 1 ? String(p) : "" })} />
          )}
        </>
      )}

      <Drawer wide open={editing !== null} onClose={() => setEditing(null)} title={editing === "new" ? "New template" : "Edit template"}>
        {editing === "new" && (
          <DetailsForm key="new" base={null} xmin={undefined}
            onSaved={d => { setEditing(d.wishlistId); list.reload(); }} onReload={() => undefined} />
        )}
        {editing && editing !== "new" && (
          <WishlistEditor key={editing} id={editing} onChanged={list.reload}
            onDeleted={() => { setEditing(null); list.reload(); }} />
        )}
      </Drawer>
    </AdminPage>
  );
}

// ─── Editor shell ─────────────────────────────────────────────────────────────

const TABS = [
  { id: "details", label: "Details" },
  { id: "destinations", label: "Destinations" },
  { id: "itinerary", label: "Itinerary" },
  { id: "featuring", label: "Featuring" },
  { id: "credits", label: "Creator credits" },
  { id: "audience", label: "Audience" },
] as const;
type TabId = (typeof TABS)[number]["id"];

function WishlistEditor({ id, onChanged, onDeleted }: { id: string; onChanged: () => void; onDeleted: () => void }) {
  const detail = useQuery(() => adminApi.wishlists.get(id), [id]);
  const [tab, setTab] = useState<TabId>("details");
  const [formKey, setFormKey] = useState(0);
  const del = useAction();

  if (detail.loading && !detail.data) return <LoadingBlock />;
  if (detail.error && !detail.data) return <ErrorBlock message={detail.error} onRetry={detail.reload} />;
  const d = detail.data;
  if (!d) return null;

  const reload = () => { detail.reload(); onChanged(); };

  const remove = async () => {
    const r = await del.run(() => adminApi.wishlists.remove(d.wishlistId), {
      success: "Template deleted",
      errors: { 409: "Users have copied this template or trips use it, so it can't be deleted.", 404: GONE },
    });
    if (r.ok) onDeleted();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-4">
        <Thumb src={d.wishlistHeroImage} alt="" size="w-20 h-16" />
        <div className="min-w-0 flex-1">
          <h3 className="text-xl font-light text-ink truncate">{d.wishlistName}</h3>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {d.isFeatured && <Pill tone="info">Featured{d.featuredUntil ? ` until ${fmtDate(d.featuredUntil)}` : ""}</Pill>}
            <Pill>{fmtNumber(d.totalGlobalSaveCount)} saves</Pill>
            <Pill>{fmtNumber(d.forkCount)} forks</Pill>
            <Pill>{fmtNumber(d.tripPostCount)} trips</Pill>
            <Pill>{fmtNumber(d.partnerLinkCount)} partner links</Pill>
          </div>
        </div>
        <ConfirmBtn size="sm" label="Delete" confirmLabel="Delete template" loading={del.busy} onConfirm={remove} />
      </div>

      <div className="flex gap-1 border-b border-line overflow-x-auto" role="tablist">
        {TABS.map(t => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}
            className={`px-3 py-2 text-sm whitespace-nowrap border-b-2 -mb-px transition-colors ${tab === t.id ? "border-ink text-ink" : "border-transparent text-ink-muted hover:text-ink"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {detail.error && <ErrorBlock message={detail.error} onRetry={detail.reload} />}

      {tab === "details" && (
        <DetailsForm key={`${d.wishlistId}-${formKey}`} base={d} xmin={d.xmin}
          onSaved={() => reload()}
          onReload={() => { detail.reload(); setFormKey(k => k + 1); }} />
      )}
      {tab === "destinations" && <DestinationsTab key={d.wishlistId} detail={d} onSaved={reload} />}
      {tab === "itinerary" && <ItineraryTab detail={d} onChanged={reload} />}
      {tab === "featuring" && <FeaturingTab key={`${d.wishlistId}-${d.featuredUntil ?? ""}`} detail={d} onChanged={reload} />}
      {tab === "credits" && <CreditsTab wishlistId={d.wishlistId} />}
      {tab === "audience" && <WishlistAudiencePanel wishlistId={d.wishlistId} />}
    </div>
  );
}

// ─── Details ──────────────────────────────────────────────────────────────────

interface WForm {
  wishlistName: string;
  wishlistDescription: string;
  shortStory: string;
  totalDays: number | null;
  peopleType: string;
  wishlistHeroImage: string;
  globalInclusions: string[];
  rawContentKeywords: string;
  psychologicalVibeTags: string[];
  defaultTravelersCount: number | null;
  basePricePerPerson: number | null;
  calculatedTotalCost: number | null;
  depositAmountRequired: number | null;
  accommodationInclusions: string;
  transitInclusions: string;
  activityInclusions: string;
  primaryPersonaTarget: string;
}

const toWForm = (d: AdminWishlistDetail | null): WForm => ({
  wishlistName: d?.wishlistName ?? "",
  wishlistDescription: d?.wishlistDescription ?? "",
  shortStory: d?.shortStory ?? "",
  totalDays: d ? d.totalDays : null,
  peopleType: d?.peopleType ?? "",
  wishlistHeroImage: d?.wishlistHeroImage ?? "",
  globalInclusions: d?.globalInclusions ?? [],
  rawContentKeywords: d?.rawContentKeywords ?? "",
  psychologicalVibeTags: d?.psychologicalVibeTags ?? [],
  defaultTravelersCount: d ? d.defaultTravelersCount : null,
  basePricePerPerson: d ? d.basePricePerPerson : null,
  calculatedTotalCost: d ? d.calculatedTotalCost : null,
  depositAmountRequired: d ? d.depositAmountRequired : null,
  accommodationInclusions: d?.accommodationInclusions ?? "",
  transitInclusions: d?.transitInclusions ?? "",
  activityInclusions: d?.activityInclusions ?? "",
  primaryPersonaTarget: d?.primaryPersonaTarget ?? "",
});

const toWInput = (f: WForm): WishlistInput => ({
  wishlistName: f.wishlistName.trim(),
  wishlistDescription: nullIfBlank(f.wishlistDescription),
  shortStory: nullIfBlank(f.shortStory),
  totalDays: numOrUndef(f.totalDays),
  peopleType: nullIfBlank(f.peopleType),
  wishlistHeroImage: nullIfBlank(f.wishlistHeroImage),
  globalInclusions: f.globalInclusions,
  rawContentKeywords: nullIfBlank(f.rawContentKeywords),
  psychologicalVibeTags: f.psychologicalVibeTags,
  defaultTravelersCount: numOrUndef(f.defaultTravelersCount),
  basePricePerPerson: numOrUndef(f.basePricePerPerson),
  calculatedTotalCost: numOrUndef(f.calculatedTotalCost),
  depositAmountRequired: numOrUndef(f.depositAmountRequired),
  accommodationInclusions: nullIfBlank(f.accommodationInclusions),
  transitInclusions: nullIfBlank(f.transitInclusions),
  activityInclusions: nullIfBlank(f.activityInclusions),
  primaryPersonaTarget: nullIfBlank(f.primaryPersonaTarget),
});

function DetailsForm({ base: initial, xmin, onSaved, onReload }: {
  base: AdminWishlistDetail | null; xmin: number | undefined;
  onSaved: (d: AdminWishlistDetail) => void; onReload: () => void;
}) {
  const [base, setBase] = useState(initial);
  const [form, setForm] = useState<WForm>(() => toWForm(initial));
  const [createDestinations, setCreateDestinations] = useState<{ id: string; name: string }[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [conflict, setConflict] = useState(false);
  const [busy, setBusy] = useState(false);
  const notify = useToast();
  const set = <K extends keyof WForm>(k: K, v: WForm[K]) => setForm(f => ({ ...f, [k]: v }));

  const baseInput = useMemo(() => (base ? toWInput(toWForm(base)) : null), [base]);
  const next = toWInput(form);
  const diff = baseInput ? changedFields(next, baseInput) : next;
  const dirty = Object.keys(diff).length > 0;

  const submit = async () => {
    const e: Record<string, string> = {};
    if (!form.wishlistName.trim()) e.wishlistName = "Name is required.";
    if (form.totalDays != null && form.totalDays < 1) e.totalDays = "At least 1 day.";
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    setConflict(false);
    try {
      if (!base) {
        const created = await adminApi.wishlists.create({ ...next, destinationIds: createDestinations.map(d => d.id) });
        notify("Template created");
        onSaved(created);
      } else {
        // Newest xmin from the parent wins, so our own edits in other tabs don't look like conflicts.
        const updated = await adminApi.wishlists.update(base.wishlistId, { ...diff, xmin: xmin ?? base.xmin });
        notify("Changes saved");
        setBase(updated);
        setForm(toWForm(updated));
        onSaved(updated);
      }
    } catch (err) {
      if (isApiError(err, 409) && base) setConflict(true);
      else notify(isApiError(err, 404) ? GONE : err instanceof Error && err.message ? err.message : "Something went wrong.", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      {conflict && (
        <div className="rounded-xl border border-sun-300 bg-sun-100 px-4 py-3 text-sm text-ink flex flex-wrap items-center justify-between gap-3">
          <span>{CONFLICT}</span>
          <Btn size="sm" onClick={onReload}>Reload</Btn>
        </div>
      )}

      <section className="grid sm:grid-cols-2 gap-4">
        <Field label="Name *" className="sm:col-span-2">
          <TextInput value={form.wishlistName} onChange={e => set("wishlistName", e.target.value)} placeholder="e.g. Ten days in Southern Italy" />
          <FieldError message={errors.wishlistName} />
        </Field>
        <Field label="Short story" className="sm:col-span-2">
          <TextArea rows={2} value={form.shortStory} onChange={e => set("shortStory", e.target.value)} />
        </Field>
        <Field label="Description" className="sm:col-span-2">
          <TextArea rows={5} value={form.wishlistDescription} onChange={e => set("wishlistDescription", e.target.value)} />
        </Field>
        <Field label="Hero image URL" className="sm:col-span-2">
          <div className="flex items-center gap-3">
            <Thumb src={nullIfBlank(form.wishlistHeroImage)} alt="Hero preview" size="w-16 h-12" />
            <TextInput value={form.wishlistHeroImage} onChange={e => set("wishlistHeroImage", e.target.value)} placeholder="https://…" />
          </div>
        </Field>
        <Field label="People type" hint="e.g. Couples, Friends, Family">
          <TextInput value={form.peopleType} onChange={e => set("peopleType", e.target.value)} />
        </Field>
        <Field label="Primary persona target">
          <TextInput value={form.primaryPersonaTarget} onChange={e => set("primaryPersonaTarget", e.target.value)} />
        </Field>
      </section>

      <section>
        <SectionTitle>Trip & pricing</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Field label="Total days">
            <NumberInput min={1} value={form.totalDays} onChange={v => set("totalDays", v)} />
            <FieldError message={errors.totalDays} />
          </Field>
          <Field label="Default travellers"><NumberInput min={1} value={form.defaultTravelersCount} onChange={v => set("defaultTravelersCount", v)} /></Field>
          <Field label="Base price / person (USD)"><NumberInput min={0} value={form.basePricePerPerson} onChange={v => set("basePricePerPerson", v)} /></Field>
          <Field label="Calculated total cost (USD)"><NumberInput min={0} value={form.calculatedTotalCost} onChange={v => set("calculatedTotalCost", v)} /></Field>
          <Field label="Deposit required (USD)"><NumberInput min={0} value={form.depositAmountRequired} onChange={v => set("depositAmountRequired", v)} /></Field>
        </div>
      </section>

      <section>
        <SectionTitle>Inclusions & tags</SectionTitle>
        <div className="grid gap-4">
          <Field label="Global inclusions"><ListInput value={form.globalInclusions} onChange={v => set("globalInclusions", v)} /></Field>
          <Field label="Accommodation inclusions"><TextArea rows={2} value={form.accommodationInclusions} onChange={e => set("accommodationInclusions", e.target.value)} /></Field>
          <Field label="Transit inclusions"><TextArea rows={2} value={form.transitInclusions} onChange={e => set("transitInclusions", e.target.value)} /></Field>
          <Field label="Activity inclusions"><TextArea rows={2} value={form.activityInclusions} onChange={e => set("activityInclusions", e.target.value)} /></Field>
          <Field label="Psychological vibe tags"><ListInput value={form.psychologicalVibeTags} onChange={v => set("psychologicalVibeTags", v)} /></Field>
          <Field label="Raw content keywords"><TextArea rows={2} value={form.rawContentKeywords} onChange={e => set("rawContentKeywords", e.target.value)} /></Field>
        </div>
      </section>

      {!base && (
        <section>
          <SectionTitle hint="Optional — you can also add them after creating.">Destinations</SectionTitle>
          <DestinationPicker value={createDestinations} onChange={setCreateDestinations} />
        </section>
      )}

      <div className="flex items-center justify-end gap-2 border-t border-line pt-4">
        {base && dirty && <span className="text-xs text-ink-muted">Unsaved changes</span>}
        <Btn variant="primary" loading={busy} disabled={!!base && !dirty} onClick={submit}>{base ? "Save details" : "Create template"}</Btn>
      </div>
    </div>
  );
}

// ─── Destinations ─────────────────────────────────────────────────────────────

function DestinationPicker({ value, onChange }: {
  value: { id: string; name: string }[]; onChange: (v: { id: string; name: string }[]) => void;
}) {
  const [search, setSearch] = useState("");
  const debounced = useDebounced(search.trim());
  const results = useQuery(
    () => (debounced ? adminApi.destinations.list({ search: debounced, pageSize: 10 }) : Promise.resolve(null)),
    [debounced],
  );
  const move = (i: number, dir: -1 | 1) => { const j = i + dir; if (j >= 0 && j < value.length) onChange(swap(value, i, j)); };

  return (
    <div className="space-y-3">
      {value.length === 0 ? (
        <p className="text-sm text-ink-muted py-4 text-center border border-dashed border-line rounded-xl">No destinations yet.</p>
      ) : (
        <ol className="divide-y divide-line border border-line rounded-xl">
          {value.map((d, i) => (
            <li key={d.id} className="flex items-center gap-2 px-3 py-2">
              <span className="w-6 text-xs text-ink-muted">{i + 1}.</span>
              <span className="flex-1 text-sm text-ink truncate">{d.name}</span>
              <Btn size="sm" variant="ghost" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp className="w-3.5 h-3.5" /></Btn>
              <Btn size="sm" variant="ghost" aria-label="Move down" disabled={i === value.length - 1} onClick={() => move(i, 1)}><ArrowDown className="w-3.5 h-3.5" /></Btn>
              <Btn size="sm" variant="ghost" aria-label={`Remove ${d.name}`} onClick={() => onChange(value.filter(x => x.id !== d.id))}><X className="w-3.5 h-3.5" /></Btn>
            </li>
          ))}
        </ol>
      )}
      <div className="rounded-xl border border-line p-3 space-y-2">
        <SearchBox value={search} onChange={setSearch} placeholder="Search destinations to add" />
        {results.error && <ErrorBlock message={results.error} onRetry={results.reload} />}
        {debounced && results.loading && <p className="text-xs text-ink-muted">Searching…</p>}
        {results.data && (
          results.data.items.length === 0 ? <p className="text-xs text-ink-muted">No destinations match.</p> : (
            <ul className="divide-y divide-line">
              {results.data.items.map(r => {
                const added = value.some(v => v.id === r.destinationId);
                return (
                  <li key={r.destinationId} className="flex items-center gap-3 py-2">
                    <Thumb src={r.heroThumbnailUrl} alt="" size="w-8 h-8" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-ink truncate">{r.destinationName}</p>
                      <p className="text-[11px] text-ink-muted">{r.countryName}</p>
                    </div>
                    <Btn size="sm" disabled={added} onClick={() => onChange([...value, { id: r.destinationId, name: r.destinationName }])}>
                      {added ? "Added" : <><Plus className="w-3.5 h-3.5" /> Add</>}
                    </Btn>
                  </li>
                );
              })}
            </ul>
          )
        )}
      </div>
    </div>
  );
}

function DestinationsTab({ detail, onSaved }: { detail: AdminWishlistDetail; onSaved: () => void }) {
  const initial = useMemo(() => detail.destinations.map(d => ({ id: d.destinationId, name: d.destinationName })), [detail.destinations]);
  const [value, setValue] = useState(initial);
  const save = useAction();
  const dirty = JSON.stringify(value.map(v => v.id)) !== JSON.stringify(initial.map(v => v.id));

  const submit = async () => {
    const r = await save.run(() => adminApi.wishlists.setDestinations(detail.wishlistId, value.map(v => v.id)), {
      success: "Destinations saved", errors: { 404: "This template or one of the destinations no longer exists." },
    });
    if (r.ok) onSaved();
  };

  return (
    <div className="space-y-4">
      <DestinationPicker value={value} onChange={setValue} />
      <div className="flex items-center justify-end gap-2 border-t border-line pt-4">
        {dirty && <Btn variant="ghost" onClick={() => setValue(initial)}>Discard</Btn>}
        <Btn variant="primary" loading={save.busy} disabled={!dirty} onClick={submit}>Save destinations</Btn>
      </div>
    </div>
  );
}

// ─── Itinerary ────────────────────────────────────────────────────────────────

type ItemEdit = { dayId: string; itemId: string | "new" };

function ItineraryTab({ detail, onChanged }: { detail: AdminWishlistDetail; onChanged: () => void }) {
  const cities = useQuery(() => adminApi.cities.list(), []);
  const [editingDay, setEditingDay] = useState<string | "new" | null>(null);
  const [editingItem, setEditingItem] = useState<ItemEdit | null>(null);
  const act = useAction();
  const wid = detail.wishlistId;

  const days = useMemo(
    () => [...detail.itineraryDays]
      .sort((a, b) => a.dayNumber - b.dayNumber)
      .map(d => ({ ...d, items: [...d.items].sort((a, b) => a.orderIndex - b.orderIndex) })),
    [detail.itineraryDays],
  );

  const sendOrder = async (nextDays: { dayId: string; itemIds: string[] }[]) => {
    const r = await act.run(() => adminApi.wishlists.itinerary.reorder(wid, {
      dayOrder: nextDays.map(d => d.dayId),
      itemOrder: nextDays.map(d => ({ dayId: d.dayId, itemIds: d.itemIds })),
    }), { success: "Order updated", errors: { 404: GONE } });
    if (r.ok) onChanged();
  };
  const currentOrder = () => days.map(d => ({ dayId: d.dayId, itemIds: d.items.map(i => i.itemId) }));

  const moveDay = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= days.length) return;
    void sendOrder(swap(currentOrder(), i, j));
  };
  const moveItem = (dayIndex: number, i: number, dir: -1 | 1) => {
    const order = currentOrder();
    const ids = order[dayIndex].itemIds;
    const j = i + dir;
    if (j < 0 || j >= ids.length) return;
    order[dayIndex] = { ...order[dayIndex], itemIds: swap(ids, i, j) };
    void sendOrder(order);
  };

  const removeDay = async (dayId: string) => {
    const r = await act.run(() => adminApi.wishlists.itinerary.removeDay(wid, dayId), { success: "Day removed", errors: { 404: "That day was already removed." } });
    onChanged();
    return r;
  };
  const removeItem = async (dayId: string, itemId: string) => {
    const r = await act.run(() => adminApi.wishlists.itinerary.removeItem(wid, dayId, itemId), { success: "Item removed", errors: { 404: "That item was already removed." } });
    onChanged();
    return r;
  };

  const cityList = cities.data ?? [];
  const nextDayNumber = days.length ? Math.max(...days.map(d => d.dayNumber)) + 1 : 1;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-ink-soft">{days.length} {days.length === 1 ? "day" : "days"} · {days.reduce((s, d) => s + d.items.length, 0)} items</p>
        {editingDay !== "new" && <Btn size="sm" onClick={() => setEditingDay("new")}><Plus className="w-3.5 h-3.5" /> Add day</Btn>}
      </div>
      {cities.error && <ErrorBlock message={`Cities: ${cities.error}`} onRetry={cities.reload} />}

      {editingDay === "new" && (
        <DayEditor wishlistId={wid} day={null} dayNumber={nextDayNumber} cities={cityList}
          onDone={saved => { setEditingDay(null); if (saved) onChanged(); }} />
      )}

      {days.length === 0 && editingDay !== "new" && (
        <p className="text-sm text-ink-muted py-8 text-center border border-dashed border-line rounded-xl">No itinerary days yet.</p>
      )}

      {days.map((day, di) => (
        <div key={day.dayId} className="rounded-xl border border-line">
          {editingDay === day.dayId ? (
            <div className="p-3">
              <DayEditor wishlistId={wid} day={day} dayNumber={day.dayNumber} cities={cityList}
                onDone={saved => { setEditingDay(null); if (saved) onChanged(); }} />
            </div>
          ) : (
            <div className="flex items-start gap-3 px-4 py-3 border-b border-line">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-ink"><span className="text-ink-muted mr-2">Day {day.dayNumber}</span>{day.dayTitle || <span className="text-ink-muted">Untitled</span>}</p>
                <p className="text-[11px] text-ink-muted mt-0.5">
                  Morning: {day.morningCityName ?? "—"} · Afternoon: {day.afternoonCityName ?? "—"} · Evening: {day.eveningCityName ?? "—"}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Btn size="sm" variant="ghost" aria-label="Move day up" disabled={di === 0 || act.busy} onClick={() => moveDay(di, -1)}><ArrowUp className="w-3.5 h-3.5" /></Btn>
                <Btn size="sm" variant="ghost" aria-label="Move day down" disabled={di === days.length - 1 || act.busy} onClick={() => moveDay(di, 1)}><ArrowDown className="w-3.5 h-3.5" /></Btn>
                <Btn size="sm" variant="ghost" aria-label="Edit day" onClick={() => setEditingDay(day.dayId)}><Pencil className="w-3.5 h-3.5" /></Btn>
                <ConfirmBtn size="sm" label="Delete" confirmLabel="Delete day" onConfirm={() => { void removeDay(day.dayId); }} />
              </div>
            </div>
          )}

          <ul className="divide-y divide-line">
            {day.items.map((item, ii) => (
              <li key={item.itemId} className="px-4 py-2.5">
                {editingItem?.itemId === item.itemId ? (
                  <ItemEditor wishlistId={wid} dayId={day.dayId} item={item} orderIndex={item.orderIndex}
                    onDone={saved => { setEditingItem(null); if (saved) onChanged(); }} />
                ) : (
                  <div className="flex items-center gap-3">
                    <Thumb src={item.imageUrl} alt="" size="w-10 h-10" />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-sm text-ink">{item.title}</span>
                        {item.timeOfDay && <Pill>{item.timeOfDay}</Pill>}
                        {item.isOptional && <Pill tone="warn">Optional</Pill>}
                        {item.isOptional && item.isSelectedByDefault && <Pill tone="good">Selected by default</Pill>}
                        {item.socialProofBadge && <Pill tone="info">{item.socialProofBadge}</Pill>}
                        {item.costModifier !== 0 && <span className="text-[11px] text-ink-muted">{item.costModifier > 0 ? "+" : ""}{fmtUsd(item.costModifier)}</span>}
                      </div>
                      {item.description && <p className="text-xs text-ink-muted line-clamp-1 mt-0.5">{item.description}</p>}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Btn size="sm" variant="ghost" aria-label="Move item up" disabled={ii === 0 || act.busy} onClick={() => moveItem(di, ii, -1)}><ArrowUp className="w-3.5 h-3.5" /></Btn>
                      <Btn size="sm" variant="ghost" aria-label="Move item down" disabled={ii === day.items.length - 1 || act.busy} onClick={() => moveItem(di, ii, 1)}><ArrowDown className="w-3.5 h-3.5" /></Btn>
                      <Btn size="sm" variant="ghost" aria-label="Edit item" onClick={() => setEditingItem({ dayId: day.dayId, itemId: item.itemId })}><Pencil className="w-3.5 h-3.5" /></Btn>
                      <ConfirmBtn size="sm" label={<X className="w-3.5 h-3.5" />} confirmLabel="Delete" onConfirm={() => { void removeItem(day.dayId, item.itemId); }} />
                    </div>
                  </div>
                )}
              </li>
            ))}
            {editingItem?.dayId === day.dayId && editingItem.itemId === "new" ? (
              <li className="px-4 py-2.5">
                <ItemEditor wishlistId={wid} dayId={day.dayId} item={null} orderIndex={day.items.length}
                  onDone={saved => { setEditingItem(null); if (saved) onChanged(); }} />
              </li>
            ) : (
              <li className="px-4 py-2">
                <Btn size="sm" variant="ghost" onClick={() => setEditingItem({ dayId: day.dayId, itemId: "new" })}><Plus className="w-3.5 h-3.5" /> Add item</Btn>
              </li>
            )}
          </ul>
        </div>
      ))}
    </div>
  );
}

function CitySelect({ label, value, onChange, cities }: {
  label: string; value: string; onChange: (v: string) => void; cities: AdminCity[];
}) {
  const sorted = useMemo(() => [...cities].sort((a, b) => a.cityName.localeCompare(b.cityName)), [cities]);
  return (
    <Field label={label}>
      <select value={value} onChange={e => onChange(e.target.value)} className={selectCls} aria-label={label}>
        <option value="">—</option>
        {sorted.map(c => <option key={c.cityId} value={c.cityId}>{c.cityName} · {c.countryName}</option>)}
      </select>
    </Field>
  );
}

function DayEditor({ wishlistId, day, dayNumber, cities, onDone }: {
  wishlistId: string; day: AdminItineraryDay | null; dayNumber: number; cities: AdminCity[]; onDone: (saved: boolean) => void;
}) {
  const [title, setTitle] = useState(day?.dayTitle ?? "");
  const [morning, setMorning] = useState(day?.morningCityId ?? "");
  const [afternoon, setAfternoon] = useState(day?.afternoonCityId ?? "");
  const [evening, setEvening] = useState(day?.eveningCityId ?? "");
  const save = useAction();

  // Keep a saved city selectable even if the city list hasn't loaded or lacks it.
  const options = useMemo(() => {
    const out = [...cities];
    const extra: [string | null, string | null][] = day
      ? [[day.morningCityId, day.morningCityName], [day.afternoonCityId, day.afternoonCityName], [day.eveningCityId, day.eveningCityName]]
      : [];
    for (const [id, name] of extra) {
      if (id && !out.some(c => c.cityId === id)) {
        out.push({ cityId: id, cityName: name ?? id, cityDescription: null, latitude: null, longitude: null, countryId: "", countryName: "", destinationCount: 0 });
      }
    }
    return out;
  }, [cities, day]);

  const submit = async () => {
    const body: ItineraryDayInput = {
      dayTitle: nullIfBlank(title),
      dayNumber,
      morningCityId: morning || null,
      afternoonCityId: afternoon || null,
      eveningCityId: evening || null,
      transitFromPreviousDayRouteId: day?.transitFromPreviousDayRouteId ?? null,
    };
    const r = await save.run(
      () => (day ? adminApi.wishlists.itinerary.updateDay(wishlistId, day.dayId, body) : adminApi.wishlists.itinerary.addDay(wishlistId, body)),
      { success: day ? "Day saved" : "Day added", errors: { 404: "This day or template no longer exists." } },
    );
    if (r.ok) onDone(true);
  };

  return (
    <div className="rounded-xl border border-line bg-cream-deep/40 p-4 space-y-3">
      <p className="text-xs text-ink-muted">Day {dayNumber}</p>
      <Field label="Title"><TextInput value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Arrival in Naples" /></Field>
      <div className="grid sm:grid-cols-3 gap-3">
        <CitySelect label="Morning city" value={morning} onChange={setMorning} cities={options} />
        <CitySelect label="Afternoon city" value={afternoon} onChange={setAfternoon} cities={options} />
        <CitySelect label="Evening city" value={evening} onChange={setEvening} cities={options} />
      </div>
      <div className="flex justify-end gap-2">
        <Btn size="sm" variant="ghost" onClick={() => onDone(false)}>Cancel</Btn>
        <Btn size="sm" variant="primary" loading={save.busy} onClick={submit}>{day ? "Save day" : "Add day"}</Btn>
      </div>
    </div>
  );
}

function ItemEditor({ wishlistId, dayId, item, orderIndex, onDone }: {
  wishlistId: string; dayId: string; item: AdminItineraryItem | null; orderIndex: number; onDone: (saved: boolean) => void;
}) {
  const [form, setForm] = useState({
    title: item?.title ?? "",
    description: item?.description ?? "",
    timeOfDay: item?.timeOfDay ?? "",
    imageUrl: item?.imageUrl ?? "",
    socialProofBadge: item?.socialProofBadge ?? "",
    costModifier: item ? item.costModifier : 0 as number | null,
    isOptional: item?.isOptional ?? false,
    isSelectedByDefault: item?.isSelectedByDefault ?? true,
  });
  const [error, setError] = useState("");
  const save = useAction();
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.title.trim()) { setError("Title is required."); return; }
    setError("");
    const body: ItineraryItemInput = {
      title: form.title.trim(),
      description: nullIfBlank(form.description),
      timeOfDay: nullIfBlank(form.timeOfDay),
      imageUrl: nullIfBlank(form.imageUrl),
      socialProofBadge: nullIfBlank(form.socialProofBadge),
      costModifier: form.costModifier ?? 0,
      isOptional: form.isOptional,
      isSelectedByDefault: form.isSelectedByDefault,
      orderIndex,
    };
    const r = await save.run(
      () => (item
        ? adminApi.wishlists.itinerary.updateItem(wishlistId, dayId, item.itemId, body)
        : adminApi.wishlists.itinerary.addItem(wishlistId, dayId, body)),
      { success: item ? "Item saved" : "Item added", errors: { 404: "This item or day no longer exists." } },
    );
    if (r.ok) onDone(true);
  };

  return (
    <div className="rounded-xl border border-line bg-cream-deep/40 p-4 space-y-3">
      <div className="grid sm:grid-cols-[1fr_10rem] gap-3">
        <Field label="Title *">
          <TextInput value={form.title} onChange={e => set("title", e.target.value)} placeholder="e.g. Sunset boat tour" />
          <FieldError message={error} />
        </Field>
        <Field label="Time of day">
          <TextInput list="admin-time-of-day" value={form.timeOfDay} onChange={e => set("timeOfDay", e.target.value)} placeholder="Morning" />
          <datalist id="admin-time-of-day">
            {["Morning", "Afternoon", "Evening", "Night", "All day"].map(t => <option key={t} value={t} />)}
          </datalist>
        </Field>
      </div>
      <Field label="Description"><TextArea rows={2} value={form.description} onChange={e => set("description", e.target.value)} /></Field>
      <Field label="Image URL">
        <div className="flex items-center gap-3">
          <Thumb src={nullIfBlank(form.imageUrl)} alt="Item preview" size="w-12 h-12" />
          <TextInput value={form.imageUrl} onChange={e => set("imageUrl", e.target.value)} placeholder="https://…" />
        </div>
      </Field>
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Social proof badge"><TextInput value={form.socialProofBadge} onChange={e => set("socialProofBadge", e.target.value)} placeholder="e.g. Most booked" /></Field>
        <Field label="Cost modifier (USD)" hint="Added to the per-person price."><NumberInput step="any" value={form.costModifier} onChange={v => set("costModifier", v)} /></Field>
      </div>
      <div className="flex flex-wrap gap-5">
        <Check label="Optional" checked={form.isOptional} onChange={v => set("isOptional", v)} />
        <Check label="Selected by default" checked={form.isSelectedByDefault} onChange={v => set("isSelectedByDefault", v)} />
      </div>
      <div className="flex justify-end gap-2">
        <Btn size="sm" variant="ghost" onClick={() => onDone(false)}>Cancel</Btn>
        <Btn size="sm" variant="primary" loading={save.busy} onClick={submit}>{item ? "Save item" : "Add item"}</Btn>
      </div>
    </div>
  );
}

// ─── Featuring ────────────────────────────────────────────────────────────────

function FeaturingTab({ detail, onChanged }: { detail: AdminWishlistDetail; onChanged: () => void }) {
  const [until, setUntil] = useState(toLocalInput(detail.featuredUntil));
  const act = useAction();
  const wid = detail.wishlistId;

  const feature = async () => {
    const r = await act.run(() => adminApi.wishlists.feature(wid, fromLocalInput(until)), {
      success: detail.isFeatured ? "Featuring updated" : "Template featured", errors: { 404: GONE },
    });
    if (r.ok) onChanged();
  };
  const unfeature = async () => {
    const r = await act.run(() => adminApi.wishlists.unfeature(wid), { success: "Template unfeatured", errors: { 404: GONE } });
    if (r.ok) onChanged();
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-line p-4 space-y-4">
        <div className="flex items-center gap-2">
          {detail.isFeatured ? <Pill tone="info">Featured</Pill> : <Pill>Not featured</Pill>}
          {detail.isFeatured && <span className="text-sm text-ink-soft">{detail.featuredUntil ? `until ${fmtDateTime(detail.featuredUntil)}` : "with no end date"}</span>}
        </div>
        <Field label="Featured until" hint="Leave empty to feature with no end date.">
          <div className="flex items-center gap-2">
            <TextInput type="datetime-local" value={until} onChange={e => setUntil(e.target.value)} className="max-w-64" />
            {until && <Btn size="sm" variant="ghost" onClick={() => setUntil("")}>Clear</Btn>}
          </div>
        </Field>
        <div className="flex flex-wrap gap-2">
          <Btn variant="primary" loading={act.busy} onClick={feature}>{detail.isFeatured ? "Update featuring" : "Feature"}</Btn>
          {detail.isFeatured && <ConfirmBtn label="Unfeature" confirmLabel="Unfeature" variant="outline" loading={act.busy} onConfirm={() => { void unfeature(); }} />}
        </div>
      </div>

      <section>
        <div className="flex items-center justify-between gap-3">
          <SectionTitle>Featured pool entries</SectionTitle>
          <Link to="/admin/featured" className="inline-flex items-center gap-1 text-sm text-ink-soft hover:text-ink underline-offset-4 hover:underline">
            Manage featured pool <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
        {detail.featuredPoolEntries.length === 0 ? (
          <p className="text-sm text-ink-muted py-4 text-center border border-dashed border-line rounded-xl">This template isn't in the featured pool.</p>
        ) : (
          <div className="space-y-3">
            {detail.featuredPoolEntries.map(p => (
              <div key={p.featuredWishlistPoolId} className="rounded-xl border border-line px-4 py-1">
                <DetailList rows={[
                  ["Pool", <Pill key="t">{enumName(p.poolType, POOL_TYPES)}</Pill>],
                  ["Paid amount", p.paidAmount == null ? "—" : fmtUsd(p.paidAmount)],
                  ["Daily impressions", `${fmtNumber(p.currentImpressionsToday)}${p.dailyImpressionLimit != null ? ` / ${fmtNumber(p.dailyImpressionLimit)}` : ""}`],
                  ["Random weight", p.randomSelectionWeight ?? "—"],
                  ["Last rotation", fmtDateTime(p.lastRotationDate)],
                ]} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// ─── Creator credits ──────────────────────────────────────────────────────────

function CreditsTab({ wishlistId }: { wishlistId: string }) {
  const list = useQuery(() => adminApi.wishlists.attributions.list(wishlistId), [wishlistId]);
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const del = useAction();

  const remove = async (a: AdminAttribution) => {
    await del.run(() => adminApi.wishlists.attributions.remove(wishlistId, a.wishlistCreatorAttributionId), {
      success: "Credit removed", errors: { 404: "That credit was already removed." },
    });
    list.reload();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-ink-soft">Credit the creators whose content inspired this template.</p>
        {editing !== "new" && <Btn size="sm" onClick={() => setEditing("new")}><Plus className="w-3.5 h-3.5" /> Add credit</Btn>}
      </div>
      {editing === "new" && (
        <AttributionEditor wishlistId={wishlistId} attribution={null} onDone={saved => { setEditing(null); if (saved) list.reload(); }} />
      )}
      {list.error ? <ErrorBlock message={list.error} onRetry={list.reload} /> : list.loading && !list.data ? <LoadingBlock /> : (
        (list.data ?? []).length === 0 ? (
          editing !== "new" && <p className="text-sm text-ink-muted py-8 text-center border border-dashed border-line rounded-xl">No creator credits yet.</p>
        ) : (
          <ul className="space-y-3">
            {(list.data ?? []).map(a => (
              <li key={a.wishlistCreatorAttributionId}>
                {editing === a.wishlistCreatorAttributionId ? (
                  <AttributionEditor wishlistId={wishlistId} attribution={a} onDone={saved => { setEditing(null); if (saved) list.reload(); }} />
                ) : (
                  <div className="rounded-xl border border-line p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-sm font-medium text-ink">{a.creatorDisplayName}</span>
                          {a.creatorHandle && <span className="text-xs text-ink-muted">@{a.creatorHandle.replace(/^@/, "")}</span>}
                          {a.creatorPlatformName && <Pill>{a.creatorPlatformName}</Pill>}
                          {a.creatorIsVerified && <Pill tone="good">Verified</Pill>}
                          {a.isActive ? <Pill tone="good">Active</Pill> : <Pill tone="bad">Inactive</Pill>}
                        </div>
                        <div className="mt-2 grid gap-0.5 text-xs text-ink-soft">
                          {a.originalContentUrl && <a href={a.originalContentUrl} target="_blank" rel="noreferrer" className="truncate hover:text-ink underline-offset-2 hover:underline">{a.originalContentUrl}</a>}
                          <span>Permission: {a.permissionType || "—"}{a.permissionGrantedAt ? ` · granted ${fmtDate(a.permissionGrantedAt)}` : ""}</span>
                          {a.permissionEvidenceUrl && <a href={a.permissionEvidenceUrl} target="_blank" rel="noreferrer" className="truncate hover:text-ink underline-offset-2 hover:underline">Evidence: {a.permissionEvidenceUrl}</a>}
                          {a.attributionNote && <span className="text-ink-muted">{a.attributionNote}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Btn size="sm" variant="ghost" aria-label="Edit credit" onClick={() => setEditing(a.wishlistCreatorAttributionId)}><Pencil className="w-3.5 h-3.5" /></Btn>
                        <ConfirmBtn size="sm" label="Remove" confirmLabel="Remove" loading={del.busy} onConfirm={() => { void remove(a); }} />
                      </div>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )
      )}
    </div>
  );
}

function CreatorPicker({ value, onChange }: {
  value: { id: string; name: string } | null; onChange: (v: { id: string; name: string } | null) => void;
}) {
  const [search, setSearch] = useState("");
  const debounced = useDebounced(search.trim());
  const results = useQuery(() => adminApi.creators.list({ search: debounced || undefined, pageSize: 10 }), [debounced]);

  if (value) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-lg border border-line bg-white px-3 py-2">
        <span className="text-sm text-ink">{value.name}</span>
        <Btn size="sm" variant="ghost" onClick={() => onChange(null)}>Change</Btn>
      </div>
    );
  }
  const label = (c: AdminCreator) => [c.handle ? `@${c.handle.replace(/^@/, "")}` : null, c.platformName].filter(Boolean).join(" · ");
  return (
    <div className="rounded-lg border border-line p-2 space-y-2 bg-white">
      <SearchBox value={search} onChange={setSearch} placeholder="Search creators" />
      {results.error && <ErrorBlock message={results.error} onRetry={results.reload} />}
      {results.loading && !results.data && <p className="text-xs text-ink-muted px-1">Loading…</p>}
      {results.data && (results.data.items.length === 0 ? (
        <p className="text-xs text-ink-muted px-1">No creators match. Add them on the <Link to="/admin/creators" className="underline">Creators</Link> page.</p>
      ) : (
        <ul className="max-h-56 overflow-y-auto divide-y divide-line">
          {results.data.items.map(c => (
            <li key={c.creatorId}>
              <button type="button" onClick={() => onChange({ id: c.creatorId, name: c.displayName })}
                className="w-full text-left px-2 py-2 hover:bg-cream-deep rounded-md flex items-center justify-between gap-2">
                <span className="text-sm text-ink truncate">{c.displayName}{c.isVerified && <span className="ml-1 text-[11px] text-mint-500">✓</span>}</span>
                <span className="text-[11px] text-ink-muted shrink-0">{label(c)}</span>
              </button>
            </li>
          ))}
        </ul>
      ))}
    </div>
  );
}

function AttributionEditor({ wishlistId, attribution: a, onDone }: {
  wishlistId: string; attribution: AdminAttribution | null; onDone: (saved: boolean) => void;
}) {
  const [creator, setCreator] = useState<{ id: string; name: string } | null>(a ? { id: a.creatorId, name: a.creatorDisplayName } : null);
  const [form, setForm] = useState({
    originalContentUrl: a?.originalContentUrl ?? "",
    permissionType: a?.permissionType ?? "",
    permissionGrantedAt: toLocalInput(a?.permissionGrantedAt),
    permissionEvidenceUrl: a?.permissionEvidenceUrl ?? "",
    attributionNote: a?.attributionNote ?? "",
    isActive: a?.isActive ?? true,
  });
  const [error, setError] = useState("");
  const save = useAction();
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!creator) { setError("Pick a creator."); return; }
    setError("");
    const body: AttributionInput = {
      creatorId: creator.id,
      originalContentUrl: nullIfBlank(form.originalContentUrl),
      permissionType: nullIfBlank(form.permissionType),
      permissionGrantedAt: fromLocalInput(form.permissionGrantedAt),
      permissionEvidenceUrl: nullIfBlank(form.permissionEvidenceUrl),
      attributionNote: nullIfBlank(form.attributionNote),
      isActive: form.isActive,
    };
    const r = await save.run(
      () => (a
        ? adminApi.wishlists.attributions.update(wishlistId, a.wishlistCreatorAttributionId, body)
        : adminApi.wishlists.attributions.add(wishlistId, body)),
      { success: a ? "Credit saved" : "Credit added", errors: { 404: "This credit, creator or template no longer exists.", 409: "This creator is already credited on this template." } },
    );
    if (r.ok) onDone(true);
  };

  return (
    <div className="rounded-xl border border-line bg-cream-deep/40 p-4 space-y-3">
      <div>
        <p className="text-xs font-medium text-ink-soft mb-1">Creator *</p>
        <CreatorPicker value={creator} onChange={setCreator} />
        <FieldError message={error} />
      </div>
      <Field label="Original content URL"><TextInput value={form.originalContentUrl} onChange={e => set("originalContentUrl", e.target.value)} placeholder="https://…" /></Field>
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Permission type">
          <TextInput list="admin-permission-types" value={form.permissionType} onChange={e => set("permissionType", e.target.value)} />
          <datalist id="admin-permission-types">
            {["Written", "Email", "DirectMessage", "Contract", "Verbal"].map(t => <option key={t} value={t} />)}
          </datalist>
        </Field>
        <Field label="Permission granted at">
          <TextInput type="datetime-local" value={form.permissionGrantedAt} onChange={e => set("permissionGrantedAt", e.target.value)} />
        </Field>
      </div>
      <Field label="Permission evidence URL"><TextInput value={form.permissionEvidenceUrl} onChange={e => set("permissionEvidenceUrl", e.target.value)} placeholder="https://…" /></Field>
      <Field label="Attribution note"><TextArea rows={2} value={form.attributionNote} onChange={e => set("attributionNote", e.target.value)} /></Field>
      <Check label="Active (shown publicly)" checked={form.isActive} onChange={v => set("isActive", v)} />
      <div className="flex justify-end gap-2">
        <Btn size="sm" variant="ghost" onClick={() => onDone(false)}>Cancel</Btn>
        <Btn size="sm" variant="primary" loading={save.busy} onClick={submit}>{a ? "Save credit" : "Add credit"}</Btn>
      </div>
    </div>
  );
}
