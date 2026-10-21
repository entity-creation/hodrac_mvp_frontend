import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowDown, ArrowUp, ImageOff, Pencil, Plus, X } from "lucide-react";
import {
  adminApi, enumName, totalPages, DESTINATION_SORTS, IMAGE_TYPES,
  type AdminCategory, type AdminCountry, type AdminDestinationDetail, type AdminDestinationImage,
  type AdminDestinationListItem, type AdminTag, type DescriptionJson, type DestinationImageInput,
  type DestinationInput,
} from "../api";
import {
  AdminPage, Btn, Check, ConfirmBtn, DataTable, Drawer, ErrorBlock, Field, ListInput, LoadingBlock, NumberInput, Pager, Pill, SearchBox, Select, TextArea, TextInput, Toolbar, type Column,
} from "../ui";
import { useAction, useDebounced, useQuery } from "../hooks";
import { fmtDateTime, fmtNumber, fmtUsd } from "../format";
import { FeatureForm } from "./FeaturedDestinationsPage";

// ─── Shared pickers (also used by WishlistsPage) ──────────────────────────────

export interface PickOption { value: string; label: string; hint?: string }

// Searchable multi-select shown as removable chips plus a filter input.
export function MultiSelect({ value, onChange, options, placeholder = "Search to add…", emptyText = "No matches" }: {
  value: string[]; onChange: (v: string[]) => void; options: PickOption[]; placeholder?: string; emptyText?: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const labelOf = (v: string) => options.find(o => o.value === v)?.label ?? v;
  const q = query.trim().toLowerCase();
  const matches = options
    .filter(o => !value.includes(o.value))
    .filter(o => !q || o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q))
    .slice(0, 50);

  return (
    <div ref={wrap} className="relative">
      <div className="rounded-lg border border-line bg-white p-2 flex flex-wrap gap-1.5 focus-within:border-ink">
        {value.map(v => (
          <span key={v} className="inline-flex items-center gap-1 rounded-full bg-cream-deep px-2 py-0.5 text-xs text-ink">
            {labelOf(v)}
            <button type="button" aria-label={`Remove ${labelOf(v)}`} onClick={() => onChange(value.filter(x => x !== v))}
              className="text-ink-muted hover:text-ink">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input value={query} placeholder={placeholder}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={e => {
            if (e.key === "Escape") setOpen(false);
            if (e.key === "Enter") { e.preventDefault(); if (matches[0]) { onChange([...value, matches[0].value]); setQuery(""); } }
          }}
          className="flex-1 min-w-32 text-sm text-ink bg-transparent outline-none px-1" />
      </div>
      {open && (
        <div className="absolute z-20 mt-1 w-full max-h-60 overflow-y-auto rounded-lg border border-line bg-white shadow-pop-lg">
          {matches.length === 0 ? (
            <p className="px-3 py-2 text-sm text-ink-muted">{emptyText}</p>
          ) : matches.map(o => (
            <button key={o.value} type="button"
              onMouseDown={e => e.preventDefault()}
              onClick={() => { onChange([...value, o.value]); setQuery(""); }}
              className="w-full text-left px-3 py-2 text-sm text-ink hover:bg-cream-deep flex items-center justify-between gap-2">
              <span className="truncate">{o.label}</span>
              {o.hint && <span className="text-[11px] text-ink-muted shrink-0">{o.hint}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function SectionTitle({ children, hint }: { children: ReactNode; hint?: ReactNode }) {
  return (
    <div className="mb-3 mt-2">
      <h3 className="text-[11px] uppercase tracking-[0.18em] text-ink-muted">{children}</h3>
      {hint && <p className="text-xs text-ink-muted mt-0.5">{hint}</p>}
    </div>
  );
}

export function FieldError({ message }: { message?: string }) {
  return message ? <span className="text-[11px] text-red-700">{message}</span> : null;
}

export function Thumb({ src, alt, size = "w-10 h-10" }: { src: string | null | undefined; alt: string; size?: string }) {
  return src ? (
    <img src={src} alt={alt} loading="lazy" className={`${size} rounded-lg object-cover border border-line shrink-0 bg-cream-deep`} />
  ) : (
    <span className={`${size} rounded-lg border border-line bg-cream-deep flex items-center justify-center shrink-0`}>
      <ImageOff className="w-4 h-4 text-ink-muted" />
    </span>
  );
}

// ─── Local helpers ────────────────────────────────────────────────────────────

const ALL = "__all";

function changedFields<T extends object>(next: T, prev: T): Partial<T> {
  const out: Partial<T> = {};
  for (const k of Object.keys(next) as (keyof T)[]) {
    if (JSON.stringify(next[k]) !== JSON.stringify(prev[k])) out[k] = next[k];
  }
  return out;
}

const nullIfBlank = (s: string) => (s.trim() ? s.trim() : null);
const numOrUndef = (n: number | null) => (n == null ? undefined : n);

const DESCRIPTION_FIELDS: { key: Exclude<keyof DescriptionJson, "nearbyComplements">; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "localPerspective", label: "Local perspective" },
  { key: "directions", label: "Directions" },
  { key: "whatToKnow", label: "What to know" },
  { key: "thingsToBeWaryOf", label: "Things to be wary of" },
  { key: "hiddenCost", label: "Hidden cost" },
  { key: "bestTimeToVisit", label: "Best time to visit" },
  { key: "crowdLevel", label: "Crowd level" },
  { key: "accessibility", label: "Accessibility" },
  { key: "idealDuration", label: "Ideal duration" },
];

type DescForm = Record<Exclude<keyof DescriptionJson, "nearbyComplements">, string> & { nearbyComplements: string[] };

interface DestForm {
  destinationName: string;
  countryId: string;
  cityIds: string[];
  latitude: number | null;
  longitude: number | null;
  timeZone: string;
  accessibilityType: string;
  averageCostPerDay: number | null;
  luxuryRating: number | null;
  safetyLevel: number | null;
  familyFriendlyScore: number | null;
  adventurePaceScore: number | null;
  aestheticTrendScore: number | null;
  tagKeys: string[];
  categoryKeys: string[];
  psychographicVibeTags: string[];
  commonAlternateSpellings: string[];
  description: DescForm;
}

function toForm(d: AdminDestinationDetail | null): DestForm {
  const desc = d?.description ?? {};
  const description = { nearbyComplements: desc.nearbyComplements ?? [] } as DescForm;
  for (const f of DESCRIPTION_FIELDS) description[f.key] = desc[f.key] ?? "";
  return {
    destinationName: d?.destinationName ?? "",
    countryId: d?.countryId ?? "",
    cityIds: d?.cities.map(c => c.id) ?? [],
    latitude: d?.latitude ?? null,
    longitude: d?.longitude ?? null,
    timeZone: d?.timeZone ?? "",
    accessibilityType: d?.accessibilityType ?? "",
    averageCostPerDay: d ? d.averageCostPerDay : null,
    luxuryRating: d ? d.luxuryRating : null,
    safetyLevel: d ? d.safetyLevel : null,
    familyFriendlyScore: d ? d.familyFriendlyScore : null,
    adventurePaceScore: d ? d.adventurePaceScore : null,
    aestheticTrendScore: d ? d.aestheticTrendScore : null,
    tagKeys: d?.tags.map(t => t.key ?? t.name) ?? [],
    categoryKeys: d?.categories.map(c => c.key ?? c.name) ?? [],
    psychographicVibeTags: d?.psychographicVibeTags ?? [],
    commonAlternateSpellings: d?.commonAlternateSpellings ?? [],
    description,
  };
}

function toInput(f: DestForm): DestinationInput {
  const description: DescriptionJson = { nearbyComplements: f.description.nearbyComplements };
  for (const d of DESCRIPTION_FIELDS) description[d.key] = nullIfBlank(f.description[d.key]);
  return {
    destinationName: f.destinationName.trim(),
    countryId: f.countryId,
    cityIds: f.cityIds,
    latitude: f.latitude,
    longitude: f.longitude,
    timeZone: nullIfBlank(f.timeZone),
    accessibilityType: nullIfBlank(f.accessibilityType),
    averageCostPerDay: numOrUndef(f.averageCostPerDay),
    luxuryRating: numOrUndef(f.luxuryRating),
    safetyLevel: numOrUndef(f.safetyLevel),
    familyFriendlyScore: numOrUndef(f.familyFriendlyScore),
    adventurePaceScore: numOrUndef(f.adventurePaceScore),
    aestheticTrendScore: numOrUndef(f.aestheticTrendScore),
    tagKeys: f.tagKeys,
    categoryKeys: f.categoryKeys,
    psychographicVibeTags: f.psychographicVibeTags,
    commonAlternateSpellings: f.commonAlternateSpellings,
    description,
  };
}

interface Lookups { countries: AdminCountry[]; tags: AdminTag[]; categories: AdminCategory[] }

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DestinationsPage() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const countryId = params.get("country") ?? "";
  const tag = params.get("tag") ?? "";
  const category = params.get("category") ?? "";
  const sort = params.get("sort") ?? "name";
  const page = Math.max(1, Number(params.get("page")) || 1);

  const setParam = (patch: Record<string, string>) => {
    setParams(prev => {
      const next = new URLSearchParams(prev);
      for (const [k, v] of Object.entries(patch)) { if (v) next.set(k, v); else next.delete(k); }
      if (!("page" in patch)) next.delete("page");
      return next;
    }, { replace: true });
  };

  const [searchDraft, setSearchDraft] = useState(q);
  const debounced = useDebounced(searchDraft);
  useEffect(() => {
    if (debounced !== q) setParam({ q: debounced });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const countries = useQuery(() => adminApi.countries.list(), []);
  const tags = useQuery(() => adminApi.tags.list(), []);
  const categories = useQuery(() => adminApi.categories.list(), []);
  const lookups: Lookups = {
    countries: countries.data ?? [],
    tags: tags.data ?? [],
    categories: categories.data ?? [],
  };

  const list = useQuery(
    () => adminApi.destinations.list({ page, pageSize: 25, search: q, countryId, tag, category, sort }),
    [page, q, countryId, tag, category, sort],
  );

  // null = closed; { id: null } = creating.
  const [editing, setEditing] = useState<{ id: string | null } | null>(null);

  const columns: Column<AdminDestinationListItem>[] = [
    {
      key: "name", header: "Destination",
      render: r => (
        <div className="flex items-center gap-3 min-w-52">
          <Thumb src={r.heroThumbnailUrl} alt="" />
          <span className="font-medium text-ink">{r.destinationName}</span>
        </div>
      ),
    },
    { key: "country", header: "Country", render: r => <span className="whitespace-nowrap">{r.countryName}</span> },
    { key: "featured", header: "Featured", render: r => <FeaturedPill item={r} /> },
    {
      key: "cities", header: "Cities",
      render: r => <span className="text-ink-soft">{r.cityNames.length ? r.cityNames.join(", ") : "—"}</span>,
    },
    { key: "cost", header: "Cost / day", className: "text-right", render: r => fmtUsd(r.averageCostPerDay) },
    { key: "safety", header: "Safety", className: "text-right", render: r => r.safetyLevel },
    { key: "luxury", header: "Luxury", className: "text-right", render: r => r.luxuryRating },
    { key: "images", header: "Images", className: "text-right", render: r => fmtNumber(r.imageCount) },
    { key: "wishlists", header: "Wishlists", className: "text-right", render: r => fmtNumber(r.wishlistCount) },
    { key: "links", header: "Partner links", className: "text-right", render: r => fmtNumber(r.partnerLinkCount) },
    { key: "hits", header: "Search hits", className: "text-right", render: r => fmtNumber(r.searchHitCount) },
  ];

  return (
    <AdminPage
      title="Destinations"
      description="Places travellers can discover, save and plan trips around."
      actions={<Btn variant="primary" onClick={() => setEditing({ id: null })}><Plus className="w-4 h-4" /> New destination</Btn>}
    >
      <Toolbar>
        <SearchBox value={searchDraft} onChange={setSearchDraft} placeholder="Search destinations" />
        <Select label="Country" value={countryId || ALL} onChange={v => setParam({ country: v === ALL ? "" : v })}
          options={[{ value: ALL, label: "All countries" }, ...lookups.countries.map(c => ({ value: c.countryId, label: `${c.countryFlagEmoji ?? ""} ${c.countryName}`.trim() }))]} />
        <Select label="Tag" value={tag || ALL} onChange={v => setParam({ tag: v === ALL ? "" : v })}
          options={[{ value: ALL, label: "All tags" }, ...lookups.tags.map(t => ({ value: t.key, label: t.tagName }))]} />
        <Select label="Category" value={category || ALL} onChange={v => setParam({ category: v === ALL ? "" : v })}
          options={[{ value: ALL, label: "All categories" }, ...lookups.categories.map(c => ({ value: c.key, label: c.categoryName }))]} />
        <Select label="Sort" value={sort} onChange={v => setParam({ sort: v === "name" ? "" : v })}
          options={DESTINATION_SORTS.map(s => ({ value: s, label: `Sort: ${s[0].toUpperCase()}${s.slice(1)}` }))} />
      </Toolbar>

      {list.error ? (
        <ErrorBlock message={list.error} onRetry={list.reload} />
      ) : (
        <>
          <DataTable columns={columns} rows={list.data?.items} rowKey={r => r.destinationId} loading={list.loading}
            onRowClick={r => setEditing({ id: r.destinationId })}
            empty={q || countryId || tag || category ? "No destinations match these filters." : "No destinations yet."} />
          {list.data && (
            <Pager page={page} totalPages={totalPages(list.data)} totalCount={list.data.totalCount}
              onChange={p => setParam({ page: p > 1 ? String(p) : "" })} />
          )}
        </>
      )}

      <Drawer wide open={editing !== null} onClose={() => setEditing(null)}
        title={editing?.id ? "Edit destination" : "New destination"}>
        {editing && (
          <DestinationEditor key={editing.id ?? "new"} id={editing.id} lookups={lookups}
            onCreated={id => { setEditing({ id }); list.reload(); }}
            onChanged={list.reload}
            onDeleted={() => { setEditing(null); list.reload(); }} />
        )}
      </Drawer>
    </AdminPage>
  );
}

// ─── Editor ───────────────────────────────────────────────────────────────────

function DestinationEditor({ id, lookups, onCreated, onChanged, onDeleted }: {
  id: string | null; lookups: Lookups;
  onCreated: (id: string) => void; onChanged: () => void; onDeleted: () => void;
}) {
  const detail = useQuery(() => (id ? adminApi.destinations.get(id) : Promise.resolve(null)), [id]);
  if (id && detail.loading && !detail.data) return <LoadingBlock />;
  if (id && detail.error) return <ErrorBlock message={detail.error} onRetry={detail.reload} />;
  return (
    <>
      {detail.data && (
        <FeaturingPanel
          destination={detail.data}
          onChanged={() => { detail.reload(); onChanged(); }}
        />
      )}
      <DestinationForm initial={detail.data} lookups={lookups}
        onCreated={onCreated} onChanged={onChanged} onDeleted={onDeleted} />
    </>
  );
}

// ─── Featuring ────────────────────────────────────────────────────────────────

function isExpired(until: string | null | undefined) {
  return !!until && new Date(until).getTime() <= Date.now();
}

function FeaturedPill({ item }: { item: { isFeatured?: boolean; featuredUntil?: string | null; featuredOrder?: number | null } }) {
  if (!item.isFeatured) return <span className="text-ink-muted">—</span>;
  const order = item.featuredOrder ? `#${item.featuredOrder}` : "";
  return isExpired(item.featuredUntil)
    ? <Pill tone="warn">{`Expired ${order}`.trim()}</Pill>
    : <Pill tone="good">{`Featured ${order}`.trim()}</Pill>;
}

function FeaturingPanel({ destination, onChanged }: { destination: AdminDestinationDetail; onChanged: () => void }) {
  const [editing, setEditing] = useState(false);
  const unfeature = useAction();
  const featured = !!destination.isFeatured;

  const remove = async () => {
    const res = await unfeature.run(() => adminApi.destinations.unfeature(destination.destinationId), {
      success: "No longer featured.",
    });
    if (res.ok) onChanged();
  };

  return (
    <div className="mb-6 rounded-xl border border-line bg-cream-deep/50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-ink flex items-center gap-2">
            Featured on the home page <FeaturedPill item={destination} />
          </p>
          <p className="text-xs text-ink-muted mt-0.5">
            {featured
              ? destination.featuredUntil
                ? `${isExpired(destination.featuredUntil) ? "Expired" : "Until"} ${fmtDateTime(destination.featuredUntil)}`
                : "No end date"
              : "Not featured."}{" "}
            <Link to="/admin/featured-destinations" className="underline underline-offset-4">Manage order</Link>
          </p>
        </div>
        {!editing && (
          <div className="flex gap-2">
            <Btn size="sm" variant={featured ? "outline" : "primary"} onClick={() => setEditing(true)}>
              {featured ? "Change dates" : "Feature"}
            </Btn>
            {featured && <ConfirmBtn size="sm" label="Unfeature" confirmLabel="Unfeature" loading={unfeature.busy} onConfirm={() => { void remove(); }} />}
          </div>
        )}
      </div>
      {editing && (
        <div className="mt-4 border-t border-line pt-4">
          <FeatureForm
            fixedDestination
            existing={featured ? destination : { destinationId: destination.destinationId, destinationName: destination.destinationName }}
            nextPosition={(destination.featuredOrder ?? 0) || 1}
            onDone={() => { setEditing(false); onChanged(); }}
          />
          <div className="mt-2"><Btn size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Btn></div>
        </div>
      )}
    </div>
  );
}

function DestinationForm({ initial, lookups, onCreated, onChanged, onDeleted }: {
  initial: AdminDestinationDetail | null; lookups: Lookups;
  onCreated: (id: string) => void; onChanged: () => void; onDeleted: () => void;
}) {
  const [base, setBase] = useState(initial);
  const [form, setForm] = useState<DestForm>(() => toForm(initial));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const save = useAction();
  const del = useAction();
  const set = <K extends keyof DestForm>(k: K, v: DestForm[K]) => setForm(f => ({ ...f, [k]: v }));
  const setDesc = <K extends keyof DescForm>(k: K, v: DescForm[K]) =>
    setForm(f => ({ ...f, description: { ...f.description, [k]: v } }));

  const cities = useQuery(
    () => (form.countryId ? adminApi.cities.list({ countryId: form.countryId }) : Promise.resolve([])),
    [form.countryId],
  );
  const cityOptions = useMemo<PickOption[]>(() => {
    const opts = (cities.data ?? []).map(c => ({ value: c.cityId, label: c.cityName }));
    for (const c of base?.cities ?? []) if (!opts.some(o => o.value === c.id)) opts.push({ value: c.id, label: c.name });
    return opts;
  }, [cities.data, base]);

  const tagOptions = lookups.tags.map(t => ({ value: t.key, label: t.tagName, hint: t.key }));
  const categoryOptions = lookups.categories.map(c => ({ value: c.key, label: c.categoryName, hint: c.key }));

  const baseInput = useMemo(() => (base ? toInput(toForm(base)) : null), [base]);
  const nextInput = toInput(form);
  const diff = baseInput ? changedFields(nextInput, baseInput) : nextInput;
  const dirty = Object.keys(diff).length > 0;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.destinationName.trim()) e.destinationName = "Name is required.";
    if (!form.countryId) e.countryId = "Pick a country.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    const errorsMap = { 404: "This destination no longer exists.", 409: "A destination with this name already exists." };
    if (!base) {
      const r = await save.run(() => adminApi.destinations.create(nextInput), { success: "Destination created", errors: errorsMap });
      if (r.ok) onCreated(r.result.destinationId);
      return;
    }
    if (!dirty) return;
    const r = await save.run(() => adminApi.destinations.update(base.destinationId, diff), { success: "Changes saved", errors: errorsMap });
    if (r.ok) {
      setBase(r.result);
      setForm(toForm(r.result));
      onChanged();
    }
  };

  const remove = async () => {
    if (!base) return;
    const r = await del.run(() => adminApi.destinations.remove(base.destinationId), {
      success: "Destination deleted",
      errors: { 409: "This destination is used by a wishlist or trip, so it can't be deleted.", 404: "This destination no longer exists." },
    });
    if (r.ok) onDeleted();
  };

  const countryOptions = [{ value: "", label: "Select a country" }, ...lookups.countries.map(c => ({ value: c.countryId, label: `${c.countryFlagEmoji ?? ""} ${c.countryName}`.trim() }))];

  return (
    <div className="space-y-8">
      {base && (
        <div className="flex flex-wrap gap-2 text-xs">
          <Pill>{fmtNumber(base.wishlistCount)} wishlists</Pill>
          <Pill>{fmtNumber(base.tripPostCount)} trips</Pill>
          <Pill>{fmtNumber(base.partnerLinkCount)} partner links</Pill>
          <Pill>{fmtNumber(base.searchHitCount)} search hits</Pill>
        </div>
      )}

      <section>
        <SectionTitle>Basics</SectionTitle>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Name *" className="sm:col-span-2">
            <TextInput value={form.destinationName} onChange={e => set("destinationName", e.target.value)} placeholder="e.g. Amalfi Coast" />
            <FieldError message={errors.destinationName} />
          </Field>
          <Field label="Country *">
            <select value={form.countryId} aria-label="Country"
              onChange={e => setForm(f => ({ ...f, countryId: e.target.value, cityIds: [] }))}
              className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:border-ink">
              {countryOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <FieldError message={errors.countryId} />
          </Field>
          <Field label="Time zone" hint="IANA name, e.g. Europe/Rome">
            <TextInput value={form.timeZone} onChange={e => set("timeZone", e.target.value)} />
          </Field>
          <div className="sm:col-span-2">
            <p className="text-xs font-medium text-ink-soft mb-1">Cities</p>
            {form.countryId ? (
              <MultiSelect value={form.cityIds} onChange={v => set("cityIds", v)} options={cityOptions}
                placeholder={cities.loading ? "Loading cities…" : "Search cities…"} emptyText="No cities for this country" />
            ) : (
              <p className="text-[11px] text-ink-muted">Pick a country first.</p>
            )}
          </div>
          <Field label="Latitude">
            <NumberInput step="any" value={form.latitude} onChange={v => set("latitude", v)} />
          </Field>
          <Field label="Longitude">
            <NumberInput step="any" value={form.longitude} onChange={v => set("longitude", v)} />
          </Field>
          <Field label="Accessibility type" className="sm:col-span-2">
            <TextInput value={form.accessibilityType} onChange={e => set("accessibilityType", e.target.value)} />
          </Field>
        </div>
        {base && (base.languages.length > 0 || base.currencies.length > 0) && (
          <div className="mt-4 grid sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs font-medium text-ink-soft mb-1">Languages</p>
              <div className="flex flex-wrap gap-1">{base.languages.length ? base.languages.map(l => <Pill key={l.id}>{l.name}</Pill>) : <span className="text-ink-muted">—</span>}</div>
            </div>
            <div>
              <p className="text-xs font-medium text-ink-soft mb-1">Currencies</p>
              <div className="flex flex-wrap gap-1">{base.currencies.length ? base.currencies.map(c => <Pill key={c.id}>{c.name}</Pill>) : <span className="text-ink-muted">—</span>}</div>
            </div>
            <p className="sm:col-span-2 text-[11px] text-ink-muted">Languages and currencies are read-only here and stay unchanged when you save.</p>
          </div>
        )}
      </section>

      <section>
        <SectionTitle hint="Safety: 1 is the safest.">Scores</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Field label="Avg. cost per day (USD)"><NumberInput min={0} value={form.averageCostPerDay} onChange={v => set("averageCostPerDay", v)} /></Field>
          <Field label="Luxury rating"><NumberInput value={form.luxuryRating} onChange={v => set("luxuryRating", v)} /></Field>
          <Field label="Safety level" hint="1 = safest"><NumberInput min={1} value={form.safetyLevel} onChange={v => set("safetyLevel", v)} /></Field>
          <Field label="Family friendly"><NumberInput value={form.familyFriendlyScore} onChange={v => set("familyFriendlyScore", v)} /></Field>
          <Field label="Adventure pace"><NumberInput value={form.adventurePaceScore} onChange={v => set("adventurePaceScore", v)} /></Field>
          <Field label="Aesthetic trend"><NumberInput value={form.aestheticTrendScore} onChange={v => set("aestheticTrendScore", v)} /></Field>
        </div>
      </section>

      <section>
        <SectionTitle>Taxonomy</SectionTitle>
        <div className="grid gap-4">
          <div>
            <p className="text-xs font-medium text-ink-soft mb-1">Tags</p>
            <MultiSelect value={form.tagKeys} onChange={v => set("tagKeys", v)} options={tagOptions} placeholder="Search tags…" />
          </div>
          <div>
            <p className="text-xs font-medium text-ink-soft mb-1">Categories</p>
            <MultiSelect value={form.categoryKeys} onChange={v => set("categoryKeys", v)} options={categoryOptions} placeholder="Search categories…" />
          </div>
          <Field label="Psychographic vibe tags">
            <ListInput value={form.psychographicVibeTags} onChange={v => set("psychographicVibeTags", v)} />
          </Field>
          <Field label="Common alternate spellings">
            <ListInput value={form.commonAlternateSpellings} onChange={v => set("commonAlternateSpellings", v)} />
          </Field>
        </div>
      </section>

      <section>
        <SectionTitle>Description</SectionTitle>
        <div className="grid gap-4">
          {DESCRIPTION_FIELDS.map(f => (
            <Field key={f.key} label={f.label}>
              <TextArea value={form.description[f.key]} onChange={e => setDesc(f.key, e.target.value)} />
            </Field>
          ))}
          <Field label="Nearby complements">
            <ListInput value={form.description.nearbyComplements} onChange={v => setDesc("nearbyComplements", v)} />
          </Field>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4">
        <div>{base && <ConfirmBtn label="Delete destination" confirmLabel="Delete" loading={del.busy} onConfirm={remove} />}</div>
        <div className="flex items-center gap-2">
          {base && dirty && <span className="text-xs text-ink-muted">Unsaved changes</span>}
          <Btn variant="primary" loading={save.busy} disabled={!!base && !dirty} onClick={submit}>
            {base ? "Save changes" : "Create destination"}
          </Btn>
        </div>
      </div>

      {base ? (
        <ImagesManager destinationId={base.destinationId} onChanged={onChanged} />
      ) : (
        <p className="text-sm text-ink-muted">You can add images once the destination is created.</p>
      )}
    </div>
  );
}

// ─── Images ───────────────────────────────────────────────────────────────────

interface ImageForm {
  imageUrl: string;
  thumbnailUrl: string;
  caption: string;
  imageType: string;
  shotContext: string;
  isAiGenerated: boolean;
}

const toImageForm = (img: AdminDestinationImage | null): ImageForm => ({
  imageUrl: img?.imageUrl ?? "",
  thumbnailUrl: img?.thumbnailUrl ?? "",
  caption: img?.caption ?? "",
  imageType: img ? enumName(img.imageType, IMAGE_TYPES) : "Gallery",
  shotContext: img?.shotContext ?? "",
  isAiGenerated: img?.isAiGenerated ?? false,
});

const imageInput = (f: ImageForm): DestinationImageInput => ({
  imageUrl: f.imageUrl.trim(),
  thumbnailUrl: nullIfBlank(f.thumbnailUrl),
  caption: nullIfBlank(f.caption),
  imageType: f.imageType,
  shotContext: nullIfBlank(f.shotContext),
  isAiGenerated: f.isAiGenerated,
});

function ImagesManager({ destinationId, onChanged }: { destinationId: string; onChanged: () => void }) {
  const images = useQuery(() => adminApi.destinations.images.list(destinationId), [destinationId]);
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const act = useAction();
  const sorted = useMemo(() => [...(images.data ?? [])].sort((a, b) => a.displayOrder - b.displayOrder), [images.data]);

  const after = () => { images.reload(); onChanged(); };

  const move = async (index: number, dir: -1 | 1) => {
    const ids = sorted.map(i => i.destinationImageId);
    const j = index + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[index], ids[j]] = [ids[j], ids[index]];
    const r = await act.run(() => adminApi.destinations.images.reorder(destinationId, ids), { success: "Order updated" });
    if (r.ok) after(); else images.reload();
  };

  const remove = async (imageId: string) => {
    const r = await act.run(() => adminApi.destinations.images.remove(destinationId, imageId), {
      success: "Image removed", errors: { 404: "That image was already removed." },
    });
    after();
    return r;
  };

  return (
    <section className="border-t border-line pt-6">
      <div className="flex items-center justify-between gap-3 mb-3">
        <SectionTitle hint="Adding a Hero image demotes the previous Hero.">Images</SectionTitle>
        {editing !== "new" && <Btn size="sm" onClick={() => setEditing("new")}><Plus className="w-3.5 h-3.5" /> Add image</Btn>}
      </div>

      {editing === "new" && (
        <ImageEditor destinationId={destinationId} image={null} onDone={saved => { setEditing(null); if (saved) after(); }} />
      )}

      {images.error ? (
        <ErrorBlock message={images.error} onRetry={images.reload} />
      ) : images.loading && !images.data ? (
        <LoadingBlock />
      ) : sorted.length === 0 ? (
        <p className="text-sm text-ink-muted py-6 text-center border border-dashed border-line rounded-xl">No images yet.</p>
      ) : (
        <ul className="divide-y divide-line border border-line rounded-xl">
          {sorted.map((img, i) => (
            <li key={img.destinationImageId} className="p-3">
              {editing === img.destinationImageId ? (
                <ImageEditor destinationId={destinationId} image={img} onDone={saved => { setEditing(null); if (saved) after(); }} />
              ) : (
                <div className="flex items-center gap-3">
                  <Thumb src={img.thumbnailUrl || img.imageUrl} alt={img.caption ?? ""} size="w-16 h-12" />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Pill tone={enumName(img.imageType, IMAGE_TYPES) === "Hero" ? "info" : "neutral"}>{enumName(img.imageType, IMAGE_TYPES).replace("_", " ")}</Pill>
                      {img.isAiGenerated && <Pill tone="warn">AI-generated</Pill>}
                      <span className="text-[11px] text-ink-muted">#{i + 1}</span>
                    </div>
                    <p className="text-sm text-ink truncate mt-0.5">{img.caption || <span className="text-ink-muted">No caption</span>}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Btn size="sm" variant="ghost" aria-label="Move up" disabled={i === 0 || act.busy} onClick={() => move(i, -1)}><ArrowUp className="w-3.5 h-3.5" /></Btn>
                    <Btn size="sm" variant="ghost" aria-label="Move down" disabled={i === sorted.length - 1 || act.busy} onClick={() => move(i, 1)}><ArrowDown className="w-3.5 h-3.5" /></Btn>
                    <Btn size="sm" variant="ghost" aria-label="Edit image" onClick={() => setEditing(img.destinationImageId)}><Pencil className="w-3.5 h-3.5" /></Btn>
                    <ConfirmBtn size="sm" label="Delete" confirmLabel="Delete" onConfirm={() => { void remove(img.destinationImageId); }} />
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ImageEditor({ destinationId, image, onDone }: {
  destinationId: string; image: AdminDestinationImage | null; onDone: (saved: boolean) => void;
}) {
  const [form, setForm] = useState<ImageForm>(() => toImageForm(image));
  const [error, setError] = useState("");
  const save = useAction();
  const set = <K extends keyof ImageForm>(k: K, v: ImageForm[K]) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.imageUrl.trim()) { setError("Image URL is required."); return; }
    setError("");
    const body = imageInput(form);
    const r = await save.run(
      () => (image
        ? adminApi.destinations.images.update(destinationId, image.destinationImageId, body)
        : adminApi.destinations.images.add(destinationId, body)),
      { success: image ? "Image updated" : "Image added", errors: { 404: "That image or destination no longer exists." } },
    );
    if (r.ok) onDone(true);
  };

  const preview = form.thumbnailUrl.trim() || form.imageUrl.trim();
  return (
    <div className="rounded-xl border border-line bg-cream-deep/40 p-4 mb-3">
      <div className="flex gap-4">
        <Thumb src={preview || null} alt="Preview" size="w-24 h-20" />
        <div className="flex-1 grid sm:grid-cols-2 gap-3">
          <Field label="Image URL *" className="sm:col-span-2">
            <TextInput value={form.imageUrl} onChange={e => set("imageUrl", e.target.value)} placeholder="https://…" />
            <FieldError message={error} />
          </Field>
          <Field label="Thumbnail URL" className="sm:col-span-2">
            <TextInput value={form.thumbnailUrl} onChange={e => set("thumbnailUrl", e.target.value)} placeholder="https://…" />
          </Field>
          <Field label="Type">
            <select value={form.imageType} onChange={e => set("imageType", e.target.value)} aria-label="Image type"
              className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:border-ink">
              {IMAGE_TYPES.map(t => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
            </select>
          </Field>
          <Field label="Shot context">
            <TextInput value={form.shotContext} onChange={e => set("shotContext", e.target.value)} />
          </Field>
          <Field label="Caption" className="sm:col-span-2">
            <TextInput value={form.caption} onChange={e => set("caption", e.target.value)} />
          </Field>
          <div className="sm:col-span-2">
            <Check label="AI-generated" checked={form.isAiGenerated} onChange={v => set("isAiGenerated", v)} />
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-3">
        <Btn size="sm" variant="ghost" onClick={() => onDone(false)}>Cancel</Btn>
        <Btn size="sm" variant="primary" loading={save.busy} onClick={submit}>{image ? "Save image" : "Add image"}</Btn>
      </div>
    </div>
  );
}
